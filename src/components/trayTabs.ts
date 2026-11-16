import type { SessionState } from "../game/types";
import {
  cardMatchup,
  currentCard,
  partyTeam,
  questRecord,
} from "../game/engine";
import { crawlTheme } from "./crawlTheme";
import type { StripDialog } from "./Crawl";

// The tray (2026-11-16, owner: "a custom and high budget tray to better
// organize and view all items and inventory and curses and pokemon"): one
// sheet per crawl with a page for each thing the party carries, opened from
// the hearts stud or any segment of the HUD's belt. This module is the
// eager part: which pages a run has and what each is called. The sheet
// itself (`tray/Tray.tsx`) is a lazy chunk. Display only; nothing saved.

/** A page of the tray. The names are the dialogs they replace, so the
 * HUD's segments and the hearts stud open the page they always opened. */
export type TrayTab =
  | "party"
  | "satchel"
  | "badges"
  | "matchup"
  | "jinx"
  | "lore"
  | "rival"
  | "map";

export interface TrayPage {
  id: TrayTab;
  /** The page's title, which names the tray while it is shown. */
  title: string;
  /** The dock's one-word label. */
  short: string;
  /** A count on the dock's tab (items carried, badges, lore found). */
  count?: string;
  /** Something on this page needs the table now (a curse holds, the
   * rival is cutting in, the type edge is live). */
  alert?: boolean;
}

/** Which tray a run uses: the League's device or the Quest's journal. */
export const trayKind = (session: SessionState): "league" | "quest" =>
  session.quest?.packId === "pokemon" ? "league" : "quest";

/** The tray's pages for this run, in dock order. */
export function trayPages(session: SessionState): TrayPage[] {
  const quest = session.quest;
  const party = quest?.party;
  const record = questRecord(session);
  if (!quest || !party || !record) return [];
  const { words } = crawlTheme(quest.packId);
  const team = partyTeam(quest);
  const carried = party.loot.length;
  const jinx = !!party.jinx && session.phase !== "complete";
  if (trayKind(session) === "league")
    return [
      {
        id: "party",
        title: words.party,
        short: "Team",
        count: `${1 + team.length}`,
      },
      {
        id: "satchel",
        title: words.Satchel,
        short: words.Satchel,
        count: carried ? `${carried}` : undefined,
      },
      {
        id: "badges",
        title: words.badges ?? "Badges",
        short: "Badges",
        count: `${record.badges.earned}/${record.badges.of}`,
      },
      {
        id: "matchup",
        title: "Type matchup",
        short: "Types",
        alert: liveEdge(session),
      },
      {
        id: "jinx",
        title: words.jinx?.name ?? "Jinx",
        short: words.jinx?.name ?? "Jinx",
        alert: jinx,
      },
    ];
  const pages: TrayPage[] = [
    {
      id: "party",
      title: words.party,
      short: "Party",
      count: team.length ? `${1 + team.length}` : undefined,
    },
    {
      id: "satchel",
      title: words.Satchel,
      short: "Pack",
      count: carried ? `${carried}` : undefined,
    },
    { id: "map", title: "The map", short: "Map" },
    {
      id: "lore",
      title: "Dragon lore",
      short: "Lore",
      count: `${party.lore ?? 0}/3`,
    },
  ];
  if (party.rival)
    pages.push({
      id: "rival",
      title: "Your rival",
      short: "Rival",
      count: party.rival.took.length ? `${party.rival.took.length}` : undefined,
      alert: !!party.rival.cut && session.phase !== "complete",
    });
  pages.push({
    id: "jinx",
    title: words.jinx?.name ?? "Curse",
    short: words.jinx?.name ?? "Curse",
    alert: jinx,
  });
  return pages;
}

/** The page a HUD segment or the hearts stud opens; one the run does not
 * have (a stray "badges" in the Quest) opens the party. */
export function trayPageFor(
  session: SessionState,
  opened: StripDialog | "party",
): TrayTab {
  const pages = trayPages(session);
  return pages.some((p) => p.id === opened) ? (opened as TrayTab) : "party";
}

/** The type edge on the battle face up. */
const liveEdge = (session: SessionState) =>
  session.phase === "revealed" &&
  !!cardMatchup(session.quest, currentCard(session))?.edge;
