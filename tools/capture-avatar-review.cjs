// Optional browser screenshot capture. Playwright is a review-only tool; it is
// deliberately not added to the mobile app's dependencies.
// PLAYWRIGHT_MODULE=/path/to/playwright CHROMIUM_PATH=/path/to/chromium \
//   node tools/capture-avatar-review.cjs
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

async function main() {
  const directory = path.resolve(__dirname, '../docs/verification/avatar-checkpoint-a');
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 1 });
    const errors = [];
    const externalRequests = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => {
      if (/^https?:/.test(request.url())) externalRequests.push(request.url());
    });
    await page.setContent(fs.readFileSync(path.join(directory, 'index.html'), 'utf8'), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.avatarReviewReady);
    const captures = [
      ['four-prototypes', '01-four-prototypes.png'],
      ['comparison', '02-reference-current-new.png'],
      ['sizes', '03-sizes-light-dark.png'],
      ['alpha', '04-transparency.png'],
      ['baseline', '05-existing-16-grid.png'],
      ['ages', '06-existing-age-baseline.png'],
    ];
    for (const [id, file] of captures) {
      await page.locator('#' + id).screenshot({ path: path.join(directory, file), animations: 'disabled' });
    }
    const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (errors.length || externalRequests.length || desktopOverflow || mobileOverflow) {
      throw new Error(JSON.stringify({ errors, externalRequests, desktopOverflow, mobileOverflow }));
    }
    const result = { renderer: 'Chromium browser comparison; not native app screenshots', browser: browser.version(), captures: captures.map(([,file]) => file), cssSizes: [52,88,140], deviceScaleFactor: 1, desktopViewport: [1200,1000], mobileViewport: [390,844], desktopOverflow, mobileOverflow, errors, externalRequests };
    fs.writeFileSync(path.join(directory, 'browser-checks.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
