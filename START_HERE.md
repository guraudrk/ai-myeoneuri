# START HERE — AI 며느리

이 폴더는 Antigravity의 Claude가 단독으로 프로젝트를 이어갈 수 있도록 만든 완전한 인수인계 패키지다.

## 사용자가 할 일

1. 이 프로젝트 폴더를 Antigravity Project/Workspace에서 연다.
2. `PASTE_THIS_MASTER_PROMPT.md` 내용을 기존 Claude 대화창에 한 번 붙여넣는다.
3. 이후 Claude와만 대화하며 진행한다.

## Claude가 가장 먼저 읽을 파일

1. `CLAUDE.md`
2. `00_PROJECT_HANDOFF_AND_ROADMAP.md`
3. `docs/PRODUCT_SPEC.md`
4. `docs/ARCHITECTURE.md`
5. `docs/DESIGN_HANDOFF.md`
6. `docs/IMPLEMENTATION_PLAN.md`
7. `docs/DECISIONS.md`
8. `docs/EXISTING_REPOSITORY_CONTEXT.md`
9. `docs/AGENT_OPERATING_MANUAL.md`
10. `prompts/01_FIRST_PROMPT_AUTONOMOUS.md`

## 핵심 원칙

- 기존 SilverLink를 덮어쓰지 않는다.
- AI 며느리는 별도 Android-first 프로젝트다.
- 디자인 원본은 `docs/design-source/claude-design/`에 이미 압축 해제되어 있다.
- 첫 Vertical Slice는 “딸한테 전화해 줘” → 연락처 검색 → 사용자 확인 → `ACTION_DIAL`이다.
- 승인 Gate가 아니면 분석에서 멈추지 않고 구현·검증·문서 갱신까지 진행한다.
- 채팅 기억보다 저장소 문서를 Source of truth로 사용한다.
