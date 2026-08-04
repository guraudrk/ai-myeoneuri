# Reuse Matrix — 2026-08-04

| Source repo | File/module | Classification | Intended use | Required changes | Risk | Evidence |
|---|---|---|---|---|---|---|
| guraudrk/silverlink-mobile | `package.json` — Expo 54, expo-contacts, expo-router, RN 0.81.5, TypeScript 5.9 | 수정 후 재사용 | Stack 버전 기준 참조; 불필요한 Supabase·WebView 의존성 제외하고 재구성 | devDependencies 재구성, Supabase 제거 | Low | 로컬 파일 확인 |
| guraudrk/silverlink-mobile | `modules/` (Kotlin Native 모듈) | 확인 필요 | 연락처·전화 Native Bridge 재사용 후보; 현재 Slice에서는 Mock으로 대체 | 현재 Slice에서 미사용; Phase 2 실기기 연동 시 재검토 | Medium | 로컬 파일 확인 (구조만) |
| guraudrk/sliverlink_AI | Design Token (SilverLink Blue·Navy) | 수정 후 재사용 | `src/components/tokens.ts`에 직접 구현 | 기존 Tailwind CSS 값을 RN StyleSheet 값으로 변환 | Low | `docs/DESIGN_HANDOFF.md` |
| guraudrk/sliverlink_AI | Prompt Injection 방어 패턴 | 수정 후 재사용 | `src/security/promptInjection.ts`에 개념 반영; 실제 코드는 새로 작성 | Web→Mobile 환경 차이로 재구현 | Low | `src/security/promptInjection.ts` |
| guraudrk/sliverlink_AI | 전화번호 마스킹 로직 | 수정 후 재사용 | `src/features/audit/auditLog.ts`에 독립 구현 | 코드 직접 복사 없이 동일 개념 구현 | Low | `tests/auditLog.test.ts` |
| guraudrk/sliverlink_AI | Supabase Auth/RLS Pattern | 확인 필요 | Phase 6 보호자 동기화 시 재검토 | 현재 Slice에서 미사용 | Medium | 미검토 |
| guraudrk/silverlink-mobile | 통화 녹음 관련 코드 | 제외 | ADR-008: MVP에서 통화 자동 녹음 제외 | N/A | N/A | DECISIONS.md ADR-008 |
| guraudrk/silverlink-mobile | WebView Shell 코드 | 제외 | AI 며느리는 Native UI 구조 사용 | N/A | N/A | CLAUDE.md §K |
