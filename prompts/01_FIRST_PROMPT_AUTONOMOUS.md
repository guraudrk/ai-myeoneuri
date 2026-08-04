# AI 며느리 — 최초 실행 및 자동 개발 프롬프트

이 메시지를 받은 즉시 작업을 시작하라.

너는 이 프로젝트의 **Lead Android Engineer, AI Agent Architect, Senior Product Engineer, Security Engineer**다.  
분석 보고서만 작성하고 끝내지 말고, 현재 사용할 수 있는 저장소·파일·도구를 실제로 조사한 다음 **안전한 범위에서 코드 작성, 테스트, 문서 갱신까지 연속해서 진행**한다.

사용자에게 구현 세부를 하나씩 묻지 않는다. 저장소에서 확인 가능한 내용은 먼저 조사하고, 낮은 위험의 선택은 기존 패턴과 가장 단순한 기본값을 적용한 뒤 `docs/DECISIONS.md`에 기록한다.

다음에 해당할 때만 작업을 멈추고 승인을 요청한다.

- 기존 사용자 데이터 삭제 또는 파괴적 Migration
- 인증 방식의 근본적 교체
- Production 배포 또는 스토어 출시
- 실제 유료 API의 대량 호출
- 실제 SMS 자동 발송
- 통화 녹음
- 광범위한 Accessibility Service 제어
- 금융 거래, 결제, 송금
- 기존 SilverLink 저장소의 대규모 변경
- GitHub 저장소 공개 전환
- Secret, 개인정보 또는 법적 위험을 안전하게 해소할 수 없는 경우

그 외에는 합리적인 가정을 명시하고 계속 진행한다.

---

## 1. 제품 목표

가칭 **AI 며느리**는 스마트폰 사용이 어려운 고령자가 복잡한 메뉴를 배우지 않아도 자연어 음성으로 필요한 스마트폰 작업을 수행할 수 있게 돕는 Android 중심 개인용 AI 에이전트다.

핵심 원칙:

> 사용자가 자연스럽게 말하면 AI가 의도를 구조화하고, 위험을 판정하고, 필요한 확인을 받은 뒤 결정론적인 Android 실행기가 작업을 수행하고 결과를 알려준다.

대표 명령:

- “딸한테 전화해 줘.”
- “근처 보일러 수리공 찾아서 전화해 줘.”
- “아까 통화하면서 해야 한다고 한 일이 뭐였지?”
- “그 일을 내일 오전 10시에 알려줘.”
- “카카오톡 열어 줘.”
- “은행 앱을 열고 어디를 눌러야 하는지 알려줘.”

---

## 2. 기존 SilverLink와의 경계

기존 SilverLink는 그대로 유지한다.

### 기존 SilverLink
- 가족·보호자 중심 돌봄 관리
- 사회복지사·공공기관 업무
- 안부 확인, 가족 연결, 돌봄 기록, 리포트
- B2B/B2G 확장

### AI 며느리
- 고령자 본인이 직접 사용하는 개인용 앱
- 음성 기반 스마트폰 작업 보조
- 연락처 검색과 전화
- 생활 서비스 검색과 연락
- 통화 이후 할 일 추출
- 알림과 제한적인 앱 실행
- 필요한 경우 보호자 도움 요청

기존 SilverLink의 제품 방향을 AI 며느리로 바꾸지 마라.  
공통 모듈은 재사용하되 제품 저장소와 제품 책임은 분리한다.

---

## 3. 조사 대상

다음 저장소를 실제로 조사한다.

1. `guraudrk/sliverlink_AI`
2. `guraudrk/silverlink-mobile`

현재 작업 디렉터리에 저장소가 있으면 로컬 코드를 우선 사용한다.  
없다면 사용 가능한 공식 GitHub 도구나 `gh`를 사용해 읽기 전용으로 조사한다.  
접근할 수 없는 저장소는 접근 가능한 범위까지만 처리하고, 확인하지 못한 내용을 추측하지 않는다.

조사 순서:

1. 현재 작업 디렉터리와 Git 저장소 여부
2. Git status, 브랜치, 최근 커밋
3. 프로젝트 구조와 주요 진입점
4. package manager와 lockfile
5. 실행·Type-check·Lint·Test·Build 명령
6. 인증, Supabase, RLS, 데이터 모델
7. Gemini Function Calling과 AI 명령 실행 구조
8. Prompt Injection 방어와 감사 로그
9. Expo, React Native, Expo Router 구조
10. Android Native 프로젝트와 Kotlin 코드
11. 연락처, 전화, 통화 상태, 통화 종료 감지
12. 알림, 백그라운드 처리, 중복 방지
13. 환경변수와 Secret 위험
14. 문서와 실제 구현의 충돌
15. 현재 재사용 가능한 테스트

코드를 다음으로 분류한다.

- 그대로 재사용
- 수정 후 재사용
- 제외
- 확인 불가

각 항목에 파일 경로와 판단 근거를 기록한다.

---

## 4. 새 프로젝트 위치

기존 두 저장소를 덮어쓰지 않는다.

새 프로젝트가 아직 없다면 현재 Workspace 안에 다음 이름으로 생성한다.

```text
ai-myeoneuri
```

같은 이름의 프로젝트가 이미 있으면 새로 만들지 말고 현재 상태를 조사해 이어서 작업한다.

원격 GitHub 저장소 생성과 Push는 하지 않는다.  
로컬 Git 저장소 초기화와 로컬 Commit은 안전한 경우 가능하지만, 기존 사용자의 미커밋 변경을 덮어쓰거나 섞지 않는다.

---

## 5. 필수 문서

프로젝트 루트의 `CLAUDE.md`를 가장 먼저 읽는다.

다음 문서가 없으면 생성하고, 있으면 덮어쓰지 말고 현재 규칙과 병합한다.

```text
CLAUDE.md
README.md
.env.example
docs/AGENT_OPERATING_MANUAL.md
docs/PRODUCT_SPEC.md
docs/ARCHITECTURE.md
docs/IMPLEMENTATION_PLAN.md
docs/DECISIONS.md
docs/DESIGN_HANDOFF.md
docs/workflows/IMPLEMENT_VERTICAL_SLICE.md
```

`CLAUDE.md`에는 프로젝트에 항상 적용할 구체적인 규칙을 둔다.  
긴 범용 방법론은 `docs/AGENT_OPERATING_MANUAL.md`에 둔다.

---

## 6. 디자인 작업 경계

시각 디자인은 별도의 Claude Design 작업으로 진행한다.

따라서 이번 엔지니어링 작업에서는 다음 원칙을 적용한다.

- 디자인을 임의로 완성하거나 화려하게 꾸미지 않는다.
- 기능 검증에 필요한 최소 접근성 UI만 만든다.
- 임시 UI는 명확히 `functional placeholder`로 표시한다.
- 비즈니스 로직을 UI 컴포넌트에 결합하지 않는다.
- 화면 상태와 Action을 디자인 교체가 가능한 구조로 분리한다.
- 디자인 결과가 들어오면 UI만 교체할 수 있도록 Design Token과 Component 경계를 준비한다.
- `docs/DESIGN_HANDOFF.md`를 읽고 화면 상태·필수 정보·접근성 요구를 유지한다.
- 디자인 파일이 제공되기 전까지 임의 로고, 캐릭터, 일러스트, 복잡한 애니메이션을 만들지 않는다.

첫 MVP의 기능 검증을 막지 않는 범위에서만 중립적인 기본 UI를 사용한다.

---

## 7. 기술 방향

우선 검토할 기술:

- React Native
- Expo Router
- TypeScript strict mode
- Expo Prebuild 또는 Custom Development Client
- Android Kotlin Native Module
- Android SpeechRecognizer 또는 교체 가능한 STT Adapter
- Android TextToSpeech 또는 교체 가능한 TTS Adapter
- Android Contacts Provider
- Android Intent
- Supabase Auth/Postgres/RLS
- Zod 기반 Tool Schema 검증

기존 `silverlink-mobile`의 패턴을 우선 재사용한다.  
Managed Expo에서 불가능한 기능이 확인된 경우에만 Prebuild 또는 Native Module을 추가한다.

새 Dependency를 추가하기 전 다음을 확인한다.

1. 플랫폼 기본 API로 해결 가능한가
2. 기존 저장소에 이미 있는가
3. 현재 Vertical Slice에 꼭 필요한가
4. 유지보수 상태가 적절한가
5. 권한·개인정보 위험이 증가하는가

---

## 8. AI 실행 구조

LLM은 실행 계획만 생성한다.  
LLM이 Android API, Shell, JavaScript, 임의 URL, 화면 좌표를 직접 실행하게 하지 않는다.

기본 흐름:

```text
Voice/Text Input
→ STT Adapter
→ Text Normalization
→ Intent Detection
→ Structured Action Plan
→ Schema Validation
→ Safety Policy
→ User Confirmation
→ Deterministic Action Executor
→ Android Action
→ Result Validation
→ TTS/User Feedback
→ Audit Log
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

현재 Slice에 필요한 Tool만 구현한다.

Tool Call 필수 필드:

- requestId
- intent
- riskLevel
- requiresConfirmation
- userFacingSummary
- actions

검증되지 않은 Tool 이름이나 Arguments는 실행하지 않는다.

---

## 9. 위험 정책

### Low
- 검색
- 읽기
- 앱·지도·설정 화면 열기
- 로컬 Mock 처리

### Medium
- 전화
- 문자
- 내비게이션 시작
- 알림 생성
- 제한적인 Accessibility Action

Medium 작업은 실행 직전 반드시 사용자 확인을 받는다.

### High
- 금융
- 결제
- 비밀번호·OTP
- 계정 변경
- 데이터 삭제
- 실제 통화 녹음
- 민감 데이터 외부 전송

High 작업은 MVP에서 직접 실행하지 않는다.

---

## 10. 첫 번째 구현 목표

가장 먼저 다음 Vertical Slice를 완성한다.

```text
큰 마이크 또는 텍스트 입력
→ “딸한테 전화해 줘” 해석
→ 연락처 검색
→ 후보 최대 3명 표시
→ 명확한 사용자 확인
→ Android 전화 또는 Dialer 실행
→ 성공·취소·실패 결과 기록
→ 사용자에게 결과 안내
```

필수 요구사항:

- 실제 연락처 권한 요청
- 권한 거부 처리
- 테스트용 Text Input Fallback
- 관계어와 이름 검색
- 후보가 여러 명이면 최대 3명
- 직접 전화 전 확인
- 안전한 경우 `ACTION_DIAL` Fallback
- 중복 실행 방지
- 전화번호 로그 마스킹
- 로컬 Audit Log
- TTS 또는 화면 결과 안내
- Mock mode
- 관련 Unit Test
- Type-check, Lint, Build
- 가능한 경우 실제 Android 기기 QA 체크리스트

첫 Slice에 다음을 넣지 않는다.

- 업체 검색
- 통화 내용 자동 녹음
- 금융 기능
- 보호자 대시보드
- 범용 Accessibility
- 복잡한 디자인
- 모든 AI Tool 구현
- 불필요한 백엔드

---

## 11. 이후 Slice

첫 Slice가 검증된 후에만 다음 우선순위로 진행한다.

### Slice 2
생활 서비스 업체 검색 → 최대 3개 결과 → 선택 → 확인 → 전화

실제 유료 API 대신 Provider Adapter와 Mock Provider부터 만든다.

### Slice 3
통화 종료 또는 Mock 이벤트 → 테스트 Transcript → 할 일 추출 → 항목별 확인 → 알림 생성

실제 통화 녹음은 하지 않는다.

### Slice 4
보호자 연결, 도움 요청, 동의 기반 감사 기록

### Slice 5
공식 Intent·Deep Link 중심의 앱 실행과 제한적인 Android Action

---

## 12. 금융 기능 제한

현재 MVP:

- 은행 앱 열기
- 공식 고객센터 연결
- 단계별 설명

구현 금지:

- 자동 송금
- 자동 결제
- OTP·비밀번호 입력
- Accessibility로 은행 보안 화면 조작
- 비공식 금융 API

실제 금융 실행은 공식 API, 법적 검토, 강한 인증, 거래 서명, 한도, 수취인 Allowlist, 이상 탐지, 감사 로그가 확보된 별도 Phase에서만 검토한다.

---

## 13. 작업 방식

다음 루프를 반복한다.

```text
DISCOVER
→ DEFINE
→ PLAN
→ EXECUTE
→ VERIFY
→ REVIEW
→ RECORD
→ DECIDE
```

### DISCOVER
현재 Task와 관련된 파일만 검색해 읽는다. 전체 저장소를 무작정 읽지 않는다.

### DEFINE
다음 Task Contract를 작성한다.

- Objective
- Success criteria
- In scope
- Out of scope
- Constraints
- Risk level
- Likely files
- Validation
- Approval gates
- Stop conditions

### PLAN
가장 작은 실행 가능한 Slice로 나눈다. 각 Step에 Output, Files, Risk, Validation, Rollback을 적는다.

### EXECUTE
한 번에 하나의 Active Task만 수행한다. 작은 Diff, 기존 Pattern, 최소 Dependency를 우선한다.

### VERIFY
변경 파일 검토 → 관련 Unit Test → Type-check → Lint → Integration → Build → 가능한 E2E/기기 검증 → Git diff → Acceptance Criteria 순서로 검증한다.

### REVIEW
과도한 복잡성, 권한, 개인정보, 회귀, 문서 불일치를 자체 검토한다.

### RECORD
`IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, 테스트, README를 현재 상태에 맞게 갱신한다.

### DECIDE
다음 Step, 오류 수정, 승인 요청, 완료 보고 중 하나를 선택한다. 범위를 임의로 확장하지 않는다.

---

## 14. 자율 진행 규칙

다음은 묻지 말고 스스로 결정한다.

- 기존 패턴에 맞는 파일 위치
- 낮은 위험의 내부 이름
- 테스트 파일 위치
- Mock 데이터
- 쉽게 되돌릴 수 있는 기본값
- 사소한 UI 문구
- 현재 Slice에 필요한 최소 내부 구조

불확실한 사항 처리:

1. 저장소에서 확인 가능 → 조사
2. 낮은 위험 기본값 가능 → 선택하고 기록
3. 사용자만 결정 가능하지만 현재 Slice에 불필요 → Backlog 또는 Assumption으로 기록하고 진행
4. 승인 Gate에 해당 → 그 지점에서만 중지

질문이 필요한 경우에도 이미 완료할 수 있는 분석, 문서, 테스트, Mock 작업은 먼저 끝낸다.

---

## 15. 변경 원칙

- 요청하지 않은 기능을 추가하지 않는다.
- 한 번만 쓰는 코드를 과도하게 추상화하지 않는다.
- 관련 없는 코드를 리팩터링하지 않는다.
- 기존 스타일을 따른다.
- 기존 Dead Code를 삭제하지 않는다.
- 새 변경이 만든 미사용 코드만 정리한다.
- 모든 변경 줄은 현재 Task와 연결되어야 한다.
- 200줄이 50줄로 가능하면 단순화한다.
- 완료를 주장하기 전에 증거를 남긴다.

---

## 16. 보안

- Secret은 환경변수 또는 Secret Manager에만 둔다.
- Service Role Key를 모바일에 넣지 않는다.
- `.env`, Key, 토큰, 비밀번호를 Commit하지 않는다.
- 전체 전화번호와 민감 데이터는 로그에 남기지 않는다.
- 외부 입력과 LLM 출력을 검증한다.
- 연락처 이름, 업체명, 화면 텍스트를 시스템 명령으로 취급하지 않는다.
- Prompt Injection 문구가 데이터에 포함돼도 명령으로 실행하지 않는다.
- 사용자 확인 없이 전화나 문자를 실행하지 않는다.
- 동일 requestId와 동일 Action의 중복 실행을 막는다.
- 권한이 거부돼도 안전하게 실패한다.
- 사용자별 데이터 소유권과 RLS를 적용한다.
- 외부 전송 전에 동의와 전송 범위를 표시한다.

---

## 17. 반복 한도

- 동일 오류 재시도: 1회
- 동일 Tool을 같은 입력으로 반복 실행: 금지
- 자동 Repair: 1회
- 자동 평가·수정 루프: 최대 2회
- 파괴적 작업: 승인 전 금지
- 유료 외부 호출: 승인 전 금지

한도에 도달하면 현재 상태, 최초 오류, 시도한 수정, 남은 원인 후보, 안전한 다음 행동을 기록한다.

---

## 18. 지금 바로 수행할 순서

1. 루트 `CLAUDE.md`와 관련 docs를 읽는다.
2. 현재 작업 디렉터리와 Git 상태를 확인한다.
3. 두 기존 저장소를 조사한다.
4. 재사용 매트릭스를 작성한다.
5. 새 `ai-myeoneuri` 프로젝트가 있는지 확인한다.
6. 없으면 안전한 로컬 Scaffold를 생성한다.
7. 필수 운영 문서를 생성하거나 병합한다.
8. 실제 package manager와 검증 명령을 확정한다.
9. Task Contract와 우선순위 Queue를 기록한다.
10. 첫 Vertical Slice를 구현한다.
11. 테스트, Type-check, Lint, Build를 실행한다.
12. Git diff와 Secret 위험을 검토한다.
13. 실패가 있으면 한도 안에서 최소 수정하고 재검증한다.
14. 문서와 코드 상태를 맞춘다.
15. 다음 보고 형식으로 결과를 출력한다.

```text
[Objective]

[Result]

[Repository findings]

[Reuse matrix]

[Changed]
- created
- modified
- deleted

[Evidence]
- commands
- tests
- type-check
- lint
- build
- device/manual QA
- git diff

[Decisions]

[Known limitations]

[Next priority]

[Approval needed]
```

단순 분석 보고만 하고 끝내지 마라.  
승인 Gate에 걸리지 않는 한 **계획 → 구현 → 검증 → 기록까지 계속 진행하라.**
