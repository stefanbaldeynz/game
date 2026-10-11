// The map: a grid turned into a 3D New Zealand canyon, plus collision and the kiwis' path.

const CELL = 4;   // size of one map cell in world units (about metres)
const RIM_H = 5;  // height of the canyon walls

// Map legend:
//   .  grassy rim: you can build towers here
//   T  tree fern on the rim (no building)
//   =  canyon floor: the kiwis' path, and where you walk in first-person mode
//   S  where the kiwis come in        E  where they escape
const MAP = [
  '..T....T.....T....',
  '..................',
  'S===============..',
  '...............=.T',
  '.T.............=..',
  '...............=..',
  '..==============..',
  '..=..............T',
  'T.=......T........',
  '..=...............',
  '..===============E',
  '.......T..........',
  '...T.........T...T',
];

const MAP_W = MAP[0].length;
const MAP_H = MAP.length;
const WORLD_W = MAP_W * CELL;
const WORLD_D = MAP_H * CELL;
MAP.forEach((row, i) => {
  if (row.length !== MAP_W) console.error(`Map row ${i} is ${row.length} wide, expected ${MAP_W}`);
});

function cellAt(col, row) {
  if (row < 0 || row >= MAP_H || col < 0 || col >= MAP_W) return 'X';
  return MAP[row][col];
}

function isCanyonCell(col, row) {
  const ch = cellAt(col, row);
  return ch === '=' || ch === 'S' || ch === 'E';
}

function isBuildable(col, row) {
  return cellAt(col, row) === '.';
}

function cellOf(v) {
  return Math.floor(v / CELL);
}

function cellCenter(col, row) {
  return { x: col * CELL + CELL / 2, z: row * CELL + CELL / 2 };
}

function isCanyonAt(x, z) {
  return isCanyonCell(cellOf(x), cellOf(z));
}

function blockedAt(x, z, radius) {
  for (const [ox, oz] of [[-radius, -radius], [radius, -radius], [-radius, radius], [radius, radius]]) {
    if (!isCanyonAt(x + ox, z + oz)) return true;
  }
  return false;
}

// Move one axis at a time so you slide along walls instead of sticking to them.
function moveWithCollision(entity, dx, dz, radius) {
  if (!blockedAt(entity.x + dx, entity.z, radius)) entity.x += dx;
  if (!blockedAt(entity.x, entity.z + dz, radius)) entity.z += dz;
}

// ---------- The kiwis' path ----------
// Follow the canyon cells from S to E, then extend a little into the caves at each end.

const DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const PATH = buildPath();

function buildPath() {
  let start = null;
  for (let row = 0; row < MAP_H; row++) {
    for (let col = 0; col < MAP_W; col++) if (MAP[row][col] === 'S') start = [col, row];
  }
  const cells = [start];
  const seen = new Set([start.join()]);
  let current = start;
  while (cellAt(...current) !== 'E') {
    const next = DIRECTIONS
      .map(([dc, dr]) => [current[0] + dc, current[1] + dr])
      .find(([c, r]) => isCanyonCell(c, r) && !seen.has(`${c},${r}`));
    if (!next) break;
    seen.add(next.join());
    cells.push(next);
    current = next;
  }
  const end = current;
  const outward = ([col, row]) => DIRECTIONS.find(([dc, dr]) => cellAt(col + dc, row + dr) === 'X') || [0, 0];
  const startOut = outward(start);
  const endOut = outward(end);

  const points = cells.map(([c, r]) => cellCenter(c, r));
  points.unshift({ x: points[0].x + startOut[0] * CELL * 0.9, z: points[0].z + startOut[1] * CELL * 0.9 });
  const last = points[points.length - 1];
  points.push({ x: last.x + endOut[0] * CELL * 0.9, z: last.z + endOut[1] * CELL * 0.9 });

  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z));
  }
  return { points, lengths, length: lengths[lengths.length - 1], start, end, startOut, endOut };
}

// Where a kiwi is after walking `distance` along the path, shifted sideways by `offset`.
function pathPoint(distance, offset = 0) {
  const { points, lengths } = PATH;
  let i = 1;
  while (i < points.length - 1 && lengths[i] < distance) i++;
  const a = points[i - 1];
  const b = points[i];
  const segment = lengths[i] - lengths[i - 1];
  const t = clamp((distance - lengths[i - 1]) / segment, 0, 1);
  const dx = (b.x - a.x) / segment;
  const dz = (b.z - a.z) / segment;
  return {
    x: a.x + (b.x - a.x) * t - dz * offset,
    z: a.z + (b.z - a.z) * t + dx * offset,
    dx,
    dz,
  };
}

// ---------- Building the 3D world ----------

function buildWorld(scene) {
  const wallTexture = Textures.canyonWall();
  const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture, bumpMap: wallTexture, bumpScale: 0.35, roughness: 0.95 });
  const grassMaterial = new THREE.MeshStandardMaterial({ map: Textures.grass(), roughness: 1 });

  const rim = new THREE.Mesh(buildRimGeometry(), [grassMaterial, wallMaterial]);
  rim.castShadow = true;
  rim.receiveShadow = true;
  scene.add(rim);

  // Gravel riverbed along the canyon floor.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_W, WORLD_D),
    new THREE.MeshStandardMaterial({ map: Textures.gravel(MAP_W, MAP_H), roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(WORLD_W / 2, 0, WORLD_D / 2);
  floor.receiveShadow = true;
  scene.add(floor);

  addCave(scene, PATH.start, PATH.startOut, wallMaterial);
  addCave(scene, PATH.end, PATH.endOut, wallMaterial);
  addOuterLand(scene);
  addTreeFerns(scene);
  addTussocks(scene);
  addMountains(scene);
  addSky(scene);
}

// The rim as one solid surface: a grass top on every rim cell, and rock walls only where
// a rim cell faces the canyon (so no hidden walls can peek through the grass).
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
  for (let row = 0; row < MAP_H; row++) {
    for (let col = 0; col < MAP_W; col++) if (!isCanyonCell(col, row)) rimCells.push([col, row]);
  }
  // Grass tops. The texture repeats every two cells.
  const tile = CELL * 2;
  for (const [col, row] of rimCells) {
    const x0 = col * CELL;
    const z0 = row * CELL;
    const x1 = x0 + CELL;
    const z1 = z0 + CELL;
    quad(
      [[x0, RIM_H, z0], [x0, RIM_H, z1], [x1, RIM_H, z1], [x1, RIM_H, z0]],
      [[x0 / tile, -z0 / tile], [x0 / tile, -z1 / tile], [x1 / tile, -z1 / tile], [x1 / tile, -z0 / tile]],
    );
  }
  const topIndexCount = indices.length;

  // Canyon walls. Each side runs from A to B so that the face points into the canyon.
  for (const [col, row] of rimCells) {
    const x0 = col * CELL;
    const z0 = row * CELL;
    const x1 = x0 + CELL;
    const z1 = z0 + CELL;
    const sides = [
      [col + 1, row, [x1, z1], [x1, z0]],
      [col - 1, row, [x0, z0], [x0, z1]],
      [col, row + 1, [x0, z1], [x1, z1]],
      [col, row - 1, [x1, z0], [x0, z0]],
    ];
    for (const [nc, nr, a, b] of sides) {
      if (!isCanyonCell(nc, nr)) continue;
      quad(
        [[a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], RIM_H, b[1]], [a[0], RIM_H, a[1]]],
        [[0, 0], [1, 0], [1, 1], [0, 1]],
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

// A rock wall closing off each end of the canyon, with a dark cave mouth for the kiwis.
function addCave(scene, [col, row], [ox, oz], wallMaterial) {
  const { x, z } = cellCenter(col, row);
  const facing = Math.atan2(-ox, -oz);
  const wall = addPart(scene, new THREE.BoxGeometry(CELL + 2, RIM_H, 1), wallMaterial, x + ox * (CELL / 2 + 0.5), RIM_H / 2, z + oz * (CELL / 2 + 0.5));
  wall.rotation.y = facing;
  wall.castShadow = true;
  const mouth = addPart(
    scene,
    new THREE.CircleGeometry(1.9, 24, 0, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0x0c0906 }),
    x + ox * (CELL / 2 - 0.02), 0, z + oz * (CELL / 2 - 0.02),
  );
  mouth.rotation.y = facing;
}

// Rolling grassland around the map so the canyon doesn't float in the sky.
function addOuterLand(scene) {
  const size = 400;
  const strips = [
    [-size, -size, WORLD_W + size * 2, size],  // north
    [-size, WORLD_D, WORLD_W + size * 2, size], // south
    [-size, 0, size, WORLD_D],                  // west
    [WORLD_W, 0, size, WORLD_D],                // east
  ];
  for (const [x, z, w, d] of strips) {
    const texture = Textures.grass(w / CELL, d / CELL);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }));
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(x + w / 2, RIM_H, z + d / 2);
    plane.receiveShadow = true;
    scene.add(plane);
  }

  // Dark native forest around the edges.
  const trees = [];
  while (trees.length < 160) {
    const x = rand(-70, WORLD_W + 70);
    const z = rand(-70, WORLD_D + 70);
    if (x > -4 && x < WORLD_W + 4 && z > -4 && z < WORLD_D + 4) continue;
    trees.push([x, z, rand(0.7, 1.7)]);
  }
  const foliage = new THREE.InstancedMesh(new THREE.ConeGeometry(1.7, 5, 7), new THREE.MeshStandardMaterial({ color: 0x2f5a2a, roughness: 1, flatShading: true }), trees.length);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.35, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: 1 }), trees.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  trees.forEach(([x, z, s], i) => {
    m.compose(new THREE.Vector3(x, RIM_H + 1.6 * s + 2.5 * s, z), q, new THREE.Vector3(s, s, s));
    foliage.setMatrixAt(i, m);
    m.compose(new THREE.Vector3(x, RIM_H + 0.8 * s, z), q, new THREE.Vector3(s, s, s));
    trunks.setMatrixAt(i, m);
  });
  foliage.frustumCulled = trunks.frustumCulled = false;
  scene.add(foliage, trunks);
}

// Ponga (tree ferns) on the 'T' cells.
function addTreeFerns(scene) {
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 });
  const frondMaterial = new THREE.MeshStandardMaterial({ map: Textures.fernFrond(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 });
  const frondGeometry = new THREE.PlaneGeometry(1.1, 3.2);
  frondGeometry.rotateX(-Math.PI / 2);
  frondGeometry.translate(0, 0, -1.6); // base at the trunk, tip pointing out
  for (let row = 0; row < MAP_H; row++) {
    for (let col = 0; col < MAP_W; col++) {
      if (MAP[row][col] !== 'T') continue;
      const c = cellCenter(col, row);
      const x = c.x + rand(-0.6, 0.6);
      const z = c.z + rand(-0.6, 0.6);
      const height = rand(2.8, 4.2);
      const trunk = addPart(scene, new THREE.CylinderGeometry(0.16, 0.26, height, 8), trunkMaterial, x, RIM_H + height / 2, z);
      trunk.castShadow = true;
      const crown = new THREE.Group();
      crown.position.set(x, RIM_H + height, z);
      scene.add(crown);
      const count = 10;
      for (let i = 0; i < count; i++) {
        const holder = new THREE.Group();
        holder.rotation.y = (i / count) * Math.PI * 2 + rand(-0.15, 0.15);
        crown.add(holder);
        const frond = addPart(holder, frondGeometry, frondMaterial);
        frond.rotation.x = rand(-0.45, 0.2);
        frond.castShadow = true;
      }
    }
  }
}

// Golden tussock grass clumps, all drawn as one batch of blades.
function addTussocks(scene) {
  const clumps = [];
  for (let row = 0; row < MAP_H; row++) {
    for (let col = 0; col < MAP_W; col++) {
      if (isCanyonCell(col, row)) continue;
      const c = cellCenter(col, row);
      for (let i = 0; i < 2; i++) {
        // Keep away from the middle of the cell, where towers go.
        const angle = rand(0, Math.PI * 2);
        const dist = rand(1.3, 1.8);
        clumps.push([c.x + Math.cos(angle) * dist, c.z + Math.sin(angle) * dist]);
      }
    }
  }
  while (clumps.length < 700) {
    const x = rand(-40, WORLD_W + 40);
    const z = rand(-40, WORLD_D + 40);
    if (x > -1 && x < WORLD_W + 1 && z > -1 && z < WORLD_D + 1) continue;
    clumps.push([x, z]);
  }
  const bladesPerClump = 12;
  const geometry = new THREE.ConeGeometry(0.05, 1, 4);
  geometry.translate(0, 0.5, 0);
  const blades = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ color: 0xb8a25a, roughness: 1 }), clumps.length * bladesPerClump);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  let i = 0;
  for (const [x, z] of clumps) {
    for (let b = 0; b < bladesPerClump; b++) {
      e.set(rand(-0.6, 0.6), rand(0, Math.PI * 2), rand(-0.6, 0.6));
      q.setFromEuler(e);
      const h = rand(0.5, 1.1);
      m.compose(new THREE.Vector3(x + rand(-0.15, 0.15), RIM_H, z + rand(-0.15, 0.15)), q, new THREE.Vector3(1, h, 1));
      blades.setMatrixAt(i++, m);
    }
  }
  blades.frustumCulled = false;
  scene.add(blades);
}

// Snow-capped Southern Alps on the horizon.
function addMountains(scene) {
  const rock = new THREE.MeshStandardMaterial({ color: 0x6e7d8c, roughness: 1, flatShading: true });
  const snow = new THREE.MeshStandardMaterial({ color: 0xf4f8fb, roughness: 0.9, flatShading: true });
  const cx = WORLD_W / 2;
  const cz = WORLD_D / 2;
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2 + rand(-0.12, 0.12);
    const dist = rand(200, 270);
    const height = rand(55, 110);
    const radius = rand(45, 70);
    const x = cx + Math.cos(angle) * dist;
    const z = cz + Math.sin(angle) * dist;
    addPart(scene, new THREE.ConeGeometry(radius, height, 7), rock, x, RIM_H - 2 + height / 2, z);
    addPart(scene, new THREE.ConeGeometry(radius * 0.3, height * 0.3, 7), snow, x, RIM_H - 2 + height * 0.85 + 0.3, z);
  }
}

function addSky(scene) {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(500, 32, 16),
    new THREE.MeshBasicMaterial({ map: Textures.sky(), side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  sky.position.set(WORLD_W / 2, 0, WORLD_D / 2);
  scene.add(sky);

  const cloudTexture = Textures.cloud();
  for (let i = 0; i < 14; i++) {
    const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexture, fog: false, transparent: true, opacity: 0.85, depthWrite: false }));
    const angle = rand(0, Math.PI * 2);
    const dist = rand(60, 300);
    cloud.position.set(WORLD_W / 2 + Math.cos(angle) * dist, rand(70, 130), WORLD_D / 2 + Math.sin(angle) * dist);
    cloud.scale.set(rand(50, 90), rand(22, 34), 1);
    scene.add(cloud);
  }
}
