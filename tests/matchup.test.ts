import { describe, expect, it } from "vitest";
import {
  canUseLoot,
  cardMatchup,
  createSession,
  currentCard,
  hitsNeeded,
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

// The games' type chart (Gen 6 onward), transcribed from Pokémon Showdown's
// data (@pkmn/dex 0.10.11, Dex.forGen(9)) on 2026-10-25, after an owner
// report questioned Grass against Electric. Rows attack, columns defend, in
// this order: 2 super effective, h not very effective, 0 no effect.
const ORDER = [
  "normal",
  "fire",
  "water",
  "grass",
  "electric",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;
const CANON: Record<(typeof ORDER)[number], string> = {
  normal: "............h0..h.",
  fire: ".hh2.2.....2h.h.2.",
  water: ".2hh....2...2.h...",
  grass: ".h2h...h2h.h2.h.h.",
  electric: "..2hh...02....h...",
  ice: ".hh2.h..22....2.h.",
  fighting: "2....2.h.hhh20.22h",
  poison: "...2...hh...hh..02",
  ground: ".2.h2..2.0.h2...2.",
  flying: "...2h.2....2h...h.",
  psychic: "......22..h....0h.",
  bug: ".h.2..hh.h2..h.2hh",
  rock: ".2...2h.h2.2....h.",
  ghost: "0.........2..2.h..",
  dragon: "..............2.h0",
  dark: "......h...2..2.h.h",
  steel: ".hh.h2......2...h2",
  fairy: ".h....2h......22h.",
};

describe("type chart", () => {
  it("matches the games' chart in every one of its 324 cells", () => {
    const multiplier = { ".": 1, "2": 2, h: 0.5, "0": 0 } as const;
    for (const attack of ORDER)
      ORDER.forEach((defend, i) =>
        expect(effectiveness(attack, defend), `${attack} on ${defend}`).toBe(
          multiplier[CANON[attack][i] as keyof typeof multiplier],
        ),
      );
  });

  it("gives no edge for a resistance alone: Grass against Electric is even", () => {
    expect(effectiveness("grass", "electric")).toBe(1);
    expect(effectiveness("electric", "grass")).toBe(0.5);
    expect(matchup("grass", "electric").edge).toBeNull();
    // Fire against Dragon too: Dragon resists Fire, but hits it normally.
    expect(matchup("fire", "dragon").edge).toBeNull();
  });

  it("reads the games' chart", () => {
    expect(effectiveness("fire", "grass")).toBe(2);
    expect(effectiveness("fire", "water")).toBe(0.5);
    expect(effectiveness("electric", "ground")).toBe(0);
    expect(effectiveness("ghost", "normal")).toBe(0);
    expect(effectiveness("fairy", "dragon")).toBe(2);
    expect(effectiveness("steel", "fairy")).toBe(2);
  });

  it("gives the edge to whichever side is super effective (owner: simpler rules)", () => {
    expect(matchup("fire", "grass").edge).toBe("advantage");
    expect(matchup("fire", "water").edge).toBe("disadvantage");
    expect(matchup("water", "water").edge).toBeNull();
    expect(matchup("electric", "ground").edge).toBe("disadvantage");
    expect(matchup("electric", "flying").edge).toBe("advantage");
    // Normal deals nothing special, but Fighting hits it hard.
    expect(matchup("normal", "fighting").edge).toBe("disadvantage");
    // Neither can touch the other.
    expect(matchup("normal", "ghost").edge).toBeNull();
    // Both super effective on each other: even.
    expect(matchup("dragon", "dragon").edge).toBeNull();
    expect(matchup("ghost", "ghost").edge).toBeNull();
  });

  it("sends out the Striaton brother who beats the starter", () => {
    expect(matchup("fire", "trio")).toMatchObject({
      theirs: "water",
      edge: "disadvantage",
    });
    expect(matchup("water", "trio").theirs).toBe("grass");
    expect(matchup("grass", "trio").theirs).toBe("fire");
    // Nobody in the trio beats Electric; Cilan takes it least badly.
    expect(matchup("electric", "trio")).toMatchObject({
      theirs: "grass",
      edge: null,
    });
    // Nobody beats Normal: the first brother steps up, evenly matched.
    expect(matchup("normal", "trio")).toMatchObject({
      theirs: "fire",
      edge: null,
    });
  });

  it("lists what a type is strong and weak against", () => {
    const fire = typeEdges("fire");
    // Fairy too: Fire shrugs off its moves.
    expect(fire.strong).toEqual(["grass", "ice", "bug", "steel"]);
    expect(fire.weak).toEqual(["water", "ground", "rock"]);
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

  it("Marowak's Bonemerang speeds up big bosses but never skips a gym", () => {
    const s = facing("cubone", grass.id);
    s.quest!.party!.form = 1; // Marowak: bosses take 1 fewer hit
    expect(hitsNeeded(s.quest, grass)).toBe(1); // a gym: still one hit
    const champion = cards.find((c) =>
      c.id.startsWith("pokemon.league-champion-"),
    )!;
    expect(hitsNeeded(s.quest, champion)).toBe(champion.hits! - 1);
    // A lost gym battle is dealt again, not put aside as beaten.
    const gym = facing("cubone", plaques.id);
    gym.quest!.party!.form = 1;
    const lost = settleBattle(gym, false);
    expect(lost.quest!.step).toBe(gym.quest!.step);
  });

  it("rolls 2d6 with an edge as four dice, keeping the highest or lowest two", () => {
    // A 2d6 gym, against a starter its type beats and one that beats it.
    const pair = gyms.find((c) => c.dice?.count === 2 && c.dice.sides === 6)!;
    const starters = cards.filter((c) => c.id.startsWith("pokemon.starter-"));
    const edged = (edge: string) =>
      starters.find(
        (st) =>
          cardMatchup(facing(st.id.slice(16), pair.id).quest, pair)?.edge ===
          edge,
      )!;
    for (const edge of ["advantage", "disadvantage"] as const) {
      const who = edged(edge).id.replace("pokemon.starter-", "");
      for (let seed = 1; seed <= 40; seed++) {
        const roll = rollDice(facing(who, pair.id), seeded(seed)).roll!;
        expect(roll.edge).toBe(edge);
        expect(roll.values).toHaveLength(2);
        expect(roll.dropped).toHaveLength(2);
        // The two highest faces with the edge, the two lowest against it.
        const sorted = [...roll.values, ...roll.dropped!].sort((a, b) => a - b);
        expect([...roll.values].sort((a, b) => a - b)).toEqual(
          edge === "advantage" ? sorted.slice(2) : sorted.slice(0, 2),
        );
        validateRoll(roll, pair.dice);
      }
    }
  });
});
