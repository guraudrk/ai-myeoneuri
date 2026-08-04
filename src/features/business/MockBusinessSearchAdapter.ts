import type { BusinessSearchAdapter, BusinessCandidate } from "./BusinessSearchAdapter";

const MOCK_DB: { keywords: string[]; businesses: BusinessCandidate[] }[] = [
  {
    keywords: ["보일러", "난방", "온돌"],
    businesses: [
      { id: "b1", name: "든든 보일러 수리", category: "보일러 수리", address: "서울 노원구 상계동 123", phone: "02-123-4561", maskedPhone: "02-***-4561", distance: "350m" },
      { id: "b2", name: "한국 보일러 서비스", category: "보일러 수리", address: "서울 노원구 중계동 45", phone: "02-987-6541", maskedPhone: "02-***-6541", distance: "720m" },
      { id: "b3", name: "24시 보일러 닥터", category: "보일러 수리", address: "서울 노원구 월계동 78", phone: "02-555-1231", maskedPhone: "02-***-1231", distance: "1.1km" },
    ],
  },
  {
    keywords: ["병원", "의원", "내과", "외과", "소아과"],
    businesses: [
      { id: "c1", name: "햇살 내과의원", category: "내과", address: "서울 노원구 상계동 200", phone: "02-111-2221", maskedPhone: "02-***-2221", distance: "200m" },
      { id: "c2", name: "서울 가정의학과", category: "가정의학과", address: "서울 노원구 중계동 88", phone: "02-333-4441", maskedPhone: "02-***-4441", distance: "500m" },
      { id: "c3", name: "노원 내과클리닉", category: "내과", address: "서울 노원구 월계동 55", phone: "02-777-8881", maskedPhone: "02-***-8881", distance: "900m" },
    ],
  },
  {
    keywords: ["약국", "약방"],
    businesses: [
      { id: "d1", name: "건강 약국", category: "약국", address: "서울 노원구 상계동 10", phone: "02-222-3331", maskedPhone: "02-***-3331", distance: "100m" },
      { id: "d2", name: "온누리 약국", category: "약국", address: "서울 노원구 중계동 22", phone: "02-444-5551", maskedPhone: "02-***-5551", distance: "400m" },
    ],
  },
  {
    keywords: ["전기", "전기수리", "콘센트", "누전"],
    businesses: [
      { id: "e1", name: "안전 전기 수리", category: "전기 수리", address: "서울 노원구 상계동 99", phone: "02-666-7771", maskedPhone: "02-***-7771", distance: "250m" },
      { id: "e2", name: "빠른 전기공사", category: "전기 수리", address: "서울 노원구 중계동 67", phone: "02-888-9991", maskedPhone: "02-***-9991", distance: "600m" },
    ],
  },
  {
    keywords: ["세탁", "세탁소", "드라이"],
    businesses: [
      { id: "f1", name: "청결 세탁소", category: "세탁소", address: "서울 노원구 상계동 30", phone: "02-100-2001", maskedPhone: "02-***-2001", distance: "180m" },
      { id: "f2", name: "당일 세탁클리닝", category: "세탁소", address: "서울 노원구 중계동 15", phone: "02-300-4001", maskedPhone: "02-***-4001", distance: "450m" },
    ],
  },
];

const DEFAULT_BUSINESSES: BusinessCandidate[] = [
  { id: "z1", name: "만능 생활 서비스", category: "생활 수리", address: "서울 노원구 상계동 1", phone: "02-010-1001", maskedPhone: "02-***-1001", distance: "300m" },
  { id: "z2", name: "동네 도우미 센터", category: "생활 서비스", address: "서울 노원구 중계동 2", phone: "02-020-2001", maskedPhone: "02-***-2001", distance: "600m" },
];

export function createMockBusinessSearchAdapter(): BusinessSearchAdapter {
  return {
    async search(query) {
      await new Promise((r) => setTimeout(r, 1000));
      const matched = MOCK_DB.find((entry) =>
        entry.keywords.some((k) => query.includes(k))
      );
      return (matched?.businesses ?? DEFAULT_BUSINESSES).slice(0, 3);
    },
  };
}
