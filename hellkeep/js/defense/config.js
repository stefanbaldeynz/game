// Round 5: The Hellgate Siege. Tower defence with a first-person mode (from Kiwi Canyon),
// set in hell. Every balance number and the map live here.

const THEME = HELL_THEME; // the hell colour theme (themes.js)

const SIEGE = {
  title: 'Round 5 · The Hellgate Siege',
  intro: 'Hell is coming to take back the keep. Build fire towers in the courtyard, then drop onto the road with your rifle. Three waves: hellhounds, ice elephants, then the devils themselves.',
  startMoney: 40,         // enough for 4 towers
  startLives: 20,
  timeBetweenWaves: 25,   // seconds before the next wave starts by itself

  // The three waves. hp = rifle damage to kill one (a level 1 rifle shot is 10).
  // cost = lives lost if one gets through; reward = money for killing one.
  waves: [
    { type: 'hound', name: 'Hellhounds', count: 16, hp: 70, speed: 5.5, spacing: 0.9, reward: 2, cost: 1, bonus: 25 },
    { type: 'elephant', name: 'Ice elephants', count: 8, hp: 650, speed: 2.6, spacing: 2.6, reward: 7, cost: 3, bonus: 40 },
    { type: 'devil', name: 'Devils', count: 5, hp: 1600, speed: 2.2, spacing: 4.5, reward: 20, cost: 6, bonus: 0 },
  ],

  tower: {
    buildCost: 10,
    // Level 1 is what you build; levels 2-4 are the three upgrades.
    levels: [
      { upgradeCost: 0, damage: 12, fireRate: 1.5, range: 10 },
      { upgradeCost: 15, damage: 20, fireRate: 1.8, range: 11 },
      { upgradeCost: 25, damage: 32, fireRate: 2.2, range: 12.5 },
      { upgradeCost: 40, damage: 48, fireRate: 2.7, range: 14 },
    ],
  },

  rifle: {
    magazine: 30,
    reloadTime: 1.5,
    fireInterval: 0.12, // seconds between shots (hold the mouse button)
    spread: 0.012,
    levels: [
      { upgradeCost: 0, damage: 10 },
      { upgradeCost: 20, damage: 16 },
      { upgradeCost: 35, damage: 24 },
      { upgradeCost: 50, damage: 34 },
    ],
  },
};

// ---------- The map ----------
// One cell is 4 units (about metres). The sunken road is 5 deep.
//   .  courtyard: you can build towers here
//   T  a brazier in the courtyard (no building)
//   =  the sunken road: the beasts' path, and where you walk in first-person mode
//   S  the fortress gates, where they come in    E  the gate of the keep, which they're after
const SIEGE_CELL = 4;
const SIEGE_RIM = 5;
const SIEGE_MAP = [
  '..T....T.....T....',
  '..................',
  'S===============..',
  '...............=.T',
  '.T.............=..',
  '...............=..',
  '..==============..',
  '..=..............T',
  'T.=......T........',
  '..=...............',
  '..===============E',
  '.......T..........',
  '...T.........T...T',
];
