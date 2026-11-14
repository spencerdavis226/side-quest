import { useEffect, useState } from "react";
import {
  CLASS_COUNT,
  ECHO_COUNT,
  FEATS,
  LANDMARK_COUNT,
  NINE,
  RARE_COUNT,
  SECRET_COUNT,
  UNLOCKS,
  unlocks,
  type Chronicle,
} from "../game/engine";
import { loadPackCards } from "../content/loaders";
import { Button } from "../components/UI";
import "./chronicle.css";

// The Chronicle (The Quest 2.0 Phase 7): The Quest's record across runs.
// A lazy chunk, opened from setup. It only reads; the one thing it changes
// is the "Unlock everything" switch, for a table whose record was lost.
export default function ChronicleBook({
  chronicle: c,
  onUnlockAll,
}: {
  chronicle: Chronicle;
  onUnlockAll: () => void;
}) {
  // Dragon names come with the pack's cards; until then, a plain word.
  const [titles, setTitles] = useState<Record<string, string>>({});
  useEffect(() => {
    let live = true;
    loadPackCards(["dungeon"])
      .then((cards) => {
        if (live)
          setTitles(
            Object.fromEntries(cards.map((card) => [card.id, card.title])),
          );
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  const [confirm, setConfirm] = useState(false);
  const earned = unlocks(c);
  const name = (id: string) => titles[id] ?? "A dragon";
  const seals = (counts: Record<string, number>, label: string) => (
    <ul className="chronicle-seals" aria-label={label}>
      {NINE.map((id) => {
        const n = counts[id] ?? 0;
        return (
          <li key={id} className={n ? "slain" : undefined}>
            <span className="seal" aria-hidden="true" />
            <span>{n ? name(id) : "?"}</span>
            {n > 1 && <small>×{n}</small>}
          </li>
        );
      })}
    </ul>
  );
  const counts: [string, number, number?][] = [
    ["Classes won with", c.classesWon.length, CLASS_COUNT],
    ["Allies met", c.allies.length],
    ["Allies lost", c.alliesLost.length],
    ["Rare things seen", c.rares.length, RARE_COUNT],
    ["Landmarks seen", c.landmarks.length, LANDMARK_COUNT],
    ["Echoes heard", c.echoes.length, ECHO_COUNT],
    ["Hidden results", c.secrets.length, SECRET_COUNT],
  ];
  const fell = Object.entries(c.fellTo).filter(([, n]) => n > 0);
  return (
    <div className="chronicle">
      <p className="chronicle-tally">
        <span>
          <strong>{c.played}</strong> {c.played === 1 ? "run" : "runs"}
        </span>
        <span>
          <strong>{c.won}</strong> won
        </span>
        {earned.has("heroic") && (
          <span>
            <strong>{c.heroicWon}</strong> heroic
          </span>
        )}
      </p>
      <h3>Dragons slain</h3>
      {seals(c.slain, "Dragons slain")}
      {earned.has("heroic") && (
        <>
          <h3>Slain on Heroic</h3>
          {seals(c.heroicSlain, "Dragons slain on Heroic")}
        </>
      )}
      {fell.length > 0 && (
        <p className="chronicle-fell">
          {"Fell to "}
          {fell
            .map(([id, n]) => `${name(id)}${n > 1 ? ` ×${n}` : ""}`)
            .join(", ")}
        </p>
      )}
      <h3>Found</h3>
      <dl className="chronicle-counts">
        {counts.map(([label, n, of]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{of ? `${Math.min(n, of)} of ${of}` : n}</dd>
          </div>
        ))}
      </dl>
      <h3>Feats</h3>
      <ul className="chronicle-feats">
        {FEATS.map((f) => {
          const done = c.feats.includes(f.key);
          return (
            <li key={f.key} className={done ? "done" : undefined}>
              <strong>{done ? f.name : "?"}</strong>
              <small>{f.line}</small>
            </li>
          );
        })}
      </ul>
      <h3>Unlocks</h3>
      <ul className="chronicle-unlocks">
        {UNLOCKS.map((u) => {
          const open = earned.has(u.key);
          return (
            <li key={u.key} className={open ? "open" : undefined}>
              <strong>{open ? u.name : "?"}</strong>
              <small>{open ? u.adds : u.earn}</small>
            </li>
          );
        })}
      </ul>
      {c.ballads.length > 0 && (
        <>
          <h3>Ballads</h3>
          <ol className="chronicle-ballads">
            {[...c.ballads].reverse().map((b, i) => (
              <li key={`${b.at}-${i}`}>
                <small>
                  {`${new Date(b.at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })} · ${b.won ? "Won" : "Fell"}`}
                </small>
                <p>
                  {b.lines.map((line, j) => (
                    <span key={j}>{line}</span>
                  ))}
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
      {earned.size < UNLOCKS.length &&
        (confirm ? (
          <div className="chronicle-unlock-all" role="group">
            <p>Unlock everything? The counts stay as they are.</p>
            <Button
              variant="text-button"
              onClick={() => {
                onUnlockAll();
                setConfirm(false);
              }}
            >
              Unlock everything
            </Button>
            <Button variant="text-button" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <button
            className="chronicle-unlock-all-link"
            onClick={() => setConfirm(true)}
          >
            Lost your record? Unlock everything
          </button>
        ))}
    </div>
  );
}
