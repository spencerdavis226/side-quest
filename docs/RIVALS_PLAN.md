# The Rivals: comprehensive plan

Owner, 2026-11-15: "Make the rival system in The Quest a total revamp ... make it so you hate this guy as you go through the quest, so that when they show up at the end and ask to join ... it's a real choice." Then: "All 6 sounds good. Absolutely betrayal is acceptable. Yes rivals can undo rolls. Maximum frustration." And: "We need way better and funnier or more impactful names ... more crude too like the cabiin game. Sir Chuck the Cuck is a great placeholder or inspiration seed."

This file is the plan for every phase. Build it **one phase per session and pull request**, as with `docs/QUEST_2_PLAN.md`. Read `AGENTS.md` and the top of `docs/STATUS.md` first. At each handoff, record in `docs/STATUS.md` what was built, the measured balance numbers, what ran, and what is left.

## Contents

1. Where it stands (Phase 0, built)
2. Decisions
3. The six rivals: names, voice, cards
4. The verbs: how a rival ruins your night
5. The data model
6. Phases 1 to 7
7. Balance targets
8. Tests and fixtures
9. Rules every phase keeps
10. Risks and open questions

---

## 1. Where it stands (Phase 0, built 2026-11-15)

Phase 0 is built and verified on branch `claude/funny-mendel-u5935o`. `docs/STATUS.md` ("Done 2026-11-15: the rival, rebuilt") has the full record. In short:

- **Run layout.** The City Gate is gone. **Your Rival** is a new stage right after the first region's boss. **The Crossroads** is one of that rival's four confrontations (a d20 at 15). **The Lair's Door** is the rival's own two-plaque card. **The Duel** is an optional stage, dealt only when the table refused them. With both roads taken, the door is step 41, the duel 42 and the dragon 43.
- **Three rivals** in `src/content/dungeon/rivals.ts`, seven cards each, built by `rival()`, with internal keys `bradley`, `mirabel` and `tutt`. Phase 1 renames all three; their names and text are placeholders.
- **The engine** is `src/game/crawl/rival.ts`. All new state is optional, so the schema stays at v2.
  - `party.rival` holds `who`, the ledger `took`, `won`, `lost`, `cut`, `cuts`, `seen` and `news`.
  - `settleRival` runs on every put-aside. It does the introduction (and the `rival-<who>` deed), applies `takes`, and hands one item back on a won confrontation.
  - `rivalFalls` runs when the duel falls and hands everything back.
  - `stalk` runs as each card is dealt. It can make an **ambush** (one of their fights in a room's place), a **meddle** (the d20 rolled twice, the worse kept) or a **snipe** (they take the card's item and heal). Each kind has a cap of 2, appearances are at least 4 cards apart, and they never come at 4 hearts or fewer.
  - `withRival` puts the rival's ribbon on the card in play.
  - `{rival}` fills in text. `Offer.restore` hands everything back. `ally.turncoat` makes a joined rival walk out with the satchel on a lost fight.
  - `QuestStage.ambush` is the pool an ambush draws from. `badRival` validates saves.
- **UI.** A rival chip on the strip opens the "Your rival" dialog (ritual, the current cut, the ledger, the record). Crimson banners sweep in for a cut-in or an ambush. A news banner says what was taken or handed back. A "−N satchel" seal marks a card that takes items. A won duel hangs a trophy.
- **Balance** over 4,000 runs:

  | Measure | Value |
  | --- | --- |
  | Won | 32.8% |
  | Draws in a won run | 61.1 |
  | Each rival | 32% to 39% |
  | Uninvited appearances, a run that reaches the door | 2.1 |
  | Heroic, won | 11.7% |

  To hold the joke classes' 1% floor, the Peasant and the Mimic were softened.
- **Checked:** `npm test` (577 passed), lint, typecheck, the build and budgets, the Quest balance file, Chromium `test:e2e` (179 of 180; the one failure is the known offline-reload race) and Chromium `test:sweep` (12 of 12).
- **Fixtures:** `tests/fixtures/saves/2026-11-15-realms-rival-*` (10). They snapshot Phase 0 text and must keep loading forever.

**Keep the internal keys.** Rename by changing names and text only. `who` stays `bradley`, `mirabel` and `tutt`, and card IDs stay `dungeon.rival-bradley*` and so on. IDs are never recycled, and the frozen fixtures name these keys. The three new rivals get new keys (below).

---

## 2. Decisions

| # | Decision | Source |
| --- | --- | --- |
| R1 | All six rivals ship. | Owner: "All 6 sounds good" |
| R2 | Betrayal is in. A joined rival can turn on the party, including at the dragon. | Owner: "Absolutely betrayal is acceptable" |
| R3 | Rivals can undo a **won** roll (the Do-Over), on top of the meddle. | Owner: "Yes rivals can undo rolls. Maximum frustration." |
| R4 | Names are crude and funny in the CABIIN deck's register: dick and fart jokes, innuendo, "cuck". Never slurs, and nothing about race, disability or real people. | Owner, and `docs/CARD_VOICE_REFERENCE.md` |
| R5 | Every hit from a rival has a **counter the table can choose**: pay them off with an item, which feeds their ledger. Frustration must feel like the rival's doing, not the app cheating. | Planner's call; keeps "hate the guy, not the game" |
| R6 | The win rate may fall toward 25%, still inside the 18% to 40% band. | Planner's call; see section 7 |
| R7 | Internal keys and existing IDs stay. New rivals use new keys. | AGENTS.md: IDs are never recycled |

---

## 3. The six rivals

Each rival has a **name**, a **title** for the card face and ally name (at most 22 characters), a **personality**, a **signature verb**, a **table ritual**, a **door ending** and **three ballad lines** (at most 44 characters). The text below is draft copy. Card rules must be at most 100 characters and 20 words, and titles at most 22 characters with no word over 15; `npm run build` enforces both. Every card names who acts. Write in the CABIIN deck's voice: short, crude, a table action, a drink count.

Alternate names are listed so the owner can swap without rewriting the plan.

### 3.1 Sir Chad Thundercock (key `bradley`): the glory hog

- **Title:** "Sir Chad Thundercock". He says "the Undefeated"; he has only ever fought things already dying. *Alternates:* Sir Brock Biggerdick, Sir Lance Alotless.
- **Personality:** loud, handsome, takes credit, calls everyone "Champ". He shows up the moment a boss falls.
- **Signature:** **Snipe** (weight 6). He also does **Do-Over** (2) and **Ambush** (1).
- **Ritual:** "When Sir Chad shows up, everyone flexes. Weakest flex drinks 1."
- **Snipe line:** "Sir Chad poses with your loot. 'Great teamwork, Champ.' It's his now."
- **Do-Over line:** "'Champ, that didn't count. Again.' Roll it again; the new roll stands."
- **Introduction**, after the first boss: "Sir Chad Thundercock arrives after the boss is dead. He takes the credit and your newest item."
- **Confrontations** (d20 at 15; a loss costs an item and a heart):

  | Title | Rules |
  | --- | --- |
  | Chad's Autograph | Sir Chad is signing your gear with a sharpie shaped like himself. Roll d20 to stop him. |
  | The Gun Show | Sir Chad charges admission to his biceps. Out-flex him: roll d20. Lose: pay in drinks, 3. |
  | Participation Trophy | Sir Chad gives you a trophy that says "Nice Try, Champ". Roll d20 to shove it up his. |
  | Chad's Spotter | Sir Chad needs a spot, on your face. Roll d20 before he finishes his set. |

- **Door ending: he begs, but keeps the credit.** "Sir Chad, cape on fire, wants in. He keeps what he took, and the credit."
  - Join (drink 2): ally +3 against bosses, plus grudge. His ritual: "Everyone says 'nice one, Chad' after every swing."
  - The price: if the dragon falls while Chad is on the team, the ballad and the Chronicle say *Chad* slew it ("Slain by Sir Chad Thundercock").
- **Betrayal:** none. His betrayal is the credit.
- **Ballad lines:** joined "with Sir Chad taking all the credit,", beaten "left Sir Chad crying in a ditch,", ahead "two steps behind Sir Chad Thundercock,".
- **Duel prize:** "Chad's Cape" (+1 to boss d20s).

### 3.2 Lady Fingerbang (key `mirabel`): the thief

- **Title:** "Lady Fingerbang". *Alternates:* Countess Yoinkington, Sticky Vicky.
- **Personality:** charming and handsy, calls everything "mine". She steals two at a time and never hearts.
- **Signature:** **Swipe** (new, weight 4) and **Ambush** (3). She also does **Snipe** (2) and **Poach** (1).
- **Ritual:** "When Lady Fingerbang shows up, everyone guards their drink. Last hand on it drinks 1."
- **Swipe line:** "Lady Fingerbang was here. Check your pockets. Your newest item is gone."
- **Introduction:** "Lady Fingerbang admires your things. 'Mine,' she says, and pockets one."
- **Confrontations** (a loss costs two items, no hearts):

  | Title | Rules |
  | --- | --- |
  | Finders Keepers | "Finders keepers," says Lady Fingerbang, holding your stuff. Roll d20 to get it back. |
  | The Pat-Down | Lady Fingerbang offers to check you for weapons. Thoroughly. Roll d20 to say no. |
  | A Fair Trade | Lady Fingerbang trades your things for a wink. Roll d20 to refuse the wink. |
  | Her Toll Booth | Lady Fingerbang charges a toll of "everything you've got". Roll d20 to run it. |

- **Door ending: she gives it all back to come along.** Taking her restores the whole ledger (built: `restore`). She is a turncoat (built): lose a fight she is sent into and she walks out with the whole satchel. Phase 4 adds a **betrayal roll** at the dragon.
- **Ballad lines:** joined "with Fingerbang's hand in their pocket,", beaten "took it all back from Fingerbang,", ahead "robbed blind by Lady Fingerbang,".
- **Duel prize:** "Fingerbang's Purse" (satchel of 4).

### 3.3 Sensei Saggynuts (key `tutt`): your old master

- **Title:** "Sensei Saggynuts". *Alternates:* Grandmaster Ballsack, Old Master Wanksworth.
- **Personality:** ancient, sitting cross-legged in a loincloth that does not cover enough. Never impressed, never steals, only humiliates. Lost lessons cost hearts.
- **Signature:** **Meddle** (weight 6) and **Do-Over** (3). He also does **Ambush** (2).
- **Ritual:** "When Sensei Saggynuts shows up, everyone bows. He sees up your nose. Last to bow drinks 1."
- **Meddle line:** "'Elbow.' Sensei corrects your form. Roll twice, keep the worse."
- **Do-Over line:** "'Lucky. Again.' Sensei makes you redo it. The new roll stands."
- **Introduction:** "Sensei Saggynuts inspects your work. 'Hm. No.' Everyone sits up straight; slouchers drink 2."
- **Confrontations** (a loss costs a heart):

  | Title | Rules |
  | --- | --- |
  | Pop Quiz | Sensei Saggynuts has a pop quiz and his loincloth is slipping. Roll d20 without looking down. |
  | Wax On, Nuts Off | Sensei makes you wax his... floor. Roll d20 to finish before he sits up. |
  | Posture Check | Sensei taps your spine with his stick. "Slouching." Roll d20 to stand like a hero. |
  | In My Day | "In my day we slew dragons before breakfast." Roll d20 to out-story Sensei Saggynuts. |

- **Door ending: the final exam, or he is pinned.** He never joins as a fighter.
  - If you beat him in fewer than 2 meetings, it is the Final Exam, as built: sit it (the duel) or skip it (drink 3, he keeps the ledger).
  - **Phase 4 adds:** if you beat him in 2 or more, the dragon has him pinned instead. "Sensei Saggynuts, pinned under a claw. 'I was wrong about you.'" Save him (costs a heart) and he joins at +4 for one swing at the dragon, then dies. The "proud of you" beat.
- **Ballad lines:** beaten "passed Sensei Saggynuts' final exam,", ahead "to Sensei Saggynuts' lasting shame,", saved "and carried Sensei home at last," (the pinned ending only).
- **Duel prize:** "Sensei's Stick" (+1 to every d20).

### 3.4 Chuck the Cuck (key `chuck`, new): the squire who just likes to watch

- **Title:** "Chuck the Cuck". *Alternates:* Little Dickie, Squire Fluffer.
- **Personality:** your self-appointed squire. He "helps", watches everything, and holds your sword while someone else uses your stuff. Eager, wet, devoted to whoever is winning.
- **Signature:** **Do-Over** (weight 6) and **Meddle** (3). He also does **Hand-Off** (new, 2): he gives your item to someone else.
- **Ritual:** "When Chuck the Cuck shows up, he just watches. Anyone who makes eye contact drinks 1."
- **Do-Over line:** "Chuck the Cuck 'helps' you with that roll. Again. The new roll stands."
- **Meddle line:** "Chuck the Cuck holds your sword for you. Roll twice, keep the worse."
- **Hand-Off line:** "Chuck the Cuck lends your item to a nice stranger. It's gone."
- **Introduction:** "Chuck the Cuck appoints himself your squire. He'll hold your things. He keeps one."
- **Confrontations** (a loss costs an item):

  | Title | Rules |
  | --- | --- |
  | Chuck Just Watches | Chuck the Cuck pulls up a chair to watch you work. Roll d20 to make him leave. |
  | Chuck Holds Your Ale | Chuck the Cuck "holds" your drink. It's half gone. Roll d20. Lose: finish what's left. |
  | Chuck's Cheering | Chuck the Cuck cheers for the monster. Loudly. Roll d20 to shut him up. |
  | Chuck Takes Notes | Chuck the Cuck is writing down everything you do "for later". Roll d20 for the notebook. |

- **Door ending: he begs to serve, and it's a coin.** "Chuck the Cuck, on his knees, begs to serve you. He'll just watch." Take him (drink 2): a coin is flipped when he joins (the coin renderer exists). Heads, he is secretly excellent: ally +5 against anything. Tails, he is useless: +0, and his ritual stays.
- **Betrayal:** Chuck never turns. He just switches sides if the party drops to 2 hearts or fewer: he leaves to watch the dragon instead. Leaving costs nothing but the ally.
- **Ballad lines:** joined "with Chuck the Cuck just watching,", beaten "sent Chuck the Cuck home to watch,", ahead "while Chuck the Cuck just watched,".
- **Duel prize:** "Chuck's Notebook" (+1 heal on every heal).

### 3.5 Gary Shitwhistle (key `gary`, new): the king's auditor

- **Title:** "Gary Shitwhistle". He is the Royal Auditor. *Alternates:* Clerk Pissbucket, Taxman Tim Turdwell.
- **Personality:** officious, dull and legal. Everything he takes comes with a receipt. He blows his little whistle when you break a rule.
- **Signature:** **Invoice** (new, weight 6): pay a heart or an item, table's choice. He also does **Squat** (new, 2: he is in your bed at the inn) and **Ambush** (2).
- **Ritual:** "When Gary Shitwhistle shows up, he blows his whistle. Everyone freezes; first to move drinks 1."
- **Invoice line:** "Gary Shitwhistle presents an invoice. Pay a heart or an item."
- **Squat line:** "Gary is in your bed. 'Audit,' he says. Rest heals 1 less."
- **Introduction:** "Gary Shitwhistle, Royal Auditor, finds irregularities. He fines you one item."
- **Confrontations** (a loss costs a heart and an item, the dearest):

  | Title | Rules |
  | --- | --- |
  | Receipts, Please | Gary wants receipts for every drink tonight. Roll d20 to produce them. Lose: drink 3. |
  | The Whistle | Gary blows his whistle at your stance. Roll d20 to stand legally. Lose: drink 3. |
  | Form 27-B | Gary needs form 27-B in triplicate. Roll d20. Lose: everyone signs a napkin, you drink 3. |
  | Back Taxes | Gary has calculated your back taxes. Roll d20 to dispute. Lose: drink 3, then 1 more. |

- **Door ending: settle the debt.** "Gary Shitwhistle tallies the debt at the door. It's itemised."
  - Pay in drinks: the drawer drinks one for every item he holds, and he hands everything back.
  - Refuse: the duel, which for Gary is a 3-hit ambush ("The Audit").
- **Betrayal:** none. He never joins.
- **Ballad lines:** beaten "audited the auditor, Gary Shitwhistle,", ahead "owing Gary Shitwhistle a fortune,".
- **Duel prize:** "Gary's Whistle" (once a region, cancel a cut. This is a new effect; Phase 3.)

### 3.6 Dame Queefington (key `queef`, new): the rival bard

- **Title:** "Dame Queefington". She plays the wind instrument nobody asked for. *Alternates:* Barnaby Jerkinoff, Lute Dickinson.
- **Personality:** sings your failures, out of tune, with gestures. Lays curses in song. Writes the ballad.
- **Signature:** **Curse** (new, weight 5): she lays one of her own jinxes. She also does **Snipe** (2) and **Meddle** (2).
- **Ritual:** "When Dame Queefington plays, everyone hums along. Anyone who laughs drinks 1."
- **Curse line:** "Dame Queefington writes a song about you. It's catchy. You're cursed."
- **Introduction:** "Dame Queefington has written a song about your last fight. It rhymes 'hero' with 'zero'."
- **Confrontations** (a loss costs a heart and lays her jinx):

  | Title | Rules |
  | --- | --- |
  | The Diss Track | Dame Queefington drops a diss track about you. Roll d20 to drop one back. |
  | The Encore | Dame Queefington is doing an encore nobody asked for. Roll d20 to pull the plug. |
  | Requests | Dame Queefington takes requests. Yours is "stop". Roll d20 to make her. |
  | The Open Mic | Dame Queefington hands you the lute. Sing 10 seconds, then roll d20. |

- **Her jinxes:** "Backing Vocals": the cursed player hums after every drink; forget and drink 1. "Rhyme Time": the cursed player speaks in rhyme; slip and drink 1.
- **Door ending: she writes your ballad either way.** "Dame Queefington has your ballad half written. How it ends depends on you."
  - Take her: ally +2 to anything, and the end-screen ballad is flattering. It uses her verse set (`verse.joined`) plus a fifth line she signs.
  - Refuse: the duel. Win or lose, the ballad's lines are hers and vicious, unless you won the duel.
  - **Phase 4:** the ballad picks between her flattering and vicious line sets by the record. Joined, or the duel won: flattering. Otherwise: vicious.
- **Betrayal:** at the dragon she may stop playing to sing the dragon's song: the dragon's next swing is 2 easier for it, which means 2 harder for you.
- **Ballad lines:** joined "sung well by Dame Queefington,", beaten "silenced Dame Queefington's lute,", ahead "to Dame Queefington's mocking tune,".
- **Duel prize:** "Queefington's Lute" (lore +1).

### 3.7 Card count

There are 7 cards per rival: the introduction, four confrontations, the door card and the duel. Six rivals make 42. Phase 0 shipped 21. Phase 3 adds 21, plus the Phase 4 variants (Sensei pinned) and Dame Queefington's jinx carriers if they are separate cards. Realms grows from 638 to about 660. Update the count comment in `tests/workshop.test.ts`.

---

## 4. The verbs

A rival turns up uninvited through `stalk` as the next card is dealt. The roll, and which verb comes, are saved on the party (`cut`) so a reload never decides it again. Each rival's `style` weights choose among the verbs open on that card. Caps are per run. New verbs are marked **(new)**.

| Verb | On | What happens | Counter | Cap |
| --- | --- | --- | --- | --- |
| Ambush (built) | A room, not the first of its stage | One of their confrontations replaces the room | Pay off before the roll | 2 |
| Meddle (built) | A single-d20 fight, before the roll | Rolled twice, the worse kept | Pay off | 2, raised to 3 |
| Snipe (built) | A card that gives an item or a heal | Its item goes to the ledger; the heal is lost | Pay off | 2 |
| **Do-Over** (new) | A single-d20 fight, **after a winning roll** | The roll is wiped and rolled again. The new roll stands, win or lose. | Pay off, once the win is on the card | 2 a run; never the dragon |
| **Swipe** (new) | A card with no fight and no offers | The newest satchel item goes to the ledger | None (it is already done); a banner says so | 2 |
| **Hand-Off** (new) | As Swipe | The item is given away: gone for good, not on the ledger | None | 1 |
| **Poach** (new) | Any card while an ally lives | The ally leaves, to the ledger's `poached`, unless the drawer drinks 4 (a plaque) | Drink 4 | 1 |
| **Squat** (new) | An inn | Rest heals 1 less; a plaque "Kick them out · drink 4" restores it | Drink 4 | 1 |
| **Invoice** (new) | Any card | Two plaques before the card: "Pay a heart" or "Pay an item" | Choose which; with no items, it is a heart | 2 |
| **Curse** (new) | Any card with no jinx | Their jinx is laid when the card is put aside | Pay off | 2 |

**Pay off** (new, R5): while a cut is on the card, a plaque reads "Pay off · <item>". It moves one satchel item to the ledger and cancels the cut. On a Do-Over, it is offered after the winning roll and before the wipe. It turns frustration into a choice, and the choice feeds the ledger, which makes the duel worse (Phase 4).

**Do-Over engine.** The card is marked before the roll (`cut: "redo"`), so the ribbon warns the table. If the roll wins, `awaitingRedo(s)` holds the card and `advance` waits. The card's plaques are "Ugh, again" (`redoRoll`: clears `roll`, sets `rival.redone`, and the next roll stands) and "Pay off". A losing first roll is left alone. The rival only undoes wins. Never use it on a lair fight, a coin, a push-your-luck card or a choice card. It stacks with a Lucky Coin reroll: the coin rerolls a loss, Chuck rerolls a win.

**Stalk tuning (Phase 2):**

| Setting | Phase 0 | Phase 2 target |
| --- | --- | --- |
| `RIVAL_RATE` | 0.4 | 0.45 |
| `RIVAL_GREED` (per item held, up to 3) | 0.1 | unchanged |
| `RIVAL_GAP` | 4 | 3 |
| `RIVAL_MERCY` | 4 | 3 |

The rival also comes to the **side quest's guards** and to **bosses** (Do-Over and Meddle only). The total uninvited cap is 7 a run.

---

## 5. The data model

All additions are optional. The session schema stays at v2. Every new field gets a check in `badRival` or `validateParty` and a fixture.

```ts
// CardDefinition.rival (built: who, profile, takes, returns), plus:
interface RivalCard {
  who: string;
  profile?: RivalProfile;
  takes?: number;
  returns?: number | "all";
  /** Phase 2: a lost meeting also lays this card's jinx (Queefington). */
  curse?: true;
  /** Phase 3: Gary's door: drinks per item to settle. */
  settle?: true;
  /** Phase 4: on a door card, which ending this is. */
  ending?: "beg" | "buy-in" | "exam" | "pinned" | "settle" | "ballad" | "serve";
}

interface RivalProfile {
  name: string;
  ritual: string;
  // Phase 1 adds the lines each verb reads (at most 80 characters):
  lines: Partial<Record<Verb, string>> & {
    took: string;      // "Sir Chad pockets your {item}." News banner.
    back: string;      // "Fine. Take your {item}." News banner.
    lostTo: string;    // after the party loses a confrontation
    beaten: string;    // after the party wins one
  };
  style: Partial<Record<Verb, number>>;  // 0 to 9
  verse: { joined?: string; beaten: string; ahead: string; saved?: string };
  /** Phase 4 */
  betray?: { base: number; perWin: number; does: "satchel" | "heal" | "song" | "leave" };
  /** Phase 5: the medallion's emblem key in quest-art and the rival's colour. */
  mark?: string;
  colour?: string;
}
type Verb = "ambush" | "meddle" | "snipe" | "redo" | "swipe" | "handoff"
  | "poach" | "squat" | "invoice" | "curse";

// PartyState.rival (built: who, took, won, lost, cut, cuts, seen, news), plus:
interface RivalState {
  cut?: Exclude<Verb, "ambush">;  // widened from "meddle" | "snipe"
  /** Phase 2: the Do-Over used on the card in play (the next roll stands). */
  redone?: true;
  /** Phase 2: an ally they poached, by card ID (back when they fall). */
  poached?: string[];
  /** Phase 4: decided at join, the dragon round they turn on, or none. */
  turnsAt?: number;
  /** Phase 4: they turned (news and the ending). */
  turned?: true;
}
```

`Offer` adds `payOff?: true` (moves an item, cancels the cut), `settle?: true` (Gary), `coinJoin?: true` (Chuck) and `save?: true` (Sensei pinned). `ally` adds `grudge?: true`, which means the bonus is `bonus + min(2, rival.lost)`. Read the grudge in `assistBonus`.

**The Chronicle (Phase 6)** adds `rivals?: Record<who, { met, beaten, lostTo, joined, betrayed, slainBy }>` under the existing key `side-quest.chronicle.v1`. It stays optional, and `readChronicle` drops a malformed field alone.

---

## 6. Phases

Each phase is one session and one pull request. Each ends with: `npm test`, lint, typecheck, `npm run cards:review`, `BASE_PATH=/side-quest/ npm run build`, `npm run test:balance` (the Quest file; the League file whenever a shared engine path changes), Chromium `test:e2e` and, after any card text change, Chromium `test:sweep`. Add fixtures for every new saved state (`npm run fixtures:saves <date> <name>`), and write the `docs/STATUS.md` entry.

### Phase 1: names and voice (content only) (built 2026-11-15; see `docs/STATUS.md`)

**Goal:** the three built rivals become Sir Chad Thundercock, Lady Fingerbang and Sensei Saggynuts, with every line rewritten in the crude CABIIN voice. No engine change except the profile's `lines`.

1. Rewrite `src/content/dungeon/rivals.ts` names, titles, rules, outcomes, rituals and verses from section 3. Keep keys and IDs.
2. Add `RivalProfile.lines`: `took`, `back`, `lostTo`, `beaten`, and one line per verb they use. `PartyNewsBanner` and the cut-in banner read them in place of the generic text. `{item}` is filled with the satchel item's name.
3. The door cards' plaque labels (at most 18 characters): "Take Chad · drink 2", "Kick his ass", "Take her", "Duel her", "Sit the exam", "Skip it · drink 3".
4. Update `tests/rival.test.ts`: the name assertions, and every line fitting its limit.
5. Update the browser specs: `crawl.spec.ts` "the rival" names Sir Chad, and the door test names his plaques.
6. Run the sweep. New text must fit the card at 320px.

**Done when:** no "Bradley", "Mirabel" or "Tutt" text is left in `src/` (keys excepted); every line is within its limit; the sweep is green.

### Phase 2: maximum frustration (engine) (built 2026-11-15; see `docs/STATUS.md`)

**Goal:** the new verbs, the Do-Over, pay-offs, and your stolen items used against you.

1. **Do-Over:** `cut: "redo"`, `awaitingRedo`, `redoRoll`, `party.rival.redone`; `advance` waits. The `UsePlaque` or `FanPlaque` slot shows "Ugh, again" and "Pay off". The controller's `undo()` must not undo a Do-Over: treat `redoRoll` like `roll` and clear `undoable`.
2. **Pay off:** an `Offer`-like plaque on any card with a cut (`payOff(s, item)`). It moves the item to the ledger, clears `cut`, and counts in `cuts.paid`.
3. **Swipe, Hand-Off, Poach, Squat, Invoice, Curse:** each in `stalk`'s open set with its own conditions (section 4), each saved as `cut`, and each settled in `settleRival` or a plaque handler.
   - Invoice and Poach and Squat put plaques on the card. Reuse `offers` through an overlay in `withRival`, as `atRound` does for the dragon. Do not mutate snapshots.
   - The Invoice's plaques replace the card's own only until paid, then the card reads as written.
4. **The duel uses their ledger** (`rivalArsenal(q)`), shown as seals on the duel card:
   - Each Tower Shield held: +1 hit (swing) on the duel.
   - A Lucky Coin held: their first loss is a Do-Over (a won swing of yours is redone).
   - A Draught held: once, a landed swing heals them (hits −1).
   - A Smoke Bomb: if you lose the first swing, they flee with everything. The duel ends lost, and the items are gone for good.
   - Read these in `hitsNeeded` and `discardCard`'s duel branch. Validate in `badRival`.
5. **Grudge:** `ally.grudge` adds `min(2, rival.lost)` to the joined rival's bonus.
6. **Tuning:** the section 4 table, raising the Meddle cap to 3, a total cap of 7, and bosses and guards opened for Do-Over and Meddle.
7. **Balance:** see section 7. Retune `RIVAL_*`, never card by card.

**Fixtures:** `-rival-redo-waiting`, `-rival-redone`, `-rival-paid-off`, `-rival-swipe`, `-rival-poach-waiting`, `-rival-squat`, `-rival-invoice-waiting`, `-rival-curse-laid`, `-rival-duel-arsenal`.

### Phase 3: rivals four to six (built 2026-11-15; see `docs/STATUS.md`)

**Goal:** Chuck the Cuck, Gary Shitwhistle and Dame Queefington, 21 cards, and their door endings.

1. Add the three to `rivals.ts` through `rival()`. Extend `rival()` for per-rival stakes (`takes` and `damage` already; add `curse`) and per-rival door shapes (`ending`).
2. **Chuck's door:** `coinJoin`. A coin flips at join (`party.coin` with `for: "join"`, the coin renderer). Heads saves the ally's bonus as 5; tails as 0. Store it as `rival.joinFace`, and read it in `assistBonus`. He leaves at 2 hearts or fewer (a check in `discardCard` after hearts settle; news "Chuck went to watch the dragon instead").
3. **Gary's door:** `settle`. "Pay · drink N" (N is the ledger size, at least 1; the label is computed in the UI from the ledger) restores everything; "Refuse" deals The Audit, a duel of `hits: 3`.
4. **Dame Queefington's door:** join (ally +2, any calling) or refuse (the duel). Her jinxes are attached to her confrontations (`jinx` plus `rival.curse`).
5. **Gary's Whistle** (his duel prize): a new boon effect `OmenEffect.hush?: true`. Once a region it cancels a cut (a plaque). It is counted per region in `party.rival.hushed`, reset when a region boss falls.
6. The "Your Rival" stage pool grows to 6 intros; the Crossroads and the ambush pool to 24; the door's and duel's variants to 6 each.
7. Check that the stage `variants` choose the right rival's cards for all six (`tests/rival.test.ts` loops over `rivals`).

**Fixtures:** `-rival-chuck-joined-heads`, `-rival-chuck-joined-tails`, `-rival-gary-settled`, `-rival-gary-audit`, `-rival-queef-jinx`.

### Phase 4: betrayal and the door as a real choice

**Goal:** joining is a gamble you remember; refusing costs something real.

1. **Betrayal roll at join.** For rivals with `profile.betray`, the dragon round they turn on is decided when they join, saved as `rival.turnsAt`, and never re-rolled. The chance is `base + perWin × rival.won`. The more you beat them, the more they hate you. Suggested values:

   | Rival | base | perWin | When they turn |
   | --- | --- | --- | --- |
   | Lady Fingerbang | 0.25 | 0.15 | The satchel goes to the ledger, and she leaves the team. |
   | Dame Queefington | 0.20 | 0.10 | That round's dragon move is `harder: 2` against you, and she stops playing (leaves). |
   | Sir Chad | none | none | Credit instead (below). |
   | Chuck | none | none | He leaves at 2 hearts or fewer. |

   The turn happens when `nextDuel` deals round `turnsAt`. Write it in `discardCard`'s lair branch, set `rival.turned`, and save the move change on `party.duel` so it never re-rolls.
2. **The betrayal moment** (Phase 5 draws it; Phase 4 sets the news): "Lady Fingerbang turns on you. Everyone who voted to take her drinks 3." Make the vote count by telling the table in the door card's rules that "Dissenters drink 2" and the betrayal line "Everyone who voted yes drinks 3". These are spoken, no tracking.
3. **Sir Chad's credit:** if the run is won with him on the team (`rival-joined`, not turned), `chronicle.slainBy` records Chad, and the ballad's last line becomes "and Sir Chad slew {dragon}. Allegedly." (fits 44 with short names; give a short form).
4. **Sensei pinned:** the door's variants gain one for `rival-tutt` + `rival-won-2`. Add a deed `rival-won-2` set in `settleRival` when `won` reaches 2. The card is "Pinned!": "Save him · lose 1 heart" or "Leave him". Saved, he joins at +4 with `calling: ["boss"]` and dies after one swing, sent or not (`ally.once`). Left, the ballad says "and left Sensei to the dragon,".
5. **Dame Queefington's ballad:** `ballad.ts` gains a rival override. Joined or duel won: her flattering set; otherwise her vicious set. Both are sets of five lines (draft them with the 44-character limit), signed "Dame Queefington".
6. **The duel's refusal stakes:** refusing any rival and losing the duel means they walk into the lair first. The dragon starts with `hits: 1` already landed by them ("They softened it up. Allegedly."), they take the credit, and the ledger is lost for good. Winning returns everything and a trophy (built).
7. **Ally balance:** the joined rival's grudge bonus (Phase 2) makes the most hated rival the strongest ally. Check that "joined" runs win more than "refused and lost" runs, but fewer than "refused and won" runs, so each choice has a cost.

**Fixtures:** `-rival-turns-at-saved`, `-rival-turned`, `-rival-chad-credit`, `-rival-sensei-pinned`, `-rival-sensei-saved`, `-rival-ballad-queef`, `-rival-went-in-first`.

### Phase 5: presentation

**Goal:** you can see the rival's face, watch them take your things, and feel the Do-Over.

1. **A rival medallion per rival**: an emblem from the vendored game-icons set through `scripts/quest-art.ts`, written to `quest-art.generated.ts` and kept in lazy chunks only. Use it on the strip chip, the dialog, banners and the duel trophy. Each rival has its own colour (`profile.colour`).
2. **Moments** (in `moments/detect.ts` and `views.tsx`, each with a `Stage` and a still plaque under Reduced Motion):
   - `rival-enter` on the introduction: their medallion slams in, name letter by letter, ritual underneath. Blocking, about 3 s.
   - `rival-takes`: the item's icon flies from the satchel chip to the rival chip (`fly.ts`), with the `lines.took` line.
   - `rival-gives`: the reverse.
   - `redo`: a "DO-OVER" stamp across the dice result, in the rival's colour, with a short shake. Then the dice come back.
   - `betrayal`: the screen cracks, the ally's medallion flips to the rival's, and "Et tu?" sweeps across.
   - `chad-credit` on the end screen: "Slain by Sir Chad Thundercock (allegedly)" stamped over the dragon's trophy.
3. **The map:** the rival's token follows a step behind the party's on `QuestMap.tsx`, and sits on the region where they last appeared.
4. **The end screen:** a "Nemesis" panel under the trophy wall shows their medallion, the record ("Beaten 2, lost to 3"), what they still hold, and how it ended (joined, betrayed, duelled, credit).
5. **Workshop:** add every new moment to `?moments=1`.

**Checks:** Chromium screenshots of each moment frame by frame at 390x844; `tests/moments.test.ts` for detection (never on resume, undo or the same state).

### Phase 6: the Chronicle's nemesis

**Goal:** the hate carries between nights.

1. `Chronicle.rivals` (section 5), folded in by `recordRun`.
2. **The pick is weighted:** at `createSession`, a rival who beat you last run (the run ended with them holding items, or they turned, or they went in first) is twice as likely in the "Your Rival" stage pool. This needs `createSession` to take a `nemesis` hint beside `unlocked`. Pass it from `main.tsx`. Keep the League's draws unmoved.
3. **A returning introduction:** each rival gets a second intro card ("back for more") dealt when the Chronicle shows you met them before. It is a variant of the "Your Rival" stage keyed by the deed `nemesis-<who>`, set at session start from the Chronicle. Example: "Sir Chad Thundercock is back. 'Remember me, Champ?' He takes two this time."
4. **Feats:**

   | Feat | Earned by |
   | --- | --- |
   | Paid in Full | Beat your rival's duel holding nothing of yours |
   | Et Tu | Be betrayed |
   | Just Watching | Win with Chuck useless (tails) on the team |
   | Allegedly | Win with Sir Chad on the team |
   | Audited | Settle Gary's debt in drinks |
   | Bad Reviews | Lose to Dame Queefington's vicious ballad |

   The Chronicle screen gets a "Rivals" section with each one's medallion and record.
5. **Unlock:** beat all six rivals' duels to unlock "The Ex", a seventh rival who is all six verbs at once, rare at 5%. **Optional**; the owner decides in Phase 7.

### Phase 7: the owner's table

Not code. The owner plays at least three runs on a phone (one where the rival is joined, one refused, one Heroic) and answers:

- Do you hate them by the door?
- Is the Do-Over funny or infuriating in a bad way?
- Do pay-offs get used?
- Is the betrayal a story or a cheat?
- Does any name land flat?

Record the answers in `docs/DEVICE_CHECKLIST.md`, then tune from them.

---

## 7. Balance targets

The `tests/dungeon.balance.test.ts` simulated table must learn each new decision. Suggested policies:

| Decision | Policy |
| --- | --- |
| Pay off | Above 6 hearts, never; at 6 or fewer, a Do-Over on a boss swing is paid |
| Poach | Drinks to keep the ally (always) |
| Squat | Kicks them out when hurt |
| Invoice | An item over a heart above 6 hearts |
| The door | A healthy table refuses; a hurt one joins; Gary is paid when the ledger holds 2 or fewer |
| Chuck | Always joined |
| Sensei pinned | Saved above 3 hearts |

| Measure | Band (4,000 runs) | Phase 0 |
| --- | --- | --- |
| Won | 22% to 32% (AGENTS.md band 18% to 40% holds) | 32.8% |
| Each rival's runs won | 10% to 50%, and within 12 points of each other | 32% to 39% |
| Uninvited appearances, a run that reaches the door | 3 to 6 | 2.1 |
| Do-Overs, a run that reaches the door | 0.5 to 2 | none |
| Items they hold at the end, runs not refused-and-won | 1 to 3 | 0.6 |
| Joined runs won compared with refused runs won | both 15% to 45%; joined below refused-and-won-the-duel | none |
| Betrayal, among joined Fingerbang and Queefington runs | 20% to 45% | none |
| Draws in a won run | up to 65; owner-approved to raise for The Quest, record the number | 61.1 |
| Joke classes | 1% to 10% (tune through `RIVAL_MERCY` before touching classes) | 1% to 2% |
| Heroic | 5% to 20% | 11.7% |

Add `QUEST_RIVAL=<who>` to force a rival for tuning, beside `QUEST_RUNS` and `QUEST_JOKES`.

---

## 8. Tests and fixtures

- `tests/rival.test.ts`: one `describe` per phase. Loop over `rivals` for anything every rival must do: names, line limits, the intro taking, the Crossroads dealing their own fight, the door dealing their own card, the duel handing back. Write a direct test for each verb, each counter, each door ending, betrayal timing (saved, never re-rolled, round trip), the arsenal's effects and Chuck's coin.
- Every new saved state round-trips through `parseSession`. Every malformed shape is rejected (`badRival` and `validateParty`).
- The fixture names are listed per phase. `scripts/save-fixtures.ts` finds each from seeded play (`table-play.ts` takes plaques at random, so it reaches the waiting states).
- `tests/save-fixtures.test.ts` must keep every old fixture loading, including `2026-10-25-crawl-rival-on-the-stairs`, `2026-11-14-realms-door-humbled` and the ten `2026-11-15-realms-rival-*`.
- Browser (`tests/browser/crawl.spec.ts`): the chip, the dialog, a Do-Over's plaques, a pay-off, the door for each kind of ending. The sweep covers the card fit.
- `tests/moments.test.ts`: every new moment detected once and never on resume or undo.

---

## 9. Rules every phase keeps

- Schema v2. New state is optional, never a migration. Old fixtures load and play on.
- Engine purity: `src/game` never imports content or DOM. Rival profiles reach the engine only through card snapshots.
- Randomness is injected. `stalk` draws randomness only once a rival is met (the League's draws never move). Every decision is saved before it is shown, so a reload never re-decides it.
- Text limits:

  | Field | Limit |
  | --- | --- |
  | Rules | 100 characters and 20 words |
  | Title | 22 characters, 15 per word |
  | Plaque label | 18 characters |
  | Ribbon | 32 characters |
  | Ballad line | 44 characters |
  | Ally name | 22 characters |
  | Profile lines | 80 characters; the ritual 110 |

  Every card says who acts. Realms curses say "the cursed player".
- Card text loads per pack; nothing rival-specific goes into the initial chunk. New art goes in lazy chunks. The 6 MiB runtime budget holds.
- No new dice renderer. Chuck's coin uses the coin stage.
- Push to `main` only with the owner's word; it deploys.

---

## 10. Risks and open questions

- **Frustration curdling.** The Do-Over plus Meddle on the same night can feel like the app cheating. Mitigations:
  - Every cut is announced on the ribbon before the roll.
  - Every cut has a pay-off.
  - The rival's name and line are on every hit.
  - Caps hold.

  The owner's table (Phase 7) is the test.
- **Crude names and the room.** The names suit the CABIIN deck's room, but a table that plays Realms "clean" has no switch. Possible later work: a "Clean names" toggle in settings that swaps `profile.name` for the alternates. Not planned; ask the owner.
- **Run length.** Invoices, poaches and Do-Overs add taps, not draws, so the draw count should hold. Taps per run is not measured. Consider counting plaque presses in the balance harness.
- **Betrayal at the dragon on a wipe edge.** A turn that empties the satchel at 1 heart is a guaranteed loss. Decide in Phase 4 whether a turn waits until hearts are 3 or more (the planner's suggestion: yes, "they wait for the dramatic moment" reads better than an instant kill).
- **Gary's pay-in-drinks** at 5 or more items is a lot to drink. Cap it at 6.
- **Open for the owner:** the alternate names (section 3), whether "The Ex" (Phase 6) ships, and whether the clean-names toggle is wanted.
