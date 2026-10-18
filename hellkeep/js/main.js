// Hellkeep: a small Doom-style shooter. This file runs the two 3D rounds.
// Round 1: storm a castle in hell, put down every hellhound and the devil on the throne.
// Round 2: the frozen depths, where ice elephants burning with blue fire roam.
// Rounds 3 and 4 are side-on platform rounds: see side.html and js/side/.

if (typeof THREE === 'undefined') { // (index.html also checks this while loading)
  document.getElementById('overlay-text').textContent =
    'Could not load the 3D engine (three.js). Check your internet connection and reload the page.';
  throw new Error('three.js failed to load');
}

const EYE_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.4;
const WALK_SPEED = 6;
const SPRINT_SPEED = 9.5;
const MOUSE_SENSITIVITY = 0.0022;
const MAX_HEALTH = 100;
const MAX_AMMO = { bullets: 250, shells: 50 };
const SHOT_RANGE = 70;

const JUMP_SPEED = 6.5;      // each jump (you get two: the second one in mid-air)
const GRAVITY = 18;
const WING_LIFT = 26;        // stronger than gravity, so you climb
const WING_MAX_RISE = 5;     // fastest climb speed
const WING_TIRE = 0.33;      // stamina used per second of flying (full stamina lasts about 3 seconds)
const WING_REST = 0.25;      // stamina regained per second while standing on the ground

// ---------- Page elements ----------

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayRound = document.getElementById('overlay-round');
const overlayText = document.getElementById('overlay-text');
const overlayButton = document.getElementById('overlay-button');
const hud = {
  health: document.getElementById('health'),
  ammo: document.getElementById('ammo'),
  ammoLabel: document.getElementById('ammo-label'),
  enemies: document.getElementById('hounds'),
  round: document.getElementById('round'),
  message: document.getElementById('message'),
  damage: document.getElementById('damage'),
  slots: [...document.querySelectorAll('#slots span')],
  boss: document.getElementById('boss'),
  bossFill: document.getElementById('boss-fill'),
  wings: document.getElementById('wings'),
  wingsFill: document.getElementById('wings-fill'),
};
overlayRound.textContent = ROUND.title;
overlayText.textContent = ROUND.intro;
hud.round.textContent = ROUND.title;
buildRoundPicker(ROUND_NUMBER);

// ---------- Renderer, scenes and cameras ----------

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;
// Real-time shadows, softened at the edges.
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.getElementById('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(THEME.background);
scene.fog = new THREE.FogExp2(THEME.background, THEME.fogDensity);
// The fill light. Scaled down because the filmic tone curve brightens the mid-tones.
const AMBIENT_SCALE = 0.8;
const [skyColor, groundColor, ambient] = THEME.hemi;
scene.add(new THREE.HemisphereLight(skyColor, groundColor, ambient * AMBIENT_SCALE * LIGHT_UNITS));

// A wide field of view, like Unreal Tournament, for a fast arena-shooter feel.
const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 400);
camera.rotation.order = 'YXZ';

// Lights up the world for a split second when you fire.
const gunLight = new THREE.PointLight(0xffb060, 0, 16, 1.5);
scene.add(gunLight);

// The burning sky (or the cold moon in round 2): a low light from the south that throws
// long shadows across the ground outside. The castle roof keeps it out of the halls.
const skyLight = new THREE.DirectionalLight(THEME.palette === 'frost' ? 0x8ab8ff : 0xff6a30, (THEME.palette === 'frost' ? 0.8 : 1.1) * LIGHT_UNITS);
{
  const cx = (MAP_W * CELL) / 2;
  const cz = (MAP_H * CELL) / 2;
  skyLight.position.set(cx - 50, 45, cz + 90);
  skyLight.target.position.set(cx, 0, cz);
  skyLight.castShadow = true;
  skyLight.shadow.mapSize.set(2048, 2048);
  Object.assign(skyLight.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 10, far: 260 });
  skyLight.shadow.bias = -0.0006;
  skyLight.shadow.normalBias = 0.04;
  skyLight.shadow.radius = 2;
  scene.add(skyLight, skyLight.target);
}

// Brazier shadows. Shadows from point lights are expensive, so a few shadow-casting
// lights hop to whichever braziers are nearest you each frame, standing in for them.
const SHADOW_LIGHTS = 3;
const shadowLights = Array.from({ length: SHADOW_LIGHTS }, () => {
  const light = new THREE.PointLight(THEME.brazierLight, 0, 22, 1.5);
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  light.shadow.camera.near = 0.3;
  light.shadow.camera.far = 22;
  light.shadow.bias = -0.003;
  light.shadow.normalBias = 0.03;
  light.shadow.radius = 3;
  scene.add(light);
  return light;
});

// The gun is drawn in its own scene on top of the world, so it never pokes through walls.
const weaponScene = new THREE.Scene();
const weaponCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10);
weaponScene.add(new THREE.HemisphereLight(0xffc49a, 0x3a1010, 0.5 * LIGHT_UNITS));
const weaponKeyLight = new THREE.DirectionalLight(THEME.palette === 'frost' ? 0x9ad0ff : 0xff9a60, 0.9 * LIGHT_UNITS);
weaponKeyLight.position.set(-1, 1, 0.5);
weaponScene.add(weaponKeyLight);
const weaponFlashLight = new THREE.PointLight(0xffb060, 0, 3);
weaponFlashLight.position.set(0.15, 0, -0.9);
weaponScene.add(weaponFlashLight);

// Bloom, filmic colour, anti-aliasing and reflections (see graphics.js). G switches it off.
const graphics = createGraphics(renderer, scene, camera, weaponScene, weaponCamera);

// ---------- World ----------

const level = buildLevel(scene);
graphics.useSkyForLighting(level.sky.material.map);
const bulletHoles = new BulletHoles(scene);
const glowTexture = Textures.glow();
const ammoMaterial = new THREE.MeshStandardMaterial({ map: Textures.ammoCrate(), emissive: 0xffffff, emissiveIntensity: 0.25 });
ammoMaterial.emissiveMap = ammoMaterial.map;
const healthMaterial = new THREE.MeshStandardMaterial({ map: Textures.healthBox(), emissive: 0xffffff, emissiveIntensity: 0.25 });
healthMaterial.emissiveMap = healthMaterial.map;

const loadout = ROUND.loadout;
const game = {
  state: 'menu', // menu | playing | paused | dead | won
  player: {
    x: level.playerStart.x,
    z: level.playerStart.z,
    y: 0,      // height of your feet above the floor
    vy: 0,     // vertical speed
    vx: 0,     // how fast you're moving (the devil uses this to aim ahead of you)
    vz: 0,
    grounded: true,
    jumps: 0,  // jumps used since you left the ground (max 2)
    yaw: 0,
    pitch: 0,
    health: MAX_HEALTH,
  },
  ammo: { ...loadout.ammo },
  owned: { ...loadout.owned },
  wings: loadout.wings,
  stamina: 1,  // how much flying the wings have left (0 to 1)
  knock: { x: 0, z: 0 },
  weapon: ['shotgun', 'rifle', 'pistol'].find((w) => loadout.owned[w]), // best gun you start with
  pendingWeapon: null,
  lower: 0,      // 0 = gun raised, 1 = lowered out of view (while switching)
  cooldown: 0,
  recoil: 0,
  flash: 0,
  mouseDown: false,
  triggerReady: true,
  hurt: 0,
  shake: 0,
  bobPhase: 0,
  moveAmount: 0,
  eye: EYE_HEIGHT,
  lavaTimer: 0,
  winTimer: 0,
  time: 0,
  kills: 0,
  godMode: false,
  fire: new ParticleSystem(scene, { max: 4000, size: 0.55, texture: glowTexture, damping: 0.96, palette: THEME.palette }),
  sparks: new ParticleSystem(scene, { max: 2000, size: 0.13, texture: glowTexture, damping: 0.97, palette: THEME.palette }),
  // Smoke above the fires (pale mist in the frozen round): soft, dark and see-through.
  smoke: new ParticleSystem(scene, { max: 900, size: 1.8, texture: glowTexture, damping: 0.99, palette: THEME.palette === 'frost' ? 'mist' : 'smoke' }),
  enemies: [],
  projectiles: [],
  pickups: [],
  damagePlayer,
  knockPlayer,
  shakeNear,
  onEnemyKilled,
  dropPickup,
  showMessage,
};

const ENEMY_TYPES = { hound: Hound, elephant: Elephant, devil: Devil };
game.enemies = level.enemies.map((spot) => new ENEMY_TYPES[spot.type](scene, spot.x, spot.z));
game.pickups = level.pickups.map((spot) => createPickup(spot.type, spot.x, spot.z));
// Beasts and pickups cast shadows (glows and other see-through bits don't).
for (const thing of [...game.enemies.map((e) => e.group), ...game.pickups.map((p) => p.mesh)]) {
  thing.traverse((part) => {
    if (part.isMesh && !part.material.transparent) part.castShadow = part.receiveShadow = true;
  });
}

const viewmodels = {};
for (const name of WEAPON_ORDER) {
  const vm = WEAPON_BUILDERS[name]();
  vm.flash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xffc070,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  }));
  vm.flash.position.copy(vm.muzzle);
  vm.flash.scale.setScalar(name === 'shotgun' ? 0.35 : 0.22);
  vm.flash.visible = false;
  vm.group.add(vm.flash);
  vm.group.scale.setScalar(0.8);
  vm.group.visible = name === game.weapon;
  weaponScene.add(vm.group);
  viewmodels[name] = vm;
}

// The angel wings you see at the edges of the screen once you have them.
const firstPersonWings = new FirstPersonWings(weaponScene);

function createPickup(type, x, z) {
  let mesh;
  if (type === 'ammo') mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.55), ammoMaterial);
  else if (type === 'health') mesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.65), healthMaterial);
  else if (type === 'wings') {
    mesh = buildWingsPickup();
    mesh.scale.setScalar(1.6);
  } else if (type === 'shotgun') {
    return createShotgunDisplay(x, z);
  } else {
    mesh = buildRifle().group;
    mesh.scale.setScalar(1.8);
  }
  mesh.position.set(x, 0.5, z);
  scene.add(mesh);
  const colors = { health: 0x30ff60, wings: 0xffe08a };
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture,
    color: colors[type] || 0xffb030,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.45,
  }));
  glow.scale.set(2, 2, 1);
  glow.position.set(x, 0.4, z);
  scene.add(glow);
  return { type, x, z, mesh, glow, phase: rand(0, 6), taken: false };
}

// The Flak Shotgun, big and slowly turning above a stone pedestal, lit in cyan.
function createShotgunDisplay(x, z) {
  const pedestal = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x3a3230, roughness: 0.8 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8ac48, metalness: 1, roughness: 0.25, envMap: graphics.envMap });
  addPart(pedestal, new THREE.CylinderGeometry(0.55, 0.7, 0.2, 16), stone, 0, 0.1, 0);
  addPart(pedestal, new THREE.CylinderGeometry(0.4, 0.45, 0.8, 16), stone, 0, 0.6, 0);
  addPart(pedestal, new THREE.CylinderGeometry(0.55, 0.45, 0.12, 16), stone, 0, 1.06, 0);
  addPart(pedestal, new THREE.TorusGeometry(0.5, 0.025, 8, 32), gold, 0, 1.12, 0).rotation.x = Math.PI / 2;
  pedestal.position.set(x, 0, z);
  scene.add(pedestal);

  const mesh = buildShotgun().group;
  mesh.traverse((part) => {
    if (part.material && part.material.metalness !== undefined) part.material.envMap = graphics.envMap; // shiny chrome
  });
  mesh.scale.setScalar(2.6);
  mesh.position.set(x, 1.75, z);
  scene.add(mesh);

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0x40e8ff,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.25,
  }));
  glow.scale.set(2.4, 2.4, 1);
  glow.position.set(x, 1.75, z);
  scene.add(glow);
  const light = new THREE.PointLight(0x60e8ff, 2.2 * LIGHT_UNITS, 9, 1.5);
  light.position.set(x, 2.6, z);
  scene.add(light);
  return { type: 'shotgun', x, z, mesh, glow, light, phase: 0, taken: false, display: true };
}

function dropPickup(type, x, z) {
  game.pickups.push(createPickup(type, x, z));
}

// ---------- Input ----------

const keys = {};

addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (game.state !== 'playing') return;
  if (e.code === 'Digit1') switchWeapon('pistol');
  if (e.code === 'Digit2') switchWeapon('shotgun');
  if (e.code === 'Digit3') switchWeapon('rifle');
  if (e.code === 'KeyM') showMessage(Music.toggle() ? 'Music on' : 'Music off', 1.5);
  if (e.code === 'KeyG') showMessage(graphics.toggle() ? 'Graphics: high (bloom and film effects)' : 'Graphics: low (faster)', 2);
  if (e.code === 'Space') {
    e.preventDefault();
    if (!e.repeat) jump();
  }
});
addEventListener('keyup', (e) => {
  keys[e.code] = false;
});
addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  game.mouseDown = false;
});

document.addEventListener('mousemove', (e) => {
  if (game.state !== 'playing' || document.pointerLockElement !== renderer.domElement) return;
  const p = game.player;
  p.yaw -= e.movementX * MOUSE_SENSITIVITY;
  p.pitch = clamp(p.pitch - e.movementY * MOUSE_SENSITIVITY, -1.4, 1.4);
});
document.addEventListener('mousedown', (e) => {
  if (e.button === 0 && game.state === 'playing') game.mouseDown = true;
});
document.addEventListener('mouseup', (e) => {
  if (e.button !== 0) return;
  game.mouseDown = false;
  game.triggerReady = true;
});
document.addEventListener('wheel', (e) => {
  if (game.state !== 'playing') return;
  cycleWeapon(e.deltaY > 0 ? 1 : -1);
});

overlay.addEventListener('click', () => {
  if (game.state === 'won' && ROUND_NUMBER < TOTAL_ROUNDS) {
    goToRound(ROUND_NUMBER + 1); // after round 2 this opens the side-on rounds
    return;
  }
  if (game.state === 'dead' || game.state === 'won') {
    location.hash = game.state === 'dead' ? `round=${ROUND_NUMBER}` : '';
    location.reload();
    return;
  }
  Sound.init();
  Sound.resume();
  Music.start(ROUND_NUMBER);
  const request = renderer.domElement.requestPointerLock();
  if (request && request.catch) request.catch(() => {});
});

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  if (locked && (game.state === 'menu' || game.state === 'paused')) {
    if (game.state === 'menu') {
      const tip = game.wings ? ' Double jump, then hold Space to fly with your angel wings.' : ' Space to jump, twice to double jump.';
      showMessage(ROUND.intro + tip, 5);
    }
    game.state = 'playing';
    overlay.classList.add('hidden');
  } else if (!locked && game.state === 'playing') {
    game.state = 'paused';
    game.mouseDown = false;
    showOverlay('Paused', 'The castle is waiting.', 'Click to resume');
  }
});

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = weaponCamera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  weaponCamera.updateProjectionMatrix();
  graphics.resize();
});

// ---------- Weapons and shooting ----------

function switchWeapon(name) {
  if (!game.owned[name] || name === game.weapon || name === game.pendingWeapon) return;
  game.pendingWeapon = name;
  Sound.swap();
}

function cycleWeapon(direction) {
  const owned = WEAPON_ORDER.filter((w) => game.owned[w]);
  const current = owned.indexOf(game.pendingWeapon || game.weapon);
  switchWeapon(owned[(current + direction + owned.length) % owned.length]);
}

function tryFire() {
  const weapon = WEAPONS[game.weapon];
  if (game.cooldown > 0 || game.lower > 0 || game.pendingWeapon) return;
  if (!weapon.auto && !game.triggerReady) return;
  game.triggerReady = false;

  if (game.ammo[weapon.ammo] <= 0) {
    Sound.empty();
    game.cooldown = 0.3;
    const fallback = WEAPON_ORDER.find((w) => game.owned[w] && game.ammo[WEAPONS[w].ammo] > 0);
    if (fallback) switchWeapon(fallback);
    else showMessage('Out of ammo! Find a crate.');
    return;
  }

  game.ammo[weapon.ammo] -= 1;
  game.cooldown = weapon.cooldown;
  game.recoil = Math.min(1.5, game.recoil + weapon.kick);
  game.flash = 0.06;
  game.player.pitch = Math.min(1.4, game.player.pitch + weapon.kick * 0.012);
  Sound[weapon.sound]();

  const origin = camera.position.clone();
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  for (let i = 0; i < weapon.pellets; i++) {
    const dir = forward.clone()
      .addScaledVector(right, spreadRandom() * weapon.spread)
      .addScaledVector(up, spreadRandom() * weapon.spread)
      .normalize();
    shootRay(origin, dir, weapon.damage);
  }

  // Gunfire wakes up enemies nearby, even through walls.
  const p = game.player;
  for (const enemy of game.enemies) {
    if (enemy.alive && Math.hypot(enemy.x - p.x, enemy.z - p.z) < 18) enemy.alert();
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

function shootRay(origin, dir, damage) {
  // Walk along the ray until it hits a wall, the floor or the ceiling.
  // Also work out which surface it hit and exactly where, for the bullet hole.
  let wallT = SHOT_RANGE;
  let surface = null;
  for (let t = 0.2; t < SHOT_RANGE; t += 0.08) {
    const x = origin.x + dir.x * t;
    const y = origin.y + dir.y * t;
    const z = origin.z + dir.z * t;
    const ceiling = ceilingAt(x, z);
    if (y <= 0 || y >= ceiling || isWallAt(x, z)) {
      wallT = t;
      const px = x - dir.x * 0.08; // the last point before the hit
      const pz = z - dir.z * 0.08;
      if (y <= 0) surface = { point: new THREE.Vector3(x, 0.01, z), normal: new THREE.Vector3(0, 1, 0) };
      else if (y >= ceiling) surface = { point: new THREE.Vector3(x, ceiling - 0.01, z), normal: new THREE.Vector3(0, -1, 0) };
      else if (cellOf(px) !== cellOf(x)) {
        const side = px < x ? -1 : 1;
        const faceX = (side < 0 ? cellOf(x) : cellOf(x) + 1) * CELL;
        surface = { point: new THREE.Vector3(faceX, y, z), normal: new THREE.Vector3(side, 0, 0) };
      } else {
        const side = pz < z ? -1 : 1;
        const faceZ = (side < 0 ? cellOf(z) : cellOf(z) + 1) * CELL;
        surface = { point: new THREE.Vector3(x, y, faceZ), normal: new THREE.Vector3(0, 0, side) };
      }
      break;
    }
  }

  // Then find the closest enemy in front of that.
  let target = null;
  let targetT = wallT;
  for (const enemy of game.enemies) {
    if (!enemy.alive) continue;
    for (const sphere of enemy.hitSpheres()) {
      const t = raySphere(origin, dir, sphere);
      if (t !== null && t < targetT) {
        targetT = t;
        target = enemy;
      }
    }
  }

  const hitT = (target ? targetT : wallT) - 0.05;
  const hx = origin.x + dir.x * hitT;
  const hy = origin.y + dir.y * hitT;
  const hz = origin.z + dir.z * hitT;
  if (target) {
    target.takeDamage(damage, dir);
    for (let i = 0; i < 6; i++) game.fire.emit(hx, hy, hz, rand(-2, 2), rand(0, 3), rand(-2, 2), rand(0.2, 0.45), 1);
  } else if (wallT < SHOT_RANGE) {
    if (surface) bulletHoles.add(surface.point, surface.normal);
    for (let i = 0; i < 6; i++) {
      game.sparks.emit(hx, hy, hz, -dir.x * 2 + rand(-2, 2), rand(0, 3), -dir.z * 2 + rand(-2, 2), rand(0.2, 0.5), -9);
    }
  }
}

// ---------- Player ----------

function damagePlayer(amount) {
  if (game.state !== 'playing' || game.godMode) return;
  const p = game.player;
  p.health = Math.max(0, p.health - amount);
  game.hurt = Math.min(1, game.hurt + amount / 25);
  game.shake = Math.max(game.shake, 1);
  Sound.hurt();
  if (p.health <= 0) {
    game.state = 'dead';
    Music.stop();
    game.mouseDown = false;
    document.exitPointerLock();
    const total = game.enemies.length;
    showOverlay('You died', `${ROUND.title}. You put down ${game.kills} of ${total} enemies.`, `Click to retry round ${ROUND_NUMBER}`);
  }
}

// Shove the player (elephant charges, trident stabs). Pops you off the ground a little.
function knockPlayer(dx, dz, strength) {
  game.knock.x += dx * strength;
  game.knock.z += dz * strength;
  const p = game.player;
  if (p.grounded) {
    p.vy = 4;
    p.grounded = false;
    p.jumps = 2; // no double jump while flying backwards
  }
}

function shakeNear(x, z, amount) {
  const d = Math.hypot(game.player.x - x, game.player.z - z);
  game.shake = Math.max(game.shake, amount * Math.max(0, 1 - d / 25));
}

function onEnemyKilled() {
  game.kills += 1;
  if (game.enemies.every((e) => !e.alive)) {
    game.winTimer = 3;
    showMessage(THEME.snow ? 'The frozen depths fall silent...' : 'The castle falls silent...', 3);
  }
}

function win() {
  game.state = 'won';
  Music.stop();
  game.mouseDown = false;
  document.exitPointerLock();
  const minutes = Math.floor(game.time / 60);
  const seconds = String(Math.floor(game.time % 60)).padStart(2, '0');
  const stats = `Time: ${minutes}:${seconds}. Health left: ${Math.ceil(game.player.health)}.`;
  if (ROUND_NUMBER < TOTAL_ROUNDS) {
    const tease = ROUND_NUMBER < LAST_ROUND ? 'Something colder waits below...' : 'Below the ice, the gorge burns...';
    showOverlay(`Round ${ROUND_NUMBER} complete`, `${stats} ${tease}`, `Continue to round ${ROUND_NUMBER + 1}`);
  } else {
    showOverlay('Hellkeep conquered', `You beat every round! ${stats}`, 'Click to play again from round 1');
  }
}

function jump() {
  const p = game.player;
  if (p.grounded) {
    p.vy = JUMP_SPEED;
    p.grounded = false;
    p.jumps = 1;
    Sound.jump();
  } else if (p.jumps < 2) {
    // Double jump: a second kick in mid-air.
    p.vy = JUMP_SPEED;
    p.jumps = 2;
    Sound.jump();
    for (let i = 0; i < 12; i++) {
      game.sparks.emit(p.x + rand(-0.3, 0.3), p.y + 0.1, p.z + rand(-0.3, 0.3), rand(-2, 2), rand(-1, 0), rand(-2, 2), rand(0.2, 0.4), 0);
    }
  }
}

function updatePlayer(dt) {
  const p = game.player;
  const startX = p.x;
  const startZ = p.z;
  const sin = Math.sin(p.yaw);
  const cos = Math.cos(p.yaw);
  let forward = 0;
  let strafe = 0;
  if (keys.KeyW || keys.ArrowUp) forward += 1;
  if (keys.KeyS || keys.ArrowDown) forward -= 1;
  if (keys.KeyD || keys.ArrowRight) strafe += 1;
  if (keys.KeyA || keys.ArrowLeft) strafe -= 1;
  const len = Math.hypot(forward, strafe);
  const speed = keys.ShiftLeft || keys.ShiftRight ? SPRINT_SPEED : WALK_SPEED;
  if (len > 0) {
    forward /= len;
    strafe /= len;
    // Facing direction is (-sin, -cos); right is (cos, -sin).
    const mx = (-sin * forward + cos * strafe) * speed * dt;
    const mz = (-cos * forward - sin * strafe) * speed * dt;
    moveWithCollision(p, mx, mz, PLAYER_RADIUS, false);
  }
  // Knockback slides you and fades out quickly.
  moveWithCollision(p, game.knock.x * dt, game.knock.z * dt, PLAYER_RADIUS, false);
  const fade = Math.exp(-dt * 6);
  game.knock.x *= fade;
  game.knock.z *= fade;

  updateVertical(dt);

  p.vx = (p.x - startX) / dt;
  p.vz = (p.z - startZ) / dt;
  game.moveAmount += ((len > 0 && p.grounded ? 1 : 0) - game.moveAmount) * Math.min(1, dt * 10);
  game.bobPhase += dt * speed * 1.4 * game.moveAmount;

  // Lava (or freezing water) only hurts when you're standing in it.
  if (p.grounded && isLavaAt(p.x, p.z)) {
    game.lavaTimer -= dt;
    if (game.lavaTimer <= 0) {
      game.lavaTimer = 0.35;
      Sound.sizzle();
      damagePlayer(6);
    }
  } else {
    game.lavaTimer = 0;
  }

  game.cooldown = Math.max(0, game.cooldown - dt);
  if (game.mouseDown) tryFire();
}

// Jumping, double jumping, flying with the angel wings, and gravity.
function updateVertical(dt) {
  const p = game.player;
  game.flying = false;
  if (p.grounded) {
    game.stamina = Math.min(1, game.stamina + WING_REST * dt);
    return;
  }
  // Hold Space after your double jump to beat your wings and fly.
  game.flying = game.wings && keys.Space && p.jumps >= 2 && game.stamina > 0 && p.vy < 1.5;
  if (game.flying) {
    p.vy = Math.min(WING_MAX_RISE, p.vy + WING_LIFT * dt);
    game.stamina = Math.max(0, game.stamina - WING_TIRE * dt);
    // A trail of glowing motes drifting down behind you.
    if (Math.random() < dt * 30) {
      game.sparks.emit(p.x + rand(-0.8, 0.8), p.y + rand(0.8, 1.6), p.z + rand(-0.8, 0.8), rand(-0.3, 0.3), rand(-1.5, -0.5), rand(-0.3, 0.3), rand(0.6, 1.2), 0);
    }
  }
  p.vy -= GRAVITY * dt;
  p.y += p.vy * dt;

  // Bump your head on the castle ceiling, or the top of the sky outside.
  const top = (cellOf(p.z) < CASTLE_ROWS ? WALL_H : ROCK_H - 1) - EYE_HEIGHT - 0.2;
  if (p.y > top) {
    p.y = top;
    p.vy = Math.min(0, p.vy);
  }
  if (p.y <= 0) {
    if (p.vy < -9) game.shake = Math.max(game.shake, 0.4); // heavy landing
    p.y = 0;
    p.vy = 0;
    p.grounded = true;
    p.jumps = 0;
  }
}

function updatePickups(dt, t) {
  const p = game.player;
  for (const pickup of game.pickups) {
    if (pickup.taken) continue;
    pickup.mesh.rotation.y += dt * (pickup.display ? 0.6 : 1.2);
    pickup.mesh.position.y = (pickup.display ? 1.75 : 0.5) + Math.sin(t * 2 + pickup.phase) * 0.1;
    if (p.y < 1.5 && Math.hypot(pickup.x - p.x, pickup.z - p.z) < 1.3) collect(pickup);
  }
}

function collect(pickup) {
  const p = game.player;
  if (pickup.type === 'health') {
    if (p.health >= MAX_HEALTH) return;
    p.health = Math.min(MAX_HEALTH, p.health + 25);
    showMessage('+25 health');
  } else if (pickup.type === 'ammo') {
    if (game.ammo.bullets >= MAX_AMMO.bullets && game.ammo.shells >= MAX_AMMO.shells) return;
    game.ammo.bullets = Math.min(MAX_AMMO.bullets, game.ammo.bullets + 25);
    game.ammo.shells = Math.min(MAX_AMMO.shells, game.ammo.shells + 6);
    showMessage('+25 bullets  +6 shells');
  } else if (pickup.type === 'rifle') {
    game.owned.rifle = true;
    game.ammo.bullets = Math.min(MAX_AMMO.bullets, game.ammo.bullets + 40);
    showMessage('You got the rifle! Press 3', 3);
    switchWeapon('rifle');
  } else if (pickup.type === 'shotgun') {
    game.owned.shotgun = true;
    game.ammo.shells = Math.min(MAX_AMMO.shells, game.ammo.shells + 20);
    showMessage('You got the FLAK SHOTGUN! Press 2', 3);
    switchWeapon('shotgun');
    pickup.light.intensity = 0;
  } else if (pickup.type === 'wings') {
    game.wings = true;
    game.stamina = 1;
    showMessage('ANGEL WINGS! Double jump, then hold Space to fly', 4);
  }
  pickup.taken = true;
  scene.remove(pickup.mesh);
  scene.remove(pickup.glow);
  Sound.pickup();
}

function updateProjectiles(dt) {
  for (const projectile of game.projectiles) projectile.update(dt);
  game.projectiles = game.projectiles.filter((p) => !p.done);
}

function updateCamera(dt) {
  const p = game.player;
  if (game.state === 'dead') game.eye = Math.max(0.35, game.eye - dt * 3);
  const bob = Math.abs(Math.sin(game.bobPhase)) * 0.06 * game.moveAmount;
  camera.position.set(p.x, p.y + game.eye + bob, p.z);
  const shake = game.shake * 0.02;
  camera.rotation.set(p.pitch + rand(-shake, shake), p.yaw + rand(-shake, shake), 0);
  game.shake = Math.max(0, game.shake - dt * 3);
}

function updateViewmodel(dt) {
  if (game.pendingWeapon) {
    game.lower = Math.min(1, game.lower + dt * 7);
    if (game.lower >= 1) {
      viewmodels[game.weapon].group.visible = false;
      game.weapon = game.pendingWeapon;
      game.pendingWeapon = null;
      viewmodels[game.weapon].group.visible = true;
    }
  } else {
    game.lower = Math.max(0, game.lower - dt * 7);
  }
  game.recoil *= Math.exp(-dt * 10);
  game.flash = Math.max(0, game.flash - dt);

  const vm = viewmodels[game.weapon];
  const weapon = WEAPONS[game.weapon];
  const bobX = Math.sin(game.bobPhase) * 0.015 * game.moveAmount;
  const bobY = -Math.abs(Math.cos(game.bobPhase)) * 0.012 * game.moveAmount;
  // The gun lags a little when you jump or fall.
  const airLag = clamp(-game.player.vy * 0.006, -0.04, 0.04);
  vm.group.position.set(vm.base.x + bobX, vm.base.y + bobY + airLag - game.lower * 0.4, vm.base.z + game.recoil * 0.08);
  vm.group.rotation.set(game.recoil * 0.25, 0.06, 0); // angled slightly toward the crosshair
  vm.group.visible = game.state !== 'dead';

  // Angel wings at the edges of the screen: folded on the ground, beating while you fly.
  const downstroke = firstPersonWings.update(dt, {
    owned: game.wings && game.state !== 'dead',
    airborne: !game.player.grounded,
    flying: game.flying && game.state === 'playing',
  });
  if (downstroke) Sound.wingFlap();

  // Shotgun pump slides back and forward after each shot.
  if (vm.pump) {
    const phase = clamp((weapon.cooldown - game.cooldown - 0.15) / 0.45, 0, 1);
    vm.pump.position.z = vm.pumpZ + Math.sin(phase * Math.PI) * 0.12;
  }

  vm.flash.visible = game.flash > 0;
  if (vm.flash.visible) vm.flash.material.rotation = rand(0, Math.PI * 2);
  weaponFlashLight.intensity = game.flash > 0 ? 3 * LIGHT_UNITS : 0;
  gunLight.position.copy(camera.position);
  gunLight.intensity = game.flash > 0 ? 2.5 * LIGHT_UNITS : 0;
}

// ---------- World effects ----------

let emberAcc = 0;
let snowAcc = 0;

function updateWorld(dt, t) {
  level.lavaTexture.offset.set(t * 0.02, t * 0.013);

  // The nearest braziers hand their light to the shadow-casting lights.
  const p = game.player;
  const nearest = [...level.fires].sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
  shadowLights.forEach((light, i) => {
    light.intensity = 0;
    if (nearest[i]) nearest[i].shadowLight = light;
  });
  for (const fire of nearest.slice(SHADOW_LIGHTS)) fire.shadowLight = null;

  // Lava pools pulse.
  for (const glow of level.lavaLights) {
    glow.light.intensity = glow.base * (0.85 + Math.sin(t * 2.3 + glow.seed) * 0.1 + Math.sin(t * 7.1 + glow.seed * 3) * 0.05);
  }

  level.fires.forEach((fire, i) => {
    const flicker = (1.6 + Math.sin(t * 13 + i * 2) * 0.15 + Math.sin(t * 29 + i) * 0.1) * LIGHT_UNITS;
    if (fire.shadowLight) {
      fire.shadowLight.position.copy(fire.light.position);
      fire.shadowLight.intensity = flicker;
      fire.light.intensity = 0;
    } else {
      fire.light.intensity = flicker;
    }
    if (Math.random() < dt * 5) {
      game.smoke.emit(fire.x + rand(-0.3, 0.3), fire.y + 1.3, fire.z + rand(-0.3, 0.3), rand(-0.15, 0.15), rand(0.6, 1.0), rand(-0.15, 0.15), rand(3.5, 5), 0.05);
    }
    fire.acc += dt * 45;
    while (fire.acc >= 1) {
      fire.acc -= 1;
      game.fire.emit(
        fire.x + rand(-0.3, 0.3), fire.y, fire.z + rand(-0.3, 0.3),
        rand(-0.2, 0.2), rand(1.2, 2.4), rand(-0.2, 0.2),
        rand(0.4, 0.8), 1,
      );
    }
  });

  // Embers (or icy mist) drifting up from the pools.
  emberAcc += dt * 25;
  while (emberAcc >= 1 && level.lavaCells.length) {
    emberAcc -= 1;
    const cell = level.lavaCells[Math.floor(Math.random() * level.lavaCells.length)];
    game.sparks.emit(
      cell.x + rand(-2, 2), 0.1, cell.z + rand(-2, 2),
      rand(-0.3, 0.3), rand(0.8, 2.2), rand(-0.3, 0.3),
      rand(1.5, 3), 0.2,
    );
    // ...and a haze of smoke (or mist) hanging over them.
    if (Math.random() < 0.1) {
      game.smoke.emit(cell.x + rand(-2, 2), 0.4, cell.z + rand(-2, 2), rand(-0.2, 0.2), rand(0.3, 0.7), rand(-0.2, 0.2), rand(4, 6), 0.03);
    }
  }

  // Snow drifting down over the frozen wasteland outside.
  if (THEME.snow) {
    snowAcc += dt * 120;
    while (snowAcc >= 1) {
      snowAcc -= 1;
      game.sparks.emit(
        rand(0, MAP_W * CELL), rand(0.5, 13), rand(CASTLE_ROWS * CELL, MAP_H * CELL),
        rand(0.2, 0.6), -1, rand(-0.2, 0.2),
        rand(3, 6), -0.4,
      );
    }
  }
}

// ---------- HUD ----------

let messageTimer = 0;

function showMessage(text, seconds = 2.5) {
  hud.message.textContent = text;
  hud.message.style.opacity = 1;
  messageTimer = seconds;
}

function showOverlay(title, text, button) {
  overlayTitle.textContent = title;
  overlayRound.textContent = '';
  overlayText.textContent = text;
  overlayButton.textContent = button;
  overlay.classList.remove('hidden');
}

function updateHud(dt) {
  const p = game.player;
  const weapon = WEAPONS[game.weapon];
  hud.health.textContent = Math.ceil(p.health);
  hud.health.classList.toggle('low', p.health <= 30);
  hud.ammo.textContent = game.ammo[weapon.ammo];
  hud.ammo.classList.toggle('low', game.ammo[weapon.ammo] === 0);
  hud.ammoLabel.textContent = `${weapon.name} · ${weapon.ammo}`;
  for (const slot of hud.slots) {
    const name = slot.dataset.weapon;
    slot.classList.toggle('owned', game.owned[name]);
    slot.classList.toggle('active', name === game.weapon);
  }

  const alive = (type) => game.enemies.filter((e) => e.type === type && e.alive).length;
  const parts = [];
  if (game.enemies.some((e) => e.type === 'hound')) parts.push(`Hellhounds left: ${alive('hound')}`);
  if (game.enemies.some((e) => e.type === 'elephant')) parts.push(`Ice elephants left: ${alive('elephant')}`);
  if (alive('devil')) parts.push('The devil lives');
  hud.enemies.textContent = parts.join(' · ');

  const boss = game.enemies.find((e) => e.type === 'devil' && e.alive && e.awake);
  hud.boss.classList.toggle('hidden', !boss);
  if (boss) hud.bossFill.style.width = `${(boss.hp / boss.maxHp) * 100}%`;
  hud.wings.classList.toggle('hidden', !game.wings);
  hud.wingsFill.style.width = `${game.stamina * 100}%`;

  game.hurt = Math.max(0, game.hurt - dt * 1.5);
  hud.damage.style.opacity = Math.min(0.85, game.hurt);
  messageTimer -= dt;
  if (messageTimer <= 0) hud.message.style.opacity = 0;
}

// ---------- Main loop ----------

const timer = new THREE.Timer();

function frame(timestamp) {
  requestAnimationFrame(frame);
  timer.update(timestamp);
  const dt = Math.min(timer.getDelta(), 0.05);
  const t = timer.getElapsed();
  const playing = game.state === 'playing';

  if (playing) {
    game.time += dt;
    updatePlayer(dt);
    updateFlowField(game.player.x, game.player.z);
    updatePickups(dt, t);
    updateProjectiles(dt);
    if (game.winTimer > 0) {
      game.winTimer -= dt;
      if (game.winTimer <= 0) win();
    }
  }
  for (const enemy of game.enemies) enemy.update(dt, t, playing && !game.calm);
  // The music switches to the heavier boss riff while the devil is fighting.
  const bossFight = game.enemies.some((e) => e.type === 'devil' && e.alive && e.awake);
  Music.setSection(bossFight ? 'boss' : 'main');
  updateCamera(dt);
  updateViewmodel(dt);
  updateWorld(dt, t);
  game.fire.update(dt);
  game.sparks.update(dt);
  game.smoke.update(dt);
  updateHud(dt);

  graphics.render(t);
}

// Dev helper: open index.html#preview to start without mouse capture (handy for screenshots).
// Extra options: #preview&round=2&x=50&z=60&yaw=0&god&calm (calm keeps the beasts asleep)
const previewOptions = new URLSearchParams(location.hash.slice(1));
if (previewOptions.has('preview')) {
  game.state = 'playing';
  overlay.classList.add('hidden');
  game.godMode = previewOptions.has('god');
  game.calm = previewOptions.has('calm'); // beasts stay asleep: for screenshots
  if (previewOptions.has('x')) game.player.x = Number(previewOptions.get('x'));
  if (previewOptions.has('z')) game.player.z = Number(previewOptions.get('z'));
  if (previewOptions.has('yaw')) game.player.yaw = Number(previewOptions.get('yaw'));
}

frame();
