// Ice elephants: huge frozen beasts wreathed in blue fire, with long curved tusks.
// They plod after you, then rear up, trumpet and charge in a straight line.
// Double jump (or fly) over a charge to dodge it. A charge into a wall stuns them for a moment.

const ELEPHANT_HP = 320;
const ELEPHANT_RADIUS = 1.0;
const ELEPHANT_WALK = 3.0;
const ELEPHANT_CHARGE_SPEED = 12;
const ELEPHANT_CHARGE_DAMAGE = 25;
const ELEPHANT_GORE_DAMAGE = 14;
const ELEPHANT_HEIGHT = 3.3; // the model is scaled to this height

// ---------- The elephant model ----------
// MODELS.elephant ('Elephant' by elkiotbear, CC-BY 3.0, models/elephant.glb) is a still
// model with no skeleton. To animate it, it gets one here, at load time: bones for the
// body, head, ears, a six-part trunk, tail and four legs, laid out like the old elephant's
// parts so the same animation code drives it. Every vertex is attached to the bone nearest
// in spirit: low and under a hip = that leg, in front of the face = the trunk, and so on.

let elephantTemplate = null;

function prepareElephantTemplate(gltf) {
  // Bake every part into one coordinate space, grouped by material (hide and ivory).
  gltf.scene.updateMatrixWorld(true);
  const parts = [];
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const geometry = o.geometry.clone().applyMatrix4(o.matrixWorld);
    parts.push({ geometry, ivory: /ivory/i.test(o.material.name) });
  });
  if (!parts.length) throw new Error('Elephant model has no meshes');

  // Face it down -Z like every other beast: the tusks show which way is forward.
  const box = (list) => list.reduce((b, p) => b.union(p.geometry.computeBoundingBox() || p.geometry.boundingBox), new THREE.Box3());
  const all = box(parts);
  const tusks = box(parts.filter((p) => p.ivory));
  const center = all.getCenter(new THREE.Vector3());
  const front = tusks.isEmpty() ? new THREE.Vector3(0, 0, -1) : tusks.getCenter(new THREE.Vector3()).sub(center);
  const turn = Math.abs(front.x) > Math.abs(front.z)
    ? (front.x > 0 ? Math.PI / 2 : -Math.PI / 2)
    : (front.z > 0 ? Math.PI : 0);
  for (const p of parts) p.geometry.rotateY(turn);

  // Scale to size, feet on the floor, centred.
  const turned = box(parts);
  const scale = ELEPHANT_HEIGHT / (turned.max.y - turned.min.y);
  const mid = turned.getCenter(new THREE.Vector3());
  for (const p of parts) {
    p.geometry.translate(-mid.x, -turned.min.y, -mid.z);
    p.geometry.scale(scale, scale, scale);
    p.geometry.computeVertexNormals();
  }
  const b = box(parts);
  return { parts, H: b.max.y, L: b.max.z - b.min.z, W: b.max.x - b.min.x, front: b.min.z, back: b.max.z };
}

function makeRiggedElephant() {
  const tpl = elephantTemplate;
  const { H, L, W, front, back } = tpl;
  const at = (x, y, z) => new THREE.Vector3(x, y, z);

  // Feet: the lowest vertices, split into front/back and left/right.
  const feet = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(() => ({ x: 0, z: 0, n: 0 }));
  const footIndex = (x, z) => (x < 0 ? 0 : 1) + (z < 0 ? 0 : 2);
  for (const p of tpl.parts) {
    if (p.ivory) continue;
    const pos = p.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > H * 0.08 || pos.getZ(i) < front + L * 0.15) continue; // feet only, not a dangling trunk
      const f = feet[footIndex(pos.getX(i), pos.getZ(i))];
      f.x += pos.getX(i);
      f.z += pos.getZ(i);
      f.n++;
    }
  }
  for (const [i, f] of feet.entries()) {
    if (f.n) {
      f.x /= f.n;
      f.z /= f.n;
    } else {
      f.x = (i % 2 ? 1 : -1) * W * 0.25;
      f.z = (i < 2 ? -1 : 1) * L * 0.25;
    }
  }

  // The skeleton, matching the old elephant's moving parts.
  const hipY = H * 0.5;
  const headZ = front + L * 0.24;
  const headY = H * 0.7;
  const root = new THREE.Bone();
  const body = new THREE.Bone(); // rears up before a charge (pivots on the ground under its middle)
  root.add(body);
  const head = new THREE.Bone();
  head.position.set(0, headY, headZ);
  body.add(head);
  const ears = [-1, 1].map((side) => {
    const ear = new THREE.Bone();
    ear.position.set(side * W * 0.18, H * 0.08, L * 0.06);
    head.add(ear);
    return ear;
  });
  // The trunk hangs from the face down to its tip, in six links.
  const trunkTop = at(0, H * 0.6, front + L * 0.1);
  const trunkLow = at(0, H * 0.12, front + L * 0.02);
  const trunk = [];
  let parent = head;
  let parentWorld = at(0, headY, headZ);
  for (let i = 0; i < 6; i++) {
    const joint = new THREE.Bone();
    const p = trunkTop.clone().lerp(trunkLow, i / 6);
    joint.position.copy(p).sub(parentWorld);
    parent.add(joint);
    trunk.push(joint);
    parent = joint;
    parentWorld = p;
  }
  const tail = new THREE.Bone();
  tail.position.set(0, H * 0.72, back - L * 0.04);
  body.add(tail);
  const legs = feet.map((f) => {
    const hip = new THREE.Bone();
    hip.position.set(f.x, hipY, f.z);
    root.add(hip);
    return hip;
  });
  const bones = [root, body, head, ...ears, ...trunk, tail, ...legs];
  const index = (bone) => bones.indexOf(bone);

  // Which bone(s) move each vertex.
  function weigh(x, y, z, ivory) {
    if (ivory) return [[head, 1]];
    if (z < front + L * 0.2 && y < H * 0.66) {
      const t = THREE.MathUtils.clamp((trunkTop.y - y) / (trunkTop.y - trunkLow.y), 0, 0.999);
      return [[trunk[Math.floor(t * 6)], 1]];
    }
    if (y < hipY) {
      let best = 0;
      let bestD = Infinity;
      feet.forEach((f, i) => {
        const d = Math.hypot(x - f.x, z - f.z);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      if (bestD < Math.max(W, L) * 0.22) {
        const k = THREE.MathUtils.smoothstep(y, hipY * 0.55, hipY); // blend into the body near the top
        return [[legs[best], 1 - k], [body, k]];
      }
    }
    if (z < headZ + L * 0.14 && y > H * 0.42) {
      if (Math.abs(x) > W * 0.22 && z > front + L * 0.12) return [[ears[x < 0 ? 0 : 1], 1]];
      return [[head, 1]];
    }
    if (z > back - L * 0.08 && y > H * 0.25 && y < H * 0.8) return [[tail, 1]];
    return [[body, 1]];
  }

  const group = new THREE.Group();
  group.add(root);
  group.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  const skin = hellfireSkin(0x5a6a82, 1.7, 0x3aa8ff);
  const ivory = new THREE.MeshStandardMaterial({ color: 0xe8eef4, roughness: 0.35, emissive: 0x18304a, emissiveIntensity: 0.3 });
  for (const p of tpl.parts) {
    const geometry = p.geometry.clone();
    const pos = geometry.attributes.position;
    const skinIndex = new Uint16Array(pos.count * 4);
    const skinWeight = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) {
      weigh(pos.getX(i), pos.getY(i), pos.getZ(i), p.ivory).forEach(([bone, w], k) => {
        skinIndex[i * 4 + k] = index(bone);
        skinWeight[i * 4 + k] = w;
      });
    }
    geometry.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndex, 4));
    geometry.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeight, 4));
    const mesh = new THREE.SkinnedMesh(geometry, p.ivory ? ivory : skin);
    mesh.frustumCulled = false;
    group.add(mesh);
    mesh.bind(skeleton);
  }

  // Icicles growing out of its back.
  const ice = new THREE.MeshStandardMaterial({ color: 0xbfe8ff, roughness: 0.15, metalness: 0.1, emissive: 0x3080c0, emissiveIntensity: 0.6 });
  for (let i = 0; i < 9; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(rand(0.07, 0.12), rand(0.35, 0.7), 6), ice);
    spike.position.set(rand(-0.3, 0.3), H * 0.93, rand(headZ + L * 0.2, back - L * 0.2));
    spike.rotation.set(rand(-0.3, 0.3), 0, rand(-0.4, 0.4));
    body.add(spike);
  }

  return { group, bodyGroup: body, head, ears, trunk, legs, tail, skin, rigged: true };
}

if (window.MODELS && MODELS.elephant) {
  try {
    elephantTemplate = prepareElephantTemplate(MODELS.elephant);
  } catch (error) {
    console.warn('Elephant model unusable, using the built-in elephant instead.', error);
  }
}

let elephantTextures = null;

// A tube that follows a curve, with a cone tip on the end: tusks, horns, tails.
function curvedSpike(parent, points, radius, material, tipLength) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  addPart(parent, new THREE.TubeGeometry(curve, 16, radius, 8, false), material);
  const tip = addPart(parent, new THREE.ConeGeometry(radius, tipLength, 8), material);
  const tangent = curve.getTangent(1);
  tip.position.copy(curve.getPoint(1)).addScaledVector(tangent, tipLength / 2);
  tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  return curve;
}

function makeElephantModel() {
  if (!elephantTextures) elephantTextures = { skin: Textures.elephantSkin(), cracks: Textures.elephantCracks() };
  const skin = new THREE.MeshStandardMaterial({
    color: 0xc0d0e0,
    map: elephantTextures.skin,
    emissive: 0xffffff,
    emissiveMap: elephantTextures.cracks,
    roughness: 0.85,
  });
  const ivory = new THREE.MeshStandardMaterial({ color: 0xd8e2ea, roughness: 0.45, emissive: 0x18304a, emissiveIntensity: 0.25 });
  const ice = new THREE.MeshStandardMaterial({ color: 0xbfe8ff, roughness: 0.2, metalness: 0.1, emissive: 0x3080c0, emissiveIntensity: 0.5 });
  const eyes = new THREE.MeshBasicMaterial({ color: 0x8af0ff });

  const group = new THREE.Group();
  const bodyGroup = new THREE.Group(); // rears up before a charge
  group.add(bodyGroup);
  const body = addPart(bodyGroup, new THREE.SphereGeometry(1, 20, 16), skin, 0, 2.0, 0.1);
  body.scale.set(1.25, 1.1, 1.75);

  // Icicles growing out of its back.
  for (let i = 0; i < 9; i++) {
    const spike = addPart(bodyGroup, new THREE.ConeGeometry(rand(0.08, 0.14), rand(0.4, 0.8), 6), ice, rand(-0.5, 0.5), 3.0, rand(-1.1, 1.2));
    spike.rotation.set(rand(-0.3, 0.3), 0, rand(-0.4, 0.4));
  }

  const head = new THREE.Group();
  head.position.set(0, 2.5, -1.75);
  bodyGroup.add(head);
  addPart(head, new THREE.SphereGeometry(0.75, 18, 14), skin);
  for (const side of [-1, 1]) {
    addPart(head, new THREE.SphereGeometry(0.07, 8, 6), eyes, side * 0.42, 0.18, -0.55);
  }
  const ears = [-1, 1].map((side) => {
    const ear = new THREE.Group();
    ear.position.set(side * 0.65, 0.05, 0.15);
    head.add(ear);
    const flap = addPart(ear, new THREE.CircleGeometry(0.9, 18), skin, side * 0.55, -0.15, 0.2);
    flap.material = skin.clone();
    flap.material.side = THREE.DoubleSide;
    flap.rotation.y = side * (Math.PI / 2 - 0.35);
    flap.scale.set(0.85, 1.15, 1);
    return ear;
  });

  // Major tusks sweeping forward and up.
  for (const side of [-1, 1]) {
    curvedSpike(head, [
      [side * 0.32, -0.35, -0.45],
      [side * 0.45, -0.9, -1.1],
      [side * 0.6, -0.8, -1.9],
      [side * 0.55, -0.25, -2.5],
    ], 0.11, ivory, 0.45);
  }

  // Trunk: a chain of segments that curls and sways.
  const trunk = [];
  let joint = new THREE.Group();
  joint.position.set(0, -0.2, -0.65);
  joint.rotation.x = 0.35;
  head.add(joint);
  for (let i = 0; i < 6; i++) {
    const length = 0.38;
    const radius = 0.24 - i * 0.025;
    const geometry = new THREE.CylinderGeometry(radius, radius - 0.02, length, 10);
    geometry.translate(0, -length / 2, 0);
    addPart(joint, geometry, skin);
    trunk.push(joint);
    const next = new THREE.Group();
    next.position.y = -length;
    joint.add(next);
    joint = next;
  }

  // Legs pivot at the hip so they can swing.
  const legGeometry = new THREE.CylinderGeometry(0.33, 0.3, 1.5, 12);
  legGeometry.translate(0, -0.75, 0);
  const footGeometry = new THREE.CylinderGeometry(0.38, 0.4, 0.18, 12);
  const legs = [[-0.65, -0.95], [0.65, -0.95], [-0.65, 1.05], [0.65, 1.05]].map(([x, z]) => {
    const hip = new THREE.Group();
    hip.position.set(x, 1.65, z);
    group.add(hip);
    addPart(hip, legGeometry, skin);
    addPart(hip, footGeometry, skin, 0, -1.55, 0);
    return hip;
  });

  const tail = addPart(bodyGroup, new THREE.CylinderGeometry(0.05, 0.03, 0.9, 6).translate(0, -0.45, 0), skin, 0, 2.3, 1.95);
  tail.rotation.x = 0.4;

  return { group, bodyGroup, head, ears, trunk, legs, tail, skin };
}

class Elephant {
  constructor(scene, x, z) {
    this.type = 'elephant';
    this.radius = ELEPHANT_RADIUS;
    this.x = x;
    this.z = z;
    this.yaw = rand(0, Math.PI * 2);
    this.hp = ELEPHANT_HP;
    this.state = 'idle'; // idle | chase | windup | charge | stunned | dead
    this.stateTimer = 0;
    this.seed = rand(0, 100);
    this.stepPhase = 0;
    this.thinkTimer = rand(0, 0.3);
    this.seesPlayer = false;
    this.chargeCooldown = rand(1, 3);
    this.attackCooldown = 1;
    this.chargeDir = { x: 0, z: 0 };
    this.gore = 0;
    this.flash = 0;
    this.deathT = 0;
    this.fallSide = Math.random() < 0.5 ? -1 : 1;
    this.flameAcc = 0;
    Object.assign(this, elephantTemplate ? makeRiggedElephant() : makeElephantModel());
    this.group.position.set(x, 0, z);
    scene.add(this.group);
  }

  get alive() {
    return this.state !== 'dead';
  }

  volume() {
    return Math.max(0.2, 1 - Math.hypot(game.player.x - this.x, game.player.z - this.z) / 40);
  }

  alert() {
    if (this.state !== 'idle') return;
    this.state = 'chase';
    Sound.trumpet(this.volume());
  }

  localToWorld(lx, ly, lz) {
    const c = Math.cos(this.yaw);
    const s = Math.sin(this.yaw);
    return { x: this.x + lx * c + lz * s, y: ly, z: this.z - lx * s + lz * c };
  }

  hitSpheres() {
    return [
      { ...this.localToWorld(0, 2.0, 0.4), r: 1.3 },
      { ...this.localToWorld(0, 2.1, -0.9), r: 1.15 },
      { ...this.localToWorld(0, 2.5, -1.8), r: 0.8 },
    ];
  }

  takeDamage(amount, direction) {
    if (!this.alive) return;
    this.hp -= amount;
    this.flash = 0.12;
    this.alert();
    moveWithCollision(this, direction.x * 0.04, direction.z * 0.04, ELEPHANT_RADIUS, true);
    if (this.hp <= 0) this.die();
  }

  die() {
    this.state = 'dead';
    Sound.elephantDeath(this.volume());
    const center = this.localToWorld(0, 2, 0);
    for (let i = 0; i < 90; i++) {
      game.fire.emit(center.x + rand(-1, 1), center.y + rand(-0.8, 0.8), center.z + rand(-1.5, 1.5), rand(-3, 3), rand(0, 4), rand(-3, 3), rand(0.5, 1.1), 1);
    }
    game.onEnemyKilled(this);
  }

  turnToward(dx, dz, dt, rate = 5) {
    const target = Math.atan2(-dx, -dz);
    const diff = Math.atan2(Math.sin(target - this.yaw), Math.cos(target - this.yaw));
    this.yaw += diff * Math.min(1, dt * rate);
  }

  update(dt, t, active) {
    if (!this.alive) {
      this.updateDeath(dt);
      return;
    }
    const speed = active ? this.think(dt) : 0;
    this.animate(dt, t, speed);
    this.emitFlames(dt);
  }

  // Returns how fast it moved this frame (for the walk animation).
  think(dt) {
    const p = game.player;
    const dx = p.x - this.x;
    const dz = p.z - this.z;
    const dist = Math.hypot(dx, dz);

    this.thinkTimer -= dt;
    if (this.thinkTimer <= 0) {
      this.thinkTimer = 0.3;
      this.seesPlayer = hasLineOfSight(this.x, this.z, p.x, p.z);
      if (this.state === 'idle' && ((this.seesPlayer && dist < 22) || dist < 6)) this.alert();
    }
    this.chargeCooldown -= dt;
    this.attackCooldown -= dt;
    this.stateTimer -= dt;
    let speed = 0;

    if (this.state === 'chase') {
      if (this.seesPlayer && dist > 5 && dist < 18 && this.chargeCooldown <= 0) {
        // Rear up and get ready to charge.
        this.state = 'windup';
        this.stateTimer = 0.8;
        Sound.trumpet(this.volume());
      } else if (dist > 2.6) {
        let tx = p.x;
        let tz = p.z;
        if (!(this.seesPlayer && dist < 10)) {
          const step = nextStepToward(this.x, this.z);
          if (step) {
            tx = step.x;
            tz = step.z;
          }
        }
        const mx = tx - this.x;
        const mz = tz - this.z;
        const len = Math.hypot(mx, mz) || 1;
        moveWithCollision(this, (mx / len) * ELEPHANT_WALK * dt, (mz / len) * ELEPHANT_WALK * dt, ELEPHANT_RADIUS, true);
        this.turnToward(mx, mz, dt, 4);
        speed = ELEPHANT_WALK;
      } else {
        this.turnToward(dx, dz, dt, 4);
      }
      // Gore with the tusks when you're close and on the ground.
      if (dist < 3.4 && p.y < 2 && this.attackCooldown <= 0) {
        this.attackCooldown = 1.4;
        this.gore = 0.35;
        Sound.gore();
        game.damagePlayer(ELEPHANT_GORE_DAMAGE);
        game.knockPlayer(dx / (dist || 1), dz / (dist || 1), 6);
      }
    } else if (this.state === 'windup') {
      this.turnToward(dx, dz, dt, 8);
      if (this.stateTimer <= 0) {
        this.state = 'charge';
        this.stateTimer = 1.8;
        const len = dist || 1;
        this.chargeDir = { x: dx / len, z: dz / len };
      }
    } else if (this.state === 'charge') {
      const step = ELEPHANT_CHARGE_SPEED * dt;
      const beforeX = this.x;
      const beforeZ = this.z;
      moveWithCollision(this, this.chargeDir.x * step, this.chargeDir.z * step, ELEPHANT_RADIUS, true);
      const moved = Math.hypot(this.x - beforeX, this.z - beforeZ);
      this.turnToward(this.chargeDir.x, this.chargeDir.z, dt, 10);
      speed = ELEPHANT_CHARGE_SPEED;
      game.shakeNear(this.x, this.z, 0.25);
      // Trample you if you're in the way and not up in the air.
      if (dist < ELEPHANT_RADIUS + 1.2 && p.y < 1.6) {
        Sound.gore();
        game.damagePlayer(ELEPHANT_CHARGE_DAMAGE);
        game.knockPlayer(this.chargeDir.x, this.chargeDir.z, 14);
        this.endCharge(2.5);
      } else if (moved < step * 0.4) {
        // Smashed into a wall: dazed for a moment.
        this.state = 'stunned';
        this.stateTimer = 1.4;
        this.chargeCooldown = 4;
        Sound.thud();
        game.shakeNear(this.x, this.z, 1);
        const front = this.localToWorld(0, 1.5, -2.5);
        for (let i = 0; i < 30; i++) game.sparks.emit(front.x, front.y, front.z, rand(-4, 4), rand(0, 5), rand(-4, 4), rand(0.3, 0.7), -9);
      } else if (this.stateTimer <= 0) {
        this.endCharge(3.5);
      }
    } else if (this.state === 'stunned') {
      if (this.stateTimer <= 0) this.state = 'chase';
    }

    // Keep from overlapping other enemies.
    for (const other of game.enemies) {
      if (other === this || !other.alive) continue;
      const ox = this.x - other.x;
      const oz = this.z - other.z;
      const d = Math.hypot(ox, oz);
      const gap = this.radius + other.radius + 0.3;
      if (d > 0 && d < gap) {
        const push = (gap - d) * 0.5;
        moveWithCollision(this, (ox / d) * push, (oz / d) * push, ELEPHANT_RADIUS, true);
      }
    }
    return speed;
  }

  endCharge(cooldown) {
    this.state = 'chase';
    this.chargeCooldown = cooldown;
  }

  animate(dt, t, speed) {
    this.stepPhase += dt * speed * 1.6;
    const swing = speed > 0 ? Math.sin(this.stepPhase) * (speed > 5 ? 0.7 : 0.4) : 0;
    this.legs[0].rotation.x = swing;
    this.legs[3].rotation.x = swing;
    this.legs[1].rotation.x = -swing;
    this.legs[2].rotation.x = -swing;

    // Rear up during the wind-up, lean in while charging, wobble when stunned.
    let lean = 0;
    if (this.state === 'windup') lean = 0.3 * Math.min(1, (0.8 - this.stateTimer) / 0.3);
    else if (this.state === 'charge') lean = -0.08;
    this.bodyGroup.rotation.x += (lean - this.bodyGroup.rotation.x) * Math.min(1, dt * 8);
    this.bodyGroup.rotation.z = this.state === 'stunned' ? Math.sin(t * 9) * 0.08 : 0;

    for (let i = 0; i < this.trunk.length; i++) {
      // (The model's trunk already hangs in its resting curve; the old one needed a bend.)
      const rest = i === 0 && !this.rigged ? 0.35 : 0;
      this.trunk[i].rotation.x = rest + Math.sin(t * 1.6 + this.seed + i * 0.6) * 0.12 - (this.state === 'windup' ? 0.25 : 0);
      this.trunk[i].rotation.z = Math.sin(t * 1.1 + this.seed + i * 0.4) * 0.08;
    }
    this.ears.forEach((ear, i) => {
      ear.rotation.y = (i ? -1 : 1) * (Math.sin(t * (speed > 5 ? 9 : 2) + this.seed) * 0.25);
    });
    this.gore = Math.max(0, this.gore - dt);
    this.head.rotation.x = this.gore > 0 ? 0.35 : 0;
    this.tail.rotation.z = Math.sin(t * 3 + this.seed) * 0.3;

    this.flash = Math.max(0, this.flash - dt);
    this.skin.emissiveIntensity = 0.8 + Math.sin(t * 7 + this.seed) * 0.2 + this.flash * 15;
    const bob = speed > 0 ? Math.abs(Math.sin(this.stepPhase)) * (speed > 5 ? 0.15 : 0.06) : 0;
    this.group.position.set(this.x, bob, this.z);
    this.group.rotation.y = this.yaw;
  }

  // Cold blue flames rising from its back and head.
  emitFlames(dt) {
    this.flameAcc += dt * 90;
    while (this.flameAcc >= 1) {
      this.flameAcc -= 1;
      const onHead = Math.random() < 0.25;
      const p = onHead
        ? this.localToWorld(rand(-0.4, 0.4), rand(2.9, 3.2), rand(-2.0, -1.5))
        : this.localToWorld(rand(-0.7, 0.7), rand(2.9, 3.15), rand(-1.2, 1.4));
      game.fire.emit(p.x, p.y, p.z, rand(-0.3, 0.3), rand(0.8, 1.8), rand(-0.3, 0.3), rand(0.35, 0.7), 2);
    }
  }

  updateDeath(dt) {
    if (this.deathT < 1) {
      this.deathT = Math.min(1, this.deathT + dt * 1.8);
      this.group.rotation.z = this.deathT * (Math.PI / 2) * this.fallSide;
      this.group.position.y = this.deathT * 1.2;
      for (const leg of this.legs) leg.rotation.x *= 0.9;
    }
    this.skin.emissiveIntensity = Math.max(0.05, this.skin.emissiveIntensity - dt * 0.3);
    this.flameAcc += dt * 30 * this.skin.emissiveIntensity;
    while (this.flameAcc >= 1) {
      this.flameAcc -= 1;
      game.fire.emit(this.x + rand(-1.5, 1.5), 1, this.z + rand(-1.5, 1.5), 0, rand(0.5, 1.2), 0, rand(0.3, 0.6), 1);
    }
  }
}
