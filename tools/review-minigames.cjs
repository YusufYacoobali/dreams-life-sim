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
  output = path.resolve(process.argv[2] || '/tmp/dreams-minigame-review'),
  appearance = process.env.DREAMS_REVIEW_APPEARANCE === 'light' ? 'light' : 'dark',
  fontScale = Math.max(1, Number(process.env.DREAMS_REVIEW_FONT_SCALE) || 1);
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
      'process.env.DREAMS_REVIEW_APPEARANCE': JSON.stringify(appearance),
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
          build.onResolve({ filter: /^react-native$/ }, () => ({ path: 'native', namespace: 'review' }));
          build.onResolve({ filter: /components\/MiniGameScreen$/ }, () => ({ path: 'game-screen', namespace: 'review' }));
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
                name === 'native'
                  ? `import React from ${JSON.stringify(path.join(root, 'node_modules/react'))};
                     import * as Native from ${JSON.stringify(tool.resolve('react-native-web'))};
                     export * from ${JSON.stringify(tool.resolve('react-native-web'))};
                     export const useWindowDimensions=()=>({...Native.useWindowDimensions(),fontScale:${fontScale}});
                     export const Text=React.forwardRef((props,ref)=>{
                       const style=Native.StyleSheet.flatten(props.style)||{};
                       const scale=props.allowFontScaling===false?1:${fontScale};
                       return React.createElement(Native.Text,{...props,ref,style:[props.style,{
                         ...(typeof style.fontSize==='number'?{fontSize:style.fontSize*scale}:{}),
                         ...(typeof style.lineHeight==='number'?{lineHeight:style.lineHeight*scale}:{})
                       }]});
                     });`
                  : name === 'game-screen'
                    ? `import React,{useEffect} from ${JSON.stringify(path.join(root, 'node_modules/react'))};
                       import {MiniGameScreen as Actual} from ${JSON.stringify(path.join(root,'src/minigames/components/MiniGameScreen.tsx'))};
                       export function MiniGameScreen(props){useEffect(()=>{globalThis.__dreamsReviewSession=props.session;},[props.session]);return React.createElement(Actual,props);}`
                  : name === 'access'
                  ? 'export const useGodModeAccess=()=>true;'
                  : name === 'preferences'
                    ? 'export const usePreferences=select=>select({ready:true,loadFailed:false,settings:{soundEffects:false,reducedMotion:false}});'
                    : name === 'router'
                      ? 'import {useEffect} from "react";export const useFocusEffect=callback=>useEffect(callback,[callback]);export const router={back(){},push(){},replace(){},navigate(){}};'
                      : 'export class AsyncLocalStorage { constructor(){throw Error("Server context is unavailable in browser review")} }',
              resolveDir: root,
            }),
          );
        },
      },
    ],
    loader: { '.js': 'jsx', '.ttf': 'file', '.png': 'file', '.webp': 'file', '.wav': 'file' },
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
        : file.endsWith('.webp') ? 'image/webp' : file.endsWith('.png')
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
      appearance,
      fontScale,
      fontScaleModel: 'Native Text size/line-height and useWindowDimensions modeled for browser review; not a native-device accessibility claim',
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
    const session = () => page.evaluate(() => globalThis.__dreamsReviewSession);
    for (const [kind, title] of Object.entries({
      sports: 'Clutch Shot',
      crime: 'Safe Cracker',
      astronaut: 'Orbital Docking',
    })) {
      await page.goto(url);
      if (await page.getByRole('radio').count()) throw Error('The playground must not expose a difficulty selector');
      await page.getByText(title, { exact: true }).click();
      await page.getByRole('button', { name: 'Play', exact: true }).waitFor();
      const toggle = page.getByRole('switch', { name: 'Assisted controls' });
      if (await toggle.isChecked()) await toggle.uncheck();
      await page.screenshot({
        path: path.join(output, kind + '-instructions.png'),
      });
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await page.waitForTimeout(1100);
      if (await page.getByText(/LEVEL \d|Difficulty \d/).count()) throw Error('Gameplay must not show a difficulty level');
      if (kind === 'sports') {
        const box = await page.locator('svg[viewBox="0 0 400 560"]').boundingBox();
        const scale = Math.min(box.width / 400, box.height / 560),
          ox = box.x + (box.width - 400 * scale) / 2,
          oy = box.y + (box.height - 560 * scale) / 2;
        await page.mouse.move(ox + 301 * scale, oy + 155 * scale);
        await page.mouse.down();
        await page.mouse.move(ox + 321 * scale, oy + 137 * scale, { steps: 8 });
        await page.mouse.up();
      }
      await page.screenshot({ path: path.join(output, kind + '-playing.png') });
      let dockingGeometry;
      if (kind === 'astronaut') {
        dockingGeometry = await page.getByTestId('docking-control-disc').evaluate(el => {
          const disc=el.getBoundingClientRect();
          return {disc:{x:disc.x,y:disc.y,width:disc.width,height:disc.height},buttons:Array.from(el.querySelectorAll('[role="button"]')).map(button=>{
            const box=button.getBoundingClientRect();return {label:button.getAttribute('aria-label'),x:box.x,y:box.y,width:box.width,height:box.height,radius:getComputedStyle(button).borderRadius};
          })};
        });
        if (dockingGeometry.buttons.length!==5 || dockingGeometry.buttons.some(button=>button.width<48 || button.height<48 || button.width!==button.height || parseFloat(button.radius)!==button.width/2)) throw Error('Docking requires five circular 48dp+ controls');
        await page.getByRole('button',{name:'Coast',exact:true}).click();
      }
      if (kind === 'sports') {
        await page.getByRole('button', { name: 'Set aim', exact: true }).click();
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
        await page.waitForTimeout(550);
        await page.screenshot({ path: path.join(output, 'sports-shot.png') });
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
        session: await session(),
        ...(dockingGeometry?{dockingGeometry}:{}),
      });
      const finished = await session();
      if (finished?.status!=='completed' || finished.difficulty!==3 || !finished.inputs.length) throw Error('An actual fixed-difficulty typed-input result was not completed: '+kind);
      if (kind === 'astronaut' && (!finished.inputs.some(input=>input.action.direction==='coast') || !finished.inputs.some(input=>['left','right'].includes(input.action.direction)))) throw Error('Circular docking controls did not produce both coast and directional inputs');
    }
    await page.goto(url);
    await page.getByText('Safe Cracker', { exact: true }).click();
    const assisted = page.getByRole('switch', { name: 'Assisted controls' });
    if (!(await assisted.isChecked())) await assisted.check();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.waitForTimeout(1100);
    const firstAttempt = await session(),
      target = +((await page.getByText(/^Target \d+°/).textContent()).match(/Target (\d+)/)[1]),
      wrongAngle = Math.round(((target + 180) % 360) / 10) * 10 % 360;
    for (let turn = 0; turn < wrongAngle / 10; turn++)
      await page.getByRole('button', { name: 'Turn dial right ten degrees', exact: true }).click();
    for (let mistake = 0; mistake < 3; mistake++) {
      await page.getByRole('button', { name: 'Lock alignment', exact: true }).click();
      await page.waitForTimeout(80);
    }
    await page.getByText('PRACTICE RESULT', { exact: true }).waitFor({ timeout: 10000 });
    const failed = await session();
    if (failed.status!=='completed' || failed.score!==0 || failed.inputs.length!==3) throw Error('Three actual incorrect inputs must trigger the alarm');
    await page.screenshot({ path: path.join(output, 'crime-failure.png') });
    await page.getByRole('button', { name: 'Play again', exact: true }).click();
    await page.waitForTimeout(1100);
    const replay = await session();
    if (replay.id===firstAttempt.id || replay.seed===firstAttempt.seed || replay.difficulty!==3 || replay.inputs.length) throw Error('Practice replay must start a distinct clean level-3 attempt');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Resume', exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, 'crime-paused.png') });
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.getByRole('button', { name: 'Lock alignment', exact: true }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Forfeit attempt', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm forfeit', exact: true }).click();
    await page.getByText('Forfeited', { exact: true }).waitFor();
    const forfeited = await session();
    if (forfeited.status!=='forfeited' || forfeited.score!==0 || forfeited.inputs.length!==1) throw Error('Forfeit must retain the actual practice transcript');
    await page.screenshot({ path: path.join(output, 'crime-forfeited.png') });
    report.failureAndReplay = { failed, replay, forfeited, pausedAndResumed: true, scope: 'Actual isolated practice state. Durable save/retry behavior is covered separately by SQLite/UI regression suites.' };
    await page.goto(url + '/?motion=reduce');
    await page.getByText('Clutch Shot', { exact: true }).click();
    report.reducedMotion = {
      assistedDefault: await page
        .getByRole('switch', { name: 'Assisted controls' })
        .isChecked(),
    };
    await page.screenshot({ path: path.join(output, 'reduced-motion.png') });
    report.artwork = await page.evaluate(() => ({
      loaded: Array.from(document.images).every(image => image.complete && image.naturalWidth > 0),
      localOnly: performance.getEntriesByType('resource').filter(item => /\.(png|webp)/.test(item.name)).every(item => new URL(item.name).origin === location.origin),
    }));
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
