// Cycle maths for Luna. Pure functions, no DOM, so they can be tested.
// Dates are local calendar dates as 'YYYY-MM-DD' strings.

export const DAY_MS = 86400000;

export function toDayNum(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function fromDayNum(n) {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso, n) {
  return fromDayNum(toDayNum(iso) + n);
}

export function diffDays(a, b) {
  return toDayNum(a) - toDayNum(b);
}

const avg = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;

export function sortPeriods(periods) {
  return [...periods].sort((a, b) => toDayNum(a.start) - toDayNum(b.start));
}

// Cycle lengths between consecutive starts, oldest first. Ignores likely mistakes.
export function cycleLengths(periods) {
  const s = sortPeriods(periods);
  const out = [];
  for (let i = 1; i < s.length; i++) {
    const len = diffDays(s[i].start, s[i - 1].start);
    if (len >= 15 && len <= 60) out.push(len);
  }
  return out;
}

export function periodLengths(periods) {
  return sortPeriods(periods)
    .filter((p) => p.end)
    .map((p) => diffDays(p.end, p.start) + 1)
    .filter((len) => len >= 1 && len <= 15);
}

// 0 logged: setup value. 1-2: average with setup value. 3+: average of last 6.
export function blendedAverage(values, fallback) {
  if (values.length === 0) return fallback;
  if (values.length < 3) return Math.round(avg([...values, fallback]));
  return Math.round(avg(values.slice(-6)));
}

export function stats(state) {
  const cycles = cycleLengths(state.periods);
  const lengths = periodLengths(state.periods);
  const C = blendedAverage(cycles, state.settings.cycleLength);
  const P = blendedAverage(lengths, state.settings.periodLength);
  let range = 0;
  const recent = cycles.slice(-6);
  if (recent.length >= 3) {
    const spread = Math.max(...recent) - Math.min(...recent);
    if (spread > 2) range = Math.min(5, Math.ceil(spread / 2));
  }
  return { C, P, range, cycleCount: cycles.length };
}

// Ovulation window for a cycle of length C whose period lasted pLen days.
export function ovulationWindow(C, pLen) {
  let start = C - 14 - 1;
  let end = C - 14 + 1;
  if (start <= pLen) {
    start = pLen + 1;
    end = start + 2;
  }
  return { start, end };
}

export function phaseForDay(day, C, pLen, periodOpen = false) {
  if (day <= pLen || periodOpen) return 'menstrual';
  const ov = ovulationWindow(C, pLen);
  if (day < ov.start) return 'follicular';
  if (day <= ov.end) return 'ovulation';
  return 'luteal';
}

// Close a period that has been open far too long (forgot to tap "ended").
export function autoClose(state, today) {
  const s = sortPeriods(state.periods);
  const last = s[s.length - 1];
  if (!last || last.end) return { state, closed: false };
  const { P } = stats(state);
  const day = diffDays(today, last.start) + 1;
  if (day > P + 5) {
    const periods = state.periods.map((p) =>
      p.id === last.id ? { ...p, end: addDays(p.start, P - 1), autoClosed: true } : p
    );
    return { state: { ...state, periods }, closed: true };
  }
  return { state, closed: false };
}

export function current(state, today) {
  const s = sortPeriods(state.periods);
  const last = s[s.length - 1];
  if (!last) return null;
  const { C, P, range } = stats(state);
  const day = diffDays(today, last.start) + 1;
  const open = !last.end;
  const pLen = open ? Math.max(day, P) : diffDays(last.end, last.start) + 1;
  const phase = open ? 'menstrual' : phaseForDay(day, C, pLen);
  const next = addDays(last.start, C);
  const daysUntil = diffDays(next, today);
  return {
    day,
    phase,
    open,
    C,
    P,
    pLen,
    range,
    next,
    daysUntil,
    late: daysUntil < 0 ? -daysUntil : 0,
    lastStart: last.start,
  };
}

// Log a new period starting on `date`. Closes any open period the day before.
export function startPeriod(state, date, id) {
  const periods = state.periods.map((p) => {
    if (!p.end && toDayNum(p.start) < toDayNum(date)) {
      return { ...p, end: addDays(date, -1) };
    }
    return p;
  });
  periods.push({ id, start: date, end: null });
  return { ...state, periods };
}

export function endPeriod(state, date) {
  const periods = state.periods.map((p) =>
    !p.end ? { ...p, end: toDayNum(date) < toDayNum(p.start) ? p.start : date } : p
  );
  return { ...state, periods };
}

// Initial state from the three setup answers.
export function fromSetup({ lastStart, cycleLength, periodLength }, today, id) {
  const day = diffDays(today, lastStart) + 1;
  const end = day <= periodLength ? null : addDays(lastStart, periodLength - 1);
  return {
    version: 1,
    settings: { cycleLength, periodLength },
    periods: [{ id, start: lastStart, end }],
  };
}

// History rows, newest first.
export function historyRows(periods) {
  const s = sortPeriods(periods);
  return s
    .map((p, i) => {
      const nextP = s[i + 1];
      return {
        ...p,
        length: p.end ? diffDays(p.end, p.start) + 1 : null,
        cycle: nextP ? diffDays(nextP.start, p.start) : null,
      };
    })
    .reverse();
}
