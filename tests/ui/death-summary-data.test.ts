import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { copyWorld, decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { recordDeath } from '../../src/game/engine';
import { ageOn } from '../../src/game/personHelpers';
import { countries } from '../../src/game/countries';
import { formatMoney } from '../../src/game/money';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { deathSummary } from '../../src/ui/deathSummary';
import { terminalBiography } from '../../src/ui/terminalBiography';
import graduate from '../fixtures/v3-employed-graduate.json';
import newborn from '../fixtures/v1-newborn.json';

const row = (world: World, id: string, personId = world.activePersonId) => deathSummary(world, personId)!.rows.find(item => item.id === id);
function deceased() {
  const world = decodeWorld(JSON.stringify(graduate));
  recordDeath(world, world.activePersonId, 'Declared projection mortality boundary');
  return world;
}

test('the compact summary reuses the actual longest employment and frozen estate; no lifetime peaks or anecdotal journals are invented', () => {
  const world = deceased(), person = world.people[world.activePersonId], before = encodeWorld(world), summary = deathSummary(world)!, estate = world.estates.find(item => item.personId === person.id)!;
  expect(summary.age).toBe(ageOn(person, person.died!)); expect(summary.cause).toBe(person.causeOfDeath);
  expect(row(world, 'career')?.value).toBe(terminalBiography(world)!.careerTitle);
  expect(row(world, 'wealth')?.value).toBe(formatMoney(estate.netWorthAtDeath, countries[person.country].locale));
  expect(summary.rows.map(item => item.id).slice(0, 2)).toEqual(['wealth', 'career']); expect(summary.rows.length).toBeLessThanOrEqual(6);
  expect(summary.finalHappiness).toBe(person.stats.happiness);
  expect(summary.summary + summary.epitaph + JSON.stringify(summary.rows)).not.toMatch(/peak|legendary|eating glue|suspended|peacefully|lifetime earnings/i);
  expect(encodeWorld(world)).toBe(before);
});

test('an ancestor keeps their frozen death figures after child continuation instead of inheriting the child’s balances or possessions', () => {
  const world = unpackCheckpoint(readFileSync(join(__dirname, '../fixtures/v30-family-year91-checkpoint.json'), 'utf8'));
  expect(world.activePersonId).not.toBe('person_player');
  const before = encodeWorld(world), expected = deathSummary(world, 'person_player')!, estate = world.estates.find(item => item.personId === 'person_player')!;
  expect(expected.rows.find(item => item.id === 'wealth')?.value).toBe(formatMoney(estate.netWorthAtDeath, countries[world.people.person_player.country].locale));
  // Projection traps only, never validated/saved or presented as new gameplay.
  const guarded: World = { ...world };
  Object.defineProperties(guarded, { accounts: { get() { throw Error('An heir’s balance is not frozen death wealth'); } }, assets: { get() { throw Error('Settled ownership is not ownership at death'); } }, ledger: { get() { throw Error('No lifetime receipts reconstruction'); } } });
  expect(deathSummary(guarded, 'person_player')).toEqual(expected);
  expect(encodeWorld(world)).toBe(before);
});

test('highest earned qualification uses level, then year; later records and unsupported anecdotes never replace saved facts', () => {
  // Declared projection-only boundary; these edited values are not a saved life.
  const world = deceased(), person = world.people[world.activePersonId];
  person.died = { year: 2050, month: 1, day: 1 };
  person.education.qualifications = [
    { level: 'trade', field: 'computing', year: 2049 }, { level: 'degree', field: 'science', year: 2048 },
    { level: 'medicine', field: 'medicine', year: 2040 }, { level: 'law', field: 'law', year: 2039 },
    { level: 'law', field: 'law', year: 2051 },
  ];
  expect(row(world, 'education')?.value).toBe('Medicine qualification');
  person.education.qualifications = [{ level: 'degree', field: '', year: 2040 }];
  expect(row(world, 'education')?.value).toBe('University degree');
  const original = deathSummary(world), journal = world.journal[0];
  world.journal.push({ ...journal, id: 'untrusted_anecdote', text: 'I was suspended for eating glue and became a legendary millionaire.' });
  expect(deathSummary(world)).toEqual(original);
});

test('sparse newborn records stay respectful and unknown frozen wealth is not reconstructed as a zero balance', () => {
  const world = decodeWorld(JSON.stringify(newborn)), player = world.people[world.activePersonId];
  expect(deathSummary(world)).toBeNull(); expect(deathSummary(world, 'missing')).toBeNull();
  // Projection-only sparse legacy boundary: do not manufacture an estate.
  player.died = { ...player.born }; player.causeOfDeath = null;
  const summary = deathSummary(world)!;
  expect(summary.summary).toBe('Your story ended before its first birthday.');
  expect(row(world, 'wealth')).toMatchObject({ label: 'Net worth at death', value: 'Not recorded' });
  expect(summary.rows.map(item => item.id)).toEqual(['wealth']);
  expect(summary.summary + summary.epitaph).not.toMatch(/job|unemployed|never worked|wedding|offence|glue|millionaire/i);
});

test('adoptions after death do not change an earlier memorial and sentence credit is never called served prison time', () => {
  const world = deceased(), person = world.people[world.activePersonId], parent = world.relationships.find(edge => edge.to === person.id && edge.roles.includes('parent'))!;
  const before = deathSummary(world);
  // These projection traps deliberately are not imported as playable records.
  world.relationships.push({ ...parent, id: 'future_child', from: person.id, to: parent.from, since: { ...person.died!, year: person.died!.year + 1 } });
  expect(deathSummary(world)).toEqual(before);
  world.sentences.push({ id: 'projection_sentence', personId: person.id, caseIds: ['projection_case'], country: person.country, city: person.city, facility: 'Projection only', started: person.born,
    totalMonths: 240, servedMonths: 14, creditedMonths: 120, lastServedMonth: 0, state: 'death', ended: person.died, behavior: 50, routine: { work: false, study: false, exercise: false, conduct: 'quiet' }, studyMonths: 0, appealRoll: 50, appealed: false, releaseReason: 'death' });
  expect(row(world, 'legal')?.value).toBe('1 year, 2 months served');
  expect(row(world, 'legal')?.value).not.toMatch(/120|240|10 years|20 years/);
  const copy = copyWorld(world); expect(deathSummary(copy)).toEqual(deathSummary(world));
});
