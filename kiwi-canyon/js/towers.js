// Towers: stone turrets on the canyon rim that fire glowing bolts down at the kiwis.
// Each upgrade makes them taller, adds barrels and changes the colour of the band.

const LEVEL_COLORS = [0xb87333, 0xc8ccd4, 0xf0c040, 0x50e0ff]; // bronze, silver, gold, glowing blue
const BARREL_COUNTS = [1, 2, 2, 3];
const BOLT_SPEED = 45;

let towerMaterials = null;

function makeTowerModel(level) {
  if (!towerMaterials) {
    towerMaterials = {
      stone: new THREE.MeshStandardMaterial({ map: Textures.stone(), roughness: 0.9 }),
      wood: new THREE.MeshStandardMaterial({ map: Textures.wood(), roughness: 0.8 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x3a3f46, metalness: 0.7, roughness: 0.35 }),
      bands: LEVEL_COLORS.map((color, i) => new THREE.MeshStandardMaterial({
        color,
        metalness: 0.8,
        roughness: 0.3,
        emissive: i === 3 ? color : 0x000000,
        emissiveIntensity: i === 3 ? 0.6 : 0,
      })),
      flash: new THREE.SpriteMaterial({ map: Textures.softDot(), color: 0xffe08a, blending: THREE.AdditiveBlending, depthWrite: false }),
    };
  }
  const mats = towerMaterials;
  const group = new THREE.Group();
  const baseHeight = 1.4 + level * 0.4;
  addPart(group, new THREE.CylinderGeometry(1.0, 1.25, baseHeight, 12), mats.stone, 0, baseHeight / 2, 0);
  addPart(group, new THREE.CylinderGeometry(1.06, 1.12, 0.2, 12), mats.bands[level], 0, baseHeight * 0.55, 0);
  addPart(group, new THREE.CylinderGeometry(1.3, 1.3, 0.2, 12), mats.wood, 0, baseHeight + 0.1, 0);

  const turret = new THREE.Group(); // turns left and right
  turret.position.y = baseHeight + 0.2;
  group.add(turret);
  addPart(turret, new THREE.BoxGeometry(0.95, 0.55, 1.0), mats.metal, 0, 0.3, 0);
  addPart(turret, new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.bands[level], 0, 0.55, 0.1);

  const pitch = new THREE.Group(); // tilts the barrels up and down
  pitch.position.y = 0.35;
  turret.add(pitch);
  const barrelLength = 1.1 + level * 0.12;
  const barrelGeometry = new THREE.CylinderGeometry(0.07, 0.08, barrelLength, 8);
  barrelGeometry.rotateX(Math.PI / 2);
  const count = BARREL_COUNTS[level];
  const barrels = [];
  for (let i = 0; i < count; i++) {
    const x = (i - (count - 1) / 2) * 0.2;
    addPart(pitch, barrelGeometry, mats.metal, x, 0, -barrelLength / 2 - 0.3);
    barrels.push(x);
  }
  const flash = new THREE.Sprite(mats.flash);
  flash.scale.setScalar(0.7);
  flash.visible = false;
  pitch.add(flash);

  castShadows(group);
  return { group, turret, pitch, barrels, flash, muzzleZ: -barrelLength - 0.3, pivotHeight: baseHeight + 0.55 };
}

class Tower {
  constructor(scene, col, row) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    const { x, z } = cellCenter(col, row);
    this.x = x;
    this.z = z;
    this.level = 0;
    this.cooldown = 0;
    this.flashTimer = 0;
    this.nextBarrel = 0;
    this.yaw = 0;
    this.build();
  }

  build() {
    if (this.model) this.scene.remove(this.model.group);
    this.model = makeTowerModel(this.level);
    this.model.group.position.set(this.x, RIM_H, this.z);
    this.model.turret.rotation.y = this.yaw;
    this.scene.add(this.model.group);
  }

  get stats() {
    return CONFIG.tower.levels[this.level];
  }

  // Cost of the next upgrade, or null when fully upgraded.
  get upgradeCost() {
    const next = CONFIG.tower.levels[this.level + 1];
    return next ? next.upgradeCost : null;
  }

  upgrade() {
    this.level += 1;
    this.build();
  }

  update(dt, kiwis, spawnBolt) {
    this.cooldown -= dt;
    this.flashTimer -= dt;
    this.model.flash.visible = this.flashTimer > 0;

    // Aim at the kiwi in range that is furthest along the path.
    const { range, damage, fireRate } = this.stats;
    let target = null;
    for (const kiwi of kiwis) {
      if (kiwi.dead || Math.hypot(kiwi.x - this.x, kiwi.z - this.z) > range) continue;
      if (!target || kiwi.progress > target.progress) target = kiwi;
    }
    if (!target) return;

    const dx = target.x - this.x;
    const dz = target.z - this.z;
    this.yaw = Math.atan2(-dx, -dz);
    this.model.turret.rotation.y = this.yaw;
    this.model.pitch.rotation.x = Math.atan2(target.centerY - (RIM_H + this.model.pivotHeight), Math.hypot(dx, dz));

    if (this.cooldown > 0) return;
    this.cooldown = 1 / fireRate;
    const barrelX = this.model.barrels[this.nextBarrel++ % this.model.barrels.length];
    this.model.flash.position.set(barrelX, 0, this.model.muzzleZ);
    this.flashTimer = 0.05;
    this.model.group.updateMatrixWorld(true);
    const muzzle = this.model.pitch.localToWorld(new THREE.Vector3(barrelX, 0, this.model.muzzleZ));
    spawnBolt(muzzle, target, damage, this.level);
  }
}

// Glowing bolts that home in on their kiwi.
let boltGeometry = null;
let boltMaterials = null;

function createBolt(scene, from, target, damage, level) {
  if (!boltGeometry) {
    boltGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.8);
    boltMaterials = LEVEL_COLORS.map((color) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.4) }));
  }
  const mesh = new THREE.Mesh(boltGeometry, boltMaterials[level]);
  mesh.position.copy(from);
  scene.add(mesh);
  return { mesh, target, damage, aim: new THREE.Vector3(target.x, target.centerY, target.z), done: false };
}

function updateBolt(bolt, dt, onHit) {
  const target = bolt.target;
  if (!target.dead) bolt.aim.set(target.x, target.centerY, target.z);
  const toAim = bolt.aim.clone().sub(bolt.mesh.position);
  const dist = toAim.length();
  const step = BOLT_SPEED * dt;
  if (dist <= step) {
    if (!target.dead) onHit(target, bolt.damage, bolt.aim);
    bolt.done = true;
    bolt.mesh.parent.remove(bolt.mesh);
    return;
  }
  bolt.mesh.position.addScaledVector(toAim, step / dist);
  bolt.mesh.lookAt(bolt.aim);
}
