// Hellhounds: charred dogs with burning cracks in their skin, wrapped in flames.
// They sleep until they see or hear you, then hunt you down through the castle.

const HOUND_SPEED = 5.4;
const HOUND_HP = 60;
const HOUND_SCALE = 1.25;
const HOUND_RADIUS = 0.45;
const HOUND_BITE_RANGE = 1.9;

let houndTextures = null;

function makeHoundModel() {
  if (!houndTextures) houndTextures = { skin: Textures.houndSkin(), cracks: Textures.houndCracks() };
  // Each hound gets its own skin and eye materials so it can flash and fade on its own.
  const skin = new THREE.MeshStandardMaterial({
    color: 0x9a7a70,
    map: houndTextures.skin,
    emissive: 0xffffff,
    emissiveMap: houndTextures.cracks,
    roughness: 0.8,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a0a06, roughness: 0.9, emissive: 0x401000 });
  const eyes = new THREE.MeshBasicMaterial({ color: 0xffee66 });
  const teeth = new THREE.MeshStandardMaterial({ color: 0xd8ccb0, roughness: 0.6 });

  const group = new THREE.Group();
  const body = addPart(group, new THREE.BoxGeometry(0.5, 0.42, 1.0), skin, 0, 0.72, 0.05);
  addPart(group, new THREE.BoxGeometry(0.58, 0.55, 0.45), skin, 0, 0.78, -0.4); // chest

  // Spikes down the spine.
  for (let i = 0; i < 5; i++) {
    const z = -0.5 + i * 0.22;
    const top = z < -0.17 ? 1.055 : 0.93;
    addPart(group, new THREE.ConeGeometry(0.05, 0.18, 4), dark, 0, top + 0.09, z);
  }

  const neck = addPart(group, new THREE.BoxGeometry(0.3, 0.35, 0.3), skin, 0, 0.98, -0.62);
  neck.rotation.x = 0.5;

  const head = new THREE.Group();
  head.position.set(0, 1.08, -0.8);
  group.add(head);
  addPart(head, new THREE.BoxGeometry(0.38, 0.32, 0.36), skin, 0, 0, 0);
  addPart(head, new THREE.BoxGeometry(0.24, 0.16, 0.32), skin, 0, -0.03, -0.3); // snout
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.1, -0.15);
  head.add(jaw);
  addPart(jaw, new THREE.BoxGeometry(0.22, 0.07, 0.36), dark, 0, -0.03, -0.17);
  for (const sx of [-0.08, 0.08]) {
    addPart(jaw, new THREE.ConeGeometry(0.025, 0.08, 4), teeth, sx, 0.03, -0.3);
    const fang = addPart(head, new THREE.ConeGeometry(0.025, 0.09, 4), teeth, sx, -0.14, -0.4);
    fang.rotation.x = Math.PI;
  }
  for (const sx of [-0.11, 0.11]) {
    addPart(head, new THREE.BoxGeometry(0.08, 0.05, 0.03), eyes, sx, 0.05, -0.185);
    const horn = addPart(head, new THREE.ConeGeometry(0.06, 0.26, 5), dark, sx * 1.2, 0.25, 0.05);
    horn.rotation.z = -sx * 4;
    horn.rotation.x = 0.4;
  }

  // Legs pivot at the hip so they can swing.
  const legGeometry = new THREE.BoxGeometry(0.13, 0.62, 0.15);
  legGeometry.translate(0, -0.31, 0);
  const pawGeometry = new THREE.BoxGeometry(0.16, 0.08, 0.22);
  const legs = [[-0.2, -0.38], [0.2, -0.38], [-0.2, 0.42], [0.2, 0.42]].map(([x, z]) => {
    const hip = new THREE.Group();
    hip.position.set(x, 0.66, z);
    group.add(hip);
    addPart(hip, legGeometry, skin);
    addPart(hip, pawGeometry, dark, 0, -0.62, -0.03);
    return hip;
  });

  const tailGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.5);
  tailGeometry.translate(0, 0, 0.25);
  const tail = new THREE.Group();
  tail.position.set(0, 0.85, 0.55);
  tail.rotation.x = -0.6;
  group.add(tail);
  addPart(tail, tailGeometry, skin);

  group.scale.setScalar(HOUND_SCALE);
  return { group, body, head, jaw, tail, legs, skin, eyes };
}

class Hound {
  constructor(scene, x, z) {
    this.x = x;
    this.z = z;
    this.yaw = rand(0, Math.PI * 2);
    this.hp = HOUND_HP;
    this.state = 'idle'; // idle | chase | dead
    this.seed = rand(0, 100);
    this.stepPhase = 0;
    this.thinkTimer = rand(0, 0.3);
    this.seesPlayer = false;
    this.attackCooldown = rand(0.2, 0.6);
    this.bite = 0;
    this.flash = 0;
    this.deathT = 0;
    this.fallSide = Math.random() < 0.5 ? -1 : 1;
    this.flameAcc = 0;
    this.type = 'hound';
    this.radius = HOUND_RADIUS;
    Object.assign(this, makeHoundModel());
    this.group.position.set(x, 0, z);
    scene.add(this.group);
  }

  get alive() {
    return this.state !== 'dead';
  }

  volume() {
    return Math.max(0.15, 1 - Math.hypot(game.player.x - this.x, game.player.z - this.z) / 35);
  }

  alert() {
    if (this.state !== 'idle') return;
    this.state = 'chase';
    Sound.growl(this.volume());
  }

  // Turn a point on the dog's body into a world position.
  localToWorld(lx, ly, lz) {
    const c = Math.cos(this.yaw);
    const s = Math.sin(this.yaw);
    return {
      x: this.x + (lx * c + lz * s) * HOUND_SCALE,
      y: this.group.position.y + ly * HOUND_SCALE,
      z: this.z + (-lx * s + lz * c) * HOUND_SCALE,
    };
  }

  // Spheres covering the body, chest and head, used to check if a bullet hits.
  hitSpheres() {
    return [
      { ...this.localToWorld(0, 0.75, 0.1), r: 0.42 * HOUND_SCALE },
      { ...this.localToWorld(0, 0.85, -0.45), r: 0.42 * HOUND_SCALE },
      { ...this.localToWorld(0, 1.08, -0.85), r: 0.3 * HOUND_SCALE },
    ];
  }

  takeDamage(amount, direction) {
    if (!this.alive) return;
    this.hp -= amount;
    this.flash = 0.12;
    this.alert();
    moveWithCollision(this, direction.x * 0.2, direction.z * 0.2, HOUND_RADIUS, true);
    if (this.hp <= 0) this.die();
  }

  die() {
    this.state = 'dead';
    this.eyes.color.setHex(0x331100);
    Sound.yelp(this.volume());
    const center = this.localToWorld(0, 0.8, -0.2);
    for (let i = 0; i < 45; i++) {
      game.fire.emit(center.x, center.y, center.z, rand(-3, 3), rand(0, 4), rand(-3, 3), rand(0.4, 0.9), 1);
    }
    game.onEnemyKilled(this);
  }

  turnToward(dx, dz, dt) {
    const target = Math.atan2(-dx, -dz);
    const diff = Math.atan2(Math.sin(target - this.yaw), Math.cos(target - this.yaw));
    this.yaw += diff * Math.min(1, dt * 10);
  }

  // active is false while the game is paused or on the menu: hounds still burn but don't move.
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
      if (this.state === 'idle' && ((this.seesPlayer && dist < 20) || dist < 5)) this.alert();
    }
    if (this.state !== 'chase') return false;

    let moving = false;
    if (dist > 1.5) {
      // Run straight at you when you're in sight, otherwise follow the flow field.
      let tx = p.x;
      let tz = p.z;
      if (!(this.seesPlayer && dist < 12)) {
        const step = nextStepToward(this.x, this.z);
        if (step) {
          tx = step.x;
          tz = step.z;
        }
      }
      const mx = tx - this.x;
      const mz = tz - this.z;
      const len = Math.hypot(mx, mz) || 1;
      const step = HOUND_SPEED * dt;
      moveWithCollision(this, (mx / len) * step, (mz / len) * step, HOUND_RADIUS, true);
      this.turnToward(mx, mz, dt);
      moving = true;
    } else {
      this.turnToward(dx, dz, dt);
    }

    this.attackCooldown -= dt;
    // Can't bite you while you're up in the air.
    if (dist < HOUND_BITE_RANGE && game.player.y < 1.2 && this.attackCooldown <= 0) {
      this.attackCooldown = 0.9;
      this.bite = 0.25;
      Sound.bite();
      game.damagePlayer(Math.round(rand(8, 13)));
    }

    // Keep hounds from piling up inside each other.
    for (const other of game.enemies) {
      if (other === this || !other.alive) continue;
      const ox = this.x - other.x;
      const oz = this.z - other.z;
      const d = Math.hypot(ox, oz);
      const gap = this.radius + other.radius + 0.3;
      if (d > 0 && d < gap) {
        const push = (gap - d) * 0.5;
        moveWithCollision(this, (ox / d) * push, (oz / d) * push, HOUND_RADIUS, true);
      }
    }
    return moving;
  }

  animate(dt, t, moving) {
    if (moving) this.stepPhase += dt * 15;
    const swing = moving ? Math.sin(this.stepPhase) * 0.9 : 0;
    this.legs[0].rotation.x = swing;
    this.legs[3].rotation.x = swing;
    this.legs[1].rotation.x = -swing;
    this.legs[2].rotation.x = -swing;
    const bob = moving ? Math.abs(Math.sin(this.stepPhase)) * 0.1 : 0;
    this.body.scale.y = 1 + Math.sin(t * 4 + this.seed) * 0.04;
    this.tail.rotation.y = Math.sin(t * (moving ? 14 : 4) + this.seed) * 0.5;
    this.head.rotation.x = moving ? -0.12 : Math.sin(t * 1.5 + this.seed) * 0.06;
    this.bite = Math.max(0, this.bite - dt);
    this.jaw.rotation.x = this.bite > 0 ? -0.7 : -0.12 - Math.max(0, Math.sin(t * 8 + this.seed)) * 0.15;
    this.flash = Math.max(0, this.flash - dt);
    this.skin.emissiveIntensity = 0.9 + Math.sin(t * 11 + this.seed) * 0.25 + this.flash * 20;
    this.group.position.set(this.x, bob, this.z);
    this.group.rotation.y = this.yaw;
  }

  emitFlames(dt) {
    this.flameAcc += dt * 70;
    while (this.flameAcc >= 1) {
      this.flameAcc -= 1;
      const lz = rand(-0.95, 0.65);
      const ly = lz < -0.6 ? rand(1.15, 1.3) : rand(0.92, 1.08);
      const p = this.localToWorld(rand(-0.22, 0.22), ly, lz);
      game.fire.emit(p.x, p.y, p.z, rand(-0.3, 0.3), rand(0.8, 1.8), rand(-0.3, 0.3), rand(0.3, 0.6), 2);
    }
  }

  // Topple onto one side, then smoulder as the fire inside goes out.
  updateDeath(dt) {
    if (this.deathT < 1) {
      this.deathT = Math.min(1, this.deathT + dt * 3);
      this.group.rotation.z = this.deathT * (Math.PI / 2) * this.fallSide;
      this.group.position.y = this.deathT * 0.3;
      for (const leg of this.legs) leg.rotation.x *= 0.9;
    }
    this.skin.emissiveIntensity = Math.max(0.05, this.skin.emissiveIntensity - dt * 0.35);
    this.flameAcc += dt * 30 * this.skin.emissiveIntensity;
    while (this.flameAcc >= 1) {
      this.flameAcc -= 1;
      game.fire.emit(this.x + rand(-0.6, 0.6), 0.4, this.z + rand(-0.6, 0.6), 0, rand(0.5, 1.2), 0, rand(0.3, 0.6), 1);
    }
  }
}
