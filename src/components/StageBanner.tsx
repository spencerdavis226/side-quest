import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionState } from "../game/types";
import {
  finaleCard,
  teamMember,
  finaleStage,
  questStages,
  wantedBoss,
} from "../game/engine";
import { crawlTheme } from "./crawlTheme";
import { packs } from "../content/manifest.generated";
import { stageArt } from "../presentation/league-art";
import { useAnnounce } from "./Announcer";
import { entranceFor } from "./moments/detect";

/** The banner that sweeps across the table as each finale stage begins (the
 * Legendary, the Elite Four, the Champion; a crawl's floors and bosses):
 * shown while the stage's first card is dealt face down, once per stage. It never takes a tap; the card
 * underneath stays playable. */
export function StageBanner({ session }: { session: SessionState }) {
  const banner = stageBanner(session);
  useAnnounce(
    banner
      ? [
          banner.mode,
          banner.intro,
          banner.wanted && `${banner.wantedWord}: ${banner.wanted}`,
        ]
          .filter(Boolean)
          .join(". ")
      : "",
    banner?.key ?? null,
  );
  if (!banner) return null;
  const { tone, art, mode, intro, wanted, wantedWord } = banner;
  return (
    <div
      // Keyed by stage so a new stage replays the sweep.
      key={banner.stage}
      className={`stage-banner banner-${tone}`}
      aria-hidden="true"
    >
      <div className={`stage-banner-cloth${art ? " painted-banner" : ""}`}>
        {art && <img className="stage-banner-art" src={art} alt="" />}
        <small>{mode}</small>
        <strong>{intro}</strong>
        {wanted && (
          <span className="banner-wanted">
            {wantedWord}: {wanted}
          </span>
        )}
      </div>
    </div>
  );
}
/** What the stage banner shows now, or null when none is up. */
function stageBanner(session: SessionState) {
  const quest = session.quest;
  if (!quest?.due || session.phase !== "hidden") return null;
  const stage = finaleStage(quest);
  if (stage.index !== 0) return null;
  // Once per stage: not again when a boss is dealt for another swing or a
  // lost Champion is replaced.
  const pool = quest.stages[stage.stage].cards;
  if (pool.some((c) => c.id === session.previousId)) return null;
  // A boss's own entrance plays instead (the moments layer, 2026-11-01).
  if (entranceFor(session)) return null;
  const rules = packs.find((p) => p.id === quest.packId)?.quest;
  const intro =
    (rules && questStages(rules).find((s) => s.label === stage.label)?.intro) ??
    stage.label;
  // The banner takes the stage's ribbon finish (pearl, violet, crimson).
  const tone = quest.stages[stage.stage].cards[0]?.ribbonTone ?? "gold";
  const art = quest.packId === "pokemon" ? stageArt(tone) : undefined;
  // A floor of rooms names the boss waiting at the bottom (Pub Crawl).
  const wantedWord = crawlTheme(quest.packId).words.wanted;
  const wanted =
    wantedWord && stage.size > 1 ? wantedBoss(quest)?.title : undefined;
  return {
    key: `${stage.stage}:${session.discarded}`,
    stage: stage.stage,
    mode: rules?.mode,
    intro,
    tone,
    art,
    wanted,
    wantedWord,
  };
}

/** How long the evolution and news banners stay up: their 5.2 s sweep
 * (theme.css), plus a little. */
const BANNER_MS = 5600;

/** Takes a banner down once its sweep ends, or after `BANNER_MS` if the
 * animation never reports its end (animations off, a paused tab), so a
 * banner can never be left standing over the table. */
function useBannerTimeout(key: string | null, clear: () => void) {
  useEffect(() => {
    if (key === null) return;
    const id = setTimeout(clear, BANNER_MS);
    return () => clearTimeout(id);
  }, [key, clear]);
}

/** Pub Crawl's news, swept across the top third like an evolution: a
 * trinket found (its name and power), a jinx laid (its rule) or lifted, a
 * lost fight's drinks passed on.
 * Shown once per change, never on a resumed game. Tonight's omen is a
 * boon too, but its own card has just said so. */
export function PartyNewsBanner({ session }: { session: SessionState }) {
  const quest = session.quest;
  const party = quest?.party;
  // The newest piece kept: a swap (2026-10-25) changes it without adding
  // to the count.
  const boons = party?.boons?.at(-1) ?? null;
  const jinx = party?.jinx;
  const passed = party?.passed;
  const fainted = party?.fainted;
  // The newest teammate: an egg hatched or a Legendary caught (2026-11-01)
  // is news; a ball's catch has its own throw.
  const newest = party?.team?.at(-1);
  const seen = useRef({ boons, jinx, passed, fainted, newest });
  const [shown, setShown] = useState<{
    key: string;
    kicker: string;
    title: string;
    line: string;
    tone: string;
  } | null>(null);
  const words = crawlTheme(quest?.packId).words;
  useEffect(() => {
    const before = seen.current;
    seen.current = { boons, jinx, passed, fainted, newest };
    if (!quest || !party) return;
    if (newest && newest !== before.newest) {
      const member = teamMember(quest, newest);
      if (member?.joins) {
        setShown({
          key: `joined-${newest}`,
          kicker: member.hits ? "Caught" : "Hatched",
          title: member.title,
          line: "Joined the team.",
          tone: "violet",
        });
        return;
      }
    }
    // A caught Pokémon lost with (2026-10-31, a Nuzlocke): gone for good.
    if (fainted && fainted !== before.fainted) {
      const fallen = teamMember(quest, fainted);
      if (fallen) {
        setShown({
          key: `fainted-${fainted}-${session.discarded}`,
          kicker: "Fainted",
          title: fallen.title,
          line: "Gone for good. The drawer drinks 2.",
          tone: "crimson",
        });
        return;
      }
    }
    if (passed !== undefined && passed !== before.passed) {
      const item = crawlTheme(quest.packId).loot.round;
      setShown({
        key: `passed-${passed}`,
        kicker: item.name,
        title: "Point at someone",
        line: "This fight's drinks are theirs.",
        tone: "violet",
      });
      return;
    }
    if (jinx && jinx !== before.jinx && words.jinx) {
      const laid = finaleCard(quest, jinx)?.jinx;
      if (laid)
        setShown({
          key: `jinx-${jinx}`,
          kicker: words.jinx.landed,
          title: laid.name,
          line: laid.rule,
          tone: "crimson",
        });
    } else if (before.jinx && !jinx && words.jinx)
      setShown({
        key: `lifted-${before.jinx}`,
        kicker: words.jinx.name,
        title: words.jinx.lifted,
        line: "",
        tone: "pearl",
      });
  }, [
    boons,
    jinx,
    passed,
    fainted,
    newest,
    quest,
    party,
    words,
    session.discarded,
  ]);
  const clear = useCallback(() => setShown(null), []);
  useBannerTimeout(shown?.key ?? null, clear);
  useAnnounce(
    shown
      ? [shown.kicker, shown.title, shown.line].filter(Boolean).join(". ")
      : "",
    shown?.key ?? null,
  );
  if (!shown) return null;
  return (
    <div
      key={shown.key}
      className={`stage-banner banner-${shown.tone} evolution-banner news-banner`}
      aria-hidden="true"
    >
      <div
        className="stage-banner-cloth"
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) clear();
        }}
      >
        <small>{shown.kicker}</small>
        <strong>{shown.title}</strong>
        {shown.line && <span>{shown.line}</span>}
      </div>
    </div>
  );
}
