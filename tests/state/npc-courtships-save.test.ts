import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { npcWeddingJourney } from '../support/npcCourtships';
import { annualCommand } from '../support/npcRelationships';
import archive from '../fixtures/v30-native-workplace-story-archive.json';

test('an ordinary annual wedding rolls back both fees, consent and marriage atomically, retries without reroll/unpack and resumes exactly cold', async () => {
  const { before, command, after } = npcWeddingJourney(), { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive));
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  const oldLives = sqlite.prepare('SELECT * FROM lives ORDER BY id').all(), oldBackups = sqlite.prepare('SELECT * FROM backups ORDER BY life_id').all(), oldSnapshots = sqlite.prepare('SELECT * FROM snapshots ORDER BY snapshot_id').all(), oldReceipts = sqlite.prepare('SELECT * FROM receipts ORDER BY life_id,revision').all();
  await repository.create(before);
  const store = createGameStore({ repository: async () => repository, date: () => before.date, id: () => 'unused' }); await store.getState().bootstrap();
  try {
    const baseline = rows(), encoded = encodeWorld(store.getState().world!), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    sqlite.exec("CREATE TRIGGER fail_npc_wedding BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    expect(await store.getState().dispatch(command)).toBe(false); expect(store.getState().error).toMatch(/couldn't be saved/); expect(rows()).toEqual(baseline); expect(encodeWorld(store.getState().world!)).toBe(encoded);
    sqlite.exec('DROP TRIGGER fail_npc_wedding'); expect(await store.getState().dispatch(command)).toBe(true); expect(store.getState().world).toEqual(after); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const saved = rows(), cold = createGameStore({ repository: async () => new SaveRepository(driver), date: () => after.date, id: () => 'unused' }); expect(await cold.getState().bootstrap()).toBe(true); expect(cold.getState().world).toEqual(after); expect(rows()).toEqual(saved);
    const wedding = after.npcCourtships.find(row => row.marriageId)!, proposal = wedding.proposals.at(-1)!;
    let guard = 0; while ((cold.getState().world!.pending || cold.getState().world!.annual) && guard++ < 100) expect(await cold.getState().dispatch(annualCommand(cold.getState().world!))).toBe(true);
    expect(guard).toBeLessThan(100); const final = cold.getState().world!;
    expect(final.npcCourtships).toEqual(after.npcCourtships); expect(final.marriages.filter(row => row.id === wedding.marriageId)).toHaveLength(1);
    expect(final.ledger.filter(row => [proposal.paymentAId, proposal.paymentBId].includes(row.id))).toHaveLength(2);
    for (const row of oldLives) expect(sqlite.prepare('SELECT * FROM lives WHERE id=?').get(row.id)).toEqual(row);
    for (const row of oldBackups) expect(sqlite.prepare('SELECT * FROM backups WHERE life_id=?').get(row.life_id)).toEqual(row);
    expect(sqlite.prepare('SELECT * FROM snapshots ORDER BY snapshot_id').all().filter(row => row.life_id !== before.id)).toEqual(oldSnapshots);
    expect(sqlite.prepare('SELECT * FROM receipts ORDER BY life_id,revision').all().filter(row => row.life_id !== before.id)).toEqual(oldReceipts);
  } finally { jest.restoreAllMocks(); sqlite.close(); }
}, 60000);
