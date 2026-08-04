# Design Handoff — AI 며느리 Android MVP

## 1. Source files

정정된 Claude Design 원본:

```text
docs/design-source/claude-design/
├─ AI 며느리 Design Spec.dc.html
├─ AI 며느리 Prototype.dc.html
├─ android-frame.jsx
├─ doc-page.js
├─ support.js
├─ uploads/03_CLAUDE_DESIGN_BRIEF.md
└─ _ds/nocturne-.../
   ├─ _ds_manifest.json
   ├─ readme.md
   └─ styles.css
```

이 파일들은 디자인 참고 원본이다. 앱 런타임에 직접 포함하지 않는다.

## 2. Design direction

- 따뜻하지만 유아용처럼 보이지 않음
- 침착하고 신뢰할 수 있음
- 공공 서비스 수준의 안정감
- 복잡한 Dashboard를 피함
- AI·로봇·특정 여성 캐릭터를 브랜드 중심으로 사용하지 않음
- 기존 SilverLink Blue·Navy 계열과 시각적 연속성 유지

## 3. Color tokens

```text
background          #F5F7FB
surface/card         #FFFFFF
surface-alt          #EEF2FF
border               #E7EBF3
border-light         #F0F3F9

text-primary         #101828
text-secondary       #475467
text-strong          #344054
text-muted           #667085
placeholder          #98A2B3

primary              #2E5BFF
primary-pressed      #234AE0
primary-tint         #EEF2FF
primary-border       #DCE4FF

navy-deep            #12183F
navy-mid             #1B2660
accent-blue          #5B8CFF
navy-sub             #A7B4E8

success              #12B76A
success-bg           #ECFDF3
success-text         #087443

warning              #F79009
warning-bg           #FFFAEB
warning-text         #93370D

danger               #F04438
danger-bg             #FEF3F2
danger-text           #B42318
danger-border         #FECDCA
```

## 4. Typography and touch

- 본문: 최소 20sp 수준
- 핵심 질문: 24~28sp 이상 검토
- Button label: 20sp 수준
- 주요 Touch target: 최소 56dp
- 핵심 마이크: 약 148dp 검토
- 작은 Icon-only 버튼 금지
- 충분한 줄간격과 버튼 간격
- 큰 글자 설정에서 Layout이 깨지지 않아야 함

## 5. Primary flow A

```text
홈
→ 마이크 또는 글자 입력
→ 듣는 중/입력 중
→ 인식 문장 확인
→ 필요 시 연락처 권한 설명·요청
→ 연락처 후보 최대 3개
→ 대상 선택
→ 최종 전화 확인
→ ACTION_DIAL
→ 전화 화면을 열었다는 결과
```

### Confirmation copy

```text
딸 이지은 님에게
지금 전화할까요?
```

Buttons:

```text
전화할게요
전화하지 않을게요
```

### Dial result copy

```text
이지은 님의 전화 화면을 열었어요.
통화 버튼을 눌러 주세요.
```

`ACTION_DIAL` 상태에서 “통화를 시작했어요”라고 표현하지 않는다.

## 6. Required screens/states

- Home/Idle
- Listening
- Text input
- Processing
- Recognized text confirmation
- Microphone permission explanation/denied
- Contacts permission explanation/denied
- Contact no result
- Contact single result
- Contact multiple results (max 3)
- Final call confirmation
- Opening Dialer
- Dialer opened result
- Cancelled
- Duplicate blocked
- Offline partial mode
- Generic error/recovery
- Recent requests
- Settings
- Guardian help request

## 7. Component inventory

- `LargeMicrophoneButton`
- `PrimaryActionButton`
- `SecondaryActionButton`
- `CancelActionButton`
- `ListeningIndicator`
- `TranscriptPanel`
- `PermissionExplanation`
- `ContactCandidateCard`
- `ConfirmationPanel`
- `StatusMessage`
- `ErrorRecoveryPanel`
- `BottomActionArea`
- `GuardianHelpAction`
- `AccessibilitySettingRow`

Components require:

- Default
- Pressed
- Focused
- Disabled
- Loading
- Success
- Error

## 8. Permission timing

권한은 기능 사용 시점에 요청한다.

- 마이크: 마이크를 처음 누를 때
- 연락처: 연락처 명령에서 처음 검색할 때
- 알림: 첫 알림을 만들 때
- 전화 권한: ACTION_CALL을 별도 도입하는 경우에만

권한 화면에는:

- 필요한 이유
- 허용 시 가능한 기능
- 거부해도 가능한 대안
- 설정 이동
- 글자 입력
- 홈/취소

를 제공한다.

## 9. Android behavior

- 확인 화면 전까지 Back/Cancel 허용
- Intent 실행 중 장시간 뒤로 가기를 차단하지 않음
- Dialer가 열린 후 Android 시스템 동작을 따름
- 앱 복귀 시 이전 요청을 중복 실행하지 않음
- `requestId`와 Action 상태로 중복 방지
- 전화번호는 화면에 필요한 수준만 표시하고 로그는 마스킹

## 10. Offline behavior

오프라인이어도 가능한 경로:

```text
글자 입력
→ 로컬 연락처 검색
→ 사용자 확인
→ ACTION_DIAL
```

Cloud STT나 LLM이 불가능하면 사용자에게 Text Input Fallback을 제시한다.

## 11. TTS/microcopy

- 존댓말
- 한 문장에 하나의 행동
- 기술 용어 금지
- 사용자 탓 금지
- 화면의 핵심 문장과 의미 일치
- 다시 듣기 제공

Good:

```text
연락처에서 딸을 찾고 있어요.
딸 이지은 님에게 지금 전화할까요?
연락처 사용이 허용되지 않았어요. 글자로 입력하거나 설정에서 허용할 수 있어요.
```

Bad:

```text
Intent Execution이 실패했습니다.
사용자 오류로 연락처를 찾지 못했습니다.
```

## 12. MVP exclusions in design

- 자동 송금·결제 화면
- 통화 녹음 동의 없는 흐름
- 범용 Accessibility 자동 조작
- 보호자 실시간 감시 Dashboard
- 의료 진단
- 선택지가 많은 복잡한 설정
- 웜 페이퍼·보라·주황을 주 브랜드 색상으로 복원하는 것

## 13. Developer handoff rule

화면 상태와 Action을 비즈니스 로직에서 분리한다. 디자인 변경 시 UI Layer만 교체할 수 있어야 한다.

Claude는 개발 시작 전 원본 HTML/JS/Token과 이 문서를 비교하여 불일치를 수정하되, 원본 디자인 파일은 직접 수정하지 않는다.
