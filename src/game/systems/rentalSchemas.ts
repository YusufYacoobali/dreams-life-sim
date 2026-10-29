import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import type { Person, World } from '../model';

export const rentalLeaseSchema = z.object({
  id: z.string().min(1), tenantId: z.string(), householdId: z.string(), catalogId: z.string(), name: z.string().min(1).max(160),
  country: z.enum(countryCodes), city: z.string().min(1).max(80),
  currency: z.enum(['USD','CAD','GBP','AUD','EUR','BRL','INR','JPY','ZAR']), monthlyRent: z.bigint().positive(),
  started: dateSchema, ended: dateSchema.nullable(),
  endReason: z.enum(['moved-out','household-changed','owned-home','tenant-died','relocated']).nullable(),
  payments: z.array(z.object({ month: z.number().int(), transactionId: z.string().min(1) })).min(1),
});
export type RentalLease = z.infer<typeof rentalLeaseSchema>;

/** A lease is a residence, never a physical asset or a claim to ownership. */
export function rentalResidence(world: World, person: Person = world.people[world.activePersonId]): RentalLease | undefined {
  return world.rentalLeases.find(lease => !lease.ended && lease.householdId === person.householdId && lease.country === person.country && lease.city === person.city);
}

export function endRentalLease(world: World, lease: RentalLease, reason: NonNullable<RentalLease['endReason']>) {
  if (lease.ended) return;
  lease.ended = { ...world.date }; lease.endReason = reason;
}

/** Household, ownership and relocation commands all pass this shared cleanup. */
export function refreshRentalLeases(world: World) {
  for (const lease of world.rentalLeases) {
    if (lease.ended) continue;
    const tenant = world.people[lease.tenantId];
    const household = world.households.find(item => item.id === lease.householdId);
    if (tenant.died) endRentalLease(world,lease,'tenant-died');
    else if (!household || tenant.householdId !== lease.householdId || !household.members.includes(tenant.id)) endRentalLease(world,lease,'household-changed');
    else if (tenant.country !== lease.country || tenant.city !== lease.city) endRentalLease(world,lease,'relocated');
    else if (household.homeAssetId) endRentalLease(world,lease,'owned-home');
  }
}
