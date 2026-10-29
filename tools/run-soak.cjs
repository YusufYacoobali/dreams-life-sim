const { spawn } = require('node:child_process');
const count = process.argv[2] ?? '120';
const requestedWorkers = process.env.DREAMS_SOAK_WORKERS ?? '1';
if (
  !/^\d+$/.test(count) ||
  Number(count) < 1 ||
  Number(count) > 1000 ||
  !/^[1-4]$/.test(requestedWorkers)
) {
  process.stderr.write(
    'Usage: [DREAMS_SOAK_WORKERS=1..4] npm run test:soak -- [life count from 1 to 1000; default 120]\n',
  );
  process.exit(1);
}
const workers = Math.min(Number(count), Number(requestedWorkers));
const children = [];
const running = new Set();
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    for (const child of running) child.kill(signal);
  });
}
for (let shard = 0; shard < workers; shard++) {
  const child = spawn(
    process.execPath,
    [
      require.resolve('jest/bin/jest'),
      '--runInBand',
      'tests/game/engine.test.ts',
    ],
    {
      env: {
        ...process.env,
        DREAMS_LIFE_SWEEP: count,
        DREAMS_LIFE_SWEEP_SHARD: String(shard),
        DREAMS_LIFE_SWEEP_SHARDS: String(workers),
      },
      stdio: 'inherit',
    },
  );
  running.add(child);
  children.push(
    new Promise((resolve) => {
      child.on('error', (error) => {
        process.stderr.write(error.message + '\n');
        resolve(1);
      });
      child.on('close', (status) => {
        running.delete(child);
        resolve(status ?? 1);
      });
    }),
  );
}
Promise.all(children).then((statuses) => {
  if (statuses.every((status) => status === 0))
    process.stdout.write(
      JSON.stringify({
        sweep: 'complete',
        lives: Number(count),
        workers,
        passed: true,
      }) + '\n',
    );
  process.exit(statuses.every((status) => status === 0) ? 0 : 1);
});
