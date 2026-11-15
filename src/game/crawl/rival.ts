import type {
  CardDefinition,
  Loot,
  PartyState,
  QuestState,
  RivalCut,
  RivalProfile,
  RivalVerb,
  SessionState,
} from "../types";
import type { Random } from "../engine";
import { currentCard } from "../engine";
import { rollWins } from "../dice";
import { finaleCard, finaleStage, stageCards } from "./stages";
import { addDeed, omenEffect, satchelSize, type Outcome } from "./party";
import { joinTeam } from "./team";
// The rival (2026-11-15): one named antagonist a run. Introduced by a card
// with a profile, they keep a ledger of what they took, turn up uninvited
// on other cards, and are settled with at the lair's door. Rivals Phase 2
// (maximum frustration): the Do-Over, swipes, hand-offs, poached allies,
// squatted inns, invoices and curses, every one but the swipe and the
// hand-off with a counter the table can choose, and a duel fought with
// what they took.

type Rival = NonNullable<PartyState["rival"]>;

/** Cards between two of the rival's appearances, at least. */
export const RIVAL_GAP = 3;
/** The chance they turn up on a card they could, and what each item in
 * the satchel adds to it: they come for a party that has something. */
export const RIVAL_RATE = 0.75;
export const RIVAL_GREED = 0.1;
/** At this many hearts or fewer, they leave the party alone. */
export const RIVAL_MERCY = 4;
/** Uninvited appearances of each kind in one run, at most. */
export const RIVAL_CAP: Record<RivalVerb, number> = {
  ambush: 2,
  meddle: 3,
  snipe: 2,
  redo: 2,
  swipe: 2,
  handoff: 1,
  poach: 1,
  squat: 1,
  invoice: 2,
  curse: 2,
};
/** Uninvited appearances of every kind together in one run, at most. */
export const RIVAL_TOTAL = 7;
/** Drinks that keep a poached ally or kick a squatter out. */
export const RIVAL_DRINKS = 4;
export const RIVAL_VERBS = Object.keys(RIVAL_CAP) as RivalVerb[];

/** Each cut's word on the ribbon, and what it does in plain words (read
 * when a rival has no line of their own for it). */
const CUT_WORDS: Record<RivalCut, { word: string; rule: string }> = {
  meddle: { word: "Meddling", rule: "Roll twice, keep the worse." },
  snipe: {
    word: "Sniping",
    rule: "Whatever this card gives goes to them.",
  },
  redo: {
    word: "Do-Over",
    rule: "Win the roll and they make you roll again. The new roll stands.",
  },
  swipe: {
    word: "Swiping",
    rule: "Your newest item goes to them when this card is put aside.",
  },
  handoff: {
    word: "Handing Off",
    rule: "Your newest item is given away for good when this card goes.",
  },
  poach: {
    word: "Poaching",
    rule: `Your ally leaves with them, unless you drink ${RIVAL_DRINKS}.`,
  },
  squat: {
    word: "Squatting",
    rule: `Rest heals 1 less, unless you kick them out (drink ${RIVAL_DRINKS}).`,
  },
  invoice: {
    word: "Invoicing",
    rule: "Pay a heart or an item before this card plays.",
  },
  curse: {
    word: "Cursing",
    rule: "Their curse lands when this card is put aside.",
  },
};

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

/** One of the rival's lines, with `{item}` filled in from `items` (their
 * names, joined with "and"). A profile from before Phase 1 has only its
 * meddle and snipe lines. */
export function rivalLine(
  profile: RivalProfile,
  key: keyof NonNullable<RivalProfile["lines"]>,
  items: string[] = [],
): string | undefined {
  const line =
    profile.lines?.[key] ??
    (key === "meddle" ? profile.meddle : key === "snipe" ? profile.snipe : "");
  if (!line) return undefined;
  return line.replace(/\{item\}/g, items.join(" and ") || "things");
}

/** How the rival cuts in on the card in play, in words: their name, what
 * they are doing, their line for it and the rule it follows. */
export function rivalCut(quest: QuestState | undefined) {
  const cut = quest?.party?.rival?.cut;
  const found = cut ? rivalProfile(quest) : undefined;
  if (!cut || !found) return undefined;
  const { profile } = found;
  const { word, rule } = CUT_WORDS[cut] ?? CUT_WORDS.meddle;
  return {
    kind: cut,
    name: profile.name,
    word,
    rule,
    line: rivalLine(profile, cut) ?? rule,
    ribbon: `${profile.name} · ${word}`,
  };
}

// One overlaid card per card and ribbon, so the card in play keeps its
// identity from one read to the next.
const overlaid = new WeakMap<CardDefinition, Map<string, CardDefinition>>();
/** The card in play as it reads while the rival cuts in: their name on a
 * crimson ribbon; a squatted inn's rests heal 1 less. */
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
    if (cut.kind === "squat" && card.offers)
      out.offers = card.offers.map((o) =>
        o.heal ? { ...o, heal: Math.max(0, o.heal - 1) } : o,
      );
    byRibbon.set(cut.ribbon, out);
  }
  return out;
}

/** Allies the rival can poach: living allies that are not the rival. */
function poachable(party: PartyState, quest: QuestState): string[] {
  return (party.team ?? []).filter((id) => {
    const c = finaleCard(quest, id);
    return !!c?.ally && !c.rival;
  });
}
/** The card whose curse the rival lays (`rival.curse`), if they have one. */
function curseCard(quest: QuestState, who: string) {
  for (const stage of quest.stages)
    for (const c of [...stageCards(stage), ...(stage.ambush ?? [])])
      if (c.rival?.who === who && c.rival.curse && c.jinx) return c;
  return undefined;
}
/** Whether `card` is the rival's duel (a fight of several swings that
 * hands everything back). */
const isDuel = (card: CardDefinition) =>
  !!card.rival && !!card.hits && card.rival.returns === "all";

/** What the rival fights the duel with, from their ledger (Rivals Phase
 * 2): each Tower Shield is a swing more to land, a Lucky Coin makes the
 * party's first won swing a Do-Over, a potion takes back one landed swing,
 * and a Smoke Bomb lets them flee with everything if the first swing is
 * lost. Spent tricks are kept in `rival.arsenal`. */
export function rivalArsenal(
  quest: QuestState | undefined,
  card: CardDefinition,
) {
  const rival = quest?.party?.rival;
  if (!rival || !isDuel(card) || card.rival!.who !== rival.who) return null;
  const spent = rival.arsenal ?? {};
  const has = (item: Loot) => rival.took.includes(item);
  return {
    shields: rival.took.filter((item) => item === "shield").length,
    coin: has("die") && !spent.coin,
    draught: has("draught") && !spent.draught,
    smoke: has("smoke") && !spent.swung,
  };
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
/** Poached allies come home (the rival falls, or gives everything back). */
function bringHome(party: PartyState, rival: Rival): PartyState {
  if (!rival.poached?.length) return { ...party, rival };
  let next = party;
  for (const id of rival.poached) next = joinTeam(next, id);
  const after = { ...rival };
  delete after.poached;
  return { ...next, rival: after };
}

/** A card put aside, as the rival sees it. Their introduction names them
 * (and the run holds the deed `rival-<who>`, which picks their cards at the
 * crossroads and the door); one of their cards takes items when it says so
 * (a battle only when lost) and hands some back on a win; a sniped item
 * goes on their ledger; a swipe, a hand-off, a poach or a curse still on
 * the card lands now. Last card's news and this card's cut are cleared. */
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
  delete rival.redone;
  const took: Loot[] = sniped ? [sniped] : [];
  const gone: Loot[] = [];
  let back: Loot[] = [];
  let poached: string | undefined;
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
    if (fight && !card.hits && outcome === "lost") {
      rival.lost += 1;
      // Rivals Phase 2: a lost meeting on a card that carries their curse
      // lays it.
      if (mine.curse && card.jinx) next = { ...next, jinx: card.id };
    }
  }
  // Rivals Phase 2: what the cut left on the card lands as it goes.
  if ((cut === "swipe" || cut === "handoff") && next.loot.length) {
    const item = next.loot[next.loot.length - 1];
    next = { ...next, loot: next.loot.slice(0, -1) };
    (cut === "swipe" ? took : gone).push(item);
  }
  if (cut === "poach") {
    poached = poachable(next, quest)[0];
    if (poached) {
      const team = next.team!.filter((id) => id !== poached);
      next = { ...next, team };
      if (!team.length) delete next.team;
      rival.poached = [...(rival.poached ?? []), poached];
    }
  }
  if (cut === "curse" && !next.jinx) {
    const curse = curseCard(quest, rival.who);
    if (curse) next = { ...next, jinx: curse.id };
  }
  if (took.length) rival.took = [...rival.took, ...took];
  if (took.length || back.length || gone.length || poached)
    rival.news = {
      ...(took.length ? { took } : {}),
      ...(back.length ? { back } : {}),
      ...(gone.length ? { gone } : {}),
      ...(poached ? { poached } : {}),
    };
  if (theirs || cut) rival.seen = draw;
  return { ...next, rival };
}

/** The rival's fight of several swings falls: a win on their record, and
 * what the card hands back (poached allies too). */
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
    if (card.rival.returns === "all") return bringHome(next, after);
  }
  return { ...next, rival: after };
}

/** The rival hands back everything they hold (a plaque's `restore`). */
export function restoreAll(party: PartyState, quest: QuestState): PartyState {
  if (!party.rival) return party;
  const given = handBack(party, party.rival, quest, "all");
  return bringHome(given.party, given.rival);
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

/** The duel just put aside, as their tricks see it (`discardCard`): the
 * swing landed (`landed`, 0 to 2), less one their potion takes back; and
 * whether a lost first swing lets them flee with everything (their Smoke
 * Bomb). The first swing is marked as swung either way. */
export function duelTricks(
  party: PartyState,
  card: CardDefinition,
  quest: QuestState,
  outcome: Outcome | null,
  landed: number,
): { party: PartyState; landed: number; fled: boolean } {
  const tricks = rivalArsenal({ ...quest, party }, card);
  const rival = party.rival;
  if (!tricks || !rival) return { party, landed, fled: false };
  const arsenal = { ...rival.arsenal, swung: true as const };
  if (tricks.smoke && outcome === "lost") {
    const gone = rival.took;
    const next = addDeed(
      {
        ...party,
        rival: {
          ...rival,
          took: [],
          arsenal,
          news: { ...rival.news, ...(gone.length ? { gone } : {}) },
        },
      },
      "rival-fled",
    );
    return { party: next, landed: 0, fled: true };
  }
  if (tricks.draught && landed > 0) {
    arsenal.draught = true;
    landed -= 1;
  }
  return {
    party: { ...party, rival: { ...rival, arsenal } },
    landed,
    fled: false,
  };
}

/** Which Do-Over waits on the card in play: the rival's cut (a won single
 * d20, before it is put aside), or their Lucky Coin in the duel (the
 * party's first won swing). */
function redoFor(s: SessionState): "cut" | "coin" | null {
  const rival = s.quest?.party?.rival;
  if (!rival || !s.quest?.due || s.phase !== "revealed") return null;
  const card = currentCard(s);
  if (!card.dice || !s.roll?.returned || !card.battle) return null;
  if (!rollWins(card.dice, s.roll.values, s.roll)) return null;
  if (rival.cut === "redo" && !rival.redone) return "cut";
  if (rivalArsenal(s.quest, card)?.coin) return "coin";
  return null;
}
/** A won roll the rival makes the table roll again (`redoRoll`), or pay
 * them off (`payOff`). `advance` waits. */
export const awaitingRedo = (s: SessionState) => !!redoFor(s);
/** The Do-Over: the won roll is wiped and the card rolled again; the new
 * roll stands, win or lose. */
export function redoRoll(s: SessionState): SessionState {
  const kind = redoFor(s);
  if (!kind) return s;
  const rival = s.quest!.party!.rival!;
  const after: Rival = {
    ...rival,
    redos: (rival.redos ?? 0) + 1,
    ...(kind === "cut"
      ? { redone: true as const }
      : { arsenal: { ...rival.arsenal, coin: true as const } }),
  };
  return {
    ...s,
    roll: null,
    quest: { ...s.quest!, party: { ...s.quest!.party!, rival: after } },
  };
}

/** A revealed card the rival's invoice holds until it is paid. */
export function awaitingInvoice(s: SessionState): boolean {
  return (
    s.phase === "revealed" &&
    !!s.quest?.due &&
    s.quest.party?.rival?.cut === "invoice"
  );
}
/** Whether the invoice can be paid this way: an item needs one in the
 * satchel, a heart never takes the last one. */
export function canPayInvoice(s: SessionState, way: "heart" | "item") {
  if (!awaitingInvoice(s)) return false;
  const party = s.quest!.party!;
  return way === "item" ? party.loot.length > 0 : party.hearts > 1;
}
/** Pay the invoice with a heart or the newest item: the card then reads
 * as written. */
export function payInvoice(
  s: SessionState,
  way: "heart" | "item",
): SessionState {
  if (!canPayInvoice(s, way)) return s;
  const party = s.quest!.party!;
  const rival: Rival = { ...party.rival!, seen: s.discarded + 1 };
  delete rival.cut;
  const item = party.loot[party.loot.length - 1];
  const next: PartyState =
    way === "heart"
      ? { ...party, hearts: party.hearts - 1, rival }
      : {
          ...party,
          loot: party.loot.slice(0, -1),
          rival: { ...rival, took: [...rival.took, item] },
        };
  return { ...s, quest: { ...s.quest!, party: next } };
}

/** The item a pay-off would hand the rival (the newest in the satchel),
 * when the cut on the card in play can be paid off: a meddle before the
 * roll, a snipe or a curse before the card goes, a Do-Over once the win is
 * on the card. */
export function payOffItem(s: SessionState): Loot | undefined {
  const party = s.quest?.party;
  const cut = party?.rival?.cut;
  if (!party || !cut || s.phase !== "revealed" || !party.loot.length)
    return undefined;
  const open =
    (cut === "meddle" && !s.roll) ||
    cut === "snipe" ||
    cut === "curse" ||
    (cut === "redo" && redoFor(s) === "cut");
  return open ? party.loot[party.loot.length - 1] : undefined;
}
/** Pay the rival off with the newest item: it goes on their ledger and
 * the cut is cancelled. */
export function payOff(s: SessionState): SessionState {
  const item = payOffItem(s);
  if (!item) return s;
  const party = s.quest!.party!;
  const rival = party.rival!;
  const cuts = rival.cuts ?? {};
  const after: Rival = {
    ...rival,
    took: [...rival.took, item],
    cuts: { ...cuts, paid: (cuts.paid ?? 0) + 1 },
    seen: s.discarded + 1,
  };
  delete after.cut;
  return {
    ...s,
    quest: {
      ...s.quest!,
      party: { ...party, loot: party.loot.slice(0, -1), rival: after },
    },
  };
}
/** A poach or a squat on the card in play, which drinks call off. */
export function canKickOut(s: SessionState): boolean {
  const cut = s.quest?.party?.rival?.cut;
  return s.phase === "revealed" && (cut === "poach" || cut === "squat");
}
/** Drink to keep the ally, or to kick the squatter out: the cut is
 * cancelled. */
export function kickOut(s: SessionState): SessionState {
  if (!canKickOut(s)) return s;
  const party = s.quest!.party!;
  const rival = party.rival!;
  const cuts = rival.cuts ?? {};
  const after: Rival = {
    ...rival,
    cuts: { ...cuts, paid: (cuts.paid ?? 0) + 1 },
    seen: s.discarded + 1,
  };
  delete after.cut;
  return { ...s, quest: { ...s.quest!, party: { ...party, rival: after } } };
}

/** The next card is about to be dealt: the rival may turn up on it, never
 * on one of their own cards, the dragon, a landmark or a card right after
 * a fork's door, never within `RIVAL_GAP` cards of their last appearance,
 * never on a party at `RIVAL_MERCY` hearts or fewer, each kind at most
 * `RIVAL_CAP` times and all kinds `RIVAL_TOTAL` times a run. An ambush puts
 * one of their confrontations in a room's place; any other verb is saved
 * on the party as the card's `cut`, so a reload never decides it again.
 * Rooms take every verb they fit; bosses and guards (single-d20 fights
 * outside the regions' rooms) only the Do-Over and the meddle; an inn only
 * the squat. */
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
  if (leaving.encounter === "fork") return quest;
  const at = finaleStage(quest, step);
  const stage = quest.stages[at.stage];
  const coming = stage.cards.find((c) => c.id === id);
  if (
    !coming ||
    coming.rival ||
    coming.lairFight ||
    coming.encounter === "fork" ||
    coming.encounter === "shrine"
  )
    return quest;
  // They come for a party that has something: one down to its last few
  // hearts is left alone until it recovers.
  if (party.hearts <= RIVAL_MERCY) return quest;
  if (draw - (rival.seen ?? -RIVAL_GAP) < RIVAL_GAP) return quest;
  const cuts = rival.cuts ?? {};
  const made = RIVAL_VERBS.reduce((n, k) => n + (cuts[k] ?? 0), 0);
  if (made >= RIVAL_TOTAL) return quest;
  const profile = rivalProfile(quest)?.profile;
  if (!profile) return quest;
  const greed = RIVAL_GREED * Math.min(3, party.loot.length);
  if (random() >= RIVAL_RATE + greed) return quest;
  const taken = new Set(quest.finale);
  const pool = quest.stages
    .flatMap((st) => st.ambush ?? [])
    .filter((c) => c.rival?.who === rival.who && !taken.has(c.id));
  const dice = coming.dice;
  const room = stage.pick >= 2 && !coming.hits && !coming.offers?.length;
  // A room with no fight: a poach lands when it is put aside, so it may
  // roll dice.
  const calm = room && !coming.battle && !coming.strike && !coming.press;
  const d20 =
    !!coming.battle &&
    dice?.count === 1 &&
    dice.sides === 20 &&
    !dice.choice &&
    !coming.press;
  const open: Record<RivalVerb, boolean> = {
    ambush: room && at.index > 0 && pool.length > 0,
    meddle: d20,
    redo: d20,
    snipe: room && !!(coming.reward?.loot || coming.reward?.heal),
    // A swipe or a hand-off takes the newest item as the card goes, fight
    // or no fight: it never touches the roll.
    swipe: room && party.loot.length > 0,
    handoff: room && party.loot.length > 0,
    poach: calm && poachable(party, quest).length > 0,
    squat: coming.encounter === "rest" && !!coming.offers?.some((o) => o.heal),
    // An invoice holds the card (its roll, its Won and Lost) until paid.
    invoice: room && !coming.press && !coming.timer && !coming.secret,
    curse: room && !coming.jinx && !party.jinx && !!curseCard(quest, rival.who),
  };
  const weight = (k: RivalVerb) => profile.style[k] ?? 0;
  const kinds = RIVAL_VERBS.filter(
    (k) => open[k] && (cuts[k] ?? 0) < RIVAL_CAP[k] && weight(k) > 0,
  );
  const total = kinds.reduce((n, k) => n + weight(k), 0);
  if (!total) return quest;
  let roll = random() * total;
  const kind = kinds.find((k) => (roll -= weight(k)) < 0) ?? kinds[0];
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

/** A joined rival with `leavesAt` walks off a party at that many hearts or
 * fewer (Rivals Phase 3: Chuck goes to watch the dragon instead). */
export function leaveLow(party: PartyState, quest: QuestState): PartyState {
  const id = (party.team ?? []).find((m) => {
    const at = finaleCard(quest, m)?.ally?.leavesAt;
    return at !== undefined && party.hearts <= at;
  });
  if (!id || !party.rival) return party;
  const team = party.team!.filter((m) => m !== id);
  const next: PartyState = {
    ...party,
    team,
    rival: { ...party.rival, news: { ...party.rival.news, left: id } },
  };
  if (!team.length) delete next.team;
  return addDeed(next, "rival-left");
}

/** Gary's Whistle (Rivals Phase 3): a cut on the card in play, and the
 * whistle not yet blown since the last region boss fell. */
export function canHush(s: SessionState): boolean {
  const party = s.quest?.party;
  const rival = party?.rival;
  if (!rival?.cut || rival.hushed || s.phase !== "revealed") return false;
  if (rival.cut === "redo" && rival.redone) return false;
  return !!omenEffect(s.quest)?.hush;
}
/** Blow the whistle: the cut is cancelled, once a region. */
export function hush(s: SessionState): SessionState {
  if (!canHush(s)) return s;
  const party = s.quest!.party!;
  const rival: Rival = {
    ...party.rival!,
    hushed: true,
    seen: s.discarded + 1,
  };
  delete rival.cut;
  return { ...s, quest: { ...s.quest!, party: { ...party, rival } } };
}

/** Gary's debt in drinks (Rivals Phase 3): one for every item he holds,
 * at least 1 and at most 6. Spoken; nothing is counted. */
export const settleDrinks = (quest: QuestState | undefined) =>
  Math.min(6, Math.max(1, quest?.party?.rival?.took.length ?? 0));
