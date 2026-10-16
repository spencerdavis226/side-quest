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
await mkdir("public/art/league", { recursive: true });
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
