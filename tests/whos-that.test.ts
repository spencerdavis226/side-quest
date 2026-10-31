import { describe, expect, it } from "vitest";
import { createSession, currentCard, type Random } from "../src/game/engine";
import { cards, packs } from "../src/content/catalog";
import { quizAnswers, quizPools } from "../src/content/league/whosthat";
import type { GameConfig } from "../src/game/types";

const league: GameConfig = {
  version: 1,
  packIds: ["pokemon"],
  limit: null,
  quest: "pokemon",
};
const seeded = (seed: number): Random => {
  seed = (Math.imul(seed, 2654435761) >>> 0) % 2147483646 || 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
};
const quizIds = cards
  .filter((c) => c.secretPool)
  .map((c) => c.id)
  .sort();

describe("Who's That Pokémon?", () => {
  it("has about 250+ distinct answers, split across three cards without overlap", () => {
    expect(quizAnswers.length).toBeGreaterThanOrEqual(250);
    expect(new Set(quizAnswers).size).toBe(quizAnswers.length);
    const pools = quizPools(3);
    expect(pools.flat().sort()).toEqual([...quizAnswers].sort());
    for (const a of quizAnswers) expect(a.length).toBeLessThanOrEqual(120);
  });

  it("is three cards on a 20 second timer, not one on every route", () => {
    expect(quizIds).toHaveLength(3);
    for (const c of cards.filter((c) => c.secretPool)) {
      expect(c.timer).toMatchObject({ kind: "countdown", seconds: 20 });
      expect(c.secretPool).toContain(c.secret);
    }
  });

  it("deals a different answer each game, the same one on every read", () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const s = createSession(league, cards, packs, seeded(seed));
      const at = s.quest!.finale.findIndex((id) => quizIds.includes(id));
      if (at < 0) continue;
      s.quest!.due = true;
      s.quest!.step = at;
      const card = currentCard(s);
      expect(card.secretPool).toContain(card.secret);
      expect(currentCard(s).secret).toBe(card.secret);
      seen.add(card.secret!);
    }
    expect(seen.size).toBeGreaterThan(8);
  });
});
