import { describe, expect, it } from "vitest";
import { cards } from "../src/content/catalog";
import {
  contrast,
  diceColors,
  houseDice,
} from "../src/presentation/dice/palette";

// The dice wear the starter's colours (owner, 2026-10-17), and since
// 2026-10-17 the Pub Crawl adventurer's (tonight's omen became a boon and
// no longer colours them); the numerals must stay legible from across the
// table on every one.
const omens = cards.filter((c) => c.omen);
const palettes = omens.flatMap((c) => [
  [c.title, c.palette],
  ...(c.evolves ?? []).map((e) => [e.title, e.palette] as const),
]) as [string, (typeof omens)[number]["palette"]][];

describe("dice palettes", () => {
  it("gives every starter and adventurer level its own colours", () => {
    // 23 starters and their 39 later forms; 12 adventurers and their 23
    // later levels.
    expect(palettes.length).toBe(23 + 39 + 12 + 23);
    for (const [title, p] of palettes) expect(p, title).toBeDefined();
    const keys = palettes.map(([, p]) => `${p!.primary}${p!.secondary}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keeps every numeral legible on its enamel", () => {
    for (const [title, p] of palettes) {
      const c = diceColors(p);
      expect(contrast(c.ink, c.body[1]), title).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.ink, c.body[0]), title).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps the house dice as they were without a palette", () => {
    expect(diceColors(undefined)).toBe(houseDice);
    expect(houseDice.body[1]).toBe("#123f45");
  });
});
