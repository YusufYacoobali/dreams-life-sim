// Keep an existing, git-ignored Android project aligned with the installed
// Expo template. No native regeneration, dependency upgrades or signing edits.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { execFileSync } = require('node:child_process');

const wrapperPath = 'android/gradle/wrapper/gradle-wrapper.properties';
const propertiesPath = 'android/gradle.properties';
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const propertyPattern = key => new RegExp('^[\\t ]*' + escape(key) + '[\\t ]*[=:][\\t ]*([^\\r\\n]*)', 'gm');
function property(text, key) { return [...text.matchAll(propertyPattern(key))].at(-1)?.[1].trim(); }
function setProperty(text, key, value) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  let found = false;
  const result = text.replace(new RegExp(propertyPattern(key).source + '(?:\\r?\\n|$)', 'gm'), match => {
    if (found) return '';
    found = true;
    const ending = match.endsWith('\r\n') ? '\r\n' : match.endsWith('\n') ? '\n' : '';
    return key + '=' + value + ending;
  });
  return found ? result : result + (result && !result.endsWith('\n') ? eol : '') + key + '=' + value + eol;
}

async function templateSettings(projectRoot) {
  const expoPackage = require.resolve('expo/package.json', { paths: [projectRoot] });
  const expoRequire = createRequire(expoPackage);
  const cliRequire = createRequire(expoRequire.resolve('@expo/cli/package.json'));
  // The same archive reader used by the installed Expo CLI; no system tar or
  // shell escaping is needed on Windows, including project paths with spaces.
  const { untar } = cliRequire('multitars');
  const archive = fs.readFileSync(path.join(path.dirname(expoPackage), 'template.tgz'));
  const templates = new Map();
  for await (const file of untar(new Blob([archive]).stream().pipeThrough(new DecompressionStream('gzip')))) {
    for (const name of [wrapperPath, propertiesPath]) if (file.name === 'package/' + name) templates.set(name, await file.text());
  }
  const distributionUrl = property(templates.get(wrapperPath) ?? '', 'distributionUrl');
  if (!distributionUrl || !templates.has(propertiesPath)) throw Error('The installed Expo Android template is incomplete. Run npm ci before repairing.');
  const flags = Object.fromEntries(['android.builtInKotlin', 'android.newDsl'].map(key => [key, property(templates.get(propertiesPath), key)]));
  if (Object.values(flags).some(value => value === undefined)) throw Error('This Expo template uses a different Android Kotlin configuration. Regenerate Android for that SDK instead of applying the SDK 58 repair.');
  return { distributionUrl, flags };
}

async function repairAndroid(projectRoot, write = false) {
  if (!fs.existsSync(path.join(projectRoot, 'android'))) return { generated: false, changes: [], backup: null };
  const settings = await templateSettings(projectRoot);
  const changes = [];
  for (const relative of [wrapperPath, propertiesPath]) {
    const file = path.join(projectRoot, relative);
    if (!fs.existsSync(file)) throw Error(relative + ' is missing. Back up native customizations, then regenerate Android with Expo prebuild.');
    const before = fs.readFileSync(file, 'utf8');
    const targets = relative === wrapperPath ? { distributionUrl: settings.distributionUrl } : settings.flags;
    let after = before;
    for (const [key, value] of Object.entries(targets)) after = setProperty(after, key, value);
    if (relative === wrapperPath && property(before, 'distributionUrl') !== settings.distributionUrl && property(before, 'distributionSha256Sum')) {
      // Preserve checksum verification when upgrading an old wrapper. This
      // digest is Gradle's published 9.4.1-bin SHA-256, not a disabled check.
      if (!settings.distributionUrl.endsWith('/gradle-9.4.1-bin.zip')) throw Error('The wrapper has a custom checksum. Update distributionUrl and distributionSha256Sum together for the installed Expo template. No files were changed.');
      after = setProperty(after, 'distributionSha256Sum', '2ab2958f2a1e51120c326cad6f385153bb11ee93b3c216c5fccebfdfbb7ec6cb');
    }
    if (after !== before) changes.push({ relative, before, after });
  }
  let backup = null;
  if (write && changes.length) {
    const directory = path.join(projectRoot, '.expo', 'android-build-backups');
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    backup = fs.mkdtempSync(path.join(directory, 'repair-'));
    // Back up every affected file before changing either one. Gradle properties
    // can contain local secrets, so backups stay private and git-ignored.
    for (const change of changes) {
      const saved = path.join(backup, change.relative);
      fs.mkdirSync(path.dirname(saved), { recursive: true, mode: 0o700 });
      fs.writeFileSync(saved, change.before, { mode: 0o600 });
    }
    for (const change of changes) fs.writeFileSync(path.join(projectRoot, change.relative), change.after);
  }
  return { generated: true, changes: changes.map(change => change.relative), backup };
}

const preparedProjects = new Set();
function prepareAndroidRun(projectRoot) {
  const root = path.resolve(projectRoot);
  // Expo handles absent/incomplete native projects itself. The synchronous
  // app-config API must wait for repairs of an existing project, so run the
  // asynchronous template reader in a child Node process, without a shell.
  if (preparedProjects.has(root) || ![wrapperPath, propertiesPath].every(file => fs.existsSync(path.join(root, file)))) return;
  const worker = 'require(process.argv[1]).repairAndroid(process.argv[2],true).then(r=>process.stdout.write(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1})';
  let result;
  try {
    result = JSON.parse(execFileSync(process.execPath, ['-e', worker, __filename, root], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  } catch (error) {
    throw Error('Android build preparation failed: ' + (error.stderr?.toString().trim() || error.message));
  }
  preparedProjects.add(root);
  if (result.changes.length) {
    console.log('Repaired Android Gradle/Kotlin settings before run:android.');
    console.log('Original files backed up to ' + result.backup);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !['--write', '--check'].includes(args[0])) {
    console.error('Usage: node tools/repair-android-build.cjs --check|--write');
    process.exitCode = 1;
  } else repairAndroid(path.resolve(__dirname, '..'), args[0] === '--write').then(result => {
    if (!result.generated) {
      console.log('Android has not been generated. Expo run:android will create it from the installed template.');
      if (args[0] === '--check') process.exitCode = 1;
    } else if (!result.changes.length) console.log('Android Gradle/Kotlin settings match the installed Expo template.');
    else if (args[0] === '--check') {
      console.error('Stale Android Gradle/Kotlin settings in: ' + result.changes.join(', ') + '. Run npm run android:repair.');
      process.exitCode = 1;
    } else {
      console.log('Repaired Android Gradle/Kotlin settings in: ' + result.changes.join(', '));
      console.log('Original files backed up to ' + result.backup);
    }
  }).catch(error => { console.error('Android toolchain repair: ' + error.message); process.exitCode = 1; });
}
module.exports = { repairAndroid, templateSettings, prepareAndroidRun };
