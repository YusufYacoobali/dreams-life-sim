import { interviewResult } from './interview';
import { createLife, randomCreation } from '../../src/game/createLife';
import { countries, CountryCode } from '../../src/game/countries';
import { resolveCommand } from '../../src/game/engine';
import { World } from '../../src/game/model';

/** Domain setup: actual accepted application/introduction, not a birth-to-adult journey. */
export function employee(country: CountryCode = 'US', introduce = true, age = 22, roleId = 'retail'): World {
  let world = createLife('life_work_story', 42, { ...randomCreation(42), country, city: countries[country].cities[0] }, { year: 2000, month: 1, day: 1 });
  world.birthAcknowledged = true; world.date.year += age;
  for (let seed = 1; seed < 100; seed++) {
    world.random.outcomes = seed;
    const next = interviewResult(resolveCommand(world, { type: 'apply-job', roleId }));
    if (next.people[next.activePersonId].employment) { world = resolveCommand(next, { type: 'acknowledge', resultId: next.pending!.id }); break; }
  }
  if (!world.people[world.activePersonId].employment) throw new Error('No accepted work story application');
  if (introduce) { world = resolveCommand(world, { type: 'meet-coworkers' }); world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending!.id }); }
  return world;
}
