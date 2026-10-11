# Hellkeep

A first-person shooter in the style of Doom and GoldenEye, in two rounds.

- **Round 1: The Burning Keep.** Walk through the lava fields of hell to a burning castle. Flaming hellhounds guard every hall, and the **devil** waits by the throne. Kill them all to finish the round.
- **Round 2: The Frozen Depths.** A frozen castle with freezing pools and falling snow. **Ice elephants** with huge tusks, burning with blue fire, roam its halls. Bring them all down to beat the game.

## Play

Open `index.html` in Chrome or Edge, then click to start. The game needs an internet connection the first time it loads, because the 3D engine ([three.js](https://threejs.org/)) and the fonts come from the web.

| Key | Action |
| --- | --- |
| W A S D / arrow keys | Move |
| Mouse | Look around |
| Left click | Shoot (hold to keep firing with the rifle) |
| Shift | Sprint |
| Space | Jump. Press again in mid-air to **double jump** |
| Hold Space (after a double jump) | **Jetpack**, once you have it |
| 1 / 2 / 3 or mouse wheel | Pistol / shotgun / rifle |
| Esc | Pause |

## The rules

- You start round 1 with a **pistol** and a **shotgun**. The **rifle** is waiting just inside the castle gate.
- The pistol and rifle share **bullets**. The shotgun uses **shells**.
- Green-glowing **health boxes** give +25 health. Yellow-glowing **ammo crates** give +25 bullets and +6 shells.
- Enemies sleep until they see you, get close, or hear a gunshot nearby. Then they hunt you down.
- **Lava and freezing water hurt**, but only when you're standing in them. Jump over them.
- **Hellhounds** bite, but they can't reach you in the air.
- **The devil** (1,200 health) throws fireballs. Strafe to dodge them. Up close he stabs with his trident. Below half health he gets enraged: he moves faster and throws three fireballs at once. When he dies he drops a **jetpack**.
- **The jetpack:** double jump, then keep holding Space to fly. The fuel gauge under your health refills while you stand on the ground.
- **Ice elephants** (320 health) rear up, trumpet, then **charge**. A charge hits hard and throws you back. A single jump isn't high enough to clear one, but a double jump or the jetpack is. If an elephant charges into a wall, it's stunned for a moment. Up close it gores you with its tusks.
- Round 2 starts with all three guns and the jetpack.

## How the code is organised

Every file in `js/` is a plain script, loaded in this order by `index.html`:

| File | What it does |
| --- | --- |
| `util.js` | Small shared helpers |
| `rounds.js` | **The rounds:** each round's map (an ASCII grid you can edit), colour theme and starting gear |
| `textures.js` | Draws every texture (bricks, lava, ice, the creatures' skins...) with code, so there are no image files |
| `sound.js` | Makes every sound effect with the Web Audio API, so there are no audio files |
| `particles.js` | Fire, blue fire, sparks, embers and snow |
| `level.js` | Builds the round's map in 3D, plus collision and enemy path finding |
| `hounds.js` | The hellhound model, animation and AI |
| `elephants.js` | The ice elephant model, animation and AI (walk, wind-up, charge, stun, gore) |
| `devil.js` | The devil boss and his fireballs |
| `weapons.js` | **Gun stats** (damage, fire rate, spread...) and the gun models |
| `main.js` | Controls, jumping and the jetpack, shooting, pickups, the on-screen display (HUD) and the game loop |

Easy things to try changing:

- **The levels:** edit a `map` in `rounds.js`. The legend is at the top.
- **The guns:** tweak the numbers in `WEAPONS` in `weapons.js`.
- **The enemies:** the numbers at the top of `hounds.js`, `elephants.js` and `devil.js`.
- **Jumping and the jetpack:** `JUMP_SPEED`, `GRAVITY` and the `JETPACK_` numbers at the top of `main.js`.

Tips:

- Open `index.html#round=2` to jump straight to round 2.
- Open `index.html#preview&god` to start straight away without capturing the mouse, and with you invincible. You can add `&round=2` to that. It's handy for screenshots and testing.
