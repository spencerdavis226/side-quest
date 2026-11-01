# src/workshop — development-only tools

Reached only in the dev server via `?workshop=1` (every-card viewer), `?moments=1` (every moment and variant, `Moments.tsx`, with `&play=<key>&slow=4` for a frame-by-frame look), `?preview=1` (state preview), `?review=1` (desktop card-review workspace, autosaves to localStorage key `side-quest.card-review.v1`, reading the pre-rename `drink-at-ron.card-review.v1` if the new one is empty). `main.tsx` imports them behind `import.meta.env.DEV`, and `scripts/check-budget.ts` plus `tests/browser/pages.spec.ts` fail the build if workshop code or strings reach `dist`. Never import from here in production code; never put workshop assets in `public/`.

Playwright coverage lives in `tests/workshop` (`npm run test:workshop`, dev server on `:5175`, `reuseExistingServer: false`). The every-card geometry sweep is slow, especially in WebKit; run it for layout or content-wide changes, not on every edit.
