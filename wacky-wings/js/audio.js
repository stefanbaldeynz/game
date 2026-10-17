// Engine noise, sound effects and a bouncy tune, all made with Web Audio.
// Nothing plays until the first key press (browsers require that).

const Sound = (() => {
  let ac = null;
  let master = null;
  let musicGain = null;
  let engineOsc = null;
  let engineGain = null;
  let engineFilter = null;
  let muted = false;
  let musicOn = false;
  let nextNoteTime = 0;
  let step = 0;

  function init() {
    if (ac) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return;
    }
    master = ac.createGain();
    master.gain.value = 0.5;
    master.connect(ac.destination);
    musicGain = ac.createGain();
    musicGain.gain.value = 0.22;
    musicGain.connect(master);

    engineOsc = ac.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 50;
    engineFilter = ac.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 400;
    engineGain = ac.createGain();
    engineGain.gain.value = 0;
    engineOsc.connect(engineFilter).connect(engineGain).connect(master);
    engineOsc.start();
    setInterval(scheduleMusic, 50);
  }

  function tone(freq, dur, { type = 'square', vol = 0.25, slide = 0, delay = 0, out = master } = {}) {
    if (!ac || muted) return;
    const t = ac.currentTime + delay;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(dur, { vol = 0.3, delay = 0, filter = 1500 } = {}) {
    if (!ac || muted) return;
    const t = ac.currentTime + delay;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filter;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t);
  }

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  // A jaunty tune in G. Eighth notes; 0 = rest.
  const MELODY = [
    67, 71, 74, 71, 72, 76, 74, 0,
    71, 74, 79, 78, 76, 74, 72, 71,
    69, 72, 76, 72, 74, 78, 76, 0,
    74, 72, 71, 69, 67, 0, 62, 0,
  ];
  const BASS = [43, 48, 45, 50, 43, 48, 50, 43];
  const EIGHTH = 0.14;

  function scheduleMusic() {
    if (!ac || !musicOn) return;
    while (nextNoteTime < ac.currentTime + 0.2) {
      const t = nextNoteTime - ac.currentTime;
      if (!muted) {
        const m = MELODY[step % MELODY.length];
        if (m) tone(midi(m), EIGHTH * 0.85, { vol: 0.12, delay: t, out: musicGain });
        if (step % 2 === 0) {
          const b = BASS[Math.floor(step / 4) % BASS.length] + (step % 4 === 2 ? 12 : 0);
          tone(midi(b), EIGHTH * 1.5, { type: 'triangle', vol: 0.35, delay: t, out: musicGain });
        }
      }
      nextNoteTime += EIGHTH;
      step++;
    }
  }

  return {
    init,
    startMusic() {
      if (!ac) return;
      if (ac.state === 'suspended') ac.resume();
      if (!musicOn) {
        musicOn = true;
        step = 0;
        nextNoteTime = ac.currentTime + 0.1;
      }
    },
    stopMusic() {
      musicOn = false;
    },
    // speed is 0..1; pass null to switch the engine off.
    engine(speed) {
      if (!ac) return;
      const t = ac.currentTime;
      const on = speed !== null && !muted;
      engineGain.gain.setTargetAtTime(on ? 0.07 : 0, t, 0.05);
      if (on) {
        engineOsc.frequency.setTargetAtTime(45 + speed * 110, t, 0.05);
        engineFilter.frequency.setTargetAtTime(300 + speed * 900, t, 0.05);
      }
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    beep: () => tone(440, 0.25, { vol: 0.2 }),
    go: () => tone(880, 0.5, { vol: 0.2 }),
    throw: () => tone(500, 0.2, { slide: 900, vol: 0.12, type: 'triangle' }),
    hit: () => {
      tone(700, 0.35, { type: 'sine', slide: -550, vol: 0.3 });
      noise(0.15, { vol: 0.25 });
    },
    bump: () => noise(0.12, { vol: 0.25, filter: 600 }),
    pickup: () => {
      tone(784, 0.08, { vol: 0.15 });
      tone(1175, 0.18, { vol: 0.15, delay: 0.07 });
    },
    baa: () => {
      [0, 0.04, 0.08, 0.12, 0.16, 0.2].forEach((d, i) => tone(i % 2 ? 330 : 300, 0.06, { type: 'sawtooth', vol: 0.08, delay: d }));
    },
    lap: () => [659, 784, 988].forEach((f, i) => tone(f, 0.15, { vol: 0.15, delay: i * 0.09 })),
    finish: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, { vol: 0.18, delay: i * 0.11 })),
  };
})();
