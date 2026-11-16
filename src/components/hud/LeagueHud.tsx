import type { CSSProperties } from "react";
import type { SessionState } from "../../game/types";
import { questRecord } from "../../game/engine";
import {
  CrawlIcon,
  crawlMeterLabel,
  useHeartPulse,
  type StripDialog,
} from "../Crawl";
import { crawlTheme } from "../crawlTheme";
import { EdgeMark, TypeMark } from "../LeagueMarks";
import { typeStyle } from "../../presentation/pokemon-types";
import { hudPlace, hudStatus } from "./model";
import { HeartSplat, StatusButton, Track } from "./parts";

// The League's HUD (2026-11-16, rebuilt from scratch, owner: "much simpler
// and more elegant ... collapse groups into icons and numbers"): one glass
// bar and one quiet status line.
//
// The bar: the lead's medallion in a ring of Team HP with the number beside
// it (opens the team), the place over its pips, and the menu. The status
// line: the team, the bag and the badges as a mark and a number each, and,
// only while they matter, the type edge, a sent-in Pokémon and a jinx, as
// marks with no words. Styles: `presentation/hud-league.css`.

const RING = 2 * Math.PI * 21;

export function LeagueHud({
  session,
  disabled,
  onOpen,
  onMenu,
}: {
  session: SessionState;
  disabled: boolean;
  onOpen: (page: StripDialog | "party") => void;
  onMenu: () => void;
}) {
  const quest = session.quest!;
  const party = quest.party!;
  const theme = crawlTheme(quest.packId);
  const place = hudPlace(session);
  const st = hudStatus(session);
  const form = questRecord(session)!.form;
  const { pulse, delta } = useHeartPulse(party.hearts);
  const share = Math.max(0, Math.min(1, party.hearts / party.max));
  const tone = share > 0.5 ? "high" : share > 0.2 ? "mid" : "low";
  return (
    <header
      className="topbar hud crawl-hud lh"
      // The lead's colours tint the bar's light.
      style={form?.type ? (typeStyle(form.type) as CSSProperties) : undefined}
    >
      <div className="lh-bar">
        <button
          type="button"
          className={`crawl-meter lh-hp hp-${tone}${pulse ? ` ${pulse}` : ""}`}
          aria-label={crawlMeterLabel(quest)}
          aria-haspopup="dialog"
          disabled={disabled}
          onClick={(event) => {
            event.currentTarget.focus();
            onOpen("party");
          }}
        >
          <span className="lh-gauge" data-fly="hearts" aria-hidden="true">
            <svg className="lh-ring" viewBox="0 0 48 48">
              <circle className="ring-track" cx="24" cy="24" r="21" />
              <circle
                className="ring-live"
                cx="24"
                cy="24"
                r="21"
                strokeDasharray={RING}
                strokeDashoffset={RING * (1 - share)}
              />
            </svg>
            {form?.type ? (
              <TypeMark type={form.type} className="lh-lead" />
            ) : (
              <CrawlIcon name="heart" theme={theme} className="lh-lead" />
            )}
            <HeartSplat hearts={party.hearts} pulse={pulse} delta={delta} />
          </span>
          <span className="lh-hp-num" aria-hidden="true">
            <b key={party.hearts}>{party.hearts}</b>
            <small>/{party.max}</small>
          </span>
        </button>
        <div
          className={`crawl-progress lh-place${place.fight ? ` fight-${place.fight}` : ""}`}
          role="img"
          aria-label={place.spoken}
        >
          <small className="lh-place-name">{place.label}</small>
          <Track track={place.track} />
        </div>
        <button
          type="button"
          className="menu-button lh-menu"
          aria-label="Open game menu"
          disabled={disabled}
          onClick={onMenu}
        >
          <span aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </button>
      </div>
      <div
        className="hud-strip lh-status"
        role="group"
        aria-label={theme.words.party}
      >
        <StatusButton
          className="tag-party"
          label={st.say.party}
          fly="party"
          disabled={disabled}
          onOpen={() => onOpen("party")}
        >
          <CrawlIcon name="heart" theme={theme} />
          <b>
            {st.team}
            <small>/{st.teamMax}</small>
          </b>
        </StatusButton>
        <StatusButton
          className={`tag-satchel${st.items ? "" : " empty"}`}
          label={st.say.satchel}
          fly="satchel"
          disabled={disabled}
          onOpen={() => onOpen("satchel")}
        >
          <CrawlIcon name="satchel" theme={theme} />
          <b>{st.items}</b>
        </StatusButton>
        {st.badges && (
          <StatusButton
            className={`tag-badges${st.badges.locked ? " locked" : ""}`}
            label={st.say.badges}
            fly="badges"
            disabled={disabled || st.badges.locked}
            onOpen={() => onOpen("badges")}
          >
            <CrawlIcon name="boss" theme={theme} />
            <b>{st.badges.earned}</b>
            {st.badges.locked && <i className="chip-lock" aria-hidden="true" />}
          </StatusButton>
        )}
        {(st.edge || st.helper || st.jinx) && (
          <i className="lh-rule" aria-hidden="true" />
        )}
        {st.edge && (
          <StatusButton
            className={`hud-alert tag-edge edge-${st.edge}`}
            label={st.say.edge}
            fly="matchup"
            disabled={disabled}
            onOpen={() => onOpen("matchup")}
          >
            <EdgeMark edge={st.edge} />
          </StatusButton>
        )}
        {st.helper && (
          <StatusButton
            className="hud-alert tag-assist"
            label={st.say.helper}
            disabled={disabled}
            onOpen={() => onOpen("party")}
          >
            {st.helper.type ? (
              <TypeMark type={st.helper.type} />
            ) : (
              <CrawlIcon name="ally" theme={theme} />
            )}
            <b>+{st.helper.bonus}</b>
          </StatusButton>
        )}
        {st.jinx && (
          <StatusButton
            className="hud-alert tag-jinx"
            label={st.say.jinx}
            fly="jinx"
            disabled={disabled}
            onOpen={() => onOpen("jinx")}
          >
            <CrawlIcon name="jinx" theme={theme} />
          </StatusButton>
        )}
      </div>
    </header>
  );
}
