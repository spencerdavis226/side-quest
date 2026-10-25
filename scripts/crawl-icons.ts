// Writes public/art/packs/{dungeon,pub-crawl}.svg, public/art/crawl/*.svg
// and public/art/league/*.svg. The crawl's marks: single-colour silhouettes
// from the vendored game-icons set (CC BY 3.0, docs/licenses), with the set's
// square background removed so each works as a CSS mask. The League's
// Poké Ball has no game-icons match, so it is drawn here. Rerun only to
// change a pick: `npx tsx scripts/crawl-icons.ts`.
import { mkdir, readFile, writeFile } from "node:fs/promises";

const picks: Record<string, string> = {
  "packs/dungeon": "delapouite/dungeon-gate",
  "packs/pub-crawl": "lorc/lantern-flame",
  "crawl/heart": "skoll/hearts",
  "crawl/draught": "delapouite/health-potion",
  "crawl/shield": "delapouite/heart-shield",
  "crawl/die": "delapouite/dice-six-faces-five",
  "crawl/smoke": "darkzaitzev/smoke-bomb",
  "crawl/bleed": "skoll/blood",
  "crawl/hex": "lorc/cursed-star",
  "crawl/boss": "lorc/crowned-skull",
  "crawl/satchel": "lorc/knapsack",
  "crawl/wiped": "lorc/candle-skull",
  "crawl/omen": "lorc/crystal-ball",
  "crawl/ambush": "lorc/two-shadows",
  "crawl/elite": "lorc/crossed-swords",
  "crawl/door": "lorc/wooden-door",
  // Pub Crawl's adventurer, trinkets, the Cup, the Quaff, the landing's
  // rest and a jinx (2026-10-17).
  "crawl/adventurer": "lorc/visored-helm",
  "crawl/trinket": "lorc/gem-pendant",
  // Pub Crawl's equipment slots (2026-10-25); the trinket slot keeps the
  // trinket's mark.
  "crawl/weapon": "lorc/broadsword",
  "crawl/armor": "lorc/breastplate",
  "crawl/cup": "lorc/chalice-drops",
  "crawl/quaff": "lorc/beer-stein",
  "crawl/rest": "lorc/campfire",
  "crawl/jinx": "delapouite/tongue",
  // A Bar Tab, and the League's Baton Pass.
  "crawl/round": "delapouite/beer-bottle",
  "league/baton-pass": "skoll/baton",
  // The Tera Orb (2026-10-25): Pub Crawl never deals it, but every item
  // needs a crawl mark.
  "crawl/tera": "lorc/floating-crystal",
  "league/tera-orb": "lorc/crystal-shine",
  // Pub Crawl's five knacks (2026-10-25): a class's two, and the room that
  // calls for one.
  "crawl/knack-brawn": "delapouite/biceps",
  "crawl/knack-sneak": "delapouite/robber-mask",
  "crawl/knack-magic": "lorc/magic-swirl",
  "crawl/knack-charm": "lorc/drama-masks",
  "crawl/knack-faith": "lorc/holy-symbol",
  // Pokémon League (src/components/crawlTheme.ts maps them to the crawl's
  // marks).
  "league/potion": "lorc/spray",
  "league/protect": "lorc/energy-shield",
  "league/x-attack": "lorc/punch-blast",
  "league/escape-rope": "delapouite/lasso",
  "league/poison": "lorc/poison-gas",
  "league/confused": "delapouite/knocked-out-stars",
  "league/badge": "skoll/achievement",
  "league/bag": "lorc/swap-bag",
  "league/whited-out": "skoll/knockout",
  "league/starter": "delapouite/koholint-egg",
  // The eighteen types (2026-10-24): each gym's badge and each starter's
  // panel wear their type's mark (src/presentation/pokemon-types.ts).
  "league/types/normal": "delapouite/round-star",
  "league/types/fire": "carl-olsen/flame",
  "league/types/water": "sbed/water-drop",
  "league/types/grass": "lorc/three-leaves",
  "league/types/electric": "lorc/power-lightning",
  "league/types/ice": "lorc/snowflake-2",
  "league/types/fighting": "lorc/fist",
  "league/types/poison": "lorc/poison-bottle",
  "league/types/ground": "lorc/earth-crack",
  "league/types/flying": "lorc/feathered-wing",
  "league/types/psychic": "lorc/third-eye",
  "league/types/bug": "delapouite/ladybug",
  "league/types/rock": "lorc/rock",
  "league/types/ghost": "lorc/ghost",
  "league/types/dragon": "lorc/dragon-head",
  "league/types/dark": "lorc/moon",
  "league/types/steel": "lorc/cog",
  "league/types/fairy": "lorc/fairy",
  // The Striaton trio's badge: three leaders, three types.
  "league/types/trio": "lorc/triple-yin",
};

// Drawn marks, in the same 512 box: a Poké Ball, its two halves split by
// the band and a ring around the button.
const drawn: Record<string, string[]> = {
  "league/poke-ball": [
    "M20.5 240A236 236 0 0 1 491.5 240H334.4A80 80 0 0 0 177.6 240Z",
    "M20.5 272A236 236 0 0 0 491.5 272H334.4A80 80 0 0 1 177.6 272Z",
    "M206 256a50 50 0 1 0 100 0a50 50 0 1 0-100 0Z",
  ],
};

const svg = (paths: string[]) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${paths
    .map((d) => `<path fill="#000" d="${d}"/>`)
    .join("")}</svg>\n`;

await mkdir("public/art/crawl", { recursive: true });
await mkdir("public/art/league/types", { recursive: true });
for (const [out, source] of Object.entries(picks)) {
  const file = await readFile(`assets/icons/game-icons/${source}.svg`, "utf8");
  const paths = [...file.matchAll(/<path[^>]*\sd="([^"]+)"[^>]*\/>/g)]
    .map((m) => m[1])
    .filter((d) => d !== "M0 0h512v512H0z");
  if (!paths.length) throw Error(`No artwork in ${source}`);
  await writeFile(`public/art/${out}.svg`, svg(paths));
}
for (const [out, paths] of Object.entries(drawn))
  await writeFile(`public/art/${out}.svg`, svg(paths));
console.log(
  `Wrote ${Object.keys(picks).length + Object.keys(drawn).length} crawl marks.`,
);
