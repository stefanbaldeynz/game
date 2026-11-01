# Iyla's Game

A 3D runner made for phones. Iyla (blonde, pigtails) picks a ride and explores a little island of Africa, then races down auto-running tracks: jumping lava, dodging rocks and escaping boss animals.

Everything (models, textures, music and sound) is in the one file, `index.html`. three.js loads from the internet.

## How it plays

1. **Get ready.** The menu has these tabs:
   - **Ride**: the animal for the land levels.
   - **Sea**: the animal for the underwater level.
   - **Sky**: the bird for the mountain level.
   - **Dino**: the dinosaur for Dinosaur Valley and Dino Land.
   - **Outfit**: what Iyla wears. New outfits unlock as you collect stars.
   - **Friend**: bring Milo along once he's unlocked.
2. **Explore the map.** Tap the ground to ride there. Ride into a glowing gate to open its level.
3. **Run the level.** Your ride runs forward on its own down a 3-lane track. Collect treats, reach the finish, and earn 1 to 3 stars for how many treats you got.

### The rides

| Ride | Special |
| --- | --- |
| 🦒 Giraffe | Super high jumps |
| 🦛 Hippo | 5 hearts |
| 🦁 Lion | Fast, and grabs treats from further away |
| 🐘 Elephant | Smashes straight through rocks and other small things, 4 hearts |
| 🦓 Zebra | The fastest |
| 🐯 Tiger | Double jump: tap jump again in mid-air |
| 🦩 Flamingo | Flaps and floats down slowly after a jump |
| 🐬 Dolphin (sea) | Fast, with a double jump |
| 🦈 Shark (sea) | Chomps straight through coral |
| 🐋 Whale (sea) | 5 hearts |
| 🦅 Eagle (sky) | Super high jump and a double jump |
| 🦉 Owl (sky) | Double jump and 4 hearts |
| 🦜 Parrot (sky) | Fast, double jump, and grabs treats from further away |
| 🦖 T-Rex (dino) | Stomps right through rocks, 4 hearts |
| 🦎 Velociraptor (dino) | The fastest dino, with a double jump |
| 🦕 Stegosaurus (dino) | Spiky and tough: 5 hearts |
| 🦕 Brachiosaurus (dino) | Super tall, and its long neck grabs treats from far away |

### The levels

| Level | Where on the map | What's in it | Opens after |
| --- | --- | --- | --- |
| 🌍 Serengeti Stampede | Wooden gate on the savanna | Lava streams, rocks, logs, termite mounds | Open from the start |
| 🏜️ Desert Dash | The desert with the pyramids (west) | Quicksand, cactus, fallen pillars, camels. **Boss: the Rhino** | Serengeti |
| 🍭 Candyland | The pink plateau at the top | Hot fudge, gumdrops, candy canes, giant lollies | Serengeti |
| 🐠 Under the Sea | The gate by the pier (south-east) | Coral, spiky urchins, an old mast, fish and a sunken ship. **Boss: the Giant Shark** | Serengeti |
| 🏔️ Eagle Mountains | The snowy mountain (top right) | Fly a bird over canyons, snowy rocks and logs, dodge pine trees and falling snowballs. Collect golden feathers | Open from the start |
| 🌋 Volcano Run | At the foot of the volcano | Lots of lava, obsidian spikes, and fireballs falling from the sky (red circles show where) | Desert |
| 🦖 Dinosaur Valley | The bone gate in the dino corner (bottom left) | Tar pits, giant fossil bones, boulders and tree ferns, with volcanoes, nests of eggs and dinosaurs roaming the plain. Collect dino eggs. **Boss: the Triceratops** | Open from the start |
| 🌴 Dino Land | The jungle gate past the dino corner | A steamy jungle: rivers, mossy logs, giant jungle trees, and coconuts falling from the trees (red circles show where). Dinosaurs wander through the trees. Collect bananas | Dinosaur Valley |

Grown-up trick: tap the 🔒 in a locked level's pop-up 5 times to open it early.

### Boss fights

At the end of the Desert, Under the Sea and Dinosaur Valley levels, a boss chases you down. It charges at you down a lane (the lane flashes red first), so move out of the way. Every third attack it stomps (or slaps its tail) and sends a wave along the ground: jump it. Survive five attacks and the boss gets dizzy and gives up, and the finish line appears.

### Milo the sausage dog

Milo unlocks at 2 stars. Turn him on in the Friend tab and he runs beside you (with a bubble helmet underwater) and grabs treats near him. If you get hurt while Milo is with you, he takes the hit instead and you don't lose a heart. Then he runs off and comes back about 20 seconds later.

### Outfits

| Outfit | Stars needed |
| --- | --- |
| 👗 Pink Dress | 0 |
| 🤠 Explorer | 3 |
| 👑 Princess | 6 |
| 🦸 Super Iyla (with a cape) | 9 |
| 🧜 Mermaid | 12 |
| 🌈 Rainbow Star | 15 |

There are 24 stars in the game (3 per level). Stars, unlocks and choices are saved on the device.

## Controls

| Phone | Keyboard | Action |
| --- | --- | --- |
| Tap the left or right side, or swipe | ← → / A D | Move a lane |
| Tap the middle, or swipe up | Space / ↑ / W | Jump (tap again in the air for a double jump on the tiger and dolphin) |
| Pause button (top right) | Esc / P | Pause |
| | M | Music on/off |

Each level has checkpoint flags. Run out of hearts and you can try again from the last flag. Boss levels have a red flag just before the boss.

## How the code is organised

All in `index.html`:

- **Textures**: painted onto canvases at start-up (`PAINT`).
- **Iyla and the rides**: built from simple shapes. `buildIyla(outfit)` dresses her. Each ride has its own builder (`buildGiraffe`, `buildDolphin`…), and `animRider` makes them gallop or swim.
- **Milo**: `buildMilo`. His follow, save and return logic is in `updateLevel`.
- **Overworld**: `buildWorld` makes the island, and `GATE_AT` says where each level's gate is.
- **Levels**: `THEMES` holds each level's settings, and `ST` holds each level's look: obstacles, scenery and backdrop. `genCourse` lays out obstacles and treats from a fixed seed, `buildLevel` builds the track, and `updateLevel` runs it.
- **Bosses**: `makeBoss` and `updateBoss`.
- **Sound**: synth sound effects and looping tunes made with Web Audio.

To add a new level, add an entry to `THEMES` and `ST`, and give it a gate in `GATE_AT`.

For testing, the address can jump straight in: `?play=dinos` opens a level (`&ride=raptor` picks the ride, `&at=1200` starts further along, `&sim=8` runs it for 8 seconds first), `?menu=dino` opens the ride menu on a tab, and `?map=-20,30` puts Iyla on the map there.
