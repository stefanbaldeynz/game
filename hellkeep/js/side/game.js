// Hellkeep rounds 1 and 2: side-on platform rounds on the way down into hell.
// Round 1 races a motorbike across the lava sea; round 2 climbs down the
// Brimstone Gorge to the fortress. Grab the Soul Gem at the end of each to finish the round.
//
// You start with the Flak Shotgun, the double jump and the angel wings (double jump,
// then hold Space to fly). Hellhounds fly in loops spitting fire, and lightning
// elephants charge along the ledges.
//
// This file is the game itself: the rules, physics and beasts, worked out on a flat
// map measured in pixels (one tile = 16 pixels; the view is 192 pixels tall). The
// world is drawn in 3D by render3d.js. The HUD and menus are the same as the 3D rounds.

const TILE = 16;
const VIEW_H = 192;
let VIEW_W = 256;

// Movement (all per frame, 60 frames a second).
const GRAVITY = 0.3;
const MAX_FALL = 4.5;
const JUMP_SPEED = 5.4;
const DOUBLE_JUMP_SPEED = 4.8;
const RUN_SPEED = 1.7;
const WING_LIFT = 0.55;       // stronger than gravity, so you climb
const WING_MAX_RISE = 2.2;    // fastest climb speed
const WING_TIRE = 1 / 180;    // full stamina lasts 3 seconds of flying
const WING_REST = 1 / 240;    // stamina back per frame while on the ground
const BIKE_SLOW = 1.1;
const BIKE_CRUISE = 1.9;
const BIKE_FAST = 2.7;

// The Flak Shotgun.
const SHOT_PELLETS = 7;
const SHOT_SPREAD = 0.22;     // radians either side
const SHOT_SPEED = 5.5;
const SHOT_LIFE = 22;         // frames a pellet flies (about 120 pixels)
const SHOT_COOLDOWN = 34;
const MAX_SHELLS = 60;

// Health and damage.
const MAX_HEALTH = 100;
const INVULN_FRAMES = 60;
const DAMAGE = { hound: 15, fireball: 10, elephant: 20, charge: 30, lava: 34 };

// Enemies.
const HOUND_W = 18;
const HOUND_H = 10;
const SIDE_HOUND_HP = 3;
const SIDE_ELEPHANT_HP = 10;
const SIDE_ELEPHANT_WALK = 0.4;
const SIDE_ELEPHANT_CHARGE = 3.2;

// ---------- The round ----------
const ROUND_NUMBER = SIDE_ROUNDS[roundFromHash()] ? roundFromHash() : 1;
const ROUND = SIDE_ROUNDS[ROUND_NUMBER];

// ---------- Page elements ----------
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayRound = document.getElementById('overlay-round');
const overlayText = document.getElementById('overlay-text');
const overlayButton = document.getElementById('overlay-button');
const hud = {
  health: document.getElementById('health'),
  ammo: document.getElementById('ammo'),
  enemies: document.getElementById('hounds'),
  round: document.getElementById('round'),
  message: document.getElementById('message'),
  damage: document.getElementById('damage'),
  wingsFill: document.getElementById('wings-fill'),
};
overlayRound.textContent = ROUND.title;
overlayText.textContent = ROUND.intro;
hud.round.textContent = ROUND.title;
buildRoundPicker(ROUND_NUMBER, () => overlayAction());

function resize() {
  // Show more of the world on wide screens; the height stays the same.
  VIEW_W = clamp(Math.round((VIEW_H * innerWidth) / innerHeight), 256, 448);
}
addEventListener('resize', resize);
resize();

// ---------- Input ----------
const keys = {};
const pressed = {};
const JUMP_KEYS = [' ', 'arrowup', 'w'];
const FIRE_KEYS = ['j', 'z', 'x', 'control', 'mouse'];

addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (!e.repeat) pressed[k] = true;
  keys[k] = true;
  if (k === 'm' && game.state === 'playing') showMessage(Music.toggle() ? 'Music on' : 'Music off', 1.5);
  if ((k === 'escape' || k === 'p') && game.state === 'playing') pause();
  if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault();
});
addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});
addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  if (game.state === 'playing') pause();
});
addEventListener('mousedown', (e) => {
  if (e.button !== 0 || game.state !== 'playing') return;
  keys.mouse = true;
  pressed.mouse = true;
});
addEventListener('mouseup', () => {
  keys.mouse = false;
});

// Touch controls (phones and tablets): they press the same keys as the keyboard.
TouchControls.setup({
  stick: { left: 'ArrowLeft', right: 'ArrowRight' },
  buttons: [{ label: 'JUMP', key: ' ' }, { label: 'FIRE', key: 'j' }],
  top: [{ label: 'II', key: 'p', tap: true }, { label: '♪', key: 'm', tap: true }],
  topSide: 'right',
  hidden: () => game.state === 'menu' || game.state === 'paused' || game.state === 'dead' || game.state === 'won',
});
if (TouchControls.isTouch) overlayButton.textContent = 'Tap to play';

const held = (list) => list.some((k) => keys[k]);
const tapped = (list) => list.some((k) => pressed[k]);

// ---------- Game state ----------
const game = {
  state: 'menu', // menu | playing | paused | dying | winning | dead | won
  frame: 0,
  time: 0,
  endT: 0,
  kills: 0,
  hurt: 0,
  shake: 0,
  flash: 0,
  godMode: false,
};

let grid = [];
let rows = 0;
let cols = 0;
let player = null;
let enemies = [];
let fireballs = [];
let pellets = [];
let items = [];
let particles = [];
let gem = null;
const cam = { x: 0, y: 0 };

// ---------- Tiles ----------
const SOLID = new Set(['#', 'B', 'S', 'M']);
const BREAKABLE = new Set(['B', 'S', 'M']);

function tileAt(c, r) {
  if (c < 0 || c >= cols) return '#';
  if (r < 0 || r >= rows) return '.'; // open air above, a drop below
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

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ---------- Round setup ----------
function loadRound() {
  grid = ROUND.map.map((row) => row.split(''));
  rows = grid.length;
  cols = grid[0].length;
  let start = { x: 32, y: 32 };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      const x = c * TILE;
      const y = r * TILE;
      if (ch === 'P') start = { x: x + 3, y: y + TILE };
      else if (ch === 'H') enemies.push(makeHound(x + TILE / 2, y + TILE / 2));
      else if (ch === 'E') enemies.push(makeElephant(x + TILE / 2, y + TILE));
      else if (ch === 'X') gem = { x: x + 1, y: y + 4, w: 14, h: 11, baseY: y + 4 };
      else continue;
      grid[r][c] = '.';
    }
  }
  enemies.filter((e) => e.type === 'hound').forEach(fitHoundLoop);

  // On the motorbike you and the bike together make a bigger box.
  const w = ROUND.bike ? 16 : 10;
  const h = ROUND.bike ? 20 : 14;
  player = {
    x: start.x,
    y: start.y - h,
    w,
    h,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    coyote: 0,
    jumpBuffer: 0,
    jumps: 0,
    flying: false,
    flapT: 0,
    stamina: 1,
    health: MAX_HEALTH,
    shells: 30,
    cooldown: 0,
    recoil: 0,
    invuln: 0,
    walkT: 0,
    bike: !!ROUND.bike,
    bikeWaiting: !!ROUND.bike,
    safeX: start.x,
    safeY: start.y - h,
  };
}

function makeHound(cx, cy) {
  return {
    type: 'hound',
    cx,
    cy,
    rx: 56,
    ry: 14,
    angle: rand(0, Math.PI * 2),
    speed: rand(0.017, 0.024),
    x: cx - HOUND_W / 2,
    y: cy - HOUND_H / 2,
    w: HOUND_W,
    h: HOUND_H,
    facing: 1,
    fireT: rand(60, 150),
    hp: SIDE_HOUND_HP,
    hitT: 0,
    alive: true,
  };
}

function makeElephant(cx, bottom) {
  return {
    type: 'elephant',
    x: cx - 13,
    y: bottom - 18,
    w: 26,
    h: 18,
    vx: -SIDE_ELEPHANT_WALK,
    vy: 0,
    facing: -1,
    mode: 'walk', // walk | windup | charge | stunned
    modeT: 0,
    hp: SIDE_ELEPHANT_HP,
    hitT: 0,
    alive: true,
  };
}

// Each hellhound flies an oval loop around where it starts. Shrink the loop
// until it fits in open air so hounds never fly through rock.
function loopIsClear(cx, cy, rx, ry) {
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const box = { x: cx + Math.cos(a) * rx - HOUND_W / 2, y: cy + Math.sin(a) * ry - HOUND_H / 2, w: HOUND_W, h: HOUND_H };
    if (boxHitsSolid(box)) return false;
  }
  return true;
}

function fitHoundLoop(d) {
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

// ---------- Menus ----------
function showOverlay(title, text, button) {
  hideStory(); // the chapter is only for the start of the round
  if (TouchControls.isTouch) button = button.replace(/^Click/, 'Tap');
  overlayTitle.textContent = title;
  overlayRound.textContent = title === 'Paused' ? ROUND.title : '';
  overlayText.textContent = text;
  overlayButton.textContent = button;
  overlay.classList.remove('hidden');
}

function pause() {
  game.state = 'paused';
  showOverlay('Paused', 'The depths are waiting.', 'Click to resume');
}

// The menu's play button (and the round picker's button for this round) start, resume,
// retry or continue, depending on where you are.
overlayButton.addEventListener('click', overlayAction);

function overlayAction() {
  Sound.init();
  Sound.resume();
  if (game.state === 'won') {
    goToRound(ROUND_NUMBER < TOTAL_ROUNDS ? ROUND_NUMBER + 1 : 1);
    return;
  }
  if (game.state === 'dead') {
    goToRound(ROUND_NUMBER);
    return;
  }
  if (game.state === 'menu') {
    Music.start(ROUND_NUMBER);
    if (ROUND.bike) Music.setSection('boss'); // the relentless riff for the ride
    const jumpName = TouchControls.isTouch ? 'JUMP' : 'Space';
    showMessage(ROUND.bike ? `Right to ride! Double jump, then hold ${jumpName} to fly` : `Double jump, then hold ${jumpName} to fly`, 4);
  }
  game.state = 'playing';
  overlay.classList.add('hidden');
  for (const k in keys) keys[k] = false;
  return true;
}

let messageTimer = 0;
function showMessage(text, seconds = 2.5) {
  hud.message.textContent = text;
  hud.message.style.opacity = 1;
  messageTimer = seconds * 60;
}

// ---------- Effects ----------
function emit(x, y, vx, vy, life, color, kind = 'spark') {
  particles.push({ x, y, vx, vy, life, max: life, color, kind });
}

function burst(x, y, colors, count, speed = 1.5) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(0.3, speed);
    emit(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(18, 35), colors[i % colors.length]);
  }
}

function debris(c, r, color) {
  for (let i = 0; i < 4; i++) {
    emit(c * TILE + 4 + (i % 2) * 8, r * TILE + 4 + Math.floor(i / 2) * 8, (i % 2 ? 1 : -1) * rand(0.6, 1.4), rand(-3.5, -2), 60, color, 'chunk');
  }
}

// ---------- Blocks and pickups ----------
function breakTile(c, r) {
  const ch = grid[r][c];
  grid[r][c] = '.';
  Sound.explosion(0.3);
  debris(c, r, ch === 'S' ? '#3a3036' : ch === 'M' ? '#c89a3a' : '#a8501a');
  burst(c * TILE + 8, r * TILE + 8, ['#ff7a10', '#ffd060'], 6, 1.2);
  const x = c * TILE + 3;
  const y = r * TILE + 4;
  if (ch === 'M') {
    spawnItem('health', x - 4, y);
    spawnItem('shells', x + 4, y);
    showMessage('Skull chest!', 1.5);
  } else if (ch === 'S') spawnItem(Math.random() < 0.55 ? 'shells' : 'health', x, y);
  else if (Math.random() < 0.15) spawnItem('shells', x, y);
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

function spawnItem(type, x, y) {
  items.push({ type, x, y, w: 10, h: 8, vx: (Math.random() - 0.5) * 0.8, vy: -2.5 });
}

function collectItem(it) {
  const p = player;
  if (it.type === 'health') {
    if (p.health >= MAX_HEALTH) return false;
    p.health = Math.min(MAX_HEALTH, p.health + 25);
    showMessage('+25 health', 1.5);
  } else {
    if (p.shells >= MAX_SHELLS) return false;
    p.shells = Math.min(MAX_SHELLS, p.shells + 8);
    showMessage('+8 shells', 1.5);
  }
  Sound.pickup();
  return true;
}

// ---------- The Flak Shotgun ----------
function muzzle(p) {
  return { x: p.facing > 0 ? p.x + p.w + 6 : p.x - 6, y: p.y + (p.bike ? 6 : 9) };
}

function fire(p) {
  if (p.cooldown > 0) return;
  if (p.shells <= 0) {
    // Out of shells: smack whatever's in front with the gun instead.
    Sound.empty();
    p.cooldown = 20;
    showMessage('Out of shells! Blast a rune block', 2);
    const front = { x: p.facing > 0 ? p.x + p.w : p.x - 12, y: p.y + 2, w: 12, h: 10 };
    smashAt(p.facing > 0 ? p.x + p.w + 5 : p.x - 5, [p.y + 6, p.y + 10]);
    for (const e of enemies) if (e.alive && overlap(front, e)) damageEnemy(e, 2);
    return;
  }
  p.shells--;
  p.cooldown = SHOT_COOLDOWN;
  p.recoil = 4;
  game.flash = 5;
  game.shake = Math.max(game.shake, 3);
  Sound.shotgun();
  const m = muzzle(p);
  for (let i = 0; i < SHOT_PELLETS; i++) {
    const a = spreadRandom() * SHOT_SPREAD;
    const s = SHOT_SPEED + rand(-0.5, 0.8);
    pellets.push({ x: m.x, y: m.y, vx: Math.cos(a) * s * p.facing + p.vx, vy: Math.sin(a) * s, life: SHOT_LIFE + rand(-3, 3) });
  }
  for (let i = 0; i < 8; i++) emit(m.x, m.y, p.facing * rand(0.5, 2), rand(-0.8, 0.8), rand(8, 14), i % 2 ? '#7ff6ff' : '#ffc070');
  // The kick pushes you back a little.
  if (!p.bike) p.vx -= p.facing * (p.onGround ? 1.2 : 0.6);
}

function damageEnemy(e, amount) {
  e.hp -= amount;
  e.hitT = 6;
  if (e.hp > 0) {
    if (e.type === 'hound') Sound.yelp(0.5);
    return;
  }
  e.alive = false;
  game.kills++;
  if (e.type === 'hound') {
    Sound.yelp(1);
    burst(e.x + e.w / 2, e.y + e.h / 2, ['#ff7a10', '#ffb020', '#3a1a10'], 24, 2);
  } else {
    Sound.elephantDeath(0.8);
    burst(e.x + e.w / 2, e.y + e.h / 2, ['#bff8ff', '#5ab0ff', '#7a8aa8'], 30, 2.2);
  }
  if (enemies.every((en) => !en.alive)) showMessage('Every beast is down!', 2);
}

// ---------- Player ----------
function hurtPlayer(amount, fromX, force = false) {
  const p = player;
  if (game.state !== 'playing' || game.godMode) return;
  if (p.invuln > 0 && !force) return;
  p.health = Math.max(0, p.health - amount);
  p.invuln = INVULN_FRAMES;
  game.hurt = Math.min(1, game.hurt + amount / 25);
  game.shake = Math.max(game.shake, 4);
  Sound.hurt();
  // Knocked back away from whatever hit you.
  if (fromX !== null) {
    const dir = p.x + p.w / 2 < fromX ? -1 : 1;
    p.vx = dir * (p.bike ? 1 : 2.5);
    p.vy = -3;
  }
  if (p.health <= 0) {
    game.state = 'dying';
    game.endT = 0;
    Music.stop();
  }
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

function walk(p) {
  const left = keys.arrowleft || keys.a;
  const right = keys.arrowright || keys.d;
  const accel = p.onGround ? 0.25 : 0.18;
  if (left && !right) {
    p.vx -= accel;
    p.facing = -1;
  } else if (right && !left) {
    p.vx += accel;
    p.facing = 1;
  } else {
    p.vx *= p.onGround ? 0.7 : 0.94;
    if (Math.abs(p.vx) < 0.05) p.vx = 0;
  }
  p.vx = clamp(p.vx, -RUN_SPEED * 1.6, RUN_SPEED * 1.6); // a little extra room for knockback
  if (Math.abs(p.vx) > RUN_SPEED && (left || right)) p.vx *= 0.9;
}

// Jumping, double jumping, flying with the angel wings, and gravity.
function jumpAndFly(p) {
  p.jumpBuffer = tapped(JUMP_KEYS) ? 6 : p.jumpBuffer - 1;
  p.coyote = p.onGround ? 6 : p.coyote - 1;
  if (p.jumpBuffer > 0 && p.coyote > 0) {
    p.vy = -JUMP_SPEED;
    p.jumpBuffer = 0;
    p.coyote = 0;
    p.jumps = 1;
    Sound.jump();
  } else if (tapped(JUMP_KEYS) && !p.onGround && p.jumps < 2) {
    // Double jump: a second kick in mid-air.
    p.vy = -DOUBLE_JUMP_SPEED;
    p.jumps = 2;
    p.jumpBuffer = 0;
    Sound.jump();
    for (let i = 0; i < 8; i++) emit(p.x + p.w / 2, p.y + p.h, rand(-1, 1), rand(0, 0.8), 18, '#ffe08a');
  }
  if (!held(JUMP_KEYS) && p.vy < -2 && !p.flying) p.vy = -2; // let go early for a small hop

  // Hold Space after your double jump to beat your wings and fly.
  p.flying = !p.onGround && p.jumps >= 2 && held(JUMP_KEYS) && p.stamina > 0 && p.vy > -1.5;
  if (p.flying) {
    p.vy = Math.max(-WING_MAX_RISE, p.vy - WING_LIFT);
    p.stamina = Math.max(0, p.stamina - WING_TIRE);
    p.flapT++;
    if (p.flapT % 16 === 1) Sound.wingFlap();
    if (game.frame % 3 === 0) emit(p.x + rand(0, p.w), p.y + rand(4, 12), rand(-0.3, 0.3), rand(0.3, 0.8), 30, '#fff2c0');
  } else {
    p.flapT = 0;
  }
  p.vy = Math.min(p.vy + GRAVITY, MAX_FALL);
}

function respawn() {
  const p = player;
  p.x = p.safeX;
  p.y = p.safeY;
  p.vx = 0;
  p.vy = 0;
  p.invuln = INVULN_FRAMES * 1.5;
  p.bikeWaiting = p.bike; // the bike waits for you to press Right or Jump
  fireballs = [];
}

function updatePlayer() {
  const p = player;
  if (p.bike) rideBike(p);
  else walk(p);
  jumpAndFly(p);

  const speed = p.vx;
  const hit = moveBox(p);
  p.onGround = hit.ground;
  // The smoke above the round is as high as your wings can take you.
  if (p.y < -8) {
    p.y = -8;
    p.vy = Math.max(0, p.vy);
  }
  if (p.onGround) {
    p.jumps = 0;
    p.stamina = Math.min(1, p.stamina + WING_REST);
  }
  p.walkT = p.onGround && Math.abs(p.vx) > 0.1 ? p.walkT + 1 : 0;

  if (p.bike) {
    // Ride straight through brimstone and rune blocks, and head-butt the ones above.
    if (hit.x && smashAt(p.x + p.w + 2, [p.y + 4, p.y + p.h / 2, p.y + p.h - 3])) p.vx = speed * 0.85;
    if (hit.ceiling) smashAt(p.x + p.w / 2, [p.y - 2]);
  }

  // Fell into the lava sea (or off the bottom).
  if (p.y + p.h > rows * TILE - (ROUND.lava ? 6 : 0)) {
    Sound.sizzle();
    burst(p.x + p.w / 2, rows * TILE - 8, ['#ff7a10', '#ffd060'], 20, 2);
    hurtPlayer(DAMAGE.lava, null, true);
    if (game.state === 'playing') {
      showMessage('The lava burns!', 1.5);
      respawn();
    }
    return;
  }

  if (p.cooldown > 0) p.cooldown--;
  if (p.recoil > 0) p.recoil -= 0.5;
  if (tapped(FIRE_KEYS) || (keys.mouse && p.cooldown === 0 && pressed.mouse)) fire(p);
  if (p.invuln > 0) p.invuln--;

  // Remember a safe spot to come back to after falling in the lava.
  if (p.onGround) {
    const near = (o) => Math.abs(o.x - p.x) < 56 && Math.abs(o.y - p.y) < 48;
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

function updateHound(d) {
  d.angle += d.speed;
  const nx = d.cx + Math.cos(d.angle) * d.rx - d.w / 2;
  const ny = d.cy + Math.sin(d.angle) * d.ry - d.h / 2;
  if (Math.abs(nx - d.x) > 0.01) d.facing = nx > d.x ? 1 : -1;
  d.x = nx;
  d.y = ny;
  // A trail of flames behind it.
  if (game.frame % 2 === 0) emit(d.x + (d.facing > 0 ? 1 : d.w - 1), d.y + rand(0, 4), -d.facing * 0.3, -0.4, 16, Math.random() < 0.5 ? '#ff7a10' : '#ffb020');
  if (game.state !== 'playing' || !onScreen(d)) return;
  if (Math.random() < 0.004) Sound.growl(0.4);
  // Spit fire the way it's flying.
  d.fireT--;
  if (d.fireT <= 0) {
    d.fireT = rand(90, 160);
    Sound.fireball();
    fireballs.push({ x: d.facing > 0 ? d.x + d.w : d.x - 6, y: d.y + 4, w: 6, h: 6, vx: d.facing * 2, t: 0 });
  }
}

// Walk the ledges. When you're on the same level and in front, rear up,
// trumpet, then charge until it hits a wall (stunned) or the edge of the ledge.
function updateElephant(e) {
  const p = player;
  e.vy = Math.min(e.vy + GRAVITY, MAX_FALL);
  e.modeT++;
  const ahead = (dir) => solidAtPixel(dir > 0 ? e.x + e.w + 2 : e.x - 2, e.y + e.h + 2);

  if (e.mode === 'walk') {
    e.vx = e.facing * SIDE_ELEPHANT_WALK;
    const dx = p.x + p.w / 2 - (e.x + e.w / 2);
    const sameLevel = Math.abs(p.y + p.h - (e.y + e.h)) < 20;
    if (sameLevel && Math.abs(dx) < 130 && Math.sign(dx) === e.facing && game.state === 'playing' && e.modeT > 40) {
      e.mode = 'windup';
      e.modeT = 0;
      Sound.trumpet(0.7);
    }
  } else if (e.mode === 'windup') {
    e.vx = 0;
    if (e.modeT > 40) {
      e.mode = 'charge';
      e.modeT = 0;
    }
  } else if (e.mode === 'charge') {
    e.vx = e.facing * SIDE_ELEPHANT_CHARGE;
    if (game.frame % 2 === 0) burst(e.x + e.w / 2, e.y + e.h, ['#bff8ff', '#5ab0ff'], 2, 1);
  } else if (e.mode === 'stunned') {
    e.vx = 0;
    if (e.modeT > 70) {
      e.mode = 'walk';
      e.modeT = 0;
    }
  }

  const hit = moveBox(e);
  if (e.mode === 'charge') {
    // Charging elephants smash through blocks; a wall stuns them.
    if (hit.x && smashAt(e.facing > 0 ? e.x + e.w + 2 : e.x - 2, [e.y + 4, e.y + e.h - 4])) e.vx = e.facing * SIDE_ELEPHANT_CHARGE;
    else if (hit.x) {
      e.mode = 'stunned';
      e.modeT = 0;
      Sound.thud();
      game.shake = Math.max(game.shake, onScreen(e) ? 3 : 0);
    } else if ((hit.ground || e.vy === 0) && !ahead(e.facing)) {
      e.mode = 'stunned'; // skids to a halt at the edge
      e.modeT = 30;
    } else if (e.modeT > 110) {
      e.mode = 'walk';
      e.modeT = 0;
    }
  } else if (e.mode === 'walk' && (hit.x || (hit.ground && !ahead(e.facing)))) {
    e.facing = -e.facing; // turn round at walls and ledge edges
  }
}

// ---------- Main update ----------
function updateEffects() {
  for (const pt of particles) {
    pt.x += pt.vx;
    pt.y += pt.vy;
    if (pt.kind === 'chunk') pt.vy += 0.2;
    pt.life--;
  }
  particles = particles.filter((pt) => pt.life > 0);
  // Embers drifting up through the air.
  if (Math.random() < 0.8) {
    emit(cam.x + rand(0, VIEW_W), cam.y + VIEW_H + 4, rand(-0.2, 0.2), rand(-0.9, -0.3), rand(120, 220), Math.random() < 0.5 ? '#ff7a10' : '#ffb020', 'ember');
  }
  if (ROUND.lava && Math.random() < 0.3) {
    emit(cam.x + rand(0, VIEW_W), rows * TILE - 9, rand(-0.2, 0.2), rand(-1.2, -0.4), rand(20, 40), '#ffd060');
  }
}

function update() {
  game.frame++;
  const running = game.state === 'playing' || game.state === 'menu';
  if (game.state === 'paused' || game.state === 'dead' || game.state === 'won') return;
  updateEffects();
  if (game.shake > 0) game.shake -= 0.25;
  if (game.flash > 0) game.flash--;

  if (game.state === 'dying' || game.state === 'winning') {
    game.endT++;
    if (game.endT === 80) finish(game.state === 'winning' ? 'won' : 'dead');
    return;
  }

  for (const e of enemies) {
    if (!e.alive || game.calm) continue;
    if (e.hitT > 0) e.hitT--;
    if (e.type === 'hound') updateHound(e);
    else if (onScreen(e, 80)) updateElephant(e);
  }
  if (!running || game.state === 'menu') {
    followCamera(1);
    return;
  }

  game.time++;
  const p = player;
  updatePlayer();

  for (const f of fireballs) {
    f.x += f.vx;
    f.t++;
    if (game.frame % 2 === 0) emit(f.x + 3, f.y + 3, -f.vx * 0.2, rand(-0.3, 0.1), 10, '#ff7a10');
    if (solidAtPixel(f.x + f.w / 2, f.y + f.h / 2) || f.t > 300) {
      f.dead = true;
      burst(f.x + 3, f.y + 3, ['#f87818', '#ffd060'], 5, 1);
    }
  }

  // Flak pellets: smash blocks, hurt beasts, and knock fireballs out of the air.
  for (const s of pellets) {
    s.x += s.vx;
    s.y += s.vy;
    s.life--;
    const c = Math.floor(s.x / TILE);
    const r = Math.floor(s.y / TILE);
    const tile = tileAt(c, r);
    if (BREAKABLE.has(tile)) {
      breakTile(c, r);
      s.dead = true;
    } else if (SOLID.has(tile)) {
      s.dead = true;
      burst(s.x, s.y, ['#7ff6ff', '#ffffff'], 3, 1);
    }
    for (const e of enemies) {
      if (!s.dead && e.alive && s.x > e.x && s.x < e.x + e.w && s.y > e.y && s.y < e.y + e.h) {
        damageEnemy(e, 1);
        s.dead = true;
        burst(s.x, s.y, e.type === 'hound' ? ['#ff7a10'] : ['#bff8ff'], 3, 1);
      }
    }
    for (const f of fireballs) {
      if (!s.dead && !f.dead && s.x > f.x - 2 && s.x < f.x + f.w + 2 && s.y > f.y - 2 && s.y < f.y + f.h + 2) {
        f.dead = true;
        s.dead = true;
        burst(f.x + 3, f.y + 3, ['#ffd060', '#7ff6ff'], 8, 1.5);
      }
    }
    if (s.life <= 0) s.dead = true;
  }

  for (const it of items) {
    it.vy = Math.min(it.vy + 0.2, 3);
    moveBox(it);
    it.vx *= 0.95;
    if (it.y > rows * TILE) it.dead = true; // dropped into the lava
    else if (overlap(it, p) && collectItem(it)) it.dead = true;
  }

  // Touching a beast or fire hurts.
  if (p.invuln <= 0) {
    const body = { x: p.x + 1, y: p.y + 2, w: p.w - 2, h: p.h - 2 };
    for (const e of enemies) {
      if (!e.alive || !overlap(body, e)) continue;
      if (e.type === 'hound') {
        Sound.bite(0.8);
        hurtPlayer(DAMAGE.hound, e.x + e.w / 2);
      } else {
        Sound.gore();
        hurtPlayer(e.mode === 'charge' ? DAMAGE.charge : DAMAGE.elephant, e.x + e.w / 2);
      }
      break;
    }
    for (const f of fireballs) {
      if (!f.dead && overlap(body, f)) {
        f.dead = true;
        hurtPlayer(DAMAGE.fireball, f.x);
        break;
      }
    }
  }

  if (gem) {
    gem.y = gem.baseY + Math.sin(game.frame * 0.08) * 2;
    if (game.frame % 5 === 0) emit(gem.x + rand(0, 14), gem.y + rand(0, 10), 0, -0.3, 30, '#ff8a7a');
    if (overlap(p, gem) && game.state === 'playing') {
      Sound.pickup();
      Sound.powerChord();
      burst(gem.x + 7, gem.y + 5, ['#ff4a3a', '#ffd060', '#ffffff'], 40, 2.5);
      gem = null;
      game.state = 'winning';
      game.endT = 0;
      Music.stop();
      showMessage('The Soul Gem is yours!', 3);
    }
  }

  fireballs = fireballs.filter((f) => !f.dead);
  pellets = pellets.filter((s) => !s.dead);
  items = items.filter((i) => !i.dead);
  followCamera(p.dead ? 0 : 1);
}

function finish(state) {
  game.state = state;
  const minutes = Math.floor(game.time / 3600);
  const seconds = String(Math.floor(game.time / 60) % 60).padStart(2, '0');
  const total = enemies.length;
  if (state === 'dead') {
    showOverlay('You died', `${ROUND.title}. You put down ${game.kills} of ${total} beasts.`, `Click to retry round ${ROUND_NUMBER}`);
    return;
  }
  const stats = `Time: ${minutes}:${seconds}. Health left: ${Math.ceil(player.health)}. Beasts put down: ${game.kills} of ${total}.`;
  if (ROUND_NUMBER < TOTAL_ROUNDS) {
    const tease = ROUND_NUMBER === 1 ? 'The Soul Gem burns open a crack in the rock...' : 'Far below, the fortress gates...';
    showOverlay(`Round ${ROUND_NUMBER} complete`, `${stats} ${tease}`, `Continue to round ${ROUND_NUMBER + 1}`);
  } else {
    showOverlay('Hellkeep conquered', `You beat every round! ${stats}`, 'Click to play again from round 1');
  }
}

// Camera follows you, keeping more of the way ahead in view (below you in
// the gorge, in front of you on the motorbike).
function followCamera(ease) {
  const p = player;
  const ty = clampCam(p.y + p.h / 2 - VIEW_H * 0.4, rows * TILE - VIEW_H);
  const tx = clampCam(p.x + p.w / 2 - (p.bike ? 90 : VIEW_W / 2), cols * TILE - VIEW_W);
  cam.y += (ty - cam.y) * 0.12 * ease;
  cam.x += (tx - cam.x) * 0.2 * ease;
}

function clampCam(v, max) {
  if (max < 0) return max / 2; // the level is narrower than the screen: centre it
  return Math.max(0, Math.min(max, v));
}

// The HUD is the same one as the 3D rounds (see index.html and style.css).
let lastHud = '';
function updateHud() {
  const p = player;
  const alive = (type) => enemies.filter((e) => e.type === type && e.alive).length;
  const state = [Math.ceil(p.health), p.shells, alive('hound'), alive('elephant')].join();
  if (state !== lastHud) {
    lastHud = state;
    hud.health.textContent = Math.ceil(p.health);
    hud.health.classList.toggle('low', p.health <= 30);
    hud.ammo.textContent = p.shells;
    hud.ammo.classList.toggle('low', p.shells === 0);
    const parts = [];
    if (enemies.some((e) => e.type === 'hound')) parts.push(`Hellhounds left: ${alive('hound')}`);
    if (enemies.some((e) => e.type === 'elephant')) parts.push(`Lightning elephants left: ${alive('elephant')}`);
    hud.enemies.textContent = parts.join(' · ');
  }
  hud.wingsFill.style.width = `${p.stamina * 100}%`;
  game.hurt = Math.max(0, game.hurt - 0.025);
  hud.damage.style.opacity = Math.min(0.85, game.hurt);
  messageTimer--;
  if (messageTimer <= 0) hud.message.style.opacity = 0;
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
  SideRender.draw();
  updateHud();
  requestAnimationFrame(loop);
}

// Set up the round and start the loop (called by render3d.js once it's ready).
function startSide() {
  loadRound();
  followCamera(1);
  cam.x = clampCam(player.x + player.w / 2 - (player.bike ? 90 : VIEW_W / 2), cols * TILE - VIEW_W);
  cam.y = clampCam(player.y - VIEW_H * 0.4, rows * TILE - VIEW_H);

  // Dev helper, like the 3D rounds: side.html#round=3&preview starts straight away,
  // &god makes you invincible, and &calm keeps the beasts still (for screenshots).
  const previewOptions = new URLSearchParams(location.hash.slice(1));
  if (previewOptions.has('preview')) {
    game.state = 'playing';
    overlay.classList.add('hidden');
    game.godMode = previewOptions.has('god');
    game.calm = previewOptions.has('calm');
    // &x=..&y=.. puts you somewhere else on the map (in tiles).
    if (previewOptions.has('x')) player.x = Number(previewOptions.get('x')) * TILE;
    if (previewOptions.has('y')) player.y = Number(previewOptions.get('y')) * TILE;
    followCamera(1);
    cam.x = clampCam(player.x + player.w / 2 - (player.bike ? 90 : VIEW_W / 2), cols * TILE - VIEW_W);
    cam.y = clampCam(player.y - VIEW_H * 0.4, rows * TILE - VIEW_H);
  }

  SideRender.init();
  requestAnimationFrame(loop);
}
