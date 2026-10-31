import { z } from 'zod';
import { ageOn, fullName } from '../personHelpers';
import type { World } from '../model';
import { countries, type CountryCode } from '../countries';
import { hobbyContent, hobbyKinds, type HobbyKind } from '../content/leisure';
import { hobbyEventApproaches, hobbyEventApproachContent, hobbyEventChance, hobbyEventContent, hobbyEventDeltas, type HobbyEventApproach } from '../content/hobbyEvents';
import { rules } from '../rules';
import { roundRatio } from '../money';
import { IneligibleAction } from '../errors';
import { accountFor, active, availableCash, bounded, charge, draw, fact, result } from './common';
import { activeHobbyPlan, personHobbies } from './leisureSchemas';
import { leisureConsent, leisurePayer, leisurePresent } from './leisure';
import type { HobbyEvent } from './hobbyEventSchemas';
export const hobbyEventCommandSchema = z.discriminatedUnion('type', [z.object({ type: z.literal('enter-hobby-event'), kind: z.enum(hobbyKinds), approach: z.enum(hobbyEventApproaches), reviewedPayerId: z.string(), quotedFee: z.bigint().positive() })]);
export type HobbyEventCommand = z.infer<typeof hobbyEventCommandSchema>;
export const hobbyEventFee = (country: CountryCode, kind: HobbyKind) => { const fee = roundRatio(rules[country].baseWage * BigInt(hobbyEventContent[kind].feeBps), 10000n); return fee > 0n ? fee : 1n; };
export function hobbyEventReason(world: World, kind: HobbyKind, approach: HobbyEventApproach): string | undefined {
  const person = active(world), payer = leisurePayer(world), hobby = personHobbies(world).find(item => item.kind === kind), plan = hobby && activeHobbyPlan(hobby);
  if (ageOn(person, world.date) < hobbyContent[kind].minAge) return 'Available from age ' + hobbyContent[kind].minAge;
  if (!leisurePresent(world, person)) return 'Return home and resolve your current restrictions first';
  if (!hobby || !plan || plan.country !== person.country || plan.city !== person.city) return 'Join a current local hobby routine first';
  if (hobby.practices.filter(row => row.source === 'monthly' && row.attended).length < 12) return 'Attend 12 monthly practices before your first community event';
  if (hobby.proficiency < 20) return 'Build at least 20 proficiency through practice';
  if (world.lifestyle?.records.some(row => row.personId === person.id && row.kind === 'hobby-competition' && row.subjectId === hobby.id && row.date.year === world.date.year)) return 'You already entered or requested a competition this calendar year';
  if (world.hobbyEvents.some(row => row.personId === person.id && row.kind === kind && row.date.year === world.date.year)) return 'You already entered or requested this hobby’s event this calendar year';
  if (person.stats.health < 25 || person.stats.energy < hobbyEventApproachContent[approach].energy) return 'Rest and recover before this approach';
  if (!payer) return 'An available actual parent or guardian in your household must agree';
  if (availableCash(accountFor(world, payer)) < hobbyEventFee(person.country, kind)) return fullName(payer) + ' cannot cover the entry fee';
}
export function resolveHobbyEvent(world: World, command: HobbyEventCommand) {
  const reason = hobbyEventReason(world, command.kind, command.approach); if (reason) throw new IneligibleAction(reason);
  const person = active(world), payer = leisurePayer(world)!, hobby = personHobbies(world).find(item => item.kind === command.kind)!, plan = activeHobbyPlan(hobby)!, fee = hobbyEventFee(person.country, command.kind), content = hobbyEventContent[command.kind];
  if (command.reviewedPayerId !== payer.id || command.quotedFee !== fee) throw new IneligibleAction('The payer or entry fee changed; review this event');
  const permission = leisureConsent(world, person, payer), ledgerCursor = world.ledger.length, available = availableCash(accountFor(world, payer)), chance = hobbyEventChance(hobby.proficiency, person.stats.discipline, command.approach);
  let roll: number | null = null, recognized = false; const effects: HobbyEvent['effects'] = [];
  if (permission.accepted) {
    charge(world, fee, 'hobby-event', content.name, undefined, countries[person.country].currency, payer);
    roll = draw(world, 'outcomes', 1, 100); recognized = roll <= chance;
    for (const [stat, delta] of Object.entries(hobbyEventDeltas(command.approach, recognized)) as [HobbyEvent['effects'][number]['stat'], number][]) {
      const before = person.stats[stat]; person.stats[stat] = bounded(before + delta); effects.push({ stat, before, after: person.stats[stat] });
    }
  }
  world.hobbyEvents.push({ id: 'hobby_event_' + world.revision, personId: person.id, hobbyId: hobby.id, planId: plan.id, kind: command.kind, payerId: payer.id, date: { ...world.date }, country: person.country, city: person.city, currency: countries[person.country].currency, approach: command.approach, quotedFee: fee, available, consent: permission, practiceCursor: hobby.practices.length, proficiency: hobby.proficiency, discipline: person.stats.discipline, chance, roll, recognized, paid: permission.accepted ? fee : 0n, ledgerCursor, paymentId: permission.accepted ? world.ledger[ledgerCursor].id : null, effects });
  fact(world, permission.accepted ? 'I took part in ' + content.name + (recognized ? ' and received a club commendation.' : '.') : fullName(payer) + ' declined my request to enter ' + content.name + '.', 'hobby');
  result(world, permission.accepted ? recognized ? 'A contribution to remember' : 'Part of the club' : 'Permission declined', permission.accepted ? (recognized ? content.recognized : content.attended) : fullName(payer) + ' did not agree. You did not attend and no entry fee was charged. You can ask again next calendar year.', 'leisure-' + command.kind, effects.map(item => { const delta = item.after - item.before; return { id: item.stat, label: item.stat[0].toUpperCase() + item.stat.slice(1), value: (delta >= 0 ? '+' : '') + delta + '%', tone: delta === 0 ? 'neutral' : (item.stat === 'stress' ? delta < 0 : delta > 0) ? 'positive' : 'negative' }; }));
}
