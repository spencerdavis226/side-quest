# src/app — persistence

`persistence.ts` is the only code that reads or writes localStorage (session key `side-quest.session.v1`, preferences `side-quest.settings.v1`). Keep both keys. `migrateStorageKeys` (called first in `main.tsx`) moves the pre-rename `drink-at-ron.*` keys once; keep it so old installs keep their saves.

- `parseSession` migrates v1 → v2 and rejects anything inconsistent (order, counts, history, dice progress). A rejected save becomes the "This save lost its place" recovery screen, so be conservative about adding new invariants: a false positive destroys a real game.
- Every state change writes the whole session (card snapshot included, measured 2026-10-18: about 23 KiB for Core, 356 KiB for Infinite with every pack, 221 KiB for a League run, 265 KiB for Pub Crawl) synchronously. `save()` returns false when storage is unavailable; the UI shows a notice instead of crashing.
- `loadPreferences` upgrades legacy choice values (`endless`, `20/40/60/custom`) and drops pack ids that no longer exist.
- iOS caveat: a Safari tab and the installed Home Screen app do not share localStorage, and Safari may evict site data for sites not visited recently. Do not assume a save survives reinstalling or switching between the two.
- Storage failures must degrade quietly (try/catch around every access); tests deny storage in `tests/browser`.
