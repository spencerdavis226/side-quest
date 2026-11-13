# The Quest 2.0: review and execution spec

Written 2026-11-13 from a full read of the Realms pack (all 586 cards, `src/content/dungeon/`, `src/content/dungeon.ts`), the engine (`src/game/engine.ts`, `types.ts`), the moments layer (`src/components/moments/`) and the League for comparison. **Nothing here is implemented.** This file is the handoff for whoever executes it; `docs/STATUS.md` points here. Owner decisions are listed in section 3 and must be answered before Phase 2.

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

---


## 3. Scope and owner decisions

**Revised 2026-11-13 (owner: "You don't need to propose only what the engine can cheaply support. I'm fine with major engine rewrites").** The first draft of this plan held itself to existing engine fields. This version does not. What still binds, from `AGENTS.md`: saved games must keep loading (every new field optional, fixtures added, none edited), the pure engine stays free of rendering, session schema v2 and its storage key stay, and the release budgets hold unless the owner raises them.

| # | Decision | Recommendation | Why |
| --- | --- | --- | --- |
| D1 | The table chooses the road for regions 1 and 2 (two of three offered), on a map. On 2026-11-03 the owner decided "regions stay random". | **Choose.** | The clearest break from Pub Crawl, and the map becomes the mode's own screen. |
| D2 | Each dragon has a lair region, so region 3 is known from card 3. | **Yes.** | "Emberfang, under the Fire Caverns" is a destination. |
| D3 | The dragon fight becomes a battle: the dragon has health and takes its own turns. | **Yes. Build this first.** | It is the peak of the run and the largest single gain. |
| D4 | Allies: up to two named companions who can be sent into a fight and can die. | **Yes.** | The Quest's answer to the League's team, with its own flavor. |
| D5 | Dragon lore: up to three things learned about the dragon on the road, each an edge in the final battle. | **Yes.** | Gives the road a purpose and the choices a reason. |
| D6 | The road remembers: some choices come back later in the run. | **Yes, small (8 pairs).** | The most talked-about kind of surprise, and it only costs writing once the flag exists. |
| D7 | The Chronicle: a record across runs (dragons slain, allies met, rares seen) that also unlocks a few things. | **Yes to the record. Unlocks: owner's call.** | The reason to play run 15. Some tables dislike locked content. |
| D8 | Joke classes become rare (about 6% of runs, down from 17%). | **Yes.** | Keeps the joke, removes the planned loss one run in six. |
| D9 | Cut starting gear (kits) and cut gambles from 4 to 2 a region. | **Yes.** | Less to read on card 1; room for the new cards. |
| D10 | Run length. Today a won run is about 52.6 draws and the test caps the mean at 55. This design is about 56 to 60. | **Raise the cap to 62.** | The League's won run is 60 to 70. |
| D11 | Runtime budget: 3,874 of 4,096 KiB used. | **Expect to ask for 4.5 MiB.** | The map, the battle and about 110 new cards will not fit in 220 KiB. Measure first. |

Still not proposed, because the owner cut or declined them: region rules, signature powers, knacks, two-path levels, a hero draft, a gold currency, a player roster.

**Complexity check.** The 2026-10-31 cuts were about systems getting in the way of cards. This plan adds four things a player has to understand: pick a road, send an ally in, lore runes, and the dragon's turn. Each is one tap or none, and three of the four reuse a gesture the League already taught (a choice plaque, Send in, a chip on the strip). The rest (rares, echoes, the Chronicle, the ballad) need no explaining at the table. If it proves too much in play, cut in this order: lore first, then echoes, then allies. Keep the battle and the map.

---

## 4. The design

### 4.1 Pillars

1. **The dragon is the spine.** Named with its lair on card 3, seen on the way, learned about, then fought in a battle unlike any other card.
2. **The table steers.** A map, two road choices, a landmark in every region, and choices that come back.
3. **Allies.** Named companions picked up on the road, sent into fights, and lost for good when it goes wrong.
4. **Rare things.** Rare cards, hidden results on natural 20s and 1s, echoes, and a Chronicle that counts what a table has seen.
5. **The ballad.** The end screen writes the run as four lines.

### 4.2 The run

Card counts in brackets.

**Act 0: The Call**

1. Your adventurer [1]
2. The omen [1]
3. The King's Summons [1]: names `{dragon}` and `{lair}`
4. The City Gate [1]: the Gilded Company, one fight (the result is remembered)

**Act I**

5. The Road Out [1]: the map; pick one of two regions
6. Region 1, first half [4]
7. **Landmark** [1 of 3 for that region]: a choice, sometimes remembered
8. Region 1, second half [3]
9. Region boss [1, two beats]: spoils, rank up
10. **Dragon sign** [1 of 6]: `{dragon}` passes over; a chance at lore
11. The Inn [1]: rest, stock up, or hire
12. Side quest plea [1]: take it (2 guards, a keeper; the rescued one joins as an **ally** and tells you **lore**; rank up) or walk on

**Act II**

13. The Signpost [1]: the map; pick one of two regions
14. Region 2: 4, landmark, 3, boss (spoils, rank up)
15. The Last Inn [1]: rest, stock up, or ask about `{dragon}` (lore)
16. The Crossroads [1]: the Company, one fight (remembered)

**Act III**

17. The lair region (fixed by the dragon), first half [4]
18. **The Approach** [1 of 3 for that lair]: the lair's landmark
19. The lair region, second half [3]
20. **An echo** [0 or 1]: someone from earlier in the run comes back
21. The Lair's Door [1]: the Company's payoff, decided by how the two earlier meetings went
22. **The dragon battle** [about 7 rounds]
23. The ending and the ballad

A region stays at 8 cards plus its boss: the landmark replaces one of today's 8 rooms.

### 4.3 The dragon

**Lairs.** Nine dragons, three per lair. One is new.

| Lair (region 3) | Dragons |
| --- | --- |
| Fire Caverns | Emberfang, Gorgrath the Hungry, Ashmaw the Ancient |
| Frozen Pass | Rimeclaw, Stormcrown, Glimmerwing |
| Sunken Coast | Old Mother Mire (retitle **Old Mother Brine**, "older than the sea"), The Whispering Wyrm, **Tidewrack** (new: a sea serpent that wrecks ships for their bells) |

**`{lair}`.** A second placeholder beside `{dragon}`. Fill both in rules, dice outcome lines, phase text and stage banners (today `withNames` covers `rules` only). Add a unit test that fills every dragon and lair into every card that uses them and checks the 100-character limit, since `validate-content.ts` only sees the unfilled text.

**Summons.** Rewrite the 6 so each names both, for example "WANTED: {dragon}. LAST SEEN: {lair}. REWARD: half the kingdom. Everyone toasts the reward."

**Dragon signs (6, pick 1, after the first region boss).** No fight. The table does one thing, then one plaque offers lore at a price. Examples:

- The Shadow: "A shadow crosses the sun: {dragon}. Everyone ducks. Last head down drinks 2." Plaques: "Watch how it flies · drink 2" (lore) / "Keep your head down".
- A Scale: "A scale the size of a shield, fallen from {dragon}." Plaques: "Study it · drink 2" (lore) / "Wear it" (Tower Shield).
- The Fleeing Knights: "Knights gallop past the wrong way, shouting '{dragon}!'" Plaques: "Stop one · lose 1 heart" (lore) / "Let them run".

**The Approach (3 per lair, pick 1, mid region 3).** Written for the place, naming `{dragon}`. Examples:

- Fire Caverns, The Bone Road: "Armor, all of it empty, all the way down to {dragon}." Plaques: "Take a shield · drink 2" / "Read the last knight's journal · lose 1 heart" (lore).
- Frozen Pass, The Frozen Army: "A hundred knights in ice, swords up, facing {dragon}'s peak." Plaques: "Chip one out · lose 1 heart" (ally: The Frozen Knight) / "Salute and pass" (heal 1).
- Sunken Coast, The Bell Reef: "Ships' bells, hung on the reef by {dragon}." Plaques: "Ring one" (elite next) / "Row past".

### 4.4 Dragon lore (D5)

Up to three things the party learns about its dragon. Shown as three runes on the strip beside the hearts, lit as they are found.

- **What it does:** in the dragon battle, each lore makes one of the party's swings a sure thing to aim: that swing is rolled twice and the better die kept (the League's `edge` roll already does this). Lore is spent one per swing from the first swing on, automatically. Nothing to remember, nothing to tap.
- **What the table sees when it is found:** a line written for that dragon. Each dragon has three, used in order: its **weak scale**, its **fear**, its **true name**. For Emberfang: "Its left wing never healed." / "It hates the sound of bells." / "Its true name is Cinder, and it hates it."
- **Where it comes from:** the dragon sign (a plaque), the side quest (whoever you rescue knows something: guaranteed), the Last Inn (a third plaque, "Ask around · drink 3"), some Approaches, two rares. A typical run finds one or two; three takes a table that pays for it.
- **Engine:** `party.lore?: number`; `Offer.lore?: true`; `reward.lore?: true`; the dragon card carries `lore: [string, string, string]`.

### 4.5 The dragon battle (D3)

Today the dragon is a boss with three hits: the same card dealt until three wins. Replace it with a battle that no other card has. Region bosses, keepers and the Company stay as they are, so this stays special.

**How it plays.** The dragon has health (start at 4; tune). Rounds alternate:

1. **The party's swing.** The next drawer rolls a d20 against the dragon's need. A hit takes 1 health (a natural 20 takes 2). A miss costs drinks, as the dragon's line says. Lore applies (4.4). An ally can be sent in (4.6).
2. **The dragon's turn.** The app rolls for the dragon, on screen, and it makes one of its six moves. Each dragon has its own six. A move is a line for the whole table, and some cost hearts. Then the phone passes.

At half health the dragon **enrages**: one set-piece contest for the whole table (the current second beats are the raw material, rewritten so each is something only that dragon would ask), and its move list swaps to a meaner six.

At zero health the dragon is slain. Everyone stands for the swing that can kill it.

**A move list, as an example (Emberfang):**

| d6 | Move | Line | Hearts |
| --- | --- | --- | --- |
| 1 | Fire breath | "Everyone drinks 2. Anyone holding a drink up as a shield drinks 1." | 1 |
| 2 | Tail swipe | "The drawer's two neighbors drink 3." | 0 |
| 3 | Takes flight | "The next swing needs 2 more." | 0 |
| 4 | Gold fever | "Everyone points at the greediest player. They drink 3." | 0 |
| 5 | Roar | "Last to cover both ears drinks 3." | 0 |
| 6 | Inferno | "Everyone drinks 3." | 2 |

Each of the nine dragons gets two lists (calm, enraged) with a different personality: Glimmerwing's moves are vanity (compliments, mirrors), the Whispering Wyrm's are secrets and silence, Gorgrath's take drinks off the table, Stormcrown's are timing games. This is where nine dragons become nine different endings.

**Numbers to start from (unmeasured).** Health 4, need 13, about half of swings hit with typical bonuses: about 7 rounds. Moves average about 0.5 hearts a round calm and 0.8 enraged. Tune so the win rate stays in the band and a table reaches the dragon with about half its hearts.

**Engine.** A new card kind and a small state machine, in its own module:

- `CardDefinition.lairFight?: { health: number; need: number; calm: Move[]; enraged: Move[]; enrage: Phase; lore: [string, string, string] }`, `Move = { name, rules, damage?, harder? }`.
- `party.duel?: { health: number; turn: "party" | "dragon"; move?: number; harder?: number; enraged?: true }`. The dragon's roll is committed in the engine before any animation, like every other roll.
- Functions: `awaitingDragon`, `dragonTurn` (samples the move, applies hearts through `hurt` so shields and the Phoenix Feather work), `swing` (wraps `rollDice` with lore and ally bonuses), `duelOver`.
- `discarded` keeps adding up: each round counts as one draw (reuse `party.rounds`).
- Old saves hold dragons with `hits` and `phases`; that path stays and those runs finish under the old rules.
- Plain modes (Standard, Infinite) still need the dragons as ordinary one-roll cards: keep the card's own `rules` and `dice` as today, and let `lairFight` apply only in a crawl.

### 4.6 Allies (D4)

Up to two named companions travel with the party. This generalizes the League's team (`party.team`, `sendIn`, `fainted`) from Pokémon types to the Quest's encounter kinds.

- **Calling.** Each ally has one kind of card it is good at: monsters, traps, ambushes, relics and gambles, elites, or bosses (the dragon counts as a boss).
- **Send in.** When a d20 fight of that kind is face up, a plaque offers to send the ally in: +3 to the roll (+5 for the rare ones).
- **And it can die.** Win, and the ally stays. Lose, and the ally is gone for the rest of the run, with its own moment and a drink poured out. The table decides each time whether the roll is worth the goat.
- **A ritual.** Each ally has one spoken line the table keeps while it lives. This is the charm; the numbers are small.
- **Two at most.** A third replaces one, by the table's pick.

| Ally | From | Calling | Ritual |
| --- | --- | --- | --- |
| Gertie the Goat | Witch's Cottage side quest | Traps (she goes first) | "Everyone bleats when the party heals. Silent: drink 1." |
| Coin, the Merchant's Mule | Bandit Fort side quest | Ambushes (he kicks) | "Whoever uses an item pats the table twice first, for the mule." |
| Mort, a Talking Skull | Old Barrow side quest | Relics and gambles | "Before any gamble, the left neighbor gives advice as Mort." |
| Pip, the Cabin Boy | Drowned Shrine side quest | Monsters | "The table shouts 'Pip!' at every monster. Last drinks 1." |
| Durla Ironbraid | Sunless Vault side quest | Bosses | "Everyone clinks before a boss swing." |
| A Hired Blade | The Inn ("Hire · drink 3") | Elites | None. Cheap, replaceable, and it knows it. |
| The Frozen Knight | Frozen Pass approach | Bosses | "He says 'for the king' before every swing. So does the drawer." |
| The Hatchling (rare, +5) | The Dragon Egg | Bosses | "Everyone coos when it is named." |
| Chester, a Friendly Mimic (rare, +5) | A natural 1 on any mimic gamble | Relics and gambles | "Chester holds one item. Nobody else may touch the satchel." |
| The Company's Bard (rare) | The Lair's Door | Any fight, +2 | "She narrates. The drawer may not describe their own roll." |
| Sir Bradley | The Lair's Door, when the Company is humbled | Bosses | "He takes the credit. Everyone says 'well done, Bradley'." |

Sir Bradley can be sent at the dragon, and can die there. That is the Company's story ending properly.

**Engine.** `CardDefinition.ally?: { name; calling: Encounter[]; bonus: number; ritual: string }`; `Offer.recruit?: true`; a keeper's fall recruits its side quest's ally; `canSendIn` reads the calling when the pack has no types; the existing `assist` and `fainted` fields carry the rest. The League's behavior must not change (its tests and balance bands are the guard).

This replaces the "companion slot" of the first draft. Gear keeps its three slots.

### 4.7 The map and the road (D1)

**The map** is the Quest's own screen, as the badge case is the League's. A parchment with the City Gate at the bottom and the lair at the top, three regions in each of the first two rows, the inns between, the lair named and marked with the dragon from card 3. It shows in the party dialog at any time and plays as a moment at each region's start.

**The choices.** At the Road Out and the Signpost the map opens with two of the three regions lit. Each shows its name and three words for what it leans on (4.8). The table taps one. The third region is "closed" for a stated reason on the card (a flood, a toll war, a collapsed tunnel), so the limit reads as story.

**Engine.** Two workable models; pick one after reading `createSession` and the save checks:

- *Drop the road not taken.* Each depth's slot holds a choice card and both regions' stages, all picked at game start; the plaque drops the other region's stages (generalize `Offer.skip` to `{ after, count }`). Smallest change; every count still adds up.
- *Resolve on arrival.* The run keeps unresolved slots and picks a region's cards when the table chooses. Cleaner for a real map and for rares that depend on what has happened, but `finale`, `discarded` and `parseSession` all assume the whole run is known at the start.

Recommended: the first, unless echoes and the Chronicle's unlocks (4.10, 4.11) make the second pay for itself.

### 4.8 Regions: landmarks and character

**Landmarks.** Three per region for the six regions of depths 1 and 2 (18 cards), plus the nine Approaches. A landmark is a named place with a choice of two or three plaques. It is never a roll. Ribbon `"<Region> · Landmark"`, violet. One example per region; the executor writes the other two in the same shape:

| Region | Landmark | Text | Plaques |
| --- | --- | --- | --- |
| King's Road | The Gallows Tree | "A man on the gallows swears he's innocent. Everyone votes, thumbs up or down." | "Cut him down · drink 2" (remembered) / "Ride on" |
| Old Forest | The Fairy Court | "The fair folk offer a gift. They never say what it costs." | "Accept · lose 1 heart" (Tome of Training; remembered) / "Bow and decline" (heal 1) |
| Marsh | The Sunken Chapel | "A chapel up to its windows in bog. The bell still rings." | "Wade in" (elite next) / "Light a candle" (heal 1) |
| Haunted Crypt | The Ferryman of the Dead | "He'll row you past the worst of it, for a price." | "Pay · lose 1 heart" (Smoke Bomb) / "Walk" / "Stiff him" (remembered) |
| Goblin Mines | The Goblin Market | "Everything is for sale, and most of it is yours already." | "Buy · drink 3" (Lucky Coin) / "Haggle · drink 1" (Healing Potion) / "Steal" (remembered) |
| Wizard's Tower | The Room of Doors | "Three doors: one hums, one smokes, one is polite." | "The humming door" (elite next) / "The polite door" (heal 1) / "The smoking door" (lore) |

Stage layout per region: first half (pick 4), landmark (pick 1), second half (pick 3, same label, no second banner), boss. With the engine open, do this properly: let a region be one stage with an ordered shape (`[4 rooms, landmark, 3 rooms]`) so the HUD counter, `wantedBoss`, the end screen's region rows and the fork's "next room" all keep working without special cases.

**Character through the mix.** No standing region rule (those were cut). Each region keeps more of one kind of card and less of the rest, so regions feel different and the road choice means something:

| Region | Leans on (the three words on the map) | Thin on |
| --- | --- | --- |
| King's Road | People, tolls, merchants | Relics |
| Old Forest | Bargains, healing, curses | Merchants |
| Marsh | Traps, gambles, mud | Shrines |
| Haunted Crypt | Curses, relics, the dead | Treasure |
| Goblin Mines | Greed, gambles, loot | Shrines |
| Wizard's Tower | Riddles, tricks, tomes | Monsters |
| Sunken Coast | Whole-table cards | Trials |
| Fire Caverns | Endurance, hard fights, few heals | Shrines |
| Frozen Pass | Traps, whole-table cards, best treasure | Merchants |

**De-template.** Per region: cut 2 of 4 gambles (3 stay in the Marsh and the Mines); keep the fuse card and the act-it-out card in only five of nine regions each (not the same five); vary the forks so they are not all "quiet or noisy" (a rescue, a shortcut, a dare). Removed cards leave the module; IDs are never reused; saves keep their snapshots.

### 4.9 Rare things

**Rare cards.** A stage may hold cards outside its pool; when the game starts, with a set chance, one replaces a pick (`QuestStage.rare?: { cardIds; odds }`, snapshotted like `elite`). A rare card wears a prismatic foil and its ribbon says "Rare".

Regional rares: 2 per region (18 cards), chance 0.2 per region. About half of runs see one; a given one shows in about 1 run in 30.

| Region | Rare | What it is |
| --- | --- | --- |
| King's Road | The King in Disguise | Trial: nobody may bow. Win: Tome of Training |
| King's Road | A Unicorn | Heal 4. Whoever speaks first drinks 3 |
| Old Forest | The Sword in the Stone | Every player tries once (d20, needs a 20). Pulled: weapon "Kingmaker", +2 to every d20. Otherwise each drinks 1 |
| Old Forest | The Sleeping Giant | Whisper until the boss falls (a curse), or wake him: an elite |
| Marsh | The Wishing Frog | Three wishes, one plaque each: heal 3, an item, a rank for 2 hearts |
| Marsh | The Will-o'-Wisp | Follow it (lose 1 heart: lore) or don't |
| Haunted Crypt | Your Own Grave | A headstone with tonight's date. Everyone toasts. Phoenix Feather |
| Haunted Crypt | Death, Playing Chess | Rock, paper, scissors with the table's champion, best of three. Win: heal to full. Lose: 2 hearts |
| Goblin Mines | The Mother Lode | A gamble with five prizes |
| Goblin Mines | The Thing Below | Flee, free. Or an elite with the best weapon of the depth |
| Wizard's Tower | The Wizard Is Home | Trade any item for a Tome of Training |
| Wizard's Tower | The Time Loop | "You have been here before." The last card is dealt again |
| Sunken Coast | The Ghost Ship | The whole table sings a shanty. Win: two items |
| Sunken Coast | A Mermaid's Kiss | Heal 3. The drawer may not speak until their next turn |
| Fire Caverns | The Dragon Egg | Fight for it. Win: the Hatchling (ally) or a Phoenix Feather |
| Fire Caverns | The Forge of Kings | Swap your weapon for the depth's best, for 2 hearts |
| Frozen Pass | The Yeti's Tea Party | Everyone pours for their left neighbor. Heal 2 |
| Frozen Pass | The Old Dragonslayer | Retired, bitter, right. Lore, and he insults everyone's stance |

Single-card stages:

| Stage | Chance | Rare |
| --- | --- | --- |
| Your adventurer | 0.06 | The Peasant, The Squire, The Mimic (moved out of the main pool; 15 real classes remain) |
| The King's Summons | 0.05 | A Dragon Writes: "'{dragon} here. Kindly stop sending heroes. I have run out of room.' Read it in a dragon voice." |
| The Inn | 0.08 | The Inn Is a Mimic (fight; win: rest and stock up both). The Company's Table (they are drunk: take one item free) |
| The Last Inn | 0.08 | The Dragonslayer's Widow: she gives **Dragonbane** (weapon, +2 against bosses) for a toast |
| The dragon | 0.04 | **Bartholomew**, a dragon who would rather talk: his moves are all table contests and none costs a heart. The Summons names him on card 3, so the table knows the run is odd from the start |

**Hidden results.** `DiceOutcome.reward` lets one face of one card do something nobody expected. About 20 across the pack, never mentioned in the rules line. Examples:

- A natural 1 on any mimic gamble: it follows you home. Chester joins.
- A natural 20 on the Sphinx's riddle relic: she tells you about the dragon. Lore.
- A natural 20 on the Black Knight: he kneels. A Hired Blade joins, free.
- A natural 1 on the Wishing Well: you fall in. The next card is dealt from a different region.
- Double sixes on any 2d6 card in the Goblin Mines: the goblins crown you. A curse, and a Lucky Coin.

**The Lair's Door.** Keep five two-hit fights. Which kind of card is dealt depends on the two earlier meetings (D6):

- Won both: the Company is humbled. "Sir Bradley Begs" (take him as an ally, or leave him).
- Lost both: they are unbearable. The fight needs 1 more.
- Split: an ordinary fight.
- Rare, any record (0.1): "Singed Capes". Three gold capes, smoking. They went in first. A toast, a potion, no fight. Or "The Company's Bard": she has seen enough and joins you.

### 4.10 The road remembers (D6)

A few choices set a flag (`party.deeds?: string[]`, from `Offer.deed`), and one card later in the run reads it. The **echo** stage sits before the Lair's Door and deals the echo of one deed the party holds; with none, the stage is dropped. Eight pairs to start:

| Deed | Echo, before the lair |
| --- | --- |
| Cut the hanged man down | The Hanged Man Returns: he was a thief. He picked the lair's lock. The Lair's Door is skipped |
| Rode on past the gallows | His Brother: an ambush, and he wants a word |
| Accepted the fairies' gift | The Fair Folk Collect: lose an item, or a heart |
| Stiffed the Ferryman | The Ferryman Waits: nobody may say "no" until the dragon falls (a curse) |
| Stole from the Goblin Market | The Goblin Posse: an ambush; win and keep a Lucky Coin |
| Walked past the side quest | The One You Left: the miller (or merchant, or dwarf) is here, and has done it himself. Everyone drinks 2 in shame; heal 2 |
| Took the side quest | A Gift from Home: the village sent bread. Heal 2 |
| An ally died | A Grave by the Road: everyone toasts them by name. The next swing is rolled twice |

The ally's name and the plea's person are filled like `{dragon}`. The ballad uses the deeds too.

### 4.11 The Chronicle (D7)

A record across runs, kept under its own storage key (`side-quest.chronicle.v1`, written only by `persistence.ts`, never part of a session save). It opens from the setup screen when The Quest is selected.

- **What it counts:** dragons slain (of 10), classes won with (of 18), allies met and allies lost, rare cards seen (of 23), landmarks seen (of 27), echoes seen (of 8), hidden results found (of about 20, shown as "?" until found), ballads kept (the last 10).
- **Unlocks (owner's call):** Bartholomew appears only after 3 dragons are slain. A tenth dragon, **the Dragon King** (5 health, a third move list), appears only after all nine. The joke classes' win unlocks "The Fool's Ballad" ending for good. Unlocks are passed into `createSession` as a plain set, so the engine stays pure and a save never depends on the Chronicle.
- If the owner does not want locked content, keep the counting and drop the unlocks.

### 4.12 The ballad (the ending)

`words.tab` is already "The ballad"; make it one. When a run ends, the end screen writes four lines from what happened (display only, nothing saved in the session; the Chronicle keeps a copy):

1. Who and where from: "A {class} of {rank} left by {region 1},"
2. What fell: "felled {boss 1} and {boss 2},"
3. Who came along, by priority: an ally who died ("and buried {ally} on the way,"), an ally alive ("with {ally} at their side,"), a deed ("and cut a stranger from the gallows,"), or "alone, as heroes go,"
4. The end: "and slew {dragon} with {hearts} hearts to spare." Variants: one heart left; the killing roll was a natural 20 ("with a single blow"); Sir Bradley struck it ("and Sir Bradley took the credit"); a joke class won ("and the fool slew {dragon}, as foretold", paying off the Prophecy summons); a wipe at the lair ("and {dragon} sleeps on under {lair}."); a wipe before it ("and never saw {lair}.").

Four lines that fit a phone at table distance. This is what a table photographs.

### 4.13 Moments: where they happen and what they look like

The Quest already gets the shared moments (adventurer reveal, boss entrances, the forge rank-up, loot, curse laid and lifted, push-your-luck, last heart, the side quest's door, naturals, doubles, the two endings). None is its own. This is the full sequence of a run. "Exists": no work. "Retheme": an existing view with new art or words. "New": a new view.

| # | When | Moment | Status | What it looks like | Taps, length |
| --- | --- | --- | --- | --- | --- |
| M1 | Card 1 turns | Your adventurer | Exists | The current reveal | As now |
| M2 | The Summons turns | **The dragon revealed** | New | The screen dims to night. A wing's shadow sweeps across the whole screen with a low tremor. The dragon's name burns in letter by letter in its color (ember red, frost white, storm blue, gold, sea green, bog green, violet, ash grey, deep teal), kicker "WANTED", under it "Lair: {lair}". Three unlit runes appear beneath and settle onto the strip. | Blocks, 3.5 s, tap skips |
| M3 | The Road Out, The Signpost | **The map opens** | New | The parchment unrolls from the top. Stops already passed are inked. Two regions light, each with its three words; the third shows why it is closed. Tapping one draws a quill line to it and the map rolls up. | Blocks until a road is chosen |
| M4 | First card of each region | The road so far | New, small | The map strip across the middle, the quill line reaching the new region, its name writing in. Replaces the plain region banner. | Passes taps, 2 s |
| M5 | A landmark is dealt | Landmark arrival | Retheme (stage banner) | Violet banner, kicker "Landmark", the place's name | As the banner |
| M6 | A rare card turns | Rare | New finish and a small flourish | A slow prismatic sheen over the whole card and one soft chime-like flash at its edge; the ribbon reads "Rare" | Passes taps, 1 s |
| M7 | A region boss is dealt and falls | Entrance, spoils, the forge | Exists | As now | As now |
| M8 | Lore is found | **A rune lights** | New | The dragon's line appears in its color in the middle of the screen ("Its left wing never healed."), then shrinks into the next rune on the strip, which lights. | Blocks, 2.5 s, tap skips |
| M9 | The dragon sign turns | **The shadow** | New, small | No banner. The wing shadow from M2 crosses the card once, in the dragon's color, with the tremor. | Passes taps, 1.5 s |
| M10 | An ally joins | **An ally joins** | Retheme (`join`) | The ally's name, kicker "Joins the party", its calling as an icon and its ritual as the line under | Blocks, 2.5 s, tap skips |
| M11 | An ally is sent in | Send in | Retheme (`sendin`) | "Go, Gertie!" in the Quest's palette, the bonus beside the name | As the League's |
| M12 | An ally dies | **Fallen** | Retheme (`faint`), slower | The name in white on black, a single candle lit under it, "Pour one out. The drawer drinks 2." The candle joins the row the wipe screen uses, so a party's dead are on screen if it wipes. | Blocks, 3 s, tap skips after 1 s |
| M13 | A Gilded Company card is dealt (Gate, Crossroads, Door) | **The Company arrives** | Retheme (entrance) | Three gold capes drop in as pennants, kicker "The Gilded Company", then the card's title. Today only the Door plays an entrance. | Blocks, 2 s, tap skips |
| M14 | The echo is dealt | **Someone remembers** | New, small | The screen warms to sepia for a beat, the earlier card's title appears faintly ("The Gallows Tree"), then the echo's title over it | Blocks, 2 s, tap skips |
| M15 | The dragon is dealt | **The lair** | New (extends the `final` entrance) | Black. One eye opens in the dragon's color and looks at the table. The name. The dragon's health as a row of scales, the party's hearts under it, the lit runes between. "It's awake." The longest entrance in the game. | Blocks, 4.5 s, tap skips after 1 s |
| M16 | Each dragon's turn | **The dragon's move** | New | The dragon's die rolls in its color (the dice overlay, fed the engine's result). The move's name slams in ("FIRE BREATH") with a flash from the top edge and the tremor, its line under it, hearts lost falling off the strip. | Blocks until tapped |
| M17 | A hit lands | A scale breaks | New, small | One scale on the health row cracks and drops; a natural 20 cracks two | Passes taps, 1 s |
| M18 | Half health | **Enraged** | New | The eye from M15 narrows, the screen's edge burns in the dragon's color and stays that way for the rest of the fight. Then the enrage contest's card. | Blocks, 2.5 s |
| M19 | The killing swing is face up | Everyone stands | New, small | The card reads "Everyone stands." The background stills, the sound of the room is the only thing left. No animation: the pause is the moment. | None |
| M20 | The dragon is slain | Slain, then the ballad | Retheme (ending) | The eye closes. The existing "The dragon is slain" ending in the dragon's color. The ballad writes in line by line. A natural 20 adds "With a single blow" above the title. | As the ending, plus about 4 s |
| M21 | A wipe | Fallen | Retheme (ending) | The existing candles, with the dead allies' candles already lit; at the lair the eye closes over them. The ballad's last line under. | As the ending |
| M22 | A hidden result is rolled | Something else happens | New, small | The outcome text is replaced by a line in gold with a "?" seal, and the Chronicle's counter ticks once in the corner | Passes taps, 1.5 s |

Rules for all of them, as for the current layer: read only from saved state, fire on a change between two snapshots (never on resume or undo), no particles under Reduce Motion (a still plaque instead), each `aria-hidden` with a live-region line. Dragon colors live in one map by card ID in the presentation layer.

If moments must be cut for time or budget, keep in this order: M15, M16, M2, M20, M12, M3, M8, M13, then the rest.

### 4.14 Cuts and fixes

- **Kits.** Stop authoring `kit`; move each kit's number into its class and retune. Keep the engine's `kit` path for old saves.
- **Gambles.** As 4.8.
- **Curse wording.** "the jinxed player" becomes "the cursed player" across Realms. `src/content/CLAUDE.md` gets a Realms exception to its rule.
- **Pub-skeleton cards (F8).** Rewrite the 22, keeping IDs. Premise from the world; the joke in the outcome line.
- **Classes (F6).** No new system. Each of the 15 real classes gets one line the table acts out when it ranks up (the forge already holds for a tap): Barbarian, "Everyone roars." Bard, "The drawer sings one line." Display only.
- **The third Company fight at the Crossroads** stays, because its result now matters.

---

## 5. Phases

Every phase ends at the same gate: `npm test`, `npm run lint`, `npm run typecheck`, `npm run cards:review`, `BASE_PATH=/side-quest/ npm run build`, both balance files inside their bands (the League's too: its engine paths are shared), Chromium `test:e2e` and `test:sweep` with `TEST_PORT`, then `docs/STATUS.md`, `AGENTS.md`, `src/content/CLAUDE.md` and `src/game/CLAUDE.md` updated. New cards need `imprint.ts` entries; changed totals need `tests/workshop.test.ts` and the manifest. New saved state needs new fixtures; never edit one. Ask before any push to `main`. One phase per session is a sensible size.

**Phase 0: make room in the engine (no behavior change)**

`src/game/engine.ts` is 1,685 lines holding the plain game, the meter quest, both crawls, the team, the balls and the offers. Before adding a battle, a map and allies, split the crawl code into modules (`src/game/crawl/`: party, offers, bosses, team, naming) behind the same exports. The proof is that every existing test, every save fixture and both balance files pass unchanged, with identical balance numbers on the same seeds.

**Phase 1: copy and lairs (content only)**

Curse wording; the 22 rewrites; dragons tied to lairs; Tidewrack; Old Mother Brine; kits folded into classes and retuned; gambles cut; region mixes.

**Phase 2: the dragon battle (D3)**

The `lairFight` card kind and `party.duel`, tests first. Nine dragons, two move lists each, an enrage contest each. The strip's health row. M15, M16, M17, M18, M19, M20. Retune so the win rate holds. Fixtures: mid-battle on the party's turn, on the dragon's turn, enraged. The balance simulation must play the battle.

This phase alone changes how a run ends and can ship before anything else.

**Phase 3: structure**

`{lair}` and name filling everywhere; the Summons rewrites; regions as 4, landmark, 3; 18 landmarks and 9 Approaches; 6 dragon signs; the Last Inn's third plaque; the ballad; M2, M5, M9. Fixtures for the new stage shapes.

**Phase 4: lore and allies (D4, D5)**

`party.lore`, the runes, lore lines for nine dragons, lore in the battle. Allies: the `ally` field, recruiting, calling-based send-in, death; eleven allies; keepers recruit. M8, M10, M11, M12. League tests and balance must not move. Fixtures: lore held; an ally held; an ally sent in; an ally dead.

**Phase 5: the map and the road (D1)**

The choice model (4.7), the two choice cards per pairing, the map in the party dialog, M3, M4. The balance simulation picks at random, with a check that no region is a trap choice. Fixtures before and after a choice.

**Phase 6: rare things (D6, D8)**

`QuestStage.rare`; joke classes moved; 18 regional rares and the single-stage rares; `DiceOutcome.reward` and the hidden results; deeds, the echo stage and its eight pairs; the Lair's Door by record; M6, M13, M14, M22. The balance test should force each joke class and each rare rather than wait for its odds.

**Phase 7: the Chronicle (D7)**

The storage key and its reader in `persistence.ts` (with a corrupt-data path that resets only the Chronicle, never a session); the setup screen's view; unlocks if approved; the Dragon King.

---

## 6. Risks

- **Size.** This is about 110 new or rewritten cards, one new card kind, four new pieces of saved state and about 15 new or rethemed moments. Phases 2, 4, 5 and 6 each touch save parsing, where the repo's rules are strictest. Tests and fixtures first, every time.
- **Shared engine.** Allies generalize the League's team code, and Phase 0 moves it. The League's 4,200-run balance file and its save fixtures are the guard; if its numbers move at all on the same seeds, something broke.
- **Too many systems.** See the complexity check in section 3 and its cut order.
- **Length.** About 56 to 60 draws for a won run, plus a battle of about 7 rounds. Needs D10, and needs a real table to say whether the last half hour drags.
- **Balance drift.** Kits removed, lore, allies, rares that heal or arm, a new final fight: every one moves the win rate, which starts at 35.6%, the top half of the band. Retune at the end of each phase, not at the end of the project.
- **Budget.** Likely to need D11. Measure after Phase 2.
- **No device evidence.** Every moment here is a design on paper. Emulated WebKit is not an iPhone; the owner's phone is the test, and the dragon's turn (M16) is the one most likely to feel slow in the hand.
- **Humor is unproven.** The example cards are drafts in the house voice, checked against the length rules by eye only. Run them through `docs/CARD_VOICE_REFERENCE.md` and the validator.
