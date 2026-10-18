# Reference material

Raw, user-supplied sources for card titles and text. This folder is input
material, not game content:

- Nothing here is imported by `src/` or bundled at runtime.
- Files are preserved as supplied. **Never rewrite a reference file to match
  what the game ships**; replace it with the newer supplied version instead.
- The shipping copy lives in `src/content/` with stable IDs that map back to
  these sources (for example `house.sheet-003` = house sheet row 3).
- Parsed JSON companions are generated from the raw files by the npm scripts
  below. To update one, replace the raw file in place and rerun its parse.

## Contents

| File | What it is | Parse |
| --- | --- | --- |
| `cabiin-2/cards.csv` | Spencer's CABIIN 2.0 board-game sheet as supplied: 97 cells, one card per cell (`Title\nBody`). Tone reference for card voice. | `npm run cabiin:reference` |
| `cabiin-2/cards.json` | Parsed companion: `{ index, title, body }`. | — |
| `Drink at Ron - Sheet1.csv` | The supplied house sheet. Five columns: Main Title, Main Description, spacer, VIP Title, VIP Description. Rows 1–2 are headers, row 75 is blank, row 106 (`Debate`) is title-only. | `npm run house:reference` |
| `drink-at-ron-sheet1.json` | Parsed companion: `{ row, title, description }` entries, 103 house rows (including title-only row 106) and 4 VIP rows; each row number is the sheet row. | — |
| `drink_at_ron_sample_cards_40_v3.json` | The earlier 40-card translation of the CABIIN voice into this game; the seed of the Core deck. | — |
| `pokemon_board_spaces.json` | The supplied Pokémon drinking-game board sheets: three 72-space boards (Kanto, Johto, Hoenn), each space a `{ title, body }`. Many spaces are untitled. Raw source behind the `pokemon` pack. | — |

## How the sources map to the game

- **House**: `src/content/custom.ts` restores the 102 house rows that have a
  description (blank row 75 and title-only row 106 are excluded) as
  `house.sheet-003`…`house.sheet-105`; the 8 rows that are CABIIN spaces
  (12, 16, 24, 28, 40, 42, 53, 54) ship in Cabin weekend as `cabin.*` cards. The 2026-09-26 logic pass made minimal
  clarity edits to six ambiguous rows; those edits exist only in the shipping
  source, never in this folder. At the owner's request (2026-10-07, "more
  crude-funny", all decks) thirteen flat rows gained a crude kicker while
  keeping their first sentence: the nine travel Never Have I Evers (rows 26,
  50, 67–73), Singles (64), Damn, you're old (61), Big Baby (76) and Work it
  (80). Every in-joke row (Ron, Steve, Becca, Freddies, Same, Split the G and
  so on) is unchanged. The 2026-10-18 length pass (owner: "the professional,
  no cut-corners moves") shortened row 60, Spirit airlines, to fit the new
  100-character rule limit with the same consequences.
- **VIP**: the four VIP rows become `vip.sheet-003`…`vip.sheet-006` in the same
  file; the rest of `VIP night` is original.
- **CABIIN**: tone reference only; see `docs/CARD_VOICE_REFERENCE.md` for what
  does and does not carry over.
- **Sample 40**: the earlier design artifact; its copy was revised heavily in
  the shipping Core deck, so treat it as provenance rather than current text.
- **Pokémon**: `src/content/pokemon.ts` translates the board sheets into the
  shared-deck format. Gyms became leader battles, movement and lost turns
  became pours, one-shot dice, or next-turn rules, and untitled spaces are
  named after the Pokémon in them. Source consequences are kept as written —
  shots, chugs, gendered splits, mixed drinks and rough dares are not
  softened. The 2026-10-07 crude pass reworded the flat dice spaces (Mareep,
  Zubat, Gym Battle, Poké Ball, Chansey, Supersonic, Game Corner, Rival Wally,
  Delibird, Elite Four) so the roll is a joke with its pour, and evened out
  Battle of the Sexes; the beasts, shots and chugs are as before. The
  2026-10-17 table-rule pass (owner: "nothing is gospel"; the test is in
  `docs/CARD_VOICE_REFERENCE.md`) turned eleven prop, chore or dead rules into
  one-time actions: Egg (no object to hold), Lickitung, Psyduck, Ditto,
  Murkrow, Mawile, Relicanth, Farfetch'd, Vulpix, and Team Magma and Aqua
  (there are no teams, so whoever wears red or blue joins). Hoothoot's "wear shades" became a hoot, and the League's Candice holds a wall sit instead of an ice cube, so nothing needs a prop. Board-only plumbing (squares, lights, turn order, extra turns) is
  intentionally not carried over. The League's cards (`src/content/league/`,
  `pokemon-league.ts`) are original rather than from the sheets; at the
  owner's request (2026-10-17, "less same-y") their roll results were
  rewritten so fewer read as a bare "Drink N / Give N", and every League
  d20 gained a natural 20 and natural 1. Of the 120 sheet cards only
  Missingno changed: its roll of 1 is now "Natural 1!", everyone drinks 6.
  The 2026-10-18 length pass tightened the wording of 21 sheet cards over 95
  characters (Hoothoot, Castform, Rival May, Team Magma and Aqua, Bug Catching
  Contest, Missingno, Skarmory, Ditto, Lapras, Geodude, Wartortle, Murkrow,
  Sudowoodo, Contest Hall, Seaking, Spheal, Claydol, Pelipper, Barboach,
  Relicanth) under the new 100-character rule limit; every consequence and
  amount is unchanged.

## 2026-10-18 review

A copy review fixed errors in supplied rows and nothing else; the raw sheet
is unchanged. Sheet style (missing full stops, sentence-case titles, "Else"
without a comma) is left as supplied.

House rows (`house.sheet-NNN`):

- 009 Steve's Beans: "tell them his beans" → "tell him his beans", and a
  comma after "Else".
- 018 Story Time: "Loser drink 4." → "Loser drinks 4."
- 023 Headache Simulator: "for a round" → "until your next turn" (the game
  has no rounds).
- 029 FMK: "Blink 182" → "Blink-182".
- 045 Drink, bitch: "If you drank last card" → "If you drank on the last
  card".
- 046 Fiend: brand names capitalized ("Zyn, Velo").
- 049 Mexico v China: "chinese" → "Chinese".
- 056: title "Mt. Krumpit" → "Mt. Crumpit" (the Grinch's mountain).
- 057 I'm an Idiot: the sentence stopped at "drinks" with no amount; it now
  ends "drinks 2".
- 059: title "Bu-bu-buff.." → "Bu-bu-buff…".
- 060: title "Spirit airlines" → "Spirit Airlines", and "Team" → "Table"
  (there are no teams). Cabin weekend's card of the same title was renamed.
- 062 What was that?: "Read the last text message you said out loud" (garbled)
  → "Read your last text message out loud".
- 081: title "ABC's" → "ABCs".
- 096 Knickers: "the person to your rights" → "the person to your right's".
- 103 Categories: "US Capitols" → "US Capitals".

The roll text under two rows is the app's, not the sheet's, and now matches
the row: 034 Technophoria rolls for "Anyone who's touched a phone" (it said
"Everyone"), and 048 Rock, Paper, Scissors rolls for the loser (it said
"Drink").

VIP rows (`vip.sheet-NNN`):

- 005 One Year Older: "your new age" → "the VIP's new age" (the drawer
  gives out the VIP's digit, not their own).

The 8 CABIIN rows in Cabin weekend are unchanged. `cabin.ursaring` (sheet
row 16) shares its title with the Pokémon pack's Ursaring; it stays as
supplied.

## Adding a new reference file

Drop the raw file in this folder with a descriptive name, add a row to the
table above, and (if it has a structured parse) add a small `scripts/*-reference.ts`
script plus an npm alias. Keep parsers read-only against the raw file and write
their JSON next to it. See `docs/AUTHORING.md` for House-content rules.
