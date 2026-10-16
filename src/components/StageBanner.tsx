import { useEffect, useRef, useState } from "react";
import type { SessionState } from "../game/types";
import { finaleStage, omenForm, questStages } from "../game/engine";
import { crawlTheme } from "./crawlTheme";
import { packs } from "../content/manifest.generated";
import { stageArt } from "../presentation/league-art";

/** The banner that sweeps across the table as each finale stage begins (the
 * Legendary, the Elite Four, the Champion; a crawl's floors and bosses):
 * shown while the stage's first card is dealt face down, once per stage. It never takes a tap; the card
 * underneath stays playable. */
export function StageBanner({ session }: { session: SessionState }) {
  const quest = session.quest;
  if (!quest?.due || session.phase !== "hidden") return null;
  const stage = finaleStage(quest);
  if (stage.index !== 0) return null;
  // Once per stage: not again when a boss is dealt for another swing or a
  // lost Champion is replaced.
  const pool = quest.stages[stage.stage].cards;
  if (pool.some((c) => c.id === session.previousId)) return null;
  const rules = packs.find((p) => p.id === quest.packId)?.quest;
  const intro =
    (rules && questStages(rules).find((s) => s.label === stage.label)?.intro) ??
    stage.label;
  // The banner takes the stage's ribbon finish (pearl, violet, crimson).
  const tone = quest.stages[stage.stage].cards[0]?.ribbonTone ?? "gold";
  const banner = quest.packId === "pokemon" ? stageArt(tone) : undefined;
  return (
    <div
      // Keyed by stage so a new stage replays the sweep.
      key={stage.stage}
      className={`stage-banner banner-${tone}`}
      role="status"
    >
      <div className={`stage-banner-cloth${banner ? " painted-banner" : ""}`}>
        {banner && <img className="stage-banner-art" src={banner} alt="" />}
        <small>{rules?.mode}</small>
        <strong>{intro}</strong>
      </div>
    </div>
  );
}

/** The banner when the starter evolves mid-run: "What? Charmander is
 * evolving!" over its new form's name. Shown once per evolution, never on a
 * resumed game; it sits high so a stage banner below it stays readable. */
export function EvolutionBanner({ session }: { session: SessionState }) {
  const quest = session.quest;
  const form = quest?.party?.form ?? 0;
  const seen = useRef(form);
  const [shown, setShown] = useState<{ from: string; to: string } | null>(
    null,
  );
  useEffect(() => {
    if (form > seen.current) {
      const now = omenForm(quest);
      // A branching starter (Eevee) evolves straight from its base form.
      const from =
        form === 1 || now?.card.branches
          ? now?.card.title
          : now?.card.evolves?.[form - 2]?.title;
      if (now && from) setShown({ from, to: now.title });
    }
    seen.current = form;
  }, [form, quest]);
  const evolving = crawlTheme(quest?.packId).words.evolving;
  if (!shown || !evolving) return null;
  return (
    <div
      key={shown.to}
      className="stage-banner banner-pearl evolution-banner"
      role="status"
    >
      <div className="stage-banner-cloth">
        <small>{evolving(shown.from)}</small>
        <strong>{shown.to}</strong>
      </div>
    </div>
  );
}
