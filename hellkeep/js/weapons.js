// The three guns: stats, plus the 3D models you see in your hands.
// Tweak the numbers here to change how each gun feels.

const WEAPONS = {
  pistol: {
    name: 'Pistol',
    ammo: 'bullets',
    damage: 24,     // per bullet (a hellhound has 60 health)
    pellets: 1,     // bullets per shot
    spread: 0.008,  // inaccuracy
    cooldown: 0.32, // seconds between shots
    auto: false,    // true = hold the mouse button to keep firing
    kick: 0.5,      // recoil
    sound: 'pistol',
  },
  shotgun: {
    name: 'Flak Shotgun',
    ammo: 'shells',
    damage: 11,
    pellets: 9,
    spread: 0.075,
    cooldown: 0.9,
    auto: false,
    kick: 1.0,
    sound: 'shotgun',
  },
  rifle: {
    name: 'Rifle',
    ammo: 'bullets',
    damage: 15,
    pellets: 1,
    spread: 0.02,
    cooldown: 0.09,
    auto: true,
    kick: 0.25,
    sound: 'rifle',
  },
};

const WEAPON_ORDER = ['pistol', 'shotgun', 'rifle'];

// Brushed and scratched: the streaks catch the light as the gun moves.
let metalTextures = null;
function gunMetal(color) {
  if (!metalTextures) {
    const brushed = Textures.brushedMetal();
    brushed.colorSpace = THREE.NoColorSpace; // data, not colour
    brushed.repeat.set(2, 2);
    metalTextures = { roughness: brushed, normal: normalMapFor(brushed, 1.2) };
  }
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.85,
    roughness: 0.55, // scaled by the brushed streaks
    roughnessMap: metalTextures.roughness,
    normalMap: metalTextures.normal,
    normalScale: new THREE.Vector2(0.4, 0.4),
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
  });
}

function gunWood() {
  return new THREE.MeshStandardMaterial({ color: 0x5b2f17, roughness: 0.65, metalness: 0.05 });
}

// A cylinder lying along the barrel direction (-z).
function tube(radius, length) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 12);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

// Each builder returns the model, where the muzzle is, and where the gun sits in view.
function buildPistol() {
  const group = new THREE.Group();
  const steel = gunMetal(0x3a3d42);
  const dark = gunMetal(0x1a1b1e);
  const grip = new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.8 });
  addPart(group, new THREE.BoxGeometry(0.06, 0.06, 0.28), steel, 0, 0.035, -0.06); // slide
  addPart(group, new THREE.BoxGeometry(0.055, 0.04, 0.24), dark, 0, -0.01, -0.05); // frame
  addPart(group, new THREE.BoxGeometry(0.052, 0.15, 0.075), grip, 0, -0.09, 0.05).rotation.x = -0.25;
  addPart(group, tube(0.012, 0.03), dark, 0, 0.035, -0.21);
  addPart(group, new THREE.BoxGeometry(0.012, 0.02, 0.02), dark, 0, 0.075, -0.18); // front sight
  addPart(group, new THREE.BoxGeometry(0.04, 0.02, 0.02), dark, 0, 0.075, 0.06);   // rear sight
  return { group, muzzle: new THREE.Vector3(0, 0.035, -0.24), base: new THREE.Vector3(0.15, -0.16, -0.4) };
}

let flakTextures = null;

// The Flak Shotgun: four chrome barrels, glazed Delft-blue porcelain, gold bands,
// engraved silver, a scope and glowing cyan energy cells.
function buildShotgun() {
  if (!flakTextures) {
    flakTextures = { porcelain: Textures.porcelain(), engraving: Textures.engraving(), label: Textures.flakLabel() };
  }
  const chrome = new THREE.MeshStandardMaterial({ color: 0xe0e3e8, metalness: 1, roughness: 0.08, envMapIntensity: 0.8 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8ac48, metalness: 1, roughness: 0.25 });
  const porcelain = new THREE.MeshPhysicalMaterial({
    map: flakTextures.porcelain,
    color: 0xb8bec8,       // tones the white down so the blue painting survives the bloom
    envMapIntensity: 0.35,
    roughness: 0.2,
    clearcoat: 0.6,        // the shiny glaze
    clearcoatRoughness: 0.05,
  });
  const engraved = new THREE.MeshStandardMaterial({
    map: flakTextures.engraving,
    normalMap: flakTextures.engravingNormal || (flakTextures.engravingNormal = normalMapFor(flakTextures.engraving, 3)),
    metalness: 1,
    roughness: 0.3,
  });
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7ff6ff).multiplyScalar(2.5) }); // brighter than white, so it blooms
  const dark = new THREE.MeshBasicMaterial({ color: 0x050505 });
  const label = new THREE.MeshBasicMaterial({ map: flakTextures.label, transparent: true });
  const group = new THREE.Group();

  // Four chrome barrels in a 2x2 cluster, sleeved in porcelain at the back.
  for (const [x, y] of [[-0.037, 0.087], [0.037, 0.087], [-0.037, 0.013], [0.037, 0.013]]) {
    addPart(group, tube(0.033, 0.46), chrome, x, y, -0.55);
    addPart(group, tube(0.038, 0.03), chrome, x, y, -0.77); // muzzle rim
    const bore = addPart(group, new THREE.CircleGeometry(0.026, 16), dark, x, y, -0.786);
    bore.rotation.y = Math.PI;
    addPart(group, tube(0.039, 0.24), porcelain, x, y, -0.2);
  }
  for (const z of [-0.33, -0.08]) addPart(group, tube(0.088, 0.02), gold, 0, 0.05, z);

  // Glowing energy cells along both sides, capped in chrome.
  for (const side of [-1, 1]) {
    addPart(group, tube(0.013, 0.2), glow, side * 0.08, 0.05, -0.2);
    addPart(group, tube(0.018, 0.02), chrome, side * 0.08, 0.05, -0.31);
    addPart(group, tube(0.018, 0.02), chrome, side * 0.08, 0.05, -0.09);
  }

  // Chrome drum, then a porcelain receiver with engraved silver side plates and a hammer.
  addPart(group, tube(0.07, 0.1), chrome, 0, 0.05, -0.02);
  addPart(group, new THREE.BoxGeometry(0.1, 0.13, 0.2), porcelain, 0, 0.03, 0.12);
  for (const side of [-1, 1]) {
    const plate = addPart(group, new THREE.PlaneGeometry(0.17, 0.1), engraved, side * 0.0505, 0.03, 0.12);
    plate.rotation.y = side * Math.PI / 2;
  }
  addPart(group, new THREE.BoxGeometry(0.02, 0.05, 0.03), chrome, 0, 0.12, 0.2).rotation.x = -0.4;

  // Scope with a glowing cyan lens, on gold mounts.
  addPart(group, tube(0.024, 0.26), chrome, 0, 0.17, -0.06);
  addPart(group, tube(0.027, 0.12), porcelain, 0, 0.17, -0.06);
  addPart(group, tube(0.032, 0.03), chrome, 0, 0.17, -0.2);
  const lens = addPart(group, new THREE.CircleGeometry(0.024, 16), glow, 0, 0.17, -0.216);
  lens.rotation.y = Math.PI;
  for (const z of [-0.12, 0.02]) addPart(group, new THREE.BoxGeometry(0.02, 0.05, 0.02), gold, 0, 0.135, z);

  // Trigger guard and trigger.
  const guard = addPart(group, new THREE.TorusGeometry(0.04, 0.007, 8, 20, Math.PI), chrome, 0, -0.04, 0.14);
  guard.rotation.set(0, Math.PI / 2, Math.PI);
  addPart(group, new THREE.BoxGeometry(0.008, 0.035, 0.012), chrome, 0, -0.035, 0.13);

  // Front grip angled down under the barrels: label, gauge, glowing window, chrome end plate.
  const fore = new THREE.Group();
  fore.position.set(0, -0.03, -0.3);
  fore.rotation.x = 0.5;
  group.add(fore);
  addPart(fore, new THREE.BoxGeometry(0.07, 0.3, 0.1), porcelain, 0, -0.15, 0);
  addPart(fore, new THREE.BoxGeometry(0.075, 0.02, 0.105), chrome, 0, -0.31, 0);
  addPart(fore, new THREE.BoxGeometry(0.072, 0.06, 0.03), glow, 0, -0.22, 0.035);
  for (const side of [-1, 1]) {
    const text = addPart(fore, new THREE.PlaneGeometry(0.24, 0.045), label, side * 0.0355, -0.15, -0.02);
    text.rotation.set(0, side * Math.PI / 2, Math.PI / 2);
    const gauge = addPart(fore, new THREE.CircleGeometry(0.018, 16), glow, side * 0.0356, -0.05, 0.02);
    gauge.rotation.y = side * Math.PI / 2;
    const ring = addPart(fore, new THREE.TorusGeometry(0.02, 0.004, 6, 20), gold, side * 0.0358, -0.05, 0.02);
    ring.rotation.y = side * Math.PI / 2;
  }

  // Stock with a glowing window and a chrome butt plate.
  const stock = new THREE.Group();
  stock.position.set(0, 0, 0.22);
  stock.rotation.x = 0.12;
  group.add(stock);
  addPart(stock, new THREE.BoxGeometry(0.07, 0.12, 0.34), porcelain, 0, -0.02, 0.17);
  addPart(stock, new THREE.BoxGeometry(0.074, 0.05, 0.12), glow, 0, -0.02, 0.2);
  addPart(stock, new THREE.BoxGeometry(0.075, 0.13, 0.02), chrome, 0, -0.02, 0.345);

  return {
    group,
    muzzle: new THREE.Vector3(0, 0.05, -0.8),
    base: new THREE.Vector3(0.22, -0.25, -0.58),
  };
}

function buildRifle() {
  const group = new THREE.Group();
  const steel = gunMetal(0x2a2d30);
  const dark = gunMetal(0x16171a);
  const polymer = new THREE.MeshStandardMaterial({ color: 0x24201c, roughness: 0.8 });
  addPart(group, new THREE.BoxGeometry(0.065, 0.1, 0.38), steel, 0, 0.02, 0);         // receiver
  addPart(group, new THREE.BoxGeometry(0.075, 0.08, 0.26), polymer, 0, 0.025, -0.3);  // handguard
  addPart(group, tube(0.014, 0.26), dark, 0, 0.035, -0.55);                            // barrel
  addPart(group, tube(0.022, 0.06), dark, 0, 0.035, -0.69);                            // flash hider
  addPart(group, new THREE.BoxGeometry(0.045, 0.17, 0.075), dark, 0, -0.1, -0.08).rotation.x = 0.25; // magazine
  addPart(group, new THREE.BoxGeometry(0.05, 0.12, 0.06), polymer, 0, -0.08, 0.12).rotation.x = -0.3; // grip
  addPart(group, new THREE.BoxGeometry(0.055, 0.09, 0.28), polymer, 0, 0, 0.33);       // stock
  addPart(group, new THREE.BoxGeometry(0.035, 0.045, 0.1), dark, 0, 0.095, -0.02);     // sight
  addPart(group, new THREE.BoxGeometry(0.008, 0.008, 0.004), new THREE.MeshBasicMaterial({ color: 0xff3020 }), 0, 0.1, 0.031);
  return { group, muzzle: new THREE.Vector3(0, 0.035, -0.73), base: new THREE.Vector3(0.2, -0.21, -0.56) };
}

const WEAPON_BUILDERS = { pistol: buildPistol, shotgun: buildShotgun, rifle: buildRifle };
