import { describe, expect, it } from "vitest";
import { cards } from "../src/content/catalog";

// Realms is crude, not horny (owner, 2026-11-16: "Crude sexual or abrasive
// or adult humor is fine, but sex isn't the goal here ... I'm not looking
// for a sex party"). A sex joke may be a punchline; no card makes sex its
// subject or asks the table to act it out. This catches the wording the
// 2026-11-16 pass removed; `docs/CARD_VOICE_REFERENCE.md` has the rule.
const HORNY =
  /\b(horny|hookups?|sex|sexy|sexual\w*|flirt\w*|hump\w*|lube|topless|making out|in heat)\b/i;

// Kept on purpose: the joke is on a lonely tree, and the table acts nothing
// out. Its title is its ID, so a retitle would be an ID rename.
const KEPT = new Set(["dungeon.horny-oak"]);

describe("Realms stays crude, not horny", () => {
  it("has no card whose text is about sex", () => {
    for (const c of cards.filter(
      (c) => c.id.startsWith("dungeon.") && !KEPT.has(c.id),
    ))
      expect(JSON.stringify(c), c.id).not.toMatch(HORNY);
  });
});
