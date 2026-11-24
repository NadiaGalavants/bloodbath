import * as cy from './cycle.js';
import { buddy, ring, sprite, COLORS } from './pixel.js';

const KEY = 'luna.v1';
const DISMISS_KEY = 'luna.installDismissed';
const $app = document.getElementById('app');
const $sheet = document.getElementById('sheet');
const $toast = document.getElementById('toast');
const $fx = document.getElementById('fx');

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const PHASE_NAMES = { menstrual: 'Menstrual', follicular: 'Follicular', ovulation: 'Ovulation', luteal: 'Luteal' };

const TIPS = {
  menstrual: [
    'Cozy mode on. Rest, warmth and snacks are allowed.',
    'Hot-water bottle and comfy hoodie kind of day.',
    'Go slow today. You are doing great.',
    'Extra water, extra naps, extra kindness to yourself.',
  ],
  follicular: [
    'Energy is rising! Try something new.',
    'Good days for plans, ideas and fresh starts.',
    'Your glow is loading. A great time to move your body.',
    'Feeling curious? Say yes to something fun.',
  ],
  ovulation: [
    'Feeling social and glowy. Fertile window.',
    'Main-character energy today. Fertile window.',
    'Sparkly days, great for big chats. Fertile window.',
    'Confidence is high. Fertile window.',
  ],
  luteal: [
    'Slowing down. Be gentle with yourself.',
    'Cravings are valid. Chocolate counts as self-care.',
    'Blanket, tea, comfort show. You earned it.',
    'Feeling extra? Totally normal right now. Breathe.',
  ],
  late: [
    'No stress, cycles wiggle sometimes. Tap below when it starts.',
    'Running a little late. Rest up and be kind to yourself.',
  ],
};
const GREETINGS = ['HI BESTIE!', 'HEY CUTIE!', 'HELLO MOON!', 'YOU GOT THIS!', 'HI SUNSHINE!'];

// ---------- storage ----------
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function save() {
  try {
    if (state) localStorage.setItem(KEY, JSON.stringify(state));
    else localStorage.removeItem(KEY);
  } catch {
    toast('COULD NOT SAVE. IS STORAGE FULL OR PRIVATE MODE ON?');
  }
}
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

// ---------- state ----------
let state = load();
let view = 'home';
let draft = { lastStart: cy.todayISO(), cycleLength: 28, periodLength: 5 };
let installEvent = null;
let lastRenderedDay = cy.todayISO();

const today = () => cy.todayISO();
const pick = (list) => list[cy.toDayNum(today()) % list.length];
const fmt = (iso) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8))}`;
const fmtLong = (iso) => `${fmt(iso)} ${iso.slice(0, 4)}`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 'S'}`;
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function checkAutoClose() {
  if (!state) return;
  const res = cy.autoClose(state, today());
  if (res.closed) {
    state = res.state;
    save();
    toast('I ENDED YOUR LAST PERIOD FOR YOU. FIX IT IN HISTORY IF NEEDED.');
  }
}

// ---------- rendering ----------
function render() {
  lastRenderedDay = today();
  if (!state) return renderSetup();
  if (view === 'history') return renderHistory();
  if (view === 'settings') return renderSettings();
  return renderHome();
}

function header() {
  return `<div class="top">
    <div class="brand">${sprite('crescent', COLORS.crimson, 24)}<span>Aima</span></div>
    <button class="iconbtn" data-action="menu" aria-label="Open menu">${sprite('menu', COLORS.wine, 26)}</button>
  </div>`;
}

function decorations() {
  const spots = [
    ['spark', COLORS.pink, 16, '20%', '4%'],
    ['spark', COLORS.wine, 10, '24%', '88%'],
    ['heart', COLORS.pink, 14, '38%', '90%'],
    ['spark', COLORS.wine, 10, '46%', '3%'],
    ['heart', COLORS.pink, 16, '58%', '6%'],
    ['spark', COLORS.pink, 16, '56%', '88%'],
  ];
  return spots
    .map(([n, c, s, top, left]) => `<span class="deco" style="top:${top};left:${left}">${sprite(n, c, s)}</span>`)
    .join('');
}

function installCard() {
  let dismissed = false;
  try { dismissed = localStorage.getItem(DISMISS_KEY) === '1'; } catch {}
  if (isStandalone() || dismissed) return '';
  const how = installEvent
    ? `<button class="btn small light" data-action="install" style="margin-top:8px">Install Aima</button>`
    : isIOS()
      ? 'In Safari, tap the Share button, then "Add to Home Screen".'
      : 'In your browser menu, tap "Install app" or "Add to Home screen".';
  return `<div class="install"><div><b>Put me on your home screen!</b>${how}</div>
    <button class="x" data-action="dismiss-install" aria-label="Hide install tip">X</button></div>`;
}

function renderHome() {
  const t = today();
  const cur = cy.current(state, t);
  const ringLen = Math.max(cur.C, cur.day);
  const mood = cur.late ? 'late' : cur.phase;

  let big, small;
  const when = cur.range
    ? `${fmt(cy.addDays(cur.next, -cur.range))} - ${fmt(cy.addDays(cur.next, cur.range))}`
    : `AROUND ${fmt(cur.next)}`;
  if (cur.open) {
    big = `PERIOD DAY ${cur.day}`;
    small = 'TAP BELOW WHEN IT ENDS';
  } else if (cur.late) {
    big = `PERIOD IS ${plural(cur.late, 'DAY')} LATE`;
    small = `IT WAS DUE ${fmt(cur.next)}`;
  } else if (cur.daysUntil === 0) {
    big = 'PERIOD EXPECTED TODAY';
    small = when;
  } else if (cur.daysUntil === 1) {
    big = 'PERIOD EXPECTED TOMORROW';
    small = when;
  } else {
    big = `PERIOD IN ${cur.daysUntil} DAYS`;
    small = when;
  }

  const tip = pick(cur.late ? TIPS.late : TIPS[cur.phase]);
  const btn = cur.open
    ? `<button class="btn light" data-action="end">${sprite('arrow', COLORS.wine, 12)}My period ended</button>`
    : `<button class="btn" data-action="start">${sprite('arrow', COLORS.pink, 12)}My period started</button>`;

  $app.innerHTML = `
    ${decorations()}
    ${header()}
    ${installCard()}
    <div class="bubble">${pick(GREETINGS)}</div>
    <div class="ringwrap">
      ${ring({ length: ringLen, today: cur.day, phaseOf: (d) => cy.phaseForDay(d, cur.C, cur.pLen) })}
      <div class="center">
        ${buddy(mood, 78)}
        <div class="daynum">Day ${cur.day}</div>
        <div class="phase">${PHASE_NAMES[cur.phase]}${cur.late ? ' (late)' : ''}</div>
      </div>
    </div>
    <div class="countdown"><div class="big">${big}</div><div class="small">${small}</div></div>
    <div class="tip"><span class="heart">${sprite('heart', COLORS.crimson, 20)}</span>${tip}</div>
    <div class="spacer"></div>
    ${btn}
    <p class="note">Predictions are estimates, not medical or contraception advice.</p>`;
}

function stepper(field, value, unit) {
  return `<div class="stepper">
    <button type="button" data-action="step" data-field="${field}" data-delta="-1" aria-label="Less">-</button>
    <span class="val">${plural(value, unit)}</span>
    <button type="button" data-action="step" data-field="${field}" data-delta="1" aria-label="More">+</button>
  </div>`;
}

function renderSetup() {
  $app.innerHTML = `
    ${decorations()}
    <div class="hello">
      <div style="display:flex;justify-content:center">${buddy('follicular', 110)}</div>
      <h1>Hi! I'm Aima</h1>
      <p>3 quick questions and we're ready.</p>
    </div>
    <div class="card">
      <h2>1. When did your last period start?</h2>
      <input type="date" id="lastStart" value="${draft.lastStart}" max="${today()}">
    </div>
    <div class="card">
      <h2>2. How long is your cycle usually?</h2>
      ${stepper('cycleLength', draft.cycleLength, 'DAY')}
      <p class="hint">From the first day of one period to the next. Not sure? Keep 28.</p>
    </div>
    <div class="card">
      <h2>3. How long does your period last?</h2>
      ${stepper('periodLength', draft.periodLength, 'DAY')}
    </div>
    <div class="err" id="setupErr"></div>
    <button class="btn" data-action="finish-setup">Let's go ${sprite('arrow', COLORS.pink, 12)}</button>
    <p class="note">Everything stays on this phone. No account, no tracking.</p>`;
}

function backTitle(title) {
  return `<div class="screen-title">
    <button class="iconbtn" data-action="home" aria-label="Back">${sprite('back', COLORS.wine, 14)}Back</button>
    <h1>${title}</h1>
  </div>`;
}

function renderHistory() {
  const { C, P, cycleCount } = cy.stats(state);
  const rows = cy.historyRows(state.periods);
  $app.innerHTML = `
    ${backTitle('History')}
    <div class="avg">
      <div><span class="n">${C}</span><span class="l">day cycle on average</span></div>
      <div><span class="n">${P}</span><span class="l">day period on average</span></div>
    </div>
    ${cycleCount < 3 ? '<p class="hint" style="margin-top:-6px;margin-bottom:16px">Aima learns your real averages after a few logged cycles.</p>' : ''}
    <button class="btn small light" data-action="add-past">+ Add a past period</button>
    <ul class="list">
      ${rows
        .map(
          (r) => `<li><button class="row" data-action="edit" data-id="${r.id}">
            ${sprite('heart', COLORS.deep, 18)}
            <span><span class="d">${fmt(r.start)} - ${r.end ? fmt(r.end) : 'NOW'}</span>
            ${r.length ? `${r.length} day period` : 'Going on now'}${r.cycle ? ` · ${r.cycle} day cycle` : ''}
            </span>
            <span class="chev">${sprite('arrow', COLORS.wine, 8)}</span>
          </button></li>`
        )
        .join('')}
    </ul>`;
}

function renderSettings() {
  const s = state.settings;
  $app.innerHTML = `
    ${backTitle('Settings')}
    <div class="card">
      <h2>Usual cycle length</h2>
      ${stepper('set-cycleLength', s.cycleLength, 'DAY')}
    </div>
    <div class="card">
      <h2>Usual period length</h2>
      ${stepper('set-periodLength', s.periodLength, 'DAY')}
      <p class="hint">Used until Aima has learned from 3 of your logged cycles.</p>
    </div>
    <div class="card">
      <h2>Your data</h2>
      <p class="hint" style="margin-top:0">Saved only on this phone. Deleting the app or clearing website data erases it.</p>
      <button class="btn small ghost" data-action="reset" style="margin-top:12px">Erase everything</button>
    </div>
    <p class="note">Aima · predictions are estimates, not medical or contraception advice.</p>`;
}

// ---------- sheets ----------
function openSheet(html) {
  $sheet.innerHTML = `<div class="backdrop" data-action="close-sheet"></div><div class="panel" role="dialog" aria-modal="true">${html}</div>`;
  $sheet.hidden = false;
}
function closeSheet() {
  $sheet.hidden = true;
  $sheet.innerHTML = '';
}

function menuSheet() {
  openSheet(`<h2>Menu</h2>
    <button class="btn light" data-action="go-history">History</button>
    <button class="btn light" data-action="go-settings">Settings</button>
    <button class="btn ghost" data-action="close-sheet">Close</button>`);
}

let editingId = null;
function editSheet(id) {
  editingId = id;
  const p = id ? state.periods.find((x) => x.id === id) : null;
  const latest = cy.sortPeriods(state.periods).at(-1);
  const canBeOpen = p && latest && latest.id === p.id;
  openSheet(`<h2>${p ? 'Edit period' : 'Add a past period'}</h2>
    <div class="field"><label for="eStart">Started</label><input type="date" id="eStart" value="${p ? p.start : ''}" max="${today()}"></div>
    <div class="field"><label for="eEnd">Ended${canBeOpen ? ' (leave empty if still going)' : ''}</label><input type="date" id="eEnd" value="${p && p.end ? p.end : ''}" max="${today()}"></div>
    <div class="err" id="eErr"></div>
    <button class="btn" data-action="save-edit">Save</button>
    ${p ? '<button class="btn ghost" data-action="delete-edit">Delete</button>' : ''}
    <button class="btn ghost" data-action="close-sheet">Cancel</button>`);
}

function saveEdit() {
  const start = document.getElementById('eStart').value;
  const end = document.getElementById('eEnd').value || null;
  const err = (m) => (document.getElementById('eErr').textContent = m);
  const t = today();
  if (!start) return err('Pick the start date.');
  if (start > t) return err('The start date is in the future.');
  if (end && end < start) return err('The end date is before the start.');
  if (end && end > t) return err('The end date is in the future.');
  const others = state.periods.filter((p) => p.id !== editingId);
  const latestOther = cy.sortPeriods(others).at(-1);
  const isLatest = !latestOther || start > latestOther.start;
  if (!end && !(editingId && isLatest)) return err('Add the end date too.');
  const s = cy.toDayNum(start);
  const e = cy.toDayNum(end || t);
  const clash = others.some((o) => {
    const os = cy.toDayNum(o.start);
    const oe = cy.toDayNum(o.end || t);
    return s <= oe && e >= os;
  });
  if (clash) return err('That overlaps another period.');
  const entry = { id: editingId || newId(), start, end };
  state = { ...state, periods: [...others, entry] };
  save();
  closeSheet();
  render();
  toast('SAVED!');
}

function deleteEdit() {
  if (state.periods.length <= 1) {
    document.getElementById('eErr').textContent = 'This is your only period. Edit it instead.';
    return;
  }
  if (!confirm('Delete this period? This cannot be undone.')) return;
  state = { ...state, periods: state.periods.filter((p) => p.id !== editingId) };
  save();
  closeSheet();
  render();
  toast('DELETED.');
}

// ---------- effects ----------
let toastTimer;
function toast(msg) {
  $toast.textContent = msg;
  $toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($toast.hidden = true), 3200);
}

function burst() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = [COLORS.deep, COLORS.crimson, COLORS.pink, COLORS.wine];
  for (let i = 0; i < 16; i++) {
    const el = document.createElement('span');
    el.innerHTML = sprite(i % 3 ? 'heart' : 'spark', colors[i % colors.length], 14 + (i % 3) * 6);
    el.style.left = `${8 + Math.random() * 84}%`;
    el.style.bottom = `${8 + Math.random() * 20}%`;
    el.style.animationDelay = `${Math.random() * 0.3}s`;
    $fx.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }
}

// ---------- actions ----------
const actions = {
  menu: menuSheet,
  'close-sheet': closeSheet,
  'go-history': () => { closeSheet(); view = 'history'; render(); window.scrollTo(0, 0); },
  'go-settings': () => { closeSheet(); view = 'settings'; render(); window.scrollTo(0, 0); },
  home: () => { view = 'home'; render(); window.scrollTo(0, 0); },
  start: () => {
    const t = today();
    if (state.periods.some((p) => p.start === t)) return toast('ALREADY LOGGED FOR TODAY!');
    state = cy.startPeriod(state, t, newId());
    save();
    render();
    burst();
    toast('LOGGED! WRONG DAY? FIX IT IN HISTORY.');
  },
  end: () => {
    state = cy.endPeriod(state, today());
    save();
    render();
    burst();
    toast('YAY, PERIOD DONE! SEE YOU NEXT TIME.');
  },
  step: (el) => {
    const field = el.dataset.field;
    const delta = Number(el.dataset.delta);
    const limits = { cycleLength: [20, 45], periodLength: [2, 10] };
    const clamp = (key, v) => Math.min(limits[key][1], Math.max(limits[key][0], v));
    if (field.startsWith('set-')) {
      const key = field.slice(4);
      state = { ...state, settings: { ...state.settings, [key]: clamp(key, state.settings[key] + delta) } };
      save();
    } else {
      const input = document.getElementById('lastStart');
      if (input) draft.lastStart = input.value;
      draft[field] = clamp(field, draft[field] + delta);
    }
    render();
  },
  'finish-setup': () => {
    const v = document.getElementById('lastStart').value;
    const errEl = document.getElementById('setupErr');
    if (!v) return (errEl.textContent = 'Pick the date your last period started.');
    if (v > today()) return (errEl.textContent = 'That date is in the future.');
    state = cy.fromSetup({ ...draft, lastStart: v }, today(), newId());
    checkAutoClose();
    save();
    view = 'home';
    render();
    burst();
    window.scrollTo(0, 0);
  },
  'add-past': () => editSheet(null),
  edit: (el) => editSheet(el.dataset.id),
  'save-edit': saveEdit,
  'delete-edit': deleteEdit,
  reset: () => {
    if (!confirm('Erase all your Aima data? This cannot be undone.')) return;
    state = null;
    save();
    view = 'home';
    draft = { lastStart: today(), cycleLength: 28, periodLength: 5 };
    render();
  },
  install: async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    installEvent = null;
    render();
  },
  'dismiss-install': () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    render();
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = actions[el.dataset.action];
  if (fn) fn(el);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$sheet.hidden) closeSheet();
});

// Refresh when the day changes or the app comes back to the front.
function refreshIfNewDay() {
  if (today() !== lastRenderedDay && $sheet.hidden) {
    checkAutoClose();
    render();
  }
}
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && refreshIfNewDay());
setInterval(refreshIfNewDay, 60000);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e;
  if (state && view === 'home') render();
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

checkAutoClose();
render();
