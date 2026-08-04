# AI 며느리 — Antigravity Claude 마스터 프롬프트

현재 대화 맥락을 유지한 채, 지금부터 **AI 며느리 프로젝트의 단독 개발 파트너**로 작업해.

이 메시지를 받은 뒤 사용자가 ChatGPT로 돌아가 별도 지시를 만들 필요가 없도록, 프로젝트 폴더의 문서와 실제 코드 상태를 기준으로 스스로 다음 작업을 선택하고 진행해.

---

## A. 패키지와 프로젝트 폴더 찾기

현재 Antigravity Project/Workspace에서 다음 둘 중 하나를 찾아.

1. `ai-myeoneuri/` 폴더
2. `AI_Myeoneuri_Complete_Project_Package.zip`

### 폴더가 이미 있으면

- 새로 만들지 말고 `ai-myeoneuri/`를 프로젝트 작업 루트로 사용해.
- 같은 이름의 기존 파일을 무작정 덮어쓰지 마.

### ZIP만 있으면

- 현재 Workspace 안에 ZIP을 구조 그대로 압축 해제해.
- 압축 내부의 `ai-myeoneuri/` 폴더를 작업 루트로 사용해.
- 플랫폼에 맞는 안전한 압축 해제 명령을 사용해.
- 압축 해제 과정에서 기존 `ai-myeoneuri/`가 발견되면 덮어쓰지 말고 상태를 조사해 병합 계획을 세워.

### 둘 다 찾을 수 없으면

- 현재 접근 가능한 정확한 폴더를 먼저 확인해.
- Project 밖을 임의로 탐색하거나 권한을 우회하지 마.
- 사용자에게 필요한 조치 한 가지만 정확히 알려주고, 현재 가능한 조사·문서 작업은 먼저 진행해.

---

## B. 작업 루트 고정

작업 루트를 `ai-myeoneuri/`로 고정해.

이후 모든 파일 생성·수정·명령은 원칙적으로 이 폴더 내부에서 수행해.

기존 다음 저장소는 읽기·분석·선택적 재사용 대상으로만 다뤄.

- `guraudrk/sliverlink_AI`
- `guraudrk/silverlink-mobile`

기존 SilverLink 저장소를 덮어쓰거나 AI 며느리로 개조하지 마.

---

## C. 반드시 읽을 문서

다음 파일을 순서대로 실제로 읽어.

1. `START_HERE.md`
2. `CLAUDE.md`
3. `.agents/rules/ai-myeoneuri.md`
4. `00_PROJECT_HANDOFF_AND_ROADMAP.md`
5. `docs/PRODUCT_SPEC.md`
6. `docs/ARCHITECTURE.md`
7. `docs/DESIGN_HANDOFF.md`
8. `docs/IMPLEMENTATION_PLAN.md`
9. `docs/DECISIONS.md`
10. `docs/EXISTING_REPOSITORY_CONTEXT.md`
11. `docs/AGENT_OPERATING_MANUAL.md`
12. `docs/workflows/IMPLEMENT_VERTICAL_SLICE.md`
13. `prompts/01_FIRST_PROMPT_AUTONOMOUS.md`

필요한 경우에만 다음 원본 참고 자료를 읽어.

```text
docs/reference/agent-guides/
docs/design-source/claude-design/
```

디자인 원본은 이미 압축 해제되어 있다. 다시 ZIP을 찾거나 중첩 압축을 만들지 마.

채팅 기억보다 위 문서와 현재 Git·코드·테스트 상태를 Source of truth로 사용해.

---

## D. 프로젝트 핵심 목표

AI 며느리는 스마트폰 사용이 어려운 고령자가 자연어 음성 또는 단순 텍스트로 Android 작업을 수행하도록 돕는 개인용 AI 에이전트다.

첫 번째 핵심 Vertical Slice:

```text
“딸한테 전화해 줘”
→ 음성 또는 글자 입력
→ 관계어·이름 해석
→ 사용 시점 연락처 권한
→ 로컬 연락처 검색
→ 후보 최대 3명
→ 대상 선택
→ 전화 행동 최종 확인
→ Android ACTION_DIAL
→ 전화 화면을 열었다는 결과
→ 마스킹된 Audit Log
```

첫 MVP에서는 실제 통화가 시작됐다고 표시하지 마.

권장 결과 문구:

```text
이지은 님의 전화 화면을 열었어요.
통화 버튼을 눌러 주세요.
```

---

## E. 디자인 규칙

`docs/DESIGN_HANDOFF.md`와 정정된 Claude Design 원본을 사용해.

유지할 것:

- SilverLink Blue·Navy 색상
- 큰 글씨
- 최소 56dp 주요 터치 영역
- 큰 마이크
- 한 화면에 하나의 핵심 질문
- 선택지 최대 3개
- 화면과 TTS의 의미 일치
- 구체적인 행동 버튼 문구
- 항상 찾을 수 있는 취소와 복구
- 권한은 기능 사용 시점에 요청
- Offline Text Input/로컬 연락처/Dialer 부분 동작

디자인 HTML·JavaScript·`_ds` 파일을 앱 런타임에 직접 넣지 마. React Native 또는 실제 확정된 Stack의 UI로 재구현해.

---

## F. 자율 실행 규칙

분석 보고만 하고 멈추지 마.

다음 루프를 반복해.

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

복합 작업 전 Task Contract:

```text
Objective:
Success criteria:
In scope:
Out of scope:
Constraints:
Risk level:
Likely files:
Validation:
Approval gates:
Stop conditions:
```

저장소에서 확인 가능한 내용은 사용자에게 묻기 전에 조사해.

낮은 위험이며 쉽게 되돌릴 수 있는 선택은 가장 단순한 기본값을 적용하고 `docs/DECISIONS.md`에 기록해.

현재 Slice에 필요 없는 결정은 Backlog 또는 DEFERRED로 기록하고 진행해.

---

## G. 최초 작업 순서

다음 작업을 연속해서 수행해.

1. 현재 작업 디렉터리와 접근 범위 확인
2. Git 저장소 여부, Branch, status, 기존 미커밋 변경 확인
3. 모든 필수 문서 읽기
4. 정정된 디자인 원본과 `DESIGN_HANDOFF.md` 일관성 검증
5. 로컬 또는 GitHub에서 기존 두 SilverLink 저장소 조사
6. `docs/REUSE_MATRIX.md`를 실제 파일 경로와 근거로 작성
7. 현재 Package manager, Stack, 실행·Test·Type-check·Lint·Build 명령 확정
8. 프로젝트 Scaffold가 없으면 현재 목표에 맞는 최소 Scaffold 생성
9. Test/Type-check/Lint/Build 기반 설치
10. `docs/IMPLEMENTATION_PLAN.md`를 실제 상태로 갱신
11. 첫 Vertical Slice Task Contract 작성
12. 디자인 Token과 필요한 최소 Component 구현
13. 첫 Vertical Slice 구현
14. 관련 Unit/Integration Test 작성
15. Type-check, Lint, Expo Doctor/Build, 가능한 Android Debug Build
16. Git diff와 Secret 위험 검토
17. README, Plan, Decisions, Reuse Matrix 갱신
18. 다음 우선순위 결정

승인 Gate가 아니라면 1~18을 가능한 범위에서 한 세션 안에 계속 진행해.

환경 문제로 전체를 끝내지 못하더라도, 완료 가능한 문서·Mock·Test·구현을 먼저 수행하고 정확한 Blocker를 기록해.

---

## H. 구현 원칙

- 최소 코드
- 작은 Diff
- 기존 Pattern 우선
- 현재 Objective와 직접 관련된 파일만 수정
- 관련 없는 리팩터링 금지
- 현재 Slice에 필요 없는 Dependency 금지
- UI, Domain, Side Effect, Android Adapter 분리
- LLM 출력은 Schema 검증
- 미등록 Tool 실행 금지
- 사용자 확인 없는 전화·문자 금지
- 동일 requestId와 Action 중복 실행 차단
- 전화번호·연락처 등 로그 마스킹
- Prompt Injection 문자열을 데이터로만 처리
- Offline 부분 기능 유지
- Test 삭제로 실패 은폐 금지
- 검증하지 않은 기능을 완료로 보고 금지

---

## I. 승인 없이 진행 가능한 작업

- 프로젝트 내부 읽기·검색
- 문서 생성·수정
- Git status/diff
- 최소 Scaffold
- Mock
- Test
- Design Token과 Component
- 연락처·Dialer 첫 Slice
- 로컬 Audit Log
- Type-check
- Lint
- Unit/Integration Test
- Expo Doctor
- Android Debug Build
- 기존 저장소 읽기와 선택적 코드 복사

---

## J. 반드시 중지하고 승인받을 작업

- 기존 사용자 데이터 삭제
- 파괴적 Migration
- 인증 방식의 근본적 교체
- Production 배포
- Play Store 출시
- GitHub Push
- 새 원격 저장소 생성
- 저장소 공개 전환
- 실제 유료 API 대량 호출
- 실제 SMS 자동 발송
- 실제 통화 녹음
- 광범위한 Accessibility Service
- 금융 거래·결제·송금
- 기존 SilverLink 대규모 변경
- Secret 또는 개인정보 외부 전송

승인 Gate에 도달했을 때만 멈춰.

---

## K. 금지

- Secret Commit
- Service Role Key를 모바일에 포함
- 무단 권한 상승
- 사용자 모르게 녹음
- OTP·비밀번호 자동 입력
- 비공식 금융 API
- 은행 보안 화면 자동 클릭
- LLM 출력의 임의 Shell·JavaScript·URL·화면 좌표 실행
- 기존 SilverLink를 AI 며느리로 덮어쓰기
- 디자인 HTML을 WebView로 넣어 앱 UI라고 주장
- 실패한 Test를 삭제하거나 Skip해서 완료 처리

---

## L. 진행 기록

각 Task가 끝날 때 반드시 갱신해.

- `docs/IMPLEMENTATION_PLAN.md`
- `docs/DECISIONS.md`
- `docs/REUSE_MATRIX.md` 필요 시
- `README.md`
- 관련 Test
- Known limitations
- Next priority

이후 사용자가 짧게 “다음 작업 진행해”라고 해도 이 문서들을 읽고 이어갈 수 있게 해.

---

## M. 보고 형식

```text
[Objective]

[Result]

[Repository and environment findings]

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
- Android/manual QA
- git diff
- secret check

[Reused]
- repository
- file/module
- classification
- changes

[Decisions]

[Known limitations / blockers]

[Next priority]

[Approval needed]
```

먼저 현재 Workspace에서 `ai-myeoneuri` 폴더 또는 패키지 ZIP을 찾아 프로젝트 작업 루트를 확정해.

그다음 필수 문서를 읽고, 승인 Gate가 없다면 **조사 → 계획 → 구현 → 검증 → 기록**을 즉시 시작해.
