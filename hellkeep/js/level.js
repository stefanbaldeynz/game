// The level: a grid map turned into 3D walls, floors, lava, braziers and decorations,
// plus the collision, line-of-sight and path-finding helpers that use the grid.

const CELL = 4;          // size of one map cell in world units (about metres)
const WALL_H = 7;        // castle wall and ceiling height
const ROCK_H = 14;       // height of the rock cliffs around the hellscape
const INSIDE_ROWS = ROUND.gate[1] + 1; // map rows down to the castle's south wall are inside it
const ROOF_ROWS = ROUND.roofRows;       // the rows that have a ceiling (0 = open to the sky)

// The map for the current round comes from rounds.js (see the legend there).
// North is the top. You start outside in the south and walk north through the gate.
const MAP = ROUND.map;

const MAP_W = MAP[0].length;
const MAP_H = MAP.length;
MAP.forEach((row, i) => {
  if (row.length !== MAP_W) console.error(`Map row ${i} is ${row.length} wide, expected ${MAP_W}`);
});

// Round things (braziers, the throne) that block movement without filling a whole cell.
const obstacles = [];

function cellAt(col, row) {
  if (row < 0 || row >= MAP_H || col < 0 || col >= MAP_W) return 'R';
  return MAP[row][col];
}

function isSolidCell(col, row) {
  const ch = cellAt(col, row);
  return ch === '#' || ch === 'R';
}

function cellOf(v) {
  return Math.floor(v / CELL);
}

function cellCenter(col, row) {
  return { x: col * CELL + CELL / 2, z: row * CELL + CELL / 2 };
}

function isWallAt(x, z) {
  return isSolidCell(cellOf(x), cellOf(z));
}

function isLavaAt(x, z) {
  return cellAt(cellOf(x), cellOf(z)) === 'L';
}

function ceilingAt(x, z) {
  return cellOf(z) < ROOF_ROWS ? WALL_H : Infinity;
}

// How high you can fly: up to the ceiling, a little over the walls of an open courtyard,
// or up to the top of the cliffs outside.
function flyLimitAt(x, z) {
  const row = cellOf(z);
  if (row < ROOF_ROWS) return WALL_H;
  return row < INSIDE_ROWS ? WALL_H + 2 : ROCK_H - 1;
}

function blockedAt(x, z, radius, avoidLava) {
  for (const [ox, oz] of [[-radius, -radius], [radius, -radius], [-radius, radius], [radius, radius]]) {
    const col = cellOf(x + ox);
    const row = cellOf(z + oz);
    if (isSolidCell(col, row)) return true;
    if (avoidLava && cellAt(col, row) === 'L') return true;
  }
  for (const o of obstacles) {
    if (Math.hypot(x - o.x, z - o.z) < radius + o.r) return true;
  }
  return false;
}

// Move one axis at a time so you slide along walls instead of sticking to them.
function moveWithCollision(entity, dx, dz, radius, avoidLava) {
  if (!blockedAt(entity.x + dx, entity.z, radius, avoidLava)) entity.x += dx;
  if (!blockedAt(entity.x, entity.z + dz, radius, avoidLava)) entity.z += dz;
}

function hasLineOfSight(x1, z1, x2, z2) {
  const dist = Math.hypot(x2 - x1, z2 - z1);
  const steps = Math.ceil(dist / 0.5);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isWallAt(x1 + (x2 - x1) * t, z1 + (z2 - z1) * t)) return false;
  }
  return true;
}

// ---------- Path finding ----------
// A "flow field": every cell stores how many steps it is from the player.
// Hounds just keep stepping to a neighbouring cell with a smaller number.

let flowField = null;
let flowOrigin = -1;
let houndBlocked = null;

function houndCanEnter(col, row) {
  if (row < 0 || row >= MAP_H || col < 0 || col >= MAP_W) return false;
  if (!houndBlocked) {
    houndBlocked = new Uint8Array(MAP_W * MAP_H);
    for (let r = 0; r < MAP_H; r++) {
      for (let c = 0; c < MAP_W; c++) {
        const ch = MAP[r][c];
        const center = cellCenter(c, r);
        const nearObstacle = obstacles.some((o) => Math.hypot(o.x - center.x, o.z - center.z) < o.r + 1);
        houndBlocked[r * MAP_W + c] = ch === '#' || ch === 'R' || ch === 'L' || nearObstacle ? 1 : 0;
      }
    }
  }
  return houndBlocked[row * MAP_W + col] === 0;
}

function updateFlowField(x, z) {
  const start = cellOf(z) * MAP_W + cellOf(x);
  if (start === flowOrigin) return;
  flowOrigin = start;
  const dist = new Float32Array(MAP_W * MAP_H).fill(Infinity);
  dist[start] = 0;
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    const col = cur % MAP_W;
    const row = (cur - col) / MAP_W;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = col + dc;
      const nr = row + dr;
      if (!houndCanEnter(nc, nr)) continue;
      const n = nr * MAP_W + nc;
      if (dist[n] !== Infinity) continue;
      dist[n] = dist[cur] + 1;
      queue.push(n);
    }
  }
  flowField = dist;
}

// Centre of the neighbouring cell that is closest to the player, or null.
function nextStepToward(x, z) {
  if (!flowField) return null;
  const col = cellOf(x);
  const row = cellOf(z);
  let best = null;
  let bestDist = flowField[row * MAP_W + col];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dc && !dr) continue;
      if (!houndCanEnter(col + dc, row + dr)) continue;
      // Only cut a corner diagonally when both sides are open.
      if (dc && dr && (!houndCanEnter(col + dc, row) || !houndCanEnter(col, row + dr))) continue;
      const d = flowField[(row + dr) * MAP_W + col + dc] + (dc && dr ? 0.4 : 0);
      if (d < bestDist) {
        bestDist = d;
        best = cellCenter(col + dc, row + dr);
      }
    }
  }
  return best;
}

// ---------- Building the 3D world ----------

function buildLevel(scene) {
  const level = { playerStart: null, enemies: [], pickups: [], fires: [], lavaCells: [], lavaTexture: null };
  const walls = [];
  const rocks = [];
  const lava = [];
  const trees = [];

  for (let row = 0; row < MAP_H; row++) {
    for (let col = 0; col < MAP_W; col++) {
      const ch = MAP[row][col];
      const { x, z } = cellCenter(col, row);
      if (ch === '#') walls.push([col, row]);
      else if (ch === 'R') rocks.push([col, row]);
      else if (ch === 'L') {
        lava.push([col, row]);
        level.lavaCells.push({ x, z });
      } else if (ch === 'P') level.playerStart = { x, z };
      else if (ch === 'H') level.enemies.push({ type: 'hound', x, z });
      else if (ch === 'E') level.enemies.push({ type: 'elephant', x, z });
      else if (ch === 'D') level.enemies.push({ type: 'devil', x, z });
      else if (ch === 'B') level.enemies.push({ type: 'balrog', x, z });
      else if (ch === 'Y') trees.push([x, z]);
      else if (ch === 'a') level.pickups.push({ type: 'ammo', x, z });
      else if (ch === 'h') level.pickups.push({ type: 'health', x, z });
      else if (ch === 'f') level.pickups.push({ type: 'rifle', x, z });
      else if (ch === 's') {
        level.pickups.push({ type: 'shotgun', x, z });
        obstacles.push({ x, z, r: 0.6 }); // its display pedestal
      }
      else if (ch === 'T') level.fires.push(addBrazier(scene, x, z));
    }
  }

  const wallTexture = Textures.castleWall();
  const wallMaterial = surfaceMaterial(wallTexture, { roughness: 0.88, normal: 3 });
  addCellBoxes(scene, walls, WALL_H, wallMaterial);
  const rockTexture = Textures.rock();
  const rockMaterial = surfaceMaterial(rockTexture, { roughness: 0.95, normal: 4, glow: true });
  addCellBoxes(scene, rocks, ROCK_H, rockMaterial);

  // Floors and the castle ceiling.
  const width = MAP_W * CELL;
  const castleDepth = INSIDE_ROWS * CELL;
  const outsideDepth = (MAP_H - INSIDE_ROWS) * CELL;
  addPlane(scene, surfaceMaterial(Textures.castleFloor(MAP_W, INSIDE_ROWS), { roughness: 0.75, normal: 3 }), width, castleDepth, width / 2, 0, castleDepth / 2, -Math.PI / 2);
  addPlane(scene, surfaceMaterial(Textures.ground(MAP_W / 2, (MAP_H - INSIDE_ROWS) / 2), { roughness: 0.92, normal: 3.5, glow: true }), width, outsideDepth, width / 2, 0, castleDepth + outsideDepth / 2, -Math.PI / 2);
  // Double-sided so it also looks like a roof if you fly up over the walls.
  if (ROOF_ROWS > 0) {
    const roofDepth = ROOF_ROWS * CELL;
    addPlane(scene, surfaceMaterial(Textures.ceiling(MAP_W, ROOF_ROWS), { roughness: 0.95, normal: 2, side: THREE.DoubleSide }), width, roofDepth, width / 2, WALL_H, roofDepth / 2, Math.PI / 2);
  }
  if (trees.length) addFrozenTrees(scene, trees);
  if (ROUND.keep) addKeep(scene, wallTexture, wallMaterial);

  // Lava pools: unlit and brighter than white, so they glow and bloom. Freezing water
  // is glassy instead: it reflects the room and lets the light through.
  level.lavaTexture = Textures.hazard();
  const lavaGeometry = new THREE.PlaneGeometry(CELL, CELL);
  lavaGeometry.rotateX(-Math.PI / 2);
  const lavaMaterial = THEME.palette === 'fire'
    ? new THREE.MeshBasicMaterial({ map: level.lavaTexture, color: new THREE.Color(1, 1, 1).multiplyScalar(2.2) })
    : new THREE.MeshStandardMaterial({ map: level.lavaTexture, roughness: 0.08, metalness: 0.2, emissive: 0x1a6aa0, emissiveMap: level.lavaTexture, emissiveIntensity: 0.9 });
  const lavaMesh = new THREE.InstancedMesh(lavaGeometry, lavaMaterial, lava.length);
  lavaMesh.receiveShadow = THEME.palette !== 'fire';
  const m = new THREE.Matrix4();
  lava.forEach(([col, row], i) => {
    const { x, z } = cellCenter(col, row);
    m.makeTranslation(x, 0.03, z);
    lavaMesh.setMatrixAt(i, m);
  });
  lavaMesh.instanceMatrix.needsUpdate = true;
  lavaMesh.frustumCulled = false;
  scene.add(lavaMesh);

  addCastleFront(scene, wallTexture, wallMaterial);
  if (ROUND.throne) addThrone(scene, cellCenter(...ROUND.throne));
  addBanners(scene);
  level.sky = addSky(scene);
  level.lavaLights = addLavaLights(scene, lava);
  return level;
}

// A surface with depth: a normal map from the texture's own brightness and, for
// fire-themed rock and ground, glowing lava seams that shine and bloom.
function surfaceMaterial(texture, { roughness = 0.9, normal = 2.5, glow = false, side = THREE.FrontSide } = {}) {
  const material = new THREE.MeshStandardMaterial({ map: texture, normalMap: normalMapFor(texture, normal), roughness, side });
  const glowMap = glow ? glowMapFor(texture) : null;
  if (glowMap) {
    material.emissive = new THREE.Color(0xffffff);
    material.emissiveMap = glowMap;
    material.emissiveIntensity = 1.8;
  }
  return material;
}

// Light rising off each lava (or freezing) pool, so the ground around it glows.
// One light per pool of joined-up cells, placed over its middle.
function addLavaLights(scene, cells) {
  const key = (c, r) => `${c},${r}`;
  const left = new Set(cells.map(([c, r]) => key(c, r)));
  const lights = [];
  for (const [c0, r0] of cells) {
    if (!left.has(key(c0, r0))) continue;
    const pool = [];
    const stack = [[c0, r0]];
    left.delete(key(c0, r0));
    while (stack.length) {
      const [c, r] = stack.pop();
      pool.push([c, r]);
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (left.delete(key(c + dc, r + dr))) stack.push([c + dc, r + dr]);
      }
    }
    const x = pool.reduce((s, [c]) => s + c, 0) / pool.length;
    const z = pool.reduce((s, [, r]) => s + r, 0) / pool.length;
    const fire = THEME.palette === 'fire';
    const light = new THREE.PointLight(fire ? 0xff6a1a : 0x4ab8ff, (fire ? 2.2 : 1.2) * LIGHT_UNITS * Math.sqrt(pool.length), 18, 1.6);
    light.position.set(x * CELL + CELL / 2, 1, z * CELL + CELL / 2);
    scene.add(light);
    lights.push({ light, base: light.intensity, seed: rand(0, 10) });
  }
  return lights;
}

// One box per map cell, all drawn in a single batch.
function addCellBoxes(scene, cells, height, material) {
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL, height, CELL), material, cells.length);
  const m = new THREE.Matrix4();
  cells.forEach(([col, row], i) => {
    const { x, z } = cellCenter(col, row);
    m.makeTranslation(x, height / 2, z);
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addPlane(scene, material, width, depth, x, y, z, rotationX) {
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  plane.rotation.x = rotationX;
  plane.position.set(x, y, z);
  plane.receiveShadow = true;
  plane.castShadow = y > 0; // the ceiling keeps the sky's light out of the castle
  scene.add(plane);
}

let brazierMaterials = null;

function addBrazier(scene, x, z) {
  if (!brazierMaterials) {
    brazierMaterials = {
      stone: new THREE.MeshStandardMaterial({ color: 0x3a2a24, roughness: 0.9 }),
      iron: new THREE.MeshStandardMaterial({ color: 0x2a2220, metalness: 0.6, roughness: 0.5 }),
      coals: new THREE.MeshBasicMaterial({ color: new THREE.Color(THEME.coals).multiplyScalar(3) }), // white-hot, so it blooms
    };
  }
  addPart(scene, new THREE.CylinderGeometry(0.28, 0.4, 1.1, 10), brazierMaterials.stone, x, 0.55, z).receiveShadow = true;
  addPart(scene, new THREE.CylinderGeometry(0.6, 0.3, 0.4, 12), brazierMaterials.iron, x, 1.3, z).receiveShadow = true;
  addPart(scene, new THREE.CylinderGeometry(0.52, 0.52, 0.05, 12), brazierMaterials.coals, x, 1.48, z);
  const light = new THREE.PointLight(THEME.brazierLight, 1.6 * LIGHT_UNITS, 22, 1.5);
  light.position.set(x, 2.4, z);
  scene.add(light);
  obstacles.push({ x, z, r: 0.6 });
  return { x, y: 1.5, z, light, acc: 0 };
}

// Towers, battlements and the gate arch, so the castle looks like a castle from outside.
function addCastleFront(scene, wallTexture, wallMaterial) {
  const towers = ROUND.towers;
  const merlons = [];
  for (const [col, row, height] of towers) {
    const material = wallMaterial.clone();
    material.map = wallTexture.clone();
    material.normalMap = wallMaterial.normalMap.clone();
    for (const map of [material.map, material.normalMap]) {
      map.repeat.set(1, height / WALL_H);
      map.needsUpdate = true;
    }
    const { x, z } = cellCenter(col, row);
    const tower = addPart(scene, new THREE.BoxGeometry(CELL + 0.4, height, CELL + 0.4), material, x, height / 2, z);
    tower.castShadow = tower.receiveShadow = true;
    for (const [ox, oz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6], [0, -1.6], [0, 1.6], [-1.6, 0], [1.6, 0]]) {
      merlons.push([x + ox, height + 0.5, z + oz]);
    }
  }
  for (let col = 0; col < MAP_W; col++) {
    if (MAP[ROUND.gate[1]][col] !== '#') continue;
    const { x, z } = cellCenter(col, ROUND.gate[1]);
    merlons.push([x - 1, WALL_H + 0.5, z + 1.4], [x + 1, WALL_H + 0.5, z + 1.4]);
  }
  // An open courtyard shows the tops of its walls: battlements all the way round.
  if (ROOF_ROWS === 0) {
    for (let row = 0; row < ROUND.gate[1]; row++) {
      for (let col = 0; col < MAP_W; col++) {
        if (MAP[row][col] !== '#') continue;
        const { x, z } = cellCenter(col, row);
        for (const [ox, oz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) merlons.push([x + ox, WALL_H + 0.5, z + oz]);
      }
    }
  }
  const merlonMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), wallMaterial, merlons.length);
  const m = new THREE.Matrix4();
  merlons.forEach(([x, y, z], i) => {
    m.makeTranslation(x, y, z);
    merlonMesh.setMatrixAt(i, m);
  });
  merlonMesh.instanceMatrix.needsUpdate = true;
  merlonMesh.frustumCulled = false;
  merlonMesh.castShadow = merlonMesh.receiveShadow = true;
  scene.add(merlonMesh);

  // Arch over the gate with portcullis spikes hanging from it.
  const gate = cellCenter(...ROUND.gate);
  addPart(scene, new THREE.BoxGeometry(3 * CELL, 2, CELL), wallMaterial, gate.x, WALL_H - 1, gate.z);
  const iron = new THREE.MeshStandardMaterial({ color: 0x1a1412, metalness: 0.7, roughness: 0.5 });
  for (let i = 0; i < 11; i++) {
    const spike = addPart(scene, new THREE.ConeGeometry(0.08, 0.7, 4), iron, gate.x - 5.5 + i * 1.1, WALL_H - 2.35, gate.z + 1.6);
    spike.rotation.x = Math.PI;
  }
}

function addThrone(scene, { x, z }) {
  const stone = new THREE.MeshStandardMaterial({ color: 0x2a1d1a, roughness: 0.8 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0x6a0a08, roughness: 0.9 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xb08030, metalness: 0.8, roughness: 0.3 });
  const throne = new THREE.Group();
  addPart(throne, new THREE.BoxGeometry(2.6, 0.4, 2.4), stone, 0, 0.2, 0);       // dais
  addPart(throne, new THREE.BoxGeometry(1.4, 0.6, 1.2), stone, 0, 0.7, 0.1);     // seat
  addPart(throne, new THREE.BoxGeometry(1.3, 0.12, 1.1), cloth, 0, 1.06, 0.1);   // cushion
  addPart(throne, new THREE.BoxGeometry(1.5, 3.4, 0.3), stone, 0, 2.1, -0.6);    // back
  addPart(throne, new THREE.BoxGeometry(1.1, 2.4, 0.05), cloth, 0, 2.0, -0.43);  // back cloth
  for (const side of [-1, 1]) {
    addPart(throne, new THREE.BoxGeometry(0.2, 0.5, 1.2), stone, side * 0.75, 1.15, 0.1); // armrest
    const horn = addPart(throne, new THREE.ConeGeometry(0.14, 1.1, 8), gold, side * 0.85, 4.0, -0.6);
    horn.rotation.z = -side * 0.5;
  }
  throne.position.set(x, 0, z - 0.6);
  throne.traverse((part) => {
    part.castShadow = part.receiveShadow = true;
  });
  scene.add(throne);
  obstacles.push({ x, z: z - 0.6, r: 1.3 });
}

function addBanners(scene) {
  const material = new THREE.MeshStandardMaterial({ map: Textures.banner(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
  const geometry = new THREE.PlaneGeometry(1.8, 3.6);
  // [column, first floor row in front of a north-side wall]
  const spots = ROUND.banners;
  for (const [col, row] of spots) {
    addPart(scene, geometry, material, col * CELL + CELL / 2, WALL_H - 2.3, row * CELL + 0.03);
  }
}

function addSky(scene) {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(180, 32, 16),
    new THREE.MeshBasicMaterial({ map: Textures.sky(), side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  sky.position.set((MAP_W * CELL) / 2, 0, (MAP_H * CELL) / 2);
  scene.add(sky);
  return sky;
}

// A wall material with its texture stretched to fit a big surface.
function stretchedWallMaterial(wallTexture, wallMaterial, repeatX, repeatY) {
  const material = wallMaterial.clone();
  material.map = wallTexture.clone();
  material.normalMap = wallMaterial.normalMap.clone();
  for (const map of [material.map, material.normalMap]) {
    map.repeat.set(repeatX, repeatY);
    map.needsUpdate = true;
  }
  return material;
}

// The frozen forest: dead trees glazed in ice, with bare branches clawing at the sky.
// All the trunks are one batch and all the branches another.
function addFrozenTrees(scene, spots) {
  const bark = Textures.rock();
  const material = new THREE.MeshStandardMaterial({
    map: bark,
    normalMap: normalMapFor(bark, 4),
    color: 0x8aa0b8,
    roughness: 0.35,  // glazed with ice, so it catches the light
    metalness: 0.1,
    emissive: 0x0a2a48,
  });
  const trunkGeometry = new THREE.CylinderGeometry(0.28, 0.75, 1, 8);
  trunkGeometry.translate(0, 0.5, 0);
  const branchGeometry = new THREE.CylinderGeometry(0.04, 0.2, 1, 5);
  branchGeometry.translate(0, 0.5, 0);
  const BRANCHES = 16;
  const trunks = new THREE.InstancedMesh(trunkGeometry, material, spots.length);
  const branches = new THREE.InstancedMesh(branchGeometry, material, spots.length * BRANCHES);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  spots.forEach(([x0, z0], i) => {
    const x = x0 + rand(-0.8, 0.8);
    const z = z0 + rand(-0.8, 0.8);
    const height = rand(8, 12.5);
    const lean = new THREE.Euler(rand(-0.08, 0.08), 0, rand(-0.08, 0.08));
    q.setFromEuler(lean);
    trunks.setMatrixAt(i, m.compose(p.set(x, 0, z), q, s.set(1, height, 1)));
    for (let b = 0; b < BRANCHES; b++) {
      const k = b / (BRANCHES - 1);
      const y = height * (0.3 + k * 0.65);
      const length = (1 - k * 0.55) * rand(2.2, 4.4);
      e.set(rand(0.5, 1.1) * (b === BRANCHES - 1 ? 0.3 : 1), rand(0, Math.PI * 2), 0, 'YXZ');
      q.setFromEuler(e);
      const r = 0.22 + (1 - k) * 0.25;
      branches.setMatrixAt(i * BRANCHES + b, m.compose(p.set(x, y, z).add(new THREE.Vector3(0, 0, -r * 0.5).applyQuaternion(q)), q, s.set(1 - k * 0.4, length, 1 - k * 0.4)));
    }
    obstacles.push({ x, z, r: 0.6 });
  });
  for (const mesh of [trunks, branches]) {
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
  }
}

// The keep, towering over the north wall of the courtyard, with its great door in the wall.
// It's scenery: the way in is round 4.
function addKeep(scene, wallTexture, wallMaterial) {
  const width = MAP_W * CELL;
  const cx = width / 2;
  const slate = new THREE.MeshStandardMaterial({ color: 0x1a2028, roughness: 0.6, metalness: 0.3 });
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(THEME.coals).multiplyScalar(2.5) });

  // The great hall block, then a tall tower at each front corner and one in the middle.
  const hall = { w: 52, h: 26, d: 26 };
  addPart(scene, new THREE.BoxGeometry(hall.w, hall.h, hall.d), stretchedWallMaterial(wallTexture, wallMaterial, hall.w / 8, hall.h / WALL_H), cx, hall.h / 2, -hall.d / 2 - 0.2);
  const merlons = [];
  for (let i = 0; i <= 24; i++) merlons.push([cx - hall.w / 2 + 1 + i * ((hall.w - 2) / 24), hall.h + 0.6, -0.9]);
  const towers = [[cx - hall.w / 2, 7, 40], [cx + hall.w / 2, 7, 40], [cx, 9, 52]];
  for (const [x, radius, height] of towers) {
    const z = x === cx ? -hall.d / 2 : -4;
    addPart(scene, new THREE.CylinderGeometry(radius, radius * 1.1, height, 20), stretchedWallMaterial(wallTexture, wallMaterial, radius, height / WALL_H), x, height / 2, z);
    addPart(scene, new THREE.CylinderGeometry(radius * 1.15, radius * 1.15, 1.2, 20), wallMaterial, x, height + 0.6, z);
    addPart(scene, new THREE.ConeGeometry(radius * 1.2, radius * 2.4, 20), slate, x, height + 1.2 + radius * 1.2, z);
    // Glowing arrow-slit windows climbing the tower.
    for (let level = 0; level < 4; level++) {
      for (let j = -1; j <= 1; j++) {
        const a = j * 0.5;
        const y = height * (0.35 + level * 0.15);
        const slit = addPart(scene, new THREE.PlaneGeometry(0.7, 2.2), glow, x + Math.sin(a) * (radius + 0.05), y, z + Math.cos(a) * (radius + 0.05));
        slit.rotation.y = a;
      }
    }
  }
  // Rows of windows across the hall, above the courtyard wall.
  for (let i = 0; i < 9; i++) {
    for (const y of [12, 18]) addPart(scene, new THREE.PlaneGeometry(1.2, 3), glow, cx - 20 + i * 5, y, 0.01 - 0.2);
  }
  const merlonMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 1.2, 1.4), wallMaterial, merlons.length);
  const m = new THREE.Matrix4();
  merlons.forEach(([x, y, z], i) => merlonMesh.setMatrixAt(i, m.makeTranslation(x, y, z)));
  merlonMesh.instanceMatrix.needsUpdate = true;
  scene.add(merlonMesh);

  // The great door, set in the courtyard's north wall: a stone arch, iron-banded doors
  // and a cold light spilling out under them.
  const doorZ = CELL + 0.05;
  const iron = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, metalness: 0.8, roughness: 0.4 });
  const wood = new THREE.MeshStandardMaterial({ map: Textures.leather(), color: 0x3a3038, roughness: 0.8 });
  addPart(scene, new THREE.BoxGeometry(7.4, 6.6, 0.5), wallMaterial, cx, 3.3, doorZ + 0.1);
  for (const side of [-1, 1]) {
    addPart(scene, new THREE.BoxGeometry(2.6, 5.6, 0.25), wood, cx + side * 1.32, 2.8, doorZ + 0.45);
    for (const y of [1, 2.8, 4.6]) addPart(scene, new THREE.BoxGeometry(2.5, 0.18, 0.08), iron, cx + side * 1.32, y, doorZ + 0.6);
    addPart(scene, new THREE.TorusGeometry(0.25, 0.05, 8, 16), iron, cx + side * 0.4, 2.6, doorZ + 0.62);
  }
  addPart(scene, new THREE.PlaneGeometry(5, 0.12), glow, cx, 0.06, doorZ + 0.62);
  const light = new THREE.PointLight(THEME.brazierLight, 3 * LIGHT_UNITS, 16, 1.5);
  light.position.set(cx, 2, doorZ + 2);
  scene.add(light);
}
