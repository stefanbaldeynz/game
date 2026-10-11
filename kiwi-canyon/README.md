# Kiwi Canyon

A tower defense game in a New Zealand canyon, with a twist: at any moment you can jump down into the canyon and fight in first person.

Waves of kiwis march along the canyon floor from the cave on the left to the cave on the right. Build towers on the grassy rim to stop them. You can also drop into the canyon with your rifle. Survive all 10 waves to win.

## Play

Open `index.html` in Chrome or Edge and click to start. The game needs an internet connection the first time it loads, because the 3D engine ([three.js](https://threejs.org/)) and the font come from the web.

### Tower view (looking down from above)

| Control | Action |
| --- | --- |
| Click the grassy rim | Build a tower ($10) |
| Click a tower | Select it, then upgrade it (up to 3 times) with the button or **U** |
| Click the canyon floor | Choose where you'll drop in for first-person mode |
| **N** | Start the next wave |
| **F** | Jump into the canyon in first person |
| WASD / arrows, mouse wheel | Move and zoom the camera |
| **P** | Pause |

### First-person mode (on the canyon floor)

| Control | Action |
| --- | --- |
| WASD + mouse | Move and look |
| Left click (hold) | Shoot |
| **R** | Reload (30 rounds) |
| Shift | Sprint |
| **F** or **Esc** | Back to tower view |

## The rules

- You start with **$30**, which is enough for 3 towers.
- Every kiwi stopped earns **$1**, whether a tower got it or you did. Clearing a wave also pays a bonus.
- Towers have **4 levels**. Each upgrade adds damage, fire rate and range, and changes the look: bronze, silver, gold, then glowing blue.
- Your rifle can be upgraded 3 times too, from the tower view.
- Each wave has more kiwis, and they're tougher and faster. Wave 1 kiwis take 10 rifle shots, and wave 10 kiwis have over 4 times the health.
- Each kiwi that reaches the far cave costs a life. You have 20.

Towers alone aren't quite enough. A good tower setup without the rifle falls around wave 9, so you'll need to get down there and help.

## How the code is organised

| File | What it does |
| --- | --- |
| `js/config.js` | **Every balance number:** money, costs, kiwi health/speed/count per wave, tower and rifle stats |
| `js/map.js` | **The map** (an ASCII grid you can edit), building the 3D canyon, collision, and the kiwis' path |
| `js/kiwis.js` | The kiwi model, waddle animation and health bars |
| `js/towers.js` | Tower models, aiming and bolts |
| `js/player.js` | First-person movement, the rifle and shooting |
| `js/main.js` | Switching views, building/upgrading, waves, money, lives and the on-screen display (HUD) |
| `js/textures.js`, `js/sound.js`, `js/effects.js` | Textures and sounds made with code (no image or audio files), feathers, dust and "+$1" popups |

To change the canyon's shape, edit `MAP` in `map.js`. The path must be a single trail of `=` from `S` to `E`, and each end must touch the edge of the map.
