import { hourlyAnnual } from './hourlyWork';
import { roundRatio } from '../money';
import { ageOn, compareDates } from '../personHelpers';
import type { World } from '../model';
import { countries } from '../countries';
import { jobs } from '../content/jobs';
import { rules } from '../rules';
import { raisedAnnualPay, raiseChance } from './workplaceSchemas';

export function validateWorkplaces(world: World) {
  if (!world.workplaces.length && !world.workRaises.length) return;
  const contracts = new Map(world.workHistory.map(item => [item.id, item]));
  const coworkerPairs = new Set<string>();
  for (const relation of world.relationships) if (relation.roles.includes('coworker')) { coworkerPairs.add(relation.from + ':' + relation.to); coworkerPairs.add(relation.to + ':' + relation.from); }
  const ids = new Set<string>(), activePeople = new Set<string>(), feedbackYears = new Set<string>();
  for (const place of world.workplaces) {
    const person = world.people[place.personId], history = contracts.get(place.employmentId), ownerRole = history && jobs.find(item => item.id === history.roleId);
    if (ids.has(place.id) || !person || !history || history.personId !== place.personId || !ownerRole || ownerRole.specialCareer || history.companyId || history.employer !== place.employer || history.currency !== countries[place.country].currency || place.employer !== place.city + ' ' + ownerRole.sector || !countries[place.country].cities.includes(place.city) ||
      compareDates(history.started, place.started) > 0 || history.ended && compareDates(history.ended, place.started) < 0 || compareDates(place.started, world.date) > 0 ||
      !!place.ended !== !!place.endReason || place.ended && (compareDates(place.ended, place.started) < 0 || compareDates(place.ended, world.date) > 0)) throw new Error('Invalid workplace history');
    ids.add(place.id);
    if (!place.ended) {
      if (activePeople.has(person.id) || person.died || person.employment?.id !== place.employmentId || person.employment.employer !== place.employer || person.country !== place.country || person.city !== place.city) throw new Error('Invalid current workplace');
      activePeople.add(person.id);
    }
    const present = new Set<string>(), memberContracts = new Map<string, typeof place.members>(); let supervisors = 0, coworkers = 0;
    for (const member of place.members) {
      const contact = world.people[member.personId], contract = contracts.get(member.employmentId), role = contract && jobs.find(item => item.id === contract.roleId);
      if (!contact || contact.id === person.id || !contract || contract.personId !== member.personId || !role || role.specialCareer || contract.companyId || contract.employer !== place.employer || contract.currency !== countries[place.country].currency ||
        compareDates(member.joined, place.started) < 0 || compareDates(member.joined, place.ended ?? world.date) > 0 || compareDates(contract.started, member.joined) > 0 || contract.ended && compareDates(contract.ended, member.joined) < 0 ||
        ageOn(contact, member.joined) < (member.role === 'supervisor' || !role.partTime ? rules[place.country].adultAge : rules[place.country].partTimeAge) ||
        role.qualification && !contact.education.qualifications.some(item => item.level === role.qualification && (!role.field || item.field === role.field) && item.year <= member.joined.year) ||
        !!member.left !== !!member.endReason || member.left && (compareDates(member.left, member.joined) < 0 || compareDates(member.left, place.ended ?? world.date) > 0) ||
        !coworkerPairs.has(person.id + ':' + contact.id)) throw new Error('Invalid workplace colleague');
      const contractKey = member.personId + ':' + member.employmentId, intervals = memberContracts.get(contractKey) ?? []; intervals.push(member); memberContracts.set(contractKey, intervals);
      if (!member.left) {
        if (present.has(contact.id)) throw new Error('Duplicate workplace colleague'); present.add(contact.id);
        if (member.role === 'supervisor') supervisors++; else coworkers++;
        if (!place.ended && (contact.died || contact.employment?.id !== member.employmentId || contact.employment.employer !== place.employer || contact.country !== place.country || contact.city !== place.city)) throw new Error('Departed colleague still in current workplace');
      }
    }
    if (supervisors > 1 || coworkers > 2) throw new Error('Invalid workplace team size');
    for (const feedback of place.feedback) {
      const yearKey = place.personId + ':' + place.employmentId + ':' + feedback.date.year;
      const supervisor = memberContracts.get(feedback.supervisorId + ':' + feedback.supervisorEmploymentId)?.find(item => item.role === 'supervisor' && compareDates(item.joined, feedback.date) <= 0 && (!item.left || compareDates(feedback.date, item.left) <= 0));
      if (!supervisor || feedbackYears.has(yearKey) || compareDates(feedback.date, place.started) < 0 || compareDates(feedback.date, place.ended ?? world.date) > 0 || feedback.paidMonths > history.monthsWorked ||
        feedback.chance !== Math.min(95, 50 + Math.floor(feedback.trustAtRequest / 2)) || feedback.accepted !== (feedback.roll <= feedback.chance) || feedback.performanceGain !== (feedback.accepted ? Math.min(3, 100 - feedback.performanceBefore) : 0)) throw new Error('Invalid work feedback');
      feedbackYears.add(yearKey);
    }
  }
  const places = new Map(world.workplaces.map(item => [item.id, item])), raiseIds = new Set<string>(), raiseYears = new Set<string>();
  const priorRaises = new Map<string, typeof world.workRaises[number]>(), hourlyIds = new Set(world.hourlyContracts.map(row => row.employmentId));
  for (const request of world.workRaises) {
    const place = places.get(request.workplaceId), history = contracts.get(request.employmentId), person = world.people[request.personId];
    const supervisor = place?.members.find(item => item.personId === request.supervisorId && item.employmentId === request.supervisorEmploymentId && item.role === 'supervisor' && compareDates(item.joined, request.date) <= 0 && (!item.left || compareDates(request.date, item.left) <= 0));
    const key = request.personId + ':' + request.employmentId, yearKey = key + ':' + request.date.year, prior = priorRaises.get(key);
    if (!!request.hourly !== hourlyIds.has(request.employmentId) || raiseIds.has(request.id) || raiseYears.has(yearKey) || !place || !person || !history || !supervisor || place.personId !== request.personId || place.employmentId !== request.employmentId || history.personId !== request.personId || request.currency !== history.currency ||
      compareDates(request.date, place.started) < 0 || compareDates(request.date, place.ended ?? world.date) > 0 || request.paidMonths > history.monthsWorked ||
      request.chance !== raiseChance(request.performance, request.trust) || request.accepted !== (request.roll <= request.chance) ||
      (request.hourly ? request.annualPayBefore !== hourlyAnnual({ ...request.hourly, hourlyRate: request.hourly.hourlyRateBefore }) || request.annualPayAfter !== hourlyAnnual({ ...request.hourly, hourlyRate: request.hourly.hourlyRateAfter }) || request.hourly.hourlyRateAfter !== (request.accepted ? roundRatio(request.hourly.hourlyRateBefore * 10500n, 10000n) : request.hourly.hourlyRateBefore) : request.annualPayAfter !== (request.accepted ? raisedAnnualPay(request.annualPayBefore) : request.annualPayBefore)) || request.accepted && request.annualPayAfter <= request.annualPayBefore ||
      prior && (compareDates(prior.date, request.date) > 0 || request.paidMonths < prior.paidMonths || request.annualPayBefore < prior.annualPayAfter) ||
      person.employment?.id === history.id && person.employment.annualPay < request.annualPayAfter) throw new Error('Invalid work raise');
    raiseIds.add(request.id); raiseYears.add(yearKey); priorRaises.set(key, request);
  }
}
