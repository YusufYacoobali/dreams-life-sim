const fs = require('node:fs'), path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
async function main() {
  const out = path.resolve(__dirname, '../docs/verification/product-polish'); fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage({ viewport: { width: 940, height: 1000 }, deviceScaleFactor: 2 });
    const errors = [], externalRequests = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => { if (/^https?:/.test(request.url())) externalRequests.push(request.url()); });
    await page.setContent(fs.readFileSync(process.env.DREAMS_POLISH_REVIEW_HTML || '/tmp/dreams-polish-review.html', 'utf8'), { waitUntil: 'networkidle' });
    await page.evaluate(() => window.polishReviewReady);
    const captures = await page.locator('.pair').evaluateAll(sections => sections.map(section => section.id));
    for (const id of captures) await page.locator('#' + id).screenshot({ path: path.join(out, id + '.png'), animations: 'disabled' });
    const checks = await page.evaluate(() => {
      const clips = [...document.querySelectorAll('svg clipPath[id]')], ids = clips.map(clip => clip.id);
      return { allImagesDecoded: [...document.images].every(image => image.complete && image.naturalWidth > 0), uniqueClipIds: new Set(ids).size === ids.length,
        clipReferencesResolve: [...document.querySelectorAll('svg [clip-path]')].every(el => el.closest('svg').contains(document.getElementById(el.getAttribute('clip-path').slice(5, -1)))),
        phoneOverflow: [...document.querySelectorAll('.phone')].filter(phone => phone.scrollWidth > phone.clientWidth + 1).map(phone => phone.dataset.tree),
        imageCount: document.images.length, fontLoaded: document.fonts.check('20px Ionicons') };
    });
    const result = { renderer: 'Browser CSS/SVG adapter of production React Native trees; NOT native screenshots', browser: browser.version(), deviceScaleFactor: 2, captures, ...checks, errors, externalRequests };
    fs.writeFileSync(path.join(out, 'browser-checks.json'), JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify(result));
    if (errors.length || externalRequests.length || !checks.allImagesDecoded || !checks.uniqueClipIds || !checks.clipReferencesResolve || !checks.fontLoaded || checks.phoneOverflow.length) throw new Error('Review rendering failed; see browser-checks.json');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
