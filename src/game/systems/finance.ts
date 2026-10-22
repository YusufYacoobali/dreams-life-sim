import { personalBorrowReason } from './credit';
import { z } from 'zod';
import { ageOn } from '../personHelpers';
import type { World } from '../model';
import { rules, incomeTax } from '../rules';
import { IneligibleAction } from '../errors';
import { Currency, formatMoney, roundRatio } from '../money';
import { accountFor, active, borrow, charge, fact, post, result, trustForNecessaryCost } from './common';
import { fxMoney } from './markets';
import { householdLivingCost } from './households';
import { rentalHomeMonth } from './rentalHomes';
const currencySchema = z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']);

export const financeCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('borrow'), amount: z.bigint().positive() }),
  z.object({ type: z.literal('repay'), liabilityId: z.string(), amount: z.bigint().positive() }),
  z.object({ type: z.literal('exchange'), from: currencySchema, to: currencySchema, amount: z.bigint().positive(), quotedNet: z.bigint().positive() }),
]);
export type FinanceCommand = z.infer<typeof financeCommandSchema>;
export function exchangeQuote(world: World, amount: bigint, from: Currency, to: Currency) {
  const gross = fxMoney(world, { minor: amount, currency: from }, to).minor;
  // Round fees up: even tiny JPY/cent round trips cannot create cash from rounding.
  const fee = (gross + 99n) / 100n;
  return { gross, fee, net: gross - fee };
}
export function resolveFinance(world: World, command: FinanceCommand) {
  const person = active(world); const rule = rules[person.country]; const account = accountFor(world);
  if (command.type === 'borrow') {
    const reason=personalBorrowReason(world,command.amount);if(reason)throw new IneligibleAction(reason);
    borrow(world, command.amount, 'personal', rule.personalInterestBps);
    fact(world, 'I took out a personal loan of ' + formatMoney({ minor: command.amount, currency: account.currency }) + '.', 'finance');
    result(world, 'Loan paid into your account', 'Your cash and debt increased by the same amount. Interest accrues as time passes.', 'money');
  } else if (command.type === 'repay') {
    const debt = world.liabilities.find(candidate => candidate.id === command.liabilityId && candidate.ownerId === person.id);
    if (!debt) throw new IneligibleAction('Choose one of your debts');
    const paymentAccount = accountFor(world, person, debt.currency);
    if (command.amount > debt.principal) throw new IneligibleAction('The repayment exceeds the outstanding principal');
    if (command.amount > paymentAccount.cash) throw new IneligibleAction('Your balance cannot cover this repayment');
    debt.principal -= command.amount;
    post(world, -command.amount, -command.amount, 'repayment', 'Debt repayment', debt.id, person, debt.currency);
    if (debt.creditorId) post(world, command.amount, 0n, 'repayment-received', 'Family obligation repayment', null, world.people[debt.creditorId], debt.currency);
    result(world, 'Repayment completed', 'Your cash and outstanding debt both fell by the amount paid.', 'money');
  } else {
    if (ageOn(person, world.date) < rule.adultAge) throw new IneligibleAction('Currency exchange is available to adults');
    if (command.from === command.to) throw new IneligibleAction('Choose two different currencies');
    const source = accountFor(world, person, command.from);
    if (source.cash < command.amount) throw new IneligibleAction('Your balance cannot cover this exchange');
    const quote = exchangeQuote(world, command.amount, command.from, command.to);
    if (quote.net <= 0n || quote.net !== command.quotedNet) throw new IneligibleAction('The exchange quote changed or the amount is too small after fees');
    if (!world.accounts.some(item => item.ownerId === person.id && item.currency === command.to)) world.accounts.push({ id: 'account_' + person.id + '_' + command.to, ownerId: person.id, currency: command.to, cash: 0n, openingCash: 0n, lockedCash: 0n });
    post(world, -command.amount, 0n, 'exchange', 'Exchanged ' + command.from + ' to ' + command.to, null, person, command.from);
    post(world, quote.net, 0n, 'exchange', 'Received ' + command.to + ' after exchange fee', null, person, command.to);
    result(world, 'Currency exchanged', 'The source balance fell and the quoted amount reached the destination account. The exchange fee was deducted.', 'money', [{ id: 'received', label: 'Received', value: formatMoney({ minor: quote.net, currency: command.to }), tone: 'positive' }]);
  }
}
export function financeMonth(world: World, person = active(world)) {
  const account = accountFor(world, person); const rule = rules[person.country];
  for (const debt of world.liabilities.filter(candidate => candidate.ownerId === person.id && candidate.kind !== 'mortgage' && candidate.principal > 0n)) {
    const interest = roundRatio(debt.principal * BigInt(debt.interestBps), 120000n);
    if (interest) { debt.principal += interest; post(world, 0n, interest, 'interest', 'Interest added to ' + debt.kind + ' debt', debt.id, person, debt.currency); }
  }
  rentalHomeMonth(world, person);
  if (ageOn(person, world.date) >= rule.adultAge) charge(world, householdLivingCost(world, person), 'living', 'Monthly household living costs', 'living', undefined, person);
}
export function settleTax(world: World, person = active(world)) {
  const finance = person.finance;
  const due = incomeTax(finance.cycleGross, rules[person.country]);
  const adjustment = due - finance.cycleWithheld;
  if (adjustment > 0n) { trustForNecessaryCost(world, person, adjustment, accountFor(world, person).currency); charge(world, adjustment, 'tax', 'Annual income tax reconciliation', 'tax', undefined, person); }
  else if (adjustment < 0n) post(world, -adjustment, 0n, 'tax-refund', 'Annual income tax refund', null, person);
  if (finance.cycleGross > 0n) fact(world, 'My income for the year was ' + formatMoney({ minor: finance.cycleGross, currency: accountFor(world, person).currency }) + '; income tax was ' + formatMoney({ minor: due, currency: accountFor(world, person).currency }) + '.', 'finance', '', person.id);
  finance.cycleGross = 0n; finance.cycleWithheld = 0n;
}
export function cashNetWorth(world: World, currency: Currency = accountFor(world).currency): bigint {
  return world.accounts.filter(candidate => candidate.ownerId === world.activePersonId && candidate.currency === currency).reduce((sum, candidate) => sum + candidate.cash, 0n) - world.liabilities.filter(debt => debt.ownerId === world.activePersonId && debt.currency === currency).reduce((sum, debt) => sum + debt.principal, 0n);
}
