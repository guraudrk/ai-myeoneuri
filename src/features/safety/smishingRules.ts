/**
 * B-5 스미싱 룰 엔진 — 100% 온디바이스, 네트워크 미사용
 * 문자 원문을 서버로 보내지 않는다 (ADR-008 유지).
 *
 * 임계값: score ≥ 65 → high, ≥ 30 → medium, 그 외 → low
 */

export type SmishingRisk = "high" | "medium" | "low";

export interface SmishingResult {
  risk: SmishingRisk;
  score: number;
  matched: string[];
}

interface Rule {
  id: string;
  pattern: RegExp;
  score: number;
  label: string;
}

// ──────────────────────────────────────────────────────────────────
// 규칙 목록
// 주의: "검사"·"형사"·"법원" 단독은 오탐 유발 — 더 구체적인 패턴 사용
// ──────────────────────────────────────────────────────────────────
const RULES: Rule[] = [
  // 가족 사칭
  {
    id: "family_impersonation",
    pattern:
      /엄마\s*나야|아빠\s*나야|엄마\s*나\s*(?:폰|핸드폰|스마트폰)이?\s*(?:고장|분실|없어|바꿔)|아빠\s*나\s*(?:폰|핸드폰)이?\s*(?:고장|분실)|(?:딸|아들|손녀|손자)이?야\s.{0,20}(?:번호|연락)/i,
    score: 40,
    label: "가족 사칭",
  },
  // 고위험 기관 사칭 — 검찰/경찰/금융당국이 개인에게 문자를 보내는 경우 없음
  // "검사" 단독 제외 → "검사님|담당검사" 한정, "형사님|담당형사" 한정
  // "법원" 단독 제외 → 소환·출석·명의 등 구체적 문맥 한정
  {
    id: "authority_impersonation",
    pattern:
      /검찰청|검찰\s*(?:수사관|조사|소환)|경찰청|금융감독원|금감원|국세청|사법부|수사관|검사님|담당\s*검사|형사님|담당\s*형사|금융정보분석원|인터폴|법원\s*(?:명의|출석|소환|통보|통지|안내\s*드립)/i,
    score: 40,
    label: "기관 사칭",
  },
  // 공공기관 이름 단독 언급 — 정상 공지에도 나타나므로 낮은 점수
  // 개인정보·URL·금전 요구와 결합하면 medium 이상으로 올라감
  {
    id: "authority_soft",
    pattern: /건강보험공단/i,
    score: 15,
    label: "공공기관 언급",
  },
  // 단축 URL / IP URL / 수상한 TLD
  {
    id: "suspicious_url",
    pattern:
      /bit\.ly\/|tinyurl\.com\/|t\.co\/|goo\.gl\/|ow\.ly\/|han\.gl\/|url\.kr\/|http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|https?:\/\/[^\s]+\.(?:xyz|click|top|info|pw|tk|ml|ga|cf)(?:[\s?#/]|$)/i,
    score: 35,
    label: "단축/의심 URL",
  },
  // 계좌이체 / 송금 / 상품권
  {
    id: "money_transfer",
    pattern:
      /(?:계좌|통장)\s*(?:이체|번호\s*(?:보내|알려)|보내|송금)|구글\s*기프트카드|아이튠즈|문화상품권|스팀\s*기프트|상품권\s*(?:구매|사서|번호)|지금\s*바로\s*(?:보내|입금|이체)|(?:만|천)\s*원\s*(?:보내|이체|입금)/i,
    score: 35,
    label: "금전 요구",
  },
  // 택배 사기 (의심 문구 + 클릭/링크 유도)
  {
    id: "delivery_scam",
    pattern:
      /택배\s*(?:미배달|오류|반송|배달\s*실패|주소\s*오류)\s*(?:바랍니다|바람|클릭|접속|링크|확인 바랍니다)|미배달\s*(?:확인|처리)\s*(?:바랍니다|클릭|링크)/i,
    score: 25,
    label: "택배 사기",
  },
  // 부고 / 청첩장 링크
  {
    id: "funeral_wedding_link",
    pattern:
      /(?:부고|청첩장|결혼식|돌잔치)\s*(?:알림|안내)?\s*(?:https?:\/\/|bit|goo|tinyurl)/i,
    score: 35,
    label: "부고/청첩장 사기 링크",
  },
  // 개인정보 입력 유도
  {
    id: "personal_info_request",
    pattern:
      /(?:주민등록번호|계좌번호|카드번호|비밀번호|인증번호|OTP)\s*(?:를|을)?\s*(?:입력|알려|불러|보내|알려주세요|보내주세요)/i,
    score: 35,
    label: "개인정보 입력 유도",
  },
  // 앱 설치 유도
  {
    id: "app_install",
    pattern:
      /(?:앱|어플|어플리케이션)\s*(?:을|를)?\s*(?:설치|다운|깔아|다운로드)\s*(?:해|하세요|주세요|바랍니다|바람)/i,
    score: 30,
    label: "앱 설치 유도",
  },
  // 해외 발신 지시어
  {
    id: "overseas_origin",
    pattern: /국제전화\s*수신|해외\s*(?:발신|번호|전화)/i,
    score: 15,
    label: "해외 발신",
  },
  // 긴급성 강조
  {
    id: "urgency",
    pattern:
      /지금\s*즉시|당장\s*(?:연락|전화|접속|확인|처리)|오늘\s*내로|오늘\s*중으로\s*(?:처리|확인|연락|전화)|(?:24시간|48시간)\s*(?:이내|내|안에)\s*(?:처리|연락|확인)/i,
    score: 10,
    label: "긴급성 강조",
  },
];

export const HIGH_THRESHOLD = 65;
export const MEDIUM_THRESHOLD = 30;

/**
 * 문자 메시지를 분석해 위험도를 반환한다.
 * 문자 원문은 이 함수 밖으로 나가지 않는다.
 */
export function detectSmishing(message: string): SmishingResult {
  let score = 0;
  const matched: string[] = [];

  for (const rule of RULES) {
    if (rule.pattern.test(message)) {
      score += rule.score;
      matched.push(rule.label);
    }
  }

  const risk: SmishingRisk =
    score >= HIGH_THRESHOLD ? "high" :
    score >= MEDIUM_THRESHOLD ? "medium" : "low";

  return { risk, score, matched };
}
