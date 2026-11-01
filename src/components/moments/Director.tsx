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
  useSyncExternalStore,
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

type ViewProps = { moment: Moment; scale: number; onDone: () => void };
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

// "Big moments: Full / Quick" (pause menu). Kept beside the preferences,
// not in them or the session, so no save changes.
const SETTING_KEY = "side-quest.moments.v1";
const listeners = new Set<() => void>();
let quickCache: boolean | null = null;
function readQuick() {
  if (quickCache === null) {
    try {
      quickCache = localStorage.getItem(SETTING_KEY) === "quick";
    } catch {
      quickCache = false;
    }
  }
  return quickCache;
}
export function setQuickMoments(quick: boolean) {
  quickCache = quick;
  try {
    localStorage.setItem(SETTING_KEY, quick ? "quick" : "full");
  } catch {
    /* private mode: the choice lasts this visit */
  }
  listeners.forEach((fn) => fn());
}
export function useQuickMoments() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    readQuick,
    () => false,
  );
}
/** Quick plays every moment at this share of its length. */
export const QUICK_SCALE = 0.6;

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
  const quick = useQuickMoments();
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
      setQueue([]);
      setActive(null);
      return;
    }
    const found = momentsBetween(before, session, undone).filter(
      (m) => !seen.current.has(m.key),
    );
    if (!found.length) return;
    found.forEach((m) => seen.current.add(m.key));
    for (const m of found) announce(m.say);
    // Nobody is watching. (Reduced Motion still queues: each view shows a
    // still plaque instead.)
    if (document.hidden) return;
    // Quick drops the type clash (its chip still pulses) and keeps the rest.
    const play = quick ? found.filter((m) => m.kind !== "clash") : found;
    if (play.length) setQueue((q) => [...q, ...play]);
  }, [session, undone, quick]);
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
    const id = setTimeout(done, BACKSTOP_MS);
    const away = () => {
      if (document.hidden) {
        setQueue([]);
        done();
      }
    };
    document.addEventListener("visibilitychange", away);
    return () => {
      clearTimeout(id);
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
            scale={quick ? QUICK_SCALE : 1}
            onDone={done}
          />
        </Suspense>
      )}
    </DirectorContext.Provider>
  );
}
