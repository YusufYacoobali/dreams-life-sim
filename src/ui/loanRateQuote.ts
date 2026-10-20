import type { World } from '../game/model';
import { rules } from '../game/rules';
import { accountFor } from '../game/systems/common';

/** Match common.borrow's per-person, per-kind, per-currency loan line,
 * including a repaid line: drawing again preserves its original rate. */
export function loanRateQuote(world: World, kind: 'student' | 'personal') {
  const person = world.people[world.activePersonId], account = accountFor(world);
  const existing = world.liabilities.find(item => item.id === 'debt_' + kind + '_' + person.id + '_' + account.currency);
  const rule = rules[person.country];
  return { existing: !!existing, interestBps: existing?.interestBps ?? (kind === 'student' ? rule.studentInterestBps : rule.personalInterestBps) };
}
