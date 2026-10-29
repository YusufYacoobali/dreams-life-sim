import type { World } from '../game/model';
import { ageOn, compareDates } from '../game/personHelpers';
import { countries } from '../game/countries';
import { formatMoney } from '../game/money';
import type { IllustrationId } from '../assets/Illustration';
import { terminalBiography } from './terminalBiography';

type GlanceRow = { id: string; label: string; value: string; icon: IllustrationId | 'family'; tone?: 'positive' | 'negative' };
const counted = (n: number, noun: string, plural = noun + 's') => n + ' ' + (n === 1 ? noun : plural);
const titleCase = (text: string) => text ? text[0].toUpperCase() + text.slice(1) : text;
const educationRank = { secondary: 1, trade: 2, degree: 3, medicine: 4, law: 4 } as const;
function qualificationTitle(qualification: World['people'][string]['education']['qualifications'][number]) {
  if (qualification.level === 'secondary') return 'Secondary qualification';
  if (qualification.level === 'trade') return qualification.field ? titleCase(qualification.field) + ' trade qualification' : 'Trade qualification';
  if (qualification.level === 'degree') return qualification.field ? titleCase(qualification.field) + ' degree' : 'University degree';
  return titleCase(qualification.level) + ' qualification';
}
function prisonDuration(months: number) {
  const years = Math.floor(months / 12), remainder = months % 12;
  return [years ? counted(years, 'year') : '', remainder ? counted(remainder, 'month') : ''].filter(Boolean).join(', ');
}

/** A small memorial, using this person's records rather than a reconstructed life. */
export function deathSummary(world: World, personId = world.activePersonId) {
  const person = world.people[personId]; if (!person?.died) return null;
  const death = person.died, age = ageOn(person, death), biography = terminalBiography(world, personId)!;
  const estate = world.estates.find(item => item.personId === personId);
  // Settlements can sell or transfer everything. Current ownership and heirs'
  // balances cannot replace the estate's frozen death figures.
  const wealth = estate ? formatMoney(estate.netWorthAtDeath, countries[person.country].locale) : null;
  const children = new Set(world.relationships.filter(edge => edge.from === personId && edge.roles.includes('parent') && edge.parentType !== 'guardian' && compareDates(edge.since, death) <= 0).map(edge => edge.to)).size;
  const marriages = world.marriages.filter(row => (row.a === personId || row.b === personId) && compareDates(row.started, death) <= 0).length;
  const exes = world.relationships.filter(edge => (edge.from === personId || edge.to === personId) && edge.romance === 'ex' && compareDates(edge.since, death) <= 0).length;
  const pets = world.pets.filter(pet => pet.adoptedById === personId && compareDates(pet.adopted, death) <= 0);
  const incidents = world.incidents.filter(row => row.personId === personId && compareDates(row.date, death) <= 0).length;
  // Served months exclude remand credits and the unserved sentence. Normal
  // sentences for one person are sequential or merged by the legal system.
  const prisonMonths = world.sentences.filter(row => row.personId === personId && compareDates(row.started, death) <= 0).reduce((sum, row) => sum + row.servedMonths, 0);
  const highest = person.education.qualifications.filter(row => row.year <= death.year).reduce<typeof person.education.qualifications[number] | undefined>((best, row) => !best || educationRank[row.level] > educationRank[best.level] || educationRank[row.level] === educationRank[best.level] && row.year > best.year ? row : best, undefined);
  const businesses = world.businesses.filter(row => row.founderId === personId && compareDates(row.started, death) <= 0).length;
  const hasCareer = !!biography.careerSentence;
  const rows: GlanceRow[] = [{ id: 'wealth', label: 'Net worth at death', value: wealth ?? 'Not recorded', icon: 'money', ...(estate ? { tone: estate.netWorthAtDeath.minor < 0n ? 'negative' : 'positive' } as const : {}) }];
  if (hasCareer) rows.push({ id: 'career', label: 'Longest recorded job', value: biography.careerTitle, icon: 'career' });
  if (highest) rows.push({ id: 'education', label: 'Highest education', value: qualificationTitle(highest), icon: 'education' });
  const family = [children ? counted(children, 'child', 'children') : '', marriages ? counted(marriages, 'marriage') : '', exes ? counted(exes, 'former partner') : ''].filter(Boolean);
  if (family.length) rows.push({ id: 'family', label: 'Family', value: family.join(' · '), icon: 'family' });
  const possessions = [estate?.propertiesAtDeath ? counted(estate.propertiesAtDeath, 'property', 'properties') + ' at death' : '', pets.length ? counted(pets.length, 'pet') + ' adopted' : ''].filter(Boolean);
  if (possessions.length) rows.push({ id: 'homes-pets', label: 'Homes & pets', value: possessions.join(' · '), icon: estate?.propertiesAtDeath ? 'property' : 'pets' });
  if (incidents || prisonMonths) rows.push({ id: 'legal', label: 'Legal history', value: [incidents ? counted(incidents, 'recorded offence') : '', prisonMonths ? prisonDuration(prisonMonths) + ' served' : ''].filter(Boolean).join(' · '), icon: 'crime' });

  const chapters = [
    hasCareer && biography.careerTitle !== 'Recorded employment' ? 'held a job as ' + (/^[aeiou]/i.test(biography.careerTitle) ? 'an ' : 'a ') + biography.careerTitle.toLowerCase() : '',
    children ? 'added ' + counted(children, 'child', 'children') + ' to the family tree' : '',
    businesses ? 'founded ' + counted(businesses, 'business', 'businesses') : '',
    pets.length ? 'adopted ' + counted(pets.length, 'pet') : '',
    highest ? 'earned your ' + qualificationTitle(highest).toLowerCase() : '',
    wealth ? 'finished with a net worth of ' + wealth : '',
  ].filter(Boolean).slice(0, 2);
  const summary = age < 1 ? 'Your story ended before its first birthday.' : age < 18 ? 'Your story reached ' + age + '; there should have been more chapters.'
    : chapters.length ? 'You lived to ' + age + ', ' + chapters.join(' and ') + '.' : 'Your story reached ' + age + '; a whole life in one save.';
  const feathers = pets.some(pet => pet.species === 'parrot'), paws = pets.some(pet => pet.species !== 'parrot');
  const epitaph = age < 18 ? 'More than the years on this page.'
    : pets.length ? 'A story with ' + [paws ? 'paws' : '', feathers ? 'feathers' : ''].filter(Boolean).join(' and ') + ' in the margins.'
    : marriages > 1 ? 'More than one wedding. Only one final curtain.'
    : incidents ? 'Not every chapter was a good idea.'
    : estate && estate.netWorthAtDeath.minor < 0n ? 'A life worth more than its final balance.'
    : children ? 'One life, another branch of the family tree.'
    : person.stats.happiness >= 80 ? 'A final score worth smiling about.' : 'One life. Its very own story.';
  return { personId, age, cause: person.causeOfDeath, summary, epitaph, rows, finalHappiness: person.stats.happiness };
}
