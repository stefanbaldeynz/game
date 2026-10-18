// The hell gorge for round 5: the map turned into 3D, collision on the gorge floor, and
// the path the beasts walk from the hellgate to the gate of the keep.

const SIEGE_W = SIEGE_MAP[0].length;
const SIEGE_H = SIEGE_MAP.length;
const WORLD_W = SIEGE_W * SIEGE_CELL;
const WORLD_D = SIEGE_H * SIEGE_CELL;

function siegeCellAt(col, row) {
  if (row < 0 || row >= SIEGE_H || col < 0 || col >= SIEGE_W) return 'X';
  return SIEGE_MAP[row][col];
}

function isGorgeCell(col, row) {
  const ch = siegeCellAt(col, row);
  return ch === '=' || ch === 'S' || ch === 'E';
}

function isBuildable(col, row) {
  return siegeCellAt(col, row) === '.';
}

function siegeCellOf(v) {
  return Math.floor(v / SIEGE_CELL);
}

function siegeCellCenter(col, row) {
  return { x: col * SIEGE_CELL + SIEGE_CELL / 2, z: row * SIEGE_CELL + SIEGE_CELL / 2 };
}

function isGorgeAt(x, z) {
  return isGorgeCell(siegeCellOf(x), siegeCellOf(z));
}

function gorgeBlocked(x, z, radius) {
  for (const [ox, oz] of [[-radius, -radius], [radius, -radius], [-radius, radius], [radius, radius]]) {
    if (!isGorgeAt(x + ox, z + oz)) return true;
  }
  return false;
}

// Move one axis at a time so you slide along the walls instead of sticking to them.
function moveInGorge(entity, dx, dz, radius) {
  if (!gorgeBlocked(entity.x + dx, entity.z, radius)) entity.x += dx;
  if (!gorgeBlocked(entity.x, entity.z + dz, radius)) entity.z += dz;
}

// ---------- The path ----------
// Follow the gorge from S to E, then a little way into the gates at each end.

const SIEGE_PATH = (() => {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let start = null;
  for (let row = 0; row < SIEGE_H; row++) {
    for (let col = 0; col < SIEGE_W; col++) if (SIEGE_MAP[row][col] === 'S') start = [col, row];
  }
  const cells = [start];
  const seen = new Set([start.join()]);
  let current = start;
  while (siegeCellAt(...current) !== 'E') {
    const next = dirs
      .map(([dc, dr]) => [current[0] + dc, current[1] + dr])
      .find(([c, r]) => isGorgeCell(c, r) && !seen.has(`${c},${r}`));
    if (!next) break;
    seen.add(next.join());
    cells.push(next);
    current = next;
  }
  const end = current;
  const outward = ([col, row]) => dirs.find(([dc, dr]) => siegeCellAt(col + dc, row + dr) === 'X') || [0, 0];
  const startOut = outward(start);
  const endOut = outward(end);
  const points = cells.map(([c, r]) => siegeCellCenter(c, r));
  points.unshift({ x: points[0].x + startOut[0] * SIEGE_CELL * 0.9, z: points[0].z + startOut[1] * SIEGE_CELL * 0.9 });
  const last = points[points.length - 1];
  points.push({ x: last.x + endOut[0] * SIEGE_CELL * 0.9, z: last.z + endOut[1] * SIEGE_CELL * 0.9 });
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z));
  }
  return { points, lengths, length: lengths[lengths.length - 1], start, end, startOut, endOut };
})();

// Where a beast is after walking `distance` along the path, shifted sideways by `offset`.
function pathPoint(distance, offset = 0) {
  const { points, lengths } = SIEGE_PATH;
  let i = 1;
  while (i < points.length - 1 && lengths[i] < distance) i++;
  const a = points[i - 1];
  const b = points[i];
  const segment = lengths[i] - lengths[i - 1];
  const t = clamp((distance - lengths[i - 1]) / segment, 0, 1);
  const dx = (b.x - a.x) / segment;
  const dz = (b.z - a.z) / segment;
  return { x: a.x + (b.x - a.x) * t - dz * offset, z: a.z + (b.z - a.z) * t + dx * offset, dx, dz };
}

// ---------- Building the world ----------

// A surface with depth (normal map) and, for rock and ground, glowing lava seams.
function hellSurface(texture, { roughness = 0.9, normal = 3, glow = true, tint = 0xffffff } = {}) {
  const material = new THREE.MeshStandardMaterial({ map: texture, color: tint, normalMap: normalMapFor(texture, normal), roughness });
  const glowMap = glow ? glowMapFor(texture) : null;
  if (glowMap) {
    material.emissive = new THREE.Color(0xffffff);
    material.emissiveMap = glowMap;
    material.emissiveIntensity = 1.8;
  }
  return material;
}

function buildSiegeWorld(scene) {
  const world = { fires: [], gate: null, portal: null };
  const wallMaterial = hellSurface(Textures.rock(), { normal: 4, roughness: 0.95 });
  const rimMaterial = hellSurface(Textures.ground(1, 1), { normal: 3.5, tint: 0x8a7a72 });

  const rim = new THREE.Mesh(buildRimGeometry(), [rimMaterial, wallMaterial]);
  rim.castShadow = rim.receiveShadow = true;
  scene.add(rim);

  // The gorge floor: cracked black rock, glowing where the lava shows through.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_W, WORLD_D),
    hellSurface(Textures.castleFloor(SIEGE_W, SIEGE_H), { normal: 3, glow: false, tint: 0x5a4a4a, roughness: 0.6 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(WORLD_W / 2, 0, WORLD_D / 2);
  floor.receiveShadow = true;
  scene.add(floor);

  world.portal = addHellgate(scene, wallMaterial);
  world.gate = addKeepGate(scene, wallMaterial);
  addWasteland(scene);
  for (let row = 0; row < SIEGE_H; row++) {
    for (let col = 0; col < SIEGE_W; col++) {
      if (SIEGE_MAP[row][col] === 'T') world.fires.push(addBrazier(scene, siegeCellCenter(col, row)));
    }
  }
  addSpires(scene);
  world.sky = addSiegeSky(scene);
  return world;
}

// The rim as one surface: a top on every rim cell, and rock walls only where a rim cell
// faces the gorge (so no hidden walls peek through).
function buildRimGeometry() {
  const positions = [];
  const uvs = [];
  const indices = [];
  const quad = (corners, quadUvs) => {
    const base = positions.length / 3;
    for (const p of corners) positions.push(...p);
    for (const uv of quadUvs) uvs.push(...uv);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const rimCells = [];
  for (let row = 0; row < SIEGE_H; row++) {
    for (let col = 0; col < SIEGE_W; col++) if (!isGorgeCell(col, row)) rimCells.push([col, row]);
  }
  const tile = SIEGE_CELL * 2;
  for (const [col, row] of rimCells) {
    const x0 = col * SIEGE_CELL;
    const z0 = row * SIEGE_CELL;
    const x1 = x0 + SIEGE_CELL;
    const z1 = z0 + SIEGE_CELL;
    quad(
      [[x0, SIEGE_RIM, z0], [x0, SIEGE_RIM, z1], [x1, SIEGE_RIM, z1], [x1, SIEGE_RIM, z0]],
      [[x0 / tile, -z0 / tile], [x0 / tile, -z1 / tile], [x1 / tile, -z1 / tile], [x1 / tile, -z0 / tile]],
    );
  }
  const topIndexCount = indices.length;
  for (const [col, row] of rimCells) {
    const x0 = col * SIEGE_CELL;
    const z0 = row * SIEGE_CELL;
    const x1 = x0 + SIEGE_CELL;
    const z1 = z0 + SIEGE_CELL;
    const sides = [
      [col + 1, row, [x1, z1], [x1, z0]],
      [col - 1, row, [x0, z0], [x0, z1]],
      [col, row + 1, [x0, z1], [x1, z1]],
      [col, row - 1, [x1, z0], [x0, z0]],
    ];
    for (const [nc, nr, a, b] of sides) {
      if (!isGorgeCell(nc, nr)) continue;
      quad(
        [[a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], SIEGE_RIM, b[1]], [a[0], SIEGE_RIM, a[1]]],
        [[0, 0], [1, 0], [1, 1.25], [0, 1.25]],
      );
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.addGroup(0, topIndexCount, 0);
  geometry.addGroup(topIndexCount, indices.length - topIndexCount, 1);
  geometry.computeVertexNormals();
  return geometry;
}

// Where the beasts come from: a burning portal in the rock.
function addHellgate(scene, wallMaterial) {
  const [col, row] = SIEGE_PATH.start;
  const [ox, oz] = SIEGE_PATH.startOut;
  const { x, z } = siegeCellCenter(col, row);
  const facing = Math.atan2(-ox, -oz);
  const group = new THREE.Group();
  group.position.set(x + ox * (SIEGE_CELL / 2 + 0.5), 0, z + oz * (SIEGE_CELL / 2 + 0.5));
  group.rotation.y = facing;
  scene.add(group);
  addPart(group, new THREE.BoxGeometry(SIEGE_CELL + 2, SIEGE_RIM, 1), wallMaterial, 0, SIEGE_RIM / 2, 0).castShadow = true;
  // The portal: a swirl of fire, brighter than white so it blooms.
  const swirl = new THREE.Mesh(
    new THREE.CircleGeometry(1.9, 40),
    new THREE.MeshBasicMaterial({ map: Textures.hazard(), color: new THREE.Color(2.6, 0.9, 0.3) }),
  );
  swirl.position.set(0, 2.1, -0.52);
  swirl.rotation.y = Math.PI;
  group.add(swirl);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.22, 10, 40), new THREE.MeshStandardMaterial({ color: 0x1a0a06, metalness: 0.6, roughness: 0.4, emissive: 0xff3a10, emissiveIntensity: 0.6 }));
  ring.position.set(0, 2.1, -0.55);
  group.add(ring);
  const light = new THREE.PointLight(0xff5a1a, 60, 18, 1.8);
  light.position.set(0, 2.2, -2);
  group.add(light);
  return { swirl, light, at: group.localToWorld(new THREE.Vector3(0, 2.1, -0.8)) };
}

// Where they're heading: the gate of the keep, with an iron portcullis and braziers.
function addKeepGate(scene, wallMaterial) {
  const [col, row] = SIEGE_PATH.end;
  const [ox, oz] = SIEGE_PATH.endOut;
  const { x, z } = siegeCellCenter(col, row);
  const facing = Math.atan2(-ox, -oz);
  const group = new THREE.Group();
  group.position.set(x + ox * (SIEGE_CELL / 2 + 0.5), 0, z + oz * (SIEGE_CELL / 2 + 0.5));
  group.rotation.y = facing;
  scene.add(group);
  const stone = hellSurface(Textures.castleWall(), { normal: 3, glow: false, roughness: 0.85 });
  for (const side of [-1, 1]) {
    addPart(group, new THREE.BoxGeometry(1.4, SIEGE_RIM + 3, 2.2), stone, side * 2.6, (SIEGE_RIM + 3) / 2, 0).castShadow = true;
    addPart(group, new THREE.ConeGeometry(1.2, 2.4, 4), new THREE.MeshStandardMaterial({ color: 0x1a0a08, roughness: 0.7 }), side * 2.6, SIEGE_RIM + 4.2, 0).rotation.y = Math.PI / 4;
  }
  addPart(group, new THREE.BoxGeometry(6.6, 1.6, 2.2), stone, 0, SIEGE_RIM + 0.6, 0).castShadow = true;
  const iron = new THREE.MeshStandardMaterial({ color: 0x1a1412, metalness: 0.8, roughness: 0.4 });
  for (let i = 0; i < 7; i++) addPart(group, new THREE.BoxGeometry(0.12, 4.2, 0.12), iron, -1.65 + i * 0.55, 3.2, 0.3);
  for (const y of [1.6, 3.2, 4.6]) addPart(group, new THREE.BoxGeometry(3.6, 0.12, 0.12), iron, 0, y, 0.3);
  addPart(group, new THREE.PlaneGeometry(3.8, 5.2), new THREE.MeshBasicMaterial({ color: 0x050101 }), 0, 2.6, 1.0);
  return { at: group.localToWorld(new THREE.Vector3(0, 2, 0)) };
}

// The scorched land around the gorge, with pools of lava.
function addWasteland(scene) {
  const size = 400;
  const strips = [
    [-size, -size, WORLD_W + size * 2, size],
    [-size, WORLD_D, WORLD_W + size * 2, size],
    [-size, 0, size, WORLD_D],
    [WORLD_W, 0, size, WORLD_D],
  ];
  for (const [x, z, w, d] of strips) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, d), hellSurface(Textures.ground(w / 8, d / 8), { normal: 3 }));
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(x + w / 2, SIEGE_RIM, z + d / 2);
    plane.receiveShadow = true;
    scene.add(plane);
  }
  const lava = new THREE.MeshBasicMaterial({ map: Textures.hazard(), color: new THREE.Color(1.6, 1.6, 1.6) });
  for (let i = 0; i < 14; i++) {
    let x;
    let z;
    do {
      x = rand(-60, WORLD_W + 60);
      z = rand(-60, WORLD_D + 60);
    } while (x > -6 && x < WORLD_W + 6 && z > -6 && z < WORLD_D + 6);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(rand(3, 8), 24), lava);
    pool.rotation.x = -Math.PI / 2;
    pool.scale.set(1, rand(0.5, 1), 1);
    pool.position.set(x, SIEGE_RIM + 0.03, z);
    scene.add(pool);
  }
}

// A brazier on the rim: stone, an iron bowl of white-hot coals, fire and smoke.
let siegeBrazierMats = null;
function addBrazier(scene, { x, z }) {
  if (!siegeBrazierMats) {
    siegeBrazierMats = {
      stone: new THREE.MeshStandardMaterial({ color: 0x3a2a24, roughness: 0.9 }),
      iron: new THREE.MeshStandardMaterial({ color: 0x2a2220, metalness: 0.6, roughness: 0.5 }),
      coals: new THREE.MeshBasicMaterial({ color: new THREE.Color(THEME.coals).multiplyScalar(3) }),
    };
  }
  const m = siegeBrazierMats;
  addPart(scene, new THREE.CylinderGeometry(0.3, 0.45, 1.3, 10), m.stone, x, SIEGE_RIM + 0.65, z).castShadow = true;
  addPart(scene, new THREE.CylinderGeometry(0.7, 0.35, 0.45, 12), m.iron, x, SIEGE_RIM + 1.5, z).castShadow = true;
  addPart(scene, new THREE.CylinderGeometry(0.6, 0.6, 0.05, 12), m.coals, x, SIEGE_RIM + 1.7, z);
  const light = new THREE.PointLight(THEME.brazierLight, 1.6 * LIGHT_UNITS, 20, 1.5);
  light.position.set(x, SIEGE_RIM + 2.6, z);
  scene.add(light);
  return { x, y: SIEGE_RIM + 1.75, z, light, acc: 0 };
}

// Black spires of the keep and jagged peaks all round the horizon.
function addSpires(scene) {
  const stone = new THREE.MeshStandardMaterial({ color: 0x1a0806, roughness: 0.9, flatShading: true });
  const windows = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff7a20).multiplyScalar(3) });
  const cx = WORLD_W / 2;
  const cz = WORLD_D / 2;
  for (let i = 0; i < 22; i++) {
    const angle = (i / 22) * Math.PI * 2 + rand(-0.1, 0.1);
    const dist = rand(150, 260);
    const x = cx + Math.cos(angle) * dist;
    const z = cz + Math.sin(angle) * dist;
    if (i % 3 === 0) {
      const h = rand(40, 75);
      addPart(scene, new THREE.CylinderGeometry(4, 6, h, 8), stone, x, SIEGE_RIM + h / 2, z);
      addPart(scene, new THREE.ConeGeometry(5, 16, 8), stone, x, SIEGE_RIM + h + 8, z);
      for (let k = 0; k < 4; k++) addPart(scene, new THREE.BoxGeometry(1.4, 2.2, 1.4), windows, x + rand(-3, 3), SIEGE_RIM + rand(h * 0.3, h - 4), z + rand(-3, 3));
    } else {
      const h = rand(50, 100);
      addPart(scene, new THREE.ConeGeometry(rand(30, 50), h, 6), stone, x, SIEGE_RIM - 2 + h / 2, z).rotation.y = rand(0, 3);
    }
  }
}

function addSiegeSky(scene) {
  const texture = Textures.sky();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(500, 32, 16),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  sky.position.set(WORLD_W / 2, 0, WORLD_D / 2);
  scene.add(sky);
  return texture;
}
