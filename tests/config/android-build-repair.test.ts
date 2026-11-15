import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const tool = join(root, 'tools/repair-android-build.cjs');
const wrapper = 'android/gradle/wrapper/gradle-wrapper.properties';
const properties = 'android/gradle.properties';
const appGradle = 'android/app/build.gradle';
const currentAppGradle = 'proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"\n';
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
function installConfig(withTool = true) {
  put('package.json', JSON.stringify({ name: 'android-build-fixture', version: '1.0.0' }));
  put('app.config.cjs', readFileSync(join(root, 'app.config.cjs')));
  put('app.json', JSON.stringify({ expo: { name: 'Build fixture', slug: 'build-fixture', android: { package: 'com.example.buildfixture' } } }));
  if (withTool) put('tools/repair-android-build.cjs', readFileSync(tool));
}
function loadConfig(command: string) {
  const code = 'const [config,root,command]=process.argv.slice(1);process.argv=[process.execPath,"expo",command,"--variant","release"];const{getConfig}=require(config);getConfig(root,{skipPlugins:true});const result=getConfig(root,{skipPlugins:true});console.log("CONFIG_RESULT "+result.exp.android.package)';
  return execFileSync(process.execPath, ['-e', code, require.resolve('expo/config'), directory, command], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

test('the installed template supplies Gradle 9.4.1, AGP 9 compatibility flags and optimized R8 defaults', () => {
  const code = 'require(process.argv[1]).templateSettings(process.argv[2]).then(r=>process.stdout.write(JSON.stringify(r)))';
  expect(JSON.parse(execFileSync(process.execPath, ['-e', code, tool, root], { encoding: 'utf8' }))).toEqual({ distributionUrl: url, flags: { 'android.builtInKotlin': 'false', 'android.newDsl': 'false' }, defaultProguardFile: 'proguard-android-optimize.txt' });
});

test.each(['\n', '\r\n'])('repair backs up stale files, preserves local native/signing settings and is idempotent with EOL=%j', eol => {
  const beforeWrapper = ['# Keep my local timeout', 'distributionUrl=https\\://services.gradle.org/distributions/gradle-9.3.1-bin.zip', 'networkTimeout=30000', 'validateDistributionUrl=true', 'distributionSha256Sum=' + '0'.repeat(64), ''].join(eol);
  const beforeProperties = ['# android.builtInKotlin=true is an old note', 'org.gradle.jvmargs=-Xmx4096m', 'newArchEnabled=true', 'hermesEnabled=true', 'local.setting=keep-me', 'android.builtInKotlin=true', 'android.builtInKotlin=true', 'android.newDsl=true', ''].join(eol);
  const beforeApp = ['apply plugin: "org.jetbrains.kotlin.android"', 'android {', '    signingConfigs { release { storeFile file("private.keystore"); keyAlias "keep-me" } }', '    buildTypes { release {', '        minifyEnabled true', '        proguardFiles getDefaultProguardFile(\'proguard-android.txt\'), "proguard-rules.pro", "custom-rules.pro"', '    } }', '}', ''].join(eol);
  put(wrapper, beforeWrapper); put(properties, beforeProperties);
  put(appGradle, beforeApp);
  put('android/app/debug.keystore', Buffer.from([1, 2, 3, 4]));
  expect(repair(false)).toEqual({ generated: true, changes: [wrapper, properties, appGradle], backup: null });
  expect(read(wrapper)).toBe(beforeWrapper); expect(read(properties)).toBe(beforeProperties);
  expect(read(appGradle)).toBe(beforeApp);
  expect(existsSync(join(directory, '.expo'))).toBe(false);
  const result = repair(true);
  expect(result.changes).toEqual([wrapper, properties, appGradle]);
  expect(readFileSync(join(result.backup, wrapper), 'utf8')).toBe(beforeWrapper);
  expect(readFileSync(join(result.backup, properties), 'utf8')).toBe(beforeProperties);
  expect(readFileSync(join(result.backup, appGradle), 'utf8')).toBe(beforeApp);
  expect(read(wrapper)).toContain('distributionUrl=' + url + eol);
  expect(read(wrapper)).toContain('distributionSha256Sum=' + checksum + eol);
  expect(read(wrapper)).toContain('networkTimeout=30000' + eol);
  expect(read(wrapper)).toContain('validateDistributionUrl=true' + eol);
  expect(read(properties)).toBe(['# android.builtInKotlin=true is an old note', 'org.gradle.jvmargs=-Xmx4096m', 'newArchEnabled=true', 'hermesEnabled=true', 'local.setting=keep-me', 'android.builtInKotlin=false', 'android.newDsl=false', ''].join(eol));
  expect(read(appGradle)).toBe(beforeApp.replace("getDefaultProguardFile('proguard-android.txt')", "getDefaultProguardFile('proguard-android-optimize.txt')"));
  expect(readFileSync(join(directory, 'android/app/debug.keystore'))).toEqual(Buffer.from([1, 2, 3, 4]));
  expect(repair(true)).toEqual({ generated: true, changes: [], backup: null });
  expect(readdirSync(dirname(result.backup))).toHaveLength(1);
});

test('a manually upgraded wrapper receives only the missing Kotlin/DSL flags', () => {
  put(wrapper, 'distributionUrl=' + url);
  put(properties, 'newArchEnabled=true\r\nhermesEnabled=true');
  put(appGradle, currentAppGradle);
  const result = repair(true);
  expect(result.changes).toEqual([properties]);
  expect(read(wrapper)).toBe('distributionUrl=' + url);
  expect(read(properties)).toBe('newArchEnabled=true\r\nhermesEnabled=true\r\nandroid.builtInKotlin=false\r\nandroid.newDsl=false\r\n');
});

test('a current generated project is left byte-for-byte unchanged', () => {
  put(wrapper, 'distributionUrl=' + url + '\nnetworkTimeout=10000\n');
  put(properties, '# Already set\nandroid.builtInKotlin=false\nandroid.newDsl=false');
  put(appGradle, currentAppGradle);
  const before = [read(wrapper), read(properties), read(appGradle)];
  expect(repair(true)).toEqual({ generated: true, changes: [], backup: null });
  expect([read(wrapper), read(properties), read(appGradle)]).toEqual(before);
  expect(existsSync(join(directory, '.expo'))).toBe(false);
});

test('an incomplete project fails before writing anything; absent Android is left for Expo to generate', () => {
  expect(repair(true)).toEqual({ generated: false, changes: [], backup: null });
  put(wrapper, 'distributionUrl=old\n');
  expect(() => repair(true)).toThrow();
  expect(read(wrapper)).toBe('distributionUrl=old\n');
  put(properties, 'android.builtInKotlin=true\n');
  expect(() => repair(true)).toThrow();
  expect(read(wrapper)).toBe('distributionUrl=old\n');
  expect(read(properties)).toBe('android.builtInKotlin=true\n');
  expect(existsSync(join(directory, '.expo'))).toBe(false);
});

test('Android npm build entry points repair the ignored native configuration before invoking Expo', () => {
  const { scripts } = require('../../package.json');
  expect(scripts.preandroid).toBe('node tools/repair-android-build.cjs --write');
  expect(scripts['preandroid:release']).toBe(scripts.preandroid);
  expect(scripts['android:release']).toBe('expo run:android --variant release');
  expect(scripts['android:repair']).toBe(scripts.preandroid);
});

test('direct Expo run:android config evaluation waits for the repair and repeated config reads create one backup', () => {
  installConfig();
  put(wrapper, 'distributionUrl=https\\://services.gradle.org/distributions/gradle-9.3.1-bin.zip\r\n');
  put(properties, 'newArchEnabled=true\r\nhermesEnabled=true\r\n');
  put(appGradle, currentAppGradle.replace('proguard-android-optimize.txt', 'proguard-android.txt'));
  const output = loadConfig('run:android');
  expect(output).toContain('Repaired Android Gradle/Kotlin/R8 settings before run:android.');
  expect(output).toContain('CONFIG_RESULT com.example.buildfixture');
  expect(read(wrapper)).toContain('distributionUrl=' + url);
  expect(read(properties)).toContain('android.builtInKotlin=false\r\nandroid.newDsl=false\r\n');
  expect(read(appGradle)).toBe(currentAppGradle);
  expect(readdirSync(join(directory, '.expo/android-build-backups'))).toHaveLength(1);
});

test.each(['config', 'start', 'export:embed', 'prebuild', 'run:ios'])('%s config reads leave Android unchanged and work without tools in an EAS archive', command => {
  installConfig(false);
  put(wrapper, 'distributionUrl=old\n'); put(properties, 'local.setting=keep-me\n');
  const staleApp = currentAppGradle.replace('proguard-android-optimize.txt', 'proguard-android.txt');
  put(appGradle, staleApp);
  expect(loadConfig(command)).toContain('CONFIG_RESULT com.example.buildfixture');
  expect(read(wrapper)).toBe('distributionUrl=old\n');
  expect(read(properties)).toBe('local.setting=keep-me\n');
  expect(read(appGradle)).toBe(staleApp);
  expect(existsSync(join(directory, '.expo'))).toBe(false);
});

test('automatic preparation leaves missing or incomplete native projects for Expo to generate', () => {
  installConfig();
  expect(loadConfig('run:android')).not.toContain('Repaired');
  expect(existsSync(join(directory, 'android'))).toBe(false);
  put(wrapper, 'distributionUrl=old\n');
  expect(loadConfig('run:android')).not.toContain('Repaired');
  expect(read(wrapper)).toBe('distributionUrl=old\n');
  expect(existsSync(join(directory, properties))).toBe(false);
  put(properties, 'local.setting=keep-me\n');
  expect(loadConfig('run:android')).not.toContain('Repaired');
  expect(read(wrapper)).toBe('distributionUrl=old\n');
  expect(read(properties)).toBe('local.setting=keep-me\n');
  expect(existsSync(join(directory, appGradle))).toBe(false);
});

test.each([
  ["getDefaultProguardFile('proguard-android.txt')", "getDefaultProguardFile('proguard-android-optimize.txt')"],
  ['getDefaultProguardFile("proguard-android.txt")', 'getDefaultProguardFile("proguard-android-optimize.txt")'],
  ['getDefaultProguardFile ( "proguard-android.txt" )', 'getDefaultProguardFile ( "proguard-android-optimize.txt" )'],
  ["getDefaultProguardFile(\r\n  'proguard-android.txt'\r\n)", "getDefaultProguardFile(\r\n  'proguard-android-optimize.txt'\r\n)"],
] as const)('an already upgraded project repairs only its obsolete R8 default: %s', (call, expected) => {
  put(wrapper, 'distributionUrl=' + url + '\n');
  put(properties, 'android.builtInKotlin=false\nandroid.newDsl=false\n');
  const before = `proguardFiles ${call}, "custom-rules.pro"\r\nproguardFiles "proguard-android.txt"\r\n`;
  put(appGradle, before);
  put('android/app/custom-rules.pro', '-keep class com.example.** { *; }\r\n');
  expect(repair(false)).toEqual({ generated: true, changes: [appGradle], backup: null });
  expect(read(appGradle)).toBe(before);
  const result = repair(true);
  expect(result.changes).toEqual([appGradle]);
  expect(readFileSync(join(result.backup, appGradle), 'utf8')).toBe(before);
  expect(read(appGradle)).toBe(before.replace(call, expected));
  expect(read('android/app/custom-rules.pro')).toBe('-keep class com.example.** { *; }\r\n');
  expect(repair(true)).toEqual({ generated: true, changes: [], backup: null });
});
