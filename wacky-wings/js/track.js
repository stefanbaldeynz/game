// The race track: its shape, the painted ground texture the karts drive on,
// and where the trees and sheep go.
//
// The world is a flat 2048x2048 map. The track is a smooth loop through the
// control points below (in race order). Everything is drawn once at load time.

const WORLD = 2048;
const ROAD_W = 150; // asphalt width
const SAND_W = 60; // sandy verge on each side of the road
const GRID_TILE = 64; // size of the mowed-grass checks

const TRACK = {
  name: 'Southern Alps Raceway',
  points: [
    [180, 760], [170, 480], [220, 230], [380, 140], [540, 200], [560, 360],
    [470, 480], [560, 600], [740, 560], [860, 450], [880, 700], [760, 860],
    [480, 880], [300, 880],
  ].map(([x, y]) => [x * 2, y * 2]),
};

// Small seeded random generator so the scenery is the same every race.
function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
}

// Turns the control points into evenly spaced centre-line points, each with
// its direction (tx, ty) and the direction to its right (nx, ny).
function buildCenterline(points, spacing) {
  const n = points.length;
  const dense = [];
  for (let i = 0; i < n; i++) {
    for (let s = 0; s < 24; s++) {
      dense.push(catmullRom(points[(i - 1 + n) % n], points[i], points[(i + 1) % n], points[(i + 2) % n], s / 24));
    }
  }
  const cum = [0];
  for (let i = 1; i <= dense.length; i++) {
    const a = dense[i - 1];
    const b = dense[i % dense.length];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = cum[dense.length];
  const count = Math.round(total / spacing);
  const out = [];
  let j = 0;
  for (let i = 0; i < count; i++) {
    const target = (i / count) * total;
    while (cum[j + 1] < target) j++;
    const a = dense[j];
    const b = dense[(j + 1) % dense.length];
    const f = (target - cum[j]) / (cum[j + 1] - cum[j] || 1);
    out.push({ x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f });
  }
  out.forEach((p, i) => {
    const a = out[(i - 1 + count) % count];
    const b = out[(i + 1) % count];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    p.tx = (b.x - a.x) / len;
    p.ty = (b.y - a.y) / len;
    p.nx = -p.ty;
    p.ny = p.tx;
  });
  return out;
}

// Finds the nearest centre-line point. With a hint, only nearby points are
// searched (fast, used every frame); without one, the whole loop is searched.
function nearestPoint(center, x, y, hint = -1, back = 15, ahead = 30) {
  const n = center.length;
  let best = 0;
  let bestD = Infinity;
  const from = hint < 0 ? 0 : hint - back;
  const to = hint < 0 ? n - 1 : hint + ahead;
  for (let i = from; i <= to; i++) {
    const idx = ((i % n) + n) % n;
    const p = center[idx];
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = idx;
    }
  }
  const p = center[best];
  return { idx: best, dist: Math.sqrt(bestD), side: (x - p.x) * p.nx + (y - p.y) * p.ny };
}

const rgb32 = (r, g, b) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
const GRASS_A = [62, 158, 46];
const GRASS_B = [72, 170, 52];
const OUTSIDE_A = rgb32(...GRASS_A);
const OUTSIDE_B = rgb32(...GRASS_B);

// Paints the ground: checked grass, sandy verges, red and white kerbs,
// asphalt with yellow edge dashes, and a chequered start line.
function buildTrackTexture(center) {
  const c = document.createElement('canvas');
  c.width = WORLD;
  c.height = WORLD;
  const g = c.getContext('2d');
  for (let y = 0; y < WORLD; y += GRID_TILE) {
    for (let x = 0; x < WORLD; x += GRID_TILE) {
      const col = ((x + y) / GRID_TILE) % 2 ? GRASS_B : GRASS_A;
      g.fillStyle = `rgb(${col})`;
      g.fillRect(x, y, GRID_TILE, GRID_TILE);
    }
  }

  const loop = () => {
    g.beginPath();
    center.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.closePath();
  };
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const stroke = (width, color, dash = []) => {
    g.setLineDash(dash);
    g.lineWidth = width;
    g.strokeStyle = color;
    loop();
    g.stroke();
  };
  stroke(ROAD_W + SAND_W * 2, '#dcbf7e');
  stroke(ROAD_W + 22, '#f4f4f4');
  stroke(ROAD_W + 22, '#d82020', [22, 22]);
  stroke(ROAD_W, '#6c6c76');
  stroke(ROAD_W - 16, '#ecc420', [34, 30]);
  stroke(ROAD_W - 22, '#6c6c76');
  g.setLineDash([]);

  // Chequered start/finish line across the road at point 0.
  const s = center[0];
  g.save();
  g.translate(s.x, s.y);
  g.rotate(Math.atan2(s.ty, s.tx));
  const sq = 12;
  for (let a = -ROAD_W / 2; a < ROAD_W / 2; a += sq) {
    for (let b = 0; b < 3; b++) {
      g.fillStyle = (Math.round(a / sq) + b) % 2 ? '#111' : '#fff';
      g.fillRect(b * sq - sq * 1.5, a, sq, sq);
    }
  }
  g.restore();

  // Speckle every pixel a little so the ground has some grit.
  const img = g.getImageData(0, 0, WORLD, WORLD);
  const d = img.data;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    let h = Math.imul(p ^ (p >>> 13), 0x5bd1e995);
    h ^= h >>> 15;
    const n = (h & 31) - 16;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  return new Uint32Array(d.buffer);
}

// Smaller, averaged copies of the texture, used for far-away ground so it
// doesn't sparkle.
function buildMips(base, levels) {
  const mips = [base];
  let size = WORLD;
  for (let l = 1; l < levels; l++) {
    const src = new Uint8Array(mips[l - 1].buffer);
    const half = size / 2;
    const out = new Uint8Array(half * half * 4);
    for (let y = 0; y < half; y++) {
      for (let x = 0; x < half; x++) {
        const o = (y * half + x) * 4;
        const a = (y * 2 * size + x * 2) * 4;
        const b = a + size * 4;
        for (let k = 0; k < 3; k++) out[o + k] = (src[a + k] + src[a + 4 + k] + src[b + k] + src[b + 4 + k]) >> 2;
        out[o + 3] = 255;
      }
    }
    mips.push(new Uint32Array(out.buffer));
    size = half;
  }
  return mips;
}

// Cabbage trees, pohutukawa and sheep, placed on the grass near the road.
function placeScenery(center) {
  const rnd = seeded(2024);
  const trees = [];
  const sheep = [];
  const edge = ROAD_W / 2 + SAND_W;
  let tries = 0;
  while ((trees.length < 80 || sheep.length < 26) && tries++ < 5000) {
    const x = 60 + rnd() * (WORLD - 120);
    const y = 60 + rnd() * (WORLD - 120);
    const d = nearestPoint(center, x, y).dist;
    if (d < edge + 30 || d > edge + 420) continue;
    const near = (list, r) => list.some((o) => Math.hypot(o.x - x, o.y - y) < r);
    if (near(trees, 50) || near(sheep, 40)) continue;
    if (trees.length < 80 && rnd() < 0.7) {
      const big = rnd() < 0.35;
      trees.push({ x, y, kind: big ? 'pohutukawa' : 'cabbage', r: big ? 22 : 8 });
    } else if (sheep.length < 26 && d > edge + 60) {
      sheep.push({ x, y, homeX: x, homeY: y, vx: 0, vy: 0, facing: 1, r: 10, t: rnd() * 200 });
    }
  }
  return { trees, sheep };
}

function buildMinimap(center, size) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const k = size / WORLD;
  g.lineJoin = 'round';
  const path = () => {
    g.beginPath();
    center.forEach((p, i) => (i ? g.lineTo(p.x * k, p.y * k) : g.moveTo(p.x * k, p.y * k)));
    g.closePath();
  };
  g.strokeStyle = '#0a3a0a';
  g.lineWidth = 9;
  path();
  g.stroke();
  g.strokeStyle = '#3ce03c';
  g.lineWidth = 5;
  path();
  g.stroke();
  const s = center[0];
  g.strokeStyle = '#fff';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo((s.x - s.nx * 60) * k, (s.y - s.ny * 60) * k);
  g.lineTo((s.x + s.nx * 60) * k, (s.y + s.ny * 60) * k);
  g.stroke();
  return c;
}
