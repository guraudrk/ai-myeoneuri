# Architecture — AI 며느리

## 1. High-level flow

```text
Voice/Text Input
→ Input Adapter
→ Text Normalizer
→ Intent Planner
→ Structured Tool Call
→ Schema Validator
→ Safety Policy
→ Confirmation Controller
→ Deterministic Action Executor
→ Android Adapter
→ Result Validator
→ Visual/TTS Feedback
→ Audit Log
```

## 2. Trust boundary

LLM은 의도와 실행 계획을 구조화한다.

LLM이 직접 실행하면 안 되는 것:

- Android API
- Shell
- JavaScript
- 임의 URL
- 임의 Package name
- 화면 좌표
- SQL
- 전화·문자·금융 행동

실제 행동은 Allowlist에 등록된 결정론적 Executor만 수행한다.

## 3. Initial tool contract

Tool Call 공통 필드:

```ts
type AssistantCommand = {
  requestId: string;
  intent: string;
  riskLevel: "low" | "medium" | "high";
  requiresConfirmation: boolean;
  userFacingSummary: string;
  actions: AssistantAction[];
};
```

초기 Allowlist 후보:

- `search_contacts`
- `call_contact`
- `search_local_business`
- `call_phone_number`
- `open_app`
- `open_system_setting`
- `create_reminder`
- `read_recent_tasks`
- `draft_sms`
- `send_sms`
- `open_map_location`
- `start_navigation`
- `request_guardian_approval`

현재 Vertical Slice에 필요한 Tool만 구현한다.

## 4. Recommended technical direction

저장소 조사 후 확정하되 우선 검토:

- React Native
- Expo Router
- TypeScript strict mode
- Expo Prebuild 또는 Custom Development Client
- Kotlin Native Module
- Android Contacts Provider
- Android Intent
- Android SpeechRecognizer/TTS 또는 교체 가능한 Adapter
- Zod 또는 동등한 Schema Validation
- Supabase Auth/Postgres/RLS는 동기화가 필요한 Phase에서 연결

## 5. Suggested module boundaries

```text
app/                         routes/screens
src/
  components/                accessible UI primitives
  features/
    assistant/
    contacts/
    calling/
    permissions/
    audit/
  domain/                    pure types and policies
  services/                  use cases
  adapters/
    ai/
    speech/
    contacts/
    phone/
    storage/
  native/                    JS/TS facade over Kotlin
  security/
  lib/
  test-utils/
android/                     only when required
docs/
tests/
```

실제 기존 Pattern이 있으면 그 구조를 우선한다.

## 6. Android action policy

우선순위:

1. 공식 Android Intent
2. 공식 Deep Link
3. 공식 Public API
4. Android System API
5. 사용자 안내형 UI
6. 제한적 Accessibility

첫 MVP 전화:

- `ACTION_DIAL` 우선
- 대상과 행동을 확인한 후 실행
- Dialer를 열었을 뿐 실제 통화 시작으로 표시하지 않음
- 직접 전화는 별도 Phase와 추가 권한 검토

## 7. Permission policy

Just-in-time 권한 요청:

- 마이크: 사용자가 처음 마이크를 누를 때
- 연락처: 처음 연락처 기반 명령을 실행할 때
- 알림: 첫 알림 저장 시점
- 직접 전화: `ACTION_CALL`을 별도로 도입할 때만

권한 거부 시 앱은 종료되지 않고 다음 대안을 제공한다.

- 글자 입력
- 설정 열기
- 다시 설명 듣기
- 홈으로 돌아가기
- 보호자 도움 요청

## 8. Offline policy

오프라인에서도 가능한 기능:

- Text Input
- 로컬 연락처 검색
- `ACTION_DIAL`
- 로컬 Audit Log
- 최근 로컬 상태

인터넷이 필요한 기능:

- Cloud STT
- LLM Provider
- 업체 검색 Provider
- 서버 동기화

오프라인 전체 실패가 아니라 부분 기능으로 저하한다.

## 9. Security

- External input은 `unknown`에서 Schema 검증
- 미등록 Tool 실행 금지
- 동일 requestId와 동일 Action 중복 실행 차단
- 전화번호와 민감정보 마스킹
- Service Role Key를 모바일에 포함하지 않음
- Prompt Injection 문자열은 데이터로만 처리
- 외부 전송 전 동의와 범위 표시
- RLS와 사용자별 소유권
- Secret scanner/CI/Test로 가능한 규칙 강제

## 10. Data direction

초기 후보:

- `assistant_commands`
- `assistant_actions`
- `call_sessions`
- `extracted_tasks`
- `consent_grants`
- `guardian_links`

첫 Slice에 DB가 필요하지 않으면 로컬 Storage와 Mock을 우선한다. 미래 기능을 위해 Schema를 미리 만들지 않는다.
