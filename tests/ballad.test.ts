import { describe, expect, it } from "vitest";
import {
  BALLAD_WIDTH,
  advance,
  ballad,
  createSession,
  currentCard,
  runNames,
  settleBattle,
  singleBlow,
  type Random,
} from "../src/game/engine";
import { BALLAD_FOOLS } from "../src/game/ballad";
import { returnToCard, rollDice } from "../src/game/dice";
import { cards, packs } from "../src/content/catalog";
import { JOKE_CLASSES, classes } from "../src/content/dungeon/classes";
import { lairs } from "../src/content/dungeon/dragons";
import { DRAGON_HEALTH } from "../src/content/dungeon/shared";
import type { GameConfig, SessionState } from "../src/game/types";
import { takeRoads } from "./roads";

// The ballad (The Quest 2.0 Phase 3, 2026-11-14): the end screen's verse.
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
// With both roads taken (The Quest 2.0 Phase 5).
const CLOSING = 40;
const BOSS1 = 13;
const BOSS2 = 29;
const rollTo = (s: SessionState, face: number) => {
  const sides = currentCard(s).dice!.sides;
  return returnToCard(rollDice(s, () => (face - 0.5) / sides));
};
const fight = (s: SessionState, face: number, random = seeded(7)) =>
  advance(rollTo(advance(s), face), random);

/** A run with its adventurer put aside as `cls`, both region bosses put
 * aside, at the Lair's Door with `hearts`. */
function atDoor(seed = 1, hearts = 30, cls = "dungeon.class-barbarian") {
  let s = takeRoads(createSession(crawl, cards, packs, seeded(seed)));
  const q = s.quest!;
  const finale = [...q.finale];
  const was = finale.indexOf(cls);
  if (was >= 0) finale[was] = finale[0];
  finale[0] = cls;
  finale[CLOSING] = "dungeon.closing-last-table";
  s = advance(advance({ ...s, quest: { ...q, finale } }), seeded(seed));
  return {
    ...s,
    discarded: CLOSING,
    previousId: s.quest!.finale[CLOSING - 1],
    quest: {
      ...s.quest!,
      step: CLOSING,
      party: { ...s.quest!.party!, hits: 0, max: hearts, hearts },
    },
  };
}
/** Felled at the door with one natural 20, then the dragon struck with
 * `faces` until the run ends. */
function play(s: SessionState, faces: number[]) {
  if (s.quest!.step === CLOSING) s = fight(s, 20);
  for (const face of faces) {
    if (s.phase === "complete") break;
    // The enrage contest has no die: it is won (a high face) or lost.
    s = currentCard(advance(s)).dice
      ? fight(s, face)
      : settleBattle(advance(s), face > 10, seeded(face));
  }
  return s;
}

describe("the ballad", () => {
  it("is empty until a Quest ends", () => {
    expect(ballad(atDoor())).toEqual([]);
  });

  it("sings a win: who set out, the bosses felled, and the dragon slain", () => {
    const s = play(atDoor(1, 30), Array(DRAGON_HEALTH + 2).fill(15));
    expect(s.phase).toBe("complete");
    const lines = ballad(s);
    const { dragon } = runNames(s.quest!);
    const q = s.quest!;
    const title = (i: number) =>
      q.stages
        .flatMap((st) => st.cards)
        .find((c) => c.id === q.finale[i])!
        .title.replace(/^The /, "the ");
    expect(lines[0]).toMatch(/^A Barbarian (left by|took) the /);
    expect(lines.join(" ")).toContain(title(BOSS1));
    expect(lines.join(" ")).toContain(title(BOSS2));
    expect(lines.at(-1)).toMatch(
      new RegExp(
        `^and slew ${dragon}(,| with) \\d+ (hearts )?(to spare|left)\\.$`,
      ),
    );
    expect(singleBlow(s)).toBe(false);
  });

  it("a natural 20 on the last swing is a single blow", () => {
    const s = fight(atDoor(2, 30), 20);
    s.quest!.party!.hits = DRAGON_HEALTH - 1;
    s.quest!.party!.duel = { move: 0, swings: 3, enraged: true };
    const won = play(s, [20]);
    expect(won.phase).toBe("complete");
    expect(singleBlow(won)).toBe(true);
    expect(ballad(won).at(-1)).toMatch(/single blow\.$|in one blow\.$/);
  });

  it("a fool's win was foretold; one heart left is by a thread", () => {
    const fool = play(
      atDoor(3, 30, "dungeon.class-intern"),
      Array(DRAGON_HEALTH + 2).fill(15),
    );
    expect(ballad(fool).at(-1)).toMatch(/^and the fool slew /);
    const thin = fight(atDoor(4, 30), 20);
    thin.quest!.party!.hits = DRAGON_HEALTH - 1;
    thin.quest!.party!.duel = { move: 0, swings: 3, enraged: true };
    thin.quest!.party!.hearts = 1;
    // A swing that wins on the last heart keeps it.
    const won = play(thin, [15]);
    expect(won.quest!.party!.hearts).toBe(1);
    expect(ballad(won).at(-1)).toMatch(/by a thread\.$/);
  });

  it("a wipe at the dragon leaves it sleeping; a wipe before never saw the lair", () => {
    const lost = atDoor(5, 2);
    const at = play(lost, [2, 2, 2, 2, 2]);
    expect(at.quest!.party!.wiped).toBe(true);
    const { dragon, lair } = runNames(at.quest!);
    expect(ballad(at).at(-1)).toMatch(
      new RegExp(`^and ${dragon} sleeps on( under ${lair})?\\.$`),
    );
    // Wiped at the door.
    const door = atDoor(6, 1);
    const early = fight(door, 2);
    expect(early.quest!.party!.wiped).toBe(true);
    expect(ballad(early).at(-1)).toBe(
      `and never saw ${lair && runNames(early.quest!).lair}.`,
    );
  });

  it("every line fits at table distance with the longest names", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const cls = classes[seed % classes.length].id;
      const s = play(atDoor(seed, 30, cls), Array(DRAGON_HEALTH + 2).fill(15));
      for (const line of ballad(s))
        expect(line.length, line).toBeLessThanOrEqual(BALLAD_WIDTH);
    }
    // Every dragon's ending with two hearts and with a two-digit count.
    for (const d of Object.values(lairs).flat())
      for (const n of [2, 12])
        expect(
          [
            `and slew ${d.title} with ${n} hearts to spare.`,
            `and slew ${d.title}, ${n} hearts left.`,
            `and slew ${d.title}, ${n} to spare.`,
          ].some((l) => l.length <= BALLAD_WIDTH),
        ).toBe(true);
  });

  it("knows the same fools as the content", () => {
    expect(BALLAD_FOOLS).toEqual(JOKE_CLASSES);
  });
});
