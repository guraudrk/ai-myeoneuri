# AI 며느리 — 프로젝트 인수인계 및 실행 로드맵

이 문서는 ChatGPT에서 설계한 프로젝트 방향과 진행 순서를 Antigravity의 Claude에게 완전히 인계하기 위한 Source of truth다.

Claude는 이 문서를 읽은 뒤, 사용자가 ChatGPT로 다시 돌아오지 않아도 프로젝트 폴더 안의 문서와 현재 코드 상태를 기준으로 다음 작업을 결정하고 진행해야 한다.

---

## 1. 프로젝트 목적

가칭 **AI 며느리**는 스마트폰 사용이 어려운 고령자가 복잡한 메뉴를 배우지 않아도 자연어 음성으로 필요한 스마트폰 작업을 수행할 수 있도록 돕는 Android-first 개인용 AI 에이전트다.

핵심 흐름:

```text
사용자 음성/텍스트
→ 의도 구조화
→ 위험 판정
→ 필요한 사용자 확인
→ 결정론적인 Android 실행기
→ 결과 검증
→ 화면과 음성으로 결과 안내
→ 감사 로그
```

대표 사용 사례:

- “딸한테 전화해 줘.”
- “근처 보일러 수리공 찾아서 전화해 줘.”
- “아까 통화하면서 해야 한다고 한 일이 뭐였지?”
- “그 일을 내일 오전 10시에 알려줘.”
- “카카오톡 열어 줘.”
- “은행 앱을 열고 어디를 눌러야 하는지 알려줘.”

---

## 2. 기존 SilverLink와의 관계

AI 며느리는 기존 SilverLink를 대체하거나 덮어쓰는 프로젝트가 아니다.

### 기존 SilverLink

- 가족·보호자 중심 돌봄 관리
- 사회복지사·공공기관 업무
- 안부 확인
- 가족 연결
- 돌봄 기록과 보고서
- B2B/B2G 확장

### AI 며느리

- 고령자 본인이 직접 사용하는 개인용 앱
- 음성 중심 스마트폰 작업 보조
- 연락처 검색과 전화
- 생활 서비스 검색과 연락
- 통화 이후 할 일 정리
- 알림
- 제한적인 앱 실행
- 필요 시 보호자 도움 요청

기존 저장소의 공통 기술은 조사하고 선택적으로 재사용하되, 기존 제품 방향은 변경하지 않는다.

조사 대상:

1. `guraudrk/sliverlink_AI`
2. `guraudrk/silverlink-mobile`

---

## 3. 지금까지 확정된 디자인 방향

Claude Design이 만든 산출물을 정정하여 다음 기준을 확정했다.

### 유지할 것

- 첫 번째 핵심 흐름 전체
- 148dp 수준의 큰 마이크
- 본문 20sp 이상
- 핵심 문장 24~28sp 이상
- 주요 터치 영역 최소 56dp
- 한 화면에 하나의 핵심 질문
- 선택지 최대 3개
- 화면과 TTS의 핵심 문구 일치
- 구체적인 버튼 문구
- 연락처 후보 최대 3개
- 실행 전 대상·행동·시점 확인
- 항상 접근 가능한 취소와 오류 복구
- 큰 글자와 느린 음성 설정
- 보호자 도움 요청
- Component와 Design Token 구조

### 색상

기존 SilverLink의 Blue·Navy 디자인 DNA를 계승한다.

권장 토큰:

```text
Primary             #2E5BFF
Primary pressed     #234AE0
Primary tint        #EEF2FF
Primary border      #DCE4FF
Deep navy           #12183F
Mid navy            #1B2660
Accent blue         #5B8CFF
Background          #F5F7FB
Card                #FFFFFF
Text primary        #101828
Text secondary      #475467
Muted               #667085
Border               #E7EBF3
Success             #12B76A
Success background  #ECFDF3
Warning             #F79009
Warning background  #FFFAEB
Danger              #F04438
Danger background   #FEF3F2
```

### 수정된 UX 정책

- 첫 실행 때 모든 권한을 연속 요청하지 않는다.
- 권한은 기능을 처음 사용하는 시점에 요청한다.
- 첫 MVP 전화 실행은 `ACTION_DIAL`을 우선한다.
- Dialer를 열었을 때 “통화를 시작했다”고 표시하지 않는다.
- 권장 완료 문구:
  - “이지은 님의 전화 화면을 열었어요. 통화 버튼을 눌러 주세요.”
- 관계와 이름은 “딸 이지은 님”처럼 자연스럽게 표시한다.
- Intent 실행 전까지 사용자가 뒤로 가거나 취소할 수 있다.
- Dialer가 열린 후에는 Android 시스템 기본 동작을 따른다.
- 오프라인에서도 가능한 연락처 검색·텍스트 입력·Dialer 기능은 유지한다.
- Cloud STT나 업체 검색 등 인터넷이 필요한 기능만 별도로 제한한다.

정정된 Claude Design 원본은 앱 런타임 코드가 아니다. 화면과 토큰을 React Native로 재구현하고, `.dc.html`, JavaScript, `_ds` 파일은 `docs/design-source/`에서 참고 원본으로 보존한다.

---

## 4. 전체 진행 순서

### Phase 0 — 디자인 인수

1. 정정된 Claude Design ZIP을 `docs/design-source/claude-design/`에 압축 해제한다.
2. 디자인 원본을 분석한다.
3. `docs/DESIGN_HANDOFF.md`를 생성하거나 갱신한다.
4. 화면, 상태, Component, Token, 접근성, TTS, Android 동작을 개발 명세로 변환한다.
5. 디자인 원본은 직접 수정하지 않는다.

### Phase 1 — 프로젝트 기반

6. 새 프로젝트 `ai-myeoneuri`의 현재 상태와 Git 상태를 확인한다.
7. 프로젝트 루트의 `CLAUDE.md`를 읽는다.
8. 다음 문서를 생성하거나 병합한다.

```text
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

9. 기존 두 SilverLink 저장소에서 재사용 가능한 구현을 조사한다.
10. 각 모듈을 다음으로 분류한다.
    - 그대로 재사용
    - 수정 후 재사용
    - 제외
    - 확인 불가
11. 실제 package manager, Test, Type-check, Lint, Build 명령을 확정한다.

### Phase 2 — 디자인 기반 최소 UI

12. 전체 화면을 한 번에 구현하지 않는다.
13. 첫 Vertical Slice에 필요한 Token과 Component만 구현한다.

우선순위 Component:

- 큰 마이크 버튼
- Primary Action Button
- Secondary/Cancel Button
- 상태 안내
- 연락처 후보 카드
- 최종 확인 카드
- 권한 설명
- 오류와 복구 패널
- 하단 고정 Action 영역

14. UI와 비즈니스 로직을 분리한다.
15. Design 결과가 바뀌어도 Domain과 Android Adapter를 건드리지 않도록 한다.

### Phase 3 — 첫 Vertical Slice

16. 다음 흐름을 완성한다.

```text
음성 또는 텍스트로 “딸한테 전화해 줘”
→ 문장과 관계어 해석
→ 연락처 권한 설명 및 요청
→ 연락처 검색
→ 후보 최대 3명
→ 사용자 선택
→ 대상과 행동 최종 확인
→ ACTION_DIAL
→ 결과 안내
→ Audit Log
```

필수 처리:

- Text Input Fallback
- 권한 허용·거부
- 연락처 없음
- 단일 후보
- 복수 후보
- 동일 이름
- 후보 최대 3명
- 사용자 취소
- 사용자 확인 전 실행 차단
- 동일 requestId 중복 실행 차단
- 전화번호 로그 마스킹
- Offline 부분 동작
- Adapter 오류
- Prompt Injection 문자열을 일반 연락처 데이터로만 처리

17. Test를 작성한다.
18. Type-check, Lint, Unit Test, Expo Doctor, Android Build를 실행한다.
19. 가능한 경우 실제 Android 기기 QA 체크리스트를 작성한다.
20. 문서와 구현 상태를 동기화한다.

### Phase 4 — 실제 기기 검증과 디자인 보정

21. 테스트 연락처를 준비한다.

```text
딸 이지은
아들 이민수
이지은 회사
이지은 병원
```

22. 다음 발화를 검증한다.

```text
딸한테 전화해 줘
우리 딸한테 전화 걸어줘
이지은에게 전화해 줘
아들한테 전화해
```

23. 다음을 확인한다.

- 무엇을 눌러야 하는지 즉시 이해 가능한가
- 음성이 잘못 인식됐을 때 수정 가능한가
- 누구에게 전화하는지 명확한가
- 취소가 잘 보이는가
- 큰 글자에서 Layout이 깨지지 않는가
- Dialer가 올바른 번호로 열리는가
- 중복 실행되지 않는가
- 앱 복귀 후 상태가 정상인가

24. 실제 기기에서 발견한 문제만 디자인과 코드에 최소 수정한다.

### Phase 5 — 두 번째 Vertical Slice

25. 생활 서비스 검색:

```text
“근처 보일러 수리공 찾아서 전화해 줘”
→ 위치 설명과 권한
→ Provider Adapter
→ 업체 최대 3개
→ 업체 선택
→ 전화 확인
→ ACTION_DIAL
```

26. 처음에는 Mock Provider를 사용한다.
27. 유료 지도·검색 API는 승인 전 연결하지 않는다.

### Phase 6 — 세 번째 Vertical Slice

28. 통화 후 할 일 정리:

```text
통화 종료 또는 Mock 이벤트
→ 테스트 Transcript
→ 할 일 후보
→ 항목별 사용자 확인
→ 알림 생성
```

29. 실제 통화 자동 녹음은 하지 않는다.
30. 테스트 Transcript, 사용자가 제공한 파일, 공유된 음성 파일 등 합법적·명시적 입력만 사용한다.

### Phase 7 — 보호자와 동기화

31. 도움 요청과 동의 기반 보호자 연결을 구현한다.
32. 실시간 위치 추적, 전면 감시, 몰래 열람은 기본 기능으로 넣지 않는다.
33. 필요할 때 Supabase Auth, RLS, 사용자별 데이터 소유권을 연결한다.

### Phase 8 — 제한적인 앱 실행

34. 다음 우선순위를 따른다.

```text
공식 Android Intent
→ 공식 Deep Link
→ 공식 API
→ 사용자 안내형 UI
→ 제한적인 Accessibility
```

35. Accessibility Service는 마지막 수단이다.
36. 금융 앱은 열기와 단계별 안내까지만 허용한다.
37. 송금, 결제, OTP, 비밀번호 입력, 금융 화면 자동 클릭은 금지한다.

### Phase 9 — 사용자 테스트와 출시 준비

38. 고령자 1~3명에게 핵심 과제를 테스트한다.
39. 사용자가 멈추는 화면과 이해하지 못하는 표현을 기록한다.
40. 개인정보처리방침, 권한 설명, 데이터 삭제, Crash 대응, 실제 기기 호환성을 준비한다.
41. Production 배포와 스토어 출시는 명시적 승인 이후 진행한다.

---

## 5. 자율 작업 방식

Claude는 승인 Gate에 걸리지 않는 한 다음을 반복한다.

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

복합 Task는 다음 계약으로 시작한다.

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

낮은 위험의 결정은 저장소 패턴과 가장 단순한 되돌릴 수 있는 기본값을 사용하고 `docs/DECISIONS.md`에 기록한다.

저장소에서 알 수 있는 사실은 사용자에게 묻기 전에 조사한다.

---

## 6. 승인 없이 진행 가능한 작업

- 프로젝트 내부 파일 읽기·검색
- 문서 생성과 갱신
- Scaffold
- Mock
- Test
- 작은 기능 구현
- 디자인 Token과 Component 구현
- Type-check
- Lint
- Unit/Integration Test
- Expo Doctor
- Android Debug Build
- Git status와 diff
- 로컬 Audit Log
- 기존 저장소 읽기와 선택적 코드 복사

---

## 7. 반드시 승인이 필요한 작업

- 기존 사용자 데이터 삭제
- 파괴적 Migration
- 인증 방식의 근본적 교체
- Production 배포
- Play Store 출시
- GitHub Push 또는 새 원격 저장소 생성
- 저장소 공개 전환
- 실제 유료 API 대량 호출
- 실제 SMS 자동 발송
- 통화 녹음
- 광범위한 Accessibility Service
- 금융 거래·결제·송금
- 기존 SilverLink의 대규모 수정
- Secret 또는 개인정보의 외부 전송

---

## 8. 금지 사항

- Secret Commit
- Service Role Key를 모바일에 포함
- 사용자 모르게 통화 녹음
- OTP·비밀번호 자동 입력
- 비공식 금융 API
- 은행 보안 화면 우회
- LLM 출력의 임의 Shell·JavaScript·URL·화면 좌표 직접 실행
- 사용자 확인 없는 전화·문자
- 테스트 삭제로 실패 은폐
- 기존 SilverLink 제품을 AI 며느리로 덮어쓰기
- 디자인 HTML을 앱 런타임에 그대로 넣기
- 검증하지 않은 기능을 완료라고 보고하기

---

## 9. 완료 증거

“코드를 작성했다”는 완료가 아니다.

완료 보고에는 가능한 범위에서 다음이 포함되어야 한다.

- 변경 파일
- Test 결과
- Type-check
- Lint
- Build
- Android 실제 기기 또는 Manual QA
- Git diff
- Secret 확인
- Acceptance Criteria
- Known limitation
- 다음 우선순위
- 필요한 승인

---

## 10. Claude와 사용자 간 이후 운영 방식

Claude는 매 세션 시작 시 다음을 확인한다.

1. `CLAUDE.md`
2. 이 문서
3. `docs/IMPLEMENTATION_PLAN.md`
4. `docs/DECISIONS.md`
5. 현재 Git status
6. 실제 Test·Build 상태
7. 사용자의 최신 지시

사용자는 이후 Claude에게 다음처럼 짧게 지시할 수 있다.

```text
현재 운영 문서와 Implementation Plan을 읽고,
승인 Gate에 해당하지 않는 다음 최우선 Task를 진행해.
구현 후 테스트, Build, Diff 검토, 문서 갱신까지 완료해.
```

Claude는 이전 채팅 기억보다 저장소의 Source-of-truth 문서를 우선한다.

---

## 11. 최초 인수인계 완료 기준

Claude는 다음을 완료한 뒤 인수인계가 끝났다고 판단한다.

- 프로젝트 폴더와 Git 상태 확인
- 모든 인수인계 문서 읽기
- 정정 디자인 산출물 확인
- `DESIGN_HANDOFF.md` 작성 또는 검증
- 기존 SilverLink 재사용 조사 계획 수립
- 현재 Implementation Plan 생성
- 첫 Vertical Slice Task Contract 작성
- 승인 없이 가능한 첫 작업 시작
