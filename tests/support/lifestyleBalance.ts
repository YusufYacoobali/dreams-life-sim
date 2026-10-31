import type { World } from '../../src/game/model';
import type { GameCommand } from '../../src/game/engine';
import { ageOn } from '../../src/game/personHelpers';
import { encodeWorld } from '../../src/game/model';
import { packCheckpoint } from '../../src/persistence/checkpoints';
export function lifestyleBalance(world: World, trace: readonly { command: GameCommand; date: World['date']; resolveMs?: number; presentation?: { kind: string; title: string; templateId?: string; effects?: { id: string }[] } }[], initialDate?: World['date']) {
  const offers = world.lifestyle?.offers ?? [], perYear = new Map<number, number>(), repetitions: { templateId: string; years: number }[] = [];
  const previous = new Map<string, number>();
  for (const offer of offers) {
    perYear.set(offer.date.year, (perYear.get(offer.date.year) ?? 0) + 1);
    const key = offer.personId + ':' + offer.templateId, last = previous.get(key);
    if (last !== undefined) repetitions.push({ templateId: offer.templateId, years: offer.date.year - last });
    previous.set(key, offer.date.year);
  }
  const start = initialDate ?? trace[0]?.date ?? world.date;
  const years = Math.max(1 / 12, (world.date.year * 12 + world.date.month - start.year * 12 - start.month) / 12);
  const enabled = world.lifestyle?.enabled ?? start, featureYears = Math.max(1 / 12, (world.date.year * 12 + world.date.month - enabled.year * 12 - enabled.month) / 12);
  const costs = new Map<string, { currency: string; kind: string; paid: bigint; received: bigint }>();
  for (const record of world.lifestyle?.records ?? []) { const key = record.currency + ':' + record.kind; const row = costs.get(key) ?? { currency: record.currency, kind: record.kind, paid: 0n, received: 0n }; row.paid += record.paid; row.received += record.received; costs.set(key, row); }
  const advances = trace.filter(row => row.command.type === 'advance').map(row => row.resolveMs ?? 0);
  const results = trace.filter(row => row.command.type === 'acknowledge');
  return {
    observedYears: years, enabledYears: featureYears, ageAtEnd: ageOn(world.people[world.activePersonId], world.date), ended: !!world.people[world.activePersonId].died,
    lifecycleOffers: offers.length, averageNewSituationsPerYear: offers.length / featureYears, maximumNewSituationsInYear: Math.max(0, ...perYear.values()), perYear: Object.fromEntries(perYear), repeatedSituations: repetitions,
    decisions: trace.filter(row => row.command.type === 'choose').length, resultPresentations: results.length, totalExplicitPresentations: trace.filter(row => row.presentation).length,
    recordBackedMajorSituationResults: results.filter(row => row.presentation?.effects?.some(effect => /^(injury-|incident-|value$)/.test(effect.id))).length,
    activityCosts: [...costs.values()],
    tenancies: (world.lifestyle?.tenancies ?? []).map(row => ({ id: row.id, currency: row.currency, paidRent: row.periods.reduce((n, p) => n + p.paid, 0n), periods: row.periods.length, arrears: row.arrears, outstandingMaintenance: row.maintenance, maintenancePaid: (world.lifestyle?.records ?? []).filter(record => record.subjectId === row.id && record.kind === 'tenant-repair').reduce((n, record) => n + record.paid, 0n) })),
    petCosts: world.pets.map(pet => ({ id: pet.id, species: pet.species, paidCare: pet.periods.reduce((n, period) => n + period.paid, 0n), carePeriods: pet.periods.length, visits: pet.visits.map(visit => ({ currency: visit.currency, paid: visit.paid })), status: pet.status })),
    hobbies: world.hobbies.map(hobby => ({ kind: hobby.kind, proficiency: hobby.proficiency, attendedMonths: hobby.practices.filter(row => row.attended && row.source === 'monthly').length, thresholds: [15, 40, 70, 90].map(threshold => ({ threshold, firstReached: hobby.practices.find(row => row.after >= threshold)?.date ?? null })), paidPractice: hobby.practices.reduce((n, row) => n + row.paid, 0n) })),
    saveBytes: Buffer.byteLength(encodeWorld(world)), checkpointBytes: Buffer.byteLength(packCheckpoint(world)), ledgerRows: world.ledger.length,
    ageUpResolveMs: { samples: advances.length, median: advances.length ? [...advances].sort((a,b) => a-b)[Math.floor(advances.length / 2)] : null, max: advances.length ? Math.max(...advances) : null },
    measurementScope: 'Automated player policy and cloud Node command-resolution timing. All commands are saved to real SQLite with cold reopening. Manual activity results and automatic situations are counted separately; this is not human playtesting or native frame timing.',
  };
}
