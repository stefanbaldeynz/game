// Gem Quest: a retro platformer. Climb down the gorge, punch blocks,
// dodge the fire-breathing dragons and grab the Gem at the bottom.
//
// The world is drawn at 256x192 (an old console's screen size) into a small
// canvas, then scaled up 3x with crisp pixels. Text is drawn on top at full size.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const VIEW_W = 256;
const VIEW_H = 192;
const SCALE = canvas.width / VIEW_W;
const view = document.createElement('canvas');
view.width = VIEW_W;
view.height = VIEW_H;
const vctx = view.getContext('2d');

const GRAVITY = 0.3;
const MAX_FALL = 4.5;
const JUMP_SPEED = 5.4;
const RUN_SPEED = 1.7;
const BIKE_SLOW = 1.1;
const BIKE_CRUISE = 1.9;
const BIKE_FAST = 2.7;
const INVULN_FRAMES = 120;
const START_LIVES = 3;
const DRAGON_W = 14;
const DRAGON_H = 10;
const HIGH_SCORE_KEY = 'gemQuestHighScore';
const FONT = "'Press Start 2P', monospace";

// ---------- Input ----------
const TOUCH = window.TouchControls && TouchControls.isTouch;
const keys = {};
const pressed = {};
const JUMP_KEYS = [' ', 'arrowup', 'w', 'x', 'k'];
const PUNCH_KEYS = ['z', 'j', 'f'];

addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  Sound.init();
  if (!e.repeat) pressed[k] = true;
  keys[k] = true;
  if (state.mode === 'title' && (k === 'arrowleft' || k === 'arrowright')) chooseLevel(k === 'arrowright' ? 1 : -1);
  if (k === 'enter') {
    if (state.mode === 'title') startGame();
    else if (state.mode === 'clear' && hasNextLevel()) nextLevel();
    else if (state.mode !== 'playing') backToTitle();
  }
  if (k === 'p' && state.mode === 'playing') state.paused = !state.paused;
  if (k === 'm') Sound.toggleMute();
  if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault();
});
addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

const held = (list) => list.some((k) => keys[k]);
const tapped = (list) => list.some((k) => pressed[k]);

// ---------- Helpers ----------
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function loadHighScore() {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(value) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(value));
  } catch {
    // Storage can be blocked (e.g. private windows); the game still works.
  }
}

// ---------- Game state ----------
const state = {
  mode: 'title', // title | playing | clear | gameover
  paused: false,
  levelIndex: 0,
  score: 0,
  lives: START_LIVES,
  time: 0,
  frame: 0,
  bonus: 0,
  highScore: loadHighScore(),
};

let grid = [];
let rows = 0;
let player = null;
let enemies = [];
let fireballs = [];
let bolts = [];
let items = [];
let particles = [];
let popups = [];
let gem = null;
let cols = 16;
let level = LEVELS[0];
const cam = { x: 0, y: 0 };

const clouds = Array.from({ length: 9 }, (_, i) => ({
  x: rand(-20, VIEW_W),
  y: i * 70 + rand(0, 40),
  size: rand(0.7, 1.3),
  speed: rand(0.05, 0.15),
}));

// ---------- Tiles ----------
const SOLID = new Set(['#', 'B', 'S', 'M']);
const BREAKABLE = new Set(['B', 'S', 'M']);

function tileAt(c, r) {
  if (c < 0 || c >= cols) return '#';
  if (r < 0 || r >= rows) return '.'; // open sky above, a drop below
  return grid[r][c];
}

function solidAtPixel(x, y) {
  return SOLID.has(tileAt(Math.floor(x / TILE), Math.floor(y / TILE)));
}

function boxHitsSolid(b) {
  const c0 = Math.floor(b.x / TILE);
  const c1 = Math.floor((b.x + b.w - 0.01) / TILE);
  const r0 = Math.floor(b.y / TILE);
  const r1 = Math.floor((b.y + b.h - 0.01) / TILE);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (SOLID.has(tileAt(c, r))) return true;
    }
  }
  return false;
}

// Moves a box by its velocity, one axis at a time, stopping at solid tiles.
function moveBox(b) {
  const hit = { x: false, ground: false, ceiling: false };
  b.x += b.vx;
  if (boxHitsSolid(b)) {
    if (b.vx > 0) b.x = Math.floor((b.x + b.w) / TILE) * TILE - b.w;
    else b.x = Math.floor(b.x / TILE) * TILE + TILE;
    b.vx = 0;
    hit.x = true;
  }
  b.y += b.vy;
  if (boxHitsSolid(b)) {
    if (b.vy > 0) {
      b.y = Math.floor((b.y + b.h) / TILE) * TILE - b.h;
      hit.ground = true;
    } else {
      b.y = Math.floor(b.y / TILE) * TILE + TILE;
      hit.ceiling = true;
    }
    b.vy = 0;
  }
  return hit;
}

// ---------- Level setup ----------
function loadLevel(index) {
  level = LEVELS[index];
  grid = level.map.map((row) => row.split(''));
  rows = grid.length;
  cols = grid[0].length;
  enemies = [];
  fireballs = [];
  bolts = [];
  items = [];
  particles = [];
  popups = [];
  gem = null;
  let start = { x: 32, y: 32 };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      const x = c * TILE;
      const y = r * TILE;
      if (ch === 'P') start = { x: x + 3, y: y + TILE - 14 };
      else if (ch === 'D') enemies.push(makeDragon(x + TILE / 2, y + TILE / 2));
      else if (ch === 'K') enemies.push(makeScorpion(x + 1, y + TILE - 8));
      else if (ch === 'X') gem = { x: x + 1, y: y + 3, w: 14, h: 11, baseY: y + 3 };
      else continue;
      grid[r][c] = '.';
    }
  }
  enemies.filter((e) => e.type === 'dragon').forEach(fitDragonLoop);

  // On the motorbike the kid and bike together make a bigger box.
  const w = level.bike ? 16 : 10;
  const h = level.bike ? 20 : 14;
  start.y += 14 - h;
  player = {
    x: start.x,
    y: start.y,
    w,
    h,
    bike: !!level.bike,
    bikeWaiting: !!level.bike,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    coyote: 0,
    jumpBuffer: 0,
    punchT: 0,
    punchCooldown: 0,
    magic: false,
    invuln: 0,
    walkT: 0,
    dead: false,
    deadT: 0,
    safeX: start.x,
    safeY: start.y,
  };
  cam.x = 0;
  cam.y = 0;
}

function makeDragon(cx, cy) {
  return {
    type: 'dragon',
    cx,
    cy,
    rx: 56,
    ry: 14,
    angle: rand(0, Math.PI * 2),
    speed: rand(0.017, 0.024),
    x: cx - DRAGON_W / 2,
    y: cy - DRAGON_H / 2,
    w: DRAGON_W,
    h: DRAGON_H,
    facing: 1,
    fireT: rand(60, 150),
    alive: true,
  };
}

function makeScorpion(x, y) {
  return { type: 'scorpion', x, y, w: 14, h: 8, vx: -0.45, vy: 0, facing: -1, alive: true };
}

// Each dragon flies an oval loop around its spawn point. Shrink the loop
// until it fits in open sky so dragons never fly through rock.
function loopIsClear(cx, cy, rx, ry) {
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const box = { x: cx + Math.cos(a) * rx - DRAGON_W / 2, y: cy + Math.sin(a) * ry - DRAGON_H / 2, w: DRAGON_W, h: DRAGON_H };
    if (boxHitsSolid(box)) return false;
  }
  return true;
}

function fitDragonLoop(d) {
  for (let rx = 72; rx >= 8; rx -= 8) {
    for (const ry of [16, 10, 4]) {
      if (loopIsClear(d.cx, d.cy, rx, ry)) {
        d.rx = rx;
        d.ry = ry;
        return;
      }
    }
  }
  d.rx = 0;
  d.ry = 0;
}

// Title screen level select (handy for testing any level straight away).
function chooseLevel(step) {
  state.levelIndex = (state.levelIndex + step + LEVELS.length) % LEVELS.length;
  loadLevel(state.levelIndex);
}

function backToTitle() {
  state.mode = 'title';
  loadLevel(state.levelIndex);
}

function startGame() {
  Sound.init();
  state.mode = 'playing';
  state.paused = false;
  state.score = 0;
  state.lives = START_LIVES;
  state.time = 0;
  loadLevel(state.levelIndex);
  Sound.startMusic();
}

function hasNextLevel() {
  return state.levelIndex + 1 < LEVELS.length;
}

function nextLevel() {
  state.mode = 'playing';
  state.levelIndex++;
  state.time = 0;
  const magic = player.magic;
  loadLevel(state.levelIndex);
  player.magic = magic;
  Sound.startMusic();
}

// ---------- Effects ----------
function burst(x, y, color, count, speed = 1.5) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(0.3, speed);
    particles.push({ kind: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(20, 35), color });
  }
}

function debris(c, r, color) {
  for (let i = 0; i < 4; i++) {
    particles.push({
      kind: 'chunk',
      x: c * TILE + 4 + (i % 2) * 8,
      y: r * TILE + 4 + Math.floor(i / 2) * 8,
      vx: (i % 2 ? 1 : -1) * rand(0.6, 1.4),
      vy: rand(-3.5, -2),
      life: 60,
      color,
    });
  }
}

function puff(x, y) {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    particles.push({ kind: 'puff', x, y, vx: Math.cos(a) * 0.8, vy: Math.sin(a) * 0.8, life: 24, color: '#fff' });
  }
}

function popup(x, y, text) {
  popups.push({ x, y, text, t: 50 });
}

function addScore(n, x, y) {
  state.score += n;
  if (x !== undefined) popup(x, y, String(n));
}

// ---------- Blocks and items ----------
function breakTile(c, r) {
  const ch = grid[r][c];
  grid[r][c] = '.';
  Sound.smash();
  const color = ch === 'S' ? '#f8c818' : ch === 'M' ? '#c050f0' : '#f8b868';
  debris(c, r, color);
  addScore(10);
  const x = c * TILE + 3;
  const y = r * TILE + 3;
  if (ch === 'M') spawnItem('orb', x, y);
  else if (ch === 'S') spawnItem(Math.random() < 0.15 ? 'heart' : 'bag', x, y);
  else if (Math.random() < 0.15) spawnItem('bag', x, y);
}

function spawnItem(type, x, y) {
  items.push({ type, x, y, w: 10, h: 10, vx: 0, vy: -2.5, t: 0 });
}

function collectItem(it) {
  const cx = it.x + it.w / 2;
  if (it.type === 'bag') {
    Sound.coin();
    addScore(200, cx, it.y);
  } else if (it.type === 'heart') {
    Sound.power();
    state.lives++;
    popup(cx, it.y, '1UP');
  } else if (it.type === 'orb') {
    Sound.power();
    player.magic = true;
    popup(cx, it.y, 'MAGIC!');
    burst(cx, it.y + 5, '#e070f8', 16, 2);
  }
}

// ---------- Player ----------
function fistBox(p) {
  return { x: p.facing > 0 ? p.x + p.w - 2 : p.x - 10, y: p.y + 3, w: 12, h: 9 };
}

// Smashes the first breakable block found at x, at any of the given heights.
function smashAt(x, heights) {
  for (const y of heights) {
    const c = Math.floor(x / TILE);
    const r = Math.floor(y / TILE);
    if (BREAKABLE.has(tileAt(c, r))) {
      breakTile(c, r);
      return true;
    }
  }
  return false;
}

function punch(p) {
  p.punchCooldown = 16;
  // On the motorbike your hands are on the handlebars: magic only.
  if (!p.bike) {
    p.punchT = 10;
    Sound.punch();
    smashAt(p.facing > 0 ? p.x + p.w + 5 : p.x - 5, [p.y + 6, p.y + 10]);
  }
  if (p.magic && bolts.length < 2) {
    Sound.magic();
    const y = p.bike ? p.y + 5 : p.y + 3;
    bolts.push({ x: p.facing > 0 ? p.x + p.w : p.x - 8, y, w: 8, h: 8, vx: p.facing * (3.5 + Math.max(0, p.vx)), t: 0 });
  }
}

// force: falling in the water still counts while you're blinking.
function hurtPlayer(force = false) {
  const p = player;
  if (p.dead || (p.invuln > 0 && !force)) return;
  p.dead = true;
  p.deadT = 0;
  p.deadX = p.x;
  p.deadY = p.y;
  Sound.die();
  Sound.stopMusic();
}

function respawn() {
  const p = player;
  state.lives--;
  if (state.lives <= 0) {
    endGame('gameover');
    return;
  }
  p.dead = false;
  p.x = p.safeX;
  p.y = p.safeY;
  p.vx = 0;
  p.vy = 0;
  p.invuln = INVULN_FRAMES;
  p.bikeWaiting = p.bike; // the bike waits for you to press Right or Jump
  fireballs = [];
  Sound.startMusic();
}

// The motorbike always rolls forward. Right speeds it up, Left slows it down.
function rideBike(p) {
  const left = keys.arrowleft || keys.a;
  const right = keys.arrowright || keys.d;
  if (p.bikeWaiting && (right || tapped(JUMP_KEYS))) p.bikeWaiting = false;
  const target = p.bikeWaiting ? 0 : right ? BIKE_FAST : left ? BIKE_SLOW : BIKE_CRUISE;
  p.vx += Math.sign(target - p.vx) * Math.min(Math.abs(target - p.vx), p.onGround ? 0.08 : 0.04);
  p.facing = 1;
}

function updatePlayer() {
  const p = player;
  if (p.dead) {
    p.deadT++;
    if (p.deadT > 100) respawn();
    return;
  }

  const left = keys.arrowleft || keys.a;
  const right = keys.arrowright || keys.d;
  const accel = p.onGround ? 0.25 : 0.18;
  if (p.bike) rideBike(p);
  else if (left && !right) {
    p.vx -= accel;
    p.facing = -1;
  } else if (right && !left) {
    p.vx += accel;
    p.facing = 1;
  } else {
    p.vx *= p.onGround ? 0.7 : 0.94;
    if (Math.abs(p.vx) < 0.05) p.vx = 0;
  }
  if (!p.bike) p.vx = Math.max(-RUN_SPEED, Math.min(RUN_SPEED, p.vx));

  // Jumping forgives slightly early presses and slightly late ones.
  p.jumpBuffer = tapped(JUMP_KEYS) ? 6 : p.jumpBuffer - 1;
  p.coyote = p.onGround ? 6 : p.coyote - 1;
  if (p.jumpBuffer > 0 && p.coyote > 0) {
    p.vy = -JUMP_SPEED;
    p.jumpBuffer = 0;
    p.coyote = 0;
    Sound.jump();
  }
  if (!held(JUMP_KEYS) && p.vy < -2) p.vy = -2; // let go early for a small hop
  p.vy = Math.min(p.vy + GRAVITY, MAX_FALL);

  const speed = p.vx;
  const hit = moveBox(p);
  p.onGround = hit.ground;
  p.walkT = p.onGround && p.vx !== 0 ? p.walkT + 1 : 0;

  if (p.bike) {
    // Ride straight through rocks and blocks, and head-butt the ones above.
    if (hit.x && smashAt(p.x + p.w + 2, [p.y + 4, p.y + p.h / 2, p.y + p.h - 3])) p.vx = speed * 0.85;
    if (hit.ceiling) smashAt(p.x + p.w / 2, [p.y - 2]);
  }

  // Fell off the bottom (or into the water).
  if (p.y + p.h > rows * TILE - (level.water ? 6 : 0)) {
    hurtPlayer(true);
    return;
  }

  if (p.punchCooldown > 0) p.punchCooldown--;
  if (p.punchT > 0) p.punchT--;
  if (tapped(PUNCH_KEYS) && p.punchCooldown <= 0) punch(p);
  if (p.invuln > 0) p.invuln--;

  if (p.magic && state.frame % 12 === 0) {
    particles.push({ kind: 'spark', x: p.x + rand(0, p.w), y: p.y + rand(0, p.h), vx: 0, vy: -0.3, life: 20, color: '#f0a0ff' });
  }

  // Remember a safe spot to come back to after losing a life.
  if (p.onGround) {
    const near = (o) => Math.abs(o.x - p.x) < 48 && Math.abs(o.y - p.y) < 48;
    // On the bike, only somewhere with road ahead (not the edge of a drop).
    const roadAhead = !p.bike || [0, 1, 2].every((i) => solidAtPixel(p.x + p.w + i * TILE, p.y + p.h + 2));
    if (roadAhead && !enemies.some((e) => e.alive && near(e)) && !fireballs.some(near)) {
      p.safeX = p.x;
      p.safeY = p.y;
    }
  }
}

// ---------- Enemies ----------
function onScreen(o, margin = 0) {
  return (
    o.y + o.h > cam.y - margin && o.y < cam.y + VIEW_H + margin &&
    o.x + o.w > cam.x - margin && o.x < cam.x + VIEW_W + margin
  );
}

function updateDragon(d) {
  d.angle += d.speed;
  const nx = d.cx + Math.cos(d.angle) * d.rx - d.w / 2;
  const ny = d.cy + Math.sin(d.angle) * d.ry - d.h / 2;
  if (Math.abs(nx - d.x) > 0.01) d.facing = nx > d.x ? 1 : -1;
  d.x = nx;
  d.y = ny;
  if (state.mode !== 'playing' || !onScreen(d)) return;
  d.fireT--;
  if (d.fireT <= 0) {
    d.fireT = rand(90, 160);
    Sound.fire();
    fireballs.push({ x: d.facing > 0 ? d.x + d.w : d.x - 6, y: d.y + 3, w: 6, h: 6, vx: d.facing * 2, t: 0 });
  }
}

function updateScorpion(s) {
  s.vy = Math.min(s.vy + GRAVITY, MAX_FALL);
  const hit = moveBox(s);
  if (hit.x) s.vx = -s.facing * 0.45;
  // Turn around at the edge of a ledge.
  const aheadX = s.vx > 0 ? s.x + s.w + 1 : s.x - 1;
  if (hit.ground && !solidAtPixel(aheadX, s.y + s.h + 2)) s.vx = -s.vx;
  if (s.vx === 0) s.vx = -s.facing * 0.45;
  s.facing = s.vx > 0 ? 1 : -1;
}

function killEnemy(e) {
  e.alive = false;
  Sound.kill();
  puff(e.x + e.w / 2, e.y + e.h / 2);
  addScore(e.type === 'dragon' ? 300 : 200, e.x + e.w / 2, e.y);
}

// ---------- Main update ----------
function updateEffects() {
  for (const cl of clouds) {
    cl.x += cl.speed;
    if (cl.x > VIEW_W + 10) cl.x = -50;
  }
  for (const pt of particles) {
    pt.x += pt.vx;
    pt.y += pt.vy;
    if (pt.kind === 'chunk') pt.vy += 0.2;
    pt.life--;
  }
  for (const pp of popups) {
    pp.y -= 0.5;
    pp.t--;
  }
  particles = particles.filter((pt) => pt.life > 0);
  popups = popups.filter((pp) => pp.t > 0);
}

function update() {
  state.frame++;
  if (!state.paused) updateEffects();
  if (state.mode === 'title') {
    enemies.forEach((e) => e.type === 'dragon' && updateDragon(e));
    return;
  }
  if (state.mode !== 'playing' || state.paused) return;

  state.time++;
  const p = player;
  updatePlayer();

  for (const e of enemies) {
    if (!e.alive) continue;
    if (e.type === 'dragon') updateDragon(e);
    else if (onScreen(e, 64)) updateScorpion(e);
  }

  // The punch beats anything it touches.
  if (!p.dead && p.punchT > 4) {
    const fist = fistBox(p);
    for (const e of enemies) if (e.alive && overlap(fist, e)) killEnemy(e);
  }

  for (const f of fireballs) {
    f.x += f.vx;
    f.t++;
    if (solidAtPixel(f.x + f.w / 2, f.y + f.h / 2) || f.t > 300) {
      f.dead = true;
      burst(f.x + 3, f.y + 3, '#f87818', 5, 1);
    }
  }

  for (const b of bolts) {
    b.x += b.vx;
    b.t++;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const c = Math.floor(cx / TILE);
    const r = Math.floor(cy / TILE);
    if (BREAKABLE.has(tileAt(c, r))) {
      breakTile(c, r);
      b.dead = true;
    } else if (SOLID.has(tileAt(c, r)) || b.t > 80) {
      b.dead = true;
    }
    for (const e of enemies) {
      if (!b.dead && e.alive && overlap(b, e)) {
        killEnemy(e);
        b.dead = true;
      }
    }
    for (const f of fireballs) {
      if (!b.dead && !f.dead && overlap(b, f)) {
        f.dead = true;
        b.dead = true;
        addScore(50, f.x, f.y);
      }
    }
    if (b.dead) burst(cx, cy, '#e070f8', 8, 1.5);
  }

  for (const it of items) {
    it.t++;
    it.vy = Math.min(it.vy + 0.2, 3);
    moveBox(it);
    if (it.y > rows * TILE) it.dead = true; // dropped into the water
    else if (!p.dead && overlap(it, p)) {
      it.dead = true;
      collectItem(it);
    }
  }

  // Getting touched by an enemy or fire costs a life.
  if (!p.dead && p.invuln <= 0) {
    const body = { x: p.x + 1, y: p.y + 2, w: p.w - 2, h: p.h - 2 };
    // The motorbike runs scorpions over.
    if (p.bike) {
      for (const e of enemies) if (e.alive && e.type === 'scorpion' && overlap(body, e)) killEnemy(e);
    }
    if (enemies.some((e) => e.alive && overlap(body, e)) || fireballs.some((f) => !f.dead && overlap(body, f))) {
      hurtPlayer();
    }
  }

  if (gem) {
    gem.y = gem.baseY + Math.sin(state.frame * 0.08) * 2;
    if (state.frame % 6 === 0) burst(gem.x + rand(0, 14), gem.y + rand(0, 10), '#ffffff', 1, 0.3);
    if (!p.dead && overlap(p, gem)) {
      Sound.stopMusic();
      Sound.gem();
      burst(gem.x + 7, gem.y + 5, '#40d8ff', 30, 2.5);
      state.bonus = Math.max(0, 5000 - Math.floor(state.time / 60) * 25);
      state.score += state.bonus;
      gem = null;
      endGame('clear');
    }
  }

  fireballs = fireballs.filter((f) => !f.dead);
  bolts = bolts.filter((b) => !b.dead);
  items = items.filter((i) => !i.dead);

  // Camera follows the player, keeping more of the way ahead in view
  // (below you in a tall level, in front of you on the motorbike).
  const ease = p.dead ? 0 : 1;
  const targetY = clampCam(p.y + p.h / 2 - VIEW_H * 0.4, rows * TILE - VIEW_H);
  const targetX = clampCam(p.x + p.w / 2 - (p.bike ? 80 : VIEW_W / 2), cols * TILE - VIEW_W);
  cam.y += (targetY - cam.y) * 0.12 * ease;
  cam.x += (targetX - cam.x) * 0.2 * ease;
}

function clampCam(v, max) {
  return Math.max(0, Math.min(max, v));
}

function endGame(mode) {
  state.mode = mode;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    saveHighScore(state.highScore);
  }
}

// ---------- Drawing ----------
function drawCloud(x, y, s) {
  vctx.fillStyle = '#a8c8ff';
  vctx.beginPath();
  vctx.ellipse(x + 16 * s, y + 9 * s, 20 * s, 6 * s, 0, 0, Math.PI * 2);
  vctx.fill();
  vctx.fillStyle = '#fff';
  for (const [dx, dy, r] of [[6, 6, 6], [15, 3, 8], [25, 6, 6]]) {
    vctx.beginPath();
    vctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
    vctx.fill();
  }
}

function drawSky() {
  vctx.fillStyle = '#1c58f0';
  vctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const span = VIEW_H + 120;
  const spanX = VIEW_W + 60;
  for (const cl of clouds) {
    const y = ((((cl.y - cam.y * 0.4) % span) + span) % span) - 40;
    const x = ((((cl.x - cam.x * 0.4) % spanX) + spanX) % spanX) - 50;
    drawCloud(Math.round(x), Math.round(y), cl.size);
  }
}

// Water along the bottom of the level, showing through the gaps.
function drawWater(camX, camY) {
  const y = rows * TILE - 10 - camY;
  vctx.fillStyle = '#1040c0';
  vctx.fillRect(camX, y, VIEW_W, 10);
  vctx.fillStyle = '#58a8ff';
  for (let x = camX - (camX % 16); x < camX + VIEW_W; x += 16) {
    const bob = Math.floor((state.frame / 12 + x / 16) % 2);
    vctx.fillRect(x + bob * 4, y, 8, 2);
  }
}

function drawTiles(camX, camY) {
  const r0 = Math.floor(camY / TILE);
  const c0 = Math.floor(camX / TILE);
  for (let r = r0; r <= r0 + VIEW_H / TILE + 1; r++) {
    for (let c = c0; c <= c0 + VIEW_W / TILE + 1 && c < cols; c++) {
      const ch = tileAt(c, r);
      const x = c * TILE;
      const y = r * TILE - camY;
      if (ch === '#') {
        vctx.drawImage(ROCK_TILES[(c * 7 + r * 3) % 2], x, y);
        if (tileAt(c, r - 1) === '.') vctx.drawImage(GRASS, x, y);
      } else if (ch === 'S') vctx.drawImage(STAR_TILE, x, y);
      else if (ch === 'M') vctx.drawImage(MAGIC_TILE, x, y);
      else if (ch === 'B') vctx.drawImage(BREAK_TILE, x, y);
    }
  }
}

function drawSprite(pairOrImg, x, y, facing = 1) {
  const img = pairOrImg.r ? (facing > 0 ? pairOrImg.r : pairOrImg.l) : pairOrImg;
  vctx.drawImage(img, Math.round(x), Math.round(y));
}

function drawPlayer(camY) {
  const p = player;
  if (p.dead) {
    // The kid's ghost floats away, wobbling.
    vctx.globalAlpha = Math.max(0, 1 - p.deadT / 100);
    const wob = Math.sin(p.deadT * 0.2) * 4;
    drawSprite(SPRITES.kidJump, p.deadX - 1 + wob, p.deadY - 1 - p.deadT * 0.7 - camY, 1);
    vctx.globalAlpha = 1;
    return;
  }
  if (p.invuln > 0 && Math.floor(p.invuln / 4) % 2) return;
  if (p.bike) {
    // The kid sits on the bike; the wheels turn as it moves.
    const by = p.y + p.h - 12 - camY;
    const turning = p.vx > 0.1 && Math.floor(p.x / 6) % 2;
    drawSprite(SPRITES.kidJump, p.x + 2, by - 11, 1);
    drawSprite(turning ? SPRITES.bikeB : SPRITES.bikeA, p.x - 2, by, 1);
    return;
  }
  let spr = SPRITES.kidStand;
  if (p.punchT > 0) spr = SPRITES.kidPunch;
  else if (!p.onGround) spr = SPRITES.kidJump;
  else if (p.walkT > 0 && Math.floor(p.walkT / 7) % 2) spr = SPRITES.kidWalk;
  const extra = spr.r.width - 12;
  const x = p.facing > 0 ? p.x - 1 : p.x - 1 - extra;
  drawSprite(spr, x, p.y - 1 - camY, p.facing);
}

function drawWorld() {
  const camY = Math.round(cam.y);
  const camX = Math.round(cam.x);
  drawSky();
  // Everything below is drawn in level coordinates, shifted by the camera.
  vctx.save();
  vctx.translate(-camX, 0);
  if (level.water) drawWater(camX, camY);
  drawTiles(camX, camY);

  if (gem) {
    drawSprite(SPRITES.gem, gem.x, gem.y - camY);
  }

  for (const it of items) {
    const img = it.type === 'bag' ? SPRITES.bag : it.type === 'heart' ? SPRITES.heart : SPRITES.orb;
    drawSprite(img, it.x + (10 - img.width) / 2, it.y + 10 - img.height - camY);
  }

  for (const e of enemies) {
    if (!e.alive) continue;
    if (e.type === 'dragon') {
      const spr = Math.floor(state.frame / 10) % 2 ? SPRITES.dragonUp : SPRITES.dragonDown;
      drawSprite(spr, e.x + e.w / 2 - 8, e.y + e.h / 2 - 6 - camY, e.facing);
    } else {
      const spr = Math.floor(state.frame / 8) % 2 ? SPRITES.scorpA : SPRITES.scorpB;
      drawSprite(spr, e.x - 1, e.y + e.h - 10 - camY, e.facing);
    }
  }

  if (player && state.mode !== 'title') drawPlayer(camY);

  for (const f of fireballs) {
    const flick = Math.floor(state.frame / 3) % 2;
    vctx.fillStyle = '#e82000';
    vctx.fillRect(Math.round(f.x) - 1, Math.round(f.y - camY), 8, 6);
    vctx.fillStyle = flick ? '#f8a000' : '#f87818';
    vctx.fillRect(Math.round(f.x), Math.round(f.y - camY) + 1, 6, 4);
    vctx.fillStyle = '#fff070';
    vctx.fillRect(Math.round(f.x) + (f.vx > 0 ? 3 : 1), Math.round(f.y - camY) + 2, 2, 2);
  }

  for (const b of bolts) {
    const cx = b.x + 4;
    const cy = b.y + 4 - camY;
    vctx.strokeStyle = '#e070f8';
    vctx.lineWidth = 2;
    vctx.beginPath();
    vctx.arc(cx, cy, 4 + Math.sin(b.t * 0.6), 0, Math.PI * 2);
    vctx.stroke();
    vctx.fillStyle = '#fff';
    vctx.fillRect(cx - 1, cy - 1, 2, 2);
  }

  for (const pt of particles) {
    vctx.fillStyle = pt.color;
    const x = Math.round(pt.x);
    const y = Math.round(pt.y - camY);
    if (pt.kind === 'chunk') vctx.fillRect(x - 3, y - 3, 6, 6);
    else if (pt.kind === 'puff') {
      vctx.globalAlpha = pt.life / 24;
      vctx.beginPath();
      vctx.arc(x, y, 4 - pt.life / 12, 0, Math.PI * 2);
      vctx.fill();
      vctx.globalAlpha = 1;
    } else vctx.fillRect(x, y, 1, 1);
  }
  vctx.restore();
}

function text(str, x, y, size, color = '#fff', align = 'left') {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#000';
  ctx.fillText(str, x + 3, y + 3);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function drawHud() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 0, canvas.width, 40);
  text(`SCORE ${String(state.score).padStart(6, '0')}`, 14, 12, 16);
  for (let i = 0; i < state.lives; i++) ctx.drawImage(SPRITES.heart, 330 + i * 30, 10, 27, 24);
  if (player.magic) ctx.drawImage(SPRITES.orb, 520, 7, 27, 27);
  const secs = Math.floor(state.time / 60);
  text(`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, canvas.width - 14, 12, 16, '#fff', 'right');

  // How far along you are: down the right edge, or along the bottom on the bike.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  if (player.bike) {
    const frac = Math.max(0, Math.min(1, player.x / ((cols - 4) * TILE)));
    const bx = 40;
    const by = canvas.height - 18;
    const bw = canvas.width - 100;
    ctx.fillRect(bx, by, bw, 10);
    ctx.fillStyle = '#40d8ff';
    ctx.fillRect(bx, by, bw * frac, 10);
    ctx.drawImage(SPRITES.gem, bx + bw + 8, by - 8, 28, 22);
  } else {
    const frac = Math.max(0, Math.min(1, player.y / ((rows - 2) * TILE)));
    const bx = canvas.width - 22;
    const by = 60;
    const bh = canvas.height - 100;
    ctx.fillRect(bx, by, 10, bh);
    ctx.fillStyle = '#40d8ff';
    ctx.fillRect(bx, by, 10, bh * frac);
    ctx.drawImage(SPRITES.gem, bx - 9, by + bh + 4, 28, 22);
  }

  for (const pp of popups) {
    text(pp.text, (pp.x - cam.x) * SCALE, (pp.y - cam.y) * SCALE, 12, '#fff8a0', 'center');
  }
}

function panel(lines) {
  ctx.fillStyle = 'rgba(0, 0, 20, 0.72)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const [str, y, size, color] of lines) text(str, canvas.width / 2, y, size, color, 'center');
}

function draw() {
  drawWorld();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(view, 0, 0, canvas.width, canvas.height);

  const blink = Math.floor(state.frame / 30) % 2 === 0;
  const name = LEVELS[state.levelIndex].name;
  if (state.mode === 'title') {
    panel([
      ['GEM QUEST', 90, 52, '#f8d030'],
      [`< Level ${state.levelIndex + 1}: ${name} >`, 175, 16, '#90f060'],
      [TOUCH ? 'The side arrows pick the level' : 'Left / Right picks the level', 202, 10, '#8090b0'],
      [level.intro[0], 240, 13],
      [level.intro[1], 265, 13],
      ...(TOUCH
        ? [
            [level.bike ? 'Left stick ...... faster / slower' : 'Left stick ...... move', 320, 12, '#c8d8ff'],
            [level.bike ? 'JUMP / MAGIC .... buttons on the right' : 'JUMP / PUNCH .... buttons on the right', 345, 12, '#c8d8ff'],
            ['II pause   \u266a sound', 370, 12, '#c8d8ff'],
          ]
        : [
            [level.bike ? 'Right / Left ....... faster / slower' : 'Arrows / A D ....... move', 320, 12, '#c8d8ff'],
            ['Space / Up / X ..... jump', 345, 12, '#c8d8ff'],
            [level.bike ? 'Z / J .............. magic' : 'Z / J .............. punch', 370, 12, '#c8d8ff'],
            ['P pause   M sound', 395, 12, '#c8d8ff'],
          ]),
      [blink ? (TOUCH ? 'TAP TO START' : 'PRESS ENTER') : '', 460, 20, '#fff'],
      [`HIGH SCORE ${state.highScore}`, 520, 12, '#f8d030'],
    ]);
    ctx.drawImage(SPRITES.gem, canvas.width / 2 - 28, 18, 56, 44);
    return;
  }

  drawHud();
  if (state.paused) panel([['PAUSED', 250, 32], [TOUCH ? 'Tap to carry on' : 'Press P to carry on', 310, 14]]);
  if (state.mode === 'clear') {
    panel([
      ['YOU FOUND THE GEM!', 130, 26, '#40d8ff'],
      [`${name} cleared`, 190, 16, '#90f060'],
      [`Time bonus  ${state.bonus}`, 260, 16],
      [`Score  ${state.score}`, 300, 16],
      [`High score  ${state.highScore}`, 340, 14, '#f8d030'],
      [hasNextLevel() ? '' : 'More levels coming soon...', 400, 12, '#c8d8ff'],
      [blink ? (hasNextLevel() ? `${TOUCH ? 'TAP' : 'PRESS ENTER'} FOR THE NEXT LEVEL` : `${TOUCH ? 'TAP' : 'PRESS ENTER'} TO PLAY AGAIN`) : '', 470, 16],
    ]);
    ctx.drawImage(SPRITES.gem, canvas.width / 2 - 42, 40, 84, 66);
  } else if (state.mode === 'gameover') {
    panel([
      ['GAME OVER', 180, 40, '#e82020'],
      [`Score  ${state.score}`, 280, 16],
      [`High score  ${state.highScore}`, 320, 14, '#f8d030'],
      [blink ? (TOUCH ? 'TAP TO TRY AGAIN' : 'PRESS ENTER TO TRY AGAIN') : '', 420, 16],
    ]);
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

loadLevel(0);
requestAnimationFrame(loop);
