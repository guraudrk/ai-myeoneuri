const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

export type ParsedIntent =
  | { intent: "call_contact"; contactName: string }
  | { intent: "search_business"; query: string }
  | { intent: "set_reminder"; medicineName: string; timeHHMM: string }
  | { intent: "sos" }
  | { intent: "unknown" };

async function callGemini(utterance: string): Promise<ParsedIntent | null> {
  if (!GEMINI_KEY) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `다음 발화의 의도를 JSON 하나만 출력하세요. 다른 텍스트 없이.

발화: "${utterance}"

JSON 스키마 (intent 값만 필수, 나머지는 해당할 때만):
{
  "intent": "call_contact" | "search_business" | "set_reminder" | "sos" | "unknown",
  "contact_name": "연락처 이름",
  "business_query": "업체 종류",
  "medicine": "약 이름",
  "time": "HH:MM 형식"
}

예시:
- "딸한테 전화해줘" → {"intent":"call_contact","contact_name":"딸"}
- "근처 병원 찾아줘" → {"intent":"search_business","business_query":"병원"}
- "매일 아침 8시에 혈압약 알려줘" → {"intent":"set_reminder","medicine":"혈압약","time":"08:00"}
- "살려줘" 또는 "도와줘" → {"intent":"sos"}` }] }],
          generationConfig: { temperature: 0 },
        }),
      }
    );
    if (!res.ok) return null;
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
  } catch {
    return null;
  }
}

const CONTACT_KEYWORDS = ["딸", "아들", "엄마", "어머니", "아빠", "아버지", "남편", "아내", "언니", "오빠", "동생", "형", "누나"];
const BUSINESS_KEYWORDS = ["찾아", "수리", "병원", "약국", "마트", "편의점", "근처", "가까운", "주변", "치과", "한의원", "안과", "전기", "보일러", "가스", "세탁", "청소", "이발", "미용", "식당", "음식점", "카페", "빵집"];
const SOS_KEYWORDS = ["살려", "도와줘", "긴급", "위급", "응급", "119", "112"];
const REMINDER_KEYWORDS = ["알림", "알려줘", "알려", "약", "복용", "먹"];

function keywordIntent(utterance: string): ParsedIntent {
  const t = utterance.trim();
  if (SOS_KEYWORDS.some((k) => t.includes(k))) return { intent: "sos" };
  if (REMINDER_KEYWORDS.some((k) => t.includes(k))) {
    return { intent: "set_reminder", medicineName: "", timeHHMM: "08:00" };
  }
  if (CONTACT_KEYWORDS.some((k) => t.includes(k))) return { intent: "call_contact", contactName: "" };
  if (/[가-힣]{2,4}(?:한테|에게|께)\s/.test(t)) return { intent: "call_contact", contactName: "" };
  if (BUSINESS_KEYWORDS.some((k) => t.includes(k))) {
    return {
      intent: "search_business",
      query: t.replace(/근처|가까운|주변|찾아서|찾아줘|찾아|전화해\s*줘|알아봐\s*줘|좀|해줘|해|줘/g, " ").trim().replace(/\s+/g, " "),
    };
  }
  return { intent: "unknown" };
}

export async function parseIntent(utterance: string): Promise<ParsedIntent> {
  const gemini = await callGemini(utterance);
  return gemini ?? keywordIntent(utterance);
}
