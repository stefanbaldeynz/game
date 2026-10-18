// The side-on rounds (3 and 4), drawn as text. One screen is 16 tiles wide
// and 12 tall. A round can be tall (it scrolls down) or wide (it scrolls sideways).
//
//   #  hellrock (solid, a glowing ember crust forms on top)
//   B  brimstone block (blast it)
//   S  rune block (blast it for shells or health)
//   M  skull chest (blast it for a big haul of both)
//   P  where you start
//   H  hellhound: flies in a loop and spits fire the way it's flying
//   E  lightning elephant: walks the ledges, and charges when it sees you
//   X  the Soul Gem: grab it to finish the round
//   .  empty air
//
// Round options:
//   bike   true = you ride a motorbike, and the round scrolls sideways
//   lava   true = a lava sea at the bottom; falling in hurts a lot

// Glues chunks of a wide round together, left to right. Each chunk lists only
// the rows that have something in them; `ground` fills the bottom two rows.
function joinChunks(height, chunks) {
  const rows = Array(height).fill('');
  for (const ch of chunks) {
    for (let r = 0; r < height; r++) {
      let row = ch.rows[r] || '';
      if (r >= height - 2 && ch.ground) row = ch.ground;
      if (row.length > ch.width) console.warn('Chunk row too long:', row);
      rows[r] += row.padEnd(ch.width, '.').slice(0, ch.width);
    }
  }
  return rows;
}

const SIDE_ROUNDS = {
  3: {
    title: 'Round 3 · The Brimstone Gorge',
    intro: 'Climb down the burning gorge to the Soul Gem at the very bottom. Hellhounds fly here, and lightning elephants guard the ledges.',
    map: [
      '##............##',
      '#..............#',
      '#S............S#',
      '#S..P.........S#',
      '#######....#####',
      '######......####',
      '####..........##',
      '###............#',
      '##.....SBS.....#',
      '##.............#',
      '#..............#',
      '#.....####.....#',
      '#......##......#',
      '#S.............#',
      '###..........###',
      '##............##',
      '#..............#',
      '#.......H......#',
      '#..............#',
      '#...SM.........#',
      '#..............#',
      '#..#####.......#',
      '#...###....SS..#',
      '#....#.....###.#',
      '#..........#...#',
      '##.............#',
      '###....E.......#',
      '####..#####....#',
      '###....###.....#',
      '##......#......#',
      '#..............#',
      '#BB..........BB#',
      '#BB..........BB#',
      '#####......#####',
      '######....######',
      '######....######',
      '#####......#####',
      '#SSB..........##',
      '#####.........##',
      '#.........E....#',
      '#....###########',
      '#..............#',
      '#..............#',
      '#.S.........S..#',
      '##.............#',
      '#..............#',
      '#....H.........#',
      '#..............#',
      '#..............#',
      '#.###.....###..#',
      '#..#.......#...#',
      '#..............#',
      '#.........H....#',
      '#..............#',
      '#....SBS.......#',
      '#..............#',
      '#...######.....#',
      '#....####....###',
      '#.....##.....###',
      '#............###',
      '##.............#',
      '###.........E..#',
      '####.....#######',
      '###......#######',
      '##.......S######',
      '#.........######',
      '#....H.....#####',
      '#..........#####',
      '#.......E..#####',
      '#....###########',
      '#....###########',
      '#..........#####',
      '#...........####',
      '#............###',
      '##.............#',
      '#..............#',
      '#.......H......#',
      '#..............#',
      '#..............#',
      '#S............S#',
      '#S...######...S#',
      '#.....####.....#',
      '#..............#',
      '##............##',
      '###..........###',
      '####...SS...####',
      '#####......#####',
      '######..X.######',
      '################',
    ],
  },
  4: {
    title: 'Round 4 · Hell Ride',
    intro: 'Ride the motorbike across the lava sea to the Soul Gem. Right speeds up, Left slows down. Blast through the rocks, and jump (or fly) the gaps.',
    bike: true,
    lava: true,
    map: joinChunks(12, [
      { // Start: open road and a rock to blast
        width: 20,
        rows: { 9: '..P...........B' },
        ground: '####################',
      },
      { // First gap, then a pair of rocks and an elephant
        width: 20,
        rows: { 7: '..............S', 9: '...........BB.....E' },
        ground: '####...#############',
      },
      { // A hellhound over a ledge, and the skull chest on the road
        width: 20,
        rows: { 3: '..........H', 7: '......####', 9: '.............M' },
        ground: '##############....##',
      },
      { // Up the steps and off the top
        width: 20,
        rows: { 7: '..........####', 8: '.......#######', 9: '....##########.S' },
        ground: '##################..',
      },
      { // Rock garden with elephants
        width: 20,
        rows: { 9: '..E....BB....E..SB' },
        ground: '####################',
      },
      { // Hellhounds over the gaps
        width: 20,
        rows: { 2: '.......H', 5: '...............H' },
        ground: '###....###....###...',
      },
      { // Hop across the floating ledges
        width: 20,
        rows: { 6: '............###', 8: '.....####........###' },
        ground: '####',
      },
      { // The home stretch and the Soul Gem
        width: 24,
        rows: { 3: '.....H', 7: '..........S', 9: '......SS.....B.......X' },
        ground: '########################',
      },
    ]),
  },
};
