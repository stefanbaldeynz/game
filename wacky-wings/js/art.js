// All the pictures: the bird drivers in their karts (seen from 16 angles),
// possums, trees, sheep, the mountains on the horizon and the Speight's.
// Everything is drawn once at load time into small canvases.

const BIRDS = [
  {
    id: 'kiwi', name: 'Kiwi', blurb: "Can't fly, but can drive. A good all-rounder.",
    stats: { speed: 3, accel: 3, handling: 3 },
    kart: '#e03030', body: '#7a5636', head: '#7a5636', beak: '#e8d8a0', beakLen: 1.05, beakW: 0.12, size: 1.15,
  },
  {
    id: 'kea', name: 'Kea', blurb: 'Cheeky mountain parrot. Will nick your wipers.',
    stats: { speed: 3, accel: 2, handling: 4 },
    kart: '#f08a10', body: '#6b7a2a', head: '#7a8a30', beak: '#3a3a3a', beakLen: 0.38, beakW: 0.22, hook: true,
    wings: '#f06a20',
  },
  {
    id: 'tui', name: 'Tui', blurb: 'Sings the whole way round. Quick on the straights.',
    stats: { speed: 4, accel: 3, handling: 2 },
    kart: '#9040d0', body: '#1d3b3f', head: '#24474c', beak: '#111111', beakLen: 0.38, beakW: 0.1, tuft: true,
  },
  {
    id: 'pukeko', name: 'Pukeko', blurb: 'Swamp hen with a bright red shield. Fast starter.',
    stats: { speed: 2, accel: 4, handling: 3 },
    kart: '#f0d020', body: '#2b3ca8', head: '#1e2a80', beak: '#d81818', beakLen: 0.45, beakW: 0.24, shield: true,
    tail: '#ffffff',
  },
  {
    id: 'kakapo', name: 'Kakapo', blurb: "World's heaviest parrot. Huge top speed, slow to get going.",
    stats: { speed: 5, accel: 1, handling: 3 },
    kart: '#f060a0', body: '#6c9e3a', head: '#b0bc58', beak: '#e8e0c0', beakLen: 0.3, beakW: 0.22, size: 1.2,
  },
  {
    id: 'takahe', name: 'Takahe', blurb: 'Back from extinction and ready to race.',
    stats: { speed: 4, accel: 2, handling: 3 },
    kart: '#e8e8e8', body: '#2a6e8e', head: '#244e8e', beak: '#e02020', beakLen: 0.5, beakW: 0.32, shield: true, size: 1.1,
  },
  {
    id: 'weka', name: 'Weka', blurb: 'Sneaky thief. Rockets off the line.',
    stats: { speed: 2, accel: 5, handling: 2 },
    kart: '#20b0a0', body: '#8a5a2a', head: '#7a4a22', beak: '#c89070', beakLen: 0.55, beakW: 0.14,
  },
  {
    id: 'fantail', name: 'Fantail', blurb: 'Tiny and flitty. Corners like a dream.',
    stats: { speed: 2, accel: 3, handling: 5 },
    kart: '#90d020', body: '#6a5a48', head: '#3a3028', beak: '#111111', beakLen: 0.2, beakW: 0.1, brow: true,
    fan: true, size: 0.85,
  },
];

// ---------- Colour helpers ----------
function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(hex, f) {
  const [r, g, b] = hexRgb(hex);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}

// ---------- A tiny 3D renderer for the karts ----------
// Model space: x to the right, y forward, z up. The camera looks at the
// kart from behind and a little above; yaw turns the kart.
const KART_CANVAS = 96;
const KART_ORIGIN = [48, 69]; // where the kart's ground centre lands in the canvas
const KART_SCALE = 19;
const PITCH = 0.42;
const LIGHT = (() => {
  const v = [-0.5, 0.75, -0.45];
  const l = Math.hypot(...v);
  return v.map((x) => x / l);
})();

function kartModel(bird) {
  const s = bird.size || 1;
  const boxes = [
    { c: [0, 0, 0.45], s: [1.5, 2.4, 0.35], color: bird.kart },
    { c: [0, 1.25, 0.4], s: [1.1, 0.4, 0.28], color: bird.kart },
    { c: [0, -0.75, 0.95], s: [1.05, 0.25, 0.75], color: '#333333' },
    { c: [0, -1.25, 0.35], s: [1.65, 0.16, 0.22], color: '#dddddd' },
  ];
  for (const x of [-0.95, 0.95]) {
    for (const y of [-0.8, 0.8]) boxes.push({ c: [x, y, 0.35], s: [0.45, 0.72, 0.7], color: '#1a1a1a' });
  }
  const headZ = 1.55 + 0.45 * s;
  const spheres = [
    { c: [0, -0.25, 1.15], r: 0.6 * s, color: bird.body },
    { c: [0, 0.05, headZ], r: 0.46, color: bird.head },
    { c: [-0.22, 0.42, headZ + 0.1], r: 0.12, color: '#ffffff' },
    { c: [0.22, 0.42, headZ + 0.1], r: 0.12, color: '#ffffff' },
    { c: [-0.24, 0.51, headZ + 0.1], r: 0.065, color: '#000000' },
    { c: [0.24, 0.51, headZ + 0.1], r: 0.065, color: '#000000' },
  ];
  const bl = bird.beakLen;
  const bw = bird.beakW;
  boxes.push({ c: [0, 0.42 + bl / 2, headZ - 0.08 - (bl > 0.8 ? 0.15 : 0)], s: [bw, bl, bw * 0.8], color: bird.beak });
  if (bird.hook) boxes.push({ c: [0, 0.42 + bl, headZ - 0.22], s: [bw * 0.8, 0.14, 0.24], color: bird.beak });
  if (bird.shield) boxes.push({ c: [0, 0.36, headZ + 0.22], s: [0.22, 0.24, 0.3], color: bird.beak });
  if (bird.wings) {
    spheres.push({ c: [-0.6 * s, -0.3, 1.15], r: 0.26, color: bird.wings });
    spheres.push({ c: [0.6 * s, -0.3, 1.15], r: 0.26, color: bird.wings });
  }
  if (bird.tuft) {
    spheres.push({ c: [-0.09, 0.4, headZ - 0.42], r: 0.12, color: '#ffffff' });
    spheres.push({ c: [0.09, 0.4, headZ - 0.42], r: 0.12, color: '#ffffff' });
  }
  if (bird.tail) spheres.push({ c: [0, -0.85, 0.95], r: 0.22, color: bird.tail });
  if (bird.brow) {
    spheres.push({ c: [-0.24, 0.36, headZ + 0.26], r: 0.08, color: '#ffffff' });
    spheres.push({ c: [0.24, 0.36, headZ + 0.26], r: 0.08, color: '#ffffff' });
  }
  if (bird.fan) boxes.push({ c: [0, -1.0, 1.6], s: [1.1, 0.06, 0.9], color: '#efe8d8' });
  return { boxes, spheres };
}

function renderKart(bird, yaw) {
  const c = document.createElement('canvas');
  c.width = KART_CANVAS;
  c.height = KART_CANVAS;
  const g = c.getContext('2d');
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const ca = Math.cos(PITCH);
  const sa = Math.sin(PITCH);
  const [ox, oy] = KART_ORIGIN;
  const k = KART_SCALE;
  const cam = ([x, y, z]) => {
    const rx = x * cy - y * sy;
    const ry = x * sy + y * cy;
    return [rx, z * ca + ry * sa, ry * ca - z * sa]; // screen x, screen up, depth
  };
  const scr = (v) => [ox + v[0] * k, oy - v[1] * k];

  // Shadow on the ground.
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath();
  g.ellipse(ox, oy, k * 1.45, k * 1.45 * sa + 3, 0, 0, Math.PI * 2);
  g.fill();

  const model = kartModel(bird);
  const draws = [];
  for (const b of model.boxes) {
    const [cx, cyy, cz] = b.c;
    const [w, l, h] = b.s.map((v) => v / 2);
    const v = (dx, dy, dz) => cam([cx + dx * w, cyy + dy * l, cz + dz * h]);
    const faces = [
      [[1, 0, 0], [v(1, -1, -1), v(1, 1, -1), v(1, 1, 1), v(1, -1, 1)]],
      [[-1, 0, 0], [v(-1, -1, -1), v(-1, -1, 1), v(-1, 1, 1), v(-1, 1, -1)]],
      [[0, 1, 0], [v(-1, 1, -1), v(-1, 1, 1), v(1, 1, 1), v(1, 1, -1)]],
      [[0, -1, 0], [v(-1, -1, -1), v(1, -1, -1), v(1, -1, 1), v(-1, -1, 1)]],
      [[0, 0, 1], [v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1)]],
      [[0, 0, -1], [v(-1, -1, -1), v(-1, 1, -1), v(1, 1, -1), v(1, -1, -1)]],
    ];
    for (const [n, pts] of faces) {
      const cn = cam(n);
      if (cn[2] >= -0.01) continue; // facing away from the camera
      const light = 0.5 + 0.5 * Math.max(0, cn[0] * LIGHT[0] + cn[1] * LIGHT[1] + cn[2] * LIGHT[2]);
      const depth = pts.reduce((s, p) => s + p[2], 0) / 4;
      draws.push({ depth, draw: () => {
        g.fillStyle = shade(b.color, light);
        g.beginPath();
        pts.forEach((p, i) => {
          const [x, y] = scr(p);
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        });
        g.closePath();
        g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.55)';
        g.lineWidth = 1;
        g.stroke();
      } });
    }
  }
  for (const s of model.spheres) {
    const p = cam(s.c);
    draws.push({ depth: p[2], draw: () => {
      const [x, y] = scr(p);
      const r = s.r * k;
      const grad = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      grad.addColorStop(0, shade(s.color, 1.35));
      grad.addColorStop(1, shade(s.color, 0.8));
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      if (r > 3) {
        g.strokeStyle = 'rgba(0,0,0,0.5)';
        g.lineWidth = 1;
        g.stroke();
      }
    } });
  }
  draws.sort((a, b) => b.depth - a.depth).forEach((d) => d.draw());
  return c;
}

// 16 views per bird. Frame 0 shows the kart from behind, frame 4 shows its
// right side turned towards you... frame 8 shows the front.
const KART_FRAMES = 16;
const KART_SPRITES = {};
for (const bird of BIRDS) {
  KART_SPRITES[bird.id] = Array.from({ length: KART_FRAMES }, (_, i) => renderKart(bird, (-i * Math.PI * 2) / KART_FRAMES));
}

// ---------- Possums ----------
function drawPossum(g, x, y, s) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.lineCap = 'round';
  // Bushy tail.
  g.strokeStyle = '#2e2622';
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(-8, 4);
  g.quadraticCurveTo(-24, 2, -20, -14);
  g.stroke();
  // Body.
  g.fillStyle = '#7e7c84';
  g.beginPath();
  g.ellipse(0, 4, 14, 11, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#c8c4c0';
  g.beginPath();
  g.ellipse(3, 8, 8, 6, 0, 0, Math.PI * 2);
  g.fill();
  // Head, ears and face.
  g.fillStyle = '#8e8c94';
  for (const ex of [-6, 6]) {
    g.beginPath();
    g.arc(ex + 4, -14, 4.5, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#e8a0a8';
  for (const ex of [-6, 6]) {
    g.beginPath();
    g.arc(ex + 4, -14, 2.2, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#9a98a0';
  g.beginPath();
  g.arc(4, -7, 9, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#d8d4d0';
  g.beginPath();
  g.ellipse(4, -4, 5, 4, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#000';
  for (const ex of [-0.5, 8.5]) {
    g.beginPath();
    g.arc(ex, -9, 3, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#fff';
  for (const ex of [0.5, 9.5]) g.fillRect(ex - 0.5, -11, 1.5, 1.5);
  g.fillStyle = '#e06878';
  g.beginPath();
  g.arc(4, -4.5, 1.8, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function canvasOf(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'));
  return c;
}

const POSSUM = canvasOf(56, 48, (g) => drawPossum(g, 30, 30, 1));
// A golden token you drive over to collect possums.
const POSSUM_TOKEN = canvasOf(48, 48, (g) => {
  g.fillStyle = '#7a5200';
  g.beginPath();
  g.arc(24, 24, 22, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#f8c820';
  g.beginPath();
  g.arc(24, 24, 19, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff4a0';
  g.beginPath();
  g.arc(18, 17, 6, 0, Math.PI * 2);
  g.fill();
  drawPossum(g, 25, 30, 0.75);
});

// ---------- Scenery ----------
const CABBAGE_TREE = canvasOf(70, 130, (g) => {
  g.strokeStyle = '#6a5a4a';
  g.lineCap = 'round';
  g.lineWidth = 6;
  const tops = [[22, 30], [48, 22], [36, 46]];
  for (const [x, y] of tops) {
    g.beginPath();
    g.moveTo(35, 128);
    g.quadraticCurveTo(35, 80, x, y);
    g.stroke();
  }
  for (const [x, y] of tops) {
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const len = 14 + (i % 3) * 3;
      g.strokeStyle = i % 2 ? '#4a8a2a' : '#6aaa3a';
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len * 0.8 + (Math.sin(a) > 0 ? 4 : 0));
      g.stroke();
    }
  }
});

const POHUTUKAWA = canvasOf(140, 110, (g) => {
  g.fillStyle = '#5a3a22';
  g.fillRect(62, 60, 16, 50);
  g.fillRect(50, 70, 40, 8);
  const rnd = seeded(7);
  const blobs = [[70, 40, 34], [40, 52, 26], [100, 52, 26], [55, 28, 22], [88, 28, 22], [70, 58, 26]];
  for (const [x, y, r] of blobs) {
    g.fillStyle = '#1e5a26';
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  for (const [x, y, r] of blobs) {
    g.fillStyle = '#2e7a32';
    g.beginPath();
    g.arc(x - r * 0.25, y - r * 0.3, r * 0.6, 0, Math.PI * 2);
    g.fill();
  }
  // Bright red Christmas flowers.
  for (let i = 0; i < 70; i++) {
    const [x, y, r] = blobs[Math.floor(rnd() * blobs.length)];
    const a = rnd() * Math.PI * 2;
    const d = rnd() * r * 0.9;
    g.fillStyle = rnd() < 0.5 ? '#e01828' : '#ff4048';
    g.fillRect(x + Math.cos(a) * d - 2, y + Math.sin(a) * d - 2, 4, 4);
  }
});

function makeSheep(flip) {
  return canvasOf(48, 36, (g) => {
    if (flip) {
      g.translate(48, 0);
      g.scale(-1, 1);
    }
    g.fillStyle = '#222';
    for (const x of [12, 18, 28, 34]) g.fillRect(x, 24, 3, 11);
    g.fillStyle = '#f4f2ea';
    for (const [x, y, r] of [[14, 18, 8], [22, 13, 9], [30, 16, 9], [20, 22, 8], [30, 22, 8], [10, 22, 6]]) {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#d8d4c8';
    g.beginPath();
    g.ellipse(22, 25, 13, 4, 0, 0, Math.PI);
    g.fill();
    g.fillStyle = '#222';
    g.beginPath();
    g.ellipse(41, 15, 6, 7, 0.3, 0, Math.PI * 2);
    g.fill();
    g.fillRect(34, 9, 6, 3);
    g.fillStyle = '#fff';
    g.fillRect(42, 12, 2, 2);
  });
}
const SHEEP = { r: makeSheep(false), l: makeSheep(true) };

// ---------- The mountains on the horizon ----------
// The picture wraps all the way round, so it can scroll as you turn.
const BACKDROP_W = 1500;
const BACKDROP_H = 64;
const BACKDROP = canvasOf(BACKDROP_W, BACKDROP_H, (g) => {
  const wave = (x, parts) => parts.reduce((s, [k, a, p]) => s + a * Math.sin((x / BACKDROP_W) * Math.PI * 2 * k + p), 0);
  // The Southern Alps: grey-blue peaks with snow on top.
  for (let x = 0; x < BACKDROP_W; x++) {
    const h = 30 + wave(x, [[3, 8, 0.4], [7, 6, 1.3], [13, 5, 2.1], [29, 3, 0.7], [53, 1.5, 0.2]]);
    const top = BACKDROP_H - h;
    g.fillStyle = '#6f7fa8';
    g.fillRect(x, top, 1, h);
    const snow = Math.max(0, h - 32 + wave(x, [[71, 1.5, 0]]));
    g.fillStyle = '#f4f8ff';
    g.fillRect(x, top, 1, snow);
  }
  // Rolling green foothills in front.
  for (let x = 0; x < BACKDROP_W; x++) {
    const h = 12 + wave(x, [[5, 4, 2.2], [11, 3, 0.1], [23, 2, 1.7]]);
    g.fillStyle = '#3f7e34';
    g.fillRect(x, BACKDROP_H - h, 1, h);
    g.fillStyle = '#4f9440';
    g.fillRect(x, BACKDROP_H - h, 1, 2);
  }
});

// ---------- The prize ----------
// A cartoon bottle of Speight's, bottom-centre at (x, y), about 220*s tall.
function drawSpeights(g, x, y, s) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  const body = new Path2D();
  body.moveTo(-34, 0);
  body.lineTo(-34, -120);
  body.quadraticCurveTo(-34, -150, -12, -165);
  body.lineTo(-11, -205);
  body.lineTo(11, -205);
  body.lineTo(12, -165);
  body.quadraticCurveTo(34, -150, 34, -120);
  body.lineTo(34, 0);
  body.closePath();
  const grad = g.createLinearGradient(-34, 0, 34, 0);
  grad.addColorStop(0, '#3a1804');
  grad.addColorStop(0.3, '#7a3a0c');
  grad.addColorStop(0.45, '#b8701e');
  grad.addColorStop(0.6, '#6a300a');
  grad.addColorStop(1, '#2a1002');
  g.fillStyle = grad;
  g.fill(body);
  g.lineWidth = 3;
  g.strokeStyle = '#1a0800';
  g.stroke(body);
  // Gold cap and neck foil.
  g.fillStyle = '#e8b830';
  g.fillRect(-13, -214, 26, 11);
  g.fillStyle = '#d8a020';
  g.fillRect(-12, -190, 24, 20);
  // Main label.
  g.fillStyle = '#f2e6c4';
  g.fillRect(-34, -110, 68, 74);
  g.strokeStyle = '#a01818';
  g.lineWidth = 3;
  g.strokeRect(-30, -106, 60, 66);
  g.fillStyle = '#a01818';
  g.textAlign = 'center';
  g.font = 'bold 15px Georgia, serif';
  g.fillText("SPEIGHT'S", 0, -84);
  g.fillStyle = '#222';
  g.font = 'bold 8px Georgia, serif';
  g.fillText('GOLD MEDAL ALE', 0, -70);
  g.font = 'italic 8px Georgia, serif';
  g.fillText('Pride of', 0, -56);
  g.fillText('the South', 0, -46);
  // Shine.
  g.fillStyle = 'rgba(255,255,255,0.25)';
  g.fillRect(-24, -150, 5, 40);
  g.fillRect(-24, -30, 5, 24);
  g.restore();
}
