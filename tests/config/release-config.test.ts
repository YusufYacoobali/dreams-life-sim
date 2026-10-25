import { AndroidConfig } from 'expo/config-plugins';
import { getConfig } from 'expo/config';
import { resolve } from 'node:path';

const { expo } = require('../../app.json');

test.each([
  ['production', 'store', '1'],
  ['production', 'store', '0'],
  ['production', 'internal', '1'],
  ['internal', 'store', '0'],
  ['internal', 'internal', '1'],
  ['preview', '', ''],
  ['unknown', '', '0'],
  ['', '', ''],
  ['', '', '0'],
  ['', '', '1'],
] as const)('resolved Expo config retains God Mode testing for profile=%s distribution=%s flag=%s', (profile, distribution, flag) => {
  const previous = { ...process.env };
  try {
    process.env.EAS_BUILD_PROFILE = profile;
    process.env.EAS_BUILD_DISTRIBUTION = distribution;
    process.env.DREAMS_GOD_MODE_TESTING = flag;
    const { exp } = getConfig(resolve(__dirname, '../..'), { skipPlugins: true });
    expect(exp.extra?.godModeTesting).toBe(true);
    expect(require('../../eas.json').build.production.env.DREAMS_GOD_MODE_TESTING).toBe('1');
    expect(exp.android?.package).toBe('com.yacoobali.lifesim');
    expect(exp.ios?.bundleIdentifier).toBe('com.yacoobali.lifesim');
    expect(exp.android?.blockedPermissions).toEqual(expo.android.blockedPermissions);
  } finally { process.env = previous; }
});

test('native permission policy removes unused overlay, broad storage and recording while preserving local reminders', () => {
  const blocked = [
    'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.RECORD_AUDIO',
  ], keep = [
    'android.permission.INTERNET',
    'android.permission.VIBRATE',
    'android.permission.RECEIVE_BOOT_COMPLETED',
    'android.permission.POST_NOTIFICATIONS',
  ];
  expect(expo.android.blockedPermissions).toEqual(blocked);
  const manifest = AndroidConfig.Permissions.addBlockedPermissions({ manifest: {
    $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
    queries: [],
    'uses-permission': [...blocked, ...keep].map(name => ({ $: { 'android:name': name } })),
  } }, expo.android.blockedPermissions);
  for (const name of blocked) expect(manifest.manifest['uses-permission']!.filter(row => row.$['android:name'] === name))
    .toEqual([{ $: { 'android:name': name, 'tools:node': 'remove' } }]);
  for (const name of keep) expect(manifest.manifest['uses-permission']).toContainEqual({ $: { 'android:name': name } });
  expect(manifest.manifest['uses-permission']!.some(row => /SCHEDULE_EXACT_ALARM|USE_EXACT_ALARM|USE_FULL_SCREEN_INTENT/.test(row.$['android:name']))).toBe(false);
});

test('audio is configured only for foreground playback, without microphone or background service permissions', () => {
  const audio = expo.plugins.find((plugin: unknown) => Array.isArray(plugin) && plugin[0] === 'expo-audio');
  expect(audio?.[1]).toMatchObject({ microphonePermission: false, recordAudioAndroid: false, enableBackgroundPlayback: false, enableBackgroundRecording: false });
});

const withStoreReviewVisibility = require('../../plugins/withStoreReviewVisibility.cjs');
const reviewManifestMod = async (manifest: Record<string, unknown>) => {
  const config = withStoreReviewVisibility({ name: 'Dreams', slug: 'dreams-life-sim' });
  return (await config.mods.android.manifest({ ...config, modResults: manifest, modRequest: {
    projectRoot: resolve(__dirname, '../..'), platformProjectRoot: '/tmp/dreams-release-test/android',
    platform: 'android', modName: 'manifest', introspect: true,
  } })).modResults;
};

test('review visibility adds only Play Store, keeps other queries/permissions and is idempotent', async () => {
  expect(expo.plugins).toContain('./plugins/withStoreReviewVisibility.cjs');
  const intent = { action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }], data: [{ $: { 'android:scheme': 'https' } }] },
    foreign = { package: [{ $: { 'android:name': 'com.example.documents' } }], provider: [{ $: { 'android:authorities': 'com.example.files' } }] },
    permissions = [{ $: { 'android:name': 'android.permission.POST_NOTIFICATIONS' } }],
    input = { manifest: { queries: [{ intent: [structuredClone(intent)] }, structuredClone(foreign)], 'uses-permission': structuredClone(permissions) } },
    once = await reviewManifestMod(input), snapshot = structuredClone(once),
    twice = await reviewManifestMod(once);
  expect(twice).toEqual(snapshot);
  expect(twice.manifest.queries[0].intent).toEqual([intent]);
  expect(twice.manifest.queries[1]).toEqual(foreign);
  expect(twice.manifest.queries.flatMap((query: { package?: unknown[] }) => query.package ?? []))
    .toEqual([{ $: { 'android:name': 'com.android.vending' } }, ...foreign.package]);
  expect(twice.manifest['uses-permission']).toEqual(permissions);
  expect(JSON.stringify(twice)).not.toContain('QUERY_ALL_PACKAGES');
});

test('review visibility creates an absent queries section and preserves an existing Play query wherever it is', async () => {
  const minimal = await reviewManifestMod({ manifest: {} });
  expect(minimal.manifest.queries).toEqual([{ package: [{ $: { 'android:name': 'com.android.vending' } }] }]);
  const existing = { manifest: { queries: [{ intent: [] }, { package: [{ $: { 'android:name': 'com.android.vending' } }] }] } },
    original = structuredClone(existing);
  expect(await reviewManifestMod(existing)).toEqual(original);
});
