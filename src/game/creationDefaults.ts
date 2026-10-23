import { automaticAppearance } from './appearance';
import { creationNamePools } from './content/creationNames';
import { countries, type CountryCode } from './countries';
import { randomCreation, type Creation } from './createLife';
import { forkRandom, randomInteger } from './random';

function suggestion<T>(seed: number, key: string, values: readonly T[]): T {
  return values[randomInteger(forkRandom(seed, 'creation-default:' + key), 0, values.length - 1).value];
}

export function suggestedFirstName(seed: number, country: CountryCode, gender: Creation['gender']): string {
  return suggestion(seed, country + ':' + gender + ':first-name', creationNamePools[country][gender]);
}

export function suggestedLastName(seed: number, country: CountryCode): string {
  return suggestion(seed, country + ':last-name', countries[country].lastNames);
}

export function suitableSuggestedFirstName(name: string, country: CountryCode, gender: Creation['gender']): boolean {
  const pools = creationNamePools[country];
  return pools[gender].includes(name) || pools.nonbinary.includes(name);
}

export function suggestedCreationAppearance(seed: number, gender: Creation['gender'], current: Creation['appearance']): Creation['appearance'] {
  // Use the same seed for each gender, so toggling back restores its suggestion.
  // Keep skin, hair colour and face shape independent of nationality and gender.
  const original = randomCreation(seed).appearance;
  const { provenance: _provenance, ...appearance } = automaticAppearance({ ...current, hair: original.hair }, gender, 'creation:' + seed);
  return appearance;
}

/** Editor defaults are separate from the versioned simulation constructor.
 * Existing saves, replay inputs and game random streams remain untouched.
 */
export function newCreationDefaults(seed: number): Creation {
  const input = randomCreation(seed);
  return { ...input, firstName: suggestedFirstName(seed, input.country, input.gender), appearance: suggestedCreationAppearance(seed, input.gender, input.appearance) };
}
