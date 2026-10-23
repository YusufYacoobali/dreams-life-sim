import { inflateSync } from 'node:zlib';
import { countries, countryCodes } from '../../src/game/countries';
import { creationNamePools } from '../../src/game/content/creationNames';
import { familyNamePools } from '../../src/game/content/nameExpansion';
import { generatedPersonName } from '../../src/game/names';
import { createLife, randomCreation } from '../../src/game/createLife';
import { createContact } from '../../src/game/systems/npcs';
import { addChild } from '../../src/game/systems/family';
import { decodeWorld, encodeWorld, fullName, validateWorld } from '../../src/game/model';
import { nextRandom } from '../../src/game/random';
import prior from '../fixtures/v48-cult-voice-before.json';

const date = { year: 2026, month: 10, day: 23 };
const genders = ['male', 'female', 'nonbinary'] as const;

test.each(countryCodes)('%s has substantial local pools without duplicate, blank or invalid names', country => {
  for (const gender of genders) {
    const pool = creationNamePools[country][gender];
    expect(pool.length).toBeGreaterThanOrEqual(gender === 'nonbinary' ? 16 : 48);
    expect(new Set(pool).size).toBe(pool.length);
    expect(pool.every(name => name === name.trim() && name.length > 0 && name.length <= 40 && !/[\u0000-\u001f]/.test(name))).toBe(true);
    expect(pool.every(name => countries[country].firstNames.includes(name))).toBe(true);
  }
  expect(familyNamePools[country].length).toBeGreaterThanOrEqual(60);
  expect(new Set(familyNamePools[country]).size).toBe(familyNamePools[country].length);
  expect(countries[country].lastNames).toEqual(familyNamePools[country]);
});

test.each(countryCodes)('%s creates a varied cohort with appropriate names and no new full-name collisions', country => {
  const world = createLife('life_name_cohort_' + country, 42, { ...randomCreation(42), country, city: countries[country].cities[0], background: 'ordinary' }, date);
  const previous = JSON.parse(encodeWorld(world)).people;
  const generated: string[] = [], firstNames: string[] = [];
  for (const gender of genders) for (let i = 0; i < (gender === 'nonbinary' ? 20 : 50); i++) {
    const random = { ...world.random }; let expected = random.npcs;
    for (let draw = 0; draw < (gender === 'nonbinary' ? 19 : 18); draw++) expected = nextRandom(expected).state;
    const person = createContact(world, { age: 7, gender });
    expect(creationNamePools[country][gender]).toContain(person.firstName);
    expect(countries[country].lastNames).toContain(person.lastName);
    expect(world.random).toEqual({ ...random, npcs: expected });
    generated.push(fullName(person)); firstNames.push(person.firstName);
  }
  expect(new Set(generated).size).toBe(120);
  expect(new Set(firstNames).size).toBeGreaterThanOrEqual(85);
  const after = JSON.parse(encodeWorld(world));
  for (const [id, person] of Object.entries(previous)) expect(after.people[id]).toEqual(person);
  expect(encodeWorld(decodeWorld(encodeWorld(world)))).toBe(encodeWorld(world));
  validateWorld(world);
});

test.each(countryCodes)('%s new lives preserve manual player names and give parents suitable varied names', country => {
  const names = new Set<string>();
  for (let seed = 0; seed < 24; seed++) {
    const input = { ...randomCreation(seed), firstName: 'My chosen name', lastName: 'My surname', country, city: countries[country].cities[0], background: 'ordinary' as const };
    const world = createLife('life_parent_names_' + seed, seed, input, date);
    expect(world.people[world.activePersonId]).toMatchObject({ firstName: input.firstName, lastName: input.lastName });
    for (const person of Object.values(world.people).filter(person => person.id !== world.activePersonId)) {
      expect(creationNamePools[country][person.gender]).toContain(person.firstName);
      expect(person.lastName).toBe(input.lastName); names.add(person.firstName);
    }
  }
  expect(names.size).toBeGreaterThan(20);
});

test('the raw random-life constructor also chooses country- and gender-aware names deterministically', () => {
  for (let seed = 0; seed < 360; seed++) {
    const input = randomCreation(seed);
    expect(creationNamePools[input.country][input.gender]).toContain(input.firstName);
    expect(countries[input.country].lastNames).toContain(input.lastName);
    expect(randomCreation(seed)).toEqual(input);
  }
});

test('biological siblings keep the inherited family name while avoiding accidental duplicate first names', () => {
  const world = createLife('life_sibling_names', 42, { ...randomCreation(42), country: 'JP', city: 'Tokyo', lastName: 'My chosen surname', background: 'ordinary' }, date);
  const parent = world.people.person_parent1;
  const first = addChild(world, [parent], 'biological'), second = addChild(world, [parent], 'biological');
  expect(first.lastName).toBe(parent.lastName); expect(second.lastName).toBe(parent.lastName);
  expect(first.firstName).not.toBe(second.firstName);
  expect(first.firstName).not.toBe(world.people[world.activePersonId].firstName);
  validateWorld(world);
});

test('exhausting local first names falls back to a distinct real full name without numbered inventions', () => {
  const firstNames = creationNamePools.US.male;
  const existing = firstNames.map(firstName => ({ firstName, lastName: familyNamePools.US[0], country: 'US' as const, city: 'New York', died: null }));
  const before = JSON.stringify(existing), result = generatedPersonName('US', 'male', 0, 0, existing, 'New York');
  expect(firstNames).toContain(result.firstName); expect(familyNamePools.US).toContain(result.lastName);
  expect(existing.some(person => fullName(person) === fullName(result))).toBe(false);
  expect(JSON.stringify(existing)).toBe(before);
});

test('loading a genuine earlier save preserves every recorded name and bound scene literally', () => {
  const saved = JSON.parse(inflateSync(Buffer.from(prior.data, 'base64')).toString()).contexts[0].world;
  const world = decodeWorld(JSON.stringify(saved));
  expect(world.pending).toEqual(saved.pending);
  for (const [id, person] of Object.entries(saved.people) as [string, { firstName: string; lastName: string }][]) expect(world.people[id]).toMatchObject({ firstName: person.firstName, lastName: person.lastName });
});
