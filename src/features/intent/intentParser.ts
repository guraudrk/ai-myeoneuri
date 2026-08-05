import { Alert } from "react-native";
import { Linking } from "react-native";

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

export type SafetyCategory =
  | "fall_risk"
  | "medication_concern"
  | "nutrition_concern"
  | "mental_health_concern"
  | "mobility_concern"
  | "social_isolation"
  | "urgent_medical";

export type AppCandidate = {
  name: string;
  packageName: string;
  emoji: string;
};

export type OpenAppResult =
  | { status: "opened" }
  | { status: "not_found" }
  | { status: "ambiguous"; candidates: AppCandidate[] };

export type ParsedIntent =
  | { intent: "call_contact"; contactName: string }
  | { intent: "search_business"; query: string }
  | { intent: "set_reminder"; medicineName: string; timeHHMM: string }
  | { intent: "general_question"; utterance: string }
  | { intent: "safety_concern"; category: SafetyCategory; utterance: string }
  | { intent: "open_app"; appName: string; packageName: string }
  | { intent: "sos" }
  | { intent: "unknown" };

// ─── 앱 딥링크 테이블 ───────────────────────────────────────────────────────
// deeplink: 앱 설치 확인 및 실행용 intent scheme
// fallback: 미설치 시 Play Store로 안내
const P = (pkg: string) => `intent:#Intent;package=${pkg};end`;
const PS = (pkg: string) => `https://play.google.com/store/apps/details?id=${pkg}`;

const APP_LINKS: Record<string, { deeplink: string; fallback: string }> = {
  // ── 기본 시스템 ─────────────────────────────────────────────
  유튜브:       { deeplink: "vnd.youtube:",                                                        fallback: "https://youtube.com" },
  카메라:       { deeplink: "intent:#Intent;action=android.media.action.STILL_IMAGE_CAMERA;end",  fallback: "" },
  설정:         { deeplink: "intent:#Intent;action=android.settings.SETTINGS;end",                fallback: "" },
  전화:         { deeplink: "tel:",                                                                 fallback: "" },
  문자:         { deeplink: "sms:",                                                                 fallback: "" },
  갤러리:       { deeplink: P("com.sec.android.gallery3d"),                                        fallback: P("com.google.android.apps.photos") },
  날씨:         { deeplink: P("com.weather.Weather"),                                              fallback: "https://weather.naver.com" },
  계산기:       { deeplink: P("com.sec.android.app.popupcalculator"),                              fallback: "" },
  // ── 메신저·SNS ───────────────────────────────────────────────
  카카오톡:     { deeplink: P("com.kakao.talk"),      fallback: PS("com.kakao.talk") },
  라인:         { deeplink: P("jp.naver.line.android"), fallback: PS("jp.naver.line.android") },
  밴드:         { deeplink: P("com.nhn.android.band"), fallback: PS("com.nhn.android.band") },
  인스타그램:   { deeplink: P("com.instagram.android"), fallback: "https://instagram.com" },
  페이스북:     { deeplink: P("com.facebook.katana"),  fallback: "https://facebook.com" },
  // ── 지도·교통 ────────────────────────────────────────────────
  카카오맵:     { deeplink: "kakaomap://",             fallback: "https://map.kakao.com" },
  지도:         { deeplink: "kakaomap://",             fallback: "https://map.kakao.com" },
  네이버지도:   { deeplink: "nmap://",                 fallback: "https://map.naver.com" },
  티맵:         { deeplink: P("com.skt.tmap.ui"),      fallback: PS("com.skt.tmap.ui") },
  카카오택시:   { deeplink: P("com.kakao.taxi"),       fallback: PS("com.kakao.taxi") },
  카카오버스:   { deeplink: P("com.kakao.bus"),        fallback: PS("com.kakao.bus") },
  코레일:       { deeplink: P("net.korail.android.nrapp"), fallback: PS("net.korail.android.nrapp") },
  SRT:          { deeplink: P("com.srail.android"),   fallback: PS("com.srail.android") },
  // ── 검색·포털 ────────────────────────────────────────────────
  네이버:       { deeplink: P("com.nhn.android.search"),   fallback: "https://m.naver.com" },
  다음:         { deeplink: P("net.daum.android.daum"),     fallback: "https://m.daum.net" },
  구글:         { deeplink: P("com.google.android.googlequicksearchbox"), fallback: "https://google.com" },
  크롬:         { deeplink: P("com.android.chrome"),        fallback: PS("com.android.chrome") },
  // ── 금융 · 은행 ──────────────────────────────────────────────
  토스:         { deeplink: P("viva.republica.toss"),       fallback: PS("viva.republica.toss") },
  카카오뱅크:   { deeplink: P("com.kakaobank.channel"),     fallback: PS("com.kakaobank.channel") },
  카카오페이:   { deeplink: P("com.kakaopay.app"),          fallback: PS("com.kakaopay.app") },
  케이뱅크:     { deeplink: P("com.kbankus.koreanbank"),    fallback: PS("com.kbankus.koreanbank") },
  뱅크샐러드:   { deeplink: P("com.rainist.banksalad.android"), fallback: PS("com.rainist.banksalad.android") },
  신한은행:     { deeplink: P("com.shinhan.sbanking"),      fallback: PS("com.shinhan.sbanking") },
  우리은행:     { deeplink: P("com.wooribank.pib.smart"),   fallback: PS("com.wooribank.pib.smart") },
  하나은행:     { deeplink: P("com.hanabank.ebankingx"),    fallback: PS("com.hanabank.ebankingx") },
  농협은행:     { deeplink: P("nh.smart"),                  fallback: PS("nh.smart") },
  기업은행:     { deeplink: P("com.ibk.online.banking.android"), fallback: PS("com.ibk.online.banking.android") },
  SC제일은행:   { deeplink: P("kr.co.standardchartered.android.phone"), fallback: PS("kr.co.standardchartered.android.phone") },
  KB국민은행:   { deeplink: P("com.kbstar.kbbank"),         fallback: PS("com.kbstar.kbbank") },
  KB페이:       { deeplink: P("com.kbstar.kbpay"),          fallback: PS("com.kbstar.kbpay") },
  KB증권:       { deeplink: P("com.kbstar.liivmate"),       fallback: PS("com.kbstar.liivmate") },
  // ── 금융 · 카드 ──────────────────────────────────────────────
  삼성카드:     { deeplink: P("com.samsung.card.cardboard"),      fallback: PS("com.samsung.card.cardboard") },
  현대카드:     { deeplink: P("com.hyundaicard.android"),          fallback: PS("com.hyundaicard.android") },
  롯데카드:     { deeplink: P("com.lotte.lottecardapplication"),   fallback: PS("com.lotte.lottecardapplication") },
  국민카드:     { deeplink: P("com.kbcard.kbkookmincard"),         fallback: PS("com.kbcard.kbkookmincard") },
  신한카드:     { deeplink: P("com.shinhancard.smart"),            fallback: PS("com.shinhancard.smart") },
  우리카드:     { deeplink: P("com.woolca.mobile"),                fallback: PS("com.woolca.mobile") },
  농협카드:     { deeplink: P("kr.co.nonghyup.nhcardapp"),         fallback: PS("kr.co.nonghyup.nhcardapp") },
  삼성페이:     { deeplink: P("com.samsung.android.spay"),         fallback: PS("com.samsung.android.spay") },
  // ── 금융 · 증권 ──────────────────────────────────────────────
  삼성증권:     { deeplink: P("com.samsungstock"),                 fallback: PS("com.samsungstock") },
  키움증권:     { deeplink: P("com.kiwoom.android"),               fallback: PS("com.kiwoom.android") },
  한국투자증권: { deeplink: P("com.koreainvestment.android"),      fallback: PS("com.koreainvestment.android") },
  미래에셋:     { deeplink: P("com.mirae.tiger"),                  fallback: PS("com.mirae.tiger") },
  // ── 쇼핑 ─────────────────────────────────────────────────────
  쿠팡:         { deeplink: P("com.coupang.mobile"),               fallback: "https://coupang.com" },
  쿠팡이츠:     { deeplink: P("com.coupangeats"),                  fallback: PS("com.coupangeats") },
  배달의민족:   { deeplink: P("com.nhncorp.deliveryhero.android"), fallback: PS("com.nhncorp.deliveryhero.android") },
  배민:         { deeplink: P("com.nhncorp.deliveryhero.android"), fallback: PS("com.nhncorp.deliveryhero.android") },
  요기요:       { deeplink: P("kr.co.dgrocery"),                   fallback: PS("kr.co.dgrocery") },
  마켓컬리:     { deeplink: P("com.kurly.mobile.android"),         fallback: PS("com.kurly.mobile.android") },
  컬리:         { deeplink: P("com.kurly.mobile.android"),         fallback: PS("com.kurly.mobile.android") },
  "11번가":     { deeplink: P("com.elevenst"),                     fallback: PS("com.elevenst") },
  G마켓:        { deeplink: P("com.gmarket.android.app"),          fallback: "https://gmarket.co.kr" },
  옥션:         { deeplink: P("com.auction.android"),              fallback: "https://auction.co.kr" },
  오늘의집:     { deeplink: P("com.ohouse.android"),               fallback: PS("com.ohouse.android") },
  번개장터:     { deeplink: P("com.jungbo.flashmarket"),           fallback: PS("com.jungbo.flashmarket") },
  당근마켓:     { deeplink: P("com.towneers.www"),                 fallback: PS("com.towneers.www") },
  당근:         { deeplink: P("com.towneers.www"),                 fallback: PS("com.towneers.www") },
  // ── 동영상·엔터테인먼트 ────────────────────────────────────────
  넷플릭스:     { deeplink: P("com.netflix.mediaclient"),          fallback: PS("com.netflix.mediaclient") },
  웨이브:       { deeplink: P("com.skbroadband.player.wave"),      fallback: PS("com.skbroadband.player.wave") },
  티빙:         { deeplink: P("net.cj.cjhv.gs.tving"),            fallback: PS("net.cj.cjhv.gs.tving") },
  왓챠:         { deeplink: P("com.frograms.watchapps.android"),   fallback: PS("com.frograms.watchapps.android") },
  쿠팡플레이:   { deeplink: P("com.coupang.ohplay"),               fallback: PS("com.coupang.ohplay") },
  // ── 헬스·공공 ────────────────────────────────────────────────
  삼성헬스:     { deeplink: P("com.sec.android.app.shealth"),      fallback: PS("com.sec.android.app.shealth") },
  건강보험:     { deeplink: P("kr.nhis.nhisapp"),                  fallback: PS("kr.nhis.nhisapp") },
  국민건강보험: { deeplink: P("kr.nhis.nhisapp"),                  fallback: PS("kr.nhis.nhisapp") },
  정부24:       { deeplink: P("kr.go.e-government.gov24"),         fallback: PS("kr.go.e-government.gov24") },
  손택스:       { deeplink: P("kr.go.irs.mts"),                    fallback: PS("kr.go.irs.mts") },
  // ── 브라우저 ─────────────────────────────────────────────────
  삼성인터넷:   { deeplink: P("com.sec.android.app.sbrowser"),     fallback: "" },
};

// ─── 앱 패밀리 테이블 (동일 브랜드 앱이 여러 개일 때 후보 제시) ────────────
const KB_APPS: AppCandidate[] = [
  { name: "KB국민은행", packageName: "com.kbstar.kbbank",  emoji: "🏦" },
  { name: "KB페이",     packageName: "com.kbstar.kbpay",   emoji: "💳" },
  { name: "KB증권",     packageName: "com.kbstar.liivmate", emoji: "📈" },
];
const APP_FAMILIES: Record<string, AppCandidate[]> = {
  KB:      KB_APPS,
  국민은행: KB_APPS,
  카카오: [
    { name: "카카오톡",   packageName: "com.kakao.talk",        emoji: "💬" },
    { name: "카카오맵",   packageName: "com.kakao.map",         emoji: "🗺️" },
    { name: "카카오뱅크", packageName: "com.kakaobank.channel", emoji: "🏦" },
    { name: "카카오페이", packageName: "com.kakaopay.app",      emoji: "💛" },
  ],
  네이버: [
    { name: "네이버",     packageName: "com.nhn.android.search",  emoji: "🔍" },
    { name: "네이버지도", packageName: "com.nhn.android.nmap",    emoji: "🗺️" },
    { name: "네이버페이", packageName: "com.navercorp.naverpay",  emoji: "💚" },
  ],
  삼성: [
    { name: "삼성페이",     packageName: "com.samsung.android.spay",      emoji: "💳" },
    { name: "삼성헬스",     packageName: "com.sec.android.app.shealth",   emoji: "❤️" },
    { name: "삼성 인터넷", packageName: "com.sec.android.app.sbrowser",  emoji: "🌐" },
  ],
  구글: [
    { name: "크롬",      packageName: "com.android.chrome",                    emoji: "🌐" },
    { name: "구글맵",    packageName: "com.google.android.apps.maps",          emoji: "🗺️" },
    { name: "구글 포토", packageName: "com.google.android.apps.photos",        emoji: "📷" },
  ],
  크롬: [
    { name: "크롬",         packageName: "com.android.chrome",               emoji: "🌐" },
    { name: "삼성 인터넷", packageName: "com.sec.android.app.sbrowser",      emoji: "🌐" },
  ],
};

/** 앱 이름으로 딥링크를 열어준다.
 *  1순위: Gemini 추론 packageName → intent scheme으로 설치 확인 후 열기
 *  2순위: APP_LINKS 테이블 (유튜브·카카오톡 등 deeplink 특화 앱)
 *  3순위: APP_FAMILIES 테이블 → 후보군 제시 (ambiguous)
 */
export async function openAppByName(
  appName: string,
  packageName?: string,
): Promise<OpenAppResult> {
  // 1순위: Gemini가 패키지명을 알고 있는 경우
  if (packageName) {
    const intentUrl = `intent:#Intent;package=${packageName};end`;
    try {
      const installed = await Linking.canOpenURL(intentUrl).catch(() => false);
      if (installed) {
        await Linking.openURL(intentUrl);
        return { status: "opened" };
      }
    } catch {}
  }

  // 2순위: APP_LINKS 테이블
  const clean = appName.replace(/\s/g, "");
  const linkKey = Object.keys(APP_LINKS).find((k) =>
    clean.includes(k) || k.includes(clean)
  );
  if (linkKey) {
    const { deeplink, fallback } = APP_LINKS[linkKey];
    try {
      if (deeplink) {
        const can = await Linking.canOpenURL(deeplink).catch(() => false);
        if (can) { await Linking.openURL(deeplink); return { status: "opened" }; }
      }
      if (fallback) { await Linking.openURL(fallback); return { status: "opened" }; }
    } catch {}
  }

  // 3순위: 앱 패밀리 → 후보 목록 제시
  const familyKey = Object.keys(APP_FAMILIES).find((k) =>
    clean.includes(k) || k.includes(clean)
  );
  if (familyKey) {
    return { status: "ambiguous", candidates: APP_FAMILIES[familyKey] };
  }

  return { status: "not_found" };
}

// ─── 어르신 특화 시스템 프롬프트 ────────────────────────────────────────────
const ELDERLY_SYSTEM_PROMPT = `너는 어르신(60~80대)을 위한 AI 도우미야.
아래 규칙을 항상 지켜:
1. 할머니·할아버지한테 말하듯이, 따뜻하고 정중한 존댓말로 써.
2. 짧은 문장으로 끊어서 써. 한 문장에 하나의 내용만.
3. 어려운 단어나 영어는 절대 쓰지 마. 꼭 써야 하면 바로 뒤에 쉬운 말로 설명해.
4. 핵심 정보를 먼저 말하고, 부연 설명은 뒤에 붙여.
5. 숫자는 크고 명확하게. 단위(원, 도, %)를 꼭 붙여.
6. 마지막에 한 줄로 요점을 정리해 줘.`;

/** Gemini에게 질문 원문을 그대로 보내 어르신 친화적 답변을 받는다. */
export async function askGemini(question: string): Promise<string> {
  if (!GEMINI_KEY) return "API 키가 없어요.";
  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: ELDERLY_SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: question }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.7 },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      Alert.alert("[Gemini 디버그]", `HTTP ${res.status}\n${body.slice(0, 200)}`);
      return "답변을 가져오지 못했어요.";
    }
    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p) => p.text ?? "").join("").trim() || "답변을 가져오지 못했어요.";
  } catch (e) {
    return `오류: ${e instanceof Error ? e.message : String(e)}`;
  }
}

// ─── 인텐트 분류 ─────────────────────────────────────────────────────────────
export async function parseIntent(utterance: string): Promise<ParsedIntent> {
  if (!GEMINI_KEY) {
    Alert.alert("[Gemini]", "API 키가 없어요. .env를 확인해 주세요.");
    return { intent: "unknown" };
  }

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `아래 발화의 의도를 분류해서 JSON 하나만 출력해라. 다른 텍스트는 절대 출력하지 마라.

발화: "${utterance}"

[분류 규칙]
1. 장소·가게·업체 검색 → search_business. business_query: 카카오맵에 넣을 최적 검색어. 특정 메뉴명(파닭·마라탕)이 있으면 그것만 사용. 지역명 있으면 "지역명 업종" 형태로 합침. 수식어·동사 제거.
2. 특정인에게 전화 → call_contact
3. 약 복용 알림 설정 → set_reminder
4. 앱 실행 요청(켜줘·열어줘·실행해줘) → open_app. app_name: 앱 이름만. package_name: 안드로이드 패키지명(아는 경우만, 모르면 빈 문자열).
5. 신체 이상·안전 우려 발언 → safety_concern. 카테고리: fall_risk(넘어짐/쓰러짐) | medication_concern(약 못 먹음) | nutrition_concern(밥 못 먹음) | mental_health_concern(우울/외로움) | mobility_concern(걷기 힘듦) | social_isolation(아무도 안 옴) | urgent_medical(응급).
6. 위험·구조 요청 → sos
7. 위 외의 모든 질문 → general_question

[JSON 스키마]
{
  "intent": "call_contact"|"search_business"|"set_reminder"|"open_app"|"safety_concern"|"general_question"|"sos"|"unknown",
  "contact_name": "(call_contact)",
  "business_query": "(search_business)",
  "medicine": "(set_reminder)",
  "time": "HH:MM (set_reminder)",
  "app_name": "(open_app)",
  "package_name": "(open_app) 안드로이드 패키지명. 예: com.kbstar.kbpay, com.toss, com.nhn.android.search. 모르면 빈 문자열.",
  "safety_category": "(safety_concern) fall_risk|medication_concern|nutrition_concern|mental_health_concern|mobility_concern|social_isolation|urgent_medical"
}

[예시]
- "딸한테 전화해줘" → {"intent":"call_contact","contact_name":"딸"}
- "근처 치킨집 찾아줘" → {"intent":"search_business","business_query":"치킨"}
- "유튜브 켜줘" → {"intent":"open_app","app_name":"유튜브","package_name":"com.google.android.youtube"}
- "카카오톡 열어줘" → {"intent":"open_app","app_name":"카카오톡","package_name":"com.kakao.talk"}
- "카카오뱅크 켜줘" → {"intent":"open_app","app_name":"카카오뱅크","package_name":"com.kakaobank.channel"}
- "카카오페이 켜줘" → {"intent":"open_app","app_name":"카카오페이","package_name":"com.kakaopay.app"}
- "KB페이 켜줘" → {"intent":"open_app","app_name":"KB페이","package_name":"com.kbstar.kbpay"}
- "KB국민은행 켜줘" → {"intent":"open_app","app_name":"KB국민은행","package_name":"com.kbstar.kbbank"}
- "토스 열어줘" → {"intent":"open_app","app_name":"토스","package_name":"viva.republica.toss"}
- "배달의민족 켜줘" → {"intent":"open_app","app_name":"배달의민족","package_name":"com.nhncorp.deliveryhero.android"}
- "넷플릭스 켜줘" → {"intent":"open_app","app_name":"넷플릭스","package_name":"com.netflix.mediaclient"}
- "신한은행 켜줘" → {"intent":"open_app","app_name":"신한은행","package_name":"com.shinhan.sbanking"}
- "농협은행 켜줘" → {"intent":"open_app","app_name":"농협은행","package_name":"nh.smart"}
- "쿠팡 켜줘" → {"intent":"open_app","app_name":"쿠팡","package_name":"com.coupang.mobile"}
- "삼성페이 켜줘" → {"intent":"open_app","app_name":"삼성페이","package_name":"com.samsung.android.spay"}
- "KB 켜줘" → {"intent":"open_app","app_name":"KB","package_name":""}
- "카카오 켜줘" → {"intent":"open_app","app_name":"카카오","package_name":""}
- "아까 넘어졌어" → {"intent":"safety_concern","safety_category":"fall_risk"}
- "밥을 못 먹었어" → {"intent":"safety_concern","safety_category":"nutrition_concern"}
- "요즘 너무 외로워" → {"intent":"safety_concern","safety_category":"social_isolation"}
- "살려줘" → {"intent":"sos"}
- "오늘 날씨 어때?" → {"intent":"general_question"}` }] }],
        generationConfig: { temperature: 0 },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      Alert.alert("[Gemini 디버그]", `HTTP ${res.status}\n${body.slice(0, 200)}`);
      return { intent: "unknown" };
    }

    const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as Record<string, string>;

    switch (parsed.intent) {
      case "call_contact":
        return { intent: "call_contact", contactName: parsed.contact_name ?? "" };
      case "search_business":
        return { intent: "search_business", query: parsed.business_query ?? utterance };
      case "set_reminder":
        return { intent: "set_reminder", medicineName: parsed.medicine ?? "", timeHHMM: parsed.time ?? "08:00" };
      case "open_app":
        return { intent: "open_app", appName: parsed.app_name ?? "", packageName: parsed.package_name ?? "" };
      case "safety_concern":
        return { intent: "safety_concern", category: (parsed.safety_category as SafetyCategory) ?? "urgent_medical", utterance };
      case "general_question":
        return { intent: "general_question", utterance };
      case "sos":
        return { intent: "sos" };
      default:
        return { intent: "unknown" };
    }
  } catch (e) {
    Alert.alert("[Gemini 디버그]", `예외: ${e instanceof Error ? e.message : String(e)}`);
    return { intent: "unknown" };
  }
}
