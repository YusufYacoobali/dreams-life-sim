import { z } from 'zod';
import { ageOn, fullName, Person, World } from '../model';
import { countries, CountryCode } from '../countries';
import { hobbyContent, hobbyKinds, HobbyKind, hobbyModes, outingContent, outingKinds, OutingKind } from '../content/leisure';
import { roundRatio } from '../money';
import { rules } from '../rules';
import { IneligibleAction } from '../errors';
import { accountFor, active, availableCash, bounded, charge, draw, fact, result } from './common';
import { activeTrip } from './travelSchemas';
import { parentOf } from './travel';
import { serviceAway } from './serviceSchemas';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { offerPending } from '../pendingQueue';
import { activeHobbyPlan, Hobby, HobbyPlan, LeisureEffect, personHobbies } from './leisureSchemas';
const absolute = (world: World) => world.date.year * 12 + world.date.month - 1;
export const leisureCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hobby-plan'), kind: z.enum(hobbyKinds), mode: z.enum(hobbyModes), reviewedPayerId: z.string(), quotedMonthlyFee: z.bigint().nonnegative() }),
  z.object({ type: z.literal('stop-hobby'), hobbyId: z.string(), planId: z.string() }),
  z.object({ type: z.literal('practise-hobby'), hobbyId: z.string(), planId: z.string() }),
  z.object({ type: z.literal('leisure-outing'), kind: z.enum(outingKinds), reviewedPayerId: z.string(), quotedTotal: z.bigint().positive() }),
]);
export type LeisureCommand = z.infer<typeof leisureCommandSchema>;
export function leisurePresent(world: World, person: Person) { return !person.died && !activeTrip(world, person.id) && !serviceAway(world, person.id) && !hospitalized(world, person) && !isConfined(world, person) && !person.legal.wanted; }
export function leisurePayer(world: World, person = active(world)) {
  if (ageOn(person, world.date) >= 18) return person;
  return Object.values(world.people).find(parent => ageOn(parent, world.date) >= 18 && leisurePresent(world, parent) && !!person.householdId && parent.householdId === person.householdId && parent.country === person.country && parent.city === person.city && parentOf(world, parent.id, person.id));
}
export const hobbyFee = (country: CountryCode, kind: HobbyKind, mode: HobbyPlan['mode']) => roundRatio(rules[country].baseWage * BigInt(hobbyContent[kind].feeBps * (mode === 'lessons' ? 4 : 1)), 10000n);
export function outingFee(world: World, kind: OutingKind) { const person = active(world); return roundRatio(rules[person.country].baseWage * BigInt(outingContent[kind].feeBps), 10000n) * (ageOn(person, world.date) < 18 ? 2n : 1n); }
const requestKey = (world: World, kind: HobbyKind, mode: HobbyPlan['mode'], payerId: string) => active(world).id + ':hobby-request:' + kind + ':' + mode + ':' + payerId + ':' + world.date.year;
function consent(world: World, person: Person, payer: Person) {
  const edge = world.relationships.find(item => item.from === payer.id && item.to === person.id || item.to === payer.id && item.from === person.id), strength = person.id === payer.id ? null : edge?.strength ?? 20, chance = strength === null ? 100 : Math.min(95, 45 + Math.floor(strength / 2)), roll = strength === null ? 100 : draw(world, 'npcs', 1, 100);
  return { strength, chance, roll, accepted: roll <= chance };
}
export function hobbyReason(world: World, kind: HobbyKind, mode: HobbyPlan['mode']): string | undefined {
  const person = active(world), payer = leisurePayer(world), existing = personHobbies(world).find(item => item.kind === kind), plan = existing && activeHobbyPlan(existing);
  if (ageOn(person, world.date) < hobbyContent[kind].minAge) return 'Available from age ' + hobbyContent[kind].minAge;
  if (!leisurePresent(world, person)) return 'Return home and resolve your current restrictions first';
  if (!payer) return 'An available actual parent or guardian in your household must agree';
  if (person.stats.health < 25 || person.stats.energy < 4) return 'Rest and recover before starting a routine';
  if (kind === 'guitar' && person.training?.skill === 'music') return 'Finish or pause your music career-training routine first';
  if (plan?.mode === mode && plan.payerId === payer.id) return 'This is already your current routine';
  if (!plan && personHobbies(world).filter(item => activeHobbyPlan(item)).length >= 2) return 'Keep at most two active hobby routines';
  if (payer.id !== person.id && world.actionCounts[requestKey(world, kind, mode, payer.id)]) return 'This routine has already been requested from this adult this calendar year';
  if (payer.id === person.id && (world.actionCounts[person.id + ':hobby-change:' + kind + ':' + absolute(world)] ?? 0) >= 2) return 'Two routine changes are available per hobby each month';
  if (availableCash(accountFor(world, payer)) < hobbyFee(person.country, kind, mode)) return fullName(payer) + ' cannot cover a month of this routine';
}
export function hobbyPauseReason(world: World, hobby: Hobby, plan: HobbyPlan, manual = false): Hobby['practices'][number]['reason'] {
  const person = world.people[hobby.personId], payer = world.people[plan.payerId];
  if (activeTrip(world, person.id) || serviceAway(world, person.id)) return 'away';
  if (isConfined(world, person) || person.legal.wanted) return 'restricted';
  if (hospitalized(world, person) || person.stats.health < 25) return 'health';
  if (person.stats.energy < (!manual && plan.mode === 'lessons' ? 4 : 2)) return 'fatigue';
  if (!leisurePresent(world, payer)) return 'payer-away';
  if (hobby.kind === 'guitar' && person.training?.skill === 'music') return 'career-training';
  if (!manual && availableCash(accountFor(world, payer, plan.currency)) < plan.monthlyFee) return 'funds';
  return null;
}
export const hobbyPauseLabels = { away: 'You are away from home', restricted: 'Resolve custody or pursuit first', health: 'Recover your health first', fatigue: 'Rest before practising', 'payer-away': 'The responsible adult is unavailable', funds: 'The responsible payer cannot cover this month', 'career-training': 'Music career training is using this practice time' } as const;
export function hobbyPracticeReason(world: World, hobby: Hobby, plan: HobbyPlan): string | undefined {
  if (hobby.personId !== world.activePersonId || plan.status !== 'active') return 'Choose your active hobby routine';
  const reason = hobbyPauseReason(world, hobby, plan, true); if (reason) return hobbyPauseLabels[reason];
  if (!hobby.practices.some(item => item.planId === plan.id && item.source === 'monthly' && item.attended && item.date.year === world.date.year && item.date.month === world.date.month)) return 'Attend a month of this routine before extra practice';
  if (hobby.practices.some(item => item.source === 'manual' && item.date.year === world.date.year && item.date.month === world.date.month)) return 'You already did extra practice in this hobby this month';
}
function change(world: World, person: Person, stat: LeisureEffect['stat'], delta: number): LeisureEffect {
  const before = stat === 'music' ? person.skills.music : person.stats[stat], after = bounded(before + delta);
  if (stat === 'music') person.skills.music = after; else person.stats[stat] = after;
  return { stat, before, after };
}
function closePlan(world: World, hobby: Hobby, plan: HobbyPlan, status: Exclude<HobbyPlan['status'], 'active' | 'declined'>, reason: string, notify = false) {
  plan.status = status; plan.ended = { ...world.date }; plan.endReason = reason;
  fact(world, 'My ' + hobbyContent[hobby.kind].name.toLowerCase() + ' routine ended. ' + reason, 'hobby', '', hobby.personId);
  if (notify && hobby.personId === world.activePersonId && !active(world).died) {
    offerPending(world, { kind: 'result', id: 'hobby_end_' + plan.id + '_' + status + '_' + world.revision, title: 'Review your ' + hobbyContent[hobby.kind].name.toLowerCase() + ' routine', body: reason + ' Your proficiency and actual practice history remain. Review current terms to return; no future routine fees are charged.', illustration: 'leisure-' + hobby.kind, effects: [] }, 30);
    if (world.annual?.stage === 'months') world.annual.pausedForPlanning = true;
  }
}
export function refreshLeisure(world: World) {
  for (const hobby of world.hobbies) {
    const plan = activeHobbyPlan(hobby); if (!plan) continue; const person = world.people[hobby.personId], payer = world.people[plan.payerId];
    if (person.died) closePlan(world, hobby, plan, 'died', 'The participant died.');
    else if (person.country !== plan.country || person.city !== plan.city) closePlan(world, hobby, plan, 'moved', 'You moved away from the original local arrangement.', true);
    else if (payer.id !== person.id && ageOn(person, world.date) >= 18) closePlan(world, hobby, plan, 'adult-review', 'As an adult, review a routine funded from your own account.', true);
    else if (payer.died || payer.id !== person.id && (!person.householdId || payer.householdId !== person.householdId || payer.country !== plan.country || payer.city !== plan.city || !parentOf(world, payer.id, person.id))) closePlan(world, hobby, plan, 'payer-lost', 'The original responsible adult can no longer fund this household arrangement.', true);
  }
}
export function outingReason(world: World, kind: OutingKind): string | undefined {
  const person = active(world), payer = leisurePayer(world), venue = outingContent[kind];
  if (ageOn(person, world.date) < venue.minAge) return 'Venue policy: age ' + venue.minAge + ' or older';
  if (!leisurePresent(world, person)) return 'Be available at home for this outing';
  if (!payer) return 'An available actual parent or guardian must accompany you';
  if (person.stats.health < 25 || person.stats.energy < venue.energy) return 'Rest and recover before going out';
  if (world.actionCounts[person.id + ':outing:' + kind + ':' + absolute(world)]) return 'One visit to this venue is available each month';
  if (availableCash(accountFor(world, payer)) < outingFee(world, kind)) return fullName(payer) + ' cannot cover the tickets';
}
export function resolveLeisure(world: World, command: LeisureCommand) {
  const person = active(world);
  if (command.type === 'hobby-plan') {
    const reason = hobbyReason(world, command.kind, command.mode); if (reason) throw new IneligibleAction(reason);
    const payer = leisurePayer(world)!, fee = hobbyFee(person.country, command.kind, command.mode); if (payer.id !== command.reviewedPayerId || fee !== command.quotedMonthlyFee) throw new IneligibleAction('The payer or routine cost changed; review the current terms');
    const permission = consent(world, person, payer); let hobby = personHobbies(world).find(item => item.kind === command.kind);
    if (!hobby) { hobby = { id: 'hobby_' + person.id + '_' + command.kind, personId: person.id, kind: command.kind, proficiency: 0, plans: [], practices: [] }; world.hobbies.push(hobby); }
    const prior = activeHobbyPlan(hobby); if (permission.accepted && prior) closePlan(world, hobby, prior, 'stopped', 'I chose a different routine.');
    if (payer.id === person.id) { const key = person.id + ':hobby-change:' + command.kind + ':' + absolute(world); world.actionCounts[key] = (world.actionCounts[key] ?? 0) + 1; } else world.actionCounts[requestKey(world, command.kind, command.mode, payer.id)] = 1;
    hobby.plans.push({ id: 'hobby_plan_' + world.revision + '_' + hobby.plans.length, payerId: payer.id, country: person.country, city: person.city, currency: countries[person.country].currency, mode: command.mode, monthlyFee: fee, consent: permission, started: { ...world.date }, ended: permission.accepted ? null : { ...world.date }, endReason: permission.accepted ? null : 'The responsible adult did not agree.', status: permission.accepted ? 'active' : 'declined', lastMonth: absolute(world) });
    fact(world, permission.accepted ? 'I arranged a ' + hobbyContent[hobby.kind].name.toLowerCase() + ' routine, funded by ' + fullName(payer) + '.' : fullName(payer) + ' declined my proposed ' + hobbyContent[hobby.kind].name.toLowerCase() + ' routine.', 'hobby');
    result(world, permission.accepted ? 'Your routine is arranged' : 'Not this routine', permission.accepted ? 'Actual attended months build proficiency. Community access includes shared equipment/materials; lessons include instruction. Monthly fees come from ' + fullName(payer) + ' only when attendance and funds permit. No practice credit or bill is created by setting the plan.' : 'The original adult did not agree. Your existing progress and any other current routine stay in place. No attendance, charge or loan was created.', 'leisure-' + hobby.kind); return;
  }
  if (command.type === 'leisure-outing') {
    const reason = outingReason(world, command.kind); if (reason) throw new IneligibleAction(reason);
    const payer = leisurePayer(world)!, total = outingFee(world, command.kind); if (payer.id !== command.reviewedPayerId || total !== command.quotedTotal) throw new IneligibleAction('The payer or ticket cost changed; review this outing');
    const permission = consent(world, person, payer), participants = payer.id === person.id ? [person.id] : [person.id, payer.id], ledgerCursor = world.ledger.length, available = availableCash(accountFor(world, payer));
    world.actionCounts[person.id + ':outing:' + command.kind + ':' + absolute(world)] = 1;
    let outcome: 1 | 2 | 3 | null = null; const effects: LeisureEffect[] = [];
    if (permission.accepted) {
      charge(world, total, 'entertainment', outingContent[command.kind].name, undefined, countries[person.country].currency, payer); outcome = draw(world, 'outcomes', 1, 3) as 1 | 2 | 3;
      effects.push(change(world, person, 'happiness', outcome * 2), change(world, person, 'stress', -outcome), change(world, person, 'energy', -outingContent[command.kind].energy)); if (command.kind === 'museum') effects.push(change(world, person, 'smarts', 1));
    }
    const paid = permission.accepted ? total : 0n; world.leisureOutings.push({ id: 'outing_' + world.revision, personId: person.id, payerId: payer.id, kind: command.kind, date: { ...world.date }, country: person.country, city: person.city, currency: countries[person.country].currency, participants, quotedTotal: total, available, consent: permission, paid, paymentId: permission.accepted ? world.ledger[ledgerCursor].id : null, outcome, effects });
    const copy = permission.accepted ? outingCopy(command.kind, outcome!) : fullName(payer) + ' did not agree to accompany you. Nobody went and no tickets were charged.';
    fact(world, permission.accepted ? outingJournal[command.kind] : 'My proposed outing was declined by ' + fullName(payer) + '.', 'entertainment');
    result(world, permission.accepted ? outingContent[command.kind].name : 'Staying home', copy, 'leisure-' + command.kind, effects.map(item => ({ id: item.stat, label: item.stat[0].toUpperCase() + item.stat.slice(1), value: (item.after - item.before >= 0 ? '+' : '') + (item.after - item.before) + '%', tone: item.after === item.before ? 'neutral' : (item.stat === 'stress' ? item.after < item.before : item.after > item.before) ? 'positive' : 'negative' }))); return;
  }
  const hobby = personHobbies(world).find(item => item.id === command.hobbyId), plan = hobby && activeHobbyPlan(hobby); if (!hobby || !plan || plan.id !== command.planId) throw new IneligibleAction('Choose your current hobby routine');
  if (command.type === 'stop-hobby') { closePlan(world, hobby, plan, 'stopped', 'I left the local routine.'); result(world, 'Routine stopped', 'Your proficiency and attended history stay yours. No future fees are charged. Earlier access and lessons are not refunded.', 'leisure-' + hobby.kind); return; }
  const reason = hobbyPracticeReason(world, hobby, plan); if (reason) throw new IneligibleAction(reason);
  practice(world, hobby, plan, true); fact(world, 'I did extra practice in ' + hobbyContent[hobby.kind].name.toLowerCase() + '.', 'hobby'); result(world, 'Time for ' + hobbyContent[hobby.kind].name.toLowerCase(), 'You spent time practising. Extra practice adds to your own proficiency; it does not add a paid lesson, qualification or professional credit.', 'leisure-' + hobby.kind);
}
function practice(world: World, hobby: Hobby, plan: HobbyPlan, manual = false) {
  const person = world.people[hobby.personId], reason = hobbyPauseReason(world, hobby, plan, manual), before = hobby.proficiency, ledgerCursor = world.ledger.length, attended = !reason, due = manual ? 0n : plan.monthlyFee;
  const effects: LeisureEffect[] = [], available = availableCash(accountFor(world, world.people[plan.payerId], plan.currency));
  if (attended) {
    if (due) charge(world, due, 'hobby', hobbyContent[hobby.kind].name + ' ' + plan.mode, undefined, plan.currency, world.people[plan.payerId]);
    hobby.proficiency = bounded(before + (manual ? 1 : plan.mode === 'lessons' ? 4 : 2));
    effects.push(change(world, person, 'energy', -(manual || plan.mode === 'community' ? 2 : 4)), change(world, person, 'happiness', 1), change(world, person, 'stress', -1));
    const attendedMonths = hobby.practices.filter(item => item.source === 'monthly' && item.attended).length + 1;
    if (!manual && hobby.kind === 'guitar' && attendedMonths % 3 === 0) effects.push(change(world, person, 'music', 1));
    if (!manual && hobby.kind === 'chess' && attendedMonths % 6 === 0) effects.push(change(world, person, 'smarts', 1));
  }
  hobby.practices.push({ sequence: hobby.practices.length, planId: plan.id, date: { ...world.date }, source: manual ? 'manual' : 'monthly', attended, reason, before, gain: hobby.proficiency - before, after: hobby.proficiency, due, available, paid: attended ? due : 0n, paymentId: attended && due ? world.ledger[ledgerCursor].id : null, ledgerCursor, effects });
}
export function leisureMonth(world: World) {
  refreshLeisure(world); const month = absolute(world);
  for (const hobby of world.hobbies) {
    const plan = activeHobbyPlan(hobby); if (!plan || plan.lastMonth >= month) continue;
    if (plan.lastMonth !== month - 1) throw new Error('Hobby attendance must progress through actual months');
    plan.lastMonth = month; practice(world, hobby, plan);
  }
}
const outingJournal = { cinema: 'I went to a local film screening.', concert: 'I went to a live concert.', museum: 'I visited a museum exhibition.', nightclub: 'I went dancing at a local venue.' };
function outingCopy(kind: OutingKind, outcome: 1 | 2 | 3) {
  const scenes = {
    cinema: ['A tall hat in the row ahead becomes an unofficial supporting character. You still enjoy parts of the film.', 'The film holds your attention. Outside, ordinary daylight feels briefly overexposed.', 'The final scene stays with you all the way home. This was a good reason to leave the sofa.'],
    concert: ['The sound balance improves after the opening songs. Your favourite chorus survives the technical difficulties.', 'The room joins in with the chorus. You carry the tune home, a little less accurately.', 'The final song earns an encore. You leave with tired feet and a very clear memory of the sound.'],
    museum: ['One gallery is closed. You find an unexpectedly interesting cabinet on the way around it.', 'You follow one exhibit into the next and learn something you want to look up later.', 'A small object has a much longer story than you expected. You stay until the room is almost empty.'],
    nightclub: ['The dance floor takes a while to warm up. You find some space when the music changes.', 'You spend the evening dancing and take a break when your feet ask for one.', 'The music keeps finding another song you like. By the time you leave, your feet have earned the journey home.'],
  }; return scenes[kind][outcome - 1];
}
