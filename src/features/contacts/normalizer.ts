/**
 * 사용자 발화에서 관계어와 이름을 해석한다.
 * 예: "딸한테 전화해 줘" → { relationship: "딸", name: undefined }
 *     "이지은에게 전화해 줘" → { relationship: undefined, name: "이지은" }
 */
export interface ParsedContactQuery {
  relationship?: string;
  name?: string;
  rawQuery: string;
}

const RELATIONSHIP_KEYWORDS: Record<string, string> = {
  딸: "딸",
  아들: "아들",
  엄마: "엄마",
  어머니: "엄마",
  아빠: "아빠",
  아버지: "아빠",
  남편: "남편",
  아내: "아내",
  언니: "언니",
  오빠: "오빠",
  동생: "동생",
  형: "형",
  누나: "누나",
};

/** 발화에서 관계어 또는 이름을 파싱한다. */
export function parseContactQuery(utterance: string): ParsedContactQuery {
  const trimmed = utterance.trim();

  for (const [keyword, relationship] of Object.entries(RELATIONSHIP_KEYWORDS)) {
    if (trimmed.includes(keyword)) {
      return { relationship, rawQuery: trimmed };
    }
  }

  // 이름 패턴: "OO에게", "OO한테", "OO에" 앞 단어
  const nameMatch = trimmed.match(/([가-힣]{2,4})(?:에게|한테|에게|에)\s/);
  if (nameMatch) {
    return { name: nameMatch[1], rawQuery: trimmed };
  }

  return { rawQuery: trimmed };
}

/** 연락처 이름이 쿼리 관계어 또는 이름과 일치하는지 확인한다. */
export function matchesQuery(
  contactName: string,
  query: ParsedContactQuery
): boolean {
  if (query.relationship) {
    return contactName.includes(query.relationship);
  }
  if (query.name) {
    return contactName.includes(query.name);
  }
  return false;
}
