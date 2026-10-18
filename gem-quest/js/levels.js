// Level maps, drawn as text. One screen is 16 tiles wide and 12 tall.
// A level can be tall (it scrolls down) or wide (it scrolls sideways).
//
//   #  rock (solid, grass grows on top automatically)
//   B  breakable rock block (punch it)
//   S  star block (punch it for a prize)
//   M  magic block (punch it for the magic power-up)
//   P  where the player starts
//   D  dragon (flies in a loop and spits fire)
//   K  scorpion (walks along the ground)
//   X  the Gem
//   .  empty sky
//
// Level options:
//   intro  the two lines shown on the title screen
//   bike   true = you ride the motorbike, and the level scrolls sideways
//   water  true = there's water at the bottom; falling in costs a life

// Glues chunks of a wide level together, left to right. Each chunk lists only
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

const LEVELS = [
  {
    name: 'Rocky Gorge',
    intro: ['Climb down the gorge and grab', 'the Gem at the very bottom!'],
    map: [
      '##............##', // 0  start ledge
      '#..............#',
      '#S............S#',
      '#S..P.........S#',
      '#######....#####',
      '######......####',
      '####..........##',
      '###............#',
      '##.....SBS.....#',
      '##.............#',
      '#..............#', // 10
      '#.....####.....#',
      '#......##......#',
      '#S.............#',
      '###..........###',
      '##............##', // 15 floating islands
      '#..............#',
      '#.......D......#',
      '#..............#',
      '#...SM.........#',
      '#..............#', // 20
      '#..#####.......#',
      '#...###....SS..#',
      '#....#.....###.#',
      '#..........#...#',
      '##.............#', // 25
      '###....K.......#',
      '####..#####....#',
      '###....###.....#',
      '##......#......#',
      '#..............#', // 30 the narrow shaft
      '#BB..........BB#',
      '#BB..........BB#',
      '#####......#####',
      '######....######',
      '######....######', // 35
      '#####......#####',
      '#SSB..........##',
      '#####.........##',
      '#.........K....#',
      '#....###########', // 40
      '#..............#',
      '#..............#',
      '#.S.........S..#',
      '##.............#',
      '#..............#', // 45 dragon cavern
      '#....D.........#',
      '#..............#',
      '#..............#',
      '#.###.....###..#',
      '#..#.......#...#', // 50
      '#..............#',
      '#.........D....#',
      '#..............#',
      '#....SBS.......#',
      '#..............#', // 55
      '#...######.....#',
      '#....####....###',
      '#.....##.....###',
      '#............###',
      '##.............#', // 60 zig-zag ledges
      '###.........K..#',
      '####.....#######',
      '###......#######',
      '##.......S######',
      '#.........######', // 65
      '#....D.....#####',
      '#..........#####',
      '#.......K..#####',
      '#....###########',
      '#....###########', // 70
      '#..........#####',
      '#...........####',
      '#............###',
      '##.............#',
      '#..............#', // 75 the Gem chamber
      '#.......D......#',
      '#..............#',
      '#..............#',
      '#S............S#',
      '#S...######...S#', // 80
      '#.....####.....#',
      '#..............#',
      '##............##',
      '###..........###',
      '####...SS...####', // 85
      '#####......#####',
      '######..X.######',
      '################',
    ],
  },
  {
    name: 'Motorbike Mayhem',
    intro: ['Ride the motorbike to the Gem!', 'Smash rocks, jump the water.'],
    bike: true,
    water: true,
    map: joinChunks(12, [
      { // Start: open road and a rock to smash
        width: 20,
        rows: { 9: '..P...........B' },
        ground: '####################',
      },
      { // First splash, then a pair of rocks and a scorpion
        width: 20,
        rows: { 7: '..............S', 9: '...........BB.....K' },
        ground: '####...#############',
      },
      { // A dragon over a ledge, and the magic block on the road
        width: 20,
        rows: { 3: '..........D', 7: '......####', 9: '.............M' },
        ground: '##############....##',
      },
      { // Up the steps and off the top
        width: 20,
        rows: { 7: '..........####', 8: '.......#######', 9: '....##########.S' },
        ground: '##################..',
      },
      { // Rock garden with scorpions
        width: 20,
        rows: { 9: '..K....BB....K..SB' },
        ground: '####################',
      },
      { // Dragons over the gaps
        width: 20,
        rows: { 2: '.......D', 5: '...............D' },
        ground: '###....###....###...',
      },
      { // Hop across the floating ledges
        width: 20,
        rows: { 6: '............###', 8: '.....####........###' },
        ground: '####',
      },
      { // The home stretch and the Gem
        width: 24,
        rows: { 3: '.....D', 7: '..........S', 9: '......SS.....B.......X' },
        ground: '########################',
      },
    ]),
  },
];
