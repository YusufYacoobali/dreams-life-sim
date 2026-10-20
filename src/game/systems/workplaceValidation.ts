import { ageOn, compareDates, World } from '../model';
import { countries } from '../countries';
import { jobs } from '../content/jobs';
import { rules } from '../rules';

export function validateWorkplaces(world: World) {
  if (!world.workplaces.length) return;
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
}
