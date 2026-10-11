const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const SHIP_RADIUS = 16;
const FIRE_COOLDOWN = 10; // frames between shots
const INVULN_FRAMES = 120; // safe time after getting hit
const FRAMES_PER_LEVEL = 900; // 15 seconds at 60 fps
const HIGH_SCORE_KEY = 'astroBlasterHighScore';

// Asteroid sizes: big ones split into two of the next size down.
const SIZES = {
  3: { r: 40, score: 20 },
  2: { r: 24, score: 50 },
  1: { r: 14, score: 100 },
};

const keys = {};
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === 'enter' && state.mode !== 'playing') startGame();
  if (k === 'p' && state.mode === 'playing') state.paused = !state.paused;
  if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault();
});
addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
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

const stars = Array.from({ length: 90 }, () => ({
  x: rand(0, W),
  y: rand(0, H),
  speed: rand(0.3, 2.2),
  size: rand(0.5, 2),
}));

let state = {
  mode: 'title',
  highScore: loadHighScore(),
  particles: [],
  asteroids: [],
  bullets: [],
};

function startGame() {
  state = {
    mode: 'playing',
    paused: false,
    highScore: state.highScore,
    newBest: false,
    ship: { x: W / 2, y: H - 70, speed: 4.5, cooldown: 0, invuln: INVULN_FRAMES, tilt: 0, barrel: 1 },
    bullets: [],
    asteroids: [],
    particles: [],
    score: 0,
    lives: 3,
    frames: 0,
    spawnTimer: 30,
  };
}

function level() {
  return 1 + Math.floor(state.frames / FRAMES_PER_LEVEL);
}

function speedMult() {
  return 1 + (level() - 1) * 0.15;
}

function makeAsteroid(size, x, y) {
  const r = SIZES[size].r;
  const mult = speedMult();
  return {
    size,
    r,
    x: x ?? rand(r, W - r),
    y: y ?? -r,
    vx: rand(-0.8, 0.8) * mult,
    vy: rand(1, 2.2) * mult,
    rot: rand(0, Math.PI * 2),
    spin: rand(-0.03, 0.03),
    // Jagged outline: one radius multiplier per vertex.
    points: Array.from({ length: 11 }, () => rand(0.75, 1.15)),
  };
}

function randomSize() {
  const roll = Math.random();
  if (roll < 0.5) return 3;
  if (roll < 0.8) return 2;
  return 1;
}

function splitAsteroid(a) {
  return [-1, 1].map((dir) => {
    const child = makeAsteroid(a.size - 1, a.x, a.y);
    child.vx = dir * rand(1, 2);
    child.vy = a.vy * rand(0.8, 1.2);
    return child;
  });
}

function explode(x, y, count, colors) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(0.5, 4);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(25, 50),
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

function hitShip() {
  const s = state.ship;
  state.lives -= 1;
  explode(s.x, s.y, 40, ['#4cc9f0', '#ff9f1c', '#ffffff']);
  s.invuln = INVULN_FRAMES;
  if (state.lives <= 0) {
    state.mode = 'over';
    if (state.score > state.highScore) {
      state.highScore = state.score;
      state.newBest = true;
      saveHighScore(state.score);
    }
  }
}

function update() {
  for (const st of stars) {
    st.y += st.speed;
    if (st.y > H) {
      st.y = 0;
      st.x = rand(0, W);
    }
  }

  for (const p of state.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.97;
    p.vy *= 0.97;
    p.life -= 1;
  }
  state.particles = state.particles.filter((p) => p.life > 0);

  if (state.mode !== 'playing' || state.paused) return;
  state.frames += 1;
  const s = state.ship;

  let dx = 0;
  let dy = 0;
  if (keys['arrowleft'] || keys['a']) dx -= 1;
  if (keys['arrowright'] || keys['d']) dx += 1;
  if (keys['arrowup'] || keys['w']) dy -= 1;
  if (keys['arrowdown'] || keys['s']) dy += 1;
  const len = Math.hypot(dx, dy) || 1;
  s.x = clamp(s.x + (dx / len) * s.speed, 20, W - 20);
  s.y = clamp(s.y + (dy / len) * s.speed, 40, H - 32);
  // Bank slightly into turns.
  s.tilt += (dx * 0.18 - s.tilt) * 0.2;

  if (s.cooldown > 0) s.cooldown -= 1;
  if (s.invuln > 0) s.invuln -= 1;
  if (keys[' '] && s.cooldown <= 0) {
    // Alternate between the two cannons.
    s.barrel = -s.barrel;
    state.bullets.push({ x: s.x + s.barrel * 6, y: s.y - 34 });
    s.cooldown = FIRE_COOLDOWN;
  }
  for (const b of state.bullets) b.y -= 9;

  state.spawnTimer -= 1;
  if (state.spawnTimer <= 0) {
    state.asteroids.push(makeAsteroid(randomSize()));
    state.spawnTimer = Math.max(18, 75 - (level() - 1) * 8);
  }

  const fragments = [];
  for (const a of state.asteroids) {
    a.x += a.vx;
    a.y += a.vy;
    a.rot += a.spin;

    for (const b of state.bullets) {
      if (b.dead || a.dead) continue;
      if (Math.hypot(b.x - a.x, b.y - a.y) < a.r) {
        b.dead = true;
        a.dead = true;
        state.score += SIZES[a.size].score;
        explode(a.x, a.y, a.size * 8, ['#b9a48c', '#8a7a68', '#ffd166']);
        if (a.size > 1) fragments.push(...splitAsteroid(a));
      }
    }

    if (!a.dead && s.invuln <= 0 && Math.hypot(s.x - a.x, s.y - a.y) < a.r + SHIP_RADIUS) {
      a.dead = true;
      hitShip();
    }
  }

  state.asteroids = state.asteroids
    .filter((a) => !a.dead && a.y - a.r < H && a.x > -a.r * 2 && a.x < W + a.r * 2)
    .concat(fragments);
  state.bullets = state.bullets.filter((b) => !b.dead && b.y > -10);
}

// Top-down take on "The Chow Hauler": a battered gunmetal cargo ship with
// glowing ration canisters, twin cannons, blue engines and a crate on a loader arm.
function drawShip(x, y, scale, flame, tilt = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';

  if (flame) {
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 12;
    for (const ex of [-8, 8]) {
      const len = rand(10, 20);
      ctx.fillStyle = 'rgba(96, 165, 250, 0.85)';
      ctx.beginPath();
      ctx.moveTo(ex - 4, 25);
      ctx.lineTo(ex, 25 + len);
      ctx.lineTo(ex + 4, 25);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(ex - 2, 25);
      ctx.lineTo(ex, 25 + len * 0.55);
      ctx.lineTo(ex + 2, 25);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  // Swept wings.
  ctx.fillStyle = '#2b2f36';
  ctx.strokeStyle = '#4b5260';
  ctx.lineWidth = 1.5;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 11, 0);
    ctx.lineTo(side * 32, 14);
    ctx.lineTo(side * 32, 21);
    ctx.lineTo(side * 11, 19);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Twin cannons and engine pods.
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(-7, -35, 2.5, 12);
  ctx.fillRect(4.5, -35, 2.5, 12);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(-13, 16, 10, 10);
  ctx.fillRect(3, 16, 10, 10);

  // Boxy main hull with panel lines.
  ctx.fillStyle = '#353a43';
  ctx.strokeStyle = '#15171b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-7, -27);
  ctx.lineTo(7, -27);
  ctx.lineTo(12, -17);
  ctx.lineTo(12, 20);
  ctx.lineTo(-12, 20);
  ctx.lineTo(-12, -17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#23262c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-12, -6);
  ctx.lineTo(12, -6);
  ctx.moveTo(-12, 8);
  ctx.lineTo(12, 8);
  ctx.moveTo(0, -6);
  ctx.lineTo(0, 20);
  ctx.stroke();

  // Loader arm out to the cargo crate.
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-18, -2);
  ctx.lineTo(-22, -2);
  ctx.stroke();

  // Orange glowing parts: cockpit, ration canisters, cargo crate.
  ctx.shadowColor = '#ff8c1a';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ff9d3a';
  ctx.beginPath();
  ctx.moveTo(-5, -23);
  ctx.lineTo(5, -23);
  ctx.lineTo(7, -14);
  ctx.lineTo(-7, -14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f28c28';
  ctx.fillRect(-18, -11, 6, 17);
  ctx.fillRect(12, -11, 6, 17);
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(-31, -7, 9, 9);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#7c3f0e';
  for (const cx of [-18, 12]) {
    ctx.fillRect(cx, -6, 6, 2);
    ctx.fillRect(cx, 1, 6, 2);
  }
  ctx.strokeStyle = '#7c3f0e';
  ctx.lineWidth = 1;
  ctx.strokeRect(-31, -7, 9, 9);
  ctx.beginPath();
  ctx.moveTo(-31, -7);
  ctx.lineTo(-22, 2);
  ctx.moveTo(-22, -7);
  ctx.lineTo(-31, 2);
  ctx.stroke();

  // Blue engine nozzles.
  ctx.shadowColor = '#3b82f6';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#93c5fd';
  ctx.fillRect(-11, 24, 6, 2);
  ctx.fillRect(5, 24, 6, 2);

  // Blinking red running lights on the wingtips and nose.
  ctx.shadowColor = '#ef4444';
  ctx.fillStyle = Math.floor(performance.now() / 400) % 2 ? '#ef4444' : '#7f1d1d';
  for (const [lx, ly] of [[-31, 18], [31, 18], [-9, -20], [9, -20]]) {
    ctx.beginPath();
    ctx.arc(lx, ly, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawAsteroid(a) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.rot);
  ctx.fillStyle = '#5a4e44';
  ctx.strokeStyle = '#b9a48c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  a.points.forEach((m, i) => {
    const angle = (i / a.points.length) * Math.PI * 2;
    const px = Math.cos(angle) * a.r * m;
    const py = Math.sin(angle) * a.r * m;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function centerText(text, y, size, color = '#e8e8f0') {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, y);
}

function dim() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, W, H);
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  for (const st of stars) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + st.speed / 3})`;
    ctx.fillRect(st.x, st.y, st.size, st.size);
  }

  for (const a of state.asteroids) drawAsteroid(a);

  ctx.fillStyle = '#ffd166';
  for (const b of state.bullets) ctx.fillRect(b.x - 2, b.y - 8, 4, 12);

  for (const p of state.particles) {
    ctx.globalAlpha = Math.min(1, p.life / 30);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
  }
  ctx.globalAlpha = 1;

  if (state.mode === 'title') {
    centerText('ASTRO BLASTER', 150, 44, '#4cc9f0');
    centerText("Shoot the asteroids. Don't get hit.", 190, 18);
    drawShip(W / 2, 315, 2, true, Math.sin(performance.now() / 600) * 0.08);
    centerText('THE CHOW HAULER', 440, 16, '#f28c28');
    centerText('Press Enter to start', 500, 22, '#ffd166');
    if (state.highScore > 0) centerText(`High score: ${state.highScore}`, 540, 16);
    return;
  }

  const s = state.ship;
  // Blink while invulnerable after a hit.
  const visible = s.invuln <= 0 || Math.floor(s.invuln / 6) % 2 === 0;
  if (state.mode === 'playing' && visible) drawShip(s.x, s.y, 1, !state.paused, s.tilt);

  ctx.fillStyle = '#e8e8f0';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${state.score}`, 12, 26);
  ctx.textAlign = 'center';
  ctx.fillText(`Level ${level()}`, W / 2, 26);
  for (let i = 0; i < state.lives; i++) drawShip(W - 22 - i * 26, 22, 0.35, false);

  if (state.paused) {
    dim();
    centerText('PAUSED', H / 2, 40);
    centerText('Press P to resume', H / 2 + 36, 18);
  }

  if (state.mode === 'over') {
    dim();
    centerText('GAME OVER', H / 2 - 40, 44, '#e5484d');
    centerText(`Score: ${state.score}`, H / 2 + 5, 24);
    centerText(
      state.newBest ? 'New high score!' : `High score: ${state.highScore}`,
      H / 2 + 40,
      18,
      state.newBest ? '#ffd166' : '#e8e8f0',
    );
    centerText('Press Enter to play again', H / 2 + 85, 20, '#ffd166');
  }
}

// Fixed 60 updates per second so the game runs at the same speed on any monitor.
const STEP = 1000 / 60;
let last = performance.now();
let acc = 0;

function loop(now) {
  acc += Math.min(now - last, 250);
  last = now;
  while (acc >= STEP) {
    update();
    acc -= STEP;
  }
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
