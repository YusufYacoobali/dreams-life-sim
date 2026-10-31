import { encodeSave, decodeSave } from '../../src/persistence/archive';
import { packCheckpoint } from '../../src/persistence/checkpoints';
import { decodeWorld } from '../../src/game/model';
import { lifestyleFixture, act, buyLifestyle } from '../helpers/lifestyle';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import graduate from '../fixtures/v3-employed-graduate.json';

test('new archive headers reject older v1-only apps while v1 historical files and current lifestyle records both remain readable', () => {
  const legacy = decodeWorld(JSON.stringify(graduate));
  const oldArchive = JSON.stringify({ format: 'dreams-save-archive', version: 1, checkpoint: packCheckpoint(legacy), snapshots: [], branch: null });
  expect(decodeSave(oldArchive).world).toEqual(legacy);
  const current = lifestyleFixture(), exported = encodeSave({ world: current, snapshots: [], branch: null });
  expect(JSON.parse(exported).version).toBe(2); expect(decodeSave(exported).world).toEqual(current);
  expect(decodeSave(encodeSave({ world: legacy, snapshots: [], branch: null })).world).toEqual(legacy);
});
test('reader31→32 changes no original row, backup, checkpoint or receipt and rolls back a failed marker before cold retry', async () => {
  const { sqlite, driver } = database();
  try {
    const repository = new SaveRepository(driver); await repository.initialise(); const original = decodeWorld(JSON.stringify(graduate)); await repository.create(original); const next = resolveCommand(original, { type: 'health-routine', routine: { ...original.people[original.activePersonId].health.routine, mindfulness: true } }, true); await repository.commit(next, original.revision, 'legacy:before-upgrade', true); sqlite.exec('PRAGMA user_version=31');
    const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
    const before = rows(); const failing = new SaveRepository({ ...driver, transaction: action => driver.transaction(tx => action({ ...tx, run: async (sql, values) => { await tx.run(sql, values); if (sql === 'PRAGMA user_version = 32') throw Error('controlled marker failure'); } })) });
    await expect(failing.initialise()).rejects.toThrow('controlled marker failure'); expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(31); expect(rows()).toEqual(before);
    const cold = new SaveRepository(driver); await cold.initialise(); expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(32); expect(rows()).toEqual(before); expect(await cold.load(original.id)).toEqual(next);
  } finally { sqlite.close(); }
});
