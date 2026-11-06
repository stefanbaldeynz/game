// The three arenas. Each is painted once into layers that scroll at different speeds,
// plus a few moving things drawn every frame.

function skyBands(c, w, h, colors) {
  const band = h / colors.length;
  colors.forEach((col, i) => {
    const y = Math.round(i * band);
    rect(c, 0, y, w, Math.ceil(band) + 1, col);
    // a row of dither between bands, the way the old consoles faked gradients
    if (i < colors.length - 1) {
      c.fillStyle = colors[i + 1];
      const ey = Math.round((i + 1) * band);
      for (let x = 0; x < w; x += 2) c.fillRect(x, ey - 1, 1, 1);
      for (let x = 1; x < w; x += 4) c.fillRect(x, ey - 3, 1, 1);
    }
  });
}

function cloud(c, x, y, s, col, shade) {
  oval(c, x, y, 18 * s, 5 * s, shade);
  oval(c, x - 9 * s, y - 3 * s, 9 * s, 5 * s, col);
  oval(c, x + 5 * s, y - 5 * s, 11 * s, 6 * s, col);
  oval(c, x + 13 * s, y - 2 * s, 8 * s, 4 * s, col);
}

function windows(c, x, y, w, h, gapX, gapY, col, rnd, chance = 1, alt) {
  for (let yy = y; yy < y + h; yy += gapY) {
    for (let xx = x; xx < x + w; xx += gapX) {
      if (rnd && rnd() > chance) continue;
      c.fillStyle = alt && rnd && rnd() < 0.25 ? alt : col;
      c.fillRect(xx, yy, 1, 2);
    }
  }
}

function paving(c, w, y0, y1, colA, colB, seam, rnd) {
  rect(c, 0, y0, w, y1 - y0, colA);
  let rowH = 3, y = y0, row = 0;
  while (y < y1) {
    rect(c, 0, y, w, 1, seam);
    const brick = 8 + rowH * 3, off = row % 2 ? brick >> 1 : 0;
    for (let x = -off; x < w; x += brick) {
      c.fillStyle = seam; c.fillRect(x, y, 1, rowH);
      if (rnd() < 0.3) { c.fillStyle = colB; c.fillRect(x + 1, y + 1, brick - 1, rowH - 1); }
    }
    y += rowH; rowH += 1; row++;
  }
}

function buildLondon() {
  const rnd = seeded(7);
  const sky = makeCanvas(W, H, (c) => skyBands(c, W, 180, ['#27366e', '#34468a', '#4f5aa0', '#7b6aa8', '#b67a9a', '#e8927e', '#f6b070', '#fbd088']));
  const bw = 528;
  const back = makeCanvas(bw, H, (c) => {
    // distant city haze
    for (let x = 0; x < bw;) {
      const w = 10 + rnd() * 22, h = 10 + rnd() * 34;
      rect(c, x, 158 - h, w, h, '#8a6a92');
      x += w + rnd() * 3;
    }
    // Palace of Westminster
    const stone = '#a68a5e', dark = '#6f5a3e', hi = '#c8ac78';
    rect(c, 30, 122, 112, 38, stone);
    rect(c, 30, 122, 112, 3, hi);
    for (let x = 34; x < 140; x += 7) {
      rect(c, x, 113, 2, 10, stone);
      rect(c, x, 111, 2, 2, hi);
      rect(c, x, 128, 3, 26, dark);
    }
    rect(c, 30, 140, 112, 2, hi);
    // Victoria Tower
    rect(c, 28, 86, 20, 74, stone);
    rect(c, 28, 86, 3, 74, hi);
    for (let i = 0; i < 4; i++) rect(c, 26 + i * 8, 78, 3, 9, stone);
    rect(c, 33, 92, 3, 22, dark); rect(c, 40, 92, 3, 22, dark);
    // Big Ben
    rect(c, 142, 58, 16, 102, stone);
    rect(c, 142, 58, 3, 102, hi);
    rect(c, 155, 58, 3, 102, dark);
    for (let y = 92; y < 160; y += 6) rect(c, 146, y, 8, 3, dark);
    rect(c, 140, 56, 20, 3, hi);
    disc(c, 150, 69, 8, '#2a2010');
    disc(c, 150, 69, 7, '#fff8d8');
    rect(c, 150, 63, 1, 6, '#101010');
    rect(c, 150, 69, 4, 1, '#101010');
    rect(c, 140, 78, 20, 2, hi);
    rect(c, 143, 47, 14, 9, dark);
    rect(c, 145, 49, 2, 7, '#fbd088'); rect(c, 149, 49, 2, 7, '#fbd088'); rect(c, 153, 49, 2, 7, '#fbd088');
    for (let i = 0; i < 12; i++) rect(c, 143 + i * 0.58, 46 - i, 14 - i * 1.16, 1, i % 3 ? stone : hi);
    rect(c, 149, 28, 2, 8, '#ffe070');
    // St Paul's Cathedral
    const pale = '#c9c3bb', paleD = '#8c8690';
    rect(c, 286, 130, 70, 30, pale);
    for (let x = 290; x < 354; x += 5) rect(c, x, 134, 2, 24, paleD);
    rect(c, 284, 128, 74, 3, '#e4ded6');
    rect(c, 303, 114, 36, 15, pale);
    for (let x = 305; x < 338; x += 4) rect(c, x, 116, 1, 12, paleD);
    oval(c, 321, 112, 20, 20, paleD);
    oval(c, 320, 111, 19, 19, '#7c8ca0');
    oval(c, 315, 106, 8, 12, '#9cb0c4');
    rect(c, 298, 113, 46, 18, pale);
    for (let x = 300; x < 343; x += 4) rect(c, x, 115, 1, 14, paleD);
    rect(c, 298, 112, 46, 2, '#e4ded6');
    rect(c, 316, 84, 10, 9, pale);
    rect(c, 319, 72, 4, 12, '#e4ded6');
    rect(c, 320, 64, 2, 9, '#ffd030');
    rect(c, 318, 66, 6, 1, '#ffd030');
    // Tower Bridge
    const blue = '#3a78b0', tw = '#b8a888';
    function tower(x) {
      rect(c, x, 90, 18, 70, tw);
      rect(c, x, 90, 3, 70, '#d8c8a8');
      rect(c, x + 15, 90, 3, 70, '#7c6e58');
      rect(c, x + 5, 98, 3, 8, '#3a3048'); rect(c, x + 11, 98, 3, 8, '#3a3048');
      rect(c, x + 5, 118, 3, 8, '#3a3048'); rect(c, x + 11, 118, 3, 8, '#3a3048');
      for (let i = 0; i < 3; i++) rect(c, x + 1 + i * 7, 80, 3, 11, tw);
      for (let i = 0; i < 6; i++) rect(c, x + 3 + i, 84 - i * 2, 12 - i * 2, 2, '#50607a');
    }
    rect(c, 400, 100, 70, 4, blue); rect(c, 400, 106, 70, 2, blue);
    for (let x = 400; x < 470; x += 5) rect(c, x, 104, 1, 2, '#9ad0f0');
    for (let i = 0; i < 44; i++) {
      const t = i / 44;
      rect(c, 368 + i * 0.75, 148 - 56 * Math.pow(t, 1.5), 1, 3, blue);
      rect(c, 502 - i * 0.75, 148 - 56 * Math.pow(t, 1.5), 1, 3, blue);
    }
    tower(385); tower(467);
    rect(c, 360, 142, 150, 4, '#6a5a50');
    rect(c, 360, 146, 150, 2, blue);
    // the Thames
    rect(c, 0, 158, bw, 24, '#c98870');
    for (let y = 160; y < 182; y += 3) {
      for (let i = 0; i < 26; i++) {
        c.fillStyle = y < 170 ? '#f6b070' : '#8a6a80';
        c.fillRect(rnd() * bw, y, 6 + rnd() * 14, 1);
      }
    }
  });
  const front = makeCanvas(WORLD_W, H, (c) => {
    paving(c, WORLD_W, 184, H, '#70707a', '#7e7e88', '#52525e', rnd);
    rect(c, 0, 178, WORLD_W, 7, '#8e8e96');
    rect(c, 0, 178, WORLD_W, 1, '#c0c0c8');
    rect(c, 0, 184, WORLD_W, 1, '#3a3a44');
    // iron railings and lamps
    rect(c, 0, 166, WORLD_W, 2, '#1e2230');
    for (let x = 0; x < WORLD_W; x += 6) rect(c, x, 167, 1, 11, '#1e2230');
    for (const x of [60, 220, 380, 540]) {
      rect(c, x, 128, 3, 50, '#1e2230');
      rect(c, x - 2, 122, 7, 7, '#1e2230');
      rect(c, x - 1, 123, 5, 5, '#ffe9a0');
      rect(c, x - 2, 176, 7, 3, '#1e2230');
    }
    // phone box
    for (const x of [18, 600]) {
      rect(c, x, 142, 20, 44, '#0a0a12');
      rect(c, x + 1, 143, 18, 42, '#d0181e');
      rect(c, x + 1, 143, 18, 5, '#ff4a3a');
      rect(c, x + 3, 151, 14, 22, '#ffe9c0');
      for (let y = 156; y < 172; y += 5) rect(c, x + 3, y, 14, 1, '#d0181e');
      rect(c, x + 9, 151, 1, 22, '#d0181e');
      glyphs(c, 'TEL', x + 2, 142, 1, '#fff');
    }
  });
  return {
    id: 'london', name: 'LONDON', music: 'london', sky, back, front, backP: 0.5,
    clouds: [[60, 40, 1.1], [200, 26, 0.8], [320, 52, 1.3], [430, 34, 0.9]],
    cloudCol: ['#f6c0a8', '#d898a0'],
    anim(c, cam, t) {
      const ox = -cam * 0.5;
      // the London Eye turns slowly
      const cx = 222 + ox, cy = 104, r = 46;
      rect(c, cx - 1, cy, 2, 2, '#fff');
      limb(c, cx, cy, cx - 16, 160, 3, 3, '#d8dce8');
      limb(c, cx, cy, cx + 16, 160, 3, 3, '#a8acc0');
      const a0 = t * 0.0015;
      for (let i = 0; i < 12; i++) {
        const a = a0 + i * Math.PI / 6;
        limb(c, cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1, 1, 'rgba(230,235,245,0.55)');
      }
      for (let i = 0; i < 120; i++) {
        const a = i / 120 * Math.PI * 2;
        rect(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1, 1, '#f4f6ff');
      }
      for (let i = 0; i < 24; i++) {
        const a = a0 + i * Math.PI / 12;
        const px = cx + Math.cos(a) * (r + 2), py = cy + Math.sin(a) * (r + 2);
        rect(c, px - 1, py - 1, 3, 3, i % 6 ? '#e8f4ff' : '#ff8a8a');
      }
      // a red bus on Tower Bridge
      const bx = 360 + ((t * 0.25) % 170) + ox;
      rect(c, bx, 135, 11, 7, '#d0181e');
      rect(c, bx + 1, 136, 9, 2, '#ffe9c0');
      rect(c, bx + 1, 139, 9, 1, '#ffe9c0');
      rect(c, bx + 2, 142, 2, 1, '#101010'); rect(c, bx + 7, 142, 2, 1, '#101010');
      // the river glitters
      for (let i = 0; i < 16; i++) {
        const x = ((i * 53 + t * 0.2 * (1 + i % 3)) % (W + 20)) - 10, y = 160 + (i * 7) % 20;
        rect(c, x, y, 3 + (i % 3), 1, '#ffe0b0');
      }
    },
    over() {},
  };
}

function buildBerlin() {
  const rnd = seeded(23);
  const sky = makeCanvas(W, H, (c) => skyBands(c, W, 180, ['#1e6ad0', '#2a7ee0', '#3e92ea', '#5aa8f0', '#7cc0f4', '#a0d4f8', '#c4e4fa', '#e4f2fb']));
  const bw = 528;
  const back = makeCanvas(bw, H, (c) => {
    // distant blocks
    for (let x = 0; x < bw;) {
      const w = 14 + rnd() * 20, h = 8 + rnd() * 26;
      rect(c, x, 150 - h, w, h, '#a4c0d8');
      x += w + rnd() * 3;
    }
    // Fernsehturm
    const fx = 118;
    for (let y = 40; y < 150; y++) {
      const w = y < 74 ? 2 : Math.round(4 + (y - 74) * 0.1);
      rect(c, fx - (w >> 1), y, w, 1, y < 74 ? (y % 8 < 4 ? '#e03020' : '#ffffff') : '#d8dce4');
      if (y >= 74) rect(c, fx - (w >> 1), y, 1, 1, '#ffffff');
      if (y >= 74) rect(c, fx + (w >> 1) - 1, y, 1, 1, '#98a0b0');
    }
    disc(c, fx, 68, 13, '#50586c');
    disc(c, fx, 68, 12, '#b8c4d4');
    oval(c, fx - 4, 63, 5, 4, '#f0f4fa');
    rect(c, fx - 12, 67, 24, 3, '#3a4258');
    for (let x = fx - 11; x < fx + 11; x += 3) rect(c, x, 68, 1, 1, '#ffe080');
    // trees
    const leaf = () => (rnd() < 0.5 ? '#3a8a3a' : '#2c7434');
    for (let x = 0; x < bw; x += 13) {
      oval(c, x + rnd() * 6, 148 + rnd() * 4, 11, 12, leaf());
      oval(c, x + rnd() * 6, 146 + rnd() * 4, 7, 7, '#58a848');
    }
    // the Reichstag
    const s = '#c4b088', d = '#8c7a58', l = '#e2d2aa', g = '#4a4034';
    rect(c, 168, 104, 214, 58, s);
    rect(c, 168, 104, 214, 3, l);
    rect(c, 168, 132, 214, 2, l);
    for (let x = 172; x < 378; x += 6) {
      rect(c, x, 110, 3, 18, g);
      rect(c, x, 137, 3, 18, g);
    }
    // corner towers
    for (const x of [160, 356]) {
      rect(c, x, 90, 34, 72, s);
      rect(c, x, 90, 3, 72, l);
      rect(c, x + 31, 90, 3, 72, d);
      rect(c, x - 2, 88, 38, 3, l);
      for (let i = 0; i < 4; i++) {
        rect(c, x + 5 + i * 7, 96, 3, 24, g);
        rect(c, x + 5 + i * 7, 126, 3, 28, g);
      }
      // flag
      rect(c, x + 16, 70, 1, 18, '#3a3a3a');
      rect(c, x + 17, 70, 12, 3, '#111111');
      rect(c, x + 17, 73, 12, 3, '#dd0000');
      rect(c, x + 17, 76, 12, 3, '#ffce00');
    }
    // glass dome
    const dx = 275, dy = 100;
    oval(c, dx, dy, 34, 34, '#3a5a78');
    oval(c, dx, dy, 33, 33, '#a4d4ec');
    oval(c, dx - 8, dy - 12, 14, 14, '#d4f0fc');
    for (let a = -3; a <= 3; a++) {
      const x = dx + a * 10;
      for (let y = dy - 33; y < dy; y++) {
        const k = 1 - Math.pow((y - dy) / 33, 2);
        const px = dx + (x - dx) * Math.sqrt(Math.max(0, k));
        rect(c, px, y, 1, 1, '#5a7a98');
      }
    }
    for (let y = dy - 28; y < dy; y += 7) {
      const hw = Math.sqrt(Math.max(0, 33 * 33 - (y - dy) * (y - dy)));
      rect(c, dx - hw, y, hw * 2, 1, '#5a7a98');
    }
    rect(c, 238, 100, 74, 4, s);
    rect(c, dx - 3, dy - 37, 6, 4, '#3a5a78');
    // portico
    rect(c, 216, 112, 118, 50, s);
    for (let i = 0; i < 60; i++) rect(c, 216 + i, 112 - i * 0.28, 118 - i * 2, 1, l);
    rect(c, 214, 110, 122, 3, l);
    rect(c, 216, 113, 118, 10, '#d0bc92');
    glyphs(c, 'DEM DEUTSCHEN VOLKE', 219, 115, 1, '#3a3020');
    for (let x = 220; x < 334; x += 15) {
      rect(c, x, 124, 7, 32, l);
      rect(c, x + 5, 124, 2, 32, d);
    }
    rect(c, 216, 124, 118, 1, d);
    for (let i = 0; i < 4; i++) rect(c, 210 - i * 4, 156 + i * 2, 130 + i * 8, 2, i % 2 ? d : l);
    // Brandenburg Gate
    const bg = '#d8caa4', bd = '#9a8c68';
    rect(c, 412, 104, 96, 8, bg);
    rect(c, 412, 111, 96, 2, bd);
    rect(c, 432, 96, 56, 8, bg);
    for (let x = 414; x < 508; x += 16) {
      rect(c, x, 113, 8, 46, bg);
      rect(c, x + 6, 113, 2, 46, bd);
    }
    rect(c, 408, 158, 104, 4, bd);
    // the horses on top
    rect(c, 446, 88, 28, 6, '#3c7a68');
    for (let x = 448; x < 472; x += 6) rect(c, x, 83, 3, 6, '#3c7a68');
    rect(c, 459, 76, 2, 10, '#3c7a68');
    // the park and the lawn
    rect(c, 0, 162, bw, 22, '#4a9a42');
    for (let i = 0; i < 180; i++) {
      c.fillStyle = rnd() < 0.5 ? '#5cb04e' : '#3c8a3a';
      c.fillRect(rnd() * bw, 162 + rnd() * 22, 3, 1);
    }
  });
  const front = makeCanvas(WORLD_W, H, (c) => {
    paving(c, WORLD_W, 184, H, '#b8ae9c', '#c8bfac', '#8e8676', rnd);
    rect(c, 0, 180, WORLD_W, 4, '#d8d0c0');
    rect(c, 0, 183, WORLD_W, 1, '#6e6858');
    // street lamps, bollards, flag poles
    for (const x of [90, 300, 510]) {
      rect(c, x, 110, 2, 74, '#30384a');
      rect(c, x, 110, 16, 2, '#30384a');
      rect(c, x + 12, 112, 8, 3, '#f8f4d0');
    }
    for (let x = 30; x < WORLD_W; x += 70) {
      rect(c, x, 172, 4, 12, '#30384a');
      rect(c, x, 172, 4, 2, '#e0e4f0');
    }
    // the sign
    rect(c, 170, 148, 2, 36, '#30384a');
    rect(c, 150, 134, 42, 14, '#0a0a12');
    rect(c, 151, 135, 40, 12, '#1a4a9a');
    glyphs(c, 'BERLIN', 153, 137, 1, '#fff');
  });
  return {
    id: 'berlin', name: 'BERLIN', music: 'berlin', sky, back, front, backP: 0.5,
    clouds: [[40, 44, 1.2], [170, 30, 1.0], [300, 50, 1.4], [400, 24, 0.8]],
    cloudCol: ['#ffffff', '#d4e4f4'],
    anim(c, cam, t) {
      // the U-Bahn yellow tram rolling past the lawn
      const ox = -cam * 0.5;
      const x = ((t * 0.5) % 760) - 120 + ox;
      rect(c, x, 164, 66, 12, '#0a0a12');
      rect(c, x + 1, 165, 64, 10, '#f8c818');
      rect(c, x + 1, 171, 64, 2, '#a07a10');
      for (let i = 0; i < 6; i++) rect(c, x + 4 + i * 10, 166, 7, 4, '#30485e');
    },
    over() {},
  };
}

function buildOstrava() {
  const rnd = seeded(99);
  const sky = makeCanvas(W, H, (c) => {
    skyBands(c, W, 180, ['#1c1a12', '#2a2614', '#3e3616', '#5a4a18', '#7a5a1c', '#9a6420', '#b86a22', '#c8741e']);
    // the mushroom cloud never quite went away
    const mx = 290, my = 58;
    for (let y = 70; y < 170; y++) {
      const w = 7 + (y - 70) * 0.05 + Math.sin(y * 0.3) * 2;
      rect(c, mx - w, y, w * 2, 1, y % 5 < 2 ? '#7c4a1c' : '#5c3414');
    }
    const puffs = [[0, 0, 44, 22], [-28, 8, 22, 15], [28, 8, 22, 15], [-14, -12, 22, 14], [16, -12, 22, 14], [0, -18, 20, 11]];
    for (const [dx, dy, rx, ry] of puffs) oval(c, mx + dx, my + dy, rx + 1, ry + 1, '#3a2010');
    for (const [dx, dy, rx, ry] of puffs) oval(c, mx + dx, my + dy, rx, ry, '#6e3e18');
    for (const [dx, dy, rx, ry] of puffs) oval(c, mx + dx - 2, my + dy + 3, rx * 0.65, ry * 0.55, '#c0641c');
    for (const [dx, dy, rx, ry] of puffs) oval(c, mx + dx - 3, my + dy + 5, rx * 0.3, ry * 0.3, '#f4b030');
    // dead black clouds
    for (let i = 0; i < 18; i++) {
      oval(c, rnd() * W, 18 + rnd() * 34, 18 + rnd() * 26, 3 + rnd() * 4, '#14120a');
    }
  });
  const bw = 528;
  const back = makeCanvas(bw, H, (c) => {
    const ruin = (x, w, h, col, lit) => {
      // a wrecked concrete panel block with a jagged top
      const topY = 168 - h;
      for (let i = 0; i < w; i += 3) {
        const j = Math.floor(rnd() * h * (rnd() < 0.12 ? 0.55 : 0.12));
        rect(c, x + i, topY + j, 3, h - j, col);
      }
      for (let yy = topY + 10; yy < 166; yy += 7) {
        for (let xx = x + 3; xx < x + w - 4; xx += 6) {
          const r = rnd();
          c.fillStyle = r < 0.1 ? lit : r < 0.28 ? '#2a2a20' : '#14130e';
          c.fillRect(xx, yy, 4, 4);
          if (r > 0.92) rect(c, xx, yy + 4, 1, 4, '#1a1810');
        }
      }
      for (let i = 0; i < 3; i++) {
        const hx = x + rnd() * w, hy = topY + 20 + rnd() * (h - 30);
        oval(c, hx, hy, 6 + rnd() * 6, 5 + rnd() * 6, '#0c0b08');
      }
    };
    ruin(0, 62, 96, '#3a3830', '#ff7a1a');
    ruin(70, 44, 62, '#2e2c26', '#ff9a2a');
    ruin(330, 58, 88, '#34322a', '#ff7a1a');
    ruin(470, 58, 106, '#3e3a30', '#ffa030');
    // blast furnace, the skeleton of the old ironworks
    const rust = '#4a2e1c', dk = '#22160e';
    for (const x of [150, 190]) {
      rect(c, x, 82, 24, 88, dk);
      rect(c, x + 2, 84, 20, 84, rust);
      rect(c, x + 2, 84, 4, 84, '#6e4426');
      for (let y = 92; y < 168; y += 14) rect(c, x, y, 24, 2, dk);
      rect(c, x + 6, 62, 12, 22, dk);
      rect(c, x + 8, 62, 8, 22, rust);
    }
    limb(c, 174, 70, 210, 40, 5, 5, dk);
    limb(c, 174, 70, 210, 40, 3, 3, rust);
    limb(c, 210, 40, 240, 110, 2, 2, dk);
    limb(c, 136, 168, 158, 96, 2, 2, dk);
    for (let x = 226; x < 320; x += 14) {
      limb(c, x, 168, x + 14, 124, 1, 1, dk);
      limb(c, x + 14, 168, x, 124, 1, 1, dk);
    }
    rect(c, 226, 122, 94, 3, dk);
    // chimneys, one snapped and leaning
    rect(c, 244, 58, 10, 112, dk);
    rect(c, 246, 58, 6, 112, '#5a3a24');
    for (let y = 60; y < 110; y += 8) rect(c, 244, y, 10, 2, '#7a2a1a');
    limb(c, 300, 168, 322, 92, 10, 8, dk);
    limb(c, 300, 168, 322, 92, 6, 5, '#4a3020');
    // slag heap
    for (let x = 0; x < bw; x++) {
      const h = 12 + Math.sin(x * 0.03) * 7 + Math.sin(x * 0.11) * 3 + rnd() * 2;
      rect(c, x, 182 - h, 1, h + 2, '#1e1a10');
    }
  });
  const front = makeCanvas(WORLD_W, H, (c) => {
    rect(c, 0, 176, WORLD_W, H - 176, '#3a3220');
    for (let i = 0; i < 2600; i++) {
      c.fillStyle = ['#2c2616', '#46402a', '#352d1c', '#544a30'][Math.floor(rnd() * 4)];
      const y = 176 + rnd() * (H - 176);
      c.fillRect(rnd() * WORLD_W, y, 2 + rnd() * 5, 1);
    }
    // cracks
    for (let i = 0; i < 14; i++) {
      let x = rnd() * WORLD_W, y = 180 + rnd() * 50;
      for (let n = 0; n < 8; n++) {
        const nx = x + 6 + rnd() * 14, ny = y + (rnd() - 0.5) * 8;
        limb(c, x, y, nx, ny, 1, 1, '#0e0c06');
        x = nx; y = ny;
      }
    }
    // craters
    for (const [x, y, r] of [[130, 222, 20], [420, 226, 26], [590, 216, 15]]) {
      oval(c, x, y, r + 2, (r + 2) * 0.28, '#544a30');
      oval(c, x, y, r, r * 0.25, '#161208');
    }
    // the welcome sign
    limb(c, 300, 182, 296, 128, 3, 3, '#14120a');
    limb(c, 344, 182, 348, 134, 3, 3, '#14120a');
    c.save();
    c.translate(322, 134); c.rotate(-0.07);
    rect(c, -38, -14, 76, 26, '#0a0a06');
    rect(c, -37, -13, 74, 24, '#d8c8a0');
    rect(c, -35, -11, 70, 20, '#7a2a12');
    glyphs(c, 'OSTRAVA', -21, -9, 1, '#f4e8c0');
    glyphs(c, 'POP. 0', -17, 1, 1, '#f0c818');
    c.restore();
    for (const [x, y, r] of [[318, 118, 2], [344, 140, 3], [303, 128, 2]]) disc(c, x, y, r, '#0a0a06');
    // burnt car
    rect(c, 440, 170, 76, 14, '#0e0c08');
    rect(c, 442, 171, 72, 11, '#3a2214');
    rect(c, 456, 158, 40, 14, '#0e0c08');
    rect(c, 458, 160, 36, 10, '#1c120c');
    rect(c, 494, 171, 12, 3, '#6a3a1a');
    disc(c, 456, 184, 6, '#0a0806'); disc(c, 500, 184, 6, '#0a0806');
    // barrels
    for (const x of [78, 96, 540]) {
      rect(c, x, 158, 16, 24, '#0e0c08');
      rect(c, x + 1, 159, 14, 22, '#a08a1a');
      rect(c, x + 1, 159, 3, 22, '#c8b030');
      rect(c, x + 1, 164, 14, 1, '#4a3e0c');
      rect(c, x + 1, 176, 14, 1, '#4a3e0c');
      trefoil(c, x + 8, 170, 5);
    }
    limb(c, 88, 180, 92, 190, 4, 7, '#7cff3a');
    // skulls and rubble
    for (const [x, y] of [[220, 196], [372, 192], [40, 200]]) {
      oval(c, x, y, 4, 4, '#d8d0b0');
      rect(c, x - 2, y - 1, 2, 2, '#14120a'); rect(c, x + 1, y - 1, 2, 2, '#14120a');
      rect(c, x - 2, y + 3, 5, 2, '#b0a888');
    }
    for (let i = 0; i < 40; i++) {
      const x = rnd() * WORLD_W, y = 176 + rnd() * 12, s = 2 + rnd() * 6;
      rect(c, x, y, s, s * 0.7, rnd() < 0.5 ? '#1e1a10' : '#4e4630');
    }
  });
  const pools = [[190, 200, 24], [516, 226, 22], [36, 228, 20]];
  return {
    id: 'ostrava', name: 'OSTRAVA', music: 'ostrava', sky, back, front, backP: 0.5,
    clouds: [[60, 30, 1.2], [240, 22, 1.5], [380, 36, 1.1]],
    cloudCol: ['#2a2410', '#14120a'],
    anim(c, cam, t) {
      // smoke from the works
      const ox = -cam * 0.5;
      for (const sx of [162 + ox, 202 + ox, 249 + ox]) {
        for (let i = 0; i < 8; i++) {
          const k = ((t * 0.2 + i * 14 + sx) % 112) / 112;
          oval(c, sx + Math.sin(k * 9 + sx) * 6 + k * 30, 60 - k * 54, 3 + k * 10, 2 + k * 6, k < 0.5 ? '#2a2414' : '#1a160c');
        }
      }
      // fires in the windows
      for (let i = 0; i < 6; i++) {
        const fx = [28 + ox, 90 + ox, 352 + ox, 490 + ox, 58 + ox, 505 + ox][i];
        const fy = 130 + (i * 11) % 28;
        const f = Math.sin(t * 0.25 + i * 2);
        rect(c, fx, fy, 3, 4 + f * 2, '#ff6a12');
        rect(c, fx + 1, fy + 1, 1, 2, '#ffd030');
      }
    },
    animFront(c, cam, t) {
      // glowing toxic puddles
      for (const [x, y, r] of pools) {
        const sx = x - cam, p = Math.sin(t * 0.05 + x) * 2;
        oval(c, sx, y, r + 2 + p, 5, '#26600e');
        oval(c, sx, y, r, 4, '#58d81a');
        oval(c, sx - 3, y - 1, r * 0.5, 1.5, '#c0ff60');
        if ((t + x) % 44 < 12) disc(c, sx + ((x * 7) % r) - r / 2, y - ((t + x) % 44) / 3, 1, '#a0ff50');
      }
    },
    over(c, cam, t) {
      // ash falls for ever
      for (let i = 0; i < 46; i++) {
        const x = (i * 47 + t * (0.25 + (i % 5) * 0.08) - cam * 0.4 + Math.sin(t * 0.02 + i) * 8) % W;
        const y = (i * 31 + t * (0.45 + (i % 4) * 0.15)) % H;
        rect(c, x < 0 ? x + W : x, y, i % 3 ? 1 : 2, 1, i % 5 ? '#b8ae98' : '#ff8a2a');
      }
      // sickly radiation pulse and the odd lightning flash
      c.globalAlpha = 0.05 + Math.sin(t * 0.02) * 0.03;
      rect(c, 0, 0, W, H, '#7cff3a');
      const fl = (t + 300) % 620;
      if (fl < 10 && fl % 4 < 2) {
        c.globalAlpha = 0.28;
        rect(c, 0, 0, W, H, '#f4ffd0');
      }
      c.globalAlpha = 1;
    },
  };
}

const STAGE_LIST = [
  { id: 'london', name: 'LONDON', blurb: 'BIG BEN, THE EYE, ST PAUL\'S AND THE BRIDGE' },
  { id: 'berlin', name: 'BERLIN', blurb: 'THE REICHSTAG AND THE BIG TOWER THING' },
  { id: 'ostrava', name: 'OSTRAVA', blurb: 'NUCLEAR WASTELAND. POPULATION: ZERO' },
];

const stageCache = {};
function getStage(id) {
  if (!stageCache[id]) {
    stageCache[id] = id === 'london' ? buildLondon() : id === 'berlin' ? buildBerlin() : buildOstrava();
  }
  return stageCache[id];
}

function drawStage(c, st, cam, t) {
  c.drawImage(st.sky, 0, 0);
  for (let i = 0; i < st.clouds.length; i++) {
    const [x, y, s] = st.clouds[i];
    const cx = ((x + t * 0.04 * (1 + i * 0.3) + 60) % (W + 120)) - 60;
    cloud(c, cx, y + 8, s, st.cloudCol[0], st.cloudCol[1]);
  }
  c.drawImage(st.back, -Math.round(cam * st.backP), 0);
  st.anim(c, cam, t);
  c.drawImage(st.front, -Math.round(cam), 0);
  if (st.animFront) st.animFront(c, cam, t);
}

function stageThumb(id) {
  const st = getStage(id);
  return makeCanvas(W, H, (c) => drawStage(c, st, 60, 200));
}
