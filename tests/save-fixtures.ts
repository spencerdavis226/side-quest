import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseSession } from "../src/app/persistence";
import { questRecord } from "../src/game/engine";
import { nextMove, seeded } from "../scripts/table-play";

// Real saves frozen from earlier releases (`npm run fixtures:saves`). A game
// in progress on a phone must survive every update: if one of these stops
// loading, the change would turn that game into "This save lost its place".
// Never edit or delete a fixture to make this pass; add new ones beside them.
//
// Split over `save-fixtures-<n>.test.ts` (2026-11-26): Vitest runs the files
// at once but a file's tests one by one, and these saves were the unit
// suite's longest file (42 s in CI). Every fixture lands in exactly one part.
export const SAVE_PARTS = 4;
const dir = "tests/fixtures/saves";
export const fixtures = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .sort();

export function checkSaves(part: number) {
  describe(`saved games from earlier releases (part ${part + 1} of ${SAVE_PARTS})`, () => {
    for (const [i, file] of fixtures.entries()) {
      if (i % SAVE_PARTS !== part) continue;
      it(`${file} loads and plays on`, () => {
        const raw = readFileSync(`${dir}/${file}`, "utf8");
        let s = parseSession(raw);
        expect(s.version).toBe(2);
        questRecord(s);
        // The engine keeps playing from it, and every state it reaches is a
        // save the app would load again.
        const random = seeded(file.length);
        for (let i = 0; i < 40 && s.phase !== "complete"; i++) {
          s = nextMove(s, random);
          expect(() => parseSession(JSON.stringify(s))).not.toThrow();
        }
      });
    }
  });
}
