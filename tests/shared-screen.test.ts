import { describe, expect, it } from "vitest";
import { cards } from "../src/content/catalog";

// The League and the Quest are played on a shared screen (owner, 2026-11-16:
// "the best way to play this is by projecting it to an Apple TV where
// everyone can see"). No card in their packs may hold something for one
// player's eyes: a secret is shown to the table while the drawer looks away.
// Standard-only packs (Secrets & fuses) keep their read-alone cards.
const crawlCards = cards.filter(
  (c) => c.id.startsWith("pokemon.") || c.id.startsWith("dungeon."),
);

describe("shared screen in the League and the Quest", () => {
  it("never asks one player to read alone", () => {
    for (const c of crawlCards) {
      const text = [c.rules, c.timer?.end ?? ""].join(" ");
      expect(text, c.id).not.toMatch(/read (it )?alone|reads alone/i);
    }
  });

  it("shows every secret to the table while the drawer looks away", () => {
    const secrets = crawlCards.filter((c) => c.secret);
    expect(secrets).toHaveLength(10);
    for (const c of secrets) {
      expect(c.rules, c.id).toMatch(/^Drawer, look away\./);
      expect(c.rules, c.id).toMatch(/Left neighbor: Hold to read/);
      expect(c.rules, c.id).toMatch(/drawer guesses\.$/);
    }
  });
});
