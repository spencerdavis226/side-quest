import type { CardDefinition, PackDefinition } from "../game/types";
import { cardFactory, roll, rollTable } from "./author";
import {
  champions,
  eliteFourMembers,
  gymLeaders,
  legendaries,
} from "./pokemon-league";

// Pokémon night: every playable moment from the three supplied board sheets
// (Kanto, Johto, Hoenn), morphed from board spaces into shared-deck cards.
// Board movement, gym checkpoints, "next square", turn order and lost turns
// do not exist in this game, so those effects became pours, one-shot dice
// rolls, or lasting rules that end at the drawing player's next turn. Source
// consequences stay as written: shots, chugs, gendered splits, mixed drinks,
// slaps and rough dares are not softened (the 2026-10-07 crude pass reworded
// the flat dice spaces so each roll lands a joke; see reference/README.md).
// The source sheet is kept raw at
// reference/pokemon_board_spaces.json; never rewrite it to match this file.
// Keep IDs stable: active sessions snapshot their text and order.
//
// Pokémon League mode (`pokemon-league.ts`): the 24 gym leaders play only in
// that mode; each earns the table a badge, and the eighth badge starts the
// gauntlet (a Legendary, four of the Elite Four, the Champion). Beating the
// Champion ends the game. Eight leaders are spread through the
// first 40 draws (`paceQuest` in the engine), so a run lasts about 30 to 40
// cards. The regular deck below has no gym leaders.
const card = cardFactory("pokemon");

const deck: CardDefinition[] = [
  // --- Wild encounters (straight prompts) ----------------------------------
  card(
    "mareep",
    "Mareep",
    "challenge",
    "Wild Mareep appeared! Grab it by the fluff and roll d6.",
    rollTable(1, 6, [
      { min: 1, max: 2, instruction: "Static shock to the nipples. Drink 3." },
      {
        min: 3,
        max: 4,
        instruction: "It headbutts you in the crotch. Drink 2.",
      },
      { min: 5, max: 6, instruction: "Free wool sweater. Give 2." },
    ]),
  ),
  card(
    "unown",
    "Unown",
    "challenge",
    "Unown used Sobriety Test! Recite the alphabet backwards. Drink 1 for each mistake.",
  ),
  card(
    "smeargle",
    "Smeargle",
    "sip",
    "Smeargle used Sketch! Switch drinks with another player.",
  ),
  card(
    "slowpoke",
    "Slowpoke",
    "challenge",
    "Slowpoke tails are valuable. Cut it off: drink 2. Dick. Leave it: give 1.",
  ),
  card(
    "zubat",
    "Zubat",
    "challenge",
    "Another fucking Zubat. Roll d6: that's how many bit your neck.",
    roll(1, 6, "Drink {total}. You're a vampire now: bite someone's neck."),
  ),
  card(
    "magikarp",
    "Magikarp",
    "sip",
    "Magikarp used Splash! ...but nothing happened.",
  ),
  card(
    "hoothoot",
    "Hoothoot",
    "sip",
    "Hoothoot only comes out at night. If it's dark outside, give 2. Otherwise, wear shades and drink 2.",
  ),
  card(
    "castform",
    "Castform",
    "sip",
    "Castform used Weather Ball! Look outside. Clear: drink 2. Cloudy: give 2. Rain or snow: drink 3.",
  ),
  card(
    "tauros",
    "Tauros",
    "sip",
    "A wild Tauros appeared and instantly fled. Drink 2 for being too slow.",
  ),
  card(
    "pikachu",
    "Pikachu",
    "sip",
    "You caught a Pikachu! Drink 2 and name your new starter. Electric typing included.",
  ),
  card(
    "dragon-rage",
    "Dragon Rage",
    "sip",
    "Gyarados used Dragon Rage! Drink 4 and glare at someone.",
  ),
  card(
    "red-gyarados",
    "Red Gyarados",
    "sip",
    "It's a Red Gyarados! If you've caught a shiny before, give 4. Otherwise, drink 4.",
  ),
  card(
    "diglett",
    "Diglett",
    "sip",
    "Diglett used Dig! Dig deep and finish your drink.",
  ),
  card("poliwag", "Poliwag", "sip", "Poliwag used Hydro Pump! Shotgun a beer."),
  card(
    "electabuzz",
    "Electabuzz",
    "sip",
    "Electabuzz used Thunder Punch! You're paralyzed. Drink 3.",
  ),
  card(
    "miltank",
    "Miltank",
    "sip",
    "Miltank used Milk Drink! Swap your drink for a non-alcoholic one and drink 2.",
  ),
  card(
    "dragonite",
    "Dragonite",
    "challenge",
    "Dragonite used Hyper Beam! Give 5, then drink 2 to recharge.",
  ),
  card(
    "snorlax",
    "Snorlax",
    "challenge",
    "A Snorlax blocks the path! Belt out a song of the group's choice or drink 4.",
  ),
  card(
    "sentret",
    "Sentret",
    "sip",
    "Sentret used Foresight! Choose someone who didn't see it coming; they drink 4.",
  ),
  card(
    "krabby",
    "Krabby",
    "challenge",
    "Krabby used Crabhammer! Pick someone. They drink 5 or finish their drink.",
  ),
  card(
    "fearow",
    "Fearow",
    "challenge",
    "Fearow used Mirror Move! Do whatever the last player did on their turn.",
  ),
  card(
    "beedrill",
    "Beedrill",
    "group",
    "Beedrill used Twinneedle! Pick two players. Both drink 2.",
  ),
  card(
    "gloom",
    "Gloom",
    "group",
    "Gloom used Sludge Bomb! You and the two players beside you drink 4.",
  ),
  card(
    "meowth",
    "Meowth",
    "group",
    "Meowth used Pay Day! Everyone but you drinks 1.",
  ),
  card(
    "phanpy",
    "Phanpy",
    "group",
    "A wild Phanpy appeared! Nose goes! Last finger to their nose drinks 2.",
  ),
  card(
    "abra",
    "Abra",
    "group",
    "Abra used Teleport! Everyone swaps seats. Last one seated drinks 2.",
  ),
  card(
    "burned-tower",
    "Burned Tower",
    "group",
    "Burned Tower! Name all three legendary beasts. Last to do it drinks 3.",
  ),
  card(
    "fossil-revival",
    "Fossil Revival",
    "group",
    "You revived a Fossil Pokémon! Everyone older than you drinks 2.",
  ),
  card(
    "cubone",
    "Cubone",
    "group",
    'Cubone used "My mother is dead." Share a depressing story. Then everyone drinks 1.',
  ),
  card(
    "evolution",
    "Evolution",
    "challenge",
    "Your Pokémon is evolving! Let it evolve: drink 4. Cancel it: give 2.",
  ),
  card(
    "starter",
    "Starter",
    "sip",
    "Choose your starter: drink 2 (grass), give 2 (fire), or everyone drinks 1 (water).",
  ),
  card(
    "doduo",
    "Doduo",
    "sip",
    "Doduo used Double-Edge! Give 4 drinks, then drink 1.",
  ),
  card(
    "lickitung",
    "Lickitung",
    "rule",
    "Lickitung used Lick! Give 2 and keep your tongue out until your next turn.",
  ),

  // --- Category rounds ------------------------------------------------------
  card(
    "pokedex",
    "Pokédex",
    "category",
    "Going clockwise, name Pokémon in Pokédex order. First to repeat or skip a number drinks 2.",
  ),
  card(
    "type-matchup",
    "Type Matchup",
    "category",
    "Name a type. Going clockwise, name a Pokémon of that type. Repeat or blank: drink 2.",
  ),
  card(
    "whos-that",
    "Who's That?",
    "category",
    "Describe a Pokémon without naming it. First to guess gives 2. Nobody guesses? Drink 2.",
  ),
  card(
    "evolution-line",
    "Evolution Line",
    "category",
    "Name a three-stage evolution line. No repeats. First to blank or repeat drinks 2.",
  ),
  card(
    "cry-alike",
    "Cry Alike",
    "category",
    "Make a Pokémon cry. First to name it gives 2. Whoever is wrong drinks 2.",
  ),

  // --- Rivals and villains --------------------------------------------------
  card(
    "silver",
    "Rival Silver",
    "group",
    "Rival Silver appears. Drink half the table, rounded up. He's still smug.",
  ),
  card(
    "wally",
    "Rival Wally",
    "challenge",
    "Rival Wally has asthma and one Ralts. Roll d6: that's how many puffs he needs.",
    roll(1, 6, "{total} puffs. Drink {total}, you bully."),
  ),
  card(
    "may",
    "Rival May",
    "group",
    "Rival May blocks the path! Everyone in a relationship drinks 3. If nobody is, everyone drinks 5.",
  ),
  card(
    "team-rocket",
    "Team Rocket",
    "group",
    "Team Rocket blasts off! Everyone recites the motto. Last to finish drinks 2.",
  ),
  card(
    "rocket-grunt",
    "Rocket Grunt",
    "sip",
    "A Rocket Grunt sends five Rattata. Drink as many as you want, then laugh at him.",
  ),
  card(
    "team-magma",
    "Team Magma",
    "rule",
    "Team Magma recruited you! If you're on Team Magma, make a rule for the rest of the game. Otherwise, drink 7.",
  ),
  card(
    "team-aqua",
    "Team Aqua",
    "rule",
    "Team Aqua recruited you! If you're on Team Aqua, make a rule for the rest of the game. Otherwise, drink 7.",
  ),
  card(
    "pokemon-master",
    "Pokémon Master",
    "group",
    "Throw the Master Ball! Take 2 victory drinks while everyone toasts you.",
  ),
  card(
    "champion-lance",
    "Champion Lance",
    "challenge",
    "Champion Lance! Finish a full drink to take his title, or drink 6.",
  ),
  card(
    "elite-four",
    "Elite Four",
    "challenge",
    "Challenge the Elite Four with an underleveled team. Roll 4d6.",
    rollTable(4, 6, [
      { min: 4, max: 10, instruction: "You win! Give 4 and make a speech." },
      { min: 11, max: 24, instruction: "Bruno beats your ass. Drink 4." },
    ]),
  ),

  // --- Gym battles ----------------------------------------------------------
  card(
    "gym-battle",
    "Gym Battle",
    "challenge",
    "Gym battle! Roll d6 to see what's on your team.",
    rollTable(1, 6, [
      { min: 1, max: 1, instruction: "Six Magikarp. Finish your drink." },
      { min: 2, max: 3, instruction: "You lose and pay the leader. Drink 3." },
      { min: 4, max: 5, instruction: "Ugly win. Give 2." },
      { min: 6, max: 6, instruction: "Clean sweep. Give 4 and strike a pose." },
    ]),
  ),

  // --- Dice battles and catches --------------------------------------------
  card(
    "delibird",
    "Delibird",
    "challenge",
    "Delibird used Present! Roll d6 and open it.",
    rollTable(1, 6, [
      { min: 1, max: 3, instruction: "It's a bomb. Drink {total}." },
      { min: 4, max: 6, instruction: "It's a gift. Give {total}." },
    ]),
  ),
  card(
    "raikou",
    "Raikou",
    "challenge",
    "Raikou appears! Roll d6. 3: catch it and give 5. Anything else: take a bomb shot.",
    rollTable(1, 6, [
      { min: 1, max: 2, instruction: "Zapped. Take a bomb shot." },
      { min: 3, max: 3, instruction: "Caught it! Give 5." },
      { min: 4, max: 6, instruction: "Zapped. Take a bomb shot." },
    ]),
  ),
  card(
    "entei",
    "Entei",
    "challenge",
    "Entei appears! Roll d6. 3: catch it and give 5. Anything else: take a high-proof shot.",
    rollTable(1, 6, [
      { min: 1, max: 2, instruction: "Burned. Take a high-proof shot." },
      { min: 3, max: 3, instruction: "Caught it! Give 5." },
      { min: 4, max: 6, instruction: "Burned. Take a high-proof shot." },
    ]),
  ),
  card(
    "suicune",
    "Suicune",
    "challenge",
    "Suicune appears! Roll d6. 3: catch it and give 5. Anything else: shotgun a beer.",
    rollTable(1, 6, [
      { min: 1, max: 2, instruction: "Blitzed. Shotgun a beer." },
      { min: 3, max: 3, instruction: "Caught it! Give 5." },
      { min: 4, max: 6, instruction: "Blitzed. Shotgun a beer." },
    ]),
  ),
  card(
    "kyogre",
    "Kyogre",
    "challenge",
    "Kyogre rises from the sea! Roll d6. 5-6: catch it; give 5. 1-4: soaked; shotgun a beer.",
    rollTable(1, 6, [
      { min: 1, max: 4, instruction: "Soaked. Shotgun a beer." },
      { min: 5, max: 6, instruction: "Caught it! Give 5." },
    ]),
  ),
  card(
    "groudon",
    "Groudon",
    "challenge",
    "Groudon wakes! Roll d6. 4-6: catch it; give 4. 1-3: rocked; take a high-proof shot.",
    rollTable(1, 6, [
      { min: 1, max: 3, instruction: "Rocked. Take a high-proof shot." },
      { min: 4, max: 6, instruction: "Caught it! Give 4." },
    ]),
  ),
  card(
    "rayquaza",
    "Rayquaza",
    "challenge",
    "Rayquaza descends! Roll d6. 6: catch it; give 6. 1-5: dropped; take a bomb shot.",
    rollTable(1, 6, [
      { min: 1, max: 5, instruction: "Dropped. Take a bomb shot." },
      { min: 6, max: 6, instruction: "Caught it! Give 6." },
    ]),
  ),
  card(
    "game-corner",
    "Game Corner",
    "challenge",
    "The Game Corner slots are rigged by Team Rocket. Roll 2d6 anyway.",
    rollTable(2, 6, [
      { min: 2, max: 6, instruction: "The house wins. Drink 2." },
      { min: 7, max: 7, instruction: "Jackpot! Give 7." },
      { min: 8, max: 12, instruction: "The house wins. Drink 2." },
    ]),
  ),
  card(
    "bug-contest",
    "Bug Catching Contest",
    "challenge",
    "Bug Catching Contest! Roll d6: 1 Paras, 2 Metapod, 3 Beedrill, 4 Butterfree, 5 Pinsir, 6 Scyther.",
    rollTable(1, 6, [
      { min: 1, max: 1, instruction: "Paras: awful. Drink 1." },
      { min: 2, max: 2, instruction: "Metapod: give 1." },
      { min: 3, max: 3, instruction: "Beedrill: drink 1, give 1." },
      { min: 4, max: 4, instruction: "Butterfree: give 2." },
      { min: 5, max: 5, instruction: "Pinsir: drink 2, give 1." },
      { min: 6, max: 6, instruction: "Scyther: give 3." },
    ]),
  ),
  card(
    "safari-zone",
    "Safari Zone",
    "challenge",
    "Safari Zone! Roll d6. 1-2: bait; give 1. 3-4: throw a rock, dick; drink 4. 5-6: ball; drink 2.",
    rollTable(1, 6, [
      { min: 1, max: 2, instruction: "Bait. Give 1." },
      { min: 3, max: 4, instruction: "Rock! Dick move. Drink 4." },
      { min: 5, max: 6, instruction: "Safari Ball. Drink 2." },
    ]),
  ),
  card(
    "rattata",
    "Rattata",
    "challenge",
    "Rattata used Tackle! Roll d6. 1: you fainted; finish your drink. 2-6: give 1.",
    rollTable(1, 6, [
      { min: 1, max: 1, instruction: "You fainted. Finish your drink." },
      { min: 2, max: 6, instruction: "Give 1." },
    ]),
  ),
  card(
    "chansey",
    "Chansey",
    "challenge",
    "Chansey hands you her egg. Don't ask where it came from. Roll d6.",
    rollTable(1, 6, [
      { min: 1, max: 2, instruction: "You drop it. Drink 3, egg murderer." },
      { min: 3, max: 5, instruction: "She takes it back. Drink 1." },
      { min: 6, max: 6, instruction: "Lucky Egg! Give 4." },
    ]),
  ),
  card(
    "pokeball",
    "Poké Ball",
    "challenge",
    "Throw a Poké Ball! Roll d6.",
    rollTable(1, 6, [
      {
        min: 1,
        max: 2,
        instruction: "You nail the trainer in the balls. You both drink 2.",
      },
      { min: 3, max: 4, instruction: "It flees. Drink 3." },
      {
        min: 5,
        max: 6,
        instruction: "Caught it! Give 3 and name it after someone here.",
      },
    ]),
  ),
  card(
    "supersonic",
    "Supersonic",
    "challenge",
    "Tentacool used Supersonic! You're confused. Roll d6.",
    rollTable(1, 6, [
      {
        min: 1,
        max: 2,
        instruction: "You hurt yourself in confusion. Drink 4.",
      },
      { min: 3, max: 4, instruction: "Drink 2 with your other hand." },
      { min: 5, max: 6, instruction: "You snap out of it. Give 2." },
    ]),
  ),
  card(
    "missingno",
    "Missingno",
    "challenge",
    "A wild Missingno glitched in! Roll d20. 1-5: the game breaks; everyone drinks 3. Higher: drink 2.",
    rollTable(1, 20, [
      { min: 1, max: 5, instruction: "The game breaks. Everyone drinks 3." },
      { min: 6, max: 20, instruction: "Drink 2." },
    ]),
  ),

  // --- Lasting rules --------------------------------------------------------
  card(
    "pineco",
    "Pineco",
    "rule",
    "Pineco used Protect! Drink 2. Until your next turn, ignore every drink given to you.",
  ),
  card(
    "farfetchd",
    "Farfetch'd",
    "rule",
    "Farfetch'd got away! Drink 1. For the rest of the game, fetch drinks for anyone who asks.",
  ),
  card(
    "raticate",
    "Raticate",
    "rule",
    "Raticate used Pursuit! For the rest of the game, drink 1 whenever you leave the table.",
  ),
  card(
    "mankey",
    "Mankey",
    "rule",
    "Mankey used Swagger! Teach a handshake. Until your next turn, fumbles drink 1.",
  ),
  card(
    "aipom",
    "Aipom",
    "rule",
    "Aipom used Baton Pass! Until your next turn, pass every drink you're given to another player.",
  ),
  card(
    "skarmory",
    "Skarmory",
    "rule",
    "Steel Wing! Drink 3. Until your next turn, drinks given to you bounce to the player on your right.",
  ),
  card(
    "tropius",
    "Tropius",
    "rule",
    "Tropius used Sweet Scent! Until your next turn, every drink given out comes to you instead.",
  ),
  card(
    "sandshrew",
    "Sandshrew",
    "rule",
    "Sandshrew used Sand-Attack! Drink with your non-dominant hand for the rest of the game.",
  ),
  card(
    "vulpix",
    "Vulpix",
    "rule",
    "Vulpix used Will-O-Wisp! For the rest of the game, add 1 to every drink you take.",
  ),
  card(
    "shuppet",
    "Shuppet",
    "rule",
    "Shuppet used Curse! For the rest of the game, drink 1 every time you curse.",
  ),
  card(
    "ditto",
    "Ditto",
    "rule",
    "Ditto used Transform! Until your next turn, copy everything the next player does.",
  ),
  card(
    "psyduck",
    "Psyduck",
    "rule",
    "Psyduck has a headache! Until your next turn, hold your head. Let go and drink 1.",
  ),
  card(
    "lapras",
    "Lapras",
    "rule",
    "Lapras used Confuse Ray! Pick a player. Until your next turn, they speak in questions or drink 1.",
  ),
  card(
    "tentacool",
    "Tentacool",
    "challenge",
    "Tentacool used Constrict! Drink 2 and hold your drink until you finish it.",
  ),
  card(
    "egg",
    "Egg",
    "rule",
    "You got an Egg! Hold an object until your next turn. Caught without it: drink 1.",
  ),
  card(
    "togepi",
    "Togepi",
    "rule",
    "Togepi hatched! Make a new rule for the rest of the game. Violations: drink 1.",
  ),
  card(
    "eevee",
    "Eevee",
    "rule",
    "Eeveelution time! Choose a new rule for the rest of the game. Violations: drink 1.",
  ),
  card(
    "trick-house",
    "Trick House",
    "rule",
    "The Trick House! Make a tricky new rule for the rest of the game. Violations: drink 1.",
  ),
  card(
    "pokemon-tower",
    "Pokémon Tower",
    "rule",
    "Out of respect for the dead: no talking until your next turn. Slip and drink 1.",
  ),

  // --- Challenges and group moments ----------------------------------------
  card(
    "machoke",
    "Machoke",
    "challenge",
    "Machoke used Submission! Do anything the group tells you now, or drink 4.",
  ),
  card(
    "marill",
    "Marill",
    "challenge",
    "Rain Dance! Perform a song and dance the group chooses, or drink 3.",
  ),
  card(
    "geodude",
    "Geodude",
    "group",
    "Magnitude! Drink as many as you want; the player on your left drinks one less. Go around the table.",
  ),
  card(
    "wartortle",
    "Wartortle",
    "challenge",
    "Wartortle used Skull Bash! Crush a beer can against your head to avoid 3 drinks, and give those 3 to one player.",
  ),
  card(
    "ursaring",
    "Ursaring",
    "challenge",
    "Ursaring woke up angry! Drink as many as the group decides, and apologize.",
  ),
  card(
    "day-care",
    "Day Care",
    "group",
    "You visited the Day Care! Give 1 for each sibling you have. None? Drink 2.",
  ),
  card(
    "clefairy",
    "Clefairy",
    "challenge",
    "Clefairy used Metronome! Close your eyes and point at a player. Whoever you touch drinks 3.",
  ),
  card(
    "razor-leaf",
    "Razor Leaf",
    "challenge",
    "Bellsprout used Razor Leaf! Shred someone with a callout. They drink 1 in shame.",
  ),
  card(
    "murkcrow",
    "Murkrow",
    "rule",
    "Murkrow used Mimic! Pick a player and repeat everything they say until your next turn.",
  ),
  card(
    "sudowoodo",
    "Sudowoodo",
    "challenge",
    "A wild Sudowoodo blocks the path! Reveal an embarrassing truth to avoid 2 drinks, and everyone else drinks.",
  ),
  card(
    "whismur",
    "Whismur",
    "group",
    "Whismur used Uproar! The group picks a phrase. Shout it up to 3 times; give that many drinks.",
  ),
  card(
    "plusle-minun",
    "Plusle & Minun",
    "group",
    "Plusle and Minun used Helping Hand! Pick a player. The next time they drink, drink for them.",
  ),
  card(
    "zigzagoon",
    "Zigzagoon",
    "group",
    "Zigzagoon used Growl! Bark at the group. Last to bark back drinks 2.",
  ),
  card(
    "wailmer",
    "Wailmer",
    "group",
    "Wailmer used Whirlpool! Give 3 to the player on your right. They're dizzy.",
  ),
  card(
    "contest-hall",
    "Contest Hall",
    "challenge",
    "Hoenn Contest Hall! Runway walk to a group-chosen song. Give 5 if you do it; drink 3 if you don't.",
  ),
  card(
    "spinda",
    "Spinda",
    "challenge",
    "Spinda used Teeter Dance! Dance to a group-chosen song or drink 8.",
  ),
  card(
    "bicycle",
    "Bicycle",
    "challenge",
    "I want to ride my BICYCLE! Sing the line or drink 3. Anyone who joins in drinks 1.",
  ),
  card(
    "spoink",
    "Spoink",
    "challenge",
    "Spoink's Psychic! Guess the fingers behind your back. Wrong: drink that many. Right: they do.",
  ),
  card(
    "seaking",
    "Seaking",
    "group",
    "Seaking used Waterfall! Everyone drinks in a waterfall; stop only when the player before you stops.",
  ),
  card(
    "spheal",
    "Spheal",
    "group",
    "Spheal used Ice Ball! Drink 1; the player on your left drinks 2, then 3, around the table until everyone has drunk.",
  ),
  card(
    "clamperl",
    "Clamperl",
    "group",
    "Clamperl is evolving! Choose: all girls drink 3, or all guys drink 3.",
  ),
  card(
    "luvdisc",
    "Luvdisc",
    "group",
    "Luvdisc used Splash! It's super effective: everyone finishes their drinks.",
  ),
  card(
    "electrode",
    "Electrode",
    "challenge",
    "Electrode used Selfdestruct! Choose a player and you both finish your drinks.",
  ),
  card(
    "claydol",
    "Claydol",
    "challenge",
    "Claydol used Double-Edge! Give as many drinks as you want, then drink half in recoil, rounded up.",
  ),
  card(
    "rare-candy",
    "Rare Candy",
    "sip",
    "Rare Candy! Level up: take another card now. No passing the device.",
  ),
  card(
    "bellsprout",
    "Bellsprout",
    "sip",
    "Bellsprout used Growth! Drink 1 and take another card now.",
  ),
  card(
    "jigglypuff",
    "Jigglypuff",
    "sip",
    "Jigglypuff used Sing! Everyone else fell asleep. Take another card now.",
  ),
  card(
    "pound",
    "Pound",
    "group",
    "Jigglypuff used Pound! Everyone pounds the table. Last to pound drinks 2.",
  ),

  // --- Restored source cards (consequences kept as written) ----------------
  card(
    "grimer",
    "Grimer",
    "challenge",
    "Grimer used Sludge Bomb! Have every player combine their drinks in a glass, then finish it!",
  ),
  card(
    "pelipper",
    "Pelipper",
    "challenge",
    "Pelipper used Stockpile! Mix a splash of everyone's drink. Roll d6. Even: swallow it. Odd: choose who drinks it.",
    rollTable(1, 6, [
      {
        min: 1,
        max: 5,
        step: 2,
        instruction: "Spit Up! Choose who drinks it.",
      },
      { min: 2, max: 6, step: 2, instruction: "Swallow it." },
    ]),
  ),
  card(
    "shroomish",
    "Shroomish",
    "sip",
    "Shroomish used Leech Seed! Take a drink from somebody else's cup.",
  ),
  card(
    "barboach",
    "Barboach",
    "rule",
    "Barboach used Mud-slap! Name a player. For the rest of the game, they may slap you once after a full drink.",
  ),
  card(
    "mawile",
    "Mawile",
    "rule",
    "Mawile used Vicegrip! Until your next turn, grab a player and squeeze them. Drink 4 and apologize.",
  ),
  card(
    "fiery-path",
    "Fiery Path",
    "challenge",
    "Fiery Path! Take off an article of clothing. Drink 4 to stay hydrated.",
  ),
  card(
    "relicanth",
    "Relicanth",
    "rule",
    "Relicanth used Dive! Kneel under the table until your next turn. Surface early: drink 2.",
  ),
  card(
    "koffing",
    "Koffing",
    "sip",
    "Koffing used Haze! If there's anything nearby to smoke, smoke it to avoid 2 drinks.",
  ),
  card(
    "battle-of-sexes",
    "Battle of the Sexes",
    "group",
    "Your side drinks 2: guys if you're a guy, girls if you're a girl. The other side gives 1 each.",
  ),
];

export const pokemonCards: CardDefinition[] = [
  ...deck,
  ...gymLeaders,
  ...legendaries,
  ...eliteFourMembers,
  ...champions,
];

export const pokemonPack: PackDefinition = {
  version: 1,
  id: "pokemon",
  logo: "art/packs/pokemon.svg",
  title: "Pokémon night",
  description:
    "A whole region of wild encounters, gym battles, catches, and rivals. The board stayed home; the dice came along.",
  cardIds: deck.map((card) => card.id),
  quest: {
    mode: "Pokémon League",
    summary: "Earn 8 badges",
    label: "Badges",
    goal: 8,
    length: 40,
    cardIds: gymLeaders.map((card) => card.id),
    // After the eighth badge: a Legendary, four of the Elite Four, then the
    // Champion, picked at random when the game starts.
    finale: [
      {
        label: "Legendary",
        intro: "A Legendary appears",
        pick: 1,
        cardIds: legendaries.map((c) => c.id),
      },
      {
        label: "Elite Four",
        intro: "The Elite Four await",
        pick: 4,
        cardIds: eliteFourMembers.map((c) => c.id),
      },
      {
        label: "Champion",
        intro: "The Champion awaits",
        pick: 1,
        cardIds: champions.map((c) => c.id),
      },
    ],
  },
};
