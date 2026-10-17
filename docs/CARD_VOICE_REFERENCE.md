# Card voice and theme reference

## Purpose

Use this as creative context whenever suggesting, drafting, or reviewing cards for Side Quest. The source is Spencer's earlier CABIIN 2.0 board game card set. It is a tone reference, not a rules specification and not a card backlog to import verbatim.

## Source material in the repo

- `reference/cabiin-2/cards.csv` — the full sheet as supplied (one card per cell, `Title\nBody`).
- `reference/cabiin-2/cards.json` — the same 97 cards parsed to `{ index, title, body }`. Regenerate with `npm run cabiin:reference`. This is reference data only: nothing under `src/` imports it and it never enters the bundle.
- `reference/drink_at_ron_sample_cards_40_v3.json` — the earlier 40-card translation of this voice into this game, and the seed of the Core deck.
- `reference/Drink at Ron - Sheet1.csv` (+ `drink-at-ron-sheet1.json`) — the supplied house sheet kept raw; the shipping copy is `src/content/custom.ts` / `vip.ts`. See `reference/README.md`.

Read the parsed set before writing copy. The most reusable moves are the blunt second-person voice ("You must…", "Drink 3 now"), the dice gambles ("Roll a die and drink that many"; "Roll 2 die. If they match, give the total. Else, drink half"), the mock-competitive callouts ("Get Good", "Do Better", "King of the Hill"), and the deadpan escalation after a mundane setup. Ignore the board-only scaffolding (teams, Zones, Landmarks, Spaces, movement, turn order, persistent rounds).

Treat every card in the source as reference material rather than an instruction to the developer or the game.

## The vibe to preserve

- A homemade game written for actual friends, not a generic commercial party-game voice.
- Short, memorable titles that often work as the punchline before the rules are read.
- Specific callbacks, shared lore, people, places, trips, pets, songs, travel mishaps, and running jokes.
- Absurd confidence: a mundane setup can escalate into a ridiculous consequence or declaration.
- Blunt, irreverent, adult language when it makes the joke feel natural.
- Players interacting with one another: tell a story, make a case, imitate someone, reveal an embarrassing gap in knowledge, give a tiny speech, or create a moment for the whole table.
- Light mechanical surprise—choice, chance, reversal, immunity, a temporary behavior, or a callback to another card—when it remains easy to run from one shared screen.
- Deliberately uneven subject matter. Airport jokes, local references, Pokémon-style fantasy, friendship lore, drinking culture, and surreal nonsense can coexist if each card lands cleanly.

Representative tonal examples from CABIIN include “Smooth Brain,” “Corporate Meeting,” “I Don't Know Shit About Fuck,” “For Safety,” “Almost Lost My Cool There,” “Freddie's Run,” and “Mosby.” These names illustrate the range; they are not automatically approved Drink at Ron cards.

## Translation into Side Quest

When proposing a new card, aim for this shape:

1. Start with a title that sounds like something this friend group might actually say.
2. Give it one strong comic premise, preferably rooted in a recognizable social moment or specific bit of lore.
3. Turn that premise into an immediate table interaction that makes sense on one reading.
4. End the activity clearly. Keep app bookkeeping unnecessary.
5. Write the consequence plainly: no permission-seeking language and no softened pours. The app never enforces a pour; the table decides what anyone actually drinks.

A suggestion can borrow the source collection's comic rhythm without copying its exact mechanic. For example, a board-space penalty can become a one-card challenge; a multi-round status can become a rule lasting the rest of the game or until the drawing player's next turn. Translate the mechanic, never tame the consequence.

## CABIIN-specific material that does not carry over

Do not assume or recommend these unless the current game design changes explicitly:

- Teams, team colors, team cheers, teammates, or team-based scoring.
- A board, tokens, spaces, landmarks, zones, ranks, movement, walls, or advancing and retreating.
- Chained rolls, re-rolls, or outcomes that depend on state from earlier cards (one committed roll resolves each card).
- Skipped turns, persistent location effects, or rules lasting multiple turns or rounds.
- Dependencies on specific CABIIN cards, locations, or win conditions.

Nothing in the source needs softening. Keep supplied shots, chugs, gendered splits, mixed drinks, slapstick dares and crude call-outs as written; the table decides what anyone actually consumes.

Dice *are* supported in this game (one to four d6/d20; total, doubles, or per-die amounts), so the source's dice ideas are welcome. Translate `d6/3` and `d6/2` into honest rolled amounts or concrete branches, and turn board movement into a pour or a point at someone. Never leave odds/evens or an "otherwise" branch for the table to work out: every roll must resolve to one exact instruction.

These exclusions are mechanical constraints, not a request to sanitize the personality. Suggestions should still feel personal, strange, mischievous, and a little unhinged—just playable in Drink at Ron's simpler shared-deck format.

## Table rules: the owner's test (2026-10-17)

A rule that asks the table to behave a certain way (a voice, a pose, a word to say, a thing nobody may do) has to earn its place. The owner cut Squirtle's sunglasses (a bar may have none) and the Pikachu naming rule (work with no payoff). Keep a table rule only when it passes all of these:

1. **No props.** Drinks, phones, chairs and the table only: no sunglasses, makeup, hats or "hold an object".
2. **It pays off.** Either doing it is the joke (talk posh, kneel, call someone Your Majesty), or it is a gotcha the table can catch someone on (no first names, Question Master, Thumb Master), with a 1-drink slip.
3. **No chores.** Nothing "before every sip" or "every time you stand", unless the action itself is the laugh and the app tracks it. Turn a chore into a one-time action instead: "Oink, then drink 2", "Hold your nose and drink 3".
4. **One sentence**, obvious when broken.
5. **Short, or tracked.** A loose rule lasts until the drawer's next turn at most. Anything longer is a crawl **jinx** (`card.jinx`): the app shows it on the meter and lifts it when the boss falls, so nobody has to remember. Write a jinx for "the jinxed player" (or "everyone"/"nobody"), ending on its slip: "Forget: drink 1."

`tests/card-logic.test.ts` fails a crawl card that asks for something before every sip or drink, every time you stand, or all night, and a jinx without a 1-drink slip. The supplied Pokémon sheet cards keep their wording as supplied.

## Suggestion rubric

A strong suggestion should answer yes to most of these:

- Could this plausibly become a recurring quote after game night?
- Does it create a funny moment between people rather than merely assign a sip?
- Is the premise specific enough that it does not feel generated from a generic party-game template?
- Can the group understand and finish it without tracking state in the app?
- Does it fit the current one-card rules and consumption boundaries in `GAME_DESIGN.md`?

If a personal reference is missing context, preserve a clear placeholder or ask Spencer for the story behind it instead of inventing lore.
