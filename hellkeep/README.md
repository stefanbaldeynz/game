# Hellkeep

A first-person shooter in the style of Doom and GoldenEye, in two rounds.

- **Round 1: The Burning Keep.** Walk through the lava fields of hell to a burning castle. Flaming hellhounds guard every hall, and the **devil** waits by the throne. Kill them all to finish the round.
- **Round 2: The Frozen Depths.** A frozen castle with freezing pools and falling snow. **Ice elephants** with huge tusks, burning with blue fire, roam its halls. Bring them all down to beat the game.

Round 1 plays the recorded track `music/Blood_and_Iron_Rite.mp3` on a loop. Round 2 has an industrial metal soundtrack in a Rammstein style that the game plays live: plucked-string guitar synthesis, double-tracked high-gain guitars, a stomping kick and synth pads, crawling along in low C. If the MP3 is missing, round 1 falls back to its own synthesised song, which marches in drop D and switches to a relentless boss riff while the devil fights. Press **M** to turn the music off or on.

The graphics use modern effects: bloom (fire, lava and eyes glow), a filmic colour grade with a vignette and film grain, anti-aliasing, reflective metal guns and bullet holes. Press **G** to switch to plain rendering on slower computers.

## Play

Open `index.html` in Chrome or Edge, then click to start. The game needs an internet connection the first time it loads, because the 3D engine ([three.js](https://threejs.org/)) and the fonts come from the web.

| Key | Action |
| --- | --- |
| W A S D / arrow keys | Move |
| Mouse | Look around |
| Left click | Shoot (hold to keep firing with the rifle) |
| Shift | Sprint |
| Space | Jump. Press again in mid-air to **double jump** |
| Hold Space (after a double jump) | **Fly with angel wings**, once you have them |
| 1 / 2 / 3 or mouse wheel | Pistol / shotgun / rifle |
| M | Music on/off |
| G | Graphics high/low (switch to low if the game runs slowly) |
| Esc | Pause |

## The rules

- You start round 1 with a **pistol** and an **assault rifle**. The **Flak Shotgun** (four chrome barrels, Delft-blue porcelain, glowing cyan energy cells) turns slowly on a display pedestal just inside the castle gate. Walk up to it to take it.
- The pistol and rifle share **bullets**. The shotgun uses **shells**.
- Green-glowing **health boxes** give +25 health. Yellow-glowing **ammo crates** give +25 bullets and +6 shells.
- Enemies sleep until they see you, get close, or hear a gunshot nearby. Then they hunt you down.
- **Lava and freezing water hurt**, but only when you're standing in them. Jump over them.
- **Hellhounds** bite, but they can't reach you in the air.
- **The devil** (1,200 health) is a heavy metal demon in a studded leather jacket, with long black hair, huge horns and a flaming tail. He headbangs and blasts fireballs from his Flying V guitar with a distorted power chord. Strafe to dodge them. Up close he swings the guitar at you. Below half health he gets enraged: he moves faster and throws three fireballs at once. When he dies he drops the **angel wings** he stole.
- **Angel wings:** double jump, then keep holding Space to fly. You see your wings beating at the edges of the screen. The stamina gauge under your health refills while you stand on the ground.
- **Ice elephants** (320 health) rear up, trumpet, then **charge**. A charge hits hard and throws you back. A single jump isn't high enough to clear one, but a double jump or the wings are. If an elephant charges into a wall, it's stunned for a moment. Up close it gores you with its tusks.
- Round 2 starts with all three guns and the angel wings.

## How the code is organised

`index.html` loads three.js and its add-ons (bloom etc.) as modules from the web, then every file in `js/` in this order:

| File | What it does |
| --- | --- |
| `util.js` | Small shared helpers |
| `rounds.js` | **The rounds:** each round's map (an ASCII grid you can edit), colour theme and starting gear |
| `textures.js` | Draws every texture (bricks, lava, ice, the creatures' skins, the Delft porcelain, leather...) with code, so there are no image files |
| `sound.js` | Makes every sound effect with the Web Audio API, so there are no audio files |
| `music.js` | **The soundtrack:** recorded MP3 tracks per round (from the `music` folder), plus the synthesised industrial metal songs played live by code (plucked-string guitars, bass, drums, synth pads). The riffs are written as letter patterns you can edit |
| `particles.js` | Fire, blue fire, sparks, embers and snow |
| `level.js` | Builds the round's map in 3D, plus collision and enemy path finding |
| `hounds.js` | The hellhound model, animation and AI |
| `elephants.js` | The ice elephant model, animation and AI (walk, wind-up, charge, stun, gore) |
| `devil.js` | The devil boss (the metal demon and his Flying V) and his fireballs |
| `wings.js` | The angel wings: the feathered models, the pickup and the wingbeat animation |
| `weapons.js` | **Gun stats** (damage, fire rate, spread...) and the gun models, including the Flak Shotgun |
| `graphics.js` | Modern graphics: bloom, the filmic colour grade, anti-aliasing, reflections and bullet holes |
| `main.js` | Controls, jumping and flying, shooting, pickups, the on-screen display (HUD) and the game loop |

Easy things to try changing:

- **The levels:** edit a `map` in `rounds.js`. The legend is at the top.
- **The guns:** tweak the numbers in `WEAPONS` in `weapons.js`.
- **The enemies:** the numbers at the top of `hounds.js`, `elephants.js` and `devil.js`.
- **The music:** to use your own MP3, put it in the `music` folder and list it in `TRACKS` at the top of `music.js` (by round number). For the synthesised songs, edit the riffs, drum patterns and tempo (`bpm`) in `SONGS`. The comment there explains the letters.
- **Jumping and flying:** `JUMP_SPEED`, `GRAVITY` and the `WING_` numbers at the top of `main.js`.
- **Brightness:** `exposure` in each theme in `rounds.js`.

Tips:

- Open `index.html#round=2` to jump straight to round 2.
- Open `index.html#preview&god` to start straight away without capturing the mouse, and with you invincible. You can add `&round=2` to that. It's handy for screenshots and testing.
