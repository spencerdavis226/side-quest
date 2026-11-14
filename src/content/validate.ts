import { validateDice } from "../game/dice";
import { validateTimer } from "../game/timer";
import type {
  Loot,
  Encounter,
  CardDefinition,
  OmenEffect,
  PackDefinition,
  QuestStage,
} from "../game/types";
import {
  ENCOUNTERS,
  LOOT,
  POKEMON_TYPES,
  RIBBON_TONES,
  SLOTS,
  type Slot,
} from "../game/types";

// Structural validation for cards and packs. Kept apart from `catalog.ts` so
// saved-session parsing can use it without pulling card content into the
// initial chunk.
const step = (n: unknown, lo: number, hi: number) =>
  n === undefined ||
  (Number.isSafeInteger(n) && (n as number) >= lo && (n as number) <= hi);
/** Whether an omen effect (an omen's, a form's, a boon's) is malformed. */
export function badEffect(o: OmenEffect): boolean {
  return (
    !o ||
    typeof o !== "object" ||
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
          ([kind, n]) => !ENCOUNTERS.includes(kind as never) || !step(n, -2, 3),
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
  );
}
export function validateCatalog(cs: CardDefinition[], ps: PackDefinition[]) {
  const fail = (message: string): never => {
    throw new Error(message);
  };
  const ids = new Set<string>();
  /** A boon's shape: a spoil, a kit or (Phase 3) a plaque's gear. */
  const goodBoon = (b: unknown) => {
    const boon = b as {
      name?: unknown;
      rules?: unknown;
      effect?: unknown;
      slot?: unknown;
    };
    return (
      !!boon &&
      typeof boon.name === "string" &&
      !!boon.name.trim() &&
      boon.name.length <= 24 &&
      typeof boon.rules === "string" &&
      !!boon.rules.trim() &&
      !!boon.effect &&
      typeof boon.effect === "object" &&
      // Equipment's slot (2026-10-25), on a trinket with a lasting effect.
      (boon.slot === undefined ||
        (SLOTS.includes(boon.slot as Slot) &&
          Object.keys(boon.effect).some((k) => k !== "loot")))
    );
  };
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
    if (
      c.secretPool !== undefined &&
      (!c.secret ||
        !Array.isArray(c.secretPool) ||
        !c.secretPool.length ||
        new Set(c.secretPool).size !== c.secretPool.length ||
        c.secretPool.some(
          (t) => typeof t !== "string" || !t.trim() || t.length > 120,
        ))
    )
      fail(`Invalid secret pool: ${c.id}`);
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
            c.strike![k].length > 100,
        ))
    )
      fail(`Invalid strike: ${c.id}`);
    // Pub Crawl stakes: hearts lost, boss swings and rewards.
    const count = (n: unknown, max: number) =>
      Number.isSafeInteger(n) && (n as number) >= 1 && (n as number) <= max;
    if (
      c.damage !== undefined &&
      (!(c.battle || c.strike) || !count(c.damage, 5))
    )
      fail(`Invalid damage: ${c.id}`);
    if (c.hits !== undefined && (!c.battle || !count(c.hits, 5)))
      fail(`Invalid boss hits: ${c.id}`);
    // A lieutenant that levels the adventurer up when it falls (2026-11-03).
    if (c.levelUp !== undefined && (c.levelUp !== true || !c.hits))
      fail(`Invalid level up: ${c.id}`);
    if (
      c.reward !== undefined &&
      (!c.reward ||
        (c.reward.loot === undefined &&
          c.reward.heal === undefined &&
          c.reward.lore === undefined &&
          c.reward.ally === undefined) ||
        (c.reward.lore !== undefined && c.reward.lore !== true) ||
        (c.reward.ally !== undefined && (c.reward.ally !== true || !c.ally)) ||
        (c.reward.loot !== undefined && !LOOT.includes(c.reward.loot)) ||
        (c.reward.heal !== undefined && !count(c.reward.heal, 5)))
    )
      fail(`Invalid reward: ${c.id}`);
    if (c.encounter !== undefined && !ENCOUNTERS.includes(c.encounter))
      fail(`Invalid encounter: ${c.id}`);
    // A battle's deed (The Quest 2.0 Phase 6), and hidden results: only on
    // one face (or doubles), so a hidden result is always a single roll.
    const deedOk = (d: unknown) =>
      d === undefined || (typeof d === "string" && /^[a-z-]{2,24}$/.test(d));
    if (
      c.deed !== undefined &&
      (!c.battle || !c.deed || !deedOk(c.deed.won) || !deedOk(c.deed.lost))
    )
      fail(`Invalid deed: ${c.id}`);
    const goodHidden = (r: unknown) => {
      const h = r as Record<string, unknown> | undefined;
      return (
        !!h &&
        typeof h === "object" &&
        Object.keys(h).length > 0 &&
        Object.keys(h).every((k) =>
          ["loot", "heal", "lore", "ally"].includes(k),
        ) &&
        (h.loot === undefined || LOOT.includes(h.loot as Loot)) &&
        (h.heal === undefined || count(h.heal as number, 5)) &&
        (h.lore === undefined || h.lore === true) &&
        (h.ally === undefined || (h.ally === true && !!c.ally))
      );
    };
    if (
      (c.dice?.outcomes ?? []).some(
        (o) =>
          o.reward !== undefined && (o.min !== o.max || !goodHidden(o.reward)),
      ) ||
      (c.dice?.doublesReward !== undefined &&
        (!c.dice.doubles || !goodHidden(c.dice.doublesReward)))
    )
      fail(`Invalid hidden result: ${c.id}`);
    // An ally (The Quest 2.0 Phase 4): a name, one or more callings, a
    // bonus of +1 to +5, an optional spoken ritual; on a boss (it joins at
    // the fall) or a card with a plaque that recruits it.
    if (
      c.ally !== undefined &&
      (!c.ally ||
        typeof c.ally.name !== "string" ||
        !c.ally.name.trim() ||
        c.ally.name.length > 22 ||
        !Array.isArray(c.ally.calling) ||
        !c.ally.calling.length ||
        c.ally.calling.some(
          (k) => k !== "any" && !ENCOUNTERS.includes(k as Encounter),
        ) ||
        !Number.isSafeInteger(c.ally.bonus) ||
        c.ally.bonus < 1 ||
        c.ally.bonus > 5 ||
        (c.ally.ritual !== undefined &&
          (typeof c.ally.ritual !== "string" ||
            !c.ally.ritual.trim() ||
            c.ally.ritual.length > 110)) ||
        (!c.hits &&
          !c.offers?.some((o) => o?.recruit) &&
          !c.reward?.ally &&
          // A hidden result's ally (Phase 6: Chester, the Black Knight).
          !c.dice?.outcomes?.some((o) => o.reward?.ally)))
    )
      fail(`Invalid ally: ${c.id}`);
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
            (o.evolve !== undefined && o.evolve !== true) ||
            (o.skip !== undefined &&
              (!Number.isSafeInteger(o.skip) || o.skip < 1 || o.skip > 3)) ||
            // The Quest 2.0 Phase 3: gear on a plaque, and a curse that
            // lands only on its plaque.
            (o.boon !== undefined && !goodBoon(o.boon)) ||
            (o.jinx !== undefined && (o.jinx !== true || !c.jinx)) ||
            // Phase 4: lore, and the card's own ally.
            (o.lore !== undefined && o.lore !== true) ||
            (o.recruit !== undefined && (o.recruit !== true || !c.ally)) ||
            (o.route !== undefined && o.route !== 0 && o.route !== 1) ||
            (o.deed !== undefined &&
              (typeof o.deed !== "string" || !/^[a-z-]{2,24}$/.test(o.deed))),
        ))
    )
      fail(`Invalid offers: ${c.id}`);
    // A starter's later forms: one to three, each with its own omen effect.
    if (
      c.evolves !== undefined &&
      (c.omen === undefined ||
        !Array.isArray(c.evolves) ||
        c.evolves.length < 1 ||
        // Three in a line since Realms (2026-11-03).
        c.evolves.length > 3 ||
        c.evolves.some(
          (e) =>
            !e ||
            [e.title, e.rules].some(
              (text) => typeof text !== "string" || !text.trim(),
            ) ||
            e.title.length > 24 ||
            !e.omen,
        ))
    )
      fail(`Invalid evolves: ${c.id}`);
    // A League type (2026-10-25): one of the eighteen (or the Striaton
    // trio), on a fight or a starter, and on a starter's form.
    if (
      (c.type !== undefined &&
        (!POKEMON_TYPES.includes(c.type) ||
          (!c.battle &&
            !c.omen &&
            !c.strike &&
            !c.offers?.some((o) => o?.catch)))) ||
      (Array.isArray(c.evolves) &&
        c.evolves.some(
          (e) =>
            e?.type !== undefined &&
            (!POKEMON_TYPES.includes(e.type) || e.type === "trio"),
        ))
    )
      fail(`Invalid type: ${c.id}`);
    // The League's team (2026-10-25): a wild fight that can be caught, or a
    // catch card's offer; either needs the Pokémon's type, never the trio.
    if (
      (c.catchable !== undefined &&
        (c.catchable !== true ||
          !(c.battle || c.strike) ||
          c.hits ||
          !c.type ||
          c.type === "trio")) ||
      (c.offers?.some((o) => o?.catch !== undefined && o.catch !== true) ??
        false) ||
      (c.offers?.some((o) => o?.catch) && (!c.type || c.type === "trio"))
    )
      fail(`Invalid catch: ${c.id}`);
    // The throw (2026-10-27): a number to beat on a d20 and both lines, on
    // a card that can be caught.
    const lines = c.catchLines;
    if (
      (c.catchRate !== undefined || lines !== undefined) &&
      ((!c.catchable && !c.offers?.some((o) => o?.catch)) ||
        !Number.isInteger(c.catchRate) ||
        (c.catchRate as number) < 2 ||
        (c.catchRate as number) > 19 ||
        ![lines?.caught, lines?.fled].every(
          (l) => typeof l === "string" && !!l.trim() && l.length <= 120,
        ))
    )
      fail(`Invalid throw: ${c.id}`);
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
    if (
      c.spoils !== undefined &&
      (!Array.isArray(c.spoils) ||
        c.spoils.length < 2 ||
        c.spoils.length > 3 ||
        !c.battle ||
        c.boon !== undefined ||
        c.omen !== undefined ||
        !c.spoils.every(goodBoon))
    )
      fail(`Invalid spoils: ${c.id}`);
    // An adventurer's starting gear (2026-10-25): one piece with a slot.
    if (
      c.kit !== undefined &&
      (c.omen === undefined || !goodBoon(c.kit) || !c.kit.slot)
    )
      fail(`Invalid kit: ${c.id}`);
    // Push your luck: one to five prizes (five since The Quest 2.0 Phase 6: the Mother Lode), on a plain single-d20 battle.
    if (
      c.press !== undefined &&
      (!c.press ||
        !Array.isArray(c.press.prizes) ||
        c.press.prizes.length < 1 ||
        c.press.prizes.length > 5 ||
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
    // A boss's later beats (2026-10-25): each its own rules, with battle
    // dice or none (plaques), at most one fewer than its hits.
    if (
      c.phases !== undefined &&
      (!Array.isArray(c.phases) ||
        !c.phases.length ||
        !c.battle ||
        !c.hits ||
        c.phases.length > c.hits - 1 ||
        c.press ||
        c.dice?.choice ||
        c.phases.some((ph) => {
          if (
            !ph ||
            typeof ph.rules !== "string" ||
            !ph.rules.trim() ||
            ph.rules.length > 110
          )
            return true;
          if (ph.dice === undefined) return false;
          try {
            validateDice(ph.dice);
          } catch {
            return true;
          }
          const results = [
            ...(ph.dice.outcomes ?? []).map((o) => !!o.win),
            ...(ph.dice.doubles ? [!!ph.dice.doublesWin] : []),
          ];
          return (
            !!ph.dice.choice ||
            !results.includes(true) ||
            !results.includes(false)
          );
        }))
    )
      fail(`Invalid phases: ${c.id}`);
    // The dragon battle (The Quest 2.0, 2026-11-13): a boss with a single
    // d20 and no phases, six calm and six enraged moves, an enrage contest
    // and three lore lines. Older dragons with phases stay valid.
    const fight = c.lairFight;
    const goodMove = (m: unknown) => {
      const move = m as { [k: string]: unknown } | null;
      return (
        !!move &&
        typeof move === "object" &&
        typeof move.name === "string" &&
        !!move.name.trim() &&
        move.name.length <= 18 &&
        typeof move.rules === "string" &&
        !!move.rules.trim() &&
        move.rules.length <= 110 &&
        (move.damage === undefined || move.damage === 1 || move.damage === 2) &&
        (move.harder === undefined || move.harder === 2 || move.harder === -2)
      );
    };
    if (
      fight !== undefined &&
      (!fight ||
        typeof fight !== "object" ||
        !c.battle ||
        !c.hits ||
        c.encounter !== "boss" ||
        c.phases !== undefined ||
        c.dice?.count !== 1 ||
        c.dice.sides !== 20 ||
        !Array.isArray(fight.calm) ||
        fight.calm.length !== 6 ||
        !fight.calm.every(goodMove) ||
        !Array.isArray(fight.enraged) ||
        fight.enraged.length !== 6 ||
        !fight.enraged.every(goodMove) ||
        !fight.enrage ||
        typeof fight.enrage.rules !== "string" ||
        !fight.enrage.rules.trim() ||
        fight.enrage.rules.length > 110 ||
        !Number.isSafeInteger(fight.enrage.damage) ||
        fight.enrage.damage < 1 ||
        fight.enrage.damage > 3 ||
        !Array.isArray(fight.lore) ||
        fight.lore.length !== 3 ||
        fight.lore.some((l) => typeof l !== "string" || !l.trim()))
    )
      fail(`Invalid lair fight: ${c.id}`);
    const omens = [
      ...(c.omen !== undefined ? [c.omen] : []),
      ...(Array.isArray(c.evolves) ? c.evolves.map((e) => e.omen) : []),
    ];
    for (const o of [
      ...omens,
      ...(c.boon ? [c.boon.effect] : []),
      ...(Array.isArray(c.spoils) ? c.spoils.map((b) => b?.effect) : []),
    ]) {
      if (
        !o ||
        (omens.includes(o) && (c.battle || c.dice || c.offers || c.reward)) ||
        badEffect(o)
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
      // A road choice (The Quest 2.0 Phase 5): three routes and three
      // choice cards, each a single card whose plaques pick road 0 or 1.
      const badChoice = slots.some(
        (slot) =>
          !!slot &&
          "choose" in slot &&
          (!slot.choose ||
            !Array.isArray(slot.choose.card) ||
            !Array.isArray(slot.choose.routes) ||
            slot.choose.routes.length !== 3 ||
            slot.choose.card.length !== 3 ||
            slot.choose.routes.some((r) => !Array.isArray(r) || !r.length) ||
            slot.choose.card.some(
              (st) =>
                st?.pick !== 1 ||
                !Array.isArray(st.cardIds) ||
                st.cardIds.some((id) => {
                  const c = cs.find((x) => x.id === id);
                  const roads = (c?.offers ?? []).map((o) => o.route);
                  return !roads.includes(0) || !roads.includes(1);
                }),
            )),
      );
      const stages: QuestStage[] =
        badSlot || badChoice
          ? []
          : slots.flatMap((slot) =>
              "oneOf" in slot
                ? slot.oneOf.flat()
                : "choose" in slot
                  ? [...slot.choose.card, ...slot.choose.routes.flat()]
                  : [slot],
            );
      // A card is dealt at most once a run. Sibling routes of one `oneOf`
      // may share cards (The Quest 2.0, 2026-11-13: every lair has the same
      // door), since a game deals only one of them; two slots, or two
      // stages of one route, may not.
      const insertIds = (stage: QuestStage) =>
        Array.isArray(stage?.inserts)
          ? stage.inserts.flatMap((i) =>
              Array.isArray(i?.cardIds) ? i.cardIds : [],
            )
          : [];
      // Each card once a stage: a variant group may reuse the stage's own
      // pool (The Quest 2.0 Phase 6: the Company, sour).
      const stageIds = (stage: QuestStage) => [
        ...new Set([
          ...(Array.isArray(stage?.cardIds) ? stage.cardIds : []),
          ...(Array.isArray(stage?.elite) ? stage.elite : []),
          ...insertIds(stage),
          ...(Array.isArray(stage?.rare?.cardIds) ? stage.rare.cardIds : []),
          ...(Array.isArray(stage?.variants)
            ? stage.variants.flatMap((v) =>
                Array.isArray(v?.cardIds) ? v.cardIds : [],
              )
            : []),
        ]),
      ];
      const repeatsInARun = (all: typeof slots) => {
        const seen = new Set<string>();
        // A road choice deals one of its cards (siblings) and two of its
        // routes (which may share nothing).
        const flat = all.flatMap((slot) =>
          "choose" in slot
            ? [
                { oneOf: slot.choose.card.map((c) => [c]) },
                { oneOf: [slot.choose.routes.flat()] },
              ]
            : [slot],
        );
        for (const slot of flat) {
          const routes = "oneOf" in slot ? slot.oneOf : [[slot]];
          const dealt = new Set<string>();
          for (const route of routes) {
            const ids = route.flatMap(stageIds);
            if (new Set(ids).size !== ids.length) return true;
            for (const id of ids) dealt.add(id);
          }
          for (const id of dealt) {
            if (seen.has(id)) return true;
            seen.add(id);
          }
        }
        return false;
      };
      const finaleIds = stages.flatMap(stageIds);
      // A landmark (The Quest 2.0 Phase 3): each insert at its own place
      // inside the stage, its pool not empty, and enough rooms beside them.
      const badInserts = (stage: QuestStage) => {
        const inserts = stage.inserts;
        if (inserts === undefined) return false;
        return (
          !crawl ||
          !Array.isArray(inserts) ||
          !inserts.length ||
          new Set(inserts.map((i) => i?.at)).size !== inserts.length ||
          inserts.some(
            (i) =>
              !i ||
              !Number.isSafeInteger(i.at) ||
              i.at < 0 ||
              i.at >= stage.pick ||
              !Array.isArray(i.cardIds) ||
              !i.cardIds.length,
          ) ||
          stage.pick - inserts.length > (stage.cardIds?.length ?? 0)
        );
      };
      // Rares and variants (Phase 6): odds in (0, 1], pools not empty,
      // deeds named, a variant's extra need 1 to 3.
      const deedName = (d: unknown) =>
        typeof d === "string" && /^[a-z-]{2,24}$/.test(d);
      const badExtras = (stage: QuestStage) =>
        (stage.rare !== undefined &&
          (!crawl ||
            !Array.isArray(stage.rare.cardIds) ||
            !stage.rare.cardIds.length ||
            typeof stage.rare.odds !== "number" ||
            !(stage.rare.odds > 0 && stage.rare.odds <= 1))) ||
        (stage.variants !== undefined &&
          (!crawl ||
            !Array.isArray(stage.variants) ||
            !stage.variants.length ||
            stage.variants.some(
              (v) =>
                !v ||
                !Array.isArray(v.deeds) ||
                !v.deeds.length ||
                !v.deeds.every(deedName) ||
                !Array.isArray(v.cardIds) ||
                !v.cardIds.length ||
                (v.harder !== undefined &&
                  (!Number.isSafeInteger(v.harder) ||
                    v.harder < 1 ||
                    v.harder > 3)),
            ))) ||
        (stage.optional !== undefined &&
          (stage.optional !== true || !stage.variants?.length));
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
            party!.hearts > 30)) ||
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
            stage.pick - (stage.inserts?.length ?? 0) > stage.cardIds.length ||
            badInserts(stage) ||
            badExtras(stage) ||
            (stage.elite !== undefined &&
              (!crawl || !Array.isArray(stage.elite) || !stage.elite.length)),
        ) ||
        badChoice ||
        repeatsInARun(slots) ||
        finaleIds.some(
          (id) => !ids.has(id) || (!crawl && playable.includes(id)),
        ) ||
        advancing < goal
      )
        fail(`Invalid quest: ${p.id}`);
    }
  }
}
