# Iyla's Game

A 3D runner made for phones. Iyla (blonde, pink dress) picks a ride and explores a little island of Africa, then races down auto-running tracks, jumping lava streams and dodging rocks.

Everything (models, textures, music and sound) is in the one file, `index.html`. three.js loads from the internet.

## How it plays

1. **Pick your ride.** Each one plays a bit differently:
   - 🦒 **Giraffe**: super high jumps.
   - 🦛 **Hippo**: extra tough, with 5 hearts instead of 3.
   - 🦁 **Lion**: the fastest, and grabs treats from further away.
2. **Explore the map.** Tap the ground to ride there. Ride into a glowing gate to open its level.
3. **Run the level.** Iyla's ride runs forward on its own down a 3-lane track.

### The levels

| Level | Where | What's in it |
| --- | --- | --- |
| 🌍 Serengeti Stampede | The wooden gate on the savanna | Lava streams, rocks, fallen logs and tall termite mounds. Collect mangoes. Elephants and zebras run alongside. |
| 🍭 Candyland | The pink plateau at the top of the map | Hot fudge rivers, gumdrops, candy cane bars and giant lollipops. Collect sweets. |

Candyland is locked until you finish the Serengeti. (Grown-up trick: tap the 🔒 in the Candyland pop-up 5 times to open it early.)

Each level has two checkpoint flags. Getting hit costs a heart; run out and you can try again from the last flag. At the finish you get 1 to 3 stars for how many treats you collected. Best scores are saved on the device.

## Controls

| Phone | Keyboard | Action |
| --- | --- | --- |
| Tap the left or right side, or swipe | ← → / A D | Move a lane |
| Tap the middle, or swipe up | Space / ↑ / W | Jump |
| Pause button (top right) | Esc / P | Pause |
| | M | Music on/off |

On the map: tap where to go (or use the arrow keys), and Enter starts the level when you're at a gate.

Works upright or sideways. To play on a phone the folder needs to be on a web address, for example with GitHub Pages turned on for this repository.

## How the code is organised

All in `index.html`:

- **Textures**: painted onto canvases at start-up (`PAINT`): savanna grass, giraffe spots, lava, candy stripes, lolly swirls.
- **Models**: Iyla and the three rides are built from simple shapes (`buildIyla`, `buildGiraffe`, `buildHippo`, `buildLion`), and `animRider` makes them gallop.
- **Overworld**: `buildWorld` makes the island (savanna, watering hole, volcano, Candyland plateau and the two gates). `updateWorld` handles tap-to-move.
- **Levels**: `genCourse` lays out obstacles and treats from a fixed seed, so each level is the same every time. `buildLevel` builds the 3D track and `updateLevel` runs it: lanes, jumping, hits, checkpoints and the finish.
- **Sound**: little synth sound effects and a looping tune made with Web Audio. Nothing to download.

To add a new level, add an entry to `THEMES`, give it a branch in `buildLevel` for its look, and put a gate for it on the map in `buildWorld`.
