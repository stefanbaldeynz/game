# Your own character models (only on your computer)

Put a `.glb` file here with one of these names and Valinor uses it instead of its built-in model:

| File | Who it replaces | Where you meet them |
| --- | --- | --- |
| `gandalf.glb` | Gandalf (his staff and lightsaber stay) | Every level |
| `balrog.glb` | The Balrog (and Hellkeep's, when it's copied into `hellkeep/models/` too) | Moria (boss, giant and waist-deep in the abyss) and the First Circle chase |
| `witchking.glb` | The Witch-king (his red lightsaber stays) | Weathertop |
| `shelob.glb` | Shelob | The Pass of Cirith Ungol |
| `nazgul.glb` | The nine Nazgûl | Hobbiton |
| `orc.glb` | Orcs and goblins | Most levels |
| `fellbeast.glb` | The fell beasts (a Nazgûl on a winged beast) | Minas Tirith, Mordor and Mount Doom |
| `horse.glb` | Shadowfax | The First Circle and the Ride to Edoras |
| `frodo.glb`, `sam.glb`, `merry.glb`, `pippin.glb`, `aragorn.glb`, `legolas.glb`, `gimli.glb`, `boromir.glb` | The Fellowship | Rivendell |
| `livingmap.glb` + `livingmap.json` | The map: BFME II's War of the Ring board instead of the little diorama (make them with `Prep-Map.ps1`, then `Convert-Chars.ps1 livingmap`) | The world map, where you pick a place |

**Everything in this folder stays on your computer.** Git ignores it, so it's never pushed to GitHub or the public website. Only this README is in the repository.

## How it works

- It only works when you start the game with `serve.cmd`. Browsers won't load models into a page opened straight from your files, and the public website never asks for them.
- The model is scaled to the right height and stood on the ground automatically. If it faces the wrong way, is the wrong size, or is too dark, ask Claude to change its `turn`, `height` or `glow` in `MODEL_SLOTS` in `index.html`. BFME models face sideways, so their slots already have `turn: -Math.PI / 2`.
- Bodies are drawn solid (BFME keeps its team-colour mask in the transparency channel). Parts named like fire, flame, cloud, flare, glow, light or eyes are drawn as glowing see-through effects instead.
- Other options in `MODEL_SLOTS`: `sink` (how much of it stays below the ground: the Balrog stands in the abyss), `fx` (the colour its fire and glow cards shine), `hide` (parts to leave out by name, like the Gandalf that comes riding BFME's Shadowfax) and `anims` (which clip to use where the usual names pick the wrong one).
- To test one model on its own, add `&models=balrog` (or a list, `&models=balrog,gandalf`) to the address.
- Animations are picked by name, so name your animations (Blender's Action editor) with these words in them:
  - **idle** (or stand, breath, ready): standing still
  - **walk** (or run, move, gallop, and BFME's `wala`): moving
  - **attack** (or smash, swing, slash, strike): attacking
  - **hurt** (or damage, stun): being hit
  - **die** (or death, dead, and BFME's `dtha`): dying (played once)
  - **jump** (or fall): in the air (Gandalf)

  Missing ones fall back to idle. Exact names don't matter otherwise: `Balrog_Smash_01` counts as an attack.
- To check it worked, open the browser's console (F12). Valinor lists the files it's using and the animation names it found.

## Getting a model out of BFME2

1. Open the game's `.big` archives with **FinalBIG** and search for the character (for example "balrog"). Extract its model `.w3d` files (skin and skeleton), its animation `.w3d` files, and its textures (`.tga` or `.dds`).
2. In **Blender**, install the **W3D import add-on** (from the OpenSAGE project). Import the skeleton, then the skin, then the animations.
3. Connect the textures if they didn't come through, and check each animation plays.
4. **File → Export → glTF 2.0**, format **glTF Binary (.glb)**, with **Animation** ticked. Save it here with the name from the table.

These models belong to EA and the Tolkien rights holders, so keep them for playing at home and don't share them.
