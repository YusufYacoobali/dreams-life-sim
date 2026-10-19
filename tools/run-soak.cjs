const { spawnSync } = require('node:child_process');
const count = process.argv[2] ?? '120';
if (!/^\d+$/.test(count) || Number(count) < 1 || Number(count) > 1000) {
  process.stderr.write('Usage: npm run test:soak -- [life count from 1 to 1000; default 120]\n');
  process.exit(1);
}
const result = spawnSync(process.execPath, [require.resolve('jest/bin/jest'), '--runInBand', 'tests/game/engine.test.ts'], { env: { ...process.env, DREAMS_LIFE_SWEEP: count }, stdio: 'inherit' });
if (result.error) process.stderr.write(result.error.message + '\n');
process.exit(result.status ?? 1);
