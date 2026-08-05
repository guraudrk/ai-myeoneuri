import { Alert } from "react-native";

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

export type ParsedIntent =
  | { intent: "call_contact"; contactName: string }
  | { intent: "search_business"; query: string }
  | { intent: "set_reminder"; medicineName: string; timeHHMM: string }
  | { intent: "general_question"; utterance: string }
  | { intent: "sos" }
  | { intent: "unknown" };

/** 분류와 무관하게 Gemini에게 직접 질문하고 날것의 텍스트 답변을 반환한다.
 *  google_search 도구를 켜서 실시간 정보(환율·주가·날씨 등)도 정확하게 답한다. */
export async function askGemini(question: string): Promise<string> {
  if (!GEMINI_KEY) return "API 키가 없어요.";
  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    // parts 전체를 이어 붙인다 (검색 결과 텍스트가 여러 part로 나뉠 수 있음)
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .map((p) => p.text ?? "")
      .join("")
      .trim();
    return text || "답변을 가져오지 못했어요.";
  } catch (e) {
    return `오류: ${e instanceof Error ? e.message : String(e)}`;
  }
}

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
          contents: [{ parts: [{ text: `아래 발화의 의도를 분류해서 JSON 하나만 출력해라. 다른 텍스트는 절대 출력하지 마라.

발화: "${utterance}"

[분류 규칙]
1. 장소·가게·업체를 찾는 질문 → search_business. business_query는 카카오맵 검색창에 넣을 최적 검색어. 특정 메뉴명(파닭·냉삼·마라탕)이 있으면 그것만 사용하고 일반 카테고리 제거. 지역명 있으면 "지역명 업종" 형태로 합침. 수식어·동사 제거.
2. 특정인에게 전화 → call_contact
3. 약 복용 알림 설정 → set_reminder
4. 위험·구조 요청 → sos
5. 위 외의 모든 질문(환율·날씨·역사·상식·번역·계산·인물·건강·여행 등) → general_question

[JSON 스키마]
{
  "intent": "call_contact" | "search_business" | "set_reminder" | "general_question" | "sos" | "unknown",
  "contact_name": "연락처 이름 (call_contact일 때만)",
  "business_query": "카카오맵 검색어 (search_business일 때만)",
  "medicine": "약 이름 (set_reminder일 때만)",
  "time": "HH:MM (set_reminder일 때만)"
}

[예시]
- "딸한테 전화해줘" → {"intent":"call_contact","contact_name":"딸"}
- "근처 병원 찾아줘" → {"intent":"search_business","business_query":"병원"}
- "파닭 잘하는 치킨집 찾아줘" → {"intent":"search_business","business_query":"파닭"}
- "잠실역 근처의 음식점 찾아줘" → {"intent":"search_business","business_query":"잠실역 음식점"}
- "매일 아침 8시에 혈압약 알려줘" → {"intent":"set_reminder","medicine":"혈압약","time":"08:00"}
- "살려줘" → {"intent":"sos"}
- "오늘 달러 환율 어때?" → {"intent":"general_question"}
- "파리 날씨 어때?" → {"intent":"general_question"}
- "세계에서 가장 긴 강은?" → {"intent":"general_question"}` }] }],
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
