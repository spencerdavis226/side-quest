import sharp from "sharp";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";

// Originals and exact prompts live outside public/ so only these display-sized
// derivatives enter the offline cache. Rebuild with npm run art:league.
type Selection = {
  id: string;
  source: string;
  output: string;
  width: number;
  height: number;
  quality: number;
  prompt: string;
};
const root = "assets/source/league-2026-10-05";
const selections: Selection[] = JSON.parse(
  await readFile(join(root, "selected.json"), "utf8"),
);
let total = 0;
// Trace the generated silhouette's alpha boundary. Collinear vertices are
// collapsed; holes remain holes via even-odd fill. No hand-drawn replacement.
async function traceMark(source: string, width: number, height: number) {
  const { data } = await sharp(source)
    .resize(width, height)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const solid = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < width &&
    y < height &&
    data[(y * width + x) * 4 + 3] >= 128;
  const edges = new Map<number, number[]>();
  const vertex = (x: number, y: number) => y * (width + 1) + x;
  const edge = (x: number, y: number, ex: number, ey: number) => {
    const start = vertex(x, y);
    edges.set(start, [...(edges.get(start) ?? []), vertex(ex, ey)]);
  };
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (!solid(x, y)) continue;
      if (!solid(x, y - 1)) edge(x, y, x + 1, y);
      if (!solid(x + 1, y)) edge(x + 1, y, x + 1, y + 1);
      if (!solid(x, y + 1)) edge(x + 1, y + 1, x, y + 1);
      if (!solid(x - 1, y)) edge(x, y + 1, x, y);
    }
  const paths: string[] = [];
  while (edges.size) {
    const first = edges.keys().next().value!;
    const points: number[][] = [];
    let current = first;
    do {
      points.push([current % (width + 1), Math.floor(current / (width + 1))]);
      const next = edges.get(current)!;
      const end = next.pop()!;
      if (!next.length) edges.delete(current);
      current = end;
    } while (current !== first);
    const corners = points.filter((p, i) => {
      const before = points[(i + points.length - 1) % points.length];
      const after = points[(i + 1) % points.length];
      return (
        (p[0] - before[0]) * (after[1] - p[1]) !==
        (p[1] - before[1]) * (after[0] - p[0])
      );
    });
    paths.push(`M${corners.map((p) => p.join(",")).join("L")}Z`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><path fill="#000" fill-rule="evenodd" d="${paths.join("")}"/></svg>\n`;
}
for (const item of selections) {
  const source = join(root, item.source);
  await mkdir(dirname(item.output), { recursive: true });
  if (item.output.endsWith(".svg")) {
    await writeFile(
      item.output,
      await traceMark(source, item.width, item.height),
    );
  } else
    await sharp(source)
      .resize(item.width, item.height, {
        fit: "contain",
        background: "#00000000",
      })
      .webp({ quality: item.quality, alphaQuality: 90, effort: 6 })
      .toFile(item.output);
  const bytes = (await stat(item.output)).size;
  if (bytes > 500 * 1024) throw new Error(`Image over budget: ${item.output}`);
  total += bytes;
  console.log(`${item.id}: ${(bytes / 1024).toFixed(1)} KiB`);
}
console.log(
  `League art: ${(total / 1024).toFixed(1)} KiB across ${selections.length} assets`,
);
