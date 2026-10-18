// The 3D rounds: each has its own map, look (theme) and enemies.
// Open index.html#round=3 to jump straight to round 3.

// Map legend (shared by every round):
//   #  castle wall          R  rock cliff            Y  frozen dead tree
//   ,  castle floor         .  ground outside
//   L  lava / freezing pool (hurts when you stand in it)
//   T  brazier              P  player start
//   H  hellhound            E  ice elephant           D  the devil (boss)
//   B  the Balrog (boss)
//   a  ammo crate           h  health box             f  rifle
//   s  the Flak Shotgun on its display pedestal
// North is the top. You start in the south and walk north through the gate.
//
// Round options:
//   gate      [column, row] of the gateway in the castle's south wall
//   roofRows  how many rows from the top get a ceiling (0 = open to the sky)
//   keep      true = the keep towers over the north wall, with its great door in it
//   throne    [column, row] of the devil's throne, or null

const ROUNDS = {
  3: {
    title: 'Round 3 · The Frozen Depths',
    intro: 'Cross the frozen forest and fight through the courtyard to the keep. Ice elephants guard it, and a Balrog waits at the door.',
    theme: ICE_THEME,
    gate: [12, 18],
    roofRows: 0,
    fogDensity: 0.017, // thinner mist, so the keep looms over the forest
    keep: true,
    throne: null,
    towers: [[10, 18, 12], [14, 18, 12], [0, 18, 11], [24, 18, 11], [0, 0, 13], [24, 0, 13], [8, 10, 9], [16, 10, 9]],
    banners: [[9, 1], [15, 1], [8, 19], [16, 19]],
    loadout: { owned: { pistol: true, shotgun: true, rifle: true }, ammo: { bullets: 160, shells: 28 }, wings: true },
    map: [
      '#########################',
      '#,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,T,,,,,,,,,,,,,,,,,T,,#',
      '#,,,,,,,,,,,B,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,h,,,##,,,,,,,,,,##,,,a#',
      '#,,,,,##,,,,,,,,,,##,,,,#',
      '#,,E,,,,,,,T,,,T,,,,,,E,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,#',
      '###,,,,,#,,,,,,,#,,,,,###',
      '#,,,,,,,#,,,a,,,#,,,,,,,#',
      '#,,E,,,,,,,,,,,,,,,,,E,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,T,,,,,#,,,E,,,#,,,,,T,#',
      '#,,,,h,,#,,,,,,,#,,a,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,#',
      '###########,,,###########',
      'R.YY.Y.....T.T.....Y.YY.R',
      'RY.Y..Y.Y.......Y..Y.Y.YR',
      'RY..YY..LL.....E..Y.Y.Y.R',
      'R.YY.Y..LLL..Y.....Y.Y..R',
      'RY.Y.YY..L....Y..Y..Y.Y.R',
      'R..Y...Y.....a.....YY.Y.R',
      'RY.Y.Y....Y...Y.....Y.YYR',
      'R.Y.Y..E.....Y...LL..Y..R',
      'RY.Y...Y...Y....LLLL.Y.YR',
      'RY..Y.Y...........LL.Y.YR',
      'R.Y.Y..h..Y...Y.....Y.Y.R',
      'RY.Y.Y.......Y..Y...YY.YR',
      'R..Y..YY..Y........Y.Y..R',
      'RY.Y.......P....a...YY.YR',
      'R.YY.Y..Y.......Y..YY.Y.R',
      'RRRRRRRRRRRRRRRRRRRRRRRRR',
    ],
  },
  4: {
    title: 'Round 4 · The Burning Keep',
    intro: 'Inside the keep. Kill every hellhound, and the devil on the throne.',
    theme: HELL_THEME,
    gate: [12, 18],
    roofRows: 19,
    keep: false,
    throne: [12, 1],
    towers: [[10, 18, 12], [14, 18, 12], [0, 18, 11], [24, 18, 11], [8, 9, 15], [16, 9, 15], [12, 0, 20]],
    banners: [[9, 1], [15, 1], [10, 10], [14, 10], [8, 19], [16, 19]],
    loadout: { owned: { pistol: true, shotgun: true, rifle: true }, ammo: { bullets: 150, shells: 24 }, wings: true },
    map: [
      '#########################',
      '#,,,,#,,,,,,,,,,,,,#,,,,#',
      '#,a,,#,,T,,,,,,,T,,#,,h,#',
      '#,,H,,,,,,,,D,,,,,,,,H,,#',
      '#,,,,#,,,,H,,,H,,,,#,,,,#',
      '#,,,,#,,T,,,,,,,T,,#,,,,#',
      '#,h,,#,,,,,,,,,,,,,#,a,,#',
      '##,#########,#########,##',
      '#,,,,,a,,,,,,,,,,,H,,,,,#',
      '####,#######,#######,####',
      '#,,,,,,,#,,,,,,,#,,,,,,,#',
      '#,T,,,H,#,T,,,T,#,H,,,T,#',
      '#,,,,,,,#,,,H,,,#,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,a,,,#,,,,,,,#,,,h,,,#',
      '#,,H,,,,#,,,,,,,#,,,,H,,#',
      '#,,,,,,,#,,,a,,,#,,,,,,,#',
      '#,h,,,,,#,,,,,,,#,,,,,a,#',
      '###########,,,###########',
      'R.......................R',
      'R..LL.............LLL...R',
      'R.LLLL...T.....T...LLL..R',
      'R..LL......H........LL..R',
      'R...................H...R',
      'R....LLL.........LLLL...R',
      'R...LLLLL.......LLLLLL..R',
      'R....LLL....a....LLLL...R',
      'R.......................R',
      'R.....h.....P...........R',
      'R.......................R',
      'RRRRRRRRRRRRRRRRRRRRRRRRR',
    ],
  },
};

const ROUND_NUMBER = (() => {
  const n = Number(new URLSearchParams(location.hash.slice(1)).get('round'));
  return ROUNDS[n] ? n : 3;
})();
const ROUND = ROUNDS[ROUND_NUMBER];
const THEME = ROUND.theme;
