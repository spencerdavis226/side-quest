# src/content — card and pack data

Read `docs/AUTHORING.md` and `docs/CARD_VOICE_REFERENCE.md` before editing. Cards are title + rules + category (`sip|group|category|challenge|rule`) + optional `dice`, or optional `secret` / `timer` (never with dice; see `docs/AUTHORING.md`). No illustration text.

| File | Pack | Cards |
| --- | --- | --- |
| `sample.ts`, `classics.ts`, `standard-expansion.ts` | `core` | 105 |
| `custom.ts` | `house` (sheet rows, verbatim; its 8 CABIIN rows go to Cabin as `cabinSheetCards`) and four `vip.sheet-*` | 94 |
| `vip.ts` (+ the four in `custom.ts`) | `vip` | 16 |
| `pokemon.ts` (+ `pokemon-league.ts`: 24 gym leaders and the 20-card gauntlet, League mode only) | `pokemon` | 120 |
| `cabin.ts` (+ the 8 CABIIN sheet rows from `custom.ts`) | `cabin` | 85 |
| `likely.ts` | `likely` (vote cards, IDs `likely.NNN` by list position) | 250 |
| `secrets.ts` | `secrets` (Secrets & fuses: `secret` and `timer` cards, IDs `secrets.<kind>-NN` by list position) | 150 |

`catalog.ts` aggregates everything for tests, scripts and the workshop only. The app imports `manifest.generated.ts` (run `npm run content:manifest` after changing packs or card IDs; the build does it too and a test catches a stale file) and loads card text through `loaders.ts`, one lazy chunk per content module. A new pack needs a loader entry. Never import a content module statically from app code; the budget check fails the build if card text reaches the initial chunk.

Pack quests are game modes: a pack may declare `quest: { mode, summary, label, goal, length, cardIds, finale }` (see `docs/AUTHORING.md`). Finale stages are `{ label, pick, cardIds }`; their cards are in the module but in no deck list; cards tagged `quest: "<packId>"` advance the meter. Quest-only cards go in `quest.cardIds` (dealt only in that mode). Pokémon: the 24 Gen 1–3 gym leaders in `pokemon-league.ts`, each `ribbon: "Gym Leader · <Badge> Badge"`, goal 8 within 40 draws, then the gauntlet: Legendary (1 of 8, `pokemon.legendary-*`), Elite Four (4 of 9, `pokemon.elite-*`), Champion (1 of 3, `pokemon.league-champion-*`). The leaders were written for the mode at the owner's request (2026-10-05) and are not source-sheet copy. No card may belong to two packs.

Rules enforced by `npm run build` (`scripts/validate-content.ts`) and unit tests:

- Stable namespaced IDs, never recycled. House IDs encode the source sheet row (`house.sheet-003`).
- Titles: at most 22 characters and 15 per word. Rules: aim for 90 characters / 18 words; over 120 characters or 24 words fails.
- Every card says who acts. A lasting rule lasts the rest of the game or until the drawing player's next turn, never "until the next card" (`tests/card-logic.test.ts`; documented exceptions: `core.buffalo`, `house.sheet-015`).
- Every dice card resolves to one exact instruction. No odds/evens, "otherwise", or dice notation left for the table to interpret.
- Every new card needs an entry in `imprint.ts` (category motif); `tests/imprint.test.ts` fails without it.
- Each pack needs a distinct `logo` under `public/art/packs`: one single-colour SVG silhouette (any fill; only its shape is used). No per-pack prose is shown in setup.
- House and Pokémon copy is source-faithful: change it only for unclear actor or duration, and record the change in `reference/README.md` and `docs/AUTHORING.md`. Cards the user denied in review stay removed.

After any content change run `npm test`, `npm run cards:review` (regenerates `docs/CARD_REVIEW.md` and `docs/card-review.csv`; never hand-edit them), and a build. Update the card-count assertions in `tests/workshop.test.ts` when totals change. Existing saves keep their snapshot; do not try to rewrite them.
