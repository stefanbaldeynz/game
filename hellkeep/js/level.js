// The level: a grid map turned into 3D walls, floors, lava, braziers and decorations,
// plus the collision, line-of-sight and path-finding helpers that use the grid.

const CELL = 4;          // size of one map cell in world units (about metres)
const WALL_H = 7;        // castle wall and ceiling height
const ROCK_H = 14;       // height of the rock cliffs around the hellscape
const CASTLE_ROWS = 19;  // map rows 0-18 are inside the castle and get a ceiling

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
  return cellOf(z) < CASTLE_ROWS ? WALL_H : Infinity;
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
  const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture, bumpMap: wallTexture, bumpScale: 0.6, roughness: 0.9 });
  addCellBoxes(scene, walls, WALL_H, wallMaterial);
  const rockTexture = Textures.rock();
  const rockMaterial = new THREE.MeshStandardMaterial({ map: rockTexture, bumpMap: rockTexture, bumpScale: 0.8, roughness: 1 });
  addCellBoxes(scene, rocks, ROCK_H, rockMaterial);

  // Floors and the castle ceiling.
  const width = MAP_W * CELL;
  const castleDepth = CASTLE_ROWS * CELL;
  const outsideDepth = (MAP_H - CASTLE_ROWS) * CELL;
  addPlane(scene, Textures.castleFloor(MAP_W, CASTLE_ROWS), width, castleDepth, width / 2, 0, castleDepth / 2, -Math.PI / 2);
  addPlane(scene, Textures.ground(MAP_W / 2, (MAP_H - CASTLE_ROWS) / 2), width, outsideDepth, width / 2, 0, castleDepth + outsideDepth / 2, -Math.PI / 2);
  // Double-sided so it also looks like a roof if you fly up over the walls.
  addPlane(scene, Textures.ceiling(MAP_W, CASTLE_ROWS), width, castleDepth, width / 2, WALL_H, castleDepth / 2, Math.PI / 2, THREE.DoubleSide);

  // Lava pools: unlit, so they glow.
  level.lavaTexture = Textures.hazard();
  const lavaGeometry = new THREE.PlaneGeometry(CELL, CELL);
  lavaGeometry.rotateX(-Math.PI / 2);
  const lavaMesh = new THREE.InstancedMesh(lavaGeometry, new THREE.MeshBasicMaterial({ map: level.lavaTexture }), lava.length);
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
  addSky(scene);
  return level;
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
  scene.add(mesh);
  return mesh;
}

function addPlane(scene, texture, width, depth, x, y, z, rotationX, side = THREE.FrontSide) {
  const material = new THREE.MeshStandardMaterial({ map: texture, bumpMap: texture, bumpScale: 0.4, roughness: 0.95, side });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  plane.rotation.x = rotationX;
  plane.position.set(x, y, z);
  scene.add(plane);
}

let brazierMaterials = null;

function addBrazier(scene, x, z) {
  if (!brazierMaterials) {
    brazierMaterials = {
      stone: new THREE.MeshStandardMaterial({ color: 0x3a2a24, roughness: 0.9 }),
      iron: new THREE.MeshStandardMaterial({ color: 0x2a2220, metalness: 0.6, roughness: 0.5 }),
      coals: new THREE.MeshBasicMaterial({ color: THEME.coals }),
    };
  }
  addPart(scene, new THREE.CylinderGeometry(0.28, 0.4, 1.1, 10), brazierMaterials.stone, x, 0.55, z);
  addPart(scene, new THREE.CylinderGeometry(0.6, 0.3, 0.4, 12), brazierMaterials.iron, x, 1.3, z);
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
    const texture = wallTexture.clone();
    texture.needsUpdate = true;
    texture.repeat.set(1, height / WALL_H);
    const material = new THREE.MeshStandardMaterial({ map: texture, bumpMap: texture, bumpScale: 0.6, roughness: 0.9 });
    const { x, z } = cellCenter(col, row);
    addPart(scene, new THREE.BoxGeometry(CELL + 0.4, height, CELL + 0.4), material, x, height / 2, z);
    for (const [ox, oz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6], [0, -1.6], [0, 1.6], [-1.6, 0], [1.6, 0]]) {
      merlons.push([x + ox, height + 0.5, z + oz]);
    }
  }
  for (let col = 0; col < MAP_W; col++) {
    if (MAP[18][col] !== '#') continue;
    const { x, z } = cellCenter(col, 18);
    merlons.push([x - 1, WALL_H + 0.5, z + 1.4], [x + 1, WALL_H + 0.5, z + 1.4]);
  }
  const merlonMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), wallMaterial, merlons.length);
  const m = new THREE.Matrix4();
  merlons.forEach(([x, y, z], i) => {
    m.makeTranslation(x, y, z);
    merlonMesh.setMatrixAt(i, m);
  });
  merlonMesh.instanceMatrix.needsUpdate = true;
  merlonMesh.frustumCulled = false;
  scene.add(merlonMesh);

  // Arch over the gate with portcullis spikes hanging from it.
  const gate = cellCenter(12, 18);
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
}
