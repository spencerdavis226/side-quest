import { describe, expect, it } from "vitest";
import { cards, packs } from "../src/content/catalog";
import { resolveInstruction } from "../src/game/dice";
import { doubleBad, doubleGood } from "../src/content/naturals";

// The crawls' standing rule (owner, 2026-10-17): a natural 20 doubles a
// win's good and a natural 1 a loss's harm. Every d20 a crawl can deal says
// so on its own face.
const plain = new Set(packs.find((p) => p.id === "pokemon")!.cardIds);
const crawlD20s = cards.filter(
  (c) =>
    (c.id.startsWith("dungeon.") ||
      (c.id.startsWith("pokemon.") && !plain.has(c.id))) &&
    c.dice?.count === 1 &&
    c.dice.sides === 20,
);
const face = (dice: NonNullable<(typeof cards)[number]["dice"]>, n: number) =>
  resolveInstruction(dice, [n]);
const strip = (text: string) => text.replace(/^Natural (20|1)! /, "");
const outcome = (c: (typeof cards)[number], n: number) =>
  c.dice!.outcomes!.find((o) => o.min <= n && o.max >= n)!;

describe("natural 20 and natural 1", () => {
  it("doubles drinks, gives, shots and finishes", () => {
    expect(doubleBad("Bitten. Drink 3, then give 2.")).toBe(
      "Bitten. Drink 6, then give 2.",
    );
    expect(doubleBad("Take a spicy shot.")).toBe("Take two spicy shots.");
    expect(doubleBad("Everyone finishes their drink.")).toBe(
      "Everyone finishes their drink, then a fresh one.",
    );
    expect(doubleGood("Drink 2, then give 3.")).toBe("Drink 2, then give 6.");
    expect(doubleGood("Everyone else drinks 4.")).toBe(
      "Everyone else drinks 8.",
    );
    expect(doubleGood("Give a shot.")).toBe("Give two shots.");
    expect(doubleGood("The last one drinks 3.")).toBe("The last one drinks 6.");
  });

  it("gives every crawl d20 its own natural 20 and natural 1", () => {
    expect(crawlD20s.length).toBeGreaterThan(250);
    const flat: string[] = [];
    for (const c of crawlD20s) {
      const dice = c.dice!;
      const one = outcome(c, 1);
      const twenty = outcome(c, 20);
      expect([one.min, one.max], c.id).toEqual([1, 1]);
      expect([twenty.min, twenty.max], c.id).toEqual([20, 20]);
      if (!one.win) {
        expect(face(dice, 1), c.id).toMatch(/^Natural 1! /);
        if (!outcome(c, 2).win && strip(face(dice, 1)) === face(dice, 2))
          flat.push(`${c.id} (1)`);
      }
      if (twenty.win) {
        expect(face(dice, 20), c.id).toMatch(/^Natural 20! /);
        if (outcome(c, 19).win && strip(face(dice, 20)) === face(dice, 19))
          flat.push(`${c.id} (20)`);
      }
    }
    // A natural that reads like the roll beside it doubled nothing: give
    // the card its own crit or fumble.
    expect(flat).toEqual([]);
  });

  it("leads every other d20 card's own 1 and 20 too", () => {
    // The roll is the amount on these, so neither end is good or bad.
    const amount = new Set([
      "core.chosen-one",
      "core.body-count",
      "house.sheet-008",
      "cabin.maddy-booty",
    ]);
    const others = cards.filter(
      (c) =>
        c.dice?.count === 1 &&
        c.dice.sides === 20 &&
        !crawlD20s.includes(c) &&
        !amount.has(c.id),
    );
    expect(others.map((c) => c.id).sort()).toEqual([
      "core.fuck-around",
      "core.nat-one",
      "pokemon.missingno",
    ]);
    for (const c of others) {
      expect(face(c.dice!, 1), c.id).toMatch(/^Natural 1! /);
      // Missingno has no good roll for a natural 20 to double.
      if (c.id !== "pokemon.missingno")
        expect(face(c.dice!, 20), c.id).toMatch(/^Natural 20! /);
    }
  });
});
