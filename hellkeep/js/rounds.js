// The rounds: each has its own map, look (theme) and enemies.
// Open index.html#round=2 to jump straight to round 2.

// Map legend (shared by every round):
//   #  castle wall          R  rock cliff
//   ,  castle floor         .  ground outside
//   L  lava / freezing pool (hurts when you stand in it)
//   T  brazier              P  player start
//   H  hellhound            E  ice elephant           D  the devil (boss)
//   a  ammo crate           h  health box             f  rifle
//   s  the Flak Shotgun on its display pedestal
// North is the top. Rows 0-18 are inside the castle (they get a ceiling).

const ROUNDS = {
  1: {
    title: 'Round 1 · The Burning Keep',
    intro: 'Enter the castle. Kill every hellhound, and the devil on the throne.',
    theme: HELL_THEME,
    throne: [12, 1],
    towers: [[10, 18, 12], [14, 18, 12], [0, 18, 11], [24, 18, 11], [8, 9, 15], [16, 9, 15], [12, 0, 20]],
    banners: [[9, 1], [15, 1], [10, 10], [14, 10], [8, 19], [16, 19]],
    loadout: { owned: { pistol: true, shotgun: false, rifle: true }, ammo: { bullets: 150, shells: 0 }, wings: false },
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
      '#,,,,,,,#,,,s,,,#,,,,,,,#',
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
  2: {
    title: 'Round 2 · The Frozen Depths',
    intro: 'Ice elephants burning with blue fire roam the frozen halls. Bring them all down.',
    theme: ICE_THEME,
    throne: null,
    towers: [[10, 18, 12], [14, 18, 12], [0, 18, 11], [24, 18, 11], [8, 10, 15], [16, 10, 15], [12, 0, 20]],
    banners: [[9, 1], [15, 1], [10, 11], [14, 11], [8, 19], [16, 19]],
    loadout: { owned: { pistol: true, shotgun: true, rifle: true }, ammo: { bullets: 140, shells: 24 }, wings: true },
    map: [
      '#########################',
      '#,,,,,,,,,,,,,,,,,,,,,,a#',
      '#,,T,,,,,,,,,,,,,,,,,T,,#',
      '#,,,,,#,,,,,E,,,,,#,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,E,,,,,,#,,,#,,,,,,E,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,h,,,#,,,,,,,,,,,#,,,h,#',
      '#,,,,,,,,,T,,,T,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,#',
      '###,,,#############,,,###',
      '#,,,,,,,#,,,,,,,#,,,,,,,#',
      '#,,E,,,,#,,,a,,,#,,,,E,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,T,,,,,#,,,,,,,#,,,,,T,#',
      '#,,,,h,,#,,,,,,,#,,a,,,,#',
      '#,,,,,,,#,,,E,,,#,,,,,,,#',
      '#,,,,,,,#,,,,,,,#,,,,,,,#',
      '###########,,,###########',
      'R.......................R',
      'R..LLL.............LLL..R',
      'R..LLL...T.....T...LLL..R',
      'R.......................R',
      'R...........E...........R',
      'R...LL.............LL...R',
      'R..LLLL...........LLLL..R',
      'R...LL......a......LL...R',
      'R.......................R',
      'R.....h.....P...........R',
      'R.......................R',
      'RRRRRRRRRRRRRRRRRRRRRRRRR',
    ],
  },
};

const LAST_ROUND = Math.max(...Object.keys(ROUNDS).map(Number));
const ROUND_NUMBER = (() => {
  const n = Number(new URLSearchParams(location.hash.slice(1)).get('round'));
  return ROUNDS[n] ? n : 1;
})();
const ROUND = ROUNDS[ROUND_NUMBER];
const THEME = ROUND.theme;
