import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { createLife, randomCreation, type Creation } from '../../src/game/createLife';
import { birthFamily, composeBirthJournal, selectBirthStory } from '../../src/game/birthJournal';
import { birthStories, eligibleBirthStories, type BirthStoryContext } from '../../src/game/content/birthStories';
import { countries, countryCodes } from '../../src/game/countries';
import { jobs } from '../../src/game/content/jobs';
import { copyWorld, encodeWorld, immutableWorld, validateWorld, type Person } from '../../src/game/model';
import { isAutomaticAppearance } from '../../src/game/appearance';
import appearanceBeforePolish3 from '../fixtures/birth-appearance-before-polish3.json';
import namesBeforeExpansion from '../fixtures/birth-names-before-expansion.json';
import { ageOn, fullName } from '../../src/game/personHelpers';
import { endEmployment } from '../../src/game/systems/work';
import { royalTitle } from '../../src/game/systems/royaltyMath';

const date = { year: 2026, month: 10, day: 22 };
// Actual constructor output captured from unchanged 25a8faa, before automatic
// casting was added. Only the permitted artwork fields are normalized below.
const recordedAppearances:Record<string,Record<string,Person['appearance']>>=appearanceBeforePolish3.samples;
const nameSamples = gunzipSync(Buffer.from(namesBeforeExpansion.data, 'base64')).toString('utf8');
const recordedNames: Record<string, { people: Record<string, Pick<Person, 'firstName' | 'lastName'>>; households: Record<string, string>; royalHouses: Record<string, string> }> = JSON.parse(nameSamples);
function newborn(seed: number, patch: Partial<Creation> = {}) { return createLife('life_birth_sample_' + seed, seed, { ...randomCreation(seed), ...patch }, date); }

test.each([
  [{ year: 2024, month: 2, day: 29 }, '29 February 2024'],
  [{ year: 2026, month: 12, day: 31 }, '31 December 2026'],
  [{ year: 2027, month: 1, day: 1 }, '1 January 2027'],
])('birth dates remain exact at calendar boundaries: %j', (born, writing) => {
  const world = createLife('life_birth_date', 42, randomCreation(42), born);
  expect(world.journal[0].text).toContain('I was born on ' + writing + ' in ');
  expect(world.journal.every(entry => JSON.stringify(entry.date) === JSON.stringify(born))).toBe(true);
});

test.each(countryCodes)('%s introduces actual birthplace, identity, parent ages and saved jobs in 3–5 ordered entries', country => {
  for (const gender of ['female', 'male', 'nonbinary'] as const) {
    const world = newborn(42, { country, city: countries[country].cities[0], gender, background: 'ordinary' });
    const player = world.people[world.activePersonId], parents = birthFamily(world).parents;
    expect(world.journal).toHaveLength(parents.length + 3);
    expect(world.journal[0].text).toBe('I was born on 22 October 2026 in ' + player.city + ', ' + countries[country].name + '.');
    expect(world.journal[1].text).toContain(fullName(player)); expect(world.journal[1].text).toContain(gender === 'female' ? 'I’m a girl.' : gender === 'male' ? 'I’m a boy.' : 'I’m nonbinary.');
    for (const parent of parents) {
      const entry = world.journal.find(item => item.id === 'journal_birth_parent_' + parent.id)!;
      expect(entry.text).toContain(fullName(parent) + ', ' + ageOn(parent, player.born) + '.');
      expect(entry.text).toContain(jobs.find(role => role.id === parent.employment!.roleId)!.title.toLowerCase());
    }
    expect(new Set(world.journal.map(entry => entry.id)).size).toBe(world.journal.length);
    expect(new Set(world.journal.map(entry => entry.text)).size).toBe(world.journal.length);
    expect(world.journal.every(entry => entry.personId === player.id && entry.category === 'birth' && JSON.stringify(entry.date) === JSON.stringify(player.born))).toBe(true);
  }
});

test('all 512 sample generations retain exact pre-feature gameplay, allowing only prospective names, artwork and empty capabilities', () => {
  // Captured from d253718 before implementation; no historical fixtures are rewritten.
  expect(namesBeforeExpansion.sourceCommit).toBe('2bb7ce9b3c301de9a286d2cb90d88fe6a1670c4b');
  expect(createHash('sha256').update(nameSamples).digest('hex')).toBe(namesBeforeExpansion.sha256);
  const hash = createHash('sha256'), seenCountries = new Set<string>(), seenGenders = new Set<string>(), seenStories = new Set<string>(), counts = { ordinary: 0, funny: 0, unusual: 0, bizarre: 0 };
  let single = 0, two = 0, royal = 0;
  for (let seed = 0; seed < 512; seed++) {
    const input = randomCreation(seed); input.background = seed % 4 === 0 && ['GB', 'ES', 'JP'].includes(input.country) ? 'royal' : 'ordinary';
    const world = newborn(seed, input), family = birthFamily(world), story = selectBirthStory(seed, family.context);
    // Reproduce the recorded World41 envelope, excluding only the new, empty
    // rental/support/mini-game histories. All generated family, money, stats and RNG stay in proof.
    const original = JSON.parse(encodeWorld({ ...world, journal: [] }));
    expect(original).toMatchObject({ schemaVersion: 49, engineVersion: 51, contentVersion: 28, cults: [], rentalLeases: [] });
    expect(original.overhaulVersion).toBe(1); delete original.overhaulVersion;
    for (const key of ['cults', 'miniGames', 'rentalLeases', 'personSupportRequests', 'personActionHistory', 'prisonLives', 'affairs', 'romanceOffers']) { expect(original[key]).toEqual([]); delete original[key]; }
    original.schemaVersion = 41; original.engineVersion = 43; original.contentVersion = 20;
    const oldAppearances=recordedAppearances[seed];expect(Object.keys(world.people)).toEqual(Object.keys(oldAppearances));
    for(const person of Object.values(world.people)){
      const old=oldAppearances[person.id];
      if(person.id===world.activePersonId)expect(person.appearance).toEqual(old);
      else {
        expect(isAutomaticAppearance(person.appearance)).toBe(true);
        // Face, skin and hair-colour draws remain exact; only deterministic
        // automatic hair/identity/outfit/provenance are deliberately new.
        expect(person.appearance).toEqual({...old,hair:person.appearance.hair,identity:person.appearance.identity,outfit:person.appearance.outfit,provenance:person.appearance.provenance});
      }
      original.people[person.id].appearance=old;
      // Restore independently captured pre-expansion names solely for this old
      // whole-world digest. Family structure, jobs, money, stats and draws stay exact.
      Object.assign(original.people[person.id], recordedNames[seed].people[person.id]);
    }
    for (const home of original.households) home.name = recordedNames[seed].households[home.id];
    for (const house of original.royalHouses) house.name = recordedNames[seed].royalHouses[house.id];
    hash.update(JSON.stringify(original) + '\n');
    expect(newborn(seed, input)).toEqual(world); expect(validateWorld(world)).toEqual(world);
    expect(world.journal.length).toBeGreaterThanOrEqual(3); expect(world.journal.length).toBeLessThanOrEqual(5);
    expect(world.journal.every(entry => entry.text.length <= 1200 && !/undefined|\bnull\b|\{[^}]+\}|\.\./.test(entry.text))).toBe(true);
    seenCountries.add(input.country); seenGenders.add(input.gender); if (family.parents.length === 1) single++; else two++; if (family.royal) royal++;
    counts[story?.tone ?? 'ordinary']++; if (story) { seenStories.add(story.id); expect((story.requires ?? []).every(key => family.context[key])).toBe(true); }
    if (!family.father) expect(world.journal.map(entry => entry.text).join(' ')).not.toMatch(/my father|my parents|both of my parents/i);
    if (family.royal) expect(world.journal[1].text).toContain(royalTitle(world, family.royal.house, world.activePersonId));
  }
  expect(hash.digest('hex')).toBe('2ded67d581fa2720344e05a3c89337d988f2fca12f25372f46b6e2061bb07989');
  expect(seenCountries.size).toBe(12); expect(seenGenders.size).toBe(3); expect(single).toBeGreaterThan(0); expect(two).toBeGreaterThan(0); expect(royal).toBeGreaterThan(0); expect(seenStories.size).toBe(30);
  expect(counts).toEqual({ ordinary: 265, funny: 187, unusual: 44, bizarre: 16 });
});

test('royal newborns use their actual title and house once, after parent jobs have ended', () => {
  for (const country of ['GB', 'ES', 'JP'] as const) for (const gender of ['female', 'male', 'nonbinary'] as const) {
    const world = newborn(42, { country, city: countries[country].cities[0], gender, background: 'royal' }), family = birthFamily(world);
    expect(world.journal.filter(entry => entry.text.includes(family.royal!.house.name))).toHaveLength(1);
    expect(world.journal[1].text).toContain('My title is ' + royalTitle(world, family.royal!.house, world.activePersonId) + '.');
    for (const parent of family.parents) {
      expect(parent.employment).toBeNull();
      const text = world.journal.find(entry => entry.id === 'journal_birth_parent_' + parent.id)!.text;
      expect(text).toContain(royalTitle(world, family.royal!.house, parent.id)); expect(text).not.toMatch(/works as|isn’t working/);
    }
    expect(world.journal.filter(entry => entry.category === 'royalty')).toHaveLength(0);
  }
});

test('single fathers and nonbinary parents never acquire an invented mother or grammatical pronouns', () => {
  const original = newborn(2); expect(birthFamily(original).parents).toHaveLength(1);
  for (const gender of ['male', 'nonbinary'] as const) {
    const world = copyWorld(original), parent = birthFamily(world).parents[0]; parent.gender = gender;
    for (let seed = 0; seed < 100; seed++) {
      const entries = composeBirthJournal(world, seed), text = entries.map(entry => entry.text).join(' ');
      expect(entries).toHaveLength(4); expect(text).not.toMatch(/my mother|my parents|They works|They is/i);
      expect(text).toContain(gender === 'male' ? 'My father is ' : 'My parent is ');
    }
  }
});

test('unemployed parents and missing job titles have factual fallbacks without fabricating occupations', () => {
  const world = newborn(2), parent = birthFamily(world).parents[0];
  endEmployment(world, parent.id); validateWorld(world);
  expect(composeBirthJournal(world, 2).find(entry => entry.id === 'journal_birth_parent_' + parent.id)!.text).toContain('She isn’t working at the moment.');
  const missing = newborn(2), job = birthFamily(missing).parents[0].employment!; job.roleId = 'removed-from-catalogue';
  const text = composeBirthJournal(missing, 2).find(entry => entry.id.startsWith('journal_birth_parent_'))!.text;
  expect(text).toContain('The job title wasn’t recorded.'); expect(text).not.toMatch(/works as|isn’t working/);
});

test('authored anecdotes respect family eligibility and their separately seeded probability bands', () => {
  expect(birthStories).toHaveLength(30); expect(new Set(birthStories.map(story => story.id)).size).toBe(30);
  const empty: BirthStoryContext = { mother: false, father: false, twoParents: false, singleParent: false, motherWorking: false, fatherWorking: false, royal: false };
  for (const tone of ['funny', 'unusual', 'bizarre'] as const) {
    const generic = eligibleBirthStories(empty, tone); expect(generic.length).toBeGreaterThan(0); expect(generic.every(story => !(story.requires?.length))).toBe(true);
  }
  const context = Object.fromEntries(Object.keys(empty).map(key => [key, true])) as BirthStoryContext, counts = { ordinary: 0, funny: 0, unusual: 0, bizarre: 0 };
  for (let seed = 0; seed < 10000; seed++) { const story = selectBirthStory(seed, context); counts[story?.tone ?? 'ordinary']++; expect(selectBirthStory(seed, context)).toEqual(story); }
  for (const [tone, target] of [['ordinary', 0.5], ['funny', 0.35], ['unusual', 0.12], ['bizarre', 0.03]] as const) expect(Math.abs(counts[tone] / 10000 - target)).toBeLessThan(0.02);
  const frozen = immutableWorld(newborn(1)), before = encodeWorld(frozen); composeBirthJournal(frozen, 1); selectBirthStory(99, birthFamily(frozen).context); expect(encodeWorld(frozen)).toBe(before);
});
