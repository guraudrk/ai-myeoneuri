# SilverLink Care design-system compatibility layer

> The `_ds/nocturne-...` directory name is retained only so the Claude Design export keeps exactly the same file structure. The product visual source of truth is now the SilverLink Blue/Navy palette below, not the former Nocturne dark-purple theme.

## Product direction

- Preserve the low-density, senior-friendly screen structure from the prototype.
- Reuse the current SilverLink visual DNA: trustworthy blue, deep navy, cool neutral surfaces.
- Do not import the existing SilverLink dashboard density into the senior app.
- Primary actions use a filled blue button; guardian/support actions use navy and are not warning states.

## Core colors

| Role | Token | Value |
| --- | --- | --- |
| App background | `--color-bg` | `#F5F7FB` |
| Surface | `--color-surface` | `#FFFFFF` |
| Main text | `--color-text` | `#101828` |
| Primary | `--color-accent` | `#2E5BFF` |
| Support navy | `--color-accent-2` | `#1B2660` |
| Border | `--color-divider` | `#E7EBF3` |

## Interaction

- Minimum supporting touch target: 56dp; primary target: 64dp.
- Primary actions are filled blue with white text.
- Focus uses a 2px blue ring and must not rely on color alone.
- Pressed primary uses `#234AE0`; strong/navy state uses `#1B2660`.
- Respect reduced-motion preferences.

## Accessibility

- Body copy starts at 20sp in the product UI.
- Core questions use 26–36sp.
- Keep at most three choices on one screen.
- Pair every status color with an icon and explicit Korean text.
- Do not block Android back navigation before an external Intent handoff.

## MVP behavioral source of truth

- Permissions are requested contextually, not in a first-run barrage.
- The first calling MVP uses Android `ACTION_DIAL`.
- Opening the Dialer is not equivalent to starting a call.
- Offline/cloud speech failure offers a text-input fallback.

`styles.css` contains the compatibility tokens and generic component states used by the exported preview. Product implementation should map these roles into React Native design tokens rather than importing this stylesheet directly.
