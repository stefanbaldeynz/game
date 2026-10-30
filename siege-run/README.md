# Siege Run

A 3D platformer with a retro PS1 look, set on the walls of Minas Tirith. Three levels:

1. **The First Circle.** Ride Shadowfax through the burning city.
2. **The Second Circle.** Gandalf on foot along the second rampart.
3. **The Citadel.** Face Sauron beside the White Tree.

## The world map

The game opens on a map of Middle-earth. Gandalf walks a road of stepping stones from the Shire past Rivendell, Moria and Edoras to Minas Tirith and on to Mordor. A wooden sign names the place he's heading for. Only **Minas Tirith** is open for now; the other places are locked and marked "coming soon", ready for new levels. Select Minas Tirith and the camera flies down into the city, where you pick one of its three levels. **◀ MAP** (or Esc) flies back out.

| Map control | Computer | Phone |
| --- | --- | --- |
| Travel | ← → (or A / D, D-pad, stick) | Tap a place |
| Enter a place | Enter / Space / ✕ | Tap it again |
| Back to the map | Esc / Backspace / ○ | ◀ MAP button |

The map lives in the `WORLD MAP` section of the code. Each stop is an entry in `NODES`; to open a new place, give it `open: true` and make `mapSelect()` send it to its own levels.

## Pause menu

Resume, Restart, Quit (back to the Minas Tirith menu), Music, and the two cheats: **Invincible** and **Unlimited rockets**. Cheat buttons light up when on. Keys Z and X still toggle them too.

Everything (graphics, textures, music and sound) is in the one file, `index.html`. three.js loads from the internet.

## Play on a computer

| Key | Action |
| --- | --- |
| W A S D / arrows / left stick | Move (on Shadowfax: steer, up to gallop, down to rein in) |
| Space / K / ✕ | Jump. Press again in mid-air to double jump |
| J / Shift / □ | Spin: smash crates and orcs |
| L / F / click / ○ | Firework from Gandalf's staff |
| Esc / P / Start | Pause (the pause menu has buttons for everything) |
| M | Music on/off |
| Z / X / 1 2 3 | QA: invincible / unlimited rockets / jump to a level |

## Play on a phone

Open the game in the phone's browser and turn the phone sideways. Tap a level to start (on Android it goes full screen).

- **Left thumb:** touch anywhere on the left side and drag to move. The stick appears where you put your thumb.
- **Right thumb:** **JUMP** (green; hold for a higher jump, tap again in mid-air to double jump), **SPIN** (purple) and **FIRE** (red, with your rocket count).
- **Pause** is the button at the top left. The pause screen has Resume, Restart, Quit, Music and the cheat buttons.

To get it onto your phone, the folder has to be on a web address, for example by turning on GitHub Pages for this repository. `serve.cmd` only answers your own computer.

The touch controls show up as soon as the screen is touched, and go away again if you press a key, so the same file works on both.
