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
| Edoras | **Edoras** | Up the hill to Meduseld. The road runs in through the gate in the palisade and winds round and up the hill past the longhouses to the Golden Hall. Four squares on the way lock behind a golden barrier while the **Uruk-hai** come over the walls in waves. **Lurtz** comes with the last wave at the top. Win it and **Théoden** comes out onto the steps; go to him to finish. You fight the **Kingdom Hearts II** way (see below). |
| Helm's Deep | **Helm's Deep** | A Kingdom Hearts level, at night in a storm, with Saruman's army filling the coomb below with torches. You fight your way down through the Hornburg: the Great Hall's court under its tower, a bastion on the wall-walk, the court inside the gate, then out through the broken gate and down the causeway, with two fights on the way. Each place locks behind a golden barrier while wave after wave of **orcs**, **Uruk-hai** and **berserkers** come over the walls and up the ladders. At the bottom, fire glows in the culvert of the Deeping Wall, and out of it crawls **a Balrog**: a boss fight the Kingdom Hearts II way (see below). |
| Isengard | **Isengard** | A Kingdom Hearts level like Helm's Deep, under a smoky dusk. From the plain at the foot of **Orthanc**, past fire pits, forges and warg pits, up the great stair to its doors and inside. A spiral stair winds up round a great pillar in the middle of the tower: gothic and ceremonial, black stone, candles all the way up, **White Hand** banners on the walls and the Hand inlaid in the floors. The camera rides behind you looking on up the stair, as on Kingdom Hearts II's Wayward Stairs. On two landings you fight **orcs**, **Uruk-hai**, **berserkers** and **wargs** (Lurtz comes too). At the top of the stair an archway of light takes you out onto the top of the tower, between Orthanc's four horns: **Saruman** (below). |
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

### Fighting in Edoras and Helm's Deep (the Kingdom Hearts II way)

Kingdom Hearts II's controls:

| Key (controller) | What it does |
| --- | --- |
| **W A S D** (left stick) | Move. Double-tap W for Battle Charge (a technique). |
| **K** (A) | Does the command the cursor is on in the **command menu** (bottom left). On **ATTACK** it attacks: three cuts and a finisher, each closing in on the nearest enemy, the finisher knocking it flying. In the air it's an air combo, and the last blow slams Gandalf down. On **MAGIC**, **ITEMS** or **DRIVE** it opens that list, and K again uses what's chosen there. |
| **Q** / **E** (d-pad ▲ ▼) | Move the cursor up and down the menu, or the list that's open (the arrow keys and mouse wheel do too). **L**, **Backspace** or **←** backs out of a list. After you use a spell or an item from a list, the cursor goes back to ATTACK. |
| **F** / **H** | Cast the two shortcut powers straight away (Thunder and Fire to start with). |
| **Tab** | The **powers menu** (below): choose which powers are on F and H, and the five in MAGIC. |
| **L** (B) | Jump. Double-tap in the air for Force Jump (a technique). |
| **J** (RT) | **Dodge Roll**: the way you're pushing, or straight back. Nothing touches you while you roll. |
| **Space** (X) | Guard: blocks a blow from in front and knocks the attacker back. With a direction held it rolls instead. || **I** (Y), or the green prompt | The **reaction command**, when its moment comes. **TAKEDOWN**: an enemy is dizzy (stars over its head), so leap on it and finish it, blasting the others round it. **REPEL**: a berserker is running at you; swat it back to blow up among its friends. Against the Balrog: **SWORD RUN** and **YOU SHALL NOT PASS!** (below). |
| **Left Shift** / **/** (LB / RB) | Turn the camera left and right. |
- **Powers:** press **Tab** for the powers menu (the game pauses). It has two pages, **MAGIC** and **TECHNIQUES**: **Q**/**E** turns between them, **A**/**D** moves between the three games' columns, **W**/**S** up and down (or click). Your choices are remembered.
  - **Magic**, on the F and H shortcuts and in the five places of the MAGIC list (on that page, **F** or **H** puts the chosen spell on that shortcut, **1**–**5** in that place in MAGIC). Lightning and healing are Kingdom Hearts II's own Thunder and Cure:
    - **Kingdom Hearts II:** Fire, Blizzard (freezes), Thunder, Cure, Magnet (pulls foes in and holds them up), Reflect (throws blows back).
    - **Jedi Outcast:** Force Push, Pull, Grip, Mind Trick (leaves foes dazed, ready for TAKEDOWN), Speed (everything else slows), Saber Throw.
    - **Fable:** Fireball, Enflame, Force Push, Slow Time, Turncoat (a foe fights for you), Drain Life, and The Lost Chapters' ultimates, **Divine Fury** (pillars of holy light on every foe near) and **Infernal Wrath** (hell bursts up round you).
  - **Techniques**, switched on or off with **K**. They cost MP while they work: Battle Charge, Force Jump and Assassin Rush each time you use them, the rest a little every second (with no MP they stop until it comes back).
    - **Kingdom Hearts II:** Combo Plus (one more blow in the ground combo), Second Chance (a blow that would finish you leaves 1 HP).
    - **Jedi Outcast:** Force Jump (**double-tap L**: a great second leap in the air), Force Sight (more harm).
    - **Fable:** Battle Charge (**double-tap W**: charge through foes), Assassin Rush (darts to a far foe as you attack), Multi-Strike, Berserk, Physical Shield (builds back up), Ghost Sword.

  MP is the blue bar, and it slowly comes back by itself. The White Wizard's powers cost less and hit harder.
- **Summon crates** (a spirit's face, on every other landing): break one and a guardian spirit floats beside Gandalf, striking at foes near him. If a blow would finish him, the spirit gives its life for his instead: a spare life. Another Summon crate while you have one fills your MP.- **Items:**
  - **Potion:** gives back HP.
  - **Ether:** gives back MP.
  
  You start each level with four Potions and two Ethers.
- **Drive:** when the yellow drive bar is full (every blow fills it), choose **WHITE WIZARD**. Gandalf becomes Gandalf the White for about twenty seconds: Battle for Middle-earth's own when `models/gandalfw.glb` is there. He gets a combo of five, harder blows, quicker MP, and stronger, cheaper powers, and he glows white.
- **On a phone:** ATTACK attacks, MAGIC casts the last spell, and GUARD and DRIVE do what they say.
- The Uruk-hai fight like Soldier Heartless. They circle you, hopping and strafing, and only two come at you at once. Each one sets itself before it strikes, eyes flaring red:
  - a two-cut combo up close
  - a leaping spin-slash from further off
  - a charge behind its shield from further still
- **Lurtz** shrugs off light blows. Knock him down with finishers, magic or a takedown.
- Your HP is the green bar. Beaten enemies drop green orbs (HP), blue orbs (MP) and apples. MP also comes back slowly by itself.
- At Helm's Deep, **orcs** are the Shadows: small, quick and many, and three may come at you at once. **Berserkers** carry a torch: one roars, then runs at you and blows up, hurting anything near it, its own side too. Knock one flying and it goes off where it lands, or REPEL it back into its friends.

#### The Balrog

Its gauge (top right) has four bars, green, yellow, orange and red; the diamonds under it count the bars still to go. Every big blow is marked on the ground in red before it lands.

| It does | What to do |
| --- | --- |
| **Whip lash**: a red wedge in front, then the whip sweeps across it low | Jump it, guard it, or get behind |
| **Sword slam**: a red circle follows you, then the sword comes down on it, and a ring of fire rolls out | Get off the circle, then jump the ring. The sword sticks in the ground: **SWORD RUN** takes Gandalf up its arm for three blows on its head |
| **Fire breath**: it rears back, then sweeps a cone of fire | Get beside or behind it (guarding doesn't stop fire) |
| **Leap**: onto a red circle where you are | Roll off the circle |
| **Wings** (once it blazes up): it takes to the air, drops fireballs on red circles round you, then dives onto a big red circle | Keep moving, then roll clear of the dive |
| Half its gauge gone, it **blazes up** and calls orcs and a berserker | |
| **Rain of fire**: fireballs fall on red circles round you | Keep moving |
| **Charge** across the arena | Stand in its way and press **YOU SHALL NOT PASS!**: it crashes into Gandalf's light and falls to its knees, open to everything you have |
| Hit it too much at once and it **bursts free** in a ring of fire (Kingdom Hearts II's revenge value) | Back off when it flashes |

The Balrog is Battle for Middle-earth's own when `models/balrog.glb` is there, and burns with Battle for Middle-earth's own fire when `fx/` has it (see its README).

#### Saruman

A boss of four bars on the top of Orthanc. He keeps his distance and casts:

| He does | What to do |
| --- | --- |
| **Lightning** on red circles round you | Keep moving |
| **Three fireballs** that hunt you | Guard just as one reaches you, and it flies back and hits him |
| **A blast** from his staff all round him (a red circle), rolling out as a ring | Get clear, then jump the ring |
| **Force Push** across a red wedge | Get out of the wedge |
| **Vanishes** in smoke and comes back somewhere else | |
| Half his gauge gone: **a storm of lightning**, **a beam of lightning** sweeping after you, and he **calls his Uruk-hai and wargs** | Guard holds the beam off. Press **WIZARDS' DUEL** to break it and throw him down |
| Nearly beaten and knocked down | **BREAK HIS STAFF** finishes him |

A finisher staggers him, and too many blows at once make him burst free. Saruman and the wargs are Battle for Middle-earth's own when `models/saruman.glb` and `models/warg.glb` are there.
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
