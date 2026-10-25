import { describe, expect, it } from "vitest";
import {
  advance,
  canUseLoot,
  createSession,
  currentCard,
  omenForm,
  spendLoot,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import { starters } from "../src/content/league/starters";
import { TEAM_HP } from "../src/content/league/journey";
import {
  describeChange,
  describeOmen,
  leagueOmenWords,
} from "../src/game/omenText";
import { crawlTheme } from "../src/components/crawlTheme";
import type { GameConfig, SessionState } from "../src/game/types";

// The starter pass (owner, 2026-10-17): every starter its own power, every
// evolution a change the banner can name, written from the numbers.
const league: GameConfig = {
  version: 1,
  packIds: ["pokemon"],
  limit: null,
  quest: "pokemon",
};
const zero: Random = () => 0;
/** A League run whose starter is `id`, put aside, with `room` next. */
function withStarter(id: string, room?: string) {
  let s = createSession(league, cards, packs, () => 0.5);
  s.quest!.finale[0] = `pokemon.starter-${id}`;
  if (room) {
    // Swap it in, so the run's picks stay a valid save.
    const at = s.quest!.finale.indexOf(room);
    if (at >= 0) s.quest!.finale[at] = s.quest!.finale[1];
    s.quest!.finale[1] = room;
  }
  s = advance(advance(s, zero), zero);
  expect(s.quest!.party!.omen).toBe(`pokemon.starter-${id}`);
  return s;
}
const party = (s: SessionState) => s.quest!.party!;

describe("League starters", () => {
  it("each has its own power, and every evolution changes something", () => {
    const seen = new Set<string>();
    for (const c of starters) {
      const line = JSON.stringify([
        c.omen,
        ...(c.evolves ?? []).map((e) => e.omen),
      ]);
      expect(seen.has(line), c.id).toBe(false);
      seen.add(line);
      expect(c.rules).toContain(
        describeOmen(c.omen!, leagueOmenWords, TEAM_HP),
      );
      c.evolves?.forEach((e, i) => {
        const before = c.branches || i === 0 ? c.omen! : c.evolves![i - 1].omen;
        expect(
          describeChange(before, e.omen, leagueOmenWords, TEAM_HP),
          e.title,
        ).not.toBe("");
        expect(e.rules).toBe(
          describeOmen(e.omen, leagueOmenWords, TEAM_HP, false),
        );
      });
    }
    expect(seen.size).toBe(35);
  });

  it("writes powers in the League theme's own item names", () => {
    const theme = crawlTheme("pokemon");
    expect(theme.omenWords).toBe(leagueOmenWords);
    for (const [item, { name }] of Object.entries(theme.loot))
      expect(leagueOmenWords.items[item as keyof typeof theme.loot][0]).toBe(
        name,
      );
    expect(
      describeChange(
        { hearts: -2, heal: 1 },
        { heal: 1, loot: ["draught"] },
        leagueOmenWords,
        17,
      ),
    ).toBe("Max HP 15 → 17. Gets a Potion.");
  });

  it("a Rare Candy evolves the starter from the bag", () => {
    let s = withStarter("froakie");
    expect(party(s).loot).toEqual(["candy"]);
    expect(canUseLoot(s, "candy")).toBe(true);
    s = spendLoot(s, "candy");
    expect(omenForm(s.quest)!.title).toBe("Frogadier");
    expect(party(s)).toMatchObject({ form: 1, max: 16, loot: ["smoke"] });
    expect(parseSession(JSON.stringify(s))).toEqual(s);
    // Eevee picks its form on an evolution card, never from a candy.
    const eevee = withStarter("eevee");
    eevee.quest!.party!.loot = ["candy"];
    expect(canUseLoot(eevee, "candy")).toBe(false);
    // A fully evolved starter can't eat one either.
    s.quest!.party!.form = 2;
    s.quest!.party!.loot = ["candy"];
    expect(canUseLoot(s, "candy")).toBe(false);
  });

  it("a Revive saves a white-out once, at half the maximum", () => {
    let s = withStarter("bulbasaur", "pokemon.route-rattata");
    Object.assign(s.quest!.party!, { hearts: 1, loot: ["revive"] });
    s = advance(s, zero);
    expect(currentCard(s).id).toBe("pokemon.route-rattata");
    s = advance(returnToCard(rollDice(s, zero)), zero);
    expect(s.phase).not.toBe("complete");
    expect(party(s)).toMatchObject({
      hearts: Math.ceil(party(s).max / 2),
      loot: [],
      wiped: false,
    });
    expect(party(s).hearts).toBe(8); // Bulbasaur's 15, halved
    // Confused (a sealed bag) keeps the Revive shut.
    let hexed = withStarter("bulbasaur", "pokemon.route-rattata");
    Object.assign(hexed.quest!.party!, {
      hearts: 1,
      loot: ["revive"],
      curse: "hex",
    });
    hexed = advance(returnToCard(rollDice(advance(hexed, zero), zero)), zero);
    expect(party(hexed).wiped).toBe(true);
  });

  it("reads a roll through the starter: bonus, natural range, a flinch", () => {
    // A face as a random draw: 1 + floor(r × 20).
    const face =
      (n: number): Random =>
      () =>
        (n - 1) / 20 + 0.001;
    const fight = (id: string, faces: number[]) => {
      const draws = faces.map(face);
      let s = withStarter(id, "pokemon.route-rattata");
      s = advance(s, zero);
      return rollDice(s, () => draws.shift()!());
    };
    // Pikachu: +1 to every roll, and a 19 is a natural 20.
    let s = fight("pikachu", [19]);
    expect(s.roll).toMatchObject({ values: [19], bonus: 1, natural: 20 });
    expect(s.roll!.instruction).toMatch(/^Natural 20! /);
    // A bonus never makes a natural: an 18 + 1 reads as 19.
    s = fight("pikachu", [18]);
    expect(s.roll).toMatchObject({ values: [18], bonus: 1 });
    expect(s.roll!.natural).toBeUndefined();
    expect(s.roll!.instruction).not.toMatch(/^Natural/);
    // Bidoof flinches at a 20 and rolls again.
    s = fight("bidoof", [20, 20, 7]);
    expect(s.roll).toMatchObject({ values: [7], flinched: true });
    // The reading survives a save.
    expect(parseSession(JSON.stringify(s))).toEqual(s);
  });

  it("restocks the starter's item when a gym falls", () => {
    let s = withStarter("cyndaquil");
    s.quest!.party!.form = 2; // Typhlosion: a fresh X Attack at every gym
    s.quest!.party!.loot = [];
    // Brock, the first gym, rolled at a 20.
    const gym = s.quest!.finale.findIndex((id) =>
      id.startsWith("pokemon.gym-"),
    );
    s.quest!.finale[gym] = "pokemon.gym-brock";
    s.quest!.step = gym;
    s = advance(s, zero);
    expect(currentCard(s).id).toBe("pokemon.gym-brock");
    s = advance(returnToCard(rollDice(s, () => 0.999)), zero);
    expect(party(s).loot).toEqual(["die"]);
  });
});
