// Touch controls shared by the games in the collection.
//
// On a phone or tablet this draws on-screen controls over the game and turns them
// into the same key presses the keyboard would make, so a game's own keyboard code
// keeps working unchanged. It does nothing on a computer without a touch screen.
//
//   TouchControls.setup({
//     stick: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', sprint: 'Shift' },
//     buttons: [{ label: 'Jump', key: ' ' }, { label: 'Punch', key: 'z' }],   // right thumb, first is biggest
//     top: [{ label: 'II', key: 'p' }],                                       // small buttons along the top
//     menu: () => state.mode !== 'playing',   // while true the controls hide and a tap presses menuKey
//     menuKey: 'Enter',                       // or a function returning the key
//     menuButtons: [{ label: '◀', key: 'ArrowLeft' }, { label: '▶', key: 'ArrowRight' }],
//     look: (dx, dy) => { ... },              // drags on the right half of the screen (first-person games)
//     hidden: () => false,                    // while true nothing is drawn and touches go to the page
//   });
//
// A button can also use onDown/onUp functions instead of a key, tap: true to send a quick
// press and release, and label/show functions that are checked every frame. Every option is optional.
// Buttons and the stick can change later with TouchControls.setButtons / setStick / setTop.

(function () {
  const IS_TOUCH = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 || 'ontouchstart' in window;

  // key -> the KeyboardEvent fields a game might read
  function keyInfo(name) {
    const special = {
      ' ': ['Space', 32], Enter: ['Enter', 13], Escape: ['Escape', 27], Shift: ['ShiftLeft', 16],
      Control: ['ControlLeft', 17], ArrowUp: ['ArrowUp', 38], ArrowDown: ['ArrowDown', 40],
      ArrowLeft: ['ArrowLeft', 37], ArrowRight: ['ArrowRight', 39],
    };
    if (special[name]) return { key: name, code: special[name][0], keyCode: special[name][1] };
    if (/^[0-9]$/.test(name)) return { key: name, code: 'Digit' + name, keyCode: 48 + Number(name) };
    return { key: name, code: 'Key' + name.toUpperCase(), keyCode: name.toUpperCase().charCodeAt(0) };
  }

  const held = {}; // key -> how many touch controls are holding it
  function send(type, name) {
    const info = keyInfo(name);
    const e = new KeyboardEvent(type, { key: info.key, code: info.code, bubbles: true, cancelable: true });
    Object.defineProperty(e, 'keyCode', { get: () => info.keyCode });
    Object.defineProperty(e, 'which', { get: () => info.keyCode });
    window.dispatchEvent(e);
  }
  function press(name) {
    held[name] = (held[name] || 0) + 1;
    if (held[name] === 1) send('keydown', name);
  }
  function release(name) {
    if (!held[name]) return;
    held[name] -= 1;
    if (held[name] === 0) send('keyup', name);
  }
  function tap(name) {
    press(name);
    setTimeout(() => release(name), 60);
  }
  function releaseAll() {
    for (const name in held) {
      if (held[name] > 0) {
        held[name] = 1;
        release(name);
      }
    }
  }

  const api = {
    isTouch: IS_TOUCH,
    press, release, tap, releaseAll,
    setup, setButtons, setStick, setTop,
    stick: { x: 0, y: 0 }, // the stick's position, -1..1 (y is up)
  };
  window.TouchControls = api;
  if (!IS_TOUCH) {
    for (const name of ['setup', 'setButtons', 'setStick', 'setTop']) api[name] = () => {};
    return;
  }
  document.documentElement.classList.add('touch-device');

  const CSS = `
    html.touch-device, html.touch-device body {
      touch-action: none; overscroll-behavior: none;
      -webkit-user-select: none; user-select: none;
      -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent;
    }
    html.touch-device .help, html.touch-device .keys-only { display: none !important; }
    html:not(.touch-device) .touch-only { display: none !important; }
    #tc { position: fixed; inset: 0; z-index: 50; display: none; font-family: system-ui, sans-serif; }
    #tc.on { display: block; }
    #tc .tc-stick {
      position: absolute; width: var(--sd); height: var(--sd); margin: calc(var(--sd) / -2) 0 0 calc(var(--sd) / -2);
      border-radius: 50%; border: 3px solid rgba(255,255,255,.4); background: rgba(0,0,0,.25);
      opacity: .5; transition: opacity .15s; pointer-events: none;
    }
    #tc .tc-stick.active { opacity: 1; }
    #tc .tc-stick i {
      position: absolute; left: 50%; top: 50%; width: 44%; height: 44%; margin: -22% 0 0 -22%; border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #fff, #c8d4ff 50%, #6a78b8); box-shadow: 0 2px 6px rgba(0,0,0,.5);
    }
    #tc .tc-btn {
      position: absolute; display: flex; align-items: center; justify-content: center; text-align: center;
      width: var(--bs); height: var(--bs); border-radius: 50%; box-sizing: border-box;
      border: 3px solid rgba(255,255,255,.55); background: rgba(20,24,40,.45); color: #fff;
      font-weight: 700; font-size: calc(var(--bs) * .22); line-height: 1.05; letter-spacing: .02em;
      text-shadow: 0 1px 2px #000; pointer-events: auto;
    }
    #tc .tc-btn.big { width: var(--bb); height: var(--bb); font-size: calc(var(--bb) * .2); }
    #tc .tc-btn.down { background: rgba(255,255,255,.4); transform: scale(.93); }
    #tc .tc-top {
      position: absolute; top: max(8px, env(safe-area-inset-top)); display: flex; gap: 8px; pointer-events: none;
    }
    #tc .tc-top.right { right: max(8px, env(safe-area-inset-right)); }
    #tc .tc-top.left { left: max(8px, env(safe-area-inset-left)); }
    #tc .tc-top .tc-btn {
      position: static; width: auto; min-width: 44px; height: 44px; padding: 0 12px; border-radius: 12px;
      font-size: 16px; border-width: 2px;
    }
    #tc .tc-menu-hint {
      position: absolute; left: 50%; bottom: max(14px, env(safe-area-inset-bottom)); transform: translateX(-50%);
      padding: 8px 18px; border-radius: 20px; background: rgba(0,0,0,.55); color: #fff; font-size: 16px;
      white-space: nowrap; pointer-events: none; animation: tc-pulse 1.6s ease-in-out infinite;
    }
    @keyframes tc-pulse { 50% { opacity: .55; } }
    #tc { --sd: clamp(100px, 26vmin, 150px); --bs: clamp(54px, 15vmin, 76px); --bb: clamp(70px, 21vmin, 100px); }
  `;

  let opts = {};
  let root, stickEl, knobEl, rightEl, topEl, menuEl, hintEl;
  const stick = { id: null, ox: 0, oy: 0, keys: new Set() };
  const look = { id: null, x: 0, y: 0 };
  let lastMenu = null;

  function make(tag, cls, parent, html) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html !== undefined) el.innerHTML = html;
    if (parent) parent.appendChild(el);
    return el;
  }

  function build() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    root = make('div', '', document.body);
    root.id = 'tc';
    stickEl = make('div', 'tc-stick', root);
    knobEl = make('i', '', stickEl);
    rightEl = make('div', '', root);
    topEl = make('div', 'tc-top right', root);
    menuEl = make('div', '', root);
    hintEl = make('div', 'tc-menu-hint', root, 'Tap to start');

    root.addEventListener('touchstart', onStart, { passive: false });
    root.addEventListener('touchmove', onMove, { passive: false });
    root.addEventListener('touchend', onEnd, { passive: false });
    root.addEventListener('touchcancel', onEnd, { passive: false });
    window.addEventListener('blur', resetAll);
    document.addEventListener('visibilitychange', () => document.hidden && resetAll());
    requestAnimationFrame(tick);
  }

  // Lay out the right-thumb buttons in an arc around the bottom-right corner.
  // Positions are [right, bottom] in multiples of the small button size.
  const ARC = [[0.35, 0.45], [1.75, 0.2], [0.2, 1.85], [1.55, 1.6], [3.0, 0.2], [0.2, 3.1]];

  function makeButton(def, parent) {
    const el = make('div', 'tc-btn' + (def.big ? ' big' : ''), parent);
    el.tcDef = def;
    allButtons.push(el);
    refreshButton(el);
    return el;
  }

  // A button's label and show options can be functions; they are checked every frame.
  let allButtons = [];
  function refreshButton(el) {
    const def = el.tcDef;
    const label = typeof def.label === 'function' ? def.label() : def.label;
    if (el.tcLabel !== label) el.innerHTML = el.tcLabel = label;
    if (def.show) {
      const show = !!def.show();
      if (el.tcShown !== show) {
        el.tcShown = show;
        el.style.display = show ? '' : 'none';
        if (!show && el.tcTouch != null) {
          buttonUp(el);
          delete touchButtons[el.tcTouch];
        }
      }
    }
  }

  function setButtons(list) {
    opts.buttons = list || [];
    if (!root) return;
    rightEl.innerHTML = '';
    opts.buttons.forEach((def, i) => {
      if (i === 0 && def.big === undefined) def = Object.assign({}, def, { big: true });
      const el = makeButton(def, rightEl);
      const [r, b] = def.pos || ARC[i] || [0, 0];
      el.style.right = `calc(max(10px, env(safe-area-inset-right)) + var(--bs) * ${r})`;
      el.style.bottom = `calc(max(12px, env(safe-area-inset-bottom)) + var(--bs) * ${b})`;
    });
  }

  function setTop(list, side) {
    opts.top = list || [];
    if (!root) return;
    topEl.innerHTML = '';
    topEl.className = 'tc-top ' + (side || opts.topSide || 'right');
    for (const def of opts.top) makeButton(def, topEl);
  }

  function setMenuButtons(list) {
    menuEl.innerHTML = '';
    (list || []).forEach((def, i) => {
      const el = makeButton(def, menuEl);
      const side = i === 0 ? 'left' : 'right';
      el.style[side] = `max(14px, env(safe-area-inset-${side}))`;
      el.style.top = '50%';
      el.style.marginTop = 'calc(var(--bs) / -2)';
    });
  }

  function setStick(def) {
    stickRelease();
    opts.stick = def;
    if (stickEl) stickEl.style.display = def ? '' : 'none';
    stickHome();
  }

  function stickHome() {
    if (!stickEl) return;
    stickEl.style.left = 'calc(max(14px, env(safe-area-inset-left)) + var(--sd) / 2 + 8px)';
    stickEl.style.top = 'calc(100% - max(16px, env(safe-area-inset-bottom)) - var(--sd) / 2)';
  }

  function stickRelease() {
    for (const k of stick.keys) release(k);
    stick.keys.clear();
    stick.id = null;
    api.stick.x = api.stick.y = 0;
    if (stickEl) {
      stickEl.classList.remove('active');
      knobEl.style.transform = '';
    }
    stickHome();
  }

  function stickMove(cx, cy) {
    const rad = stickEl.offsetWidth / 2 || 60;
    let dx = cx - stick.ox;
    let dy = cy - stick.oy;
    const d = Math.hypot(dx, dy);
    if (d > rad) {
      dx *= rad / d;
      dy *= rad / d;
    }
    knobEl.style.transform = `translate(${dx}px, ${dy}px)`;
    const x = dx / rad;
    const y = -dy / rad;
    api.stick.x = x;
    api.stick.y = y;
    const s = opts.stick || {};
    const want = new Set();
    const T = 0.38;
    if (x < -T && s.left) want.add(s.left);
    if (x > T && s.right) want.add(s.right);
    if (y > T && s.up) want.add(s.up);
    if (y < -T && s.down) want.add(s.down);
    if (s.sprint && Math.hypot(x, y) > 0.92) want.add(s.sprint);
    for (const k of stick.keys) if (!want.has(k)) release(k);
    for (const k of want) if (!stick.keys.has(k)) press(k);
    stick.keys = want;
  }

  function buttonDown(el, id) {
    const def = el.tcDef;
    el.classList.add('down');
    el.tcTouch = id;
    if (def.key) {
      if (def.tap) tap(def.key);
      else press(def.key);
    }
    if (def.onDown) def.onDown();
  }

  function buttonUp(el) {
    const def = el.tcDef;
    el.classList.remove('down');
    el.tcTouch = null;
    if (def.key && !def.tap) release(def.key);
    if (def.onUp) def.onUp();
  }

  const touchButtons = {}; // touch id -> button element

  function inMenu() {
    return !!(opts.menu && opts.menu());
  }

  function onStart(e) {
    e.preventDefault();
    if (opts.onAnyTouch) opts.onAnyTouch();
    for (const t of e.changedTouches) {
      const btn = t.target.closest && t.target.closest('.tc-btn');
      if (btn) {
        touchButtons[t.identifier] = btn;
        buttonDown(btn, t.identifier);
        continue;
      }
      if (inMenu()) {
        goFullscreen();
        const k = typeof opts.menuKey === 'function' ? opts.menuKey() : opts.menuKey;
        if (k !== null) tap(k || 'Enter');
        continue;
      }
      const leftSide = t.clientX < innerWidth * 0.5;
      if (opts.stick && stick.id === null && (leftSide || !opts.look)) {
        if (!leftSide && !opts.stickAnywhere) continue;
        stick.id = t.identifier;
        stick.ox = t.clientX;
        stick.oy = t.clientY;
        stickEl.style.left = t.clientX + 'px';
        stickEl.style.top = t.clientY + 'px';
        stickEl.classList.add('active');
        stickMove(t.clientX, t.clientY);
      } else if (opts.look && look.id === null) {
        look.id = t.identifier;
        look.x = t.clientX;
        look.y = t.clientY;
      }
    }
  }

  function onMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === stick.id) stickMove(t.clientX, t.clientY);
      else if (t.identifier === look.id) {
        opts.look(t.clientX - look.x, t.clientY - look.y);
        look.x = t.clientX;
        look.y = t.clientY;
      } else if (touchButtons[t.identifier]) {
        // Sliding a thumb off a button lets it go; sliding onto another presses that one.
        const over = document.elementFromPoint(t.clientX, t.clientY);
        const btn = over && over.closest && over.closest('.tc-btn');
        const cur = touchButtons[t.identifier];
        if (btn !== cur && (!btn || !btn.tcDef.tap) && !cur.tcDef.tap && cur.parentNode === rightEl) {
          buttonUp(cur);
          delete touchButtons[t.identifier];
          if (btn && btn.parentNode === rightEl) {
            touchButtons[t.identifier] = btn;
            buttonDown(btn, t.identifier);
          }
        }
      }
    }
  }

  function onEnd(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === stick.id) stickRelease();
      if (t.identifier === look.id) look.id = null;
      const btn = touchButtons[t.identifier];
      if (btn) {
        buttonUp(btn);
        delete touchButtons[t.identifier];
      }
    }
  }

  function resetAll() {
    stickRelease();
    look.id = null;
    for (const id in touchButtons) {
      buttonUp(touchButtons[id]);
      delete touchButtons[id];
    }
    releaseAll();
  }

  function goFullscreen() {
    if (!opts.fullscreen || document.fullscreenElement) return;
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
  }

  function tick() {
    requestAnimationFrame(tick);
    const hidden = !!(opts.hidden && opts.hidden());
    root.classList.toggle('on', !hidden);
    if (hidden) {
      if (stick.id !== null || look.id !== null || Object.keys(touchButtons).length) resetAll();
      return;
    }
    const menu = inMenu();
    if (menu !== lastMenu) {
      lastMenu = menu;
      resetAll();
      stickEl.style.visibility = menu || !opts.stick ? 'hidden' : '';
      rightEl.style.display = menu ? 'none' : '';
      menuEl.style.display = menu ? '' : 'none';
      hintEl.style.display = menu && opts.menuHint !== false ? '' : 'none';
    }
    if (menu && typeof opts.menuHint === 'function') {
      const text = opts.menuHint() || '';
      if (hintEl.textContent !== text) hintEl.textContent = text;
      hintEl.style.display = text ? '' : 'none';
    }
    allButtons = allButtons.filter((el) => el.isConnected);
    for (const el of allButtons) refreshButton(el);
  }

  function setup(options) {
    opts = Object.assign({ fullscreen: true }, options);
    const start = () => {
      if (!root) build();
      setButtons(opts.buttons);
      setTop(opts.top, opts.topSide);
      setMenuButtons(opts.menuButtons);
      setStick(opts.stick);
      if (typeof opts.menuHint === 'string') hintEl.textContent = opts.menuHint;
      lastMenu = null;
    };
    if (document.body) start();
    else addEventListener('DOMContentLoaded', start);
  }
})();
