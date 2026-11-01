import { Button, Artwork } from "../components/UI";
import { asset } from "../presentation/theme";
import { QuestRecord } from "../components/QuestRecord";
import { CrawlIcon, CrawlRecord } from "../components/Crawl";
import { crawlTheme } from "../components/crawlTheme";
import type { questRecord } from "../game/engine";
import {
  lazy,
  Suspense,
  useState,
  type ComponentType,
  type ComponentProps,
} from "react";
import type { EndingKind } from "../components/moments/Ending";

// The ending's show (2026-11-01): a lazy chunk, played once over the end
// screen when the table has just reached it.
type EndingProps = ComponentProps<
  typeof import("../components/moments/Ending").default
>;
const Ending = lazy((): Promise<{ default: ComponentType<EndingProps> }> =>
  import("../components/moments/Ending").catch(() => ({
    default: NoEnding,
  })),
);
function NoEnding() {
  return null;
}
/** The end of a game: a toast to the table, or, when a quest mode's finale is
 * beaten, the Hall of Fame with the run laid out. A crawl ends either way:
 * the last boss falls, or the party wipes. */
export function Completion({
  count,
  record,
  mode,
  league = false,
  packId,
  celebrate,
  starting = false,
  onReplay,
  onSetup,
  onFinish,
  onUndo,
}: {
  count: number;
  record: ReturnType<typeof questRecord>;
  /** The quest mode's name, e.g. "Pokémon League". */
  mode?: string;
  league?: boolean;
  /** The quest's pack: a crawl's words and marks. */
  packId?: string;
  celebrate: boolean;
  /** The next run's cards are on their way; Play again waits for them. */
  starting?: boolean;
  onReplay: () => void;
  onSetup: () => void;
  onFinish: () => void;
  /** Take back the move that ended the game (a mis-tapped Lost that wiped
   * the party); absent when there is nothing to take back. */
  onUndo?: () => void;
}) {
  const crawl = record?.party;
  const wiped = !!crawl?.wiped;
  const look = crawlTheme(packId);
  const end = wiped ? look.wiped : look.won;
  // Seen once: `celebrate` is the table arriving here, never a reload.
  const [show, setShow] = useState(celebrate);
  if (celebrate && !show) setShow(true);
  const [shown, setShown] = useState(false);
  const kind: EndingKind = crawl
    ? league
      ? wiped
        ? "whiteout"
        : "hall"
      : wiped
        ? "wiped"
        : "survived"
    : "toast";
  return (
    <>
      {show && !shown && (
        <Suspense fallback={null}>
          <Ending
            kind={kind}
            record={record}
            packId={packId}
            count={count}
            title={end.title}
            onDone={() => setShown(true)}
          />
        </Suspense>
      )}
      <section
        className={`complete${record?.won ? ` hall-of-fame${league ? " painted-hall" : ""}` : ""}${crawl ? " crawl-end" : ""}${wiped ? " wiped" : ""}${celebrate ? " celebrate" : ""}`}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) onFinish();
        }}
      >
        {crawl && record ? (
          <>
            <CrawlIcon
              name={wiped ? "wiped" : "boss"}
              theme={look}
              className="crawl-end-mark"
            />
            <p className="hall-kicker">{mode}</p>
            <h1>
              {end.title[0]}
              <br />
              <em>{end.title[1]}</em>
            </h1>
            <p className="crawl-verdict">{end.verdict}</p>
            <CrawlRecord record={record} theme={look} />
          </>
        ) : record?.won ? (
          <>
            <p className="hall-kicker">{mode}</p>
            <h1>
              Hall of
              <br />
              <em>Fame.</em>
            </h1>
            <QuestRecord record={record} league={league} />
          </>
        ) : (
          <>
            <Artwork src={asset("art/side-quest-emblem.webp")} alt="" />
            <p className="hall-kicker">Side quest complete</p>
            <h1>
              To good
              <br />
              <em>company.</em>
            </h1>
          </>
        )}
        <p className="cards-played">
          {count} {count === 1 ? "card" : "cards"} played
        </p>
        <Button disabled={celebrate || starting} onClick={onReplay}>
          {starting ? "Dealing…" : "Play again"}
        </Button>
        <Button
          variant="text-button"
          disabled={celebrate || starting}
          onClick={onSetup}
        >
          Change deck
        </Button>
        {onUndo && (
          <Button
            variant="text-button"
            className="undo-end"
            disabled={celebrate || starting}
            onClick={onUndo}
          >
            Undo last move
          </Button>
        )}
      </section>
    </>
  );
}
