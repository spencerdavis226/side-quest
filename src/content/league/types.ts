import type { CardDefinition, PokemonType } from "../../game/types";

// Pokémon League types (owner, 2026-10-25). Each fight against a Pokémon, or
// a trainer whose card names their Pokémon or who is known for one type,
// carries the type it plays as, read from the card: Misty's Cascade is
// Water, Morty's Gastly is Ghost. A dual-typed Pokémon plays as the type it
// is best known by, which is its first unless the card plays up the other
// (Pidgey and Starly are Flying, Volcarona is a moth made of sun, Baxcalibur
// is very cold). Untyped on purpose: hazards and finds (a ledge, a slot
// machine), and trainers whose card names no Pokémon and who have no type
// (Lass Tiffany, Gambler Lou, Veteran Ada). `docs/LEAGUE_TYPES.md` lists
// every League card with its type. Keys are card IDs without `pokemon.`.

const gyms: Record<string, PokemonType> = {
  // Kanto
  brock: "rock",
  misty: "water",
  "lt-surge": "electric",
  erika: "grass",
  koga: "poison",
  sabrina: "psychic",
  blaine: "fire",
  giovanni: "ground",
  // Johto
  falkner: "flying",
  bugsy: "bug",
  whitney: "normal",
  morty: "ghost",
  chuck: "fighting",
  jasmine: "steel",
  pryce: "ice",
  clair: "dragon",
  // Hoenn
  roxanne: "rock",
  brawly: "fighting",
  wattson: "electric",
  flannery: "fire",
  norman: "normal",
  winona: "flying",
  "tate-liza": "psychic",
  wallace: "water",
  // Sinnoh
  roark: "rock",
  gardenia: "grass",
  maylene: "fighting",
  "crasher-wake": "water",
  fantina: "ghost",
  byron: "steel",
  candice: "ice",
  volkner: "electric",
  // Unova: the Striaton trio sends out whichever brother beats you.
  "striaton-trio": "trio",
  lenora: "normal",
  burgh: "bug",
  elesa: "electric",
  clay: "ground",
  skyla: "flying",
  brycen: "ice",
  drayden: "dragon",
  // Kalos
  viola: "bug",
  grant: "rock",
  korrina: "fighting",
  ramos: "grass",
  clemont: "electric",
  valerie: "fairy",
  olympia: "psychic",
  wulfric: "ice",
  // Alola
  ilima: "normal",
  hala: "fighting",
  lana: "water",
  kiawe: "fire",
  mallow: "grass",
  olivia: "rock",
  nanu: "dark",
  hapu: "ground",
  // Galar
  milo: "grass",
  nessa: "water",
  kabu: "fire",
  bea: "fighting",
  opal: "fairy",
  gordie: "rock",
  piers: "dark",
  raihan: "dragon",
  // Paldea
  katy: "bug",
  brassius: "grass",
  iono: "electric",
  kofu: "water",
  larry: "normal",
  ryme: "ghost",
  tulip: "psychic",
  grusha: "ice",
};

const legendaries: Record<string, PokemonType> = {
  articuno: "ice",
  zapdos: "electric",
  moltres: "fire",
  mewtwo: "psychic",
  mew: "psychic",
  lugia: "psychic",
  "ho-oh": "fire",
  // Raikou, Entei and Suicune together: three types, so none.
  celebi: "psychic",
  "eon-duo": "dragon",
  deoxys: "psychic",
  groudon: "ground",
  kyogre: "water",
  rayquaza: "dragon",
  // The Regi trio: rock, ice and steel, so none.
  dialga: "steel",
  palkia: "water",
  giratina: "ghost",
  darkrai: "dark",
  arceus: "normal",
  // The white flame and the black lightning.
  reshiram: "fire",
  zekrom: "electric",
  xerneas: "fairy",
  yveltal: "dark",
  "tapu-koko": "electric",
  necrozma: "psychic",
  zacian: "fairy",
  eternatus: "poison",
  koraidon: "fighting",
  miraidon: "electric",
};

// Each Elite Four member and Cup finalist by the type on their ribbon; Hop
// by his Dubwool.
const eliteFour: Record<string, PokemonType> = {
  lorelei: "ice",
  bruno: "fighting",
  agatha: "ghost",
  will: "psychic",
  karen: "dark",
  sidney: "dark",
  phoebe: "ghost",
  glacia: "ice",
  drake: "dragon",
  aaron: "bug",
  bertha: "ground",
  flint: "fire",
  lucian: "psychic",
  shauntal: "ghost",
  grimsley: "dark",
  caitlin: "psychic",
  marshal: "fighting",
  malva: "fire",
  siebold: "water",
  wikstrom: "steel",
  drasna: "dragon",
  acerola: "ghost",
  kahili: "flying",
  molayne: "steel",
  marnie: "dark",
  hop: "normal",
  bede: "fairy",
  allister: "ghost",
  rika: "ground",
  poppy: "steel",
  larry: "flying",
  hassel: "dragon",
  crispin: "fire",
  amarys: "steel",
  lacey: "fairy",
  drayton: "dragon",
};

// Champions and rivals by their ace.
const champions: Record<string, PokemonType> = {
  blue: "flying", // Pidgeot
  red: "electric", // Pikachu
  lance: "dragon",
  steven: "steel",
  wallace: "water",
  cynthia: "dragon", // Garchomp, on the card
  alder: "bug", // Volcarona
  iris: "dragon",
  diantha: "fairy", // Gardevoir
  kukui: "rock", // Lycanroc
  leon: "fire", // Charizard, on the card
  geeta: "rock", // Glimmora
  nemona: "electric", // Pawmot
};

const rivals: Record<string, PokemonType> = {
  blue: "flying", // Pidgeot
  silver: "dark", // Sneasel
  wally: "psychic", // Gallade, on the card
  barry: "flying", // Staraptor
  hop: "normal", // Dubwool
  nemona: "electric", // Pawmot
};

// Each team's grunts, admins and boss by the Pokémon the card names, else
// the team's own type: Rocket, Galactic and Skull poison, Magma fire and
// ground, Aqua water, Plasma and Star dark, Flare fire, Macro Cosmos steel.
const hideouts: Record<string, PokemonType> = {
  "rocket-grunt-slots": "poison", // Zubat, on the card
  "rocket-grunt-slowpoke": "poison",
  "rocket-grunt-spinner": "poison",
  "boss-giovanni": "normal", // Persian, on the card
  "magma-grunt-hood": "ground", // wants more land
  "magma-grunt-sweat": "fire", // inside a volcano
  "magma-admin-tabitha": "fire", // Camerupt
  "boss-maxie": "ground", // Groudon, on the card
  "aqua-grunt-bandana": "water",
  "aqua-grunt-submarine": "water",
  "aqua-admin-shelly": "water",
  "boss-archie": "water", // Kyogre, on the card
  "galactic-grunt-bowl": "poison", // Stunky
  "galactic-commander-mars": "normal", // Purugly
  "galactic-scientist-charon": "electric", // Rotom
  "boss-cyrus": "dark", // Weavile
  "plasma-grunt-knight": "dark", // Purrloin
  "plasma-sage": "dark",
  "plasma-n": "electric", // Zekrom
  "boss-ghetsis": "dark", // Hydreigon
  "flare-grunt-suit": "fire", // Houndour
  "flare-scientist": "fire",
  "flare-admin": "fire",
  "boss-lysandre": "fire", // Pyroar
  "skull-grunt-yo": "poison", // Zubat
  "skull-grunt-rap": "poison", // Salandit
  "skull-admin-plumeria": "poison",
  "boss-guzma": "bug", // Golisopod
  "cosmos-oleana": "poison", // Garbodor
  "cosmos-intern": "steel",
  "cosmos-security": "steel",
  "boss-rose": "steel", // Copperajah
  "star-grunt-dance": "dark",
  "star-car": "steel", // Revavroom, on the card
  "star-squad": "dark",
  "boss-cassiopeia": "fairy", // Sylveon
};

// Route fights: the wild Pokémon, or the trainer's Pokémon when the card
// names it or the trainer class is known for one type.
const routes: Record<string, PokemonType> = {
  // Route 1
  pidgey: "flying",
  rattata: "normal",
  zigzagoon: "normal",
  bidoof: "normal",
  wooloo: "normal",
  lechonk: "normal",
  "youngster-joey": "normal", // Rattata, on the card
  "bug-catcher": "bug",
  "ace-rookie": "normal", // Rattata, on the card
  // Route 2
  spearow: "flying",
  ekans: "poison",
  wurmple: "bug",
  starly: "flying",
  lillipup: "normal",
  yungoos: "normal",
  hiker: "rock", // Geodude
  "mt-moon-zubat": "poison", // a swarm of Zubat
  "ace-super-nerd": "rock", // the Helix Fossil
  // Route 3
  psyduck: "water",
  machop: "fighting",
  shinx: "electric",
  roggenrola: "rock",
  pikipek: "flying",
  nickit: "dark",
  swimmer: "water",
  juggler: "electric", // Voltorb, on the card
  "team-rocket": "poison", // Ekans and Koffing
  // Route 4
  ponyta: "fire",
  sableye: "ghost",
  croagunk: "poison",
  sandile: "ground",
  hawlucha: "fighting",
  mudbray: "ground",
  biker: "poison", // Koffing
  psychic: "psychic",
  snorlax: "normal",
  "ace-rocket-boss": "normal", // Raticate, on the card
  // Route 5
  haunter: "ghost",
  scyther: "bug",
  tauros: "normal",
  bronzor: "steel",
  mimikyu: "ghost",
  toxtricity: "electric",
  "black-belt": "fighting",
  "ace-biker-boss": "poison", // Weezing, on the card
  "ace-dragon-tamer": "dragon", // Dragonite, on the card
  // Route 6
  gyarados: "water",
  lucario: "fighting",
  zoroark: "dark",
  goodra: "dragon",
  tinkaton: "fairy",
  salandit: "poison",
  gentleman: "fire", // Growlithe, on the card
  fisherman: "water",
  "ace-karate-king": "fighting", // Hitmonlee and Hitmonchan
  "ace-veteran": "dragon", // Salamence, on the card
  // Route 7
  "snorlax-awake": "normal",
  garchomp: "dragon",
  hydreigon: "dark",
  aegislash: "steel",
  dragapult: "dragon",
  kingambit: "dark",
  "ace-scientist": "psychic", // Mewtwo, on the card
  // Route 8
  tyranitar: "rock",
  metagross: "steel",
  volcarona: "fire",
  "kommo-o": "dragon",
  baxcalibur: "ice",
  gengar: "ghost",
  "cooltrainer-pair": "dragon", // Dragonites, on the card
  "ace-champion-wannabe": "dragon", // Garchomp, on the card
  // The type expansion (2026-10-25, `wilds.ts`)
  oddish: "grass",
  diglett: "ground",
  pichu: "electric",
  seedot: "grass",
  geodude: "rock",
  snubbull: "fairy",
  voltorb: "electric",
  sandshrew: "ground",
  bellsprout: "grass",
  wingull: "water",
  ralts: "psychic",
  phanpy: "ground",
  tangela: "grass",
  engineer: "electric", // Magnemite, on the card
  spritzee: "fairy",
  sudowoodo: "rock",
  rotom: "electric",
  breloom: "grass",
  "ruin-maniac": "ground", // Donphan, on the card
  gardevoir: "psychic",
  wailord: "water",
  rhyperior: "ground",
  electivire: "electric",
  togekiss: "fairy",
  // Victory Road
  golurk: "ground",
  "onix-victory": "steel",
  machamp: "fighting",
};

// Every starter form. A starter keeps its type as it evolves (its first,
// for a dual type: Charizard is Fire); only Eevee's branches change it.
export const formTypes: Record<string, PokemonType> = {
  Bulbasaur: "grass",
  Ivysaur: "grass",
  Venusaur: "grass",
  Charmander: "fire",
  Charmeleon: "fire",
  Charizard: "fire",
  Squirtle: "water",
  Wartortle: "water",
  Blastoise: "water",
  Pikachu: "electric",
  Eevee: "normal",
  Vaporeon: "water",
  Jolteon: "electric",
  Flareon: "fire",
  Cyndaquil: "fire",
  Quilava: "fire",
  Typhlosion: "fire",
  Totodile: "water",
  Croconaw: "water",
  Feraligatr: "water",
  Treecko: "grass",
  Grovyle: "grass",
  Sceptile: "grass",
  Torchic: "fire",
  Combusken: "fire",
  Blaziken: "fire",
  Mudkip: "water",
  Marshtomp: "water",
  Swampert: "water",
  Piplup: "water",
  Prinplup: "water",
  Empoleon: "water",
  Turtwig: "grass",
  Grotle: "grass",
  Torterra: "grass",
  Oshawott: "water",
  Dewott: "water",
  Samurott: "water",
  Chespin: "grass",
  Quilladin: "grass",
  Chesnaught: "grass",
  Fennekin: "fire",
  Braixen: "fire",
  Delphox: "fire",
  Froakie: "water",
  Frogadier: "water",
  Greninja: "water",
  Rowlet: "grass",
  Dartrix: "grass",
  Decidueye: "grass",
  Scorbunny: "fire",
  Raboot: "fire",
  Cinderace: "fire",
  Fuecoco: "fire",
  Crocalor: "fire",
  Skeledirge: "fire",
  Bidoof: "normal",
  Bibarel: "normal",
  Magikarp: "water",
  Gyarados: "water",
  Togepi: "fairy",
  Togetic: "fairy",
  Sunkern: "grass",
  Sunflora: "grass",
  Drowzee: "psychic",
  Hypno: "psychic",
  Zubat: "poison",
  Golbat: "poison",
  Spheal: "ice",
  Sealeo: "ice",
  Walrein: "ice",
  Riolu: "fighting",
  Lucario: "fighting",
  Cubone: "ground",
  Marowak: "ground",
  Rookidee: "flying",
  Corvisquire: "flying",
  Corviknight: "flying",
  Caterpie: "bug",
  Metapod: "bug",
  Butterfree: "bug",
  Larvitar: "rock",
  Pupitar: "rock",
  Tyranitar: "rock",
  Gastly: "ghost",
  Haunter: "ghost",
  Gengar: "ghost",
  Gible: "dragon",
  Gabite: "dragon",
  Garchomp: "dragon",
  Zorua: "dark",
  Zoroark: "dark",
  Aron: "steel",
  Lairon: "steel",
  Aggron: "steel",
};

/** Every typed League card, by full card ID. */
export const leagueTypes: Readonly<Record<string, PokemonType>> =
  Object.fromEntries(
    [
      ["gym-", gyms],
      ["legendary-", legendaries],
      ["elite-", eliteFour],
      ["league-champion-", champions],
      ["rival-", rivals],
      ["", hideouts],
      ["route-", routes],
    ].flatMap(([prefix, map]) =>
      Object.entries(map as Record<string, PokemonType>).map(([id, t]) => [
        `pokemon.${prefix as string}${id}`,
        t,
      ]),
    ),
  );

/** Give the League's cards their types: fights by `leagueTypes`, starters
 * and each form by `formTypes` (a form only when it differs). Throws on an
 * ID that names no card, so a renamed card can't silently lose its type. */
export function applyTypes(cards: CardDefinition[]): void {
  const byId = new Map(cards.map((c) => [c.id, c]));
  for (const [id, type] of Object.entries(leagueTypes)) {
    const c = byId.get(id);
    if (!c) throw Error(`League type for a missing card: ${id}`);
    c.type = type;
  }
  for (const c of cards) {
    if (!c.omen || !c.id.startsWith("pokemon.starter-")) continue;
    c.type = formTypes[c.title];
    for (const e of c.evolves ?? [])
      if (formTypes[e.title] !== c.type) e.type = formTypes[e.title];
  }
}
