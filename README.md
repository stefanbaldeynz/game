# Game Collection

My collection of browser games. There are no build tools or installs.

## How to play

**Double-click `serve.cmd`.** It starts a small web server on your computer and opens the **game select** at `http://localhost:8000/`. Each game is also at `http://localhost:8000/<folder>/` (for example `wacky-wings/`). Leave the black window open while you play, and close it (or press Ctrl+C) to stop.

Running through the server gives the full graphics: browsers block a page opened straight from your files from loading 3D models, so those games fall back to simpler built-in models. You can still open any game's `index.html` directly for a quick look.

The server is `serve.ps1`, which uses the PowerShell built into Windows. It only answers this computer, and it never caches files, so after editing a game just refresh the page. Run `serve.cmd -Port 9000` to use another port, or `serve.cmd -Open gem-quest/` to open straight into a game.

## Shared code

`lib/three/` holds the [three.js](https://threejs.org/) 3D engine (version 0.186.1) for the 3D games, so they load it from this computer instead of the internet. See its README for what's in it.

## The games

| Game | Folder | What it is |
| --- | --- | --- |
| Iyla's Game | [`iylas-game/`](iylas-game/) | 3D runner for phones. Iyla rides 20 animals, birds, dinosaurs and ice animals through 9 levels, with Rhino, Giant Shark, Triceratops and Ice Monster boss fights and Milo the sausage dog. |
| Siege Run | [`siege-run/`](siege-run/) | 3D platformer across a map of Middle-earth that Gandalf walks freely: eleven levels from an open-world Hobbiton (nine Nazgûl to defeat) to Mount Doom, with a lightsaber duel against the Witch-king on Weathertop, a Balrog boss in Moria, a Shelob chase and a climb ahead of rising lava. Works on phones with touch controls. |
| Astro Blaster | [`astro-blaster/`](astro-blaster/) | 2D arcade space shooter. Fly The Chow Hauler and blast asteroids. |
| Hellkeep | [`hellkeep/`](hellkeep/) | Shooter in hell, in five rounds: two in 3D first-person, two side-on platform rounds (from Gem Quest) and a tower-defence siege (from Kiwi Canyon). |
| Kiwi Canyon | [`kiwi-canyon/`](kiwi-canyon/) | 3D tower defense with a first-person mode. Stop 10 waves of kiwis in a New Zealand canyon. |
| Gem Quest | [`gem-quest/`](gem-quest/) | Retro 2D platformer. Punch blocks, dodge dragons and reach the Gem at the bottom. |
| Wacky Wings | [`wacky-wings/`](wacky-wings/) | Retro kart racer with NZ birds. Throw possums at the other racers and win a Speight's. |

Every game works on phones and tablets too: touch controls appear by themselves when you play on a touch screen (an on-screen stick under your left thumb, buttons under your right). Most games share the touch controls in [`shared/touch-controls.js`](shared/touch-controls.js); Siege Run and Iyla's Game have their own built in.

On a phone, every game goes full screen (no address bar) as soon as you tap, held sideways or upright. iPhone Safari doesn't let web pages go full screen, so on an iPhone open the game, tap Share, then **Add to Home Screen**: started from that icon, the game fills the whole screen.

Each folder is a complete game with its own README explaining how to play and how the code is organised. The 3D games load the three.js engine from the internet, so they need a connection the first time.
