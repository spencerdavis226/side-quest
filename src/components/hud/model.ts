import type { SessionState } from "../../game/types";
import {
  TEAM_SIZE,
  assistBonus,
  cardMatchup,
  currentCard,
  finaleCard,
  finaleStage,
  hitsNeeded,
  partyTeam,
  questRecord,
  rivalProfile,
  teamMember,
} from "../../game/engine";
import { crawlPlace, isOmenBoon } from "../Crawl";
import { crawlTheme } from "../crawlTheme";
import { badgesLocked } from "../LeagueMarks";
import type { PokemonType } from "../../presentation/pokemon-types";

// What a crawl's HUD shows (2026-11-16, the HUD rebuild), read from the run
// alone: where the party is (`hudPlace`) and what it carries (`hudStatus`).
// Both skins draw from these; neither decides anything. The spoken labels
// are the ones the header always had, so VoiceOver reads the same lines.

export type HudTrack =
  | { kind: "rooms"; room: number; rooms: number }
  | { kind: "hits"; hits: number; need: number }
  | { kind: "mark"; mark: "adventurer" | "omen" | "rest" | "ambush" };

export interface HudPlace {
  /** The words over the track: the region, a boss's stage, an inn. */
  label: string;
  /** Read aloud for the whole plaque. */
  spoken: string;
  track: HudTrack;
  /** A boss or an ambush is in play. */
  fight: "boss" | "ambush" | null;
}

/** Where the party is, as the centre of the bar shows it. */
export function hudPlace(session: SessionState): HudPlace {
  const quest = session.quest!;
  const place = crawlPlace(quest);
  const party = quest.party!;
  const card = finaleCard(quest, quest.finale[quest.step]);
  const need = card ? hitsNeeded(quest, card) : 0;
  const { words } = crawlTheme(quest.packId);
  if (place.omen) {
    const label = place.kind === "adventurer" ? words.adventurer : words.omen;
    return {
      label,
      spoken: label,
      track: {
        kind: "mark",
        mark: place.kind === "adventurer" ? "adventurer" : "omen",
      },
      fight: null,
    };
  }
  // An inn, or a lone set piece without swings.
  if (place.kind === "rest" || (place.kind === "set-piece" && !need))
    return {
      label: place.name,
      spoken: place.name,
      track: { kind: "mark", mark: place.kind === "rest" ? "rest" : "ambush" },
      fight: null,
    };
  if (need) {
    const at = finaleStage(quest);
    const stage = quest.stages[at.stage].label;
    const label = place.boss
      ? at.size > 1
        ? `${stage} · ${at.index + 1}/${at.size}`
        : stage
      : place.kind === "set-piece"
        ? place.name
        : `${words.Ambush} · ${place.room}/${place.rooms}`;
    const who = place.boss
      ? words.Boss
      : place.kind === "set-piece"
        ? `${words.Ambush}, ${place.name}`
        : `${words.Ambush} in ${words.Room.toLowerCase()} ${place.room} of ${place.rooms}`;
    return {
      label,
      spoken: `${who}: ${party.hits} of ${need} hits`,
      track: { kind: "hits", hits: party.hits, need },
      fight: place.boss ? "boss" : "ambush",
    };
  }
  return {
    label: place.name,
    spoken: `${words.Room} ${place.room} of ${place.rooms}, ${place.name}`,
    track: { kind: "rooms", room: place.room, rooms: place.rooms },
    fight: null,
  };
}

export interface HudStatus {
  /** The satchel: items carried and its places. */
  items: number;
  satchel: number;
  /** Worn gear and trinkets (the Quest). */
  gear: number;
  /** Caught Pokémon or allies, and the team's places. */
  team: number;
  teamMax: number;
  /** The League's badges; `locked` while a card asks for them by heart. */
  badges: { earned: number; of: number; locked: boolean } | null;
  /** The Quest's dragon lore, 0 to 3. */
  lore: number | null;
  rival: {
    who: string;
    name: string;
    holding: number;
    cutting: boolean;
  } | null;
  /** A curse or jinx holds: its name, for the spoken label only. */
  jinx: string | null;
  /** The League's type edge on the battle face up. */
  edge: "advantage" | "disadvantage" | null;
  /** A caught Pokémon or ally sent into this fight. */
  helper: { title: string; bonus: number; type?: PokemonType } | null;
  /** The dragon battle: its scales. */
  dragon: {
    title: string;
    health: number;
    hits: number;
    enraged: boolean;
  } | null;
  /** Spoken labels, as the strip's chips had them. */
  say: {
    satchel: string;
    party: string;
    badges: string;
    lore: string;
    rival: string;
    jinx: string;
    edge: string;
    helper: string;
  };
}

export function hudStatus(session: SessionState): HudStatus {
  const quest = session.quest!;
  const party = quest.party!;
  const record = questRecord(session)!;
  const theme = crawlTheme(quest.packId);
  const { words } = theme;
  const league = quest.packId === "pokemon";
  const live = session.phase !== "complete";
  const team = partyTeam(quest);
  const gear = record.boons.filter((b) => !isOmenBoon(b));
  const jinx = party.jinx ? finaleCard(quest, party.jinx)?.jinx : undefined;
  const profile = rivalProfile(quest)?.profile;
  const matchup =
    session.phase === "revealed"
      ? cardMatchup(quest, currentCard(session))
      : null;
  const sent =
    session.phase === "revealed" && party.assist
      ? teamMember(quest, party.assist)
      : undefined;
  const dragonCard =
    party.duel && quest.due && live
      ? finaleCard(quest, quest.finale[quest.step])
      : undefined;
  const health = dragonCard?.lairFight ? hitsNeeded(quest, dragonCard) : 0;
  const locked = badgesLocked(session, theme);
  const badges =
    words.badges && record.badges.of > 0
      ? { earned: record.badges.earned, of: record.badges.of, locked }
      : null;
  const form = record.form;
  const carried = [
    ...party.loot.map((l) => theme.loot[l].name),
    ...team.map((m) => m.title),
    ...gear.map((b) => b.boon.name),
  ];
  return {
    items: party.loot.length,
    satchel: record.satchel,
    gear: gear.length,
    team: team.length,
    teamMax: TEAM_SIZE,
    badges,
    lore: league ? null : (party.lore ?? 0),
    rival:
      profile && party.rival
        ? {
            who: party.rival.who,
            name: profile.name,
            holding: party.rival.took.length,
            cutting: !!party.rival.cut && live,
          }
        : null,
    jinx: jinx && live ? jinx.name : null,
    edge: matchup?.edge ?? null,
    helper: sent
      ? { title: sent.title, bonus: assistBonus(sent, quest), type: sent.type }
      : null,
    dragon:
      dragonCard && health > 0
        ? {
            title: dragonCard.title,
            health,
            hits: party.hits,
            enraged: !!(party.duel?.enraged || party.duel?.contest),
          }
        : null,
    say: {
      satchel: `${words.Satchel}: ${carried.join(", ") || "empty"}`,
      party: `${words.party}${form ? `: ${form.title}` : ""}${team.length ? `, ${team.map((m) => m.title).join(", ")}` : ""}`,
      badges: badges
        ? `${words.badges}: ${badges.earned} of ${badges.of}${locked ? `, ${theme.badgeLock!.why}` : ""}`
        : "",
      lore: `Dragon lore: ${party.lore ?? 0} of 3`,
      rival:
        profile && party.rival
          ? `Your rival, ${profile.name}: holding ${party.rival.took.length} of your items`
          : "",
      jinx: jinx && words.jinx ? `${words.jinx.name}: ${jinx.name}` : "",
      edge:
        matchup?.edge === "advantage" ? "Type advantage" : "Type disadvantage",
      helper: sent
        ? `${sent.title} sent in: +${assistBonus(sent, quest)} to the roll`
        : "",
    },
  };
}
