# AI 며느리

Android-first, voice-first personal AI assistant for older adults.

## Start

Claude/Antigravity:

1. Read `START_HERE.md`.
2. Read `CLAUDE.md`.
3. Paste/run `PASTE_THIS_MASTER_PROMPT.md`.
4. Follow `docs/IMPLEMENTATION_PLAN.md`.

## Current status

Initial handoff package. No application scaffold is assumed until Claude verifies the actual workspace.

## Design

Corrected design source is already extracted at:

```text
docs/design-source/claude-design/
```

Use `docs/DESIGN_HANDOFF.md` as the development-facing source of truth.

## Existing repositories to inspect

- `guraudrk/sliverlink_AI`
- `guraudrk/silverlink-mobile`

Do not overwrite them.

## First slice

```text
“딸한테 전화해 줘”
→ local contact search
→ max 3 candidates
→ explicit confirmation
→ Android ACTION_DIAL
→ result feedback
→ masked audit log
```

## 개발일지

- [2026-08-14 개발일지](docs/work-log/2026-08-14.md)
- [2026-08-10 개발일지](docs/work-log/2026-08-10.md)
- [2026-08-07 개발일지](docs/work-log/2026-08-07.md)
- [2026-08-06 개발일지](docs/work-log/2026-08-06.md)
- [2026-08-05 개발일지](docs/work-log/2026-08-05.md)

## Security

- Never commit secrets.
- Never include service-role keys in mobile code.
- No automatic call recording.
- No financial transaction automation.
- No unconfirmed phone/SMS action.
