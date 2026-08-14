/**
 * B-7 correctL1Cache 단위 테스트
 * - 정정 인텐트가 L1에 저장되고 getFromL1Cache로 읽히는지 검증
 * - 수용 기준: 정정 1회 후 같은 발화가 L1에서 해결된다
 */

import { saveToL1Cache, getFromL1Cache, correctL1Cache } from "@/features/intent/intentL1Cache";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ParsedIntent } from "@/features/intent/intentParser";

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe("correctL1Cache", () => {
  it("정정된 call_contact 인텐트를 L1에 저장하고 읽을 수 있다", async () => {
    const utterance = "지은한테 전화해";
    const corrected: ParsedIntent = { intent: "call_contact", contactName: "지은" };

    await correctL1Cache(utterance, corrected);
    const cached = await getFromL1Cache(utterance);

    expect(cached).not.toBeNull();
    expect(cached?.intent).toBe("call_contact");
    expect((cached as Extract<ParsedIntent, { intent: "call_contact" }>).contactName).toBe("지은");
    expect(cached?.resolved_by).toBe("L1");
  });

  it("정정된 search_business 인텐트를 L1에 저장하고 읽을 수 있다", async () => {
    const utterance = "근처 카페";
    const corrected: ParsedIntent = { intent: "search_business", query: "카페" };

    await correctL1Cache(utterance, corrected);
    const cached = await getFromL1Cache(utterance);

    expect(cached?.intent).toBe("search_business");
    expect(cached?.resolved_by).toBe("L1");
  });

  it("기존 캐시를 정정값으로 덮어쓴다", async () => {
    const utterance = "진영 전화";
    const original: ParsedIntent = { intent: "search_business", query: "진영" };
    await saveToL1Cache(utterance, original);

    const corrected: ParsedIntent = { intent: "call_contact", contactName: "진영" };
    await correctL1Cache(utterance, corrected);

    const cached = await getFromL1Cache(utterance);
    expect(cached?.intent).toBe("call_contact");
  });

  it("앞뒤 공백·연속 공백은 정규화되어 같은 키로 읽힌다", async () => {
    const utterance = "  지은  한테  전화  ";
    const corrected: ParsedIntent = { intent: "call_contact", contactName: "지은" };
    await correctL1Cache(utterance, corrected);

    // normalizeKey는 공백 압축(→ " ")만 하므로 "지은 한테 전화"와 동일
    const cached = await getFromL1Cache("지은 한테 전화");
    expect(cached?.intent).toBe("call_contact");
  });
});

describe("saveToL1Cache vs correctL1Cache 동작 차이", () => {
  it("saveToL1Cache는 unknown 인텐트를 저장하지 않는다", async () => {
    const utterance = "알 수 없음";
    const unknown: ParsedIntent = { intent: "unknown" };
    await saveToL1Cache(utterance, unknown);

    const cached = await getFromL1Cache(utterance);
    expect(cached).toBeNull();
  });

  it("correctL1Cache는 valid 인텐트를 항상 저장한다", async () => {
    const utterance = "알 수 없음";
    const valid: ParsedIntent = { intent: "call_contact", contactName: "알 수 없음" };
    await correctL1Cache(utterance, valid);

    const cached = await getFromL1Cache(utterance);
    expect(cached).not.toBeNull();
    expect(cached?.intent).toBe("call_contact");
  });
});
