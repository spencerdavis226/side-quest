# Playtest record and session kit

Status: **prepared, no results recorded.** Kit prepared 2026-09-21 at commit `3e7a0d9`. This file is the human-gate record for task 8; the catalog review sheet is generated separately from the live cards.

## How to run

- Two sessions, ideally one group. Session A is Short (30 cards) with the Core deck. Session B is Infinite with the House deck and VIP night, with a guest of honor; use more sessions to cover the deck.
- Dice cards are spread across the packs (36 in Core, 19 in House, 21 in Pokémon plus 12 League-only gym leaders, 19 in Cabin weekend). Packs are opt-in; select as many as the table wants.
- Use the game without coaching beyond choosing a first drawer and clockwise turns. Record confusion rather than steering players to the intended answer.
- Place the phone where the group will actually play. Ask people across the table and at side angles to read each revealed rule without passing the phone; note when they must lean in, turn the phone, or scroll.
- After each session ask: which cards would you remove, which do you want more of, and was the next action ever unclear?
- Keep automation results separate from these observations. Do not mark a check passed from an emulated screenshot.

## Session A — Short (30, Core)

- Date / build commit:
- Device / OS / Safari or installed Home Screen:
- People / approximate session length:
- Deck: Short, Core only (30 cards from the 105-card pool).

## Session B — Infinite, then VIP night

- Date / build commit:
- Device / OS:
- People / approximate session length:
- Note any repetition or pacing issues; automated engine tests verify cycle exhaustion.
- If adding `VIP night`, choose a guest of honor before play and note whether the four sheet-sourced VIP prompts fit the occasion and read clearly.

## Session C — Pub Crawl (Dungeon night)

- Date / build commit:
- Device / OS / Safari or installed Home Screen:
- People / approximate length / floor reached / won or wiped:
- Hearts left at each boss; items found and used; curses taken.
- Was it hard but fair? Did the table understand that a lost fight costs both a drink and hearts without being told? Did anyone use the Healing Draught (a fresh, full drink for one heart)?
- Which rooms got a laugh, which fell flat, and did any trial leave the table unsure whether to press Won or Lost?

## Dice and roll checks

- Was tapping the card to roll obvious without coaching on the first dice card? Was tapping it again to return to the resolved rule obvious once the dice settled?
- Did the settled dice ever cover the title or rules so the result was hard to read?
- Did the saved total match the faces you saw? Did returning to the card avoid discarding (the later card action discards)?
- Roll at least 20 times across the session: any lag, frozen canvas, or a roll that would not settle?
- On a platform without WebGL, or with the renderer failing: does the saved result still show and the card tap still work?

## Temporary-rule checks

- For each `rule` card encountered: did the rule's stated duration and consequence land without app bookkeeping?
- Did any rule require a reminder of when it stopped?

## Copy and pack decisions (need user approval)

- **Pack names/copy.** `The Core deck` (generated main deck, 116), `The House deck` (supplied sheet, 94), `VIP night` (16), `Pokémon night` (board sheets, 120, plus 24 League-only gym leaders), `Cabin weekend` (CABIIN 2.0, 85), `Most Likely To` (250). Keep, or rename?
- **Dice cards.** Every roll now resolves to one exact instruction in the engine. Check the odds/evens, doubles, and per-die cards on the phone; note any result you would read differently.
- **`VIP night` name/copy.** Keep, or rename? The pack mark is `art/packs/vip.svg`.
- **Card wording.** The sample text is supplied as-is, including the crude language. Note any line you want changed; unchanged concepts keep their IDs, unrelated replacements get new IDs. Discuss balance after observing the expanded deck; keep IDs stable for copy edits.
- **Future art.** The launch card front stays plain parchment inside the approved frame. Discuss any new illustration work separately after copy is locked.

## Observations

Add rows or annotate the sheet below. Mark each card: `fine`, `confusing`, `skipped`, or `remove`.

Use the generated [card review sheet](CARD_REVIEW.md) or [CSV](card-review.csv) to record per-card observations for all 714 cards (105 Core, 94 House, 16 VIP, 120 Pokémon plus 24 League-only gym leaders and 20 gauntlet cards, 85 Cabin, 250 Most Likely To). Keep this file for session findings and decisions. The House IDs include their source sheet row numbers for comparison.

## Device checks

- Install from Safari, launch from Home Screen, then relaunch offline after assets cache.
- Background while facedown, revealed, and mid-discard; return and verify exact progress.
- Test larger text and reduced motion; try portrait, landscape, and iPad split view.
- Reach a dice card and roll; note whether Roll/Continue is obvious without coaching and whether the settled result is readable.
- Note unintended taps, slow frames, clipped content, and anything hard to read.
- Repeat a few short and long rules in both bright and dim light; record whether the larger body text is enough at normal table distance.
- Confirm a new release waits until the game ends before offering Update game.

## Done when

- An observed playtest record exists (this file, filled in).
- Requested revisions survive a retest.
- Copy and pack decisions above are approved by the user.

Engineering work can finish while this human gate remains pending. Do not mark a physical check passed from an emulated screenshot.
