// Menus, screens and the flow from title to fight to rematch. Starts the main loop.

const G = {
  scene: null, world: null, paused: false, frame: 0,
  mode: 'versus', p1: 'sf', p2: 'bill', stage: 'london',
  queue: [], queueIndex: 0, stagesLeft: [],
  settings: { difficulty: 'NORMAL', rounds: 3, time: 99, music: true, sfx: true, announcer: true, blood: true, scanlines: true },
  touch: false,
};

(function loadSettings() {
  try {
    const raw = localStorage.getItem('legend-street-fighter');
    if (raw) Object.assign(G.settings, JSON.parse(raw));
  } catch (e) { /* private browsing: fine, use the defaults */ }
})();
function saveSettings() {
  try { localStorage.setItem('legend-street-fighter', JSON.stringify(G.settings)); } catch (e) { /* ignore */ }
  applySettings();
}
function applySettings() {
  Sound.configure(G.settings);
  DIRT.blood = G.settings.blood;
  DIRT.difficulty = G.settings.difficulty;
  document.body.classList.toggle('scan', !!G.settings.scanlines);
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ---- Input ----
const KEYMAP = {
  ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
  ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down',
  j: 'p', J: 'p', z: 'p', Z: 'p', k: 'k', K: 'k', x: 'k', X: 'k',
  l: 'block', L: 'block', c: 'block', C: 'block', Shift: 'block',
};
const held = { left: 0, right: 0, up: 0, down: 0, block: 0 };
let queuedP = false, queuedK = false, queuedCmd = null, cmdAge = 0;

// Phones only allow sound after a finished tap, not at the moment a finger lands.
for (const ev of ['pointerup', 'touchend', 'click']) {
  document.addEventListener(ev, () => Sound.unlock(), { capture: true, passive: true });
}
// A long press shouldn't open the browser's menu in the middle of a fight.
window.addEventListener('contextmenu', (e) => e.preventDefault());
// Full screen on a phone: hold it sideways where the browser allows that.
document.addEventListener('fullscreenchange', () => {
  const o = screen.orientation;
  if (document.fullscreenElement && o && o.lock) o.lock('landscape').catch(() => {});
});
// A phone call or a swipe to another app shouldn't cost you the round.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && G.scene && G.scene.isFight && !G.paused) togglePause();
});

window.addEventListener('keydown', (e) => {
  Sound.unlock();
  const k = KEYMAP[e.key];
  if (k || e.key === ' ' || e.key === 'Enter' || e.key === 'Tab') e.preventDefault();
  if (e.repeat) return;
  if (G.scene && G.scene.isFight && !G.paused) {
    if (k === 'p') queuedP = true;
    else if (k === 'k') queuedK = true;
    else if (k && k in held) {
      held[k]++;
      const me = G.world && G.world.f[0];
      if (me && k !== 'block') pressDir(me, k);
    }
    const sp = Object.keys(SPECIALS).find((id) => SPECIALS[id].key === e.key);
    if (sp) { queuedCmd = sp; cmdAge = 0; }
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === 'Enter') togglePause();
    return;
  }
  if (k && k in held) held[k]++;
  const menuKey = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down',
    Enter: 'ok', ' ': 'ok', j: 'ok', J: 'ok', z: 'ok', Z: 'ok', Escape: 'back', Backspace: 'back', k: 'back', K: 'back', x: 'back', X: 'back', p: 'back', P: 'back' }[e.key];
  if (menuKey && G.scene && G.scene.key) G.scene.key(menuKey);
});
window.addEventListener('keyup', (e) => {
  const k = KEYMAP[e.key];
  if (k && k in held) held[k] = 0;
});
window.addEventListener('blur', () => { for (const k in held) held[k] = 0; });

// ---- Clicking and tapping in the menus ----
let clickZones = [];
function zone(x, y, w, h, fn, hover) { clickZones.push({ x, y, w, h, fn, hover }); }
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
canvas.addEventListener('pointerdown', (e) => {
  Sound.unlock();
  if (e.pointerType === 'touch') G.touch = true;
  const p = canvasPoint(e);
  for (let i = clickZones.length - 1; i >= 0; i--) {
    const z = clickZones[i];
    if (p.x >= z.x && p.x < z.x + z.w && p.y >= z.y && p.y < z.y + z.h) { z.fn(); return; }
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  const p = canvasPoint(e);
  for (let i = clickZones.length - 1; i >= 0; i--) {
    const z = clickZones[i];
    if (z.hover && p.x >= z.x && p.x < z.x + z.w && p.y >= z.y && p.y < z.y + z.h) { z.hover(); return; }
  }
});

function setScene(s) {
  G.scene = s;
  G.paused = false;
  document.body.classList.toggle('fighting', !!s.isFight);
  for (const k in held) held[k] = 0;
  if (s.enter) s.enter();
}

// ---- Shared backgrounds ----
function fireBackground(c, t) {
  rect(c, 0, 0, W, H, '#0a0406');
  for (let x = 0; x < W; x += 4) {
    const h = 34 + Math.sin(x * 0.05 + t * 0.03) * 12 + Math.sin(x * 0.13 - t * 0.05) * 9 + Math.sin(x * 0.31 + t * 0.09) * 5;
    rect(c, x, H - h - 20, 4, h + 20, '#3a0a06');
    rect(c, x, H - h * 0.7, 4, h, '#6a1408');
    rect(c, x, H - h * 0.4, 4, h, '#a82a0a');
    rect(c, x, H - h * 0.18, 4, h, '#e06a12');
  }
  for (let i = 0; i < 30; i++) {
    const x = (i * 37 + Math.sin(t * 0.02 + i) * 16 + 400) % W;
    const y = H - ((t * (0.4 + (i % 5) * 0.15) + i * 29) % H);
    rect(c, x, y, 1 + (i % 2), 1 + (i % 2), i % 3 ? '#ff8a2a' : '#ffd030');
  }
}

function logo(c, y, scale) {
  const s = scale || 4;
  text(c, 'THE LEGEND', W / 2, y, { scale: Math.max(1, s - 2), align: 'center', rows: ROWS_CHROME, outline: '#180808' });
  text(c, 'STREET FIGHTER', W / 2, y + 7 * Math.max(1, s - 2) + 6, { scale: s, align: 'center', rows: ROWS_FIRE, outline: '#180808' });
}

function title(c, str, y) {
  text(c, str, W / 2, y === undefined ? 10 : y, { scale: 2, align: 'center', rows: ROWS_FIRE, outline: '#180808' });
}

function backButton(c, fn, label) {
  const str = label || '← BACK';
  rect(c, 6, H - 18, textWidth(str) + 10, 13, 'rgba(0,0,0,0.65)');
  text(c, str, 11, H - 15, { color: '#d8d8e8' });
  zone(0, H - 28, textWidth(str) + 24, 28, fn);
}

function portrait(c, id, x, y, s, mood) {
  const img = getHead(FIGHTERS[id], mood || 'normal');
  c.drawImage(img, x, y, 16 * s, 18 * s);
}

function statBars(c, x, y, def) {
  const labels = ['POWER', 'SPEED', 'REACH'];
  labels.forEach((l, i) => {
    text(c, l, x, y + i * 10, { color: '#c8c8d8', outline: '#000' });
    for (let n = 0; n < 5; n++) rect(c, x + 34 + n * 9, y + i * 10, 8, 7, n < def.stats[i] ? '#ffc21a' : '#3a3440');
  });
}

// ---- Title ----
function TitleScene() {
  let t = 0;
  const lads = [previewFighter('bill', 70, 216, 0, 1), previewFighter('kiwi', 158, 216, 9, 1), previewFighter('baldric', 258, 216, 4, -1), previewFighter('sf', 346, 216, 12, -1)];
  return {
    enter() { Sound.play('menu'); },
    update() {
      t++;
      for (const f of lads) { f.frame++; f.stateT++; updatePose(f); }
    },
    key(k) { if (k === 'ok') { Sound.sfx('pick'); setScene(MenuScene()); } },
    draw(c) {
      fireBackground(c, t);
      c.save();
      c.translate(0, -8);
      for (const f of lads) { drawFighter(c, f); }
      c.restore();
      logo(c, 18, 4);
      text(c, '16-BIT BEAT-EM-UP · 1 PLAYER', W / 2, 74, { align: 'center', color: '#e8e8f0', outline: '#000' });
      if (t % 60 < 40) text(c, G.touch ? 'TAP TO START' : 'PRESS ENTER', W / 2, 86, { align: 'center', color: '#ffe14d', outline: '#600' });
      zone(0, 0, W, H, () => { Sound.sfx('pick'); setScene(MenuScene()); });
    },
  };
}

// ---- A vertical list menu ----
function ListMenu(heading, items, opts = {}) {
  let cur = 0, t = 0;
  const m = {
    update() { t++; },
    key(k) {
      if (t < (opts.guard || 0)) return; // still mashing from the fight: don't pick anything by accident
      if (k === 'up') { cur = (cur + items.length - 1) % items.length; Sound.sfx('move'); }
      if (k === 'down') { cur = (cur + 1) % items.length; Sound.sfx('move'); }
      if (k === 'ok') { Sound.sfx('pick'); items[cur].fn(); }
      if (k === 'back' && opts.back) { Sound.sfx('move'); opts.back(); }
    },
    draw(c) {
      if (opts.overWorld) {
        G.drawFightFrame(c);
        c.globalAlpha = 0.7; rect(c, 0, 0, W, H, '#000'); c.globalAlpha = 1;
      } else {
        fireBackground(c, t);
      }
      if (heading) title(c, heading, opts.logo ? 74 : 26);
      if (opts.logo) logo(c, 10, 3);
      const y0 = opts.y0 || 76, gap = opts.gap || 21;
      items.forEach((it, i) => {
        const y = y0 + i * gap;
        const sel = i === cur;
        const w = 220;
        if (sel) {
          rect(c, W / 2 - w / 2, y - 3, w, gap - 3, '#7a1408');
          rect(c, W / 2 - w / 2, y - 3, w, 1, '#ffc21a');
          rect(c, W / 2 - w / 2, y + gap - 7, w, 1, '#ffc21a');
          text(c, '→', W / 2 - w / 2 + 6, y + 1, { color: '#ffe14d', scale: 1 });
        }
        text(c, it.label, W / 2, y, { align: 'center', scale: 1, color: sel ? '#fff' : '#d8d0c8', outline: '#000' });
        if (it.sub) text(c, it.sub, W / 2, y + 10, { align: 'center', color: sel ? '#ffd8a0' : '#8a7a78', outline: '#000' });
        zone(W / 2 - w / 2, y - 3, w, gap - 2, () => { if (t < (opts.guard || 0)) return; cur = i; Sound.sfx('pick'); it.fn(); }, () => { cur = i; });
      });
      if (opts.back) backButton(c, opts.back);
    },
  };
  return m;
}

function MenuScene() {
  return ListMenu(null, [
    { label: 'FIGHT', sub: 'ANY FIGHTER AGAINST ANY FIGHTER', fn: () => { G.mode = 'versus'; setScene(SelectScene('p1')); } },
    { label: 'FIGHT ALL THREE', sub: 'THE STREET FIGHTER AGAINST ALL THE LADS, ONE BY ONE', fn: () => { G.mode = 'gauntlet'; setScene(SelectScene('p1')); } },
    { label: 'PRACTICE', sub: 'A PUNCHBAG, ENDLESS HEALTH AND METAL', fn: () => { G.mode = 'practice'; setScene(SelectScene('p1')); } },
    { label: 'COMBOS AND MOVES', sub: 'EVERY COMMAND IN THE GAME', fn: () => setScene(MovesScene(() => setScene(MenuScene()))) },
    { label: 'SETTINGS', sub: 'DIFFICULTY, ROUNDS, SOUND, BLOOD', fn: () => setScene(SettingsScene()) },
    { label: 'GAME SELECT', sub: 'BACK TO THE COLLECTION', fn: () => { window.location.href = '../index.html'; } },
  ], { logo: true, y0: 54, gap: 28, back: () => setScene(TitleScene()) });
}

// ---- Choosing fighters ----
function SelectScene(who) {
  let t = 0;
  let cur = ROSTER.indexOf(who === 'p1' ? (G.mode === 'gauntlet' ? 'sf' : G.p1) : G.p2);
  if (cur < 0) cur = 0;
  function confirm() {
    Sound.sfx('pick');
    const id = ROSTER[cur];
    Sound.say(FIGHTERS[id].name.replace('THE ', ''));
    if (who === 'p1') {
      G.p1 = id;
      if (G.mode === 'gauntlet') {
        const order = ['baldric', 'kiwi', 'bill', 'sf'].filter((x) => x !== id);
        G.queue = order; G.queueIndex = 0;
        G.stagesLeft = ['london', 'berlin', 'ostrava'];
        startGauntletFight();
      } else {
        setScene(SelectScene('p2'));
      }
    } else {
      G.p2 = id;
      setScene(StageScene());
    }
  }
  function back() {
    Sound.sfx('move');
    if (who === 'p2') setScene(SelectScene('p1')); else setScene(MenuScene());
  }
  return {
    update() { t++; },
    key(k) {
      if (k === 'left') { cur = (cur + 3) % 4; Sound.sfx('move'); }
      if (k === 'right') { cur = (cur + 1) % 4; Sound.sfx('move'); }
      if (k === 'up' || k === 'down') { cur = (cur + 2) % 4; Sound.sfx('move'); }
      if (k === 'ok') confirm();
      if (k === 'back') back();
    },
    draw(c) {
      fireBackground(c, t);
      const head = who === 'p1' ? 'CHOOSE YOUR FIGHTER' : 'CHOOSE WHO YOU FIGHT';
      title(c, head, 8);
      const id = ROSTER[cur], def = FIGHTERS[id];

      // big preview on the left
      rect(c, 8, 28, 124, 174, 'rgba(0,0,0,0.55)');
      const scale = id === 'kiwi' ? 1.3 : 1.45;
      const pv = previewFighter(id, 0, GROUND, t, 1, false, 'idle');
      c.save();
      c.translate(70, 198);
      c.scale(scale, scale);
      c.translate(0, -GROUND);
      drawFighter(c, pv);
      c.restore();

      // the four faces
      ROSTER.forEach((rid, i) => {
        const x = 142 + (i % 2) * 66, y = 28 + (i >> 1) * 76;
        const sel = i === cur;
        rect(c, x, y, 60, 70, sel ? '#ffc21a' : '#3a2420');
        rect(c, x + 2, y + 2, 56, 66, sel ? '#7a1408' : '#180e10');
        portrait(c, rid, x + 6, y + 4, 3);
        const short = rid === 'sf' ? 'STREET F.' : rid === 'kiwi' ? 'KIWI B.' : FIGHTERS[rid].name;
        text(c, short, x + 30, y + 59, { align: 'center', color: sel ? '#fff' : '#a89890' });
        zone(x, y, 60, 70, () => { if (cur === i) confirm(); else { cur = i; Sound.sfx('move'); } }, () => { cur = i; });
      });

      // details on the right
      const dx = 280;
      rect(c, dx - 4, 28, 134, 174, 'rgba(0,0,0,0.55)');
      text(c, def.name.replace('THE ', ''), dx, 34, { color: '#ffe14d', outline: '#000' });
      wrap(c, def.style, dx, 46, 21, '#ffffff');
      statBars(c, dx, 96, def);
      const pu = POWER_UPS[def.power];
      text(c, 'POWER-UP:', dx, 130, { color: '#c8c8d8' });
      text(c, pu.name, dx, 139, { color: pu.col });
      wrap(c, pu.text, dx, 149, 21, '#b8b8c8');
      if (id === 'bill') { text(c, 'UNDER 30% HEALTH:', dx, 172, { color: '#c8c8d8' }); text(c, 'WILLY RAGE', dx, 181, { color: '#ffd030' }); }
      if (id === 'kiwi') { text(c, 'WEAK TO:', dx, 172, { color: '#c8c8d8' }); text(c, 'LENKA, CZECH LAW', dx, 181, { color: '#ff8a7a' }); }
      if (id === 'baldric') { text(c, 'WEAK TO:', dx, 172, { color: '#c8c8d8' }); text(c, 'IO POSTER STARS', dx, 181, { color: '#ff8a7a' }); }
      if (id === 'sf') { text(c, 'WEAK TO:', dx, 172, { color: '#c8c8d8' }); text(c, 'NOTHING. HE IS FINE', dx, 181, { color: '#a0e8a0' }); }

      text(c, G.touch ? 'TAP A FACE, THEN TAP IT AGAIN' : 'ARROWS TO CHOOSE · ENTER TO CONFIRM', W / 2 + 20, H - 15, { align: 'center', color: '#fff', outline: '#000' });
      backButton(c, back);
    },
  };
}

function wrap(c, str, x, y, maxChars, col) {
  const words = str.split(' ');
  let line = '', yy = y;
  for (const wd of words) {
    if ((line + ' ' + wd).trim().length > maxChars) {
      text(c, line, x, yy, { color: col });
      yy += 9; line = wd;
    } else {
      line = (line + ' ' + wd).trim();
    }
  }
  if (line) text(c, line, x, yy, { color: col });
  return yy + 9;
}

function StageScene() {
  let t = 0, cur = Math.max(0, STAGE_LIST.findIndex((s) => s.id === G.stage));
  const thumbs = {};
  function thumb(id) { return thumbs[id] || (thumbs[id] = stageThumb(id)); }
  function confirm() {
    Sound.sfx('pick');
    G.stage = STAGE_LIST[cur].id;
    Sound.say(STAGE_LIST[cur].name);
    setScene(VsScene());
  }
  function back() { Sound.sfx('move'); setScene(SelectScene('p2')); }
  return {
    update() { t++; },
    key(k) {
      if (k === 'left' || k === 'up') { cur = (cur + 2) % 3; Sound.sfx('move'); }
      if (k === 'right' || k === 'down') { cur = (cur + 1) % 3; Sound.sfx('move'); }
      if (k === 'ok') confirm();
      if (k === 'back') back();
    },
    draw(c) {
      fireBackground(c, t);
      title(c, 'CHOOSE THE BATTLEFIELD', 8);
      // the chosen stage fills most of the screen
      const st = STAGE_LIST[cur];
      rect(c, 46, 28, 324, 138, '#ffc21a');
      c.drawImage(thumb(st.id), 0, 0, W, H, 48, 30, 320, 134);
      text(c, st.name, W / 2, 138, { scale: 2, align: 'center', rows: ROWS_FIRE, outline: '#000' });
      text(c, st.blurb, W / 2, 154, { align: 'center', outline: '#000' });
      STAGE_LIST.forEach((s, i) => {
        const x = 56 + i * 104, y = 172;
        rect(c, x, y, 96, 32, i === cur ? '#ffc21a' : '#3a2420');
        c.drawImage(thumb(s.id), 0, 0, W, H, x + 2, y + 2, 92, 28);
        zone(x, y, 96, 32, () => { if (cur === i) confirm(); else { cur = i; Sound.sfx('move'); } }, () => { cur = i; });
      });
      zone(48, 30, 320, 134, confirm);
      backButton(c, back);
    },
  };
}

// ---- VS screen ----
function VsScene() {
  let t = 0;
  const dur = 170;
  const start = () => setScene(FightScene());
  return {
    enter() { Sound.play('menu'); Sound.sfx('roar'); },
    update() { t++; if (t >= dur) start(); },
    key(k) { if (k === 'ok' && t > 20) start(); },
    draw(c) {
      rect(c, 0, 0, W, H, '#100406');
      for (let i = 0; i < 20; i++) rect(c, 0, i * 12, W, 6, i % 2 ? '#1e0806' : '#160606');
      const a = FIGHTERS[G.p1], b = FIGHTERS[G.p2];
      const slide = Math.min(1, t / 18);
      const lx = -120 + 150 * slide, rx = W + 24 - 150 * slide;
      rect(c, lx - 6, 42, 108, 118, '#ffc21a'); rect(c, lx - 4, 44, 104, 114, '#280a08');
      c.save(); c.translate(lx + 2, 48); c.drawImage(getHead(a, 'normal'), 0, 0, 96, 108); c.restore();
      rect(c, rx - 6, 42, 108, 118, '#ffc21a'); rect(c, rx - 4, 44, 104, 114, '#280a08');
      c.save(); c.translate(rx + 98, 48); c.scale(-1, 1); c.drawImage(getHead(b, 'normal'), 0, 0, 96, 108); c.restore();
      text(c, 'VS', W / 2, 76, { scale: 5, align: 'center', rows: ROWS_BLOOD, outline: '#fff' });
      text(c, a.name.replace('THE ', ''), lx + 48, 166, { align: 'center', color: '#ffe14d', outline: '#000' });
      text(c, b.name.replace('THE ', ''), rx + 48, 166, { align: 'center', color: '#ffe14d', outline: '#000' });
      const st = STAGE_LIST.find((s) => s.id === G.stage);
      text(c, st.name, W / 2, 196, { scale: 2, align: 'center', rows: ROWS_FIRE, outline: '#000' });
      if (G.mode === 'gauntlet') text(c, 'FIGHT ' + (G.queueIndex + 1) + ' OF ' + G.queue.length, W / 2, 18, { scale: 2, align: 'center', color: '#fff', outline: '#000' });
      zone(0, 0, W, H, start);
    },
  };
}

// ---- The fight ----
function FightScene() {
  const p1 = makeFighter(G.p1, 0, !!G.testBothAI);
  const p2 = makeFighter(G.p2, 1, true, G.p1 === G.p2);
  const stage = getStage(G.stage);
  const w = newWorld(p1, p2, stage);
  w.practice = G.mode === 'practice';
  w.aiOff = w.practice;
  G.world = w;
  const roundsToWin = Math.ceil(G.settings.rounds / 2);
  const s = {
    isFight: true, phase: 'intro', t: 0, round: 1, clock: G.settings.time, clockT: 0, winner: null,
    enter() { Sound.play(stage.music); startRound(); },
    update() {
      if (G.paused) { if (G.pauseMenu) G.pauseMenu.update(); return; }
      s.t++;
      readInput();
      stepWorld(w);
      if (s.phase === 'intro') {
        if (s.t === 8) { setBanner(w, 'ROUND ' + s.round, 70, ROWS_CHROME, 4); Sound.say('Round ' + s.round); Sound.sfx('bell'); }
        if (s.t === 84) { setBanner(w, 'FIGHT!', 44, ROWS_FIRE, 6); Sound.say('Fight!'); Sound.sfx('chord'); }
        if (s.t === 96) { w.locked = false; s.phase = 'fight'; }
      } else if (s.phase === 'fight') {
        if (w.practice) {
          for (const f of w.f) {
            f.meter = 100;
            if (f.hp < 100 && f.comboT === 0 && f.state !== 'rage') f.hp = Math.min(100, f.hp + 0.5);
          }
          p1.powerUsed = false; p2.powerUsed = false;
        } else if (G.settings.time && w.cine <= 0) {
          s.clockT++;
          if (s.clockT >= 60) { s.clockT = 0; s.clock--; }
          if (s.clock <= 0) timeUp();
        }
        if (w.koBy) { s.winner = w.koBy; s.phase = 'ko'; s.t = 0; }
      } else if (s.phase === 'ko') {
        const loser = s.winner === p1 ? p2 : p1;
        if (s.t === 110) {
          if (s.winner) {
            s.winner.state = 'win'; s.winner.stateT = 0; s.winner.atk = null; s.winner.cast = null; s.winner.wins++;
            s.winner.facing = (loser.x >= s.winner.x) ? 1 : -1;
            const perfect = s.winner.hp >= 100;
            setBanner(w, perfect ? 'FLAWLESS!' : s.winner.def.name.replace('THE ', '') + ' WINS', 130, ROWS_GOLD, perfect ? 4 : (s.winner.def.name.length > 12 ? 2 : 3));
            Sound.say(s.winner.def.name.replace('THE ', '') + ' wins');
            Sound.sfx('roar');
          } else {
            setBanner(w, 'DRAW', 100, ROWS_CHROME, 4);
          }
        }
        if (s.t >= 260) nextRound();
      }
    },
    draw(c) { drawFight(c, w, s); if (G.paused && G.pauseMenu) G.pauseMenu.draw(c); },
    key(k) { if (G.paused && G.pauseMenu) G.pauseMenu.key(k); },
  };

  function startRound() {
    resetFighter(p1, WORLD_W / 2 - 70, 1);
    resetFighter(p2, WORLD_W / 2 + 70, -1);
    w.ents = []; w.parts = []; w.floats = []; w.amps = []; w.crowd = 0;
    w.koBy = null; w.locked = true; w.slow = 0; w.cine = 0; w.hitstop = 0; w.banner = null;
    w.cam = (WORLD_W - W) / 2;
    s.phase = 'intro'; s.t = 0; s.clock = G.settings.time; s.clockT = 0; s.winner = null;
  }
  function timeUp() {
    w.locked = true;
    if (Math.abs(p1.hp - p2.hp) < 0.5) s.winner = null;
    else s.winner = p1.hp > p2.hp ? p1 : p2;
    setBanner(w, 'TIME UP', 90, ROWS_CHROME, 4);
    Sound.say('Time up');
    s.phase = 'ko'; s.t = 40;
    const l = s.winner === p1 ? p2 : p1;
    if (s.winner) { l.state = 'lose'; l.stateT = 0; l.atk = null; l.cast = null; }
  }
  function nextRound() {
    if (p1.wins >= roundsToWin || p2.wins >= roundsToWin) {
      setScene(ResultScene(p1.wins >= roundsToWin));
      return;
    }
    s.round++;
    startRound();
  }
  G.drawFightFrame = (c) => drawFight(c, w, s, true);
  return s;
}

function readInput() {
  const me = G.world.f[0];
  if (me.isAI) return;
  const i = me.inp;
  i.left = !!held.left; i.right = !!held.right; i.up = !!held.up; i.down = !!held.down; i.block = !!held.block;
  i.p = queuedP; i.k = queuedK;
  queuedP = queuedK = false;
  // a special pressed while finishing another move waits a moment instead of being lost
  if (queuedCmd) {
    const free = (canAct(me) && me.y >= 0) || (me.state === 'attack' && me.atk && me.atk.landed && !me.atk.airMove);
    if (free) { i.cmd = queuedCmd; queuedCmd = null; }
    else if (++cmdAge > 18) queuedCmd = null;
  }
}

function drawHud(c, w, s) {
  const [a, b] = w.f;
  const bar = (f, x, mirror) => {
    const bw = 170;
    rect(c, x - 2, 6, bw + 4, 13, '#0a0a12');
    rect(c, x - 1, 7, bw + 2, 11, '#fff6d8');
    rect(c, x, 8, bw, 9, '#5a0a08');
    const shown = Math.max(0, f.shownHp / 100 * bw), real = Math.max(0, f.hp / 100 * bw);
    const fx = (v) => (mirror ? x + bw - v : x);
    rect(c, fx(shown), 8, shown, 9, '#ffe060');
    const col = f.raged ? (w.frame % 10 < 5 ? '#ffd030' : '#fff6a0') : f.hp < 30 ? (w.frame % 20 < 10 ? '#ff5a2a' : '#c8281a') : '#2ec82e';
    const hi = f.raged ? '#fffbd0' : f.hp < 30 ? '#ff9a7a' : '#7cf07c';
    rect(c, fx(real), 8, real, 9, col);
    rect(c, fx(real), 9, real, 2, hi);
    const nm = f.def.name.replace('THE ', '');
    text(c, nm, mirror ? x + bw : x, 21, { align: mirror ? 'right' : 'left', color: f.raged ? '#ffd030' : '#fff', outline: '#000' });
    // round wins
    const need = Math.ceil(G.settings.rounds / 2);
    for (let i = 0; i < need; i++) {
      const px = mirror ? x + i * 11 : x + bw - 8 - i * 11;
      disc(c, px + 4, 25, 4, '#0a0a12');
      disc(c, px + 4, 25, 3, i < f.wins ? '#ffd030' : '#3a3040');
    }
  };
  bar(a, 8, false);
  bar(b, W - 178, true);

  // the clock
  rect(c, W / 2 - 16, 4, 32, 21, '#0a0a12');
  rect(c, W / 2 - 15, 5, 30, 19, '#2a1408');
  const cl = w.practice || !G.settings.time ? '--' : String(Math.max(0, s.clock)).padStart(2, '0');
  text(c, cl, W / 2, 8, { scale: 2, align: 'center', color: s.clock <= 10 && G.settings.time ? '#ff5a4a' : '#ffe060' });

  // the metal meters
  const meter = (f, x, mirror) => {
    // on a phone the thumbs cover the bottom corners, so the meters move up under the health bars
    const bw = 110, y = G.touch ? 31 : H - 12, ly = G.touch ? y + 8 : y - 9;
    rect(c, x - 1, y - 1, bw + 2, 8, '#0a0a12');
    rect(c, x, y, bw, 6, '#2a2438');
    const v = f.meter / 100 * bw;
    const full = f.meter >= 50;
    rect(c, mirror ? x + bw - v : x, y, v, 6, full ? (w.frame % 12 < 6 ? '#ff5a1a' : '#ffa01a') : '#4a7ae8');
    for (const pc of [0.25, 0.5, 0.75]) rect(c, x + bw * pc, y, 1, 6, '#0a0a12');
    text(c, 'METAL', mirror ? x + bw : x, ly, { align: mirror ? 'right' : 'left', color: '#d8d8e8', outline: '#000' });
    // power-up status
    const pu = POWER_UPS[f.def.power];
    if (f.buff) {
      text(c, pu.name, mirror ? x + bw - 36 : x + 36, ly, { align: mirror ? 'right' : 'left', color: pu.col, outline: '#000' });
      const left = f.buff.time / f.buff.max;
      const tw = 30 * left;
      rect(c, mirror ? x + bw - 36 - tw : x + 36, ly - 2, tw, 1, pu.col);
    } else if (!f.powerUsed) {
      spr(c, SPRITES[pu.sprite], mirror ? x - 10 : x + bw + 10, G.touch ? y + 4 : y - 2);
    }
    if (f.encore > 0) text(c, 'ENCORE!', mirror ? x + bw - 36 : x + 36, ly, { align: mirror ? 'right' : 'left', color: w.frame % 8 < 4 ? '#ffd030' : '#fff', outline: '#000' });
  };
  meter(a, 8, false);
  meter(b, W - 118, true);

  if (w.practice) text(c, 'PRACTICE', W / 2, 28, { align: 'center', color: '#a0e8a0', outline: '#000' });
  // combo counter sits on the striker's side
  for (const f of w.f) {
    if (f.combo >= 2 && f.comboT > 0) {
      const leftSide = f === a;
      text(c, f.combo + ' HIT COMBO', leftSide ? 8 : W - 8, G.touch ? 52 : 40, { scale: f.combo >= 4 ? 2 : 1, align: leftSide ? 'left' : 'right', rows: ROWS_FIRE, outline: '#000' });
    }
  }
}

function drawFight(c, w, s, noHud) {
  const sx = w.shake > 0 ? Math.round((Math.random() - 0.5) * w.shake) : 0;
  const sy = w.shake > 0 ? Math.round((Math.random() - 0.5) * w.shake * 0.7) : 0;
  c.save();
  c.translate(sx, sy);
  drawStage(c, w.stage, w.cam, w.frame);
  c.save();
  c.translate(-Math.round(w.cam), 0);
  drawWorld(c, w);
  c.restore();
  if (w.stage.over) w.stage.over(c, w.cam, w.frame);
  c.restore();
  if (w.cine > 0) {
    // bars close in while Bill rages up
    const h = Math.min(26, (110 - w.cine) * 2);
    rect(c, 0, 0, W, h, '#000');
    rect(c, 0, H - h, W, h, '#000');
  }
  if (w.flashT > 0) {
    c.globalAlpha = Math.min(0.85, w.flashT / 10);
    rect(c, 0, 0, W, H, w.flashCol);
    c.globalAlpha = 1;
  }
  if (!noHud && w.cine <= 0) drawHud(c, w, s);
  if (w.banner && !noHud) {
    const b = w.banner;
    const y = H / 2 - (7 * b.scale) / 2 - 22;
    text(c, b.str, W / 2, y, { scale: b.scale, align: 'center', rows: b.rows, outline: '#180808' });
  }
}

function togglePause() {
  G.paused = !G.paused;
  if (G.paused) {
    for (const k in held) held[k] = 0;
    queuedP = queuedK = false; queuedCmd = null;
    G.pauseMenu = ListMenu('PAUSED', [
      { label: 'RESUME', fn: () => togglePause() },
      { label: 'COMBOS AND MOVES', fn: () => { const fight = G.scene; G.scene = MovesScene(() => { G.scene = fight; }); } },
      { label: 'RESTART FIGHT', fn: () => { G.paused = false; setScene(FightScene()); } },
      { label: 'QUIT TO MENU', fn: () => { G.paused = false; setScene(MenuScene()); } },
    ], { overWorld: true, y0: 70, gap: 22, back: () => togglePause() });
  }
}

// ---- After the fight ----
function ResultScene(won) {
  const gauntlet = G.mode === 'gauntlet';
  if (gauntlet && won) {
    G.queueIndex++;
    if (G.queueIndex >= G.queue.length) return EndingScene();
  }
  const winnerId = won ? G.p1 : G.p2;
  const def = FIGHTERS[winnerId];
  const quote = def.quote[Math.floor(Math.random() * def.quote.length)];
  const items = [];
  if (gauntlet) {
    if (won) items.push({ label: 'NEXT FIGHT', fn: () => startGauntletFight() });
    else items.push({ label: 'TRY AGAIN', fn: () => startGauntletFight() });
  } else {
    items.push({ label: 'REMATCH', fn: () => setScene(VsScene()) });
    items.push({ label: 'NEW FIGHT', fn: () => setScene(SelectScene('p1')) });
  }
  items.push({ label: 'MAIN MENU', fn: () => setScene(MenuScene()) });
  const menu = ListMenu(null, items, { y0: 158, gap: 20, guard: 45 });
  let t = 0;
  const pose = previewFighter(winnerId, 80, 206, 0, 1, false, 'win');
  return {
    enter() { Sound.play(won ? 'win' : 'ostrava'); },
    update() { t++; pose.frame++; pose.stateT++; updatePose(pose); menu.update(); },
    key: (k) => menu.key(k),
    draw(c) {
      menu.draw(c);
      text(c, won ? 'YOU WIN' : 'YOU LOSE', W / 2, 14, { scale: 4, align: 'center', rows: won ? ROWS_GOLD : ROWS_BLOOD, outline: '#180808' });
      rect(c, 130, 58, 278, 84, 'rgba(0,0,0,0.65)');
      portrait(c, winnerId, 138, 64, 4);
      text(c, def.name.replace('THE ', ''), 212, 66, { color: '#ffe14d', outline: '#000' });
      wrap(c, '"' + quote + '"', 212, 80, 30, '#ffffff');
      drawFighter(c, pose);
    },
  };
}

function startGauntletFight() {
  G.p2 = G.queue[G.queueIndex];
  G.stage = G.stagesLeft[Math.min(G.queueIndex, G.stagesLeft.length - 1)];
  setScene(VsScene());
}

function EndingScene() {
  let t = 0;
  const pose = previewFighter(G.p1, W / 2, 200, 0, 1, false, 'win');
  const go = () => setScene(MenuScene());
  return {
    enter() { Sound.play('win'); Sound.say('You are the legend'); },
    update() { t++; pose.frame++; pose.stateT++; updatePose(pose); },
    key(k) { if (k === 'ok' || k === 'back') go(); },
    draw(c) {
      fireBackground(c, t);
      text(c, 'ALL THREE BEATEN', W / 2, 16, { scale: 3, align: 'center', rows: ROWS_GOLD, outline: '#180808' });
      text(c, 'THE LADS ARE ON THE FLOOR. THE KEBAB IS YOURS.', W / 2, 50, { align: 'center', color: '#fff', outline: '#000' });
      text(c, 'YOU ARE THE LEGEND', W / 2, 64, { scale: 2, align: 'center', rows: ROWS_FIRE, outline: '#000' });
      drawFighter(c, pose);
      if (t % 60 < 40) text(c, G.touch ? 'TAP TO CARRY ON' : 'PRESS START', W / 2, 212, { align: 'center', color: '#fff', outline: '#000' });
      zone(0, 0, W, H, go);
    },
  };
}

// ---- Moves list ----
function MovesScene(onBack) {
  let page = 0, t = 0;
  const pages = ['FIGHTING', 'SPECIALS', 'POWER-UPS'];
  const turn = (n) => { page = (page + n + pages.length) % pages.length; Sound.sfx('move'); };
  const row = (c, y, name, inp, note, col) => {
    text(c, name, 18, y, { color: col || '#ffe14d', outline: '#000' });
    text(c, inp, W - 18, y, { align: 'right', color: '#fff', outline: '#000' });
    if (note) text(c, note, 18, y + 9, { color: '#b8b0b8', outline: '#000' });
  };
  return {
    update() { t++; },
    key(k) {
      if (k === 'left') turn(-1);
      if (k === 'right' || k === 'ok') turn(1);
      if (k === 'back') { Sound.sfx('move'); onBack(); }
    },
    draw(c) {
      fireBackground(c, t);
      rect(c, 8, 30, W - 16, H - 52, 'rgba(0,0,0,0.72)');
      title(c, 'COMBOS AND MOVES', 8);
      pages.forEach((p, i) => {
        const x = 38 + i * 120;
        rect(c, x, 33, 100, 12, i === page ? '#7a1408' : '#2a1a1a');
        text(c, p, x + 50, 36, { align: 'center', color: i === page ? '#fff' : '#a89890' });
        zone(x, 30, 100, 18, () => { page = i; Sound.sfx('move'); });
      });
      let y = 52;
      if (page === 0) {
        const list = [
          ['JAB', 'PUNCH', ''], ['GLASGOW KISS', '→ + PUNCH', ''], ['UPPERCUT', '↓ + PUNCH', 'LAUNCHES THEM: HIT THEM AGAIN IN THE AIR'],
          ['KICK', 'KICK', ''], ['SWEEP', '↓ + KICK', 'BLOCK IT CROUCHING'], ['JUMP ATTACK', '↑ THEN PUNCH OR KICK', 'BLOCK IT STANDING'],
          ['SUPLEX', G.touch ? 'THROW, UP CLOSE' : 'BLOCK + PUNCH, UP CLOSE', 'THROWS THROUGH A BLOCK'],
          ['PUB BRAWLER COMBO', 'PUNCH PUNCH KICK', 'EACH HIT MUST LAND'],
        ];
        for (const [n, i, note] of list) { row(c, y, n, i, note); y += note ? 19 : 11; }
      } else if (page === 1) {
        text(c, 'SPECIALS SPEND METAL. HITTING AND BEING HIT FILLS IT.', 18, y, { color: '#a0e8ff', outline: '#000' });
        y += 11;
        for (const id of ['poster', 'law', 'lenka', 'dive', 'guitar']) {
          const sp = SPECIALS[id];
          row(c, y, sp.name + (sp.cost ? '  (' + sp.cost + ' METAL)' : ''), G.touch ? TOUCH_LABEL[id] + ' BUTTON' : sp.input + ' / ' + sp.key, sp.note);
          y += 20;
        }
        row(c, y, 'HEAVY METAL COMBO', G.touch ? 'DIVE, THEN GUITAR' : 'DIVE, THEN ← → PUNCH', 'LAND THE DIVE, THEN THE GUITAR IS FREE, BIGGER, UNBLOCKABLE', '#ff8a4a');
      } else {
        row(c, y, 'POWER-UP', G.touch ? 'POWER BUTTON' : '↓ ↓ KICK / 4', 'EVERY FIGHTER HAS HIS OWN, ONCE A ROUND. HE CAN BE HIT MID-SWIG', '#a0e8ff');
        y += 22;
        for (const id of ROSTER) {
          const pu = POWER_UPS[FIGHTERS[id].power];
          spr(c, SPRITES[pu.sprite], 28, y + 7);
          text(c, FIGHTERS[id].name.replace('THE ', '') + ': ' + pu.name, 44, y, { color: pu.col, outline: '#000' });
          text(c, pu.text, 44, y + 9, { color: '#b8b0b8', outline: '#000' });
          y += 23;
        }
        text(c, 'WILLY RAGE', 44, y, { color: '#ffd030', outline: '#000' });
        text(c, 'WILD BILL UNDER 30%: HEALS, GLOWS GOLD, HITS LIKE A TRUCK', 44, y + 9, { color: '#b8b0b8', outline: '#000' });
        trefoil(c, 28, y + 7, 7);
      }
      if (!G.touch) text(c, '← → PAGE', W - 12, H - 15, { align: 'right', color: '#fff', outline: '#000' });
      backButton(c, onBack);
    },
  };
}

// ---- Settings ----
function SettingsScene() {
  let t = 0, cur = 0;
  const S = G.settings;
  const onOff = (v) => (v ? 'ON' : 'OFF');
  const rows = [
    { name: 'DIFFICULTY', get: () => S.difficulty, turn: (n) => { const l = ['EASY', 'NORMAL', 'BRUTAL']; S.difficulty = l[(l.indexOf(S.difficulty) + n + 3) % 3]; } },
    { name: 'ROUNDS', get: () => 'BEST OF ' + S.rounds, turn: (n) => { const l = [1, 3, 5]; S.rounds = l[(l.indexOf(S.rounds) + n + 3) % 3]; } },
    { name: 'ROUND TIME', get: () => (S.time ? S.time + ' SECONDS' : 'NO LIMIT'), turn: (n) => { const l = [60, 99, 0]; S.time = l[(l.indexOf(S.time) + n + 3) % 3]; } },
    { name: 'MUSIC', get: () => onOff(S.music), turn: () => { S.music = !S.music; } },
    { name: 'SOUND EFFECTS', get: () => onOff(S.sfx), turn: () => { S.sfx = !S.sfx; } },
    { name: 'ANNOUNCER', get: () => onOff(S.announcer), turn: () => { S.announcer = !S.announcer; } },
    { name: 'BLOOD', get: () => onOff(S.blood), turn: () => { S.blood = !S.blood; } },
    { name: 'TV SCANLINES', get: () => onOff(S.scanlines), turn: () => { S.scanlines = !S.scanlines; } },
  ];
  const back = () => { Sound.sfx('move'); setScene(MenuScene()); };
  const change = (n) => { rows[cur].turn(n); saveSettings(); Sound.sfx('pick'); };
  return {
    update() { t++; },
    key(k) {
      if (k === 'up') { cur = (cur + rows.length - 1) % rows.length; Sound.sfx('move'); }
      if (k === 'down') { cur = (cur + 1) % rows.length; Sound.sfx('move'); }
      if (k === 'left') change(-1);
      if (k === 'right' || k === 'ok') change(1);
      if (k === 'back') back();
    },
    draw(c) {
      fireBackground(c, t);
      title(c, 'SETTINGS', 12);
      rows.forEach((r, i) => {
        const y = 42 + i * 20, sel = i === cur;
        rect(c, 58, y - 4, 300, 17, sel ? '#7a1408' : 'rgba(0,0,0,0.55)');
        text(c, r.name, 68, y, { color: sel ? '#fff' : '#c8c0b8' });
        text(c, '< ' + r.get() + ' >', 348, y, { align: 'right', color: sel ? '#ffe14d' : '#fff' });
        zone(58, y - 5, 300, 20, () => { cur = i; change(1); }, () => { cur = i; });
      });
      backButton(c, back);
    },
  };
}

// ---- Touch controls ----
const TOUCH_LABEL = { poster: 'STAR', law: 'LAW', lenka: 'LENKA', power: 'POWER', dive: 'DIVE', guitar: 'GUITAR' };

// Special buttons fade when you can't use them yet, so you never have to read the meter mid-fight.
function specialReady(id) {
  const me = G.world && G.world.f[0];
  if (!me) return false;
  if (id === 'power') return !me.powerUsed;
  if (id === 'poster') return me.starCd <= 0;
  if (id === 'guitar' && me.encore > 0) return true;
  return me.meter >= SPECIALS[id].cost;
}
function specialButton(id) {
  const name = TOUCH_LABEL[id];
  return {
    key: SPECIALS[id].key,
    tap: true,
    label: () => (specialReady(id) ? name : '<span style="opacity:.35">' + name + '</span>'),
  };
}

TouchControls.setup({
  // a firm push to jump or crouch, so walking with a loose thumb doesn't do either by accident
  stick: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', upAt: 0.62, downAt: 0.62 },
  buttons: [
    { label: 'PUNCH', key: 'j' }, { label: 'KICK', key: 'k' }, { label: 'BLOCK', key: 'l' },
    // the suplex needs block and punch together, which is hard with one thumb
    { label: 'THROW', onDown: () => { TouchControls.press('l'); TouchControls.tap('j'); }, onUp: () => TouchControls.release('l') },
  ],
  top: [
    specialButton('poster'), specialButton('law'), specialButton('lenka'),
    specialButton('power'), specialButton('dive'), specialButton('guitar'),
    { label: 'II', key: 'p', tap: true },
  ],
  hidden: () => !(G.scene && G.scene.isFight && !G.paused),
  menuHint: false,
});
if (TouchControls.isTouch) G.touch = true;

// ---- Main loop ----
const STEP = 1000 / 60;
let last = 0, acc = 0;
function drawFrame() {
  clickZones = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1;
  G.scene.draw(ctx);
}
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(100, now - last);
  last = now;
  acc += dt;
  let n = 0;
  while (acc >= STEP && n < 6) { G.scene.update(); G.frame++; acc -= STEP; n++; }
  if (acc >= STEP) acc = 0;
  drawFrame();
}

// ---- Address shortcuts, handy for testing: ?go=fight&p=bill&o=kiwi&s=ostrava&sim=200&cast=lenka@120,guitar@400&hp2=31
function boot() {
  applySettings();
  const q = new URLSearchParams(window.location.search);
  const go = q.get('go');
  G.p1 = q.get('p') || G.p1;
  G.p2 = q.get('o') || G.p2;
  G.stage = q.get('s') || G.stage;
  if (q.get('mode')) G.mode = q.get('mode');
  if (q.get('demo')) G.testBothAI = true;
  setScene(TitleScene());
  if (go === 'menu') setScene(MenuScene());
  if (go === 'select') setScene(SelectScene('p1'));
  if (go === 'stage') setScene(StageScene());
  if (go === 'vs') setScene(VsScene());
  if (go === 'moves') { const m = MovesScene(() => setScene(MenuScene())); setScene(m); for (let i = 0; i < Number(q.get('page') || 0); i++) m.key('right'); }
  if (go === 'settings') setScene(SettingsScene());
  if (go === 'ending') setScene(EndingScene());
  if (go === 'result') setScene(ResultScene(q.get('won') !== '0'));
  if (go === 'fight') {
    setScene(FightScene());
    const w = G.world;
    if (q.get('noai')) w.aiOff = true;
    const cast = (q.get('cast') || '').split(',').filter(Boolean).map((s) => {
      const [id, at] = s.split('@');
      return { id, at: Number(at) };
    });
    if (q.get('hp2')) w.f[1].hp = Number(q.get('hp2'));
    const sim = Number(q.get('sim') || 0);
    for (let i = 0; i < sim; i++) {
      for (const k of cast) {
        if (k.at === i) { w.f[0].meter = 100; queuedCmd = k.id; }
      }
      G.scene.update();
      if (q.get('hp2') && i === 100) w.f[1].hp = Number(q.get('hp2'));
      if (q.get('near') && i === 100) { w.f[0].x = w.f[1].x - Number(q.get('near')); }
    }
  } else {
    const sim = Number(q.get('sim') || 0);
    for (let i = 0; i < sim; i++) G.scene.update();
  }
  requestAnimationFrame((t) => { last = t; loop(t); });
}
if (!window.LSF_NO_BOOT) boot();
