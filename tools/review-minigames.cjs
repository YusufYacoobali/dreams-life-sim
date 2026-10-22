// Browser interaction of the real isolated playground and gameplay components.
// This does not claim native-device frame-rate or touch-latency verification.
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..'),
  toolRoot = process.env.DREAMS_REVIEW_TOOLS || '/tmp/dreams-visual',
  tool = createRequire(path.join(toolRoot, 'package.json'));
const esbuild = tool('esbuild'),
  { chromium } = tool('playwright'),
  output = path.resolve(process.argv[2] || '/tmp/dreams-minigame-review');
fs.mkdirSync(output, { recursive: true });
(async () => {
  await esbuild.build({
    entryPoints: [path.join(root, 'tools/minigame-review/scene.tsx')],
    bundle: true,
    outfile: path.join(output, 'scene.js'),
    platform: 'browser',
    format: 'iife',
    banner: {
      js: 'var process={env:{NODE_ENV:"development"}};var global=globalThis;',
    },
    define: {
      'process.env.NODE_ENV': '"development"',
      __DEV__: 'true',
      'process.env.EXPO_OS': '"web"',
    },
    resolveExtensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ],
    alias: {
      'react-native': path.join(toolRoot, 'node_modules/react-native-web'),
      react: path.join(root, 'node_modules/react'),
      'react-dom': path.join(root, 'node_modules/react-dom'),
      'lottie-web': tool.resolve('lottie-web'),
      'lottie-react-native': path.join(
        root,
        'tools/minigame-review/lottie.tsx',
      ),
    },
    plugins: [
      {
        name: 'isolated-internal-playground',
        setup(build) {
          build.onResolve({ filter: /ui\/GodModeAccess$/ }, () => ({
            path: 'access',
            namespace: 'review',
          }));
          build.onResolve({ filter: /state\/usePreferences$/ }, () => ({
            path: 'preferences',
            namespace: 'review',
          }));
          build.onResolve({ filter: /^expo-router$/ }, () => ({
            path: 'router',
            namespace: 'review',
          }));
          build.onResolve({ filter: /^node:async_hooks$/ }, () => ({
            path: 'server',
            namespace: 'review',
          }));
          build.onLoad(
            { filter: /.*/, namespace: 'review' },
            ({ path: name }) => ({
              contents:
                name === 'access'
                  ? 'export const useGodModeAccess=()=>true;'
                  : name === 'preferences'
                    ? 'export const usePreferences=select=>select({ready:true,loadFailed:false,settings:{soundEffects:false,reducedMotion:false}});'
                    : name === 'router'
                      ? 'import {useEffect} from "react";export const useFocusEffect=callback=>useEffect(callback,[callback]);export const router={back(){},push(){},replace(){},navigate(){}};'
                      : 'export class AsyncLocalStorage { constructor(){throw Error("Server context is unavailable in browser review")} }',
            }),
          );
        },
      },
    ],
    loader: { '.js': 'jsx', '.ttf': 'file', '.png': 'file', '.wav': 'file' },
  });
  fs.writeFileSync(
    path.join(output, 'index.html'),
    '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{margin:0;width:100%;height:100%;overflow:hidden}#root{display:flex}#root>div{flex:1}</style><div id="root"></div><script src="/scene.js"></script>',
  );
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname,
      file = path.join(output, pathname === '/' ? 'index.html' : pathname);
    if (!file.startsWith(output + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    res.setHeader(
      'Content-Type',
      file.endsWith('.js')
        ? 'text/javascript'
        : file.endsWith('.png')
          ? 'image/png'
          : file.endsWith('.ttf')
            ? 'font/ttf'
            : file.endsWith('.wav')
              ? 'audio/wav'
              : 'text/html',
    );
    fs.createReadStream(file)
      .on('error', () => res.writeHead(404).end())
      .pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    executablePath: process.env.DREAMS_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const errors = [],
    report = {
      renderer:
        'Chromium/react-native-web; real gameplay components, practice state only',
      nativeDevice: false,
      viewport: process.env.DREAMS_REVIEW_VIEWPORT || '400x900',
      scenarios: [],
    };
  try {
    const [width, height] = report.viewport.split('x').map(Number),
      page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1,
      });
    page.on('pageerror', (error) => errors.push(String(error)));
    const url = 'http://127.0.0.1:' + server.address().port;
    for (const [kind, title] of Object.entries({
      sports: 'Clutch Shot',
      crime: 'Safe Cracker',
      astronaut: 'Orbital Docking',
    })) {
      await page.goto(url);
      await page.getByText(title, { exact: true }).click();
      await page.getByRole('button', { name: 'Play', exact: true }).waitFor();
      const toggle = page.getByRole('switch', { name: 'Assisted controls' });
      if (await toggle.isChecked()) await toggle.uncheck();
      await page.screenshot({
        path: path.join(output, kind + '-instructions.png'),
      });
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await page.waitForTimeout(1100);
      await page.screenshot({ path: path.join(output, kind + '-playing.png') });
      if (kind === 'sports') {
        await page
          .getByRole('button', { name: 'Aim right', exact: true })
          .click();
        await page
          .getByRole('button', { name: 'Aim higher', exact: true })
          .click();
        await page.waitForFunction(
          () => {
            const rect = document.querySelector('[id$="-power"]');
            return (
              rect &&
              +rect.getAttribute('width') > 195 &&
              +rect.getAttribute('width') < 215
            );
          },
          {},
          { timeout: 9000 },
        );
        await page.getByRole('button', { name: 'Shoot', exact: true }).click();
      } else if (kind === 'crime') {
        for (let i = 0; i < 3; i++) {
          const line = await page.getByText(/^Target \d+°/).textContent(),
            target = +line.match(/Target (\d+)/)[1];
          await page.waitForFunction(
            (target) => {
              const dial = document.querySelector('[id$="-dial"]'),
                m = dial?.transform.baseVal.consolidate()?.matrix;
              if (!m) return false;
              const angle =
                ((Math.atan2(m.b, m.a) * 180) / Math.PI + 360) % 360;
              return Math.abs(((angle - target + 540) % 360) - 180) < 5;
            },
            target,
            { timeout: 9000 },
          );
          await page
            .getByRole('button', { name: 'Lock alignment', exact: true })
            .click();
          await page.waitForTimeout(70);
        }
      } else {
        for (let step = 0; step < 65; step++) {
          if (await page.getByText('PRACTICE RESULT', { exact: true }).count())
            break;
          const coordinates = await page
              .locator('[id$="-ship"]')
              .evaluate((el) => {
                const m = el.transform.baseVal.consolidate().matrix;
                return {
                  x: m.e / 400,
                  y: m.f / 560,
                  vx: (Math.atan2(m.b, m.a) * 180) / Math.PI / 90,
                };
              }),
            { x, y, vx } = coordinates;
          const time = (y - 0.24) / 0.058,
            projected = x + vx * time,
            options = [
              ['Thrust left', x + (vx - 0.022) * time],
              ['Thrust right', x + (vx + 0.022) * time],
            ].sort((a, b) => Math.abs(a[1] - 0.5) - Math.abs(b[1] - 0.5));
          if (
            time > 0 &&
            Math.abs(options[0][1] - 0.5) + 0.004 < Math.abs(projected - 0.5)
          )
            await page
              .getByRole('button', { name: options[0][0], exact: true })
              .click();
          await page.waitForTimeout(200);
        }
      }
      await page
        .getByText('PRACTICE RESULT', { exact: true })
        .waitFor({ timeout: 18000 });
      await page.screenshot({ path: path.join(output, kind + '-result.png') });
      report.scenarios.push({
        kind,
        played: true,
        result: (await page.locator('body').innerText())
          .split('PRACTICE RESULT')[1]
          ?.slice(0, 240),
      });
    }
    await page.goto(url + '/?motion=reduce');
    await page.getByText('Clutch Shot', { exact: true }).click();
    report.reducedMotion = {
      assistedDefault: await page
        .getByRole('switch', { name: 'Assisted controls' })
        .isChecked(),
    };
    await page.screenshot({ path: path.join(output, 'reduced-motion.png') });
    report.errors = errors;
    fs.writeFileSync(
      path.join(output, 'browser-checks.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
    if (errors.length) throw Error(errors.join('\n'));
    console.log(JSON.stringify(report));
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
