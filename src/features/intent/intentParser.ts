import { Alert, Linking, NativeModules } from "react-native";

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

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

export type ParsedIntent =
  | { intent: "call_contact"; contactName: string }
  | { intent: "search_business"; query: string }
  | { intent: "set_reminder"; medicineName: string; timeHHMM: string }
  | { intent: "general_question"; utterance: string }
  | { intent: "safety_concern"; category: SafetyCategory; utterance: string }
  | { intent: "open_app"; appName: string; packageName: string }
  | { intent: "sos" }
  | { intent: "unknown" };

// ─── 설치 앱 조회 (PackageManager 방식) ─────────────────────────────────────
type RawApp = { packageName: string; label: string };

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

// 한국어 속어·별칭 → 설치 앱 레이블 정규화 검색어
const ALIASES: Record<string, string> = {
  // AI 앱
  지피티: "chatgpt", 챗지피티: "chatgpt", "챗gpt": "chatgpt", 클로드: "claude",
  // 금융 — 레이블 불일치 보완
  kb은행: "kb국민은행", kb뱅크: "kb국민은행", 국민은행: "kb국민은행",
  농협: "nh농협은행", 농협은행: "nh농협은행",
  기업은행: "ibk기업은행",
  // 쇼핑·배달
  배민: "배달의민족", 당근: "당근마켓", 컬리: "마켓컬리",
  // 지도
  지맵: "카카오맵", "t맵": "티맵",
};

// 앱별 이모지 (picker UI용)
const EMOJI_MAP: Record<string, string> = {
  "com.kakao.talk": "💬", "com.kakaopay.app": "💛", "com.kakaobank.channel": "🏦",
  "com.kbstar.kbbank": "🏦", "com.kbstar.kbpay": "💳", "com.kbstar.liivmate": "📈",
  "viva.republica.toss": "💸", "com.nhn.android.search": "🔍",
  "com.nhn.android.nmap": "🗺️", "com.google.android.apps.maps": "🗺️",
  "com.netflix.mediaclient": "🎬", "com.coupang.mobile": "🛍️",
  "com.samsung.android.spay": "💳", "com.sec.android.app.shealth": "❤️",
};

// canOpenURL이 작동하는 커스텀 URI 스킴만 유지 (intent: 계열 제외)
const URI_SCHEMES: Record<string, string> = {
  유튜브: "vnd.youtube:",
  카카오맵: "kakaomap://",
  지도: "kakaomap://",
  네이버지도: "nmap://",
};

function norm(s: string) {
  return s.replace(/\s/g, "").toLowerCase();
}

/** 설치 앱 목록에서 퍼지 매칭 후 실행 */
export async function openAppByName(
  appName: string,
  packageName?: string,
): Promise<OpenAppResult> {
  const normName = norm(appName);

  // 1순위: 커스텀 URI 스킴 (유튜브·카카오맵 등 — canOpenURL 신뢰 가능)
  const schemeKey = Object.keys(URI_SCHEMES).find((k) => norm(k) === normName);
  if (schemeKey) {
    const url = URI_SCHEMES[schemeKey];
    const can = await Linking.canOpenURL(url).catch(() => false);
    if (can) { await Linking.openURL(url); return { status: "opened" }; }
  }

  // 2순위: Gemini가 packageName을 이미 알고 있는 경우 → getLaunchIntentForPackage
  if (packageName) {
    try {
      await InstalledApps.launch(packageName);
      return { status: "opened" };
    } catch { /* 미설치 → 아래로 */ }
  }

  // 3순위: 설치 앱 목록 퍼지 매칭
  const search = ALIASES[normName] ?? normName;
  const apps = await getInstalledApps();

  const matches = apps.filter((a) => {
    const nl = norm(a.label);
    return nl === search || nl.includes(search) || search.includes(nl);
  });

  if (matches.length === 0) return { status: "not_found" };

  if (matches.length === 1) {
    try {
      await InstalledApps.launch(matches[0].packageName);
      return { status: "opened" };
    } catch {
      return { status: "not_found" };
    }
  }

  // 복수 매칭 → 선택 picker
  return {
    status: "ambiguous",
    candidates: matches.slice(0, 5).map((a) => ({
      name: a.label,
      packageName: a.packageName,
      emoji: EMOJI_MAP[a.packageName] ?? "📱",
    })),
  };
}

// ─── 어르신 특화 시스템 프롬프트 ────────────────────────────────────────────
const ELDERLY_SYSTEM_PROMPT = `너는 어르신(60~80대)을 위한 AI 도우미야.
아래 규칙을 항상 지켜:
1. 할머니·할아버지한테 말하듯이, 따뜻하고 정중한 존댓말로 써.
2. 짧은 문장으로 끊어서 써. 한 문장에 하나의 내용만.
3. 어려운 단어나 영어는 절대 쓰지 마. 꼭 써야 하면 바로 뒤에 쉬운 말로 설명해.
4. 핵심 정보를 먼저 말하고, 부연 설명은 뒤에 붙여.
5. 숫자는 크고 명확하게. 단위(원, 도, %)를 꼭 붙여.
6. 마지막에 한 줄로 요점을 정리해 줘.`;

/** Gemini에게 질문 원문을 그대로 보내 어르신 친화적 답변을 받는다. */
export async function askGemini(question: string): Promise<string> {
  if (!GEMINI_KEY) return "API 키가 없어요.";
  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: ELDERLY_SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: question }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.7 },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      Alert.alert("[Gemini 디버그]", `HTTP ${res.status}\n${body.slice(0, 200)}`);
      return "답변을 가져오지 못했어요.";
    }
    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p) => p.text ?? "").join("").trim() || "답변을 가져오지 못했어요.";
  } catch (e) {
    return `오류: ${e instanceof Error ? e.message : String(e)}`;
  }
}

// ─── 인텐트 분류 ─────────────────────────────────────────────────────────────
export async function parseIntent(utterance: string): Promise<ParsedIntent> {
  if (!GEMINI_KEY) {
    Alert.alert("[Gemini]", "API 키가 없어요. .env를 확인해 주세요.");
    return { intent: "unknown" };
  }

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `아래 발화의 의도를 분류해서 JSON 하나만 출력해라. 다른 텍스트는 절대 출력하지 마라.

발화: "${utterance}"

[분류 규칙]
1. 장소·가게·업체 검색 → search_business. business_query: 카카오맵에 넣을 최적 검색어. 특정 메뉴명(파닭·마라탕)이 있으면 그것만 사용. 지역명 있으면 "지역명 업종" 형태로 합침. 수식어·동사 제거.
2. 특정인에게 전화 → call_contact
3. 약 복용 알림 설정 → set_reminder
4. 앱 실행 요청(켜줘·열어줘·실행해줘) → open_app. app_name: 앱 이름만. package_name: 안드로이드 패키지명(아는 경우만, 모르면 빈 문자열).
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
- "카카오톡 열어줘" → {"intent":"open_app","app_name":"카카오톡","package_name":"com.kakao.talk"}
- "카카오뱅크 켜줘" → {"intent":"open_app","app_name":"카카오뱅크","package_name":"com.kakaobank.channel"}
- "카카오페이 켜줘" → {"intent":"open_app","app_name":"카카오페이","package_name":"com.kakaopay.app"}
- "KB페이 켜줘" → {"intent":"open_app","app_name":"KB페이","package_name":"com.kbstar.kbpay"}
- "KB국민은행 켜줘" → {"intent":"open_app","app_name":"KB국민은행","package_name":"com.kbstar.kbbank"}
- "토스 열어줘" → {"intent":"open_app","app_name":"토스","package_name":"viva.republica.toss"}
- "배달의민족 켜줘" → {"intent":"open_app","app_name":"배달의민족","package_name":"com.nhncorp.deliveryhero.android"}
- "넷플릭스 켜줘" → {"intent":"open_app","app_name":"넷플릭스","package_name":"com.netflix.mediaclient"}
- "신한은행 켜줘" → {"intent":"open_app","app_name":"신한은행","package_name":"com.shinhan.sbanking"}
- "농협은행 켜줘" → {"intent":"open_app","app_name":"농협은행","package_name":"nh.smart"}
- "쿠팡 켜줘" → {"intent":"open_app","app_name":"쿠팡","package_name":"com.coupang.mobile"}
- "삼성페이 켜줘" → {"intent":"open_app","app_name":"삼성페이","package_name":"com.samsung.android.spay"}
- "KB 켜줘" → {"intent":"open_app","app_name":"KB","package_name":""}
- "카카오 켜줘" → {"intent":"open_app","app_name":"카카오","package_name":""}
- "아까 넘어졌어" → {"intent":"safety_concern","safety_category":"fall_risk"}
- "밥을 못 먹었어" → {"intent":"safety_concern","safety_category":"nutrition_concern"}
- "요즘 너무 외로워" → {"intent":"safety_concern","safety_category":"social_isolation"}
- "살려줘" → {"intent":"sos"}
- "오늘 날씨 어때?" → {"intent":"general_question"}` }] }],
        generationConfig: { temperature: 0 },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      Alert.alert("[Gemini 디버그]", `HTTP ${res.status}\n${body.slice(0, 200)}`);
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
      case "safety_concern":
        return { intent: "safety_concern", category: (parsed.safety_category as SafetyCategory) ?? "urgent_medical", utterance };
      case "general_question":
        return { intent: "general_question", utterance };
      case "sos":
        return { intent: "sos" };
      default:
        return { intent: "unknown" };
    }
  } catch (e) {
    Alert.alert("[Gemini 디버그]", `예외: ${e instanceof Error ? e.message : String(e)}`);
    return { intent: "unknown" };
  }
}
