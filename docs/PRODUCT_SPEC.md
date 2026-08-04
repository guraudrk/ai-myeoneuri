# Product Specification — AI 며느리

## 1. Product statement

AI 며느리는 스마트폰 사용이 어려운 고령자가 복잡한 메뉴를 배우지 않고도 자연어 음성 또는 단순 텍스트로 필요한 Android 작업을 수행하도록 돕는 개인용 AI 에이전트다.

## 2. Primary user

- 작은 글씨와 복잡한 메뉴 사용이 어려운 고령자
- 스마트폰을 잘못 누를까 걱정하는 사용자
- 연락처 검색과 전화 걸기가 부담스러운 사용자
- 전화에서 들은 할 일을 잊기 쉬운 사용자

## 3. Secondary user

- 자녀
- 보호자
- 가족 구성원

보호자는 사용자를 감시하는 주체가 아니라 사용자가 요청했을 때 도움을 제공하는 보조자다.

## 4. Core value

> 사용자가 자연스럽게 말하면 AI가 의도를 구조화하고 위험을 판정하며, 필요한 사용자 확인 후 결정론적 Android 실행기가 작업을 수행하고 결과를 알려준다.

## 5. MVP user stories

### P0 — 가족에게 전화

사용자가 “딸한테 전화해 줘”라고 말하거나 입력하면:

1. 앱이 문장을 이해한다.
2. 필요한 시점에 연락처 권한을 설명하고 요청한다.
3. 연락처 후보를 최대 3명까지 보여준다.
4. 사용자가 대상을 고른다.
5. 대상과 행동을 다시 확인한다.
6. Android Dialer를 연다.
7. 결과를 화면과 음성으로 안내한다.
8. 개인정보를 마스킹한 감사 로그를 남긴다.

### P1 — 생활 서비스 업체 검색 후 전화

사용자가 “근처 보일러 수리공 찾아서 전화해 줘”라고 요청하면:

1. 위치 사용 이유를 설명한다.
2. Provider Adapter를 통해 업체를 검색한다.
3. 최대 3개를 비교 가능하게 보여준다.
4. 사용자가 업체를 선택한다.
5. 전화 전 확인한다.
6. Dialer를 연다.

초기에는 Mock Provider를 사용한다.

### P2 — 통화 후 할 일 정리

통화 종료 이벤트 또는 사용자가 제공한 테스트 Transcript에서:

1. 할 일 후보를 추출한다.
2. 항목별로 사용자가 확인한다.
3. 시간과 내용을 수정할 수 있다.
4. 확인 후 알림을 만든다.

실제 통화 자동 녹음은 MVP 범위 밖이다.

## 6. Design principles

- 본문 20sp 이상
- 핵심 문장 24~28sp 이상
- 주요 Touch target 최소 56dp
- 화면당 핵심 질문 하나
- 선택지 최대 3개
- 색상만으로 상태 구분 금지
- 화면과 TTS의 핵심 의미 일치
- 실행 전 대상·행동·시점 확인
- 언제든 찾을 수 있는 취소와 복구 경로
- 사용자를 어린아이처럼 대하지 않는 존댓말
- 기존 SilverLink의 Blue·Navy 디자인 DNA 계승

## 7. MVP scope

- Android-first
- 음성·텍스트 입력
- 연락처 검색
- 전화 대상 확인
- `ACTION_DIAL`
- 로컬 Audit Log
- Mock mode
- 권한 거부와 오류 복구
- 기본 TTS 또는 화면 안내
- Unit/Integration Test
- Android Debug Build

## 8. Out of scope

- iOS 동등 기능
- 실제 통화 자동 녹음
- 자동 송금·결제
- OTP·비밀번호 입력
- 은행 보안 화면 자동 조작
- 범용 Accessibility Agent
- 임의 화면 좌표 클릭
- 모든 스마트폰 앱 자동 조작
- 의료 진단
- 보호자의 상시 위치 추적
- 보호자의 전면 감시
- 모든 Tool과 Backend를 한 번에 구현
- Production/Play Store 출시

## 9. Success criteria for first slice

- Text Input Fallback 포함
- 권한 허용·거부 처리
- 연락처 없음·한 명·여러 명 처리
- 후보 최대 3명
- 확인 전 실행 금지
- 취소 가능
- 중복 request 차단
- 전화번호 로그 마스킹
- Prompt Injection 문자열을 데이터로만 처리
- `ACTION_DIAL` 검증
- 관련 테스트 통과
- Type-check, Lint, Expo/Android Build 확인
- 문서와 코드 상태 일치
