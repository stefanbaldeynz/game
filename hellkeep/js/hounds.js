// Hellhounds: charred dogs with burning cracks in their skin, wrapped in flames.
// They sleep until they see or hear you, then hunt you down through the castle.
//
// The body is a real animated wolf model (MODELS.hellhound, from models/hellhound.glb: 'Wolf' by Quaternius,
// public domain), turned into a hellhound here: charred skin with glowing lava
// cracks, burning eyes, horns and spine spikes. If the model can't be loaded, the
// old hound built from boxes (makeHoundModel) is used instead.

const HOUND_SPEED = 5.4;
const HOUND_HP = 60;
const HOUND_SCALE = 1.25;
const HOUND_RADIUS = 0.45;
const HOUND_BITE_RANGE = 1.9;

const WOLF_LENGTH = 2.4;  // nose to tail tip, before HOUND_SCALE
const RUN_ANIM_SPEED = 1.25; // how fast the gallop plays
// Which animation in the model is used for what.
const HOUND_CLIPS = {
  idle: 'Idle',
  run: 'Gallop',
  attack: 'Attack',
  death: 'Death',
  hitLeft: 'Idle_HitReact_Left',
  hitRight: 'Idle_HitReact_Right',
};

// ---------- The animated model ----------

let houndTemplate = null;

// Glowing lava cracks, worked out from the shape of the body (the model has no
// texture coordinates to wrap a picture around). A cellular pattern: the edges
// between the cells are the cracks.
const CRACK_GLSL = `
varying vec3 vHellPos;
vec3 hellHash(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453);
}
float hellCracks(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 r = g + hellHash(i + g) - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return 1.0 - smoothstep(0.02, 0.09, sqrt(d2) - sqrt(d1));
}
`;

function hellfireSkin(color, crackScale, glow = 0xff5a10) {
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.85, emissive: glow, emissiveIntensity: 1 });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vHellPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHellPos = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${CRACK_GLSL}`)
      .replace(
        'vec3 totalEmissiveRadiance = emissive;',
        `vec3 totalEmissiveRadiance = emissive * hellCracks(vHellPos * ${crackScale.toFixed(2)});`,
      );
  };
  material.customProgramCacheKey = () => `hellfire-skin-${crackScale.toFixed(2)}`;
  return material;
}

// Measure the model once: its size, where it stands, and its animations.
function prepareHoundTemplate(gltf) {
  const model = gltf.scene;
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  let meshSize = 0;
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.computeBoundingBox();
    const size = o.geometry.boundingBox.getSize(new THREE.Vector3());
    meshSize = Math.max(meshSize, size.x, size.y, size.z);
  });
  const clips = {};
  for (const [key, name] of Object.entries(HOUND_CLIPS)) {
    clips[key] = gltf.animations.find((a) => a.name === name);
    if (!clips[key]) throw new Error(`Hellhound model has no "${name}" animation`);
  }
  return {
    model,
    clips,
    scale: WOLF_LENGTH / (box.max.z - box.min.z),
    centerZ: (box.min.z + box.max.z) / 2,
    minY: box.min.y,
    crackScale: 12 / meshSize, // about a dozen crack cells along the body
  };
}

function makeGltfHound() {
  const tpl = houndTemplate;
  const inner = THREE_ADDONS.SkeletonUtils.clone(tpl.model);
  // The model faces +Z; hounds face -Z.
  inner.rotation.y = Math.PI;
  inner.scale.setScalar(tpl.scale);
  inner.position.set(0, -tpl.minY * tpl.scale, tpl.centerZ * tpl.scale);

  // Each hound gets its own materials so it can flash and fade on its own.
  const skin = hellfireSkin(0x3a2620, tpl.crackScale);
  const skinLight = hellfireSkin(0x6a3a28, tpl.crackScale);
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a0a06, roughness: 0.9, emissive: 0x401000 });
  const eyes = new THREE.MeshBasicMaterial({ color: 0xffee66 });
  inner.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false; // the running animation moves it outside its resting bounds
    const name = o.material.name;
    o.material = name === 'Main' ? skin : name === 'Main_Light' ? skinLight : name === 'Eyes_Black' ? eyes : dark;
  });

  const group = new THREE.Group();
  group.add(inner);
  group.scale.setScalar(HOUND_SCALE);
  group.updateMatrixWorld(true);

  // Where a bone sits, in the hound's own coordinates (before HOUND_SCALE).
  const bone = (name) => inner.getObjectByName(name);
  const local = (name) => group.worldToLocal(bone(name).getWorldPosition(new THREE.Vector3()));

  // Horns on the head and spikes down the spine, fixed to the bones so they
  // move with the animation.
  const head = local('Head');
  for (const sx of [-0.1, 0.1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.26, 5), dark);
    horn.position.set(sx, head.y + 0.2, head.z + 0.08);
    horn.rotation.set(0.5, 0, -sx * 4);
    group.add(horn);
    bone('Head').attach(horn);
  }
  for (const name of ['Back', 'Torso', 'Torso2', 'Torso3', 'Neck1']) {
    const p = local(name);
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.17, 4), dark);
    spike.position.set(0, p.y + 0.17, p.z);
    group.add(spike);
    bone(name).attach(spike);
  }

  const mixer = new THREE.AnimationMixer(inner);
  const actions = {};
  for (const [key, clip] of Object.entries(tpl.clips)) actions[key] = mixer.clipAction(clip);

  return {
    group,
    skin,
    skinLight,
    eyes,
    mixer,
    actions,
    // Body, chest and head, for working out bullet hits.
    hitPoints: [local('Torso'), local('Neck1'), head],
  };
}

if (window.MODELS && MODELS.hellhound) {
  try {
    houndTemplate = prepareHoundTemplate(MODELS.hellhound);
  } catch (error) {
    console.warn('Hellhound model unusable, using the box hound instead.', error);
  }
}

// ---------- The old hound, built from boxes (used if the model is missing) ----------

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
    this.oneShotT = 0; // time left on an attack, flinch or death animation
    Object.assign(this, houndTemplate ? makeGltfHound() : makeHoundModel());
    this.group.position.set(x, 0, z);
    scene.add(this.group);
    if (this.mixer) {
      this.playAnim('idle');
      this.mixer.update(rand(0, 2)); // so the pack doesn't breathe in step
    }
  }

  // Blend smoothly into another of the model's animations.
  // once = play it a single time (and hold the last frame).
  playAnim(name, { fade = 0.2, once = false, speed = 1 } = {}) {
    const next = this.actions[name];
    if (next === this.current && !once) return;
    next.reset();
    next.setEffectiveTimeScale(speed);
    next.setEffectiveWeight(1);
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = once;
    if (this.current && this.current !== next) next.crossFadeFrom(this.current, fade, false);
    next.play();
    this.current = next;
    if (once) this.oneShotT = (next.getClip().duration / speed) * 0.8;
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
    if (this.hitPoints) {
      const [body, chest, head] = this.hitPoints.map((p) => this.localToWorld(p.x, p.y, p.z));
      return [
        { ...body, r: 0.42 * HOUND_SCALE },
        { ...chest, r: 0.4 * HOUND_SCALE },
        { ...head, r: 0.3 * HOUND_SCALE },
      ];
    }
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
    else if (this.mixer && this.current !== this.actions.attack) {
      // Flinch away from the side the shot came from.
      const side = direction.x * Math.cos(this.yaw) - direction.z * Math.sin(this.yaw) > 0 ? 'hitLeft' : 'hitRight';
      this.playAnim(side, { fade: 0.06, once: true, speed: 1.6 });
    }
  }

  die() {
    this.state = 'dead';
    if (this.mixer) this.playAnim('death', { fade: 0.1, once: true, speed: 1.2 });
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
      if (this.mixer) this.playAnim('attack', { fade: 0.08, once: true, speed: 2 });
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
    if (this.mixer) {
      this.animateModel(dt, t, moving);
      return;
    }
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

  // The animated model: gallop while chasing, stand and breathe otherwise.
  // Attacks and flinches play over the top, then it goes back to running or standing.
  animateModel(dt, t, moving) {
    this.oneShotT -= dt;
    if (this.oneShotT <= 0) {
      if (moving) this.playAnim('run', { speed: RUN_ANIM_SPEED });
      else this.playAnim('idle');
    }
    this.mixer.update(dt);
    this.flash = Math.max(0, this.flash - dt);
    const glow = 0.9 + Math.sin(t * 11 + this.seed) * 0.25 + this.flash * 20;
    this.skin.emissiveIntensity = glow;
    this.skinLight.emissiveIntensity = glow;
    this.group.position.set(this.x, 0, this.z);
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
    if (this.mixer) {
      // The model has its own death animation: it collapses, then smoulders.
      this.mixer.update(dt);
      this.skinLight.emissiveIntensity = this.skin.emissiveIntensity;
    } else if (this.deathT < 1) {
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
