import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes, type CountryCode } from '../countries';
import { roundRatio, type Currency } from '../money';

// Frozen authored V1 terms. Future country balancing must add a new version,
// rather than changing the meaning of an already paid domestic move.
type MoveRule = { currency: Currency; retirementAge: number; cities: readonly string[]; fee: bigint; living: bigint; bands: readonly (readonly [bigint, number])[] };
export const npcMoveRulesV1: Readonly<Record<CountryCode, MoveRule>> = Object.freeze({
  US: { currency: 'USD', retirementAge: 67, cities: ['New York', 'Los Angeles', 'Chicago'], fee: 80000n, living: 140000n, bands: [[0n, 0], [1500000n, 1200], [4500000n, 2200], [10000000n, 3200]] },
  CA: { currency: 'CAD', retirementAge: 65, cities: ['Toronto', 'Vancouver', 'Montréal'], fee: 96000n, living: 150000n, bands: [[0n, 0], [1600000n, 1500], [5500000n, 2500], [11000000n, 3400]] },
  GB: { currency: 'GBP', retirementAge: 67, cities: ['London', 'Manchester', 'Edinburgh'], fee: 58000n, living: 100000n, bands: [[0n, 0], [1250000n, 2000], [5000000n, 4000], [12500000n, 4500]] },
  AU: { currency: 'AUD', retirementAge: 67, cities: ['Sydney', 'Melbourne', 'Brisbane'], fee: 116000n, living: 170000n, bands: [[0n, 0], [1800000n, 1600], [4500000n, 3000], [13500000n, 4000]] },
  FR: { currency: 'EUR', retirementAge: 64, cities: ['Paris', 'Lyon', 'Marseille'], fee: 60000n, living: 100000n, bands: [[0n, 0], [1100000n, 1100], [2900000n, 3000], [8200000n, 4100]] },
  DE: { currency: 'EUR', retirementAge: 67, cities: ['Berlin', 'Hamburg', 'Munich'], fee: 72000n, living: 110000n, bands: [[0n, 0], [1200000n, 1600], [3000000n, 3000], [7000000n, 4200]] },
  ES: { currency: 'EUR', retirementAge: 67, cities: ['Madrid', 'Barcelona', 'Valencia'], fee: 50000n, living: 85000n, bands: [[0n, 0], [700000n, 1900], [2000000n, 2800], [6000000n, 4000]] },
  IT: { currency: 'EUR', retirementAge: 67, cities: ['Rome', 'Milan', 'Naples'], fee: 52000n, living: 90000n, bands: [[0n, 0], [800000n, 2300], [2800000n, 3500], [5000000n, 4300]] },
  BR: { currency: 'BRL', retirementAge: 65, cities: ['São Paulo', 'Rio de Janeiro', 'Brasília'], fee: 60000n, living: 130000n, bands: [[0n, 0], [2800000n, 750], [4000000n, 1500], [5600000n, 2750]] },
  IN: { currency: 'INR', retirementAge: 60, cities: ['Mumbai', 'Delhi', 'Bengaluru'], fee: 720000n, living: 1200000n, bands: [[0n, 0], [30000000n, 500], [70000000n, 1000], [120000000n, 2000], [200000000n, 3000]] },
  JP: { currency: 'JPY', retirementAge: 65, cities: ['Tokyo', 'Osaka', 'Kyoto'], fee: 64000n, living: 110000n, bands: [[0n, 0], [500000n, 1000], [2000000n, 2000], [5000000n, 3000], [10000000n, 4000]] },
  ZA: { currency: 'ZAR', retirementAge: 65, cities: ['Johannesburg', 'Cape Town', 'Durban'], fee: 300000n, living: 550000n, bands: [[0n, 0], [9500000n, 1800], [24000000n, 2600], [50000000n, 3600]] },
});
for (const rule of Object.values(npcMoveRulesV1)) { Object.freeze(rule.cities); for (const band of rule.bands) Object.freeze(band); Object.freeze(rule.bands); Object.freeze(rule); }
export function npcMoveTaxV1(gross: bigint, country: CountryCode) {
  const bands = npcMoveRulesV1[country].bands;
  return bands.reduce((sum, [above, bps], index) => {
    const next = bands[index + 1]?.[0] ?? gross, taxable = (gross < next ? gross : next) - above;
    return sum + (taxable > 0n ? roundRatio(taxable * BigInt(bps), 10000n) : 0n);
  }, 0n);
}
export const npcMoveAttemptKey = (year: number) => 'npc-move:' + year;
export const npcMoveDestinationV1 = (country: CountryCode, origin: string, year: number) => {
  const cities = npcMoveRulesV1[country].cities.filter(city => city !== origin);
  return cities[((year % cities.length) + cities.length) % cities.length];
};
const money = z.bigint().nonnegative(), cursor = z.number().int().nonnegative();
const currency = z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']);
export const npcMoveTaxSchema = z.object({
  personId: z.string(), accountId: z.string(), month: z.number().int(), country: z.enum(countryCodes), currency,
  gross: money, withheld: money, due: money, ledgerStart: cursor, ledgerEnd: cursor, paymentId: z.string().nullable(),
  journalIndex: cursor.nullable(), journalId: z.string().nullable(), journalText: z.string().max(1200).nullable(),
});
export type NpcMoveTax = z.infer<typeof npcMoveTaxSchema>;
export const npcMoveSchema = z.object({
  id: z.string(), revision: cursor, ruleVersion: z.literal(1), personId: z.string(), observerId: z.string(), relationshipId: z.string(), date: dateSchema,
  country: z.enum(countryCodes), originCity: z.string(), destinationCity: z.string(), currency,
  householdId: z.string(), householdMembers: z.array(z.string()).min(1),
  pensionTransactionId: z.string(), recordedPaidPeriods: z.number().int().min(12), settledThroughMonth: z.number().int(),
  accountId: z.string(), ledgerCursor: cursor, cashBefore: money, lockedCashBefore: z.literal(0n), availableBefore: money,
  movingCost: z.bigint().positive(), monthlyLiving: z.bigint().positive(), reserveMonths: z.literal(3), reserveRequired: z.bigint().positive(),
  tax: npcMoveTaxSchema, chance: z.literal(20), roll: z.number().int().min(1).max(100), outcome: z.enum(['stayed', 'moved']), paymentId: z.string().nullable(),
});
