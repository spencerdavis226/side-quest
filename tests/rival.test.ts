import { describe, expect, it } from "vitest";
import {
  advance,
  awaitingPress,
  BALLAD_WIDTH,
  cardEdge,
  cashOut,
  createSession,
  currentCard,
  finaleCard,
  finaleStage,
  RIVAL_CAP,
  RIVAL_GAP,
  rivalCut,
  rivalLine,
  rivalProfile,
  sendIn,
  settleBattle,
  takeOffer,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import { rivals } from "../src/content/dungeon/rivals";
import { RIVAL_NEED } from "../src/content/dungeon/shared";
import type {
  CardDefinition,
  GameConfig,
  Loot,
  PartyState,
  SessionState,
} from "../src/game/types";
import { takeRoads } from "./roads";

// The rival (2026-11-15): one of three follows a run. Introduced after the
// first region boss, they keep a ledger of what they took, hold the
// crossroads, turn up uninvited, and end their own way at the lair's door.
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
// With both roads taken.
const STEP = {
  rival: 13,
  floor2: 21,
  landing2: 30,
  crossroads: 31,
  floor3: 32,
  door: 41,
  duel: 42,
};
type Rival = NonNullable<PartyState["rival"]>;
const party = (s: SessionState) => s.quest!.party!;
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
const run = (seed = 1) =>
  takeRoads(createSession(crawl, cards, packs, seeded(seed)));
/** Put card `id` at `step` (swapped with wherever it was picked). */
const place = (s: SessionState, step: number, id: string): SessionState => {
  const finale = [...s.quest!.finale];
  const was = finale.indexOf(id);
  if (was >= 0) finale[was] = finale[step];
  finale[step] = id;
  return { ...s, quest: { ...s.quest!, finale } };
};
const at = (
  s: SessionState,
  step: number,
  more: Partial<PartyState> = {},
): SessionState => ({
  ...s,
  discarded: step,
  previousId: s.quest!.finale[step - 1],
  quest: {
    ...s.quest!,
    step,
    party: { ...s.quest!.party!, ...more },
  },
});
/** A run that has met `who`, at `step`, with plenty of hearts. */
const met = (
  who: string,
  step: number,
  more: Partial<PartyState> = {},
  rival: Partial<Rival> = {},
  seed = 1,
) =>
  at(place(run(seed), STEP.rival, `dungeon.rival-${who}`), step, {
    max: 30,
    hearts: 30,
    deeds: [`rival-${who}`],
    rival: { who, took: [], won: 0, lost: 0, ...rival },
    ...more,
  });
const rollTo = (s: SessionState, face: number) => {
  const sides = currentCard(s).dice!.sides;
  return returnToCard(rollDice(s, () => (face - 0.5) / sides));
};
const fight = (s: SessionState, face: number, random = seeded(7)) =>
  advance(rollTo(advance(s), face), random);
/** A room of the stage at `step` that fits `want`. */
const roomOf = (
  s: SessionState,
  step: number,
  want: (c: CardDefinition) => boolean,
) => {
  const stage = s.quest!.stages[finaleStage(s.quest!, step).stage];
  return stage.cards.find(want)!;
};
const plainFight = (c: CardDefinition) =>
  !!c.battle &&
  c.dice?.count === 1 &&
  c.dice.sides === 20 &&
  !c.dice.choice &&
  !c.press &&
  !c.hits &&
  !c.reward &&
  !c.jinx;

describe("the rival", () => {
  it("walks in after the first boss, names themselves and helps themselves", () => {
    for (const r of rivals) {
      const s = at(place(run(2), STEP.rival, r.intro.id), STEP.rival, {
        loot: ["draught", "shield"],
      });
      const after = advance(advance(s));
      expect(party(after).rival).toEqual({
        who: r.who,
        took: ["shield"],
        won: 0,
        lost: 0,
        news: { took: ["shield"] },
        seen: STEP.rival + 1,
      });
      expect(party(after).loot).toEqual(["draught"]);
      expect(party(after).deeds).toEqual([`rival-${r.who}`]);
      expect(rivalProfile(after.quest)?.profile.name).toBe(r.name);
      roundTrip(after);
    }
    // Nothing to take: nothing taken, and no heart for it.
    const poor = advance(advance(at(run(3), STEP.rival)));
    expect(party(poor).rival?.took).toEqual([]);
    expect(party(poor).hearts).toBe(party(run(3)).hearts);
    roundTrip(poor);
  });

  it("holds the crossroads with one of their own four fights", () => {
    for (const r of rivals) {
      const inn = advance(met(r.who, STEP.landing2));
      const next = takeOffer(inn, 0, seeded(4));
      const id = next.quest!.finale[STEP.crossroads];
      expect(r.fights.map((c) => c.id)).toContain(id);
      const card = currentCard(advance(next));
      expect(card.dice?.outcomes?.find((o) => o.win)?.min).toBe(RIVAL_NEED);
      roundTrip(next);
    }
  });

  it("a lost meeting hands them what its card shows; a won one takes one back", () => {
    const spar = "dungeon.rival-bradley-spar";
    const s = place(
      met("bradley", STEP.crossroads, { loot: ["draught", "smoke"] }),
      STEP.crossroads,
      spar,
    );
    const lost = fight(s, 5);
    expect(party(lost)).toMatchObject({ hearts: 29, loot: ["draught"] });
    expect(party(lost).rival).toMatchObject({
      took: ["smoke"],
      lost: 1,
      won: 0,
      news: { took: ["smoke"] },
    });
    roundTrip(lost);
    const owed = place(
      met(
        "bradley",
        STEP.crossroads,
        { loot: [], hearts: 20 },
        { took: ["shield", "die"] },
      ),
      STEP.crossroads,
      spar,
    );
    const won = fight(owed, 17);
    // The oldest comes back.
    expect(party(won)).toMatchObject({ hearts: 20, loot: ["shield"] });
    expect(party(won).rival).toMatchObject({
      took: ["die"],
      won: 1,
      news: { back: ["shield"] },
    });
    roundTrip(won);
    // Lady Fingerbang takes two and no hearts.
    const robbed = fight(
      place(
        met("mirabel", STEP.crossroads, { loot: ["draught", "smoke", "die"] }),
        STEP.crossroads,
        "dungeon.rival-mirabel-toll",
      ),
      5,
    );
    expect(party(robbed)).toMatchObject({ hearts: 30, loot: ["draught"] });
    expect(party(robbed).rival?.took).toEqual(["die", "smoke"]);
    roundTrip(robbed);
  });

  it("meddling rolls the fight twice and keeps the worse", () => {
    const base = met("tutt", STEP.floor2 + 2);
    const room = roomOf(base, STEP.floor2 + 2, plainFight);
    const s = advance(
      at(place(base, STEP.floor2 + 2, room.id), STEP.floor2 + 2, {
        rival: { who: "tutt", took: [], won: 0, lost: 0, cut: "meddle" },
      }),
    );
    expect(cardEdge(s.quest, currentCard(s))).toBe("disadvantage");
    expect(rivalCut(s.quest)).toMatchObject({
      kind: "meddle",
      name: "Sensei Saggynuts",
    });
    const card = currentCard(s);
    expect(card).toMatchObject({
      ribbon: "Sensei Saggynuts · Meddling",
      ribbonTone: "crimson",
    });
    // The card in play is one object from read to read.
    expect(currentCard(s)).toBe(card);
    roundTrip(s);
    // A 19 and a 3: the 3 is kept.
    const faces = [19, 3];
    const rolled = returnToCard(rollDice(s, () => (faces.shift()! - 0.5) / 20));
    expect(rolled.roll).toMatchObject({
      values: [3],
      dropped: [19],
      edge: "disadvantage",
    });
    roundTrip(rolled);
    const after = advance(rolled, seeded(3));
    expect(party(after).rival?.cut).toBeUndefined();
    expect(party(after).rival?.seen).toBe(STEP.floor2 + 3);
    roundTrip(after);
  });

  it("sniping takes what the card gives", () => {
    const base = met("bradley", STEP.floor2 + 2);
    const find = roomOf(
      base,
      STEP.floor2 + 2,
      (c) => !c.battle && !c.offers && !!c.reward?.loot && !c.dice,
    );
    const s = at(place(base, STEP.floor2 + 2, find.id), STEP.floor2 + 2, {
      rival: { who: "bradley", took: [], won: 0, lost: 0, cut: "snipe" },
    });
    expect(currentCard(s).ribbon).toBe("Sir Chad · Sniping");
    const after = advance(advance(s), seeded(3));
    expect(party(after).loot).toEqual([]);
    expect(party(after).rival).toMatchObject({
      took: [find.reward!.loot],
      news: { took: [find.reward!.loot] },
    });
    roundTrip(after);
  });

  it("turns up uninvited: spaced out, capped, and only with their own cards", () => {
    const kinds = { ambush: 0, meddle: 0, snipe: 0 };
    for (let seed = 1; seed <= 80; seed++) {
      const random = seeded(seed);
      const who = rivals[seed % rivals.length];
      let s = met(who.who, STEP.floor2, { loot: ["draught", "die"] }, {}, seed);
      let last = -99;
      const seen = { ambush: 0, meddle: 0, snipe: 0 };
      for (let guard = 0; guard < 200 && s.quest!.step < STEP.door; guard++) {
        if (s.phase === "complete") break;
        if (s.phase === "hidden") {
          const stage = finaleStage(s.quest!);
          const raw = finaleCard(s.quest!, s.quest!.finale[s.quest!.step])!;
          const cut = party(s).rival?.cut;
          const ambush = stage.size > 1 && !!raw.rival;
          if (cut || ambush) {
            expect(s.discarded - last).toBeGreaterThanOrEqual(RIVAL_GAP);
            if (ambush) expect(raw.rival!.who).toBe(who.who);
            seen[cut ?? "ambush"]++;
            roundTrip(s);
          }
          // Any card of theirs counts as an appearance.
          if (cut || raw.rival) last = s.discarded + 1;
        }
        s = advance(s, random);
        const card = currentCard(s);
        if (card.offers?.length)
          s = takeOffer(s, card.offers.length - 1, random);
        else if (card.battle && !card.dice) s = settleBattle(s, true, random);
        else if (card.dice) {
          const sides = card.dice.sides;
          const rolled = returnToCard(
            rollDice(s, () => (Math.min(19, sides) - 0.5) / sides),
          );
          s = awaitingPress(rolled)
            ? cashOut(rolled, random)
            : advance(rolled, random);
        } else s = advance(s, random);
      }
      for (const k of ["ambush", "meddle", "snipe"] as const) {
        expect(seen[k]).toBeLessThanOrEqual(RIVAL_CAP[k]);
        expect(party(s).rival?.cuts?.[k] ?? 0).toBe(seen[k]);
        kinds[k] += seen[k];
      }
    }
    // Every kind happens.
    expect(kinds.ambush).toBeGreaterThan(10);
    expect(kinds.meddle).toBeGreaterThan(10);
    expect(kinds.snipe).toBeGreaterThan(10);
    // 80 seeded runs played card by card: about 5 s here, more on a CI
    // runner beside the other files, so it has the harness's 30 s.
  }, 30_000);

  it("leaves a party on its last few hearts alone", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const base = met("bradley", STEP.floor2, { hearts: 1 }, {}, seed);
      const s = advance(advance(base), seeded(seed));
      // A room that needs no roll and heals too little to matter.
      if (s.quest!.step !== STEP.floor2 + 1 || party(s).hearts > 4) continue;
      expect(party(s).rival?.cut).toBeUndefined();
      expect(finaleCard(s.quest!, s.quest!.finale[s.quest!.step])!.rival).toBe(
        undefined,
      );
    }
  });

  it("Lady Fingerbang gives it all back to come along, and walks out on a loss", () => {
    const loot: Loot[] = ["die", "smoke"];
    const door = advance(
      place(
        met("mirabel", STEP.door, { loot: [] }, { took: loot }),
        STEP.door,
        "dungeon.rival-mirabel-door",
      ),
    );
    const joined = takeOffer(door, 0, seeded(2));
    expect(party(joined)).toMatchObject({
      loot,
      team: ["dungeon.rival-mirabel-door"],
    });
    expect(party(joined).rival?.took).toEqual([]);
    expect(party(joined).deeds).toContain("rival-joined");
    // No duel: the dragon is next.
    expect(finaleStage(joined.quest!).label).toBe("The Dragon's Lair");
    roundTrip(joined);
    // Sent into a swing that misses, she leaves with the satchel.
    const sent = sendIn(advance(joined), "dungeon.rival-mirabel-door");
    expect(party(sent).assist).toBe("dungeon.rival-mirabel-door");
    const missed = advance(rollTo(sent, 2), seeded(2));
    expect(party(missed).team).toBeUndefined();
    expect(party(missed).loot).toEqual([]);
    expect(party(missed).rival?.took).toEqual(loot);
    expect(party(missed).deeds).toContain("rival-turned");
    roundTrip(missed);
  });

  it("refused, they duel: felled, everything comes back with their trophy", () => {
    for (const r of rivals) {
      const door = advance(
        place(
          met(
            r.who,
            STEP.door,
            { loot: ["draught"] },
            { took: ["die", "smoke"] },
          ),
          STEP.door,
          r.plea.id,
        ),
      );
      const refuse = r.plea.offers!.findIndex(
        (o) => o.deed === "rival-refused",
      );
      let s = takeOffer(door, refuse, seeded(5));
      expect(s.quest!.finale[s.quest!.step]).toBe(r.duel.id);
      roundTrip(s);
      // Two swings land.
      s = fight(s, 18);
      expect(s.quest!.step).toBe(STEP.duel);
      s = fight(s, 18);
      expect(finaleStage(s.quest!).label).toBe("The Dragon's Lair");
      expect(party(s).loot).toEqual(["draught", "die", "smoke"]);
      expect(party(s).rival).toMatchObject({ took: [], won: 1 });
      expect(party(s).boons).toContain(r.duel.id);
      expect(party(s).deeds).toContain("rival-beaten");
      roundTrip(s);
    }
    // Sensei Saggynuts' exam can be skipped: he keeps what he took.
    const tutt = rivals.find((r) => r.who === "tutt")!;
    const skipped = takeOffer(
      advance(
        place(
          met("tutt", STEP.door, {}, { took: ["die"] }),
          STEP.door,
          tutt.plea.id,
        ),
      ),
      1,
      seeded(5),
    );
    expect(finaleStage(skipped.quest!).label).toBe("The Dragon's Lair");
    expect(party(skipped).rival?.took).toEqual(["die"]);
    roundTrip(skipped);
  });

  it("every rival has a name of their own and lines that fit", () => {
    expect(new Set(rivals.map((r) => r.name)).size).toBe(rivals.length);
    for (const r of rivals) {
      const profile = r.intro.rival!.profile!;
      const { verse } = profile;
      for (const line of [verse.joined, verse.beaten, verse.ahead])
        if (line) expect(line.length).toBeLessThanOrEqual(BALLAD_WIDTH);
      expect(r.fights).toHaveLength(4);
      // Their name is on every card of theirs: the surname, or the whole
      // short name ("Sir Chad").
      const known = new RegExp(r.name.split(" ").pop()!);
      for (const c of [r.intro, ...r.fights, r.plea, r.duel])
        expect(c.rules, c.id).toMatch(known);
    }
  });

  it("speaks in their own voice (Phase 1)", () => {
    expect(rivals.map((r) => r.name)).toEqual([
      "Sir Chad",
      "Lady Fingerbang",
      "Sensei Saggynuts",
    ]);
    const old = /Bradley|Mirabel|Tutt|Aldous/;
    for (const r of rivals) {
      const profile = r.intro.rival!.profile!;
      // Lines replace the old meddle and snipe fields.
      expect(profile.meddle).toBeUndefined();
      expect(profile.snipe).toBeUndefined();
      const lines = profile.lines!;
      for (const key of ["took", "back", "lostTo", "beaten"] as const)
        expect(lines[key], `${r.who} ${key}`).toBeTruthy();
      // A line for every verb they are weighted to use.
      for (const [verb, weight] of Object.entries(profile.style))
        if (weight)
          expect(lines[verb as "meddle"], `${r.who} ${verb}`).toBeTruthy();
      for (const line of Object.values(lines))
        expect(line!.length, line).toBeLessThanOrEqual(80);
      expect(profile.ritual.length).toBeLessThanOrEqual(110);
      expect(lines.took).toContain("{item}");
      expect(lines.back).toContain("{item}");
      // No old name is left on any card or line of theirs.
      for (const c of [r.intro, ...r.fights, r.plea, r.duel]) {
        const text = JSON.stringify({
          ...c,
          rival: { ...c.rival, who: "" },
        }).replaceAll(c.id, "");
        expect(text, c.id).not.toMatch(old);
        for (const o of c.offers ?? [])
          expect(o.label.length, o.label).toBeLessThanOrEqual(18);
      }
      if (r.plea.ally) expect(r.plea.ally.name.length).toBeLessThanOrEqual(22);
    }
  });

  it("fills {item} with the items' names, and falls back for an old profile", () => {
    const chad = rivals[0].intro.rival!.profile!;
    expect(rivalLine(chad, "took", ["Tower Shield", "Draught"])).toBe(
      "Sir Chad pockets your Tower Shield and Draught. 'For the highlight reel, Champ.'",
    );
    expect(rivalLine(chad, "meddle")).toBe(chad.lines!.meddle);
    // A profile frozen before Phase 1: its two lines, nothing else.
    const old = {
      ...chad,
      lines: undefined,
      meddle: "Old meddle.",
      snipe: "Old snipe.",
    };
    expect(rivalLine(old, "meddle")).toBe("Old meddle.");
    expect(rivalLine(old, "snipe")).toBe("Old snipe.");
    expect(rivalLine(old, "took", ["Draught"])).toBeUndefined();
  });

  it("a malformed rival is rejected", () => {
    const s = met("bradley", STEP.floor2 + 1, {}, { took: ["die"] });
    roundTrip(s);
    const bad = (change: (r: Rival) => void) => {
      const next = structuredClone(s);
      change(next.quest!.party!.rival!);
      expect(() => parseSession(JSON.stringify(next))).toThrow();
    };
    bad((r) => (r.who = "nobody"));
    bad((r) => (r.took = ["gold" as Loot]));
    bad((r) => (r.won = -1));
    bad((r) => (r.cut = "ambush" as "meddle"));
    bad((r) => (r.cuts = { stroll: 1 } as Rival["cuts"]));
    // Named before their introduction was dealt.
    const early = structuredClone(at(s, STEP.rival - 2));
    expect(() => parseSession(JSON.stringify(early))).toThrow();
  });
});
