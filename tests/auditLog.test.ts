import {
  maskPhoneNumber,
  maskContactName,
  logEntry,
  getEntries,
  _resetForTest,
} from "@/features/audit/auditLog";

beforeEach(() => _resetForTest());

describe("maskPhoneNumber", () => {
  test("일반 번호 마스킹", () => {
    expect(maskPhoneNumber("01012345678")).toBe("*******5678");
  });

  test("짧은 번호", () => {
    expect(maskPhoneNumber("1234")).toBe("****");
  });

  test("특수문자 포함 번호", () => {
    expect(maskPhoneNumber("010-1234-5678")).toBe("*******5678");
  });
});

describe("maskContactName", () => {
  test("2글자 이름", () => {
    expect(maskContactName("이지")).toBe("이*");
  });

  test("3글자 이름", () => {
    expect(maskContactName("이지은")).toBe("이**");
  });

  test("1글자", () => {
    expect(maskContactName("이")).toBe("*");
  });
});

describe("logEntry", () => {
  test("로그 항목이 저장된다", () => {
    logEntry({
      requestId: "req-1",
      timestamp: "2026-08-04T00:00:00Z",
      intent: "call_contact",
      outcome: "completed",
      detail: "이** ****5678",
    });
    const entries = getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].requestId).toBe("req-1");
    expect(entries[0].outcome).toBe("completed");
  });

  test("전화번호 원문이 로그에 남지 않도록 확인", () => {
    logEntry({
      requestId: "req-2",
      timestamp: "2026-08-04T00:00:00Z",
      intent: "call_contact",
      outcome: "completed",
      detail: "이** ****5678",
    });
    const entries = getEntries();
    expect(entries[0].detail).not.toContain("01012345678");
  });
});
