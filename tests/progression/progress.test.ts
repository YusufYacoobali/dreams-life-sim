import { decodeSave } from '../../src/persistence/archive';
import { copyWorld, decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { accountFor } from '../../src/game/systems/common';
import { assetCatalog } from '../../src/game/content/assets';
import { assetPrice } from '../../src/game/systems/assets';
import { childrenOf } from '../../src/game/systems/family';
import { inheritedPossessions, lifeProgress, progressFacts } from '../../src/progression/progress';
import reading from '../fixtures/v28-ordinary-hobby-archive.json';
import graduate from '../fixtures/v3-employed-graduate.json';
import family from '../fixtures/v7-history-archive.json';
import travel from '../fixtures/v19-family-trip-archive.json';

const ack = (world: World) => world.pending ? resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }, true) : world;

test('genuine child history gives factual milestones and proportional goals without changing any world field', () => {
  const world = decodeSave(JSON.stringify(reading)).world, before = encodeWorld(world);
  const progress = lifeProgress(world)!;
  expect(progress.achievements.filter(item => item.complete).map(item => item.id)).toEqual(['first-report', 'hobby-year', 'pet-year']);
  expect(progress.facts).toMatchObject({ schoolReports: 4, highReports: 0, acceptedHelp: 0, hobbyMonths: 24, hobbyProficiency: 48, petCareMonths: 36, workMonths: 0 });
  expect(progress.challenges.find(item => item.id === 'care-and-craft')?.percent).toBe(98);
  expect(progress.challenges.every(item => !item.complete)).toBe(true);
  for (let index = 0; index < 5; index++) expect(lifeProgress(world)).toEqual(progress);
  expect(encodeWorld(world)).toBe(before);
  expect(progressFacts(world, 'missing-person')).toBeNull();
});

test('actual resumed months, report and academic help advance only the child’s retained history', () => {
  const original = decodeSave(JSON.stringify(reading)).world;
  let world = ack(original);
  world = resolveCommand(world, { type: 'advance' }, true);
  expect(world.pending?.title).toMatch(/Biscuit/);
  world = ack(world); world = resolveCommand(world, { type: 'resume' }, true); world = ack(world);
  world = resolveCommand(world, { type: 'study' }, true); world = ack(world);
  const school = currentSchool(world)!;
  world = resolveCommand(world, { type: 'school-help', communityId: school.id, teacherId: school.currentTeacherId }, true); world = ack(world);
  const progress = lifeProgress(world)!;
  expect(progress.facts).toMatchObject({ schoolReports: 5, highReports: 1, acceptedHelp: 1, hobbyMonths: 36, hobbyProficiency: 72, petCareMonths: 46 });
  expect(progress.challenges.find(item => item.id === 'care-and-craft')).toMatchObject({ complete: true, percent: 100 });
  expect(progress.challenges.find(item => item.id === 'school-confidence')?.percent).toBeCloseTo(200 / 3);
  expect(progressFacts(world, school.currentTeacherId)).toMatchObject({ schoolReports: 0, acceptedHelp: 0, hobbyMonths: 0, petCareMonths: 0 });
  expect(lifeProgress(original)?.challenges.find(item => item.id === 'care-and-craft')?.percent).toBe(98);
});

test('work counts paid history once and twelve repayments in one month count as one month', () => {
  let world = decodeWorld(JSON.stringify(graduate));
  expect(progressFacts(world)).toMatchObject({ workMonths: 12, secondaryQualifications: 1, furtherQualifications: 1 });
  world = ack(resolveCommand(world, { type: 'borrow', amount: 10000n }, true));
  const liabilityId = world.liabilities.at(-1)!.id;
  for (let index = 0; index < 12; index++) world = ack(resolveCommand(world, { type: 'repay', liabilityId, amount: 1n }, true));
  expect(progressFacts(world)?.repaymentMonths).toBe(1);
  expect(lifeProgress(world)?.achievements.find(item => item.id === 'repayment-year')).toMatchObject({ complete: false, goal: { value: 1 } });
});

test('a completed family trip counts for its actual child participant without borrowing another person’s history', () => {
  const world = decodeSave(JSON.stringify(travel)).world, trip = world.trips.find(item => item.status === 'completed')!;
  expect(trip.participantIds.length).toBeGreaterThan(1);
  for (const personId of trip.participantIds) expect(progressFacts(world, personId)).toMatchObject({ completedTrips: 1, destinationCountries: 1 });
  const outsider = Object.keys(world.people).find(id => !trip.participantIds.includes(id))!;
  expect(progressFacts(world, outsider)).toMatchObject({ completedTrips: 0, destinationCountries: 0 });
  expect(lifeProgress(world)?.challenges.find(item => item.id === 'world-explorer')?.percent).toBeCloseTo(100 / 3);
});

test('an actual bequest appears only for its heir after production estate settlement and legacy continuation', () => {
  let world = ack(decodeSave(JSON.stringify(family)).world);
  let guard = 0;
  while ((world.pending || world.annual) && guard++ < 100) {
    if (world.pending?.kind === 'decision') world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices.find(item => !choiceUnavailable(world, item))!.id }, true);
    else if (world.pending) world = ack(world);
    else world = resolveCommand(world, { type: 'resume' }, true);
  }
  expect(guard).toBeLessThan(100);
  const parentId = world.activePersonId, child = childrenOf(world)[0], offer = assetCatalog.find(item => item.id === 'guitar')!;
  expect(accountFor(world).cash).toBeGreaterThan(assetPrice(world, offer));
  world = ack(resolveCommand(world, { type: 'buy-asset', catalogId: offer.id, financing: 'cash', depositBps: 10000, termMonths: 360, quotedPrice: assetPrice(world, offer) }, true));
  const asset = world.assets.at(-1)!;
  expect(inheritedPossessions(world)).toEqual([]);
  const executor = Object.values(world.people).find(person => person.id !== parentId && person.id !== child.id && !person.died)!;
  world = ack(resolveCommand(world, { type: 'save-will', executorId: executor.id, shares: [{ personId: child.id, bps: 10000 }], bequests: [{ personId: child.id, assetId: asset.id }] }, true));
  const parentFacts = progressFacts(world);
  world = copyWorld(world); recordDeath(world, parentId, 'explicit terminal scenario'); validateWorld(world);
  world = resolveCommand(world, { type: 'continue-child', personId: child.id }, true);
  const inherited = inheritedPossessions(world);
  expect(inherited).toHaveLength(1); expect(inherited[0]).toMatchObject({ id: asset.id, ownerId: child.id, ownershipSource: 'inheritance' });
  expect(inherited[0].provenance.length).toBeGreaterThan(asset.provenance.length);
  expect(inheritedPossessions(world, parentId)).toEqual([]);
  expect(progressFacts(world)).toMatchObject({ workMonths: 0, marriages: 0 });
  expect(progressFacts(world, parentId)).toEqual(parentFacts);
});
