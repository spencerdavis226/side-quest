import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import type { SessionState } from "../../game/types";
import { announce } from "../Announcer";
import {
  CUT_ON_MOTION,
  OVER_MOTION,
  momentsBetween,
  type Moment,
} from "./detect";

// The moments director (2026-11-01): one queue for every full-screen moment,
// so a natural 20, a Felled stamp, a badge and the next boss's entrance play
// one after another instead of on top of each other. A moment waits for the
// card's own motion (deal, flip, discard) to finish, plays, and a tap skips
// it. The views are a lazy chunk, warmed when a game starts. Display only.

type ViewProps = {
  moment: Moment;
  scale: number;
  onDone: () => void;
  waiting?: number;
};
const MomentView = lazy((): Promise<{ default: ComponentType<ViewProps> }> =>
  import("./views").catch(() => ({ default: NoView })),
);
/** The views couldn't load (offline before they were cached): skip. */
function NoView({ onDone }: ViewProps) {
  useEffect(() => onDone(), [onDone]);
  return null;
}
/** Starts the views' and the ending's downloads once a game is under way,
 * so both are in memory before an update can replace this build's chunks
 * (fetched late, a replaced chunk reloads the page: the end screen would
 * reload instead of playing its ending). */
export const warmMoments = () => {
  void import("./views").catch(() => {});
  void import("./Ending").catch(() => {});
};

/** The longest any moment may hold the table, whatever its view does. */
const BACKSTOP_MS = 9000;

interface Director {
  /** A moment is playing or waiting: hold anything that would be lost
   * under it (the Felled stamp). */
  busy: boolean;
  /** Another full-screen stage (the ball throw) holds the queue. */
  lock: (id: string, on: boolean) => void;
}
const DirectorContext = createContext<Director>({
  busy: false,
  lock: () => {},
});
export const useMoments = () => useContext(DirectorContext);
/** Hold the queue while `on` (a full-screen stage of its own is up). */
export function useMomentLock(id: string, on: boolean) {
  const { lock } = useMoments();
  useEffect(() => {
    lock(id, on);
    return () => lock(id, false);
  }, [id, on, lock]);
}

export function MomentDirector({
  session,
  motion,
  undone,
  children,
}: {
  session: SessionState | null;
  motion: string | null;
  undone: boolean;
  children: ReactNode;
}) {
  const prev = useRef(session);
  const seen = useRef(new Set<string>());
  const [queue, setQueue] = useState<Moment[]>([]);
  const [active, setActive] = useState<Moment | null>(null);
  const [locks, setLocks] = useState<ReadonlySet<string>>(new Set());
  const lock = useCallback((id: string, on: boolean) => {
    setLocks((now) => {
      if (now.has(id) === on) return now;
      const next = new Set(now);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  useEffect(() => {
    if (session) warmMoments();
  }, [session]);
  useEffect(() => {
    const before = prev.current;
    prev.current = session;
    if (!session || undone) {
      if (!session) seen.current.clear();
      setQueue([]);
      setActive(null);
      return;
    }
    // A new game (only createSession and replaySession set `discarded` to
    // 0; an undo is flagged and returned above): its moments play again.
    // Keys like `milestone:halfway` or `badge:<gym>` say nothing of the game.
    if (before && session.discarded < before.discarded) seen.current.clear();
    const found = momentsBetween(before, session, undone).filter(
      (m) => !seen.current.has(m.key),
    );
    if (!found.length) return;
    found.forEach((m) => seen.current.add(m.key));
    for (const m of found) announce(m.say);
    // Nobody is watching. (Reduced Motion still queues: each view shows a
    // still plaque instead.)
    if (document.hidden) return;
    setQueue((q) => [...q, ...found]);
  }, [session, undone]);
  // Next in line, once the card has stopped moving and no other stage is up.
  useEffect(() => {
    if (active || !queue.length || locks.size) return;
    const head = queue[0];
    if (motion && !OVER_MOTION.has(head.kind)) return;
    setActive(head);
    setQueue((q) => q.slice(1));
  }, [active, queue, motion, locks]);
  const done = useCallback(() => setActive(null), []);
  // A clash gives way the moment the table rolls.
  useEffect(() => {
    if (motion && active && CUT_ON_MOTION.has(active.kind)) done();
  }, [motion, active, done]);
  useEffect(() => {
    if (!active) return;
    // A held moment (an evolution or a level up) waits for the table's tap.
    const held = active.kind === "evolution";
    const id = held ? undefined : setTimeout(done, BACKSTOP_MS);
    const away = () => {
      if (document.hidden) {
        setQueue([]);
        done();
      }
    };
    document.addEventListener("visibilitychange", away);
    return () => {
      if (id !== undefined) clearTimeout(id);
      document.removeEventListener("visibilitychange", away);
    };
  }, [active, done]);
  // Anything but a milestone ribbon holds what would be lost under it.
  const holds = (m: Moment) => m.kind !== "milestone";
  const value = useMemo(
    () => ({
      busy: (!!active && holds(active)) || queue.some(holds),
      lock,
    }),
    [active, queue, lock],
  );

  return (
    <DirectorContext.Provider value={value}>
      {children}
      {active && (
        <Suspense fallback={null}>
          <MomentView
            key={active.key}
            moment={active}
            scale={1}
            onDone={done}
            waiting={queue.length}
          />
        </Suspense>
      )}
    </DirectorContext.Provider>
  );
}
