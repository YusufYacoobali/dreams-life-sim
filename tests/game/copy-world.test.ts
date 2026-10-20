import { copyWorld, encodeWorld, immutableWorld, validateWorld, World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { decodeSave } from '../../src/persistence/archive';
import archive from '../fixtures/v30-native-raise-archive.json';

const original = () => decodeSave(JSON.stringify(archive)).world;

test('a certified working copy preserves every field and isolates all mutable objects while retaining only certified ledger rows', () => {
  const world = immutableWorld(original()), before = encodeWorld(world), draft = copyWorld(world);
  expect(draft).toEqual(world); expect(Object.isFrozen(draft)).toBe(false);
  function isolated(a: unknown, b: unknown, path = 'world') {
    if (!a || typeof a !== 'object') { expect(b).toBe(a); return; }
    expect(b).not.toBe(a); expect(Object.isFrozen(b)).toBe(false); expect(Object.getPrototypeOf(b)).toBe(Object.getPrototypeOf(a));
    if (path === 'world.ledger') {
      for (const [index, row] of (a as World['ledger']).entries()) { expect((b as World['ledger'])[index]).toBe(row); expect(Object.isFrozen(row)).toBe(true); }
      return;
    }
    expect(Object.keys(b as object)).toEqual(Object.keys(a));
    for (const key of Object.keys(a)) isolated((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], path + '.' + key);
  }
  isolated(world, draft);
  for (const person of Object.values(draft.people)) { person.stats.happiness = (person.stats.happiness + 1) % 101; person.education.qualifications.push({ level: 'secondary', field: 'general', year: draft.date.year }); }
  draft.accounts[0].cash += 1n; draft.relationships[0].memories.push('working-copy-only'); draft.date.day = 1; draft.ledger.push({ ...world.ledger[0], id: 'txn_draft_only' });
  expect(encodeWorld(world)).toBe(before); expect(copyWorld(world)).toEqual(world);
});

test('freezing or shallow-copying an untrusted object never grants the certified copy path', () => {
  const world = immutableWorld(original()), player = world.people[world.activePersonId];
  const forged = Object.freeze({ ...world, people: { ...world.people, [player.id]: { ...player, stats: { ...player.stats, happiness: 101 } } } });
  expect(() => copyWorld(forged)).toThrow();
  const mutable = original(); mutable.accounts[0].cash += 1n; expect(() => copyWorld(mutable)).toThrow(/reconcile/);
});

test.each(['routine', 'conversation', 'new contacts'] as const)('the certified %s command equals full mutable validation and preserves the original world', action => {
  const result = original(), ready = resolveCommand(result, { type: 'acknowledge', resultId: result.pending!.id }), world = immutableWorld(ready), before = encodeWorld(world);
  const command = action === 'routine' ? { type: 'health-routine' as const, routine: ready.people[ready.activePersonId].health.routine }
    : action === 'conversation' ? { type: 'interact' as const, action: 'talk' as const, personId: ready.workplaces[0].members.find(item => item.role === 'supervisor')!.personId }
      : { type: 'meet-people' as const, purpose: 'friend' as const, gender: 'any' as const };
  expect(resolveCommand(world, command, true)).toEqual(resolveCommand(ready, command)); expect(encodeWorld(world)).toBe(before);
});

test('employment totals and current contracts still reconcile per person rather than across the combined history', () => {
  const world = original(), supervisor = world.workplaces[0].members.find(item => item.role === 'supervisor')!.personId, record = world.workHistory.find(item => item.personId === supervisor)!;
  record.monthsWorked++; expect(() => validateWorld(world)).toThrow(/Earnings do not reconcile/);
  record.monthsWorked--; world.people[world.activePersonId].employment!.id = record.id; expect(() => validateWorld(world)).toThrow(/Invalid current employment/);
});
