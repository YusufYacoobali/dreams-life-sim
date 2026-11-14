import { resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { World } from '../../src/game/model';
import { decodeSave } from '../../src/persistence/archive';
import * as checkpoints from '../../src/persistence/checkpoints';
import { SaveCorrupt, SaveRepository } from '../../src/persistence/repository';
import archive from '../fixtures/v27-responsive-archive.json';
import { database } from '../support/sqlite';

const command = (world: World) => {
  if (world.pending?.kind === 'decision') return { type: 'choose' as const, eventId: world.pending.id, choiceId: world.pending.choices.find(item => !choiceUnavailable(world, item))!.id };
  if (world.pending?.kind === 'result') return { type: 'acknowledge' as const, resultId: world.pending.id };
  throw new Error('Expected the genuine project decision or result');
};

test.each(['import', 'recovery', 'branch'] as const)('%s prepares the validated state and byte cache before the next ordinary action', async mode => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const original = decodeSave(JSON.stringify(archive)).world;
  let world = await repository.import(JSON.stringify(archive));
  if (mode === 'recovery') {
    await repository.commit(resolveCommand(world, command(world), true), world.revision, 'before_damage');
    sqlite.prepare('UPDATE lives SET payload=? WHERE id=?').run('{damaged', world.id);
    world = await repository.recover(world.id); expect(world).toEqual(original);
  } else if (mode === 'branch') {
    world = await repository.restoreBranch(original.id, 'snapshot_r_32', original.revision, 'life_fast_branch', 'fast_restore');
    expect(await repository.restoreBranch(original.id, 'snapshot_r_32', original.revision, 'unused_retry_id', 'fast_restore')).toEqual(world);
    expect(await repository.load(original.id)).toEqual(original);
    // Re-select the active branch after checking the source; both real load and
    // idempotent restore must prepare the branch's own cache.
    world = await repository.restoreBranch(original.id, 'snapshot_r_32', original.revision, 'unused_retry_id', 'fast_restore');
  }
  expect(Object.isFrozen(world)).toBe(true); expect(Object.isFrozen(world.people[world.activePersonId].stats)).toBe(true);
  const next = resolveCommand(world, command(world), true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
  expect(await repository.commit(next, world.revision, 'first_' + mode)).toEqual(next);
  expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
  const cold = new SaveRepository(driver); expect(await cold.load(world.id)).toEqual(next); expect(await cold.recoveryPreview(world.id)).toEqual(world);
  sqlite.close();
});

test.each(['revision', 'identity'] as const)('replacement preserves its valid backup when the old current %s metadata is inconsistent', async kind => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const world = await repository.import(JSON.stringify(archive)), backup = sqlite.prepare('SELECT revision,payload FROM backups WHERE life_id=?').get(world.id);
  if (kind === 'revision') sqlite.prepare('UPDATE lives SET revision=revision+1 WHERE id=?').run(world.id);
  else sqlite.prepare('UPDATE lives SET payload=? WHERE id=?').run(checkpoints.packCheckpoint({ ...world, id: 'life_wrong_identity' }), world.id);
  await expect(repository.load(world.id)).rejects.toBeInstanceOf(SaveCorrupt);
  expect(await repository.import(JSON.stringify(archive), true)).toEqual(world);
  expect(sqlite.prepare('SELECT revision,payload FROM backups WHERE life_id=?').get(world.id)).toEqual(backup);
  expect(await repository.recoveryPreview(world.id)).toEqual(world);
  sqlite.close();
});

test('an idempotent branch retry rejects inconsistent saved metadata without changing either life', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const world = await repository.import(JSON.stringify(archive));
  await repository.restoreBranch(world.id, 'snapshot_r_32', world.revision, 'life_fast_branch', 'fast_restore');
  sqlite.prepare('UPDATE lives SET revision=revision+1 WHERE id=?').run('life_fast_branch');
  await expect(repository.restoreBranch(world.id, 'snapshot_r_32', world.revision, 'unused', 'fast_restore')).rejects.toBeInstanceOf(SaveCorrupt);
  expect(await repository.load(world.id)).toEqual(world);
  expect(sqlite.prepare('SELECT revision FROM lives WHERE id=?').get('life_fast_branch')?.revision).toBe(33);
  sqlite.close();
});
