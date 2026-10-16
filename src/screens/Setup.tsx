import { useState } from "react";
import {
  MODE_LIMITS,
  type DeckChoice,
  type Preferences,
} from "../app/persistence";
import type { PackDefinition } from "../game/types";
import { Button, DeckChoices, Modal, PackTile } from "../components/UI";
import { PackLogo, ModeMark } from "../components/PackMarks";
import { asset } from "../presentation/theme";
import { CrawlIcon } from "../components/Crawl";

export function Setup({
  prefs,
  packs,
  onChange,
  onStart,
}: {
  prefs: Preferences;
  packs: PackDefinition[];
  onChange: (prefs: Preferences) => void;
  onStart: () => void;
}) {
  const [packsOpen, setPacksOpen] = useState(false);
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
  // A floor is a slot holding a stage of rooms (a run of several picks);
  // tonight's omen and Last Call are single cards.
  const crawlFloors =
    crawlPack?.quest!.finale.filter((slot) =>
      ("oneOf" in slot ? slot.oneOf.flat() : [slot]).some((st) => st.pick > 1),
    ).length ?? 0;
  const chooseLength = (choice: DeckChoice) => {
    const { quest: _quest, ...config } = prefs.config;
    onChange({ ...prefs, choice, config });
  };
  // A quest mode plays its own pack, plus whatever else is selected.
  const chooseQuest = (id: string) =>
    onChange({
      choice: "quest",
      config: {
        ...prefs.config,
        quest: id,
        packIds: packs
          .filter((p) => p.id === id || prefs.config.packIds.includes(p.id))
          .map((p) => p.id),
      },
    });
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
        <div className="section-label">
          <h2>How long?</h2>
        </div>
        <DeckChoices value={prefs.choice} onChange={chooseLength} />
        <div className="lengths quest-modes" role="group" aria-label="Modes">
          {packs
            .filter((pack) => pack.quest)
            .map((pack) => (
              <Button
                variant="choice"
                className="quest-mode"
                key={pack.id}
                aria-label={`${pack.quest!.mode}, ${pack.quest!.summary}`}
                aria-pressed={pack.id === questPack}
                onClick={() => chooseQuest(pack.id)}
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
            <h2>The crawl</h2>
          </div>
          <div
            className="crawl-brief"
            role="img"
            aria-label={`${crawlPack.title}: ${crawlPack.quest!.party!.hearts} shared hearts, ${crawlFloors} floors, a boss on each, and a new omen every run`}
          >
            <PackLogo pack={crawlPack} decorative />
            <span>
              <strong>{crawlPack.title}</strong>
              <small>
                <CrawlIcon name="heart" />
                {crawlPack.quest!.party!.hearts} hearts · {crawlFloors} floors
              </small>
            </span>
          </div>
        </div>
      )}
      {limit !== null && cardCount > 0 && cardCount < limit && (
        <p className="pack-hint" role="status">
          These packs have {cardCount} cards, so some will repeat.
        </p>
      )}
      <Button onClick={onStart} disabled={!selected.length}>
        Play
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
