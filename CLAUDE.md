@AGENTS.md

# Claude Code notes

AGENTS.md (imported above) holds the binding constraints and commands; `docs/STATUS.md` is the current handoff. This file adds orientation. Directory-level `CLAUDE.md` files load when you work in that directory.

## What this is

**Side Quest** (formerly Drink at Ron, a riff on Drink-O-Tron; see README for what keeps the old name): a pass-the-phone drinking-card game, a Vite + React 19 + TypeScript PWA hosted on GitHub Pages (`/side-quest/`). Target platform: **iPhone and iPad, Safari, added to the Home Screen** so it behaves like a native app (standalone, offline, one-handed, table-distance reading). Desktop is for development only. Judge every change against: iOS Safari/WebKit, standalone display mode, offline, safe areas, and 2:3 card legibility.

## Map

| Path | Role |
| --- | --- |
| `src/game` | Pure engine: shuffle, advance, dice sampling. No DOM, no React. |
| `src/content` | Card and pack data (864 cards incl. League-only and gauntlet cards, 7 packs). App code imports `manifest.generated.ts` and loads card text per pack via `loaders.ts`. |
| `src/app/persistence.ts` | localStorage save/load, v1→v2 migration, preferences. |
| `src/presentation` | Controller (animation state machine), theme, CSS, dice renderer adapter, imprint sprite. |
| `src/components`, `src/screens` | React UI; `main.tsx` wires state, PWA update, and dialogs. |
| `src/workshop` | Dev-only (`?workshop=1`, `?preview=1`, `?review=1`); never ships. |
| `tests` | Vitest units at the top level; Playwright in `browser/` (production build) and `workshop/` (dev server). |
| `scripts` | Build gates, reference parsers, one-off art tooling. |
| `reference`, `assets`, `docs` | Raw sources, art sources, documentation. |

## Working rules

- Read `docs/STATUS.md` first, but only the top sections; it is long and mostly history.
- Verify with the narrowest check that proves the change, then say exactly what ran. `npm test` is fast (about 1s) and covers engine and content; layout and iOS-edge behavior need a production build plus Playwright (see AGENTS.md for the `TEST_PORT` pattern).
- Emulated WebKit is not an iPhone. Never claim installed-app, Safari-toolbar, frost-strip, haptic, or performance behavior without a physical-device result in `docs/DEVICE_CHECKLIST.md`.
- Card copy follows `docs/CARD_VOICE_REFERENCE.md` and `docs/AUTHORING.md`; supplied House/Pokémon wording stays as supplied.
- Commits and pushes to `main` publish the live site (the workflow deploys on every push to `main`). Always ask first.
