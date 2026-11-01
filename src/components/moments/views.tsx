import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { Moment } from "./detect";
import {
  burst,
  clearParticles,
  type Preset,
  type BurstOptions,
} from "./particles";
import { flyTo, flyTarget } from "./fly";
import { reducedMotion } from "../../presentation/motion";
import {
  pokemonTypes,
  type PokemonType,
} from "../../presentation/pokemon-types";
import { asset } from "../../presentation/theme";
import { TypeMark } from "../LeagueMarks";
import { CrawlIcon } from "../Crawl";
import { crawlTheme } from "../crawlTheme";

// The moments themselves (2026-11-01; styles in `presentation/moments.css`).
// A lazy chunk: the director (`Director.tsx`) loads it when a game starts.
// Each view is one choreographed beat over the table: its CSS carries the
// motion, a timeline here fires the particles and the fly-ins, and the
// stage ends it (or a tap does). Reduced Motion shows a still caption that
// fades instead. Every view is `aria-hidden`; the director reads its words.

type Props = {
  moment: Moment;
  scale: number;
  onDone: () => void;
  /** Moments queued behind this one (a still plaque shortens for them). */
  waiting?: number;
};

/** Each moment's length at full speed, in ms. */
const LENGTH: Record<Moment["kind"], number> = {
  natural: 1700,
  evolution: 5400,
  entrance: 2700,
  clash: 1600,
  sendin: 1350,
  omen: 2600,
  badge: 2100,
  loot: 1500,
  milestone: 2400,
  faint: 3000,
  join: 2900,
  jinx: 3600,
  doubles: 1300,
  door: 2600,
  press: 1300,
  thread: 2100,
};
/** A lifted jinx reads less than a laid one: only its name burns away. */
const LIFTED = 2000;

export default function MomentView({
  moment,
  scale,
  onDone,
  waiting = 0,
}: Props) {
  const [still] = useState(reducedMotion);
  if (still)
    return <Still moment={moment} onDone={onDone} hurry={waiting > 0} />;
  switch (moment.kind) {
    case "natural":
      return <Natural m={moment} scale={scale} onDone={onDone} />;
    case "evolution":
      return moment.league ? (
        <Evolution m={moment} scale={scale} onDone={onDone} />
      ) : (
        <LevelUp m={moment} scale={scale} onDone={onDone} />
      );
    case "entrance":
      return <Entrance m={moment} scale={scale} onDone={onDone} />;
    case "clash":
      return <Clash m={moment} scale={scale} onDone={onDone} />;
    case "sendin":
      return <SendIn m={moment} scale={scale} onDone={onDone} />;
    case "omen":
      return <Omen m={moment} scale={scale} onDone={onDone} />;
    case "badge":
      return <Badge m={moment} scale={scale} onDone={onDone} />;
    case "loot":
      return <LootFound m={moment} scale={scale} onDone={onDone} />;
    case "milestone":
      return <Milestone m={moment} scale={scale} onDone={onDone} />;
    case "faint":
      return <Faint m={moment} scale={scale} onDone={onDone} />;
    case "join":
      return <Join m={moment} scale={scale} onDone={onDone} />;
    case "doubles":
      return <Doubles m={moment} scale={scale} onDone={onDone} />;
    case "door":
      return <Door m={moment} scale={scale} onDone={onDone} />;
    case "press":
      return <Press m={moment} scale={scale} onDone={onDone} />;
    case "thread":
      return <Thread m={moment} scale={scale} onDone={onDone} />;
    case "jinx":
      return moment.lifted ? (
        <JinxLifted m={moment} scale={scale} onDone={onDone} />
      ) : (
        <JinxLaid m={moment} scale={scale} onDone={onDone} />
      );
  }
}

type Of<K extends Moment["kind"]> = Extract<Moment, { kind: K }>;
type ViewProps<K extends Moment["kind"]> = {
  m: Of<K>;
  scale: number;
  onDone: () => void;
};

/** A type's colours as CSS variables, `--<name>` and `--<name>-deep`. */
function typeVars(name: string, type?: PokemonType, fallback = "normal") {
  const t = pokemonTypes[(type ?? fallback) as PokemonType];
  return { [`--${name}`]: t.light, [`--${name}-deep`]: t.deep };
}

/** Run each `[ms, fn]` once, at its time scaled; a skip cancels the rest. */
function useTimeline(steps: [number, () => void][], scale: number) {
  const ref = useRef(steps);
  useEffect(() => {
    const ids = ref.current.map(([at, fn]) => setTimeout(fn, at * scale));
    return () => ids.forEach(clearTimeout);
  }, [scale]);
}

/** Particles centred on an element (or the screen's middle). */
function at(
  el: Element | null | undefined,
  preset: Preset,
  o: BurstOptions = {},
) {
  const r = el?.getBoundingClientRect();
  burst(preset, {
    ...(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : {}),
    ...o,
  });
}

/** The click that follows a skipping tap must not land on whatever is
 * under the stage: swallowed once, for a moment. Returns the remover. */
function swallowClick() {
  const swallow = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
  };
  const stop = () =>
    window.removeEventListener("click", swallow, { capture: true });
  window.addEventListener("click", swallow, { capture: true, once: true });
  setTimeout(stop, 700);
  return stop;
}

/** The full-screen stage every moment plays on: it ends itself after
 * `length` (scaled), and a tap skips it without the tap reaching the card
 * underneath. An ambient stage takes no taps at all. With `passTo`, a tap
 * that lands on that element (the card a boss entrance stands over) skips
 * the moment and then taps it, once, as the table meant: the stage hides on
 * the press and goes on the lift, so the press and the lift are both its. */
function Stage({
  kind,
  className = "",
  length,
  scale,
  onDone,
  ambient = false,
  passTo,
  style,
  children,
}: {
  kind: string;
  className?: string;
  length: number;
  scale: number;
  onDone: () => void;
  ambient?: boolean;
  passTo?: string;
  style?: Record<string, string | number>;
  children: ReactNode;
}) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  // Once only: a late timer must never end the moment after this one.
  const ended = useRef(false);
  const done = useRef(() => {
    if (ended.current) return;
    ended.current = true;
    onDoneRef.current();
  });
  const [skipping, setSkipping] = useState(false);
  const pressed = useRef(false);
  useEffect(() => {
    const id = setTimeout(() => done.current(), length * scale);
    return () => clearTimeout(id);
  }, [length, scale]);
  const skip = (event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    clearParticles();
    if (passTo) {
      pressed.current = true;
      setSkipping(true);
      // A press whose lift never arrives still ends the moment.
      setTimeout(() => done.current(), 1500);
      return;
    }
    swallowClick();
    done.current();
  };
  const lift = (event: React.PointerEvent, cancelled = false) => {
    if (!pressed.current) return;
    pressed.current = false;
    event.stopPropagation();
    event.preventDefault();
    const stop = swallowClick();
    const target = passTo ? document.querySelector<HTMLElement>(passTo) : null;
    const r = target?.getBoundingClientRect();
    const over =
      !cancelled &&
      !!r &&
      event.clientX >= r.left &&
      event.clientX <= r.right &&
      event.clientY >= r.top &&
      event.clientY <= r.bottom;
    done.current();
    if (over && target)
      // After this lift's own click (swallowed above) has gone by.
      setTimeout(() => {
        stop();
        target.click();
      }, 0);
  };
  return createPortal(
    <div
      className={`moment moment-${kind} ${ambient ? "ambient" : ""} ${skipping ? "skipping" : ""} ${className}`}
      style={{ "--m": scale, ...style } as CSSProperties}
      aria-hidden="true"
      onPointerDown={ambient ? undefined : skip}
      onPointerUp={ambient ? undefined : (e) => lift(e)}
      onPointerCancel={ambient ? undefined : (e) => lift(e, true)}
    >
      {children}
    </div>,
    document.body,
  );
}

/** Reduced Motion: the moment's words on a plaque that fades in and out,
 * nothing moving. */
function Still({
  moment,
  onDone,
  hurry,
}: {
  moment: Moment;
  onDone: () => void;
  /** Another plaque waits: this one reads quicker, so a run of them (a
   * boss's badge, its spoils, the next boss) never holds the table long. */
  hurry: boolean;
}) {
  const [kicker, title, line] = caption(moment);
  const [length] = useState(() => (hurry ? 1300 : line ? 2600 : 1600));
  // Nothing worth a plaque (a clash, a natural the card already shows).
  useEffect(() => {
    if (!title) onDone();
  }, [title, onDone]);
  if (!title) return null;
  return (
    <Stage
      kind="still"
      length={length}
      scale={1}
      onDone={onDone}
      ambient
      style={{ "--still": `${length}ms` }}
    >
      <div className="still-plaque">
        {kicker && <small>{kicker}</small>}
        <strong>{title}</strong>
        {line && <span>{line}</span>}
      </div>
    </Stage>
  );
}
/** A moment's words for the still plaque: kicker, title, line. */
function caption(m: Moment): [string, string, string] {
  switch (m.kind) {
    case "evolution":
      return [m.kicker, m.to, m.change];
    case "entrance":
      return [m.kicker, m.title, ""];
    case "badge":
      return ["Badge earned", m.name, `${m.earned} of ${m.of}`];
    case "loot":
      return [m.kicker, m.name, m.rules ?? ""];
    case "milestone":
      return [m.kicker, m.title, m.line];
    case "sendin":
      return ["", `Go, ${m.name}!`, ""];
    case "faint":
      return ["Fainted", m.name, m.line];
    case "door":
      return [m.kicker, m.title, m.wanted ?? ""];
    case "thread":
      return ["", "By a thread", m.line];
    case "press":
      return m.bust
        ? ["", "Bust!", "The prizes are gone."]
        : ["", "Let it ride!", `${m.banked} banked`];
    case "join":
      return [m.hatched ? "Hatched" : "Caught", m.name, "Joined the team."];
    case "jinx":
      return m.lifted ? [m.kicker, m.rule, m.name] : [m.kicker, m.name, m.rule];
    default:
      return ["", "", ""];
  }
}

/* --- Natural 20 and 1 (moved here from Flourish.tsx, 2026-11-01) --------- */

/** The cracks a natural 1 splits the screen with, in a 100 x 100 box
 * centred on the number (50, 49): jagged lines run out to every edge. */
const CRACKS = [
  "M50 49 L46 41 L48 34 L42 25 L44 16 L37 0",
  "M50 49 L57 43 L62 44 L68 35 L77 32 L84 21 L100 13",
  "M50 49 L58 52 L66 50 L74 56 L86 55 L100 62",
  "M50 49 L55 58 L53 66 L60 75 L58 87 L64 105",
  "M50 49 L44 57 L38 58 L34 68 L26 75 L22 89 L12 105",
  "M50 49 L41 50 L33 45 L24 48 L14 42 L0 45",
  "M50 49 L43 45 L37 36 L28 33 L20 22 L8 17 L0 9",
  "M62 44 L66 51",
  "M53 66 L47 71 L44 79",
  "M33 45 L31 38 L24 35",
  "M74 56 L77 65 L84 70",
];

/** Gold rays and a stamped 20; for a 1 the table cracks like glass, the
 * screen shakes and the 1 splits in two and falls. */
function Natural({ m, scale, onDone }: ViewProps<"natural">) {
  const crit = m.nat === 20;
  const word = useRef<HTMLElement>(null);
  useTimeline(
    crit
      ? [
          [260, () => at(word.current, "sparks", { count: 70, power: 1.2 })],
          [300, () => at(word.current, "confetti", { count: 36, power: 0.9 })],
        ]
      : [
          [
            520,
            () =>
              at(word.current, "shards", {
                count: 22,
                colors: ["#5a0a06", "#2a0402", "#8a1a10"],
              }),
          ],
        ],
    scale,
  );
  return (
    <Stage
      kind="natural"
      className={`natural-burst ${crit ? "crit" : "fumble"}`}
      length={crit ? 1500 : LENGTH.natural}
      scale={scale}
      onDone={onDone}
      ambient
    >
      {crit ? (
        <span className="natural-rays" />
      ) : (
        <svg
          className="natural-cracks"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
        >
          {["glow", "line"].map((layer) => (
            <g key={layer} className={layer}>
              {CRACKS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          ))}
        </svg>
      )}
      <span className="natural-word" ref={word}>
        <small>Natural</small>
        {crit ? (
          <strong>20</strong>
        ) : (
          <strong className="natural-split">
            <span className="half left">1</span>
            <span className="half right">1</span>
          </strong>
        )}
      </span>
    </Stage>
  );
}

/* --- Evolution (League) ------------------------------------------------- */

/** A type's glyph alone as a white silhouette. */
function Glyph({ type, className }: { type: PokemonType; className: string }) {
  const src = `url("${asset(`art/league/types/${type}.svg`)}")`;
  return (
    <span
      className={`evo-glyph ${className}`}
      style={{ maskImage: src, WebkitMaskImage: src }}
    />
  );
}

/** The table goes dark around a breathing light: the old form's glyph and
 * the new one's trade places, quicker each time but never faster than
 * three changes a second, while white motes are drawn in from the edges;
 * the light folds to a point, blooms once, and the new form lands in its
 * colours with its name and what it changed. */
function Evolution({ m, scale, onDone }: ViewProps<"evolution">) {
  const orb = useRef<HTMLDivElement>(null);
  const from = m.fromType ?? "normal";
  const to = m.toType ?? from;
  const pull = () =>
    at(orb.current, "implode", {
      count: 34,
      colors: ["#ffffff", "#eaf6ff", pokemonTypes[from].light],
    });
  useTimeline(
    [
      [500, pull],
      [1200, pull],
      [1900, pull],
      [2500, pull],
      [
        3550,
        () => {
          at(orb.current, "sparks", {
            count: 90,
            power: 1.3,
            colors: [pokemonTypes[to].light, "#ffffff", "#fff3c8"],
          });
          at(orb.current, "firework", {
            count: 50,
            colors: [pokemonTypes[to].light, "#ffffff"],
          });
        },
      ],
    ],
    scale,
  );
  return (
    <Stage
      kind="evolution"
      length={LENGTH.evolution}
      scale={scale}
      onDone={onDone}
      style={{ ...typeVars("from", from), ...typeVars("to", to) }}
    >
      <span className="evo-backdrop" />
      <span className="evo-rays" />
      <p className="evo-kicker">{m.kicker}</p>
      <div className="evo-orb" ref={orb}>
        <span className="evo-halo" />
        <Glyph type={from} className="old" />
        <Glyph type={to} className="new" />
        <TypeMark type={to} className="evo-medal" />
      </div>
      <span className="evo-bloom" />
      <div className="evo-title">
        <strong>{m.to}</strong>
        {m.change && <span>{m.change}</span>}
      </div>
    </Stage>
  );
}

/** Pub Crawl's level up: the class's name on an iron plate heats from cold
 * to white under three hammer strikes, sparks flying off each, and the new
 * level stamps over it in gold. */
function LevelUp({ m, scale, onDone }: ViewProps<"evolution">) {
  const plate = useRef<HTMLDivElement>(null);
  const strike = (n: number) => () =>
    at(plate.current, "sparks", {
      count: 26 + n * 12,
      power: 0.7 + n * 0.15,
      colors: ["#ffd27a", "#ff8a2a", "#fff1c2"],
      angle: -Math.PI / 2,
      spread: Math.PI * 1.3,
    });
  useTimeline(
    [
      [900, strike(0)],
      [1400, strike(1)],
      [1900, strike(2)],
      [
        2350,
        () =>
          at(plate.current, "embers", {
            count: 40,
            colors: ["#ffb347", "#ff7a1a"],
          }),
      ],
    ],
    scale,
  );
  return (
    <Stage kind="levelup" length={3900} scale={scale} onDone={onDone}>
      <span className="forge-backdrop" />
      <p className="forge-kicker">{m.kicker}</p>
      <div className="forge-plate" ref={plate}>
        <span className="forge-old">{m.from}</span>
        <span className="forge-new">{m.to}</span>
      </div>
      {m.change && <p className="forge-change">{m.change}</p>}
    </Stage>
  );
}

/* --- Entrances ---------------------------------------------------------- */

function Entrance({ m, scale, onDone }: ViewProps<"entrance">) {
  if (m.style === "legendary")
    return <Legendary m={m} scale={scale} onDone={onDone} />;
  if (m.style === "boss" || m.style === "final")
    return <Gate m={m} scale={scale} onDone={onDone} />;
  if (m.style === "ambush")
    return <Ambush m={m} scale={scale} onDone={onDone} />;
  return <Versus m={m} scale={scale} onDone={onDone} />;
}

/** Two panels shear in from opposite corners, the table's side and the
 * foe's, speed lines streaming; VS drops between them with a spark ring and
 * a jolt, holds, and the panels shear away. The Champion's is gold and
 * longer; an Elite Four member after the first is quicker. */
function Versus({ m, scale, onDone }: ViewProps<"entrance">) {
  const mark = useRef<HTMLElement>(null);
  const repeat = m.style === "elite" && !/· 1 of/.test(m.kicker);
  const champion = m.style === "champion";
  const length = champion ? 3300 : repeat ? 1800 : LENGTH.entrance;
  useTimeline(
    [
      [
        repeat ? 260 : 430,
        () => {
          at(mark.current, "streaks", {
            count: champion ? 46 : 30,
            power: 1.5,
            colors: ["#ffffff", champion ? "#ffe39a" : "#fff3c8"],
          });
          at(mark.current, "sparks", {
            count: champion ? 110 : 70,
            power: 1.15,
            colors: champion
              ? ["#fff3c8", "#f2c94c", "#ffffff"]
              : [
                  "#ffffff",
                  "#ffe9a8",
                  pokemonTypes[m.foe.type ?? "normal"].light,
                ],
          });
        },
      ],
      ...(champion
        ? ([
            [700, () => at(mark.current, "confetti", { count: 40, power: 1 })],
          ] as [number, () => void][])
        : []),
    ],
    scale,
  );
  return (
    <Stage
      kind="entrance"
      passTo=".game-card"
      className={`versus vs-${m.style}${repeat ? " vs-quick" : ""}`}
      length={length}
      scale={scale}
      onDone={onDone}
      style={{
        ...typeVars("hero", m.hero?.type),
        ...typeVars(
          "foe",
          m.foe.type,
          m.style === "villain" ? "dark" : "normal",
        ),
        // The Champion stands in gold, whatever its type.
        ...(champion ? { "--foe": "#ffe39a", "--foe-deep": "#8a5a10" } : {}),
      }}
    >
      <div className="vs-panel hero">
        <span className="vs-lines" />
        <div className="vs-who">
          {m.hero?.type && <TypeMark type={m.hero.type} />}
          <div>
            <small>{m.hero ? "You" : ""}</small>
            <strong>{m.hero?.name ?? "The table"}</strong>
            <span className="vs-hp">
              {m.heartsWord} {m.hearts}/{m.max}
            </span>
          </div>
        </div>
      </div>
      <div className="vs-panel foe">
        <span className="vs-lines" />
        <div className="vs-who">
          <div>
            <small>{m.kicker}</small>
            <strong>{m.title}</strong>
            {m.badge && (
              <span className="vs-badge">
                {m.badge.art && <img src={m.badge.art} alt="" />}
                For the {m.badge.name}
              </span>
            )}
          </div>
          {m.foe.type && <TypeMark type={m.foe.type} />}
        </div>
      </div>
      <span className="vs-slash" />
      <b className="vs-mark" ref={mark}>
        <i>V</i>
        <i>S</i>
      </b>
    </Stage>
  );
}

/** A Legendary: the table goes still and dark, the ground shakes twice, an
 * aura in its type's colour rises, and its name lifts out of the dark. */
/** The ground shaking: dust lifting off the floor and grit shaken down. */
function tremor() {
  burst("dust", {
    y: window.innerHeight,
    count: 22,
    colors: ["#6a6280", "#8c84a6"],
    angle: -Math.PI / 2,
    spread: 1,
  });
  burst("shards", {
    y: -10,
    count: 14,
    power: 0.25,
    colors: ["#4a4458", "#6a6280"],
    angle: Math.PI / 2,
    spread: 0.6,
  });
}

function Legendary({ m, scale, onDone }: ViewProps<"entrance">) {
  const name = useRef<HTMLElement>(null);
  const color = pokemonTypes[m.foe.type ?? "psychic"].light;
  useTimeline(
    [
      [400, tremor],
      [1100, tremor],
      [1500, () => burst("motes", { count: 50, colors: [color, "#ffffff"] })],
      [
        1900,
        () =>
          at(name.current, "sparks", { count: 60, colors: [color, "#ffffff"] }),
      ],
    ],
    scale,
  );
  return (
    <Stage
      kind="entrance"
      passTo=".game-card"
      className="legendary"
      length={3500}
      scale={scale}
      onDone={onDone}
      style={typeVars("foe", m.foe.type, "psychic")}
    >
      <span className="legend-dark" />
      <span className="legend-rays" />
      <span className="legend-aura" />
      <span className="legend-ring" />
      <p className="legend-kicker">{m.kicker}</p>
      <strong className="legend-name" ref={name}>
        {m.title}
      </strong>
      {m.foe.type && <TypeMark type={m.foe.type} className="legend-type" />}
    </Stage>
  );
}

/** Pub Crawl's floor boss: an iron portcullis slams down, dust bursts along
 * its foot, the boss's name hangs on a burned sign that swings to rest,
 * then the gate lifts on the card. The last boss's sign is gilt. */
function Gate({ m, scale, onDone }: ViewProps<"entrance">) {
  useTimeline(
    [
      [
        430,
        () =>
          burst("dust", {
            y: window.innerHeight * 0.98,
            count: 44,
            colors: ["#b49a74", "#8a7558", "#d8c4a0"],
            angle: -Math.PI / 2,
            spread: 2.4,
            power: 0.9,
          }),
      ],
      [
        470,
        () => {
          burst("streaks", {
            y: window.innerHeight * 0.97,
            count: 22,
            power: 1.1,
            colors: ["#ffd27a", "#fff1c2", "#ff8a2a"],
            angle: -Math.PI / 2,
            spread: 2.4,
          });
          burst("sparks", {
            y: window.innerHeight * 0.97,
            count: 26,
            colors: ["#ffd27a", "#ff8a2a"],
            angle: -Math.PI / 2,
            spread: 2.6,
          });
        },
      ],
    ],
    scale,
  );
  return (
    <Stage
      kind="entrance"
      passTo=".game-card"
      className={`gate gate-${m.style}`}
      length={LENGTH.entrance + 200}
      scale={scale}
      onDone={onDone}
    >
      <span className="gate-shade" />
      <span className="gate-bars" />
      <div className="gate-sign">
        <span className="gate-chain left" />
        <span className="gate-chain right" />
        <div className="gate-board">
          <small>{m.kicker}</small>
          <strong>{m.title}</strong>
        </div>
      </div>
    </Stage>
  );
}

/** An ambush: three claw slashes rip across and the word lands. */
function Ambush({ m, scale, onDone }: ViewProps<"entrance">) {
  return (
    <Stage
      kind="entrance"
      passTo=".game-card"
      className="ambush"
      length={1300}
      scale={scale}
      onDone={onDone}
    >
      <span className="claw c1" />
      <span className="claw c2" />
      <span className="claw c3" />
      <div className="ambush-word">
        <strong>{m.kicker}!</strong>
        <small>{m.title}</small>
      </div>
    </Stage>
  );
}

/* --- League fights ------------------------------------------------------ */

/** The two types meet over the card: the stronger shatters the other and
 * flies into the strip's edge chip; an even matchup only clinks. */
function Clash({ m, scale, onDone }: ViewProps<"clash">) {
  const mine = useRef<HTMLDivElement>(null);
  const theirs = useRef<HTMLDivElement>(null);
  const even = m.edge === "even";
  const winner = m.edge === "advantage" ? mine : theirs;
  const loser = m.edge === "advantage" ? theirs : mine;
  const loserType = m.edge === "advantage" ? m.theirs : m.mine;
  useTimeline(
    [
      [
        330,
        () => {
          const a = mine.current?.getBoundingClientRect();
          const b = theirs.current?.getBoundingClientRect();
          const x = a && b ? (a.right + b.left) / 2 : undefined;
          const y = a ? a.top + a.height / 2 : undefined;
          burst("sparks", {
            x,
            y,
            count: even ? 30 : 56,
            power: even ? 0.6 : 1,
          });
          if (!even) burst("streaks", { x, y, count: 24, power: 1.2 });
          if (!even)
            at(loser.current, "shards", {
              count: 22,
              colors: [
                pokemonTypes[loserType].light,
                pokemonTypes[loserType].deep,
                "#ffffff",
              ],
            });
        },
      ],
      ...(!even
        ? ([
            [
              760,
              () => {
                if (flyTarget("matchup"))
                  void flyTo(
                    winner.current?.querySelector(".type-mark") ?? null,
                    "matchup",
                    {
                      duration: 380 * scale,
                    },
                  );
              },
            ],
          ] as [number, () => void][])
        : []),
    ],
    scale,
  );
  return (
    <Stage
      kind="clash"
      className={`clash-${m.edge}`}
      length={even ? 760 : LENGTH.clash}
      scale={scale}
      onDone={onDone}
      ambient
      style={{ ...typeVars("mine", m.mine), ...typeVars("theirs", m.theirs) }}
    >
      <span className="clash-flash" />
      <div className="clash-side mine" ref={mine}>
        <TypeMark type={m.mine} />
      </div>
      <div className="clash-side theirs" ref={theirs}>
        <TypeMark type={m.theirs} />
      </div>
      {!even && (
        <p className="clash-word">
          <strong>
            {m.edge === "advantage"
              ? "Super effective!"
              : "Super effective on you!"}
          </strong>
          {/* What the edge does here (2026-11-01, owner: why show it at
              all on a strike?): a strike is settled by it alone; a dice
              fight rolls extra dice. */}
          <small>{clashLine(m)}</small>
        </p>
      )}
    </Stage>
  );
}

/** What a type edge does to the card: a strike is won or lost on it; a
 * dice fight rolls extra dice and keeps the best (or, against it, the
 * worst). */
function clashLine(m: Of<"clash">) {
  const ours = m.edge === "advantage";
  if (m.strike) return ours ? "Your type wins it." : "Their type wins it.";
  return ours ? "Extra dice: keep the best." : "Extra dice: keep the worst.";
}

/** A caught Pokémon sent in: a ball arcs onto the table and opens in its
 * type's light. */
function SendIn({ m, scale, onDone }: ViewProps<"sendin">) {
  const light = useRef<HTMLSpanElement>(null);
  const color = pokemonTypes[m.type ?? "normal"].light;
  useTimeline(
    [
      [
        560,
        () =>
          at(light.current, "sparks", {
            count: 50,
            colors: [color, "#ffffff"],
          }),
      ],
    ],
    scale,
  );
  return (
    <Stage
      kind="sendin"
      length={LENGTH.sendin}
      scale={scale}
      onDone={onDone}
      style={typeVars("c", m.type)}
    >
      <div className="sendin-arc">
        <div className="mini-ball">
          <span className="top" />
          <span className="bottom" />
          <span className="button" />
        </div>
      </div>
      <span className="sendin-light" ref={light} />
      {m.type && <TypeMark type={m.type} className="sendin-mark" />}
      <strong className="sendin-word">Go, {m.name}!</strong>
    </Stage>
  );
}

/* --- The run's first card ----------------------------------------------- */

/** The League: one ball rolls in, wobbles three times and bursts open in the
 * starter's colour; Pub Crawl: a card rises from a fanned spread, turns once
 * with a gilt edge and lands as tonight's omen. Either way the card turns
 * over underneath, and the stage fades off it. */
function Omen({ m, scale, onDone }: ViewProps<"omen">) {
  const core = useRef<HTMLDivElement>(null);
  const color = pokemonTypes[m.type ?? "normal"].light;
  useTimeline(
    m.league
      ? [
          [700, () => at(core.current, "sparks", { count: 8, power: 0.3 })],
          [1100, () => at(core.current, "sparks", { count: 8, power: 0.3 })],
          [1500, () => at(core.current, "sparks", { count: 10, power: 0.35 })],
          [
            1750,
            () => {
              at(core.current, "sparks", {
                count: 90,
                power: 1.3,
                colors: [color, "#ffffff"],
              });
              at(core.current, "confetti", {
                count: 30,
                power: 0.8,
                colors: [color, "#ffffff", "#f2c94c"],
              });
            },
          ],
        ]
      : [
          [
            900,
            () =>
              at(core.current, "embers", {
                count: 36,
                colors: ["#ffd27a", "#ff9a3a", "#fff1c2"],
              }),
          ],
          [
            1250,
            () =>
              at(core.current, "sparks", {
                count: 50,
                colors: ["#fff3c8", "#f2c94c"],
              }),
          ],
        ],
    scale,
  );
  return (
    <Stage
      kind="omen"
      className={m.league ? "omen-ball" : "omen-tarot"}
      length={m.league ? LENGTH.omen : 2300}
      scale={scale}
      onDone={onDone}
      style={typeVars("c", m.type)}
    >
      <span className="omen-shade" />
      {m.league ? (
        <div className="omen-roll" ref={core}>
          <div className="omen-ballbody">
            <span className="top" />
            <span className="bottom" />
            <span className="button" />
          </div>
        </div>
      ) : (
        <div className="tarot" ref={core}>
          {[-2, -1, 1, 2].map((i) => (
            <span
              key={i}
              className="tarot-back fan"
              style={{ "--i": i } as CSSProperties}
            />
          ))}
          <span className="tarot-back rise" />
        </div>
      )}
      <span className="omen-beam" />
      <div className="omen-name">
        <small>{m.league ? "Your starter" : "Tonight's omen"}</small>
        <strong>{m.title}</strong>
      </div>
    </Stage>
  );
}

/* --- Prizes ------------------------------------------------------------- */

/** A gym's badge: it pops from the table spinning, a glint runs over it, its
 * name sets under it, and it flies into the strip's badges chip. */
function Badge({ m, scale, onDone }: ViewProps<"badge">) {
  const coin = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  useTimeline(
    [
      [520, () => at(coin.current, "sparks", { count: 64, power: 1.1 })],
      [
        1350,
        () => {
          void flyTo(coin.current, "badges", { duration: 560 * scale });
          setGone(true);
        },
      ],
    ],
    scale,
  );
  const mask = m.art ? `url("${m.art}")` : undefined;
  return (
    <Stage
      kind="badge"
      length={LENGTH.badge}
      scale={scale}
      onDone={onDone}
      style={typeVars("c", m.type)}
    >
      <span className="badge-shade" />
      <span className="badge-rays" />
      <div className={`badge-coin${gone ? " gone" : ""}`} ref={coin}>
        {m.art ? <img src={m.art} alt="" /> : <TypeMark type={m.type} />}
        {mask && (
          <span
            className="badge-glint"
            style={{ maskImage: mask, WebkitMaskImage: mask }}
          />
        )}
      </div>
      <p className="badge-words">
        <strong>{m.name}</strong>
        <small>
          Badge earned · {m.earned} of {m.of}
        </small>
      </p>
    </Stage>
  );
}

/** An item or a piece of gear: it rises in a pillar of light coloured by
 * how rare it is, turns once, and drops into the bag chip. */
function LootFound({ m, scale, onDone }: ViewProps<"loot">) {
  const item = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const colors =
    m.tier === "gold"
      ? ["#fff3c8", "#f2c94c", "#ffffff"]
      : m.tier === "violet"
        ? ["#e9d6ff", "#a86bff", "#ffffff"]
        : ["#ffe2b8", "#d39b55", "#ffffff"];
  useTimeline(
    [
      [200, () => at(item.current, "motes", { count: 28, colors })],
      [420, () => at(item.current, "sparks", { count: 40, colors })],
      [
        900,
        () => {
          void flyTo(item.current, "satchel", { duration: 520 * scale });
          setGone(true);
        },
      ],
    ],
    scale,
  );
  return (
    <Stage
      kind="loot"
      className={`tier-${m.tier}`}
      length={LENGTH.loot}
      scale={scale}
      onDone={onDone}
    >
      <span className="loot-shade" />
      <span className="loot-pillar" />
      <div className={`loot-item${gone ? " gone" : ""}`} ref={item}>
        <CrawlIcon name={m.icon} theme={crawlTheme(m.packId)} />
      </div>
      <p className="loot-words">
        <small>{m.kicker}</small>
        <strong>
          {m.name}
          {m.more > 0 && <em> +{m.more} more</em>}
        </strong>
      </p>
    </Stage>
  );
}

/** A ribbon across the top for the deck's milestones; the table plays on
 * under it. */
function Milestone({ m, scale, onDone }: ViewProps<"milestone">) {
  // A plain game's first card: gilt sparks and confetti off the card as
  // the ribbon drops (`opening`).
  useTimeline(
    m.opening
      ? [
          [
            180,
            () =>
              at(document.querySelector(".game-card"), "sparks", {
                count: 46,
                power: 1.1,
              }),
          ],
          [
            240,
            () =>
              at(document.querySelector(".game-card"), "confetti", {
                count: 34,
                power: 0.9,
              }),
          ],
        ]
      : [],
    scale,
  );
  return (
    <Stage
      kind="milestone"
      className={m.opening ? "opening" : ""}
      length={LENGTH.milestone}
      scale={scale}
      onDone={onDone}
      ambient
    >
      <div className="milestone-cloth">
        <small>{m.kicker}</small>
        <strong>{m.title}</strong>
        {m.line && <span>{m.line}</span>}
      </div>
    </Stage>
  );
}

/* --- The team: a faint, a hatch, a Legendary caught ----------------------- */

/** A caught Pokémon fainted for good (a Nuzlocke): no burst. Its medallion
 * holds in its colour, the light behind it goes out, the colour drains to
 * grey and pale motes drift up as it sinks. The quietest moment there is. */
function Faint({ m, scale, onDone }: ViewProps<"faint">) {
  const mark = useRef<HTMLDivElement>(null);
  const color = pokemonTypes[m.type ?? "normal"].light;
  useTimeline(
    [
      [
        900,
        () =>
          at(mark.current, "embers", {
            count: 26,
            power: 0.7,
            colors: ["#d8d2c8", "#ffffff", color],
          }),
      ],
      [
        1500,
        () =>
          at(mark.current, "embers", {
            count: 14,
            power: 0.5,
            colors: ["#a9a29a", "#d8d2c8"],
          }),
      ],
    ],
    scale,
  );
  return (
    <Stage
      kind="faint"
      length={LENGTH.faint}
      scale={scale}
      onDone={onDone}
      style={typeVars("c", m.type)}
    >
      <span className="faint-shade" />
      <span className="faint-halo" />
      <div className="faint-mark" ref={mark}>
        <TypeMark type={m.type ?? "normal"} />
      </div>
      <p className="faint-words">
        <small>Fainted</small>
        <strong>{m.name}</strong>
        <span>{m.line}</span>
      </p>
    </Stage>
  );
}

/** The crack across an egg's middle, in a 100 x 100 box. */
const EGG_CRACK =
  "M4 52 L16 44 L26 55 L38 42 L50 54 L62 41 L74 53 L86 43 L96 51";

/** A Pokémon joins with no throw. An egg wobbles three times, cracks on the
 * last two and splits in its type's light; a Legendary's ball drops in,
 * wobbles three times and clicks shut in gold. Then the new teammate's
 * medallion lands, names itself and flies into the bag. */
function Join({ m, scale, onDone }: ViewProps<"join">) {
  const vessel = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const color = pokemonTypes[m.type ?? "normal"].light;
  const colors = m.hatched
    ? [color, "#ffffff", "#fff6e0"]
    : ["#ffe9a8", "#f2c94c", "#ffffff", color];
  useTimeline(
    [
      [
        1480,
        () =>
          at(vessel.current, m.hatched ? "shards" : "sparks", {
            count: m.hatched ? 18 : 46,
            power: m.hatched ? 0.8 : 1.1,
            colors: m.hatched ? ["#fff6e0", "#efe2c4", color] : colors,
          }),
      ],
      [1560, () => at(vessel.current, "confetti", { count: 30, colors })],
      [
        2300,
        () => {
          void flyTo(mark.current, "satchel", { duration: 520 * scale });
          setGone(true);
        },
      ],
    ],
    scale,
  );
  return (
    <Stage
      kind="join"
      className={m.hatched ? "hatch" : "caught"}
      length={LENGTH.join}
      scale={scale}
      onDone={onDone}
      style={typeVars("c", m.type)}
    >
      <span className="join-shade" />
      <span className="join-light" />
      <div className="join-vessel" ref={vessel}>
        {m.hatched ? (
          <div className="egg">
            <span className="egg-top" />
            <span className="egg-bottom" />
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d={EGG_CRACK} pathLength={1} />
            </svg>
          </div>
        ) : (
          <div className="mini-ball">
            <span className="top" />
            <span className="bottom" />
            <span className="button" />
          </div>
        )}
      </div>
      <div className={`join-mark${gone ? " gone" : ""}`} ref={mark}>
        <TypeMark type={m.type ?? "normal"} />
      </div>
      <p className="join-words">
        <small>{m.hatched ? "Hatched" : "Gotcha!"}</small>
        <strong>{m.name}</strong>
        <span>Joined the team.</span>
      </p>
    </Stage>
  );
}

/* --- A jinx --------------------------------------------------------------- */

/** A jinx laid: a scroll unrolls with the jinx's name and rule, a crimson
 * wax seal stamps onto it, it holds long enough to read across the table,
 * then rolls up into the strip's jinx chip. */
function JinxLaid({ m, scale, onDone }: ViewProps<"jinx">) {
  const seal = useRef<HTMLSpanElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  useTimeline(
    [
      [
        640,
        () => {
          at(seal.current, "streaks", {
            count: 14,
            colors: ["#ff6a5a", "#ffd2c4"],
          });
          at(seal.current, "dust", {
            count: 12,
            colors: ["#5a0a0688", "#2a040288"],
          });
        },
      ],
      [
        3020,
        () => {
          void flyTo(seal.current, "jinx", { duration: 460 * scale });
          setGone(true);
        },
      ],
    ],
    scale,
  );
  return (
    <Stage kind="jinx" length={LENGTH.jinx} scale={scale} onDone={onDone}>
      <span className="jinx-shade" />
      <div className={`jinx-scroll${gone ? " rolled" : ""}`} ref={scroll}>
        <small>{m.kicker}</small>
        <strong>{m.name}</strong>
        <span>{m.rule}</span>
        <span className={`jinx-seal${gone ? " gone" : ""}`} ref={seal}>
          <CrawlIcon name="jinx" theme={crawlTheme(m.packId)} />
        </span>
      </div>
    </Stage>
  );
}

/** A jinx lifted (its floor's boss fell): the scroll comes back, its seal
 * cracks in two and the paper burns away from the foot in embers. */
function JinxLifted({ m, scale, onDone }: ViewProps<"jinx">) {
  const scroll = useRef<HTMLDivElement>(null);
  /** Embers off the burning edge, `rise` of the way up from the foot. */
  const embers = (rise: number, count: number) => () => {
    const r = scroll.current?.getBoundingClientRect();
    if (!r) return;
    burst("embers", {
      x: r.left + r.width / 2,
      y: r.bottom - r.height * rise,
      count,
      power: 0.8,
      colors: ["#ffb347", "#ff6a1a", "#ffe9a8"],
    });
  };
  // The edge climbs from 32% to 62% of the moment (`jinx-burn`).
  useTimeline(
    [
      [LIFTED * 0.34, embers(0.1, 30)],
      [LIFTED * 0.44, embers(0.4, 26)],
      [LIFTED * 0.54, embers(0.75, 22)],
    ],
    scale,
  );
  return (
    <Stage
      kind="jinx"
      className="lifted"
      length={LIFTED}
      scale={scale}
      onDone={onDone}
    >
      <span className="jinx-shade" />
      {/* The seal sits outside the scroll: the burn's mask would clip it. */}
      <div className="jinx-wrap">
        <div className="jinx-scroll" ref={scroll}>
          <small>{m.kicker}</small>
          <strong>{m.name}</strong>
        </div>
        <span className="jinx-burnline" />
        <span className="jinx-seal">
          <i className="half left">
            <CrawlIcon name="jinx" theme={crawlTheme(m.packId)} />
          </i>
          <i className="half right">
            <CrawlIcon name="jinx" theme={crawlTheme(m.packId)} />
          </i>
        </span>
      </div>
      <p className="jinx-lifts">{m.rule}</p>
    </Stage>
  );
}

/* --- Doubles, the hidden room, push your luck, the last heart ----------- */

/** Where each face's pips sit on a 3 x 3 grid (1 to 6). */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** One die's face: pips for a d6, the number for anything else. */
function Face({ value, sides }: { value: number; sides: number }) {
  const pips = sides === 6 ? PIPS[value] : undefined;
  return (
    <span className="pair-die">
      {pips ? (
        Array.from({ length: 9 }, (_, i) => (
          <i key={i} className={pips.includes(i) ? "pip" : undefined} />
        ))
      ) : (
        <b>{value}</b>
      )}
    </span>
  );
}

/** Matching dice: two faces swing in from the sides and clack together over
 * the table, "Doubles!" stamps between them. Ambient: under 1.5 s, and the
 * next tap still reaches the card. */
function Doubles({ m, scale, onDone }: ViewProps<"doubles">) {
  const word = useRef<HTMLElement>(null);
  useTimeline(
    [
      [
        360,
        () =>
          at(word.current, "streaks", {
            count: 16,
            colors: m.win ? ["#fff3c4", "#f2c94c"] : ["#ffffff", "#e6c78e"],
          }),
      ],
      [380, () => at(word.current, "sparks", { count: 34, power: 0.9 })],
    ],
    scale,
  );
  const value = m.faces[0];
  return (
    <Stage
      kind="doubles"
      className={m.win ? "win" : ""}
      length={LENGTH.doubles}
      scale={scale}
      onDone={onDone}
      ambient
    >
      <div className="pair-dice">
        <span className="pair-left">
          <Face value={value} sides={m.sides} />
        </span>
        <span className="pair-right">
          <Face value={value} sides={m.sides} />
        </span>
      </div>
      <strong className="pair-word" ref={word}>
        Doubles!
      </strong>
    </Stage>
  );
}

/** Behind the bookcase (Pub Crawl's hidden room): a bookcase fills the
 * table, shudders as something clicks, and swings open on its hinge into
 * warm light and dust, the room's name hanging in the doorway. Like a
 * boss's entrance, a tap on the card skips it and turns the card. */
function Door({ m, scale, onDone }: ViewProps<"door">) {
  const gap = useRef<HTMLSpanElement>(null);
  useTimeline(
    [
      [
        900,
        () =>
          at(gap.current, "dust", {
            count: 26,
            colors: ["#e8d4a866", "#bd945755", "#fff3c444"],
          }),
      ],
      [
        1150,
        () =>
          at(gap.current, "motes", {
            count: 26,
            colors: ["#ffe9a8", "#fff6d6"],
          }),
      ],
    ],
    scale,
  );
  const books = useRef(
    Array.from({ length: 4 }, (_, shelf) =>
      Array.from({ length: 9 }, (_, i) => {
        // A fixed pattern per shelf: no randomness in a view.
        const n = (shelf * 7 + i * 5) % 9;
        return { h: 70 + ((n * 37) % 28), tone: n % 5, lean: n === 3 };
      }),
    ),
  );
  return (
    <Stage
      kind="door"
      length={LENGTH.door}
      scale={scale}
      onDone={onDone}
      passTo=".game-card"
    >
      <span className="door-light" ref={gap} />
      <div className="door-room">
        <small>{m.kicker}</small>
        <strong>{m.title}</strong>
        {m.wanted && <span>{m.wanted}</span>}
      </div>
      <div className="bookcase">
        {books.current.map((shelf, i) => (
          <div className="shelf" key={i}>
            {shelf.map((b, j) => (
              <i
                key={j}
                className={`book tone-${b.tone}${b.lean ? " lean" : ""}`}
                style={{ height: `${b.h}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </Stage>
  );
}

/** Push your luck. A pull banked: a stack of gold coins grows by one with
 * a clink, "Let it ride!"; ambient, and gone the moment the table rolls
 * again. The bank lost: the stack topples, its coins scatter, "Bust!". */
function Press({ m, scale, onDone }: ViewProps<"press">) {
  const stack = useRef<HTMLDivElement>(null);
  useTimeline(
    m.bust
      ? [[260, () => at(stack.current, "coins", { count: 28, power: 1.1 })]]
      : [[420, () => at(stack.current, "sparks", { count: 26, power: 0.7 })]],
    scale,
  );
  const coins = Math.max(1, Math.min(m.banked, 6));
  return (
    <Stage
      kind="press"
      className={m.bust ? "bust" : "ride"}
      length={LENGTH.press}
      scale={scale}
      onDone={onDone}
      ambient
    >
      <div className="press-stack" ref={stack}>
        {Array.from({ length: coins }, (_, i) => (
          <i
            key={i}
            className={`press-coin${!m.bust && i === coins - 1 ? " new" : ""}`}
            style={{ "--i": i } as CSSProperties}
          />
        ))}
      </div>
      <p className="press-words">
        <strong>{m.bust ? "Bust!" : "Let it ride!"}</strong>
        <small>
          {m.bust
            ? "The prizes are gone."
            : `${m.banked} banked · the next pull is harder`}
        </small>
      </p>
    </Stage>
  );
}

/** A heartbeat trace, in a 200 x 40 box: one beat, a long flat line, then
 * the beat that comes back. Drawn from 8% to 78% of the moment, so the
 * beats land at about 22% and 61%, where the heart beats (`moments.css`). */
const TRACE =
  "M0 20 H30 L35 20 L40 4 L46 36 L51 20 H140 L145 20 L150 2 L156 38 L161 20 H200";

/** Down to the last heart: the table goes dark, a lone heart beats once,
 * stops, the trace runs flat a beat too long, and then it beats again.
 * "By a thread." */
function Thread({ m, scale, onDone }: ViewProps<"thread">) {
  return (
    <Stage kind="thread" length={LENGTH.thread} scale={scale} onDone={onDone}>
      <span className="thread-shade" />
      <div className="thread-heart">
        <CrawlIcon
          name="heart"
          theme={crawlTheme(m.league ? "pokemon" : "dungeon")}
        />
      </div>
      <svg
        className="thread-trace"
        viewBox="0 0 200 40"
        preserveAspectRatio="none"
      >
        <path d={TRACE} pathLength={1} />
      </svg>
      <p className="thread-words">
        <strong>By a thread</strong>
        <span>{m.line}</span>
      </p>
    </Stage>
  );
}
