// Every round in Hellkeep, and the round picker on the menu screens.
// Rounds 1 and 2 are the 3D shooter (index.html). Rounds 3 and 4 are side-on
// platform rounds (side.html). This file is loaded by both pages.

const ROUND_LIST = [
  { n: 1, title: 'The Burning Keep', page: 'index.html' },
  { n: 2, title: 'The Frozen Depths', page: 'index.html' },
  { n: 3, title: 'The Brimstone Gorge', page: 'side.html' },
  { n: 4, title: 'Hell Ride', page: 'side.html' },
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
      if (round.n === current && playCurrent && playCurrent()) return;
      goToRound(round.n);
    });
    row.appendChild(b);
  }
  box.appendChild(row);
}

// A side-on round asked for on the 3D page (or the other way round): send it
// to the right page.
(() => {
  const n = roundFromHash();
  const round = ROUND_LIST.find((r) => r.n === n);
  if (round && round.page !== currentPage()) location.replace(round.page + location.hash);
})();
