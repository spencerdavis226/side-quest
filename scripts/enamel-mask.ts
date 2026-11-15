// Writes src/presentation/art/title-enamel.webp (2026-11-15, card accents):
// an alpha mask of the title band's teal enamel on the approved front
// (`ornate-teal-frame.webp`), found the way `lair-frames.ts` finds it (teal
// hue with colour to it), kept to the band at the top of the card. The card
// face tints and gilds the band through it (`.card-enamel` in
// card-front.css), so every type, region and boss gets its colour from one
// small image instead of a recoloured frame each. Rerun only if the frame
// changes: `npx tsx scripts/enamel-mask.ts`.
import sharp from "sharp";

const SOURCE = "src/presentation/art/ornate-teal-frame.webp";
const OUT = "src/presentation/art/title-enamel.webp";
/** The band: everything above the parchment's top edge (its lowest point,
 * the centre stud, sits near 28.5% of the height). */
const BAND = 0.3;

function hueSat(r: number, g: number, b: number) {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  if (max === min) return [0, 0];
  const l = (max + min) / 2;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? (g - b) / d + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return [h * 60, s];
}

const { data, info } = await sharp(SOURCE)
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const alpha = Buffer.alloc(width * height);
for (let y = 0; y < height * BAND; y++)
  for (let x = 0; x < width; x++) {
    // The corner studs' own enamel is not the band's.
    if (x < width * 0.09 || x > width * 0.91 || y < height * 0.05) continue;
    const i = (y * width + x) * channels;
    const [h, s] = hueSat(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    const inBand =
      h >= 160 && h <= 205
        ? 1
        : h > 140 && h < 160
          ? (h - 140) / 20
          : h > 205 && h < 225
            ? (225 - h) / 20
            : 0;
    const w = inBand * Math.min(1, Math.max(0, (s - 0.05) / 0.1));
    alpha[y * width + x] = Math.round(w * 255);
  }
// Close the speckle: a light blur, then a soft threshold, so the mask is
// one enamel field with feathered edges rather than a sieve.
const soft = await sharp(alpha, { raw: { width, height, channels: 1 } })
  .blur(1.2)
  .linear(1.6, -50)
  .extractChannel(0)
  .raw()
  .toBuffer();
const rgba = Buffer.alloc(width * height * 4);
for (let p = 0; p < width * height; p++) {
  rgba[p * 4 + 3] = soft[p];
}
await sharp(rgba, { raw: { width, height, channels: 4 } })
  .resize(Math.round(width / 2), Math.round(height / 2))
  .webp({ quality: 80, alphaQuality: 70, effort: 6 })
  .toFile(OUT);
console.log(`wrote ${OUT}`);
