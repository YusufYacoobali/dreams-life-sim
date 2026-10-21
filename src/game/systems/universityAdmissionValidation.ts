import { ageOn, compareDates, type World } from '../model';
import { monthFrom } from '../calendar';
import { countries } from '../countries';
import type { LedgerIndex } from '../ledgerIndex';
import { rules } from '../rules';
import { admissionAttemptKey, admissionChance, initialAdmissionStatus, universityTuitionV1, type UniversityApplication } from './universityAdmissionSchemas';
import { scholarshipWaiver } from './scholarships';

export function validateUniversityAdmissions(world: World, ledger: LedgerIndex) {
  const ids = new Set<string>(), open = new Set<string>(), payments = new Set<string>();
  const same = (a: World['date'] | null, b: World['date'] | null) => a === null || b === null ? a === b : compareDates(a, b) === 0;
  const terminal = (status: UniversityApplication['status']) => status !== 'accepted' && status !== 'waitlisted';
  for (const item of world.universityApplications) {
    const person = world.people[item.personId], first = item.transitions[0], last = item.transitions.at(-1)!;
    if (!person || ids.has(item.id) || !item.id.startsWith('admission_' + item.personId + '_') || compareDates(item.applied, world.date) > 0 || ageOn({ ...person, died: null }, item.applied) < rules[item.country].schoolEnd || !countries[item.country].cities.includes(item.city) || item.currency !== countries[item.country].currency || item.annualTuition !== universityTuitionV1[item.country] || item.school !== item.city + ' University' || item.grades < 55 || item.chance !== admissionChance(item.grades, item.smarts) || !world.actionCounts[admissionAttemptKey(item.personId, item.applied.year, item.field)] || first.status !== initialAdmissionStatus(item.roll, item.chance) || !same(first.date, item.applied) || last.status !== item.status) throw new Error('Invalid university application');
    ids.add(item.id);
    for (let index = 0; index < item.transitions.length; index++) {
      const step = item.transitions[index], prior = item.transitions[index - 1];
      if (compareDates(step.date, world.date) > 0 || compareDates(step.date, item.applied) < 0 || prior && (compareDates(step.date, prior.date) < 0 || terminal(prior.status) || step.status === 'waitlisted' || step.status === prior.status || prior.status === 'accepted' && (step.status === 'accepted' || step.status === 'rejected') || prior.status === 'waitlisted' && (step.status === 'enrolled' || step.status === 'expired'))) throw new Error('Invalid university application transition');
    }
    if (terminal(item.status) ? !same(item.ended, last.date) : item.ended !== null) throw new Error('Invalid university application ending');
    if (item.status === 'died' && !same(item.ended, person.died) || person.died && item.ended && compareDates(item.ended, person.died) > 0) throw new Error('Invalid university death ending');
    const beganWaitlisted = first.status === 'waitlisted', reviewed = item.transitions[1]?.status === 'accepted' || item.transitions[1]?.status === 'rejected';
    if (beganWaitlisted ? !same(item.reviewDue, monthFrom(item.applied, 1)) : item.reviewDue !== null || item.review !== null) throw new Error('Invalid university waitlist date');
    if (beganWaitlisted && reviewed !== !!item.review) throw new Error('University waitlist lacks its actual review');
    if (item.review) {
      const assessment = item.review, expected = item.roll <= item.chance && assessment.grades >= 55 && assessment.secondaryQualified ? 'accepted' : 'rejected';
      if (!same(assessment.date, item.transitions[1].date) || compareDates(assessment.date, item.reviewDue!) < 0 || item.transitions[1].status !== expected) throw new Error('Invalid university waitlist outcome');
    }
    const offer = item.transitions.find(step => step.status === 'accepted');
    if (offer ? !same(item.offered, offer.date) || !same(item.expires, monthFrom(offer.date, 12)) : item.offered !== null || item.expires !== null) throw new Error('Invalid university offer');
    if (item.status === 'expired' && (!item.expires || compareDates(item.ended!, item.expires) < 0)) throw new Error('Invalid expired university offer');
    if (!terminal(item.status)) {
      if (open.has(person.id) || person.died || person.country !== item.country || person.city !== item.city || person.education.stage !== 'none' || item.status === 'accepted' && (!item.expires || compareDates(world.date, item.expires) >= 0)) throw new Error('Invalid open university application');
      open.add(person.id);
    }
    if ((item.status === 'enrolled') !== !!item.enrolment) throw new Error('University admission lacks its actual enrolment');
    if (!item.enrolment) continue;
    const entry = item.enrolment;
    if (!offer || !same(entry.date, item.ended) || compareDates(entry.date, offer.date) < 0 || compareDates(entry.date, item.expires!) >= 0 || entry.billed + entry.waived !== item.annualTuition) throw new Error('Invalid university enrolment');
    if (entry.scholarshipId) {
      const aid = world.scholarships.find(candidate => candidate.id === entry.scholarshipId);
      if (!aid || aid.personId !== item.personId || aid.program !== 'university' || aid.field !== item.field || aid.country !== item.country || aid.city !== item.city || aid.annualTuition !== item.annualTuition || entry.waived !== scholarshipWaiver(aid, item.annualTuition) || !aid.course || !same(aid.course.started, entry.date) || aid.course.school !== item.school || aid.periods[0]?.transactionId !== entry.transactionId || aid.periods[0]?.loanTransactionId !== entry.loanTransactionId) throw new Error('University admission aid differs from its real tuition period');
    } else if (entry.waived !== 0n) throw new Error('University admission cannot invent tuition aid');
    if (!entry.billed) {
      if (entry.transactionId || entry.loanTransactionId || entry.loanInterestBps !== null) throw new Error('Full tuition waiver cannot draw a loan or charge cash');
      continue;
    }
    const payment = entry.transactionId ? ledger.transactions.get(entry.transactionId) : undefined;
    if (!payment || payments.has(payment.id) || payment.personId !== item.personId || payment.currency !== item.currency || payment.category !== 'tuition' || payment.cashDelta !== -entry.billed || payment.debtDelta !== 0n || payment.year !== entry.date.year || payment.month !== entry.date.month) throw new Error('University tuition lacks its real receipt');
    payments.add(payment.id);
    if (entry.funding === 'cash') {
      if (entry.loanTransactionId || entry.loanInterestBps !== null) throw new Error('Cash tuition cannot invent a loan');
    } else {
      const loan = entry.loanTransactionId ? ledger.transactions.get(entry.loanTransactionId) : undefined, debt = loan ? world.liabilities.find(candidate => candidate.id === loan.liabilityId) : undefined;
      if (!loan || payments.has(loan.id) || loan.personId !== item.personId || loan.currency !== item.currency || loan.category !== 'borrowing' || loan.cashDelta !== entry.billed || loan.debtDelta !== entry.billed || loan.year !== entry.date.year || loan.month !== entry.date.month || debt?.kind !== 'student' || debt.id !== 'debt_student_' + item.personId + '_' + item.currency || entry.loanInterestBps !== debt.interestBps) throw new Error('University loan differs from its real bill');
      payments.add(loan.id);
    }
  }
}
