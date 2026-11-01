// Draws rounds 3 and 4 in 3D. The game itself (side/game.js) runs on a flat map
// measured in pixels; this file builds a 3D world from that map and moves 3D models to
// match the game every frame. Side-on, with a little perspective for depth.
//
//   The world:  the rock is traced around its outline, the corners are rounded off and
//               it's pushed out into smooth cliffs (so there's no cube grid to see), with
//               the same lava-cracked rock as the 3D rounds and a glowing ember crust on
//               every surface you can stand on. Blocks are rounded, with glowing runes.
//   You:        the soldier model in red, holding the Flak Shotgun, with feathered angel
//               wings that fold, glide and beat. Running, jumping and riding are animated
//               by turning his bones. Round 4 puts him on the motorcycle.
//   The beasts: the same animated hellhound and rigged elephant models as rounds 1 and 2.
//   The look:   shadows, ambient occlusion, bloom and the filmic grade from graphics.js.
//
// One tile (16 game pixels) is one unit in 3D. The game's y runs down; 3D's runs up.

const SideRender = (() => {
  const PX = 1 / TILE;
  const X = (px) => px * PX;
  const Y = (py) => -py * PX;

  const PLAYER_HEIGHT = 1.5; // how tall you stand, in tiles
  const HOUND_LENGTH = 1.5;
  const ELEPHANT_TALL = 1.3;
  const BIKE_LENGTH = 1.9;
  const ROCK_DEPTH = 3.6;
  const CAMERA_FOV = 36;
  const DEV_ZOOM = Number(new URLSearchParams(location.hash.slice(1)).get('zoom')) || 1;

  let renderer;
  let scene;
  let camera;
  let graphics;
  let lastTime = performance.now();
  let elapsed = 0;

  // Effects.
  let fire;
  let sparks;
  let blueFire;
  let smoke;
  let glowTexture;

  // Lights that follow the action.
  let keyLight;
  let rimLight;
  let playerLight;
  let flashLight;
  let gemLight;
  const fireballLights = [];
  const lavaLights = [];
  let headlight;

  // What's in the scene, by the game object it stands for.
  const blocks = new Map();
  const beasts = new Map();
  const fireballSprites = new Map();
  const itemMeshes = new Map();
  let hero;
  let gemModel;
  let pelletMesh;
  let chunkMesh;
  let pointsGlow;
  let lavaMaterial;
  let skyMesh;

  // ---------- Setting up ----------

  function init() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    document.getElementById('game').appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(THEME.background);
    scene.fog = new THREE.FogExp2(THEME.background, 0.012);
    camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, 0.1, 500);
    graphics = createGraphics(renderer, scene, camera, new THREE.Scene(), camera);

    glowTexture = Textures.glow();
    fire = new ParticleSystem(scene, { max: 3000, size: 0.38, texture: glowTexture, damping: 0.96, palette: 'fire' });
    sparks = new ParticleSystem(scene, { max: 1500, size: 0.09, texture: glowTexture, damping: 0.97, palette: 'fire' });
    blueFire = new ParticleSystem(scene, { max: 1500, size: 0.3, texture: glowTexture, damping: 0.96, palette: 'frost' });
    smoke = new ParticleSystem(scene, { max: 600, size: 1.4, texture: glowTexture, damping: 0.99, palette: 'smoke' });

    buildLights();
    buildSky();
    buildRock();
    buildBlocks();
    if (ROUND.lava) buildLavaSea();
    else buildGorgeBackdrop();
    buildEffects();
    hero = makeHero();
    gemModel = makeGem();

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      graphics.resize();
    });
  }

  function buildLights() {
    scene.add(new THREE.HemisphereLight(0xff8a5a, 0x2a0808, 0.75 * LIGHT_UNITS));

    // The main light: warm, from above and in front, casting shadows.
    keyLight = new THREE.DirectionalLight(0xffa070, 1.6 * LIGHT_UNITS);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    Object.assign(keyLight.shadow.camera, { left: -18, right: 18, top: 14, bottom: -14, near: 1, far: 80 });
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.radius = 2;
    scene.add(keyLight, keyLight.target);

    // A red rim from behind, so silhouettes stand out from the dark.
    rimLight = new THREE.DirectionalLight(0xff3a10, 1.2 * LIGHT_UNITS);
    scene.add(rimLight, rimLight.target);

    // Your own glow, the muzzle flash and the Soul Gem.
    playerLight = new THREE.PointLight(0xffc890, 12, 10, 2);
    flashLight = new THREE.PointLight(0xffc070, 0, 7, 2);
    gemLight = new THREE.PointLight(0xff2a14, 14, 9, 2);
    scene.add(playerLight, flashLight, gemLight);
    for (let i = 0; i < 3; i++) {
      const light = new THREE.PointLight(0xff7a20, 0, 6, 2);
      scene.add(light);
      fireballLights.push(light);
    }
  }

  function buildSky() {
    const sky = Textures.sky();
    skyMesh = new THREE.Mesh(
      new THREE.SphereGeometry(220, 32, 16),
      new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide, fog: false, depthWrite: false }),
    );
    scene.add(skyMesh);
    graphics.useSkyForLighting(sky);
  }

  // ---------- The rock ----------

  // Rock with lava cracks (like the 3D rounds), plus an ember crust that glows on every
  // surface facing up: the ledges you walk on.
  function rockMaterial(tint = 0xffffff, crust = 0.7) {
    const texture = Textures.rock();
    texture.repeat.set(0.32, 0.32);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: tint,
      normalMap: normalMapFor(texture, 4),
      roughness: 0.92,
    });
    const glow = glowMapFor(texture);
    if (glow) {
      material.emissive = new THREE.Color(0xffffff);
      material.emissiveMap = glow;
      material.emissiveIntensity = 1.6;
    }
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vRockNormal;\nvarying vec3 vRockPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRockNormal = normal;\nvRockPos = position;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vRockNormal;\nvarying vec3 vRockPos;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          // Embers smouldering along the front lip of every ledge, fading towards the back.
          float up = smoothstep(0.6, 0.95, normalize(vRockNormal).y);
          float lip = smoothstep(-0.9, 0.45, vRockPos.z);
          float ember = 0.55 + 0.45 * sin(vRockPos.x * 3.7 + sin(vRockPos.x * 1.3 + vRockPos.z * 2.1) * 2.5);
          totalEmissiveRadiance += vec3(1.0, 0.28, 0.04) * up * lip * lip * ember * ${crust.toFixed(2)};`);
    };
    material.customProgramCacheKey = () => `side-rock-${crust}`;
    return material;
  }

  // The outline of all the rock as closed loops, with the rock on the left of each
  // loop's direction: outer edges go anticlockwise, holes (air pockets) clockwise.
  function rockLoops() {
    const pad = 8;
    const minC = -pad;
    const maxC = cols + pad;
    const maxR = ROUND.lava ? rows : rows + pad;
    const solid = (c, r) => {
      if (c < minC || c >= maxC || r < 0 || r >= maxR) return false;
      if (r >= rows) return true; // solid ground under the gorge
      if (c < 0 || c >= cols) return true; // the walls at the ends of the world
      return grid[r][c] === '#';
    };
    const out = new Map();
    const addEdge = (ax, ay, bx, by) => {
      const key = `${ax},${ay}`;
      if (!out.has(key)) out.set(key, []);
      out.get(key).push({ ax, ay, bx, by, used: false });
    };
    for (let r = 0; r < maxR; r++) {
      for (let c = minC; c < maxC; c++) {
        if (!solid(c, r)) continue;
        const top = -r;
        const bottom = -r - 1;
        if (!solid(c, r + 1)) addEdge(c, bottom, c + 1, bottom);
        if (!solid(c + 1, r)) addEdge(c + 1, bottom, c + 1, top);
        if (!solid(c, r - 1)) addEdge(c + 1, top, c, top);
        if (!solid(c - 1, r)) addEdge(c, top, c, bottom);
      }
    }
    const loops = [];
    for (const list of out.values()) {
      for (const first of list) {
        if (first.used) continue;
        const loop = [];
        let edge = first;
        while (edge && !edge.used) {
          edge.used = true;
          loop.push([edge.ax, edge.ay]);
          const next = (out.get(`${edge.bx},${edge.by}`) || []).filter((e) => !e.used);
          // Where two rocks touch only at a corner, turn towards the rock so they stay apart.
          const dx = edge.bx - edge.ax;
          const dy = edge.by - edge.ay;
          next.sort((a, b) => (dx * (b.by - b.ay) - dy * (b.bx - b.ax)) - (dx * (a.by - a.ay) - dy * (a.bx - a.ax)));
          edge = next[0];
        }
        loops.push(simplify(loop));
      }
    }
    return loops.filter((l) => l.length >= 3);
  }

  // Drop the points in the middle of straight runs.
  function simplify(loop) {
    return loop.filter((p, i) => {
      const a = loop[(i - 1 + loop.length) % loop.length];
      const b = loop[(i + 1) % loop.length];
      return (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]) !== 0;
    });
  }

  // Round off every corner (the flat ledges stay exactly where the game has them).
  function rounded(loop, radius = 0.32) {
    const pts = [];
    for (let i = 0; i < loop.length; i++) {
      const a = loop[(i - 1 + loop.length) % loop.length];
      const p = loop[i];
      const b = loop[(i + 1) % loop.length];
      const la = Math.hypot(a[0] - p[0], a[1] - p[1]);
      const lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const r = Math.min(radius, la / 2, lb / 2);
      const p1 = [p[0] + ((a[0] - p[0]) / la) * r, p[1] + ((a[1] - p[1]) / la) * r];
      const p2 = [p[0] + ((b[0] - p[0]) / lb) * r, p[1] + ((b[1] - p[1]) / lb) * r];
      for (let k = 0; k <= 4; k++) {
        const t = k / 4;
        const u = 1 - t;
        pts.push(new THREE.Vector2(u * u * p1[0] + 2 * u * t * p[0] + t * t * p2[0], u * u * p1[1] + 2 * u * t * p[1] + t * t * p2[1]));
      }
    }
    return pts;
  }

  const area = (loop) => loop.reduce((s, p, i) => {
    const q = loop[(i + 1) % loop.length];
    return s + p[0] * q[1] - q[0] * p[1];
  }, 0) / 2;

  function inside([x, y], loop) {
    let hit = false;
    for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
      const [xi, yi] = loop[i];
      const [xj, yj] = loop[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  }

  function buildRock() {
    const loops = rockLoops();
    const outers = loops.filter((l) => area(l) > 0).map((loop) => ({ loop, area: area(loop), holes: [] }));
    for (const hole of loops.filter((l) => area(l) < 0)) {
      const mid = hole.reduce((s, p) => [s[0] + p[0] / hole.length, s[1] + p[1] / hole.length], [0, 0]);
      const owner = outers.filter((o) => inside(mid, o.loop)).sort((a, b) => a.area - b.area)[0];
      if (owner) owner.holes.push(hole);
    }
    const shapes = outers.map(({ loop, holes }) => {
      const shape = new THREE.Shape(rounded(loop));
      for (const hole of holes) shape.holes.push(new THREE.Path(rounded(hole)));
      return shape;
    });
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: ROCK_DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.16,
      bevelOffset: -0.16, // the bevel rounds the front edge inwards, so ledges stay where the game has them
      bevelSegments: 3,
      curveSegments: 1,
    });
    geometry.translate(0, 0, -ROCK_DEPTH + 0.3);
    const rock = new THREE.Mesh(geometry, rockMaterial());
    rock.castShadow = rock.receiveShadow = true;
    scene.add(rock);
  }

  function buildGorgeBackdrop() {
    // The far wall of the gorge, deep in shadow, still cracked with lava.
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(cols + 40, rows + 40), rockMaterial(0x6a4a40, 0));
    for (const map of [wall.material.map, wall.material.normalMap, wall.material.emissiveMap]) {
      if (map) map.repeat.set((cols + 40) / 3, (rows + 40) / 3);
    }
    wall.material.emissiveIntensity = 0.7;
    wall.position.set(cols / 2, -rows / 2, -ROCK_DEPTH + 0.25);
    wall.receiveShadow = true;
    scene.add(wall);
  }

  function buildLavaSea() {
    // A sea of lava stretching to the horizon, and the black towers of the keep beyond it.
    const texture = Textures.hazard();
    texture.repeat.set(300, 180);
    lavaMaterial = new THREE.MeshBasicMaterial({ map: texture, color: new THREE.Color(0.5, 0.3, 0.22) });
    // A red heat haze over the lava, so the far shore and the towers fade into it.
    scene.fog = new THREE.FogExp2(0x4a1006, 0.016);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(cols + 3000, 1800), lavaMaterial);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(cols / 2, Y(rows * TILE - 6), -880);
    scene.add(sea);
    for (let i = 0; i < 4; i++) {
      const light = new THREE.PointLight(0xff5a14, 40, 16, 1.8);
      scene.add(light);
      lavaLights.push(light);
    }
    const stone = new THREE.MeshStandardMaterial({ color: 0x140606, roughness: 0.9 });
    const windows = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff7a20).multiplyScalar(3) });
    for (let x = -80; x < cols + 100; x += 34 + Math.random() * 30) {
      const h = 16 + Math.random() * 26;
      const z = -150 - Math.random() * 70;
      const base = Y(rows * TILE);
      addPart(scene, new THREE.CylinderGeometry(3.2, 4.5, h, 8), stone, x, base + h / 2, z);
      addPart(scene, new THREE.ConeGeometry(4.2, 14, 8), stone, x, base + h + 7, z);
      for (let k = 0; k < 3; k++) {
        if (Math.random() < 0.6) addPart(scene, new THREE.BoxGeometry(1.2, 2, 0.3), windows, x + rand(-2.6, 2.6), base + rand(h * 0.4, h - 3), z + 4.6);
      }
    }
  }

  // ---------- Blocks ----------

  // A glowing symbol for the blocks: a flame (rune blocks) or a skull (the chest).
  function glyphTexture(draw) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#000';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#3a1a08';
    g.lineWidth = 6;
    g.strokeRect(10, 10, 108, 108);
    draw(g);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  const flame = glyphTexture((g) => {
    g.fillStyle = '#ff6a10';
    g.beginPath();
    g.moveTo(64, 22);
    g.bezierCurveTo(90, 52, 96, 70, 88, 90);
    g.bezierCurveTo(80, 108, 48, 108, 40, 90);
    g.bezierCurveTo(32, 72, 46, 60, 52, 44);
    g.bezierCurveTo(56, 60, 62, 64, 64, 22);
    g.fill();
    g.fillStyle = '#ffd060';
    g.beginPath();
    g.ellipse(64, 86, 12, 16, 0, 0, Math.PI * 2);
    g.fill();
  });

  const skull = glyphTexture((g) => {
    g.fillStyle = '#ffe0a0';
    g.beginPath();
    g.arc(64, 56, 30, 0, Math.PI * 2);
    g.fill();
    g.fillRect(46, 70, 36, 26);
    g.fillStyle = '#000';
    for (const x of [52, 76]) {
      g.beginPath();
      g.arc(x, 56, 9, 0, Math.PI * 2);
      g.fill();
    }
    for (const x of [52, 61, 70]) g.fillRect(x, 86, 5, 10);
  });

  function blockMaterial(ch) {
    if (ch === 'S') {
      return new THREE.MeshPhysicalMaterial({ color: 0x2c2428, metalness: 0.85, roughness: 0.35, clearcoat: 0.4, emissive: 0xffffff, emissiveMap: flame, emissiveIntensity: 2.4 });
    }
    if (ch === 'M') {
      return new THREE.MeshPhysicalMaterial({ color: 0xd8ac48, metalness: 1, roughness: 0.3, clearcoat: 0.6, emissive: 0xffffff, emissiveMap: skull, emissiveIntensity: 1.2 });
    }
    return rockMaterial(0xe08850, 0.4); // brimstone
  }

  function buildBlocks() {
    const geometry = new THREE_ADDONS.RoundedBoxGeometry(0.98, 0.98, 1.3, 3, 0.14);
    const materials = {};
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = grid[r][c];
        if (!BREAKABLE.has(ch)) continue;
        materials[ch] = materials[ch] || blockMaterial(ch);
        const mesh = new THREE.Mesh(geometry, materials[ch]);
        mesh.position.set(c + 0.5, -r - 0.5, 0);
        mesh.rotation.set(rand(-0.03, 0.03), rand(-0.05, 0.05), rand(-0.03, 0.03));
        mesh.castShadow = mesh.receiveShadow = true;
        scene.add(mesh);
        blocks.set(`${c},${r}`, { mesh, c, r });
      }
    }
  }

  // ---------- You ----------

  function makeHero() {
    const root = new THREE.Group();
    scene.add(root);
    const hero = { root, phase: 0, wingPhase: 0, recoil: 0 };

    const soldier = window.MODELS && MODELS.soldier;
    if (soldier) {
      const model = THREE_ADDONS.SkeletonUtils.clone(soldier.scene);
      hero.mixer = new THREE.AnimationMixer(model);
      if (soldier.animations[0]) hero.mixer.clipAction(soldier.animations[0]).play();
      hero.mixer.update(0.3);
      model.updateMatrixWorld(true);
      // Swap his M4 for the Flak Shotgun, and dress him in Hellkeep red.
      const m4 = new THREE.Box3();
      model.traverse((o) => {
        if (!o.isMesh) return;
        if (/^M4/.test(o.name)) {
          m4.union(new THREE.Box3().setFromObject(o, true));
          o.visible = false;
          return;
        }
        o.material = o.material.clone();
        o.material.color.multiply(new THREE.Color(0xd06050));
        o.castShadow = o.receiveShadow = true;
      });
      const full = new THREE.Box3().setFromObject(model, true);
      const height = full.max.y - full.min.y;
      hero.bones = {};
      // The bones worked by hand. Each frame they go back to their standing pose before the
      // running, jumping or riding bend is added (so the bends never pile up).
      hero.rest = [];
      for (const name of ['hips', 'spine', 'chest', 'upleg.L', 'upleg.R', 'leg.L', 'leg.R', 'arm.L', 'arm.R', 'hand.R']) {
        // three.js drops the dots from bone names when it loads a model ('upleg.L' -> 'uplegL').
        const loaded = THREE.PropertyBinding.sanitizeNodeName(name);
        const bone = model.getObjectByName(loaded);
        hero.bones[name] = bone;
        if (bone) hero.rest.push([bone, bone.quaternion.clone()]);
      }
      // His standing pose is twisted a little at the hips; measure it so he can be turned
      // to face exactly left or right.
      if (hero.bones.hips) {
        const q = hero.bones.hips.getWorldQuaternion(new THREE.Quaternion());
        hero.poseYaw = new THREE.Euler().setFromQuaternion(q, 'YXZ').y;
      }

      const gun = buildShotgun();
      gun.group.rotation.y = Math.PI; // its barrels point down -z; he faces +z
      const gunBox = new THREE.Box3().setFromObject(gun.group);
      const m4Size = m4.isEmpty() ? height * 0.35 : m4.max.z - m4.min.z;
      const gunScale = (m4Size * 1.45) / (gunBox.max.z - gunBox.min.z);
      gun.group.scale.setScalar(gunScale);
      const center = (m4.isEmpty() ? new THREE.Vector3(0, height * 0.6, height * 0.15) : m4.getCenter(new THREE.Vector3()));
      const gunCenter = new THREE.Box3().setFromObject(gun.group).getCenter(new THREE.Vector3());
      gun.group.position.add(center.sub(gunCenter));
      model.add(gun.group);
      gun.group.traverse((o) => {
        if (o.isMesh) o.castShadow = true;
      });
      model.updateMatrixWorld(true);
      if (hero.bones['hand.R']) hero.bones['hand.R'].attach(gun.group);
      hero.gun = gun;

      // Angel wings on his back.
      hero.wings = makeWings(model, hero.bones.chest, height);
      const scaled = new THREE.Group();
      scaled.add(model);
      scaled.scale.setScalar(PLAYER_HEIGHT / height);
      hero.body = scaled;
      hero.model = model;
      root.add(scaled);
    } else {
      // Without the model: a simple armoured figure.
      const red = new THREE.MeshStandardMaterial({ color: 0x8a1a10, roughness: 0.5, metalness: 0.4 });
      const steel = new THREE.MeshStandardMaterial({ color: 0x8a8e98, roughness: 0.3, metalness: 0.9 });
      const body = new THREE.Group();
      addPart(body, new THREE.CapsuleGeometry(0.22, 0.5, 4, 12), red, 0, 0.6, 0);
      addPart(body, new THREE.SphereGeometry(0.2, 16, 12), steel, 0, 1.1, 0);
      const gun = buildShotgun();
      gun.group.rotation.y = Math.PI;
      gun.group.scale.setScalar(0.7);
      gun.group.position.set(0.05, 0.7, 0.3);
      body.add(gun.group);
      hero.gun = gun;
      hero.body = body;
      hero.wings = makeWings(body, null, 1.3);
      root.add(body);
    }

    // The motorcycle for the ride across the lava.
    if (ROUND.bike) {
      const bike = window.MODELS && MODELS.motorcycle ? MODELS.motorcycle.scene.clone() : fallbackBike();
      const box = new THREE.Box3().setFromObject(bike);
      const scale = BIKE_LENGTH / (box.max.x - box.min.x);
      bike.scale.setScalar(scale);
      bike.position.set(-((box.min.x + box.max.x) / 2) * scale, -box.min.y * scale, 0);
      bike.traverse((o) => {
        if (o.isMesh) o.castShadow = o.receiveShadow = true;
      });
      hero.bike = new THREE.Group();
      hero.bike.add(bike);
      hero.bikeHeight = (box.max.y - box.min.y) * scale;
      root.add(hero.bike);
      headlight = new THREE.SpotLight(0xfff0c0, 60, 16, 0.45, 0.6, 1.5);
      headlight.position.set(BIKE_LENGTH * 0.45, hero.bikeHeight * 0.6, 0);
      headlight.target.position.set(BIKE_LENGTH * 4, 0, 0);
      hero.bike.add(headlight, headlight.target);
      // Where he sits: the saddle, just behind the middle of the bike. He is placed so his
      // hips rest on it (his hips are this high above his feet when he stands).
      hero.seat = { x: -BIKE_LENGTH * 0.15, y: hero.bikeHeight * 0.6 };
      root.updateMatrixWorld(true);
      hero.hipHeight = hero.bones && hero.bones.hips
        ? hero.bones.hips.getWorldPosition(new THREE.Vector3()).y - root.getWorldPosition(new THREE.Vector3()).y
        : 0.6;
    }
    return hero;
  }

  function fallbackBike() {
    const bike = new THREE.Group();
    const black = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.6 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.15, metalness: 1 });
    for (const x of [-0.7, 0.7]) addPart(bike, new THREE.TorusGeometry(0.32, 0.1, 10, 24), black, x, 0.42, 0);
    addPart(bike, new THREE.BoxGeometry(1.3, 0.3, 0.3), chrome, 0, 0.75, 0);
    return bike;
  }

  // Two feathered wings (the same ones as the 3D rounds) on pivots at the shoulder blades.
  // Seen from outside they're lit by everything around them, so their own glow is turned
  // right down and the feathers warmed to ivory.
  function makeWings(model, chest, height) {
    const feathers = getFeatherMaterial();
    feathers.emissiveIntensity = 0.02;
    feathers.color.setHex(0xd8ccb8);
    const pivots = [-1, 1].map((side) => {
      const pivot = new THREE.Group();
      pivot.rotation.order = 'YZX';
      const wing = buildWing();
      const span = height * 0.75;
      wing.scale.set(side * (span / 1.35), span / 1.35, span / 1.35);
      pivot.add(wing);
      pivot.position.set(side * height * 0.05, height * 0.72, -height * 0.1);
      model.add(pivot);
      model.updateMatrixWorld(true);
      if (chest) chest.attach(pivot);
      return { side, pivot };
    });
    return { pivots, base: 1.2, lift: -0.3 };
  }

  // Bend a bone forwards or backwards (around the character's own left-right axis),
  // whichever way the bone itself happens to be built. Positive tips its top forward.
  const sideways = new THREE.Vector3(1, 0, 0);
  const tmpQ = new THREE.Quaternion();
  const tmpQ2 = new THREE.Quaternion();
  function bend(model, bone, angle) {
    if (!angle) return;
    bone.parent.updateWorldMatrix(true, false);
    model.getWorldQuaternion(tmpQ).invert();
    bone.parent.getWorldQuaternion(tmpQ2);
    const parentInModel = tmpQ.multiply(tmpQ2); // the parent's turn, measured from the model
    const axis = sideways.clone().applyQuaternion(parentInModel.invert());
    bone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, angle));
  }

  // How far to turn something at this x so it faces the camera the same way it would in
  // the middle of the screen.
  function viewYaw(x) {
    return Math.atan2(camera.position.x - x, camera.position.z);
  }

  function updateHero(dt) {
    const p = player;
    const h = hero;
    const flying = p.flying;
    const airborne = !p.onGround;
    const running = p.onGround && Math.abs(p.vx) > 0.2 && !p.bike;

    // Where he stands, and which way he faces (turned a little towards you).
    const turn = 0.35;
    h.root.position.set(X(p.x + p.w / 2), Y(p.y + p.h), 0);
    const facing = p.bike ? 1 : p.facing;
    // The camera sees things at the sides of the screen from an angle; turn him to match,
    // so he looks the same wherever he is on screen instead of seeming to rotate as he runs.
    const view = viewYaw(h.root.position.x);
    h.body.rotation.y = (facing > 0 ? Math.PI / 2 - turn : -Math.PI / 2 + turn) - (h.poseYaw || 0) + view;
    if (h.bike) {
      const yaw = 0.15 + view; // the bike angled slightly towards you too
      h.bike.rotation.y = yaw;
      h.body.position.set(h.seat.x * Math.cos(yaw), h.seat.y - h.hipHeight, -h.seat.x * Math.sin(yaw));
    }

    // The pose: the model's standing animation, with the legs worked by hand on top.
    if (h.mixer) {
      for (const [bone, rest] of h.rest) bone.quaternion.copy(rest);
      h.mixer.update(dt);
      const b = h.bones;
      h.phase += dt * (running ? Math.abs(p.vx) * 7 : 0);
      const swing = running ? Math.sin(h.phase) : 0;
      if (b['upleg.L'] && b['upleg.R']) {
        // Thigh angles: negative swings the leg forward. Knees: positive bends the shin back.
        let left = -swing * 0.7;
        let right = swing * 0.7;
        let kneeL = running ? Math.max(0, swing) * 1.1 : 0;
        let kneeR = running ? Math.max(0, -swing) * 1.1 : 0;
        if (p.bike) {
          left = right = -1.35;
          kneeL = kneeR = 1.5;
        } else if (airborne) {
          left = flying ? 0.25 : -0.7;
          right = flying ? 0.45 : -0.15;
          kneeL = flying ? 0.5 : 1.1;
          kneeR = flying ? 0.7 : 0.5;
        }
        bend(h.model, b['upleg.L'], left);
        bend(h.model, b['upleg.R'], right);
        if (b['leg.L']) bend(h.model, b['leg.L'], kneeL);
        if (b['leg.R']) bend(h.model, b['leg.R'], kneeR);
      }
      if (b.spine && running) bend(h.model, b.spine, 0.15); // lean into the run
      h.body.position.y = (h.bike ? h.seat.y - h.hipHeight : 0) + (running ? Math.abs(Math.sin(h.phase)) * 0.05 : 0);
    }

    // Wings: only out while you're in the air. They sprout open as you leave the ground,
    // are held out to glide, beat to fly, and fold away when you land.
    const w = h.wings;
    w.show = (w.show || 0) + ((airborne ? 1 : 0) - (w.show || 0)) * Math.min(1, dt * (airborne ? 12 : 9));
    let base = 1.25;
    let lift = -0.25;
    let beat = 0;
    if (flying) {
      base = 0.35;
      lift = 0.35;
      beat = 0.8;
      h.wingPhase += dt * 16;
    } else if (airborne) {
      base = 0.55;
      lift = 0.25;
      beat = 0.06;
      h.wingPhase += dt * 4;
    }
    const ease = Math.min(1, dt * 7);
    w.base += (base - w.base) * ease;
    w.lift += (lift - w.lift) * ease;
    for (const { side, pivot } of w.pivots) {
      pivot.rotation.y = side * w.base;
      pivot.rotation.z = side * (w.lift + Math.sin(h.wingPhase) * beat);
      pivot.scale.setScalar(Math.max(0.001, w.show));
      pivot.visible = w.show > 0.02;
    }
    if (flying && Math.random() < dt * 25) {
      const at = h.root.position;
      sparks.emit(at.x + rand(-0.5, 0.5), at.y + rand(0.4, 1.2), rand(-0.4, 0.4), rand(-0.3, 0.3), rand(-1, -0.3), 0, rand(0.6, 1.1), 0);
    }

    // Blink while you can't be hurt; tip over when you die.
    h.root.visible = game.state === 'dying' || !(p.invuln > 0 && Math.floor(p.invuln / 4) % 2);
    if (game.state === 'dying') {
      const t = Math.min(1, game.endT / 40);
      h.root.rotation.z = -t * 1.4 * facing;
      h.root.position.y -= t * 0.3;
    } else {
      h.root.rotation.z = 0;
    }

    playerLight.position.set(h.root.position.x, h.root.position.y + 1.2, 3);

    // Muzzle flash.
    if (game.flash > 0 && h.gun) {
      const m = h.gun.group.localToWorld(h.gun.muzzle.clone());
      flashLight.position.copy(m);
      flashLight.intensity = 25 * (game.flash / 5);
      for (let i = 0; i < 3; i++) sparks.emit(m.x, m.y, m.z, facing * rand(1, 4), rand(-1, 1), rand(-1, 1), rand(0.08, 0.2), 0);
    } else {
      flashLight.intensity = 0;
    }

    // Exhaust flames on the bike.
    if (h.bike && Math.random() < dt * 40) {
      fire.emit(h.root.position.x - BIKE_LENGTH * 0.5, h.root.position.y + 0.35, 0.1, rand(-2, -1), rand(0, 0.5), 0, rand(0.15, 0.3), 1);
    }
  }

  // ---------- The beasts ----------

  function makeBeast(e) {
    const container = new THREE.Group();
    let parts;
    if (e.type === 'hound') {
      parts = houndTemplate ? makeGltfHound() : makeHoundModel();
      container.scale.setScalar(HOUND_LENGTH / (WOLF_LENGTH * HOUND_SCALE));
      if (parts.mixer) {
        parts.actions.run.play();
        parts.actions.run.setEffectiveTimeScale(1.4);
        parts.mixer.update(rand(0, 1));
      }
      parts.lines = [];
    } else {
      parts = elephantTemplate ? makeRiggedElephant() : makeElephantModel();
      container.scale.setScalar(ELEPHANT_TALL / ELEPHANT_HEIGHT);
      parts.lines = [0, 1, 2].map(() => {
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(Array.from({ length: 7 }, () => new THREE.Vector3())),
          new THREE.LineBasicMaterial({ color: new THREE.Color(0.6, 1.6, 2.8) }),
        );
        line.frustumCulled = false;
        scene.add(line);
        return line;
      });
    }
    parts.group.traverse((o) => {
      if (o.isMesh && !o.material.transparent) o.castShadow = o.receiveShadow = true;
    });
    container.add(parts.group);
    scene.add(container);
    return { container, ...parts, step: 0, deadT: -1, seed: rand(0, 10) };
  }

  function updateBeast(e, b, dt, t) {
    const facingYaw = (f) => (f > 0 ? -Math.PI / 2 - 0.3 : Math.PI / 2 + 0.3);

    if (!e.alive) {
      // Dying: the model's own death (hounds) or toppling over (elephants), then gone.
      if (b.deadT < 0) {
        b.deadT = 0;
        if (b.mixer && b.actions.death) {
          b.actions.run.fadeOut(0.1);
          b.actions.death.reset().setLoop(THREE.LoopOnce, 1).play();
          b.actions.death.clampWhenFinished = true;
        }
        const at = b.container.position;
        for (let i = 0; i < 40; i++) {
          (e.type === 'hound' ? fire : blueFire).emit(at.x, at.y + 0.4, 0, rand(-3, 3), rand(0, 4), rand(-2, 2), rand(0.3, 0.8), 1);
        }
      }
      b.deadT += dt;
      if (b.mixer) b.mixer.update(dt);
      if (e.type === 'hound') b.container.position.y -= dt * 2.5 * b.deadT; // falls out of the air
      else b.group.rotation.z = Math.min(1, b.deadT * 2) * (Math.PI / 2) * 0.9;
      if (b.skin) b.skin.emissiveIntensity = Math.max(0, 1 - b.deadT);
      for (const line of b.lines) line.visible = false;
      if (b.deadT > 1.6) b.container.visible = false;
      return;
    }

    const flash = e.hitT > 0 ? 8 : 0;
    if (e.type === 'hound') {
      b.container.position.set(X(e.x + e.w / 2), Y(e.y + e.h) - 0.05, 0);
      b.container.rotation.y = facingYaw(e.facing) + viewYaw(b.container.position.x);
      b.container.rotation.z = Math.sin(t * 3 + b.seed) * 0.08; // banking as it loops
      if (b.mixer) b.mixer.update(dt);
      const glow = 1 + Math.sin(t * 11 + b.seed) * 0.25 + flash;
      b.skin.emissiveIntensity = glow;
      if (b.skinLight) b.skinLight.emissiveIntensity = glow;
      // A mane of fire.
      if (Math.random() < dt * 60) {
        const at = b.container.position;
        fire.emit(at.x + rand(-0.6, 0.6), at.y + rand(0.3, 0.7), rand(-0.2, 0.2), -e.facing * rand(0.3, 1), rand(0.5, 1.4), 0, rand(0.2, 0.45), 2);
      }
      return;
    }

    // Elephants: walk, rear up, charge, stagger.
    b.container.position.set(X(e.x + e.w / 2), Y(e.y + e.h), 0);
    b.container.rotation.y = facingYaw(e.facing) + viewYaw(b.container.position.x);
    const speed = Math.abs(e.vx) * 60 * PX;
    b.step += dt * speed * 5;
    const swing = speed > 0.1 ? Math.sin(b.step) * (e.mode === 'charge' ? 0.7 : 0.45) : 0;
    if (b.legs) {
      b.legs[0].rotation.x = swing;
      b.legs[3].rotation.x = swing;
      b.legs[1].rotation.x = -swing;
      b.legs[2].rotation.x = -swing;
    }
    let lean = 0;
    if (e.mode === 'windup') lean = 0.3 * Math.min(1, e.modeT / 15);
    else if (e.mode === 'charge') lean = -0.08;
    b.bodyGroup.rotation.x += (lean - b.bodyGroup.rotation.x) * Math.min(1, dt * 8);
    b.bodyGroup.rotation.z = e.mode === 'stunned' ? Math.sin(t * 9) * 0.08 : 0;
    if (b.trunk) {
      b.trunk.forEach((joint, i) => {
        const rest = i === 0 && !b.rigged ? 0.35 : 0;
        joint.rotation.x = rest + Math.sin(t * 1.6 + b.seed + i * 0.6) * 0.12 - (e.mode === 'windup' ? 0.25 : 0);
      });
    }
    if (b.ears) b.ears.forEach((ear, i) => (ear.rotation.y = (i ? -1 : 1) * Math.sin(t * (e.mode === 'charge' ? 9 : 2) + b.seed) * 0.25));
    b.skin.emissiveIntensity = 0.8 + Math.sin(t * 7 + b.seed) * 0.2 + flash;

    // Lightning crackling over its hide, wildly while it charges.
    const at = b.container.position;
    const wild = e.mode === 'charge' || e.mode === 'windup';
    b.lines.forEach((line, i) => {
      line.visible = wild || (i === 0 && Math.random() < 0.3);
      if (!line.visible) return;
      const pos = line.geometry.attributes.position;
      const from = new THREE.Vector3(at.x + rand(-0.5, 0.5), at.y + rand(0.5, 1.1), rand(-0.3, 0.3));
      const a = rand(0, Math.PI * 2);
      const to = from.clone().add(new THREE.Vector3(Math.cos(a) * rand(0.5, 1.1), Math.sin(a) * rand(0.4, 0.9), rand(-0.3, 0.3)));
      for (let k = 0; k < pos.count; k++) {
        const p = from.clone().lerp(to, k / (pos.count - 1));
        if (k > 0 && k < pos.count - 1) p.add(new THREE.Vector3(rand(-0.12, 0.12), rand(-0.12, 0.12), rand(-0.12, 0.12)));
        pos.setXYZ(k, p.x, p.y, p.z);
      }
      pos.needsUpdate = true;
    });
    if (wild && Math.random() < dt * 30) blueFire.emit(at.x + rand(-0.5, 0.5), at.y + rand(0, 1), 0, rand(-1, 1), rand(0, 1.5), 0, rand(0.2, 0.4), 1);
  }

  // ---------- Pickups, the Soul Gem, shots and sparks ----------

  let crateMaterials = null;
  function makeItem(it) {
    if (!crateMaterials) {
      const ammo = new THREE.MeshStandardMaterial({ map: Textures.ammoCrate(), emissive: 0xffffff, roughness: 0.6 });
      ammo.emissiveMap = ammo.map;
      ammo.emissiveIntensity = 0.3;
      const health = new THREE.MeshStandardMaterial({ map: Textures.healthBox(), emissive: 0xffffff, roughness: 0.6 });
      health.emissiveMap = health.map;
      health.emissiveIntensity = 0.3;
      crateMaterials = { ammo, health };
    }
    const mesh = it.type === 'health'
      ? new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.55), crateMaterials.health)
      : new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.38, 0.42), crateMaterials.ammo);
    mesh.castShadow = true;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: it.type === 'health' ? 0x30ff60 : 0xffb030, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 }));
    glow.scale.set(1.5, 1.5, 1);
    mesh.add(glow);
    scene.add(mesh);
    return mesh;
  }

  // A blood-red crystal: two points meeting at a cut girdle, glowing from inside.
  function makeGem() {
    const group = new THREE.Group();
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xff2a1a,
      emissive: 0xff1a0a,
      emissiveIntensity: 1.6,
      roughness: 0.05,
      metalness: 0.1,
      clearcoat: 1,
      flatShading: true,
    });
    addPart(group, new THREE.ConeGeometry(0.42, 0.35, 8), material, 0, 0.17, 0);
    addPart(group, new THREE.ConeGeometry(0.42, 0.75, 8), material, 0, -0.37, 0).rotation.x = Math.PI;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0xff3020, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 }));
    glow.scale.set(2.6, 2.6, 1);
    group.add(glow);
    scene.add(group);
    return group;
  }

  function buildEffects() {
    // Flak pellets: glowing streaks.
    const pelletGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.45, 6).rotateZ(Math.PI / 2);
    pelletMesh = new THREE.InstancedMesh(pelletGeometry, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 2.2, 2.6) }), 80);
    pelletMesh.frustumCulled = false;
    scene.add(pelletMesh);

    // Chunks of smashed blocks.
    chunkMesh = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.13), new THREE.MeshStandardMaterial({ roughness: 0.8 }), 80);
    chunkMesh.frustumCulled = false;
    chunkMesh.castShadow = true;
    scene.add(chunkMesh);

    // Every spark, ember and burst the game makes, as glowing points.
    const max = 2500;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage));
    pointsGlow = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.14, map: glowTexture, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pointsGlow.frustumCulled = false;
    scene.add(pointsGlow);
  }

  const colorCache = new Map();
  function colorOf(css) {
    if (!colorCache.has(css)) colorCache.set(css, new THREE.Color(css));
    return colorCache.get(css);
  }

  function updateEffects(dt, t) {
    // Pellets.
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    pellets.forEach((s, i) => {
      if (i >= 80) return;
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(-s.vy, s.vx));
      m.compose(new THREE.Vector3(X(s.x), Y(s.y), 0), q, one);
      pelletMesh.setMatrixAt(i, m);
    });
    pelletMesh.count = Math.min(80, pellets.length);
    pelletMesh.instanceMatrix.needsUpdate = true;

    // Sparks and embers, and the block chunks.
    const pos = pointsGlow.geometry.attributes.position;
    const col = pointsGlow.geometry.attributes.color;
    let n = 0;
    let chunks = 0;
    for (const pt of particles) {
      if (pt.kind === 'chunk') {
        if (chunks < 80) {
          q.setFromEuler(new THREE.Euler(pt.life * 0.2, pt.life * 0.3, 0));
          m.compose(new THREE.Vector3(X(pt.x), Y(pt.y), 0.2), q, one);
          chunkMesh.setMatrixAt(chunks, m);
          chunkMesh.setColorAt(chunks, colorOf(pt.color));
          chunks++;
        }
        continue;
      }
      if (n >= pos.count) break;
      const fade = Math.min(1, pt.life / Math.min(pt.max, 20)) * 2.2;
      const c = colorOf(pt.color);
      pos.setXYZ(n, X(pt.x), Y(pt.y), pt.kind === 'ember' ? -1.5 + (n % 7) * 0.5 : 0.2);
      col.setXYZ(n, c.r * fade, c.g * fade, c.b * fade);
      n++;
    }
    pointsGlow.geometry.setDrawRange(0, n);
    pos.needsUpdate = col.needsUpdate = true;
    chunkMesh.count = chunks;
    chunkMesh.instanceMatrix.needsUpdate = true;
    if (chunkMesh.instanceColor) chunkMesh.instanceColor.needsUpdate = true;

    // Fireballs: a ball of glowing fire with a trail and its own light.
    const seen = new Set(fireballs);
    for (const [f, sprite] of fireballSprites) {
      if (!seen.has(f)) {
        scene.remove(sprite);
        fireballSprites.delete(f);
      }
    }
    for (const f of fireballs) {
      let sprite = fireballSprites.get(f);
      if (!sprite) {
        sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: new THREE.Color(3, 1.2, 0.3), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
        sprite.scale.set(0.9, 0.9, 1);
        scene.add(sprite);
        fireballSprites.set(f, sprite);
      }
      sprite.position.set(X(f.x + f.w / 2), Y(f.y + f.h / 2), 0.1);
      if (Math.random() < dt * 60) fire.emit(sprite.position.x, sprite.position.y, 0.1, -f.vx * 2, rand(-0.3, 0.6), rand(-0.3, 0.3), rand(0.15, 0.35), 1);
    }
    const nearFireballs = [...fireballSprites.values()].sort((a, b) => Math.abs(a.position.x - camera.position.x) - Math.abs(b.position.x - camera.position.x));
    fireballLights.forEach((light, i) => {
      light.intensity = nearFireballs[i] ? 10 : 0;
      if (nearFireballs[i]) light.position.copy(nearFireballs[i].position);
    });

    // Pickups.
    const live = new Set(items);
    for (const [it, mesh] of itemMeshes) {
      if (!live.has(it)) {
        scene.remove(mesh);
        itemMeshes.delete(it);
      }
    }
    for (const it of items) {
      if (!itemMeshes.has(it)) itemMeshes.set(it, makeItem(it));
      const mesh = itemMeshes.get(it);
      mesh.position.set(X(it.x + it.w / 2), Y(it.y + it.h) + 0.21, 0);
      mesh.rotation.y = t * 1.5;
    }

    // The Soul Gem.
    gemModel.visible = !!gem;
    gemLight.intensity = gem ? 14 + Math.sin(t * 4) * 3 : 0;
    if (gem) {
      gemModel.position.set(X(gem.x + gem.w / 2), Y(gem.y + gem.h / 2), 0);
      gemModel.rotation.y = t * 1.2;
      gemLight.position.copy(gemModel.position).add(new THREE.Vector3(0, 0, 1));
      if (Math.random() < dt * 10) sparks.emit(gemModel.position.x + rand(-0.3, 0.3), gemModel.position.y + rand(-0.3, 0.3), 0.3, 0, rand(0.2, 0.6), 0, rand(0.5, 1), 0);
    }

    // Smashed blocks disappear.
    for (const [key, block] of blocks) {
      if (grid[block.r][block.c] === '.') {
        scene.remove(block.mesh);
        blocks.delete(key);
      }
    }
  }

  // ---------- Each frame ----------

  function draw() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    elapsed += dt;
    const t = elapsed;

    // Follow the game's camera: centre on the middle of its view.
    // (Dev switch: &zoom=3 moves in close on you, for looking at the models.)
    const shake = game.shake > 0 ? game.shake * 0.03 : 0;
    let cx = X(cam.x + VIEW_W / 2) + rand(-shake, shake);
    let cy = Y(cam.y + VIEW_H / 2) + rand(-shake, shake);
    let dist = (VIEW_H * PX) / 2 / Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
    if (DEV_ZOOM > 1) {
      cx = X(player.x + player.w / 2);
      cy = Y(player.y) + 0.2;
      dist /= DEV_ZOOM;
    }
    camera.position.set(cx, cy + 2.2, dist);
    camera.lookAt(cx, cy, 0);
    skyMesh.position.set(cx, cy, 0);
    keyLight.position.set(cx - 8, cy + 14, 18);
    keyLight.target.position.set(cx, cy, 0);
    rimLight.position.set(cx + 6, cy + 6, -14);
    rimLight.target.position.set(cx, cy, 0);
    for (const [i, light] of lavaLights.entries()) {
      light.position.set(cx + (i - 1.5) * 9, Y(rows * TILE - 6) + 1.3, 2);
      light.intensity = 40 * (0.85 + Math.sin(t * 2.3 + i) * 0.1);
    }
    if (lavaMaterial) lavaMaterial.map.offset.set(t * 0.01, t * 0.006);
    if (ROUND.lava && Math.random() < dt * 8) {
      smoke.emit(cx + rand(-14, 14), Y(rows * TILE - 6), rand(-6, 1), rand(-0.2, 0.2), rand(0.4, 0.8), 0, rand(4, 6), 0.03);
    }

    updateHero(dt);
    for (const e of enemies) {
      if (!beasts.has(e)) beasts.set(e, makeBeast(e));
      updateBeast(e, beasts.get(e), dt, t);
    }
    updateEffects(dt, t);
    fire.update(dt);
    sparks.update(dt);
    blueFire.update(dt);
    smoke.update(dt);

    graphics.render(t);
  }

  // debugHero is for poking at the character from the browser console while testing.
  return { init, draw, debugHero: () => hero };
})();

startSide();
