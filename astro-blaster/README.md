# Astro Blaster

An arcade space shooter that runs in the browser. You fly **The Chow Hauler**, a battered cargo ship with glowing ration canisters and twin cannons. Blast the asteroids and don't get hit.

No build tools or installs: open `index.html` in a browser to play.

## Controls

| Key | Action |
| --- | --- |
| Arrow keys / WASD | Move |
| Space | Fire |
| P | Pause |
| Enter | Start / play again |

## On a phone or tablet

Touch controls appear by themselves: the left thumb steers the ship (the stick appears wherever you put your thumb), hold **FIRE** on the right to shoot, and **II** at the top pauses. Tap the screen to start, resume or play again.

## How it plays

- You have 3 lives. You get a short moment of safety (your ship blinks) after each hit.
- Big asteroids split into two medium ones, and medium ones split into two small ones.
- Points: big 20, medium 50, small 100.
- The level goes up every 15 seconds. Each new level makes asteroids faster and more frequent.
- Your high score is saved in the browser.

## Project layout

- `index.html` is the page that hosts the game
- `style.css` holds the styles
- `game.js` holds the game loop, input, and drawing
