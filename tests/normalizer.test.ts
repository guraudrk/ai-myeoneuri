import { parseContactQuery, matchesQuery } from "@/features/contacts/normalizer";

describe("parseContactQuery", () => {
  test("관계어 '딸' 파싱", () => {
    const result = parseContactQuery("딸한테 전화해 줘");
    expect(result.relationship).toBe("딸");
    expect(result.name).toBeUndefined();
  });

  test("관계어 '아들' 파싱", () => {
    const result = parseContactQuery("우리 아들한테 전화해");
    expect(result.relationship).toBe("아들");
  });

  test("관계어 '어머니'를 '엄마'로 정규화", () => {
    const result = parseContactQuery("어머니한테 전화해 줘");
    expect(result.relationship).toBe("엄마");
  });

  test("이름 파싱: '이지은에게'", () => {
    const result = parseContactQuery("이지은에게 전화해 줘");
    expect(result.name).toBe("이지은");
    expect(result.relationship).toBeUndefined();
  });

  test("알 수 없는 발화는 rawQuery만 반환", () => {
    const result = parseContactQuery("전화해 줘");
    expect(result.relationship).toBeUndefined();
    expect(result.name).toBeUndefined();
    expect(result.rawQuery).toBe("전화해 줘");
  });
});

describe("matchesQuery", () => {
  test("관계어로 연락처 이름 매칭", () => {
    const query = parseContactQuery("딸한테 전화해 줘");
    expect(matchesQuery("딸 이지은", query)).toBe(true);
    expect(matchesQuery("아들 이민수", query)).toBe(false);
  });

  test("이름으로 연락처 매칭", () => {
    const query = parseContactQuery("이지은에게 전화해 줘");
    expect(matchesQuery("딸 이지은", query)).toBe(true);
    expect(matchesQuery("이지은 회사", query)).toBe(true);
    expect(matchesQuery("아들 이민수", query)).toBe(false);
  });
});
