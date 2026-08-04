# Existing Repository Context — Verify Before Reuse

이 문서는 이전 조사에서 확인된 참고 Snapshot이다. Claude는 실제 로컬 저장소 또는 GitHub의 현재 상태를 다시 확인하고 이 문서를 갱신해야 한다.

## 1. `guraudrk/sliverlink_AI`

이전 확인 내용:

- Next.js 16 계열
- React 19
- TypeScript
- Tailwind
- Supabase Auth/Postgres/pgvector/RLS
- Gemini Function Calling/Embeddings
- SMS/TTS/Kakao 관련 Provider
- Web Push
- 가족 Dashboard
- AI Care Call
- RAG Assistant와 Command 실행
- Prompt Injection/RLS Test
- Safety Alert
- Care Timeline
- Welfare worker Dashboard
- Weekly Report/Care Plan
- Role separation

재사용 후보:

- Auth/RLS Pattern
- Tool Calling/Schema Validation Pattern
- Prompt Injection 방어
- Audit/Safety logging
- Guardian/Family 관계 모델
- Design Token의 SilverLink Blue·Navy 값

제외 후보:

- 기존 가족·복지사 중심 Dashboard
- B2B/B2G 화면을 개인용 앱에 그대로 복사
- 현재 Slice에 필요 없는 Server/Provider

## 2. `guraudrk/silverlink-mobile`

이전 확인 내용:

- Expo 54 계열
- React Native 0.81 계열
- React 19
- Expo Router 6
- Supabase
- Contacts/FileSystem/WebView
- Android 연락처·전화 상태·통화 기록 관련 권한 흔적
- Kotlin Native 통화 이벤트/Deep Link Bridge
- 최근 시점에는 WebView Shell 전환과 배경 녹음 제거 작업이 있었음
- Android 14+ 및 Play Store 정책 때문에 Background microphone/recording 접근이 제거된 이력이 있음

재사용 후보:

- Expo/React Native Project Pattern
- Android Permission 요청 Pattern
- Contacts/Native Module 관련 코드
- Deep Link/Intent Bridge
- Duplicate prevention
- Call-state event의 합법적·비녹음 부분
- Android Build/EAS 설정

주의:

- 과거 통화 녹음 구현은 재사용하지 않는다.
- 최신 코드가 WebView Shell이면 새 AI 며느리 Native UI 구조와 맞는지 검토한다.
- 기존 권한을 그대로 복사하지 말고 현재 기능에 필요한 최소 권한만 사용한다.
- 최근 Commit과 Manifest/Gradle 상태를 반드시 재확인한다.

## 3. Required output from repository audit

`docs/REUSE_MATRIX.md`를 다음 형식으로 만든다.

| Source repo | File/module | Classification | Intended use | Required changes | Risk | Evidence |
|---|---|---|---|---|---|---|
| ... | ... | 그대로 재사용/수정 후/제외/확인 불가 | ... | ... | ... | path/test/commit |

문서나 기억만으로 재사용 결정을 확정하지 않는다. 실제 파일과 Test/Build 상태를 근거로 한다.
