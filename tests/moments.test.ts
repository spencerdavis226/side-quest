import { describe, expect, it } from "vitest";
import {
  advance,
  createSession,
  currentCard,
  runNames,
  takeOffer,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice } from "../src/game/dice";
import { cards, packs } from "../src/content/catalog";
import type { GameConfig, PartyState, SessionState } from "../src/game/types";
import {
  AMBIENT,
  cardFinish,
  entranceFor,
  hiddenRoomFor,
  momentsBetween,
} from "../src/components/moments/detect";
import { crawlTheme } from "../src/components/crawlTheme";

// The moments layer's triggers (2026-11-01): display only, read from two
// snapshots the table just made. A resume or an undo plays nothing.
const seeded = (seed: number): Random => {
  seed = (Math.imul(seed, 2654435761) >>> 0) % 2147483646 || 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
};
const league: GameConfig = {
  version: 1,
  packIds: ["pokemon"],
  limit: null,
  quest: "pokemon",
};
const crawl: GameConfig = {
  version: 1,
  packIds: ["dungeon"],
  limit: null,
  quest: "dungeon",
};
const kinds = (list: { kind: string }[]) => list.map((m) => m.kind);

/** The same game moved to finale step `step`, face down, as if dealt. */
function atStep(s: SessionState, step: number): SessionState {
  return {
    ...s,
    phase: "hidden",
    roll: null,
    previousId: "something-else",
    discarded: s.discarded + step,
    quest: { ...s.quest!, step, due: true },
  };
}
const stepOf = (s: SessionState, label: string) => {
  let first = 0;
  for (const stage of s.quest!.stages) {
    if (stage.label === label) return first;
    first += stage.pick;
  }
  throw Error(`no stage ${label}`);
};

describe("moments", () => {
  const s = createSession(league, cards, packs, seeded(3));

  it("plays nothing on a resumed game or an undo", () => {
    const next = advance(s, seeded(1));
    expect(momentsBetween(null, next)).toEqual([]);
    expect(momentsBetween(s, next, true)).toEqual([]);
  });

  it("turns the League's starter over with a ball", () => {
    const next = advance(s, seeded(1));
    const found = momentsBetween(s, next);
    expect(kinds(found)).toContain("omen");
    expect(found.find((m) => m.kind === "omen")).toMatchObject({
      league: true,
      title: currentCard(next).title,
    });
  });

  it("gives a gym leader a VS entrance once, never when dealt again", () => {
    const step = stepOf(s, "Gym 3");
    const before = atStep(s, step - 1);
    const gym = atStep(s, step);
    const found = momentsBetween(before, gym);
    const entrance = found.find((m) => m.kind === "entrance");
    expect(entrance).toMatchObject({
      style: "gym",
      league: true,
      kicker: "Gym 3",
      title: currentCard(gym).title,
    });
    expect(entrance && "badge" in entrance && entrance.badge?.name).toMatch(
      / Badge$/,
    );
    // Dealt again after a lost swing: the same card was just put aside.
    const again = { ...gym, previousId: currentCard(gym).id };
    expect(entranceFor(again)).toBeNull();
    // After a landed hit: the tally's, not an entrance.
    const hit = {
      ...gym,
      quest: { ...gym.quest!, party: { ...gym.quest!.party!, hits: 1 } },
    };
    expect(entranceFor(hit)).toBeNull();
  });

  it("names each League finale's entrance", () => {
    const styles = ["Legendary", "Elite Four", "Champion"].map((label) => {
      const step = stepOf(s, label);
      return entranceFor(atStep(s, step))?.style;
    });
    expect(styles).toEqual(["legendary", "elite", "champion"]);
    const rival = entranceFor(atStep(s, stepOf(s, "Pokémon League")));
    expect(rival?.style).toBe("rival");
  });

  it("drops a portcullis for a Pub Crawl floor boss, gilt for the last", () => {
    const c = createSession(crawl, cards, packs, seeded(5));
    const labels = c.quest!.stages.map((st) => st.label);
    const bossLabel = labels.find((l) => / boss$/.test(l))!;
    expect(entranceFor(atStep(c, stepOf(c, bossLabel)))?.style).toBe("boss");
    const last = c.quest!.finale.length - 1;
    expect(entranceFor(atStep(c, last))?.style).toBe("final");
  });

  it("evolves on a form change, with what changed", () => {
    const started = advance(advance(s, seeded(1)), seeded(1));
    const party = started.quest!.party!;
    expect(party.omen).toBeTruthy();
    const evolved = {
      ...started,
      quest: { ...started.quest!, party: { ...party, form: 1 } },
    };
    const found = momentsBetween(started, evolved);
    expect(kinds(found)).toContain("evolution");
  });

  it("slams the dragon's move in as its round turns over, and the enrage contest", () => {
    const c = createSession(crawl, cards, packs, seeded(5));
    const last = c.quest!.finale.length - 1;
    const at = (duel: PartyState["duel"]) => {
      const s = atStep(c, last);
      return {
        ...s,
        quest: { ...s.quest!, party: { ...s.quest!.party!, duel } },
      };
    };
    const hidden = at({ move: 2, swings: 1 });
    const shown = { ...hidden, phase: "revealed" as const };
    const dragon = currentCard(shown);
    const move = momentsBetween(hidden, shown).find(
      (m) => m.kind === "dragonmove",
    );
    expect(move).toMatchObject({ name: dragon.ribbon, enraged: false });
    expect(move?.say).toContain(dragon.ribbon!);
    // A resume plays nothing.
    expect(momentsBetween(null, shown)).toEqual([]);
    const contest = at({ move: 0, swings: 2, contest: true });
    const enraged = momentsBetween(contest, {
      ...contest,
      phase: "revealed",
    }).find((m) => m.kind === "enraged");
    expect(enraged).toMatchObject({ dragon: dragon.title });
  });

  it("the Summons names the dragon and its lair; a dragon sign's shadow passes (Phase 3)", () => {
    const c = createSession(crawl, cards, packs, seeded(6));
    const { dragon, lair, id } = runNames(c.quest!);
    const summons = atStep(c, stepOf(c, "The King's Summons"));
    const wanted = momentsBetween(summons, {
      ...summons,
      phase: "revealed",
    }).find((m) => m.kind === "wanted");
    expect(wanted).toMatchObject({ id, dragon, lair });
    expect(wanted?.say).toContain(dragon!);
    const sign = atStep(c, stepOf(c, "A Dragon Sign"));
    const shown = { ...sign, phase: "revealed" as const };
    expect(kinds(momentsBetween(sign, shown))).toContain("shadow");
    expect(AMBIENT.has("shadow")).toBe(true);
    // Never on a resume or an undo.
    expect(momentsBetween(null, shown)).toEqual([]);
    expect(momentsBetween(sign, shown, true)).toEqual([]);
  });

  it("a Quest rank up carries its class's line for the table", () => {
    const theme = crawlTheme("dungeon");
    const classIds = cards
      .filter((c) => c.id.startsWith("dungeon.class-"))
      .map((c) => c.id);
    expect(Object.keys(theme.rankLines!).sort()).toEqual(classIds.sort());
    const c = createSession(crawl, cards, packs, seeded(5));
    const started = advance(advance(c, seeded(1)), seeded(1));
    const party = started.quest!.party!;
    const ranked = {
      ...started,
      quest: { ...started.quest!, party: { ...party, form: 1 } },
    };
    const rank = momentsBetween(started, ranked).find(
      (m) => m.kind === "evolution",
    );
    const line = theme.rankLines![party.omen!];
    expect(rank).toMatchObject({ line });
    expect(rank?.say).toContain(line);
  });

  /** The same game with its party changed, as the table just made it. */
  const withParty = (
    at: SessionState,
    change: Partial<NonNullable<SessionState["quest"]>["party"]>,
  ): SessionState => ({
    ...at,
    quest: { ...at.quest!, party: { ...at.quest!.party!, ...change } },
  });

  it("the map opens on a road card, and the road so far as a region begins (Phase 5)", () => {
    const c = createSession(crawl, cards, packs, seeded(12));
    const road = atStep(c, stepOf(c, "The Road Out"));
    const map = momentsBetween(road, { ...road, phase: "revealed" }).find(
      (m) => m.kind === "map",
    );
    expect(map).toMatchObject({ title: "The Road Out" });
    expect(AMBIENT.has("map")).toBe(true);
    // The road taken: the region's first card dealt face down.
    const shown = { ...road, phase: "revealed" as const };
    const took = takeOffer(shown, 0);
    const begun = momentsBetween(shown, took).find((m) => m.kind === "road");
    expect(begun).toMatchObject({
      region: currentCard(shown).offers![0].label,
    });
    expect((begun as { words: string }).words).not.toBe("");
    expect(momentsBetween(null, took)).toEqual([]);
  });

  it("an echo, a hidden result and a deed each have their moment (Phase 6)", () => {
    const c = createSession(crawl, cards, packs, seeded(14));
    // A deed set.
    const held = withParty(c, { deeds: ["freed"] });
    expect(kinds(momentsBetween(c, held))).toContain("deed");
    expect(AMBIENT.has("deed")).toBe(true);
    // An echo turns: put it in the run where the echo stage deals.
    const echo = stepOf(c, "An Echo");
    const finale = [...c.quest!.finale];
    finale[echo] = "dungeon.echo-hanged-man";
    const dealt = atStep({ ...c, quest: { ...c.quest!, finale } }, echo);
    const turned = momentsBetween(dealt, { ...dealt, phase: "revealed" });
    expect(turned.find((m) => m.kind === "echo")).toMatchObject({
      title: "The Hanged Man Returns",
      earlier: "The Gallows Tree",
    });
  });

  it("the Quest's lore, an ally joining, sent in and falling (Phase 4)", () => {
    const c = createSession(crawl, cards, packs, seeded(8));
    const at = atStep(c, stepOf(c, "The Last Inn"));
    const shown = { ...at, phase: "revealed" as const };
    const inn = c.quest!.finale[stepOf(c, "The Inn")];
    const { dragon, id } = runNames(c.quest!);
    // A lore found: the dragon's first line.
    const lore = momentsBetween(shown, withParty(shown, { lore: 1 })).find(
      (m) => m.kind === "lore",
    );
    expect(lore).toMatchObject({ dragon, id, count: 1 });
    expect(lore?.say).toMatch(/^You learn: /);
    // An ally joins (the first inn's hired blade).
    const joined = momentsBetween(shown, withParty(shown, { team: [inn] }));
    expect(joined.find((m) => m.kind === "ally")).toMatchObject({
      name: "A Hired Blade",
    });
    expect(kinds(joined)).not.toContain("join");
    // Sent in: no ball, its bonus.
    const held = withParty(shown, { team: [inn] });
    const sent = momentsBetween(held, withParty(held, { assist: inn }));
    expect(sent.find((m) => m.kind === "sendin")).toMatchObject({
      ally: true,
      bonus: "+3",
    });
    // Lost with it: fallen, never the League's faint.
    const lost = momentsBetween(withParty(held, { assist: inn }), {
      ...withParty(held, { fainted: inn, team: undefined }),
      discarded: held.discarded + 1,
    });
    expect(lost.find((m) => m.kind === "fallen")).toMatchObject({
      name: "A Hired Blade",
      stand: false,
    });
    expect(kinds(lost)).not.toContain("faint");
    // The last stand: it fell without being sent in.
    const stand = momentsBetween(held, {
      ...withParty(held, { fainted: inn, team: undefined, hearts: 1 }),
      discarded: held.discarded + 1,
    });
    expect(stand.find((m) => m.kind === "fallen")).toMatchObject({
      stand: true,
    });
  });

  it("catches a Legendary on its last beat as a join, never a ball's catch", () => {
    const at = atStep(s, stepOf(s, "Legendary"));
    const legendary = currentCard(at);
    const before = withParty(at, { team: [] });
    const found = momentsBetween(
      before,
      withParty(at, { team: [legendary.id] }),
    );
    expect(found.find((m) => m.kind === "join")).toMatchObject({
      name: legendary.title,
      type: legendary.type,
      hatched: false,
    });
    // A wild Pokémon caught with a ball has its own throw: no join.
    const wild = s
      .quest!.stages.flatMap((st) => st.cards)
      .find((c) => c.catchable && !c.joins)!;
    const thrown = momentsBetween(before, withParty(at, { team: [wild.id] }));
    expect(kinds(thrown)).not.toContain("join");
  });

  it("marks a fainted teammate once, by name", () => {
    const at = atStep(s, stepOf(s, "Route 2"));
    const fallen = s
      .quest!.stages.flatMap((st) => st.cards)
      .find((c) => c.catchable)!;
    const after = withParty(at, { fainted: fallen.id });
    const found = momentsBetween(at, after);
    expect(found.find((m) => m.kind === "faint")).toMatchObject({
      name: fallen.title,
      type: fallen.type,
    });
    // Still news on the next snapshot: not a second faint.
    expect(kinds(momentsBetween(after, after))).not.toContain("faint");
  });

  it("lays a jinx with its rule and lifts it when it goes", () => {
    const c = createSession(crawl, cards, packs, seeded(5));
    const at = atStep(c, 2);
    const jinxer = c
      .quest!.stages.flatMap((st) => st.cards)
      .find((card) => card.jinx)!;
    const jinxed = withParty(at, { jinx: jinxer.id });
    const laid = momentsBetween(at, jinxed).find((m) => m.kind === "jinx");
    expect(laid).toMatchObject({
      lifted: false,
      name: jinxer.jinx!.name,
      rule: jinxer.jinx!.rule,
      packId: "dungeon",
    });
    const lifted = momentsBetween(
      jinxed,
      withParty(
        { ...jinxed, discarded: jinxed.discarded + 1 },
        {
          jinx: undefined,
        },
      ),
    ).find((m) => m.kind === "jinx");
    expect(lifted).toMatchObject({ lifted: true, name: jinxer.jinx!.name });
    expect(laid?.key).not.toBe(lifted?.key);
  });

  it("clacks a pair of matching dice on a card that reads doubles, once", () => {
    const plain = createSession(
      { version: 1, packIds: ["core"], limit: 50 },
      cards,
      packs,
      seeded(4),
    );
    const id = plain.cards.find(
      (c) => c.dice?.doubles && c.dice.count === 2,
    )!.id;
    const at = plain.order.indexOf(id);
    const up: SessionState = { ...plain, phase: "revealed", position: at };
    // Every die reads the same face: a pair.
    const pair = returnToCard(rollDice(up, () => 0.5));
    const found = momentsBetween(up, pair).find((m) => m.kind === "doubles");
    expect(found).toMatchObject({ faces: [4, 4], sides: 6 });
    expect(kinds(momentsBetween(pair, pair))).not.toContain("doubles");
    // Faces that differ: nothing.
    let n = 0;
    const odd = returnToCard(rollDice(up, () => (n++ % 2 ? 0.1 : 0.9)));
    expect(kinds(momentsBetween(up, odd))).not.toContain("doubles");
  });

  it("raises a glass on a plain game's first card, and only the first", () => {
    const plain = createSession(
      { version: 1, packIds: ["core"], limit: 50 },
      cards,
      packs,
      seeded(6),
    );
    const turned = advance(plain, seeded(1));
    expect(
      momentsBetween(plain, turned).find((m) => m.kind === "milestone"),
    ).toMatchObject({ title: "Game on", opening: true });
    const second = advance(advance(turned, seeded(1)), seeded(1));
    const aside = advance(turned, seeded(1));
    expect(
      momentsBetween(aside, second).some(
        (m) => m.kind === "milestone" && m.opening,
      ),
    ).toBe(false);
    // A quest's first card is its omen's, not this.
    const omen = momentsBetween(s, advance(s, seeded(1)));
    expect(omen.some((m) => m.kind === "milestone")).toBe(false);
  });

  it("swings the bookcase open on a hidden room's first guard, once", () => {
    const c = createSession(crawl, cards, packs, seeded(5));
    const room = c.quest!.stages.find((st) =>
      st.cards.every((card) => / · Guard$/.test(card.ribbon ?? "")),
    )!;
    const step = stepOf(c, room.label);
    const door = atStep(c, step);
    expect(hiddenRoomFor(door)).toMatchObject({ title: room.label });
    expect(
      momentsBetween(atStep(c, step - 1), door).find((m) => m.kind === "door"),
    ).toMatchObject({ title: room.label, kicker: "A secret way in" });
    // Its second guard: no door.
    expect(hiddenRoomFor(atStep(c, step + 1))).toBeNull();
    // A floor's first room: no door.
    expect(
      hiddenRoomFor(atStep(c, stepOf(c, c.quest!.stages[4].label))),
    ).toBeNull();
  });

  it("stacks a banked pull, and a lost push is a bust", () => {
    const c = createSession(crawl, cards, packs, seeded(5));
    const at = atStep(c, 4);
    const ride = momentsBetween(at, withParty(at, { press: 1 })).find(
      (m) => m.kind === "press",
    );
    expect(ride).toMatchObject({ bust: false, banked: 1 });
    // Put aside on a lost pull (no roll that wins): the bank is gone.
    const pushing = withParty(at, { press: 2 });
    const lost = withParty(
      { ...pushing, discarded: pushing.discarded + 1, previousRoll: null },
      { press: undefined },
    );
    expect(
      momentsBetween(pushing, lost).find((m) => m.kind === "press"),
    ).toMatchObject({ bust: true, banked: 2 });
  });

  it("marks the last heart, but not a wipe or a heal back to one", () => {
    const c = createSession(crawl, cards, packs, seeded(5));
    const at = withParty(atStep(c, 4), { hearts: 3 });
    const one = withParty(at, { hearts: 1 });
    expect(
      momentsBetween(at, one).find((m) => m.kind === "thread"),
    ).toMatchObject({ league: false, line: "One heart left." });
    expect(
      kinds(momentsBetween(withParty(at, { hearts: 0 }), one)),
    ).not.toContain("thread");
    const hp = withParty(atStep(s, 4), { hearts: 4 });
    expect(
      momentsBetween(hp, withParty(hp, { hearts: 1 })).find(
        (m) => m.kind === "thread",
      ),
    ).toMatchObject({ league: true, line: "1 HP left." });
  });

  it("marks the deck's halfway, last orders and last card in Standard", () => {
    const plain = createSession(
      { version: 1, packIds: ["core"], limit: 50 },
      cards,
      packs,
      seeded(2),
    );
    const at = (n: number): SessionState => ({
      ...plain,
      phase: "hidden",
      discarded: n,
      position: n,
    });
    const title = (a: number, b: number) =>
      momentsBetween(at(a), at(b)).find((m) => m.kind === "milestone");
    expect(title(24, 25)).toMatchObject({ title: "Halfway" });
    expect(title(39, 40)).toMatchObject({ title: "Last orders" });
    expect(title(48, 49)).toMatchObject({ title: "Last card" });
    expect(title(25, 26)).toBeUndefined();
  });

  it("never plays the same natural twice for one roll", () => {
    const rolled: SessionState = {
      ...s,
      phase: "revealed",
      roll: null,
    };
    expect(momentsBetween(rolled, rolled)).toEqual([]);
  });

  it("foils the bosses: gold for the Legendary and Champion, silver for gyms", () => {
    const finish = (label: string) => {
      const at = atStep(s, stepOf(s, label));
      return cardFinish(at, currentCard(at));
    };
    expect(finish("Gym 1")).toBe("silver");
    expect(finish("Legendary")).toBe("gold");
    expect(finish("Champion")).toBe("gold");
    expect(finish("Route 1")).toBeNull();
    expect(finish("Elite Four")).toBe("silver");
    // Pearl and crimson ribbons are not bosses: the starter and the rival
    // (an ambush) wear none (the 2026-11-01 review: they wore gold).
    expect(finish("Your starter")).toBeNull();
    expect(finish("Pokémon League")).toBeNull();
    const c = createSession(crawl, cards, packs, seeded(5));
    const last = atStep(c, c.quest!.finale.length - 1);
    expect(cardFinish(last, currentCard(last))).toBe("gold");
    const crawlFinish = (label: string) => {
      const at = atStep(c, stepOf(c, label));
      return cardFinish(at, currentCard(at));
    };
    const firstBoss = c.quest!.stages.find((st) => / boss$/.test(st.label))!;
    expect(crawlFinish(firstBoss.label)).toBe("silver");
    expect(crawlFinish("Your adventurer")).toBeNull();
    expect(crawlFinish("The City Gate")).toBeNull();
  });
});
