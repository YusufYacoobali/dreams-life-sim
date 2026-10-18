import { z } from 'zod';
import { ageOn, World } from '../model';
import { rules, incomeTax } from '../rules';
import { IneligibleAction } from '../errors';
import { formatMoney, roundRatio } from '../money';
import { accountFor, active, borrow, charge, fact, post, result } from './common';

export const financeCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('borrow'), amount: z.bigint().positive() }),
  z.object({ type: z.literal('repay'), liabilityId: z.string(), amount: z.bigint().positive() }),
]);
export type FinanceCommand = z.infer<typeof financeCommandSchema>;
export function resolveFinance(world: World, command: FinanceCommand) {
  const person = active(world); const rule = rules[person.country]; const account = accountFor(world);
  if (command.type === 'borrow') {
    if (ageOn(person, world.date) < rule.adultAge || !person.employment) throw new IneligibleAction('An adult with current employment is required');
    const outstanding = world.liabilities.filter(debt => debt.ownerId === person.id && debt.currency === account.currency && debt.kind === 'personal').reduce((sum, debt) => sum + debt.principal, 0n);
    if (outstanding + command.amount > person.employment.annualPay / 2n) throw new IneligibleAction('Personal borrowing is limited to half your current annual salary');
    borrow(world, command.amount, 'personal', rule.personalInterestBps);
    fact(world, 'I took out a personal loan of ' + formatMoney({ minor: command.amount, currency: account.currency }) + '.', 'finance');
    result(world, 'Loan paid into your account', 'Your cash and debt increased by the same amount. Interest accrues as time passes.', 'money');
  } else {
    const debt = world.liabilities.find(candidate => candidate.id === command.liabilityId && candidate.ownerId === person.id);
    if (!debt || debt.currency !== account.currency) throw new IneligibleAction('Choose one of your debts in this currency');
    if (command.amount > debt.principal) throw new IneligibleAction('The repayment exceeds the outstanding principal');
    if (command.amount > account.cash) throw new IneligibleAction('Your balance cannot cover this repayment');
    debt.principal -= command.amount;
    post(world, -command.amount, -command.amount, 'repayment', 'Debt repayment', debt.id);
    result(world, 'Repayment completed', 'Your cash and outstanding debt both fell by the amount paid.', 'money');
  }
}
export function financeMonth(world: World) {
  const person = active(world); const account = accountFor(world); const rule = rules[person.country];
  for (const debt of world.liabilities.filter(candidate => candidate.ownerId === person.id && candidate.currency === account.currency && candidate.principal > 0n)) {
    const interest = roundRatio(debt.principal * BigInt(debt.interestBps), 120000n);
    if (interest) { debt.principal += interest; post(world, 0n, interest, 'interest', 'Interest added to ' + debt.kind + ' debt', debt.id); }
  }
  if (ageOn(person, world.date) >= rule.adultAge) charge(world, rule.livingCost, 'living', 'Monthly living costs', 'living');
}
export function settleTax(world: World) {
  const person = active(world); const finance = person.finance;
  const due = incomeTax(finance.cycleGross, rules[person.country]);
  const adjustment = due - finance.cycleWithheld;
  if (adjustment > 0n) charge(world, adjustment, 'tax', 'Annual income tax reconciliation', 'tax');
  else if (adjustment < 0n) post(world, -adjustment, 0n, 'tax-refund', 'Annual income tax refund');
  if (finance.cycleGross > 0n) fact(world, 'My income for the year was ' + formatMoney({ minor: finance.cycleGross, currency: accountFor(world).currency }) + '; income tax was ' + formatMoney({ minor: due, currency: accountFor(world).currency }) + '.', 'finance');
  finance.cycleGross = 0n; finance.cycleWithheld = 0n;
}
export function cashNetWorth(world: World): bigint {
  const account = accountFor(world);
  return world.accounts.filter(candidate => candidate.ownerId === world.activePersonId && candidate.currency === account.currency).reduce((sum, candidate) => sum + candidate.cash, 0n) - world.liabilities.filter(debt => debt.ownerId === world.activePersonId && debt.currency === account.currency).reduce((sum, debt) => sum + debt.principal, 0n);
}
