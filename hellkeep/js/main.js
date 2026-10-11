// Hellkeep: a small Doom-style shooter. Storm a castle in hell and put down every hellhound.

if (typeof THREE === 'undefined') {
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

// ---------- Page elements ----------

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const overlayButton = document.getElementById('overlay-button');
const hud = {
  health: document.getElementById('health'),
  ammo: document.getElementById('ammo'),
  ammoLabel: document.getElementById('ammo-label'),
  hounds: document.getElementById('hounds'),
  message: document.getElementById('message'),
  damage: document.getElementById('damage'),
  slots: [...document.querySelectorAll('#slots span')],
};

// ---------- Renderer, scenes and cameras ----------

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;
document.getElementById('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1c0504);
scene.fog = new THREE.FogExp2(0x1c0504, 0.03);
scene.add(new THREE.HemisphereLight(0xff9a6a, 0x3a1010, 1.4));

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 400);
camera.rotation.order = 'YXZ';

// Lights up the world for a split second when you fire.
const gunLight = new THREE.PointLight(0xffb060, 0, 16, 1.5);
scene.add(gunLight);

// The gun is drawn in its own scene on top of the world, so it never pokes through walls.
const weaponScene = new THREE.Scene();
const weaponCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10);
weaponScene.add(new THREE.HemisphereLight(0xffc49a, 0x3a1010, 1.1));
const weaponKeyLight = new THREE.DirectionalLight(0xff9a60, 0.9);
weaponKeyLight.position.set(-1, 1, 0.5);
weaponScene.add(weaponKeyLight);
const weaponFlashLight = new THREE.PointLight(0xffb060, 0, 3);
weaponFlashLight.position.set(0.15, 0, -0.9);
weaponScene.add(weaponFlashLight);

// ---------- World ----------

const level = buildLevel(scene);
const glowTexture = Textures.glow();
const ammoMaterial = new THREE.MeshStandardMaterial({ map: Textures.ammoCrate(), emissive: 0xffffff, emissiveIntensity: 0.25 });
ammoMaterial.emissiveMap = ammoMaterial.map;
const healthMaterial = new THREE.MeshStandardMaterial({ map: Textures.healthBox(), emissive: 0xffffff, emissiveIntensity: 0.25 });
healthMaterial.emissiveMap = healthMaterial.map;

const game = {
  state: 'menu', // menu | playing | paused | dead | won
  player: { x: level.playerStart.x, z: level.playerStart.z, yaw: 0, pitch: 0, health: MAX_HEALTH },
  ammo: { bullets: 60, shells: 16 },
  owned: { pistol: true, shotgun: true, rifle: false },
  weapon: 'shotgun',
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
  fire: new ParticleSystem(scene, { max: 3000, size: 0.55, texture: glowTexture, damping: 0.96 }),
  sparks: new ParticleSystem(scene, { max: 1000, size: 0.13, texture: glowTexture, damping: 0.97 }),
  hounds: [],
  pickups: [],
  damagePlayer,
  onHoundKilled,
};
game.hounds = level.hounds.map((spot) => new Hound(scene, spot.x, spot.z));
game.pickups = level.pickups.map((spot) => createPickup(spot.type, spot.x, spot.z));

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

function createPickup(type, x, z) {
  let mesh;
  if (type === 'ammo') mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.55), ammoMaterial);
  else if (type === 'health') mesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.65), healthMaterial);
  else {
    mesh = buildRifle().group;
    mesh.scale.setScalar(1.8);
  }
  mesh.position.set(x, 0.5, z);
  scene.add(mesh);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture,
    color: type === 'health' ? 0x30ff60 : 0xffb030,
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

// ---------- Input ----------

const keys = {};

addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (game.state !== 'playing') return;
  if (e.code === 'Digit1') switchWeapon('pistol');
  if (e.code === 'Digit2') switchWeapon('shotgun');
  if (e.code === 'Digit3') switchWeapon('rifle');
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
  if (game.state === 'dead' || game.state === 'won') {
    location.reload();
    return;
  }
  Sound.init();
  Sound.resume();
  const request = renderer.domElement.requestPointerLock();
  if (request && request.catch) request.catch(() => {});
});

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  if (locked && (game.state === 'menu' || game.state === 'paused')) {
    if (game.state === 'menu') showMessage('Enter the castle. Kill every hellhound.', 4);
    game.state = 'playing';
    overlay.classList.add('hidden');
  } else if (!locked && game.state === 'playing') {
    game.state = 'paused';
    game.mouseDown = false;
    showOverlay('Paused', 'The hounds are waiting.', 'Click to resume');
  }
});

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = weaponCamera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  weaponCamera.updateProjectionMatrix();
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

  // Gunfire wakes up hounds nearby, even through walls.
  const p = game.player;
  for (const hound of game.hounds) {
    if (hound.alive && Math.hypot(hound.x - p.x, hound.z - p.z) < 18) hound.alert();
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
  let wallT = SHOT_RANGE;
  for (let t = 0.2; t < SHOT_RANGE; t += 0.08) {
    const x = origin.x + dir.x * t;
    const y = origin.y + dir.y * t;
    const z = origin.z + dir.z * t;
    if (y <= 0 || y >= ceilingAt(x, z) || isWallAt(x, z)) {
      wallT = t;
      break;
    }
  }

  // Then find the closest hound in front of that.
  let target = null;
  let targetT = wallT;
  for (const hound of game.hounds) {
    if (!hound.alive) continue;
    for (const sphere of hound.hitSpheres()) {
      const t = raySphere(origin, dir, sphere);
      if (t !== null && t < targetT) {
        targetT = t;
        target = hound;
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
  game.shake = 1;
  Sound.hurt();
  if (p.health <= 0) {
    game.state = 'dead';
    game.mouseDown = false;
    document.exitPointerLock();
    const total = game.hounds.length;
    showOverlay('You died', `Torn apart by hellhounds. You put down ${game.kills} of ${total}.`, 'Click to try again');
  }
}

function onHoundKilled() {
  game.kills += 1;
  if (game.hounds.every((h) => !h.alive)) {
    game.winTimer = 2;
    showMessage('The castle falls silent...', 3);
  }
}

function win() {
  game.state = 'won';
  game.mouseDown = false;
  document.exitPointerLock();
  const minutes = Math.floor(game.time / 60);
  const seconds = String(Math.floor(game.time % 60)).padStart(2, '0');
  showOverlay(
    'Castle cleared',
    `Every hellhound is dead. Time: ${minutes}:${seconds}. Health left: ${Math.ceil(game.player.health)}.`,
    'Click to play again',
  );
}

function updatePlayer(dt) {
  const p = game.player;
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
  game.moveAmount += ((len > 0 ? 1 : 0) - game.moveAmount) * Math.min(1, dt * 10);
  game.bobPhase += dt * speed * 1.4 * game.moveAmount;

  if (isLavaAt(p.x, p.z)) {
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

function updatePickups(dt, t) {
  const p = game.player;
  for (const pickup of game.pickups) {
    if (pickup.taken) continue;
    pickup.mesh.rotation.y += dt * 1.2;
    pickup.mesh.position.y = 0.5 + Math.sin(t * 2 + pickup.phase) * 0.1;
    if (Math.hypot(pickup.x - p.x, pickup.z - p.z) < 1.3) collect(pickup);
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
  }
  pickup.taken = true;
  scene.remove(pickup.mesh);
  scene.remove(pickup.glow);
  Sound.pickup();
}

function updateCamera(dt) {
  const p = game.player;
  if (game.state === 'dead') game.eye = Math.max(0.35, game.eye - dt * 3);
  const bob = Math.abs(Math.sin(game.bobPhase)) * 0.06 * game.moveAmount;
  camera.position.set(p.x, game.eye + bob, p.z);
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
  vm.group.position.set(vm.base.x + bobX, vm.base.y + bobY - game.lower * 0.4, vm.base.z + game.recoil * 0.08);
  vm.group.rotation.set(game.recoil * 0.25, 0.06, 0); // angled slightly toward the crosshair
  vm.group.visible = game.state !== 'dead';

  // Shotgun pump slides back and forward after each shot.
  if (vm.pump) {
    const phase = clamp((weapon.cooldown - game.cooldown - 0.15) / 0.45, 0, 1);
    vm.pump.position.z = vm.pumpZ + Math.sin(phase * Math.PI) * 0.12;
  }

  vm.flash.visible = game.flash > 0;
  if (vm.flash.visible) vm.flash.material.rotation = rand(0, Math.PI * 2);
  weaponFlashLight.intensity = game.flash > 0 ? 3 : 0;
  gunLight.position.copy(camera.position);
  gunLight.intensity = game.flash > 0 ? 2.5 : 0;
}

// ---------- World effects ----------

let emberAcc = 0;

function updateWorld(dt, t) {
  level.lavaTexture.offset.set(t * 0.02, t * 0.013);

  level.fires.forEach((fire, i) => {
    fire.light.intensity = 1.6 + Math.sin(t * 13 + i * 2) * 0.15 + Math.sin(t * 29 + i) * 0.1;
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

  // Embers drifting up from the lava.
  emberAcc += dt * 25;
  while (emberAcc >= 1 && level.lavaCells.length) {
    emberAcc -= 1;
    const cell = level.lavaCells[Math.floor(Math.random() * level.lavaCells.length)];
    game.sparks.emit(
      cell.x + rand(-2, 2), 0.1, cell.z + rand(-2, 2),
      rand(-0.3, 0.3), rand(0.8, 2.2), rand(-0.3, 0.3),
      rand(1.5, 3), 0.2,
    );
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
  hud.hounds.textContent = `Hellhounds left: ${game.hounds.filter((h) => h.alive).length}`;
  game.hurt = Math.max(0, game.hurt - dt * 1.5);
  hud.damage.style.opacity = Math.min(0.85, game.hurt);
  messageTimer -= dt;
  if (messageTimer <= 0) hud.message.style.opacity = 0;
}

// ---------- Main loop ----------

const clock = new THREE.Clock();

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const playing = game.state === 'playing';

  if (playing) {
    game.time += dt;
    updatePlayer(dt);
    updateFlowField(game.player.x, game.player.z);
    updatePickups(dt, t);
    if (game.winTimer > 0) {
      game.winTimer -= dt;
      if (game.winTimer <= 0) win();
    }
  }
  for (const hound of game.hounds) hound.update(dt, t, playing);
  updateCamera(dt);
  updateViewmodel(dt);
  updateWorld(dt, t);
  game.fire.update(dt);
  game.sparks.update(dt);
  updateHud(dt);

  renderer.clear();
  renderer.render(scene, camera);
  renderer.clearDepth();
  renderer.render(weaponScene, weaponCamera);
}

// Dev helper: open index.html#preview to start without mouse capture (handy for screenshots).
// Extra options: #preview&x=50&z=60&yaw=0&god
const previewOptions = new URLSearchParams(location.hash.slice(1));
if (previewOptions.has('preview')) {
  game.state = 'playing';
  overlay.classList.add('hidden');
  game.godMode = previewOptions.has('god');
  if (previewOptions.has('x')) game.player.x = Number(previewOptions.get('x'));
  if (previewOptions.has('z')) game.player.z = Number(previewOptions.get('z'));
  if (previewOptions.has('yaw')) game.player.yaw = Number(previewOptions.get('yaw'));
}

frame();
