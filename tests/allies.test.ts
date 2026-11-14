import { describe, expect, it } from "vitest";
import {
  advance,
  assistBonus,
  canSendIn,
  createSession,
  currentCard,
  partyTeam,
  sendIn,
  settleBattle,
  takeOffer,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice, rollTarget } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import type { GameConfig, SessionState } from "../src/game/types";

// Allies (The Quest 2.0 Phase 4, 2026-11-14): companions kept in
// `party.team` by the ID of the card that brought them, sent into a
// single-d20 fight of their calling for a bonus, dead for the run when
// that fight is lost, and dying in the party's place at zero hearts.
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
const STEP = { floor1: 4, landing1: 14, keeper: 18, floor2: 19 };
const party = (s: SessionState) => s.quest!.party!;
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
const rollTo = (s: SessionState, face: number) => {
  const sides = currentCard(s).dice!.sides;
  return returnToCard(rollDice(s, () => (face - 0.5) / sides));
};
/** A run whose side quest is `keeper`'s, at its second region's first
 * card, which is swapped for a single-d20 monster of that region (or the
 * card `id`), revealed, holding `team` (cards already dealt). */
function at(keeper: string, team: string[] = [], id?: string) {
  for (let seed = 1; ; seed++) {
    let s = createSession(crawl, cards, packs, seeded(seed));
    const q = s.quest!;
    if (q.finale[STEP.keeper] !== keeper) continue;
    const region = q.stages.find(
      (st) => st.pick === 8 && q.stages.indexOf(st) > 9,
    )!;
    const pick =
      id ??
      region.cards.find(
        (c) =>
          c.encounter === "monster" &&
          c.battle &&
          c.dice?.count === 1 &&
          c.dice.sides === 20 &&
          !c.dice.choice,
      )!.id;
    const finale = [...q.finale];
    const was = finale.indexOf(pick);
    if (was >= 0) finale[was] = finale[STEP.floor2];
    finale[STEP.floor2] = pick;
    s = {
      ...s,
      discarded: STEP.floor2,
      previousId: finale[STEP.floor2 - 1],
      quest: {
        ...q,
        finale,
        step: STEP.floor2,
        party: { ...q.party!, ...(team.length ? { team } : {}) },
      },
    };
    return advance(s);
  }
}
/** The first inn of a run, revealed. */
function inn() {
  const s = createSession(crawl, cards, packs, seeded(1));
  return advance({
    ...s,
    discarded: STEP.landing1,
    previousId: s.quest!.finale[STEP.landing1 - 1],
    quest: { ...s.quest!, step: STEP.landing1 },
  });
}
const PIP = "dungeon.big-mike";
const DURLA = "dungeon.the-undefeated";

describe("allies", () => {
  it("a keeper's fall brings its ally and a dragon lore", () => {
    const s = createSession(crawl, cards, packs, seeded(2));
    const keeper = cards.find((c) => c.id === PIP)!;
    expect(keeper.ally).toMatchObject({ name: "Pip the Cabin Boy", bonus: 3 });
    expect(keeper.reward).toEqual({ lore: true });
    void s;
  });

  it("is sent into a fight of its calling for its bonus, never another kind", () => {
    let s = at(PIP, [PIP]);
    expect(currentCard(s).encounter).toBe("monster");
    expect(partyTeam(s.quest).map((m) => m.title)).toEqual([
      "Pip the Cabin Boy",
    ]);
    expect(canSendIn(s, PIP)).toBe(true);
    const base = rollTarget(s, currentCard(s))!.target;
    s = sendIn(s, PIP);
    expect(party(s).assist).toBe(PIP);
    expect(rollTarget(s, currentCard(s))!.target).toBe(base - 3);
    expect(assistBonus(partyTeam(s.quest)[0])).toBe(3);
    roundTrip(s);
    // A boss ally is not sent into a monster.
    const durla = at(DURLA, [DURLA]);
    expect(canSendIn(durla, DURLA)).toBe(false);
  });

  it("stays after a win and dies for the run after a loss", () => {
    const s = sendIn(at(PIP, [PIP]), PIP);
    const won = advance(rollTo(s, 19));
    expect(party(won).team).toEqual([PIP]);
    const lost = advance(rollTo(s, 2));
    expect(party(lost).team).toBeUndefined();
    expect(party(lost).fainted).toBe(PIP);
    roundTrip(lost);
  });

  it("dies in the party's place when the hearts run out (after a Phoenix Feather)", () => {
    const blade = (s: SessionState) => s.quest!.finale[STEP.landing1];
    const s = at(PIP);
    s.quest!.party!.team = [PIP, blade(s)];
    s.quest!.party!.hearts = 1;
    const saved = advance(rollTo(s, 2));
    expect(saved.phase).not.toBe("complete");
    expect(party(saved)).toMatchObject({
      hearts: 1,
      team: [blade(s)],
      fainted: PIP,
    });
    roundTrip(saved);
    // A feather first.
    s.quest!.party!.loot = ["revive"];
    const feather = advance(rollTo(s, 2));
    expect(party(feather).team).toEqual([PIP, blade(s)]);
    expect(party(feather).loot).toEqual([]);
  });

  it("the first inn hires a blade for drinks", () => {
    const s0 = inn();
    const id = s0.quest!.finale[STEP.landing1];
    const hire = currentCard(s0).offers!.findIndex((o) => o.recruit);
    expect(hire).toBe(2);
    const hearts = party(s0).hearts;
    const s = takeOffer(s0, hire);
    expect(party(s)).toMatchObject({
      team: [id],
      hearts,
    });
    expect(partyTeam(s.quest)[0].title).toBe("A Hired Blade");
    roundTrip(s);
  });

  it("the League's team is untouched: a Pokémon still needs its type", () => {
    const bad = at(PIP, [PIP]);
    bad.quest!.party!.team = [bad.quest!.finale[STEP.floor1]];
    expect(() => parseSession(JSON.stringify(bad))).toThrow();
    void settleBattle;
  });
});
