import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cards, packs } from "../src/content/catalog";
import {
  advance,
  createSession,
  currentCard,
  dealOrder,
  plantSequels,
  replaySession,
  shuffle,
} from "../src/game/engine";
import { rollDice, returnToCard } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import type {
  CardDefinition,
  GameConfig,
  SessionState,
} from "../src/game/types";

// Callbacks (2026-11-24, owner): a card plants a sequel that the app deals a
// few draws later (Outbreak's cures, grenades, debts and quizzes).
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const config = (packIds: string[], limit: number | null = 50): GameConfig => ({
  version: 1,
  packIds,
  limit,
});
const play = (s: SessionState, random: () => number) => {
  if (s.phase === "hidden") s = advance(s, random);
  if (currentCard(s).dice && !s.roll?.returned) {
    if (!s.roll) s = rollDice(s, random);
    s = returnToCard(s);
  }
  return advance(s, random);
};
const byId = new Map(cards.map((c) => [c.id, c]));
/** Every planted card in `order` sits within its planter's range behind it
 * (or closes the deck, when planted near its end). */
const checkPlanted = (order: string[], label: string) => {
  for (const [i, id] of order.entries()) {
    const sequel = byId.get(id)?.sequel;
    if (!sequel) continue;
    const at = order.indexOf(sequel.cardId);
    expect(at, `${label}: ${id}`).toBeGreaterThan(i);
    const [min, max] = sequel.after;
    // Two sequels due on one draw push each other back by one; near the
    // deck's end every sequel still due closes it, sooner than planned.
    if (i + max < order.length - 20) {
      expect(at - i, `${label}: ${id}`).toBeGreaterThanOrEqual(min);
      expect(at - i, `${label}: ${id}`).toBeLessThanOrEqual(max + 3);
    }
  }
};

describe("callbacks", () => {
  it("every planted card is flagged, ribboned, in its pack's list and in no deck", () => {
    const decks = new Set(packs.flatMap((p) => p.cardIds));
    const planted = packs.flatMap((p) => p.planted ?? []);
    expect(planted).toHaveLength(20);
    for (const id of planted) {
      const card = byId.get(id)!;
      expect(card.planted, id).toBe(true);
      expect(card.ribbon, id).toBe("Callback");
      expect(decks.has(id), id).toBe(false);
      // Planted by exactly one deck card.
      expect(
        cards.filter((c) => c.sequel?.cardId === id),
        id,
      ).toHaveLength(1);
    }
  });

  it("deals each sequel behind the card that plants it", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = createSession(config(["secrets"]), cards, packs, seeded(seed));
      // Secrets & surprises: 156 secrets and timers, Outbreak's 26 deck
      // cards and its 20 callbacks (2026-11-24).
      expect(s.order).toHaveLength(202);
      expect(s.cards).toHaveLength(202);
      checkPlanted(s.order, `seed ${seed}`);
      // A sequel never opens the deck.
      expect(byId.get(s.order[0])?.planted).toBeUndefined();
    }
  });

  it("places sequels exactly within their range in a deck with room", () => {
    const planter: CardDefinition = {
      ...byId.get("outbreak.patient-zero")!,
    };
    const filler = cards.filter((c) => c.id.startsWith("core.")).slice(0, 30);
    const deck = [planter, byId.get("outbreak.cure-patient-zero")!, ...filler];
    for (let seed = 1; seed <= 50; seed++) {
      const ids = [planter.id, ...filler.map((c) => c.id)];
      const order = plantSequels(ids, deck, seeded(seed));
      const gap = order.indexOf("outbreak.cure-patient-zero");
      expect(gap).toBeGreaterThanOrEqual(4);
      expect(gap).toBeLessThanOrEqual(8);
      expect(order).toHaveLength(32);
    }
  });

  it("leaves a deck without callbacks dealt exactly as before", () => {
    const core = cards.filter((c) => c.id.startsWith("core.house"));
    const ids = core.map((c) => c.id);
    expect(dealOrder(ids, core, seeded(7), ids[3])).toEqual(
      shuffle(ids, seeded(7), ids[3]),
    );
  });

  it("plants again on every reshuffle and replay, and saves load", () => {
    const random = seeded(11);
    let s = createSession(config(["secrets"], null), cards, packs, random);
    for (let i = 0; i < 202 * 3 + 5; i++) {
      if (s.position === 0) checkPlanted(s.order, `cycle ${s.cycle}`);
      s = play(s, random);
      expect(() => parseSession(JSON.stringify(s))).not.toThrow();
    }
    expect(s.cycle).toBe(3);
    const again = replaySession(s, random);
    checkPlanted(again.order, "replay");
  });

  it("reads a save from the day Outbreak was its own pack as Secrets", () => {
    for (const name of [
      "2026-11-24-standard-callback-dealt",
      "2026-11-24-infinite-callbacks-second-round",
    ]) {
      const raw = readFileSync(`tests/fixtures/saves/${name}.json`, "utf8");
      expect(JSON.parse(raw).config.packIds, name).toContain("outbreak");
      const s = parseSession(raw);
      expect(s.config.packIds, name).toContain("secrets");
      expect(s.config.packIds, name).not.toContain("outbreak");
    }
  });

  it("deals the cure while the virus is fresh in a mixed Standard game", () => {
    const random = seeded(3);
    let s = createSession(config(["core", "secrets"]), cards, packs, random);
    checkPlanted(s.order, "core + outbreak");
    for (let i = 0; i < 49; i++) s = play(s, random);
    expect(currentCard(s).lastCall).toBe(true);
  });
});
