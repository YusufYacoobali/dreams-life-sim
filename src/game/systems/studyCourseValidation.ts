import { compareDates, type World } from '../model';
import { countries } from '../countries';
import type { LedgerIndex } from '../ledgerIndex';
import { courseMonths } from './education';

export function validateStudyCourses(world: World, ledger: LedgerIndex) {
  const ids = new Set<string>(), active = new Set<string>(), receipts = new Set<string>();
  for (const item of world.studyCourses) {
    const person = world.people[item.personId], education = person?.education;
    if (!person || ids.has(item.id) || !item.id.startsWith('study_' + item.personId + '_') || compareDates(item.recorded, person.born) < 0 || item.started && compareDates(item.started, person.born) < 0 || item.ended && compareDates(item.ended, person.born) < 0 || compareDates(item.recorded, world.date) > 0 || item.started && compareDates(item.started, item.recorded) > 0 || item.ended && compareDates(item.ended, item.recorded) !== 0 || item.started && item.ended && compareDates(item.started, item.ended) > 0 || item.months > item.requiredMonths || item.program && item.requiredMonths !== courseMonths(item.program, item.field)) throw new Error('Invalid recorded study course');
    ids.add(item.id);
    if (item.origin === 'legacy-incomplete') {
      if (item.status !== 'observed-incomplete' || item.program || item.started || item.ended || item.firstPayment || item.admissionId || item.country || item.city || item.currency || item.months >= item.requiredMonths) throw new Error('Incomplete legacy observation invents course history');
      continue;
    }
    if (!item.program || item.status === 'observed-incomplete' || (item.status === 'active') !== (item.ended === null)) throw new Error('Recorded course lacks its actual status');
    if (item.status === 'active') {
      if (active.has(person.id) || person.died || education.stage !== item.program || education.field !== item.field || education.school !== item.school || education.months !== item.months || education.requiredMonths !== item.requiredMonths || education.tuition !== item.annualTuition || education.tuitionPaidMonths !== item.tuitionPaidMonths || education.grades !== item.grades || education.funding !== item.funding) throw new Error('Recorded course differs from current study');
      active.add(person.id);
    }
    if (item.status === 'died' && (!person.died || compareDates(item.ended!, person.died) !== 0) || person.died && item.ended && compareDates(item.ended, person.died) > 0) throw new Error('Invalid study ending at death');
    if ((item.status === 'completed' || item.status === 'failed') && (item.months !== item.requiredMonths || (item.status === 'completed') !== (item.grades >= 50))) throw new Error('Recorded course lacks its actual completion');
    if (item.status === 'completed' && !education.qualifications.some(qualification => qualification.level === (item.program === 'university' ? 'degree' : item.program === 'trade' ? 'trade' : item.field) && qualification.field === item.field && qualification.year === item.ended!.year)) throw new Error('Completed recorded course lacks its actual qualification');
    if (item.origin === 'legacy-current') {
      if (item.started || item.firstPayment || item.admissionId || item.country || item.city || item.currency || item.status === 'active') throw new Error('Legacy course invents a past start or payment');
      continue;
    }
    if (!item.started || !item.firstPayment || !item.country || !item.city || !countries[item.country].cities.includes(item.city) || item.currency !== countries[item.country].currency || item.annualTuition <= 0n || item.tuitionPaidMonths < 12) throw new Error('New course lacks its actual start');
    const first = item.firstPayment;
    if (first.billed + first.waived !== item.annualTuition) throw new Error('Recorded study tuition does not reconcile');
    if (item.admissionId) {
      const admission = world.universityApplications.find(candidate => candidate.id === item.admissionId), entry = admission?.enrolment;
      if (!admission || !entry || admission.personId !== item.personId || admission.school !== item.school || admission.field !== item.field || item.program !== 'university' || admission.annualTuition !== item.annualTuition || compareDates(entry.date, item.started) !== 0 || first.transactionId !== entry.transactionId || first.loanTransactionId !== entry.loanTransactionId || first.billed !== entry.billed || first.waived !== entry.waived || first.scholarshipId !== entry.scholarshipId || first.funding !== entry.funding) throw new Error('Recorded study differs from its real admission');
    }
    if (first.scholarshipId) {
      const aid = world.scholarships.find(candidate => candidate.id === first.scholarshipId), period = aid?.periods[0];
      if (!aid || !period || aid.personId !== item.personId || aid.program !== item.program || aid.field !== item.field || aid.country !== item.country || aid.city !== item.city || aid.currency !== item.currency || aid.annualTuition !== item.annualTuition || aid.course?.school !== item.school || compareDates(aid.course.started, item.started) !== 0 || first.transactionId !== period.transactionId || first.loanTransactionId !== period.loanTransactionId || first.billed !== period.billed || first.waived !== period.waived || first.funding !== period.funding) throw new Error('Recorded study differs from its actual aid period');
    } else if (first.waived) throw new Error('Recorded course invents tuition aid');
    if (!first.billed) { if (first.transactionId || first.loanTransactionId) throw new Error('Free recorded tuition cannot invent payment'); continue; }
    const payment = first.transactionId ? ledger.transactions.get(first.transactionId) : undefined;
    if (!payment || receipts.has(payment.id) || payment.personId !== item.personId || payment.currency !== item.currency || payment.category !== 'tuition' || payment.cashDelta !== -first.billed || payment.debtDelta !== 0n || payment.year !== item.started.year || payment.month !== item.started.month) throw new Error('Recorded tuition lacks its real receipt');
    receipts.add(payment.id);
    if (first.funding === 'cash') { if (first.loanTransactionId) throw new Error('Recorded cash tuition invents a loan'); }
    else {
      const loan = first.loanTransactionId ? ledger.transactions.get(first.loanTransactionId) : undefined;
      if (!loan || receipts.has(loan.id) || loan.personId !== item.personId || loan.currency !== item.currency || loan.category !== 'borrowing' || loan.cashDelta !== first.billed || loan.debtDelta !== first.billed || loan.year !== item.started.year || loan.month !== item.started.month || !world.liabilities.some(debt => debt.id === loan.liabilityId && debt.kind === 'student')) throw new Error('Recorded student loan differs from its real bill');
      receipts.add(loan.id);
    }
  }
}
