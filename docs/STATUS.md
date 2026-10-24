# Current state and implementation plan

Updated 2026-10-18. **Single authoritative handoff.** Read `AGENTS.md` first. Older handoffs are in `docs/STATUS_ARCHIVE.md` (reference only). Direct user instructions win.

## One plain deck (2026-10-24; owner)

The owner: Core, the House sheet and Cabin weekend are "basically the same thing" and "don't change gameplay", so they are one pack. `core` now holds the three (275 cards; `src/content/core-deck.ts`); card IDs keep their origin (`core.*`, `house.sheet-*`, `cabin.*`). The `house` and `cabin` pack IDs are retired: a saved selection or game that names one reads as `core` (`RETIRED_PACKS` in `src/app/persistence.ts`, covered by `tests/presentation.test.ts` and the fixture `tests/fixtures/saves/2026-10-24-retired-house-and-cabin-packs.json`). VIP night stays separate (its cards say "the VIP"), as do the Pokémon and Dungeon packs (they own modes), Most Likely To (votes) and Secrets & fuses (hold-to-read and timers). Pack logos `house.svg` and `cabin.svg` were removed. Stacked on PR #28 (card copy).

## Review follow-up plan (2026-10-18; owner approved; all four merged to `main`)

An app-wide review found the bugs and gaps below. The owner approved four PRs, in order, and then their merge ("Go ahead"): #24, #25, #26 and #27 are on `main`. Each was merged with `main` brought in first and CI green on that head; the combined tree was checked locally before the first merge (`npm test` 251, `test:balance` 8, lint, typecheck, build, Chromium browser suite minus the fit sweeps 136 passed).

**Next:** the device checks added to `docs/DEVICE_CHECKLIST.md` on 2026-10-18 (idle table, Grenze subset, VoiceOver banners, iPad landscape text) need the owner's iPhone and iPad.

1. **Bugs** (`review-bugs`, below).
2. **Saved games:** frozen example saves from seeded runs (`tests/fixtures/saves/`) that every release must still load; a rule that a change to save checks or card rules adds a fixture and never edits one; a backup of a save that fails to load (`side-quest.session.corrupt.v1`) before it is cleared.
3. **Performance:** a fuse sets one timeout and a countdown ticks once a second (`CardActions.tsx`); League frame art is decoded only when the League is chosen or resumed; the table's embers and firelight pause after 60 seconds without a tap and resume on the next (owner's choice, option A); fonts subset to the characters the app and cards use, with a build check, kept only if it saves about 30% or more.
4. **Tests and docs:** `npm test` without the 4,000-run balance simulations, which move to `npm run test:balance` (CI runs both); stale docs fixed (test time, save sizes, the black-translucent comment, the dice budget note); `-webkit-text-size-adjust: 100%`; banners announced through one persistent live region; the dice test "a second tap finishes the moving dice" made robust (it fails about 1 in 4 under three local workers, before and after PR 1, because the roll can finish before the test sees it rolling).

Not doing (owner left it to my call): dropping a crawl's unused deck cards from its save. It would change what a valid save is for about 130 KiB.

## Dice glare on pale palettes (2026-10-24; on `main`)

- **Pale starter and adventurer dice glared out their top numerals** (owner report; the house teal was fine). `diceColors` tinted the enamel specular as 40% of the primary, 4–8× the house teal's on pale enamels (Cinderace, High Priest, Cleric, Pikachu, Psyduck, Slowpoke…), and at shininess 100 the head-on top face washed toward white. `enamelSpecular` (`src/presentation/dice/palette.ts`) keeps the tint but caps its luminance at the house enamel's; the metal specular is unchanged.
- **Verification:** `npm test` 252 passed (new: "never lets a pale enamel's highlight glare out its numerals" in `tests/dice-palette.test.ts`), lint, typecheck. Rendered in the dev server (Chromium): Cinderace d20 and Pikachu d6 read on the top face. No device check.

## Review fixes: bugs (2026-10-18; merged to `main`, PR #24)

- **A quest mode's pack leaked into plain games.** Choosing Pub Crawl (or the League) switched its pack on, and going back to Standard or Infinite kept it: a Standard game had 341 cards instead of Core's 96. `chooseQuest` and `chooseLength` (`src/app/persistence.ts`, used by `Setup.tsx`) now record the pack a mode switched on in `Preferences.added` and switch it off when the mode is left; a pack the player had chosen stays, and the selection is never emptied.
- **A quest mode chosen and not yet played was forgotten on reload.** Choosing one kept Standard's 50-card limit, which `loadPreferences` rejects with a quest, so setup came back as the defaults. Quest choices now set `limit: null`, plain ones their own limit.
- **A missing card chunk reloaded the app forever.** `vite:preloadError` reloaded every time; setup fetches the chosen packs on open, so a chunk missing before and after the reload (offline before it was cached) looped. Confirmed in Chromium with the chunk blocked. Now at most one reload per 30 s (`side-quest.preload-reload` in session storage); after that the import fails and its caller falls back ("Couldn't load the cards."). A dice overlay that can't load puts the saved result straight on the card (`NoDice` in `Play.tsx`) instead of stranding the roll.
- **No feedback while a deck loads.** Play and Play again read "Dealing…" and are disabled while the pack's cards load.
- **Flaky test fixed:** "a smoke bomb flees it" now seeds an ordinary next room (a random ambush changed the plaque's words).
- **Tests:** `tests/presentation.test.ts` (5 new: leaving a mode, a pack already chosen, quest to quest, never empty, reload); browser: `secondary.spec.ts` (the leak, a quest mode kept across a reload), `pages.spec.ts` (one reload then the notice, with the service worker blocked; "Dealing…"). The reload test fails on the old code (the notice never shows).
- **Verification:** `npm test` 234 passed; lint, typecheck and build passed. Chromium (local, the container's Chromium via a local config): touched specs 15 passed; the smoke-bomb test 20 of 20 with `--repeat-each=20`; `@release` minus fit sweeps 40 passed, 1 failed ("a second tap finishes the moving dice": fails the same way on unmodified code under three workers, passes 6 of 6 alone). WebKit not run locally; no device check.

## Review fixes: saved games survive updates (2026-10-18; merged to `main`, PR #25)

- **Frozen saves.** `npm run fixtures:saves` (`scripts/save-fixtures.ts`) plays seeded games through the engine (`scripts/table-play.ts`) and freezes the first save in each of 21 situations in `tests/fixtures/saves/2026-10-18-*.json`: Standard mid-game, a roll in flight, a roll on the card, complete; Infinite in its second round, a choice waiting; a timed card, a secret card; the League on its starter, evolved, mid-gym, with a bag and a status, in the Hall of Fame; Pub Crawl with boons and a jinx, after a Quaff, pressing its luck, mid-boss, cursed with the Cup, wiped, survived; and a version-1 save. The script never rewrites a file; regenerating gives byte-identical files. 3.5 MB on disk, one-line JSON, marked `-diff linguist-generated` (`.gitattributes`) and skipped by Prettier (`.prettierignore`).
- **Test:** `tests/save-fixtures.test.ts` loads every fixture with `parseSession`, then plays up to 40 moves on, re-loading each state. Tightening the ribbon limit in `validate.ts` from 32 to 10 characters fails it on every League and crawl fixture.
- **Rule (AGENTS.md, `src/app`, `src/game`, `scripts`, `tests` CLAUDE.md):** a change to what a save holds, to save checks or to runtime card rules adds fixtures; never edit or delete one.
- **Backup:** a save `loadSession` rejects is copied to `side-quest.session.corrupt.v1` (latest only) before the recovery screen clears it; a full storage loses only the backup. Unit tests in `presentation.test.ts`; `game.spec.ts`'s recovery test checks the key.
- **Not covered:** League saves from before the gauntlet or the crawl (meter mode) can't be produced by today's code, so no fixture holds one; their load path keeps its existing unit tests.
- **Verification:** `npm test` 254 passed; lint, typecheck, build passed. Chromium (local): `game.spec.ts` 17 passed; `@release` minus fit sweeps and the known flaky dice test 36 passed. WebKit not run locally.

## Review fixes: performance (2026-10-18; merged to `main`, PR #26)

- **Timers:** a fuse sets one timeout for when it goes off, a countdown one per second turning over (`CardActions.tsx`); both still catch up on return from the background. Measured with a React commit counter in Chromium over 10 s of a running timer: fuse 52 → 0 commits, countdown 53 → 12.
- **League art:** the Ancient Mew front and back (about 7 MB decoded) are decoded only once the League mode is chosen or a League game is on the table, not on every launch (`main.tsx`). The first-render hold for a resumed League game is unchanged.
- **Idle table (owner's choice A):** after 60 s without a tap or key, `.atmosphere.idle` pauses the glow and fades the embers and dust out (1.2 s) and stops them; the next tap brings them back (`Atmosphere.tsx`, `theme.css`; the embers now sit in an `.embers` box like the dust). Battery saving not measured: device check added.
- **Fonts:** Grenze (both styles) is subset to the 200 characters `src/` and `index.html` use plus Latin-1, keeping every OpenType feature, the variable weight axis and the OFL name records: 134.6 KB → 76.8 KB (43%). Originals in `assets/fonts/`; `npm run fonts` (Python fonttools) regenerates byte-identical files; `validate-content.ts` fails the build on a character outside `assets/fonts/subset.json`. Source Serif 4 is left whole: Adobe reserves the name "Source" and the OFL bars a modified font from keeping it. All fonts: 216 KB → 158 KB (27%, a little under the 30% bar set in the plan; kept because it is 58 KB off the first screen at no runtime cost). Runtime 3,816 → 3,760 KiB. Screenshots of setup, How to play, three cards and the pause menu are pixel-identical before and after (Chromium).
- **Tests:** `game.spec.ts` (idle after a minute, woken by a tap, with the page clock), `pages.spec.ts` (no League art request until the League is chosen).
- **Verification:** `npm test` 229 passed; lint, typecheck, build passed. Chromium (local): `@release` minus fit sweeps and the known flaky dice test 38 passed; `title-fit`, `secrets`, `motion` and `game` specs 37 passed. WebKit not run locally; no device check.

## Review fixes: tests, docs, accessibility (2026-10-18; merged to `main`, PR #27)

- **Faster `npm test`:** the 4,000-run balance simulations ran at module load in `tests/dungeon.test.ts` and `tests/league.test.ts`, so `npm test` took about 97 s. They now live in `tests/dungeon.balance.test.ts` and `tests/league.balance.test.ts` (unchanged), run by `npm run test:balance` (about 1 min 40 s) and excluded from `npm test` (now about 8 s; 221 + 8 = the same 229 tests). CI runs them in a new `balance` job beside build and browser; a deploy needs all three.
- **Docs:** test times and balance file names in `CLAUDE.md`, `AGENTS.md`, `tests/CLAUDE.md`, `AUTHORING.md`, `GAME_DESIGN.md`, `src/content/CLAUDE.md` and the tuning comments; save sizes in `src/app/CLAUDE.md` (measured: Core 23 KiB, every pack 356 KiB, League 221 KiB, Pub Crawl 265 KiB); the dice budget note; the stale black-translucent comment in `style.css`.
- **iPad landscape:** `-webkit-text-size-adjust: 100%` on the root, so iOS does not enlarge text in landscape.
- **Banners for VoiceOver:** stage, evolution and news banners were `role="status"` boxes inserted with their text, which screen readers often skip. They are now `aria-hidden`, and each adds its words as a line to one polite region present from the first render (`Announcer.tsx`, `#banner-announcer`), removed when the banner goes. Two banners at once (a level-up and the next room) are both read. `crawl.spec.ts` checks the region.
- **Flaky dice test fixed:** "a second tap finishes the moving dice" holds the page clock still from the throw to the finish tap; 16 of 16 and 10 of 10 under three workers (before: 3 of 12 failed, on unmodified code too).
- **Verification:** `npm test` 221 passed; `npm run test:balance` 8 passed; lint, typecheck, build passed. Chromium (local): `@release` minus fit sweeps 37 passed; `crawl.spec.ts` and `quest.spec.ts` minus fit sweeps 31 passed. WebKit not run locally; VoiceOver and iPad text not checked on a device (checklist items added).

## Two-across plaques: mark and name centred together (2026-10-18; pushed to `main`, PR #23)

- **Owner (iPhone screenshot, The Barrel Room's spoils):** "weird text placement". Two-across plaques (spoils, offers, the Quaff) laid the mark and name in two `auto` grid columns with the line under them spanning both; a line wider than mark plus name widened those columns, so the mark drifted left and the name wrapped ("Bung / Mallet").
- **Fix (`src/presentation/crawl.css`):** columns `minmax(0, 1fr) auto auto minmax(0, 1fr)`, mark in 2 and name in 3 (Cash out's name spans both middle columns), so spare width goes to the outer columns; the line under them is `text-wrap: balance` (no lone "less.").
- **Verification:** before/after screenshots of The Barrel Room's spoils at 393x640 (Chromium); landing, push-your-luck, merchant and Quaff plaques checked in their spec screenshots. `npm test` 229 passed; lint clean; full Playwright (Chromium and WebKit, minus sweeps) 130 passed. Not checked on a device.
## Card copy length pass: 100-character rule limit (2026-10-18; pushed to `main`, PR #22)

- **Owner:** "do the professional, no cut-corners moves" after PR #21 (shrink-to-fit). The fit handles screen size; this keeps text large by keeping copy short.
- **Copy:** all 66 rules over 95 characters rewritten to 95 or fewer with the same actors, durations, amounts and dice (9 Dungeon, 1 House row 60, 55 Pokémon incl. 21 sheet cards and three starter flavor lines, 1 VIP). Recorded in `reference/README.md`.
- **Limit:** `scripts/validate-content.ts` now rejects rules over 100 characters or 20 words (was 120 / 24); the 90 / 18 review warning stays. Docs updated (`AUTHORING.md`, `GAME_DESIGN.md`, `ART_DIRECTION.md`, `src/content/CLAUDE.md`, `cards-review.ts`); `docs/CARD_REVIEW.md` and the manifest regenerated. Saved games keep their snapshot text.
- **Verification:** `npm test` 229 passed (card-logic caught a dropped "rest of the game" on Barboach, fixed); lint and typecheck clean; build validated 1,580 cards. Red's line became "hasn't spoken since 1996". Full Playwright (Chromium and WebKit, minus sweeps) 129 passed, 1 failed: the Chromium keyboard-focus test "readable fallback when artwork fails" (load timing, flaky earlier in this session); it passed 3/3 alone and `game.spec.ts` passed 17/17 on rerun. Both sweeps at 393x640 passed.

## Long rules shrink to fit before they scroll (2026-10-18; pushed to `main`, PR #21)

- **Owner (iPhone 15 Pro, Safari tab, not installed):** Chad's Fake ID's rules faded and cut off at the bottom. Rule text had a 26px floor; Safari's toolbar and the crawl strip (`--hud-strip`, added 2026-10-17) leave a smaller card, so long rules spilled into the scroll fade. The fit sweeps had been skipped (`--grep-invert "fits its face"`) since the header redesign.
- **Fix:** `CardFace` (`src/components/Cards.tsx`) shrinks a spilling rule via `--rules-fit` on `.study-rules` (applied to `.study-rules p` in `card-front.css`), down to 0.77 (26px to 20px), by binary search, on load, resize and font load; scroll and its fade remain beyond that. Skipped when the root size is enlarged (Larger Text keeps its size and scrolls; `layout.spec.ts` guards this).
- **Sweeps:** both "fits its face" sweeps now run at 393x640 (the iPhone 15 Pro Safari tab measured from the owner's screenshot) instead of 375x667. Without the fix 79+ Dungeon cards overflow there; with it none do, and every League card fits.
- **Verification:** `npm test` 229 passed; typecheck, lint, build passed; full Playwright (Chromium and WebKit, minus sweeps) 130 passed; both sweeps (Chromium) passed. Not checked on a device.

## Hearts stud: optical centring (2026-10-17; pushed to `main`, PR #20)

- **Owner (iPhone screenshot):** the heart is not centred in the top-left stud. Measured: its box is centred to within 1px; it reads high because the lobes carry its weight. `.meter-heart.heart-shape` sits 2px lower (`src/presentation/crawl.css`); `CrawlMeterFace` adds `heart-shape` only when the theme keeps the stock heart, so the League's round Poke Ball is unchanged.
- **Verification:** `npm test` 229 passed; typecheck, lint, build passed; Chromium `crawl.spec.ts` (minus the fit sweep) 20 passed. Not checked on a device.

## Top-edge blur: strip reaches past the status bar, bar blends into the wood (2026-10-17; pushed to `main`, PR #19)

- **Owner (iOS 27, iPhone 15 Pro), after PR #18:** the header top and "YOUR STARTER" are still blurred, identical to before. The header sits at inset + 20px in both screenshots, so the app still draws under the status bar on iOS 27 (top inset 59pt) and the strip was already 59pt tall; PR #18's 14px minimum changed nothing there.
- **Hypothesis:** WebKit samples 4px inside the *unobscured* edge, the bottom of the status bar (63pt), where the strip did not reach; the projects whose fixes worked pad a sticky header under the clock, so their box spans that point.
- **Fix:** `.status-edge` is `calc(var(--top-safe) + 14px)` tall (inside the 20px above the header; nothing on setup or play sits there), background colour `#211810` (the wood's, as iOS may paint it in the status bar). `layout.spec.ts` hit-tests at inset + 4.
- **Owner, after re-adding the app (fresh install, PR #18 live):** the header is sharp; the blur is fixed. But the opaque status bar is flat #271c11 (theme-color), lighter than the wood under it (~#18110c), and looks bad. The meta `theme-color` and the strip's colour are now #18110c, the wood at the edge; the manifest keeps #271c11 (its theme, background and the html root must agree, `pages.spec.ts`). Whether iOS picks up a changed theme-color without a re-add is not known.
- **Bar blend (owner chose option 3 of: flat matched bar / wood under a blurred clock with the header 22pt lower / matched bar plus fade):** below the status bar the wood starts in #18110c and fades in over 56px (`--edge-fade`, painted on the installed app's `body:before` and on `.status-edge` so the two agree). Header and card size unchanged. Checked in Chromium emulation (no seam, inset 0 and 47px); not yet on a device.
- **Owner's fallback (2026-10-17, superseded: the fix worked):** if this did not fix it, drop the solid colour/strip and keep wood texture in the status bar, accepting the blur.
- **Verification:** `npm test` 229 passed; lint, typecheck, build passed; Chromium `@release` (minus fit sweeps) 37 passed. Not verified on a device.

## Top-edge blur: keep the strip in a fresh install (2026-10-17; pushed to `main`, PR #18; owner on iOS 27)

- **Owner's iPhone 15 Pro screenshot after re-adding the app:** the status bar is now solid (flat #201710 for the top ~177px, so dropping black-translucent took), but a band about 30pt below it is still blurred before the wood grain returns. That is iOS 26's top edge effect (status bar plus about 40pt).
- **Cause:** with no inset, `.status-edge` was `height: var(--top-safe)` = 0, so WebKit found no fixed box at the top edge (it needs one more than 10px tall) and drew the blur.
- **Fix:** `src/style.css` `.status-edge` height is `max(14px, var(--top-safe))`; it paints the backdrop's wood inside the play screen's 16px top padding. `tests/browser/layout.spec.ts` checks the fresh-install case (14px, hit 4px in, no seam) beside the 59px inset.
- **Verification:** `npm test` 229 passed; lint, typecheck, build passed; Chromium `layout.spec.ts` 13 passed; Chromium `@release` (minus fit sweeps) 37 passed. Not verified on a device: emulation cannot show the iOS edge effect.

## The Quaff costs 6 drinks (2026-10-17; pushed to `main`, PR #17)

- **Owner:** change the Quaff to 6. `QUAFF_DRINKS` in `src/content/dungeon/shared.ts` is now 6 (was 3); the manifest is regenerated, so the button ("drink 6 · reroll"), the Quaff chip and dialog, and How to play follow it. Saves keep the cost they started with (`party.quaff` is snapshotted at game start), so a run in progress stays at 3.
- **Balance:** unchanged; `tests/dungeon.test.ts` counts hearts, not drinks.
- **Verification:** `npm test` 229 passed (dungeon balance, guide numbers); lint, typecheck, build passed; Chromium `crawl.spec.ts` (minus the fit sweep) 20 passed.
- **Blur:** after PR #16 the owner still saw the blur; whether the app was removed and re-added (needed for the status-bar change to apply) is not yet known.

## Status-bar blur: drop black-translucent (2026-10-17; pushed to `main`, PR #16)

- **Owner:** the blur remained after PR #15's strip (iPhone 15 Pro, installed app).
- **Research:** herdr-web-ui #199 tested on a physical iPhone (iOS 27): "added with black-translucent, the header is blurred; added with the default style, it is sharp"; their fixed/sticky-header fix (#106, like PR #15) "only fixes the color there: the header's text and icons stay blurred". taOS #3427, SCRKPR #52 and coder/xum #5656 make the same change.
- **Change:** `index.html` drops `apple-mobile-web-app-status-bar-style`. The installed app now starts below an opaque status bar tinted by `theme-color` (#271c11); the wood no longer runs behind the clock. `viewport-fit=cover` stays. The `.status-edge` strip stays (zero height in a fresh install; it still colours the edge in an old one). New `tests/index-html.test.ts` fails if the meta returns.
- **Owner action:** iOS reads the meta only when the app is added, so the Home Screen icon must be **removed and re-added**.
- **Verification:** `npm test` 229 passed; lint, typecheck, build passed; Chromium browser suite (minus the two fit sweeps) 130 passed. **Not verified on the device**, including whether the `100lvh` installed-app sizing still ends exactly at the bottom below an opaque status bar.

## Status-bar blur: a fixed strip WebKit can sample (2026-10-17; pushed to `main`, PR #15)

- **Owner:** the soft blur over the header's top edge was still there in the installed app (iPhone 15 Pro) after PR #14's no-scroller change, which this branch reverts (it had no effect).
- **Research:** iOS 26+ draws a "scroll edge" blur under the status bar and about 40pt down; no CSS or meta switch turns it off. WebKit skips it when, 4px inside the top edge, it finds a `position: fixed` or `sticky` box at least 90% of the viewport wide, over 10px tall and at most 105% of its height, with a visible background colour, and uses that colour instead (`LocalFrameView::fixedContainerEdges`: `sampleRectMargin = 4`, `minimumRatio = 0.9`, `maximumRatio = 1.05`, `thinBorderWidth = 10`; a `backdrop-filter` makes it glass). Several projects report the same fix (herdr-web-ui #106, discpress #24, kp-rueck #143); none of them, nor this, is verified on a device in what I read.
- **Change:** `index.html` gains `<div class="status-edge">` before `#root`; in the installed app (`html.standalone`) it is fixed at the top, full width, `--top-safe` tall, `background-color: var(--chrome)` (#271c11) and the table backdrop painted at the same place as `body:before`, so it reads as the same wood. No `pointer-events: none` (WebKit's sampling hit test may honour it). The status-bar meta stays `black-translucent`, so no reinstall should be needed.
- **Tests:** `layout.spec.ts`'s installed-app test poses a 59px inset and checks the strip is fixed, full width, 59px tall, #271c11, the element at the sampling point, and seamless with the wood below it.
- **Verification:** lint, typecheck, build passed; Chromium browser suite (minus the two card-fit sweeps) 130 passed. **Not verified on the device.**

## How to play in two places only (2026-10-17; pushed to `main`, PR #14)

- **Owner:** too many How to play buttons. Now only the pause menu in a game, and "How to play ›" on setup's "How long?" heading (every mode; it explains the mode chosen: a crawl's rows, or the basics). Removed: the link in the party, satchel and chip dialogs, and the crawl heading's "How it works ›".
- **Verification:** lint, typecheck, build passed. Chromium browser suite (all but the two fit sweeps, which this does not touch): 132 passed. Setup checked at 320 and 390 px.
- **Top-edge blur (same PR):** the owner saw a soft blur over the header's top edge in the installed app (iPhone 15 Pro). Likely iOS 26+'s scroll-edge effect over `#root`, which was a scroller on every screen. In the installed app the play screen's `#root` is now `overflow: hidden` (it always fits); setup still scrolls. `layout.spec.ts`'s installed-app test expects `auto` on setup and `hidden` in play (34 passed in layout, game and orientation specs). **Unverified:** no device or simulator here; checklist item added.

## Header redesign (2026-10-17; pushed to `main`, PR #13)

- **Owner ask:** the top row wasted its middle and crammed everything into the hearts stud's rim; make it clear at a glance and from a distance in all three modes, and split the single hearts dialog into dedicated ones.
- **Layout (`TopBar.tsx`):** a brass stud each side and a teal plaque between (capped at 300 px, 420 px on iPad).
  - Plain games: left stud "Show the last card" (previous card, closes straight back to play), plaque "Card · 12 / 50" over a gold deck bar ("Endless" or "Round N" in Infinite), menu.
  - Crawls: hearts stud (opens the party), plaque `CrawlProgress` (floor name and N/8 over room pips; a boss under its own stage name with hit pips: "Gym 6", "Catacombs boss", "Elite Four 2/4"; an ambush; the omen's or a landing's mark), menu, and `CrawlStrip` underneath: satchel slots with their items, League badges N/8, the Quaff (amber when ready, dark when drunk), the Cup's splashes, a curse and a jinx by name.
  - Narrow phones (≤360 px) and a curse plus a jinx together: chips keep marks and numbers, names move to the dialogs; the plaque drops the "· N/8" its pips already show.
- **Dialogs:** hearts → the party (hearts, adventurer or starter, boons, badges with a line on what they are for); satchel chip → Satchel/Bag (with Drink/Use); each effect chip opens only its own entry (The Quaff, The Cup, Curse/Status, Jinx). End screens still show everything. Old rim tags removed.
- **One way out (owner):** dialogs that only close drop their big "Back to game" / "Got it" button; the X and a tap outside close them, and the previous card and How to play now close straight to the game. The pause menu drops "Resume game" too; the install help keeps its two buttons, End game its choice.
- **Card size:** `.crawl-deck` adds `--hud-strip` (44 px, 54 px on iPad) to `--play-chrome`, so crawl cards on short screens are about 29 px narrower; every Dungeon night and League card still fits (both sweeps passed).
- **Tests:** crawl and League specs updated for the chips and split dialogs; the old "four studs share the top row" test now checks the row and the strip at 320 and 390 px with all five chips showing.
- **Verification:** `npm test` 228 passed; lint, typecheck, build passed. Chromium: all browser tests except the two fit sweeps, 128 passed and 1 failed under 3 workers (`reduced motion and keyboard play`: Escape didn't close the pause menu; passed 3 of 3 run alone); both fit sweeps passed run alone (6.8 min); after the last CSS change, crawl, quest and layout specs 44 passed. Screenshots checked at 320, 390 and 820 px in every mode. WebKit not run locally; no device check.

## How to play, clearer plaques, the Cup explained (2026-10-17; branch `offer-plaque-hints`, PR #12)

- **Owner asks:** the landing plaques didn't say what they did; the Quaff and the Cup were never explained; a simple TLDR of the special mechanics (Pub Crawl and the League), separate from the inventory; drop the floors list from the party dialog; plaque text looked cramped and cheap.
- **Plaques (`OfferPlaque`, `PressPlaques`, `SpoilsPlaque`, `QuaffPlaque` in `src/components/Crawl.tsx`, styles in `crawl.css`):** one or two across, every plaque is its mark beside its name, with what it does on a smaller line under both ("Berserker / Level up · drink 3", "Rest / +3 hearts", "Quaff / drink 3 · reroll", "Press B / +1 HP"). Three or four across (merchants, Eevee) keep the stacked layout. The name is now its own `.offer-name`; aria labels unchanged.
- **How to play (`src/components/Guide.tsx`):** pause menu row "How to play" in every game, a "How to play" link in the party dialog, and "How it works ›" on the crawl's heading row at setup. A crawl shows its goal, one row per mechanic (`guide` in `crawlTheme.ts`: Pub Crawl 8 rows with the Quaff and the Cup, the League 6), the seals legend (moved here from the party dialog as `SealLegend`), then every game's basics (draw, dice, buttons, secrets, previous card). A plain game shows only the basics. `tests/crawl-theme.test.ts` holds the guide's numbers to `PARTY_HEARTS`, `QUAFF_DRINKS`, `LEVEL_DRINK` and `LANDING_HEAL`.
- **The Cup:** the drawer pours (owner's call was open; the guide, the party dialog and a new first-splash banner now say so). `PartyNewsBanner` shows "The Cup / Pour a splash in" (amber) once per screen on the first splash it sees; a jinx laid by the same loss wins the banner.
- **Party dialog:** the floors list and the seals legend are gone; the floors list stays on the end screens.
- **Verification:** `npm test` 228 passed; lint, typecheck, build passed. Chromium, all 131 browser tests: 129 passed with 3 workers; the two card-fit sweeps timed out under that load (the Dungeon one on a page reload at its 400 s limit, the League one at 300 s) and both passed run alone (7.0 min). Screenshots checked: every plaque type, the guide, the Cup banner, the party dialog, setup at 320, 375 and 390 px. WebKit not run locally.

## Head-to-head cards get a real opponent (2026-10-17; pushed to `main`)

- **Problem (owner):** two Won/Lost cards asked the drawer to beat a character's performance that never happens. Chad's Fake ID ("Worse than his") and Fisherman Ned ("top it") had nothing to compare against. Of the 108 Won/Lost cards without dice, only these two did it.
- **Fix:** a player plays the character first, as Psychic Tyron and Acerola already do.
  - `dungeon.queue-fake-id`: "Your left neighbor is Chad: 10 seconds of Canadian accent. Then you. The table votes. Chad wins: drink 3."
  - `pokemon.route-fisherman`: "Fisherman Ned (your left neighbor) tells a fish story. Top it; the table votes. Ned wins: drink 4."
- IDs, loot and tuning unchanged; `docs/CARD_REVIEW.md` and `docs/card-review.csv` regenerated.
- **Verification:** `npm test` 226 passed; lint, typecheck and build passed. Chromium `crawl.spec.ts` and `quest.spec.ts`: 31 passed, 2 flaky (passed on retry): the League fit sweep hit its 300 s timeout on the first try, and the smoke-bomb test expects "Room 2 of 8" but the next room was a random ambush ("Ambush in room 2 of 8"); that test seeds neither card. WebKit not run locally.

## Two plain lengths: Standard (50) and Infinite (2026-10-17; pushed to `main`)

- **Request (owner):** the plain modes are now only Standard (50 cards) and Infinite. Short (30) and Long (60) are gone; the quest modes are unchanged.
- **Code:** `DeckChoice` is `"standard" | "infinite" | "quest"` and `MODE_LIMITS.standard` is 50 (`src/app/persistence.ts`); the default preference is Standard. `DeckChoices` (`src/components/UI.tsx`) shows two buttons; `.lengths` is flex, so no CSS changed.
- **Migration:** saved preferences of Short, Long and the older 20/40/60/custom lengths load as Standard; Endless still loads as Infinite. Active saves keep their own `config.limit` (30, 60 or anything else), so a game in progress plays to its original length. Session schema unchanged.
- **Tests:** `tests/presentation.test.ts` (legacy choices map to Standard), `tests/browser/game.spec.ts` (two lengths, 50-card limit, the persistence test now uses Infinite), `layout.spec.ts`, `title-fit.spec.ts`.
- **Docs:** README, AGENTS.md, `src/screens/CLAUDE.md`, ART_DIRECTION, AUTHORING, GAME_DESIGN, PLAYTEST, DEVICE_CHECKLIST (the setup item stays unchecked).
- **Verification:**
  - `npm test`: 226 passed. Lint, typecheck and build passed (runtime 3,801 KiB).
  - Chromium `game.spec.ts`, `layout.spec.ts`, `title-fit.spec.ts`: 31 passed. WebKit not run locally.
- **CI (PR #11):** build, Chromium and three WebKit release shards passed.

## Polish: prop audit and device checklist (2026-10-17; pushed to `main`)

- **Prop audit, all packs.** I scanned every card for props and lasting chores and rewrote four:
  - Hoothoot: "wear shades" became "hoot like an owl".
  - Candice: the ice cube became a 30-second wall sit.
  - Cabin's Ohio: "wear something stupid" became answering everything with "It's not that bad".
  - Cabin's 3rd World Christmas: a real gift worn all game became an imaginary gift the receiver must act thrilled about (now a challenge).
- **Left as they are:** Becca's glasses (a House in-joke with a Refuse option), the Weatherman (a one-time forecast), and the classic until-your-next-turn rules.
- **Device checklist:** one new unverified item covers everything Pub Crawl added on 2026-10-17.
- **Not done, by choice:**
  - A boss trophy row: the party dialog's floor list already names each beaten boss.
  - Art prompts: they need the owner's image tool.
- **Verification:**
  - `npm test`: 226 passed. Lint, typecheck and build passed.
  - Chromium `quest.spec.ts`: 12 passed.

## A third floor at every depth (2026-10-17; pushed to `main`)

- **Three new floors** (112 cards), so each depth is one of three and a run is one of 27 dungeons (135 with the hidden rooms):
  - `dungeon/brewery.ts` (depth 1): Hop Goblin, the Craft Bro, the Brewer's Ghost (jinx Second Opinion), Tap Roulette, elites the Brewmaster, Barrel-Aged Horror and the Hostile Takeover, bosses the Fermenter, King Hop, the Beer Snob Lich (jinx A Belgian), the Keg Kraken and the Brewery Owner.
  - `dungeon/freezer.ts` (depth 2): Freezer Burn, the Frozen Bachelor, the Ice Sculpture (jinx Frozen), the Penguin Gang, the Ice Bucket Challenge, elites the Ice Queen, the Abominable Barback and the Enforcer, bosses the Walk-In, the Snow Bartender, Absolute Zero (jinx Chattering), the Ice Cream Man and the Frozen Ex.
  - `dungeon/rooftop.ts` (depth 3, no boss: Last Call closes it): the Pigeon King, the Rooftop DJ, the Neighbor (jinx Indoor Voices, the jinxed player whispers), the Proposal, Ring Toss, elites the Penthouse Owner, the Gargoyle King and the Storm Chaser.
  - Each floor follows the existing pattern: 20 fights (10 monsters, 4 trials, 4 traps, 2 ambushes), 11 finds (a gamble, 2 relics, 2 treasures, 2 shrines, 2 merchants, 2 forks), 3 elites with spoils, and 5 bosses with spoils on depths 1 and 2.
- `FLOORS` runs 0 to 8; `tier = floor % 3`. No tuning constant changed.
- **Balance:** won 27.5%. Every floor is 26–30% (Brewery 27%, Walk-in Freezer 27%, Rooftop Bar 26%). Adventurers 23–45% (the Paladin highest), the Plus-One 6%, omens 18–34%, hidden rooms 24–33%. A won run takes 46.6 draws.
- **Tests:** the harness now checks each of the 9 floors in band instead of whole routes. The route test checks 3 floors per depth and 5 rooms. Seeds: `ORIGINAL`, `OTHER` (second floors, the Basement) and `NEW` (third floors, the Back Office). The browser fit sweep covers 15 route and room combinations, and its timeout went from 240 s to 400 s for 407 cards (the first run timed out at 240 s and passed on retry).
- **Totals:** Dungeon night 407 cards (245 in every mode); the catalog 1,580.
- **Verification:**
  - `npm test`: 226 passed. Lint, typecheck and build passed (runtime 3,801 KiB).
  - Chromium `crawl.spec.ts` and `quest.spec.ts`: 33 passed (the fit sweep timed out once at its old 240 s limit; alone with no retries it passes in 2.9 min). WebKit not run locally.

## Push your luck (2026-10-17; pushed to `main`)

- **One gamble room per floor** (6 cards):
  - The One-Armed Bandit, Wine Roulette, The Bone Dice, Fishing the Drain, The Claw Machine, Hot Sauce Ladder.
  - Each win banks the next of three prizes and shows **Cash out** / **Again**. Each Again rolls 2 lower. A loss forfeits the lot, costs a heart and pours into the Cup.
  - The card's seal shows the prizes, with the banked ones lit.
- **Engine:** `card.press`, `party.press`, `awaitingPress`, `pressOn`, `cashOut`, `PRESS_STEP`.
  - No smoke bomb out of a push under way.
  - It counts as a relic for roll bonuses, so the Rogue's perk applies.
- **Balance:** won 30.0%. Adventurers 23–41%, the Plus-One 6%, Lock-In 18%.
- **Totals:** Dungeon night 295 cards; the catalog 1,468.
- **Verification:**
  - `npm test`: 226 passed. Lint, typecheck and build passed (runtime 3,773 KiB).
  - Chromium `crawl.spec.ts` and `quest.spec.ts`: 33 passed, including a new Cash out / Again test.

## Behind the Bookcase, and the Pokémon sheet table-rule pass (2026-10-17; pushed to `main`)

**Hidden rooms** (`src/content/dungeon/bookcase.ts`): the League's villain hideouts done as a bar.
- Between the first landing and the second floor the run finds one of five rooms: the Speakeasy, the VIP Room, the Back Office, Poker Night or the Basement.
- Each deals two of its three guards (d20, d6 moves, 2d6 or a trial), then a keeper beaten twice.
- The keeper offers spoils and, on a missed swing, lays a themed jinx that lasts only that fight: Prohibition (nobody says "drink"), Talk to My Agent, Per My Last Email, Poker Face, First Rule.
- Constants: `GUARD_*`, `KEEPER_*`.
- 20 cards, all Pub Crawl only. Dungeon night now has 289 cards; the catalog has 1,462.
- A run is now 36 cards; a won run takes about 46 draws.

**Balance:**
- Won 29.8%.
- Hidden rooms 28–33%.
- Adventurers 24–43%; the Plus-One is 6% over 600 forced runs.
- Routes 24–34%.

**Pokémon sheet** (owner: "nothing is gospel"). Eleven supplied rules that needed props, were chores or referred to things that don't exist became one-time actions:
- Egg, Lickitung, Psyduck, Ditto, Murkrow, Mawile, Relicanth, Farfetch'd, Vulpix.
- Team Magma and Aqua: there are no teams, so whoever wears red or blue joins you.
- Recorded in `reference/README.md`. The voice reference now holds the supplied sheets to the same test.

## Choose your spoils and the Bar Tab (2026-10-17; pushed to `main`)

- **Spoils.** All 38 bosses and elites now offer two trinkets when they fall: their signature and a contrasting alternative, such as the Hydra Tooth (+2 to boss rolls) or the Hydra Scale (+2 max hearts).
  - The table picks on a plaque, which puts the card aside.
  - Engine: `card.spoils`, `awaitingSpoils`, `takeSpoils`, and boons kept as `id#index`. Saves validate the index and allow one pick per card.
- **Bar Tab** (League: Baton Pass, `round` loot): passes a lost fight's drinks to someone else, once per draw (`party.passed`). A banner says "Point at someone".
- **Balance:** won 30.9%. Every adventurer, omen and route is in band; the Plus-One is 7%.
- **Verification:**
  - `npm test`: 225 passed. Lint, typecheck and build passed (runtime 3,761 KiB).
  - Chromium `crawl.spec.ts` and `quest.spec.ts`: 32 passed. New tests cover the spoils plaques (a stray tap does nothing) and the Bar Tab.

## Table-rule pass (2026-10-17, owner request; pushed to `main`)

**Owner direction.** Jinxes and table-behaviour rules are welcome "within reason": no props (Squirtle's sunglasses were cut because a bar may have none), and no work without a payoff or a laugh (the Pikachu naming rule). This also applies to the League.

**The standard** is in `docs/CARD_VOICE_REFERENCE.md` ("Table rules: the owner's test"):
- No props.
- It pays off: a laugh or a gotcha.
- No chores.
- One sentence.
- Short, or app-tracked as a jinx.

`tests/card-logic.test.ts` now fails a crawl card asking for something before every sip or drink, every time you stand, or all night. It also fails a jinx without a 1-drink slip.

**Dungeon.** Eight weak jinxes were replaced with gotchas:
- Thumb Master, Spooked (no eye contact), Question Master, No First Names, Bat Signal (point at the ceiling), No Pointing, Muted (mime only), Pinky Out.
- The Line Cook's all-night "yell behind" became the Behind! jinx.
- The fruit-fly coaster line no longer needs a coaster.

**League.**
- 18 chores became one-time actions ("Oink, then drink 2", "Hold your nose and drink 3", "Drink 4 on your knees").
- Groudon's "no water" and Maxie's "nobody refills" are gone.
- Erika's eyes-shut-until-your-turn is now shut for the drink only. Tulip no longer needs face paint.
- Agatha is a judged one-minute "nobody says a name" battle.
- Seven League cards lay real jinxes, lifted by the next boss (`crawlTheme` League `jinx` words): Agatha (No Names), Hop (Mate), Giratina (Backwards), Psyduck route (Question Time), Haunter (Mean Look), Team Rocket (That's Right!), Commander Mars (Lab Rat).
- Kept as short, funny rules: talk posh, slow motion, whisper, talk tiny, half speed, the cold shoulder, kneel.
- The 120 supplied Pokémon sheet cards are unchanged.

**Verification:**
- `npm test`: 223 passed. Lint, typecheck and build passed.
- Chromium `crawl.spec.ts` and `quest.spec.ts`: 31 passed, no retries.
- CI on the previous push (`0aaa924`, run 93) was green, including the WebKit release shards, and deployed.

## Pub Crawl at League depth (2026-10-17, owner request; pushed to `main` as `0aaa924`, CI green and deployed)

**Owner request.** Pokémon League is "really nice" and Dungeon night is falling behind: bring Pub Crawl up to League tier in fun and immersion, with more cards. Borrow from other games as well as inventing. The owner approved every idea in the proposal ("implement everything you think is great").

**Run structure (dungeon.ts):**
- Your adventurer (1 of 12).
- Tonight's omen (1 of 12).
- The Queue: the Quarter-Zips cut in (1 of 5).
- Floor 1 (8 rooms), then its boss (1 of 5).
- The Landing.
- Floor 2 (8 rooms), then its boss (1 of 5).
- The Lower Landing.
- Floor 3 (8 rooms).
- Closing Time: the Quarter-Zips again, 2 hits (1 of 5).
- Last Call (1 of 8).

The finale deals 33 cards. A won run takes about 42 draws; it was about 26.

**New systems (engine; all fields optional, schema v2 unchanged, old saves load):**
- **Adventurers** (`dungeon/classes.ts`) are the League's starter engine.
  - Each class has one felt perk and levels up twice. Level-up text is written from the numbers in relative words (`dungeonOmenWords.relative`).
  - The Drunken Monk starts bad and gets strong. The Plus-One is the worst by design, and levelling it up makes it worse.
  - The dice wear the adventurer's colours (35 palettes). Tonight's omen no longer colours them.
- **Boons** (`card.boon`, `party.boons`, `stackEffects`, `formEffect`): tonight's omen is now a boon.
  - Bosses on floors 1 and 2, and every elite, drop a **trinket** (38 in all).
  - Boons stack: numbers add, naturals widen, and a boon's satchel moves the size by its difference from 3. `omenEffect` returns the stacked effect.
- **Landings** (`encounter: "rest"`): two plaques, "Level up · drink 3" (`evolve`) or rest for 3 hearts.
- **Jinxes** (`card.jinx`, `party.jinx`): 17 spoken table rules (Picolo's viruses). A jinx lands on a loss, shows on the meter, in the party dialog and in a banner, and lifts when the floor's boss falls.
- **The Quaff** (`party.quaff`, `canQuaff`, `quaff`): reroll a lost d20 for 3 drinks, once until the next boss falls. A hex does not block it.
- **The Cup** (`party.cup`): every lost fight adds a splash. The end screens say who drinks it: the last swing hands it to anyone on a win; the last drawer drinks it on a wipe.
- **Wanted poster**: a floor's stage banner and the party dialog name the boss waiting at the bottom (`wantedBoss`).
- `restock` now also fires on any boss in a crawl without badges (Pub Crawl), so the Wizard, Templar and Brewmaster can use it.

**Content: 269 Dungeon night cards, up from 166.**
- Deck: 166, up from 118. Each floor has 20 fights; floors 1 and 2 have 3 elites and 5 bosses; Last Call has 8 bosses.
- Pub Crawl only: 103, up from 48. That is 61 finds (a second fork and merchant per floor, Tome and Second Wind for sale), 12 omens, 12 adventurers, 8 landings and 10 Quarter-Zips cards.
- Variety pass on the old plain "Drink 3 / Give 3" fights:
  - Named targets and table moments.
  - d6 move lists and 2d6 pairs (the League's `moves`/`pair`).
  - Jinxes on some losses.
- Ported from the League: the Revive and the Rare Candy become the dungeon's Second Wind and Dog-Eared Tome.
- Omen copy now speaks in changes, because omens stack: Cargo Shorts and Butterfingers say "one more/fewer satchel slot". Happy Hour and Thin Walls now say "every heal", which is what the engine always did.

**Tuning (`dungeon/shared.ts`):**
- Party hearts 12 → 11.
- Targets raised by 1: NEED 7/9/11, SAVE 9/11/13, BOSS 9/11/12, ELITE 10/12/14.
- Third-floor rooms cost 3 hearts; closing time costs 3.

`tests/dungeon.test.ts` (4,000 seeded runs; a sensible table quaffs when it has no die, and levels up unless at 6 hearts or fewer):
- Won 32.8%. A won run is 42.4 draws and keeps 4 boons. The Cup takes 9.5 splashes a run.
- Adventurers 27% (Rogue) to 42% (Paladin, Barbarian). Plus-One 7% over 600 forced runs.
- Omens 23% (Lock-In) to 42% (Regulars). Routes 28% to 38%.
- 82% of runs level up at least once; 40% reach level 3.
- Wipes come at the second boss (15%), closing time (19%) and Last Call (17%).

**UI:**
- Meter: jinx stud (bottom left) and Cup stud (top left, tips on each splash).
- Medallion: helm for the adventurer, fire for a landing, shadows for the queue.
- Card seals: trinket (green) and jinx.
- Plaques: an amber Quaff beside Reroll. The level-up plaque names the next level ("Berserker · drink 3").
- `PartyNewsBanner`: trinket found, jinx laid or lifted. `EvolutionBanner`: "Barbarian levels up!" with what changed.
- `CrawlRecord`: adventurer, boons, jinx, Cup, set-piece rows (the queue, closing time, and the League's rival, Legendary and Champion as their own rows) and wanted.
- Six new marks from game-icons via `scripts/crawl-icons.ts`.
- The League's words and plaques are unchanged.

**Verification:**
- `npm test`: 221 passed.
- The four aggregate harness tests (League and Dungeon) now have 30 s timeouts. Under a full parallel run the League aggregate hit the 5 s default; it passes alone.
- Lint, typecheck, `npm run build` and budgets passed: runtime 3,752 KiB; largest lazy chunk 145.5 KiB gzip; dungeon chunk 23 KiB gzip.
- `npm run cards:review` regenerated.
- Browser, Chromium only. Run against the container's Chromium 1194 through a throwaway local config, because Playwright's pinned build isn't installed here.
  - `crawl.spec.ts` (rewritten for the new run, 19 tests) passed alone, including both 320/390 px meter checks and the 375×667 fit sweep over all 269 cards. The sweep had first caught one overflowing card (Staff Only), which was shortened.
  - `quest.spec.ts` passed (League wording unchanged). Its fit sweep needed a retry once, after timing out while two Vitest runs shared the CPU.
- WebKit and a physical device: not checked.

**Risks:**
- Balance is measured by a scripted table, not people. The Quaff and level-up policies are guesses at real behaviour.
- At 320 px the meter carries four studs. They fit (tested), but it is busy.
- The Cup averages about 10 splashes; a "splash" is left to the table.
- Jinxes are table-behaviour rules, which the owner excluded for starter perks (2026-10-17). Here they are app-tracked and lift by themselves. Confirm the owner wants them.
- The deck play of jinx cards is plain text only.

**Next:** owner playtest, then device check (studs at 320 px, banner timing on a real phone); WebKit e2e in CI.

## Starters you feel, Bidoof, themed dice (2026-10-17, owner request; pushed to `main` for deploy)

**Owner request.** Starters and evolutions should be felt heavily. Add a Bidoof starter that is the worst, with an evolution that is worse, plus a few more bad or neutral starters. Theme the dice to the starter, and to the omen in Pub Crawl. The owner picked roll bonuses (B) and natural-range tweaks (E) from the proposal, plus the listed perks without any table-behaviour rules (no sunglasses, no blowing on drinks, no Pika naming).

**Engine (all fields optional; schema v2 unchanged).**
- `OmenEffect` gains:
  - `roll`: a bonus by kind, or `all`, added to single-d20 battle rolls.
  - `crit` (the lowest face that counts as a natural 20) and `fumble` (the highest that counts as a natural 1).
  - `reroll20`: a 20 is rolled again.
  - `restock`: an item back when a gym falls.
- `DiceRoll` gains `bonus`, `natural` and `flinched`.
- `rollDice` reads the omen for a crawl's single-d20 battle. `readTotal` reads a natural as the die's own 20 or 1, and holds any other bonused roll between 2 and 19, so a bonus never makes or breaks a natural. `resolveInstruction`, `rollWins` and `validateRoll` take the reading.
- d6 and 2d6 fights take no bonus.
- The card shows "17 +2 = 19", and "A 20 was rerolled." for Bidoof.

**Roster: 23 starters.**
- The 17 gained felt perks:
  - Charmander: +2 to route battle rolls.
  - Pikachu: +1 to every roll, and a natural 20 on 19 or 20.
  - Squirtle line: a Protect back at every gym from Wartortle.
  - Bulbasaur: heals +2.
  - Torchic: +2 to Ace Trainer and rival rolls.
  - Also natural-20-on-19 for Flareon, Samurott, Greninja and Cinderace, and restocks for Typhlosion and Sceptile.
- New:
  - **Bidoof**: Max HP 15, −1 to boss rolls, every 20 rerolled, bag of 2. Its evolution, Bibarel, drops to Max HP 14.
  - Magikarp, bad until Gyarados.
  - Wooper and Quagsire, nothing but a Potion.
  - Sunkern, Max HP 15, then Sunflora 16.
  - Slowpoke: heals +2, but bosses take a hit more.
  - Psyduck: natural 1 on 1 or 2, until Golduck.
- Roll bonuses are strong: −1 on every roll made Bidoof unwinnable (under 1%), so it is −1 on boss rolls only.

**Dice palettes.**
- `DicePalette { primary, secondary }` sits on omen cards and starter forms: 62 starter forms and 12 Pub Crawl omens, each a distinct pair.
- `presentation/dice/palette.ts` derives the whole skin (enamel stops, metal, trim, ring, ink, shadow, specular). Numerals are cream on darker enamel and dark on light enamel, and the enamel steps darker or lighter until the numerals reach 4.5:1 (`tests/dice-palette.test.ts`).
- Without a palette the dice are exactly the house brass and teal. The stage builds its skin from `omenForm(...).palette` when a roll starts.
- Checked by eye on painted face textures for 11 palettes; not checked on the live WebGL stage or a device.

**Harness.**
- League: won 24.4%. Starters 15% (Charmander, Oshawott, Wooper) to 42% (Mudkip); Squirtle 32%, Magikarp 23%.
- Bidoof, measured on its own over 600 forced runs, is 4% (the test holds it 1% to 8% and below every other starter).

**Tests.**
- `npm test` 208 passed (with the long timeout). Lint, typecheck and build passed (runtime 3696 KiB).
- Browser, Chromium: `quest.spec.ts` and `crawl.spec.ts` passed, including both 375×667 fit sweeps. A retry flake in the crawl smoke-bomb test happened because the random next room was an ambush; it is unrelated to this change.
- `tests/workshop/dice-texture.spec.ts` fails in this container ("numeral 7 horizontal centre (was 69.5)"). It fails identically on `8c90cbc`, before any dice change, so it is the container's font, not this change. It was not run in CI (workshop runs only on manual full validation).
- WebKit and a physical device: not checked.

## Starter revision pass (2026-10-17, owner request; pushed to `main` for deploy)

**Owner request.** Make the starter powers and evolutions unique and logically worded. New items are allowed if they help. Does evolution actually do anything? (A Bulbasaur evolved at the table and it was unclear what happened.) Show only the current Pokémon's name in the team dialog, not the whole line.

**Finding.** Evolution always worked in the engine, but the screen only said "What? Bulbasaur is evolving! Ivysaur". Ivysaur gave just +2 max HP, and its text said "Full HP back", which was wrong (max and current HP each rose by 2). Several forms changed one small thing, and the wording mixed "two less HP" with powers written relative to the base.

**Now.**
- `src/game/omenText.ts` writes every power from the numbers. The starter card is a flavor sentence plus its power ("Max HP 15. Every heal heals 1 more."), and each form's rules are its power.
- The evolution banner adds what changed ("Max HP 15 → 17. Gets a Potion.") and holds 5.2 s.
- The evolve plaque names the next form ("Ivysaur · drink 3").
- The team dialog shows only the current name and power; the evolution line is gone.
- Every starter has one signature, and every evolution is a visible upgrade: Ivysaur brings a Potion, Charmeleon +1 HP, Combusken an X Attack, Marshtomp a Protect, Grotle a bigger bag, Dartrix a Potion, Raboot and Cinderace HP, and Empoleon "Bosses hurt 1 less".
- Two new items, only from starters: **Revive** (saves one white-out at half max HP; Fuecoco's Crocalor) and **Rare Candy** (use it from the bag to evolve now; Froakie starts with one). Icons are drawn in-house at `public/art/league/revive.svg` and `rare-candy.svg`, with copies in `art/crawl/`.
- `tests/starters.test.ts`: unique power lines, a non-empty change for every evolution, the theme's item names, candy and Revive in the engine.

**Harness.** League won 23.8%. Starters 17% (Treecko, Oshawott) to 39% (Mudkip); hideouts in band. Evolution 76% / 39%.

**Tests.** `npm test` 204 passed (with `--testTimeout=300000`, as before). Lint, typecheck and build passed. Browser: see below.

## League variety pass and natural 20/1 (2026-10-17, owner request; pushed to `main` for deploy)

**Owner request.** League cards were "a lot of roll d20 then give/drink 3": make challenges, outcomes and specificity more varied. Add a standing rule for Pokémon League and Pub Crawl: a natural 20 doubles the good outcome (drinks given, HP gained, whatever applies) and a natural 1 doubles the bad.

**Before.** 212 of the 356 League cards were a single d20, and 141 of those resolved only to "Drink N." / "Give N." Hideout grunts, rivals, most Legendaries and every Champion shared one template.

**Natural 20 and 1 (both crawls).**
- Engine (`natural` in `src/game/engine.ts`, crawl only): on a single d20, a won 20 doubles the card's heal and item and lands two boss swings; a lost 1 doubles the hearts lost (before shield and bleed). No schema change.
- Text (`src/content/naturals.ts`, `withNaturals`): every League and Dungeon d20 has its own 20 and 1 outcome, with "Natural 20!" or "Natural 1!" and the drinks doubled. Applied in `league/shared.ts` (`boss`), `league/journey.ts` (`spot`, `rival`, `villain`) and at `dungeonCards`. Dungeon cards keep the text in the plain modes too. The 120 plain Pokémon sheet cards are unchanged.
- The party dialog legend gains two lines (`crawlTheme.naturals`, `.stake-natural`).
- `tests/naturals.test.ts`: every crawl d20 has single-face 20 and 1 outcomes, and neither reads like the roll beside it.
- Owner follow-up: "same for all cards with d20". Only 7 other d20 cards exist. Fuck Around and Nat One already had their own 1 and 20, so they gained the "Natural" lead. Missingno (a plain Pokémon card) gained a natural 1 ("everyone drinks 6"); it has no good roll for a 20 to double. Four cards where the roll is the amount stay as written: God's Drunkest Soldier (odd/even; a doubled 20 would be "Give 40"), Body Count, House row 8 ("drink 1d20") and Maddy Booty. Owner to confirm.

**Variety pass.**
- Fight helpers take a `Roll` (`vs` d20, `moves` six named moves on a d6, `pair` 2d6 with a winning pair), all derived from the leg's need so the constants still tune everything. A retune that moves a d6 split throws at load.
- Rewrote all 128 route, Ace, rival, grunt and hideout-boss fights: about 40 are d6 move lists, 20 are 2d6, the rest d20 with specific outcomes (a target at the table, a status until the drawer's next turn, a dare or drink, graded `{total}` losses, pairs of players).
- Rewrote the flat results of 60 gym, Elite Four, Champion and Legendary cards in place, keeping each card's win ranges. Lugia gained a fumble.
- Balance: Piplup fell to 9% (the floor is 10%), so it starts with a Protect ("Six more HP and a Protect"; it was "Five more HP").

**Harness after.**
- League: won 22.0% (was 23.1%). A won run takes 67.1 draws. Starters 12% (Piplup) to 41% (Mudkip). Hideouts 17% to 25%. Evolution 74% / 37%.
- Pub Crawl: won 25.1%. Omens 17% to 32%.

**Tests.** `npm test` 200 passed, but only with `--testTimeout=300000`: in this container both harness tests time out at the default 5 s even before the change (imports take about 70 s here). Lint, typecheck and `BASE_PATH=/side-quest/ npm run build` passed. Budgets: Pokémon chunk 36.6 KiB gzip (was 30.4), runtime 3686 KiB. `npm run cards:review` regenerated.

- Browser, Chromium only: `quest.spec.ts` and `crawl.spec.ts` passed, 26 of 26, including the legend and both 375×667 fit sweeps. The two sweeps exceed their 120 s timeout on this container, so they were rerun with `--timeout=900000`. The container's Chromium differs from the pinned Playwright build, so the run used an untracked `playwright.local.config.ts` that sets `executablePath: /opt/pw-browsers/chromium`.

**Not done or not verified:** WebKit (not installed in this container), a physical device, and a table playtest of the new outcomes.

**Next.** Playtest a League run and a Pub Crawl run and cut any outcome that slows the table down.

## Pokémon League journey (2026-10-16, owner request; merged to `main` and deployed)

**Owner request.** The dungeon crawl "is drastically more exciting" than Pokémon League. They asked for more leaders, Elite Four, Champions and Legendaries from many generations, plus simple new mechanics, and for the League to deal Pokémon cards only.

**Owner decisions:**
- Rebuild the League as a journey on the crawl engine.
- Gyms are random, not in canonical order.
- All nine regions.
- Pokémon cards only.
- Starters can evolve.
- A run of about 60 draws.
- The budget is changed (below).

**Now.** The League is a crawl that plays its pack alone, with Team HP 17.
- **Starter.** The run opens on 1 of 17 starters. Each is an omen with a trade-off.
- **Routes and gyms.** Then come eight routes, each 4 cards drawn from 15. Each route is closed by a gym. Gym k is 1 of 9 leaders: every region's kth gym, so the order is random but difficulty still ramps up.
- **Hideout.** After the fourth gym the run goes through one of 9 villain hideouts: 2 grunts, then a boss beaten twice.
- **The end.** Then Victory Road, the rival (beaten twice), a Legendary (1 of 30, 2 hits), 4 of 36 Elite Four, and a Champion (1 of 13, 3 hits).
- **Route cards:**
  - wild Pokémon
  - trainers (dice, or Won/Lost)
  - hazards
  - catches: a drink for a ball, and HP back
  - items and risky finds
  - a Pokémon Center (+2 HP)
  - a Poké Mart
  - a crossroads whose loud path deals one of the route's 2 Ace Trainers
- **Starter evolution.** Five routes carry an evolution card. "Evolve · drink 3" moves the starter to its next form, whose effect replaces the last; "Press B" gives one HP. Pikachu refuses to evolve.
- **Eevee branches** (owner follow-up). Its Evolve plaque splits into Vaporeon, Jolteon and Flareon. The table picks one, and that is Eevee's only evolution (`CardDefinition.branches`; `takeOffer`'s `branch`).
- **Badges.** Badges fill a row in the team dialog, and a pearl banner announces each evolution.
- **Cards.** 356 League-only cards; the catalog is 1,333. The 120 plain Pokémon cards are unchanged and play only in Short, Long and Infinite.

**Engine.** All new fields are optional, so schema v2 is unchanged.
- `CardDefinition.evolves` and `branches`, `Offer.evolve`, `PartyState.form`, and `takeOffer`'s `branch`.
- `omenEffect` reads the current form, and `omenForm` describes it.
- `questRecord` gains `form` and `badges`.
- `parseSession` validates `form`.
- Old meter-mode League saves still load and play to their end; that engine path stays.

**UI.**
- `crawlTheme.ts` gives each pack its words and marks: Team HP as Poké Balls, the Bag, Potion, Protect, X Attack, Escape Rope, Poisoned, Confused, Whited out, Hall of Fame. Icons are vendored in `public/art/league/`, with an egg for the starter.
- `EvolutionBanner`, the evolution line and badge row in the team dialog, and an evolve plaque that says what it does.
- The setup screen counts gyms ("17 HP · 8 gyms").

**Budget (owner, 2026-10-16).** `check-budget.ts` now caps each lazy chunk at 200 KiB gzip instead of their sum: a game fetches only the packs it plays. The sum is still reported, and so is the largest chunk.
- Totals now: 212.7 KiB lazy in all; the largest chunk is the dice library at 144 KiB.
- The Pokémon chunk is 30.4 KiB.
- Runtime is 3666 KiB of 4 MiB.

**Balance.**
- Tuning constants live in `league/journey.ts` (routes, hideouts, rival) and `league/shared.ts` (gyms, gauntlet).
- Some old gauntlet cards could not be won as multi-hit bosses (Mewtwo, Lugia and Deoxys at 5%, Lance 10%, the Eon duo 17%, Blue 20%), so their winning bands were widened. The jokes stay.
- **Harness.** `tests/league.test.ts` plays 4,000 runs:
  - won: 23.1%
  - by starter: Piplup and Treecko 14% to Mudkip 43% (Eevee 25%, picking forms at random)
  - by hideout: 21% to 27%
  - a won run takes 68 draws (10th to 90th percentile: 64 to 73)
  - evolution: 74% of runs evolve at least once, and 37% reach the final form
- **Length.** About half the bosses have no dice: the harness settles their Won/Lost plaques at 55%. So the run length bottoms out near 68 draws with four route cards per gym. The owner asked for "60 or so", and the harness holds 60 to 70.

**Tests.**
- `npm test`: 196 passed.
- Lint and typecheck: clean.
- Build: passed.
- `tests/browser/quest.spec.ts` is rewritten for the journey: setup, starter, evolution, Press B, gym and badges, whiteout, Hall of Fame, face-down deal, the Ancient Mew pair, and every League card fitting at 375×667.
- `quest` and `crawl` specs in Chromium: all passed except one crawl test that failed on its first attempt and passed on retry. In both runs it was the first test against a cold preview server.
- `@release` suite in Chromium and WebKit: 34 passed each (the Eevee test after its banner fix). `npm run test:workshop`: 26 passed.

**Not done or not verified:**
- A physical device (new `docs/DEVICE_CHECKLIST.md` item).
- The full E2E suite and workshop sweeps.
- Route cards do not join the plain deck.

**Next.** Play a real League run at the table and tune starters, HP and route odds from what the table feels.

## Pub Crawl replayability (2026-10-15, owner request; merged to `main` and deployed)

**Owner request.** "How else can we improve it? … more random scenarios, cards … more replayability without the same experience." The owner picked three features: floor variants, run omens and new room types. More cards and a UI polish pass came with them.

**Before.** Room order was already random (7 of 17 per floor), but the run's shape was fixed: the same three floors, only six bosses (each met every other run), and the same rules every time.

**Now.**
- **Tonight's omen.** Every run opens on 1 of 12 omen cards. Each has a typed effect that holds for the run (`party.omen`):
  - starting hearts
  - starting items
  - satchel size
  - extra damage by room kind
  - extra healing
  - extra boss hits

  Two of the omens are table rules only.
- **Floor variants.** At each depth the run is one of two floors: Cellar or Wine Cellar, Catacombs or Sewers, Drowned Taproom or Kitchen. That makes 8 dungeons. Each floor has 21 rooms and 3 bosses, and Last Call has 4.
- **New rooms.**
  - **Ambushes** (`hits: 2`): beaten twice.
  - **Merchants:** `offers` plaques. Each plaque has a drink price or a heart price; a heart price is never the last heart.
  - **Forks:** the loud door swaps the floor's next room for one of its 2 elites.
  - **Elites:** harder, cost a heart more, and always pay an item.
- **Cards.** Dungeon night grew from 57 to 166 cards: 118 deck cards plus 48 crawl-only. The library is now 1,021 cards.
- **Play again** after a crawl deals a fresh omen and fresh floors.
- **Tuning.** Catacombs bosses now need 10 and Last Call 11 (was 9 and 10). The extra finds had lifted the win rate to 34%.

**UI.**
- **Medallion:** shows the omen's crystal ball and ambush pips.
- **Card plaques:** merchant and fork plaques show their icon, heart-price seal and label. They fit three across at 320px, and an unaffordable one is greyed but solid.
- **Party dialog:**
  - shows tonight's omen;
  - gives the satchel as many slots as the omen allows;
  - lays out hearts in balanced rows (no more 11 + 1);
  - has a legend for the card seals, because the seals' hover tooltips never worked on touch. A tap-to-explain seal wasn't possible: the seals sit inside the card's button.
- **Setup:** counts floors from the quest.
- **Icons:** 4 new, from the vendored game-icons set (`scripts/crawl-icons.ts`).

**UI pass (same day, owner: "non-cohesive and clunky"; "the green cellar icon … looks terrible and also clips").**
- **Hearts meter:** now a brass medallion matching the room medallion and the menu. It is the same size as the menu button, so the top row is symmetric. The hearts left sit inside a large heart, like a Hearthstone health gem; the full count (e.g. 12) is in the party dialog. Satchel and curse studs sit on the rim.
  - The floor name moved out of the meter: it is on every card's ribbon and in the party dialog.
  - The meter no longer crowds the medallion at 320px.
- **Card seals:** one pill style for every seal.
  - Risks on the left: −hearts, the curse, and a boss's or ambush's swings shown as pips (new).
  - Gains on the right: +item, +hearts.
  - In a crawl the seals replace the pack mark, which collided with the boss's hits seal.
- **Flee and Reroll:** now violet, the item colour used everywhere else.
- **Party dialog:** the seal legend matches the new seals.
- **Damage numbers:** a red "−2" or gold "+2" pops on the hearts medallion, drifts toward the card and fades (it only fades with reduced motion). The full-screen flush stays.
- **Card position:** on tall phones the card sits higher. The spare height is split one third above and two thirds below, instead of centring the card. This applies to every mode.
  - I tried widening the card, but `game.spec.ts` enforces 23px of edge clearance at 320px, so the size is unchanged.
- **Ribbon colours, one meaning each:** gold for a fight, violet for anything found or chosen (treasure, relic, shrine, merchant, fork), crimson for a boss, pearl only for tonight's omen. Shrines and forks were pearl.
- **Flaky tests:** two browser tests failed intermittently under the full parallel run ("reduced motion and keyboard play", "badge case opens"). Each passed 5 of 5 alone, both with and without these changes.

**Engine.** Everything is optional, so schema v2 is unchanged and older saves load. A test covers loading a pre-omen crawl save.
- `QuestSlot`, `questRoute` and `questStages`
- `QuestStage.elite`
- `Offer`, `awaitingOffer`, `canTakeOffer` and `takeOffer`
- `OmenEffect`, `omenEffect`, `satchelSize` and `hitsNeeded`
- `encounter` and `isBossCard`
- `pickFinale` never deals a fork last on its floor.
- `parseSession` checks:
  - the elite swaps;
  - that the omen is a dealt omen card;
  - satchel size against the omen.

**Test harness fix.** The seeded random generator in `tests/dungeon.test.ts` took tiny first draws from small seeds, so it could never pick the second floor in a slot. It now scrambles the seed first. It plays 4,000 runs.

**Verified.**
- `npm test`: 179 passed.
- **Harness:** won 27.7%. By omen, 17% (Lock-In) to 36% (The Regulars); by dungeon, 22% to 30%. Every group is held between 10% and 50%.
- **Build and budgets passed:**
  - runtime 3563 KiB of 4 MiB;
  - lazy JS 191.6 of 200 KiB gzip (was 184.5);
  - initial JS 100.0 KiB.

  **Watch the lazy cap:** only 8.4 KiB of headroom is left.
- **Playwright:** `crawl`, `game`, `layout` and `quest` specs in Chromium and WebKit: 110 passed, 2 intentional skips. The crawl spec has new tests for the omen opening, merchant, fork and elite, ambush, and the omen in the party dialog. Every one of the 166 cards fits its face at 375×667.
- `npm run test:workshop`: 26 passed. The workshop preview now finds a crawl card's route and deals elites where a loud door would. The stress set includes merchants and forks.
- **Screenshots reviewed** at 320 and 375: omen, merchant, fork, elite, ambush and party dialog.
- **Not verified:** a physical device (new `docs/DEVICE_CHECKLIST.md` item), and the full E2E suite (only the four specs above were run).

**Next.** Physical-device check (`docs/DEVICE_CHECKLIST.md`), then play-testing the omen and floor balance at a real table.
## Tooling: lint, test typechecking, faster CI (2026-10-15, branch `optimize`)

**Owner request.** "Let's do it all" after a review of speed and practices.

- `tsconfig.json` now includes `tests` and `*.config.ts`; 8 latent type errors in tests were fixed without changing behavior.
- ESLint (`eslint.config.js`, `npm run lint`): typescript-eslint recommended plus react-hooks `rules-of-hooks` and `exhaustive-deps`. `any` is allowed only in the untyped dice-library adapter and its texture spec.
- `src/main.tsx` split: `app/useAppUpdate.ts` (service worker, takeover, update checks, preload-error reload), `app/useStandalone.ts` (standalone detection and top pinning), `components/TopBar.tsx`; motion CSS variables are computed once at module load. No behavior change.
- CI: build job (unit, lint, build, upload `dist`) then a Chromium job and three single-worker WebKit shards in parallel on the plain runner, each installing only its browser (binaries cached per Playwright version); deploy waits for both. The Playwright container was tried first and dropped: its WebKit was slower and failed a pack-dialog test that passes on the runner. Docs-only pushes skip.
- Measured on PR #9: the whole run took 214s, against 256–377s for the last three `main` runs. Build 38s; Chromium 99s; WebKit shards 115s and 170s (that shard included one retry). Steps: browser install 17s on a cache hit (39s on a miss, against 55s before), Chromium release 54s, WebKit release 144s unsharded.
- Flakes seen while measuring, all passing on retry and not caused by this change: WebKit `title-fit` mid-flip (about 1 run in 20 on the unchanged build, full E2E only) and `dice.spec.ts` "a restored unrolled dice card rolls by tapping the card" (once in CI). The every-pack test in `secondary.spec.ts` failed every time on Linux WebKit until it waited for each toggle; the tiles don't resize on toggle, so it read as Playwright tapping mid-scroll rather than an app bug.
- The first `main` run after merging (`5fa3615`) failed and did not deploy: the every-pack test hung on Done in a WebKit shard. The trace's screencast had stopped repainting while the test still ran, so Playwright's stability check (which waits on frames) never finished. Every failing setup ran two WebKit workers on one runner; the old mixed-browser job never did this. WebKit shards now run one worker each.
- Considered and dropped: recompressing the app icons (7–20% smaller at visible quality cost).

## Dungeon night and Pub Crawl (2026-10-15, built on owner request)

**Owner request.** Build the dungeon crawl "elegantly and professionally... really high quality and great feeling, going the extra mile". Names: pack "Dungeon night", mode "Pub Crawl". Decisions: 12 hearts; healing is hard (a fresh, full drink for one heart); a wipe ends with everyone finishing their drink. Standing rules apply: no names or teams, the phone stays on the table, and players only tap.

**The game.**
- A new pack, `dungeon` (`src/content/dungeon.ts`): 48 monsters, trials, traps and bosses that also play as ordinary cards in Short, Long and Infinite. Plus 9 finds (treasure, shrines, relics) that only appear in Pub Crawl.
- Pub Crawl plays the pack alone: three floors (the Cellar, the Catacombs, the Drowned Taproom), each with 7 random rooms and a boss. The bosses take 1, 2 and 3 hits and are dealt again until they fall.
- The table shares 12 hearts. A lost fight costs the drawer a drink and the party hearts. At zero hearts the party wipes.
- Items (draught, shield, loaded die, smoke bomb) and curses (bleeding, hexed) are described in `docs/GAME_DESIGN.md`.
- **Difficulty is measured, not guessed.** `tests/dungeon.test.ts` plays 2,000 seeded runs through the real engine, with a table that plays sensibly. About **25%** of runs survive. Wipes: about 6% in the Catacombs, 16% at its boss, 27% in the Taproom and 26% at Last Call. The first content pass survived only 8.6% of runs, so rooms, traps and bosses each came down a step (constants at the top of `dungeon.ts`).

**Engine.**
- A quest may carry `party: { hearts }`. That makes it a crawl: `goal` 0, the stages are the whole run, and stage cards may also be deck cards.
- New card fields: `damage`, `hits`, `reward`, `curse`.
- Party state is kept in `quest.party`. It is optional, so schema v2 is unchanged and older saves load as before.
- Other engine changes:
  - `canUseLoot` and `spendLoot` handle the satchel.
  - Skipping a battle that offers a choice now counts as walking away: neither a win nor a loss.
  - `packCardIds` no longer lists a card twice.
  - The quest record marks boss stages.
- `parseSession` validates the party, and counts `rounds` (boss hits that didn't fell it) as draws.

**Interface.**
- **Top bar:** a hearts meter (floor name, curse marker, satchel count stud) and a room medallion that turns into the boss's hit pips.
- **Cards:** wax seals in each card's foot for the stakes. Flee and Reroll plaques appear next to Won/Lost or a card's choice.
- **Meter dialog** (the party): hearts, curse, satchel with a Drink button, and floors.
- **End screens:** "Last call, survived." and "Party wiped."
- **Effects:** a red flush when hearts are lost, a gold one on a heal, a heartbeat at 3 hearts or fewer, and stage banners shown once per stage.
- **Setup:** quest modes now sit one per row, with each mode's own mark (`quest.mark`). On screens 720px tall or shorter they sit side by side as compact chips, so Play clears Safari's toolbar. Choosing Pub Crawl replaces the pack picker with a summary of the crawl.
- **Icons:** 12 game-icons silhouettes, written by `scripts/crawl-icons.ts`.

**Also in this change.** Dropped the "hardcore" name: battles are simply the core League rule (owner, 2026-10-15). Fixed `docs/GAME_DESIGN.md`, which still said leaders earn badges "win or lose".

**Verified.**
- `npm test`: 171 passed, including 16 Pub Crawl tests and the 2,000-run difficulty check.
- Build and budgets: 3524 KiB runtime of 4 MiB.
- New `tests/browser/crawl.spec.ts`, Chromium:
  - start, stakes and Flee, Reroll, trial plaques, boss pips, the party dialog and its draught, wipe and victory screens;
  - the meter at 320 and 390px;
  - every Dungeon night card fits its face, with its plaques showing, at 375×667.
- Full production E2E (Chromium and emulated WebKit), last full run: 231 passed, 3 intentional skips. The only 4 failures were the two stale counts in `game.spec.ts` and the 320×548 home layout, which this change caused and then fixed.
- `game.spec.ts`, `layout.spec.ts` and `crawl.spec.ts` were then rerun in both browsers and pass.
- **Not verified:** any physical device. Screenshots were reviewed for setup, every crawl state, and both end screens.

## League battles: badges only on a win (2026-10-15, pushed as `086244c`)

**Owner request.** (Asked for as "hardcore mode"; the owner then said it is simply the core League rule, with no separate name.) "Hardcore mode for sure. You should be able to fail the final leader always and have to keep fighting random champions until you pass. Just make that default. Drop the other league ideas."

**Rules now (every League game; no option).**
- Gym leaders and Champions are `battle` cards. A badge counts only when the leader is beaten. A lost leader goes back into the rest of the deck, at least one card away, and the remaining leaders are re-paced, so a run still deals about one leader every five draws until the eighth badge.
- Dice leaders win on their marked outcomes (`win: true`, `doublesWin: true`). Leaders without dice land with **Won** and **Lost** plaques, and the card ignores taps until one is picked. A lost dice battle greys its ribbon and badge once the result is on the card.
- A lost Champion is replaced by another Champion, dealt next, until one falls; only that win ends the game. The Hall of Fame names the Champion beaten. The Legendary and Elite Four are not battles and play as before.
- Each lost battle is a draw that takes no deck position or finale step, counted in the optional `quest.lost`. Saves stay schema v2; saves without it load unchanged. A League game saved before this update keeps its old card snapshot, so it finishes under the old rules.

**Card changes (`src/content/pokemon-league.ts`).** Every leader now has a way to win, and the table can judge it the moment it is played:
- Rewritten: Misty, Erika, Koga, Blaine, Falkner, Bugsy, Morty, Pryce, Brawly, Wattson, Norman and Winona. Before, they had no way to win, a rule that lasted until your next turn, or a roll-or-do-it choice.
- Pryce and Brawly are now feats, not choice cards.
- Win outcomes were marked on the other dice leaders and on all three Champions.

Champion win chances per fight: Blue 20%, Lance 10%, Steven 28%. That works out to roughly five Champion fights per run, which is intended.

**Changed files.** `src/game/{types,engine,dice}.ts`, `src/app/persistence.ts`, `src/content/{validate,pokemon-league}.ts`, `src/presentation/{controller.ts,card-front.css}`, `src/screens/Play.tsx`, `src/components/Cards.tsx`, `src/main.tsx`, `src/workshop/Preview.tsx`, tests `tests/{quest,dice}.test.ts`, `tests/browser/quest.spec.ts`, regenerated `docs/CARD_REVIEW.md` and `docs/card-review.csv`, plus these docs: AGENTS.md, AUTHORING.md, and the CLAUDE.md files in content, game and screens.

**Verified.**
- `npm test`: 155 passed, including 6 new battle tests.
- Build and budgets passed: 3469 KiB runtime.
- `quest.spec.ts` in Chromium and emulated WebKit: 22 passed, including the new Won/Lost, lost leader and lost Champion tests.
- Full production E2E, Chromium and emulated WebKit: 213 passed, 3 intentional skips, exit 0.
- **Not verified:** a physical device.

## Dungeon crawl plan (2026-10-15; built as Dungeon night / Pub Crawl above, with retuned numbers)

**Owner brief.** Very flavourful cards; a game that is actually difficult and can be lost; inspired by Heroes of Barcadia, but its own thing, not more of the same. The standing rules still apply: no teams, no names, the phone stays on the table, and you only tap.

**Research.** Heroes of Barcadia uses your drink as your health:
- Monsters are fought with a d20 against a level. Losing means drinking the monster's damage, and winning earns loot and power-ups.
- Traps need a 10+ to disarm. Dying resets you and costs you your loot.
- After three power-ups you can face the Grand Drink Guardian, whose 15+ roll ignores every bonus.
- Reviewers liked the drinking and the jokes but called it "dumb luck" with little strategy.

We keep the d20-against-a-level fight and the loot, and add what Barcadia lacks: one shared fate for the whole table and a real way to lose. Sources: rulespal.com/heroes-of-barcadia/rulebook and the Meeple Mountain review. Card text stays original; we don't copy theirs.

**The game: pack "Dungeon night", mode "Pub Crawl" (owner, 2026-10-15).** The bar has a cellar, and the cellar goes down forever. One run is three floors: the Cellar, the Catacombs and the Drowned Taproom. Each floor deals about 8 rooms and then its boss. The whole table is one party, and the drawer plays each card, as now.

- **Party HP (new meter).** The table shares 12 hearts, shown in the top row where the badges are now. A lost fight, a failed trap or a bad event costs hearts, and the drawer also drinks. At 0 the **party wipes**: everyone finishes their drink, and the game ends on a defeat screen showing the floor and room reached. There is no revive.
- **Rooms** come from a separate pool on each floor, so difficulty climbs:
  - *Monsters* (about 40%): d20 battles. Floor 1 wins on 7+ and costs 1 heart on a loss; floor 2 wins on 9+ (2 hearts); floor 3 wins on 11+ (2 hearts). Win outcomes hand out drinks.
  - *Traps:* a d20 save at 10, 12 or 14 by floor, costing 1 heart.
  - *Feats:* Won/Lost plaques. Examples: the riddling tap, holding a full pint at arm's length, a staring contest with the creature in the mirror.
  - *Loot*, *shrines* (+2 hearts, and the table toasts) and *choice rooms*, using the existing choice plaques: open the chest or walk away, take the left or right door.
- **Loot** sits in a small tray of at most 3 items. Each is tapped once to use, and none needs the phone to move:
  - Healing Draught: the drawer downs a fresh, full drink and the party heals 1 heart (owner, 2026-10-15: healing should be hard).
  - Coaster Shield: the next heart loss is ignored.
  - Loaded Die: reroll the last failed roll.
  - Smoke Bomb: flee a room monster, but not a boss.
  - Skeleton Key: skip a trap.
- **Curses** last until the end of the floor and show beside the hearts. Examples: every roll −2; all damage +1.
- **Bosses** must be beaten, using the League's battle rule. A boss takes 1, 2 or 3 hits by floor, needing 8+, 10+ or 12+. Each failed swing costs 2, 2 or 3 hearts. The boss is dealt again, to the next drawer, until it falls or the party wipes. Each floor has two possible bosses, picked at random. The final boss is one of two: **The Last Call Lich** or **The Bartender Below**.
- **Difficulty (Monte Carlo, 30,000 runs, with loot used when hearts reach 3).** With the one-heart Healing Draught, the party wins about **29%** of runs and wipes on floor 2 about 12% of the time and on floor 3 about 59%. At the old targets (8+/10+/12+ monsters, 9+/11+/13+ bosses) the costly draught dropped the win rate to 18%, so the targets came down one step. Hearts, the target rolls and boss damage are the tuning knobs.

**Flavour (first drafts, house voice; drawer acts; no names or teams).**
- *Keg Golem* (floor 1 boss): "It's 800 pounds of lager and it's tapped. Shotgun your drink, then roll d20." A 9+ is a hit: "You pull its plug. Give 5." A miss: "It sits on you. Drink 4. −2 hearts."
- *Gelatinous Shot:* "A cube of jello shots, and something's floating in it. Roll d20." An 8+: "You eat your way out. Give 3." A miss: "You're inside it now. Drink 3. −1 heart."
- *Hangover Hydra* (floor 2 boss): "Every head you cut off grows back with a headache. Roll d20." A hit: "One head down. Everyone else drinks 2." A miss: "It breathes regret. Drink 5. −2 hearts."
- *Tab Goblin:* "It's been putting drinks on your tab since 2019. Roll d20." A win: "You stiff it. Give 4." A loss: "It collects. Drink 3. −1 heart. Lose your newest loot."
- *Bouncer Troll:* "You're not on the list. Prove you're sober: walk heel to toe across the room and back." Lost: drink 4, −1 heart.
- *Karaoke Banshee:* "It screams the first line of a song; sing the next one." Lost: drink 3, −1 heart.
- *The Mirror:* "Staring contest with your reflection in your drink." Blink and you drink 3, −1 heart.
- *Mimic Cooler:* choice between "Open it" (a d20: 11+ gives a Healing Draught, anything less "It bites. Drink 4. −2 hearts.") and "Walk away".
- *Wishing Drain:* a shrine. "Toss in a coin, or a fry. The party heals 2. Everyone toasts the drain."
- *The Last Call Lich* (final boss): "Lights come up. The music stops. It's last call forever unless you kill it. Roll d20." A 13+ is a hit; a miss: "Closing time. Everyone drinks 4. −3 hearts."

**Build order.**
1. **Engine.** Add party `hp`/`maxHp`, `floor`, `curse` and `loot` to `QuestState` (all optional, still schema v2), plus a card `damage` (hearts lost on a loss) and a boss `hits`. Floors become per-floor room pools followed by a boss stage, built on the existing battle and re-deal logic. Add a defeat ending (`phase: "complete"` with a `wiped` flag). Persistence validation, and seeded tests that keep the simulated win rate between 20% and 45%.
2. **Content.** About 60 rooms (24 monsters, 10 traps, 8 feats, 8 loot, 4 shrines, 6 choices and events) and 6 bosses, all original and in the card voice.
3. **UI.** A hearts meter, the loot tray (tap to use), a curse marker, floor banners using the existing `StageBanner`, and the defeat and victory screens.
4. **Art.** Hearts, loot icons, a defeat tombstone and a treasure scene, perhaps a cellar card pair. About 600 KiB of budget remains.
5. **Tuning.** Play a run with the group.

**Owner decisions (2026-10-15).** 12 hearts. Healing is hard: a fresh, full drink for one heart. A wipe ends with everyone finishing their drink. Names: pack "Dungeon night", mode "Pub Crawl" (a dungeon crawl and a pub crawl at once); floors the Cellar, the Catacombs and the Drowned Taproom; final boss the Last Call Lich.

## Crude card rewrite, all decks (2026-10-07; merged as PR #8 on 2026-10-15)

**Owner request.** "Really review the cards and get more creative and crude-funny. A lot of them are just straight up dice roll conditionals and math." No lore supplied ("just do your best"), "as crude as you'd like", King's Cup classics may be rewritten, all decks in scope. This overrides the House/Pokémon "source wording only" rule for this pass; the changes are listed in `reference/README.md`.

**What changed.**
- **Core (105 → 96, dice 36 → 16).** Cut the roll-and-pour cards and duplicates (Dice Debt, Lucky Sip, Open Hand, Pay Your Tab, Close Call, Loot Drop, Seven Is Heaven, Social Sip, Fuckin' Math, Pathetic, Snake Eyes, Lucky Bastard, Critical Failure, Coin Flip, Fate, Blessing, Lucky Sevens, Boxcars, Nat Twenty, Skyscraper, Overdrive, Big Spender, Loose Change, Committee, Group Roll, Round for the Table, Heavy Hand, plus bland fillers). Kept dice where the roll is the joke (Big Dick Energy, Prostate Exam, Walk of Shame, Gas Station Sushi, Body Count, Lap Dance Roulette, Hot Seat, Dice Tax, Same Shit). Added table-moment cards (Hostage Video, Dramatic Reading, Search History, Meg Ryan, Who Farted, Phone Check, Ex Files, Wipe Check, crude categories and rules). Test-referenced IDs kept (`house-special`, `bar-tab`, `cheers-idiots`, `dice-tax`, `same-shit`, `fuck-around`, `chosen-one`, `categories`, `rulemaster`, `buffalo`); retired IDs are not reused.
- **Dice rules text.** Pokémon, League and Cabin dice cards now state a premise; outcomes carry the numbers with a punchline. No dice mechanics, IDs or League structure changed.
- **House.** Thirteen flat rows got a crude kicker after their original sentence; in-joke rows untouched.
- **VIP.** The twelve generated cards rewritten (categories and IDs unchanged); the four sheet rows untouched.
- **Most Likely To.** 61 bland prompts retired as `null` placeholders (IDs keep their numbers), 61 crude prompts appended as `likely.251`–`likely.311`; still 250 cards.
- Count assertions updated: `tests/workshop.test.ts` (Core 96, 16 dice, 705 total), `tests/dice.test.ts` (Same Shit's new text), `tests/browser/layout.spec.ts` (350-card League setup), `tests/browser/secondary.spec.ts` (190 Core+House, 661 all packs).

**Verification.** `npm test` 141/141. `BASE_PATH=/side-quest/ npm run build` passed: 3049 KiB runtime, 89.4 KiB initial + 175.8 KiB lazy gzip, no card text in the initial chunk. Full production E2E in **Chromium only**, no retries: 96/96 passed. Workshop suite (dev server, Chromium only, serial, no retries): 12 passed, 1 failed. Every authored title fits its band at supported widths, and the stress cards keep their ratio at small phone, large phone and iPad. The failure is `dice-texture.spec.ts` (numeral 7 horizontal centre 186.5 px off); it fails identically on unmodified `main` in this container, which runs a different Chromium build (1194, via `executablePath`) than the repo's pinned Playwright, so it is unrelated to card copy. That is not a pass. WebKit is not installed in this cloud container, so the WebKit half of every suite did not run. No physical-device check. Long-rule warnings remain review flags only (all rules are under the 120-character / 24-word hard limit).

**Next.** Owner reviews the copy (`docs/CARD_REVIEW.md` is regenerated), then a Short game with the group. Run the WebKit suites before merging. Merging to `main` publishes; it needs the owner's go-ahead.

## Ancient Mew League pair in play; repository cleanup (2026-10-15)

**League pair.** Every card in a Pokémon League game now uses the Ancient Mew back and front (`public/art/card-back-league.webp`, `src/presentation/art/league-front.webp`, 768×1152, 268.6 + 123.5 KiB). `main` gets `.league-deck` while the displayed game's `config.quest` is `pokemon` (`LEAGUE_QUEST` in `frame-surfaces.ts`). It applies to the card back, the deck stack, the front and Previous Card; other modes keep the base pair. The pair is preloaded with the other surfaces, and a resumed League game holds its first render for it. `scripts/ancient-league-art.ts` now writes these two runtime files directly. New `@release` test in `quest.spec.ts`. Runtime is 3466 KiB of the 4 MiB budget.

**Cleanup.** Removed from the tree (all still in git history): 133 unreferenced files (old study screenshots in `docs/studies` except the typography study page the title-fit test loads, superseded art drafts and review captures, the retired continuous-frame slices, rejected Ancient front drafts, the superseded trophy League back with its `draft.json` step in `scripts/league-art.ts`), plus untracked " 2" duplicates, `.DS_Store` files and `test-results/`. Kept: sources for every shipped asset and every file a script, test or config reads.

**Done on owner approval (2026-10-15).** Deleted the seven merged remote branches and their four local copies, dropped the 2026-09-25 stash (`0bed924`), pruned the two dead worktree records. Only `main` remains.

**Verified.** `npm test` 149 passed; typecheck clean; build and budgets passed. Full production E2E, Chromium + emulated WebKit: 209 passed, 3 intentional skips. Every-title workshop fit: passed in both browsers. Update flow passed. League back and front inspected in a WebKit capture at 390×844. **Not verified:** a physical device.

## Published Secrets & fuses and the card rewrite (2026-10-15)

**Merged.** PR #7 (Secrets & fuses, 150 cards) and PR #8 (card rewrite) were reviewed, rebased onto `main`, re-verified and squash-merged. The catalog is 855 cards in 7 packs; the plain modes deal 811 (92 sip, 377 group, 49 category, 221 challenge, 72 rule; 75 dice), plus 24 League gym leaders and 20 gauntlet cards.

**Review changes.** The runtime budget is 4 MiB (owner decision 2026-10-15; Secrets & fuses passed 3 MiB by about 1 KiB). Secret and timer state is keyed per dealt card, like the card rotator. The title fit divides by the band's exact computed height rather than its rounded `offsetHeight`, which let "Corporate Wellness" overflow by a fraction of a pixel at 330px. PR #8's count conflicts were merged with PR #7's seventh pack; generated files were regenerated.

**Verified (final tree).** `npm test` 149 passed; build and budgets passed (3075 KiB runtime). Full production E2E, Chromium + emulated WebKit: 207 passed, 3 intentional skips, no flakes. Workshop title fit for every title, both browsers: passed. Update flow passed. **Not run:** the workshop every-card geometry sweeps; any physical device. PR #7 was only ever tested in Chromium before this; both browsers now pass. Not changed: Paranoia passes the phone to the left neighbour and Forehead holds it to a forehead, which stretch the pack's "phone never leaves the table" rule.

**Next.** The Ancient Mew League card pair (`assets/source/league-ancient-2026-10-06/`, 392 KiB) is still review-only; it now fits the 4 MiB budget.

## Title fit, League finale flip, Hall of Fame link (2026-10-15, deployed as `fa1e476`)

**Reports (owner, Safari on a Mac).** A card title rendered tiny beside large rules; in a Pokémon League game the next card's frame visibly turned over after a card was put aside; on the Hall of Fame both actions looked like buttons.

**Causes and fixes.**
- Title: the fit in `Cards.tsx` measured the heading's on-screen rect. A re-fit that runs during the flip (a resize or font load) sees a box stretched by the 3D turn, settles small, and nothing re-fits once the card lies flat. The height is now divided by the title band's own on-screen stretch, which recovers the flat height at any angle. Reproduced live: a 1px resize 200 to 360 ms into the flip left the title at 18px in WebKit, and at 35.7px in some Chromium runs, instead of 44.6px.
- League flip: finale cards are dealt without moving the deck, so `cycle`/`position` repeat and `Play.tsx` reused the face-up rotator, which turned back over. The rotator is now keyed by `session.discarded`.
- Hall of Fame: "Change deck" never had a background; the painting's stone steps sat behind it. `.painted-hall::before` now fades the hall into the table above the buttons.

**Verified.** `npm test` 141 passed; typecheck clean; Pages build and budgets passed. Full production E2E (Chromium + emulated WebKit): 188 passed, 3 intentional skips, 1 flaky (`pages.spec.ts:22`, WebKit, then 4/4 alone). New `tests/browser/title-fit.spec.ts` and a finale-flip test in `quest.spec.ts` fail on the old code and pass with the fixes (6/6 and 12/12 with repeats). Release smoke 45/45, update flow passed. Hall of Fame checked in a WebKit capture at 390x844. **Not verified:** real Safari or an iPhone; workshop suites.

## Painted title crest and Safari-only installation help (2026-10-06, deployed)

**Owner decision.** Rejected the ordinary horizontal text/small-tankard treatment; approved a cohesive painted title crest. Removed the prominent Install button. Asked for quiet installation instructions available only in Safari on an uninstalled iPhone/iPad.

**Final UI.** `Setup.tsx` uses the custom carved gold **Side Quest** crest, with the tankard/quest marker integrated into its teal-leather, walnut and brass frame. Title remains an accessible h1 through the image alt; a live-text fallback appears on image failure. Selected modes use quieter teal with a gold outline, leaving the crest and Play as the focal points. The setup-height calculation has no Install-row reservation. `main.tsx` renders the topbar only during play and places a borderless information glyph in the title area's upper-right corner, with a 44px target and visible keyboard focus. Initial placement beside Card packs was refined to page-level help after visual review; it adds no layout row. The crest is decoded in the first-screen preload.

**Visibility / state.** `src/app/install-help.ts` conservatively recognizes mobile Safari and touch-capable iPad desktop mode, excluding known alternate/embedded browser signatures. Help appears only on setup, outside standalone mode, without the dismissal flag. Desktop Safari, Android, Chrome/Firefox/Edge on iOS, ordinary embedded web views and installed-app launches have no hint. Safari does not expose a reliable inventory of separately installed Home Screen copies; the existing standalone check only identifies the current launch. The guide therefore also offers **Already added — hide this hint**, remembered in the new UI-only `side-quest.install-help-dismissed.v1` key. Got it merely closes and restores focus. No game/session schema, saved outcome, pack content, old-key migration, approved card surface or dependency changed.

**Instructions / art.** The local guide retains Share → Add to Home Screen → Add and Open as Web App if offered, plus the separate-Safari/Home-Screen-save notice. Checked against [Apple's guide](https://support.apple.com/en-gw/guide/iphone/iphea86e5236/ios) and [WebKit's Safari 26 notes](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/). Built-in image_gen output is preserved at `assets/source/title-crest-2026-10-06/title-crest-v1.png` (2132×737, alpha); exact prompt, style references and export parameters in `selected.json`. `npx tsx scripts/title-crest.ts` regenerates `public/art/side-quest-title-crest.webp`: **768×276, 56.0 KiB**, 8px transparent padding, quality 84. Script enforces its 60 KiB allocation; global budgets are unchanged. Original emblem remains for completion. `theme.ts` registers the new local asset. Old Install icon/pill styling was removed from `UI.tsx`/`style.css`.

**Verification.** Unit **141/141 passed** (15 new meaningful Safari eligibility cases). Production build/typecheck/content/budgets passed: **3049 KiB runtime; 89.3 KiB initial + 173.4 KiB lazy gzip; 77 precache entries** (local duplicate SVGs included). About 23 KiB headroom remains; no card text in initial JS, no workshop in production. Full production E2E on fresh port 4438, serial/no retries: **189 passed, 3 intentional WebKit offline skips**. This completed before the final information-control placement refinement; final targeted run on port 4436 then passed **12/12**, no retries, including eligibility across 11 device/browser/standalone/dismissal poses, real instruction use and persistent dismissal, title-image failure fallback, all supported home sizes/safe insets, enlarged overflow and optical control checks. Existing Install-entry tests now exercise the information control, preserving their dialog/focus/offline assertions.

Final production visual/interaction review at `http://127.0.0.1:4432/side-quest/`: both engines at **393×635** with 59/34px insets and **1280×900** desktop. Correct title, decoded crest, no overlay/page/console errors, no horizontal/vertical home overflow or document movement; information control at **79 px** on phone and absent on desktop. Owner's 359-card League setup renders correctly; adding Most Likely To saves 609 cards; instructions open/close and Play starts League. Reviewed all four final screenshots: `/tmp/side-quest-crest-{chromium,webkit}-{phone,desktop}.png`. Measurements `/tmp/side-quest-crest-qa.json`, helper `/tmp/side-quest-crest-qa.mjs`; build/full/targeted logs `/tmp/side-quest-crest-{build,e2e,targeted}.log`. Browser plugin/skill and agent-browser CLI unavailable; used existing Playwright. React review found no conditional hooks, content imports, new dependencies or effects tied to presentation decisions; image dimensions reserve layout, failure fallback and control names/focus remain accessible. Physical Safari/Home Screen checks remain pending in `docs/DEVICE_CHECKLIST.md`.

**Workshop follow-up before publication.** Owner authorized **Publish all**. The previously failing WebKit Split view check passed unchanged in isolation, serial/no retries (**1/1**, 19.9s). A fresh complete Chromium/WebKit workshop run then passed **26/26**, serial/no retries (4.1m), log `/tmp/side-quest-publish-workshop.log`; isolated log `/tmp/side-quest-publish-workshop-split.log`. No workshop implementation, assertion, skip or timeout was changed. Earlier full run was **25 passed, 1 failed**: WebKit Split view (`cabin.dafuq`, normal text) was complete/fonts loaded but had enlarged flag 1 rather than 0 until the 15s timeout. Cause remains unproven; the fresh checks resolve the outstanding validation failure without attributing it to host load. Earlier failures remain recorded below.

**Publication.** Owner's **Publish all** authorization completed the home-scroll fix, title crest/source/export recipe, Safari-only guide and regression tests as **`a561cb775d4f2ffe3a8cea2100c35c5d764dcebf`** on `main`. Normal push from `ddd2ed2` succeeded; `git ls-remote` matched exactly. [Pages run 37522783210](https://github.com/spencerdavis226/side-quest/actions/runs/37522783210) passed and deployed: **141/141 unit**, **46/46 release browser tests**, no reported retries/skips; production content/typecheck/budgets **3048 KiB runtime, 89.4 KiB initial + 174.2 KiB lazy gzip, 75 precache entries**; update flow passed (no mid-game reload, refresh serves latest, between-games update keeps save). Local and CI bundle figures differ slightly with platform/release stamp and the two preserved untracked public SVGs; global limits are unchanged. Logs/metadata `/tmp/side-quest-publish-ci-{build.log,json}`. The follow-up handoff commit is documentation only.

**Live verification.** [Side Quest](https://spencerdavis226.github.io/side-quest/) served exact `data-release=a561cb775d4f2ffe3a8cea2100c35c5d764dcebf`. Fresh Chromium and WebKit contexts at **393×635**, posed 59/34px insets, and **1280×900** desktop: correct identity, crest decoded, crest HTTP 200 and exact 57,386-byte export, no Install button, no page/console errors, no horizontal/vertical overflow or document/content movement. Phone help starts at **79px**, Play ends at ~**560.5px**; desktop hint absent. Owner's 359-card League setup, pack selection/change/save (609 cards), help open/close and Play all passed. Reviewed all four live screenshots `/tmp/side-quest-published-{chromium,webkit}-{phone,desktop}.png`; measurements `/tmp/side-quest-published-qa.json`, helper `/tmp/side-quest-publish-qa.mjs`, log `/tmp/side-quest-publish-live.log`. This is emulation/live-site evidence, not physical-iOS evidence.

**Documentation deployment / honest retry record.** Handoff commit **`b43494c78a20549e54628452ef4acb2f0f6ff8f0`** was normally pushed, remote SHA verified, and [Pages run 37523971501](https://github.com/spencerdavis226/side-quest/actions/runs/37523971501) deployed successfully. Unit 141/141, production budgets and update flow passed again. Its release suite reported **45 passed + 1 flaky passed on automatic retry**, not a clean 46/46 first-attempt run: WebKit `dice.spec.ts:192`, “a second tap finishes the moving dice,” did not expose `data-face-values=2,3` within the existing 1800ms assertion (renderer remained rolling); retry passed. Engine, dice implementation and this test are unchanged. Cause is unproven. A fresh isolated local WebKit check on production port 4441 passed **3/3**, serial, no retries, unchanged assertions/timeouts (12.1s), log `/tmp/side-quest-publish-dice-rerun.log`. Preserve this retry record for future CI reliability work; do not label the documentation run wholly clean. CI log/metadata `/tmp/side-quest-publish-final-ci.log` and `/tmp/side-quest-publish-final-ci.json`.

Fresh live Chromium/WebKit checks matched exact `data-release=b43494c78a20549e54628452ef4acb2f0f6ff8f0`, with decoded crest, absent Install pill, visible Safari help and no page errors. Results `/tmp/side-quest-publish-final-live.json`. The final documentation-only follow-up preserves this evidence and known CI timing risk; the actual UI review above remains valid.

**Checkout / next.** All **19** unrelated duplicate files remain unchanged (SHA-256 checked) and uncommitted. Raw references/engine/persistence/approved card fronts have no diff; the already committed Ancient pair remains review-only, outside production. No further implementation task is assigned. Physical Safari toolbar/swipe and Home Screen rechecks remain in `docs/DEVICE_CHECKLIST.md`; Safari cannot automatically identify a separate installed copy, so **Already added** remains the manual hide path in browser launches. Runtime budget headroom is ~24 KiB in CI; assess any future asset integration before adding it.

## Safari home-page overlap and scrolling (2026-10-06, fixed locally)

**Owner report / reproduction.** Supplied iPhone Safari screenshot shows Install overlapping the status icons and unwanted vertical movement on the home page. Reproduced the height issue in Chromium and WebKit: at 393×635 the old default setup/document was ~690 px tall, about 55 px beyond the visible area. Its document scroll carried the header out of the safe area. The screenshot's Pokémon League + Core/House/VIP/Pokémon selection (359 cards) is now the regression fixture.

**Owner steering.** After reviewing the home fix, owner approved a horizontal brand header ("Whatever is best, do it"). `Setup.tsx` now renders **Side Quest** on one line beside the same smaller painted emblem; gold lettering and italic Quest remain live text. `theme.css` gives the setup an inline-size container so the wordmark scales with its actual available width (36–62px type, 56–76px emblem), with an explicit word space and no forced line break. No new art or dependency was needed.

**Fix / changed files.** `src/style.css` confines document scrolling to the existing content scroller in browser tabs as well as installed apps; the installed app still uses its approved `100lvh` sizing. The common root rules replace duplicate standalone-only overflow rules. `--bottom-safe`, like the existing `--top-safe`, permits measured inset tests; app padding and card sizing use the same bottom inset value. `src/presentation/theme.css` sizes home branding, gaps and controls from usable height after header/safe areas, replacing the old coarse 620px breakpoint; labels and the pack row have explicit line heights. Normal phone home views fit without scrolling. Very short/enlarged content can still scroll inside the app, and dialogs/rules remain independently scrollable. No engine, session, storage, content, painted card surface or dependency changed.

`tests/browser/layout.spec.ts` adds two meaningful regressions: home fit/status-bar clearance at 320×548, 375×548, 393×635, 393×650, 390×844 and 768×1024 (posed top/bottom insets included), with the owner's 359-card setup, no document/content movement, pack/Install dialog use and Play; plus a 320×480 enlarged-text fallback that keeps Play reachable through the app's scroller. The normal-size horizontal version now fits this height too; the overflow fixture explicitly enlarges the text instead of requiring unnecessary scrolling. `docs/DEVICE_CHECKLIST.md` adds the actual Safari toolbar/swipe recheck.

**Scroll-fix verification before the horizontal follow-up.** `npm test`: **126 passed**. Production `/side-quest/` build, typecheck/content/budgets passed: **2993 KiB runtime, 89.0 KiB initial + 173.4 KiB lazy gzip**, 76 precache entries (local untracked duplicate public SVGs preserved). Focused home checks: **4/4 passed**, no retries. Full production E2E on fresh port 4431: **183 passed, 3 intentional WebKit offline skips**, no retries. Full Chromium/WebKit workshop suite: **26/26 passed**, one serial worker, no retries. `git diff --check` passed. Initial focused tests failed on a 5px excess at 375×548 in both browsers; reduced the actual section gaps and reran successfully, without weakening assertions. No application or test failure was hidden.

Dedicated production review at `http://127.0.0.1:4432/side-quest/`: Chromium and WebKit at **393×635** with 59/34px insets and **1280×900** desktop; exact 359-card setup, correct title, meaningful UI, no overlay/page/console errors, zero horizontal/vertical home overflow. Scroll attempts leave page/content at zero (wheel on Chromium/desktop, programmatic on mobile WebKit because its wheel API is unsupported). Install starts at **80 px**, Play ends at **~592 px** on the phone. Choose packs → add Most Likely To → Done updates/saves **609 cards**; Install opens/closes; Play starts League. Four screenshots and measured results: `/tmp/side-quest-home-{chromium,webkit}-{phone,desktop}.png`, `/tmp/side-quest-home-qa.json`; helper `/tmp/side-quest-home-qa.mjs`. Browser plugin/skill absent and `agent-browser` CLI unavailable; used the repository's existing Playwright. An initial QA helper stopped at unsupported mobile WebKit mouse-wheel input; corrected the helper to pose scroll directly, without changing app code. Screenshot reviewed on phone and desktop; physical Safari/Home Screen behavior remains pending.

**Horizontal follow-up verification.** Production build/typecheck/content/budgets passed again: **2993 KiB runtime, 89.0 + 173.4 KiB gzip JS**, no new runtime assets. Both engines' dev review at 320×548, 393×635 with posed 59/34px insets and 768×1024 found the complete single-line brand inside the home width and no scrolling. The production browser run on port 4434 reported **179 passed, 2 flaky passed on retry, 3 intentional skips, 2 failed** (both engines' outdated short-screen fixture still demanded a scroll even though the new header fitted). The corrected fixture uses 28px root text to deliberately create overflow, retaining the page-pinned, content-scroll and reachable-Play assertions. WebKit keyboard-focus restoration (`game.spec.ts:627`) and setup reload (`motion.spec.ts:339`, Frame load interrupted) passed on retry; causes remain unproven. These outcomes remain recorded rather than relabeled as a clean full run. Final corrected-case/affected-case run on port 4434: **8/8 passed**, serial and without retries (both home regressions, keyboard focus restoration and title scrubbing in each engine). These targeted reruns resolve the two obsolete-fixture failures; they are not described as a fresh passing full-suite run. Production visual/interaction review at port 4432 passed again in both engines at **393×635** (59/34px insets) and **1280×900**: no home overflow/page movement, no page/console errors, pack selection saved, Install opened/closed and League started. Phone Play now ends at **~559 px**, freeing ~33 px compared with the vertical brand. Screenshots `/tmp/side-quest-horizontal-{chromium,webkit}-{phone,desktop}.png`, results `/tmp/side-quest-horizontal-qa.json`, helper `/tmp/side-quest-horizontal-qa.mjs`; phone screenshot reviewed at CSS scale. Final workshop run (two workers, no retries): **24 passed, 2 failed**, both WebKit — Split view preview-ready timeout (`core.chosen-one`, 15s) and missing dice overlay in seeded replay (5s). Host load was **205.31** at completion; the cause of the load and failures is not established. The prior serial workshop run before the horizontal follow-up passed 26/26. No card/workshop/dice implementation, test assertions or timeouts were changed to hide these outcomes. Serial affected-case recheck also **failed 2/2**: Split view reached its 180s limit while setting the Enlarged text checkbox, and the overlay case reached its 30s limit during page setup. Log: `/tmp/side-quest-horizontal-workshop-recheck.log`; traces in `test-results/workshop/`. Load rose as high as ~346 and was ~198 after the recheck; several macOS services were busy in a read-only process snapshot. Cause remains unproven, and no system processes were killed. The horizontal implementation and home/interaction checks are complete, but final workshop verification is unresolved. These runs are not reported as green.

**Commit / next.** Local changes only on `main` at deployed baseline **`ddd2ed2`**; this fix has not been committed, pushed or published. All 19 unrelated duplicate files remain unchanged. Next: rerun the two unresolved WebKit workshop checks when the host is healthy; complete release verification, obtain publication authorization, then commit/push and recheck the reported device with Safari's toolbars showing and collapsed. Do not claim the live site has this fix until it is deployed.

## Ancient League front/back pair (2026-10-06, local review artifacts)

**Owner steering.** Make the League back much more consistent with the base game, with an "Ancient Mew" feel; make a matching front while keeping the existing text areas rigid. This art revision took precedence while in progress; all final browser checks are now recorded below.

**Result.** Back v2 edits the base game back: same deep teal leather, walnut rails, hammered brass hardware and hop-vine composition, with an engraved Mew relic seal and a narrow ring of pictographs in the central medallion. Tiny dusty-rose/violet iridescent inlays add an ancient enamel finish. Matching front v4 keeps the original empty teal title panel and cream writing area, adding peripheral corner inlays and incised glyphs on the outer wood rails. Front v1/v2 moved the title finial upward; a conservative edit from only the base front restored clearance in v3, followed by a parchment-finish cleanup in v4. Reviewed every iteration and the final pair with live text and guides. No new images have been wired into production, and the earlier trophy draft and all existing work are preserved.

**Files / prompts / rebuild.** All new files live in `assets/source/league-ancient-2026-10-06/`: selected `back-v2.png` / `back-v2.webp`, `front-v4.png` / `front-v4.webp`, retained front v1–v3 sources, exact built-in image_gen prompts/iteration notes in `pair.json`, standalone interactive `review.html`, `live-text-review.png`, `safe-area-review.png`, and measured `verification.json`. `npx tsx scripts/ancient-league-art.ts` rebuilds both WebP derivatives and the standalone HTML using the **current** `src/presentation/card-front.css` plus embedded local fonts. Outputs are **768×1152 (exact 2:3)**; back **268.6 KiB**, front **123.5 KiB**, each below 500 KiB. They remain outside `public/` and the bundle. Only the new source folder, rebuild script, art brief and this handoff changed in this revision; current card CSS/components are untouched by it.

**Verified.** Rebuild, `npm run typecheck`, and `git diff --check` passed. Dedicated **Chromium and WebKit** reviews (`/tmp/ancient-league-review.mjs`, `/tmp/ancient-league-review-webkit.mjs`) passed at card widths **320, 390 and 768 px**: base/new title and body rectangles measured identically, ratio 2:3, local fonts loaded, long rules scrolled without changing the body bounds, no page errors. The fixed title box is **x21–79%, y9.75–21.5%**; body is **x12–88%, y32–87.5%**, read from current CSS (older broad art-study safe areas are not the current text boxes). Reviewed both browsers' live-text and guide screenshots: no ornament intersects these boxes, and the base/new live text aligns. WebKit evidence is saved beside the Chromium files with `-webkit` suffixes. This is a standalone art/layout review, not an application integration or physical-device pass.

**Commit / next.** Committed with the art release as **`3ba70d7`**, pushed to `main` and deployed on 2026-10-06. The pair stays review-only in this release. Owner can review the completed pair in `review.html`; installing it in the app is a separate step. If the pair is later integrated, measure the total runtime budget: its combined 392.1 KiB exceeds the ~80 KiB headroom from the current build, so adding both alongside every existing surface would fail the current 3 MiB budget; do not raise that budget without owner authorization.

## Painted League art and Side Quest emblem (2026-10-05/06, complete locally on `main`)

**Request.** Review the current next steps and image-generation plan, then build, review, edit and rebuild its art. The assigned work is the art drop-in; region runs, hardcore, pacing rules and hosting are separate tasks. The League immersion UI described below is present on current `main`.

**Art and revisions.** Used the built-in image_gen tool for 24 original enamel/brass badges, an eight-slot teal leather case, a trophy/star mode silhouette, pearl/violet/crimson title banners, a painted Hall of Fame scene, and the proposed painted tankard with a gold quest marker. Reviewed every generated image and the display-sized badge contact sheet. Thunder v1 touched the upper canvas edge; generated v2 reconstructs the complete ray and leaves margin. The case's inline generated preview appeared to have a blurry backdrop; a cutout edit was generated, but compositing the actual alpha showed that the original was already correctly transparent, so v1 remains selected. An optional League back replaces the tankard medallion with a painted trophy/star in a **review-only draft**, outside the runtime; its display derivative is exactly 768×1152 (2:3). The approved card front and runtime back remain unchanged. During rendered review the Hall backdrop overlapped the header; its top inset is now 0, below the Install button.

**Saved sources, prompts and rebuild.** `assets/source/league-2026-10-05/selected.json` contains the exact executed prompts, selected source files, runtime output paths, dimensions and compression settings for all **31 integrated assets**; `draft.json` holds the optional back's prompt and review status. Original PNGs are kept beside these manifests, outside the bundle. `npm run art:league` (`scripts/league-art.ts`) regenerates the 30 WebP files, traces the generated mode silhouette's alpha into `public/art/packs/league.svg`, and rebuilds the review-only back. Runtime art totals **311.9 KiB**. Badges are 128×128, case 600×400, banners 768×240, Hall 600×800, Side Quest emblem 256×256. The source set adds roughly 56 MB of generated originals, intentionally retained for future revisions. The design brief in `docs/art-prompts/pokemon-league.md` now points to the actual files and rebuild command.

**Integration / changed files.** `src/presentation/league-art.ts` maps stable gym card IDs to badge files, independent of content imports and saves. `Cards.tsx` puts the appropriate badge on the gym ribbon. `QuestMeter.tsx` shows the latest earned badge when known, otherwise the League trophy; `PackMarks.tsx` provides the separate mode mark, also used in `Setup.tsx`. `QuestRecord.tsx` overlays earned pins on the eight case recesses, keeps unearned identities hidden, and retains real badge/leader text below. `GameDialogs.tsx`, `Completion.tsx` and `main.tsx` explicitly limit the painted case/scene to the Pokémon mode. `StageBanner.tsx` keeps its existing timing, reduced-motion fade and pass-through taps, with live words over painted cloth. `theme.css` and `card-front.css` style these additions. The Side Quest emblem appears beside the setup wordmark and on ordinary completion. `package.json` adds the rebuild command. No engine, content, storage key, session schema, saved outcome, reference source, Home Screen icon or approved card surface changed.

**Verification completed.**
- `npm test`: **126/126** passed.
- `BASE_PATH=/side-quest/ npm run build`: content validation, typecheck and budgets passed. **2992 KiB runtime**, **89.0 KiB initial + 173.4 KiB lazy gzip JS**; 76 precache entries. Card text stays out of the initial chunk and the workshop is excluded. Vite still reports the existing large dice chunk warning. About 80 KiB of runtime headroom remains; budgets were not changed.
- `CI=1 BASE_PATH=/side-quest/ TEST_PORT=4412 npm run test:e2e -- --workers=2`: **179 passed, 3 intentional WebKit offline skips**, no retries. This run preceded only the Hall backdrop's final top-inset correction.
- Final-tree dedicated Chromium review (`/tmp/side-quest-art-review.mts`, log `/tmp/side-quest-art-review.log`): setup, badge case and Hall at **320×568, 390×844, 1024×1366**; all three stage banners and pass-through reveal taps; all **24 saved gym leader badge icons** decoded; all **31 art assets returned nonempty HTTP 200 offline** under `/side-quest/`, and an offline resumed-game reload passed. No page or console errors. Screenshots reviewed and saved as 13 JPEGs in `docs/evidence/league-art-2026-10-06/` (including `all-24-badges.jpg`). Earlier helper failures were corrected: preview initially omitted `BASE_PATH`; a selector initially included the ordinary Gym Battle card; early dialog screenshots captured entry animation. These are not reported as application passes.
- `npm run art:league` rebuilt all selected art and the 2:3 draft; `git diff --check` passed.

**Earlier failures (retained for provenance).** Release/workshop runs overlapped a dedicated WebKit launch while host load rose above 80 (later over 350 even after the runs stopped). The cause of that host load is not established. The port-4414 release run was stopped: **2 passed, 4 failed, 36 did not run** (Chromium moving-dice test, both choice-card sizes, legacy finite-game test; timeouts including page creation/navigation/bounding-box calls). Workshop was stopped: **22 passed, 2 failed, 2 did not run** (WebKit Landscape and Split view stress previews timed out; the current retry was interrupted). Dedicated WebKit launch timed out after 180 s. A subsequent release attempt on port 4420 timed out starting its preview server before any test ran; a run against verified port 4413 was then interrupted and has no completion result. Those attempts are not counted as passes. Successful serial verification below covers the failed cases. Physical iOS, installed Home Screen behavior and table-distance art readability remain unverified.

**Final serial verification (2026-10-06).**
- Fresh `npm test`: **126/126 passed**; ordinary `/side-quest/` build passed after the update test, with the same **2992 KiB runtime / 89.0 + 173.4 KiB gzip JS** and 76 precache entries. The ordinary build is restored in `dist`.
- Fresh preview started on **4422**, responding with the restored build. `BASE_PATH=/side-quest/ TEST_PORT=4422 npm run test:release -- --workers=1 --retries=0 --max-failures=1`: **42/42 passed**, Chromium + WebKit, no retries.
- `CI=1 BASE_PATH=/ TEST_PORT=5175 npm run test:workshop -- --project=webkit --workers=1 --retries=0`: **13/13 passed**, including the previously failed Landscape/Split view stress checks. Chromium's 13 workshop checks passed in the earlier run; workshop source is unchanged since then. This is combined coverage, not a claimed single 26-test run.
- Dedicated final WebKit art review: setup, case and Hall at **320×568 / 390×844 / 1024×1366**, all three banners and pass-through reveal taps, all **24 saved gym badge icons** decoded, no page/console errors. Reviewed all 12 screenshots in the contact sheet plus phone case/Hall detail; saved as `webkit-*.jpg` and `webkit-contact.jpg` in the evidence folder. Chromium's earlier final-tree review also verified all 31 art assets offline.
- `BASE_PATH=/side-quest/ npm run test:update`: **passed**; no mid-game reload, refresh serves the latest, between-games update retains the save.
- `artifact-audit.json` checks all **31 runtime assets** for source/prompt presence, output dimensions, per-image budgets and precache membership; validates the Ancient pair's 2:3 dimensions and exclusion from `dist`. Git comparison confirms engine, persistence, content, raw references, approved front/back, tankard and Home Screen icons unchanged against HEAD. Five duplicate-named untracked test/fixture files remain byte-identical to canonical sources.
- Full final-tree E2E, `CI=1 BASE_PATH=/side-quest/ TEST_PORT=4424 npm run test:e2e -- --workers=1`: **178 passed, 1 flaky passed on retry, 3 intentional WebKit offline skips**, exit 0. WebKit `motion.spec.ts:394` first failed in the setup helper at `page.reload()` with "Frame load interrupted", before the motion assertions; retry passed. The earlier strict no-retry final-tree attempt had **138 passed, 1 failed, 3 skipped, 40 not run** after the same navigation error in `layout.spec.ts:178`; that layout test then passed **15/15 isolated repeats without retries**. The strict stopped run also reported one error outside a test. No app code, test assertions, tests or timeout limits were changed to hide these outcomes. Cause remains unproven; do not call the full run retry-free. Both full-run logs, the isolated repeat log and the initial navigation trace are retained in the evidence folder.
- The original art objective and owner-requested Ancient pair are **complete locally**: generated/reviewed/revised/rebuilt sources, 31 integrated art outputs, reviewed optional backs and front, both browsers' art/layout evidence, unit/build/budget/release/workshop/update/full-E2E coverage. `artifact-audit.json` records the final coverage and invariants. Logs of completed checks live in `docs/evidence/league-art-2026-10-06/`.

**Checkout / commit.** Owner authorized commit and push on 2026-10-06. Art release **`3ba70d7a507a2e940d4ff89847b7368d87899c55`** was committed and pushed to `main` from baseline `edd68ca`, with remote `main` confirmed unchanged before staging. It includes the integrated art, originals, review drafts, rebuild scripts and evidence listed above. A documentation follow-up records the verified deployment; no application code changes in that follow-up. Previously clean checkout acquired untracked filename ` 2` copies during this session; all are preserved. Their content/scripts/test copies were byte-identical to the canonical files when inspected; three component copies preserve the earlier implementations. These duplicate-named tests are not discovered by the normal test filename patterns; their canonical equivalents were run. The two duplicate public SVGs are also retained and included in the measured runtime budget. Do not delete these files or unrelated work during continuation.

**Published verification (2026-10-06).** GitHub Pages run [37472711502](https://github.com/spencerdavis226/side-quest/actions/runs/37472711502) succeeded for `3ba70d7`: **126 unit tests**, production build/budgets (**2991 KiB runtime; 89.1 KiB initial + 174.2 KiB lazy gzip; 74 precache entries**), release smoke and update flow, then deployment. Release smoke reported **40 passed + 2 flaky passed on retry**, both WebKit dice checks (`dice.spec.ts:98` restored unrolled card; `dice.spec.ts:192` second-tap finish). The first timed out awaiting settled state; the second timed out awaiting face values after the tap. Cause is unproven; no tests or app code were changed to hide these results. CI failure traces remain attached to the run. This release run was successful but not retry-free. The two preserved duplicate public SVGs were excluded from the commit, accounting for the clean build's lower file count.

Fresh Chromium production review at **390×844** confirmed [the live app](https://spencerdavis226.github.io/side-quest/) reports the exact art commit, the emblem decodes at 256 px, all **31 art assets return nonempty HTTP 200**, and no page errors occurred. `deployment.json` and `ci-release.log` in the evidence folder record this check and the relevant CI output. This is browser evidence, not physical-iOS or installed Home Screen evidence. SHA-256 checks confirm all **19** unrelated duplicate files remain unchanged and uncommitted. The Ancient pair remains outside production.

**Handoff / next.** Owner reviews the completed local art and Ancient pair. No further task is assigned by this art request. Physical-device checks remain in `docs/DEVICE_CHECKLIST.md`; any integration of the new pair or further hosting changes is a separate owner-directed task. Keep the WebKit setup-reload flake visible for future test-reliability work; the application art/layout assertions have coverage in the completed runs. The art release is committed, pushed and deployed; unrelated duplicate files remain preserved and excluded. No further implementation task is assigned.

## Secrets & fuses: hold-to-read secrets, hidden fuses, a visible clock, 150 cards (2026-10-06, branch `secrets-and-fuses`, not on `main`)

**Request.** Owner chose the secret and timer card ideas from the backlog (D): "steal" from existing party games and generate 150 cards. Decisions (2026-10-06): build secret text, hidden fuse and visible countdown now, pass-around secret roles (Spyfall/Imposter with a player count) later; one pack; visual only, no sound; generic voice, no invented lore. Follow-up the same day: no card may send the phone round the table ("I don't want a broken phone"); hot potato with a passed beer is fine as long as the timer does more than that. Fuses went from 45 to 12 (beer only) and the clock from 30 to 63. This lifts the "no timers" line from `GAME_DESIGN.md` for this pack only.

**Change.**
- Types: `CardDefinition.secret` (≤ 120 characters) and `CardDefinition.timer` (`fuse` with hidden `min`..`max` seconds, 5–90, or `countdown` with `seconds`, 3–120, plus an `end` ≤ 120 characters). Never with `dice`. `src/game/timer.ts` samples the fuse length (injected `Random`) and validates; `validate.ts` checks both, so saved snapshots are validated on load. Session schema unchanged (v2); timer and hold state is display only and never saved, so a reload leaves a timed card unlit.
- UI: `src/components/CardActions.tsx`. A Hold to read plaque shows the secret only while held (hidden on release, blur and app switch; keyboard/VoiceOver activation toggles). Light the fuse / Start the clock plaques; a timed card ignores taps (nudges the plaques) until time is up, then a 1.6 s full-screen BOOM or TIME flash (`pointer-events: none`, no shake under reduced motion) and `end` replaces the rules. Short secrets (≤ 24 characters) print large for Forehead. Plaques reuse the choice-card slot and chrome.
- Content: `src/content/secrets.ts`, pack `secrets` ("Secrets & fuses", bomb logo from the vendored Lorc `sparky-bomb`, already credited). 75 secrets (30 Paranoia, 20 Secret Mission, 16 Fact or Cap with settled answers, 6 truth-or-lie stories, 3 Secret Rules), 63 on the clock (16 Forehead, 16 No Saying It, 10 Act It Out, 10 Three in Five, 11 timed challenges), 12 fuses (6 Hot Potato categories, 6 variants), each with the phone left on the table and a beer passed instead (the fuse plaque reads "phone stays put"). Mechanics borrowed from Paranoia, Killer, Heads Up, Taboo, charades, 5 Second Rule and hot potato; every prompt is original.
- Skip plaque on timed cards (see below).
- Setup: with six or more packs selected the pack row shrinks its marks and wraps the card count.
- Review sheet includes secrets and timers (`scripts/cards-review.ts`); docs: AUTHORING (new section), GAME_DESIGN, README, AGENTS, CLAUDE files, DEVICE_CHECKLIST (new unverified item).

**Verified (Linux container, Node 22).** `npm test` 134/134 (new `tests/secrets.test.ts`: counts, plaque wording, Fact or Cap labels, fuse range and limits, one mechanic per card, save round-trip; the next-card guard now reads secrets and timer ends). `BASE_PATH=/side-quest/ npm run build` passed: 864 cards in 7 packs, 2695 KiB runtime, 90.5 KiB gzip initial + 178.6 KiB lazy JS; four cards are 1–2 characters over the 90-character review target (warnings only). New `tests/browser/secrets.spec.ts` (secret only while held at 320 and 390 px, plaque inside the card below the rules; fuse blocks taps, blasts, clears, then goes aside; countdown counts, keeps its secret, reload unlights): 4/4, and 12/12 with `--repeat-each=3`, on Chromium only. Overflow sweep of all 150 cards (rules and held secret): no scroll at 375×667 or 390×844 (rerun after the fuse rewrite); at 320×568 the public rules of nearly all need a scroll, as do 7 of the 8 longest Core cards (scrolling is the designed behaviour there). The pack row could not hold seven marks and the count at 320 px: with six or more packs the marks shrink to 24 px and the count wraps to its own line (`Setup.tsx`, `theme.css`; screenshot reviewed); `secondary.spec.ts` now selects all seven packs (820 cards) and `game.spec.ts` counts seven. Full Chromium E2E (`--workers=2`, local `executablePath` override): 95/95 passed; after the Skip plaque, 97 passed plus one flaky `dice.spec.ts:464` (four dice at 1280 px) that passed on retry and 15/15 isolated (`--repeat-each=5 --workers=1`); this branch changes no dice code, so it is recorded as host load, not cleared. Screenshots reviewed: secret held at 320 px, Forehead at 390 px, BOOM.

**Not verified.** WebKit: this container has Playwright 1.63 without its WebKit build (and only Chromium 1194, used through a local `executablePath` override), so WebKit runs in CI only. Physical iPhone/iPad (hold with a thumb, loupe/callout suppression, BOOM legibility, backgrounding mid-fuse). Whether the copy lands at a real table.

**Skip (owner said yes, 2026-10-06).** Every timed card has a quiet Skip plaque, lit or not; it calls the ordinary put-aside. Secret + clock cards show three plaques (Hold to read, the clock, Skip) with the subtitles dropped; `secrets.spec.ts` checks all three fit inside the card with 44 px targets at 320 and 390 px and that skipping mid-clock or unlit puts the card aside with no blast. Screenshot reviewed at 320 px.

**Open questions for the owner.** Hold-to-read for 30 s on Forehead may be tiring; a tap-to-toggle mode is the alternative. Secret roles (Spyfall/Imposter) remain the next step for this feature.

**Next feature (owner, 2026-10-06): the dungeon crawl / D&D pack** from the ideas backlog below. Shared party HP on a table meter, failed d20 checks cost HP, 0 HP wipes the party, cleared rooms raise party level, one-use loot, a boss as the forced final card. It reuses the quest machinery (meter, finale stages, banners) and needs a finale for a finite game plus loot; classes wait for the player roster (B). Avoid duplicating Core's Nat One, Nat Twenty, Critical Failure, Dungeon Master and Mimic Chest. Scope it before writing cards.

## Rename to Side Quest (2026-10-05, PR #6 merged as `a942e47`, deployed on `main`)

**Request.** Owner renamed the app from Drink at Ron to Side Quest and wants it comprehensive: app, repo, URL and storage.

**Change.**
- App: manifest `name`/`short_name` "Side Quest", description "The main quest can wait." (`vite.config.ts`); `<title>` and `apple-mobile-web-app-title` (`index.html`); setup wordmark "Side / Quest"; non-quest completion screen gains a "Side quest complete" kicker above "To good company."; Core card New Blood says "First time Side Quest players"; dice colorset label; package name `side-quest`.
- URL: the workflow derives `BASE_PATH` from the repository name (`/${{ github.event.repository.name }}/`), so the build matches wherever Pages serves it, before or after the rename. Docs and local commands use `/side-quest/`.
- Storage: keys are now `side-quest.session.v1` / `side-quest.settings.v1` / `side-quest.card-review.v1`. `migrateStorageKeys` (persistence, called first in `main.tsx`) moves the old `drink-at-ron.*` session and settings once (new key wins; old key removed only after a successful copy); the workshop review reads its old key as a fallback. Covered by `tests/storage-keys.test.ts` and a browser test that resumes a game saved under the old key; the legacy-settings browser test now seeds the old key too.
- Docs: README, AGENTS, CLAUDE files, GITHUB_PAGES, DEVICE_CHECKLIST, card review export.

**Kept on purpose.** `reference/` raw sources (incl. `Drink at Ron - Sheet1.csv`); the supplied House card "Drink at Ron" (`house.sheet-011`, verbatim); history in `STATUS_ARCHIVE.md` and `docs/studies`. Icons, card back and tankard art are unchanged; a Side Quest emblem is a separate art task.

**Consequences.** GitHub redirects the old repository URL for git, but not the Pages URL: `/Drink-at-Ron/` stops serving once renamed. Installed Home Screen copies keep running their cached old build offline and stop updating; remove and re-add from `/side-quest/`. An iOS Home Screen app has its own storage, so a game in progress in an old install does not move to the new one.

**Official transition (2026-10-05).** Owner explicitly authorized deployment and the Mac folder/repository transition. Renamed GitHub repository to `spencerdavis226/side-quest`, set origin to `https://github.com/spencerdavis226/side-quest.git`, marked PR #6 ready and merged its verified head `06c22ed4fd3481b18e56e58c524ac635f23282de` as `a942e47f5042f4168e7f8d920f7049913b58ee8b`. Pages run `37406116534` passed and deployed. Local checkout is back on `main`. Mac folder is now `/Users/spencer/Documents/Dev/Side-Quest`; `/Users/spencer/Documents/Dev/Drink-at-Ron` is a compatibility symlink to it so existing chats and saved project paths keep working. Codex's saved sidebar project still has the old label/path: the computer-use tool refused access to the Codex app, and no project-edit tool is available. Update that entry manually before retiring the compatibility link. Existing work was preserved; the temporary handoff stash was restored. Only `docs/STATUS.md` changed during this takeover, with no app behavior edits; the final documentation commit records this transition.

**Local verification (Node 26.9.0, macOS).** `npm ci` completed. Browser plugin absent; used the existing Playwright suites. Production build and tests used `/side-quest/`:
- `npm test`: 126/126 passed.
- `BASE_PATH=/side-quest/ npm run build`: passed content validation, typecheck and budgets; 2672 KiB runtime, 88.2 KiB initial + 173.4 KiB lazy gzip JS. Manifest name/title is Side Quest; scope, start URL and ID are `/side-quest/`.
- `CI=1 BASE_PATH=/side-quest/ TEST_PORT=4398 npm run test:e2e -- --workers=2`: 179 passed, 3 intentional WebKit offline skips, no retries.
- `CI=1 BASE_PATH=/side-quest/ TEST_PORT=4399 npm run test:release -- --workers=2`: 41 passed, 1 flaky test passed on retry. WebKit `layout.spec.ts:37` failed at `page.reload()` with "Frame load interrupted". Isolated rerun with port 4401, `--grep 'Core instructions fit' --project=webkit --workers=1 --repeat-each=5 --retries=0`: 5/5 passed. Cause not established; do not describe this release run as wholly clean.
- `CI=1 BASE_PATH=/side-quest/ TEST_PORT=4400 npm run test:update`: passed; no mid-game reload, latest release after refresh, save retained between games. This script selects its own ephemeral server port; `TEST_PORT` is not consumed.
- `CI=1 BASE_PATH=/ TEST_PORT=5175 npm run test:workshop -- --workers=1`, run from the renamed folder: 26/26 passed in Chromium and emulated WebKit. The original two-worker run was interrupted and had recorded a WebKit iPad preview timeout (isolated rerun: 1/1 passed). A subsequent run started before the folder move was stopped after Vite lost its study-preview import paths and the title-fit test timed out; restarting Vite from the new folder resolved it. Workshop configuration fixes its server to port 5175. These earlier failures were not silently treated as passes.
- Separate Chromium UI check at `http://127.0.0.1:4398/side-quest/`, 393×760: correct title, meaningful setup content and painted art/fonts, no framework overlay or console/page errors; Play opens the table. Screenshot evidence saved outside the repo in `/tmp/side-quest-setup.png` and `/tmp/side-quest-play.png`.

**Published verification.** GitHub Pages run `37406116534` on Node 22: 126 unit tests passed, build/budgets passed (2672 KiB runtime, 88.4 KiB initial + 174.2 KiB lazy gzip JS), 42/42 Chromium/WebKit release checks passed without retries, update flow passed, deployment succeeded. Live Chromium check at `https://spencerdavis226.github.io/side-quest/`, 393×760: HTTP 200, title Side Quest, exact deployed release `a942e47f5042f4168e7f8d920f7049913b58ee8b`, painted art and local fonts served with HTTP 200, manifest name Side Quest and scope/start URL/ID `/side-quest/`, no page/console errors. After the worker took control, disabled network: reload and starting a game both passed with art intact. Evidence: `/tmp/side-quest-live.log`, `/tmp/side-quest-live-online.png`, `/tmp/side-quest-live-offline.png`. The documentation-only follow-up uses the same app source and standard deployment checks.

**Risks / not verified.** Physical iPhone/iPad and Home Screen reinstall. Emulated WebKit is not physical iOS evidence. Hosting move and emblem art are not started. GitHub Pages still requires this repository to remain public under the current hosting arrangement.

**Next.**
1. Reinstall the Home Screen app from the new live URL and record physical-device checks in `docs/DEVICE_CHECKLIST.md`; old installed-app saves do not transfer. Manually update Codex's saved project label/folder to Side Quest and `/Users/spencer/Documents/Dev/Side-Quest`; retain the old-path symlink while existing chats depend on it.
2. Separate hosting PR after owner confirms host and domain (likely Cloudflare Pages or Workers static assets): build at `/`, add revalidation headers for `sw.js` and `index.html` and immutable headers for hashed `/assets/*`, retain CI checks, remove the Pages deploy job, and update README/AGENTS/GITHUB_PAGES/STATUS. A new domain is a new origin: github.io saves do not carry over, and Home Screen devices need reinstalling.
3. Optional painted Side Quest emblem: RPG "!" quest marker over the tankard; no flat vector overlay substitute.

## League immersion, phase 1: tiered ribbons, stage banners, badge case, Hall of Fame (2026-10-05, branch `league-immersion`, not on `main`)

**Request.** Start the immersion roadmap (below) with the items that need no art and no rule change.

**Change.**
- Tiered ribbons: `CardDefinition.ribbonTone` (optional `"pearl" | "violet" | "crimson"`, validated, needs a `ribbon`; gold when absent). Legendaries are pearl, the Elite Four violet, Champions crimson; gym leaders keep the approved gold. The title takes the ribbon's colour (`.study-face.tone-*`). Games saved before this keep gold ribbons (cards are snapshotted).
- Stage banners: `QuestStage.intro` (optional, ≤ 28 characters, display only, never saved): "A Legendary appears", "The Elite Four await", "The Champion awaits". `StageBanner.tsx` sweeps a cloth banner in the stage's tone across the table while the stage's first card is dealt face down (2.6 s, fade only under reduced motion, `pointer-events: none`, `role="status"`). It reappears if the app reloads on that face-down card.
- Badge case: the meter is now a button (disabled while cards move) that opens a dialog titled with the meter label ("Badges"): 8 medal slots with badge and leader names, then each stage with the cards beaten. Picks not yet dealt are never shown.
- Hall of Fame: beating the Champion swaps the completion screen's tankard and toast for "Pokémon League / Hall of Fame." and the same record.
- Engine: `questRecord(session)` derives the run from the save (quest cards in this cycle's order behind the position, capped at the count; finale picks already put aside), so the save format is unchanged. `finaleStage` also returns the stage number.
- Medals are lettered gold discs for now; the painted badges from `docs/art-prompts/pokemon-league.md` §1 replace them when the art exists. Banner art (§4) and the Hall of Fame scene (§5) are likewise optional upgrades.

**Verified.** `npm test` 122 passed (record without spoilers, completion record, tone and intro validation; League stages have intros and tones); typecheck clean; build and budgets passed (88.3 KiB gzip initial, card text not in the initial chunk); full production E2E Chromium 90/90, including new `quest.spec.ts` checks for the pearl banner on the eighth badge, the badge case at 320×568 (names, no spoilers, focus returns to the meter) and the Hall of Fame after a full engine-played run. Screenshots reviewed at 320 and 390 px. Workshop (Chromium) 12/13: `dice-texture.spec.ts` fails identically on `main` ("numeral 7 horizontal centre") with the local fallback Chromium 1194, so it is not from this change. Not verified: WebKit locally (CI runs it), devices, how the banner timing feels at the table.

**Next.** Owner picks the next roadmap item: art drop-in (badges, emblem, banners), region runs, pacing beats, or hardcore.

## League gauntlet: Legendary, Elite Four, Champion (2026-10-05, branch `pokemon-gym-leaders`, PR #4, merged to `main` as e6f7115)

**Request.** After 8 badges: one Legendary, then 4 random Elite Four members from Gens 1–3, then a random Champion. Also: proposals for making the mode more immersive, and image-generation prompts in a Markdown file.

**Change.** A quest's single finale card became ordered stages (`PackQuest.finale: { label, pick, cardIds }[]`). `createSession` snapshots each stage's pool and picks the run's cards at random (`QuestState.stages`, `finale`, `step`); after the goal they are dealt one at a time between deck cards, and putting the last aside ends the game. Replays re-pick. Saves validate the picks against the pools, the stage order, and `discarded = cycle × cards + position + step`. The meter shows the stage: "Legendary" and "Champion" with "VS", "Elite Four 2/4". Content (`pokemon-league.ts`): 8 Legendaries (Articuno, Zapdos, Moltres, Mewtwo, Lugia, Ho-Oh, Latias & Latios, Deoxys; ribbon "Legendary Encounter", catches are rare), 9 Elite Four (Lorelei, Bruno, Agatha, Will, Karen, Sidney, Phoebe, Glacia, Drake; ribbon "Elite Four · <Type>"; Lance is a Champion here and Koga stays a gym leader, so neither repeats), 3 Champions (Blue, Lance, Steven; ribbon "Champion · <Region>"; whole-table fights). `pokemon.league` is retired; Champion IDs are `pokemon.league-champion-*` because `pokemon.champion-lance` is an existing regular-deck card. Catalog 714.

**Fit.** On the production build no gauntlet card overflows at 375×667; at 320×568 most scroll by 16px (the same as gym leaders) after shortening Lugia, Phoebe, Lance and Steven.

**Art prompts.** `docs/art-prompts/pokemon-league.md`: shared style block plus prompts for 24 original badge pins, a badge case, a League mode emblem, three gauntlet banners, a Hall of Fame scene, and an optional League card back (a frame change that needs owner sign-off). Designs are original and only evoke each badge's name.

**Immersion roadmap (proposed, not built).** 1) Stage banners that sweep across the table when the gauntlet and each stage begin. 2) Badge case: tap the meter to see the badges earned and the leaders beaten; a Hall of Fame completion screen for the run. 3) Tiered ribbons: bronze gym, pearl Legendary, violet Elite Four, crimson-and-gold Champion. 4) Region runs: pick Kanto, Johto or Hoenn and face that region's 8 leaders in canonical order, then its own Elite Four and Champion (Mixed stays as today). 5) Hardcore option: a badge only on a win; a lost leader is shuffled back in (needs per-outcome quest progress and won/lost plaques on non-dice leaders). 6) Pokémon Center water break after badge 4, and rival encounters paced between badges. 7) Optional League card back and banner art from the prompts file.

**Verified.** `npm test` 119 passed (quest tests now cover a two-stage finale: random picks per stage, stage order, the meter stage, completion on the last card, tampered picks rejected); typecheck clean; build and budgets passed; full production E2E Chromium 88/88 (`quest.spec.ts` covers the eighth badge opening the gauntlet with the Legendary, a reload mid-gauntlet, and the Elite Four counting 2 of 4 to 3 of 4); workshop 12/12; update flow passed. Not verified: WebKit locally, devices, the gauntlet at the table.

## Gym leaders: 24, League-only, harder, with a ribbon (2026-10-05, branch `pokemon-gym-leaders`, not on `main`)

**Request.** Mark gym leaders on the card in League mode; make every leader a real challenge; take leaders out of the regular Pokémon deck (League only); cover all 24 gym leaders of Gens 1–3.

**Change.** `PackQuest.cardIds`: quest-only cards dealt only in that mode (engine `createSession`, `loaders.ts`, validation, setup card count, workshop preview). New `src/content/pokemon-league.ts` holds the 24 leaders (Kanto: Brock, Misty, Lt. Surge, Erika, Koga, Sabrina, Blaine, Giovanni; Johto: Falkner, Bugsy, Whitney, Morty, Chuck, Jasmine, Pryce, Clair; Hoenn: Roxanne, Brawly, Wattson, Flannery, Norman, Winona, Tate & Liza, Wallace) as `pokemon.gym-*`, and the League finale. The 14 old leader cards (`pokemon.misty`, `chuck`, `pryce`, `clair`, `flannery`, `winona`, `tate-liza`, `brawly`, `norman`, `viridian`, `erika`, `sootopolis`, `bugsy`, `jasmine`) are retired; `pokemon.gym-battle` stays in the regular deck as an ordinary card. The regular Pokémon deck is 120 cards; catalog 695. Difficulty: most battles lose more often than they win (Brock 60% drink 5; Giovanni 50% shot plus 3; Whitney's Rollout up to 10; Lt. Surge and Wattson punish matching dice), feats cost a finished drink on failure, and every leader still earns the badge when put aside. Copy was written for the mode at the owner's request and is not source-sheet text.

**Indicator.** `CardDefinition.ribbon` (optional, ≤ 32 characters, validated): a gold banner over the rules ("Gym Leader · Boulder Badge"), a gilded title, and a one-time shine when the card turns face up. The badge count on the meter pops when it rises. Both respect reduced motion.

**Fit.** Measured every leader on the production build: no overflow at 375×667 or 390×844; at 320×568 the rules scroll by 16px (6px for Pryce), against 6px for plain cards of similar length there (40px for the longest), after compacting the ribbon and shortening Sabrina and Tate & Liza.

**Verified.** `npm test` 118 passed (League test: 24 leaders, ribbons, never in the plain deck, all 24 dealt in League, 8 within 39 draws across 40 seeds); typecheck clean; build and budgets passed; full production E2E Chromium 86 passed plus the count fix in `secondary.spec.ts` (670 cards with every pack in a plain mode), then `secondary` and `quest` specs 10/10; workshop 12/12. `quest.spec.ts` now checks the ribbon text and that it stays inside the card.

**Not verified.** WebKit locally, devices, whether the leaders feel hard but fair at the table.

## Pokémon League mode; House and Cabin share nothing (2026-10-05, on branch `cabin-weekend-pack`, PR #3, not on `main`)

**Request.** Make Pokémon its own mode beside Short/Long/Infinite (forcing the Pokémon pack on, plain modes can still include Pokémon cards). The 8 CABIIN rows of the house sheet belong to Cabin only, not shared.

**Decision (recommended to and accepted from the owner's framing).** A quest is a game mode, not something that warps every game containing the pack. Pokémon League: holds the Pokémon pack on (others can join), no card limit, 8 gyms spread through the first 40 draws, the eighth badge deals the League, and putting the League aside ends the game (runs of about 30 to 40 cards). In Short/Long/Infinite the gym cards are ordinary cards: no meter, no reordering.

**Change.** `PackQuest` gains `mode`, `summary`, `length`; `GameConfig.quest` (pack id; requires the pack selected and `limit: null`); `SessionState.quest` (single, optional; replaces `quests`). Engine: the quest exists only when `config.quest` is set; `paceQuest` spreads `goal` tagged cards through the first `length` draws (new games and replays); the finale completes the game; the "meter starts over" path and `finalesShown` are gone. `parseSession`: quest present iff `config.quest`, completion is "limit reached" or "finale put aside". Setup (`Setup.tsx`): one wide choice per quest pack under the lengths (pack mark, mode, summary); choosing it adds and locks the pack (`PackTile locked`, `aria-disabled`); choosing a length clears it. Preferences persist `choice: "quest"` with `config.quest`. `QuestMeters` became `QuestMeter`.

**House/Cabin.** `custom.ts` now splits the restored sheet: `houseCards` (94) and `cabinSheetCards` (rows 12, 16, 24, 28, 40, 42, 53, 54 as `cabin.maddy-booty`, `cabin.ursaring`, `cabin.wench`, `cabin.no-take-give`, `cabin.first-name-only`, `cabin.pet-that-dog`, `cabin.abra-like-a-slut`, `cabin.whinnie-the-pooh`, wording unchanged). Cabin is 85 cards with no shared IDs; the Cabin loader no longer pulls House. A unit test fails if any card is in two packs.

**Verified.** `npm test` 118 passed; typecheck clean; build and budgets passed (86.1 KiB initial, not capped); full production E2E Chromium 86/87, the one failure being `dice.spec.ts:93`, a pre-existing test bug now fixed (it required a bold amount, but the d20 card's 1 and 20 read "Take a shot."/"Give a shot.", so it failed on about 1 roll in 10; 40/40 after the fix); update flow passed; workshop 12/12; `quest.spec.ts` covers the setup mode (pressed state, locked pack, meter at 0/8, saved config) and that a plain mode with Pokémon has no meter. Screenshot at 320×568: the mode row fits; Play sits just below the fold on that smallest phone, as the setup screen scrolls.

**Not verified.** WebKit locally, devices, the run length at the table.

**Gym spreading kept (owner, 2026-10-05).** Owner asked why gyms are not simply shuffled through the whole deck. By chance alone the 8th of 15 gyms lands near draw 8(N+1)/16: about 68 with Pokémon only (134 cards), 120 with Core added, 342 with all six packs. The 40-draw spread keeps a run night-sized whatever the pack mix; the owner chose to keep it. Alternatives on file: spread through ~30% of the deck capped at 60, or a run-length choice (quick ~25 / normal ~40 / epic ~70) under the mode.

## Leaner tests, no initial-JS cap, eight Pokémon badges (2026-10-05, on branch `cabin-weekend-pack`, PR #3, not on `main`)

**Request.** Remove unnecessary tests and the 100 KiB limit; make the Pokémon quest all 8 badges.

**Budget.** `check-budget.ts` no longer caps initial JS (owner decision); it still reports it (85.9 KiB gzip), keeps the lazy (200 KiB), runtime (3 MiB) and image (500 KiB) limits, and still fails the build if card text reaches the initial chunk. AGENTS.md updated.

**Tests trimmed.** The workshop every-card sweep (5 viewports × every card × normal and enlarged) now runs a 34-card stress set (`tests/workshop/stress-set.ts`: 12 longest rules, 6 longest titles, every choice card, the 3 dice cards with most dice, quest finales, first card of each pack). Title fit checks distinct titles of 12+ characters (152, was 685 per pass); the wide-letter test still covers short titles. The sweep's pack-mark check now expects every pack containing a shared card (Cabin weekend shares House rows; the old single-mark check would have failed since that pack existed) and polls for the marks. The isolation test now snapshots storage after the app has mounted (it raced the app's first settings save). The workshop can preview a quest finale (marks its quest due). Release smoke still runs in Chromium and WebKit: headless Linux WebKit has no WebGL, so the dice-render checks only really run in Chromium. Full E2E and workshop stay manual-only in CI, as before.

**Eight badges.** `pokemon` quest goal 8; League copy "Eight badges!". By chance alone a Short Pokémon-only game would reach 8 gyms 0.5% of the time (Long 33%; with Core mixed in 0% and 1.5%), so `paceQuests` (engine) now moves enough tagged cards into the draws before a finite game's last one; replays are paced too; endless games are untouched. A 30-card game with Pokémon therefore always contains at least 8 gym cards in its first 29 draws.

**Verified.** `npm test` 121 passed (new: pacing in `tests/quest.test.ts`, eight-badge Short game across 40 seeds in `tests/workshop.test.ts`); typecheck clean; build and budgets passed; full production E2E Chromium 86/86; workshop (title fit, stress sweep at 5 viewports, card review, isolation, viewport, overlay) 12/12 twice in about 3.5 min, Chromium. `dice-texture.spec.ts` still fails identically on the baseline build in this container (older Chromium), not run in the timings above.

**Not verified.** WebKit locally (CI runs the release smoke in WebKit), any device, how an 8-gym Short game feels at the table.

## Per-pack card loading, pack quests, Pokémon badge quest (2026-10-05, on branch `cabin-weekend-pack`, PR #3, not on `main`)

**Request.** Owner approved steps 1 to 3 of the suggested order: load each pack's cards separately, ship Most Likely To as plain vote cards (already done), then Feature A (shared progress and a finale) with the Pokémon badge quest as the first user.

**Per-pack loading (replaces the single lazy catalog from the entry below).** The app imports `src/content/manifest.generated.ts` (pack metadata and card IDs only, about 4 KiB gzip), generated by `scripts/pack-manifest.ts` (`npm run content:manifest`, also the first step of `npm run build`; `tests/manifest.test.ts` fails if it is stale). `src/content/loaders.ts` has one dynamic-import loader per pack; `main.tsx` warms the selected packs while setup is open and loads them on Play (synchronously when already warmed, else async with a "Couldn't load the cards" notice on failure). The first render waits for no card text at all, and a resumed game uses its save snapshot. `registry.ts` is gone. `check-budget.ts` now also fails the build if any card's first sentence (case-insensitive) appears in the initial chunk; verified by temporarily importing `likely.ts` into `main.tsx` (build failed: `likely.001`). Initial JS 85.6 KiB gzip, lazy 172.0 KiB (each pack its own chunk, 0.8 to 6.6 KiB).

**Feature A: pack quests.** Types `PackQuest` (pack: label, goal, finaleId), `CardDefinition.quest` (pack id), `QuestState` and optional `SessionState.quests` (no schema version change; saves without it load as before). Engine: `createSession` starts a meter for each selected quest pack whose finale was loaded; putting aside a tagged card adds one; at the goal the finale becomes `currentCard` (dealt between deck cards, no deck position used); putting the finale aside resets the meter and counts it in `shown`; `replaySession` resets. `findCard` and `finalesShown` keep history and the save invariants honest (`discarded = cycle × cards + position + finales shown`). `parseSession` validates quest state (pack selected, counts in range, `due` iff at goal, at most one due, finale not a deck card). `validateCatalog` requires at least `goal` tagged cards and a finale outside `cardIds`. UI: `src/components/QuestMeters.tsx` in the top row's free left slot (pack mark, label, count; gold glow when the finale is in play).

**Pokémon badge quest.** 15 gym cards tagged; goal 4 (a Short Pokémon-only game draws about 3.4 gyms, Long about 6.7; 8 would rarely trigger); finale `pokemon.league` (d20: Champion sweeps / close fight / victory / Hall of Fame). Catalog 685 cards, 684 in the deck pool.

**Tests.** `tests/quest.test.ts` (9: meter start, counting, finale dealing and rolling, reset and repeat, completion on the finale, replay, tampered saves, catalog validation, missing finale); `tests/manifest.test.ts` (3); `tests/browser/quest.spec.ts` (`@release` at 320 and 390 px: meter fills, glows, deals the League, survives reload; plus no meter without a quest pack). Browser specs that read the save right after tapping Play now wait for the play screen first (start can be async).

**Verified.** `npm test` 117 passed; typecheck clean; Pages-path build and budgets passed; full production E2E Chromium only (local `chromium-1194`; WebKit not installed here) 86/86, twice; update flow passed. Screenshots at 320 and 390 px checked by eye: meter fits beside the medallion.

**Not verified.** WebKit, the workshop sweep, any device. Quest balance (goal 4) is untested with people.

## Most Likely To pack and lazy card catalog (2026-10-05, on branch `cabin-weekend-pack`, PR #3, not on `main`)

**Request.** A Drunk Stoned or Stupid style pack of 250 standalone "most likely to" vote cards (no Drunk/Stoned/Stupid tagging), researched from public lists; record every pack/mechanic idea from the design discussion (below, "Ideas backlog") for the owner to pick from later.

**Lazy catalog.** Card text had become the bulk of the initial chunk (98.0 of 100 KiB gzip after Cabin weekend). `src/content/catalog.ts` is now a lazy chunk: it installs itself into `src/content/registry.ts` on import; `main.tsx` calls `loadCatalog()` at boot and renders only after it resolves (it is fetched alongside the art the first render already waits for, and is not subject to the 4 s art cap, because there is no fallback without cards). The workshop entry points also await it. `presentation/packs.ts` and `app/persistence.ts` read `catalog()`; `validateCatalog` moved to `src/content/validate.ts` (re-exported from `catalog.ts`). No session schema or storage change. Result: **80.4 KiB initial** + 169.6 KiB lazy gzip (lazy limit 200 KiB; the catalog chunk is 21.1 KiB gzip, so roughly 30 KiB of lazy headroom remains for packs and features).

**Most Likely To.** `src/content/likely.ts`: pack `likely`, 250 `likely.NNN` cards, all `group`, title "Most Likely To", rules "<Prompt>. Point on three: most votes drinks 2." (payout varies on some prompts: 3, a shot, or finish the drink). Prompts are original, grouped as nights out, embarrassing, stoned, spicy, the future, and the group; reviewed against public "most likely to" lists for range (page fetches were blocked by this environment's network policy, so only search snippets were read). Logo `public/art/packs/likely.svg` (game-icons `delapouite/human-target`). Catalog 684 cards, 6 packs.

**Tests.** New unit test for the pack's shape; total 684; `secondary.spec.ts`/`game.spec.ts` expect 6 packs and 684 cards with all selected; `title-fit.spec.ts` timeout 180 s → 360 s for the larger catalog (no assertion changed).

**Verified.** `npm test` 105 passed; typecheck clean; Pages-path build and budgets passed; full production E2E **Chromium only** (local `chromium-1194` via a temporary config; WebKit not installed here) 83/83; update flow passed (same local Chromium); workshop suite minus the every-card sweep: title fit passed (2/2), `dice-texture.spec.ts` fails identically on the baseline build in this container (older Chromium text metrics), 5 others passed.

**Not verified.** WebKit, the every-card workshop sweep, any device, first launch on a slow connection with the extra catalog request (the first render now also waits for the catalog chunk; it is precached by the service worker after the first visit).

**Next.** Owner reviews Cabin weekend and Most Likely To copy; merge PR #3 to deploy. Then pick from the ideas backlog.

## Ideas backlog (2026-10-05, owner to choose; nothing here is approved)

The owner's goal: packs that change how the game plays, not just add cards. Today a pack cannot, because every card must finish on its own and the app keeps no state between cards. The platform features below would let a pack bring a mechanic.

**Platform features (enablers)**
- **A. Shared table progress + finale.** One table-wide meter on screen (badges, rooms cleared, a filling cup) and a forced final card at the end of Short/Long. No player names. Optional session field, so no migration.
- **B. Optional player roster.** Names at setup, skippable. Unlocks whose-turn display, recorded votes, per-player stats, end-of-game awards, classes/roles. Needs a session schema version with migration (v2 + v1 migration must stay working).
- **C. Active rules tray.** Lasting rules stay visible with who drew them and when they expire. Clean with B; with only a player count, expiry by draw count.
- **D. New card types.** Secret cards (hold to peek before passing), timer cards (hidden fuse while the phone is passed), push-your-luck dice (roll again or stop; breaks the one-roll-per-card rule).

**Pack ideas**
- **Most Likely To awards (needs B).** Record each vote; end of game crowns the most-voted per theme (the Drunk Stoned or Stupid payoff). The shipped pack is the standalone version.
- **Pokémon badge quest (needs A).** The table is one trainer; gym cards award badges (x/8); 8 badges unlock the Elite Four, then the Champion as the final card; a Pokémon Center card is a water break. Mostly tagging existing cards.
- **Dungeon crawl / D&D (needs A, later B).** Shared party HP; failed d20 checks cost HP; 0 HP wipes the party (everyone finishes their drink); clearing rooms raises party level (easier rolls); a boss is always the final card; one-use loot (Shield ignores a drink, Potion hands your drink off). With B: classes (Barbarian drinks and gives double, Bard sings to skip, Rogue steals, Cleric gives water). Core already has Nat One/Nat Twenty/Critical Failure/Dungeon Master/Mimic Chest, so plain D&D cards alone would duplicate Core.
- **Paranoia (needs D, secret cards).** A question goes privately to one player, who answers aloud with someone's name; that person can drink 2 to learn the question.
- **Spyfall / Werewolf (needs D).** Everyone peeks at a role once at setup (one spy or werewolf); accusation cards through the game.
- **Assassin / secret missions (needs D).** Private mission per player at the start ("get Ron to say 'literally'"); completing one gives a big pour. Runs in the background of any pack.
- **Hot Potato / Exploding Kittens bomb (needs D, timer).** A bomb card starts a hidden fuse; pass the phone; holder at the boom drinks. Sound only (iOS Safari has no vibration).
- **Push-your-luck dice (needs D).** Farkle / Pass the Pigs / blackjack: roll, bank or roll again; bust drinks the pot.
- **King's Cup cup (needs A).** Each King adds to a shared drink; the 4th King drinks it.
- **Mario Party bonus awards (needs B).** End-of-game awards: most drinks given, most votes, unluckiest roller.
- **Fluxx rule changers (needs C).** Cards that rewrite rules and sit in the tray.
- **Travel/airport pack.** Considered; overlaps House (Spirit Airlines, Never Have I Ever countries) and Cabin weekend.

**Pokémon League immersion.** Banners, badge case, Hall of Fame, ribbons, painted art and the Ancient Mew pair are built. Battles are the core League rule (2026-10-15): badges only on a win, Champions until one falls. The owner dropped region runs, pacing beats and the rest (2026-10-15).

**Suggested order (owner set dungeon crawl next, 2026-10-06; secret and timer cards shipped first on branch `secrets-and-fuses`):** per-pack loading (done) → vote pack (done) → A + Pokémon badge quest (done, 2026-10-05) → dungeon crawl (reuses quests; would add a finale at the end of a finite game and loot) → B + rules tray + awards → secret and timer card packs.

**Owner decisions (2026-10-05).** Initial-JS cap removed; workshop sweeps trimmed to a stress set (see the entry at the top).

## Cabin weekend pack from CABIIN 2.0 (2026-10-05, local only, not committed)

**Request.** Owner asked for a new pack built from as much of the CABIIN 2.0 sheet (`reference/cabiin-2/`, 96 spaces plus the legend) as fits the Drink at Ron rules, with the CABIIN-born Core cards moved into it, and lore-dependent spaces dropped if they don't stand alone.

**Change.** New `src/content/cabin.ts`: pack `cabin`, "Cabin weekend", 77 `cabin.*` cards (22 sip, 11 group, 34 challenge, 18 rule; 19 dice, 2 of them `choice` cards: `cabin.mint-chev`, `cabin.fourth-meal`) plus 8 House rows shared by ID, untouched (`house.sheet-012/016/024/028/040/042/053/054`), 85 in the pack. Logo `public/art/packs/cabin.svg` (game-icons `delapouite/forest-camp`, background removed). Registered last in `catalog.ts`; category motifs in `imprint.ts`.
- **Moved from Core** (old `core.*` IDs retired, recreated as `cabin.*`): Smooth Brain, I Don't Know Shit, That's Two Beers, Samesies, Almost Lost My Cool, What an Idiot, For Safety, It's Gotta Go, Get Good, Fuck You In Particular, Thanos Snap. Three were restored toward the CABIIN wording: Fuck You In Particular is "Roll d6. Drink 10 minus your roll" (was "Pick someone. They drink 6"), Thanos Snap makes the *unpicked* half drink, That's Two Beers is "Give out 24 drinks" (Core's 4d6 version is gone; House `sheet-003` still has 4d6). Core is now 105 cards; saved games keep their snapshot, and retired `core.*` IDs keep the Core mark via the prefix rule in `presentation/packs.ts`.
- **Translation rules used.** Teams became the drawing player or a home-state call-out (Florida, Michigan, Wisconsin, Ohio, Ski Team). Board movement and skipped turns became pours; multi-round effects last until the drawer's next turn. d6/3 and d6−3 are written out per roll. Guess I'll Die uses 2d6 doubles because the engine's `doubles` means *all* dice match (3d6 "any two match" would need an engine change).
- **Left out.** Legend (#45) and Group Effort (board scaffolding); Pipe Bomb, That's My Boyd, Gengar (guess-the-roll); I'm Gonna Cum, Another One, Do Better, Mike Bet (depend on another card); SS Allure, Too Soon O'Conner, Hot Dog Water (need backstory); Abra (covered by the shared House row and the Pokémon pack).
- **Tests and specs.** `tests/workshop.test.ts` Core counts (105; 16/22/9/43/15; 36 dice), total 434, and a new Cabin composition test; `tests/dice.test.ts` choice-card list; `dice.spec.ts` four-dice test now sources `house.sheet-003`; `secondary.spec.ts` and `game.spec.ts` expect 5 packs, 434 cards with all selected, 207 for Core + House. Counts updated in AGENTS.md, CLAUDE.md, README, GAME_DESIGN, AUTHORING, PLAYTEST, DEVICE_CHECKLIST, `src/content/CLAUDE.md`. `npm run cards:review` regenerated.

**Verified.** `npm test` 104 passed; typecheck clean; no Cabin card hits the long-copy review flag; Pages-path build and budgets passed (2624 KiB runtime; **98.0 KiB of 100 KiB initial gzip**, card data is in the initial chunk, so roughly one more pack this size would breach it); full production E2E in **Chromium only** (pre-installed `chromium-1194` through a temporary config, because the pinned Playwright wants `1243` and WebKit is not installed in this container): 82 passed, 1 failed under load (`dice.spec.ts:93`) that then passed 3/3 isolated. Two `game.spec.ts` keyboard tests (`:220`, `:620`) failed intermittently in this container and fail identically on the untouched baseline build. Workshop `title-fit.spec.ts` passed (Chromium).

**Not verified.** WebKit; the update flow; the full workshop sweep; any device. Card copy has not been reviewed by the owner or played.

**Next.** Owner reviews the Cabin cards (`docs/CARD_REVIEW.md`, pack `cabin`), then commit and push to `main` on approval (push deploys).

## Update offer survives an early takeover; update check hardened (2026-10-04, pushed as `aeb84dd`; CI run `37244462749` passed and deployed)

**Trigger.** CI run `37212135022` (`10fd5a4`, no app change) failed in `npm run test:update`: `forceUpdate` timed out after 30 s waiting for the second new worker to take over (`scripts/check-update.ts`). The other failure that day (`38e45f8`) was a test race, since fixed: `game.spec.ts:39` sent the reveal and its eight "rapid" taps as two steps, so on a slow runner the flip finished in between and a tap discarded the card (the test then read an empty title from the hidden face). Reproduced exactly by delaying the taps 800 ms; it and the same pattern in `motion.spec.ts` now send reveal and taps in one synchronous burst (24/24 over 6 repeats in Chromium and WebKit). The app was behaving correctly.

**Found.** The CI timeout itself was not reproduced (8 old-script runs under 8x and 20x CPU throttling and with a forced in-flight update check all passed), so its exact cause is unproven. Probing it did expose a real app bug: when a new release's worker takes control before the app has mounted (the first render is held for its art) or before the update hook is listening, the takeover went unnoticed and Update game was never offered that session. A probe that swaps the build while the reloaded page is still loading, at 8x CPU throttle, failed 4 of 5 runs before the fix and passed 5 of 5 after it.

**Change.** `src/main.tsx` listens for `controllerchange` at module load (ignoring the first install) and sets the Update game offer from it; the existing `onNeedReload` path is unchanged, and an active game is still never reloaded. `scripts/check-update.ts` now records the controlling worker before the next build is served and waits for a different controller, instead of attaching a `controllerchange` listener after the swap; it retries `registration.update()` every 3 s within the same 30 s budget; and `settled` waits for the table to exist.

**Verified.** `npm test` 103 passed; typecheck clean; build and budgets passed (94.9 KiB initial gzip); release smoke 34/34; update flow passed 5 consecutive local runs. **Not verified:** that CI no longer flakes (needs runs on GitHub), and the early-takeover case on a real installed iPhone. The probe was a temporary script and is not part of the suite, because it depends on CPU throttling to hit the window.

## Review pass: pack marks, play-screen furniture, tablet card, cleanup (2026-10-04, committed locally as `1d64f5c` plus a docs commit, not pushed)

**Request.** Review the app, then implement the findings plus three owner requests: a cleaner pack selector with no prose, a less cheap top area on the play screen, and a much larger card on iPad (it is read from across a coffee table). The owner wants text kept to a minimum everywhere.

**Pack marks.** Each pack now has exactly one single-colour silhouette, `public/art/packs/<id>.svg` (the former `*-seal.svg` files; the coloured logos are gone). `PackLogo` paints it as a CSS mask: gilded on Setup, the pack dialog and the pause menu, debossed in a card footer. A new pack needs one SVG and matches automatically. Pack tiles lead with the pack's mark (no tankard art). `setupHint` is removed from the type, both packs, validation and tests. The Setup row shows the selected marks plus the card count, which can no longer be clipped. The pause menu's pack legend is a row of marks.

**Play-screen top row.** The wordmark is gone during play. The counter is a brass medallion and the menu a matching stud, both cut from `public/art/bezel.webp` (previously shipped but unused), sharing one row in `main.tsx`'s header; `Play.tsx` no longer renders the counter. The menu stud no longer dims on every flip. `dialogs.spec.ts` used to assert the menu did not use the bezel; that expectation was reversed for this request.

**Tablet card.** `.card-stage` ceiling 470px to 760px and `.playing` is `min(100%, 860px)` wide; `--play-chrome` is 112px (138px at `min-width: 700px`). Card text, dice chips, choice plaques, footer marks and corner radius scale past the old caps with `max(px, cqw)` in `card-front.css`, so a 760px card reads like the 470px one enlarged. At 1024x1366 the card is 760 wide with 58px titles and 55px rules.

**Fixes.** End game settles any motion before clearing (it could be ignored during the dice-result reveal). Dialogs close on a tap outside the panel. The dice stage is rebuilt if its WebGL context is lost before the roll or the app returns from the background without one (`FullScreenDice.tsx`). `card-front.webp` (128 KiB, unused) is deleted and dropped from the preload list; legacy card, wordmark and tankard-tile CSS is removed; the italic Grenze face is preloaded. `npm run typecheck` added. `AGENTS.md` branch line corrected.

**Content.** `core.banned-number` is removed: it duplicated `core.cursed-number` (same mechanic, 3 instead of 2). Core is 116 cards and the catalog 368. Saved games keep their own card snapshot, so a game in progress is unaffected. Counts updated in the docs and tests; `docs/CARD_REVIEW.md` and the CSV regenerated.

**Workshop Landscape preset.** It was 844x390, a phone on its side, which the app blocks with the rotate prompt; the every-card sweep failed there on the first card on the previous commit too (a two-line title cannot fit the 220px floor card). The preset is now 1180x820, tablet landscape, which is the landscape people can actually play in.

**Verified (final tree).** `npm test` 103 passed; `npm run typecheck` clean; Pages-path build and budgets passed (2613 KiB runtime, down from 2739; 94.8 KiB initial + 147.9 KiB lazy gzip). Full production E2E, Chromium + emulated WebKit: 163 passed, 3 intentional WebKit offline skips, before the card removal; after it 161 passed and 1 test (both browsers) failed on a stale Core + House total, which then passed with the spec rerun 12/12. Update flow passed on the final build. Workshop suite: 13/13 in Chromium and 13/13 in emulated WebKit, including title fit and the 368-card sweep (normal and enlarged) at Small phone, Large phone, iPad, tablet Landscape and Split view. Seen in the desktop browser pane at 393x760, 375x667 and 1024x1366.

**Not verified.** Any physical device or simulator; the tablet card on a real iPad (legibility at distance, dice size against the larger card, iPad landscape and Split View); the brass top row at table distance; tap-outside dismissal by touch; the dice rebuild after real iOS backgrounding (tested with a synthetic `webglcontextlost` only).

**Next.** Push to `main` when the owner is ready (push deploys; not done). Then the device session in `docs/DEVICE_CHECKLIST.md`: installed-app edges, wake lock, iPad card size and landscape, launch flash, dice after backgrounding. Still open from the 2026-10-03 plan and gated on that session: ambient animation cost (task 5) and startup images (task 6). The playtest in `docs/PLAYTEST.md` has not been run. No lint script exists; adding one means a new ESLint dependency.

## First screen waits for its painted art (2026-10-04, committed and pushed)

**Report.** On a fresh Home Screen install the Play button showed a flat tan bar with odd top and bottom bands instead of the painted plate (owner's iPhone screenshot).

**Cause.** `button.webp` is a CSS `border-image`. The browser only requests it after the stylesheet is parsed and the button exists, and WebKit paints neither a partial nine-piece image nor the border while it is pending, so the gradient fallback showed (its bands were the gradient repeating under the transparent border). An installed app starts with empty storage, so its first launch downloads the art while the service worker precaches 2.7 MiB on the same connection. The file itself is served and precached correctly on Pages (checked 200, 93 KiB). Not established: whether the bar on the phone was a slow load or stayed until relaunch.

**Change.** `src/main.tsx` holds the first render until the first screen's art (`table.webp`, `button.webp`) and the Grenze faces are decoded; a resumed game also waits for every shared surface and the card frame. A 4 s cap falls through to the themed fallbacks. `index.html` preloads `table.webp`, `button.webp`, and `grenze.woff2` so they download alongside the script. `.primary` fallback gradient is now `border-box` (no bands if it is ever seen). `tests/browser/pages.spec.ts` gains an `@release` test that delays the art 1.5 s and asserts no Play button exists until it arrives; `motion.spec.ts` `seed` waits for the now-asynchronous mount.

**Verified.** `npm test` 98 passed; Pages-path build and budgets passed (2739 KiB runtime; 94.5 KiB initial + 147.8 KiB lazy gzip); full production E2E Chromium + emulated WebKit 154 passed, 3 skipped, 1 flaky (`orientation.spec.ts:7` WebKit, then 8/8 in isolation); update flow passed. Another session was editing `src/style.css` and `tests/browser/layout.spec.ts` during these runs. **Not verified:** a physical iPhone or the simulator's installed app.

## Choice cards: do it or roll (2026-10-04, committed and pushed)

**Request.** Cards like "Wear Becca's glasses for a round. Else drink 2d6" always rolled. They now offer the choice on the card.

**Change.** `DiceDefinition.choice?: { skip, roll }` (labels, at most 14 characters, checked by `validateDice`); `choice()` helper in `src/content/author.ts`. Engine: `awaitingChoice` and `skipRoll` in `src/game/engine.ts` (`advance` is unchanged and still refuses an unrolled dice card). Controller: `choose("skip" | "roll")`; `tap()` does nothing while a choice is pending. `parseSession` accepts an unrolled previous or final card only when that card has `dice.choice`. No session schema change, same storage key; games already in progress keep their snapshot and the old behaviour. `Play.tsx` renders two `.card-choice` plaques as siblings of the card button after the flip lands (styles in `card-front.css`); the parchment body shrinks above them, and a tap on the card only pulses them. Six House rows are marked: `house.sheet-004` (roll = "Got pitted", skip = "Take a shot"; its instruction is now "Drink {total} water."), `-008`, `-009`, `-023`, `-042`, `-062`. Sheet wording is untouched. Fixed-number "or drink 4" cards are unchanged.

**Verified.** `npm test` 104 passed (6 new in `tests/dice.test.ts`). Pages-path build and budgets passed (95.0 KiB initial + 147.8 KiB lazy gzip). New `@release` test in `tests/browser/dice.spec.ts` at 390×844 and 375×548, Chromium and WebKit, 4/4: plaques inside the card, at least 48px tall, no rule text under them, card tap inert, skip saves and reloads, roll resolves. `npm run cards:review` regenerated.

**Pre-push review of the whole working tree (same day).** Full production E2E: 158 passed, 3 intentional WebKit offline skips, 1 flaky (`orientation.spec.ts:7`, WebKit, first attempt only). Cause: `PortraitGate` read the orientation at render and attached its listeners in an effect, so a rotation in between was missed; the delayed first render made that window reachable. Fixed by re-checking when the listeners attach (`src/components/PortraitGate.tsx`). After the fix: release smoke 32/32 with no retry, update flow passed. `pages.spec.ts` "first screen waits for its painted art and fonts", recorded below as failing, passed 10/10 on a quiet machine; the earlier failure was host load.

**Not verified.** A physical iPhone or iPad (thumb reach, legibility at table distance), enlarged text with the plaques up, workshop suite.

## Play screen fits a Safari tab (2026-10-04, committed and pushed)

**Report.** iPhone 15 Pro, iOS 27, Safari tab with the two-row bottom toolbar: the card's bottom edge was cut off and the page could be dragged up and down.

**Cause.** The card was only height-fitted inside `@media (min-height: 760px)`. A Safari tab with its toolbar showing is about 650 to 715px tall on a 6.1in iPhone, so the card fell back to width sizing (337×505 at 393 wide) and the play screen came out a few pixels taller than the viewport. Playwright never saw it: every layout test used 844/852 or 568.

**Change.** `src/style.css`: `.card-stage` width is always `min(100% - 8px, (--app-height - --play-chrome) * 2/3, 470px)` with a 220px floor; `--play-chrome` on `.playing` adds up the real padding (safe-area insets included), topbar, counter and gaps instead of a fixed 175px (148px base at `min-width: 700px`). The `min-height: 760px` card rule is gone. `html:has(.playing) { overscroll-behavior: none }` stops rubber-banding on the play screen; Setup still scrolls. `--app-height` is unchanged (`100svh` in a tab, `100lvh` installed). `tests/browser/layout.spec.ts`: new `@release` test checks no page scroll, the card ending above the fold and 2:3 at eight viewports from 375×548 to 820×1050.

**Verified.** Pages-path build and budgets passed. Layout spec 22/22 in Chromium and WebKit. iOS 27.0 simulator (iPhone 17 Pro), Safari tab with the compact toolbar: card back and front fully visible above the toolbar; a vertical drag leaves the page in place. `pages.spec.ts:109` ("first screen waits for its painted art and fonts", from the earlier uncommitted preload work) failed in both browsers at `expect(delivered).toBe(false)`; not investigated here.

**Not verified.** The two-row bottom toolbar from the report (the simulator used the compact one), a physical iPhone, rubber-band behaviour mid-drag, the installed app after this change on a device, `npm test`, full E2E, workshop.

## Installed app is full screen (2026-10-04, committed and pushed)

**Result.** The strip under the installed app and the flat band behind the status bar are not system-owned. They are the page's own background showing where the document is not painted. Fixed in CSS plus one small effect; the wood now covers the whole display in the installed app on the iOS 18.5 and iOS 27.0 iPhone simulators. This supersedes the two sections below ("Wood to the edges", "installed iPhone bottom strip") and the claim that WebKit bug 301994 puts the strip outside the DOM. Screenshots: `docs/evidence/standalone-ios27-{before,after}.jpg`.

**Mechanism (measured, iPhone 16 Pro / 17 Pro simulators, 402×874, top inset 62).** With `viewport-fit=cover` + `black-translucent`, the installed web view is the full 874pt, but WebKit sizes the layout to 812 (`100%`, `svh`, `clientHeight`), i.e. screen minus the top inset. Only `100lvh`/`100vh` report 874. While the document is 812 tall it sits in one of two places, and both show a 62pt flat band of page background: at the top of the screen with the band at the bottom (iOS 18.5 always; iOS 27 on some launches: the "chin"), or one inset down at `scrollY = -62` with the band behind the status bar and the top inset applied twice (iOS 27 on other launches; iOS draws its scroll-edge blur over the band, which is the "frost"). Once the document is 874 tall and at `scrollY = 0`, the page paints the whole screen and there is no frost. A finger drag can otherwise pull the page back to `-62`, where it rests.

| Variation (installed app unless noted) | Measured | Verdict |
| --- | --- | --- |
| Shipped build, iOS 27.0 | `html` 812, wood ends at 812, flat 62pt strip below; other launches: `scrollY -62`, flat band on top, content 62pt low | Reproduces the device screenshot |
| Shipped metas on a probe page, iOS 18.5 | inner 812, `dvh`/`svh`/`100%` 812, `lvh`/`vh` 874; a 1400pt fixed ruler is clipped at 812; strip takes the `body` background colour | Same bug predates iOS 26 |
| Fixed layer `height: 100lvh`, `screen.height`, `bottom: -200px` (document still 812) | Element box reaches 874+, paint still stops at 812 on 18.5 | No effect alone |
| `html { height/min-height: 100lvh }` | 18.5: inner becomes 874, ruler reaches the bottom. 27.0: wood reaches the bottom | Removes the bottom strip |
| Same, plus `scrollTo(0, 0)` on 27.0 | `scrollY 0`, `.app 0..874`, no frost, status bar over wood | Full screen |
| Same, then drag the page down | Scrolls to `-62` and stays | Needs a lock |
| `html, body { overflow: hidden }` + the above | Drag produces no scroll events; stays at 0 | Lock works |
| Web manifest present vs absent (cloned web clips) | Identical geometry | Not a factor |
| Safari tab, iOS 27.0 iPhone and iPad | inner 714 / 1124, `lvh` 754 / 1153; layout unchanged by this work | Tab path untouched |

Not tested: `apple-mobile-web-app-status-bar-style` `default`/`black`, `viewport-fit` absent, manifest `display: fullscreen`/`minimal-ui`, `apple-touch-startup-image`. They were unnecessary once the shipped configuration filled the screen; `default` reportedly trades the bug for an opaque status bar ([jargon-gym PR 181](https://github.com/behnamazimi/jargon-gym/pull/181), 2026-10-04).

**Sources checked 2026-10-04.** [WebKit 301994](https://bugs.webkit.org/show_bug.cgi?id=301994) is still REOPENED (last comments 2026-07-20 to 2026-08-04, reproduces on 26.5.2 and 27 beta). [WebKit 301108](https://bugs.webkit.org/show_bug.cgi?id=301108) is NEW. Other installed apps fix the same gap by sizing to `100lvh`/`100vh` ([ghostly PR 651](https://github.com/MiguelMedeiros/ghostly/pull/651), 2026-09-29; [bunyan PR 3](https://github.com/alieldinHosni/bunyan/pull/3), 2026-09-29). One report found nothing could paint in the strip on a real iPhone on iOS 26.6.1 ([busssss PR 23](https://github.com/tpdbf5509/busssss/pull/23), 2026-09-05); that was not reproduced here, so a physical check is still required.

**Change.** `index.html`: an inline script adds `html.standalone` before first paint when `navigator.standalone` or `(display-mode: standalone)`. `src/style.css`: `--app-height` (`100svh`; `100lvh` when standalone) and `--backdrop-height` (`100dvh`; `100lvh` when standalone) replace the literal units in `.app`, `.playing`, the card-stage width and the two backdrop layers; when standalone, `html` and `body` are `height: 100lvh; overflow: hidden` and `#root` is the scroller (`overflow: hidden auto; overscroll-behavior: none`). `src/presentation/theme.css`: `.atmosphere` uses `--backdrop-height`. `src/main.tsx`: one effect keeps the class in sync and holds `scrollY` at 0 (start, scroll, resize, pageshow, orientationchange, visibilitychange) while standalone. The browser-tab layout, engine, session schema, storage key, card frame, dice and manifest are unchanged. `tests/browser/layout.spec.ts`: the tab edge test now asserts it is not standalone; a new `@release` test poses `navigator.standalone` and checks the document, `#root`, `.app` and both backdrop layers end on the last row, the root cannot scroll, the bottom row is wood, and the 2:3 card still fits.

**Verified.** iOS 27.0 simulator (iPhone 17 Pro), installed app: cold launch, play screen, card flip by tap, background/resume all at `inner 874`, `scrollY 0`, `.app 0..874`. The app installed through Safari from the previous build (service worker + manifest) picked the fix up on its second launch with no reinstall. iOS 18.5 simulator (iPhone 16 Pro): cold launch full screen with the home indicator over wood. `npm test` 98 passed; Pages-path build and budgets passed (2738 KiB runtime; 94.3 KiB initial + 147.8 KiB lazy gzip); layout + pages specs 28/28; release smoke 24/24; update flow passed. Full production E2E on a quiet machine: 150 passed, 3 intentional WebKit offline skips, 1 flaky (`game.spec.ts:607`, the known WebKit menu-focus assertion, passed on retry). An earlier E2E run made while three simulators were booting had 1 failure (`game.spec.ts:204`, Chromium) and 3 flaky; that test then passed 6/6 in isolation. Not run: `npm run test:workshop`.

**Not verified.** A physical iPhone or iPad (simulators are not device evidence; record the result in `docs/DEVICE_CHECKLIST.md`). iPad installed app: the iPad Pro 11 (iOS 27.0) simulator never finished loading web content in the installed app or in Safari's Add to Home Screen dialog, so only its Safari tab was seen. Landscape and rotation in the installed app. Small phones without a notch. Setup content taller than the screen scrolling inside `#root` on a real device.

**Leftovers on this Mac.** The iOS 27.0 simulator runtime (about 7.5 GB) and two simulators, "Ron iOS27" and "Ron iPad27", were added for this work and can be deleted in Xcode. Nothing is committed or pushed. Next task: authorization to commit and deploy, then reopen the installed app on the physical iPhone and iPad and record both edges.

## Wood to the edges (2026-10-03, committed and pushed)

Spencer disliked the top/bottom blur and asked for the wood to run to the edges. Removed the flat top band, bottom fade and firelight mask; the wood now paints edge to edge at `100dvh`. `--chrome`, the page background, `theme-color` and manifest colours changed from `#17100c` to `#271c11`, the measured bottom-edge average of the wood (393×852 and 834×1194), so the iOS-owned strip below the web view matches the last painted row. The strip itself still cannot show texture, and iOS 27's top frost is system-owned and remains. `tests/browser/layout.spec.ts` now averages the last row (±8) and expects no mask. Verified: layout+pages 26/26, release 22/22, update flow, build budgets unchanged. Not verified: the real installed iPhone (strip colour is cached at launch: close and reopen the icon). Capture: `/tmp/ron-wood-edge.png`.

## Review and improvement plan — iOS/iPadOS Home Screen app (2026-10-03)

Read-only review of `main` plus the uncommitted chin-mitigation diff; no source behavior changed. Added `CLAUDE.md` (imports `AGENTS.md`) at the root and in `src/{game,app,content,presentation,presentation/dice,components,screens,workshop}`, `tests`, `scripts`, `docs`, `reference`, `public`, `assets`. Checked: `npm test` 98 passed, `tsc -b` clean. Not run: production build, Playwright, any physical device. Everything below about iOS behavior is unverified until observed on hardware.

**Verified from code (no bug found).** Engine/save invariants and v1 migration, update flow (`autoUpdate` + `onNeedReload`, never reloads mid-game), dice stage disposal (`forceContextLoss`), storage-denied degradation, saved roll validation. Save cost per tap is 27 KB (Core) to 84 KB (all packs) synchronous; acceptable, no action.

**Findings, highest value first.**

1. **Screen can lock mid-game.** Nothing requests a Screen Wake Lock (`grep wakeLock src` is empty). A phone or iPad sitting on a table between card reads will dim and lock on iOS defaults. Saves survive, but it breaks the "native app" feel.
2. **iPad landscape is blocked.** `PortraitGate` treats every iPhone/iPad (including iPadOS reporting as Macintosh with touch) in landscape as blocked. iPads on a table are often landscape. The card is a fixed 2:3, so landscape should simply centre it. This is a product decision as well as a bug; confirm with Spencer before changing.
3. **Install copy omits a data-loss trap.** On iOS the Safari tab and the installed Home Screen app do not share localStorage, so a game started in Safari is not there after installing. Nothing calls `navigator.storage.persist()` either. Tell people to install first, and request persistence where available.
4. **Unresolved installed-app bottom strip.** The local `100dvh` backdrop and firelight fade (uncommitted) still need authorization to commit and a physical recheck. Do not add more speculative CSS if it persists (see the task below).
5. **Always-on ambient animation.** Fire, six embers, eight dust motes and a candle loop for the whole session (`theme.css`), paused only when the page is hidden. Likely battery and heat cost on a table-top device left on for hours; unmeasured.
6. **Possible white launch flash.** No `apple-touch-startup-image`; `index.html` only sets the title, icon and translucent status bar. Whether iOS shows a white frame before the dark UI is unverified.
7. **Short/Long on small packs repeats cards.** Length is a fixed 30/60 cards, but VIP alone has 16, so one "Short" game reshuffles and repeats cards with no hint on Setup. Setup also never shows how many cards the selected packs contain.
8. **Stale/contradictory docs.** `AGENTS.md` still says to preserve branch `codex/finish-v1`; `main` is the only branch. This file is ~725 lines and its header date predates the latest work. `scripts/_temporary-card-edit.mjs` (untracked) overwrites card modules with superseded copy, including the denied `core.deez-nuts`; running it would regress content.
9. **Tooling gaps.** No `typecheck` or lint script (hooks lint would catch effect-dependency mistakes in `FullScreenDice`/`main.tsx`); `npm test` does not type-check. Two near-duplicate cards remain (`core.cursed-number`, `core.banned-number`). `assets/` is ~66 MB of tracked source art.

**Plan.** One task at a time, each ending with updated status and device-checklist items. Nothing here is authorized for commit, push or deploy.

| # | Task | Done when |
| --- | --- | --- |
| 1 | Get authorization to commit the chin mitigation and deploy; recheck on the installed iPhone and record it in `docs/DEVICE_CHECKLIST.md`. | Result recorded, pass or fail. |
| 2 | Wake Lock hook in `src/app` or `src/presentation`: acquire while a game is active, re-acquire on `visibilitychange`, release on complete/setup, silent no-op when unsupported. | Playwright test with a stubbed `navigator.wakeLock`; device check that the screen stays on for 5+ minutes in the installed app. |
| 3 | Install dialog and persistence: warn to install before playing, call `navigator.storage.persist()` when available. | Copy updated; unit/browser test for denied or missing API. |
| 4 | Decide iPad landscape (Spencer's call). If yes, gate only phone-sized landscape and verify card fit at 1180×820, 1366×1024 and Split View. | Orientation specs updated; device check on an iPad. |
| 5 | Measure ambient animation cost with Safari Web Inspector on a real device; if material, pause ambience during dice, dialogs and after idle. | Before/after numbers in this file. |
| 6 | Check for a launch flash on device; if present add startup images for current iPhone/iPad sizes under `public/`, inside the 3 MiB runtime budget. | Cold launch checked on device. |
| 7 | Setup: show pack card counts, and clamp or label Short/Long when the selected packs have fewer cards than the limit. | Unit test on the clamp; Setup layout still passes `@release`. |
| 8 | Hygiene (ask first): fix the `AGENTS.md` branch line, move STATUS history to an archive file, delete the scratch script, add `typecheck`/lint scripts, merge or differentiate the two number-ban cards. | Docs and CI still pass. |

**Progress (2026-10-03, committed and pushed).** Tasks 2, 3, 4 and 7 are implemented; 1, 5, 6 and 8 are open. Per Spencer's "whatever a professional game dev would do": wake lock via `src/app/wakeLock.ts` (`useWakeLock(active)` in `main.tsx`); `requestPersistence()` on start and an Install dialog line saying to install before playing; `PortraitGate` now blocks only landscape with a short side under 600px, so iPad landscape plays (the old "iPad landscape is blocked" test was replaced by a 1180×820 card-fit check); Setup shows the selected packs' card count and a repeat hint when the count is below the 30/60 limit (no clamp; the game itself is unchanged). Verified: `npm test` 98 passed, `tsc` clean, Pages-path build and budgets passed (2737 KiB runtime; 94.2 KiB initial + 147.8 KiB lazy gzip), new wake-lock spec plus orientation/secondary/game specs 49 passed / 2 skipped / 1 flaky (a WebKit menu-focus assertion in game.spec.ts passed on retry; unrelated code), release smoke 22/22, update flow passed. Not verified: real wake lock on iPhone/iPad (needs iOS 16.4+, Home Screen fix 18.4+), iPad landscape at 1366×1024 and Split View, Setup hint layout on a 320px phone.

Gates for every task: `npm test`, `BASE_PATH=/Drink-at-Ron/ npm run build` (budgets unchanged), `npm run test:release` with a unique `TEST_PORT`, and the matching device check.
