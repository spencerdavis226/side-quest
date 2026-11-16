import {
  questArt,
  type QuestArt,
} from "../../presentation/quest-art.generated";
import type { TrayTab } from "../trayTabs";
import { CrawlIcon } from "../Crawl";
import { crawlTheme, type CrawlIconName } from "../crawlTheme";

// The tray's marks: the dock's tab icons and the emblems struck on its
// medallions. The Quest's come from the vendored game-icons paths (this
// module is in the tray's lazy chunk, so they never reach the first load);
// the League's are the pack's own single-colour marks.

/** A game-icons emblem (512 units square) as an inline SVG that takes
 * `currentColor`. */
export function Emblem({
  art,
  className = "",
}: {
  art: QuestArt;
  className?: string;
}) {
  return (
    <svg
      className={`tray-emblem ${className}`}
      viewBox="0 0 512 512"
      aria-hidden="true"
    >
      <path d={questArt[art]} />
    </svg>
  );
}

const QUEST_TABS: Partial<Record<TrayTab, CrawlIconName | QuestArt>> = {
  party: "adventurer",
  satchel: "satchel",
  map: "compass",
  lore: "lore",
  rival: "capes",
  jinx: "jinx",
};
const LEAGUE_TABS: Partial<Record<TrayTab, CrawlIconName>> = {
  party: "heart",
  satchel: "satchel",
  badges: "boss",
  jinx: "jinx",
};

/** A tab's mark on the dock. */
export function DockIcon({
  kind,
  id,
}: {
  kind: "league" | "quest";
  id: TrayTab;
}) {
  if (kind === "league" && id === "matchup")
    // Types: the attacking triangle, three facets of a gem.
    return (
      <svg
        className="dock-icon dock-svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 2.8 21.2 19H2.8Z" className="facet-a" />
        <path d="M12 2.8 12 13.6 2.8 19Z" className="facet-b" />
        <path d="M12 13.6 21.2 19H2.8Z" className="facet-c" />
      </svg>
    );
  const name = (kind === "league" ? LEAGUE_TABS : QUEST_TABS)[id];
  if (name && name in questArt && !isCrawlIcon(name))
    return <Emblem art={name as QuestArt} className="dock-icon" />;
  return (
    <CrawlIcon
      name={(name as CrawlIconName) ?? "satchel"}
      theme={crawlTheme(kind === "league" ? "pokemon" : "dungeon")}
      className="dock-icon"
    />
  );
}

const CRAWL_ICONS = new Set<string>([
  "heart",
  "boss",
  "satchel",
  "omen",
  "ambush",
  "adventurer",
  "trinket",
  "rest",
  "jinx",
  "weapon",
  "armor",
  "ally",
  "lore",
]);
const isCrawlIcon = (name: string) => CRAWL_ICONS.has(name);

export { allyMark as allyArt } from "../allyMark";
