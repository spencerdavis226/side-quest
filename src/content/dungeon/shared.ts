import type {
  CardDefinition,
  DiceDefinition,
  DiceOutcome,
  Encounter,
  Jinx,
  Loot,
  Offer,
  OmenEffect,
  Slot,
} from "../../game/types";
import { cardFactory, choice, rollTable } from "../author";
import { describeOmen, dungeonOmenWords } from "../../game/omenText";

// Dungeon night's builders and tuning, shared by every floor. A card's
// numbers (its target, what a loss costs) come from its floor's depth
// through the constants below, never card by card: retune here and keep
// `tests/dungeon.balance.test.ts` passing.
//
// Ribbon colours, one meaning each: gold for a fight, violet for anything
// found or chosen (treasure, relics, shrines, merchants, forks, landings),
// crimson for a boss or the rival party, pearl for the adventurer and
// tonight's omen.
export const card = cardFactory("dungeon");

/** A floor: its ribbon name and its index; `tier(floor)` is its depth
 * (0 to 2), which sets the odds. */
export type Floor = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const FLOORS = [
  "Cellar",
  "Catacombs",
  "Taproom",
  "Wine Cellar",
  "Sewers",
  "Kitchen",
  // The third way down at each depth (2026-10-17).
  "Brewery",
  "Freezer",
  "Rooftop",
] as const;
export const tier = (floor: Floor) => (floor % 3) as 0 | 1 | 2;

/** The d20 a room monster needs, depth by depth. */
export const NEED = [7, 9, 11] as const;
/** The d20 a trap's save needs. */
export const SAVE = [9, 11, 13] as const;
/** Hearts a lost room fight costs. */
export const HURT = [1, 2, 3] as const;
/** A boss's target and the hearts a missed swing costs. */
export const BOSS_NEED = [9, 12, 13] as const;
export const BOSS_HURT = [2, 2, 2] as const;
/** Swings a floor boss takes: two on the first floors, three at Last Call
 * (2026-10-25: two beats at least, so every boss has a second act). */
export const BOSS_HITS = [2, 2, 3] as const;
/** An elite: harder than the floor, a heart dearer, and it always drops a
 * trinket. */
export const ELITE_NEED = [10, 12, 14] as const;
export const ELITE_HURT = [2, 3, 3] as const;
/** An ambush is beaten twice, each loss a little cheaper than a room's. */
export const AMBUSH_HURT = [1, 1, 2] as const;
/** The rival party: in the queue at the door, and again at closing time,
 * when they have to be beaten twice. */
export const QUEUE_NEED = 8;
export const QUEUE_HURT = 1;
export const CLOSING_NEED = 12;
export const CLOSING_HURT = 3;
/** The rival party on the stairs, between the second landing and the third
 * floor (2026-10-25): one fight, between the door's odds and closing
 * time's. */
export const STAIRS_NEED = 10;
export const STAIRS_HURT = 2;
/** A push-your-luck room's first pull, depth by depth; each pull after is
 * 2 harder (`PRESS_STEP` in the engine). */
export const GAMBLE_NEED = [7, 8, 9] as const;
/** The hidden room behind the bookcase, between the first landing and the
 * second floor: its guards (two of three) and its keeper, beaten twice. */
export const GUARD_NEED = 8;
export const GUARD_HURT = 2;
export const KEEPER_NEED = 10;
export const KEEPER_HURT = 2;
/** A landing between floors: level up for drinks, or rest for hearts. */
export const LANDING_HEAL = 3;
export const LEVEL_DRINK = 3;
/** The party's shared hearts before the adventurer. */
export const PARTY_HEARTS = 12;

/** A d20 table: below `need` loses, `need` and up wins. A `crit` replaces
 * the win on a natural 20, a `fumble` the loss on a natural 1. */
export function d20(
  need: number,
  lose: string,
  win: string,
  extra: { crit?: string; fumble?: string } = {},
): DiceDefinition {
  const outcomes: DiceOutcome[] = [];
  const low = extra.fumble ? 2 : 1;
  if (extra.fumble)
    outcomes.push({ min: 1, max: 1, instruction: extra.fumble });
  outcomes.push({ min: low, max: need - 1, instruction: lose });
  outcomes.push({
    min: need,
    max: extra.crit ? 19 : 20,
    instruction: win,
    win: true,
  });
  if (extra.crit)
    outcomes.push({ min: 20, max: 20, instruction: extra.crit, win: true });
  return rollTable(1, 20, outcomes);
}

/** How a fight is rolled, from the d20 its card needs (the floor's odds),
 * so the constants above retune every kind of roll. */
export type Roll = (need: number) => DiceDefinition;

/** The d6 faces that lose at a d20 need: the same odds, rounded. */
export const sixLoses = (need: number) =>
  Math.min(5, Math.max(1, Math.round((6 * (need - 1)) / 20)));

/** Six moves on a d6, worst first: `lose` must hold exactly `sixLoses(need)`
 * faces, so a retune that moves the split fails at load and the faces get
 * rewritten to match. A d6 fight takes no roll bonus and has no naturals. */
export const moves =
  (lose: string[], win: string[]): Roll =>
  (need) => {
    if (lose.length !== sixLoses(need) || lose.length + win.length !== 6)
      throw Error(
        `A d6 fight at need ${need} loses on ${sixLoses(need)} faces`,
      );
    return rollTable(1, 6, [
      ...lose.map((instruction, i) => ({
        min: i + 1,
        max: i + 1,
        instruction,
      })),
      ...win.map((instruction, i) => ({
        min: lose.length + i + 1,
        max: lose.length + i + 1,
        instruction,
        win: true as const,
      })),
    ]);
  };

/** Ways to roll each 2d6 total. */
const ways = (t: number) => 6 - Math.abs(t - 7);
/** The 2d6 total that wins nearest the d20 need's odds. */
export const pairNeed = (need: number) => {
  const odds = (21 - need) / 20;
  const at = (t: number) =>
    Array.from({ length: 13 - t }, (_, i) => ways(t + i)).reduce(
      (a, b) => a + b,
      0,
    ) / 36;
  let best = 3;
  for (let t = 3; t <= 12; t++)
    if (Math.abs(at(t) - odds) < Math.abs(at(best) - odds)) best = t;
  return best;
};

/** 2d6 at the nearest odds; `doubles`, when given, always win. */
export const pair =
  (lose: string, win: string, doubles?: string): Roll =>
  (need) => {
    const t = pairNeed(need);
    const dice = rollTable(2, 6, [
      { min: 2, max: t - 1, instruction: lose },
      { min: t, max: 12, instruction: win, win: true },
    ]);
    return doubles ? { ...dice, doubles, doublesWin: true } : dice;
  };

type Stakes = { loot?: Loot; jinx?: Jinx };
const stakes = ({ loot, jinx }: Stakes) => ({
  ...(loot ? { reward: { loot } } : {}),
  ...(jinx ? { jinx } : {}),
});

const room = (
  floor: Floor,
  kind: string,
  id: string,
  title: string,
  rules: string,
  dice?: DiceDefinition,
): CardDefinition => ({
  ...card(id, title, "challenge", rules, dice),
  ribbon: `${FLOORS[floor]} · ${kind}`,
  encounter: kind.toLowerCase() as Encounter,
});

/** A room monster: a d20 fight at the floor's target, or another roll
 * (`roll`: a d6 move list or 2d6) at the same odds. A `jinx`
 * lands on a loss; `loot` comes with a win. */
export const monster = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  lose: string,
  win: string,
  more: Stakes & { crit?: string; fumble?: string; roll?: Roll } = {},
): CardDefinition => {
  const need = NEED[tier(floor)];
  return {
    ...room(
      floor,
      "Monster",
      id,
      title,
      rules,
      more.roll ? more.roll(need) : d20(need, lose, win, more),
    ),
    battle: true,
    damage: HURT[tier(floor)],
    ...stakes(more),
  };
};

/** A mishap (2026-10-31): a room with no roll and nothing at stake but
 * its line, read as written in every mode. Pub Crawl's knack strikes became
 * these when knacks were cut; each keeps the line it read for a class
 * without the edge either way (its `even` line). */
export const mishap = (
  floor: Floor,
  kind: "Monster" | "Trap",
  id: string,
  title: string,
  line: string,
  more: Stakes = {},
): CardDefinition => ({
  ...room(floor, kind, id, title, line),
  ...stakes(more),
});

/** A trial: no dice; the table calls Won or Lost. The rules say what
 * losing costs. */
export const trial = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  more: Stakes = {},
): CardDefinition => ({
  ...room(floor, "Trial", id, title, rules),
  battle: true,
  damage: HURT[tier(floor)],
  ...stakes(more),
});

/** A trap: a d20 save at the floor's target; it only ever costs one heart. */
export const trap = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  lose: string,
  win: string,
  more: Stakes & { crit?: string; fumble?: string } = {},
): CardDefinition => ({
  ...room(
    floor,
    "Trap",
    id,
    title,
    rules,
    d20(SAVE[tier(floor)], lose, win, more),
  ),
  battle: true,
  damage: 1,
  ...stakes(more),
});

/** A relic or a chest: walk away, or roll for what's inside. */
export const relic = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  need: number,
  lose: string,
  win: string,
  labels: [string, string],
  more: { loot: Loot; jinx?: Jinx },
): CardDefinition => ({
  ...room(
    floor,
    "Relic",
    id,
    title,
    rules,
    choice(d20(need, lose, win), ...labels),
  ),
  ribbonTone: "violet",
  battle: true,
  damage: 1,
  ...stakes(more),
});

/** Push your luck: each won roll banks the next prize and offers Cash out
 * or Again, each Again 2 harder; a loss forfeits the lot and costs a heart.
 * Counts as a relic for roll bonuses. Pub Crawl only. */
export const gamble = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  lose: string,
  win: string,
  prizes: Loot[],
): CardDefinition => ({
  ...card(
    id,
    title,
    "challenge",
    rules,
    d20(GAMBLE_NEED[tier(floor)], lose, win),
  ),
  ribbon: `${FLOORS[floor]} · Gamble`,
  ribbonTone: "violet",
  encounter: "relic",
  battle: true,
  damage: 1,
  press: { prizes },
});

export const treasure = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  loot: Loot,
): CardDefinition => ({
  ...card(id, title, "sip", rules),
  ribbon: `${FLOORS[floor]} · Treasure`,
  ribbonTone: "violet",
  encounter: "treasure",
  reward: { loot },
});

export const shrine = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
): CardDefinition => ({
  ...card(id, title, "group", rules),
  ribbon: `${FLOORS[floor]} · Shrine`,
  ribbonTone: "violet",
  encounter: "shrine",
  reward: { heal: 2 },
});

/** A table moment (2026-10-25): no fight and no roll, only something for
 * the table to do between fights; a few heal the party for doing it.
 * Pub Crawl only. */
export const moment = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  heal?: number,
): CardDefinition => ({
  ...card(id, title, "group", rules),
  ribbon: `${FLOORS[floor]} · Moment`,
  ribbonTone: "violet",
  encounter: "shrine",
  ...(heal ? { reward: { heal } } : {}),
});

/** A trinket a boss or an elite drops: a lasting boon, its power written
 * from its numbers. */
export const trinket = (name: string, effect: OmenEffect) => ({
  name,
  rules: describeOmen(
    effect,
    dungeonOmenWords,
    PARTY_HEARTS,
    true,
    "Comes with",
  ),
  effect,
  ...slotFor(effect),
});
/** Its equipment slot, read from what it does (2026-10-25): a weapon bends
 * the dice, armor keeps hearts, a trinket does anything else (or a mix).
 * One that only brings items has no slot: its items go in the satchel. */
function slotFor(effect: OmenEffect): { slot?: Slot } {
  const keys = Object.keys(effect).filter((k) => k !== "loot");
  if (!keys.length) return {};
  if (keys.every((k) => ["roll", "crit", "bossHits"].includes(k)))
    return { slot: "weapon" };
  if (keys.every((k) => ["hearts", "hurt"].includes(k)))
    return { slot: "armor" };
  return { slot: "trinket" };
}
export type Trinket = ReturnType<typeof trinket>;
/** What a boss or an elite offers when it falls: its signature trinket and
 * an alternative, and the table picks one. */
export type Spoils = [signature: Trinket, alternative: Trinket];

/** A boss: dealt again, to the next drawer, until it has been beaten
 * `hits` times, then it offers its spoils. Last Call's bosses close both
 * third floors and drop nothing. A boss's jinx lands on a missed swing
 * and lifts when it falls. */
export const boss = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  dice: DiceDefinition,
  more: { jinx?: Jinx; drops?: Spoils } = {},
): CardDefinition => ({
  ...card(id, title, "challenge", rules, dice),
  ribbon: tier(floor) === 2 ? "Last Call · Boss" : `${FLOORS[floor]} · Boss`,
  ribbonTone: "crimson",
  encounter: "boss",
  battle: true,
  hits: BOSS_HITS[tier(floor)],
  damage: BOSS_HURT[tier(floor)],
  ...(more.jinx ? { jinx: more.jinx } : {}),
  ...(more.drops ? { spoils: more.drops } : {}),
});

/** An elite: dealt only behind a fork's loud door in Pub Crawl (and as an
 * ordinary fight in the plain modes). Harder, dearer, and a win offers its
 * spoils. */
export const elite = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  lose: string,
  win: string,
  drops: Spoils,
  extra: { crit?: string; fumble?: string; roll?: Roll } = {},
): CardDefinition => {
  const need = ELITE_NEED[tier(floor)];
  return {
    ...room(
      floor,
      "Elite",
      id,
      title,
      rules,
      extra.roll ? extra.roll(need) : d20(need, lose, win, extra),
    ),
    battle: true,
    damage: ELITE_HURT[tier(floor)],
    spoils: drops,
  };
};

/** An ambush: more than one of them. In Pub Crawl it is dealt again, like a
 * boss, until it has been beaten twice. */
export const ambush = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  lose: string,
  win: string,
  more: Stakes & { crit?: string; fumble?: string } = {},
): CardDefinition => ({
  ...room(
    floor,
    "Ambush",
    id,
    title,
    rules,
    d20(NEED[tier(floor)], lose, win, more),
  ),
  battle: true,
  hits: 2,
  damage: AMBUSH_HURT[tier(floor)],
  ...stakes(more),
});

/** A merchant: wares on plaques, each with its price. */
export const merchant = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  offers: Offer[],
): CardDefinition => ({
  ...card(id, title, "sip", rules),
  ribbon: `${FLOORS[floor]} · Merchant`,
  ribbonTone: "violet",
  encounter: "merchant",
  offers,
});

/** A fork: the quiet door, or the loud one, which turns the floor's next
 * room into one of its elites. */
export const fork = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  doors: [string, string] = ["Quiet door", "Loud door"],
): CardDefinition => ({
  ...card(id, title, "group", rules),
  ribbon: `${FLOORS[floor]} · Fork`,
  ribbonTone: "violet",
  encounter: "fork",
  offers: [{ label: doors[0] }, { label: doors[1], elite: true }],
});

/** Tonight's omen, the run's second card: a boon that holds all crawl. The
 * card's own rules are written by hand (`rules`); the party dialog shows
 * the power written from the numbers. An empty effect is a table rule the
 * app doesn't track. */
export const omen = (
  id: string,
  title: string,
  rules: string,
  effect: OmenEffect = {},
  /** The table rule an omen with numbers also lays (2026-10-25), shown
   * beside them in the party dialog. */
  spoken?: string,
): CardDefinition => ({
  ...card(`omen-${id}`, title, "rule", rules),
  ribbon: "Tonight's omen",
  ribbonTone: "pearl",
  encounter: "omen",
  // A table rule's power is its rule.
  boon: {
    name: title,
    rules:
      [spoken, describeOmen(effect, dungeonOmenWords, PARTY_HEARTS)]
        .filter(Boolean)
        .join(" ") || rules,
    effect,
  },
});

/** The adventurer: the run's first card. Its effect holds for the run and
 * grows as it levels up (`evolves`, each level replacing the one before)
 * at a landing or with a Dog-Eared Tome. Every power is written from its
 * numbers, so the card says exactly what the engine does: `flavor` leads
 * the card, and each level's rules are its power alone. Four levels
 * (2026-10-25) are two paths, `[A1, B1, A2, B2]`: the first level up picks
 * one (`fork`), each with a `tagline` for its plaque. */
export const adventurer = (
  id: string,
  title: string,
  flavor: string,
  effect: OmenEffect,
  levels: { title: string; omen: OmenEffect }[],
): CardDefinition => ({
  ...card(
    `class-${id}`,
    title,
    "rule",
    [flavor, describeOmen(effect, dungeonOmenWords, PARTY_HEARTS)]
      .filter(Boolean)
      .join(" "),
  ),
  ribbon: "Your adventurer",
  ribbonTone: "pearl",
  encounter: "omen",
  omen: effect,
  evolves: levels.map((e) => ({
    ...e,
    rules: describeOmen(e.omen, dungeonOmenWords, PARTY_HEARTS, false),
  })),
});

/** A landing between floors: level up for drinks, or rest. A fully
 * levelled adventurer can only rest. Pub Crawl only. */
export const landing = (
  id: string,
  title: string,
  rules: string,
  rest = "Rest",
): CardDefinition => ({
  ...card(`landing-${id}`, title, "group", rules),
  ribbon: "Landing · Rest",
  ribbonTone: "violet",
  encounter: "rest",
  offers: [
    { label: `Level up · drink ${LEVEL_DRINK}`, evolve: true },
    { label: rest, heal: LANDING_HEAL },
  ],
});

/** The rival party in the queue at the door: one fight, and the winner
 * goes in first with whatever the loser dropped. Pub Crawl only. */
export const queue = (
  id: string,
  title: string,
  rules: string,
  fight: Roll | null,
  more: Stakes = {},
): CardDefinition => ({
  ...card(
    `queue-${id}`,
    title,
    "challenge",
    rules,
    fight ? fight(QUEUE_NEED) : undefined,
  ),
  ribbon: "The Queue · Rival",
  ribbonTone: "crimson",
  encounter: "ambush",
  battle: true,
  damage: QUEUE_HURT,
  ...stakes(more),
});

/** The rival party on the stairs (2026-10-25): one fight, or a trial the
 * table calls (`null`), and the winner gets whatever they dropped. Pub
 * Crawl only. */
export const stairs = (
  id: string,
  title: string,
  rules: string,
  fight: Roll | null,
  more: Stakes = {},
): CardDefinition => ({
  ...card(
    `stairs-${id}`,
    title,
    "challenge",
    rules,
    fight ? fight(STAIRS_NEED) : undefined,
  ),
  ribbon: "The Stairs · Rival",
  ribbonTone: "crimson",
  encounter: "ambush",
  battle: true,
  damage: STAIRS_HURT,
  ...stakes(more),
});

/** The rival party at closing time: dealt again until beaten twice. */
export const closing = (
  id: string,
  title: string,
  rules: string,
  fight: Roll,
  more: { jinx?: Jinx } = {},
): CardDefinition => ({
  ...card(`closing-${id}`, title, "challenge", rules, fight(CLOSING_NEED)),
  ribbon: "Closing Time · Rival",
  ribbonTone: "crimson",
  encounter: "ambush",
  battle: true,
  hits: 2,
  damage: CLOSING_HURT,
  ...stakes(more),
});

/** A d20 at the need, for the rival's fights. */
export const vs =
  (
    lose: string,
    win: string,
    extra: { crit?: string; fumble?: string } = {},
  ): Roll =>
  (need) =>
    d20(need, lose, win, extra);

/** A hidden room's guard: a fight at the room's odds (`fight`), or a trial
 * the table calls (`null`). Pub Crawl only. */
export const guard = (
  room: string,
  id: string,
  title: string,
  rules: string,
  fight: Roll | null,
  more: Stakes = {},
): CardDefinition => ({
  ...card(id, title, "challenge", rules, fight ? fight(GUARD_NEED) : undefined),
  ribbon: `${room} · Guard`,
  encounter: fight ? "monster" : "trial",
  battle: true,
  damage: GUARD_HURT,
  ...stakes(more),
});

/** A hidden room's keeper: a boss, dealt again until beaten twice, who
 * offers spoils when it falls. Pub Crawl only. */
export const keeper = (
  room: string,
  id: string,
  title: string,
  rules: string,
  fight: Roll,
  more: { jinx?: Jinx; drops: Spoils },
): CardDefinition => ({
  ...card(id, title, "challenge", rules, fight(KEEPER_NEED)),
  ribbon: `${room} · Boss`,
  ribbonTone: "crimson",
  encounter: "boss",
  battle: true,
  hits: 2,
  damage: KEEPER_HURT,
  ...(more.jinx ? { jinx: more.jinx } : {}),
  spoils: more.drops,
});

/** One floor's cards: its rooms (fights and finds), the elites behind its
 * fork, and its bosses (none on a third floor: Last Call closes it). */
export interface FloorCards {
  fights: CardDefinition[];
  finds: CardDefinition[];
  elites: CardDefinition[];
  bosses: CardDefinition[];
}
