// Hellkeep round 5: The Hellgate Siege. Tower defence with a first-person mode, based on
// Kiwi Canyon. Build fire towers on the rim of the gorge, upgrade them, and drop into the
// gorge with your rifle. Three waves: hellhounds, ice elephants, then devils.

if (typeof THREE === 'undefined') {
  document.getElementById('overlay-text').textContent =
    'Could not load the 3D engine (three.js). Check your internet connection and reload the page.';
  throw new Error('three.js failed to load');
}

const EYE_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.4;
const WALK_SPEED = 7;
const SPRINT_SPEED = 10.5;
const MOUSE_SENSITIVITY = 0.0022;
const SHOT_RANGE = 90;
const ROUND_NUMBER = 5;
const TOTAL_WAVES = SIEGE.waves.length;

// ---------- Page elements ----------

const $ = (id) => document.getElementById(id);
const ui = {
  overlay: $('overlay'),
  overlayTitle: $('overlay-title'),
  overlayRound: $('overlay-round'),
  overlayText: $('overlay-text'),
  overlayButton: $('overlay-button'),
  round: $('round'),
  wave: $('wave'),
  lives: $('lives'),
  money: $('money'),
  beastsLeft: $('beasts'),
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
ui.overlayRound.textContent = SIEGE.title;
ui.overlayText.textContent = SIEGE.intro;
ui.round.textContent = SIEGE.title;
buildRoundPicker(ROUND_NUMBER, () => overlayAction());
ui.overlayButton.textContent = `Play round ${ROUND_NUMBER}`;

// ---------- Renderer, scene, cameras ----------

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
$('game').appendChild(renderer.domElement);
const canvas = renderer.domElement;

const scene = new THREE.Scene();
scene.background = new THREE.Color(THEME.background);
scene.fog = new THREE.FogExp2(0x2a0806, 0.006);
scene.add(new THREE.HemisphereLight(0xff9a6a, 0x200808, 0.55 * LIGHT_UNITS));
const sun = new THREE.DirectionalLight(0xff8a50, 1.2 * LIGHT_UNITS); // the burning sky
sun.position.set(WORLD_W / 2 - 35, 70, WORLD_D / 2 + 25);
sun.target.position.set(WORLD_W / 2, 0, WORLD_D / 2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 200 });
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.03;
sun.shadow.radius = 2;
scene.add(sun, sun.target);

// One camera, moved between the tower view (high above the gorge) and first person.
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1200);
camera.rotation.order = 'YXZ';
const tdView = { x: WORLD_W / 2, z: WORLD_D / 2 + 2, distance: 60 };

// The rifle is drawn in its own scene on top, so it never pokes through walls.
const weaponScene = new THREE.Scene();
const weaponCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10);
weaponScene.add(new THREE.HemisphereLight(0xffc49a, 0x3a1010, 0.5 * LIGHT_UNITS));
const weaponKey = new THREE.DirectionalLight(0xff9a60, 0.9 * LIGHT_UNITS);
weaponKey.position.set(-1, 1, 0.5);
weaponScene.add(weaponKey);
const weaponFlash = new THREE.PointLight(0xffb060, 0, 3);
weaponFlash.position.set(0.15, 0, -0.9);
weaponScene.add(weaponFlash);
const gunLight = new THREE.PointLight(0xffb060, 0, 16, 1.5);
scene.add(gunLight);

const graphics = createGraphics(renderer, scene, camera, weaponScene, weaponCamera);
const world = buildSiegeWorld(scene);
graphics.useSkyForLighting(world.sky);

const glowTexture = Textures.glow();
const effects = {
  fire: new ParticleSystem(scene, { max: 5000, size: 0.55, texture: glowTexture, damping: 0.96, palette: 'fire' }),
  frost: new ParticleSystem(scene, { max: 3000, size: 0.5, texture: glowTexture, damping: 0.96, palette: 'frost' }),
  sparks: new ParticleSystem(scene, { max: 2000, size: 0.13, texture: glowTexture, damping: 0.97, palette: 'fire' }),
  smoke: new ParticleSystem(scene, { max: 900, size: 2.2, texture: glowTexture, damping: 0.99, palette: 'smoke' }),
};

const rifle = buildRifle();
rifle.flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0xffc070, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
rifle.flash.position.copy(rifle.muzzle);
rifle.flash.scale.setScalar(0.22);
rifle.group.add(rifle.flash);
rifle.group.scale.setScalar(0.8);
weaponScene.add(rifle.group);

// A streak of light from the gun to where the bullet landed.
const tracer = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
  new THREE.LineBasicMaterial({ color: new THREE.Color(3, 2.2, 1.2) }),
);
tracer.frustumCulled = false;
tracer.visible = false;
scene.add(tracer);
let tracerTimer = 0;

// Tower-view helpers: build preview, range rings and a marker showing where you'll drop in.
const ghost = new THREE.Mesh(
  new THREE.CylinderGeometry(1.0, 1.25, 2, 8),
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
  ring.renderOrder = line.renderOrder = fill.renderOrder = 10;
  scene.add(ring);
  return ring;
}
const hoverRing = makeRing(0xffffff);
const selectRing = makeRing(0xffb030);

// You, seen from above: a small figure in red armour with a glowing arrow.
const playerMarker = new THREE.Group();
addPart(playerMarker, new THREE.CylinderGeometry(0.35, 0.35, 1.4, 12), new THREE.MeshStandardMaterial({ color: 0x8a1a10, metalness: 0.4, roughness: 0.5 }), 0, 0.7, 0);
addPart(playerMarker, new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshStandardMaterial({ color: 0x8a8e98, metalness: 0.9, roughness: 0.3 }), 0, 1.6, 0);
addPart(playerMarker, new THREE.ConeGeometry(0.25, 0.6, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x60e8ff).multiplyScalar(2) }), 0, 0.7, -0.5).rotation.x = -Math.PI / 2;
playerMarker.traverse((o) => { o.castShadow = true; });
scene.add(playerMarker);

// ---------- Game state ----------

const playerStart = siegeCellCenter(8, 6);
const player = {
  x: playerStart.x,
  z: playerStart.z,
  yaw: -Math.PI / 2, // facing up the gorge towards the hellgate
  pitch: -0.05,
  ammo: SIEGE.rifle.magazine,
  reloadTimer: 0,
  cooldown: 0,
  recoil: 0,
  flash: 0,
  bobPhase: 0,
  moveAmount: 0,
};

const game = {
  state: 'title', // title | playing | lost | won
  mode: 'tower',  // tower | fps
  paused: false,
  money: SIEGE.startMoney,
  lives: SIEGE.startLives,
  wave: 0,
  waveActive: false,
  toSpawn: 0,
  spawnTimer: 0,
  countdown: -1,
  beasts: [],
  towers: [],
  fireballs: [],
  rifleLevel: 0,
  selected: null,
  kills: 0,
  fireSound: 0,
};

const keys = {};
let mouseDown = false;
const mouse = new THREE.Vector2();
let mouseOverCanvas = false;

// ---------- Waves ----------

function waveConfig(n = game.wave) {
  return SIEGE.waves[Math.max(0, n - 1)];
}

function startWave() {
  if (game.state !== 'playing' || game.waveActive || game.wave >= TOTAL_WAVES) return;
  game.wave += 1;
  const wave = waveConfig();
  game.waveActive = true;
  game.toSpawn = wave.count;
  game.spawnTimer = 0;
  game.countdown = -1;
  Sound.roar();
  if (wave.type === 'devil') Music.setSection('boss');
  showMessage(`Wave ${game.wave}: ${wave.count} ${wave.name.toLowerCase()} pour out of the hellgate!`, 4);
}

function updateWaves(dt) {
  if (game.waveActive) {
    const wave = waveConfig();
    if (game.toSpawn > 0) {
      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0) {
        game.beasts.push(new SiegeBeast(scene, wave, effects));
        game.toSpawn -= 1;
        game.spawnTimer = wave.spacing;
        // The hellgate flares as each one comes through.
        const at = world.portal.at;
        for (let i = 0; i < 20; i++) effects.fire.emit(at.x, at.y, at.z, rand(-2, 2), rand(0, 3), rand(-2, 2), rand(0.3, 0.7), 1);
      }
    } else if (game.beasts.every((b) => b.dead)) {
      game.waveActive = false;
      game.money += wave.bonus;
      if (game.wave >= TOTAL_WAVES) {
        endGame(true);
      } else {
        game.countdown = SIEGE.timeBetweenWaves;
        const next = waveConfig(game.wave + 1);
        showMessage(`Wave ${game.wave} beaten! +${wave.bonus} souls. Next: ${next.name.toLowerCase()}`, 4);
      }
    }
  } else if (game.countdown > 0) {
    game.countdown -= dt;
    if (game.countdown <= 0) startWave();
  }
}

function updateBeasts(dt, t) {
  for (const beast of game.beasts) {
    beast.update(dt, t);
    if (beast.escaped && !beast.dead) {
      beast.dead = true;
      beast.remove();
      game.lives -= beast.wave.cost;
      Sound.hurt();
      showMessage(`A ${beast.type === 'hound' ? 'hellhound' : beast.type} reached the keep! ${Math.max(0, game.lives)} lives left`);
      if (game.lives <= 0) endGame(false);
    }
  }
  game.beasts = game.beasts.filter((b) => !b.gone);
}

function damageBeast(beast, amount, at) {
  if (beast.dead) return;
  for (let i = 0; i < 4; i++) effects.sparks.emit(at.x, at.y, at.z, rand(-3, 3), rand(0, 3), rand(-3, 3), rand(0.2, 0.45), -9);
  if (!beast.hit(amount)) return;
  const reward = beast.wave.reward;
  game.money += reward;
  game.kills += 1;
  floatText(`+${reward}`, new THREE.Vector3(beast.x, beast.centerY + 1.5, beast.z));
  if (beast.type === 'hound') Sound.yelp();
  else if (beast.type === 'elephant') Sound.elephantDeath();
  else {
    Sound.explosion();
    Sound.powerChord();
  }
  Sound.pickup();
}

function towerFire(from, target, damage, level) {
  game.fireballs.push(createSiegeFireball(scene, from, target, damage, level));
  if (game.fireSound <= 0) {
    Sound.fireball();
    game.fireSound = 0.12;
  }
}

function fireballTrail(x, y, z, level) {
  const system = level === 3 ? effects.frost : effects.fire;
  system.emit(x, y, z, rand(-0.4, 0.4), rand(0, 0.6), rand(-0.4, 0.4), rand(0.15, 0.3), 1);
}

function endGame(won) {
  game.state = won ? 'won' : 'lost';
  mouseDown = false;
  if (document.pointerLockElement) document.exitPointerLock();
  game.mode = 'tower';
  Music.stop();
  if (won) {
    showOverlay('Hellkeep conquered', `The gate held against every hellhound, elephant and devil, with ${game.lives} lives left. You beat every round!`, 'Play again from round 1');
  } else {
    showOverlay('The keep has fallen', `The beasts broke through on wave ${game.wave}. You put down ${game.kills} of them.`, `Retry round ${ROUND_NUMBER}`);
  }
}

// ---------- Building and upgrading ----------

function towerAt(col, row) {
  return game.towers.find((t) => t.col === col && t.row === row) || null;
}

function buildTower(col, row) {
  if (game.money < SIEGE.tower.buildCost) {
    Sound.empty();
    showMessage(`Not enough souls. A tower costs ${SIEGE.tower.buildCost}`);
    return;
  }
  game.money -= SIEGE.tower.buildCost;
  game.towers.push(new SiegeTower(scene, col, row));
  Sound.thud();
}

function upgradeSelected() {
  const tower = game.selected;
  if (!tower || tower.upgradeCost === null) return;
  if (game.money < tower.upgradeCost) {
    Sound.empty();
    showMessage(`Not enough souls. That upgrade costs ${tower.upgradeCost}`);
    return;
  }
  game.money -= tower.upgradeCost;
  tower.upgrade();
  Sound.pickup();
  showMessage(`Tower upgraded to level ${tower.level + 1}`);
}

function upgradeRifle() {
  const next = SIEGE.rifle.levels[game.rifleLevel + 1];
  if (!next) return;
  if (game.money < next.upgradeCost) {
    Sound.empty();
    showMessage(`Not enough souls. The rifle upgrade costs ${next.upgradeCost}`);
    return;
  }
  game.money -= next.upgradeCost;
  game.rifleLevel += 1;
  Sound.pickup();
  showMessage(`Rifle upgraded: ${next.damage} damage per shot`);
}

function select(tower) {
  game.selected = tower;
}

// Which map cell is under the mouse in tower view.
const raycaster = new THREE.Raycaster();
const rimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -SIEGE_RIM);
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function pickCell() {
  raycaster.setFromCamera(mouse, camera);
  const hit = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(rimPlane, hit)) return null;
  let col = siegeCellOf(hit.x);
  let row = siegeCellOf(hit.z);
  if (isGorgeCell(col, row) && raycaster.ray.intersectPlane(floorPlane, hit)) {
    col = siegeCellOf(hit.x);
    row = siegeCellOf(hit.z);
  }
  if (siegeCellAt(col, row) === 'X') return null;
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
  if (isGorgeCell(cell.col, cell.row)) {
    const c = siegeCellCenter(cell.col, cell.row);
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
  if (e.code === 'KeyM') showMessage(Music.toggle() ? 'Music on' : 'Music off', 1.5);
  if (e.code === 'KeyG') showMessage(graphics.toggle() ? 'Graphics: high (shadows, glow and film effects)' : 'Graphics: low (faster)', 2);
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
  if (e.code === 'Space') e.preventDefault();
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
ui.overlayButton.addEventListener('click', overlayAction);

// The menu's play button (and this round's button in the round picker).
function overlayAction() {
  if (game.state === 'won') {
    goToRound(1);
    return true;
  }
  if (game.state === 'lost') {
    goToRound(ROUND_NUMBER);
    return true;
  }
  Sound.init();
  Sound.resume();
  Music.start(ROUND_NUMBER);
  game.state = 'playing';
  ui.overlay.classList.add('hidden');
  showMessage(`Build ${Math.floor(SIEGE.startMoney / SIEGE.tower.buildCost)} fire towers on the rim, then press N to open the hellgate`, 6);
  return true;
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  for (const cam of [camera, weaponCamera]) {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
  }
  graphics.resize();
});

// ---------- The tower view ----------

function updateTowerView(dt) {
  const pan = 32 * dt * (tdView.distance / 72);
  if (keys.KeyW || keys.ArrowUp) tdView.z -= pan;
  if (keys.KeyS || keys.ArrowDown) tdView.z += pan;
  if (keys.KeyA || keys.ArrowLeft) tdView.x -= pan;
  if (keys.KeyD || keys.ArrowRight) tdView.x += pan;
  tdView.x = clamp(tdView.x, 0, WORLD_W);
  tdView.z = clamp(tdView.z, 0, WORLD_D);
  if (camera.fov !== 50) {
    camera.fov = 50;
    camera.updateProjectionMatrix();
  }
  camera.position.set(tdView.x, tdView.distance * 0.95, tdView.z + tdView.distance * 0.33); // steep, to see into the gorge
  camera.lookAt(tdView.x, 0, tdView.z);
}

function placeRing(ring, x, z, radius) {
  ring.visible = true;
  ring.position.set(x, SIEGE_RIM + 0.1, z);
  ring.scale.setScalar(radius);
}

function updateHelpers() {
  const towerMode = game.mode === 'tower' && game.state === 'playing';
  ghost.visible = hoverRing.visible = selectRing.visible = false;
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
    const { x, z } = siegeCellCenter(cell.col, cell.row);
    ghost.visible = true;
    ghost.position.set(x, SIEGE_RIM + 1, z);
    ghost.material.color.setHex(game.money >= SIEGE.tower.buildCost ? 0x40ff60 : 0xff4040);
    placeRing(hoverRing, x, z, SIEGE.tower.levels[0].range);
  } else if (isGorgeCell(cell.col, cell.row)) {
    canvas.style.cursor = 'crosshair';
  }
}

// ---------- First person ----------

function rifleDamage() {
  return SIEGE.rifle.levels[game.rifleLevel].damage;
}

function startReload() {
  if (player.reloadTimer > 0 || player.ammo === SIEGE.rifle.magazine) return;
  player.reloadTimer = SIEGE.rifle.reloadTime;
  Sound.swap();
}

function updatePlayer(dt) {
  const sin = Math.sin(player.yaw);
  const cos = Math.cos(player.yaw);
  let forward = 0;
  let strafe = 0;
  if (keys.KeyW || keys.ArrowUp) forward += 1;
  if (keys.KeyS || keys.ArrowDown) forward -= 1;
  if (keys.KeyD || keys.ArrowRight) strafe += 1;
  if (keys.KeyA || keys.ArrowLeft) strafe -= 1;
  const len = Math.hypot(forward, strafe);
  const speed = keys.ShiftLeft || keys.ShiftRight ? SPRINT_SPEED : WALK_SPEED;
  if (len > 0) {
    const mx = ((-sin * forward + cos * strafe) / len) * speed * dt;
    const mz = ((-cos * forward - sin * strafe) / len) * speed * dt;
    moveInGorge(player, mx, mz, PLAYER_RADIUS);
  }
  player.moveAmount += ((len > 0 ? 1 : 0) - player.moveAmount) * Math.min(1, dt * 10);
  player.bobPhase += dt * speed * 1.4 * player.moveAmount;

  player.cooldown = Math.max(0, player.cooldown - dt);
  if (player.reloadTimer > 0) {
    player.reloadTimer -= dt;
    if (player.reloadTimer <= 0) {
      player.reloadTimer = 0;
      player.ammo = SIEGE.rifle.magazine;
    }
  } else if (mouseDown && player.cooldown <= 0) {
    if (player.ammo > 0) playerShoot();
    else {
      Sound.empty();
      startReload();
    }
  }
}

function placeFpsCamera() {
  if (camera.fov !== 80) {
    camera.fov = 80;
    camera.updateProjectionMatrix();
  }
  const bob = Math.abs(Math.sin(player.bobPhase)) * 0.06 * player.moveAmount;
  camera.position.set(player.x, EYE_HEIGHT + bob, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0);
}

function playerShoot() {
  player.ammo -= 1;
  player.cooldown = SIEGE.rifle.fireInterval;
  player.recoil = Math.min(1.2, player.recoil + 0.35);
  player.flash = 0.05;
  player.pitch = Math.min(1.4, player.pitch + 0.004);
  Sound.rifle();

  camera.updateMatrixWorld();
  const origin = camera.position.clone();
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  dir.addScaledVector(right, spreadRandom() * SIEGE.rifle.spread).addScaledVector(up, spreadRandom() * SIEGE.rifle.spread).normalize();

  // Walk along the ray until it hits the floor or a gorge wall.
  let wallT = SHOT_RANGE;
  for (let t = 0.2; t < SHOT_RANGE; t += 0.1) {
    const x = origin.x + dir.x * t;
    const y = origin.y + dir.y * t;
    const z = origin.z + dir.z * t;
    if (y <= 0 || (y < SIEGE_RIM && !isGorgeAt(x, z))) {
      wallT = t;
      break;
    }
  }
  // Then the closest beast in front of that.
  let target = null;
  let targetT = wallT;
  for (const beast of game.beasts) {
    if (beast.dead) continue;
    for (const sphere of beast.hitSpheres()) {
      const t = raySphere(origin, dir, sphere);
      if (t !== null && t < targetT) {
        targetT = t;
        target = beast;
      }
    }
  }
  const hit = origin.clone().addScaledVector(dir, (target ? targetT : wallT) - 0.05);
  const muzzle = origin.clone().addScaledVector(right, 0.12).addScaledVector(up, -0.1).addScaledVector(dir, 0.6);
  const p = tracer.geometry.attributes.position;
  p.setXYZ(0, muzzle.x, muzzle.y, muzzle.z);
  p.setXYZ(1, hit.x, hit.y, hit.z);
  p.needsUpdate = true;
  tracerTimer = 0.05;
  if (target) damageBeast(target, rifleDamage(), hit);
  else if (wallT < SHOT_RANGE) {
    for (let i = 0; i < 6; i++) effects.sparks.emit(hit.x, hit.y, hit.z, -dir.x * 2 + rand(-2, 2), rand(0, 3), -dir.z * 2 + rand(-2, 2), rand(0.2, 0.5), -9);
  }
}

// Distance along the ray to a sphere, or null if it misses.
function raySphere(origin, dir, sphere) {
  const ox = sphere.x - origin.x;
  const oy = sphere.y - origin.y;
  const oz = sphere.z - origin.z;
  const along = ox * dir.x + oy * dir.y + oz * dir.z;
  const distSq = ox * ox + oy * oy + oz * oz - along * along;
  const rSq = sphere.r * sphere.r;
  if (distSq > rSq) return null;
  const half = Math.sqrt(rSq - distSq);
  if (along - half > 0) return along - half;
  if (along + half > 0) return along + half;
  return null;
}

function updateRifleView(dt) {
  player.recoil *= Math.exp(-dt * 12);
  player.flash = Math.max(0, player.flash - dt);
  // Dip and tilt the rifle while reloading.
  const reload = player.reloadTimer > 0 ? Math.sin((1 - player.reloadTimer / SIEGE.rifle.reloadTime) * Math.PI) : 0;
  const bobX = Math.sin(player.bobPhase) * 0.015 * player.moveAmount;
  const bobY = -Math.abs(Math.cos(player.bobPhase)) * 0.012 * player.moveAmount;
  rifle.group.visible = game.mode === 'fps';
  rifle.group.position.set(rifle.base.x + bobX, rifle.base.y + bobY - reload * 0.12, rifle.base.z + player.recoil * 0.06);
  rifle.group.rotation.set(player.recoil * 0.12 + reload * 0.3, 0.06, reload * 0.5);
  rifle.flash.visible = player.flash > 0;
  if (rifle.flash.visible) rifle.flash.material.rotation = rand(0, Math.PI * 2);
  weaponFlash.intensity = player.flash > 0 ? 3 * LIGHT_UNITS : 0;
  gunLight.position.copy(camera.position);
  gunLight.intensity = player.flash > 0 && game.mode === 'fps' ? 2.5 * LIGHT_UNITS : 0;
}

// ---------- The world ----------

function updateWorld(dt, t) {
  for (const [i, fire] of world.fires.entries()) {
    fire.light.intensity = (1.6 + Math.sin(t * 13 + i * 2) * 0.15 + Math.sin(t * 29 + i) * 0.1) * LIGHT_UNITS;
    fire.acc += dt * 40;
    while (fire.acc >= 1) {
      fire.acc -= 1;
      effects.fire.emit(fire.x + rand(-0.3, 0.3), fire.y, fire.z + rand(-0.3, 0.3), rand(-0.2, 0.2), rand(1.2, 2.4), rand(-0.2, 0.2), rand(0.4, 0.8), 1);
    }
    if (Math.random() < dt * 4) effects.smoke.emit(fire.x, fire.y + 1.3, fire.z, rand(-0.15, 0.15), rand(0.6, 1.0), rand(-0.15, 0.15), rand(3.5, 5), 0.05);
  }
  // The hellgate swirls and spits embers.
  world.portal.swirl.rotation.z = t * 0.8;
  world.portal.light.intensity = 60 * (0.85 + Math.sin(t * 5) * 0.15);
  if (Math.random() < dt * 25) {
    const at = world.portal.at;
    effects.sparks.emit(at.x + rand(-1.5, 1.5), at.y + rand(-1.5, 1.5), at.z, rand(-1, 1), rand(0.5, 2), rand(-1, 1), rand(0.6, 1.4), 0.3);
  }
  // Embers drifting up out of the gorge.
  if (Math.random() < dt * 30) {
    const x = rand(0, WORLD_W);
    const z = rand(0, WORLD_D);
    if (isGorgeAt(x, z)) effects.sparks.emit(x, 0.2, z, rand(-0.3, 0.3), rand(0.8, 2.2), rand(-0.3, 0.3), rand(1.5, 3), 0.2);
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
  ui.overlayRound.textContent = '';
  ui.overlayText.textContent = text;
  ui.overlayButton.textContent = button;
  ui.overlay.classList.remove('hidden');
}

// Text that floats up from a spot in the world, like "+2".
const floaters = [];
function floatText(text, position) {
  const el = document.createElement('div');
  el.className = 'floater';
  el.textContent = text;
  $('floaters').appendChild(el);
  floaters.push({ el, pos: position, life: 1.1 });
}

function updateFloaters(dt) {
  const v = new THREE.Vector3();
  for (const f of floaters) {
    f.life -= dt;
    f.pos.y += dt * 1.5;
    v.copy(f.pos).project(camera);
    const visible = v.z < 1 && f.life > 0;
    f.el.style.display = visible ? 'block' : 'none';
    if (visible) {
      f.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * window.innerWidth}px, ${(-v.y * 0.5 + 0.5) * window.innerHeight}px) translate(-50%, -50%)`;
      f.el.style.opacity = Math.min(1, f.life * 2);
    }
    if (f.life <= 0) f.el.remove();
  }
  for (let i = floaters.length - 1; i >= 0; i--) if (floaters[i].life <= 0) floaters.splice(i, 1);
}

function updateHud(dt) {
  const playing = game.state === 'playing';
  const fps = game.mode === 'fps';
  ui.wave.textContent = `${game.wave} / ${TOTAL_WAVES}`;
  ui.lives.textContent = Math.max(0, game.lives);
  ui.money.textContent = game.money;
  ui.beastsLeft.textContent = game.beasts.filter((b) => !b.dead).length + game.toSpawn;

  let waveLabel = '';
  if (playing && !game.waveActive && game.wave < TOTAL_WAVES) {
    const next = waveConfig(game.wave + 1).name;
    waveLabel = game.countdown > 0
      ? `${next} in ${Math.ceil(game.countdown)}s · open the gate now [N]`
      : `Open the hellgate: ${next.toLowerCase()} [N]`;
  }
  ui.waveButton.textContent = waveLabel;
  ui.waveButton.classList.toggle('hidden', !waveLabel);

  ui.tdPanel.classList.toggle('hidden', fps || !playing);
  ui.fpsHud.classList.toggle('hidden', !fps);
  ui.paused.classList.toggle('hidden', !game.paused || fps);
  ui.buildCost.textContent = `${SIEGE.tower.buildCost} souls`;

  const nextRifle = SIEGE.rifle.levels[game.rifleLevel + 1];
  ui.rifleButton.textContent = nextRifle ? `Upgrade rifle to level ${game.rifleLevel + 2} · ${nextRifle.upgradeCost} souls` : 'Rifle fully upgraded';
  ui.rifleButton.disabled = !nextRifle || game.money < nextRifle.upgradeCost;

  const tower = game.selected;
  ui.towerPanel.classList.toggle('hidden', !tower || fps || !playing);
  if (tower) {
    const s = tower.stats;
    ui.towerTitle.textContent = `Fire tower · level ${tower.level + 1} of ${SIEGE.tower.levels.length}`;
    ui.towerStats.textContent = `Damage ${s.damage} · ${s.fireRate} shots/s · range ${s.range}`;
    const cost = tower.upgradeCost;
    ui.upgradeButton.textContent = cost === null ? 'Fully upgraded' : `Upgrade to level ${tower.level + 2} · ${cost} souls [U]`;
    ui.upgradeButton.disabled = cost === null || game.money < cost;
  }
  ui.ammo.textContent = player.reloadTimer > 0 ? 'Reloading…' : `${player.ammo} / ${SIEGE.rifle.magazine}`;
  ui.rifleLevel.textContent = game.rifleLevel + 1;
  messageTimer -= dt;
  if (messageTimer <= 0) ui.message.style.opacity = 0;
}

// ---------- Main loop ----------

const timer = new THREE.Timer();

function frame(timestamp) {
  requestAnimationFrame(frame);
  timer.update(timestamp);
  const dt = Math.min(timer.getDelta(), 0.05);
  const t = timer.getElapsed();
  const running = game.state === 'playing' && !game.paused;

  if (running) {
    updateWaves(dt);
    updateBeasts(dt, t);
    for (const tower of game.towers) tower.update(dt, t, game.beasts, towerFire);
    for (const ball of game.fireballs) updateSiegeFireball(ball, dt, damageBeast, fireballTrail);
    game.fireballs = game.fireballs.filter((b) => !b.done);
    game.fireSound -= dt;
  }
  if (game.mode === 'fps') {
    if (running) updatePlayer(dt);
    placeFpsCamera();
  } else {
    updateTowerView(dt);
  }
  updateRifleView(dt);
  updateHelpers();
  for (const beast of game.beasts) beast.updateBar(camera, game.mode === 'tower');
  if (running || game.state === 'title') {
    updateWorld(dt, t);
    for (const system of Object.values(effects)) system.update(dt);
  }
  tracerTimer -= dt;
  tracer.visible = tracerTimer > 0;
  updateFloaters(dt);
  updateHud(dt);
  graphics.render(t);
}

// Dev helper: defense.html#preview starts straight away; &wave=3 skips to that wave with
// plenty of souls; &fps starts in first person (without capturing the mouse).
const previewOptions = new URLSearchParams(location.hash.slice(1));
if (previewOptions.has('preview')) {
  game.state = 'playing';
  ui.overlay.classList.add('hidden');
  if (previewOptions.has('wave')) {
    game.wave = Number(previewOptions.get('wave')) - 1;
    game.money = 500;
  }
  if (previewOptions.has('fps')) game.mode = 'fps';
}

frame();
