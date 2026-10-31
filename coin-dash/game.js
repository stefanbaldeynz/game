const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const keys = {};
addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ' && state.over) reset();
  if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault();
});
addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

let state;

// On phones and tablets the arena takes the shape of the screen, so it fills it either way up.
function fitArena() {
  if (!(window.TouchControls && TouchControls.isTouch)) return;
  const shortSide = 480;
  if (innerHeight > innerWidth) {
    canvas.width = shortSide;
    canvas.height = Math.round((shortSide * innerHeight) / innerWidth);
  } else {
    canvas.height = shortSide;
    canvas.width = Math.round((shortSide * innerWidth) / innerHeight);
  }
  if (!state) return;
  // Keep everything inside the new edges.
  const p = state.player;
  p.x = Math.min(canvas.width - p.r, p.x);
  p.y = Math.min(canvas.height - p.r, p.y);
  const c = state.coin;
  c.x = Math.min(canvas.width - 20, c.x);
  c.y = Math.min(canvas.height - 20, c.y);
  for (const e of state.enemies) {
    e.x = Math.min(canvas.width - e.size, e.x);
    e.y = Math.min(canvas.height - e.size, e.y);
  }
}
fitArena();
addEventListener('resize', fitArena);

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnCoin() {
  return { x: rand(20, canvas.width - 20), y: rand(20, canvas.height - 20), r: 8 };
}

function spawnEnemy() {
  const speed = 1.5 + state.score * 0.1;
  const angle = rand(0, Math.PI * 2);
  return {
    x: rand(0, canvas.width - 24),
    y: rand(0, canvas.height - 24),
    size: 24,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  };
}

function reset() {
  state = {
    player: { x: canvas.width / 2, y: canvas.height / 2, r: 14, speed: 4 },
    coin: null,
    enemies: [],
    score: 0,
    over: false,
  };
  state.coin = spawnCoin();
  state.enemies.push(spawnEnemy());
}

function update() {
  if (state.over) return;
  const p = state.player;

  let dx = 0;
  let dy = 0;
  if (keys['arrowleft'] || keys['a']) dx -= 1;
  if (keys['arrowright'] || keys['d']) dx += 1;
  if (keys['arrowup'] || keys['w']) dy -= 1;
  if (keys['arrowdown'] || keys['s']) dy += 1;
  const len = Math.hypot(dx, dy) || 1;
  p.x = Math.min(canvas.width - p.r, Math.max(p.r, p.x + (dx / len) * p.speed));
  p.y = Math.min(canvas.height - p.r, Math.max(p.r, p.y + (dy / len) * p.speed));

  const c = state.coin;
  if (Math.hypot(p.x - c.x, p.y - c.y) < p.r + c.r) {
    state.score += 1;
    state.coin = spawnCoin();
    if (state.score % 3 === 0) state.enemies.push(spawnEnemy());
  }

  for (const e of state.enemies) {
    e.x += e.vx;
    e.y += e.vy;
    if (e.x < 0 || e.x + e.size > canvas.width) e.vx *= -1;
    if (e.y < 0 || e.y + e.size > canvas.height) e.vy *= -1;

    // Circle vs. square collision: clamp the player's centre onto the square.
    const nx = Math.max(e.x, Math.min(p.x, e.x + e.size));
    const ny = Math.max(e.y, Math.min(p.y, e.y + e.size));
    if (Math.hypot(p.x - nx, p.y - ny) < p.r) state.over = true;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f5c542';
  ctx.beginPath();
  ctx.arc(state.coin.x, state.coin.y, state.coin.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e5484d';
  for (const e of state.enemies) ctx.fillRect(e.x, e.y, e.size, e.size);

  ctx.fillStyle = '#4cc9f0';
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, state.player.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e8e8f0';
  ctx.font = '20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${state.score}`, 12, 28);

  if (state.over) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e8e8f0';
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText(`Score: ${state.score}  ·  ${window.TouchControls && TouchControls.isTouch ? 'Tap' : 'Press Space'} to play again`, canvas.width / 2, canvas.height / 2 + 30);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

reset();
loop();
