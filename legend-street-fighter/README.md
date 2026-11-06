# The Legend Street Fighter

A one-player 16-bit beat-em-up in the browser. All the art and sound is made by the code, so there are no image or audio files.

## Modes

- **Fight:** any fighter against any fighter, on the stage you choose.
- **Fight all three:** go through the lads one by one, from London to Berlin to Ostrava. It starts on the Street Fighter, but you can pick anyone.
- **Practice:** a punchbag that doesn't fight back, with endless health and metal.

## Fighters

| Fighter | Build | Power-up (once a round) | Special |
| --- | --- | --- | --- |
| Wild Bill | Big and bulky | Cocaine: hyper speed, then a crash | **Willy Rage** under 30% health: heals, glows gold, hits harder, takes less |
| Kiwi Battler | Tall and lanky, longest reach | Whiskey: hits harder, takes less | Weak to Lenka and Czech Law |
| Baldric | Mid-size, all-rounder | Steak and beer: big heal, more power | Weak to IO Poster stars |
| The Street Fighter | Balanced | Street kebab: small heal, a little power | Weak to nothing |

## Controls

Keyboard: arrows or WASD to move, **J** punch, **K** kick, **L** block, **Esc** or **P** pause. Hold down to crouch, and block crouching to stop sweeps. Number keys **1 to 6** are shortcuts for the specials.

On a phone there's a stick under your left thumb (push firmly up to jump, firmly down to crouch), punch, kick, block and throw under your right, and a row of buttons for the specials that fade until you can use them. It plays best held sideways; held upright the picture sits at the top with the controls below it. The fight pauses itself if you leave the game.

On an iPhone, Safari can't go full screen, so tap Share, then **Add to Home Screen**. The switch on the side of an iPhone also silences the game's sound.

## Moves

Directions are relative to the way you're facing: → is towards the enemy. Metal is the meter at the bottom, and it fills as you hit and get hit.

| Move | Input | Metal | What it does |
| --- | --- | --- | --- |
| Glasgow Kiss | → + punch | | Headbutt |
| Uppercut | ↓ + punch | | Launches them |
| Sweep | ↓ + kick | | Knocks them down |
| Suplex | Block + punch, up close | | Goes through a block |
| Pub Brawler | Punch, punch, kick | | Combo: each hit has to land |
| IO Poster star | ↓ → punch (1) | 0 | ×2.5 on Baldric. Duck to dodge |
| Czech Law | ↓ → kick (2) | 25 | Flying paperwork. ×3 on Kiwi, and it ties him up |
| Summon Lenka | ↓ ↓ punch (3) | 50 | She chases them and self-destructs. ×3 and unblockable on Kiwi |
| Power-up | ↓ ↓ kick (4) | 0 | Your fighter's own vice |
| Stage Dive | → → kick (5) | 25 | Off the amps and onto their head |
| Guitar Blast | ← → punch (6) | 50 | Blast wave along the ground. Jump over it |
| Heavy Metal Combo | Land a dive, then ← → punch | Free | A bigger guitar blast that can't be blocked |

## Settings

Difficulty, rounds, round time, music, sound effects, announcer, blood and TV scanlines. They're saved in the browser.

## Code

| File | What's in it |
| --- | --- |
| `js/art.js` | Pixel drawing, the bitmap font, the heads and the props |
| `js/audio.js` | The FM synth, music, sound effects and announcer |
| `js/stages.js` | The three stages |
| `js/fight.js` | Fighters, moves, damage, Willy Rage, projectiles, the computer opponent, and drawing the fighters |
| `js/game.js` | Menus, screens, input and the main loop |

Open `test.html` through the server to run the rules and 48 AI-against-AI fights. Open `index.html?go=fight&p=bill&o=kiwi&s=ostrava&sim=200` to jump straight into a fight (`sim` fast-forwards that many ticks).
