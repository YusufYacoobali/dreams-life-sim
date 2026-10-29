// Verify portable review trees against the original production test captures.
// Only Jest asset paths are normalised; this is not native-device attestation.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..'), base = process.env.DREAMS_FINAL_TREE_BASE || '/tmp/dreams-final';
const out = process.env.DREAMS_FINAL_VISUAL_DIR || path.join(root, 'docs/verification/final-polish/visuals');
const sha = bytes => createHash('sha256').update(bytes).digest('hex'), assets = new Map(), trees = [];
function portable(node) {
  if (Array.isArray(node)) { node.forEach(portable); return; }
  if (!node || typeof node !== 'object') return;
  for (const props of [node.props, node.props?.svg]) {
    const source = props?.source || props?.src, index = source?.testUri?.lastIndexOf('assets/generated/');
    if (index >= 0) {
      source.testUri = '../../../' + source.testUri.slice(index);
      const file = path.resolve(root, 'node_modules/react-native/jest', source.testUri);
      assets.set(path.relative(root, file), sha(fs.readFileSync(file)));
    }
  }
  node.children?.forEach(portable);
}
for (const version of ['before', 'after']) {
  const directory = base + '-' + version, metadataDirectory = directory + '-metadata';
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.json')).sort()) {
    const raw = fs.readFileSync(path.join(directory, file), 'utf8').trimEnd();
    const metadata = JSON.parse(fs.readFileSync(path.join(metadataDirectory, file), 'utf8'));
    assert.equal(sha(raw), metadata.treeSha256, 'Raw tree changed: ' + file);
    const expected = JSON.parse(raw); portable(expected);
    const archived = fs.readFileSync(path.join(out, 'trees-' + version, file), 'utf8');
    assert.equal(archived, JSON.stringify(expected) + '\n', 'More than asset paths changed: ' + file);
    trees.push({ version, file, ...metadata, portableTreeSha256: sha(archived) });
  }
}
const browser = JSON.parse(fs.readFileSync(path.join(out, 'browser-checks.json'), 'utf8'));
const images = browser.captures.map(file => {
  const bytes = fs.readFileSync(path.join(out, file));
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  return { file, bytes: bytes.length, sha256: sha(bytes), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
});
const report = {
  renderer: 'Browser CSS/SVG layout of production RN trees; NOT native screenshots, native routing or device-performance evidence',
  normalization: 'Only props.source/testUri or SVG src/testUri paths are made relative. Every original node, style, text and value remains identical to its raw React test capture.',
  trees, images, assets: Object.fromEntries(assets),
  limits: 'The worlds use explicitly prepared archive contexts. Purchases use the real SQLite/store path with a mocked router handoff. The partner-ready fixture wants children but has incompatible reproductive roles; its grey disabled reason is intentional. Other eligible partner commands and UI are exercised by the connected tests.',
};
fs.writeFileSync(path.join(out, 'capture-provenance.json'), JSON.stringify(report, null, 2) + '\n');
console.log({ verifiedTrees: trees.length, screenshots: images.length, assets: assets.size, onlyAssetPathsNormalized: true });
