import { companionSchema } from './lifestyleSchemas';
import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import { petOfferIds, petSpecies } from '../content/pets';
import { earningsCurrencySchema } from './earningsSchemas';
import type { World } from '../model';
const percentage = z.number().int().min(0).max(100), money = z.bigint().nonnegative();
export const petAdoptionSchema = z.object({ pricingVersion: z.literal(1).optional(), id: z.string(), personId: z.string(), ownerId: z.string(), offerId: z.enum(petOfferIds), date: dateSchema, roll: z.number().int().min(1).max(100), chance: percentage, accepted: z.boolean(), relationshipStrength: percentage.nullable(), country: z.enum(countryCodes), city: z.string().min(1).max(80), petId: z.string().nullable() });
export const petSchema = z.object({
  companion: companionSchema.optional(), pricingVersion: z.literal(1).optional(),
  id: z.string(), species: z.enum(petSpecies), offerId: z.enum(petOfferIds), breed: z.string(), name: z.string().trim().min(1).max(40).refine(value => !/[\u0000-\u001f]/.test(value)),
  born: dateSchema, adopted: dateSchema, adoptedById: z.string(), originalOwnerId: z.string(), ownerId: z.string(), country: z.enum(countryCodes), city: z.string(),
  status: z.enum(['active', 'deceased', 'rehomed']), ended: dateSchema.nullable(), endReason: z.string().nullable(), endKind: z.enum(['owner-unavailable', 'unfunded', 'health', 'age', 'voluntary']).nullable(), lifespanMonths: z.number().int().min(18).max(600),
  health: percentage, happiness: percentage, bonds: z.record(z.string(), percentage), temperament: z.enum(['gentle', 'playful', 'independent']), illness: z.enum(['none', 'infection', 'recovering']), recoveryMonths: z.number().int().min(0).max(2),
  adoptionFee: money, adoptionCurrency: earningsCurrencySchema, adoptionTransactionId: z.string(), consent: z.object({ roll: z.number().int().min(1).max(100), chance: z.number().int().min(0).max(100) }),
  lastMonth: z.number().int(), unfundedMonths: z.number().int().min(0).max(2), lastVetMonth: z.number().int().nullable(),
  owners: z.array(z.object({ personId: z.string(), since: dateSchema, ended: dateSchema.nullable() })),
  periods: z.array(z.object({ month: z.number().int(), ledgerCursor: z.number().int().nonnegative(), country: z.enum(countryCodes), city: z.string(), ownerId: z.string(), currency: earningsCurrencySchema, foodDue: money, boardingDue: money, paid: money, paymentId: z.string().nullable(), care: z.enum(['owner', 'family', 'boarding', 'unfunded']), carerId: z.string().nullable(), healthRoll: z.number().int().min(1).max(100), health: percentage, happiness: percentage })).max(720),
  moves: z.array(z.object({ relocationId: z.string(), date: dateSchema, ownerId: z.string(), payerId: z.string(), fromCountry: z.enum(countryCodes), fromCity: z.string(), country: z.enum(countryCodes), city: z.string(), currency: earningsCurrencySchema, fee: money, transactionId: z.string() })),
  visits: z.array(z.object({ date: dateSchema, personId: z.string(), ownerId: z.string(), country: z.enum(countryCodes), city: z.string(), currency: earningsCurrencySchema, paid: money, paymentId: z.string(), roll: z.number().int().min(1).max(100), successful: z.boolean() })),
});
export type Pet = z.infer<typeof petSchema>;
export const householdPets = (world: World, personId = world.activePersonId) => { const person = world.people[personId]; if (!person) return []; return world.pets.filter(pet => pet.status === 'active' && (pet.ownerId === person.id || !!person.householdId && world.people[pet.ownerId]?.householdId === person.householdId) && pet.country === person.country && pet.city === person.city); };
