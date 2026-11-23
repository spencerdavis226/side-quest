import { describe, expect, it } from "vitest";
import { cards, packs } from "../src/content/catalog";
import {
  advance,
  createSession,
  currentCard,
  placeLastCall,
  replaySession,
} from "../src/game/engine";
import { rollDice, returnToCard } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import type { GameConfig, SessionState } from "../src/game/types";

// Last Call (2026-11-23, owner): a Standard game ends on one closing card
// from the chosen packs' pools, dealt as its last draw.
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const standard = (packIds: string[], limit = 50): GameConfig => ({
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

describe("Last Call", () => {
  it("every pool card is flagged, ribboned and in no deck", () => {
    const decks = new Set(packs.flatMap((p) => p.cardIds));
    const pools = packs.flatMap((p) => p.lastCall ?? []);
    expect(pools.length).toBeGreaterThan(0);
    for (const id of pools) {
      const card = cards.find((c) => c.id === id)!;
      expect(card.lastCall, id).toBe(true);
      expect(card.ribbon, id).toBe("Last Call");
      expect(decks.has(id), id).toBe(false);
    }
    // Every flagged card sits in exactly one pool.
    const flagged = cards.filter((c) => c.lastCall).map((c) => c.id);
    expect([...flagged].sort()).toEqual([...pools].sort());
  });

  it("deals the closer as a Standard game's last card", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const random = seeded(seed);
      let s = createSession(standard(["core"]), cards, packs, random);
      const core = packs.find((p) => p.id === "core")!;
      for (let i = 0; i < 49; i++) {
        expect(currentCard(s).lastCall, `seed ${seed} draw ${i + 1}`).toBe(
          undefined,
        );
        s = play(s, random);
      }
      expect(s.phase).toBe("hidden");
      const last = currentCard(s);
      expect(core.lastCall).toContain(last.id);
      s = play(s, random);
      expect(s.phase).toBe("complete");
      expect(s.previousId).toBe(last.id);
      // A finished game ending on it is a valid save.
      expect(parseSession(JSON.stringify(s)).previousId).toBe(last.id);
    }
  });

  it("leaves the deck before it dealing exactly as it did", () => {
    // The closer is picked after the shuffle, so the first 49 draws match a
    // game without a pool.
    const bare = packs.map(({ lastCall: _lastCall, ...p }) => p);
    const a = createSession(standard(["core"]), cards, packs, seeded(7));
    const b = createSession(standard(["core"]), cards, bare, seeded(7));
    expect(a.order.slice(0, 49)).toEqual(b.order.slice(0, 49));
    expect(a.cards.length).toBe(b.cards.length + 1);
  });

  it("draws from every selected pack's pool", () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 400; seed++) {
      const s = createSession(
        standard(["core", "vip", "never"]),
        cards,
        packs,
        seeded(seed),
      );
      seen.add(s.order[49]);
    }
    for (const id of ["core", "vip", "never"])
      expect(
        [...seen].some((c) => c.startsWith(`${id}.closer-`)),
        id,
      ).toBe(true);
    expect([...seen].some((c) => c.startsWith("likely."))).toBe(false);
  });

  it("is never dealt in Infinite, a quest or a pack with no pool", () => {
    const none = (s: SessionState) =>
      expect(s.cards.some((c) => c.lastCall)).toBe(false);
    none(
      createSession(
        { version: 1, packIds: ["core"], limit: null },
        cards,
        packs,
        seeded(3),
      ),
    );
    none(
      createSession(
        { version: 1, packIds: ["dungeon"], limit: null, quest: "dungeon" },
        cards,
        packs,
        seeded(3),
      ),
    );
    none(createSession(standard(["secrets"]), cards, packs, seeded(3)));
  });

  it("is left out when the deck cannot reach the limit", () => {
    const vip = packs.find((p) => p.id === "vip")!;
    const s = createSession(
      standard(["vip"], vip.cardIds.length + 2),
      cards,
      packs,
      seeded(5),
    );
    expect(s.cards.some((c) => c.lastCall)).toBe(false);
    // A deck one card short of the limit still closes on it.
    const t = createSession(
      standard(["vip"], vip.cardIds.length + 1),
      cards,
      packs,
      seeded(5),
    );
    expect(t.order.at(-1)).toMatch(/^vip\.closer-/);
  });

  it("keeps its place when the same game is played again", () => {
    const s = createSession(
      standard(["core", "likely"]),
      cards,
      packs,
      seeded(9),
    );
    const closer = s.order[49];
    for (let seed = 1; seed <= 10; seed++)
      expect(replaySession(s, seeded(seed)).order[49]).toBe(closer);
  });

  it("placeLastCall leaves an order without a closer alone", () => {
    const deck = cards.filter((c) => !c.lastCall).slice(0, 5);
    const order = deck.map((c) => c.id);
    expect(placeLastCall(order, deck, 3)).toBe(order);
    expect(placeLastCall(order, deck, null)).toBe(order);
  });
});
