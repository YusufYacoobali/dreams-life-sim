import { automaticArtworkPools } from '../../src/game/appearanceArtwork';
import { presentationForGender } from '../../src/game/appearance';
import { creationNamePools } from '../../src/game/content/creationNames';
import { countries, countryCodes } from '../../src/game/countries';
import { creationSchema, randomCreation } from '../../src/game/createLife';
import { newCreationDefaults } from '../../src/game/creationDefaults';
import { useCreationDraft } from '../../src/state/creationDraft';
import { avatarPresets } from '../../src/ui/CreationElements';

const state = () => useCreationDraft.getState();
const draft = () => state().draft!;
const input = () => draft().input;
const genders = ['male', 'female', 'nonbinary'] as const;

beforeEach(() => { useCreationDraft.setState({ draft: null }); });

function expectSuitableArtwork() {
  const appearance = input().appearance, pool = automaticArtworkPools[presentationForGender(input().gender)];
  expect(pool.identities as readonly number[]).toContain(appearance.identity);
  expect(pool.hair as readonly number[]).toContain(appearance.hair);
  expect(pool.outfits as readonly number[]).toContain(appearance.outfit);
}

test.each(countryCodes)('country and gender changes produce local names, a valid city and appropriate default artwork in %s', country => {
  state().begin(42, 'custom');
  for (const gender of genders) {
    state().edit({ country, gender });
    expect(creationNamePools[country][gender].includes(input().firstName) || creationNamePools[country].nonbinary.includes(input().firstName)).toBe(true);
    expect(countries[country].lastNames).toContain(input().lastName);
    expect(countries[country].cities).toContain(input().city);
    expectSuitableArtwork();
    expect(creationSchema.safeParse(input()).success).toBe(true);
  }
});

test('random and custom opening previews use coherent defaults without changing the simulation constructor or input', () => {
  const coverage = new Set<string>();
  for (let seed = 0; seed < 180; seed++) {
    const original = randomCreation(seed), before = structuredClone(original);
    const suggestion = newCreationDefaults(seed);
    state().begin(seed, seed % 2 ? 'custom' : 'random');
    expect(input()).toEqual(suggestion);
    expect(creationNamePools[input().country][input().gender]).toContain(input().firstName);
    expectSuitableArtwork();
    expect({ ...suggestion, firstName: original.firstName, appearance: original.appearance }).toEqual(original);
    expect(randomCreation(seed)).toEqual(before);
    expect(draft().edited).toEqual({ firstName: false, lastName: false, artwork: { identity: false, hair: false, outfit: false } });
    coverage.add(input().country + ':' + input().gender);
  }
  expect(coverage.size).toBe(countryCodes.length * genders.length);
});

test('an opposite-gender suggestion updates, a neutral name stays, and a surname never changes just because gender does', () => {
  state().begin(42, 'custom'); state().edit({ country: 'JP', gender: 'male' }); state().edit({ country: 'IT' });
  const maleName = input().firstName, surname = input().lastName;
  state().edit({ gender: 'female' });
  expect(creationNamePools.IT.female).toContain(input().firstName); expect(input().firstName).not.toBe(maleName);
  expect(input().lastName).toBe(surname); expectSuitableArtwork();
  state().edit({ country: 'US', gender: 'nonbinary' });
  const neutralName = input().firstName;
  for (const gender of ['male', 'female', 'nonbinary'] as const) {
    state().edit({ gender }); expect(input().firstName).toBe(neutralName); expectSuitableArtwork();
  }
});

test.each(['firstName', 'lastName'] as const)('editing %s protects only that name; the other name still follows the country', key => {
  state().begin(42, 'custom'); state().edit({ country: 'IT', gender: 'male' });
  state().edit({ [key]: 'My own name' }); state().edit({ country: 'JP', gender: 'female' });
  expect(input()[key]).toBe('My own name');
  if (key === 'firstName') expect(countries.JP.lastNames).toContain(input().lastName);
  else expect(creationNamePools.JP.female).toContain(input().firstName);
  expectSuitableArtwork();
});

test('typed names, including a deliberately unconventional name or a temporarily empty field, survive country and gender edits', () => {
  state().begin(42, 'custom'); state().edit({ firstName: 'Zéphyr', lastName: 'Van der Meer' });
  for (const gender of genders) {
    state().edit({ country: 'JP', gender });
    expect(input()).toMatchObject({ firstName: 'Zéphyr', lastName: 'Van der Meer' });
  }
  state().edit({ firstName: '' }); state().edit({ country: 'BR', gender: 'female' });
  expect(input().firstName).toBe(''); expect(creationSchema.safeParse(input()).success).toBe(false);
});

test('skin, hair colour and face-shape edits survive while gender still updates the default identity, hair and outfit', () => {
  state().begin(42, 'custom'); state().edit({ gender: 'male' });
  state().edit({ appearance: { skin: 5, hairColor: 4, face: 3 } });
  const maleIdentity = input().appearance.identity;
  state().edit({ gender: 'female' }); expectSuitableArtwork();
  expect(input().appearance).toMatchObject({ skin: 5, hairColor: 4, face: 3 });
  expect(input().appearance.identity).not.toBe(maleIdentity);
  const female = structuredClone(input().appearance);
  state().edit({ country: 'JP' }); expect(input().appearance).toEqual(female);
});

test.each(['hair', 'outfit'] as const)('a manually chosen %s stays independent while the default face continues to follow gender', key => {
  state().begin(42, 'custom'); state().edit({ gender: 'female' });
  const identity = input().appearance.identity;
  const selected = key === 'hair' ? 5 : 11;
  state().edit({ appearance: { [key]: selected } }); state().edit({ gender: 'male' });
  expect(input().appearance[key]).toBe(selected); expect(input().appearance.identity).not.toBe(identity);
  expect(automaticArtworkPools.masculine.identities as readonly number[]).toContain(input().appearance.identity);
});

test('a complete avatar selection survives gender changes and editor remounts, including deliberately contrasting choices', () => {
  state().begin(42, 'custom'); state().edit({ appearance: avatarPresets[6] });
  for (const gender of genders) {
    state().edit({ gender, country: 'JP' }); state().begin(42, 'custom');
    expect(input().appearance).toEqual(avatarPresets[6]);
  }
});

test('country changes reset an incompatible city and royal background, while same-country selections keep a chosen city', () => {
  state().begin(42, 'custom'); state().edit({ country: 'JP', city: 'Osaka', background: 'royal' });
  const chosen = structuredClone(draft()); state().edit({ country: 'JP' });
  expect(draft()).toEqual(chosen);
  state().edit({ country: 'IT' }); expect(input()).toMatchObject({ city: 'Rome', background: 'ordinary' });
  state().edit({ country: 'FR', city: 'Osaka' }); expect(input().city).toBe('Paris');
});

test.each([0, 42, 0xFFFFFFFF])('default artwork restores consistently after gender toggles at seed %i; customising a reroll keeps its identity', seed => {
  state().begin(seed, 'custom'); state().edit({ gender: 'female', country: 'IT' });
  const female = structuredClone(input());
  state().edit({ gender: 'male' }); state().edit({ gender: 'female' });
  expect(input()).toEqual(female);
  state().edit({ firstName: 'Custom', appearance: { hair: 5, outfit: 11 } });
  const nextSeed = (seed + 1) >>> 0; state().randomise(nextSeed);
  expect(input()).toEqual(newCreationDefaults(nextSeed)); expect(draft().edited.firstName).toBe(false); expect(draft().edited.artwork.hair).toBe(false);
  const selected = structuredClone(input()); state().customise(); state().begin(nextSeed, 'custom');
  expect(input()).toEqual(selected); expect(draft().mode).toBe('custom');
});
