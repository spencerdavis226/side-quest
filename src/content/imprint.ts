import { standardExpansionCards } from "./standard-expansion";
import { houseCards, customVipCards } from "./custom";
import { pokemonCards } from "./pokemon";
import { cabinCards } from "./cabin";
import { likelyCards } from "./likely";
import { secretsCards } from "./secrets";

/**
 * Card imprint content: which icon and paper tint a card carries.
 *
 * This is presentation data only. It is deliberately kept out of
 * `CardDefinition` so session schema v2, saved snapshots and the pure engine
 * stay untouched — an imprint can be added, changed or removed without a
 * migration and without invalidating an in-progress game.
 *
 * Assignments are optional. Any card without an entry falls back to a stable
 * value derived from its id, so adding new cards never blocks on artwork.
 * Slugs are `<artist>/<icon>` from the vendored game-icons library in
 * `assets/icons/game-icons`; `scripts/imprint.ts` validates them at build time.
 */

/** Paper washes applied under the lattice. `none` leaves the parchment bare. */
export const imprintTints = {
  none: { color: "#f4dfb4", opacity: 0 },
  amber: { color: "#d9a355", opacity: 0.18 },
  rose: { color: "#c98a7a", opacity: 0.16 },
  sage: { color: "#8fa07a", opacity: 0.16 },
  teal: { color: "#6f8f8a", opacity: 0.16 },
  sepia: { color: "#b98a5e", opacity: 0.18 },
  plum: { color: "#9c7f96", opacity: 0.16 },
  ash: { color: "#9a9488", opacity: 0.14 },
} as const;

export type TintName = keyof typeof imprintTints;

export const tintNames = Object.keys(imprintTints) as TintName[];

export interface ImprintAssignment {
  /** Main motif slug, e.g. `lorc/beer-stein`. */
  icon?: string;
  /** Small connective motif slug repeated at the lattice intersections. */
  ornament?: string;
  tint?: TintName;
}

// The current front is plain parchment; these retained imprint assignments
// support saved/study content. The expansion uses a stable category motif from
// the already-shipped icon set, so adding 145 cards does not grow that sprite.
const expansionMotifs: Record<string, ImprintAssignment> = {
  sip: { icon: "lorc/beer-stein", tint: "amber" },
  group: { icon: "lorc/conversation", tint: "rose" },
  category: { icon: "lorc/book-cover", tint: "sage" },
  challenge: { icon: "lorc/crossed-swords", tint: "teal" },
  rule: { icon: "lorc/scroll-unfurled", tint: "sepia" },
};

/**
 * Per-card overrides. Empty is a valid, intentional state: every card still
 * gets a deterministic lattice. Add an entry when a card deserves a specific
 * icon; the current catalog below has curated assignments.
 */
export const imprintAssignments: Record<string, ImprintAssignment> = {
  ...Object.fromEntries(
    standardExpansionCards.map((card) => [
      card.id,
      expansionMotifs[card.category],
    ]),
  ),
  ...Object.fromEntries(
    [...houseCards, ...customVipCards].map((card) => [
      card.id,
      expansionMotifs[card.category],
    ]),
  ),
  ...Object.fromEntries(
    pokemonCards.map((card) => [card.id, expansionMotifs[card.category]]),
  ),
  ...Object.fromEntries(
    cabinCards.map((card) => [card.id, expansionMotifs[card.category]]),
  ),
  ...Object.fromEntries(
    likelyCards.map((card) => [card.id, expansionMotifs[card.category]]),
  ),
  ...Object.fromEntries(
    secretsCards.map((card) => [card.id, expansionMotifs[card.category]]),
  ),
  "core.house-special": { icon: "lorc/beer-stein", tint: "amber" },
  "core.bar-tab": { icon: "delapouite/coins-pile", tint: "sepia" },
  "core.bad-influence": { icon: "lorc/poison-bottle", tint: "plum" },
  "core.last-call": { icon: "delapouite/tavern-sign", tint: "teal" },
  "core.you-specifically": { icon: "lorc/crossed-swords", tint: "rose" },
  "core.cheap-date": { icon: "delapouite/wine-bottle", tint: "sage" },
  "core.baller": { icon: "delapouite/coins-pile", tint: "amber" },
  "core.group-project": { icon: "sbed/hand", tint: "teal" },
  "core.bad-text": { icon: "lorc/quill", tint: "rose" },
  "core.fake-sick": { icon: "lorc/poison-bottle", tint: "sage" },
  "core.crypto-bro": { icon: "lorc/crown-coin", tint: "sage" },
  "core.smooth-brain": { icon: "lorc/brain", tint: "plum" },
  "core.would-you": { icon: "lorc/conversation", tint: "rose" },
  "core.cheers-idiots": { icon: "delapouite/beer-horn", tint: "amber" },
  "core.dice-tax": { icon: "lorc/scales", tint: "sepia" },
  "core.give-a-shit": { icon: "delapouite/dice-fire", tint: "amber" },
  "core.fuckin-math": { icon: "lorc/scales", tint: "teal" },
  "core.low-roller": { icon: "delapouite/dice-six-faces-one", tint: "ash" },
  "core.high-roller": { icon: "lorc/crown", tint: "amber" },
  "core.same-shit": { icon: "delapouite/dice-fire", tint: "plum" },
  "core.two-beers-math": { icon: "lorc/beer-stein", tint: "amber" },
  "core.snake-eyes": { icon: "lorc/snake", tint: "sage" },
  "core.lucky-bastard": { icon: "lorc/clover", tint: "sage" },
  "core.fuck-around": { icon: "lorc/crossed-swords", tint: "rose" },
  "core.crit-fail": { icon: "lorc/skull-crossed-bones", tint: "ash" },
  "core.chosen-one": { icon: "sbed/shield", tint: "teal" },
  "core.categories": { icon: "lorc/book-cover", tint: "sepia" },
  "core.rhyme-time": { icon: "lorc/quill", tint: "plum" },
  "core.rock-paper-drink": { icon: "lorc/crossed-swords", tint: "amber" },
  "core.never-have-i": { icon: "lorc/conversation", tint: "rose" },
  "core.rulemaster": { icon: "lorc/scroll-unfurled", tint: "sepia" },
  "core.no-names": { icon: "lorc/quill", tint: "ash" },
  "core.potty-mouth": { icon: "lorc/castle", tint: "teal" },
  "core.cursed-number": { icon: "lorc/skull-crossed-bones", tint: "plum" },
  "vip.toast": { icon: "delapouite/beer-horn", tint: "amber" },
  "vip.sidekick": { icon: "sbed/shield", tint: "sage" },
  "vip.tax": { icon: "lorc/crown-coin", tint: "sepia" },
  "vip.fan-club": { icon: "lorc/crowned-heart", tint: "rose" },
  "vip.standing-ovation": { icon: "sbed/hand", tint: "amber" },
  "vip.favors": { icon: "lorc/key", tint: "teal" },
  "vip.gift": { icon: "lorc/gift-of-knowledge", tint: "plum" },
  "vip.superlatives": { icon: "delapouite/round-star", tint: "amber" },
  "vip.roast": { icon: "lorc/heartburn", tint: "rose" },
  "vip.title": { icon: "lorc/scroll-unfurled", tint: "plum" },
  "vip.excellency": { icon: "lorc/crown", tint: "teal" },
  "vip.never-alone": { icon: "lorc/beer-stein", tint: "sage" },

  // Classic / King's Cup basics added in classics.ts. All slugs already exist
  // in the generated sprite, so the lazy icon chunk does not grow.
  "core.give-one": { icon: "delapouite/coins-pile", tint: "sepia" },
  "core.drink-two": { icon: "lorc/beer-stein", tint: "amber" },
  "core.give-take": { icon: "lorc/hand", tint: "sepia" },
  "core.social-sip": { icon: "delapouite/beer-horn", tint: "amber" },
  "core.girls-drink": { icon: "lorc/crowned-heart", tint: "rose" },
  "core.guys-drink": { icon: "sbed/shield", tint: "teal" },
  "core.table-toast": { icon: "delapouite/beer-horn", tint: "rose" },
  "core.elders": { icon: "lorc/crown", tint: "sepia" },
  "core.youth": { icon: "delapouite/round-star", tint: "sage" },
  "core.tallest": { icon: "lorc/castle", tint: "teal" },
  "core.new-blood": { icon: "lorc/key", tint: "plum" },
  "core.late-arrival": { icon: "lorc/treasure-map", tint: "sepia" },
  "core.couples": { icon: "lorc/crowned-heart", tint: "rose" },
  "core.birthday": { icon: "lorc/crown", tint: "amber" },
  "core.kings-four": { icon: "lorc/hand", tint: "ash" },
  "core.kings-seven": { icon: "sbed/hand", tint: "teal" },
  "core.truth-or-drink": { icon: "lorc/quill", tint: "sepia" },
  "core.rant": { icon: "lorc/conversation", tint: "amber" },
  "core.impression": { icon: "lorc/quill", tint: "rose" },
  "core.stare-down": { icon: "lorc/crossed-swords", tint: "teal" },
  "core.thumb-war": { icon: "lorc/hand", tint: "rose" },
  "core.story-time": { icon: "lorc/book-cover", tint: "sepia" },
  "core.sober-talk": { icon: "lorc/quill", tint: "ash" },
  "core.buffalo": { icon: "lorc/hand", tint: "sage" },
  "core.accent": { icon: "lorc/conversation", tint: "sage" },
  "core.library": { icon: "lorc/book-cover", tint: "ash" },
  "core.little-green-man": { icon: "lorc/poison-bottle", tint: "sage" },
  "core.question-master": { icon: "lorc/conversation", tint: "teal" },
  "core.waterfall": { icon: "delapouite/beer-horn", tint: "teal" },
  "core.kings-two": { icon: "delapouite/coins-pile", tint: "amber" },
  "core.kings-three": { icon: "lorc/beer-stein", tint: "sepia" },
  "core.kings-eight": { icon: "lorc/crowned-heart", tint: "sage" },
  "core.lucky-sip": { icon: "delapouite/dice-six-faces-one", tint: "amber" },
  "core.open-hand": { icon: "delapouite/dice-fire", tint: "sepia" },
  "core.odd-even": { icon: "delapouite/dice-six-faces-one", tint: "teal" },
  "core.fate": { icon: "delapouite/dice-fire", tint: "plum" },
  "core.blessing": { icon: "delapouite/round-star", tint: "amber" },
  "core.dragon-breath": { icon: "lorc/heartburn", tint: "rose" },
  "core.potion-courage": { icon: "lorc/poison-bottle", tint: "sage" },
  "core.loot-drop": { icon: "lorc/treasure-map", tint: "amber" },
  "core.tavern-brawl": { icon: "lorc/beer-stein", tint: "plum" },
  "core.dungeon-master": { icon: "lorc/scroll-unfurled", tint: "sepia" },
  "core.prophecy": { icon: "lorc/treasure-map", tint: "plum" },
  "core.mimic-chest": { icon: "lorc/treasure-map", tint: "rose" },
  "core.side-quest": { icon: "lorc/scroll-unfurled", tint: "teal" },

  // Pokémon pack highlights. Slugs all exist in the shipped sprite.
  "pokemon.mareep": { icon: "lorc/clover", tint: "sage" },
  "pokemon.pikachu": { icon: "delapouite/round-star", tint: "amber" },
  "pokemon.unown": { icon: "lorc/book-cover", tint: "sepia" },
  "pokemon.smeargle": { icon: "lorc/quill", tint: "rose" },
  "pokemon.magikarp": { icon: "lorc/clover", tint: "teal" },
  "pokemon.red-gyarados": { icon: "lorc/snake", tint: "rose" },
  "pokemon.dragon-rage": { icon: "lorc/heartburn", tint: "rose" },
  "pokemon.dragonite": { icon: "lorc/snake", tint: "amber" },
  "pokemon.legendary-dogs": { icon: "lorc/crown", tint: "amber" },
  "pokemon.kyogre": { icon: "lorc/crown", tint: "teal" },
  "pokemon.groudon": { icon: "lorc/crown", tint: "sepia" },
  "pokemon.rayquaza": { icon: "lorc/crown", tint: "sage" },
  "pokemon.pokemon-master": { icon: "lorc/crown", tint: "amber" },
  "pokemon.champion-lance": { icon: "lorc/crossed-swords", tint: "rose" },
  "pokemon.elite-four": { icon: "delapouite/round-star", tint: "plum" },
  "pokemon.gym-battle": { icon: "lorc/castle", tint: "teal" },
  "pokemon.game-corner": { icon: "delapouite/coins-pile", tint: "amber" },
  "pokemon.meowth": { icon: "delapouite/coins-pile", tint: "amber" },
  "pokemon.bug-contest": { icon: "lorc/treasure-map", tint: "sage" },
  "pokemon.safari-zone": { icon: "lorc/treasure-map", tint: "sepia" },
  "pokemon.bicycle": { icon: "lorc/treasure-map", tint: "sage" },
  "pokemon.egg": { icon: "lorc/gift-of-knowledge", tint: "amber" },
  "pokemon.togepi": { icon: "lorc/crowned-heart", tint: "rose" },
  "pokemon.eevee": { icon: "lorc/crowned-heart", tint: "sage" },
  "pokemon.team-rocket": { icon: "lorc/skull-crossed-bones", tint: "ash" },
  "pokemon.team-magma": { icon: "lorc/heartburn", tint: "rose" },
  "pokemon.team-aqua": { icon: "delapouite/wine-bottle", tint: "teal" },
  "pokemon.missingno": { icon: "lorc/skull-crossed-bones", tint: "plum" },
  "pokemon.pokemon-tower": { icon: "lorc/skull-crossed-bones", tint: "ash" },
  "pokemon.gloom": { icon: "lorc/poison-bottle", tint: "sage" },
  "pokemon.spoink": { icon: "lorc/brain", tint: "plum" },
  "pokemon.snorlax": { icon: "lorc/beer-stein", tint: "teal" },
  "pokemon.seaking": { icon: "delapouite/beer-horn", tint: "teal" },
};

/**
 * Motif pools used by the deterministic fallback. Keep these broad and
 * thematic; every entry is shipped in the generated sprite, so the pool is a
 * direct cost against the lazy JavaScript budget.
 */
export const defaultIcons = [
  "lorc/beer-stein",
  "delapouite/beer-horn",
  "delapouite/mug-shot",
  "lorc/crown",
  "delapouite/dice-fire",
  "lorc/crossed-swords",
  "sbed/shield",
  "delapouite/wine-bottle",
  "delapouite/tavern-sign",
  "delapouite/hops",
  "delapouite/coins-pile",
  "lorc/skull-crossed-bones",
  "lorc/key",
  "lorc/treasure-map",
  "delapouite/round-star",
  "lorc/castle",
] as const;

/** Small ornaments placed at the lattice intersections. */
export const ornamentIcons = [
  "lorc/cut-diamond",
  "lorc/checkered-diamond",
  "delapouite/flower-emblem",
  "lorc/fluffy-trefoil",
  "lorc/fluffy-swirl",
  "skoll/diamonds",
  "delapouite/star-formation",
  "delapouite/deer-track",
] as const;

/** Every slug that must exist in the generated sprite. */
export function imprintIconSlugs(): string[] {
  const slugs = new Set<string>([...defaultIcons, ...ornamentIcons]);
  for (const assignment of Object.values(imprintAssignments)) {
    if (assignment.icon) slugs.add(assignment.icon);
    if (assignment.ornament) slugs.add(assignment.ornament);
  }
  return [...slugs].sort();
}
