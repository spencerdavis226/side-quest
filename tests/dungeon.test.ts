import { describe, expect, it } from "vitest";
import {
  advance,
  awaitingChoice,
  awaitingOffer,
  awaitingPress,
  awaitingSpoils,
  awaitingVerdict,
  canQuaff,
  cashOut,
  pressOn,
  canTakeOffer,
  canUseLoot,
  createSession,
  currentCard,
  findCard,
  finaleStage,
  hitsNeeded,
  omenEffect,
  omenForm,
  quaff,
  questRecord,
  replaySession,
  satchelSize,
  settleBattle,
  skipRoll,
  spendLoot,
  stackEffects,
  takeOffer,
  takeSpoils,
  wantedBoss,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice, rollWins } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import type { GameConfig, Loot, SessionState } from "../src/game/types";
import {
  BOSS_NEED,
  PARTY_HEARTS,
  QUAFF_DRINKS,
} from "../src/content/dungeon/shared";

// The party's starting hearts, before any adventurer or omen.
const H = PARTY_HEARTS;

const crawl: GameConfig = {
  version: 1,
  packIds: ["dungeon"],
  limit: null,
  quest: "dungeon",
};
// Park-Miller, with the seed scrambled first: from a small seed its first
// draws are tiny, which would always pick the same floors.
const seeded = (seed: number): Random => {
  seed = (Math.imul(seed, 2654435761) >>> 0) % 2147483646 || 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
};
// The first four draws pick the route, in run order (floor 1, the hidden
// room, floor 2, floor 3). Each depth has three floors: ORIGINAL takes the
// first (the Cellar, the Catacombs, the Drowned Taproom) and the first room
// (the Speakeasy), OTHER the second floors and the last room (the
// Basement), NEW the third floors (the Brewery, the Walk-in Freezer, the
// Rooftop Bar) and the middle room (the Back Office).
const ORIGINAL = [0.1, 0.1, 0.1, 0.1];
const OTHER = [0.5, 0.9, 0.5, 0.5];
const NEW = [0.9, 0.5, 0.9, 0.9];
const make = (floors = ORIGINAL, seed = 1) => {
  const rest = seeded(seed);
  const queue = [...floors];
  return createSession(crawl, cards, packs, () =>
    queue.length ? queue.shift()! : rest(),
  );
};
// Where the run is, step by step: the adventurer, tonight's omen, the
// queue, the first floor's eight rooms and its boss, a landing, the second
// floor and its boss, a landing, the third floor, closing time, Last Call.
const STEP = {
  adventurer: 0,
  omen: 1,
  queue: 2,
  floor1: 3,
  boss1: 11,
  landing1: 12,
  hidden: 13,
  keeper: 15,
  floor2: 16,
  boss2: 24,
  landing2: 25,
  floor3: 26,
  closing: 34,
  lastCall: 35,
};
// The run past the door, with no adventurer or omen: the Cellar's first
// room.
const start = (seed = 1) => fromStep(make(ORIGINAL, seed), STEP.floor1);
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
const party = (s: SessionState) => s.quest!.party!;
// Put a card in the run at the current step, by id.
const deal = (s: SessionState, id: string): SessionState => {
  const finale = [...s.quest!.finale];
  const at = finale.indexOf(id);
  if (at >= 0) finale[at] = finale[s.quest!.step];
  finale[s.quest!.step] = id;
  return { ...s, quest: { ...s.quest!, finale } };
};
// Every die shows `face`.
const rollTo = (s: SessionState, face: number) => {
  const sides = currentCard(s).dice!.sides;
  return returnToCard(rollDice(s, () => (face - 0.5) / sides));
};
const fight = (s: SessionState, face: number) =>
  advance(rollTo(advance(s), face));
function fromStep(s: SessionState, step: number): SessionState {
  return {
    ...s,
    quest: { ...s.quest!, step },
    discarded: step,
    previousId: step ? s.quest!.finale[step - 1] : null,
  };
}
// The adventurer (and tonight's omen) put aside from a fresh run, then the
// run moved on to `step`.
const adventure = (
  id: string,
  omen?: string,
  step: number = STEP.floor1,
): SessionState => {
  let s = advance(advance(deal(make(), `dungeon.class-${id}`)));
  if (omen) s = advance(advance(deal(s, `dungeon.omen-${omen}`)));
  return fromStep(s, step);
};

describe("Pub Crawl", () => {
  it("opens on an adventurer, an omen and the queue, then three floors of eight rooms, for the shared hearts", () => {
    const s = make();
    expect(s.quest).toMatchObject({ due: true, goal: 0, step: 0 });
    expect(party(s)).toEqual({
      hearts: H,
      max: H,
      loot: [],
      curse: null,
      hits: 0,
      rounds: 0,
      wiped: false,
      quaff: QUAFF_DRINKS,
      cup: 0,
    });
    expect(s.quest!.stages.map((st) => [st.label, st.pick])).toEqual([
      ["Your adventurer", 1],
      ["Tonight's omen", 1],
      ["The Queue", 1],
      ["The Cellar", 8],
      ["Cellar boss", 1],
      ["The Landing", 1],
      ["The Speakeasy", 2],
      ["Speakeasy boss", 1],
      ["The Catacombs", 8],
      ["Catacombs boss", 1],
      ["The Lower Landing", 1],
      ["The Drowned Taproom", 8],
      ["Closing Time", 1],
      ["Last call", 1],
    ]);
    expect(s.quest!.finale).toHaveLength(36);
    expect(currentCard(s).omen).toBeDefined();
    const at = (step: number) => findCard(s, s.quest!.finale[step])!;
    expect(at(STEP.hidden).ribbon).toBe("Speakeasy · Guard");
    expect(at(STEP.keeper)).toMatchObject({ encounter: "boss", hits: 2 });
    expect(at(STEP.keeper).spoils).toHaveLength(2);
    expect(at(STEP.omen).boon).toBeDefined();
    expect(at(STEP.queue)).toMatchObject({ encounter: "ambush", battle: true });
    expect(at(STEP.queue).hits).toBeUndefined();
    expect(
      [STEP.boss1, STEP.boss2, STEP.lastCall].map((step) => [
        at(step).encounter,
        at(step).hits,
      ]),
    ).toEqual([
      ["boss", 1],
      ["boss", 2],
      ["boss", 3],
    ]);
    expect(at(STEP.closing)).toMatchObject({ encounter: "ambush", hits: 2 });
    for (const step of [STEP.landing1, STEP.landing2])
      expect(at(step).encounter).toBe("rest");
    // The first two floors' bosses offer two trinkets; Last Call nothing.
    expect(at(STEP.boss1).spoils).toHaveLength(2);
    expect(at(STEP.boss2).spoils).toHaveLength(2);
    expect(at(STEP.lastCall).spoils).toBeUndefined();
    roundTrip(s);
    expect(make(OTHER).quest!.stages.map((st) => st.label)).toEqual([
      "Your adventurer",
      "Tonight's omen",
      "The Queue",
      "The Wine Cellar",
      "Wine Cellar boss",
      "The Landing",
      "The Basement",
      "Basement boss",
      "The Sewers",
      "Sewers boss",
      "The Lower Landing",
      "The Kitchen",
      "Closing Time",
      "Last call",
    ]);
    roundTrip(make(OTHER));
    const fresh = make(NEW);
    expect(fresh.quest!.stages.map((st) => st.label)).toEqual([
      "Your adventurer",
      "Tonight's omen",
      "The Queue",
      "The Brewery",
      "Brewery boss",
      "The Landing",
      "The Back Office",
      "Back Office boss",
      "The Walk-in Freezer",
      "Freezer boss",
      "The Lower Landing",
      "The Rooftop Bar",
      "Closing Time",
      "Last call",
    ]);
    roundTrip(fresh);
  });

  it("deals all nine floors, every hidden room, adventurer and omen across runs", () => {
    const floors = [0, 1, 2].map(() => new Set<string>());
    const rooms = new Set<string>();
    const adventurers = new Set<string>();
    const omens = new Set<string>();
    for (let seed = 1; seed <= 400; seed++) {
      const s = createSession(crawl, cards, packs, seeded(seed));
      const labels = s.quest!.stages.map((st) => st.label);
      [labels[3], labels[8], labels[11]].forEach((l, i) => floors[i].add(l));
      rooms.add(labels[6]);
      adventurers.add(s.quest!.finale[STEP.adventurer]);
      omens.add(s.quest!.finale[STEP.omen]);
    }
    // Three floors at each depth, and one of five hidden rooms: 135 routes.
    expect(floors.map((f) => f.size)).toEqual([3, 3, 3]);
    expect(rooms.size).toBe(5);
    expect(adventurers.size).toBe(12);
    expect(omens.size).toBe(12);
  });

  it("a lost room fight costs the party hearts, pours into the Cup, and the run moves on", () => {
    let s = deal(start(), "dungeon.gelatinous-shot");
    s = fight(s, 3);
    expect(party(s)).toMatchObject({ hearts: H - 1, cup: 1 });
    expect(s.quest!.step).toBe(STEP.floor1 + 1);
    expect(s.quest!.lost ?? 0).toBe(0);
    roundTrip(s);
    // A win pours nothing.
    expect(party(fight(deal(start(), "dungeon.gelatinous-shot"), 15)).cup).toBe(
      0,
    );
  });

  it("a won fight earns its loot; a lost one its curse", () => {
    let s = deal(start(), "dungeon.drunk-goblin");
    s = fight(s, 15);
    expect(party(s).loot).toEqual(["smoke"]);
    s = fight(deal(fromStep(start(), STEP.floor2), "dungeon.leech-swarm"), 2);
    expect(party(s)).toMatchObject({ curse: "bleed", hearts: H - 2 });
    roundTrip(s);
  });

  it("the satchel holds three; a fourth find is left behind", () => {
    let s = deal(start(), "dungeon.lost-and-found");
    s.quest!.party!.loot = ["draught", "die", "smoke"];
    s = advance(advance(s));
    expect(party(s).loot).toEqual(["draught", "die", "smoke"]);
  });

  it("a shrine heals, never past the party's full hearts", () => {
    let s = deal(start(), "dungeon.wishing-drain");
    s.quest!.party!.hearts = H - 3;
    s = advance(advance(s));
    expect(party(s).hearts).toBe(H - 1);
    s = deal(s, "dungeon.lost-and-found");
    s.quest!.party!.hearts = H;
    expect(
      party(advance(advance(deal(s, "dungeon.wishing-drain")))).hearts,
    ).toBe(H);
  });

  it("a trial waits for Won or Lost, and a lost one pours into the Cup", () => {
    let s = advance(deal(start(), "dungeon.riddling-tap"));
    expect(awaitingVerdict(s)).toBe(true);
    expect(advance(s)).toBe(s);
    expect(party(settleBattle(s, true))).toMatchObject({ hearts: H, cup: 0 });
    s = settleBattle(s, false);
    expect(party(s)).toMatchObject({ hearts: H - 1, cup: 1 });
    roundTrip(s);
  });

  it("walking away from a relic is neither a win nor a loss", () => {
    let s = advance(deal(start(), "dungeon.mimic-cooler"));
    expect(awaitingChoice(s)).toBe(true);
    s = skipRoll(s);
    expect(party(s)).toMatchObject({ hearts: H, loot: [], cup: 0 });
    expect(s.quest!.step).toBe(STEP.floor1 + 1);
    roundTrip(s);
  });

  it("a boss is dealt again until it falls; then its curse and the jinx lift, the Quaff comes back, and it drops its trinket", () => {
    let s = fromStep(start(), STEP.boss2);
    s = deal(s, "dungeon.hangover-hydra");
    Object.assign(s.quest!.party!, { curse: "hex", quaffed: true });
    s = fight(s, 2); // a miss
    expect(currentCard(s).id).toBe("dungeon.hangover-hydra");
    expect(party(s)).toMatchObject({
      hearts: H - 2,
      hits: 0,
      rounds: 0,
      cup: 1,
    });
    expect(s.quest!.lost).toBe(1);
    roundTrip(s);
    s = fight(s, 14); // one head off
    expect(currentCard(s).id).toBe("dungeon.hangover-hydra");
    expect(party(s)).toMatchObject({ hits: 1, rounds: 1, curse: "hex" });
    expect(party(s).boons).toBeUndefined();
    roundTrip(s);
    s = fight(s, 14); // and the other: it falls, and offers its spoils
    expect(awaitingSpoils(s)).toBe(true);
    expect(advance(s)).toBe(s);
    expect(currentCard(s).spoils!.map((b) => b.name)).toEqual([
      "Hydra Tooth",
      "Hydra Scale",
    ]);
    roundTrip(s);
    s = takeSpoils(s, 0);
    expect(s.quest!.step).toBe(STEP.landing2);
    expect(finaleStage(s.quest!).label).toBe("The Lower Landing");
    expect(party(s)).toMatchObject({
      hits: 0,
      rounds: 1,
      curse: null,
      boons: ["dungeon.hangover-hydra#0"],
    });
    expect(party(s).quaffed).toBeUndefined();
    // The Hydra Tooth: +2 to boss rolls from now on.
    expect(omenEffect(s.quest)).toMatchObject({ roll: { boss: 2 } });
    roundTrip(s);
  });

  it("a natural 20 doubles what a win brings; a natural 1 doubles a loss's cost", () => {
    // A room: 2 hearts on a loss (floor 2), 4 on a natural 1.
    const room = () =>
      deal(fromStep(start(), STEP.floor2), "dungeon.bachelor-ghosts");
    expect(party(fight(room(), 2)).hearts).toBe(H - 2);
    expect(party(fight(room(), 1)).hearts).toBe(H - 4);
    // A shield still takes the whole doubled loss.
    const shielded = room();
    shielded.quest!.party!.loot = ["shield"];
    expect(party(fight(shielded, 1))).toMatchObject({ hearts: H, loot: [] });
    // A room's item comes twice on a natural 20, room permitting.
    const goblin = deal(start(), "dungeon.drunk-goblin");
    expect(party(fight(goblin, 20)).loot).toEqual(["smoke", "smoke"]);
    // A trinket comes once, natural or not.
    const s = takeOffer(advance(deal(start(), "dungeon.two-hatches")), 1);
    expect(party(takeSpoils(fight(s, 20), 0)).boons).toEqual([
      `${currentCard(s).id}#0`,
    ]);
    // A boss takes two swings from a natural 20.
    let b = deal(fromStep(start(), STEP.boss2), "dungeon.hangover-hydra");
    b = takeSpoils(fight(b, 20), 1);
    expect(b.quest!.step).toBe(STEP.landing2);
    expect(party(b)).toMatchObject({ hits: 0, rounds: 0 });
    roundTrip(b);
  });

  it("the last boss falling wins the crawl", () => {
    let s = deal(fromStep(start(), STEP.lastCall), "dungeon.last-call-lich");
    for (let i = 0; i < 3; i++) s = fight(s, 15);
    expect(s.phase).toBe("complete");
    expect(questRecord(s)!.won).toBe(true);
    roundTrip(s);
  });

  it("losing the last heart wipes the party and ends the game", () => {
    let s = deal(start(), "dungeon.tab-goblin");
    s.quest!.party!.hearts = 1;
    s = fight(s, 1);
    expect(s.phase).toBe("complete");
    expect(party(s)).toMatchObject({ hearts: 0, wiped: true, cup: 1 });
    expect(questRecord(s)!.won).toBe(false);
    roundTrip(s);
    // Wiping on a boss mid-fight is the end too.
    let b = deal(fromStep(start(), STEP.boss1), "dungeon.keg-golem");
    b.quest!.party!.hearts = 2;
    b = fight(b, 1);
    expect(b.phase).toBe("complete");
    roundTrip(b);
  });

  it("the shield takes a loss whole; bleeding costs one more; a hex seals the satchel", () => {
    const at = (loot: Loot[], curse: "bleed" | "hex" | null) => {
      const s = deal(fromStep(start(), STEP.floor2), "dungeon.bachelor-ghosts");
      Object.assign(s.quest!.party!, { loot, curse });
      return party(fight(s, 2));
    };
    expect(at(["shield"], null)).toMatchObject({ hearts: H, loot: [] });
    expect(at([], "bleed")).toMatchObject({ hearts: H - 3 });
    expect(at(["shield"], "hex")).toMatchObject({
      hearts: H - 2,
      loot: ["shield"],
    });
  });

  it("items: a draught heals one, a loaded die rerolls a loss, a smoke bomb escapes a room but not a boss", () => {
    let s = deal(start(), "dungeon.gelatinous-shot");
    s.quest!.party!.loot = ["draught", "die", "smoke"];
    expect(canUseLoot(s, "draught")).toBe(false); // full hearts
    s.quest!.party!.hearts = H - 4;
    s = spendLoot(s, "draught");
    expect(party(s)).toMatchObject({ hearts: H - 3, loot: ["die", "smoke"] });
    s = advance(s);
    expect(canUseLoot(s, "die")).toBe(false);
    s = rollTo(s, 2);
    expect(canUseLoot(s, "die")).toBe(true);
    expect(canUseLoot(s, "smoke")).toBe(false);
    s = spendLoot(s, "die");
    expect(s.roll).toBeNull();
    expect(party(s).loot).toEqual(["smoke"]);
    roundTrip(s);
    s = advance(rollTo(s, 18));
    expect(party(s).hearts).toBe(H - 3);
    // Smoke: past a room before it is rolled, never past a boss.
    s = advance(deal(s, "dungeon.keg-spider"));
    expect(canUseLoot(s, "smoke")).toBe(true);
    const fled = spendLoot(s, "smoke");
    expect(fled.quest!.step).toBe(s.quest!.step + 1);
    expect(party(fled)).toMatchObject({ hearts: H - 3, loot: [], cup: 0 });
    roundTrip(fled);
    const boss = advance(
      deal(fromStep(start(), STEP.boss1), "dungeon.keg-golem"),
    );
    boss.quest!.party!.loot = ["smoke"];
    expect(canUseLoot(boss, "smoke")).toBe(false);
    // A hex seals every item.
    s.quest!.party!.curse = "hex";
    expect(canUseLoot(s, "smoke")).toBe(false);
  });

  it("the Quaff rerolls a lost fight for drinks, once until the next boss falls", () => {
    let s = advance(deal(start(), "dungeon.gelatinous-shot"));
    expect(canQuaff(s)).toBe(false); // nothing rolled yet
    s = rollTo(s, 15);
    expect(canQuaff(s)).toBe(false); // a win needs no Quaff
    s = { ...s, roll: null };
    s = rollTo(s, 2);
    // A hex seals the satchel, not the Quaff.
    s.quest!.party!.curse = "hex";
    expect(canQuaff(s)).toBe(true);
    s = quaff(s);
    expect(s.roll).toBeNull();
    expect(party(s)).toMatchObject({ quaffed: true, hearts: H });
    roundTrip(s);
    s = rollTo(s, 3);
    expect(canQuaff(s)).toBe(false);
    expect(quaff(s)).toBe(s);
    s = advance(s);
    expect(party(s)).toMatchObject({ hearts: H - 1, quaffed: true });
    // A boss falling brings it back (the previous test); an ambush doesn't.
    let a = deal(start(), "dungeon.lost-bridesmaids");
    a.quest!.party!.quaffed = true;
    a = fight(fight(a, 15), 15);
    expect(party(a).quaffed).toBe(true);
    // A trial has no roll to Quaff.
    const t = advance(deal(start(), "dungeon.riddling-tap"));
    expect(canQuaff(t)).toBe(false);
  });

  it("a jinx lands on a loss and holds until the floor's boss falls", () => {
    let s = fight(deal(start(), "dungeon.goblin-shaman"), 2);
    expect(party(s).jinx).toBe("dungeon.goblin-shaman");
    expect(questRecord(s)!.jinx?.jinx?.name).toBe("Goblin Tongue");
    roundTrip(s);
    // A win lays nothing.
    expect(
      party(fight(deal(start(), "dungeon.goblin-shaman"), 15)).jinx,
    ).toBeUndefined();
    // A newer jinx replaces the old one; an ambush's fall keeps it.
    s = fromStep(s, STEP.boss1);
    s = deal(s, "dungeon.rat-king");
    s = fight(s, 2);
    expect(party(s).jinx).toBe("dungeon.rat-king");
    s = takeSpoils(fight(s, 15), 0);
    expect(party(s).jinx).toBeUndefined();
    roundTrip(s);
  });

  it("the adventurer is put aside first, sets the party's power and the dice colours", () => {
    let s = advance(advance(deal(make(), "dungeon.class-paladin")));
    expect(party(s)).toMatchObject({
      hearts: H + 1,
      max: H + 1,
      loot: ["shield"],
      omen: "dungeon.class-paladin",
    });
    expect(omenForm(s.quest)).toMatchObject({
      title: "Paladin",
      next: "Crusader",
      palette: { primary: "#2f5a8c" },
    });
    roundTrip(s);
    // Rolls feel the adventurer: a Barbarian is +2 against a boss.
    s = adventure("barbarian", undefined, STEP.boss1);
    s = rollTo(advance(deal(s, "dungeon.keg-golem")), BOSS_NEED[0] - 2);
    expect(s.roll).toMatchObject({ bonus: 2 });
    expect(rollWins(currentCard(s).dice!, s.roll!.values, s.roll!)).toBe(true);
  });

  it("a landing levels the adventurer up for drinks, or rests", () => {
    const at = (id: string) =>
      advance(
        deal(
          adventure(id, undefined, STEP.landing1),
          "dungeon.landing-stairwell",
        ),
      );
    const s = at("barbarian");
    expect(awaitingOffer(s)).toBe(true);
    expect(currentCard(s).offers!.map((o) => o.label)).toEqual([
      "Level up · drink 3",
      "Rest",
    ]);
    const up = takeOffer(s, 0);
    expect(party(up)).toMatchObject({ form: 1, max: H + 2, hearts: H + 2 });
    expect(omenForm(up.quest)).toMatchObject({
      title: "Berserker",
      next: "Warlord",
    });
    expect(up.quest!.step).toBe(STEP.hidden);
    roundTrip(up);
    s.quest!.party!.hearts = H - 4;
    expect(party(takeOffer(s, 1))).toMatchObject({ hearts: H - 1 });
    // A fully levelled adventurer can only rest.
    s.quest!.party!.form = 2;
    expect(canTakeOffer(s, 0)).toBe(false);
    expect(canTakeOffer(s, 1)).toBe(true);
    // The Plus-One levels up into something worse.
    const plus = takeOffer(at("plus-one"), 0);
    expect(party(plus)).toMatchObject({ max: H - 4, form: 1 });
    expect(satchelSize(plus.quest)).toBe(2);
  });

  it("a Dog-Eared Tome levels the adventurer up on the spot", () => {
    const s = adventure("wizard");
    s.quest!.party!.loot = [...party(s).loot, "candy"];
    expect(canUseLoot(s, "candy")).toBe(true);
    const read = spendLoot(s, "candy");
    expect(party(read)).toMatchObject({ form: 1, max: H - 1 });
    expect(party(read).loot).toEqual(["die", "die", "die"]);
    roundTrip(read);
  });

  it("tonight's omen is a boon that stacks with the adventurer", () => {
    const tonight = (id: string) =>
      advance(advance(deal(fromStep(make(), STEP.omen), `dungeon.omen-${id}`)));
    // Starting hearts and items.
    let s = tonight("running-a-tab");
    expect(party(s)).toMatchObject({
      hearts: H - 2,
      max: H - 2,
      loot: ["shield", "draught"],
      boons: ["dungeon.omen-running-a-tab"],
    });
    expect(party(s).omen).toBeUndefined();
    expect(s.quest!.step).toBe(STEP.queue);
    roundTrip(s);
    // A bigger satchel.
    s = tonight("cargo-shorts");
    expect(satchelSize(s.quest)).toBe(4);
    // A smaller one: a save holding more than it fits is rejected.
    s = tonight("butterfingers");
    expect(party(s)).toMatchObject({ hearts: H + 2, max: H + 2 });
    const over = structuredClone(s);
    over.quest!.party!.loot = ["die", "die", "die"];
    expect(() => parseSession(JSON.stringify(over))).toThrow();
    // Dearer monsters, but not traps.
    s = fromStep(tonight("blood-moon"), STEP.floor1);
    expect(party(fight(deal(s, "dungeon.gelatinous-shot"), 3)).hearts).toBe(H);
    expect(party(fight(deal(s, "dungeon.sticky-floor"), 3)).hearts).toBe(H + 1);
    // Kinder heals.
    s = fromStep(tonight("happy-hour"), STEP.floor1);
    s.quest!.party!.hearts = 6;
    expect(
      party(advance(advance(deal(s, "dungeon.wishing-drain")))).hearts,
    ).toBe(9);
    // A longer boss fight; an ambush is not a boss.
    s = tonight("lock-in");
    expect(hitsNeeded(s.quest, findCard(s, "dungeon.last-call-lich")!)).toBe(4);
    expect(hitsNeeded(s.quest, findCard(s, "dungeon.lost-bridesmaids")!)).toBe(
      2,
    );
    // A table rule changes nothing in the engine.
    expect(party(tonight("lefty-night"))).toMatchObject({
      hearts: H,
      loot: [],
    });
    // Stacked: a Rogue's extra slot and the cargo shorts' make five; a
    // Paladin with the regulars has fifteen hearts.
    expect(satchelSize(adventure("rogue", "cargo-shorts").quest)).toBe(5);
    expect(party(adventure("paladin", "the-regulars")).max).toBe(H + 3);
    // Levelling up keeps the omen's hearts.
    const up = takeOffer(
      advance(
        deal(
          adventure("paladin", "the-regulars", STEP.landing1),
          "dungeon.landing-stairwell",
        ),
      ),
      0,
    );
    expect(party(up).max).toBe(H + 3);
    roundTrip(up);
  });

  it("stacks effects: numbers add, naturals widen, a boon's satchel moves the size", () => {
    expect(
      stackEffects({ roll: { boss: 2 }, satchel: 4, crit: 19 }, [
        { roll: { boss: 1, trap: 2 }, satchel: 4, hearts: 2 },
        { satchel: 2, crit: 18, fumble: 2, hurt: { monster: 1 } },
      ]),
    ).toEqual({
      roll: { boss: 3, trap: 2 },
      satchel: 4,
      crit: 18,
      fumble: 2,
      hearts: 2,
      hurt: { monster: 1 },
    });
    const base = { heal: 1 };
    expect(stackEffects(base, [])).toBe(base);
  });

  it("an elite's trinket comes with the win and holds for the run", () => {
    const loud = takeOffer(
      advance(deal(start(), "dungeon.two-hatches")),
      1,
      seeded(4),
    );
    const elite = currentCard(loud);
    expect(elite.encounter).toBe("elite");
    expect([
      "dungeon.grease-trap-horror",
      "dungeon.health-inspector",
      "dungeon.keg-mimic-queen",
    ]).toContain(elite.id);
    roundTrip(loud);
    const won = takeSpoils(fight(loud, 19), 1);
    expect(party(won).boons).toEqual([`${elite.id}#1`]);
    expect(questRecord(won)!.boons.map((b) => b.boon.name)).toEqual([
      elite.spoils![1].name,
    ]);
    roundTrip(won);
    // A lost elite drops nothing.
    expect(party(fight(loud, 2)).boons).toBeUndefined();
    // The Queen's Tap: a heart more, now and for good.
    const queen = takeSpoils(
      fight(deal(start(), "dungeon.keg-mimic-queen"), 19),
      0,
    );
    expect(party(queen)).toMatchObject({ hearts: H + 1, max: H + 1 });
  });

  it("a won fight's spoils wait for the table to pick one", () => {
    // An elite is never a floor's first room: a fork comes before it.
    let s = advance(
      deal(fromStep(start(), STEP.floor1 + 1), "dungeon.keg-mimic-queen"),
    );
    // A lost elite offers nothing, and the table can't pick early.
    expect(awaitingSpoils(rollTo(s, 2))).toBe(false);
    expect(takeSpoils(s, 0)).toBe(s);
    s = rollTo(s, 19);
    expect(awaitingSpoils(s)).toBe(true);
    expect(takeSpoils(s, 2)).toBe(s);
    expect(takeSpoils(s, -1)).toBe(s);
    const alt = takeSpoils(s, 1);
    expect(party(alt)).toMatchObject({
      boons: ["dungeon.keg-mimic-queen#1"],
      loot: ["draught"],
    });
    expect(alt.quest!.step).toBe(STEP.floor1 + 2);
    roundTrip(alt);
    // A boss offers nothing until its last swing lands.
    let b = advance(
      deal(fromStep(start(), STEP.boss2), "dungeon.hangover-hydra"),
    );
    b = rollTo(b, 15);
    expect(awaitingSpoils(b)).toBe(false);
    // In the plain modes a won elite is just put aside.
    const plain = createSession(
      { version: 1, packIds: ["dungeon"], limit: 30 },
      cards,
      packs,
      seeded(3),
    );
    const at = plain.order.indexOf("dungeon.keg-mimic-queen");
    const p = {
      ...plain,
      order: [
        "dungeon.keg-mimic-queen",
        ...plain.order.filter((_, i) => i !== at),
      ],
    };
    const won = advance(rollTo(advance(p), 19));
    expect(won.discarded).toBe(1);
  });

  it("pushing your luck banks a prize a win, rolls lower each time, and a loss loses the lot", () => {
    // The One-Armed Bandit: a die, a draught, a shield.
    const bandit = () =>
      advance(
        deal(fromStep(start(), STEP.floor1 + 1), "dungeon.one-armed-bandit"),
      );
    let s = rollTo(bandit(), 15);
    expect(awaitingPress(s)).toBe(true);
    expect(advance(s)).toBe(s);
    // Cash out at once: the first prize.
    expect(party(cashOut(s))).toMatchObject({ loot: ["die"] });
    expect(party(cashOut(s)).press).toBeUndefined();
    // Again: banked, rolled 2 lower.
    s = pressOn(s);
    expect(s.roll).toBeNull();
    expect(party(s).press).toBe(1);
    roundTrip(s);
    s = rollTo(s, 15);
    expect(s.roll).toMatchObject({ bonus: -2 });
    expect(party(cashOut(s)).loot).toEqual(["die", "draught"]);
    // The third win is the last prize: it cashes out on a tap.
    s = rollTo(pressOn(s), 15);
    expect(s.roll).toMatchObject({ bonus: -4 });
    expect(awaitingPress(s)).toBe(false);
    expect(party(advance(s))).toMatchObject({
      loot: ["die", "draught", "shield"],
    });
    // A loss forfeits everything banked and costs a heart.
    const lost = advance(rollTo(pressOn(rollTo(bandit(), 15)), 2));
    expect(party(lost)).toMatchObject({ loot: [], hearts: H - 1, cup: 1 });
    expect(party(lost).press).toBeUndefined();
    roundTrip(lost);
    // No smoke bomb out of a push under way.
    const midway = pressOn(rollTo(bandit(), 15));
    midway.quest!.party!.loot = ["smoke"];
    expect(canUseLoot(midway, "smoke")).toBe(false);
  });

  it("a Bar Tab passes a lost fight's drinks on, once; the hearts still go", () => {
    let s = advance(deal(start(), "dungeon.gelatinous-shot"));
    s.quest!.party!.loot = ["round", "round"];
    expect(canUseLoot(s, "round")).toBe(false); // nothing lost yet
    s = rollTo(s, 2);
    expect(canUseLoot(s, "round")).toBe(true);
    s = spendLoot(s, "round");
    expect(party(s)).toMatchObject({ loot: ["round"], passed: s.discarded });
    expect(canUseLoot(s, "round")).toBe(false); // once a fight
    roundTrip(s);
    s = advance(s);
    expect(party(s).hearts).toBe(H - 1);
    // A save can't pass a draw that hasn't happened.
    const forged = structuredClone(s);
    forged.quest!.party!.passed = forged.discarded + 1;
    expect(() => parseSession(JSON.stringify(forged))).toThrow();
  });

  it("the wanted poster names the floor's boss", () => {
    const s = start();
    expect(wantedBoss(s.quest!)!.id).toBe(s.quest!.finale[STEP.boss1]);
    expect(wantedBoss(fromStep(s, STEP.boss1).quest!)!.id).toBe(
      s.quest!.finale[STEP.boss1],
    );
    expect(wantedBoss(fromStep(s, STEP.floor2).quest!)!.id).toBe(
      s.quest!.finale[STEP.boss2],
    );
    // The third floor ends at closing time, not a boss.
    expect(wantedBoss(fromStep(s, STEP.floor3).quest!)).toBeUndefined();
  });

  it("the queue is one fight against the rival party; a loss can jinx", () => {
    let s = fromStep(make(), STEP.queue);
    s = fight(deal(s, "dungeon.queue-group-name"), 2);
    expect(party(s)).toMatchObject({
      hearts: H - 1,
      cup: 1,
      jinx: "dungeon.queue-group-name",
    });
    expect(s.quest!.step).toBe(STEP.floor1);
    roundTrip(s);
    const won = fight(
      deal(fromStep(make(), STEP.queue), "dungeon.queue-group-name"),
      15,
    );
    expect(party(won)).toMatchObject({ hearts: H, loot: ["die"] });
  });

  it("a merchant sells for drinks or hearts, never the last heart", () => {
    const s = advance(deal(start(), "dungeon.rat-fence"));
    expect(awaitingOffer(s)).toBe(true);
    expect(advance(s)).toBe(s);
    const bought = takeOffer(s, 0);
    expect(party(bought)).toMatchObject({ hearts: H, loot: ["draught"] });
    expect(bought.quest!.step).toBe(STEP.floor1 + 1);
    roundTrip(bought);
    expect(party(takeOffer(s, 1))).toMatchObject({
      hearts: H - 1,
      loot: ["shield"],
    });
    expect(party(takeOffer(s, 2))).toMatchObject({ hearts: H, loot: [] });
    s.quest!.party!.hearts = 1;
    expect(canTakeOffer(s, 1)).toBe(false);
    expect(takeOffer(s, 1)).toBe(s);
    expect(canTakeOffer(s, 3)).toBe(false);
  });

  it("a fork's quiet door changes nothing", () => {
    const s = advance(deal(start(), "dungeon.two-hatches"));
    const next = s.quest!.finale[STEP.floor1 + 1];
    expect(takeOffer(s, 0).quest!.finale[STEP.floor1 + 1]).toBe(next);
  });

  it("a fork is never the last room of its floor", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const s = createSession(crawl, cards, packs, seeded(seed));
      let first = 0;
      for (const stage of s.quest!.stages) {
        const last = findCard(s, s.quest!.finale[first + stage.pick - 1])!;
        if (stage.pick > 1) expect(last.encounter).not.toBe("fork");
        first += stage.pick;
      }
    }
  });

  it("an ambush is dealt again until beaten twice, and lifts no curse", () => {
    let s = deal(start(), "dungeon.lost-bridesmaids");
    s.quest!.party!.curse = "bleed";
    s = fight(s, 15);
    expect(currentCard(s).id).toBe("dungeon.lost-bridesmaids");
    expect(party(s)).toMatchObject({ hits: 1, rounds: 1 });
    roundTrip(s);
    s = fight(s, 2); // a miss: one heart, and one more for bleeding
    expect(party(s)).toMatchObject({ hearts: H - 2, hits: 1 });
    s = fight(s, 15);
    expect(s.quest!.step).toBe(STEP.floor1 + 1);
    expect(party(s)).toMatchObject({ hits: 0, curse: "bleed" });
    roundTrip(s);
    // The record keeps it among the floor's rooms, not as a boss.
    expect(questRecord(s)!.stages[3]).toMatchObject({ boss: false });
  });

  it("replay starts a fresh crawl, with a fresh Quaff and an empty Cup", () => {
    let s = fight(deal(start(), "dungeon.tab-goblin"), 1);
    s = takeSpoils(
      fight(deal(fromStep(s, STEP.boss1), "dungeon.keg-golem"), 15),
      0,
    );
    s.quest!.party!.quaffed = true;
    s = replaySession(s, seeded(9));
    expect(s.quest).toMatchObject({ due: true, step: 0, lost: 0 });
    expect(party(s)).toEqual({
      hearts: H,
      max: H,
      loot: [],
      curse: null,
      hits: 0,
      rounds: 0,
      wiped: false,
      quaff: QUAFF_DRINKS,
      cup: 0,
    });
    roundTrip(s);
  });

  it("the plain modes play the rooms as ordinary cards, without the finds", () => {
    const s = createSession(
      { version: 1, packIds: ["dungeon"], limit: 30 },
      cards,
      packs,
      seeded(3),
    );
    expect(s.quest).toBeUndefined();
    expect(s.cards).toHaveLength(245);
    expect(s.cards.some((c) => c.reward && !c.battle)).toBe(false);
    expect(
      s.cards.some(
        (c) =>
          c.offers ||
          c.omen ||
          c.encounter === "omen" ||
          c.id.includes("queue-"),
      ),
    ).toBe(false);
    // A trial is put aside with a tap, no verdict; a jinx card plays plain.
    const trial = {
      ...s,
      order: [
        "dungeon.riddling-tap",
        "dungeon.goblin-shaman",
        ...s.order.filter(
          (id) =>
            id !== "dungeon.riddling-tap" && id !== "dungeon.goblin-shaman",
        ),
      ],
    };
    const after = advance(advance(trial));
    expect(after.discarded).toBe(1);
    expect(currentCard(after).id).toBe("dungeon.goblin-shaman");
  });

  it("rejects saves whose party does not add up", () => {
    const s = fight(
      deal(fromStep(start(), STEP.boss2), "dungeon.hangover-hydra"),
      14,
    );
    const tamper = (change: (q: SessionState) => void) => {
      const copy = structuredClone(s);
      change(copy);
      return () => parseSession(JSON.stringify(copy));
    };
    expect(tamper(() => {})).not.toThrow();
    expect(tamper((q) => (q.quest!.party!.hearts = 13))).toThrow();
    expect(tamper((q) => (q.quest!.party!.hits = 2))).toThrow();
    expect(tamper((q) => (q.quest!.party!.rounds = 0))).toThrow();
    expect(tamper((q) => (q.quest!.party!.wiped = true))).toThrow();
    expect(tamper((q) => (q.quest!.party!.loot = ["beer" as Loot]))).toThrow();
    expect(
      tamper((q) => (q.quest!.party!.loot = ["die", "die", "die", "die"])),
    ).toThrow();
    expect(tamper((q) => delete q.quest!.party)).toThrow();
    // Boons and jinxes only from cards already dealt that carry them.
    expect(
      tamper(
        (q) => (q.quest!.party!.boons = [q.quest!.finale[STEP.boss1 + 30]]),
      ),
    ).toThrow();
    expect(
      tamper((q) => (q.quest!.party!.boons = [q.quest!.finale[STEP.floor1]])),
    ).toThrow();
    expect(
      tamper((q) => (q.quest!.party!.jinx = q.quest!.finale[STEP.lastCall])),
    ).toThrow();
    expect(tamper((q) => (q.quest!.party!.cup = -1))).toThrow();
    // A spoil the boss doesn't offer, or taken twice.
    expect(
      tamper(
        (q) => (q.quest!.party!.boons = [`${q.quest!.finale[STEP.boss1]}#7`]),
      ),
    ).toThrow();
    expect(
      tamper(
        (q) =>
          (q.quest!.party!.boons = [
            `${q.quest!.finale[STEP.boss1]}#0`,
            `${q.quest!.finale[STEP.boss1]}#1`,
          ]),
      ),
    ).toThrow();
    expect(tamper((q) => (q.quest!.party!.quaffed = false as never))).toThrow();
    expect(
      tamper((q) => {
        delete q.quest!.party!.quaff;
        q.quest!.party!.quaffed = true;
      }),
    ).toThrow();
  });

  it("loads a crawl saved before adventurers, when the omen was the run's own", () => {
    // That save opened on tonight's omen (an `omen` card, `party.omen`),
    // then seven rooms a floor.
    const old = structuredClone(make());
    const omen = findCard(old, "dungeon.omen-the-regulars")!;
    const legacy = { ...omen, omen: omen.boon!.effect };
    delete (legacy as { boon?: unknown }).boon;
    old.quest!.stages = old.quest!.stages.slice(1).map((st, i) => ({
      label: st.label,
      pick: st.pick,
      cards: i === 0 ? [legacy] : st.cards,
      ...(st.elite ? { elite: st.elite } : {}),
    }));
    old.quest!.finale = [legacy.id, ...old.quest!.finale.slice(2)];
    delete old.quest!.party!.quaff;
    delete old.quest!.party!.cup;
    let s = advance(advance(old));
    expect(party(s)).toMatchObject({
      hearts: H + 2,
      max: H + 2,
      omen: legacy.id,
    });
    expect(party(s).boons).toBeUndefined();
    expect(canQuaff(s)).toBe(false);
    roundTrip(s);
    s = fight(deal(fromStep(s, 2), "dungeon.gelatinous-shot"), 2);
    expect(party(s).cup).toBeUndefined();
    roundTrip(s);
    // A tampered omen is rejected.
    const forged = structuredClone(start());
    forged.quest!.party!.omen = "dungeon.gelatinous-shot";
    expect(() => parseSession(JSON.stringify(forged))).toThrow();
  });
});
