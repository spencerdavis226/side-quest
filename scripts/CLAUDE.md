# scripts

Run with `tsx` (Node 22.12+).

| Script | Purpose |
| --- | --- |
| `validate-content.ts` | First step of `npm run build`: schema, ID, length, artwork, logo, and imprint checks. |
| `check-budget.ts` | Last step of the build: tiered size budgets and "no workshop code in `dist`". Limits change only with user approval. |
| `check-update.ts` | `npm run test:update`: builds three releases and checks the service-worker update flow. |
| `save-fixtures.ts`, `table-play.ts` | `npm run fixtures:saves [date]`: plays seeded games through the engine (`table-play.ts`, also used by `tests/save-fixtures.test.ts`) and freezes one save per situation in `tests/fixtures/saves/<date>-<situation>.json`. Never rewrites an existing file. |

| `fonts.ts`, `font-chars.ts` | `npm run fonts`: subsets Grenze from `assets/fonts/` into `public/fonts/` to the characters in `src/` and `index.html` plus Latin-1, and records them in `assets/fonts/subset.json`; `validate-content.ts` fails the build on a character outside it. Needs `pip install fonttools brotli`. Source Serif 4 is not subset (Adobe reserves the name "Source"; the OFL bars a modified font from keeping it). |
| `cards-review.ts` | `npm run cards:review`: regenerates `docs/CARD_REVIEW.md` and `docs/card-review.csv`. |
| `cabiin-reference.ts`, `house-reference.ts`, `csv.ts` | Parse raw files in `reference/` into companion JSON. Read-only with respect to the raw sources. |
| `imprint.ts`, `icons.ts`, `chrome.ts`, `front-*.ts`, `league-art.ts`, `ancient-league-art.ts`, `title-crest.ts`, `crawl-icons.ts` | Art pipelines using `sharp` and the vendored icon set; they read `assets/` and write `src/presentation` or `public`. Rerun only when the source art changes. |

Keep scripts deterministic and offline. Anything that writes into `src/` or `docs/` must say so at the top, and generated docs are never hand-edited.
