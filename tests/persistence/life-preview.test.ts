import { resolveCommand } from '../../src/game/engine';
import { decodeSave } from '../../src/persistence/archive';
import * as checkpoints from '../../src/persistence/checkpoints';
import { SaveCorrupt, SaveRepository } from '../../src/persistence/repository';
import archive from '../fixtures/v28-ordinary-hobby-archive.json';
import prior from '../../docs/verification/android24-opening-20261019/custom-result-save.json';
import { database } from '../support/sqlite';

test('viewing another genuine life preserves every table and the active action’s warm save path', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const other = await repository.import(JSON.stringify(prior)), active = await repository.import(JSON.stringify(archive));
  const tables = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  const before = tables(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
  try {
    const preview = await repository.previewLife(other.id);
    expect(preview).toEqual(other); expect(Object.isFrozen(preview)).toBe(true); expect(unpack).toHaveBeenCalledTimes(1); expect(tables()).toEqual(before);
    unpack.mockClear();
    const next = resolveCommand(active, { type: 'acknowledge', resultId: active.pending!.id }, true);
    await repository.commit(next, active.revision, 'ack-after-view'); expect(unpack).not.toHaveBeenCalled();
    expect(await repository.load(other.id)).toEqual(other); expect(await repository.load(active.id)).toEqual(next);
    expect(await repository.recoveryPreview(active.id)).toEqual(active);
  } finally { unpack.mockRestore(); sqlite.close(); }
});

test.each(['revision', 'identity', 'payload'] as const)('a preview rejects damaged %s and preserves the active cache and every original history row', async damage => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const other = await repository.import(JSON.stringify(prior)), active = await repository.import(JSON.stringify(archive));
  if (damage === 'revision') sqlite.prepare('UPDATE lives SET revision=revision+1 WHERE id=?').run(other.id);
  else sqlite.prepare('UPDATE lives SET payload=? WHERE id=?').run(damage === 'payload' ? '{damaged' : checkpoints.packCheckpoint({ ...other, id: 'life_wrong_identity' }), other.id);
  const snapshots = sqlite.prepare('SELECT * FROM snapshots ORDER BY 1,2').all(), backups = sqlite.prepare('SELECT * FROM backups ORDER BY 1,2').all();
  await expect(repository.previewLife(other.id)).rejects.toBeInstanceOf(SaveCorrupt);
  const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
  try {
    const next = resolveCommand(active, { type: 'acknowledge', resultId: active.pending!.id }, true);
    await repository.commit(next, active.revision, 'ack-after-invalid-view'); expect(unpack).not.toHaveBeenCalled();
    expect(sqlite.prepare('SELECT * FROM snapshots ORDER BY 1,2').all()).toEqual(snapshots);
    expect(sqlite.prepare('SELECT * FROM backups WHERE life_id=?').all(other.id)).toEqual(backups.filter(row => row.life_id === other.id));
    expect(await repository.recoveryPreview(active.id)).toEqual(active);
  } finally { unpack.mockRestore(); sqlite.close(); }
});
