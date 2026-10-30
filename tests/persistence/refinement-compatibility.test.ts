import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { diskDatabase } from '../support/refinementSqlite';
import captured from '../fixtures/v1-refinement-compatibility.json';

const digest = (world: World) => createHash('sha256').update(encodeWorld(world)).digest('hex');
const commands = (row: typeof captured.rows[number]) => row.commands as GameCommand[];

test.each(captured.rows.map(row => [row.id, row] as const))(
  '%s preserves the complete world produced by the published v1 executable, including bound prose, effects and RNG',
  (_, row) => {
    expect(captured.sourceCommit).toBe('fc2294b476fec72a77a9a863c7994b025ebe241f');
    let world = unpackCheckpoint(row.payload);
    expect(digest(world)).toBe(row.inputSha256);
    expect(unpackCheckpoint(packCheckpoint(world))).toStrictEqual(world);
    for (const command of commands(row)) {
      world = resolveCommand(decodeWorld(encodeWorld(world)), command);
    }
    expect(digest(world)).toBe(row.outcomeSha256);
  },
);

test.each(['v1-escape-paused', 'v1-crime-expose', 'v1-prison-mock', 'v1-romance-repeat'])(
  '%s survives on-disk SQLite rollback, exact retry and a physically closed/reopened database at every command boundary',
  async id => {
    const row = captured.rows.find(item => item.id === id)!;
    const folder = mkdtempSync(join(tmpdir(), 'dreams-refinement-v1-'));
    const file = join(folder, 'life.db');
    let { sqlite, driver } = diskDatabase(file);
    let repository = new SaveRepository(driver);
    try {
      await repository.initialise();
      let world = unpackCheckpoint(row.payload);
      await repository.create(world);
      for (const [index, command] of commands(row).entries()) {
        const before = world, expected = resolveCommand(world, command);
        const receipt = `refinement:v1:${id}:${index}`;
        const receipts = sqlite.prepare('SELECT count(*) AS n FROM receipts').get();
        sqlite.exec("CREATE TRIGGER reject_refinement_receipt BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'refinement write failure'); END");
        await expect(repository.commit(expected, before.revision, receipt, true)).rejects.toThrow('refinement write failure');
        expect(await repository.load(before.id)).toStrictEqual(before);
        expect(sqlite.prepare('SELECT count(*) AS n FROM receipts').get()).toEqual(receipts);
        expect(resolveCommand(await repository.load(before.id), command)).toStrictEqual(expected);
        sqlite.exec('DROP TRIGGER reject_refinement_receipt');
        await repository.commit(expected, before.revision, receipt, true);
        expect(await repository.commit(expected, before.revision, receipt, true)).toStrictEqual(expected);
        sqlite.close();
        ({ sqlite, driver } = diskDatabase(file));
        repository = new SaveRepository(driver);
        await repository.initialise();
        world = await repository.load(before.id);
        expect(world).toStrictEqual(expected);
        expect(await repository.recoveryPreview(before.id)).toStrictEqual(before);
        expect((await repository.snapshots(before.id)).some(snapshot => snapshot.revision === before.revision)).toBe(true);
      }
      expect(digest(world)).toBe(row.outcomeSha256);
      expect(sqlite.prepare('SELECT count(*) AS n FROM receipts').get()).toEqual({ n: row.commands.length });
    } finally { sqlite.close(); rmSync(folder, { recursive: true, force: true }); }
  },
);

test.each(['v1-crime-negotiate', 'v1-prison-agree', 'v1-romance-stop'])(
  '%s remains the exact historical decision on an independent Time Machine branch',
  async id => {
    const row = captured.rows.find(item => item.id === id)!;
    const { sqlite, driver } = database(), repository = new SaveRepository(driver);
    try {
      await repository.initialise();
      const world = unpackCheckpoint(row.payload);
      await repository.create(world);
      const [moment] = await repository.snapshot(world.id, world.revision);
      const command = commands(row)[0], expected = resolveCommand(world, command);
      await repository.commit(expected, world.revision, `refinement:source:${id}`);
      const branch = await repository.restoreBranch(world.id, moment.id, expected.revision, `life_refinement_${id}`, `refinement:branch:${id}`);
      expect(branch.pending).toStrictEqual(world.pending);
      expect(branch.random).toStrictEqual(world.random);
      expect(resolveCommand(branch, command)).toStrictEqual({ ...expected, id: branch.id });
      expect(await repository.load(world.id)).toStrictEqual(expected);
      expect(digest(await repository.load(world.id))).toBe(row.outcomeSha256);
    } finally { sqlite.close(); }
  },
);
