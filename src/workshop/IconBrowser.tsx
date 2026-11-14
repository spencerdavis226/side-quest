import { useEffect, useId, useMemo, useState } from "react";
import { Lattice } from "../components/CardImprint";
import { resolveImprint } from "../presentation/imprint";
import { normalizeIcon } from "../presentation/imprint/normalize";

/**
 * Dev-only browser for the vendored game-icons library (~4,180 icons). It is
 * the assignment workflow: search, look at the imprint on real parchment, copy
 * the slug into `src/content/imprint.ts`, then run `npm run imprint`.
 *
 * The glob below only exists in the dev server bundle — workshop code is
 * excluded from production by `scripts/check-budget.ts`.
 */
const iconModules = import.meta.glob("../../assets/icons/game-icons/**/*.svg", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const PREFIX = "../../assets/icons/game-icons/";
const slugs = Object.keys(iconModules)
  .map((path) => path.replace(PREFIX, "").replace(/\.svg$/, ""))
  .sort();

const THUMB_LIMIT = 120;

function IconThumb({ slug, selected }: { slug: string; selected: boolean }) {
  const [geometry, setGeometry] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void iconModules[`${PREFIX}${slug}.svg`]?.()
      .then((source) => live && setGeometry(normalizeIcon(slug, source)))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [slug]);
  return (
    <button
      type="button"
      className={`icon-tile ${selected ? "selected" : ""}`}
      title={slug}
      aria-pressed={selected}
      onClick={() =>
        navigator.clipboard?.writeText(slug).catch(() => undefined)
      }
    >
      {geometry ? (
        <svg
          viewBox="0 0 512 512"
          fill="currentColor"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: geometry }}
        />
      ) : null}
    </button>
  );
}

export function IconBrowser({ cardId }: { cardId: string }) {
  const [query, setQuery] = useState("");
  const [picked] = useState<string | null>(() => resolveImprint(cardId).icon);
  const imprint = useMemo(() => resolveImprint(cardId), [cardId]);
  const patternId = `browser-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [pickedGeometry, setPickedGeometry] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? slugs.filter((s) => s.includes(needle)) : slugs;
  }, [query]);

  useEffect(() => {
    if (!picked) {
      setPickedGeometry(null);
      return;
    }
    let live = true;
    void iconModules[`${PREFIX}${picked}.svg`]?.()
      .then(
        (source) => live && setPickedGeometry(normalizeIcon(picked, source)),
      )
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [picked]);

  const [ornamentGeometry, setOrnamentGeometry] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void iconModules[`${PREFIX}${imprint.ornament}.svg`]?.()
      .then(
        (source) =>
          live && setOrnamentGeometry(normalizeIcon(imprint.ornament, source)),
      )
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [imprint.ornament]);

  return (
    <div className="icon-browser">
      <div className="icon-browser-head">
        <label>
          Search {slugs.length} icons
          <input
            aria-label="Search icons"
            value={query}
            placeholder="lorc/beer"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <p>
          {filtered.length} matches · click a tile to copy its slug ·{" "}
          {picked ?? "none picked"}
        </p>
      </div>
      <div className="icon-browser-swatch">
        <div className="icon-swatch-paper">
          {pickedGeometry && ornamentGeometry && (
            <Lattice
              imprint={imprint}
              icon={pickedGeometry}
              ornament={ornamentGeometry}
              patternId={patternId}
              className="icon-swatch-lattice"
            />
          )}
        </div>
        <div className="icon-swatch-copy">
          <p>
            Selected: <code>{picked ?? "—"}</code>
          </p>
          <pre>{`"${cardId}": { icon: "${picked ?? "..."}" },`}</pre>
          <p>
            Paste into <code>src/content/imprint.ts</code>, then{" "}
            <code>npm run imprint</code>.
          </p>
        </div>
      </div>
      <div className="icon-grid">
        {filtered.slice(0, THUMB_LIMIT).map((slug) => (
          <IconThumb key={slug} slug={slug} selected={slug === picked} />
        ))}
      </div>
      {filtered.length > THUMB_LIMIT && (
        <p className="icon-grid-note">
          Showing the first {THUMB_LIMIT} matches — narrow the search to see
          more.
        </p>
      )}
    </div>
  );
}
