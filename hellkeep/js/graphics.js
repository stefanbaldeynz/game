// Modern graphics: the "post-processing" chain that runs after the 3D scene is drawn.
//
//   1. Draw the world into a high-precision (HDR) image with anti-aliasing.
//   2. Ambient occlusion (GTAO): soft contact shadows where things meet, in corners and
//      under creatures, worked out from the depth of the scene.
//   3. Draw the gun on top.
//   4. Bloom: anything brighter than white (fire, lava, eyes, muzzle flashes) glows and bleeds light.
//   5. Grade: a filmic tone curve, colour grading, a dark vignette, a hint of lens fringing
//      at the edges and fine film grain.
//
// Lighting in the world also gets real-time shadows (main.js) and the hell sky as soft
// ambient light and reflections (useSkyForLighting below).
//
// Press G in the game to switch this off on slower computers (it falls back to plain rendering).

const GRADE_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    exposure: { value: 1.0 },
    saturation: { value: 1.12 },
    vignette: { value: 0.9 },
    grain: { value: 0.035 },
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float exposure;
    uniform float saturation;
    uniform float vignette;
    uniform float grain;
    uniform float time;
    uniform vec2 resolution;
    varying vec2 vUv;

    // The "ACES" filmic curve used by modern games and movies: rich darks, soft bright highlights.
    vec3 acesFilm(vec3 x) {
      return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
    }

    vec3 linearToSRGB(vec3 c) {
      return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
    }

    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      // Lens fringing: red and blue split very slightly towards the edges of the screen.
      vec2 fromMid = vUv - 0.5;
      vec2 shift = fromMid * dot(fromMid, fromMid) * 0.012;
      vec3 hdr = vec3(texture2D(tDiffuse, vUv + shift).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - shift).b);
      vec3 color = acesFilm(hdr * exposure);
      float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = mix(vec3(luma), color, saturation);
      vec2 fromCenter = vUv - 0.5;
      color *= 1.0 - vignette * dot(fromCenter, fromCenter);
      color = linearToSRGB(clamp(color, 0.0, 1.0));
      color += (random(vUv * resolution + time) - 0.5) * grain;
      gl_FragColor = vec4(color, 1.0);
    }`,
};

function createGraphics(renderer, scene, camera, weaponScene, weaponCamera) {
  const { EffectComposer, RenderPass, UnrealBloomPass, ShaderPass, GTAOPass, RoomEnvironment } = THREE_ADDONS;
  let enabled = loadSetting();

  // Shiny metal: the guns reflect a soft studio room.
  const pmrem = new THREE.PMREMGenerator(renderer);
  weaponScene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    type: THREE.HalfFloatType, // keeps "brighter than white" values for the bloom
    samples: 4,                // anti-aliasing
  });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  // Dev switches for comparing effects: add &noao, &nobloom to the address.
  const devOff = new URLSearchParams(location.hash.slice(1));

  const ao = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight);
  ao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.5, thickness: 1.5, scale: 1.2, samples: 16 });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  ao.blendIntensity = 0.9;
  // Glows, flames and other see-through effects shouldn't cast contact shadows,
  // so they're hidden while the occlusion is worked out.
  const aoRender = ao.render.bind(ao);
  ao.render = (...args) => {
    const hidden = [];
    scene.traverse((o) => {
      if (o.visible && (o.isPoints || o.isSprite || (o.material && o.material.transparent))) {
        o.visible = false;
        hidden.push(o);
      }
    });
    aoRender(...args);
    for (const o of hidden) o.visible = true;
  };
  if (!devOff.has('noao')) composer.addPass(ao);

  const gunPass = new RenderPass(weaponScene, weaponCamera);
  gunPass.clear = false;
  gunPass.clearDepth = true; // the gun is always drawn on top
  composer.addPass(gunPass);
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.45, 0.85);
  if (!devOff.has('nobloom')) composer.addPass(bloom);
  const grade = new ShaderPass(GRADE_SHADER);
  grade.uniforms.exposure.value = THEME.exposure || 1;
  composer.addPass(grade);

  function loadSetting() {
    try {
      return localStorage.getItem('hellkeepGraphics') !== 'low';
    } catch {
      return true;
    }
  }

  // Plain rendering still gets the filmic tone curve, just no bloom or film effects.
  function applyRendererSettings() {
    // Low graphics also turns off real-time shadows (and the shaders are rebuilt to match).
    if (renderer.shadowMap.enabled !== enabled) {
      renderer.shadowMap.enabled = enabled;
      scene.traverse((o) => {
        for (const m of [].concat(o.material || [])) m.needsUpdate = true;
      });
    }
    renderer.toneMapping = enabled ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = enabled ? THREE.LinearSRGBColorSpace : THREE.SRGBColorSpace;
    renderer.toneMappingExposure = THEME.exposure || 1;
  }

  function resize() {
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(window.innerWidth, window.innerHeight);
    bloom.setSize(window.innerWidth, window.innerHeight);
    ao.setSize(window.innerWidth, window.innerHeight);
    grade.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
  }

  applyRendererSettings();
  resize();

  return {
    get enabled() {
      return enabled;
    },
    resize,
    envMap: weaponScene.environment, // for shiny things out in the world, like the shotgun display
    // The sky picture becomes soft ambient light and reflections for everything in the
    // world: metal glints red under the hell sky and blue in the frozen depths.
    useSkyForLighting(skyTexture) {
      const sky = skyTexture.clone();
      sky.mapping = THREE.EquirectangularReflectionMapping;
      sky.needsUpdate = true;
      scene.environment = pmrem.fromEquirectangular(sky).texture;
      scene.environmentIntensity = 0.45;
      // Your guns reflect the same sky, so chrome and steel glint with hellfire.
      weaponScene.environment = scene.environment;
      weaponScene.environmentIntensity = 2.2;
    },
    toggle() {
      enabled = !enabled;
      try {
        localStorage.setItem('hellkeepGraphics', enabled ? 'high' : 'low');
      } catch {
        // Storage can be blocked; the setting just won't be remembered.
      }
      applyRendererSettings();
      return enabled;
    },
    render(time) {
      if (enabled) {
        grade.uniforms.time.value = time % 100;
        composer.render();
      } else {
        renderer.clear();
        renderer.render(scene, camera);
        renderer.clearDepth();
        renderer.render(weaponScene, weaponCamera);
      }
    },
  };
}

// Scorch marks where your bullets hit walls, floors and ceilings (the oldest ones fade away).
class BulletHoles {
  constructor(scene, max = 90) {
    this.scene = scene;
    this.max = max;
    this.holes = [];
    this.next = 0;
    this.geometry = new THREE.PlaneGeometry(0.24, 0.24);
    this.material = new THREE.MeshStandardMaterial({
      map: Textures.bulletHole(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4, // sit just in front of the wall so it doesn't flicker
      roughness: 1,
    });
  }

  add(point, normal) {
    let hole = this.holes[this.next];
    if (!hole) {
      hole = new THREE.Mesh(this.geometry, this.material);
      this.scene.add(hole);
      this.holes[this.next] = hole;
    }
    this.next = (this.next + 1) % this.max;
    hole.position.copy(point).addScaledVector(normal, 0.01);
    hole.lookAt(point.x + normal.x, point.y + normal.y, point.z + normal.z);
    hole.rotateZ(rand(0, Math.PI * 2));
    hole.scale.setScalar(rand(0.7, 1.2));
  }
}
