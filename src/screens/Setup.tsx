import { lazy, Suspense, useState, type ComponentType } from "react";
import {
  chooseLength,
  chooseQuest,
  MODE_LIMITS,
  type DeckChoice,
  type Preferences,
} from "../app/persistence";
import type { PackDefinition } from "../game/types";
import { questRoute, unlocks, type Chronicle } from "../game/engine";
import { Button, DeckChoices, Modal, PackTile } from "../components/UI";
import { PackLogo, ModeMark } from "../components/PackMarks";
import { asset } from "../presentation/theme";
import { CrawlIcon } from "../components/Crawl";
import { crawlTheme } from "../components/crawlTheme";
import { Guide } from "../components/Guide";

// The Chronicle (The Quest 2.0 Phase 7): a lazy chunk, opened from here.
type ChronicleProps = {
  chronicle: Chronicle;
  onUnlockAll: () => void;
};
const ChronicleBook = lazy(
  (): Promise<{ default: ComponentType<ChronicleProps> }> =>
    import("./Chronicle").catch(() => ({ default: NoChronicle })),
);
function NoChronicle() {
  return <p>The Chronicle couldn’t load. Check the connection.</p>;
}
/** The Quest's pack: its Chronicle, Heroic mode and gold mark. */
const QUEST_PACK = "dungeon";

export function Setup({
  prefs,
  packs,
  starting = false,
  onChange,
  onStart,
  chronicle,
  onUnlockAll = () => {},
}: {
  prefs: Preferences;
  packs: PackDefinition[];
  /** The deck's cards are on their way; Play waits for them. */
  starting?: boolean;
  onChange: (prefs: Preferences) => void;
  onStart: () => void;
  /** The Quest's record across runs (absent: none yet). */
  chronicle?: Chronicle;
  onUnlockAll?: () => void;
}) {
  const [packsOpen, setPacksOpen] = useState(false);
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const earned = chronicle ? unlocks(chronicle) : new Set<string>();
  const [guideOpen, setGuideOpen] = useState(false);
  const [crestFailed, setCrestFailed] = useState(false);
  const selected = packs.filter((pack) =>
    prefs.config.packIds.includes(pack.id),
  );
  const cardCount = new Set(
    selected.flatMap((pack) => [
      ...pack.cardIds,
      ...(pack.id === prefs.config.quest && prefs.choice === "quest"
        ? (pack.quest?.cardIds ?? [])
        : []),
    ]),
  ).size;
  const limit = MODE_LIMITS[prefs.choice];
  const questPack = prefs.choice === "quest" ? prefs.config.quest : undefined;
  // A crawl plays its own deck, so the pack picker steps aside.
  const crawlPack = packs.find((p) => p.id === questPack && p.quest?.party);
  const crawl = !!crawlPack;
  const crawlLook = crawlTheme(crawlPack?.id);
  const theQuest = crawlPack?.id === QUEST_PACK;
  // Heroic: two fewer hearts (The Quest 2.0 Phase 7).
  const heroic = theQuest && earned.has("heroic") && !!prefs.config.heroic;
  const setHeroic = (on: boolean) => {
    const { heroic: _was, ...config } = prefs.config;
    onChange({ ...prefs, config: on ? { ...config, heroic: true } : config });
  };
  // A floor is a slot holding a stage of rooms (a run of several picks);
  // tonight's omen and Last Call are single cards. The League counts gyms.
  const crawlFloors = !crawlPack
    ? 0
    : crawlLook.lengthOf
      ? crawlLook.lengthOf(questRoute(crawlPack.quest!, () => 0))
      : crawlPack.quest!.finale.filter((slot) =>
          ("oneOf" in slot
            ? slot.oneOf.flat()
            : "choose" in slot
              ? slot.choose.routes.flat()
              : [slot]
          ).some((st) => st.pick > 1),
        ).length;
  const hearts = crawlPack
    ? crawlPack.quest!.party!.hearts - (heroic ? 2 : 0)
    : 0;
  // Leaving a quest mode switches its pack off again if choosing it switched
  // the pack on (persistence.ts).
  const pickLength = (choice: DeckChoice) =>
    onChange(choice === "quest" ? prefs : chooseLength(prefs, choice));
  // A quest mode plays its own pack, plus whatever else is selected.
  const pickQuest = (id: string) => onChange(chooseQuest(prefs, id, packs));
  const toggle = (id: string) => {
    if (id === questPack) return;
    const next = new Set(prefs.config.packIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({
      ...prefs,
      config: {
        ...prefs.config,
        packIds: packs.filter((pack) => next.has(pack.id)).map((p) => p.id),
      },
    });
  };
  return (
    <section className="setup">
      <div className="intro">
        <h1>
          {crestFailed ? (
            <span className="crest-fallback">
              Side <em>Quest</em>
            </span>
          ) : (
            <img
              className="side-quest-title-crest"
              src={asset("art/side-quest-title-crest.webp")}
              width="768"
              height="276"
              alt="Side Quest"
              onError={() => setCrestFailed(true)}
            />
          )}
        </h1>
      </div>
      <div className="setup-section">
        {/* The one way into How to play before a game; in a game it is in
            the pause menu. It explains the mode chosen. */}
        <div className="section-label">
          <h2>How long?</h2>
          <button className="guide-link" onClick={() => setGuideOpen(true)}>
            How to play ›
          </button>
        </div>
        <DeckChoices value={prefs.choice} onChange={pickLength} />
        <div className="lengths quest-modes" role="group" aria-label="Modes">
          {packs
            .filter((pack) => pack.quest)
            .map((pack) => (
              <Button
                variant="choice"
                className={`quest-mode${
                  // The gold mark: the Dragon King slain.
                  pack.id === QUEST_PACK && earned.has("gold-mark")
                    ? " gold-mark"
                    : ""
                }`}
                key={pack.id}
                aria-label={`${pack.quest!.mode}, ${pack.quest!.summary}`}
                aria-pressed={pack.id === questPack}
                onClick={() => pickQuest(pack.id)}
              >
                {pack.quest!.mark ? (
                  <ModeMark src={pack.quest!.mark} />
                ) : (
                  <PackLogo pack={pack} decorative />
                )}
                <span>
                  <strong>{pack.quest!.mode}</strong>
                  <small>{pack.quest!.summary}</small>
                </span>
              </Button>
            ))}
        </div>
      </div>
      {!crawl && (
        <div className="setup-section setup-packs">
          <div className="section-label">
            <h2>Card packs</h2>
          </div>
          <Button
            variant="menu-row"
            className="pack-selector"
            aria-label={`Choose packs. ${
              selected.length
                ? `${selected.map((pack) => pack.title).join(", ")}, ${cardCount} cards`
                : "Pick at least one"
            }`}
            onClick={() => setPacksOpen(true)}
          >
            <span>
              <strong>Choose packs</strong>
              {/* Marks, not names: four pack titles never fit one phone row. */}
              <small className={selected.length > 5 ? "many" : undefined}>
                {selected.map((pack) => (
                  <PackLogo key={pack.id} pack={pack} decorative />
                ))}
                <span>
                  {selected.length ? `${cardCount} cards` : "Pick at least one"}
                </span>
              </small>
            </span>
            <span aria-hidden="true">›</span>
          </Button>
        </div>
      )}
      {crawlPack && (
        <div className="setup-section setup-packs">
          <div className="section-label">
            <h2>{crawlLook.words.setupTitle}</h2>
          </div>
          <div
            className="crawl-brief"
            role="img"
            aria-label={`${crawlPack.title}: ${crawlLook.words.setupBrief(hearts, crawlFloors)}`}
          >
            <PackLogo pack={crawlPack} decorative />
            <span>
              <strong>{crawlPack.title}</strong>
              <small>
                <CrawlIcon name="heart" theme={crawlLook} />
                {`${hearts} ${crawlLook.words.setupHearts} · ${crawlFloors} ${crawlLook.words.setupFloors}`}
              </small>
            </span>
          </div>
          {theQuest &&
            (earned.has("heroic") || (chronicle?.played ?? 0) > 0) && (
              <div className="quest-extras">
                {theQuest && earned.has("heroic") && (
                  <Button
                    variant="choice"
                    className="heroic-toggle"
                    aria-pressed={heroic}
                    onClick={() => setHeroic(!heroic)}
                  >
                    <span>
                      <strong>Heroic</strong>
                      <small>Harder road</small>
                    </span>
                  </Button>
                )}
                {theQuest && chronicle && chronicle.played > 0 && (
                  <Button
                    variant="menu-row"
                    className="chronicle-open"
                    onClick={() => setChronicleOpen(true)}
                  >
                    <span>
                      <strong>Chronicle</strong>
                      <small>
                        {`${chronicle.played} ${chronicle.played === 1 ? "run" : "runs"} · ${chronicle.won} won`}
                      </small>
                    </span>
                    <span aria-hidden="true">›</span>
                  </Button>
                )}
              </div>
            )}
        </div>
      )}
      {chronicleOpen && chronicle && (
        <Modal title="Chronicle" onClose={() => setChronicleOpen(false)}>
          <Suspense fallback={<p className="chronicle-loading">Opening…</p>}>
            <ChronicleBook chronicle={chronicle} onUnlockAll={onUnlockAll} />
          </Suspense>
          <Button onClick={() => setChronicleOpen(false)}>Done</Button>
        </Modal>
      )}
      {guideOpen && (
        <Modal title="How to play" onClose={() => setGuideOpen(false)}>
          <Guide
            crawl={
              crawlPack && {
                packId: crawlPack.id,
                hearts: crawlPack.quest!.party!.hearts,
              }
            }
          />
        </Modal>
      )}
      {limit !== null && cardCount > 0 && cardCount < limit && (
        <p className="pack-hint" role="status">
          These packs have {cardCount} cards, so some will repeat.
        </p>
      )}
      <Button onClick={onStart} disabled={!selected.length || starting}>
        {starting ? "Dealing…" : "Play"}
      </Button>
      {packsOpen && (
        <Modal title="Card packs" onClose={() => setPacksOpen(false)}>
          <div className="addon-list">
            {packs.map((pack) => (
              <PackTile
                key={pack.id}
                pack={pack}
                selected={selected.includes(pack)}
                locked={pack.id === questPack}
                onToggle={() => toggle(pack.id)}
              />
            ))}
          </div>
          <Button onClick={() => setPacksOpen(false)}>Done</Button>
        </Modal>
      )}
    </section>
  );
}
