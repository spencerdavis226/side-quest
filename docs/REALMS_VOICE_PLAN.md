# Realms voice pass (plan; done 2026-11-15)

Owner, 2026-11-15: give The Quest (the `dungeon` pack, Realms) the crude CABIIN voice the rivals introduced, across most of its cards, and keep it distinct from the League.

Status: all phases shipped on 2026-11-15 (PRs #94 to #97; Phases 3 and 4 shared one). See `docs/STATUS.md`.

## Owner decisions

- Crude and funny is the goal, and not timid inside the borders below. Not every card: the comedy must never read as desperate.
- Borders: sex, bodily functions, swearing, drugs and drinking, and roasting the players are fair game. Off-limits: slurs, jokes aimed at real groups (race, religion, sexuality), and anything sexual involving non-consent.
- Evergreen: no inside jokes, no real names or places. A card works for any table.
- The League keeps its tone: playful and cheeky, no swearing or sex jokes.

## Tone

- **Realms:** adult and brash. The fantasy world is real, but everyone in it is a degenerate, a coward, horny, hungover or petty. Titles land like CABIIN's ("Smooth Brain", "I Don't Know Shit About Fuck").
- **Rationing:** about a third of cards go fully crude, a third get a brash or dry edge without a dirty joke, and the rest are touched lightly or left alone.
- **Menace kept:** bosses, dragons and the end of the run stay a threat that also insults you, never a joke card.
- **The rivals stay the loudest:** no regular card outdoes Sir Chad Thundercock and company, or they stop standing out.
- **The table-rule test still applies:** the joke is in what the table does, not only in the wording (`docs/CARD_VOICE_REFERENCE.md`).

## Constraints

- Copy only: card IDs, mechanics and numbers are unchanged, so balance is untouched. A new joke mechanic is a separate phase.
- Limits: titles at most 22 characters (15 per word), rules at most 100 characters or 20 words, plaque labels at most 18, jinx rules at most 110, `{dragon}`/`{lair}` lines held by `tests/realms-names.test.ts`.
- Saves keep their snapshot: a game in progress reads its old text, and new games read the new text. No migration.
- The 301 Realms cards that also play in Standard and Infinite carry the new voice there too.
- Text in scope: titles, rules, dice outcomes (crit and fumble lines), boss phases, dragon moves and swings, jinx names and rules, plaque labels, ally rituals, stage intros, rank names and `rankLines`, crawl-theme words, ballad lines and the end screen.

## Phases (one pull request each)

| Phase | Scope | About |
| --- | --- | --- |
| 0 | A Realms section in `docs/CARD_VOICE_REFERENCE.md`: the targets above and before/after samples. Shipped with Phase 1 (the owner asked to pursue the plan and merge without stopping). | 0 cards |
| 1 | Run framing: classes and rank names, omens, the King's Summons, roads, inns, signs, crawl-theme words, ballad lines | ~100 |
| 2 | King's Road, Old Forest, Marsh: rooms, landmarks, bosses, phases, jinxes | ~150 |
| 3 | Haunted Crypt, Goblin Mines, Wizard's Tower | ~150 |
| 4 | Sunken Coast, Fire Caverns, Frozen Pass | ~150 |
| 5 | Dragons (moves, swings, lore), the Lair's Door, side quests and keepers, rares, hidden results, echoes, moments; a consistency pass over all of it | ~110 |

Each phase: `npm test`, `npm run cards:review`, a build, Chromium `test:sweep` (longer titles risk the two-line band), and 390×844 screenshots of anything near a limit.
