// Pixel art for the side-on rounds, drawn once at load time into small canvases.
// Sprites are written as text: each letter is a colour from PALETTE and '.' is
// see-through. Every sprite faces right; flipped copies face left.

const TILE = 16;

const PALETTE = {
  k: '#000000',
  e: '#8a8e98', // steel helmet
  E: '#4a4e58', // dark steel
  r: '#ff3020', // glowing visor
  s: '#c8906a', // skin
  a: '#7a1a10', // armour
  A: '#4a0c08', // dark armour
  g: '#d8ac48', // gold trim
  d: '#2a1a12', // belt, boots
  w: '#e0e3e8', // chrome
  b: '#3a5ab8', // Delft-blue porcelain
  c: '#7ff6ff', // cyan energy cell
  W: '#fff8e8', // feathers
  y: '#ffd860', // gold feather tips
  n: '#3a1a10', // charred hound skin
  o: '#ff7a10', // burning cracks
  O: '#ffb020', // bright fire
  Y: '#ffee66', // hound eyes
  t: '#d8ccb0', // teeth
  h: '#7a8aa8', // elephant hide
  H: '#4a5878', // dark hide
  l: '#bff8ff', // lightning
  i: '#e8eef4', // ivory tusks
  R: '#ff4a3a', // soul gem
  D: '#a01010', // soul gem dark
  x: '#fff8c0', // white-hot
  f: '#ff6a10', // flame
  G: '#30d060', // health green
  q: '#188030', // health green dark
};

function makeSprite(rows, palette = PALETTE) {
  const c = document.createElement('canvas');
  c.width = Math.max(...rows.map((r) => r.length));
  c.height = rows.length;
  const g = c.getContext('2d');
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = palette[row[x]];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  });
  return c;
}

function flipSprite(src) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext('2d');
  g.translate(src.width, 0);
  g.scale(-1, 1);
  g.drawImage(src, 0, 0);
  return c;
}

// Returns { r: rightFacing, l: leftFacing }.
function pair(rows, palette) {
  const r = makeSprite(rows, palette);
  return { r, l: flipSprite(r) };
}

// ---------- You: a hell warrior in red armour ----------
const HERO_TOP = [
  '...kkkkkk...',
  '..keeeeeek..',
  '.keeeeeeeek.',
  '.keEkkkkkek.',
  '.kekrrrrrkk.',
  '.keeeeeeeek.',
  '..kEssssEk..',
  '...kkkkkk...',
  '..kaaaaaak..',
  '.kaaggaaaak.',
  '.kAaaaaaaAk.',
  '..kdddddk...',
];
const HERO_STAND = [...HERO_TOP, '..kaakkaak..', '..kAAk.kAAk.', '..kddk.kddk.', '............'];
const HERO_WALK = [...HERO_TOP, '.kaak..kaak.', '.kAAk..kAAk.', 'kddk....kddk', '............'];
const HERO_JUMP = [...HERO_TOP, '..kaakkaak..', '..kddkkddk..', '............', '............'];

// The Flak Shotgun in your hands: chrome barrels, Delft-blue porcelain, cyan cells.
const FLAK = [
  '.kkkkkkkkkkkk',
  'kwwwwwwwwwwwwk',
  'kbbcbbcbbkkkk.',
  '.kbbbbk.......',
  '..kkkk........',
];

// Angel wings, on your back. Spread up, spread down, and folded.
const WINGS_UP = [
  'kk..........',
  'kWWk........',
  'kWWWWk......',
  '.kWWWWWk....',
  '.kyWWWWWWk..',
  '..kyWWWWWWk.',
  '...kyyWWWWWk',
  '....kkyyWWk.',
  '......kkkk..',
];
const WINGS_DOWN = [
  '............',
  '............',
  '......kkkkk.',
  '...kkkWWWWWk',
  '.kkWWWWWWWk.',
  'kWWWWWWWyk..',
  'kWWWWyyyk...',
  '.kWWyk.kk...',
  '..kkk.......',
];
const WINGS_FOLDED = [
  '............',
  '............',
  '.......kk...',
  '......kWWk..',
  '.....kWWWk..',
  '....kWWWyk..',
  '....kWWyk...',
  '.....kkk....',
];

// ---------- The motorbike: a dark steel chopper with flame paint ----------
const BIKE_A = [
  '...............kk...',
  '..............kwk...',
  '...kkkkkk....kwk....',
  '..kEEEEEEkkkkEEk....',
  '.kEEEEEEEEEEEEEEk...',
  '.kEffOffOffOffEEk...',
  '..kkkkkEEEEEEEkkkk..',
  '.kkkk..kEEEEk..kkkk.',
  'kkwwkk..kkkk..kkwwkk',
  'kwOOwk........kwOOwk',
  'kkwwkk........kkwwkk',
  '.kkkk..........kkkk.',
];
// Second frame: the wheel spokes have turned.
const BIKE_B = BIKE_A.slice();
BIKE_B[8] = 'kwkkwk..kkkk..kwkkwk';
BIKE_B[9] = 'kkOOkk........kkOOkk';
BIKE_B[10] = 'kwkkwk........kwkkwk';

// ---------- Hellhounds: charred, cracked with fire, and flying ----------
const HOUND_TOP = [
  'OO............k..k..',
  'Oo...........knnnnk.',
  'fof.........knnnYYnk',
  '.fokkkkkkkkkknnnnnnn',
  '..konnnonnnnnknnkttk',
  '..knnonnnnonnnkkkkk.',
  '..knnnnonnnnnnk.....',
  '...knnnnnnnonnk.....',
];
const HOUND_A = [...HOUND_TOP, '..knk.........knk...', '.knk...........knk..', 'kk...............kk.', '....................'];
const HOUND_B = [...HOUND_TOP, '....knk....knk......', '....kk.....kk.......', '....................', '....................'];

// ---------- Lightning elephants ----------
const ELEPHANT_TOP = [
  '......kkkkkkkkk.............',
  '....kkhhhhhhhhhkk...kkkk....',
  '...khhhhhlhhhhhhhk.khhhhk...',
  '..khhhhhhhlhhhhhhhkhhhhhhk..',
  '..khhhlhhhhhhhhhhhkhhhhhhhk.',
  '.khhhhhlhhhhhhlhhhkhhhlhhhk.',
  '.khhhhhhllhhhhhhhhkhhhhhhhk.',
  '.kHhhhhhhhhhhhhhhhhkhhhhhhk.',
  '.kHhhhhlhhhhhhhhhhhhkhhhhhk.',
  '.kHHhhhhhhhhhhhhhhhhkkhhhhk.',
  'k.kHHhhhhhhhhlhhhhhhiiikhhk.',
  'k..kHHhhhhhhhhhhhhhkkiiikhk.',
  '.k.kHHHHhhhhhhhhHHHk..kiikhk',
  '...kHHkkkHHHHHHkkHHk...kkhhk',
];
const ELEPHANT_A = [
  ...ELEPHANT_TOP,
  '...kHHk.kHHk.kHHkkHHk....khk',
  '...kHHk.kHHk.kHHk.kHHk...khk',
  '...kHHk.kHHk.kHHk.kHHk...kk.',
  '...kkkk.kkkk.kkkk.kkkk......',
];
const ELEPHANT_B = [
  ...ELEPHANT_TOP,
  '...kHHk..kHHkkHHk..kHHk..khk',
  '..kHHk...kHHk.kHHk.kHHk..khk',
  '..kHHk....kHHk.kHHkkHHk..kk.',
  '..kkkk....kkkk.kkkkkkkk.....',
];

// ---------- Pickups and the prize ----------
const SHELLS = [
  'kkkkkkkkkk',
  'kOOOOOOOOk',
  'kOaaOaaOOk',
  'kOaaOaaOOk',
  'kOggOggOOk',
  'kffffffffk',
  'kkkkkkkkkk',
];
const HEALTH = [
  'kkkkkkkkkk',
  'kGGGGGGGGk',
  'kGGGWWGGGk',
  'kGWWWWWWGk',
  'kGWWWWWWGk',
  'kGGGWWGGGk',
  'kqqqqqqqqk',
  'kkkkkkkkkk',
];
const SOUL_GEM = [
  '...kkkkkkkk...',
  '..kxxRDDRxxk..',
  '.kxxRDDDDRxxk.',
  'kkkkkkkkkkkkkk',
  'kRDDxRRRRDDDRk',
  '.kRDxRRRDDDRk.',
  '..kRxRRDDDRk..',
  '...kRxRDDRk...',
  '....kRxDRk....',
  '.....kRRk.....',
  '......kk......',
];

// ---------- Tiles ----------
function tileCanvas(draw) {
  const c = document.createElement('canvas');
  c.width = TILE;
  c.height = TILE;
  draw(c.getContext('2d'));
  return c;
}

// A rounded lump of rock with a light top-left and dark bottom-right.
function rockLump(g, x, y, w, h, base, light, dark) {
  g.fillStyle = dark;
  g.fillRect(x + 1, y, w - 2, h);
  g.fillRect(x, y + 1, w, h - 2);
  g.fillStyle = base;
  g.fillRect(x + 1, y, w - 2, h - 1);
  g.fillRect(x, y + 1, w - 1, h - 3);
  g.fillStyle = light;
  g.fillRect(x + 1, y + 1, w - 3, 1);
  g.fillRect(x + 1, y + 1, 1, h - 4);
}

// Hellrock: dark basalt lumps with lava glowing in the cracks between them.
const ROCK_LAYOUTS = [
  [[1, 1, 8, 7], [10, 1, 5, 6], [1, 9, 6, 6], [8, 8, 7, 7]],
  [[1, 1, 6, 6], [8, 1, 7, 8], [1, 8, 8, 7], [10, 10, 5, 5]],
];
const ROCK_TILES = ROCK_LAYOUTS.map((lumps, i) =>
  tileCanvas((g) => {
    g.fillStyle = '#1a0605';
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle = '#c03a08';
    if (i === 0) {
      g.fillRect(9, 3, 1, 4);
      g.fillRect(3, 8, 4, 1);
    } else {
      g.fillRect(7, 9, 1, 4);
      g.fillRect(11, 9, 3, 1);
    }
    for (const [x, y, w, h] of lumps) rockLump(g, x, y, w, h, '#4a1c14', '#7a3420', '#2a0c08');
  }),
);

// The ember crust on top of any rock with open air above it.
const CRUST = tileCanvas((g) => {
  g.fillStyle = '#3a0a04';
  g.fillRect(0, 0, TILE, 5);
  g.fillStyle = '#c03a08';
  g.fillRect(0, 0, TILE, 2);
  g.fillStyle = '#ff8a20';
  g.fillRect(0, 0, TILE, 1);
  g.fillStyle = '#ffd060';
  for (const x of [2, 7, 12]) g.fillRect(x, 0, 2, 1);
  g.fillStyle = '#3a0a04';
  for (const x of [1, 5, 9, 14]) g.fillRect(x, 5, 1, 2);
});

// Rune and skull blocks share a frame; the symbol in the middle differs.
const FLAME_RUNE = [
  '....k....',
  '...kfk...',
  '...kffk..',
  '..kffOfk.',
  '.kffOOfk.',
  '.kfOOOOfk',
  'kffOOOOfk',
  'kfOOxOOfk',
  '.kfOOOfk.',
  '..kkkkk..',
];
const SKULL = [
  '..kkkkk..',
  '.kxxxxxk.',
  'kxxxxxxxk',
  'kxkkxkkxk',
  'kxkkxkkxk',
  'kxxxkxxxk',
  '.kxxxxxk.',
  '..kxkxk..',
  '..kkkkk..',
];
function symbolBlock(symbol, light, base, dark) {
  const rows = [];
  for (let y = 0; y < TILE; y++) {
    let row;
    if (y === 0 || y === 15) row = 'k'.repeat(16);
    else if (y === 1) row = 'k' + 'v' + 'u'.repeat(12) + 'z' + 'k';
    else if (y === 14) row = 'k' + 'z'.repeat(14) + 'k';
    else row = 'k' + 'u'.repeat(13) + 'z' + 'k';
    rows.push(row.split(''));
  }
  const top = Math.floor((TILE - symbol.length) / 2);
  symbol.forEach((line, sy) => {
    for (let sx = 0; sx < line.length; sx++) {
      if (line[sx] !== '.') rows[sy + top][sx + 3] = line[sx];
    }
  });
  return makeSprite(rows.map((r) => r.join('')), { ...PALETTE, v: light, u: base, z: dark });
}
const RUNE_TILE = symbolBlock(FLAME_RUNE, '#8a7a70', '#3a3036', '#1a1214');
const SKULL_TILE = symbolBlock(SKULL, '#ffe08a', '#c89a3a', '#6a4a10');

// Brimstone: cracked sulphur-orange rock with glowing seams.
const BRIM_TILE = tileCanvas((g) => {
  g.fillStyle = '#000';
  g.fillRect(1, 0, 14, 16);
  g.fillRect(0, 1, 16, 14);
  g.fillStyle = '#6a2a0a';
  g.fillRect(1, 1, 14, 14);
  g.fillStyle = '#a8501a';
  g.fillRect(1, 1, 13, 12);
  g.fillStyle = '#e09040';
  g.fillRect(2, 2, 9, 2);
  g.fillRect(2, 2, 2, 7);
  g.fillStyle = '#ffb030';
  g.fillRect(9, 7, 4, 1);
  g.fillRect(8, 8, 1, 3);
  g.fillRect(5, 11, 3, 1);
});

const SPRITES = {
  heroStand: pair(HERO_STAND),
  heroWalk: pair(HERO_WALK),
  heroJump: pair(HERO_JUMP),
  flak: pair(FLAK),
  wingsUp: pair(WINGS_UP),
  wingsDown: pair(WINGS_DOWN),
  wingsFolded: pair(WINGS_FOLDED),
  bikeA: pair(BIKE_A),
  bikeB: pair(BIKE_B),
  houndA: pair(HOUND_A),
  houndB: pair(HOUND_B),
  elephantA: pair(ELEPHANT_A),
  elephantB: pair(ELEPHANT_B),
  shells: makeSprite(SHELLS),
  health: makeSprite(HEALTH),
  soulGem: makeSprite(SOUL_GEM),
};
