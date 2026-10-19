import { createLife, randomCreation } from '../../src/game/createLife';
import { countries, CountryCode } from '../../src/game/countries';
import { rules } from '../../src/game/rules';
import { validateWorld, World } from '../../src/game/model';
import { educationMonth } from '../../src/game/systems/education';
import { schoolMonth } from '../../src/game/systems/school';

export function pupil(country: CountryCode = 'US', age = rules[country].schoolStart): World {
  const world = createLife('life_school', 42, { ...randomCreation(42), country, city: countries[country].cities[0] }, { year: 2000, month: 1, day: 1 });
  world.birthAcknowledged = true; world.date.year += age;
  const player = world.people[world.activePersonId]; player.stats.health = 100; player.stats.smarts = 80; player.stats.discipline = 80;
  educationMonth(world, player); schoolMonth(world); return validateWorld(world);
}
