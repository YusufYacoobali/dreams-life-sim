import type { CountryCode } from '../countries';
/** Authored game policy shared by purchase, licensing and vehicle use. */
export const roadLicenceAgeV1: Record<CountryCode, number> = { US: 16, CA: 16, GB: 17, AU: 17, FR: 18, DE: 18, ES: 18, IT: 18, BR: 18, IN: 18, JP: 18, ZA: 18 };
export const vehicleMinimumAge = (country: CountryCode, kind: 'road' | 'boat' | 'pilot' = 'road') => kind === 'road' ? roadLicenceAgeV1[country] : 18;
