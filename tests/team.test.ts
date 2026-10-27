import { describe, expect, it } from "vitest";
import {
  advance,
  awaitingCatch,
  canSendIn,
  cardMatchup,
  catchIt,
  caughtBy,
  thrownBall,
  throwBall,
  createSession,
  currentCard,
  dropFromBag,
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

// The League's caught Pokémon (2026-10-25, bag items since 2026-10-26): a
// beaten wild Pokémon can be caught, two at most, and one whose type beats
// the foe can be used on that battle: it wins it and is spent. And gyms 5
// to 8 send out an ace.
const league: GameConfig = {
  version: 1,
  packIds: ["pokemon"],
  limit: null,
  quest: "pokemon",
};
const zero: Random = () => 0;
const high: Random = () => 0.99; // A natural 20.
/** Throw a ball that cannot miss, then put the card aside. */
const caught = (s: SessionState) => advance(throwBall(s, high), zero);
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
    s = caught(s);
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
    s = caught(s);
    expect(party(s).team).toEqual(["pokemon.route-diglett", PIDGEY]);
  });

  it("uses a caught Pokémon on a foe its type beats: it wins and is spent", () => {
    // Squirtle (Water) is weak to Oddish (Grass); Pidgey (Flying) beats it.
    let s = facing("pikachu", PIDGEY, ODDISH);
    s = advance(caught(s), zero);
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
    const hearts = party(s).hearts;
    const discarded = s.discarded;
    s = sendIn(s, PIDGEY, zero);
    // The strike is won, so nothing is lost; Pidgey is gone, and the card
    // is put aside with nothing left to carry over.
    expect(s.discarded).toBe(discarded + 1);
    expect(party(s).hearts).toBe(hearts);
    expect(party(s).team ?? []).toEqual([]);
    expect(party(s).sent).toBeUndefined();
    expect(party(s).tired).toBeUndefined();
    round(s);
  });

  it("is offered only against a foe its type beats", () => {
    // Pidgey (Flying) does not beat Pichu (Electric), nor Rattata (Normal).
    let s = facing("pikachu", PIDGEY, "pokemon.route-pichu");
    s = advance(caught(s), zero);
    expect(currentCard(s).id).toBe("pokemon.route-pichu");
    expect(canSendIn(s, PIDGEY)).toBe(false);
    expect(sendIn(s, PIDGEY, zero)).toBe(s);
  });

  it("is offered on a rolled battle the starter already beats too, and wins it for certain", () => {
    // A rolled wild Grass or Bug fight: Charmander (Fire) has the edge, and
    // so does Pidgey (Flying).
    const foe = cards.find(
      (c) =>
        c.id.startsWith("pokemon.route-") &&
        c.dice &&
        c.battle &&
        (c.type === "grass" || c.type === "bug"),
    )!;
    let s = facing("pikachu", PIDGEY, foe.id);
    s = advance(caught(s), zero);
    s = {
      ...s,
      quest: {
        ...s.quest!,
        finale: s.quest!.finale.map((id, i) =>
          i === 0 ? "pokemon.starter-charmander" : id,
        ),
        party: { ...party(s), omen: "pokemon.starter-charmander" },
      },
    };
    expect(currentCard(s).id).toBe(foe.id);
    expect(cardMatchup(s.quest, currentCard(s))?.edge).toBe("advantage");
    expect(canSendIn(s, PIDGEY)).toBe(true);
    const discarded = s.discarded;
    s = sendIn(s, PIDGEY, zero);
    expect(s.discarded).toBe(discarded + 1);
    expect(party(s).team ?? []).toEqual([]);
  });

  it("is not offered on a strike the starter already wins", () => {
    let s = facing("pikachu", PIDGEY, "pokemon.route-starly");
    s = advance(caught(s), zero);
    // Starly (Flying) is a strike Electric wins: nothing to add.
    expect(strikeOutcome(s.quest, currentCard(s))).toBe("won");
    expect(canSendIn(s, PIDGEY)).toBe(false);
  });

  it("throws an item out, or lets a caught Pokémon go, any time", () => {
    let s = facing("pikachu", PIDGEY);
    s = caught(s);
    s = {
      ...s,
      quest: {
        ...s.quest!,
        party: { ...party(s), loot: ["draught", "shield", "draught"] },
      },
    };
    // One of two identical items goes, the first; an item not held changes nothing.
    const less = dropFromBag(s, { item: "draught" });
    expect(party(less).loot).toEqual(["shield", "draught"]);
    expect(dropFromBag(s, { item: "die" })).toBe(s);
    // Letting Pidgey go empties the team; one never caught changes nothing.
    const free = dropFromBag(s, { caught: PIDGEY });
    expect(party(free).team).toBeUndefined();
    expect(dropFromBag(free, { caught: PIDGEY })).toBe(free);
    round(free);
    round(less);
  });

  it("keeps a save that rested a Pokémon valid when it is let go", () => {
    let s = facing("pikachu", PIDGEY);
    s = caught(s);
    s = {
      ...s,
      quest: { ...s.quest!, party: { ...party(s), tired: [PIDGEY] } },
    };
    round(s);
    const free = dropFromBag(s, { caught: PIDGEY });
    expect(party(free).tired).toBeUndefined();
    round(free);
  });

  it("adds a catch card's Pokémon to the team", () => {
    let s = facing("pikachu", "pokemon.route-caterpie");
    const offer = currentCard(s).offers!.findIndex((o) => o.catch);
    s = takeOffer(s, offer, high);
    // The ball is thrown and read on the card first.
    expect(party(s).team).toBeUndefined();
    expect(thrownBall(s)?.caught).toBe(true);
    round(s);
    s = advance(s, zero);
    expect(party(s).team).toEqual(["pokemon.route-caterpie"]);
    expect(party(s).throw).toBeUndefined();
    round(s);
  });

  it("still catches a Pokémon from an older save for a drink", () => {
    let s = facing("pikachu", PIDGEY);
    // A snapshot from before the throw has no number to beat.
    const finale = s.quest!.stages.flatMap((st) => st.cards);
    for (const c of [...finale, ...(s.cards ?? [])]) {
      if (c.id === PIDGEY) {
        delete c.catchRate;
        delete c.catchLines;
      }
    }
    expect(currentCard(s).catchRate).toBeUndefined();
    expect(throwBall(s, high)).toBe(s);
    s = catchIt(s, zero);
    expect(party(s).team).toEqual([PIDGEY]);
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

describe("the League's throws", () => {
  it("every catchable Pokémon has a number to beat and both lines", () => {
    const catchable = cards.filter(
      (c) => c.catchable || c.offers?.some((o) => o.catch),
    );
    expect(catchable.length).toBe(81);
    for (const c of catchable) {
      expect(c.catchRate, c.id).toBeGreaterThanOrEqual(2);
      expect(c.catchRate, c.id).toBeLessThanOrEqual(19);
      expect(c.catchLines?.caught.length, c.id).toBeLessThanOrEqual(120);
      expect(c.catchLines?.fled.length, c.id).toBeLessThanOrEqual(120);
    }
    const need = (id: string) => cards.find((c) => c.id === id)!.catchRate!;
    // Common and shy ones are easier than evolved and rare ones.
    expect(need(PIDGEY)).toBeLessThan(need("pokemon.route-gyarados"));
    expect(need("pokemon.route-gyarados")).toBeLessThan(
      need("pokemon.route-tyranitar"),
    );
  });

  it("a natural 20 always catches and a natural 1 never does", () => {
    expect(caughtBy(20, 19)).toBe(true);
    expect(caughtBy(1, 2)).toBe(false);
    expect(caughtBy(5, 5)).toBe(true);
    expect(caughtBy(4, 5)).toBe(false);
  });

  it("is thrown once, saved, and read on the card", () => {
    let s = facing("pikachu", PIDGEY);
    const need = currentCard(s).catchRate!;
    const low: Random = () => 0; // A natural 1.
    const missed = throwBall(s, low);
    expect(party(missed).throw).toEqual({ id: PIDGEY, face: 1 });
    expect(awaitingCatch(missed)).toBe(false); // Cannot throw again.
    expect(throwBall(missed, high)).toBe(missed);
    expect(thrownBall(missed)).toMatchObject({
      face: 1,
      need,
      caught: false,
      line: currentCard(s).catchLines!.fled,
    });
    round(missed); // A reload keeps the result.
    // A fled Pokémon never joins; the card is put aside with the next tap.
    const gone = advance(missed, zero);
    expect(party(gone).team).toBeUndefined();
    expect(party(gone).throw).toBeUndefined();
    s = throwBall(s, high);
    expect(thrownBall(s)).toMatchObject({ face: 20, caught: true });
    expect(party(s).team).toBeUndefined(); // Not until the card is put aside.
  });

  it("refuses a save whose throw is on another card", () => {
    const s = throwBall(facing("pikachu", PIDGEY), high);
    const bad = {
      ...s,
      quest: {
        ...s.quest!,
        party: { ...party(s), throw: { id: "pokemon.route-rattata", face: 5 } },
      },
    };
    expect(() => parseSession(JSON.stringify(bad))).toThrow();
  });

  it("a catch card's heal comes only with a catch", () => {
    const start = facing("pikachu", "pokemon.route-lapras");
    const hurt = {
      ...start,
      quest: { ...start.quest!, party: { ...party(start), hearts: 3 } },
    };
    const offer = currentCard(hurt).offers!.findIndex((o) => o.catch);
    const miss = advance(
      takeOffer(hurt, offer, () => 0),
      zero,
    );
    expect(party(miss).hearts).toBe(3);
    const win = advance(takeOffer(hurt, offer, high), zero);
    expect(party(win).hearts).toBeGreaterThan(3);
    expect(party(win).team).toEqual(["pokemon.route-lapras"]);
  });
});
