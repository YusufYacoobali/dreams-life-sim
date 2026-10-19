import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import { destinationIds, destinations, tripDurations, tripFocuses } from '../content/travel';
import { earningsCurrencySchema, savedRateSchema } from './earningsSchemas';
import type { World } from '../model';
import { serviceAway } from './serviceSchemas';

const money = z.bigint().nonnegative();
export const tripQuoteSchema = z.object({
  currency: earningsCurrencySchema, destinationCurrency: earningsCurrencySchema, months: z.union([z.literal(1), z.literal(3), z.literal(12)]), partyWeight: z.number().int().positive(),
  transport: money, accommodationNative: money, rate: savedRateSchema, accommodation: money, exchangeFee: money, total: money,
});
export const tripSchema = z.object({
  id: z.string(), organizerId: z.string(), participantIds: z.array(z.string()).min(1).max(12),
  consents: z.array(z.object({ personId: z.string(), forPersonId: z.string(), accepted: z.boolean(), roll: z.number().int().min(1).max(100) })),
  destinationId: z.enum(destinationIds), originCountry: z.enum(countryCodes), originCity: z.string(), started: dateSchema, expectedReturn: dateSchema, anchorDay: z.number().int().min(1).max(31), ended: dateSchema.nullable(),
  duration: z.union([z.literal(1), z.literal(3), z.literal(12)]), status: z.enum(['active', 'completed', 'returned', 'interrupted', 'declined']), focus: z.enum(tripFocuses),
  quote: tripQuoteSchema, paid: money, refund: money, chargeTransactionId: z.string().nullable(), refundTransactionId: z.string().nullable(), lastMonth: z.number().int(), endReason: z.string().nullable(),
  leave: z.array(z.object({ personId: z.string(), employmentId: z.string(), paid: z.boolean(), used: z.boolean(), monthsAtDeparture: z.number().int().nonnegative(), year: z.number().int() })),
  periods: z.array(z.object({ month: z.number().int(), focus: z.enum(tripFocuses), weather: z.enum(['clear', 'rain', 'cloud']), responseRoll: z.number().int().min(1).max(100), changes: z.array(z.object({ personId: z.string(), happiness: z.number().int(), stress: z.number().int(), energy: z.number().int(), smarts: z.number().int() })) })).max(12),
});
export const activeTrip = (world: World, personId = world.activePersonId) => world.trips.find(trip => trip.status === 'active' && trip.participantIds.includes(personId));
export function physicalLocation(world: World, personId = world.activePersonId) {
  const trip = activeTrip(world, personId), person = world.people[personId];
  return trip ? { country: destinations[trip.destinationId].country, city: destinations[trip.destinationId].city } : { country: person.country, city: person.city };
}
export function samePhysicalPlace(world: World, firstId: string, secondId: string) {
  if (serviceAway(world, firstId) || serviceAway(world, secondId)) return false;
  const first = physicalLocation(world, firstId), second = physicalLocation(world, secondId);
  return first.country === second.country && first.city === second.city;
}
export { tripDurations };
