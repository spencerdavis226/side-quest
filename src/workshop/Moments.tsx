import { useState } from "react";
import MomentView from "../components/moments/views";
import Ending, { type EndingKind } from "../components/moments/Ending";
import { leagueBadges } from "../presentation/league-art";
import { asset } from "../presentation/theme";
import type { Moment } from "../components/moments/detect";
import type { SessionState } from "../game/types";
import roadSave from "../../tests/fixtures/saves/2026-11-14-realms-road-choice-waiting.json?raw";
import roadTaken from "../../tests/fixtures/saves/2026-11-14-realms-road-chosen.json?raw";
import "../presentation/theme.css";
import "../style.css";
import "../presentation/crawl.css";
import "../presentation/moments.css";
import "../presentation/card-front.css";

// Dev-only moments stage (`?moments=1`, 2026-11-01): a button per moment and
// variant over a stand-in table, with a slow-motion toggle, for reviewing
// and screenshotting each moment. Never shipped (`check-budget.ts`).

const SAMPLES: Moment[] = [
  { kind: "natural", key: "n20", nat: 20, say: "" },
  { kind: "natural", key: "n1", nat: 1, say: "" },
  {
    kind: "evolution",
    key: "evo",
    league: true,
    from: "Charmander",
    to: "Charmeleon",
    kicker: "What? Charmander is evolving!",
    change: "Max HP 16 → 18. Fire rolls +1.",
    fromType: "fire",
    toType: "fire",
    say: "",
  },
  {
    kind: "evolution",
    key: "eevee",
    league: true,
    from: "Eevee",
    to: "Vaporeon",
    kicker: "What? Eevee is evolving!",
    change: "Max HP 16 → 19.",
    fromType: "normal",
    toType: "water",
    say: "",
  },
  {
    kind: "evolution",
    key: "lvl",
    league: false,
    from: "Bard",
    to: "Bard, level 2",
    kicker: "Bard levels up!",
    change: "+1 to every roll.",
    say: "",
  },
  {
    kind: "entrance",
    key: "gym",
    style: "gym",
    league: true,
    kicker: "Gym 2",
    title: "Misty",
    foe: { name: "Misty", type: "water" },
    hero: { name: "Charmeleon", type: "fire" },
    hearts: 12,
    max: 16,
    heartsWord: "Team HP",
    badge: { name: "Cascade Badge", art: asset("art/badges/cascade.webp") },
    say: "",
  },
  {
    kind: "entrance",
    key: "e4",
    style: "elite",
    league: true,
    kicker: "Elite Four · 2 of 4",
    title: "Karen",
    foe: { name: "Karen", type: "dark" },
    hero: { name: "Charizard", type: "fire" },
    hearts: 9,
    max: 18,
    heartsWord: "Team HP",
    say: "",
  },
  {
    kind: "entrance",
    key: "champ",
    style: "champion",
    league: true,
    kicker: "Champion",
    title: "Lance",
    foe: { name: "Lance", type: "dragon" },
    hero: { name: "Charizard", type: "fire" },
    hearts: 9,
    max: 18,
    heartsWord: "Team HP",
    say: "",
  },
  {
    kind: "entrance",
    key: "legend",
    style: "legendary",
    league: true,
    kicker: "A Legendary appears",
    title: "Mewtwo",
    foe: { name: "Mewtwo", type: "psychic" },
    hearts: 9,
    max: 18,
    heartsWord: "Team HP",
    say: "",
  },
  {
    kind: "entrance",
    key: "boss",
    style: "boss",
    league: false,
    kicker: "Cellar boss",
    title: "The Rat King",
    foe: { name: "The Rat King" },
    hero: { name: "Bard" },
    hearts: 10,
    max: 12,
    heartsWord: "Hearts",
    say: "",
  },
  {
    kind: "entrance",
    key: "final",
    style: "final",
    league: false,
    kicker: "Last Call",
    title: "The Landlord",
    foe: { name: "The Landlord" },
    hearts: 4,
    max: 12,
    heartsWord: "Hearts",
    say: "",
  },
  {
    kind: "entrance",
    key: "ambush",
    style: "ambush",
    league: false,
    kicker: "Ambush",
    title: "Skeleton Barback",
    foe: { name: "Skeleton Barback" },
    hearts: 8,
    max: 12,
    heartsWord: "Hearts",
    say: "",
  },
  {
    kind: "clash",
    key: "adv",
    mine: "water",
    theirs: "fire",
    edge: "advantage",
    strike: false,
    say: "",
  },
  {
    kind: "clash",
    key: "dis",
    mine: "fire",
    theirs: "water",
    edge: "disadvantage",
    strike: true,
    say: "",
  },
  {
    kind: "clash",
    key: "even",
    mine: "fire",
    theirs: "normal",
    edge: "even",
    strike: false,
    say: "",
  },
  { kind: "sendin", key: "send", name: "Vulpix", type: "fire", say: "" },
  {
    kind: "omen",
    key: "omen",
    league: true,
    title: "Squirtle",
    type: "water",
    say: "",
  },
  { kind: "omen", key: "tarot", league: false, title: "Blood Moon", say: "" },
  {
    kind: "badge",
    key: "badge",
    name: "Cascade Badge",
    art: asset("art/badges/cascade.webp"),
    type: "water",
    earned: 2,
    of: 8,
    say: "",
  },
  {
    kind: "loot",
    key: "loot",
    name: "Potion",
    icon: "draught",
    tier: "bronze",
    kicker: "Bag",
    more: 0,
    packId: "pokemon",
    say: "",
  },
  {
    kind: "loot",
    key: "gear",
    name: "Bottle Opener of Smiting",
    icon: "weapon",
    tier: "gold",
    kicker: "Weapon",
    more: 1,
    packId: "dungeon",
    say: "",
  },
  {
    kind: "faint",
    key: "faint",
    name: "Vulpix",
    type: "fire",
    line: "Gone for good. The drawer drinks 2.",
    say: "",
  },
  {
    kind: "join",
    key: "hatch",
    name: "Togepi",
    type: "fairy",
    hatched: true,
    say: "",
  },
  {
    kind: "join",
    key: "caught",
    name: "Rayquaza",
    type: "dragon",
    hatched: false,
    say: "",
  },
  {
    kind: "jinx",
    key: "jinx",
    lifted: false,
    packId: "dungeon",
    kicker: "Jinxed!",
    // The longest jinx in the catalog (2026-11-01).
    name: "Freezer Burn",
    rule: "The jinxed player clutches their head and says 'brain freeze' after every sip. Forgets: drink 1.",
    say: "",
  },
  {
    kind: "jinx",
    key: "lifted",
    lifted: true,
    packId: "dungeon",
    kicker: "Jinx",
    name: "Freezer Burn",
    rule: "The jinx lifts",
    say: "",
  },
  { kind: "doubles", key: "pair", faces: [4, 4], sides: 6, win: true, say: "" },
  {
    kind: "doubles",
    key: "pair-plain",
    faces: [2, 2],
    sides: 6,
    win: false,
    say: "",
  },
  {
    kind: "milestone",
    key: "opening",
    kicker: "Raise your glasses",
    title: "Game on",
    line: "",
    opening: true,
    say: "",
  },
  {
    kind: "door",
    key: "door",
    kicker: "Behind the bookcase",
    title: "The Speakeasy",
    wanted: "Wanted: The Proprietor",
    say: "",
  },
  { kind: "press", key: "ride", bust: false, banked: 2, say: "" },
  { kind: "press", key: "bust", bust: true, banked: 2, say: "" },
  {
    kind: "thread",
    key: "thread",
    league: false,
    line: "One heart left.",
    say: "",
  },
  {
    kind: "thread",
    key: "thread-hp",
    league: true,
    line: "1 HP left.",
    say: "",
  },
  {
    kind: "milestone",
    key: "half",
    kicker: "25 cards left",
    title: "Halfway",
    line: "Refill the glasses.",
    say: "",
  },
];

// The Quest's moments (The Quest 2.1): every one built in Quest 2.0, on a
// real saved run for the map.
const mapQuest = (JSON.parse(roadSave) as SessionState).quest!;
const roadQuest = (JSON.parse(roadTaken) as SessionState).quest!;
const EMBERFANG = "dungeon.last-call-lich";
const RIMECLAW = "dungeon.bartender-below";
const BRINE = "dungeon.final-tab";
const QUEST: Moment[] = [
  {
    kind: "wanted",
    key: "wanted",
    id: EMBERFANG,
    dragon: "Emberfang",
    lair: "The Fire Caverns",
    say: "",
  },
  {
    kind: "wanted",
    key: "wanted-long",
    id: "dungeon.two-am-kebab",
    dragon: "Gorgrath the Hungry",
    lair: "The Fire Caverns",
    say: "",
  },
  { kind: "shadow", key: "shadow", id: RIMECLAW, dragon: "Rimeclaw", say: "" },
  { kind: "map", key: "map", quest: mapQuest, title: "The Road Out", say: "" },
  {
    kind: "road",
    key: "road",
    quest: roadQuest,
    region: "The Old Forest",
    words: "Bargains, healing, curses",
    say: "",
  },
  {
    kind: "lore",
    key: "lore",
    id: EMBERFANG,
    dragon: "Emberfang",
    line: "Its left wing never healed.",
    count: 1,
    say: "",
  },
  {
    kind: "lore",
    key: "lore-3",
    id: BRINE,
    dragon: "Old Mother Brine",
    line: "Her name is the tide table.",
    count: 3,
    say: "",
  },
  {
    kind: "ally",
    key: "ally",
    name: "Gertie the Goat",
    line: "Everyone bleats when the party heals. Silent: drink 1.",
    say: "",
  },
  {
    kind: "sendin",
    key: "send-ally",
    name: "Durla Ironbraid",
    bonus: "+3",
    ally: true,
    say: "",
  },
  {
    kind: "fallen",
    key: "fallen",
    name: "Pip the Cabin Boy",
    stand: false,
    line: "Pour one out. The drawer drinks 2.",
    say: "",
  },
  {
    kind: "fallen",
    key: "fallen-stand",
    name: "The Frozen Knight",
    stand: true,
    line: "The party stands on one heart.",
    say: "",
  },
  {
    kind: "echo",
    key: "echo",
    title: "The Hanged Man Returns",
    earlier: "The Gallows Tree",
    say: "",
  },
  {
    kind: "hidden",
    key: "hidden",
    line: "It follows you home.",
    counter: "3 of 8 found",
    say: "",
  },
  { kind: "deed", key: "deed", say: "" },
  {
    kind: "dragonmove",
    key: "move",
    id: EMBERFANG,
    dragon: "Emberfang",
    name: "Fire Breath",
    enraged: false,
    effect: "hurt",
    say: "",
  },
  {
    kind: "dragonmove",
    key: "move-enraged",
    id: RIMECLAW,
    dragon: "Rimeclaw",
    name: "Snow Blind",
    enraged: true,
    effect: "harder",
    say: "",
  },
  {
    kind: "swing",
    key: "swing-hit",
    id: "dungeon.last-call-lich",
    hit: true,
    scales: 1,
    say: "",
  },
  {
    kind: "swing",
    key: "swing-miss",
    id: "dungeon.bartender-below",
    hit: false,
    scales: 0,
    say: "",
  },
  {
    kind: "enraged",
    key: "enraged",
    id: EMBERFANG,
    dragon: "Emberfang",
    line: "Out-roar it.",
    say: "",
  },
  {
    kind: "entrance",
    key: "dragon",
    style: "final",
    league: false,
    kicker: "It's awake",
    title: "Stormcrown",
    foe: { name: "Stormcrown" },
    hero: { name: "Wizard" },
    hearts: 6,
    max: 12,
    heartsWord: "hearts",
    dragon: { id: "dungeon.surge-pricing", scales: 7, lore: 2 },
    say: "",
  },
  {
    kind: "entrance",
    key: "region-boss",
    style: "boss",
    league: false,
    kicker: "King's Road boss",
    title: "The Bridge Troll",
    foe: { name: "The Bridge Troll" },
    hero: { name: "Ranger" },
    hearts: 9,
    max: 12,
    heartsWord: "hearts",
    say: "",
  },
  {
    kind: "evolution",
    key: "rank",
    league: false,
    from: "Ranger",
    to: "Tracker",
    kicker: "Ranger ranks up!",
    change: "+1 to ambush d20s.",
    line: "Everyone howls.",
    say: "",
  },
];

const gyms = Object.keys(leagueBadges).slice(0, 8);
// A finished run's record, enough for the endings to lay out.
const RECORD = {
  form: { title: "Charizard", type: "fire" },
  badges: { earned: 8, of: 8 },
  party: { hearts: 7, max: 18, team: ["a", "b"], wiped: false },
  stages: [
    {
      boss: true,
      trophy: true,
      cards: gyms.map((id) => ({
        id,
        title: id.split("-").pop(),
        quest: "pokemon",
        type: "water",
      })),
    },
    {
      boss: true,
      trophy: true,
      cards: [
        { id: "x1", title: "The Rat King" },
        { id: "x2", title: "Brewmaster Grub" },
        { id: "x3", title: "The Landlord" },
      ],
    },
  ],
} as unknown as Parameters<typeof Ending>[0]["record"];
const ENDINGS: EndingKind[] = [
  "hall",
  "survived",
  "whiteout",
  "wiped",
  "toast",
];

export default function Moments() {
  const params = new URLSearchParams(location.search);
  const [playing, setPlaying] = useState<{ m: Moment; n: number } | null>(
    () => {
      const want = params.get("play");
      const m = [...SAMPLES, ...QUEST].find((s) => s.key === want);
      return m ? { m, n: 0 } : null;
    },
  );
  const [slow, setSlow] = useState(Number(params.get("slow") ?? 1));
  const [ending, setEnding] = useState<{ kind: EndingKind; n: number } | null>(
    () => {
      const want = params.get("ending") as EndingKind | null;
      return want ? { kind: want, n: 0 } : null;
    },
  );
  return (
    <main
      className="app playing moments-workshop"
      data-testid="moments-workshop"
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at 50% 40%, #3a2a1c, #120c08)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          padding: 16,
        }}
      >
        <label style={{ color: "#fff", width: "100%" }}>
          Speed{" "}
          <select
            value={slow}
            onChange={(e) => setSlow(Number(e.target.value))}
          >
            <option value={1}>1x</option>
            <option value={0.6}>Quick (0.6)</option>
            <option value={4}>0.25x</option>
          </select>
        </label>
        {[...SAMPLES, ...QUEST].map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setPlaying((p) => ({ m, n: (p?.n ?? 0) + 1 }))}
          >
            {m.kind} · {m.key}
          </button>
        ))}
      </div>
      <div
        style={{ position: "relative", display: "flex", gap: 8, padding: 16 }}
      >
        {ENDINGS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => setEnding((e) => ({ kind, n: (e?.n ?? 0) + 1 }))}
          >
            ending · {kind}
          </button>
        ))}
      </div>
      {ending && (
        <Ending
          key={`${ending.kind}-${ending.n}`}
          kind={ending.kind}
          record={RECORD}
          packId={params.get("pack") ?? "pokemon"}
          count={64}
          ballad={
            params.get("pack") === "dungeon"
              ? [
                  "A Lord of Feasts left by the King's Road,",
                  "felled the Ogre and the Bone Golem,",
                  "with Gertie the Goat at their side,",
                  "and slew Stormcrown with 6 hearts to spare.",
                ]
              : undefined
          }
          singleBlow={params.get("blow") === "1"}
          dragon={
            params.get("pack") === "dungeon"
              ? "dungeon.surge-pricing"
              : undefined
          }
          title={
            params.get("pack") === "dungeon"
              ? ending.kind === "wiped"
                ? ["The party", "has fallen."]
                : ["Stormcrown", "is slain."]
              : ending.kind === "whiteout"
                ? ["Whited", "out."]
                : ending.kind === "wiped"
                  ? ["Party", "wiped."]
                  : ["Last call,", "survived."]
          }
          onDone={() => setEnding(null)}
        />
      )}
      {playing && (
        <MomentView
          key={`${playing.m.key}-${playing.n}`}
          moment={playing.m}
          scale={slow}
          onDone={() => setPlaying(null)}
        />
      )}
    </main>
  );
}
