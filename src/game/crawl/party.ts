import type {
  Boon,
  CardDefinition,
  OmenEffect,
  PartyState,
  QuestState,
} from "../types";
import { finaleCard } from "./stages";
import { joinTeam } from "./team";
// The party: the omen and its forms, boons, gear and what a card brings.
export const newParty = (hearts: number): PartyState => ({
  hearts,
  max: hearts,
  loot: [],
  hits: 0,
  rounds: 0,
  wiped: false,
});
/** The run's omen alone (the League's starter, Pub Crawl's adventurer),
 * once its card is put aside: its current form's effect when it has
 * evolved. */
export function formEffect(
  quest: QuestState | undefined,
): OmenEffect | undefined {
  const id = quest?.party?.omen;
  const card = id ? finaleCard(quest, id) : undefined;
  const form = quest?.party?.form ?? 0;
  return form ? card?.evolves?.[form - 1]?.omen : card?.omen;
}
/** The boons the party keeps (tonight's omen, trinkets), in the order they
 * came, with the card that brought each. */
export function partyBoons(quest: QuestState | undefined) {
  return (quest?.party?.boons ?? []).flatMap((key) => {
    const [id, pick] = key.split("#");
    const card = quest ? finaleCard(quest, id) : undefined;
    const boon =
      pick === undefined
        ? card?.boon
        : pick === "k"
          ? card?.kit
          : pick[0] === "o"
            ? card?.offers?.[Number(pick.slice(1))]?.boon
            : card?.spoils?.[Number(pick)];
    return card && boon ? [{ card, boon, key }] : [];
  });
}
const add = (a = 0, b = 0) => a + b || undefined;
/** Effects stacked: numbers add up, a natural widens to the widest, and a
 * boon's `satchel` moves the size by its difference from three. The
 * starting items are not carried (each arrived once, when it was gained). */
export function stackEffects(
  base: OmenEffect,
  boons: OmenEffect[],
): OmenEffect {
  if (!boons.length) return base;
  const out: OmenEffect = { ...base };
  const bump = <K extends string>(
    into: Partial<Record<K, number>> | undefined,
    from: Partial<Record<K, number>> | undefined,
  ) => {
    const next: Partial<Record<K, number>> = { ...into };
    for (const [kind, n] of Object.entries(from ?? {}) as [K, number][])
      next[kind] = (next[kind] ?? 0) + n;
    return Object.keys(next).length ? next : undefined;
  };
  let satchel = base.satchel ?? 3;
  for (const b of boons) {
    out.hearts = add(out.hearts, b.hearts);
    out.heal = add(out.heal, b.heal);
    out.bossHits = add(out.bossHits, b.bossHits);
    out.hurt = bump(out.hurt, b.hurt);
    out.roll = bump(out.roll, b.roll);
    if (b.crit !== undefined) out.crit = Math.min(out.crit ?? 20, b.crit);
    if (b.fumble !== undefined)
      out.fumble = Math.max(out.fumble ?? 1, b.fumble);
    if (b.reroll20) out.reroll20 = true;
    out.restock ??= b.restock;
    satchel += (b.satchel ?? 3) - 3;
  }
  out.satchel = Math.max(1, satchel);
  for (const key of Object.keys(out) as (keyof OmenEffect)[])
    if (out[key] === undefined) delete out[key];
  return out;
}
/** Everything that holds for the run: the omen's current form and every
 * boon kept, stacked. */
export function omenEffect(
  quest: QuestState | undefined,
): OmenEffect | undefined {
  const form = formEffect(quest);
  const boons = partyBoons(quest).map((b) => b.boon.effect);
  if (!boons.length) return form;
  return stackEffects(form ?? {}, boons);
}
/** Tonight's omen as it stands: its card, the current form's name and
 * rules, and the forms still to come. */
export function omenForm(quest: QuestState | undefined) {
  const id = quest?.party?.omen;
  const card = id ? finaleCard(quest, id) : undefined;
  if (!card) return undefined;
  const form = quest?.party?.form ?? 0;
  const forms = card.evolves ?? [];
  const now = form ? forms[form - 1] : undefined;
  // A branching starter evolves once, into the form the table picks.
  const branching = !!card.branches;
  const canEvolve = branching
    ? form === 0 && forms.length > 0
    : form < forms.length;
  return {
    card,
    form,
    title: now?.title ?? card.title,
    rules: now?.rules ?? card.rules,
    line: branching
      ? [card.title, now ? now.title : forms.map((e) => e.title).join(" / ")]
      : [card.title, ...forms.map((e) => e.title)],
    canEvolve,
    /** The forms the table picks from, while a branching starter can still
     * evolve. */
    branches: branching && canEvolve ? forms.map((e) => e.title) : null,
    /** How many later forms the card has. */
    forms: forms.length,
    /** The League type of the form it is now (none before 2026-10-25). */
    type: now?.type ?? card.type,
    /** The dice colours of the form it is now. */
    palette: now ? (now.palette ?? card.palette) : card.palette,
    /** The form an evolution brings next, while one evolves in a line. */
    next: !branching && canEvolve ? forms[form].title : null,
    /** The effect of the form before this one (for what an evolution
     * changed); the card's own for its first form. */
    before: form > 1 && !branching ? forms[form - 2].omen : card.omen,
  };
}
/** The starter's next form: its effect replaces the current one. The change
 * in hearts moves the maximum and the hearts left (never below one), the new
 * form's items join the satchel, and a smaller satchel drops its newest. */
export function evolve(
  party: PartyState,
  quest: QuestState,
  branch = 0,
): PartyState {
  const now = omenForm(quest);
  if (!now?.canEvolve) return party;
  const target = now.branches ? branch : now.form;
  const before = formEffect(quest) ?? {};
  const after = now.card.evolves![target].omen;
  const delta = (after.hearts ?? 0) - (before.hearts ?? 0);
  const max = Math.max(1, party.max + delta);
  const next = { ...party, max, form: target + 1 };
  // The satchel follows the new form, with every boon still on it.
  const size = satchelSize({ ...quest, party: next });
  return {
    ...next,
    hearts: Math.min(max, Math.max(1, party.hearts + delta)),
    loot: [...party.loot, ...(after.loot ?? [])].slice(0, size),
  };
}
/** How many items the satchel holds. */
export const satchelSize = (quest: QuestState | undefined) =>
  omenEffect(quest)?.satchel ?? 3;
export type Outcome = "won" | "lost" | "fled";
/** A boon joins the party: its hearts move the maximum and the hearts left
 * (never below one), its items go into the satchel, and a smaller satchel
 * drops its newest. */
export function gainBoon(
  party: PartyState,
  card: CardDefinition,
  quest: QuestState,
  spoil?: number | "kit" | `o${number}`,
): PartyState {
  // A plaque's gear (The Quest 2.0 Phase 3) is kept as "<id>#o<index>".
  const boon =
    spoil === undefined
      ? card.boon
      : spoil === "kit"
        ? card.kit
        : typeof spoil === "string"
          ? card.offers?.[Number(spoil.slice(1))]?.boon
          : card.spoils?.[spoil];
  const key =
    spoil === undefined
      ? card.id
      : `${card.id}#${spoil === "kit" ? "k" : spoil}`;
  if (!boon || party.boons?.some((k) => k.split("#")[0] === card.id))
    return party;
  // Equipment (2026-10-25): the slot's old piece comes off first, and its
  // hearts go with it (the party keeps at least one).
  let base = party;
  for (const old of boon.slot ? replaces({ ...quest, party }, boon) : []) {
    const max = Math.max(1, base.max - (old.boon.effect.hearts ?? 0));
    base = {
      ...base,
      max,
      hearts: Math.min(max, base.hearts),
      boons: (base.boons ?? []).filter((k) => k !== old.key),
    };
  }
  const { hearts = 0, loot = [] } = boon.effect;
  const max = Math.max(1, base.max + hearts);
  // A trinket that only brings items puts them in the satchel and is not
  // worn.
  // Tonight's omen is kept even when it is only a table rule, so the party
  // dialog can show it.
  const next =
    isLasting(boon) || card.encounter === "omen"
      ? { ...base, max, boons: [...(base.boons ?? []), key] }
      : { ...base, max };
  const size = satchelSize({ ...quest, party: next });
  return {
    ...next,
    hearts: Math.min(max, Math.max(1, base.hearts + hearts)),
    loot: [...base.loot, ...loot].slice(0, size),
  };
}
/** A boon with an effect that lasts: anything but items alone. */
export const isLasting = (boon: Boon) =>
  Object.keys(boon.effect).some((k) => k !== "loot");
/** The pieces of equipment a boon would replace: whatever the party wears
 * in its slot (one, or more in a save from before slots). */
export function replaces(quest: QuestState | undefined, boon: Boon) {
  return boon.slot
    ? partyBoons(quest).filter((b) => b.boon.slot === boon.slot)
    : [];
}
/** A heart loss: the shield takes it whole. */
export function hurt(party: PartyState, damage: number): PartyState {
  if (damage <= 0) return party;
  const shield = party.loot.indexOf("shield");
  if (shield >= 0)
    return { ...party, loot: party.loot.filter((_, i) => i !== shield) };
  return { ...party, hearts: Math.max(0, party.hearts - damage) };
}
/** What a card brings: its reward (a battle's only on a win) and its jinx
 * (a battle's only on a loss), bent by tonight's omen. The omen card itself
 * sets the omen and its hearts and items. */
export function settleParty(
  party: PartyState,
  card: CardDefinition,
  outcome: Outcome | null,
  quest: QuestState,
  nat: 20 | 1 | null = null,
  spoil?: number,
): PartyState {
  const omen = omenEffect(quest);
  const size = satchelSize(quest);
  let next = party;
  if (outcome === "lost" && card.damage)
    next = hurt(
      next,
      (card.damage +
        (card.encounter ? (omen?.hurt?.[card.encounter] ?? 0) : 0)) *
        (nat === 1 ? 2 : 1),
    );
  if (outcome === null || outcome === "won") {
    const { loot, heal } = card.reward ?? {};
    const times = outcome === "won" && nat === 20 ? 2 : 1;
    for (let i = 0; i < times; i++)
      if (loot && next.loot.length < size)
        next = { ...next, loot: [...next.loot, loot] };
    if (heal)
      next = {
        ...next,
        hearts: Math.min(
          next.max,
          next.hearts + Math.max(0, heal + (omen?.heal ?? 0)) * times,
        ),
      };
  }
  if (card.omen && outcome === null) {
    const { hearts = 0, loot = [], satchel = 3 } = card.omen;
    const max = Math.max(1, next.max + hearts);
    next = {
      ...next,
      max,
      hearts: Math.min(max, Math.max(1, next.hearts + hearts)),
      loot: [...next.loot, ...loot].slice(0, satchel),
      omen: card.id,
    };
    // An adventurer's starting gear goes on with it (2026-10-25).
    if (card.kit) next = gainBoon(next, card, quest, "kit");
  }
  // A card whose plaques carry the jinx lays it only from that plaque
  // (`takeOffer`).
  if (
    card.jinx &&
    (outcome === null || outcome === "lost") &&
    !card.offers?.some((o) => o.jinx)
  )
    next = { ...next, jinx: card.id };
  // Push your luck: a win takes every prize banked and this one; a loss
  // forfeits them. The count clears either way.
  if (card.press && outcome !== null) {
    if (outcome === "won") {
      const won = card.press.prizes.slice(0, (next.press ?? 0) + 1);
      next = {
        ...next,
        loot: [...next.loot, ...won].slice(0, satchelSize(quest)),
      };
    }
    next = { ...next };
    delete next.press;
  }
  // A boss's or an ambush's boon comes when it falls (`discard`).
  if (!card.hits && (outcome === null || outcome === "won"))
    next = gainBoon(next, card, quest, spoil);
  // An egg hatches onto the team on a win (2026-11-01).
  if (card.joins && !card.hits && outcome === "won")
    next = joinTeam(next, card.id);
  return next;
}
