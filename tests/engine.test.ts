import { describe, it, expect } from "vitest";
import { cards, packs, validateCatalog } from "../src/content/catalog";
import {
  advance,
  createSession,
  currentCard,
  shuffle,
} from "../src/game/engine";
import { rollDice, returnToCard } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import type { SessionState } from "../src/game/types";
const config = { version: 1 as const, packIds: ["core"], limit: 40 };
const rng = () => 0.42;
// The default Core pack now carries the dice cards too, so use the core deck
// size, not the whole catalog length.
const coreDeckSize = packs[0].cardIds.length;
// Dice cards must be rolled and returned before they can be discarded.
const dismiss = (state: SessionState, random = rng) => {
  let s = state;
  if (currentCard(s).dice && !s.roll?.returned) {
    if (!s.roll) s = rollDice(s, random);
    s = returnToCard(s);
  }
  return advance(s, random);
};
describe("deck engine", () => {
  it.each([1, 20, 40, 60, 500])(
    "finishes exactly %i cards after dismissal",
    (limit) => {
      let s = createSession({ ...config, limit }, cards, packs, rng);
      for (let i = 0; i < limit; i++) {
        expect(s.phase).toBe("hidden");
        s = advance(s, rng);
        expect(s.phase).toBe("revealed");
        expect(s.discarded).toBe(i);
        s = dismiss(s, rng);
        expect(parseSession(JSON.stringify(s))).toEqual(s);
      }
      expect(s.phase).toBe("complete");
      expect(s.discarded).toBe(limit);
      expect(advance(s)).toBe(s);
    },
  );
  it("exhausts unique cards every cycle, without a boundary repeat", () => {
    let s = createSession({ ...config, limit: null }, cards, packs, rng);
    let previous = "";
    for (let cycle = 0; cycle < 100; cycle++) {
      const seen = new Set<string>();
      for (let i = 0; i < coreDeckSize; i++) {
        const id = currentCard(s).id;
        if (i === 0) expect(id).not.toBe(previous);
        seen.add(id);
        previous = id;
        s = dismiss(advance(s, rng), rng);
      }
      expect(seen.size).toBe(coreDeckSize);
    }
    expect(s.discarded).toBe(100 * coreDeckSize);
  });
  it("handles one-card endless pools", () => {
    let s = createSession(
      { ...config, limit: null },
      cards.slice(0, 1),
      [{ ...packs[0], cardIds: [cards[0].id] }],
      rng,
    );
    for (let i = 0; i < 5; i++) s = dismiss(advance(s, rng), rng);
    expect(s.discarded).toBe(5);
    expect(s.cycle).toBe(5);
  });
  it("deduplicates overlapping packs", () => {
    const s = createSession(
      { ...config, packIds: ["core", "bonus"] },
      cards,
      [packs[0], { ...packs[0], id: "bonus" }],
      rng,
    );
    // Each card once, plus the one Last Call card a finite game ends on.
    expect(s.cards.length).toBe(coreDeckSize + 1);
    expect(s.cards.filter((c) => c.lastCall)).toHaveLength(1);
  });
  it.each([0, -1, 501, 1.5, NaN])("rejects bad limit %s", (limit) =>
    expect(() => createSession({ ...config, limit }, cards, packs)).toThrow(),
  );
  it("rejects empty and unknown selections", () => {
    expect(() =>
      createSession({ ...config, packIds: [] }, cards, packs),
    ).toThrow();
    expect(() =>
      createSession({ ...config, packIds: ["missing"] }, cards, packs),
    ).toThrow();
  });
  it("does not mutate input and supports deterministic RNG", () => {
    const input = ["a", "b", "c"];
    expect(shuffle(input, rng)).toEqual(shuffle(input, rng));
    expect(input).toEqual(["a", "b", "c"]);
  });
  it("restores revealed cards and snapshots independently of catalog changes", () => {
    const s = advance(createSession(config, cards, packs, rng));
    const restored = parseSession(JSON.stringify(s));
    expect(currentCard(restored)).toEqual(currentCard(s));
    expect(restored.phase).toBe("revealed");
    expect(s.cards[0]).not.toBe(cards[0]);
  });
  it.each(["null", "{}", "not json"])("rejects corrupt save %s", (raw) =>
    expect(() => parseSession(raw)).toThrow(),
  );
  it("rejects inconsistent order, progress, and completion", () => {
    const s = createSession(config, cards, packs, rng);
    for (const patch of [
      { order: [] },
      { position: 99 },
      { cycle: 2 },
      { discarded: 1 },
      { previousId: "missing" },
      { phase: "complete" },
    ])
      expect(() => parseSession(JSON.stringify({ ...s, ...patch }))).toThrow();
  });
});
describe("content validation", () => {
  it("accepts the sample pack", () =>
    expect(() => validateCatalog(cards, packs)).not.toThrow());
  it("rejects duplicate cards and packs", () => {
    expect(() => validateCatalog([...cards, cards[0]], packs)).toThrow();
    expect(() => validateCatalog(cards, [...packs, packs[0]])).toThrow();
  });
  it("rejects missing references and empty packs", () => {
    for (const cardIds of [[], ["missing"]])
      expect(() =>
        validateCatalog(cards, [{ ...packs[0], cardIds }]),
      ).toThrow();
  });
  it("rejects invalid fields", () => {
    for (const patch of [
      { title: "" },
      { rules: "" },
      { artwork: "https://example.com/x.png" },
      { category: "invalid" },
      { version: 2 },
    ])
      expect(() =>
        validateCatalog(
          [{ ...cards[0], ...patch } as (typeof cards)[number]],
          [],
        ),
      ).toThrow();
  });
});
