import { describe, expect, it } from "vitest";
import {
  advance,
  cardMatchup,
  createSession,
  currentCard,
  strikeOutcome,
  strikeText,
  type Random,
} from "../src/game/engine";
import { parseSession } from "../src/app/persistence";
import { cards, packs, validateCatalog } from "../src/content/catalog";
import type { GameConfig, SessionState } from "../src/game/types";

// Strikes (owner, 2026-10-25): a League fight with no roll and no plaque.
// The type matchup picks the line and the cost when the card is put aside.
const league: GameConfig = {
  version: 1,
  packIds: ["pokemon"],
  limit: null,
  quest: "pokemon",
};
const zero: Random = () => 0;
const party = (s: SessionState) => s.quest!.party!;
/** A League run with `starter` put aside and `room` dealt next. */
function facing(starter: string, room: string) {
  let s = createSession(league, cards, packs, () => 0.5);
  s.quest!.finale[0] = `pokemon.starter-${starter}`;
  const at = s.quest!.finale.indexOf(room);
  if (at >= 0) s.quest!.finale[at] = s.quest!.finale[1];
  s.quest!.finale[1] = room;
  s = advance(advance(s, zero), zero);
  s = advance(s, zero); // Reveal the room.
  expect(currentCard(s).id).toBe(room);
  return s;
}
const PIDGEY = "pokemon.route-pidgey"; // Flying, on Route 1

describe("strikes", () => {
  it("are valid cards with three lines, in the League only", () => {
    const strikes = cards.filter((c) => c.strike);
    expect(strikes.length).toBeGreaterThanOrEqual(10);
    for (const c of strikes)
      expect(c.id.startsWith("pokemon.route-")).toBe(true);
    expect(() => validateCatalog(cards, packs)).not.toThrow();
    const bad = { ...strikes[0], strike: { ...strikes[0].strike!, even: " " } };
    expect(() => validateCatalog([bad], packs)).toThrow(/Invalid strike/);
    expect(() =>
      validateCatalog([{ ...strikes[0], battle: true }], packs),
    ).toThrow(/Invalid strike/);
  });

  it("an even matchup reads its line and costs only what it says", () => {
    let s = facing("charmander", PIDGEY); // Fire against Flying: even.
    const card = currentCard(s);
    expect(cardMatchup(s.quest, card)?.edge).toBeNull();
    expect(strikeOutcome(s.quest, card)).toBeNull();
    expect(strikeText(s.quest, card)).toBe(card.strike!.even);
    const hearts = party(s).hearts;
    s = advance(s, zero);
    expect(party(s).hearts).toBe(hearts);
  });

  it("the starter's edge reads the advantage line and costs nothing", () => {
    let s = facing("pikachu", PIDGEY); // Electric against Flying.
    const card = currentCard(s);
    expect(strikeOutcome(s.quest, card)).toBe("won");
    expect(strikeText(s.quest, card)).toBe(card.strike!.advantage);
    const hearts = party(s).hearts;
    s = advance(s, zero);
    expect(party(s).hearts).toBe(hearts);
  });

  it("a disadvantage reads its line and costs the card's hearts", () => {
    let s = facing("bulbasaur", PIDGEY); // Grass against Flying.
    const card = currentCard(s);
    expect(strikeOutcome(s.quest, card)).toBe("lost");
    expect(strikeText(s.quest, card)).toBe(card.strike!.disadvantage);
    const hearts = party(s).hearts;
    s = advance(s, zero);
    expect(party(s).hearts).toBe(hearts - card.damage!);
    expect(parseSession(JSON.stringify(s))).toEqual(s);
  });

  it("needs no verdict and no roll to be put aside", () => {
    let s = facing("bulbasaur", PIDGEY);
    const discarded = s.discarded;
    s = advance(s, zero);
    expect(s.discarded).toBe(discarded + 1);
  });
});
