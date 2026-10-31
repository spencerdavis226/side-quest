// Saved games for the browser specs, built through the engine: a League
// run or a Pub Crawl paused at a chosen card. Every draw they make is
// seeded (rng), so the same call builds the same save on every run.
import { advance, createSession } from "../../src/game/engine";
import type { PartyState, SessionState } from "../../src/game/types";
import { cards, packs } from "../../src/content/catalog";
import { rng } from "./support";

// Pokémon League plays on the crawl engine since 2026-10-16: a starter, eight
// routes each closed by a gym, a villain hideout, Victory Road, the rival and
// the League. The run's balance is tested in tests/league.balance.test.ts.
export const league = {
  version: 1,
  packIds: ["pokemon"],
  limit: null,
  quest: "pokemon",
} as const;

// A League run with `id` in play at its stage's first step, the starter put
// aside, and the party as given. `hideout` picks which villain team's route
// (0 to 8) the run takes.
export function leagueAt(
  id: string,
  party: Partial<PartyState> = {},
  hideout = 0,
  starter = "pokemon.starter-charmander",
): SessionState {
  const draws = [(hideout + 0.5) / 9];
  const rest = rng(`${id} ${hideout} ${starter}`);
  const s = createSession(
    { ...league, packIds: [...league.packIds] },
    cards,
    packs,
    () => (draws.length ? draws.shift()! : rest()),
  );
  const q = s.quest!;
  const finale = [...q.finale];
  let step = 0;
  let first = 0;
  for (const stage of q.stages) {
    if (stage.cards.some((c) => c.id === id)) step = first;
    else if (stage.elite?.some((c) => c.id === id)) step = first + 1;
    else {
      first += stage.pick;
      continue;
    }
    break;
  }
  const swap = (at: number, card: string) => {
    const was = finale.indexOf(card);
    if (was >= 0) finale[was] = finale[at];
    finale[at] = card;
  };
  swap(0, starter);
  if (step) swap(step, id);
  return {
    ...s,
    discarded: step,
    previousId: step ? finale[step - 1] : null,
    quest: {
      ...q,
      finale,
      step,
      party: { ...q.party!, ...(step ? { omen: starter } : {}), ...party },
    },
  };
}

// Where a run is, step by step: the adventurer, tonight's omen, the queue,
// the first floor's eight rooms and its boss, a landing, the second floor
// and its boss, a landing, the third floor, closing time, Last Call.
export const STEP = {
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
  stairs: 26,
  floor3: 27,
  closing: 35,
  lastCall: 36,
};

// A Pub Crawl seeded at `step` with `id` in play, the party as given. The
// floors are the first at each depth (the Cellar, the Catacombs, the Drowned
// Taproom) and the Speakeasy, unless `other` picks the second three (the
// Wine Cellar, the Sewers, the Kitchen) and the Basement, or `route` picks
// floors by index (2: the Brewery, the Walk-in Freezer, the Rooftop Bar).
// With `adventurer`, that class was dealt and put aside first.
export function crawlAt(
  id: string,
  step = 0,
  party: Partial<PartyState> = {},
  {
    other = false,
    route = other ? 1 : 0,
    adventurer,
    room = other ? 4 : 0,
  }: {
    other?: boolean;
    route?: number;
    adventurer?: string;
    room?: number;
  } = {},
): SessionState {
  // The route draws come in run order: floor 1, the hidden room (0 to 4),
  // floor 2, floor 3.
  const f = (route + 0.5) / 3;
  const floors = [f, (room + 0.5) / 5, f, f];
  const rest = rng(`${id} ${step} ${route} ${room} ${adventurer}`);
  let s = createSession(
    { version: 1, packIds: ["dungeon"], limit: null, quest: "dungeon" },
    cards,
    packs,
    () => floors.shift() ?? rest(),
  );
  const place = (s: SessionState, id: string, step: number) => {
    const finale = [...s.quest!.finale];
    const at = finale.indexOf(id);
    if (at >= 0) finale[at] = finale[step];
    finale[step] = id;
    return { ...s, quest: { ...s.quest!, finale } };
  };
  if (adventurer)
    s = advance(
      advance(place(s, `dungeon.class-${adventurer}`, 0), rest),
      rest,
    );
  s = place(s, id, step);
  const q = s.quest!;
  return {
    ...s,
    discarded: step,
    previousId: step ? q.finale[step - 1] : null,
    quest: { ...q, step, party: { ...q.party!, ...party } },
  };
}
