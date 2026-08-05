import { Alert } from "react-native";

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

export type ParsedIntent =
  | { intent: "call_contact"; contactName: string }
  | { intent: "search_business"; query: string }
  | { intent: "set_reminder"; medicineName: string; timeHHMM: string }
  | { intent: "sos" }
  | { intent: "unknown" };

async function callGemini(utterance: string): Promise<ParsedIntent | null> {
  if (!GEMINI_KEY) {
    Alert.alert("[Gemini 디버그]", "키 없음 — 키워드 폴백 사용");
    return null;
  }
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
  "business_query": "검색할 업체 종류 (수식어 제외, 핵심 명사만)",
  "medicine": "약 이름",
  "time": "HH:MM 형식"
}

예시:
- "딸한테 전화해줘" → {"intent":"call_contact","contact_name":"딸"}
- "근처 병원 찾아줘" → {"intent":"search_business","business_query":"병원"}
- "파닭 잘하는집 추천해줘" → {"intent":"search_business","business_query":"파닭"}
- "분위기 좋은 카페 알려줘" → {"intent":"search_business","business_query":"카페"}
- "맛있는 치킨집 어디 있어" → {"intent":"search_business","business_query":"치킨집"}
- "매일 아침 8시에 혈압약 알려줘" → {"intent":"set_reminder","medicine":"혈압약","time":"08:00"}
- "살려줘" 또는 "도와줘" → {"intent":"sos"}` }] }],
          generationConfig: { temperature: 0 },
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      Alert.alert("[Gemini 디버그]", `HTTP ${res.status}\n${body.slice(0, 200)}`);
      return null;
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
    return null;
  }
}

const CONTACT_KEYWORDS = ["딸", "아들", "엄마", "어머니", "아빠", "아버지", "남편", "아내", "언니", "오빠", "동생", "형", "누나"];
const SOS_KEYWORDS = ["살려", "도와줘", "긴급", "위급", "응급", "119", "112"];
const REMINDER_KEYWORDS = ["알림", "복용", "먹어야"];

const BUSINESS_KEYWORDS = [
  "찾아", "추천", "찾고", "어디", "있나요", "있어요",
  "수리", "병원", "약국", "마트", "편의점", "근처", "가까운", "주변",
  "치과", "한의원", "안과", "전기", "보일러", "가스", "세탁", "청소",
  "이발", "미용", "식당", "음식점", "카페", "빵집",
  "치킨", "피자", "중국집", "한식", "일식", "분식", "고기집", "삼겹살",
  "파닭", "족발", "보쌈", "냉면", "국밥", "순대", "떡볶이",
];

const NOISE_ADJECTIVES = /맛있는|친절한|저렴한|유명한|잘하는|빠른|깨끗한|신선한|분위기\s*좋은|가격\s*착한/g;
const NOISE_VERBS = /잘하는\s*집|좋은\s*곳|있는\s*곳|하는\s*집|하는\s*데|추천해\s*줘|추천해|추천|알려\s*줘|알려|찾아서|찾아줘|찾아|찾고\s*싶어|어디|있나요|있어요|전화해\s*줘|알아봐\s*줘|근처|가까운|주변|좀|해줘|해|줘/g;

function cleanBusinessQuery(t: string): string {
  return t
    .replace(NOISE_ADJECTIVES, "")
    .replace(NOISE_VERBS, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function keywordIntent(utterance: string): ParsedIntent {
  const t = utterance.trim();
  if (SOS_KEYWORDS.some((k) => t.includes(k))) return { intent: "sos" };
  if (REMINDER_KEYWORDS.some((k) => t.includes(k))) {
    return { intent: "set_reminder", medicineName: "", timeHHMM: "08:00" };
  }
  if (CONTACT_KEYWORDS.some((k) => t.includes(k))) return { intent: "call_contact", contactName: "" };
  if (/[가-힣]{2,4}(?:한테|에게|께)\s/.test(t)) return { intent: "call_contact", contactName: "" };
  if (BUSINESS_KEYWORDS.some((k) => t.includes(k))) {
    return { intent: "search_business", query: cleanBusinessQuery(t) };
  }
  return { intent: "unknown" };
}

export async function parseIntent(utterance: string): Promise<ParsedIntent> {
  const gemini = await callGemini(utterance);
  return gemini ?? keywordIntent(utterance);
}
