import type {
  CardDefinition,
  DiceDefinition,
  DiceOutcome,
  RibbonTone,
} from "../../game/types";
import { cardFactory, rollTable } from "../author";
import { withNaturals } from "../naturals";

// Pokémon League tuning, in the style of `dungeon.ts`. Every League card is a
// boss (`encounter: "boss"`, a `battle`), so in a crawl a loss costs the team
// `damage` HP and the card is dealt again until it has been beaten `hits`
// times. The numbers are first guesses: a League harness tunes them, so keep
// them here and never inline them on a card. A gym's tier is its canon
// position in its region (tier 0 is every region's first gym), so a run that
// picks one leader per tier still ramps up.

/** The d20 a dice gym leader needs, tier by tier (gym 1 to gym 8). */
export const GYM_NEED = [4, 5, 6, 7, 7, 7, 8, 8] as const;
/** Swings a gym leader takes to fall, tier by tier. */
export const GYM_HITS = [1, 1, 1, 1, 2, 2, 2, 2] as const;
/** Team HP a lost gym battle costs, tier by tier. */
export const GYM_HURT = [1, 1, 1, 1, 2, 2, 2, 2] as const;
/** A Legendary: its d20 target, swings to catch it, HP a miss costs. */
export const LEGENDARY_NEED = 7;
export const LEGENDARY_HITS = 2;
export const LEGENDARY_HURT = 2;
/** An Elite Four member (or Galar's Champion Cup finalist). */
export const ELITE_NEED = 7;
export const ELITE_HITS = 1;
export const ELITE_HURT = 2;
/** A Champion: the whole table fights, three swings to bring one down. */
export const CHAMPION_NEED = 7;
export const CHAMPION_HITS = 2;
export const CHAMPION_HURT = 2;

/** A gym tier, 0 (first gym) to 7 (eighth gym). */
export type Tier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const card = cardFactory("pokemon");

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

const boss = (
  id: string,
  name: string,
  rules: string,
  dice: DiceDefinition | undefined,
  hits: number,
  damage: number,
): CardDefinition =>
  // Every League d20 carries the crawls' natural 20 and natural 1.
  withNaturals({
    ...card(id, name, "challenge", rules, dice),
    encounter: "boss",
    battle: true,
    hits,
    damage,
  });

/** A gym leader at its tier. Without dice the table settles it with Won and
 * Lost plaques, so its rules must be judged on the spot. */
const gym = (
  tier: Tier,
  id: string,
  name: string,
  ribbon: string,
  rules: string,
  dice?: DiceDefinition,
): CardDefinition => ({
  ...boss(`gym-${id}`, name, rules, dice, GYM_HITS[tier], GYM_HURT[tier]),
  quest: "pokemon",
  ribbon,
});

export const leader = (
  tier: Tier,
  id: string,
  name: string,
  badge: string,
  rules: string,
  dice?: DiceDefinition,
) => gym(tier, id, name, `Gym Leader · ${badge} Badge`, rules, dice);

/** Alola has no gyms: its island challenge is Trial Captains and Kahunas,
 * and each pays a Z-Crystal instead of a badge. */
export const islandTrial = (
  tier: Tier,
  id: string,
  name: string,
  role: "Trial Captain" | "Kahuna",
  crystal: string,
  rules: string,
  dice?: DiceDefinition,
) => gym(tier, id, name, `${role} · ${crystal}`, rules, dice);

/** The League gauntlet: one Legendary, four of the Elite Four, a Champion. */
const gauntlet = (
  id: string,
  name: string,
  ribbon: string,
  ribbonTone: RibbonTone,
  rules: string,
  dice: DiceDefinition | undefined,
  hits: number,
  damage: number,
): CardDefinition => ({
  ...boss(id, name, rules, dice, hits, damage),
  ribbon,
  ribbonTone,
});

export const legendary = (
  id: string,
  name: string,
  rules: string,
  dice: DiceDefinition,
) =>
  gauntlet(
    `legendary-${id}`,
    name,
    "Legendary Encounter",
    "pearl",
    rules,
    dice,
    LEGENDARY_HITS,
    LEGENDARY_HURT,
  );

export const eliteFour = (
  id: string,
  name: string,
  type: string,
  rules: string,
  dice?: DiceDefinition,
) =>
  gauntlet(
    `elite-${id}`,
    name,
    `Elite Four · ${type}`,
    "violet",
    rules,
    dice,
    ELITE_HITS,
    ELITE_HURT,
  );

/** Galar has no Elite Four; its Champion Cup finalists stand in. */
export const cupFinalist = (
  id: string,
  name: string,
  type: string,
  rules: string,
  dice?: DiceDefinition,
) =>
  gauntlet(
    `elite-${id}`,
    name,
    `Champion Cup · ${type}`,
    "violet",
    rules,
    dice,
    ELITE_HITS,
    ELITE_HURT,
  );

/** The last card of the run: the whole table fights, and only winning ends
 * it. A lost Champion is replaced by another, dealt next, until one falls. */
export const champion = (
  id: string,
  name: string,
  region: string,
  rules: string,
  dice: DiceDefinition,
) =>
  gauntlet(
    `league-champion-${id}`,
    name,
    `Champion · ${region}`,
    "crimson",
    rules,
    dice,
    CHAMPION_HITS,
    CHAMPION_HURT,
  );

/** One region's League cards. `gyms` is in canon order: index = tier. */
export interface Region {
  gyms: CardDefinition[];
  eliteFour: CardDefinition[];
  champions: CardDefinition[];
  legendaries: CardDefinition[];
}
