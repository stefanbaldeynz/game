# Gem Quest

A retro platformer in the style of the old 8-bit console games. Punch blocks open for prizes, dodge the fire-breathing dragons and grab the **Gem** to clear each level.

## Levels

1. **Rocky Gorge**: climb down the gorge to the Gem at the very bottom.
2. **Motorbike Mayhem**: ride a motorbike sideways across the water. Smash through rocks, run over scorpions and jump the gaps. Falling in the water costs a life.

Clearing a level takes you on to the next one. On the title screen, **Left / Right** picks which level to start on (handy for testing).

No build tools or installs: open `index.html` in a browser to play.

## Controls

| Key | Action |
| --- | --- |
| Arrow keys / A D | Move |
| Space / Up / W / X | Jump (hold for a higher jump) |
| Z / J | Punch (and shoot magic once you have it) |
| P | Pause |
| M | Sound on / off |
| Left / Right (title screen) | Pick the level |
| Enter | Start / play again |

On the motorbike, the bike rolls forward on its own: **Right** speeds up and **Left** slows down. After you lose a life, it waits until you press Right or Jump. Z / J fires magic if you have it.

## How it plays

- You have 3 lives. Touching a dragon, a scorpion or fire costs a life, and you come back at the last safe spot you stood on.
- **Dragons** fly round in a loop and spit fire in the direction they're flying. Punch them for 300 points.
- **Scorpions** walk along the ledges. Punch them for 200 points.
- **Star blocks** (yellow) hold a money bag (200 points) or sometimes a heart (extra life).
- The **magic block** (purple) holds the magic orb. With it, every punch also fires a magic ring that flies across the screen, kills enemies, smashes blocks and even destroys fireballs.
- Plain rock blocks (peach) can be smashed too.
- Reaching the Gem gives a time bonus, so the faster the better. The bar on the right shows how far down you are.
- Your high score is saved in the browser.

## Project layout

- `index.html` is the page that hosts the game
- `style.css` holds the page styles
- `js/levels.js` holds the level maps, drawn as text (the key is at the top of the file). Add a new entry to `LEVELS` to make a new level. A level can be tall (scrolls down) or wide (scrolls sideways). The motorbike level is glued together from screen-sized chunks with `joinChunks`.
- `js/sprites.js` holds the pixel art. Each sprite is written as rows of letters, one letter per pixel.
- `js/audio.js` makes the sound effects and music with Web Audio
- `js/game.js` holds the game loop, physics, enemies and drawing

The world is drawn at 256×192 pixels (the screen size of an old 8-bit console) and scaled up 3×, so everything stays crisp and blocky.
