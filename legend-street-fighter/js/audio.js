// All the sound is synthesised: FM voices through a distortion for the Mega-Drive-goes-metal
// music, noise bursts for the drums and hits, and the browser's speech voice as the announcer.

const Sound = (() => {
  let ac = null, master, musicBus, sfxBus, noiseBuf, drive;
  const opts = { music: true, sfx: true, announcer: true };
  let song = null, step = 0, nextTime = 0, timer = null, wanted = null;

  const NOTE = { c: 0, 'c#': 1, d: 2, 'd#': 3, e: 4, f: 5, 'f#': 6, g: 7, 'g#': 8, a: 9, 'a#': 10, b: 11 };
  function freq(name) {
    const m = /^([a-g]#?)(\d)$/.exec(name);
    if (!m) return 0;
    return 440 * Math.pow(2, (NOTE[m[1]] + 12 * (Number(m[2]) + 1) - 69) / 12);
  }
  const parse = (s) => s.trim().split(/\s+/);

  const SONGS = {
    menu: {
      bpm: 138,
      guitar: parse('e2 e2 . e2 g2 . e2 . a2 a#2 a2 g2 e2 . d2 . e2 e2 . e2 g2 . e2 . b2 a#2 a2 g2 a2 . g2 .'),
      lead: parse('e4 . . . . . . . g4 . . . a4 . . . b4 . . . . . . . a#4 . a4 . g4 . e4 .'),
      drums: 'k.h.s.h.k.k.s.h.k.h.s.h.k.k.s.s.',
    },
    london: {
      bpm: 168,
      guitar: parse('a2 a2 a2 . c3 a2 . a2 d3 d3 c3 . g2 g2 a2 . a2 a2 a2 . c3 a2 . a2 f2 f2 g2 . e2 e2 g#2 .'),
      lead: parse('a4 . c5 . e5 . a5 . g5 . e5 . d5 . c5 . a4 . c5 . e5 . d5 . c5 . b4 . g#4 . e4 .'),
      drums: 'k.h.s.h.k.h.s.h.k.h.s.h.k.k.s.s.',
    },
    berlin: {
      bpm: 132,
      guitar: parse('f#2 . f#2 f#2 . f#2 a2 . f#2 . f#2 f#2 . e2 . e2 d2 . d2 d2 . d2 f#2 . c#2 . c#2 c#2 . e2 . c#2'),
      lead: parse('f#5 . c#5 . a4 . c#5 . f#5 . e5 . c#5 . a4 . d5 . a4 . f#4 . a4 . c#5 . g#4 . e#4 . g#4 .'.replace(/e#/g, 'f')),
      drums: 'k.h.k.s.k.h.k.s.k.h.k.s.k.h.s.s.',
    },
    ostrava: {
      bpm: 84,
      guitar: parse('d2 d2 . . . . d2 . g#2 . . . g2 . f2 . d2 d2 . . . . d2 . a#1 . . . a1 . g#1 .'),
      lead: parse('. . . . d4 . . . . . . . g#3 . . . . . . . f4 . . . e4 . . . d4 . . .'),
      drums: 'k...s..hk.k.s...k...s..hk.k.s.s.',
    },
    win: {
      bpm: 170,
      guitar: parse('e2 . e2 . g2 . a2 . b2 . . . e3 . . . e2 . e2 . g2 . a2 . b2 . d3 . e3 . . .'),
      lead: parse('e5 . g5 . a5 . b5 . e6 . . . . . . . d6 . b5 . a5 . g5 . e5 . g5 . e5 . . .'),
      drums: 'k.h.s.h.k.h.s.h.k.h.s.h.k.k.s.s.',
    },
  };

  function makeDrive() {
    const n = 1024, curve = new Float32Array(n), k = 30;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
    }
    return curve;
  }

  function unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ac) {
      ac = new AC();
      master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination);
      musicBus = ac.createGain(); musicBus.gain.value = opts.music ? 0.5 : 0; musicBus.connect(master);
      sfxBus = ac.createGain(); sfxBus.gain.value = opts.sfx ? 0.9 : 0; sfxBus.connect(master);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      drive = makeDrive();
      timer = setInterval(schedule, 40);
      if (wanted) play(wanted);
    }
    if (ac.state === 'suspended') ac.resume();
  }

  // A two-operator FM voice.
  function fm(bus, t, f, dur, o = {}) {
    const car = ac.createOscillator(), mod = ac.createOscillator();
    const modGain = ac.createGain(), env = ac.createGain();
    car.type = o.wave || 'sine';
    car.frequency.setValueAtTime(f, t);
    if (o.slide) car.frequency.exponentialRampToValueAtTime(Math.max(20, f * o.slide), t + dur);
    mod.frequency.setValueAtTime(f * (o.ratio || 2), t);
    modGain.gain.setValueAtTime(f * (o.index || 2), t);
    modGain.gain.exponentialRampToValueAtTime(Math.max(1, f * 0.05), t + dur);
    mod.connect(modGain); modGain.connect(car.frequency);
    const vol = o.vol || 0.2;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(vol, t + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    car.connect(env);
    let out = env;
    if (o.dist) {
      const ws = ac.createWaveShaper(); ws.curve = drive;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp || 2600;
      env.connect(ws); ws.connect(lp); out = lp;
    }
    out.connect(bus);
    car.start(t); mod.start(t);
    car.stop(t + dur + 0.02); mod.stop(t + dur + 0.02);
  }

  function noise(bus, t, dur, o = {}) {
    const src = ac.createBufferSource(); src.buffer = noiseBuf;
    src.loop = true;
    const flt = ac.createBiquadFilter(); flt.type = o.type || 'highpass';
    flt.frequency.setValueAtTime(o.f || 1000, t);
    if (o.f2) flt.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    const env = ac.createGain();
    env.gain.setValueAtTime(o.vol || 0.3, t);
    if (o.swell) {
      env.gain.setValueAtTime(0.001, t);
      env.gain.linearRampToValueAtTime(o.vol || 0.3, t + dur * o.swell);
    }
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(flt); flt.connect(env); env.connect(bus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  function drumHit(ch, t) {
    if (ch === 'k') fm(musicBus, t, 120, 0.13, { slide: 0.35, ratio: 1, index: 1.5, vol: 0.75 });
    if (ch === 's') { noise(musicBus, t, 0.13, { f: 1500, vol: 0.32 }); fm(musicBus, t, 190, 0.08, { slide: 0.6, vol: 0.2, ratio: 1 }); }
    if (ch === 'h') noise(musicBus, t, 0.03, { f: 7000, vol: 0.09 });
  }

  function schedule() {
    if (!ac || !song || ac.state !== 'running') return;
    if (nextTime < ac.currentTime) nextTime = ac.currentTime + 0.03;
    const dt = 60 / song.bpm / 4;
    while (nextTime < ac.currentTime + 0.18) {
      const g = song.guitar[step % song.guitar.length];
      const l = song.lead[step % song.lead.length];
      const d = song.drums[step % song.drums.length];
      if (g && g !== '.') {
        const f = freq(g), t = nextTime, len = dt * 0.95;
        fm(musicBus, t, f, len, { wave: 'sawtooth', ratio: 1, index: 0.8, vol: 0.2, dist: true, lp: 2000 });
        fm(musicBus, t, f * 1.5, len, { wave: 'sawtooth', ratio: 1, index: 0.4, vol: 0.13, dist: true, lp: 2000 });
      }
      if (l && l !== '.') fm(musicBus, nextTime, freq(l), dt * 3, { wave: 'square', ratio: 3, index: 1.2, vol: 0.05 });
      if (d) drumHit(d, nextTime);
      step++;
      nextTime += dt;
    }
  }

  function play(name) {
    wanted = name;
    if (!ac) return;
    song = SONGS[name] || null;
    step = 0;
    nextTime = ac.currentTime + 0.05;
  }
  function stopMusic() { wanted = null; song = null; }

  const SFX = {
    punch: (t) => { noise(sfxBus, t, 0.07, { f: 700, vol: 0.5, type: 'lowpass', f2: 200 }); fm(sfxBus, t, 180, 0.08, { slide: 0.4, vol: 0.4 }); },
    kick: (t) => { noise(sfxBus, t, 0.11, { f: 500, vol: 0.6, type: 'lowpass', f2: 120 }); fm(sfxBus, t, 110, 0.13, { slide: 0.4, vol: 0.55 }); },
    block: (t) => { fm(sfxBus, t, 900, 0.05, { ratio: 3.3, index: 3, vol: 0.2 }); noise(sfxBus, t, 0.03, { f: 3000, vol: 0.15 }); },
    whoosh: (t) => noise(sfxBus, t, 0.12, { type: 'bandpass', f: 500, f2: 2200, vol: 0.13 }),
    land: (t) => noise(sfxBus, t, 0.14, { type: 'lowpass', f: 300, f2: 80, vol: 0.6 }),
    ko: (t) => { fm(sfxBus, t, 220, 1.0, { slide: 0.15, ratio: 1.5, index: 6, vol: 0.6, wave: 'sawtooth', dist: true }); noise(sfxBus, t, 0.5, { type: 'lowpass', f: 900, f2: 100, vol: 0.8 }); },
    star: (t) => fm(sfxBus, t, 1400, 0.16, { slide: 1.7, ratio: 2.5, index: 2, vol: 0.14 }),
    paper: (t) => { for (let i = 0; i < 4; i++) noise(sfxBus, t + i * 0.035, 0.04, { f: 3500, vol: 0.2 }); },
    stamp: (t) => { noise(sfxBus, t, 0.08, { type: 'lowpass', f: 900, vol: 0.7 }); fm(sfxBus, t, 90, 0.1, { vol: 0.4 }); },
    ghost: (t) => { fm(sfxBus, t, 300, 0.9, { slide: 2.2, ratio: 1.01, index: 3, vol: 0.2 }); fm(sfxBus, t + 0.1, 450, 0.8, { slide: 0.6, ratio: 1.5, index: 2, vol: 0.12 }); },
    boom: (t) => { noise(sfxBus, t, 1.1, { type: 'lowpass', f: 2400, f2: 60, vol: 1.0 }); fm(sfxBus, t, 80, 0.8, { slide: 0.3, ratio: 0.5, index: 5, vol: 0.8, dist: true }); },
    gulp: (t) => { for (let i = 0; i < 3; i++) fm(sfxBus, t + i * 0.2, 260, 0.13, { slide: 1.8, vol: 0.28 }); },
    sniff: (t) => { noise(sfxBus, t, 0.35, { type: 'bandpass', f: 2000, f2: 6500, vol: 0.5, swell: 0.7 }); fm(sfxBus, t + 0.4, 500, 0.5, { slide: 3, ratio: 4, index: 3, vol: 0.2 }); },
    chomp: (t) => { for (let i = 0; i < 3; i++) noise(sfxBus, t + i * 0.16, 0.08, { type: 'lowpass', f: 900, vol: 0.5 }); },
    chord: (t) => {
      for (const m of [1, 1.5, 2, 3]) fm(sfxBus, t, 82.4 * m, 1.3, { wave: 'sawtooth', ratio: 1, index: 0.6, vol: 0.17, dist: true, lp: 3200 });
    },
    roar: (t) => noise(sfxBus, t, 1.5, { type: 'bandpass', f: 1200, vol: 0.32, swell: 0.3 }),
    rage: (t) => {
      fm(sfxBus, t, 70, 1.7, { slide: 6, ratio: 1.5, index: 5, vol: 0.45, wave: 'sawtooth', dist: true });
      noise(sfxBus, t, 1.7, { type: 'bandpass', f: 400, f2: 4000, vol: 0.45, swell: 0.8 });
    },
    buzz: (t) => fm(sfxBus, t, 90, 0.16, { wave: 'square', ratio: 1, index: 1, vol: 0.2 }),
    move: (t) => fm(sfxBus, t, 700, 0.05, { ratio: 2, index: 1, vol: 0.14, wave: 'square' }),
    pick: (t) => { fm(sfxBus, t, 520, 0.08, { wave: 'square', vol: 0.16 }); fm(sfxBus, t + 0.07, 780, 0.14, { wave: 'square', vol: 0.16 }); },
    bell: (t) => fm(sfxBus, t, 880, 0.7, { ratio: 3.5, index: 2, vol: 0.25 }),
  };

  function sfx(name) {
    if (!ac || !SFX[name] || !opts.sfx) return;
    if (ac.state !== 'running') return;
    SFX[name](ac.currentTime);
  }

  function say(words) {
    if (!opts.announcer || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(words);
      u.pitch = 0.3; u.rate = 0.85; u.volume = 1;
      speechSynthesis.speak(u);
    } catch (e) { /* no voice on this device: the banners still show */ }
  }

  function configure(s) {
    opts.music = !!s.music; opts.sfx = !!s.sfx; opts.announcer = !!s.announcer;
    if (ac) { musicBus.gain.value = opts.music ? 0.5 : 0; sfxBus.gain.value = opts.sfx ? 0.9 : 0; }
  }

  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (document.hidden) ac.suspend(); else ac.resume();
  });

  return { unlock, play, stopMusic, sfx, say, configure };
})();
