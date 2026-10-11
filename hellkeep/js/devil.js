// The devil: round 1's mini boss, a heavy metal demon rocking out by the throne.
// He blasts fireballs from his Flying V guitar, swings it at you up close,
// and gets angrier below half health. When he dies he drops a pair of angel wings.

const DEVIL_HP = 1200;
const DEVIL_RADIUS = 0.8;
const FIREBALL_SPEED = 15;
const FIREBALL_DAMAGE = 15;
const GUITAR_SWING_DAMAGE = 16;

let devilTextures = null;

// A horn that tapers from thick to a sharp tip along a curve, ridged, fading from bone to black.
function taperedHorn(parent, points, baseRadius, tipRadius) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const segments = 10;
  const bone = new THREE.Color(0xc8b090);
  const tip = new THREE.Color(0x2a1a10);
  for (let i = 0; i < segments; i++) {
    const a = curve.getPoint(i / segments);
    const b = curve.getPoint((i + 1) / segments);
    const k = i / segments;
    const radius = baseRadius + (tipRadius - baseRadius) * k;
    const material = new THREE.MeshStandardMaterial({ color: bone.clone().lerp(tip, k * k), roughness: 0.6 });
    const length = a.distanceTo(b);
    const segment = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.92, radius, length * 1.05, 10), material);
    segment.position.copy(a).add(b).multiplyScalar(0.5);
    segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    parent.add(segment);
    if (i % 2 === 0 && i < segments - 2) {
      const ridge = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.95, radius * 0.18, 6, 14), material);
      ridge.position.copy(a);
      ridge.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), b.clone().sub(a).normalize());
      parent.add(ridge);
    }
  }
}

// A black Flying V with a skull and horns on the headstock. Its origin is the middle of the body.
function makeFlyingV(materials) {
  const { gloss, chrome, bone, dark } = materials;
  const guitar = new THREE.Group();

  const shape = new THREE.Shape();
  shape.moveTo(-0.07, 0.12);
  shape.lineTo(-0.46, -0.72);
  shape.lineTo(-0.3, -0.8);
  shape.lineTo(0, -0.3);
  shape.lineTo(0.3, -0.8);
  shape.lineTo(0.46, -0.72);
  shape.lineTo(0.07, 0.12);
  shape.lineTo(-0.07, 0.12);
  const body = new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 });
  body.translate(0, 0, -0.035);
  addPart(guitar, body, gloss);

  // Silver binding around the front edge.
  const edge = new THREE.Mesh(new THREE.ShapeGeometry(shape), chrome);
  edge.position.z = -0.048;
  edge.scale.set(1.07, 1.05, 1); // a bright silver rim so the V shape stands out
  guitar.add(edge);
  const face = new THREE.Mesh(new THREE.ShapeGeometry(shape), gloss);
  face.position.z = -0.049;
  face.scale.set(0.93, 0.93, 1);
  guitar.add(face);

  // Pickups, bridge and knobs.
  for (const y of [-0.08, -0.24]) {
    addPart(guitar, new THREE.BoxGeometry(0.2, 0.06, 0.02), dark, 0, y, -0.06);
    addPart(guitar, new THREE.BoxGeometry(0.21, 0.07, 0.012), chrome, 0, y, -0.052);
  }
  addPart(guitar, new THREE.BoxGeometry(0.16, 0.035, 0.02), chrome, 0, -0.36, -0.06);
  for (const [x, y] of [[0.24, -0.5], [0.3, -0.6], [0.36, -0.7]]) {
    addPart(guitar, new THREE.CylinderGeometry(0.025, 0.025, 0.03, 10).rotateX(Math.PI / 2), chrome, x, y, -0.06);
  }
  // Spikes on the tips of the V.
  for (const side of [-1, 1]) {
    const spike = addPart(guitar, new THREE.ConeGeometry(0.03, 0.18, 8), chrome, side * 0.43, -0.83, 0);
    spike.rotation.z = side * 2.7;
  }

  // Neck, fretboard, frets and strings.
  addPart(guitar, new THREE.BoxGeometry(0.075, 1.15, 0.04), dark, 0, 0.7, -0.005);
  addPart(guitar, new THREE.BoxGeometry(0.065, 1.15, 0.01), gloss, 0, 0.7, -0.028);
  for (let i = 0; i < 14; i++) addPart(guitar, new THREE.BoxGeometry(0.065, 0.006, 0.006), chrome, 0, 0.18 + i * 0.075, -0.034);
  for (let i = 0; i < 6; i++) addPart(guitar, new THREE.BoxGeometry(0.003, 1.65, 0.003), chrome, -0.025 + i * 0.01, 0.45, -0.042);

  // Jagged headstock with a horned skull and tuning pegs.
  const head = new THREE.Shape();
  head.moveTo(-0.05, 0);
  head.lineTo(-0.12, 0.12);
  head.lineTo(-0.07, 0.2);
  head.lineTo(-0.14, 0.32);
  head.lineTo(0, 0.26);
  head.lineTo(0.14, 0.34);
  head.lineTo(0.08, 0.2);
  head.lineTo(0.12, 0.1);
  head.lineTo(0.05, 0);
  const headGeometry = new THREE.ExtrudeGeometry(head, { depth: 0.04, bevelEnabled: false });
  headGeometry.translate(0, 1.27, -0.02);
  addPart(guitar, headGeometry, gloss);
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1;
    addPart(guitar, new THREE.CylinderGeometry(0.012, 0.012, 0.06, 6).rotateZ(Math.PI / 2), chrome, side * 0.12, 1.32 + (i % 3) * 0.06, 0);
  }
  addPart(guitar, new THREE.SphereGeometry(0.07, 12, 10), bone, 0, 1.45, -0.04);
  addPart(guitar, new THREE.BoxGeometry(0.07, 0.04, 0.05), bone, 0, 1.38, -0.05);
  for (const side of [-1, 1]) {
    addPart(guitar, new THREE.SphereGeometry(0.018, 8, 6), dark, side * 0.025, 1.46, -0.1);
    const horn = addPart(guitar, new THREE.ConeGeometry(0.02, 0.12, 8), bone, side * 0.07, 1.52, -0.04);
    horn.rotation.z = -side * 0.8;
  }
  return guitar;
}

function makeDevilModel() {
  if (!devilTextures) {
    devilTextures = { skin: Textures.devilSkin(), veins: Textures.devilVeins(), leather: Textures.leather(), patch: Textures.patch() };
  }
  const skin = new THREE.MeshStandardMaterial({
    map: devilTextures.skin,
    emissive: 0xffffff,
    emissiveMap: devilTextures.veins,
    roughness: 0.55,
  });
  const leather = new THREE.MeshStandardMaterial({
    map: devilTextures.leather,
    bumpMap: devilTextures.leather,
    bumpScale: 0.5,
    roughness: 0.35,
    metalness: 0.15,
  });
  const hair = new THREE.MeshStandardMaterial({ color: 0x0a0808, roughness: 0.45 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xd8dce2, metalness: 1, roughness: 0.2 });
  const bone = new THREE.MeshStandardMaterial({ color: 0xd8ccb0, roughness: 0.6 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x080606, roughness: 0.6 });
  const gloss = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.12, metalness: 0.3 });
  const eyes = new THREE.MeshBasicMaterial({ color: 0xffd040 });
  const teeth = new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.4 });

  const group = new THREE.Group();

  // Legs in leather trousers, skull knee pads and buckled boots.
  const legs = [-1, 1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.27, 1.65, 0);
    group.add(hip);
    addPart(hip, new THREE.CylinderGeometry(0.18, 0.15, 0.82, 12).translate(0, -0.41, 0), leather);
    const knee = new THREE.Group();
    knee.position.y = -0.8;
    hip.add(knee);
    addPart(knee, new THREE.CylinderGeometry(0.15, 0.13, 0.7, 12).translate(0, -0.35, 0), leather);
    addPart(knee, new THREE.SphereGeometry(0.1, 12, 10), bone, 0, 0, -0.13);
    for (const ex of [-0.035, 0.035]) addPart(knee, new THREE.SphereGeometry(0.022, 8, 6), dark, ex, 0.01, -0.22);
    addPart(knee, new THREE.BoxGeometry(0.3, 0.42, 0.46), leather, 0, -0.65, -0.06); // boot
    addPart(knee, new THREE.BoxGeometry(0.32, 0.06, 0.5), dark, 0, -0.84, -0.06);   // sole
    for (const y of [-0.55, -0.7]) addPart(knee, new THREE.BoxGeometry(0.1, 0.04, 0.02), silver, 0, y, -0.3);
    return hip;
  });

  const torso = new THREE.Group(); // leans, twists and headbangs
  torso.position.y = 1.7;
  group.add(torso);

  // Belt with a skull buckle, and a chain hanging off the hip.
  addPart(torso, new THREE.BoxGeometry(0.72, 0.11, 0.46), leather, 0, 0.02, 0);
  addPart(torso, new THREE.SphereGeometry(0.07, 12, 10), bone, 0, 0.02, -0.24);
  for (let i = 0; i < 9; i++) {
    const k = i / 8;
    const link = addPart(torso, new THREE.TorusGeometry(0.025, 0.007, 6, 12), silver, -0.36 + k * 0.32, -0.05 - Math.sin(k * Math.PI) * 0.2, -0.2);
    link.rotation.y = i % 2 ? Math.PI / 2 : 0;
  }

  // Bare red chest (tattooed by the skin texture), under an open studded leather jacket.
  const chest = addPart(torso, new THREE.CylinderGeometry(0.42, 0.32, 1.05, 14), skin, 0, 0.6, 0);
  chest.scale.z = 0.62;
  for (const side of [-1, 1]) {
    const pec = addPart(torso, new THREE.SphereGeometry(0.2, 12, 10), skin, side * 0.16, 0.86, -0.17);
    pec.scale.set(1, 0.6, 0.45);
  }
  for (const side of [-1, 1]) {
    addPart(torso, new THREE.BoxGeometry(0.2, 1.02, 0.5), leather, side * 0.35, 0.6, 0.02);
    const collar = addPart(torso, new THREE.BoxGeometry(0.16, 0.3, 0.06), leather, side * 0.22, 1.1, -0.2);
    collar.rotation.z = side * 0.45;
    for (let i = 0; i < 6; i++) addPart(torso, new THREE.SphereGeometry(0.018, 6, 6), silver, side * rand(0.28, 0.42), rand(0.25, 1.0), -0.235);
  }
  addPart(torso, new THREE.BoxGeometry(0.76, 1.02, 0.14), leather, 0, 0.6, 0.21);
  const patch = addPart(torso, new THREE.PlaneGeometry(0.2, 0.1), new THREE.MeshStandardMaterial({ map: devilTextures.patch, roughness: 0.9 }), -0.35, 0.45, -0.232);
  patch.rotation.y = Math.PI;

  // Spiked leather shoulder pads.
  for (const side of [-1, 1]) {
    addPart(torso, new THREE.SphereGeometry(0.25, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), leather, side * 0.58, 1.12, 0);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const spike = addPart(torso, new THREE.ConeGeometry(0.035, 0.18, 8), silver, side * 0.58 + Math.cos(a) * 0.14, 1.26, Math.sin(a) * 0.14);
      spike.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6);
    }
  }

  // Arms in leather sleeves with fingerless gloves. The left hand frets, the right one strums.
  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.6, 1.1, 0);
    torso.add(shoulder);
    addPart(shoulder, new THREE.CylinderGeometry(0.15, 0.13, 0.62, 10).translate(0, -0.31, 0), leather);
    const elbow = new THREE.Group();
    elbow.position.y = -0.6;
    shoulder.add(elbow);
    addPart(elbow, new THREE.CylinderGeometry(0.13, 0.11, 0.5, 10).translate(0, -0.25, 0), leather);
    for (let i = 0; i < 4; i++) addPart(elbow, new THREE.SphereGeometry(0.016, 6, 6), silver, Math.cos(i * 1.6) * 0.12, -0.42, Math.sin(i * 1.6) * 0.12);
    addPart(elbow, new THREE.BoxGeometry(0.12, 0.12, 0.1), dark, 0, -0.56, 0);  // glove
    addPart(elbow, new THREE.BoxGeometry(0.11, 0.09, 0.09), skin, 0, -0.66, 0); // fingers
    return { shoulder, elbow };
  });

  // The guitar, slung across his body with the neck up to his left.
  const guitar = makeFlyingV({ gloss, chrome: silver, bone, dark });
  guitar.position.set(0.05, 0.42, -0.45);
  guitar.scale.setScalar(1.2);
  guitar.rotation.set(0, 0.1, 0.9);
  torso.add(guitar);

  // Head: angry red face, glowing eyes, goatee, pointed ears, long black hair, huge ridged horns.
  const head = new THREE.Group();
  head.position.set(0, 1.55, -0.04);
  torso.add(head);
  addPart(head, new THREE.CylinderGeometry(0.12, 0.14, 0.2, 10), skin, 0, -0.2, 0.02); // neck
  const face = addPart(head, new THREE.SphereGeometry(0.27, 18, 14), skin);
  face.scale.set(0.85, 1.05, 0.9);
  for (const side of [-1, 1]) {
    const brow = addPart(head, new THREE.BoxGeometry(0.15, 0.045, 0.07), skin, side * 0.085, 0.09, -0.2);
    brow.rotation.z = side * 0.35; // angry slant
    addPart(head, new THREE.SphereGeometry(0.03, 8, 6), eyes, side * 0.085, 0.04, -0.215);
    const ear = addPart(head, new THREE.ConeGeometry(0.05, 0.18, 6), skin, side * 0.25, 0.04, 0);
    ear.rotation.z = -side * 1.3;
  }
  addPart(head, new THREE.ConeGeometry(0.035, 0.1, 6), skin, 0, -0.02, -0.25).rotation.x = -Math.PI / 2; // nose
  addPart(head, new THREE.BoxGeometry(0.15, 0.035, 0.03), dark, 0, -0.11, -0.22);                          // snarl
  for (let i = 0; i < 4; i++) addPart(head, new THREE.BoxGeometry(0.025, 0.025, 0.02), teeth, -0.045 + i * 0.03, -0.1, -0.235);
  const goatee = addPart(head, new THREE.ConeGeometry(0.07, 0.3, 8), hair, 0, -0.3, -0.18);
  goatee.rotation.x = Math.PI;
  for (const side of [-1, 1]) {
    const moustache = addPart(head, new THREE.BoxGeometry(0.12, 0.03, 0.03), hair, side * 0.07, -0.075, -0.23);
    moustache.rotation.z = side * -0.4;
  }
  const scalp = addPart(head, new THREE.SphereGeometry(0.3, 16, 12), hair, 0, 0.1, 0.07);
  scalp.scale.set(1, 0.8, 1.05);
  // Long hair falling behind and over the shoulders.
  for (let i = 0; i < 14; i++) {
    const a = -1.7 + (i / 13) * 3.4;
    const strand = addPart(head, new THREE.SphereGeometry(1, 8, 8), hair, Math.sin(a) * 0.24, -0.3, Math.cos(a) * 0.2 + 0.08);
    strand.scale.set(0.09, rand(0.45, 0.6), 0.09);
    strand.rotation.z = Math.sin(a) * 0.25;
  }
  for (const side of [-1, 1]) {
    const lock = addPart(head, new THREE.SphereGeometry(1, 8, 8), hair, side * 0.27, -0.45, -0.06);
    lock.scale.set(0.1, 0.5, 0.1);
  }
  for (const side of [-1, 1]) {
    taperedHorn(head, [
      [side * 0.16, 0.2, -0.02],
      [side * 0.32, 0.38, 0],
      [side * 0.44, 0.65, 0.08],
      [side * 0.4, 0.95, 0.18],
      [side * 0.26, 1.15, 0.18],
    ], 0.085, 0.012);
  }

  // A long red tail curling up beside him, with a black spiked blade that burns.
  const tailCurve = curvedSpike(torso, [[0, -0.05, 0.22], [-0.2, -0.6, 0.6], [-0.5, -1.25, 0.65], [-0.75, -1.0, 0.3], [-0.8, -0.35, 0.05]], 0.05, skin, 0.05);
  const tailTip = new THREE.Group();
  tailTip.position.copy(tailCurve.getPoint(1));
  torso.add(tailTip);
  const blade = addPart(tailTip, new THREE.ConeGeometry(0.13, 0.4, 4), dark, 0, 0.18, 0);
  blade.scale.z = 0.3;
  for (const side of [-1, 1]) {
    const barb = addPart(tailTip, new THREE.ConeGeometry(0.03, 0.15, 6), dark, side * 0.1, 0.02, 0);
    barb.rotation.z = -side * 2.2;
  }

  return { group, torso, legs, arms, guitar, head, tailTip, skin };
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
    this.swingAnim = 0;
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
    game.dropPickup('wings', this.x, this.z);
    game.showMessage('The devil is dead! He dropped his stolen ANGEL WINGS', 4);
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
      this.swingAnim = 0.4;
      Sound.gore();
      game.damagePlayer(GUITAR_SWING_DAMAGE);
      game.knockPlayer(dx / (dist || 1), dz / (dist || 1), 7);
    } else if (this.seesPlayer && dist > 3 && this.fireCooldown <= 0) {
      this.fireCooldown = this.enraged ? 1.5 : 2.4;
      this.throwAnim = 0.5; // a power-chord blast
      this.throwFireballs();
    }
    return moving;
  }

  throwFireballs() {
    const p = game.player;
    const hand = this.localToWorld(0.25, 2.2, -0.9); // fire bursts out of the guitar
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
    Sound.powerChord();
  }

  animate(dt, t, moving) {
    if (moving) this.stepPhase += dt * 7;
    const swing = moving ? Math.sin(this.stepPhase) * 0.5 : 0;
    this.legs[0].rotation.x = swing;
    this.legs[1].rotation.x = -swing;

    this.throwAnim = Math.max(0, this.throwAnim - dt);
    this.swingAnim = Math.max(0, this.swingAnim - dt);
    const fighting = this.state === 'fight';
    const blast = this.throwAnim > 0 ? Math.sin((this.throwAnim / 0.5) * Math.PI) : 0;
    const smash = this.swingAnim > 0 ? Math.sin((this.swingAnim / 0.4) * Math.PI) : 0;

    // Left hand up on the neck, right hand strumming (furiously while he fights).
    const [fret, strum] = this.arms;
    fret.shoulder.rotation.set(1.0, 0, 0.35);
    fret.elbow.rotation.set(1.1, 0, 0);
    strum.shoulder.rotation.set(0.55, 0, -0.45);
    strum.elbow.rotation.set(0.85 + (fighting ? Math.sin(t * 18) * 0.18 : Math.sin(t * 3) * 0.05), 0, 0);

    // Thrust the guitar forward for a power-chord blast, swing it like an axe up close.
    this.guitar.rotation.set(-0.5 * blast, 0.1 - 1.2 * smash, 0.9 + 0.6 * smash);
    this.torso.rotation.set(Math.sin(t * 1.5) * 0.03 - 0.15 * smash + 0.08 * blast, -0.6 * smash, 0);

    // Headbanging to his own riffs.
    this.head.rotation.x = fighting ? Math.max(0, Math.sin(t * (this.enraged ? 11 : 8))) * 0.35 : Math.sin(t * 0.7 + this.seed) * 0.05;
    this.head.rotation.y = fighting ? 0 : Math.sin(t * 0.7 + this.seed) * 0.15;

    this.flash = Math.max(0, this.flash - dt);
    this.skin.emissiveIntensity = (this.enraged ? 1.3 : 0.8) + Math.sin(t * 9) * 0.2 + this.flash * 15;
    this.group.position.set(this.x, moving ? Math.abs(Math.sin(this.stepPhase)) * 0.08 : 0, this.z);
    this.group.rotation.y = this.yaw;
  }

  // Hellfire on his horns and the burning blade of his tail, more when he's enraged.
  emitFlames(dt) {
    this.flameAcc += dt * (this.enraged ? 120 : 60);
    const tip = this.tailTip.getWorldPosition(new THREE.Vector3());
    while (this.flameAcc >= 1) {
      this.flameAcc -= 1;
      if (Math.random() < 0.5) {
        game.fire.emit(tip.x + rand(-0.1, 0.1), tip.y + rand(0, 0.3), tip.z + rand(-0.1, 0.1), rand(-0.2, 0.2), rand(1, 2), rand(-0.2, 0.2), rand(0.25, 0.5), 2);
      } else {
        const side = Math.random() < 0.5 ? -1 : 1;
        const p = this.localToWorld(side * rand(0.25, 0.45), rand(4.0, 4.5), rand(0, 0.2));
        game.fire.emit(p.x, p.y, p.z, rand(-0.3, 0.3), rand(1, 2), rand(-0.3, 0.3), rand(0.3, 0.6), 2);
      }
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
