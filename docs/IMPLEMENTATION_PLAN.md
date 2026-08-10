# Implementation Plan — AI 며느리

Last updated: 2026-08-08

> **2026-08-08 전면 동기화.** 직전 갱신은 2026-08-04(versionCode 12 무렵)였고,
> 그 사이 코드는 **versionCode 24**까지 나아갔다. 문서가 4일·12버전 뒤처져 있었고
> 이미 만든 것을 "미구현"으로 적어두고 있었다.
>
> 이번 갱신의 판정 근거는 **실제 파일과 git log**다. 근거 없는 항목은 근거 없다고 적었다.
> 아래 세 가지를 구분해서 표기한다.
>
> - `[코드확인]` — 파일을 직접 열어 존재와 내용을 확인함
> - `[실기기]` — work-log에 실기기 동작 기록이 있음
> - `[미검증]` — 코드는 있으나 이번 세션에서 실행·테스트로 확인하지 못함

## Current phase

**Phase 0~2 완료. Phase 4 완료. Phase 3·5 부분 완료.**
**Plan에 없던 Phase 7(앱 실행)·Phase 8(대화 비서)이 실제로 구현되어 뒤늦게 문서화함.**

지금의 병목은 기능이 아니라 **검증과 기록**이다.
신규 모듈 대부분에 테스트가 없고, 최근 4개월치 기술 결정이 `DECISIONS.md`에 없다.

## Status legend

- READY / IN_PROGRESS / BLOCKED / WAITING_APPROVAL / VERIFYING / DONE / DEFERRED / CANCELLED

---

## Phase 0 — Foundation

- [x] DONE — 작업 디렉터리·Git·Branch·미커밋 변경 조사
- [x] DONE — `CLAUDE.md`와 Source-of-truth 문서 읽기
- [x] DONE — Claude Design 원본 검증 (`docs/design-source/claude-design/`)
- [x] DONE — `docs/DESIGN_HANDOFF.md`와 원본 일관성 확인
- [x] DONE — `guraudrk/silverlink-mobile` 조사 (Expo 54 + expo-contacts)
- [ ] READY — `guraudrk/sliverlink_AI` 상세 조사 (Auth/RLS Pattern)
      → Phase 6(보호자 연동)에서 실제로 필요해질 때까지 착수하지 않는다
- [x] DONE — 재사용 매트릭스 (`docs/REUSE_MATRIX.md`)
- [x] DONE — Stack/Package manager/Build 명령 확정
- [x] DONE — 최소 Scaffold
- [x] DONE — Test/Type-check/Lint/Build 기반 설치

## Phase 1 — Design foundations

- [x] DONE — SilverLink Blue·Navy Design Token (`src/components/tokens.ts`, 109줄) `[코드확인]`
- [x] DONE — 접근성 Typography/Spacing/Touch Token (20sp 본문, 56dp 터치, 148dp 마이크)
- [x] **DONE** — 큰 마이크 버튼 (`src/components/LargeMicrophoneButton.tsx`, 164줄) `[코드확인]`
      *직전 Plan은 "미구현"으로 적혀 있었으나 사실이 아니었다*
- [x] **DONE** — Contact Candidate Card (`src/components/ContactCandidateCard.tsx`, 81줄) `[코드확인]`
      *직전 Plan은 "inline, 분리 필요"였으나 이미 분리되어 있었다*
- [x] **DONE** — Confirmation Panel (`src/components/ConfirmationPanel.tsx`, 111줄) `[코드확인]`
      *직전 Plan은 "inline, 분리 필요"였으나 이미 분리되어 있었다*
- [x] **DONE** — Business Candidate Card (`src/components/BusinessCandidateCard.tsx`, 204줄) `[코드확인]`
      *Plan에 없던 신규 컴포넌트*
- [ ] READY — Permission Explanation 별도 화면
      현재는 `app/index.tsx:410` 인라인 안내(`🔒 연락처 권한이 없어요.` / `🔒 위치 권한이 없어요.`)와
      `ExpoSpeechAdapter`의 시스템 다이얼로그 문구뿐. 별도 설명 화면은 아직 없다
- [x] DONE — 홈 화면 전면 재설계 (풀스크린 네이비 + 마이크 중심 레이아웃, v21) `[코드확인]`
- [ ] IN_PROGRESS — Loading/Error/Recovery 상태
      기본 구현됨(`ActivityIndicator`, `Alert`, `handleReset`). 화면별 일관성 점검 미완
- [x] DONE — UI와 Domain/Adapter 경계 검증 (서비스 레이어 분리)

## Phase 2 — First vertical slice (전화)

Objective:

```text
사용자가 "딸한테 전화해 줘"라고 말하면
연락처 후보를 최대 3명까지 확인하고,
명시적 승인 후 Android Dialer를 열며,
권한 거부·취소·중복·오류를 안전하게 처리한다.
```

- [x] DONE — Text Input Fallback (모달 방식, `app/index.tsx:360`) `[코드확인]`
- [x] **DONE** — Speech Input Adapter
      인터페이스 `SpeechInputAdapter.ts` + `MockSpeechAdapter.ts` + **실제 `ExpoSpeechAdapter.ts`(67줄)** `[코드확인]`
      expo-speech-recognition을 걷어내고 **커스텀 네이티브 `NativeSpeechRecognition` 모듈**로 교체함(2026-08-05)
      `RECORD_AUDIO` 런타임 권한 요청, `speechResult`/`speechError` 이벤트, 오류 코드별 한국어 안내 포함
- [x] DONE — 관계어·이름 Normalizer (`normalizer.ts`, 테스트 7개)
- [x] DONE — 연락처 Permission flow
- [x] DONE — Contacts Adapter (인터페이스 + Mock + `RealContactsAdapter`)
- [x] DONE — 후보 0/1/N 및 최대 3명
- [x] DONE — 최종 사용자 확인 화면
- [x] DONE — `ACTION_DIAL` Phone Adapter (인터페이스 + Mock + `RealPhoneAdapter`)
- [x] DONE — 중복 request/action 방지 (`security/dedup.ts`, 테스트 4개)
- [x] DONE — 마스킹된 Local Audit Log (`features/audit/auditLog.ts`, 테스트 8개)
- [x] DONE — 화면 결과 안내
- [x] **DONE** — 관계어 매핑 영속화 (`RelationshipMapper.ts`, AsyncStorage `relationship_map_v2`) `[코드확인]`
      "딸"을 한 번 지정하면 다음부터 바로 연결. Plan에 없던 항목
- [x] **DONE** — 즐겨찾기 (`FavoritesAdapter.ts` + 홈 화면 별표 버튼) `[코드확인]` — Plan에 없던 항목
- [ ] **VERIFYING** — Unit/Integration Test
      테스트 파일 4개 / `it`·`test` 선언 **29개** `[코드확인]`
      직전 Plan은 "28 tests 전부 통과"라고 적었으나 **이번 세션에서는 실행으로 확인하지 못했다**(샌드박스 시간 초과)
      → 다음 세션에서 `npm test`를 실제로 돌리고 통과 수를 여기 기록한다
- [ ] VERIFYING — Type-check `[미검증]` — 이번 세션 실행 실패. 재확인 필요
- [ ] VERIFYING — Lint `[미검증]` — 동일
- [ ] READY — Expo Doctor (`npm run doctor`)
- [x] DONE — Android Build (`assembleDebug` 성공)
- [x] **DONE** — debug APK 흰 화면 버그 해결 (`debuggableVariants = []`, v14) `[실기기]`
      원인: RN Gradle 플러그인이 debug 빌드에서 JS 번들 생성을 건너뛰어 Metro 없이는 React가 마운트되지 않음
- [x] **DONE** — `AnyTypeCache` 크래시 해결 (Expo 패키지 버전 불일치)
      → **`npx expo install`만 사용한다.** 캐럿(`^`) 직접 기입 금지

## Phase 3 — Device QA

- [x] **부분 DONE** — 앱 실행 실기기 확인 `[실기기]`
      유튜브·인스타그램·갤러리·토스·네이버·신한은행·쿠팡이츠 정상 작동(2026-08-07)
- [ ] READY — 앱 실행 나머지 실기기 확인 (work-log 2026-08-07 "미완료"에 명시)
      KB은행 · 캘린더 · ChatGPT
- [ ] READY — **복수 매칭(ambiguous) picker UI 흐름 검증**
      후보 표시 → 사용자 선택 → `InstalledApps.launch()` 까지. 미검증 상태
- [ ] READY — 전화 걸기 실기기 시나리오 (연락처 0/1/N, 권한 거부, 취소)
- [ ] READY — 실제 음성 발화 QA (`ExpoSpeechAdapter` 실기기 정확도, 사투리 포함)
- [ ] READY — 큰 글자·긴 이름 Layout
- [ ] READY — Android Back / App resume
- [ ] READY — 통합 QA 체크리스트 문서화 (`docs/QA_CHECKLIST.md` 신규)

### 실기기 없이는 판정 불가 — 가족 테스트에서 확인할 것

work-log 2026-08-07이 "검증 불가 항목"으로 남긴 것들이다. **코드로는 답이 안 나온다.**

- [ ] READY — 실제 어르신이 **TTS 속도를 편안하게 느끼는지** (현재 rate 0.82)
- [ ] READY — 시스템 프롬프트 강화가 **Gemini 응답 품질을 실제로 올렸는지**
- [ ] READY — 어르신이 마이크 버튼을 **누를 줄 아는지** (며느리 제품의 근본 가정)

## Phase 4 — Local business search — **완료**

*직전 Plan에는 전부 DEFERRED로 적혀 있었으나 실제로는 구현·실기기 검증까지 끝났다.*

- [x] DONE — Provider interface (`BusinessSearchAdapter.ts`) `[코드확인]`
- [x] DONE — Mock Provider (`MockBusinessSearchAdapter.ts`, 58줄)
- [x] DONE — **실제 Provider — Kakao 장소 검색** (`KakaoBusinessSearchAdapter.ts`, 76줄) `[코드확인]`
- [x] DONE — 위치 Adapter (`LocationAdapter.ts` + `RealLocationAdapter.ts`)
- [x] DONE — 결과 카드 + 거리 뱃지 (`BusinessCandidateCard.tsx`)
- [x] DONE — 업체 선택과 전화 확인 (`businessCallService.ts`)
- [x] DONE — **지역명 분기 검색**(2026-08-05)
      쿼리에 역/동/구/시가 있으면 `x`,`y`만 전송(관련도순), 없으면 `sort=distance`.
      `radius` 미전송으로 거리 제한 제거. "오목교역 근처 치킨집" 0건 문제 해결

> ⚠️ **승인 기록 확인 필요:** ADR에 "실제 Provider는 승인 후"라고 되어 있는데
> Kakao 도입에 대한 ADR이 `DECISIONS.md`에 없다. 사후 ADR 작성 대상 → Phase 9

## Phase 5 — Reminders / Post-call task extraction

- [x] **DONE** — 약 복용 알림 (`ReminderService.ts`, 73줄) `[코드확인]`
      `expo-notifications` DAILY 트리거, `medicine_reminders` 채널, AsyncStorage 영속화,
      알림 권한 요청 + 거부 시 안내, 홈 화면 추가/삭제 UI
- [x] **DONE** — `set_reminder` 인텐트 → 모달 자동 오픈 (`app/index.tsx:141`)
- [ ] DEFERRED — 통화 종료 이벤트 기반 할 일 추출
- [ ] DEFERRED — Task extraction schema / 항목별 확인
- [x] **CANCELLED** — 앱이 직접 마이크로 통화를 녹음하는 기능
      근거는 OS 제약이 아니라 **제품 결정**이다. `CLAUDE.md` §2 "통화 내용을 몰래 녹음하는 앱이 아니다" + ADR-008.
      며느리는 어르신 본인의 폰에 깔리므로, 통화 녹음은 신뢰 문제로 직결된다. 승인 없이 되살리지 않는다.

> ⚠️ **실버링크와 혼동 금지.** 실버링크에는 **삼성 통화녹음 파일 자동 수집**
> (`CallStateReceiver.findRecentCallRecording()` → 업로드 → AI 분석)이 **살아서 작동 중**이다.
> 그쪽에서 제거된 것은 "앱이 직접 마이크로 녹음하는 것"뿐이다.
> **며느리의 CANCELLED를 근거로 실버링크의 자동 수집을 건드리지 마라.** 서로 다른 제품, 다른 결정이다.

## Phase 6 — Guardian and sync — 미착수

- [ ] DEFERRED — 보호자 도움 요청
- [ ] DEFERRED — 동의 기반 보호자 연결
- [ ] DEFERRED — Supabase Auth/RLS
- [ ] DEFERRED — 개인정보·보존 정책

> 현재 앱은 **완전 local-first**다. 서버 없음, 계정 없음, 데이터는 전부 AsyncStorage.
> 이 성질은 개인정보 측면에서 강점이므로 Phase 6 착수 전 오너 승인을 받는다.

---

## Phase 7 — 앱 실행 (신규 문서화) — **완료**

*Plan에 존재하지 않았던 기능. v9~v20에 걸쳐 구현되어 뒤늦게 기록한다.*

- [x] DONE — `InstalledApps` 네이티브 모듈 (PackageManager 조회 + `launch()`) `[코드확인]`
- [x] DONE — Android 11+ 패키지 가시성 (`AndroidManifest.xml`의 `queries` 블록)
      `ACTION_MAIN` + `CATEGORY_LAUNCHER`
- [x] DONE — 3순위 실행 경로 (`openAppByName`, `intentParser.ts:93`)
      1순위 커스텀 URI 스킴(`vnd.youtube:` 등) → 2·3순위 `InstalledApps.launch(packageName)`
- [x] DONE — `Linking.openURL("intent:#Intent;package=...")` 제거
      ACTION·CATEGORY가 없어 `ActivityNotFoundException` 발생하던 문제
- [x] DONE — 후보 다수일 때 선택 UI (`OpenAppResult.ambiguous` + `AppCandidate[]`)
- [x] DONE — ALIASES 퍼지매칭 제거 → `parseIntent` 프롬프트가 `package_name`을 직접 반환
      Gemini 2회 호출 시 503이 발생해 **1회 호출 구조로 확정**
- [x] DONE — 실기기 확인 `[실기기]`

## Phase 8 — 대화 비서 기능 (신규 문서화) — **대부분 완료**

- [x] DONE — 인텐트 분류 (`ParsedIntent` 8종) `[코드확인]`
      `call_contact` / `search_business` / `set_reminder` / `general_question` /
      `safety_concern` / `open_app` / `sos` / `unknown`
- [x] DONE — 일반 질문 답변 (`askGemini`) + **Google Search 그라운딩**(`tools:[{google_search:{}}]`)
      학습 컷오프로 날짜·환율·주가가 틀리던 문제 해결(2026-08-05)
- [x] DONE — 호출 2단계 분리 (1차 JSON 분류만 / 2차 질문 원문 그대로)
      1회 호출 시 Gemini가 프롬프트 예시 답변을 복사하던 문제 해결
- [x] DONE — TTS 자동 읽기 (`TtsService.ts`, 109줄) + 마크다운 제거(`stripMarkdown`)
- [x] DONE — 어르신 특화 응답 튜닝 (시스템 프롬프트 강화 + TTS 포매터, v23)
- [x] DONE — 답변 잘림·TTS 보이스·전화 관계어 인식 3종 수정 (v24)
- [x] DONE — 안전 신호 감지 (`SafetyCategory` 7종 → `SafetySeverity` 정적 매핑)
      실버링크 `safety-alert-analyzer` 로직 참고
- [x] DONE — 대화 로그 (`ConversationLogService.ts`, 최근 20건, 오늘 기록 표시)
- [x] DONE — SOS 인텐트 → 119 확인 화면 (`app/index.tsx:624`)
- [ ] READY — `sanitizeForPrompt` 실제 구현
      `security/promptInjection.ts`가 현재 **값을 그대로 반환하는 자리표시자**다.
      주석에도 "호출자가 system/user 분리를 지켜야 함"이라고만 되어 있다.
      연락처 이름이 프롬프트에 들어가므로 실제 방어가 필요하다

---

## Phase 9 — 문서·검증 부채 정리 (신규) — **지금의 최우선**

기능은 앞서 있고 기록과 검증이 뒤처져 있다. 이 부채를 먼저 갚는다.

- [ ] **IN_PROGRESS** — 이 Plan을 실제 코드와 동기화 (2026-08-08 완료분)
- [ ] READY — **신규 모듈 테스트 작성** — 아래는 전부 테스트가 없다 `[코드확인]`
      `intentParser` (306줄, 가장 큰 모듈) / `TtsService` / `ConversationLogService` /
      `FavoritesAdapter` / `ReminderService` / `RelationshipMapper` /
      `businessCallService` / `KakaoBusinessSearchAdapter` / `riskPolicy`
      → 우선순위 1위는 `intentParser`의 순수 함수부(`norm`, `localMatchApps`, `safetyseverity`)
- [ ] READY — **사후 ADR 작성** — `DECISIONS.md`가 ADR-011에서 멈춰 있다. 누락된 결정:
      - Kakao 장소 검색 API 실제 도입 (외부 유료 API)
      - Gemini Google Search 그라운딩 도입
      - expo-speech-recognition → 커스텀 네이티브 SpeechRecognizer 교체
      - 앱 실행을 `PackageManager` 방식으로 확정 (Intent URI 폐기)
      - Gemini 호출을 1회로 고정 (2회 시 503)
      - 로컬 전용 저장 유지 (서버·계정 없음)
- [ ] READY — `npm test` / `npm run typecheck` / `npm run lint` 실제 실행 후 결과 기록
- [ ] READY — `README.md` 갱신 (현재 기능 목록이 실제와 다름)

---

## Blockers

- 없음. (기술적 막힘은 없고, 미결 **결정**이 하나 있음 ↓)

## API 키 노출 — 오너가 처리 완료

- [x] **DONE (오너 처리, 2026-08-08)** — Gemini / Kakao API 키 노출 대응

      배경: `EXPO_PUBLIC_` 접두사가 붙은 값은 JS 번들에 평문으로 들어가므로
      APK를 풀면 키를 읽을 수 있었다. **오너가 2026-08-08 처리 완료했다고 확인함.**

      ✅ git 유출은 애초에 없었음 — `.gitignore`에 있고 `git log -S`에도 잡히지 않음

- [ ] READY — **처리 방법을 `DECISIONS.md`에 기록** (사후 ADR)
      오너가 어떤 방법으로 해결했는지가 문서에 남아 있지 않다.
      (앱 제한 키 교체인지 / 프록시 경유인지 / 키 재발급인지)
      **에이전트가 추측해서 적지 않는다. 오너에게 한 문장으로 물어 확인한 뒤 기록한다.**
      기록이 없으면 다음 세션에서 같은 걱정을 반복하게 된다.

## Next action

1. **Phase 9** — `npm test` / `typecheck` / `lint` 실행하고 결과를 이 문서에 기록
2. **Phase 9** — `intentParser` 순수 함수 테스트부터 작성
3. **Phase 9** — 누락 ADR 6건을 `DECISIONS.md`에 사후 기록
4. **Phase 1** — Permission Explanation 화면
5. **Phase 8** — `sanitizeForPrompt` 실제 구현
6. **Phase 3** — 전화 걸기 실기기 QA 체크리스트

> 새 기능을 만들기 전에 1~3을 끝낸다.
> 지금 이 프로젝트의 위험은 "기능이 없는 것"이 아니라 **"만든 것을 검증하지 않은 것"**이다.

## Stack confirmed

- Expo 54.0.0 / React Native 0.81.5 / Expo Router 6.0.24
- TypeScript 5.9.x strict mode
- Jest + jest-expo (`jest --passWithNoTests` — ⚠️ 테스트 0개여도 통과하므로 개수를 눈으로 확인할 것)
- Package manager: npm (**Expo 패키지는 반드시 `npx expo install`**)
- Android only / `applicationId com.leejanghan.aimyeoneuri` / versionCode 24 / versionName 0.1.0
- 외부 의존: Gemini 2.5 Flash (직접 호출) · Kakao Local Search · expo-notifications
- 저장소: 전부 로컬 AsyncStorage. 서버·계정 없음
