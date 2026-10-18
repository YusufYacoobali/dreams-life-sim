import { z } from 'zod';
import { ageOn, compareDates, fullName, Person, World } from '../model';
import { Currency, currencyDigits, formatMoney, Money, roundRatio } from '../money';
import { rules } from '../rules';
import { IneligibleAction } from '../errors';
import { fxMoney, investmentValue, netWorth, protectSeparateProperty } from '../valuation';
import { accountFor, active, fact, post, result } from './common';
import { childrenOf } from './family';
import { saleQuote } from './assets';
import { willSchema } from './estateSchemas';
export const estateCommandSchema = z.discriminatedUnion('type', [
  willSchema.omit({ personId: true, updated: true }).extend({ type: z.literal('save-will') }),
  z.object({ type: z.literal('revoke-will') }),
  z.object({ type: z.literal('continue-child'), personId: z.string() }),
]);
export type EstateCommand = z.infer<typeof estateCommandSchema>;
type Share = { personId: string; bps: number };
/** Largest-remainder apportionment: all minor units are assigned once, stable ties by identity. */
export function apportion(total: bigint, shares: { personId: string; weight: bigint }[]): Map<string, bigint> {
  const positive = shares.filter(item => item.weight > 0n), weight = positive.reduce((sum, item) => sum + item.weight, 0n);
  if (!weight) return new Map();
  const rows = positive.map(item => ({ ...item, amount: total * item.weight / weight, remainder: total * item.weight % weight }));
  let left = total - rows.reduce((sum, item) => sum + item.amount, 0n);
  rows.sort((a, b) => a.remainder === b.remainder ? a.personId < b.personId ? -1 : a.personId > b.personId ? 1 : 0 : a.remainder > b.remainder ? -1 : 1);
  for (const row of rows) if (left > 0n) { row.amount++; left--; }
  return new Map(rows.map(item => [item.personId, item.amount]));
}
function divide(total: number, ids: string[]) { return apportion(BigInt(total), ids.map(personId => ({ personId, weight: 1n }))); }
function descendants(world: World, personId: string, amount: number, depth = 0): Share[] {
  if (depth > 16) return [];
  const branches = childrenOf(world, personId).filter(child => !child.died || descendants(world, child.id, 10000, depth + 1).length > 0);
  const allocation = divide(amount, branches.map(child => child.id));
  return branches.flatMap(child => child.died ? descendants(world, child.id, Number(allocation.get(child.id) ?? 0n), depth + 1) : [{ personId: child.id, bps: Number(allocation.get(child.id) ?? 0n) }]).filter(item => item.bps > 0);
}
export function legalShares(world: World, personId: string): Share[] {
  const person = world.people[personId];
  const marriage = world.marriages.find(item => (item.a === personId || item.b === personId) && (!item.ended || item.endReason === 'death' && person.died && item.ended && compareDates(item.ended, person.died) === 0));
  const spouseId = marriage && (marriage.a === personId ? marriage.b : marriage.a), spouse = spouseId && !world.people[spouseId].died ? spouseId : undefined;
  const children = descendants(world, personId, spouse ? 5000 : 10000);
  if (spouse || children.length) return [...(spouse ? [{ personId: spouse, bps: children.length ? 5000 : 10000 }] : []), ...children];
  const parents = world.relationships.filter(item => item.roles.includes('parent') && item.to === personId && !world.people[item.from].died).map(item => item.from);
  const siblings = world.relationships.filter(item => item.roles.includes('sibling') && (item.from === personId || item.to === personId)).map(item => item.from === personId ? item.to : item.from).filter(id => !world.people[id].died);
  return [...divide(10000, parents.length ? parents : siblings)].map(([id, amount]) => ({ personId: id, bps: Number(amount) }));
}
export function estateShares(world: World, personId: string): Share[] {
  const legal = legalShares(world, personId), will = world.wills.find(item => item.personId === personId);
  const chosen = will?.shares.filter(item => !world.people[item.personId].died);
  if (!chosen?.length) return legal;
  const protectedBps = legal.length ? rules[world.people[personId].country].protectedFamilyBps : 0;
  const protectedShares = apportion(BigInt(protectedBps), legal.map(item => ({ personId: item.personId, weight: BigInt(item.bps) })));
  const discretionary = apportion(BigInt(10000 - protectedBps), chosen.map(item => ({ personId: item.personId, weight: BigInt(item.bps) })));
  for (const [id, amount] of discretionary) protectedShares.set(id, (protectedShares.get(id) ?? 0n) + amount);
  return [...protectedShares].filter(([, amount]) => amount > 0n).map(([personId, amount]) => ({ personId, bps: Number(amount) }));
}
function ensureAccount(world: World, personId: string, currency: Currency) {
  if (!world.accounts.some(item => item.ownerId === personId && item.currency === currency)) world.accounts.push({ id: 'account_' + personId + '_' + currency, ownerId: personId, currency, cash: 0n, openingCash: 0n, lockedCash: 0n });
  return accountFor(world, world.people[personId], currency);
}
function estateTax(net: bigint, person: Person) { const rule = rules[person.country]; return net > rule.estateAllowance ? roundRatio((net - rule.estateAllowance) * BigInt(rule.estateTaxBps), 10000n) : 0n; }
/** One idempotent settlement per deceased identity, before any legacy actor switch. */
export function settleEstate(world: World, personId: string) {
  const prior = world.estates.find(item => item.personId === personId); if (prior) return prior;
  const person = world.people[personId]; if (!person?.died) throw new IneligibleAction('An estate can only settle after death');
  const valueAtDeath = netWorth(world, personId), currency = valueAtDeath.currency, cash = ensureAccount(world, personId, currency);
  const money = (minor: bigint): Money => ({ minor, currency }), convert = (minor: bigint, from: Currency) => fxMoney(world, { minor, currency: from }, currency).minor;
  const assets = world.assets.filter(item => item.ownerId === personId), propertiesAtDeath = assets.filter(item => item.kind === 'property').length;
  const shares = estateShares(world, personId), weights = shares.map(item => ({ personId: item.personId, weight: BigInt(item.bps) }));
  const will = world.wills.find(item => item.personId === personId), notes: string[] = []; let fees = 0n;
  for (const account of world.accounts.filter(item => item.ownerId === personId)) account.lockedCash = 0n;
  for (const account of world.accounts.filter(item => item.ownerId === personId && item.currency !== currency && item.cash > 0n)) {
    const original = account.cash, received = convert(original, account.currency);
    post(world, -original, 0n, 'estate-fx', 'Estate currency consolidation', null, person, account.currency); if (received) post(world, received, 0n, 'estate-fx', 'Estate currency received', null, person, currency);
  }
  for (const holding of world.holdings.filter(item => item.ownerId === personId && item.quantity > 0n)) {
    const value = investmentValue(world, holding.instrumentId, holding.quantity, currency), fee = roundRatio(value, 100n); fees += fee;
    post(world, value - fee, 0n, 'estate-investment', 'Estate sale of ' + holding.instrumentId, null, person, currency); holding.quantity = 0n; holding.costBasis = 0n;
  }
  for (const claim of world.liabilities.filter(item => item.creditorId === personId && item.principal > 0n)) {
    const value = convert(claim.principal, claim.currency), fee = roundRatio(value * 500n, 10000n); fees += fee;
    post(world, value - fee, 0n, 'estate-receivable', 'Receivable assigned to an external buyer', null, person, currency); claim.creditorId = null; claim.kind = 'personal';
    notes.push('A family receivable was assigned to an external buyer at 95% of its recorded value; the debtor still owes the principal.');
  }
  const debts = world.liabilities.filter(item => item.ownerId === personId && item.principal > 0n).sort((a, b) => ({ tax: 0, mortgage: 1, 'child-support': 2, settlement: 2, student: 3, personal: 3, living: 3 }[a.kind] - { tax: 0, mortgage: 1, 'child-support': 2, settlement: 2, student: 3, personal: 3, living: 3 }[b.kind]) || a.id.localeCompare(b.id));
  const debtValue = debts.reduce((sum, item) => sum + convert(item.principal, item.currency), 0n);
  const keep = new Map((will?.bequests ?? []).filter(item => assets.some(asset => asset.id === item.assetId) && shares.some(share => share.personId === item.personId)).map(item => [item.assetId, item.personId]));
  const assetValue = (id: string) => { const asset = assets.find(item => item.id === id)!; return convert(asset.value, asset.currency); };
  const saleValue = (asset: World['assets'][number]) => { const quote = saleQuote(world, asset); return convert(quote.price - quote.fee, asset.currency); };
  for (;;) {
    const liquid = cash.cash + assets.filter(item => !keep.has(item.id)).reduce((sum, item) => sum + saleValue(item), 0n);
    const retained = [...keep.keys()].reduce((sum, id) => sum + assetValue(id), 0n), net = liquid + retained - debtValue, tax = estateTax(net, person);
    const quotas = apportion(net > tax ? net - tax : 0n, weights), given = new Map<string, bigint>();
    for (const [id, heir] of keep) given.set(heir, (given.get(heir) ?? 0n) + assetValue(id));
    const invalidHeir = [...given].find(([id, value]) => value > (quotas.get(id) ?? 0n))?.[0];
    if (!keep.size || !invalidHeir && liquid >= debtValue + tax) break;
    const candidate = [...keep.keys()].filter(id => !invalidHeir || keep.get(id) === invalidHeir).sort((a, b) => assetValue(a) === assetValue(b) ? a.localeCompare(b) : assetValue(a) > assetValue(b) ? -1 : 1)[0];
    keep.delete(candidate); notes.push('The specific bequest of ' + assets.find(item => item.id === candidate)!.name + ' required liquidation to meet debts, tax or protected shares.');
  }
  for (const asset of assets.filter(item => !keep.has(item.id))) {
    const quote = saleQuote(world, asset), received = convert(quote.price - quote.fee, asset.currency); fees += convert(asset.value - quote.price + quote.fee, asset.currency);
    if (received) post(world, received, 0n, 'estate-asset-sale', 'Estate sale of ' + asset.name, null, person, currency);
    asset.ownerId = null; asset.primaryHome = false; asset.rental = 'none'; asset.listing = null; asset.provenance.push('Sold by the estate of ' + fullName(person));
  }
  let debtPaid = 0n, debtWrittenOff = 0n;
  for (const debt of debts) {
    const due = convert(debt.principal, debt.currency); let paid = debt.principal;
    if (due > cash.cash) {
      const from = world.market.fx[currency], to = world.market.fx[debt.currency];
      paid = cash.cash * to.numerator * from.denominator * 10n ** BigInt(currencyDigits[debt.currency]) / (to.denominator * from.numerator * 10n ** BigInt(currencyDigits[currency]));
      if (paid > debt.principal) paid = debt.principal;
      while (paid > 0n && convert(paid, debt.currency) > cash.cash) paid--;
    }
    const spent = convert(paid, debt.currency), writtenOff = debt.principal - paid;
    if (spent) post(world, -spent, 0n, 'estate-debt', 'Estate creditor payment', null, person, currency);
    if (paid && debt.creditorId) { ensureAccount(world, debt.creditorId, debt.currency); post(world, paid, 0n, 'estate-creditor-payment', 'Payment from ' + person.firstName + '’s estate', null, world.people[debt.creditorId], debt.currency); }
    if (debt.principal) post(world, 0n, -debt.principal, 'estate-debt-close', 'Estate debt paid or written off', debt.id, person, debt.currency);
    debt.principal = 0n; debt.assetId = null; debt.monthlyPayment = 0n; debt.remainingMonths = 0;
    debtPaid += spent; debtWrittenOff += convert(writtenOff, debt.currency);
  }
  for (const asset of assets) { asset.mortgageId = null; for (const household of world.households) if (household.homeAssetId === asset.id) household.homeAssetId = null; }
  const retained = [...keep.keys()].reduce((sum, id) => sum + assetValue(id), 0n);
  const dueTax = estateTax(cash.cash + retained, person), tax = dueTax < cash.cash ? dueTax : cash.cash;
  if (tax) post(world, -tax, 0n, 'estate-tax', 'Estate tax', null, person, currency);
  const quotas = apportion(cash.cash + retained, weights), distributions: World['estates'][number]['distributions'] = [];
  for (const share of shares) {
    const heir = world.people[share.personId], ids = [...keep].filter(([, id]) => id === heir.id).map(([id]) => id), grantedAssets = ids.reduce((sum, id) => sum + assetValue(id), 0n);
    const payment = (quotas.get(heir.id) ?? 0n) - grantedAssets; if (payment < 0n) throw new Error('Estate bequest exceeds the heir’s conserved share');
    const destination = ensureAccount(world, heir.id, currency);
    if (payment) { post(world, -payment, 0n, 'estate-distribution', 'Inheritance to ' + heir.firstName, null, person, currency); post(world, payment, 0n, 'inheritance', 'Inheritance from ' + person.firstName, null, heir, currency); if (ageOn(heir, world.date) < rules[heir.country].adultAge) destination.lockedCash += payment; }
    for (const id of ids) {
      const asset = assets.find(item => item.id === id)!, familyHome = asset.primaryHome && heir.householdId === person.householdId && !world.assets.some(item => item.ownerId === heir.id && item.primaryHome);
      asset.ownerId = heir.id; asset.primaryHome = familyHome; asset.listing = null; asset.titleSince = { ...world.date }; asset.ownershipSource = 'inheritance'; asset.provenance.push('Inherited by ' + fullName(heir) + ' from ' + fullName(person) + ' in ' + world.date.year); ensureAccount(world, heir.id, asset.currency);
      const household = world.households.find(item => item.id === heir.householdId); if (familyHome && household) household.homeAssetId = asset.id;
    }
    protectSeparateProperty(world, heir.id, money(payment + grantedAssets));
    fact(world, 'I inherited ' + formatMoney(money(payment + grantedAssets)) + ' in cash and property from ' + fullName(person) + '.', 'family', '', heir.id);
    distributions.push({ personId: heir.id, cash: money(payment), assets: ids, assetValue: money(grantedAssets) });
  }
  const charity = cash.cash; if (charity) post(world, -charity, 0n, 'estate-charity', 'Unclaimed estate donated', null, person, currency);
  const executor = will && !world.people[will.executorId].died && ageOn(world.people[will.executorId], world.date) >= 18 ? will.executorId : shares.find(item => ageOn(world.people[item.personId], world.date) >= 18)?.personId ?? null;
  const estate = { id: 'estate_' + personId, personId, settled: { ...world.date }, netWorthAtDeath: valueAtDeath, propertiesAtDeath, executorId: executor, fees: money(fees), debtPaid: money(debtPaid), debtWrittenOff: money(debtWrittenOff), tax: money(tax), distributions, charity: money(charity), notes };
  world.estates.push(estate); return estate;
}
export function resolveEstate(world: World, command: EstateCommand) {
  const person = active(world);
  if (command.type === 'continue-child') {
    if (!person.died) throw new IneligibleAction('This life has not ended');
    const child = childrenOf(world, person.id).find(item => item.id === command.personId && !item.died); if (!child) throw new IneligibleAction('Choose an existing living child');
    settleEstate(world, person.id); world.legacies.push({ fromId: person.id, toId: child.id, date: { ...world.date } }); world.generation++;
    world.activePersonId = child.id; world.birthAcknowledged = true; world.pending = null;
    world.annual = world.legacyAnnual?.stage === 'months' ? { ...world.legacyAnnual, pausedForPlanning: true } : null; world.legacyAnnual = null;
    fact(world, 'I continued the family story after the death of ' + fullName(person) + '.', 'legacy');
    result(world, 'The family story continues', 'You are now ' + fullName(child) + ', age ' + ageOn(child, world.date) + '. Your existing identity, education, relationships, health, money and history are preserved. You can make choices before continuing the year.', 'family-tree'); return;
  }
  if (person.died || ageOn(person, world.date) < rules[person.country].adultAge) throw new IneligibleAction('An adult living person is required to write a will');
  if (command.type === 'revoke-will') { world.wills = world.wills.filter(item => item.personId !== person.id); result(world, 'Will revoked', 'The default protected-family succession model will apply.', 'will'); return; }
  const executor = world.people[command.executorId];
  if (!executor || executor.died || ageOn(executor, world.date) < 18 || executor.id === person.id) throw new IneligibleAction('Choose another living adult as executor');
  if (command.shares.reduce((sum, item) => sum + item.bps, 0) !== 10000 || new Set(command.shares.map(item => item.personId)).size !== command.shares.length || command.shares.some(item => !world.people[item.personId] || world.people[item.personId].died || item.personId === person.id)) throw new IneligibleAction('Allocate exactly 100% to distinct living beneficiaries');
  if (new Set(command.bequests.map(item => item.assetId)).size !== command.bequests.length || command.bequests.some(item => !world.assets.some(asset => asset.id === item.assetId && asset.ownerId === person.id) || !command.shares.some(share => share.personId === item.personId))) throw new IneligibleAction('Specific bequests must be owned assets assigned once to a beneficiary');
  const { type: _type, ...data } = command; world.wills = [...world.wills.filter(item => item.personId !== person.id), { ...data, personId: person.id, updated: { ...world.date } }];
  fact(world, 'I recorded a will and named ' + fullName(executor) + ' as executor.', 'family'); result(world, 'Your wishes are recorded', 'Protected family minimum shares, debts and estate tax still apply. A specific bequest is kept only when the estate can meet those obligations within the recipient’s share.', 'will');
}
