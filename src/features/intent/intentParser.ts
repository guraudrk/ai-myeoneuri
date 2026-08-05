import { Alert } from "react-native";

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
4. 수식어(맛있는, 잘하는, 분위기 좋은)는 제거한다.
5. 행위 동사(찾아줘, 추천해줘, 알려줘)는 제거한다.

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
  "찾아", "추천", "찾고", "어디", "있나요", "있어요", "맛집",
  "수리", "병원", "약국", "마트", "편의점", "근처", "가까운", "주변",
  "치과", "한의원", "안과", "전기", "보일러", "가스", "세탁", "청소",
  "이발", "미용", "식당", "음식점", "카페", "빵집",
  "치킨", "피자", "중국집", "한식", "일식", "분식", "고기집", "삼겹살",
  "파닭", "족발", "보쌈", "냉면", "국밥", "순대", "떡볶이", "마라탕",
  "냉삼", "공원", "약", "pc방", "노래방", "주유소",
];

// 키워드 폴백용 — 일반 카테고리보다 구체적인 메뉴/브랜드명이 있으면 그쪽 우선
const SPECIFIC_FOOD = ["파닭", "냉삼", "마라탕", "족발", "보쌈", "냉면", "국밥", "순대", "떡볶이"];

function cleanFallbackQuery(t: string): string {
  // 수식어 제거
  let q = t.replace(/맛있는|친절한|저렴한|유명한|잘하는|빠른|깨끗한|신선한|분위기\s*좋은|가격\s*착한|산책할\s*수\s*있는/g, "");
  // 동사·조사 제거
  q = q.replace(/잘하는\s*집|좋은\s*곳|있는\s*곳|하는\s*집|하는\s*데|추천해\s*줘|추천해|추천|알려\s*줘|알려|찾아서|찾아줘|찾아|찾고\s*싶어|어디|있나요|있어요|전화해\s*줘|알아봐\s*줘|근처|가까운|주변|좀|해줘|해|줘|\s+의\s+/g, " ");
  q = q.trim().replace(/\s+/g, " ");

  // 구체적인 음식 메뉴가 포함되면 일반 카테고리(치킨,고기 등) 제거
  const hasSpecific = SPECIFIC_FOOD.some((k) => q.includes(k));
  if (hasSpecific) {
    q = q.replace(/치킨집|치킨|고기집|음식점|식당/g, "").trim().replace(/\s+/g, " ");
  }
  return q;
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
    return { intent: "search_business", query: cleanFallbackQuery(t) };
  }
  return { intent: "unknown" };
}

export async function parseIntent(utterance: string): Promise<ParsedIntent> {
  const gemini = await callGemini(utterance);
  return gemini ?? keywordIntent(utterance);
}
