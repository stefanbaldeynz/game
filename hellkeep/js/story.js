// The story: a chapter for each round, with a picture, shown on the menu before you play.
// Read in order they tell the whole tale: ride into hell, climb down to the fortress,
// fight through the frozen forest and the Balrog, storm the keep, then hold it.
// The pictures are drawn in SVG (320 x 180) right here, so there are no image files.

const STORY = {
  1: {
    chapter: 'Chapter 1 · Hell Ride',
    text: 'The Devil has stolen the souls of the fallen and locked them in the Hellkeep, his fortress at the bottom of hell. Heaven sent one soldier after them, with a pair of angel wings and a shotgun loaded with holy fire. The road down starts at the edge of a sea of lava. Ride across it to the Soul Gem on the far shore: it opens the way down.',
    art: `
      <defs>
        <linearGradient id="s1sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#120101"/><stop offset="0.55" stop-color="#5a0c04"/><stop offset="1" stop-color="#ff6a1a"/>
        </linearGradient>
        <linearGradient id="s1lava" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffb030"/><stop offset="0.3" stop-color="#ff5a10"/><stop offset="1" stop-color="#8a1a02"/>
        </linearGradient>
        <linearGradient id="s1beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#fff4c0" stop-opacity="0.75"/><stop offset="1" stop-color="#fff4c0" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="s1gem"><stop offset="0" stop-color="#fff"/><stop offset="0.3" stop-color="#ff4a3a"/><stop offset="1" stop-color="#ff4a3a" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="320" height="180" fill="url(#s1sky)"/>
      <path d="M0 112 L30 84 L52 100 L80 70 L108 104 L130 92 L150 112 Z" fill="#2a0604"/>
      <path d="M222 112 V78 h8 v-10 h6 v10 h10 V60 l6 -10 l6 10 v18 h12 V70 h6 v-8 h6 v8 h8 v42 Z" fill="#1a0302"/>
      <g fill="#ffa040"><rect x="250" y="72" width="2" height="4"/><rect x="262" y="66" width="2" height="4"/><rect x="276" y="82" width="2" height="4"/></g>
      <circle cx="300" cy="106" r="16" fill="url(#s1gem)"/>
      <path d="M300 99 l5 7 l-5 7 l-5 -7 Z" fill="#ff8a7a"/>
      <rect y="110" width="320" height="70" fill="url(#s1lava)"/>
      <g fill="#3a0802" opacity="0.85">
        <path d="M0 128 q40 -6 80 0 t80 0 t80 0 t80 0 v6 q-40 6 -80 0 t-80 0 t-80 0 t-80 0 Z"/>
        <path d="M0 152 q50 -8 100 0 t100 0 t120 0 v8 q-60 8 -120 0 t-100 0 t-100 0 Z"/>
      </g>
      <path d="M20 180 L40 146 L96 140 L120 180 Z" fill="#1e0603"/>
      <path d="M176 180 L196 150 L250 146 L268 180 Z" fill="#1e0603"/>
      <polygon points="126,118 230,96 230,140" fill="url(#s1beam)"/>
      <g transform="translate(118 124) rotate(-12)">
        <path d="M-6 -16 C-34 -40 -58 -36 -70 -22 C-52 -26 -40 -18 -30 -10 C-46 -12 -56 -2 -60 6 C-42 -2 -24 -4 -6 -6 Z" fill="#ffe6a8" opacity="0.95"/>
        <circle cx="-14" cy="6" r="9" fill="none" stroke="#120202" stroke-width="4"/>
        <circle cx="16" cy="6" r="9" fill="none" stroke="#120202" stroke-width="4"/>
        <path d="M-14 6 L-2 -4 L12 -4 L16 6 M4 -4 L10 -12" stroke="#120202" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M-6 -6 L-2 -22 L6 -22 L8 -6 Z" fill="#120202"/>
        <circle cx="2" cy="-27" r="5" fill="#120202"/>
        <path d="M6 -16 L22 -14" stroke="#120202" stroke-width="3"/>
      </g>
      <g fill="#ffd27a"><circle cx="60" cy="60" r="1.2"/><circle cx="150" cy="40" r="1"/><circle cx="196" cy="74" r="1.3"/><circle cx="96" cy="88" r="1"/><circle cx="240" cy="30" r="1"/></g>`,
  },
  2: {
    chapter: 'Chapter 2 · The Brimstone Gorge',
    text: 'The Soul Gem burns open a crack in the rock: a gorge that falls all the way down to the bottom of hell. Hellhounds circle in the smoke, spitting fire, and lightning elephants hold the ledges. Climb down to the second Soul Gem. Far below, through the smoke, you can see the walls of the Devil\'s fortress.',
    art: `
      <defs>
        <linearGradient id="s2air" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3a0804"/><stop offset="0.7" stop-color="#a0300a"/><stop offset="1" stop-color="#ff7a20"/>
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#s2air)"/>
      <path d="M120 180 V150 h10 v-8 h8 v8 h12 v-14 l6 -8 l6 8 v14 h12 v-8 h8 v8 h10 v30 Z" fill="#1a0302"/>
      <path d="M150 180 v-14 a10 10 0 0 1 20 0 v14 Z" fill="#ffb040"/>
      <g fill="#ffa040"><rect x="141" y="150" width="2" height="4"/><rect x="179" y="150" width="2" height="4"/></g>
      <path d="M0 0 H96 L84 30 L104 52 L82 70 L100 96 L78 120 L96 150 L74 180 H0 Z" fill="#1c0503"/>
      <path d="M320 0 H222 L238 34 L214 58 L240 80 L220 108 L244 134 L226 180 H320 Z" fill="#1c0503"/>
      <g stroke="#ff6a10" stroke-width="1.5" fill="none" opacity="0.9">
        <path d="M30 20 l10 14 l-6 12 l12 16"/><path d="M60 100 l-8 14 l10 10"/><path d="M270 40 l-10 12 l8 14"/><path d="M290 120 l-12 10 l6 16"/>
      </g>
      <path d="M100 96 h34 v5 h-36 Z" fill="#2a0804"/>
      <g transform="translate(108 80)" fill="#0e0202">
        <path d="M0 16 q0 -16 14 -16 h6 q8 0 10 10 l6 2 v5 h-6 v-1 h-2 v6 h-4 v-6 h-10 v6 h-4 v-6 h-4 v6 h-4 Z"/>
        <path d="M30 10 q8 4 6 14" stroke="#0e0202" stroke-width="2" fill="none"/>
      </g>
      <path d="M128 70 l6 8 l-5 2 l7 9" stroke="#bfefff" stroke-width="1.8" fill="none"/>
      <g transform="translate(216 46) rotate(14)">
        <path d="M-30 4 q-14 -2 -26 4 q12 2 18 8 q-12 0 -22 8 q16 -2 30 -6" fill="#ff8a20" opacity="0.8"/>
        <path d="M0 8 q-4 -10 6 -12 l10 -2 l6 -6 l2 6 l6 2 l-4 4 q-2 10 -10 10 h-12 Z" fill="#0e0202"/>
        <path d="M2 0 q-10 -14 -26 -12 q12 4 16 10 Z" fill="#0e0202"/>
        <circle cx="22" cy="0" r="1.4" fill="#ffd040"/>
      </g>
      <g transform="translate(150 26)">
        <path d="M-2 4 C-22 -10 -38 -6 -44 4 C-32 2 -22 6 -14 12 C-26 12 -32 20 -34 26 C-22 18 -10 16 -2 14 Z" fill="#ffe6a8"/>
        <path d="M2 4 C22 -10 38 -6 44 4 C32 2 22 6 14 12 C26 12 32 20 34 26 C22 18 10 16 2 14 Z" fill="#ffe6a8"/>
        <path d="M-5 2 L5 2 L6 20 L2 34 L-2 34 L-6 20 Z" fill="#160303"/>
        <circle cx="0" cy="-3" r="5" fill="#160303"/>
      </g>
      <g fill="#ffd27a"><circle cx="120" cy="40" r="1"/><circle cx="196" cy="110" r="1.2"/><circle cx="170" cy="70" r="1"/><circle cx="140" cy="126" r="1.3"/></g>`,
  },
  3: {
    chapter: 'Chapter 3 · The Frozen Depths',
    text: 'At the very bottom of hell it isn\'t hot. It\'s cold. A dead forest, frozen in blue fire, leads to the fortress gates, and beyond them the courtyard, where ice elephants guard the keep. And something older waits at the great door of the keep: a Balrog, a demon of shadow and flame from the deep places of the world.',
    art: `
      <defs>
        <linearGradient id="s3sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#01040e"/><stop offset="0.6" stop-color="#0c2a4e"/><stop offset="1" stop-color="#4aa0d8"/>
        </linearGradient>
        <linearGradient id="s3snow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#9fc4e0"/><stop offset="1" stop-color="#e8f4fc"/>
        </linearGradient>
        <radialGradient id="s3fire" cx="0.5" cy="0.6"><stop offset="0" stop-color="#ffd070"/><stop offset="0.35" stop-color="#ff6a10"/><stop offset="1" stop-color="#ff3a00" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="320" height="180" fill="url(#s3sky)"/>
      <path d="M96 128 V44 h10 v-6 h8 v6 h10 V24 l8 -12 l8 12 v20 h12 V30 l10 -14 l10 14 v14 h12 v-6 h8 v6 h10 v84 Z" fill="#0a1626"/>
      <g fill="#7fd8ff"><rect x="126" y="56" width="3" height="7"/><rect x="146" y="40" width="3" height="7"/><rect x="176" y="50" width="3" height="7"/><rect x="196" y="60" width="3" height="7"/></g>
      <rect x="60" y="96" width="200" height="34" fill="#13243a"/>
      <g fill="#13243a"><rect x="60" y="90" width="8" height="6"/><rect x="76" y="90" width="8" height="6"/><rect x="92" y="90" width="8" height="6"/><rect x="220" y="90" width="8" height="6"/><rect x="236" y="90" width="8" height="6"/><rect x="252" y="90" width="8" height="6"/></g>
      <path d="M134 130 V108 a26 26 0 0 1 52 0 V130 Z" fill="#05080e"/>
      <ellipse cx="160" cy="98" rx="46" ry="38" fill="url(#s3fire)" opacity="0.55"/>
      <path d="M160 66 C130 50 104 54 92 70 C112 66 124 72 132 80 C116 80 106 90 104 100 C120 92 136 90 150 92 Z" fill="#120404"/>
      <path d="M160 66 C190 50 216 54 228 70 C208 66 196 72 188 80 C204 80 214 90 216 100 C200 92 184 90 170 92 Z" fill="#120404"/>
      <path d="M148 128 L150 100 Q146 86 152 78 L156 70 Q160 66 164 70 L168 78 Q174 86 170 100 L172 128 Z" fill="#160606"/>
      <path d="M154 70 q-12 -10 -10 -22 q4 8 12 12 Z M166 70 q12 -10 10 -22 q-4 8 -12 12 Z" fill="#2a1a10"/>
      <g fill="#ffd040"><circle cx="156.5" cy="72" r="1.2"/><circle cx="163.5" cy="72" r="1.2"/></g>
      <path d="M172 96 L196 70" stroke="#ffd080" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M148 98 q-20 10 -16 22 q4 10 -12 14 q-14 4 -8 10" stroke="#ff7a20" stroke-width="2" fill="none"/>
      <g fill="#ff8a20" opacity="0.8"><circle cx="154" cy="62" r="2"/><circle cx="166" cy="60" r="2.4"/><circle cx="160" cy="56" r="1.6"/></g>
      <path d="M0 132 Q80 120 160 130 T320 128 V180 H0 Z" fill="url(#s3snow)"/>
      <g transform="translate(222 132)" fill="#2a5a88">
        <path d="M0 0 q0 -16 18 -16 h8 q10 0 12 10 q6 2 6 14 l-4 0 l-2 -8 v8 h-6 v-6 h-14 v6 h-6 v-6 h-6 v6 h-6 Z"/>
        <path d="M38 -6 q8 6 4 16" stroke="#2a5a88" stroke-width="3" fill="none"/>
      </g>
      <g stroke="#0a1626" stroke-linecap="round" fill="none">
        <path d="M24 180 V64 M24 110 l-16 -14 M24 96 l14 -16 M24 80 l-10 -14 M38 80 l8 -4 M8 96 l-6 -8" stroke-width="5"/>
        <path d="M290 180 V54 M290 104 l18 -16 M290 88 l-14 -14 M290 72 l10 -14 M276 74 l-8 -4" stroke-width="5"/>
        <path d="M60 180 V96 M60 120 l-10 -8 M60 108 l9 -10" stroke-width="3"/>
      </g>
      <g fill="#fff" opacity="0.8"><circle cx="40" cy="30" r="1"/><circle cx="90" cy="60" r="0.8"/><circle cx="240" cy="40" r="1"/><circle cx="270" cy="100" r="0.8"/><circle cx="120" cy="20" r="0.8"/></g>`,
  },
  4: {
    chapter: 'Chapter 4 · The Burning Keep',
    text: 'The Balrog has fallen, and the great door of the keep stands open. Inside, the halls burn, and the Devil\'s hellhounds hunt in packs. At the far end of the great hall the Devil himself waits on his throne, his guitar in his hands. Kill him, and the stolen souls go free.',
    art: `
      <defs>
        <radialGradient id="s4glow" cx="0.5" cy="0.45"><stop offset="0" stop-color="#ff8a30"/><stop offset="0.5" stop-color="#7a1a06"/><stop offset="1" stop-color="#140202"/></radialGradient>
      </defs>
      <rect width="320" height="180" fill="url(#s4glow)"/>
      <path d="M0 180 L130 104 H190 L320 180 Z" fill="#2a0c06"/>
      <g stroke="#3a1408" stroke-width="1"><path d="M160 104 V180 M140 104 L80 180 M180 104 L240 180 M120 104 L10 170 M200 104 L310 170"/><path d="M118 116 H202 M96 130 H224 M60 150 H260"/></g>
      <g fill="#160404">
        <path d="M0 0 H40 V180 H0 Z"/><path d="M280 0 H320 V180 H280 Z"/>
        <path d="M60 10 H84 V154 H60 Z"/><path d="M236 10 H260 V154 H236 Z"/>
        <path d="M98 30 H112 V128 H98 Z"/><path d="M208 30 H222 V128 H208 Z"/>
      </g>
      <g fill="#8a0a08"><path d="M64 20 H80 V64 L72 56 L64 64 Z"/><path d="M240 20 H256 V64 L248 56 L240 64 Z"/><path d="M100 40 H110 V70 L105 66 L100 70 Z"/><path d="M210 40 H220 V70 L215 66 L210 70 Z"/></g>
      <path d="M140 104 V60 H180 V104 Z" fill="#220606"/>
      <path d="M134 108 H186 V102 H134 Z" fill="#2a0a06"/>
      <path d="M144 60 l-6 -16 l10 10 Z M176 60 l6 -16 l-10 10 Z" fill="#c8a040"/>
      <path d="M150 100 L152 80 Q150 72 156 68 Q160 64 164 68 Q170 72 168 80 L170 100 Z" fill="#0c0202"/>
      <path d="M155 66 q-8 -6 -6 -14 q3 6 8 9 Z M165 66 q8 -6 6 -14 q-3 6 -8 9 Z" fill="#0c0202"/>
      <path d="M150 86 L162 80 L176 92 L172 94 L162 86 L156 92 Z" fill="#0c0202"/>
      <g fill="#ffd040"><circle cx="158" cy="70" r="0.9"/><circle cx="162" cy="70" r="0.9"/></g>
      <g fill="#ff3a1a"><circle cx="70" cy="166" r="1.6"/><circle cx="76" cy="166" r="1.6"/><circle cx="244" cy="160" r="1.6"/><circle cx="250" cy="160" r="1.6"/><circle cx="118" cy="140" r="1.2"/><circle cx="123" cy="140" r="1.2"/></g>
      <g><rect x="122" y="96" width="8" height="10" fill="#1a0604"/><ellipse cx="126" cy="94" rx="6" ry="3" fill="#ffb040"/><rect x="190" y="96" width="8" height="10" fill="#1a0604"/><ellipse cx="194" cy="94" rx="6" ry="3" fill="#ffb040"/></g>
      <g fill="#ffd27a"><circle cx="128" cy="84" r="1"/><circle cx="192" cy="80" r="1.2"/><circle cx="160" cy="40" r="1"/></g>`,
  },
  5: {
    chapter: 'Chapter 5 · The Hellgate Siege',
    text: 'The Devil is dead and the keep is yours. But hell isn\'t finished. Its armies are pouring back in through the fortress gates to take the keep back: hellhounds first, then the elephants, then the last of the devils. Build fire towers in the courtyard, grab your rifle, and hold the keep until the souls have flown home.',
    art: `
      <defs>
        <linearGradient id="s5sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#160202"/><stop offset="0.6" stop-color="#6a1406"/><stop offset="1" stop-color="#d04a10"/>
        </linearGradient>
        <radialGradient id="s5gate"><stop offset="0" stop-color="#ffe080"/><stop offset="0.4" stop-color="#ff6a10"/><stop offset="1" stop-color="#ff3a00" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="320" height="180" fill="url(#s5sky)"/>
      <path d="M0 84 H320 V180 H0 Z" fill="#2a0c08"/>
      <path d="M0 80 H320 V90 H0 Z" fill="#1a0604"/>
      <g fill="#1a0604"><rect x="4" y="74" width="8" height="6"/><rect x="20" y="74" width="8" height="6"/><rect x="36" y="74" width="8" height="6"/><rect x="276" y="74" width="8" height="6"/><rect x="292" y="74" width="8" height="6"/><rect x="308" y="74" width="8" height="6"/></g>
      <path d="M44 90 V54 h-6 V44 h30 v10 h-6 V90 Z M90 90 V54 h-6 V44 h30 v10 h-6 V90 Z" fill="#160404"/>
      <circle cx="76" cy="78" r="26" fill="url(#s5gate)"/>
      <path d="M64 90 V76 a12 12 0 0 1 24 0 V90 Z" fill="#ffd070"/>
      <path d="M76 92 C110 110 150 112 190 124 S270 150 300 180" stroke="#140404" stroke-width="18" fill="none"/>
      <g fill="#0c0202">
        <path d="M96 100 q0 -6 6 -6 h4 l3 -3 l1 4 v6 h-14 Z"/><path d="M116 106 q0 -6 6 -6 h4 l3 -3 l1 4 v6 h-14 Z"/>
        <path d="M140 108 q0 -12 14 -12 h8 q8 0 9 8 v10 h-4 v-6 h-18 v6 h-4 v-6 h-5 Z"/>
        <path d="M182 118 l2 -14 q4 -6 8 0 l2 14 Z M186 104 l-3 -6 M190 104 l3 -6" stroke="#0c0202" stroke-width="1.5"/>
      </g>
      <g fill="#ff3a1a"><circle cx="104" cy="96" r="0.9"/><circle cx="124" cy="102" r="0.9"/><circle cx="166" cy="100" r="1"/><circle cx="188" cy="106" r="0.9"/><circle cx="192" cy="106" r="0.9"/></g>
      <g><path d="M120 140 v-16 h8 v16 Z M220 128 v-16 h8 v16 Z M60 132 v-16 h8 v16 Z" fill="#1a0604"/><circle cx="124" cy="121" r="3.5" fill="#ffb040"/><circle cx="224" cy="109" r="3.5" fill="#ffd040"/><circle cx="64" cy="113" r="3.5" fill="#60e0ff"/></g>
      <path d="M232 90 V30 h8 v-8 h6 v8 h14 V10 l10 -10 l10 10 v20 h14 v-8 h6 v8 h8 V90 Z" fill="#100202"/>
      <g fill="#ffa040"><rect x="252" y="44" width="3" height="7"/><rect x="268" y="30" width="3" height="7"/><rect x="284" y="44" width="3" height="7"/><rect x="268" y="56" width="3" height="7"/></g>
      <g fill="#fff4e0" opacity="0.85"><circle cx="262" cy="16" r="1.6"/><circle cx="276" cy="8" r="1.2"/><circle cx="250" cy="26" r="1.2"/><circle cx="290" cy="20" r="1.4"/></g>
      <path d="M0 180 V160 h14 v-8 h12 v8 h16 v-8 h12 v8 h16 v-8 h12 v8 h16 v-8 h12 v8 h16 v-8 h12 v8 h16 v-8 h12 v8 h16 v-8 h12 v8 h16 v-8 h12 v8 h16 v-8 h12 v8 h14 v20 Z" fill="#0c0202"/>`,
  },
};

// Put a round's chapter on the menu (above the round picker) when the page opens.
function showStory(n) {
  const box = document.getElementById('story');
  const story = STORY[n];
  if (!box || !story) return;
  box.innerHTML = `
    <svg viewBox="0 0 320 180" role="img" aria-label="${story.chapter}">${story.art}</svg>
    <div class="story-text">
      <div class="chapter">${story.chapter}</div>
      <p>${story.text}</p>
    </div>`;
  box.classList.remove('hidden');
  document.getElementById('overlay').classList.add('with-story');
}

// Take the story off the menu (when it shows something else: paused, died, round complete).
function hideStory() {
  const box = document.getElementById('story');
  if (box) box.classList.add('hidden');
  document.getElementById('overlay').classList.remove('with-story');
}

(() => {
  const page = currentPage();
  const first = ROUND_LIST.find((r) => r.page === page);
  const round = ROUND_LIST.find((r) => r.n === roundFromHash() && r.page === page) || first;
  if (round) showStory(round.n);
})();
