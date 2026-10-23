const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
async function main() {
  const out = path.resolve(__dirname, '../docs/verification/cult-career');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 940, height: 1000 },
      deviceScaleFactor: 2,
    });
    const errors = [],
      requests = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('request', (request) => {
      if (/^https?:/.test(request.url())) requests.push(request.url());
    });
    await page.setContent(
      fs.readFileSync(
        process.env.DREAMS_CULT_REVIEW_HTML || '/tmp/dreams-cult-review.html',
        'utf8',
      ),
      { waitUntil: 'networkidle' },
    );
    await page.evaluate(() => window.polishReviewReady);
    const sections = await page
      .locator('.pair')
      .evaluateAll((nodes) => nodes.map((node) => node.id));
    const scrollChecks = [];
    for (const id of sections) {
      const section = page.locator('#' + id);
      await section.screenshot({
        path: path.join(out, id + '.png'),
        animations: 'disabled',
      });
      {
        const check = await section.locator('.phone').evaluate((phone) => {
          const scrolls = [...phone.querySelectorAll('.rn-scroll')];
          const scroll = scrolls.at(-1);
          if (!scroll) return { tree: phone.dataset.tree, scroll: false };
          scroll.scrollTop = scroll.scrollHeight;
          const last = [...scroll.querySelectorAll('[role="button"]')].at(-1);
          const frame = scroll.getBoundingClientRect(),
            button = last?.getBoundingClientRect();
          return {
            tree: phone.dataset.tree,
            scroll: true,
            lastActionVisible:
              !button ||
              (button.top >= frame.top - 1 &&
                button.bottom <= frame.bottom + 1),
          };
        });
        scrollChecks.push(check);
        await section.screenshot({
          path: path.join(out, id + '-actions.png'),
          animations: 'disabled',
        });
      }
    }
    const layout = await page.evaluate(() => ({
      allImagesDecoded: [...document.images].every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
      phoneOverflow: [...document.querySelectorAll('.phone')]
        .filter((phone) => phone.scrollWidth > phone.clientWidth + 1)
        .map((phone) => phone.dataset.tree),
      imageCount: document.images.length,
    }));
    const report = {
      renderer:
        'Browser CSS/SVG adapter of production React Native trees, not native screenshots',
      browser: browser.version(),
      captures: sections,
      scrollChecks,
      ...layout,
      errors,
      externalRequests: requests,
    };
    fs.writeFileSync(
      path.join(out, 'browser-checks.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
    console.log(JSON.stringify(report));
    if (
      errors.length ||
      requests.length ||
      !layout.allImagesDecoded ||
      layout.phoneOverflow.length ||
      scrollChecks.some((check) => check.lastActionVisible === false)
    )
      throw new Error('Cult browser review failed');
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
