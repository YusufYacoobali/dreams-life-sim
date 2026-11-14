import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { decodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { newReviewTracker } from '../../src/reviews/tracker';
import { diskDatabase } from '../support/refinementSqlite';
import graduate from '../fixtures/v3-employed-graduate.json';

async function context() {
  const folder = mkdtempSync(join(tmpdir(), 'dreams-committed-review-')), file = join(folder, 'save.db');
  const { sqlite, driver } = diskDatabase(file), repository = new SaveRepository(driver);
  const initial = decodeWorld(JSON.stringify(graduate));
  await repository.initialise(); await repository.create(initial);
  const store = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused' });
  await store.getState().bootstrap();
  return { sqlite, repository, store, initial, file, close() { sqlite.close(); rmSync(folder, { recursive: true, force: true }); } };
}

test('publication reads review metadata fresh when another connection writes after the successful life transaction', async () => {
  const c = await context(), read = jest.spyOn(c.repository, 'loadReviewTracker');
  try {
    const tracker = { ...newReviewTracker(), globalYearsPlayed: 7, nextReviewPromptAtGlobalYear: 15 };
    const commit = c.repository.commit.bind(c.repository);
    const write = jest.spyOn(c.repository, 'commit').mockImplementationOnce(async (...args) => {
      const world = await commit(...args), external = diskDatabase(c.file);
      try { external.sqlite.prepare("INSERT INTO preferences(key,value) VALUES('app_review',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(tracker)); }
      finally { external.sqlite.close(); }
      return world;
    });
    expect(await c.store.getState().dispatch({ type: 'advance' })).toBe(true);
    const committed = c.store.getState().world!;
    expect(read).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledTimes(1);
    expect(c.store.getState().reviewTracker).toEqual(tracker);
    expect(committed).toEqual(resolveCommand(c.initial, { type: 'advance' }, true));
    const cold = diskDatabase(c.file);
    try {
      const repository = new SaveRepository(cold.driver);
      expect(await repository.load(committed.id)).toEqual(committed);
      expect(await repository.loadReviewTracker()).toEqual(tracker);
    } finally { cold.sqlite.close(); }
    write.mockRestore();
  } finally { read.mockRestore(); c.close(); }
});

test('failed storage publishes neither metadata nor world; lost acknowledgements retry the durable receipt and refresh metadata', async () => {
  const c = await context(), read = jest.spyOn(c.repository, 'loadReviewTracker');
  try {
    c.sqlite.exec("CREATE TRIGGER fail_review_publication BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'disk full'); END");
    expect(await c.store.getState().dispatch({ type: 'advance' })).toBe(false);
    expect(c.store.getState().world).toEqual(c.initial);
    expect(read).not.toHaveBeenCalled();
    c.sqlite.exec('DROP TRIGGER fail_review_publication');
    const commit = c.repository.commit.bind(c.repository);
    const lost = jest.spyOn(c.repository, 'commit').mockImplementationOnce(async (...args) => {
      await commit(...args); throw Error('lost acknowledgement');
    });
    expect(await c.store.getState().dispatch({ type: 'advance' })).toBe(false);
    expect(c.store.getState().world).toEqual(c.initial);
    expect(await c.store.getState().dispatch({ type: 'advance' })).toBe(true);
    expect(read).toHaveBeenCalledTimes(1);
    expect(c.store.getState().world).toEqual(resolveCommand(c.initial, { type: 'advance' }, true));
    expect(c.sqlite.prepare('SELECT count(*) AS n FROM receipts').get()!.n).toBe(1);
    lost.mockRestore();
  } finally { read.mockRestore(); c.close(); }
});

test('invalid optional review metadata stays unavailable without delaying a valid committed world', async () => {
  const c = await context(), read = jest.spyOn(c.repository, 'loadReviewTracker');
  try {
    c.sqlite.prepare("INSERT INTO preferences(key,value) VALUES('app_review',?)").run('{damaged');
    expect(await c.store.getState().dispatch({ type: 'advance' })).toBe(true);
    expect(c.store.getState().reviewTracker).toBeNull();
    expect(read).toHaveBeenCalledTimes(1);
    expect(c.sqlite.prepare("SELECT value FROM preferences WHERE key='app_review'").get()!.value).toBe('{damaged');
  } finally { read.mockRestore(); c.close(); }
});
