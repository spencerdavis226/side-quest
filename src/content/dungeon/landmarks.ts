import type { CardDefinition, Jinx, Offer } from "../../game/types";
import { FLOORS, LORE, card, trinket, type Floor } from "./shared";

// Landmarks (The Quest 2.0 Phase 3, 2026-11-14): every region's fifth card
// is one of its three landmarks, a place with a choice and never a roll
// (`inserts` on the region's stage in `dungeon.ts`). The lair's landmark is
// its Approach, and names `{dragon}`. "Elite next" is the fork's loud door:
// the region's next card becomes one of its elites. A plaque with `jinx`
// lays the card's curse only when taken. Lore plaques bring one dragon
// lore (`LORE`); chipping out the Frozen Knight hires him as an ally
// (Phase 4). Plaques the plan marks "remembered" set deeds from Phase 6. The
// Quest only.
const landmark = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  offers: Offer[],
  jinx?: Jinx,
  kind = "Landmark",
): CardDefinition => ({
  ...card(`landmark-${id}`, title, "group", rules),
  ribbon: `${FLOORS[floor]} · ${kind}`,
  ribbonTone: "violet",
  encounter: "shrine",
  offers,
  ...(jinx ? { jinx } : {}),
});
const approach = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  offers: Offer[],
  jinx?: Jinx,
) => landmark(floor, id, title, rules, offers, jinx, "Approach");

/** Each region's three landmarks, keyed by its file's name. */
export const landmarks: Record<string, CardDefinition[]> = {
  cellar: [
    landmark(
      0,
      "gallows-tree",
      "The Gallows Tree",
      "A man on the gallows swears he's innocent. Everyone votes: guilty or not.",
      [{ label: "Free him · drink 2", heal: 1 }, { label: "Ride on" }],
    ),
    landmark(
      0,
      "tourney-field",
      "The Tourney Field",
      "A joust, and they need one more fool. Everyone points at the drawer.",
      [
        { label: "Enter the lists", elite: true },
        { label: "Watch", heal: 1 },
      ],
    ),
    landmark(
      0,
      "toll-keep",
      "The Toll Keep",
      "A baron's keep across the road, and the toll is due. The drawer counts their coins aloud.",
      [
        { label: "Pay the toll", cost: 1, loot: "smoke" },
        { label: "Sneak round", elite: true },
        { label: "Bow · drink 3" },
      ],
    ),
  ],
  wine: [
    landmark(
      3,
      "fairy-court",
      "The Fairy Court",
      "The fair folk offer a gift and never say the price. Everyone bows to the queen.",
      [
        { label: "Accept the gift", cost: 1, loot: "candy" },
        { label: "Decline", heal: 1 },
      ],
    ),
    landmark(
      3,
      "oldest-tree",
      "The Oldest Tree",
      "It has watched every hero pass, and it has notes. The drawer reads them aloud.",
      [
        { label: "Listen · drink 2", ...LORE },
        { label: "Carve your names", heal: 1 },
      ],
    ),
    landmark(
      3,
      "hunters-feast",
      "The Hunter's Feast",
      "A lord's feast in a clearing, and you were not invited. Everyone grabs a bite.",
      [
        { label: "Sit down anyway", heal: 2 },
        { label: "Steal a pie", loot: "draught" },
      ],
    ),
  ],
  brewery: [
    landmark(
      6,
      "sunken-chapel",
      "The Sunken Chapel",
      "A chapel up to its windows in mud, and the bell still rings. Everyone says 'ding'.",
      [
        { label: "Wade in", elite: true },
        { label: "Light a candle", heal: 1 },
      ],
    ),
    landmark(
      6,
      "hags-bargain",
      "The Hag's Bargain",
      "She'll trade something you have for something you need. The drawer shakes her clammy hand.",
      [
        { label: "Trade a heart", cost: 1, loot: "revive" },
        { label: "Refuse" },
      ],
    ),
    landmark(
      6,
      "frog-ferry",
      "The Ferry of Frogs",
      "A raft poled by frogs, and the fare is a song. Everyone croaks the chorus.",
      [
        { label: "Sing · drink 2", loot: "die" },
        { label: "Swim", cost: 1 },
      ],
    ),
  ],
  catacombs: [
    landmark(
      1,
      "dead-ferryman",
      "The Dead Ferryman",
      "He'll row you past the worst of the crypt. Everyone closes their eyes for the crossing.",
      [
        { label: "Pay him", cost: 1, loot: "smoke" },
        { label: "Walk" },
        { label: "Stiff him", loot: "smoke", jinx: true },
      ],
      {
        name: "The Ferryman's Due",
        rule: "The cursed player says 'for the ferryman' before every drink. Forgets: drink 1.",
      },
    ),
    landmark(
      1,
      "hall-of-kings",
      "The Hall of Kings",
      "Twelve dead kings on twelve thrones, one empty. The drawer stares at it a little too long.",
      [
        { label: "Sit in it", elite: true },
        { label: "Bow to each", heal: 1 },
      ],
    ),
    landmark(
      1,
      "weeping-statue",
      "The Weeping Statue",
      "A stone queen weeps real tears, and they heal. Everyone keeps a straight face.",
      [
        { label: "Drink the tears", heal: 3, jinx: true },
        { label: "Leave her be" },
      ],
      {
        name: "Stone Tears",
        rule: "The cursed player sobs loudly before every drink. Forgets: drink 1.",
      },
    ),
  ],
  sewers: [
    landmark(
      4,
      "goblin-market",
      "The Goblin Market",
      "Everything is for sale, and most of it is yours. The drawer checks their pockets.",
      [
        { label: "Buy · drink 3", loot: "die" },
        { label: "Haggle · drink 1", loot: "draught" },
        { label: "Steal", loot: "die", jinx: true },
      ],
      {
        name: "Goblin Grudge",
        rule: "The cursed player keeps one hand over their glass. Slip: drink 1.",
      },
    ),
    landmark(
      4,
      "the-lift",
      "The Lift",
      "A cage on a rusty chain, or a thousand stairs down. Everyone listens to it creak.",
      [{ label: "Ride it", elite: true }, { label: "Stairs · drink 2" }],
    ),
    landmark(
      4,
      "dwarf-ghosts",
      "The Dwarf Ghosts",
      "The old miners want one last shift. Everyone swings an invisible pick on three.",
      [
        { label: "Work it · drink 3", loot: "candy" },
        { label: "Refuse", jinx: true },
      ],
      {
        name: "Haunted Shift",
        rule: "The cursed player whistles a mining song before every drink. Forgets: drink 1.",
      },
    ),
  ],
  freezer: [
    landmark(
      7,
      "room-of-doors",
      "The Room of Doors",
      "Three doors: one hums, one smokes, one is very polite. Everyone picks one aloud.",
      [
        { label: "Humming door", elite: true },
        { label: "Polite door", heal: 1 },
        { label: "Smoking door", cost: 1, ...LORE },
      ],
    ),
    landmark(
      7,
      "the-library",
      "The Library",
      "Every book ever written, all badly shelved. The drawer names the last book they read.",
      [
        { label: "Read · drink 2", loot: "candy" },
        { label: "Borrow one", loot: "die", jinx: true },
      ],
      {
        name: "Overdue",
        rule: "The cursed player shushes anyone who talks over them. Forgets: drink 1.",
      },
    ),
    landmark(
      7,
      "familiars-exam",
      "The Familiar's Exam",
      "The wizard's cat tests you before you may pass. Everyone meows on three.",
      [{ label: "Sit the exam", elite: true }, { label: "Bribe · drink 2" }],
    ),
  ],
  // The lairs' landmarks: the Approaches.
  kitchen: [
    approach(
      5,
      "bone-road",
      "The Bone Road",
      "Empty armor all the way down to {dragon}. Everyone salutes the ones who came first.",
      [
        { label: "Shield · drink 2", loot: "shield" },
        { label: "Read a journal", cost: 1, ...LORE },
      ],
    ),
    approach(
      5,
      "last-forge",
      "The Last Forge",
      "A dwarf smith forges for whoever faces {dragon}. Everyone hammers the table.",
      [
        {
          label: "Reforge",
          cost: 2,
          boon: trinket("Dragonbane", { roll: { boss: 2 } }),
        },
        { label: "Share his ale", heal: 2 },
      ],
    ),
    approach(
      5,
      "hoards-edge",
      "The Hoard's Edge",
      "Gold underfoot already, and all of it {dragon}'s. Everyone tiptoes in silence.",
      [
        { label: "Fill your pockets", loot: "die", jinx: true },
        { label: "Touch nothing" },
      ],
      {
        name: "Dragon Gold",
        rule: "The cursed player jingles their pockets before every drink. Forgets: drink 1.",
      },
    ),
  ],
  rooftop: [
    approach(
      8,
      "frozen-army",
      "The Frozen Army",
      "A hundred knights in ice, swords raised at {dragon}. Everyone freezes for three seconds.",
      [
        { label: "Chip one out", cost: 1, recruit: true },
        { label: "Salute", heal: 1 },
      ],
    ),
    approach(
      8,
      "wind-shrine",
      "The Wind Shrine",
      "Prayer flags, and an old monk who has seen {dragon}. Everyone bows to the wind.",
      [
        { label: "Ask him · drink 2", ...LORE },
        { label: "Hang a flag", heal: 1 },
      ],
    ),
    approach(
      8,
      "glass-bridge",
      "The Glass Bridge",
      "A bridge of clear ice, or the long way round. Everyone holds their breath to cross.",
      [{ label: "Cross", elite: true }, { label: "Go round · drink 3" }],
    ),
  ],
  taproom: [
    approach(
      2,
      "bell-reef",
      "The Bell Reef",
      "Ships' bells hung on the reef by {dragon}. Everyone rings one: 'ding'.",
      [{ label: "Ring one", elite: true }, { label: "Row past" }],
    ),
    approach(
      2,
      "drowned-town",
      "The Drowned Town",
      "Roofs under clear water, and a lamp still lit. Everyone holds their breath to look.",
      [
        { label: "Dive", cost: 1, ...LORE },
        { label: "Sail over", loot: "draught" },
      ],
    ),
    approach(
      2,
      "last-lighthouse",
      "The Last Lighthouse",
      "The keeper is leaving before {dragon} comes back. Everyone waves goodbye to him.",
      [
        {
          label: "Take his lamp",
          boon: trinket("Keeper's Lamp", { roll: { trap: 2 } }),
        },
        { label: "Share his rum", heal: 2 },
      ],
    ),
  ],
};

// The Frozen Knight (The Quest 2.0 Phase 4): chipped out of the ice, he
// joins for the dragon.
const army = landmarks.rooftop.find(
  (c) => c.id === "dungeon.landmark-frozen-army",
)!;
army.ally = {
  name: "The Frozen Knight",
  calling: ["boss"],
  bonus: 3,
  ritual: "The drawer says 'for the king' before every swing.",
};
