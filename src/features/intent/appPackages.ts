/**
 * 앱 이름/별칭 → 패키지명 정적 매핑.
 * Gemini 프롬프트에서 분리해 로컬에서 처리함으로써 매 호출 ~1500토큰 절감.
 *
 * 추가 방법: 앱 이름(소문자·공백 제거)을 키로, 패키지명을 값으로 추가.
 */
export const APP_PACKAGE_MAP: Record<string, string> = {
  // 소셜·메신저
  "카카오톡":           "com.kakao.talk",
  "카톡":               "com.kakao.talk",
  "인스타":             "com.instagram.android",
  "인스타그램":         "com.instagram.android",
  "유튜브":             "com.google.android.youtube",
  "페이스북":           "com.facebook.katana",

  // 금융·결제
  "카카오페이":         "com.kakaopay.app",
  "카카오뱅크":         "com.kakaobank.channel",
  "kb페이":             "com.kbstar.kbpay",
  "kb국민은행":         "com.kbstar.kbbank",
  "국민은행":           "com.kbstar.kbbank",
  "토스":               "viva.republica.toss",
  "신한은행":           "com.shinhan.sbanking",
  "신한":               "com.shinhan.sbanking",
  "농협은행":           "nh.smart",
  "농협":               "nh.smart",
  "하나은행":           "com.kebhana.hanapay",
  "하나":               "com.kebhana.hanapay",
  "우리은행":           "com.wooribank.pib.smart",
  "우리":               "com.wooribank.pib.smart",
  "삼성페이":           "com.samsung.android.spay",

  // 쇼핑·배달
  "쿠팡":               "com.coupang.mobile",
  "쿠팡이츠":           "com.coupang.deliverye",
  "배달의민족":         "com.nhncorp.deliveryhero.android",
  "배민":               "com.nhncorp.deliveryhero.android",
  "당근":               "com.towneers.www",
  "당근마켓":           "com.towneers.www",

  // 지도·검색
  "네이버":             "com.nhn.android.search",
  "네이버지도":         "com.nhn.android.nmap",
  "카카오맵":           "net.daum.android.map",
  "카카오내비":         "com.kakao.navi",

  // AI
  "제미나이":           "com.google.android.apps.bard",
  "챗지피티":           "com.openai.chatgpt",
  "챗gpt":              "com.openai.chatgpt",
  "지피티":             "com.openai.chatgpt",

  // 엔터테인먼트
  "넷플릭스":           "com.netflix.mediaclient",
  "유튜브뮤직":         "com.google.android.apps.youtube.music",

  // 삼성 기본 앱
  "갤러리":             "com.sec.android.gallery3d",
  "카메라":             "com.sec.android.app.camera",
  "설정":               "com.android.settings",
  "삼성건강":           "com.sec.android.app.shealth",
  "삼성헬스":           "com.sec.android.app.shealth",
};

/** 앱 이름/별칭을 정적 매핑에서 조회한다. 없으면 빈 문자열. */
export function resolvePackageName(appName: string): string {
  const key = appName.replace(/\s/g, "").toLowerCase();
  for (const [alias, pkg] of Object.entries(APP_PACKAGE_MAP)) {
    if (alias.replace(/\s/g, "").toLowerCase() === key) return pkg;
  }
  return "";
}
