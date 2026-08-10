# Decisions — AI 며느리

## ADR-001 — 기존 SilverLink와 별도 프로젝트

- Status: Accepted
- Decision: AI 며느리는 새 `ai-myeoneuri` 저장소/프로젝트로 유지한다.
- Reason: 기존 SilverLink의 가족·공공 돌봄 제품 책임과 고령자 개인용 스마트폰 Agent의 책임이 다르다.
- Consequence: 공통 모듈은 선택적으로 재사용하지만 기존 저장소를 덮어쓰지 않는다.

## ADR-002 — Android-first

- Status: Accepted
- Decision: 첫 MVP는 Android에 집중한다.
- Reason: 연락처, Intent, Dialer, 통화 상태 등 핵심 기능의 플랫폼 통합이 필요하다.
- Consequence: iOS 기능 동등성은 현재 범위 밖이다.

## ADR-003 — React Native/Expo 우선 검토, Native는 필요한 곳만

- Status: Proposed; repository discovery 후 확정
- Decision: React Native, Expo Router, TypeScript를 우선 검토하며 불가능한 Android 기능만 Prebuild/Kotlin Module로 구현한다.
- Reason: 기존 `silverlink-mobile` 재사용 가능성과 개발 속도.
- Consequence: Native 경계를 명시하고 불필요한 Native 전환을 피한다.

## ADR-004 — 디자인은 정정된 Claude Design + SilverLink 색상

- Status: Accepted
- Decision: 화면 구조와 고령자 UX는 정정 Claude Design을 사용하고, 색상은 SilverLink Blue·Navy Token을 계승한다.
- Reason: 사용성은 새 제품에 맞추되 브랜드 연속성을 유지한다.
- Consequence: 디자인 HTML/JS를 앱 런타임에 직접 포함하지 않고 React Native로 재구현한다.

## ADR-005 — Just-in-time permission

- Status: Accepted
- Decision: 온보딩에서 권한을 몰아 요청하지 않고 기능 최초 사용 시 설명 후 요청한다.
- Reason: 고령자 인지 부담과 권한 승인률.
- Consequence: 각 Feature가 Permission denied/recovery 상태를 소유한다.

## ADR-006 — 첫 전화는 ACTION_DIAL

- Status: Accepted
- Decision: 첫 MVP는 직접 전화가 아니라 Android Dialer를 연다.
- Reason: 권한과 오작동 위험을 낮추고 사용자가 마지막 실행을 통제한다.
- Consequence: 성공 문구는 “전화 화면을 열었어요”이며 실제 통화 시작으로 표시하지 않는다.

## ADR-007 — LLM은 계획만, Executor가 실행

- Status: Accepted
- Decision: LLM은 Schema-validated Tool Call을 생성하고 결정론적 Allowlist Executor가 Android 행동을 수행한다.
- Reason: 안전성, 테스트 가능성, 감사 가능성.
- Consequence: 임의 명령·URL·화면 좌표 실행 금지.

## ADR-008 — 통화 자동 녹음 제외

- Status: Accepted
- Decision: MVP에서 실제 통화 자동 녹음을 구현하지 않는다.
- Reason: Android 플랫폼 제한, 개인정보, 스토어 정책, 법적 위험.
- Consequence: 통화 후 할 일은 Test Transcript, 사용자가 제공한 파일 또는 명시적 입력으로 시작한다.

## ADR-009 — 금융 기능 제한

- Status: Accepted
- Decision: 은행 앱 열기, 공식 고객센터, 단계별 안내까지만 허용한다.
- Reason: 송금·결제·OTP·보안 화면은 고위험이다.
- Consequence: 실제 거래 자동화는 별도 공식 통합과 승인 없이는 금지한다.

## ADR-010 — Local-first first slice

- Status: Accepted
- Decision: 첫 연락처 전화 Slice는 가능한 로컬 Adapter와 Audit Log로 구현한다.
- Reason: 첫 기능에 Backend는 필수가 아니며, 복잡성을 줄이고 Offline 부분 동작을 제공한다.
- Consequence: Supabase Schema를 미리 만들지 않는다.

## ADR-011 — 문서 기반 세션 지속성

- Status: Accepted
- Decision: 채팅 기억보다 `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, 테스트와 Git 상태를 우선한다.
- Reason: Claude 대화가 길어지거나 바뀌어도 작업을 정확히 이어가기 위해서다.
- Consequence: 매 Task 후 문서 갱신이 Definition of Done에 포함된다.

## ADR-012 — AI 며느리를 SilverLink 어르신 단말로 재포지셔닝

- Status: Accepted
- Decision: "Bixby와 차별점이 뭐냐"는 질문에서 출발해, AI 며느리의 해자를 음성 인식 성능이 아니라 SilverLink 연동(어르신 안전 신호의 실시간 가족 전달)으로 재정의했다.
- Background: 독립 음성 비서로 경쟁하면 네이버 클로바·Bixby·구글 어시스턴트를 상대해야 한다. 이길 수 없다. SilverLink B2B 구독 고객의 어르신 단말로 포지셔닝하면 진입장벽이 낮고 업셀 경로가 명확해진다.
- Alternatives considered: (1) 독립 AI 비서 — 음성 기술 경쟁력 없이 도전 불가. (2) SilverLink 앱 내 기능 통합 — 어르신에게 스마트폰 앱 설치를 요구하게 되어 제품 원칙 위반.
- Consequence: SilverLink 로그인·parent_profiles 연결·safety_alerts 연동이 핵심 기능이 됐다. 독립 기능(일반 질답, 연락처 전화, 앱 실행)은 진입 허들을 낮추는 역할이다.
- Refs: dd2e9a8 이후 전체 SilverLink 연동 커밋

## ADR-013 — 디자인 팔레트를 SilverLink 기준으로 통합

- Status: Accepted
- Decision: `components/tokens.ts`의 색상·폰트·간격 토큰을 SilverLink 웹 디자인 시스템과 일치하도록 교체했다.
- Background: 두 앱이 같은 브랜드임을 사용자가 체감하고, SilverLink 구독 고객이 AI 며느리를 "같은 서비스"로 인식해야 업셀이 쉬워진다.
- Alternatives considered: 별도 팔레트 유지 — 브랜드 연속성 없이 독립 앱처럼 보임. 거부.
- Consequence: FontSize·TouchSize는 고령자 접근성 기준으로 동결(최솟값 보장). 색상·Shadow·Radius만 SilverLink 토큰으로 교체.
- Refs: dd2e9a8

## ADR-014 — 온보딩 B안(최초 1회) 채택, A안(항상 로그인) 기각

- Status: Accepted
- Decision: SilverLink 연결은 첫 설치 후 1회만 요청한다. 앱 재실행 시 로그인 화면을 다시 보여주지 않는다.
- Background: A안(앱 시작마다 세션 확인 → 로그인 유도)은 어르신이 앱을 켤 때마다 로그인 화면을 만나는 시나리오가 발생한다. 어르신에게 로그인 UI는 곧 앱 포기다. 어르신은 아무것도 하지 않아야 한다는 제품 원칙에 정면으로 충돌한다.
- Alternatives considered: A안 — 세션 만료 시 재로그인 유도. 고령자 이탈률이 높아 기각.
- Consequence: 세션 만료가 조용히 일어나면 연동이 끊길 수 있다. 이 위험은 수용하고, 자녀가 설정 버튼을 통해 재연결하도록 안내한다.
- Refs: 7728767

## ADR-015 — 온보딩 강제 게이트 철회

- Status: Accepted
- Decision: 앱 진입 시 온보딩 완료 여부를 체크하는 조건 분기를 제거했다. 홈(마이크 화면)이 항상 첫 화면이다. SilverLink 연결 기능은 설정 버튼을 통해 진입한다.
- Background: 온보딩 게이트는 기술적으로 동작했다(versionCode 34~36). 그러나 SilverLink 계정이 없는 어르신의 가족이 앱을 설치할 때, 계정이 없거나 부모님이 등록되지 않은 경우 앱이 사실상 진입 불가 상태가 됐다. 제품의 첫 화면은 "마이크 하나"여야 한다는 원칙에 어긋난다.
- Alternatives considered: 게이트 유지 + 오류 메시지 개선 — 어르신 입장에서 여전히 잠긴 앱이므로 기각.
- Consequence: 연결 기능은 살아 있다(linkService, supabaseClient, safetyAlertBridge). 진입 시점만 사용자 자발적 설정으로 옮긴 것이다. `_layout.tsx`를 건드리지 않고 `index.tsx` state로만 처리했다(이전 3번의 실패 교훈).
- Refs: 3a4e3bb

## ADR-016 — 약 복용 알림 기능 삭제

- Status: Accepted
- Decision: 홈 화면의 약 알림 pill UI, 등록 모달, `set_reminder` Intent 처리를 모두 제거했다.
- Background: 제품 해자는 SilverLink 연동을 통한 어르신 안전 신호 전달이다. 약 복용 알림은 이 해자와 무관하고, 홈 화면의 인지 부담을 높였다. 어르신 대상 앱에서 화면 요소가 많아질수록 이탈이 늘어난다.
- Limitation: 실제로 누군가가 이 기능을 사용했는지 확인한 적 없다. 사용 지표 없이 삭제한 것은 데이터 기반 결정이 아니다. 재요청이 오면 그때 다시 검토한다.
- Alternatives considered: 기능 숨기기(설정으로 이동) — 코드 복잡도 유지 비용이 크고 사용 가능성이 낮아 완전 삭제를 선택.
- Refs: bbb5d81
