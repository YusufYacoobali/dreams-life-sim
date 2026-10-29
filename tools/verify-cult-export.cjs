const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const base =
  process.env.DREAMS_CULT_EXPORT_DIR || '/tmp/dreams-cult-integrated-export';
const evidence =
  process.env.DREAMS_CULT_REVIEW_DIR ||
  path.join(root, 'docs/verification/cult-career');
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const expected = JSON.parse(
  fs.readFileSync(path.join(evidence, 'runtime-source-hashes.json')),
);
const metadata = JSON.parse(fs.readFileSync(path.join(base, 'metadata.json')));
const assetHashes = new Set(
  fs
    .readdirSync(path.join(base, 'assets'))
    .map((file) => sha(fs.readFileSync(path.join(base, 'assets', file)))),
);
const art = JSON.parse(
  fs.readFileSync(path.join(root, 'assets/generated/cult/manifest.json')),
).files;
const report = {
  command: 'npx expo export --platform all --max-workers 1 --source-maps',
  exit: 0,
  platforms: [],
};
for (const platform of ['android', 'ios']) {
  if (!metadata.fileMetadata?.[platform])
    throw new Error('Missing platform metadata: ' + platform);
  const dir = path.join(base, '_expo/static/js', platform);
  const bundles = fs.readdirSync(dir).filter((file) => file.endsWith('.hbc'));
  if (bundles.length !== 1)
    throw new Error('Expected one final bundle for ' + platform);
  const file = path.join(dir, bundles[0]),
    bytes = fs.readFileSync(file);
  const map = JSON.parse(fs.readFileSync(file + '.map'));
  const missing = [],
    mismatches = [],
    changedSinceManifest = [];
  for (const [relative, digest] of Object.entries(expected)) {
    if (sha(fs.readFileSync(path.join(root, relative))) !== digest)
      changedSinceManifest.push(relative);
    const index = map.sources.findIndex(
      (source) => source.endsWith('/' + relative) || source === relative,
    );
    if (index < 0) missing.push(relative);
    else if (sha(map.sourcesContent[index]) !== digest)
      mismatches.push(relative);
  }
  report.platforms.push({
    platform,
    bundle: path.relative(base, file),
    bytes: bytes.length,
    sha256: sha(bytes),
    hermesMagic: bytes.subarray(0, 8).toString('hex'),
    changedSourceFiles: Object.keys(expected).length,
    missing,
    mismatches,
    changedSinceManifest,
    bundledCultImages: art.filter((row) => assetHashes.has(row.sha256)).length,
  });
}
fs.writeFileSync(
  path.join(evidence, 'platform-checks.json'),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report));
if (
  report.platforms.some(
    (platform) =>
      platform.missing.length ||
      platform.mismatches.length ||
      platform.changedSinceManifest.length ||
      platform.bundledCultImages !== 12 ||
      platform.hermesMagic !== 'c61fbc03c103191f',
  )
)
  process.exitCode = 1;
