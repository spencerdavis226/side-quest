# Side Quest — current visual design standards

Updated 2026-09-25 for free-landing dice and tap-to-finish. **The current-state sections here are normative; older studies and generation prompts below are archival when they conflict.** Implementation tasks and priorities live only in [STATUS.md](STATUS.md).

## Creative direction and quality bar

An original, mischievous fantasy tavern collectible-card game. Weathered walnut, sculpted worn bronze, deep teal leather, warm parchment and painted expressive characters. Hearthstone is a craftsmanship/rendering reference, not a source of characters, symbols, compositions or copied UI. Humor can be broad and goofy in the spirit of tabletop fantasy parody; retain one immediately readable gag or action.

The approved card back and ornate teal front remain anchors. The current card front uses live text over plain parchment. **Premium means coherent construction and effortless reading before it means more detail.** A visible seam, hidden instruction, stretched frame, unclear control or detached shadow fails the quality bar even when the source art is excellent. Automated functional tests alone cannot approve a visual release.

The 2026-09-20 visual audit captures were removed on 2026-10-15; its findings are in `STATUS_ARCHIVE.md`.

## Matched rounded card pair

The current production pair is `assets/source/card-back-symmetric.png` and `assets/source/card-front-symmetric.png`, exported to `public/art/card-back.webp` and `src/presentation/art/ornate-teal-frame.webp`. Treat them as two sides of one physical card. Preserve the rounded, sculpted playing-card silhouette, curved brass corner armor, irregular walnut rails, aligned perimeter rivets, worn teal leather, and matched top/bottom visual weight. Never add an exterior background strip or a second wooden plank below the lower rail. Avoid square picture-frame corners and generic straight molding.

The front retains a blank teal title recess above one uninterrupted parchment rules field. Live DOM title/rules, dice result chips, and the small pack seal provide all card-specific content. Current safe regions are title x17–83% / y11–24.5% and rules x12–88% / y32–87.5%; changes to the painted openings require rerunning the complete title and every-card geometry sweeps before these coordinates move.

## Card title system

The approved ornate teal front remains fixed. Live titles use the locally bundled Source Serif 4 Bold (`public/fonts/source-serif-4-bold.woff2`, [licence](licenses/source-serif-OFL.md)) at weight 700. The solid face is bright ivory `#fff0cf`, with no stroke, blur, bevel or text shadow; the frame supplies the material depth. Forced colors use system Canvas/CanvasText. The body and menus retain Grenze.

The title safe zone is x17–83% and y11–24.5% of the 2:3 card. Start at `clamp(22px, 8.8cqw, 36px)`, 1.12 line spacing, balanced wrapping, centered with one shared optical lift. The title size follows card width. If actual glyphs exceed the two-line box, the renderer reduces that title only to the largest fitting size, with an 18px floor. It never truncates text. Authored titles are limited to 22 characters and 12 per word; the browser fit audit at 260/330/480px remains the acceptance gate because character counts cannot predict glyph widths. Older saved titles retain their full text and can scroll if the floor cannot fit them.

## Launch setup, controls, and dice

Setup offers Standard (50 cards) and Infinite. A Card packs dialog toggles the four opt-in packs (Core, House, VIP, Pokémon); a game needs at least one. Selections persist for the next game, while an active game's card order and text remain its saved snapshot. The setup selector, dialogs, completion, pause, install, recovery, and update surfaces share the same quiet walnut, bronze, and teal control language, clear focus treatment, and reachable targets.

Mobile play is portrait-only by user decision. If a phone or tablet presents a landscape viewport, a painted rotate prompt blocks interaction while the game and any open menu stay mounted. It disappears on return to portrait. Desktop remains usable in landscape. This is an intentional accessibility tradeoff against WCAG 1.3.4; do not claim orientation accessibility compliance.

The single full-screen dice renderer uses deep teal enamel, warm ivory markings, worn bronze edges, restrained lighting, and contact shadows. After a verified physical roll, dice ease into clear space above the card so the resolved instruction remains readable. Reduced Motion places them immediately. The engine supplies results; visual treatment cannot change those outcomes.

For authored rules, target 90 characters and 18 words. Review copy above either target, and reject copy over 100 characters or 20 words until edited. Keep one clear action, and keep the card rules panel scrollable for enlarged text and saved edge cases.

The shipped rule face starts at 26px on phone cards and grows to 34px on wide cards; enlarged mode spans 34–42px. The font stays in `rem` bounds so browser text scaling can increase it. Use the actual 2:3 frame at 320px and 390px viewport widths to judge reading distance and scroll affordance.

## Card construction

- One physical card, one outer **2:3 ratio** in play, back, Previous Card and workshop. Title or rule length cannot determine outer height. Correct ratio must be measured on the untransformed box; allow for rotation when checking viewport clearance.
- Use shared stage/frame geometry, not separate approximations per screen. Reserve safe areas, HUD and any bottom control before sizing the stage. Target roughly 20–24 CSS px side clearance on small portrait phones, consistent with the approved current margins.
- Continuous perimeter: no hard horizontal rail joints, doubled bevels, abrupt wood-grain changes or visible rectangular masking cuts. Corners and sculpted ornaments retain their proportions; stretch only deliberately plain runs. Check at actual 1× display size and at 2× inspection.
- The current front is plain parchment under the approved ornate teal frame. Parchment sits inside/behind the inner lip; its square edges must not overlay carved hardware.
- One consistent lighting direction (warm upper-left), one dark contact edge and restrained outer shadow. Do not stack arbitrary inner glows and dark outlines to conceal poor assembly.
- Pack identity occupies a small dedicated footer position, outside the rules scroller, without covering rules. It appears in setup and pause using the same mark. No category label above the rule, decorative stats, or symbols implying mechanics.
- Do not restore the historical imprint lattice, tint, or illustration window. Keep the small pack identity outside the rules scroller.

### Front replacement — asset brief for image generation

One opaque master plus one optional tile. Do **not** ask for transparency: the interior window is punched deterministically with an SVG mask, the way `src/presentation/art/frame-window.svg` already does for the current front. Nothing per-card may be baked in — the icon lattice and the tint are applied at runtime, so any emblem, text or colour variation in the artwork defeats the system.

Attach `assets/source/card-back.png` (materials, ornament, lighting) and `assets/source/card-front.png` (plain-parchment direction) as references, generate several variants, pick one, then re-run the choice at full resolution.

**Front master (1024×1536, portrait 2:3):**

> Create a production game asset: one full-bleed portrait 2:3 fantasy tavern playing CARD FRONT. It is the matched front for the ATTACHED card back — same deck, same materials, same craftsmanship. Edge-to-edge, straight-on orthographic, perfectly flat, no perspective, no tilt, no surrounding scene, no tabletop, no drop shadow, no mockup, no rounded outer corners cut away (keep corners almost square with gently rounded tips).
>
> Composition, top to bottom: (1) a slim carved perimeter frame — weathered dark walnut wood with chunky antique bronze bevels and corner caps, subtle deep teal enamel inlays in the corner ornaments, the same construction, ornament language, border thickness (about 7% of the width), wear and finish as the attached back; (2) immediately below the top of the frame, ONE wide horizontal bronze title banner, sculpted bevelled bar with curling ornamental ends and a single small deep-teal enamel accent, attached to the frame as hardware rather than pasted over it, and COMPLETELY EMPTY — no text, letters, numbers or runes; (3) below the banner, one large completely plain, empty parchment field filling the remaining inner area inside the frame's inner lip. No ornament, no lines, no marks, no focal stains, no creases. Clean warm aged paper with only very subtle fiber grain and gentle edge darkening, so it reads as a sheet seated inside and behind the frame — do not paint a square sheet overlapping or covering the carved hardware. The parchment must be uniform and neutral enough that a low-opacity colour tint can be overlaid on it later.
>
> Lighting: single warm light from the upper left, deep crevices, tiny chips and scuffs on the bevels, worn old-gold highlights, lovingly handled rather than filthy.
>
> Palette strictly: walnut #17100c, leather teal #16312e, bronze #bd9457, parchment #f4dfb4, warm shadow. No other hues.
>
> Absolutely NO text, NO letters, NO numbers, NO logo, NO runes, NO symbols, NO monogram, NO emblem, NO icon, NO illustration, NO character, NO watermark, NO repeating pattern, NO stamp, NO seal, NO dice, NO borders inside borders. NO photorealism, NO sharp clean vector lines, NO gradient UI chrome.
>
> Output: 1024×1536, portrait 2:3.

**Seamless parchment tile (1024×1024, optional — only if the tint reads muddy over the baked parchment):**

> Create a seamless 4-way tileable texture of blank aged parchment for a fantasy game card interior, matching the parchment material in the ATTACHED card back and front. Square 1024×1024. Completely even, flat, uniform lighting across the entire image — no directional light, no vignette, no shadows, no dark corners, no border, no frame, no fold. The tile must repeat invisibly in all directions, including along all four edges. Warm cream to light tan paper (#f4dfb4 base with faint #e8cd9b mottling), realistic but subtle paper fiber grain, slight blotchy aging, a few tiny dark specks and faint water marks — all very low contrast. Slightly desaturated so it can be colour-tinted in CSS. No text, letters, numbers, symbols, illustration, character, stamp, seal, emblem or pattern motif.
>
> Output: 1024×1024, seamless.

**Variant explorer (use first to choose a direction):**

> Produce a single 2×2 grid image containing four distinct design variants of the same fantasy tavern card FRONT, all matching the ATTACHED card back's materials and lighting. Every variant is a full 2:3 front with a carved walnut-and-bronze perimeter frame, an empty bronze title banner near the top, and a plain empty parchment field below. Vary the frame ornament density, the banner silhouette and the corner hardware style. Identical palette, identical straight-on orthographic lighting, thin grey gutters between quadrants. All the same NO-text / NO-symbol / NO-illustration restrictions as the final asset.


## Reading comes before illustration acreage

The player should read one actionable instruction without figuring out the layout. Hierarchy on reveal: illustration/title establish personality; the **rule is the task**. At settlement, the dice result and resolved action become primary.

- Space allocation is responsive within the fixed silhouette. The illustration must yield height on short phones/long titles before rule text gets clipped or shrunk. Current fixed art allocation is not a design contract.
- Default 390×844 acceptance target: every approved Core instruction is fully readable without inner scrolling at normal text size. At 320×568, optimize for the same and record specific exceptions for review. A mere `scrollHeight > clientHeight` is not proof of clipped rules: measure the paragraph, footer and padding separately.
- Scrolling is the accessibility/exception fallback, not the default presentation of a two-sentence card. At enlarged text, keep contained scroll functional and obvious through a quiet edge affordance. Never add permanent “scroll here” helper copy, crop the last line, clamp instructions, or use microcopy to make a test pass.
- Short prompts can be centered. Longer instructions should be tested left-aligned with a clean reading measure; do not force every paragraph into a centered zigzag. Keep consistent paragraph placement rather than floating each card's text arbitrarily.
- Long titles may occupy two lines. Reserve their space before allocating art/rules. Never ellipsize meaning-bearing titles, overlap ornament or squeeze letter spacing to force one line.
- Large empty HUD-to-card gaps are not inherently premium. Balance the entire viewport before making the rules panel smaller. Ordinary play must not require scrolling past a mostly empty header.
- Short-height landscape needs an intentional approved reading composition. Never shrink the full portrait card until text is tiny or leave the rule entirely below the initial screen. A compact card alongside an accessible reading area is a study candidate, not an already-approved new screen.

## Approved C3 frame — title finish pending (2026-09-22)

Direct user feedback supersedes the older icon-imprint instructions: **plain painted parchment, no lattice, icon wallpaper, or per-card tint**. Retain the small pack identifier. Personality comes from the existing painted materials and bronze craftsmanship.

C3 restores bronze hop-vine scrollwork around a moderately enlarged teal recess. The divider is about 28% down the complete card; the rest is predominantly parchment. Avoid the oversized, bare C2 treatment. Current study safe region: title x17–83%, y8.5–24.5%; rules container x12–88%, y32–89%. These regions are tied to `c3-ornate-quarter.png`, not universal coordinates for future generated images. Side ornaments must remain clear of title glyphs.

**Embossed title recommendation:** opaque warm ivory `#f5ddb0`, Grenze bold; shallow upper highlight and lower bronze/contact shadow, e.g. `text-shadow: 0 -.5px 0 #fff5cfaa, 0 1px 0 #745431, 0 2px 1px #0009`. This suggests raised foil lettering seated in leather while preserving a solid readable face. No transparency on the glyph fill, thick outlines, broad glows, texture cutouts through letters, or moving highlights. Keep body text flat dark ink with no emboss/shadow. All lettering stays live, selectable DOM text; honor user contrast preferences when integrating. Emboss is an optional presentation treatment, never a condition for legibility.

Typography bounds: normal title 24–36px, 1.04 line-height, two lines; enlarged study 36px. C3 fits all catalog titles at 330px with that enlarged setting, but **does not fit all enlarged titles at 260px**. Provide an explicit accessible full-text reading fallback before shipping; never hide this limitation with clipping or automated font shrinking. Rule scroll remains available. Source Serif remains an optional study, not a selected replacement.

C3 frame is approved and integrated. Its current embossed title finish is explicitly not final: the next typography comparison and acceptance plan is in STATUS. Screenshots and measured failures are recorded in the study. Older directions below are historical when they conflict with this section.

## Typography-first front study — proposed, awaiting selection (2026-09-22)

Review `docs/studies/front-typography-2026-09-22/index.html` through the Vite dev server. This is an isolated development study using the **actual CardFace, imprint, pack mark and locally loaded fonts**. Editable title/rules and all 52 catalog cards; two frames; 260/330/480px card widths; 150% text. No changes to production rendering in this study. PNGs are browser captures of real HTML text, not generated lettering.

**Recommendation:** refine C (recessed teal) around typography before adopting it. The sample's central crest rises into the title region. B (folded parchment) is the stronger unmodified option for title capacity. Do not approve a blank frame without its longest live titles.

- Reserve a genuinely clear title zone approximately **x16–84%, y7.5–22%** of the whole card. Recess side ornaments outside it; move the center crest below y23%. These are proposed art constraints, not a claim that current C meets them. Test the final image against measured glyph bounds.
- Titles: Grenze bold, normally 24–32px, balanced wrapping, at most two lines at a 260px-wide card. Default authoring target 2–4 words / roughly 12–24 characters; flag over 28 characters for visual review, not rejection. Wide letters and long unbroken words make character limits insufficient. No automatic tiny type, ellipsis, letter squeezing, or baked text.
- Rules: compare current Grenze against **Source Serif 4 Regular**, 22px / 1.4 line height, dark brown on pale parchment. Source Serif is the proposed reading face, not yet approved. It uses more horizontal room, so density must be evaluated honestly. Center short actions; test left alignment for longer paragraphs before finalizing that behavior.
- Copy: prefer one action, 8–18 words; review above 18 words or 90 characters. Fit checks are authoritative; the build rejects over 100 characters or 20 words. Never silently truncate saved or supplied rules. Highlight resolved dice values semantically without a separate result badge.
- Keep pattern ink faint, preserve quiet areas under letters, and evaluate contrast over actual textured pixels. Do not add outlines or heavy shadows to body text. Cream titles on teal need only a subtle contact shadow.
- At 150% text, both current samples fail for sufficiently long titles. Production needs an explicit accessible reading layout / full-text fallback; shrinking the font is not an acceptable solution. Preserve 2:3 for the normal card and keep all long rules reachable. Do not mark accessibility complete based on these samples.
- Acceptance before integration: all 52 current titles plus wide-letter/unbroken-word stress cases; short/long rules; resolved dice text; Chromium and WebKit; 260/330/480px card widths; enlarged text; then real iPhone/iPad. Existing saves and typography fallbacks remain readable. Offline font loading and release budgets are gates when the font moves into production.

Study evidence: `measurements.json` records overflow only. At 260px, C exceeds the proposed title box on 22/52 current cards in both browsers; B on 0/52. At 330px C has 7 title-box failures and at 480px 6 (small endpoint overflows count as failures); B has none. Source Serif rules require inner scrolling for 8 Chromium / 11 WebKit cards at 260px, none at 330/480px. These are **study-layout measurements**, not production acceptance. Captured enlarged-text stress visibly fails both title treatments. Different browser wrapping warrants follow-up; do not conceal it with relaxed assertions.

Source Serif 4 study font is vendored under the study directory only, from Adobe's official repository at commit `80d3f8894c09c937bebfa9011247d2e1c79fd6f4`, `WOFF2/TTF/SourceSerif4-Regular.ttf.woff2`, with `SOURCE-SERIF-LICENSE.md` (SIL OFL). Source: https://github.com/adobe-fonts/source-serif . No runtime CDN, font dependency, or production budget change introduced by this study.

## Production typography baseline (pending study selection)

The application currently uses locally bundled **Grenze** throughout, with its existing license. The user explicitly authorized font changes on 2026-09-22; the typography-first study above proposes the next direction. These older production ranges are historical defaults until that study is selected, not a prohibition on improving typography.

| Role | Starting range | Treatment |
| --- | --- | --- |
| Card title | 28–40 CSS px; a reviewed compact exception may use 26px | 700; approximately 1.05–1.15 line height; maximum two normal-size lines |
| Rules / resolved instructions | 20–24 CSS px normal size | 400–500; approximately 1.3–1.4 line height; warm dark ink |
| Primary controls | 24–28 CSS px | 600–700; clear baseline, 44px minimum target |
| Secondary controls / pack names | 20–24 CSS px | 500–600; readable unselected state |
| Progress | 20–24 CSS px | Quiet; subordinate to card, not another headline |
| Dice result | Larger numeral with restrained emphasis | High contrast, one accent; instruction remains equally readable |

Ranges are design starting points, not permission to override user text enlargement. Use rem-aware sizing where suitable; verify actual computed sizes. Do not make all text bold/black. Avoid heavy shadows on body text; save embossed/shadowed treatment for titles and controls. Body text on parchment should have comfortable contrast without noisy textures behind individual letters. Functional labels remain plain English; theme does not justify obscure wording.

Accessible names and live announcements must contain the actual action/result. Visually hidden content stays available to assistive technology and consumes no visible layout space. Never use `display:none` to “fix” a live announcement or expose accessibility helper prose as game copy.

## Art and surface density

Follow [ILLUSTRATION_GUIDELINES.md](ILLUSTRATION_GUIDELINES.md) for focal-safe composition, original character design and briefs.

- Center the important subject/action inside the safe crop region; show the whole meaningful silhouette. One dominant subject, a few broad color/value groups, quiet context. Inspect at the real small card window before approving detail.
- Keep the visual joke legible from across a table; tiny costume trivia is not the primary storytelling device.
- The tabletop and text panels must be quieter than the card. Edge grain, scuffs and bronze highlights can be rich; avoid competing high-contrast grain directly behind UI text.
- Existing repeated tankard scenes are explicitly provisional. Do not bake titles, rules or pack symbols into illustrations. Use the shared artwork registry rather than component conditionals.
- No full-set art commission until text, frame/crop geometry and measured offline budget are stable. Preserve source images; only optimized runtime assets enter the build.

## Controls and secondary screens

- One strongest action per screen. Keep play HUD compact: progress and menu, plus the contextual dice action when needed. No new permanent instructions.
- Selected, unselected, pressed, focused and disabled are distinct states. **Unselected is not disabled:** keep its name/mark readable, use check/border/material treatment to communicate selection, and do not rely on color alone.
- Pack tiles have stable slots for artwork/mark, title and selection indicator. Logos must not accidentally become inline punctuation after a wrapped title. Avoid repeating the same hero illustration as the only differentiator.
- Use the same painted button vocabulary for Play, Roll, Continue and other primary actions. Avoid a clean gradient button dropped into an otherwise worn painted interface.
- Dice controls never cover actionable rules, pack marks or menu targets. Thumb reach does not justify a floating control over the paragraph.
- Text-bearing dialogs use quieter material than their edges. Maintain clear label baselines, consistent row spacing and 44px+ targets. Close/back controls remain reachable even with enlarged text; focus returns to a sensible control.
- Completion can feel warm and satisfying without loud confetti or extra mechanics. Recovery and installation remain clear and functional; explanations belong in those dialogs, not the main play surface.

## Motion direction: physical, restrained, coherent

The card is an object, not a web panel. Every phase should communicate an action: **deal, lift/turn, land, release/discard**. Stronger motion belongs to those actions; it should not compete continuously with reading.

- Front/back, thickness and lifted-card shadow must behave as one object. Remaining deck has its own subtle stationary contact shadow. A full-width lifted-card shadow behind an edge-on card reads as a compositing error.
- Highlights belong to the moving material and clip to its silhouette. No glint sweeping bare tabletop, floating rectangular sheen or front/back bleed through the turn.
- Show a meaningful part of the turn, not an immediate front followed by a long idle settle. Inspect at 0/25/50/75/100% and normal speed. Maintain one turn direction and one small believable lift; no ornamental extra wobble.
- Discard follows a clear outward trajectory. It exposes the next back coherently; fading supports leaving the field and cannot hide a discontinuous swap.
- One shared duration/easing owner per semantic phase. Current code tokens (`src/presentation/theme.ts`, emitted as `--motion-*`): deal 560ms, flip 560ms, discard 420ms, settle 160ms, roll 2600ms, dialog enter 220ms, dialog exit 180ms, completion 600ms. These are the baseline to review, not proof that the feel is approved. Measure effective CSS and lifecycle completion together before changing timings.
- Animations use transform/opacity where feasible. Do not animate box-shadow/filter/blur continuously to simulate expensive polish. Keep will-change scoped to active motion rather than every UI element forever.
- Atmosphere is sparse, low contrast and always on; Reduced Motion removes it and a hidden app suspends it (there is no Atmosphere or Effects switch). Do not apply a dev-only override inconsistently across renderer and controller.
- Input locks last only through their intended transition. All accepted actions save once before animation; cancellation/hidden/reload restores the committed state. No animation polish may change this contract.

## Dice-specific composition

Keep the transparent full-screen `@3d-dice/dice-box-threejs` roll over the live card. The 2026-09-25 direct user request supersedes the former above-card parking and non-occlusion rules.

- First tap on a revealed dice card commits the result and throws. A second tap during motion accelerates the **same recorded physical trajectory** through its landing (240ms), holds the matching faces for 180ms, then dismisses. If already settled, that tap dismisses immediately. A later tap discards the card; rapid repeats cannot reroll or discard during the return transition.
- Dice may land anywhere within the viewport, including over titles or rules. Never slide them into a display row after landing. Keep complete mesh bounds inside the viewport, including four-die legacy saves.
- The original rule stays visible until dismissal. Then show its resolved instruction in the same body typography, with numerical amounts in semantic bold. No “Rolled” heading, “On N” prefix, or extra continuation copy. Arithmetic, doubles, and legacy prose conditions are resolved for display without rewriting saved outcomes.
- The lazy renderer warms while the revealed card is read. Normal playback spans 1.5–2.6 seconds plus initialization; frame interpolation follows the library's own pre-simulation. Body settings are applied at creation consistently, never changed between the pre-simulation and replay.
- Use local procedural teal enamel, broader brass bevels and inlay, ivory pips on d6 and serif numerals on d20. Keep restrained highlights and projected contact shadows; no dimming or continuously running animation after settlement. Hand-authored markings keep every face exact without downloaded textures.
- Sound remains removed. Reduced Motion, restoration, or renderer failure shows static saved values, with a tap returning to the resolved rule and no forced replay. Escape and stationary taps on the surrounding table can finish/dismiss; rules scrolling keeps its existing gesture protection.
- Browser emulation does not establish physical-device frame rate or subjective approval. Review timing, material readability, and Safari toolbar behavior on the user's phone.

## Visual release gate

For every frame/layout/motion change, keep before/after evidence and review:

1. 320×568 and 390×844 phone, 768×1024 iPad, 844×390 landscape, split view, enlarged text and Reduced Motion.
2. Setup including unselected packs; back; short/long/two-line-title/category/rule fronts; dice ready/moving/settled; Previous Card; pause/install/completion/recovery.
3. Mid-turn, edge-on and discard frames as well as stable screenshots. Review a normal-speed recording separately; frozen CSS frames do not measure FPS.
4. No hard frame seams, stretched ornaments, hidden instructions, overlapping CTA, disappearing pack identity, ambiguous disabled styling, backface bleed, or detached moving-card shadow.
5. Browser assertions measure paragraph visibility, control overlap and all card-context ratios, not only outer containment. Accessibility announcements, focus, touch/scroll gestures and exactly-once actions remain correct.
6. Physical iPhone/iPad Safari/Home Screen results, frame timing and VoiceOver are recorded separately. A desktop screenshot cannot certify native-quality performance.

Only user-approved revised compositions become golden references. Do not bless current broken screenshots just to make a regression suite pass. Keep one current design system and one implementation plan.

---

## Historical assets and generation record — not current layout instructions

The following preserves provenance and earlier prompts, including rejected/pending studies. Statements below about growing a card, pending frame approval, older timing, or replacement mouse art are historical and superseded by the current standards above and STATUS. Do not reimplement them.

### Original visual pass assets

Generated with the built-in image-generation tool. Original PNGs are preserved in `assets/source`; runtime WebP assets live in `public/art`. Resizing and WebP encoding use Sharp (no visual edits). The tankard preserves alpha. These are original fantasy-tavern assets, with no borrowed characters or logos.

## back

Create a production game asset: a single full-bleed portrait 2:3 fantasy tavern playing-card BACK texture. The image itself IS the card surface, edge to edge, straight-on orthographic, no surrounding scene, no perspective. Original painterly Hearthstone-like richness, handcrafted worn dark teal leather inset, chunky antique carved bronze and wood border, scuffed irregular bevels, tiny chips, warm edge highlights and deep crevices, lovingly handled rather than filthy. Central circular hammered-bronze medallion embossed with a cheerful foaming beer tankard, subtle turquoise enamel. Embossed flowing ornamental scrollwork, asymmetric handpainted imperfections. Luxurious restrained palette teal, walnut, old gold. NO text, NO letters, NO numbers, NO logo, NO sharp vector lines, NO photorealism. Border about 7 percent of width, keep corners almost square with gently rounded tips. Single usable card texture, not mockup.

## table

Production game background asset, portrait 2:3, top-down orthographic close-up of a dark weathered walnut tavern table. Hand-painted premium fantasy card-game style like Hearthstone, original artwork. Broad chunky old wooden planks with restrained carved grain, rubbed edges, shallow dents, occasional faint ring stain; warm brown highlights with deep neutral charcoal shadows. Calm large dark center where cards and UI will sit; brighter subtle amber grazing light along outer sides only. Full bleed surface, no objects, no cards, no glasses, no candles, no text, no borders, no scene perspective. Painterly tangible materials, low contrast and beautifully quiet, no perfect vector lines, no busy props. NOT photorealistic. Only the usable tabletop texture.

## front

Production game UI asset: a full-bleed portrait 2:3 empty fantasy card FRONT surface. Image itself is card face, flat orthographic edge-to-edge with no external backdrop, no perspective. Original Hearthstone-like hand-painted tactile style. Thick roughly sculpted walnut and tarnished bronze frame hugging outer 6 percent of image, softly chipped beveled corners, tiny scratches, rubbed golden highlights. Interior entirely empty warm antique cream parchment, subtly mottled fibrous paper, lightly stained toward edges but very calm bright readable center. Interior fills 85 percent of width and height, no inset windows or subdivisions. Empty parchment for live text and separate artwork to be placed on it. No illustrations, no objects, no symbols, no text, no letters, no UI, no perfect vector lines. Warm old gold and ivory with brown worn edges. Border near rectangular with gently rounded tips. Single usable card skin, not a mockup.

## mug

Single game card illustration, square format with genuinely transparent background and alpha. A charming chunky wooden fantasy tavern tankard filled with soft overflowing cream foam, battered hammered brass bands and a small round turquoise enamel ornament, sitting at a playful slight tilt. Original handpainted Hearthstone-style premium fantasy game art, rich brushstrokes, chiseled stylized forms, warm amber highlights, sculpted shadows, worn wood grain and nicked metal, beautiful painterly edges. Three tiny floating amber sparks and subtle grounding shadow only. Centered entire tankard visible with generous transparent margin. No text, no letters, no frame, no scene, no vector outlines, not photorealistic. This replaces a flat vector mug with expensive-looking original painted game art.


## Unified design system

The approved card back, parchment, tankard, and tabletop remain the permanent reference. Extend weathered walnut, dark teal leather, nicked bronze, and warm cream parchment; use the same upper-left lighting, restrained contact shadows, and worn edges. Functional labels stay plain and large. Keep background decoration away from the central card text.

- Shared asset, color, and motion definitions: `src/presentation/theme.ts`; shared CSS: `src/presentation/theme.css`.
- Grenze throughout: variable upright and italic WOFF2 files from the official Omnibus-Type repository, bundled locally with `public/fonts/OFL.txt`. Titles use 700–800, controls 500–700, and rules 400. Rule text is 20–24 px at normal scale and grows with text enlargement.
- Nine-slice borders preserve the painted frame corners on buttons, choice tiles, pack tiles, dialogs, and recovery panels. Fixed-ratio card fronts use the intact approved master. Do not stretch a whole panel image around long content.
- Primary controls use worn gold. Secondary surfaces use quiet teal leather. Functional icon symbols sit inside the generated bezel and retain accessible names.
- (Historical) Motion durations from an earlier pass were deal 620 ms, flip 680 ms, discard 460 ms, settle 140 ms, completion 650 ms. Current tokens are listed in the normative standards above and in `src/presentation/theme.ts`.
- (Historical) An earlier pass had Effects/Ambience preferences and an Atmosphere toggle. Sound was removed entirely and the atmosphere is now always on; see the normative standards above.
- (Historical) A procedural Web Audio foley and fireplace-ambience layer existed. It was removed on 2026-09-20; no audio subsystem ships.

## Reusable control artwork

Built-in image-generation tool, using the approved card back and front as reference inputs. `assets/source/ui-chrome.png` preserves the first generation; `assets/source/ui-chrome-final.png` preserves the final dark-background sheet. `scripts/chrome.ts` exports the observed button, panel, and bezel rectangles to `public/art/button.webp`, `panel.webp`, and `bezel.webp`. `scripts/icons.ts` composites the painted tankard inside the bezel and exports optimized PNG Home Screen icons.

Generation prompt:

> Create a SINGLE production UI asset sheet for the fantasy tavern game using the attached approved card materials as strict art-direction references. Original handpainted bronze walnut teal leather, chipped and rubbed, same lighting and colors, never clean vector lines. Transparent background. Canvas 1024x1024. Arrange THREE distinct isolated usable components with generous blank transparent gutters: TOP HALF a wide horizontal rectangular gold/brass primary button plate with rounded chipped corners, raised bronze edging, luminous worn gold interior completely blank for live text. LOWER LEFT a square dark walnut panel with bronze corner brackets and flat quiet dark teal leather center, for a scalable nine-slice dialog panel. LOWER RIGHT a small square hammered bronze icon-button bezel, dark center completely blank for an overlaid functional symbol. Orthographic front view, all aligned, no perspective, no cast shadow outside component. NO words, NO letters, NO icons, NO text, NO mockup. All shapes self contained and not touching. This is reusable game chrome, not cards.

Correction prompt (the first output rendered a checkerboard instead of alpha):

> Edit this UI asset sheet only: replace ALL gray-and-white checkerboard background with a uniform solid very dark warm brown #17100c. Keep the three painted components exactly unchanged, at exactly the same positions and dimensions, with identical artwork, edges and colors. No checkerboard anywhere, no transparency needed. Do not add or remove or move anything.

## Richer front study — historical (now the shipping front)

This study was approved on 2026-09-14 and promoted to the shared `CardFace`; the workshop-only toggle and its assets are gone. **"The card grows for long content" is superseded:** the shipping card keeps one fixed 2:3 outer ratio and contains long rules in a scrollable panel (see the normative standards above).

The study is isolated in the developer workshop. It is not yet the shipping card frame. Review `core.cheers`, `core.animals`, and `core.left` at Small phone and iPad sizes, then try enlarged text and Replay reveal. Approval is required before promoting this front into gameplay and Previous Card.

Composition: upper painted scene, raised teal title plaque, pale parchment instruction panel. Bronze hop-leaf corners, walnut rails, and contact shadows tie the front to the approved back. Nine-slice borders retain corner craftsmanship; rules remain real Grenze text and (historical) the card grew for long content. Categories stay in authoring metadata; the card footer carries the pack logo. Scene art is separate from frame and text.

New source artwork was generated with the built-in image generation tool, using `assets/source/card-back.png` and `assets/source/card-front.png` as references. Original PNGs are retained; optimized slices and the illustration live under `src/workshop/art` until approval.

### Frame sheet prompt

Create a production UI asset sheet for an original painted fantasy tavern card game. References establish exact weathered bronze, carved walnut, teal leather, warm parchment painterly craftsmanship. Output ONE square sheet with FOUR separate rectangular pieces arranged 2x2, gutters plain dark charcoal. Top left: ornate empty illustration surround, rectangular with arched ornamental top, dark teal blank interior, carved walnut outer rails and bronze hop-leaf corner hardware. Top right: wide blank teal leather title plaque with bronze beveled edge, no text. Bottom left: parchment rules panel, pale luminous blank readable center, intricate bronze and walnut edges, subtle hops corner carving. Bottom right: detailed small bronze hop-leaf ornament on dark teal. All front-facing orthographic flat assets, no perspective, no words, letters, numbers, stats, gems or logos. Each piece fully inside its quadrant with margins. Rich hand painted not vector. UI pieces for slicing, illustration goes into upper frame later. Match reference materials.

Saved source: `assets/source/front-study-sheet.png`. Extracted rectangles in source pixels: surround (8,8,610,589), plaque (638,137,603,326), parchment (8,619,610,589). WebP quality 85. The bottom-right ornament is retained in source for potential later use.

### A little cheers — revised original illustration

The dwarf study was rejected for excessive detail, franchise resemblance, and poor crop safety. It is no longer used. `ILLUSTRATION_GUIDELINES.md` is now the governing image-creation document. Categories remain metadata only; the action area shows rules and a pack logo. Core's four-point diamond matches setup and the pause legend.

Normal-size study cards share a common silhouette at each viewport. The art window is approximately 1.4:1; the scene never drives layout dimensions. (Historical, superseded) enlarged text was said to extend the frame instead of clipping or shrinking the rules; the shipping card instead keeps its 2:3 ratio and scrolls the rules panel.

Generated with the built-in image generation tool using the approved card back as a palette/material reference. New source: `assets/source/cheers-mouse-v2.png`; 768px-wide WebP: `src/workshop/art/cheers-mouse-v2.webp`.

#### Exact replacement prompt

Create an ORIGINAL whimsical storybook fantasy card illustration, landscape 3:2 composition, no border or text. 'A little cheers': one cheerful round field-mouse traveler in a simple moss-green cape raising a small bronze cup in a toast. Large readable rounded shapes, gentle expression, oversized round ears, simple silhouette. Mouse and raised cup form ONE compact centrally grouped subject entirely inside the middle 60 percent of the canvas horizontally and vertically. Show whole head and both ears with generous empty space ABOVE them; show complete cup. Main subject modest scale occupying only central 60 percent, never close-up cropped. Quiet soft warm ochre backdrop suggesting a tavern alcove through just one broad arch shape, no other characters, no tiny objects, no shelves, no candles, no particles, no crowd, no intricate costume. Three main color groups: warm chestnut fur, muted moss-teal cape, warm parchment-colored backdrop. Hand-painted gouache/oil storybook surface with broad brushwork, soft edge hierarchy, strong subject/background value separation. Readable at 120 pixels and at arm's length. Use supplied card-back ONLY as a palette and hand-crafted material reference, NOT composition or character style. Independently designed woodland fantasy character, no dwarf, no recognizable franchise characters, no Warcraft/Hearthstone character proportions, armor, logos, symbols, motifs or imitation. Friendly small adventure-book spirit, not photoreal, not vector. Essential subject safely centered so a small arched window can crop all four outer edges without losing ears, face or cup.

## Continuous front and goofy fantasy revision — approved 2026-09-14

The user reaffirmed the cohesive Hearthstone-inspired material/rendering language, with more goofy tavern and dungeon-crawl humor where appropriate (Heroes of Barcadia / Munchkin as tone references). Original character identity is required, not a departure into quiet woodland storybook art. The mouse is superseded by an original enchanted copper armor toast study. The old assets remain checkpoint history, not the current direction.

The master has one outer perimeter. The illustrated region and parchment are inset; a teal band attaches to the side rails with bronze brackets. `scripts/front-continuous.ts` now exports a single optimized 768×1152 surface from `assets/source/front-continuous-v3.png`. Because the outer card is always 2:3, uniform scaling preserves every original painted joint and corner. Do not independently stretch rails, title strips, or paper over this surface. The live illustration is clipped inside the upper opening; title and rules are accessible DOM text placed within the original plaque and parchment. The shared CardFace supplies gameplay, Previous Card, and workshop previews.

Inspection gates: compare 320px, 390px and iPad screenshots; no square art/paper corners may cover bronze hardware. Previous Card must fit both its dialog width and viewport height. Inspect actual painted flip frames in Chromium and WebKit: hidden fronts must never show mirrored text. Browser backface CSS alone is insufficient evidence; Play culls the reverse side using the rendered rotation angle only while turning. Preserve readable 22px rules and a contained scroll fallback for long content.

Built-in image generation was used for both new assets and the illustration correction. Final source illustration: `assets/source/cheers-armor-v3.png`; continuous frame surfaces are optimized into `src/presentation/art` (continuous-* names) and the card illustration into `public/art/cheers.webp`, resolved through the artwork registry. Reproduce with `npx tsx scripts/front-continuous.ts`.

### Exact frame prompt

Production card FRONT master asset for the same original fantasy tavern game as reference. Portrait 2:3, orthographic edge-to-edge card, single object. EXACTLY ONE uninterrupted carved walnut perimeter with worn bronze hardware at its FOUR outer corners. Side rails run continuously top to bottom. Inside: upper 45 percent blank dark teal illustration opening, lower half blank pale luminous parchment for rules. At the boundary a BLANK teal leather title band runs edge to edge into the outer rails, fastened with small bronze brackets on left and right. The title band has no independent rectangular border, no corner caps, no bottom-row duplicate corners. Parchment tucks under this band and inside same outer rail. Strong original painterly fantasy collectible-card richness, sculpted scuffed bevels, warm upper left lighting, dimensional contact shadows, tasteful hop leaf details at outer corners only. No stats, gems, numbers, logos, text or actual illustration. Flat reusable UI skin, not scene/mockup. Crucial: unified SINGLE CARD not two stacked bordered panels. Border 6 percent wide, central parchment extremely quiet. Reference is material/lighting language, preserve bronze walnut and teal craftsmanship.

### Exact illustration prompt

Original premium painted fantasy party-game card illustration, landscape 3:2. Goofy bold heroic tavern comedy. One squat enchanted suit of dented copper armor with a wide bucket-shaped helmet, two expressive glowing amber eyes inside a dark visor and comically tiny feather, solemnly raising ONE comically tiny wooden cup with an oversized gauntlet. A ridiculous proud little toast, instantly readable visual joke. No human face or beard, no mouse or woodland-storybook character. No copied characters, insignia or franchise designs. Sculptural exaggerated shapes, confident broad digital oil brushwork, rich dimensional warm highlights and deep teal shadows, luxurious collectible-card painting, NOT thin ink drawing or flat vector. Keep COMPLETE helmet feather and cup well within central 65 percent with generous headroom and margins. One compact chest-up character clearly centered, about 65 percent image height; no cropped head. Quiet blurred walnut tavern backdrop, just large light/shadow masses, no clutter, shelves, crowd, scattered particles or miniature details. Reference only supplies bronze/walnut/teal materials and tactile richness. Goofy expressive silhouette with strong value separation and easy small-screen readability. No text, numbers, symbols, frame, stats, logos.

### Exact composition correction

Revise this original enchanted armor illustration. Keep the same character, expression, toast, palette, painterly style and simple background. ZOOM OUT substantially: shrink entire character and raised mug to approximately 65% of their current size and center the group. Add quiet blurred tavern background around them, especially 20% clear headroom above the feather and 15% empty margin left of the mug. Show the full feather and mug comfortably inside a central safe rectangle. Make the mug half its current size, amusingly tiny relative to the giant gauntlet. Simplify chest and shoulder ornament into broad plain copper and teal surfaces, fewer chips and etched details. Keep the dimensional painted finish and goofy friendly expression. Landscape 3:2. No words, logos, borders.

## Approved frame rollout — 2026-09-14

The unified front is approved and promoted to the shared `CardFace`: gameplay, Previous Card, and the workshop now render the same components and CSS. Frame surfaces live in `src/presentation/art` and the individual illustration in `public/art/cheers.webp`, resolved through the artwork registry; `src/presentation/card-front.css` loads after the legacy theme so old parchment borders cannot show through. The illustration stays centered, rules stay real text, and the Core diamond retains its footer position. Source artwork remains archived under `assets/source`.

Front surfaces are preloaded/decoded and included in the production offline cache. (Historical figures from this rollout: 1,931 KiB runtime, 80.8 KiB gzip JavaScript, 36 unit tests, 30 workshop cards.) The dice milestone has since shipped as the full-screen library overlay, mixed into the `core` pack. Physical iPhone/iPad Home Screen and performance checks remain outstanding.


## Layered illustration aperture — 2026-09-21

Render the same approved 2:3 master beneath and above the illustration. The lower surface supplies the original textured teal leather. The upper surface uses `src/presentation/art/frame-window.svg` as an alpha mask: only the illustration opening is transparent. Image pixels extend underneath the perimeter and title band, so their rectangular bounds never form a visible seam. Keep the mask in the master's 1024×1536 coordinates; update it only against the approved source. This is a rendering mask, not replacement vector decoration or regenerated artwork.

Keep the artwork container transparent. Finished scenes use their registry fit, while transparent tankard placeholders and failed-scene fallback images use `contain`. If both assets fail, the leather remains. Never introduce an opaque flat green panel over that texture. Keep focal subjects centered within the aperture and reserve space below the central top ornament.

Dice interaction follows the same card gesture: reveal → tap card to roll → tap card to return to its saved result → tap to discard. There is no separate Roll/Continue button. Accessible action labels, input locks, rules-scroll gesture handling, and Escape interruption remain. The full-screen dice layer is pointer-transparent.


## Dice surfaces and outcome copy — 2026-09-21

Dice use deep teal enamel, warm gold numerals in the bundled Grenze font, bronze bevels and subtle broad surface variation. Keep grain fine and low contrast; strong sand/paper noise looks cheap at this scale. Use restrained specular highlights and shallow bump so face values stay readable during and after motion. Texture and material work must never change forced-result simulation/replay settings.

After rolling, show one resolved instruction on the parchment, with the result embedded in its sentence. Do not add a separate “Rolled N” heading. New templates should use `{total}` when that number is part of the rule; avoid ambiguous references such as “that number.” Existing saves remain authoritative and are formatted for reading without mutating their outcomes.
