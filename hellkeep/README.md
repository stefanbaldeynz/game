# Hellkeep

A shooter in hell, in five rounds. The first two are first-person 3D, in the style of Doom and GoldenEye. Rounds 3 and 4 are side-on platform rounds (built from the levels of Gem Quest), and round 5 is tower defence with a first-person mode (built from Kiwi Canyon).

- **Round 1: The Burning Keep.** Walk through the lava fields of hell to a burning castle. Flaming hellhounds guard every hall, and the **devil** waits by the throne. Kill them all to finish the round.
- **Round 2: The Frozen Depths.** A frozen castle with freezing pools and falling snow. **Ice elephants** with huge tusks, burning with blue fire, roam its halls. Bring them all down to finish the round.
- **Round 3: The Brimstone Gorge** (side-on). Climb down a burning gorge to the **Soul Gem** at the very bottom. Hellhounds fly in loops spitting fire, and **lightning elephants** guard the ledges.
- **Round 4: Hell Ride** (side-on). Ride a motorbike across a lava sea to the Soul Gem. Blast through the rocks and jump (or fly) the gaps.
- **Round 5: The Hellgate Siege** (tower defence). The beasts of hell march through a burning gorge to the gate of the keep. Build fire towers on the rim, upgrade them, and drop into the gorge with your rifle. Three waves: **hellhounds**, then **ice elephants**, then the **devils** themselves (with the boss riff). Hold the gate to beat the game.

The menu opens with a **round picker**: click a round to play it. Beating a round takes you on to the next one.

Round 1 plays the recorded track `music/Blood_and_Iron_Rite.mp3` on a loop. Round 2 has an industrial metal soundtrack in a Rammstein style that the game plays live: plucked-string guitar synthesis, double-tracked high-gain guitars, a stomping kick and synth pads, crawling along in low C. If the MP3 is missing, round 1 falls back to its own synthesised song, which marches in drop D and switches to a relentless boss riff while the devil fights. Press **M** to turn the music off or on.

The graphics run on [three.js](https://threejs.org/) 0.186 with modern effects:

- **Real-time shadows:** the burning sky throws long shadows across the ground outside, and the braziers nearest you cast shadows of hounds, pillars and the devil.
- **Ambient occlusion:** soft contact shadows in corners, where walls meet the floor, and under creatures.
- **Surfaces with depth:** every wall, rock, floor and ceiling has a normal map worked out from its texture, so light rakes across bricks, mortar and cracks. The lava seams in the rock and ground really glow.
- **Light from the world:** lava pools light the ground around them and pulse, the hell sky (or the frozen moon) is used as soft ambient light and reflections, and guns glint with it.
- **Materials:** the devil's waxy skin and creased, sheeny leather, brushed and scratched gun metal, the Flak Shotgun's glazed porcelain and chrome.
- **Fire and smoke:** bloom on everything brighter than white (fire, lava, eyes, energy cells, muzzle flashes), and smoke rising from the braziers and lava (pale mist in round 2).
- **Real animated models** for the hellhounds and ice elephants (see below).
- **A filmic finish:** colour grade, vignette, a hint of lens fringing at the edges and fine film grain.

Press **G** to switch to plain rendering on slower computers (no shadows, occlusion, bloom or film effects).

The side-on rounds (3 and 4) are drawn in 3D too, with the same effects: the rock is traced from the map and carved into smooth cliffs with glowing ember lips, the hellhounds and elephants are the same animated models, and you play a soldier in red armour holding the 3D Flak Shotgun, with feathered angel wings that fold, glide and beat. Round 4 adds a motorcycle, a lava sea under a red heat haze, and the keep's spires on the horizon.

## Play

Double-click `serve.cmd` in the main game folder: it opens Hellkeep on its menu. Choose a round (or press **Play round 1** once it has loaded). **← Game select** on the menu takes you back to the collection. Use Chrome or Edge. (Opening `index.html` directly also works, but without the 3D models.) Through the server the 3D engine loads from `lib/three` in the main folder; only the fonts come from the web. Opened directly, three.js also comes from the web.

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
| G | Graphics high/low (low turns off shadows, occlusion and effects, for slower computers) |
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

## Round 5: The Hellgate Siege (defense.html)

Tower defence with a first-person mode, from Kiwi Canyon, in hell and with the same graphics as the other rounds.

| Control | Action |
| --- | --- |
| Click the gorge rim | Build a fire tower (10 souls) |
| Click a tower | Select it, then upgrade it (up to 3 times) with the button or **U** |
| Click the gorge floor | Choose where you'll drop in for first-person mode |
| **N** | Open the hellgate: start the next wave |
| **F** | Drop into the gorge in first person, and back up |
| WASD / arrows, mouse wheel | Pan and zoom the tower view |
| In first person: WASD + mouse, click, **R**, Shift | Move, shoot the rifle (hold), reload, sprint |
| **P** | Pause (tower view) |
| **Esc** | The menu, to pick another round (from first person, press it twice) |

- You start with **40 souls** and 20 lives. Killing a beast earns souls (hound 2, elephant 7, devil 20), and beating a wave pays a bonus.
- **Fire towers** throw homing fireballs. Each upgrade adds damage, fire rate, range and launchers, and changes the colour of their fire: ember orange, crimson, gold, then blue soul-fire. The rifle can be upgraded 3 times too.
- A hellhound that reaches the keep costs 1 life, an elephant 3, a devil 6.
- Towers alone won't hold the devils: get down there with the rifle.
- All the numbers (waves, health, speeds, costs) and the map are in `js/defense/config.js`.

| File | What it does |
| --- | --- |
| `defense/config.js` | **Every balance number and the map** (an ASCII grid: `.` rim, `T` brazier, `=` gorge, `S` hellgate, `E` the keep's gate) |
| `defense/world.js` | Builds the hell gorge, the hellgate and the keep's gate, collision, and the beasts' path |
| `defense/beasts.js` | Hellhounds, elephants and devils walking the path (the same models as the other rounds), with health bars and deaths |
| `defense/towers.js` | The fire towers and their fireballs |
| `defense/main.js` | Waves, building and upgrading, switching views, first-person shooting, the HUD and the game loop |

## The side-on rounds (3 and 4)

They run in `side.html` and keep the same menus, HUD, sounds and music as the 3D rounds. You keep the **Flak Shotgun** and the **angel wings**. The game itself runs on a flat map, and `render3d.js` draws it in 3D, seen side-on with a little perspective.

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
| `themes.js` | The colour themes (hell and ice), shared by every round |
| `rounds.js` | **The 3D rounds:** each round's map (an ASCII grid you can edit), theme and starting gear |
| `textures.js` | Draws every texture (bricks, lava, ice, the creatures' skins, the Delft porcelain, leather...) with code, so there are no image files |
| `sound.js` | Makes every sound effect with the Web Audio API, so there are no audio files |
| `music.js` | **The soundtrack:** recorded MP3 tracks per round (from the `music` folder), plus the synthesised industrial metal songs played live by code (plucked-string guitars, bass, drums, synth pads). The riffs are written as letter patterns you can edit |
| `particles.js` | Fire, blue fire, sparks, embers, snow, and smoke or mist |
| `level.js` | Builds the round's map in 3D, plus collision and enemy path finding |
| `hounds.js` | The hellhounds: turns the animated wolf model into a hellhound (charred skin with glowing lava cracks, burning eyes, horns and spine spikes), plays its animations, and runs the AI |
| `elephants.js` | The ice elephants: gives the elephant model a skeleton when the game loads, its blue fire, animation and AI (walk, wind-up, charge, stun, gore) |
| `devil.js` | The devil boss (the metal demon and his Flying V) and his fireballs |
| `wings.js` | The angel wings: the feathered models, the pickup and the wingbeat animation |
| `weapons.js` | **Gun stats** (damage, fire rate, spread...) and the gun models, including the Flak Shotgun |
| `graphics.js` | Modern graphics: ambient occlusion, bloom, the filmic colour grade, anti-aliasing, sky lighting and reflections, and bullet holes |
| `main.js` | Controls, jumping and flying, shooting, pickups, the on-screen display (HUD) and the game loop |

### The 3D models

- **Hellhounds:** 'Wolf' by [Quaternius](https://quaternius.com), public domain (CC0), from [poly.pizza/m/P1gU3Qkr9r](https://poly.pizza/m/P1gU3Qkr9r). It's `models/hellhound.glb`. The game runs (gallop), lunges (attack), flinches when shot (hit reactions) and dies (death) with the model's own animations. `hounds.js` paints the lava cracks on with a small shader and bolts horns and spikes onto its bones.
- **Ice elephants:** 'Elephant' by [elkiotbear](https://poly.pizza/u/elkiotbear), licensed [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/), from [poly.pizza/m/3AfO8NwcxD](https://poly.pizza/m/3AfO8NwcxD). It's `models/elephant.glb`. The model has no skeleton or animations, so `elephants.js` gives it one when the game loads (legs, a six-part trunk, ears, head, tail and body) and animates it by hand: walking, rearing up, charging, goring and swaying its trunk. It gets the same lava-crack skin as the hounds, in icy blue fire, plus icicles on its back.

- **You, in rounds 3 and 4:** 'Soldier' by [KolosStudios](https://poly.pizza/u/KolosStudios), licensed [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/), from [poly.pizza/m/XT8jgwSesV](https://poly.pizza/m/XT8jgwSesV). It's `models/soldier.glb`. His M4 is swapped for the Flak Shotgun, his kit is dyed Hellkeep red, angel wings are fixed to his chest, and running, jumping, flying and riding are animated by turning his bones on top of his standing pose.
- **The motorcycle in round 4:** 'Motorcycle' by [Poly by Google](https://poly.pizza/u/Poly), licensed [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/), from [poly.pizza/m/5_MTCnqfUTr](https://poly.pizza/m/5_MTCnqfUTr). It's `models/motorcycle.glb`, with a headlight and exhaust flames added.

Models load only when the game runs through the local server (`serve.cmd` in the main folder; see the main README). Opened straight from your files, the game shows a tip and uses the old beasts built from simple shapes.

**Adding or swapping models:** every model is listed in `MODEL_FILES` in `index.html` and loaded before the game starts, so the game can use it as `MODELS.<name>`. To swap the hound, replace `models/hellhound.glb` and set its animation names in `HOUND_CLIPS` at the top of `hounds.js`. To add a model, put the `.glb` in `models/`, add a line to `MODEL_FILES`, and use `MODELS.<name>` in the code (`hounds.js` shows how: cloning, recolouring, attaching parts to bones, and playing animations; `elephants.js` shows how to rig a model that came without a skeleton).

**Big models:** the loader also reads compressed models, with Draco or Meshopt meshes and KTX2 textures, which can make files many times smaller. To compress a `.glb`, drop it on [gltf.report](https://gltf.report) in a browser and export it with Draco or Meshopt compression. No install is needed. Or, if you install Node.js later, run `npx @gltf-transform/cli optimize in.glb out.glb`. Keep a credit for every model you add here.

`side.html` runs rounds 3 and 4. It loads three.js and the models the same way as `index.html`, then `roundlist.js`, `util.js`, `themes.js`, `textures.js`, `sound.js`, `music.js`, `particles.js`, `hounds.js`, `elephants.js`, `wings.js`, `weapons.js` and `graphics.js` from above (so the beasts, wings, gun and effects are shared with the 3D rounds), plus its own files in `js/side/`:

| File | What it does |
| --- | --- |
| `side/levels.js` | **The side-on rounds:** maps drawn as text (the key is at the top). Round 4 is glued together from screen-sized chunks |
| `side/game.js` | The game itself: running, jumping and flying, the shotgun, the beasts, the camera. Worked out on a flat map in pixels (one tile = 16). The numbers at the top tune it all |
| `side/render3d.js` | **Draws it in 3D:** turns the map into smooth rock cliffs and rounded blocks, and moves the 3D models (you, the gun and wings, the motorcycle, hellhounds, elephants, pickups, the Soul Gem, fireballs and sparks) to match the game every frame. Also the lights, the lava sea and the camera |

Easy things to try changing:

- **The levels:** edit a `map` in `rounds.js`. The legend is at the top.
- **The guns:** tweak the numbers in `WEAPONS` in `weapons.js`.
- **The enemies:** the numbers at the top of `hounds.js`, `elephants.js` and `devil.js`.
- **The music:** to use your own MP3, put it in the `music` folder and list it in `TRACKS` at the top of `music.js` (by round number). For the synthesised songs, edit the riffs, drum patterns and tempo (`bpm`) in `SONGS`. The comment there explains the letters.
- **Jumping and flying:** `JUMP_SPEED`, `GRAVITY` and the `WING_` numbers at the top of `main.js`.
- **Brightness:** `exposure` in each theme in `rounds.js`.

Tips:

- Open `index.html#round=2` to jump straight to round 2. `#round=3` or `#round=4` opens the side-on rounds.
- `defense.html#preview` starts round 5 straight away (add `&wave=3` to skip to the devils with plenty of souls).
- `side.html#round=3&preview&god` starts a side-on round straight away, with you invincible. Add `&calm` to keep the beasts still, `&x=10&y=20` to start somewhere else (in tiles), or `&zoom=4` to bring the camera in close on you.
- Open `index.html#preview&god` to start straight away without capturing the mouse, and with you invincible. You can add `&round=2` to that, `&calm` to keep the beasts asleep, or `&noao` / `&nobloom` to compare effects. It's handy for screenshots and testing.
