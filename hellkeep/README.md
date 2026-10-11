# Hellkeep

A first-person shooter in the style of Doom and GoldenEye. You arrive in hell, walk through the lava fields to a burning castle, and fight your way through its halls. Hellhounds wreathed in fire guard every room. Put them all down to win.

## Play

Open `index.html` in Chrome or Edge, then click to start. The game needs an internet connection the first time it loads, because the 3D engine ([three.js](https://threejs.org/)) and the fonts come from the web.

| Key | Action |
| --- | --- |
| W A S D / arrow keys | Move |
| Mouse | Look around |
| Left click | Shoot (hold to keep firing with the rifle) |
| Shift | Sprint |
| 1 / 2 / 3 or mouse wheel | Pistol / shotgun / rifle |
| Esc | Pause |

## The rules

- You start with a **pistol** and a **shotgun**. The **rifle** is waiting just inside the castle gate.
- The pistol and rifle share **bullets**. The shotgun uses **shells**.
- Green-glowing **health boxes** give +25 health. Yellow-glowing **ammo crates** give +25 bullets and +6 shells.
- Hounds sleep until they see you, get close, or hear a gunshot nearby. Then they hunt you through the castle.
- **Lava hurts.** Don't stand in it.
- Kill all 12 hellhounds to clear the castle.

## How the code is organised

Every file in `js/` is a plain script, loaded in this order by `index.html`:

| File | What it does |
| --- | --- |
| `util.js` | Small shared helpers |
| `textures.js` | Draws every texture (bricks, lava, the hounds' burning skin...) with code, so there are no image files |
| `sound.js` | Makes every sound effect with the Web Audio API, so there are no audio files |
| `particles.js` | Fire, sparks and embers |
| `level.js` | **The map** (an ASCII grid you can edit), plus building it in 3D, collision and hound path finding |
| `hounds.js` | The hellhound model, animation and AI |
| `weapons.js` | **Gun stats** (damage, fire rate, spread...) and the gun models |
| `main.js` | Controls, shooting, pickups, the on-screen display (HUD) and the game loop |

Easy things to try changing:

- **The level:** edit the `MAP` in `level.js`. The legend is right above it.
- **The guns:** tweak the numbers in `WEAPONS` in `weapons.js`.
- **The hounds:** `HOUND_SPEED` and `HOUND_HP` at the top of `hounds.js`.

Tip: opening `index.html#preview&god` starts the game straight away without capturing the mouse, and makes you invincible. It's handy for screenshots and testing.
