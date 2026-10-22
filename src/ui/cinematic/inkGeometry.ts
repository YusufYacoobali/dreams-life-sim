/** Local vector choreography. All coordinates are decorative, never game RNG.
 * These functions also drive the frame-review tool. Path updates run on the UI
 * runtime; there is no JS frame timer, remote asset, or bitmap frame sequence.
 */
export type CinematicKind = 'welcome' | 'birth' | 'death';
export const DURATION = { welcome: 2600, birth: 1500, death: 1800 } as const;
export const COVER_TIME = { welcome: 0, birth: 620, death: 760 } as const;
export const NAVY = '#061633';

export function smooth(from: number, to: number, value: number) {
  'worklet';
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

/** A ruffled, folding liquid front, with long fingers and smaller capillaries.
 * Overscan guarantees both fully clear and fully opaque endpoints on tablets.
 */
export function inkFront(coverage: number, phase = 0) {
  'worklet';
  let path = 'M -700 -220 L ';
  for (let i = 0; i <= 56; i++) {
    const s = i / 56;
    const ripple = Math.sin(s * 16 + phase) * 66 + Math.sin(s * 37 - phase * 1.3) * 27 + Math.sin(s * 83 + phase) * 9;
    const finger = 115 * Math.sin(s * 9 + phase * 0.6) ** 3;
    const x = -1050 + coverage * 2500 + (s - 0.5) * 580 + ripple + finger;
    const y = -220 + s * 1340 + Math.sin(s * 37 - phase * 1.3) * 17;
    path += `${x.toFixed(2)} ${y.toFixed(2)} ` + (i === 56 ? '' : 'L ');
  }
  return path + 'L -700 1120 Z';
}

type Point = { x: number; y: number; nx: number; ny: number; width: number };
const controlPoints = [
  [[-180, 1050], [-10, 770], [160, 540], [270, 330], [205, 100], [400, -220]],
  [[580, -250], [335, 80], [140, 315], [185, 540], [360, 750], [580, 1040]],
];

// Sample two authored, interweaving S-shaped pours once, outside the animation.
export const streams: Point[][] = controlPoints.map((points, strand) => Array.from({ length: 81 }, (_, i) => {
  const position = i / 80 * (points.length - 1), k = Math.min(points.length - 2, Math.floor(position)), t = position - k;
  const a = points[Math.max(0, k - 1)], b = points[k], c = points[k + 1], d = points[Math.min(points.length - 1, k + 2)];
  const at = (axis: number, u: number) => 0.5 * (2 * b[axis] + (-a[axis] + c[axis]) * u + (2 * a[axis] - 5 * b[axis] + 4 * c[axis] - d[axis]) * u * u + (-a[axis] + 3 * b[axis] - 3 * c[axis] + d[axis]) * u * u * u);
  const x = at(0, t), y = at(1, t), dx = at(0, t + 0.001) - x, dy = at(1, t + 0.001) - y, length = Math.hypot(dx, dy) || 1;
  return { x, y, nx: -dy / length, ny: dx / length, width: (strand ? 55 : 79) * (1 + 0.36 * Math.sin(i * 0.21) + 0.15 * Math.sin(i * 0.73)) };
}));

// Worklet closures capture their dependencies during module initialization.
// Declare leaf worklets before the worklets that call them.
// Curl-field advection folds both sides of the wet contour around local eddies.
// The radius falls off smoothly so the pours stretch into fine, connected wisps.
function curl(x: number, y: number, time: number, strand: number) {
  'worklet';
  const vortices = strand ? [[170, 340, 165, -2.1], [270, 590, 155, 2.5]] : [[145, 585, 175, 2.4], [240, 320, 165, -2.6]];
  for (const [cx, cy, radius, spin] of vortices) {
    const dx = x - cx, dy = y - cy;
    const angle = spin * Math.exp(-(dx * dx + dy * dy) / (radius * radius)) * (0.8 + time * 0.14);
    const cos = Math.cos(angle), sin = Math.sin(angle);
    x = cx + dx * cos - dy * sin;
    y = cy + dx * sin + dy * cos;
  }
  return [x, y];
}

function roundedContour(points: number[][]) {
  'worklet';
  const last = points[points.length - 1], first = points[0];
  let path = `M${((last[0] + first[0]) / 2).toFixed(2)} ${((last[1] + first[1]) / 2).toFixed(2)} `;
  for (let i = 0; i < points.length; i++) {
    const p = points[i], next = points[(i + 1) % points.length];
    path += `Q${p[0].toFixed(2)} ${p[1].toFixed(2)} ${((p[0] + next[0]) / 2).toFixed(2)} ${((p[1] + next[1]) / 2).toFixed(2)} `;
  }
  return path + 'Z';
}

/** Advected ribbons, tapered at the wet tip. Multiple narrow offset ribbons
 * form veins inside each pour; the contour keeps folding as the ink advances.
 */
export function inkRibbon(time: number, strand: number, offset = 0, thickness = 1) {
  'worklet';
  const points = streams[strand], head = smooth(0.04 + strand * 0.12, 1.38, time) * 1.28;
  const left: number[][] = [], right: number[][] = [];
  for (let i = 0; i < points.length; i++) {
    const point = points[i], s = i / (points.length - 1);
    const wet = smooth(0, 0.13, head - s), tail = 1 - smooth(0.68, 1.28, head - s);
    const width = point.width * wet * tail;
    const fold = Math.sin(s * 31 - time * 2.8 + strand) * 0.18 + Math.sin(s * 79 + time * 1.6) * 0.065;
    const centre = width * (offset + fold);
    const edge = width * thickness * (0.78 + 0.16 * Math.sin(s * 57 + time * 2) + 0.06 * Math.sin(s * 139 - time * 3));
    left.push(curl(point.x + point.nx * (centre + edge), point.y + point.ny * (centre + edge), time, strand));
    right.unshift(curl(point.x + point.nx * (centre - edge), point.y + point.ny * (centre - edge), time, strand));
  }
  return roundedContour([...left, ...right]);
}

export function coverageAt(kind: CinematicKind, milliseconds: number) {
  'worklet';
  if (kind === 'welcome') return 1 - smooth(2100, 2600, milliseconds);
  const cover = COVER_TIME[kind], reveal = kind === 'birth' ? 820 : 1120;
  return smooth(0, cover - 50, milliseconds) * (1 - smooth(reveal, DURATION[kind], milliseconds));
}
