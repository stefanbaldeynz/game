// A pool of glowing particles drawn in one go. Used for fire, sparks and embers.
// Each particle fades from white-hot through orange and red (fire) or cyan and blue (frost) to nothing.

class ParticleSystem {
  constructor(scene, { max, size, texture, damping = 0.98, palette = 'fire' }) {
    this.frost = palette === 'frost';
    this.max = max;
    this.damping = damping;
    this.next = 0;
    this.positions = new Float32Array(max * 3);
    this.colors = new Float32Array(max * 3);
    this.velocities = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.gravity = new Float32Array(max);
    for (let i = 0; i < max; i++) this.positions[i * 3 + 1] = -1000; // parked out of sight

    const geometry = new THREE.BufferGeometry();
    this.positionAttr = new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage);
    this.colorAttr = new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', this.positionAttr);
    geometry.setAttribute('color', this.colorAttr);
    const material = new THREE.PointsMaterial({
      size,
      map: texture,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  // gravity > 0 makes a particle rise faster over time (flames), < 0 makes it fall (sparks).
  emit(x, y, z, vx, vy, vz, life, gravity = 0) {
    const i = this.next;
    this.next = (i + 1) % this.max;
    const k = i * 3;
    this.positions[k] = x;
    this.positions[k + 1] = y;
    this.positions[k + 2] = z;
    this.velocities[k] = vx;
    this.velocities[k + 1] = vy;
    this.velocities[k + 2] = vz;
    this.life[i] = life;
    this.maxLife[i] = life;
    this.gravity[i] = gravity;
  }

  update(dt) {
    const damp = Math.pow(this.damping, dt * 60);
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      const k = i * 3;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.positions[k + 1] = -1000;
        this.colors[k] = this.colors[k + 1] = this.colors[k + 2] = 0;
        continue;
      }
      this.velocities[k + 1] += this.gravity[i] * dt;
      this.velocities[k] *= damp;
      this.velocities[k + 1] *= damp;
      this.velocities[k + 2] *= damp;
      this.positions[k] += this.velocities[k] * dt;
      this.positions[k + 1] += this.velocities[k + 1] * dt;
      this.positions[k + 2] += this.velocities[k + 2] * dt;

      const age = 1 - this.life[i] / this.maxLife[i];
      const fade = 1 - age;
      if (this.frost) {
        this.colors[k] = Math.max(0, 0.8 - age * 1.4) * fade;
        this.colors[k + 1] = Math.max(0, 0.95 - age * 0.7) * fade;
        this.colors[k + 2] = fade;
      } else {
        this.colors[k] = fade;
        this.colors[k + 1] = Math.max(0, 0.85 - age * 1.1) * fade;
        this.colors[k + 2] = Math.max(0, 0.45 - age * 1.8) * fade;
      }
    }
    this.positionAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
  }
}
