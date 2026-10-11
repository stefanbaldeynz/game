// Kiwi Canyon: tower defense in a New Zealand canyon, with a first-person mode down on the canyon floor.

if (typeof THREE === 'undefined') {
  document.getElementById('overlay-text').textContent =
    'Could not load the 3D engine (three.js). Check your internet connection and reload the page.';
  throw new Error('three.js failed to load');
}

// ---------- Page elements ----------

const $ = (id) => document.getElementById(id);
const ui = {
  overlay: $('overlay'),
  overlayTitle: $('overlay-title'),
  overlayText: $('overlay-text'),
  overlayButton: $('overlay-button'),
  wave: $('wave'),
  lives: $('lives'),
  money: $('money'),
  kiwisLeft: $('kiwis'),
  waveButton: $('wave-button'),
  message: $('message'),
  tdPanel: $('td-panel'),
  buildCost: $('build-cost'),
  rifleButton: $('rifle-button'),
  fpsButton: $('fps-button'),
  towerPanel: $('tower-panel'),
  towerTitle: $('tower-title'),
  towerStats: $('tower-stats'),
  upgradeButton: $('upgrade-button'),
  closeTower: $('close-tower'),
  fpsHud: $('fps-hud'),
  ammo: $('ammo'),
  rifleLevel: $('rifle-level'),
  paused: $('paused-label'),
};

// ---------- Renderer, scene, cameras ----------

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.autoClear = false;
$('game').appendChild(renderer.domElement);
const canvas = renderer.domElement;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfe3ee);
scene.fog = new THREE.FogExp2(0xcfe3ee, 0.004);
scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x5a6a3a, 0.75));
const sun = new THREE.DirectionalLight(0xfff0d8, 1.0);
sun.position.set(WORLD_W / 2 - 35, 70, WORLD_D / 2 + 25);
sun.target.position.set(WORLD_W / 2, 0, WORLD_D / 2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 200 });
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);

// Tower view: looking down at the canyon from above.
const tdCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 1200);
const tdView = { x: WORLD_W / 2, z: WORLD_D / 2 + 2, distance: 60 };

// First-person view: on the canyon floor.
const fpsCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1200);
fpsCamera.rotation.order = 'YXZ';

// The rifle is drawn in its own scene on top, so it never pokes through walls.
const weaponScene = new THREE.Scene();
const weaponCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10);
weaponScene.add(new THREE.HemisphereLight(0xfff4e0, 0x4a5a3a, 1.2));
const weaponLight = new THREE.DirectionalLight(0xffffff, 0.8);
weaponLight.position.set(-1, 1, 0.5);
weaponScene.add(weaponLight);

buildWorld(scene);
const dust = new Particles(scene, { max: 1500, texture: Textures.softDot() });
const feathers = new Particles(scene, { max: 1500, texture: Textures.feather() });
const tracer = new Tracer(scene);

const rifleView = buildRifleModel();
rifleView.flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: Textures.softDot(), color: 0xffd080, blending: THREE.AdditiveBlending, depthWrite: false }));
rifleView.flash.position.copy(rifleView.muzzle);
rifleView.flash.scale.setScalar(0.25);
rifleView.group.add(rifleView.flash);
rifleView.group.scale.setScalar(0.8);
weaponScene.add(rifleView.group);

// Tower-view helpers: build preview, range rings and a marker showing where you'll drop in.
const ghost = new THREE.Mesh(
  new THREE.CylinderGeometry(1.1, 1.3, 2, 16),
  new THREE.MeshBasicMaterial({ color: 0x40ff60, transparent: true, opacity: 0.4, depthWrite: false }),
);
scene.add(ghost);

function makeRing(color) {
  const ring = new THREE.Group();
  const line = new THREE.Mesh(
    new THREE.RingGeometry(0.97, 1, 96),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthTest: false, side: THREE.DoubleSide }),
  );
  const fill = new THREE.Mesh(
    new THREE.CircleGeometry(1, 64),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.1, depthTest: false, depthWrite: false, side: THREE.DoubleSide }),
  );
  ring.add(line, fill);
  ring.rotation.x = -Math.PI / 2;
  ring.renderOrder = 10;
  line.renderOrder = fill.renderOrder = 10;
  scene.add(ring);
  return ring;
}
const hoverRing = makeRing(0xffffff);
const selectRing = makeRing(0xffd84a);

const playerMarker = new THREE.Group();
addPart(playerMarker, new THREE.CylinderGeometry(0.35, 0.35, 1.4, 12), new THREE.MeshStandardMaterial({ color: 0x2f7fe0 }), 0, 0.7, 0);
addPart(playerMarker, new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshStandardMaterial({ color: 0xf0c8a0 }), 0, 1.6, 0);
addPart(playerMarker, new THREE.ConeGeometry(0.25, 0.6, 8), new THREE.MeshBasicMaterial({ color: 0x5ab0ff }), 0, 0.7, -0.5).rotation.x = -Math.PI / 2;
playerMarker.traverse((o) => { o.castShadow = true; });
scene.add(playerMarker);

// ---------- Game state ----------

const game = {
  state: 'title', // title | playing | lost | won
  mode: 'tower',  // tower | fps
  paused: false,
  money: CONFIG.startMoney,
  lives: CONFIG.startLives,
  wave: 0,
  waveActive: false,
  toSpawn: 0,
  spawnTimer: 0,
  countdown: -1,
  kiwis: [],
  towers: [],
  bolts: [],
  rifleLevel: 0,
  selected: null,
  hover: null,
  kills: 0,
};

const keys = {};
let mouseDown = false;
const mouse = new THREE.Vector2();
let mouseOverCanvas = false;

// ---------- Waves ----------

function startWave() {
  if (game.state !== 'playing' || game.waveActive || game.wave >= CONFIG.totalWaves) return;
  game.wave += 1;
  game.waveActive = true;
  game.toSpawn = CONFIG.kiwi.count(game.wave);
  game.spawnTimer = 0;
  game.countdown = -1;
  Sound.waveStart();
  showMessage(`Wave ${game.wave}: ${game.toSpawn} level ${game.wave} kiwis incoming!`);
}

function updateWaves(dt) {
  if (game.waveActive) {
    if (game.toSpawn > 0) {
      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0) {
        game.kiwis.push(new Kiwi(scene, game.wave));
        game.toSpawn -= 1;
        game.spawnTimer = CONFIG.kiwi.spawnInterval(game.wave);
      }
    } else if (game.kiwis.length === 0) {
      game.waveActive = false;
      const bonus = CONFIG.waveBonus(game.wave);
      game.money += bonus;
      if (game.wave >= CONFIG.totalWaves) {
        endGame(true);
      } else {
        game.countdown = CONFIG.timeBetweenWaves;
        showMessage(`Wave ${game.wave} cleared! +$${bonus} bonus`);
      }
    }
  } else if (game.countdown > 0) {
    game.countdown -= dt;
    if (game.countdown <= 0) startWave();
  }
}

function updateKiwis(dt) {
  for (const kiwi of game.kiwis) {
    kiwi.update(dt);
    if (kiwi.escaped && !kiwi.dead) {
      kiwi.dead = true;
      kiwi.remove();
      game.lives -= 1;
      Sound.escape();
      showMessage(`A kiwi got through! ${Math.max(0, game.lives)} lives left`);
      if (game.lives <= 0) endGame(false);
    }
  }
  game.kiwis = game.kiwis.filter((k) => !k.dead);
}

function damageKiwi(kiwi, amount, at) {
  if (kiwi.dead) return;
  kiwi.hp -= amount;
  for (let i = 0; i < 3; i++) emitFeather(at, 2);
  if (kiwi.hp > 0) return;
  kiwi.dead = true;
  kiwi.remove();
  const center = new THREE.Vector3(kiwi.x, kiwi.centerY, kiwi.z);
  for (let i = 0; i < 28; i++) emitFeather(center, 4);
  game.money += CONFIG.killReward;
  game.kills += 1;
  floatText(`+$${CONFIG.killReward}`, center.setY(center.y + 1.2));
  Sound.kiwi();
  Sound.coin();
}

function emitFeather(at, speed) {
  const shade = rand(0.3, 0.55);
  feathers.emit({
    x: at.x, y: at.y, z: at.z,
    vx: rand(-speed, speed), vy: rand(0.5, speed * 1.2), vz: rand(-speed, speed),
    life: rand(0.8, 1.6), size: rand(0.18, 0.32), color: [shade, shade * 0.7, shade * 0.42], gravity: -3,
  });
}

function spawnBolt(from, target, damage, level) {
  game.bolts.push(createBolt(scene, from, target, damage, level));
  const volume = game.mode === 'fps' ? Math.max(0.15, 1 - Math.hypot(from.x - player.x, from.z - player.z) / 40) : 0.5;
  Sound.tower(volume);
}

function endGame(won) {
  game.state = won ? 'won' : 'lost';
  mouseDown = false;
  if (document.pointerLockElement) document.exitPointerLock();
  game.mode = 'tower';
  if (won) {
    showOverlay('Canyon defended!', `All ${CONFIG.totalWaves} waves stopped with ${game.lives} lives left. ${game.kills} kiwis turned back.`, 'Click to play again');
  } else {
    showOverlay('The kiwis broke through!', `You held the canyon until wave ${game.wave} and stopped ${game.kills} kiwis.`, 'Click to try again');
  }
}

// ---------- Building and upgrading ----------

function towerAt(col, row) {
  return game.towers.find((t) => t.col === col && t.row === row) || null;
}

function buildTower(col, row) {
  if (game.money < CONFIG.tower.buildCost) {
    Sound.error();
    showMessage(`Not enough money. A tower costs $${CONFIG.tower.buildCost}`);
    return;
  }
  game.money -= CONFIG.tower.buildCost;
  game.towers.push(new Tower(scene, col, row));
  Sound.build();
}

function upgradeSelected() {
  const tower = game.selected;
  if (!tower || tower.upgradeCost === null) return;
  if (game.money < tower.upgradeCost) {
    Sound.error();
    showMessage(`Not enough money. That upgrade costs $${tower.upgradeCost}`);
    return;
  }
  game.money -= tower.upgradeCost;
  tower.upgrade();
  Sound.upgrade();
  showMessage(`Tower upgraded to level ${tower.level + 1}`);
}

function upgradeRifle() {
  const next = CONFIG.rifle.levels[game.rifleLevel + 1];
  if (!next) return;
  if (game.money < next.upgradeCost) {
    Sound.error();
    showMessage(`Not enough money. The rifle upgrade costs $${next.upgradeCost}`);
    return;
  }
  game.money -= next.upgradeCost;
  game.rifleLevel += 1;
  Sound.upgrade();
  showMessage(`Rifle upgraded: ${next.damage} damage per shot`);
}

function select(tower) {
  game.selected = tower;
}

// Which map cell is under the mouse in tower view.
const raycaster = new THREE.Raycaster();
const rimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -RIM_H);
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function pickCell() {
  raycaster.setFromCamera(mouse, tdCamera);
  const hit = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(rimPlane, hit)) return null;
  let col = cellOf(hit.x);
  let row = cellOf(hit.z);
  if (isCanyonCell(col, row) && raycaster.ray.intersectPlane(floorPlane, hit)) {
    col = cellOf(hit.x);
    row = cellOf(hit.z);
  }
  if (cellAt(col, row) === 'X') return null;
  return { col, row };
}

function handleMapClick() {
  if (game.state !== 'playing' || game.mode !== 'tower') return;
  const cell = pickCell();
  if (!cell) return select(null);
  const tower = towerAt(cell.col, cell.row);
  if (tower) return select(tower);
  if (isBuildable(cell.col, cell.row)) {
    select(null);
    return buildTower(cell.col, cell.row);
  }
  if (isCanyonCell(cell.col, cell.row)) {
    const c = cellCenter(cell.col, cell.row);
    player.x = c.x;
    player.z = c.z;
    showMessage('You will drop in here. Press F for first-person mode');
  }
  select(null);
}

// ---------- Switching views ----------

function enterFps() {
  if (game.state !== 'playing' || game.mode === 'fps') return;
  const request = canvas.requestPointerLock();
  if (request && request.catch) request.catch(() => showMessage('Click the game, then press F again'));
}

function toggleView() {
  if (game.mode === 'fps') document.exitPointerLock();
  else enterFps();
}

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === canvas) {
    game.mode = 'fps';
    game.paused = false;
    select(null);
  } else if (game.mode === 'fps') {
    game.mode = 'tower';
    mouseDown = false;
  }
});

// ---------- Input ----------

addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (game.state !== 'playing') return;
  if (e.code === 'KeyF') toggleView();
  if (e.code === 'KeyN') startWave();
  if (game.mode === 'fps') {
    if (e.code === 'KeyR') startReload();
  } else {
    if (e.code === 'KeyU') upgradeSelected();
    if (e.code === 'KeyP') game.paused = !game.paused;
    if (e.code === 'Escape') select(null);
  }
});
addEventListener('keyup', (e) => {
  keys[e.code] = false;
});
addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  mouseDown = false;
});

canvas.addEventListener('mousemove', (e) => {
  mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  mouseOverCanvas = true;
});
canvas.addEventListener('mouseleave', () => {
  mouseOverCanvas = false;
});
canvas.addEventListener('click', handleMapClick);
canvas.addEventListener('wheel', (e) => {
  if (game.mode !== 'tower') return;
  tdView.distance = clamp(tdView.distance * (e.deltaY > 0 ? 1.1 : 0.9), 30, 110);
}, { passive: true });

document.addEventListener('mousemove', (e) => {
  if (game.mode !== 'fps') return;
  player.yaw -= e.movementX * MOUSE_SENSITIVITY;
  player.pitch = clamp(player.pitch - e.movementY * MOUSE_SENSITIVITY, -1.4, 1.4);
});
document.addEventListener('mousedown', (e) => {
  if (e.button === 0 && game.mode === 'fps') mouseDown = true;
});
document.addEventListener('mouseup', (e) => {
  if (e.button === 0) mouseDown = false;
});

ui.waveButton.addEventListener('click', startWave);
ui.fpsButton.addEventListener('click', enterFps);
ui.rifleButton.addEventListener('click', upgradeRifle);
ui.upgradeButton.addEventListener('click', upgradeSelected);
ui.closeTower.addEventListener('click', () => select(null));

ui.overlay.addEventListener('click', () => {
  if (game.state !== 'title') {
    location.reload();
    return;
  }
  Sound.init();
  startGame();
});

function startGame() {
  game.state = 'playing';
  ui.overlay.classList.add('hidden');
  showMessage(`Build ${Math.floor(CONFIG.startMoney / CONFIG.tower.buildCost)} towers on the rim, then press N to start wave 1`, 6);
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  for (const cam of [tdCamera, fpsCamera, weaponCamera]) {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
  }
});

// ---------- Tower view camera and hover ----------

function updateTowerView(dt) {
  const pan = 32 * dt * (tdView.distance / 72);
  if (keys.KeyW || keys.ArrowUp) tdView.z -= pan;
  if (keys.KeyS || keys.ArrowDown) tdView.z += pan;
  if (keys.KeyA || keys.ArrowLeft) tdView.x -= pan;
  if (keys.KeyD || keys.ArrowRight) tdView.x += pan;
  tdView.x = clamp(tdView.x, 0, WORLD_W);
  tdView.z = clamp(tdView.z, 0, WORLD_D);
  tdCamera.position.set(tdView.x, tdView.distance * 0.95, tdView.z + tdView.distance * 0.33); // steep, so you can see into the canyon
  tdCamera.lookAt(tdView.x, 0, tdView.z);
}

function placeRing(ring, x, z, radius) {
  ring.visible = true;
  ring.position.set(x, RIM_H + 0.1, z);
  ring.scale.setScalar(radius);
}

function updateHelpers() {
  const towerMode = game.mode === 'tower' && game.state === 'playing';
  ghost.visible = false;
  hoverRing.visible = false;
  selectRing.visible = false;
  playerMarker.visible = game.mode === 'tower';
  playerMarker.position.set(player.x, 0, player.z);
  playerMarker.rotation.y = player.yaw;
  canvas.style.cursor = 'default';
  if (!towerMode) return;

  if (game.selected) placeRing(selectRing, game.selected.x, game.selected.z, game.selected.stats.range);
  const cell = mouseOverCanvas ? pickCell() : null;
  if (!cell) return;
  const tower = towerAt(cell.col, cell.row);
  if (tower) {
    canvas.style.cursor = 'pointer';
    if (tower !== game.selected) placeRing(hoverRing, tower.x, tower.z, tower.stats.range);
  } else if (isBuildable(cell.col, cell.row)) {
    canvas.style.cursor = 'pointer';
    const { x, z } = cellCenter(cell.col, cell.row);
    const affordable = game.money >= CONFIG.tower.buildCost;
    ghost.visible = true;
    ghost.position.set(x, RIM_H + 1, z);
    ghost.material.color.setHex(affordable ? 0x40ff60 : 0xff4040);
    placeRing(hoverRing, x, z, CONFIG.tower.levels[0].range);
  } else if (isCanyonCell(cell.col, cell.row)) {
    canvas.style.cursor = 'crosshair';
  }
}

// ---------- HUD ----------

let messageTimer = 0;

function showMessage(text, seconds = 3) {
  ui.message.textContent = text;
  ui.message.style.opacity = 1;
  messageTimer = seconds;
}

function showOverlay(title, text, button) {
  ui.overlayTitle.textContent = title;
  ui.overlayText.textContent = text;
  ui.overlayButton.textContent = button;
  document.querySelector('.howto').classList.add('hidden');
  ui.overlay.classList.remove('hidden');
}

function updateHud(dt) {
  const playing = game.state === 'playing';
  const fps = game.mode === 'fps';
  ui.wave.textContent = `${game.wave} / ${CONFIG.totalWaves}`;
  ui.lives.textContent = Math.max(0, game.lives);
  ui.money.textContent = `$${game.money}`;
  ui.kiwisLeft.textContent = game.kiwis.length + game.toSpawn;

  let waveLabel = '';
  if (playing && !game.waveActive && game.wave < CONFIG.totalWaves) {
    waveLabel = game.countdown > 0
      ? `Wave ${game.wave + 1} in ${Math.ceil(game.countdown)}s · start now [N]`
      : `Start wave ${game.wave + 1} [N]`;
  }
  ui.waveButton.textContent = waveLabel;
  ui.waveButton.classList.toggle('hidden', !waveLabel);

  ui.tdPanel.classList.toggle('hidden', fps || !playing);
  ui.fpsHud.classList.toggle('hidden', !fps);
  ui.paused.classList.toggle('hidden', !game.paused || fps);
  ui.buildCost.textContent = `$${CONFIG.tower.buildCost}`;

  const nextRifle = CONFIG.rifle.levels[game.rifleLevel + 1];
  ui.rifleButton.textContent = nextRifle
    ? `Upgrade rifle to level ${game.rifleLevel + 2} · $${nextRifle.upgradeCost}`
    : 'Rifle fully upgraded';
  ui.rifleButton.disabled = !nextRifle || game.money < nextRifle.upgradeCost;

  const tower = game.selected;
  ui.towerPanel.classList.toggle('hidden', !tower || fps || !playing);
  if (tower) {
    const s = tower.stats;
    ui.towerTitle.textContent = `Tower · level ${tower.level + 1} of ${CONFIG.tower.levels.length}`;
    ui.towerStats.textContent = `Damage ${s.damage} · ${s.fireRate} shots/s · range ${s.range}`;
    const cost = tower.upgradeCost;
    ui.upgradeButton.textContent = cost === null ? 'Fully upgraded' : `Upgrade to level ${tower.level + 2} · $${cost} [U]`;
    ui.upgradeButton.disabled = cost === null || game.money < cost;
  }

  ui.ammo.textContent = player.reloadTimer > 0 ? 'Reloading…' : `${player.ammo} / ${CONFIG.rifle.magazine}`;
  ui.rifleLevel.textContent = game.rifleLevel + 1;

  messageTimer -= dt;
  if (messageTimer <= 0) ui.message.style.opacity = 0;
}

// ---------- Main loop ----------

const clock = new THREE.Clock();

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const running = game.state === 'playing' && !game.paused;

  if (running) {
    updateWaves(dt);
    updateKiwis(dt);
    for (const tower of game.towers) tower.update(dt, game.kiwis, spawnBolt);
    for (const bolt of game.bolts) updateBolt(bolt, dt, damageKiwi);
    game.bolts = game.bolts.filter((b) => !b.done);
  }
  if (game.mode === 'fps') {
    if (running) updatePlayer(dt);
    updateRifleView(dt);
  } else {
    updateTowerView(dt);
  }
  updateHelpers();

  const camera = game.mode === 'fps' ? fpsCamera : tdCamera;
  for (const kiwi of game.kiwis) kiwi.updateBar(camera, game.mode === 'tower');
  if (running) {
    dust.update(dt);
    feathers.update(dt);
    tracer.update(dt);
  }
  dust.setCamera(camera, renderer);
  feathers.setCamera(camera, renderer);
  updateFloaters(dt, camera);
  updateHud(dt);
  Sound.update(dt);

  renderer.clear();
  renderer.render(scene, camera);
  if (game.mode === 'fps') {
    renderer.clearDepth();
    renderer.render(weaponScene, weaponCamera);
  }
}

frame();
