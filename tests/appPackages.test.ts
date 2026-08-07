import { resolvePackageName } from "@/features/intent/appPackages";

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
});
