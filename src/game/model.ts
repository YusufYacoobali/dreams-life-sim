import { z } from 'zod';
import { countryCodes } from './countries';
import { pendingSchema } from './runtime';
import { dateSchema, daysInMonth, monthFrom, type GameDate } from './calendar';
export { dateSchema, type GameDate } from './calendar';
import { educationSchema, employmentSchema, financeSchema, holdingSchema, liabilitySchema, marketSchema, newEducation, newFinance, physicalAssetSchema, transactionSchema } from './systems/schemas';
import { jobs } from './content/jobs';
import { initialMarket } from './content/markets';
import { assetCatalog } from './content/assets';

const percentage = z.number().int().min(0).max(100);
const personId = z.string().regex(/^person_[a-zA-Z0-9_-]+$/);
const safeName = z.string().trim().min(1).max(40).refine(name => !/[\u0000-\u001F]/.test(name), 'Invalid name');
export const statsSchema = z.object({
  happiness: percentage, health: percentage, smarts: percentage, looks: percentage, respect: percentage,
  energy: percentage, fitness: percentage, stress: percentage, discipline: percentage, fame: percentage,
});
export type Stats = z.infer<typeof statsSchema>;
export const personSchema = z.object({
  id: personId, firstName: safeName, lastName: safeName,
  gender: z.enum(['male', 'female', 'nonbinary']),
  nationality: z.enum(countryCodes), country: z.enum(countryCodes), city: z.string().min(1).max(80),
  born: dateSchema, died: dateSchema.nullable(), causeOfDeath: z.string().max(300).nullable(),
  stats: statsSchema,
  appearance: z.object({ face: z.number().int().min(0).max(3), skin: z.number().int().min(0).max(5), hair: z.number().int().min(0).max(7), hairColor: z.number().int().min(0).max(4) }),
  traits: z.array(z.enum(['kind', 'ambitious', 'impulsive', 'reserved', 'creative', 'practical'])).max(3),
  education: educationSchema, employment: employmentSchema.nullable(), finance: financeSchema,
});
export type Person = z.infer<typeof personSchema>;
export const journalSchema = z.object({ id: z.string(), date: dateSchema, personId, text: z.string().max(1200), category: z.string() });
export const worldSchema = z.object({
  schemaVersion: z.literal(4), engineVersion: z.literal(3), contentVersion: z.literal(1),
  id: z.string().regex(/^life_[a-zA-Z0-9_-]+$/), revision: z.number().int().nonnegative(),
  date: dateSchema, activePersonId: personId,
  random: z.object({ events: z.number().int().min(0).max(0xFFFFFFFF), npcs: z.number().int().min(0).max(0xFFFFFFFF), economy: z.number().int().min(0).max(0xFFFFFFFF), outcomes: z.number().int().min(0).max(0xFFFFFFFF) }),
  people: z.record(personId, personSchema),
  relationships: z.array(z.object({ id: z.string(), from: personId, to: personId, kind: z.enum(['parent', 'sibling', 'friend', 'partner', 'spouse', 'coworker', 'classmate']), strength: percentage, trust: percentage, memories: z.array(z.string()) })),
  accounts: z.array(z.object({ id: z.string(), ownerId: personId, currency: z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']), cash: z.bigint(), openingCash: z.bigint().nonnegative() })),
  liabilities: z.array(liabilitySchema), ledger: z.array(transactionSchema),
  assets: z.array(physicalAssetSchema), holdings: z.array(holdingSchema), market: marketSchema,
  workHistory: z.array(z.object({ id: z.string(), personId, roleId: z.string(), employer: z.string(), started: dateSchema, ended: dateSchema.nullable(), monthsWorked: z.number().int().nonnegative(), grossEarned: z.bigint().nonnegative() })),
  journal: z.array(journalSchema),
  birthAcknowledged: z.boolean(),
  calendarAnchorDay: z.number().int().min(1).max(31),
  annual: z.object({ id: z.string(), startDate: dateSchema, targetDate: dateSchema, monthsProcessed: z.number().int().min(0).max(12), stage: z.enum(['months', 'complete']) }).nullable(),
  pending: pendingSchema.nullable(),
  eventHistory: z.array(z.object({ templateId: z.string(), year: z.number().int() })),
  actionCounts: z.record(z.string(), z.number().int().nonnegative()),
});
export type World = z.infer<typeof worldSchema>;

export function compareDates(a: GameDate, b: GameDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}
export function ageOn(person: Pick<Person, 'born' | 'died'>, date: GameDate): number {
  const at = person.died ?? date;
  const birthdayDay = Math.min(person.born.day, daysInMonth(at.year, person.born.month));
  return at.year - person.born.year - (at.month < person.born.month || (at.month === person.born.month && at.day < birthdayDay) ? 1 : 0);
}
export const fullName = (person: Pick<Person, 'firstName' | 'lastName'>) => person.firstName + ' ' + person.lastName;

/** Reject contradictory imports/checkpoints rather than repairing them silently. */
export function validateWorld(value: unknown): World {
  const world = worldSchema.parse(value);
  if (!world.people[world.activePersonId]) throw new Error('Missing active person');
  const accountIds = new Set<string>();
  const accountCurrencies = new Set<string>();
  const relationshipIds = new Set<string>();
  const journalIds = new Set<string>();
  for (const [id, person] of Object.entries(world.people)) {
    if (person.id !== id || ageOn(person, world.date) < 0) throw new Error('Invalid person identity or age');
    if (person.died && (compareDates(person.died, person.born) < 0 || compareDates(person.died, world.date) > 0)) throw new Error('Invalid death date');
    if (!!person.died !== !!person.causeOfDeath) throw new Error('Inconsistent death record');
    if (person.employment) {
      const role = jobs.find(candidate => candidate.id === person.employment!.roleId);
      const history = world.workHistory.find(record => record.id === person.employment!.id && record.personId === id && !record.ended);
      if (!role || !history || history.roleId !== role.id || person.died || (!role.partTime && person.education.stage !== 'none')) throw new Error('Invalid current employment');
    }
  }
  const workIds = new Set<string>();
  for (const record of world.workHistory) {
    if (workIds.has(record.id) || !world.people[record.personId] || !jobs.some(role => role.id === record.roleId) || compareDates(record.started, world.date) > 0 || (record.ended && (compareDates(record.ended, record.started) < 0 || compareDates(record.ended, world.date) > 0))) throw new Error('Invalid employment history');
    workIds.add(record.id);
  }
  for (const person of Object.values(world.people)) {
    const records = world.workHistory.filter(record => record.personId === person.id);
    if (records.reduce((sum, record) => sum + record.monthsWorked, 0) !== person.finance.serviceMonths || records.reduce((sum, record) => sum + record.grossEarned, 0n) !== person.finance.lifetimeGross) throw new Error('Earnings do not reconcile with employment history');
  }
  for (const relation of world.relationships) {
    if (relation.from === relation.to || !world.people[relation.from] || !world.people[relation.to] || relationshipIds.has(relation.id)) throw new Error('Invalid relationship reference');
    relationshipIds.add(relation.id);
  }
  for (const account of world.accounts) {
    const currencyKey = account.ownerId + ':' + account.currency;
    if (!world.people[account.ownerId] || account.cash < 0n || accountIds.has(account.id) || accountCurrencies.has(currencyKey)) throw new Error('Invalid cash account');
    accountIds.add(account.id);
    accountCurrencies.add(currencyKey);
  }
  const ledgerIds = new Set<string>();
  const liabilities = new Map(world.liabilities.map(liability => [liability.id, liability]));
  if (liabilities.size !== world.liabilities.length) throw new Error('Duplicate debt');
  const cashChanges = new Map<string, bigint>();
  const debtChanges = new Map<string, bigint>();
  for (const entry of world.ledger) {
    const account = world.accounts.find(candidate => candidate.id === entry.accountId);
    const liability = entry.liabilityId ? liabilities.get(entry.liabilityId) : null;
    if (ledgerIds.has(entry.id) || !account || account.ownerId !== entry.personId || account.currency !== entry.currency || (entry.liabilityId && (!liability || liability.currency !== entry.currency)) || (!entry.liabilityId && entry.debtDelta !== 0n)) throw new Error('Invalid ledger reference');
    ledgerIds.add(entry.id);
    cashChanges.set(account.id, (cashChanges.get(account.id) ?? 0n) + entry.cashDelta);
    if (entry.liabilityId) debtChanges.set(entry.liabilityId, (debtChanges.get(entry.liabilityId) ?? 0n) + entry.debtDelta);
  }
  for (const account of world.accounts) if (account.cash !== account.openingCash + (cashChanges.get(account.id) ?? 0n)) throw new Error('Cash does not reconcile with ledger');
  for (const liability of world.liabilities) if (!world.people[liability.ownerId] || !world.accounts.some(account => account.ownerId === liability.ownerId && account.currency === liability.currency) || liability.principal !== (debtChanges.get(liability.id) ?? 0n)) throw new Error('Debt does not reconcile with ledger');
  const assetIds = new Set<string>(); const homes = new Set<string>();
  for (const asset of world.assets) {
    const catalog = assetCatalog.find(item => item.id === asset.catalogId);
    if (assetIds.has(asset.id) || !catalog || catalog.kind !== asset.kind || (asset.ownerId && !world.people[asset.ownerId]) || compareDates(asset.acquired, world.date) > 0) throw new Error('Invalid physical asset');
    assetIds.add(asset.id);
    if (asset.ownerId && !world.accounts.some(account => account.ownerId === asset.ownerId && account.currency === asset.currency)) throw new Error('Missing asset currency account');
    if (asset.primaryHome && (!asset.ownerId || asset.kind !== 'property' || asset.rental !== 'none' || homes.has(asset.ownerId))) throw new Error('Invalid primary home');
    if (asset.primaryHome) homes.add(asset.ownerId!);
    if ((asset.kind !== 'property' && (asset.rental !== 'none' || asset.listing || asset.mortgageId)) || (asset.kind === 'possession' && asset.insured)) throw new Error('Invalid asset contract');
    if (!asset.ownerId && (asset.primaryHome || asset.rental !== 'none' || asset.listing || asset.mortgageId)) throw new Error('Sold asset retains an active contract');
    if (asset.mortgageId) {
      const loan = world.liabilities.find(item => item.id === asset.mortgageId);
      if (!loan || loan.ownerId !== asset.ownerId || loan.currency !== asset.currency || loan.assetId !== asset.id || loan.kind !== 'mortgage') throw new Error('Invalid mortgage link');
    }
  }
  for (const debt of world.liabilities) if (debt.kind === 'mortgage' && debt.principal > 0n && !world.assets.some(asset => asset.id === debt.assetId && asset.mortgageId === debt.id && asset.ownerId === debt.ownerId)) throw new Error('Mortgage has no collateral');
  const holdingIds = new Set<string>();
  for (const holding of world.holdings) {
    if (holdingIds.has(holding.id) || !world.people[holding.ownerId] || (holding.quantity === 0n && holding.costBasis !== 0n)) throw new Error('Invalid investment holding');
    holdingIds.add(holding.id);
  }
  if (!world.accounts.some(account => account.ownerId === world.activePersonId)) throw new Error('Missing player account');
  for (const entry of world.journal) {
    if (!world.people[entry.personId] || compareDates(entry.date, world.date) > 0 || compareDates(entry.date, world.people[entry.personId].born) < 0 || journalIds.has(entry.id)) throw new Error('Invalid journal fact');
    journalIds.add(entry.id);
  }
  if (world.annual && (compareDates(world.date, world.annual.startDate) < 0 || compareDates(world.date, world.annual.targetDate) > 0 || world.annual.targetDate.year !== world.annual.startDate.year + 1)) throw new Error('Invalid annual frame');
  if (world.annual && (compareDates(world.date, monthFrom(world.annual.startDate, world.annual.monthsProcessed, world.calendarAnchorDay)) !== 0 || compareDates(world.annual.targetDate, monthFrom(world.annual.startDate, 12, world.calendarAnchorDay)) !== 0)) throw new Error('Annual cursor does not match calendar');
  if (world.annual?.stage === 'complete' && world.annual.monthsProcessed !== 12) throw new Error('Incomplete year marked complete');
  if (world.pending?.kind === 'decision') {
    if (world.people[world.activePersonId].died || world.pending.personIds.some(id => !world.people[id] || world.people[id].died)) throw new Error('Invalid bound event person');
    if (new Set(world.pending.choices.map(choice => choice.id)).size !== world.pending.choices.length) throw new Error('Duplicate decision choices');
    for (const choice of world.pending.choices) for (const effect of choice.effects) {
      if (effect.kind === 'stat' && !world.people[effect.personId]) throw new Error('Invalid effect person');
      if (effect.kind === 'relationship' && !world.relationships.some(relation => relation.id === effect.relationshipId)) throw new Error('Invalid effect relationship');
      if (effect.kind === 'transfer') {
        const from = world.accounts.find(account => account.id === effect.fromAccountId);
        const to = world.accounts.find(account => account.id === effect.toAccountId);
        if (!from || !to || from.id === to.id || from.currency !== to.currency || from.cash < effect.minor) throw new Error('Invalid effect transfer');
      }
      if (effect.kind === 'asset-sale' || effect.kind === 'decline-sale') {
        const asset = world.assets.find(item => item.id === effect.assetId && item.ownerId === world.activePersonId);
        if (!asset?.listing?.offer || (effect.kind === 'asset-sale' && effect.minor !== asset.listing.offer)) throw new Error('Invalid property offer');
      }
    }
  }
  return world;
}

export function encodeWorld(world: World): string {
  return JSON.stringify(validateWorld(world), (_key, value: unknown) => typeof value === 'bigint' ? { $dreamsBigInt: value.toString() } : value);
}
export function decodeWorld(text: string): World {
  if (text.length > 20_000_000) throw new Error('Save is too large');
  const parsed = JSON.parse(text, (_key, value: unknown) => {
    if (value && typeof value === 'object' && Object.keys(value).length === 1 && '$dreamsBigInt' in value) {
      const amount = (value as { $dreamsBigInt: unknown }).$dreamsBigInt;
      if (typeof amount !== 'string' || !/^-?\d{1,128}$/.test(amount)) throw new Error('Invalid money encoding');
      return BigInt(amount);
    }
    return value;
  });
  // Version 1 shipped creation only. Preserve every identity, journal fact and RNG stream.
  if (parsed && parsed.schemaVersion === 1) {
    parsed.schemaVersion = 2;
    parsed.calendarAnchorDay = parsed.date?.day;
    parsed.annual = null; parsed.pending = null; parsed.eventHistory = [];
  }
  if (parsed && parsed.schemaVersion === 2) {
    parsed.schemaVersion = 3;
    parsed.engineVersion = 2;
    for (const person of Object.values(parsed.people ?? {}) as Record<string, unknown>[]) {
      person.education = newEducation(); person.employment = null; person.finance = newFinance();
    }
    for (const account of parsed.accounts ?? []) account.openingCash = account.cash;
    parsed.liabilities = []; parsed.ledger = [];
    parsed.workHistory = [];
    parsed.actionCounts = {};
  }
  if (parsed && parsed.schemaVersion === 3) {
    parsed.schemaVersion = 4; parsed.engineVersion = 3;
    parsed.assets = []; parsed.holdings = []; parsed.market = initialMarket(parsed.date);
    if (parsed.annual) parsed.annual.stage = parsed.annual.monthsProcessed === 12 && parsed.pending ? 'complete' : 'months';
  }
  return validateWorld(parsed);
}
