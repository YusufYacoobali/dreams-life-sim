import { z } from 'zod';
import { countries, countryCodes } from './countries';
import { dateSchema, GameDate, Person, personSchema, validateWorld, World } from './model';
import { currencyDigits } from './money';
import { forkRandom, randomInteger } from './random';
import { daysInMonth } from './calendar';

export const creationSchema = z.object({
  firstName: personSchema.shape.firstName, lastName: personSchema.shape.lastName,
  gender: personSchema.shape.gender, country: z.enum(countryCodes), city: z.string(),
  appearance: personSchema.shape.appearance,
}).refine(input => countries[input.country].cities.includes(input.city), 'Choose a city in the selected country');
export type Creation = z.infer<typeof creationSchema>;

export function randomCreation(seed: number): Creation {
  let state = seed;
  const pick = <T,>(items: readonly T[]): T => {
    const draw = randomInteger(state, 0, items.length - 1); state = draw.state; return items[draw.value];
  };
  const country = pick(countryCodes);
  const data = countries[country];
  return { firstName: pick(data.firstNames), lastName: pick(data.lastNames), gender: pick(['male', 'female', 'nonbinary'] as const), country, city: pick(data.cities), appearance: { face: pick([0, 1, 2, 3]), skin: pick([0, 1, 2, 3, 4, 5]), hair: pick([0, 1, 2, 3, 4, 5, 6, 7]), hairColor: pick([0, 1, 2, 3, 4]) } };
}

export function createLife(id: string, seed: number, raw: Creation, date: GameDate): World {
  const input = creationSchema.parse(raw);
  dateSchema.parse(date);
  let state = forkRandom(seed, 'creation');
  const roll = (minimum: number, maximum: number) => {
    const draw = randomInteger(state, minimum, maximum); state = draw.state; return draw.value;
  };
  const country = countries[input.country];
  const person = (personId: string, firstName: string, gender: Person['gender'], age: number): Person => ({
    id: personId, firstName, lastName: input.lastName, gender, nationality: input.country, country: input.country, city: input.city,
    born: { ...date, year: date.year - age, day: Math.min(date.day, daysInMonth(date.year - age, date.month)) }, died: null, causeOfDeath: null,
    stats: { happiness: roll(65, 95), health: roll(80, 100), smarts: roll(25, 90), looks: roll(30, 90), respect: roll(30, 65), energy: 100, fitness: roll(35, 70), stress: age ? roll(10, 40) : 0, discipline: roll(30, 80), fame: 0 },
    appearance: { face: roll(0, 3), skin: roll(0, 5), hair: roll(0, 7), hairColor: roll(0, 4) },
    traits: [(['kind', 'ambitious', 'impulsive', 'reserved', 'creative', 'practical'] as const)[roll(0, 5)]],
  });
  const player = person('person_player', input.firstName, input.gender, 0);
  player.appearance = { ...input.appearance };
  const parent1 = person('person_parent1', country.firstNames[roll(0, country.firstNames.length - 1)], 'female', roll(24, 42));
  const parent2 = person('person_parent2', country.firstNames[roll(0, country.firstNames.length - 1)], 'male', roll(25, 45));
  const guardians = roll(0, 4) === 0 ? [parent1] : [parent1, parent2];
  const people = Object.fromEntries([player, ...guardians].map(p => [p.id, p]));
  const scale = 10n ** BigInt(currencyDigits[country.currency]);
  return validateWorld({
    schemaVersion: 2, engineVersion: 1, contentVersion: 1, id, revision: 0, date: { ...date },
    calendarAnchorDay: date.day, annual: null, pending: null, eventHistory: [],
    activePersonId: player.id, birthAcknowledged: false,
    random: { events: forkRandom(seed, 'events'), npcs: forkRandom(seed, 'npcs'), economy: forkRandom(seed, 'economy'), outcomes: forkRandom(seed, 'outcomes') },
    people,
    relationships: guardians.map((p, i) => ({ id: 'relation_parent_' + i, from: p.id, to: player.id, kind: 'parent' as const, strength: roll(65, 95), trust: roll(65, 95), memories: ['birth'] })),
    accounts: [player, ...guardians].map(p => ({ id: 'account_' + p.id, ownerId: p.id, currency: country.currency, cash: p.id === player.id ? 0n : BigInt(roll(5000, 40000)) * scale })),
    journal: [{ id: 'journal_birth', date: { ...date }, personId: player.id, category: 'birth', text: 'I was born in ' + input.city + ', ' + country.name + '.' }],
  });
}
