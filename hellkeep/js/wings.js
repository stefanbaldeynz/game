// Angel wings: the prize for killing the devil. Double jump, then hold Space to fly.
// In first person you see them beating at the left and right edges of the screen.
// The pickup is a small glowing pair under a golden halo.

let featherMaterial = null;

function getFeatherMaterial() {
  if (!featherMaterial) {
    const texture = Textures.feather();
    featherMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      emissive: 0xfff0c8,
      emissiveMap: texture,
      emissiveIntensity: 0.12, // a soft heavenly glow (the bloom does the rest)
      alphaTest: 0.4,
      side: THREE.DoubleSide,
      roughness: 0.8,
    });
  }
  featherMaterial.envMapIntensity = 0.35;
  return featherMaterial;
}

// One wing, built from layers of feathers hanging off a curved leading edge.
// It spreads towards +x; mirror it with a negative x scale for the other side.
function buildWing() {
  const wing = new THREE.Group();
  const material = getFeatherMaterial();
  const edgeAt = (t) => [t * 1.35, Math.sin(t * Math.PI * 0.85) * 0.42 + t * 0.3];
  const layers = [
    { count: 8, from: 0.55, to: 1.0, len: [0.85, 1.2], width: 0.2, z: -0.03, fan: [0.35, 1.25] }, // long flight feathers at the tip
    { count: 9, from: 0.0, to: 0.62, len: [0.6, 0.85], width: 0.22, z: -0.015, fan: [0.0, 0.35] }, // the inner wing
    { count: 11, from: 0.0, to: 1.0, len: [0.3, 0.42], width: 0.18, z: 0.0, fan: [0.05, 0.8] }, // small feathers along the edge
  ];
  for (const layer of layers) {
    for (let i = 0; i < layer.count; i++) {
      const k = i / (layer.count - 1);
      const [x, y] = edgeAt(layer.from + (layer.to - layer.from) * k);
      const length = layer.len[0] + (layer.len[1] - layer.len[0]) * k;
      const geometry = new THREE.PlaneGeometry(layer.width, length).translate(0, -length / 2, 0);
      const feather = addPart(wing, geometry, material, x, y, layer.z);
      feather.rotation.z = layer.fan[0] + (layer.fan[1] - layer.fan[0]) * k; // fan out towards the tip
    }
  }
  return wing;
}

// The pickup: a little pair of wings with a halo floating above.
function buildWingsPickup() {
  const group = new THREE.Group();
  for (const side of [-1, 1]) {
    const wing = buildWing();
    wing.scale.set(side * 0.4, 0.4, 0.4);
    wing.position.x = side * 0.05;
    wing.rotation.y = side * -0.3;
    group.add(wing);
  }
  const halo = addPart(group, new THREE.TorusGeometry(0.18, 0.025, 8, 32), new THREE.MeshStandardMaterial({
    color: 0xffd860,
    emissive: 0xffc840,
    emissiveIntensity: 1.2,
    metalness: 0.8,
    roughness: 0.3,
  }), 0, 0.55, 0);
  halo.rotation.x = Math.PI / 2;
  return group;
}

// The pair you see in first person. Each wing is anchored just off the edge of the screen.
// The angle is how far the wing is raised: up high, it rises along the screen edge where you
// can see it; level, it sweeps out of view. Beating between the two looks like flapping.
// On the ground the wings fold down out of sight.
class FirstPersonWings {
  constructor(scene) {
    this.pivots = [-1, 1].map((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.9, -0.62, -0.95);
      const wing = buildWing();
      wing.scale.set(side * 0.5, 0.5, 0.5);
      pivot.add(wing);
      pivot.visible = false;
      scene.add(pivot);
      return { side, pivot };
    });
    this.phase = 0;
    this.base = -0.6;
    this.amplitude = 0.05;
    this.lastSwing = 0;
  }

  // Returns true at the bottom of each wingbeat (to play the flap sound).
  update(dt, { owned, airborne, flying }) {
    let base = -0.6; // folded down, out of sight
    let amplitude = 0.05;
    let speed = 2;
    if (flying) {
      base = 0.75; // beating between level (0.15) and raised high (1.35)
      amplitude = 0.6;
      speed = 17; // about 3 beats a second
    } else if (airborne) {
      base = 0.95; // held up, gliding
      amplitude = 0.1;
      speed = 5;
    }
    const ease = Math.min(1, dt * 6);
    this.base += (base - this.base) * ease;
    this.amplitude += (amplitude - this.amplitude) * ease;
    this.phase += dt * speed;
    const swing = Math.sin(this.phase);
    const angle = this.base + swing * this.amplitude;
    for (const { side, pivot } of this.pivots) {
      pivot.visible = owned;
      pivot.rotation.set(0, side * 0.2, side * angle); // swept a little forward so you can see them
    }
    const downstroke = flying && this.lastSwing > 0 && swing <= 0;
    this.lastSwing = swing;
    return downstroke;
  }
}
