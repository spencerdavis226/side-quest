import type { CSSProperties } from "react";
import type { PackDefinition } from "../game/types";
import { asset } from "../presentation/theme";
import { cardPacks } from "../presentation/packs";

/** A quest mode's own mark (`quest.mark`), separate from its pack's. */
export function ModeMark({ src = "art/packs/league.svg" }: { src?: string }) {
  const mark = asset(src);
  return (
    <span
      className="league-mark mode-mark"
      aria-hidden="true"
      style={{ maskImage: `url("${mark}")`, WebkitMaskImage: `url("${mark}")` }}
    />
  );
}

/** A pack's mark is one single-colour silhouette (`pack.logo`). It is painted
 * as a CSS mask, so every pack takes the same finish wherever it appears:
 * gilded on setup tiles and the pause legend, debossed in a card footer. */
export function PackLogo({
  pack,
  decorative = false,
  variant = "standard",
}: {
  pack: PackDefinition;
  decorative?: boolean;
  variant?: "standard" | "watermark";
}) {
  const mark = pack.logo ? asset(pack.logo) : undefined;
  return (
    <span
      className={`pack-logo ${variant === "watermark" ? "pack-logo-watermark" : ""}`}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : pack.title}
      title={pack.title}
      data-seal={mark}
    >
      {mark ? (
        <span
          className={
            variant === "watermark" ? "pack-logo-seal" : "pack-logo-gilt"
          }
          aria-hidden="true"
          style={{ "--pack-seal": `url("${mark}")` } as CSSProperties}
        />
      ) : (
        <span className="pack-logo-fallback" aria-hidden="true">
          {pack.title.slice(0, 1)}
        </span>
      )}
    </span>
  );
}
export function CardPackMarks({
  cardId,
  packIds,
}: {
  cardId: string;
  packIds?: readonly string[];
}) {
  return (
    <span className="card-pack-marks">
      {cardPacks(cardId, packIds).map((pack) => (
        <PackLogo key={pack.id} pack={pack} variant="watermark" decorative />
      ))}
    </span>
  );
}
