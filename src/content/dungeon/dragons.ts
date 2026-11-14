import type { CardDefinition } from "../../game/types";
import { dragon, move } from "./shared";

// The dragons as lair fights (The Quest 2.0 Phase 2, 2026-11-13). Each
// round the dragon makes a move (the card's ribbon and rules), the table
// does it, and the drawer swings with the d20 below. At half health the
// table plays the enrage contest; after it the enraged moves are used.
// Every list follows one shape: calm, two moves that cost a heart, one that
// makes the swing 2 harder, three for the table only; enraged, one that
// costs 2, two that cost 1, one 2 harder, one for the table, one 2 easier.
// Card IDs are the old Last Call bosses' (and Tidewrack's), so the King's
// Summons, the lairs and the saves still name them. Written from each
// dragon's personality (`docs/QUEST_2_PLAN.md` 4.3); lore arrives in Phase 4.

const ONE = { damage: 1 } as const;
const TWO = { damage: 2 } as const;
const HARDER = { harder: 2 } as const;
const EASIER = { harder: -2 } as const;

export const dragons: CardDefinition[] = [
  // Proud, loud, greedy.
  dragon(
    "last-call-lich",
    "Emberfang",
    "A red dragon uncoils from a hill of gold, and the air catches fire. Roll d20.",
    {
      miss: "Fire, everywhere. Drink 3.",
      hit: "Your blade finds a loose scale. Give 4.",
      crit: "You cut a wing. Everyone else drinks 4.",
      fumble: "It sits on you. Drink 6.",
    },
    {
      calm: [
        move(
          "Fire Breath",
          "Everyone drinks 2. Glasses held up as shields drink 1 instead.",
          ONE,
        ),
        move("Tail Swipe", "The drawer's two neighbors drink 3."),
        move(
          "Takes Flight",
          "It circles overhead. Everyone looks up until the roll. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Gold Fever",
          "Everyone points at the greediest player. Most fingers drinks 3.",
        ),
        move("Roar", "Last to cover both ears drinks 3."),
        move(
          "Hoard Slide",
          "A wave of coins. Last to lift both feet drinks 3.",
          ONE,
        ),
      ],
      enraged: [
        move("Inferno", "Everyone drinks 3.", TWO),
        move("Wing Buffet", "Everyone leans back. Last to lean drinks 3.", ONE),
        move(
          "Molten Gold",
          "The drawer and whoever they point at drink 3.",
          ONE,
        ),
        move(
          "Smoke",
          "Eyes shut until the roll. Peek: drink 2. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Mocking Laugh",
          "Everyone laughs like a dragon. Weakest laugh, by vote, drinks 3.",
        ),
        move(
          "Counts Its Gold",
          "It turns its back to count its gold. This swing is 2 easier.",
          EASIER,
        ),
      ],
      contest:
        "Out-roar it: everyone roars for five seconds. Anyone stops early: Lost, and they drink 4.",
      lore: [
        "Its left wing never healed.",
        "It hates the sound of bells.",
        "Its true name is Cinder, and it hates it.",
      ],
    },
  ),
  // Eats everything.
  dragon(
    "two-am-kebab",
    "Gorgrath the Hungry",
    "It has eaten three knights today, and it's still hungry. It's looking at you. Roll d20.",
    {
      miss: "A bite. Drink 3.",
      hit: "You jam a spear in its jaw. Give 4.",
      crit: "It chokes on the spear. Everyone else drinks 4.",
      fumble: "It swallows you whole, then spits you out. Drink 6.",
    },
    {
      calm: [
        move(
          "Snatch",
          "It eats the drawer's drink. Pour them a new one; they drink 2 of it.",
          ONE,
        ),
        move(
          "Sniff",
          "It sniffs for dinner. Everyone freezes; first to move drinks 3.",
        ),
        move(
          "Gnaw",
          "Everyone chews loudly until the roll. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Glass Swap",
          "Everyone passes their drink left and sips the new one.",
        ),
        move(
          "Feeding Time",
          "The drawer gives their left neighbor a sip from their glass. Spill any: drink 3.",
        ),
        move(
          "Belly Rumble",
          "The floor shakes. Last to grab the table drinks 3.",
          ONE,
        ),
      ],
      enraged: [
        move("Devour", "Everyone drinks 3.", TWO),
        move("Gulp", "The drawer's two neighbors drink 3.", ONE),
        move(
          "Crunch",
          "Last to hide their glass under the table drinks 3.",
          ONE,
        ),
        move(
          "Full Mouth",
          "Everyone puffs out their cheeks until the roll. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Second Helping",
          "The drawer names a food. Everyone who ate it today drinks 2.",
        ),
        move("Food Coma", "It yawns, stuffed. This swing is 2 easier.", EASIER),
      ],
      contest:
        "Everyone names a food in turn, twice round. A stall or repeat: Lost, and that player drinks 4.",
      lore: [
        "It chews on the left.",
        "It cannot stand a full plate left alone.",
        "Its mother called it Pudding.",
      ],
    },
  ),
  // Tired, patient, has seen it all.
  dragon(
    "the-morning-after",
    "Ashmaw the Ancient",
    "The oldest dragon there is, and it has been waiting for you in particular. Roll d20.",
    {
      miss: "It remembers you. Drink 3.",
      hit: "You surprise it, and nothing surprises it. Give 4.",
      crit: "It laughs, and you strike its throat. Everyone else drinks 4.",
      fumble: "It yawns, and you fall in. Drink 6 and a glass of water.",
    },
    {
      calm: [
        move("Ancient Flame", "Slow, old fire. Everyone drinks 2.", ONE),
        move(
          "Old Story",
          "It begins a story. Nobody speaks until the roll. Speak: drink 2.",
        ),
        move(
          "Patience",
          "The drawer counts slowly to ten before rolling. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Long Memory",
          "Everyone who drank on the last card drinks 2 more.",
        ),
        move(
          "Said It Before",
          "The drawer says a sentence. Anyone who repeats a word of it before the roll drinks 3.",
        ),
        move(
          "Dust of Ages",
          "Dust everywhere. Everyone blows on their glass; last to blow drinks 3.",
          ONE,
        ),
      ],
      enraged: [
        move("Age of Fire", "Everyone drinks 3.", TWO),
        move(
          "Forgotten Kings",
          "Everyone names a king in turn. Stall or repeat: drink 3.",
          ONE,
        ),
        move(
          "Crushing Years",
          "The oldest and the youngest players drink 3.",
          ONE,
        ),
        move(
          "Eclipse",
          "The sun goes out. Eyes shut until the roll. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Silence",
          "Not a word from anyone until the roll. Speak: drink 3.",
        ),
        move(
          "Dozes Off",
          "It nods off mid-fight. This swing is 2 easier.",
          EASIER,
        ),
      ],
      contest:
        "Everyone tells it something new. The drawer calls any dud: Lost, and that player drinks 4.",
      lore: [
        "The oldest scale is loose.",
        "It fears being forgotten.",
        "Its name is the first word anyone spoke.",
      ],
    },
  ),
  // Cold and still.
  dragon(
    "bartender-below",
    "Rimeclaw",
    "A white dragon in the frozen dark, with eyes like old ice. Roll d20.",
    {
      miss: "Frostbite. Drink 3.",
      hit: "You chip a claw. Give 4.",
      crit: "Its breath freezes its own jaw shut. Everyone else drinks 4.",
      fumble: "Frozen to the floor. Drink 6.",
    },
    {
      calm: [
        move(
          "Frost Breath",
          "Everyone drinks 2. A glass held in both hands drinks 1 instead.",
          ONE,
        ),
        move(
          "Freeze",
          "Everyone freezes. First to move before the roll drinks 3.",
        ),
        move(
          "Ice Wall",
          "The drawer rolls with their other hand. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Cold Stare",
          "The drawer and their left neighbor stare. First to blink drinks 3.",
        ),
        move(
          "Hail",
          "Everyone drums the table like hail. When the drawer stops, last to stop drinks 3.",
        ),
        move(
          "Black Ice",
          "Last to put both feet flat on the floor drinks 3.",
          ONE,
        ),
      ],
      enraged: [
        move("Blizzard", "Everyone drinks 3.", TWO),
        move(
          "Deep Freeze",
          "Everyone freezes. First to move before the roll drinks 4.",
          ONE,
        ),
        move("Ice Spikes", "The drawer and both neighbors drink 3.", ONE),
        move(
          "Snow Blind",
          "Everyone covers one eye until the roll. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Shatter",
          "Everyone clinks glasses, hard. Spill a drop: drink 3.",
        ),
        move(
          "Thin Ice",
          "It cracks the ice under itself. This swing is 2 easier.",
          EASIER,
        ),
      ],
      contest:
        "Everyone freezes for ten seconds, silent. Anyone moves or laughs: Lost, and they drink 4.",
      lore: [
        "The ice on its throat is thin.",
        "It fears a warm hand.",
        "Its name is the sound of a lake cracking.",
      ],
    },
  ),
  // Fast and showy.
  dragon(
    "surge-pricing",
    "Stormcrown",
    "A blue dragon riding its own storm, crackling with every breath. Roll d20.",
    {
      miss: "Struck by lightning. Drink 3.",
      hit: "You ground it with your sword. Give 4.",
      crit: "Its own lightning finds it. Everyone else drinks 4.",
      fumble: "You were holding your sword up. Drink 6.",
    },
    {
      calm: [
        move("Lightning", "On three, everyone claps. Last clap drinks 2.", ONE),
        move(
          "Thunder",
          "Count to five around the table, fast. A miss drinks 3.",
        ),
        move(
          "Gale",
          "Everyone holds their glass down until the roll. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Showboat",
          "Everyone strikes a pose. The table votes the worst, who drinks 3.",
        ),
        move("Static", "Whoever touches a neighbor before the roll drinks 3."),
        move(
          "Chain Lightning",
          "The drawer drinks 1, the next player clockwise 2, the next 3.",
          ONE,
        ),
      ],
      enraged: [
        move("Supercell", "Everyone drinks 3.", TWO),
        move(
          "Ball Lightning",
          "Pass a cup clockwise until the drawer says stop. Whoever holds it drinks 3.",
          ONE,
        ),
        move(
          "Thunderclap",
          "On three, everyone slaps the table. Last slap drinks 3.",
          ONE,
        ),
        move(
          "Eye of the Storm",
          "Everyone spins once in their seat before the roll. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Rolling Thunder",
          "Everyone drums the table faster and faster. First to stop drinks 3.",
        ),
        move(
          "Spent Spark",
          "Its storm sputters out. This swing is 2 easier.",
          EASIER,
        ),
      ],
      contest:
        "Count to ten around the table, clapping on every third number. A miss: Lost; that player drinks 4.",
      lore: [
        "One horn is cracked.",
        "It fears a clear sky.",
        "Its name is Crackle.",
      ],
    },
  ),
  // Vain.
  dragon(
    "house-lights",
    "Glimmerwing",
    "A golden dragon who wants to be admired first and fought second. Roll d20.",
    {
      miss: "Blinded by the shine. Drink 3.",
      hit: "You call it ugly. It staggers. Give 4.",
      crit: "You show it a mirror. Everyone else drinks 4.",
      fumble: "You stop to admire yourself in its scales. Drink 6.",
    },
    {
      calm: [
        move("Dazzle", "Everyone shields their eyes. Last to drinks 2.", ONE),
        move(
          "Compliment Me",
          "The drawer compliments it. If the table boos, the drawer drinks 3.",
        ),
        move(
          "Pose",
          "It strikes a pose. Everyone copies it until the roll. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Mirror Mirror",
          "The drawer copies their left neighbor's moves until the roll. Slip: drink 3.",
        ),
        move("Preening", "Everyone fixes their hair. Last to drinks 3."),
        move(
          "Golden Glare",
          "Whoever wears the most gold or yellow drinks 3.",
          ONE,
        ),
      ],
      enraged: [
        move("Blinding Flash", "Everyone drinks 3.", TWO),
        move(
          "Jealous Wing",
          "The best-dressed player, by vote, drinks 3.",
          ONE,
        ),
        move(
          "Gilded Claw",
          "Everyone wearing jewelry drinks 3. Nobody? The drawer drinks 3.",
          ONE,
        ),
        move(
          "Prism",
          "Light everywhere. Everyone squints until the roll. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Vanity",
          "Everyone says one nice thing about it. A dud drinks 3.",
        ),
        move(
          "Distracted",
          "It stops to admire itself in a puddle. This swing is 2 easier.",
          EASIER,
        ),
      ],
      contest:
        "Everyone compliments it, in turn. A stall or a repeat: Lost, and that player drinks 4.",
      lore: [
        "The gold is paint on its belly.",
        "It fears a mirror at dawn.",
        "Its name is Gladys.",
      ],
    },
  ),
  // Riddling, motherly, hungry.
  dragon(
    "final-tab",
    "Old Mother Brine",
    "Older than the sea and twice as wet. She has eaten heroes for lunch. Roll d20.",
    {
      miss: "Swallowed, then spat out. Drink 3.",
      hit: "You tangle her in the kelp. Give 4.",
      crit: "She chokes on your boot. Everyone else drinks 4.",
      fumble: "She tucks you in, under the sea. Drink 6.",
    },
    {
      calm: [
        move(
          "Undertow",
          "Everyone sways left, then right. Last to sway drinks 2.",
          ONE,
        ),
        move(
          "Riddle",
          "The left neighbor asks a riddle; the drawer has ten seconds. Wrong: drink 3.",
        ),
        move(
          "Seaweed Wrap",
          "Everyone holds hands with their neighbors until the roll. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Say Please",
          "Everyone says please before speaking, until the roll. Forget: drink 3.",
        ),
        move(
          "Mother Knows",
          "Everyone points at who needs a nap. Most fingers drinks 3.",
        ),
        move("Tidal Slap", "The drawer's two neighbors drink 2.", ONE),
      ],
      enraged: [
        move("Tidal Wave", "Everyone drinks 3.", TWO),
        move(
          "Hungry Again",
          "She eats the drawer's supper. The drawer drinks 3.",
          ONE,
        ),
        move(
          "Drag Under",
          "Last to set their glass on the floor drinks 3.",
          ONE,
        ),
        move(
          "Ink Cloud",
          "Everyone hides their face in their hands until the roll. This swing is 2 harder.",
          HARDER,
        ),
        move("Lullaby", "Everyone hums a lullaby. First to laugh drinks 3."),
        move(
          "Too Full",
          "She burps up a sailor and loses her place. This swing is 2 easier.",
          EASIER,
        ),
      ],
      contest:
        "The left neighbor asks a riddle. Ten seconds: wrong or silent is Lost, and the drawer drinks 4.",
      lore: [
        "Barnacles hide a soft spot.",
        "She fears her own daughters.",
        "Her name is the tide table.",
      ],
    },
  ),
  // Knows your secrets.
  dragon(
    "the-group-chat",
    "The Whispering Wyrm",
    "A dragon that speaks in your own voice and tells your secrets. Roll d20.",
    {
      miss: "It tells one. Drink 3.",
      hit: "You talk louder. Give 4.",
      crit: "You tell its secrets. Everyone else drinks 4.",
      fumble: "It tells all of yours. Drink 6.",
    },
    {
      calm: [
        move(
          "Whisper",
          "Everyone whispers until the roll. Speak up: drink 2.",
          ONE,
        ),
        move(
          "A Secret",
          "The drawer whispers a secret to their left neighbor, who rates it. Dull: drink 3.",
        ),
        move(
          "Coil",
          "Everyone hugs themselves until the roll. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Hiss",
          "Everyone hisses. When the drawer stops, last to stop drinks 3.",
        ),
        move(
          "Rumor",
          "Everyone points at who keeps the most secrets. Most fingers drinks 3.",
        ),
        move("Tell-Tale", "Whoever spoke last before this card drinks 3.", ONE),
      ],
      enraged: [
        move("Scream", "Everyone drinks 3.", TWO),
        move(
          "Confession",
          "Everyone confesses one small thing. Refuse: drink 3.",
          ONE,
        ),
        move(
          "Every Name",
          "The drawer names everyone at the table in five seconds. Miss one: drink 3.",
          ONE,
        ),
        move(
          "Stolen Voice",
          "It speaks as the drawer, who may not talk until the roll. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Overheard",
          "Everyone repeats the last thing someone said. Wrong: drink 3.",
        ),
        move(
          "Gossip",
          "It stops to gossip with itself. This swing is 2 easier.",
          EASIER,
        ),
      ],
      contest:
        "Everyone confesses one small thing, in turn. Anyone refuses: Lost, and they drink 4.",
      lore: [
        "It has no scales under the jaw.",
        "It fears being overheard.",
        "Its name is the thing you never said.",
      ],
    },
    {
      jinx: {
        name: "Tongue-Tied",
        rule: "The cursed player can only mime. Say a word: drink 1.",
      },
    },
  ),
  // Wrecks ships for their bells.
  dragon(
    "dragon-tidewrack",
    "Tidewrack",
    "A sea dragon hung with the bells of every ship it sank. They all ring. Roll d20.",
    {
      miss: "A wave of bells breaks over you. Drink 3.",
      hit: "You cut a bell loose. It sinks. Give 4.",
      crit: "It rings its own bell and goes deaf. Everyone else drinks 4.",
      fumble: "You're hung on the reef like a bell. Drink 6.",
    },
    {
      calm: [
        move(
          "Rocking Deck",
          "Everyone sways with the waves until the roll. Stop: drink 2.",
          ONE,
        ),
        move("Bail!", "Everyone mimes bailing water. Last to start drinks 3."),
        move(
          "Heavy Swell",
          "Everyone holds their glass with one finger until the roll. This swing is 2 harder.",
          HARDER,
        ),
        move("Fog Bell", "Everyone rings a pretend bell. Last ding drinks 3."),
        move(
          "Shanty",
          "The drawer starts a shanty; everyone joins. First to stop drinks 3.",
        ),
        move(
          "Man Overboard",
          "The drawer's left neighbor is overboard. They drink 3 to climb back.",
          ONE,
        ),
      ],
      enraged: [
        move("Shipwreck", "Everyone drinks 3.", TWO),
        move("Breaker", "Last to grab the edge of the table drinks 3.", ONE),
        move(
          "Bell Storm",
          "Every bell rings. Last to cover their ears drinks 3.",
          ONE,
        ),
        move(
          "Capsize",
          "Everyone tilts their head sideways until the roll. This swing is 2 harder.",
          HARDER,
        ),
        move(
          "Abandon Ship",
          "Everyone stands; last to sit back down drinks 3.",
        ),
        move(
          "Lost Bell",
          "It dives after a bell it dropped. This swing is 2 easier.",
          EASIER,
        ),
      ],
      contest:
        "Everyone sings one line of a shanty, in turn. Whoever breaks the rhythm: Lost, and they drink 4.",
      lore: [
        "A harpoon is still in its side.",
        "It fears a lighthouse.",
        "Its name is rung, not said.",
      ],
    },
  ),
];

// The Chronicle's dragons (The Quest 2.0 Phase 7): never dealt until
// unlocked (`unlock`), then a rare at any lair's last stage.
export const unlockedDragons: CardDefinition[] = [
  // Would rather talk. No move costs a heart.
  {
    ...dragon(
      "dragon-bartholomew",
      "Bartholomew",
      "A dragon looks up from a cup of tea. It sighs. It would rather talk about this. Roll d20.",
      {
        miss: "It explains why you're wrong, at length. Drink 3.",
        hit: "You land a blow while it's mid-sentence. Give 4.",
        crit: "It loses its train of thought. Everyone else drinks 4.",
        fumble: "It sits on you, apologizing. Drink 6.",
      },
      {
        calm: [
          move(
            "Small Talk",
            "It asks about the weather. The drawer answers for ten seconds or drinks 3.",
          ),
          move("Tea Break", "Everyone takes one slow, polite sip."),
          move(
            "A Long Story",
            "It starts a story. The drawer's left neighbor drinks 2 to make it stop.",
          ),
          move(
            "Strong Opinions",
            "It has views on the drawer's boots. This swing is 2 harder.",
            HARDER,
          ),
          move(
            "Compliments",
            "The drawer compliments the player opposite, or drinks 3.",
          ),
          move("Bad Back", "It stretches, groaning. Everyone stretches too."),
        ],
        enraged: [
          move(
            "Raised Voice",
            "It is very disappointed. Everyone drinks 2 in shame.",
          ),
          move(
            "Last Word",
            "The drawer and the player opposite argue. The table picks a loser: drink 3.",
          ),
          move(
            "Cold Shoulder",
            "It won't look at the drawer. This swing is 2 harder.",
            HARDER,
          ),
          move("Sulk", "Nobody speaks until the roll. First to talk drinks 3."),
          move("Bart, Please", "Everyone calls it Bart once. Forget: drink 2."),
          move(
            "Second Thoughts",
            "It wonders if this is worth it. This swing is 2 easier.",
            EASIER,
          ),
        ],
        contest:
          "The drawer picks a topic and debates it. The table votes; the drawer loses: Lost, and they drink 4.",
        lore: [
          "It has a bad back.",
          "It fears confrontation.",
          "It prefers Bart.",
        ],
      },
    ),
    unlock: "bartholomew",
  },
  // All of them at once: the worst move of each other dragon.
  {
    ...dragon(
      "dragon-king",
      "The Dragon King",
      "Every dragon you've heard of bows to this one. It has been waiting for you. Roll d20.",
      {
        miss: "Fire, teeth and ice at once. Drink 4.",
        hit: "One scale cracks. Give 5.",
        crit: "It roars in pain for the first time in an age. Everyone else drinks 5.",
        fumble: "It ignores you completely. Drink 6.",
      },
      {
        calm: [
          move("Inferno", "Everyone drinks 3.", ONE),
          move(
            "Swallow",
            "It eats the drawer's drink. Pour them a new one; they drink 3 of it.",
            ONE,
          ),
          move(
            "Frozen Stare",
            "Everyone freezes until the roll. First to move drinks 3. This swing is 2 harder.",
            HARDER,
          ),
          move("Tidal Wave", "Everyone stands; last to stand drinks 3."),
          move(
            "Royal Decree",
            "The drawer makes a rule for the rest of the game. Break it: drink 2.",
          ),
          move("Roar", "Last to cover both ears drinks 3."),
        ],
        enraged: [
          move("All the Fire", "Everyone drinks 4.", TWO),
          move("Every Tooth", "The drawer and both neighbors drink 3.", ONE),
          move(
            "Storm of Wings",
            "Everyone leans back. Last to lean drinks 3.",
            ONE,
          ),
          move(
            "Ancient Spell",
            "Eyes shut until the roll. Peek: drink 3. This swing is 2 harder.",
            HARDER,
          ),
          move("Crown Toss", "Everyone points up. Last to point drinks 3."),
          move(
            "Old Wound",
            "An old wound opens under its crown. This swing is 2 easier.",
            EASIER,
          ),
        ],
        contest:
          "Everyone stands and stays standing until it falls. Anyone sits: Lost, and they drink 4.",
        lore: [
          "It has no weak scale.",
          "It fears nothing.",
          "You already know its name.",
        ],
      },
    ),
    unlock: "dragon-king",
  },
];

const byId = (id: string) => dragons.find((c) => c.id === `dungeon.${id}`)!;
/** Each lair region's three dragons (The Quest 2.0 Phase 1, 2026-11-13):
 * the run's third region is the dragon's own. */
export const lairs = {
  taproom: ["final-tab", "the-group-chat", "dragon-tidewrack"].map(byId),
  kitchen: ["last-call-lich", "two-am-kebab", "the-morning-after"].map(byId),
  rooftop: ["bartender-below", "surge-pricing", "house-lights"].map(byId),
};
