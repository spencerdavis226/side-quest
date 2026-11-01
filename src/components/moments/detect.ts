import type { Loot, PokemonType, SessionState } from "../../game/types";
import {
  cardMatchup,
  currentCard,
  findCard,
  finaleCard,
  finaleStage,
  formEffect,
  isBossCard,
  natural,
  omenForm,
  partyBoons,
  partyType,
  questRecord,
  teamMember,
  wantedBoss,
} from "../../game/engine";
import { rollWins } from "../../game/dice";
import { describeChange } from "../../game/omenText";
import { badgeArt } from "../../presentation/league-art";
import { badgeType } from "../../presentation/pokemon-types";
import { crawlTheme, type CrawlIconName } from "../crawlTheme";
import { gearIcon, isOmenBoon } from "../Crawl";
import { badgeName } from "../LeagueMarks";

// The moments layer's triggers (2026-11-01, owner: "premium ... eye candy
// ... special moments"). Read only from what a game already keeps: no
// engine rule, save field or card changes. Each moment fires on a change
// between two snapshots the table just made, so a resumed game (no earlier
// snapshot) and an undo (`undone`) never play one.

export type EntranceStyle =
  | "gym"
  | "elite"
  | "champion"
  | "legendary"
  | "rival"
  | "villain"
  | "boss"
  | "final"
  | "ambush";

export interface Fighter {
  name: string;
  type?: PokemonType;
}

export type Moment = {
  /** Once per moment: the same key never plays twice. */
  key: string;
  /** Spoken through the live region (every moment is `aria-hidden`). */
  say: string;
} & (
  | { kind: "natural"; nat: 20 | 1 }
  | {
      kind: "evolution";
      league: boolean;
      from: string;
      to: string;
      kicker: string;
      change: string;
      fromType?: PokemonType;
      toType?: PokemonType;
    }
  | {
      kind: "entrance";
      style: EntranceStyle;
      league: boolean;
      kicker: string;
      title: string;
      foe: Fighter;
      hero?: Fighter;
      hearts: number;
      max: number;
      heartsWord: string;
      /** The badge a gym pays, its art and name. */
      badge?: { name: string; art?: string };
    }
  | {
      kind: "clash";
      mine: PokemonType;
      theirs: PokemonType;
      edge: "advantage" | "disadvantage" | "even";
      /** A strike, settled by the matchup alone (no roll). */
      strike: boolean;
    }
  | { kind: "sendin"; name: string; type?: PokemonType; bonus?: string }
  | { kind: "omen"; league: boolean; title: string; type?: PokemonType }
  | {
      kind: "badge";
      name: string;
      art?: string;
      type: PokemonType;
      earned: number;
      of: number;
    }
  | {
      kind: "loot";
      name: string;
      icon: CrawlIconName;
      tier: "gold" | "violet" | "bronze";
      kicker: string;
      more: number;
      packId: string;
      /** What a piece of gear or a trinket does. */
      rules?: string;
    }
  | {
      kind: "milestone";
      kicker: string;
      title: string;
      line: string;
      /** A plain game's first card: sparks round the card as well. */
      opening?: boolean;
    }
  /** Matching dice on a card that reads them (`dice.doubles`). */
  | { kind: "doubles"; faces: number[]; sides: number; win: boolean }
  /** The bookcase swings open on a hidden room (Pub Crawl). */
  | {
      kind: "door";
      kicker: string;
      title: string;
      /** The keeper waiting inside, as the stage banner named it. */
      wanted?: string;
    }
  /** Push your luck: a pull banked (`ride`) or the bank lost (`bust`). */
  | { kind: "press"; bust: boolean; banked: number }
  /** The party is down to its last heart and still standing. */
  | { kind: "thread"; league: boolean; line: string }
  /** A caught Pokémon lost with in a fight: off the team for good. */
  | { kind: "faint"; name: string; type?: PokemonType; line: string }
  /** A Pokémon joins with no ball: an egg hatched, a Legendary caught on
   * its last beat. */
  | { kind: "join"; name: string; type?: PokemonType; hatched: boolean }
  /** A jinx laid (its name and rule) or lifted (the boss fell). */
  | {
      kind: "jinx";
      lifted: boolean;
      packId: string;
      kicker: string;
      name: string;
      rule: string;
    }
);
export type MomentKind = Moment["kind"];

/** Moments that only decorate: taps go through to the table under them
 * (the natural burst always let the next tap put the card aside; a type
 * clash must never eat the tap that rolls). */
export const AMBIENT: ReadonlySet<MomentKind> = new Set([
  "milestone",
  "natural",
  "clash",
  "doubles",
  "press",
]);
/** Moments cut short when the card moves (a roll starts under a clash, or
 * under a banked pull's coins). */
export const CUT_ON_MOTION: ReadonlySet<MomentKind> = new Set([
  "clash",
  "press",
]);
/** Moments that play over a motion already under way (the omen's reveal
 * covers the card turning; a natural lands as the dice settle). */
export const OVER_MOTION: ReadonlySet<MomentKind> = new Set(["omen"]);

/** A d20 natural face up on a returned roll, keyed to that one roll. */
function naturalKey(s: SessionState | null) {
  if (!s || s.phase !== "revealed" || !s.roll?.returned) return null;
  const nat = natural(currentCard(s), s.roll);
  if (!nat) return null;
  const party = s.quest?.party;
  return {
    nat,
    key: `${nat}:${s.discarded}:${party?.hits ?? 0}:${party?.press ?? 0}`,
  };
}

/** Matching dice face up on a returned roll whose card reads doubles. */
function doublesKey(s: SessionState | null) {
  if (!s || s.phase !== "revealed" || !s.roll?.returned) return null;
  const dice = currentCard(s).dice;
  const faces = s.roll.values;
  if (!dice?.doubles || faces.length < 2) return null;
  if (!faces.every((f) => f === faces[0])) return null;
  const party = s.quest?.party;
  return {
    faces,
    sides: dice.sides,
    win: !!dice.doublesWin,
    key: `${s.discarded}:${party?.hits ?? 0}:${party?.press ?? 0}:${faces.join("-")}`,
  };
}

/** Whether the push-your-luck card just put aside was won (cashed out):
 * read from its roll, since a full bag can take none of the prizes. */
function pressWon(s: SessionState) {
  const card = findCard(s, s.previousId);
  const roll = s.previousRoll;
  return !!card?.dice && !!roll && rollWins(card.dice, roll.values, roll);
}

/** A hidden room's first guard dealt face down (Pub Crawl): the bookcase
 * swings open. Read from the guards' ribbon (`Room · Guard`, `bookcase.ts`);
 * shared with `StageBanner`, which steps aside for it. */
export function hiddenRoomFor(s: SessionState) {
  const q = s.quest;
  if (!q?.due || !q.party || s.phase !== "hidden") return null;
  const at = finaleStage(q);
  if (at.index !== 0) return null;
  const pool = q.stages[at.stage].cards;
  if (!pool.length || !pool.every((c) => / · Guard$/.test(c.ribbon ?? "")))
    return null;
  if (pool.some((c) => c.id === s.previousId)) return null;
  return { key: `door:${at.label}`, title: at.label };
}

/** The boss, ambush or League ace being dealt face down for the first time,
 * as its entrance. Shared with `StageBanner`, which steps aside for it. */
export function entranceFor(s: SessionState) {
  const q = s.quest;
  const party = q?.party;
  if (!q?.due || !party || s.phase !== "hidden") return null;
  const card = currentCard(s);
  if (!card.hits && card.encounter !== "boss") return null;
  // First deal only: a boss dealt again (a lost swing, a landed hit) is
  // the tally's (`BossTally`), not an entrance.
  if (party.hits > 0 || s.previousId === card.id) return null;
  const at = finaleStage(q);
  const league = q.packId === "pokemon";
  const boss = isBossCard(card);
  const last = at.stage === q.stages.length - 1;
  const style: EntranceStyle = league
    ? /^Gym/.test(at.label)
      ? "gym"
      : at.label === "Legendary"
        ? "legendary"
        : at.label === "Elite Four"
          ? "elite"
          : at.label === "Champion"
            ? "champion"
            : !boss
              ? "rival"
              : "villain"
    : !boss
      ? "ambush"
      : last
        ? "final"
        : "boss";
  const theme = crawlTheme(q.packId);
  const kicker =
    style === "elite"
      ? `Elite Four · ${at.index + 1} of ${at.size}`
      : style === "rival"
        ? "Your rival"
        : style === "ambush"
          ? theme.words.Ambush
          : style === "legendary"
            ? "A Legendary appears"
            : style === "boss" || style === "final"
              ? at.label
              : at.label.replace(/ boss$/, "");
  const form = omenForm(q);
  const gym = style === "gym" && card.quest === q.packId;
  return {
    key: `${card.id}:${s.discarded}`,
    card,
    style,
    league,
    kicker,
    hero: form ? { name: form.title, type: partyType(q) } : undefined,
    hearts: party.hearts,
    max: party.max,
    heartsWord: theme.words.Hearts,
    badge: gym
      ? { name: `${badgeName(card)} Badge`, art: badgeArt(card.id) }
      : undefined,
  };
}

/** Items gained between two satchels: each kind's count that rose. */
function gained(before: Loot[], after: Loot[]): Loot[] {
  const left = [...before];
  const out: Loot[] = [];
  for (const item of after) {
    const i = left.indexOf(item);
    if (i >= 0) left.splice(i, 1);
    else out.push(item);
  }
  return out;
}

/** The same game, moved on by the table (not a new game, not a reload). */
function sameGame(a: SessionState, b: SessionState) {
  if (b.discarded < a.discarded) return false;
  return (
    a.config === b.config ||
    (a.order.length === b.order.length &&
      a.order.every((id, i) => id === b.order[i]))
  );
}

/** Every moment the change from `before` to `after` brings, in the order
 * they should play. */
export function momentsBetween(
  before: SessionState | null,
  after: SessionState | null,
  undone = false,
): Moment[] {
  if (!before || !after || undone || !sameGame(before, after)) return [];
  if (after.phase === "complete") return [];
  const out: Moment[] = [];
  const q = after.quest;
  const party = q?.party;
  const was = before.quest?.party;
  const theme = crawlTheme(q?.packId);
  const card = currentCard(after);
  const turned =
    before.phase === "hidden" &&
    after.phase === "revealed" &&
    before.discarded === after.discarded;

  // The run's first card turned over: the starter or the adventurer.
  if (turned && q?.due && card.encounter === "omen" && card.omen) {
    out.push({
      kind: "omen",
      key: `omen:${card.id}`,
      league: q.packId === "pokemon",
      title: card.title,
      type: card.type,
      say: "",
    });
  }

  if (q && party && was) {
    // A gym put aside: its badge.
    const badgesBefore = before.quest ? questRecord(before)?.badges.earned : 0;
    const record = questRecord(after);
    if (record && (badgesBefore ?? 0) < record.badges.earned) {
      const gym = findCard(after, after.previousId);
      if (gym && gym.quest === q.packId) {
        const name = `${badgeName(gym)} Badge`;
        out.push({
          kind: "badge",
          key: `badge:${gym.id}`,
          name,
          art: badgeArt(gym.id),
          type: badgeType(gym),
          earned: record.badges.earned,
          of: record.badges.of,
          say: `${name} earned. ${record.badges.earned} of ${record.badges.of}.`,
        });
      }
    }

    const evolved = (party.form ?? 0) > (was.form ?? 0);
    // Gear or a trinket kept (a boss's or an elite's spoils).
    const boonsBefore = new Set(was.boons ?? []);
    // Tonight's omen and the kit it starts with are its own card's news.
    const newBoon = partyBoons(q).find(
      (b) =>
        !boonsBefore.has(b.key) &&
        !isOmenBoon(b) &&
        b.card.encounter !== "omen",
    );
    const items = evolved ? [] : gained(was.loot, party.loot);
    if (newBoon) {
      const from = newBoon.card;
      out.push({
        kind: "loot",
        key: `boon:${newBoon.key}`,
        name: newBoon.boon.name,
        icon: gearIcon(newBoon.boon),
        tier: isBossCard(from) ? "gold" : "violet",
        // The banner's words before the moments layer (its mark shows the
        // slot).
        kicker:
          theme.words.trinketFound ??
          (newBoon.boon.slot
            ? theme.equipment?.slots[newBoon.boon.slot]
            : "") ??
          "Found",
        more: items.length,
        packId: q.packId,
        rules: newBoon.boon.rules,
        say: `${newBoon.boon.name}. ${newBoon.boon.rules}`,
      });
    } else if (items.length) {
      const item = items[0];
      const name = theme.loot[item].name;
      out.push({
        kind: "loot",
        key: `loot:${after.discarded}:${party.loot.length}:${item}`,
        name,
        icon: item,
        tier:
          item === "master" || item === "revive" || item === "candy"
            ? "violet"
            : "bronze",
        kicker: theme.words.Satchel,
        more: items.length - 1,
        packId: q.packId,
        say: `${name} into the ${theme.words.Satchel.toLowerCase()}.`,
      });
    }

    if (evolved) {
      const now = omenForm(q);
      const form = party.form ?? 0;
      const prior =
        form === 1 || now?.card.branches
          ? now?.card
          : now?.card.evolves?.[form - 2];
      const from = prior?.title;
      const words = theme.omenWords;
      const effect = formEffect(q) ?? {};
      const base = party.max - (effect.hearts ?? 0);
      const change =
        words && now?.before
          ? describeChange(now.before, effect, words, base)
          : "";
      const evolving = theme.words.evolving;
      if (now && from && evolving) {
        out.push({
          kind: "evolution",
          key: `evo:${from}>${now.title}`,
          league: q.packId === "pokemon",
          from,
          to: now.title,
          kicker: evolving(from),
          change,
          fromType: prior?.type ?? now.card.type,
          toType: now.type,
          say: `${evolving(from)} ${now.title}. ${change}`,
        });
      }
    }

    // A caught Pokémon sent into the fight.
    if (party.assist && party.assist !== was.assist) {
      const member = teamMember(q, party.assist);
      if (member)
        out.push({
          kind: "sendin",
          key: `send:${party.assist}:${after.discarded}`,
          name: member.title,
          type: member.type,
          say: `Go, ${member.title}!`,
        });
    }

    // A Pokémon joins with no throw (2026-11-01): the egg, a Legendary
    // caught on its last beat. A ball's catch has its own throw.
    const newest = party.team?.at(-1);
    if (newest && newest !== was.team?.at(-1)) {
      const member = teamMember(q, newest);
      if (member?.joins) {
        const hatched = !member.hits;
        out.push({
          kind: "join",
          key: `join:${newest}`,
          name: member.title,
          type: member.type,
          hatched,
          say: `${member.title} ${hatched ? "hatched" : "was caught"}. Joined the team.`,
        });
      }
    }

    // A caught Pokémon lost with (a Nuzlocke, 2026-10-31): gone for good.
    if (party.fainted && party.fainted !== was.fainted) {
      const fallen = teamMember(q, party.fainted);
      if (fallen) {
        const line = "Gone for good. The drawer drinks 2.";
        out.push({
          kind: "faint",
          key: `faint:${party.fainted}:${after.discarded}`,
          name: fallen.title,
          type: fallen.type,
          line,
          say: `${fallen.title} fainted. ${line}`,
        });
      }
    }

    // A jinx laid on a loss, or lifted as the boss falls.
    const words = theme.words.jinx;
    if (words && party.jinx && party.jinx !== was.jinx) {
      const laid = finaleCard(q, party.jinx)?.jinx;
      if (laid)
        out.push({
          kind: "jinx",
          key: `jinx:${party.jinx}:${after.discarded}`,
          lifted: false,
          packId: q.packId,
          kicker: words.landed,
          name: laid.name,
          rule: laid.rule,
          say: `${words.landed} ${laid.name}. ${laid.rule}`,
        });
    } else if (words && was.jinx && !party.jinx) {
      const gone = finaleCard(q, was.jinx)?.jinx;
      out.push({
        kind: "jinx",
        key: `lifted:${was.jinx}:${after.discarded}`,
        lifted: true,
        packId: q.packId,
        kicker: words.name,
        name: gone?.name ?? words.name,
        rule: words.lifted,
        say: `${words.lifted}: ${gone?.name ?? words.name}.`,
      });
    }

    // Push your luck: a pull banked, or the bank lost on a loss (a cash-out's
    // prizes are the loot moment's).
    const pressed = party.press ?? 0;
    const pressedBefore = was.press ?? 0;
    if (pressed > pressedBefore)
      out.push({
        kind: "press",
        key: `ride:${after.discarded}:${pressed}`,
        bust: false,
        banked: pressed,
        say: `Let it ride. ${pressed} banked.`,
      });
    else if (
      pressedBefore > 0 &&
      !pressed &&
      after.discarded > before.discarded &&
      !pressWon(after)
    )
      out.push({
        kind: "press",
        key: `bust:${before.discarded}`,
        bust: true,
        banked: pressedBefore,
        say: "Bust. The prizes are gone.",
      });

    // Down to the last heart, and still standing.
    if (party.hearts === 1 && was.hearts > 1 && !party.wiped) {
      const league = q.packId === "pokemon";
      out.push({
        kind: "thread",
        key: `thread:${after.discarded}:${party.hits}`,
        league,
        line: league ? "1 HP left." : "One heart left.",
        say: `By a thread. ${league ? "1 HP left." : "One heart left."}`,
      });
    }
  }

  // A plain game's first card turned over.
  if (!q && turned && after.discarded === 0 && after.cycle === 0)
    out.push({
      ...milestone("opening", "Raise your glasses", "Game on", ""),
      opening: true,
    } as Moment);

  // Standard and Infinite: the deck's milestones.
  if (!q && after.phase === "hidden" && after.discarded > before.discarded) {
    const limit = after.config.limit;
    const n = after.discarded;
    const crossed = (at: number) => before.discarded < at && n >= at;
    if (limit && limit >= 20 && crossed(limit - 1))
      out.push(
        milestone(`last:${n}`, "The deck", "Last card", "Make it count."),
      );
    else if (limit && limit >= 30 && crossed(limit - 10))
      out.push(
        milestone(
          `orders:${n}`,
          "Ten cards left",
          "Last orders",
          "Finish strong.",
        ),
      );
    else if (limit && limit >= 20 && crossed(Math.floor(limit / 2)))
      out.push(
        milestone(
          `half:${n}`,
          `${limit - n} cards left`,
          "Halfway",
          "Refill the glasses.",
        ),
      );
    else if (!limit && after.cycle > before.cycle)
      out.push(
        milestone(
          `round:${after.cycle}`,
          "Fresh shuffle",
          `Round ${after.cycle + 1}`,
          "Every card is back in the deck.",
        ),
      );
  }

  // A boss or ambush dealt face down for the first time.
  const entrance = entranceFor(after);
  if (entrance && entrance.key !== (entranceFor(before)?.key ?? null)) {
    const { card: foeCard, ...rest } = entrance;
    out.push({
      kind: "entrance",
      ...rest,
      title: foeCard.title,
      foe: { name: foeCard.title, type: foeCard.type },
      say: `${entrance.kicker}: ${foeCard.title}.`,
    });
  }

  // The bookcase swings open on a hidden room.
  const door = hiddenRoomFor(after);
  if (door && door.key !== (hiddenRoomFor(before)?.key ?? null)) {
    const kicker = "Behind the bookcase";
    const word = theme.words.wanted;
    const boss = q && word ? wantedBoss(q)?.title : undefined;
    const wanted = boss ? `${word}: ${boss}` : undefined;
    out.push({
      kind: "door",
      key: door.key,
      kicker,
      title: door.title,
      wanted,
      say: `${kicker}: ${door.title}.${wanted ? ` ${wanted}.` : ""}`,
    });
  }

  // A League fight turned over: the type matchup.
  if (turned && q?.party) {
    const m = cardMatchup(q, card);
    const mine = partyType(q);
    if (m && mine && card.type)
      out.push({
        kind: "clash",
        key: `clash:${card.id}:${after.discarded}`,
        mine,
        theirs: card.type,
        edge: m.edge ?? "even",
        strike: !!card.strike,
        say: "",
      });
  }

  // A d20 natural, the moment the dice land on it.
  const nat = naturalKey(after);
  if (nat && nat.key !== naturalKey(before)?.key)
    out.push({ kind: "natural", key: `nat:${nat.key}`, nat: nat.nat, say: "" });

  // Matching dice on a card that reads them.
  const pair = doublesKey(after);
  if (pair && pair.key !== doublesKey(before)?.key)
    out.push({
      kind: "doubles",
      key: `pair:${pair.key}`,
      faces: pair.faces,
      sides: pair.sides,
      win: pair.win,
      say: "",
    });

  return out;
}

function milestone(
  key: string,
  kicker: string,
  title: string,
  line: string,
): Moment {
  return {
    kind: "milestone",
    key: `milestone:${key}`,
    kicker,
    title,
    line,
    say: `${title}. ${kicker}.`,
  };
}

/** A card's foil (2026-11-01, display only): gold for the League's
 * Legendary and Champion and Pub Crawl's last boss, silver for every other
 * boss and the last card of a Standard deck. Read from the stage the card
 * belongs to; nothing is saved. (Until the 2026-11-01 review it read the
 * ribbon's tone, and every pearl or crimson ribbon wore gold: each starter,
 * adventurer and omen, every Pub Crawl boss, the rival and the queue.) */
export function cardFinish(
  s: SessionState,
  card: { id: string; encounter?: string; hits?: number },
): "gold" | "silver" | null {
  const q = s.quest;
  if (q?.due && q.party) {
    if (card.encounter !== "boss" && (card.encounter || !card.hits))
      return null;
    const stage = q.stages.findIndex((st) =>
      st.cards.some((c) => c.id === card.id),
    );
    if (stage < 0) return "silver";
    const label = q.stages[stage].label;
    const top =
      q.packId === "pokemon"
        ? label === "Legendary" || label === "Champion"
        : stage === q.stages.length - 1;
    return top ? "gold" : "silver";
  }
  const limit = s.config.limit;
  return !q && limit && s.discarded === limit - 1 ? "silver" : null;
}
