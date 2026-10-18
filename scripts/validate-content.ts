import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { cards, packs, validateCatalog } from "../src/content/catalog";
import { imprintIconSlugs } from "../src/content/imprint";
import { artworkRegistry, normalizeArtwork } from "../src/presentation/artwork";
import { theme } from "../src/presentation/theme";
import { buildImprintModule, IMPRINT_OUTPUT } from "./imprint";
import { FONT_SUBSET_RECORD, fontCodePoints } from "./font-chars";
validateCatalog(cards, packs);
// The imprint sprite is generated from the assignment map in
// src/content/imprint.ts. A stale file would ship the wrong icons, so fail the
// build and ask for `npm run imprint` instead of regenerating silently.
const [generated, expected] = await Promise.all([
  readFile(IMPRINT_OUTPUT, "utf8").catch(() => ""),
  buildImprintModule(),
]);
if (generated !== expected)
  throw Error(
    `Stale imprint sprite at ${IMPRINT_OUTPUT} — run \`npm run imprint\`.`,
  );
// Card scenes resolve through the artwork registry: an unregistered reference
// or a missing file fails the build, while old saved strings still render at
// runtime through the same resolver.
for (const c of cards) {
  if ([...c.title].length > 22)
    throw Error(`Card title exceeds 22 characters: ${c.id}`);
  if (Math.max(...c.title.split(/\s+/u).map((word) => [...word].length)) > 15)
    throw Error(`Card title has a word over 15 characters: ${c.id}`);
  const ruleChars = [...c.rules.trim()].length;
  const ruleWords = c.rules.trim().split(/\s+/u).length;
  if (ruleChars > 100 || ruleWords > 20)
    throw Error(`Card rule exceeds 100 characters or 20 words: ${c.id}`);
  if (ruleChars > 90 || ruleWords > 18)
    console.warn(
      `Review long card rule (${ruleChars} characters, ${ruleWords} words): ${c.id}`,
    );
  const spec = artworkRegistry[normalizeArtwork(c.artwork)];
  if (!spec) throw Error(`Unregistered artwork for ${c.id}: ${c.artwork}`);
  if (spec.publicPath && !existsSync(`public/${spec.publicPath}`))
    throw Error(`Missing artwork: ${spec.publicPath}`);
}
for (const [reference, spec] of Object.entries(artworkRegistry))
  if (spec.publicPath && !existsSync(`public/${spec.publicPath}`))
    throw Error(`Missing registered artwork: ${reference}`);
console.log(
  `Validated ${cards.length} cards in ${packs.length} pack(s), ${imprintIconSlugs().length} imprint icons.`,
);

for (const p of packs)
  if (p.artwork && !existsSync(`public/${p.artwork}`))
    throw Error(`Missing pack artwork: ${p.artwork}`);

for (const path of [
  ...Object.values(theme.assets),
  "fonts/grenze.woff2",
  "fonts/grenze-italic.woff2",
  "fonts/source-serif-4-bold.woff2",
  "fonts/OFL.txt",
])
  if (!existsSync(`public/${path}`))
    throw Error(`Missing theme asset: ${path}`);

const logos = new Set<string>();
for (const pack of packs) {
  if (!pack.logo || !existsSync(`public/${pack.logo}`))
    throw Error(`Missing pack logo: ${pack.id}`);
  if (logos.has(pack.logo))
    throw Error(`Packs must have distinct logos: ${pack.id}`);
  logos.add(pack.logo);
}

// Grenze ships subset to the characters the app uses (`npm run fonts`). A
// character added since would fall back to Georgia mid-word, so the build
// fails until the subset is regenerated.
const subset = new Set(
  JSON.parse(await readFile(FONT_SUBSET_RECORD, "utf8")).characters as string,
);
const missing = fontCodePoints()
  .map((cp) => String.fromCodePoint(cp))
  .filter((ch) => !subset.has(ch));
if (missing.length)
  throw Error(
    `Characters not in the Grenze subset: ${missing.join(" ")} — run \`npm run fonts\`.`,
  );
