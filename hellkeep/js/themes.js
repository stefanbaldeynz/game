// The colour themes shared by every round: the hell theme (rounds 1, 3 and 4) and the
// ice theme (round 2). Each sets the colours of the walls, rock, floors, lava or water,
// sky, banners, fire and lights. Used by rounds.js and the side-on rounds (side.html).

const HELL_THEME = {
  background: 0x1c0504,
  fogDensity: 0.03,
  hemi: [0xff9a6a, 0x3a1010, 1.4],
  exposure: 1.45, // overall brightness with the modern graphics on
  wall: { mortar: '#120c0a', hue: [4, 18], sat: [12, 24], light: [20, 32], speckle: ['#000', '#3a2a24', '#6a4a3a'], soot: 'rgba(25, 0, 0, 0.6)' },
  rock: { base: '#2e1610', blotches: ['#120806', '#4a2218', '#3a1a12'], speckle: ['#000', '#5a2a1c', '#1a0a06'], glow: 'rgba(255, 90, 20, 0.6)' },
  floor: { grout: '#0e0a09', hue: [0, 15], sat: [6, 16], light: [17, 25], speckle: ['#000', '#3a2a24', '#5a4034'], stain: '#3a0503' },
  ground: { base: '#221009', blotches: ['#0e0604', '#3a1a10', '#2a120a'], speckle: ['#000', '#4a2414', '#140804'], crack: 'rgba(0, 0, 0, 0.75)', glow: 'rgba(255, 100, 20, 0.55)' },
  ceiling: { base: '#150e0b', beam: '#2a170c' },
  hazard: { name: 'lava', base: '#e04a00', bright: ['#ffb020', '#ff7a10'], hot: ['#ffe070'], crust: ['#2a0602', '#4a0e04'], cracks: 'rgba(255, 220, 80, 0.8)' },
  sky: [[0, '#070101'], [0.3, '#2a0603'], [0.46, '#8a2208'], [0.5, '#d04a10'], [0.54, '#3a0804'], [1, '#0a0202']],
  skyClouds: ['#000', '#1a0302'],
  skyGlow: '#ff5a10',
  banner: { dark: '#3a0303', mid: '#7a0a08', trim: '#c89a3a', flame: '#ff9a20' },
  palette: 'fire',
  brazierLight: 0xff7030,
  coals: 0xff7a20,
  snow: false,
};

const ICE_THEME = {
  background: 0x0a1424,
  fogDensity: 0.03,
  hemi: [0x9ad0ff, 0x101a30, 1.35],
  exposure: 1.1,
  wall: { mortar: '#0a0f18', hue: [195, 215], sat: [15, 30], light: [28, 42], speckle: ['#000', '#2a3a4a', '#9ac8e8'], soot: 'rgba(200, 230, 255, 0.3)' },
  rock: { base: '#1a2a3a', blotches: ['#0a121c', '#3a5a78', '#2a4058'], speckle: ['#000', '#5a7a98', '#0a1420'], glow: 'rgba(90, 200, 255, 0.6)' },
  floor: { grout: '#0a0f16', hue: [200, 215], sat: [15, 30], light: [30, 42], speckle: ['#000', '#3a5068', '#bfe0f5'], stain: '#9fd8ff' },
  ground: { base: '#9fb4c8', blotches: ['#e8f2fa', '#7f94aa', '#b8cadc'], speckle: ['#fff', '#6a8098', '#dfe9f2'], crack: 'rgba(40, 60, 90, 0.6)', glow: 'rgba(120, 220, 255, 0.6)' },
  ceiling: { base: '#0c121a', beam: '#1a2a3a' },
  hazard: { name: 'freezing water', base: '#2a90d0', bright: ['#7fd4ff', '#4ab0ff'], hot: ['#e8fbff'], crust: ['#0a2a48', '#14406a'], cracks: 'rgba(220, 250, 255, 0.85)' },
  sky: [[0, '#01030a'], [0.3, '#06122a'], [0.46, '#1a4a7a'], [0.5, '#5ab0e0'], [0.54, '#0a1a30'], [1, '#02050a']],
  skyClouds: ['#000', '#020814'],
  skyGlow: '#5ac8ff',
  banner: { dark: '#031a3a', mid: '#0a3a7a', trim: '#b8d8f0', flame: '#5ad0ff' },
  palette: 'frost',
  brazierLight: 0x50b0ff,
  coals: 0x6ad0ff,
  snow: true,
};
