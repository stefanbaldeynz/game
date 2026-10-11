// All sounds are synthesised with the Web Audio API, so there are no audio files.
// Browsers only allow audio after a click, so Sound.init() runs when you click to start.

const Sound = (() => {
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  let lastKiwiCall = 0;
  let birdTimer = 4;

  function init() {
    if (ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    startWind();
  }

  function noise({ duration, freq, gain, type = 'lowpass', delay = 0 }) {
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + duration);
  }

  function tone({ type = 'sine', from, to, duration, gain, delay = 0 }) {
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + duration);
  }

  // Gentle wind through the canyon that slowly rises and falls.
  function startWind() {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 450;
    const g = ctx.createGain();
    g.gain.value = 0.03;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start();
    lfo.start();
  }

  return {
    init,
    // Now and then a native bird sings somewhere in the bush.
    update(dt) {
      if (!ctx) return;
      birdTimer -= dt;
      if (birdTimer > 0) return;
      birdTimer = rand(5, 12);
      let delay = 0;
      for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
        const f = rand(1400, 3400);
        tone({ type: 'sine', from: f, to: f * rand(0.7, 1.4), duration: 0.12, gain: 0.025, delay });
        delay += rand(0.1, 0.2);
      }
    },
    rifle() {
      noise({ duration: 0.2, freq: 3000, gain: 0.35 });
      tone({ type: 'square', from: 180, to: 60, duration: 0.08, gain: 0.16 });
    },
    empty() {
      tone({ type: 'square', from: 900, to: 700, duration: 0.04, gain: 0.08 });
    },
    reload() {
      for (const d of [0, 0.55, 1.25]) noise({ duration: 0.06, freq: 2500, gain: 0.25, type: 'highpass', delay: d });
    },
    tower(volume = 1) {
      tone({ type: 'triangle', from: 1400, to: 500, duration: 0.09, gain: 0.06 * volume });
      noise({ duration: 0.05, freq: 5000, gain: 0.03 * volume, type: 'highpass' });
    },
    hit() {
      tone({ type: 'square', from: 1300, to: 1000, duration: 0.04, gain: 0.04 });
    },
    // The kiwi's famous "kee-wee" call, at most every 0.3 seconds so big waves don't get noisy.
    kiwi() {
      if (!ctx || ctx.currentTime - lastKiwiCall < 0.3) return;
      lastKiwiCall = ctx.currentTime;
      tone({ type: 'sine', from: 2000, to: 2700, duration: 0.18, gain: 0.1 });
      tone({ type: 'sine', from: 2700, to: 1600, duration: 0.25, gain: 0.1, delay: 0.2 });
    },
    coin() {
      tone({ type: 'sine', from: 1320, to: 1330, duration: 0.08, gain: 0.06 });
      tone({ type: 'sine', from: 1760, to: 1770, duration: 0.12, gain: 0.06, delay: 0.06 });
    },
    escape() {
      tone({ type: 'sawtooth', from: 300, to: 90, duration: 0.5, gain: 0.15 });
    },
    build() {
      noise({ duration: 0.15, freq: 600, gain: 0.3 });
      tone({ type: 'triangle', from: 220, to: 180, duration: 0.15, gain: 0.2 });
    },
    upgrade() {
      [523, 659, 784, 1046].forEach((f, i) => tone({ type: 'triangle', from: f, to: f, duration: 0.12, gain: 0.12, delay: i * 0.07 }));
    },
    waveStart() {
      for (const f of [196, 294]) tone({ type: 'sawtooth', from: f, to: f * 1.01, duration: 0.9, gain: 0.06 });
    },
    error() {
      tone({ type: 'square', from: 200, to: 150, duration: 0.15, gain: 0.1 });
    },
  };
})();
