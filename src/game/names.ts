import type { CountryCode } from './countries';
import type { Person } from './model';
import { creationNamePools } from './content/creationNames';
import { familyNamePools } from './content/nameExpansion';

type NamedPerson = Pick<Person, 'firstName' | 'lastName' | 'country' | 'city' | 'died'>;
const key = (name: string) => name.normalize('NFC').toLowerCase();

/** Reuse the two existing name draws. Avoid collisions without consuming extra
 * randomness, changing saved people or inventing numbered names. */
export function generatedPersonName(
  country: CountryCode, gender: Person['gender'], firstIndex: number, lastIndex: number,
  existing: readonly NamedPerson[], city: string, familyName?: string,
): { firstName: string; lastName: string } {
  const firstNames = creationNamePools[country][gender];
  const lastNames = familyName === undefined ? familyNamePools[country] : [familyName];
  const usedFull = new Set(existing.map(person => key(person.firstName + '\0' + person.lastName)));
  const usedLocalFirst = new Set(existing.filter(person => !person.died && person.country === country && person.city === city).map(person => key(person.firstName)));
  const surname = lastNames[lastIndex % lastNames.length];
  for (let offset = 0; offset < firstNames.length; offset++) {
    const firstName = firstNames[(firstIndex + offset) % firstNames.length];
    if (!usedLocalFirst.has(key(firstName)) && !usedFull.has(key(firstName + '\0' + surname))) return { firstName, lastName: surname };
  }
  for (let lastOffset = 0; lastOffset < lastNames.length; lastOffset++) {
    const lastName = lastNames[(lastIndex + lastOffset) % lastNames.length];
    for (let offset = 0; offset < firstNames.length; offset++) {
      const firstName = firstNames[(firstIndex + offset) % firstNames.length];
      if (!usedFull.has(key(firstName + '\0' + lastName))) return { firstName, lastName };
    }
  }
  return { firstName: firstNames[firstIndex % firstNames.length], lastName: surname };
}
