// A pool of particles drawn in one go. Used for fire, sparks, embers and smoke.
// Fire fades from white-hot through orange and red (or cyan and blue for frost) to nothing.
// Smoke (palette 'smoke' or 'mist') is soft and see-through instead of glowing.

class ParticleSystem {
  constructor(scene, { max, size, texture, damping = 0.98, palette = 'fire' }) {
    this.frost = palette === 'frost';
    this.smoke = palette === 'smoke' || palette === 'mist';
    this.smokeColor = palette === 'mist' ? [0.55, 0.65, 0.75] : [0.07, 0.05, 0.05];
    this.max = max;
    this.damping = damping;
    this.next = 0;
    this.positions = new Float32Array(max * 3);
    this.stride = this.smoke ? 4 : 3; // smoke colours carry their own see-through amount
    this.colors = new Float32Array(max * this.stride);
    this.velocities = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.gravity = new Float32Array(max);
    for (let i = 0; i < max; i++) this.positions[i * 3 + 1] = -1000; // parked out of sight

    const geometry = new THREE.BufferGeometry();
    this.positionAttr = new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage);
    this.colorAttr = new THREE.BufferAttribute(this.colors, this.stride).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', this.positionAttr);
    geometry.setAttribute('color', this.colorAttr);
    const material = new THREE.PointsMaterial({
      size,
      map: texture,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: this.smoke ? THREE.NormalBlending : THREE.AdditiveBlending,
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
      const c = i * this.stride;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.positions[k + 1] = -1000;
        this.colors.fill(0, c, c + this.stride);
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
      if (this.smoke) {
        // Thickens quickly, then thins out as it drifts up.
        this.colors[c] = this.smokeColor[0];
        this.colors[c + 1] = this.smokeColor[1];
        this.colors[c + 2] = this.smokeColor[2];
        this.colors[c + 3] = Math.min(1, age * 6) * fade * 0.32;
      } else if (this.frost) {
        this.colors[c] = Math.max(0, 0.8 - age * 1.4) * fade;
        this.colors[c + 1] = Math.max(0, 0.95 - age * 0.7) * fade;
        this.colors[c + 2] = fade;
      } else {
        this.colors[c] = fade;
        this.colors[c + 1] = Math.max(0, 0.85 - age * 1.1) * fade;
        this.colors[c + 2] = Math.max(0, 0.45 - age * 1.8) * fade;
      }
    }
    this.positionAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
  }
}
