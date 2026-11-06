// Pixel drawing helpers, the bitmap font, the fighters' heads and all the small props.
// Everything is drawn with whole-pixel rectangles, so the picture stays crisp when the
// small canvas (416x234) is blown up to fill the screen.

const W = 416, H = 234, GROUND = 208, WORLD_W = 640;

function rect(c, x, y, w, h, col) {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function oval(c, cx, cy, rx, ry, col) {
  c.fillStyle = col;
  cx = Math.round(cx); cy = Math.round(cy);
  const n = Math.ceil(ry);
  for (let dy = -n; dy <= n; dy++) {
    const k = 1 - (dy * dy) / (ry * ry);
    if (k < 0) continue;
    const dx = Math.round(rx * Math.sqrt(k));
    c.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
  }
}
function disc(c, cx, cy, r, col) { oval(c, cx, cy, r, r, col); }

// A thick line that tapers from w1 to w2, built from squares.
function limb(c, x1, y1, x2, y2, w1, w2, col) {
  c.fillStyle = col;
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))));
  for (let i = 0; i <= n; i++) {
    const t = i / n, w = Math.round(w1 + (w2 - w1) * t);
    c.fillRect(Math.round(x1 + (x2 - x1) * t - w / 2), Math.round(y1 + (y2 - y1) * t - w / 2), w, w);
  }
}

function makeCanvas(w, h, fn) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  if (fn) fn(c, cv);
  return cv;
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Bitmap font: 5x7, one byte per column, lowest bit at the top ----
const FONT = (() => {
  const data = {
    ' ': '0000000000', '!': '00005F0000', '"': '0007000700', '#': '147F147F14', '$': '242A7F2A12',
    '%': '2313086462', '&': '3649562050', "'": '0008070300', '(': '001C224100', ')': '0041221C00',
    '*': '2A1C7F1C2A', '+': '08083E0808', ',': '0040301000', '-': '0808080808', '.': '0000606000',
    '/': '2010080402', '0': '3E5149453E', '1': '00427F4000', '2': '7249494946', '3': '2141494D33',
    '4': '1814127F10', '5': '2745454539', '6': '3C4A494931', '7': '4121110907', '8': '3649494936',
    '9': '464949291E', ':': '0000140000', ';': '0040340000', '<': '0008142241', '=': '1414141414',
    '>': '0041221408', '?': '0201590906', '@': '3E415D594E', 'A': '7C1211127C', 'B': '7F49494936',
    'C': '3E41414122', 'D': '7F4141413E', 'E': '7F49494941', 'F': '7F09090901', 'G': '3E41415173',
    'H': '7F0808087F', 'I': '00417F4100', 'J': '2040413F01', 'K': '7F08142241', 'L': '7F40404040',
    'M': '7F021C027F', 'N': '7F0408107F', 'O': '3E4141413E', 'P': '7F09090906', 'Q': '3E4151215E',
    'R': '7F09192946', 'S': '2649494932', 'T': '03017F0103', 'U': '3F4040403F', 'V': '1F2040201F',
    'W': '3F4038403F', 'X': '6314081463', 'Y': '0304780403', 'Z': '6159494D43',
    '§': '004A552900', '→': '08082A1C08', '←': '081C2A0808', '↑': '04027F0204', '↓': '10207F2010',
    '·': '0000180000', '×': '2214081422',
  };
  const out = {};
  for (const ch in data) {
    const hex = data[ch], cols = [];
    for (let i = 0; i < 10; i += 2) cols.push(parseInt(hex.substr(i, 2), 16));
    out[ch] = cols;
  }
  return out;
})();

function textWidth(str, scale = 1) { return str.length * 6 * scale - scale; }

function glyphs(c, str, x, y, s, col, rows) {
  for (let i = 0; i < str.length; i++) {
    const g = FONT[str[i]] || FONT['?'];
    const ox = x + i * 6 * s;
    for (let cx = 0; cx < 5; cx++) {
      const bits = g[cx];
      if (!bits) continue;
      for (let cy = 0; cy < 7; cy++) {
        if (bits & (1 << cy)) {
          c.fillStyle = rows ? rows[cy] : col;
          c.fillRect(ox + cx * s, y + cy * s, s, s);
        }
      }
    }
  }
}

// o: { scale, color, align: 'left'|'center'|'right', shadow, outline, rows: [7 colours] }
function text(c, str, x, y, o = {}) {
  str = String(str).toUpperCase();
  const s = o.scale || 1;
  x = Math.round(x); y = Math.round(y);
  if (o.align === 'center') x -= Math.floor(textWidth(str, s) / 2);
  else if (o.align === 'right') x -= textWidth(str, s);
  if (o.outline) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      glyphs(c, str, x + dx * Math.max(1, s >> 1), y + dy * Math.max(1, s >> 1), s, o.outline);
    }
  }
  if (o.shadow) glyphs(c, str, x + Math.max(1, s >> 1), y + Math.max(1, s >> 1), s, o.shadow);
  glyphs(c, str, x, y, s, o.color || '#fff', o.rows);
}

const ROWS_FIRE = ['#fff6b0', '#ffe14d', '#ffc21a', '#ff9a1a', '#ff6a1a', '#e03a12', '#a01a0a'];
const ROWS_CHROME = ['#ffffff', '#dfe8ff', '#a8bce8', '#5a6ea8', '#f4f0d8', '#c8a860', '#7a5a28'];
const ROWS_BLOOD = ['#ff8a7a', '#ff5a4a', '#e8281e', '#c8140e', '#a00c0a', '#7a0806', '#500404'];
const ROWS_GOLD = ['#fffbe0', '#fff0a0', '#ffe060', '#ffd030', '#f0b020', '#d08a10', '#9a6008'];

// ---- Heads: 16 x 18 pixel maps, facing right ----
// k outline, s skin, S skin shadow, h hair, H hair highlight, b beard, g glasses frame,
// w lens, e eye, E eye white, m mouth, r bandana, R bandana highlight, W white
const HEADS = {
  bill: [
    '....kkk.kkk.....',
    '..kkhHhkhHhkk...',
    '.khHhhhhhhhhHk..',
    '.khhhHhhHhhhhhk.',
    'khhHhhhhhhHhhhk.',
    'khhhhhhHhhhhhhhk',
    'khhhhsssshsssshk',
    'khhksssssssssshk',
    '.khsgggggsgggggk',
    '.kSsgwwegggwwegk',
    '.kSsgggggsgggggk',
    '.kSsssssssSssssk',
    '.kSbbssssssssbbk',
    '.kbbbbbbbbbbbbbk',
    '.kbbbbbmmmmbbbbk',
    '..kbbbbbbbbbbbk.',
    '...kbbbbbbbbbk..',
    '....kkkkkkkkk...',
  ],
  kiwi: [
    '.....kkkkkkk....',
    '...kkHhHhHhHkk..',
    '..khhhhHhhhhHhk.',
    '..khHhhhhHhhhhk.',
    '..khhhhhhhhhhhk.',
    '..khhkssshsssshk',
    '..khksssssssssk.',
    '..kSssssssssssk.',
    '..kSsgggggsggggk',
    '..kSsgwwegggwwek',
    '..kSsgggggsggggk',
    '..kSsssssSsssssk',
    '..kSsssssssssssk',
    '..kSssmmmmmmsssk',
    '..kSsssbbbbssk..',
    '...kSssbbbbsk...',
    '....kkssbbsk....',
    '......kkkkk.....',
  ],
  baldric: [
    '................',
    '....kkkkkkkk....',
    '..kkhHhHhHhHkk..',
    '.khhhHhhhHhhHhk.',
    '.khHhhhhHhhhhhk.',
    '.khhhhhhhhhhhhk.',
    '.khhksssshsssshk',
    '.khksssssssssssk',
    '.kSssEEesssEEesk',
    '.kSssEEesssEEesk',
    '.kSsssssssSssssk',
    '.kSsssssssSssssk',
    '.kSssssssssssssk',
    '.kSssmmmmmmmsssk',
    '.kSsssWWWWWssssk',
    '..kSsssssssssk..',
    '...kkSsssssk....',
    '.....kkkkkk.....',
  ],
  sf: [
    '................',
    '.....kkkkkkk....',
    '...kkhhhhhHhkk..',
    '..khhHhhhhhhhhk.',
    '.krrrrrrrrrrrrrk',
    'kRRrRRRRRRRRRRRk',
    '.krrrrrrrrrrrrrk',
    '..khksssssssssk.',
    '..kSsEEesssEEesk',
    '..kSsEEesssEEesk',
    '..kSssssssSsssk.',
    '..kSssssssSsssk.',
    '..kSsbsssssssbk.',
    '..kSbbmmmmmmbbk.',
    '..kSbbbbbbbbbbk.',
    '...kSbbbbbbbbk..',
    '....kkkbbbbkk...',
    '.......kkkk.....',
  ],
};

const headCache = {};
function getHead(def, mood) {
  const key = def.id + ':' + mood;
  if (headCache[key]) return headCache[key];
  const pal = {
    k: '#0a0a12', s: def.colors.skin, S: def.colors.skinShade, h: def.colors.hair, H: def.colors.hairHi,
    b: def.colors.beard, g: '#14141c', w: '#c8ecff', e: def.colors.eye, E: '#ffffff', m: '#6a1e22',
    r: def.colors.bandana || '#c02020', R: '#ff5a4a', W: '#ffffff',
  };
  if (mood === 'rage') { pal.h = '#ffd030'; pal.H = '#fff6a0'; pal.b = '#ffb820'; pal.e = '#ff2a1a'; }
  const map = HEADS[def.id];
  const cv = makeCanvas(16, 18, (c) => {
    map.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        let ch = row[x];
        if (ch === '.') continue;
        if (mood === 'hurt') {
          if (ch === 'e' || ch === 'E') ch = y % 2 ? 'k' : 's';
          if (ch === 'W') ch = 'm';
        }
        c.fillStyle = pal[ch] || '#f0f';
        c.fillRect(x, y, 1, 1);
      }
    });
    if (mood === 'hurt') rect(c, 7, 13, 5, 3, '#3a0a10');
  });
  headCache[key] = cv;
  return cv;
}

// ---- Props ----
const SPRITES = {};

// The IO Poster: a red folder with a poster on it. It's thrown spinning like a throwing star.
SPRITES.poster = makeCanvas(20, 20, (c) => {
  rect(c, 2, 1, 16, 18, '#0a0a12');
  rect(c, 3, 2, 14, 16, '#d0281e');
  rect(c, 3, 2, 5, 2, '#ff6a4a');
  rect(c, 5, 5, 10, 11, '#fff8e0');
  glyphs(c, 'IO', 5, 6, 1, '#101018');
  rect(c, 6, 14, 8, 1, '#d0281e');
  // the sharp corners that make it fly like a star
  rect(c, 0, 0, 3, 2, '#e8e8f0'); rect(c, 17, 0, 3, 2, '#e8e8f0');
  rect(c, 0, 18, 3, 2, '#e8e8f0'); rect(c, 17, 18, 3, 2, '#e8e8f0');
});

// A sheet of Czech legislation, complete with a paragraph sign and a red stamp.
SPRITES.paper = makeCanvas(12, 14, (c) => {
  rect(c, 0, 0, 12, 14, '#0a0a12');
  rect(c, 1, 1, 10, 12, '#fbfbf0');
  glyphs(c, '§', 0, 1, 1, '#101018');
  rect(c, 6, 3, 4, 1, '#667'); rect(c, 6, 5, 4, 1, '#667');
  rect(c, 2, 8, 8, 1, '#889');
  rect(c, 6, 10, 4, 2, '#d0281e');
  rect(c, 2, 10, 2, 1, '#28c');
});

SPRITES.bag = makeCanvas(12, 12, (c) => {
  rect(c, 3, 0, 6, 3, '#d8e4f0');
  rect(c, 1, 3, 10, 8, '#0a0a12');
  rect(c, 2, 3, 8, 7, '#ffffff');
  rect(c, 3, 8, 6, 2, '#d8d8e8');
  rect(c, 3, 2, 6, 1, '#e8282e');
});
SPRITES.whiskey = makeCanvas(9, 18, (c) => {
  rect(c, 3, 0, 3, 5, '#2a1408');
  rect(c, 1, 5, 7, 13, '#0a0a12');
  rect(c, 2, 6, 5, 11, '#c87a1a');
  rect(c, 2, 9, 5, 5, '#f4ecd0');
  rect(c, 3, 11, 3, 1, '#222');
});
SPRITES.steak = makeCanvas(16, 12, (c) => {
  oval(c, 7, 6, 7, 5, '#0a0a12');
  oval(c, 7, 6, 6, 4, '#8a2a18');
  oval(c, 8, 5, 3, 2, '#c85a3a');
  rect(c, 3, 5, 1, 2, '#f4e0c8');
});
SPRITES.beer = makeCanvas(10, 14, (c) => {
  rect(c, 0, 2, 8, 12, '#0a0a12');
  rect(c, 1, 3, 6, 10, '#e8a81a');
  rect(c, 1, 0, 6, 4, '#ffffff');
  rect(c, 8, 5, 2, 6, '#8a8a90');
});
SPRITES.kebab = makeCanvas(14, 14, (c) => {
  limb(c, 3, 12, 11, 2, 8, 8, '#0a0a12');
  limb(c, 3, 12, 11, 2, 6, 6, '#e8c888');
  rect(c, 7, 4, 3, 3, '#7a3a1a'); rect(c, 5, 7, 3, 2, '#3a9a2a'); rect(c, 8, 7, 2, 2, '#d0281e');
});

// A pointy heavy-metal guitar (neck to the right, 40 x 18).
SPRITES.guitar = makeCanvas(40, 18, (c) => {
  // body
  c.fillStyle = '#0a0a12';
  for (let i = 0; i < 14; i++) {
    c.fillRect(1 + i, 8 - Math.round(i * 0.6) - 1, 2, Math.round(i * 1.2) + 3);
  }
  const red = '#d0181e';
  for (let i = 0; i < 12; i++) {
    c.fillStyle = i % 5 === 4 ? '#ff5a4a' : red;
    c.fillRect(2 + i, 8 - Math.round(i * 0.55), 2, Math.round(i * 1.1) + 1);
  }
  // neck, frets and headstock
  rect(c, 13, 7, 21, 4, '#0a0a12');
  rect(c, 14, 8, 19, 2, '#caa070');
  for (let x = 16; x < 33; x += 3) rect(c, x, 8, 1, 2, '#6a4a2a');
  rect(c, 33, 5, 7, 8, '#0a0a12');
  rect(c, 34, 6, 5, 6, red);
  rect(c, 35, 4, 1, 2, '#e8e8f0'); rect(c, 37, 4, 1, 2, '#e8e8f0');
  rect(c, 35, 12, 1, 2, '#e8e8f0'); rect(c, 37, 12, 1, 2, '#e8e8f0');
  rect(c, 8, 7, 3, 4, '#101014');
});

SPRITES.amp = makeCanvas(38, 62, (c) => {
  for (let i = 0; i < 2; i++) {
    const y = i * 31;
    rect(c, 0, y, 38, 30, '#0a0a12');
    rect(c, 2, y + 2, 34, 26, '#22222a');
    rect(c, 3, y + 3, 32, 3, '#3a3a44');
    disc(c, 11, y + 17, 7, '#0a0a12'); disc(c, 11, y + 17, 3, '#3a3a44');
    disc(c, 27, y + 17, 7, '#0a0a12'); disc(c, 27, y + 17, 3, '#3a3a44');
    rect(c, 5, y + 4, 3, 1, '#ffd030');
  }
});

// Lenka: Czech, blonde, very large and very dead. Faces right.
SPRITES.lenka = makeCanvas(66, 78, (c) => {
  const body = '#dff4ff', shade = '#a8d4ee', line = '#3a6a90';
  // wispy tail
  for (let i = 0; i < 6; i++) {
    const x = 12 + i * 8;
    limb(c, x, 52, x + (i % 2 ? 3 : -3), 74 - (i % 3) * 3, 10, 2, line);
    limb(c, x, 52, x + (i % 2 ? 3 : -3), 72 - (i % 3) * 3, 8, 1, shade);
  }
  // huge round body with rolls
  oval(c, 33, 44, 32, 26, line);
  oval(c, 33, 44, 31, 25, body);
  oval(c, 33, 57, 26, 11, shade);
  oval(c, 33, 54, 25, 9, body);
  oval(c, 33, 44, 27, 3, shade);
  oval(c, 33, 42, 27, 3, body);
  // arms
  oval(c, 5, 38, 7, 11, line); oval(c, 5, 38, 6, 10, body);
  oval(c, 61, 38, 7, 11, line); oval(c, 61, 38, 6, 10, body);
  // Czech flag in her hand
  rect(c, 62, 8, 1, 26, '#6a5030');
  rect(c, 63, 8, 3, 3, '#ffffff');
  rect(c, 63, 11, 3, 3, '#d7141a');
  rect(c, 63, 8, 1, 6, '#11457e');
  // head
  oval(c, 34, 17, 16, 15, line);
  oval(c, 34, 17, 15, 14, body);
  // blonde hair and plaits
  oval(c, 34, 8, 15, 8, '#7a5a10');
  oval(c, 34, 8, 14, 7, '#ffd84a');
  rect(c, 20, 8, 28, 3, '#ffd84a');
  rect(c, 26, 3, 12, 2, '#fff0a0');
  limb(c, 19, 12, 12, 34, 7, 5, '#7a5a10'); limb(c, 19, 12, 12, 34, 5, 3, '#ffd84a');
  limb(c, 49, 12, 55, 34, 7, 5, '#7a5a10'); limb(c, 49, 12, 55, 34, 5, 3, '#ffd84a');
  rect(c, 10, 34, 5, 2, '#d7141a'); rect(c, 53, 34, 5, 2, '#d7141a');
  // face
  rect(c, 26, 15, 6, 5, '#ffffff'); rect(c, 37, 15, 6, 5, '#ffffff');
  rect(c, 29, 16, 3, 3, '#1a6ad0'); rect(c, 40, 16, 3, 3, '#1a6ad0');
  oval(c, 24, 23, 3, 2, '#ffa8b8'); oval(c, 45, 23, 3, 2, '#ffa8b8');
  rect(c, 30, 24, 10, 2, '#a01a2a'); rect(c, 31, 26, 8, 1, '#a01a2a');
  rect(c, 33, 21, 3, 1, shade);
});

// Draws a sprite at a centre point, optionally spinning, using nearest-pixel rotation.
function spr(c, img, x, y, rot, scale) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  if (rot) c.rotate(rot);
  if (scale) c.scale(scale, scale);
  c.drawImage(img, -(img.width >> 1), -(img.height >> 1));
  c.restore();
}

// A radiation sign, used all over Ostrava.
function trefoil(c, x, y, r) {
  disc(c, x, y, r, '#f0c818');
  c.fillStyle = '#14120a';
  for (let a = 0; a < 3; a++) {
    const m = -Math.PI / 2 + a * (Math.PI * 2) / 3;
    for (let t = -0.5; t <= 0.5; t += 0.08) {
      for (let q = r * 0.3; q < r * 0.9; q += 0.7) {
        c.fillRect(Math.round(x + Math.cos(m + t) * q), Math.round(y + Math.sin(m + t) * q), 1, 1);
      }
    }
  }
  rect(c, x - 1, y - 1, 2, 2, '#14120a');
}
