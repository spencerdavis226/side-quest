// The characters the shipped app can draw in Grenze: every character in
// `src/` (cards, UI words, CSS content) and `index.html`, workshop excluded,
// plus printable ASCII and Latin-1. `fonts.ts` subsets Grenze to this set and
// records it; `validate-content.ts` fails the build when a character outside
// the recorded set appears, so new card text never falls back silently.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const FONT_SUBSET_RECORD = "assets/fonts/subset.json";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return path.endsWith("workshop") ? [] : files(path);
    return /\.(ts|tsx|css)$/.test(name) ? [path] : [];
  });
}

/** Code points, sorted. */
export function fontCodePoints(): number[] {
  const points = new Set<number>();
  for (let cp = 0x20; cp < 0x7f; cp++) points.add(cp);
  for (let cp = 0xa0; cp < 0x100; cp++) points.add(cp);
  for (const file of [...files("src"), "index.html"])
    for (const ch of readFileSync(file, "utf8")) {
      const cp = ch.codePointAt(0)!;
      if (cp >= 0x20) points.add(cp);
    }
  return [...points].sort((a, b) => a - b);
}
