import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseSession } from "../src/app/persistence";
import { questRecord } from "../src/game/engine";
import { nextMove, seeded } from "../scripts/table-play";

// Real saves frozen from earlier releases (`npm run fixtures:saves`). A game
// in progress on a phone must survive every update: if one of these stops
// loading, the change would turn that game into "This save lost its place".
// Never edit or delete a fixture to make this pass; add new ones beside them.
const dir = "tests/fixtures/saves";
const fixtures = readdirSync(dir).filter((f) => f.endsWith(".json"));

describe("saved games from earlier releases", () => {
  it("has fixtures to check", () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(21);
  });
  for (const file of fixtures) {
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
