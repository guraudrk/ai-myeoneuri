import { isDuplicate, markExecuted, _resetForTest } from "@/security/dedup";

beforeEach(() => _resetForTest());

describe("dedup", () => {
  test("최초 실행은 중복이 아니다", () => {
    expect(isDuplicate("req-1", "call_contact")).toBe(false);
  });

  test("동일 requestId + actionType은 중복이다", () => {
    markExecuted("req-1", "call_contact");
    expect(isDuplicate("req-1", "call_contact")).toBe(true);
  });

  test("다른 requestId는 중복이 아니다", () => {
    markExecuted("req-1", "call_contact");
    expect(isDuplicate("req-2", "call_contact")).toBe(false);
  });

  test("같은 requestId라도 다른 actionType은 중복이 아니다", () => {
    markExecuted("req-1", "call_contact");
    expect(isDuplicate("req-1", "search_contacts")).toBe(false);
  });
});
