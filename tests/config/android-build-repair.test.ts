import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const tool = join(root, 'tools/repair-android-build.cjs');
const wrapper = 'android/gradle/wrapper/gradle-wrapper.properties';
const properties = 'android/gradle.properties';
const url = 'https\\://services.gradle.org/distributions/gradle-9.4.1-bin.zip';
const checksum = '2ab2958f2a1e51120c326cad6f385153bb11ee93b3c216c5fccebfdfbb7ec6cb';
let directory: string;
beforeEach(() => {
  mkdirSync(join(root, '.expo'), { recursive: true });
  directory = mkdtempSync(join(root, '.expo', 'Android build repair test '));
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));
function put(relative: string, content: string | Buffer) {
  mkdirSync(dirname(join(directory, relative)), { recursive: true });
  writeFileSync(join(directory, relative), content);
}
const read = (relative: string) => readFileSync(join(directory, relative), 'utf8');
function repair(write: boolean) {
  // Real Node 24 and the real installed Expo archive/reader, including Windows
  // paths with spaces. No Jest substitutions for the template or file writes.
  const code = 'require(process.argv[1]).repairAndroid(process.argv[2],process.argv[3]==="write").then(r=>process.stdout.write(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1})';
  return JSON.parse(execFileSync(process.execPath, ['-e', code, tool, directory, write ? 'write' : 'check'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
}

test('the installed template supplies Gradle 9.4.1 and both AGP 9 compatibility flags', () => {
  const code = 'require(process.argv[1]).templateSettings(process.argv[2]).then(r=>process.stdout.write(JSON.stringify(r)))';
  expect(JSON.parse(execFileSync(process.execPath, ['-e', code, tool, root], { encoding: 'utf8' }))).toEqual({ distributionUrl: url, flags: { 'android.builtInKotlin': 'false', 'android.newDsl': 'false' } });
});

test.each(['\n', '\r\n'])('repair backs up stale files, preserves local native/signing settings and is idempotent with EOL=%j', eol => {
  const beforeWrapper = ['# Keep my local timeout', 'distributionUrl=https\\://services.gradle.org/distributions/gradle-9.3.1-bin.zip', 'networkTimeout=30000', 'validateDistributionUrl=true', 'distributionSha256Sum=' + '0'.repeat(64), ''].join(eol);
  const beforeProperties = ['# android.builtInKotlin=true is an old note', 'org.gradle.jvmargs=-Xmx4096m', 'newArchEnabled=true', 'hermesEnabled=true', 'local.setting=keep-me', 'android.builtInKotlin=true', 'android.builtInKotlin=true', 'android.newDsl=true', ''].join(eol);
  put(wrapper, beforeWrapper); put(properties, beforeProperties);
  put('android/app/build.gradle', 'apply plugin: "org.jetbrains.kotlin.android"');
  put('android/app/debug.keystore', Buffer.from([1, 2, 3, 4]));
  expect(repair(false)).toEqual({ generated: true, changes: [wrapper, properties], backup: null });
  expect(read(wrapper)).toBe(beforeWrapper); expect(read(properties)).toBe(beforeProperties);
  expect(existsSync(join(directory, '.expo'))).toBe(false);
  const result = repair(true);
  expect(result.changes).toEqual([wrapper, properties]);
  expect(readFileSync(join(result.backup, wrapper), 'utf8')).toBe(beforeWrapper);
  expect(readFileSync(join(result.backup, properties), 'utf8')).toBe(beforeProperties);
  expect(read(wrapper)).toContain('distributionUrl=' + url + eol);
  expect(read(wrapper)).toContain('distributionSha256Sum=' + checksum + eol);
  expect(read(wrapper)).toContain('networkTimeout=30000' + eol);
  expect(read(wrapper)).toContain('validateDistributionUrl=true' + eol);
  expect(read(properties)).toBe(['# android.builtInKotlin=true is an old note', 'org.gradle.jvmargs=-Xmx4096m', 'newArchEnabled=true', 'hermesEnabled=true', 'local.setting=keep-me', 'android.builtInKotlin=false', 'android.newDsl=false', ''].join(eol));
  expect(read('android/app/build.gradle')).toBe('apply plugin: "org.jetbrains.kotlin.android"');
  expect(readFileSync(join(directory, 'android/app/debug.keystore'))).toEqual(Buffer.from([1, 2, 3, 4]));
  expect(repair(true)).toEqual({ generated: true, changes: [], backup: null });
  expect(readdirSync(dirname(result.backup))).toHaveLength(1);
});

test('a manually upgraded wrapper receives only the missing Kotlin/DSL flags', () => {
  put(wrapper, 'distributionUrl=' + url);
  put(properties, 'newArchEnabled=true\r\nhermesEnabled=true');
  const result = repair(true);
  expect(result.changes).toEqual([properties]);
  expect(read(wrapper)).toBe('distributionUrl=' + url);
  expect(read(properties)).toBe('newArchEnabled=true\r\nhermesEnabled=true\r\nandroid.builtInKotlin=false\r\nandroid.newDsl=false\r\n');
});

test('a current generated project is left byte-for-byte unchanged', () => {
  put(wrapper, 'distributionUrl=' + url + '\nnetworkTimeout=10000\n');
  put(properties, '# Already set\nandroid.builtInKotlin=false\nandroid.newDsl=false');
  const before = [read(wrapper), read(properties)];
  expect(repair(true)).toEqual({ generated: true, changes: [], backup: null });
  expect([read(wrapper), read(properties)]).toEqual(before);
  expect(existsSync(join(directory, '.expo'))).toBe(false);
});

test('an incomplete project fails before writing anything; absent Android is left for Expo to generate', () => {
  expect(repair(true)).toEqual({ generated: false, changes: [], backup: null });
  put(wrapper, 'distributionUrl=old\n');
  expect(() => repair(true)).toThrow();
  expect(read(wrapper)).toBe('distributionUrl=old\n');
  expect(existsSync(join(directory, '.expo'))).toBe(false);
});

test('Android npm build entry points repair the ignored native configuration before invoking Expo', () => {
  const { scripts } = require('../../package.json');
  expect(scripts.preandroid).toBe('node tools/repair-android-build.cjs --write');
  expect(scripts['preandroid:release']).toBe(scripts.preandroid);
  expect(scripts['android:release']).toBe('expo run:android --variant release');
  expect(scripts['android:repair']).toBe(scripts.preandroid);
});
