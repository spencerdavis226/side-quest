import {
  gamble,
  boss,
  d20,
  elite,
  fork,
  merchant,
  monster,
  pair,
  relic,
  shrine,
  mishap,
  trap,
  treasure,
  trial,
  trinket,
  ambush,
  BOSS_NEED,
  type FloorCards,
} from "./shared";

// Region 1: the King's Road (Realms, 2026-11-03; was the Cellar, whose card
// IDs it keeps). Highwaymen, wolves, tolls and a long way to walk.

export const cellar: FloorCards = {
  fights: [
    monster(
      0,
      "gelatinous-shot",
      "Highwaymen",
      "Three masked riders block the road. Your money or your life. Hands up, then roll d20.",
      "They take the money. Drink 3, hands still up.",
      "You take their horses. Give 3.",
      {
        crit: "You take their horses and their masks. Give 6.",
        fumble: "They take the money and your boots. Drink 6, hands still up.",
      },
    ),
    // A table duel: the left neighbor plays the guard and calls it.
    trial(
      0,
      "rat-trench-coat",
      "The Toll Gate",
      "A gate guard wants papers. Left neighbor plays him: talk your way past in 10 seconds, or drink 3.",
    ),
    monster(
      0,
      "mold-elemental",
      "Wolf Pack",
      "Eyes in the trees, then teeth. Howl at them, then roll d20.",
      "They circle and bite. Drink 3, and howl once more.",
      "They scatter into the trees. Give 3.",
      {
        crit: "The alpha rolls over. Everyone else howls; the quietest drinks 6.",
        fumble:
          "They drag you off the road. Drink 6, then howl at your left neighbor.",
      },
    ),
    monster(
      0,
      "drunk-goblin",
      "Goblin Scouts",
      "Two goblins on one stolen pony, both steering. Hold out your reins, then roll d20.",
      "The pony runs you over. Drink 3 and neigh.",
      "They fall off. Loot their saddlebags. Give 2.",
      {
        loot: "smoke",
        crit: "They fall off, and the pony likes you better. Give 4, and everyone neighs.",
        fumble:
          "The pony kicks you twice. Drink 6, then neigh at your right neighbor.",
      },
    ),
    mishap(
      0,
      "Monster",
      "skeleton-barback",
      "Wanted Poster",
      "A wanted poster on a tree looks like one of you. On three, everyone points. Most fingers: drink 2.",
    ),
    mishap(
      0,
      "Monster",
      "possessed-mop",
      "Snake in the Road",
      "A snake crosses the road. Last to lift both feet off the floor drinks 2.",
    ),
    monster(
      0,
      "keg-spider",
      "Giant Spider",
      "It hangs over the road, waiting. Wiggle eight fingers at it, then roll d20.",
      "Bitten. Drink 3, then spider-walk to the door and back.",
      "Squished under a cartwheel. Give 3.",
      {
        crit: "Squished, and its web held a purse of gold. Give 6.",
        fumble:
          "Wrapped up for later. Drink 6, then spider-walk to the door and back.",
      },
    ),
    // A table duel.
    trial(
      0,
      "tab-goblin",
      "The Tax Collector",
      "The tax collector wants his cut. Right neighbor plays him: thumb war, best of three. Lose: drink 4.",
    ),
    monster(
      0,
      "goblin-shaman",
      "Hedge Witch",
      "A woman in a hat of twigs is cursing travelers for fun. Roll d20.",
      "The curse lands. Drink 3.",
      "You knock her hat off. Give 3 to whoever looks most cursed.",
      {
        jinx: {
          name: "Toad Voice",
          rule: "The cursed player croaks after every sentence. Forgets: drink 1.",
        },
      },
    ),
    // A hidden fuse.
    {
      ...mishap(
        0,
        "Monster",
        "cask-bat",
        "Bats Under the Bridge",
        "Light the fuse. Pass a cup clockwise, naming a weapon as you pass. The bats hit whoever holds it.",
      ),
      timer: {
        version: 1,
        kind: "fuse",
        min: 12,
        max: 40,
        end: "The bats swoop. Whoever is holding the cup drinks 3.",
      },
    },
    trial(
      0,
      "clipboard-troll",
      "The Rope Bridge",
      "A rope bridge, one plank wide. Walk heel to toe across the room and back. Wobble: drink 3.",
    ),
    trial(
      0,
      "riddling-tap",
      "The Sphinx",
      "A sphinx sits across the road. Your left neighbor asks a riddle: 10 seconds, or drink 3.",
    ),
    trial(
      0,
      "stuck-door",
      "The Stuck Cart",
      "A cart is stuck in the mud. Push it: wall-sit for 30 seconds. Stand early: drink 3.",
    ),
    trial(
      0,
      "keg-stand-off",
      "The Stare-Down",
      "A knight blocks the road and stares. Right neighbor plays him. Blink or laugh first: drink 3.",
    ),
    trap(
      0,
      "sticky-floor",
      "Mud Pit",
      "The road turns to knee-deep mud. Roll d20 to pull free.",
      "You leave a boot behind. Drink 2, and stay one shoe down until your next turn.",
      "You pull free. Give 2.",
      {
        crit: "You pull free and moonwalk out. Everyone copies it; the worst moonwalk drinks 4.",
      },
    ),
    trap(
      0,
      "christmas-lights",
      "Tripwire",
      "Bandits strung a wire across the road at shin height. Roll d20.",
      "You eat the road. Drink 2.",
      "You hop it. Give 2 to the clumsiest player here.",
    ),
    trap(
      0,
      "rolling-kegs",
      "Runaway Cart",
      "A cart full of cabbages comes down the hill. Nobody is driving it. Roll d20 to dive.",
      "Flattened. Drink 3, lying down if you can.",
      "You dive clear. Give 2 to whoever didn't flinch.",
    ),
    mishap(
      0,
      "Trap",
      "falling-taps",
      "Falling Acorns",
      "An acorn bonks you on the head, and you're Thumb Master now. Drink 1, then use it.",
      {
        jinx: {
          name: "Thumb Master",
          rule: "Whenever the cursed player puts a thumb on the table, the last to copy drinks 1.",
        },
      },
    ),
    ambush(
      0,
      "lost-bridesmaids",
      "Lost Pilgrims",
      "A line of pilgrims has decided you're the prophet. Roll d20.",
      "You lead the hymn. Drink 2, then sway with your right neighbor.",
      "You point them to the next town. Give 2.",
    ),
    ambush(
      0,
      "rat-pack",
      "Wandering Minstrels",
      "Three minstrels sing at you for coin. Sing them a line back, then roll d20.",
      "They follow you for a mile. Drink 2.",
      "You out-sing them. Give 2.",
    ),
    // Four seats, four dice.
    {
      ...mishap(
        0,
        "Monster",
        "fryer-oil-ooze",
        "Stampede",
        "A herd of cattle comes down the road, and it runs clockwise from you. Roll four dice.",
      ),
      dice: {
        version: 1,
        count: 4,
        sides: 6,
        instruction:
          "It tramples four seats. You drink {first}; the next three clockwise drink {second}, {third} and {fourth}.",
      },
    },
    // 2d6, and doubles are a better win.
    monster(
      0,
      "barback-poltergeist",
      "Pickpocket",
      "A small boy keeps bumping into you. Your purse is lighter every time. Roll 2d6.",
      "",
      "",
      {
        roll: pair(
          "He's gone, and so is your purse. Drink 3.",
          "You catch him by the collar. Make someone turn out their pockets, then give 3.",
          "He robs everyone else instead. Everyone else drinks 3.",
        ),
      },
    ),
    // A secret on a clock.
    trial(
      0,
      "low-beam",
      "The Low Branch",
      "Your right neighbor holds out an arm as the branch. Limbo under it. Touch it: drink 3.",
    ),
    trap(
      0,
      "loose-floorboard",
      "Rotten Plank",
      "One plank on the bridge is not like the others. Roll d20.",
      "It snaps under you. Drink 2.",
      "You step over it like a cat. Meow, then give 2.",
    ),
    ambush(
      0,
      "stag-party",
      "The Wedding Party",
      "A whole wedding party on the road, and they're one guest short. Roll d20.",
      "Invited. Drink 2, then give a toast to the couple.",
      "You send them the long way round. Give 2.",
    ),
  ],
  finds: [
    relic(
      0,
      "mimic-cooler",
      "A Chest in the Road",
      "An unlocked chest sits in the middle of the road. Nobody is around. Open it, or walk on.",
      11,
      "It was a mimic. Drink 4.",
      "Gold, and something useful. Flip someone a coin; they drink 3.",
      ["Walk on", "Open it"],
      { loot: "draught" },
    ),
    treasure(
      0,
      "lost-and-found",
      "Abandoned Camp",
      "A cold campfire, a bedroll, and a dented shield someone left behind. Rap on the table: still sound.",
      "shield",
    ),
    treasure(
      0,
      "tip-jar",
      "The Fallen Knight",
      "A knight's bones by a milestone. His lucky die is still in his glove. Everyone bows their head.",
      "die",
    ),
    shrine(
      0,
      "wishing-drain",
      "Wishing Well",
      "A mossy well full of old coins. Everyone makes a wish out loud and toasts it.",
    ),
    shrine(
      0,
      "dead-jukebox",
      "The Bard's Grave",
      "A bard is buried here, and he left one song. Everyone sings the chorus, whatever they think it is.",
    ),
    merchant(
      0,
      "rat-fence",
      "The Peddler",
      "A peddler with a cart of things that fell off other carts. He takes drinks, or blood.",
      [
        { label: "Haggle · drink 3", loot: "draught" },
        { label: "Pay in blood", cost: 1, loot: "shield" },
        { label: "Walk on" },
      ],
    ),
    merchant(
      0,
      "the-regular",
      "The Old Soldier",
      "He's walked this road for fifty years. He'll trade a story for a story.",
      [
        { label: "Tell one · drink 2", loot: "round" },
        { label: "His war diary", cost: 2, loot: "candy" },
        { label: "Walk on" },
      ],
    ),
    merchant(
      0,
      "road-tinker",
      "The Tinker",
      "A tinker who mends anything for a price, and sells whatever he couldn't mend.",
      [
        { label: "Mend it · drink 3", loot: "die" },
        { label: "Lend him a hand", cost: 1, loot: "smoke" },
        { label: "Walk on" },
      ],
    ),
    fork(
      0,
      "two-hatches",
      "The Fork in the Road",
      "The road splits. One way is quiet. The other way has smoke, and shouting.",
      ["Quiet road", "Smoky road"],
    ),
    fork(
      0,
      "staff-only",
      "A Cry for Help",
      "Someone screams for help in the trees off the road. Or you keep walking.",
      ["Keep walking", "Go and help"],
    ),
    gamble(
      0,
      "mimic-keg",
      "The Lucky Stone",
      "A talking stone pays a coin every rub, until it bites. Cash out or rub again. Roll d20.",
      "It bites. Drink 3.",
      "It coughs up a prize. Give 2.",
      ["draught", "die", "candy"],
    ),
    gamble(
      0,
      "one-armed-bandit",
      "The Shell Game",
      "Three cups, one pea, a man who never loses. Win, then walk away or play again. Roll d20.",
      "Wrong cup. Drink 3.",
      "Found it. Give 2.",
      ["die", "draught", "shield"],
    ),
  ],
  elites: [
    elite(
      0,
      "grease-trap-horror",
      "The Black Knight",
      "He has held this crossing for years and lets no one pass. Roll d20.",
      "Knocked flat. Drink 4, then bow to him.",
      "He yields, finally. Give 4.",
      [
        trinket("Traveler's Boots", { hurt: { trap: -1 } }),
        trinket("Black Gauntlet", { roll: { monster: 1 } }),
      ],
    ),
    elite(
      0,
      "health-inspector",
      "The Sheriff",
      "The sheriff says you match a description. Roll d20.",
      "The stocks. Drink 4 and name three things you didn't do.",
      "You bribe him, and he drops his badge. Give 4.",
      [
        trinket("Sheriff's Badge", { roll: { trap: 2 } }),
        trinket("Padded Gambeson", { hearts: 1 }),
      ],
    ),
    elite(
      0,
      "keg-mimic-queen",
      "The Bandit Queen",
      "Every bandit in the woods answers to her, and they're all here. Roll d20.",
      "Robbed blind. Drink 4.",
      "You take her crown, and her gang scatters. Give 4.",
      [
        trinket("Bandit Queen's Crown", { hearts: 1, heal: 1 }),
        trinket("Queen's Dagger", {
          roll: { monster: 1 },
          loot: ["draught"],
        }),
      ],
    ),
    elite(
      0,
      "the-exterminator",
      "The Witch Hunter",
      "He hunts witches, and he has decided you count. Roll d20.",
      "Dunked in the river. Drink 4, holding your breath.",
      "You convince him he's the witch. Give 4.",
      [
        trinket("Silver Bolts", { roll: { monster: 1, elite: 1 } }),
        trinket("Hunter's Coat", { hearts: 1 }),
      ],
    ),
  ],
  bosses: [
    boss(
      0,
      "keg-golem",
      "The Bridge Troll",
      "He wants a toll. Side bets: thumbs up or down on you; wrong bets drink 1. Roll d20.",
      d20(
        BOSS_NEED[0],
        "He takes the toll out of you. Drink 4.",
        "He falls off his own bridge. Give 5.",
        { crit: "He falls off, and pays you a toll. Everyone else drinks 3." },
      ),
      {
        drops: [
          trinket("Troll Hide", { hearts: 2 }),
          trinket("Troll's Club", { roll: { boss: 1 }, loot: ["shield"] }),
        ],
      },
    ),
    boss(
      0,
      "rat-king",
      "The Robber Baron",
      "He says he owns this road, and everyone on it. Kneel, then roll d20.",
      d20(
        BOSS_NEED[0],
        "His court finds you guilty. Drink 4.",
        "You take his keep. Give 5.",
        { fumble: "His court finds you guilty, and broke. Finish your drink." },
      ),
      {
        jinx: {
          name: "My Lord",
          rule: "Everyone calls the cursed player My Lord. Slip: drink 1.",
        },
        drops: [
          trinket("Baron's Saddlebags", { satchel: 4 }),
          trinket("Signet Ring", { roll: { monster: 2 } }),
        ],
      },
    ),
    boss(
      0,
      "the-landlord",
      "The Ogre",
      "An ogre blocks the road. Side bets: thumbs up or down on you; wrong bets drink 1. Roll d20.",
      d20(
        BOSS_NEED[0],
        "He takes a bite. Drink 4.",
        "You trick him into a sack. Give 5.",
        { fumble: "He eats your lunch, then you. Finish your drink." },
      ),
      {
        drops: [
          trinket("Ogre's Key Ring", { roll: { relic: 3 } }),
          trinket("Ogre-Hide Cloak", { hurt: { monster: -1 } }),
        ],
      },
    ),
    boss(
      0,
      "big-cheese",
      "The Great Boar",
      "A cart-sized boar. Side bets: thumbs up or down on you; wrong bets drink 1. Roll d20.",
      d20(BOSS_NEED[0], "Gored. Drink 4.", "You bring it down. Give 5.", {
        crit: "You bring it down, and dinner is served. Everyone else drinks 3.",
      }),
      {
        drops: [
          trinket("Boar's Tusk", { crit: 19 }),
          trinket("Boarhide Armor", { hearts: 2 }),
        ],
      },
    ),
    boss(
      0,
      "the-pipe-organ",
      "The Headless Rider",
      "A rider with no head, galloping right at you. Roll d20.",
      d20(
        BOSS_NEED[0],
        "He swings low. Drink 4.",
        "You knock him out of the saddle. Give 5.",
        {
          fumble:
            "He takes your head for a while. Shut your eyes for 10 seconds, then drink 8.",
        },
      ),
      {
        drops: [
          trinket("Pumpkin Helm", { hurt: { monster: -1 } }),
          trinket("Ghost Lantern", { roll: { ambush: 2 }, loot: ["smoke"] }),
        ],
      },
    ),
  ],
};
