import type { Person, World } from './model';
import { ageOn, fullName } from './personHelpers';
import { countries } from './countries';
import { jobs } from './content/jobs';
import { eligibleBirthStories, type BirthStoryContext, type BirthStoryTone } from './content/birthStories';
import { forkRandom, randomInteger } from './random';
import { royalMembership } from './systems/royaltySchemas';
import { royalTitle } from './systems/royaltyMath';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const article = (text: string) => /^[aeiou]/i.test(text) ? 'an ' : 'a ';

export function birthFamily(world: World, personId = world.activePersonId) {
  const ids = [...new Set(world.relationships.filter(edge => edge.to === personId && edge.roles.includes('parent')).map(edge => edge.from))];
  const parents = ids.flatMap(id => world.people[id] ? [world.people[id]] : []);
  const mother = parents.find(parent => parent.gender === 'female'), father = parents.find(parent => parent.gender === 'male');
  const royal = royalMembership(world, personId);
  const context: BirthStoryContext = {
    mother: !!mother, father: !!father, twoParents: parents.length === 2, singleParent: parents.length === 1,
    motherWorking: !!mother?.employment, fatherWorking: !!father?.employment, royal: !!royal,
  };
  return { parents, mother, father, royal, context };
}

/** Birth prose has its own seed-derived stream; no saved gameplay RNG is read or written. */
export function selectBirthStory(seed: number, context: BirthStoryContext) {
  const draw = randomInteger(forkRandom(seed, 'birth-journal-v1'), 1, 100);
  const tone: BirthStoryTone | null = draw.value <= 50 ? null : draw.value <= 85 ? 'funny' : draw.value <= 97 ? 'unusual' : 'bizarre';
  if (!tone) return null;
  const eligible = eligibleBirthStories(context, tone);
  return eligible.length ? eligible[randomInteger(draw.state, 0, eligible.length - 1).value] : null;
}

function parentIntroduction(world: World, parent: Person, label: string, born: World['date']) {
  const introduction = 'My ' + label + ' is ' + fullName(parent) + ', ' + ageOn(parent, born) + '.';
  const pronoun = parent.gender === 'female' ? 'She' : parent.gender === 'male' ? 'He' : 'They';
  if (parent.employment) {
    const job = jobs.find(role => role.id === parent.employment!.roleId);
    return introduction + (job ? ' ' + pronoun + (parent.gender === 'nonbinary' ? ' work as ' : ' works as ') + article(job.title) + job.title.toLowerCase() + '.' : ' The job title wasn’t recorded.');
  }
  const royal = royalMembership(world, parent.id);
  if (royal) return introduction + ' ' + (parent.gender === 'female' ? 'Her' : parent.gender === 'male' ? 'His' : 'Their') + ' title is ' + royalTitle(world, royal.house, parent.id) + '.';
  return introduction + ' ' + (parent.finance.pensionAnnual > 0n ? pronoun + (parent.gender === 'nonbinary' ? ' are retired.' : ' is retired.') : parent.gender === 'nonbinary' ? 'They aren’t working at the moment.' : pronoun + ' isn’t working at the moment.');
}

/** Compose once after the actual family, jobs and royal background exist. */
export function composeBirthJournal(world: World, seed: number): World['journal'] {
  const player = world.people[world.activePersonId], born = player.born;
  const family = birthFamily(world), { parents, mother, father, royal } = family;
  const entries: World['journal'] = [];
  const add = (id: string, text: string) => entries.push({ id, personId: player.id, date: { ...born }, category: 'birth', text });
  add('journal_birth', 'I was born on ' + born.day + ' ' + months[born.month - 1] + ' ' + born.year + ' in ' + player.city + ', ' + countries[player.country].name + '.');
  let identity = 'My name is ' + fullName(player) + '. ' + (player.gender === 'female' ? 'I’m a girl.' : player.gender === 'male' ? 'I’m a boy.' : 'I’m nonbinary.');
  if (royal) identity += ' I belong to the ' + royal.house.name + '. My title is ' + royalTitle(world, royal.house, player.id) + '.';
  add('journal_birth_identity', identity);
  for (const parent of parents.slice(0, 2)) add('journal_birth_parent_' + parent.id, parentIntroduction(world, parent, parent.gender === 'female' ? 'mother' : parent.gender === 'male' ? 'father' : 'parent', born));

  const household = world.households.find(home => home.id === player.householdId);
  const atHome = parents.filter(parent => household?.members.includes(parent.id));
  let circumstances = 'My family has a new baby: me.';
  if (atHome.length === 2) {
    const married = world.marriages.some(marriage => !marriage.ended && [marriage.a, marriage.b].includes(atHome[0].id) && [marriage.a, marriage.b].includes(atHome[1].id));
    circumstances = married ? 'My parents are married, and we all live together.' : 'I live with both of my parents.';
  } else if (atHome.length === 1) {
    const label = atHome[0] === mother ? 'mother' : atHome[0] === father ? 'father' : 'parent';
    circumstances = household?.members.length === 2 ? 'At home, it’s just my ' + label + ' and me.' : 'I live with my ' + label + '.';
  }
  const anecdote = selectBirthStory(seed, family.context);
  add('journal_birth_family', circumstances + (anecdote ? ' ' + anecdote.text : ''));
  return entries;
}
