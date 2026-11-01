// Fire towers: obsidian turrets on the rim that hurl homing fireballs down at the beasts.
// Each upgrade makes them taller, adds launchers and changes the colour of the fire:
// ember orange, crimson, gold, then blue soul-fire.

const TOWER_COLORS = [0xff6a20, 0xe02a1a, 0xf0c040, 0x50e0ff];
const TOWER_LAUNCHERS = [1, 2, 2, 3];
const FIREBALL_TOWER_SPEED = 38;

let siegeTowerMats = null;

function makeSiegeTowerModel(level) {
  if (!siegeTowerMats) {
    const rock = Textures.rock();
    siegeTowerMats = {
      obsidian: new THREE.MeshPhysicalMaterial({ map: rock, color: 0x6a5a5a, normalMap: normalMapFor(rock, 4), roughness: 0.35, metalness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
      iron: new THREE.MeshStandardMaterial({ color: 0x2a2422, metalness: 0.85, roughness: 0.35 }),
      bands: TOWER_COLORS.map((color) => new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.3, emissive: color, emissiveIntensity: 0.6 })),
      orbs: TOWER_COLORS.map((color) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(3) })),
    };
  }
  const mats = siegeTowerMats;
  const group = new THREE.Group();
  const baseHeight = 1.5 + level * 0.45;
  addPart(group, new THREE.CylinderGeometry(0.85, 1.25, baseHeight, 8), mats.obsidian, 0, baseHeight / 2, 0);
  addPart(group, new THREE.CylinderGeometry(0.95, 0.95, 0.18, 8), mats.bands[level], 0, baseHeight * 0.55, 0);
  addPart(group, new THREE.CylinderGeometry(1.2, 1.05, 0.25, 8), mats.iron, 0, baseHeight + 0.12, 0);
  // Spikes round the top, more of them as it levels up.
  for (let i = 0; i < 4 + level * 2; i++) {
    const a = (i / (4 + level * 2)) * Math.PI * 2;
    addPart(group, new THREE.ConeGeometry(0.09, 0.5 + level * 0.1, 5), mats.iron, Math.cos(a) * 1.05, baseHeight + 0.45, Math.sin(a) * 1.05);
  }

  const turret = new THREE.Group(); // turns left and right
  turret.position.y = baseHeight + 0.25;
  group.add(turret);
  addPart(turret, new THREE.BoxGeometry(0.9, 0.5, 0.95), mats.iron, 0, 0.28, 0);
  // The burning orb that feeds the launchers.
  const orb = addPart(turret, new THREE.SphereGeometry(0.32, 16, 12), mats.orbs[level], 0, 0.8, 0.15);

  const pitch = new THREE.Group(); // tilts the launchers up and down
  pitch.position.y = 0.35;
  turret.add(pitch);
  const length = 1.0 + level * 0.12;
  const launcherGeometry = new THREE.CylinderGeometry(0.09, 0.13, length, 8);
  launcherGeometry.rotateX(Math.PI / 2);
  const count = TOWER_LAUNCHERS[level];
  const launchers = [];
  for (let i = 0; i < count; i++) {
    const x = (i - (count - 1) / 2) * 0.24;
    addPart(pitch, launcherGeometry, mats.iron, x, 0, -length / 2 - 0.3);
    addPart(pitch, new THREE.TorusGeometry(0.12, 0.03, 6, 12), mats.bands[level], x, 0, -length - 0.3);
    launchers.push(x);
  }
  group.traverse((o) => {
    if (o.isMesh && o !== orb) o.castShadow = o.receiveShadow = true;
  });
  return { group, turret, pitch, launchers, orb, muzzleZ: -length - 0.35, pivotHeight: baseHeight + 0.6 };
}

class SiegeTower {
  constructor(scene, col, row) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    const { x, z } = siegeCellCenter(col, row);
    this.x = x;
    this.z = z;
    this.level = 0;
    this.cooldown = 0;
    this.nextLauncher = 0;
    this.yaw = 0;
    this.build();
  }

  build() {
    if (this.model) this.scene.remove(this.model.group);
    this.model = makeSiegeTowerModel(this.level);
    this.model.group.position.set(this.x, SIEGE_RIM, this.z);
    this.model.turret.rotation.y = this.yaw;
    this.scene.add(this.model.group);
  }

  get stats() {
    return SIEGE.tower.levels[this.level];
  }

  // Cost of the next upgrade, or null when fully upgraded.
  get upgradeCost() {
    const next = SIEGE.tower.levels[this.level + 1];
    return next ? next.upgradeCost : null;
  }

  upgrade() {
    this.level += 1;
    this.build();
  }

  update(dt, t, beasts, fire) {
    this.cooldown -= dt;
    this.model.orb.scale.setScalar(1 + Math.sin(t * 6 + this.x) * 0.08);

    // Aim at the beast in range that's furthest along the path.
    const { range, damage, fireRate } = this.stats;
    let target = null;
    for (const beast of beasts) {
      if (beast.dead || Math.hypot(beast.x - this.x, beast.z - this.z) > range) continue;
      if (!target || beast.progress > target.progress) target = beast;
    }
    if (!target) return;
    const dx = target.x - this.x;
    const dz = target.z - this.z;
    this.yaw = Math.atan2(-dx, -dz);
    this.model.turret.rotation.y = this.yaw;
    this.model.pitch.rotation.x = Math.atan2(target.centerY - (SIEGE_RIM + this.model.pivotHeight), Math.hypot(dx, dz));

    if (this.cooldown > 0) return;
    this.cooldown = 1 / fireRate;
    const launcherX = this.model.launchers[this.nextLauncher++ % this.model.launchers.length];
    this.model.group.updateMatrixWorld(true);
    const muzzle = this.model.pitch.localToWorld(new THREE.Vector3(launcherX, 0, this.model.muzzleZ));
    fire(muzzle, target, damage, this.level);
  }
}

// Homing fireballs: a ball of light in the tower's colour with a trail of flames.
let siegeFireballMats = null;
let siegeGlow = null;

function createSiegeFireball(scene, from, target, damage, level) {
  if (!siegeFireballMats) {
    siegeGlow = Textures.glow();
    siegeFireballMats = TOWER_COLORS.map((color) => new THREE.SpriteMaterial({
      map: siegeGlow,
      color: new THREE.Color(color).multiplyScalar(2.5),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    }));
  }
  const sprite = new THREE.Sprite(siegeFireballMats[level]);
  sprite.scale.setScalar(0.9);
  sprite.position.copy(from);
  scene.add(sprite);
  return { sprite, target, damage, level, aim: new THREE.Vector3(target.x, target.centerY, target.z), done: false };
}

function updateSiegeFireball(ball, dt, onHit, trail) {
  const target = ball.target;
  if (!target.dead) ball.aim.set(target.x, target.centerY, target.z);
  const toAim = ball.aim.clone().sub(ball.sprite.position);
  const dist = toAim.length();
  const step = FIREBALL_TOWER_SPEED * dt;
  if (dist <= step) {
    if (!target.dead) onHit(target, ball.damage, ball.aim.clone());
    ball.done = true;
    ball.sprite.parent.remove(ball.sprite);
    return;
  }
  ball.sprite.position.addScaledVector(toAim, step / dist);
  const p = ball.sprite.position;
  trail(p.x, p.y, p.z, ball.level);
}
