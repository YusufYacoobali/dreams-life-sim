import type { World } from '../model';
import { compareDates } from '../personHelpers';
import { storyMonthNumber } from './storyContext';

export function validateDopingChecks(world: World) {
  const ids = new Set<string>(), month = storyMonthNumber(world.date);
  for (const career of world.careers) for (const check of career.dopingChecks ?? []) {
    const person = world.people[career.personId], project = career.projects.find(row => row.id === check.projectId);
    const history = world.workHistory.find(row => row.id === check.employmentId);
    if (career.kind !== 'athlete' || ids.has(check.id) || !check.id.startsWith('doping_' + career.id + '_') || !project || project.employmentId !== check.employmentId || !history || history.personId !== person.id || history.roleId !== 'professional-athlete' || !world.people[check.supplierId] || !career.contacts.includes(check.supplierId)
      || compareDates(check.used, project.started) < 0 || compareDates(check.used, world.date) > 0 || history.ended && compareDates(check.used, history.ended) > 0 || person.died && compareDates(check.used, person.died) > 0
      || check.testMonth !== storyMonthNumber(check.used) + 1 || check.resolved && (compareDates(check.resolved, world.date) > 0 || person.died && compareDates(check.resolved, person.died) > 0)) throw new Error('Invalid athlete drug check history');
    ids.add(check.id);
    if (check.status === 'pending') {
      if (check.resolved || person.died) throw new Error('Invalid pending athlete drug check');
    } else if (check.status === 'cancelled') {
      if (!person.died || !check.resolved || compareDates(check.resolved, person.died) !== 0) throw new Error('Invalid cancelled athlete drug check');
    } else if (!check.resolved || storyMonthNumber(check.resolved) < check.testMonth || check.testMonth > month || (check.status === 'positive') !== (check.detectionRoll <= check.detectionChance)) throw new Error('Invalid athlete drug check result');
  }
}
