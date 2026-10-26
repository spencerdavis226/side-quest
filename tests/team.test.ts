import { describe, expect, it } from "vitest";
import {
  advance,
  awaitingCatch,
  canSendIn,
  cardMatchup,
  catchIt,
  createSession,
  currentCard,
  letGo,
  sendIn,
  strikeOutcome,
  takeOffer,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import { gymTiers } from "../src/content/pokemon-league";
import type { GameConfig, SessionState } from "../src/game/types";

// The League's team (2026-10-25): a beaten wild Pokémon can be caught, two
// at most, and a teammate whose type beats the foe can be sent in, once a
// gym. And gyms 5 to 8 send out an ace.
const league: GameConfig = {
  version: 1,
  packIds: ["pokemon"],
  limit: null,
  quest: "pokemon",
};
const zero: Random = () => 0;
const party = (s: SessionState) => s.quest!.party!;
const round = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
/** A League run with `starter` put aside and `rooms` dealt next, in order;
 * the first is revealed. */
function facing(starter: string, ...rooms: string[]) {
  let s = createSession(league, cards, packs, () => 0.5);
  const finale = [...s.quest!.finale];
  const put = (id: string, at: number) => {
    const was = finale.indexOf(id);
    if (was >= 0) finale[was] = finale[at];
    finale[at] = id;
  };
  put(`pokemon.starter-${starter}`, 0);
  rooms.forEach((id, i) => put(id, i + 1));
  s = { ...s, quest: { ...s.quest!, finale } };
  s = advance(advance(s, zero), zero); // The starter, put aside.
  return advance(s, zero); // Reveal the first room.
}
const PIDGEY = "pokemon.route-pidgey"; // Flying strike, Route 1
const ODDISH = "pokemon.route-oddish"; // Grass strike, Route 1
const ZIGZAGOON = "pokemon.route-zigzagoon"; // Normal, rolled

describe("the League's team", () => {
  it("catches a wild Pokémon the starter beats, and never one it lost to", () => {
    let s = facing("pikachu", PIDGEY); // Electric beats Flying.
    expect(strikeOutcome(s.quest, currentCard(s))).toBe("won");
    expect(awaitingCatch(s)).toBe(true);
    expect(advance(s, zero)).toBe(s); // It waits for the choice.
    round(s);
    s = catchIt(s, zero);
    expect(party(s).team).toEqual([PIDGEY]);
    round(s);
    // Grass loses to Flying: nothing to catch.
    expect(awaitingCatch(facing("bulbasaur", PIDGEY))).toBe(false);
    // Letting it go puts the card aside with no team.
    const go = letGo(facing("pikachu", PIDGEY), zero);
    expect(go.quest!.step).toBe(2);
    expect(party(go).team).toBeUndefined();
  });

  it("catches after a won roll, and never a trainer", () => {
    let s = facing("charmander", ZIGZAGOON);
    s = returnToCard(rollDice(s, () => 0.99)); // A natural 20.
    expect(awaitingCatch(s)).toBe(true);
    s = returnToCard(rollDice({ ...s, roll: null }, () => 0));
    expect(awaitingCatch(s)).toBe(false); // A lost roll.
    const joey = cards.find((c) => c.id === "pokemon.route-youngster-joey")!;
    expect(joey.catchable).toBeUndefined();
  });

  it("holds two, and a third catch lets the oldest go", () => {
    let s = facing("pikachu", PIDGEY);
    s = { ...s, quest: { ...s.quest!, party: { ...party(s), team: [] } } };
    s.quest!.party!.team = ["pokemon.route-pichu", "pokemon.route-diglett"];
    s = catchIt(s, zero);
    expect(party(s).team).toEqual(["pokemon.route-diglett", PIDGEY]);
  });

  it("sends a teammate in for the edge, once until a gym falls", () => {
    // Squirtle (Water) is weak to Oddish (Grass); Pidgey (Flying) beats it.
    let s = facing("pikachu", PIDGEY, ODDISH);
    s = advance(catchIt(s, zero), zero);
    s = {
      ...s,
      quest: {
        ...s.quest!,
        finale: s.quest!.finale.map((id, i) =>
          i === 0 ? "pokemon.starter-squirtle" : id,
        ),
        party: { ...party(s), omen: "pokemon.starter-squirtle" },
      },
    };
    expect(currentCard(s).id).toBe(ODDISH);
    expect(cardMatchup(s.quest, currentCard(s))?.edge).toBe("disadvantage");
    expect(canSendIn(s, PIDGEY)).toBe(true);
    s = sendIn(s, PIDGEY);
    expect(cardMatchup(s.quest, currentCard(s))).toMatchObject({
      edge: "advantage",
      teammate: "Pidgey",
    });
    expect(strikeOutcome(s.quest, currentCard(s))).toBe("won");
    expect(party(s)).toMatchObject({ sent: PIDGEY, tired: [PIDGEY] });
    round(s);
    s = advance(s, zero); // Oddish is beaten: catch it, or let it go.
    s = letGo(s, zero);
    expect(party(s).sent).toBeUndefined();
    expect(party(s).tired).toEqual([PIDGEY]);
  });

  it("adds a catch card's Pokémon to the team", () => {
    let s = facing("pikachu", "pokemon.route-caterpie");
    const offer = currentCard(s).offers!.findIndex((o) => o.catch);
    s = takeOffer(s, offer, zero);
    expect(party(s).team).toEqual(["pokemon.route-caterpie"]);
    round(s);
  });

  it("refuses a save whose team was never dealt", () => {
    const s = facing("pikachu", PIDGEY);
    const bad = structuredClone(s);
    bad.quest!.party!.team = ["pokemon.route-lapras"];
    expect(() => parseSession(JSON.stringify(bad))).toThrow();
  });
});

describe("gym aces", () => {
  it("gyms 5 to 8 take two hits and send out an ace; the first four take one", () => {
    gymTiers.forEach((tier, k) => {
      for (const gym of tier) {
        const card = cards.find((c) => c.id === gym.id)!;
        expect(card.hits, card.id).toBe(k < 4 ? 1 : 2);
        expect(card.phases?.length ?? 0, card.id).toBe(k < 4 ? 0 : 1);
      }
    });
  });
});
