import { Alert } from "react-native";

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

export type ParsedIntent =
  | { intent: "call_contact"; contactName: string }
  | { intent: "search_business"; query: string }
  | { intent: "set_reminder"; medicineName: string; timeHHMM: string }
  | { intent: "sos" }
  | { intent: "unknown" };

export async function parseIntent(utterance: string): Promise<ParsedIntent> {
  if (!GEMINI_KEY) {
    Alert.alert("[Gemini]", "API 키가 없어요. .env를 확인해 주세요.");
    return { intent: "unknown" };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `다음 발화의 의도를 JSON 하나만 출력하세요. 다른 텍스트 없이.

발화: "${utterance}"

규칙:
1. business_query는 카카오맵 검색창에 입력할 최적의 검색어다.
2. 특정 음식·메뉴명(파닭, 냉삼, 마라탕 등)이 있으면 그것을 그대로 사용하고 일반 카테고리(치킨, 고기)는 제거한다.
3. 지역·역·동네 이름이 있으면 "지역명 + 업종" 형태로 합쳐서 사용한다.
4. 수식어(맛있는, 잘하는, 분위기 좋은)와 행위 동사(찾아줘, 추천해줘)는 제거한다.

JSON 스키마:
{
  "intent": "call_contact" | "search_business" | "set_reminder" | "sos" | "unknown",
  "contact_name": "연락처 이름",
  "business_query": "카카오맵 검색어",
  "medicine": "약 이름",
  "time": "HH:MM"
}

예시:
- "딸한테 전화해줘" → {"intent":"call_contact","contact_name":"딸"}
- "근처 병원 찾아줘" → {"intent":"search_business","business_query":"병원"}
- "파닭 잘하는 치킨집 찾아줘" → {"intent":"search_business","business_query":"파닭"}
- "분위기 좋은 카페 알려줘" → {"intent":"search_business","business_query":"카페"}
- "잠실역 근처의 음식점 찾아줘" → {"intent":"search_business","business_query":"잠실역 음식점"}
- "강남에 있는 마라탕 맛집" → {"intent":"search_business","business_query":"강남 마라탕"}
- "산책할 수 있는 공원 찾아줘" → {"intent":"search_business","business_query":"공원"}
- "냉삼 파는 집 어디 있어" → {"intent":"search_business","business_query":"냉삼"}
- "매일 아침 8시에 혈압약 알려줘" → {"intent":"set_reminder","medicine":"혈압약","time":"08:00"}
- "살려줘" → {"intent":"sos"}` }] }],
          generationConfig: { temperature: 0 },
        }),
      }
    );

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
