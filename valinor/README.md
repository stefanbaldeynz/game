# Valinor

A 3D platformer, in HD with sun shadows and glowing fire (or the original retro PS1 look: see The look), set on the walls of Minas Tirith. Three levels:

1. **The First Circle.** Ride Shadowfax through the burning city.
2. **The Second Circle.** Gandalf on foot along the second rampart.
3. **The Citadel.** Face Sauron beside the White Tree.

## The world map

The game opens on a map of Middle-earth. Gandalf walks freely across it. Walk him up to a place and a wooden sign names it. Every place is playable:

| Place | Level | What's there |
| --- | --- | --- |
| The Shire | **Hobbiton** (or **Oakvale**, if `levels/oakvale.json` is there: see its README) | Open country to roam freely, Spyro-style, on a golden afternoon. Hobbit holes in grassy hills round the edges and out in the middle, each with a round plank door, glowing round windows, a garden fence, flower boxes, a vegetable patch and a smoking chimney. Bag End at the top of the Hill under the great oak, up grassy banks with stone steps. The town with its thatched, timber-framed cottages, market and well; the Water with its stone bridge, lily pads, reeds and the mill; the Green Dragon across the bridge; and Bilbo's party with the Party Tree, bunting, the pavilion and fireworks. Oak trees, grass and wildflowers everywhere, and butterflies. **Nine Nazgûl** hunt through it: spin into them or hit them with fireworks (three hits each), and get out of the way when a sword goes up. Defeat all nine to finish. |
| Weathertop | **Weathertop** | A lightsaber duel with **the Witch-king** inside the ruined ring of Amon Sûl, fought the Jedi Outcast way: three stances (C, or tap STANCE: fast chains of quick cuts, medium, or slow heavy blows that smash through his guard), and the way you're moving when you swing picks the cut (overhead, left, right or upward). He parries, a parried swing knocks your blade back, a heavy blow can break a fast stance's guard, and blades that meet mid-swing lock. Blades glow and leave a smear of light as they swing; with your own models they're in the models' sword hands, and with `sabers/` filled they sound like Jedi Outcast's. |
| Rivendell | **Rivendell** (in a gorge from Fable, if `levels/rivendell.json` is there: see its README) | Open country to roam, like Hobbiton: a green valley under cliffs with waterfalls on every side. The Bruinen runs across it under an elven bridge; terraces climb to the Last Homely House; there's the Council ring, the shards of Narsil under a dome, a gazebo over Sam's garden, and a mallorn with a flet reached by stepping stones. **Find the other eight of the Fellowship** (each stands under a beam of light); everyone you find walks behind Gandalf, and when all eight are with him the Fellowship is formed. |
| Mirkwood | **Mirkwood** (on Tokara Forest from Unreal Tournament 2004, if `levels/mirkwood.json` is there: see its README) | A dark forest bowl under giant trees, old plank walkways high in their branches with ramps up to them, Morgul lanterns glowing green on chains, webs strung everywhere, egg sacs, and Dol Guldur's tower black on the rim. **Twelve spiders** hunt you on the forest floor and up on the walkways (they climb): spin into them or hit them with fireworks, two hits each. **Web springs** fling you up to the walkways. Slay them all to free Mirkwood. |
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

Minas Tirith's levels are curved ramparts (rings). Hobbiton, Rivendell, Mirkwood and Weathertop are open levels (`roam: true`): one big field with the camera behind Gandalf, laid out by `hobbitonLayout()`, `rivendellLayout()` and `weathertopLayout()`; `nazgul` lists where the Nazgûl start (or, with `hunt: 'spider'`, Mirkwood's spiders), the layout's `fellowship` lists who's waiting where in Rivendell and `duel: true` turns on the lightsaber duel. Every other place is the same kind of track unrolled into a straight road (`straight: true`), with its landmark ahead past the gate at the end. Each place sits far out in the world so they never see each other. In the code:

- `LEVELS` has one entry per level. `loc` ties it to a map stop and `theme` picks its look. `floors`, `pillars`, `bars`, `dz` (fell beasts) and `balrogs` lay it out. `webs` are sticky webs to jump, `shelob` sets where the chase starts and ends, `lava` makes the lava rise, and `endY` raises the last gate to the top of a climb. A fourth number on a floor narrows it into a bridge, `open` leaves a gap in the inner wall, and `gateS` puts a fire wall across the road until the boss dies.
- `THEMES` holds each place's textures, sky colours, fog, lights, enemy colours, edge and wall decoration, and the scenery around the ring.
- `NODES` (in the `WORLD MAP` section) lists the map stops.

## Your own models and textures

You can swap characters and surfaces for your own files, for example ones taken from BFME2: put a `.glb` in [`models/`](models/) (`balrog.glb`, `witchking.glb`, `shelob.glb`, `nazgul.glb`, `orc.glb`, `gandalf.glb`) or a picture in [`textures/`](textures/) (`grass.png`, `rock.png`, `path.png` and more). They're used when you play through `serve.cmd`, and both folders are ignored by git, so they never reach GitHub or the public site. The README in each folder lists the names and explains how to get a model out of BFME2 with FinalBIG and Blender.

## Pause menu

Resume, Restart, Quit (back to the Minas Tirith menu), Music, **Look** (HD or retro), and the two cheats: **Invincible** and **Unlimited rockets**. Cheat buttons light up when on. Keys G, Z and X toggle the look and the cheats too.

## The look

The game draws in **HD** by default: the screen's own resolution with anti-aliasing, shadows from the sun that follow Gandalf, and a glow on fire, lava, lanterns and anything bright (strong at night and underground, gentle by day). The **retro** look is the original PS1 style: a low-resolution picture with wobbly snapped vertices and dithered colour. G or the LOOK button in the pause menu switches between them, and the game remembers the choice.

## Testing shortcuts

The address can jump straight into a place: `?play=moria` (or `shire`, `riv`, `rohan`, `mt`, `ungol`, `mordor`, `doom`, `weather`). Add `&at=160` to start further along, `&sim=6` to play 6 seconds first (invincible), `&look=retro` or `&look=hd`, `&cam=s,x,y,ls,lx,ly` for a fixed camera, `&peek=x,y,z` to look at the Balrog, and `&info=1` to log how many draw calls a frame takes.

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
