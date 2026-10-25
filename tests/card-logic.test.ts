import { describe, expect, it } from "vitest";
import { cards } from "../src/content/catalog";
import type { CardDefinition } from "../src/game/types";

/**
 * Card logic guard from the 2026-09-26 sweep:
 * - A lasting rule runs for the rest of the game or until the drawing player's
 *   next turn; it never ends when the next card is revealed.
 * - Every card makes its actor explicit (drawing player, everyone, or a named
 *   subset). That is an editorial review, not a machine-checkable property.
 */

// Rule cards whose effect ends on its own stated condition instead of a turn or
// game horizon. Keep this list short and justified, and never add a card here
// to dodge the duration rule.
const DURATION_EXCEPTIONS = new Set([
  "house.sheet-015", // Mr Freeze: ends when the drawer stops touching them
]);

const textOf = (card: CardDefinition) =>
  [
    card.rules,
    card.secret ?? "",
    card.timer?.end ?? "",
    card.dice?.instruction ?? "",
    card.dice?.doubles ?? "",
    ...(card.dice?.outcomes ?? []).map((outcome) => outcome.instruction),
  ].join(" ");

describe("card logic sweep", () => {
  it("never ends a lasting rule at the next card", () => {
    for (const card of cards)
      expect(textOf(card), card.id).not.toMatch(/next card/i);
  });

  it("never doubles a full stop (an ellipsis is fine)", () => {
    for (const card of cards)
      expect(textOf(card), card.id).not.toMatch(/(?<!\.)\.\.(?!\.)/);
  });

  it("gives every lasting rule a whole-game or next-turn horizon", () => {
    for (const card of cards.filter((c) => c.category === "rule")) {
      if (DURATION_EXCEPTIONS.has(card.id)) continue;
      // A Pub Crawl omen is the run's first card and holds for the whole
      // crawl; its ribbon, "Tonight's omen", is its horizon.
      // A crawl's omens and boons hold for the run.
      if (card.omen || card.boon) continue;
      expect(textOf(card), card.id).toMatch(
        /next turn|rest of the game|end of the game/i,
      );
    }
  });

  // Table rules (owner, 2026-10-17): no chores. A crawl card never asks for
  // something before every sip, or for the whole night, unless the app
  // tracks it as a jinx (which lifts by itself). One-time actions are fine:
  // "Oink, then drink 2."
  it("asks for no per-sip chores and no untracked all-night rules in the crawls", () => {
    const plain = new Set(
      cards
        .filter((c) => c.id.startsWith("pokemon.") && !c.encounter)
        .map((c) => c.id),
    );
    const crawl = cards.filter(
      (c) =>
        c.id.startsWith("dungeon.") ||
        (c.id.startsWith("pokemon.") && !plain.has(c.id)),
    );
    for (const card of crawl)
      expect(textOf(card), card.id).not.toMatch(
        /before every (sip|drink)|for every sip|every time you stand|(rest of the|all) night/i,
      );
  });

  it("gives every jinx a name and a one-sentence rule with its slip", () => {
    const jinxed = cards.filter((c) => c.jinx);
    expect(jinxed.length).toBeGreaterThan(20);
    for (const { id, jinx } of jinxed) {
      expect(jinx!.name.length, id).toBeLessThanOrEqual(22);
      expect(jinx!.rule, id).toMatch(/drinks? 1\.$/);
    }
  });
});
