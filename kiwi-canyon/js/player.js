// First-person mode: you on the canyon floor with a scoped hunting rifle.

const EYE_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.4;
const WALK_SPEED = 7;
const SPRINT_SPEED = 10.5;
const MOUSE_SENSITIVITY = 0.0022;
const SHOT_RANGE = 90;

const playerStart = cellCenter(8, 6);
const player = {
  x: playerStart.x,
  z: playerStart.z,
  yaw: -Math.PI / 2, // facing east, up the canyon towards the incoming kiwis
  pitch: -0.05,
  ammo: CONFIG.rifle.magazine,
  reloadTimer: 0,
  cooldown: 0,
  recoil: 0,
  flash: 0,
  bobPhase: 0,
  moveAmount: 0,
};

function buildRifleModel() {
  const group = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0x2c3036, metalness: 0.75, roughness: 0.35 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x6a3a1c, roughness: 0.6 });
  const tube = (radius, length) => new THREE.CylinderGeometry(radius, radius, length, 12).rotateX(Math.PI / 2);
  addPart(group, new THREE.BoxGeometry(0.065, 0.08, 0.32), steel, 0, 0.02, 0);          // receiver
  addPart(group, tube(0.016, 0.55), steel, 0, 0.035, -0.42);                            // barrel
  addPart(group, new THREE.BoxGeometry(0.07, 0.07, 0.42), wood, 0, -0.02, -0.3);        // fore-end
  addPart(group, new THREE.BoxGeometry(0.06, 0.13, 0.34), wood, 0, -0.06, 0.3).rotation.x = 0.18; // stock
  addPart(group, tube(0.028, 0.3), steel, 0, 0.1, -0.02);                               // scope
  addPart(group, tube(0.036, 0.05), steel, 0, 0.1, -0.18);                              // scope front
  addPart(group, new THREE.BoxGeometry(0.02, 0.04, 0.03), steel, 0, 0.07, -0.08);       // scope mount
  addPart(group, new THREE.BoxGeometry(0.02, 0.04, 0.03), steel, 0, 0.07, 0.05);
  addPart(group, new THREE.BoxGeometry(0.04, 0.03, 0.05), steel, 0.04, 0.03, 0.08);     // bolt handle
  return { group, muzzle: new THREE.Vector3(0, 0.035, -0.71), base: new THREE.Vector3(0.2, -0.21, -0.55) };
}

function rifleDamage() {
  return CONFIG.rifle.levels[game.rifleLevel].damage;
}

function startReload() {
  if (player.reloadTimer > 0 || player.ammo === CONFIG.rifle.magazine) return;
  player.reloadTimer = CONFIG.rifle.reloadTime;
  Sound.reload();
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
    moveWithCollision(player, mx, mz, PLAYER_RADIUS);
  }
  player.moveAmount += ((len > 0 ? 1 : 0) - player.moveAmount) * Math.min(1, dt * 10);
  player.bobPhase += dt * speed * 1.4 * player.moveAmount;

  player.cooldown = Math.max(0, player.cooldown - dt);
  if (player.reloadTimer > 0) {
    player.reloadTimer -= dt;
    if (player.reloadTimer <= 0) {
      player.reloadTimer = 0;
      player.ammo = CONFIG.rifle.magazine;
    }
  } else if (mouseDown && player.cooldown <= 0) {
    if (player.ammo > 0) playerShoot();
    else {
      Sound.empty();
      startReload();
    }
  }

  const bob = Math.abs(Math.sin(player.bobPhase)) * 0.06 * player.moveAmount;
  fpsCamera.position.set(player.x, EYE_HEIGHT + bob, player.z);
  fpsCamera.rotation.set(player.pitch, player.yaw, 0);
}

function playerShoot() {
  player.ammo -= 1;
  player.cooldown = CONFIG.rifle.fireInterval;
  player.recoil = Math.min(1.2, player.recoil + 0.35);
  player.flash = 0.05;
  player.pitch = Math.min(1.4, player.pitch + 0.004);
  Sound.rifle();

  const origin = fpsCamera.position.clone();
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(fpsCamera.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(fpsCamera.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(fpsCamera.quaternion);
  dir.addScaledVector(right, spreadRandom() * CONFIG.rifle.spread).addScaledVector(up, spreadRandom() * CONFIG.rifle.spread).normalize();

  // Walk along the ray until it hits the floor or a canyon wall.
  let wallT = SHOT_RANGE;
  for (let t = 0.2; t < SHOT_RANGE; t += 0.1) {
    const x = origin.x + dir.x * t;
    const y = origin.y + dir.y * t;
    const z = origin.z + dir.z * t;
    if (y <= 0 || (y < RIM_H && !isCanyonAt(x, z))) {
      wallT = t;
      break;
    }
  }

  // Then the closest kiwi in front of that.
  let target = null;
  let targetT = wallT;
  for (const kiwi of game.kiwis) {
    if (kiwi.dead) continue;
    for (const sphere of kiwi.hitSpheres()) {
      const t = raySphere(origin, dir, sphere);
      if (t !== null && t < targetT) {
        targetT = t;
        target = kiwi;
      }
    }
  }

  const hit = origin.clone().addScaledVector(dir, (target ? targetT : wallT) - 0.05);
  const muzzle = origin.clone().addScaledVector(right, 0.12).addScaledVector(up, -0.1).addScaledVector(dir, 0.6);
  tracer.show(muzzle, hit);
  if (target) {
    Sound.hit();
    damageKiwi(target, rifleDamage(), hit);
  } else if (wallT < SHOT_RANGE) {
    for (let i = 0; i < 6; i++) {
      dust.emit({
        x: hit.x, y: hit.y, z: hit.z,
        vx: -dir.x * 2 + rand(-1.5, 1.5), vy: rand(0.5, 2.5), vz: -dir.z * 2 + rand(-1.5, 1.5),
        life: rand(0.4, 0.8), size: rand(0.15, 0.3), color: [0.75, 0.7, 0.62], gravity: -4,
      });
    }
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
  const reload = player.reloadTimer > 0 ? Math.sin((1 - player.reloadTimer / CONFIG.rifle.reloadTime) * Math.PI) : 0;
  const bobX = Math.sin(player.bobPhase) * 0.015 * player.moveAmount;
  const bobY = -Math.abs(Math.cos(player.bobPhase)) * 0.012 * player.moveAmount;
  const v = rifleView;
  v.group.position.set(v.base.x + bobX, v.base.y + bobY - reload * 0.12, v.base.z + player.recoil * 0.06);
  v.group.rotation.set(player.recoil * 0.12 + reload * 0.3, 0.06, reload * 0.5);
  v.flash.visible = player.flash > 0;
  if (v.flash.visible) v.flash.material.rotation = rand(0, Math.PI * 2);
}
