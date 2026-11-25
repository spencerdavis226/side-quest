import { describe, expect, it } from "vitest";
import { cards } from "../src/content/catalog";

// Owner, 2026-11-25: "Make titles unique." Every card in the catalog has its
// own title, across every pack and mode, so a title names one card.
describe("card titles", () => {
  it("are unique across the whole catalog", () => {
    const seen = new Map<string, string>();
    for (const card of cards) {
      const other = seen.get(card.title);
      expect(other, `${card.title}: ${other} and ${card.id}`).toBeUndefined();
      seen.set(card.title, card.id);
    }
  });
});
