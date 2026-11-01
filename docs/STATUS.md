# Current state and implementation plan

Updated 2026-11-01. **Single authoritative handoff.** Read `AGENTS.md` first. Older handoffs are in `docs/STATUS_ARCHIVE.md` (reference only). Direct user instructions win.

## Pushed 2026-11-01: the moments review (owner: "Review and improve the premium moments layer ... feel premium, exciting ... real eye candy, not cheap ... then build the fixes")

Every moment and ending was looked at frame by frame at 0.25x in Chromium from the dev stage (`?moments=1`) at 390x844 and 320x568, and in the real app from seeded saves with motion on (foil, Most Likely, a Cellar boss's gate, Lt. Surge's clash, Byron's badge). **Display only:** no engine rule, card, save field or balance changed; no new save fixture.

**Broken, now fixed**
- **Banners landed on moments.** The next route's stage banner ("The badges get heavier") played on top of the badge moment, and a boss's "jinx lifted" news could land on its spoils. `StageBanner` and `PartyNewsBanner` now wait while the director is `busy`, then sweep.
- **Foil on the wrong cards.** `cardFinish` read the ribbon tone, so every pearl or crimson ribbon wore gold: all 35 starters, 18 adventurers and 20 omens, every Pub Crawl boss, the rival and the queue's ambushes. It now reads the stage a boss belongs to (gold: Legendary, Champion, Pub Crawl's last stage; silver: other bosses; ambushes and omens none). Unit test extended.
- **Foil mask.** Measured on both 768x1152 fronts (parchment x 12.9-87.4% teal, 11.5-88.2% League, y 30.9-89.1%; title plaque y 8.5-23%, x 19-81%). The old single hole lit the title and left the frame's inner rails and foot bare; the mask now has two holes (parchment, title plaque) and covers the painted frame only. Checked with the foil painted solid on both fronts.
- **Badge glint invisible.** The band crossed the badge in about 40 ms (positions -150% to 150% on a 300% background). It now sweeps 5% to 85%, twice, brighter.
- **Fly-to clones in WebKit.** `fly.ts` copied the `background` shorthand, which WebKit's computed style can serialise as empty; it now copies longhands, plus size and mask, so a medallion keeps its colour and size off the stage.
- **Shades from 0.** The portcullis, Legendary, clash, loot and send-in now open on a shade at 85% (new `moment-shade`); clash, loot and send-in got real backdrops (a dark band behind the clash's medallions, a new `loot-shade`).
- **Hall of Fame.** The name now sits on its own layer, clear of the medallion; fireworks burst off to the sides (smaller), never over the name; the beam is a soft cone with a pool of light instead of a box with a hard edge at 62%; the opening white draws in to the starter instead of fading through grey; the eight badges fit one row at 320 px (the eighth wrapped into the stats). Stats checked against `questRecord`: "Bosses beaten" counts boss-stage cards, 15 on a won League (8 gyms, the hideout boss, the Legendary, 4 Elite Four, the Champion; the rival is an ambush), "Team HP left" is `party.hearts`, "Caught" is `party.team.length`.
- **Whiteout.** The light now grows from the middle as a disc with a solid core (no flat grey frame); the HP bar is bigger and glows.
- **Text at 320.** "Super effective on you!" ran edge to edge (now 7.4vw, wraps within 92vw); "POINT!" ran off both edges (now 20vw).
- **Most Likely To.** The card's face makes room for the "Count it down" plaque (`choosing`), so the rules never sit under it; all 250 cards checked at 320x568, none overflow or meet the plaque. The countdown's shade is near-opaque behind the numbers, each number throws a ring, and POINT gets turning rays.

**Raised**
- **A tap on a boss entrance also turns the card.** The stage hides on the press and ends on the lift; a lift over the card clicks it once, after the lift's own click is swallowed. The table's tap turns the card; the animation still never advances the deck. A tap off the card only skips.
- New `streaks` particles (lines of light thrown off an impact: VS, the gate's slam, a decisive clash); dust is now a soft puff that swells (hard discs read as bubbles); the Legendary gets turning rays in its type's colour, grit shaken from above and its medallion moved clear of the name; Pub Crawl's wipe gets candle pools of light that die with the flames and smoke curling from each wick.
- Under Reduced Motion a still plaque reads in 1.3 s while another waits (a badge, spoils and the next boss no longer take 6 s in a row).
- `FullScreenDice.tsx` and `usePresentation.ts` now ask `reducedMotion()` for every point read and keep a `matchMedia(REDUCED_MOTION)` only for the change listener.

**Tests:** `tests/browser/moments.spec.ts` adds four: a boss's entrance plays once and a tap on the card skips it and turns it; a boss dealt again after a lost swing has no entrance; a beaten gym's badge flies into the badges chip (held at 98% of its flight: within 12 px of the chip's centre, chip-sized, its face painted) and is announced; a tap during the type clash still rolls. `--repeat-each=3` green in Chromium.

**Checks run:** typecheck, lint, `npm test` (434), `BASE_PATH=/side-quest/ npm run build` (budgets pass: runtime 3,856 of 4,096 KiB, initial 137.6 KiB gzip, largest lazy chunk 144.6 KiB), `test:release` Chromium (14 passed), Chromium moments, quest, crawl, secrets, motion, dice, dialogs, secondary and layout specs (125 passed, 1 failed: `layout.spec.ts` "home fits Safari's visible height without moving Install into the status bar", which fails the same way on unmodified `12ff55b` locally; not part of @release), `npm run test:update` (passed). WebKit runs in CI only.

**Not checked:** a physical iPhone (`docs/DEVICE_CHECKLIST.md` has a new row: the tap that skips and turns, the foil in WebKit, fly-to colours, frame rate with streaks and puffs). The sweeps were not run (no layout change to crawl or League faces).

## Deployed 2026-11-01: premium moments, all eleven, and the review of the old effects (owner: "Everything main. Push ... review and overhaul anything that needs touching up or refactoring, including older animations/effects/moments ... then proceed and build in a logical order")

**Deployed** by CI run #282 (`ab8b9ba`, every job green in Chromium and WebKit, deploy 13:55 UTC). Two earlier pushes did not deploy: #279 failed `test:update` (fixed in `990828b`, see Update flow below), #280 failed the new @release moments spec in WebKit (it waited for the 2.6 s stage to read stable; it now taps at once, `ab8b9ba`). Revert `1712b60`, `990828b` and `ab8b9ba` to undo.

The plan below, built in its order (foundation, then the once-a-run moments, then the fight moments, then rarity and the plain modes). **Display only:** no engine rule, odds, card, save field or migration changed (the one controller change is a display flag, `undone`, on an undo's snapshot), so no new save fixture.

- **Foundation (`src/components/moments/`, `presentation/moments.css`).** `detect.ts` is the one place triggers live (`momentsBetween(before, after, undone)`, pure, unit-tested): a moment fires only on a change the table just made, so a resumed game or an undo plays nothing. `Director.tsx` (`MomentDirector` wraps the app in `main.tsx`) queues them: one at a time, each waits for the card's deal, flip or discard to end, a tap skips it and swallows the click that follows. `busy` makes the Felled stamp wait for a natural burst instead of landing under it; `useMomentLock` holds the queue while the ball throw is up. The views are a lazy chunk (6.6 KiB gzip) warmed when a game starts; `particles.ts` is one canvas (confetti, sparks, embers, coins, motes drawn inward, shards, fireworks, dust; capped at 420); `fly.ts` flies a prize into a strip chip marked `data-fly`. "Big moments: Full / Quick" is in the pause menu (Quick: 0.6 of every length, no type clash), kept in `side-quest.moments.v1`. Reduced Motion shows a still plaque with the moment's words (and what changed) instead. Dev stage: `?moments=1` (every moment and ending, 0.25x speed, `&play=<key>`).
- **Review of the old effects (R1 to R6):** `reducedMotion()`/`stillMotion()` in `motion.ts` replace the media-query reads in `Play.tsx` (twice), `GameDialogs.tsx`, `StageBanner.tsx` and `BallThrow.tsx` (`FullScreenDice.tsx` and `usePresentation.ts` keep theirs: they listen for changes). The natural burst moved into the director (unchanged look, plus sparks and confetti on a 20, shards on a 1; taps still go through it). The evolution morph (hard cuts about 10 Hz apart, past the three-flashes-a-second line) is replaced by a new evolution moment. The ball throw's, natural burst's and evolution's styles left `crawl.css` (3,160 to 2,225 lines) for `moments.css`. New `--z-moment`, `--z-particles`, `--z-flier` layers.
- **Once a run:** evolution (5.4 s: the old and new glyphs trade places at most three times a second while motes are drawn in, the light folds, one bloom, the new form's medallion and name and what changed); Pub Crawl's level up as a forge (three hammer strikes, sparks, the new level stamped in gold). Boss entrances replace the stage banner on boss stages only: the League's VS (diagonal panels, speed lines, the badge at stake; the Elite Four's later members quicker, the Champion in gold), the Legendary (dark, two tremors, an aura, the name rising), Pub Crawl's portcullis (the gate slams, dust, a burned sign swings to rest; gilt for the last boss) and an ambush's claw slashes. Boss beats are left to the existing return tally (`BossTally`), which already names the phase. Endings over the end screen, once, on a live ending only: Hall of Fame (white-in, starter on a plinth of light, badges dropping in, the numbers counting up, fireworks), survived (coins, trophies dropping onto a shelf), whited out (HP drains, slow fade to white), wiped (candles gutter, the dark closes) and a plain game's toast.
- **Every fight:** a hit holds 70 ms, shakes the play area by how hard it landed and throws shards off the heart; a heal draws green motes into it; an HP ring round the hearts stud (green, amber, red) drains with a pale trail; at 2 hearts or fewer a slow heartbeat at the screen's edge (still when idle or hidden; strength `--beat-strength`). Type clash (League, ambient so the rolling tap passes through; ends when a roll starts). A caught Pokémon sent in ("Go, Vulpix!"). The run's first card: a ball that wobbles and bursts in the starter's colour, or a tarot draw. A badge spins up and flies into the badges chip; an item or gear rises in a tier-coloured pillar and flies into the bag; a caught ball flies into the bag. The trinket news banner gave way to the loot moment (jinx, faint and hatch banners stay).
- **Rarity and the plain modes:** foil on boss frames (gold: Legendary, Champion, Pub Crawl's last boss; silver: other bosses and a Standard deck's last card), masked to the frame, following a dragged finger, sweeping by itself; a foiled card's back glints once as it is dealt. Most Likely To's "Count it down" plaque (3, 2, 1, POINT!; the card still taps aside). A lit fuse's spark laps the card's edge at a steady pace (it gives nothing away), BOOM adds a shock ring, debris, a shake and scorch; a countdown's last three seconds tick big over the table; the hold plaque's wax seal breaks and the secret unrolls. Standard's Halfway, Last orders and Last card ribbons, Infinite's Round N.

**Checks run:** typecheck, lint, `npm test` (434: `tests/moments.test.ts` new, 9 tests), `BASE_PATH=/side-quest/ npm run build` (budgets pass: runtime 3,850 of 4,096 KiB, initial 137.3 KiB gzip), Chromium browser suite without sweeps (see the handoff message for the final count), new `tests/browser/moments.spec.ts` (one @release smoke: the starter's ball plays on a live flip, a tap skips it without advancing, a reload plays nothing; Most Likely To; the Reduced Motion plaque). Six existing specs were updated for the new behaviour (the evolution and trinket banners became moments: under Reduced Motion they read on `.still-plaque`), and `dice.spec.ts`'s Escape test now waits for the save instead of an absent lazy layer. Every moment and ending was looked at frame by frame in Chromium at 390x844 from the dev stage.

**Update flow:** CI's `test:update` failed on the first push (`1712b60`, not deployed): the ending's lazy chunk was first fetched at the end of a game, so after a mid-game update the old chunk was gone and the missing-chunk reload fired on the end screen. `warmMoments` now fetches the ending with the views when a game starts; `npm run test:update` passes locally.

**Not checked:** WebKit (CI only), a physical iPhone (frame rate, the blur plus canvas cost, `mix-blend-mode` foil, shake comfort, heartbeat strength; `docs/DEVICE_CHECKLIST.md` has the item). Runtime budget headroom is now 246 KiB.

**Risks:** about 80 s of moments in a full League run at Full (all skippable). A boss entrance now holds the table about 2.7 s before its card can be turned. The low-HP heartbeat may nag; one variable softens it.

## Plan 2026-11-01: premium moments (built above) (owner: "Let's make a plan for literally all of these except for sound ... No cheap builds. I want this game to feel premium")

In progress (owner, 2026-11-01: "Everything main. Push ... review and overhaul anything that needs touching up or refactoring, including older animations/effects/moments ... then proceed and build in a logical order"). Eleven display-only moments plus the shared layer they stand on. **No engine, save, card ID or balance change anywhere in this plan**; every trigger is read from state the game already keeps. Sound is out of scope (owner). Build in the four phases below, one phase per push, each played on a phone by the owner before the next starts.

### Bar for "premium" (applies to every moment)

- **Choreographed, not decorated.** Every moment has anticipation, impact and settle beats with named timings and its own easing (no `ease` defaults). Built on transforms and opacity only; WAAPI for one-shot motion, a shared canvas for particles, CSS for loops.
- **One visual language.** Gilt, parchment and the teal frame for the house; the League's pearl, violet and crimson ribbon tones and the 18 type colours (`presentation/pokemon-types.ts`); Pub Crawl's scene colours (`data-scene`). Existing fonts. No emoji, no stock icons, no Pokémon sprites or game art: names, type medallions (`TypeMark`), badge art already in `public/art/badges`, and light.
- **The table is in charge.** Every moment: a tap skips to its end state and never reaches the card underneath; never replays on a resumed game; Reduced Motion gets a still frame that fades (about 600 ms); a hidden tab ends it; `aria-hidden` with its words through `useAnnounce`.
- **Length follows frequency.** Several times a floor: under 1 s. A few times a run: 1.5 to 2.5 s. Once a run: up to 6 s, skippable.
- **Photosensitivity.** No more than three full-screen flashes in any second (WCAG 2.3.1); pulses change scale and glow, not whole-screen luminance.
- **Performance.** 60 fps target on an iPhone 12-class device; one particle canvas, DPR capped at 2, a hard particle cap; `backdrop-filter` on at most one layer at a time; nothing animates under a scrolling rules panel.

### Review of the effects already shipped (folded into Phase 0)

Read on `cea47aa`. What needs touching up:

- **R1. Seven bespoke "live once" implementations.** `NaturalBurst`, `BallThrowStage`, `useBossReturn`, `EvolutionBanner`, `PartyNewsBanner`, `PartyPulse` and `TimerBlast` each keep their own seen-ref, timer backstop and quiet check; six call sites read `matchMedia("(prefers-reduced-motion…)")` directly (`Play.tsx` twice for `STAMP_MS`, `StageBanner.tsx`, `BallThrow.tsx`, `GameDialogs.tsx`, `FullScreenDice.tsx`). One `stillMotion()` helper in `presentation/motion.ts` (honouring the dev `forceMotion`) and one `useLiveKey` hook replace them.
- **R2. Nothing coordinates overlays.** A natural 20 on a felling swing plays the burst, the stamp and then the spoils; an evolution can land on a stage banner; the ball throw, the natural burst and the evolution all sit on `--z-blast`. The director orders them and gives each layer its own `--z-*` token.
- **R3. Evolution morph flickers at about 10 Hz.** Its last hard cuts are 45 to 60 ms apart (white glyph on dark), past the three-flashes-a-second line. Rebuilt as item 1 with scale-and-glow pulses that never exceed 3 Hz, and a tap that skips on pointer down like every other moment.
- **R4. Every-mode moment CSS lives in `crawl.css`.** The natural burst, ball throw and evolution styles (about 900 of its 3,160 lines) move to a new `presentation/moments.css`, so `crawl.css` holds the crawl's furniture only.
- **R5. `PartyPulse` is a full-screen flush on every heart change.** Becomes the edge vignette and HP ring of item 4; the floating −N/+N on the stud stays.
- **R6. `TimerBlast`** (a word on a flash) is rebuilt as item 10. **The stage banner** stays for floors, routes and Victory Road; boss stages get item 2 instead.

Kept as they are (they work and the owner approved them): the donut ball throw's reel and timing, the natural 20/1 visuals, the stamp, the boss-return tally, the scene lights.

### Phase 0: the moments layer (foundation, size M)

What `BallThrow.tsx`, `Flourish.tsx` and the banners each reimplement today, done once:

- `src/presentation/moments.ts` (pure, unit-tested): `momentsBetween(before, after)` turns a session change into moment descriptors (`{ kind, key, priority, data }`): evolution, boss entrance, badge, loot, hit, heal, clash, omen reveal, milestone, ending. Keys use the same once-only rule the banners use (stage, `discarded`, hits, beat), so a resume yields nothing.
- `src/components/moments/Director.tsx`: one queue in `main.tsx`. One full-screen moment at a time, in priority order (ending > evolution > boss entrance > omen reveal > natural > ball throw > clash > badge > loot); ambient ones (HP drain, heal motes, card foil) run beside it. Drops stale entries when the card moves on. `NaturalBurst` and `BallThrowStage` move under it so nothing can overlap.
- `MomentStage`: the portal, dim and blur, skip on pointer down (stopPropagation as `BallThrowStage` does), the timer backstop, visibility cancel, the Reduced Motion still.
- `Particles`: one lazily created full-viewport 2D canvas with presets (confetti, sparks, embers, coins, motes, debris, fireworks), driven by one rAF that stops when empty. About 4 KB; no library.
- `flyTo(fromRect, toSelector)`: a curved arc into a strip chip (bag, badges, hearts stud) with a landing pulse on the chip.
- **Lazy chunk** for everything above except the trigger logic, warmed when a game starts (as the dice are); `check-budget.ts` must still pass (each lazy chunk at most 200 KiB gzip, runtime at most 4 MiB). Measure, don't guess.
- **Workshop stage** `?workshop=1&moments`: a button per moment and variant, fed by fixture sessions, with a slow-motion (0.25x) toggle and a frame-step. This is how each moment is reviewed and screenshotted; it never ships.
- **Setting:** "Big moments: Full / Quick" in the pause menu, stored in `Preferences` (not the session; no migration). Quick halves every once-a-run moment and drops the clash to its chip pulse.
- Tests: units for `momentsBetween` (fires on a live change, not on resume, not twice for a re-dealt boss); a Playwright @release smoke (`withMotion`) that a moment appears, a tap skips it without advancing the card, and a reload shows none.

### Phase 1: the once-a-run moments (biggest payoff)

**1. Evolution and level up (size L).** Replaces `EvolutionBanner`'s render; its trigger (`party.form` rising) stays.
- League, about 5 s: table dims to near-black with a radial glow in the old form's dice palette (`form.palette`); the old name sits on a light-plate that breathes, then pulses faster (scale and glow, never full-screen strobe) while white light threads in from the edges; at 3.2 s the plate collapses to a point, one bloom, and the new name slams in on the new palette with its type medallion turning in and a ring of type-coloured particles; the stat change ("Max HP 15 → 17") writes on underneath; settle and fade. "What? X is evolving!" kicker. Branching Eevee plays after the sheet's choice.
- Pub Crawl level up, about 3.5 s: a forge variant: the class name heats from iron to white on an anvil plate, sparks on each of three strikes, the new level stamps in gold.
- Announcer text unchanged.

**2. Boss entrance (size L).** Replaces `StageBanner` for boss stages only (floors and routes keep the banner). Plays while the boss is dealt face down, once per boss (never for a later swing or a replaced Champion), then the table taps to flip as usual. No controller change.
- League gyms, rival, hideout boss, Elite Four, Champion, about 2.4 s: two diagonal panels shear in from opposite corners with speed lines. Left: the starter's current form, its type medallion and Team HP. Right: the opponent's title, type, kicker ("Gym 6", "Elite Four 3 of 4", "Champion") and, for gyms, the badge at stake (from `public/art/badges`). "VS" drops between them with a shake and a spark ring, holds, then the panels shear out. Elite Four members after the first get a 1.4 s version; the Champion gets the gold version with a longer hold.
- Legendary, about 3 s, not a VS: the table goes still and dark, the ground shakes twice, an aura in the Legendary's type colour rises behind its name as it lifts out of the dark.
- Pub Crawl floor bosses and the final boss, about 2.4 s: an iron portcullis slams down from the top, dust bursts along its foot, the boss's name is burned onto a hanging sign in the floor's scene colour, the portcullis lifts on the card.
- Ambush (elite with `hits: 2`), about 1 s: a red claw slash across the screen and "AMBUSH!".
- **Boss beats** (`phases`; gym aces): when `party.beat` advances, a 1.2 s slide-in: "Clair sends out her ace!" or the beat's title, under the boss's ribbon colour.

**3. Endings (size XL).** A layer over `Completion.tsx` that plays only when `celebrate` is true (a live ending, never a resumed one). The controller's `complete` motion and its `finish` call stay exactly as they are. The sequence runs on top, a tap jumps to the final state, and the buttons are live from 1.5 s.
- **League Hall of Fame, about 6 s:** fade from white; the starter's final form rises on a plinth of light with its type; caught teammates slide in beside it; the eight badges drop into the case one at a time (badge art, a glint on each); the run's numbers count up (draws, Team HP left, badges, catches, bosses beaten, all from `questRecord`); fireworks on the canvas; "Hall of Fame" stamps in and the record panel settles below.
- **Pub Crawl survived, about 5 s:** a coin shower pours in; `TrophyWall` items drop onto the shelf one by one with a thud and dust; "Last call, survived." writes in gilt.
- **League whited out, about 4 s:** the HP ring drains its last, the screen whites out slowly, "You whited out!" types on, then the record.
- **Pub Crawl wiped, about 4 s:** the candles gutter one by one, darkness closes to a vignette, the crack lines from the natural 1 spread slowly, "Party wiped." settles.
- **Plain games:** two tankards clink in the centre with a foam splash (particles), then "To good company."

### Phase 2: the moments of every fight

**4. Damage and healing (size M).** Upgrades `PartyPulse` and the hearts stud.
- A hit: 70 ms hold, then a shake of the play area scaled by damage (2 to 6 px, 260 ms, capped), a red edge vignette, and on the stud each lost heart cracks and drops shards.
- **The HP ring:** a thin ring around the hearts stud (green, amber, red by share left; Pub Crawl in its gilt-to-crimson ramp) that drains in a chunk with a pale trailing segment catching up 400 ms later, as fighting games do. Display only; the number in the stud stays the source of truth.
- Heal: green motes rise from the bottom edge into the stud; the ring refills with a bright leading edge.
- Low HP (2 hearts or fewer): a slow 1 Hz heartbeat in the edge vignette at low strength, stopping on heal, on idle (`IDLE_MS`) and when hidden. Owner to judge on device; one CSS variable sets the strength (lesson from the Blood Moon omen: nothing that nags).

**5. Type clash (size M), League.** On the reveal of a strike or a dice fight with a matchup (`cardMatchup`), about 0.9 s: the two type medallions fly in from the sides and meet over the card. Edge: yours shatters theirs, "Super effective!" punches in green. Disadvantage: the reverse, in red. Even: they clink, sparks, no words, 0.5 s. Ends by flying the result into the strip's edge chip, which pulses. **Send-in** (`sendIn`): "Go, Vulpix!": a donut ball (reused from `BallThrow`) arcs onto the card and opens in the Pokémon's type colour, 1 s.

**6. Run opening (size M).** Once a game, on the flip of the omen card.
- League: one ball rolls in, wobbles three times and bursts open in the starter's type colour, light spills out, and the card flips up in that light. About 2.5 s. One ball, not three, so it never looks like a choice the table didn't make.
- Pub Crawl: tarot draw: the card lifts from a fanned spread, turns over once with a gilt edge glint and candle flare, and lands as the omen. About 2 s.

**7. Badges and loot (size M).**
- Badge: on the put-aside of a beaten gym (badges earned rises): the badge art pops from the card, spins on its axis with an edge highlight and a glint sweep, "Earned the Cascade Badge!", then arcs into the strip's badges chip, which pulses and ticks. 1.8 s.
- Loot: when an item, trinket or gear lands (bag or boons grow): the item's mark bursts from a light pillar coloured by tier (boss trinket and gear gold, elite violet, items bronze), turns once, and arcs into the bag chip. 1.2 s. This replaces `PartyNewsBanner` for trinkets only; jinx, fainted and passed-drink banners stay.
- Catch: after "Gotcha!", the Pokémon's type medallion arcs from the ball into the bag chip.

### Phase 3: rarity, and the plain modes

**8. Foil cards (size M).** Derived at runtime, no content field: gold foil for the Champion, Legendaries and Pub Crawl's last boss; silver for gyms, the Elite Four, the rival and floor bosses. A layer masked to the frame border (never over the rules text): a rainbow-and-noise sheen in `color-dodge`, an idle sweep every few seconds, and touch-drag moves the light (reads pointer position only; the 8 px drag-cancel rule is untouched). The card's back glints once when such a card is dealt face down, as a teaser. Previous Card shows the same foil; the 2:3 frame and the art are unchanged. One small noise texture (under 30 KB). No gyroscope (iOS asks permission). Pauses when idle or hidden.

**9. Most Likely To countdown (size S).** A "Count it down" plaque on `likely.*` cards (the card still taps through as now; no blocking): full-screen 3, 2, 1, each slamming with a shock ring, then "POINT!" with radial lines. 2.6 s, readable from across the table.

**10. Secrets and fuses (size M).** Upgrades `CardActions.tsx` and `TimerBlast`.
- Fuse: a spark crawls around the card's border with smoke wisps and random sputters, at a constant pace that reveals nothing about the time left (the fuse's suspense stays). BOOM: one white flash, a shock ring, debris on the canvas, a hard shake, and scorch on the card's edges that fades over 2 s.
- Countdown: the last three seconds are huge numbers behind the card with a ticking ring; TIME slams in like a buzzer.
- Secret: holding breaks a wax seal (two halves part, 220 ms) and the text unrolls; on release the seal closes again. Never slower to read than now.

**11. Milestones in Standard and Infinite (size S).** Standard: "Halfway" ribbon at card 25, "Last orders" at 10 left, and the last card dealt with a silver foil and a bell glint. Infinite: a "Round N" banner every 50. Ribbon style shared with `StageBanner`.

### Order, cost and risk

| Phase | Contents | Size |
| --- | --- | --- |
| 0 | Moments layer, director, particles, flyTo, workshop stage, setting, tests | M |
| 1 | Evolution, boss entrance and beats, endings | L, L, XL |
| 2 | Damage/heal and HP ring, type clash and send-in, run opening, badges and loot | M each |
| 3 | Foil, Most Likely countdown, secrets and fuses, milestones | M, S, M, S |

- **Time added to a League run** (estimate, Full setting): about 13 boss entrances (~30 s), 2 evolutions (~10 s), 8 badges (~15 s), ~20 clashes (~18 s), opening and ending (~9 s): about 80 s over a 1.5 to 2 h run, all skippable. Quick halves it.
- **Device-only unknowns:** frame rate of blur plus canvas on older iPhones, `mix-blend-mode` foil in WebKit, shake comfort, heartbeat strength. Each phase adds its rows to `docs/DEVICE_CHECKLIST.md`; nothing is called done on emulation alone.
- **Collisions:** the director is the only defence against a boss entrance, a stage banner, a natural and a badge landing in the same second; its ordering gets unit tests.
- **Per phase checks:** typecheck, lint, `npm test`, build with budgets, `test:release` Chromium (WebKit in CI), the crawl, quest and secrets specs with motion on, workshop screenshots of every moment for the owner.

## Pushed 2026-11-01: Great and Ultra Balls (owner: "add great balls and ultra balls ... +1 and +3 ... What's the best number here? Also change the color of the pokeball spinning")

**CI follow-up (owner: "Do your recommendations"), resolved 2026-11-01 13:23 UTC: the site is live.** `main` failed CI twice (runs #273 and #274) for two different reasons, and the pipeline only deploys when every job passes. (1) The League balance job: Charmander 12/120 = 10.0% against the `> 0.1` floor (real rate about 17%, 3,000 runs each: `main` before 17.5%, Master Ball 16.1%, Great/Ultra 16.7%). Fixed in `c3852b0`: `tests/league.balance.test.ts` reads each starter's rate over 300 runs, the 120 kept plus 180 only counted and dropped (`LEAGUE_EXTRA`), memory unchanged; about 4.5 min in CI. Treecko (11%) is the next starter near the floor. (2) The WebKit `@release` layout test (`layout.spec.ts:308`, "card ends above the fold at 375x548 (stage 324x482, .app 664px, inner 375x548)") failed on #273 and #274 with identical numbers, which first looked deterministic. **It is an intermittent test race, not a bug in the game:** a bisect in CI (throwaway branches at the Master Ball and Great/Ultra commits) passed WebKit on both, and re-running only the failed jobs of #274 on the same `dist` build passed WebKit and deployed. The race is the one #250 described: `resizeTo` waits for a `100svh` probe and for the card's box to hold still across two frames, but WebKit can hold the old 664px layout for both, so the stage is read at its pre-resize size (the same stale numbers every time it hits). It failed 2 of the last 3 `main` runs, so it will recur. **Next:** harden that wait (for example, wait until `.card-stage`'s bottom fits the new viewport, never loosen the assertion) and re-run the release suite with `repeat_each`. Never skip the test. Two throwaway branches, `bisect/master-ball` and `bisect/great-ultra`, remain on GitHub (deleting them from this container failed with a dropped connection); delete them from the GitHub branches page.

Pushed straight to `main` on the owner's word with the Master Ball commit below. **CI failed on it twice, so it deployed only after the follow-up below** (owner chose "push as-is"): `tests/league.balance.test.ts` gives Charmander 12/120 = 10.0% against its `> 0.1` floor. Its real rate is about 17% (3,000 runs each: `main` before 17.5%, with the Master Ball 16.1%, with Great/Ultra 16.7%), so it is the fixed 120-run sample landing two standard errors low, not a balance change. **Next:** the owner picks how to make the per-starter check robust (300 runs a starter, or a noise-aware floor); until then `main` is red and the site stays on the last deploy.
- Numbers (owner asked for the best): **Great Ball +3, Ultra Ball +6** to the d20 throw (`BALL_BONUS`, `ballNeed` in `engine.ts`, never below 2). On a hard catch (needs 15) that is 30% to 45% and 60%, the games' 1.5x and 2x; catch numbers in the League run 4 to 17.
- With any Great, Ultra or Master Ball in the bag, "Throw a ball" becomes a picker plaque opening "Throw which ball?" (`ExtrasSheet`): Poké, Great, Ultra, Master, each with the number it needs. The Master Ball's own plaque is gone. `throwWith(s, ball)`; `party.throw.ball` (`"great" | "ultra"`, rejected beside `master`).
- Colours: Great blue with red patches, Ultra black with yellow bars, Master purple (`crawl.css`, `card-front.css`, `ball-<kind>` classes); icons `art/league/{great,ultra}-ball.svg`.
- Four new route items (cards 1,849 to 1,853): Free Sample (Route 2) and Ball in the Grass (Route 3) give a Great Ball; Ranger's Spare (Route 5) and Ultra Ball (Route 7) an Ultra Ball.
- Checks: `npm test` 420, typecheck, lint, `cards:review`, build (budgets pass), fixture `2026-11-01-league-great-ball-thrown`, Chromium screenshots of the picker and both throws. Not run: browser suites after the picker change, WebKit, device.

## Pushed 2026-11-01: Master Ball, Togepi egg, Legendaries join the team (owner: "add a master ball item that is an instant catch ... makes the pokeball spin animation for catching purple, and always rolls 20 ... yes to togepi ... I'd prefer to 'add more' to the game")

Pushed to `main` with the Great and Ultra Balls above (see the CI note there). League only; all new state optional, so older saves load and play on.
- **Master Ball** (`LOOT` `master`): a bag item. At any catch (a beaten wild Pokémon or a catch card's offer) a third plaque, "Master Ball · always catches", appears beside the ball when one is in the bag (`canThrowMaster`/`throwMaster`, `controller.master()`); it is spent and lands a 20 (`party.throw.master`, `persistence.ts` rejects a master throw that is not 20). It is a choice, not automatic, so it is not wasted on a Caterpie. The throw plays purple with pink bumps and violet confetti (`BallThrow.tsx`, `crawl.css`); the card shows a purple 20 and "Master Ball" (`card-front.css`). Never a bag Use. Sources: **Silph Gift** (Route 6 item, was an X Attack; in the games the Silph president gives it) and every win of **Silph Co. Maze** (Route 6 hazard, which named the Master Ball and gave nothing). Icon `public/art/league/master-ball.svg` (and `art/crawl/master.svg`, never dealt in Pub Crawl).
- **Mystery Egg**: a won roll hatches a **Togepi** (Fairy, +2 send-in) onto the team; it no longer gives an X Attack, and the loss is now a Voltorb (it said Togepi on the loss before). `CardDefinition.joins` (`{ name?, type?, rate }`): a won battle, or a boss's fall, adds the card to `party.team`; `teamMember` (engine) reads it as the Pokémon it brings, used by `partyTeam`, `canSendIn`, `rollBonus`, save checks and the fainted banner. The card's foot shows `+` and the type medallion; a "Hatched"/"Caught" banner says it joined.
- **Legendaries**: the 8 whose last beat throws a ball and says caught (Zapdos, Ho-Oh, Palkia, Xerneas, Eternatus, Mew, Arceus, Miraidon; `team.ts`) join the team when felled, at +5 (`LEGENDARY_RATE` 20). A full team lets the oldest go, as a catch does. Mew's doubles line now says it hops into the ball (it said it let you go).
- Bots: the balance bot throws the Master Ball at a catch of 10+ the team wants; `table-play.ts` half the time.

**Checks run:** typecheck, lint, `npm test` (417, 6 new in `team.test.ts`), `npm run cards:review`, `BASE_PATH=/side-quest/ npm run build` (budgets pass; an aria label first tripped the card-text-in-initial-chunk check by matching the "Pokémon Master" card, reworded), League balance (4/4, run with `NODE_OPTIONS=--max-old-space-size=8192`: in this container the file runs out of heap at the default size on unchanged `main` too), Chromium `quest.spec.ts` + `crawl.spec.ts` (49) and `@release` (13), four new fixtures `2026-11-01-league-*`, screenshots of the plaque, purple throw, card result and egg seal (throwaway spec, removed). **Not run:** Pub Crawl balance (no crawl card or rule changed), WebKit, device, fit sweeps.
## In progress 2026-11-01: undo, stamps on every boss, boss returns, League evolution (owner: "Let's do the top 5 easy fixes ... felled stamp on league ... stamp the whole card text area ... card to card continuity ... animated evolution sprite")

Uncommitted, not pushed. Display and controller only: no engine rule, odds, card, save field or migration changed, so no new save fixture.

- **Undo** (`PresentationController.undo`, `undoable` on the snapshot): one level, memory only (a reload forgets it). It returns to the state before the last decision (a card put aside, Won/Lost, an offer, an item, a drop, a send-in, a catch). Turning the next card over keeps it, so the card just put aside can still be taken back. A dice roll or a ball throw (`roll`, `throw`, a catch offer that throws) clears it: undo never buys a second roll; undoing a rolled card's put-aside returns the same roll. "Undo last move" in the pause menu and on the end screen (a mis-tapped Lost that wiped the party). `NaturalBurst` remembers every natural shown, so an undo back onto one doesn't replay it.
- **Stamps** (`FelledStamp`, `crawl.css`): the stamp now covers the card's whole text area (from under the title to above the seals, rotated 5°, double-ruled, irregular worn ink). The League stamps too (`crawlTheme("pokemon").flourish`: "Badge won" on a gym leader, "Defeated" on any other boss; `scene` is optional, the League lights no scenes). New: a felling **Won** on a plaque beat stamps as well (`fellingVerdict` in `engine.ts`, read-only): the Won/Lost plaques leave, the stamp lands, and after `STAMP_MS` the win is settled (or its trinket asked for; closing that sheet lifts the stamp). Measured: 80 of 160 League bosses and 24 of 43 Pub Crawl bosses end on a plaque beat, so before this half of all bosses never showed a stamp.
- **Boss returns** (`useBossReturn`, `BossTally` in `Flourish.tsx`): a boss or ambush dealt again after a landed hit jolts as it turns face up (`.card-stage.boss-return`, 560 ms) and shows a tally across the top of the text area for 1.8 s: "Phase N" (a phased boss) or "Round N", one pip per hit with the landed ones struck through and the newest breaking, "One more to go" / "N more to go". Live only, never on a resumed game or an undo back onto it. Reduced Motion: the tally fades, nothing moves.
- **League evolution** (`EvolutionMorph` in `StageBanner.tsx`): before the evolution banner, 3 s over a dark stage: the old form's type glyph glowing white, swapping (hard cuts, faster and faster) with the new form's larger glyph and the two names, a white flash at 2 s, then the new form's coloured medallion and its name in gold; then the banner. A tap skips to the banner; Reduced Motion or a hidden tab shows the banner alone. The app ships no Pokémon art, so the type glyph stands in for a sprite. An evolution closes any open dialog (`main.tsx`), since a Rare Candy is used from the bag and a native `<dialog>` sits above any overlay. Pub Crawl level-ups keep the banner only.
- **CI**: the balance jobs check the diff first (`pages.yml`, step "Did cards or rules change?") and run only when `src/content/`, `src/game/`, `src/app/persistence.ts`, the balance tests, `tests/bot.ts`, the lockfile, the Vite/Vitest config or `pages.yml` changed; a dispatch, a new branch or an unreadable base always runs them, and a skipped job still passes so deploys aren't held. Not yet seen running in CI.
- **Docs**: the stale device-checklist items (Tera Orb, knacks, two-path landings) are rewritten around the current systems, and a new item covers this work; the two finished "In progress" sections below are marked Shipped.

**Checks run:** typecheck, lint, `npm test` (411: 4 new undo tests in `tests/presentation.test.ts`, the League flourish test in `tests/crawl-theme.test.ts` updated from "no flourishes"), `BASE_PATH=/side-quest/ npm run build` (budgets pass). Chromium screenshots from a throwaway spec (removed) of: the Pub Crawl and League dice stamps, a League plaque Won stamp, the Landlord's return tally, six frames of a Froakie evolution, and the pause menu's Undo taking back a won gym. Browser suites: see the handoff message for this change. **Not checked:** WebKit, a physical iPhone (`docs/DEVICE_CHECKLIST.md`), and the CI path filter in a real run.

**Risks:** undo lets a table take back a Lost (deliberately; the roll itself can't be redone). The plaque-win stamp adds about 1.1 s before a felling Won settles. Full-screen `filter: drop-shadow` on the evolution and `mix-blend-mode` on the stamp may cost frames on older iPhones.

## Shipped 2026-11-01: natural 20 and 1 burst in every mode (owner: "make that happen all the time ... nat 1 ... an equivalent screen effect, but obviously bad")

Pushed to `main` on the owner's "Merge" (revert that one commit to undo). Display only; no engine, save or card change. `NaturalBurst` (`components/Flourish.tsx`) now renders for every game (Standard, Infinite, League, Pub Crawl), not only crawls: any single-d20 card whose roll is a natural (`natural()` in `engine.ts`, so omen-widened ranges count) fires it once, never on a resumed game. It no longer takes the theme; the kicker is always "Natural" and `flourish.naturals` is gone from `CrawlTheme`. The natural 1 was rebuilt as the 20's dark twin (1.6 s, `crawl.css`): the 1 drops in and lands, the screen jolts red and shakes, glowing cracks (an inline SVG of 11 paths, drawn by `stroke-dashoffset`) run out to the edges, the dark closes in from the edges, and the 1 splits along a jagged break into two clipped halves that sag apart. Every piece ends on a readable still, since Reduced Motion jumps child animations to their end. The 20 is unchanged.

**Checks run:** typecheck, lint, `npm test` (407 pass), `BASE_PATH=/side-quest/ npm run build` (budgets pass), `test:release` Chromium 13/13 (WebKit not installed here; CI-only). Frames checked in Chromium screenshots of a throwaway harness (removed). **Not checked:** WebKit/iPhone rendering of the SVG cracks and `clip-path` halves, and frame rate on a phone (`docs/DEVICE_CHECKLIST.md`).

## Shipped 2026-11-01: one bag for gear, items and Pokémon (owner: "Can we just adopt the pokemon bag UI and function? It holds both pokemon and items")

On `main` as `3b37ded` (#65). The bag dialog (`CrawlRecord` part `satchel`) now has up to three sections in the same `BagRow` panels: Team (League), Gear (weapon, armor, trinkets; name, slot label, what it does now; no Use or drop, since gear is only replaced at a boss's spoils) and Items. Headings show whenever more than one kind is present. The party dialog keeps only tonight's omen. The strip's bag chip shows gear marks too and is "empty" only with no items, team or gear. Display only: no save, engine or card change. **Checks:** `npm test` (407), typecheck, lint, build (budgets pass), Chromium `crawl.spec.ts` + `quest.spec.ts` (49 passed; the trinket test now reads the gear from the bag). Not run: screenshots of the new section, WebKit, device. **Open:** gear cannot be dropped (matches the old party panel); say if you want that.

## Shipped 2026-10-31: Pub Crawl polish and card clarity (owner: "pub crawl has taken the backseat ... animations or polish ... make this mode feel premium and unique ... I don't want to add more systems ... make sure cards are logical and not confusing")

Pushed to `main` on the owner's "Commit and push to main" (rebased onto `49ffb74`, revert that one commit to undo). No engine state, save field, odds, damage or card ID changed.

**Polish (display only, Pub Crawl only; the League's theme has no `flourish`, so it is untouched):**
- **Each place has its own light.** `crawlScene` (`components/crawlTheme.ts`) names the stage in play and `Atmosphere` sets `data-scene`; `theme.css` recolours the existing glow, embers and motes through CSS variables (no new looping elements): burgundy Wine Cellar, amber Brewery with bubbles, pale-green Catacombs, green Sewers with bubbles, falling snow in the Freezer (the dust drift played backwards), teal drowned Taproom with bubbles, hot fast sparks in the Kitchen, twinkling stars over the Rooftop, red Last Call, neon violet for the Quarter-Zips (queue, stairs, closing time), violet and gold for the hidden rooms, a dim warm landing. The light fades in over 1.8 s when the stage changes. The adventurer and omen keep the plain table. Reduced Motion still hides the backdrop; idle and hidden-tab pausing are unchanged.
- **Natural 20 and natural 1** (`NaturalBurst`, `components/Flourish.tsx`): when a d20 lands on a natural while the table watches, a 1.4 s flash over everything: gold rays and a slammed 20, or a dark red table and a cracked, shaking 1. Never on a resumed game that already showed the result; `aria-hidden` (the card's result already says "Natural 20!"). Reduced Motion keeps the fade, nothing moves.
- **Felled stamp** (`FelledStamp`, `fellingSwing` in `engine.ts`, a read-only helper): a boss's felling roll slams a red rubber stamp across the card face; it is read once through the announcer. The spoils sheet now waits 1.1 s on that swing (`STAMP_MS` in `Play.tsx`) so the stamp is seen; immediate under Reduced Motion. Dice bosses only (a Won/Lost beat puts the card aside on Won).

**Card read (all 575 Pub Crawl cards, beats, jinxes, offers):** about 45 text edits, `dungeon/*.ts`:
- Same card twice on one floor, replaced: Catacombs Epitaph/Epitaphs (now Play Dead), Freezer Cold Take/Cold Takes (Snowball Fight), Hot Chocolate/Hot Cocoa (Pins and Needles), Kitchen Yes, Chef ×2 (moment is now 86'd), Staff Meal ×2 (Bread Basket), three repeat-the-order cards (The Order is now The Specials; Order Up is a delayed slap), Taproom three sea shanties (Bottoms Up or Hold, The Fish Tale), Message in a Bottle ×2 (SOS), two dry booths (Land Ho), Brewery Quality Control ×2 (Inspection) and Name That Brand/Name a Beer (Glasses Down), Sewers The Echo/The Echo Bat (Spell the Sewer), Rooftop's two pigeon coo-offs (Group Selfie), Wine Cellar titles Vintage and Swirl and Sniff (Best Year, The Snob Stare). A unit test now fails if a title repeats on a floor.
- Jinx clashes: the Freezer had three chattering-teeth rules (Hal is now Not Even Cold, Absolute Zero counts down before sips), a jinx and a trial both named Frozen Solid (Ice Pack), Brain Freeze jinx vs card (Freezer Burn); the Kitchen's Behind! jinx duplicated The Swinging Door (now Hands!, a reflex); Pipe Down said "only the drawer may talk", which changes every card (now nobody talks to them); Artisanal's "misses a chance the table spots" could not be judged. "Forget: drink 1" → "Forgets" in nine jinxes.
- Unclear or wrong: The Bottling Line (why would anyone laugh? now balance a bottle), The Lich's Accountant read "intern", Skeleton Mariachi (who dances?), Ghost of Closings Past's "every bar the table has been to together" (now five bars), Chad's Fake ID ("do 10 seconds of Canadian"), the Last Table beat (sit on what?), Tap Mimic never mentioned the mimic, Brad's Birthday omen named the Quarter-Zips before the table meets them, Mimic Fridge lacked "Cash out", The Snow Bartender's clumsy line, a grammar fix on Skeleton Barback.

**Omens that nag (owner: "I don't like the blood moon omen and maybe related things. It feels tedious and annoying").** Four omens laid a chore that fired all night: Blood Moon (howl at every monster), The Regulars (shout the drawer's name on every draw), Running a Tab (say "on my tab" whenever handed a drink) and Thin Walls (whisper the whole crawl). Each is now a one-time moment on the card (howl at the moon once, a toast, open the tab, shush once) with no lasting table rule; their numbers (hearts, hurt, heal, items) are unchanged, so balance is unchanged. Kept as they were: Flooded Stairs (once a floor), Karaoke Night and Trivia Night (boss swings only), and the passive ones (Lock-In, Butterfingers, Lefty Night, Name Tags). Saves keep their snapshot, so a run already under Blood Moon keeps howling until it ends.

**Checks run:** `npm test` (403, 3 new: the felling check in `dungeon.test.ts`, every stage after the omen has a scene and no floor repeats a title in `crawl-theme.test.ts`), typecheck, lint, Prettier, `validate-content`, `npm run cards:review`, `BASE_PATH=/side-quest/ npm run build` (budgets pass), Chromium `crawl.spec.ts` + `quest.spec.ts` (49 passed), the Dungeon fit sweeps (6 passed), `@release` (13 passed). The Regulars omen says "Miss it" (its subject is everyone). Looked at Chromium screenshots of all ten scenes, both natural bursts and the stamp (with motion on). Not run: balance (no odds changed), WebKit (not installed here), device.

**Risks / next (owner):** the scene colours are tuned on a desktop screenshot; on an iPhone in a dim room they may want more or less strength (one block of CSS variables in `theme.css`). The 1.1 s hold before a boss's spoils is new friction on purpose. Natural bursts could also go to the League (one line in its theme) if wanted. Play a run on the phone and say which floors feel flat.
## Shipped 2026-10-31: Who's That Pokémon? (owner: "drastically more options ... a group of Pokemon experts has made this card trivial")

On `main` as `1a95b12`. Five fixed 45 s quiz cards became three (Routes 2, 5 and 8) on a 20 s timer, each holding a share of 264 answers (every Gen 1 and 2 Pokémon plus 15 favorites, four banned words each, `src/content/league/whosthat.ts`). `CardDefinition.secretPool` (optional, no migration) is resolved in `currentCard` by hashing the shuffle and card id: stable on reload, different each game, nothing saved. Old saves keep their snapshot cards. Cards 1851 to 1849. **Checks:** `npm test` (403, new `tests/whos-that.test.ts`), lint, typecheck, `cards:review`, build (budgets pass), `league.balance` at 120 runs a starter (4/4; an earlier 6-extra-card version failed Gible at 7.5%). Not run: Playwright, device. **Open:** banned words are unreviewed by a Pokémon expert; the 20 s fit on the card face is unchecked in a browser.

## Shipped 2026-10-31: deterministic browser tests, faster CI (owner: "make Side Quest's test suites much faster and reliable, without losing the coverage that matters")

PR #58, fast-forwarded to `main` on the owner's "Merge to main" (`c26ae20`; revert to `c1b4d58` to undo). Deployed by run #252 in 3 min 26 s, every job green (its `npm ci` steps missed the cache, which is kept per branch; later `main` runs skip them). No app code changed: tests, Playwright config, lint and `pages.yml`.

**Tests.** Every browser spec imports `test` from `tests/browser/support.ts`: `Math.random` seeded from the test title (Node and page), Reduced Motion by default (motion specs opt in with `motion`/`withMotion`), and `seed`/`seedStorage` writing saves before the first load. Lint rejects `Math.random`, `waitForTimeout` and importing `test` from `@playwright/test` in a spec; all 8 sleeps became state waits. `leagueAt`/`crawlAt` live in `tests/browser/sessions.ts`. Retries are 0. Layout: `@release` is 13 smoke tests (the CI gate); `test:e2e` runs everything but `@sweep`; `test:sweep` runs the three every-card fit sweeps (`sweeps.spec.ts`, chunked). See `tests/CLAUDE.md`.

**Root causes found.** The WebKit "Hall of Fame" flake was the test's `playLeague` helper: it never cashed out of the 2026-10-31 rods, so 1 random run in 5 stalled mid-route and seeded an unfinished game (it now cashes out, is seeded, and throws if it cannot finish). The fit sweeps read `data-overflow` before the card measured itself (the baseline Dungeon sweep failed on `main`); they now wait for the settled value. Smaller races fixed: measuring before resize transitions landed, Escape before the dialog opened, reading the title before the front face showed, measuring before the first render. Reduced Motion's settled layout was checked equal to full motion's.

**CI.** `pages.yml`: build, checks (unit + lint) and balance (one job per file) start together; one Chromium and one WebKit @release job (2 workers) in the Playwright image start when `dist` exists; `node_modules` cached on the lockfile; `repeat_each` dispatch input. Concurrency is keyed on the PR number with cancel only for PRs (on 2026-10-31 a `pull_request` run for a PR merged as it started reported `refs/heads/main` and cancelled the main push run). The Playwright image tag must be bumped with `@playwright/test` (a step checks).

**Measured (local Chromium, 4 cores):** full browser suite 12 min 30 s (1 failure) → `test:e2e` 3 min 23 s + `test:sweep` 4 min 24 s (4 workers); `@release` 27 s, 65/65 over 5 repeats; `test:e2e` ×2 on 4 workers 307/308, the one race fixed and rerun 40/40. CI before (run #242): 6 min 52 s push to deploy. CI after (PR run #250, warm cache): 2 min 41 s to the last check, about 3 min with the deploy job; @release 32 s Chromium, 50 s WebKit; the slowest job is now a balance file (about 2.5 min). Release suite 5 times in a row with retries 0 (dispatch #249): Chromium 65/65 (2 min 11 s), WebKit 65/65 (3 min 39 s). CI found three more test races, fixed: a resize measured before `100svh` took the new size (`resizeTo`), a transition WebKit leaves "running", and the first-screen test reaching the app's 4 s fallback on a slow runner (the page clock is now held).

**Open (owner):** path-filter the balance jobs to content/engine changes (not done: needs your sign-off). WebKit is CI-only evidence (not installed here).

## Shipped 2026-10-31: preview site removed (owner: "Merge to main. We can delete preview entirely")

`preview.yml` deleted, the `preview` job and its `next/` artifact cut from `pages.yml`, the `preview` branch deleted on GitHub (it held nothing beyond `main`). Anything still published at `/side-quest/next/` disappears with the next deploy. The `VITE_CHANNEL` code stays, unused. A phone with "SQ Preview" on its Home Screen can delete that icon.

## Shipped 2026-10-31: League card clarity pass (owner, on Mystery Egg: "Some of these cards make no sense ... reword some of the weird ones, and if they're too complicated to explain in a simple way ... just change the rule")

Fast-forwarded to `main` on the owner's word (`f8a242e`; revert to `ae61de2` to undo). Text only: no card IDs, odds, needs, damage or offers changed, so saves and balance are untouched. Read every League card (459 plus the gyms' and bosses' beats) and rewrote about 55 lines where the table could not tell who acts, a line contradicted the mechanic, or the joke buried the rule:
- **Unclear who acts:** Mystery Egg ("It hatches! Name the baby, do its cry, and give 2."), Youngster Joey, Ralts, Lillipup, Haunter and Mimikyu caught lines, Pep Talk, Dream Team, Hidden Machine, Trainer Card, Fisherman Ned, Safari Toss (now one flick into a cup).
- **Contradicted the mechanic:** wins that said "caught" before the ball throw (Gyarados, Zoroark, Mewtwo's and Deoxys's natural 20s on beat one); Lapras and Gift Eevee were "gifts" with a Throw a ball plaque (now "yours if you can catch it"); Nickit ("It's gone. Finish whatever you have"); Volkner ("bore the table with a fun fact", win/beat 2 now plain).
- **Rule changed because it could not be judged:** Sage Li's riddle (no answer on the card) is now a one-foot balance test; Weather Report (Pokémon that change with weather) is Rain Dance (Water types); Olympia's "who yawns first" is "who speaks next"; Ho-Oh's "drink 4, then 8 more" is one number (same totals).
- **Rewording:** the three rods' push-your-luck rule ("Each bite wins a prize: reel in to keep them, or cast again and risk them all"), Rattata, Wurmple, Scyther, Hiker Dave, Agatha, Hassel, Malva, Blue, Leon, Celebi, Xerneas, Veteran Ada, Cave Echo, the Aqua Grunt and a few caught/fled lines.
The 120 plain Pokémon board cards (source-faithful, `reference/`) were not touched. **Checks:** `npm test` (400), lint, typecheck, Prettier, `validate-content`, `npm run cards:review`, `BASE_PATH=/side-quest/ npm run build` (budgets pass). Not run: balance (text only), Playwright, device. **Next (owner):** play a League run and flag any card that still reads wrong.

## Shipped 2026-10-31: the bag rebuilt (owner: "This UI sucks and the tooltip is now inaccurate"; "just show the Pokémon's type and its modifier"; "make it much more elegant")

PR #57, fast-forwarded to `main` on the owner's "merge" (revert to `b070aa2` to undo). The Bag/Satchel dialog's caught-Pokémon row still read the 2026-10-26 rule ("Wins a battle ... Then it's gone.") and the dialog stacked loose boxes. Now (`BagRow` in `Crawl.tsx`, `.bag-*` in `crawl.css`): a Team section (League only, "2 of 2", the rule once: "Send one into a d20 battle its type beats. Lose and it faints.") and an Items section, each one panel with hairline dividers. A row is a mark, a name over one short line, a gold Use when it applies and a quiet x; a Pokémon reads as its name with a gold +N (`assistBonus`) over its type pill. The x asks in place: the row turns into "Release Pidgey?" with Keep and a red verb, and settles back after 4 s. Empty slots are slim "Empty" rows. Accessible names unchanged ("Release Pidgey", "Yes, release Pidgey", "Keep", "Drop Protect"). Checks: `npm test` (400), typecheck, lint, Prettier, build (budgets pass), Chromium `quest.spec.ts` and `crawl.spec.ts` (52 passed), screenshots looked at for a full League bag at 320 and 390 wide (plain and asking) and Pub Crawl's satchel. No WebKit locally, no device.

## Shipped 2026-10-31: the full variety pass, caught Pokémon as a Nuzlocke, roll gems, the big ball throw (owner: "incorporate all the new cards and full revamp into the preview"; "power groups that add X to your roll"; "nuzlocke"; "a gemstone ... for the number you have to beat"; "only 3 buttons"; "make the catch screen ... more exciting")

Merged to `main` on the owner's "Merge and deploy everything to main" (fast-forward to `a5f8e9c`, deployed by run #236, every job green including the WebKit shards; revert to `27ba239` to undo). `preview` is at the same commit.

**Every floor and route.** `src/content/dungeon/variety.ts` rewrites the other eight Pub Crawl floors by card ID (the Cellar was rewritten in place): do-nothing rooms become pointing votes, reflex calls, hidden fuses, secrets on a clock, four-seat dice and auctions; 16 d20 monsters become table duels (Won and Lost); about 50 d20 rooms ask for something before the roll, many with natural 1 and 20 lines of their own; two bosses a floor open with side bets; one new table moment a floor. Every floor now has 11 or 12 kinds of card and passes the mix test's higher bar. The League gets 14 more route cards (Routes 1 and 3 to 8: Who's That Pokémon? quizzes, contests the table judges, votes, a Pokérap round, and the Good Rod and Super Rod, push-your-luck like Route 2's Old Rod). 1,851 cards.

**Caught Pokémon (Nuzlocke, `party.assist`, `party.fainted`).** A caught Pokémon whose type beats the foe can be sent into a single-d20 fight: it adds `assistBonus` to the roll (from its catch number: +1 for a Caterpie on a 5, up to +4 for a Gyarados on a 15; +1 for one caught before catch numbers). Win and it stays on the team; lose and it faints for good (off the team, a "Fainted" banner, the drawer drinks 2). Not on strikes or 2d6/d6 fights. The starter's type edge (advantage rolls) is the only edge; a send-in stacks on it. Plaque: "Go, Pidgey! +1 to the roll"; the strip shows the Pokémon's mark and "+1" while it is in. Fixtures `2026-10-31-league-teammate-assist` and `-fainted` (an earlier same-day fixture of the superseded edge version was never on `main` or `preview` and was regenerated).

**Gems (`rollTarget` in `game/dice.ts`).** Every crawl battle's foot shows a red hexagon gem bottom left (hearts or HP lost) and a blue one bottom right with the roll to beat ("11+", with "2d6" under it when it is not a d20), counting the omen, the starter's form, push-your-luck pulls and a sent-in Pokémon. How to play's seal legend shows it.

**Three plaques at most (`MAX_PLAQUES`, `foldBranches` in `components/extras.ts`).** Eevee's evolution card (three forms beside Press B) shows Evolve and Press B; Evolve opens an "Evolve into" sheet, a row per form with what it changes. A unit test checks every evolution card against every branching starter.

**The ball throw (`components/BallThrow.tsx`).** A live throw dims and blurs the table; the ball spins while a number reel runs, both landing on the committed face after 2.3 s; a catch clicks the button gold with confetti and "Gotcha! Pidgey was caught!", a miss flies the top half off with a red flash and "Oh no! Pidgey broke free!". A tap skips it; Reduced Motion and hidden tabs never play it; a reload never replays it.

**League retune.** The Nuzlocke rule and 16 more route cards made the League harder and diluted its evolution cards (at 400 runs a starter: won 19.8%, 70% evolving once). Retuned and measured at 400 a starter, then at CI settings: Friendship Glow is back, now on Route 7 (evolution cards: Routes 2 and 4 two each, Routes 3, 5, 6, 7 and 8 one each); gyms 7 and 8 need 7 (8 before), the Elite Four 6 (7) and Legendaries 6 (7); Marshtomp and Swampert one HP less. At CI settings (120 a starter): won 22.7%, a won run 69.1 draws, 73% evolve at least once, 48% to the final form, starters 13% (Rowlet) to 35% (Squirtle), Bidoof 4%. Pub Crawl: the Mimic starts a heart lower (it reached 9% of a 10% cap with the duels); every band passes. Open: final-form evolution sits at 48 to 49% of a 50% cap and "evolve once" at 73 to 74% of a 70% floor; the evolution cards move both together, so a guaranteed evolution chance (a one-card stage after a gym) or a wider band (owner) is the real fix.

**Checks run:** `npm test` (400), typecheck, lint, Prettier, `npm run cards:review`, both builds (budgets pass), `npm run test:balance` at CI settings (League every band; Pub Crawl's joke test timed out under load, then passed alone with the Mimic change), the League at 400 runs a starter, and Chromium `crawl.spec.ts` and `quest.spec.ts` on the production build (52: 46 passed first; the six failures were tests of the old behavior, updated and rerun: 6 passed). Local Chromium looks at the preview build: every new card type dealt in a run, the gems (Machop 5+ then 4+ with Pidgey in, Wurmple 5+ 2d6), Eevee's fold and sheet, the ball throw caught and broken free. No WebKit locally (CI runs its smoke suite on `main` dispatches), no device.

## Shipped 2026-10-31: preview site and the variety pass (owner: "double down on what makes the game good, which is variety and interesting fun cards ... especially variety within cards"; then "Set up the preview site, then start steps 1 and 2")

**Preview site (on `main`, `27ba239`).** The `preview` branch publishes at `/side-quest/next/` beside the live game (see AGENTS.md): `preview.yml` checks a push (unit tests, lint, build, balance) and dispatches `pages.yml` on `main`, which builds both and deploys them together. `VITE_CHANNEL=preview` gives it `side-quest-preview.*` storage keys, a red Preview badge and the Home Screen name "SQ Preview"; the live worker's `navigateFallbackDenylist` leaves `next/` alone. Checked locally in Chromium with both builds served together: each page is controlled by its own worker, the right title and badge show, and going back to the live page keeps the live worker. Known wrinkle: the first visit to `next/` from a browser that has the live game shows "Update game" once (the preview worker takes over the page); tapping it reloads. No device look.

**Study.** `VARIETY_STUDY.md` (repo root): audit, research, 20 card formats, themes, order of work. Correction to its section 2: per floor, Pub Crawl's mix of mechanics is already broad (single d20 32 to 36%, 8 to 9 kinds); the sameness is inside the cards (bare pours, setups that ask nothing, natural lines that only double a number).

**Step 1, the mix test (`tests/variety.test.ts`, on `preview`).** Measures every Pub Crawl floor pool and League route pool: kinds of card by field, single-d20 share, "flat" cards (only the drawer acts and every result is a bare pour) and cards where someone else acts. Every pool holds today's worst (5+ kinds, d20 at most 40%, flat at most 35%); a pool in `REWORKED` (the Cellar) holds 10+ kinds, d20 at most 35%, flat at most 5% and others acting in 40%+. Rough text heuristics: a guide, not a judge.

**Step 2, the Cellar sample (on `preview`).** Five do-nothing mishaps became: a pointing vote (Skeleton Barback), a reflex (Possessed Mop), a hidden fuse (Cask Bat), a secret on a 45 s clock (Cobweb Bartender: mime a pickleback) and four seats, four dice (Fryer Oil Ooze, `{first}`..`{fourth}`). Two d20 monsters became table duels (Rats in a Coat: talk past the left neighbor as bouncer; Tab Goblin: thumb war). Five d20 rooms got a setup that asks something and natural 1/20 lines of their own; three bosses open with side bets (thumbs up or down on the drawer, wrong bets drink 1); one new auction moment (`dungeon.cellar-last-glass`, 1,826 cards). The Cellar now measures 11 kinds, d20 31%, flat about 4%, others acting 62% (was 8 kinds, 36%, 18%, 50%). Tests that used Tab Goblin as a d20 monster use Keg Spider; the boss-jinx test now deals its jinx card explicitly (it relied on the seeded shuffle).

**League sample and retune (owner: "Retune").** Route 2 gets Old Rod (the League's first push-your-luck: `press` builder in `journey.ts`, prizes Potion, Protect, X Attack; a natural 1 hooks a Gyarados), Who's That Pokémon? (secret on a 45 s clock) and a Cuteness Contest (the table votes thumbs); Route 2 joins `REWORKED` in the mix test. The League balance bot now plays each starter on its own seeds (`k * 120 + i + 1`): with seeds 1 to 120 shared, all 35 starters met the same 120 shuffles, so one new route card swung final-form evolution from 48% to 63%. On independent seeds the live League missed two bands (55% final form, Treecko 6%), so it was retuned, measured at 400 runs a starter (14,000 runs; `LEAGUE_RUNS=400 LEAGUE_LOG=<file>`), four tries:
- Evolution: Route 6's second evolution card (Friendship Glow) is gone, and It's Evolving Again! moved from Route 7 to Route 8 (a later chance). Evolution cards now: Routes 2 and 4 two each, Routes 3, 5, 6 and 8 one each. Removing Route 4's Sun Stone instead overshot (69% evolved at least once, under the 70% floor).
- Starters: Treecko +2 HP, Drowzee +2 HP and Hypno +1 HP, both +1 to every heal (an evolved form replaces the base perks, so a base-only buff barely moved Drowzee), Torchic and Gible +1 HP (their base forms), Sunkern and Sunflora +1 HP; Bidoof −1 HP (it had crept to the edge of its 8% cap).
- Measured at 400 a starter (before the last Sunkern and Drowzee changes): won 23.5%, a won run 68.9 draws, 74% evolve at least once, 48% reach the final form, starters 14% (Treecko) to 44% (Mudkip), hideouts 22% to 25%, Bidoof 4% (600 runs). 1,828 cards (Friendship Glow retired).
- The CI sample (120 a starter) after the last changes: won 23.5%, a won run 69.0 draws, 74% evolve at least once, 47% to the final form, starters 12% (Treecko, Sunkern) to 38% (Squirtle), Bidoof 4%. At 120 runs each starter carries about ±3 points of noise, so any content change can tip a 12 to 14% starter under its 10% floor; raising `PER_STARTER` would cost CI time (about 25 s per 120). Worth an owner call.

**League checks:** `npm test` (371), lint, typecheck, Prettier, `npm run cards:review`, the League balance at CI settings (every band), the preview build, and Chromium on the preview build: Old Rod, Who's That Pokémon? and the Cuteness Contest dealt on Route 2 of a League run; Old Rod's win shows Cash out and Again (−2 to the roll) with the League's item marks; the secret card shows Hold to read, Start the clock and Skip.

**Checks run:** `npm test` (371), typecheck, lint, Prettier on changed files, `npm run test:balance` with the Cellar changes (Pub Crawl in band; League unchanged), `npm run cards:review`, both builds (`BASE_PATH=/side-quest/` and the preview at `next/`, budgets pass), and Chromium checks of the preview build: each new Cellar card dealt in a Pub Crawl run (fuse and secret plaques show and fit at 390x844; the four dice roll and read "You drink 2; the next three clockwise drink 2, 3 and 2"; the duel shows Won and Lost). No WebKit, no device.

**Next (owner):** open `/side-quest/next/` on the phone, play a Pub Crawl that lands in the Cellar and a League run (Route 2), and say which formats to spread to the other floors and routes.

## In progress 2026-10-31: streamline both crawls (owner: "powers are a bad design for both Pokemon and the pub crawl", "too many systems are getting in the way of good card design", "Make it clean, elegant, and streamline. It's way too much clutter right now")

Branch `streamline-systems`, draft PR; not merged or deployed.

**Why.** Each crawl stacked about 14 systems. Powers were 7 generic effects under 53 names, each duplicating an item; knacks, floor rules and the plaque-fight HP shift were hidden numbers; the Cup, the Quaff, curses and the Tera Orb were bookkeeping beside jinxes, items and the type chart. Cards were being written to feed systems (126 knack tags, 54 three-line knack strikes, 72 path levels with taglines).

**Cut (engine, content, UI, tests):**
- Signature powers, both crawls (`content/powers.ts`, `dungeon/powers.ts`, `league/powers.ts`, `PowerPlaque`, the party dialog's power, "New move" on the banner, the guide rows).
- Pub Crawl: knacks (`dungeon/knacks.ts`, the strip chip and dialog, the party dialog's chips), floor rules (`dungeon/rules.ts`, `QuestStage.rule`, `stageRule`), the Cup and the Quaff (state, strip, banners, end screens), and the two-path levels: each class keeps its original line (path A) of two levels. The 54 knack strikes became one-line `mishap` rooms (their `even` line, nothing at stake; `mishap()` in `dungeon/shared.ts`).
- League: the Tera Orb (Eevee now starts with an X Attack, Zorua and Zoroark with an Escape Rope; the two Marts sell a Potion and an X Attack; the Tera Raid Den card is gone, 1,825 cards), Poisoned and Confused (no `curse` anywhere now), and `verdictShift`: a Won/Lost battle has no type matchup or chip.
- Strip after the cut: the League's type edge (dice battles and strikes), the bag, badges, a jinx. Guide rows: Pub Crawl 6 (was 10), League 8 (was 9).

**Saves.** `retireSystems` in `src/app/persistence.ts` runs before every check: it drops the cut party fields (`curse`, `cup`, `quaff`, `quaffed`, `tera`, `powers`, `armed`, `tired`, `sent`) and stage rules, turns any saved Tera Orb into an X Attack, and collapses a forked adventurer to the path it is on (one not yet levelled keeps path A). Snapshot card fields the engine no longer reads (`power`, `knack`, `curse`) stay and are ignored. Every frozen fixture loads and plays on (57 in `save-fixtures.test.ts`); `tests/fork.test.ts` now checks the fork collapse, `tests/team.test.ts` the rest fields. New fixtures `2026-10-31-crawl-last-level` and `2026-10-31-league-bag-of-two`; the fixture script no longer looks for the cut situations.

**Retune** (without powers: Pub Crawl 17.8%, League 13.0%, measured before the cut):
- Pub Crawl: `PARTY_HEARTS` 11 → 12. Measured: won 25.1%, a won run 50.7 draws; classes 19% (Ranger) to 43% (Paladin); jokes 2% to 8%; every omen, floor and hidden room 15% to 35%; 75% level once, 21% reach the last level.
- League: `TEAM_HP` 15 → 16; `GYM_NEED` gym 6 8 → 7 and gym 8 9 → 8; `LEGENDARY_NEED` 8 → 7, `ELITE_NEED` 9 → 7, `CHAMPION_NEED` 8 → 7; a Champion takes 2 hits (`CHAMPION_HITS` 3 → 2: its "switch" beat cut, the ace kept); a hideout deals 1 grunt of 3 (was 2); Rowlet +1 HP at every form. Measured: won 23.3%, a won run 69.2 draws (it sat at 70 to 71.5 until the hideout and Champion trims: without "win" powers, lost boss swings add draws, and easier odds alone only let longer runs win); starters 13% (Drowzee) to 45% (Mudkip), Bidoof 7%; hideouts 17% to 40%; 76% evolve once, 48% to the final form.

**Checks run:** `npm run typecheck`, `npm run lint`, Prettier on every changed file, `npm test` (350), `npm run test:balance` (both suites, every band), `BASE_PATH=/side-quest/ npm run build` (budgets pass: 3,699 KiB runtime), Chromium Playwright: `crawl.spec.ts` and `quest.spec.ts` (52, after fixing three League assertions for the new HP and the inline send-in), then the full Chromium suite (157: 155 passed, the dice 1280px test passed on retry, and the How to play count was fixed and passed alone with the dice test after a rebuild). No WebKit run locally (not installed here; CI runs it), no device look.

**Not done, risks:** the 54 mishaps read their old even line and cost nothing, so a few floors have more flat "drink 2" rooms; worth a rewrite pass into table moments or d20 rooms. Champions lost their middle duel. The League is easier at the end (Elite Four and Champion at 7). No playtest; the owner may want some cut system back after one (each cut is its own part of the diff). **Next (owner):** play a run of each mode, then merge on your word.

## In progress 2026-10-27: catching is a ball throw (owner: "catching a Pokémon should be harder and more exciting"; "throw a ball, then make the number needed per Pokémon different, with flavor text for caught and not caught")

**Why.** Catching cost one drink and could not fail, and a caught Pokémon is a one-use auto-win on any battle its type beats, so nearly every run carried two (the balance bot ended runs with 1.9 of 2).

**What.** A beaten wild Pokémon, or a route's catch card, is caught by throwing a ball: one d20, and the Pokémon needs `catchRate` or more (`CardDefinition.catchRate`, 2 to 19; a natural 20 always catches, a natural 1 never, `caughtBy`). The plaque reads "Throw a ball · d20 · N+"; the throw is committed when tapped (`throwBall`, or `takeOffer` on a catch card) and saved as `party.throw` (card ID and face) so a reload never throws again. The card then shows the ball, the face, the number it needed, "Caught!" or "It got away." and that Pokémon's own line (`catchLines.caught` / `.fled`, each carrying its Give or Drink); the next tap puts the card aside, and `settleThrow` (top of `discard`) joins the team (a catch card's heal comes only with a catch) or drops the throw. Numbers and 162 lines are in `src/content/league/catches.ts` (81 Pokémon: common and shy ones need 4 to 7, evolved and rare ones 14 to 17; Gyarados 15, Dratini 13, Abra 12, Lapras and the Eevee gift 6 to 7, Snorlax asleep 12). Power, item and send-in plaques are off once the ball is thrown. Cards from a save before the throw have no `catchRate` and are still caught for a drink (`catchIt`), so no save changes; new fixtures `2026-10-27-league-ball-caught` and `-fled`.

**Measured** (`npm run test:balance`, League, needs `NODE_OPTIONS=--max-old-space-size=8000` in this container; the default heap ran out): won 22.2% (25.6% before; band 18% to 40%), a won run 69.7 draws, team at the end 0.8 of 2 (1.9 before), starters 2% (Bidoof) to 41% (Squirtle), hideouts 17% to 31%, 73% evolve once and 49% to the final form. Easier to retune by moving numbers in `catches.ts`: lower them to catch more.

**Checks run:** `npm test` (370), lint, typecheck, Prettier, build and budgets, League balance, and on Chromium `quest.spec.ts` (the catch test now throws; a new test checks all 81 Pokémon's two lines fit the face at 320x568 with no scrolling) and `crawl.spec.ts`. No WebKit, no device look.

**Not done, risks:** the 162 lines are the agent's copy and unread by the owner; Previous Card does not show the throw; the ball wobble is a plain CSS animation, not the 3D dice; the odds are a first guess (the bot's 22.2% says nothing about how a table feels about a 17+ throw).

## Shipped 2026-10-27: one "Use" plaque for a card's optional actions (#52; owner: "drastically overhaul the ui buttons", then "Merge and deploy")

**Why.** The verdict row put Won, Lost, every usable item, the power and each send-in in one equal-width grid, so a fourth plaque clipped "Terastallize" and "Feint Attack / Advantage" on a phone (owner's iPhone screenshot). Most to reach in play: 2 items (Tera Orb, Escape Rope), the power and 2 send-ins beside Won and Lost, so the count can't be tuned with font sizes.

**What.** The card's foot holds at most three plaques (`src/components/extras.ts`, `extrasLayout`). With Won and Lost, one short item stays inline; anything else (a power, a send-in, the Quaff, or two or more actions) opens from one "Use · N ready" plaque (`UsePlaque`) into a sheet (`ExtrasSheet`) with a full-width row each: name and what it does. With no verdict (after a lost roll), one action or two short ones stay inline. `buildExtras` in `Crawl.tsx` describes each action once. Offers, catch, press and spoils rows are unchanged. No engine, save or schema change.

**Behaviour change.** A power, send-in or Quaff beside Won and Lost, or two actions together, now takes one extra tap through "Use". Three existing tests (Quaff reroll, Tera Orb, send-in) now open the sheet; their assertions on what the action does are unchanged.

**Checks run:** `npm test` (362 with `tests/extras.test.ts`), typecheck, lint, Prettier, `BASE_PATH=/side-quest/ npm run build` (budgets pass), and on Chromium `crawl.spec.ts` and `quest.spec.ts` in full (53 passed, then the 3 updated tests and the new 320/390px test passed). The new test (`quest.spec.ts`, "a battle's optional actions never crowd Won and Lost") poses 2 to 5 actions on the Fisherman at both widths.

**Not done, risks:** no WebKit run locally and no physical-device look (`docs/DEVICE_CHECKLIST.md`); 5 actions was the most reachable in the content checked, the sheet has no cap. **Next (owner):** look at a battle with a power, an item and a caught Pokémon on an iPhone and say whether the extra tap is acceptable or the power should stay inline.

## Shipped 2026-10-27: Pokémon UI/UX declutter (#49, squash `6711059`, deployed by run #215; every job green, WebKit shards included)

Merged and deployed on the owner's "proceed with those 3 steps in that order" (Pub Crawl strike rewrite, a review pass on the new copy, merge). Not yet played on a physical device or at a table (`docs/DEVICE_CHECKLIST.md`, `docs/PLAYTEST.md`); the 117 rewritten strike lines (`docs/CARD_REVIEW.md`) are unread by the owner. **Next (owner):** read the strike copy, play one run of each mode, and decide whether the League's remaining systems (powers, Tera Orb, evolution) need cutting after that playtest.

Owner: the League screen is too cluttered, strikes read as two sections (a dice-card setup with a pasted outcome), and "do it the hard way". Keep items (they add variety); cutting systems waits for a playtest.

**Done:** (1) The strip under the header carries only what the table acts on: the type edge or knack (when a fight has one), the bag, the badges, and a curse, jinx, Cup or old Quaff when present. The signature power chip and the floor/route rule chip are gone: the power's plaque is on the card whenever it can be used, and both are listed in the party dialog (the hearts stud). Shared with Pub Crawl. A baseline strip is 3 chips (5 before). (2) League strikes are one line: `strike()` and `gruntStrike()` take no `rules`; each of the three lines (`even`, `advantage`, `disadvantage`, up to 100 characters) is the whole card, `rules` holds the `even` line, and the face prints only the matchup's line (`.card-strike.single`). All 63 League strikes (29 routes, 16 wilds, 18 hideout grunts) were rewritten by hand, keeping each line's Drink/Give number. Pub Crawl's 54 strikes got the same rewrite (2026-10-27, `dungeon/shared.ts` `strike()` no longer takes rules). Old saves load: their snapshots keep the old setup and the face still prints it above the line (it tells them apart by `rules !== strike.even`). A review pass then varied 57 advantage lines that had all become ", so you X".

**Route rules cut (owner, 2026-10-26: "too much"):** the League's eight route rules (`league/rules.ts`, deleted) and their odds effects are gone; Pub Crawl's floor rules stay. The engine keeps `QuestStage.rule`, so saves from before still show theirs in the party dialog (fixture `2026-10-26-league-route-rule` stays; the script no longer looks for it). The League's How to play has nine rows.

**Caught Pokémon are bag items (owner, 2026-10-26: "I absolutely want the bag item version"; use only when super effective on the foe, even if the starter's type is too).** Catching is unchanged (a drink; two held; a third lets the oldest go), but a caught Pokémon is now a one-use item: the strip's bag chip shows its type mark beside the items, the bag dialog lists it, and a gold "Go, Pidgey!" plaque ("wins it") appears only on a typed battle its type beats, including when the starter's does too (a strike the starter already wins offers nothing). Using it wins the battle outright (a boss or ace takes a hit) and spends it. Removed: the team dialog section, the per-gym "tired" state and the edge-only send-in. Saves: `party.team` is unchanged; `party.tired` and `party.sent` are still read from old saves (fixtures stay) but never written, and new fixture `2026-10-27-league-caught-usable` freezes the usable state. A strike won this way reads its Previous Card line for the starter's own matchup (as a Tera Orb does).

**Bag discard (owner, 2026-10-27: "a manual discard ... with a second confirmation, non-intrusive"):** every bag row has a quiet "Drop" (an item) or "Release" (a caught Pokémon) button; one tap turns it in place into "Yes, drop" and "Keep" (no second dialog; it turns back after 4 s), and the second tap calls `dropFromBag` (`BagDrop`, `controller.drop`). It works any time the run is on and leaves the card in play alone. No save change; a legacy `tired` entry is cleaned when its Pokémon is released so the save still validates.

**Not done:** the card face's other two-part layouts (dice cards that carry a power line), and a physical-device look. The 63 new lines are the agent's copy and unread by the owner.

## Shipped 2026-10-26: whole-game fun and variety overhaul (#48, squash `70f54f9`, deployed by run #208; owner: "do the comprehensive big change ... done right. Proceed with best recommendations")

Merged and deployed on the owner's "Merge and deploy". Run #208 went green on its second attempt: WebKit shard 2/3 hung in `playwright install-deps` before any test ran (the job has no timeout), so it was cancelled and re-run once; every other job passed on the first attempt. Not yet played on a physical device or at a table (`docs/DEVICE_CHECKLIST.md`, `docs/PLAYTEST.md`).

**Why** (measured on 400 seeded runs a mode before any change): Pub Crawl dealt about 49% dice rolls (91% of them a single d20) and 3% table moments, and about 44% of its roll outcomes were a bare "Drink N"/"Give N". Every Pub Crawl boss was a d20 dealt again until its hits landed (about 5.6 boss d20s a run), most "flavor, roll d20, lose Drink 4, win Give 5". About 80% of class and starter power fields were passive numbers the table never sees; 16 of 20 omens were numbers. The League was better (17% strikes, 12% moments, gyms with activities) but its Legendaries, Champions, rival and hideout bosses were the same roll every hit. Pub Crawl had two systems for one job (numeric curses beside spoken jinxes) and a generic reroll (the Quaff) beside loaded dice. No playtest has ever been recorded (`docs/PLAYTEST.md`).

**What changed** (the owner's two open questions answered by the agent's recommendation, as asked: cut the overlapping systems, and build before a playtest):

1. **Boss phases** (`CardDefinition.phases`, engine). A boss's later beats: the card's own rules and dice open the fight, each hit landed moves it to the next phase (its own rules, with dice or Won/Lost plaques), and the felling swing always plays the last (`bossBeat`, `atBeat`, read by `currentCard`). `party.beat` keeps the beat just played, so Previous Card shows it and the save checks validate its roll; `settleBattle` takes a spoil when a won plaque beat fells a boss with spoils, and the UI opens the spoils sheet before settling. 109 bosses: in Pub Crawl every floor boss, hidden keeper and closing-time fight has a second beat, Last Call a second and third (`dungeon/phases.ts`; 38 table duels, the rest d20, 2d6 or d6 at the boss's odds); in the League every Legendary's second beat is the catch (coaster tosses, breath holds, a ball roll), every Champion sends out a second Pokémon, then its ace, and the rival and the nine villain bosses have a second act (`league/phases.ts`). Floor bosses take two hits now (`BOSS_HITS`, one before on the first floor).
2. **Signature powers** (`CardDefinition.power`, `Evolution.power`, engine). Every class and starter has one power the table uses when it chooses, once (or twice) until the next boss falls in Pub Crawl, the next gym in the League: `reroll`, `spare` (the loss costs no hearts), `edge` (advantage, or a strike won), `double` (a natural 20's win), `win` (outright, for 1 or 2 hearts), `heal` or `flee`. A level or evolution can bring a better one (`partyPower` falls back down the line, a forked class down its path). State: `party.powers`, `party.armed` (cleared when the card is put aside). UI: a blue `PowerPlaque` among the card's plaques, a power chip on the strip (ready, a count, or spent), the power under the class or starter's rules on its card and in the party dialog, and "New power" (or "New move") on the level-up banner. 18 classes in `dungeon/powers.ts`, 35 starters in `league/powers.ts`; the plaque line is written from the kind by `content/powers.ts`. The joke classes, Bidoof, Magikarp and Togepi get bad ones on purpose.
3. **Floor and route rules** (`QuestStage.rule`, snapshotted on the stage). Each of the nine floors and eight routes has a spoken table rule and one twist to the odds, from its banner until its boss or gym falls (the third floor until closing time): Rat Run, Tasting Notes, Prost!, Echoes, The Smell, Frostbite, Waterlogged, Health Inspection, High Winds; Clear Skies, Tall Grass, Rain, Nightfall, Sandstorm, Hail, Fog, Harsh Sunlight. `omenEffect` stacks the effect; a rule never moves hearts or items. UI: the stage banner names it, the strip shows its mark (the name is in its dialog, as the strip is full on a 320 px phone).
4. **Consolidation.** The Quaff left new Pub Crawl runs (saves keep theirs and its plaque; the Drunken Monk's Liquid Courage keeps its spirit). Pub Crawl's 34 curse cards lay jinxes instead (`dungeon/jinxes.ts`); the League keeps Poisoned and Confused. 13 of 20 omens now lay a table rule beside their numbers (no per-sip chores, per the 2026-10-17 rule), and an omen that is only a table rule is now kept in `party.boons`, so the party dialog shows it (it was dropped before: a bug the browser test caught as a flake).
5. **Content.** 36 Pub Crawl table moments, four a floor (`dungeon/moments.ts`); 97 rooms whose outcomes were bare drinks now make someone do something or aim the drinks (`dungeon/outcomes.ts`), and nine of them, one a floor, roll 2d6 with a doubles result. After: 37% of Pub Crawl roll outcomes are bare (44% before) and 88% of its rolls a single d20 (91%), not counting the boss beats, which are now mostly duels.
6. **The League's own mechanics** (owner, 2026-10-26: "If we should work on the league mechanics, let's do it", the agent's call on what makes it unique). **The team** (`league/team.ts`; engine `awaitingCatch`, `catchIt`, `letGo`, `canSendIn`, `sendIn`; state `party.team`, `party.tired`, `party.sent`): a beaten typed wild Pokémon (a won roll, or a strike the matchup wins; 73 wild fights are `catchable`, never trainers, grunts or bosses) can be caught for a drink, and each route's catch card now adds its Pokémon (`Offer.catch`, the card typed). Two at most; a third lets the oldest go. Before a typed battle, a teammate super effective on the foe can be sent in ("Go, Pidgey!"): that battle has the edge (a strike is won), and the teammate rests until the next gym falls. UI: Catch it / Let it go plaques (a full team names who goes), the gold Go plaque with the teammate's type mark, "Pidgey sent in: advantage" on the strip's edge chip, the team in the team dialog, a "Your team" row in How to play. Pub Crawl has no team: its identity is gear and knacks. **Gym aces**: gyms 5 to 8 take two hits (`GYM_HITS`), the second beat the leader's ace (36, in `league/phases.ts`; a challenge opener gets a rolled ace and a rolled opener a challenge ace). The League's How to play has ten rows.
7. **Tuning.** Pub Crawl: Rage costs 1, Hired Blade 1, Lay on Hands heals 1, the Alchemist's heals once a floor, the Crusader drops its extra heart, `BOSS_NEED` 9/12/13 (9/11/12 before). League: Team HP 15 (17 before; heals and spares reset at every gym, so they compound), the heal moves smaller, Squirtle's and Rookidee's spares once a gym, Mudkip opens on Mud Sport, Bibarel keeps Defense Curl, Gyarados's Hyper Beam costs 1 and comes twice, Grovyle's Leaf Blade and Sceptile's Leaf Storm come twice.

**Measured** (`npm run test:balance`, 4,000 runs a mode): Pub Crawl won 25.5% (22.8% before; a won run 49.8 draws), classes 22% (Mercenary) to 41% (Alchemist), joke classes 2% to 5%, every omen, floor and hidden room in band, 69% level once and 21% twice. League won 25.6% (25.6% before), a won run 69.6 draws (67 before: the gym aces), starters 17% to 44% (Squirtle), Bidoof 3%, hideouts 18% to 34%, 73% evolve once and 49% to the final form; the team ends a run at 1.9 of 2 on average (the bot catches eagerly), so nearly every run fields two teammates.

**Saves.** Every new field is optional and old saves load and play on (51 fixtures). New fixtures `2026-10-26-*`: `league-catch-waiting`, `league-team-caught`, `league-teammate-sent`, `league-gym-ace`, `crawl-power-armed`, `crawl-power-spent`, `crawl-boss-duel-beat`, `crawl-boss-beat-behind`, `crawl-floor-rule-roll`, `league-catch-beat`, `league-champion-ace`, `league-route-rule`, `league-move-spent`. The fixture script no longer looks for `crawl-quaffed` and `crawl-curse-and-cup` (new runs can't reach them); their earlier fixtures stay.

**Harness.** `tests/bot.ts` is how both balance tables use a power (save it for bosses unless low, heal when the whole heal fits, take a free slot when a win fells a boss with spoils). The League balance file ran out of heap with the bigger snapshots; it now keeps finished runs without the deck snapshot, like Pub Crawl's. `scripts/table-play.ts` uses powers and plaque spoils. `npm run cards:review` now lists each boss's beats, each power and each jinx, and a table of the floor and route rules.

**Checks run:** `npm test` (352, including `tests/overhaul.test.ts` and `tests/team.test.ts`), `npm run lint`, `npm run typecheck`, Prettier on every changed file, `BASE_PATH=/side-quest/ npm run build` (budgets: 3,751 KiB runtime of 4 MiB; 129 KiB gzip initial), `npm run test:balance` (both suites, every band), and the full Playwright suite on Chromium (158: 154 passed; then the How to play count and Drowzee's card, which no longer fit with its move line, were fixed and passed alone). Two failures predated this branch (they failed on `main` too, outside the CI release set) and are fixed here on the owner's word ("Fix both"): `game.spec.ts` "two lengths and the quest modes appear" expected 8 packs (there are 6 since 2026-10-24), and `secrets.spec.ts` "a countdown counts" measured the plaques before the card had landed (`evaluateAll` doesn't wait); both spec files pass whole (25). WebKit is not installed in this container; CI runs it.

**Not done, risks:** no device check and no playtest (the new copy, about 300 lines, is the agent's and unread by the owner: `docs/CARD_REVIEW.md`); WebKit not run locally (CI runs it); gyms 1 to 4 and the Elite Four keep one hit; the boss openers' own outcomes ("Drink 4" / "Give 5") were not rewritten; the bot's power policy is a guess at a sensible table. **Next (owner):** read the PR's copy and play one run of each mode, ideally with the `docs/PLAYTEST.md` sheet; then merge and deploy on the owner's word.

## Shipped 2026-10-25: League variety, Pub Crawl strikes and equipment (#47, squash of #42 to #47, `576552a`)

The owner said "Merge and deploy" and to keep Pub Crawl's win rate where it landed (22.8%). Deployed: run #203 passed every job (build, balance, Chromium and all three WebKit shards, the update test) and published to Pages at 23:29 UTC on 2026-10-25. The six stacked PRs went to `main` as one squash commit through #47 (#42 to #46 closed as included). The sections below record each part. **Next (owner):** read the new copy (`docs/CARD_REVIEW.md`: 63 League strikes, 40 table moments, 36 rewritten route outcomes, 54 Pub Crawl strikes, 15 starting-gear pieces) and ask for any rewording; run a device pass on an iPhone (the strike line on a card, the spoils sheet with a "Replaces" card, the party dialog's gear) and record it in `docs/DEVICE_CHECKLIST.md`. Open follow-ups: show a Pub Crawl strike's knack on a lost strike (its ribbon), gym and gauntlet variety in the League (duels, a catch-style Legendary, jinx gym rules), Pub Crawl table moments and a roll-outcome rewrite.

## Pub Crawl equipment (2026-10-25; owner; shipped in #47)

Owner asks: equipment as its own item type, slots so the party carries one of each, about three slots (weapon, armor, trinket), and a pop-up to choose when a new piece takes a full slot. Owner answers: Weapon/Armor/Trinket is fine; combined screen if the UI is clean (the bottom plaques were already crammed); Pub Crawl only, for differentiation; the rest the agent's call.

Done: the existing trinkets (142, from bosses and elites) are the equipment. Each now has a `slot` (`Boon.slot`, `SLOTS` in `game/types.ts`), read from what it does by `trinket()` in `dungeon/shared.ts`: weapon if it only bends the dice (roll, crit, boss hits: 51), armor if it only keeps hearts (hearts, damage taken: 42), trinket for anything else or a mix (39). The 10 that only brought items have no slot: their items go in the satchel and nothing is worn (`isLasting`). The party wears one piece a slot: taking one swaps out the old (`gainBoon`, `replaces` in `engine.ts`), and its hearts and satchel size go with it; `skipSpoils` is "Keep my gear". Tonight's omen has no slot, and saves from before slots hold unslotted snapshots that stack as before. UI: a won boss or elite opens a Spoils sheet (`SpoilsSheet` in `Crawl.tsx`): one full-width row a piece with its slot mark (new `weapon` and `armor` icons from the vendored set, lorc/broadsword and lorc/breastplate), slot, name, power and "Replaces X", then "Keep my gear" when any row would replace something. The card's bottom strip shows a single Spoils plaque that reopens the sheet if it is closed. The party dialog shows each piece's slot; the guide's "Satchel and gear" row explains it; the "Trinket found" banner now fires on a swap too. The satchel (one-use items) is untouched and separate. Balance (the bot fills an empty slot first): Pub Crawl won 22.0% (26.3% before; band 18% to 40%), classes 19% to 35%, joke classes 4% to 7%; won runs keep 3.2 boons (4.7 before). Checks: `npm test` 317, lint, typecheck, `npm run test:balance`, build and budgets, `tests/browser/crawl.spec.ts` on Chromium (33); fixtures `crawl-gear-worn`, `crawl-spoils-would-replace`. Owner call: nudge Pub Crawl back toward a quarter (for example a landing's rest from 3 hearts to 4), or keep 22%.

Follow-up (owner, 2026-10-25: classes may start with equipment; show what a swap gives up): **starting gear** (`dungeon/kits.ts`, `CardDefinition.kit`, kept in `party.boons` as `<class id>#k`, put on when the adventurer is put aside). Every class but the Alchemist and the Bartender (whose thing is a full satchel) wears one small signature piece in one slot: Barbarian Rusty Greataxe, Rogue Shiv, Paladin Holy Mace, Ranger Bar Darts, Necromancer Bone Wand, Bouncer Heavy Flashlight (weapons); Cleric Holy Vestments, Wizard Pointy Hat, Warlock Hellfire Hoodie, Mercenary Kevlar Vest (armor); Bard Battered Lute, Drunken Monk Hip Flask, Druid Pet Ferret (trinkets, +1 heal); the joke classes wear something a little worse than nothing (Plus-One's Borrowed Blazer, the Intern's Visitor Lanyard, the Mimic's Its Own Lid). Each class card ends "Wears <piece>."; to fit 100 characters four flavor lines were shortened (Rogue "Has your wallet.", Plus-One "Nobody invited them.", Intern "Unpaid, sadly.", Mimic "A very confused chest."). **The spoils sheet shows the piece a row would replace as its own small card** (its mark, name and what it does now, without the items it came with). The party dialog and the end screen's tab tell tonight's omen from a class's gear by its slot. Balance: Pub Crawl won 22.8%, classes 18% to 36%, jokes 3% to 7%; fixture `crawl-starting-gear`. Checks: `npm test` 319, lint, typecheck, `npm run test:balance`, build, `tests/browser/crawl.spec.ts` on Chromium (33).

## Pub Crawl variety pass (owner, 2026-10-25: "it's all kinda same-y as well"; strikes shipped in #47)

**Owner steer (2026-10-25): "Let's make more roll free fights. Simple is better in an already complicated game. We can still have interactions and effects happen with roll free as well."** Strikes are the main lever.

**Phase 1 done (branch `claude/crawl-strikes`, stacked on #45):** a Pub Crawl strike is a room with no roll that calls for a knack: an adventurer with the knack wins it (the `advantage` line and any loot, no hearts), one without it loses it (the `disadvantage` line, `STRIKE_HURT` hearts [1, 1, 2] by depth, a curse or jinx, a splash in the Cup); the plain modes read the `even` line with nothing at stake (`strikeOutcome` in `engine.ts`, `strike` in `dungeon/shared.ts`, `strikeKnacks` in `dungeon/knacks.ts`, kept apart from the eight rolled knack rooms a floor). 54 strikes, six a floor (monsters and a few traps that carried no loot, curse or jinx except Loose Tap Handles' jinx), knacks spread across all five on each floor. The joke classes have no knacks, so they lose every strike. The knack dialog says a strike is "won outright, with no roll", and the how-to-play Knacks row says so too. Balance after: Pub Crawl won 26.3%, real classes 22% to 40%, jokes 4% to 7% (600 runs), every omen, hidden room and floor in band; League unchanged (25.6%). Checks: `npm test` 310, lint, typecheck, `validate-content`, `npm run test:balance`, build and budgets, `tests/browser/crawl.spec.ts` on Chromium (33, including the every-Dungeon-card fit sweep and a new strike test); fixtures `crawl-strike-won` and `crawl-strike-lost`. Open question for the owner: a lost strike doesn't say which knack would have won it (the League shows the foe's type in the ribbon); a knack mark in the ribbon would. Next: table moments per floor (no stakes), more strikes if the mix still reads samey, the roll-outcome rewrite, and the owner's read of the 54 lines.

Original note: do it after the League stack (#42 to #45) is read and merged. Measured before any change (shares of a run's weighted draws, crude): about 62% single rolls, 13% Won/Lost plaque fights, 7% push-your-luck gambles, 6% merchants, 4% forks, 8% rests and rewards; of 782 rolled outcomes, about 79% are one flavor line plus a bare "Drink N" or "Give N". The League's tools carry over: a roll-free fight settled by a matchup (here the adventurer's knack, `dungeon/knacks.ts`, in place of a type), table moments with no stakes (the Quarter-Zips' schemes, bar games, a toast that heals), duels, and outcomes that make someone do something. Plan: audit the 40-room floor pools, then a strike-like card keyed to knacks, table moments per floor, a roll-outcome rewrite, a retune (`tests/dungeon.balance.test.ts` bands: win 18% to 40%, classes 10% to 50%, joke classes 1% to 10%), save fixtures for any new card rule, and the same owner read of every new line.

## League variety rework (2026-10-25; owner approved the plan; shipped in #47)

Goal (owner): the League's cards and gameplay were same-y. About 63% of a run's cards are one d20/d6/2d6 roll with flavor and another 16% are Won/Lost plaque fights; 78% of dice outcomes are a bare "Drink N" or "Give N". Not everything needs to be a challenge: "you lost a battle, drink 2" is fine, and type advantages still apply. Owner answers to the open questions: take the recommendations (an even matchup costs a drink and no HP; scope is the League only, the 120 deck-mode cards stay; the mix below; this note is the plan of record).

**Target mix per run (about 53 cards):** rolls 33 to about 13, strikes 0 to about 12, duels (Won/Lost plaques) about 8, do-it, vote and rule cards 0 to about 10, shops, catches and evolutions about 10. A route draws 4 of 18, so the mix is set by each route's list.

**Card shapes:** Strike (new), Duel (existing plaque battle: pick a rival, play a quick game, tap Won or Lost), Do-it (no stakes, may pay +1 HP or an item), Vote, Rule (a `jinx` until a gym falls; the League theme does not use jinx yet), Roll reworked (outcomes are actions and have three tiers or more, no bare drink/give).

**Phases (one PR each):**

1. **Strike spike (done, PR #42).** `CardDefinition.strike` (three lines), `strikeOutcome`/`strikeText` in `engine.ts` (edge wins, disadvantage loses, even is neither; no new saved state), validation, the face (setup, rule, the matchup line) and the stakes seal (hearts only against the starter's type), Previous Card, 10 Route 1 and 2 wilds converted (`pidgey`, `rattata`, `wooloo`, `lechonk`, `oddish`, `diglett`, `pichu`, `seedot`, `geodude`, `snubbull`), `tests/strike.test.ts`, a browser test, fixtures `league-strike-{advantage,disadvantage,even}`. Checks run: `npm test` (304 pass), lint, typecheck, `npm run test:balance` (both suites pass), `BASE_PATH=/side-quest/ npm run build` and budgets, `tests/browser/quest.spec.ts` on Chromium (18 pass). WebKit is not installed in this container, so the WebKit project has not run; run it in CI or locally before publishing.
2. **Routes (done 2026-10-25, branch `claude/league-routes`, PR stacked on #42).** 32 more wilds and trainers are strikes (42 in all, about 28% of the route pools); 40 table moments (`league/moments.ts`, five a route, three heal 1); three more evolution cards (Link Cable, Sun Stone, Friendship Glow) because bigger pools had cut evolving to 58%. Route pools are now about 25 cards (4 drawn). Not done: reworking the outcomes of the remaining d20/d6/2d6 route fights into actions and reshaping the d6 move lists; that rides with phase 3's retune or a separate pass. Balance after: won 24.9%, 67.1 draws, 72% evolve once, 48% reach the final form (bands hold; Mudkip 45%, Oshawott 21%, Bidoof 11%). `docs/LEAGUE_TYPES.md` and its generator now count strikes (318 fights). Checks: `npm test` 307, lint, typecheck, `npm run test:balance`, build and budgets, `tests/browser/quest.spec.ts` on Chromium (18, including the every-League-card fit sweep). WebKit runs in CI only.
   **Phase 3 and 4 so far (2026-10-25, branch `claude/league-hideouts`, stacked on #43):** 21 more strikes: 18 hideout grunts, scientists and sages (the admins, commanders and bosses stay rolls) and 3 Victory Road wilds (`gruntStrike` in `journey.ts`; a curse on a grunt lands when the matchup loses). 63 strikes in all. Retune: `ELITE_NEED` 8 to 9 (`league/shared.ts`) because lower HP drain had pushed the League to 26.5% and Bidoof past its 8% cap. After: won 25.6%, 67.3 draws, 73% evolve at least once, 48% to the final form; starters 6% (Bidoof) to 43% (Mudkip), hideouts 16% to 35%; `npm run test:balance` passes. Run mix per run now: rolls about 19 of 53, strikes about 10, table moments about 7, plaque duels about 8. **Roll rework (branch `claude/league-rolls`, stacked on #44):** 36 outcomes of the flattest route rolls (wilds, trainers, Ace Trainers, finds) rewritten so a win or a loss makes someone do something (a vote, a pick, a mime, a rule) rather than a bare "Give N"; each keeps a number so the natural 20 and 1 still double (`tests/naturals.test.ts`). Text only, so balance is unchanged. The Elite Four and gyms already open with an action premise and were left. Still not done: gym and gauntlet variety (duels, a catch-style Legendary, jinx gym rules), the how-to-play pass and device checks.

3. **Retune.** Strikes cost HP only on a disadvantage, so the drain falls: tighten `WILD_NEED` and `WILD_HURT`, keep the win rate in band (18% to 40%), regenerate `docs/LEAGUE_TYPES.md`.
4. **Gauntlet, hideouts, rival, Victory Road.** More duels and do-it moments, a catch-style Legendary mini-game, a few jinx gym rules.
5. **Polish.** League how-to-play, `docs/CARD_REVIEW.md`, count assertions, a 320 px Playwright fit pass, an owner device check in `docs/DEVICE_CHECKLIST.md`.

**Known limits:** strikes make a matchup decisive (no luck), so the Tera Orb and Escape Rope matter more; Previous Card cannot show a Tera Orb's line once the orb is cleared; the 60-character line cap and the 100-character rule cap are tight for a joke plus an action.

## Pub Crawl depth plan (2026-10-25; owner approved the ideas; all five phases done; merged as PR #41 and deployed)

Goal (owner): bring Pub Crawl up to the League's fun and depth, distinct from it, without making it complex; add many cards; UI must read for drunk players at a distance (phone or mirrored TV). Phases 0 (the spike), 1 (content), 2 (forked levels and joke classes), 3 (knacks), 4 (the trophy wall and the tab) and 5 (polish and gates) are done and recorded below, built on branch `claude/pub-crawl-depth` and squash-merged to `main` as PR #41 (`3036dd3`) on the owner's word ("Merge and deploy"); the deploy run passed every job, WebKit shards included, and published to Pages at 18:14 UTC on 2026-10-25. **Next (owner):** read the new copy (117 cards in phase 1; the 18 classes' paths and taglines; the knack and end-screen words; `docs/CARD_REVIEW.md` lists every card), and run the 2026-10-25 Pub Crawl item in `docs/DEVICE_CHECKLIST.md`; ask for any wording changes as a follow-up. Not started, needs the owner: the optional wave 2 (a fourth floor at each depth, about 100 cards). The owner asked for this plan to be kept here, up to date, as work proceeds. Findings from reading the code:

- **Push your luck already exists** (`press`, `gamble()` in `dungeon/shared.ts`, `PressPlaques`): 9 gambles, one per floor, prizes are `Loot[]` only. Greed work is an expansion, not a new system.
- **Class is readable by cards**: `party.omen` holds the adventurer's card ID (`class-barbarian`), and `omenForm()` resolves its form. Class-reactive rooms need no new save field.
- **Branching exists only as "pick one, and that is the last form"** (`card.branches`, Eevee; `evolve()` in `engine.ts` takes a `branch`). Crawl classes level twice in a line, so a fork needs a small engine extension (below).
- **The end screen already lists floors, bosses and the Cup** (`CrawlRecord`, `Completion.tsx`); a trophy wall is a visual upgrade, not new state.
- **Rival**: the Quarter-Zips appear only at the door (`queue`, 5 cards) and closing time (`closing`). A `set-piece` stage kind already exists for a one-card stage.
- Dungeon content gzips to about 43 KB as source (proxy, not the built chunk) against a 200 KiB per-chunk cap, so roughly 130 more cards should fit; confirm with `check-budget` after each phase.

### Design rules for every new screen (distance and drunk readability)

1. One decision per card; at most three plaques; plaque = icon + at most two words + one short line (28 characters or fewer).
2. Meaning never rides on colour alone: every new state gets a shape or icon as well (like the League's chevrons).
3. Reuse existing surfaces: the strip, plaques, banners (`StageBanner`), the level-up banner. No new dialog on the path of play; dialogs only for review.
4. Nothing new on the strip except one chip at a time; the card face shows a new element only when it changes the decision.
5. Sizes: plaque tap targets 44 px or more, labels at the existing plaque size or larger, checked at 320 px by a Playwright assertion (no clipped text, as in the existing fit sweeps).
6. Emulated WebKit is not an iPhone and not a TV: legibility from across a room goes on `DEVICE_CHECKLIST.md` as an owner check, not a claim.

### Phases (one PR each, in order; each keeps `npm run test:balance` in band: crawl win rate 18% to 40%, every class and omen 10% to 50%, the Plus-One 1% to 10%)

**0. Spike (done 2026-10-25).** See "Phase 0 results" below.

**1. Content with no engine change.**

- Greed: 27 new gambles (3 more on each of the 9 floors, 4 per floor and 36 in all), including mimic chests, a cursed-tab bet and a "double or nothing" bartender. Same `press` mechanic, same plaques.
- Nemesis: a guaranteed `set-piece` stage after the lower landing, "The Quarter-Zips on the stairs" (5 cards: Brad, Chad and Thad schemes); 3 more queue cards and 3 more closing-time cards. Each of the three meetings escalates the joke (door, stairs, closing). No memory of past meetings in v1.
- Odds and ends: 8 more omens (20), 16 more boss and elite trinkets, 4 more landings per depth, 6 more rooms per floor (54).

**2. Forked level-ups (engine, save fixtures).** At a landing or a Dog-Eared Tome, the first level offers two paths (Barbarian: Berserker or Warlord; each path then has its own second level). Implementation: keep `evolves` flat as `[A1, B1, A2, B2]` so `party.form` stays an index; a new optional `fork` flag on the adventurer card makes the first level a pick of A1 or B1 and the second step forced to A2 or B2. Existing linear classes and every saved run are untouched (saves hold the card snapshot). UI: the landing's Level up plaque opens the same branch picker the League's Eevee uses, two big plaques, each with the form's name, icon and a 28-character tagline (authored, because the auto-written power lines are too long to read at distance). Sidegrade rule: both paths of a level sum to the same power budget; `dungeon.balance.test.ts` checks each path's win rate. Adds 4 new classes, with 2 tags each (below). **Joke classes (owner, 2026-10-25):** 2 more intentionally bad classes in the Plus-One and Bidoof tradition, humor first: both paths of each are bad in different, funny ways (the table picks its poison), held with the Plus-One in a 1% to 10% band below every real class. 18 classes in all. A Dog-Eared Tome (`candy`) cannot pick a path, so on a forked class it works only once a landing has picked one (as with Eevee).

**3. Class knacks.** Five tags (Brawn, Sneak, Magic, Charm, Faith); each class carries two. A tagged room (about 6 per floor) names one tag, and a class with it rolls the fight twice and keeps the better, shown by the existing green chevron chip with the tag's icon. Positive only: no class is ever put at a disadvantage, so it never reads as the League's types. Authoring target: 1.5 to 2.5 knack moments per run, asserted by a seeded-run test. New card field and chip logic need fixtures (`npm run fixtures:saves`).

**4. Trophy wall and closing tab.** The end screen gets the felled bosses as large trophies on a bar wall (the badge case's sockets, reused), the trinkets kept, the class path taken, hearts left and the Cup's fate, in one screenshot-friendly view. Any stat that is not derivable from saved state is dropped rather than added to the save, unless the phase 0 spike shows an optional counter is worth a fixture.

**5. Polish and gates.** `npm test`, `npm run test:balance`, lint, typecheck, `BASE_PATH=/side-quest/ npm run build` (budgets), `cards:review`, the workshop card-count assertions, Playwright `crawl.spec.ts`, `quest.spec.ts` fit sweeps at 320 px, and the new legibility assertions. Add the distance and TV checks to `DEVICE_CHECKLIST.md` for the owner.

**Optional wave 2 (needs approval):** a fourth floor at each depth (3 new floors, about 100 cards), taking dungeons from 27 to 64 combinations.

### Phase 5 results (2026-10-25; polish and gates)

- "a forked level up shows both paths, then follows the one taken" joined `@release` (now 45), so CI's WebKit shards cover the new landing at 320 px; the knack chip, Tome and end-screen tests stay in the full suite.
- `docs/DEVICE_CHECKLIST.md`: one item for the owner (landing plaques, the Tome, the knack chip and roll, both end screens, the stairs, and whether the joke classes land), read from the far seat and on a TV if one is at hand.
- CI on PR #41 (GitHub Actions, which runs the release suite in Chromium and three WebKit shards): green on the merge with `main` and on phase 3; the phase 4 run was in progress when this was written.
- Not done: the original plan's "legibility assertion" for every new surface is covered per surface (plaques, chip, wall, tab each assert fit at 320 px) rather than by one global check.

### Phase 4 results (2026-10-25; the end screen)

- **Display only, no save change.** `questRecord()` marks a stage `trophy` when it deals one card dealt again until it falls (`hits`): the two floor bosses, the hidden room's keeper, closing time and Last Call (never the queue or the stairs, whose one fight's outcome the save does not keep).
- **Trophy wall** (`TrophyWall` in `Crawl.tsx`): "Trophy wall · N of 5"; a gold medallion with the boss mark (two figures for the Quarter-Zips) and the felled card's name, or a dashed empty socket with "?" so nothing ahead is spoiled. Five across where each name fits whole (62 px), wrapping centred on the narrowest phones (3 + 2 at 320 px) instead of breaking a word ("Proprieto/r" in the first draft).
- **The tab** (`RunTab`): a receipt with dotted leaders: the adventurer's path as taken ("Barbarian → Brute → Juggernaut"), tonight's omen, rooms faced, trinkets by name, hearts left. On the end screens it replaces the adventurer and trinket panels (the full rules stay in play). The Cup panel and the floor list stay below. The League's end screen is unchanged (`words.trophies` and `words.tab` exist only in Dungeon night's theme).
- **Tests:** `tests/dungeon.test.ts` (the five trophy stages); browser: "the end screen hangs the trophies and the tab at 320px / 390px" (5 of 5, the path, omen and trinket, no name broken, nothing off screen, no trinket panel) and "a wiped run's wall shows the bosses felled and empty sockets" (2 of 5).
- **Verification:** `npm test` 299 passed; lint and `tsc -b` clean; build passed (runtime 3,657 KiB). Chromium: `crawl.spec.ts` 32 passed at two workers (7.5 min); `@release` 44 passed; the League's Hall of Fame, white-out and badge tests 3 passed. Screens judged from 320 px and 390 px Chromium screenshots. WebKit not run. No device check.

### Phase 3 results (2026-10-25; knacks)

- **Engine** (`types.ts`, `engine.ts`, `dice.ts`, `validate.ts`): `KNACKS` (brawn, sneak, magic, charm, faith); `CardDefinition.knacks` (two, on a class) and `knack` (on a fight). `knackEdge()` and `cardEdge()` (a League type matchup, else a knack's advantage); `rollDice` and `verdictShift` read `cardEdge`, so a knack rolls through the same code as a League edge, including `main`'s #38 dice pools (a d20 the better of two, 2d6 the two highest of four), saves `edge` and `dropped`, and the 3D overlay throws both. A trial's loss costs a heart less. Never a disadvantage.
- **Content** (`dungeon/knacks.ts`, applied in `dungeon.ts`): every real class has two knacks (`classKnacks`); the joke classes have none ("No knacks. Obviously." in the party dialog). 72 rooms, 8 a floor, call for one (`roomKnacks`; Brawn 18, Sneak 17, Faith 15, Magic 11, Charm 11). `applyKnacks` throws on a missing ID. Rooftop's "Toast the City" (phase 1) duplicated "To the City" and became "The Heckler".
- **UI** (`Crawl.tsx`, `crawl.css`, `crawlTheme.ts`, `GameDialogs.tsx`, `Play.tsx`, `Cards.tsx`): five marks from the vendored game-icons (`scripts/crawl-icons.ts`; existing marks regenerated byte-identical). The strip shows the green chevrons and the knack's mark only when the class has the room's knack; tapping opens "Knack" ("Rogue has Sneak", what it does, which rooms it is for). The party dialog shows the class's two as chips. How to play gains a Knacks row. A plaque fight's heart seal moves by one (Play passes `verdictShift` to `CardFace`). Judged at 320 px in Chromium screenshots: four chips fit the strip; the dialog reads at a glance.
- **Measured:** a real class meets 1.87 knack fights a run (`tests/knacks.test.ts`, 300 seeded runs; band 1.5 to 2.5); 13% of runs meet none. Balance: won **26.5%** (24.9% before), real classes 22% (Mercenary) to 43% (Warlock), jokes 6% / 6% / 9%, levels 80% / 29%; every class, omen and floor in band.
- **Saves:** fixture `2026-10-25-crawl-knack-roll` (a crawl roll with the edge, in flight). Old saves hold class and room snapshots without knacks and play as before.
- **Tests:** `tests/knacks.test.ts` (6: classes, rooms per floor, validation, the doubled roll, the plaque shift, moments a run). Browser: "a knack's room shows its chip, and the dialog explains it" (320 px), and the guide's row count (8 to 9).
- **Verification:** `npm test` 298 passed; `npm run test:balance` 8 passed; lint and `tsc -b` clean; build passed (runtime 3,654 KiB). Chromium: `crawl.spec.ts` 28 passed and 1 failed at two workers (the guide row count, fixed, then passed alone); `@release` 44 passed (an earlier run in a chained command printed "42 passed" with its other summary lines filtered out; the rerun showed 44 of 44). WebKit not run. No device check.

### Phase 2 results (2026-10-25; local branch `claude/crawl-forks`, on top of `claude/crawl-content`, not pushed)

- **Engine** (`engine.ts`, `types.ts`): `CardDefinition.fork` (four `evolves` as `[A1, B1, A2, B2]`); `omenForm()` returns the two first-level names and their `taglines` at form 0, then `next` and `nextTagline` down the path taken; `evolve()` takes the pick, then `form + 1`. `party.form` stays an index (1 or 2, then 3 or 4), so saves, `parseSession` and the snapshot rule are untouched. `Evolution.tagline` (28 characters at most, validated). A Dog-Eared Tome on a class still to pick asks which path (`spendLoot(..., branch)`; the satchel dialog shows one button a path, named for it), instead of being locked until a landing; the League's Eevee keeps its old rule. A heal made worse by an effect (`heal: -1`) is held at zero, so it never hurts (`settleParty`, `takeOffer`). `omenText` says "Every heal heals 1 less" (it said "-1 more").
- **UI** (`Play.tsx`, `Crawl.tsx`, `crawl.css`, `StageBanner.tsx`): a landing shows three plaques (path A, path B, rest), each path with its name, tagline and price on separate lines; the second landing shows only the path's next level. Judged at 320 px in Chromium (screenshot in the test output): names large, taglines on two lines at most, nothing clipped, every plaque at least 44 px tall. The level-up banner names the right "from" form on a fork.
- **Content** (`dungeon/classes.ts`): every class forks. Path A is each class's original line, unchanged; path B is new (Barbarian: Brute, Juggernaut; Rogue: Card Sharp, High Roller; Cleric: Battle Priest, Inquisitor; Wizard: Illusionist, Grand Illusionist; Bard: Hype Man, Headliner; Paladin: Oathbreaker, Blackguard; Ranger: Sharpshooter, Deadeye; Monk: Sober Monk, Zen Master; Necromancer: Plague Doctor, Plague Lord; Alchemist: Bombardier, Demolitionist; Warlock: Pact Keeper, Soul Broker). New classes: Bouncer, Bartender, Mercenary (the loud door's elites), Druid. **Joke classes** (owner: intentionally bad, humor first; `JOKE_CLASSES`): the Plus-One (now The Plus-Two then The Plus-Three, or The Ex then The Ex's New Partner, "Really nice, sadly"), the Intern ("Unpaid. Here for the experience."; Senior Intern then Middle Manager, "Schedules a follow-up", whose bosses take an extra hit, or Coffee Runner then LinkedIn Guru, "Thrilled to announce", whose natural 20s are rerolled) and the Mimic ("A chest. Thinks it's one of you."; five satchel slots and nothing else: Bigger Chest then Storage Unit, or Self-Aware Chest, "Has feelings now. Ow.", then Chest With Anxiety). 18 classes, 72 levels, each with its own dice colours.
- **Balance** (`tests/dungeon.balance.test.ts`; the table now picks a path at random at landings and with a Tome, and rests every joke class): won **24.9%** (27.2% before; the three jokes now make up a sixth of the classes); levels 78% / 25%; real classes 21% (Mercenary, Bartender) to 41% (Warlock); jokes in 600 forced runs each: Plus-One 6%, Intern 6%, Mimic 9% (it measured 10% first and lost a heart on every form), all below the worst real class (21%). Omens 14% (Open Bar) to 35%. Paths are printed, not asserted (about 70 to 110 runs each, and a run that levels is a run that got far, so they read high): mostly within 10 points of their sibling; Warlock's Hexblade (61%) stays well above Pact Keeper (43%, raised from 33% by taking the full +2 for a heart). The Bartender got a starting draught and a heart (19% to 21%), as its Bar Tab saves no hearts in the simulation.
- **Saves:** fixtures `2026-10-25-crawl-second-path`, `-crawl-second-level` and `-crawl-rival-on-the-stairs` (the stairs are phase 1's). Older crawl saves hold linear classes in their snapshot and play on as before (all 30 fixtures load).
- **Tests:** `tests/fork.test.ts` (paths, taglines, validation, refusals, the save round trip); `dungeon.test.ts` (the Paladin's two paths, a landing's pick, a full class at form 3 or 4, the Plus-One both ways, a Tome's path); `dice-palette.test.ts` (185 palettes). Browser (`crawl.spec.ts`): the landing test (three plaques with taglines), "a forked level up shows both paths, then follows the one taken" (320 px: each plaque fits, at least 44 px tall), "a Dog-Eared Tome asks which path a forked adventurer takes"; the full strip now levels the Rogue to Shadow (form 3).
- **Verification:** `npm test` 288 passed; `npm run test:balance` 8 passed; lint, `tsc -b` and Prettier (touched code) clean; build passed (budgets: runtime 3,633 KiB). Chromium: `crawl.spec.ts` 28 passed at two workers (6.7 min); `@release` 44 passed; `quest.spec.ts` (without its 400-card sweep) passed. The Dungeon night sweep **failed once** with a card not shown after a reload, in a combined crawl and League run at two workers (17 minutes, under load); it passed alone (5.7 min) and in the crawl spec at two workers, so its timeout went from 400 s to 900 s for the 530 cards. Cause not established. WebKit not run. No device check. The new class copy has not been read by the owner.

### Phase 1 results (2026-10-25; local branch `claude/crawl-content`, not pushed)

117 new Pub Crawl cards (Dungeon night 407 to 524; catalog 1,624 to 1,741), no engine or save-shape change:

- **Every floor** (all nine): 6 more fights (2 d20 monsters, a d6 or 2d6 monster, a trial, a trap, an ambush), 3 more gambles and 1 more elite with two trinkets. Fights 20 to 26, finds 11 to 14, elites 3 to 4 per floor; the fight-to-find ratio is unchanged (about 1.85).
- **Greed:** gambles 9 to 36 (four per floor; `AUTHORING.md` said one per floor and now says four). One per floor is a mimic (keg, cask, fermenter, coffin, manhole, fridge, clam, oven, planter), whose third prize is a Revive; the others are games of chance whose third prize is a Tome, a Revive, a Bar Tab or a shield. Same `press` engine and plaques.
- **Nemesis:** a new set-piece stage, **The Stairs**, after the lower landing (`stairs()` in `dungeon/shared.ts`, `STAIRS_NEED` 10, `STAIRS_HURT` 2; 5 cards in `lastcall.ts`, one fight for an item, one lays the One of the Boys jinx). The queue has 3 more cards (8) and closing time 3 more (8), one of them a rematch "for the queue" (no memory of the result; the joke works either way). A run is now 37 cards (was 36); every later step moved by one (`STEP` in the three crawl test files).
- **Omens** 12 to 20 (Payday: gambles and relics +2; Designated Driver; Friday the 13th: both naturals widen; Trivia Night; Brad's Birthday: ambushes, so the Quarter-Zips, cost a heart more; Open Bar; Name Tags, a table rule; Lucky Penny). **Landings** 4 to 8 at each of the two.
- **Balance** (`tests/dungeon.balance.test.ts`, 4,000 runs): won 32.5% to **27.2%** (the stairs fight's hearts carry into floor 3: floor-3 wipes 10% to 13%); a won run 46.9 to 47.8 draws; levels 79%/31% to 76%/26%; adventurers 25% (Rogue) to 42% (Paladin, was 50%, the band's edge), Plus-One 6%; omens 14% (The Lock-In, which fell to 12% and got a shield) to 36% (Cargo Shorts); floors 25% to 30%; hidden rooms 22% to 34%. That leaves about 13 points under the 40% ceiling for phases 2 and 3.
- **Harness fix:** the balance file ran out of memory (2 GB heap) with the bigger card pools, because it kept 4,000 whole sessions, each with a clone of every deck card. It now keeps each finished run without `cards` (a crawl deals only stage cards, which every reader finds in `quest.stages`) and round-trips the first 50 whole. The numbers are unchanged by this (it runs after play).
- **Tests:** counts and `STEP` updated in `tests/dungeon.test.ts`, `tests/dungeon.balance.test.ts`, `tests/browser/crawl.spec.ts` and `tests/workshop.test.ts`; the wipe screen's list is 8 entries (the stairs). The existing sweep, **every Dungeon night card fits its face with its plaques at 393x640** (in `crawl.spec.ts` since 2026-10-17), covers the new cards. (Phase 1 first added a duplicate of it by mistake; phase 2 removed the duplicate.) Two wordings caught by existing guards and fixed: "Seven" (the dice check reads "even") and "all night" (the chore check).
- **Docs:** `AGENTS.md`, `CLAUDE.md`, `README.md`, `src/content/CLAUDE.md`, `docs/AUTHORING.md`, `docs/GAME_DESIGN.md` counts and descriptions; `docs/CARD_REVIEW.md` and `card-review.csv` regenerated.
- **Verification:** `npm test` 282 passed; `npm run test:balance` 8 passed (both files together); lint and `tsc -b` clean; Prettier on touched files; `BASE_PATH=/side-quest/ npm run build` passed (dungeon chunk 41.1 KiB gzip of 200; runtime 3,624 KiB of 4 MiB). Chromium: `crawl.spec.ts` passed (the sweep about 6 min); `@release` 44 passed. WebKit not run (not installed here). No device check. Card copy is mine and has not been read by the owner.

### Phase 0 results (2026-10-25)

Baseline before the spike: `npm test` 282 passed, `tsc -b` clean, lint clean, `npm run test:balance` 8 passed (the run prints no rates; the last recorded ones are in the potion section). The spike code is on local branch `spike/crawl-fork` (commit `e941291`, throwaway, not pushed): `npm test` 286 passed (4 new), tsc, lint and Prettier clean. Rebuild it properly in phases 2 and 3; do not merge the branch.

- **(a) Forked levels: works, about 40 lines.** `CardDefinition.fork` marks `evolves` as the flat list `[A1, B1, A2, B2]`. `omenForm()` returns the two first-level names as `branches` at form 0, then `next` is that path's second level; `evolve()` takes the pick at form 0 and `form + 1` after, so `party.form` is 1 or 2 and then 3 or 4 and `formEffect`, `parseSession` (`form <= evolves.length`) and the save round trip need no change. `validate.ts` requires exactly 4 forms and forbids `branches` with it. The existing plaque code in `Play.tsx` already turns `branches` and `next` into one plaque per path, so a landing shows two path plaques plus Rest (three, within the rule). Level-up banner (`EvolutionBanner` in `StageBanner.tsx`) still needs a fork case for its "from" name, and `Evolution` needs an authored short `tagline` for the plaque. A Rare-Candy-style `candy` item cannot be used on a first level (it has branches), the same as Eevee; a Dog-Eared Tome is an offer, so it works.
- **Authoring lesson:** a level's effect replaces the previous one, it does not add. Each form must restate its hearts (the spike's Archer lost a heart by omitting it). Phase 2 needs a test that no form silently drops its path's hearts or satchel.
- **(b) Class knacks: works, about 30 lines.** `CardDefinition.knack` on a room and `knacks` (two) on a class; `knackEdge()` and `cardEdge()` in `engine.ts`; `rollDice` and `verdictShift` read `cardEdge`, so the existing roll-twice path, `DiceRoll.edge`/`dropped`, `validateRoll` and the 3D overlay carry over unchanged. A class lacking the knack rolls once, so nothing is ever a disadvantage. Still to build in phase 3: the strip chip (today only built from `cardMatchup`, in `Crawl.tsx`), a knack icon set, a short dialog, `KNACKS` validation in `validate.ts`, and the seeded-run test for moments per run.
- **(c) End-screen data: enough for a good tab.** Derivable now from `questRecord()`: floors with rooms faced and boss, boons and trinkets (`partyBoons`), class and path (`omenForm().line`), hearts and max, the Cup and Quaff, curse and jinx, items left. `quest.lost` is not confirmed to count crawl losses, so no fights-lost stat in v1. Drinks poured are not tracked and will not be.

### Risks

- Forks, knacks and extra gambles each add power; the crawl sits at 32.5% wins (this file's potion section; GAME_DESIGN.md still says about 28%), only 7.5 points under the 40% ceiling, so every power addition needs an offset (price, a harder room, or a weaker sibling) and expect one retune per phase (`dungeon/shared.ts`).
- The fork touches `evolve()`, which the League also uses; League balance and the evolution tests must stay unchanged.
- Card-count assertions (`tests/workshop.test.ts`), the manifest (`npm run content:manifest`), imprint entries and the card length rules apply to every new card.
- Nothing is pushed or merged without the owner's go-ahead; each phase is a separate branch and PR.

## Cards that leaned on their titles (2026-10-25; owner; PR #40)

A sweep of all 1,624 cards for bodies that only make sense with the title found six (the Most Likely To fix is PR #39). Buffalo now says "Buffalo! Finish your drink. It's gotta go." (owner: Buffalo means finish your drink). Sheet rows 036 and 037 are the Ride the Bus "Same" joke ("Called It", "Same Card, Wrong"), rows 078 and 079 the Guinness challenge ("Clean Split", "Missed the G"); the d6 rolls are unchanged. Recorded in `reference/README.md`. `core.buffalo` stays in the `rule` category (the deck composition test pins its counts) and in the duration exceptions in `tests/card-logic.test.ts`. House Tin Hat Society (`house.sheet-088`) now reads "Share one conspiracy theory you really believe. The table votes if it's believable. If not, drink 2." (owner approved the suggestion).

- **Verification:** `npm test` 286 passed; lint, typecheck and `BASE_PATH=/side-quest/ npm run build` passed. Browser specs not run; title fit unmeasured.

## Most Likely To titles (2026-10-25; owner; PR #39, merged)

The owner: the standing rule is that the whole instruction lives in the card body, and "Most Likely To" in the title left bodies like "Become an influencer." unreadable without it. All 250 vote cards now have their own flavor title (unique, 22 characters or fewer) and a body that holds the full instruction: "Most likely to become an influencer? Point on three. Most votes drinks 2." The build caps a rule at 100 characters, so the lead is "Most likely to ...?" and three long prompts lost a few words (the Ring camera walk of shame, talking shit about someone right behind them). Card IDs and payouts are unchanged (`src/content/likely.ts`: each prompt is `[title, prompt, payout?]`). `tests/workshop.test.ts` now checks the body pattern and that titles are unique; `docs/CARD_REVIEW.md` and `card-review.csv` regenerated.

- **Verification:** `npm test` 282 passed; lint, typecheck, `validate-content` and Prettier clean. Title fit in the teal band not measured in a browser (longest titles are 22 characters, like existing ones).
- **Not changed:** other packs whose title is only a mode name but whose body is complete (Paranoia, Secret Mission, Fact or Cap, Forehead, No Saying It, Act It Out, Three in Five, Hot Potato, Secret Rule). The title-dependent House and Core cards are fixed below.

## League types (2026-10-25; owner; branch `claude/league-types`, PR #35)

The owner asked for Pokémon types: one type per starter for the run, a type on every League card where it makes sense, advantage against types the starter beats and disadvantage against types that beat it, shown ahead of the roll. They approved every recommendation in the plan (both-ways matchups, ±1 HP on plaque fights, d6 sets rolled twice, a starter's first type for the run, rivals by their ace), then asked for at least one starter of every type, a new item if it adds no bloat, balance through more opponent cards rather than perks ("fun and flavor are drastically more important than balance"), and a cleaner UI: "a logo or something", not banners and text.

- **Engine** (`src/game/matchup.ts`, `engine.ts`, `dice.ts`): the games' chart (Gen 6+, all 324 cells checked against Pokémon Showdown's data and held by a test). Since the owner's follow-up ("simpler rules for sure") the edge is the rule every player knows: the starter's type super effective against the foe's is an advantage, the foe's super effective against the starter's a disadvantage, anything else even (a resistance or immunity alone gives nothing; both super effective is even). The Striaton trio (`type: "trio"`) plays as the brother who beats the starter. `cardMatchup(quest, card)` needs a League battle with a type and a typed starter (`partyType`, which follows Eevee's branch). A dice fight with an edge rolls the whole set twice: advantage keeps the better attempt (a win over a loss, else the higher read total), disadvantage the worse; starter bonuses, naturals and Bidoof's flinch apply per attempt. The roll saves `edge` and `dropped` (optional; `values` stay the kept faces). A plaque fight's loss costs 1 HP less with the edge, 1 more against it (`verdictShift`, also on the card's seal).
- **Tera Orb** (`tera`, the one new item): before a typed battle's roll or verdict, when the starter lacks the edge, the starter Terastallizes into the type with the widest edge over the foe (`teraType`), for that fight only (`party.tera` = the card's ID, cleared when the card is put aside; a boss dealt again needs another). Plaque "Terastallize" beside Escape. Zorua starts with one (Zoroark restocks one at every gym), Eevee starts with one (Normal never has the edge), Saffron and Indigo Marts sell one for 6 drinks, and Route 7's Tera Raid Den is a find for one. Pub Crawl never deals it (its theme calls it a Prism Shard).
- **UI** (owner: no banners): the card shows only its type medallion in the ribbon (`TypeMark`, read as "Water type"). The edge is a chip on the strip under the header: two green chevrons up or two red chevrons down (`EdgeMark`), nothing when neutral; tapping it opens "Type matchup": both medallions, then one line ("Your Grass moves are super effective!" or "Misty's Water moves are super effective against you!", "Terastallized!" before it with an orb) and what it does. Owner report: Sunkern against Pichu had read "Super effective!" though Grass hits Electric normally; that edge came from the old both-ways rule and no longer exists. The 3D overlay throws both attempts and fades the dropped dice; the card shows the kept faces and the dropped attempt small and struck through. The team dialog keeps "Strong against" and "Weak against" chips; How to play has a Types row.
- **Starters** (`league/starters.ts`): 35, at least one of every type. Togepi (Fairy), Drowzee (Psychic) and Zubat (Poison) took over Wooper's, Slowpoke's and Psyduck's powers (three of ten Water); Chespin and Fennekin complete Kalos; then one per missing type, each with its own arc: Spheal (Ice: rolls with it), Riolu (Fighting: wider natural 20s, Lucario's Aura Sphere), Cubone (Ground: Marowak's Bonemerang takes a hit off every boss), Rookidee (Flying: Corviknight Taxi carries drinks with Baton Passes), Caterpie (Bug: a Rare Candy, a Metapod that only Hardens, a lucky Butterfree), Larvitar (Rock: a tank, then Tyranitar), Gastly (Ghost: a Revive, then Gengar), Gible (Dragon: lean, then Garchomp), Zorua (Dark: Illusion, the Tera Orb), Aron (Steel: Iron Defense). Now 6 Fire, 6 Grass, 7 Water, 2 Normal and one of each other type. Old IDs `starter-wooper`, `-slowpoke`, `-psyduck` are retired, never reused.
- **Opponents** (`league/types.ts`, `league/wilds.ts`): every League fight typed by ID from what the card says (a card naming a Pokémon gets its type; a trainer class known for one type gets it; a dual type plays as the one it's best known by). Measured per run, the League was short of Grass, Ground and Electric (Grass starters met 13.9 bad matchups to 7.6 good). Instead of perks, 24 new route fights, three a route, of the missing types: Oddish, Diglett, Pichu; Seedot, Geodude, Snubbull; Voltorb, Sandshrew, Bellsprout; Wingull, Ralts, Phanpy; Tangela, Engineer Bernie, Spritzee; Sudowoodo, Rotom, Breloom; Ruin Maniac Liz, Gardevoir, Wailord; Rhyperior, Electivire, Togekiss. Grass now meets about 11 good to 14 bad, Fire and Electric about even, Water a little ahead (`docs/LEAGUE_TYPES.md`, generated by `npm run league:types`, has the table). Route 5 gained a Day Care evolution card so the bigger pools still evolve as often. The starter buffs from the first round were reverted to each starter's original power, with small flavor-fitting nudges only where a starter fell under 10%.
- **Balance** (`tests/league.balance.test.ts`): now 120 seeded runs per starter (4,200 in all, the same cost as before; a 35th of 4,000 random runs was too few to read a starter), and the simulated table uses a Tera Orb on a bad matchup or before a typed boss. Routes 5–8 wild fights ease by one (`WILD_NEED`), the d6 fights' faces unchanged. Final, after merging `main` (#34: potions drink 4 to heal 2, Quaff 4): League won 21.8% (band 18–40%), a won run 66.7 draws; evolution 78% / 49%; starters 12% (Sunkern, Drowzee) to 44% (Mudkip), Cubone 43%, Gastly 40%, Bidoof 1% (worst, as designed). Before that merge: 19.6%.
- **Follow-up (PR #38)**: the simpler rule above (52 of 324 type pairs that had an edge from resistances alone are now even); the dialog reduced to one line; a bug where Marowak's "bosses take 1 fewer hit" made a 1-hit gym need none, so a lost gym was put aside as beaten (`hitsNeeded` now never goes under 1, with a test that fails on the old code). Cubone, Sunkern and Mudkip nudged to stay in band. Owner report: a 2d6 edge threw four dice with no telling which two were a pair, so a multi-dice edge is now one pool: roll double the dice and keep the highest (lowest against you); the others fade once they land. Keeping the worst-reading pair was tried first and made Lt. Surge (doubles lose) unwinnable against a Water starter, looping a Mudkip run; by face value every League fight stays winnable (worst: Drake at 3.6% against you). League 22.6% won, starters 12% (Sunkern, Rowlet 13%) to 40% (Mudkip), Bidoof 3%.
- **Saves**: schema v2 unchanged. Games saved before types hold untyped snapshots and play neutral to their end (the badge case still shows gym types through `badgeType`'s ID fallback). Fixtures: `2026-10-25-league-starter-chosen`, `-league-roll-with-advantage`, `-league-roll-with-disadvantage`, `-league-terastallized`. `validate.ts` checks `type`; `validateParty` checks `tera` (only on the battle face up).
- **Tests**: `tests/matchup.test.ts` (chart, edges, the trio, the Tera Orb, rolls kept and dropped, ±1 HP, saved-roll checks, untyped old runs), `tests/pokemon-types.test.ts` (every gym and form typed, every type has a starter, the untyped list, validation). Browser (`quest.spec.ts`): the chevron chip and its dialog at 320 px with a live two-dice roll; the Tera Orb plaque and dialog; Jasmine's plaque fight costs 1 HP less; the team dialog's type lists; the every-League-card fit sweep (about 400 cards, its timeout raised to 10 minutes).
- **Verification**: `npm test` 282 passed; `npm run test:balance` 8 passed (League 21.8%; Pub Crawl 32.5%, moved by `main`'s potion change, not this branch); lint, typecheck and Prettier clean on touched files; `BASE_PATH=/side-quest/ npm run build` passed (budgets: 120.1 KiB initial, no card text in it). Chromium (local): `@release` 44 passed; `quest.spec.ts` 17 passed, including the every-League-card fit sweep (5.4 min alone). WebKit not run locally: the container cannot download it (Playwright CDN blocked); CI runs the release suite in WebKit. Screenshots judged at 320 px in Chromium only.
- **Not done / risks**: no device check (`DEVICE_CHECKLIST.md`). Balance is measured only by the simulated table, and several starters sit at 11–13%, near the 10% floor, so a later League change may need a nudge. WebKit not run locally.

## Potions and the Quaff (2026-10-25; owner; not pushed)

- **Potion / Healing Draught:** drink 4, heal 2 (was a fresh, full drink for 1), capped at max (`DRAUGHT_HEAL`, `DRAUGHT_DRINKS` in `src/game/engine.ts`; item text in `crawlTheme.ts`). Same item in both crawls.
- **Quaff:** 4 drinks (was 6; `QUAFF_DRINKS` in `src/content/dungeon/shared.ts`).
- **Verification:** `npm test` 261 passed (draught test now heals 2 and checks the cap); `npm run test:balance` 8 passed; lint and typecheck passed. Browser specs not run.

## Home Screen icon (2026-10-24; owner request; not pushed)

- The bezel is gone: the painted tankard (`assets/source/tankard.png`, the same art as before) now sits on a flat teal gradient (the frame's teal) with a light sheen and a soft shadow. `scripts/icons.ts` (`npm run generate:icons`) writes the four PNGs in `public/`. Opaque square, no rounding (iOS masks it); the tankard fills 74% of the side, 60% in `icon-maskable.png` so Android's circle crop keeps it whole. (A flat silhouette version was drafted first; the owner chose the painted tankard.)
- Installed iPhones keep the old icon until the app is removed and re-added to the Home Screen. Not checked on a device.

## Pokémon and League copy review (2026-10-18; branch `review-league-copy`, not merged or pushed)

- **Bugs:** wins that made the drawer drink now give (Brock, gym Giovanni, Tate & Liza, Glacia; Ho-Oh's losses drink, wins give); per-face losses no longer pour more nearer the win (Erika, Lorelei, Bugsy, Drake). Plain wins on 2- and 3-hit bosses read as a swing, not the fall. Natural 1s cost at least twice the worst loss and natural 20s give at least double (Zigzagoon, Biker Gang, Hydreigon, rival Nemona, Star Squad, Lugia, the shot fumbles; Deoxys, Zacian). Starter and adventurer roll bonuses say "d20" (`omenText.ts`; also Pub Crawl's lines; `quest.spec.ts` and `crawl.spec.ts` expectations follow). Hideout ribbons carry ranks (`grunt(..., { rank })`). Forks no longer promise a specific elite; route rules no longer name items; Ilse's faces match the count.
- **Facts, clarity, consistency, fit:** Gordie, Pokémon Tower 6F, Blaine Jr., Kenji, current move names; who acts and what wins on a dozen cards; props removed (Burgh, Brassius, Wikstrom, Sandile); "A pair!" on every doubles; League jinxes end "Slip: drink 1." (docs example too); repeated jokes for characters who meet twice in a run rewritten (Lorelei, Bruno, Grusha, Lacey, Sableye, Crasher Wake, rival Hop, rival Nemona, route Psyduck); the 33 listed fight and ribbon rules are 80 characters or fewer.
- **Sheet cards** (recorded in `reference/README.md`): Castform, Sentret, Krabby and Pound get their supplied consequences back; Spoink and Missingno fixed; move names; Barboach, Clefairy, Lapras, Silver, Mankey and Rare Candy reworded.
- **Docs:** League bosses are all battles (`AUTHORING.md`); 23 starters and 362 League-only cards (`AGENTS.md`, `GAME_DESIGN.md`, `src/content/CLAUDE.md`).
- **Not changed:** Whitney's Rollout (rising pours are the joke) and the `{total}` losses that grow toward the win (a documented graded loss).
- **Verification:** `npm test` 251 passed; `npm run test:balance` 8 passed; lint, typecheck and `validate-content` passed; Prettier clean on touched TypeScript. Fit judged by character count, not measured in a browser; browser specs not run.

## League badge case and type marks (2026-10-24; owner; branch `claude/badge-health-screen-split-bv2vxx`)

- **Bug:** the strip's badges chip opened the same dialog as the HP stud ("The team"). The HP stud now opens `party` (new `DialogName`); the chip opens `badges`, its own dialog titled "Badges" (`GameDialogs.tsx`, `main.tsx`). Pub Crawl has no badges; a stray `badges` there still reads as the party.
- **Badge case** (`src/components/LeagueMarks.tsx`, `BadgeCase`): eight sockets, four a row; each earned badge is a medallion in its gym's type colours with the type's mark, its name ("Boulder", "Fightinium Z") and its leader. Sockets to come stay empty, so nothing ahead is spoiled. The Hall of Fame shows the same case. The team dialog no longer shows badges.
- **Type marks:** 18 types plus the Striaton trio, display-only lookups by card ID (gyms) and form title (starters) in `src/presentation/pokemon-types.ts`; marks from the vendored game-icons set written to `public/art/league/types/` by `scripts/crawl-icons.ts` (existing marks regenerate byte-identical). Painted badge art (`art/badges/*.webp`, 24 of 72 gyms) is left to the meter-mode badge case; the crawl uses the type marks so all 72 gyms look alike.
- **Starter panel:** the team dialog's starter wears its current form's type: medallion, a tinted panel and type chips (two for dual types, e.g. Charizard Fire · Flying).
- **Lock (owner):** while Veteran Ada (`pokemon.route-veteran-victory`, "Name all eight from this run") is face up, the badges chip is disabled with a red X and says "locked, name them from memory"; it opens again once her battle is settled. Cards are listed in `crawlTheme` `badgeLock`. The team dialog stays open to use (it shows no badges).
- **Tests:** `tests/pokemon-types.test.ts` (every type has a mark, all 72 gyms and every starter form have a type, the lock card exists); `quest.spec.ts`: the badges chip opens "Badges" with typed badges, the team dialog shows the type and no badges, and the new Veteran Ada lock test.
- **Verification:** see the PR. No device check; colour contrast of the ivory marks on the pale Electric, Ice and Steel medallions judged from Chromium screenshots only.

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
- **Hypothesis:** WebKit samples 4px inside the _unobscured_ edge, the bottom of the status bar (63pt), where the strip did not reach; the projects whose fixes worked pad a sticky header under the clock, so their box spans that point.
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
  - _Monsters_ (about 40%): d20 battles. Floor 1 wins on 7+ and costs 1 heart on a loss; floor 2 wins on 9+ (2 hearts); floor 3 wins on 11+ (2 hearts). Win outcomes hand out drinks.
  - _Traps:_ a d20 save at 10, 12 or 14 by floor, costing 1 heart.
  - _Feats:_ Won/Lost plaques. Examples: the riddling tap, holding a full pint at arm's length, a staring contest with the creature in the mirror.
  - _Loot_, _shrines_ (+2 hearts, and the table toasts) and _choice rooms_, using the existing choice plaques: open the chest or walk away, take the left or right door.
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

- _Keg Golem_ (floor 1 boss): "It's 800 pounds of lager and it's tapped. Shotgun your drink, then roll d20." A 9+ is a hit: "You pull its plug. Give 5." A miss: "It sits on you. Drink 4. −2 hearts."
- _Gelatinous Shot:_ "A cube of jello shots, and something's floating in it. Roll d20." An 8+: "You eat your way out. Give 3." A miss: "You're inside it now. Drink 3. −1 heart."
- _Hangover Hydra_ (floor 2 boss): "Every head you cut off grows back with a headache. Roll d20." A hit: "One head down. Everyone else drinks 2." A miss: "It breathes regret. Drink 5. −2 hearts."
- _Tab Goblin:_ "It's been putting drinks on your tab since 2019. Roll d20." A win: "You stiff it. Give 4." A loss: "It collects. Drink 3. −1 heart. Lose your newest loot."
- _Bouncer Troll:_ "You're not on the list. Prove you're sober: walk heel to toe across the room and back." Lost: drink 4, −1 heart.
- _Karaoke Banshee:_ "It screams the first line of a song; sing the next one." Lost: drink 3, −1 heart.
- _The Mirror:_ "Staring contest with your reflection in your drink." Blink and you drink 3, −1 heart.
- _Mimic Cooler:_ choice between "Open it" (a d20: 11+ gives a Healing Draught, anything less "It bites. Drink 4. −2 hearts.") and "Walk away".
- _Wishing Drain:_ a shrine. "Toss in a coin, or a fry. The party heals 2. Everyone toasts the drain."
- _The Last Call Lich_ (final boss): "Lights come up. The music stops. It's last call forever unless you kill it. Roll d20." A 13+ is a hit; a miss: "Closing time. Everyone drinks 4. −3 hearts."

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

- **Moved from Core** (old `core.*` IDs retired, recreated as `cabin.*`): Smooth Brain, I Don't Know Shit, That's Two Beers, Samesies, Almost Lost My Cool, What an Idiot, For Safety, It's Gotta Go, Get Good, Fuck You In Particular, Thanos Snap. Three were restored toward the CABIIN wording: Fuck You In Particular is "Roll d6. Drink 10 minus your roll" (was "Pick someone. They drink 6"), Thanos Snap makes the _unpicked_ half drink, That's Two Beers is "Give out 24 drinks" (Core's 4d6 version is gone; House `sheet-003` still has 4d6). Core is now 105 cards; saved games keep their snapshot, and retired `core.*` IDs keep the Core mark via the prefix rule in `presentation/packs.ts`.
- **Translation rules used.** Teams became the drawing player or a home-state call-out (Florida, Michigan, Wisconsin, Ohio, Ski Team). Board movement and skipped turns became pours; multi-round effects last until the drawer's next turn. d6/3 and d6−3 are written out per roll. Guess I'll Die uses 2d6 doubles because the engine's `doubles` means _all_ dice match (3d6 "any two match" would need an engine change).
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

| Variation (installed app unless noted)                                               | Measured                                                                                                                            | Verdict                          |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Shipped build, iOS 27.0                                                              | `html` 812, wood ends at 812, flat 62pt strip below; other launches: `scrollY -62`, flat band on top, content 62pt low              | Reproduces the device screenshot |
| Shipped metas on a probe page, iOS 18.5                                              | inner 812, `dvh`/`svh`/`100%` 812, `lvh`/`vh` 874; a 1400pt fixed ruler is clipped at 812; strip takes the `body` background colour | Same bug predates iOS 26         |
| Fixed layer `height: 100lvh`, `screen.height`, `bottom: -200px` (document still 812) | Element box reaches 874+, paint still stops at 812 on 18.5                                                                          | No effect alone                  |
| `html { height/min-height: 100lvh }`                                                 | 18.5: inner becomes 874, ruler reaches the bottom. 27.0: wood reaches the bottom                                                    | Removes the bottom strip         |
| Same, plus `scrollTo(0, 0)` on 27.0                                                  | `scrollY 0`, `.app 0..874`, no frost, status bar over wood                                                                          | Full screen                      |
| Same, then drag the page down                                                        | Scrolls to `-62` and stays                                                                                                          | Needs a lock                     |
| `html, body { overflow: hidden }` + the above                                        | Drag produces no scroll events; stays at 0                                                                                          | Lock works                       |
| Web manifest present vs absent (cloned web clips)                                    | Identical geometry                                                                                                                  | Not a factor                     |
| Safari tab, iOS 27.0 iPhone and iPad                                                 | inner 714 / 1124, `lvh` 754 / 1153; layout unchanged by this work                                                                   | Tab path untouched               |

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

| #   | Task                                                                                                                                                                                                    | Done when                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Get authorization to commit the chin mitigation and deploy; recheck on the installed iPhone and record it in `docs/DEVICE_CHECKLIST.md`.                                                                | Result recorded, pass or fail.                                                                                                  |
| 2   | Wake Lock hook in `src/app` or `src/presentation`: acquire while a game is active, re-acquire on `visibilitychange`, release on complete/setup, silent no-op when unsupported.                          | Playwright test with a stubbed `navigator.wakeLock`; device check that the screen stays on for 5+ minutes in the installed app. |
| 3   | Install dialog and persistence: warn to install before playing, call `navigator.storage.persist()` when available.                                                                                      | Copy updated; unit/browser test for denied or missing API.                                                                      |
| 4   | Decide iPad landscape (Spencer's call). If yes, gate only phone-sized landscape and verify card fit at 1180×820, 1366×1024 and Split View.                                                              | Orientation specs updated; device check on an iPad.                                                                             |
| 5   | Measure ambient animation cost with Safari Web Inspector on a real device; if material, pause ambience during dice, dialogs and after idle.                                                             | Before/after numbers in this file.                                                                                              |
| 6   | Check for a launch flash on device; if present add startup images for current iPhone/iPad sizes under `public/`, inside the 3 MiB runtime budget.                                                       | Cold launch checked on device.                                                                                                  |
| 7   | Setup: show pack card counts, and clamp or label Short/Long when the selected packs have fewer cards than the limit.                                                                                    | Unit test on the clamp; Setup layout still passes `@release`.                                                                   |
| 8   | Hygiene (ask first): fix the `AGENTS.md` branch line, move STATUS history to an archive file, delete the scratch script, add `typecheck`/lint scripts, merge or differentiate the two number-ban cards. | Docs and CI still pass.                                                                                                         |

**Progress (2026-10-03, committed and pushed).** Tasks 2, 3, 4 and 7 are implemented; 1, 5, 6 and 8 are open. Per Spencer's "whatever a professional game dev would do": wake lock via `src/app/wakeLock.ts` (`useWakeLock(active)` in `main.tsx`); `requestPersistence()` on start and an Install dialog line saying to install before playing; `PortraitGate` now blocks only landscape with a short side under 600px, so iPad landscape plays (the old "iPad landscape is blocked" test was replaced by a 1180×820 card-fit check); Setup shows the selected packs' card count and a repeat hint when the count is below the 30/60 limit (no clamp; the game itself is unchanged). Verified: `npm test` 98 passed, `tsc` clean, Pages-path build and budgets passed (2737 KiB runtime; 94.2 KiB initial + 147.8 KiB lazy gzip), new wake-lock spec plus orientation/secondary/game specs 49 passed / 2 skipped / 1 flaky (a WebKit menu-focus assertion in game.spec.ts passed on retry; unrelated code), release smoke 22/22, update flow passed. Not verified: real wake lock on iPhone/iPad (needs iOS 16.4+, Home Screen fix 18.4+), iPad landscape at 1366×1024 and Split View, Setup hint layout on a 320px phone.

Gates for every task: `npm test`, `BASE_PATH=/Drink-at-Ron/ npm run build` (budgets unchanged), `npm run test:release` with a unique `TEST_PORT`, and the matching device check.
