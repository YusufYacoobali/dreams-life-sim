import { encodeWorld } from '../../src/game/model';
import { careerCatalog } from '../../src/game/content/careers';
import { serviceCatalog } from '../../src/game/content/services';
import { premiumCareerFixture, premiumEntryFixture } from '../support/premiumCareers';

test.each(['athlete', 'military', 'astronaut'] as const)('%s fixtures finish a real paid term without replacing contracts or recorded outcomes', feature => {
  const active = premiumCareerFixture(feature, 'active'), between = premiumCareerFixture(feature, 'between');
  const rows = (world: typeof active) => feature === 'athlete' ? world.careers : world.serviceCareers;
  const initialCareer = rows(active).find(row => row.personId === active.activePersonId && row.kind === feature)!;
  const career = rows(between).find(row => row.personId === between.activePersonId && row.kind === feature)!;
  expect(initialCareer.status).toBe('active');
  expect(career).toMatchObject({ id: initialCareer.id, personId: active.activePersonId, kind: feature, status: 'between', started: initialCareer.started });
  expect(between.pending).toBeNull(); expect(between.annual).toBeNull();
  expect(between.people[between.activePersonId].employment).toBeNull();
  const employmentId = active.people[active.activePersonId].employment!.id;
  const history = between.workHistory.find(row => row.id === employmentId)!;
  expect(history.ended).not.toBeNull(); expect(history.grossEarned).toBeGreaterThan(0n);
  const payments = between.ledger.slice(active.ledger.length).filter(row => row.personId === active.activePersonId && row.category === 'income');
  expect(payments.length).toBeGreaterThan(0);
  expect(payments.reduce((sum, row) => sum + row.cashDelta, 0n)).toBe(history.grossEarned);
  if (feature === 'athlete') {
    const first = active.careers.find(row => row.id === career.id)!, final = between.careers.find(row => row.id === career.id)!;
    expect(final.projects[0]).toMatchObject({ id: first.projects[0].id, responseRoll: first.projects[0].responseRoll });
    expect(final.contractMonthsRemaining).toBe(0);
    expect(final.projects.reduce((sum, row) => sum + row.months, 0)).toBe(careerCatalog.athlete.contractMonths);
    expect(final.projects.reduce((sum, row) => sum + row.grossEarned, 0n)).toBe(history.grossEarned);
  } else {
    const first = active.serviceCareers.find(row => row.id === career.id)!, final = between.serviceCareers.find(row => row.id === career.id)!;
    expect(final.contracts).toHaveLength(1);
    expect(final.contracts[0]).toMatchObject({ id: first.contracts[0].id, examRoll: first.contracts[0].examRoll, months: serviceCatalog[feature].term });
    expect(final.periods).toHaveLength(serviceCatalog[feature].term);
    expect(final.periods.reduce((sum, row) => sum + row.gross, 0n)).toBe(history.grossEarned);
  }
});

test('fixture consumers receive independent worlds and entry preparation leaves premium career records empty', () => {
  const initial = premiumEntryFixture();
  expect(initial.careers).toEqual([]); expect(initial.serviceCareers).toEqual([]);
  const first = premiumCareerFixture('military', 'between'), encoded = encodeWorld(first);
  first.people[first.activePersonId].stats.energy = 0;
  expect(encodeWorld(premiumCareerFixture('military', 'between'))).toBe(encoded);
  expect(encodeWorld(premiumEntryFixture())).toBe(encodeWorld(initial));
});
