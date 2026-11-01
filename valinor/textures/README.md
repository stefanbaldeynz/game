# Your own textures (only on your computer)

Put a picture here with one of these names (`.png`, `.jpg` or `.webp`) and Valinor draws that surface with it instead of its built-in pixel-art texture:

| File | What it covers |
| --- | --- |
| `meadow` | Hobbiton's fields and the hills round it |
| `grass` | Grass: Hobbiton, Edoras, the Shire hills, Weathertop's slopes |
| `rock` | Rock and cliffs: Rivendell, Moria, Cirith Ungol, Weathertop's stones |
| `path` | Dirt roads and paths |
| `turf` | Grassy earth banks and walls (Hobbiton, Edoras) |
| `moss` | Rivendell's mossy paving |
| `marble` | White stone: Minas Tirith's walls |
| `floor` | Stone floor tiles: Minas Tirith, Weathertop's flagstones |
| `dark` | Dark stone floors: Moria, Mordor, Cirith Ungol |
| `lavaRock` | Black volcanic rock: Mordor, Mount Doom |
| `wood` | Wooden planks: the Bridge of Khazad-dûm, beams |
| `roof` | Minas Tirith's roofs |
| `plains` | The Pelennor fields below Minas Tirith |
| `metal` | Metal parts |
| `mosaic` | The Citadel's courtyard |

**Everything in this folder stays on your computer.** Git ignores it, so it's never pushed to GitHub or the public website. Only this README is in the repository.

- It only works when you start the game with `serve.cmd`.
- Use pictures that tile (repeat seamlessly), like BFME2's terrain textures. Square sizes such as 256×256 or 512×512 work best.
- BFME2's textures are `.tga` or `.dds`, which browsers can't show, so they have to be saved as `.png` first. Claude has a converter for this: it can pull the textures out of the game's `.big` archives and convert them all at once.

These textures belong to EA, so keep them for playing at home and don't share them.
