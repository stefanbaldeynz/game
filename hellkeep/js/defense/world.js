// The fortress courtyard for round 5: the map turned into 3D, collision on the sunken road,
// and the path the beasts walk from the fortress gates to the gate of the keep (yours now).
// The road is the "gorge" in the code: a trench cut through the flagstones, walled in stone.

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
  const wallMaterial = hellSurface(Textures.castleWall(), { normal: 3, glow: false, roughness: 0.85 });
  const rimMaterial = hellSurface(Textures.castleFloor(1, 1), { normal: 3, glow: false, roughness: 0.75, tint: 0xb0a098 });

  const rim = new THREE.Mesh(buildRimGeometry(), [rimMaterial, wallMaterial]);
  rim.castShadow = rim.receiveShadow = true;
  scene.add(rim);

  // The sunken road: old worn cobbles.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_W, WORLD_D),
    hellSurface(Textures.castleFloor(SIEGE_W, SIEGE_H), { normal: 3, glow: false, tint: 0x5a4a4a, roughness: 0.6 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(WORLD_W / 2, 0, WORLD_D / 2);
  floor.receiveShadow = true;
  scene.add(floor);

  world.portal = addFortressGate(scene, wallMaterial);
  world.gate = addKeepGate(scene, wallMaterial);
  addKeep(scene);
  addCurtainWalls(scene);
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
  const tile = SIEGE_CELL; // one texture tile (2 x 2 flagstones) per cell
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
        [[0, 0], [1, 0], [1, SIEGE_RIM / 7], [0, SIEGE_RIM / 7]], // the brick texture is 4 wide, 7 tall
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

// A material made from the castle brick texture, stretched to fit a big surface.
function stoneMaterial(repeatX, repeatY) {
  const texture = Textures.castleWall();
  texture.repeat.set(repeatX, repeatY);
  const material = hellSurface(texture, { normal: 3, glow: false, roughness: 0.85 });
  material.normalMap.repeat.set(repeatX, repeatY);
  return material;
}

// Where the beasts come from: the fortress's outer gatehouse, its gates thrown open,
// with the fires of hell burning beyond. Two towers, an arch over the sunken road,
// the portcullis hauled up, and the great doors swung wide.
function addFortressGate(scene, wallMaterial) {
  const [col, row] = SIEGE_PATH.start;
  const [ox, oz] = SIEGE_PATH.startOut;
  const { x, z } = siegeCellCenter(col, row);
  const group = new THREE.Group();
  group.position.set(x + ox * (SIEGE_CELL / 2), 0, z + oz * (SIEGE_CELL / 2));
  group.rotation.y = Math.atan2(-ox, -oz); // local -z points out of the fortress
  scene.add(group);
  const top = SIEGE_RIM + 10;
  const towerStone = stoneMaterial(2, top / 7);
  const iron = new THREE.MeshStandardMaterial({ color: 0x1a1412, metalness: 0.8, roughness: 0.4 });
  const wood = new THREE.MeshStandardMaterial({ map: Textures.leather(), color: 0x4a3028, roughness: 0.8 });
  for (const side of [-1, 1]) {
    addPart(group, new THREE.BoxGeometry(4.4, top, 5), towerStone, side * 4.4, top / 2, -1.5).castShadow = true;
    for (const [mx, mz] of [[-1.7, -3.6], [0, -3.6], [1.7, -3.6], [-1.7, 0.6], [0, 0.6], [1.7, 0.6], [-1.7, -1.5], [1.7, -1.5]]) {
      addPart(group, new THREE.BoxGeometry(0.9, 1, 0.9), wallMaterial, side * 4.4 + mx, top + 0.5, mz);
    }
    // The doors, swung open outwards.
    const door = new THREE.Group();
    door.position.set(side * 2, 0, -4);
    door.rotation.y = side * 1.15;
    group.add(door);
    addPart(door, new THREE.BoxGeometry(2, SIEGE_RIM + 1.4, 0.3), wood, -side, (SIEGE_RIM + 1.4) / 2, 0);
    for (const y of [1, 3, 5.4]) addPart(door, new THREE.BoxGeometry(2, 0.16, 0.36), iron, -side, y, 0);
  }
  // The arch over the road, with the portcullis hauled up into it.
  addPart(group, new THREE.BoxGeometry(4.4, top - SIEGE_RIM - 1.4, 5), towerStone, 0, (top + SIEGE_RIM + 1.4) / 2, -1.5).castShadow = true;
  for (let i = 0; i < 7; i++) {
    const spike = addPart(group, new THREE.ConeGeometry(0.08, 0.6, 4), iron, -1.65 + i * 0.55, SIEGE_RIM + 1.1, -3.2);
    spike.rotation.x = Math.PI;
  }
  // Hell's fire beyond the gates: a swirl of flame, brighter than white so it blooms.
  const swirl = new THREE.Mesh(
    new THREE.CircleGeometry(5, 40),
    new THREE.MeshBasicMaterial({ map: Textures.hazard(), color: new THREE.Color(2.6, 0.9, 0.3) }),
  );
  swirl.position.set(0, 3, -9);
  group.add(swirl);
  const light = new THREE.PointLight(0xff5a1a, 60, 22, 1.8);
  light.position.set(0, 2.5, -2);
  group.add(light);
  return { swirl, light, at: group.localToWorld(new THREE.Vector3(0, 2.1, -3)) };
}

// The keep, yours now: its great hall rises behind the keep gate, with towers at the
// corners and your fires burning in the windows.
function addKeep(scene) {
  const [col, row] = SIEGE_PATH.end;
  const [ox, oz] = SIEGE_PATH.endOut;
  const { x, z } = siegeCellCenter(col, row);
  const group = new THREE.Group();
  group.position.set(x + ox * (SIEGE_CELL / 2 + 1.1), 0, z + oz * (SIEGE_CELL / 2 + 1.1));
  group.rotation.y = Math.atan2(-ox, -oz); // local -z points into the keep
  scene.add(group);
  const hall = { w: 30, h: SIEGE_RIM + 24, d: 22 };
  const slate = new THREE.MeshStandardMaterial({ color: 0x1a0c0a, roughness: 0.7 });
  const windows = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff8a30).multiplyScalar(3) });
  const stone = stoneMaterial(hall.w / 6, hall.h / 7);
  addPart(group, new THREE.BoxGeometry(hall.w, hall.h, hall.d), stone, 0, hall.h / 2, -hall.d / 2).castShadow = true;
  for (const tx of [-hall.w / 2, hall.w / 2]) {
    const height = hall.h + 14;
    addPart(group, new THREE.CylinderGeometry(5, 5.5, height, 16), stoneMaterial(4, height / 7), tx, height / 2, -2).castShadow = true;
    addPart(group, new THREE.ConeGeometry(6, 12, 16), slate, tx, height + 6, -2);
    for (let i = 0; i < 4; i++) addPart(group, new THREE.BoxGeometry(0.9, 2.2, 0.4), windows, tx, height * (0.45 + i * 0.13), 3.4);
  }
  const spire = hall.h + 26;
  addPart(group, new THREE.CylinderGeometry(6, 6.5, spire, 16), stoneMaterial(5, spire / 7), 0, spire / 2, -hall.d + 2);
  addPart(group, new THREE.ConeGeometry(7.5, 16, 16), slate, 0, spire + 8, -hall.d + 2);
  for (let i = 0; i < 7; i++) {
    for (const y of [SIEGE_RIM + 9, SIEGE_RIM + 16]) addPart(group, new THREE.BoxGeometry(1.2, 2.8, 0.2), windows, -10.5 + i * 3.5, y, 0.05);
  }
  for (let i = 0; i < 13; i++) addPart(group, new THREE.BoxGeometry(1.2, 1.2, 1.2), stone, -hall.w / 2 + 1 + i * ((hall.w - 2) / 12), hall.h + 0.6, -0.6);
  // Your banner, hung over the gate.
  addPart(group, new THREE.PlaneGeometry(4, 8), new THREE.MeshStandardMaterial({ map: Textures.banner(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }), 0, SIEGE_RIM + 12, 0.15);
}

// The fortress's curtain walls all the way round the courtyard, with towers at the
// corners. They stop at the gatehouse and the keep.
function addCurtainWalls(scene) {
  const height = SIEGE_RIM + 7;
  const thick = 2;
  const gateZ = siegeCellCenter(...SIEGE_PATH.start).z;
  const keepZ = siegeCellCenter(...SIEGE_PATH.end).z;
  const runs = [
    // [x0, z0, x1, z1]: the north and south sides, then the west and east (up to the gates).
    [-thick, -thick, WORLD_W + thick, -thick],
    [-thick, WORLD_D + thick, WORLD_W + thick, WORLD_D + thick],
    [-thick, -thick, -thick, gateZ - 6.6],
    [-thick, gateZ + 6.6, -thick, WORLD_D + thick],
    [WORLD_W + thick, -thick, WORLD_W + thick, keepZ - 16],
  ];
  const merlons = [];
  for (const [x0, z0, x1, z1] of runs) {
    const length = Math.hypot(x1 - x0, z1 - z0);
    if (length < 1) continue;
    const alongX = x1 !== x0;
    const wall = addPart(scene, new THREE.BoxGeometry(alongX ? length : thick, height, alongX ? thick : length), stoneMaterial(length / 4, height / 7), (x0 + x1) / 2, height / 2, (z0 + z1) / 2);
    wall.castShadow = wall.receiveShadow = true;
    for (let d = 0.8; d < length; d += 1.8) {
      const k = d / length;
      merlons.push([x0 + (x1 - x0) * k, height + 0.5, z0 + (z1 - z0) * k]);
    }
  }
  const towerHeight = height + 6;
  const towerStone = stoneMaterial(4, towerHeight / 7);
  const slate = new THREE.MeshStandardMaterial({ color: 0x1a0c0a, roughness: 0.7 });
  for (const [x, z] of [[-thick, -thick], [WORLD_W + thick, -thick], [-thick, WORLD_D + thick]]) {
    addPart(scene, new THREE.CylinderGeometry(3.4, 3.8, towerHeight, 14), towerStone, x, towerHeight / 2, z).castShadow = true;
    addPart(scene, new THREE.ConeGeometry(4.2, 7, 14), slate, x, towerHeight + 3.5, z);
  }
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), hellSurface(Textures.castleWall(), { normal: 3, glow: false, roughness: 0.85 }), merlons.length);
  const m = new THREE.Matrix4();
  merlons.forEach(([x, y, z], i) => mesh.setMatrixAt(i, m.makeTranslation(x, y, z)));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  scene.add(mesh);
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
  for (let i = 0; i < 6; i++) {
    let x;
    let z;
    do {
      x = rand(-90, WORLD_W + 90);
      z = rand(-90, WORLD_D + 90);
    } while (x > -40 && x < WORLD_W + 70 && z > -40 && z < WORLD_D + 40);
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
