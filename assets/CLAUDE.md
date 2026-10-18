# assets — art sources, not shipped

About 66 MB, not part of the bundle. `source/` holds the approved generated art (card front/back "symmetric" pair, table, UI chrome sheets, studies); `icons/game-icons` is the vendored Game Icons set (CC BY 3.0, licence in `docs/licenses`) that `scripts/imprint.ts` compiles into the card-imprint sprite.

- The approved card pair is `source/card-back-symmetric.png` and `source/card-front-symmetric.png`. Do not replace it without a concrete visual issue and user approval.
- Never import from this folder in `src/`; shipped derivatives live in `public/art` and `src/presentation/art`.
- `fonts/` holds the original Grenze files that `npm run fonts` subsets into `public/fonts/`; never ship them directly.
- Do not add large binaries casually; this folder already dominates repository size.
