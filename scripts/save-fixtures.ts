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
  awaitingChoice,
  createSession,
  currentCard,
  isBossCard,
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
  [
    "crawl-boons-and-jinx",
    crawl,
    (s) => (party(s).boons?.length ?? 0) >= 2 && !!party(s).jinx,
  ],
  ["crawl-quaffed", crawl, (s) => !!party(s).quaffed && !!s.roll],
  ["crawl-pressing-luck", crawl, (s) => (party(s).press ?? 0) >= 1],
  [
    "crawl-boss-mid-fight",
    crawl,
    (s) => party(s).hits > 0 && isBossCard(currentCard(s)),
  ],
  [
    "crawl-curse-and-cup",
    crawl,
    (s) => !!party(s).curse && (party(s).cup ?? 0) >= 2,
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
