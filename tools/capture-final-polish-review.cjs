// Layout evidence from production React Native trees through the existing CSS
// adapter. Native text shaping, router transitions and device speed are separate.
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
async function main() {
  const out = process.env.DREAMS_FINAL_VISUAL_DIR || path.resolve(__dirname, '../docs/verification/final-polish/visuals');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage({ viewport: { width: 940, height: 1000 }, deviceScaleFactor: 2 });
    const errors = [], externalRequests = [], captures = [], actionChecks = [], modalChecks = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => { if (/^https?:/.test(request.url())) externalRequests.push(request.url()); });
    await page.setContent(fs.readFileSync(process.env.DREAMS_POLISH_REVIEW_HTML || '/tmp/dreams-final-review.html', 'utf8'), { waitUntil: 'networkidle' });
    await page.evaluate(() => window.polishReviewReady);
    const ids = await page.locator('.pair').evaluateAll(nodes => nodes.map(node => node.id));
    for (const id of ids) {
      const section = page.locator('#' + id);
      await section.screenshot({ path: path.join(out, id + '.png'), animations: 'disabled' }); captures.push(id + '.png');
      if (id.startsWith('partner-')) {
        const located = await section.locator('.phone').evaluateAll(phones => phones.map(phone => {
          const buttons = [...phone.querySelectorAll('[role="button"]')];
          const action = buttons.find(node => /^(Try for a Baby|Discuss Having a Baby)/.test(node.getAttribute('aria-label') || node.textContent)) || buttons.find(node => /Go on a Date/.test(node.getAttribute('aria-label') || node.textContent));
          const scroll = action?.closest('.rn-scroll');
          if (scroll) { const row = action.getBoundingClientRect(), frame = scroll.getBoundingClientRect(); scroll.scrollTop += row.top - frame.top - 90; }
          return { tree: phone.dataset.tree, located: !!action, action: action?.getAttribute('aria-label') || action?.textContent };
        }));
        actionChecks.push(...located);
        await section.screenshot({ path: path.join(out, id + '-baby-actions.png'), animations: 'disabled' }); captures.push(id + '-baby-actions.png');
      }
      await section.locator('.rn-scroll').evaluateAll(nodes => nodes.forEach(node => { node.scrollTop = node.scrollHeight; }));
      await section.screenshot({ path: path.join(out, id + '-bottom.png'), animations: 'disabled' }); captures.push(id + '-bottom.png');
      modalChecks.push(...await section.locator('.phone').evaluateAll(phones => phones.flatMap(phone => {
        const modal = phone.querySelector('.rn-modal'); if (!modal) return [];
        const scroll = modal.querySelector('.rn-scroll'), buttons = [...modal.querySelectorAll('[role="button"]')];
        const fixed = buttons.filter(node => !scroll?.contains(node)).at(-1), last = fixed || buttons.at(-1);
        if (!last) return [];
        const frame = (fixed ? phone : scroll || phone).getBoundingClientRect(), bounds = last.getBoundingClientRect();
        return [{ tree: phone.dataset.tree, lastActionVisible: bounds.top >= frame.top - 1 && bounds.bottom <= frame.bottom + 1 }];
      })));
    }
    const layout = await page.evaluate(() => {
      const clips = [...document.querySelectorAll('svg clipPath[id]')].map(node => node.id);
      return {
        allImagesDecoded: [...document.images].every(image => image.complete && image.naturalWidth > 0),
        fontLoaded: document.fonts.check('20px Ionicons'), uniqueClipIds: new Set(clips).size === clips.length,
        phoneOverflow: [...document.querySelectorAll('.phone')].filter(phone => phone.scrollWidth > phone.clientWidth + 1).map(phone => phone.dataset.tree),
        images: document.images.length,
      };
    });
    const report = { renderer: 'Browser CSS/SVG adapter of production RN trees, NOT native screenshots or native navigation proof', browser: browser.version(), captures, actionChecks, modalChecks, ...layout, errors, externalRequests };
    fs.writeFileSync(path.join(out, 'browser-checks.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ captures: captures.length, ...layout, errors, externalRequests }));
    if (errors.length || externalRequests.length || !layout.allImagesDecoded || !layout.fontLoaded || !layout.uniqueClipIds || layout.phoneOverflow.length || actionChecks.some(row => !row.located) || modalChecks.some(row => !row.lastActionVisible)) throw new Error('Final polish layout review failed; see browser-checks.json');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
