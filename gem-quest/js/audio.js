// Chiptune sound effects and a looping tune, all made with Web Audio.
// Nothing plays until the first key press (browsers require that).

const Sound = (() => {
  let ac = null;
  let master = null;
  let musicGain = null;
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
    musicGain.gain.value = 0.35;
    musicGain.connect(master);
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

  // Eighth notes. 0 = rest.
  const MELODY = [
    76, 79, 81, 79, 76, 72, 74, 76,
    74, 72, 69, 72, 74, 0, 74, 0,
    76, 79, 81, 84, 83, 81, 79, 76,
    79, 76, 74, 72, 0, 72, 0, 0,
    81, 0, 81, 79, 77, 76, 77, 79,
    76, 0, 72, 74, 76, 0, 0, 0,
    77, 76, 74, 72, 74, 76, 79, 76,
    74, 72, 71, 74, 72, 0, 0, 0,
  ];
  const BASS = [48, 43, 41, 48, 45, 52, 43, 50, 41, 48, 45, 52, 41, 43, 43, 48];
  const EIGHTH = 0.15;

  function scheduleMusic() {
    if (!ac || !musicOn) return;
    while (nextNoteTime < ac.currentTime + 0.2) {
      const t = nextNoteTime - ac.currentTime;
      if (!muted) {
        const m = MELODY[step % MELODY.length];
        if (m) tone(midi(m), EIGHTH * 0.9, { vol: 0.12, delay: t, out: musicGain });
        if (step % 2 === 0) {
          const b = BASS[Math.floor(step / 4) % BASS.length] + (step % 4 === 2 ? 7 : 0);
          tone(midi(b), EIGHTH * 1.6, { type: 'triangle', vol: 0.35, delay: t, out: musicGain });
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
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    jump: () => tone(300, 0.15, { slide: 400, vol: 0.15 }),
    punch: () => noise(0.06, { vol: 0.2, filter: 2500 }),
    smash: () => noise(0.18, { vol: 0.35, filter: 900 }),
    coin: () => {
      tone(988, 0.08, { vol: 0.15 });
      tone(1319, 0.2, { vol: 0.15, delay: 0.07 });
    },
    power: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, { vol: 0.15, delay: i * 0.07 })),
    magic: () => tone(900, 0.18, { type: 'sine', slide: -500, vol: 0.25 }),
    fire: () => noise(0.25, { vol: 0.15, filter: 500 }),
    kill: () => {
      tone(600, 0.1, { vol: 0.2, slide: -300 });
      noise(0.1, { vol: 0.2, delay: 0.03 });
    },
    die: () => [523, 494, 466, 440, 415, 392].forEach((f, i) => tone(f, 0.14, { vol: 0.2, delay: i * 0.12 })),
    gem: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, { vol: 0.18, delay: i * 0.1 })),
  };
})();
