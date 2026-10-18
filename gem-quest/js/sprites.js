// Pixel-art sprites and tiles, drawn once into small canvases at load time.
// Sprites are written as text: each letter is a colour from PALETTE and
// '.' is see-through. Every sprite faces right; flipped copies face left.

const TILE = 16;

const PALETTE = {
  k: '#000000',
  h: '#7a2c08', // hair
  s: '#f8b880', // skin
  r: '#e82020', // jumpsuit
  d: '#8a1010', // shoes
  y: '#f8d030', // gold
  Y: '#b88a00', // dark gold
  w: '#ffffff',
  g: '#30b030', // dragon green
  l: '#b0f070', // dragon belly
  o: '#f87818',
  p: '#e070f8', // magic pink
  P: '#8a28c0', // magic purple
  q: '#c050c0', // scorpion
  c: '#40d8ff', // gem light
  C: '#1870c8', // gem dark
  e: '#b0b0b8', // wheel hubs
};

function makeSprite(rows, palette = PALETTE) {
  const c = document.createElement('canvas');
  c.width = rows[0].length;
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

// ---------- The kid ----------
const KID_HEAD = [
  '...kkkkkk...',
  '..khhhhhhk..',
  '.khhhhhhhhk.',
  '.khhhssssshk',
  'kshhsssskssk',
  'ksshsssskssk',
  '.kssssssssk.',
  '..kssssrrk..',
  '...kkkkkk...',
];
const KID_BODY = [
  '..krrrrrrk..',
  '.ksrrrrrrsk.',
  '.ksryyyyrsk.',
  '..krrrrrrk..',
];
const KID_STAND = [...KID_HEAD, ...KID_BODY, '..krrkkrrk..', '..kddkkddk..', '............'];
const KID_WALK = [...KID_HEAD, ...KID_BODY, '.krrk..krrk.', 'kddk....kddk', '............'];
const KID_JUMP = [
  ...KID_HEAD,
  '.ksrrrrrrsk.',
  '..krrrrrrk..',
  '..kryyyyrk..',
  '..krrrrrrk..',
  '..kddkkddk..',
  '............',
  '............',
];
// Punching: same kid, arm stretched out in a 16-wide frame.
const KID_PUNCH = KID_STAND.map((row) => row + '....');
KID_PUNCH[9] = '..krrrrrrkkkk...';
KID_PUNCH[10] = '.ksrrrrrrrrrsssk';
KID_PUNCH[11] = '.ksryyyyrkkksssk';
KID_PUNCH[12] = '..krrrrrrk..kkk.';

// ---------- The motorbike ----------
const BIKE_A = [
  '...............kk...',
  '..............kyk...',
  '...kkkkkk....kyk....',
  '..krrrrrrkkkkrrk....',
  '.krrrrrrrrrrrrrrk...',
  '.kryyyyyyyyyyyyrrk..',
  '..kkkkkrrrrrrrkkkk..',
  '.kkkk..krrrrk..kkkk.',
  'kkeekk..kkkk..kkeekk',
  'keyyek........keyyek',
  'kkeekk........kkeekk',
  '.kkkk..........kkkk.',
];
// Second frame: the wheel spokes have turned.
const BIKE_B = BIKE_A.slice();
BIKE_B[8] = 'kekkek..kkkk..kekkek';
BIKE_B[9] = 'kkyykk........kkyykk';
BIKE_B[10] = 'kekkek........kekkek';

// ---------- Enemies ----------
const DRAGON_UP = [
  '......kk........',
  '.....kggk.......',
  '....kgggk.......',
  '...kggggk...kkk.',
  '..kgggggk..kgggk',
  'kkggggggggkgwkgk',
  'kgllllllgggggggk',
  '.kllllllggggrrrk',
  '..kgllllgggkkkk.',
  '...kgk..kgk.....',
  '...kk....kk.....',
  '................',
];
const DRAGON_DOWN = [
  '................',
  '................',
  '................',
  '............kkk.',
  '...kkkkkk..kgggk',
  'kkkggggggkkgwkgk',
  'kgllllllgggggggk',
  '.kllllllggggrrrk',
  '..kgggggggkkkk..',
  '...kgggggk......',
  '....kgggk.......',
  '.....kkk........',
];
const SCORPION_A = [
  '....kk..........',
  '...kqqk.........',
  '...kqk..........',
  '..kqk...........',
  '..kqkkkkkkkk....',
  '..kkqqqqqqqqkk..',
  '..kqqqqqqqqqwqk.',
  '.kkqqqqqqqqqqqkk',
  '..k.kk.kk.kk.kqk',
  '..............k.',
];
const SCORPION_B = SCORPION_A.slice();
SCORPION_B[8] = '...kk.kk.kk.k.kk';
SCORPION_B[9] = '................';

// ---------- Items ----------
const BAG = [
  '..kk..kk..',
  '...kyyk...',
  '....kk....',
  '..kyyyyk..',
  '.kyyyyyyk.',
  'kyyyYYyyyk',
  'kyyYyyyyyk',
  'kyyyYYyyyk',
  'kyyyyyYyyk',
  '.kyyYYyyk.',
  '..kkkkkk..',
];
const HEART = [
  '.kk...kk.',
  'krrk.krrk',
  'krwrkrrrk',
  'krrrrrrrk',
  '.krrrrrk.',
  '..krrrk..',
  '...krk...',
  '....k....',
];
const ORB = [
  '...kkkk...',
  '..kppppk..',
  '.kpwwpppk.',
  'kpwwppPppk',
  'kpwppPPppk',
  'kppppPPppk',
  'kpppPPPppk',
  '.kpPPPPpk.',
  '..kppppk..',
  '...kkkk...',
];
const GEM = [
  '...kkkkkkkk...',
  '..kwwcCCcwwk..',
  '.kwwcCCCCcwwk.',
  'kkkkkkkkkkkkkk',
  'kcCCwccccCCCck',
  '.kcCwcccCCCck.',
  '..kcwccCCCck..',
  '...kcwcCCck...',
  '....kcwCck....',
  '.....kcck.....',
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

const ROCK_LAYOUTS = [
  [[1, 1, 8, 7], [10, 1, 5, 6], [1, 9, 6, 6], [8, 8, 7, 7]],
  [[1, 1, 6, 6], [8, 1, 7, 8], [1, 8, 8, 7], [10, 10, 5, 5]],
];
const ROCK_TILES = ROCK_LAYOUTS.map((lumps) =>
  tileCanvas((g) => {
    g.fillStyle = '#4a1c04';
    g.fillRect(0, 0, TILE, TILE);
    for (const [x, y, w, h] of lumps) rockLump(g, x, y, w, h, '#b85818', '#e89048', '#7a3008');
  }),
);

// Grass that sits on the top of any rock with sky above it.
const GRASS = tileCanvas((g) => {
  g.fillStyle = '#106810';
  g.fillRect(0, 0, TILE, 6);
  g.fillStyle = '#30b830';
  g.fillRect(0, 0, TILE, 4);
  g.fillStyle = '#90f060';
  g.fillRect(0, 0, TILE, 1);
  // Little tufts hanging down.
  g.fillStyle = '#106810';
  for (const x of [1, 4, 6, 10, 13]) g.fillRect(x, 6, 1, 2);
  g.fillStyle = '#30b830';
  for (const x of [2, 8, 12]) g.fillRect(x, 4, 2, 2);
});

// Star-style blocks: yellow for prizes, purple for magic.
const STAR = [
  '....k....',
  '...kwk...',
  '...kwk...',
  'kkkkwkkkk',
  'kwwwwwwwk',
  '.kwwwwwk.',
  '..kwwwk..',
  '.kwwkwwk.',
  '.kwk.kwk.',
  '.kk...kk.',
];
function starBlock(light, base, dark) {
  const rows = [];
  for (let y = 0; y < TILE; y++) {
    let row;
    if (y === 0 || y === 15) row = 'k'.repeat(16);
    else if (y === 1) row = 'k' + 'w' + 'a'.repeat(12) + 'b' + 'k';
    else if (y === 14) row = 'k' + 'b'.repeat(14) + 'k';
    else row = 'k' + 'a'.repeat(13) + 'b' + 'k';
    rows.push(row.split(''));
  }
  STAR.forEach((line, sy) => {
    for (let sx = 0; sx < line.length; sx++) {
      if (line[sx] !== '.') rows[sy + 3][sx + 3] = line[sx];
    }
  });
  return makeSprite(rows.map((r) => r.join('')), { k: '#000', w: light, a: base, b: dark });
}
const STAR_TILE = starBlock('#fff8c0', '#f8c818', '#b07800');
const MAGIC_TILE = starBlock('#ffe0ff', '#c050f0', '#6a1890');

const BREAK_TILE = tileCanvas((g) => {
  g.fillStyle = '#000';
  g.fillRect(1, 0, 14, 16);
  g.fillRect(0, 1, 16, 14);
  g.fillStyle = '#d07830';
  g.fillRect(1, 1, 14, 14);
  g.fillStyle = '#f8b868';
  g.fillRect(1, 1, 13, 12);
  g.fillStyle = '#fff0c0';
  g.fillRect(2, 2, 9, 2);
  g.fillRect(2, 2, 2, 7);
  g.fillStyle = '#d07830';
  g.fillRect(9, 7, 4, 1);
  g.fillRect(8, 8, 1, 3);
});

const SPRITES = {
  kidStand: pair(KID_STAND),
  kidWalk: pair(KID_WALK),
  kidJump: pair(KID_JUMP),
  kidPunch: pair(KID_PUNCH),
  bikeA: pair(BIKE_A),
  bikeB: pair(BIKE_B),
  dragonUp: pair(DRAGON_UP),
  dragonDown: pair(DRAGON_DOWN),
  scorpA: pair(SCORPION_A),
  scorpB: pair(SCORPION_B),
  bag: makeSprite(BAG),
  heart: makeSprite(HEART),
  orb: makeSprite(ORB),
  gem: makeSprite(GEM),
};
