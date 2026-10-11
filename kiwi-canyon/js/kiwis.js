// Kiwis: round, fuzzy, long-beaked, and determined to get through the canyon.
// Every wave they get tougher (more health), a little bigger and a little redder.

let kiwiShared = null;

function kiwiMaterials(wave) {
  if (!kiwiShared) {
    kiwiShared = {
      feathers: Textures.kiwiFeathers(),
      bodies: {},
      beak: new THREE.MeshStandardMaterial({ color: 0xd9c9a0, roughness: 0.6 }),
      eye: new THREE.MeshBasicMaterial({ color: 0x111111 }),
      leg: new THREE.MeshStandardMaterial({ color: 0xc8b090, roughness: 0.7 }),
      barBack: new THREE.MeshBasicMaterial({ color: 0x1a1a1a }),
      barGeometry: new THREE.PlaneGeometry(1.0, 0.16),
      fillGeometry: new THREE.PlaneGeometry(0.94, 0.1).translate(0.47, 0, 0), // grows from the left
    };
  }
  if (!kiwiShared.bodies[wave]) {
    const tint = new THREE.Color(0xffffff).lerp(new THREE.Color(0xd0705a), (wave - 1) / (CONFIG.totalWaves - 1));
    kiwiShared.bodies[wave] = new THREE.MeshStandardMaterial({
      map: kiwiShared.feathers,
      bumpMap: kiwiShared.feathers,
      bumpScale: 0.6,
      color: tint,
      roughness: 1,
    });
  }
  return { ...kiwiShared, body: kiwiShared.bodies[wave] };
}

function makeKiwiModel(wave) {
  const mats = kiwiMaterials(wave);
  const group = new THREE.Group();
  const torso = new THREE.Group(); // sways from side to side as it waddles
  group.add(torso);

  const body = addPart(torso, new THREE.SphereGeometry(0.42, 18, 14), mats.body, 0, 0.62, 0);
  body.scale.set(1, 0.85, 1.2);
  addPart(torso, new THREE.SphereGeometry(0.2, 14, 12), mats.body, 0, 0.8, -0.48); // head
  const beak = addPart(torso, new THREE.ConeGeometry(0.035, 0.55, 8), mats.beak, 0, 0.69, -0.92);
  beak.rotation.x = -Math.PI / 2 - 0.35; // long beak pointing forward and down
  for (const side of [-1, 1]) addPart(torso, new THREE.SphereGeometry(0.028, 8, 6), mats.eye, side * 0.1, 0.86, -0.62);

  const legGeometry = new THREE.CylinderGeometry(0.045, 0.04, 0.3, 6);
  const footGeometry = new THREE.BoxGeometry(0.15, 0.03, 0.2);
  const legs = [-0.13, 0.13].map((x) => {
    const hip = new THREE.Group();
    hip.position.set(x, 0.38, 0.02);
    group.add(hip);
    addPart(hip, legGeometry, mats.leg, 0, -0.17, 0);
    addPart(hip, footGeometry, mats.leg, 0, -0.33, -0.06);
    return hip;
  });
  castShadows(group);
  return { group, torso, legs };
}

class Kiwi {
  constructor(scene, wave) {
    this.scene = scene;
    this.wave = wave;
    this.maxHp = CONFIG.kiwi.health(wave);
    this.hp = this.maxHp;
    this.speed = CONFIG.kiwi.speed(wave) * rand(0.92, 1.08);
    this.progress = 0;
    this.offset = rand(-0.9, 0.9);
    this.phase = rand(0, 10);
    this.scale = 1.3 * (1 + (wave - 1) * 0.03);
    this.dead = false;

    Object.assign(this, makeKiwiModel(wave));
    this.group.scale.setScalar(this.scale);
    scene.add(this.group);

    // Health bar: a separate object so it can always face the camera.
    const mats = kiwiMaterials(wave);
    this.bar = new THREE.Group();
    addPart(this.bar, mats.barGeometry, mats.barBack);
    this.barFill = addPart(this.bar, mats.fillGeometry, new THREE.MeshBasicMaterial({ color: 0x40e040 }), -0.47, 0, 0.002);
    this.bar.traverse((o) => { o.renderOrder = 5; });
    this.bar.scale.setScalar(1.4);
    scene.add(this.bar);

    const start = pathPoint(0, this.offset);
    this.x = start.x;
    this.z = start.z;
    this.yaw = Math.atan2(-start.dx, -start.dz);
  }

  get centerY() {
    return 0.62 * this.scale;
  }

  get escaped() {
    return this.progress >= PATH.length;
  }

  update(dt) {
    this.progress += this.speed * dt;
    const target = pathPoint(this.progress, this.offset);
    // Ease towards the path point so corners are smooth.
    const ease = Math.min(1, dt * 8);
    this.x += (target.x - this.x) * ease;
    this.z += (target.z - this.z) * ease;
    const wantYaw = Math.atan2(-target.dx, -target.dz);
    this.yaw += Math.atan2(Math.sin(wantYaw - this.yaw), Math.cos(wantYaw - this.yaw)) * ease;

    this.phase += dt * this.speed * 3.5;
    const step = Math.sin(this.phase);
    this.legs[0].rotation.x = step * 0.7;
    this.legs[1].rotation.x = -step * 0.7;
    this.torso.rotation.z = step * 0.12;
    this.group.position.set(this.x, Math.abs(step) * 0.06, this.z);
    this.group.rotation.y = this.yaw;
  }

  // In tower view (xray) the bar shows through the canyon walls so you can always spot the kiwis.
  updateBar(camera, xray) {
    kiwiShared.barBack.depthTest = !xray;
    this.barFill.material.depthTest = !xray;
    this.bar.position.set(this.x, 1.3 * this.scale, this.z);
    this.bar.quaternion.copy(camera.quaternion);
    const fraction = Math.max(0, this.hp / this.maxHp);
    this.barFill.scale.x = Math.max(0.001, fraction);
    this.barFill.material.color.setHSL(0.33 * fraction, 0.85, 0.45);
  }

  // Spheres covering the body and head, used to check if a bullet hits.
  hitSpheres() {
    const s = this.scale;
    return [
      { x: this.x, y: 0.62 * s, z: this.z, r: 0.48 * s },
      { x: this.x - 0.48 * Math.sin(this.yaw) * s, y: 0.8 * s, z: this.z - 0.48 * Math.cos(this.yaw) * s, r: 0.24 * s },
    ];
  }

  remove() {
    this.scene.remove(this.group);
    this.scene.remove(this.bar);
    this.barFill.material.dispose();
  }
}
