import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import type { GameCommand } from '../../src/game/engine';
import { randomCreation } from '../../src/game/createLife';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { lifestyleJourney } from '../support/lifestyleJourney';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { ageOn } from '../../src/game/personHelpers';
import { jobs } from '../../src/game/content/jobs';
import { jobReason, salaryFor } from '../../src/game/systems/work';
import { hourlyQuote } from '../../src/game/systems/hourlyWork';
import { accountFor, availableCash } from '../../src/game/systems/common';
import { assetCatalog } from '../../src/game/content/assets';
import { purchaseQuote, purchaseReason } from '../../src/game/systems/assets';
import { licenceFee } from '../../src/game/systems/vehicleLicences';
import { vehicleActivityCost } from '../../src/game/systems/vehicleActivities';
import { lifestyleReason } from '../../src/game/systems/lifestyleCommon';
import { hobbyFee, hobbyReason } from '../../src/game/systems/leisure';
import { hospitalized } from '../../src/game/systems/healthSchemas';

async function actualBirth() {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  try {
    await repository.initialise();
    const store = createGameStore({ repository: async () => repository, date: () => ({ year: 2000, month: 1, day: 1 }), id: () => 'life_young_driver' });
    expect(await store.getState().startLife({ ...randomCreation(42), country: 'US', city: 'New York', background: 'ordinary' }, 42)).toBe(true);
    expect(await store.getState().acknowledgeBirth()).toBe(true);
    return store.getState().world!;
  } finally { sqlite.close(); }
}
test('a young driver earns real part-time wages, passes at the first affordable eligible pause, buys lawfully and drives into adulthood', async () => {
  const run = await lifestyleJourney(await actualBirth());
  try {
    while (ageOn(run.world.people[run.world.activePersonId], run.world.date) < 16) await run.year();
    const road = assetCatalog.find(row => row.id === 'used-scooter')!;
    let firstPassAge: number | null = null, purchaseAge: number | null = null;
    const plan = async () => {
      let world = run.world, person = world.people[world.activePersonId];
      if (lifestyleReason(world, false)) return false;
      if (!world.lifestyle!.licences.some(row => row.passed) && availableCash(accountFor(world)) >= licenceFee(world, 'road')) {
        await run.act({ type: 'take-licence-test', kind: 'road', answers: [1, 2, 0], quotedFee: licenceFee(world, 'road') }, true);
        firstPassAge = ageOn(run.world.people[person.id], run.world.lifestyle!.licences.at(-1)!.date); return true;
      }
      if (!world.assets.some(row => row.ownerId === person.id && row.kind === 'vehicle') && !purchaseReason(world, road, 'cash') && world.lifestyle!.licences.some(row => row.passed)) {
        await run.act({ type: 'buy-asset', catalogId: road.id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: purchaseQuote(world, road, 'cash').price }, true);
        purchaseAge = ageOn(run.world.people[person.id], run.world.assets.at(-1)!.acquired); return true;
      }
      return false;
    };
    for (let year = 0; !purchaseAge && year < 4; year++) {
      for (const role of jobs.filter(job => job.partTime)) if (!run.world.people[run.world.activePersonId].employment && !jobReason(run.world, role, false, 12)) await run.act({ type: 'apply-job', roleId: role.id, reviewedHourlyTerms: hourlyQuote('US', role, 12) });
      while (await plan()) {}
      if (!purchaseAge) await run.year(plan);
    }
    expect(firstPassAge).not.toBeNull(); expect(purchaseAge).not.toBeNull();
    expect(firstPassAge!).toBeLessThan(18); expect(purchaseAge!).toBeLessThan(18);
    const id = run.world.assets.find(row => row.ownerId === run.world.activePersonId && row.kind === 'vehicle')!.id;
    await run.act({ type: 'enable-vehicle-activities', assetId: id });
    await run.act({ type: 'vehicle-activity', assetId: id, activity: 'drive', contactId: null, quotedCost: vehicleActivityCost(run.world, run.world.assets.find(row => row.id === id)!, 'drive') }, true);
    await run.act({ type: 'vehicle-activity', assetId: id, activity: 'service', contactId: null, quotedCost: vehicleActivityCost(run.world, run.world.assets.find(row => row.id === id)!, 'service') });
    while (ageOn(run.world.people[run.world.activePersonId], run.world.date) < 18) await run.year();
    expect(run.world.workHistory.some(row => row.personId === run.world.activePersonId && row.grossEarned > 0n)).toBe(true);
    expect(run.world.assets.find(row => row.id === id)!.vehicleLife!.mileage).toBe(12540);
    run.evidence('young-driver');
  } finally { run.close(); }
}, 300000);

test.each([false, true])('natural long-life policy with lifestyle enabled and paid reading %s retains pacing, mortality and saves', async paidReading => {
  const workload = JSON.parse(gunzipSync(readFileSync(join(__dirname, '../../docs/verification/final-polish/performance-core/workloads.json.gz'))).toString()) as { snapshots: { summary: { age: number }; payload: string }[] };
  const run = await lifestyleJourney(unpackCheckpoint(workload.snapshots.find(row => row.summary.age === 10)!.payload));
  try {
    if (!paidReading) {
      // Replay the published healthy ordinary-life policy with live pending IDs.
      // Extra capability review commands change revisions, never dates or funds.
      const commands = JSON.parse(gunzipSync(readFileSync(join(__dirname, '../../docs/verification/final-polish/performance-core/commands.json.gz'))).toString(), (_key, value) => value && typeof value === 'object' && '$dreamsBigInt' in value ? BigInt(value.$dreamsBigInt) : value) as GameCommand[];
      const openingRevision = run.world.revision;
      for (const command of commands.slice(openingRevision - 1)) {
        if (['choose', 'acknowledge', 'resume'].includes(command.type)) continue;
        if (!run.world.lifestyle && ageOn(run.world.people[run.world.activePersonId], run.world.date) >= 20) await run.act({ type: 'enable-lifestyle' }, true);
        if (command.type === 'advance') await run.year(); else await run.act(command);
      }
      const record = run.evidence('ordinary-long-life');
      expect(record.metrics.ageAtEnd).toBeGreaterThanOrEqual(90);
      expect(record.metrics.lifecycleOffers).toBe(0);
      expect(run.world.lifestyle?.enabled.year).toBe(run.world.people[run.world.activePersonId].born.year + 20);
      return;
    }
    while (ageOn(run.world.people[run.world.activePersonId], run.world.date) < 20) await run.year();
    await run.act({ type: 'enable-lifestyle' }, true);
    const start = run.trace.length;
    while (ageOn(run.world.people[run.world.activePersonId], run.world.date) < 90 && !run.world.people[run.world.activePersonId].died) {
      const person = run.world.people[run.world.activePersonId], age = ageOn(person, run.world.date);
      if ([20,30,50,70].includes(age)) console.info('LIFESTYLE_BALANCE_PROGRESS', JSON.stringify({ paidReading, age, ledger: run.world.ledger.length, cash: accountFor(run.world).cash.toString() }));
      if (!person.employment && age < 65 && person.education.stage === 'none' && !hospitalized(run.world, person)) {
        const role = jobs.filter(job => !job.specialCareer && !jobReason(run.world, job)).sort((a,b) => salaryFor(run.world,a)>salaryFor(run.world,b)?-1:1)[0];
        if (role) await run.act({ type: 'apply-job', roleId: role.id, ...(role.partTime ? { reviewedHourlyTerms: hourlyQuote(person.country, role) } : {}) });
      }
      if (paidReading && !run.world.hobbies.some(hobby => hobby.personId === person.id && hobby.kind === 'reading') && !hobbyReason(run.world, 'reading', 'community')) await run.act({ type: 'hobby-plan', kind: 'reading', mode: 'community', reviewedPayerId: person.id, quotedMonthlyFee: hobbyFee(person.country, 'reading', 'community') });
      if (!lifestyleReason(run.world, false)) {
        await run.act({ type: 'casual-hobby', kind: 'reading' });
        await run.act({ type: 'leisure-outing', kind: 'park', reviewedPayerId: person.id, quotedTotal: 0n });
      }
      await run.year();
    }
    const record = run.evidence(paidReading ? 'long-life-reading' : 'ordinary-long-life');
    expect(record.metrics.maximumNewSituationsInYear).toBeLessThanOrEqual(2);
    expect(record.metrics.repeatedSituations.every(row => row.years >= 5)).toBe(true);
    expect(run.trace.length).toBeGreaterThan(start);
    expect(run.world.assets.some(asset => asset.ownerId === run.world.activePersonId && asset.kind !== 'possession')).toBe(false);
    if (!paidReading) expect(record.metrics.ageAtEnd).toBeGreaterThanOrEqual(90);
    else expect(run.world.hobbies.some(row => row.kind === 'reading' && row.proficiency > 0)).toBe(true);
  } finally { run.close(); }
}, 1200000);
