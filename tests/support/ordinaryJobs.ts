import { jobs, type JobRole } from '../../src/game/content/jobs';
import { monthFrom } from '../../src/game/calendar';
import { resolveCommand } from '../../src/game/engine';
import { validateWorld, type World } from '../../src/game/model';
import type { CountryCode } from '../../src/game/countries';
import { hourlyQuote } from '../../src/game/systems/hourlyWork';
import type { HourlyTerms } from '../../src/game/systems/hourlyWorkSchemas';
import { workMonth } from '../../src/game/systems/work';
import { pupil } from './pupil';

/** Deliberately configured qualification/stats unit fixture, not a natural study journey. */
export function ordinaryApplicant(role: JobRole, country: CountryCode = 'US'): World {
  const world = pupil(country, 40), person = world.people[world.activePersonId];
  person.stats.smarts = 100; person.stats.respect = 100; person.stats.discipline = 100; person.stats.health = 100;
  person.education.stage = 'none'; person.education.school = '';
  person.education.qualifications = [{ level: 'secondary', field: 'general', year: person.born.year + 18 }];
  if (role.qualification && role.qualification !== 'secondary') {
    const professional = role.qualification === 'medicine' || role.qualification === 'law';
    if (professional) person.education.qualifications.push({ level: 'degree', field: role.qualification, year: person.born.year + 22 });
    person.education.qualifications.push({ level: role.qualification, field: role.field ?? (professional ? role.qualification : 'general'), year: person.born.year + (role.qualification === 'trade' ? 20 : professional ? 27 : 22) });
  }
  world.random.outcomes = 1;
  return validateWorld(world);
}

export function hireOrdinary(world: World, role: JobRole, hours: HourlyTerms['weeklyHours'] = 12): World {
  world.random.outcomes = 1;
  const pending = resolveCommand(world, { type: 'apply-job', roleId: role.id, ...(role.partTime ? { reviewedHourlyTerms: hourlyQuote(world.people[world.activePersonId].country, role, hours) } : {}) });
  const selected = resolveCommand(pending, { type: 'choose', eventId: pending.pending!.id, choiceId: 'careful' });
  if (selected.people[selected.activePersonId].employment?.roleId !== role.id) throw new Error('Configured successful interview was not hired');
  return resolveCommand(selected, { type: 'acknowledge', resultId: selected.pending!.id });
}

/** Real receipt-backed sector service, earned after hiring an accessible feeder role. */
export function experiencedApplicant(role: JobRole): World {
  let world = ordinaryApplicant(role);
  if (!role.experienceMonths) return world;
  const feederIds: Record<string, string> = { chef: 'barista', 'project-manager': 'administrator', 'operations-manager': 'warehouse' };
  const feeder = jobs.find(item => item.id === feederIds[role.id])!;
  world = hireOrdinary(world, feeder);
  for (let index = 0; index < role.experienceMonths; index++) {
    world.date = monthFrom(world.date, 1);
    workMonth(world);
  }
  return validateWorld(world);
}
