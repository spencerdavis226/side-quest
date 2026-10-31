# tests

| Location                   | Runner                                                                                                           | What it needs                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `tests/*.test.ts`          | `npm test` (Vitest, about 8 s)                                                                                   | nothing; engine, dice, content, presentation tokens, card-logic guards      |
| `tests/*.balance.test.ts`  | `npm run test:balance` (about 2 min; CI runs each file in its own job)                                           | nothing; 4,000 seeded Pub Crawl and League runs each, holding the win rates |
| `tests/browser/*.spec.ts`  | `npm run test:release` (@release, the CI gate), `npm run test:e2e` (everything but @sweep), `npm run test:sweep` | a production build; serves `dist` with `vite preview`                       |
| `tests/workshop/*.spec.ts` | `npm run test:workshop`                                                                                          | the dev server (`:5175`); never `dist`                                      |

## Browser specs

- Import `test` and `expect` from `tests/browser/support.ts`, never from `@playwright/test` (lint enforces it). It makes every test deterministic:
  - `Math.random` is seeded from the test's title, in Node and in the page, so engine helpers and a game started from setup deal the same cards every run, in both browsers. Pass `rng("...")` explicitly when building a session; lint rejects `Math.random` in a spec.
  - Reduced Motion is the default (`playwright.config.ts`); the app settles flips, deals and banners at once. A spec that tests motion opts back in: `test.use(motion)` for a file (dice, motion, title-fit) or `await withMotion(page)` before the first navigation of one test (dialog tokens, rapid taps, the atmosphere, League dice).
  - No fixed sleeps (lint rejects `waitForTimeout`). Wait on state: a web-first assertion, `resizeTo(page, size, selector)` to resize and wait for the layout to take it, `frames(page, n)` to sample a style a few frames after an input, `page.clock` for timers, or pause animations at a moment (`getAnimations()`, `currentTime`).
- Saved state: `seed(page, session)` / `seedStorage(page, entries)` write localStorage before the first page load (one navigation, not goto + write + reload). `reseed` is for loops that load many saves in one test.
- `tests/browser/sessions.ts` builds League (`leagueAt`) and Pub Crawl (`crawlAt`) saves through the engine, seeded. `playLeague` in `quest.spec.ts` throws if it cannot finish a run (the 2026-10-31 rods once stalled it, the "Hall of Fame flake").
- Tags: `@release` is the smoke gate CI runs on every PR and deploy, in Chromium and WebKit, with no retries. Keep it to about 13 tests and under 90 s per browser job: boot and manifest, first paint, a plain game (deal, flip, reload, previous card, replay), tap vs scroll, a dice roll, a Pub Crawl turn and a fight, a League turn, the bag, the Hall of Fame, the iOS layout pair and landscape. `@sweep` is the every-card fit sweeps (`sweeps.spec.ts`, about 1,100 saves, chunked); run `npm run test:sweep` after changing card text, plaques or the card face. Everything else runs in `test:e2e` locally and in the manual `full_validation` dispatch.
- Retries are 0 everywhere. A flaky test is a bug in the test or the app: find the race and wait on the right state; never loosen the assertion.
- Logic that needs no layout (counts, engine results, save contents, text) belongs in Vitest, not here.

## Running

- Build first with `BASE_PATH=/side-quest/ npm run build`, and always set `TEST_PORT` locally: `reuseExistingServer` is on outside CI, so a stale preview on `:4173` silently tests an old build. Example: `CI=1 BASE_PATH=/side-quest/ TEST_PORT=4398 npm run test:e2e -- --project=chromium --workers=2`.
- Measured 2026-10-31 in this container (4 cores), Chromium: `test:release` 27 s (2 workers), `test:e2e` 3 min 23 s (2 workers), `test:sweep` 4 min 24 s (4 workers).
- Do not run two Playwright runners at once; they share `test-results/` and corrupt each other's traces (this caused a false failure before).
- `--repeat-each=5` proves a change steady; the `pages.yml` dispatch takes `repeat_each` for the same in CI.
- Playwright projects emulate iPhone 13 in Chromium and WebKit. WebKit emulation is closer to Safari but is not an iPhone; physical results go in `docs/DEVICE_CHECKLIST.md`.
- `tests/fixtures/saves/` are real saves from earlier releases; never edit or delete one to make a test pass (see AGENTS.md).
- Count assertions (`tests/workshop.test.ts`, `game.spec.ts`) change when cards or packs are added; update them with the content.
