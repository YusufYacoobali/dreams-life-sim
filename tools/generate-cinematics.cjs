// Bake the original ink contours into native, continuously interpolated paths.
// No browser, font loader, game state or RNG is needed to reproduce these files.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { zipSync, strToU8 } = require('fflate');
const root = path.resolve(__dirname, '..');
function loadTS(name) {
  const file = path.join(root, 'src/ui/cinematic', name + '.ts');
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'exports', 'module', code)(id => loadTS(id.replace('./', '')), module.exports, module);
  return module.exports;
}
const { FPS, DURATION, COVER_TIME } = loadTS('cinematicTiming');
const { inkRibbon, inkFront, coverageAt, smooth, choreographyTime } = loadTS('inkGeometry');
const lettering = require('./cinematic-review/lettering.json');
const round = n => Math.round(n * 100) / 100;
const xy = (x, y) => [round(x), round(y)];
const fixed = k => ({ a: 0, k });
const colour = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
const transform = (opacity = fixed(100)) => ({ o: opacity, r: fixed(0), p: fixed([0, 0, 0]), a: fixed([0, 0, 0]), s: fixed([100, 100, 100]) });

// Convert quadratic SVG curves to equivalent cubic Beziers, preserving topology
// even when a wet ribbon has zero width. Native renderers interpolate the points.
function commandsToShapes(commands) {
  const shapes = []; let shape, point;
  for (const cmd of commands) {
    const type = cmd.type.toUpperCase();
    if (type === 'M') {
      shape = { c: true, v: [xy(cmd.x, cmd.y)], i: [[0, 0]], o: [[0, 0]] };
      shapes.push(shape); point = [cmd.x, cmd.y];
    } else if (type === 'L' || type === 'Q' || type === 'C') {
      const end = [cmd.x, cmd.y]; let c1 = point, c2 = end;
      if (type === 'Q') { c1 = point.map((n, a) => n + (cmd[a ? 'y1' : 'x1'] - n) * 2 / 3); c2 = end.map((n, a) => n + (cmd[a ? 'y1' : 'x1'] - n) * 2 / 3); }
      if (type === 'C') { c1 = [cmd.x1, cmd.y1]; c2 = [cmd.x2, cmd.y2]; }
      shape.o[shape.o.length - 1] = xy(c1[0] - point[0], c1[1] - point[1]);
      shape.v.push(xy(...end)); shape.i.push(xy(c2[0] - end[0], c2[1] - end[1])); shape.o.push([0, 0]); point = end;
    } else if (type === 'Z') {
      const last = shape.v.length - 1;
      if (shape.v[last].every((n, a) => n === shape.v[0][a])) {
        shape.i[0] = shape.i[last]; shape.v.pop(); shape.i.pop(); shape.o.pop();
      }
    } else throw Error('Unsupported path command ' + type);
  }
  return shapes;
}
function svgShape(svg) {
  const tokens = svg.match(/[MLQZ]|-?\d+(?:\.\d+)?/g), commands = [];
  for (let n = 0; n < tokens.length;) {
    const type = tokens[n++], cmd = { type };
    if (type === 'Q') { cmd.x1 = +tokens[n++]; cmd.y1 = +tokens[n++]; }
    if (type !== 'Z') { cmd.x = +tokens[n++]; cmd.y = +tokens[n++]; }
    commands.push(cmd);
  }
  return commandsToShapes(commands)[0];
}
const shapeNumbers = shape => ['v', 'i', 'o'].flatMap(key => shape[key].flat());
const linear = { o: { x: 1 / 3, y: 1 / 3 }, i: { x: 2 / 3, y: 2 / 3 } };

// Adaptive offline sampling: test EVERY 60 Hz frame against the authored shape.
// Keep interpolation error below 0.3 design pixels; native playback remains
// continuous between keys, including on displays faster than 60 Hz.
function animated(sample, frames, shape = false, tolerance = 0.3) {
  const samples = Array.from({ length: frames + 1 }, (_, f) => sample(f * 1000 / FPS));
  const values = samples.map(value => shape ? shapeNumbers(value) : Array.isArray(value) ? value : [value]);
  const keys = [0];
  function split(start, end) {
    let error = tolerance, worst = -1;
    for (let f = start + 1; f < end; f++) {
      const t = (f - start) / (end - start);
      for (let i = 0; i < values[f].length; i++) {
        const delta = Math.abs(values[f][i] - (values[start][i] * (1 - t) + values[end][i] * t));
        if (delta > error) { error = delta; worst = f; }
      }
    }
    if (worst !== -1) { split(start, worst); split(worst, end); } else keys.push(end);
  }
  for (let start = 0; start < frames; start += 6) split(start, Math.min(start + 6, frames));
  const wrap = value => shape || !Array.isArray(value) ? [value] : value;
  return { a: 1, k: keys.map((t, index) => ({ t, s: wrap(samples[t]), ...(index < keys.length - 1 ? linear : {}) })) };
}
function bounds(shape) {
  const xs = shape.v.map(p => p[0]), ys = shape.v.map(p => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
function gradient(stops, start, end, opacity = 100, radial = false) {
  return { ty: 'gf', o: fixed(opacity), r: 1, t: radial ? 2 : 1, s: start, e: end, g: { p: stops.length, k: fixed(stops.flatMap(([at, hex]) => [at, ...colour(hex)])) }, ...(radial ? { h: fixed(0), a: fixed(0) } : {}) };
}
const solid = (hex, opacity = 100) => ({ ty: 'fl', c: fixed([...colour(hex), 1]), o: fixed(opacity), r: 1 });
const rectangle = { ty: 'rc', d: 1, p: fixed([200, 450]), s: fixed([400, 900]), r: fixed(0) };
const mask = pt => ({ mode: 'a', inv: false, pt, o: fixed(100), x: fixed(0) });
const outline = shape => ({ ty: 'sh', ks: fixed(shape), d: 1 });

function generate(kind) {
  const frames = DURATION[kind] * FPS / 1000, birth = kind === 'birth'; let index = 0;
  const time = ms => choreographyTime(kind, ms);
  const scalar = fn => animated(ms => round(fn(time(ms))), frames, false, 0.1);
  const layer = (name, shapes, opacity = fixed(100)) => ({ ddd: 0, ind: ++index, ty: 4, nm: name, sr: 1, ks: transform(opacity), ao: 0, shapes, ip: 0, op: frames + 1, st: 0, bm: 0 });
  const ground = layer('Navy / cream ground', [rectangle, gradient([[0, birth ? '#F8F0DF' : '#061633'], [.55, birth ? '#FFF9ED' : '#0A2444'], [1, birth ? '#DDEEF7' : '#040E23']], fixed([0, 0]), fixed([400, 900]))]);
  const light = layer('Soft central light', [rectangle, {
    ...gradient([[0, birth ? '#FFFFFF' : '#D5A459'], [1, birth ? '#FFFFFF' : '#D5A459']], fixed([180, 423]), fixed([440, 423]), birth ? 70 : 14, true),
    g: { p: 2, k: fixed([0, ...colour(birth ? '#FFFFFF' : '#D5A459'), 1, ...colour(birth ? '#FFFFFF' : '#D5A459'), 0, 1, 1, 0]) },
  }], scalar(t => smooth(50, 450, t) * (kind === 'death' ? 30 : 70)));
  const layers = [light, ground];
  const foil = [[0, birth ? '#82B6CD' : '#725137'], [.25, birth ? '#DAEFF3' : '#D5A459'], [.47, birth ? '#8FBFD6' : '#FFE6B0'], [.63, birth ? '#D8ECF4' : '#B57B3E'], [.83, birth ? '#96C9DD' : '#F3D5A7'], [1, birth ? '#F9F0DC' : '#9A682E']];
  const pours = kind === 'death' ? [[0, .88, .46]] : [[0, 1.55, .08], [0, 1.2, .16], [0, .88, .46], [-.39, .23, .65], [.61, .055, .6], [-.65, .012, .8]];
  for (const strand of kind === 'death' ? [0] : [0, 1]) for (const [offset, thickness, opacity] of pours) {
    const cache = new Map();
    const shape = ms => { if (!cache.has(ms)) cache.set(ms, svgShape(inkRibbon(time(ms) / 1000, strand, offset, thickness))); return cache.get(ms); };
    const fill = offset > 0 || offset === -.65 ? solid(birth ? '#FAF6E8' : '#FFE6B0') : gradient(foil,
      animated(ms => { const b = bounds(shape(ms)); return [b[0], b[3]]; }, frames),
      animated(ms => { const b = bounds(shape(ms)); return [b[0] + .9 * (b[2] - b[0]), b[1]]; }, frames));
    layers.unshift(layer(`Ink ${strand} / ${offset} / ${thickness}`, [{ ty: 'sh', ks: animated(shape, frames, true), d: 1 }, fill], scalar(t => opacity * (kind === 'death' ? .065 : birth ? .42 : .92 - .52 * smooth(1300, 2100, t)) * 100)));
  }
  if (kind !== 'death') {
    const name = layer(birth ? 'A New Life Begins' : 'Dreams', [
      ...commandsToShapes(lettering[birth ? 'birth' : 'welcome']).map(outline),
      birth ? solid('#17354F') : gradient([[0, '#FFF5D7'], [.52, '#FFE6B0'], [1, '#C99B58']], fixed([100, 395]), fixed([260, 438])),
    ], birth ? scalar(t => smooth(420, 650, t) * (1 - smooth(1100, 1390, t)) * 100) : fixed(100));
    if (!birth) {
      // Subtitle shares the wordmark's reveal; separate group keeps its fill.
      const subtitle = layer('LIFE SIMULATOR', [...commandsToShapes(lettering.subtitle).map(outline), solid('#F3D5A7')]);
      subtitle.hasMask = true; name.hasMask = true;
      subtitle.masksProperties = [mask(animated(ms => svgShape(inkFront(smooth(400, 1400, time(ms)), .7 + time(ms) / 2000)), frames, true))];
      name.masksProperties = subtitle.masksProperties; layers.unshift(subtitle);
    }
    layers.unshift(name);
  } else {
    [[58, 530], [102, 370], [163, 480], [227, 320], [285, 520], [343, 400]].forEach(([x, y], i) => {
      const ember = layer(`Ember ${i}`, [outline(svgShape(`M ${x} ${y} L ${x + 1.2} ${y - 3} L ${x + 2.4} ${y} L ${x + 1.2} ${y + 3} Z`)), solid('#F3D5A7')], scalar(t => smooth(280 + i * 40, 800, t) * (1 - smooth(850, 1550 - i * 40, t)) * 65));
      ember.ks.p = animated(ms => [0, -time(ms) / 1800 * (20 + i * 4), 0], frames); layers.unshift(ember);
    });
  }
  const cover = { ddd: 0, ind: ++index, ty: 0, hasMask: true, nm: 'Liquid cover and reveal', refId: 'ink', w: 400, h: 900, sr: 1, ks: transform(), ao: 0, ip: 0, op: frames + 1, st: 0, bm: 0,
    masksProperties: [mask(animated(ms => svgShape(inkFront(coverageAt(kind, ms), time(ms) / 1700)), frames, true))] };
  return { v: '5.12.2', fr: FPS, ip: 0, op: frames, w: 400, h: 900, nm: `Dreams ${kind}`, ddd: 0, assets: [{ id: 'ink', layers }], layers: [cover], markers: [{ tm: COVER_TIME[kind] * FPS / 1000, cm: 'covered', dr: 0 }] };
}
function archive(kind) {
  const data = generate(kind), encoded = strToU8(JSON.stringify(data));
  // Fixed ZIP timestamps make --check reproducible on every machine.
  const options = { level: 9, mtime: new Date(2026, 9, 22, 0, 0, 0) };
  return zipSync({ 'manifest.json': [strToU8(JSON.stringify({ version: '1.0', generator: 'Dreams offline ink authoring', animations: [{ id: kind }] })), options], [`animations/${kind}.json`]: [encoded, options] }, options);
}
if (require.main === module) {
  for (const kind of Object.keys(DURATION)) {
    const output = path.join(root, 'assets/cinematics', kind + '.lottie'), bytes = archive(kind);
    if (process.argv.includes('--check')) {
      if (!fs.existsSync(output) || !fs.readFileSync(output).equals(bytes)) throw Error(`Regenerate ${output}`);
    } else fs.writeFileSync(output, bytes);
    console.log(`${kind}: ${DURATION[kind]} ms, ${FPS} fps, ${bytes.length} bundled bytes`);
  }
}
module.exports = { generate, archive, loadTS };
