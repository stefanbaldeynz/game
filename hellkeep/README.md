# Hellkeep

A shooter in hell, in four rounds. The first two are first-person 3D, in the style of Doom and GoldenEye. The last two are side-on platform rounds, built from the levels of Gem Quest.

- **Round 1: The Burning Keep.** Walk through the lava fields of hell to a burning castle. Flaming hellhounds guard every hall, and the **devil** waits by the throne. Kill them all to finish the round.
- **Round 2: The Frozen Depths.** A frozen castle with freezing pools and falling snow. **Ice elephants** with huge tusks, burning with blue fire, roam its halls. Bring them all down to finish the round.
- **Round 3: The Brimstone Gorge** (side-on). Climb down a burning gorge to the **Soul Gem** at the very bottom. Hellhounds fly in loops spitting fire, and **lightning elephants** guard the ledges.
- **Round 4: Hell Ride** (side-on). Ride a motorbike across a lava sea to the Soul Gem. Blast through the rocks and jump (or fly) the gaps. Grab the gem to beat the game.

Every menu screen has a **round picker**, so you can start any round straight away. Beating a round takes you on to the next one.

Round 1 plays the recorded track `music/Blood_and_Iron_Rite.mp3` on a loop. Round 2 has an industrial metal soundtrack in a Rammstein style that the game plays live: plucked-string guitar synthesis, double-tracked high-gain guitars, a stomping kick and synth pads, crawling along in low C. If the MP3 is missing, round 1 falls back to its own synthesised song, which marches in drop D and switches to a relentless boss riff while the devil fights. Press **M** to turn the music off or on.

The graphics use modern effects: bloom (fire, lava and eyes glow), a filmic colour grade with a vignette and film grain, anti-aliasing, reflective metal guns and bullet holes. Press **G** to switch to plain rendering on slower computers.

## Play

Double-click `serve.cmd` in the main game folder, pick Hellkeep, then click to start. Use Chrome or Edge. (Opening `index.html` directly also works, but without the 3D models.) The game needs an internet connection the first time it loads, because the 3D engine ([three.js](https://threejs.org/)) and the fonts come from the web.

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

## The side-on rounds (3 and 4)

They run in `side.html` and keep the same menus, HUD, sounds and music as the 3D rounds. You keep the **Flak Shotgun** and the **angel wings**.

| Key | Action |
| --- | --- |
| A D / arrow keys | Move (on the motorbike: Right speeds up, Left slows down) |
| Space / W / Up | Jump. Press again in mid-air to **double jump** |
| Hold Space (after a double jump) | **Fly with the angel wings**. The stamina bar refills on the ground |
| J / Z / X / Ctrl / left click | Fire the Flak Shotgun |
| M | Music on/off |
| Esc / P | Pause |

- The **Flak Shotgun** sprays seven pellets. It blasts beasts, smashes blocks and even knocks fireballs out of the air. You start with 30 shells. Out of shells, you club things with it instead.
- **Rune blocks** (a flame on dark iron) hold shells or a health box. The **skull chest** holds both. **Brimstone blocks** just break.
- **Hellhounds** fly in loops and spit fire the way they're flying (3 pellets kill one).
- **Lightning elephants** plod along the ledges, crackling with lightning. If you're on their level and in front of them, they rear up, trumpet and **charge**. A charge into a wall stuns them. Jump or fly over them, or give them two good blasts.
- Health works like the 3D rounds: there are no lives. In round 4, falling into the lava sea burns you (34 health) and puts you back on the road.
- On the motorbike you smash straight through blocks, and you can still fire forwards.

## How the code is organised

`index.html` loads three.js and its add-ons (bloom etc.) as modules from the web, then every file in `js/` in this order:

| File | What it does |
| --- | --- |
| `roundlist.js` | The list of all four rounds, which page each one is on, and the round picker. Loaded by both pages |
| `util.js` | Small shared helpers |
| `rounds.js` | **The 3D rounds:** each round's map (an ASCII grid you can edit), colour theme and starting gear |
| `textures.js` | Draws every texture (bricks, lava, ice, the creatures' skins, the Delft porcelain, leather...) with code, so there are no image files |
| `sound.js` | Makes every sound effect with the Web Audio API, so there are no audio files |
| `music.js` | **The soundtrack:** recorded MP3 tracks per round (from the `music` folder), plus the synthesised industrial metal songs played live by code (plucked-string guitars, bass, drums, synth pads). The riffs are written as letter patterns you can edit |
| `particles.js` | Fire, blue fire, sparks, embers and snow |
| `level.js` | Builds the round's map in 3D, plus collision and enemy path finding |
| `hounds.js` | The hellhounds: turns the animated wolf model into a hellhound (charred skin with glowing lava cracks, burning eyes, horns and spine spikes), plays its animations, and runs the AI |
| `elephants.js` | The ice elephant model, animation and AI (walk, wind-up, charge, stun, gore) |
| `devil.js` | The devil boss (the metal demon and his Flying V) and his fireballs |
| `wings.js` | The angel wings: the feathered models, the pickup and the wingbeat animation |
| `weapons.js` | **Gun stats** (damage, fire rate, spread...) and the gun models, including the Flak Shotgun |
| `graphics.js` | Modern graphics: bloom, the filmic colour grade, anti-aliasing, reflections and bullet holes |
| `main.js` | Controls, jumping and flying, shooting, pickups, the on-screen display (HUD) and the game loop |

### The hellhound model

The hellhounds are a real animated 3D model: **'Wolf' by [Quaternius](https://quaternius.com)**, public domain (CC0), from [poly.pizza/m/P1gU3Qkr9r](https://poly.pizza/m/P1gU3Qkr9r). It's `models/hellhound.glb`. The game runs (gallop), lunges (attack), flinches when shot (hit reactions) and dies (death) with the model's own animations. `hounds.js` paints the lava cracks on with a small shader and bolts horns and spikes onto its bones.

Models load only when the game runs through the local server (`serve.cmd` in the main folder; see the main README). Opened straight from your files, the game shows a tip and uses the old hound built from boxes.

**Adding or swapping models:** every model is listed in `MODEL_FILES` in `index.html` and loaded before the game starts, so the game can use it as `MODELS.<name>`. To swap the hound, replace `models/hellhound.glb` and set its animation names in `HOUND_CLIPS` at the top of `hounds.js`. To add a model, put the `.glb` in `models/`, add a line to `MODEL_FILES`, and use `MODELS.<name>` in the code (`hounds.js` shows how: cloning, recolouring, attaching parts to bones, and playing animations).

`side.html` runs rounds 3 and 4. It loads `roundlist.js`, `util.js`, `sound.js` and `music.js` from above, plus its own files in `js/side/`:

| File | What it does |
| --- | --- |
| `side/levels.js` | **The side-on rounds:** maps drawn as text (the key is at the top). Round 4 is glued together from screen-sized chunks |
| `side/sprites.js` | The pixel art: you, the wings, the Flak Shotgun, the motorbike, hellhounds, lightning elephants and the tiles |
| `side/game.js` | Running, jumping and flying, the shotgun, the beasts, the camera and drawing. The numbers at the top tune it all |

Easy things to try changing:

- **The levels:** edit a `map` in `rounds.js`. The legend is at the top.
- **The guns:** tweak the numbers in `WEAPONS` in `weapons.js`.
- **The enemies:** the numbers at the top of `hounds.js`, `elephants.js` and `devil.js`.
- **The music:** to use your own MP3, put it in the `music` folder and list it in `TRACKS` at the top of `music.js` (by round number). For the synthesised songs, edit the riffs, drum patterns and tempo (`bpm`) in `SONGS`. The comment there explains the letters.
- **Jumping and flying:** `JUMP_SPEED`, `GRAVITY` and the `WING_` numbers at the top of `main.js`.
- **Brightness:** `exposure` in each theme in `rounds.js`.

Tips:

- Open `index.html#round=2` to jump straight to round 2. `#round=3` or `#round=4` opens the side-on rounds.
- `side.html#round=3&preview&god` starts a side-on round straight away, with you invincible.
- Open `index.html#preview&god` to start straight away without capturing the mouse, and with you invincible. You can add `&round=2` to that. It's handy for screenshots and testing.
