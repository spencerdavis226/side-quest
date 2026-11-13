# The Quest 2.0: review and execution spec

Written 2026-11-13 from a full read of the Realms pack (all 586 cards, `src/content/dungeon/`, `src/content/dungeon.ts`), the engine (`src/game/engine.ts`, `types.ts`), the moments layer (`src/components/moments/`) and the League for comparison. **Nothing here is implemented.** This file is the build spec for a later session; `docs/STATUS.md` points here.

How to use it: sections 1 and 2 are the review (why). Section 3 is what the owner approved and what still binds. Section 4 is the design (what the table sees). Section 5 is the engine and save specification (how). Section 6 lists every card to write. Section 7 is the order of work: one phase per session and per pull request, each with a definition of done. Section 8 is what could go wrong and what was read but not run.

Evidence limits: this is a read of code and card text. No run was played on a phone, and no balance simulation was run for any proposal. Every number proposed below is a starting point to be measured with `tests/dungeon.balance.test.ts`.

---

## 1. Verdict

The Quest is Pub Crawl with new nouns. The writing is good, the structure is not new. Stage for stage the run is the same as Pub Crawl's:

| Pub Crawl | The Quest | Changed? |
| --- | --- | --- |
| Adventurer, omen | Adventurer, omen | Text only |
| (none) | The King's Summons | **New** (the best addition) |
| The queue (Quarter-Zips) | City Gate (Gilded Company) | Text only |
| Floor 1 (8 rooms) + boss | Region 1 (8 encounters) + boss | Text; boss now ranks you up |
| Landing (level up or rest) | Inn (rest or stock up) | Small |
| Hidden room | Side quest | Text; can be declined |
| Floor 2 + boss, landing | Region 2 + boss, inn | Text |
| The stairs | The Crossroads | Text only |
| Floor 3 | Region 3 | Text only |
| Closing time | The Lair's Door | Text only |
| Last Call boss | The dragon | Text; named on card 3 |

What the League has that makes it feel like its own game, and the Quest's current answer:

| League | Why it works | The Quest today |
| --- | --- | --- |
| Types: every fight reads differently per starter | A reason to care which card came up | Nothing. A class is a list of +1s |
| Catching, a team, send-ins, fainting | Collection and attachment | Nothing. Gear is +1s in three slots |
| 8 gyms, a badge each | A milestone every 5 cards | 2 region bosses in about 52 draws |
| Evolution | A visible arc | Rank ups (present, good) |
| Known canon (people shout the names) | Free delight | No canon; the run must build its own and doesn't |

The Quest should not copy those. Its own identity, which nothing else in the app has, is **a story the table steers**: a named dragon the whole run points at, a road the table picks, companions picked up on the way, and a ballad at the end that is different every time. Everything in section 4 serves that one sentence.

---

## 2. Findings

### F1. Regions are the same deck nine times (highest impact on replay)

Each region file was built from the same template, so the nouns change and the play does not. Every region has, by count:

- 1 "light the fuse, pass a cup clockwise naming X" card (9 of 9; the Fire Caverns has 2).
- 1 "read alone, start the clock, act it out" card (9 of 9; the Tower has 2).
- 1 "roll four dice, four seats drink" card (8 of 9).
- 1 to 2 "on three, everyone points" cards (9 of 9).
- 4 push-your-luck gambles, one of them always a mimic ("pays out until it bites").
- 2 relics ("open it, or don't"), 2 treasures ("...Drink 1."), 2 shrines, 2 merchants ("takes drinks, or blood"), 2 forks (always quiet way versus noisy way).
- 4 table moments, one of which heals.

A table that has played the King's Road has mechanically played the Frozen Pass. The third run feels like the first.

### F2. No rhythm inside a region

A region is 8 random cards from about 45, then a boss. Nothing marks the middle. The League deals 4 cards then a gym, eight times. The Quest has two stretches of 8 to 11 draws (ambushes and bosses are dealt twice) with no beat, and the third region has no boss of its own.

### F3. The dragon is a name, not a spine

`{dragon}` appears on the 6 summons cards and nowhere else. After card 3 the dragon is not mentioned until it is on the table. The dragon is also picked independently of the third region, so Rimeclaw (ice) can be waiting at the end of the Fire Caverns. The dragons' second beats are generic contests (stare, hold your breath, clap) that could belong to any boss.

### F4. Nothing rare ever happens

All variation is uniform picks from pools. There is no event a table sees once in ten runs and talks about. Naturals and doubles are the only surprises, and they are the same in every mode. The three joke classes are the opposite of rare: 3 of 18 runs (17%) open on a class with a 3 to 7% win rate. That is a planned loss one run in six.

### F5. Choices are all the same trade

Fork (elite for gear or not), merchant (drinks or hearts for an item), relic (roll or walk), inn (heal or item), side quest (take or walk). Every one is risk for loot. None is a choice about where to go or who to be, and none is remembered later in the run.

### F6. Classes are numbers

Powers and knacks were cut on 2026-10-31 for good reasons. What is left is "+2 to boss d20s. Traps hurt 1 more. Wears Rusty Greataxe." The table shares one adventurer, which is fine, but nothing about the class is felt at the table, and the kit line adds a second thing to read on the first card.

### F7. The rival repeats one joke three times with no payoff

Gate, Crossroads and Lair's Door are 21 cards of "the Company is smug, roll". The last meeting is always a two-hit fight. The story (they push past, they are ahead, they got there first) never resolves.

### F8. Pub jokes with a fantasy coat

The owner's rule was "world straight, the joke mostly in outcome lines". These cards keep a modern pub premise and should be rewritten (IDs in parentheses are current titles):

- Exes: The Ex Wraith, Your Merfolk Ex, The Frozen Ex, The Cold Spell, The Mirror Witch ("keeps her ex in a mirror"), and the Frozen Ex's phase ("They want closure").
- Nightlife: Mermaid Bachelorettes, Party Eels, The Kelp Guard ("never on the guest list"), The Clay Golem ("not on the list"), The Mountain Trader ("24-gold cocktails"), Drunk Food, The Fire Lord ("third divorce"), The Ghoul Knight ("leg day", "spotter"), The Fire Judge ("one star").
- Kitchen leftovers in the Fire Caverns: Yes, Master (yes, chef), Four Buckets (four plates), The Imp Chef, The Screaming Smith ("it's raw"), The Spit Roast, The Cool Cave ("twelve minutes of peace").
- Hal the Fire Mage ("Hal is fine") and The Crypt Keeper's Mom read as in-jokes with no setup in this world.

About 22 cards. Not urgent, but they are the cards that make it read as a reskin.

### F9. Small defects

- Realms calls a jinx a **Curse** in the UI ("Cursed!", "The curse lifts") but every rule still says "the jinxed player". Should be "the cursed player" in Realms (about 45 rules in `jinxes.ts`, the region files, `bookcase.ts`, `lastcall.ts`).
- Old Mother Mire is "older than the marsh", but the Marsh is a first-depth region. She can never be met in a marsh.
- `withNames` fills `{dragon}` in `rules` only, not in dice outcome lines or phase dice. Any new use in an outcome line needs that extended.
- The Lair's Door banner always says "The Company got here first", including in runs where the table won both earlier meetings.
- Internal names are three generations deep (`dungeon.two-am-kebab` is Gorgrath). Harmless, but new cards should get clean IDs.

### F10. What is already good (keep)

The Summons; the pleas and the option to walk on; rank ups on boss kills; boss phases; the inns' table prompts; the omens that lay a spoken rule; the Gilded Company's voice; the region lighting. Balance is inside its band (35.6% won).


### F11. Rewards and shopkeepers repeat too

All 18 treasures are "a thing lies here. Drink 1." All 18 merchants are "takes drinks, or blood" with the same two prices. All 18 forks are a quiet way and a noisy way. They are good once and invisible by the third region.

### F12. Two latent defects found while reading the engine

- **Offline replay after walking past a side quest.** "Walk on" removes the side quest's stages from the saved run (`takeOffer`, `skip`). Play Again normally builds a fresh run, but when the pack's cards cannot load it falls back to `replaySession`, which re-deals the saved stages. The plea is still there and its `skip: 2` now removes the next region and its boss. Rare (offline, cards not cached, after a Walk on), but real. Fixed in Phase 5 by keeping dropped stages for a replay.
- **A saved run carries every card of every region pool it might have used.** A stage snapshots its whole pool (about 45 cards a region), so a Quest save is about 265 KiB and is rewritten on every tap. This plan adds pools; see 5.9 for the option to snapshot only what a run can still deal.

---

## 3. Scope, decisions and what binds

**Owner, 2026-11-13:** "Write the plan to do every change you recommend ... I am ok with substantial engine rewriting ... be thorough in what needs to be done and how, so an opus in a new session can do it."

So every recommendation below is in scope and treated as approved in principle. The table is the list of things the owner can still veto before the phase that builds them, and the two limits that the repo says need a number confirmed.

| # | What | Built in | Status |
| --- | --- | --- | --- |
| D1 | The table chooses the road for regions 1 and 2, on a map (reverses "regions stay random", 2026-11-03) | Phase 5 | Approved in principle |
| D2 | Each dragon has a lair region; region 3 is fixed by the dragon | Phase 1 | Approved in principle |
| D3 | The dragon fight is a battle: the dragon has health and makes a move every round | Phase 2 | Approved in principle |
| D4 | Allies: up to two, sent into fights, can die, and die in the party's place at zero hearts | Phase 4 | Approved in principle |
| D5 | Dragon lore: up to three, each an edge on one swing at the dragon | Phase 4 | Approved in principle |
| D6 | The road remembers: deeds and echoes; the Lair's Door depends on the Company's record | Phase 6 | Approved in principle |
| D7 | The Chronicle (a record across runs) with three unlocks | Phase 7 | Record approved; **unlocks: confirm** (some tables dislike locked content) |
| D8 | Joke classes become rare (about 6% of runs) | Phase 6 | Approved in principle |
| D9 | Kits cut; gambles cut to 2 a region | Phase 1 | Approved in principle |
| D10 | A won run grows from about 52.6 draws to about 58 to 64. Raise the balance test's ceiling from 55 | Phases 2, 3 | **Confirm the number when measured** |
| D11 | Runtime budget, now 3,874 of 4,096 KiB | Any | **Ask with a measured number** before changing `scripts/check-budget.ts` |
| D12 | Heroic mode: a harder Quest unlocked by a first win | Phase 7 | Optional; skip if D7's unlocks are declined |

**What still binds (from `AGENTS.md`, unchanged by this plan):**

- Saved games must load after every update. Every new field is optional. New saved state gets new fixtures (`npm run fixtures:saves`); no fixture is ever edited or deleted. `parseSession` is conservative: a false rejection destroys a real game.
- The validator runs on saved snapshots too (`validateCatalog` inside `validateQuest`), so it must keep accepting every card shape that has ever shipped (`kit`, `phases` on dragons, `skip` as a number).
- `src/game` stays pure: no DOM, no storage, randomness injected.
- The League must not change. Its tests, its 4,200-run balance file and its fixtures are the guard for every shared function.
- Session schema v2 and the `side-quest.session.v1` key stay.
- No push to `main` without the owner's say-so. One phase per pull request.

**Not proposed**, because the owner cut or declined them: region rules, signature powers, knacks, two-path levels, a hero draft, a gold currency, a player roster.

**Complexity check.** The 2026-10-31 cuts were about systems getting in the way of cards. This plan adds four things a player has to understand: pick a road, send an ally in, lore runes, and the dragon's move. Three reuse a gesture the League already taught. Everything else (rares, echoes, hidden results, the Chronicle, the ballad) needs no explaining. If it is too much in play, cut in this order: lore, then echoes, then allies. Keep the battle and the map.

---

## 4. The design

### 4.1 Pillars

1. **The dragon is the spine.** Named with its lair on card 3, seen on the way, learned about, then fought in a battle no other card has.
2. **The table steers.** A map, two road choices, a landmark in every region, and choices that come back.
3. **Allies.** Named companions picked up on the road, sent into fights, lost for good when it goes wrong.
4. **Rare things.** Rare cards, hidden results on certain rolls, echoes, and a Chronicle that counts what a table has seen.
5. **The ballad.** The end screen writes the run as four lines.

### 4.2 The run

Card counts in brackets.

**Act 0: The Call**

1. Your adventurer [1]
2. The omen [1]
3. The King's Summons [1]: names `{dragon}` and `{lair}`
4. The City Gate [1]: the Gilded Company, one fight; the result is remembered

**Act I**

5. The Road Out [1]: the map; one of two regions
6. Region 1 [8]: four encounters, the **landmark**, three encounters
7. Region boss [1 card, two beats]: spoils, rank up
8. **Dragon sign** [1 of 6]: `{dragon}` passes over; a chance at lore
9. The Inn [1]: rest, stock up, or hire a blade
10. Side quest plea [1]: take it (2 guards, a keeper; the one you rescue joins as an **ally** and tells you **lore**; rank up) or walk on; remembered either way

**Act II**

11. The Signpost [1]: the map; one of two regions
12. Region 2 [8] and its boss (spoils, rank up)
13. The Last Inn [1]: rest, stock up, or ask about `{dragon}` (lore)
14. The Crossroads [1]: the Company, one fight; remembered

**Act III**

15. The lair region [8], fixed by the dragon: four encounters, **the Approach**, three encounters
16. **An echo** [0 or 1]: someone from earlier comes back
17. The Lair's Door [1]: the Company's payoff, chosen by how the two earlier meetings went
18. **The dragon battle** [about 8 rounds]
19. The ending and the ballad

Counted: 4 + 1 + 9 + 1 + 1 + 1 (+4 with the side quest, each fight possibly dealt twice) + 1 + 9 + 1 + 1 + 8 + 1 + 1 + 8. About 58 to 64 draws for a won run once repeated bosses are counted.

### 4.3 The dragon and its lair

**Lairs.** Nine dragons, three per lair, plus two that the Chronicle unlocks.

| Lair | Dragons (card ID) |
| --- | --- |
| The Fire Caverns | Emberfang (`last-call-lich`), Gorgrath the Hungry (`two-am-kebab`), Ashmaw the Ancient (`the-morning-after`) |
| The Frozen Pass | Rimeclaw (`bartender-below`), Stormcrown (`surge-pricing`), Glimmerwing (`house-lights`) |
| The Sunken Coast | Old Mother Brine (`final-tab`, retitled from Old Mother Mire), The Whispering Wyrm (`the-group-chat`), Tidewrack (new, `dragon-tidewrack`) |
| Any (rare, unlocked) | Bartholomew (new, `dragon-bartholomew`), The Dragon King (new, `dragon-king`) |

**Each dragon, in one line.** Its moves, its enrage contest and its lore are written from this.

| Dragon | Personality | Moves lean on | Enrage contest (whole table) | Lore: weak scale / fear / true name |
| --- | --- | --- | --- | --- |
| Emberfang | Proud, loud, greedy | Fire for everyone, pointing at the greedy | Out-roar it: the table roars together; the drawer judges the weakest roar, who drinks 4 | "Its left wing never healed." / "It hates the sound of bells." / "Its true name is Cinder, and it hates it." |
| Gorgrath the Hungry | Eats everything | Takes drinks off the table, swaps glasses, "feeds" neighbors | Everyone names a food in turn, fast; first to stall is eaten and drinks 4 | "It chews on the left." / "It cannot stand a full plate left alone." / "Its mother called it Pudding." |
| Ashmaw the Ancient | Tired, patient, has seen it all | Memory and silence; punishes repeating yourself | The table tells it one thing it has never heard; the drawer judges | "The oldest scale is loose." / "It fears being forgotten." / "Its name is the first word anyone spoke." |
| Rimeclaw | Cold, still | Freezing in place, last-to-move | Everyone freezes; first to move drinks 4 | "The ice on its throat is thin." / "It fears a warm hand." / "Its name is the sound of a lake cracking." |
| Stormcrown | Fast, showy | Timing: clap on three, last-to, counting | Thunder: count to ten around the table, clapping on every third; a miss drinks 4 | "One horn is cracked." / "It fears a clear sky." / "Its name is Crackle." |
| Glimmerwing | Vain | Compliments, mirrors, posing | Everyone compliments it in turn; the weakest compliment, by vote, drinks 4 | "The gold is paint on its belly." / "It fears a mirror at dawn." / "Its name is Gladys." |
| Old Mother Brine | Riddling, motherly, hungry | Riddles, "say please", manners | She asks a riddle (the left neighbor invents it); ten seconds for the table | "Barnacles hide a soft spot." / "She fears her own daughters." / "Her name is the tide table." |
| The Whispering Wyrm | Knows your secrets | Whispering only, confessions, pointing | Everyone confesses one small thing; whoever refuses drinks 4 | "It has no scales under the jaw." / "It fears being overheard." / "Its name is the thing you never said." |
| Tidewrack | Wrecks ships for their bells | Rocking, bailing, man overboard | The table sings one line of a shanty each; whoever breaks the rhythm drinks 4 | "A harpoon is still in its side." / "It fears a lighthouse." / "Its name is rung, not said." |
| Bartholomew | Would rather talk | Opinions, tea, small talk; no move costs a heart | A debate on a topic the drawer picks; the table votes | "It has a bad back." / "It fears confrontation." / "It prefers Bart." |
| The Dragon King | All of them at once | The worst move of each other dragon | Everyone stands and stays standing until it falls | "It has no weak scale." / "It fears nothing." / "You already know its name." |

**Names in text.** Two placeholders, filled at display time and never saved:

- `{dragon}`: the title of the run's dragon. Today that is "the last finale card" (`withNames`, `engine.ts:899`). Change it to "the card in the run that has `lairFight`, else the last finale card", so old saves and any later stage ordering both work.
- `{lair}`: the label of the stage that holds the lair region, with a leading "The" lowered ("the Fire Caverns"). Authors use it mid-sentence only.
- Fill both in `rules`, dice outcome instructions, `phases`, a lair fight's move text and stage `intro` banners. Today only `rules` is filled.
- Budget when writing: `{dragon}` can be 19 characters ("Gorgrath the Hungry") and `{lair}` 16. `validate-content.ts` sees only the unfilled text, so add `tests/realms-names.test.ts`: fill every dragon and every lair into every card, phase, move and intro that uses a placeholder and assert the 100-character and 20-word limits (110 for phase and move text, 28 for an intro).

**The Summons (6, rewritten).** Each names both and stays under the limit when filled, for example:

- The King's Decree: "{dragon} has woken under {lair}. Everyone raises a glass to the king."
- The Bounty: "WANTED: {dragon}. LAST SEEN: {lair}. Everyone toasts the reward."
- The Prophecy: "A fool will slay {dragon}. Everyone points at the fool; most fingers drinks 2." (unchanged; the ballad pays it off)

**Dragon signs (6, one dealt after the first region boss).** A table beat, then a choice. Offers cards (`encounter: "shrine"`, ribbon "Dragon Sign", crimson). Plaque labels are at most 18 characters.

| ID | Title | Rules | Plaques |
| --- | --- | --- | --- |
| `sign-shadow` | The Shadow | "A shadow crosses the sun: {dragon}. Everyone ducks. Last head down drinks 2." | "Watch it · drink 2" (lore) / "Stay down" |
| `sign-scale` | A Fallen Scale | "A scale the size of a shield, still warm, fallen from {dragon}." | "Study it · drink 2" (lore) / "Wear it" (Tower Shield) |
| `sign-knights` | The Fleeing Knights | "Knights gallop past the wrong way, shouting '{dragon}!' Everyone shouts it too." | "Stop one · 1 heart" (lore) / "Let them run" |
| `sign-mill` | The Burned Mill | "A mill, still smoking. {dragon} was here an hour ago. Everyone pours out a sip." | "Search it · drink 2" (lore) / "Fill a flask" (Healing Potion) |
| `sign-tracks` | Tracks | "One footprint, big enough to sit in. Everyone sits in it. Last down drinks 2." | "Follow them · 1 heart" (lore) / "Go around" |
| `sign-song` | The Old Song | "A shepherd sings the old song about {dragon}. Everyone hums. Nobody knows it." | "Learn it · drink 2" (lore) / "Tip him" (heal 1) |

### 4.4 The dragon battle (D3)

Today the dragon is `hits: 3` with two `phases`: the same card dealt until three wins. Replace it, for the dragon only, with a battle. Region bosses, keepers and the Company keep hits and phases.

**How a round plays at the table.** The dragon card is dealt to the next drawer as now. When it turns over, the ribbon names the dragon's move for this round and the rules are that move's line ("FIRE BREATH. Everyone drinks 2."). The table does it. Then the drawer rolls the d20: a hit breaks a scale, a miss costs a heart. The card is put aside and the dragon is dealt again to the next drawer with a new move. So a round is one card, read top to bottom: the dragon acts, then you swing. Nothing about the tap flow is new.

- **Health.** Shown as a row of scales on the strip. Starts at 4 (5 for the Dragon King). A hit breaks one; a natural 20 breaks two. An omen's `bossHits` adds health.
- **A miss** costs 1 heart (2 on a natural 1), plus the party's `hurt.boss` adjustments, as a boss swing does today.
- **The move** may also cost hearts (`damage`), make the next swing harder (`harder`), or only be something the table does.
- **Enrage.** The first round after health drops to half or below is the dragon's enrage contest: no dice, the table plays it, the drawer taps Won or Lost. Won breaks a scale. Lost costs 2 hearts. From then on the dragon uses its enraged moves and the screen's edge burns in its color.
- **The kill.** When the swing that can end it is on the table, the card adds "Everyone stands." A swing that breaks the last scale wins the run even if that round's move would have taken the last heart: the party is left at 1 heart.
- **Lore** (4.6): the first swings are rolled twice, best kept, one per lore.
- **Allies** (4.5): one whose calling is bosses can be sent in on any swing.
- **Items** work as on a boss: a Lucky Coin rerolls a miss, a Tower Shield blocks the next heart loss (a move's or a miss's), a Hired Sword passes the drinks, a Smoke Bomb does nothing.

**Starting numbers (unmeasured; tune in the balance test).** Health 4, need `BOSS_NEED[2]` (13). Calm list: two moves deal 1 heart, one makes the next swing 2 harder, three are table-only. Enraged list: one move deals 2, two deal 1, one makes the next swing 2 harder, two are table-only. Expect about 8 rounds and about 7 hearts lost, close to today's dragon.

**A full dragon, as the pattern (Emberfang).**

Swing lines: miss "Fire, everywhere. Drink 3." / hit "Your blade finds a loose scale. Give 4." / natural 20 "You cut a wing. Everyone else drinks 4." / natural 1 "It sits on you. Drink 6."

| | Calm move | Line | Effect |
| --- | --- | --- | --- |
| 1 | Fire Breath | "Everyone drinks 2. Glasses held up as shields drink 1 instead." | 1 heart |
| 2 | Tail Swipe | "The drawer's two neighbors drink 3." | |
| 3 | Takes Flight | "It circles overhead. Everyone looks up until the roll." | next swing 2 harder |
| 4 | Gold Fever | "Everyone points at the greediest player. They drink 3." | |
| 5 | Roar | "Last to cover both ears drinks 3." | |
| 6 | Hoard Slide | "A wave of coins. Last to lift both feet drinks 3." | 1 heart |

| | Enraged move | Line | Effect |
| --- | --- | --- | --- |
| 1 | Inferno | "Everyone drinks 3." | 2 hearts |
| 2 | Wing Buffet | "Everyone leans back. Last to lean drinks 3." | 1 heart |
| 3 | Molten Gold | "The drawer and whoever they point at drink 3." | 1 heart |
| 4 | Smoke | "Eyes shut until the roll. Peek: drink 2." | next swing 2 harder |
| 5 | Mocking Laugh | "Everyone laughs like a dragon. Weakest laugh drinks 3." | |
| 6 | Counts Its Gold | "It turns its back. The next swing is 2 easier." | next swing 2 easier |

Every dragon gets the same set: 4 swing lines, 6 calm moves, 6 enraged moves, an enrage contest, 3 lore lines. Eleven dragons is 132 moves; write them from the personality table in 4.3. Each list should have at least two moves no other dragon has.

### 4.5 Allies (D4)

Up to two named companions travel with the party. This generalizes the League's team.

- **Calling.** One kind of fight the ally is good at: `monster`, `trap`, `ambush`, `relic` (relics and gambles), `elite` or `boss` (the dragon counts).
- **Send in.** On a single-d20 fight of that kind, before the roll, a plaque sends the ally in: +3 to the roll (+5 for rare allies, +2 for one who answers any call).
- **It can die.** Win and the ally stays. Lose and the ally is gone for the run: its own moment, and the drawer drinks 2.
- **The last stand.** When the party's hearts would reach zero, a living ally dies in its place and the party stays at 1 heart. A Phoenix Feather is used first; then the older ally.
- **A ritual.** One spoken line the table keeps while the ally lives.
- **Two at most.** A third sends the oldest home (not dead; as the League's team does).

| Ally | ID of the card that carries it | From | Calling, bonus | Ritual |
| --- | --- | --- | --- | --- |
| Gertie the Goat | `the-proprietor` (Granny Hex) | Witch's Cottage keeper falls | trap, +3 | "Everyone bleats when the party heals. Silent: drink 1." |
| Coin the Mule | `the-promoter` (One-Eyed Mag) | Bandit Fort keeper falls | ambush, +3 | "Whoever uses an item pats the table twice first." |
| Mort the Skull | `the-manager` (Barrow King) | Old Barrow keeper falls | relic, +3 | "Before any gamble, the left neighbor advises as Mort." |
| Pip the Cabin Boy | `big-mike` (Sea Witch) | Drowned Shrine keeper falls | monster, +3 | "The table shouts 'Pip!' at every monster. Last drinks 1." |
| Durla Ironbraid | `the-undefeated` (Deep Worm) | Sunless Vault keeper falls | boss, +3 | "Everyone clinks before a boss swing." |
| A Hired Blade | each of the 8 first inns | "Hire · drink 3" | elite, +3 | None |
| The Frozen Knight | `approach-frozen-army` | A plaque on that Approach | boss, +3 | "The drawer says 'for the king' before every swing." |
| The Hatchling (rare) | `rare-dragon-egg` | Win the fight | boss, +5 | "Everyone coos when it is named." |
| Chester (rare) | each mimic gamble | A natural 1 on it (hidden) | relic, +5 | "Chester holds the satchel. Ask him nicely before using an item." |
| The Company's Bard (rare) | `closing-bard` | A plaque at the Lair's Door | any, +2 | "She narrates. The drawer may not describe their own roll." |
| Sir Bradley | `closing-bradley-begs` | A plaque at the Lair's Door | boss, +3 | "Everyone says 'well done, Bradley' after every swing." |

Sir Bradley can be sent at the dragon and can die there. That ends the Company's story.

### 4.6 Dragon lore (D5)

Up to three, shown as three runes on the strip.

- **Effect.** At the dragon, the party's first swings are each rolled twice with the better die kept, one swing per lore held. Automatic.
- **Found line.** Each dragon has three lines, revealed in order (weak scale, fear, true name). Finding lore shows the next one.
- **Sources.** Dragon sign (a plaque, every run); the side quest (the keeper's fall, guaranteed); the Last Inn ("Ask · drink 3"); three of the nine Approaches; the Wizard's Tower landmark; two rares; two hidden results. A table that pays for it reaches three; most reach one or two.
- Lore past three is ignored (the plaque is still taken; nothing happens beyond its price).

### 4.7 The map and the road (D1)

**The map** is the Quest's own screen. A parchment: the City Gate at the bottom, a row of three regions, an inn, a row of three regions, the last inn, the lair at the top marked with the dragon. Passed stops are inked. It lives in the party dialog as a tab and plays as a moment.

**The choices.** The Road Out (after the City Gate) and the Signpost (after the side quest) each offer two of the three regions of that depth. The third is closed for a reason the card gives. There is one choice card per pair, so six:

| Depth | Pair | Title | Rules |
| --- | --- | --- | --- |
| 1 | Road, Forest | The Road Out | "The marsh is flooded to the eaves. Road or forest? Everyone votes; the drawer decides." |
| 1 | Road, Marsh | The Road Out | "The forest is shut: the elves are sulking. Road or marsh? Everyone votes; the drawer decides." |
| 1 | Forest, Marsh | The Road Out | "The King's Road is closed for a parade. Forest or marsh? Everyone votes; the drawer decides." |
| 2 | Crypt, Mines | The Signpost | "The tower has moved again. Crypt or mines? Everyone votes; the drawer decides." |
| 2 | Crypt, Tower | The Signpost | "The mines are on strike. Crypt or tower? Everyone votes; the drawer decides." |
| 2 | Mines, Tower | The Signpost | "The crypt is full. Mines or tower? Everyone votes; the drawer decides." |

Plaque labels are the region names (all 18 characters or fewer). The map shows three words under each lit region (4.8).

### 4.8 Regions: landmarks, character, variety

**Shape.** A region is one stage of 8 cards: four encounters, the landmark, three encounters. The landmark is always fifth.

**Landmarks: all 27.** Each is an offers card, never a roll, ribbon `"<Region> · Landmark"` (violet). "Remembered" means the plaque sets a deed (4.10). Labels in the build must fit 18 characters; the wording here is the intent.

| Region | Landmark | Premise | Plaques |
| --- | --- | --- | --- |
| King's Road | The Gallows Tree | A man on the gallows swears he's innocent; the table votes | Free him, drink 2 (remembered) / Ride on (remembered) |
| King's Road | The Tourney Field | A joust, and they need one more fool | Enter (elite next) / Watch (heal 1) |
| King's Road | The Toll Keep | A baron's keep across the road, toll due | Pay, 1 heart (Smoke Bomb) / Sneak round (elite next) / Bow and pay, drink 3 |
| Old Forest | The Fairy Court | The fair folk offer a gift and never say the price | Accept, 1 heart (Tome of Training; remembered) / Decline (heal 1) |
| Old Forest | The Oldest Tree | It has watched every hero pass. It has notes | Listen, drink 2 (lore) / Carve your names (heal 1) |
| Old Forest | The Hunter's Feast | A lord's feast in a clearing; you are not invited | Sit down anyway (remembered: heal 2) / Steal a pie (Healing Potion) |
| Marsh | The Sunken Chapel | A chapel up to its windows; the bell still rings | Wade in (elite next) / Light a candle (heal 1) |
| Marsh | The Hag's Bargain | She'll trade: something you have for something you need | Trade a heart (Phoenix Feather; remembered) / Refuse |
| Marsh | The Ferry of Frogs | A raft poled by frogs, and they want a song | Sing, drink 2 (Lucky Coin) / Swim, 1 heart |
| Haunted Crypt | The Ferryman of the Dead | He'll row you past the worst of it | Pay, 1 heart (Smoke Bomb) / Walk / Stiff him (Smoke Bomb; remembered) |
| Haunted Crypt | The Hall of Kings | Twelve dead kings on twelve thrones, one empty | Sit in it (elite next) / Bow to each (heal 1) |
| Haunted Crypt | The Weeping Statue | She weeps real tears, and they heal | Drink the tears (heal 3; a curse lands) / Leave her be |
| Goblin Mines | The Goblin Market | Everything is for sale, and most of it is yours | Buy, drink 3 (Lucky Coin) / Haggle, drink 1 (Healing Potion) / Steal (Lucky Coin; remembered) |
| Goblin Mines | The Lift | A cage on a chain, or the stairs | Ride it (elite next) / Take the stairs, drink 2 |
| Goblin Mines | The Dwarf Ghosts | The old miners want one last shift from you | Work it, drink 3 (Tome of Training) / Refuse (a curse lands) |
| Wizard's Tower | The Room of Doors | One hums, one smokes, one is polite | Humming (elite next) / Polite (heal 1) / Smoking, 1 heart (lore) |
| Wizard's Tower | The Library | Every book ever written, badly shelved | Read, drink 2 (Tome of Training) / Borrow one (Lucky Coin; a curse lands) |
| Wizard's Tower | The Familiar's Exam | The wizard's cat tests you before you may pass | Sit it (elite next) / Bribe the cat, drink 2 |

**The Approaches (the lair's landmark; `{dragon}` in the text).**

| Lair | Approach | Premise | Plaques |
| --- | --- | --- | --- |
| Fire Caverns | The Bone Road | Empty armor all the way down | Take a shield, drink 2 (Tower Shield) / Read a journal, 1 heart (lore) |
| Fire Caverns | The Last Forge | A dwarf smith who will not leave | Reforge, 2 hearts (weapon: Dragonbane, +2 to boss d20s) / Share his ale (heal 2) |
| Fire Caverns | The Hoard's Edge | Gold underfoot already | Fill your pockets (Lucky Coin; a curse lands) / Touch nothing |
| Frozen Pass | The Frozen Army | A hundred knights in ice, swords up | Chip one out, 1 heart (ally: The Frozen Knight) / Salute (heal 1) |
| Frozen Pass | The Wind Shrine | Prayer flags, and a monk who has seen it | Ask him, drink 2 (lore) / Hang a flag (heal 1) |
| Frozen Pass | The Ice Bridge | It crosses, or the long way round does | Cross (elite next) / Go round, drink 3 |
| Sunken Coast | The Bell Reef | Ships' bells hung on the reef | Ring one (elite next) / Row past |
| Sunken Coast | The Drowned Town | Roofs under clear water, and a lamp still lit | Dive, 1 heart (lore) / Sail over (Healing Potion) |
| Sunken Coast | The Last Lighthouse | The keeper is leaving and wants company | Take his lamp (trinket: Keeper's Lamp, +2 to trap d20s) / Share his rum (heal 2) |

**Character through the mix.** No standing rule. Each region's pool is weighted so the table can tell where it is, and the three words go on the map:

| Region | Three words | More of | Less of |
| --- | --- | --- | --- |
| King's Road | People, tolls, merchants | 3 merchants, neighbor duels | Relics (1) |
| Old Forest | Bargains, healing, curses | 3 shrines, relics that curse | Merchants (1) |
| Marsh | Traps, gambles, mud | Traps, 3 gambles | Shrines (1) |
| Haunted Crypt | Curses, relics, the dead | Relics (3), cards that lay curses | Treasure (1) |
| Goblin Mines | Greed, gambles, loot | 3 gambles, 3 treasures | Shrines (1) |
| Wizard's Tower | Riddles, tricks, tomes | Trials of wit, Tomes as rewards | Monsters |
| Sunken Coast | All hands | Whole-table cards | Solo trials |
| Fire Caverns | Endurance, heat | Hard monsters, endurance trials | Shrines (1) |
| Frozen Pass | Ice, traps, treasure | Traps, whole-table cards, 3 treasures | Merchants (1) |

**De-template.** In each region:

- Cut 2 of the 4 gambles (cut 1 in the Marsh and the Mines). Keep the mimic and the best other.
- The fuse card ("pass a cup, naming X") stays in five regions: King's Road, Crypt, Mines, Fire Caverns, Frozen Pass. Remove the other four.
- The act-it-out card stays in five: Old Forest, Marsh, Wizard's Tower, Sunken Coast, Fire Caverns. Remove the others.
- Forks: rewrite so no two in a region are "quiet or noisy". One of each region's two becomes a reason (a scream for help, a shortcut, a dare, a locked door).
- Treasures: replace "Drink 1" with a small act that fits the find (18 cards).
- Merchants: each gets its own wares and its own price wording; no more than six of 18 say "drinks, or blood".
- Removed cards leave the module. IDs are never reused. Saves keep their snapshots.

### 4.9 Rare things

**Rare cards.** A stage may list cards outside its pool; at game start, with a set chance, one replaces a pick. A rare card wears a prismatic foil and its ribbon ends "· Rare".

Regional rares: 2 per region, chance 0.2 per region. About half of runs see one; a given one appears in about 1 run in 30.

| Region | ID | Rare | What it is, in existing builders |
| --- | --- | --- | --- |
| King's Road | `rare-king-disguise` | The King in Disguise | Trial: nobody may bow or say "king". Won: Tome of Training |
| King's Road | `rare-unicorn` | A Unicorn | Shrine, heal 4. "Whoever speaks first drinks 3." |
| Old Forest | `rare-sword-stone` | The Sword in the Stone | Relic-style choice, d20 needs 17. Won: weapon Kingmaker (+2 to every d20) |
| Old Forest | `rare-sleeping-giant` | The Sleeping Giant | Offers: tiptoe (a curse: whisper until the boss falls) / wake him (elite next) |
| Marsh | `rare-wishing-frog` | The Wishing Frog | Offers, three wishes: heal 3 / an item / rank up for 2 hearts |
| Marsh | `rare-wisp` | The Will-o'-Wisp | Offers: follow it, 1 heart (lore) / stay on the path |
| Haunted Crypt | `rare-own-grave` | Your Own Grave | Treasure: Phoenix Feather. "A headstone with tonight's date. Everyone toasts." |
| Haunted Crypt | `rare-death-chess` | Death, Playing Chess | Trial, rock-paper-scissors against the table's champion. Won: heal 5. Lost: 2 hearts |
| Goblin Mines | `rare-mother-lode` | The Mother Lode | A gamble with five prizes (raise the validator's prize limit from 3 to 5) |
| Goblin Mines | `rare-thing-below` | The Thing Below | Relic-style choice: flee, or fight at the elite need; spoils are the depth's best weapon or armor |
| Wizard's Tower | `rare-wizard-home` | The Wizard Is Home | Offers: tea, drink 4 (Tome of Training) / an argument (elite next) |
| Wizard's Tower | `rare-old-apprentice` | The Oldest Apprentice | Offers: ask about dragons, drink 2 (lore) / borrow his hat (armor, +1 heart) |
| Sunken Coast | `rare-ghost-ship` | The Ghost Ship | Trial for the table: a shanty, everyone a line. Won: two items |
| Sunken Coast | `rare-mermaid-kiss` | A Mermaid's Kiss | Shrine, heal 3. "The drawer may not speak until their next turn." |
| Fire Caverns | `rare-dragon-egg` | The Dragon Egg | Monster fight at the elite need. Won: ally The Hatchling |
| Fire Caverns | `rare-forge-kings` | The Forge of Kings | Offers: reforge, 2 hearts (the depth's best weapon) / warm your hands (heal 1) |
| Frozen Pass | `rare-yeti-tea` | The Yeti's Tea Party | Moment, heal 2. "Everyone pours for their left neighbor." |
| Frozen Pass | `rare-old-slayer` | The Old Dragonslayer | Offers: listen, drink 3 (lore) / spar (elite next) |

Single-card stages:

| Stage | Chance | Rare |
| --- | --- | --- |
| Your adventurer | 0.06 | The Peasant, The Squire, The Mimic, moved out of the main pool (15 real classes remain) |
| The King's Summons | 0.05 | `summons-dragon-writes`: "'{dragon} here. Kindly stop sending heroes. I am out of room.' Read it as the dragon." |
| The Inn | 0.08 | `landing-mimic-inn` The Inn Is a Mimic (a fight; won: heal 3 and a potion). `landing-company-table` The Company's Table (they are asleep; take an item or draw on Bradley) |
| The Last Inn | 0.08 | `landing-widow` The Dragonslayer's Widow: offers Dragonbane (weapon, +2 to boss d20s) for a toast, or lore for a drink |
| The dragon | 0.04 each lair, once unlocked | Bartholomew |

**Hidden results (about 20).** One face of one card does something the rules line never mentions. The outcome's text says what happened; a gold "?" seal marks it. Each is a `reward` on a natural-20-only or natural-1-only outcome (or on doubles).

| Card | Roll | What happens |
| --- | --- | --- |
| Every mimic gamble (8) | Natural 1 | "It follows you home." Chester joins |
| The Black Knight (elite) | Natural 20 | "He kneels." A Hired Blade joins |
| The Bridge Troll (boss) | Natural 20 | "He pays you the toll." Lucky Coin |
| The Faerie Queen (boss) | Natural 1 | "She keeps your name." A curse: nobody may use the drawer's name |
| The Fortune Teller (Crypt) | Natural 20 | "She tells you how it ends." Lore |
| The Lich Lord (boss) | Natural 20 | "You drink his soul by mistake." Phoenix Feather |
| The Goblin King (boss) | Natural 1 | "You are crowned instead." A curse: everyone calls the drawer "Your Majesty" |
| Any 2d6 card in the Mines (3) | Double sixes | "The goblins cheer." Lucky Coin |
| The Archmage (boss) | Natural 20 | "He takes you on as a student." Tome of Training |
| The Old Dwarf (Mines) | Six | "He tells you about the dragon." Lore |
| The Wishing Well shrine | none; change to a d20 | Natural 20: "Your wish comes true." Heal to full |
| Sir Bradley's Charter (Gate) | Natural 20 | "The charter was yours all along." Hired Sword |

The count is 23 with the repeats. Each needs the card to have its own 20 or 1 outcome (`crit`, `fumble`), which the builders already support.

**The Lair's Door.** The pool becomes: five two-hit fights (First Through the Door, A Toast to the Company, Chadwick's Potions, The Victory Dance, The Rematch) and three new cards. Remove Sir Bradley's Invoice, The Company's Debts and Thaddeus's Horse. Which card is dealt is decided on arrival from the Company's record:

| Record (Gate, Crossroads) | Dealt |
| --- | --- |
| Won both | `closing-bradley-begs` Sir Bradley Begs: "Sir Bradley, alone, cape on fire, asks to join you." Plaques: "Take him · drink 2" (ally) / "Leave him" |
| Lost both | One of the five fights, and its need is 1 higher ("They are unbearable today") |
| Split | One of the five fights |
| Rare, any record, chance 0.1 | `closing-singed-capes` Singed Capes: "Three gold capes, smoking. They went in first. Everyone toasts them, briefly." Reward: Healing Potion. Or `closing-bard` The Company's Bard: "Their bard has seen enough. She'd rather write about you." Plaques: "Welcome her" (ally) / "Send her back" |

The stage banner changes from "The Company got here first" to "At the lair's door".

### 4.10 The road remembers (D6)

Some plaques and some fights set a **deed**, a short flag kept for the run. An **echo** is a card that is dealt only if a deed is held. The echo stage sits before the Lair's Door: it deals the echo of one held deed, chosen at random among those held, and is dropped when none applies.

| Deed | Set by | Echo (`echo-*`) |
| --- | --- | --- |
| `freed` | Gallows Tree: Free him | The Hanged Man Returns: "He was a thief. He's picked the lair's lock for you." Plaques: "Slip inside" (the Lair's Door is skipped) / "Knock anyway" |
| `rode-on` | Gallows Tree: Ride on | His Brother: an ambush, two hits. "He wants a word about the gallows." |
| `fairy-debt` | Fairy Court: Accept | The Fair Folk Collect: plaques "Pay · 1 heart" / "Pay · drink 5" |
| `feast-crashed` | Hunter's Feast: Sit down | The Lord Remembers: he sends wine. Heal 2. "Everyone toasts bad manners." |
| `hag-deal` | Hag's Bargain: Trade | The Hag Is Owed: a curse until the dragon falls: "The cursed player speaks only in questions." |
| `stiffed` | Ferryman: Stiff him | The Ferryman Waits: a trial. "Pay him now, in compliments, ten seconds." Lost: 2 hearts |
| `stole` | Goblin Market: Steal | The Goblin Posse: an ambush; won: Lucky Coin |
| `quest-taken` | The plea: Take the quest | A Gift from Home: "The village sent bread." Heal 2 |
| `quest-walked` | The plea: Walk on | The One You Left: "They did it themselves, and they're not speaking to you. Everyone drinks 2." |
| `ally-fell` | An ally dies | A Grave by the Road: "Everyone toasts {ally} by name." The dragon's first swing is rolled twice |
| `gate-won`, `gate-lost`, `crossroads-won`, `crossroads-lost` | The two Company fights | Read by the Lair's Door (4.9), not by an echo |

Ten echoes. `{ally}` is filled with the fallen ally's name.

### 4.11 The Chronicle (D7) and Heroic mode (D12)

A record across runs under its own key, `side-quest.chronicle.v1`. It is never part of a session save and a session never depends on it.

- **Counts:** runs played and won; dragons slain and dragons that won (per dragon); classes won with (of 18); allies met and allies lost; rare cards seen (of 24); landmarks seen (of 27); echoes seen (of 10); hidden results found (of 12 kinds, shown as "?" until found); the last 10 ballads with their dates.
- **Where it shows:** a "Chronicle" button on the setup screen when The Quest is the mode; a line on the end screen when a run adds something new ("New in the Chronicle: Tidewrack slain").
- **Unlocks (confirm D7):** Bartholomew can appear once 3 dragons have been slain. The Dragon King can appear once all nine have. Heroic mode (D12) once any run is won.
- **Heroic mode:** a toggle under The Quest on the setup screen: 2 fewer hearts, dragons have 1 more health, every region need is 1 higher. Wins are counted separately in the Chronicle.
- A table with no Chronicle (fresh install, cleared storage, Safari versus Home Screen app) simply starts from zero. Nothing breaks.

### 4.12 The ballad

The end screen writes four lines from the run. A pure function builds them so the Chronicle can keep a copy.

1. "A {class title at its current rank} left by {region 1},"
2. "felled {boss 1} and {boss 2}," (one boss: "felled {boss 1},"; none: "and fell on {region 1},")
3. First that applies: an ally died ("buried {ally} on the way,"); an ally lives ("with {ally} at their side,"); a deed (`freed`: "cut a stranger from the gallows,"; `stole`: "robbed the goblins blind,"; `quest-walked`: "left the {plea's person} to it,"); otherwise "alone, as heroes go,"
4. The end: "and slew {dragon} with {n} hearts to spare." Variants, first that applies: the last swing was a natural 20 ("and slew {dragon} with a single blow."); Sir Bradley was sent in on it ("and Sir Bradley took the credit."); a joke class won ("and the fool slew {dragon}, as foretold."); one heart left ("and slew {dragon} by a thread."); wiped at the lair ("and {dragon} sleeps on under {lair}."); wiped earlier ("and never saw {lair}.").

Each line at most 44 characters after filling, so four lines fit a phone at table distance; test with the longest names.

### 4.13 Moments

"Exists": no work. "Retheme": an existing view with new art or words. "New": a new view. Phase is where it is built.

| # | When | Moment | Status | What it looks like | Taps, length | Phase |
| --- | --- | --- | --- | --- | --- | --- |
| M1 | Card 1 turns | Your adventurer | Exists | The current reveal | As now | |
| M2 | The Summons turns | **The dragon revealed** | New | The screen dims to night. A wing's shadow sweeps across the whole screen with the tremor. The dragon's name burns in letter by letter in its color, kicker "WANTED", then "Lair: {lair}". Three unlit runes appear under the name and settle onto the strip. | Blocks, 3.5 s, tap skips | 3 |
| M3 | The Road Out and the Signpost turn | **The map opens** | New | The parchment unrolls. Passed stops are inked. Two regions light, each with its three words; the third is greyed with a small mark for why. The map holds for 2.5 s then rolls up to show the card and its two plaques. | Passes taps, 2.5 s | 5 |
| M4 | A road is taken; and the first card of every region | The road so far | New, small | The map as a strip across the middle, a quill line drawing to the new region, its name writing in. Replaces the plain region banner. | Passes taps, 2 s | 5 (until then the banner stays) |
| M5 | A landmark is dealt | Landmark | Retheme (stage banner) | Violet banner, kicker "Landmark", the place's name | As the banner | 3 |
| M6 | A rare card turns | Rare | New finish | A slow prismatic sheen over the whole card and one soft flash at its edge; the ribbon ends "· Rare" | Passes taps, 1 s | 6 |
| M7 | A region boss is dealt and falls | Entrance, spoils, the forge | Exists | As now. The forge's line gains the class's rank-up line ("Everyone roars.") | As now | 1 (the line) |
| M8 | Lore is found | **A rune lights** | New | The dragon's line in its color in the middle of the screen, kicker "You learn", then it shrinks into the next rune on the strip, which lights | Blocks, 2.5 s, tap skips | 4 |
| M9 | A dragon sign turns | **The shadow** | New, small | No banner. The wing shadow from M2 crosses the card once in the dragon's color, with the tremor | Passes taps, 1.5 s | 3 |
| M10 | An ally joins | **An ally joins** | Retheme (`join`) | The ally's name, kicker "Joins the party", an icon for its calling, its ritual under | Blocks, 2.5 s, tap skips | 4 |
| M11 | An ally is sent in | Send in | Retheme (`sendin`) | "Go, Gertie!" with the bonus beside the name | As the League's | 4 |
| M12 | An ally dies | **Fallen** | Retheme (`faint`), slower | The name in white on black, one candle lit under it, "Pour one out. The drawer drinks 2." On a last stand: kicker "Took the blow". The candle joins the row the wipe screen uses | Blocks, 3 s, tap skips after 1 s | 4 |
| M13 | Any Gilded Company card is dealt | **The Company arrives** | Retheme (entrance) | Three gold capes drop in as pennants, kicker "The Gilded Company", then the card's title | Blocks, 2 s, tap skips | 6 |
| M14 | The echo is dealt | **Someone remembers** | New, small | The screen warms to sepia for a beat, the earlier card's title shows faintly, then the echo's title over it | Blocks, 2 s, tap skips | 6 |
| M15 | The dragon is first dealt | **The lair** | New (extends the `final` entrance) | Black. One eye opens in the dragon's color and looks at the table. The name. The row of scales, the party's hearts under it, the lit runes between. "It's awake." | Blocks, 4.5 s, tap skips after 1 s | 2 |
| M16 | Each round's dragon card turns | **The dragon's move** | New | The move's name slams in ("FIRE BREATH") in the dragon's color with a flash from the top edge and the tremor, then clears to the card | Passes taps, 1.2 s | 2 |
| M17 | A scale breaks | A scale breaks | New, small | One scale on the strip cracks and drops; two on a natural 20 | Passes taps, 1 s | 2 |
| M18 | The enrage round is dealt | **Enraged** | New | The eye from M15 narrows; the screen's edge burns in the dragon's color and stays lit for the rest of the fight | Blocks, 2.5 s, tap skips | 2 |
| M19 | The swing that can kill is face up | Everyone stands | New, small | The card adds "Everyone stands." in gold above the rules. No animation | None | 2 |
| M20 | The dragon is slain | Slain, then the ballad | Retheme (ending) | The eye closes. The existing ending in the dragon's color. The ballad writes in line by line. A natural 20 adds "With a single blow" above the title | The ending plus about 4 s | 2 (ending), 3 (ballad) |
| M21 | A wipe | Fallen | Retheme (ending) | The existing candles with the dead allies' candles already lit; at the lair the eye closes over them. The ballad's last line under | As the ending | 3 |
| M22 | A hidden result is rolled | Something else happens | New, small | The outcome text appears in gold with a "?" seal; the Chronicle's counter ticks once in the corner if it is new | Passes taps, 1.5 s | 6 |
| M23 | A deed is set | Remembered | New, tiny | Three words under the card as it leaves: "This is remembered." | Passes taps, 1.2 s | 6 |

Rules for all, as for the current layer (`src/components/moments/`): read only from saved state; fire on a change between two snapshots, never on resume or undo; no particles under Reduce Motion (a still plaque instead); `aria-hidden` with a live-region line (`say`); each gets a case in `tests/moments.test.ts` and a spec in `tests/browser/moments.spec.ts` (plays once, not on resume, not on undo, still under Reduce Motion). Dragon colors live in one map by card ID in `src/presentation/`.

If moments must be cut: keep M15, M16, M2, M20, M12, M3, M8, M13, then the rest.

### 4.14 Cuts and fixes

- **Kits (D9).** Delete `dungeon/kits.ts`'s use (`applyKits`) and move each kit's number into its class's base effect and every rank. Keep the engine and validator `kit` paths for old saves. Remove "Wears X." from class rules.
- **Curse wording (F9).** "the jinxed player" becomes "the cursed player" in every Realms jinx rule. Update the convention in `src/content/CLAUDE.md` (Realms says cursed; the League never used jinxes).
- **Pub-skeleton cards (F8).** Rewrite the 22, keeping IDs.
- **Class rank lines (F6).** A `rankLines` map by class ID in `src/components/crawlTheme.ts` (display only): one line each for the 15 real classes and the three jokes.
- **Old Mother Mire** becomes Old Mother Brine ("older than the sea").

---

## 5. Engine and data specification

File and line references are to the tree at commit `2a79dbb`. Read each function before changing it.

### 5.0 Phase 0 refactor target

`src/game/engine.ts` (1,685 lines) holds everything. Split it, with **no behavior change**, into:

| New module | Moves there |
| --- | --- |
| `src/game/engine.ts` | Stays the public entry: re-exports everything below so no import elsewhere changes. Keeps `shuffle`, `paceQuest`, `repace`, `validConfig`, `createSession`, `replaySession`, `advance`, `currentCard`, `previousCard`, `findCard` |
| `src/game/crawl/stages.ts` | `questStages`, `questRoute`, `finaleCardIds`, `pickFinale`, `finaleStage`, `finaleCard`, `stageKind`, `wantedBoss`, `questRecord` |
| `src/game/crawl/party.ts` | `newParty`, `formEffect`, `partyBoons`, `stackEffects`, `omenEffect`, `omenForm`, `evolve`, `satchelSize`, `gainBoon`, `replaces`, `isLasting`, `hurt`, `settleParty` |
| `src/game/crawl/bosses.ts` | `isBossCard`, `bossBeat`, `atBeat`, `hitsNeeded`, `fells`, `fellingSwing`, `fellingVerdict`, `awaitingSpoils`, `spoilsOnWin`, `takeSpoils`, `skipSpoils` |
| `src/game/crawl/offers.ts` | `awaitingOffer`, `canTakeOffer`, `takeOffer`, `awaitingPress`, `pressOn`, `cashOut`, `PRESS_STEP` |
| `src/game/crawl/team.ts` | `TEAM_SIZE`, `partyTeam`, `teamMember`, `awaitingCatch`, `catchReplaces`, `catchIt`, `letGo`, the ball functions, `assistBonus`, `canSendIn`, `sendIn`, `dropFromBag` |
| `src/game/crawl/loot.ts` | `canUseLoot`, `spendLoot`, `DRAUGHT_*` |
| `src/game/crawl/discard.ts` | `discard`, `discardCard`, `settleBattle`, `skipRoll`, `natural` |
| `src/game/crawl/names.ts` | `withNames`, `withSecret`, `DRAGON` |

Proof of no change: `npm test`, `npm run typecheck`, `npm run lint`, both balance files, with the log line of each balance file (win rate, draws, per-class rates) **identical** to a run made on `main` before the split. Circular imports are the likely snag (`dice.ts` imports from `engine.ts` and the reverse); keep `engine.ts` as the only module `dice.ts` imports.

Add one helper while there: `stageCards(stage)` returning every card a stage snapshot holds (`cards`, `elite`, and later `rare`, `inserts`, `variants`). Use it in `finaleCard` (`engine.ts:372`) and `validateQuest` (`persistence.ts:132`), which today each list `cards` and `elite` by hand.

### 5.1 Types (`src/game/types.ts`), all additions optional

```ts
// CardDefinition
/** The dragon battle (Phase 2). A boss with `hits` (its health) and a d20. */
lairFight?: {
  calm: DragonMove[];      // exactly 6
  enraged: DragonMove[];   // exactly 6
  enrage: { rules: string; damage: number }; // Won/Lost contest
  lore: [string, string, string];
};
/** An ally this card can bring (Phase 4). */
ally?: { name: string; calling: (Encounter | "any")[]; bonus: number; ritual?: string };
/** A deed set when this battle is put aside (Phase 6). */
deed?: { won?: string; lost?: string };
/** Never dealt unless the key is unlocked (Phase 7). */
unlock?: string;

interface DragonMove {
  name: string;            // at most 18 characters; shown on the ribbon
  rules: string;           // at most 110
  damage?: 1 | 2;          // hearts, through `hurt`
  harder?: -2 | 2;         // added to the next swing's need
}

// reward (card level) and a new DiceOutcome.reward share one shape
interface Reward {
  loot?: Loot; heal?: number;
  lore?: true;             // Phase 4
  ally?: true;             // the card's `ally` joins (Phase 4)
  boon?: Boon;             // Phase 6
  jinx?: Jinx;             // a hidden curse (Phase 6)
}
// DiceOutcome
reward?: Reward;           // Phase 6: hidden results

// Offer
lore?: true;               // Phase 4
recruit?: true;            // the card's `ally` joins (Phase 4)
boon?: Boon;               // gear sold or given (Phase 3; kept as "<id>#o<index>")
jinx?: true;               // the card's `jinx` lands only on this plaque (Phase 3)
deed?: string;             // Phase 6
route?: 0 | 1;             // Phase 5
skip?: number;             // unchanged

// QuestStage
/** A card dealt at a fixed place among the picks (Phase 3): the landmark. */
inserts?: { at: number; cardIds: string[] }[];
/** Outside the pool; one may replace a pick at game start (Phase 6). */
rare?: { cardIds: string[]; odds: number };
/** Resolved when the stage is reached (Phase 6): the first group whose
 * deeds are all held deals one of its cards. */
variants?: { deeds: string[]; cardIds: string[]; harder?: number }[];
/** Dropped from the run when no variant applies (the echo). */
optional?: true;

// QuestSlot gains a third form (Phase 5)
| { choose: { card: QuestStage[]; routes: QuestStage[][] } }
// `card[i]` is the choice card for the pair that leaves out route i.

// QuestState.stages[] snapshot gains, beside `elite`:
rare?: CardDefinition[];
inserts?: { at: number; cards: CardDefinition[] }[];
variants?: { deeds: string[]; cards: CardDefinition[]; harder?: number }[];
optional?: true;
route?: number;            // which of a choice's two routes this stage belongs to
// QuestState
dropped?: QuestState["stages"]; // stages a choice or a Walk on removed (for a replay)

// PartyState
lore?: number;             // 0 to 3
deeds?: string[];
found?: string[];          // card IDs whose hidden result was rolled (for the Chronicle)
duel?: {
  move: number;            // 0 to 5: this round's move
  swings: number;          // swings made at this dragon
  harder?: number;         // on this round's swing
  contest?: true;          // this round is the enrage contest
  enraged?: true;
  prev?: number | "contest"; // the round just put aside, for Previous Card
};
// `team`, `assist`, `fainted` are reused for allies.

// GameConfig
heroic?: true;             // Phase 7
```

`SLOTS` is unchanged (allies are not gear).

### 5.2 The dragon battle (Phase 2)

Reuse the boss path instead of building a second one: a lair fight is a boss whose `hits` is its health and whose re-deals are rounds.

- **Content:** a builder `dragon(id, title, intro, swing, fight)` in `dungeon/shared.ts` returning a card with `battle`, `encounter: "boss"`, `hits: DRAGON_HEALTH` (new constant, 4), `damage: 1`, the d20 at `BOSS_NEED[2]` built from the four swing lines, and `lairFight`. No `phases`. The card's own `rules` stay the intro line ("A red dragon uncoils ... Roll d20.") so Standard and Infinite play it as today.
- **Sampling the move:** in `discardCard` (`engine.ts:1447`), wherever the next card to be current is a lair fight card (stepping onto it, `engine.ts:1584`, and each re-deal, `engine.ts:1510`), set `party.duel` with a move sampled from `random`. Rules: `enraged` once `party.hits >= Math.ceil(need / 2)`; the first round after `enraged` becomes true is `contest: true` (no move); `harder` is the previous round's move's `harder`; `swings` counts rolled rounds; `prev` is the round just played. A move index is `Math.floor(random() * 6)`, re-sampled once if it equals `prev` so no move repeats back to back.
- **Reading the card:** in `currentCard` (`engine.ts:882`), a lair fight card in a crawl with `party.duel` is returned with `ribbon: "<title> · <move name>"` (cut to 32) and `rules: move.rules`; on a contest round, `rules: enrage.rules` and no `dice`, so the existing Won/Lost plaques appear (`awaitingVerdict`). `previousCard` does the same from `duel.prev`. Without `party.duel` (plain modes, old saves) the card reads as written.
- **Settling a round:** `settleParty` (`engine.ts:1342`) already applies `damage` on a lost roll with the omen's `hurt.boss`. Add: the round's move `damage` through `hurt` (after the swing, so a Tower Shield blocks whichever comes first); a lost contest costs `enrage.damage`. A won contest counts as a hit (it already will: `outcome === "won"` adds to `hits`).
- **The kill wins ties:** in `discardCard`, when `hits >= need` and `next.hearts === 0`, set hearts to 1 before the wipe check.
- **Harder swings:** `rollBonus` (`dice.ts:162`) subtracts `party.duel.harder` for a lair fight; `rollTarget` then shows the right gem.
- **Health with omens:** `hitsNeeded` already adds `bossHits`.
- **Lore edge (Phase 4):** `cardEdge` (`engine.ts:836`) returns `"advantage"` for a lair fight when `duel.swings < (party.lore ?? 0)`. `rollDice` already rolls an edged d20 twice and saves `edge` and `dropped`.
- **Cleanup:** delete `party.duel` when the dragon falls or the party wipes.
- **Validator** (`validate.ts`): `lairFight` needs `battle`, `hits`, a single d20, no `phases`, exactly 6 and 6 moves, names at most 18 characters, rules at most 110, three non-empty lore lines. Old dragons with `phases` stay valid.
- **`validateParty`** (`persistence.ts:182`): `duel` only while the current card (or, when complete, the previous card) has `lairFight`; `move` 0 to 5; `swings` a whole number; `contest` and `move` consistent.
- **Balance bot** (`tests/dungeon.balance.test.ts`, `playRun`): on a contest round call `settleBattle` with a coin flip at 50%; otherwise roll as for any boss.
- **Remove** the eleven dragon entries from `dungeon/phases.ts` (`last-call-lich` to `the-morning-after`); their second beats are the raw material for the enrage contests.
- **Tests:** new `tests/lair.test.ts`: a move is sampled on the first deal and each re-deal; never the same twice running; a move's damage applies and a shield blocks it; enrage starts at half health and deals the contest once; `harder` moves the target; the kill at zero hearts leaves 1; a natural 20 breaks two scales; an old save's dragon (hits and phases, no `lairFight`) still plays to its end; plain modes read the card unchanged. Fixtures: `realms-lair-first-round`, `realms-lair-contest`, `realms-lair-enraged-roll-on-card`, `realms-lair-won`.

### 5.3 Stage shape: inserts (Phase 3)

- `pickFinale` (`engine.ts:239`): for a stage with `inserts`, pick `pick - inserts.length` cards from `cards` as now, then splice one random card from each insert's pool at its `at`. Keep the existing rule that a fork is never the stage's last pick, and add: never the pick directly before an insert (the loud door swaps `finale[step + 1]`, `engine.ts:1108`, and must not swap the landmark).
- `createSession` (`engine.ts:146`) snapshots `inserts`. `stageCards` covers them. `validateQuest` (`persistence.ts:140`) accepts a pick that is in an insert's cards at that insert's index.
- `validateCatalog` (`validate.ts:514`): `inserts[].at` inside `0..pick-1`, pools non-empty, `pick - inserts.length <= cardIds.length`, insert cards unique to the stage.
- Content: `floor()` in `dungeon.ts` takes the region's landmarks: `pick: 8, inserts: [{ at: 4, cardIds: ids(landmarks) }]`.
- UI: nothing new; the HUD's "encounter 5 of 8" is the landmark.

### 5.4 Offers that do more (Phases 3, 4, 6)

In `takeOffer` (`engine.ts:1075`), after the existing fields:

- `boon`: `gainBoon` with key `"<card id>#o<index>"`. `partyBoons` (`engine.ts:393`) and `validateParty`'s boon check (`persistence.ts:209`) learn the `o<digit>` form.
- `jinx`: set `party.jinx = card.id` only for that plaque. `settleParty` must then not lay a jinx for a card whose offers carry `jinx` (today a non-battle card's jinx lands whenever it is put aside, `engine.ts:1388`).
- `lore`: `party.lore = Math.min(3, (party.lore ?? 0) + 1)`.
- `recruit`: `joinTeam(party, card.id)` (the card must have `ally`).
- `deed`: append to `party.deeds` (no duplicates).
- Validator: offer labels stay at most 18 characters; `lore`, `recruit`, `jinx` are `true` only; `recruit` needs `card.ally`; `jinx` needs `card.jinx`; `boon` passes `goodBoon`; `deed` matches `/^[a-z-]{2,24}$/`.
- UI: `OfferPlaque` (`Crawl.tsx:600`) shows a seal for each new kind (a rune for lore, a figure for an ally, the gear icon for a boon, the curse star for a jinx).

### 5.5 Allies (Phase 4)

- `teamMember` (`engine.ts:570`) and `partyTeam` return cards with `ally` as well as caught Pokémon. A team entry is still a card ID.
- `canSendIn` (`engine.ts:788`): keep the typed branch exactly as it is. Add a branch for a member with `ally`: the card is a single-d20 battle not yet rolled, no `choice`, no `press` pull under way, and `ally.calling` includes the card's `encounter` or `"any"` (a gamble's encounter is `relic`; a lair fight's is `boss`).
- `assistBonus` (`engine.ts:776`): `member.ally.bonus` when present.
- Death on a lost send-in: `discard` (`engine.ts:1414`) already removes the member and sets `fainted`. Also append the deed `ally-fell`.
- Recruiting: `Offer.recruit`; `reward.ally` in `settleParty` for a card without `hits`; at a boss's fall (`engine.ts:1527`), `if (card.ally) next = joinTeam(next, card.id)` beside the existing `card.joins` line. `joinTeam` already drops the oldest past `TEAM_SIZE`.
- The last stand: in `discardCard` after the Phoenix Feather check (`engine.ts:1485`), if hearts are 0 and the team is not empty: remove the oldest member, set `fainted`, add `ally-fell`, hearts 1.
- The keeper also gives lore: at a keeper's fall, `party.lore + 1`. Mark keepers with `reward: { lore: true }` and apply a boss's `reward` only at its fall (today `settleParty` would apply a `reward` on every won swing; bosses have none, so make the rule explicit).
- `validateParty` (`persistence.ts:236`): a team member needs a `type` **or** an `ally`; same for `fainted`.
- UI: `SendInPlaque` (`Crawl.tsx:778`) and `sendInDoes` (`Crawl.tsx:804`) read the ally's name and bonus; the party dialog (`CrawlRecord`, `Crawl.tsx:1237`) gains an Allies section (name, calling, ritual, and fallen allies struck through); theme words in `crawlTheme.ts`.
- Bot: send an ally in when the roll's chance with the bonus is at least 55%, and always at the dragon.
- Tests: new `tests/allies.test.ts` (join, replace the oldest, send in by calling, not on a trial or 2d6 card, death on a loss, the last stand after a Feather, `any` calling); `tests/team.test.ts` must pass unchanged. Fixtures: `realms-ally-held`, `realms-ally-sent-in`, `realms-ally-fell`, `realms-last-stand`.

### 5.6 The road: choose slots (Phase 5)

- `questRoute` (`engine.ts:220`): for a `choose` slot pick which route is left out (uniform, `i` of 3), then return `[card[i], ...routeA (tagged route 0), ...routeB (tagged route 1)]`. `questStages` and `finaleCardIds` list every stage of every route and every choice card.
- `takeOffer`: `route: r` drops every later stage tagged with the other route, with their picks, exactly as `skip` does (`engine.ts:1120`), and clears the tag on the kept ones. Move dropped stages to `quest.dropped`.
- Fix F12: `skip` also moves its dropped stages to `quest.dropped`, and `replaySession` (`engine.ts:1640`) rebuilds `stages` from `stages` plus `dropped` in their original order before `pickFinale`. Record each stage's original index in the snapshot (`at`) so the order can be restored.
- `validateQuest`: unchanged in principle (a stage is a stage); allow the optional `route`, `at` and `dropped`.
- `{lair}` and `{dragon}` must not depend on undecided stages: both come from the last `oneOf`, which is not a choice.
- Content (`dungeon.ts`): depth 1 and depth 2 become `{ choose: { card: [three choice stages], routes: [three routes] } }`. The plea's `skip: 2` now counts past the Signpost; put the Signpost **after** the side quest's stages so the count stays 2.
- UI: a `QuestMap` component (inline SVG, no image assets) used by the party dialog and by M3 and M4. Region positions and the three words come from a map in `crawlTheme.ts` keyed by stage label.
- Bot: picks a route at random.
- Tests: `tests/road.test.ts` (two of three offered, uniform over many seeds; taking one drops the other and every count still adds up; a save before and after loads; a replay after a choice and after a Walk on restores all stages). Fixtures: `realms-road-choice-waiting`, `realms-road-chosen`.

### 5.7 Rares, hidden results, deeds, echoes (Phase 6)

- **Rares.** `pickFinale`: after a stage's picks, with probability `rare.odds`, replace one pick that is not a fork, not an insert and (when the stage has more than one pick) not the last, with a random rare. A one-pick stage just replaces its pick. Snapshot `rare`; `stageCards` covers it; `validateQuest` accepts a pick found in `rare` (at most one per stage). `cardFinish` (`detect.ts`, end of file) returns `"prism"` for a card in its stage's `rare`.
- **Unlocks.** `createSession(config, catalog, packs, random, unlocked = new Set())` drops any card with an `unlock` key not in the set from pools and rares before picking. The caller (`main.tsx:150`, `:165`) passes the Chronicle's unlocks.
- **Hidden results.** `settleParty`: when the card has dice and a returned roll, find the outcome the roll resolved to (the same lookup `resolveInstruction` in `dice.ts` uses, and the doubles line when it applied) and apply its `reward` through the same code as a card's `reward`. Record the card ID in `party.found`. `validateDice` (`dice.ts`) accepts `reward` on an outcome only when that outcome covers exactly one face (or is the doubles line), so a hidden result is always a single roll. `tests/naturals.test.ts` must still pass: `withNaturals` rewrites outcome text; make sure it carries `reward` through.
- **Deeds.** `Offer.deed` (5.4); `card.deed.won` and `.lost` appended in `settleParty` by outcome.
- **Variants and the echo.** New `resolveStage(q, random)` called in `discardCard` when `step` moves onto the first card of a stage that has `variants`: find the groups whose `deeds` are all in `party.deeds`; none and `optional`: drop the stage (move it to `dropped`, remove its pick); none and not optional: keep the pick made at game start from `cards`; otherwise pick a group at random among those that match, set `finale[step]` to a random card of it, and remember `harder` in the stage snapshot (`harder?: number`, read by `rollBonus` for that card). Because the result is written into `finale` at once, a reload never re-resolves.
- The Lair's Door: `cards` are the five fights; `variants`: `[{ deeds: ["gate-won", "crossroads-won"], cardIds: [bradley] }, { deeds: ["gate-lost", "crossroads-lost"], cardIds: fights, harder: 1 }]`; `rare: { cardIds: [capes, bard], odds: 0.1 }` (a rare, picked at game start, wins over a variant).
- The echo stage: `{ label: "An Echo", pick: 1, cardIds: [all ten], optional: true, variants: [one group per deed] }`.
- An echo that skips the door uses `Offer.skip: 1`.
- `validateParty`: `deeds` an array of short strings without repeats; `found` IDs of cards already dealt; `lore` 0 to 3.
- Tests: `tests/rare.test.ts`, `tests/deeds.test.ts`. Fixtures: `realms-rare-in-play`, `realms-hidden-result`, `realms-deed-held`, `realms-echo-dealt`, `realms-door-humbled`.

### 5.8 The Chronicle and the ballad (Phases 3, 7)

- `src/game/ballad.ts`: `ballad(session): string[]` (pure; uses `questRecord`). Unit tests cover every variant and the 44-character limit with the longest names.
- `src/game/chronicle.ts` (pure):

```ts
interface Chronicle {
  version: 1;
  runs: string[];                    // keys of runs already counted (last 60)
  played: number; won: number; heroicWon: number;
  slain: Record<string, number>;     // by dragon card ID
  fellTo: Record<string, number>;
  classesWon: string[]; allies: string[]; alliesLost: string[];
  rares: string[]; landmarks: string[]; echoes: string[]; secrets: string[];
  ballads: { at: string; won: boolean; lines: string[] }[]; // last 10
}
recordRun(c: Chronicle, s: SessionState, at: string): Chronicle  // idempotent
unlocks(c: Chronicle): Set<string>
```

  A run's key is a hash of `finale.join()` plus the adventurer's ID. `recordRun` adds the "seen" sets at any time and the counts only once, when the session is complete and its key is not in `runs`.
- `src/app/persistence.ts`: `loadChronicle`, `saveChronicle` under `side-quest.chronicle.v1`, with try/catch, a shape check, and a reset of the Chronicle alone when it is malformed. Call `recordRun` wherever the session is saved (`main.tsx`), only for `config.quest === "dungeon"`.
- `src/screens/Chronicle.tsx`, lazy-loaded from the setup screen.
- Heroic: `GameConfig.heroic`; `validConfig` (`engine.ts:96`) accepts it only with `quest`; `createSession` starts the party with 2 fewer hearts; `hitsNeeded` adds 1 for a lair fight; `rollBonus` subtracts 1 on a region fight. A fixture: `realms-heroic-mid`.

### 5.9 Save size (optional, any phase after 0)

A stage snapshots its whole pool. After this plan a run holds two extra region pools (the roads not yet ruled out), the rares, the variants and the choice cards: roughly 265 KiB grows to about 400 KiB, written on every tap. If a phone shows lag on a tap, snapshot only what the run can still deal: the picks, the `elite` pool, the `rare` pool, the `variants` pools. `validateQuest` already requires only `pick <= cards.length` and picks inside `cards`. The cost: the offline `replaySession` fallback then replays the same cards. Measure first (`tests/fixtures/saves` sizes); do it only if needed.

---

## 6. Content inventory

Every item is a card to write or edit. New cards need an `imprint.ts` entry, a clean ID, and must pass `validate-content.ts` (title at most 22 characters and 15 per word; rules at most 100 characters and 20 words; says who acts) and `tests/card-logic.test.ts`. Read `docs/AUTHORING.md` and `docs/CARD_VOICE_REFERENCE.md` first. World straight; the joke in the outcome line.

| Group | Count | File | Phase |
| --- | --- | --- | --- |
| Curse wording ("cursed player") | about 45 rules | `jinxes.ts`, region files, `bookcase.ts`, `lastcall.ts` | 1 |
| Pub-skeleton rewrites (F8) | 22 | region files, `phases.ts` | 1 |
| Kits folded into classes | 16 classes | `classes.ts`, `kits.ts` | 1 |
| Gambles removed | 16 | region files | 1 |
| Fuse and act-it-out cards removed | 4 + 4 | region files | 1 |
| Treasures, merchants, forks varied | 18 + 18 + 9 | region files | 1 |
| Region mixes (4.8) | pool edits | region files | 1 |
| Old Mother Brine; Tidewrack | 1 edit, 1 new | `lastcall.ts` | 1 |
| Dragons as lair fights | 9 (4 swing lines, 12 moves, 1 contest, 3 lore each) | new `dungeon/dragons.ts` | 2 |
| Summons rewritten | 6 | `summons.ts` | 3 |
| Dragon signs | 6 new | new `dungeon/signs.ts` | 3 |
| Landmarks | 18 new | new `dungeon/landmarks.ts` | 3 |
| Approaches | 9 new | `dungeon/landmarks.ts` | 3 |
| Last Inn text names `{dragon}`; inns get a third plaque | 16 edits | `landings.ts` | 3 (text), 4 (plaques) |
| Class rank lines | 18 lines | `crawlTheme.ts` | 1 |
| Allies | 11 definitions | `bookcase.ts`, `landings.ts`, `landmarks.ts`, `lastcall.ts`, rares | 4 |
| Lore plaques wired | on signs, Last Inns, 3 Approaches, 2 landmarks | as above | 4 |
| Road choice cards | 6 new | new `dungeon/roads.ts` | 5 |
| Regional rares | 18 new | new `dungeon/rares.ts` | 6 |
| Single-stage rares | 5 new; 3 classes moved | `rares.ts`, `classes.ts` | 6 |
| Hidden results | about 23 outcome edits | region files, `lastcall.ts` | 6 |
| Lair's Door | 3 removed, 3 new | `lastcall.ts` | 6 |
| Echoes | 10 new | new `dungeon/echoes.ts` | 6 |
| Bartholomew, the Dragon King | 2 new lair fights | `dragons.ts` | 7 |

About 95 new cards, about 150 edits, 37 removals. After each content phase: `npm run content:manifest`, `npm run cards:review`, update the counts asserted in `tests/workshop.test.ts`, `tests/dungeon.test.ts` and `tests/dungeon.balance.test.ts` (it asserts 18 adventurers, 20 omens, 9 regions, 5 side quests), and the tables in `src/content/CLAUDE.md` and `AGENTS.md`.

---

## 7. Phases

One phase is one session and one pull request. Start each session by reading `AGENTS.md`, the top of `docs/STATUS.md`, then this file's section for the phase and the parts of sections 4 to 6 it names. End each by updating `docs/STATUS.md` (what changed, what was checked, what was not, the next phase) and ticking the phase here.

**The gate, every phase:** `npm test`; `npm run lint`; `npm run typecheck`; `npm run cards:review`; `BASE_PATH=/side-quest/ npm run build` (budgets); `npm run test:balance` (both files; the League's numbers must not move in any phase); `CI=1 BASE_PATH=/side-quest/ TEST_PORT=4398 npm run test:e2e -- --workers=2` and `test:sweep` in Chromium. New saved state: `npm run fixtures:saves` and `tests/save-fixtures.test.ts` green with every old fixture untouched. Say exactly what ran and what did not (WebKit runs only in CI; no phone).

**Quest balance bands to hold after every phase:** won 18 to 40% (aim for 25 to 32%); every class, omen, side quest and region 10 to 50%; joke classes 1 to 10%; a won run's mean draws under the ceiling the owner confirms (D10). New bands to add when their feature lands: every dragon 12 to 45%; every road pair within 8 points of each other; runs that reach the dragon 45 to 65%; mean lore at the dragon 1.0 to 2.0; at least one ally alive at the dragon in 30 to 60% of runs that reach it.

- [ ] **Phase 0: split the engine.** 5.0. No behavior change. Done when the gate passes and both balance logs match `main` exactly.

- [ ] **Phase 1: copy, cuts and lairs.** Content only. 4.14 (kits, curse wording, the 22 rewrites, rank lines), 4.8's de-template and mixes, 4.3's lairs: the last three finale slots in `dungeon.ts` become one `oneOf` of three routes `[lair region, Lair's Door, that lair's dragons]`; Tidewrack added as an ordinary three-hit boss for now; Old Mother Brine. Retune after the kits change (classes will move). Done when the gate passes and each class is back inside its band.

- [ ] **Phase 2: the dragon battle.** 4.4, 5.2, moments M15 to M20 (the ending part). Nine dragons rewritten as lair fights in `dungeon/dragons.ts`. The strip's scale row in `CrawlStrip` (`Crawl.tsx:308`). Add the dragon bands. Confirm D10 with the measured length. Done when a run can be played to a kill and to a wipe in the browser, `tests/lair.test.ts` and the four fixtures are in, and the gate passes.

- [ ] **Phase 3: structure and names.** 4.3 (`{lair}`, name filling everywhere, the Summons, the signs), 5.3 (inserts), 4.8 (27 landmarks and Approaches), `Offer.boon` and `Offer.jinx` (5.4), the ballad (4.12, `ballad.ts`), moments M2, M5, M9, M20's ballad, M21. Lore plaques are written now but give nothing until Phase 4: until then a lore plaque gives a Lucky Coin (a one-line switch in the builder). Fixtures: a run inside a landmark, a run ended with a ballad. Done when the names test, the gate and the fit sweep pass.

- [ ] **Phase 4: lore and allies.** 4.5, 4.6, 5.4 (`lore`, `recruit`), 5.5, the runes on the strip, the inns' third plaques, moments M8, M10, M11, M12. Add the lore and ally bands. Expect the win rate to rise; retune `NEED[2]`, `BOSS_NEED[2]`, `DRAGON_HEALTH` or `PARTY_HEARTS`. Done when `tests/allies.test.ts`, the fixtures and the gate pass and `tests/team.test.ts` is unchanged.

- [ ] **Phase 5: the map and the road.** 4.7, 5.6 (including the F12 fix), `QuestMap`, moments M3, M4. Add the road-pair band. Done when `tests/road.test.ts`, the fixtures and the gate pass.

- [ ] **Phase 6: rare things.** 4.9, 4.10, 5.7, moments M6, M13, M14, M22, M23. The balance test forces each joke class and each rare (deal it directly, as its `deal` helper does) instead of waiting on odds. Done when `tests/rare.test.ts`, `tests/deeds.test.ts`, the fixtures and the gate pass.

- [ ] **Phase 7: the Chronicle.** 4.11, 5.8, Bartholomew and the Dragon King, Heroic mode if D12 stands. Done when a Chronicle survives a reload, a malformed one resets alone, a session save never references it, and the gate passes.

- [ ] **Phase 8: the owner's table.** Not code. The owner plays two full runs on a phone and reports: does the last half hour drag, do the allies die too fast to love, is the dragon's turn slow in the hand, does the map read at arm's length. Tune from that. Record device results in `docs/DEVICE_CHECKLIST.md`.

**Docs to keep in step as phases land:** `AGENTS.md` (the Realms paragraph and constraints), `src/content/CLAUDE.md`, `src/game/CLAUDE.md`, `src/app/CLAUDE.md` (the Chronicle key), `docs/AUTHORING.md` (new card kinds and plaque fields), `tests/CLAUDE.md`, the in-app guide (`Guide.tsx`: rows for Allies, Lore, The dragon, The map), `scripts/save-fixtures.ts`, `scripts/table-play.ts`.

---

## 8. Risks and open questions

- **Size.** About 95 new cards, 150 edits, one new card kind, six new pieces of saved state, about 17 new or rethemed moments. Phases 2, 4, 5 and 6 each touch `parseSession`. Tests and fixtures first, every time.
- **Shared engine.** Allies extend the League's team functions and Phase 0 moves them. If the League's balance log changes at all on the same seeds, stop and find out why.
- **Too many systems.** See the complexity check in section 3 and its cut order.
- **Allies may die too fast to matter.** With +3 a send-in still loses a third of the time. If Phase 8 says so, the fix is cheap: a lost send-in wounds first (one more field), or the bonus rises.
- **The last stand may make runs too safe.** Two allies are two extra lives. Tune with hearts, or limit it to one per run.
- **Length.** About 58 to 64 draws plus the battle's pace. Only a real table can say if it drags.
- **Balance drift.** Almost every phase moves the win rate. Retune at the end of each phase, not at the end of the project.
- **Budget.** Moments CSS is already 5,401 lines. Expect to need D11.
- **Unverified reads.** These are true as read at `2a79dbb` but were not executed: that `spoils` works on a card with `dice.choice` (needed by The Thing Below); that the stage banner can take filled names; that `withNaturals` preserves unknown outcome fields; that `reuseExistingServer` and the workshop's `?moments=1` stage need no change for new moment kinds. Check each when its phase reaches it.
- **No device evidence.** Every moment is a design on paper. Emulated WebKit is not an iPhone.
- **Humor is unproven.** The example cards are drafts in the house voice, checked against length rules by eye. Several plaque labels in the tables are longer than the 18-character limit and are written as intent, not final copy.
