// All sounds are synthesised with the Web Audio API, so there are no audio files.
// Browsers only allow audio after a click, so Sound.init() runs when you click to play.

const Sound = (() => {
  let ctx = null;
  let master = null;
  let noiseBuffer = null;

  function init() {
    if (ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    startAmbience();
  }

  // A burst of filtered noise: gunshots, impacts, hisses.
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

  // A pitch sweep: growls, yelps, chimes.
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

  // Low hellish drone plus the distant roar of fire, looping forever.
  function startAmbience() {
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 180;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.05;
    for (const f of [41, 41.6, 61.5]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      osc.connect(droneFilter);
      osc.start();
    }
    droneFilter.connect(droneGain);
    droneGain.connect(master);

    const roar = ctx.createBufferSource();
    roar.buffer = noiseBuffer;
    roar.loop = true;
    const roarFilter = ctx.createBiquadFilter();
    roarFilter.type = 'lowpass';
    roarFilter.frequency.value = 500;
    const roarGain = ctx.createGain();
    roarGain.gain.value = 0.035;
    roar.connect(roarFilter);
    roarFilter.connect(roarGain);
    roarGain.connect(master);
    roar.start();
  }

  return {
    init,
    // The music player (music.js) plays through the same audio system.
    context: () => ctx,
    output: () => master,
    resume() {
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },
    pistol() {
      noise({ duration: 0.25, freq: 2500, gain: 0.5 });
      tone({ type: 'square', from: 160, to: 50, duration: 0.1, gain: 0.25 });
    },
    shotgun() {
      noise({ duration: 0.6, freq: 1400, gain: 0.9 });
      tone({ type: 'sawtooth', from: 110, to: 35, duration: 0.25, gain: 0.4 });
      // Pump action: two clacks.
      noise({ duration: 0.07, freq: 2500, gain: 0.25, type: 'highpass', delay: 0.45 });
      noise({ duration: 0.07, freq: 2500, gain: 0.25, type: 'highpass', delay: 0.62 });
    },
    rifle() {
      noise({ duration: 0.14, freq: 3500, gain: 0.4 });
      tone({ type: 'square', from: 200, to: 70, duration: 0.06, gain: 0.2 });
    },
    empty() {
      tone({ type: 'square', from: 900, to: 700, duration: 0.04, gain: 0.08 });
    },
    growl(volume = 1) {
      tone({ type: 'sawtooth', from: 75, to: 55, duration: 0.7, gain: 0.25 * volume });
      noise({ duration: 0.6, freq: 300, gain: 0.2 * volume });
    },
    bite(volume = 1) {
      noise({ duration: 0.12, freq: 1200, gain: 0.35 * volume });
      tone({ type: 'sawtooth', from: 320, to: 140, duration: 0.15, gain: 0.2 * volume });
    },
    yelp(volume = 1) {
      tone({ type: 'sawtooth', from: 700, to: 150, duration: 0.45, gain: 0.25 * volume });
      noise({ duration: 0.5, freq: 800, gain: 0.25 * volume });
    },
    hurt() {
      tone({ type: 'square', from: 220, to: 90, duration: 0.22, gain: 0.25 });
    },
    sizzle() {
      noise({ duration: 0.3, freq: 4000, gain: 0.12, type: 'highpass' });
    },
    pickup() {
      tone({ type: 'sine', from: 520, to: 780, duration: 0.12, gain: 0.25 });
      tone({ type: 'sine', from: 780, to: 1170, duration: 0.15, gain: 0.2, delay: 0.08 });
    },
    // Elephant trumpet: a brassy blast that bends up then down.
    trumpet(volume = 1) {
      tone({ type: 'sawtooth', from: 330, to: 520, duration: 0.35, gain: 0.18 * volume });
      tone({ type: 'sawtooth', from: 520, to: 280, duration: 0.6, gain: 0.16 * volume, delay: 0.3 });
      tone({ type: 'square', from: 660, to: 1040, duration: 0.35, gain: 0.05 * volume });
    },
    elephantDeath(volume = 1) {
      tone({ type: 'sawtooth', from: 400, to: 90, duration: 1.2, gain: 0.2 * volume });
      noise({ duration: 0.8, freq: 300, gain: 0.4 * volume, delay: 0.5 });
    },
    gore() {
      noise({ duration: 0.2, freq: 900, gain: 0.4 });
      tone({ type: 'square', from: 140, to: 60, duration: 0.2, gain: 0.2 });
    },
    thud() {
      noise({ duration: 0.5, freq: 200, gain: 0.7 });
      tone({ type: 'sine', from: 80, to: 35, duration: 0.4, gain: 0.4 });
    },
    roar() {
      tone({ type: 'sawtooth', from: 110, to: 70, duration: 1.4, gain: 0.3 });
      tone({ type: 'sawtooth', from: 165, to: 95, duration: 1.4, gain: 0.15 });
      noise({ duration: 1.3, freq: 600, gain: 0.35 });
    },
    // The Balrog: a deeper, longer roar, and the crack of his whip of fire.
    balrogRoar() {
      tone({ type: 'sawtooth', from: 70, to: 38, duration: 2.2, gain: 0.35 });
      tone({ type: 'sawtooth', from: 104, to: 55, duration: 2.0, gain: 0.2 });
      tone({ type: 'square', from: 52, to: 30, duration: 2.4, gain: 0.12 });
      noise({ duration: 2.0, freq: 400, gain: 0.45 });
    },
    whipCrack() {
      noise({ duration: 0.08, freq: 6000, gain: 0.8, type: 'highpass' });
      noise({ duration: 0.4, freq: 1200, gain: 0.3 });
    },
    fireball() {
      noise({ duration: 0.5, freq: 900, gain: 0.3 });
      tone({ type: 'sawtooth', from: 200, to: 90, duration: 0.4, gain: 0.1 });
    },
    explosion(volume = 1) {
      noise({ duration: 0.9, freq: 700, gain: 0.7 * volume });
      tone({ type: 'sine', from: 90, to: 30, duration: 0.6, gain: 0.5 * volume });
    },
    jump() {
      tone({ type: 'sine', from: 260, to: 420, duration: 0.12, gain: 0.08 });
    },
    // The devil's guitar: a big distorted E power chord.
    powerChord() {
      if (!ctx) return;
      const t = ctx.currentTime;
      const shaper = ctx.createWaveShaper();
      const curve = new Float32Array(1024);
      for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(12 * ((i * 2) / curve.length - 1));
      shaper.curve = curve;
      const cabinet = ctx.createBiquadFilter();
      cabinet.type = 'lowpass';
      cabinet.frequency.value = 4000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      shaper.connect(cabinet);
      cabinet.connect(g);
      g.connect(master);
      for (const f of [82.4, 123.5, 164.8]) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = f;
        osc.connect(shaper);
        osc.start(t);
        osc.stop(t + 0.9);
      }
    },
    // A deep whoosh of feathers on each downstroke.
    wingFlap() {
      noise({ duration: 0.28, freq: 380, gain: 0.35 });
      noise({ duration: 0.18, freq: 1200, gain: 0.06, type: 'bandpass' });
    },
    swap() {
      noise({ duration: 0.06, freq: 2500, gain: 0.2, type: 'highpass' });
    },
  };
})();
