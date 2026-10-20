#!/usr/bin/env node
// Candidate source/install inventory only: never executes package code or infers licensing.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
let check = false, outputRoot = root;
for (let index = 0; index < args.length; index++) {
  if (args[index] === '--check') check = true;
  else if (args[index] === '--output-dir' && args[index + 1]) outputRoot = path.resolve(args[++index]);
  else throw new Error('Usage: node tools/generate-third-party-notices.cjs [--check] [--output-dir DIRECTORY]');
}
const slash = value => value.split(path.sep).join('/');
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const readJSON = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const pkg = readJSON('package.json'), lock = readJSON('package-lock.json');
if (lock.lockfileVersion !== 3 || !lock.packages) throw new Error('Expected package-lock.json version 3 with package records');
const sortedEntries = value => Object.entries(value ?? {}).sort(([a], [b]) => compare(a, b));
if (JSON.stringify(sortedEntries(pkg.dependencies)) !== JSON.stringify(sortedEntries(lock.packages[''].dependencies))) throw new Error('Direct dependencies differ between package.json and lockfile');
const inputFiles = ['package.json', 'package-lock.json', 'app.json'];
const inputHashes = Object.fromEntries(inputFiles.map(file => [file, sha(fs.readFileSync(path.join(root, file)))]));
const installationRoot = fs.existsSync(path.join(root, 'node_modules')) ? fs.realpathSync(path.join(root, 'node_modules')) : null;
const documentsByHash = new Map();
const noticeName = name => /^(?:licen[cs]e|copying|copyright|notices?)(?:[._ -].*)?$/i.test(name) || /^third[-_ ]?party.*(?:notice|licen[cs]e)/i.test(name);
const metadataLicense = value => value === undefined ? null : value;
const installName = key => key.slice(key.lastIndexOf('node_modules/') + 'node_modules/'.length);

function textEvidence(relativePath) {
  const file = path.join(root, relativePath);
  try {
    const actual = fs.realpathSync(file);
    if (!installationRoot || actual !== installationRoot && !actual.startsWith(installationRoot + path.sep)) return { path: relativePath, status: 'outside-installation-tree' };
    const bytes = fs.readFileSync(actual), digest = sha(bytes);
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
    catch { return { path: relativePath, status: 'non-utf8', bytes: bytes.length, sha256: digest }; }
    if (!documentsByHash.has(digest)) documentsByHash.set(digest, { id: 'text-' + digest, sha256: digest, bytes: bytes.length, text, sources: [] });
    documentsByHash.get(digest).sources.push(relativePath);
    return { path: relativePath, status: 'text', bytes: bytes.length, sha256: digest, documentId: 'text-' + digest };
  } catch (error) { return { path: relativePath, status: 'unreadable', errorCode: error.code ?? error.name }; }
}

function packageNotices(directory) {
  const found = [];
  function walk(relative) {
    const absolute = path.join(root, relative);
    let entries;
    try { entries = fs.readdirSync(absolute, { withFileTypes: true }).sort((a, b) => compare(a.name, b.name)); }
    catch (error) { found.push({ path: relative, status: 'unreadable-directory', errorCode: error.code ?? error.name }); return; }
    for (const entry of entries) {
      const next = slash(path.join(relative, entry.name));
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', '.cache'].includes(entry.name)) walk(next);
      } else if (noticeName(entry.name) && (entry.isFile() || entry.isSymbolicLink())) found.push(textEvidence(next));
    }
  }
  walk(directory);
  return found.sort((a, b) => compare(a.path, b.path));
}

const directDependencies = Object.entries(pkg.dependencies).sort(([a], [b]) => compare(a, b)).map(([name, requested]) => ({ name, requested, lockPath: 'node_modules/' + name, lockedVersion: lock.packages['node_modules/' + name]?.version ?? null }));
const packages = Object.entries(lock.packages).filter(([key, value]) => key && value.dev !== true).sort(([a], [b]) => compare(a, b)).map(([lockPath, entry]) => {
  let installed = null, installStatus = 'not-installed';
  try { installed = readJSON(lockPath + '/package.json'); installStatus = installed.version === entry.version ? 'version-matched' : 'version-mismatch'; }
  catch (error) { if (error.code !== 'ENOENT') installStatus = 'unreadable-manifest'; }
  return {
    name: entry.name ?? installed?.name ?? installName(lockPath), lockPath, version: entry.version ?? null,
    rootDirectDependency: directDependencies.some(item => item.lockPath === lockPath), optional: entry.optional === true,
    os: entry.os ?? null, cpu: entry.cpu ?? null,
    lockLicense: metadataLicense(entry.license), installStatus, installedName: installed?.name ?? null,
    installedVersion: installed?.version ?? null, installedLicense: metadataLicense(installed?.license),
    noticeFiles: installed ? packageNotices(lockPath) : [],
  };
});

// Source references are evidence of use, not a complete Metro/native bundle graph.
const fontImports = new Map(), artReferences = new Map();
function sourceFiles(directory) {
  if (!fs.existsSync(path.join(root, directory))) return;
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true }).sort((a, b) => compare(a.name, b.name))) {
    const relative = slash(path.join(directory, entry.name));
    if (entry.isDirectory()) sourceFiles(relative);
    else if (entry.isFile() && /\.[jt]sx?$/.test(entry.name)) {
      const text = fs.readFileSync(path.join(root, relative), 'utf8');
      for (const match of text.matchAll(/from\s+['"]@expo\/vector-icons\/([A-Za-z0-9_-]+)['"]/g)) {
        if (!fontImports.has(match[1])) fontImports.set(match[1], new Set());
        fontImports.get(match[1]).add(relative);
      }
      for (const match of text.matchAll(/require\(\s*['"]([^'"]+\.(?:png|jpe?g|webp))['"]\s*\)/g)) {
        const asset = slash(path.relative(root, path.resolve(root, directory, match[1])));
        if (asset.startsWith('assets/generated/')) {
          if (!artReferences.has(asset)) artReferences.set(asset, new Set());
          artReferences.get(asset).add(relative);
        }
      }
    }
  }
}
sourceFiles('app'); sourceFiles('src');
const config = readJSON('app.json').expo;
for (const reference of [config.icon, config.android?.adaptiveIcon?.foregroundImage, config.android?.adaptiveIcon?.backgroundImage, config.android?.adaptiveIcon?.monochromeImage].filter(Boolean)) {
  const asset = slash(path.relative(root, path.resolve(root, reference)));
  if (!artReferences.has(asset)) artReferences.set(asset, new Set());
  artReferences.get(asset).add('app.json');
}
const binaryEvidence = relative => {
  try { const bytes = fs.readFileSync(path.join(root, relative)); return { path: relative, status: 'present', bytes: bytes.length, sha256: sha(bytes) }; }
  catch (error) { return { path: relative, status: 'unavailable', errorCode: error.code ?? error.name }; }
};
const fontEvidence = [...fontImports].sort(([a], [b]) => compare(a, b)).map(([family, sources]) => ({ family, importedBy: [...sources].sort(compare), ...binaryEvidence('node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/' + family + '.ttf') }));
const projectArt = [...artReferences].sort(([a], [b]) => compare(a, b)).map(([file, sources]) => ({ ...binaryEvidence(file), referencedBy: [...sources].sort(compare) }));
const documents = [...documentsByHash.values()].sort((a, b) => compare(a.id, b.id)).map(document => ({ ...document, sources: [...new Set(document.sources)].sort(compare) }));
const summary = {
  directDependencies: directDependencies.length, candidateNonDevLockEntries: packages.length,
  versionMatched: packages.filter(item => item.installStatus === 'version-matched').length,
  versionMismatches: packages.filter(item => item.installStatus === 'version-mismatch').length,
  notInstalled: packages.filter(item => item.installStatus === 'not-installed').length,
  missingLockLicenseMetadata: packages.filter(item => item.lockLicense === null).length,
  withoutReadableNoticeFile: packages.filter(item => !item.noticeFiles.some(file => file.status === 'text')).length,
  readableNoticeFiles: packages.flatMap(item => item.noticeFiles).filter(file => file.status === 'text').length,
  uniqueExactNoticeTexts: documents.length, detectedFontFamilies: fontEvidence.length, projectArtFiles: projectArt.length,
};
const inventory = {
  formatVersion: 1,
  scope: 'Candidate lock/install/source inventory; includes build tooling and optional packages. Not a shipped-library count, legal clearance, complete font-rights determination, or final native/Metro artifact inventory.',
  inputs: inputHashes, installationPlatform: { os: process.platform, arch: process.arch },
  selection: 'All root dependencies and lockfile package records whose dev flag is not true. License/notice filenames are searched recursively, excluding nested node_modules, .git and .cache. Directory symlinks are not followed. Text is deduplicated by exact source bytes; no SPDX value is inferred from filenames or contents.',
  evidenceLimits: 'Missing metadata is not a licensing conclusion. Installed version mismatches must be reconciled. Optional/absent files and source-only art/font references remain explicit. SDK, native Pods/AARs, OS resources, dynamic imports and the final shipped graph need artifact-level review.',
  summary, directDependencies, packages, fontEvidence, projectArt, documents,
};
const escape = value => String(value ?? '(not provided)').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
let markdown = '# Third-party notices — candidate inventory\n\n' + inventory.scope + '\n\n' +
  'Generated deterministically by `node tools/generate-third-party-notices.cjs` from the pinned inputs and installed files below. No network, package installation, package-code execution or license inference occurs. The existing root LICENSE is preserved. See [inventory method and limits](docs/THIRD_PARTY_INVENTORY.md) and [machine-readable evidence](docs/third-party-inventory.json).\n\n' +
  '## Inputs and scope\n\n' + Object.entries(inputHashes).map(([file, hash]) => '- `' + file + '` SHA-256 `' + hash + '`').join('\n') + '\n\n' +
  '**' + summary.directDependencies + ' direct dependencies; ' + summary.candidateNonDevLockEntries + ' candidate non-dev lock entries; ' + summary.versionMatched + ' installed version matches; ' + summary.notInstalled + ' not installed; ' + summary.versionMismatches + ' version mismatches.** These entries include tooling and optional packages, and are not a count of shipped libraries.\n\n' +
  summary.readableNoticeFiles + ' readable notice files are preserved as ' + summary.uniqueExactNoticeTexts + ' exact text blocks. ' + summary.missingLockLicenseMetadata + ' entries lack lock license metadata; ' + summary.withoutReadableNoticeFile + ' have no readable matching notice file in this installation. Neither condition establishes permission or prohibition. See JSON for exact missing/optional/error evidence.\n\n' +
  '## Direct dependencies\n\n| Dependency | Requested | Locked version | Lock path |\n| --- | --- | --- | --- |\n' +
  directDependencies.map(item => '| ' + [item.name, item.requested, item.lockedVersion, item.lockPath].map(escape).join(' | ') + ' |').join('\n') + '\n\n' +
  '## Candidate package evidence\n\nSPDX/license values below are copied metadata, not inferred or verified legal conclusions. Installed text applies to the recorded installed version; any mismatch requires review.\n\n| Package/version | Lock license metadata | Installation | Notice sources and text references |\n| --- | --- | --- | --- |\n' +
  packages.map(item => '| ' + [item.name + '@' + item.version + ' (' + item.lockPath + ')', item.lockLicense === null ? '(not provided)' : typeof item.lockLicense === 'string' ? item.lockLicense : JSON.stringify(item.lockLicense), item.installStatus + (item.optional ? ' · optional' : ''), item.noticeFiles.map(file => file.path + ' [' + (file.documentId ?? file.status) + ']').join('; ') || '(none found)'].map(escape).join(' | ') + ' |').join('\n') + '\n\n' +
  '## Font and project-art scope\n\nThe source-import scan detects ' + fontEvidence.map(font => font.family).join(', ') + '. Its actual font bytes and source imports are recorded in JSON; the vector-icons package and embedded vendor notice files are indexed above. Package metadata does not alone settle every font-specific notice. Only static default imports from `@expo/vector-icons/FAMILY` are detected; this is not an exhaustive final-bundle graph.\n\n' +
  'Project-generated art is separate from npm licensing. JSON records source/config-referenced image hashes; provenance is in [the generated-art record](assets/generated/README.md), [launcher provenance](docs/APP_IDENTITY_AND_BRANDING.md) and [ordinary-hobby source manifest](docs/planning/drafts/ordinary-hobby-art.json). Historic candidate labels do not establish current runtime or legal acceptance. Final native resources, store art, OS fonts and Pods/AAR notices remain outside this candidate inventory.\n\n' +
  '## Installed notice text display\n\nOriginal contents are data; preserve their upstream notices and source references. Text blocks are deduplicated only when the original byte hash matches. Exact text strings, bytes and hashes are retained in JSON. This Markdown display normalizes line endings and removes trailing line whitespace; substantive notice text is unchanged.\n\n';
for (const document of documents) {
  const display = document.text.replace(/\r\n?/g, '\n').split('\n').map(line => line.replace(/[ \t]+$/g, '')).join('\n').trimEnd();
  const longest = Math.max(2, ...[...display.matchAll(/`+/g)].map(match => match[0].length));
  const fence = '`'.repeat(longest + 1);
  markdown += '### ' + document.id + '\n\nSHA-256 `' + document.sha256 + '` · ' + document.bytes + ' original bytes.\n\nSources:\n\n' + document.sources.map(file => '- `' + file + '`').join('\n') + '\n\n' + fence + 'text\n' + display + '\n' + fence + '\n\n';
}
markdown = markdown.trimEnd() + '\n';
for (const [relative, contents] of [['THIRD_PARTY_NOTICES.md', markdown], ['docs/third-party-inventory.json', json(inventory)]]) {
  const destination = path.join(outputRoot, relative);
  if (check) {
    if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== contents) throw new Error('Candidate inventory is stale: ' + relative);
  } else { fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.writeFileSync(destination, contents); }
}
console.log(JSON.stringify({mode: check ? 'check' : 'generate', ...summary}));
