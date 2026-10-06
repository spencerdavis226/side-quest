# Adding a card pack

1. Add card definitions and a pack definition in a module under `src/content`.
2. Import and append them to the exported `cards` and `packs` arrays in `catalog.ts`, add a loader for the pack in `loaders.ts`, and run `npm run content:manifest`.
3. Put referenced artwork under `public/art`. A card's `artwork` must be a key in the registry in `src/presentation/artwork.ts`; the shared placeholder is `art/tankard.webp`. To ship a finished illustration, add the file and a registry entry (public path plus `scene: 'painted'`) instead of branching on a card ID in `CardFace`.
4. Run `npm test` and `npm run build`. The build checks fields, IDs, membership, and resolves every card's artwork through that same registry, failing on an unregistered reference or a missing file.
5. Inspect each card at small iPhone size and enlarged text. The group should understand a rule on one reading.

Example (not enabled in the catalog):

```ts
import type { CardDefinition, PackDefinition } from '../game/types';
export const exampleCards: CardDefinition[] = [{
  version: 1,
  id: 'fireside.story',
  title: 'Fireside story',
  rules: 'Going clockwise, each person adds one sentence to a story. End after one round.',
  category: 'challenge',
  artwork: 'art/tankard.webp',
}];
export const examplePack: PackDefinition = {
  version: 1,
  id: 'fireside',
  logo: 'art/packs/fireside.svg', // One single-colour silhouette; the app tints it.
  title: 'By the fireside',
  description: 'Stories and gentle mischief for a cozy table.',
  cardIds: exampleCards.map(card => card.id),
};
```

Use stable namespaced IDs; never recycle one for an unrelated card. Supported categories: `sip`, `group`, `category`, `challenge`, and `rule`. Rules are plain text, not HTML. Keep one clear instruction. Aim for 90 characters and 18 words or less; the build flags longer copy for review and rejects rules over 120 characters or 24 words. State who acts — the drawing player, everyone, or a named subset — and how long a lasting rule lasts: the rest of the game or until the drawing player's next turn, never until the next card. Specify who starts and when the activity ends. Long text stays inside the fixed 2:3 card and scrolls within the rules panel at enlarged settings; the card never grows for content. Cards carry no illustration text: every card renders in the shared painted frame with its deterministic imprint, so authoring never blocks on art. Do not bake rule text into artwork.

The rule text scales from 26px on a phone card to 34px on a wide card at the default browser text size. Enlarged mode uses 34–42px. Review the actual rendered card at 320px and 390px viewport widths; character counts cannot predict where words wrap. Keep a short lead sentence so a group across the table can grasp the action before anyone scrolls.

Card titles have a hard authoring limit of 22 characters and 15 characters per word (the supplied sheet's `Weinerschnitzel` sets the current floor). The title starts at a size proportional to card width and shrinks only if its rendered text would exceed the two-line teal band, down to 18px. The workshop/browser fit check is still required because equal-length words can render at different widths. Existing saved titles are never shortened or renamed; unusually long legacy titles remain scrollable.

Overlapping packs share a card by ID; it enters the shuffle pool only once. New packs are off until selected. Pack choices affect the next game; an active session retains its snapshot. Keep previously published artwork available when possible. Ship expansions with a new build, not a remote download service.

Before the production content session: review variety, repetition, category stopping conditions, and ongoing-rule duration. Agree on final copy and stable IDs before commissioning or generating artwork.

The supplied Sheet1 CSV (`Drink at Ron - Sheet1.csv`) has Main title/description columns and separate VIP title/description columns. `src/content/custom.ts` restores every nonblank Main row verbatim (blank row 75 and the description-less row 106 are excluded) into its own opt-in `house` pack (94 cards) or, for the 8 CABIIN rows, into Cabin weekend, and the four VIP rows into `vip`. IDs contain the 1-based sheet row number for audit, including duplicate headings. Rows that name dice (`4d6`, `1d20`, `2d6`, `1d6`) keep the app roll so the pour is computed; conditional rolls that the engine cannot resolve from one roll (the Game Giveth/Taketh multiplier) stay as written without a dice definition. Do not soften, rewrite, or add permission language to House copy: it is the supplied sheet and the sheet is the authority. The 2026-09-26 logic pass made minimal clarity edits only where the sheet was ambiguous about who acts or how long a lasting rule lasts (`house.sheet-005`, `house.sheet-034`, `house.sheet-082`, `house.sheet-099`, and rows 40 and 53, now `cabin.first-name-only` and `cabin.abra-like-a-slut`); do not extend that beyond clear ambiguity or duration. The eight rows that are CABIIN board spaces (sheet rows 12, 16, 24, 28, 40, 42, 53 and 54) play in Cabin weekend instead, verbatim, as `cabin.maddy-booty`, `cabin.ursaring`, `cabin.wench`, `cabin.no-take-give`, `cabin.first-name-only`, `cabin.pet-that-dog`, `cabin.abra-like-a-slut` and `cabin.whinnie-the-pooh` (owner decision, 2026-10-05). No card belongs to two packs (a unit test enforces it). Preview every card in the workshop at small-phone width and enlarged text. An active game's saved snapshot is never rewritten by catalog changes.

Packs can optionally specify `artwork: 'art/your-pack.webp'`. The file must exist and follow the same local path rules as card artwork. Omit it to use the painted tankard. Shared pack controls and card frames are automatic; packs do not carry UI components, animation logic, or fonts.

## Card data and bulk review

A card is a title, a rules body, a category, and — for dice cards — a structured `dice` definition: `count`, `sides` (6 or 20), and either one `instruction` template or `outcomes` that cover every total exactly once. Outcome ranges accept an optional `step` (odds/evens), a top-level `doubles` instruction handles matching dice, and templates may use `{total}` plus `{first}`…`{fourth}` for per-die amounts. Every result must resolve to one exact instruction; a card that needs odds/evens or "otherwise" resolved at the table is a bug. Artwork defaults to the shared painted frame, and there is no illustration text to author. `roll()` and `rollTable()` in `author.ts` cover the common dice cases and `validateDice` enforces them at build time. When the roll is only one of two options ("do the dare, else drink 2d6"), wrap the definition in `choice(dice, skipLabel, rollLabel)`: the card then shows two plaques, the skip label puts the card aside unrolled and the roll label rolls. Labels are at most 14 characters; the rules copy stays as written.

For a human review pass, run `npm run cards:review`. It regenerates `docs/CARD_REVIEW.md` (readable table with a blank Review column) and `docs/card-review.csv` from the live catalog, so the sheet can never drift from what ships. Edit the source and regenerate; do not hand-edit either file. `src/content/sample.ts` holds the supplied sample set and assembles the `core` pack, `classics.ts` holds the classic / King's Cup basics, `standard-expansion.ts` holds the trimmed dice expansion, `custom.ts` holds the verbatim House deck plus the four VIP additions, `pokemon.ts` holds the Pokémon translation of the supplied board sheets, whose raw JSON stays in `reference/`, `cabin.ts` holds the CABIIN 2.0 translation (`reference/cabiin-2/`) plus the IDs of the House rows it shares, and `likely.ts` holds the Most Likely To vote prompts (one shared title and rule template; append prompts, never renumber). In production `catalog.ts` is a lazy chunk read through `registry.ts`, so a new pack costs lazy budget, not initial budget. New cards need an assignment in `src/content/imprint.ts` (the build and `tests/imprint.test.ts` require one); the content uses stable category motifs from the existing sprite.

## Optional illustration and pack identity

Per-card illustration briefs are retired. Every card renders in the shared painted frame with its deterministic imprint, and no artwork text is authored. If a specific scene is ever worth shipping, follow `ILLUSTRATION_GUIDELINES.md`, register it in `src/presentation/artwork.ts`, and pass its path as the optional `artwork` argument; the old dwarf direction stays rejected.

Each registered pack needs a distinct `logo`, such as `logo: 'art/packs/core.svg'`. Keep logo paths stable and add the file under public/art/packs; the build rejects missing files and reused logo paths. The same mark appears in setup, the pause legend, and card footers. The Core diamond is reserved for Core. Optional typing keeps older pack fixtures compatible, but release validation requires explicit logos for all registered packs.

A shared card shows marks for selected packs containing it, in catalog order. Marks follow the installed catalog as cosmetic metadata; they do not alter or rewrite a saved session. Stable namespaced IDs preserve the known origin's mark for retired cards in older saves. Unknown removed packs do not acquire an invented Core mark. Keep old pack metadata and logo assets available across releases when possible. Gameplay, snapshots, and shuffled order are unchanged.

## Pack quests (game modes)

A pack can bring a game mode: declare `quest: { mode, summary, label, goal, length, cardIds, finale }`. `cardIds` are quest-only cards, dealt only in that mode and never in the pack's plain deck (Pokémon's 24 gym leaders). A card's optional `ribbon` (at most 32 characters, e.g. "Gym Leader · Boulder Badge") renders as a gold banner over the rules with a gilded title; it costs a line of rule space, so keep ribbon cards' rules short. The setup screen shows `mode` and `summary` as a choice beside Short/Long/Infinite; choosing it holds the pack on (other packs can join) and plays without a card limit. Tag the cards that advance the meter with `quest: "<packId>"`; a tagged card adds one when it is put aside, reaching `goal` starts the finale. `finale` is a list of stages `{ label, pick, cardIds }`: when the game starts, each stage draws `pick` of its `cardIds` at random, and after the goal those cards are dealt one at a time, in stage order, between deck cards; the meter shows the stage label (and its count when `pick` is more than 1). Putting the last aside ends the game. `length` is the run's target: `goal` tagged cards are spread through its first draws (`paceQuest`), so the finale always lands by then. Author finale cards in the same module, in no deck list (validation enforces it), and include them in what the pack's loader returns. Validation requires at least `goal` tagged cards and `length > goal`. In the plain modes the pack's cards play as ordinary cards with no meter.

## Secrets and timers

A card may carry a `secret` (at most 120 characters) or a `timer`, or both, but never with `dice`. Validation lives in `src/content/validate.ts` and `src/game/timer.ts`.

- **Secret.** The face shows the public `rules`; a "Hold to read" plaque swaps the rules for the secret while a finger holds it and hides it on release (keyboard and VoiceOver activation toggle it instead). The rules must say who reads it ("Left neighbor reads alone", "Read alone"). A secret of 24 characters or fewer prints large, for words the table reads across the room (Forehead).
- **Timer.** `{ version: 1, kind: "fuse", min, max, end }` burns for a hidden whole number of seconds in `min`..`max` (5 to 90); `{ version: 1, kind: "countdown", seconds, end }` counts down in view (3 to 120). A plaque starts it ("Light the fuse" / "Start the clock", so fuse rules open with "Light the fuse" and clock rules say "Start the clock"); the card can't be put aside until time is up, when a full-screen BOOM or TIME flashes and `end` (at most 120 characters) replaces the rules. Write `end` as the full consequence. Timers are display state only: nothing is saved, and a reload leaves the card unlit.
- Plaques cover the foot of the card, so keep these rules near 90 characters; at 375×667 and larger every Secrets & fuses card fits without a scroll (2026-10-06 sweep).
