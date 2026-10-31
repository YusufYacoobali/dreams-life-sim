import type { World } from '../model';
import type { RuntimeEffectRow } from '../runtime';
import { formatMoney } from '../money';
import { conditions } from '../content/health';
import { fullName } from '../personHelpers';
type Offer = NonNullable<World['lifestyle']>['offers'][number];
/** Small subject snapshot; display preparation neither draws nor mutates. */
export function captureLifestyleConsequences(world: World, offer: Offer) {
  const person = world.people[offer.personId], asset = world.assets.find(row => row.id === offer.subjectId), pet = world.pets.find(row => row.id === offer.subjectId);
  const tenancy = world.lifestyle!.tenancies.find(row => row.id === offer.tenancyId), hobby = world.hobbies.find(row => row.id === offer.subjectId);
  const edge = offer.participantId ? world.relationships.find(row => row.from === person.id && row.to === offer.participantId || row.to === person.id && row.from === offer.participantId) : undefined;
  return {
    ledgerCursor: world.ledger.length, incidentCursor: world.incidents.length,
    stats: { happiness: person.stats.happiness, discipline: person.stats.discipline, respect: person.stats.respect },
    asset: asset ? { condition: asset.condition, value: asset.value, currency: asset.currency } : null,
    pet: pet ? { happiness: pet.happiness, training: pet.companion?.training, bonds: Object.fromEntries([person.id, ...(offer.participantId ? [offer.participantId] : [])].map(id => [id, pet.bonds[id] ?? 0])) } : null,
    tenancy: tenancy ? { satisfaction: tenancy.satisfaction, maintenance: tenancy.maintenance, currency: tenancy.currency } : null,
    proficiency: hobby?.proficiency, relationship: edge?.strength,
    conditions: person.health.conditions.map(row => ({ id: row.id, severity: row.severity, status: row.status })),
  };
}
export function lifestyleConsequenceRows(world: World, offer: Offer, before: ReturnType<typeof captureLifestyleConsequences>): RuntimeEffectRow[] {
  const after = captureLifestyleConsequences(world, offer), rows: RuntimeEffectRow[] = [];
  const number = (id: string, label: string, old: number | undefined, next: number | undefined, increaseGood = true) => {
    if (old === undefined || next === undefined || old === next) return;
    rows.push({ id, label, value: old + '% → ' + next + '%', tone: (next > old) === increaseGood ? 'positive' : 'negative' });
  };
  const money = (id: string, label: string, old: bigint, next: bigint, currency: Offer['currency'], increaseGood: boolean) => {
    if (old === next) return;
    rows.push({ id, label, value: formatMoney({ minor: old, currency }) + ' → ' + formatMoney({ minor: next, currency }), tone: (next > old) === increaseGood ? 'positive' : 'negative' });
  };
  const payments = world.ledger.slice(before.ledgerCursor).filter(row => row.personId === offer.personId);
  for (const currency of [...new Set(payments.map(row => row.currency))]) {
    const cost = payments.filter(row => row.currency === currency && row.category === 'lifestyle-cost' && row.cashDelta < 0n).reduce((sum, row) => sum - row.cashDelta, 0n);
    const claim = payments.filter(row => row.currency === currency && row.category === 'insurance-claim' && row.cashDelta > 0n).reduce((sum, row) => sum + row.cashDelta, 0n);
    if (cost) rows.push({ id: 'cost-' + currency, label: 'Cost paid', value: formatMoney({ minor: -cost, currency }), tone: 'negative' });
    if (claim) rows.push({ id: 'insurance-' + currency, label: 'Insurance received', value: formatMoney({ minor: claim, currency }), tone: 'positive' });
  }
  if (before.asset && after.asset) {
    number('condition', world.assets.find(row => row.id === offer.subjectId)!.kind === 'property' ? 'Property condition' : 'Vehicle condition', before.asset.condition, after.asset.condition);
    money('value', 'Estimated value', before.asset.value, after.asset.value, after.asset.currency, true);
  }
  if (before.tenancy && after.tenancy) {
    money('maintenance', 'Outstanding maintenance', before.tenancy.maintenance, after.tenancy.maintenance, after.tenancy.currency, false);
    number('satisfaction', 'Tenant satisfaction', before.tenancy.satisfaction, after.tenancy.satisfaction);
  }
  number('relationship', offer.participantId ? 'Relationship with ' + fullName(world.people[offer.participantId]) : 'Relationship', before.relationship, after.relationship);
  if (before.pet && after.pet) {
    number('pet-happiness', 'Pet happiness', before.pet.happiness, after.pet.happiness);
    number('training', 'Pet training', before.pet.training, after.pet.training);
    for (const id of Object.keys(before.pet.bonds)) number('bond-' + id, id === offer.personId ? 'Your bond' : 'Bond with ' + fullName(world.people[id]), before.pet.bonds[id], after.pet.bonds[id]);
  }
  number('proficiency', 'Hobby proficiency', before.proficiency, after.proficiency);
  number('happiness', 'Happiness', before.stats.happiness, after.stats.happiness);
  number('discipline', 'Discipline', before.stats.discipline, after.stats.discipline);
  number('respect', 'Respect', before.stats.respect, after.stats.respect);
  for (const condition of world.people[offer.personId].health.conditions) {
    const old = before.conditions.find(row => row.id === condition.id);
    if (!old) rows.push({ id: 'injury-' + condition.id, label: conditions[condition.type].name, value: 'New injury · severity ' + condition.severity + '%', tone: 'negative' });
    else if (old.severity !== condition.severity) number('injury-' + condition.id, conditions[condition.type].name + ' severity', old.severity, condition.severity, false);
  }
  for (const incident of world.incidents.slice(before.incidentCursor)) if (incident.personId === offer.participantId && incident.victimId === offer.personId) rows.push({ id: 'incident-' + incident.id, label: 'Damage report', value: 'Vandalism incident opened', tone: 'neutral' });
  const record = world.lifestyle!.records.at(-1);
  if (record?.kind === 'story-' + offer.templateId && record.outcomeRoll !== undefined) rows.push({ id: 'practice-attempt', label: 'Practice attempt', value: record.success ? 'Succeeded' : 'Needs another attempt', tone: record.success ? 'positive' : 'neutral' });
  return rows;
}
