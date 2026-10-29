// Browser layout evidence from actual RN component trees, not native captures.
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
async function main() {
  const out = path.resolve(__dirname, '../docs/verification/next-polish');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage({ viewport: { width: 940, height: 1000 }, deviceScaleFactor: 2 });
    const errors = [], externalRequests = [], captures = [], modalActions = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => { if (/^https?:/.test(request.url())) externalRequests.push(request.url()); });
    await page.setContent(fs.readFileSync(process.env.DREAMS_POLISH_REVIEW_HTML || '/tmp/dreams-next-polish-review.html', 'utf8'), { waitUntil: 'networkidle' });
    await page.evaluate(() => window.polishReviewReady);
    const sections = await page.locator('.pair').evaluateAll(nodes => nodes.map(node => node.id));
    for (const id of sections) {
      const section = page.locator('#' + id);
      const file = id + '.png';
      await section.screenshot({ path: path.join(out, file), animations: 'disabled' });
      captures.push(file);
      const scrollers = section.locator('.rn-scroll');
      if (await scrollers.count()) {
        await scrollers.evaluateAll(nodes => nodes.forEach(node => { node.scrollTop = node.scrollHeight; }));
        const bottomFile = id + '-bottom.png';
        await section.screenshot({ path: path.join(out, bottomFile), animations: 'disabled' });
        captures.push(bottomFile);
      }
      modalActions.push(...await section.locator('.phone').evaluateAll(phones => phones.flatMap(phone => {
        const scroll = phone.querySelector('.rn-modal .rn-scroll');
        if (!scroll) return [];
        scroll.scrollTop = scroll.scrollHeight;
        const buttons = scroll.querySelectorAll('[role="button"]'), last = buttons[buttons.length - 1];
        const end = last?.getBoundingClientRect(), frame = scroll.getBoundingClientRect();
        return [{ tree: phone.dataset.tree, lastActionVisible: !!end && end.bottom <= frame.bottom + 1 && end.top >= frame.top - 1 }];
      })));
    }
    const checks = await page.evaluate(() => {
      const clipIds = [...document.querySelectorAll('svg clipPath[id]')].map(node => node.id);
      return {
        allImagesDecoded: [...document.images].every(image => image.complete && image.naturalWidth > 0),
        uniqueClipIds: new Set(clipIds).size === clipIds.length,
        clipReferencesResolve: [...document.querySelectorAll('svg [clip-path]')].every(node => node.closest('svg').contains(document.getElementById(node.getAttribute('clip-path').slice(5, -1)))),
        phoneOverflow: [...document.querySelectorAll('.phone')].filter(phone => phone.scrollWidth > phone.clientWidth + 1).map(phone => phone.dataset.tree),
        fontLoaded: document.fonts.check('20px Ionicons'),
      };
    });
    const result = { renderer: 'Browser CSS/SVG adapter of production React Native trees; NOT native screenshots', browser: browser.version(), captures, modalActions, ...checks, errors, externalRequests };
    fs.writeFileSync(path.join(out, 'browser-checks.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result));
    if (errors.length || externalRequests.length || !checks.allImagesDecoded || !checks.uniqueClipIds || !checks.clipReferencesResolve || !checks.fontLoaded || checks.phoneOverflow.length || modalActions.some(check => !check.lastActionVisible)) throw new Error('Review rendering failed; see browser-checks.json');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
