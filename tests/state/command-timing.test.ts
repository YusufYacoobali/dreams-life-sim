import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { observeCommandTimings, type CommandTimingEvent } from '../../src/performance/commandTiming';
import { diskDatabase } from '../support/refinementSqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import graduate from '../fixtures/v3-employed-graduate.json';

test('opt-in timings separate yield, simulation, validation, encoding and SQLite without changing the exact durable outcome', async () => {
  const initial = decodeWorld(JSON.stringify(graduate)), folder = mkdtempSync(join(tmpdir(), 'dreams-command-timing-')), file = join(folder, 'life.db');
  let { sqlite, driver } = diskDatabase(file), repository = new SaveRepository(driver);
  await repository.initialise(); await repository.create(initial);
  let release!: () => void, yielding = false;
  const store = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused', yieldToUI: () => yielding ? new Promise<void>(resolve => { release = resolve; }) : Promise.resolve() });
  await store.getState().bootstrap(); yielding = true;
  const events: CommandTimingEvent[] = [], stop = observeCommandTimings(event => events.push(event));
  try {
    const before = encodeWorld(store.getState().world!), pending = store.getState().dispatch({ type: 'advance' });
    expect(events.map(row => row.phase)).toEqual(['press', 'busy']); expect(store.getState().busy).toBe(true); expect(encodeWorld(await repository.load(initial.id))).toBe(before);
    expect(await store.getState().dispatch({ type: 'advance' })).toBe(false); expect(events.filter(row => row.phase === 'press')).toHaveLength(1);
    release(); expect(await pending).toBe(true);
    expect(store.getState().world).toEqual(resolveCommand(initial, { type: 'advance' }, true)); expect(await repository.load(initial.id)).toEqual(store.getState().world);
    const phases = events.map(row => row.phase);
    for (const phase of ['after-yield', 'simulation:start', 'validation:start', 'validation:end', 'simulation:end', 'checkpoint:start', 'checkpoint:end', 'sqlite:start', 'sqlite:end', 'review:start', 'review:end', 'publication', 'complete']) expect(phases).toContain(phase);
    expect(phases.indexOf('sqlite:end')).toBeLessThan(phases.indexOf('publication')); expect(phases.at(-1)).toBe('complete');
    expect(events.every(row => row.elapsedMs >= 0 && Number.isFinite(row.elapsedMs))).toBe(true);
    expect(events.every(row => !('lifeId' in row) && !('world' in row))).toBe(true);
    sqlite.close(); ({ sqlite, driver } = diskDatabase(file)); repository = new SaveRepository(driver); await repository.initialise();
    expect(await repository.load(initial.id)).toEqual(store.getState().world);
  } finally { stop(); sqlite.close(); rmSync(folder, { recursive: true, force: true }); }
});
test('a throwing observer cannot turn a failed save into a success, alter rollback or prevent an exact retry', async () => {
  const initial = decodeWorld(JSON.stringify(graduate)), folder = mkdtempSync(join(tmpdir(), 'dreams-command-timing-')), file = join(folder, 'life.db');
  let { sqlite, driver } = diskDatabase(file), repository = new SaveRepository(driver);
  await repository.initialise(); await repository.create(initial);
  const store = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused' }); await store.getState().bootstrap();
  const stop = observeCommandTimings(() => { throw Error('Diagnostic failure'); });
  try {
    sqlite.exec("CREATE TRIGGER fail_timed_save BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    expect(await store.getState().dispatch({ type: 'advance' })).toBe(false); expect(await repository.load(initial.id)).toEqual(initial); expect(store.getState().world).toEqual(initial);
    sqlite.exec('DROP TRIGGER fail_timed_save'); expect(await store.getState().dispatch({ type: 'advance' })).toBe(true); expect(store.getState().world).toEqual(resolveCommand(initial, { type: 'advance' }, true));
  } finally { stop(); sqlite.close(); rmSync(folder, { recursive: true, force: true }); }
});
