import {
  CHAMPION_NEED,
  champion,
  d20,
  ELITE_NEED,
  eliteFour,
  GYM_NEED,
  LEGENDARY_NEED,
  leader,
  legendary,
  type Region,
} from "./shared";

// Sinnoh (2026-10-16), gyms in Diamond and Pearl's badge order.
export const sinnoh: Region = {
  gyms: [
    leader(
      0,
      "roark",
      "Roark",
      "Coal",
      "Roark shines his miner's headlamp right in your eyes. Squint at him, then roll d20.",
      d20(
        GYM_NEED[0],
        "Cave-in. Drink 4 with your eyes shut.",
        "You strike coal. Shine your phone light on a player; they drink 3.",
        {
          fumble: "Black lung. Finish your drink.",
        },
      ),
    ),
    leader(
      1,
      "gardenia",
      "Gardenia",
      "Forest",
      "Gardenia fears ghosts. Tell her a ghost story in 20 seconds. Table votes not scary: drink 4.",
    ),
    leader(
      2,
      "maylene",
      "Maylene",
      "Cobble",
      "Maylene fights barefoot. Shoes off, then thumb-wrestle your left neighbor. Lose: drink 5.",
    ),
    leader(
      3,
      "crasher-wake",
      "Crasher Wake",
      "Fen",
      "Crasher Wake is a luchador. Put on an imaginary mask, flex at the table, and roll d20.",
      d20(
        GYM_NEED[3],
        "Body slam. Drink 5, then flex again.",
        "You pin him for three. Give 5.",
        {
          crit: "You unmask him. Give a shot.",
          fumble: "Piledriver. Finish your drink.",
        },
      ),
    ),
    leader(
      4,
      "fantina",
      "Fantina",
      "Relic",
      "Fantina wants ze dance. Dance 15 seconds with no music. Table votes not magnifique: drink 5.",
    ),
    leader(
      5,
      "byron",
      "Byron",
      "Mine",
      "Byron is Roark's dad and louder about it. Shout your biggest flex at the table, then roll d20.",
      d20(
        GYM_NEED[5],
        "Iron Defense. Drink 5, and the table rates your flex out of 10.",
        "You dent the old man. Give 5.",
        {
          crit: "You bend his steel. Everyone else drinks 3.",
          fumble: "Steel beam to the face. Finish your drink.",
        },
      ),
    ),
    leader(
      6,
      "candice",
      "Candice",
      "Icicle",
      "Candice says focus! Hold an ice cube in your bare fist for 30 seconds. Drop it: drink 6.",
    ),
    leader(
      7,
      "volkner",
      "Volkner",
      "Beacon",
      "Volkner is so bored he blacked out the city. Bore the table with a fun fact, then roll d20.",
      d20(
        GYM_NEED[7],
        "He yawns at you. Drink 6 and tell another fun fact.",
        "You spark him up. Whoever yawned during your fact drinks 4.",
        {
          crit: "He's finally interested. Everyone else drinks 4.",
          fumble: "Blackout. Finish your drink in the dark.",
        },
      ),
    ),
  ],

  eliteFour: [
    eliteFour(
      "aaron",
      "Aaron",
      "Bug",
      "Aaron loves bugs. Eat a crumb off the floor, or fake it well, then roll d20.",
      d20(
        ELITE_NEED,
        "Bug Bite. Drink 5 and buzz for five seconds.",
        "You squash his bugs. Slap the table and give 5.",
      ),
    ),
    eliteFour(
      "bertha",
      "Bertha",
      "Ground",
      "Grandma Bertha asks about your love life. Answer every question for 20 seconds. Dodge one: drink 5.",
    ),
    eliteFour(
      "flint",
      "Flint",
      "Fire",
      "Flint's afro is on fire again. Fluff your hair at the table, then roll d20.",
      d20(
        ELITE_NEED,
        "Singed. Pat out your hair, then drink 5.",
        "You put out the afro. Pat out your left neighbor's head; they drink 3.",
        {
          fumble: "Flare Blitz. Take a spicy shot.",
        },
      ),
    ),
    eliteFour(
      "lucian",
      "Lucian",
      "Psychic",
      "Lucian reads mid-battle. Read your last sent text aloud, dramatically. Refuse: finish your drink.",
    ),
  ],

  champions: [
    champion(
      "cynthia",
      "Cynthia",
      "Sinnoh",
      "Cynthia's Garchomp has never lost. The whole table holds hands and prays, then roll d20.",
      d20(
        CHAMPION_NEED,
        "Earthquake. Everyone drinks 4 without letting go of hands.",
        "Garchomp flinches. Give 4, and everyone lets go.",
        {
          crit: "Cynthia drops her hair clip. Give 10.",
          fumble: "Garchomp sweeps the table. Everyone finishes their drink.",
        },
      ),
    ),
  ],

  legendaries: [
    legendary(
      "dialga",
      "Dialga",
      "Dialga controls time. Drink for exactly 5 seconds, counted out loud by the table, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "Roar of Time. Drink 5, and talk in slow motion until your next turn.",
        "Time is on your side. Pick a player: they drink for 5 seconds, counted by the table.",
        {
          crit: "Time stops for you. Everyone else drinks 4.",
        },
      ),
    ),
    legendary(
      "palkia",
      "Palkia",
      "Palkia bends space. Swap seats with the player farthest from you, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "Spacial Rend. Drink 5, then swap seats again.",
        "You close the rift. Whoever is farthest from you now drinks 3.",
      ),
    ),
    {
      ...legendary(
        "giratina",
        "Giratina",
        "Giratina lives in a world turned backwards. Say your name backwards, then roll d20.",
        d20(
          LEGENDARY_NEED,
          "Shadow Force. Drink 5.",
          "You drag it out. Pick a player: they say their name backwards or drink 3.",
          {
            fumble: "Lost in the Distortion World. Finish your drink.",
          },
        ),
      ),
      jinx: {
        name: "Backwards",
        rule: "Everyone calls the jinxed player their name backwards. Slip: drink 1.",
      },
    },
    legendary(
      "darkrai",
      "Darkrai",
      "Darkrai feeds on nightmares. Tell the table your weirdest sex dream, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "Bad dream. Drink 5 while the table interprets it.",
        "You wake up. Anyone who's had that dream too drinks 3.",
        {
          fumble: "Sleep paralysis. Finish your drink.",
        },
      ),
    ),
    legendary(
      "arceus",
      "Arceus",
      "Arceus is literally God. Pray out loud for 5 seconds, then roll d20.",
      d20(
        LEGENDARY_NEED,
        "Judgment. Drink 6 and confess one sin to the table.",
        "God blinks. Give 6.",
        {
          crit: "You caught God. Everyone else finishes their drink.",
          fumble: "Smited. Finish your drink.",
        },
      ),
    ),
  ],
};
