import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { COVER_TIME, DURATION, FPS } from '../../src/ui/cinematic/cinematicTiming';
import { choreographyTime, coverageAt, inkFront, inkRibbon } from '../../src/ui/cinematic/inkGeometry';

type Shape = { c: boolean; v: number[][]; i: number[][]; o: number[][] };
type Key = { t: number; s: Shape[] };
const kinds = ['welcome', 'birth', 'death'] as const;
const asset = (kind: string) => JSON.parse(strFromU8(unzipSync(readFileSync(join(__dirname, '../../assets/cinematics', kind + '.lottie')))[`animations/${kind}.json`]));
function interpolate(keys: Key[], frame: number): Shape {
  let index = 0;
  while (index + 1 < keys.length && keys[index + 1].t <= frame) index++;
  const from = keys[index], to = keys[Math.min(index + 1, keys.length - 1)], t = from === to ? 0 : (frame - from.t) / (to.t - from.t);
  const result = { c: true } as Shape;
  for (const key of ['v', 'i', 'o'] as const) result[key] = from.s[0][key].map((p, i) => p.map((n, axis) => n * (1 - t) + to.s[0][key][i][axis] * t));
  return result;
}
// Independently recover the vertices/control points of the ORIGINAL quadratic
// contours. Compare curve positions, not generated JSON against its own output.
function originalCurves(svg: string) {
  const values = (svg.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const start = values.slice(0, 2), curves: number[][][] = []; let previous = start;
  for (let i = 2; i < values.length; i += 4) {
    const control = values.slice(i, i + 2), end = values.slice(i + 2, i + 4);
    curves.push([previous, control, end]); previous = end;
  }
  return curves;
}

test.each(kinds)('%s native asset is local, complete, 60 Hz, transparent at the end and opaque at navigation', kind => {
  const data = asset(kind);
  expect(data.fr).toBe(60); expect(data.op / data.fr * 1000).toBe(DURATION[kind]);
  expect(data.w).toBe(400); expect(data.h).toBe(900);
  expect(data.assets.every((entry: { layers: unknown[]; p?: unknown }) => entry.layers && !entry.p)).toBe(true);
  expect(JSON.stringify(data)).not.toMatch(/https?:|expressions|NaN|Infinity/);
  const cover = data.layers[0]; expect(cover.hasMask).toBe(true);
  for (const layer of data.assets[0].layers) if (layer.masksProperties) expect(layer.hasMask).toBe(true);
  expect(coverageAt(kind, DURATION[kind])).toBe(0);
  if (kind !== 'welcome') expect(coverageAt(kind, COVER_TIME[kind])).toBe(1);
  for (const ms of [0, COVER_TIME[kind], DURATION[kind]]) {
    const frame = ms * FPS / 1000, baked = interpolate(cover.masksProperties[0].pt.k, frame);
    const expected = (inkFront(coverageAt(kind, ms), choreographyTime(kind, ms) / 1700).match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    expect(Math.max(...baked.v.flat().map((value, i) => Math.abs(value - expected[i])))).toBeLessThanOrEqual(.31);
  }
});

test.each(kinds)('%s interpolated native curves preserve the authored ink at every 60 Hz frame', kind => {
  const data = asset(kind); let maxError = 0;
  for (const layer of data.assets[0].layers.filter((entry: { nm: string }) => entry.nm.startsWith('Ink '))) {
    const [, strand, offset, thickness] = layer.nm.match(/Ink (\d) \/ (-?[\d.]+) \/ ([\d.]+)/).map(Number);
    const keys = layer.shapes[0].ks.k as Key[];
    expect(keys[0].t).toBe(0); expect(keys[keys.length - 1].t).toBe(data.op);
    for (const key of keys) {
      expect(key.s[0].v).toHaveLength(162);
      expect(key.s[0].i).toHaveLength(162); expect(key.s[0].o).toHaveLength(162);
    }
    for (let f = 0; f <= data.op; f++) {
      const baked = interpolate(keys, f), original = originalCurves(inkRibbon(choreographyTime(kind, f / FPS * 1000) / 1000, strand, offset, thickness));
      for (let n = 0; n < original.length; n++) for (const t of [0, .5]) for (const axis of [0, 1]) {
        const [start, control, end] = original[n];
        const expected = (1 - t) ** 2 * start[axis] + 2 * (1 - t) * t * control[axis] + t ** 2 * end[axis];
        const v = baked.v[n][axis], next = (n + 1) % baked.v.length, v2 = baked.v[next][axis];
        const actual = (1 - t) ** 3 * v + 3 * (1 - t) ** 2 * t * (v + baked.o[n][axis]) + 3 * (1 - t) * t ** 2 * (v2 + baked.i[next][axis]) + t ** 3 * v2;
        maxError = Math.max(maxError, Math.abs(actual - expected));
      }
    }
  }
  // 0.3px per point/tangent => <0.6px worst-case cubic interpolation.
  expect(maxError).toBeLessThan(.6);
});

test('the native playback dependency graph cannot import the offline geometry evaluator', () => {
  for (const name of ['CinematicInk.tsx', 'CinematicTransition.tsx', 'CinematicContext.ts', 'cinematicTiming.ts']) {
    const source = readFileSync(join(__dirname, '../../src/ui/cinematic', name), 'utf8');
    expect(source).not.toMatch(/inkGeometry|inkRibbon|inkFront|useAnimatedProps|withTiming/);
  }
});
