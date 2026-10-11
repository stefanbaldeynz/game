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
    name: 'Shotgun',
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

function gunMetal(color) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.75, roughness: 0.35 });
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

function buildShotgun() {
  const group = new THREE.Group();
  const steel = gunMetal(0x2e3034);
  const wood = gunWood();
  addPart(group, tube(0.022, 0.7), steel, 0, 0.045, -0.37);  // barrel
  addPart(group, tube(0.018, 0.55), steel, 0, 0, -0.3);      // magazine tube
  const pump = addPart(group, tube(0.038, 0.2), wood, 0, 0, -0.36);
  addPart(group, new THREE.BoxGeometry(0.07, 0.1, 0.24), steel, 0, 0.02, 0.06);       // receiver
  addPart(group, new THREE.BoxGeometry(0.055, 0.12, 0.3), wood, 0, -0.04, 0.32).rotation.x = 0.15; // stock
  addPart(group, new THREE.BoxGeometry(0.012, 0.018, 0.02), steel, 0, 0.075, -0.69); // bead sight
  return {
    group,
    muzzle: new THREE.Vector3(0, 0.045, -0.74),
    base: new THREE.Vector3(0.2, -0.22, -0.58),
    pump,
    pumpZ: -0.36,
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
