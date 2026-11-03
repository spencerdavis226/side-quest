import { describe, expect, it } from "vitest";
import {
  advance,
  createSession,
  currentCard,
  findCard,
  finaleStage,
  omenForm,
  previousCard,
  settleBattle,
  takeOffer,
} from "../src/game/engine";
import { parseSession } from "../src/app/persistence";
import { cardFactory } from "../src/content/author";
import { validateCatalog } from "../src/content/validate";
import type {
  CardDefinition,
  GameConfig,
  PackDefinition,
  SessionState,
} from "../src/game/types";

// Realms (2026-11-03): three engine additions for the fantasy crawl. A
// floor boss with `levelUp` levels the adventurer up when it falls (three
// ranks in a line now); `{dragon}` in a card's rules names the run's last
// card; a plaque with `skip` drops the stages after its own (declining a
// side quest). A tiny crawl tests each, real engine, no content.
const card = cardFactory("realm");
const hero: CardDefinition = {
  ...card("class", "Fighter", "rule", "Hits things."),
  encounter: "omen",
  omen: { hearts: 1 },
  evolves: [
    { title: "Knight", rules: "Two more hearts.", omen: { hearts: 2 } },
    { title: "Champion", rules: "Three more hearts.", omen: { hearts: 3 } },
    { title: "Legend", rules: "Four more hearts.", omen: { hearts: 4 } },
  ],
};
const summons = card(
  "summons",
  "The Summons",
  "rule",
  "{dragon} has woken. The king wants it dead.",
);
const plea: CardDefinition = {
  ...card("plea", "A Plea", "group", "A farmer begs for help."),
  encounter: "rest",
  offers: [{ label: "Accept" }, { label: "Decline", skip: 2 }],
};
const guard: CardDefinition = {
  ...card("guard", "A Guard", "challenge", "Fight."),
  encounter: "trial",
  battle: true,
  damage: 1,
};
const lieutenant = (n: number): CardDefinition => ({
  ...card(`boss-${n}`, `Lieutenant ${n}`, "challenge", "Fight."),
  encounter: "boss",
  battle: true,
  hits: 1,
  damage: 1,
  levelUp: true,
});
const road = card("road", "The Road", "sip", "Walk on, {dragon} ahead.");
const dragon: CardDefinition = {
  ...card("dragon", "Emberfang", "challenge", "Fight."),
  encounter: "boss",
  battle: true,
  hits: 1,
  damage: 1,
};
const filler = card("filler", "Filler", "sip", "Drink 1.");
const cards = [
  hero,
  summons,
  plea,
  guard,
  lieutenant(1),
  lieutenant(2),
  lieutenant(3),
  lieutenant(4),
  road,
  dragon,
  filler,
];
const one = (label: string, c: CardDefinition) => ({
  label,
  pick: 1,
  cardIds: [c.id],
});
const pack: PackDefinition = {
  version: 1,
  id: "realm",
  title: "Realm",
  description: "A test crawl.",
  cardIds: [filler.id],
  quest: {
    mode: "Realm",
    summary: "Test",
    label: "Hearts",
    goal: 0,
    length: 1,
    cardIds: [],
    party: { hearts: 10 },
    finale: [
      one("Class", hero),
      one("Summons", summons),
      one("Boss 1", lieutenant(1)),
      one("Side quest", plea),
      one("Guards", guard),
      one("Keeper", lieutenant(2)),
      one("Boss 2", lieutenant(3)),
      one("Boss 3", lieutenant(4)),
      one("Road", road),
      one("Dragon", dragon),
    ],
  },
};
const config: GameConfig = {
  version: 1,
  packIds: ["realm"],
  limit: null,
  quest: "realm",
};
const party = (s: SessionState) => s.quest!.party!;
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
const begin = () => createSession(config, cards, [pack], () => 0.5);
/** Turn the card over and put it aside: a battle won or lost. */
const play = (s: SessionState, won = true) => {
  s = advance(s);
  return currentCard(s).battle ? settleBattle(s, won) : advance(s);
};
const label = (s: SessionState) => finaleStage(s.quest!).label;

describe("Realms engine additions", () => {
  it("validates three ranks in a line, a lieutenant, and a skip", () => {
    expect(() => validateCatalog(cards, [pack])).not.toThrow();
    const four = {
      ...hero,
      evolves: [...hero.evolves!, hero.evolves![0]],
    };
    expect(() => validateCatalog([four], [])).toThrow("Invalid evolves");
    const noHits = { ...lieutenant(9), hits: undefined };
    expect(() => validateCatalog([noHits], [])).toThrow("Invalid level up");
    const far = {
      ...plea,
      offers: [{ label: "Accept" }, { label: "Decline", skip: 4 }],
    };
    expect(() => validateCatalog([far], [])).toThrow("Invalid offers");
  });

  it("names the run's dragon on any card that asks for it", () => {
    let s = play(begin());
    s = advance(s);
    expect(currentCard(s).rules).toBe(
      "Emberfang has woken. The king wants it dead.",
    );
    s = advance(s);
    expect(previousCard(s)!.rules).toBe(
      "Emberfang has woken. The king wants it dead.",
    );
    expect(findCard(s, road.id)!.rules).toBe("Walk on, Emberfang ahead.");
    roundTrip(s);
  });

  it("levels the adventurer up each time a lieutenant falls, three times", () => {
    let s = play(play(begin()));
    expect(party(s).form ?? 0).toBe(0);
    // A lost swing levels nothing.
    s = play(s, false);
    expect(party(s).form ?? 0).toBe(0);
    s = play(s);
    expect(party(s)).toMatchObject({ form: 1, max: 12, hearts: 11 });
    roundTrip(s);
    // Accept the side quest: its keeper is the second rank.
    s = advance(s);
    s = takeOffer(s, 0);
    expect(label(s)).toBe("Guards");
    s = play(play(s));
    expect(party(s).form).toBe(2);
    s = play(s);
    expect(party(s).form).toBe(3);
    expect(omenForm(s.quest)).toMatchObject({
      title: "Legend",
      canEvolve: false,
    });
    // A fourth falls with nothing left to learn.
    s = play(s);
    expect(party(s).form).toBe(3);
    expect(label(s)).toBe("Road");
    roundTrip(s);
  });

  it("a declined side quest leaves the run, and the counts still add up", () => {
    let s = play(play(play(begin())));
    s = advance(s);
    expect(currentCard(s).id).toBe(plea.id);
    const before = s.quest!.finale.length;
    s = takeOffer(s, 1);
    expect(s.quest!.finale).toHaveLength(before - 2);
    expect(s.quest!.stages.map((st) => st.label)).not.toContain("Guards");
    expect(s.quest!.stages.map((st) => st.label)).not.toContain("Keeper");
    expect(label(s)).toBe("Boss 2");
    roundTrip(s);
    // The run plays on to the dragon and ends there.
    s = play(play(play(s)));
    expect(currentCard(advance(s)).id).toBe(dragon.id);
    s = play(s);
    expect(s.phase).toBe("complete");
    roundTrip(s);
  });
});
