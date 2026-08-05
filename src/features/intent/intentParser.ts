import { Alert } from "react-native";
import { Linking } from "react-native";

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

export type ParsedIntent =
  | { intent: "call_contact"; contactName: string }
  | { intent: "search_business"; query: string }
  | { intent: "set_reminder"; medicineName: string; timeHHMM: string }
  | { intent: "general_question"; utterance: string }
  | { intent: "safety_concern"; category: SafetyCategory; utterance: string }
  | { intent: "open_app"; appName: string; packageName: string }
  | { intent: "sos" }
  | { intent: "unknown" };

// ─── 앱 딥링크 테이블 ───────────────────────────────────────────────────────
const APP_LINKS: Record<string, { deeplink: string; fallback: string }> = {
  유튜브:      { deeplink: "vnd.youtube:",                                         fallback: "https://youtube.com" },
  카카오톡:    { deeplink: "intent:#Intent;package=com.kakao.talk;end",            fallback: "https://play.google.com/store/apps/details?id=com.kakao.talk" },
  카카오맵:    { deeplink: "kakaomap://",                                           fallback: "https://map.kakao.com" },
  네이버:      { deeplink: "intent:#Intent;package=com.nhn.android.search;end",    fallback: "https://m.naver.com" },
  네이버지도:  { deeplink: "nmap://",                                               fallback: "https://map.naver.com" },
  인스타그램:  { deeplink: "intent:#Intent;package=com.instagram.android;end",     fallback: "https://instagram.com" },
  쿠팡:        { deeplink: "intent:#Intent;package=com.coupang.mobile;end",        fallback: "https://coupang.com" },
  날씨:        { deeplink: "intent:#Intent;package=com.weather.Weather;end",       fallback: "https://weather.naver.com" },
  카메라:      { deeplink: "intent:#Intent;action=android.media.action.STILL_IMAGE_CAMERA;end", fallback: "" },
  설정:        { deeplink: "intent:#Intent;action=android.settings.SETTINGS;end", fallback: "" },
  전화:        { deeplink: "tel:",                                                  fallback: "" },
  문자:        { deeplink: "sms:",                                                  fallback: "" },
  갤러리:      { deeplink: "intent:#Intent;package=com.sec.android.gallery3d;end", fallback: "" },
  지도:        { deeplink: "kakaomap://",                                           fallback: "https://map.kakao.com" },
};

/** 앱 이름으로 딥링크를 열어준다.
 *  1순위: Gemini가 추론한 packageName → 설치 확인 후 열기
 *  2순위: APP_LINKS 테이블 (하드코딩된 주요 앱)
 */
export async function openAppByName(
  appName: string,
  packageName?: string,
): Promise<"opened" | "not_found"> {
  // 1순위: Gemini가 패키지명을 알고 있는 경우
  if (packageName) {
    const intentUrl = `intent:#Intent;package=${packageName};end`;
    try {
      const installed = await Linking.canOpenURL(intentUrl).catch(() => false);
      if (installed) {
        await Linking.openURL(intentUrl);
        return "opened";
      }
    } catch {}
  }

  // 2순위: APP_LINKS 테이블 (유튜브·카카오톡 등 딥링크가 더 깔끔한 앱)
  const key = Object.keys(APP_LINKS).find((k) =>
    appName.replace(/\s/g, "").includes(k) || k.includes(appName.replace(/\s/g, ""))
  );
  if (!key) return "not_found";

  const { deeplink, fallback } = APP_LINKS[key];
  try {
    if (deeplink) {
      const can = await Linking.canOpenURL(deeplink).catch(() => false);
      if (can) { await Linking.openURL(deeplink); return "opened"; }
    }
    if (fallback) { await Linking.openURL(fallback); return "opened"; }
  } catch {}
  return "not_found";
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
- "KB페이 켜줘" → {"intent":"open_app","app_name":"KB페이","package_name":"com.kbstar.kbpay"}
- "토스 열어줘" → {"intent":"open_app","app_name":"토스","package_name":"viva.republica.toss"}
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
