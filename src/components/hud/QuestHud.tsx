import { lazy, Suspense, type CSSProperties } from "react";
import type { SessionState } from "../../game/types";
import { questRecord } from "../../game/engine";
import {
  CrawlIcon,
  crawlMeterLabel,
  useHeartPulse,
  type StripDialog,
} from "../Crawl";
import { crawlTheme } from "../crawlTheme";
import { hudPlace, hudStatus } from "./model";
import { HeartSplat, StatusButton, Track } from "./parts";

// The rival's medallion carries the Quest's emblem sprite: lazy, so it
// stays out of the first load.
const RivalMedal = lazy(() => import("../RivalMedal"));

// The Quest's HUD (2026-11-16, rebuilt from scratch, owner: "much simpler
// and more elegant ... curses and such don't need names, just an icon"):
// one iron-and-leather bar and one line of brass marks.
//
// The bar: a heart that drains like a vial with the hearts beside it (opens
// the party), the region over its waymarks (opens the map), and the menu as
// a wax seal. The line: the adventurer's rank, the satchel, the lore and
// the rival as a mark and a number each, and, only while they hold, a
// sent-in ally and the curse, as marks alone. In the lair the waymarks are
// the dragon's scales. Styles: `presentation/hud-quest.css`.

const ROMAN = ["I", "II", "III", "IV", "V"];

export function QuestHud({
  session,
  disabled,
  onOpen,
  onMenu,
}: {
  session: SessionState;
  disabled: boolean;
  onOpen: (page: StripDialog | "party" | "map") => void;
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
  const low = party.hearts <= 3;
  const dragon = st.dragon;
  return (
    <header
      className={`topbar hud crawl-hud qh${dragon?.enraged ? " enraged" : ""}`}
    >
      <div className="qh-bar">
        <button
          type="button"
          className={`crawl-meter qh-hp${low ? " low" : ""}${pulse ? ` ${pulse}` : ""}`}
          aria-label={crawlMeterLabel(quest)}
          aria-haspopup="dialog"
          disabled={disabled}
          onClick={(event) => {
            event.currentTarget.focus();
            onOpen("party");
          }}
        >
          <span
            className="qh-vial"
            data-fly="hearts"
            aria-hidden="true"
            style={{ "--fill": share } as CSSProperties}
          >
            <CrawlIcon name="heart" theme={theme} className="qh-vial-glass" />
            <CrawlIcon name="heart" theme={theme} className="qh-vial-blood" />
            <HeartSplat hearts={party.hearts} pulse={pulse} delta={delta} />
          </span>
          <span className="qh-hp-num" aria-hidden="true">
            <b key={party.hearts}>{party.hearts}</b>
            <small>/{party.max}</small>
          </span>
        </button>
        <button
          type="button"
          className={`crawl-progress qh-place${place.fight ? ` fight-${place.fight}` : ""}`}
          aria-label={place.spoken}
          aria-haspopup="dialog"
          disabled={disabled}
          onClick={(event) => {
            event.currentTarget.focus();
            onOpen("map");
          }}
        >
          <span className="qh-place-name" aria-hidden="true">
            {place.label}
          </span>
          {dragon ? (
            <span
              className={`hud-scales qh-scales${dragon.enraged ? " enraged" : ""}`}
              role="img"
              aria-label={`${dragon.title}: ${dragon.health - dragon.hits} of ${dragon.health} scales`}
            >
              {Array.from({ length: dragon.health }, (_, i) => (
                <i
                  key={
                    i < dragon.hits
                      ? `broken-${i}-${dragon.hits}`
                      : `whole-${i}`
                  }
                  className={`scale${i < dragon.hits ? " broken" : ""}${i === dragon.hits - 1 ? " just" : ""}`}
                />
              ))}
            </span>
          ) : (
            <Track track={place.track} />
          )}
        </button>
        <button
          type="button"
          className="menu-button qh-menu"
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
        className="hud-strip qh-status"
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
          <CrawlIcon name="adventurer" theme={theme} />
          <b className="qh-rank">{ROMAN[form?.form ?? 0] ?? "I"}</b>
          {st.team > 0 && <b className="qh-allies">+{st.team}</b>}
        </StatusButton>
        <StatusButton
          className={`tag-satchel${st.items || st.gear ? "" : " empty"}`}
          label={st.say.satchel}
          fly="satchel"
          disabled={disabled}
          onOpen={() => onOpen("satchel")}
        >
          <CrawlIcon name="satchel" theme={theme} />
          <b>{st.items}</b>
        </StatusButton>
        <StatusButton
          className={`tag-lore${st.lore ? " found" : " empty"}`}
          label={st.say.lore}
          fly="lore"
          disabled={disabled}
          onOpen={() => onOpen("lore")}
        >
          <CrawlIcon name="lore" theme={theme} className="rune" />
          <b>{st.lore}</b>
        </StatusButton>
        {st.rival && (
          <StatusButton
            className={`tag-rival${st.rival.cutting ? " cutting" : ""}`}
            label={st.say.rival}
            fly="rival"
            disabled={disabled}
            onOpen={() => onOpen("rival")}
          >
            <Suspense fallback={<CrawlIcon name="ambush" theme={theme} />}>
              <RivalMedal who={st.rival.who} className="chip-medal" />
            </Suspense>
            <b>{st.rival.holding}</b>
          </StatusButton>
        )}
        {(st.helper || st.jinx) && <i className="qh-rule" aria-hidden="true" />}
        {st.helper && (
          <StatusButton
            className="hud-alert tag-assist"
            label={st.say.helper}
            disabled={disabled}
            onOpen={() => onOpen("party")}
          >
            <CrawlIcon name="ally" theme={theme} />
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
      {dragon?.enraged && <i className="lair-edge" aria-hidden="true" />}
    </header>
  );
}
