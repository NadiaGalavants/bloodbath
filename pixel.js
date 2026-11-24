// Pixel-art sprites for Aima, drawn as SVG from little bitmaps.

export const COLORS = {
  blush: '#F2C9C9',
  pink: '#F299A9',
  crimson: '#8C031C',
  deep: '#8C0303',
  wine: '#8C1B39',
};

export const SPRITES = {
  heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
  dot: ['.####.', '######', '######', '######', '######', '.####.'],
  spark: ['...#...', '...#...', '..###..', '#######', '..###..', '...#...', '...#...'],
  hollow: ['######', '#....#', '#....#', '#....#', '#....#', '######'],
  crescent: ['..###...', '.###....', '###.....', '###.....', '###.....', '###.....', '.###....', '..###...'],
  arrow: ['#....', '##...', '###..', '####.', '###..', '##...', '#....'],
  back: ['....#', '...##', '..###', '.####', '..###', '...##', '....#'],
  plus: ['.#.', '###', '.#.'],
  z: ['###', '.#.', '###'],
  menu: ['#####', '.....', '#####', '.....', '#####'],
};

const MOON = [
  '....####....',
  '..########..',
  '.##########.',
  '.##########.',
  '############',
  '############',
  '############',
  '############',
  '.##########.',
  '.##########.',
  '..########..',
  '....####....',
];

export function rects(rows, color, ox = 0, oy = 0, k = 1, extra = '') {
  let s = '';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '#') {
        s += `<rect x="${ox + x * k}" y="${oy + y * k}" width="${k}" height="${k}" fill="${color}"${extra}/>`;
      }
    }
  });
  return s;
}

const px = (cells, color) =>
  cells.map(([x, y, w = 1, h = 1]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`).join('');

export function sprite(name, color, size = 16, label = '') {
  const rows = SPRITES[name];
  const w = rows[0].length;
  const h = rows.length;
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="px" viewBox="0 0 ${w} ${h}" width="${size}" height="${(size * h) / w}" shape-rendering="crispEdges" ${aria}>${rects(rows, color)}</svg>`;
}

// The moon buddy. mood: menstrual | follicular | ovulation | luteal | late
export function buddy(mood = 'follicular', size = 96) {
  const { pink, wine, blush, crimson } = COLORS;
  let body = '';
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) body += rects(MOON, wine, dx, dy);
  body += rects(MOON, pink);

  let eyes = '';
  let face = '';
  let extras = '';
  const cheeks = px([[1, 6, 2], [9, 6, 2]], blush);

  if (mood === 'menstrual') {
    eyes = px([[2, 5, 2], [8, 5, 2]], wine);
    face = px([[5, 8, 2]], wine) + cheeks;
    extras = rects(SPRITES.z, wine, 12, -2) + rects(SPRITES.z, crimson, 14.5, -5, 0.7);
  } else if (mood === 'ovulation') {
    eyes = px([[3, 3], [2, 4, 3], [3, 5], [8, 3], [7, 4, 3], [8, 5]], wine);
    face = px([[3, 7], [8, 7], [4, 8, 4]], wine) + cheeks;
    extras = rects(SPRITES.plus, crimson, -2.5, 0, 0.8) + rects(SPRITES.plus, crimson, 12.5, 2, 0.8) + rects(SPRITES.plus, wine, 11, -2.5, 0.6);
  } else if (mood === 'luteal' || mood === 'late') {
    eyes = px([[2, 5, 2], [8, 5, 2]], wine);
    face = px([[5, 7, 2]], wine) + cheeks;
    // cozy blanket over the bottom of the moon
    const blanket = MOON.map((row, y) => (y >= 9 ? row : '.'.repeat(12)));
    extras = rects(blanket, crimson) + px([[0, 9, 12]], wine) + px([[4, 10], [6, 10], [5, 11]], pink);
    if (mood === 'late') eyes = px([[3, 4, 1, 2], [8, 4, 1, 2]], wine);
  } else {
    eyes = px([[3, 4, 1, 2], [8, 4, 1, 2]], wine);
    face = px([[4, 7], [7, 7], [5, 8, 2]], wine) + cheeks;
  }

  return `<svg class="buddy" viewBox="-3 -6 18 19" width="${size}" height="${(size * 19) / 18}" shape-rendering="crispEdges" role="img" aria-label="Moon buddy, ${mood} mood">${body}<g class="eyes">${eyes}</g>${face}${extras}</svg>`;
}

// The cycle ring: one pixel block per day.
export function ring({ length, today, phaseOf }) {
  const size = 240;
  const c = size / 2;
  const r = 100;
  const n = length;
  const k = n <= 32 ? 2 : 1.6;
  const { deep, pink, crimson, wine } = COLORS;
  let s = '';
  for (let i = 0; i < n; i++) {
    const day = i + 1;
    const a = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2;
    const x = Math.round(c + r * Math.cos(a));
    const y = Math.round(c + r * Math.sin(a));
    const phase = phaseOf(day);
    const isToday = day === today;
    const past = day < today ? ' past' : '';
    if (isToday) {
      s += `<g class="today"><rect x="${x - 11}" y="${y - 11}" width="22" height="22" fill="${pink}" stroke="${crimson}" stroke-width="4"/><rect x="${x - 3}" y="${y - 3}" width="6" height="6" fill="${crimson}"/></g>`;
      continue;
    }
    const [name, color] =
      phase === 'menstrual' ? ['heart', deep]
      : phase === 'follicular' ? ['dot', pink]
      : phase === 'ovulation' ? ['spark', crimson]
      : ['hollow', wine];
    const rows = SPRITES[name];
    const w = rows[0].length * k;
    const h = rows.length * k;
    s += `<g class="day${past}">${rects(rows, color, x - w / 2, y - h / 2, k)}</g>`;
  }
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" aria-hidden="true">${s}</svg>`;
}
