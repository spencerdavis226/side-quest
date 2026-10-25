import { describe, expect, it } from "vitest";
import {
  advance,
  cardEdge,
  createSession,
  currentCard,
  finaleCard,
  knackEdge,
  strikeOutcome,
  verdictShift,
  type Random,
} from "../src/game/engine";
import { rollDice } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import { JOKE_CLASSES } from "../src/content/dungeon/classes";
import { roomKnacks, strikeKnacks } from "../src/content/dungeon/knacks";
import { STRIKE_HURT } from "../src/content/dungeon/shared";
import { validateCatalog } from "../src/content/validate";
import { KNACKS, type GameConfig, type SessionState } from "../src/game/types";

// Pub Crawl's knacks (2026-10-25): two a class, one a room; a room that
// calls for a knack the adventurer has is fought with the edge.
const crawl: GameConfig = {
  version: 1,
  packIds: ["dungeon"],
  limit: null,
  quest: "dungeon",
};
const seeded = (seed: number): Random => {
  seed = (Math.imul(seed, 2654435761) >>> 0) % 2147483646 || 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
};
const byId = (id: string) => cards.find((c) => c.id === id)!;
const classes = cards.filter((c) => c.id.startsWith("dungeon.class-"));
// A crawl on the Cellar with `adventurer` put aside and `room` face up.
const facing = (adventurer: string, room: string): SessionState => {
  const floors = [0.1, 0.1, 0.1, 0.1];
  let s = createSession(crawl, cards, packs, () =>
    floors.length ? floors.shift()! : 0.5,
  );
  const place = (s: SessionState, id: string, step: number) => {
    const finale = [...s.quest!.finale];
    const at = finale.indexOf(id);
    if (at >= 0) finale[at] = finale[step];
    finale[step] = id;
    return { ...s, quest: { ...s.quest!, finale } };
  };
  s = advance(advance(place(s, `dungeon.class-${adventurer}`, 0)));
  // The Cellar's first room.
  s = place(s, room, 3);
  s = {
    ...s,
    discarded: 3,
    quest: { ...s.quest!, step: 3 },
    previousId: s.quest!.finale[2],
  };
  return advance(s);
};

describe("knacks", () => {
  it("gives every real class two knacks and the joke classes none", () => {
    expect(classes).toHaveLength(18);
    for (const c of classes)
      expect(c.knacks ?? [], c.id).toHaveLength(
        JOKE_CLASSES.includes(c.id) ? 0 : 2,
      );
  });

  it("puts knacks only on fights, about eight a floor, every knack in use", () => {
    // Rolled rooms; strikes keep their own knacks (`strikeKnacks`).
    const rooms = cards.filter((c) => c.knack && c.battle);
    expect(rooms.length).toBe(Object.keys(roomKnacks).length);
    for (const c of rooms) expect(c.battle, c.id).toBe(true);
    const floors = new Map<string, number>();
    for (const c of rooms) {
      const floor = c.ribbon!.split(" · ")[0];
      floors.set(floor, (floors.get(floor) ?? 0) + 1);
    }
    expect(floors.size).toBe(9);
    for (const [floor, n] of floors) expect(n, floor).toBe(8);
    for (const k of KNACKS)
      expect(rooms.filter((c) => c.knack === k).length, k).toBeGreaterThan(9);
  });

  it("validates knacks", () => {
    const rogue = byId("dungeon.class-rogue");
    const trap = byId("dungeon.christmas-lights");
    expect(() => validateCatalog([rogue, trap], [])).not.toThrow();
    const bad = [
      { ...rogue, knacks: ["sneak", "charm", "magic"] },
      { ...rogue, knacks: ["sneak", "sneak"] },
      { ...rogue, knacks: ["stealth"] },
      { ...trap, knack: "stealth" },
      { ...byId("dungeon.lost-and-found"), knack: "sneak" },
    ];
    for (const c of bad)
      expect(() => validateCatalog([c as typeof rogue], [])).toThrow(
        "Invalid knack",
      );
  });

  it("rolls a knack's room with double the dice, for a class that has it", () => {
    // The Christmas lights call for Sneak: the Rogue has it.
    let s = facing("rogue", "dungeon.christmas-lights");
    expect(knackEdge(s.quest, currentCard(s))).toBe("sneak");
    expect(cardEdge(s.quest, currentCard(s))).toBe("advantage");
    s = rollDice(s, seeded(4));
    expect(s.roll).toMatchObject({ edge: "advantage" });
    expect(s.roll!.dropped).toHaveLength(1);
    expect(parseSession(JSON.stringify(s))).toEqual(s);
    // The Barbarian doesn't: one die, no edge.
    const b = rollDice(
      facing("barbarian", "dungeon.christmas-lights"),
      seeded(4),
    );
    expect(b.roll!.edge).toBeUndefined();
    // A room with no knack is fought as written.
    const plain = facing("rogue", "dungeon.keg-spider");
    expect(cardEdge(plain.quest, currentCard(plain))).toBeNull();
  });

  it("makes a knack's plaque fight cost a heart less, never more", () => {
    // The Séance calls for Faith: a Cleric has it, a Rogue doesn't.
    const seance = byId("dungeon.the-seance");
    expect(seance.dice).toBeUndefined();
    const cleric = facing("cleric", "dungeon.drunk-goblin");
    const rogue = facing("rogue", "dungeon.drunk-goblin");
    expect(verdictShift(cleric.quest, seance)).toBe(-1);
    expect(verdictShift(rogue.quest, seance)).toBe(0);
  });

  it("settles a strike by its knack: won with it, lost without, as written in the plain modes", () => {
    // The Skeleton Barback calls for Charm: a Rogue has it, a Wizard doesn't.
    const barback = byId("dungeon.skeleton-barback");
    expect(barback.strike).toBeDefined();
    expect(barback.knack).toBe("charm");
    let s = facing("rogue", barback.id);
    expect(strikeOutcome(s.quest, currentCard(s))).toBe("won");
    const hearts = s.quest!.party!.hearts;
    s = advance(s);
    expect(s.quest!.party!.hearts).toBe(hearts);
    let w = facing("wizard", barback.id);
    expect(strikeOutcome(w.quest, currentCard(w))).toBe("lost");
    const before = w.quest!.party!.hearts;
    w = advance(w);
    expect(w.quest!.party!.hearts).toBe(before - STRIKE_HURT[0]);
    expect(parseSession(JSON.stringify(w))).toEqual(w);
    // Outside a crawl a strike is neither won nor lost.
    expect(strikeOutcome(undefined, barback)).toBeNull();
    // Every strike knack names a strike, and none is a rolled room's too.
    for (const id of Object.keys(strikeKnacks)) {
      expect(byId(`dungeon.${id}`).strike, id).toBeDefined();
      expect(roomKnacks[id], id).toBeUndefined();
    }
  });

  // Sessions clone the deck, so this takes a few seconds beside the
  // other files; it has 30.
  it("brings about two knack fights to a run", () => {
    // Every room a run deals that calls for a knack its adventurer has (the
    // floors' rooms as dealt; a fork's loud door is ignored).
    const counts: number[] = [];
    for (let seed = 1; seed <= 300; seed++) {
      const s = createSession(crawl, cards, packs, seeded(seed));
      const q = s.quest!;
      const adventurer = finaleCard(q, q.finale[0])!;
      if (JOKE_CLASSES.includes(adventurer.id)) continue;
      counts.push(
        q.finale.filter((id) => {
          const c = finaleCard(q, id);
          return (
            !!c?.battle && !!c.knack && adventurer.knacks!.includes(c.knack)
          );
        }).length,
      );
    }
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const none = counts.filter((n) => n === 0).length / counts.length;
    console.log(
      `knacks: ${mean.toFixed(2)} knack fights a run; ${(none * 100).toFixed(0)}% of runs have none`,
    );
    expect(mean).toBeGreaterThan(1.5);
    expect(mean).toBeLessThan(2.5);
  }, 30_000);
});
