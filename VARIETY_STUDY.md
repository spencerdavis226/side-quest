# Variety study: what makes a card fun, and how to get more of it

2026-10-31. Brainstorm and research, not an approved plan. Nothing here is built. `docs/STATUS.md` stays the handoff; this file is input for the owner's next decision.

Owner's ask: double down on variety and interesting cards, enough of them that runs differ, and especially variety *within* cards ("many have the same general thing: roll a dice and drink like 3"). Also better themes and more excitement.

## 1. The short answer

- **The problem is the verb, not the card count.** Pub Crawl has 566 cards and a run deals about 50 of them, so you rarely see a repeat card. You see a repeat *action*: read a flavor sentence, roll one d20, drink or give 3 to 4. Fifty different cards that all play the same feel like one card dealt fifty times.
- **The crawls are the least varied part of the game.** The packs with the most mechanical variety (Secrets & fuses, Most Likely To, the Core challenges) have almost no presence in the two modes where most of the recent work went.
- **The biggest wins need little or no engine work.** The engine already supports hold-to-read secrets, timers, Won/Lost table fights, offers, multi-die placeholders and push-your-luck. The crawls barely use most of them.
- **Recommendation:** set a "verb budget" per floor/route (no more than about a third single-d20 rooms), convert d20 rooms into the formats in section 4, and add a test that enforces the mix so it does not drift back.

## 2. Audit of the current cards (measured)

Script: a one-off `tsx` pass over `src/content/catalog.ts` (not committed). "Flavor + pour only" is a heuristic: an outcome whose only instruction is drink/give N, with or without a narration clause. Treat it as ±5 points.

| Pack | Cards | Dice cards | Single d20 with the 4-band template | Outcomes that are flavor + pour only | Secret / timer cards |
| --- | --- | --- | --- | --- | --- |
| Dungeon night (Pub Crawl) | 566 | 297 | **267** (47% of the pack) | **~54%** of 1,176 | 0 / 0 |
| Pokémon + League | 562 | 209 | 128 | ~26% of 819 | 0 / 0 |
| Core (generated) | 96 | 16 | 0 | 0% | 0 / 0 |
| Cabin | 85 | 23 | 0 | ~39% | 0 / 0 |
| Secrets & fuses | 156 | 0 | 0 | n/a | 123 / 75 |
| Most Likely To | 250 | 0 | 0 | n/a | 0 / 0 |

What the numbers mean in play:

1. **One template dominates Pub Crawl.** 267 rooms are `flavor. Roll d20.` with four bands: natural 1, lose, win, natural 20. Example (`dungeon.the-accountant`): "1: Drink 6. 2-7: Drink 3. 8-19: Give 3. 20: Give 6." The natural bands are the lose/win line repeated with the number doubled, so half of every card's outcomes add no new content.
2. **The setup rarely asks anything.** 147 of the 267 Pub Crawl d20 cards have a setup that is one flavor sentence plus "Roll d20". The drawer's only action is tapping the die. Nobody else at the table has a role.
3. **Pour sizes cluster.** In Pub Crawl outcomes, 3 and 4 account for 481 of about 1,160 numbered pours, and 6/8 are mostly the natural-doubled copies. The *shape* of a pour almost never changes (no waterfalls, swaps, "drink per X", splits, mates).
4. **The good formats live elsewhere.** Paranoia, Fact or Cap, No Saying It, hot potato fuses, forehead guesses and votes are all in Secrets & Most Likely To. Pub Crawl and the League use none of the secret/timer fields.
5. **The League is better but leaning the same way.** Gyms and Legendaries often add a physical twist ("Shut your eyes, then roll d20"; "stare into her eyes"), which is the right instinct. Wild fights and trainers mostly do not.
6. **What already works, keep it:** strikes (one line read by the matchup), table moments, boss phases with table duels, forks and merchants, the ball throw with per-Pokémon odds and lines, and Pub Crawl's push-your-luck gambles.

## 3. Research: what other games do that we don't

Sources are listed at the end. Web quality for drinking games is poor (mostly SEO pages); the useful lessons come from established party, roguelike and dice games.

| Source | Lesson | What it means for Side Quest |
| --- | --- | --- |
| **WarioWare** microgames | Each game is one verb ("Pick!", "Dodge!"); the variety *is* the variety of verbs, and rules must be instantly graspable. | Track verbs, not card counts. A floor should cycle through many verbs, each readable in one glance. |
| **Mario Party** minigame types | Formats rotate who is involved: free-for-all, 1v3, 2v2, duel, and "battle" (everyone pays into a pot, redistributed by result). | Almost every crawl card is drawer vs. card. Add duels, 1v3, 2v2 and pot cards. |
| **Slay the Spire** "?" events | Short scenes with 2 to 3 choices and visible costs; some escalate (Knowing Skull: each pull costs one more HP). | Offers exist; use them for real dilemmas, not just "level up / heal". Escalating price cards. |
| **Balatro** jokers | Developer: the interesting part is the tough A/B choices; effects are deliberately spiky and uneven, so runs have "absurd" moments. | Allow rare, lopsided cards. A run should have one moment people retell. |
| **Push-your-luck classics** (Can't Stop, Farkle, Incan Gold, Dungeon Roll) | The fun is the decision to bank or continue, not the roll. | Pub Crawl's `press` gambles prove this. The League has none. |
| **Bar dice games** (Three Man, Ship Captain Crew, Liar's Dice) | Roles assigned by the dice ("you're the Three Man"), set-aside sequences, bluffing about hidden dice. | Roles and bluffing are missing. The secret field can carry a hidden roll or a hidden truth. |
| **Kings Cup** roles | Thumb Master, Question Master, Mate, Snake Eyes: a role that lasts until someone else takes it, and a gotcha the table enjoys catching. | Already passes the owner's table-rule test (#2: a gotcha with a 1-drink slip). Jinxes are the tracked version; use them for roles, not just restrictions. |
| **Picolo** (phone drinking app) | Lasting "virus" cards are the memorable ones; card types are color-coded. | Same lesson as jinxes: lasting rules create callbacks. |
| **Jackbox** (Fibbage, Quiplash) | Everyone acts at once; lying is rewarded, so people commit to it. | Cards where every player answers or votes, and where bluffing pays. |
| **Nuzlocke** challenges | Self-imposed stakes: nickname every catch, fainted means gone. Variants (Wedlocke, Soul Link) are pairings. | Name a caught Pokémon after a player; that player drinks when it's used or lost. Pairing players to Pokémon is free, spoken table state. |
| **Hades** duo boons | Two things you picked combine into a third, so builds feel intentional. | A light version: items or teammates that pair (a Water teammate plus a Potion), or omen + class pairings with a line of their own. |
| **Pokémon drinking boards** (fan-made, game-of-the-goose style) | Every tile is a Pokémon or a trainer with a task; gyms are special. | This is the source the Pokémon pack already translated. The fan boards' strength is the *task*, which our wild fights mostly replaced with a roll. |

## 4. The verb palette (the core proposal)

Each row is a card format. "Engine" says what it needs: **none** (content only, existing fields), **small** (a new optional field, schema v2 unchanged), or **new** (a real feature). Examples are drafts in the house voice, for tone only.

| # | Verb | How it plays | Engine | Example (draft) |
| --- | --- | --- | --- | --- |
| 1 | **Duel** | Drawer picks an opponent; a physical or verbal contest settled by Won/Lost. | none (Won/Lost battle) | *Bar Fight.* "Pick someone. Thumb war, best of three." Lost: drink 4, lose a heart. |
| 2 | **Tag team (2v2, 1v3)** | Drawer picks a partner, or takes on the whole table. | none | *Tag In.* "You and your left neighbor vs. the table: name 10 Pokémon in 20 seconds." Timer + Won/Lost. |
| 3 | **Side bets** | Before the roll, everyone shows thumbs up/down on the drawer. Wrong guessers drink 1. | none (rules text) or small (a "Bets in" plaque) | Any boss's first beat: "Side bets: thumbs up or down on the drawer, then roll." Turns a solo roll into a table event. |
| 4 | **Bluff** | Drawer reads a hidden truth and tells the table something; someone calls it. | none (`secret`) | *The Chest.* Secret: "It's a MIMIC." "Read alone. Tell the table what's inside. Anyone may call bluff: wrong caller drinks 3, caught liar drinks 3." |
| 5 | **Hidden fuse** | Pass the phone answering a category until it blows. | none (`timer` fuse) | *Lit Keg.* "Category: beers. Answer, pass the phone. Holding it when it blows: drink 4 and lose a heart." |
| 6 | **Push your luck** | Bank or go again (`press`). | none in Pub Crawl; League needs `press` allowed there | League *Old Rod*: each cast catches a better prize or Gyarados bites. *Game Corner* slots. |
| 7 | **Auction / bid** | The table bids sips for a loot; highest bidder drinks the bid and takes it. | none (spoken) + an offer | *Black Market Potion.* "Bid in sips, clockwise. Winner drinks the bid; take the Potion." |
| 8 | **Real dilemma** | Two or three offers with real costs on both sides. | none (`offers`, `cost`) | *Cursed Altar:* "Drink 3 for an item", "Lose a heart for two", "Walk past". |
| 9 | **Escalating price** | The same offer costs more each time (Knowing Skull). | small (per-card counter, or deal as a 3-card stage) | *The Tab.* Appears once a floor; the round costs 2, then 4, then 6. |
| 10 | **Everyone rolls** | Four dice, each owned by a seat; read with `{first}`..`{fourth}`. | none | *Last Round.* "You and the next three each own a die, in order. Lowest drinks the gap to the highest." |
| 11 | **Call it** | Drawer calls High or Low (or Odd/Even) before the roll. | small (two plaques that pick the outcome table) | *Coin Flip Goblin.* "Call it." Right: give 4. Wrong: drink 4. |
| 12 | **Category / waterfall** | Classic round, themed to the floor. | none | League *Who's That Pokémon?* Secret holds a Pokémon; the drawer describes it without the name, timer 30 s. |
| 13 | **Performance, judged** | Do a bit; the table votes thumbs. | none | League *Pokémon Contest* (Coolness, Cuteness...): "Pose as your starter. Table votes: up = give 5, down = drink 3." |
| 14 | **Role (Kings Cup)** | A lasting gotcha role as a jinx with a 1-drink slip. | none (`jinx`) | *Snake Eyes.* "The jinxed player is the Basilisk: anyone who meets their eyes drinks 1." *Question Master* as a ghost. |
| 15 | **Table vote / pointing** | On three, everyone points. Most-pointed acts. | none | *Who Dies First.* "On three, point at who dies first on this floor. Most votes: drink 3 and take the next trap." |
| 16 | **Pour shapes** | Not a number: waterfall, swap drinks, drink per X, split, mate. | none | "Drink one per ex in this room." "Swap drinks with the goblin's chosen (your right neighbor)." "Waterfall, you stop last." |
| 17 | **Memory / callback** | Ask about the run itself. | small (`{lastBoss}`, `{omen}` placeholders) or none (spoken) | *The Bard.* "Recite the last three rooms in order. Miss one: drink 3." |
| 18 | **Story / improv** | Ten-second narration, the table judges. | none | *Death Recap.* "Narrate how the party dies here in 10 seconds. Laughs: give 4." |
| 19 | **Speed / reflex** | First to do X, last loses (Heaven, Thumb Master). | none | *Trap Door.* "Last to lift their feet off the floor: drink 3." |
| 20 | **Hidden traitor** | One player secretly gets a role for a floor, revealed at the boss. | new (deal a random secret to one of N holders) | *The Mimic Among Us.* Pass the phone; one hold reveals "You're the Mimic". At the boss, the table accuses. |

### Rewriting the d20 template itself

Some rooms should stay d20 fights; the roll is part of the dungeon fantasy. Make each of those earn it:

- **Natural bands get their own joke, not a doubled number.** "Natural 20: the goblin likes you. He follows you; anyone who insults him drinks 1 (jinx until the boss)." "Natural 1: you trip into the goblin. Swap drinks with your right neighbor." The `naturals.ts` doubling can stay as the default and be overridden per card.
- **Every d20 setup asks something.** Stand up, shut your eyes, hold your breath, point first, pick a target. 120 of 267 already do; the other 147 are the rewrite list.
- **Aim every pour.** "Give 3" becomes "Give 3 to whoever smells most like it" (several already do this well).
- **Vary the die shape across a floor:** d20, 2d6 doubles, d6 six-way tables (*The Undercard* is a good model), four-seat dice.

## 5. Making runs different from each other (macro variety)

| Idea | What it adds | Engine |
| --- | --- | --- |
| **Rarity tiers** | Most cards common; a few "legendary moments" (one per run at most) with a distinct ribbon. Gives each run a story. | small (`rarity`, dealt by weight) |
| **Shiny Pokémon** | Any wild fight has about a 1-in-30 chance to be shiny: pearl ribbon, a special catch line, and a big table pour. Players will remember it. | small (a dealt variant flag on the card instance, saved in the snapshot) |
| **Story arcs** | A recurring NPC appears 3 times across floors with escalating stakes (Thad's toast, then Thad's Uber, then Thad's apology). The League's rival already does this. | small (a stage that picks one arc and places its cards in order) |
| **Floor/route theme decks** | Each floor deals mostly from its own verb mix, not just its own flavor. The Freezer is speed cards; the Library is trivia and bluffs; the Casino is calls and push-your-luck. | none (content tagging) |
| **Tonight's house rule** | The omen already does this; extend with Kings Cup-style roles as omens. | none |
| **Hall of Fame** | Local record of past wins: starter, champion beaten, who was jinxed most. A won run says "third Hall of Fame entry". | new (separate localStorage key, not the session) |
| **Run length choice** | Quick crawl (2 floors) and full crawl. Short runs make replays more likely. | small |

## 6. Themes

### New Pub Crawl floors (each with its own verb lean)

| Floor | Lean | Boss idea |
| --- | --- | --- |
| **Karaoke Bar** | performance, judged by the table | *The Key Change*: a song the drawer must start; the table judges |
| **Casino** | call it, push your luck, everyone rolls | *The Pit Boss*: double or nothing over two beats |
| **Wedding Reception** (the open bar) | speeches, roles, table votes | *The Best Man*: a toast that must name three people at the table |
| **Airport Bar** (CABIIN lore) | speed, delays, escalating price | *Gate Agent*: escalating "rebooking fee" |
| **Bowling Alley** | duels, 2v2 | *The League Night Team* |
| **Tiki Bar** | pour shapes (share bowls, swaps) | *The Volcano Bowl*: a 4-seat dice pour |
| **Haunted Irish Pub** | bluff, hidden fuse, roles | *The Banshee*: last to cover their ears drinks |

### New League beats (Pokémon has a deep well of non-battle content)

- **Safari Zone**: a route with no fights, only ball throws, limited balls (push your luck on a throw).
- **Game Corner**: slots and the prize counter (press).
- **Fishing**: Old/Good/Super Rod as a three-step push your luck that can hook a Gyarados.
- **Pokémon Contests**: judged performance cards in five categories.
- **Who's That Pokémon?**: secret + timer guessing.
- **Lavender Tower**: lights-off ghost cards (eyes shut, bluffing).
- **Day Care**: drop a teammate off, get it back stronger later (an escalating offer).
- **Battle Frontier** as a post-game or alternate finale: each facility a rule (Battle Factory: swap your teammate for a random one; Battle Pyramid: eyes shut).
- **Nuzlocke rule as an omen**: "Name each catch after a player. When it's used, that player drinks 2."

### New modes or packs (later; each is its own project)

- **Heist**: crew roles dealt by secret, one traitor, three jobs then a getaway. Uses #4, #5 and #20.
- **Game Show**: Price Is Right closest-without-going-over guesses, Family Feud surveys from the table, a final Jeopardy wager in sips.
- **Murder Mystery Dinner**: clue cards over a run, accusation finale.
- **Road Trip**: CABIIN-style travel mishaps, gas station merchants, a breakdown boss.

## 7. Recommended order

1. **Set and enforce the mix (content + one test).** Per floor/route pool: single-d20 at most about 35%; at least six distinct verbs from section 4; at most about 30% of outcomes flavor + pour only. A unit test like the existing `card-logic.test.ts` checks it so the mix doesn't drift. Effort: small. This is the lever that matters most.
2. **No-engine rewrites.** Turn about 100 of the 147 setup-less Pub Crawl d20 rooms into duels, bluffs (secret), fuses (timer), auctions, dilemmas, four-seat dice and votes; give the natural bands their own lines; add side bets to bosses' first beats. Same for League wild fights and trainers. Run `npm run test:balance` after, since Won/Lost fights have different odds than a d20.
3. **League push-your-luck.** Allow `press` in the League for Fishing, Game Corner and the Safari Zone.
4. **Small engine features, one at a time.** Call it (High/Low), shiny variants, rarity weights, story arcs.
5. **New floors and League beats** from section 6, written to the new mix.
6. **Bigger features:** hidden traitor dealing, Hall of Fame, new modes.

### Risks and open questions

- **Balance.** Table-settled Won/Lost fights depend on people, not dice. The balance bot can only assume a win rate for them; real odds come from a playtest. No playtest has ever been recorded (`docs/PLAYTEST.md`); this proposal raises the value of one.
- **Reading load.** Secrets, timers and offers make cards longer. The 2:3 face and one-handed reading stay the constraint; each format needs a fit check at 320 px.
- **Systems creep.** The 2026-10-31 streamline cut systems because they got in the way of card design. Everything in steps 1 and 2 is content using existing fields; steps 4 to 6 add mechanics and should each pass the same test: does it make cards better, or just add bookkeeping?
- **Voice.** Copy drafted here is placeholder tone. The best cards in this game come from the group's own lore (`CARD_VOICE_REFERENCE.md`), which an agent can't invent. Section 4 gives formats; the owner's references make them land.
- **Repo rules.** `CARD_VOICE_REFERENCE.md` lists "chained rolls" and outcomes that depend on earlier cards as out of scope; the crawls already relaxed this. Escalating prices and arcs extend it further and need an owner yes.

## Sources

- [WarioWare (Wikipedia)](https://en.wikipedia.org/wiki/WarioWare); [What are the components of a perfect WarioWare microgame? (SUPERJUMP)](https://www.superjumpmagazine.com/what-are-the-components-of-a-perfect-warioware-microgame/); [Iwata Asks: WarioWare Smooth Moves](https://iwataasks.nintendo.com/interviews/wii/warioware_smooth_moves/0/2)
- [Minigame (Super Mario Wiki)](https://www.mariowiki.com/Minigame); [Duel Minigame](https://www.mariowiki.com/Duel_Minigame)
- [Slay the Spire Events List (wiki.gg)](https://slaythespire.wiki.gg/wiki/Events_List); [Slay the Spire 2 events redesign (PCGamesN)](https://www.pcgamesn.com/slay-the-spire-2/events-redesign) (search summary only; the page could not be fetched from this session)
- [Getting to the heart of the cards of Balatro (SUPERJUMP)](https://www.superjumpmagazine.com/getting-to-the-heart-of-the-cards-of-balatro); [Balatro analysis (Game Wisdom)](https://game-wisdom.com/analysis/balatro); [LocalThunk: guidelines for joker design (Reddit mirror)](https://lr.sudovanilla.org/r/balatro/comments/1czo9g0/guidelines_for_joker_design)
- [What are push-your-luck games? (Tabletop Gaming)](https://tabletopgaming.co.uk/features/what-are-push-your-luck-games); [GameTech: Push Your Luck (Magpie Games)](https://magpiegames.com/blogs/news/gametech-push-your-luck); [Dungeon Roll (BGA help)](https://en.doc.boardgamearena.com/Gamehelpdungeonroll)
- [Three man (WikiMili)](https://wikimili.com/en/Three_man); [Ship, Captain, and Crew (Bicycle)](https://bicyclecards.com/rules/ship-captain-and-crew); [16 best dice drinking games (gamerules.com)](https://gamerules.com/dice-drinking-games/)
- [Kings (Wikipedia)](https://en.wikipedia.org/wiki/Kings_(card_game)); [King's Cup (gamerules.com)](https://gamerules.com/rules/kings-cup-drinking-game/)
- Picolo: Critical Play write-up (notion.site; search summary only, page not reachable from this session)
- [Critical Play: bluffing, judging and getting vulnerable (Mechanics of Magic)](https://mechanicsofmagic.com/?p=51928); [Fibbage card game review (Final Boss)](https://finalboss.io/fibbage-card-game-review-great-bluffs-weak-pacing-gallipolis-edge)
- [Nuzlocke variants (Nuzlocke University)](https://nuzlockeuniversity.ca/nuzlocke-variants/); [51 optional Nuzlocke rules](https://nuzlockeuniversity.ca/2025/03/09/51-optional-nuzlocke-rules-to-customize-your-challenge/)
- [Hades duo boons (Prima Games)](https://primagames.com/tips/hades-what-are-duo-boons-how-get-duo-boons)
- [Pokémon drinking game event (GEWIS)](https://gewis.win.tue.nl/en/activity/view/5221)
