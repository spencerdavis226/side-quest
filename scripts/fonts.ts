// `npm run fonts`: subset Grenze (both styles) to the characters the app
// uses (`font-chars.ts`), from the originals in `assets/fonts/`, into
// `public/fonts/`, and record the set in `assets/fonts/subset.json`.
// Writes into `public/`. Needs Python's fonttools and brotli
// (`pip install fonttools brotli`); CI never runs it, it ships the output.
//
// Source Serif 4 is not subset: Adobe reserves the font name "Source", and
// the OFL lets no modified version keep it.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { FONT_SUBSET_RECORD, fontCodePoints } from "./font-chars";

const points = fontCodePoints();
const unicodes = points.map((cp) => cp.toString(16).padStart(4, "0"));
for (const name of ["grenze", "grenze-italic"])
  execFileSync("pyftsubset", [
    `assets/fonts/${name}.woff2`,
    `--unicodes=${unicodes.join(",")}`,
    // Every OpenType feature, and every name record (the OFL notice).
    "--layout-features=*",
    "--name-IDs=*",
    "--name-legacy",
    "--name-languages=*",
    "--flavor=woff2",
    `--output-file=public/fonts/${name}.woff2`,
  ]);
writeFileSync(
  FONT_SUBSET_RECORD,
  JSON.stringify(
    { font: "Grenze", characters: String.fromCodePoint(...points) },
    null,
    2,
  ) + "\n",
);
console.log(`Subset Grenze to ${points.length} characters.`);
