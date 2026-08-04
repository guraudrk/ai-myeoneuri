# AI 며느리 Workspace Rule

이 Rule은 항상 적용한다.

모든 작업을 시작하기 전에 다음 파일을 순서대로 읽는다.

1. `@/CLAUDE.md`
2. `@/00_PROJECT_HANDOFF_AND_ROADMAP.md`
3. `@/docs/IMPLEMENTATION_PLAN.md`
4. `@/docs/DECISIONS.md`
5. `@/docs/DESIGN_HANDOFF.md`
6. `@/prompts/01_FIRST_PROMPT_AUTONOMOUS.md`

파일이 아직 없다면 현재 프로젝트 상태를 조사한 뒤 필요한 최소 문서를 생성한다.

## Source of truth

충돌 시 다음 순서로 판단한다.

1. 보안·개인정보·법적 제한
2. 사용자의 최신 명시적 지시
3. `CLAUDE.md`
4. `00_PROJECT_HANDOFF_AND_ROADMAP.md`
5. `docs/DECISIONS.md`
6. `docs/PRODUCT_SPEC.md`
7. `docs/ARCHITECTURE.md`
8. `docs/IMPLEMENTATION_PLAN.md`
9. `docs/DESIGN_HANDOFF.md`
10. 현재 테스트와 코드

## 작업 방식

승인 Gate에 해당하지 않으면 다음을 연속해서 수행한다.

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

분석 보고만 하고 멈추지 않는다.

## 프로젝트 경계

- AI 며느리는 새 독립 프로젝트다.
- 기존 SilverLink 저장소를 덮어쓰지 않는다.
- 기존 저장소는 읽고 필요한 모듈만 선택적으로 재사용한다.
- Claude Design 원본은 참고 자료이며 앱 런타임에 직접 포함하지 않는다.
- 디자인은 SilverLink Blue·Navy 색상 체계와 고령자 접근성 원칙을 유지한다.
- 첫 MVP 전화 실행은 `ACTION_DIAL` 우선이다.
- 권한은 기능 사용 시점에 요청한다.
- 사용자 확인 없이 전화·문자를 실행하지 않는다.
- 실제 통화 녹음, 금융 거래, 광범위한 Accessibility는 승인 전 금지한다.

## 세션 지속성

채팅 기억만 믿지 않는다.

각 작업 후 반드시 다음을 갱신한다.

- `docs/IMPLEMENTATION_PLAN.md`
- `docs/DECISIONS.md`
- 관련 Test
- `README.md`
- Known limitations
- 다음 우선순위

다음 세션에서는 위 문서를 읽고 마지막 상태에서 이어서 진행한다.
