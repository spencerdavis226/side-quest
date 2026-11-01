import { describe, expect, it } from "vitest";
import {
  advance,
  assistBonus,
  awaitingCatch,
  canSendIn,
  cardMatchup,
  catchIt,
  caughtBy,
  ballsReady,
  canThrowMaster,
  throwWith,
  canUseLoot,
  partyTeam,
  throwMaster,
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
import { returnToCard, rollBonus, rollDice } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import { gymTiers } from "../src/content/pokemon-league";
import type { GameConfig, SessionState } from "../src/game/types";

// The League's caught Pokémon (2026-10-25, bag items since 2026-10-26): a
// beaten wild Pokémon can be caught, two at most, and one whose type beats
// the foe can be sent into a d20 fight (2026-10-31, a Nuzlocke): it adds
// +1 to +5 by how hard it was to catch, stays after a win and faints for
// good after a loss. And gyms 5 to 8 send out an ace.
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
/** Where each route's first card is dealt: the starter, then four cards
 * and a gym a route. */
const ROUTE_2 = 6;
const ROUTE_3 = 11;
/** `member` caught on Route 1, then `foe` revealed at `at`. */
function onRoute(starter: string, member: string, foe: string, at: number) {
  let s = facing(starter, member);
  s = advance(caught(s), zero);
  const finale = [...s.quest!.finale];
  const was = finale.indexOf(foe);
  if (was >= 0) finale[was] = finale[at];
  finale[at] = foe;
  s = {
    ...s,
    quest: { ...s.quest!, finale, step: at },
    discarded: at,
    previousId: finale[at - 1],
    phase: "hidden",
  };
  return advance(s, zero);
}
const PIDGEY = "pokemon.route-pidgey"; // Flying strike, Route 1
const MACHOP = "pokemon.route-machop"; // Fighting, rolled d20, Route 3
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

  it("sends a caught Pokémon into a d20 fight its type beats: +N, and it stays after a win", () => {
    // Pidgey (Flying, caught on a 5: +1) against Machop (Fighting), Route 3.
    let s = onRoute("pikachu", PIDGEY, MACHOP, ROUTE_3);
    expect(currentCard(s).id).toBe(MACHOP);
    expect(canSendIn(s, PIDGEY)).toBe(true);
    const before = rollBonus(s, currentCard(s));
    s = sendIn(s, PIDGEY, zero);
    expect(party(s).assist).toBe(PIDGEY);
    expect(party(s).team).toEqual([PIDGEY]);
    expect(rollBonus(s, currentCard(s))).toBe(before + 1);
    // The starter's own edge is untouched: Electric is even on Fighting.
    expect(cardMatchup(s.quest, currentCard(s))?.edge ?? null).toBe(null);
    expect(canSendIn(s, PIDGEY)).toBe(false);
    round(s);
    s = rollDice(s, high);
    expect(s.roll!.bonus).toBe(before + 1);
    round(s);
    s = advance(returnToCard(s), zero);
    if (awaitingCatch(s)) s = letGo(s, zero);
    expect(party(s).assist).toBeUndefined();
    expect(party(s).fainted).toBeUndefined();
    expect(party(s).team).toEqual([PIDGEY]);
    round(s);
  });

  it("faints for good when the fight it was sent into is lost", () => {
    let s = onRoute("pikachu", PIDGEY, MACHOP, ROUTE_3);
    s = sendIn(s, PIDGEY, zero);
    s = rollDice(s, zero); // A natural 1.
    s = advance(returnToCard(s), zero);
    expect(party(s).team ?? []).toEqual([]);
    expect(party(s).fainted).toBe(PIDGEY);
    round(s);
    // The news lasts one card: a table moment next, put aside.
    const finale = [...s.quest!.finale];
    const next = "pokemon.route-cool-contest";
    const was = finale.indexOf(next);
    if (was >= 0) finale[was] = finale[s.quest!.step];
    finale[s.quest!.step] = next;
    s = { ...s, quest: { ...s.quest!, finale } };
    s = advance(advance(s, zero), zero);
    expect(party(s).fainted).toBeUndefined();
  });

  it("is offered only on a d20 fight its type beats, never a strike or a 2d6", () => {
    // Pidgey (Flying) does not beat Pichu (Electric).
    let s = facing("pikachu", PIDGEY, "pokemon.route-pichu");
    s = advance(caught(s), zero);
    expect(currentCard(s).id).toBe("pokemon.route-pichu");
    expect(canSendIn(s, PIDGEY)).toBe(false);
    expect(sendIn(s, PIDGEY, zero)).toBe(s);
    // Flying beats Oddish (Grass), but a strike has no roll to add to.
    s = facing("pikachu", PIDGEY, ODDISH);
    s = advance(caught(s), zero);
    expect(currentCard(s).id).toBe(ODDISH);
    expect(canSendIn(s, PIDGEY)).toBe(false);
    // Flying beats Wurmple (Bug), but it rolls 2d6.
    s = onRoute("pikachu", PIDGEY, "pokemon.route-wurmple", ROUTE_2);
    expect(canSendIn(s, PIDGEY)).toBe(false);
  });

  it("sends a Normal Pokémon into any d20 fight it does not lose to, for one less", () => {
    const TAUROS = "pokemon.route-chansey"; // Caught on a 14: +4, +3 as Normal.
    // Normal beats nothing, but Machop (Fighting) is a disadvantage: refused.
    let s = facing("pikachu", TAUROS, MACHOP);
    s = advance(
      takeOffer(
        s,
        currentCard(s).offers!.findIndex((o) => o.catch),
        high,
      ),
      zero,
    );
    s = advance(s, zero);
    expect(currentCard(s).id).toBe(MACHOP);
    expect(canSendIn(s, TAUROS)).toBe(false);
    // Voltorb (Electric) is a neutral d20 fight for Normal: allowed.
    s = facing("pikachu", TAUROS, "pokemon.route-voltorb");
    s = advance(
      takeOffer(
        s,
        currentCard(s).offers!.findIndex((o) => o.catch),
        high,
      ),
      zero,
    );
    s = advance(s, zero);
    expect(party(s).team).toEqual([TAUROS]);
    expect(currentCard(s).id).toBe("pokemon.route-voltorb");
    expect(canSendIn(s, TAUROS)).toBe(true);
    const before = rollBonus(s, currentCard(s));
    s = sendIn(s, TAUROS, zero);
    expect(party(s).assist).toBe(TAUROS);
    expect(rollBonus(s, currentCard(s))).toBe(before + 3);
    expect(assistBonus(cards.find((c) => c.id === TAUROS))).toBe(3);
    // Never below +1: a Rattata (caught on a 5) still adds 1.
    expect(
      assistBonus(cards.find((c) => c.id === "pokemon.route-rattata")),
    ).toBe(1);
  });

  it("adds more the harder a Pokémon was to catch", () => {
    const rated = cards.filter((c) => c.catchRate);
    const bonus = (rate: number) =>
      assistBonus(rated.find((c) => c.catchRate === rate));
    expect(bonus(5)).toBe(1);
    expect(bonus(10)).toBe(3);
    expect(bonus(15)).toBe(4);
    expect(assistBonus(undefined)).toBe(1);
    for (const c of rated) {
      expect(assistBonus(c)).toBeGreaterThanOrEqual(1);
      expect(assistBonus(c)).toBeLessThanOrEqual(5);
    }
  });

  it("refuses a save whose sent-in Pokémon is not on the team", () => {
    const s = onRoute("pikachu", PIDGEY, MACHOP, ROUTE_3);
    const bad = {
      ...s,
      quest: {
        ...s.quest!,
        party: { ...party(s), team: [], assist: PIDGEY },
      },
    };
    expect(() => parseSession(JSON.stringify(bad))).toThrow();
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

  it("loads a save that rested a Pokémon, and forgets the rest", () => {
    const s = caught(facing("pikachu", PIDGEY));
    const old = JSON.parse(JSON.stringify(s));
    old.quest.party.tired = [PIDGEY];
    old.quest.party.sent = PIDGEY;
    const loaded = parseSession(JSON.stringify(old));
    expect(loaded).toEqual(s);
    round(dropFromBag(loaded, { caught: PIDGEY }));
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

describe("Master Ball, the Togepi egg and caught Legendaries", () => {
  const EGG = "pokemon.route-mystery-egg";
  const ZAPDOS = "pokemon.legendary-zapdos";
  const withBall = (s: SessionState): SessionState => ({
    ...s,
    quest: { ...s.quest!, party: { ...party(s), loot: ["master"] } },
  });

  it("the Master Ball lands a 20 at a beaten wild Pokémon, and is spent", () => {
    const s = withBall(facing("pikachu", PIDGEY));
    expect(canThrowMaster(facing("pikachu", PIDGEY))).toBe(false); // None.
    expect(canThrowMaster(s)).toBe(true);
    const thrown = throwMaster(s);
    expect(party(thrown).loot).toEqual([]);
    expect(party(thrown).throw).toEqual({ id: PIDGEY, face: 20, master: true });
    expect(thrownBall(thrown)).toMatchObject({ caught: true, master: true });
    expect(canThrowMaster(thrown)).toBe(false); // Once.
    round(thrown);
    expect(party(advance(thrown, zero)).team).toEqual([PIDGEY]);
    // Never a bag Use: it is thrown from its own plaque.
    expect(canUseLoot(s, "master")).toBe(false);
  });

  it("works on a catch card's offer too, heal and all", () => {
    const start = withBall(facing("pikachu", "pokemon.route-lapras"));
    const hurt = {
      ...start,
      quest: { ...start.quest!, party: { ...party(start), hearts: 3 } },
    };
    expect(canThrowMaster(hurt)).toBe(true);
    const done = advance(throwMaster(hurt), zero);
    expect(party(done).team).toEqual(["pokemon.route-lapras"]);
    expect(party(done).hearts).toBeGreaterThan(3);
  });

  it("refuses a saved Master Ball throw that is not a 20", () => {
    const s = throwMaster(withBall(facing("pikachu", PIDGEY)));
    const bad = {
      ...s,
      quest: {
        ...s.quest!,
        party: { ...party(s), throw: { id: PIDGEY, face: 7, master: true } },
      },
    };
    expect(() => parseSession(JSON.stringify(bad))).toThrow();
  });

  it("a Great Ball adds 3 and an Ultra Ball 6 to the throw, and each is spent", () => {
    const base = facing("pikachu", "pokemon.route-lapras");
    const need = currentCard(base).catchRate!;
    const bag = (s: SessionState, loot: ("great" | "ultra" | "master")[]) => ({
      ...s,
      quest: { ...s.quest!, party: { ...party(s), loot } },
    });
    const s = bag(base, ["great", "ultra", "master"]);
    expect(ballsReady(s)).toEqual(["great", "ultra", "master"]);
    // A face of need - 3 misses with a Poké Ball and catches with a Great Ball.
    const face = need - 3;
    const r: Random = () => (face - 1 + 0.5) / 20;
    const great = throwWith(s, "great", r);
    expect(party(great).throw).toEqual({
      id: "pokemon.route-lapras",
      face,
      ball: "great",
    });
    expect(party(great).loot).toEqual(["ultra", "master"]);
    expect(thrownBall(great)).toMatchObject({
      need: need - 3,
      caught: true,
      ball: "great",
    });
    // Lapras needs 7: an Ultra Ball takes it to the floor of 2.
    expect(need).toBe(7);
    const ultra = throwWith(s, "ultra", () => 0.06); // A 2.
    expect(thrownBall(ultra)).toMatchObject({ face: 2, need: 2, caught: true });
    // Never below 2: a natural 1 still misses.
    const one = throwWith(s, "ultra", () => 0);
    expect(thrownBall(one)).toMatchObject({ face: 1, caught: false });
    // Not without one in the bag.
    expect(throwWith(base, "great", r)).toBe(base);
  });

  it("refuses a saved throw with a ball that does not exist or beside a Master Ball", () => {
    const s = throwMaster(withBall(facing("pikachu", PIDGEY)));
    for (const thrown of [
      { id: PIDGEY, face: 20, master: true, ball: "great" },
      { id: PIDGEY, face: 9, ball: "hyper" },
    ]) {
      const bad = {
        ...s,
        quest: { ...s.quest!, party: { ...party(s), throw: thrown } },
      };
      expect(() => parseSession(JSON.stringify(bad))).toThrow();
    }
  });

  it("Silph Co. gives the Master Ball", () => {
    const loot = (id: string) => cards.find((c) => c.id === id)!.reward?.loot;
    expect(loot("pokemon.route-silph-gift")).toBe("master");
    expect(loot("pokemon.route-silph-maze")).toBe("master");
  });

  it("the egg hatches a Togepi onto the team on a win, and nothing on a loss", () => {
    const won = returnToCard(rollDice(facing("pikachu", EGG), high));
    const after = advance(won, zero);
    expect(party(after).team).toEqual([EGG]);
    round(after);
    const togepi = partyTeam(after.quest)[0];
    expect(togepi).toMatchObject({ title: "Togepi", type: "fairy" });
    expect(assistBonus(togepi)).toBe(2);
    expect(rewardOf(EGG)).toBeUndefined(); // No X Attack now.
    const lost = advance(
      returnToCard(rollDice(facing("pikachu", EGG), zero)),
      zero,
    );
    expect(party(lost).team).toBeUndefined();
  });

  it("a Legendary caught on its last beat joins the team at +5", () => {
    let s = facing("pikachu", ZAPDOS);
    s = { ...s, quest: { ...s.quest!, party: { ...party(s), hits: 1 } } };
    s = advance(returnToCard(rollDice(s, high)), zero);
    // (Dealt on Route 1 here, so no save round trip: a real save never is.)
    expect(party(s).team).toEqual([ZAPDOS]);
    const zapdos = partyTeam(s.quest)[0];
    expect(zapdos.type).toBe("electric");
    expect(assistBonus(zapdos)).toBe(5);
    // A Legendary that never says it was caught stays off the team.
    const lugia = cards.find((c) => c.id === "pokemon.legendary-lugia")!;
    expect(lugia.joins).toBeUndefined();
  });
});

function rewardOf(id: string) {
  return cards.find((c) => c.id === id)!.reward;
}
