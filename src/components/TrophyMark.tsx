import type { ReactNode } from "react";
import { questArt, type QuestArt } from "../presentation/quest-art.generated";

/** A trophy's mark (The Quest 2.1): the dragon's own, the Company's capes,
 * or a mark for the kind of boss, read from its title. */
const TROPHY_MARKS: [RegExp, QuestArt][] = [
  [/Hydra|Serpent|Deep Worm/, "boss-hydra"],
  [/Frog/, "boss-frog"],
  [/Bone|Dancing Dead/, "boss-skeleton"],
  [/Lich|Barrow|Crypt|Wight/, "boss-dead"],
  [/Troll|Ogre/, "boss-troll"],
  [/Boar/, "boss-boar"],
  [/Headless|Knight/, "boss-knight"],
  [/Tower/, "boss-tower"],
  [/Archmage|Alchemist|Apprentice/, "boss-wizard"],
  [/Puppet/, "boss-puppet"],
  [/Mine Lord|Rock Worm/, "boss-mine"],
  [/Goblin/, "goblin"],
  [/Wolf/, "boss-wolf"],
  [/Bear/, "boss-bear"],
  [/Faerie|Fairy/, "fairy"],
  [/Wood|Tree/, "boss-tree"],
  [/Witch|Hex|Mother/, "boss-witch"],
  [/Golem|Guardian/, "golem"],
  [/Baron|Mag|Robber|Bandit/, "bandit"],
];
function trophyMark(card: {
  title: string;
  lairFight?: unknown;
  ribbon?: string;
}): QuestArt | null {
  if (card.lairFight) return "dragon";
  // The rival's duel (2026-11-15) hangs their capes.
  if (/ · (Rival|Duel)$/.test(card.ribbon ?? "")) return "capes";
  return TROPHY_MARKS.find(([re]) => re.test(card.title))?.[1] ?? null;
}

/** The mark, or `fallback` for a boss with no mark of its own. Lazy, from
 * `Crawl.tsx`'s trophy wall. */
export default function TrophyMark({
  card,
  fallback,
}: {
  card: { title: string; lairFight?: unknown; ribbon?: string };
  fallback: ReactNode;
}) {
  const mark = trophyMark(card);
  if (!mark) return <>{fallback}</>;
  return (
    <svg className="trophy-mark" viewBox="0 0 512 512">
      <path d={questArt[mark]} />
    </svg>
  );
}
