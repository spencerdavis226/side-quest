import { useId, type ReactNode } from "react";
import type { SessionState } from "../../game/types";
import { questRecord } from "../../game/engine";
import { haptic } from "../../app/haptics";
import { trayKind } from "../trayTabs";
import { crawlPlace } from "../Crawl";
import { Sheet } from "./Sheet";
import { Emblem } from "./marks";
import "../../presentation/tray.css";
import "../../presentation/tray-league.css";
import "../../presentation/tray-quest.css";

// The pause menu of a crawl (2026-11-16, owner: "Menu screens too"): the
// same sheet as the tray, in the mode's own look. The League's is the
// device's settings screen; the Quest's a page of the journal. Previous
// card, Undo, How to play, and End game, which asks on the sheet itself
// ("Call it a night?") instead of opening another dialog. Plain games keep
// the old pause dialog.

const ROMAN = ["I", "II", "III", "IV", "V"];

function Row({
  icon,
  label,
  note,
  danger = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  note?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`menu-row-x${danger ? " danger" : ""}`}
      onClick={(event) => {
        event.currentTarget.focus();
        onClick();
      }}
    >
      <span className="menu-row-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="menu-row-words">
        <strong>{label}</strong>
        {note && <small aria-hidden="true">{note}</small>}
      </span>
      <svg className="menu-row-chev" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

const icon = (d: string) => (
  <svg viewBox="0 0 24 24">
    <path d={d} />
  </svg>
);
const ICONS = {
  previous: icon("M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5"),
  undo: icon("M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11"),
  guide: icon(
    "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5",
  ),
  end: icon("M10 3H5v18h5M15 8l4 4-4 4M19 12H9"),
};

export default function CrawlMenu({
  session,
  step,
  exiting,
  onClose,
  onPrevious,
  onUndo,
  onGuide,
  onAskEnd,
  onBack,
  onEnd,
}: {
  session: SessionState;
  /** The menu, or the question End game asks. */
  step: "menu" | "end";
  exiting: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onUndo?: () => void;
  onGuide: () => void;
  onAskEnd: () => void;
  onBack: () => void;
  onEnd: () => void;
}) {
  const kind = trayKind(session);
  const quest = session.quest!;
  const party = quest.party!;
  const form = questRecord(session)?.form;
  const place = crawlPlace(quest);
  const titleId = `menu-title-${useId().replace(/:/g, "")}`;
  const asking = step === "end";
  const league = kind === "league";
  const who = form
    ? league
      ? form.title
      : `${form.title} · Rank ${ROMAN[form.form] ?? form.form + 1}`
    : "";
  const header = league ? (
    <div className="lg-head menu-head">
      <span className="lg-lens" aria-hidden="true">
        <i />
      </span>
      <div className="lg-display">
        <small className="lg-kicker" aria-hidden="true">
          Trainer Gear · {place.name}
        </small>
        <h2 id={titleId} className="lg-title" key={step}>
          {asking ? "Call it a night?" : "Paused"}
        </h2>
      </div>
    </div>
  ) : (
    <div className="qt-head menu-head">
      <span className="qt-seal" aria-hidden="true">
        <Emblem art="quill" />
      </span>
      <div className="qt-titles">
        <small className="qt-kicker" aria-hidden="true">
          {place.name}
        </small>
        <h2 id={titleId} className="qt-title" key={step}>
          {asking ? "Call it a night?" : "Paused"}
        </h2>
      </div>
    </div>
  );
  return (
    <Sheet
      skin={`tray-${kind}`}
      className="sheet-fit menu-sheet"
      exiting={exiting}
      onClose={onClose}
      titleId={titleId}
      focus=".menu-row-x, .menu-end-yes"
      header={header}
    >
      <div className="menu-body" data-sheet-scroll key={step}>
        {asking ? (
          <div className="menu-ask">
            <p>
              {league
                ? "End this journey and return to setup? The team’s progress will be cleared."
                : "End this quest and return to setup? Your progress will be cleared."}
            </p>
            <button
              type="button"
              className="tray-btn tray-btn-danger menu-end-yes"
              onClick={() => {
                haptic();
                onEnd();
              }}
            >
              End game
            </button>
            <button
              type="button"
              className="tray-btn tray-btn-quiet"
              onClick={onBack}
            >
              Keep playing
            </button>
          </div>
        ) : (
          <>
            {form && (
              <p className="menu-run" aria-hidden="true">
                <span>{who}</span>
                <span>
                  {party.hearts}/{party.max} {league ? "HP" : "hearts"}
                </span>
              </p>
            )}
            <nav className="menu-rows" aria-label="Game menu">
              {onPrevious && (
                <Row
                  icon={ICONS.previous}
                  label="Previous card"
                  onClick={onPrevious}
                />
              )}
              {onUndo && (
                <Row
                  icon={ICONS.undo}
                  label="Undo last move"
                  onClick={() => {
                    onUndo();
                    onClose();
                  }}
                />
              )}
              <Row icon={ICONS.guide} label="How to play" onClick={onGuide} />
              <Row
                icon={ICONS.end}
                label="End game"
                danger
                onClick={onAskEnd}
              />
            </nav>
          </>
        )}
      </div>
    </Sheet>
  );
}
