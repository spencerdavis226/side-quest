# Pokémon League art prompts

The League art set was generated with the built-in image_gen tool and integrated locally on 2026-10-05/06. The exact executed prompts and selected source filenames are in `assets/source/league-2026-10-05/selected.json`. Originals stay outside the bundle. `npm run art:league` rebuilds the display-sized WebP assets and traces the generated League silhouette into SVG. This file preserves the design brief; `docs/STATUS.md` records current verification and next work.

## Shared style (paste at the top of every prompt)

> Painted game asset for a tavern-themed drinking card game. Hand-painted, slightly worn, warm candlelight from the upper left. Materials: aged brass, hammered gold, deep teal leather, cream parchment, dark walnut. Rich but not neon. Crisp silhouette that reads at small sizes. No text, no letters, no numbers, no logos, no watermark. Original design: do not copy any existing game, brand or official badge artwork.

Technical rules for every asset:

- PNG with a transparent background unless the prompt says otherwise.
- Request square badge sources around 1024×1024. The tool's actual source dimensions vary; the rebuild script contains them in 128×128 transparent WebP canvases (budget: each final file under 500 KiB).
- Subject centred with about 8% empty margin, so masks and drop shadows do not clip.
- One consistent light direction (upper left) across the whole set.

## 1. Gym badges (24), the badge case and the meter

Purpose: the badge meter shows the badge just earned, the gym leader ribbon gets a small badge icon, and the Hall of Fame screen lays out the badges you won. Each badge is a small enamelled brass pin, about the shape and finish of a military medal pin, seen straight on.

Sources: `assets/source/league-2026-10-05/badges/<id>-v1.png` (Thunder uses `thunder-v2.png` after repairing its clipped upper point). Runtime: `public/art/badges/<id>.webp` (ids below). All 24 are connected by stable gym card IDs in `src/presentation/league-art.ts`; saved snapshots need no migration.

Prompt template:

> [Shared style] A single small enamelled brass pin badge, seen straight on, flat lighting with a soft highlight, thin dark outline. Shape and motif: **{motif}**. Enamel colours: **{colours}**. Centred on a transparent background.

| id | Badge | Motif | Colours |
| --- | --- | --- | --- |
| boulder | Boulder | a faceted octagon like a cut grey stone | slate grey, brass rim |
| cascade | Cascade | a single falling water droplet | sky blue, white highlight |
| thunder | Thunder | a sunburst with a jagged lightning bolt | gold, amber |
| rainbow | Rainbow | a flower of four petals in spectrum colours | green, red, yellow, violet |
| soul | Soul | a heart shape cut from a rounded square | magenta, pink |
| marsh | Marsh | two concentric golden rings | gold, pale yellow |
| volcano | Volcano | a flame rising from a cone | red, orange |
| earth | Earth | a leaf-shaped crest with veins | jade green |
| zephyr | Zephyr | a pair of swept wings | silver grey, white |
| hive | Hive | a ladybird-like domed shell with spots | red, black |
| plain | Plain | a rounded rectangle with a cow-bell notch | pale pink, cream |
| fog | Fog | a ghostly swirl inside a circle | lilac, grey |
| storm | Storm | a clenched fist inside a ring | brown, amber |
| mineral | Mineral | a polished steel hexagonal nut | steel grey, silver |
| glacier | Glacier | a six-point ice crystal | ice blue, white |
| rising | Rising | a dragon's eye in a diamond | navy, gold |
| stone | Stone | a geode cracked open | brown, amethyst |
| knuckle | Knuckle | a boxing glove seen from the side | red, cream |
| dynamo | Dynamo | a gear with a spark at its hub | yellow, bronze |
| heat | Heat | a flame inside a diamond | crimson, orange |
| balance | Balance | a scale with two even pans | silver, brass |
| feather | Feather | a single sweeping feather | white, sky blue |
| mind | Mind | two crescent moons facing each other | pink, gold |
| rain | Rain | a rain drop over a wave | deep blue, teal |

## 2. Badge case

Purpose: tapping the meter opens a badge case showing the run so far; the Hall of Fame screen reuses it.

Runtime: `public/art/badge-case.webp` (transparent, 600×400). Eight live badge images overlay the empty recesses; badge and leader names remain real accessible text below the case. The lid displays the saved count. The original source's transparency was confirmed by compositing its alpha over a solid background; the tool's inline preview displayed hidden RGB background colors.

> [Shared style] An open hinged badge case seen from slightly above. Deep teal leather exterior with brass corners and a brass clasp; the inside is dark velvet with **eight empty circular recessed slots** in two rows of four, evenly spaced and the same size. Nothing in the slots. Transparent background around the case.

## 3. League mode emblem

Purpose: replaces the Pokémon mark on the setup screen's League mode button and the meter, so the mode has its own identity.

Runtime: `public/art/packs/league.svg`. The generated black-on-transparent trophy source is traced from its alpha boundary by `scripts/league-art.ts`; the app tints the silhouette gold. It is a mode mark in setup and the meter, separate from the Pokémon pack mark. Before the gauntlet, the meter shows the latest earned badge when its saved identity is known.

> Flat black silhouette on a transparent background, no shading, no gradients, bold simple shapes that read at 24 pixels: a trophy cup with two handles standing on a short plinth, a small four-point star above the cup. Centred, 8% margin.

## 4. Gauntlet title banners (3)

Purpose: a full-width banner that sweeps across the table when each gauntlet stage begins (the eighth badge, the first Elite Four member, the Champion). The app draws the words over the banner, so leave the middle empty.

Runtime: `public/art/banners/{legendary,elite-four,champion}.webp` (transparent, 768×240). All three keep the existing timing, reduced-motion fade and pass-through taps. The words remain live text.

Prompt template:

> [Shared style] A wide horizontal painted cloth banner with swallow-tail ends, hanging slightly curved, brass end caps. **Leave a large plain area across the middle for text.** Colour and ornament: **{ornament}**. Transparent background.

| file | Ornament |
| --- | --- |
| legendary | iridescent pearl-white cloth with faint feather and lightning motifs at both ends |
| elite-four | deep violet cloth with four small brass studs at each end |
| champion | crimson cloth with heavy gold fringe and a small laurel at each end |

## 5. Hall of Fame scene

Purpose: the completion screen after beating the Champion.

Runtime: `public/art/hall-of-fame.webp` (opaque, 600×800 portrait). A darkened scene behind the completion content keeps the title and run record readable. Its top edge stays below the app header.

> [Shared style] Opaque painted scene, portrait. A grand stone hall at night lit by tall braziers, a raised dais with an empty gilded frame in the centre (the app overlays text there), banners hanging from the rafters, confetti-like falling embers. Leave the middle third calm and dark enough for cream text to read over it.

## 6. Legendary, Elite Four and Champion card back (optional)

Purpose: the finale cards could flip from a special back so the table knows something big is coming. This is a change to the approved card frame, so it needs the owner's sign-off before it ships.

Superseded: this trophy back was replaced by the Ancient Mew pair (§8), which every League card now uses. The draft files were removed on 2026-10-15.

> [Shared style] Opaque painted card back, portrait, exact 2:3. Matches a deep teal leather card back with an aged brass border and hop-vine filigree, but the centre medallion holds **a gold trophy cup with a four-point star above it** instead of a beer tankard, and the leather has a faint gold sheen. Symmetrical, no text.

## 7. Side Quest emblem

The rename handoff proposed an RPG quest marker above the existing tankard. Generated as a painted edit of `public/art/tankard.webp`, with the wood, foam, brass, teal medallion and warm light retained; a hammered-gold exclamation point floats above it. Runtime: `public/art/side-quest-emblem.webp` (transparent, 256×256), used beside the setup wordmark and on the ordinary completion screen. Existing tankard, Home Screen icons and approved card surfaces are preserved. The exact edit prompt is in the selection manifest.

## 8. Ancient League pair (owner revision, 2026-10-06)

The owner requested an Ancient Mew-like engraved relic treatment that stays much closer to the base card back, plus a matching front with rigid existing text areas. Selected sources: `assets/source/league-ancient-2026-10-06/back-v2.png` and `front-v4.png`; runtime `public/art/card-back-league.webp` and `src/presentation/art/league-front.webp`, both 768×1152. The back's medallion depicts Mew as an antique bronze relief with decorative pictographs; the front confines glyphs and muted rose/violet inlays to the outer rails/corners. The title stays dark teal and the rules area stays light cream.

Exact executed prompts and the front iteration history: `assets/source/league-ancient-2026-10-06/pair.json`. Rebuild the runtime files with `npx tsx scripts/ancient-league-art.ts`. The rejected front drafts and review captures were removed on 2026-10-15. Fixed title rectangle: x21–79%, y9.75–21.5%; fixed body rectangle: x12–88%, y32–87.5%. These are read from the current card CSS. Since 2026-10-15 every card in a Pokémon League game uses this pair (`.league-deck` in `src/style.css` and `src/presentation/card-front.css`); every other mode keeps the base pair.
