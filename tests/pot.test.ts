import { describe, expect, it } from "vitest";
import { cards, packs } from "../src/content/catalog";
import {
  advance,
  awaitingPress,
  cashOut,
  createSession,
  currentCard,
  pressOn,
  replaySession,
} from "../src/game/engine";
import { rollDice, returnToCard } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import type { SessionState } from "../src/game/types";

// Dealer's Choice (2026-11-24, owner): push your luck in the plain modes. A
// pot card's won roll offers Cash out or Ride on; a bust drinks the pot.
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const at = (id: string): SessionState => {
  const s = createSession(
    { version: 1, packIds: ["dealer"], limit: 50 },
    cards,
    packs,
    seeded(5),
  );
  const order = [id, ...s.order.filter((x) => x !== id)];
  return advance({ ...s, order }); // face up
};
/** Roll the card in play to a face: 0 reads 1, 0.99 the top face. */
const rollTo = (s: SessionState, r: number) =>
  returnToCard(rollDice(s, () => r));
const save = (s: SessionState) => parseSession(JSON.stringify(s));

describe("pot cards", () => {
  it("every pot card is a plain dice card that can win and bust", () => {
    const pots = cards.filter((c) => c.pot);
    expect(pots).toHaveLength(12);
    for (const c of pots) {
      expect(c.id.startsWith("dealer."), c.id).toBe(true);
      expect(c.battle, c.id).toBeUndefined();
      expect(c.rules, c.id).toMatch(/cash out/i);
    }
  });

  it("shows the pot, banks a win, rides on, and busts", () => {
    let s = at("dealer.night-bus"); // pot 2, 3, 5, 8; bust on 1-2
    expect(currentCard(s).ribbon).toBe("Pot: 2");
    s = rollTo(s, 0.99);
    expect(currentCard(s).ribbon).toBe("Banked 2");
    expect(awaitingPress(s)).toBe(true);
    // The card waits for a choice.
    expect(advance(s)).toBe(s);
    expect(save(s)).toEqual(s);
    s = pressOn(s);
    expect(s.press).toBe(1);
    expect(s.roll).toBeNull();
    expect(currentCard(s).ribbon).toBe("Riding on 3");
    expect(save(s)).toEqual(s);
    s = rollTo(s, 0);
    expect(currentCard(s).ribbon).toBe("Bust: drink 3");
    expect(awaitingPress(s)).toBe(false);
    const after = advance(s);
    expect(after.press).toBeUndefined();
    expect(after.discarded).toBe(1);
    expect(after.previousId).toBe("dealer.night-bus");
    expect(save(after)).toEqual(after);
  });

  it("cashes out with the pot, and the last pull pays the jackpot", () => {
    let s = at("dealer.let-it-ride"); // coin, pot 2, 4, 8
    s = rollTo(s, 0.99);
    const out = cashOut(s, seeded(1));
    expect(out.discarded).toBe(1);
    expect(out.press).toBeUndefined();
    s = pressOn(s);
    s = pressOn(rollTo(s, 0.99));
    expect(s.press).toBe(2);
    s = rollTo(s, 0.99);
    expect(currentCard(s).ribbon).toBe("Jackpot: give 8");
    // No pull left: the card is put aside as usual.
    expect(awaitingPress(s)).toBe(false);
    expect(advance(s).discarded).toBe(1);
  });

  it("busts on a pair when the dice say so", () => {
    let s = at("dealer.card-counter");
    s = rollTo(s, 0.5); // 4 and 4
    expect(currentCard(s).ribbon).toBe("Bust: drink 2");
    expect(awaitingPress(s)).toBe(false);
  });

  it("rejects a pot count that does not fit the card in play", () => {
    const s = at("dealer.night-bus");
    expect(() => save({ ...s, press: 1 })).not.toThrow();
    expect(() => save({ ...s, press: 4 })).toThrow();
    expect(() => save({ ...s, press: 0 })).toThrow();
    const plain = at("dealer.comped");
    expect(() => save({ ...plain, press: 1 })).toThrow();
  });

  it("a replay starts with no pot ridden", () => {
    const s = pressOn(rollTo(at("dealer.night-bus"), 0.99));
    expect(replaySession(s, seeded(2)).press).toBeUndefined();
  });
});
