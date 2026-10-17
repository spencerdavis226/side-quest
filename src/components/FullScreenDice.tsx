import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CardDefinition, DicePalette, DiceRoll } from "../game/types";
import { forceMotion } from "../presentation/motion";
import "./fullscreen-dice.css";

type Stage = Awaited<
  ReturnType<typeof import("../presentation/dice/library").createDiceStage>
>;

/** Transparent, full-viewport dice. Saved outcomes never depend on WebGL. */
export default function FullScreenDice({
  card,
  roll,
  rolling,
  finishing,
  onTap,
  onReveal,
  onFinish,
  palette,
}: {
  card: CardDefinition;
  roll: DiceRoll | null;
  /** The run's starter or omen colours; the house brass and teal without. */
  palette?: DicePalette;
  rolling: boolean;
  finishing: boolean;
  onTap(): void;
  onReveal(): void;
  onFinish(): void;
}) {
  const stageId = `dice-stage-${useId().replace(/:/g, "")}`;
  const callbacks = useRef({ onTap, onReveal, onFinish });
  // Read when a stage is built: a palette change never rebuilds one mid-roll.
  const colors = useRef(palette);
  colors.current = palette;
  callbacks.current = { onTap, onReveal, onFinish };
  const stage = useRef<Stage | null>(null);
  const ready = useRef<Promise<Stage | null> | null>(null);
  const expedited = useRef(false);
  const stopped = useRef(false);
  const initial = useRef({ roll, rolling });
  const [status, setStatus] = useState("static");
  const [stopReason, setStopReason] = useState("");
  const [timing, setTiming] = useState(0);
  const [rollMs, setRollMs] = useState(0);

  // Warm the lazy renderer while the revealed card is being read. A restored
  // result stays static; it never replays or allocates a WebGL context.
  // `warm` can run again: iOS may drop the WebGL context while the app is in
  // the background, and the next roll should still be thrown, not tiled.
  const generation = useRef(0);
  const lost = useRef(false);
  const warm = useRef(() => {});
  warm.current = () => {
    const mine = ++generation.current;
    const current = () => mine === generation.current && !stopped.current;
    const started = performance.now();
    lost.current = false;
    stage.current?.dispose();
    stage.current = null;
    setStatus("loading");
    setStopReason("");
    ready.current = import("../presentation/dice/library")
      .then(({ createDiceStage }) =>
        current()
          ? createDiceStage(`#${CSS.escape(stageId)}`, colors.current)
          : null,
      )
      .then((created) => {
        if (!current()) {
          created?.dispose();
          return null;
        }
        stage.current = created;
        document
          .querySelector(
            `#${CSS.escape(stageId)} canvas:not(.dice-shadow-layer)`,
          )
          ?.addEventListener(
            "webglcontextlost",
            () => {
              if (!current()) return;
              lost.current = true;
              setStatus("fallback");
              setStopReason("webgl");
            },
            { once: true },
          );
        setTiming(Math.round(performance.now() - started));
        setStatus("ready");
        return created;
      })
      .catch(() => {
        if (current()) {
          lost.current = true;
          setStatus("fallback");
          setStopReason("webgl");
        }
        return null;
      });
  };
  const latestRoll = useRef(roll);
  latestRoll.current = roll;
  useEffect(() => {
    stopped.current = false;
    const reduced = () =>
      matchMedia("(prefers-reduced-motion: reduce)").matches && !forceMotion();
    if (initial.current.roll && !initial.current.rolling) return;
    if (!document.hidden && !reduced()) warm.current();
    // Back from the background before the roll: rebuild a stage that was
    // never made or whose context the system took.
    const onVisible = () => {
      if (
        !document.hidden &&
        !latestRoll.current &&
        !reduced() &&
        (!ready.current || lost.current)
      )
        warm.current();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      // generation is a counter, not a DOM node: bumping the live value is
      // the point, so a roll still in flight sees it is stale.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      stage.current?.dispose();
      stage.current = null;
    };
  }, [stageId]);

  useEffect(
    () => () => {
      if (!document.querySelector("dialog[open]"))
        document
          .querySelector<HTMLElement>(".game-card")
          ?.focus({ preventScroll: true });
    },
    [],
  );

  useEffect(() => {
    if (!finishing) return;
    expedited.current = true;
    stage.current?.finish();
  }, [finishing]);

  useEffect(() => {
    if (!roll || rolling) return;
    if (status === "revealing") {
      const timer = setTimeout(() => callbacks.current.onReveal(), 180);
      return () => clearTimeout(timer);
    }
    if (status.startsWith("settled:")) {
      // Let the physical result read, then fade it into the resolved card.
      const timer = setTimeout(() => setStatus("revealing"), 700);
      return () => clearTimeout(timer);
    }
    // Restored, reduced-motion and unavailable-renderer results skip the
    // decorative stage and reveal their already-saved outcome immediately.
    const timer = setTimeout(() => callbacks.current.onReveal(), 0);
    return () => clearTimeout(timer);
  }, [rolling, roll, status]);

  useEffect(() => {
    if (!roll || !rolling) return;
    let canceled = false;
    const started = performance.now();
    const stop = (reason: string) => {
      if (canceled) return;
      canceled = true;
      stopped.current = true;
      stage.current?.dispose();
      stage.current = null;
      setStatus("fallback");
      setStopReason(reason);
      callbacks.current.onFinish();
    };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (document.hidden || (reduced.matches && !forceMotion())) {
      stop(document.hidden ? "hidden" : "reduced");
      return;
    }
    const hidden = () => {
      if (document.hidden) stop("hidden");
    };
    const onReduced = () => {
      if (reduced.matches && !forceMotion()) stop("reduced");
    };
    const width = window.innerWidth;
    const height = window.innerHeight;
    const resize = () => {
      // Ignore URL-bar height jitter; the fixed canvas can stretch vertically.
      if (
        Math.abs(window.innerWidth - width) > 2 ||
        Math.abs(window.innerHeight - height) > 180
      )
        stop("resize");
    };
    const timeout = setTimeout(() => stop("timeout"), 6000);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("resize", resize);
    reduced.addEventListener("change", onReduced);
    void (async () => {
      // One more attempt if the stage was lost while the card was being read.
      if (!ready.current || lost.current) warm.current();
      const renderer = await ready.current;
      if (canceled) return;
      if (!renderer) {
        stop("webgl");
        return;
      }
      if (expedited.current) renderer.finish();
      setStatus("rolling");
      const actual = await renderer.roll(card.dice!.sides, roll.values);
      if (canceled) return;
      clearTimeout(timeout);
      setRollMs(Math.round(performance.now() - started));
      setStatus(`settled:${actual.join(",")}`);
      callbacks.current.onFinish();
    })().catch(() => stop("error"));
    return () => {
      canceled = true;
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("resize", resize);
      reduced.removeEventListener("change", onReduced);
    };
  }, [rolling, roll, card.dice]);

  useEffect(() => {
    if (!roll) return;
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || document.querySelector("dialog[open]"))
        return;
      event.preventDefault();
      if (rolling) callbacks.current.onTap();
    };
    // The card keeps its native keyboard and scroll/tap handling. Stationary
    // taps elsewhere on the table can finish/dismiss the dice too.
    let down = { x: 0, y: 0 };
    const pointer = (event: PointerEvent) => {
      down = { x: event.clientX, y: event.clientY };
    };
    const click = (event: MouseEvent) => {
      if (
        !rolling ||
        event.defaultPrevented ||
        document.querySelector("dialog[open]") ||
        (event.target as Element).closest("button, a, input, select, dialog") ||
        Math.hypot(event.clientX - down.x, event.clientY - down.y) > 8
      )
        return;
      callbacks.current.onTap();
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("click", click);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", pointer);
      document.removeEventListener("click", click);
    };
  }, [roll, rolling]);

  const staticResult = roll && !rolling && !status.startsWith("settled:");
  return createPortal(
    <div
      className={`roll-layer ${status === "revealing" ? "revealing" : ""}`}
      aria-hidden="true"
    >
      <div className="roll-stage-band">
        <div
          className="roll-stage"
          id={stageId}
          data-renderer={status}
          data-stop-reason={stopReason}
          data-startup-ms={timing}
          data-roll-ms={rollMs}
        />
      </div>
      {staticResult && (
        <div className="roll-static-result">
          {roll.values.map((value, index) => (
            <span key={index}>{value}</span>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
