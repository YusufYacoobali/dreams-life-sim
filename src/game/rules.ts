import { CountryCode, countries } from './countries';
import { currencyDigits, roundRatio } from './money';

/** Authored game minimums for voluntary secondary withdrawal, separate from course assessment ages. */
// V1 is retained for saved records. A later model must add a new version rather
// than changing the historical table used to validate a recorded withdrawal.
export const schoolLeavingRulesV1 = Object.freeze({
  US: 16, CA: 16, GB: 16, AU: 17, FR: 16, DE: 16, ES: 16, IT: 16, BR: 17, IN: 14, JP: 15, ZA: 15,
} satisfies Record<CountryCode, number>);
export const minimumSchoolLeavingAge = schoolLeavingRulesV1;

export type RulePack = {
  version: 1; schoolStart: number; secondaryStart: number; schoolEnd: number; partTimeAge: number; adultAge: number; retirementAge: number;
  baseWage: bigint; livingCost: bigint; universityTuition: bigint; tradeTuition: bigint; doctorVisit: bigint;
  taxBands: readonly { above: bigint; bps: number }[];
  studentInterestBps: number; personalInterestBps: number; protectedFamilyBps: number; estateAllowance: bigint; estateTaxBps: number;
};
type Input = Omit<RulePack, 'version' | 'baseWage' | 'livingCost' | 'universityTuition' | 'tradeTuition' | 'doctorVisit' | 'estateAllowance' | 'taxBands'> & {
  baseWage: number; livingCost: number; universityTuition: number; tradeTuition: number; doctorVisit: number; estateAllowance: number;
  taxBands: readonly [number, number][];
};
function pack(code: CountryCode, value: Input): RulePack {
  const scale = 10n ** BigInt(currencyDigits[countries[code].currency]);
  const money = (major: number) => BigInt(major) * scale;
  return { ...value, version: 1, baseWage: money(value.baseWage), livingCost: money(value.livingCost), universityTuition: money(value.universityTuition), tradeTuition: money(value.tradeTuition), doctorVisit: money(value.doctorVisit), estateAllowance: money(value.estateAllowance), taxBands: value.taxBands.map(([above, bps]) => ({ above: money(above), bps })) };
}
/** Explicit simplified game models. These values do not assert current national law. */
export const rules: Record<CountryCode, RulePack> = {
  US: pack('US', { schoolStart: 6, secondaryStart: 12, schoolEnd: 18, partTimeAge: 16, adultAge: 18, retirementAge: 67, baseWage: 40000, livingCost: 1400, universityTuition: 14000, tradeTuition: 4500, doctorVisit: 180, taxBands: [[0, 0], [15000, 1200], [45000, 2200], [100000, 3200]], studentInterestBps: 500, personalInterestBps: 900, protectedFamilyBps: 5000, estateAllowance: 500000, estateTaxBps: 2000 }),
  CA: pack('CA', { schoolStart: 6, secondaryStart: 12, schoolEnd: 18, partTimeAge: 16, adultAge: 18, retirementAge: 65, baseWage: 48000, livingCost: 1500, universityTuition: 7500, tradeTuition: 3000, doctorVisit: 0, taxBands: [[0, 0], [16000, 1500], [55000, 2500], [110000, 3400]], studentInterestBps: 250, personalInterestBps: 800, protectedFamilyBps: 5000, estateAllowance: 600000, estateTaxBps: 1000 }),
  GB: pack('GB', { schoolStart: 5, secondaryStart: 11, schoolEnd: 18, partTimeAge: 16, adultAge: 18, retirementAge: 67, baseWage: 29000, livingCost: 1000, universityTuition: 9500, tradeTuition: 2200, doctorVisit: 0, taxBands: [[0, 0], [12500, 2000], [50000, 4000], [125000, 4500]], studentInterestBps: 400, personalInterestBps: 800, protectedFamilyBps: 5000, estateAllowance: 325000, estateTaxBps: 2500 }),
  AU: pack('AU', { schoolStart: 5, secondaryStart: 12, schoolEnd: 18, partTimeAge: 16, adultAge: 18, retirementAge: 67, baseWage: 58000, livingCost: 1700, universityTuition: 9000, tradeTuition: 2800, doctorVisit: 35, taxBands: [[0, 0], [18000, 1600], [45000, 3000], [135000, 4000]], studentInterestBps: 250, personalInterestBps: 850, protectedFamilyBps: 5000, estateAllowance: 800000, estateTaxBps: 0 }),
  FR: pack('FR', { schoolStart: 6, secondaryStart: 11, schoolEnd: 18, partTimeAge: 16, adultAge: 18, retirementAge: 64, baseWage: 30000, livingCost: 1000, universityTuition: 600, tradeTuition: 800, doctorVisit: 10, taxBands: [[0, 0], [11000, 1100], [29000, 3000], [82000, 4100]], studentInterestBps: 200, personalInterestBps: 650, protectedFamilyBps: 7500, estateAllowance: 150000, estateTaxBps: 1800 }),
  DE: pack('DE', { schoolStart: 6, secondaryStart: 10, schoolEnd: 18, partTimeAge: 16, adultAge: 18, retirementAge: 67, baseWage: 36000, livingCost: 1100, universityTuition: 600, tradeTuition: 500, doctorVisit: 10, taxBands: [[0, 0], [12000, 1600], [30000, 3000], [70000, 4200]], studentInterestBps: 150, personalInterestBps: 600, protectedFamilyBps: 5000, estateAllowance: 400000, estateTaxBps: 1500 }),
  ES: pack('ES', { schoolStart: 6, secondaryStart: 12, schoolEnd: 18, partTimeAge: 16, adultAge: 18, retirementAge: 67, baseWage: 25000, livingCost: 850, universityTuition: 1500, tradeTuition: 700, doctorVisit: 0, taxBands: [[0, 0], [7000, 1900], [20000, 2800], [60000, 4000]], studentInterestBps: 250, personalInterestBps: 700, protectedFamilyBps: 6500, estateAllowance: 200000, estateTaxBps: 1500 }),
  IT: pack('IT', { schoolStart: 6, secondaryStart: 11, schoolEnd: 19, partTimeAge: 16, adultAge: 18, retirementAge: 67, baseWage: 26000, livingCost: 900, universityTuition: 2000, tradeTuition: 900, doctorVisit: 15, taxBands: [[0, 0], [8000, 2300], [28000, 3500], [50000, 4300]], studentInterestBps: 250, personalInterestBps: 750, protectedFamilyBps: 6500, estateAllowance: 500000, estateTaxBps: 1000 }),
  BR: pack('BR', { schoolStart: 6, secondaryStart: 11, schoolEnd: 18, partTimeAge: 16, adultAge: 18, retirementAge: 65, baseWage: 30000, livingCost: 1300, universityTuition: 6000, tradeTuition: 2000, doctorVisit: 0, taxBands: [[0, 0], [28000, 750], [40000, 1500], [56000, 2750]], studentInterestBps: 450, personalInterestBps: 1400, protectedFamilyBps: 5000, estateAllowance: 150000, estateTaxBps: 600 }),
  IN: pack('IN', { schoolStart: 6, secondaryStart: 11, schoolEnd: 18, partTimeAge: 16, adultAge: 18, retirementAge: 60, baseWage: 360000, livingCost: 12000, universityTuition: 70000, tradeTuition: 22000, doctorVisit: 600, taxBands: [[0, 0], [300000, 500], [700000, 1000], [1200000, 2000], [2000000, 3000]], studentInterestBps: 700, personalInterestBps: 1200, protectedFamilyBps: 5000, estateAllowance: 10000000, estateTaxBps: 0 }),
  JP: pack('JP', { schoolStart: 6, secondaryStart: 12, schoolEnd: 18, partTimeAge: 16, adultAge: 18, retirementAge: 65, baseWage: 3200000, livingCost: 110000, universityTuition: 600000, tradeTuition: 350000, doctorVisit: 2000, taxBands: [[0, 0], [500000, 1000], [2000000, 2000], [5000000, 3000], [10000000, 4000]], studentInterestBps: 150, personalInterestBps: 700, protectedFamilyBps: 5000, estateAllowance: 36000000, estateTaxBps: 2000 }),
  ZA: pack('ZA', { schoolStart: 7, secondaryStart: 13, schoolEnd: 18, partTimeAge: 16, adultAge: 18, retirementAge: 65, baseWage: 150000, livingCost: 5500, universityTuition: 45000, tradeTuition: 15000, doctorVisit: 450, taxBands: [[0, 0], [95000, 1800], [240000, 2600], [500000, 3600]], studentInterestBps: 650, personalInterestBps: 1300, protectedFamilyBps: 5000, estateAllowance: 3500000, estateTaxBps: 2000 }),
};
export function incomeTax(gross: bigint, rule: RulePack): bigint {
  if (gross < 0n) throw new Error('Income cannot be negative');
  return rule.taxBands.reduce((total, band, index) => {
    const next = rule.taxBands[index + 1]?.above ?? gross;
    const taxable = (gross < next ? gross : next) - band.above;
    return total + (taxable > 0n ? roundRatio(taxable * BigInt(band.bps), 10000n) : 0n);
  }, 0n);
}
export const monthlyAmount = (annual: bigint, previousMonths: number) => roundRatio(annual * BigInt(previousMonths + 1), 12n) - roundRatio(annual * BigInt(previousMonths), 12n);
