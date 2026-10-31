import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  cards as allCards,
  packs,
  validateCatalog,
} from "../src/content/catalog";
import { starters } from "../src/content/league/starters";
import { leagueTypes } from "../src/content/league/types";
import { gymType, pokemonTypes } from "../src/presentation/pokemon-types";
import { crawlTheme } from "../src/components/crawlTheme";
import { POKEMON_TYPES, type PokemonType } from "../src/game/types";

const pack = packs.find((p) => p.id === "pokemon")!;
const leagueIds = new Set(JSON.stringify(pack.quest).match(/pokemon\.[\w-]+/g));
const league = allCards.filter((c) => leagueIds.has(c.id));

describe("League type marks", () => {
  it("draws a mark for every type", () => {
    for (const type of Object.keys(pokemonTypes) as PokemonType[])
      expect(existsSync(`public/art/league/types/${type}.svg`), type).toBe(
        true,
      );
    expect(Object.keys(pokemonTypes).sort()).toEqual([...POKEMON_TYPES].sort());
  });

  it("gives every gym a type, and the old saves' badge fallback agrees", () => {
    // Leaders carry the quest tag; the board sheet's plain "Gym Battle" card
    // does not.
    const gyms = allCards.filter((c) => c.quest === "pokemon");
    expect(gyms.length).toBe(72);
    for (const gym of gyms) {
      expect(gym.type, gym.id).toBeDefined();
      expect(gymType(gym.id), gym.id).toBe(gym.type);
    }
  });

  it("gives every starter and every form one type", () => {
    for (const starter of starters) {
      expect(starter.type, starter.title).toBeDefined();
      for (const e of starter.evolves ?? [])
        expect(e.type ?? starter.type, e.title).toBeDefined();
    }
    // Only Eevee's branches change type.
    const changes = starters.flatMap((s) =>
      (s.evolves ?? []).filter((e) => e.type).map((e) => e.title),
    );
    expect(changes).toEqual(["Vaporeon", "Jolteon", "Flareon"]);
  });

  it("keeps the starters' types balanced (owner, 2026-10-25)", () => {
    const count: Partial<Record<PokemonType, number>> = {};
    for (const s of starters) count[s.type!] = (count[s.type!] ?? 0) + 1;
    // Every type has a starter; the canon trios keep their numbers.
    expect(Object.keys(count).sort()).toEqual(
      POKEMON_TYPES.filter((t) => t !== "trio").sort(),
    );
    expect(count).toMatchObject({ fire: 6, grass: 6, water: 7, normal: 2 });
    expect(starters).toHaveLength(35);
  });

  it("types only League cards, and only fights, starters and catches", () => {
    for (const c of allCards.filter((c) => c.type)) {
      expect(leagueIds.has(c.id), c.id).toBe(true);
      // A catch card's Pokémon joins the team with its type (2026-10-25).
      expect(
        !!c.battle ||
          !!c.strike ||
          c.encounter === "omen" ||
          !!c.offers?.some((o) => o.catch),
        c.id,
      ).toBe(true);
    }
    for (const id of Object.keys(leagueTypes))
      expect(
        league.some((c) => c.id === id),
        id,
      ).toBe(true);
  });

  it("leaves untyped only the fights with no Pokémon type to read", () => {
    // A new League fight must be typed in `league/types.ts` or added here
    // with the reason it has none.
    const untyped = league
      .filter((c) => (c.battle || c.strike) && !c.type)
      .map((c) => c.id.replace("pokemon.", ""))
      .sort();
    expect(untyped).toEqual(
      [
        // Three types at once.
        "legendary-beasts",
        "legendary-regi-trio",
        // Hazards and finds.
        "route-ledge",
        "route-mystery-egg",
        "route-slots",
        "route-safari",
        "route-silph-scope",
        "route-silph-maze",
        "route-seafoam",
        "route-missingno",
        "route-waterfall",
        "route-mew-truck",
        "route-boulder-puzzle",
        // Trainers whose card names no Pokémon, of no one type.
        "route-picnicker",
        "route-ace-lass",
        "route-ace-twins",
        "route-ace-rocket-recruiter",
        "route-ace-cooltrainer",
        "route-ace-gambler",
        "route-beauty",
        "route-sage",
        "route-ace-burglar",
        "route-ninja-boy",
        "route-pokemaniac",
        "route-ace-elite-reject",
        "route-veteran-victory",
        "route-ace-victory-1",
        "route-ace-victory-2",
      ].sort(),
    );
  });

  it("refuses a type that isn't one, or on a card that isn't a fight", () => {
    const misty = allCards.find((c) => c.id === "pokemon.gym-misty")!;
    const check = (c: object) => () =>
      validateCatalog(
        allCards.map((x) => (x.id === misty.id ? { ...misty, ...c } : x)),
        packs,
      );
    expect(check({})).not.toThrow();
    expect(check({ type: "sound" })).toThrow("Invalid type");
    expect(check({ battle: undefined, type: "water" })).toThrow();
  });

  it("shuts the badge case on the card that asks for them from memory", () => {
    const lock = crawlTheme("pokemon").badgeLock!;
    for (const id of lock.cards)
      expect(
        allCards.some((c) => c.id === id),
        id,
      ).toBe(true);
    expect(crawlTheme("dungeon").badgeLock).toBeUndefined();
  });
});
