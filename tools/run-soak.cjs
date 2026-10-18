const { spawnSync } = require('node:child_process');
const result = spawnSync(process.execPath, [require.resolve('jest/bin/jest'), '--runInBand', 'tests/game/engine.test.ts'], { env: { ...process.env, DREAMS_LIFE_SWEEP: '120' }, stdio: 'inherit' });
process.exit(result.status ?? 1);
