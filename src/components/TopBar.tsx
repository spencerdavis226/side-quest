import type { SessionState } from "../game/types";
import { IconButton } from "./UI";
import { QuestMeter } from "./QuestMeter";
import { CrawlProgress, CrawlStrip, type StripDialog } from "./Crawl";

/** The play screen's header (2026-10-17): a stud on each side and a plaque
 * between them that says where the game is. In a crawl the left stud is the
 * party's hearts and a strip under the row carries everything else the
 * party has, each piece opening its own dialog. In a plain game the left
 * stud brings back the previous card, and the plaque counts the deck. */
export function TopBar({
  session,
  disabled,
  onOpenMeter,
  onOpenMenu,
  onOpenPrevious,
  onOpenStrip,
}: {
  session: SessionState;
  disabled: boolean;
  onOpenMeter: () => void;
  onOpenMenu: () => void;
  onOpenPrevious: () => void;
  onOpenStrip: (dialog: StripDialog) => void;
}) {
  const crawl = !!session.quest?.party;
  const limit = session.config.limit;
  const card = session.discarded + 1;
  return (
    <header className={`topbar hud${crawl ? " hud-crawl" : ""}`}>
      {session.quest ? (
        <QuestMeter
          session={session}
          disabled={disabled}
          onOpen={onOpenMeter}
        />
      ) : (
        <IconButton
          className="hud-stud previous-button"
          label="Show the last card"
          disabled={disabled || !session.previousId}
          onClick={onOpenPrevious}
        >
          <svg
            className="ui-icon"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M4 12a8 8 0 1 0 2.6-5.9" />
            <path d="M4 4v4.5h4.5" />
          </svg>
        </IconButton>
      )}
      {crawl ? (
        <CrawlProgress quest={session.quest!} />
      ) : (
        <div
          className="progress hud-plaque count"
          role="img"
          aria-label={`Card ${card} of ${limit ?? "endless"}`}
        >
          <small className="plaque-label">
            {limit
              ? "Card"
              : session.cycle
                ? `Round ${session.cycle + 1}`
                : "Endless"}
          </small>
          <span className="plaque-count">
            <strong>{card}</strong>
            <span className="muted"> / {limit ?? "∞"}</span>
          </span>
          {limit ? (
            <span className="plaque-bar" aria-hidden="true">
              <i
                style={{ width: `${(Math.min(card, limit) / limit) * 100}%` }}
              />
            </span>
          ) : null}
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
      {crawl && (
        <CrawlStrip
          session={session}
          disabled={disabled}
          onOpen={onOpenStrip}
        />
      )}
    </header>
  );
}
