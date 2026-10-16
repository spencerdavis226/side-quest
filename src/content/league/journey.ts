import type {
  CardDefinition,
  Curse,
  DiceDefinition,
  DiceOutcome,
  Encounter,
  Loot,
  Offer,
  OmenEffect,
  Evolution,
} from "../../game/types";
import { cardFactory, choice, rollTable } from "../author";

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
  ...card(id, title, category, rules, dice),
  ribbon: `${legName(leg)} · ${kind}`,
  encounter,
});

type Extra = { crit?: string; fumble?: string; loot?: Loot; curse?: Curse };
const stakes = ({ loot, curse }: Extra) => ({
  ...(loot ? { reward: { loot } } : {}),
  ...(curse ? { curse } : {}),
});

/** A wild Pokémon: a d20 fight at the leg's odds. A `curse` lands on a
 * loss (poison, confusion); `loot` comes with a win. */
export const wild = (
  leg: Leg,
  id: string,
  title: string,
  rules: string,
  lose: string,
  win: string,
  more: Extra = {},
): CardDefinition => ({
  ...spot(
    leg,
    "Wild",
    "monster",
    id,
    title,
    rules,
    d20(WILD_NEED[leg], lose, win, more),
  ),
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
  lose: string,
  win: string,
  more: Extra = {},
): CardDefinition => ({
  ...wild(leg, id, title, rules, lose, win, more),
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

/** A hazard: a d20 save at the leg's odds; it only ever costs one. */
export const hazard = (
  leg: Leg,
  id: string,
  title: string,
  rules: string,
  lose: string,
  win: string,
  curse?: Curse,
): CardDefinition => ({
  ...spot(
    leg,
    "Hazard",
    "trap",
    id,
    title,
    rules,
    d20(HAZARD_SAVE[leg], lose, win),
  ),
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
  lose: string,
  win: string,
  loot: Loot,
  extra: { crit?: string; fumble?: string } = {},
): CardDefinition => ({
  ...spot(
    leg,
    "Ace Trainer",
    "elite",
    id,
    title,
    rules,
    d20(WILD_NEED[leg] + ACE_BONUS, lose, win, extra),
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
  lose: string,
  win: string,
): CardDefinition => ({
  ...card(id, title, "challenge", rules, d20(RIVAL_NEED, lose, win)),
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
  lose: string,
  win: string,
  more: Extra = {},
): CardDefinition => ({
  ...wild(HIDEOUT_LEG, id, title, rules, lose, win, more),
  ribbon: `${team} · Grunt`,
});

/** A hideout's boss: dealt again until beaten twice. Its curse lands on a
 * missed swing and lifts when it falls. */
export const villain = (
  team: string,
  id: string,
  title: string,
  rules: string,
  lose: string,
  win: string,
  curse?: Curse,
): CardDefinition => ({
  ...card(id, title, "challenge", rules, d20(HIDEOUT_BOSS_NEED, lose, win)),
  ribbon: `${team} · Boss`,
  ribbonTone: "crimson",
  encounter: "boss",
  battle: true,
  hits: HIDEOUT_BOSS_HITS,
  damage: HIDEOUT_BOSS_HURT,
  ...(curse ? { curse } : {}),
});

/** A starter: the run's first card. Its effect holds for the run and grows
 * as it evolves (`evolves`, each form replacing the one before). With
 * `branches` the forms are alternatives the table picks between (Eevee). */
export const starter = (
  id: string,
  title: string,
  rules: string,
  effect: OmenEffect,
  evolves: Evolution[] = [],
  branches = false,
): CardDefinition => ({
  ...card(`starter-${id}`, title, "rule", rules),
  ribbon: "Your starter",
  ribbonTone: "pearl",
  encounter: "omen",
  omen: effect,
  ...(evolves.length ? { evolves } : {}),
  ...(branches ? { branches: true as const } : {}),
});

export const ids = (cs: CardDefinition[]) => cs.map((c) => c.id);
