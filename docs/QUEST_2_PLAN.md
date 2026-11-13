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

## 3. Owner decisions needed

| # | Decision | Recommendation | Why |
| --- | --- | --- | --- |
| D1 | Let the table choose the road for regions 1 and 2 (two of the three offered). On 2026-11-03 the owner decided "regions stay random". | **Choose.** | It is the cheapest real agency in the mode and the clearest break from Pub Crawl. Only worth it after regions differ (Phase 2). If declined, skip Phase 5; everything else stands. |
| D2 | Tie each dragon to a lair region, so region 3 is known from card 3 and is never chosen. | **Yes.** | Fixes F3. "Emberfang, in the Fire Caverns" is a destination. |
| D3 | Joke classes become rare (about 6% of runs in total, down from 17%). | **Yes.** | Keeps the joke, removes the planned loss one run in six. Needs the `rare` field (Phase 3). |
| D4 | Add companions: a fourth slot holding one named ally with a small effect and a spoken ritual. | **Yes.** | The Quest's answer to catching. Reuses boons and the spoils picker. It is one new concept after the 2026-10-31 cuts; say no if that is one too many. |
| D5 | Cut starting gear (kits). Fold each kit's number into the class. | **Yes.** | One less thing on card 1; the weapon, armor and trinket slots then fill only from fights. |
| D6 | Cut gambles from 4 to 2 a region (18 cards removed). | **Yes.** | Makes room for landmarks and rares without growing the pools. |
| D7 | Raise the balance test's mean-draws ceiling from 55 to 58 if the run grows. | Only if measured. | The plan is built to hold length; see 4.2. |
| D8 | Runtime budget: 3,874 of 4,096 KiB used. New moments must fit in about 220 KiB. | Hold the budget; ask before raising. | The moments below are CSS and inline SVG only. |

Not proposed, because the owner already cut or declined them: floor rules, powers, knacks, two-path levels, hero draft, a gold currency.

---

## 4. The design

### 4.1 Five pillars

1. **The dragon is the spine.** Named with its lair on card 3, seen twice on the way, its fight written for it alone.
2. **Regions have a middle and a character.** Each has a landmark at its midpoint and its own mix of card kinds.
3. **Companions.** One named ally at a time, from side quests and rare events.
4. **Rare encounters.** A small chance per stage of a card most tables have never seen.
5. **The ballad.** The end screen writes the run as four lines.

### 4.2 The run

Card counts in brackets. Today's won run is about 52.6 draws; this layout adds 1 card (the dragon sign), or 3 with D1.

**Act 0: The Call**

1. Your adventurer [1]
2. The omen [1]
3. The King's Summons [1]: names `{dragon}` and `{lair}`
4. The City Gate [1]: the Gilded Company, one fight

**Act I**

5. *The Road Out* [1, only with D1]: pick one of two regions
6. Region 1, first half [4]
7. **Landmark** [1 of 3 for that region]
8. Region 1, second half [3]
9. Region boss [1, two beats]: spoils, rank up
10. **Dragon sign** [1 of 6]: `{dragon}` passes over
11. The Inn [1]
12. Side quest plea [1]: take it (2 guards, a keeper who offers a **companion**, rank up) or walk on

**Act II**

13. *The Signpost* [1, only with D1]: pick one of two regions
14. Region 2: 4, landmark, 3, boss (spoils, rank up)
15. The Last Inn [1]: its text names `{dragon}`
16. The Crossroads [1]: the Company, one fight

**Act III**

17. The lair region (fixed by the dragon), first half [4]
18. **The Approach** [1 of 3]: the lair's landmark, written with `{dragon}`
19. The lair region, second half [3]
20. The Lair's Door [1]: the Company's payoff, 1 of 8, not always a fight
21. The dragon [1, three beats]
22. The ending and the ballad

A region stays at 8 cards plus its boss: the landmark replaces one of today's 8 rooms.

### 4.3 The dragon

**Lairs.** Nine dragons, three per lair. One is new.

| Lair (region 3) | Dragons |
| --- | --- |
| Fire Caverns | Emberfang, Gorgrath the Hungry, Ashmaw the Ancient |
| Frozen Pass | Rimeclaw, Stormcrown, Glimmerwing |
| Sunken Coast | Old Mother Mire (retitle **Old Mother Brine**, "older than the sea"), The Whispering Wyrm, **Tidewrack** (new: a sea serpent that wrecks ships for their bells) |

Implementation: the last three finale slots become one `oneOf` of three routes, each `[floor A, approach, floor B, lair's door, that lair's dragons]`. No engine change for the pairing. `{dragon}` still reads the last finale card.

**`{lair}`.** Add a second placeholder beside `{dragon}` in `withNames`: the label of the lair region's first stage. Extend `withNames` to dice outcome lines and phase rules and dice at the same time (F9). Both are display-time only; nothing is saved.

**Summons.** Rewrite the 6 so each names both, for example:

- The King's Decree: "{dragon} has woken under {lair}. The king offers half the kingdom. Everyone toasts the king."
- The Bounty: "WANTED: {dragon}. LAST SEEN: {lair}. REWARD: half the kingdom. Everyone toasts the reward."

Check length with the longest pair ("Gorgrath the Hungry" + "the Sunken Coast") against the 100-character rule; `validate-content.ts` cannot see filled text, so add a unit test that fills every dragon and lair into every card that uses them and checks the limit.

**Dragon signs (6, pick 1, after the first region boss).** No fight, 15 seconds, the table does one thing. Examples:

- The Shadow: "A shadow crosses the sun: {dragon}. Everyone ducks. Last head down drinks 2."
- The Burned Mill: "A mill, still smoking. {dragon} was here. Everyone pours a sip out, or drinks it."
- A Scale: "A scale the size of a shield, fallen from {dragon}. Everyone guesses its weight; worst guess drinks 2."
- The Fleeing Knights: "Knights gallop past the wrong way, shouting '{dragon}!' Everyone shouts it. Quietest drinks 2."

**The Approach (3 per lair, pick 1, mid region 3).** The lair's landmark, a choice with two plaques, written for the place and naming `{dragon}`. Examples:

- Fire Caverns, The Bone Road: "Armor, all of it empty, all the way down to {dragon}." Plaques: "Take a shield · drink 2" (shield), "Don't touch it".
- Frozen Pass, The Frozen Army: "A hundred knights in ice, swords up, facing {dragon}'s peak." Plaques: "Chip one out · lose 1 heart" (Hired Sword), "Salute and pass" (heal 1).
- Sunken Coast, The Bell Reef: "Ships' bells, hung on the reef by {dragon}. Ring one, or row past." Plaques: "Ring it" (elite next), "Row past".

**The fight.** Keep three beats and the numbers. Rewrite beat 2 of each dragon as something only that dragon would ask for (several already are: Glimmerwing wants praise, the Whispering Wyrm wants a secret, Old Mother Mire asks a riddle). The generic ones to replace: Emberfang (out-roar), Rimeclaw (hold breath), Gorgrath (staring), Stormcrown (clap), Ashmaw (why you came, which is fine but should be the table's answer, not the drawer's). The last beat should always put the whole table in it: everyone stands for the final swing, on every dragon.

### 4.4 Regions: landmarks and character

**Landmarks.** Three per region for the six regions of depths 1 and 2 (18 cards), plus the nine Approaches above. A landmark is a named place with a choice (2 or 3 plaques, existing `Offer` fields only: `cost`, `loot`, `heal`, `elite`). It is never a roll. Ribbon `"<Region> · Landmark"`, violet. Examples, one per region; the executor writes the other two in the same shape:

| Region | Landmark | Text | Plaques |
| --- | --- | --- | --- |
| King's Road | The Gallows Tree | "A man on the gallows swears he's innocent. Everyone votes, thumbs up or down." | "Cut him down · drink 2" (Hired Sword) / "Ride on" |
| Old Forest | The Fairy Court | "The fair folk offer a gift. They never say what it costs." | "Accept · lose 1 heart" (Tome of Training) / "Bow and decline" (heal 1) |
| Marsh | The Sunken Chapel | "A chapel up to its windows in bog. The bell still rings. Someone has to go in." | "Wade in" (elite next) / "Light a candle" (heal 1) |
| Haunted Crypt | The Ferryman of the Dead | "He'll row you past the worst of it, for a price. Everyone names what they'd pay." | "Pay · lose 1 heart" (Smoke Bomb) / "Walk" |
| Goblin Mines | The Goblin Market | "Everything is for sale, and most of it is yours already." | "Buy · drink 3" (Lucky Coin) / "Haggle · drink 1" (Healing Potion) / "Leave" |
| Wizard's Tower | The Room of Doors | "Three doors: one hums, one smokes, one is polite." | "The humming door" (elite next) / "The polite door" (heal 1) |

Stage layout per region: `floor A` (pick 4, `intro` as today), `landmark` (pick 1, `intro` is the landmark's kicker), `floor B` (pick 3, same `label`, **no `intro`** so the region's banner does not play twice), then the boss. Things to verify in code when splitting a floor: the encounter counter in the HUD (it reads stage size), `wantedBoss` (looks one stage ahead; it must look past floor B), `stageKind`, the end screen's region rows, `setupBrief`'s region count, and that a fork's loud door still finds a next room (`pickFinale` already keeps a fork off the last slot of its stage).

**Character through the mix, not a rule.** No standing region rule (those were cut). Each region instead keeps more of one kind of card and less of the rest, so a table can tell regions apart by what tends to happen there, and the D1 choice means something:

| Region | Leans on | Thin on |
| --- | --- | --- |
| King's Road | People: merchants (3), neighbor duels, tolls | Relics |
| Old Forest | Bargains: shrines and heals, relics that curse | Merchants |
| Marsh | Traps and push-your-luck (keeps 3 gambles) | Shrines |
| Haunted Crypt | Curses and relics | Treasure |
| Goblin Mines | Greed: gambles (3), treasure, merchants | Shrines |
| Wizard's Tower | Trials of wit (riddles, tongue twisters), Tomes | Monsters |
| Sunken Coast | Whole-table cards (four dice, last-to cards) | Trials |
| Fire Caverns | Endurance trials, hard monsters, few heals | Shrines |
| Frozen Pass | Traps and whole-table cards, the best treasure | Merchants |

**De-template (D6).** Per region: cut 2 of 4 gambles (3 stay in the Marsh and the Mines), keep one fuse card and one act-it-out card in only **five** of the nine regions each (not the same five), and vary the forks so they are not all "quiet or noisy" (a fork may offer the elite for a named reason: a rescue, a shortcut, a dare). Removed cards simply leave the module; IDs are never reused; saves keep their snapshots.

### 4.5 Companions (D4)

One named ally travels with the party. It is a boon in a new fourth slot, so it uses everything that exists: the spoils picker, the party dialog, "Replaces", `stackEffects`.

- `SLOTS` gains `"companion"`; `equipment.slots.companion: "Companion"`; a `companion(name, effect, ritual)` builder in `dungeon/shared.ts` (like `omen`'s `spoken` line: the ritual is the first sentence of the boon's rules).
- One at a time. A new one replaces the old, through the existing Replaces flow.
- Small numbers only (worth about one trinket). The ritual is the point.
- **Source 1, side quests.** Each keeper's spoils become `[the companion, the better of its two trinkets]`. The plea already says who needs help, so the reward is the one you saved.

| Side quest | Companion | Effect | Ritual |
| --- | --- | --- | --- |
| Witch's Cottage | Gertie the Goat | heals heal 1 more | "Everyone bleats when the party heals. Silent: drink 1." |
| Bandit Fort | Coin, the Merchant's Mule | +1 satchel slot | "The mule carries it. Whoever uses an item pats the table twice first." |
| Old Barrow | Mort, a Talking Skull | +2 to relic and gamble d20s | "Mort gives advice. Before any gamble, the left neighbor speaks as Mort." |
| Drowned Shrine | Pip, the Cabin Boy | +2 to trap d20s | "Pip calls every trap. The table shouts 'Pip!' at each one; last drinks 1." |
| Sunless Vault | Durla Ironbraid | +1 to boss d20s | "Durla toasts every boss. Everyone clinks before a boss swing." |

- **Source 2, rare encounters** (4.6): The Hatchling, Chester the Friendly Mimic, The Company's Bard.
- Moment: the existing `join` view, themed for the Quest (4.8, M8). Detected as a new boon whose slot is `companion`, in place of the `loot` moment.
- The ballad names the companion (4.7).
- Saves: a companion is a `party.boons` entry like any trinket, so the save shape does not change, but `validate.ts` and `parseSession` see a new slot value. Add fixtures (`npm run fixtures:saves`) for a run holding one.

### 4.6 Rare encounters (D3)

**Engine.** One optional field, modeled on `elite`:

```ts
interface QuestStage {
  // ...
  /** Cards that are not in the stage's pool. When the game starts, with
   * probability `odds`, one of them replaces one of the stage's picks
   * (never a fork, never the last pick of a multi-card stage). */
  rare?: { cardIds: string[]; odds: number };
}
```

The stage snapshot keeps them as `stages[].rare?: CardDefinition[]` (optional, as `elite` is), so `finaleCard`, `findCard`, Previous Card and the end screen find the card. Touch points: `pickFinale`, `finaleCardIds`, `questStages`, `createSession`, `replaySession`, `validateCatalog`, `parseSession`, the manifest, `tests/engine.test.ts`, the balance test's pool counts, and new fixtures with a rare card in `finale`. The pick is made at game start and saved in `finale` like any other, so a reload never re-rolls it.

**Display.** A rare card wears a third foil (`cardFinish` returns `"prism"` when the card is in its stage's `rare` snapshot) and its ribbon reads `"<Region> · Rare"`. No moment of its own: the foil is the tell.

**Regional rares: 2 per region (18 cards), `odds` 0.2 per region.** A run passes three regions, so about half of runs see one, and a given rare shows up in about 1 run in 30. Draft list; each is a normal card built with the existing builders unless noted:

| Region | Rare | What it is |
| --- | --- | --- |
| King's Road | The King in Disguise | Trial: nobody may bow. Win: Tome of Training |
| King's Road | A Unicorn | Shrine: heal 4, and whoever speaks first drinks 3 |
| Old Forest | The Sword in the Stone | Each player tries (roll d20, need 20); a 20 pulls it: weapon "Kingmaker" (+2 to every d20). Otherwise drink 1 each |
| Old Forest | The Sleeping Giant | Whole table whispers until the region's boss falls (a curse) or fight it as an elite |
| Marsh | The Wishing Frog | Offers: three wishes, each a plaque (heal 3 / an item / rank up for 2 hearts) |
| Marsh | Chester | A mimic that likes you. Elite fight; spoils: **companion** Chester (+1 satchel slot) or a shield |
| Haunted Crypt | Your Own Grave | A headstone with tonight's date. Everyone toasts; Phoenix Feather |
| Haunted Crypt | Death, Playing Chess | Rock, paper, scissors against the table's pick, best of three. Win: heal to full. Lose: lose 2 hearts |
| Goblin Mines | The Mother Lode | Gamble with five prizes instead of three |
| Goblin Mines | The Balrog-Shaped Hole | Use another name: **The Thing Below**. Flee (free) or elite with the best weapon in the region |
| Wizard's Tower | The Wizard Is Home | He offers a trade: any item in the satchel for a Tome of Training |
| Wizard's Tower | The Time Loop | "You have been here before." The previous card's drinks are taken again by whoever took them |
| Sunken Coast | The Ghost Ship | Trial for the whole table (a shanty); win: two items |
| Sunken Coast | A Mermaid's Kiss | Shrine: heal 3; the drawer may not speak until their next turn |
| Fire Caverns | The Dragon Egg (move from the relic pool) | Elite-style fight; spoils: **companion** The Hatchling (+1 to boss d20s; ritual: everyone coos when it is named) or a Phoenix Feather |
| Fire Caverns | The Forge of Kings | Offers: reforge (swap your weapon for the region's best) for 2 hearts |
| Frozen Pass | The Yeti's Tea Party | Moment: everyone pours for their left neighbor; heal 2 |
| Frozen Pass | The Frozen Hero | Chip them out (trial, wall-sit): Hired Sword and a Lucky Coin |

**Single-card stage rares.**

| Stage | `odds` | Rare cards |
| --- | --- | --- |
| Your adventurer | 0.06 | The Peasant, The Squire, The Mimic (moved out of the main pool: 15 real classes remain) |
| The King's Summons | 0.05 | "A Dragon Writes": "'{dragon} here. Kindly stop sending heroes. I have run out of room.' The drawer reads it in a dragon voice." |
| The Inn | 0.08 | The Inn Is a Mimic (fight; win: rest and stock up both). The Company's Table (the Company is here, drunk: take an item from them free) |
| The Last Inn | 0.08 | The Dragonslayer's Widow: she gives the party **Dragonbane** (weapon, +2 to boss d20s) for a toast |
| The Lair's Door | none | Not a rare: the pool itself is rewritten, see below |
| The dragon | 0.04 per lair | **Bartholomew**, a dragon who would rather talk: three beats, all table contests, no dice. The Summons names him from card 3, so the table knows the run is odd from the start |

**The Lair's Door: the Company's payoff (rewrite the pool of 8).** Five stay two-hit fights (keep the best: First Through the Door, The Victory Dance, The Rematch, Chadwick's Potions, A Toast to the Company). Three become non-fights that end the rivalry differently:

- **Singed Capes**: "Three gold capes, smoking. The Company went in first. Everyone toasts them, briefly." Reward: Healing Potion. (No fight.)
- **Sir Bradley Begs**: "Sir Bradley, alone, cape on fire, asks to join you." Plaques: "Take him · drink 2" (Hired Sword) / "Leave him".
- **The Company's Bard**: "Their bard has seen enough. She'd rather write about you." Spoils-style offer: **companion** The Bard (natural 20s on 19 too) or walk on.

With these, the stage banner "The Company got here first" becomes "At the lair's door".

### 4.7 The ballad (the ending)

`words.tab` is already "The ballad"; make it one. When a run ends, the end screen shows four lines built from `questRecord` (display only, nothing saved). Templates, picked by what happened:

1. Who and where from: "A {class} of {rank} left by {region 1},"
2. What fell: "felled {boss 1} and {boss 2}," (or "slipped past {region 2}" if a boss stage was never reached)
3. Who came along: "with {companion} at their side," / "alone, as heroes go," / if a side quest was walked past: "and left the {plea's person} to it,"
4. The end: "and slew {dragon} with {hearts} hearts to spare." Variants: one heart left ("by a thread"); the felling roll was a natural 20 ("with a single blow"); a joke class won ("and the fool slew {dragon}, as foretold"); a wipe ("and {dragon} still sleeps under {lair}." or, wiped before the lair, "and never saw {lair}.").

The joke-class line pays off the existing Prophecy summons ("A fool will slay {dragon}"). The ballad is the thing a table screenshots; keep it to four lines that fit a phone at table distance.

### 4.8 Moments: where they happen and what they look like

The Quest already gets the shared moments (adventurer reveal, boss entrances, the forge rank-up, loot, curse laid and lifted, push-your-luck, last heart, the side quest's door, naturals, doubles, the two endings). None is the Quest's own. This is the full sequence a run should play, in order. "Exists" means no work; "Retheme" means an existing view with new art or words; "New" means a new view.

| # | When | Moment | Status | What it looks like | Blocking? Length |
| --- | --- | --- | --- | --- | --- |
| M1 | Card 1 turns | Your adventurer | Exists | The current reveal | Blocking, as now |
| M2 | Card 3 turns (the Summons) | **The dragon revealed** | New | The screen dims to night. A wing's shadow sweeps left to right across the whole screen with a low tremor (`tremor()` exists). The dragon's name burns in letter by letter in its color (ember red, frost white, storm blue, gold, sea green, bog green, violet for the Wyrm, ash grey), kicker "WANTED", and under it "Lair: {lair}". Ends on the card. | Blocking, 3.5 s, tap skips |
| M3 | First card of each region dealt | **The map** | New (replaces the plain stage banner for regions) | A parchment strip across the middle: City Gate, region 1, Inn, region 2, Inn, the lair marked with a small dragon. Visited stops are inked; a quill line draws to the new region and its name writes in. Regions not yet reached show as "?" except the lair, which is named from the start. | Ambient (taps pass through), 2.5 s |
| M4 | The Road Out, The Signpost (D1) | The fork in the map | New, small | The same parchment with two roads drawn from the current stop, each labelled; the plaques on the card are the choice. Taking one inks that road. | Ambient, 1.5 s on arrival; 1 s on choosing |
| M5 | A landmark is dealt | Landmark arrival | Retheme (stage banner) | The existing banner, violet, kicker "Landmark", the place's name | As the banner |
| M6 | A rare card turns | Rare foil | New finish, no moment | A slow prismatic sheen across the whole card, ribbon reads "Rare" | None |
| M7 | A region boss is dealt | Boss entrance | Exists | Current `boss` entrance | As now |
| M7b | A region boss falls | Spoils, then the forge | Exists | Current spoils picker, loot moment, rank-up (holds for a tap) | As now |
| M8 | A companion is taken | **A companion joins** | Retheme (`join`) | The League's join view with the Quest's palette: the companion's name, kicker "Joins the party", its ritual as the line under it | Blocking, 2.5 s, tap skips |
| M9 | The dragon sign turns | **The shadow** | New, small | No banner. The wing shadow from M2 crosses over the card once, in the dragon's color, with the tremor. The card text does the rest. | Ambient, 1.5 s |
| M10 | Every Gilded Company card is dealt (Gate, Crossroads, Door) | **The Company arrives** | Retheme (`ambush` entrance) | Three gold capes drop in as pennants, kicker "The Gilded Company", then the card's title. Today only the Door plays an entrance, because `entranceFor` needs `hits`; extend it to any card in a stage whose scene is `rival`. | Blocking, 2 s, tap skips |
| M11 | The Approach is dealt | The lair nears | Retheme (stage banner) | Banner in the dragon's color, kicker "{lair}", title "{dragon} is close" | As the banner |
| M12 | The dragon is dealt | **The lair** | Retheme and extend (`final` entrance) | Black screen. One eye opens, in the dragon's color, and looks at the table. The name, then the hearts tally and "It's awake". Longer than any other entrance; this is the mode's peak. | Blocking, 4.5 s, tap skips after 1 s |
| M13 | Each dragon hit lands (beats 1 and 2) | The dragon roars | New, small | A flash in the dragon's color from the top edge and the tremor; the boss tally updates as now | Ambient, 1 s |
| M14 | The felling swing | Slain | Retheme (ending) | The existing "The dragon is slain" ending, tinted in the dragon's color, then the ballad writes in line by line (4.7). A natural 20 adds "With a single blow" above the title. | As the ending, plus about 3 s for the ballad |
| M15 | A wipe | Fallen | Retheme (ending) | The existing candles; the ballad's wipe line under them. At the dragon: its eye closes over the candles. | As the ending |

Rules for all of them, as for the current layer: read only from saved state, fire on a change between two snapshots (never on resume or undo), nothing new saved, no particles under Reduce Motion (a still plaque instead), each `aria-hidden` with a live-region line. Dragon colors live in one map by card ID in the presentation layer, not on the card.

Order of work if the moments budget is tight: M2, M12, M14 (the dragon's three), then M10, M8, M3, the rest.

### 4.9 Cuts and fixes

- **Kits (D5).** Stop authoring `kit` on classes and move each kit's number into the class's base and rank effects, then retune. Keep the engine's `kit` path for old saves.
- **Gambles (D6).** As 4.4.
- **Curse wording (F9).** "the jinxed player" becomes "the cursed player" across Realms jinx rules. The `src/content/CLAUDE.md` rule ("A jinx's rule speaks of the jinxed player") gets a Realms exception.
- **Pub-skeleton cards (F8).** Rewrite the 22 listed, keeping IDs. Premise from the world; the joke in the outcome line.
- **Classes (F6).** No new system. Give each of the 15 real classes one sentence of voice that the table can act on when it ranks up (the rank-up moment already holds for a tap): the forge banner's change line can be followed by the class's line, for example Barbarian: "Everyone roars." Bard: "The drawer sings one line." Display only, written beside each class.

---

## 5. Phases

Each phase is shippable on its own and ends with the same gate: `npm test`, `npm run lint`, `npm run typecheck`, `npm run cards:review`, `BASE_PATH=/side-quest/ npm run build`, `tests/dungeon.balance.test.ts` inside its bands (win rate 18 to 40%; every class, omen, side quest and region 10 to 50%; jokes 1 to 10%), Chromium `test:e2e` and `test:sweep` with `TEST_PORT`, then `docs/STATUS.md`, `AGENTS.md` and `src/content/CLAUDE.md` updated. New cards need `imprint.ts` entries; changed totals need `tests/workshop.test.ts` and the manifest. Never edit a save fixture; add new ones when a phase says so. Ask before any push to `main`.

**Phase 1: copy and the dragon (content only, no engine, no save change)**

1. F9 curse wording; F8 rewrites.
2. D2: dragons tied to lairs through one `oneOf`; add Tidewrack (title, 3 beats, `imprint.ts`); retitle Old Mother Mire.
3. Rewrite the generic dragon beats (4.3).
4. Rewrite the Lair's Door pool (4.6), including the three non-fights (the Bard's companion offer waits for Phase 3; until then she gives a Lucky Coin).
5. Balance check: the door is easier in 3 of 8 runs; expect the win rate to rise and retune `CLOSING_*` or the dragon's need if it leaves the band.

**Phase 2: structure (small engine, no save shape change)**

1. `{lair}` and `withNames` over outcome and phase text; the filled-length unit test.
2. Summons rewrites; 6 dragon signs and their stage; `{dragon}` in the Last Inn cards.
3. Split each region into 4, landmark, 3; write 18 landmarks and 9 Approaches; fix the HUD counter, `wantedBoss`, end screen rows and region count for split floors.
4. D6 de-template and the region mixes (4.4).
5. D5 kits folded into classes; retune.
6. The ballad (4.7).
7. New fixtures: the stage list changed shape (more stages), so freeze a mid-region-2 run and a finished run.

**Phase 3: rares and companions (engine, new fixtures)**

1. `QuestStage.rare` and the stage snapshot's `rare` (4.6), with engine tests written first.
2. Joke classes moved to the adventurer stage's rares (D3); balance test updated (its class count and the joke band's sampling: at 6% odds the test should force each joke class rather than wait for it).
3. The `companion` slot, builder, theme words, party dialog row; keeper spoils; the rare companions.
4. 18 regional rares and the single-stage rares; the prism finish.
5. Fixtures: a run holding a companion; a run with a rare card in play.

**Phase 4: moments**

M2, M12, M14, M10, M8, M9, M13, M3, M5, M11, M6, M15, in that order, each with a spec in `tests/browser/moments.spec.ts` (plays once, not on resume, not on undo, still under Reduce Motion). Measure the budget after each.

**Phase 5: the road (only with D1)**

1. `Offer.skip` accepts `{ after: number; count: number }` as well as a number, so a choice card can drop either of two routes that follow it.
2. Each depth's slot becomes a `oneOf` of three pairs: `[choice card for the pair, route A stages, route B stages]`; the two plaques drop the other route.
3. Three choice cards per depth (one per pair), plaque labels are the region names with their lean in three words ("The Marsh · traps, gambles").
4. The balance simulation picks at random; add a per-pair check that neither road is a trap choice (each region already has its own band).
5. M4. Fixtures for a run before and after a choice.

---

## 6. Risks

- **Scope.** Phases 1 and 2 are mostly writing (about 70 new or rewritten cards). Phases 3 and 5 touch the engine and save parsing, where the repo's rules are strictest. Do them one at a time, tests first.
- **System count.** The 2026-10-31 cuts were about clutter. This plan adds one player-facing concept (companions) and one choice (the road); rares, landmarks, signs and the ballad are content. If companions feel like a fourth gear slot in play, cut them and keep the rest.
- **Length.** Target is a won run under 55 draws. Measure after Phase 2 before asking for D7.
- **Balance drift.** Kits removed, door variants, rares that heal or arm the party, and companions all push the win rate up from 35.6%, already in the top half of the band. Expect to raise `NEED` or `BOSS_NEED` at depth 3 by one.
- **No device evidence.** Every moment above is a design on paper. Emulated WebKit is not an iPhone; the owner's phone is the test.
- **Humor is unproven.** The example cards are drafts in the house voice, checked against the length rules by eye only. Run them through `docs/CARD_VOICE_REFERENCE.md` and the validator.
