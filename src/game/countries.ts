import type { Currency } from './money';
import { creationNamePools } from './content/creationNames';
import { familyNamePools } from './content/nameExpansion';

export const countryCodes = ['US', 'CA', 'GB', 'AU', 'FR', 'DE', 'ES', 'IT', 'BR', 'IN', 'JP', 'ZA'] as const;
export type CountryCode = typeof countryCodes[number];
export type Country = {
  name: string; currency: Currency; locale: string; cities: readonly string[];
  firstNames: readonly string[]; lastNames: readonly string[];
};
const localNames = (code: CountryCode) => ({
  firstNames: [...new Set(Object.values(creationNamePools[code]).flat())],
  lastNames: familyNamePools[code],
});
/** Country metadata and local names; economic rules live in rules.ts. */
export const countries: Record<CountryCode, Country> = {
  US: { name: 'United States', currency: 'USD', locale: 'en-US', cities: ['New York', 'Los Angeles', 'Chicago'], ...localNames('US') },
  CA: { name: 'Canada', currency: 'CAD', locale: 'en-CA', cities: ['Toronto', 'Vancouver', 'Montréal'], ...localNames('CA') },
  GB: { name: 'United Kingdom', currency: 'GBP', locale: 'en-GB', cities: ['London', 'Manchester', 'Edinburgh'], ...localNames('GB') },
  AU: { name: 'Australia', currency: 'AUD', locale: 'en-AU', cities: ['Sydney', 'Melbourne', 'Brisbane'], ...localNames('AU') },
  FR: { name: 'France', currency: 'EUR', locale: 'fr-FR', cities: ['Paris', 'Lyon', 'Marseille'], ...localNames('FR') },
  DE: { name: 'Germany', currency: 'EUR', locale: 'de-DE', cities: ['Berlin', 'Hamburg', 'Munich'], ...localNames('DE') },
  ES: { name: 'Spain', currency: 'EUR', locale: 'es-ES', cities: ['Madrid', 'Barcelona', 'Valencia'], ...localNames('ES') },
  IT: { name: 'Italy', currency: 'EUR', locale: 'it-IT', cities: ['Rome', 'Milan', 'Naples'], ...localNames('IT') },
  BR: { name: 'Brazil', currency: 'BRL', locale: 'pt-BR', cities: ['São Paulo', 'Rio de Janeiro', 'Brasília'], ...localNames('BR') },
  IN: { name: 'India', currency: 'INR', locale: 'en-IN', cities: ['Mumbai', 'Delhi', 'Bengaluru'], ...localNames('IN') },
  JP: { name: 'Japan', currency: 'JPY', locale: 'ja-JP', cities: ['Tokyo', 'Osaka', 'Kyoto'], ...localNames('JP') },
  ZA: { name: 'South Africa', currency: 'ZAR', locale: 'en-ZA', cities: ['Johannesburg', 'Cape Town', 'Durban'], ...localNames('ZA') },
};
