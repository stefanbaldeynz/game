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

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function speckle(g, w, h, count, colors, minSize, maxSize, alpha) {
  for (let i = 0; i < count; i++) {
    g.globalAlpha = rand(alpha * 0.3, alpha);
    g.fillStyle = pick(colors);
    const s = rand(minSize, maxSize);
    g.fillRect(rand(0, w), rand(0, h), s, s);
  }
  g.globalAlpha = 1;
}

function blotches(g, w, h, count, colors, minR, maxR, alpha) {
  for (let i = 0; i < count; i++) {
    g.globalAlpha = rand(alpha * 0.4, alpha);
    g.fillStyle = pick(colors);
    g.beginPath();
    g.ellipse(rand(0, w), rand(0, h), rand(minR, maxR), rand(minR, maxR) * 0.7, rand(0, Math.PI), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

// Short strokes: grass blades, feathers, hair.
function strokes(g, w, h, count, colors, minLen, maxLen, angle, angleJitter, alpha) {
  g.lineWidth = 1;
  for (let i = 0; i < count; i++) {
    const x = rand(0, w);
    const y = rand(0, h);
    const a = angle + rand(-angleJitter, angleJitter);
    const len = rand(minLen, maxLen);
    g.globalAlpha = rand(alpha * 0.4, alpha);
    g.strokeStyle = pick(colors);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
  g.globalAlpha = 1;
}

const Textures = {
  // Tussocky green grass for the canyon rim.
  grass(repeatX = 1, repeatY = 1) {
    return canvasTexture(makeCanvas(256, 256, (g, w, h) => {
      g.fillStyle = '#56802e';
      g.fillRect(0, 0, w, h);
      blotches(g, w, h, 60, ['#4a7028', '#62903a', '#7a9a40', '#9a9a50'], 10, 40, 0.35);
      strokes(g, w, h, 3000, ['#3e6420', '#6e9a3a', '#8aab4a', '#b5a95a'], 3, 8, -Math.PI / 2, 0.5, 0.8);
    }), repeatX, repeatY);
  },

  // Layered rock for the canyon walls, mossy at the top and damp at the bottom.
  canyonWall() {
    return canvasTexture(makeCanvas(512, 768, (g, w, h) => {
      const palette = ['#8a7a66', '#9c8b72', '#7a6a58', '#a89478', '#6e6052', '#b09a7a', '#857565'];
      let y = 0;
      while (y < h) {
        const band = rand(20, 70);
        g.fillStyle = pick(palette);
        g.fillRect(0, y, w, band + 1);
        g.fillStyle = 'rgba(40, 30, 20, 0.35)';
        g.fillRect(0, y, w, 3);
        y += band;
      }
      blotches(g, w, h, 90, ['#5a4a3a', '#b0a088', '#7a6a58'], 15, 60, 0.18);
      speckle(g, w, h, 16000, ['#4a3e32', '#b8a88a', '#6a5a4a'], 1, 2.5, 0.18);
      g.strokeStyle = 'rgba(30, 20, 10, 0.45)';
      g.lineWidth = 2.5;
      for (let i = 0; i < 16; i++) {
        let x = rand(0, w);
        let cy = rand(0, h * 0.5);
        g.beginPath();
        g.moveTo(x, cy);
        for (let s = 0; s < 8; s++) {
          x += rand(-10, 10);
          cy += rand(20, 50);
          g.lineTo(x, cy);
        }
        g.stroke();
      }
      const moss = g.createLinearGradient(0, 0, 0, 80);
      moss.addColorStop(0, 'rgba(70, 110, 40, 0.95)');
      moss.addColorStop(1, 'rgba(70, 110, 40, 0)');
      g.fillStyle = moss;
      g.fillRect(0, 0, w, 80);
      blotches(g, w, 100, 30, ['#4a7a2a', '#3a6020'], 8, 28, 0.6);
      const damp = g.createLinearGradient(0, h - 160, 0, h);
      damp.addColorStop(0, 'rgba(20, 15, 10, 0)');
      damp.addColorStop(1, 'rgba(20, 15, 10, 0.45)');
      g.fillStyle = damp;
      g.fillRect(0, 0, w, h);
    }));
  },

  // River gravel for the canyon floor.
  gravel(repeatX, repeatY) {
    return canvasTexture(makeCanvas(256, 256, (g, w, h) => {
      g.fillStyle = '#7d766c';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        const x = rand(0, w);
        const y = rand(0, h);
        const r = rand(2, 7);
        g.fillStyle = pick(['#8e877c', '#6a645b', '#a39c90', '#5d6670', '#7b6f60', '#958a78']);
        g.beginPath();
        g.ellipse(x, y, r, r * rand(0.6, 0.9), rand(0, Math.PI), 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(255, 255, 255, 0.12)';
        g.beginPath();
        g.ellipse(x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.25, 0, 0, Math.PI * 2);
        g.fill();
      }
      speckle(g, w, h, 3000, ['#000', '#c8c0b0'], 1, 2, 0.3);
      blotches(g, w, h, 12, ['#4a463f'], 15, 40, 0.15);
    }), repeatX, repeatY);
  },

  // Shaggy brown kiwi feathers.
  kiwiFeathers() {
    return canvasTexture(makeCanvas(128, 128, (g, w, h) => {
      g.fillStyle = '#6e4c2c';
      g.fillRect(0, 0, w, h);
      strokes(g, w, h, 2200, ['#4a3018', '#8a6640', '#3a2412', '#9a7a50'], 2, 7, Math.PI / 2, 0.6, 0.7);
    }));
  },

  // Stacked stone for tower bases.
  stone() {
    return canvasTexture(makeCanvas(128, 128, (g, w, h) => {
      g.fillStyle = '#3a3632';
      g.fillRect(0, 0, w, h);
      const rowH = 21;
      for (let row = 0; row * rowH < h; row++) {
        const offset = row % 2 ? 16 : 0;
        for (let x = -offset; x < w; x += 32) {
          g.fillStyle = `hsl(${rand(25, 40)}, ${rand(5, 14)}%, ${rand(42, 58)}%)`;
          g.fillRect(x + 1.5, row * rowH + 1.5, 29, rowH - 3);
        }
      }
      speckle(g, w, h, 1500, ['#000', '#ddd'], 1, 2, 0.25);
    }), 3, 1);
  },

  // Timber planks.
  wood() {
    return canvasTexture(makeCanvas(128, 128, (g, w, h) => {
      g.fillStyle = '#7a5230';
      g.fillRect(0, 0, w, h);
      strokes(g, w, h, 500, ['#5a3a1e', '#8a6038'], 10, 40, 0, 0.05, 0.6);
      g.fillStyle = 'rgba(0, 0, 0, 0.35)';
      for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 2);
    }));
  },

  // A tree-fern frond (see-through around the leaflets).
  fernFrond() {
    return new THREE.CanvasTexture(makeCanvas(64, 256, (g, w, h) => {
      g.strokeStyle = '#3a5a1e';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(w / 2, h);
      g.lineTo(w / 2, 4);
      g.stroke();
      for (let y = h - 6; y > 6; y -= 7) {
        const t = 1 - y / h; // 0 at the base, 1 at the tip
        const len = 28 * Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.08));
        for (const side of [-1, 1]) {
          g.fillStyle = pick(['#3f7a2a', '#4a8a30', '#5a9a38']);
          g.beginPath();
          g.ellipse(w / 2 + side * len / 2, y - 2, len / 2, 3, side * -0.3, 0, Math.PI * 2);
          g.fill();
        }
      }
    }));
  },

  // Soft blue sky with a pale horizon.
  sky() {
    return new THREE.CanvasTexture(makeCanvas(4, 256, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#2a6cc0');
      grad.addColorStop(0.35, '#69a6e0');
      grad.addColorStop(0.5, '#d4e8f4');
      grad.addColorStop(1, '#cfe3ee');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }));
  },

  // Puffy cloud made of soft white circles.
  cloud() {
    return new THREE.CanvasTexture(makeCanvas(256, 128, (g, w, h) => {
      for (let i = 0; i < 14; i++) {
        const x = rand(50, w - 50);
        const y = rand(50, h - 35);
        const r = rand(22, 42);
        const grad = g.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        g.fillStyle = grad;
        g.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }));
  },

  // Soft round dot for dust, sparks and glows.
  softDot() {
    return new THREE.CanvasTexture(makeCanvas(64, 64, (g, w, h) => {
      const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }));
  },

  // A single feather shape, tinted brown by the particle system.
  feather() {
    return new THREE.CanvasTexture(makeCanvas(64, 64, (g) => {
      g.fillStyle = '#fff';
      g.beginPath();
      g.ellipse(32, 32, 9, 26, 0.5, 0, Math.PI * 2);
      g.fill();
    }));
  },
};
