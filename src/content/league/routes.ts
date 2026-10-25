import type { CardDefinition } from "../../game/types";
import {
  ace,
  catchable,
  center,
  challenge,
  crossroads,
  evolution,
  gamble,
  hazard,
  item,
  mart,
  moves,
  pair,
  rival,
  strike,
  trainer,
  vs,
  wild,
} from "./journey";
import { moments } from "./moments";
import { moreEvolutions, moreWilds, teraRaid } from "./wilds";

// The League's routes: eight, one before each gym, four cards each from the
// route's fifteen (eighteen since the 2026-10-25 type expansion, `wilds.ts`), plus two Ace Trainers behind its crossroads. Wild
// Pokémon get tougher route by route, from every generation. Five routes
// carry a chance to evolve the starter; the others a risky find instead.
// Never write Team HP or items into these rules: the card's seals show them.

// --- Route 1 -----------------------------------------------------------------
const route1: CardDefinition[] = [
  strike(
    0,
    "route-pidgey",
    "Pidgey",
    "Wild Pidgey appeared! It throws Sand Attack right at your eyes.",
    {
      even: "Eyes shut. Drink 2 without looking.",
      advantage: "Quick Attack first. Give 2.",
      disadvantage: "Gust ruins your hair. Drink 3.",
    },
  ),
  strike(
    0,
    "route-rattata",
    "Rattata",
    "Wild Rattata is chewing your shoelaces like it pays rent.",
    {
      even: "Evicted. Whoever has the worst shoes drinks 2.",
      advantage: "Top percentage Rattata! Give 2.",
      disadvantage: "It bites your ankle. Drink 4 on one foot.",
    },
  ),
  wild(
    0,
    "route-zigzagoon",
    "Zigzagoon",
    "Wild Zigzagoon is zigzagging toward you. Zigzag your head with it and roll d20.",
    vs(
      "Dizzy. Drink {total}.",
      "Pickup! Steal a sip from any drink at the table.",
      { fumble: "You zag straight into a wall. Drink 6 and sit on the floor." },
    ),
  ),
  wild(
    0,
    "route-bidoof",
    "Bidoof",
    "Wild Bidoof appeared, with the dead eyes of a man on his fourth divorce. Roll 2d6.",
    pair(
      "It stares into your soul. Drink 2 without blinking.",
      "Bidoof wanders off to find wife five. Give 2.",
      "A pair! Bidoof proposes. Your left neighbor officiates and drinks 3.",
    ),
  ),
  strike(
    0,
    "route-wooloo",
    "Wooloo",
    "Wild Wooloo rolls at you like a drunk sheep down a hill.",
    {
      even: "You hop it like a hurdle. Give 2.",
      advantage: "You shear it and keep the sweater. Give 3.",
      disadvantage: "Bowled over. Drink 4, then baa.",
    },
  ),
  strike(
    0,
    "route-lechonk",
    "Lechonk",
    "Wild Lechonk is snorting your snacks. Everyone oinks at it.",
    {
      even: "Bacon later. The quietest oinker drinks 2.",
      advantage: "You steal its snacks. Give 3.",
      disadvantage: "It eats the whole bag. Drink 4, oink.",
    },
  ),
  trainer(
    0,
    "route-youngster-joey",
    "Youngster Joey",
    "Joey says his Rattata is in the top percentage of Rattata. Prove him wrong. Roll d20.",
    vs(
      "It was. Drink 3 and apologize to Joey.",
      "Top percentage, bottom of the bracket. Give 2.",
    ),
  ),
  challenge(
    0,
    "route-bug-catcher",
    "Bug Catcher",
    "A kid with a bug net bets you can't name five bug Pokémon in 10 seconds. Lose: drink 2.",
  ),
  hazard(
    0,
    "route-ledge",
    "One-Way Ledge",
    "You hop the ledge and can never go back up. Your ankle has opinions. Roll d20.",
    vs(
      "Rolled it. Drink 2 standing on your good foot.",
      "Stuck the landing. Give 1 and take a bow.",
    ),
  ),
  catchable(
    0,
    "route-caterpie",
    "Caterpie",
    "A Caterpie is just sitting there being a little guy. Will the table catch it?",
    1,
  ),
  gamble(
    0,
    "route-mystery-egg",
    "Mystery Egg",
    "A stranger in a trench coat hands you an egg. It's warm. Too warm.",
    9,
    "It hatches into a Togepi and pisses on you. Drink 3.",
    "It hatches into something useful. Give 2.",
    ["Hand it back", "Crack it"],
    "die",
  ),
  item(
    0,
    "route-potion-ground",
    "Finders Keepers",
    "Someone dropped something in the grass. It's yours now. Everyone drinks 1 to celebrate.",
    "draught",
  ),
  center(
    0,
    "route-viridian-center",
    "Viridian Center",
    "Nurse Joy takes your team and gives it back in 5 seconds. Everyone toasts Nurse Joy.",
  ),
  mart(
    0,
    "route-viridian-mart",
    "Viridian Mart",
    "The clerk makes you run Oak's parcel back to Pallet Town first. Fine. Now he'll sell.",
    [
      { label: "Drink 2", loot: "draught" },
      { label: "Drink 4", loot: "smoke" },
      { label: "Just looking" },
    ],
  ),
  crossroads(
    0,
    "route-two-paths",
    "Two Paths",
    "A short path through tall grass, or a long one where a trainer wants a fight.",
    ["Tall grass", "Pick a fight"],
  ),
];
const route1Aces: CardDefinition[] = [
  ace(
    0,
    "route-ace-rookie",
    "Ace Trainer Kenny",
    "Kenny has trained since he was four, and his Rattata is in its prime. Roll d6.",
    moves(
      [
        "He explains EV training at length. Drink 3.",
        'Rattata crits. Drink 3 and say "good game, Kenny."',
      ],
      [
        "Kenny cries. Give 3.",
        "Kenny calls his mom. Give 3.",
        "Kenny quits forever. Give 4.",
        "Kenny gives you his hat. Give 4.",
      ],
    ),
    "die",
  ),
  ace(
    0,
    "route-ace-lass",
    "Lass Tiffany",
    "Lass Tiffany says you looked at her. Battle to prove you didn't. Roll d20.",
    vs(
      "You did. Drink 3, and look only at the floor until your next turn.",
      "She backs off out of respect. Give 3.",
    ),
    "shield",
  ),
];

// --- Route 2 -----------------------------------------------------------------
const route2: CardDefinition[] = [
  wild(
    1,
    "route-spearow",
    "Spearow",
    "Wild Spearow is angrier than any bird has a right to be. Roll d6 for its move.",
    moves(
      ["Fury Attack: four pecks. Drink 4."],
      [
        "Peck. Rude. Give 1.",
        "Leer. You leer back harder. Give 2.",
        "Growl. Everyone growls at it; the quietest drinks 2.",
        "It flies off to bother Ash. Give 2.",
        "Drill Peck misses and hits your right neighbor. They drink 3.",
      ],
    ),
  ),
  strike(
    1,
    "route-ekans",
    "Ekans",
    "Wild Ekans wraps around your leg and hisses something filthy.",
    {
      even: "It squeezes. Drink 2 and hiss back.",
      advantage: "You tie it in a bow. Give 3.",
      disadvantage: "Poison Sting. Drink 4, eyes watering.",
    },
  ),
  wild(
    1,
    "route-wurmple",
    "Wurmple",
    "Wild Wurmple appeared! Nobody knows what it becomes. Not even Wurmple. Roll 2d6.",
    pair(
      "Existential dread. Drink 2 and name your biggest regret.",
      "It becomes a footnote. Give 2.",
      "A pair! It evolves mid-fight into something nobody predicted. Give {total}.",
    ),
  ),
  strike(
    1,
    "route-starly",
    "Starly",
    "A whole flock of Starly. Everyone flaps their arms.",
    {
      even: "Bird chaos. The slowest flapper drinks 2.",
      advantage: "You scatter them. Give 3.",
      disadvantage: "They steal your snack and your dignity. Drink 4.",
    },
  ),
  strike(
    1,
    "route-lillipup",
    "Lillipup",
    "Wild Lillipup wants belly rubs. Rub the nearest belly at the table.",
    {
      even: "Good boy. The rubbed player gives 2.",
      advantage: "It fetches your drink. Give 3.",
      disadvantage: "It bites the hand that feeds. Drink 4.",
    },
  ),
  wild(
    1,
    "route-yungoos",
    "Yungoos",
    "Wild Yungoos is a sausage with teeth and a bad attitude. Roll d20.",
    vs(
      "It bites your sausage. Drink 3 with your legs crossed.",
      "Sausage served. Whoever has the longest name drinks 2.",
    ),
  ),
  strike(
    1,
    "route-hiker",
    "Hiker Dave",
    "Hiker Dave hasn't showered since Mt. Moon. Hug your left neighbor.",
    {
      even: "He shares his trail mix. Drink 2.",
      advantage: "He's too tired to fight. Give 3.",
      disadvantage: "His Geodude rolls you flat. Drink 4.",
    },
    { kind: "Trainer" },
  ),
  challenge(
    1,
    "route-picnicker",
    "Picnicker Gina",
    "Picnicker Gina dares you to eat something off the floor. Do it or drink 3.",
  ),
  hazard(
    1,
    "route-mt-moon-zubat",
    "Zubat Cave",
    "Mt. Moon. No Repel. Zubat every step. Roll d6 for how many.",
    moves(
      ["Six Zubat. Drink 3 and bite a neck.", "Five Zubat. Drink 2, flapping."],
      [
        "Two Zubat. Give 1.",
        "One Zubat. Give 1.",
        "A Clefairy instead. Give 2.",
        "No Zubat at all. A miracle. Give 3.",
      ],
    ),
    "hex",
  ),
  catchable(
    1,
    "route-clefairy",
    "Clefairy",
    "A Clefairy is dancing under the moon. It's beautiful. Wipe a tear and decide.",
    2,
  ),
  evolution(
    1,
    "route-rare-candy-1",
    "Rare Candy",
    "A Rare Candy on the ground, a little linty. Your starter is staring at it.",
  ),
  center(
    1,
    "route-pewter-center",
    "Pewter Center",
    "The Center reeks of antiseptic and Brock's cologne. Everyone breathes in and drinks 1.",
  ),
  mart(
    1,
    "route-pewter-mart",
    "Pewter Mart",
    "The Pewter Mart sells mostly rocks. The clerk is also mostly rock.",
    [
      { label: "Drink 2", loot: "draught" },
      { label: "Drink 3", loot: "smoke" },
      { label: "Just looking" },
    ],
  ),
  crossroads(
    1,
    "route-mt-moon-fork",
    "Mt. Moon Fork",
    "Through the cave, or around it, past trainers who haven't seen daylight in weeks.",
    ["The cave", "Around it"],
  ),
  item(
    1,
    "route-moon-stone",
    "Shiny Rock",
    "You find a shiny rock and decide it's a weapon now. Give 1.",
    "die",
  ),
];
const route2Aces: CardDefinition[] = [
  ace(
    1,
    "route-ace-super-nerd",
    "Super Nerd Miguel",
    "Miguel will fight you for the Helix Fossil. He's been here for weeks. Roll d20.",
    vs(
      'He wins and explains why. Drink 3 and say "Praise Helix."',
      'You take the fossil. Everyone yells "Praise Helix!"; the last one drinks 3.',
    ),
    "die",
  ),
  ace(
    1,
    "route-ace-twins",
    "Twins Amy & May",
    "Double battle, and both twins talk at once. Pick a partner, then roll 2d6.",
    pair(
      "Two on two, and you lost. You and your partner drink 3.",
      "Both twins cry in stereo. You and your partner give 2 each.",
      "A pair! Perfect sync. You and your partner give {total} between you.",
    ),
    "shield",
  ),
];

// --- Route 3 -----------------------------------------------------------------
const route3: CardDefinition[] = [
  strike(
    2,
    "route-psyduck",
    "Psyduck",
    "Wild Psyduck clutches its head, staring at nothing. Clutch yours too.",
    {
      even: "Headache for everyone. You drink 2.",
      advantage: "You cure its headache. Give 3.",
      disadvantage: "Confusion! Drink 4 and spin once.",
    },
  ),
  wild(
    2,
    "route-machop",
    "Machop",
    "Wild Machop wants to arm-wrestle. Flex for the table, then roll d20.",
    vs(
      'Karate Chop to the junk. Drink 3 and say "thank you, sensei."',
      "You flex harder. Give 2.",
    ),
  ),
  strike(
    2,
    "route-shinx",
    "Shinx",
    "Wild Shinx sparks when it sees you. Every hair on your body stands up.",
    {
      even: "Static cling. Drink 2.",
      advantage: "You wrangle the sparks. Give 3.",
      disadvantage: "Sparks everywhere. Drink 4, hair upright.",
    },
  ),
  strike(
    2,
    "route-roggenrola",
    "Roggenrola",
    "Wild Roggenrola is a rock with an ear. It heard what you said about it.",
    {
      even: "It sulks. Say something nice, then drink 2.",
      advantage: "You skip it across a lake. Give 3.",
      disadvantage: "It takes it personally. Drink 4.",
    },
  ),
  wild(
    2,
    "route-pikipek",
    "Pikipek",
    "Wild Pikipek drills a tree. Then your skull. Knock on the table, then roll 2d6.",
    pair(
      "Woodpecked. Drink 3.",
      "It finds a better tree. Give 2.",
      "A pair! It drums a beat. Everyone drums the table; the last to stop drinks 3.",
    ),
  ),
  wild(
    2,
    "route-nickit",
    "Nickit",
    "Wild Nickit steals the drink nearest you. Roll d20 to get it back.",
    vs(
      "It's gone. Finish whatever you have.",
      "Recovered, with a tip. Give 3.",
    ),
  ),
  trainer(
    2,
    "route-swimmer",
    "Swimmer Brad",
    "Swimmer Brad is in a Speedo on dry land and won't explain. Roll d20.",
    vs(
      "You looked. Drink 3 and describe what you saw.",
      "He goes back to the sea. Everyone in shorts drinks 2.",
    ),
  ),
  challenge(
    2,
    "route-juggler",
    "Juggler Rico",
    "Juggler Rico juggles three Voltorb. Juggle any two things for 5 seconds or drink 3.",
  ),
  // A loss lays Meowth's catchphrase.
  {
    ...hazard(
      2,
      "route-team-rocket",
      "Prepare for Trouble",
      "Jessie and James net you from their balloon. Recite their motto, then roll d6.",
      moves(
        ["Netted. Drink 3.", "Meowth scratches. Drink 2."],
        [
          "Wobbuffet! Give 1.",
          "They argue about the motto. Give 2.",
          "They blast off again. Give 2.",
          "They blast off again! Everyone points up; the last to point drinks 3.",
        ],
      ),
    ),
    jinx: {
      name: "That's Right!",
      rule: 'The jinxed player ends every sentence with "That\'s right!" Slip: drink 1.',
    },
  },
  catchable(
    2,
    "route-abra",
    "Abra",
    "An Abra is asleep. It will teleport the second you move. Throw now?",
    2,
  ),
  evolution(
    2,
    "route-evolving-1",
    "What? It's Evolving!",
    "Your starter glows in the middle of the road. Everyone hums the evolution music.",
  ),
  center(
    2,
    "route-cerulean-center",
    "Cerulean Center",
    "Nurse Joy again. Same face, new town. Everyone swears it's the same one and drinks 1.",
  ),
  mart(
    2,
    "route-cerulean-mart",
    "Cerulean Mart",
    "The bike shop wants a million for a bike. The Mart next door is reasonable.",
    [
      { label: "Drink 3", loot: "shield" },
      { label: "Drink 2", loot: "draught" },
      { label: "Just looking" },
    ],
  ),
  crossroads(
    2,
    "route-nugget-bridge",
    "Nugget Bridge",
    "Cross the bridge, trainers and all, or swim under it.",
    ["Swim under", "The bridge"],
  ),
  item(
    2,
    "route-hidden-item",
    "Hidden Item",
    "The Itemfinder beeps at a bush. Somebody kick it. The drawer gives 1.",
    "shield",
  ),
];
const route3Aces: CardDefinition[] = [
  ace(
    2,
    "route-ace-rocket-recruiter",
    "The Recruiter",
    "Nugget Bridge's last man hands you a nugget and a Team Rocket pitch. Roll d20.",
    vs(
      "You signed something. Drink 4 and do the Rocket pose.",
      "You keep the nugget and don't join. Give 3.",
    ),
    "die",
  ),
  ace(
    2,
    "route-ace-cooltrainer",
    "Cooltrainer Ava",
    "Cooltrainer Ava has six fully evolved Pokémon on Route 3. Rude. Roll d6.",
    moves(
      [
        "Her Gyarados sweeps. Drink 4.",
        "Her Alakazam reads your mind. Drink 3 and read your last text aloud.",
      ],
      [
        "You sweep her back. Give 3.",
        "She rage-quits. Give 3.",
        "She asks for your number. Give 4.",
        "She retires on the spot. Give 4.",
      ],
    ),
    "shield",
  ),
];

// --- Route 4 -----------------------------------------------------------------
const route4: CardDefinition[] = [
  strike(
    3,
    "route-ponyta",
    "Ponyta",
    "Wild Ponyta. A horse on fire. Gallop around your chair once.",
    {
      even: "Singed. Drink 2.",
      advantage: "You ride it. Give 3.",
      disadvantage: "Flame Wheel. Drink 5.",
    },
  ),
  strike(
    3,
    "route-sableye",
    "Sableye",
    "Wild Sableye eyes your teeth like they're gems. Grin wide.",
    {
      even: "It licks its lips. Drink 2.",
      advantage: "Fake gems! It cries. Give 3.",
      disadvantage: "It takes a sip of your drink. Drink 5.",
    },
  ),
  wild(
    3,
    "route-croagunk",
    "Croagunk",
    "Wild Croagunk pokes your kidney and laughs. Poke your right neighbor, then roll 2d6.",
    pair(
      "Poison Jab. Drink 3.",
      "You poke back harder. Give 3.",
      "A pair! Croagunk laughs at the player you poked. They drink {total}.",
    ),
    { curse: "bleed" },
  ),
  strike(
    3,
    "route-sandile",
    "Sandile",
    "Wild Sandile is wearing sunglasses and doesn't care about you.",
    {
      even: "Awkward. Drink 2 to break the silence.",
      advantage: "You steal the sunglasses. Give 3.",
      disadvantage: "It cares now. Drink 5.",
    },
  ),
  wild(
    3,
    "route-hawlucha",
    "Hawlucha",
    "Wild Hawlucha leaps off a tree and elbow-drops the table. Slam it, then roll d6.",
    moves(
      [
        "Flying Press. Drink 4.",
        "Body Slam. Drink 2 while your left neighbor counts to three.",
      ],
      [
        "You kick out at two. Give 2.",
        "You pin it for the three count. Give 3.",
        "Tag team: pick a partner; you both give 2.",
        "Off the top rope! Stand on your chair and give 4.",
      ],
    ),
  ),
  strike(
    3,
    "route-mudbray",
    "Mudbray",
    "Wild Mudbray is a donkey covered in mud and it wants to share.",
    {
      even: "It shares. Drink 2.",
      advantage: "You win the mud wrestle. Give 3.",
      disadvantage: "Mud Slap. Drink 5.",
    },
  ),
  trainer(
    3,
    "route-biker",
    "Biker Gang",
    "The Biker Gang revs at you on Cycling Road. Make the engine noise, then roll d20.",
    vs(
      "Run over. Drink {total}.",
      "They wipe out. Give 3 to whoever looks most like they own a motorcycle.",
      {
        fumble:
          "The whole gang runs you over. Make the engine noise, then finish your drink.",
      },
    ),
  ),
  challenge(
    3,
    "route-psychic",
    "Psychic Tyron",
    "Think of a number from 1 to 5. Your left neighbor guesses it. Right: drink 3.",
  ),
  hazard(
    3,
    "route-snorlax",
    "Snorlax Blocks the Way",
    "A Snorlax is asleep across the road. Play the Poké Flute (hum loudly) and roll d6.",
    moves(
      [
        "It rolls onto you. Drink 3.",
        "It rolls onto you and your left neighbor. You both drink 2.",
        "It snores and doesn't move. Drink 2 and hum louder.",
      ],
      [
        "It wakes up and wanders off. Give 2.",
        "It wakes up hungry. Whoever has the most food nearby drinks 2.",
        "It wakes up and rolls away. Give 3.",
      ],
    ),
  ),
  catchable(
    3,
    "route-lapras",
    "Lapras",
    "A man in Silph Co. gives you a Lapras for free. Don't ask why. Take it?",
    3,
    2,
  ),
  evolution(
    3,
    "route-thunder-stone",
    "Evolution Stone",
    "A shop sells evolution stones for the price of your dignity. Your starter wants one.",
    4,
  ),
  center(
    3,
    "route-celadon-center",
    "Celadon Center",
    "Celadon's Pokémon Center has a Game Corner next door. Everyone resists. Toast to resisting.",
  ),
  mart(
    3,
    "route-celadon-dept",
    "Celadon Department",
    "Five floors of shopping and a rooftop vending machine. The clerk is drunk.",
    [
      { label: "Drink 4", loot: "die" },
      { label: "Pay in blood", cost: 1, loot: "shield" },
      { label: "Just looking" },
    ],
  ),
  crossroads(
    3,
    "route-game-corner",
    "Game Corner",
    "Walk past the Game Corner, or go in and see who's still at the tables.",
    ["Walk past", "Go in"],
  ),
  gamble(
    3,
    "route-slots",
    "Slot Machine",
    "One more pull. You can feel it. Pull or walk?",
    11,
    "The house wins. Drink 4.",
    "Jackpot. Give 4.",
    ["Walk away", "Pull it"],
    "die",
  ),
];
const route4Aces: CardDefinition[] = [
  ace(
    3,
    "route-ace-rocket-boss",
    "Rocket Executive",
    "Behind the poster: a Rocket executive with a Raticate the size of a dog. Roll d20.",
    vs(
      "Hyper Fang to the shin. Drink 4 and hop.",
      "He drops the Silph Scope. Give 4.",
    ),
    "die",
  ),
  ace(
    3,
    "route-ace-gambler",
    "Gambler Lou",
    "Gambler Lou bets his whole stack. Push your drink to the middle, then roll d20.",
    vs("He takes the pot. Drink 4.", "You clean him out. Give 4.", {
      crit: "He hands over his lucky coin too. Give 8.",
    }),
    "shield",
  ),
];

// --- Route 5 -----------------------------------------------------------------
const route5: CardDefinition[] = [
  strike(
    4,
    "route-haunter",
    "Haunter",
    "Wild Haunter licks you. It's cold and it lingers. Lick your lips.",
    {
      even: "Shiver. Drink 2.",
      advantage: "You lick it back. Give 3.",
      disadvantage: "Lick, then Hypnosis. Drink 5.",
    },
  ),
  strike(
    4,
    "route-scyther",
    "Scyther",
    "Wild Scyther in the Safari Zone. It has knives for arms. Hold very still.",
    {
      even: "Still enough. Drink 2 slowly.",
      advantage: "It spares you. Give 4.",
      disadvantage: "Slash. Drink 5.",
    },
  ),
  wild(
    4,
    "route-tauros",
    "Tauros",
    "A herd of Tauros. Everyone at the table stomps. The drawer rolls d20.",
    vs(
      "Stampeded. Drink 4; the loudest stomper drinks with you.",
      "You ride one out. Everyone yells yeehaw; the last one drinks 3.",
    ),
  ),
  wild(
    4,
    "route-bronzor",
    "Bronzor",
    "Wild Bronzor is a frying pan that floats. It hums. Hum back, then roll 2d6.",
    pair(
      "It hums louder. Drink 3.",
      "You use it as a frying pan. Give 3.",
      "A pair! It rings like a gong. Everyone else drinks 2.",
    ),
  ),
  strike(
    4,
    "route-mimikyu",
    "Mimikyu",
    "Wild Mimikyu is wearing a Pikachu costume and does not want you to look under it.",
    {
      even: "You look away. Drink 2.",
      advantage: "You peek. It cries. Give 3.",
      disadvantage: "You peek. It haunts you. Drink 5.",
    },
  ),
  wild(
    4,
    "route-toxtricity",
    "Toxtricity",
    "Wild Toxtricity air-guitars at you. Air-guitar back for 5 seconds, then roll d20.",
    vs(
      "Booed off stage. Drink 3 and play one more riff.",
      "Encore! Pick a bandmate: they air-guitar for 5 seconds or drink 3.",
    ),
    { curse: "bleed" },
  ),
  trainer(
    4,
    "route-beauty",
    "Beauty Cassandra",
    "Beauty Cassandra says you're not her type. Fight her about it. Roll d20.",
    vs(
      "You're not. Drink 3 and compliment your left neighbor.",
      "She gives you her number. It's fake. Give 3.",
    ),
  ),
  challenge(
    4,
    "route-black-belt",
    "Black Belt Kenji",
    "Black Belt Kenji wants 20 push-ups. Everyone counts. Fall short: drink 3.",
  ),
  hazard(
    4,
    "route-safari",
    "Safari Zone",
    "Thirty Safari Balls and a rock. Toss a napkin at your left neighbor, then roll d6.",
    moves(
      [
        "Everything runs. Drink 3.",
        "You hit a Tauros with the rock. Drink 3.",
        "Out of balls. Drink 2.",
      ],
      [
        "Something stays. Give 2.",
        "A Kangaskhan, with baby. You and your left neighbor give 2 each.",
        "A Dratini! Give 4.",
      ],
    ),
  ),
  catchable(
    4,
    "route-chansey",
    "Chansey",
    "A Chansey in the Safari Zone. It's carrying an egg. It runs if you breathe.",
    3,
    2,
  ),
  gamble(
    4,
    "route-silph-scope",
    "Pokémon Tower",
    "The sixth floor is haunted by a ghost Marowak. Climb or leave?",
    12,
    "Get out... get out... Drink 4.",
    "You put it to rest. Give 4.",
    ["Leave", "Climb"],
    "shield",
    "hex",
  ),
  center(
    4,
    "route-fuchsia-center",
    "Fuchsia Center",
    "Fuchsia's Center is next to a zoo with no fences. Everyone makes an animal noise and drinks 1.",
  ),
  mart(
    4,
    "route-fuchsia-mart",
    "Fuchsia Mart",
    "A Mart near the Safari Zone. Everything costs more because tourists.",
    [
      { label: "Drink 4", loot: "shield" },
      { label: "Pay in blood", cost: 1, loot: "die" },
      { label: "Just looking" },
    ],
  ),
  crossroads(
    4,
    "route-cycling-road",
    "Cycling Road",
    "Walk the long way, or bike down Cycling Road, where trouble hangs out.",
    ["Long way", "Cycling Road"],
  ),
  item(
    4,
    "route-surf-hm",
    "Secret House",
    "You find the Safari Zone's secret house. A man gives you something for no reason.",
    "smoke",
  ),
];
const route5Aces: CardDefinition[] = [
  ace(
    4,
    "route-ace-biker-boss",
    "Biker Boss",
    "The gang's boss has a Weezing and a prison tattoo. Roll d20.",
    vs(
      "Smog in the face. Drink 5; whoever sits closest to you coughs and drinks 1.",
      "He respects you now and buys a round. Everyone else drinks 2.",
    ),
    "die",
  ),
  ace(
    4,
    "route-ace-dragon-tamer",
    "Dragon Tamer",
    "A Dragon Tamer in a cape on a bike path. Her Dragonite is in a hurry. Roll d6.",
    moves(
      [
        "Outrage. Drink 5.",
        "Dragon Rush. Drink 4.",
        "Thrash. Drink 3 and flail.",
      ],
      [
        "Tamed. Give 4.",
        "The Dragonite gives you a lift. Give 4.",
        "She hands you the cape. Give 5.",
      ],
    ),
    "shield",
  ),
];

// --- Route 6 -----------------------------------------------------------------
const route6: CardDefinition[] = [
  wild(
    5,
    "route-gyarados",
    "Gyarados",
    "You fished for a Magikarp and got its angry dad. Roll 2d6.",
    pair(
      "Hyper Beam. Drink 4.",
      "It's yours. Somehow. Give 3.",
      "A pair! It's a red one. Give {total}.",
    ),
  ),
  strike(
    5,
    "route-lucario",
    "Lucario",
    "Wild Lucario reads your aura. It knows what you did.",
    {
      even: "It says nothing. Drink 2.",
      advantage: "You return the favor. Give 3.",
      disadvantage: "It says it out loud. Drink 6.",
    },
  ),
  wild(
    5,
    "route-zoroark",
    "Zoroark",
    "Wild Zoroark is disguised as someone here. Accuse a player, then roll d20.",
    vs(
      "Wrong person. You and the accused drink 3.",
      "Caught it. The accused drinks 3 and admits nothing.",
    ),
  ),
  strike(
    5,
    "route-goodra",
    "Goodra",
    "Wild Goodra wants a hug. It is entirely slime.",
    {
      even: "Squelch. Drink 2.",
      advantage: "Hug returned. Give 4.",
      disadvantage: "It never lets go. Drink 6.",
    },
  ),
  wild(
    5,
    "route-tinkaton",
    "Tinkaton",
    "Wild Tinkaton has a hammer bigger than your car, and it wants your car. Roll d6.",
    moves(
      ["Gigaton Hammer. Drink 5.", "Totaled. Drink 3 and name your first car."],
      [
        "It hammers someone else's. Whoever drove here drinks 3.",
        "It steals a bike instead. Give 3.",
        "It hammers itself. Give 3.",
        "You trade it your keys. Give 4.",
      ],
    ),
  ),
  strike(
    5,
    "route-salandit",
    "Salandit",
    "Wild Salandit's gas is toxic and smells like your ex.",
    {
      even: "Hold your breath. Drink 2.",
      advantage: "You waft it away. Give 3.",
      disadvantage: "Toxic cloud. Drink 6.",
    },
  ),
  trainer(
    5,
    "route-gentleman",
    "Gentleman Alfred",
    "Gentleman Alfred challenges you to a battle with his Growlithe and his monocle. Roll d20.",
    vs(
      "Monocled. Drink 4 and speak posh until your next turn.",
      "He tips his hat. Give 3 in your poshest voice.",
    ),
  ),
  challenge(
    5,
    "route-fisherman",
    "Fisherman Ned",
    "Fisherman Ned (your left neighbor) tells a fish story. Top it. Ned wins the vote: drink 4.",
  ),
  hazard(
    5,
    "route-silph-maze",
    "Silph Co. Maze",
    "Silph Co. Eleven floors of teleport pads. Spin in your chair twice, then roll d6.",
    moves(
      [
        "Lost on floor 7. Drink 3.",
        'Teleported into a meeting. Drink 2 and say "per my last email."',
        "Back in the lobby. Drink 2 and swap seats with someone.",
      ],
      [
        "Found the card key. Give 2.",
        "Found the president. Give 3.",
        "Found the Master Ball. Give 4.",
      ],
    ),
    "hex",
  ),
  catchable(
    5,
    "route-dratini",
    "Dratini",
    "A Dratini in the Safari Zone's deepest pond. It's worth every drink.",
    4,
    2,
  ),
  evolution(
    5,
    "route-rare-candy-2",
    "Rare Candy Stash",
    "You find a Rare Candy behind a vending machine. Your starter is drooling.",
  ),
  center(
    5,
    "route-saffron-center",
    "Saffron Center",
    "A Psychic heals you with her mind. Everyone thinks a nice thought and drinks 1.",
  ),
  mart(
    5,
    "route-saffron-mart",
    "Saffron Mart",
    "A Mart in Silph's lobby, guarded by a Rocket who also works the register.",
    [
      { label: "Drink 5", loot: "die" },
      { label: "Drink 6", loot: "tera" },
      { label: "Just looking" },
    ],
  ),
  crossroads(
    5,
    "route-dojo",
    "The Fighting Dojo",
    "Walk past the Fighting Dojo, or kick the door in and fight whoever's training.",
    ["Walk past", "Kick the door"],
  ),
  item(
    5,
    "route-silph-gift",
    "Silph Gift",
    "The Silph Co. president gives you a gift for saving the building. Give 2.",
    "die",
  ),
];
const route6Aces: CardDefinition[] = [
  ace(
    5,
    "route-ace-karate-king",
    "The Karate King",
    "The Karate King's Hitmonlee and Hitmonchan both want a piece of you. Roll d6.",
    moves(
      [
        "Hitmonlee kicks. Drink 5.",
        "Hitmonchan punches. Drink 4.",
        "Both. Drink 3, and pick a partner who drinks 3.",
      ],
      [
        "You take Hitmonlee home. Give 4.",
        "You take Hitmonchan home. Give 4.",
        "You take both. Give 5.",
      ],
    ),
    "die",
  ),
  ace(
    5,
    "route-ace-veteran",
    "Veteran Hugo",
    "Veteran Hugo fought in a war nobody mentions. He has a Salamence. Roll d20.",
    vs(
      "Flamethrower. Drink 5 and tell a war story.",
      "Hugo salutes you. Salute back and give 4.",
    ),
    "shield",
  ),
];

// --- Route 7 -----------------------------------------------------------------
const route7: CardDefinition[] = [
  strike(
    6,
    "route-snorlax-awake",
    "Angry Snorlax",
    "A Snorlax woke up on the wrong side of the road.",
    {
      even: "It yawns. Drink 3.",
      advantage: "It goes back to sleep. Give 4.",
      disadvantage: "Body Slam. Drink 6.",
    },
  ),
  wild(
    6,
    "route-garchomp",
    "Gible's Dad",
    "You poked a Gible. Its dad, a Garchomp, appeared behind it. Roll d6.",
    moves(
      ["Dragon Rush. Drink 4.", "Earthquake. Everyone drinks 2."],
      [
        "You apologize to the family. Give 3.",
        "Gible bites its dad. Give 3.",
        "Sand Veil: it can't find you. Give 3.",
        "It adopts you. Give 4.",
      ],
    ),
  ),
  strike(
    6,
    "route-hydreigon",
    "Hydreigon",
    "Wild Hydreigon. Three heads, all hungry, none of them friendly.",
    {
      even: "One head bites. Drink 3.",
      advantage: "You feed one head. Give 4.",
      disadvantage: "All three bite. Drink 6.",
    },
  ),
  wild(
    6,
    "route-aegislash",
    "Aegislash",
    "Wild Aegislash switches between sword and shield every time you swing. Roll 2d6.",
    pair(
      "King's Shield. Drink 4.",
      "You sheathe it. Give 3.",
      "A pair! You pull the sword out. Make a rule until your next turn.",
    ),
  ),
  wild(
    6,
    "route-dragapult",
    "Dragapult",
    "Wild Dragapult fires its babies at you like missiles. Roll d20.",
    vs(
      "Direct hit. Drink 4 and duck.",
      "You catch a baby. Hand it to someone: they drink 3 and coo.",
    ),
  ),
  strike(
    6,
    "route-kingambit",
    "Kingambit",
    "Wild Kingambit demands you kneel. Kneel.",
    {
      even: "Your knees knock. Drink 3.",
      advantage: "You make it kneel. Give 4.",
      disadvantage: "It stays unimpressed. Drink 6.",
    },
  ),
  trainer(
    6,
    "route-ninja-boy",
    "Ninja Boy",
    "A Ninja Boy jumps out of nowhere. Was he under the table? Check, then roll d6.",
    moves(
      [
        "Shuriken. Drink 4.",
        "Double Team. You and your left neighbor drink 2.",
      ],
      [
        "He vanishes in smoke. Give 3.",
        "Substitute: he was a log. Give 3.",
        "Caught him under the table. Give 4.",
        "He was your left neighbor all along. They drink 4.",
      ],
    ),
  ),
  challenge(
    6,
    "route-sage",
    "Sage Li",
    "Sage Li asks: what has keys but opens no locks? 5 seconds. Wrong: drink 4.",
  ),
  hazard(
    6,
    "route-seafoam",
    "Seafoam Currents",
    "Seafoam Islands. Boulders, currents and a freezing cave. Roll d6.",
    moves(
      [
        "Swept away. Drink 3.",
        "Frozen cave. Drink 2, teeth chattering.",
        "Boulder on your foot. Drink 2 and hop.",
      ],
      [
        "You Strength the boulder. Give 2.",
        "You Surf the current. Give 3.",
        "Articuno flies over. Everyone looks up; the last one drinks 3.",
      ],
    ),
  ),
  catchable(
    6,
    "route-eevee-gift",
    "Gift Eevee",
    "A man in a mansion gives you an Eevee and doesn't explain. Take it?",
    3,
    2,
  ),
  evolution(
    6,
    "route-evolving-2",
    "It's Evolving Again!",
    "Your starter is glowing mid-battle. Everyone hums the evolution music, loud.",
  ),
  center(
    6,
    "route-cinnabar-center",
    "Cinnabar Center",
    "A Pokémon Center on a volcano. Nurse Joy is sweating. Everyone mops up and drinks 1.",
  ),
  mart(
    6,
    "route-cinnabar-mart",
    "Cinnabar Mart",
    "The last Mart before a burned-down mansion. Prices are scorched.",
    [
      { label: "Drink 5", loot: "shield" },
      { label: "Pay in blood", cost: 2, loot: "die" },
      { label: "Just looking" },
    ],
  ),
  crossroads(
    6,
    "route-mansion",
    "Pokémon Mansion",
    "Go around the burned mansion, or read the diary inside that mentions Mew.",
    ["Go around", "The diary"],
  ),
  gamble(
    6,
    "route-missingno",
    "MissingNo.",
    "A glitch flickers on the shore. Your bag could fill up. Or your save could die.",
    13,
    "Save corrupted. Drink 5.",
    "Infinite items. Give 5.",
    ["Walk away", "Surf the shore"],
    "die",
    "hex",
  ),
];
const route7Aces: CardDefinition[] = [
  ace(
    6,
    "route-ace-scientist",
    "Scientist Blaine Jr.",
    "Blaine's son made a Mewtwo in a jar. He wants to test it on you. Roll d20.",
    vs(
      "Psystrike. Drink 5, and your left neighbor reads your mind aloud.",
      "The jar breaks. Run! Everyone runs in place; the slowest drinks 3.",
    ),
    "die",
  ),
  ace(
    6,
    "route-ace-burglar",
    "Burglar Sid",
    "Burglar Sid is robbing the mansion and you caught him. Roll d20.",
    vs(
      "He robs you too. Drink 5, and your right neighbor takes a sip of your drink.",
      "He leaves the loot. Give 4.",
    ),
    "shield",
  ),
];

// --- Route 8 -----------------------------------------------------------------
const route8: CardDefinition[] = [
  wild(
    7,
    "route-tyranitar",
    "Tyranitar",
    "Wild Tyranitar kicks up a sandstorm. Everyone covers their drink. Roll d20.",
    vs(
      "Stone Edge. Drink 5; anyone whose drink wasn't covered drinks 2.",
      "You weather the storm. Give 4.",
    ),
  ),
  wild(
    7,
    "route-metagross",
    "Metagross",
    "Wild Metagross is four brains in a steel X. It already knows your roll. Roll 2d6.",
    pair(
      "It knew. Drink 5.",
      "It miscounted. Give 4.",
      "A pair! It did not see that coming. Give {total}.",
    ),
  ),
  strike(
    7,
    "route-volcarona",
    "Volcarona",
    "Wild Volcarona is a moth made of sun. Do a Quiver Dance.",
    {
      even: "Dazzling. Drink 3.",
      advantage: "Your dance wins its heart. Give 4.",
      disadvantage: "Fire Blast. Drink 6.",
    },
  ),
  wild(
    7,
    "route-kommo-o",
    "Kommo-o",
    "Wild Kommo-o rattles its scales like a metal concert. Headbang, then roll d6.",
    moves(
      [
        "Clangorous Soul. Drink 5.",
        "Mosh pit. You and both neighbors drink 2.",
      ],
      [
        "You crowd-surf away. Give 4.",
        "Encore. Give 4.",
        "You steal its guitar. Give 4.",
        "It throws you a pick. Give 5.",
      ],
    ),
  ),
  strike(
    7,
    "route-baxcalibur",
    "Baxcalibur",
    "Wild Baxcalibur has a sword for a spine and it is very cold.",
    {
      even: "Brr. Drink 3.",
      advantage: "You warm it up. Give 4.",
      disadvantage: "Glaive Rush. Drink 6.",
    },
  ),
  wild(
    7,
    "route-gengar",
    "Gengar",
    "Wild Gengar is behind you. No, the other side. Turn around and roll d6.",
    moves(
      [
        "Hypnosis. Drink 4 with your eyes shut.",
        "Curse. You and whoever you turned toward drink 3.",
      ],
      [
        "It grins and fades. Give 4.",
        "Shadow Ball misses. Give 4.",
        "It haunts your left neighbor now. They drink 4.",
        "It laughs so hard it vanishes. Give 5.",
      ],
    ),
    { curse: "hex" },
  ),
  trainer(
    7,
    "route-cooltrainer-pair",
    "Cooltrainer Duo",
    "Two Cooltrainers, matching jackets, matching Dragonites. Pick a partner, then roll 2d6.",
    pair(
      "Double Outrage. You and your partner drink 4.",
      "Their jackets are ruined. You and your partner give 2 each.",
      "A pair! Their Dragonites collide. You and your partner give 4 each.",
    ),
  ),
  challenge(
    7,
    "route-pokemaniac",
    "PokéManiac Ed",
    "PokéManiac Ed dares you to name 10 Pokémon in 15 seconds. Miss: drink 4.",
  ),
  hazard(
    7,
    "route-waterfall",
    "The Waterfall",
    "The only way up is Waterfall. Mime climbing one, then roll d6.",
    moves(
      [
        "You fall. Drink 4.",
        "You fall onto a Magikarp. Drink 3.",
        "Halfway, then down. Drink 2.",
        "Wet, but you hang on. Drink 1.",
      ],
      [
        "You make it up. Give 2.",
        "You are the waterfall. Start one to your left; you may stop first.",
      ],
    ),
  ),
  catchable(
    7,
    "route-snorlax-catch",
    "Sleeping Snorlax",
    "A Snorlax asleep on the road. It's huge. It's yours if you can carry it.",
    4,
    3,
  ),
  gamble(
    7,
    "route-mew-truck",
    "The Truck",
    "There's a truck by the S.S. Anne. Everyone knows Mew is under it. Strength it?",
    14,
    "Nothing there. You pulled a muscle. Drink 5.",
    "Mew. Kind of. Give 5.",
    ["Leave it", "Push the truck"],
    "shield",
  ),
  center(
    7,
    "route-last-center",
    "Last Center",
    "The last Pokémon Center before the League. Nurse Joy means it this time. Everyone toasts her.",
  ),
  mart(
    7,
    "route-last-mart",
    "Last Mart",
    "The last Mart before the League. Everything is Full Restores and despair.",
    [
      { label: "Drink 5", loot: "die" },
      { label: "Finish your drink", loot: "shield" },
      { label: "Just looking" },
    ],
  ),
  crossroads(
    7,
    "route-ace-gate",
    "The Badge Gate",
    "The guard checks your badges. Slip through, or show off to whoever's waiting.",
    ["Go quietly", "Show off"],
  ),
  item(
    7,
    "route-max-revive",
    "Hidden Alcove",
    "Something shiny in a hidden alcove. Pocket it and give 2.",
    "draught",
  ),
];
const route8Aces: CardDefinition[] = [
  ace(
    7,
    "route-ace-champion-wannabe",
    "Ace Trainer Rex",
    "Rex says he'd be Champion if he'd tried. He has a Garchomp. Roll d20.",
    vs(
      'He tried. Drink 5 and say "you could be Champion, Rex."',
      "Rex goes home to his mom. Give 5.",
    ),
    "die",
  ),
  ace(
    7,
    "route-ace-elite-reject",
    "Elite Four Reject",
    "An Elite Four member who got fired. Still bitter. Still good. Roll 2d6.",
    pair(
      "Still good. Drink 5.",
      "Still fired. Give 5.",
      "A pair! You get his old job. Make a rule until your next turn.",
    ),
    "shield",
  ),
];

// --- Victory Road and the rival -------------------------------------------------
const victoryRoad: CardDefinition[] = [
  strike(
    8,
    "route-golurk",
    "Golurk",
    "A Golurk guards Victory Road: a robot made of clay and grudges.",
    {
      even: "It lets you pass. Drink 3.",
      advantage: "You crack its clay. Give 4.",
      disadvantage: "Shadow Punch. Drink 6.",
    },
  ),
  strike(
    8,
    "route-onix-victory",
    "Steelix",
    "A Steelix is the floor of the cave. You've been walking on it.",
    {
      even: "It rumbles. Drink 3.",
      advantage: "You climb it like a stair. Give 4.",
      disadvantage: "Iron Tail. Drink 6.",
    },
  ),
  strike(
    8,
    "route-machamp",
    "Machamp",
    "Wild Machamp. Four arms, no shirt, very personal.",
    {
      even: "Four high fives. Drink 3.",
      advantage: "You flex back. Give 4.",
      disadvantage: "Dynamic Punch. Drink 6.",
    },
  ),
  hazard(
    8,
    "route-boulder-puzzle",
    "Boulder Puzzle",
    "Victory Road's boulder puzzle. You pushed one wrong and now you're stuck. Roll d20.",
    vs(
      "Restart the puzzle. Drink 4 and swap seats with your left neighbor.",
      "Solved. Give 3, smugly.",
    ),
  ),
  challenge(
    8,
    "route-veteran-victory",
    "Veteran Ada",
    "Veteran Ada wants to see your badges. Name all eight from this run. Miss one: drink 4.",
  ),
  center(
    8,
    "route-indigo-center",
    "Indigo Plateau",
    "The Pokémon Center at the top of Victory Road. Nobody talks. Everyone drinks 1 in silence.",
  ),
  mart(
    8,
    "route-indigo-mart",
    "Indigo Mart",
    "The Indigo Plateau Mart. Last chance, highest prices.",
    [
      { label: "Drink 5", loot: "shield" },
      { label: "Drink 6", loot: "tera" },
      { label: "Just looking" },
    ],
  ),
  crossroads(
    8,
    "route-victory-fork",
    "Two Ladders",
    "Two ladders. One leads up. The other, to a trainer nobody warned you about.",
    ["Up", "The other one"],
  ),
];
const victoryAces: CardDefinition[] = [
  ace(
    8,
    "route-ace-victory-1",
    "Ace Trainer Ilse",
    "Ace Trainer Ilse has six Pokémon and no mercy. Roll d6 for how many you beat.",
    moves(
      ["One. Drink 6.", "Two. Drink 5.", "Three. Drink 4.", "Four. Drink 3."],
      ["Five of six. Give 4.", "All six. Give 6."],
    ),
    "die",
  ),
  ace(
    8,
    "route-ace-victory-2",
    "Ace Trainer Ben",
    "Ace Trainer Ben has been on Victory Road for nine years. Roll d20.",
    vs(
      "Nine years of practice. Drink 5, and tell the table what you'd do with nine years.",
      "Ben finally goes home. Give 5.",
    ),
    "shield",
  ),
];

export const rivals: CardDefinition[] = [
  rival(
    "rival-blue",
    "Blue",
    "Smell ya later! Your rival shows up again with a full team and a haircut. Roll d20.",
    vs(
      "He smells ya. Drink 5 and sniff your own armpit.",
      'He cries to Grandpa. Give 4 and say "smell ya later."',
    ),
  ),
  rival(
    "rival-silver",
    "Silver",
    "Silver stole his starter and wants to steal yours. Roll d6.",
    moves(
      [
        "Stolen. Drink 5.",
        "He steals your seat. Drink 3 and swap seats with your left neighbor.",
      ],
      [
        "He learns to love his Pokémon. Give 4.",
        "He calls you a wimp, then cries. Give 4.",
        "He hands back your starter. Give 4.",
        "He calls his dad. It's Giovanni. Give 5.",
      ],
    ),
  ),
  rival(
    "rival-wally",
    "Wally",
    "Wally got healthy. Wally got strong. Wally has a Gallade. Roll d20.",
    vs(
      "Wally is so strong now. Drink 5 and cheer for him.",
      "Wally needs his inhaler. Everyone else takes a deep breath and drinks 2.",
    ),
  ),
  rival(
    "rival-barry",
    "Barry",
    "Barry runs into you and fines you ten million. Roll 2d6.",
    pair(
      "Pay up. Drink 5.",
      "He runs off to fine someone else. Pick who; they drink 4.",
      "A pair! You fine him. Give {total}.",
    ),
  ),
  rival(
    "rival-hop",
    "Hop",
    "Hop made curry for the road and wants it rated. Rate it out loud, then roll d20.",
    vs(
      "He took that personally. Drink 5 and rate it higher.",
      "He takes notes for next time. Give 4, mate.",
    ),
  ),
  rival(
    "rival-nemona",
    "Nemona",
    "Nemona skipped class to fight you. She's been stretching for an hour. Roll d20.",
    vs(
      "She's warmed up. Drink {total} and stretch with her.",
      "She asks to go again. Give 4, then high-five everyone.",
      { fumble: "She was going easy on you. Finish your drink." },
    ),
  ),
];

/** Each route: its cards, its Ace Trainers, and the banner when it opens. */
export const routes: {
  label: string;
  intro: string;
  cards: CardDefinition[];
  aces: CardDefinition[];
}[] = [
  {
    label: "Route 1",
    intro: "Your journey begins",
    cards: [...route1, ...moreWilds[0], ...moments[0]],
    aces: route1Aces,
  },
  {
    label: "Route 2",
    intro: "Onward to the next town",
    cards: [...route2, ...moreWilds[1], ...moments[1], moreEvolutions[1]!],
    aces: route2Aces,
  },
  {
    label: "Route 3",
    intro: "The road gets longer",
    cards: [...route3, ...moreWilds[2], ...moments[2]],
    aces: route3Aces,
  },
  {
    label: "Route 4",
    intro: "Halfway to the League",
    cards: [...route4, ...moreWilds[3], ...moments[3], moreEvolutions[3]!],
    aces: route4Aces,
  },
  {
    label: "Route 5",
    intro: "The wild gets wilder",
    cards: [...route5, ...moreWilds[4], ...moments[4], moreEvolutions[4]!],
    aces: route5Aces,
  },
  {
    label: "Route 6",
    intro: "Deeper into the region",
    cards: [...route6, ...moreWilds[5], ...moments[5], moreEvolutions[5]!],
    aces: route6Aces,
  },
  {
    label: "Route 7",
    intro: "The badges get heavier",
    cards: [...route7, ...moreWilds[6], ...moments[6], teraRaid],
    aces: route7Aces,
  },
  {
    label: "Route 8",
    intro: "One badge to go",
    cards: [...route8, ...moreWilds[7], ...moments[7]],
    aces: route8Aces,
  },
];
export const victory = {
  label: "Victory Road",
  intro: "Victory Road",
  cards: victoryRoad,
  aces: victoryAces,
};

export const routeCards: CardDefinition[] = [
  ...routes.flatMap((r) => [...r.cards, ...r.aces]),
  ...victoryRoad,
  ...victoryAces,
  ...rivals,
];
