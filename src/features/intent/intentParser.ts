import { NativeModules } from "react-native";

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

export type ParsedIntent =
  | { intent: "call_contact"; contactName: string }
  | { intent: "search_business"; query: string }
  | { intent: "set_reminder"; medicineName: string; timeHHMM: string }
  | { intent: "general_question"; utterance: string }
  | { intent: "safety_concern"; category: SafetyCategory; severity: SafetySeverity; utterance: string }
  | { intent: "open_app"; appName: string; packageName: string }
  | { intent: "sos" }
  | { intent: "unknown" };

// ─── 설치 앱 조회 (PackageManager 방식) ─────────────────────────────────────
export type RawApp = { packageName: string; label: string };

const { InstalledApps } = NativeModules;
let _appsCache: RawApp[] | null = null;

async function getInstalledApps(): Promise<RawApp[]> {
  if (_appsCache) return _appsCache;
  try {
    _appsCache = await InstalledApps.getAll();
  } catch {
    _appsCache = [];
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
  const matched = localMatchApps(appName, apps);
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
    };
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p) => p.text ?? "").join("").trim() || "지금 답변이 어려워요. 잠시 후 다시 말씀해 주세요.";
  } catch (e) {
    __DEV__ && console.warn("[Gemini] askGemini 최종 실패", e);
    const isNetwork = e instanceof TypeError || (e instanceof Error && e.name === "AbortError");
    return isNetwork ? "인터넷 연결을 확인해 주세요." : "지금 답변이 어려워요. 잠시 후 다시 말씀해 주세요.";
  }
}

// ─── 인텐트 분류 ─────────────────────────────────────────────────────────────
export async function parseIntent(
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
4. 앱 실행 요청(켜줘·열어줘·실행해줘) → open_app. app_name: 앱 이름만. package_name: 안드로이드 패키지명. 네 학습 데이터로 아는 앱이면 반드시 반환. 정말 알 수 없을 때만 빈 문자열.
5. 신체 이상·안전 우려 발언 → safety_concern. 카테고리: fall_risk(넘어짐/쓰러짐) | medication_concern(약 못 먹음) | nutrition_concern(밥 못 먹음) | mental_health_concern(우울/외로움) | mobility_concern(걷기 힘듦) | social_isolation(아무도 안 옴) | urgent_medical(응급).
6. 위험·구조 요청 → sos
7. 위 외의 모든 질문 → general_question

[JSON 스키마]
{
  "intent": "call_contact"|"search_business"|"set_reminder"|"open_app"|"safety_concern"|"general_question"|"sos"|"unknown",
  "contact_name": "(call_contact)",
  "business_query": "(search_business)",
  "medicine": "(set_reminder)",
  "time": "HH:MM (set_reminder)",
  "app_name": "(open_app)",
  "package_name": "(open_app) 안드로이드 패키지명. 예: com.kbstar.kbpay, com.toss, com.nhn.android.search. 모르면 빈 문자열.",
  "safety_category": "(safety_concern) fall_risk|medication_concern|nutrition_concern|mental_health_concern|mobility_concern|social_isolation|urgent_medical"
}

[예시]
- "딸한테 전화해줘" → {"intent":"call_contact","contact_name":"딸"}
- "근처 치킨집 찾아줘" → {"intent":"search_business","business_query":"치킨"}
- "유튜브 켜줘" → {"intent":"open_app","app_name":"유튜브","package_name":"com.google.android.youtube"}
- "인스타 켜줘" → {"intent":"open_app","app_name":"인스타","package_name":"com.instagram.android"}
- "카카오톡 열어줘" → {"intent":"open_app","app_name":"카카오톡","package_name":"com.kakao.talk"}
- "카카오뱅크 켜줘" → {"intent":"open_app","app_name":"카카오뱅크","package_name":"com.kakaobank.channel"}
- "카카오페이 켜줘" → {"intent":"open_app","app_name":"카카오페이","package_name":"com.kakaopay.app"}
- "KB페이 켜줘" → {"intent":"open_app","app_name":"KB페이","package_name":"com.kbstar.kbpay"}
- "KB국민은행 켜줘" → {"intent":"open_app","app_name":"KB국민은행","package_name":"com.kbstar.kbbank"}
- "국민은행 켜줘" → {"intent":"open_app","app_name":"국민은행","package_name":"com.kbstar.kbbank"}
- "토스 열어줘" → {"intent":"open_app","app_name":"토스","package_name":"viva.republica.toss"}
- "배달의민족 켜줘" → {"intent":"open_app","app_name":"배달의민족","package_name":"com.nhncorp.deliveryhero.android"}
- "배민 켜줘" → {"intent":"open_app","app_name":"배민","package_name":"com.nhncorp.deliveryhero.android"}
- "넷플릭스 켜줘" → {"intent":"open_app","app_name":"넷플릭스","package_name":"com.netflix.mediaclient"}
- "신한은행 켜줘" → {"intent":"open_app","app_name":"신한은행","package_name":"com.shinhan.sbanking"}
- "농협은행 켜줘" → {"intent":"open_app","app_name":"농협은행","package_name":"nh.smart"}
- "하나은행 켜줘" → {"intent":"open_app","app_name":"하나은행","package_name":"com.kebhana.hanapay"}
- "우리은행 켜줘" → {"intent":"open_app","app_name":"우리은행","package_name":"com.wooribank.pib.smart"}
- "쿠팡 켜줘" → {"intent":"open_app","app_name":"쿠팡","package_name":"com.coupang.mobile"}
- "삼성페이 켜줘" → {"intent":"open_app","app_name":"삼성페이","package_name":"com.samsung.android.spay"}
- "네이버 켜줘" → {"intent":"open_app","app_name":"네이버","package_name":"com.nhn.android.search"}
- "네이버지도 켜줘" → {"intent":"open_app","app_name":"네이버지도","package_name":"com.nhn.android.nmap"}
- "카카오맵 켜줘" → {"intent":"open_app","app_name":"카카오맵","package_name":"net.daum.android.map"}
- "제미나이 켜줘" → {"intent":"open_app","app_name":"제미나이","package_name":"com.google.android.apps.bard"}
- "챗지피티 켜줘" → {"intent":"open_app","app_name":"챗지피티","package_name":"com.openai.chatgpt"}
- "지피티 켜줘" → {"intent":"open_app","app_name":"지피티","package_name":"com.openai.chatgpt"}
- "당근 켜줘" → {"intent":"open_app","app_name":"당근","package_name":"com.towneers.www"}
- "당근마켓 켜줘" → {"intent":"open_app","app_name":"당근마켓","package_name":"com.towneers.www"}
- "KB 켜줘" → {"intent":"open_app","app_name":"KB","package_name":""}
- "카카오 켜줘" → {"intent":"open_app","app_name":"카카오","package_name":""}
- "아까 넘어졌어" → {"intent":"safety_concern","safety_category":"fall_risk"}
- "밥을 못 먹었어" → {"intent":"safety_concern","safety_category":"nutrition_concern"}
- "요즘 너무 외로워" → {"intent":"safety_concern","safety_category":"social_isolation"}
- "살려줘" → {"intent":"sos"}
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

    const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
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
      case "open_app":
        return { intent: "open_app", appName: parsed.app_name ?? "", packageName: parsed.package_name ?? "" };
      case "safety_concern": {
        const cat = (parsed.safety_category as SafetyCategory) ?? "urgent_medical";
        return { intent: "safety_concern", category: cat, severity: safetyseverity(cat), utterance };
      }
      case "general_question":
        return { intent: "general_question", utterance };
      case "sos":
        return { intent: "sos" };
      default:
        return { intent: "unknown" };
    }
  } catch (e) {
    __DEV__ && console.warn("[Gemini] parseIntent 예외", e);
    return { intent: "unknown" };
  }
}
