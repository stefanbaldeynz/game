// The fighters and the fight itself: rigs and poses, moves, specials, power-ups,
// Willy Rage, projectiles, particles and the computer opponent. Runs at a fixed 60 ticks a second.

const FIGHTERS = {
  bill: {
    id: 'bill', name: 'WILD BILL', style: 'BIG. BULKY. BAD NEWS.',
    speed: 1.6, jump: 8.8, might: 1.06, defense: 0.94, reach: 1.0, hw: 15, height: 104,
    torso: 36, thigh: 26, shin: 25, uarm: 21, farm: 21, hipW: 22, chestW: 30, arm: 8, leg: 12, belly: 11,
    stats: [5, 2, 3],
    colors: { skin: '#e8b48c', skinShade: '#b8805c', hair: '#14141a', hairHi: '#3e3e4a', beard: '#1e1a1c', eye: '#3a2a1a',
      shirt: '#26262e', shirtHi: '#3e3e4a', pants: '#3c4030', pantsHi: '#50563e', shoes: '#16161a', print: '#d8d8e0' },
    power: 'cocaine',
    quote: ['YOU SHOULD SEE ME ON A MONDAY.', 'WHO ORDERED THE WILD BILL SPECIAL?', 'THAT WAS ME BEING NICE.'],
  },
  kiwi: {
    id: 'kiwi', name: 'KIWI BATTLER', style: 'TALL. LANKY. VERY GINGER.',
    speed: 2.2, jump: 9.6, might: 1.02, defense: 0.92, reach: 1.25, hw: 10, height: 116,
    torso: 37, thigh: 32, shin: 32, uarm: 25, farm: 25, hipW: 12, chestW: 16, arm: 5, leg: 7, belly: 0,
    stats: [3, 4, 5],
    colors: { skin: '#f2c8a4', skinShade: '#c8946e', hair: '#d8541a', hairHi: '#ff8a3a', beard: '#c8481a', eye: '#3a6a3a',
      shirt: '#22222a', shirtHi: '#38383f', pants: '#2a3a68', pantsHi: '#3e5088', shoes: '#e4e4e8', print: '#f0c828' },
    power: 'whiskey',
    quote: ['SWEET AS, BRO.', 'CHUR. GOOD ONE.', 'NOT EVEN THE LAW CAN STOP ME.'],
  },
  baldric: {
    id: 'baldric', name: 'BALDRIC', style: 'MID-SIZE. BLONDE. BLUE-EYED.',
    speed: 2.0, jump: 9.2, might: 1.0, defense: 1.0, reach: 1.0, hw: 12, height: 94,
    torso: 31, thigh: 24, shin: 24, uarm: 19, farm: 19, hipW: 15, chestW: 21, arm: 6, leg: 9, belly: 0,
    stats: [4, 4, 3],
    colors: { skin: '#f0c098', skinShade: '#c49068', hair: '#f0d060', hairHi: '#fff0a0', beard: '#d8b850', eye: '#1a78e8',
      shirt: '#1e1e26', shirtHi: '#34343c', pants: '#31323c', pantsHi: '#46485a', shoes: '#14141a', print: '#ffffff' },
    power: 'steak',
    quote: ['I HAVE A CUNNING PLAN.', 'NOW WHERE IS THAT STEAK?', 'HORNS UP, LADS.'],
  },
  sf: {
    id: 'sf', name: 'THE STREET FIGHTER', style: 'NO FIXED ADDRESS. JUST A BLOKE WHO FIGHTS STREETS.',
    speed: 2.1, jump: 9.4, might: 1.05, defense: 1.0, reach: 1.05, hw: 12, height: 100,
    torso: 33, thigh: 27, shin: 26, uarm: 21, farm: 21, hipW: 17, chestW: 25, arm: 7, leg: 9, belly: 0,
    stats: [4, 4, 4],
    colors: { skin: '#c88a5c', skinShade: '#986238', hair: '#2a1a10', hairHi: '#5a3a20', beard: '#2a1a10', eye: '#2a1a0a',
      shirt: '#a81e1a', shirtHi: '#d8382e', pants: '#2c4c80', pantsHi: '#4068a8', shoes: '#3a2414', print: '#e8e8e8', bandana: '#c8c8d0' },
    power: 'kebab',
    quote: ['THE STREET ALWAYS WINS.', 'NEXT.', 'LEGENDS NEVER PAY BUS FARE.'],
  },
};
const ROSTER = ['bill', 'kiwi', 'baldric', 'sf'];

const POWER_UPS = {
  cocaine: { name: 'COCAINE', sprite: 'bag', sound: 'sniff', say: 'Cocaine!', col: '#ffffff', frames: 480, speed: 1.6, atk: 1.4, dmg: 1.1, taken: 1, heal: 0, crash: 90,
    text: 'HYPER SPEED FOR 8 SECONDS. THEN THE CRASH.' },
  whiskey: { name: 'WHISKEY', sprite: 'whiskey', sound: 'gulp', say: 'Whiskey!', col: '#e8a030', frames: 540, speed: 1, atk: 1, dmg: 1.45, taken: 0.72, heal: 8, sway: true,
    text: 'HITS HARDER, FEELS NOTHING, WALKS FUNNY.' },
  steak: { name: 'STEAK & BEER', sprite: 'steak', sprite2: 'beer', sound: 'chomp', say: 'Steak and beer!', col: '#ffb060', frames: 480, speed: 1.1, atk: 1, dmg: 1.25, taken: 0.9, heal: 18,
    text: 'BIG HEAL, MORE POWER. A PROPER MEAL.' },
  kebab: { name: 'STREET KEBAB', sprite: 'kebab', sound: 'chomp', say: 'Street kebab!', col: '#e8c888', frames: 360, speed: 1.1, atk: 1, dmg: 1.15, taken: 1, heal: 12,
    text: 'FOUND IT ON THE FLOOR. STILL WARM.' },
};

const SPECIALS = {
  poster: { name: 'IO POSTER STAR', cost: 0, seq: ['D', 'F'], btn: 'p', key: '1', input: '↓ → PUNCH', note: 'THROWING STAR. ×2.5 ON BALDRIC. DUCK TO DODGE' },
  law: { name: 'CZECH LAW', cost: 25, seq: ['D', 'F'], btn: 'k', key: '2', input: '↓ → KICK', note: 'FLYING PAPERWORK. ×3 ON KIWI AND TIES HIM UP' },
  lenka: { name: 'SUMMON LENKA', cost: 50, seq: ['D', 'D'], btn: 'p', key: '3', input: '↓ ↓ PUNCH', note: 'SHE HUNTS, SHE EXPLODES. ×3 UNBLOCKABLE ON KIWI' },
  power: { name: 'POWER-UP', cost: 0, seq: ['D', 'D'], btn: 'k', key: '4', input: '↓ ↓ KICK', note: 'YOUR OWN VICE. ONCE A ROUND' },
  dive: { name: 'STAGE DIVE', cost: 25, seq: ['F', 'F'], btn: 'k', key: '5', input: '→ → KICK', note: 'LEAP OFF THE AMPS ONTO THEIR HEAD' },
  guitar: { name: 'GUITAR BLAST', cost: 50, seq: ['B', 'F'], btn: 'p', key: '6', input: '← → PUNCH', note: 'BLAST WAVE ALONG THE GROUND. JUMP IT' },
};

const DIFFICULTY = {
  EASY: { think: 40, react: 22, block: 0.2, special: 0.12, combo: 0.2, dmg: 0.8 },
  NORMAL: { think: 24, react: 12, block: 0.5, special: 0.3, combo: 0.55, dmg: 1 },
  BRUTAL: { think: 12, react: 5, block: 0.82, special: 0.55, combo: 0.9, dmg: 1.15 },
};

// Poses: torso lean, near arm (shoulder, elbow), far arm, front leg (hip, knee), back leg,
// whole-body rotation, hip height when lying or flying (0 = stand on the feet). Angles in degrees,
// 0 points straight down and positive swings forward.
const P = (t, a1, e1, a2, e2, l1, k1, l2, k2, rot = 0, lift = 0) => [t, a1, e1, a2, e2, l1, k1, l2, k2, rot, lift];
const POSE = {
  idle0: P(8, 48, 88, 26, 104, 24, 28, -20, 14),
  idle1: P(10, 44, 92, 22, 108, 28, 36, -22, 20),
  walk0: P(10, 48, 88, 26, 104, 28, 12, -26, 18),
  walk1: P(10, 44, 92, 30, 100, 6, 28, -6, 40),
  walk2: P(10, 48, 88, 26, 104, -22, 18, 26, 12),
  walk3: P(10, 52, 84, 22, 108, -6, 40, 6, 28),
  crouch: P(24, 52, 88, 30, 108, 74, 118, -10, 104),
  block: P(4, 72, 92, 58, 104, 24, 28, -18, 14),
  cblock: P(22, 72, 92, 58, 104, 74, 118, -10, 104),
  jumpUp: P(4, 118, 40, -28, 40, 56, 92, 8, 64),
  jumpDown: P(10, 80, 60, 20, 70, 40, 60, -10, 30),
  // normals: windup, strike, recover
  jabW: P(10, 24, 112, 26, 104, 24, 28, -20, 14),
  jabS: P(20, 92, 0, 26, 104, 34, 24, -30, 8),
  crossW: P(6, 48, 88, -18, 96, 24, 28, -20, 14),
  crossS: P(30, 30, 90, 92, 0, 40, 30, -36, 6),
  kickW: P(-4, 30, 88, 10, 90, 62, 92, -8, 12),
  kickS: P(-20, 24, 86, -22, 80, 98, 4, -10, 6),
  roundW: P(-10, 26, 84, -10, 80, 70, 70, -8, 10),
  roundS: P(-34, 40, 70, -42, 62, 118, 6, -14, 4),
  uppW: P(26, 8, 124, 28, 106, 66, 104, -12, 84),
  uppS: P(-8, 168, 8, 20, 90, 18, 12, -24, 6),
  sweepW: P(30, 40, 60, 10, 80, 50, 100, -30, 120),
  sweepS: P(34, 28, 36, -44, 16, 86, 4, -66, 128),
  butW: P(-14, 20, 70, -6, 74, 24, 28, -20, 14),
  butS: P(44, -24, 40, -32, 34, 44, 26, -32, 8),
  jPunch: P(16, 124, 0, -12, 50, 62, 96, 6, 60),
  jKick: P(-14, 42, 60, -14, 60, 84, 8, 4, 92),
  grabW: P(14, 92, 18, 88, 18, 28, 30, -22, 12),
  grabS: P(-24, 164, 18, 158, 18, 18, 20, -24, 10),
  // reactions
  hitHigh: P(-22, -14, 34, -38, 26, 22, 24, -18, 14),
  hitLow: P(38, 34, 22, 20, 18, 22, 34, -20, 22),
  knock: P(-10, -60, 30, -80, 20, 34, 40, -8, 24, -56, 26),
  down: P(0, -96, 20, -70, 14, 14, 18, 0, 6, -90, 8),
  getup: P(30, 34, 60, -30, 24, 66, 106, -14, 100),
  dazed: P(14, 62, 110, 54, 118, 12, 18, -10, 14),
  rage0: P(4, 18, 110, 24, 112, 34, 44, -30, 24),
  rage1: P(-6, 88, 118, 96, 110, 40, 60, -36, 36),
  win0: P(-2, 168, 8, 34, 40, 22, 6, -22, 6),
  win1: P(-5, 172, 4, 40, 34, 26, 8, -26, 8),
  lose: P(52, 2, 6, -2, 6, 14, 30, -14, 22),
  toss: P(-10, 136, 66, 20, 60, 24, 22, -22, 12),
  tossS: P(26, 86, 0, -14, 44, 36, 24, -34, 6),
  summon: P(-8, 166, 12, 150, 12, 24, 18, -24, 12),
  drink: P(-14, 74, 122, 30, 80, 20, 18, -18, 12),
  flex: P(-10, 84, 116, 84, 116, 26, 24, -24, 14),
  guitarHold: P(4, 58, 76, 62, 62, 28, 28, -26, 14),
  guitarHit: P(-10, 66, 48, 72, 50, 40, 44, -34, 18),
  guitarWind: P(-14, 176, 0, 62, 62, 32, 34, -30, 16),
  diveUp: P(-8, 166, 8, 20, 40, 44, 74, -8, 34, 0, 0),
  diveFlop: P(0, 172, 0, 176, 0, 4, 6, -4, 6, 76, 10),
};

const MOVES = {
  jab: { s: 4, a: 3, r: 9, dmg: 4, reach: 34, kb: 1.4, stun: 15, lvl: 'mid', pose: ['jabW', 'jabS'], snd: 'punch', whoosh: true, next: 'cross', nextBtn: 'p' },
  cross: { s: 5, a: 3, r: 11, dmg: 5, reach: 38, kb: 1.8, stun: 17, lvl: 'mid', pose: ['crossW', 'crossS'], snd: 'punch', lunge: 1.5, next: 'round', nextBtn: 'k' },
  round: { s: 7, a: 4, r: 15, dmg: 9, reach: 44, knock: true, kb: 3.6, up: 5, lvl: 'mid', pose: ['roundW', 'roundS'], snd: 'kick', name: 'PUB BRAWLER' },
  kick: { s: 7, a: 4, r: 12, dmg: 7, reach: 42, kb: 2.4, stun: 18, lvl: 'mid', pose: ['kickW', 'kickS'], snd: 'kick', whoosh: true },
  butt: { s: 8, a: 4, r: 14, dmg: 9, reach: 28, kb: 2.2, stun: 24, lvl: 'mid', pose: ['butW', 'butS'], snd: 'kick', lunge: 3, float: 'GLASGOW KISS!' },
  upper: { s: 7, a: 5, r: 18, dmg: 11, reach: 32, knock: true, kb: 1.6, up: 8.6, lvl: 'mid', air: true, pose: ['uppW', 'uppS'], snd: 'kick', lift: true, name: 'NECK BREAKER' },
  sweep: { s: 6, a: 4, r: 18, dmg: 6, reach: 42, knock: true, kb: 0.6, up: 2.6, lvl: 'low', pose: ['sweepW', 'sweepS'], snd: 'kick', crouchMove: true },
  jpunch: { s: 3, a: 12, r: 2, dmg: 7, reach: 32, kb: 2, stun: 18, lvl: 'over', air: true, pose: ['jPunch', 'jPunch'], snd: 'punch', airMove: true },
  jkick: { s: 4, a: 14, r: 2, dmg: 8, reach: 40, kb: 2.4, stun: 20, lvl: 'over', air: true, pose: ['jKick', 'jKick'], snd: 'kick', airMove: true },
  grab: { s: 4, a: 4, r: 20, dmg: 11, reach: 30, throwMove: true, lvl: 'throw', pose: ['grabW', 'grabS'], snd: 'kick', name: 'SUPLEX' },
};

let DIRT = { blood: true, difficulty: 'NORMAL' }; // set by the game from Settings

function makeFighter(id, side, isAI, alt) {
  const def = FIGHTERS[id];
  const pal = Object.assign({}, def.colors);
  if (alt) { pal.shirt = '#5a1826'; pal.shirtHi = '#7c2a3a'; pal.pants = '#3a2c1c'; pal.pantsHi = '#54422e'; }
  return {
    id, def, pal, side, isAI, x: 0, y: 0, vx: 0, vy: 0, facing: 1, state: 'idle', stateT: 0,
    hp: 100, shownHp: 100, meter: 0, wins: 0, flash: 0, invuln: 0, stun: 0, crouched: false,
    atk: null, cast: null, buff: null, crash: 0, raged: false, rageT: 0, powerUsed: false, starCd: 0,
    combo: 0, comboT: 0, juggle: 0, encore: 0, bounced: false, slowed: 0, paperT: 0,
    pose: POSE.idle0.slice(), poseTick: 0, frame: 0,
    tokens: [], inp: { left: false, right: false, up: false, down: false, block: false, p: false, k: false, cmd: null },
    ai: { t: 0, plan: 'wait', saw: false, sawT: 0, decide: false, blockT: 0, jumped: 0 },
  };
}

function resetFighter(f, x, facing) {
  Object.assign(f, {
    x, y: 0, vx: 0, vy: 0, facing, state: 'idle', stateT: 0, hp: 100, shownHp: 100, flash: 0, invuln: 0, stun: 0,
    crouched: false, atk: null, cast: null, buff: null, crash: 0, raged: false, rageT: 0, powerUsed: false, starCd: 0,
    combo: 0, comboT: 0, juggle: 0, encore: 0, bounced: false, slowed: 0, paperT: 0,
  });
  f.meter = Math.max(f.meter, 15);
  f.tokens.length = 0;
  f.pose = POSE.idle0.slice();
}

function newWorld(p1, p2, stage) {
  return {
    f: [p1, p2], stage, frame: 0, ents: [], parts: [], floats: [], shake: 0, flashT: 0, flashCol: '#fff',
    hitstop: 0, slow: 0, cine: 0, cineBy: null, cam: (WORLD_W - W) / 2, banner: null, bannerT: 0,
    locked: true, koBy: null, practice: false, crowd: 0, amps: [],
  };
}

function setBanner(w, str, frames, rows, scale) { w.banner = { str, rows: rows || ROWS_FIRE, scale: scale || 3 }; w.bannerT = frames; }

function floatText(w, x, y, str, col, scale) {
  w.floats.push({ x, y, str, col: col || '#fff', scale: scale || 1, life: 60, max: 60 });
}

function burst(w, x, y, kind, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = Math.random();
    let p = null;
    if (kind === 'blood') {
      if (!DIRT.blood) { kind = 'spark'; }
      else p = { vx: Math.cos(a) * sp * 3.4, vy: Math.sin(a) * sp * 3 - 1.6, g: 0.2, life: 26 + Math.random() * 16, col: Math.random() < 0.6 ? '#d8141a' : '#8a0a0e', size: 1 + (Math.random() * 2 | 0) };
    }
    if (kind === 'spark') p = { vx: Math.cos(a) * sp * 4, vy: Math.sin(a) * sp * 4, g: 0.05, life: 12 + Math.random() * 8, col: Math.random() < 0.5 ? '#ffe060' : '#ffffff', size: 1 };
    if (kind === 'dust') p = { vx: Math.cos(a) * sp * 2, vy: -Math.random() * 0.8, g: 0, life: 16 + Math.random() * 12, col: '#b0a890', size: 2 };
    if (kind === 'powder') p = { vx: Math.cos(a) * sp * 1.8, vy: Math.sin(a) * sp * 1.8 - 0.3, g: -0.01, life: 40 + Math.random() * 30, col: '#ffffff', size: 1 + (Math.random() * 2 | 0) };
    if (kind === 'fire') p = { vx: Math.cos(a) * sp * 6, vy: Math.sin(a) * sp * 6 - 1, g: -0.05, life: 22 + Math.random() * 26, col: ['#fff6b0', '#ffc21a', '#ff6a1a', '#e03a12'][Math.random() * 4 | 0], size: 2 + (Math.random() * 3 | 0) };
    if (kind === 'ecto') p = { vx: Math.cos(a) * sp * 5, vy: Math.sin(a) * sp * 5 - 1, g: 0.08, life: 30 + Math.random() * 30, col: Math.random() < 0.5 ? '#dff4ff' : '#ffd84a', size: 2 + (Math.random() * 2 | 0) };
    if (kind === 'gold') p = { vx: (Math.random() - 0.5) * 1.4, vy: -1 - Math.random() * 2.4, g: -0.02, life: 18 + Math.random() * 18, col: ['#fff6a0', '#ffd030', '#ffb010'][Math.random() * 3 | 0], size: 1 + (Math.random() * 3 | 0) };
    if (kind === 'paper') p = { vx: Math.cos(a) * sp * 3, vy: -Math.random() * 3, g: 0.08, life: 40 + Math.random() * 30, col: '#fbfbf0', size: 3 };
    if (kind === 'food') p = { vx: Math.cos(a) * sp * 2.4, vy: -Math.random() * 3, g: 0.14, life: 30, col: Math.random() < 0.5 ? '#ffb060' : '#ffe9a0', size: 2 };
    if (!p) continue;
    p.x = x; p.y = y; p.max = p.life;
    w.parts.push(p);
  }
}

// ---- Numbers ----
const RAGE = { dmg: 1.5, taken: 0.68 };

function dmgMult(f) {
  let m = f.def.might;
  if (f.buff) m *= f.buff.dmg;
  if (f.raged) m *= RAGE.dmg;
  if (f.isAI) m *= DIFFICULTY[DIRT.difficulty].dmg;
  return m;
}
function takenMult(f) {
  let m = f.def.defense;
  if (f.buff) m *= f.buff.taken;
  if (f.raged) m *= RAGE.taken;
  return m;
}
function moveMult(f) {
  let m = 1;
  if (f.buff) m *= f.buff.speed;
  if (f.crash > 0) m *= 0.6;
  if (f.raged) m *= 1.2;
  if (f.slowed > 0) m *= 0.65;
  return m;
}
function atkSpeed(f) {
  let m = 1;
  if (f.buff) m *= f.buff.atk;
  if (f.raged) m *= 1.15;
  return m;
}

function grounded(f) { return f.y >= 0; }

function isBlocking(tar, lvl) {
  if (tar.state !== 'block') return false;
  if (lvl === 'throw') return false;
  if (lvl === 'low') return tar.crouched;
  if (lvl === 'over') return !tar.crouched;
  return true;
}

// Everything that hurts goes through here. Returns 'hit', 'block' or 'miss'.
function hitFighter(w, att, tar, base, o = {}) {
  if (w.koBy || tar.invuln > 0 || tar.state === 'rage' || tar.state === 'ko') return 'miss';
  if (tar.state === 'knock' && tar.juggle >= 3) return 'miss';
  const blocked = !o.unblockable && isBlocking(tar, o.lvl || 'mid');
  let dmg = base * dmgMult(att) * takenMult(tar);
  const vs = o.vs && o.vs[tar.id];
  if (vs) dmg *= vs;
  const dir = Math.sign(tar.x - (o.from !== undefined ? o.from : att.x)) || att.facing;
  const hx = o.hx !== undefined ? o.hx : tar.x, hy = o.hy !== undefined ? o.hy : GROUND + tar.y - tar.def.height * 0.72;

  if (blocked) {
    dmg *= o.chip !== undefined ? o.chip : 0;
    tar.hp -= dmg;
    tar.stun = Math.max(tar.stun, o.blockStun || 12);
    tar.vx = dir * (o.kb || 2) * 0.8;
    att.meter = Math.min(100, att.meter + 2);
    tar.meter = Math.min(100, tar.meter + 3);
    burst(w, hx, hy, 'spark', 6);
    Sound.sfx('block');
    w.hitstop = Math.max(w.hitstop, 3);
    checkHealth(w, att, tar);
    return 'block';
  }

  const wasHurt = tar.state === 'hit' || tar.state === 'knock' || tar.state === 'dazed';
  att.combo = wasHurt && att.comboT > 0 ? att.combo + 1 : 1;
  att.comboT = 70;
  if (att.combo >= 2) floatText(w, tar.x, GROUND + tar.y - tar.def.height - 14, att.combo + ' HITS!', '#ffe060', att.combo >= 4 ? 2 : 1);

  tar.hp -= dmg;
  tar.flash = 8;
  att.meter = Math.min(100, att.meter + dmg * 1.4 + 1);
  tar.meter = Math.min(100, tar.meter + dmg * 1.1);
  burst(w, hx, hy, 'blood', Math.min(26, 5 + Math.round(dmg)));
  burst(w, hx, hy, 'spark', 4);
  Sound.sfx(o.snd || 'punch');
  w.hitstop = Math.max(w.hitstop, dmg > 14 ? 10 : dmg > 7 ? 6 : 4);
  w.shake = Math.max(w.shake, Math.min(12, dmg * 0.7));
  if (vs) {
    floatText(w, tar.x, GROUND + tar.y - tar.def.height - 28, o.vsText || 'SUPER EFFECTIVE!', '#ff5a4a', 2);
  } else if (o.float) {
    floatText(w, tar.x, GROUND + tar.y - tar.def.height - 24, o.float, '#fff', 1);
  }

  // a raging Bill shrugs off the small stuff while he's swinging
  const armoured = tar.raged && tar.state === 'attack' && !o.knock && dmg < 10;
  const dead = checkHealth(w, att, tar);
  if (dead === 'rage' || armoured) return 'hit';
  if (o.papered && !dead) {
    tar.state = 'dazed'; tar.stateT = 0; tar.stun = o.papered; tar.paperT = o.papered;
    tar.atk = null; tar.cast = null; tar.vx = dir * 0.6;
    return 'hit';
  }
  if (o.knock || dead || tar.y < 0) {
    tar.state = 'knock'; tar.stateT = 0; tar.atk = null; tar.cast = null;
    tar.vx = dir * (o.kb || 3);
    tar.vy = -(o.up !== undefined ? o.up : 5.4);
    tar.y = Math.min(tar.y, -1);
    tar.bounced = false;
    tar.juggle++;
  } else {
    tar.state = 'hit'; tar.stateT = 0; tar.stun = o.stun || 14; tar.atk = null; tar.cast = null;
    tar.vx = dir * (o.kb || 2);
    tar.hitLow = o.lvl === 'low';
  }
  return 'hit';
}

// Handles Willy Rage and being killed. Returns 'rage', true when dead, or false.
function checkHealth(w, att, tar) {
  if (tar.def.id === 'bill' && !tar.raged && tar.hp <= 30 && !w.practiceNoRage) {
    if (tar.hp < 1) tar.hp = 1;
    startRage(w, tar);
    return 'rage';
  }
  if (tar.hp <= 0) {
    tar.hp = 0;
    if (w.practice) { tar.hp = 100; return false; }
    w.koBy = att;
    w.slow = 90;
    w.flashT = 8; w.flashCol = '#fff';
    Sound.sfx('ko');
    Sound.say('K O');
    setBanner(w, 'K.O.', 110, ROWS_BLOOD, 6);
    return true;
  }
  return false;
}

// Under 30% health Wild Bill goes Super Saiyan: the fight stops while he rages up.
function startRage(w, f) {
  f.raged = true;
  f.state = 'rage'; f.stateT = 0; f.rageT = 110; f.atk = null; f.cast = null; f.vx = 0; f.vy = 0; f.y = 0;
  w.cine = 110; w.cineBy = f;
  w.flashT = 8; w.flashCol = '#ffe060';
  setBanner(w, 'WILLY RAGE!', 110, ROWS_GOLD, 4);
  Sound.sfx('rage');
  Sound.say('Willy Rage!');
}

// ---- Specials ----
function trySpecial(w, f, id, opp) {
  const sp = SPECIALS[id];
  if (id === 'poster' && f.starCd > 0) return false;
  if (id === 'power' && f.powerUsed) {
    floatText(w, f.x, GROUND + f.y - f.def.height - 12, 'ALREADY USED', '#aaa');
    Sound.sfx('buzz');
    return false;
  }
  const encore = id === 'guitar' && f.encore > 0;
  if (!encore && f.meter < sp.cost) {
    floatText(w, f.x, GROUND + f.y - f.def.height - 12, 'NOT ENOUGH METAL!', '#ffb0a0');
    Sound.sfx('buzz');
    return false;
  }
  if (!encore) f.meter -= sp.cost;
  f.atk = null;
  f.vx = 0;
  f.crouched = false;
  f.state = 'cast'; f.stateT = 0;
  const say = (t, c, s) => floatText(w, f.x, GROUND + f.y - f.def.height - 16, t, c, s);
  if (id === 'poster') {
    f.cast = { id, total: 24, fire: 9, poseA: 'toss', poseB: 'tossS' };
    f.starCd = 48;
  } else if (id === 'law') {
    f.cast = { id, total: 32, fire: 14, poseA: 'toss', poseB: 'tossS' };
    say('CZECH LEGISLATION!', '#fbfbf0');
  } else if (id === 'lenka') {
    f.cast = { id, total: 42, fire: 22, poseA: 'summon', poseB: 'summon' };
    say('AHOJ, LENKA!', '#ffd84a', 2);
    Sound.say('Lenka!');
    Sound.sfx('ghost');
  } else if (id === 'power') {
    const pu = POWER_UPS[f.def.power];
    f.powerUsed = true;
    f.cast = { id, total: 58, fire: 40, poseA: 'drink', poseB: 'flex', pu };
    setBanner(w, pu.name + '!', 60, null, pu.name.length > 8 ? 2 : 3);
    Sound.sfx(pu.sound);
    Sound.say(pu.say);
  } else if (id === 'dive') {
    f.state = 'dive'; f.cast = { id, phase: 0, t: 0, tx: 0 };
    f.invuln = 26;
    w.amps.push({ x: f.x - f.facing * 16, t: 0, life: 110 });
    w.crowd = 120;
    Sound.sfx('roar');
    say('STAGE DIVE!', '#ffd030', 2);
  } else if (id === 'guitar') {
    f.cast = { id, total: 62, fire: 34, encore };
    if (encore) {
      f.encore = 0;
      setBanner(w, 'HEAVY METAL COMBO!', 80, ROWS_FIRE, 2);
      Sound.say('Heavy metal combo!');
    } else {
      say('GUITAR!', '#ff5a4a', 2);
    }
    Sound.sfx('chord');
  }
  return true;
}

function fireCast(w, f, opp) {
  const c = f.cast, handY = GROUND + f.y - f.def.height * 0.72;
  if (c.id === 'poster') {
    w.ents.push({ type: 'star', owner: f, x: f.x + f.facing * 18, y: handY, vx: f.facing * 5.6, spin: 0, life: 110 });
    Sound.sfx('star');
  } else if (c.id === 'law') {
    Sound.sfx('paper');
    for (let i = 0; i < 5; i++) {
      w.ents.push({ type: 'paper', owner: f, x: f.x + f.facing * 16, y: handY - 16 + i * 10, vx: f.facing * (4 + i * 0.25), vy: (i - 2) * 0.16, spin: i, life: 120, first: i === 2 });
    }
  } else if (c.id === 'lenka') {
    w.ents.push({ type: 'lenka', owner: f, x: f.x + f.facing * 36, y: GROUND - 60, t: 0, life: 300, face: f.facing });
    burst(w, f.x + f.facing * 36, GROUND - 60, 'ecto', 24);
  } else if (c.id === 'power') {
    const pu = c.pu;
    f.buff = { dmg: pu.dmg, taken: pu.taken, speed: pu.speed, atk: pu.atk, time: pu.frames, max: pu.frames, id: f.def.power, col: pu.col, sway: pu.sway, crash: pu.crash || 0 };
    f.hp = Math.min(100, f.hp + pu.heal);
    if (pu.heal) floatText(w, f.x, GROUND + f.y - f.def.height - 18, '+' + pu.heal + ' HEALTH', '#7cff7c', 1);
    burst(w, f.x, GROUND + f.y - f.def.height, f.def.power === 'cocaine' ? 'powder' : 'food', 30);
    if (f.def.power === 'cocaine') { w.shake = 5; w.flashT = 4; w.flashCol = '#fff'; }
  } else if (c.id === 'guitar') {
    const heavy = c.encore;
    w.ents.push({ type: 'blast', owner: f, x: f.x + f.facing * 26, vx: f.facing * (heavy ? 6.6 : 5.2), life: 90, heavy, r: 8 });
    w.shake = heavy ? 14 : 9;
    w.flashT = heavy ? 6 : 3;
    w.flashCol = '#ffd8a0';
    burst(w, f.x + f.facing * 26, GROUND - 40, 'fire', heavy ? 50 : 24);
  }
}

function explodeLenka(w, e, opp) {
  const f = e.owner;
  e.dead = true;
  Sound.sfx('boom');
  w.shake = 16; w.flashT = 8; w.flashCol = '#fff6d0';
  burst(w, e.x, e.y, 'fire', 70);
  burst(w, e.x, e.y, 'ecto', 40);
  w.ents.push({ type: 'ring', x: e.x, y: e.y, r: 8, life: 30 });
  floatText(w, e.x, e.y - 56, 'NA SHLEDANOU!', '#ffd84a', 2);
  if (Math.abs(opp.x - e.x) < 72 && GROUND + opp.y > e.y - 60) {
    const isKiwi = opp.id === 'kiwi';
    const r = hitFighter(w, f, opp, 14, {
      hx: opp.x, hy: GROUND + opp.y - 50, from: e.x, knock: true, kb: 5, up: 8, chip: 0.25,
      unblockable: isKiwi, snd: 'kick', vs: { kiwi: 3 }, vsText: 'LENKA SELF-DESTRUCTS!',
    });
    if (r === 'hit' && isKiwi) opp.slowed = 240;
  }
}

// ---- Fighter update ----
function setState(f, s) { if (f.state !== s) { f.state = s; f.stateT = 0; } }

function pressDir(f, dirKey) {
  // Called the moment a direction is pressed. Remembered relative to the way the fighter faces.
  let t = dirKey;
  if (dirKey === 'left') t = f.facing > 0 ? 'B' : 'F';
  if (dirKey === 'right') t = f.facing > 0 ? 'F' : 'B';
  if (dirKey === 'up') t = 'U';
  if (dirKey === 'down') t = 'D';
  f.tokens.push({ d: t, at: performanceFrame() });
  if (f.tokens.length > 8) f.tokens.shift();
}
let frameCounter = 0;
function performanceFrame() { return frameCounter; }

function matchCommand(f, btn) {
  const recent = f.tokens.filter((t) => frameCounter - t.at <= 36);
  for (const id in SPECIALS) {
    const sp = SPECIALS[id];
    if (sp.btn !== btn) continue;
    const n = sp.seq.length;
    if (recent.length < n) continue;
    let ok = true;
    for (let i = 0; i < n; i++) if (recent[recent.length - n + i].d !== sp.seq[i]) ok = false;
    if (ok) return id;
  }
  return null;
}

function startMove(w, f, id) {
  f.atk = Object.assign({ id, t: 0, did: false, landed: false }, MOVES[id]);
  f.state = 'attack'; f.stateT = 0;
  if (MOVES[id].whoosh) Sound.sfx('whoosh');
}

function canAct(f) { return f.state === 'idle' || f.state === 'walk' || f.state === 'crouch' || f.state === 'block' && f.stun <= 0; }

function handleButtons(w, f, o) {
  const inp = f.inp;
  const dirF = f.facing > 0 ? inp.right : inp.left;

  // commands first: from a standing start or cancelling a move that connected
  const ready = canAct(f) || (f.state === 'attack' && f.atk && f.atk.landed && !f.atk.airMove);
  if (ready && grounded(f)) {
    let cmd = inp.cmd;
    if (!cmd && inp.p) cmd = matchCommand(f, 'p');
    if (!cmd && inp.k) cmd = matchCommand(f, 'k');
    if (cmd) {
      if (trySpecial(w, f, cmd, o)) { f.tokens.length = 0; return; }
      if (inp.cmd) return;
    }
  }
  if (!inp.p && !inp.k) return;

  // chains: punch, punch, kick
  if (f.state === 'attack' && f.atk && f.atk.landed && f.atk.next && f.atk.t >= f.atk.s + f.atk.a) {
    if ((f.atk.nextBtn === 'p' && inp.p) || (f.atk.nextBtn === 'k' && inp.k)) {
      startMove(w, f, f.atk.next);
      return;
    }
  }
  if (f.state === 'jump') {
    if (inp.p && !f.usedAir) { startMove(w, f, 'jpunch'); f.usedAir = true; }
    else if (inp.k && !f.usedAir) { startMove(w, f, 'jkick'); f.usedAir = true; }
    return;
  }
  if (!canAct(f)) return;
  if (inp.block && inp.p && Math.abs(o.x - f.x) < MOVES.grab.reach * f.def.reach + o.def.hw && grounded(o) && o.state !== 'down' && o.state !== 'getup') {
    startMove(w, f, 'grab');
    return;
  }
  if (inp.p) {
    if (inp.down) startMove(w, f, 'upper');
    else if (dirF) startMove(w, f, 'butt');
    else startMove(w, f, 'jab');
  } else if (inp.k) {
    if (inp.down) startMove(w, f, 'sweep');
    else startMove(w, f, 'kick');
  }
}

function updateAttack(w, f, o) {
  const a = f.atk;
  const before = a.t;
  a.t += atkSpeed(f);
  if (a.lunge && before < a.s && a.t >= a.s) f.vx = f.facing * a.lunge * 1.6;
  if (!a.did && a.t >= a.s && a.t < a.s + a.a) {
    const reach = a.reach * f.def.reach + o.def.hw;
    const dx = (o.x - f.x) * f.facing;
    const inFront = dx > -8 && dx < reach;
    const heightOk = Math.abs(f.y - o.y) < (a.airMove ? 92 : 60) || (a.air && f.y - o.y < 90);
    const lowMiss = a.lvl === 'low' && o.y < -4;
    if (inFront && heightOk && !lowMiss) {
      if (a.throwMove) {
        if (o.y >= 0 && o.invuln <= 0) {
          a.did = true; a.landed = true;
          const r = hitFighter(w, f, o, a.dmg, { lvl: 'throw', knock: true, kb: -4, up: 7, snd: 'kick', float: a.name, from: f.x - f.facing });
          if (r === 'hit') o.x = f.x - f.facing * 26;
        }
      } else {
        a.did = true;
        const r = hitFighter(w, f, o, a.dmg, {
          lvl: a.lvl, kb: a.kb, stun: a.stun, knock: a.knock, up: a.up, snd: a.snd, float: a.float || a.name,
          hx: o.x - f.facing * o.def.hw * 0.4,
        });
        if (r !== 'miss') a.landed = true;
      }
    }
  }
  const total = a.s + a.a + a.r;
  if (a.t >= total) {
    if (a.airMove) { setState(f, f.y < 0 ? 'jump' : 'idle'); f.atk = null; }
    else { f.atk = null; f.state = 'idle'; f.stateT = 0; }
  }
}

function updateCast(w, f, o) {
  const c = f.cast;
  if (f.stateT === c.fire) fireCast(w, f, o);
  if (f.stateT >= c.total) { f.cast = null; setState(f, 'idle'); }
}

function updateDive(w, f, o) {
  const c = f.cast;
  c.t++;
  if (c.phase === 0) {
    // climb the amps
    f.vx = 0;
    if (c.t >= 24) {
      c.phase = 1; c.t = 0;
      const dist = o.x - f.x;
      const flight = 42;
      f.vy = -10.4;
      f.vx = dist / flight;
      f.y = -1;
      Sound.sfx('whoosh');
    }
  } else if (c.phase === 1) {
    f.invuln = 0;
    if (f.y >= -1 && c.t > 4) {
      c.phase = 2; c.t = 0; f.y = 0; f.vy = 0; f.vx = 0;
      Sound.sfx('land');
      burst(w, f.x, GROUND, 'dust', 30);
      w.shake = 10;
      w.crowd = Math.max(w.crowd, 40);
      if (Math.abs(o.x - f.x) < 50 + o.def.hw && o.y > -44) {
        const r = hitFighter(w, f, o, 14, { lvl: 'over', knock: true, kb: 3.4, up: 6, chip: 0.2, snd: 'kick' });
        if (r === 'hit') {
          f.encore = 170;
          floatText(w, f.x, GROUND - f.def.height - 20, 'ENCORE! GUITAR NOW!', '#ffd030', 1);
        }
      }
    }
  } else if (c.t >= 24) {
    f.cast = null; setState(f, 'idle');
    f.invuln = 6;
  }
}

function updateFighter(w, f, o) {
  f.frame++; f.stateT++;
  if (f.flash > 0) f.flash--;
  if (f.invuln > 0) f.invuln--;
  if (f.starCd > 0) f.starCd--;
  if (f.encore > 0) f.encore--;
  if (f.slowed > 0) f.slowed--;
  if (f.crash > 0) f.crash--;
  if (f.comboT > 0) { f.comboT--; if (f.comboT === 0) f.combo = 0; }
  if (f.buff) {
    f.buff.time--;
    if (f.def.power === 'cocaine') {
      f.meter = Math.min(100, f.meter + 0.06);
      if (f.frame % 8 === 0) burst(w, f.x, GROUND + f.y - f.def.height, 'powder', 1);
    }
    if (f.buff.sway && grounded(f) && (f.state === 'idle' || f.state === 'walk')) f.x += Math.sin(f.frame * 0.07) * 0.5;
    if (f.buff.time <= 0) {
      if (f.buff.crash) {
        f.crash = f.buff.crash;
        floatText(w, f.x, GROUND - f.def.height - 12, 'THE CRASH...', '#a0b0c8');
      }
      f.buff = null;
    }
  }
  if (f.raged && f.frame % 2 === 0) burst(w, f.x + (Math.random() - 0.5) * 34, GROUND + f.y - Math.random() * f.def.height, 'gold', 1);

  const locked = w.locked || w.koBy;
  if (locked) {
    f.inp.p = f.inp.k = false; f.inp.cmd = null;
    f.inp.left = f.inp.right = f.inp.up = f.inp.down = f.inp.block = false;
  }

  if (grounded(f) && (f.state === 'idle' || f.state === 'walk' || f.state === 'crouch' || f.state === 'block')) {
    f.facing = o.x >= f.x ? 1 : -1;
  }

  const inp = f.inp;
  const speed = f.def.speed * moveMult(f);

  handleButtons(w, f, o);

  switch (f.state) {
    case 'idle': case 'walk': case 'crouch': case 'block': {
      f.crouched = inp.down;
      if (f.state === 'block' && f.stun > 0) {
        f.stun--;
        f.vx *= 0.8;
        break;
      }
      if (inp.block) { setState(f, 'block'); f.vx *= 0.7; break; }
      if (inp.down) { setState(f, 'crouch'); f.vx *= 0.7; break; }
      if (inp.up) {
        f.state = 'jump'; f.stateT = 0; f.usedAir = false; f.crouched = false;
        f.vy = -f.def.jump;
        f.vx = (inp.right ? 1 : inp.left ? -1 : 0) * Math.max(2.5, speed * 1.2);
        f.y = -1;
        Sound.sfx('whoosh');
        break;
      }
      if (inp.left || inp.right) {
        const d = inp.right ? 1 : -1;
        const back = d !== f.facing;
        f.vx = d * speed * (back ? 0.82 : 1);
        setState(f, 'walk');
        f.walkBack = back;
      } else {
        f.vx = 0;
        setState(f, 'idle');
      }
      break;
    }
    case 'jump':
      f.crouched = false;
      break;
    case 'attack':
      f.crouched = !!(f.atk && (f.atk.id === 'sweep' || f.atk.id === 'upper') && f.atk.t < f.atk.s);
      if (f.atk) updateAttack(w, f, o);
      if (!f.atk && f.state === 'attack') f.state = 'idle';
      break;
    case 'cast':
      if (f.cast) updateCast(w, f, o); else f.state = 'idle';
      break;
    case 'dive':
      updateDive(w, f, o);
      break;
    case 'hit':
      f.stun--;
      f.vx *= 0.86;
      if (f.stun <= 0) setState(f, 'idle');
      break;
    case 'dazed':
      f.stun--;
      f.vx *= 0.8;
      if (f.frame % 18 === 0) burst(w, f.x, GROUND + f.y - f.def.height, 'paper', 1);
      if (f.stun <= 0) setState(f, 'idle');
      break;
    case 'rage':
      f.rageT--;
      f.vx = 0;
      // he heals as he rages up: this is the "high health" part
      if (f.stateT % 3 === 0 && f.stateT > 8) f.hp = Math.min(100, f.hp + 1);
      burst(w, f.x + (Math.random() - 0.5) * 44, GROUND - Math.random() * 16, 'gold', 3);
      if (f.stateT === 70) { w.flashT = 6; w.flashCol = '#fff0a0'; w.shake = 14; Sound.sfx('boom'); }
      if (f.rageT <= 0) setState(f, 'idle');
      break;
    case 'knock':
      break;
    case 'down':
      f.vx *= 0.8;
      if (f.stateT > 30) {
        f.state = 'getup'; f.stateT = 0; f.invuln = 22; f.juggle = 0;
      }
      break;
    case 'getup':
      if (f.stateT > 16) setState(f, 'idle');
      break;
    case 'ko':
      f.vx *= 0.85;
      break;
    case 'win': case 'lose':
      f.vx = 0;
      break;
  }

  // physics
  const flying = f.state === 'dive' && f.cast && f.cast.phase === 1;
  f.x += f.vx;
  if (f.y < 0 || f.vy < 0) {
    f.y += f.vy;
    f.vy += flying ? 0.5 : 0.42;
    if (f.y >= 0) {
      f.y = 0; f.vy = 0;
      if (f.state === 'jump') {
        setState(f, 'idle'); f.vx = 0;
        burst(w, f.x, GROUND, 'dust', 6);
        Sound.sfx('land');
      } else if (f.state === 'attack' && f.atk && f.atk.airMove) {
        f.atk = null; setState(f, 'idle'); f.vx = 0;
        Sound.sfx('land');
      } else if (f.state === 'knock') {
        burst(w, f.x, GROUND, 'dust', 14);
        Sound.sfx('land');
        w.shake = Math.max(w.shake, 4);
        if (!f.bounced && Math.abs(f.vx) + 2 > 3) {
          f.bounced = true; f.vy = -3; f.y = -1; f.vx *= 0.6;
        } else if (f.hp <= 0) {
          setState(f, 'ko');
        } else {
          setState(f, 'down');
          f.invuln = 46;
        }
      }
    }
  } else if (f.state !== 'walk' && f.state !== 'knock') {
    f.vx *= 0.8;
  }
  if (f.state === 'knock' && f.y >= 0 && f.vy === 0) {
    // knocked on the ground with no bounce left
    setState(f, f.hp <= 0 ? 'ko' : 'down');
    if (f.hp > 0) f.invuln = 46;
  }
}

function updatePose(f) {
  f.poseTick++;
  const target = targetPose(f);
  const k = f.state === 'hit' || f.state === 'knock' || f.state === 'attack' ? 0.75 : 0.45;
  // the picture only changes every other tick, which gives the stepped sprite feel
  if (f.poseTick % 2 === 0) {
    for (let i = 0; i < 11; i++) f.pose[i] += (target[i] - f.pose[i]) * k;
    f.pose[10] = target[10];
  }
}

function targetPose(f) {
  const t = f.stateT;
  switch (f.state) {
    case 'idle': return Math.floor(f.frame / 18) % 2 ? POSE.idle1 : POSE.idle0;
    case 'walk': {
      const i = Math.floor(f.frame / (8 / Math.min(1.8, moveMult(f)))) % 4;
      return POSE['walk' + (f.walkBack ? 3 - i : i)];
    }
    case 'crouch': return POSE.crouch;
    case 'block': return f.crouched ? POSE.cblock : POSE.block;
    case 'jump': return f.vy < 0 ? POSE.jumpUp : POSE.jumpDown;
    case 'attack': {
      const a = f.atk;
      if (!a) return POSE.idle0;
      if (a.t < a.s) return POSE[a.pose[0]];
      if (a.t < a.s + a.a + 2) return POSE[a.pose[1]];
      return a.airMove ? POSE[a.pose[1]] : POSE.idle0;
    }
    case 'cast': {
      const c = f.cast;
      if (!c) return POSE.idle0;
      if (c.id === 'guitar') {
        if (t < 14) return POSE.guitarHold;
        if (t < c.fire) return POSE.guitarWind;
        return Math.floor(t / 4) % 2 ? POSE.guitarHit : POSE.guitarHold;
      }
      return t < c.fire ? POSE[c.poseA] : POSE[c.poseB];
    }
    case 'dive': {
      const c = f.cast;
      if (c.phase === 0) return POSE.summon;
      if (c.phase === 1) return f.vy < 1 ? POSE.diveUp : POSE.diveFlop;
      return POSE.down;
    }
    case 'hit': return f.hitLow ? POSE.hitLow : POSE.hitHigh;
    case 'dazed': return POSE.dazed;
    case 'rage': return Math.floor(t / 10) % 2 ? POSE.rage1 : POSE.rage0;
    case 'knock': return POSE.knock;
    case 'down': case 'ko': return POSE.down;
    case 'getup': return POSE.getup;
    case 'win': return Math.floor(t / 14) % 2 ? POSE.win1 : POSE.win0;
    case 'lose': return POSE.lose;
  }
  return POSE.idle0;
}

// ---- Projectiles and the like ----
function inHurtbox(tar, x, y, rx) {
  if (tar.invuln > 0 || tar.state === 'rage' || tar.state === 'ko') return false;
  const footY = GROUND + tar.y;
  const topY = footY - (tar.crouched ? tar.def.height * 0.56 : tar.def.height);
  return Math.abs(tar.x - x) < rx + tar.def.hw && y > topY && y < footY;
}

function updateEnts(w) {
  const [p1, p2] = w.f;
  for (const e of w.ents) {
    e.life--;
    if (e.life <= 0 && e.type !== 'lenka') e.dead = true;
    const opp = e.owner ? (e.owner === p1 ? p2 : p1) : null;
    switch (e.type) {
      case 'star':
        e.x += e.vx; e.spin += 0.55;
        if (inHurtbox(opp, e.x, e.y, 8)) {
          const r = hitFighter(w, e.owner, opp, 5, {
            hx: e.x, hy: e.y, from: e.x - e.vx, kb: 2.2, stun: 18, chip: 0.2, snd: 'punch',
            vs: { baldric: 2.5 }, vsText: 'IO POSTER!', float: 'IO POSTER',
          });
          if (r !== 'miss') e.dead = true;
        }
        break;
      case 'paper':
        e.x += e.vx; e.y += e.vy + Math.sin(e.life * 0.3) * 0.5; e.spin += 0.2;
        if (inHurtbox(opp, e.x, e.y, 6)) {
          const isKiwi = opp.id === 'kiwi';
          const r = hitFighter(w, e.owner, opp, 2, {
            hx: e.x, hy: e.y, from: e.x - e.vx, kb: 0.8, stun: 16, chip: 0.25, snd: 'stamp',
            vs: { kiwi: 3 }, vsText: ['§ 312 BREACH!', 'STAMPED!', 'SUBSECTION B!', 'NOTARISED!', 'FILE IN TRIPLICATE!'][Math.random() * 5 | 0],
            papered: isKiwi && opp.state !== 'dazed' ? 70 : 0,
          });
          if (r !== 'miss') { e.dead = true; burst(w, e.x, e.y, 'paper', 3); }
        }
        break;
      case 'lenka': {
        e.t++;
        const d = opp.x - e.x;
        e.face = d >= 0 ? 1 : -1;
        e.x += Math.sign(d) * Math.min(Math.abs(d), 1.9);
        const wantY = GROUND + opp.y - 60;
        e.y += (wantY - e.y) * 0.05 + Math.sin(e.t * 0.1) * 0.5;
        if (e.t % 40 === 0) floatText(w, e.x, e.y - 48, ['AHOJ!', 'POJD SEM!', 'KIWI!', 'PIVO?'][(e.t / 40) % 4], '#ffd84a');
        if (e.t > 18 && (Math.abs(d) < 26 + opp.def.hw || e.life <= 0)) explodeLenka(w, e, opp);
        break;
      }
      case 'blast':
        e.x += e.vx; e.r += 1.4;
        if (w.frame % 2 === 0) burst(w, e.x, GROUND - 2, 'fire', e.heavy ? 5 : 3);
        if (!e.hit && Math.abs(opp.x - e.x) < 16 + opp.def.hw && opp.y > -46 && opp.invuln <= 0 && opp.state !== 'rage') {
          e.hit = true;
          hitFighter(w, e.owner, opp, e.heavy ? 26 : 18, {
            hx: opp.x, hy: GROUND + opp.y - 40, from: e.x - e.vx, knock: true, kb: 5, up: 7.6,
            chip: 0.22, unblockable: e.heavy, snd: 'kick', float: e.heavy ? 'FACE MELTED!' : 'SHREDDED!',
          });
          e.life = Math.min(e.life, 8);
        }
        if (e.x < -40 || e.x > WORLD_W + 40) e.dead = true;
        break;
      case 'ring':
        e.r += 5;
        break;
    }
  }
  w.ents = w.ents.filter((e) => !e.dead);
  for (const a of w.amps) { a.t++; }
  w.amps = w.amps.filter((a) => a.t < a.life);
  if (w.crowd > 0) w.crowd--;
}

function updateParticles(w) {
  for (const p of w.parts) {
    p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life--;
    if (p.y > GROUND + 8 && p.g > 0) { p.y = GROUND + 8; p.vx = 0; p.vy = 0; p.g = 0; }
  }
  w.parts = w.parts.filter((p) => p.life > 0);
  if (w.parts.length > 500) w.parts.splice(0, w.parts.length - 500);
  for (const t of w.floats) { t.life--; t.y -= 0.35; }
  w.floats = w.floats.filter((t) => t.life > 0);
}

// One tick of the world.
function stepWorld(w) {
  frameCounter++;
  w.frame++;
  const [a, b] = w.f;
  if (w.bannerT > 0) { w.bannerT--; if (w.bannerT === 0) w.banner = null; }
  if (w.flashT > 0) w.flashT--;
  if (w.shake > 0) w.shake = Math.max(0, w.shake - 0.6);
  for (const f of w.f) f.shownHp += (f.hp - f.shownHp) * (f.hp < f.shownHp ? 0.05 : 0.2);
  updateParticles(w);

  if (w.cine > 0) {
    // the world holds still while Bill rages up
    w.cine--;
    const f = w.cineBy, o = f === a ? b : a;
    updateFighter(w, f, o);
    updatePose(f);
    return;
  }
  if (w.hitstop > 0) { w.hitstop--; return; }
  if (w.slow > 0) {
    w.slow--;
    if (w.slow % 3) return;
  }

  if (!w.locked && !w.koBy) {
    for (const f of w.f) if (f.isAI) aiThink(w, f, f === a ? b : a);
  }
  updateFighter(w, a, b);
  updateFighter(w, b, a);
  for (const f of w.f) { f.inp.p = f.inp.k = false; f.inp.cmd = null; }
  updatePose(a); updatePose(b);
  updateEnts(w);

  // push apart, keep on the stage and in shot
  const standing = (f) => f.state !== 'knock' && f.state !== 'down' && f.state !== 'ko' && f.state !== 'dive';
  if (standing(a) && standing(b) && Math.abs(a.y - b.y) < 50) {
    const need = a.def.hw + b.def.hw + 4, dx = b.x - a.x;
    if (Math.abs(dx) < need) {
      const push = (need - Math.abs(dx)) / 2, s = dx >= 0 ? 1 : -1;
      a.x -= s * push; b.x += s * push;
    }
  }
  for (const f of w.f) f.x = Math.max(22, Math.min(WORLD_W - 22, f.x));
  const gap = b.x - a.x, maxGap = W - 56;
  if (Math.abs(gap) > maxGap) {
    const over = (Math.abs(gap) - maxGap) / 2, s = Math.sign(gap);
    a.x += s * over; b.x -= s * over;
  }
  const mid = (a.x + b.x) / 2 - W / 2;
  const camTarget = Math.max(0, Math.min(WORLD_W - W, mid));
  w.cam += (camTarget - w.cam) * 0.12;
}

// ---- The computer opponent ----
function aiThink(w, f, o) {
  const D = DIFFICULTY[DIRT.difficulty], A = f.ai, inp = f.inp;
  const dist = Math.abs(o.x - f.x);
  const toRight = o.x > f.x;
  inp.left = inp.right = inp.up = inp.down = false;
  inp.block = false;
  inp.p = inp.k = false;
  inp.cmd = null;

  if (w.aiOff) return;

  // what's coming?
  let threat = null;
  if (o.state === 'attack' && o.atk && o.atk.t < o.atk.s + o.atk.a && dist < o.atk.reach * o.def.reach + f.def.hw + 14) threat = o.atk.lvl;
  if (o.state === 'dive' && o.cast.phase === 1 && dist < 90) threat = 'over';
  for (const e of w.ents) {
    if (e.owner !== o) continue;
    const near = Math.abs(e.x - f.x);
    if (e.type === 'blast' && near < 70) threat = 'blast';
    if (e.type === 'star' && near < 70) threat = 'star';
    if (e.type === 'paper' && near < 60) threat = 'mid';
    if (e.type === 'lenka' && near < 60) threat = 'lenka';
  }
  if (threat && !A.saw) { A.saw = true; A.sawT = D.react; A.decide = Math.random() < D.block; }
  if (!threat) A.saw = false;

  if (A.saw && A.decide) {
    if (A.sawT > 0) A.sawT--;
    else {
      if (threat === 'blast') { if (f.state === 'idle' || f.state === 'walk') inp.up = true; }
      else if (threat === 'star') { inp.down = true; if (Math.random() < 0.3) inp.block = true; }
      else if (threat === 'low') { inp.down = true; inp.block = true; }
      else if (threat === 'lenka') {
        // run from her (she's slower than everyone)
        if (toRight) inp.left = true; else inp.right = true;
      } else { inp.block = true; }
      return;
    }
  }

  // follow a connected move with the next link
  if (f.state === 'attack' && f.atk && f.atk.landed && f.atk.next && Math.random() < D.combo) {
    if (f.atk.t >= f.atk.s + f.atk.a) {
      if (f.atk.nextBtn === 'p') inp.p = true; else inp.k = true;
    }
    return;
  }
  // dive then guitar: the heavy metal combo
  if (f.encore > 0 && f.encore < 120 && (f.state === 'idle' || f.state === 'walk') && Math.random() < 0.5 + D.combo * 0.4) {
    inp.cmd = 'guitar';
    return;
  }

  A.t--;
  if (A.t <= 0) {
    A.t = D.think * (0.5 + Math.random());
    const r = Math.random();
    const reach = 40 * f.def.reach + o.def.hw;
    if (Math.random() < D.special && f.state !== 'cast') {
      const cmd = aiChooseSpecial(w, f, o, dist);
      if (cmd) { inp.cmd = cmd; A.plan = 'wait'; return; }
    }
    if (dist > reach + 90) A.plan = r < 0.72 ? 'approach' : r < 0.85 ? 'jumpin' : 'wait';
    else if (dist > reach) A.plan = r < 0.68 ? 'approach' : r < 0.82 ? 'jumpin' : 'retreat';
    else A.plan = r < 0.74 ? 'attack' : r < 0.86 ? 'retreat' : 'wait';
  }

  switch (A.plan) {
    case 'approach':
      if (toRight) inp.right = true; else inp.left = true;
      if (dist < 40 * f.def.reach + o.def.hw) A.plan = 'attack';
      break;
    case 'retreat':
      if (toRight) inp.left = true; else inp.right = true;
      break;
    case 'jumpin':
      if (toRight) inp.right = true; else inp.left = true;
      if (f.state === 'idle' || f.state === 'walk') inp.up = true;
      if (f.state === 'jump' && dist < 60 && f.vy > -2) {
        if (Math.random() < 0.5) inp.k = true; else inp.p = true;
      }
      if (f.state === 'jump') break;
      A.plan = 'approach';
      break;
    case 'attack': {
      if (f.state !== 'idle' && f.state !== 'walk' && f.state !== 'crouch') break;
      const r = Math.random();
      if (dist < 34 + o.def.hw && o.state === 'block' && r < 0.5) { inp.block = true; inp.p = true; }
      else if (o.y < -20 && r < 0.7) { inp.down = true; inp.p = true; }
      else if (r < 0.46) inp.p = true;
      else if (r < 0.66) inp.k = true;
      else if (r < 0.8) { inp.down = true; inp.k = true; }
      else if (r < 0.9) { inp.down = true; inp.p = true; }
      else { if (toRight) inp.right = true; else inp.left = true; inp.p = true; }
      A.plan = 'wait';
      A.t = Math.min(A.t, 14);
      break;
    }
  }
}

function aiChooseSpecial(w, f, o, dist) {
  if (!grounded(f) || (f.state !== 'idle' && f.state !== 'walk')) return null;
  if (!f.powerUsed && (f.hp < 62 || f.def.power === 'cocaine') && dist > 70) return 'power';
  const lenkaOut = w.ents.some((e) => e.type === 'lenka');
  if (o.id === 'kiwi') {
    if (f.meter >= 50 && !lenkaOut && dist > 50) return 'lenka';
    if (f.meter >= 25 && dist > 50) return 'law';
  }
  if (o.id === 'baldric' && f.starCd <= 0 && dist > 60) return 'poster';
  const r = Math.random();
  if (f.meter >= 50 && dist > 70 && r < 0.4) return 'guitar';
  if (f.meter >= 50 && !lenkaOut && r < 0.6) return 'lenka';
  if (f.meter >= 25 && dist > 80 && r < 0.75) return 'dive';
  if (f.meter >= 25 && dist > 60 && r < 0.85) return 'law';
  if (f.starCd <= 0 && dist > 80) return 'poster';
  return null;
}

// ---- Drawing the fighters ----
const D2R = Math.PI / 180;
function dirOf(a) { return [Math.sin(a * D2R), Math.cos(a * D2R)]; }

function computeRig(d, p, s) {
  const [t, a1, e1, a2, e2, l1, k1, l2, k2, rot, lift] = p;
  const up = [Math.sin(t * D2R), -Math.cos(t * D2R)];
  const pts = {};
  const chain = (ox, oy, ang1, len1, ang2, len2, k1n, k2n) => {
    const v1 = dirOf(ang1), v2 = dirOf(ang2);
    pts[k1n] = [ox, oy];
    const mid = [ox + v1[0] * len1, oy + v1[1] * len1];
    const end = [mid[0] + v2[0] * len2, mid[1] + v2[1] * len2];
    pts[k1n + 'm'] = mid;
    pts[k1n + 'e'] = end;
    pts[k1n + 'a'] = ang2;
    return end;
  };
  const hw = d.hipW * 0.28;
  chain(hw, 0, l1, d.thigh * s, l1 - k1, d.shin * s, 'lf');
  chain(-hw, 0, l2, d.thigh * s, l2 - k2, d.shin * s, 'lb');
  const tl = d.torso * s;
  const sh = [up[0] * tl, up[1] * tl];
  pts.sh = sh;
  pts.hip = [0, 0];
  const cw = d.chestW * 0.3;
  chain(sh[0] - cw, sh[1] + 2, a1, d.uarm * s, a1 + e1, d.farm * s, 'an');
  chain(sh[0] + cw, sh[1] + 2, a2, d.uarm * s, a2 + e2, d.farm * s, 'af');
  pts.neck = [sh[0] + up[0] * 3, sh[1] + up[1] * 3];

  // rotate the whole body round the hips, then stand it on the ground
  const r = rot * D2R, cs = Math.cos(r), sn = Math.sin(r);
  let lowest = -1e9;
  for (const k in pts) {
    if (typeof pts[k] === 'number') { pts[k] += rot; continue; }
    const [x, y] = pts[k];
    pts[k] = [x * cs - y * sn, x * sn + y * cs];
    if (k === 'lfe' || k === 'lbe') lowest = Math.max(lowest, pts[k][1]);
  }
  const shift = lift > 0.5 ? -lift : -lowest;
  for (const k in pts) if (typeof pts[k] !== 'number') pts[k][1] += shift;
  pts.headAngle = t + rot;
  return pts;
}

function drawFighter(c, f) {
  const d = f.def, pal = f.pal, s = f.raged ? 1.07 : 1;
  const R = computeRig(d, f.pose, s);
  const blink = f.flash > 0 && f.flash % 4 < 2;
  const C = (col) => (blink ? '#ffffff' : col);
  const OUT = '#07070d';
  let jx = 0, jy = 0;
  if (f.buff && f.buff.id === 'cocaine') { jx = (f.frame % 4 < 2 ? 1 : -1); }
  if (f.state === 'rage') { jx = (f.frame % 2 ? 1 : -1); jy = f.frame % 3 ? 0 : -1; }

  c.save();
  c.translate(Math.round(f.x + jx), Math.round(GROUND + f.y + jy));
  c.scale(f.facing, 1);

  const seg = (a, b, w1, w2, col, hi) => {
    limb(c, a[0], a[1], b[0], b[1], w1 + 2, w2 + 2, OUT);
    limb(c, a[0], a[1], b[0], b[1], w1, w2, C(col));
    if (hi && w1 > 3 && !blink) limb(c, a[0] - w1 * 0.18, a[1] - w1 * 0.18, b[0] - w2 * 0.18, b[1] - w2 * 0.18, Math.max(1, w1 * 0.35), Math.max(1, w2 * 0.35), hi);
  };
  const footEnd = (end, ang) => {
    const a = (ang + 90) * D2R;
    return [end[0] + Math.sin(a) * 8, end[1] + Math.cos(a) * 8];
  };

  // Aura: every part drawn fat and gold behind the body.
  const aura = f.raged || f.state === 'rage';
  if (aura) {
    const col = f.frame % 6 < 3 ? '#ffd030' : '#fff6a0';
    const fat = 4 + (f.frame % 8 < 4 ? 1 : 2);
    c.globalAlpha = 0.55;
    const ghost = (a, b, w1, w2) => limb(c, a[0], a[1], b[0], b[1], w1 + fat * 2, w2 + fat * 2, col);
    ghost(R.hip, R.sh, d.hipW, d.chestW);
    ghost(R.lf, R.lfm, d.leg, d.leg); ghost(R.lfm, R.lfe, d.leg, d.leg);
    ghost(R.lb, R.lbm, d.leg, d.leg); ghost(R.lbm, R.lbe, d.leg, d.leg);
    ghost(R.an, R.anm, d.arm, d.arm); ghost(R.anm, R.ane, d.arm, d.arm);
    ghost(R.af, R.afm, d.arm, d.arm); ghost(R.afm, R.afe, d.arm, d.arm);
    disc(c, R.neck[0], R.neck[1] - 9, 13 + fat, col);
    // rising flame tongues
    for (let i = 0; i < 7; i++) {
      const x = -24 + i * 8, h = 18 + ((f.frame * 3 + i * 37) % 26);
      limb(c, x, -4, x + Math.sin(f.frame * 0.3 + i) * 5, -d.height * 0.55 - h, 7, 1, i % 2 ? '#ffd030' : '#fff6a0');
    }
    c.globalAlpha = 1;
  }

  // far arm
  seg(R.af, R.afm, d.arm, d.arm, pal.skinShade);
  seg(R.afm, R.afe, d.arm - 1, Math.max(3, d.arm - 2), pal.skinShade);
  disc(c, R.afe[0], R.afe[1], Math.max(2, d.arm * 0.55) + 1, OUT);
  disc(c, R.afe[0], R.afe[1], Math.max(2, d.arm * 0.55), C(pal.skinShade));

  // back leg
  seg(R.lb, R.lbm, d.leg, d.leg - 1, pal.pants);
  seg(R.lbm, R.lbe, d.leg - 1, d.leg - 2, pal.pants);
  seg(R.lbe, footEnd(R.lbe, R.lba), 5, 4, pal.shoes);

  // front leg
  seg(R.lf, R.lfm, d.leg, d.leg - 1, pal.pants, pal.pantsHi);
  seg(R.lfm, R.lfe, d.leg - 1, d.leg - 2, pal.pants, pal.pantsHi);
  seg(R.lfe, footEnd(R.lfe, R.lfa), 5, 4, pal.shoes);

  // torso
  // the chest stops short of the neck, so the shoulders slope rather than boxing the head in
  const ins = d.chestW * 0.42 / Math.max(1, d.torso);
  const chest = [R.sh[0] + (R.hip[0] - R.sh[0]) * ins, R.sh[1] + (R.hip[1] - R.sh[1]) * ins];
  limb(c, R.hip[0], R.hip[1], chest[0], chest[1], d.hipW + 2, d.chestW + 2, OUT);
  limb(c, R.hip[0], R.hip[1], chest[0], chest[1], d.hipW, d.chestW, C(pal.shirt));
  if (d.belly) {
    const bx = R.hip[0] * 0.6 + R.sh[0] * 0.4 + d.belly * 0.55, by = R.hip[1] * 0.6 + R.sh[1] * 0.4;
    disc(c, bx, by, d.belly + 1, OUT);
    disc(c, bx, by, d.belly, C(pal.shirt));
  }
  const rotNow = Math.abs(f.pose[9]);
  if (!blink && rotNow < 25) {
    // the band shirt: a white print on the chest and a highlight down one side
    const cx = R.hip[0] * 0.4 + R.sh[0] * 0.6, cy = R.hip[1] * 0.4 + R.sh[1] * 0.6;
    const pw = Math.round(d.chestW * 0.55);
    if (d.id === 'sf') {
      rect(c, cx - 1, cy - 8, 2, 16, '#6a0f0c');
    } else if (d.id === 'kiwi') {
      for (let i = 0; i < 4; i++) rect(c, cx - 2 + (i % 2) * 2, cy - 5 + i * 3, 3, 1, pal.print);
      rect(c, cx, cy - 6, 1, 13, pal.print);
    } else if (d.id === 'bill') {
      rect(c, cx - pw / 2, cy - 7, pw, 2, pal.print);
      disc(c, cx, cy + 1, 4, pal.print);
      rect(c, cx - 2, cy, 1, 2, pal.shirt); rect(c, cx + 1, cy, 1, 2, pal.shirt);
      rect(c, cx - 1, cy + 5, 3, 2, pal.print);
    } else {
      rect(c, cx - pw / 2, cy - 6, pw, 3, pal.print);
      rect(c, cx - pw / 2 + 1, cy - 2, pw - 2, 1, pal.print);
      rect(c, cx - pw / 2, cy, pw, 3, pal.print);
      rect(c, cx - pw / 2, cy - 5, pw, 1, pal.shirt);
    }
    rect(c, chest[0] - d.chestW / 2 + 1, chest[1] - d.chestW / 2 + 2, 2, d.torso * 0.55, pal.shirtHi);
  }
  // belt
  if (rotNow < 25) rect(c, R.hip[0] - d.hipW / 2, R.hip[1] - 2, d.hipW, 3, blink ? '#fff' : OUT);

  // neck and head
  seg(R.sh, R.neck, Math.max(5, d.arm * 0.8), Math.max(5, d.arm * 0.8), pal.skin);
  const hurtFace = f.state === 'hit' || f.state === 'knock' || f.state === 'dazed' || f.state === 'down' || f.state === 'ko' || f.state === 'lose';
  const mood = f.raged || f.state === 'rage' ? 'rage' : hurtFace ? 'hurt' : 'normal';
  if (mood === 'rage') {
    // Super Saiyan hair stands straight up
    const hx = R.neck[0], hy = R.neck[1] - 16;
    for (let i = -3; i <= 3; i++) {
      const tall = 7 + ((f.frame >> 2) + i * i) % 5 + (3 - Math.abs(i)) * 3;
      limb(c, hx + i * 2.6, hy, hx + i * 3.4, hy - tall, 6, 1, OUT);
      limb(c, hx + i * 2.6, hy, hx + i * 3.4, hy - tall + 1, 4, 1, '#ffd030');
    }
  }
  const head = getHead(d, mood);
  const ha = Math.round(R.headAngle / 15) * 15;
  if (Math.abs(ha) >= 30) {
    c.save();
    c.translate(Math.round(R.neck[0]), Math.round(R.neck[1]));
    c.rotate(ha * D2R);
    c.drawImage(head, -8, -17);
    c.restore();
  } else {
    c.drawImage(head, Math.round(R.neck[0]) - 8 + Math.round(ha / 15), Math.round(R.neck[1]) - 17);
  }

  // things being held, behind the near arm
  const cst = f.state === 'cast' ? f.cast : null;
  if (cst && cst.id === 'guitar') {
    const bx = R.hip[0] * 0.5 + R.sh[0] * 0.5 + 4, by = R.hip[1] * 0.5 + R.sh[1] * 0.5 + 8;
    c.save();
    c.translate(Math.round(bx), Math.round(by));
    c.rotate(-0.42);
    c.drawImage(SPRITES.guitar, -13, -9);
    c.restore();
  }

  // near arm
  seg(R.an, R.anm, d.arm, d.arm, pal.skin);
  seg(R.anm, R.ane, d.arm - 1, Math.max(3, d.arm - 2), pal.skin);
  disc(c, R.ane[0], R.ane[1], Math.max(2, d.arm * 0.55) + 1, OUT);
  disc(c, R.ane[0], R.ane[1], Math.max(2, d.arm * 0.55), C(pal.skin));
  // a short black sleeve (or the vest's bare shoulder)
  if (d.id !== 'sf') seg(R.an, [R.an[0] * 0.55 + R.anm[0] * 0.45, R.an[1] * 0.55 + R.anm[1] * 0.45], d.arm + 1, d.arm + 1, pal.shirt);

  // devil horns: two fingers up, for the win pose and the dive
  if (f.state === 'win' || (f.state === 'dive' && f.cast.phase < 2 && f.vy < 2)) {
    rect(c, R.ane[0] - 3, R.ane[1] - 7, 2, 5, OUT);
    rect(c, R.ane[0] + 2, R.ane[1] - 7, 2, 5, OUT);
    rect(c, R.ane[0] - 3, R.ane[1] - 6, 1, 4, C(pal.skin));
    rect(c, R.ane[0] + 2, R.ane[1] - 6, 1, 4, C(pal.skin));
  }

  if (cst) {
    const hand = R.ane;
    if (cst.id === 'poster' && f.stateT < cst.fire) spr(c, SPRITES.poster, hand[0], hand[1] - 4);
    if (cst.id === 'law' && f.stateT < cst.fire) {
      for (let i = 0; i < 3; i++) spr(c, SPRITES.paper, hand[0] - 2 + i, hand[1] - 5 - i * 2);
    }
    if (cst.id === 'power' && f.stateT < cst.fire) {
      spr(c, SPRITES[cst.pu.sprite], hand[0] + 2, hand[1] - 3);
      if (cst.pu.sprite2) spr(c, SPRITES[cst.pu.sprite2], R.afe[0] + 2, R.afe[1] - 2);
    }
  }
  c.restore();

  // tied up in paperwork: sheets stuck to him
  if (f.state === 'dazed') {
    for (let i = 0; i < 4; i++) {
      const a = f.frame * 0.1 + i * 1.57;
      spr(c, SPRITES.paper, f.x + Math.cos(a) * 16, GROUND + f.y - f.def.height + 4 + Math.sin(a) * 4);
    }
  }
}

function drawShadow(c, f) {
  const r = (f.def.hw + 10) * (1 + f.y / 240);
  c.globalAlpha = 0.4;
  oval(c, f.x, GROUND + 1, Math.max(6, r), 3, '#000');
  c.globalAlpha = 1;
}

function drawEnt(c, w, e) {
  switch (e.type) {
    case 'star':
      spr(c, SPRITES.poster, e.x, e.y, e.spin);
      break;
    case 'paper':
      spr(c, SPRITES.paper, e.x, e.y, Math.sin(e.spin) * 0.8);
      break;
    case 'lenka': {
      const closeUp = e.life < 60 || e.t < 18;
      c.globalAlpha = e.t < 18 ? e.t / 18 * 0.85 : 0.85 + Math.sin(e.t * 0.2) * 0.1;
      c.save();
      c.translate(Math.round(e.x), Math.round(e.y));
      c.scale(e.face, 1);
      const pulse = closeUp && e.t % 8 < 4 ? 1.06 : 1;
      c.scale(pulse, pulse);
      c.drawImage(SPRITES.lenka, -33, -44);
      c.restore();
      c.globalAlpha = 1;
      break;
    }
    case 'blast': {
      const age = 90 - e.life;
      for (let i = 0; i < 4; i++) {
        const back = i * 10, x = e.x - Math.sign(e.vx) * back;
        const h = (e.heavy ? 60 : 44) - i * 8;
        const col = ['#fff6d0', '#ffd030', '#ff8a1a', '#e03a12'][i];
        for (let y = 0; y < h; y += 2) {
          const curve = Math.sqrt(Math.max(0, 1 - Math.pow(y / h, 2))) * 8;
          rect(c, x + Math.sign(e.vx) * curve + Math.sin(age * 0.8 + y) * 1, GROUND + 4 - y, 3, 2, col);
        }
      }
      break;
    }
    case 'ring':
      for (let i = 0; i < 40; i++) {
        const a = i / 40 * Math.PI * 2;
        rect(c, e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r * 0.8, 2, 2, i % 2 ? '#fff6d0' : '#ffc21a');
      }
      break;
  }
}

function drawCrowd(c, w) {
  // a mosh pit of raised hands along the bottom of the screen
  const n = w.crowd;
  const rise = Math.min(1, n / 24);
  for (let i = 0; i < 34; i++) {
    const x = w.cam + i * 13 - 6, wob = Math.sin(w.frame * 0.25 + i * 1.7) * 3;
    const y = H - 2 - 20 * rise + wob;
    const dark = i % 2 ? '#14121c' : '#0c0a14';
    oval(c, x, H + 4 - 12 * rise, 8, 10, dark);
    limb(c, x + 3, H, x + 5, y, 3, 3, dark);
    rect(c, x + 3, y - 4, 1, 4, dark); rect(c, x + 6, y - 4, 1, 4, dark);
    rect(c, x + 3, y - 1, 4, 2, dark);
  }
}

// Draws the fight in world space (the caller has already moved the camera).
function drawWorld(c, w) {
  const [a, b] = w.f;
  for (const amp of w.amps) {
    const up = Math.min(1, amp.t / 16), fade = Math.min(1, (amp.life - amp.t) / 16);
    const h = 62 * up * fade;
    if (h > 1) c.drawImage(SPRITES.amp, 0, 0, 38, h, amp.x - 19, GROUND - h, 38, h);
  }
  drawShadow(c, a); drawShadow(c, b);
  const lenkas = w.ents.filter((e) => e.type === 'lenka');
  const order = a.state === 'attack' || a.state === 'cast' ? [b, a] : [a, b];
  drawFighter(c, order[0]);
  drawFighter(c, order[1]);
  for (const e of w.ents) if (e.type !== 'lenka') drawEnt(c, w, e);
  for (const e of lenkas) drawEnt(c, w, e);
  for (const p of w.parts) {
    c.fillStyle = p.col;
    c.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
  }
  if (w.crowd > 0) drawCrowd(c, w);
  for (const t of w.floats) {
    const a2 = Math.min(1, t.life / 16);
    c.globalAlpha = a2;
    text(c, t.str, t.x, t.y, { align: 'center', color: t.col, scale: t.scale, outline: '#07070d' });
    c.globalAlpha = 1;
  }
}

// Stands a fighter in idle for menus.
function previewFighter(id, x, y, frame, facing, alt, state) {
  const f = makeFighter(id, 0, false, alt);
  f.x = x; f.y = y - GROUND; f.facing = facing; f.frame = frame; f.state = state || 'idle'; f.stateT = frame;
  f.pose = targetPose(f).slice();
  return f;
}
