import { CrawlIcon, SealLegend } from "./Crawl";
import { crawlTheme } from "./crawlTheme";

/** How to play, in a few lines (2026-10-17): every game's basics, and in a
 * crawl its goal, one row per mechanic and the seals on a card. Opened from
 * the pause menu, and from setup when a crawl mode is chosen. */
export function Guide({
  crawl,
}: {
  /** The crawl being played or chosen: its pack and its starting hearts. */
  crawl?: { packId: string; hearts: number };
}) {
  const theme = crawl && crawlTheme(crawl.packId);
  return (
    <div className="guide">
      {theme && (
        <>
          <p className="guide-goal">{theme.guide.goal}</p>
          <ul className="guide-rows">
            {theme.guide.rows(crawl).map((row) => (
              <li key={row.title}>
                <CrawlIcon name={row.icon} theme={theme} />
                <strong>{row.title}</strong>
                <span>{row.line}</span>
              </li>
            ))}
          </ul>
          <h3>The seals on a card</h3>
          <SealLegend theme={theme} />
          <h3>Every card</h3>
        </>
      )}
      <dl className="guide-basics">
        <div>
          <dt>Draw</dt>
          <dd>
            Tap the card to turn it over. Do what it says, then tap it again for
            the next one.
          </dd>
        </div>
        <div>
          <dt>Dice</dt>
          <dd>Tap a dice card to roll. The result is written on the card.</dd>
        </div>
        <div>
          <dt>Buttons</dt>
          <dd>When buttons rise at the card's foot, pick one to go on.</dd>
        </div>
        <div>
          <dt>Secrets</dt>
          <dd>Only the drawer looks: hold the button to read it.</dd>
        </div>
        <div>
          <dt>Missed one?</dt>
          <dd>The pause menu shows the previous card.</dd>
        </div>
      </dl>
    </div>
  );
}
