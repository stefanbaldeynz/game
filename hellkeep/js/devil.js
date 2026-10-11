// The devil: round 1's mini boss, waiting by the throne.
// Hurls fireballs, stabs with his trident up close, and gets angrier below half health.
// When he dies he drops a jetpack.

const DEVIL_HP = 1200;
const DEVIL_RADIUS = 0.8;
const FIREBALL_SPEED = 15;
const FIREBALL_DAMAGE = 15;
const TRIDENT_DAMAGE = 16;

let devilTextures = null;

function makeWing(material, side) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(1.6, 0.9);
  shape.lineTo(2.5, 0.25);
  shape.quadraticCurveTo(2.1, -0.1, 2.0, -0.45);
  shape.quadraticCurveTo(1.7, -0.05, 1.45, -0.15);
  shape.quadraticCurveTo(1.25, -0.5, 1.05, -0.75);
  shape.quadraticCurveTo(0.8, -0.3, 0.55, -0.3);
  shape.quadraticCurveTo(0.35, -0.5, 0.2, -0.65);
  shape.lineTo(0, 0);
  const wing = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  wing.scale.x = side;
  return wing;
}

function makeDevilModel() {
  if (!devilTextures) devilTextures = { skin: Textures.devilSkin(), veins: Textures.devilVeins() };
  const skin = new THREE.MeshStandardMaterial({
    map: devilTextures.skin,
    emissive: 0xffffff,
    emissiveMap: devilTextures.veins,
    roughness: 0.6,
  });
  const black = new THREE.MeshStandardMaterial({ color: 0x140808, roughness: 0.5 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8a030, metalness: 0.85, roughness: 0.3, emissive: 0x3a1a00 });
  const membrane = new THREE.MeshStandardMaterial({ color: 0x4a0606, roughness: 0.8, side: THREE.DoubleSide, emissive: 0x200000 });
  const eyes = new THREE.MeshBasicMaterial({ color: 0xffe040 });

  const group = new THREE.Group();

  // Goat legs with black hooves.
  const legs = [-1, 1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.3, 1.65, 0);
    group.add(hip);
    const thigh = addPart(hip, new THREE.CylinderGeometry(0.19, 0.14, 0.85, 10).translate(0, -0.42, 0), skin);
    thigh.rotation.x = 0.25; // goat legs: thigh forward, shin back
    const knee = new THREE.Group();
    knee.position.set(0, -0.8, -0.2);
    hip.add(knee);
    const shin = addPart(knee, new THREE.CylinderGeometry(0.12, 0.09, 0.85, 10).translate(0, -0.42, 0), skin);
    shin.rotation.x = -0.35;
    addPart(knee, new THREE.BoxGeometry(0.2, 0.14, 0.26), black, 0, -0.8, 0.28);
    return hip;
  });

  const torso = new THREE.Group(); // leans and breathes
  torso.position.y = 1.7;
  group.add(torso);
  addPart(torso, new THREE.BoxGeometry(0.75, 0.35, 0.5), black, 0, 0.05, 0); // loincloth
  const chest = addPart(torso, new THREE.CylinderGeometry(0.58, 0.42, 1.15, 12), skin, 0, 0.75, 0);
  chest.scale.z = 0.65;
  for (const side of [-1, 1]) addPart(torso, new THREE.SphereGeometry(0.32, 12, 10), skin, side * 0.62, 1.2, 0);

  // Arms: the left one throws fireballs, the right one holds the trident.
  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.72, 1.2, 0);
    torso.add(shoulder);
    addPart(shoulder, new THREE.CylinderGeometry(0.15, 0.13, 0.7, 10).translate(0, -0.35, 0), skin);
    const elbow = new THREE.Group();
    elbow.position.y = -0.68;
    shoulder.add(elbow);
    addPart(elbow, new THREE.CylinderGeometry(0.13, 0.11, 0.65, 10).translate(0, -0.32, 0), skin);
    addPart(elbow, new THREE.SphereGeometry(0.14, 10, 8), skin, 0, -0.7, 0);
    return { shoulder, elbow };
  });
  const trident = new THREE.Group();
  trident.position.set(0, -0.7, 0);
  arms[1].elbow.add(trident);
  addPart(trident, new THREE.CylinderGeometry(0.04, 0.04, 3.2, 8), gold, 0, 0.6, 0);
  for (const x of [-0.18, 0, 0.18]) {
    const prong = addPart(trident, new THREE.ConeGeometry(0.05, x ? 0.55 : 0.7, 6), gold, x, 2.45 + (x ? 0 : 0.08), 0);
    prong.rotation.z = -x * 0.6;
  }
  addPart(trident, new THREE.BoxGeometry(0.45, 0.06, 0.06), gold, 0, 2.2, 0);

  // Horned head with burning eyes and a goatee.
  const head = new THREE.Group();
  head.position.set(0, 1.62, -0.05);
  torso.add(head);
  addPart(head, new THREE.BoxGeometry(0.5, 0.55, 0.5), skin, 0, 0.2, 0);
  addPart(head, new THREE.BoxGeometry(0.42, 0.18, 0.3), skin, 0, -0.08, -0.12); // jaw
  for (const side of [-1, 1]) {
    addPart(head, new THREE.BoxGeometry(0.12, 0.05, 0.02), eyes, side * 0.12, 0.28, -0.26);
    curvedSpike(head, [
      [side * 0.18, 0.42, 0],
      [side * 0.45, 0.6, 0.05],
      [side * 0.55, 0.95, 0.2],
      [side * 0.4, 1.2, 0.35],
    ], 0.07, black, 0.25);
  }
  const goatee = addPart(head, new THREE.ConeGeometry(0.08, 0.3, 6), black, 0, -0.3, -0.2);
  goatee.rotation.x = Math.PI;

  // Bat wings on his back.
  const wings = [-1, 1].map((side) => {
    const root = new THREE.Group();
    root.position.set(side * 0.25, 1.1, 0.3);
    torso.add(root);
    const wing = makeWing(membrane, side);
    root.add(wing);
    root.rotation.y = -side * 0.6; // swept back
    return root;
  });

  const tailCurve = [[0, 0, 0.25], [0, -0.4, 0.8], [0, -0.6, 1.4], [0, -0.2, 1.8]];
  curvedSpike(torso, tailCurve, 0.05, skin, 0.3);

  return { group, torso, legs, arms, trident, head, wings, skin };
}

class Devil {
  constructor(scene, x, z) {
    this.type = 'devil';
    this.radius = DEVIL_RADIUS;
    this.scene = scene;
    this.x = x;
    this.z = z;
    this.yaw = 0; // facing north at first, then he turns to face you
    this.hp = DEVIL_HP;
    this.maxHp = DEVIL_HP;
    this.state = 'idle'; // idle | fight | dead
    this.enraged = false;
    this.seed = rand(0, 100);
    this.stepPhase = 0;
    this.thinkTimer = 0;
    this.seesPlayer = false;
    this.fireCooldown = 1.5;
    this.attackCooldown = 1;
    this.throwAnim = 0;
    this.stabAnim = 0;
    this.flash = 0;
    this.deathT = 0;
    this.flameAcc = 0;
    Object.assign(this, makeDevilModel());
    this.yaw = Math.PI; // face south, towards the doorway
    this.group.position.set(x, 0, z);
    scene.add(this.group);
  }

  get alive() {
    return this.state !== 'dead';
  }

  get awake() {
    return this.state === 'fight';
  }

  alert() {
    if (this.state !== 'idle') return;
    this.state = 'fight';
    Sound.roar();
    game.showMessage('THE DEVIL AWAKENS', 3);
  }

  localToWorld(lx, ly, lz) {
    const c = Math.cos(this.yaw);
    const s = Math.sin(this.yaw);
    return { x: this.x + lx * c + lz * s, y: ly, z: this.z - lx * s + lz * c };
  }

  hitSpheres() {
    return [
      { ...this.localToWorld(0, 1.0, 0), r: 0.55 },
      { ...this.localToWorld(0, 2.4, 0), r: 0.75 },
      { ...this.localToWorld(0, 3.5, -0.05), r: 0.45 },
    ];
  }

  takeDamage(amount, direction) {
    if (!this.alive) return;
    this.hp -= amount;
    this.flash = 0.1;
    this.alert();
    if (!this.enraged && this.hp < this.maxHp / 2) {
      this.enraged = true;
      Sound.roar();
      game.showMessage('The devil is enraged!', 2.5);
    }
    if (this.hp <= 0) this.die();
  }

  die() {
    this.state = 'dead';
    this.hp = 0;
    Sound.roar();
    Sound.explosion();
    for (let i = 0; i < 160; i++) {
      game.fire.emit(this.x + rand(-0.8, 0.8), rand(0.5, 3.5), this.z + rand(-0.8, 0.8), rand(-5, 5), rand(0, 6), rand(-5, 5), rand(0.6, 1.4), 1);
    }
    game.dropPickup('jetpack', this.x, this.z);
    game.showMessage('The devil is dead! He dropped a JETPACK', 4);
    game.onEnemyKilled(this);
  }

  turnToward(dx, dz, dt) {
    const target = Math.atan2(-dx, -dz);
    const diff = Math.atan2(Math.sin(target - this.yaw), Math.cos(target - this.yaw));
    this.yaw += diff * Math.min(1, dt * 6);
  }

  update(dt, t, active) {
    if (!this.alive) {
      this.updateDeath(dt);
      return;
    }
    const moving = active ? this.think(dt) : false;
    this.animate(dt, t, moving);
    this.emitFlames(dt);
  }

  think(dt) {
    const p = game.player;
    const dx = p.x - this.x;
    const dz = p.z - this.z;
    const dist = Math.hypot(dx, dz);

    this.thinkTimer -= dt;
    if (this.thinkTimer <= 0) {
      this.thinkTimer = 0.25;
      this.seesPlayer = hasLineOfSight(this.x, this.z, p.x, p.z);
      if (this.state === 'idle' && ((this.seesPlayer && dist < 18) || dist < 7)) this.alert();
    }
    if (this.state !== 'fight') return false;

    this.turnToward(dx, dz, dt);
    this.fireCooldown -= dt;
    this.attackCooldown -= dt;
    let moving = false;

    // Close in, but not too close: he prefers to throw fire.
    if (dist > 7 || !this.seesPlayer) {
      let tx = p.x;
      let tz = p.z;
      if (!this.seesPlayer) {
        const step = nextStepToward(this.x, this.z);
        if (step) {
          tx = step.x;
          tz = step.z;
        }
      }
      const mx = tx - this.x;
      const mz = tz - this.z;
      const len = Math.hypot(mx, mz) || 1;
      const speed = this.enraged ? 4.2 : 3.2;
      moveWithCollision(this, (mx / len) * speed * dt, (mz / len) * speed * dt, DEVIL_RADIUS, true);
      moving = true;
    }

    if (dist < 3.4 && p.y < 2.5 && this.attackCooldown <= 0) {
      this.attackCooldown = this.enraged ? 1.0 : 1.4;
      this.stabAnim = 0.35;
      Sound.gore();
      game.damagePlayer(TRIDENT_DAMAGE);
      game.knockPlayer(dx / (dist || 1), dz / (dist || 1), 7);
    } else if (this.seesPlayer && dist > 3 && this.fireCooldown <= 0) {
      this.fireCooldown = this.enraged ? 1.5 : 2.4;
      this.throwAnim = 0.5;
      this.throwFireballs();
    }
    return moving;
  }

  throwFireballs() {
    const p = game.player;
    const hand = this.localToWorld(-0.8, 3.0, -0.4);
    // Aim where you're heading, but only half way, so you can dodge.
    const flight = Math.hypot(p.x - hand.x, p.z - hand.z) / FIREBALL_SPEED;
    const tx = p.x + p.vx * flight * 0.5;
    const tz = p.z + p.vz * flight * 0.5;
    const ty = p.y + 1.1;
    const spread = this.enraged ? [-0.18, 0, 0.18] : [0];
    for (const angle of spread) {
      const dx = tx - hand.x;
      const dz = tz - hand.z;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const rx = dx * c - dz * s;
      const rz = dx * s + dz * c;
      const len = Math.hypot(rx, ty - hand.y, rz) || 1;
      game.projectiles.push(new Fireball(this.scene, hand, {
        x: (rx / len) * FIREBALL_SPEED,
        y: ((ty - hand.y) / len) * FIREBALL_SPEED,
        z: (rz / len) * FIREBALL_SPEED,
      }));
    }
    Sound.fireball();
  }

  animate(dt, t, moving) {
    if (moving) this.stepPhase += dt * 7;
    const swing = moving ? Math.sin(this.stepPhase) * 0.5 : 0;
    this.legs[0].rotation.x = swing;
    this.legs[1].rotation.x = -swing;

    this.throwAnim = Math.max(0, this.throwAnim - dt);
    this.stabAnim = Math.max(0, this.stabAnim - dt);
    const [left, right] = this.arms;
    left.shoulder.rotation.x = this.throwAnim > 0 ? 2.6 * Math.sin((this.throwAnim / 0.5) * Math.PI) : Math.sin(t * 2) * 0.1;
    left.shoulder.rotation.z = -0.25;
    right.shoulder.rotation.x = this.stabAnim > 0 ? 1.3 : 0.5;
    right.shoulder.rotation.z = 0.2;
    right.elbow.rotation.x = this.stabAnim > 0 ? 0.2 : 0.9;
    // Keep the trident upright in his hand, or level it forward for a stab.
    this.trident.rotation.x = -(right.shoulder.rotation.x + right.elbow.rotation.x) - (this.stabAnim > 0 ? 1.4 : 0);

    this.torso.rotation.x = Math.sin(t * 1.5) * 0.03 - (this.stabAnim > 0 ? 0.2 : 0);
    this.head.rotation.y = Math.sin(t * 0.7 + this.seed) * 0.15;
    const flap = Math.sin(t * (this.enraged ? 6 : 2.5)) * 0.25;
    this.wings[0].rotation.y = 0.6 + flap;
    this.wings[1].rotation.y = -0.6 - flap;

    this.flash = Math.max(0, this.flash - dt);
    this.skin.emissiveIntensity = (this.enraged ? 1.3 : 0.8) + Math.sin(t * 9) * 0.2 + this.flash * 15;
    this.group.position.set(this.x, moving ? Math.abs(Math.sin(this.stepPhase)) * 0.08 : 0, this.z);
    this.group.rotation.y = this.yaw;
  }

  // Hellfire licking off his shoulders and head, more when he's enraged.
  emitFlames(dt) {
    this.flameAcc += dt * (this.enraged ? 120 : 60);
    while (this.flameAcc >= 1) {
      this.flameAcc -= 1;
      const p = this.localToWorld(rand(-0.8, 0.8), rand(2.7, 3.9), rand(-0.3, 0.3));
      game.fire.emit(p.x, p.y, p.z, rand(-0.3, 0.3), rand(1, 2), rand(-0.3, 0.3), rand(0.3, 0.6), 2);
    }
  }

  // Fall flat on his back and burn out.
  updateDeath(dt) {
    if (this.deathT < 1) {
      this.deathT = Math.min(1, this.deathT + dt * 1.5);
      this.group.rotation.x = this.deathT * (Math.PI / 2);
      this.group.position.y = this.deathT * 0.4;
    }
    this.skin.emissiveIntensity = Math.max(0.05, this.skin.emissiveIntensity - dt * 0.3);
    this.flameAcc += dt * 40 * this.skin.emissiveIntensity;
    while (this.flameAcc >= 1) {
      this.flameAcc -= 1;
      game.fire.emit(this.x + rand(-0.6, 0.6), 0.5, this.z + rand(-0.6, 2.5), 0, rand(0.5, 1.4), 0, rand(0.3, 0.7), 1);
    }
  }
}

// A fireball the devil throws. Explodes on whatever it hits.
class Fireball {
  constructor(scene, from, velocity) {
    this.scene = scene;
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffb040 }));
    this.mesh.position.set(from.x, from.y, from.z);
    scene.add(this.mesh);
    this.velocity = velocity;
    this.life = 5;
    this.done = false;
  }

  update(dt) {
    const pos = this.mesh.position;
    pos.x += this.velocity.x * dt;
    pos.y += this.velocity.y * dt;
    pos.z += this.velocity.z * dt;
    this.life -= dt;
    for (let i = 0; i < 4; i++) {
      game.fire.emit(pos.x + rand(-0.15, 0.15), pos.y + rand(-0.15, 0.15), pos.z + rand(-0.15, 0.15), rand(-0.5, 0.5), rand(0, 1), rand(-0.5, 0.5), rand(0.2, 0.45), 1);
    }

    const p = game.player;
    const hitPlayer = Math.hypot(pos.x - p.x, pos.y - (p.y + 1.0), pos.z - p.z) < 0.9;
    const hitWorld = pos.y <= 0 || pos.y >= ceilingAt(pos.x, pos.z) || isWallAt(pos.x, pos.z);
    if (hitPlayer || hitWorld || this.life <= 0) this.explode(hitPlayer);
  }

  explode(direct) {
    const pos = this.mesh.position;
    const p = game.player;
    if (direct) {
      game.damagePlayer(FIREBALL_DAMAGE);
    } else if (Math.hypot(pos.x - p.x, pos.y - (p.y + 1.0), pos.z - p.z) < 2.2) {
      game.damagePlayer(Math.round(FIREBALL_DAMAGE / 2)); // splash
    }
    for (let i = 0; i < 40; i++) {
      game.fire.emit(pos.x, pos.y, pos.z, rand(-4, 4), rand(-1, 4), rand(-4, 4), rand(0.3, 0.7), 1);
    }
    Sound.explosion(0.5);
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.done = true;
  }
}
