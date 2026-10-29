// Reuses the production-tree browser adapter. This is not native rendering.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const input =
  process.env.DREAMS_CULT_REVIEW_TREES ||
  path.join(root, 'docs/verification/cult-career/trees-after');
const output =
  process.env.DREAMS_CULT_REVIEW_HTML || '/tmp/dreams-cult-review.html';
const temporary = fs.mkdtempSync(
  path.join(os.tmpdir(), 'dreams-cult-browser-'),
);
const base = path.join(temporary, 'cult');
fs.mkdirSync(base + '-before');
fs.mkdirSync(base + '-after');
try {
  for (const file of fs
    .readdirSync(input)
    .filter((file) => file.endsWith('.json')))
    fs.copyFileSync(path.join(input, file), path.join(base + '-after', file));
  if (process.env.DREAMS_CULT_REVIEW_BEFORE) {
    for (const file of fs
      .readdirSync(process.env.DREAMS_CULT_REVIEW_BEFORE)
      .filter((file) => file.endsWith('.json')))
      fs.copyFileSync(
        path.join(process.env.DREAMS_CULT_REVIEW_BEFORE, file),
        path.join(base + '-before', file),
      );
  }
  execFileSync(
    process.execPath,
    [path.join(__dirname, 'build-product-polish-review.cjs')],
    {
      cwd: root,
      env: {
        ...process.env,
        DREAMS_POLISH_TREE_BASE: base,
        DREAMS_POLISH_REVIEW_HTML: output,
      },
      stdio: 'inherit',
    },
  );
  let html = fs.readFileSync(output, 'utf8');
  html = html.replace(
    '<title>Dreams · product polish review</title>',
    '<title>Dreams · Cult Leader review</title>',
  );
  html = html.replace(
    /<h1>Dreams · product polish<\/h1>[\s\S]*?(?=<section class="pair")/,
    '<h1>Dreams · Cult Leader</h1><p>Production React Native component trees from connected SQLite/store tests, laid out with the existing browser CSS/SVG adapter. These are browser captures, not Android/iOS screenshots.</p><p class="note">Light:390×844. Dark:320×844 with1.4×text. All artwork is bundled locally. The review checks wrapping, scroll reachability and illustration crops; it does not establish native rendering or performance.</p>',
  );
  html = html.replaceAll(
    'After · integrated polish',
    'Cult Leader · integrated',
  );
  if (process.env.DREAMS_CULT_REVIEW_BEFORE) {
    html = html.replaceAll('Before · work 8891d4d', 'Before · Cult 9101307');
    html = html.replaceAll(
      'Cult Leader · integrated',
      'After · Cult gameplay polish',
    );
  }
  // Yoga's flex:0 keeps intrinsic text height; CSS's shorthand would set a
  // zero basis and collapse the stacked money labels at large font sizes.
  html = html.replace(
    "el.style.flex=value+' 1 0%';el.style.minHeight='0';",
    "el.style.flex=value===0?'0 0 auto':value+' 1 0%';if(value!==0)el.style.minHeight='0';",
  );
  // React Native Modal is a native portal even when declared inside Page's
  // ScrollView. Move that exported subtree into the browser phone's overlay.
  html = html.replace(
    'const svgImages=',
    `for (const phone of document.querySelectorAll('.phone')) {
    phone.style.position = 'relative';
    const modal = phone.querySelector('.rn-modal');
    if (modal) {
      phone.append(modal);
      Object.assign(modal.style, { position: 'absolute', inset: '0', zIndex: '10', display: 'flex', flexDirection: 'column' });
    }
  }
  const svgImages=`,
  );
  fs.writeFileSync(output, html);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
