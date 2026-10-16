// Writes public/art/packs/{dungeon,pub-crawl}.svg and public/art/crawl/*.svg.
// Dungeon night's marks: single-colour silhouettes from the vendored
// game-icons set (CC BY 3.0, docs/licenses), with the set's square
// background removed so each works as a CSS mask. Rerun only to change a
// pick: `npx tsx scripts/crawl-icons.ts`.
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
};

await mkdir("public/art/crawl", { recursive: true });
for (const [out, source] of Object.entries(picks)) {
  const svg = await readFile(`assets/icons/game-icons/${source}.svg`, "utf8");
  const paths = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"[^>]*\/>/g)]
    .map((m) => m[1])
    .filter((d) => d !== "M0 0h512v512H0z");
  if (!paths.length) throw Error(`No artwork in ${source}`);
  await writeFile(
    `public/art/${out}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${paths
      .map((d) => `<path fill="#000" d="${d}"/>`)
      .join("")}</svg>\n`,
  );
}
console.log(`Wrote ${Object.keys(picks).length} Dungeon night marks.`);
