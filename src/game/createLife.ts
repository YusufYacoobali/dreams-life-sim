import { royalCountries } from './content/royalty';
import { createRoyalBackground } from './systems/royalty';
import { z } from 'zod';
import { countries, countryCodes } from './countries';
import { ageOn, dateSchema, GameDate, Person, personSchema, validateWorld, World } from './model';
import { roundRatio } from './money';
import { forkRandom, randomInteger } from './random';
import { daysInMonth } from './calendar';
import { newEducation, newFinance } from './systems/schemas';
import { rules } from './rules';
import { initialMarket } from './content/markets';
import { biologySchema, genders, newFamilyPerson } from './systems/familySchemas';
import { backgroundOccupation } from './systems/npcs';
import { netWorth } from './valuation';
import { newHealth } from './systems/healthSchemas';
import { newLegal } from './systems/legalSchemas';
import { newPublicLife } from './systems/socialSchemas';
import { newSkills } from './systems/careerSchemas';

export const creationSchema = z.object({
  firstName: personSchema.shape.firstName, lastName: personSchema.shape.lastName,
  gender: personSchema.shape.gender, country: z.enum(countryCodes), city: z.string(),
  appearance: personSchema.shape.appearance,
  background:z.enum(['ordinary','royal']).optional(),
  reproductiveRole: biologySchema.shape.role.optional(), attractedTo: z.array(z.enum(genders)).min(1).max(3).optional(), wantsChildren: z.boolean().optional(),
}).refine(input => countries[input.country].cities.includes(input.city), 'Choose a city in the selected country').refine(input=>input.background!=='royal'||(royalCountries as readonly string[]).includes(input.country),'Royal backgrounds are available in Great Britain, Japan and Spain');
export type Creation = z.infer<typeof creationSchema>;

export function randomCreation(seed: number): Creation {
  let state = seed;
  const pick = <T,>(items: readonly T[]): T => {
    const draw = randomInteger(state, 0, items.length - 1); state = draw.state; return items[draw.value];
  };
  const country = pick(countryCodes);
  const data = countries[country];
  return { firstName: pick(data.firstNames), lastName: pick(data.lastNames), gender: pick(['male', 'female', 'nonbinary'] as const), country, city: pick(data.cities), appearance: { face: pick([0, 1, 2, 3]), skin: pick([0, 1, 2, 3, 4, 5]), hair: pick([0, 1, 2, 3, 4, 5, 6, 7]), hairColor: pick([0, 1, 2, 3, 4]) }, background:(royalCountries as readonly string[]).includes(country)&&randomInteger(state,1,500).value===1?'royal':'ordinary' };
}

export function createLife(id: string, seed: number, raw: Creation, date: GameDate): World {
  const input = creationSchema.parse(raw);
  dateSchema.parse(date);
  let state = forkRandom(seed, 'creation');
  const roll = (minimum: number, maximum: number) => {
    const draw = randomInteger(state, minimum, maximum); state = draw.state; return draw.value;
  };
  const country = countries[input.country];
  const person = (personId: string, firstName: string, gender: Person['gender'], age: number): Person => {
    const born = { ...date };
    if (age > 0) { born.year -= age; born.month = roll(1, 12); born.day = roll(1, 28); if (ageOn({ born, died: null }, date) < age) born.year--; }
    return {
    id: personId, firstName, lastName: input.lastName, gender, nationality: input.country, country: input.country, city: input.city,
    born, died: null, causeOfDeath: null,
    stats: { happiness: roll(65, 95), health: roll(80, 100), smarts: roll(25, 90), looks: roll(30, 90), respect: roll(30, 65), energy: 100, fitness: roll(35, 70), stress: age ? roll(10, 40) : 0, discipline: roll(30, 80), fame: 0 },
    appearance: { face: roll(0, 3), skin: roll(0, 5), hair: roll(0, 7), hairColor: roll(0, 4) },
    traits: [(['kind', 'ambitious', 'impulsive', 'reserved', 'creative', 'practical'] as const)[roll(0, 5)]],
    education: newEducation(), employment: null, finance: newFinance(country.currency),
    ...newFamilyPerson(gender), householdId: 'household_birth', lastEconomicMonth: date.year * 12 + date.month - 1,
    health: newHealth(date.year * 12 + date.month - 1),
    legal: newLegal(),
    publicLife: newPublicLife(date.year * 12 + date.month - 1),
    skills: newSkills(), training: null,
    };
  };
  const player = person('person_player', input.firstName, input.gender, 0);
  player.appearance = { ...input.appearance };
  if (input.reproductiveRole) player.biology.role = input.reproductiveRole;
  if (input.attractedTo) player.attractedTo = [...new Set(input.attractedTo)];
  if (input.wantsChildren !== undefined) player.wantsChildren = input.wantsChildren;
  const parent1 = person('person_parent1', country.firstNames[roll(0, country.firstNames.length - 1)], 'female', roll(24, 42));
  const parent2 = person('person_parent2', country.firstNames[roll(0, country.firstNames.length - 1)], 'male', roll(25, 45));
  const guardians = roll(0, 4) === 0 ? [parent1] : [parent1, parent2];
  const people = Object.fromEntries([player, ...guardians].map(p => [p.id, p]));
  const world = validateWorld({
    schemaVersion: 20, engineVersion: 19, contentVersion: 1, id, revision: 0, date: { ...date },
    calendarAnchorDay: date.day, annual: null, pending: null, eventHistory: [],
    activePersonId: player.id, birthAcknowledged: false,
    random: { events: forkRandom(seed, 'events'), npcs: forkRandom(seed, 'npcs'), economy: forkRandom(seed, 'economy'), outcomes: forkRandom(seed, 'outcomes') },
    people,
    relationships: guardians.map((p, i) => ({ id: 'relation_parent_' + i, from: p.id, to: player.id, kind: 'parent' as const, roles: ['parent'], romance: 'none', since: { ...date }, parentType: 'biological', strength: roll(65, 95), trust: roll(65, 95), memories: ['birth'], lastInteractionYear: date.year })),
    households: [{ id: 'household_birth', name: input.lastName + ' household', members: [player, ...guardians].map(person => person.id), homeAssetId: null }], marriages: [],
    pregnancies: [], custody: [],
    legacyAnnual: null, wills: [], estates: [], generation: 1, legacies: [],
    deferred: [], pendingPriority: 0, incidents: [], cases: [], sentences: [], remand: [], contraband: [], gangs: [],
    socialAccounts: [], sponsorships: [], controversies: [], collaborations: [], socialFollows: [],
    businesses: [], businessLedger: [], businessPayables: [],
    careers: [],
    musicReleases: [],
    elections: [],
    creatorStudios:[],creatorInvoices:[],serviceCareers:[],royalHouses:[],trips:[],relocations:[],
    accounts: [player, ...guardians].map(p => {
      const cash = p.id === player.id ? 0n : roundRatio(rules[input.country].baseWage * BigInt(roll(2, 18)), 10n);
      return { id: 'account_' + p.id, ownerId: p.id, currency: country.currency, cash, openingCash: cash };
    }),
    liabilities: [], ledger: [], workHistory: [], actionCounts: {},
    assets: [], holdings: [], market: initialMarket(date),
    journal: [{ id: 'journal_birth', date: { ...date }, personId: player.id, category: 'birth', text: 'I was born in ' + input.city + ', ' + country.name + '.' }],
  });
  for (const parent of guardians) backgroundOccupation(world, world.people[parent.id]);
  if (guardians.length === 2) {
    const started = { ...date, year: date.year - 1, day: Math.min(date.day, daysInMonth(date.year - 1, date.month)) };
    world.relationships.push({ id: 'relation_parents_couple', from: parent1.id, to: parent2.id, kind: 'spouse', roles: ['spouse'], romance: 'married', since: started, parentType: null, strength: roll(55, 90), trust: roll(55, 90), memories: ['married-before-birth'], lastInteractionYear: date.year });
    world.marriages.push({ id: 'marriage_parents', a: parent1.id, b: parent2.id, started, ended: null, endReason: null, baselineA: netWorth(world, parent1.id), baselineB: netWorth(world, parent2.id), excludedA: 0n, excludedB: 0n, ledgerStart: 0, weddingCost: null });
  }
  if(input.background==='royal')createRoyalBackground(world);
  return validateWorld(world);
}
