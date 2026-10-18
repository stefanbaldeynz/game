// Every round in Hellkeep, and the round picker on the menu screens.
// The story runs in order: ride into hell (1), climb down the gorge to the fortress (2),
// fight through the frozen forest and courtyard (3), storm the keep (4), then hold it (5).
// Rounds 1 and 2 are side-on platform rounds (side.html), 3 and 4 the 3D shooter
// (index.html), and 5 is tower defence with a first-person mode (defense.html).
// This file is loaded by every page.

const ROUND_LIST = [
  { n: 1, title: 'Hell Ride', page: 'side.html' },
  { n: 2, title: 'The Brimstone Gorge', page: 'side.html' },
  { n: 3, title: 'The Frozen Depths', page: 'index.html' },
  { n: 4, title: 'The Burning Keep', page: 'index.html' },
  { n: 5, title: 'The Hellgate Siege', page: 'defense.html' },
];
const TOTAL_ROUNDS = ROUND_LIST.length;

function currentPage() {
  const file = location.pathname.split('/').pop();
  return file === '' ? 'index.html' : file;
}

function roundFromHash() {
  return Number(new URLSearchParams(location.hash.slice(1)).get('round')) || 0;
}

// Go to a round: on this page just reload with the new round, otherwise open
// the other page.
function goToRound(n) {
  const round = ROUND_LIST.find((r) => r.n === n) || ROUND_LIST[0];
  const hash = `#round=${round.n}`;
  if (round.page === currentPage()) {
    location.hash = hash;
    location.reload();
  } else {
    location.href = round.page + hash;
  }
}

// A row of buttons, one per round, for the menu screen. Clicking the round that's
// already loaded calls playCurrent (to start it straight away); any other round loads.
function buildRoundPicker(current, playCurrent) {
  const box = document.getElementById('round-picker');
  if (!box) return;
  // The game calls this once it's ready, so the play button can be used now.
  const play = document.getElementById('overlay-button');
  if (play && playCurrent) play.disabled = false;
  box.innerHTML = '<div class="label">Choose a round</div>';
  const row = document.createElement('div');
  row.className = 'round-buttons';
  for (const round of ROUND_LIST) {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<b>${round.n}</b> ${round.title}`;
    if (round.n === current) b.classList.add('current');
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (round.n === current && (!playCurrent || playCurrent())) return; // still loading, or started
      goToRound(round.n);
    });
    row.appendChild(b);
  }
  box.appendChild(row);
}

// A side-on round asked for on the 3D page (or the other way round): send it
// to the right page. Opening the game with no round (hellkeep/) starts at round 1.
(() => {
  const n = roundFromHash();
  const round = ROUND_LIST.find((r) => r.n === n) || (currentPage() === 'index.html' ? ROUND_LIST[0] : null);
  if (round && round.page !== currentPage()) {
    const params = new URLSearchParams(location.hash.slice(1)); // keeps dev options like &preview
    params.set('round', round.n);
    location.replace(`${round.page}#${params.toString().replace(/=(&|$)/g, '$1')}`);
  }
})();

// Show the menu straight away while the game builds its level in the background
// (that takes a few seconds): the round picker works at once, and the play button
// waits until the round is ready.
(() => {
  const page = currentPage();
  const first = ROUND_LIST.find((r) => r.page === page);
  const round = ROUND_LIST.find((r) => r.n === roundFromHash() && r.page === page) || first;
  if (!round) return;
  buildRoundPicker(round.n, null);
  const heading = document.getElementById('overlay-round');
  if (heading) heading.textContent = `Round ${round.n} · ${round.title}`;
  const text = document.getElementById('overlay-text');
  if (text && round !== first) text.textContent = ''; // the page's text is for its first round
  const play = document.getElementById('overlay-button');
  if (play) {
    play.textContent = `Loading round ${round.n}...`;
    play.disabled = true;
  }
})();
