// Procedural textures drawn on canvases, so the game needs no image files.

function makeCanvas(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  return canvas;
}

function canvasTexture(canvas, repeatX = 1, repeatY = 1) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
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
  // Dark red-brown castle bricks. Sized for one wall face (4 wide x 7 tall).
  castleWall() {
    return canvasTexture(makeCanvas(256, 448, (g, w, h) => {
      g.fillStyle = '#120c0a';
      g.fillRect(0, 0, w, h);
      const rowH = 32;
      const brickW = 64;
      for (let row = 0; row * rowH < h; row++) {
        const offset = row % 2 ? brickW / 2 : 0;
        const y = row * rowH;
        for (let x = -offset; x < w; x += brickW) {
          g.fillStyle = `hsl(${rand(4, 18)}, ${rand(12, 24)}%, ${rand(20, 32)}%)`;
          g.fillRect(x + 2, y + 2, brickW - 4, rowH - 4);
          g.fillStyle = 'rgba(255, 220, 200, 0.08)';
          g.fillRect(x + 2, y + 2, brickW - 4, 3);
          g.fillStyle = 'rgba(0, 0, 0, 0.35)';
          g.fillRect(x + 2, y + rowH - 5, brickW - 4, 3);
        }
      }
      speckle(g, w, h, 6000, ['#000', '#3a2a24', '#6a4a3a'], 1, 3, 0.35);
      cracks(g, w, h, 14, 'rgba(0, 0, 0, 0.55)', 1);
      // Soot and old blood near the floor.
      const soot = g.createLinearGradient(0, h * 0.6, 0, h);
      soot.addColorStop(0, 'rgba(0, 0, 0, 0)');
      soot.addColorStop(1, 'rgba(25, 0, 0, 0.6)');
      g.fillStyle = soot;
      g.fillRect(0, 0, w, h);
    }));
  },

  // Rough hell rock with a few glowing cracks.
  rock() {
    return canvasTexture(makeCanvas(256, 512, (g, w, h) => {
      g.fillStyle = '#2e1610';
      g.fillRect(0, 0, w, h);
      blotches(g, w, h, 140, ['#120806', '#4a2218', '#3a1a12'], 10, 50, 0.3);
      speckle(g, w, h, 7000, ['#000', '#5a2a1c', '#1a0a06'], 1, 3, 0.45);
      cracks(g, w, h, 35, 'rgba(0, 0, 0, 0.7)', 2);
      cracks(g, w, h, 8, 'rgba(255, 90, 20, 0.6)', 1.5);
    }));
  },

  // Big flagstones for the castle floor: 2x2 stones per map cell.
  castleFloor(repeatX, repeatY) {
    return canvasTexture(makeCanvas(256, 256, (g, w, h) => {
      g.fillStyle = '#0e0a09';
      g.fillRect(0, 0, w, h);
      const s = w / 2;
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          g.fillStyle = `hsl(${rand(0, 15)}, ${rand(6, 16)}%, ${rand(17, 25)}%)`;
          g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
        }
      }
      speckle(g, w, h, 4000, ['#000', '#3a2a24', '#5a4034'], 1, 3, 0.35);
      cracks(g, w, h, 10, 'rgba(0, 0, 0, 0.5)', 1);
      blotches(g, w, h, 3, ['#3a0503'], 12, 30, 0.3);
    }), repeatX, repeatY);
  },

  // Scorched ground outside the castle, cracked with glowing seams.
  ground(repeatX, repeatY) {
    return canvasTexture(makeCanvas(512, 512, (g, w, h) => {
      g.fillStyle = '#221009';
      g.fillRect(0, 0, w, h);
      blotches(g, w, h, 120, ['#0e0604', '#3a1a10', '#2a120a'], 10, 45, 0.35);
      speckle(g, w, h, 12000, ['#000', '#4a2414', '#140804'], 1, 3, 0.45);
      cracks(g, w, h, 30, 'rgba(0, 0, 0, 0.75)', 2);
      cracks(g, w, h, 9, 'rgba(255, 100, 20, 0.55)', 1.2);
    }), repeatX, repeatY);
  },

  // Dark stone ceiling crossed by heavy wooden beams.
  ceiling(repeatX, repeatY) {
    return canvasTexture(makeCanvas(256, 256, (g, w, h) => {
      g.fillStyle = '#150e0b';
      g.fillRect(0, 0, w, h);
      speckle(g, w, h, 3000, ['#000', '#2a1a14'], 1, 3, 0.4);
      for (const y of [0, 128]) {
        g.fillStyle = '#2a170c';
        g.fillRect(0, y, w, 26);
        for (let i = 0; i < 6; i++) {
          g.fillStyle = 'rgba(0, 0, 0, 0.3)';
          g.fillRect(0, y + rand(2, 24), w, 1);
        }
      }
    }), repeatX, repeatY);
  },

  // Bright molten lava with dark floating crust.
  lava() {
    return canvasTexture(makeCanvas(256, 256, (g, w, h) => {
      g.fillStyle = '#e04a00';
      g.fillRect(0, 0, w, h);
      blotches(g, w, h, 40, ['#ffb020', '#ff7a10'], 8, 30, 0.7);
      blotches(g, w, h, 15, ['#ffe070'], 3, 10, 0.8);
      blotches(g, w, h, 25, ['#2a0602', '#4a0e04'], 10, 35, 0.7);
      cracks(g, w, h, 10, 'rgba(255, 220, 80, 0.8)', 2);
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

  // Soft round dot used for fire, sparks and glows.
  glow() {
    return new THREE.CanvasTexture(makeCanvas(64, 64, (g, w, h) => {
      const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.6)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }));
  },

  // Burning red sky with a glowing horizon and drifting smoke.
  sky() {
    return new THREE.CanvasTexture(makeCanvas(512, 256, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#070101');
      grad.addColorStop(0.3, '#2a0603');
      grad.addColorStop(0.46, '#8a2208');
      grad.addColorStop(0.5, '#d04a10');
      grad.addColorStop(0.54, '#3a0804');
      grad.addColorStop(1, '#0a0202');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      g.save();
      g.beginPath();
      g.rect(0, 0, w, h * 0.48);
      g.clip();
      blotches(g, w, h * 0.48, 60, ['#000', '#1a0302'], 20, 70, 0.35);
      blotches(g, w, h * 0.48, 20, ['#ff5a10'], 10, 40, 0.08);
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
    return new THREE.CanvasTexture(makeCanvas(128, 256, (g, w, h) => {
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
      cloth.addColorStop(0, '#3a0303');
      cloth.addColorStop(0.5, '#7a0a08');
      cloth.addColorStop(1, '#3a0303');
      g.fillStyle = cloth;
      g.fill();
      g.save();
      g.clip();
      speckle(g, w, h, 1500, ['#000', '#9a1a10'], 1, 2, 0.3);
      g.restore();
      g.strokeStyle = '#c89a3a';
      g.lineWidth = 4;
      g.strokeRect(10, 10, w - 20, h - 80);
      // Sigil: a ring with a flame inside and two horns.
      g.lineWidth = 5;
      g.beginPath();
      g.arc(w / 2, 100, 32, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = '#ff9a20';
      g.beginPath();
      g.moveTo(w / 2, 72);
      g.bezierCurveTo(w / 2 + 22, 95, w / 2 + 14, 122, w / 2, 124);
      g.bezierCurveTo(w / 2 - 14, 122, w / 2 - 22, 95, w / 2, 72);
      g.fill();
      g.fillStyle = '#c89a3a';
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
