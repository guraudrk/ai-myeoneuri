import { Alert } from "react-native";

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

export type ParsedIntent =
  | { intent: "call_contact"; contactName: string }
  | { intent: "search_business"; query: string }
  | { intent: "set_reminder"; medicineName: string; timeHHMM: string }
  | { intent: "general_question"; answer: string }
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
          contents: [{ parts: [{ text: `너는 AI 어시스턴트다. 아래 발화를 분석해서 JSON 하나만 출력해라. 다른 텍스트는 절대 출력하지 마라.

발화: "${utterance}"

[분류 규칙]
1. business_query: 카카오맵 검색창에 넣을 최적 검색어. 특정 메뉴명(파닭·냉삼·마라탕 등)이 있으면 그것만 사용하고 일반 카테고리(치킨·고기)는 제거. 지역명이 있으면 "지역명 업종" 형태로 합침. 수식어·동사 제거.
2. 장소·가게·업체를 찾는 질문 → search_business
3. 특정인에게 전화 → call_contact
4. 약 복용 알림 설정 → set_reminder
5. 위험·구조 요청 → sos
6. 위 외의 모든 질문(환율·날씨·역사·상식·번역·계산·인물·건강·여행 등) → general_question

[general_question 답변 규칙]
- answer 필드에 너의 지식으로 직접 답변을 작성해라.
- 마치 친한 친구에게 설명하듯 친절하고 풍부하게 한국어로 써라.
- 단순 한 줄 요약은 금지. 배경 설명, 관련 정보, 실용적인 팁까지 포함해서 여러 문장으로 답해라.
- 실시간 데이터가 필요한 질문(현재 환율·오늘 날씨 등)은 답변 마지막에 "📌 정확한 실시간 정보는 네이버나 구글에서 확인해 주세요."를 추가해라. 단, 그 전에 배경 지식은 충분히 제공해야 한다.

[JSON 스키마]
{
  "intent": "call_contact" | "search_business" | "set_reminder" | "general_question" | "sos" | "unknown",
  "contact_name": "연락처 이름 (call_contact일 때만)",
  "business_query": "카카오맵 검색어 (search_business일 때만)",
  "medicine": "약 이름 (set_reminder일 때만)",
  "time": "HH:MM (set_reminder일 때만)",
  "answer": "답변 전문 (general_question일 때만)"
}

[예시]
- "딸한테 전화해줘" → {"intent":"call_contact","contact_name":"딸"}
- "근처 병원 찾아줘" → {"intent":"search_business","business_query":"병원"}
- "파닭 잘하는 치킨집 찾아줘" → {"intent":"search_business","business_query":"파닭"}
- "잠실역 근처의 음식점 찾아줘" → {"intent":"search_business","business_query":"잠실역 음식점"}
- "매일 아침 8시에 혈압약 알려줘" → {"intent":"set_reminder","medicine":"혈압약","time":"08:00"}
- "살려줘" → {"intent":"sos"}
- "오늘 달러 환율 어때?" → {"intent":"general_question","answer":"<Gemini가 직접 작성한 풍부한 답변>"}
- "파리 날씨 어때?" → {"intent":"general_question","answer":"<Gemini가 직접 작성한 풍부한 답변>"}` }] }],
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
        return { intent: "general_question", answer: parsed.answer ?? "답변을 가져오지 못했어요." };
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
