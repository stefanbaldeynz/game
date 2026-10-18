// The beasts that march through the gorge: hellhounds, ice elephants and devils.
// They use the same models as the other rounds (hounds.js, elephants.js, devil.js), but
// here they just follow the path to the keep, walking, burning and dying in style.

let siegeBars = null;

// Per type: how big, where to hit it, how its flames look.
const BEAST_SHAPES = {
  hound: { centerY: 0.85, barY: 2.0, spheres: [[0, 0.8, 0.1, 0.6], [0, 1.05, -0.9, 0.42]], flames: 'fire' },
  elephant: { centerY: 1.8, barY: 3.9, spheres: [[0, 1.8, 0.3, 1.35], [0, 2.2, -1.4, 0.95]], flames: 'frost' },
  devil: { centerY: 1.9, barY: 4.4, spheres: [[0, 1.1, 0, 0.6], [0, 2.3, 0, 0.7], [0, 3.1, 0, 0.45]], flames: 'fire' },
};

class SiegeBeast {
  constructor(scene, wave, effects) {
    this.scene = scene;
    this.type = wave.type;
    this.wave = wave;
    this.effects = effects;
    this.shape = BEAST_SHAPES[this.type];
    this.maxHp = wave.hp;
    this.hp = wave.hp;
    this.speed = wave.speed * rand(0.92, 1.08);
    this.progress = 0;
    this.offset = rand(-0.8, 0.8);
    this.phase = rand(0, 10);
    this.seed = rand(0, 10);
    this.flash = 0;
    this.dead = false;   // can't be targeted any more
    this.dyingT = -1;    // playing its death; gone after a moment
    this.gone = false;
    this.flameAcc = 0;

    if (this.type === 'hound') {
      Object.assign(this, houndTemplate ? makeGltfHound() : makeHoundModel());
      if (this.mixer) {
        this.actions.run.play();
        this.actions.run.setEffectiveTimeScale((this.speed / HOUND_SPEED) * 1.25);
        this.mixer.update(rand(0, 1));
      }
    } else if (this.type === 'elephant') {
      Object.assign(this, elephantTemplate ? makeRiggedElephant() : makeElephantModel());
      this.group.scale.multiplyScalar(0.85);
    } else {
      Object.assign(this, makeDevilModel());
      this.devilPose();
    }
    this.group.traverse((o) => {
      if (o.isMesh && !o.material.transparent) o.castShadow = o.receiveShadow = true;
    });
    scene.add(this.group);

    // A health bar that always faces the camera.
    if (!siegeBars) {
      siegeBars = {
        back: new THREE.MeshBasicMaterial({ color: 0x1a0505 }),
        backGeometry: new THREE.PlaneGeometry(1.0, 0.16),
        fillGeometry: new THREE.PlaneGeometry(0.94, 0.1).translate(0.47, 0, 0),
      };
    }
    this.bar = new THREE.Group();
    addPart(this.bar, siegeBars.backGeometry, siegeBars.back);
    this.barFill = addPart(this.bar, siegeBars.fillGeometry, new THREE.MeshBasicMaterial({ color: 0x40e040 }), -0.47, 0, 0.002);
    this.bar.traverse((o) => { o.renderOrder = 5; });
    this.bar.scale.setScalar(this.type === 'hound' ? 1.6 : 2.4);
    scene.add(this.bar);

    const start = pathPoint(0, this.offset);
    this.x = start.x;
    this.z = start.z;
    this.yaw = Math.atan2(-start.dx, -start.dz);
  }

  // The devil marches with his Flying V held ready.
  devilPose() {
    const [fret, strum] = this.arms;
    fret.shoulder.rotation.set(1.0, 0, 0.35);
    fret.elbow.rotation.set(1.1, 0, 0);
    strum.shoulder.rotation.set(0.55, 0, -0.45);
    strum.elbow.rotation.set(0.85, 0, 0);
    this.guitar.rotation.set(0, 0.1, 0.9);
  }

  get centerY() {
    return this.shape.centerY;
  }

  get escaped() {
    return this.progress >= SIEGE_PATH.length;
  }

  // Turn a point on the beast's body into a world position.
  toWorld(lx, ly, lz) {
    const c = Math.cos(this.yaw);
    const s = Math.sin(this.yaw);
    return { x: this.x + lx * c + lz * s, y: ly, z: this.z - lx * s + lz * c };
  }

  hitSpheres() {
    return this.shape.spheres.map(([lx, ly, lz, r]) => ({ ...this.toWorld(lx, ly, lz), r }));
  }

  hit(amount) {
    this.hp -= amount;
    this.flash = 0.12;
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      this.dyingT = 0;
      this.scene.remove(this.bar);
      if (this.mixer && this.actions.death) {
        this.actions.run.fadeOut(0.1);
        this.actions.death.reset().setLoop(THREE.LoopOnce, 1).play();
        this.actions.death.clampWhenFinished = true;
      }
      const center = this.toWorld(0, this.centerY, 0);
      const system = this.shape.flames === 'frost' ? this.effects.frost : this.effects.fire;
      for (let i = 0; i < (this.type === 'hound' ? 40 : 90); i++) {
        system.emit(center.x + rand(-1, 1), center.y + rand(-0.6, 0.6), center.z + rand(-1, 1), rand(-3, 3), rand(0, 4), rand(-3, 3), rand(0.4, 1), 1);
      }
      return true;
    }
    return false;
  }

  update(dt, t) {
    if (this.dyingT >= 0) {
      this.updateDeath(dt);
      return;
    }
    this.progress += this.speed * dt;
    const target = pathPoint(this.progress, this.offset);
    const ease = Math.min(1, dt * 8);
    this.x += (target.x - this.x) * ease;
    this.z += (target.z - this.z) * ease;
    const wantYaw = Math.atan2(-target.dx, -target.dz);
    this.yaw += Math.atan2(Math.sin(wantYaw - this.yaw), Math.cos(wantYaw - this.yaw)) * ease;
    this.phase += dt * this.speed * (this.type === 'hound' ? 2.5 : 1.6);
    this.flash = Math.max(0, this.flash - dt);
    const glow = 0.9 + Math.sin(t * 9 + this.seed) * 0.2 + this.flash * 15;
    let bob = 0;

    if (this.type === 'hound') {
      if (this.mixer) this.mixer.update(dt);
      else {
        const swing = Math.sin(this.phase * 3) * 0.9;
        this.legs.forEach((leg, i) => (leg.rotation.x = i % 3 ? -swing : swing));
      }
    } else if (this.type === 'elephant') {
      const swing = Math.sin(this.phase) * 0.45;
      this.legs[0].rotation.x = this.legs[3].rotation.x = swing;
      this.legs[1].rotation.x = this.legs[2].rotation.x = -swing;
      this.trunk.forEach((joint, i) => {
        joint.rotation.x = (i === 0 && !this.rigged ? 0.35 : 0) + Math.sin(t * 1.6 + this.seed + i * 0.6) * 0.14;
      });
      this.ears.forEach((ear, i) => (ear.rotation.y = (i ? -1 : 1) * Math.sin(t * 2 + this.seed) * 0.25));
      bob = Math.abs(Math.sin(this.phase)) * 0.06;
    } else {
      // Stomping along, headbanging, strumming as he goes.
      const swing = Math.sin(this.phase) * 0.5;
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.arms[1].elbow.rotation.x = 0.85 + Math.sin(t * 14 + this.seed) * 0.15;
      this.head.rotation.x = Math.max(0, Math.sin(t * 7 + this.seed)) * 0.3;
      bob = Math.abs(Math.sin(this.phase)) * 0.08;
    }
    this.skin.emissiveIntensity = glow;
    if (this.skinLight) this.skinLight.emissiveIntensity = glow;
    this.group.position.set(this.x, bob, this.z);
    this.group.rotation.y = this.yaw;
    this.emitFlames(dt);
  }

  emitFlames(dt) {
    const system = this.shape.flames === 'frost' ? this.effects.frost : this.effects.fire;
    this.flameAcc += dt * (this.type === 'hound' ? 40 : 60);
    while (this.flameAcc >= 1) {
      this.flameAcc -= 1;
      const p = this.type === 'hound'
        ? this.toWorld(rand(-0.25, 0.25), rand(1.0, 1.3), rand(-1.0, 0.7))
        : this.type === 'elephant'
          ? this.toWorld(rand(-0.6, 0.6), rand(2.6, 2.9), rand(-1.2, 1.2))
          : this.toWorld(rand(-0.5, 0.5), rand(3.2, 3.8), rand(-0.3, 0.3));
      system.emit(p.x, p.y, p.z, rand(-0.3, 0.3), rand(0.8, 1.8), rand(-0.3, 0.3), rand(0.3, 0.6), 2);
    }
  }

  // Hounds play their death; elephants topple; devils fall back. Then they sink away.
  updateDeath(dt) {
    this.dyingT += dt;
    if (this.mixer) this.mixer.update(dt);
    const k = Math.min(1, this.dyingT * 2);
    if (this.type === 'elephant') this.group.rotation.z = k * (Math.PI / 2) * 0.9;
    else if (this.type === 'devil') {
      this.group.rotation.x = -k * (Math.PI / 2) * 0.95;
      this.group.position.y = k * 0.4;
    }
    if (this.dyingT > 1.4) this.group.position.y -= dt * 1.5;
    this.skin.emissiveIntensity = Math.max(0, 1 - this.dyingT);
    if (this.dyingT > 2.6) this.remove();
  }

  // In tower view the bar shows through the gorge walls, so you can always spot them.
  updateBar(camera, xray) {
    if (this.dead) return;
    siegeBars.back.depthTest = !xray;
    this.barFill.material.depthTest = !xray;
    this.bar.position.set(this.x, this.shape.barY, this.z);
    this.bar.quaternion.copy(camera.quaternion);
    const fraction = Math.max(0, this.hp / this.maxHp);
    this.barFill.scale.x = Math.max(0.001, fraction);
    this.barFill.material.color.setHSL(0.33 * fraction, 0.85, 0.45);
  }

  remove() {
    if (this.gone) return;
    this.gone = true;
    this.scene.remove(this.group);
    this.scene.remove(this.bar);
    this.barFill.material.dispose();
  }
}
