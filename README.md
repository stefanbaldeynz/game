# Game Collection

My collection of browser games. There are no build tools or installs.

## How to play

**Double-click `serve.cmd`.** It starts a small web server on your computer and opens the collection at `http://localhost:8000/`. Pick a game there. Leave the black window open while you play, and close it (or press Ctrl+C) to stop.

Running through the server gives the full graphics: browsers block a page opened straight from your files from loading 3D models, so those games fall back to simpler built-in models. You can still open any game's `index.html` directly for a quick look.

The server is `serve.ps1`, which uses the PowerShell built into Windows. It only answers this computer, and it never caches files, so after editing a game just refresh the page. Run `serve.cmd -Port 9000` to use another port, or `serve.cmd -Open hellkeep/` to open straight into a game.

## The games

| Game | Folder | What it is |
| --- | --- | --- |
| Iyla's Game | [`iylas-game/`](iylas-game/) | 3D runner for phones. Iyla rides 13 animals and birds through 6 levels, with Rhino and Giant Shark boss fights and Milo the sausage dog. |
| Siege Run | [`siege-run/`](siege-run/) | 3D platformer across a map of Middle-earth: eight levels from the Shire to Mordor, with a Balrog boss in Moria. Works on phones with touch controls. |
| Astro Blaster | [`astro-blaster/`](astro-blaster/) | 2D arcade space shooter. Fly The Chow Hauler and blast asteroids. |
| Hellkeep | [`hellkeep/`](hellkeep/) | Shooter in hell, in four rounds: two in 3D first-person, then two side-on platform rounds (built from Gem Quest's levels). |
| Kiwi Canyon | [`kiwi-canyon/`](kiwi-canyon/) | 3D tower defense with a first-person mode. Stop 10 waves of kiwis in a New Zealand canyon. |
| Gem Quest | [`gem-quest/`](gem-quest/) | Retro 2D platformer. Punch blocks, dodge dragons and reach the Gem at the bottom. |
| Wacky Wings | [`wacky-wings/`](wacky-wings/) | Retro kart racer with NZ birds. Throw possums at the other racers and win a Speight's. |
| Coin Dash | [`coin-dash/`](coin-dash/) | The very first game: grab coins and dodge the red blocks. |

Every game works on phones and tablets too: touch controls appear by themselves when you play on a touch screen (an on-screen stick under your left thumb, buttons under your right). Most games share the touch controls in [`shared/touch-controls.js`](shared/touch-controls.js); Siege Run and Iyla's Game have their own built in.

Each folder is a complete game with its own README explaining how to play and how the code is organised. The 3D games load the three.js engine from the internet, so they need a connection the first time.
