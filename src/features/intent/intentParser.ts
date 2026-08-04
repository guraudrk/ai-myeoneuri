export type Intent = "call_contact" | "search_business" | "unknown";

const CONTACT_KEYWORDS = [
  "딸", "아들", "엄마", "어머니", "아빠", "아버지",
  "남편", "아내", "언니", "오빠", "동생", "형", "누나",
];

const BUSINESS_KEYWORDS = [
  "찾아", "수리", "병원", "약국", "마트", "편의점",
  "근처", "가까운", "주변", "치과", "한의원", "안과",
  "전기", "보일러", "가스", "세탁", "청소", "이발",
  "미용", "식당", "음식점", "카페", "빵집",
];

export function detectIntent(utterance: string): Intent {
  const t = utterance.trim();
  if (CONTACT_KEYWORDS.some((k) => t.includes(k))) return "call_contact";
  if (/[가-힣]{2,4}(?:한테|에게|께)\s/.test(t)) return "call_contact";
  if (BUSINESS_KEYWORDS.some((k) => t.includes(k))) return "search_business";
  return "unknown";
}

export function extractBusinessQuery(utterance: string): string {
  return utterance
    .replace(/근처|가까운|주변|찾아서|찾아줘|찾아|전화해\s*줘|알아봐\s*줘|좀|해줘|해|줘/g, " ")
    .trim()
    .replace(/\s+/g, " ") || utterance.trim();
}
