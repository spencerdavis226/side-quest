# tests

| Location | Runner | What it needs |
| --- | --- | --- |
| `tests/*.test.ts` | `npm test` (Vitest, about 8 s) | nothing; engine, dice, content, presentation tokens, card-logic guards |
| `tests/*.balance.test.ts` | `npm run test:balance` (about 2 min; CI runs it in its own job) | nothing; 4,000 seeded Pub Crawl and League runs each, holding the win rates |
| `tests/browser/*.spec.ts` | `npm run test:e2e` / `test:release` | a production build; serves `dist` with `vite preview` |
| `tests/workshop/*.spec.ts` | `npm run test:workshop` | the dev server (`:5175`); never `dist` |

- Playwright projects emulate iPhone 13 in Chromium and WebKit. WebKit emulation is closer to Safari but is not an iPhone; physical results go in `docs/DEVICE_CHECKLIST.md`.
- Tag fast, high-value cases `@release`; the CI gate runs only those (`npm run test:release`). Keep that set small, since publication time was a user complaint.
- Always set `TEST_PORT` locally. `reuseExistingServer` is on outside CI, so a stale preview on `:4173` silently tests an old build. Build with `BASE_PATH=/side-quest/` first.
- Do not run two Playwright runners at once; they share `test-results/` and corrupt each other's traces (this caused a false failure before).
- Never loosen an assertion to make a failure pass. If a test is flaky because of host load, say so and rerun it isolated; do not call the suite green with a failing or untracked test.
- `tests/fixtures/saves/` are real saves from earlier releases; never edit or delete one to make a test pass (see AGENTS.md).
- Count assertions (`tests/workshop.test.ts`, `game.spec.ts`) change when cards or packs are added; update them with the content.
