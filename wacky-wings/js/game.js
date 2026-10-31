// Wacky Wings: a kart race for New Zealand birds. Pick a driver, grab possum
// tokens, throw possums at the other racers and win three laps for a Speight's.
//
// The ground is drawn "Mode 7" style like the old 16-bit racers: every row of
// the screen below the horizon is a slice of the flat track map, further away
// the higher up it is. Karts, trees and possums are flat pictures scaled by
// distance. The scene is drawn at 320x200 and scaled up 3x.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 320;
const H = 200;
const SCALE = canvas.width / W;
const low = document.createElement('canvas');
low.width = W;
low.height = H;
const lctx = low.getContext('2d');
const groundImg = lctx.createImageData(W, H);
const gbuf = new Uint32Array(groundImg.data.buffer);

const HORIZON = 62;
const FOCAL = 190;
const CAM_H = 30;
const CAM_DIST = 72;
const FAR = 1900;
const LAPS = 3;
const KART_R = 10;
const KART_WORLD = 32; // world width covered by a kart picture
const MAX_AMMO = 9;
const FONT = "'Luckiest Guy', Impact, sans-serif";

// ---------- Track ----------
const center = buildCenterline(TRACK.points, 12);
const N = center.length;
const MIPS = buildMips(buildTrackTexture(center), 4);
const { trees, sheep } = placeScenery(center);
const MINIMAP_SIZE = 150;
const minimap = buildMinimap(center, MINIMAP_SIZE);

// Possum tokens: rows of three across the road at four spots.
const pickups = [];
for (const f of [0.1, 0.36, 0.6, 0.84]) {
  const p = center[Math.floor(f * N)];
  for (const side of [-42, 0, 42]) pickups.push({ x: p.x + p.nx * side, y: p.y + p.ny * side, active: true, wait: 0 });
}

// ---------- Input ----------
const TOUCH = window.TouchControls && TouchControls.isTouch;
const keys = {};
const pressed = {};
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  Sound.init();
  if (!e.repeat) pressed[k] = true;
  keys[k] = true;
  if (k === 'm') Sound.toggleMute();
  if (k === 'p' && (state.mode === 'race' || state.mode === 'countdown')) state.paused = !state.paused;
  if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault();
});
addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

// ---------- Helpers ----------
function rand(a, b) {
  return a + Math.random() * (b - a);
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
function ordinal(n) {
  return n + (['th', 'st', 'nd', 'rd'][n] || 'th');
}
function formatTime(frames) {
  const t = frames / 60;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const cs = Math.floor((t * 100) % 100);
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

// ---------- State ----------
const state = {
  mode: 'select', // select | countdown | race | finish | podium
  paused: false,
  selected: 0,
  frame: 0,
  t: 0, // race time in frames
  modeT: 0,
  msg: '',
  msgT: 0,
  results: [],
};
let karts = [];
let possums = [];
let finishOrder = [];
let confetti = [];
const cam = { x: 0, y: 0, h: 0 };

function makeKart(bird, gridSlot, isPlayer) {
  const row = Math.floor(gridSlot / 2);
  const idx = (N - 4 - row * 4 + N) % N;
  const p = center[idx];
  const side = gridSlot % 2 ? 32 : -32;
  return {
    bird,
    isPlayer,
    x: p.x + p.nx * side,
    y: p.y + p.ny * side,
    heading: Math.atan2(p.ty, p.tx),
    vx: 0,
    vy: 0,
    fwd: 0,
    spin: 0,
    spinT: 0,
    spinTotal: 1,
    ammo: 1,
    idx,
    lap: 0,
    finished: false,
    finishTime: 0,
    place: gridSlot + 1,
    fireCd: 60,
    bumpCd: 0,
    skill: 1,
    aiMul: 1,
    aiOff: side,
    aiOffTarget: side,
    stuckT: 0,
    reverseT: 0,
    wrongT: 0,
  };
}

// Line up all eight birds. The player starts near the back of the grid.
function setupRace(playerBird) {
  const others = BIRDS.filter((b) => b !== playerBird).sort(() => Math.random() - 0.5);
  karts = [];
  const playerSlot = playerBird ? 5 : -1;
  let o = 0;
  for (let slot = 0; slot < 8; slot++) {
    if (slot === playerSlot) karts.push(makeKart(playerBird, slot, true));
    else {
      const k = makeKart(others[o++] || BIRDS[slot], slot, false);
      k.skill = 0.97 - slot * 0.012 + rand(-0.01, 0.01);
      karts.push(k);
    }
  }
  possums = [];
  finishOrder = [];
  pickups.forEach((p) => {
    p.active = true;
    p.wait = 0;
  });
  state.t = 0;
  const lead = player() || karts[0];
  cam.h = lead.heading;
  placeCamera(lead, 1);
}

function player() {
  return karts.find((k) => k.isPlayer);
}

function setMode(mode) {
  state.mode = mode;
  state.modeT = 0;
}

function startSelect() {
  setMode('select');
  setupRace(null); // the birds race on their own behind the menu
  Sound.engine(null);
}

function startRace() {
  setupRace(BIRDS[state.selected]);
  setMode('countdown');
  Sound.startMusic();
}

function message(text, frames = 90) {
  state.msg = text;
  state.msgT = frames;
}

// ---------- Kart physics ----------
function progress(k) {
  return k.lap * N + k.idx;
}

function surfaceOf(k) {
  const q = nearestPoint(center, k.x, k.y, k.idx);
  const prev = k.idx;
  k.idx = q.idx;
  // Crossing the start line moves you onto the next lap (or back a lap if
  // you reverse over it).
  if (prev > N * 0.8 && k.idx < N * 0.2) onLap(k, 1);
  else if (prev < N * 0.2 && k.idx > N * 0.8) onLap(k, -1);
  const off = Math.abs(q.side);
  if (off < ROAD_W / 2) return 0;
  if (off < ROAD_W / 2 + SAND_W) return 1;
  return 2;
}

function onLap(k, dir) {
  k.lap += dir;
  if (dir < 0 || k.finished) return;
  if (k.lap > LAPS) {
    k.finished = true;
    k.finishTime = state.t;
    finishOrder.push(k);
    if (k.isPlayer) {
      Sound.finish();
      setMode('finish');
    }
  } else if (k.isPlayer && k.lap > 1) {
    Sound.lap();
    message(k.lap === LAPS ? 'FINAL LAP!' : `LAP ${k.lap}`);
  }
}

function updateKart(k, inp) {
  const st = k.bird.stats;
  const maxSpeed = 3.0 + st.speed * 0.22;
  const accel = 0.03 + st.accel * 0.011;
  const turn = 0.026 + st.handling * 0.0055;
  const surf = surfaceOf(k);
  const surfMul = [1, 0.72, 0.5][surf];

  let fx = Math.cos(k.heading);
  let fy = Math.sin(k.heading);
  let fwd = k.vx * fx + k.vy * fy;
  let lat = -k.vx * fy + k.vy * fx;

  if (k.spinT > 0) {
    // Spinning out after a possum hit: no control for a moment.
    k.spinT--;
    k.spin = (1 - k.spinT / k.spinTotal) * Math.PI * 4;
    fwd *= 0.95;
  } else {
    k.spin = 0;
    if (inp.steer) {
      const grip = Math.min(1, Math.abs(fwd) / 1.2) * (fwd < 0 ? -1 : 1);
      k.heading += inp.steer * turn * grip;
    }
    if (inp.gas) fwd += accel;
    else if (inp.brake) fwd -= accel * 1.6;
    else fwd *= 0.985;
    if (inp.fire) fire(k);
  }
  const max = maxSpeed * surfMul * k.aiMul;
  if (fwd > max) fwd += (max - fwd) * 0.08;
  fwd = Math.max(fwd, -1.6);
  lat *= surf === 0 ? 0.8 : 0.88;

  fx = Math.cos(k.heading);
  fy = Math.sin(k.heading);
  k.vx = fx * fwd - fy * lat;
  k.vy = fy * fwd + fx * lat;
  k.fwd = fwd;
  k.x += k.vx;
  k.y += k.vy;

  // Bounce off the edge of the world.
  if (k.x < 20 || k.x > WORLD - 20) {
    k.x = clamp(k.x, 20, WORLD - 20);
    k.vx *= -0.5;
  }
  if (k.y < 20 || k.y > WORLD - 20) {
    k.y = clamp(k.y, 20, WORLD - 20);
    k.vy *= -0.5;
  }
  if (k.fireCd > 0) k.fireCd--;
  if (k.bumpCd > 0) k.bumpCd--;

  // Driving the wrong way round?
  const t = center[k.idx];
  k.wrongT = fx * t.tx + fy * t.ty < -0.3 && Math.abs(fwd) > 0.5 ? k.wrongT + 1 : 0;
}

function bumpSound(k) {
  if (k.isPlayer && k.bumpCd <= 0) {
    Sound.bump();
    k.bumpCd = 20;
  }
}

function collide() {
  // Karts push each other apart and trade some speed.
  for (let i = 0; i < karts.length; i++) {
    for (let j = i + 1; j < karts.length; j++) {
      const a = karts[i];
      const b = karts[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      if (d >= KART_R * 2 || d === 0) continue;
      const nx = dx / d;
      const ny = dy / d;
      const push = (KART_R * 2 - d) / 2;
      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;
      const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (rel > 0) {
        a.vx -= nx * rel * 0.9;
        a.vy -= ny * rel * 0.9;
        b.vx += nx * rel * 0.9;
        b.vy += ny * rel * 0.9;
        bumpSound(a);
        bumpSound(b);
      }
    }
  }
  // Trees are solid; sheep get barged out of the way.
  for (const k of karts) {
    for (const tr of trees) {
      const dx = k.x - tr.x;
      const dy = k.y - tr.y;
      const min = tr.r + KART_R;
      if (Math.abs(dx) > min || Math.abs(dy) > min) continue;
      const d = Math.hypot(dx, dy);
      if (d < min && d > 0) {
        k.x = tr.x + (dx / d) * min;
        k.y = tr.y + (dy / d) * min;
        k.vx *= 0.3;
        k.vy *= 0.3;
        bumpSound(k);
      }
    }
    for (const sh of sheep) {
      const dx = sh.x - k.x;
      const dy = sh.y - k.y;
      const d = Math.hypot(dx, dy);
      if (d < sh.r + KART_R && d > 0) {
        sh.vx = (dx / d) * 2.5;
        sh.vy = (dy / d) * 2.5;
        k.vx *= 0.7;
        k.vy *= 0.7;
        if (k.isPlayer && sh.t > 30) Sound.baa();
        sh.t = 0;
      }
    }
  }
}

// ---------- Possums ----------
function fire(k) {
  if (k.ammo <= 0 || k.fireCd > 0) return;
  k.ammo--;
  k.fireCd = 25;
  const fx = Math.cos(k.heading);
  const fy = Math.sin(k.heading);
  const speed = Math.max(k.fwd, 0) + 4.5;
  possums.push({ x: k.x + fx * 16, y: k.y + fy * 16, vx: fx * speed, vy: fy * speed, owner: k, t: 0, flying: true, sitT: 0, z: 0 });
  if (nearPlayer(k)) Sound.throw();
}

function nearPlayer(o) {
  const p = player();
  return p && Math.hypot(o.x - p.x, o.y - p.y) < 400;
}

function knockOut(k, frames, by) {
  if (k.spinT > 0) return;
  k.spinT = frames;
  k.spinTotal = frames;
  k.vx *= 0.35;
  k.vy *= 0.35;
  if (nearPlayer(k)) Sound.hit();
  if (by && by.isPlayer && !k.isPlayer) message(`GOT THE ${k.bird.name.toUpperCase()}!`);
  else if (k.isPlayer) message(by ? `${by.bird.name.toUpperCase()} GOT YOU!` : 'POSSUM!');
}

function updatePossums() {
  for (const p of possums) {
    p.t++;
    if (p.flying) {
      p.x += p.vx;
      p.y += p.vy;
      p.z = Math.abs(Math.sin(p.t * 0.22)) * 9;
      const hitTree = trees.some((tr) => Math.hypot(p.x - tr.x, p.y - tr.y) < tr.r + 4);
      if (p.t > 80 || hitTree || p.x < 0 || p.y < 0 || p.x > WORLD || p.y > WORLD) {
        // Missed: the possum sits on the road, dazed, waiting to trip someone up.
        p.flying = false;
        p.sitT = 420;
        p.z = 0;
      }
    } else {
      p.sitT--;
      if (p.sitT <= 0) p.dead = true;
    }
    for (const k of karts) {
      if (p.dead || (p.flying && k === p.owner) || (!p.flying && p.t < 100 && k === p.owner)) continue;
      if (Math.hypot(k.x - p.x, k.y - p.y) < KART_R + 6) {
        knockOut(k, p.flying ? 70 : 50, p.flying ? p.owner : null);
        p.dead = true;
      }
    }
  }
  possums = possums.filter((p) => !p.dead);

  for (const pk of pickups) {
    if (!pk.active) {
      if (--pk.wait <= 0) pk.active = true;
      continue;
    }
    for (const k of karts) {
      if (Math.hypot(k.x - pk.x, k.y - pk.y) < 18 && k.ammo < MAX_AMMO) {
        k.ammo = Math.min(MAX_AMMO, k.ammo + 2);
        pk.active = false;
        pk.wait = 360;
        if (k.isPlayer) {
          Sound.pickup();
          message('+2 POSSUMS', 50);
        }
        break;
      }
    }
  }
}

function updateSheep() {
  for (const sh of sheep) {
    sh.t++;
    if (Math.random() < 0.01) {
      const a = rand(0, Math.PI * 2);
      sh.vx = Math.cos(a) * 0.25;
      sh.vy = Math.sin(a) * 0.25;
    }
    // Stay near home.
    if (Math.hypot(sh.x - sh.homeX, sh.y - sh.homeY) > 50) {
      sh.vx = (sh.homeX - sh.x) * 0.01;
      sh.vy = (sh.homeY - sh.y) * 0.01;
    }
    sh.x += sh.vx;
    sh.y += sh.vy;
    sh.vx *= 0.97;
    sh.vy *= 0.97;
    if (Math.abs(sh.vx) > 0.05) sh.facing = sh.vx > 0 ? 1 : -1;
  }
}

// ---------- Drivers ----------
function playerInput() {
  return {
    gas: keys.arrowup || keys.w,
    brake: keys.arrowdown || keys.s,
    steer: (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0),
    fire: pressed[' '] || pressed.x || pressed.control,
  };
}

function aiInput(k) {
  // Wander across the road a little so the pack spreads out.
  if (Math.random() < 0.006) k.aiOffTarget = rand(-ROAD_W * 0.3, ROAD_W * 0.3);
  k.aiOff += (k.aiOffTarget - k.aiOff) * 0.02;
  const look = 6 + Math.floor(Math.max(0, k.fwd) * 2.5);
  const p = center[(k.idx + look) % N];
  const tx = p.x + p.nx * k.aiOff;
  const ty = p.y + p.ny * k.aiOff;
  const diff = wrapAngle(Math.atan2(ty - k.y, tx - k.x) - k.heading);

  // Rubber band: birds well ahead of you ease off, ones behind push harder.
  const you = player();
  const gap = you ? (progress(you) - progress(k)) / N : 0;
  k.aiMul = k.skill * (1 + clamp(gap * 0.3, -0.1, 0.12));

  // Back out if stuck against something.
  if (k.reverseT > 0) {
    k.reverseT--;
    return { gas: false, brake: true, steer: -Math.sign(diff), fire: false };
  }
  k.stuckT = Math.abs(k.fwd) < 0.3 && k.spinT === 0 ? k.stuckT + 1 : 0;
  if (k.stuckT > 50) {
    k.stuckT = 0;
    k.reverseT = 40;
  }

  // Throw a possum at anyone lined up ahead.
  let fire = false;
  if (k.ammo > 0 && k.fireCd === 0) {
    const fx = Math.cos(k.heading);
    const fy = Math.sin(k.heading);
    for (const o of karts) {
      if (o === k) continue;
      const dx = o.x - k.x;
      const dy = o.y - k.y;
      const along = dx * fx + dy * fy;
      const side = Math.abs(-dx * fy + dy * fx);
      if (along > 20 && along < 240 && side < 10 + along * 0.04 && Math.random() < 0.06) fire = true;
    }
  }
  return { gas: Math.abs(diff) < 0.9, brake: Math.abs(diff) > 1.4, steer: clamp(diff * 3, -1, 1), fire };
}

function standings() {
  const rest = karts.filter((k) => !k.finished).sort((a, b) => progress(b) - progress(a));
  return [...finishOrder, ...rest];
}

// ---------- Camera ----------
function placeCamera(k, ease) {
  cam.h += wrapAngle(k.heading - cam.h) * ease;
  cam.x = k.x - Math.cos(cam.h) * CAM_DIST;
  cam.y = k.y - Math.sin(cam.h) * CAM_DIST;
}

// ---------- Main update ----------
function update() {
  state.frame++;
  if (state.msgT > 0) state.msgT--;
  updateConfetti();

  if (state.mode === 'select') {
    if (pressed.arrowleft || pressed.a) state.selected = (state.selected + BIRDS.length - 1) % BIRDS.length;
    if (pressed.arrowright || pressed.d) state.selected = (state.selected + 1) % BIRDS.length;
    if (pressed.enter || pressed[' ']) {
      startRace();
      return;
    }
    simulate();
    const lead = standings()[0];
    placeCamera(lead, 0.08);
    return;
  }
  if (state.mode === 'podium') {
    if (pressed.enter && state.modeT > 30) startSelect();
    state.modeT++;
    return;
  }
  if (state.paused) return;
  state.modeT++;

  if (state.mode === 'countdown') {
    if (state.modeT % 60 === 1 && state.modeT < 180) Sound.beep();
    if (state.modeT >= 180) {
      Sound.go();
      setMode('race');
      message('GO!', 60);
    }
    Sound.engine(0);
    placeCamera(player(), 1);
    return;
  }

  state.t++;
  simulate();
  const you = player();
  placeCamera(you, you.spinT > 0 ? 0.03 : 0.12);
  Sound.engine(clamp(Math.abs(you.fwd) / 4, 0, 1));
  if (state.mode === 'race' && you.wrongT > 45 && state.frame % 60 === 0) message('WRONG WAY!', 50);

  if (state.mode === 'finish' && state.modeT > 240) {
    state.results = standings();
    setMode('podium');
    Sound.engine(null);
    Sound.stopMusic();
    for (let i = 0; i < 160; i++) {
      confetti.push({ x: rand(0, canvas.width), y: rand(-600, 0), vy: rand(1.5, 3.5), vx: rand(-0.6, 0.6), color: ['#f8d030', '#e03030', '#30a0f0', '#40d060', '#fff'][i % 5], r: rand(0, 6) });
    }
  }
}

function simulate() {
  for (const k of karts) {
    const human = k.isPlayer && state.mode === 'race';
    updateKart(k, human ? playerInput() : aiInput(k));
  }
  collide();
  updatePossums();
  updateSheep();
  const order = standings();
  order.forEach((k, i) => (k.place = i + 1));
}

function updateConfetti() {
  for (const c of confetti) {
    c.x += c.vx + Math.sin((state.frame + c.r * 50) * 0.05) * 0.8;
    c.y += c.vy;
    c.r += 0.1;
  }
  confetti = confetti.filter((c) => c.y < canvas.height + 20);
}

// ---------- Drawing the 3D scene ----------
function drawSky() {
  const grad = lctx.createLinearGradient(0, 0, 0, HORIZON);
  grad.addColorStop(0, '#2c6ae0');
  grad.addColorStop(1, '#a8d4f8');
  lctx.fillStyle = grad;
  lctx.fillRect(0, 0, W, HORIZON + 1);
  // Mountains scroll sideways as you turn.
  const off = ((((cam.h / (Math.PI * 2)) * BACKDROP_W) % BACKDROP_W) + BACKDROP_W) % BACKDROP_W;
  const y = HORIZON + 1 - BACKDROP_H;
  lctx.drawImage(BACKDROP, -off, y);
  lctx.drawImage(BACKDROP, -off + BACKDROP_W, y);
}

function drawGround() {
  const fx = Math.cos(cam.h);
  const fy = Math.sin(cam.h);
  const rx = -fy;
  const ry = fx;
  for (let y = HORIZON + 1; y < H; y++) {
    const z = (CAM_H * FOCAL) / (y - HORIZON);
    const per = z / FOCAL; // world units per screen pixel on this row
    let wx = cam.x + fx * z - rx * per * (W / 2);
    let wy = cam.y + fy * z - ry * per * (W / 2);
    const dx = rx * per;
    const dy = ry * per;
    const lvl = per < 1.3 ? 0 : per < 2.6 ? 1 : per < 5.2 ? 2 : 3;
    const tex = MIPS[lvl];
    const size = WORLD >> lvl;
    const inv = 1 / (1 << lvl);
    let o = y * W;
    for (let x = 0; x < W; x++, o++) {
      if (wx >= 0 && wy >= 0 && wx < WORLD && wy < WORLD) {
        gbuf[o] = tex[((wy * inv) | 0) * size + ((wx * inv) | 0)];
      } else {
        gbuf[o] = (Math.floor(wx / GRID_TILE) + Math.floor(wy / GRID_TILE)) & 1 ? OUTSIDE_B : OUTSIDE_A;
      }
      wx += dx;
      wy += dy;
    }
  }
  lctx.putImageData(groundImg, 0, 0, 0, HORIZON + 1, W, H - HORIZON - 1);
  // Soft haze where the ground meets the sky.
  const haze = lctx.createLinearGradient(0, HORIZON, 0, HORIZON + 14);
  haze.addColorStop(0, 'rgba(168,212,248,0.9)');
  haze.addColorStop(1, 'rgba(168,212,248,0)');
  lctx.fillStyle = haze;
  lctx.fillRect(0, HORIZON + 1, W, 14);
}

// Where a point on the ground shows up on screen.
function project(x, y) {
  const dx = x - cam.x;
  const dy = y - cam.y;
  const fx = Math.cos(cam.h);
  const fy = Math.sin(cam.h);
  const z = dx * fx + dy * fy;
  if (z < 36 || z > FAR) return null; // too close: it's behind your own kart
  const side = -dx * fy + dy * fx;
  const s = FOCAL / z;
  return { sx: W / 2 + side * s, gy: HORIZON + CAM_H * s, s, z };
}

function drawSprites() {
  const list = [];
  const add = (x, y, worldW, img, anchorY = 1, lift = 0, flipImg = null) => {
    const p = project(x, y);
    if (!p) return;
    const w = worldW * p.s;
    const h = (w * img.height) / img.width;
    if (p.sx + w / 2 < 0 || p.sx - w / 2 > W) return;
    list.push({ z: p.z, draw: () => lctx.drawImage(flipImg || img, p.sx - w / 2, p.gy - h * anchorY - lift * p.s, w, h) });
  };

  for (const tr of trees) {
    if (tr.kind === 'cabbage') add(tr.x, tr.y, 46, CABBAGE_TREE);
    else add(tr.x, tr.y, 110, POHUTUKAWA);
  }
  for (const sh of sheep) add(sh.x, sh.y, 26, SHEEP.r, 1, 0, sh.facing > 0 ? SHEEP.r : SHEEP.l);
  for (const pk of pickups) {
    if (pk.active) add(pk.x, pk.y, 18, POSSUM_TOKEN, 1, 4 + Math.sin(state.frame * 0.1 + pk.x) * 2);
  }
  for (const p of possums) add(p.x, p.y, 18, POSSUM, 1, p.z);
  for (const k of karts) {
    const look = Math.atan2(k.y - cam.y, k.x - cam.x);
    const rel = wrapAngle(k.heading + k.spin - look);
    const frame = (Math.round(rel / ((Math.PI * 2) / KART_FRAMES)) + KART_FRAMES) % KART_FRAMES;
    add(k.x, k.y, KART_WORLD, KART_SPRITES[k.bird.id][frame], KART_ORIGIN[1] / KART_CANVAS);
  }
  list.sort((a, b) => b.z - a.z).forEach((s) => s.draw());
}

// ---------- Drawing the HUD and screens (full size) ----------
function text(str, x, y, size, color = '#fff', align = 'left') {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(4, size / 6);
  ctx.strokeStyle = '#000';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function box(x, y, w, h) {
  ctx.fillStyle = '#1a2a8a';
  ctx.fillRect(x, y, w, h);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#f8d030';
  ctx.strokeRect(x, y, w, h);
}

function drawHud() {
  const you = player();
  // Race position, Wacky Wheels style.
  box(16, 14, 92, 92);
  text(String(you.place), 62, 18, 80, '#f8d030', 'center');
  text(ordinal(you.place).slice(-2), 98, 74, 22, '#fff', 'right');

  box(124, 14, 150, 44);
  text(`LAP ${clamp(you.lap, 1, LAPS)}/${LAPS}`, 199, 22, 28, '#fff', 'center');

  box(290, 14, 140, 44);
  ctx.drawImage(POSSUM, 296, 14, 52, 44);
  text(`x ${you.ammo}`, 356, 22, 28, '#fff');

  text(formatTime(state.t), canvas.width - 20, 18, 30, '#fff', 'right');

  // Minimap with every racer on it.
  const mx = canvas.width - MINIMAP_SIZE - 16;
  const my = canvas.height - MINIMAP_SIZE - 16;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(mx - 6, my - 6, MINIMAP_SIZE + 12, MINIMAP_SIZE + 12);
  ctx.drawImage(minimap, mx, my);
  const k = MINIMAP_SIZE / WORLD;
  for (const kt of karts) {
    ctx.fillStyle = kt.bird.kart;
    ctx.strokeStyle = kt.isPlayer ? '#fff' : '#000';
    ctx.lineWidth = kt.isPlayer ? 3 : 1.5;
    ctx.beginPath();
    ctx.arc(mx + kt.x * k, my + kt.y * k, kt.isPlayer ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  if (state.msgT > 0 && Math.floor(state.msgT / 6) % 4 !== 0) {
    text(state.msg, canvas.width / 2, 150, 48, state.msg === 'WRONG WAY!' ? '#ff4040' : '#f8d030', 'center');
  }
}

function drawLights() {
  // The start lights: red, red, red... green!
  const x = canvas.width / 2 - 90;
  const y = 120;
  ctx.fillStyle = '#111';
  ctx.fillRect(x, y, 180, 64);
  ctx.strokeStyle = '#f8d030';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, 180, 64);
  const lit = Math.floor(state.modeT / 60);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = lit > i ? '#ff2020' : '#401010';
    ctx.beginPath();
    ctx.arc(x + 32 + i * 58, y + 32, 22, 0, Math.PI * 2);
    ctx.fill();
  }
  text(String(3 - Math.min(2, lit)), canvas.width / 2, 200, 90, '#fff', 'center');
}

function drawSelect() {
  ctx.fillStyle = 'rgba(10, 20, 60, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  text('WACKY WINGS', canvas.width / 2, 22, 78, '#f8d030', 'center');
  text('Pick your driver', canvas.width / 2, 108, 26, '#fff', 'center');

  const bird = BIRDS[state.selected];
  // Big spinning preview.
  const frame = Math.floor(state.frame / 6) % KART_FRAMES;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(KART_SPRITES[bird.id][frame], 90, 120, 288, 288);

  text(bird.name.toUpperCase(), 420, 160, 56, bird.kart);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText(bird.blurb, 422, 226);
  const stats = [['SPEED', bird.stats.speed], ['ACCEL', bird.stats.accel], ['HANDLING', bird.stats.handling]];
  stats.forEach(([label, v], i) => {
    const y = 268 + i * 40;
    text(label, 422, y, 22);
    for (let p = 0; p < 5; p++) {
      ctx.fillStyle = p < v ? '#f8d030' : 'rgba(255,255,255,0.15)';
      ctx.fillRect(570 + p * 36, y + 2, 30, 22);
    }
  });

  // All the birds in a row.
  const cell = 104;
  const startX = (canvas.width - cell * BIRDS.length) / 2;
  BIRDS.forEach((b, i) => {
    const x = startX + i * cell;
    const y = 420;
    ctx.fillStyle = i === state.selected ? 'rgba(248,208,48,0.35)' : 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 4, y, cell - 8, 120);
    if (i === state.selected) {
      ctx.strokeStyle = '#f8d030';
      ctx.lineWidth = 4;
      ctx.strokeRect(x + 4, y, cell - 8, 120);
    }
    ctx.drawImage(KART_SPRITES[b.id][8], x + 4, y - 6, 96, 96);
    text(b.name, x + cell / 2, y + 90, 20, '#fff', 'center');
  });

  const blink = Math.floor(state.frame / 30) % 2 === 0;
  text('<  >  choose     ENTER  race!', canvas.width / 2, 552, 26, blink ? '#fff' : '#f8d030', 'center');
}

function drawPodium() {
  const grad = ctx.createLinearGradient(0, 0, 0, 330);
  grad.addColorStop(0, '#2c6ae0');
  grad.addColorStop(1, '#a8d4f8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(BACKDROP, 300, 0, 320, BACKDROP_H, 0, 330 - BACKDROP_H * 3, canvas.width, BACKDROP_H * 3);
  ctx.fillStyle = '#48a834';
  ctx.fillRect(0, 330, canvas.width, canvas.height - 330);

  const res = state.results;
  const winner = res[0];
  const you = res.find((k) => k.isPlayer);
  const won = winner.isPlayer;
  text(won ? "YOU WIN A SPEIGHT'S!" : `${winner.bird.name.toUpperCase()} WINS THE SPEIGHT'S!`, canvas.width / 2, 18, 50, '#f8d030', 'center');
  text(won ? 'Good as gold, mate!' : `You came ${ordinal(you.place)}. Better luck next time, mate.`, canvas.width / 2, 78, 24, '#fff', 'center');

  // Podium: 2nd, 1st, 3rd.
  const cx = 330;
  const steps = [
    { k: res[1], x: cx - 170, h: 90, label: '2' },
    { k: res[0], x: cx, h: 140, label: '1' },
    { k: res[2], x: cx + 170, h: 60, label: '3' },
  ];
  for (const s of steps) {
    const top = 520 - s.h;
    ctx.fillStyle = '#e8e8f0';
    ctx.fillRect(s.x - 75, top, 150, s.h + 80);
    ctx.fillStyle = '#b8b8c8';
    ctx.fillRect(s.x - 75, top, 150, 10);
    text(s.label, s.x, top + 20, 50, '#1a2a8a', 'center');
    const bounce = s.label === '1' ? Math.abs(Math.sin(state.frame * 0.08)) * 12 : 0;
    const groundY = (192 * KART_ORIGIN[1]) / KART_CANVAS;
    ctx.drawImage(KART_SPRITES[s.k.bird.id][8], s.x - 96, top - groundY + 8 - bounce, 192, 192);
  }
  // The winner's prize, held high.
  const tilt = Math.sin(state.frame * 0.06) * 0.08;
  ctx.save();
  ctx.translate(cx + 92, 300 - Math.abs(Math.sin(state.frame * 0.08)) * 12);
  ctx.rotate(0.25 + tilt);
  drawSpeights(ctx, 0, 0, 0.8);
  ctx.restore();

  // Final results.
  const lx = 600;
  box(lx, 130, 340, 360);
  text('RESULTS', lx + 170, 142, 30, '#f8d030', 'center');
  res.forEach((k, i) => {
    const y = 186 + i * 36;
    const col = k.isPlayer ? '#f8d030' : '#fff';
    text(`${i + 1}. ${k.bird.name}`, lx + 18, y, 24, col);
    text(k.finished ? formatTime(k.finishTime) : '--', lx + 322, y, 24, col, 'right');
  });

  for (const c of confetti) {
    ctx.fillStyle = c.color;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.r);
    ctx.fillRect(-4, -2, 8, 4);
    ctx.restore();
  }
  if (Math.floor(state.frame / 30) % 2 === 0) text(TOUCH ? 'TAP TO CONTINUE' : 'PRESS ENTER', lx + 170, 520, 30, '#fff', 'center');
}

function draw() {
  if (state.mode === 'podium') {
    drawPodium();
    return;
  }
  drawSky();
  drawGround();
  drawSprites();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(low, 0, 0, canvas.width, canvas.height);

  if (state.mode === 'select') {
    drawSelect();
    return;
  }
  drawHud();
  if (state.mode === 'countdown') drawLights();
  if (state.mode === 'finish') {
    const you = player();
    text('FINISHED!', canvas.width / 2, 200, 80, '#f8d030', 'center');
    text(`${ordinal(you.place)} place`, canvas.width / 2, 290, 44, '#fff', 'center');
  }
  if (state.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    text('PAUSED', canvas.width / 2, 240, 70, '#fff', 'center');
    text(TOUCH ? 'Tap to carry on' : 'Press P to carry on', canvas.width / 2, 320, 26, '#fff', 'center');
  }
}

// ---------- Loop ----------
// Fixed 60 updates a second, whatever the screen's refresh rate.
const STEP = 1000 / 60;
let last = performance.now();
let acc = 0;

function loop(now) {
  acc += Math.min(now - last, 250);
  last = now;
  while (acc >= STEP) {
    update();
    for (const k in pressed) delete pressed[k];
    acc -= STEP;
  }
  draw();
  requestAnimationFrame(loop);
}

startSelect();
requestAnimationFrame(loop);
