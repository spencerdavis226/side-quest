# Physical-device release checklist

Automated browser emulation is not evidence of actual iOS Home Screen behavior. Complete this on a real small iPhone, a large iPhone, and an iPad before sharing a polished release.

- [ ] Top-edge blur (2026-10-17, owner report on iPhone 15 Pro): in the installed app, during a game, the header's top edge is sharp, with no soft blur under the status bar. The play screen's #root no longer scrolls; record whether the blur is gone, and whether setup (which still scrolls) shows it.
- [ ] Header redesign (2026-10-17): in a plain game, Pub Crawl and Pokémon League, check the studs, the plaque and (crawls) the strip read from across the table, the strip's chips open the satchel, effects and party dialogs, and nothing sits under the status-bar frost in the installed app.
- [ ] Open HTTPS site in Safari. Check safe areas, browser toolbar expansion, no horizontal overflow, readable rules, and reachable controls.
- [ ] Home page, with Safari's toolbars showing: The title crest and controls clear status icons, and Play stays above the bottom toolbar. Check that the small information control appears only in iPhone/iPad Safari browser launches, is absent in the installed app and other browsers, and remains hidden in Safari after choosing Already added. Swipe up/down: the table should stay still at normal text size. Repeat after expanding/collapsing toolbars and in the Home Screen app. With enlarged text or an unusually short view, every control must remain reachable through the content scroller without pulling the document into the status bar. The 2026-10-06 owner screenshot reported overlap/scrolling; the local fix has browser-emulation checks, with a physical-device recheck pending.
- [ ] Set the phone on a table and read short and long rules from the far seat and side seats in bright and dim light. Check whether any rule needs the phone passed around or a forced scroll.
- [ ] Install through Share → Add to Home Screen; open from icon and check standalone launch appearance.
- [ ] In the installed app, check both edges: the wood runs behind the status bar with no flat or frosted band, and down under the home indicator with no flat strip. Nothing interactive (Install, wordmark, menu) sits under the status bar. Drag the table up and down: the page must not move. Background and reopen, force-quit and reopen, and rotate to landscape and back (iPad), re-checking both edges each time.
  - 2026-09-26 iPhone screenshot: **failed** bottom check; an ~89px flat strip begins at a hard table-to-system seam.
  - 2026-10-04 simulators only (not device evidence): reproduced on iOS 27.0 and fixed by sizing the installed app's document to `100lvh` and pinning it at the top; full screen on iPhone 17 Pro (iOS 27.0) and iPhone 16 Pro (iOS 18.5). See `docs/evidence/standalone-ios27-{before,after}.jpg`. Physical iPhone and iPad recheck pending after deployment; the installed iPad app and landscape were not observed even in the simulator.
- [ ] Wake lock: in the installed app start a game, leave it untouched 5+ minutes; the screen must stay on, then dim normally after ending the game or backgrounding. Check Low Power Mode.
- [ ] iPad landscape (full screen, 1366×1024 and 1180×820) plays without a rotate prompt and the card fits; phones in landscape still show the prompt.
- [ ] iPad card size (2026-10-04, unverified): in portrait the card should nearly fill the screen and its rules read from standing distance around a coffee table; check dice size against it, the brass counter and menu at the top, and that nothing scrolls.
- [ ] Reveal a dice card, switch apps for a minute, return and roll: the 3D dice should still throw (the stage is rebuilt if iOS dropped it).
- [ ] Wait for offline readiness, enable airplane mode, close and reopen. Reveal/discard multiple cards and verify artwork works.
- [ ] Reveal a card, switch apps, lock/unlock, and reopen. Same card and count persist.
- [ ] Rapidly tap during reveal and discard. Exactly one action occurs per transition.
- [ ] Interrupt a transition by closing the app. It restores the latest committed stable state, never a broken animation.
- [ ] Check Standard (50), Infinite, both quest modes, and the eight opt-in pack toggles in the pack dialog. Confirm an existing custom-length active save retains its original limit.
- [ ] Confirm final card stays visible until dismissed; replay starts a fresh shuffle with the same setup.
- [ ] Previous Card is read-only; menu close restores focus; End Game can be canceled.
- [ ] Enlarge text and zoom, enable Reduce Motion and VoiceOver. Read full rules and operate all controls.
- [ ] In phone and iPad landscape, confirm the rotate prompt blocks play and Escape; rotate back and confirm the same card, menu, and count return. Desktop landscape should remain usable. Check iPad split view and hardware keyboard where available.
- [ ] Reach a dice card: first tap rolls; second tap during motion finishes through the landing, holds briefly, then dismisses. Confirm faces match the saved values and only the later tap discards.
- [ ] Publish an update while a game is active: no mid-game reload. Then force-quit and reopen the app (or reload in Safari) and confirm the new build loads on its own, with the saved game intact. Finish/end a game after another update and apply the offered Update game, then check offline relaunch.
- [ ] Measure interaction smoothness on real devices; target 60 fps. No performance claim until measured.

## Automated evidence

`npm test` covers shuffle cycles, finite/endless behavior, catalog validation and saved-state invariants. `npm run test:e2e` covers browser interaction, restoration, malformed saves, denied storage, responsive layouts, keyboard/reduced motion, and Chromium offline reload. `npm run test:update` serves three real builds and checks that an update never reloads an active game, that a refresh or relaunch already serves the new release, and that the between-games update keeps the save. WebKit service-worker testing is excluded from automation and belongs to the physical checks above.

## Unified tavern presentation

Sound has been removed; there are no audio checks. Verify the visual and dice items below.

- [ ] Check the new painted Home Screen icons and dark launch colors on actual iOS.
- [ ] Let a full dice throw finish: dice land freely, including over text, and stay fully onscreen. Tap to clear them; the original rule becomes the resolved instruction with the actual amounts in bold.
- [ ] Roll 20+ times across a session; watch for accumulating lag, a frozen canvas, or a lost WebGL context.
- [ ] Simulate a platform without WebGL: the saved values still appear and a tap reveals the resolved rule (no forced replay).
- [ ] Rotate during and after a roll; the rotate prompt appears, the saved result stays unchanged, and portrait shows the readable settled result. Check Safari toolbar expansion/collapse separately.
- [ ] Roll once installed and offline; reopen the app and confirm the saved roll is restored without replaying.
- [ ] Install a new release after a completed game and resume the saved session from the updated build.
- [ ] Ensure all rules remain clear in Grenze at larger text sizes. Check actual iPad split view and VoiceOver.
- [ ] Interrupt a discard: the save already contains the next card, and reopening must not repeat the discarded card or celebration.

## Core workshop milestone

Automated evidence is recorded in `docs/STATUS.md`. Keep the following pending until observed on physical hardware:

- [ ] Approve the short, long, and temporary-rule front studies on an iPhone and iPad.
- [ ] Play Standard (50 cards from the 105-card Core deck) using the playtest record, then sample more cards in Infinite with the House deck. Engine tests cover the full shuffle cycle.
- [ ] Verify the published `/side-quest/` URL, Home Screen installation, offline relaunch, and updates on iOS.
- [ ] Evaluate the approved frame and live title sharpness, scrolling with enlarged text, and flip smoothness on physical devices.
- [ ] Secrets & fuses (2026-10-06, unverified): hold Hold to read with a thumb; the secret shows only while held, with no text-selection loupe or callout, and hides on release, on app switch and on lock. Forehead: start the clock, hold the plaque with the phone on a forehead; the table can read the word and the counter. Light a fuse with the phone flat on the table while a beer goes round: stray taps on the card do nothing, the BOOM is unmistakable from every seat in bright and dim light, and the card goes aside afterwards. Skip puts a timed card aside before or during its timer, and the three plaques on a Forehead card are easy to hit with a thumb. Background the app mid-fuse and return: it goes off at once if its time passed.
- [ ] Pub Crawl (2026-10-15, unverified): choose Pub Crawl, start, and play through a floor. The hearts meter, floor name and satchel stud read from across the table; the room medallion counts 1 to 7, then turns to the boss with its hit pips. Every room card shows its seals (hearts lost, reward, curse) and the Flee or Reroll plaque when a smoke bomb or loaded die applies; trials take only Won or Lost. Losing hearts flushes the screen red and shakes the heart; a draught (from the meter's party dialog) flushes gold. At 3 hearts or fewer the heart beats; it must stop when the app is backgrounded. Reach a wipe and a win (seed or play) and check both end screens. Background and reopen mid-boss: the same boss, hits and hearts return.
- [ ] Pub Crawl replayability (2026-10-15, unverified): the run opens on tonight's omen (the crystal ball in the medallion, the omen card reads from across the table); its effect shows in the party dialog. A merchant's three plaques and a fork's two are easy to hit one-handed at the table and read at arm's length; an unaffordable price is clearly greyed. The loud door deals an elite next. An ambush shows two pips. Play again after a wipe or a win deals a different omen and, usually, different floors.
- [ ] Pokémon League journey (2026-10-16, unverified): choose Pokémon League; the setup reads "17 HP · 8 gyms" and the pack picker steps aside. The run opens on a starter (the egg in the medallion); Team HP shows as Poké Balls in the team dialog, which also shows the starter, its evolution line and a row of eight badges that light as gyms fall. Take an evolution card's Evolve plaque: the pearl "What? … is evolving!" banner sweeps across the top third and stays clear of a stage banner below it; a fully evolved starter's Evolve plaque is greyed. Catch plaques, Poké Mart prices and the crossroads' loud path read at arm's length. Gym leaders without dice take only Won or Lost. Play (or seed) through a whiteout and a Hall of Fame. Background and reopen mid-gym: the same leader, HP and form return.
- [ ] Pub Crawl at League depth (2026-10-17, unverified): the run opens on an adventurer (the helm in the medallion), then tonight's omen and the Quarter-Zips in the queue. A boss's banner carries its wanted line. When a boss or elite falls, the two spoils plaques read at arm's length and a stray tap on the card does nothing until one is picked; the trinket banner names it. A jinx shows on the meter's stud and in the party dialog, and its banner sweeps when it lands and when it lifts. The Quaff plaque appears on a lost d20 and is easy to hit one-handed beside Reroll and Flee; the Bar Tab banner says "Point at someone". A landing's Level up / Rest plaques work, and the level-up banner stays clear of a stage banner. A gamble room's Cash out / Again plaques read clearly and its prize seal lights the banked prizes. The hidden room's banner sweeps after the first landing. The Cup count in the party dialog matches the losses. Each of the nine floors (seed a route per floor) reads well at table distance. Background and reopen mid-gamble and mid-spoils: the same banked prizes and the same choice return.
