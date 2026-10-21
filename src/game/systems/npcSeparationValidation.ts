import { ageOn, compareDates, type GameDate, type World } from '../model';
import { monthFrom } from '../calendar';
import { npcSeparationAdultAgesV1, npcSeparationAtRiskV1, npcSeparationAttemptKey, npcSeparationChanceV1 } from './npcSeparationSchemas';

const pairKey = (a: string, b: string) => JSON.stringify([a, b].sort());
export function validateNpcSeparations(world: World) {
  const counterKeys = Object.keys(world.actionCounts).filter(key => key.startsWith('npc-separation:'));
  if (!world.npcSeparations.length) { if (counterKeys.length) throw new Error('NPC separation counter lacks its actual attempt'); return; }
  const relations = new Map(world.relationships.map(row => [row.id, row])), pairs = new Map(world.relationships.map(row => [pairKey(row.from, row.to), row])), courtships = new Map(world.npcCourtships.map(row => [row.id, row]));
  const marriages = new Map(world.marriages.map(row => [row.id, row]));
  const observers = new Map<string, { from: GameDate; through: GameDate }>();
  let actorId = world.legacies[0]?.fromId ?? world.activePersonId, from = world.people[actorId].born;
  for (const legacy of world.legacies) { observers.set(actorId, { from, through: legacy.date }); actorId = legacy.toId; from = legacy.date; }
  observers.set(actorId, { from, through: world.date });
  const ids = new Set<string>(), keys = new Set<string>(), separated = new Set<string>();
  let previous = world.npcSeparations[0].date;
  for (const row of world.npcSeparations) {
    const a = world.people[row.a], b = world.people[row.b], observer = world.people[row.observerId], period = observers.get(row.observerId), relation = relations.get(row.relationshipId), courtship = courtships.get(row.courtshipId), key = npcSeparationAttemptKey(row.date.year);
    if (!a || !b || !observer || a.id === b.id || [a.id, b.id].includes(observer.id) || !period || compareDates(row.date, period.from) < 0 || compareDates(row.date, period.through) > 0 || ids.has(row.id) || !/^npc_separation_\d+_\d+$/.test(row.id) || !relation || relation.from !== a.id || relation.to !== b.id || !courtship || courtship.relationshipId !== relation.id || courtship.a !== a.id || courtship.b !== b.id) throw new Error('Invalid NPC separation identity');
    if (keys.has(key) || world.actionCounts[key] !== 1 || compareDates(row.date, previous) < 0 || compareDates(row.date, world.date) > 0 || compareDates(monthFrom(courtship.observedSince, 12, courtship.observedSince.day), row.date) > 0 || compareDates(row.date, courtship.lastChecked) > 0 || courtship.ended && compareDates(row.date, courtship.ended) > 0) throw new Error('Invalid NPC separation time or repeated attempt');
    for (const person of [a, b, observer]) if (compareDates(person.born, row.date) > 0 || person.died && compareDates(row.date, person.died) > 0) throw new Error('NPC separation requires actual living participants at its date');
    for (const person of [a, b]) { const known = pairs.get(pairKey(observer.id, person.id)); if (!known || compareDates(known.since, row.date) > 0) throw new Error('NPC separation must be observed through genuine known people'); }
    if (row.observerPartnerId) {
      const partner = world.people[row.observerPartnerId], bond = pairs.get(pairKey(observer.id, row.observerPartnerId));
      if (!partner || [a.id, b.id, observer.id].includes(partner.id) || !bond || compareDates(bond.since, row.date) > 0) throw new Error('NPC separation cannot affect the observing player’s partner');
    }
    if (ageOn({ ...a, died: null }, row.date) < npcSeparationAdultAgesV1[row.countryA] || ageOn({ ...b, died: null }, row.date) < npcSeparationAdultAgesV1[row.countryB] || row.countryA !== row.countryB || !npcSeparationAtRiskV1(row.strength, row.trust) || row.chance !== npcSeparationChanceV1(row.strength, row.trust) || (row.outcome === 'separated') !== (row.roll <= row.chance)) throw new Error('Invalid NPC separation eligibility or V1 outcome');
    if (courtship.marriageId) { const marriage = marriages.get(courtship.marriageId); if (!marriage || compareDates(row.date, marriage.started) > 0) throw new Error('NPC dating separation cannot follow its wedding'); }
    if (row.outcome === 'separated') {
      if (separated.has(courtship.id) || courtship.marriageId || courtship.endReason !== 'separated' || !courtship.ended || compareDates(courtship.ended, row.date) !== 0 || compareDates(courtship.lastChecked, row.date) !== 0 || courtship.proposals.some(proposal => proposal.date.year >= row.date.year)) throw new Error('NPC separation must end its exact actual dating clock');
      separated.add(courtship.id);
    } else if (courtship.endReason === 'separated' && courtship.ended && compareDates(courtship.ended, row.date) === 0) throw new Error('A continued attempt cannot claim its same-date separation');
    ids.add(row.id); keys.add(key); previous = row.date;
  }
  // Legacy clocks already ended:'separated' need no reconstructed attempt.
  // Only the new reserved counters and their typed rows bind reciprocally.
  if (counterKeys.some(key => !keys.has(key))) throw new Error('NPC separation counter lacks its actual attempt');
}
