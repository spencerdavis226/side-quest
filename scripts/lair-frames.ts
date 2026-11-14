// Writes src/presentation/art/lair-{fire,frost,tide}.webp (The Quest 2.1):
// the approved ornate front (`ornate-teal-frame.webp`) with its teal enamel
// recoloured for each lair (ember, rime, deep sea), and nothing else
// touched: the gold, the wood and the parchment stay as painted. The dragon's
// card wears its lair's frame (`crawl.css`, `.lair-fight`). Rerun only to
// change a colour: `npx tsx scripts/lair-frames.ts`.
import sharp from "sharp";

const SOURCE = "src/presentation/art/ornate-teal-frame.webp";
type Tone = { hue: number; sat: number; light: number };
const LAIRS: Record<string, Tone> = {
  fire: { hue: 8, sat: 1.25, light: 0.95 },
  frost: { hue: 198, sat: 0.45, light: 2.1 },
  tide: { hue: 150, sat: 1.15, light: 1.15 },
};

function toHsl(r: number, g: number, b: number) {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? (g - b) / d + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return [h * 60, s, l];
}
function toRgb(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

const { data, info } = await sharp(SOURCE)
  .raw()
  .toBuffer({ resolveWithObject: true });
for (const [name, tone] of Object.entries(LAIRS)) {
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += info.channels) {
    const [h, s, l] = toHsl(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    // How teal this pixel is: full inside 160 to 205 degrees, fading out
    // over 20 degrees either side, and only where there is colour to move.
    const inBand =
      h >= 160 && h <= 205
        ? 1
        : h > 140 && h < 160
          ? (h - 140) / 20
          : h > 205 && h < 225
            ? (225 - h) / 20
            : 0;
    const w = inBand * Math.min(1, Math.max(0, (s - 0.05) / 0.1));
    if (!w) continue;
    const [r, g, b] = toRgb(
      tone.hue,
      Math.min(1, s * tone.sat),
      Math.min(0.95, l * tone.light),
    );
    out[i] = Math.round((data[i] / 255) * (1 - w) * 255 + r * w * 255);
    out[i + 1] = Math.round((data[i + 1] / 255) * (1 - w) * 255 + g * w * 255);
    out[i + 2] = Math.round((data[i + 2] / 255) * (1 - w) * 255 + b * w * 255);
  }
  await sharp(out, { raw: info })
    .webp({ quality: 85 })
    .toFile(`src/presentation/art/lair-${name}.webp`);
  console.log(`Wrote lair-${name}.webp`);
}
