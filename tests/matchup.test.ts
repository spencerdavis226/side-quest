import { describe, expect, it } from "vitest";
import {
  canUseLoot,
  cardMatchup,
  createSession,
  currentCard,
  settleBattle,
  spendLoot,
  type Random,
} from "../src/game/engine";
import { readTotal, rollDice, rollWins, validateRoll } from "../src/game/dice";
import {
  effectiveness,
  matchup,
  teraType,
  typeEdges,
} from "../src/game/matchup";
import { cards, packs } from "../src/content/catalog";
import type {
  CardDefinition,
  DiceRoll,
  GameConfig,
  SessionState,
} from "../src/game/types";

// Pokémon League type matchups (owner, 2026-10-25).
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

/** A League run with `starter` put aside and `target` face up. */
function facing(starter: string, target: string, seed = 1): SessionState {
  const s = createSession(league, cards, packs, seeded(seed));
  const q = structuredClone(s.quest!);
  let offset = 0;
  for (const stage of q.stages) {
    if (stage.cards.some((c) => c.id === target)) break;
    offset += stage.pick;
  }
  q.finale[offset] = target;
  q.step = offset;
  q.due = true;
  q.party!.omen = `pokemon.starter-${starter}`;
  return { ...s, quest: q, phase: "revealed", roll: null };
}
const rank = (card: CardDefinition, values: number[], roll: DiceRoll) =>
  (rollWins(card.dice!, values, roll) ? 1000 : 0) +
  readTotal(card.dice!, values, roll);

describe("type chart", () => {
  it("reads the games' chart", () => {
    expect(effectiveness("fire", "grass")).toBe(2);
    expect(effectiveness("fire", "water")).toBe(0.5);
    expect(effectiveness("electric", "ground")).toBe(0);
    expect(effectiveness("ghost", "normal")).toBe(0);
    expect(effectiveness("fairy", "dragon")).toBe(2);
    expect(effectiveness("steel", "fairy")).toBe(2);
  });

  it("gives the edge to whoever hits the other harder", () => {
    expect(matchup("fire", "grass").edge).toBe("advantage");
    expect(matchup("fire", "water").edge).toBe("disadvantage");
    expect(matchup("water", "water").edge).toBeNull();
    expect(matchup("electric", "ground").edge).toBe("disadvantage");
    expect(matchup("electric", "flying").edge).toBe("advantage");
    // Normal deals nothing special, but Fighting hits it hard.
    expect(matchup("normal", "fighting").edge).toBe("disadvantage");
    // Neither can touch the other.
    expect(matchup("normal", "ghost").edge).toBeNull();
  });

  it("sends out the Striaton brother who beats the starter", () => {
    expect(matchup("fire", "trio")).toMatchObject({
      theirs: "water",
      edge: "disadvantage",
    });
    expect(matchup("water", "trio").theirs).toBe("grass");
    expect(matchup("grass", "trio").theirs).toBe("fire");
    expect(matchup("electric", "trio").theirs).toBe("grass");
    // Nobody beats Normal: the first brother steps up, evenly matched.
    expect(matchup("normal", "trio")).toMatchObject({
      theirs: "fire",
      edge: null,
    });
  });

  it("lists what a type is strong and weak against", () => {
    const fire = typeEdges("fire");
    // Fairy too: Fire shrugs off its moves.
    expect(fire.strong).toEqual(["grass", "ice", "bug", "steel", "fairy"]);
    expect(fire.weak).toEqual(["water", "ground", "rock", "dragon"]);
    expect(typeEdges("normal").strong).toEqual([]);
  });
});

describe("type edge in a League run", () => {
  // A d20 Grass gym, a d20 Water gym, and a plaque-settled one.
  const gyms = cards.filter((c) => c.quest === "pokemon");
  const d20 = (type: string) =>
    gyms.find(
      (c) => c.type === type && c.dice?.count === 1 && c.dice.sides === 20,
    )!;
  const grass = d20("grass");
  const water = d20("water");
  const plaques = gyms.find((c) => c.type === "water" && !c.dice)!;

  it("rolls twice and keeps the better against a type it beats", () => {
    let swapped = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const s = rollDice(facing("charmander", grass.id), seeded(seed));
      expect(cardMatchup(s.quest, currentCard(s))?.edge).toBe("advantage");
      const roll = s.roll!;
      expect(roll.edge).toBe("advantage");
      expect(roll.dropped).toHaveLength(1);
      const dropped = { ...roll, natural: undefined };
      expect(rank(grass, roll.values, roll)).toBeGreaterThanOrEqual(
        rank(grass, roll.dropped!, dropped),
      );
      if (roll.dropped![0] !== roll.values[0]) swapped++;
      validateRoll(roll, grass.dice);
    }
    expect(swapped).toBeGreaterThan(40);
  });

  it("keeps the worse against a type that beats it", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const s = rollDice(facing("charmander", water.id), seeded(seed));
      const roll = s.roll!;
      expect(roll.edge).toBe("disadvantage");
      expect(rank(water, roll.values, roll)).toBeLessThanOrEqual(
        rank(water, roll.dropped!, { ...roll, natural: undefined }),
      );
    }
  });

  it("rolls once when evenly matched", () => {
    const s = rollDice(facing("squirtle", water.id), seeded(3));
    expect(s.roll!.edge).toBeUndefined();
    expect(s.roll!.dropped).toBeUndefined();
  });

  it("follows an Eevee into the type it picks", () => {
    const s = facing("eevee", grass.id);
    expect(cardMatchup(s.quest, grass)?.edge).toBeNull();
    // Flareon, the third branch.
    const flareon = {
      ...s,
      quest: { ...s.quest!, party: { ...s.quest!.party!, form: 3 } },
    };
    expect(cardMatchup(flareon.quest, grass)?.edge).toBe("advantage");
  });

  it("moves a plaque-settled loss by one HP", () => {
    const hearts = (starter: string) => {
      const s = facing(starter, plaques.id);
      return (
        s.quest!.party!.hearts - settleBattle(s, false).quest!.party!.hearts
      );
    };
    const even = hearts("squirtle");
    expect(hearts("bulbasaur")).toBe(Math.max(0, even - 1));
    expect(hearts("cyndaquil")).toBe(even + 1);
  });

  it("checks an edged roll when a save loads", () => {
    const s = rollDice(facing("charmander", grass.id), seeded(7));
    const loaded = JSON.parse(JSON.stringify(s.roll)) as DiceRoll;
    expect(() => validateRoll(loaded, grass.dice)).not.toThrow();
    expect(() =>
      validateRoll({ ...loaded, dropped: [21] }, grass.dice),
    ).toThrow();
    expect(() =>
      validateRoll({ ...loaded, edge: undefined }, grass.dice),
    ).toThrow();
  });

  it("leaves a run saved before types alone", () => {
    const s = facing("charmander", grass.id);
    const old = structuredClone(s);
    for (const stage of old.quest!.stages)
      for (const c of stage.cards) delete c.type;
    expect(cardMatchup(old.quest, currentCard(old))).toBeNull();
    expect(rollDice(old, seeded(2)).roll!.edge).toBeUndefined();
  });

  it("a Tera Orb takes the type that beats the foe, for one fight", () => {
    expect(teraType("water")).toBe("grass");
    expect(teraType("normal")).toBe("fighting");
    expect(teraType("dragon")).toBe("fairy");
    expect(teraType("ghost")).toBe("dark");
    // Charmander against a Water gym: not very effective, until the orb.
    let s = facing("charmander", water.id);
    s.quest!.party!.loot = ["tera"];
    expect(canUseLoot(s, "tera")).toBe(true);
    s = spendLoot(s, "tera");
    expect(s.quest!.party!.loot).toEqual([]);
    expect(cardMatchup(s.quest, water)).toMatchObject({
      mine: "grass",
      edge: "advantage",
      tera: true,
    });
    expect(
      canUseLoot(
        {
          ...s,
          quest: { ...s.quest!, party: { ...s.quest!.party!, loot: ["tera"] } },
        },
        "tera",
      ),
    ).toBe(false);
    const rolled = rollDice(s, seeded(4));
    expect(rolled.roll!.edge).toBe("advantage");
    // Not on a fight the starter already wins on type, nor after the roll.
    const grassy = facing("charmander", grass.id);
    grassy.quest!.party!.loot = ["tera"];
    expect(canUseLoot(grassy, "tera")).toBe(false);
    rolled.quest!.party!.loot = ["tera"];
    expect(canUseLoot(rolled, "tera")).toBe(false);
  });

  it("a Tera Orb ends when the fight is put aside", () => {
    let s = facing("charmander", plaques.id);
    s.quest!.party!.loot = ["tera"];
    s = spendLoot(s, "tera");
    expect(s.quest!.party!.tera).toBe(plaques.id);
    const after = settleBattle(s, false);
    expect(after.quest!.party!.tera).toBeUndefined();
  });
});
