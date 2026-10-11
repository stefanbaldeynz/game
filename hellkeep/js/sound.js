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
    swap() {
      noise({ duration: 0.06, freq: 2500, gain: 0.2, type: 'highpass' });
    },
  };
})();
