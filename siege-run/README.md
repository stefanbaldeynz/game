# Siege Run

A 3D platformer with a retro PS1 look, set on the walls of Minas Tirith. Three levels:

1. **The First Circle.** Ride Shadowfax through the burning city.
2. **The Second Circle.** Gandalf on foot along the second rampart.
3. **The Citadel.** Face Sauron beside the White Tree.

## The world map

The game opens on a map of Middle-earth. Gandalf walks freely across it. Walk him up to a place and a wooden sign names it. Every place is playable:

| Place | Level | What's there |
| --- | --- | --- |
| The Shire | **Hobbiton** | Open country to roam freely, Spyro-style. Hobbit holes round the edges and out in the middle, Bag End on a terraced hill you jump up, the town with its market and well, the Green Dragon by the pool, and Bilbo's party with the Party Tree, the pavilion and fireworks. **Nine Nazgûl** hunt through it: spin into them or hit them with fireworks (three hits each), and get out of the way when a sword goes up. Defeat all nine to finish. |
| Weathertop | **Weathertop** | A lightsaber duel with **the Witch-king** inside the ruined ring of Amon Sûl (see below). |
| Rivendell | **Rivendell** | Mossy elven paths just above a green pool, turquoise waterfalls pouring past the gaps, carved ruins wound with vines standing in the water, big leafy plants, golden houses on the heights. Orc scouts, mossy rock islands to jump across, moving and crumbling platforms. |
| Moria | **The Mines of Moria** | Dark dwarf-halls with columns rising out of a fiery abyss, chains and lanterns hanging from the roof, stalactites. Goblins climbing out of the chasm, then the **Balrog boss** on the Bridge of Khazad-dûm: a plank bridge with rope rails over a sea of mist and rock spires. |
| Edoras | **The Ride to Edoras** | Gallop on Shadowfax across the golden plains of Rohan past palisades and the Golden Hall. Uruk-hai and stake barricades to jump. |
| Minas Tirith | Three levels | Flies down into the city and opens its own menu: The First Circle, The Second Circle and The Citadel (Sauron). |
| Cirith Ungol | **The Pass of Cirith Ungol** | A chase. A narrow pass full of webs, and **Shelob** drops out of them behind you. The camera turns round and you run towards it with the spider at your heels. Jump the webs and the gaps, and don't stop until the end of the pass. |
| Mordor | **Mordor** | Black rock over a sea of lava, Barad-dûr and the Eye off to the side, fell beasts spitting fire overhead, lots of TNT. |
| Mount Doom | **Mount Doom** | A climb. Jump up spires of rock that zig-zag up the side of the mountain while **the lava rises** underneath you. The last gate is at the top, by the Crack of Doom. |

Finishing (or quitting) a place brings you back to the map with Gandalf standing in front of it.

| Map control | Computer | Phone |
| --- | --- | --- |
| Walk | Arrows / W A S D / left stick, or click where to go (hold to keep walking) | Tap where to go, or hold and drag |
| Play the place you're standing at | Enter / Space / ✕, or the ENTER button | ENTER button, or tap the place |
| Back to the map (Minas Tirith menu) | Esc / Backspace / ○ | ◀ MAP button |

The camera follows Gandalf from high above. He can't walk into the sea.

### The duel on Weathertop

Gandalf has a blue lightsaber and the Witch-king a red one. Gandalf always faces him: forward closes in, sideways circles round him.

| Button | In the duel |
| --- | --- |
| Spin (J / Shift / □ / SWING) | Swing. Press again for a three-hit combo; the third is a heavy overhead |
| Fire (L / F / click / ○ / PUSH) | Force push (uses the purple Force bar, which refills) |
| Jump | Jump (over his lunge) |

- Gandalf **blocks by himself** whenever he isn't swinging, so stand your ground against his sword combos. The last strike of a combo is heavy and shoves you back even through a block.
- He blocks your swings too when he's ready for them. **Three blocked swings in a row break his guard**, so then hit him while he staggers. Hits land when he's winding up, recovering or staggered.
- If you both swing at the same moment you get a **saber lock**: mash Swing to win it.
- His **lunge** is a flying slash: jump it or step out of its line. His **Force push** knocks you down.
- At two-thirds health he adds **Force lightning** (blocking soaks most of it) and a **thrown saber** (blocking knocks it back). At one-third he adds **Force grip**: mash Swing or Jump to break free.
- **Force push interrupts** his lightning, grip, throw and lunge.
- Both have health bars. If Gandalf falls, the duel restarts from the start of the current third of the Witch-king's health.

### The Balrog (end of Moria)

On the Bridge of Khazad-dûm, Durin's Bane climbs out of the abyss beside the bridge. It's built like Hellkeep's Balrog: black skin split by glowing cracks of fire, a long horned skull, ragged wings of shadow, a sword of flame in one fist and the whip in the other. A wall of fire blocks the far end until it falls. It has 9 hits (health bar at the bottom):

- **Fireworks** at its head do 1 hit each.
- When it **smashes its fist** onto the bridge, the fist stays there for a moment: **spin** into it for a hit (spinning protects you from the flames).
- Every 3 hits it's stunned and you get 3 more fireworks. There are firework crates along the bridge too.
- Jump the **whip crack** and the **sweep**, and step out from under the red warning circles.

When it falls: "YOU SHALL NOT PASS!", the fire wall goes out and the gate at the end opens.

### How the places are built

Minas Tirith's levels are curved ramparts (rings). Hobbiton and Weathertop are open levels (`roam: true`): one big field with the camera behind Gandalf, laid out by `hobbitonLayout()` and `weathertopLayout()`; `nazgul` lists where the Nazgûl start and `duel: true` turns on the lightsaber duel. Every other place is the same kind of track unrolled into a straight road (`straight: true`), with its landmark ahead past the gate at the end. Each place sits far out in the world so they never see each other. In the code:

- `LEVELS` has one entry per level. `loc` ties it to a map stop and `theme` picks its look. `floors`, `pillars`, `bars`, `dz` (fell beasts) and `balrogs` lay it out. `webs` are sticky webs to jump, `shelob` sets where the chase starts and ends, `lava` makes the lava rise, and `endY` raises the last gate to the top of a climb. A fourth number on a floor narrows it into a bridge, `open` leaves a gap in the inner wall, and `gateS` puts a fire wall across the road until the boss dies.
- `THEMES` holds each place's textures, sky colours, fog, lights, enemy colours, edge and wall decoration, and the scenery around the ring.
- `NODES` (in the `WORLD MAP` section) lists the map stops.

## Your own models and textures

You can swap characters and surfaces for your own files, for example ones taken from BFME2: put a `.glb` in [`models/`](models/) (`balrog.glb`, `witchking.glb`, `shelob.glb`, `nazgul.glb`, `orc.glb`, `gandalf.glb`) or a picture in [`textures/`](textures/) (`grass.png`, `rock.png`, `path.png` and more). They're used when you play through `serve.cmd`, and both folders are ignored by git, so they never reach GitHub or the public site. The README in each folder lists the names and explains how to get a model out of BFME2 with FinalBIG and Blender.

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
