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
  "core.buffalo", // inside joke kept as written at the user's request
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

  it("gives every lasting rule a whole-game or next-turn horizon", () => {
    for (const card of cards.filter((c) => c.category === "rule")) {
      if (DURATION_EXCEPTIONS.has(card.id)) continue;
      expect(textOf(card), card.id).toMatch(
        /next turn|rest of the game|end of the game/i,
      );
    }
  });
});
