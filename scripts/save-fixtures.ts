// Freeze real saved games as test fixtures (`tests/fixtures/saves/`).
//
// Each fixture is a session exactly as the app saves it, captured from a
// seeded game played through the real engine: the first state that matches
// its situation (a roll in flight, a starter evolved, a boss mid-fight, a
// wiped party...). `tests/save-fixtures.test.ts` requires every fixture ever
// written to keep loading, so a change to save checks or card rules that
// would turn a game in progress into "This save lost its place" fails the
// tests instead of reaching a phone.
//
// Files are named `<date>-<situation>.json` and never rewritten: this script
// skips a name that already exists. Run it (`npm run fixtures:saves`) when a
// change touches what a save holds or how it is checked, and commit the new
// files beside the old ones.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cards, packs } from "../src/content/catalog";
import {
  advance,
  awaitingCatch,
  awaitingChoice,
  cardMatchup,
  createSession,
  currentCard,
  isBossCard,
  awaitingSpoils,
  partyBoons,
  replaces,
  stageRule,
  strikeOutcome,
} from "../src/game/engine";
import { nextMove, seeded } from "./table-play";
import { parseSession } from "../src/app/persistence";
import type { GameConfig, SessionState } from "../src/game/types";

const DIR = "tests/fixtures/saves";
const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
// `npm run fixtures:saves <date> <name>` writes only the situation <name>.
const only = process.argv[3];

/** Every state a seeded game passes through, as the app would save it. */
function* play(config: GameConfig, seed: number) {
  const random = seeded(seed);
  let s = createSession(config, cards, packs, random);
  yield s;
  for (let guard = 0; guard < 3000 && s.phase !== "complete"; guard++) {
    s = nextMove(s, random);
    yield s;
  }
}

const config = (
  packIds: string[],
  limit: number | null,
  quest?: string,
): GameConfig => ({ version: 1, packIds, limit, ...(quest ? { quest } : {}) });
const standard = config(["core"], 50);
const plain = config(["core", "vip", "likely"], null);
const secrets = config(["core", "secrets"], null);
const league = config(["pokemon"], null, "pokemon");
const crawl = config(["dungeon"], null, "dungeon");

type Find = (s: SessionState) => boolean;
const party = (s: SessionState) => s.quest!.party!;
const situations: [string, GameConfig, Find][] = [
  ["standard-mid", standard, (s) => s.discarded >= 12 && s.phase === "hidden"],
  ["standard-roll-in-flight", standard, (s) => !!s.roll && !s.roll.returned],
  [
    "standard-roll-on-card",
    standard,
    (s) => !!s.roll?.returned && s.discarded >= 5,
  ],
  ["standard-complete", standard, (s) => s.phase === "complete"],
  [
    "infinite-second-round",
    plain,
    (s) => s.cycle >= 1 && s.phase === "revealed",
  ],
  ["infinite-choice-waiting", plain, (s) => awaitingChoice(s)],
  [
    "secrets-timed-card",
    secrets,
    (s) => s.phase === "revealed" && !!currentCard(s).timer,
  ],
  [
    "secrets-secret-card",
    secrets,
    (s) => s.phase === "revealed" && !!currentCard(s).secret,
  ],
  [
    "league-starter-chosen",
    league,
    (s) => !!party(s).omen && s.phase === "hidden",
  ],
  ["league-evolved", league, (s) => (party(s).form ?? 0) >= 1],
  [
    "league-gym-mid-fight",
    league,
    (s) => party(s).hits > 0 && isBossCard(currentCard(s)),
  ],
  [
    "league-bag-and-status",
    league,
    (s) => !!party(s).curse && party(s).loot.length >= 2,
  ],
  [
    "league-hall-of-fame",
    league,
    (s) => s.phase === "complete" && !party(s).wiped,
  ],
  // Type matchups (2026-10-25): a fight rolled twice, both ways.
  [
    "league-roll-with-advantage",
    league,
    (s) => s.roll?.edge === "advantage" && !s.roll.returned,
  ],
  [
    "league-roll-with-disadvantage",
    league,
    (s) => s.roll?.edge === "disadvantage" && s.roll.returned,
  ],
  // Strikes (2026-10-25): a fight with no roll, face up, each way the
  // matchup can go.
  ...(["advantage", "disadvantage", "even"] as const).map(
    (edge): [string, GameConfig, Find] => [
      `league-strike-${edge}`,
      league,
      (s) =>
        s.phase === "revealed" &&
        !!currentCard(s).strike &&
        (cardMatchup(s.quest, currentCard(s))?.edge ?? "even") === edge,
    ],
  ),
  // A Tera Orb spent on the battle face up, before its roll or verdict.
  ["league-terastallized", league, (s) => !!party(s).tera],
  [
    "crawl-boons-and-jinx",
    crawl,
    (s) => (party(s).boons?.length ?? 0) >= 2 && !!party(s).jinx,
  ],
  // New runs have no Quaff and no curses since 2026-10-25 (powers and
  // jinxes took their places); their 2026-10-18 and 2026-10-25 fixtures
  // stay and keep loading.
  ["crawl-pressing-luck", crawl, (s) => (party(s).press ?? 0) >= 1],
  [
    "crawl-boss-mid-fight",
    crawl,
    (s) => party(s).hits > 0 && isBossCard(currentCard(s)),
  ],

  // Forked levels (2026-10-25): a class on its second path, then at its
  // second level; and the Quarter-Zips on the stairs.
  [
    "crawl-second-path",
    crawl,
    (s) => party(s).form === 2 && s.phase === "hidden",
  ],
  ["crawl-second-level", crawl, (s) => (party(s).form ?? 0) >= 3],
  [
    "crawl-rival-on-the-stairs",
    crawl,
    (s) =>
      s.phase === "revealed" && currentCard(s).id.startsWith("dungeon.stairs-"),
  ],
  // Pub Crawl strikes (2026-10-25): a room with no roll, face up, settled
  // by the class's knack each way.
  ...(["won", "lost"] as const).map((outcome): [string, GameConfig, Find] => [
    `crawl-strike-${outcome}`,
    crawl,
    (s) =>
      s.phase === "revealed" &&
      !!currentCard(s).strike &&
      strikeOutcome(s.quest, currentCard(s)) === outcome,
  ]),
  // Equipment (2026-10-25): gear worn in two slots, and spoils waiting that
  // would replace a piece.
  [
    "crawl-gear-worn",
    crawl,
    (s) =>
      s.phase === "hidden" &&
      new Set(partyBoons(s.quest).flatMap((b) => b.boon.slot ?? [])).size >= 2,
  ],
  // A class's starting gear, worn (2026-10-25).
  [
    "crawl-starting-gear",
    crawl,
    (s) =>
      s.phase === "hidden" &&
      (party(s).boons ?? []).some((k) => k.endsWith("#k")),
  ],
  [
    "crawl-spoils-would-replace",
    crawl,
    (s) =>
      awaitingSpoils(s) &&
      currentCard(s).spoils!.some((b) => replaces(s.quest, b).length > 0),
  ],
  // A knack (2026-10-25): a room rolled with the edge for the class.
  ["crawl-knack-roll", crawl, (s) => !!s.roll?.edge && !s.roll.returned],
  // The 2026-10-25 overhaul: a power armed on the card face up and spent;
  // a boss on a later beat, as a duel, and as the beat Previous Card
  // shows; a floor's rule bending a roll; the League's catch, a Champion's
  // ace, a route's rule and a starter's move.
  [
    "crawl-power-armed",
    crawl,
    (s) => !!party(s).armed && s.phase === "revealed",
  ],
  [
    "crawl-power-spent",
    crawl,
    (s) => (party(s).powers ?? 0) >= 1 && s.phase === "hidden",
  ],
  [
    "crawl-boss-duel-beat",
    crawl,
    (s) =>
      s.phase === "revealed" &&
      party(s).hits > 0 &&
      !!currentCard(s).phases &&
      !currentCard(s).dice,
  ],
  [
    "crawl-boss-beat-behind",
    crawl,
    (s) => party(s).beat !== undefined && s.phase === "hidden",
  ],
  [
    "crawl-floor-rule-roll",
    crawl,
    (s) => !!stageRule(s.quest) && !!s.roll && !s.roll.returned,
  ],
  [
    "league-catch-beat",
    league,
    (s) =>
      s.phase === "revealed" &&
      party(s).hits > 0 &&
      currentCard(s).id.startsWith("pokemon.legendary-"),
  ],
  [
    "league-champion-ace",
    league,
    (s) =>
      party(s).hits >= 2 &&
      currentCard(s).id.startsWith("pokemon.league-champion-"),
  ],
  [
    "league-move-spent",
    league,
    (s) => (party(s).powers ?? 0) >= 1 && s.phase === "revealed",
  ],
  // The League's team and gym aces (2026-10-25).
  ["league-catch-waiting", league, (s) => awaitingCatch(s)],
  [
    "league-team-caught",
    league,
    (s) => (party(s).team?.length ?? 0) >= 2 && s.phase === "hidden",
  ],
  ["league-teammate-sent", league, (s) => !!party(s).sent],
  [
    "league-gym-ace",
    league,
    (s) =>
      s.phase === "revealed" &&
      party(s).hits > 0 &&
      currentCard(s).id.startsWith("pokemon.gym-"),
  ],
  ["crawl-wiped", crawl, (s) => party(s).wiped],
  ["crawl-survived", crawl, (s) => s.phase === "complete" && !party(s).wiped],
];

function find(config: GameConfig, match: Find) {
  for (let seed = 1; seed <= 400; seed++)
    for (const s of play(config, seed)) if (match(s)) return s;
  throw Error("No seeded game reached this situation");
}

/** A version-1 save from before dice: Core's plain cards, mid-game. */
function legacy() {
  const core = packs.find((p) => p.id === "core")!;
  const plainCards = cards.filter(
    (c) => core.cardIds.includes(c.id) && !c.dice,
  );
  let s = createSession(
    config(["core"], 40),
    plainCards,
    [{ ...core, cardIds: plainCards.map((c) => c.id) }],
    seeded(7),
  );
  for (let i = 0; i < 15; i++) s = advance(s, seeded(i + 1));
  const { roll: _roll, previousRoll: _previous, ...rest } = s;
  return { ...rest, version: 1 };
}

/** A save from before 2026-10-24, when House and Cabin weekend were packs of
 * their own: its config names them, and no pack of that name exists now. */
function retiredPacks() {
  const s = find(standard, (s) => s.discarded >= 12 && s.phase === "hidden");
  return { ...s, config: { ...s.config, packIds: ["house", "cabin"] } };
}

mkdirSync(DIR, { recursive: true });
const write = (name: string, session: unknown) => {
  if (only && name !== only) return;
  const file = join(DIR, `${date}-${name}.json`);
  if (existsSync(file)) return console.log(`kept   ${file}`);
  // Only a save the app loads today is worth freezing.
  parseSession(JSON.stringify(session));
  writeFileSync(file, JSON.stringify(session) + "\n");
  console.log(`wrote  ${file}`);
};
for (const [name, cfg, match] of situations)
  if (!only || name === only) write(name, find(cfg, match));
write("retired-house-and-cabin-packs", retiredPacks());
write("legacy-v1", legacy());
