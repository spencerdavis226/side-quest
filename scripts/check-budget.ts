import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { cards } from "../src/content/catalog";
async function walk(dir: string): Promise<string[]> {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
      ),
    )
  ).flat();
}
// Budgets match how the app loads. The startup chunk has no byte cap (the
// owner dropped the old 100 KiB limit on 2026-10-05: art and fonts dominate
// the first screen, not script); it is reported, and the real guard is that
// card text never reaches it (below). Lazy chunks (the 3D dice library, each
// pack's cards) keep their own tier, capped one chunk at a time since
// 2026-10-16 (owner decision): a game fetches only the packs it plays, so a
// cap on the sum of every pack only penalised adding packs. The runtime cap
// below still bounds the whole offline precache.
// 4 MiB since 2026-10-15 (owner decision): Secrets & fuses passed 3 MiB.
const RUNTIME_LIMIT = 4 * 1024 * 1024;
const IMAGE_LIMIT = 500 * 1024;
const LAZY_JS_LIMIT = 200 * 1024;

const files = await walk("dist");
// Chunks referenced directly by index.html are the critical path; every other
// JS file in dist/assets is fetched on demand.
const html = await readFile("dist/index.html", "utf8");
const initialChunks = new Set(
  [...html.matchAll(/(?:src|href)="([^"]+\.js)"/g)].map((match) =>
    match[1].split("/").at(-1),
  ),
);
let cache = 0,
  initialJs = 0,
  lazyJs = 0,
  largestLazy = { name: "", gzip: 0 },
  initialCode = "";
for (const file of files) {
  const size = (await stat(file)).size;
  if (/\.(js|css|html|svg|png|webp|avif|woff2)$/.test(file)) cache += size;
  if (/\.(png|webp|avif|svg)$/.test(file) && size > IMAGE_LIMIT)
    throw Error(`Image exceeds 500 KiB: ${file}`);
  if (file.startsWith("dist/assets/") && file.endsWith(".js")) {
    const code = await readFile(file, "utf8");
    const gzip = gzipSync(code).length;
    const name = file.split("/").at(-1);
    if (name && initialChunks.has(name)) {
      initialJs += gzip;
      initialCode += code;
    } else {
      lazyJs += gzip;
      if (gzip > largestLazy.gzip) largestLazy = { name: name ?? file, gzip };
      if (gzip > LAZY_JS_LIMIT)
        throw Error(`Lazy chunk exceeds 200 KiB gzip: ${file} (${gzip})`);
    }
    if (
      /Card workshop|Front study|workshop-viewport|core\.dice-toast-study|core\.dice-title-study/.test(
        code,
      )
    )
      throw Error("Developer workshop leaked into production");
  }
}
// Card text loads per pack when a game starts (src/content/loaders.ts); a
// static import of a content module would quietly put it back on the
// critical path.
// Compare each card's first sentence, case-insensitively: some packs build
// their rules from a template at runtime.
const haystack = initialCode.toLowerCase();
const leaked = cards.find((card) => {
  const lead = card.rules.split(/[.!?]/)[0].toLowerCase();
  return lead.length >= 20 && haystack.includes(lead);
});
if (leaked) throw Error(`Card text reached the initial chunk: ${leaked.id}`);
// Conservatively count all runtime files, including SW, rather than undercount precache.
if (cache > RUNTIME_LIMIT) throw Error(`Runtime cache exceeds 4 MiB: ${cache}`);
console.log(
  `Budgets passed: ${(cache / 1024).toFixed(0)} KiB runtime; ${(initialJs / 1024).toFixed(1)} KiB gzip initial + ${(lazyJs / 1024).toFixed(1)} KiB gzip lazy JavaScript (largest chunk ${largestLazy.name}, ${(largestLazy.gzip / 1024).toFixed(1)} KiB). Workshop excluded.`,
);
