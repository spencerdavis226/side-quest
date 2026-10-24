import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cards as allCards } from "../src/content/catalog";
import { starters } from "../src/content/league/starters";
import {
  formType,
  gymType,
  pokemonTypes,
  type PokemonType,
} from "../src/presentation/pokemon-types";
import { crawlTheme } from "../src/components/crawlTheme";

describe("League type marks", () => {
  it("draws a mark for every type", () => {
    for (const type of Object.keys(pokemonTypes) as PokemonType[])
      expect(existsSync(`public/art/league/types/${type}.svg`), type).toBe(
        true,
      );
  });

  it("gives every gym a type, so every badge has its own mark", () => {
    // Leaders carry the quest tag; the board sheet's plain "Gym Battle" card
    // does not.
    const gyms = allCards.filter((c) => c.quest === "pokemon");
    expect(gyms.length).toBe(72);
    for (const gym of gyms) expect(gymType(gym.id), gym.id).toBeDefined();
  });

  it("gives every starter and every form a type", () => {
    for (const starter of starters)
      for (const title of [
        starter.title,
        ...(starter.evolves ?? []).map((e) => e.title),
      ])
        expect(formType(title), title).toBeDefined();
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
