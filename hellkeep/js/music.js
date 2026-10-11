// Heavy metal soundtrack, played live by code: distorted guitar, bass and drums.
// No audio files: every note is synthesised with the Web Audio API.
//
// HOW THE RIFFS ARE WRITTEN
// Each bar is 16 characters, one per 16th note:
//   lowercase letter = palm-muted chug      UPPERCASE = ringing power chord
//   -  = keep the chord ringing             .  = silence
// Letters are notes counted up from the song's lowest note (E in round 1, D in round 2):
//   e = root   f = +1   g = +3   a = +5   b = +6 (the "devil's interval")   h = +7   c = +8   d = +10
// Drum bars use x for a hit and . for nothing.

const NOTE_OFFSETS = { e: 0, f: 1, g: 3, a: 5, b: 6, h: 7, c: 8, d: 10 };

const SONGS = {
  // Round 1: fast thrash with gallops. Switches to the "boss" riff while the devil is fighting.
  1: {
    bpm: 150,
    rootHz: 82.41, // E2
    drums: {
      gallop: { kick: 'x.xx.xx.x.xx.xx.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
      fill: { kick: 'x.xx.xx.x.......', snare: '....x...x.x.xxxx', hat: 'x.x.x.x.........' },
      blast: { kick: 'xxxxxxxxxxxxxxxx', snare: '..x...x...x...x.', hat: 'x.x.x.x.x.x.x.x.' },
      blastFill: { kick: 'xxxxxxxxxxxxxxxx', snare: '..x...x.x.x.xxxx', hat: 'x.x.x.x.........' },
    },
    sections: {
      main: [
        { riff: 'e.eee.eee.eeG-F-', drums: 'gallop' },
        { riff: 'e.eee.eee.eeB-A-', drums: 'gallop' },
        { riff: 'e.eee.eee.eeG-F-', drums: 'gallop' },
        { riff: 'C---B---A---G-F-', drums: 'fill' },
        { riff: 'a.aaa.aaa.aaC-B-', drums: 'gallop' },
        { riff: 'a.aaa.aaa.aaD-C-', drums: 'gallop' },
        { riff: 'e.eee.eee.eeG-F-', drums: 'gallop' },
        { riff: 'E-----------B-B-', drums: 'fill' },
      ],
      boss: [
        { riff: 'eeeeeeeeeeeeG-G-', drums: 'blast' },
        { riff: 'eeeeeeeeeeeeB-A-', drums: 'blast' },
        { riff: 'eeeeeeeeeeeeC-C-', drums: 'blast' },
        { riff: 'B-B-B-B-A-A-G-F-', drums: 'blastFill' },
      ],
    },
  },
  // Round 2: slow, crushing doom metal, tuned down a step.
  2: {
    bpm: 92,
    rootHz: 73.42, // D2
    drums: {
      doom: { kick: 'x.....x.x.......', snare: '........x.......', hat: 'x...x...x...x...' },
      doomFill: { kick: 'x.....x.x.......', snare: '........x...x.xx', hat: 'x...x...x.......' },
    },
    sections: {
      main: [
        { riff: 'E-------------e.', drums: 'doom' },
        { riff: 'G-------F-----e.', drums: 'doom' },
        { riff: 'E-------------e.', drums: 'doom' },
        { riff: 'B-------A---G---', drums: 'doomFill' },
        { riff: 'e.e.e.e.e.e.G-F-', drums: 'doom' },
        { riff: 'E-------C-------', drums: 'doom' },
        { riff: 'e.e.e.e.e.e.B-A-', drums: 'doom' },
        { riff: 'E---------------', drums: 'doomFill' },
      ],
    },
  },
};

// Catch typos: every bar must be exactly 16 steps.
for (const [name, song] of Object.entries(SONGS)) {
  for (const bars of Object.values(song.sections)) {
    for (const bar of bars) if (bar.riff.length !== 16) console.error(`Song ${name}: riff "${bar.riff}" is not 16 steps`);
  }
  for (const kit of Object.values(song.drums)) {
    for (const [part, pattern] of Object.entries(kit)) if (pattern.length !== 16) console.error(`Song ${name}: ${part} "${pattern}" is not 16 steps`);
  }
}

const Music = (() => {
  const MUSIC_VOLUME = 0.55;
  let ctx = null;
  let out = null;       // music volume (mute toggles this)
  let guitarIn = null;  // notes go in here, then through the distortion
  let noiseBuffer = null;
  let song = null;
  let timer = null;
  let nextTime = 0;
  let step = 0;
  let barIndex = 0;
  let section = 'main';
  let pendingSection = null;
  let enabled = loadEnabled();

  function loadEnabled() {
    try {
      return localStorage.getItem('hellkeepMusic') !== 'off';
    } catch {
      return true;
    }
  }

  function saveEnabled() {
    try {
      localStorage.setItem('hellkeepMusic', enabled ? 'on' : 'off');
    } catch {
      // Storage can be blocked; the setting just won't be remembered.
    }
  }

  // The classic "soft clipping" curve: squashes the guitar into a fuzzy wall of sound.
  function distortionCurve(amount) {
    const n = 2048;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  function buildChain() {
    out = ctx.createGain();
    out.gain.value = enabled ? MUSIC_VOLUME : 0;
    out.connect(Sound.output());

    // Guitar: tighten the lows, distort, then shape it like a speaker cabinet.
    guitarIn = ctx.createGain();
    const tighten = ctx.createBiquadFilter();
    tighten.type = 'highpass';
    tighten.frequency.value = 120;
    const shaper = ctx.createWaveShaper();
    shaper.curve = distortionCurve(300);
    shaper.oversample = '4x';
    const cabinet = ctx.createBiquadFilter();
    cabinet.type = 'lowpass';
    cabinet.frequency.value = 4800;
    const scoop = ctx.createBiquadFilter(); // the "scooped mids" metal sound
    scoop.type = 'peaking';
    scoop.frequency.value = 500;
    scoop.Q.value = 0.8;
    scoop.gain.value = -6;
    const level = ctx.createGain();
    level.gain.value = 0.16;
    guitarIn.connect(tighten);
    tighten.connect(shaper);
    shaper.connect(cabinet);
    cabinet.connect(scoop);
    scoop.connect(level);
    level.connect(out);

    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  // A power chord (root, fifth, octave). Muted chugs are short and dark; open chords ring.
  function guitar(t, freq, duration, muted) {
    const env = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = muted ? 900 : 2600;
    tone.connect(env);
    env.connect(guitarIn);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.6, t + 0.005);
    const end = t + duration;
    env.gain.setValueAtTime(0.6, Math.max(t + 0.006, end - 0.06));
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    for (const [ratio, detune] of [[1, -7], [1, 7], [1.4983, 0], [2, 0]]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq * ratio;
      osc.detune.value = detune;
      osc.connect(tone);
      osc.start(t);
      osc.stop(end + 0.01);
    }
  }

  function bass(t, freq, duration) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq / 2;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.32, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(filter);
    filter.connect(env);
    env.connect(out);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  function kick(t) {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.85, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(env);
    env.connect(out);
    osc.start(t);
    osc.stop(t + 0.31);
    drumNoise(t, 0.02, 'highpass', 3000, 0.15); // beater click
  }

  function snare(t) {
    drumNoise(t, 0.18, 'bandpass', 1800, 0.5);
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.1);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.3, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    osc.connect(env);
    env.connect(out);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  function drumNoise(t, duration, type, freq, gain) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter);
    filter.connect(env);
    env.connect(out);
    src.start(t);
    src.stop(t + duration + 0.01);
  }

  function playStep(t, stepTime) {
    const bars = song.sections[section];
    const bar = bars[barIndex % bars.length];
    const ch = bar.riff[step];
    const lower = ch.toLowerCase();
    if (lower in NOTE_OFFSETS) {
      const freq = song.rootHz * Math.pow(2, NOTE_OFFSETS[lower] / 12);
      const muted = ch === lower;
      // Ring for as long as the "-" marks after the chord say.
      let length = 1;
      while (!muted && step + length < 16 && bar.riff[step + length] === '-') length++;
      const duration = muted ? 0.11 : length * stepTime * 0.95;
      guitar(t, freq, duration, muted);
      bass(t, freq, Math.max(0.12, duration));
    }
    const kit = song.drums[bar.drums];
    if (kit.kick[step] === 'x') kick(t);
    if (kit.snare[step] === 'x') snare(t);
    if (kit.hat[step] === 'x') drumNoise(t, 0.04, 'highpass', 7000, 0.09);
    if (step === 0 && barIndex === 0) drumNoise(t, 1.2, 'highpass', 5000, 0.18); // crash cymbal
  }

  // Look a little way ahead and schedule any notes due, so the timing stays tight.
  function schedule() {
    const stepTime = 60 / song.bpm / 4;
    if (nextTime < ctx.currentTime - 0.2) nextTime = ctx.currentTime + 0.05; // tab was in the background
    while (nextTime < ctx.currentTime + 0.12) {
      playStep(nextTime, stepTime);
      nextTime += stepTime;
      step += 1;
      if (step === 16) {
        step = 0;
        barIndex += 1;
        if (pendingSection) {
          section = pendingSection;
          pendingSection = null;
          barIndex = 0;
        }
      }
    }
  }

  return {
    start(round) {
      if (timer) return;
      ctx = Sound.context();
      if (!ctx || !SONGS[round]) return;
      song = SONGS[round];
      buildChain();
      nextTime = ctx.currentTime + 0.1;
      timer = setInterval(schedule, 25);
    },

    // Switch riffs at the start of the next bar (e.g. 'boss' while the devil fights).
    setSection(name) {
      if (!song || !song.sections[name] || name === section || name === pendingSection) return;
      pendingSection = name;
    },

    toggle() {
      enabled = !enabled;
      saveEnabled();
      if (out) out.gain.setTargetAtTime(enabled ? MUSIC_VOLUME : 0, ctx.currentTime, 0.1);
      return enabled;
    },

    // Fade out and stop (when you die or finish a round).
    stop() {
      if (!timer) return;
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      setTimeout(() => {
        clearInterval(timer);
        timer = null;
      }, 2000);
    },
  };
})();
