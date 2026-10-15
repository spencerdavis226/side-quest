import { validateDice } from "../game/dice";
import { validateTimer } from "../game/timer";
import type { CardDefinition, PackDefinition } from "../game/types";
import { RIBBON_TONES } from "../game/types";

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
      const { mode, summary, label, goal, length, finale, cardIds } = p.quest;
      const finaleIds = Array.isArray(finale)
        ? finale.flatMap((stage) =>
            Array.isArray(stage?.cardIds) ? stage.cardIds : [],
          )
        : [];
      const playable = [...p.cardIds, ...(cardIds ?? [])];
      const advancing = cs.filter(
        (c) => c.quest === p.id && playable.includes(c.id),
      ).length;
      if (
        [mode, summary, label].some(
          (text) => typeof text !== "string" || !text.trim(),
        ) ||
        !Number.isSafeInteger(goal) ||
        goal < 1 ||
        !Number.isSafeInteger(length) ||
        length <= goal ||
        !Array.isArray(cardIds) ||
        new Set(cardIds).size !== cardIds.length ||
        cardIds.some((id) => !ids.has(id) || p.cardIds.includes(id)) ||
        !Array.isArray(finale) ||
        !finale.length ||
        finale.some(
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
            stage.pick > stage.cardIds.length,
        ) ||
        new Set(finaleIds).size !== finaleIds.length ||
        finaleIds.some((id) => !ids.has(id) || playable.includes(id)) ||
        advancing < goal
      )
        fail(`Invalid quest: ${p.id}`);
    }
  }
}
