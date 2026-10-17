import type {
  CardDefinition,
  Curse,
  Jinx,
  DiceDefinition,
  DiceOutcome,
  Encounter,
  Loot,
  Offer,
  OmenEffect,
  Evolution,
} from "../../game/types";
import { cardFactory, choice, rollTable } from "../author";
import { withNaturals } from "../naturals";
import { describeOmen, leagueOmenWords } from "../../game/omenText";

// Pokémon League's journey (owner, 2026-10-16): a run is a crawl. A starter
// opens it, then eight routes of four random cards, each closed by a gym
// leader, a villain hideout after the fourth badge, Victory Road and a
// rival, then the League. The table shares Team HP (`party.hearts`). These
// helpers write the route cards; the bosses live in `pokemon-league.ts`.
// Tune with the constants below, never card by card, and keep
// `tests/league.test.ts` passing.
export const card = cardFactory("pokemon");

/** Where a card sits: route 1 to 8 (0 to 7), or Victory Road (8). The
 * hideouts fight at route 5's odds. */
export type Leg = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const legName = (leg: Leg) =>
  leg === 8 ? "Victory Road" : `Route ${leg + 1}`;

/** The d20 a wild Pokémon or a trainer needs, leg by leg. */
export const WILD_NEED = [4, 5, 6, 7, 8, 8, 9, 9, 10] as const;
/** Team HP a lost route fight costs. */
export const WILD_HURT = [1, 1, 1, 1, 1, 1, 2, 2, 2] as const;
/** The d20 a hazard's save needs; a hazard only ever costs one. */
export const HAZARD_SAVE = [7, 8, 9, 10, 11, 12, 12, 13, 13] as const;
/** An Ace Trainer (behind a crossroads' loud path): harder, dearer, and it
 * always pays an item. */
export const ACE_BONUS = 3;
export const ACE_HURT = [2, 2, 2, 2, 3, 3, 3, 3, 3] as const;
/** A Pokémon Center's heal. */
export const CENTER_HEAL = 2;
/** A villain hideout's grunts and boss. */
export const HIDEOUT_LEG: Leg = 4;
export const HIDEOUT_BOSS_NEED = 8;
export const HIDEOUT_BOSS_HURT = 2;
export const HIDEOUT_BOSS_HITS = 2;
/** The rival on Victory Road: beaten twice. */
export const RIVAL_NEED = 9;
export const RIVAL_HURT = 2;

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

/** How a fight is rolled, from the d20 its card needs (the leg's odds), so
 * the needs above retune every kind of roll. */
export type Roll = (need: number) => DiceDefinition;

/** A d20 at the need. */
export const vs =
  (
    lose: string,
    win: string,
    extra: { crit?: string; fumble?: string } = {},
  ): Roll =>
  (need) =>
    d20(need, lose, win, extra);

/** The d6 faces that lose at a d20 need: the same odds, rounded. */
export const sixLoses = (need: number) =>
  Math.min(5, Math.max(1, Math.round((6 * (need - 1)) / 20)));

/** Six moves on a d6, worst first: `lose` must hold exactly `sixLoses(need)`
 * faces, so a retune that moves the split fails at load and the faces get
 * rewritten to match. */
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

const spot = (
  leg: Leg,
  kind: string,
  encounter: Encounter,
  id: string,
  title: string,
  rules: string,
  dice?: DiceDefinition,
  category: CardDefinition["category"] = "challenge",
): CardDefinition => ({
  // Every League d20 carries the crawls' natural 20 and natural 1.
  ...withNaturals(card(id, title, category, rules, dice)),
  ribbon: `${legName(leg)} · ${kind}`,
  encounter,
});

type Extra = { loot?: Loot; curse?: Curse; jinx?: Jinx };
const stakes = ({ loot, curse, jinx }: Extra) => ({
  ...(loot ? { reward: { loot } } : {}),
  ...(curse ? { curse } : {}),
  ...(jinx ? { jinx } : {}),
});

/** A wild Pokémon: a fight at the leg's odds. A `curse` lands on a loss
 * (poison, confusion); `loot` comes with a win. */
export const wild = (
  leg: Leg,
  id: string,
  title: string,
  rules: string,
  fight: Roll,
  more: Extra = {},
): CardDefinition => ({
  ...spot(leg, "Wild", "monster", id, title, rules, fight(WILD_NEED[leg])),
  battle: true,
  damage: WILD_HURT[leg],
  ...stakes(more),
});

/** A trainer battle: a wild fight with a person attached. */
export const trainer = (
  leg: Leg,
  id: string,
  title: string,
  rules: string,
  fight: Roll,
  more: Extra = {},
): CardDefinition => ({
  ...wild(leg, id, title, rules, fight, more),
  ribbon: `${legName(leg)} · Trainer`,
});

/** A trainer's challenge, settled with Won and Lost plaques: the rules say
 * what losing costs. */
export const challenge = (
  leg: Leg,
  id: string,
  title: string,
  rules: string,
): CardDefinition => ({
  ...spot(leg, "Trainer", "trial", id, title, rules),
  battle: true,
  damage: WILD_HURT[leg],
});

/** A hazard: a save at the leg's odds; it only ever costs one. */
export const hazard = (
  leg: Leg,
  id: string,
  title: string,
  rules: string,
  fight: Roll,
  curse?: Curse,
): CardDefinition => ({
  ...spot(leg, "Hazard", "trap", id, title, rules, fight(HAZARD_SAVE[leg])),
  battle: true,
  damage: 1,
  ...(curse ? { curse } : {}),
});

/** A wild Pokémon to catch: a drink for a ball, and it joins the team. */
export const catchable = (
  leg: Leg,
  id: string,
  title: string,
  rules: string,
  drink: number,
  heal = 1,
): CardDefinition => ({
  ...spot(leg, "Catch", "treasure", id, title, rules, undefined, "sip"),
  ribbonTone: "violet",
  offers: [
    { label: `Catch it · drink ${drink}`, heal },
    { label: "Let it go" },
  ],
});

/** A risky find: walk away, or roll for it. A loss costs one and maybe a
 * curse; a win brings the item. */
export const gamble = (
  leg: Leg,
  id: string,
  title: string,
  rules: string,
  need: number,
  lose: string,
  win: string,
  labels: [string, string],
  loot: Loot,
  curse?: Curse,
): CardDefinition => ({
  ...spot(
    leg,
    "Find",
    "relic",
    id,
    title,
    rules,
    choice(d20(need, lose, win), ...labels),
  ),
  ribbonTone: "violet",
  battle: true,
  damage: 1,
  reward: { loot },
  ...(curse ? { curse } : {}),
});

/** An item ball on the ground. */
export const item = (
  leg: Leg,
  id: string,
  title: string,
  rules: string,
  loot: Loot,
): CardDefinition => ({
  ...spot(leg, "Item", "treasure", id, title, rules, undefined, "sip"),
  ribbonTone: "violet",
  reward: { loot },
});

/** A Pokémon Center: the team heals. */
export const center = (
  leg: Leg,
  id: string,
  title: string,
  rules: string,
): CardDefinition => ({
  ...spot(
    leg,
    "Pokémon Center",
    "shrine",
    id,
    title,
    rules,
    undefined,
    "group",
  ),
  ribbonTone: "violet",
  reward: { heal: CENTER_HEAL },
});

/** A Poké Mart: wares on plaques, each with its price. */
export const mart = (
  leg: Leg,
  id: string,
  title: string,
  rules: string,
  offers: Offer[],
): CardDefinition => ({
  ...spot(leg, "Poké Mart", "merchant", id, title, rules, undefined, "sip"),
  ribbonTone: "violet",
  offers,
});

/** A crossroads: the quiet path, or the loud one, which turns the route's
 * next card into one of its Ace Trainers. */
export const crossroads = (
  leg: Leg,
  id: string,
  title: string,
  rules: string,
  paths: [string, string],
): CardDefinition => ({
  ...spot(leg, "Crossroads", "fork", id, title, rules, undefined, "group"),
  ribbonTone: "violet",
  offers: [{ label: paths[0] }, { label: paths[1], elite: true }],
});

/** An Ace Trainer: dealt only behind a crossroads' loud path. */
export const ace = (
  leg: Leg,
  id: string,
  title: string,
  rules: string,
  fight: Roll,
  loot: Loot,
): CardDefinition => ({
  ...spot(
    leg,
    "Ace Trainer",
    "elite",
    id,
    title,
    rules,
    fight(WILD_NEED[leg] + ACE_BONUS),
  ),
  battle: true,
  damage: ACE_HURT[leg],
  reward: { loot },
});

/** A chance for the starter to evolve, for a drink; pressing B keeps it as
 * it is and heals one. A fully evolved starter can only press B. */
export const evolution = (
  leg: Leg,
  id: string,
  title: string,
  rules: string,
  drink = 3,
): CardDefinition => ({
  ...spot(leg, "Evolution", "treasure", id, title, rules, undefined, "group"),
  ribbonTone: "violet",
  offers: [
    { label: `Evolve · drink ${drink}`, evolve: true },
    { label: "Press B", heal: 1 },
  ],
});

/** The rival on Victory Road: dealt again until beaten twice. */
export const rival = (
  id: string,
  title: string,
  rules: string,
  fight: Roll,
): CardDefinition => ({
  ...withNaturals(card(id, title, "challenge", rules, fight(RIVAL_NEED))),
  ribbon: "Victory Road · Rival",
  ribbonTone: "crimson",
  encounter: "ambush",
  battle: true,
  hits: 2,
  damage: RIVAL_HURT,
});

/** A hideout's grunt: a fight at the hideout's odds. */
export const grunt = (
  team: string,
  id: string,
  title: string,
  rules: string,
  fight: Roll,
  more: Extra = {},
): CardDefinition => ({
  ...wild(HIDEOUT_LEG, id, title, rules, fight, more),
  ribbon: `${team} · Grunt`,
});

/** A hideout's boss: dealt again until beaten twice. Its curse lands on a
 * missed swing and lifts when it falls. */
export const villain = (
  team: string,
  id: string,
  title: string,
  rules: string,
  fight: Roll,
  curse?: Curse,
): CardDefinition => ({
  ...withNaturals(
    card(id, title, "challenge", rules, fight(HIDEOUT_BOSS_NEED)),
  ),
  ribbon: `${team} · Boss`,
  ribbonTone: "crimson",
  encounter: "boss",
  battle: true,
  hits: HIDEOUT_BOSS_HITS,
  damage: HIDEOUT_BOSS_HURT,
  ...(curse ? { curse } : {}),
});

/** Team HP at the start of a League run, before the starter. */
export const TEAM_HP = 17;

/** A starter: the run's first card. Its effect holds for the run and grows
 * as it evolves (`evolves`, each form replacing the one before). With
 * `branches` the forms are alternatives the table picks between (Eevee).
 * Every power is written from its numbers (`game/omenText.ts`), so the card
 * says exactly what the engine does: `flavor` leads the card, and each
 * form's rules are its power alone. */
export const starter = (
  id: string,
  title: string,
  flavor: string,
  effect: OmenEffect,
  evolves: { title: string; omen: OmenEffect }[] = [],
  branches = false,
): CardDefinition => ({
  ...card(
    `starter-${id}`,
    title,
    "rule",
    [flavor, describeOmen(effect, leagueOmenWords, TEAM_HP)]
      .filter(Boolean)
      .join(" "),
  ),
  ribbon: "Your starter",
  ribbonTone: "pearl",
  encounter: "omen",
  omen: effect,
  ...(evolves.length
    ? {
        evolves: evolves.map((e): Evolution => ({
          ...e,
          rules: describeOmen(e.omen, leagueOmenWords, TEAM_HP, false),
        })),
      }
    : {}),
  ...(branches ? { branches: true as const } : {}),
});

export const ids = (cs: CardDefinition[]) => cs.map((c) => c.id);
