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
