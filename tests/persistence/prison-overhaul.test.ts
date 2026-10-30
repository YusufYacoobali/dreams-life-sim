import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository } from '../../src/persistence/repository';
import { accountFor } from '../../src/game/systems/common';
import { enableOverhaul } from '../../src/game/systems/overhaul';
import { prisonLife, prisonMonth } from '../../src/game/systems/prison';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import { prisonContacts } from '../../src/game/systems/legal';
import { database } from '../support/sqlite';
import { escapePrisoner } from '../support/prisonEscape';

function fixture() { const world = escapePrisoner(); enableOverhaul(world); return world; }
function acknowledge(world: World) { if (world.pending?.kind !== 'result') throw new Error('Expected result'); return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }); }

test('a failed support save rolls back the two-sided transfer, family history, RNG and receipt; retry pays once and cold reopen is exact', async () => {
  const before = fixture(), parent = before.people.person_parent1, relation = relationFor(before, before.activePersonId, parent.id)!;
  relation.strength = 100; relation.trust = 100; parent.traits = ['kind']; before.random.outcomes = 1;
  const command = { type: 'prison-family-contact' as const, personId: parent.id, action: 'support' as const }, after = resolveCommand(before, command), { sqlite, driver } = database(), repository = new SaveRepository(driver);
  try {
    await repository.initialise(); await repository.create(before);
    const total = accountFor(before).cash + accountFor(before, parent).cash;
    sqlite.exec("CREATE TRIGGER fail_prison_support BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'prison support storage failure'); END");
    await expect(repository.commit(after, before.revision, 'prison:support', true)).rejects.toThrow('prison support storage failure');
    expect(await repository.load(before.id)).toEqual(before); expect(await repository.snapshots(before.id)).toEqual([]);
    expect(resolveCommand(await repository.load(before.id), command)).toEqual(after);
    sqlite.exec('DROP TRIGGER fail_prison_support');
    await repository.commit(after, before.revision, 'prison:support', true);
    expect(await repository.commit(after, before.revision, 'prison:support', true)).toEqual(after);
    const cold = new SaveRepository(driver); await cold.initialise(); const restored = await cold.load(before.id);
    expect(restored).toEqual(after); expect(accountFor(restored).cash + accountFor(restored, restored.people[parent.id]).cash).toBe(total);
    expect(prisonLife(restored)!.familyContacts[0].transactionIds).toHaveLength(2); expect(restored.ledger.filter(item => item.category.startsWith('prison-support'))).toHaveLength(2);
    expect(await repository.snapshots(before.id)).toHaveLength(1); expect(sqlite.prepare('SELECT COUNT(*) AS n FROM receipts').get()).toEqual({ n: 1 });
  } finally { sqlite.close(); }
});

test('prison decisions retain their exact snapshot through failed saves, cold loads and independent Time Machine choices', async () => {
  let before = fixture(); before = acknowledge(resolveCommand(before, { type: 'prison-action', personId: prisonContacts(before)[0].id, action: 'talk' }));
  const original = encodeWorld(before);
  for (let seed = 1; seed < 100; seed++) { const next = decodeWorld(original); next.random.events = seed; prisonMonth(next); if (next.pending?.kind === 'decision') { before = next; break; } }
  if (before.pending?.kind !== 'decision') throw new Error('Expected a prison situation');
  const eventId = before.pending.id, firstId = before.pending.choices[0].id, secondId = before.pending.choices[1].id, command = { type: 'choose' as const, eventId, choiceId: firstId }, after = resolveCommand(before, command);
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  try {
    await repository.initialise(); await repository.create(before);
    const moment = (await repository.snapshot(before.id, before.revision))[0];
    sqlite.exec("CREATE TRIGGER fail_prison_story BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'prison story storage failure'); END");
    await expect(repository.commit(after, before.revision, 'prison:story')).rejects.toThrow('prison story storage failure');
    expect(await repository.load(before.id)).toEqual(before);
    expect(resolveCommand(await repository.load(before.id), command)).toEqual(after);
    sqlite.exec('DROP TRIGGER fail_prison_story'); await repository.commit(after, before.revision, 'prison:story');
    const branch = await repository.restoreBranch(before.id, moment.id, after.revision, 'life_prison_alternate_choice', 'prison:branch');
    expect(branch.pending).toEqual(before.pending); expect(branch.prisonLives).toEqual(before.prisonLives);
    const alternative = resolveCommand(branch, { type: 'choose', eventId, choiceId: secondId });
    await repository.commit(alternative, branch.revision, 'prison:alternate');
    expect(prisonLife(alternative)!.scenes[0].choiceId).toBe(secondId);
    expect((await repository.load(before.id)).prisonLives).toEqual(after.prisonLives);
    expect((await repository.load(branch.id)).prisonLives).toEqual(alternative.prisonLives);
    expect(prisonLife(await repository.load(before.id))!.scenes[0].choiceId).toBe(firstId);
    const cold = new SaveRepository(driver); await cold.initialise(); expect(await cold.load(before.id)).toEqual(after);
  } finally { sqlite.close(); }
});
