import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { copyWorld, encodeWorld, World } from '../../src/game/model';
import { formatMoney } from '../../src/game/money';
import { countries } from '../../src/game/countries';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { lifetimeStatistics } from '../../src/ui/lifetimeStatistics';
import childArchive from '../fixtures/v28-ordinary-hobby-archive.json';
import creatorArchive from '../fixtures/v15-studio-archive.json';
import relocationArchive from '../fixtures/v20-relocation-archive.json';
import sparseArchive from '../fixtures/v7-history-archive.json';
import businessArchive from '../fixtures/v11-business-archive.json';

const section = (world: World, id: string, personId = world.activePersonId) => lifetimeStatistics(world, personId)!.sections.find(item => item.id === id)!;
const value = (world: World, category: string, id: string, personId = world.activePersonId) => section(world, category, personId).rows.find(row => row.id === id)?.value;

test('the historical child shows exact attended-month maxima, ownership care and qualifications without counting manual practice as another month', () => {
  const world = decodeSave(JSON.stringify(childArchive)).world, before = encodeWorld(world);
  expect(value(world, 'leisure', 'hobby-months')).toBe('24'); expect(value(world, 'leisure', 'proficiency')).toBe('48'); expect(value(world, 'leisure', 'hobby-kinds')).toBe('2');
  expect(value(world, 'leisure', 'pets')).toBe('1'); expect(value(world, 'leisure', 'pet-months')).toBe('0'); expect(value(world, 'leisure', 'pet-months', world.pets[0].ownerId)).toBe('36'); expect(value(world, 'school', 'further')).toBe('0'); expect(section(world, 'money').rows).toEqual([]);
  expect(world.hobbies[1].practices.filter(row => row.source === 'manual')).toHaveLength(1); expect(encodeWorld(world)).toBe(before);
});

test('retained creator archives contribute exactly once and receipts do not substitute account totals or business value', () => {
  const world = decodeSave(JSON.stringify(creatorArchive)).world, before = encodeWorld(world);
  expect(world.socialAccounts.some(account => account.archived.length)).toBe(true);
  expect(value(world, 'special', 'posts')).toBe('102'); expect(value(world, 'special', 'broadcasts')).toBe('102'); expect(value(world, 'special', 'minutes')).toBe('6,120');
  expect(value(world, 'money', 'USD:other')).toBe(formatMoney({ minor: 557626n, currency: 'USD' }, countries[world.people[world.activePersonId].country].locale)); expect(encodeWorld(world)).toBe(before);
});

test('old sparse history stays sparse rather than inferring schooling, trips or posts from age and narrative', () => {
  const world = decodeSave(JSON.stringify(sparseArchive)).world, before = encodeWorld(world);
  expect(value(world, 'school', 'reports')).toBe('0'); expect(value(world, 'family', 'trips')).toBe('0'); expect(value(world, 'special', 'posts')).toBe('0'); expect(value(world, 'leisure', 'hobby-months')).toBe('0'); expect(encodeWorld(world)).toBe(before);
});

test('currency/category projection traps cannot turn inherited wealth, loans, sale proceeds or gifts into earned receipts', () => {
  // Projection-only classification traps appended to a real migrated world.
  // These rows are not imported, validated, saved or claimed as gameplay.
  const world = copyWorld(decodeSave(JSON.stringify(relocationArchive)).world), personId = world.activePersonId;
  const before = section(world, 'money').rows;
  const base = world.ledger.find(row => row.personId === personId)!;
  for (const category of ['borrowing', 'inheritance', 'gift', 'transfer', 'sale', 'refinance', 'estate-distribution', 'fixture-funding']) world.ledger.push({ ...base, id: 'trap_' + category, category, currency: 'EUR', cashDelta: 900000000000000n, debtDelta: 0n });
  expect(section(world, 'money').rows).toEqual(before);
  world.ledger.push({ ...base, id: 'eur_pay', category: 'income', currency: 'EUR', cashDelta: 1234n, debtDelta: 0n }, { ...base, id: 'yen_pay', category: 'income', currency: 'JPY', cashDelta: 5678n, debtDelta: 0n }, { ...base, id: 'wrong_person', personId: 'person_parent1', category: 'income', currency: 'EUR', cashDelta: 999999999n, debtDelta: 0n }, { ...base, id: 'tax_paid', category: 'tax', currency: 'EUR', cashDelta: -120n, debtDelta: 0n }, { ...base, id: 'refund', category: 'tax', currency: 'EUR', cashDelta: 30n, debtDelta: 0n });
  expect(value(world, 'money', 'EUR:pay')).toBe(formatMoney({ minor: 1234n, currency: 'EUR' }, countries[world.people[personId].country].locale)); expect(value(world, 'money', 'JPY:pay')).toBe(formatMoney({ minor: 3205678n, currency: 'JPY' }, countries[world.people[personId].country].locale)); expect(value(world, 'money', 'EUR:tax')).toBe(formatMoney({ minor: 120n, currency: 'EUR' }, countries[world.people[personId].country].locale));
  expect(section(world, 'money').rows.map(row => row.id)).not.toContain('total'); const exact = structuredClone(world); lifetimeStatistics(world); expect(world).toEqual(exact);
});

test('the genuine retained family checkpoint isolates the current heir and deceased ancestor, including actual inheritance', () => {
  const world = unpackCheckpoint(readFileSync(join(__dirname, '../fixtures/v30-family-year91-checkpoint.json'), 'utf8'), true), activeId = world.activePersonId, before = encodeWorld(world);
  expect(activeId).toBe('person_npc_246_24'); expect(value(world, 'work', 'months')).toBe('336'); expect(value(world, 'work', 'months', 'person_player')).toBe('588'); expect(lifetimeStatistics(world, 'person_player')).toMatchObject({ name: 'Alex Walker', died: true, age: 86 });
  const inheritance = world.ledger.filter(row => row.personId === activeId && row.category === 'inheritance' && row.cashDelta > 0n); expect(inheritance.length).toBeGreaterThan(0);
  const pay = world.ledger.filter(row => row.personId === activeId && row.currency === 'USD' && ['income', 'background-income'].includes(row.category) && row.debtDelta === 0n && row.cashDelta > 0n).reduce((sum, row) => sum + row.cashDelta, 0n);
  expect(value(world, 'money', 'USD:pay')).toBe(formatMoney({ minor: pay, currency: 'USD' }, countries[world.people[activeId].country].locale)); expect(lifetimeStatistics(world, 'missing')).toBeNull(); expect(world.activePersonId).toBe(activeId); expect(encodeWorld(world)).toBe(before);
});

test('a historical company is founded by the person but its separate cash and ledger are not personal receipts', () => {
  const original = decodeSave(JSON.stringify(businessArchive)).world, world = copyWorld(original), before = section(world, 'money').rows;
  expect(value(world, 'work', 'businesses')).toBe('1'); expect(world.businesses[0].cash).toBeGreaterThan(0n); expect(world.businessLedger.length).toBeGreaterThan(0);
  // Projection-only separation trap, deliberately not a valid saved ledger.
  world.businesses[0].cash += 900000000000n;
  world.businessLedger.push({ ...world.businessLedger[0], id: 'separate_company_cash', cashDelta: 900000000000n });
  expect(section(world, 'money').rows).toEqual(before); expect(section(original, 'money').rows).toEqual(before);
});
