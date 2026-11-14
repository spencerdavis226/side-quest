import { questArt, type QuestArt } from "../presentation/quest-art.generated";

// A landmark's mark on its banner (The Quest 2.1): the place drawn in ink
// as it is reached. Lazy, from `StageBanner.tsx`, so the emblem sprite
// stays out of the first load.
const MARKS: [RegExp, QuestArt][] = [
  [/Gallows/, "mark-gallows"],
  [/Tourney/, "mark-tourney"],
  [/Toll/, "mark-toll"],
  [/Fairy/, "mark-fairy"],
  [/Oldest Tree/, "mark-tree"],
  [/Feast/, "mark-feast"],
  [/Chapel/, "mark-chapel"],
  [/Hag/, "mark-hag"],
  [/Frog/, "mark-frog"],
  [/Ferryman/, "mark-ferry"],
  [/Hall of Kings/, "mark-kings"],
  [/Statue/, "mark-statue"],
  [/Market/, "mark-market"],
  [/Lift/, "mark-lift"],
  [/Ghosts/, "mark-ghosts"],
  [/Doors/, "mark-doors"],
  [/Library/, "mark-library"],
  [/Familiar/, "mark-cat"],
  [/Bone Road/, "mark-bones"],
  [/Forge/, "mark-forge"],
  [/Hoard/, "mark-hoard"],
  [/Frozen Army/, "mark-army"],
  [/Wind Shrine/, "mark-shrine"],
  [/Bridge/, "mark-bridge"],
  [/Bell/, "mark-bells"],
  [/Drowned Town/, "mark-town"],
  [/Lighthouse/, "mark-lighthouse"],
];

export default function LandmarkMark({ title }: { title: string }) {
  const mark = MARKS.find(([re]) => re.test(title))?.[1];
  if (!mark) return null;
  return (
    <svg className="landmark-mark" viewBox="0 0 512 512" aria-hidden="true">
      <path d={questArt[mark]} />
    </svg>
  );
}
