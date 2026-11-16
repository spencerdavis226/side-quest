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
  RIVAL_TOTAL,
  RIVAL_VERBS,
  assistBonus,
  canHush,
  hush,
  settleDrinks,
  awaitingInvoice,
  awaitingRedo,
  canKickOut,
  canPayInvoice,
  kickOut,
  payInvoice,
  payOff,
  payOffItem,
  redoRoll,
  rivalArsenal,
  questRecord,
  rivalCut,
  rivalLine,
  rivalProfile,
  sendIn,
  settleBattle,
  takeOffer,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollBonus, rollDice } from "../src/game/dice";
import { ballad } from "../src/game/ballad";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import { rivals, senseiPinned } from "../src/content/dungeon/rivals";
import { RIVAL_NEED } from "../src/content/dungeon/shared";
import type {
  CardDefinition,
  GameConfig,
  Loot,
  PartyState,
  RivalVerb,
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
      // Lady Fingerbang takes two from the start (Phase 2), newest first.
      const took: Loot[] =
        r.who === "fingerbang" ? ["shield", "draught"] : ["shield"];
      expect(party(after).rival).toEqual({
        who: r.who,
        took,
        won: 0,
        lost: 0,
        news: { took },
        seen: STEP.rival + 1,
      });
      expect(party(after).loot).toEqual(
        r.who === "fingerbang" ? [] : ["draught"],
      );
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
    const spar = "dungeon.rival-chad-spotter";
    const s = place(
      met("chad", STEP.crossroads, { loot: ["draught", "smoke"] }),
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
        "chad",
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
        met("fingerbang", STEP.crossroads, {
          loot: ["draught", "smoke", "die"],
        }),
        STEP.crossroads,
        "dungeon.rival-fingerbang-toll-booth",
      ),
      5,
    );
    expect(party(robbed)).toMatchObject({ hearts: 30, loot: ["draught"] });
    expect(party(robbed).rival?.took).toEqual(["die", "smoke"]);
    roundTrip(robbed);
  });

  it("meddling rolls the fight twice and keeps the worse", () => {
    const base = met("sensei", STEP.floor2 + 2);
    const room = roomOf(base, STEP.floor2 + 2, plainFight);
    const s = advance(
      at(place(base, STEP.floor2 + 2, room.id), STEP.floor2 + 2, {
        rival: { who: "sensei", took: [], won: 0, lost: 0, cut: "meddle" },
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
    const base = met("chad", STEP.floor2 + 2);
    const find = roomOf(
      base,
      STEP.floor2 + 2,
      (c) => !c.battle && !c.offers && !!c.reward?.loot && !c.dice,
    );
    const s = at(place(base, STEP.floor2 + 2, find.id), STEP.floor2 + 2, {
      rival: { who: "chad", took: [], won: 0, lost: 0, cut: "snipe" },
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
    const zero = () =>
      Object.fromEntries(RIVAL_VERBS.map((k) => [k, 0])) as Record<
        RivalVerb,
        number
      >;
    const kinds = zero();
    for (let seed = 1; seed <= 80; seed++) {
      const random = seeded(seed);
      const who = rivals[seed % rivals.length];
      let s = met(who.who, STEP.floor2, { loot: ["draught", "die"] }, {}, seed);
      let last = -99;
      const seen = zero();
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
        if (awaitingInvoice(s)) s = payInvoice(s, "heart");
        const card = currentCard(s);
        if (card.offers?.length)
          s = takeOffer(s, card.offers.length - 1, random);
        else if (card.battle && !card.dice) s = settleBattle(s, true, random);
        else if (card.dice) {
          const sides = card.dice.sides;
          let rolled = returnToCard(
            rollDice(s, () => (Math.min(19, sides) - 0.5) / sides),
          );
          if (awaitingRedo(rolled))
            rolled = returnToCard(
              rollDice(
                redoRoll(rolled),
                () => (Math.min(19, sides) - 0.5) / sides,
              ),
            );
          s = awaitingPress(rolled)
            ? cashOut(rolled, random)
            : advance(rolled, random);
        } else s = advance(s, random);
      }
      // No more than the run's total.
      expect(
        RIVAL_VERBS.reduce((n, k) => n + (party(s).rival?.cuts?.[k] ?? 0), 0),
      ).toBeLessThanOrEqual(RIVAL_TOTAL);
      for (const k of RIVAL_VERBS) {
        expect(seen[k]).toBeLessThanOrEqual(RIVAL_CAP[k]);
        expect(party(s).rival?.cuts?.[k] ?? 0).toBe(seen[k]);
        kinds[k] += seen[k];
      }
    }
    // Every kind the three rivals use happens.
    for (const k of ["ambush", "meddle", "snipe", "redo", "swipe"] as const)
      expect(kinds[k], k).toBeGreaterThan(2);
    // 80 seeded runs played card by card: about 5 s here, more on a CI
    // runner beside the other files, so it has the harness's 30 s.
  }, 30_000);

  it("leaves a party on its last few hearts alone", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const base = met("chad", STEP.floor2, { hearts: 1 }, {}, seed);
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
        met("fingerbang", STEP.door, { loot: [] }, { took: loot }),
        STEP.door,
        "dungeon.rival-fingerbang-door",
      ),
    );
    // A draw that keeps her loyal (Phase 4's betrayal is tested below).
    const joined = takeOffer(door, 0, () => 0.99);
    expect(party(joined)).toMatchObject({
      loot,
      team: ["dungeon.rival-fingerbang-door"],
    });
    expect(party(joined).rival?.took).toEqual([]);
    expect(party(joined).deeds).toContain("rival-joined");
    // No duel: the dragon is next.
    expect(finaleStage(joined.quest!).label).toBe("The Dragon's Lair");
    roundTrip(joined);
    // Sent into a swing that misses, she leaves with the satchel.
    const sent = sendIn(advance(joined), "dungeon.rival-fingerbang-door");
    expect(party(sent).assist).toBe("dungeon.rival-fingerbang-door");
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
            { took: ["round", "revive"] },
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
      // Every swing but the last lands, then the last (Gary's audit takes
      // three).
      for (let i = 1; i < r.duel.hits!; i++) {
        s = fight(s, 18);
        expect(s.quest!.step).toBe(STEP.duel);
      }
      s = fight(s, 18);
      expect(finaleStage(s.quest!).label).toBe("The Dragon's Lair");
      expect(party(s).loot).toEqual(["draught", "round", "revive"]);
      expect(party(s).rival).toMatchObject({ took: [], won: 1 });
      expect(party(s).boons).toContain(r.duel.id);
      expect(party(s).deeds).toContain("rival-beaten");
      roundTrip(s);
    }
    // Sensei Saggynuts' exam can be skipped: he keeps what he took.
    const sensei = rivals.find((r) => r.who === "sensei")!;
    const skipped = takeOffer(
      advance(
        place(
          met("sensei", STEP.door, {}, { took: ["die"] }),
          STEP.door,
          sensei.plea.id,
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
      "Chuck the Cuck",
      "Gary Shitwhistle",
      "Dame Queefington",
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
    const s = met("chad", STEP.floor2 + 1, {}, { took: ["die"] });
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

// Rivals Phase 2 (maximum frustration): the Do-Over, the new verbs, the
// counters the table can choose, and the duel fought with their ledger.
const plainRoom = (c: CardDefinition) =>
  !c.dice &&
  !c.battle &&
  !c.offers &&
  !c.hits &&
  !c.strike &&
  !c.timer &&
  !c.secret &&
  !c.jinx &&
  !c.reward;
/** `who` met, the card `want` finds dealt at `step`, revealed, with the cut
 * `cut` on it. */
const cutOn = (
  who: string,
  step: number,
  want: (c: CardDefinition) => boolean,
  cut: Rival["cut"],
  more: Partial<PartyState> = {},
  rival: Partial<Rival> = {},
) => {
  const base = met(who, step);
  const room = roomOf(base, step, want);
  return advance(
    at(place(base, step, room.id), step, {
      ...more,
      rival: { who, took: [], won: 0, lost: 0, cut, ...rival },
    }),
  );
};
const winAt = (s: SessionState) => rollTo(s, 19);

describe("the rival, Phase 2", () => {
  it("the Do-Over: a won roll is rolled again, and the new roll stands", () => {
    const s = cutOn("sensei", STEP.floor2 + 2, plainFight, "redo");
    expect(currentCard(s).ribbon).toBe("Sensei Saggynuts · Do-Over");
    expect(rivalCut(s.quest)?.line).toContain("Lucky. Again.");
    // A lost first roll is left alone.
    const lost = rollTo(s, 2);
    expect(awaitingRedo(lost)).toBe(false);
    // A won one waits: the card cannot be put aside.
    const won = winAt(s);
    expect(awaitingRedo(won)).toBe(true);
    expect(advance(won, seeded(1))).toBe(won);
    roundTrip(won);
    const again = redoRoll(won);
    expect(again.roll).toBeNull();
    expect(party(again).rival).toMatchObject({ redone: true, redos: 1 });
    roundTrip(again);
    // The new roll stands, win or lose.
    const after = rollTo(again, 2);
    expect(awaitingRedo(after)).toBe(false);
    expect(awaitingRedo(winAt(again))).toBe(false);
    const put = advance(after, seeded(2));
    expect(put.discarded).toBe(after.discarded + 1);
    expect(party(put).rival?.redone).toBeUndefined();
    expect(party(put).rival?.redos).toBe(1);
    roundTrip(put);
  });

  it("pays them off with the newest item: the cut is cancelled", () => {
    // A Do-Over, once the win is on the card.
    const s = cutOn("sensei", STEP.floor2 + 2, plainFight, "redo", {
      loot: ["draught", "shield"],
    });
    expect(payOffItem(s)).toBeUndefined();
    const won = winAt(s);
    expect(payOffItem(won)).toBe("shield");
    const paid = payOff(won);
    expect(party(paid).loot).toEqual(["draught"]);
    expect(party(paid).rival).toMatchObject({
      took: ["shield"],
      cuts: { paid: 1 },
    });
    expect(party(paid).rival?.cut).toBeUndefined();
    expect(awaitingRedo(paid)).toBe(false);
    expect(currentCard(paid).ribbon).not.toContain("Do-Over");
    roundTrip(paid);
    // A meddle, before the roll only.
    const meddle = cutOn("sensei", STEP.floor2 + 2, plainFight, "meddle", {
      loot: ["die"],
    });
    expect(payOffItem(meddle)).toBe("die");
    expect(payOffItem(winAt(meddle))).toBeUndefined();
    expect(
      cardEdge(payOff(meddle).quest, currentCard(payOff(meddle))),
    ).not.toBe("disadvantage");
    // Nothing to pay with: no pay-off.
    const broke = cutOn("sensei", STEP.floor2 + 2, plainFight, "meddle");
    expect(payOff(broke)).toBe(broke);
  });

  it("swipes or hands off the newest item when the card goes", () => {
    for (const cut of ["swipe", "handoff"] as const) {
      const s = cutOn("fingerbang", STEP.floor2 + 2, plainRoom, cut, {
        loot: ["draught", "shield"],
      });
      expect(payOffItem(s)).toBeUndefined();
      const after = advance(s, seeded(3));
      expect(party(after).loot).toEqual(["draught"]);
      if (cut === "swipe")
        expect(party(after).rival).toMatchObject({
          took: ["shield"],
          news: { took: ["shield"] },
        });
      else
        expect(party(after).rival).toMatchObject({
          took: [],
          news: { gone: ["shield"] },
        });
      roundTrip(after);
    }
  });

  it("poaches an ally unless the table drinks, and the duel brings it home", () => {
    const base = met("fingerbang", STEP.floor2 + 2);
    // The first inn's hired blade, dealt before the second region.
    const ally = base
      .quest!.finale.slice(0, STEP.floor2)
      .map((id) => finaleCard(base.quest!, id)!)
      .find((c) => c.ally && !c.rival)!;
    const s = cutOn("fingerbang", STEP.floor2 + 2, plainRoom, "poach", {
      team: [ally.id],
    });
    expect(canKickOut(s)).toBe(true);
    // Kept, for drinks.
    const kept = advance(kickOut(s), seeded(3));
    expect(party(kept).team).toEqual([ally.id]);
    expect(party(kept).rival?.cuts?.paid).toBe(1);
    // Taken.
    const taken = advance(s, seeded(3));
    expect(party(taken).team).toBeUndefined();
    expect(party(taken).rival).toMatchObject({
      poached: [ally.id],
      news: { poached: ally.id },
    });
    roundTrip(taken);
    // The duel falls: the ally comes back with everything.
    const fingerbang = rivals.find((r) => r.who === "fingerbang")!;
    let duel = advance(
      at(place(taken, STEP.duel, fingerbang.duel.id), STEP.duel, {
        hearts: 30,
        loot: [],
      }),
    );
    duel = fight(duel, 18);
    duel = fight(duel, 18);
    expect(party(duel).team).toEqual([ally.id]);
    expect(party(duel).rival?.poached).toBeUndefined();
    roundTrip(duel);
  });

  it("squats in an inn: its rests heal 1 less, unless kicked out", () => {
    // The second inn (its rare, the widow, has no rest): the first seed
    // whose run has one with a rest after the second region.
    const innAt = (b: SessionState) =>
      b.quest!.finale.findIndex(
        (id, i) =>
          i > STEP.floor2 &&
          !!finaleCard(b.quest!, id)?.offers?.some((o) => o.heal),
      );
    let base = met("chad", STEP.floor2);
    for (let seed = 2; innAt(base) < 0; seed++)
      base = met("chad", STEP.floor2, {}, {}, seed);
    const step = innAt(base);
    const inn = finaleCard(base.quest!, base.quest!.finale[step])!;
    const rest = inn.offers!.findIndex((o) => o.heal);
    const s = advance(
      at(base, step, {
        hearts: 5,
        max: 30,
        rival: { who: "chad", took: [], won: 0, lost: 0, cut: "squat" },
      }),
    );
    expect(currentCard(s).offers![rest].heal).toBe(inn.offers![rest].heal! - 1);
    roundTrip(s);
    const rested = takeOffer(s, rest, seeded(2));
    const kicked = takeOffer(kickOut(s), rest, seeded(2));
    expect(party(kicked).hearts - party(rested).hearts).toBe(1);
  });

  it("an invoice holds the card until it is paid with a heart or an item", () => {
    const s = cutOn("chad", STEP.floor2 + 2, plainRoom, "invoice", {
      loot: ["draught"],
    });
    expect(awaitingInvoice(s)).toBe(true);
    expect(advance(s, seeded(1))).toBe(s);
    roundTrip(s);
    const heart = payInvoice(s, "heart");
    expect(party(heart).hearts).toBe(29);
    expect(awaitingInvoice(heart)).toBe(false);
    const item = payInvoice(s, "item");
    expect(party(item)).toMatchObject({ hearts: 30, loot: [] });
    expect(party(item).rival?.took).toEqual(["draught"]);
    expect(advance(item, seeded(1)).discarded).toBe(s.discarded + 1);
    // No item: only a heart.
    const broke = cutOn("chad", STEP.floor2 + 2, plainRoom, "invoice");
    expect(canPayInvoice(broke, "item")).toBe(false);
    expect(payInvoice(broke, "item")).toBe(broke);
  });

  it("a curse lands with the card, from a card of theirs never dealt", () => {
    const withJinx = cards.find((c) => c.jinx)!;
    const base = met("sensei", STEP.floor2 + 2);
    const id = base
      .quest!.stages.flatMap((st) => st.ambush ?? [])
      .find((c) => c.rival?.who === "sensei")!.id;
    const s = structuredClone(
      cutOn("sensei", STEP.floor2 + 2, plainRoom, "curse"),
    );
    // Every copy of that card carries their curse (Phase 3's bard's do).
    for (const st of s.quest!.stages)
      for (const c of [...st.cards, ...(st.ambush ?? [])])
        if (c.id === id) {
          c.jinx = withJinx.jinx;
          c.rival!.curse = true;
        }
    const theirs = { id };
    const cursed = advance(s);
    expect(party(cursed).jinx).toBe(theirs.id);
    roundTrip(cursed);
  });

  it("the duel is fought with what they took", () => {
    const sensei = rivals.find((r) => r.who === "sensei")!;
    const duelWith = (took: Loot[]) =>
      advance(
        place(
          met("sensei", STEP.duel, {}, { took }),
          STEP.duel,
          sensei.duel.id,
        ),
      );
    // Each Tower Shield is a swing more.
    const shields = duelWith(["shield", "shield"]);
    expect(rivalArsenal(shields.quest, currentCard(shields))?.shields).toBe(2);
    let s = shields;
    for (let i = 0; i < 3; i++) s = fight(s, 18);
    expect(finaleStage(s.quest!).label).toBe("The Duel");
    s = fight(s, 18);
    expect(finaleStage(s.quest!).label).toBe("The Dragon's Lair");
    // Their Lucky Coin: the party's first won swing is a Do-Over.
    const coin = winAt(duelWith(["die"]));
    expect(awaitingRedo(coin)).toBe(true);
    const redone = redoRoll(coin);
    expect(party(redone).rival?.arsenal).toEqual({ coin: true });
    roundTrip(redone);
    expect(awaitingRedo(winAt(redone))).toBe(false);
    // Their potion: the first landed swing does not count.
    let potion = fight(duelWith(["draught"]), 18);
    expect(party(potion).hits).toBe(0);
    expect(party(potion).rival?.arsenal).toEqual({
      draught: true,
      swung: true,
    });
    roundTrip(potion);
    potion = fight(potion, 18);
    expect(party(potion).hits).toBe(1);
    // Their Smoke Bomb: a lost first swing and they flee with everything.
    const smoke = duelWith(["smoke", "shield"]);
    const fled = fight(smoke, 2);
    expect(finaleStage(fled.quest!).label).toBe("The Dragon's Lair");
    expect(party(fled).rival?.took).toEqual([]);
    expect(party(fled).rival?.news?.gone).toEqual(["smoke", "shield"]);
    expect(party(fled).deeds).toContain("rival-fled");
    expect(party(fled).boons ?? []).not.toContain(sensei.duel.id);
    roundTrip(fled);
    // Won first, the bomb is spent.
    const late = fight(fight(smoke, 18), 2);
    expect(finaleStage(late.quest!).label).toBe("The Duel");
  });

  it("a joined rival's grudge: one more for each meeting lost, up to two", () => {
    const chad = rivals.find((r) => r.who === "chad")!;
    expect(chad.plea.ally!.grudge).toBe(true);
    const q = met("chad", STEP.door, {}, { lost: 5 }).quest!;
    expect(assistBonus(chad.plea, q)).toBe(chad.plea.ally!.bonus + 2);
    const q1 = met("chad", STEP.door, {}, { lost: 1 }).quest!;
    expect(assistBonus(chad.plea, q1)).toBe(chad.plea.ally!.bonus + 1);
  });

  it("rejects a malformed Phase 2 rival", () => {
    const s = cutOn("sensei", STEP.floor2 + 2, plainFight, "redo");
    roundTrip(s);
    const bad = (change: (r: Rival) => void) => {
      const next = structuredClone(s);
      change(next.quest!.party!.rival!);
      expect(() => parseSession(JSON.stringify(next))).toThrow();
    };
    bad((r) => (r.cut = "dance" as "redo"));
    bad((r) => {
      r.cut = "meddle";
      r.redone = true;
    });
    bad((r) => (r.redos = -1));
    bad((r) => (r.poached = ["dungeon.nobody"]));
    bad((r) => (r.arsenal = { coin: false as unknown as true }));
    bad((r) => (r.cuts = { paid: 1.5 }));
    bad((r) => (r.news = { gone: ["gold" as Loot] }));
  });
});

// Rivals Phase 3: Chuck the Cuck, Gary Shitwhistle, Dame Queefington.
describe("the rival, Phase 3", () => {
  const atDoor = (who: string, more: Partial<PartyState> = {}, rival = {}) => {
    const r = rivals.find((x) => x.who === who)!;
    return advance(
      place(met(who, STEP.door, more, rival), STEP.door, r.plea.id),
    );
  };

  it("Chuck joins on a coin: heads +4, tails +0, and the coin is news", () => {
    const chuck = rivals.find((r) => r.who === "chuck")!;
    for (const [draw, face, bonus] of [
      [0.9, 2, 4],
      [0.1, 1, 0],
    ] as const) {
      const joined = takeOffer(atDoor("chuck"), 0, () => draw);
      expect(party(joined).team).toEqual([chuck.plea.id]);
      expect(party(joined).rival?.joinFace).toBe(face);
      expect(party(joined).coin).toEqual({ face, for: "join" });
      expect(assistBonus(chuck.plea, joined.quest)).toBe(bonus);
      roundTrip(joined);
      // The coin is news for one put-aside only.
      expect(
        party(advance(rollTo(advance(joined), 2), seeded(1))).coin,
      ).toBeUndefined();
    }
  });

  it("Chuck leaves a party at 2 hearts or fewer, to watch the dragon", () => {
    const chuck = rivals.find((r) => r.who === "chuck")!;
    const joined = takeOffer(atDoor("chuck", { hearts: 3 }), 0, () => 0.9);
    // A swing at the dragon that misses and costs a heart or more.
    let s = advance(joined);
    for (
      let i = 0;
      i < 6 && party(s).team?.length && s.phase !== "complete";
      i++
    )
      s = advance(rollTo(advance(s), 2), seeded(i));
    expect(party(s).team).toBeUndefined();
    expect(party(s).deeds).toContain("rival-left");
    const left = party(s).rival?.news?.left;
    if (left) expect(left).toBe(chuck.plea.id);
    if (s.phase !== "complete") roundTrip(s);
  });

  it("Gary is settled in drinks, or audited over three swings", () => {
    const gary = rivals.find((r) => r.who === "gary")!;
    const door = atDoor(
      "gary",
      { loot: [] },
      { took: ["die", "smoke", "shield"] },
    );
    expect(settleDrinks(door.quest)).toBe(3);
    const settled = takeOffer(door, 0, seeded(2));
    expect(party(settled).loot).toEqual(["die", "smoke", "shield"]);
    expect(party(settled).rival?.took).toEqual([]);
    expect(party(settled).deeds).toContain("rival-settled");
    expect(finaleStage(settled.quest!).label).toBe("The Dragon's Lair");
    roundTrip(settled);
    // At least one drink, at most six.
    expect(settleDrinks(atDoor("gary").quest)).toBe(1);
    // Refused: The Audit.
    const audit = takeOffer(atDoor("gary"), 1, seeded(2));
    expect(audit.quest!.finale[audit.quest!.step]).toBe(gary.duel.id);
    expect(gary.duel.hits).toBe(3);
    roundTrip(audit);
  });

  it("Gary's Whistle calls off a cut once a region", () => {
    const gary = rivals.find((r) => r.who === "gary")!;
    const base = met("sensei", STEP.floor2 + 2);
    // The whistle won from Gary's audit, carried here by its card ID.
    const q = structuredClone(base.quest!);
    const audit = structuredClone(gary.duel);
    q.stages[0].cards.push(audit);
    q.finale[0] = audit.id;
    const room = roomOf(base, STEP.floor2 + 2, plainFight);
    const s = advance(
      at(
        place({ ...base, quest: q }, STEP.floor2 + 2, room.id),
        STEP.floor2 + 2,
        {
          boons: [audit.id],
          rival: { who: "sensei", took: [], won: 0, lost: 0, cut: "meddle" },
        },
      ),
    );
    expect(canHush(s)).toBe(true);
    const hushed = hush(s);
    expect(party(hushed).rival).toMatchObject({ hushed: true });
    expect(party(hushed).rival?.cut).toBeUndefined();
    expect(cardEdge(hushed.quest, currentCard(hushed))).not.toBe(
      "disadvantage",
    );
    // Not again until a region boss falls.
    const again = {
      ...hushed,
      quest: {
        ...hushed.quest!,
        party: {
          ...party(hushed),
          rival: { ...party(hushed).rival!, cut: "meddle" as const },
        },
      },
    };
    expect(canHush(again)).toBe(false);
  });

  it("Dame Queefington's lost meetings lay her curse, and she curses by song", () => {
    const queef = rivals.find((r) => r.who === "queef")!;
    for (const f of queef.fights) {
      expect(f.jinx).toBeTruthy();
      expect(f.rival?.curse).toBe(true);
      expect(f.jinx!.rule).toMatch(/^The cursed player /);
    }
    const lost = fight(
      place(met("queef", STEP.crossroads), STEP.crossroads, queef.fights[0].id),
      2,
    );
    expect(party(lost).jinx).toBe(queef.fights[0].id);
    expect(party(lost).hearts).toBe(29);
    roundTrip(lost);
    // Cutting in: the curse lands with a plain room.
    const cursed = advance(
      cutOn("queef", STEP.floor2 + 2, plainRoom, "curse"),
      seeded(3),
    );
    expect(finaleCard(cursed.quest!, party(cursed).jinx!)?.rival?.who).toBe(
      "queef",
    );
    roundTrip(cursed);
  });

  it("every rival's door ends their own way, and the stage pools hold all six", () => {
    const run1 = run(1);
    const door = run1.quest!.stages.find(
      (st) => st.label === "The Lair's Door",
    )!;
    // Six rivals' doors, and Sensei pinned (Phase 4).
    expect(door.variants).toHaveLength(7);
    const crossroads = run1.quest!.stages.find(
      (st) => st.label === "The Crossroads",
    )!;
    expect(crossroads.ambush).toHaveLength(24);
    for (const r of rivals) {
      const offers = r.plea.offers!;
      expect(offers.some((o) => o.deed === "rival-refused")).toBe(true);
    }
  });
});

// Rivals Phase 4: betrayal, the credit, Sensei pinned, the losable duel
// and Dame Queefington's ballad.
describe("the rival, Phase 4", () => {
  const door = (who: string, more: Partial<PartyState> = {}, rival = {}) => {
    const r = rivals.find((x) => x.who === who)!;
    return advance(
      place(met(who, STEP.door, more, rival), STEP.door, r.plea.id),
    );
  };
  /** Win the dragon's round face up: its top face (the contest's coin is
   * heads). */
  const winRound = (s: SessionState, i: number) =>
    advance(rollTo(s, currentCard(s).dice!.sides), seeded(i));
  /** Join with draws in order (the betrayal's chance, then its swing). */
  const join = (s: SessionState, draws: number[]) => {
    const queue = [...draws];
    return takeOffer(s, 0, () => queue.shift() ?? 0.99);
  };

  it("decides at join whether they turn, and on which swing", () => {
    // Lady Fingerbang: 25%, and 15% more for each meeting won.
    const loyal = join(door("fingerbang", {}, { won: 0 }), [0.3]);
    expect(party(loyal).rival?.turnsAt).toBeUndefined();
    const hated = join(door("fingerbang", {}, { won: 1 }), [0.3, 0.5]);
    expect(party(hated).rival?.turnsAt).toBe(1);
    roundTrip(hated);
    // Never decided again: the swing is saved.
    expect(party(advance(hated)).rival?.turnsAt).toBe(1);
  });

  it("Lady Fingerbang turns on her swing and walks off with the satchel", () => {
    const loot: Loot[] = ["die", "smoke"];
    const joined = join(
      door("fingerbang", { loot: [] }, { took: loot }),
      [0, 0],
    );
    // She turns as the dragon's first round is dealt (swing 0).
    expect(party(joined).rival).toMatchObject({
      turnsAt: 0,
      turned: true,
      took: loot,
      news: { turned: true },
    });
    expect(party(joined).loot).toEqual([]);
    expect(party(joined).team).toBeUndefined();
    expect(party(joined).deeds).toContain("rival-turned");
    roundTrip(joined);
  });

  it("waits for a party with 3 hearts or more", () => {
    const low = join(
      door("fingerbang", { hearts: 2 }, { took: ["die"] }),
      [0, 0],
    );
    expect(party(low).rival?.turned).toBeUndefined();
    expect(party(low).team).toEqual(["dungeon.rival-fingerbang-door"]);
  });

  it("Dame Queefington sings the dragon's song: that swing is 2 harder", () => {
    const joined = join(door("queef"), [0, 0]);
    expect(party(joined).duel?.sung).toBe(true);
    expect(party(joined).rival?.turned).toBe(true);
    const dragon = advance(joined);
    const card = currentCard(dragon);
    const quiet = {
      ...dragon,
      quest: {
        ...dragon.quest!,
        party: { ...party(dragon), duel: { ...party(dragon).duel! } },
      },
    };
    delete quiet.quest.party.duel.sung;
    expect(rollBonus(dragon, card)).toBe(rollBonus(quiet, card) - 2);
    roundTrip(dragon);
  });

  it("Sir Chad on the team when the dragon falls takes the credit", () => {
    const chad = rivals.find((r) => r.who === "chad")!;
    const joined = join(door("chad"), [0.99]);
    let s = advance(joined);
    for (let i = 0; i < 20 && s.phase !== "complete"; i++)
      s = winRound(advance(s), i);
    expect(questRecord(s)?.won).toBe(true);
    expect(party(s).team).toContain(chad.plea.id);
    expect(ballad(s).at(-1)).toMatch(/^and Sir Chad slew .*Allegedly\.$/);
  });

  it("Sensei beaten twice is pinned at the door: saved for a heart, he lasts one swing", () => {
    // Two meetings won: the deed that pins him.
    let s = met("sensei", STEP.crossroads, {}, { won: 1 });
    const sensei = rivals.find((r) => r.who === "sensei")!;
    s = fight(place(s, STEP.crossroads, sensei.fights[0].id), 19);
    expect(party(s).deeds).toContain("rival-won-twice");
    // The door's variant is the pinned card.
    const stage = s.quest!.stages.find((st) => st.label === "The Lair's Door")!;
    const pinned = stage.variants!.find((v) =>
      v.deeds.includes("rival-won-twice"),
    )!;
    expect(pinned.cards.map((c) => c.id)).toEqual([senseiPinned.id]);
    const at = advance(
      place(
        met("sensei", STEP.door, {}, { won: 2 }),
        STEP.door,
        senseiPinned.id,
      ),
    );
    const saved = takeOffer(at, 0, seeded(1));
    expect(party(saved).hearts).toBe(29);
    expect(party(saved).team).toEqual([senseiPinned.id]);
    expect(party(saved).deeds).toContain("rival-saved");
    roundTrip(saved);
    // One swing at the dragon, and he is gone.
    const after = advance(rollTo(advance(saved), 2), seeded(2));
    expect(party(after).team).toBeUndefined();
    expect(party(after).deeds).toContain("ally-fell");
    roundTrip(after);
  });

  it("a refused rival who wins two swings of the duel goes into the lair first", () => {
    const r = rivals.find((x) => x.who === "chad")!;
    let s = takeOffer(
      door("chad", {}, { took: ["die", "shield"] }),
      1,
      seeded(3),
    );
    expect(currentCard(s).id).toBe(r.duel.id);
    s = fight(s, 2);
    expect(currentCard(s).id).toBe(r.duel.id);
    expect(party(s).rival?.duelLost).toBe(1);
    roundTrip(s);
    s = fight(s, 2);
    expect(finaleStage(s.quest!).label).toBe("The Dragon's Lair");
    expect(party(s).hits).toBe(1);
    expect(party(s).rival).toMatchObject({
      took: [],
      news: { gone: ["die", "shield"], first: true },
    });
    expect(party(s).deeds).toContain("rival-went-first");
    expect(party(s).deeds).not.toContain("rival-beaten");
    roundTrip(s);
  });

  it("Dame Queefington writes the ballad: kind when taken in, vicious when not", () => {
    const end = (s: SessionState) => {
      for (let i = 0; i < 30 && s.phase !== "complete"; i++)
        s = winRound(advance(s), i);
      return s;
    };
    const kind = end(join(door("queef"), [0.99]));
    const kindLines = ballad(kind);
    expect(kindLines[0]).toBe("Hear now of heroes, bold and true,");
    expect(kindLines.at(-1)).toBe("signed, Dame Queefington");
    expect(kindLines.at(-2)).toBe("and slew the dragon. Bravo. Encore.");
    // Skipped past without a duel won: vicious. The door's refusal deals
    // her duel; a party that wipes in it gets her vicious verse.
    const queef = rivals.find((x) => x.who === "queef")!;
    let s = takeOffer(door("queef", { hearts: 2, max: 30 }), 1, seeded(4));
    expect(currentCard(s).id).toBe(queef.duel.id);
    s = fight(s, 2);
    expect(s.phase).toBe("complete");
    expect(ballad(s)[0]).toBe("Here's a song of fools who tried,");
    expect(ballad(s).at(-2)).toBe("and died. The end. Applause, please.");
    for (const line of [...kindLines, ...ballad(s)])
      expect(line.length).toBeLessThanOrEqual(BALLAD_WIDTH);
  });

  it("rejects a malformed Phase 4 rival", () => {
    const s = join(door("fingerbang", {}, { won: 1 }), [0.3, 0.5]);
    roundTrip(s);
    const bad = (change: (r: Rival) => void) => {
      const next = structuredClone(s);
      change(next.quest!.party!.rival!);
      expect(() => parseSession(JSON.stringify(next))).toThrow();
    };
    bad((r) => (r.turnsAt = 3));
    bad((r) => (r.turned = false as unknown as true));
    bad((r) => (r.duelLost = -1));
  });
});
