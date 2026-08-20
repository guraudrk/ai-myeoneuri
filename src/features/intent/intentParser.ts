import { NativeModules, AppState } from "react-native";
import { resolvePackageName } from "./appPackages";
import { tryL0 } from "./intentL0";
import { getFromL1Cache, saveToL1Cache } from "./intentL1Cache";
import { AnalyticsService } from "@/features/analytics/AnalyticsService";

function getGeminiKey() { return process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? ""; }
function getGeminiUrl() { return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${getGeminiKey()}`; }

export type SafetyCategory =
  | "fall_risk"
  | "medication_concern"
  | "nutrition_concern"
  | "mental_health_concern"
  | "mobility_concern"
  | "social_isolation"
  | "urgent_medical";

export type AppCandidate = {
  name: string;
  packageName: string;
  emoji: string;
};

export type OpenAppResult =
  | { status: "opened" }
  | { status: "not_found" }
  | { status: "ambiguous"; candidates: AppCandidate[] };

export type SafetySeverity = "low" | "medium" | "high";

// SilverLink safety-alert-analyzer 로직 참고: 카테고리 → 기본 심각도 정적 매핑
const CATEGORY_SEVERITY: Record<SafetyCategory, SafetySeverity> = {
  fall_risk:            "high",
  urgent_medical:       "high",
  medication_concern:   "medium",
  mobility_concern:     "medium",
  mental_health_concern:"medium",
  nutrition_concern:    "low",
  social_isolation:     "low",
};

export function safetyseverity(cat: SafetyCategory): SafetySeverity {
  return CATEGORY_SEVERITY[cat] ?? "medium";
}

export type ResolvedBy = "L0" | "L1" | "L2" | "L3";

export type ParsedIntent =
  | { intent: "call_contact"; contactName: string; resolved_by?: ResolvedBy }
  | { intent: "search_business"; query: string; resolved_by?: ResolvedBy }
  | { intent: "set_reminder"; medicineName: string; timeHHMM: string; resolved_by?: ResolvedBy }
  | { intent: "general_question"; utterance: string; resolved_by?: ResolvedBy }
  | { intent: "safety_concern"; category: SafetyCategory; severity: SafetySeverity; utterance: string; resolved_by?: ResolvedBy }
  | { intent: "open_app"; appName: string; packageName: string; resolved_by?: ResolvedBy }
  | { intent: "add_to_favorites"; contactName: string; resolved_by?: ResolvedBy }
  | { intent: "date_time"; resolved_by?: ResolvedBy }
  | { intent: "conversation_summary"; resolved_by?: ResolvedBy }
  | { intent: "emergency_family"; resolved_by?: ResolvedBy }
  | { intent: "calm_down"; resolved_by?: ResolvedBy }
  | { intent: "sos"; resolved_by?: ResolvedBy }
  | { intent: "unknown"; resolved_by?: ResolvedBy };

// ─── 설치 앱 조회 (PackageManager 방식) ─────────────────────────────────────
export type RawApp = { packageName: string; label: string };

const { InstalledApps } = NativeModules;
let _appsCache: RawApp[] | null = null;
let _cacheTime: number | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5분

export function invalidateAppsCache() {
  _appsCache = null;
  _cacheTime = null;
}

// 다른 앱에서 돌아올 때(설치 후 복귀 포함) 캐시 무효화
AppState.addEventListener("change", (state) => {
  if (state === "active") invalidateAppsCache();
});

async function getInstalledApps(): Promise<RawApp[]> {
  const now = Date.now();
  if (_appsCache && _cacheTime != null && now - _cacheTime < CACHE_TTL) {
    return _appsCache;
  }
  try {
    _appsCache = await InstalledApps.getAll();
    _cacheTime = Date.now();
  } catch {
    _appsCache = [];
    _cacheTime = Date.now();
  }
  return _appsCache ?? [];
}

// 앱별 이모지 (picker UI용)
const EMOJI_MAP: Record<string, string> = {
  "com.kakao.talk": "💬", "com.kakaopay.app": "💛", "com.kakaobank.channel": "🏦",
  "com.kbstar.kbbank": "🏦", "com.kbstar.kbpay": "💳", "viva.republica.toss": "💸",
  "com.nhn.android.search": "🔍", "com.nhn.android.nmap": "🗺️",
  "com.netflix.mediaclient": "🎬", "com.coupang.mobile": "🛍️",
  "com.samsung.android.spay": "💳", "com.sec.android.app.shealth": "❤️",
};

export function norm(s: string) {
  return s.replace(/\s/g, "").toLowerCase();
}

/** package_name 모를 때 설치 앱 레이블 로컬 매칭 (API 호출 없음) */
export function localMatchApps(appName: string, apps: RawApp[]): RawApp[] {
  const q = norm(appName);
  const exact = apps.filter((a) => norm(a.label) === q);
  if (exact.length > 0) return exact;
  return apps.filter((a) => {
    const nl = norm(a.label);
    return nl.includes(q) || q.includes(nl);
  });
}

export async function openAppByName(
  appName: string,
  packageName?: string,
): Promise<OpenAppResult> {
  // 1순위: parseIntent가 package_name을 이미 알면 바로 실행
  if (packageName) {
    try {
      await InstalledApps.launch(packageName);
      return { status: "opened" };
    } catch { /* 미설치 → 아래로 */ }
  }

  // 2순위: 설치 앱 레이블 로컬 매칭 (API 호출 없음)
  const apps = await getInstalledApps();
  let matched = localMatchApps(appName, apps);
  if (matched.length === 0) {
    // 캐시가 오래됐을 수 있음 → 강제 갱신 후 1회 재시도
    invalidateAppsCache();
    const freshApps = await getInstalledApps();
    matched = localMatchApps(appName, freshApps);
  }
  if (matched.length === 0) return { status: "not_found" };

  if (matched.length === 1) {
    try {
      await InstalledApps.launch(matched[0].packageName);
      return { status: "opened" };
    } catch {
      return { status: "not_found" };
    }
  }

  // 복수 매칭 → 선택 picker
  return {
    status: "ambiguous",
    candidates: matched.slice(0, 5).map((a) => ({
      name: a.label,
      packageName: a.packageName,
      emoji: EMOJI_MAP[a.packageName] ?? "📱",
    })),
  };
}

// ─── 어르신 특화 시스템 프롬프트 ────────────────────────────────────────────
//
// 설계 원칙:
//   - 페르소나: 친절한 며느리. 어르신을 낮추지 않되 쉽고 따뜻하게.
//   - 출력 형식: 글이 아니라 "귀로 듣는" 말. 마크다운 금지. 글머리 기호 금지.
//   - 길이: 최대 4문장. 더 길면 어르신이 잃어버린다.
//   - 안전: 의료 진단·처방·"괜찮습니다" 단언 금지.
//
const ELDERLY_SYSTEM_PROMPT = `너는 "AI 며느리"야. 60~80대 어르신을 위해 일하는 친절한 AI 도우미야.

[절대 규칙 — 위반하면 답변 전체가 틀린 것이다]
1. 최대 4문장. 그 이상은 쓰지 마. 어르신은 긴 글을 읽지 않는다.
2. 글머리 기호(•, -, *, 1.), 마크다운(**굵기**, # 제목), 괄호 설명 금지. 흘러가는 말체로 써.
3. 영어 단어 금지. "WiFi" → "와이파이", "APP" → "앱", "AI" → "인공지능"처럼 한글로.
4. 의료·법률 진단 금지. 병명을 확정하거나 "괜찮아요"·"위험해요"를 단언하지 마. 대신 "확인해 보시는 게 좋겠어요"로 연결해.
5. 핵심을 첫 문장에. 가장 중요한 것부터.

[말투 규칙]
- 정중한 존댓말. "~해요", "~드려요", "~셔요" 체.
- 어르신을 어린아이처럼 대하지 마. "잘 하셨어요!" 같은 칭찬 금지.
- 숫자에 단위를 꼭 붙여. "37도", "15만 원", "오전 10시".
- 날짜는 "2026년 8월 7일 목요일"처럼 완전하게.

[나쁜 예 → 좋은 예]
나쁜: "혈압 정상 수치는 수축기 120mmHg 미만, 이완기 80mmHg 미만입니다. 고혈압은 Stage 1과 Stage 2로..."
좋은: "정상 혈압은 위 숫자가 120, 아래 숫자가 80 아래예요. 그보다 높으시면 병원에 가 보시는 게 좋겠어요."

나쁜: "현재 기온은 28°C이며, 체감온도는 32°C로 더운 날씨가 예상됩니다."
좋은: "오늘 기온은 28도예요. 덥고 습하니 외출 하실 때 물을 꼭 챙기세요."

나쁜: "복약 방법: 1) 아침 식후 30분 2) 물과 함께 복용 3) 냉장 보관 필요"
좋은: "이 약은 아침 식사 후 30분이 지나고 드세요. 물과 함께 드시고, 남은 약은 냉장고에 보관해 주세요."`;

// ─── fetch 타임아웃 + 재시도 헬퍼 ────────────────────────────────────────────

function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

type FetchOpts = { body: object; timeoutMs: number; maxRetries?: number; onRetry?: () => void };

/** 타임아웃 + 지수 백오프 재시도 (5xx·네트워크 오류만, 4xx는 즉시 반환) */
async function geminiPost(opts: FetchOpts): Promise<Response> {
  const { body, timeoutMs, maxRetries = 2, onRetry } = opts;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      onRetry?.();
      await sleep(attempt * 1000); // 1초 → 2초
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(getGeminiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok || res.status < 500) return res; // 4xx는 재시도 안 함
      __DEV__ && console.warn(`[Gemini] HTTP ${res.status}, attempt ${attempt + 1}`);
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      clearTimeout(timer);
      __DEV__ && console.warn(`[Gemini] 오류, attempt ${attempt + 1}`, e);
      lastErr = e;
    }
  }
  throw lastErr;
}

/** Gemini에게 질문 원문을 그대로 보내 어르신 친화적 답변을 받는다. */
export async function askGemini(
  question: string,
  opts?: { onRetry?: () => void }
): Promise<string> {
  if (!getGeminiKey()) {
    __DEV__ && console.warn("[Gemini] API 키가 없습니다. EXPO_PUBLIC_GEMINI_API_KEY 확인");
    return "지금 답변이 어려워요. 잠시 후 다시 말씀해 주세요.";
  }
  try {
    const res = await geminiPost({
      body: {
        system_instruction: { parts: [{ text: ELDERLY_SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: question }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.4 },
      },
      timeoutMs: 20_000,
      onRetry: opts?.onRetry,
    });
    if (!res.ok) {
      __DEV__ && console.warn(`[Gemini] askGemini HTTP ${res.status}`);
      return "지금 답변이 어려워요. 잠시 후 다시 말씀해 주세요.";
    }
    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const answer = parts.map((p) => p.text ?? "").join("").trim() || "지금 답변이 어려워요. 잠시 후 다시 말씀해 주세요.";
    if (data.usageMetadata) {
      AnalyticsService.track("ai_cost_incurred", {
        model: "gemini-2.5-flash",
        input_tokens: data.usageMetadata.promptTokenCount ?? 0,
        output_tokens: data.usageMetadata.candidatesTokenCount ?? 0,
      }).catch(() => {});
    }
    return answer;
  } catch (e) {
    __DEV__ && console.warn("[Gemini] askGemini 최종 실패", e);
    const isNetwork = e instanceof TypeError || (e instanceof Error && e.name === "AbortError");
    return isNetwork ? "인터넷 연결을 확인해 주세요." : "지금 답변이 어려워요. 잠시 후 다시 말씀해 주세요.";
  }
}

/** B-9 종이 읽어주기: base64 이미지를 Gemini Vision에 보내 3줄 이내 요약 반환 */
export async function readPaperWithGemini(base64: string, mimeType: string = "image/jpeg"): Promise<string> {
  if (!getGeminiKey()) {
    __DEV__ && console.warn("[Gemini] API 키가 없습니다.");
    return "지금 읽기가 어려워요. 잠시 후 다시 시도해 주세요.";
  }
  const PROMPT =
    "이 사진에 있는 문서를 보고 어르신에게 자세히 설명해 주세요.\n\n" +
    "다음 순서로 설명해 주세요:\n" +
    "첫째, 이게 무슨 문서인지 한 줄로 알려주세요.\n" +
    "둘째, 중요한 내용을 알려주세요. 날짜, 금액, 이름, 기한, 수치 등 꼭 알아야 할 것을 빠짐없이.\n" +
    "셋째, 어르신이 지금 해야 할 일을 알려주세요. 납부, 병원 방문, 가족에게 보여주기, 무시해도 됨 등 구체적으로.\n\n" +
    "친절하고 따뜻한 말투로, 어르신이 바로 이해할 수 있게 쉬운 말로 써 주세요.\n" +
    "전문 용어는 쉬운 말로 풀어 주세요.\n" +
    "글자가 없는 사진이면 '글자가 보이지 않아요'라고만 답해 주세요.";
  try {
    const res = await geminiPost({
      body: {
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0.3 },
      },
      timeoutMs: 40_000,
    });
    if (!res.ok) {
      __DEV__ && console.warn(`[Gemini] readPaperWithGemini HTTP ${res.status}`);
      return "지금 읽기가 어려워요. 잠시 후 다시 시도해 주세요.";
    }
    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const summary = parts.map((p) => p.text ?? "").join("").trim() || "내용을 읽지 못했어요.";
    if (data.usageMetadata) {
      AnalyticsService.track("ai_cost_incurred", {
        model: "gemini-2.5-flash",
        input_tokens: data.usageMetadata.promptTokenCount ?? 0,
        output_tokens: data.usageMetadata.candidatesTokenCount ?? 0,
      }).catch(() => {});
    }
    return summary;
  } catch (e) {
    __DEV__ && console.warn("[Gemini] readPaperWithGemini 실패", e);
    return "인터넷 연결을 확인해 주세요.";
  }
}

// ─── 인텐트 분류 ─────────────────────────────────────────────────────────────
/** L3 Gemini Flash 전용 분류기 (내부 사용) */
async function parseIntentL3(
  utterance: string,
  opts?: { onRetry?: () => void }
): Promise<ParsedIntent> {
  if (!getGeminiKey()) {
    __DEV__ && console.warn("[Gemini] API 키가 없습니다. EXPO_PUBLIC_GEMINI_API_KEY 확인");
    return { intent: "unknown" };
  }

  try {
    const res = await geminiPost({
      body: {
        contents: [{ parts: [{ text: `아래 발화의 의도를 분류해서 JSON 하나만 출력해라. 다른 텍스트는 절대 출력하지 마라.

발화: "${utterance}"

[분류 규칙]
1. 장소·가게·업체 검색 → search_business. business_query: 카카오맵에 넣을 최적 검색어. 특정 메뉴명(파닭·마라탕)이 있으면 그것만 사용. 지역명 있으면 "지역명 업종" 형태로 합침. 수식어·동사 제거.
2. 특정인에게 전화 → call_contact
3. 약 복용 알림 설정 → set_reminder
4. 앱 실행 요청(켜줘·열어줘·실행해줘) → open_app. app_name: 앱 이름만.
5. 신체 이상·안전 우려 발언 → safety_concern. 카테고리: fall_risk(넘어짐/쓰러짐) | medication_concern(약 못 먹음) | nutrition_concern(밥 못 먹음) | mental_health_concern(우울/외로움) | mobility_concern(걷기 힘듦) | social_isolation(아무도 안 옴) | urgent_medical(응급).
6. 위험·구조 요청 → sos
7. 날짜·시간·요일 물어보기(오늘 날짜, 몇 시, 무슨 요일, 지금 시간) → date_time
8. 오늘 한 일·대화 기록 요청(오늘 뭐 했어, 기록 알려줘, 뭐 이야기했어, 오늘 뭐 했는지) → conversation_summary
9. 가족·보호자 호출(가족 불러줘, 아들한테 연락해줘, 딸 불러줘, 누군가 불러줘, 보호자 불러줘, 도움 필요해) → emergency_family
10. 당황·불안·혼란 표현(무서워, 어떡하지, 모르겠어, 이상해, 무슨 일이야, 어떻게 해야 해) → calm_down
11. 즐겨찾기·자주 통화에 추가, 가족으로 저장(추가해줘, 저장해줘, 즐겨찾기, 가족 등록) → add_to_favorites. contact_name: 추가할 사람 이름.
12. 위 외의 모든 질문 → general_question

[JSON 스키마]
{
  "intent": "call_contact"|"search_business"|"set_reminder"|"open_app"|"safety_concern"|"add_to_favorites"|"date_time"|"conversation_summary"|"emergency_family"|"calm_down"|"general_question"|"sos"|"unknown",
  "contact_name": "(call_contact 또는 add_to_favorites)",
  "business_query": "(search_business)",
  "medicine": "(set_reminder)",
  "time": "HH:MM (set_reminder)",
  "app_name": "(open_app)",
  "safety_category": "(safety_concern) fall_risk|medication_concern|nutrition_concern|mental_health_concern|mobility_concern|social_isolation|urgent_medical"
}

[예시]
- "딸한테 전화해줘" → {"intent":"call_contact","contact_name":"딸"}
- "유튜브 켜줘" → {"intent":"open_app","app_name":"유튜브"}
- "아까 넘어졌어" → {"intent":"safety_concern","safety_category":"fall_risk"}
- "살려줘" → {"intent":"sos"}
- "오늘 날짜가 뭐야" → {"intent":"date_time"}
- "오늘 뭐 했어?" → {"intent":"conversation_summary"}
- "가족 불러줘" → {"intent":"emergency_family"}
- "무서워요" → {"intent":"calm_down"}
- "엄마 즐겨찾기에 추가해줘" → {"intent":"add_to_favorites","contact_name":"엄마"}
- "홍길동 저장해줘" → {"intent":"add_to_favorites","contact_name":"홍길동"}
- "오늘 날씨 어때?" → {"intent":"general_question"}` }] }],
        generationConfig: { temperature: 0 },
      },
      timeoutMs: 8_000,
      onRetry: opts?.onRetry,
    });

    if (!res.ok) {
      __DEV__ && console.warn(`[Gemini] parseIntent HTTP ${res.status}`);
      return { intent: "unknown" };
    }

    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    if (data.usageMetadata) {
      AnalyticsService.track("ai_cost_incurred", {
        model: "gemini-2.5-flash",
        input_tokens: data.usageMetadata.promptTokenCount ?? 0,
        output_tokens: data.usageMetadata.candidatesTokenCount ?? 0,
      }).catch(() => {});
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as Record<string, string>;

    switch (parsed.intent) {
      case "call_contact":
        return { intent: "call_contact", contactName: parsed.contact_name ?? "" };
      case "search_business":
        return { intent: "search_business", query: parsed.business_query ?? utterance };
      case "set_reminder":
        return { intent: "set_reminder", medicineName: parsed.medicine ?? "", timeHHMM: parsed.time ?? "08:00" };
      case "open_app": {
        const appName = parsed.app_name ?? "";
        return { intent: "open_app", appName, packageName: resolvePackageName(appName) };
      }
      case "safety_concern": {
        const cat = (parsed.safety_category as SafetyCategory) ?? "urgent_medical";
        return { intent: "safety_concern", category: cat, severity: safetyseverity(cat), utterance };
      }
      case "date_time":
        return { intent: "date_time" };
      case "conversation_summary":
        return { intent: "conversation_summary" };
      case "emergency_family":
        return { intent: "emergency_family" };
      case "calm_down":
        return { intent: "calm_down" };
      case "add_to_favorites":
        return { intent: "add_to_favorites", contactName: parsed.contact_name ?? "" };
      case "general_question":
        return { intent: "general_question", utterance };
      case "sos":
        return { intent: "sos" };
      default:
        return { intent: "unknown" };
    }
  } catch (e) {
    __DEV__ && console.warn("[Gemini] parseIntentL3 예외", e);
    return { intent: "unknown" };
  }
}

/**
 * 폭포식 의도해석: L0(슬롯 템플릿) → L1(개인 캐시) → L3(Gemini Flash)
 * resolved_by 필드로 어느 계층이 처리했는지 추적한다.
 */
export async function parseIntent(
  utterance: string,
  opts?: { onRetry?: () => void }
): Promise<ParsedIntent> {
  // L0: 비용 0원, 즉시
  const l0 = tryL0(utterance);
  if (l0) return l0;

  // L1: 비용 0원, AsyncStorage
  const l1 = await getFromL1Cache(utterance);
  if (l1) return l1;

  // L3: Gemini Flash (유료)
  const l3 = await parseIntentL3(utterance, opts);
  await saveToL1Cache(utterance, l3);
  return { ...l3, resolved_by: "L3" };
}
