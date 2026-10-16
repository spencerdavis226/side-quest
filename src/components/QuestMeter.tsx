import type { SessionState } from "../game/types";
import { finaleStage, questRecord } from "../game/engine";
import { packs } from "../content/manifest.generated";
import { PackLogo, ModeMark } from "./PackMarks";
import { CrawlMeterFace, crawlMeterLabel } from "./Crawl";
import { badgeArt } from "../presentation/league-art";

/** A quest mode's table-wide meter, in the play screen's top row: the goal's
 * progress (Badges 3/8), then the finale stage in play (Elite Four 2/4, or
 * VS for a single card). It glows through the finale, and a tap opens the
 * badge case. */
export function QuestMeter({
  session,
  disabled,
  onOpen,
}: {
  session: SessionState;
  disabled: boolean;
  onOpen: () => void;
}) {
  const quest = session.quest;
  if (!quest) return null;
  // A crawl's meter is the party: hearts, curse and satchel.
  if (quest.party)
    return (
      <div className="quest-meters">
        <button
          type="button"
          className={`quest-meter crawl-meter${quest.party.hearts <= 3 ? " low" : ""}${quest.party.curse ? ` cursed curse-${quest.party.curse}` : ""}`}
          aria-label={crawlMeterLabel(quest)}
          aria-haspopup="dialog"
          disabled={disabled}
          onClick={(event) => {
            event.currentTarget.focus();
            onOpen();
          }}
        >
          <CrawlMeterFace quest={quest} />
        </button>
      </div>
    );
  const pack = packs.find((p) => p.id === quest.packId);
  const stage = quest.due ? finaleStage(quest) : null;
  const label = stage ? stage.label : quest.label;
  const count = stage
    ? stage.size > 1
      ? `${stage.index + 1}/${stage.size}`
      : "VS"
    : `${quest.count}/${quest.goal}`;
  const spoken = stage
    ? stage.size > 1
      ? `${label}: ${stage.index + 1} of ${stage.size}`
      : label
    : `${label}: ${quest.count} of ${quest.goal}`;
  const latest = questRecord(session)?.earned.at(-1);
  const badge = !stage && latest ? badgeArt(latest.id) : undefined;
  return (
    <div className="quest-meters">
      <button
        type="button"
        className={`quest-meter${quest.due ? " due" : ""}`}
        aria-label={spoken}
        aria-haspopup="dialog"
        disabled={disabled}
        // Safari does not focus a tapped button; the dialog restores focus to
        // the opener, so take it here (as Button does).
        onClick={(event) => {
          event.currentTarget.focus();
          onOpen();
        }}
      >
        {badge ? (
          <img className="meter-badge" src={badge} alt="" />
        ) : pack?.quest?.mark ? (
          <ModeMark src={pack.quest.mark} />
        ) : (
          pack && <PackLogo pack={pack} decorative />
        )}
        <span>
          <small>{label}</small>
          {/* Keyed so each badge and each finale step replays the pop. */}
          <strong
            key={`${quest.count}-${quest.step}`}
            className={quest.count ? "earned" : ""}
          >
            {count}
          </strong>
        </span>
      </button>
    </div>
  );
}
