import sharp from "sharp";

// Home Screen icon (2026-10-24, owner): the painted tankard on a flat teal
// gradient (the frame's teal), without the bezel it used to sit in. iOS
// rounds the corners and adds its own edge, so the square stays opaque and
// unrounded. The maskable copy draws the tankard smaller so it stays inside
// the safe circle (80% of the side) when Android crops it.
const SIZE = 1024;
const background = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
<defs>
 <linearGradient id="bg" x2="0" y2="1"><stop stop-color="#2f7d74"/><stop offset="1" stop-color="#0d2a28"/></linearGradient>
 <radialGradient id="sheen" cx=".5" cy="0" r="1"><stop stop-color="#fff" stop-opacity=".18"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
<rect width="${SIZE}" height="${SIZE}" fill="url(#sheen)"/>
</svg>`;

const tankard = await sharp("assets/source/tankard.png").trim().toBuffer();

async function icon(scale: number) {
  const side = Math.round(SIZE * scale);
  const mug = await sharp(tankard)
    .resize(side, side, { fit: "contain", background: "#0000" })
    .png()
    .toBuffer();
  // A soft shadow under the tankard lifts it off the flat background.
  const shadow = await sharp(mug)
    .ensureAlpha()
    .tint("#000000")
    .linear(1, 0)
    .blur(SIZE / 40)
    .composite([
      {
        input: Buffer.from([0, 0, 0, 90]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();
  const left = Math.round((SIZE - side) / 2);
  const top = Math.round((SIZE - side) / 2);
  return sharp(Buffer.from(background))
    .composite([
      { input: shadow, left, top: top + Math.round(SIZE / 50) },
      { input: mug, left, top },
    ])
    .png()
    .toBuffer();
}

const full = await icon(0.74);
const maskable = await icon(0.6);
for (const [name, size, source] of [
  ["icon-192.png", 192, full],
  ["icon-512.png", 512, full],
  ["icon-maskable.png", 512, maskable],
  ["apple-touch-icon.png", 180, full],
] as const)
  await sharp(source)
    .resize(size, size)
    .flatten({ background: "#0d2a28" })
    .png({ palette: true, quality: 95 })
    .toFile(`public/${name}`);
