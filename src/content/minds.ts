import type { CardDefinition, PackDefinition } from "../game/types";
import { cardFactory, flip, roll } from "./author";

// Great Minds (2026-11-24, owner): everyone answers at once, so the whole
// table plays every card. Herd Mentality's rule (match the crowd; the odd one
// out pays) and Wavelength's scale (show a number of fingers) done as one
// card each. Nothing is counted between cards.
//
// Herd prompts are `minds.herd-NNN` and scale prompts `minds.scale-NNN`, by
// position in their lists: append only, and never reuse a number. A retired
// prompt stays as `null`. The rest are by slug.
const card = cardFactory("minds");

type Prompt = [title: string, prompt: string] | null;

// "On 3, everyone names <prompt>. Lone answers drink 2."
const herd: Prompt[] = [
  ["Drunk Food", "the best food after 2 AM"],
  ["Gas Station Gourmet", "the grossest gas-station snack"],
  ["Hot Tub Soup", "the worst thing to find in a hot tub"],
  ["Body Parts", "the funniest-sounding body part"],
  ["Last Meal", "a last meal before the electric chair"],
  ["Shot Glass", "the worst liquor to take a shot of"],
  ["Bad Tattoo", "the worst place to get a tattoo"],
  ["Gate Lice", "the saddest airport to be stuck in"],
  ["Red Flag", "the biggest red flag on a first date"],
  ["Fake Sick", "the best fake excuse to call in sick"],
  ["Karaoke Crime", "the worst karaoke song to pick"],
  ["Table for One", "the worst holiday to be single"],
  ["Dog Name", "the dumbest name for a dog"],
  ["Future Mullet", "a baby name that guarantees a mullet"],
  ["Pizza Crime", "the worst pizza topping"],
  ["Throne Reading", "the best thing to read on the toilet"],
  ["Smell Test", "the worst smell in a car"],
  ["Toast Bomb", "the worst thing to say in a wedding toast"],
  ["Free Beer", "a beer you'd only drink if it was free"],
  ["Mystery Meat", "the sketchiest meat you'd still eat"],
  ["Flyover", "the most boring state to drive across"],
  ["Hair of the Dog", "the best hangover cure"],
  ["Chat Name", "the dumbest name for a group chat"],
  ["Neon Sign", "the worst name for a strip club"],
  ["Cover Band", "a terrible name for a cover band"],
  ["Useless Power", "the most useless superpower"],
  ["Zombie Night", "the best thing in this room to fight zombies"],
  ["Midlife Crisis", "the first thing you'd buy in a midlife crisis"],
  ["Yard Time", "the most useful skill in prison"],
  ["Splash Zone", "the worst place to throw up"],
  ["Rest Stop", "the worst kind of public bathroom"],
  ["Drive-Thru Loyalty", "the fast food chain you'd die defending"],
  ["Hundred Bucks", "the grossest thing you'd eat for $100"],
  ["Breakfast Champ", "the best cereal of all time"],
  ["Fair Fight", "an animal you could beat in a fight"],
  ["Pregame Anthem", "the best song to pregame to"],
  ["Wrong Room", "the worst thing to say at a funeral"],
  ["Gas Snacks", "the best road trip snack"],
  ["Sock Drawer", "the weirdest thing hidden in a sock drawer"],
  ["Junk Drawer", "the most useless kitchen gadget"],
  ["Nap Sport", "the most boring sport to watch"],
  ["Haunted House", "the worst room in a house to be haunted"],
  ["Roommate From Hell", "the worst roommate habit"],
  ["Cheap Date", "the cheapest acceptable first date"],
  ["Add to Cart", "the dumbest thing to buy drunk online"],
  ["Dirty Money", "the grossest job you'd take for good money"],
  ["Mouth Noises", "the most annoying sound a person makes"],
  ["Wrong Hole", "a thing that never goes in on the first try"],
  ["Morning After", "the first thing you do hungover"],
  ["Weird Flex", "the weirdest thing to brag about"],
  ["Cry Spot", "the best place to cry in public"],
  ["Bad Clams", "the worst food to get food poisoning from"],
  ["Tent Life", "the worst thing to forget on a camping trip"],
  ["Potty Mouth", "the best swear word"],
  ["Deal Breaker", "the worst thing a date can order"],
  ["Puke Ride", "the worst theme park ride to puke on"],
  ["Thumbs Up", "the most passive-aggressive emoji"],
  ["One Star", "the fastest way to tank your Uber rating"],
  ["Registry Fail", "the worst wedding gift"],
  ["Bar Fight", "the dumbest reason to start a bar fight"],
  ["Gas Leak", "the worst food to eat before a date"],
  ["Cast Signer", "the dumbest way to break a bone"],
  ["Mascot", "the worst animal for a team mascot"],
  ["Swipe Left", "the worst word in a dating bio"],
  ["Coal", "the worst gift to get from your parents"],
];

// "Show 1 to 5 fingers on 3: <prompt>? Furthest from you drinks 2."
const scale: Prompt[] = [
  ["Gross-o-Meter", "how gross is a hot tub"],
  ["Pool Rules", "how normal is peeing in the pool"],
  ["Sushi Trust", "how safe is gas-station sushi"],
  ["Dad Bod", "how hot is a dad bod"],
  ["Side Hustle", "how much could your feet earn"],
  ["Floor Food", "how long is the five-second rule"],
  ["Ghost Story", "how haunted was your childhood home"],
  ["Sent at 3 AM", "how bad was your last drunk text"],
  ["Pineapple", "how good is pineapple on pizza"],
  ["Clown Car", "how scary are clowns"],
  ["Breath Check", "how bad is your breath right now"],
  ["Seat Cover", "how gross is a gas-station toilet seat"],
  ["Cold Slice", "how good is cold pizza for breakfast"],
  ["Croc Check", "how acceptable are Crocs at a wedding"],
  ["Sloppy Meter", "how drunk is the drunkest one here"],
  ["Shower Pee", "how often do you pee in the shower"],
  ["Raw Dough", "how worth it is raw cookie dough"],
  ["Pigeon Intel", "how much do pigeons know"],
  ["Tomorrow", "how bad will tomorrow morning be"],
];

const pad = (n: number) => String(n).padStart(3, "0");

const herdCards = herd.flatMap((p, i) =>
  p
    ? [
        card(
          `herd-${pad(i + 1)}`,
          p[0],
          "group",
          `On 3, everyone names ${p[1]}. Lone answers drink 2.`,
        ),
      ]
    : [],
);

const scaleCards = scale.flatMap((p, i) =>
  p
    ? [
        card(
          `scale-${pad(i + 1)}`,
          p[0],
          "group",
          `Show 1 to 5 fingers on 3: ${p[1]}? Furthest from you drinks 2.`,
        ),
      ]
    : [],
);

const specials: CardDefinition[] = [
  card(
    "hive-mind",
    "Hive Mind",
    "group",
    "On 3, everyone names a body part. All match, you drink 5. Otherwise the odd ones drink 2.",
  ),
  card(
    "mind-meld",
    "Mind Meld",
    "challenge",
    "You and your left neighbor say a word at once until you match. Each miss, both drink 1.",
  ),
  card(
    "majority-rules",
    "Majority Rules",
    "group",
    "On 3, everyone points up or down. The smaller side drinks 2. A tie, everyone drinks 2.",
  ),
  card(
    "finger-count",
    "Finger Count",
    "group",
    "On 3, everyone shows 1 to 6 fingers. Then roll d6.",
    roll(1, 6, "Everyone showing {total} drinks {total}."),
  ),
  card(
    "coin-beer-or-liquor",
    "Beer or Liquor",
    "group",
    "On 3, everyone says beer or liquor. Then flip the coin.",
    flip(
      "Tails. Everyone who said beer drinks 2.",
      "Heads. Everyone who said liquor drinks 2.",
    ),
  ),
];

export const mindsCards: CardDefinition[] = [
  ...herdCards,
  ...scaleCards,
  ...specials,
];

export const mindsPack: PackDefinition = {
  version: 1,
  id: "minds",
  logo: "art/packs/minds.svg",
  title: "Great Minds",
  description:
    "Everyone answers on 3. Match the crowd or pay for it: the odd ones out drink.",
  cardIds: mindsCards.map((c) => c.id),
};
