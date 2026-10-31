# Siege Run

A 3D platformer with a retro PS1 look, set on the walls of Minas Tirith. Three levels:

1. **The First Circle.** Ride Shadowfax through the burning city.
2. **The Second Circle.** Gandalf on foot along the second rampart.
3. **The Citadel.** Face Sauron beside the White Tree.

## The world map

The game opens on a map of Middle-earth. Gandalf walks a road of stepping stones between six places, and a wooden sign names the place he's heading for. Every place is playable:

| Place | Level | What's there |
| --- | --- | --- |
| The Shire | **The Shire** | A dirt lane along grassy banks with round hobbit doors and hedges. Orc raiders, moving platforms over a gap, the Party Tree on the hill. |
| Rivendell | **Rivendell** | Pale elven paths on a cliff over the river, waterfalls everywhere, golden houses on the heights. Orc scouts, stepping-stone pillars, moving and crumbling platforms. |
| Moria | **The Mines of Moria** | Dark dwarf-halls with columns rising out of a fiery abyss. Goblins climbing out of the chasm, then the **Balrog boss** on the Bridge of Khazad-dûm. |
| Edoras | **The Ride to Edoras** | Gallop on Shadowfax across the golden plains of Rohan past palisades and the Golden Hall. Uruk-hai and stake barricades to jump. |
| Minas Tirith | Three levels | Flies down into the city and opens its own menu: The First Circle, The Second Circle and The Citadel (Sauron). |
| Mordor | **Mordor** | Black rock over a sea of lava, Barad-dûr and the Eye in the middle, fell beasts spitting fire overhead, lots of TNT. |

Finishing (or quitting) a place brings you back to the map with Gandalf standing on it.

| Map control | Computer | Phone |
| --- | --- | --- |
| Travel | ← → (or A / D, D-pad, stick), or the ◀ ▶ buttons | ◀ ▶ buttons, or tap a place |
| Play the place | Enter / Space / ✕, or the ENTER button | ENTER button, or tap the place again |
| Back to the map (Minas Tirith menu) | Esc / Backspace / ○ | ◀ MAP button |

The camera always frames the stops on either side of Gandalf, so the next place is on screen.

### The Balrog (end of Moria)

On the Bridge of Khazad-dûm, Durin's Bane climbs out of the abyss beside the bridge. A wall of fire blocks the far end until it falls. It has 9 hits (health bar at the bottom):

- **Fireworks** at its head do 1 hit each.
- When it **smashes its fist** onto the bridge, the fist stays there for a moment: **spin** into it for a hit (spinning protects you from the flames).
- Every 3 hits it's stunned and you get 3 more fireworks. There are firework crates along the bridge too.
- Jump the **whip crack** and the **sweep**, and step out from under the red warning circles.

When it falls: "YOU SHALL NOT PASS!", the fire wall goes out and the gate at the end opens.

### How the places are built

Each place is its own curved rampart (a ring, like Minas Tirith's circles) placed far out in the world so they never see each other. In the code:

- `LEVELS` has one entry per level. `loc` ties it to a map stop and `theme` picks its look. `floors`, `pillars`, `bars`, `dz` (fell beasts) and `balrogs` lay it out. A fourth number on a floor narrows it into a bridge, `open` leaves a gap in the inner wall, and `gateS` puts a fire wall across the road until the boss dies.
- `THEMES` holds each place's textures, sky colours, fog, lights, enemy colours, edge and wall decoration, and the scenery around the ring.
- `NODES` (in the `WORLD MAP` section) lists the map stops.

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

Open the game in the phone's browser. It plays sideways or upright, and goes full screen as soon as you tap (on iPhone, add it to the home screen for full screen).

- **Left thumb:** touch anywhere on the left side and drag to move. The stick appears where you put your thumb.
- **Right thumb:** **JUMP** (green; hold for a higher jump, tap again in mid-air to double jump), **SPIN** (purple) and **FIRE** (red, with your rocket count).
- **Pause** is the button at the top left. The pause screen has Resume, Restart, Quit, Music and the cheat buttons.

To get it onto your phone, the folder has to be on a web address, for example by turning on GitHub Pages for this repository. `serve.cmd` only answers your own computer.

The touch controls show up as soon as the screen is touched, and go away again if you press a key, so the same file works on both.
