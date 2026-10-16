import type { SessionState } from "../game/types";
import { IconButton } from "./UI";
import { QuestMeter } from "./QuestMeter";
import { CrawlProgress } from "./Crawl";
/** One row of table furniture: a pack quest's meter, the count on a brass
 * medallion (a crawl's room or boss pips instead), the menu on a matching
 * stud. */
export function TopBar({
  session,
  disabled,
  onOpenMeter,
  onOpenMenu,
}: {
  session: SessionState;
  disabled: boolean;
  onOpenMeter: () => void;
  onOpenMenu: () => void;
}) {
  return (
    <header className="topbar">
      <QuestMeter session={session} disabled={disabled} onOpen={onOpenMeter} />
      {session.quest?.party ? (
        <CrawlProgress quest={session.quest} />
      ) : (
        <div
          className="progress"
          role="img"
          aria-label={`Card ${session.discarded + 1} of ${session.config.limit ?? "endless"}`}
        >
          <strong>{session.discarded + 1}</strong>
          <span className="muted"> / {session.config.limit ?? "∞"}</span>
        </div>
      )}
      <IconButton
        className="menu-button"
        label="Open game menu"
        disabled={disabled}
        onClick={onOpenMenu}
      >
        <span className="menu-icon" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </IconButton>
    </header>
  );
}
