import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { questRecord } from "../../game/engine";
import { badgeArt } from "../../presentation/league-art";
import { badgeType, pokemonTypes } from "../../presentation/pokemon-types";
import { asset } from "../../presentation/theme";
import { stillMotion } from "../../presentation/motion";
import { TypeMark, earnedBadges } from "../LeagueMarks";
import { burst, clearParticles, fireworks } from "./particles";

// The end of a game, played once over the end screen (2026-11-01, owner:
// "premium ... eye candy"): the Hall of Fame, Pub Crawl's last call
// survived, the League's whiteout, Pub Crawl's wipe, and a toast for a plain
// game. Only on an ending the table just reached (`celebrate`), never on a
// reload of the end screen; a tap skips to the record. Display only; the
// record underneath says everything this does.

type RunRecord = NonNullable<ReturnType<typeof questRecord>>;
export type EndingKind = "hall" | "survived" | "whiteout" | "wiped" | "toast";

const LENGTH: Record<EndingKind, number> = {
  hall: 6800,
  survived: 5200,
  whiteout: 4400,
  wiped: 4400,
  toast: 2800,
};

export default function Ending({
  kind,
  record,
  packId,
  count,
  title,
  onDone,
}: {
  kind: EndingKind;
  record: RunRecord | null;
  packId?: string;
  count: number;
  /** The end screen's own title, two lines. */
  title: [string, string];
  onDone: () => void;
}) {
  const done = useRef(onDone);
  done.current = onDone;
  const [still] = useState(stillMotion);
  useEffect(() => {
    if (still) {
      done.current();
      return;
    }
    const id = setTimeout(() => done.current(), LENGTH[kind]);
    return () => {
      clearTimeout(id);
      clearParticles();
    };
  }, [kind, still]);
  if (still) return null;
  const skip = (event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const swallow = (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
    };
    window.addEventListener("click", swallow, { capture: true, once: true });
    setTimeout(
      () => window.removeEventListener("click", swallow, { capture: true }),
      700,
    );
    clearParticles();
    done.current();
  };
  return createPortal(
    <div
      className={`moment moment-ending ending-${kind}`}
      aria-hidden="true"
      onPointerDown={skip}
    >
      {kind === "hall" && record && (
        <Hall record={record} packId={packId ?? ""} count={count} />
      )}
      {kind === "survived" && record && (
        <Survived record={record} title={title} />
      )}
      {kind === "whiteout" && <Whiteout record={record} title={title} />}
      {kind === "wiped" && <Wiped title={title} />}
      {kind === "toast" && <Toast />}
    </div>,
    document.body,
  );
}

function useSteps(steps: [number, () => void][]) {
  const ref = useRef(steps);
  useEffect(() => {
    const ids = ref.current.map(([at, fn]) => setTimeout(fn, at));
    return () => ids.forEach(clearTimeout);
  }, []);
}

/** A number counting up from 0 to `to`, from `at` ms over `over` ms. */
function Count({
  to,
  at,
  over = 700,
}: {
  to: number;
  at: number;
  over?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    let frame = 0;
    const start = performance.now() + at;
    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / over));
      const e = 1 - Math.pow(1 - t, 3);
      if (ref.current) ref.current.textContent = String(Math.round(to * e));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [to, at, over]);
  return <b ref={ref}>0</b>;
}

/** The League won: the starter on a plinth of light, its team beside it,
 * the badges dropping into a case one by one, the run's numbers counting
 * up, fireworks, and "Hall of Fame" set in gold. */
function Hall({
  record,
  packId,
  count,
}: {
  record: RunRecord;
  packId: string;
  count: number;
}) {
  const form = record.form;
  const type = form?.type ?? "normal";
  const badges = earnedBadges(record, packId);
  const team = record.party?.team?.length ?? 0;
  const bosses = record.stages
    .filter((s) => s.boss)
    .reduce((n, s) => n + s.cards.length, 0);
  const plinth = useRef<HTMLDivElement>(null);
  useSteps([
    [
      700,
      () => {
        const r = plinth.current?.getBoundingClientRect();
        if (r)
          burst("sparks", {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2,
            count: 80,
            colors: [pokemonTypes[type].light, "#ffffff", "#fff3c8"],
          });
      },
    ],
    ...badges.map(
      (_, i) =>
        [
          1500 + i * 150,
          () => {
            const el = document.querySelector(
              `.hall-badge:nth-child(${i + 1})`,
            );
            const r = el?.getBoundingClientRect();
            if (r)
              burst("sparks", {
                x: r.left + r.width / 2,
                y: r.top + r.height / 2,
                count: 10,
                power: 0.25,
              });
          },
        ] as [number, () => void],
    ),
    [
      3100,
      () => {
        // Off to the sides: the starter's name stands in the middle.
        fireworks(7, undefined, true);
      },
    ],
    [
      3300,
      () =>
        burst("confetti", {
          y: window.innerHeight * 0.3,
          count: 90,
          power: 1.1,
        }),
    ],
  ]);
  const stats: [string, number][] = [
    ["Cards played", count],
    ["Badges", record.badges.earned],
    ["Bosses beaten", bosses],
    ["Team HP left", record.party?.hearts ?? 0],
    ...(team ? ([["Caught", team]] as [string, number][]) : []),
  ];
  return (
    <>
      <span className="ending-whitein" />
      <span
        className="hall-light"
        style={{ "--c": pokemonTypes[type].light } as CSSProperties}
      />
      <p className="hall-title">
        <small>Pokémon League</small>
        <strong>Hall of Fame</strong>
      </p>
      <div className="hall-plinth" ref={plinth}>
        <TypeMark type={type} />
        <strong>{form?.title ?? "Champion"}</strong>
      </div>
      <ol className="hall-badges">
        {badges.map((card, i) => {
          const art = badgeArt(card.id);
          return (
            <li
              key={card.id}
              className="hall-badge"
              style={{ "--i": i } as CSSProperties}
            >
              {art ? (
                <img src={art} alt="" />
              ) : (
                <TypeMark type={badgeType(card)} />
              )}
            </li>
          );
        })}
      </ol>
      <dl className="ending-stats">
        {stats.map(([label, n], i) => (
          <div key={label} style={{ "--i": i } as CSSProperties}>
            <dt>{label}</dt>
            <dd>
              <Count to={n} at={2700 + i * 180} />
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}

/** Pub Crawl survived: gold pours down, the bosses felled drop onto the
 * trophy shelf one by one, and the end screen's words set in gilt. */
function Survived({
  record,
  title,
}: {
  record: RunRecord;
  title: [string, string];
}) {
  const trophies = record.stages
    .filter((s) => s.trophy)
    .flatMap((s) => s.cards);
  useSteps([
    [
      200,
      () =>
        burst("coins", {
          count: 60,
          colors: ["#f2c94c", "#d9a336", "#ffe9a8"],
        }),
    ],
    [
      900,
      () =>
        burst("coins", {
          count: 50,
          colors: ["#f2c94c", "#d9a336", "#ffe9a8"],
        }),
    ],
    ...trophies.map(
      (_, i) =>
        [
          1500 + i * 280,
          () => {
            const el = document.querySelector(
              `.ending-trophy:nth-child(${i + 1})`,
            );
            const r = el?.getBoundingClientRect();
            if (r)
              burst("dust", {
                x: r.left + r.width / 2,
                y: r.bottom,
                count: 10,
                colors: ["#8a7558", "#6b5a44"],
                angle: -Math.PI / 2,
                spread: 2.6,
                power: 0.3,
              });
          },
        ] as [number, () => void],
    ),
    [
      2600,
      () =>
        fireworks(
          4,
          [
            ["#ffe9a8", "#f2c94c"],
            ["#ffd27a", "#ff9a3a"],
          ],
          true,
        ),
    ],
  ]);
  return (
    <>
      <span className="ending-gold" />
      <p className="ending-words">
        <strong>{title[0]}</strong>
        <em>{title[1]}</em>
      </p>
      <ol className="ending-trophies">
        {trophies.map((card, i) => (
          <li
            key={card.id}
            className="ending-trophy"
            style={{ "--i": i } as CSSProperties}
          >
            <span>{card.title}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

/** The League lost: Team HP drains to nothing and the screen whites out,
 * slowly, as the old games did. */
function Whiteout({
  record,
  title,
}: {
  record: RunRecord | null;
  title: [string, string];
}) {
  const max = record?.party?.max ?? 1;
  return (
    <>
      <span className="whiteout-dark" />
      <div className="whiteout-hp">
        <small>Team HP</small>
        <span className="whiteout-bar">
          <i
            style={
              {
                "--from": `${Math.round((100 * Math.min(max, 3)) / max)}%`,
              } as CSSProperties
            }
          />
        </span>
      </div>
      <span className="whiteout-white" />
      <p className="whiteout-words">
        <strong>{title[0]}</strong> <em>{title[1]}</em>
      </p>
    </>
  );
}

/** Pub Crawl lost: the candles gutter one by one, the dark closes in, and
 * the words settle. */
function Wiped({ title }: { title: [string, string] }) {
  useSteps([
    [
      1700,
      () =>
        burst("embers", {
          y: window.innerHeight * 0.62,
          count: 30,
          colors: ["#ff7a1a", "#8a2a0a"],
        }),
    ],
  ]);
  return (
    <>
      <span className="wiped-dark" />
      <div className="wiped-candles">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="wiped-candle"
            style={{ "--i": i } as CSSProperties}
          >
            <i />
          </span>
        ))}
      </div>
      <p className="ending-words wiped-words">
        <strong>{title[0]}</strong>
        <em>{title[1]}</em>
      </p>
    </>
  );
}

/** A plain game: the tankards swing in, clink, and the foam flies. */
function Toast() {
  useSteps([
    [
      620,
      () =>
        burst("confetti", {
          y: window.innerHeight * 0.42,
          count: 50,
          power: 0.7,
          colors: ["#fff8e8", "#f4e6c4", "#ffffff"],
          angle: -Math.PI / 2,
          spread: Math.PI,
        }),
    ],
    [640, () => burst("sparks", { y: window.innerHeight * 0.42, count: 40 })],
  ]);
  const src = asset("art/tankard.webp");
  return (
    <>
      <span className="toast-shade" />
      <img className="toast-mug" src={src} alt="" />
      <p className="toast-words">Cheers!</p>
    </>
  );
}
