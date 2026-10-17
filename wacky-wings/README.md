# Wacky Wings

A kart racer inspired by the old DOS game Wacky Wheels, starring New Zealand birds. Pick your driver, grab possum tokens off the road, throw possums at the other racers, and win three laps of the Southern Alps Raceway. The winner gets a Speight's.

No build tools or installs: open `index.html` in a browser to play.

## Controls

| Key | Action |
| --- | --- |
| Up / W | Accelerate |
| Down / S | Brake / reverse |
| Left / Right or A / D | Steer |
| Space / X / Ctrl | Throw a possum |
| P | Pause |
| M | Sound on / off |
| Left / Right, then Enter | Pick your driver and start |

## The drivers

Each bird has its own speed, acceleration and handling. They all add up to the same total, so none is simply the best.

| Bird | Speed | Accel | Handling |
| --- | --- | --- | --- |
| Kiwi | 3 | 3 | 3 |
| Kea | 3 | 2 | 4 |
| Tui | 4 | 3 | 2 |
| Pukeko | 2 | 4 | 3 |
| Kakapo | 5 | 1 | 3 |
| Takahe | 4 | 2 | 3 |
| Weka | 2 | 5 | 2 |
| Fantail | 2 | 3 | 5 |

## How it plays

- 8 racers, 3 laps. You start 6th on the grid.
- Gold possum tokens sit across the road in four places. Drive through one for 2 more possums (up to 9). They come back after a few seconds.
- A thrown possum bounces down the road. If it hits a racer, they spin out. If it misses, it sits dazed on the road and trips up the next kart that runs into it.
- The other birds throw possums too, so watch your mirrors.
- The sand verge and the grass slow you down. The trees are solid, and the sheep get in the way.
- The minimap in the corner shows everyone. Your dot has a white ring.
- When you finish, the podium shows the top three, and the winner gets a Speight's.

## Project layout

- `index.html` is the page that hosts the game
- `style.css` holds the page styles
- `js/track.js` holds the track shape and paints the ground map, the trees and the sheep. Change the `points` in `TRACK` to reshape the circuit.
- `js/art.js` holds the birds (colours, stats and beaks) and draws every picture. The karts come from a tiny 3D model, drawn from 16 angles.
- `js/audio.js` makes the engine, the sound effects and the music with Web Audio
- `js/game.js` holds the race: the "Mode 7" ground drawing, kart physics, the computer drivers, possums, laps and the screens

The 3D look is the trick the 16-bit racers used. Each row of the screen below the horizon shows one slice of a flat map, and the slices further away sit higher up. Everything else is a flat picture that gets bigger as it gets closer.
