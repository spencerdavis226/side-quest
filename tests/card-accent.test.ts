import { describe, expect, it } from "vitest";
import {
  createSession,
  currentCard,
  finaleStage,
  type Random,
} from "../src/game/engine";
import { cards, packs } from "../src/content/catalog";
import type { SessionState } from "../src/game/types";
import {
  cardAccent,
  ownAccent,
  SCENE_ACCENTS,
} from "../src/components/cardAccent";
import { crawlScene } from "../src/components/crawlTheme";
import { RIVAL_COLOURS } from "../src/presentation/rival-colors";
import { pokemonTypes } from "../src/presentation/pokemon-types";

// Card accents (2026-11-15): the title band's colour comes from the card
// and its place in the run, never from anything saved.
const seeded = (seed: number): Random => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};
const card = (id: string) => cards.find((c) => c.id === id)!;
const quest = (pack: "dungeon" | "pokemon", seed = 1) =>
  createSession(
    { version: 1, packIds: [pack], limit: null, quest: pack },
    cards,
    packs,
    seeded(seed),
  );
const at = (s: SessionState, step: number): SessionState => ({
  ...s,
  discarded: step,
  quest: { ...s.quest!, step },
});

describe("card accents", () => {
  it("colours a League fight by its type and a dragon by its own colours", () => {
    const blaine = ownAccent(card("pokemon.gym-blaine"));
    expect(blaine).toMatchObject({
      light: pokemonTypes.fire.light,
      deep: pokemonTypes.fire.deep,
      source: "type-fire",
    });
    expect(ownAccent(card("dungeon.last-call-lich"))?.source).toBe("dragon");
  });

  it("leaves a plain game's cards on the frame's teal", () => {
    const s = createSession(
      { version: 1, packIds: ["core"], limit: 50 },
      cards,
      packs,
      seeded(3),
    );
    expect(cardAccent(s, currentCard(s))).toBeNull();
  });

  it("gives every Quest stage past the King's Road its place's colour", () => {
    const s = quest("dungeon");
    const seen = new Set<string>();
    for (let step = 0; step < s.quest!.finale.length; step++) {
      const here = at(s, step);
      const scene = crawlScene(here);
      const accent = cardAccent(here, currentCard(here));
      if (accent?.source === "dragon" || accent?.source.startsWith("type-"))
        continue;
      if (!scene || !(scene in SCENE_ACCENTS)) {
        expect(accent, finaleStage(here.quest!).label).toBeNull();
        continue;
      }
      expect(accent?.source).toBe(`scene-${scene}`);
      seen.add(scene);
    }
    // Three regions, an inn and the lair at least.
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });

  it("wears the rival's colour while they cut in", () => {
    const s = at(quest("dungeon"), 6);
    const withRival: SessionState = {
      ...s,
      quest: {
        ...s.quest!,
        party: {
          ...s.quest!.party!,
          rival: { who: "mirabel", took: [], won: 0, lost: 0, cut: "meddle" },
        },
      },
    };
    expect(cardAccent(withRival, currentCard(withRival))).toMatchObject({
      light: RIVAL_COLOURS.mirabel.light,
      source: "rival-mirabel",
    });
  });
});
