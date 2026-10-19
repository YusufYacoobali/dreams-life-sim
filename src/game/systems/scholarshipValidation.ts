import { ageOn, compareDates, World } from '../model';
import { monthFrom } from '../calendar';
import { countries } from '../countries';
import { rules } from '../rules';
import { courseMonths } from './education';
import { scholarshipPolicies } from './scholarshipSchemas';
import { scholarshipWaiver } from './scholarships';

export function validateScholarships(world: World) {
  const ids = new Set<string>(), open = new Set<string>(), transactions = new Set<string>();
  const month = (date: World['date']) => date.year * 12 + date.month - 1;
  for (const item of world.scholarships) {
    const person = world.people[item.personId], policy = scholarshipPolicies[item.kind];
    if (!person || ids.has(item.id) || !item.id.startsWith('scholarship_' + item.personId + '_') || compareDates(item.applied, world.date) > 0 || ageOn({ ...person, died: null }, item.applied) < rules[item.country].schoolEnd || item.currency !== countries[item.country].currency || item.coverageBps !== policy.coverageBps || item.chance !== policy.chance || item.gradeAtApplication < policy.entryGrade || item.kind === 'access' && item.resourcesAtApplication > item.annualTuition || compareDates(item.expires, monthFrom(item.applied, 12, item.applied.day)) !== 0 || (item.status === 'declined') !== (item.roll > item.chance)) throw new Error('Invalid scholarship application');
    ids.add(item.id);
    if (['offered', 'active'].includes(item.status)) {
      if (open.has(person.id) || item.ended || person.died || person.country !== item.country || person.city !== item.city) throw new Error('Invalid open scholarship');
      open.add(person.id);
      if (item.status === 'offered' && (item.course || item.periods.length || person.education.stage !== 'none' || compareDates(world.date, item.expires) >= 0)) throw new Error('Invalid scholarship offer');
    } else if (!item.ended || compareDates(item.ended, item.applied) < 0 || compareDates(item.ended, world.date) > 0 || person.died && compareDates(item.ended, person.died) > 0) throw new Error('Invalid scholarship ending');
    if (item.status === 'died' && (!person.died || compareDates(item.ended!, person.died) !== 0) || item.status === 'expired' && compareDates(item.ended!, item.expires) < 0 || item.status === 'declined' && compareDates(item.ended!, item.applied) !== 0 || (item.status === 'lost') !== !!item.lossReason || (item.status === 'lost') !== !!item.lossAssessment) throw new Error('Invalid scholarship outcome');
    if (item.lossAssessment) {
      const loss = item.lossAssessment, expected = loss.grades < policy.renewalGrade ? 'grades' : item.kind === 'access' && loss.resources > item.annualTuition ? 'resources' : null;
      if (expected !== item.lossReason || compareDates(loss.date, item.ended!) !== 0 || loss.studyMonth !== item.periods.length * 12 || !item.periods.length || month(loss.date) - month(item.periods.at(-1)!.date) < 12) throw new Error('Invalid scholarship renewal assessment');
    }
    if (!item.course) {
      if (item.periods.length || ['active', 'completed', 'failed', 'lost'].includes(item.status)) throw new Error('Scholarship lacks its course');
      continue;
    }
    const course = item.course;
    if (['offered', 'declined', 'expired'].includes(item.status) || compareDates(course.started, item.applied) < 0 || compareDates(course.started, item.expires) >= 0 || compareDates(course.started, world.date) > 0 || item.ended && compareDates(course.started, item.ended) > 0 || course.requiredMonths !== courseMonths(item.program, item.field) || !item.periods.length || item.periods.length > Math.ceil(course.requiredMonths / 12)) throw new Error('Invalid scholarship course');
    if (item.status === 'active' && (person.education.stage !== item.program || person.education.field !== item.field || person.education.school !== course.school || person.education.requiredMonths !== course.requiredMonths || person.education.tuition !== item.annualTuition || person.education.tuitionPaidMonths !== item.periods.length * 12)) throw new Error('Scholarship differs from active course');
    if (['completed', 'failed'].includes(item.status) && (item.periods.length !== Math.ceil(course.requiredMonths / 12) || month(item.ended!) - month(course.started) < course.requiredMonths)) throw new Error('Scholarship completed without its study duration');
    if (item.status === 'completed' && !person.education.qualifications.some(q => q.level === (item.program === 'university' ? 'degree' : item.program === 'trade' ? 'trade' : item.field) && q.field === item.field && q.year === item.ended!.year)) throw new Error('Completed scholarship lacks its qualification');
    for (let index = 0; index < item.periods.length; index++) {
      const period = item.periods[index], prior = item.periods[index - 1];
      if (period.studyMonth !== index * 12 || period.grossTuition !== item.annualTuition || period.waived !== scholarshipWaiver(item, period.grossTuition) || period.billed + period.waived !== period.grossTuition || period.grades < (index ? policy.renewalGrade : policy.entryGrade) || item.kind === 'access' && period.resources > item.annualTuition || compareDates(period.date, course.started) < 0 || compareDates(period.date, world.date) > 0 || item.ended && compareDates(period.date, item.ended) > 0 || index === 0 && compareDates(period.date, course.started) !== 0 || prior && month(period.date) - month(prior.date) < 12) throw new Error('Invalid scholarship tuition period');
      if (period.billed === 0n) {
        if (period.transactionId || period.loanTransactionId) throw new Error('Full tuition waiver cannot draw or charge cash');
      } else {
        const payment = world.ledger.find(row => row.id === period.transactionId);
        if (!payment || transactions.has(payment.id) || payment.personId !== item.personId || payment.currency !== item.currency || payment.category !== 'tuition' || payment.cashDelta !== -period.billed || payment.debtDelta !== 0n || payment.year !== period.date.year || payment.month !== period.date.month) throw new Error('Scholarship bill does not reconcile with ledger');
        transactions.add(payment.id);
        if (period.funding === 'cash' && period.loanTransactionId) throw new Error('Cash tuition cannot invent a loan');
        if (period.funding === 'loan') {
          const loan = world.ledger.find(row => row.id === period.loanTransactionId);
          if (!loan || transactions.has(loan.id) || loan.personId !== item.personId || loan.currency !== item.currency || loan.category !== 'borrowing' || loan.cashDelta !== period.billed || loan.debtDelta !== period.billed || loan.year !== period.date.year || loan.month !== period.date.month || !world.liabilities.some(debt => debt.id === loan.liabilityId && debt.kind === 'student')) throw new Error('Scholarship loan exceeds its actual bill');
          transactions.add(loan.id);
        }
      }
    }
  }
}
