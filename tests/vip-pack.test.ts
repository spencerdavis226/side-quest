import { expect, test } from "vitest";
import { cards, packs } from "../src/content/catalog";

const vip = packs.find((p) => p.id === "vip")!;
const vipCards = cards.filter((c) => vip.cardIds.includes(c.id));

test("VIP night is a registered pack with its own mark", () => {
  expect(vip).toBeDefined();
  expect(vip.title).toBe("VIP night");
  expect(vip.logo).toBe("art/packs/vip.svg");
  // Every registered pack keeps a distinct logo path.
  const logos = packs.map((p) => p.logo);
  expect(new Set(logos).size).toBe(logos.length);
});

test("every VIP card is namespaced and centers the VIP", () => {
  expect(vipCards).toHaveLength(16);
  for (const card of vipCards) {
    expect(card.id.startsWith("vip.")).toBe(true);
    // Generated VIP cards name the VIP; the supplied sheet rows stay verbatim.
    if (!card.id.startsWith("vip.sheet-")) expect(card.rules).toContain("VIP");
    expect(card.rules.trim().split(/\s+/).length).toBeLessThan(45);
  }
});

test("VIP night keeps a spread of card categories", () => {
  const byCategory = Object.fromEntries(
    ["sip", "group", "category", "challenge", "rule"].map((category) => [
      category,
      vipCards.filter((card) => card.category === category).length,
    ]),
  );
  expect(byCategory).toEqual({
    sip: 5,
    group: 4,
    category: 2,
    challenge: 3,
    rule: 2,
  });
});
