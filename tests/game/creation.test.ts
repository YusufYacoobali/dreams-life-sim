import { countryCodes, countries } from '../../src/game/countries';
import { createLife, randomCreation } from '../../src/game/createLife';
import { ageOn, dateSchema, validateWorld } from '../../src/game/model';

test.each(countryCodes)('creation in %s binds real people and the selected currency', code => {
  const input = { ...randomCreation(12), country: code, city: countries[code].cities[0] };
  const world = createLife('life_creation', 12, input, { year: 2026, month: 10, day: 18 });
  expect(createLife('life_creation', 12, input, world.date)).toEqual(world);
  expect(ageOn(world.people[world.activePersonId], world.date)).toBe(0);
  expect(world.accounts.every(account => account.currency === countries[code].currency)).toBe(true);
  expect(world.accounts.find(account => account.ownerId === world.activePersonId)?.cash).toBe(0n);
  expect(world.relationships.length).toBeGreaterThanOrEqual(1);
  expect(world.relationships.every(edge => edge.kind === 'parent' && edge.to === world.activePersonId && world.people[edge.from])).toBe(true);
});

test('invalid city/country combinations and blank identities are rejected', () => {
  const input = randomCreation(15);
  expect(() => createLife('life_invalid', 15, { ...input, city: 'Not in this country' }, { year: 2026, month: 1, day: 1 })).toThrow();
  expect(() => createLife('life_invalid', 15, { ...input, firstName: '  ' }, { year: 2026, month: 1, day: 1 })).toThrow();
});

test('date and identity invariants reject impossible dates, orphan references and missing cash accounts', () => {
  expect(() => dateSchema.parse({ year: 2025, month: 2, day: 29 })).toThrow();
  expect(dateSchema.parse({ year: 2024, month: 2, day: 29 }).day).toBe(29);
  const world = createLife('life_dates', 15, randomCreation(15), { year: 2026, month: 1, day: 1 });
  expect(() => validateWorld({ ...world, accounts: [] })).toThrow('Missing player account');
  expect(() => validateWorld({ ...world, relationships: [...world.relationships, world.relationships[0]] })).toThrow('Invalid relationship reference');
});
