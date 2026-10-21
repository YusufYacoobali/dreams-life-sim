import type { World } from '../model';
import { jobs, type JobRole } from '../content/jobs';

const monthOf = (date: { year: number; month: number }) => date.year * 12 + date.month - 1;
const roles = new Map(jobs.map(role => [role.id, role]));

/** Authored V1: one point per six evidenced paid calendar months, at most five.
 * Missing/ambiguous old evidence grants nothing. No money or elapsed dates become service.
 */
export function paidInterviewExperience(world: World, target: JobRole, personId = world.activePersonId) {
  if (target.specialCareer) return { paidMonths: 0, bonus: 0 };
  const history = world.workHistory.filter(row => row.personId === personId);
  const histories = new Map(history.map(row => [row.id, row]));
  const receipts = new Map(world.ledger.map(row => [row.id, row]));
  const relevant = (row: World['workHistory'][number]) => {
    const role = roles.get(row.roleId);
    return !row.companyId && row.monthsWorked > 0 && row.grossEarned > 0n && role && !role.specialCareer && role.sector === target.sector;
  };
  const months = new Set<number>(), now = monthOf(world.date);
  // Hourly periods identify their real gross receipt and attendance exactly.
  for (const contract of world.hourlyContracts) {
    const row = histories.get(contract.employmentId);
    if (contract.personId !== personId || !row || row.hourlyContractId !== contract.employmentId || row.roleId !== contract.roleId || row.currency !== contract.currency || !relevant(row)) continue;
    for (const period of contract.periods) {
      const receipt = period.transactionId ? receipts.get(period.transactionId) : undefined, month = monthOf(period.date);
      if (period.attendance !== 'worked' || period.periods !== 1 || period.workedMinutes <= 0 || period.gross <= 0n || month > now || month <= monthOf(row.started) || month > monthOf(row.ended ?? world.date) ||
        !receipt || receipt.personId !== personId || receipt.currency !== row.currency || receipt.category !== 'income' || receipt.description !== 'Hourly employment pay' || receipt.cashDelta !== period.gross || receipt.debtDelta !== 0n || monthOf(receipt) !== month) continue;
      months.add(month);
    }
  }
  // A salaried receipt does not identify a contract. Use it only if ALL of this
  // person's histories make its currency/month unambiguous, before relevance filtering.
  const salaryMonths = new Map<string, Set<number>>(), salaryGross = new Map<string, bigint>();
  for (const receipt of world.ledger) {
    if (receipt.personId !== personId || receipt.category !== 'income' || receipt.description !== 'Employment pay' || receipt.cashDelta <= 0n || receipt.debtDelta !== 0n) continue;
    const month = monthOf(receipt);
    if (month > now) continue;
    const candidates = history.filter(row => row.currency === receipt.currency && month >= monthOf(row.started) && month <= monthOf(row.ended ?? world.date));
    if (candidates.length !== 1) continue;
    const row = candidates[0];
    if (row.hourlyContractId || !relevant(row) || month <= monthOf(row.started)) continue;
    const paid = salaryMonths.get(row.id) ?? new Set<number>(); paid.add(month); salaryMonths.set(row.id, paid);
    salaryGross.set(row.id, (salaryGross.get(row.id) ?? 0n) + receipt.cashDelta);
  }
  for (const [id, paid] of salaryMonths) {
    const row = histories.get(id)!;
    if (paid.size > row.monthsWorked || salaryGross.get(id)! > row.grossEarned) continue;
    for (const month of paid) months.add(month);
  }
  const paidMonths = Math.min(30, months.size);
  return { paidMonths, bonus: Math.floor(paidMonths / 6) };
}

export function interviewExperienceCopy(sector: string, experience: ReturnType<typeof paidInterviewExperience>) {
  return 'Your application includes ' + (experience.paidMonths === 30 ? 'at least 30' : experience.paidMonths) + ' recorded paid month' + (experience.paidMonths === 1 ? '' : 's') + ' in ' + sector + '. ' + (experience.bonus ? 'Experience can add up to ' + experience.bonus + ' percentage point' + (experience.bonus === 1 ? '' : 's') + ' to your interview chances, within the usual limits. ' : 'No experience bonus applies. ');
}
