import { validateDice } from "../game/dice";
import { validateTimer } from "../game/timer";
import type { CardDefinition, PackDefinition, QuestStage } from "../game/types";
import {
  CURSES,
  ENCOUNTERS,
  KNACKS,
  LOOT,
  POKEMON_TYPES,
  RIBBON_TONES,
} from "../game/types";

// Structural validation for cards and packs. Kept apart from `catalog.ts` so
// saved-session parsing can use it without pulling card content into the
// initial chunk.
export function validateCatalog(cs: CardDefinition[], ps: PackDefinition[]) {
  const fail = (message: string): never => {
    throw new Error(message);
  };
  const ids = new Set<string>();
  for (const c of cs) {
    if (
      !c ||
      c.version !== 1 ||
      typeof c.id !== "string" ||
      !/^[a-z0-9][a-z0-9.-]*$/.test(c.id) ||
      ids.has(c.id)
    )
      fail("Invalid or duplicate card ID");
    ids.add(c.id);
    if (c.dice !== undefined) validateDice(c.dice);
    if (!["sip", "group", "category", "challenge", "rule"].includes(c.category))
      fail(`Invalid category: ${c.id}`);
    for (const key of ["title", "rules", "artwork"] as const)
      if (typeof c[key] !== "string" || !c[key].trim())
        fail(`Missing ${key}: ${c.id}`);
    if (!/^art\/[a-zA-Z0-9/_-]+\.(svg|png|webp|avif)$/.test(c.artwork))
      fail(`Invalid artwork: ${c.id}`);
    if (c.quest !== undefined && (typeof c.quest !== "string" || !c.quest))
      fail(`Invalid quest: ${c.id}`);
    if (
      c.ribbon !== undefined &&
      (typeof c.ribbon !== "string" || !c.ribbon.trim() || c.ribbon.length > 32)
    )
      fail(`Invalid ribbon: ${c.id}`);
    if (
      c.ribbonTone !== undefined &&
      (!c.ribbon || !RIBBON_TONES.includes(c.ribbonTone))
    )
      fail(`Invalid ribbon tone: ${c.id}`);
    if (
      c.secret !== undefined &&
      (typeof c.secret !== "string" ||
        !c.secret.trim() ||
        c.secret.length > 120)
    )
      fail(`Invalid secret: ${c.id}`);
    if (c.timer !== undefined) {
      validateTimer(c.timer);
      // One mechanic at a time: a timed card never also rolls.
      if (c.dice !== undefined) fail(`Timer and dice on one card: ${c.id}`);
    }
    if (c.secret !== undefined && c.dice !== undefined)
      fail(`Secret and dice on one card: ${c.id}`);
    // A battle can be won and lost: dice need both kinds of outcome, and a
    // battle without dice is settled with plaques, so nothing else on it. A
    // choice battle's skip walks away from the fight: neither won nor lost.
    if (c.battle !== undefined) {
      const outcomes = c.dice?.outcomes ?? [];
      const results = [
        ...outcomes.map((o) => !!o.win),
        ...(c.dice?.doubles ? [!!c.dice.doublesWin] : []),
      ];
      if (
        c.battle !== true ||
        c.secret !== undefined ||
        c.timer !== undefined ||
        (c.dice && (!results.includes(true) || !results.includes(false)))
      )
        fail(`Invalid battle: ${c.id}`);
    } else if (c.dice?.outcomes?.some((o) => o.win) || c.dice?.doublesWin)
      fail(`Win outcome on a card that is not a battle: ${c.id}`);
    // A strike is a fight the type matchup settles: three lines, and nothing
    // that would put the card aside another way.
    if (
      c.strike !== undefined &&
      (!c.strike ||
        c.battle ||
        c.dice ||
        c.timer ||
        c.secret ||
        c.offers ||
        c.hits ||
        (["even", "advantage", "disadvantage"] as const).some(
          (k) =>
            typeof c.strike![k] !== "string" ||
            !c.strike![k].trim() ||
            c.strike![k].length > 60,
        ))
    )
      fail(`Invalid strike: ${c.id}`);
    // Pub Crawl stakes: hearts lost, boss swings, rewards and curses.
    const count = (n: unknown, max: number) =>
      Number.isSafeInteger(n) && (n as number) >= 1 && (n as number) <= max;
    if (
      c.damage !== undefined &&
      (!(c.battle || c.strike) || !count(c.damage, 5))
    )
      fail(`Invalid damage: ${c.id}`);
    if (c.hits !== undefined && (!c.battle || !count(c.hits, 5)))
      fail(`Invalid boss hits: ${c.id}`);
    if (
      c.reward !== undefined &&
      (!c.reward ||
        (c.reward.loot === undefined && c.reward.heal === undefined) ||
        (c.reward.loot !== undefined && !LOOT.includes(c.reward.loot)) ||
        (c.reward.heal !== undefined && !count(c.reward.heal, 5)))
    )
      fail(`Invalid reward: ${c.id}`);
    if (c.curse !== undefined && !CURSES.includes(c.curse))
      fail(`Invalid curse: ${c.id}`);
    if (c.encounter !== undefined && !ENCOUNTERS.includes(c.encounter))
      fail(`Invalid encounter: ${c.id}`);
    // A merchant's wares or a fork's doors: two or three plaques, on a card
    // with no other way to be put aside.
    if (
      c.offers !== undefined &&
      (!Array.isArray(c.offers) ||
        c.offers.length < 2 ||
        c.offers.length > 3 ||
        c.battle ||
        c.dice ||
        c.timer ||
        c.secret ||
        c.reward ||
        c.offers.some(
          (o) =>
            !o ||
            typeof o.label !== "string" ||
            !o.label.trim() ||
            o.label.length > 18 ||
            (o.cost !== undefined && !count(o.cost, 5)) ||
            (o.heal !== undefined && !count(o.heal, 5)) ||
            (o.loot !== undefined && !LOOT.includes(o.loot)) ||
            (o.elite !== undefined && o.elite !== true) ||
            (o.evolve !== undefined && o.evolve !== true),
        ))
    )
      fail(`Invalid offers: ${c.id}`);
    // A starter's later forms: one or two, each with its own omen effect.
    if (
      c.evolves !== undefined &&
      (c.omen === undefined ||
        !Array.isArray(c.evolves) ||
        c.evolves.length < 1 ||
        c.evolves.length > (c.branches ? 3 : 2) + (c.fork ? 2 : 0) ||
        (c.fork !== undefined &&
          (c.fork !== true || c.evolves.length !== 4 || c.branches)) ||
        c.evolves.some(
          (e) =>
            !e ||
            [e.title, e.rules].some(
              (text) => typeof text !== "string" || !text.trim(),
            ) ||
            e.title.length > 24 ||
            (e.tagline !== undefined &&
              (typeof e.tagline !== "string" ||
                !e.tagline.trim() ||
                e.tagline.length > 28)) ||
            !e.omen,
        ))
    )
      fail(`Invalid evolves: ${c.id}`);
    // A League type (2026-10-25): one of the eighteen (or the Striaton
    // trio), on a fight or a starter, and on a starter's form.
    if (
      (c.type !== undefined &&
        (!POKEMON_TYPES.includes(c.type) ||
          (!c.battle && !c.omen && !c.strike))) ||
      (Array.isArray(c.evolves) &&
        c.evolves.some(
          (e) =>
            e?.type !== undefined &&
            (!POKEMON_TYPES.includes(e.type) || e.type === "trio"),
        ))
    )
      fail(`Invalid type: ${c.id}`);
    // Dice colours: two hex colours, on an omen or a starter's form.
    const hexColor = (v: unknown) =>
      typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
    for (const p of [
      c.palette,
      ...(Array.isArray(c.evolves) ? c.evolves.map((e) => e.palette) : []),
    ])
      if (
        p !== undefined &&
        (!c.omen || !p || !hexColor(p.primary) || !hexColor(p.secondary))
      )
        fail(`Invalid palette: ${c.id}`);
    if (c.branches !== undefined && (c.branches !== true || !c.evolves))
      fail(`Invalid branches: ${c.id}`);
    // Pub Crawl's knacks (2026-10-25): two on an adventurer, one on a fight.
    if (
      (c.knacks !== undefined &&
        (!c.omen ||
          !Array.isArray(c.knacks) ||
          c.knacks.length > 2 ||
          new Set(c.knacks).size !== c.knacks.length ||
          c.knacks.some((k) => !KNACKS.includes(k)))) ||
      (c.knack !== undefined &&
        (!(c.battle || c.strike) || !KNACKS.includes(c.knack)))
    )
      fail(`Invalid knack: ${c.id}`);
    // A boon: a name, its rules, and an effect like an omen's. It may sit on
    // a fight (a trinket a boss drops), never beside an omen.
    if (
      c.boon !== undefined &&
      (!c.boon ||
        c.omen !== undefined ||
        typeof c.boon.name !== "string" ||
        !c.boon.name.trim() ||
        c.boon.name.length > 24 ||
        typeof c.boon.rules !== "string" ||
        !c.boon.rules.trim() ||
        !c.boon.effect ||
        typeof c.boon.effect !== "object")
    )
      fail(`Invalid boon: ${c.id}`);
    // Spoils: two or three boons offered by a dice fight when it is won.
    const goodBoon = (b: unknown) => {
      const boon = b as { name?: unknown; rules?: unknown; effect?: unknown };
      return (
        !!boon &&
        typeof boon.name === "string" &&
        !!boon.name.trim() &&
        boon.name.length <= 24 &&
        typeof boon.rules === "string" &&
        !!boon.rules.trim() &&
        !!boon.effect &&
        typeof boon.effect === "object"
      );
    };
    if (
      c.spoils !== undefined &&
      (!Array.isArray(c.spoils) ||
        c.spoils.length < 2 ||
        c.spoils.length > 3 ||
        !c.battle ||
        !c.dice ||
        c.boon !== undefined ||
        c.omen !== undefined ||
        !c.spoils.every(goodBoon))
    )
      fail(`Invalid spoils: ${c.id}`);
    // Push your luck: one to three prizes, on a plain single-d20 battle.
    if (
      c.press !== undefined &&
      (!c.press ||
        !Array.isArray(c.press.prizes) ||
        c.press.prizes.length < 1 ||
        c.press.prizes.length > 3 ||
        c.press.prizes.some((item) => !LOOT.includes(item)) ||
        !c.battle ||
        c.dice?.count !== 1 ||
        c.dice.sides !== 20 ||
        c.dice.choice ||
        c.hits ||
        c.reward ||
        c.spoils)
    )
      fail(`Invalid press: ${c.id}`);
    if (
      c.jinx !== undefined &&
      (!c.jinx ||
        typeof c.jinx.name !== "string" ||
        !c.jinx.name.trim() ||
        c.jinx.name.length > 22 ||
        typeof c.jinx.rule !== "string" ||
        !c.jinx.rule.trim() ||
        c.jinx.rule.length > 110)
    )
      fail(`Invalid jinx: ${c.id}`);
    const omens = [
      ...(c.omen !== undefined ? [c.omen] : []),
      ...(Array.isArray(c.evolves) ? c.evolves.map((e) => e.omen) : []),
    ];
    for (const o of [
      ...omens,
      ...(c.boon ? [c.boon.effect] : []),
      ...(Array.isArray(c.spoils) ? c.spoils.map((b) => b?.effect) : []),
    ]) {
      const step = (n: unknown, lo: number, hi: number) =>
        n === undefined ||
        (Number.isSafeInteger(n) && (n as number) >= lo && (n as number) <= hi);
      if (
        !o ||
        (omens.includes(o) && (c.battle || c.dice || c.offers || c.reward)) ||
        !step(o.hearts, -6, 6) ||
        !step(o.satchel, 1, 5) ||
        !step(o.heal, -2, 3) ||
        !step(o.bossHits, -1, 2) ||
        (o.loot !== undefined &&
          (!Array.isArray(o.loot) ||
            o.loot.length > (o.satchel ?? 3) ||
            o.loot.some((item) => !LOOT.includes(item)))) ||
        (o.hurt !== undefined &&
          (!o.hurt ||
            typeof o.hurt !== "object" ||
            Object.entries(o.hurt).some(
              ([kind, n]) =>
                !ENCOUNTERS.includes(kind as never) || !step(n, -2, 3),
            ))) ||
        (o.roll !== undefined &&
          (!o.roll ||
            typeof o.roll !== "object" ||
            Object.entries(o.roll).some(
              ([kind, n]) =>
                (kind !== "all" && !ENCOUNTERS.includes(kind as never)) ||
                !step(n, -3, 3),
            ))) ||
        !step(o.crit, 17, 20) ||
        !step(o.fumble, 1, 3) ||
        (o.reroll20 !== undefined && o.reroll20 !== true) ||
        (o.restock !== undefined && !LOOT.includes(o.restock))
      )
        fail(`Invalid omen: ${c.id}`);
    }
  }
  const packIds = new Set<string>();
  for (const p of ps) {
    if (
      !p ||
      p.version !== 1 ||
      typeof p.id !== "string" ||
      !p.id ||
      packIds.has(p.id) ||
      !p.title?.trim() ||
      !p.description?.trim()
    )
      fail("Invalid or duplicate pack");
    if (
      p.artwork !== undefined &&
      (typeof p.artwork !== "string" ||
        !/^art\/[a-zA-Z0-9/_-]+\.(svg|png|webp|avif)$/.test(p.artwork))
    )
      fail(`Invalid pack artwork: ${p.id}`);
    if (
      p.logo !== undefined &&
      (typeof p.logo !== "string" ||
        !/^art\/[a-zA-Z0-9/_-]+\.(svg|png|webp|avif)$/.test(p.logo))
    )
      fail(`Invalid pack logo: ${p.id}`);
    packIds.add(p.id);
    if (
      !Array.isArray(p.cardIds) ||
      !p.cardIds.length ||
      new Set(p.cardIds).size !== p.cardIds.length ||
      p.cardIds.some((id) => !ids.has(id))
    )
      fail(`Invalid card membership: ${p.id}`);
    if (p.quest !== undefined) {
      const {
        mode,
        summary,
        label,
        goal,
        length,
        finale,
        cardIds,
        party,
        mark,
      } = p.quest;
      // A crawl deals its stages from the first card, and its rooms may be
      // the pack's own deck cards.
      const crawl = party !== undefined;
      // Each slot is a stage, or `oneOf` a set of routes of stages.
      const slots = Array.isArray(finale) ? finale : [];
      const badSlot = slots.some(
        (slot) =>
          !slot ||
          ("oneOf" in slot &&
            (!Array.isArray(slot.oneOf) ||
              slot.oneOf.length < 2 ||
              slot.oneOf.some(
                (route) => !Array.isArray(route) || !route.length,
              ))),
      );
      const stages: QuestStage[] = badSlot
        ? []
        : slots.flatMap((slot) =>
            "oneOf" in slot ? slot.oneOf.flat() : [slot],
          );
      const finaleIds = stages.flatMap((stage) => [
        ...(Array.isArray(stage?.cardIds) ? stage.cardIds : []),
        ...(Array.isArray(stage?.elite) ? stage.elite : []),
      ]);
      const playable = [...p.cardIds, ...(cardIds ?? [])];
      const advancing = cs.filter(
        (c) => c.quest === p.id && playable.includes(c.id),
      ).length;
      if (
        [mode, summary, label].some(
          (text) => typeof text !== "string" || !text.trim(),
        ) ||
        !Number.isSafeInteger(goal) ||
        goal < (crawl ? 0 : 1) ||
        (crawl &&
          (goal !== 0 ||
            !Number.isSafeInteger(party?.hearts) ||
            party!.hearts < 1 ||
            party!.hearts > 30 ||
            (party!.quaff !== undefined &&
              (!Number.isSafeInteger(party!.quaff) ||
                party!.quaff < 1 ||
                party!.quaff > 6)) ||
            (party!.cup !== undefined && party!.cup !== true))) ||
        (mark !== undefined &&
          (typeof mark !== "string" ||
            !/^art\/[a-zA-Z0-9/_-]+\.svg$/.test(mark))) ||
        !Number.isSafeInteger(length) ||
        length <= goal ||
        !Array.isArray(cardIds) ||
        new Set(cardIds).size !== cardIds.length ||
        cardIds.some((id) => !ids.has(id) || p.cardIds.includes(id)) ||
        !Array.isArray(finale) ||
        !finale.length ||
        badSlot ||
        stages.some(
          (stage) =>
            typeof stage?.label !== "string" ||
            !stage.label.trim() ||
            (stage.intro !== undefined &&
              (typeof stage.intro !== "string" ||
                !stage.intro.trim() ||
                stage.intro.length > 28)) ||
            !Number.isSafeInteger(stage.pick) ||
            stage.pick < 1 ||
            !Array.isArray(stage.cardIds) ||
            stage.pick > stage.cardIds.length ||
            (stage.elite !== undefined &&
              (!crawl || !Array.isArray(stage.elite) || !stage.elite.length)),
        ) ||
        new Set(finaleIds).size !== finaleIds.length ||
        finaleIds.some(
          (id) => !ids.has(id) || (!crawl && playable.includes(id)),
        ) ||
        advancing < goal
      )
        fail(`Invalid quest: ${p.id}`);
    }
  }
}
