import { ageOn } from '../personHelpers';
import type { GameDate, Person, World } from '../model';
import { countries, CountryCode } from '../countries';
import { daysInMonth } from '../calendar';
import { jobs } from '../content/jobs';
import { rules } from '../rules';
import { fields, newEducation, newFinance } from './schemas';
import { genders, newFamilyPerson } from './familySchemas';
import { draw } from './common';
import { roundRatio } from '../money';
import { salaryForPerson } from './work';
import { newHealth } from './healthSchemas';
import { isConfined, newLegal } from './legalSchemas';
import { visibleConvictions } from './legalRecords';
import { newPublicLife } from './socialSchemas';
import { newSkills } from './careerSchemas';
import { newWorkEarnings } from './earningsSchemas';

export function npcSalary(person: Person, roleId: string, rank = 0): bigint {
  const role = jobs.find(job => job.id === roleId)!;
  return salaryForPerson(person, role, rank);
}
export function hireNpc(world: World, person: Person, preferredRole?: string) {
  if (isConfined(world, person) || person.legal.wanted) return;
  const eligible = jobs.filter(role => !role.partTime && (!role.specialCareer || role.id===preferredRole) && !(visibleConvictions(world, person).length && ['doctor', 'lawyer', 'teacher', 'police'].includes(role.id)) && person.stats.smarts >= role.smarts && (!role.qualification || person.education.qualifications.some(q => q.level === role.qualification && (!role.field || role.field === q.field))));
  if (!eligible.length) return;
  const role = preferredRole ? eligible.find(item => item.id === preferredRole) : eligible[draw(world, 'npcs', 0, eligible.length - 1)];
  if (!role) throw new Error('NPC lacks the required professional qualification');
  const id = 'employment_npc_' + person.id + '_' + world.workHistory.length;
  person.employment = { id, roleId: role.id, employer: person.city + ' ' + role.sector, companyId: null, currency: countries[person.country].currency, rank: 0, annualPay: salaryForPerson(person, role), paidMonths: 0, performance: 55, effort: 'balanced' };
  world.workHistory.push({ id, personId: person.id, roleId: role.id, employer: person.employment.employer, companyId: null, started: { ...world.date }, ended: null, monthsWorked: 0, grossEarned: 0n, ...newWorkEarnings(countries[person.country].currency) });
  if (!person.householdId) { person.householdId = 'household_' + person.id; world.households.push({ id: person.householdId, name: person.firstName + '’s household', members: [person.id], homeAssetId: null }); }
  person.lastEconomicMonth = world.date.year * 12 + world.date.month - 1;
}
export function backgroundOccupation(world: World, person: Person, preferredRole?: string) {
  const age = ageOn(person, world.date); const rule = rules[person.country];
  if (age < rule.schoolEnd) return;
  person.education.qualifications.push({ level: 'secondary', field: 'general', year: person.born.year + rule.schoolEnd });
  person.education.grades = Math.max(50, Math.round((person.stats.smarts + person.stats.discipline) / 2));
  let qualifiedAge = rule.schoolEnd;
  const preferred = preferredRole ? jobs.find(item => item.id === preferredRole) : undefined;
  if (preferredRole && !preferred) throw new Error('Unknown professional background');
  if (preferred) {
    person.stats.smarts = Math.max(person.stats.smarts, preferred.smarts);
    if (preferred.qualification && preferred.qualification !== 'secondary') {
      const professional = preferred.qualification === 'medicine' || preferred.qualification === 'law';
      qualifiedAge += preferred.qualification === 'trade' ? 2 : 4;
      person.education.qualifications.push({ level: professional ? 'degree' : preferred.qualification, field: preferred.field ?? (professional ? preferred.qualification : 'general'), year: person.born.year + qualifiedAge });
      if (professional) { qualifiedAge += preferred.qualification === 'medicine' ? 4 : 3; person.education.qualifications.push({ level: preferred.qualification, field: preferred.qualification, year: person.born.year + qualifiedAge }); }
    }
    if (age < qualifiedAge) throw new Error('The requested background needs an older person');
  } else if (age >= rule.schoolEnd + 4 && person.stats.smarts >= 60 && draw(world, 'npcs', 1, 100) <= 35) {
    const field = fields[draw(world, 'npcs', 0, fields.length - 1)]; qualifiedAge += 4;
    person.education.qualifications.push({ level: 'degree', field, year: person.born.year + qualifiedAge });
    const years = field === 'medicine' ? 4 : field === 'law' ? 3 : 0;
    if (years && age >= qualifiedAge + years && person.stats.smarts >= 70 && draw(world, 'npcs', 1, 100) <= 40) {
      qualifiedAge += years; person.education.qualifications.push({ level: field as 'medicine' | 'law', field, year: person.born.year + qualifiedAge });
    }
  } else if (age >= rule.schoolEnd + 2 && draw(world, 'npcs', 1, 100) <= 25) {
    qualifiedAge += 2; const field = fields[draw(world, 'npcs', 0, fields.length - 1)];
    person.education.qualifications.push({ level: 'trade', field, year: person.born.year + qualifiedAge });
  }
  const eligible = jobs.filter(role => !role.partTime && (!role.specialCareer || role.id===preferredRole) && person.stats.smarts >= role.smarts && (!role.qualification || person.education.qualifications.some(q => q.level === role.qualification && (!role.field || role.field === q.field))));
  const role = preferred ?? eligible[draw(world, 'npcs', 0, eligible.length - 1)];
  const yearsWorked = Math.max(0, age - qualifiedAge); const rank = Math.min(3, Math.floor(yearsWorked / 8)); const annualPay = npcSalary(person, role.id, rank);
  const id = 'employment_background_' + person.id;
  let grossEarned = 0n;
  for (let year = 0; year < yearsWorked; year++) grossEarned += npcSalary(person, role.id, Math.min(3, Math.floor(year / 8)));
  person.employment = { id, roleId: role.id, employer: person.city + ' ' + role.sector, companyId: null, currency: countries[person.country].currency, rank, annualPay, paidMonths: yearsWorked * 12, performance: draw(world, 'npcs', 40, 80), effort: 'balanced' };
  person.finance.serviceMonths = yearsWorked * 12; person.finance.lifetimeGross = grossEarned;
  const started = { ...world.date, year: world.date.year - yearsWorked }; started.day = Math.min(started.day, daysInMonth(started.year, started.month));
  world.workHistory.push({ id, personId: person.id, roleId: role.id, employer: person.employment.employer, companyId: null, started, ended: null, monthsWorked: yearsWorked * 12, grossEarned, ...newWorkEarnings(countries[person.country].currency, grossEarned) });
}
function birthday(date: GameDate, age: number, month: number, day: number): GameDate {
  let year = date.year - age;
  if (month > date.month || (month === date.month && day > date.day)) year--;
  return { year, month, day: Math.min(day, daysInMonth(year, month)) };
}
export function createContact(world: World, options: { age: number; gender?: Person['gender']; compatibleWith?: Person['gender']; country?: CountryCode; city?: string; qualifiedRole?: string; schoolStudent?: boolean; postsecondaryStudent?: { program: 'trade' | 'university' | 'graduate'; annualTuition: bigint } }): Person {
  const player = world.people[world.activePersonId], code = options.country ?? player.country, country = countries[code], city = options.city ?? (code === player.country ? player.city : country.cities[0]);
  const student = options.postsecondaryStudent;
  if (student && (options.schoolStudent || options.qualifiedRole || student.annualTuition <= 0n || options.age < Math.max(18, rules[code].adultAge, rules[code].schoolEnd + (student.program === 'graduate' ? 4 : 0)))) throw new Error('Invalid new postsecondary student background');
  const gender = options.gender ?? genders[draw(world, 'npcs', 0, genders.length - 1)];
  const month = draw(world, 'npcs', 1, 12), day = draw(world, 'npcs', 1, 28);
  const id = 'person_npc_' + world.revision + '_' + Object.keys(world.people).length;
  const person: Person = {
    id, firstName: country.firstNames[draw(world, 'npcs', 0, country.firstNames.length - 1)], lastName: country.lastNames[draw(world, 'npcs', 0, country.lastNames.length - 1)],
    gender, nationality: code, country: code, city, born: birthday(world.date, options.age, month, day), died: null, causeOfDeath: null,
    stats: { happiness: draw(world, 'npcs', 40, 90), health: draw(world, 'npcs', 65, 100), smarts: draw(world, 'npcs', 25, 90), looks: draw(world, 'npcs', 25, 95), respect: draw(world, 'npcs', 25, 85), energy: 100, fitness: draw(world, 'npcs', 30, 85), stress: draw(world, 'npcs', 5, 50), discipline: draw(world, 'npcs', 30, 90), fame: 0 },
    appearance: { face: draw(world, 'npcs', 0, 3), skin: draw(world, 'npcs', 0, 5), hair: draw(world, 'npcs', 0, 7), hairColor: draw(world, 'npcs', 0, 4) }, traits: [(['kind', 'ambitious', 'impulsive', 'reserved', 'creative', 'practical'] as const)[draw(world, 'npcs', 0, 5)]],
    education: newEducation(), employment: null, finance: newFinance(country.currency), ...newFamilyPerson(gender), lastEconomicMonth: world.date.year * 12 + world.date.month - 1,
    health: newHealth(world.date.year * 12 + world.date.month - 1),
    legal: newLegal(),
    publicLife: newPublicLife(world.date.year * 12 + world.date.month - 1),
    skills: newSkills(), training: null,
  };
  if (gender === 'nonbinary') person.biology.role = draw(world, 'npcs', 0, 1) ? 'carry' : 'contribute';
  person.wantsChildren = draw(world, 'npcs', 1, 100) <= 80;
  person.attractedTo = options.compatibleWith ? [options.compatibleWith] : [...genders];
  world.people[id] = person;
  const cash = student ? student.annualTuition * 2n + rules[code].livingCost * 12n : options.schoolStudent || options.age < rules[code].adultAge ? 0n : roundRatio(rules[code].baseWage * BigInt(draw(world, 'npcs', 2, 25)), 10n);
  world.accounts.push({ id: 'account_' + id, ownerId: id, currency: country.currency, cash, openingCash: cash, lockedCash: 0n });
  if (student) {
    person.education.qualifications.push({ level: 'secondary', field: 'general', year: person.born.year + rules[code].schoolEnd });
    if (student.program === 'graduate') person.education.qualifications.push({ level: 'degree', field: 'science', year: person.born.year + rules[code].schoolEnd + 4 });
    person.education.grades = Math.max(55, Math.round((person.stats.smarts + person.stats.discipline) / 2));
    person.householdId = 'household_' + id;
    world.households.push({ id: person.householdId, name: person.firstName + '’s household', members: [id], homeAssetId: null });
  } else if (options.schoolStudent) {
    if (options.age < rules[code].schoolStart || options.age >= rules[code].schoolEnd) throw new Error('School contact age is outside compulsory education');
    person.education.stage = options.age < rules[code].secondaryStart ? 'primary' : 'secondary'; person.education.school = person.city + (person.education.stage === 'primary' ? ' Primary School' : ' Secondary School');
  } else if (options.age >= rules[code].adultAge) {
    person.householdId = 'household_' + id;
    world.households.push({ id: person.householdId, name: person.firstName + '’s household', members: [id], homeAssetId: null });
    backgroundOccupation(world, person, options.qualifiedRole);
  } else if (options.age >= rules[code].schoolStart) {
    person.education.stage = options.age < rules[code].secondaryStart ? 'primary' : 'secondary'; person.education.school = person.city + (person.education.stage === 'primary' ? ' Primary School' : ' Secondary School');
  }
  return person;
}
