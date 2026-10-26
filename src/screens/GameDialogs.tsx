import { useEffect, useState } from "react";
import type { Loot, SessionState } from "../game/types";
import { Button, Modal } from "../components/UI";
import { PackLogo } from "../components/PackMarks";
import { selectedPacks } from "../presentation/packs";
import {
  cardMatchup,
  findCard,
  previousCard,
  questRecord,
  strikeOutcome,
} from "../game/engine";
import { QuestRecord } from "../components/QuestRecord";
import { CrawlRecord } from "../components/Crawl";
import { badgesLocked } from "../components/LeagueMarks";
import { Guide } from "../components/Guide";
import { crawlTheme } from "../components/crawlTheme";
import { CardFrame } from "../components/Cards";
import { theme } from "../presentation/theme";
export type DialogName =
  | "menu"
  | "previous"
  | "end"
  | "install"
  | "badges"
  // A crawl's party, from the hearts stud.
  | "party"
  | "satchel"
  | "quaff"
  | "cup"
  | "curse"
  | "jinx"
  // The League's type matchup chip (2026-10-25).
  | "matchup"
  // Pub Crawl's knack chip (2026-10-25).
  | "knack"
  | "power"
  | "rule"
  | "guide"
  // The previous card opened from the header's stud.
  | "recap"
  | null;
// Unmount just after the shared exit animation finishes. The timer is the
// bounded fallback, so a missing/again-changing animation can never strand the
// dialog open.
const EXIT_MS = theme.motion.dialogExit + 40;
export function GameDialogs({
  modal,
  setModal,
  session,
  offlineReady,
  onHideInstallHelp,
  onEnd,
  onSpend = () => {},
}: {
  modal: DialogName;
  setModal: (modal: DialogName) => void;
  session: SessionState | null;
  offlineReady: boolean;
  onHideInstallHelp: () => void;
  onEnd: () => void;
  /** Use a crawl item from the satchel (the draught, or a Tome, with the
   * path it picks for a forked adventurer). */
  onSpend?: (item: Loot, branch?: number) => void;
}) {
  // Keep the last dialog mounted while it animates out, so pause states do not
  // pop away instantly.
  const [displayed, setDisplayed] = useState<DialogName>(modal);
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    if (modal) {
      setDisplayed(modal);
      setExiting(false);
      return;
    }
    if (!displayed) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setExiting(true);
    const timer = setTimeout(
      () => {
        setDisplayed(null);
        setExiting(false);
      },
      reduced ? 0 : EXIT_MS,
    );
    return () => clearTimeout(timer);
  }, [modal, displayed]);
  if (displayed === "install")
    return (
      <Modal
        title="Add to Home Screen"
        onClose={() => setModal(null)}
        exiting={exiting}
      >
        <p>
          In Safari, open Share, choose <strong>Add to Home Screen</strong>,
          then <strong>Add</strong>. Leave Open as Web App enabled if offered.
        </p>
        <p>
          Install before you start a game: the Home Screen app keeps its own
          saved games, separate from Safari.
        </p>
        <p role="status">
          {offlineReady
            ? "Ready for offline play"
            : import.meta.env.DEV
              ? "Offline play is available in the production build."
              : "Preparing offline play…"}
        </p>
        <Button onClick={() => setModal(null)}>Got it</Button>
        <Button variant="text-button" onClick={onHideInstallHelp}>
          Already added — hide this hint
        </Button>
      </Modal>
    );
  if (displayed === "menu")
    return (
      <Modal title="Paused" onClose={() => setModal(null)} exiting={exiting}>
        {session?.previousId && (
          <Button variant="menu-row" onClick={() => setModal("previous")}>
            Previous card
          </Button>
        )}
        {session && (
          // Marks only, so the legend never reads as more menu rows.
          <div
            className="active-pack-list"
            role="group"
            aria-label="Packs in this game"
          >
            {selectedPacks(session.config.packIds).map((pack) => (
              <PackLogo key={pack.id} pack={pack} />
            ))}
          </div>
        )}
        <Button variant="menu-row" onClick={() => setModal("guide")}>
          How to play
        </Button>
        <Button
          variant="menu-row"
          className="danger"
          onClick={() => setModal("end")}
        >
          End game
        </Button>
      </Modal>
    );
  if (
    (displayed === "previous" || displayed === "recap") &&
    session?.previousId
  )
    return (
      <Modal
        title="Previous card"
        onClose={() => setModal(null)}
        exiting={exiting}
      >
        <CardFrame
          roll={session.previousRoll}
          packIds={session.config.packIds}
          card={previousCard(session)!}
          matchup={cardMatchup(
            session.quest,
            findCard(session, session.previousId)!,
          )}
          strike={strikeOutcome(
            session.quest,
            findCard(session, session.previousId)!,
          )}
        />
      </Modal>
    );
  const record = session && questRecord(session);
  if (
    (displayed === "party" ||
      displayed === "badges" ||
      displayed === "satchel" ||
      displayed === "quaff" ||
      displayed === "cup" ||
      displayed === "curse" ||
      displayed === "jinx" ||
      displayed === "matchup" ||
      displayed === "knack" ||
      displayed === "power" ||
      displayed === "rule") &&
    record?.party
  ) {
    const crawl = crawlTheme(session?.quest?.packId);
    const { words } = crawl;
    // The hearts open the party; each chip on the strip opens its own thing.
    // A crawl without badges (Pub Crawl) reads a stray "badges" as the party.
    const part = displayed === "badges" && !words.badges ? "party" : displayed;
    // A card asking for the badges from memory keeps the case shut.
    if (part === "badges" && badgesLocked(session!, crawl)) return null;
    const title = {
      party: words.party,
      badges: words.badges ?? words.party,
      satchel: words.Satchel,
      quaff: `The ${words.quaff ?? "Quaff"}`,
      cup: words.cup?.name ?? "The Cup",
      curse: words.curse[0].toUpperCase() + words.curse.slice(1),
      jinx: words.jinx?.name ?? "Jinx",
      matchup: "Type matchup",
      knack: "Knack",
      power: words.power.name,
      rule: words.rule.name,
    }[part];
    return (
      <Modal title={title} onClose={() => setModal(null)} exiting={exiting}>
        <CrawlRecord
          record={record}
          theme={crawl}
          session={session}
          onUse={onSpend}
          part={part}
        />
      </Modal>
    );
  }
  if (displayed === "guide") {
    const party = session?.quest?.party;
    return (
      <Modal
        title="How to play"
        onClose={() => setModal(null)}
        exiting={exiting}
      >
        <Guide
          crawl={
            party && session?.quest
              ? {
                  packId: session.quest.packId,
                  hearts: party.max,
                  quaff: party.quaff,
                  cup: party.cup !== undefined,
                }
              : undefined
          }
        />
      </Modal>
    );
  }
  if (displayed === "badges" && record)
    return (
      <Modal
        title={record.label}
        onClose={() => setModal(null)}
        exiting={exiting}
      >
        <QuestRecord
          record={record}
          league={session?.quest?.packId === "pokemon"}
        />
      </Modal>
    );
  if (displayed === "end")
    return (
      <Modal
        title="Call it a night?"
        onClose={() => setModal("menu")}
        exiting={exiting}
      >
        <p>End this game and return to setup? Your progress will be cleared.</p>
        <Button onClick={onEnd}>End game</Button>
        <Button variant="text-button" onClick={() => setModal(null)}>
          Keep playing
        </Button>
      </Modal>
    );
  return null;
}
