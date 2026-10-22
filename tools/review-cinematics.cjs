// Optional review tooling stays outside the mobile dependency graph.
// Install esbuild/playwright/react-native-web in DREAMS_REVIEW_TOOLS first.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const toolRoot = process.env.DREAMS_REVIEW_TOOLS || '/tmp/dreams-visual';
const useTool = createRequire(path.join(toolRoot, 'package.json'));
const esbuild = useTool('esbuild'), { chromium } = useTool('playwright');
const output = path.resolve(process.argv.slice(2).find(arg => !arg.startsWith('--')) || '/tmp/dreams-cinematic-review');
fs.mkdirSync(output, { recursive: true });
const adapter = path.join(root, 'tools/cinematic-review/adapter.ts');
(async () => {
  await esbuild.build({ entryPoints: [path.join(root, 'tools/cinematic-review.tsx')], bundle: true, outfile: path.join(output, 'scene.js'), platform: 'browser', format: 'iife',
    banner: { js: 'var process={env:{NODE_ENV:"development"}}; var global=globalThis;' },
    define: { 'process.env.NODE_ENV': '"development"', __DEV__: 'true', 'process.env.EXPO_OS': '"web"' },
    resolveExtensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: { 'react-native': path.join(toolRoot, 'node_modules/react-native-web'), react: path.join(root, 'node_modules/react'), 'react-dom': path.join(root, 'node_modules/react-dom'), 'expo-router': adapter },
    plugins: [{ name: 'read-only-game-fixtures', setup(build) { build.onResolve({ filter: /state\/useGame$/ }, () => ({ path: adapter })); build.onResolve({ filter: /^node:async_hooks$/ }, () => ({ path: 'server-only', namespace: 'unused-browser-server-context' })); build.onLoad({ filter: /.*/, namespace: 'unused-browser-server-context' }, () => ({ contents: 'export class AsyncLocalStorage { constructor(){throw Error("Server context cannot run in this browser review")} }' })); } }],
    loader: { '.js': 'jsx', '.ttf': 'file', '.png': 'file', '.wav': 'file' },
  });
  fs.writeFileSync(path.join(output, 'index.html'), '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{margin:0;width:100%;height:100%;overflow:hidden}#root{display:flex}#root>div{flex:1}</style><div id="root"></div><script src="/scene.js"></script>');
  const server = http.createServer((req, res) => {
    const name = new URL(req.url, 'http://localhost').pathname;
    const file = path.join(output, name === '/' ? 'index.html' : name);
    if (!file.startsWith(output + path.sep)) { res.writeHead(403).end(); return; }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.png') ? 'image/png' : file.endsWith('.ttf') ? 'font/ttf' : 'text/html');
    fs.createReadStream(file).on('error', () => res.writeHead(404).end()).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.env.DREAMS_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const [width, height] = (process.env.DREAMS_REVIEW_VIEWPORT || '400x900').split('x').map(Number);
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    page.on('pageerror', error => { throw error; });
    const base = `http://127.0.0.1:${server.address().port}`;
    const times = { welcome: [0, 400, 700, 1000, 1400, 1900, 2300, 2450, 2600], birth: [0, 200, 450, 620, 850, 1050, 1250, 1500], death: [0, 240, 480, 760, 1000, 1280, 1500, 1800] };
    for (const [kind, stamps] of Object.entries(times)) {
      await page.goto(`${base}/?kind=${kind}`); await page.waitForFunction(() => window.ready); await page.evaluate(() => document.fonts.ready);
      for (const t of stamps) { await page.evaluate(t => window.seek(t), t); await page.waitForTimeout(50); await page.screenshot({ path: path.join(output, `${kind}-${t}.png`) }); }
    }
    if (process.argv.includes('--film')) {
      await page.goto(`${base}/?kind=welcome`); await page.waitForFunction(() => window.ready); await page.evaluate(() => document.fonts.ready);
      fs.mkdirSync(path.join(output, 'frames'), { recursive: true });
      for (let i = 0; i <= 93; i++) { await page.evaluate(t => window.seek(t), Math.min(2600, i / 30 * 1000)); await page.waitForTimeout(34); await page.screenshot({ path: path.join(output, 'frames', `${String(i).padStart(3, '0')}.png`) }); }
    }
    console.log(`Rendered real component frames to ${output}`);
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
