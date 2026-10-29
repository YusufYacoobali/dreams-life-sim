import { CountryCode } from './countries';
export type LegalRule = { version: 1; responsibilityAge: number; sentenceBps: number; bailBps: number; recordYears: number; juvenileRecordYears: number };
const pack = (responsibilityAge: number, sentenceBps: number, bailBps: number, recordYears: number, juvenileRecordYears = 3): LegalRule => ({ version: 1, responsibilityAge, sentenceBps, bailBps, recordYears, juvenileRecordYears });
/** Authored regional baselines for the game; not verified national criminal law. */
export const legalRules: Record<CountryCode, LegalRule> = {
  US: pack(14, 10000, 250, 10), CA: pack(12, 8500, 150, 7), GB: pack(10, 9000, 200, 7), AU: pack(12, 9000, 200, 7),
  FR: pack(13, 8500, 150, 7), DE: pack(14, 8000, 150, 5), ES: pack(14, 8500, 150, 7), IT: pack(14, 9000, 200, 7),
  BR: pack(12, 9500, 200, 10), IN: pack(12, 10000, 250, 10), JP: pack(14, 10000, 200, 10), ZA: pack(12, 9500, 200, 10),
};
