import sharp from "sharp";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

// Builds the Ancient Mew League card pair used for every card in a Pokémon
// League game. Writes public/art/card-back-league.webp and
// src/presentation/art/league-front.webp (see pair.json for the prompts).
const root = "assets/source/league-ancient-2026-10-06";
type Art = { source: string; output: string; prompt: string };
const manifest: { assets: { front: Art; back: Art } } = JSON.parse(
  await readFile(join(root, "pair.json"), "utf8"),
);
for (const [side, art] of Object.entries(manifest.assets)) {
  const source = join(root, art.source);
  const dimensions = await sharp(source).metadata();
  if (
    !dimensions.width ||
    !dimensions.height ||
    Math.abs(dimensions.width / dimensions.height - 2 / 3) > 0.002
  )
    throw new Error(
      `${side}: source is not 2:3; revise the image instead of cropping its frame`,
    );
  await sharp(source)
    .resize(768, 1152)
    .webp({ quality: 82, effort: 6 })
    .toFile(art.output);
  const bytes = (await stat(art.output)).size;
  if (bytes > 500 * 1024)
    throw new Error(`${side}: over the 500 KiB image limit`);
  console.log(
    `${side}: 768×1152, ${(bytes / 1024).toFixed(1)} KiB → ${art.output}`,
  );
}
