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
    const scrolledCaptures = [];
    for (const [screen, label] of [['activities', 'Travel'], ['activities', 'Saved Lives'], ['assets', 'Investments'], ['trip-companions', 'Travel With'], ['emigration', 'Move With'], ['rented-assets-android', 'Your Residence'], ['rented-assets-ios', 'Your Residence']]) {
      for (const theme of ['light', 'dark-large']) {
        const id = screen + '-' + theme;
        await page.locator('#' + id + ' .phone').evaluateAll((phones, label) => phones.forEach(phone => {
          const target = [...phone.querySelectorAll('.rn-text')].find(text => text.textContent === label);
          const scroll = target?.closest('.rn-scroll');
          if (!target || !scroll) throw new Error('Missing review scroll target: ' + label);
          scroll.scrollTop += target.getBoundingClientRect().top - scroll.getBoundingClientRect().top - 16;
        }), label);
        const file = id + '-' + label.toLowerCase().replaceAll(' ', '-') + '.png';
        await page.locator('#' + id).screenshot({ path: path.join(out, file), animations: 'disabled' }); scrolledCaptures.push(file);
      }
    }
    const modalScrollChecks = [];
    for (const id of captures.filter(id => id.startsWith('event-') && id.endsWith('dark-large'))) {
      const reachable = await page.locator('#' + id + ' .phone').evaluateAll(phones => phones.map(phone => {
        const scroll = phone.querySelector('.rn-modal .rn-scroll');
        if (!scroll) throw new Error('Missing modal scroller');
        scroll.scrollTop = scroll.scrollHeight;
        const buttons = scroll.querySelectorAll('[role="button"]'), last = buttons[buttons.length - 1];
        const end = last?.getBoundingClientRect(), frame = scroll.getBoundingClientRect();
        return { tree: phone.dataset.tree, scrollable: scroll.scrollHeight > scroll.clientHeight + 1, lastActionVisible: !!end && end.bottom <= frame.bottom + 1 && end.top >= frame.top - 1 };
      }));
      modalScrollChecks.push(...reachable);
      const file = id + '-actions.png';
      await page.locator('#' + id).screenshot({ path: path.join(out, file), animations: 'disabled' }); scrolledCaptures.push(file);
    }
    const checks = await page.evaluate(() => {
      const clips = [...document.querySelectorAll('svg clipPath[id]')], ids = clips.map(clip => clip.id);
      return { allImagesDecoded: [...document.images].every(image => image.complete && image.naturalWidth > 0), uniqueClipIds: new Set(ids).size === ids.length,
        clipReferencesResolve: [...document.querySelectorAll('svg [clip-path]')].every(el => el.closest('svg').contains(document.getElementById(el.getAttribute('clip-path').slice(5, -1)))),
        phoneOverflow: [...document.querySelectorAll('.phone')].filter(phone => phone.scrollWidth > phone.clientWidth + 1).map(phone => phone.dataset.tree),
        imageCount: document.images.length, fontLoaded: document.fonts.check('20px Ionicons') };
    });
    const result = { renderer: 'Browser CSS/SVG adapter of production React Native trees; NOT native screenshots', browser: browser.version(), deviceScaleFactor: 2, captures, scrolledCaptures, modalScrollChecks, ...checks, errors, externalRequests };
    fs.writeFileSync(path.join(out, 'browser-checks.json'), JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify(result));
    if (errors.length || externalRequests.length || !checks.allImagesDecoded || !checks.uniqueClipIds || !checks.clipReferencesResolve || !checks.fontLoaded || checks.phoneOverflow.length || modalScrollChecks.some(check => !check.lastActionVisible)) throw new Error('Review rendering failed; see browser-checks.json');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
