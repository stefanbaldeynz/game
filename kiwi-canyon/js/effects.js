// Visual effects: particles (feathers, dust, sparks), floating "+$1" text and bullet tracers.

// A pool of particles drawn in one go. Each particle has its own colour, size and fade.
class Particles {
  constructor(scene, { max, texture, additive = false }) {
    this.max = max;
    this.next = 0;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.alpha = new Float32Array(max);
    this.size = new Float32Array(max);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.gravity = new Float32Array(max);
    for (let i = 0; i < max; i++) this.pos[i * 3 + 1] = -1000;

    const geometry = new THREE.BufferGeometry();
    this.attributes = {
      position: new THREE.BufferAttribute(this.pos, 3),
      pcolor: new THREE.BufferAttribute(this.col, 3),
      alpha: new THREE.BufferAttribute(this.alpha, 1),
      size: new THREE.BufferAttribute(this.size, 1),
    };
    for (const [name, attribute] of Object.entries(this.attributes)) {
      attribute.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute(name, attribute);
    }
    this.material = new THREE.ShaderMaterial({
      uniforms: { map: { value: texture }, pointScale: { value: 500 } },
      vertexShader: `
        attribute vec3 pcolor;
        attribute float alpha;
        attribute float size;
        uniform float pointScale;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = pcolor;
          vAlpha = alpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pointScale / max(0.1, -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D map;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(map, gl_PointCoord);
          float a = tex.a * vAlpha;
          if (a < 0.02) discard;
          gl_FragColor = vec4(vColor * tex.rgb, a);
        }`,
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  emit({ x, y, z, vx = 0, vy = 0, vz = 0, life = 1, size = 0.3, color = [1, 1, 1], gravity = 0 }) {
    const i = this.next;
    this.next = (i + 1) % this.max;
    const k = i * 3;
    this.pos[k] = x;
    this.pos[k + 1] = y;
    this.pos[k + 2] = z;
    this.vel[k] = vx;
    this.vel[k + 1] = vy;
    this.vel[k + 2] = vz;
    this.col[k] = color[0];
    this.col[k + 1] = color[1];
    this.col[k + 2] = color[2];
    this.size[i] = size;
    this.life[i] = life;
    this.maxLife[i] = life;
    this.gravity[i] = gravity;
  }

  // Scale points to the camera so particle sizes are in world units.
  setCamera(camera, renderer) {
    const height = renderer.domElement.height;
    this.material.uniforms.pointScale.value = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  }

  update(dt) {
    const drag = Math.pow(0.97, dt * 60);
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      const k = i * 3;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.pos[k + 1] = -1000;
        this.alpha[i] = 0;
        continue;
      }
      this.vel[k + 1] += this.gravity[i] * dt;
      this.vel[k] *= drag;
      this.vel[k + 1] *= drag;
      this.vel[k + 2] *= drag;
      this.pos[k] += this.vel[k] * dt;
      this.pos[k + 1] = Math.max(0.02, this.pos[k + 1] + this.vel[k + 1] * dt);
      this.pos[k + 2] += this.vel[k + 2] * dt;
      this.alpha[i] = Math.min(1, (this.life[i] / this.maxLife[i]) * 2);
    }
    for (const attribute of Object.values(this.attributes)) attribute.needsUpdate = true;
  }
}

// Text that floats up from a spot in the world, like "+$1".
const floaters = [];

function floatText(text, position, color = '#ffd84a') {
  const el = document.createElement('div');
  el.className = 'floater';
  el.textContent = text;
  el.style.color = color;
  document.getElementById('floaters').appendChild(el);
  floaters.push({ el, pos: position.clone(), life: 1.1 });
}

function updateFloaters(dt, camera) {
  const v = new THREE.Vector3();
  for (const f of floaters) {
    f.life -= dt;
    f.pos.y += dt * 1.5;
    v.copy(f.pos).project(camera);
    const visible = v.z < 1 && f.life > 0;
    f.el.style.display = visible ? 'block' : 'none';
    if (visible) {
      const x = (v.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
      f.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      f.el.style.opacity = Math.min(1, f.life * 2);
    }
    if (f.life <= 0) f.el.remove();
  }
  for (let i = floaters.length - 1; i >= 0; i--) if (floaters[i].life <= 0) floaters.splice(i, 1);
}

// A brief streak of light from the gun to where the bullet landed.
class Tracer {
  constructor(scene) {
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.8 }));
    this.line.frustumCulled = false;
    this.line.visible = false;
    this.timer = 0;
    scene.add(this.line);
  }

  show(from, to) {
    const p = this.line.geometry.attributes.position;
    p.setXYZ(0, from.x, from.y, from.z);
    p.setXYZ(1, to.x, to.y, to.z);
    p.needsUpdate = true;
    this.line.visible = true;
    this.timer = 0.05;
  }

  update(dt) {
    this.timer -= dt;
    this.line.visible = this.timer > 0;
  }
}
