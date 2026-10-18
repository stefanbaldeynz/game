// Procedural textures drawn on canvases, so the game needs no image files.

// scale > 1 draws the same picture at a higher resolution (sharper up close).
function makeCanvas(width, height, draw, scale = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const g = canvas.getContext('2d');
  g.scale(scale, scale);
  draw(g, width, height);
  return canvas;
}

function canvasTexture(canvas, repeatX = 1, repeatY = 1) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace; // these are colours, not data
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
  return texture;
}

// A plain (non-repeating) colour texture.
function colorTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Lots of tiny random squares: grain and grit.
function speckle(g, w, h, count, colors, minSize, maxSize, alpha) {
  for (let i = 0; i < count; i++) {
    g.globalAlpha = rand(alpha * 0.3, alpha);
    g.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    const s = rand(minSize, maxSize);
    g.fillRect(rand(0, w), rand(0, h), s, s);
  }
  g.globalAlpha = 1;
}

// Soft random ellipses: stains, patches and lumps.
function blotches(g, w, h, count, colors, minR, maxR, alpha) {
  for (let i = 0; i < count; i++) {
    g.globalAlpha = rand(alpha * 0.4, alpha);
    g.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    g.beginPath();
    g.ellipse(rand(0, w), rand(0, h), rand(minR, maxR), rand(minR, maxR) * 0.7, rand(0, Math.PI), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

// Wandering jagged lines.
function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function cracks(g, w, h, count, color, width) {
  g.strokeStyle = color;
  g.lineWidth = width;
  for (let i = 0; i < count; i++) {
    let x = rand(0, w);
    let y = rand(0, h);
    let angle = rand(0, Math.PI * 2);
    g.beginPath();
    g.moveTo(x, y);
    const segments = 4 + Math.floor(Math.random() * 7);
    for (let s = 0; s < segments; s++) {
      angle += rand(-0.8, 0.8);
      x += Math.cos(angle) * rand(6, 18);
      y += Math.sin(angle) * rand(6, 18);
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

const Textures = {
  // Castle bricks in the round's colours. Sized for one wall face (4 wide x 7 tall).
  castleWall() {
    const t = THEME.wall;
    return canvasTexture(makeCanvas(256, 448, (g, w, h) => {
      g.fillStyle = t.mortar;
      g.fillRect(0, 0, w, h);
      const rowH = 32;
      const brickW = 64;
      for (let row = 0; row * rowH < h; row++) {
        const offset = row % 2 ? brickW / 2 : 0;
        const y = row * rowH;
        for (let x = -offset; x < w; x += brickW) {
          g.fillStyle = `hsl(${rand(...t.hue)}, ${rand(...t.sat)}%, ${rand(...t.light)}%)`;
          g.fillRect(x + 2, y + 2, brickW - 4, rowH - 4);
          // Bevelled edges: lit from above, shadowed below, so each brick looks raised.
          const bevel = g.createLinearGradient(0, y + 2, 0, y + rowH - 2);
          bevel.addColorStop(0, 'rgba(255, 240, 230, 0.16)');
          bevel.addColorStop(0.15, 'rgba(255, 240, 230, 0)');
          bevel.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
          bevel.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
          g.fillStyle = bevel;
          g.fillRect(x + 2, y + 2, brickW - 4, rowH - 4);
          g.fillStyle = 'rgba(0, 0, 0, 0.25)';
          g.fillRect(x + brickW - 4, y + 2, 2, rowH - 4);
        }
      }
      speckle(g, w, h, 6000, t.speckle, 1, 3, 0.35);
      speckle(g, w, h, 14000, t.speckle, 0.4, 1, 0.3); // fine grit
      cracks(g, w, h, 14, 'rgba(0, 0, 0, 0.55)', 1);
      // Soot (or frost) near the floor.
      const soot = g.createLinearGradient(0, h * 0.6, 0, h);
      soot.addColorStop(0, 'rgba(0, 0, 0, 0)');
      soot.addColorStop(1, t.soot);
      g.fillStyle = soot;
      g.fillRect(0, 0, w, h);
    }, 2)); // drawn at double resolution
  },

  // Rough rock cliffs with a few glowing cracks.
  rock() {
    const t = THEME.rock;
    return canvasTexture(makeCanvas(256, 512, (g, w, h) => {
      g.fillStyle = t.base;
      g.fillRect(0, 0, w, h);
      blotches(g, w, h, 140, t.blotches, 10, 50, 0.3);
      speckle(g, w, h, 7000, t.speckle, 1, 3, 0.45);
      cracks(g, w, h, 35, 'rgba(0, 0, 0, 0.7)', 2);
      cracks(g, w, h, 8, t.glow, 1.5);
    }));
  },

  // Big flagstones for the castle floor: 2x2 stones per map cell.
  castleFloor(repeatX, repeatY) {
    const t = THEME.floor;
    return canvasTexture(makeCanvas(256, 256, (g, w, h) => {
      g.fillStyle = t.grout;
      g.fillRect(0, 0, w, h);
      const s = w / 2;
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          g.fillStyle = `hsl(${rand(...t.hue)}, ${rand(...t.sat)}%, ${rand(...t.light)}%)`;
          g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
        }
      }
      speckle(g, w, h, 4000, t.speckle, 1, 3, 0.35);
      speckle(g, w, h, 9000, t.speckle, 0.4, 1, 0.3); // fine grit
      cracks(g, w, h, 10, 'rgba(0, 0, 0, 0.5)', 1);
      blotches(g, w, h, 3, [t.stain], 12, 30, 0.3);
    }, 2), repeatX, repeatY); // drawn at double resolution
  },

  // The ground outside the castle, cracked with glowing seams.
  ground(repeatX, repeatY) {
    const t = THEME.ground;
    return canvasTexture(makeCanvas(512, 512, (g, w, h) => {
      g.fillStyle = t.base;
      g.fillRect(0, 0, w, h);
      blotches(g, w, h, 120, t.blotches, 10, 45, 0.35);
      speckle(g, w, h, 12000, t.speckle, 1, 3, 0.45);
      cracks(g, w, h, 30, t.crack, 2);
      cracks(g, w, h, 9, t.glow, 1.2);
    }), repeatX, repeatY);
  },

  // Dark stone ceiling crossed by heavy beams.
  ceiling(repeatX, repeatY) {
    const t = THEME.ceiling;
    return canvasTexture(makeCanvas(256, 256, (g, w, h) => {
      g.fillStyle = t.base;
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, 3000, ['#000', '#2a2a2a'], 1, 3, 0.4);
      for (const y of [0, 128]) {
        g.fillStyle = t.beam;
        g.fillRect(0, y, w, 26);
        for (let i = 0; i < 6; i++) {
          g.fillStyle = 'rgba(0, 0, 0, 0.3)';
          g.fillRect(0, y + rand(2, 24), w, 1);
        }
      }
    }), repeatX, repeatY);
  },

  // Glowing pools: molten lava in round 1, freezing water in round 2.
  hazard() {
    const t = THEME.hazard;
    return canvasTexture(makeCanvas(256, 256, (g, w, h) => {
      g.fillStyle = t.base;
      g.fillRect(0, 0, w, h);
      blotches(g, w, h, 40, t.bright, 8, 30, 0.7);
      blotches(g, w, h, 15, t.hot, 3, 10, 0.8);
      blotches(g, w, h, 25, t.crust, 10, 35, 0.7);
      cracks(g, w, h, 10, t.cracks, 2);
    }));
  },

  // Ice elephant hide: wrinkled blue-grey...
  elephantSkin() {
    return canvasTexture(makeCanvas(256, 256, (g, w, h) => {
      g.fillStyle = '#5a6a7c';
      g.fillRect(0, 0, w, h);
      blotches(g, w, h, 60, ['#4a5a6c', '#6a7c90', '#3e4c5c'], 10, 40, 0.4);
      g.lineWidth = 1.5;
      for (let i = 0; i < 260; i++) {
        const x = rand(0, w);
        const y = rand(0, h);
        g.strokeStyle = pick(['rgba(20, 30, 45, 0.5)', 'rgba(150, 170, 190, 0.35)']);
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + rand(5, 12), y + rand(-3, 3), x + rand(12, 26), y + rand(-2, 2));
        g.stroke();
      }
      speckle(g, w, h, 3000, ['#2a3440', '#9ab0c4'], 1, 2, 0.4);
    }));
  },

  // ...cracked with frozen blue fire (used as the glow map).
  elephantCracks() {
    return canvasTexture(makeCanvas(256, 256, (g, w, h) => {
      g.fillStyle = '#000';
      g.fillRect(0, 0, w, h);
      cracks(g, w, h, 26, '#2aa8ff', 2.5);
      cracks(g, w, h, 14, '#c8f4ff', 1);
      speckle(g, w, h, 300, ['#5ad0ff'], 1, 2, 0.6);
    }));
  },

  // The devil: deep red, with darker muscle shading...
  devilSkin() {
    return canvasTexture(makeCanvas(256, 256, (g, w, h) => {
      g.fillStyle = '#8a1410';
      g.fillRect(0, 0, w, h);
      blotches(g, w, h, 50, ['#5a0a08', '#a82018', '#6e0e0a'], 12, 40, 0.5);
      speckle(g, w, h, 4000, ['#3a0404', '#c03020'], 1, 2, 0.4);
      // Tribal tattoos: dark sweeping curves and points.
      g.strokeStyle = 'rgba(30, 0, 0, 0.75)';
      g.lineCap = 'round';
      for (let i = 0; i < 9; i++) {
        let x = rand(0, w);
        let y = rand(0, h);
        g.lineWidth = rand(3, 6);
        g.beginPath();
        g.moveTo(x, y);
        for (let s = 0; s < 3; s++) {
          const cx = x + rand(-40, 40);
          const cy = y + rand(-40, 40);
          x += rand(-50, 50);
          y += rand(-50, 50);
          g.quadraticCurveTo(cx, cy, x, y);
        }
        g.stroke();
      }
    }));
  },

  // ...and veins of hellfire.
  devilVeins() {
    return canvasTexture(makeCanvas(256, 256, (g, w, h) => {
      g.fillStyle = '#000';
      g.fillRect(0, 0, w, h);
      cracks(g, w, h, 18, '#ff7a10', 2);
      cracks(g, w, h, 10, '#ffd040', 1);
    }));
  },

  // Hellhound skin: charred and dark...
  houndSkin() {
    return canvasTexture(makeCanvas(128, 128, (g, w, h) => {
      g.fillStyle = '#2a1610';
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, 2500, ['#000', '#3a2018', '#120806'], 1, 3, 0.5);
    }));
  },

  // ...with burning cracks (used as the glow map).
  houndCracks() {
    return canvasTexture(makeCanvas(128, 128, (g, w, h) => {
      g.fillStyle = '#000';
      g.fillRect(0, 0, w, h);
      cracks(g, w, h, 22, '#ff6a10', 2);
      cracks(g, w, h, 10, '#ffd040', 1);
      speckle(g, w, h, 300, ['#ff5a00'], 1, 2, 0.6);
    }));
  },

  // A white angel feather (see-through around the edges) with a golden quill.
  feather() {
    const texture = colorTexture(makeCanvas(64, 256, (g, w, h) => {
      g.beginPath();
      g.moveTo(w / 2, 4);
      g.bezierCurveTo(w - 2, 40, w - 4, 200, w / 2, h - 4);
      g.bezierCurveTo(4, 200, 2, 40, w / 2, 4);
      g.closePath();
      const vane = g.createLinearGradient(0, 0, w, 0);
      vane.addColorStop(0, '#d4d8e2');
      vane.addColorStop(0.5, '#ffffff');
      vane.addColorStop(1, '#e6e2da');
      g.fillStyle = vane;
      g.fill();
      g.save();
      g.clip();
      g.strokeStyle = 'rgba(150, 150, 170, 0.35)';
      g.lineWidth = 1;
      for (let y = 10; y < h; y += 5) {
        g.beginPath();
        g.moveTo(0, y + 10);
        g.lineTo(w / 2, y);
        g.lineTo(w, y + 10);
        g.stroke();
      }
      const tip = g.createLinearGradient(0, h * 0.7, 0, h);
      tip.addColorStop(0, 'rgba(255, 220, 140, 0)');
      tip.addColorStop(1, 'rgba(255, 220, 140, 0.5)');
      g.fillStyle = tip;
      g.fillRect(0, 0, w, h);
      g.restore();
      g.strokeStyle = '#c8a860';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(w / 2, 2);
      g.lineTo(w / 2, h - 10);
      g.stroke();
    }));
    return texture;
  },

  // Glazed white porcelain painted with blue Delft-style vines, curls, flowers and birds.
  porcelain() {
    return canvasTexture(makeCanvas(512, 256, (g, w, h) => {
      g.fillStyle = '#f5f6f8';
      g.fillRect(0, 0, w, h);
      const blues = ['#1f3f95', '#2a52b0', '#3a64c4'];
      g.lineCap = 'round';
      // Long scrolling vines.
      for (let i = 0; i < 8; i++) {
        g.strokeStyle = pick(blues);
        g.lineWidth = rand(2, 4);
        let x = rand(0, w);
        let y = rand(0, h);
        g.beginPath();
        g.moveTo(x, y);
        for (let s = 0; s < 5; s++) {
          const cx = x + rand(-60, 60);
          const cy = y + rand(-50, 50);
          x += rand(-80, 80);
          y += rand(-50, 50);
          g.quadraticCurveTo(cx, cy, x, y);
        }
        g.stroke();
      }
      // Little curls.
      for (let i = 0; i < 34; i++) {
        const cx = rand(0, w);
        const cy = rand(0, h);
        const r = rand(6, 16);
        g.strokeStyle = pick(blues);
        g.lineWidth = 1.5;
        g.beginPath();
        for (let a = 0; a < Math.PI * 3; a += 0.2) {
          const rr = r * (1 - a / (Math.PI * 3.2));
          g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        }
        g.stroke();
      }
      // Leaves.
      for (let i = 0; i < 70; i++) {
        g.fillStyle = pick(blues);
        g.beginPath();
        g.ellipse(rand(0, w), rand(0, h), rand(3, 8), rand(1.5, 3), rand(0, Math.PI), 0, Math.PI * 2);
        g.fill();
      }
      // Flowers.
      for (let i = 0; i < 12; i++) {
        const cx = rand(0, w);
        const cy = rand(0, h);
        const r = rand(7, 13);
        g.fillStyle = pick(blues);
        for (let p = 0; p < 6; p++) {
          const a = (p / 6) * Math.PI * 2;
          g.beginPath();
          g.ellipse(cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7, r * 0.45, r * 0.25, a, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = '#f5f6f8';
        g.beginPath();
        g.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
        g.fill();
      }
      // Birds in flight.
      for (let i = 0; i < 4; i++) {
        const cx = rand(20, w - 20);
        const cy = rand(20, h - 20);
        g.fillStyle = pick(blues);
        g.beginPath();
        g.ellipse(cx, cy, 10, 4, -0.3, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.moveTo(cx - 2, cy - 2);
        g.quadraticCurveTo(cx - 8, cy - 16, cx + 6, cy - 18);
        g.quadraticCurveTo(cx + 2, cy - 8, cx + 4, cy - 2);
        g.fill();
      }
    }, 2));
  },

  // Engraved silver scrollwork for the shotgun's receiver plates.
  engraving() {
    return canvasTexture(makeCanvas(256, 128, (g, w, h) => {
      g.fillStyle = '#b8bcc4';
      g.fillRect(0, 0, w, h);
      g.lineWidth = 2;
      for (let i = 0; i < 22; i++) {
        const cx = rand(0, w);
        const cy = rand(0, h);
        const r = rand(8, 20);
        g.strokeStyle = pick(['#5a5e68', '#70747e']);
        g.beginPath();
        for (let a = 0; a < Math.PI * 3.5; a += 0.15) {
          const rr = r * (1 - a / (Math.PI * 3.7));
          g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        }
        g.stroke();
      }
      g.strokeStyle = '#4a4e58';
      g.lineWidth = 3;
      g.strokeRect(4, 4, w - 8, h - 8);
    }, 2));
  },

  // The "UT FLAK SHOTGUN" lettering on the front grip (see-through background).
  flakLabel() {
    return colorTexture(makeCanvas(256, 48, (g, w, h) => {
      g.fillStyle = '#2a3442';
      g.font = 'bold 30px "Arial Black", Impact, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('UT FLAK SHOTGUN', w / 2, h / 2 + 1);
    }, 2));
  },

  // Black leather with creases (jacket, trousers, boots).
  leather() {
    return canvasTexture(makeCanvas(256, 256, (g, w, h) => {
      g.fillStyle = '#141212';
      g.fillRect(0, 0, w, h);
      blotches(g, w, h, 40, ['#0a0909', '#22201f'], 10, 40, 0.5);
      speckle(g, w, h, 4000, ['#000', '#2c2a28'], 1, 2, 0.5);
      g.strokeStyle = 'rgba(70, 66, 62, 0.5)';
      g.lineWidth = 1;
      for (let i = 0; i < 40; i++) {
        const x = rand(0, w);
        const y = rand(0, h);
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + rand(-10, 10), y + rand(5, 15), x + rand(-20, 20), y + rand(15, 35));
        g.stroke();
      }
    }));
  },

  // The patch on the devil's jacket.
  patch() {
    return colorTexture(makeCanvas(128, 64, (g, w, h) => {
      g.fillStyle = '#1a0606';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#a01010';
      g.setLineDash([4, 3]);
      g.lineWidth = 2;
      g.strokeRect(4, 4, w - 8, h - 8);
      g.fillStyle = '#e02020';
      g.font = 'bold 22px Impact, "Arial Black", sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('HELLKEEP', w / 2, h / 2 + 1);
    }, 2));
  },

  // A bullet hole: dark pit with a scorched ring and a few cracks (see-through around it).
  bulletHole() {
    return colorTexture(makeCanvas(64, 64, (g, w, h) => {
      const scorch = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      scorch.addColorStop(0, 'rgba(0, 0, 0, 1)');
      scorch.addColorStop(0.18, 'rgba(10, 8, 6, 0.95)');
      scorch.addColorStop(0.3, 'rgba(30, 20, 14, 0.6)');
      scorch.addColorStop(1, 'rgba(20, 14, 10, 0)');
      g.fillStyle = scorch;
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      g.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const a = rand(0, Math.PI * 2);
        g.beginPath();
        g.moveTo(w / 2 + Math.cos(a) * 6, h / 2 + Math.sin(a) * 6);
        g.lineTo(w / 2 + Math.cos(a + rand(-0.3, 0.3)) * rand(14, 24), h / 2 + Math.sin(a + rand(-0.3, 0.3)) * rand(14, 24));
        g.stroke();
      }
    }, 2));
  },

  // Soft round dot used for fire, sparks and glows.
  glow() {
    return colorTexture(makeCanvas(64, 64, (g, w, h) => {
      const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.6)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }));
  },

  // Sky with a glowing horizon and drifting clouds of smoke (or snow).
  sky() {
    return colorTexture(makeCanvas(512, 256, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      for (const [stop, color] of THEME.sky) grad.addColorStop(stop, color);
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      g.save();
      g.beginPath();
      g.rect(0, 0, w, h * 0.48);
      g.clip();
      blotches(g, w, h * 0.48, 60, THEME.skyClouds, 20, 70, 0.35);
      blotches(g, w, h * 0.48, 20, [THEME.skyGlow], 10, 40, 0.08);
      g.restore();
    }));
  },

  // Olive-green ammo crate.
  ammoCrate() {
    return canvasTexture(makeCanvas(256, 160, (g, w, h) => {
      g.fillStyle = '#3d4a26';
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, 1500, ['#000', '#5a6a3a'], 1, 3, 0.3);
      g.strokeStyle = '#1f2712';
      g.lineWidth = 10;
      g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = '#e0c860';
      g.font = 'bold 54px Impact, Arial Black, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('AMMO', w / 2, 58);
      for (let i = 0; i < 6; i++) {
        const x = 48 + i * 32;
        g.fillStyle = '#c8902a';
        g.fillRect(x - 6, 104, 12, 30);
        g.fillStyle = '#e0b860';
        g.beginPath();
        g.arc(x, 104, 6, Math.PI, 0);
        g.fill();
      }
    }));
  },

  // White medkit with a red cross.
  healthBox() {
    return canvasTexture(makeCanvas(256, 256, (g, w, h) => {
      g.fillStyle = '#d8d2c8';
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, 1200, ['#9a948a'], 1, 3, 0.3);
      g.strokeStyle = '#8a847a';
      g.lineWidth = 12;
      g.strokeRect(6, 6, w - 12, h - 12);
      g.fillStyle = '#c01010';
      g.fillRect(w / 2 - 28, 40, 56, h - 80);
      g.fillRect(40, h / 2 - 28, w - 80, 56);
    }));
  },

  // Tattered red war banner with a golden flame sigil. The notch at the bottom is see-through.
  banner() {
    return colorTexture(makeCanvas(128, 256, (g, w, h) => {
      const shape = () => {
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(w, 0);
        g.lineTo(w, h);
        g.lineTo(w / 2, h - 46);
        g.lineTo(0, h);
        g.closePath();
      };
      shape();
      const cloth = g.createLinearGradient(0, 0, w, 0);
      cloth.addColorStop(0, THEME.banner.dark);
      cloth.addColorStop(0.5, THEME.banner.mid);
      cloth.addColorStop(1, THEME.banner.dark);
      g.fillStyle = cloth;
      g.fill();
      g.save();
      g.clip();
      speckle(g, w, h, 1500, ['#000', '#9a1a10'], 1, 2, 0.3);
      g.restore();
      g.strokeStyle = THEME.banner.trim;
      g.lineWidth = 4;
      g.strokeRect(10, 10, w - 20, h - 80);
      // Sigil: a ring with a flame inside and two horns.
      g.lineWidth = 5;
      g.beginPath();
      g.arc(w / 2, 100, 32, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = THEME.banner.flame;
      g.beginPath();
      g.moveTo(w / 2, 72);
      g.bezierCurveTo(w / 2 + 22, 95, w / 2 + 14, 122, w / 2, 124);
      g.bezierCurveTo(w / 2 - 14, 122, w / 2 - 22, 95, w / 2, 72);
      g.fill();
      g.fillStyle = THEME.banner.trim;
      for (const side of [-1, 1]) {
        g.beginPath();
        g.moveTo(w / 2 + side * 24, 78);
        g.quadraticCurveTo(w / 2 + side * 48, 60, w / 2 + side * 40, 38);
        g.quadraticCurveTo(w / 2 + side * 38, 62, w / 2 + side * 16, 74);
        g.fill();
      }
    }));
  },
};
