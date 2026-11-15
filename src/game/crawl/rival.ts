import type {
  CardDefinition,
  Loot,
  PartyState,
  QuestState,
  RivalProfile,
} from "../types";
import type { Random } from "../engine";
import { finaleStage, stageCards } from "./stages";
import { addDeed, satchelSize, type Outcome } from "./party";
// The rival (2026-11-15): one named antagonist a run. Introduced by a card
// with a profile, they keep a ledger of what they took, turn up uninvited
// on other cards, and are settled with at the lair's door.

type Rival = NonNullable<PartyState["rival"]>;
type Cut = "ambush" | "meddle" | "snipe";

/** Cards between two of the rival's appearances, at least. */
export const RIVAL_GAP = 4;
/** The chance they turn up on a room they could, and what each item in
 * the satchel adds to it: they come for a party that has something. */
export const RIVAL_RATE = 0.4;
export const RIVAL_GREED = 0.1;
/** At this many hearts or fewer, they leave the party alone. */
export const RIVAL_MERCY = 4;
/** Uninvited appearances of each kind in one run, at most. */
export const RIVAL_CAP: Record<Cut, number> = { ambush: 2, meddle: 2, snipe: 2 };

/** The run's rival: the card that introduced them and their profile. */
export function rivalProfile(
  quest: QuestState | undefined,
): { card: CardDefinition; profile: RivalProfile } | undefined {
  const who = quest?.party?.rival?.who;
  if (!quest || !who) return undefined;
  for (const stage of quest.stages)
    for (const card of stageCards(stage))
      if (card.rival?.profile && card.rival.who === who)
        return { card, profile: card.rival.profile };
  return undefined;
}

/** How the rival cuts in on the card in play, in words: their name, what
 * they are doing and the line for it. */
export function rivalCut(quest: QuestState | undefined) {
  const cut = quest?.party?.rival?.cut;
  const found = cut ? rivalProfile(quest) : undefined;
  if (!cut || !found) return undefined;
  const { profile } = found;
  return {
    kind: cut,
    name: profile.name,
    line: cut === "meddle" ? profile.meddle : profile.snipe,
    ribbon: `${profile.name} · ${cut === "meddle" ? "Meddling" : "Sniping"}`,
  };
}

// One overlaid card per card and ribbon, so the card in play keeps its
// identity from one read to the next.
const overlaid = new WeakMap<CardDefinition, Map<string, CardDefinition>>();
/** The card in play as it reads while the rival cuts in: their name on a
 * crimson ribbon. */
export function withRival(
  quest: QuestState | undefined,
  card: CardDefinition,
): CardDefinition {
  const cut = rivalCut(quest);
  if (!cut) return card;
  let byRibbon = overlaid.get(card);
  if (!byRibbon) overlaid.set(card, (byRibbon = new Map()));
  let out = byRibbon.get(cut.ribbon);
  if (!out) {
    out = { ...card, ribbon: cut.ribbon, ribbonTone: "crimson" };
    byRibbon.set(cut.ribbon, out);
  }
  return out;
}

/** Items back from the rival's ledger, oldest first, while the satchel
 * has room. */
function handBack(
  party: PartyState,
  rival: Rival,
  quest: QuestState,
  count: number | "all",
): { party: PartyState; rival: Rival; back: Loot[] } {
  const room = satchelSize({ ...quest, party }) - party.loot.length;
  const n = Math.max(
    0,
    Math.min(room, count === "all" ? rival.took.length : count),
  );
  const back = rival.took.slice(0, n);
  return {
    party: n ? { ...party, loot: [...party.loot, ...back] } : party,
    rival: n ? { ...rival, took: rival.took.slice(n) } : rival,
    back,
  };
}

/** A card put aside, as the rival sees it. Their introduction names them
 * (and the run holds the deed `rival-<who>`, which picks their cards at the
 * crossroads and the door); one of their cards takes items when it says so
 * (a battle only when lost) and hands some back on a win; a sniped item
 * goes on their ledger. Last card's news and this card's cut are cleared. */
export function settleRival(
  party: PartyState,
  card: CardDefinition,
  outcome: Outcome | null,
  quest: QuestState,
  draw: number,
  sniped?: Loot,
): PartyState {
  const mine = card.rival;
  let next = party;
  let rival = party.rival;
  if (!rival && mine?.profile) {
    rival = { who: mine.who, took: [], won: 0, lost: 0 };
    next = addDeed(next, `rival-${mine.who}`);
  }
  if (!rival) return party;
  const cut = rival.cut;
  rival = { ...rival };
  delete rival.cut;
  delete rival.news;
  const took: Loot[] = sniped ? [sniped] : [];
  let back: Loot[] = [];
  const theirs = mine?.who === rival.who;
  if (theirs) {
    const fight = !!card.battle;
    if (mine.takes && (fight ? outcome === "lost" : true)) {
      const n = Math.min(mine.takes, next.loot.length);
      took.push(...next.loot.slice(next.loot.length - n).reverse());
      next = { ...next, loot: next.loot.slice(0, next.loot.length - n) };
    }
    // A fight of several swings is settled when it falls (`rivalFalls`).
    if (fight && !card.hits && outcome === "won") {
      rival.won += 1;
      if (mine.returns) {
        const given = handBack(next, rival, quest, mine.returns);
        ({ party: next, rival, back } = given);
      }
    }
    if (fight && !card.hits && outcome === "lost") rival.lost += 1;
  }
  if (took.length) rival.took = [...rival.took, ...took];
  if (took.length || back.length)
    rival.news = {
      ...(took.length ? { took } : {}),
      ...(back.length ? { back } : {}),
    };
  if (theirs || cut) rival.seen = draw;
  return { ...next, rival };
}

/** The rival's fight of several swings falls: a win on their record, and
 * what the card hands back. */
export function rivalFalls(
  party: PartyState,
  card: CardDefinition,
  quest: QuestState,
): PartyState {
  const rival = party.rival;
  if (!rival || card.rival?.who !== rival.who) return party;
  let next = party;
  let after: Rival = { ...rival, won: rival.won + 1 };
  if (card.rival.returns) {
    const given = handBack(next, after, quest, card.rival.returns);
    next = given.party;
    after = given.rival;
    if (given.back.length)
      after = { ...after, news: { ...after.news, back: given.back } };
  }
  return { ...next, rival: after };
}

/** The rival hands back everything they hold (a plaque's `restore`). */
export function restoreAll(party: PartyState, quest: QuestState): PartyState {
  if (!party.rival) return party;
  const given = handBack(party, party.rival, quest, "all");
  return { ...given.party, rival: given.rival };
}

/** The rival, joined and sent into a lost fight, walks out with the whole
 * satchel: it goes back on their ledger. */
export function turnCoat(party: PartyState): PartyState {
  const rival = party.rival;
  if (!rival || !party.loot.length) return party;
  return {
    ...party,
    loot: [],
    rival: {
      ...rival,
      took: [...rival.took, ...party.loot],
      news: { took: [...party.loot] },
    },
  };
}

/** The next card is about to be dealt: the rival may turn up on it. Only
 * on a room of a region or a side quest (never a boss, a plaque card, a
 * landmark, a rare, an elite behind a fork's door, or one of their own
 * cards), never within `RIVAL_GAP` cards of their last appearance, and each
 * kind at most `RIVAL_CAP` times. An ambush puts one of their
 * confrontations in the room's place; a meddle or a snipe is saved on the
 * party as the card's `cut`, so a reload never decides it again. */
export function stalk(
  quest: QuestState,
  draw: number,
  random: Random,
  leaving: CardDefinition,
): QuestState {
  const party = quest.party;
  const rival = party?.rival;
  const step = quest.step + 1;
  const id = quest.finale[step];
  if (!party || !rival || !id) return quest;
  const at = finaleStage(quest, step);
  const stage = quest.stages[at.stage];
  if (stage.pick < 2 || leaving.encounter === "fork") return quest;
  const coming = stage.cards.find((c) => c.id === id);
  if (
    !coming ||
    coming.rival ||
    coming.hits ||
    coming.offers?.length ||
    coming.encounter === "fork"
  )
    return quest;
  // They come for a party that has something: one down to its last few
  // hearts is left alone until it recovers.
  if (party.hearts <= RIVAL_MERCY) return quest;
  if (draw - (rival.seen ?? -RIVAL_GAP) < RIVAL_GAP) return quest;
  const profile = rivalProfile(quest)?.profile;
  if (!profile) return quest;
  const greed = RIVAL_GREED * Math.min(3, party.loot.length);
  if (random() >= RIVAL_RATE + greed) return quest;
  const cuts = rival.cuts ?? {};
  const taken = new Set(quest.finale);
  const pool = quest.stages
    .flatMap((st) => st.ambush ?? [])
    .filter((c) => c.rival?.who === rival.who && !taken.has(c.id));
  const dice = coming.dice;
  const open: Record<Cut, boolean> = {
    ambush: at.index > 0 && pool.length > 0,
    meddle:
      !!coming.battle &&
      dice?.count === 1 &&
      dice.sides === 20 &&
      !dice.choice &&
      !coming.press,
    snipe: !!(coming.reward?.loot || coming.reward?.heal),
  };
  const kinds = (["ambush", "meddle", "snipe"] as const).filter(
    (k) =>
      open[k] && (cuts[k] ?? 0) < RIVAL_CAP[k] && (profile.style[k] ?? 0) > 0,
  );
  const total = kinds.reduce((n, k) => n + profile.style[k], 0);
  if (!total) return quest;
  let roll = random() * total;
  const kind = kinds.find((k) => (roll -= profile.style[k]) < 0) ?? kinds[0];
  const counted = { ...cuts, [kind]: (cuts[kind] ?? 0) + 1 };
  if (kind === "ambush") {
    const finale = [...quest.finale];
    finale[step] = pool[Math.floor(random() * pool.length)].id;
    return {
      ...quest,
      finale,
      party: { ...party, rival: { ...rival, cuts: counted } },
    };
  }
  return {
    ...quest,
    party: { ...party, rival: { ...rival, cut: kind, cuts: counted } },
  };
}
