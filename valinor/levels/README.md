# Levels from other games (only on your computer)

Three files here change how levels are built. Each is made from a game you have installed, by a script in `C:\Users\Stefan\bfme\tools`.

| File | What it does | Made with |
| --- | --- | --- |
| `oakvale.json` | Turns Hobbiton into **Oakvale**, the village from the start of Fable: The Lost Chapters. You get its hillside down to the sea, and the buildings where Fable puts them: houses, tavern, shops and the trader's bridge. Its fences, walls, rocks, lamps, crates and chickens come too, and trees, bushes, crops and flowers grow wherever Fable's ground says they do. The nine Nazgûl hunt you through it as usual. | `Prep-Oakvale.ps1` |
| `rivendell.json` | Builds **Rivendell** in the river gorge from Fable's Greatwood. The Bruinen runs deep down a ravine with high wooded banks either side, and two bridges cross high over the water. The Last Homely House, the houses, towers and gazebo stand on the level ground along the edge of the gorge, looking down on the river. Falls pour where the river drops fastest, and Fable's old walls become elven ruins. | `Prep-Oakvale.ps1 -Region Greatwood_4 -Out C:\Users\Stefan\game\valinor\levels\rivendell.json -Keep '^OBJECT_(WOODEN_BRIDGE\|BW_BRIDGE\|BRIGHTWOOD_.*ROCK\|OK_WALL\|OK_PILLAR\|GREATWOOD_TREESTUMP)'` |
| `mirkwood.json` | Builds **Mirkwood** on DM-TokaraForest from Unreal Tournament 2004: its forest bowl, its giant trees and branches, and its catwalks and ramps. Valinor rebuilds them in bark and old planks, and you can walk the walkways. Tokara's hanging lights become Morgul lanterns, its pods become egg sacs, its jump pads become web springs, and its bot paths are where the spiders start. | `Prep-Tokara.ps1` (it runs UT2004's own `UCC.exe` to take the map apart) |

- The ground, and where everything stands, come from those games. The buildings and plants are Battle for Middle-earth's own when `models/props/` has them (see its README), and Valinor's own shapes otherwise. Fable's and Unreal's 3D models aren't brought across.
- To play the built-in levels while these files are here, add `?layout=shire` (Hobbiton) or `?layout=classic` (Rivendell and Mirkwood) to the address, or delete the file. Without `mirkwood.json`, Mirkwood grows a smaller forest bowl of its own.

**Everything in this folder stays on your computer.** Git ignores it (only this README is in the repository). Fable belongs to Microsoft and Lionhead, and Unreal Tournament 2004 to Epic, so keep these for playing at home.
