# docs

- `STATUS.md` is the single current handoff; update it in place, do not add competing plans. Newest sections are on top; only the first few matter for planning. Older handoffs live in `STATUS_ARCHIVE.md` (reference only).
- Generated, do not hand-edit: `CARD_REVIEW.md`, `card-review.csv` (run `npm run cards:review`).
- Policy docs to read before related work: `AUTHORING.md` and `CARD_VOICE_REFERENCE.md` (cards), `GAME_DESIGN.md`, `ART_DIRECTION.md` and `ILLUSTRATION_GUIDELINES.md` (visuals), `GITHUB_PAGES.md` (release and budgets), `PLAYTEST.md` and `DEVICE_CHECKLIST.md` (human gates).
- `studies/` keeps only the live typography study page that `tests/workshop/title-fit.spec.ts` loads; historical captures were removed on 2026-10-15 (they remain in git history).
- `licenses/` must stay in step with bundled third-party code and art (Three, cannon-es, dice-box-threejs, Game Icons CC BY 3.0, Source Serif). Add the license text when adding a dependency or asset source.
- Mark unverified claims as unverified. Do not record physical-device results you did not observe; the owner records those in `DEVICE_CHECKLIST.md`.
