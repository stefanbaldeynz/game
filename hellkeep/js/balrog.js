// The Balrog: the boss of round 3, a demon of shadow and flame from the deep places of the
// world, guarding the great door of the keep. Three times your height, wreathed in fire,
// with wings of shadow, a sword of flame in one hand and a whip of fire in the other.
//
// He cracks the whip at you from a distance (it drags you in towards him), slams his
// sword down when you're close (jump the ring of fire it sends out), and breathes
// fireballs. Below half health his wings burst into flame and he gets faster.
// Every attack has a wind-up you can see, so you can get out of the way.

const BALROG_HP = 2200;
const BALROG_RADIUS = 1.4;
const WHIP_RANGE = 15;
const WHIP_WIDTH = 1.7;      // how close to the line of the lash you have to be to get hit
const WHIP_DAMAGE = 14;
const SLAM_RANGE = 5.5;
const SLAM_DAMAGE = 26;
const SHOCKWAVE_RANGE = 11;
const SHOCKWAVE_DAMAGE = 12; // the ring of fire along the ground: jump it
const WHIP_SEGMENTS = 18;
const WHIP_LENGTH = 13;

// The attacks: when the hit lands (seconds in) and how long the whole move takes.
const BALROG_MOVES = {
  whip: { hit: 0.8, duration: 1.5 },
  slam: { hit: 0.75, duration: 1.4 },
  breath: { hit: 0.55, duration: 1.1 },
};

// A wing of shadow: bones fanning out from the shoulder with a ragged membrane between them,
// drawn in its own flat plane (x outward, y up).
function makeShadowWing(materials) {
  const wing = new THREE.Group();
  const joints = [[0, 0], [1.8, 2.6], [5.2, 3.9], [5.8, 1.2], [4.6, -1.0]];
  const outline = [[0, 0], [1.8, 2.6], [5.2, 3.9], [4.3, 2.4], [5.8, 1.2], [4.4, 0.4], [4.6, -1.0], [3.0, -0.6], [2.1, -1.9], [0.8, -1.0]];
  const shape = new THREE.Shape();
  outline.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  wing.add(new THREE.Mesh(new THREE.ShapeGeometry(shape), materials.membrane));
  // The arm of the wing, then a finger to each point.
  const bone = (a, b, radius) => {
    const from = new THREE.Vector3(a[0], a[1], 0);
    const to = new THREE.Vector3(b[0], b[1], 0);
    const mesh = addPart(wing, new THREE.CylinderGeometry(radius * 0.6, radius, from.distanceTo(to), 6), materials.bone);
    mesh.position.copy(from).add(to).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
  };
  bone(joints[0], joints[1], 0.16);
  for (const tip of joints.slice(2)) bone(joints[1], tip, 0.09);
  const claw = addPart(wing, new THREE.ConeGeometry(0.1, 0.5, 6), materials.horn, joints[1][0], joints[1][1] + 0.3, 0);
  claw.rotation.z = -0.3;
  wing.tips = joints.slice(1).map(([x, y]) => new THREE.Vector3(x, y, 0));
  return wing;
}

function makeBalrogModel() {
  const skin = hellfireSkin(0x120c0a, 0.9, 0xff4a08);
  const materials = {
    skin,
    horn: new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.5, metalness: 0.2 }),
    bone: new THREE.MeshStandardMaterial({ color: 0x0c0806, roughness: 0.7 }),
    // Shadow: nearly black, a little see-through, with a smouldering underglow.
    membrane: new THREE.MeshStandardMaterial({ color: 0x040202, roughness: 1, transparent: true, opacity: 0.86, side: THREE.DoubleSide, emissive: 0x3a0802, emissiveIntensity: 0.6, depthWrite: false }),
    eyes: new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.6, 0.15).multiplyScalar(6) }),
    maw: new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.35, 0.05).multiplyScalar(4) }),
    blade: new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.55, 0.2).multiplyScalar(4) }), // white-hot, so it blooms
    iron: new THREE.MeshStandardMaterial({ color: 0x1a1414, metalness: 0.85, roughness: 0.35 }),
  };
  const group = new THREE.Group();

  // Huge legs bent like a beast's, ending in clawed feet.
  const legs = [-1, 1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.75, 2.7, 0.15);
    group.add(hip);
    addPart(hip, new THREE.CylinderGeometry(0.5, 0.36, 1.5, 10).translate(0, -0.7, 0), skin).rotation.x = -0.25;
    const knee = new THREE.Group();
    knee.position.set(0, -1.35, -0.35);
    hip.add(knee);
    addPart(knee, new THREE.CylinderGeometry(0.34, 0.24, 1.4, 10).translate(0, -0.65, 0), skin).rotation.x = 0.3;
    addPart(knee, new THREE.SphereGeometry(0.3, 10, 8), skin, 0, 0, 0);
    const foot = addPart(knee, new THREE.BoxGeometry(0.55, 0.3, 0.9), skin, 0, -1.25, -0.2);
    foot.scale.set(1, 1, 1);
    for (const x of [-0.18, 0, 0.18]) {
      const claw = addPart(knee, new THREE.ConeGeometry(0.07, 0.35, 6), materials.horn, x, -1.32, -0.72);
      claw.rotation.x = -Math.PI / 2;
    }
    return hip;
  });

  // The body leans forward over its legs, hunched and massive.
  const torso = new THREE.Group();
  torso.position.set(0, 2.7, 0.1);
  torso.rotation.x = -0.22;
  group.add(torso);
  addPart(torso, new THREE.SphereGeometry(0.85, 14, 10), skin, 0, 0.2, 0).scale.set(1.2, 0.8, 0.9); // hips
  addPart(torso, new THREE.CylinderGeometry(1.05, 0.8, 1.4, 14), skin, 0, 0.95, 0).scale.z = 0.8;  // belly
  const chest = addPart(torso, new THREE.SphereGeometry(1.15, 18, 14), skin, 0, 1.9, -0.1);
  chest.scale.set(1.2, 1.0, 0.85);
  for (const side of [-1, 1]) addPart(torso, new THREE.SphereGeometry(0.62, 12, 10), skin, side * 1.3, 2.3, 0.05); // shoulders
  // A ridge of spines down the back.
  for (let i = 0; i < 7; i++) {
    const spine = addPart(torso, new THREE.ConeGeometry(0.12, 0.6 - i * 0.04, 6), materials.horn, 0, 2.6 - i * 0.35, 0.75 + Math.sin(i * 0.4) * 0.15);
    spine.rotation.x = 0.9;
  }

  // The head: a long horned skull, eyes and a maw full of fire.
  const head = new THREE.Group();
  head.position.set(0, 2.85, -0.75);
  torso.add(head);
  addPart(head, new THREE.CylinderGeometry(0.45, 0.6, 0.8, 10), skin, 0, -0.35, 0.35).rotation.x = 0.6; // neck
  const skull = addPart(head, new THREE.SphereGeometry(0.55, 14, 12), skin, 0, 0.1, 0);
  skull.scale.set(1, 0.95, 1.15);
  addPart(head, new THREE.BoxGeometry(0.62, 0.38, 0.7), skin, 0, -0.05, -0.55); // snout
  for (const side of [-1, 1]) {
    addPart(head, new THREE.SphereGeometry(0.08, 8, 6), materials.eyes, side * 0.24, 0.18, -0.52);
    const brow = addPart(head, new THREE.BoxGeometry(0.3, 0.1, 0.25), skin, side * 0.24, 0.3, -0.5);
    brow.rotation.z = side * 0.4;
    for (let i = 0; i < 3; i++) {
      const fang = addPart(head, new THREE.ConeGeometry(0.035, 0.18, 5), materials.horn, side * (0.08 + i * 0.08), -0.28, -0.82 + i * 0.1);
      fang.rotation.x = Math.PI;
    }
  }
  const mouth = addPart(head, new THREE.BoxGeometry(0.5, 0.06, 0.55), materials.maw, 0, -0.24, -0.6);
  const jaw = new THREE.Group(); // drops open to roar and breathe fire
  jaw.position.set(0, -0.2, -0.1);
  head.add(jaw);
  addPart(jaw, new THREE.BoxGeometry(0.55, 0.16, 0.8), skin, 0, -0.1, -0.45);
  // Great horns sweeping out, forward and up, like a bull's.
  for (const side of [-1, 1]) {
    taperedHorn(head, [
      [side * 0.35, 0.4, 0.05],
      [side * 0.9, 0.55, 0.05],
      [side * 1.35, 0.85, -0.25],
      [side * 1.5, 1.3, -0.65],
      [side * 1.35, 1.7, -0.9],
    ], 0.2, 0.03);
  }

  // Arms: the right holds the sword of flame, the left the whip.
  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 1.45, 2.3, 0);
    torso.add(shoulder);
    addPart(shoulder, new THREE.CylinderGeometry(0.4, 0.32, 1.6, 10).translate(0, -0.8, 0), skin);
    const elbow = new THREE.Group();
    elbow.position.y = -1.55;
    shoulder.add(elbow);
    addPart(elbow, new THREE.CylinderGeometry(0.32, 0.26, 1.4, 10).translate(0, -0.7, 0), skin);
    const hand = new THREE.Group();
    hand.position.y = -1.5;
    elbow.add(hand);
    addPart(hand, new THREE.SphereGeometry(0.3, 10, 8), skin);
    for (let i = 0; i < 4; i++) {
      const claw = addPart(hand, new THREE.ConeGeometry(0.05, 0.3, 5), materials.horn, -0.15 + i * 0.1, -0.25, -0.15);
      claw.rotation.x = Math.PI - 0.5;
    }
    return { shoulder, elbow, hand };
  });
  const sword = new THREE.Group();
  sword.position.set(0, -0.1, 0);
  arms[1].hand.add(sword);
  addPart(sword, new THREE.BoxGeometry(0.9, 0.12, 0.16), materials.iron, 0, -0.2, 0);  // cross-guard
  addPart(sword, new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8), materials.iron, 0, 0.1, 0);
  const blade = addPart(sword, new THREE.BoxGeometry(0.26, 3.4, 0.06), materials.blade, 0, -1.95, 0);
  const point = addPart(sword, new THREE.ConeGeometry(0.13, 0.5, 4), materials.blade, 0, -3.9, 0);
  point.rotation.x = Math.PI;
  point.scale.z = 0.25;
  addPart(arms[0].hand, new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), materials.iron, 0, -0.2, 0); // whip handle

  // Wings of shadow, folded back at first.
  const wings = [-1, 1].map((side) => {
    const root = new THREE.Group();
    root.position.set(side * 0.7, 2.4, 0.75);
    torso.add(root);
    const wing = makeShadowWing(materials);
    wing.scale.x = side;
    root.add(wing);
    root.wing = wing;
    return root;
  });

  // He lights up everything around him.
  const glow = new THREE.PointLight(0xff6a20, 7 * LIGHT_UNITS, 22, 1.4);
  glow.position.set(0, 2, -1.5);
  torso.add(glow);

  return { group, torso, legs, arms, head, jaw, sword, blade, wings, glow, materials };
}

class Balrog {
  constructor(scene, x, z) {
    this.type = 'balrog';
    this.isBoss = true;
    this.bossName = 'The Balrog';
    this.radius = BALROG_RADIUS;
    this.scene = scene;
    this.x = x;
    this.z = z;
    this.hp = BALROG_HP;
    this.maxHp = BALROG_HP;
    this.state = 'idle'; // idle | fight | dead
    this.enraged = false;
    this.stepPhase = 0;
    this.thinkTimer = 0;
    this.seesPlayer = false;
    this.move = null;     // the attack he's in the middle of: { name, t, aim }
    this.cooldowns = { whip: 2, slam: 0, breath: 3 };
    this.flash = 0;
    this.deathT = 0;
    this.flameAcc = 0;
    this.smokeAcc = 0;
    Object.assign(this, makeBalrogModel());
    this.yaw = Math.PI; // facing south, out over the courtyard
    this.group.position.set(x, 0, z);
    scene.add(this.group);

    // His own fire and smoke: real flame-coloured, even in the frozen round.
    const glowTexture = Textures.glow();
    this.flames = new ParticleSystem(scene, { max: 4000, size: 1.0, texture: glowTexture, damping: 0.95, palette: 'fire' });
    this.soot = new ParticleSystem(scene, { max: 900, size: 2.8, texture: glowTexture, damping: 0.98, palette: 'smoke' });

    // The whip is a chain of glowing segments laid along a curve every frame.
    const whipMaterial = new THREE.MeshStandardMaterial({ color: 0x1a0a04, emissive: 0xff5a10, emissiveIntensity: 2.2, roughness: 0.6 });
    this.whip = [];
    this.whipPoints = [];
    for (let i = 0; i < WHIP_SEGMENTS; i++) {
      const radius = 0.09 - (i / WHIP_SEGMENTS) * 0.06;
      const geometry = new THREE.CylinderGeometry(radius * 0.85, radius, 1, 6);
      geometry.translate(0, 0.5, 0);
      const segment = new THREE.Mesh(geometry, whipMaterial);
      scene.add(segment);
      this.whip.push(segment);
    }
    for (let i = 0; i <= WHIP_SEGMENTS; i++) this.whipPoints.push(new THREE.Vector3(x, 0, z));
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
    this.roarT = 1.6;
    Sound.balrogRoar();
    game.showMessage('A BALROG! A demon of shadow and flame', 3.5);
  }

  localToWorld(lx, ly, lz) {
    const c = Math.cos(this.yaw);
    const s = Math.sin(this.yaw);
    return { x: this.x + lx * c + lz * s, y: ly, z: this.z - lx * s + lz * c };
  }

  hitSpheres() {
    return [
      { ...this.localToWorld(0, 1.4, 0), r: 1.0 },
      { ...this.localToWorld(0, 3.4, -0.3), r: 1.3 },
      { ...this.localToWorld(0, 4.6, -0.8), r: 1.15 },
      { ...this.localToWorld(0, 5.6, -1.6), r: 0.65 },
    ];
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    this.flash = 0.1;
    this.alert();
    if (!this.enraged && this.hp < this.maxHp / 2) {
      this.enraged = true;
      this.roarT = 1.6;
      Sound.balrogRoar();
      game.showMessage('The Balrog\'s wings burst into flame!', 3);
    }
    if (this.hp <= 0) this.die();
  }

  die() {
    this.state = 'dead';
    this.hp = 0;
    this.move = null;
    Sound.balrogRoar();
    Sound.explosion();
    for (let i = 0; i < 300; i++) {
      this.flames.emit(this.x + rand(-1.5, 1.5), rand(0.5, 6), this.z + rand(-1.5, 1.5), rand(-6, 6), rand(0, 8), rand(-6, 6), rand(0.8, 1.6), 1);
    }
    game.dropPickup('health', this.x, this.z + 3);
    game.showMessage('The Balrog falls into shadow! The door of the keep is open', 4);
    game.onEnemyKilled(this);
  }

  turnToward(dx, dz, dt, rate = 3) {
    const target = Math.atan2(-dx, -dz);
    const diff = Math.atan2(Math.sin(target - this.yaw), Math.cos(target - this.yaw));
    this.yaw += diff * Math.min(1, dt * rate);
  }

  update(dt, t, active) {
    this.flames.update(dt);
    this.soot.update(dt);
    if (!this.alive) {
      this.updateDeath(dt);
      this.layWhip(dt, t);
      return;
    }
    const moving = active ? this.think(dt) : false;
    this.animate(dt, t, moving);
    this.layWhip(dt, t);
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
      if (this.state === 'idle' && ((this.seesPlayer && dist < 26) || dist < 10)) this.alert();
    }
    if (this.state !== 'fight') return false;
    for (const name in this.cooldowns) this.cooldowns[name] -= dt;

    if (this.move) {
      this.updateMove(dt, dx, dz, dist);
      return false;
    }

    this.turnToward(dx, dz, dt);
    const speed = this.enraged ? 3.3 : 2.4;
    let moving = false;
    if (dist > 4.5 || !this.seesPlayer) {
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
      moveWithCollision(this, (mx / len) * speed * dt, (mz / len) * speed * dt, BALROG_RADIUS, true);
      moving = true;
    }

    // Pick an attack.
    const c = this.cooldowns;
    if (dist < SLAM_RANGE && c.slam <= 0) this.startMove('slam');
    else if (this.seesPlayer && dist < WHIP_RANGE && dist > 4 && c.whip <= 0) this.startMove('whip');
    else if (this.seesPlayer && dist > 8 && c.breath <= 0) this.startMove('breath');
    return moving;
  }

  startMove(name) {
    this.move = { name, t: 0, aim: null, done: false };
    const fast = this.enraged;
    const cooldowns = { whip: fast ? 2.6 : 3.6, slam: fast ? 1.6 : 2.3, breath: fast ? 3.2 : 4.8 };
    this.cooldowns[name] = cooldowns[name] + BALROG_MOVES[name].duration;
    if (name === 'slam') Sound.growl(1);
  }

  updateMove(dt, dx, dz, dist) {
    const move = this.move;
    const spec = BALROG_MOVES[move.name];
    move.t += dt;
    const p = game.player;
    // He keeps turning to follow you while he winds up, then commits.
    if (move.t < spec.hit * 0.6) this.turnToward(dx, dz, dt, 4);
    // The whip locks on to where you are part way through the wind-up: keep moving and it misses.
    if (move.name === 'whip' && !move.aim && move.t > spec.hit * 0.45) {
      const hand = this.handPosition(0);
      const ax = p.x - hand.x;
      const az = p.z - hand.z;
      const len = Math.hypot(ax, az) || 1;
      move.aim = { x: ax / len, z: az / len, from: hand };
    }

    if (!move.done && move.t >= spec.hit) {
      move.done = true;
      if (move.name === 'whip') this.crackWhip(move.aim);
      else if (move.name === 'slam') this.slam(dist, dx, dz);
      else this.breathe();
    }
    if (move.t >= spec.duration) this.move = null;
  }

  handPosition(i) {
    this.group.updateMatrixWorld(true);
    return this.arms[i].hand.getWorldPosition(new THREE.Vector3());
  }

  crackWhip(aim) {
    Sound.whipCrack();
    if (!aim) return;
    const p = game.player;
    // Are you within the lash: along its line, close enough to it, and low enough?
    const px = p.x - aim.from.x;
    const pz = p.z - aim.from.z;
    const along = px * aim.x + pz * aim.z;
    const across = Math.abs(px * aim.z - pz * aim.x);
    if (along > 0 && along < WHIP_RANGE && across < WHIP_WIDTH && p.y < 3.5) {
      game.damagePlayer(WHIP_DAMAGE);
      game.knockPlayer(-aim.x, -aim.z, 11); // dragged towards him
      game.showMessage('The whip drags you in!', 1.5);
    }
    // Sparks all down the lash.
    for (let i = 0; i < 60; i++) {
      const k = rand(0.2, 1) * WHIP_RANGE;
      this.flames.emit(aim.from.x + aim.x * k, rand(0.3, 1.5), aim.from.z + aim.z * k, rand(-1, 1), rand(1, 3), rand(-1, 1), rand(0.3, 0.6), 0);
    }
  }

  slam(dist, dx, dz) {
    const p = game.player;
    const tip = this.localToWorld(0.9, 0, -4.2);
    Sound.explosion(1);
    Sound.thud();
    game.shakeNear(tip.x, tip.z, 1.6);
    // The ring of fire rolls out along the ground from where the sword hits.
    for (let i = 0; i < 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      this.flames.emit(tip.x + Math.cos(a), 0.3, tip.z + Math.sin(a), Math.cos(a) * 14, rand(0.5, 2), Math.sin(a) * 14, rand(0.5, 0.8), -0.5);
    }
    for (let i = 0; i < 40; i++) this.soot.emit(tip.x + rand(-1, 1), 0.5, tip.z + rand(-1, 1), rand(-2, 2), rand(1, 3), rand(-2, 2), rand(2, 3), 0);
    const fromTip = Math.hypot(p.x - tip.x, p.z - tip.z);
    if ((dist < SLAM_RANGE + 0.8 || fromTip < 2.5) && p.y < 2) {
      game.damagePlayer(SLAM_DAMAGE);
      game.knockPlayer(dx / (dist || 1), dz / (dist || 1), 9);
    } else if (fromTip < SHOCKWAVE_RANGE && p.y < 0.6) {
      game.damagePlayer(SHOCKWAVE_DAMAGE); // should have jumped
    }
  }

  breathe() {
    const p = game.player;
    this.group.updateMatrixWorld(true);
    const mouth = this.jaw.localToWorld(new THREE.Vector3(0, -0.1, -0.9));
    const flight = Math.hypot(p.x - mouth.x, p.z - mouth.z) / FIREBALL_SPEED;
    const tx = p.x + p.vx * flight * 0.4;
    const tz = p.z + p.vz * flight * 0.4;
    const ty = p.y + 1.0;
    const spread = this.enraged ? [-0.3, -0.15, 0, 0.15, 0.3] : [-0.2, 0, 0.2];
    for (const angle of spread) {
      const dx = tx - mouth.x;
      const dz = tz - mouth.z;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const rx = dx * c - dz * s;
      const rz = dx * s + dz * c;
      const len = Math.hypot(rx, ty - mouth.y, rz) || 1;
      game.projectiles.push(new Fireball(this.scene, mouth, {
        x: (rx / len) * FIREBALL_SPEED,
        y: ((ty - mouth.y) / len) * FIREBALL_SPEED,
        z: (rz / len) * FIREBALL_SPEED,
      }, this.flames));
    }
    Sound.fireball();
  }

  animate(dt, t, moving) {
    if (moving) this.stepPhase += dt * (this.enraged ? 4.2 : 3.2);
    const stride = moving ? Math.sin(this.stepPhase) * 0.4 : 0;
    this.legs[0].rotation.x = stride;
    this.legs[1].rotation.x = -stride;
    const breathe = Math.sin(t * 1.6) * 0.03;

    // How far through the current move: wind-up (0 to 1) then the strike (1 to 0).
    const move = this.move;
    const spec = move && BALROG_MOVES[move.name];
    const windup = move ? Math.min(1, move.t / spec.hit) : 0;
    const strike = move && move.t >= spec.hit ? Math.max(0, 1 - (move.t - spec.hit) / (spec.duration - spec.hit)) : 0;
    const name = move ? move.name : '';

    // The whip arm (left) swings back over the shoulder, then lashes forward.
    const [whipArm, swordArm] = this.arms;
    let whipX = 0.35 + Math.sin(t * 1.3) * 0.05;
    if (name === 'whip') whipX = move.t < spec.hit ? -2.3 * windup : 1.5 * strike - 0.2 * (1 - strike);
    whipArm.shoulder.rotation.set(whipX, 0, -0.25);
    whipArm.elbow.rotation.x = name === 'whip' && move.t < spec.hit ? 0.9 * windup : 0.35;

    // The sword arm (right) rises overhead, then hammers down.
    let swordX = 0.6 + breathe;
    if (name === 'slam') swordX = move.t < spec.hit ? 0.6 + 2.2 * windup : 0.6 + 1.0 * (1 - strike);
    swordArm.shoulder.rotation.set(swordX, 0, 0.2);
    swordArm.elbow.rotation.x = name === 'slam' && move.t < spec.hit ? 0.2 : 0.5;
    this.sword.rotation.x = name === 'slam' && move.t >= spec.hit ? 0.9 : 1.2;

    // The whole body leans into a slam, rears back to breathe.
    let lean = -0.22 + breathe;
    if (name === 'slam') lean = move.t < spec.hit ? -0.05 : -0.55 * strike - 0.22 * (1 - strike);
    if (name === 'breath') lean = move.t < spec.hit ? -0.05 * windup : -0.35;
    this.torso.rotation.x = lean;

    // Jaw: open to roar and to breathe fire.
    this.roarT = Math.max(0, (this.roarT || 0) - dt);
    const open = Math.max(this.roarT > 0 ? 0.6 : 0, name === 'breath' ? 0.7 * (move.t < spec.hit ? windup : strike) : 0);
    this.jaw.rotation.x = open;
    this.head.rotation.x = this.roarT > 0 ? -0.3 : 0;

    // Wings: folded and stirring while he waits, spread wide once he fights.
    const spread = this.state === 'fight' ? 1 : 0.25;
    this.wingSpread = (this.wingSpread || 0.25) + (spread - (this.wingSpread || 0.25)) * Math.min(1, dt * 1.5);
    const beat = Math.sin(t * (this.enraged ? 3 : 1.6)) * 0.18 * this.wingSpread;
    this.wings.forEach((root, i) => {
      const side = i ? 1 : -1;
      root.rotation.set(0.15, side * (1.25 - this.wingSpread * 0.95), side * (0.15 + beat + this.wingSpread * 0.25));
    });
    this.materials.membrane.emissiveIntensity = this.enraged ? 2.2 + Math.sin(t * 7) * 0.4 : 0.6;

    this.flash = Math.max(0, this.flash - dt);
    this.materials.skin.emissiveIntensity = (this.enraged ? 1.3 : 0.8) + Math.sin(t * 5) * 0.2 + this.flash * 12;
    this.glow.intensity = (this.enraged ? 9 : 7) * LIGHT_UNITS * (0.85 + Math.sin(t * 11) * 0.08 + Math.sin(t * 7.3) * 0.07);
    this.group.position.set(this.x, moving ? Math.abs(Math.sin(this.stepPhase)) * 0.12 : 0, this.z);
    this.group.rotation.y = this.yaw;
  }

  // Lay the whip along its curve: trailing on the ground behind his hand, drawn back over
  // his shoulder in the wind-up, and snapping out straight along the lash.
  layWhip(dt, t) {
    const hand = this.handPosition(0);
    const move = this.move;
    const spec = move && BALROG_MOVES[move.name];
    const back = this.localToWorld(0, 0, 1);
    const bx = back.x - this.x;
    const bz = back.z - this.z;
    const side = this.localToWorld(-1, 0, 0);
    const sx = side.x - this.x;
    const sz = side.z - this.z;
    let lash = 0;
    if (move && move.name === 'whip' && move.t >= spec.hit && move.aim) lash = Math.max(0, 1 - (move.t - spec.hit) / 0.5);
    const segment = WHIP_LENGTH / WHIP_SEGMENTS;
    for (let i = 0; i <= WHIP_SEGMENTS; i++) {
      const k = i / WHIP_SEGMENTS;
      const target = this.whipPoints[i];
      let x;
      let y;
      let z;
      if (lash > 0) {
        // Out along the line of the lash, with a ripple running down it.
        const a = move.aim;
        x = a.from.x + a.x * k * WHIP_LENGTH + Math.sin(k * 9 - t * 30) * 0.25 * k * a.z;
        z = a.from.z + a.z * k * WHIP_LENGTH - Math.sin(k * 9 - t * 30) * 0.25 * k * a.x;
        y = a.from.y + (0.6 - a.from.y) * Math.sqrt(k) + Math.sin(k * Math.PI) * 0.6;
      } else {
        // Dragging behind and to the side, coiling a little as he walks.
        const drag = k * segment * WHIP_SEGMENTS * 0.55;
        x = hand.x + (bx * 0.8 + sx * 0.6) * drag + Math.sin(k * 5 + t * 2) * 0.4 * k;
        z = hand.z + (bz * 0.8 + sz * 0.6) * drag + Math.cos(k * 4 + t * 1.7) * 0.4 * k;
        y = Math.max(0.08, hand.y * (1 - k * 2.2));
      }
      if (i === 0) target.copy(hand);
      else target.lerp(new THREE.Vector3(x, y, z), lash > 0 ? 1 : Math.min(1, dt * 8));
    }
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < WHIP_SEGMENTS; i++) {
      const a = this.whipPoints[i];
      const b = this.whipPoints[i + 1];
      const piece = this.whip[i];
      const dir = b.clone().sub(a);
      const length = dir.length() || 0.001;
      piece.position.copy(a);
      piece.quaternion.setFromUnitVectors(up, dir.divideScalar(length));
      piece.scale.set(1, length, 1);
      piece.visible = this.alive || this.deathT < 1;
    }
  }

  // Fire pouring off his head, shoulders and back, along the blade and the whip; smoke
  // rising from the wings (which burn too, once he's enraged).
  emitFlames(dt) {
    this.flameAcc += dt * (this.enraged ? 560 : 400);
    this.group.updateMatrixWorld(true);
    while (this.flameAcc >= 1) {
      this.flameAcc -= 1;
      const r = Math.random();
      let at;
      if (r < 0.45) at = this.localToWorld(rand(-1.7, 1.7), rand(4.3, 5.8), rand(-0.6, 1.2)); // a mane of fire over head and shoulders
      else if (r < 0.6) at = this.blade.localToWorld(new THREE.Vector3(0, rand(-1.7, 1.7), 0)); // the sword
      else if (r < 0.8) at = this.whipPoints[Math.floor(rand(1, WHIP_SEGMENTS))];               // the whip
      else if (this.enraged) {                                                                    // burning wings
        const root = this.wings[r < 0.9 ? 0 : 1];
        at = root.wing.localToWorld(root.wing.tips[Math.floor(rand(0, root.wing.tips.length))].clone().multiplyScalar(rand(0.3, 1)));
      } else at = this.localToWorld(rand(-0.9, 0.9), rand(1.5, 4), rand(0, 0.6));               // body
      this.flames.emit(at.x + rand(-0.2, 0.2), at.y, at.z + rand(-0.2, 0.2), rand(-0.5, 0.5), rand(2, 4), rand(-0.5, 0.5), rand(0.45, 0.95), -1.2);
    }
    this.smokeAcc += dt * 30;
    while (this.smokeAcc >= 1) {
      this.smokeAcc -= 1;
      const at = this.localToWorld(rand(-2.5, 2.5), rand(4.5, 6.5), rand(0.5, 2));
      this.soot.emit(at.x, at.y, at.z, rand(-0.3, 0.3), rand(0.8, 1.6), rand(-0.3, 0.3), rand(2.5, 4), 0.05);
    }
  }

  // Sink to his knees, topple forward and burn down to smoke.
  updateDeath(dt) {
    if (this.deathT < 1) {
      this.deathT = Math.min(1, this.deathT + dt * 0.6);
      const k = this.deathT;
      this.legs[0].rotation.x = this.legs[1].rotation.x = -1.2 * Math.min(1, k * 2);
      this.group.position.y = -1.2 * Math.min(1, k * 2);
      this.group.rotation.x = -Math.max(0, k * 2 - 1) * 1.3;
      this.wings.forEach((root) => {
        root.rotation.z *= 0.97;
      });
    }
    this.materials.skin.emissiveIntensity = Math.max(0.05, this.materials.skin.emissiveIntensity - dt * 0.25);
    this.materials.membrane.opacity = Math.max(0, this.materials.membrane.opacity - dt * 0.2);
    this.glow.intensity = Math.max(0, this.glow.intensity - dt * 4 * LIGHT_UNITS);
    this.flameAcc += dt * 80 * this.materials.skin.emissiveIntensity;
    while (this.flameAcc >= 1) {
      this.flameAcc -= 1;
      this.flames.emit(this.x + rand(-1.5, 1.5), rand(0.3, 2), this.z + rand(-4, 1.5), 0, rand(0.8, 2), 0, rand(0.4, 0.8), -0.8);
    }
    this.smokeAcc += dt * 12;
    while (this.smokeAcc >= 1) {
      this.smokeAcc -= 1;
      this.soot.emit(this.x + rand(-2, 2), rand(0.5, 2), this.z + rand(-4, 2), rand(-0.3, 0.3), rand(0.8, 1.5), rand(-0.3, 0.3), rand(3, 5), 0.05);
    }
  }
}
