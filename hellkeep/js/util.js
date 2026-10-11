// Small helpers shared by every other script.

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// Roughly bell-shaped random number between -1 and 1 (most values near 0).
function spreadRandom() {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
}

function addPart(parent, geometry, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
