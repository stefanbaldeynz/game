// Every balance number in the game lives here. Change them to make it easier or harder.

const CONFIG = {
  startMoney: 30,        // enough for 3 towers
  startLives: 20,        // a kiwi reaching the end costs 1 life
  totalWaves: 10,
  killReward: 1,         // $ per kiwi, whether a tower or you got it
  waveBonus: (wave) => 5 + wave * 3, // extra $ for clearing a wave
  timeBetweenWaves: 20,  // seconds before the next wave starts by itself

  kiwi: {
    count: (wave) => 6 + wave * 2,                              // kiwis in the wave
    health: (wave) => Math.round(100 * Math.pow(1.18, wave - 1)), // 100 on wave 1, then +18% per wave
    speed: (wave) => 3.2 + (wave - 1) * 0.15,                    // units per second
    spawnInterval: (wave) => Math.max(0.6, 1.4 - wave * 0.08),   // seconds between kiwis
  },

  tower: {
    buildCost: 10,
    // Level 1 is what you build; levels 2-4 are the three upgrades.
    levels: [
      { upgradeCost: 0, damage: 10, fireRate: 1.6, range: 10 },
      { upgradeCost: 15, damage: 16, fireRate: 1.9, range: 11 },
      { upgradeCost: 25, damage: 24, fireRate: 2.3, range: 12.5 },
      { upgradeCost: 40, damage: 34, fireRate: 2.8, range: 14 },
    ],
  },

  rifle: {
    magazine: 30,
    reloadTime: 1.5,
    fireInterval: 0.16, // seconds between shots (hold the mouse button)
    spread: 0.012,
    // 10 damage = 10 shots for a wave 1 kiwi. Upgrade it from tower view.
    levels: [
      { upgradeCost: 0, damage: 10 },
      { upgradeCost: 20, damage: 16 },
      { upgradeCost: 35, damage: 24 },
      { upgradeCost: 50, damage: 34 },
    ],
  },
};
