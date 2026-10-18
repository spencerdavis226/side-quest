import type { CardDefinition, PackDefinition } from "../game/types";
import { cardFactory, roll, rollTable } from "./author";
import {
  champions,
  eliteFourMembers,
  gymLeaders,
  gymTiers,
  legendaries,
} from "./pokemon-league";
import { hideoutCards, hideouts } from "./league/hideouts";
import { ids, TEAM_HP } from "./league/journey";
import { rivals, routeCards, routes, victory } from "./league/routes";
import { starters } from "./league/starters";

// Pokémon night: every playable moment from the three supplied board sheets
// (Kanto, Johto, Hoenn), morphed from board spaces into shared-deck cards.
// Board movement, gym checkpoints, "next square", turn order and lost turns
// do not exist in this game, so those effects became pours, one-shot dice
// rolls, or lasting rules that end at the drawing player's next turn. Source
// consequences stay as written: shots, chugs, gendered splits, mixed drinks,
// slaps and rough dares are not softened (the 2026-10-07 crude pass reworded
// the flat dice spaces so each roll lands a joke; see reference/README.md).
// The 2026-10-17 table-rule pass (owner: "nothing is gospel") turned eleven
// prop, chore or dead rules into one-time actions (Egg, Lickitung, Psyduck,
// Ditto, Murkrow, Mawile, Relicanth, Farfetch'd, Vulpix) and gave Team Magma
// and Aqua a team that exists (whoever wears red or blue).
// The source sheet is kept raw at
// reference/pokemon_board_spaces.json; never rewrite it to match this file.
// Keep IDs stable: active sessions snapshot their text and order.
//
// Pokémon League (since 2026-10-16, owner): a crawl on the Pub Crawl engine
// that plays this pack alone. A starter opens the run (`league/starters.ts`),
// then eight routes of four cards (`league/routes.ts`), each closed by a gym
// leader from that gym's tier (`pokemon-league.ts`: tier k holds every
// region's kth gym), a villain hideout after the fourth badge
// (`league/hideouts.ts`, one of nine teams), Victory Road, the rival, a
// Legendary, four of the Elite Four and a Champion. The table shares Team HP.
// The regular deck below plays only in the plain modes.
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
    "Hoothoot comes out at night. Dark outside: give 2. Daylight: hoot like an owl and drink 2.",
  ),
  card(
    "castform",
    "Castform",
    "sip",
    "Castform used Weather Ball! Clear outside: drink 2. Cloudy: give 2. Rain or snow: drink 3.",
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
    "sip",
    "Lickitung used Lick! Lick your lips at the player across from you, then give them 2.",
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
    "Rival May blocks the path! Everyone taken drinks 3. Nobody's taken: everyone drinks 5.",
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
    "group",
    "Team Magma recruited you! Everyone in red joins: you all give 3. Nobody in red: drink 4.",
  ),
  card(
    "team-aqua",
    "Team Aqua",
    "group",
    "Team Aqua recruited you! Everyone in blue joins: you all give 3. Nobody in blue: drink 4.",
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
    "Bug Catching Contest! Roll d6: Paras, Metapod, Beedrill, Butterfree, Pinsir or Scyther.",
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
    "A wild Missingno glitched in! Roll d20. 1-5: game breaks, everyone drinks 3. 6+: drink 2.",
    rollTable(1, 20, [
      // The standing natural 1 (owner, 2026-10-17); Missingno has no good
      // roll for a natural 20 to double.
      {
        min: 1,
        max: 1,
        instruction: "Natural 1! The game breaks hard. Everyone drinks 6.",
      },
      { min: 2, max: 5, instruction: "The game breaks. Everyone drinks 3." },
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
    "sip",
    "Farfetch'd got away! Drink 1, then fetch the next drink anyone asks for.",
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
    "Steel Wing! Drink 3. Until your next turn, drinks given to you bounce to your right neighbor.",
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
    "sip",
    "Vulpix used Will-O-Wisp! You are burned: drink 3 while the table fans you.",
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
    "challenge",
    "Ditto used Transform! Impersonate someone here; the table guesses. Nobody gets it: drink 2.",
  ),
  card(
    "psyduck",
    "Psyduck",
    "sip",
    'Psyduck has a headache! Hold your head, groan "Psyyy", then drink 2.',
  ),
  card(
    "lapras",
    "Lapras",
    "rule",
    "Lapras used Confuse Ray! Pick a player: questions only until your next turn, or drink 1.",
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
    "sip",
    "You got an Egg! Cradle your drink like a baby, sing it one line of a lullaby, then drink 2.",
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
    "Magnitude! Drink any number; your left neighbor drinks one less, and so on around the table.",
  ),
  card(
    "wartortle",
    "Wartortle",
    "challenge",
    "Wartortle used Skull Bash! Crush a can on your head and give 3 to a player, or drink 3.",
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
    "challenge",
    "Murkrow used Mimic! Say a player's last sentence in their voice. Bad impression: drink 2.",
  ),
  card(
    "sudowoodo",
    "Sudowoodo",
    "challenge",
    "Sudowoodo blocks the path! Drink 2, or spill an embarrassing truth and everyone else drinks.",
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
    "Hoenn Contest Hall! Runway walk to a song the table picks. Do it: give 5. Don't: drink 3.",
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
    "Seaking used Waterfall! Everyone drinks; nobody stops until the player before them does.",
  ),
  card(
    "spheal",
    "Spheal",
    "group",
    "Spheal used Ice Ball! Drink 1, your left neighbor 2, the next 3, and so on around the table.",
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
    "Claydol used Double-Edge! Give any number of drinks, then drink half that, rounded up.",
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
    "Pelipper used Stockpile! Mix a splash of everyone's drink, then roll d6 to see who swallows it.",
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
    "Barboach used Mud-slap! Pick a player. Rest of the game: they get one slap after a full drink.",
  ),
  card(
    "mawile",
    "Mawile",
    "challenge",
    "Mawile used Vicegrip! Give your left neighbor a 3-second bear hug, then drink 4 and apologize.",
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
    "challenge",
    "Relicanth used Dive! Under the table, hold your breath 10 seconds. Surface early: drink 2.",
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
  ...starters,
  ...routeCards,
  ...hideoutCards,
];

/** Team HP at the start of a run, before the starter. */

// Eight routes, each closed by its gym; the hideout comes after the fourth.
const journey = routes.flatMap((route, k) => [
  {
    label: route.label,
    intro: route.intro,
    pick: 4,
    cardIds: ids(route.cards),
    elite: ids(route.aces),
  },
  {
    label: `Gym ${k + 1}`,
    intro: `Gym ${k + 1}`,
    pick: 1,
    cardIds: ids(gymTiers[k]),
  },
  ...(k === 3
    ? [
        {
          oneOf: hideouts.map((h) => [
            { label: h.label, intro: h.intro, pick: 2, cardIds: ids(h.grunts) },
            { label: `${h.label} boss`, pick: 1, cardIds: [h.boss.id] },
          ]),
        },
      ]
    : []),
]);

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
    mark: "art/packs/league.svg",
    summary: "8 badges, then the League",
    label: "Team HP",
    goal: 0,
    length: 1,
    cardIds: [],
    party: { hearts: TEAM_HP },
    finale: [
      {
        label: "Your starter",
        intro: "A starter chooses you",
        pick: 1,
        cardIds: ids(starters),
      },
      ...journey,
      {
        label: victory.label,
        intro: victory.intro,
        pick: 2,
        cardIds: ids(victory.cards),
        elite: ids(victory.aces),
      },
      // The rival waits at the League's door, so the stages after it read
      // "Pokémon League".
      {
        label: "Pokémon League",
        intro: "Your rival blocks the way",
        pick: 1,
        cardIds: ids(rivals),
      },
      {
        label: "Legendary",
        intro: "A Legendary appears",
        pick: 1,
        cardIds: ids(legendaries),
      },
      {
        label: "Elite Four",
        intro: "The Elite Four await",
        pick: 4,
        cardIds: ids(eliteFourMembers),
      },
      {
        label: "Champion",
        intro: "The Champion awaits",
        pick: 1,
        cardIds: ids(champions),
      },
    ],
  },
};
