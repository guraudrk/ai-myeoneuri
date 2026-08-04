# Implementation Plan — AI 며느리

Last updated: 2026-08-04

## Current phase

**Phase 0 완료 → Phase 1 (Design foundations) + Phase 2 (First vertical slice) 진행 중**

## Status legend

- READY
- IN_PROGRESS
- BLOCKED
- WAITING_APPROVAL
- VERIFYING
- DONE
- DEFERRED
- CANCELLED

## Phase 0 — Foundation

- [x] DONE — 현재 작업 디렉터리, Git, Branch, 미커밋 변경 조사
- [x] DONE — `CLAUDE.md`와 모든 Source-of-truth 문서 읽기
- [x] DONE — 정정된 Claude Design 원본 검증 (docs/design-source/claude-design/ 확인)
- [x] DONE — `docs/DESIGN_HANDOFF.md`와 원본 일관성 확인 (일치)
- [x] DONE — 기존 `guraudrk/silverlink-mobile` 조사 (Expo 54 + expo-contacts 확인)
- [ ] READY — 기존 `guraudrk/sliverlink_AI` 상세 조사 (Auth/RLS Pattern 확인)
- [x] DONE — 재사용 매트릭스 작성 (`docs/REUSE_MATRIX.md`)
- [x] DONE — 실제 Stack/Package manager/Build 명령 확정 (npm / Expo 54 / expo run:android)
- [x] DONE — 최소 Scaffold 생성 (git init, package.json, tsconfig, babel, app/, src/)
- [x] DONE — Test/Type-check/Lint/Build 기반 설치 (npm install 완료)

## Phase 1 — Design foundations for first slice

- [x] DONE — SilverLink Blue·Navy Design Token 구현 (`src/components/tokens.ts`)
- [x] DONE — 접근성 Typography/Spacing/Touch Token 구현 (20sp 본문, 56dp 터치, 148dp 마이크)
- [ ] READY — 큰 마이크 또는 Text Input UI (현재 TextInput Placeholder, 마이크 버튼 미구현)
- [ ] READY — Contact Candidate Card (현재 inline, 분리 컴포넌트 필요)
- [ ] READY — Confirmation Panel (현재 inline, 분리 컴포넌트 필요)
- [ ] READY — Permission Explanation (현재 텍스트만, 별도 화면 필요)
- [ ] READY — Loading/Error/Recovery 상태 (기본 구현, 개선 필요)
- [x] DONE — UI와 Domain/Adapter 경계 검증 (서비스 레이어 분리 완료)

## Phase 2 — First vertical slice

Objective:

```text
사용자가 "딸한테 전화해 줘"라고 입력하면
연락처 후보를 최대 3명까지 확인하고,
명시적 승인 후 Android Dialer를 열며,
권한 거부·취소·중복·오류를 안전하게 처리한다.
```

- [x] DONE — Text Input Fallback (app/index.tsx TextInput)
- [ ] READY — Speech Input Adapter interface/Mock (마이크 버튼 미구현)
- [x] DONE — 관계어·이름 Normalizer (`src/features/contacts/normalizer.ts`, 테스트 통과)
- [x] DONE — 연락처 Permission flow (Mock에서 허용/거부 분기 구현)
- [x] DONE — Contacts Adapter (인터페이스 + MockContactsAdapter)
- [x] DONE — 후보 0/1/N 및 최대 3명 (서비스 레이어 + 테스트)
- [x] DONE — 최종 사용자 확인 (확인 화면 + "전화할게요"/"전화하지 않을게요")
- [x] DONE — `ACTION_DIAL` Phone Adapter (인터페이스 + MockPhoneAdapter)
- [x] DONE — 중복 request/action 방지 (`src/security/dedup.ts`, 테스트 통과)
- [x] DONE — 마스킹된 Local Audit Log (`src/features/audit/auditLog.ts`, 테스트 통과)
- [x] DONE — 화면 결과 안내 ("이지은 님의 전화 화면을 열었어요. 통화 버튼을 눌러 주세요.")
- [x] DONE — Unit/Integration Test (28 tests, 전부 통과)
- [x] DONE — Type-check (tsc --noEmit 0 오류)
- [ ] READY — Lint (ESLint 미실행)
- [ ] READY — Expo Doctor
- [ ] READY — Android Build (expo prebuild 후 가능)
- [ ] DEFERRED — 실제 기기 QA 체크리스트
- [ ] READY — README/Decision/Plan 갱신 (진행 중)

## Phase 3 — Device QA and design correction

- [ ] DEFERRED — 테스트 연락처 시나리오
- [ ] DEFERRED — 실제 음성 발화
- [ ] DEFERRED — 큰 글자·긴 이름 Layout
- [ ] DEFERRED — Android Back/App resume
- [ ] DEFERRED — 발견된 문제의 최소 수정

## Phase 4 — Local business search

- [ ] DEFERRED — Provider interface
- [ ] DEFERRED — Mock Provider
- [ ] DEFERRED — 최대 3개 결과
- [ ] DEFERRED — 업체 선택과 전화 확인
- [ ] DEFERRED — 실제 Provider는 승인 후

## Phase 5 — Post-call task extraction

- [ ] DEFERRED — Mock call-end event
- [ ] DEFERRED — Test transcript input
- [ ] DEFERRED — Task extraction schema
- [ ] DEFERRED — 항목별 확인
- [ ] DEFERRED — Reminder Adapter
- [ ] DEFERRED — 실제 자동 통화 녹음 제외

## Phase 6 — Guardian and sync

- [ ] DEFERRED — 도움 요청
- [ ] DEFERRED — 동의 기반 보호자 연결
- [ ] DEFERRED — Supabase Auth/RLS
- [ ] DEFERRED — 개인정보·보존 정책

## Blockers

- 없음. 다음 단계는 ESLint 설정 + Expo prebuild + 실제 Android 빌드 확인.

## Next action

1. ESLint 실행 및 오류 수정
2. `expo prebuild` 실행 (Android 프로젝트 생성)
3. `./gradlew assembleDebug` Android Debug Build
4. 마이크 버튼 컴포넌트 추가 (Speech Input 인터페이스)
5. 실제 기기 QA 체크리스트 작성

## Stack confirmed

- Expo 54.0.0
- React Native 0.81.5
- Expo Router 6.0.24
- TypeScript 5.9.x strict mode
- Jest + jest-expo
- Package manager: npm
