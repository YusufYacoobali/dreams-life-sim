// Verify exact refined runtime sources in both production Hermes exports.
// Bundle inclusion is not native-device or signed-store-build acceptance.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const directory = process.argv[2];
const destination = process.argv[3];
if (!directory || !destination) throw Error('Usage: node tools/verify-crime-romance-refinement-export.cjs EXPORT_DIRECTORY REPORT_JSON');
const baseline = 'fc2294b476fec72a77a9a863c7994b025ebe241f';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const changed = execFileSync('git', ['diff', '--name-only', baseline, '--', 'src', 'app'], { cwd: root, encoding: 'utf8' })
  .trim().split('\n').filter(file => /\.[jt]sx?$/.test(file));
const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'src', 'app'], { cwd: root, encoding: 'utf8' })
  .trim().split('\n').filter(file => /\.[jt]sx?$/.test(file));
const sources = Object.fromEntries([...new Set([...changed, ...untracked])].sort().map(file => [file, sha(fs.readFileSync(path.join(root, file)))]));
if (!Object.keys(sources).length) throw Error('No refinement runtime sources found');
const report = {
  baseline,
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  command: 'npx expo export --platform all --max-workers 1 --source-maps',
  scope: 'Production Hermes bundle source inclusion; installed-device acceptance unverified',
  runtimeSources: sources,
  platforms: [],
};
for (const platform of ['android', 'ios']) {
  const folder = path.join(directory, '_expo/static/js', platform);
  const files = fs.readdirSync(folder).filter(file => file.endsWith('.hbc'));
  if (files.length !== 1) throw Error('Expected one Hermes bundle for ' + platform);
  const file = path.join(folder, files[0]), bytes = fs.readFileSync(file);
  const map = JSON.parse(fs.readFileSync(file + '.map', 'utf8'));
  const missing = [], mismatched = [];
  for (const [relative, expected] of Object.entries(sources)) {
    const index = map.sources.findIndex(source => source === relative || source.endsWith('/' + relative));
    if (index === -1) missing.push(relative);
    else if (typeof map.sourcesContent[index] !== 'string' || sha(map.sourcesContent[index]) !== expected) mismatched.push(relative);
  }
  report.platforms.push({ platform, file: path.relative(directory, file), bytes: bytes.length, sha256: sha(bytes), hermesMagic: bytes.subarray(0, 8).toString('hex'), missing, mismatched });
}
fs.writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ sources: Object.keys(sources).length, platforms: report.platforms }));
if (report.platforms.some(platform => platform.missing.length || platform.mismatched.length || platform.hermesMagic !== 'c61fbc03c103191f')) process.exitCode = 1;
