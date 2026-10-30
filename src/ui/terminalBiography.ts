import type { World } from '../game/model';
import { jobs } from '../game/content/jobs';

const counted = (count: number, singular: string, plural = singular + 's') => count + ' ' + (count === 1 ? singular : plural);

/** Death-detail projection only. It reads retained records for one identity. */
export function terminalBiography(world: World, personId = world.activePersonId) {
  const person = world.people[personId]; if (!person) return null;
  const decisions = new Set<string>();
  // engine.choose writes this identity once for the accepted decision. Its
  // category is work for interviews and event otherwise; result acknowledgements,
  // offered-event history and routine/fact records are not decision records.
  for (const row of world.journal) if (row.personId === personId && row.id.endsWith('_choice')) decisions.add(row.id);
  let career: World['workHistory'][number] | undefined;
  for (const row of world.workHistory) if (row.personId === personId && (!career || row.monthsWorked > career.monthsWorked)) career = row;
  const role = career && jobs.find(job => job.id === career.roleId);
  const careerTitle = career ? role?.title ?? 'Recorded employment' : 'No retained job record';
  const careerSentence = career ? (role ? 'Your longest recorded employment was ' + role.title : 'Your record includes employment') + (career.employer ? ' at ' + career.employer : '') + ', with ' + counted(career.monthsWorked, 'recorded employment-month') + '.' : null;

  let projects = 0, awards = 0, businesses = 0, assignments = 0;
  for (const history of world.careers) if (history.personId === personId) for (const project of [...history.projects, ...(history.creativeArchives ?? [])]) if (project.status === 'completed') { projects++; if (project.award) awards++; }
  for (const company of world.businesses) if (company.founderId === personId) businesses++;
  for (const service of world.serviceCareers) if (service.personId === personId) for (const assignment of service.assignments) if (assignment.status === 'completed') assignments++;
  const accomplishments: string[] = [];
  if (projects) accomplishments.push(counted(projects, 'completed career project') + (awards ? ', including ' + counted(awards, 'recorded award') : ''));
  if (businesses) accomplishments.push(counted(businesses, 'business founded', 'businesses founded'));
  if (assignments) accomplishments.push(counted(assignments, 'completed service assignment'));
  if (person.education.qualifications.length) accomplishments.push(counted(person.education.qualifications.length, 'recorded qualification'));
  // The longer Life Summary keeps the full history. This terminal introduction
  // stays bounded and never reconstructs earnings, ownership or honorary titles.
  const highlights = accomplishments.slice(0, 2);
  return {
    personId, recordedDecisions: decisions.size, careerTitle, careerSentence, accomplishments: highlights,
    text: [counted(decisions.size, 'recorded decision') + '.', careerSentence, highlights.length ? 'Your record includes ' + highlights.join('; ') + '.' : null].filter(Boolean).join(' '),
    scope: 'Based on retained records; earlier unrecorded activity is not reconstructed.',
  };
}
