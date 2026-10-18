import type { Person, World } from '../model';
import { IneligibleAction } from '../errors';
import { randomInteger } from '../random';
import type { RuntimeEffectRow } from '../runtime';
import type { Currency } from '../money';
import { countries } from '../countries';

export const bounded = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
export const active = (world: World) => world.people[world.activePersonId];
export const availableCash = (account: World['accounts'][number]) => account.cash - account.lockedCash;
export function accountFor(world: World, person: Person = active(world), currency: Currency = countries[person.country].currency) {
  const account = world.accounts.find(candidate => candidate.ownerId === person.id && candidate.currency === currency);
  if (!account) throw new IneligibleAction('No bank account is available');
  return account;
}
export function draw(world: World, stream: keyof World['random'], min: number, max: number) {
  const result = randomInteger(world.random[stream], min, max); world.random[stream] = result.state; return result.value;
}
export function fact(world: World, text: string, category: string, suffix = '', personId = world.activePersonId) {
  world.journal.push({ id: 'fact_' + world.revision + '_' + world.journal.length + suffix, date: { ...world.date }, personId, text, category });
}
export function result(world: World, title: string, body: string, illustration: string, effects: RuntimeEffectRow[] = []) {
  world.pending = { kind: 'result', id: 'action_' + world.revision, title, body, illustration, effects };
}
export function post(world: World, cashDelta: bigint, debtDelta: bigint, category: string, description: string, liabilityId: string | null = null, person = active(world), currency?: Currency) {
  const account = accountFor(world, person, currency);
  if (account.cash + cashDelta < account.lockedCash) throw new IneligibleAction(account.lockedCash ? 'This payment exceeds your available balance; minor inheritance is held in trust' : 'Your balance cannot cover this payment');
  account.cash += cashDelta;
  world.ledger.push({ id: 'txn_' + world.revision + '_' + world.ledger.length, accountId: account.id, personId: person.id, liabilityId, year: world.date.year, month: world.date.month, currency: account.currency, cashDelta, debtDelta, category, description });
}
export function borrow(world: World, amount: bigint, kind: World['liabilities'][number]['kind'], interestBps: number) {
  if (amount <= 0n) throw new IneligibleAction('Choose a positive loan amount');
  const person = active(world); const account = accountFor(world);
  const id = 'debt_' + kind + '_' + person.id + '_' + account.currency;
  let liability = world.liabilities.find(candidate => candidate.id === id);
  if (!liability) { liability = { id, ownerId: person.id, currency: account.currency, kind, principal: 0n, interestBps, creditorId: null, assetId: null, monthlyPayment: 0n, remainingMonths: 0, missedPayments: 0 }; world.liabilities.push(liability); }
  liability.principal += amount;
  post(world, amount, amount, 'borrowing', kind === 'student' ? 'Student loan drawn' : 'Personal loan drawn', id);
}
export function charge(world: World, amount: bigint, category: string, description: string, arrears?: 'living' | 'tax', currency?: Currency, person = active(world)) {
  const account = accountFor(world, person, currency);
  const available = availableCash(account);
  if (amount < 0n) throw new Error('Negative charge');
  if (available >= amount) { if (amount) post(world, -amount, 0n, category, description, null, person, account.currency); return; }
  if (!arrears) throw new IneligibleAction('Your balance cannot cover this payment');
  const unpaid = amount - available;
  const id = 'debt_' + arrears + '_' + person.id + '_' + account.currency;
  let liability = world.liabilities.find(candidate => candidate.id === id);
  if (!liability) { liability = { id, ownerId: person.id, currency: account.currency, kind: arrears, principal: 0n, interestBps: 300, creditorId: null, assetId: null, monthlyPayment: 0n, remainingMonths: 0, missedPayments: 0 }; world.liabilities.push(liability); }
  liability.principal += unpaid;
  post(world, -available, unpaid, category, description + ' (unpaid part added to arrears)', id, person, account.currency);
}
/** Used only by automatic costs that preserve a minor's inherited property. */
export function trustForNecessaryCost(world: World, person: Person, amount: bigint, currency: Currency) {
  if (person.died) return;
  const account = accountFor(world, person, currency), shortfall = amount - availableCash(account);
  if (shortfall > 0n) account.lockedCash -= shortfall < account.lockedCash ? shortfall : account.lockedCash;
}
