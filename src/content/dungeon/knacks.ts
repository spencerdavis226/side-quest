import type { CardDefinition, Knack } from "../../game/types";

// Pub Crawl's knacks (2026-10-25): what each class is good at, and the
// rooms that call for it. An adventurer with the room's knack fights it with
// the edge (a dice fight rolls double the dice and keeps the best; a trial's
// loss costs a heart less); one without it fights as written, so a knack is
// never a penalty. Eight rooms a floor, each knack on every floor where it
// fits: Brawn for the big and physical, Sneak for traps and footwork, Magic
// for spells and things that shouldn't be alive, Charm for anyone you can
// talk round, Faith for the dead and the haunted. The joke classes have no
// knacks. `tests/dungeon.test.ts` checks about two knack fights a run.

/** Each class's two knacks, by class ID. */
export const classKnacks: Readonly<Record<string, [Knack, Knack]>> = {
  barbarian: ["brawn", "charm"],
  rogue: ["sneak", "charm"],
  cleric: ["faith", "charm"],
  wizard: ["magic", "sneak"],
  bard: ["charm", "magic"],
  paladin: ["faith", "brawn"],
  ranger: ["sneak", "brawn"],
  monk: ["brawn", "faith"],
  necromancer: ["magic", "faith"],
  alchemist: ["magic", "sneak"],
  warlock: ["magic", "charm"],
  bouncer: ["brawn", "charm"],
  bartender: ["charm", "sneak"],
  mercenary: ["brawn", "sneak"],
  druid: ["faith", "magic"],
};

/** The rooms that call for a knack, floor by floor, by card ID. */
export const roomKnacks: Readonly<Record<string, Knack>> = {
  // The Cellar.
  "drunk-goblin": "brawn",
  "rolling-kegs": "brawn",
  "christmas-lights": "sneak",
  "loose-floorboard": "sneak",
  "goblin-shaman": "magic",
  "mold-elemental": "magic",
  "rat-trench-coat": "charm",
  "barback-poltergeist": "faith",
  // The Wine Cellar.
  "boxed-wine-golem": "brawn",
  "tannin-troll": "brawn",
  "cork-mines": "sneak",
  "falling-rack": "sneak",
  "sangria-sprite": "magic",
  "wine-mom-banshee": "charm",
  "vinegar-vampire": "faith",
  "decanter-ghost": "faith",
  // The Brewery.
  "mash-tun-monster": "brawn",
  "forklift-goblin": "brawn",
  "keg-ninja": "sneak",
  "bottle-bombs": "sneak",
  "sour-mash-witch": "magic",
  "hazy-wraith": "magic",
  "craft-bro": "charm",
  "brewers-ghost": "faith",
  // The Catacombs.
  "gym-ghoul": "brawn",
  "crypt-crawler": "brawn",
  "dart-wall": "sneak",
  "rolling-skull": "sneak",
  "hex-witch": "magic",
  "vampire-bro": "charm",
  "bachelor-ghosts": "faith",
  "the-seance": "faith",
  // The Sewers.
  "gator-junior": "brawn",
  "fatberg-spawn": "brawn",
  "loose-grate": "sneak",
  "manhole-cover": "sneak",
  "drain-witch": "magic",
  "rat-don": "charm",
  "pizza-rat-prime": "charm",
  "turtle-sensei": "faith",
  // The Walk-in Freezer.
  "frost-giant": "brawn",
  "the-mammoth": "brawn",
  "slippery-floor": "sneak",
  "icicle-drop": "sneak",
  "margarita-elemental": "magic",
  "frozen-bachelor": "charm",
  "thawed-caveman": "charm",
  "ice-wraith": "faith",
  // The Drowned Taproom.
  "foam-leviathan": "brawn",
  "barnacle-bro": "brawn",
  "undertow-tap": "sneak",
  "floating-stools": "sneak",
  "last-orders-siren": "magic",
  "merfolk-ex": "charm",
  "pirate-ghost": "faith",
  "drowned-choir": "faith",
  // The Kitchen.
  "line-cook-golem": "brawn",
  "rogue-rotisserie": "brawn",
  mandoline: "sneak",
  "wet-floor": "sneak",
  "sentient-sourdough": "magic",
  "food-critic-ghoul": "charm",
  "garlic-wraith": "faith",
  "microwave-ghost": "faith",
  // The Rooftop Bar.
  "pigeon-king": "brawn",
  "influencer-golem": "brawn",
  "the-ledge": "sneak",
  "loose-tile": "sneak",
  thunderstorm: "magic",
  "hot-tub-wizard": "magic",
  "the-neighbor": "charm",
  "the-gargoyle": "faith",
};

/** The strikes (2026-10-25), by card ID: rooms with no roll that a class
 * with the knack wins and any other loses. Kept apart from `roomKnacks`,
 * whose eight a floor are rolled with the edge. */
export const strikeKnacks: Readonly<Record<string, Knack>> = {
  // The Cellar.
  "skeleton-barback": "charm",
  "possessed-mop": "brawn",
  "cask-bat": "sneak",
  "fryer-oil-ooze": "magic",
  "cobweb-bartender": "faith",
  "falling-taps": "sneak",
  // The Wine Cellar.
  "zombie-sommelier": "charm",
  "barrel-mimic": "brawn",
  "corkscrew-crab": "sneak",
  "sulfite-cloud": "magic",
  "rose-elemental": "faith",
  "cork-goblin": "charm",
  // The Catacombs.
  "hungover-mummy": "faith",
  "banshee-karaoke": "charm",
  "zombie-roommate": "brawn",
  "collapsing-floor": "sneak",
  "skeleton-mariachi": "magic",
  "grabbing-hand": "brawn",
  // The Sewers.
  "toilet-mimic": "brawn",
  "sludge-bro": "charm",
  "flushed-goldfish": "faith",
  "big-flush": "sneak",
  "pipe-octopus": "magic",
  "sewer-mutant": "brawn",
  // The Drowned Taproom.
  "sommelier-kraken": "brawn",
  "drowned-regular": "faith",
  "piranha-shots": "sneak",
  "kelp-bouncer": "charm",
  "drain-vortex": "magic",
  "snorkel-shark": "brawn",
  // The Kitchen.
  "deep-fryer-demon": "magic",
  "walk-in-yeti": "brawn",
  "rat-chef": "charm",
  "swinging-door": "sneak",
  "dish-pit-horror": "faith",
  "hot-pan": "sneak",
  // The Brewery.
  "hop-goblin": "charm",
  "yeast-beast": "magic",
  "foam-ferrets": "sneak",
  "gruit-druid": "faith",
  "spent-grain-golem": "brawn",
  "co2-leak": "sneak",
  // The Walk-in Freezer.
  "brain-freeze": "magic",
  "the-snowman": "brawn",
  "popsicle-golem": "charm",
  "the-door-shuts": "sneak",
  "ice-goblin": "sneak",
  "tongue-on-the-pole": "magic",
  // The Rooftop Bar.
  "the-seagull": "brawn",
  "the-proposal": "charm",
  "rogue-drone": "sneak",
  "the-sprinklers": "magic",
  "the-fireworks": "faith",
  "the-heat-lamp": "sneak",
};

/** Give the classes and rooms their knacks. Throws on an ID that names no
 * card, so a renamed card can't silently lose its knack. */
export function applyKnacks(cards: CardDefinition[]): void {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const find = (id: string) => {
    const c = byId.get(`dungeon.${id}`);
    if (!c) throw Error(`Knack for a missing card: dungeon.${id}`);
    return c;
  };
  for (const [id, knacks] of Object.entries(classKnacks))
    find(`class-${id}`).knacks = [...knacks];
  for (const [id, knack] of Object.entries({ ...roomKnacks, ...strikeKnacks }))
    find(id).knack = knack;
}
