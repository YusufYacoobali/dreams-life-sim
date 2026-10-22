import { createLife, randomCreation } from '../../src/game/createLife';
import { copyWorld, decodeWorld, encodeWorld, immutableWorld, validateWorld, type World } from '../../src/game/model';
import { applyGodModeEdits, godModeSkills, godModeStats, godModeAttributes, type GodModeCommand } from '../../src/game/godMode';
import { godModeDraft, draftCommands } from '../../src/game/godModeDraft';
import { currencyDigits, parseMoney, type Currency } from '../../src/game/money';
import { resolveCommand } from '../../src/game/engine';
import { updateFame } from '../../src/game/systems/social';
import { careerPayQuote } from '../../src/game/systems/careers';
import { startStudy } from '../support/studyStory';
import graduate from '../fixtures/v3-employed-graduate.json';

function initial() { return immutableWorld({ ...createLife('life_god', 42, randomCreation(42), { year: 2026, month: 10, day: 22 }), birthAcknowledged: true }); }
function edit(world: World, commands: GodModeCommand[]) { return applyGodModeEdits(world, { lifeId: world.id, personId: world.activePersonId, expectedRevision: world.revision, commands }); }

describe.each([0, 47, 100])('percentage boundary %i', value => {
  test.each(godModeStats)('core stat %s changes actual state without side effects', stat => {
    const before = initial(), encoded = encodeWorld(before), next = edit(before, [{ type: 'stat', stat, value }]);
    expect(next.people[next.activePersonId].stats[stat]).toBe(value);
    expect(next.revision).toBe(before.revision + 1); expect(next.date).toEqual(before.date); expect(next.random).toEqual(before.random);
    expect(next.pending).toEqual(before.pending); expect(next.deferred).toEqual(before.deferred); expect(next.journal).toEqual(before.journal); expect(next.accounts).toEqual(before.accounts);
    expect(next.people[next.activePersonId].died).toBeNull(); expect(encodeWorld(before)).toBe(encoded); expect(validateWorld(next)).toEqual(next); expect(Object.isFrozen(next)).toBe(true);
  });
  test.each(godModeSkills)('career skill %s', skill => {
    const before = initial(), next = edit(before, [{ type: 'skill', skill, value }]);
    expect(next.people[next.activePersonId].skills[skill]).toBe(value); expect(next.random).toEqual(before.random); expect(validateWorld(next)).toEqual(next);
  });
  test.each(godModeAttributes)('additional attribute %s', attribute => {
    const before = initial(), draft = godModeDraft(before); draft.attributes[attribute] = String(value);
    const next = edit(before, draftCommands(before, draft).commands.length ? draftCommands(before, draft).commands : [{ type: 'attribute', attribute, value }]);
    expect(godModeDraft(next).attributes[attribute]).toBe(String(value));
  });
});

test.each(Object.keys(currencyDigits) as Currency[])('money operations reconcile %s without taxable earnings or loans', currency => {
  const world = copyWorld(initial()), person = world.people[world.activePersonId];
  let account = world.accounts.find(item => item.ownerId === person.id && item.currency === currency);
  if (!account) { account = { id: 'account_god_' + currency, ownerId: person.id, currency, cash: 0n, openingCash: 0n, lockedCash: 0n }; world.accounts.push(account); }
  let next = edit(world, [{ type: 'money', accountId: account.id, operation: 'set', amount: '10000' }]);
  next = edit(next, [{ type: 'money', accountId: account.id, operation: 'add', amount: currency === 'JPY' ? '75' : '75.25' }]);
  next = edit(next, [{ type: 'money', accountId: account.id, operation: 'subtract', amount: '25' }]);
  expect(next.accounts.find(item => item.id === account!.id)?.cash).toBe(parseMoney(currency === 'JPY' ? '10050' : '10050.25', currency).minor);
  expect(next.accounts.filter(item => item.id !== account!.id)).toEqual(world.accounts.filter(item => item.id !== account!.id));
  expect(next.people[person.id].finance).toEqual(person.finance); expect(next.liabilities).toEqual(world.liabilities);
  expect(next.ledger.slice(world.ledger.length).every(row => row.category === 'god-mode-adjustment' && row.debtDelta === 0n)).toBe(true);
  expect(decodeWorld(encodeWorld(next))).toEqual(next);
});

test('locked inheritance is preserved, including when all available money is removed', () => {
  const before = copyWorld(initial()), account = before.accounts.find(item => item.ownerId === before.activePersonId)!;
  account.cash = account.openingCash = 10000n; account.lockedCash = 7000n;
  const next = edit(before, [{ type: 'money', accountId: account.id, operation: 'subtract', amount: '30' }]);
  expect(next.accounts.find(item => item.id === account.id)).toMatchObject({ cash: 7000n, lockedCash: 7000n });
  for (const operation of ['set', 'subtract'] as const) expect(() => edit(next, [{ type: 'money', accountId: account.id, operation, amount: operation === 'set' ? '69.99' : '0.01' }])).toThrow(/trust/);
});

test('relationships edit only strength and trust and preserve family structure and pending events', () => {
  const before = resolveCommand(initial(), { type: 'advance' }), relationship = before.relationships.find(item => item.from === before.activePersonId || item.to === before.activePersonId)!;
  for (const value of [0, 47, 100]) {
    const next = edit(before, [{ type: 'relationship', relationshipId: relationship.id, field: 'strength', value }, { type: 'relationship', relationshipId: relationship.id, field: 'trust', value }]);
    expect(next.relationships).toEqual(before.relationships.map(item => item.id === relationship.id ? { ...item, strength: value, trust: value } : item));
    expect(next.households).toEqual(before.households); expect(next.marriages).toEqual(before.marriages); expect(next.custody).toEqual(before.custody);
    expect(next.pending).toEqual(before.pending); expect(next.annual).toEqual(before.annual); expect(next.random).toEqual(before.random);
  }
});

test('bulk commands roll back entirely on invalid or unauthorized fields and stale identity', () => {
  const world = initial(), before = encodeWorld(world), account = world.accounts.find(item => item.ownerId === world.activePersonId)!;
  const valid: GodModeCommand = { type: 'stat', stat: 'smarts', value: 100 };
  const invalid: unknown[] = [
    ...[-1, 101, 3.4, NaN, Infinity, '50', null].map(value => ({ type: 'stat', stat: 'health', value })),
    { type: 'stat', stat: 'invented', value: 50 }, { type: 'skill', skill: '__proto__', value: 50 },
    { type: 'attribute', attribute: 'age', value: 20 }, { type: 'relationship', relationshipId: world.relationships[0].id, field: 'romance', value: 50 },
    { type: 'relationship', relationshipId: 'missing', field: 'trust', value: 50 },
    ...['-1', '1e6', 'NaN', 'Infinity', '1,000', '1.001', '99999999999999999999999999999999999999999'].map(amount => ({ type: 'money', accountId: account.id, operation: 'set', amount })),
    { type: 'money', accountId: 'missing', operation: 'set', amount: '50' },
    { type: 'money', accountId: world.accounts.find(item => item.ownerId !== world.activePersonId)!.id, operation: 'set', amount: '50' },
  ];
  for (const command of invalid) { expect(() => edit(world, [valid, command as GodModeCommand])).toThrow(); expect(encodeWorld(world)).toBe(before); }
  for (const replacement of [{ lifeId: 'life_other' }, { personId: 'person_other' }, { expectedRevision: world.revision + 1 }]) expect(() => applyGodModeEdits(world, { lifeId: world.id, personId: world.activePersonId, expectedRevision: world.revision, commands: [valid], ...replacement })).toThrow(/changed/);
  expect(() => edit(world, [])).toThrow();
});

test('grades keep current course validation intact without rewriting historical study', () => {
  const before = startStudy(), current = before.studyCourses.find(item => item.status === 'active')!;
  const next = edit(before, [{ type: 'attribute', attribute: 'grades', value: 100 }]);
  expect(next.people[next.activePersonId].education.grades).toBe(100); expect(next.studyCourses.find(item => item.id === current.id)?.grades).toBe(100);
  expect(next.studyCourses.filter(item => item.id !== current.id)).toEqual(before.studyCourses.filter(item => item.id !== current.id));
  expect(validateWorld(next)).toEqual(next);
});

test('normal gameplay uses edited career skills and retains the fame base on recalculation', () => {
  let before = decodeWorld(JSON.stringify(graduate)); before = resolveCommand(before, { type: 'quit-job' });
  before = resolveCommand(before, { type: 'acknowledge', resultId: before.pending!.id });
  expect(() => resolveCommand(before, { type: 'select-career', kind: 'actor', quotedAnnualPay: careerPayQuote(before, 'actor') })).toThrow(/skill/);
  const next = edit(before, [{ type: 'skill', skill: 'acting', value: 100 }, { type: 'stat', stat: 'fame', value: 70 }]);
  expect(() => resolveCommand(next, { type: 'select-career', kind: 'actor', quotedAnnualPay: careerPayQuote(next, 'actor') })).not.toThrow();
  const copy = copyWorld(next); updateFame(copy, copy.people[copy.activePersonId]); expect(copy.people[copy.activePersonId].stats.fame).toBe(70);
  expect(validateWorld(resolveCommand(next, { type: 'advance' }))).toBeDefined();
});
