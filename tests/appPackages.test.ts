import { resolvePackageName } from "@/features/intent/appPackages";
import { localMatchApps } from "@/features/intent/intentParser";
import type { RawApp } from "@/features/intent/intentParser";

describe("resolvePackageName()", () => {
  test("정확한 앱 이름 → 패키지명 반환", () => {
    expect(resolvePackageName("카카오톡")).toBe("com.kakao.talk");
    expect(resolvePackageName("유튜브")).toBe("com.google.android.youtube");
    expect(resolvePackageName("토스")).toBe("viva.republica.toss");
  });

  test("공백 무시 (공백 있어도 매칭)", () => {
    expect(resolvePackageName("카카오 톡")).toBe("com.kakao.talk");
    expect(resolvePackageName("네이버 지도")).toBe("com.nhn.android.nmap");
  });

  test("대소문자 무시", () => {
    expect(resolvePackageName("KB페이")).toBe("com.kbstar.kbpay");
    expect(resolvePackageName("kb페이")).toBe("com.kbstar.kbpay");
  });

  test("별칭 매핑 (배민 → 배달의민족 패키지)", () => {
    expect(resolvePackageName("배민")).toBe("com.nhncorp.deliveryhero.android");
    expect(resolvePackageName("카톡")).toBe("com.kakao.talk");
    expect(resolvePackageName("당근")).toBe("com.towneers.www");
  });

  test("알 수 없는 앱 → 빈 문자열", () => {
    expect(resolvePackageName("존재하지않는앱")).toBe("");
    expect(resolvePackageName("")).toBe("");
  });

  // ── 실기기 확인 완료 목록 회귀 케이스 ──────────────────────────
  test("[회귀] 유튜브 — 정식명·별칭 모두 매핑", () => {
    expect(resolvePackageName("유튜브")).toBe("com.google.android.youtube");
  });

  test("[회귀] 인스타그램 — 정식명·별칭", () => {
    expect(resolvePackageName("인스타그램")).toBe("com.instagram.android");
    expect(resolvePackageName("인스타")).toBe("com.instagram.android");
  });

  test("[회귀] 갤러리 (삼성 기기)", () => {
    expect(resolvePackageName("갤러리")).toBe("com.sec.android.gallery3d");
  });

  test("[회귀] 토스", () => {
    expect(resolvePackageName("토스")).toBe("viva.republica.toss");
  });

  test("[회귀] 네이버", () => {
    expect(resolvePackageName("네이버")).toBe("com.nhn.android.search");
  });

  test("[회귀] 신한은행 — 정식명·약칭", () => {
    expect(resolvePackageName("신한은행")).toBe("com.shinhan.sbanking");
    expect(resolvePackageName("신한")).toBe("com.shinhan.sbanking");
  });

  test("[회귀] 쿠팡이츠", () => {
    expect(resolvePackageName("쿠팡이츠")).toBe("com.coupang.deliverye");
  });

  // ── 핵심 별칭 쌍 ────────────────────────────────────────────────
  test("별칭 쌍: 카톡 ↔ 카카오톡", () => {
    expect(resolvePackageName("카톡")).toBe(resolvePackageName("카카오톡"));
  });

  test("별칭 쌍: 배민 ↔ 배달의민족", () => {
    expect(resolvePackageName("배민")).toBe(resolvePackageName("배달의민족"));
  });

  test("별칭 쌍: 인스타 ↔ 인스타그램", () => {
    expect(resolvePackageName("인스타")).toBe(resolvePackageName("인스타그램"));
  });
});

// ── localMatchApps — 3단 폴백 동작 검증 ────────────────────────────────
describe("localMatchApps() 3단 폴백 시나리오", () => {
  const mockApps: RawApp[] = [
    { packageName: "com.google.android.youtube", label: "YouTube" },
    { packageName: "com.kakao.talk",             label: "카카오톡" },
    { packageName: "com.kakaopay.app",           label: "카카오페이" },
    { packageName: "com.kakaobank.channel",      label: "카카오뱅크" },
    { packageName: "com.sec.android.gallery3d",  label: "갤러리" },
  ];

  test("단일 매칭 → 1개 반환 (opened 단계로 진행)", () => {
    const result = localMatchApps("갤러리", mockApps);
    expect(result).toHaveLength(1);
    expect(result[0].packageName).toBe("com.sec.android.gallery3d");
  });

  test("복수 매칭 → 여러 개 반환 (ambiguous picker 트리거)", () => {
    const result = localMatchApps("카카오", mockApps);
    expect(result.length).toBeGreaterThan(1);
    expect(result.every((a) => a.label.includes("카카오"))).toBe(true);
  });

  test("매핑에 없는 앱 이름 → 빈 배열 (not_found)", () => {
    const result = localMatchApps("존재하지않는앱xyz", mockApps);
    expect(result).toHaveLength(0);
  });
});
