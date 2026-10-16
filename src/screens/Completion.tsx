import { Button, Artwork } from "../components/UI";
import { asset } from "../presentation/theme";
import { QuestRecord } from "../components/QuestRecord";
import { CrawlIcon, CrawlRecord } from "../components/Crawl";
import { crawlTheme } from "../components/crawlTheme";
import type { questRecord } from "../game/engine";
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
  onReplay,
  onSetup,
  onFinish,
}: {
  count: number;
  record: ReturnType<typeof questRecord>;
  /** The quest mode's name, e.g. "Pokémon League". */
  mode?: string;
  league?: boolean;
  /** The quest's pack: a crawl's words and marks. */
  packId?: string;
  celebrate: boolean;
  onReplay: () => void;
  onSetup: () => void;
  onFinish: () => void;
}) {
  const crawl = record?.party;
  const wiped = !!crawl?.wiped;
  const look = crawlTheme(packId);
  const end = wiped ? look.wiped : look.won;
  return (
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
      <Button disabled={celebrate} onClick={onReplay}>
        Play again
      </Button>
      <Button variant="text-button" disabled={celebrate} onClick={onSetup}>
        Change deck
      </Button>
    </section>
  );
}
