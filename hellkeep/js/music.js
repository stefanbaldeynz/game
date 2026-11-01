// Industrial metal soundtrack (Rammstein style), played live by code. No audio files.
//
// The guitar uses "Karplus-Strong" synthesis: a burst of noise bounces around a tiny loop
// tuned to the note, losing a little brightness each time, just like a plucked string.
// Every chord is "recorded" twice and panned hard left and right, then pushed through
// a high-gain distortion and a speaker-cabinet EQ, the way real metal guitars are mixed.
//
// HOW THE RIFFS ARE WRITTEN
// Each bar is 16 characters, one per 16th note:
//   lowercase letter = palm-muted chug      UPPERCASE = ringing power chord
//   -  = keep the chord ringing             .  = silence (tight industrial stops!)
// Letters are notes counted up from the song's lowest note:
//   e = root   f = +1   g = +3   a = +5   b = +6 (the "devil's interval")   h = +7   c = +8   d = +10
// "pad" is the synth chord under the bar (a minor chord on that letter), or '' for none.
// Drum bars use x for a hit and . for nothing.

// Recorded soundtracks (MP3s in the music folder) by round. Rounds without one use the
// synthesised songs below. To use your own track, drop it in hellkeep/music/ and list it here.
const TRACKS = {
  2: 'music/Blood_and_Iron_Rite.mp3', // the gorge
  4: 'music/Blood_and_Iron_Rite.mp3', // the burning keep
};

const NOTE_OFFSETS = { e: 0, f: 1, g: 3, a: 5, b: 6, h: 7, c: 8, d: 10 };

const SONGS = {
  // The keep: a stomping industrial march in drop D. A relentless riff takes over for bosses.
  keep: {
    bpm: 118,
    rootHz: 73.42, // D2 (drop D)
    drums: {
      march: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
      marchPush: { kick: 'x...x...x..xx...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
      stomp: { kick: 'x..xx..xx..xx...', snare: '....x.......x.x.', hat: 'x.x.x.x.x.x.x.x.' },
      fill: { kick: 'x...x...x.......', snare: '....x...x.xxxxxx', hat: 'x.x.x.x.........' },
      drive: { kick: 'x.x.x.x.x.x.x.x.', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx' },
      driveFill: { kick: 'x.x.x.x.x.x.x.x.', snare: '....x...x.x.xxxx', hat: 'xxxxxxxx........' },
    },
    sections: {
      main: [
        { riff: 'e.ee.e.ee.e.e.e.', drums: 'march', pad: '' },
        { riff: 'e.ee.e.ee.e.G-F-', drums: 'marchPush', pad: '' },
        { riff: 'e.ee.e.ee.e.e.e.', drums: 'march', pad: '' },
        { riff: 'e.ee.e.ee.C-B-G-', drums: 'fill', pad: '' },
        { riff: 'E---e.e.E---e.e.', drums: 'stomp', pad: 'e' },
        { riff: 'G---g.g.F---f.f.', drums: 'stomp', pad: 'g' },
        { riff: 'E---e.e.E---e.e.', drums: 'stomp', pad: 'e' },
        { riff: 'C---B---G-------', drums: 'fill', pad: 'c' },
      ],
      boss: [
        { riff: 'eeee.eeeeeee.eG.', drums: 'drive', pad: 'e' },
        { riff: 'eeee.eeeeeee.eB.', drums: 'drive', pad: 'e' },
        { riff: 'eeee.eeeeeee.eC.', drums: 'drive', pad: 'c' },
        { riff: 'G-G-F-F-E-E-B-B-', drums: 'driveFill', pad: 'g' },
      ],
    },
  },
  // The frozen depths: slow and crushing, tuned all the way down to C.
  frozen: {
    bpm: 100,
    rootHz: 65.41, // C2
    drums: {
      heavy: { kick: 'x.....x.x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
      heavyFill: { kick: 'x.....x.x.......', snare: '....x.......xxxx', hat: 'x.x.x.x.x.......' },
      chug: { kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
      blast: { kick: 'xxxxxxxxxxxxxxxx', snare: '..x...x...x...x.', hat: 'x.x.x.x.x.x.x.x.' },
      blastFill: { kick: 'xxxxxxxx........', snare: '..x...x.xxxxxxxx', hat: 'x.x.x.x.........' },
    },
    sections: {
      // The Balrog: double-kick blasting under a creeping tritone.
      boss: [
        { riff: 'eeeeeeeeB---B---', drums: 'blast', pad: 'e' },
        { riff: 'eeeeeeeeC---B---', drums: 'blast', pad: 'e' },
        { riff: 'eeeeeeeeB---B---', drums: 'blast', pad: 'e' },
        { riff: 'G-F-E-B-G-F-E-B-', drums: 'blastFill', pad: 'b' },
      ],
      main: [
        { riff: 'E-------e.e.e.e.', drums: 'heavy', pad: 'e' },
        { riff: 'E-------g.g.f.f.', drums: 'heavy', pad: 'e' },
        { riff: 'E-------e.e.e.e.', drums: 'heavy', pad: 'e' },
        { riff: 'B-------A---G---', drums: 'heavyFill', pad: 'g' },
        { riff: 'e.ee.ee.e.ee.ee.', drums: 'chug', pad: '' },
        { riff: 'e.ee.ee.e.G-F-E-', drums: 'chug', pad: '' },
        { riff: 'e.ee.ee.e.ee.ee.', drums: 'chug', pad: '' },
        { riff: 'C-------B-------', drums: 'heavyFill', pad: 'c' },
      ],
    },
  },
};
// The song for each round (used when it has no MP3, or the MP3 is missing).
// Round 1, the motorbike ride, plays the keep's relentless boss riff the whole way.
// Round 3 switches to its boss riff for the Balrog, round 5 for the devils.
SONGS[1] = SONGS.keep;
SONGS[2] = SONGS.keep;
SONGS[3] = SONGS.frozen;
SONGS[4] = SONGS.keep;
SONGS[5] = SONGS.keep;

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
  const MUSIC_VOLUME = 0.6;
  const TRACK_VOLUME = 0.55; // recorded tracks are mastered loud, so play them a little quieter
  let track = null;        // the <audio> element when a recorded track is playing
  let trackFade = null;
  let ctx = null;
  let out = null;          // music volume (mute toggles this)
  let guitarSides = null;  // left and right guitar amps
  let reverb = null;       // big room echo for the snare and synths
  let noiseBuffer = null;
  let chordCache = {};
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

  // Small seeded random generator, so the left and right guitars get different "takes".
  function seededRandom(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // One plucked string (Karplus-Strong). Palm mutes die away fast and sound darker.
  function pluckString(target, offset, freq, muted, random, amplitude) {
    const sr = ctx.sampleRate;
    const delay = sr / freq - 0.5; // the averaging below adds half a sample of delay
    const sustain = muted ? 0.9 : 0.9985;
    const excitationLength = Math.ceil(delay) + 2;
    const pickPosition = Math.max(1, Math.floor(delay * 0.13));
    const string = new Float32Array(target.length - offset);

    // The pick: a short burst of filtered noise, with a notch from where the string is picked.
    let lp = 0;
    for (let i = 0; i < excitationLength && i < string.length; i++) {
      lp += (random() * 2 - 1 - lp) * (muted ? 0.3 : 0.75);
      string[i] = lp;
    }
    for (let i = Math.min(excitationLength, string.length) - 1; i >= pickPosition; i--) string[i] -= string[i - pickPosition];

    // The string vibrating: each sample is the average of two samples one loop earlier.
    let damp = 0;
    for (let i = excitationLength; i < string.length; i++) {
      const p = i - delay;
      const i0 = Math.floor(p);
      const frac = p - i0;
      const a = string[i0] + (string[i0 + 1] - string[i0]) * frac;
      const b = string[i0 - 1] + (string[i0] - string[i0 - 1]) * frac;
      let y = sustain * 0.5 * (a + b);
      if (muted) {
        damp += (y - damp) * 0.45; // the palm resting on the strings
        y = damp;
      }
      string[i] = y;
    }
    for (let i = 0; i < string.length; i++) target[offset + i] += string[i] * amplitude;
  }

  // A power chord (root, fifth, octave) strummed downwards, as one buffer per side.
  function chordBuffer(letter, muted, side) {
    const key = `${song.rootHz}|${letter}|${muted}|${side}`;
    if (chordCache[key]) return chordCache[key];
    const seconds = muted ? 0.35 : 3;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    const random = seededRandom(letter.charCodeAt(0) * 97 + (muted ? 7 : 0) + side * 1013);
    const root = song.rootHz * Math.pow(2, NOTE_OFFSETS[letter] / 12);
    const strum = Math.floor(ctx.sampleRate * 0.006);
    [[1, 1], [1.4983, 0.8], [2, 0.55]].forEach(([ratio, amplitude], i) => {
      pluckString(data, i * strum, root * ratio * (1 + (random() - 0.5) * 0.002), muted, random, amplitude);
    });
    chordCache[key] = buffer;
    return buffer;
  }

  // Smooth, heavy saturation curve for the high-gain amp.
  function ampCurve(gain) {
    const n = 4096;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.tanh(gain * x) / Math.tanh(gain);
    }
    return curve;
  }

  function filter(type, frequency, gain = 0, Q = 0.8) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = frequency;
    f.gain.value = gain;
    f.Q.value = Q;
    return f;
  }

  function chain(...nodes) {
    for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
    return nodes[0];
  }

  // A guitar amp + speaker cabinet, panned to one side.
  function buildGuitarSide(pan) {
    const input = ctx.createGain();
    const shaper = ctx.createWaveShaper();
    shaper.curve = ampCurve(18);
    shaper.oversample = '4x';
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    const level = ctx.createGain();
    level.gain.value = 0.2;
    chain(
      input,
      filter('highpass', 110),               // tighten the low end before distortion
      filter('peaking', 900, 7, 0.9),        // mid push into the amp
      shaper,
      filter('highpass', 75),
      filter('peaking', 110, 4, 1),          // cabinet thump
      filter('peaking', 450, -7, 1),         // scooped mids
      filter('peaking', 2400, 4, 1.2),       // bite
      filter('lowpass', 5200, 0, 0.7),       // speaker roll-off
      filter('lowpass', 7000, 0, 0.7),
      panner,
      level,
      out,
    );
    return input;
  }

  // A generated "big room" echo (an impulse response made of decaying noise).
  function buildReverb() {
    const convolver = ctx.createConvolver();
    const length = Math.floor(ctx.sampleRate * 1.6);
    const ir = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
    convolver.buffer = ir;
    const ret = ctx.createGain();
    ret.gain.value = 0.3;
    chain(convolver, ret, out);
    return convolver;
  }

  function buildChain() {
    out = ctx.createGain();
    out.gain.value = enabled ? MUSIC_VOLUME : 0;
    out.connect(Sound.output());
    guitarSides = [buildGuitarSide(-0.8), buildGuitarSide(0.8)];
    reverb = buildReverb();
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  function guitar(t, letter, duration, muted) {
    guitarSides.forEach((input, side) => {
      const src = ctx.createBufferSource();
      src.buffer = chordBuffer(letter, muted, side);
      const env = ctx.createGain();
      const start = t + side * 0.008; // the two "takes" are never perfectly in time
      const end = start + duration;
      env.gain.setValueAtTime(1, start);
      env.gain.setValueAtTime(1, Math.max(start + 0.01, end - 0.04));
      env.gain.linearRampToValueAtTime(0, end);
      src.connect(env);
      env.connect(input);
      src.start(start);
      src.stop(end + 0.02);
    });
  }

  function bass(t, freq, duration) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq / 2;
    const sub = ctx.createOscillator();
    sub.frequency.value = freq / 2;
    const lp = filter('lowpass', 240);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.3, t + 0.008);
    env.gain.setValueAtTime(0.3, Math.max(t + 0.01, t + duration - 0.05));
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(lp);
    sub.connect(lp);
    lp.connect(env);
    env.connect(out);
    for (const o of [osc, sub]) {
      o.start(t);
      o.stop(t + duration + 0.01);
    }
  }

  // Dark synth pad under the guitars: a detuned minor chord.
  function pad(t, letter, duration) {
    const root = song.rootHz * 4 * Math.pow(2, NOTE_OFFSETS[letter] / 12);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(0.035, t + 0.4);
    env.gain.setValueAtTime(0.035, t + duration - 0.3);
    env.gain.linearRampToValueAtTime(0.0001, t + duration);
    const lp = filter('lowpass', 1400);
    lp.connect(env);
    env.connect(out);
    env.connect(reverb);
    for (const semis of [0, 3, 7]) {
      for (const detune of [-9, 9]) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = root * Math.pow(2, semis / 12);
        osc.detune.value = detune;
        osc.connect(lp);
        osc.start(t);
        osc.stop(t + duration + 0.05);
      }
    }
  }

  // Punchy industrial kick: a fast pitch drop plus a click.
  function kick(t) {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.08);
    const env = ctx.createGain();
    env.gain.setValueAtTime(1, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(env);
    env.connect(out);
    osc.start(t);
    osc.stop(t + 0.36);
    drumNoise(t, 0.015, 'highpass', 2500, 0.25);
  }

  // Big snare with a room echo behind it.
  function snare(t) {
    drumNoise(t, 0.22, 'bandpass', 2000, 0.55, true);
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.1);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.35, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(env);
    env.connect(out);
    env.connect(reverb);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  function drumNoise(t, duration, type, freq, gain, toReverb = false) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const f = filter(type, freq);
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(f);
    f.connect(env);
    env.connect(out);
    if (toReverb) env.connect(reverb);
    src.start(t);
    src.stop(t + duration + 0.01);
  }

  function playStep(t, stepTime) {
    const bars = song.sections[section];
    const bar = bars[barIndex % bars.length];
    const ch = bar.riff[step];
    const lower = ch.toLowerCase();
    if (lower in NOTE_OFFSETS) {
      const muted = ch === lower;
      // Ring for as long as the "-" marks after the chord say.
      let length = 1;
      while (!muted && step + length < 16 && bar.riff[step + length] === '-') length++;
      const duration = muted ? Math.min(0.16, stepTime * 0.9) : Math.min(2.9, length * stepTime * 0.95);
      guitar(t, lower, duration, muted);
      bass(t, song.rootHz * Math.pow(2, NOTE_OFFSETS[lower] / 12), Math.max(0.12, duration));
    }
    if (step === 0 && bar.pad) pad(t, bar.pad, stepTime * 16);
    const kit = song.drums[bar.drums];
    if (kit.kick[step] === 'x') kick(t);
    if (kit.snare[step] === 'x') snare(t);
    if (kit.hat[step] === 'x') drumNoise(t, 0.045, 'highpass', 8000, 0.08);
    if (step === 0 && barIndex === 0) drumNoise(t, 1.4, 'highpass', 5000, 0.2, true); // crash cymbal
  }

  // Look a little way ahead and schedule any notes due, so the timing stays tight.
  function schedule() {
    const stepTime = 60 / song.bpm / 4;
    if (nextTime < ctx.currentTime - 0.2) nextTime = ctx.currentTime + 0.05; // tab was in the background
    while (nextTime < ctx.currentTime + 0.15) {
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

  // Recorded tracks are played with a plain <audio> element (it works when the game is
  // opened straight from a file). If one won't load or play, the synthesised song takes over.
  function startTrack(round) {
    const audio = new Audio(TRACKS[round]);
    audio.loop = true;
    audio.volume = enabled ? TRACK_VOLUME : 0;
    let failed = false;
    const fallBack = () => {
      if (failed || track !== audio) return;
      failed = true;
      track = null;
      audio.pause();
      startSynth(round);
    };
    audio.addEventListener('error', fallBack);
    audio.play().catch(fallBack);
    track = audio;
  }

  // Smoothly slide the recorded track's volume (the <audio> element has no built-in fade).
  function fadeTrack(to, seconds, then) {
    const audio = track;
    clearInterval(trackFade);
    const from = audio.volume;
    const start = performance.now();
    trackFade = setInterval(() => {
      const k = Math.min(1, (performance.now() - start) / (seconds * 1000));
      audio.volume = from + (to - from) * k;
      if (k >= 1) {
        clearInterval(trackFade);
        if (then) then();
      }
    }, 30);
  }

  function startSynth(round) {
    if (timer) return;
    ctx = Sound.context();
    if (!ctx || !SONGS[round]) return;
    song = SONGS[round];
    chordCache = {};
    buildChain();
    // Prepare every chord the song uses up front, so nothing stutters mid-game.
    for (const bars of Object.values(song.sections)) {
      for (const bar of bars) {
        for (const ch of bar.riff) {
          const lower = ch.toLowerCase();
          if (lower in NOTE_OFFSETS) for (const side of [0, 1]) chordBuffer(lower, ch === lower, side);
        }
      }
    }
    nextTime = ctx.currentTime + 0.1;
    timer = setInterval(schedule, 25);
  }

  return {
    // Play the round's recorded track if it has one, otherwise its synthesised song.
    start(round) {
      if (timer || track) return;
      if (TRACKS[round]) startTrack(round);
      else startSynth(round);
    },

    // Is a recorded track playing (rather than the synthesised song)?
    get playingTrack() {
      return !!track;
    },

    // Switch riffs at the start of the next bar (e.g. 'boss' while the devil fights).
    // Recorded tracks just keep playing.
    setSection(name) {
      if (!song || !song.sections[name] || name === section || name === pendingSection) return;
      pendingSection = name;
    },

    toggle() {
      enabled = !enabled;
      saveEnabled();
      if (track) fadeTrack(enabled ? TRACK_VOLUME : 0, 0.3);
      if (out) out.gain.setTargetAtTime(enabled ? MUSIC_VOLUME : 0, ctx.currentTime, 0.1);
      return enabled;
    },

    // Fade out and stop (when you die or finish a round).
    stop() {
      if (track) {
        const audio = track;
        fadeTrack(0, 1.5, () => audio.pause());
      }
      if (!timer) return;
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      setTimeout(() => {
        clearInterval(timer);
        timer = null;
      }, 2000);
    },
  };
})();
