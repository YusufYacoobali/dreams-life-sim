import type { World } from '../model';
import type { Pending } from '../runtime';
import { jobs } from '../content/jobs';
import { jobInterviews } from '../content/jobInterviews';
import { salaryFor } from './work';

export function validateJobInterview(world: World, event: Extract<Pending, { kind: 'decision' }>) {
  const effects = event.choices.flatMap(choice => choice.effects).filter(effect => effect.kind === 'job-interview');
  if (!effects.length && event.templateId !== 'job-interview') return;
  const person = world.people[world.activePersonId], first = effects[0], role = first && jobs.find(item => item.id === first.roleId);
  if (event.templateId !== 'job-interview' || !role || !jobInterviews[role.id] || event.personIds.length !== 1 || event.personIds[0] !== person.id || event.choices.length !== 4 || effects.length !== 4 || !world.actionCounts[person.id + ':job:' + world.date.year + ':' + role.id]) throw new Error('Invalid bound job interview');
  const answers = new Set(['careful', 'rush', 'avoid', 'withdraw']);
  for (const choice of event.choices) {
    const effect = choice.effects[0];
    if (choice.effects.length !== 1 || effect.kind !== 'job-interview' || !answers.delete(effect.answerId) || choice.id !== effect.answerId || effect.personId !== person.id || effect.roleId !== role.id || effect.employer !== person.city + ' ' + role.sector || effect.annualPay !== salaryFor(world, role)) throw new Error('Invalid bound job interview');
  }
}
