import type { World } from '../model';
import type { LedgerIndex } from '../ledgerIndex';
import { ageOn, compareDates } from '../personHelpers';
import { rules } from '../rules';
import { countries } from '../countries';

const monthOf = (date: World['date']) => date.year * 12 + date.month - 1;
const pair = (a: string, b: string) => a < b ? JSON.stringify([a, b]) : JSON.stringify([b, a]);

/** Empty legacy worlds pay no new indexing cost; nonempty records share the ledger index. */
export function validateCampusCommunities(world: World, ledger: LedgerIndex) {
  if (!world.campusCommunities.length) return;
  const courses = new Map(world.studyCourses.map(item => [item.id, item]));
  const accounts = new Map(world.accounts.map(item => [item.id, item]));
  const relationships = new Map<string, World['relationships']>();
  for (const edge of world.relationships) {
    const key = pair(edge.from, edge.to), list = relationships.get(key);
    if (list) list.push(edge); else relationships.set(key, [edge]);
  }
  const work = new Map<string, World['workHistory']>();
  for (const item of world.workHistory) { const list = work.get(item.personId); if (list) list.push(item); else work.set(item.personId, [item]); }
  const peerCourses = new Set(world.campusCommunities.flatMap(item => item.students.map(student => student.courseId)));
  const renewals = new Map<string, World['ledger']>();
  for (const row of ledger.categories('tuition')) {
    if (!row.description.startsWith('Campus tuition: ')) continue;
    const id = row.description.slice('Campus tuition: '.length);
    if (!peerCourses.has(id)) throw new Error('Campus tuition has no recorded peer course');
    const list = renewals.get(id); if (list) list.push(row); else renewals.set(id, [row]);
  }
  const ids = new Set<string>(), ownerCourses = new Set<string>(), students = new Set<string>(), usedCourses = new Set<string>(), usedPayments = new Set<string>();
  for (const community of world.campusCommunities) {
    const person = world.people[community.personId], course = courses.get(community.courseId), startMonth = monthOf(community.started);
    if (!person || !course || course.personId !== person.id || course.origin !== 'enrolment' || !course.started || !course.firstPayment || !course.program ||
      ids.has(community.id) || !community.id.startsWith('campus_' + person.id + '_') || ownerCourses.has(course.id) ||
      compareDates(community.started, course.started) < 0 || compareDates(community.started, world.date) > 0 || course.ended && compareDates(community.started, course.ended) > 0 ||
      person.died && compareDates(community.started, person.died) > 0 || ageOn({ ...person, died: null }, community.started) < Math.max(18, rules[course.country!].adultAge) ||
      community.introducedStudyMonths < 1 || community.introducedStudyMonths >= course.requiredMonths || community.lastStudyMonths < community.introducedStudyMonths ||
      community.lastStudyMonths > course.months) throw new Error('Invalid recorded campus enrolment');
    ids.add(community.id); ownerCourses.add(course.id);
    for (const member of community.students) {
      const peer = world.people[member.personId], enrolment = courses.get(member.courseId);
      if (!peer || member.personId === person.id || students.has(member.personId) || usedCourses.has(member.courseId) || member.courseId === course.id ||
        !enrolment || enrolment.personId !== member.personId || enrolment.origin !== 'enrolment' || !enrolment.started || !enrolment.firstPayment ||
        enrolment.program !== course.program || enrolment.field !== course.field || enrolment.school !== course.school || enrolment.country !== course.country ||
        enrolment.city !== course.city || enrolment.currency !== course.currency || enrolment.annualTuition !== course.annualTuition || enrolment.requiredMonths !== course.requiredMonths ||
        compareDates(enrolment.started, community.started) !== 0 || peer.died && compareDates(peer.died, community.started) < 0 ||
        ageOn({ ...peer, died: null }, community.started) < Math.max(18, rules[course.country!].adultAge, rules[course.country!].schoolEnd + (course.program === 'graduate' ? 4 : 0))) throw new Error('Campus peer differs from its actual funded enrolment');
      students.add(peer.id); usedCourses.add(enrolment.id);
      const secondaryYear = peer.born.year + rules[course.country!].schoolEnd;
      const priorQualifications = peer.education.qualifications.filter(item => item.year <= community.started.year);
      if (!peer.education.qualifications.some(item => item.level === 'secondary' && item.field === 'general' && item.year === secondaryYear) ||
        course.program === 'graduate' && !peer.education.qualifications.some(item => item.level === 'degree' && item.field === 'science' && item.year === secondaryYear + 4 && item.year <= community.started.year) ||
        priorQualifications.length !== (course.program === 'graduate' ? 2 : 1) || priorQualifications.some(item => !(item.level === 'secondary' && item.field === 'general' && item.year === secondaryYear || course.program === 'graduate' && item.level === 'degree' && item.field === 'science' && item.year === secondaryYear + 4)) ||
        (work.get(peer.id) ?? []).some(item => compareDates(item.started, community.started) < 0)) throw new Error('Campus peer invents prior qualifications or employment');
      const edges = relationships.get(pair(person.id, peer.id)), edge = edges?.[0];
      if (edges?.length !== 1 || !edge?.roles.includes('classmate') || compareDates(edge.since, community.started) !== 0 || !edge.memories.includes('campus:' + course.id + ':' + enrolment.id)) throw new Error('Campus peer lacks its actual introduction');
      const first = enrolment.firstPayment, payment = first.transactionId ? ledger.transactions.get(first.transactionId) : undefined;
      const account = payment && accounts.get(payment.accountId);
      if (first.funding !== 'cash' || first.scholarshipId || first.waived !== 0n || first.loanTransactionId || first.billed !== enrolment.annualTuition ||
        !payment || usedPayments.has(payment.id) || payment.personId !== peer.id || payment.currency !== enrolment.currency || payment.category !== 'tuition' ||
        payment.cashDelta !== -enrolment.annualTuition || payment.debtDelta !== 0n || payment.year !== community.started.year || payment.month !== community.started.month ||
        !account || account.ownerId !== peer.id || account.currency !== countries[course.country!].currency ||
        account.openingCash !== enrolment.annualTuition * 2n + rules[course.country!].livingCost * 12n) throw new Error('Campus peer tuition lacks its own actual opening funds and payment');
      usedPayments.add(payment.id);
      const paid = renewals.get(enrolment.id) ?? [];
      if (enrolment.funding !== 'cash' || enrolment.tuitionPaidMonths % 12 !== 0 || paid.length !== enrolment.tuitionPaidMonths / 12 - 1) throw new Error('Campus peer has unrecorded tuition funding');
      let previous = startMonth;
      for (const [index, row] of paid.entries()) {
        const month = row.year * 12 + row.month - 1;
        if (usedPayments.has(row.id) || row.personId !== peer.id || row.accountId !== payment.accountId || row.currency !== enrolment.currency || row.cashDelta !== -enrolment.annualTuition || row.debtDelta !== 0n ||
          month <= previous || month < startMonth + (index + 1) * 12 || month > monthOf(enrolment.recorded) || enrolment.ended && month > monthOf(enrolment.ended)) throw new Error('Invalid actual campus tuition renewal');
        usedPayments.add(row.id); previous = month;
      }
    }
    let previousMonth = startMonth, studyMonth = community.introducedStudyMonths;
    for (const period of community.periods) {
      if (period.studyMonth <= studyMonth || period.studyMonth > community.lastStudyMonths || period.month <= previousMonth || period.month > monthOf(world.date) || course.ended && period.month > monthOf(course.ended) || period.studyMonth > course.requiredMonths) throw new Error('Campus club lacks actual new attended course months');
      if (period.club === 'none' ? period.skillBefore !== null || period.skillAfter !== null || period.skillGain !== 0 || period.energyBefore !== period.energyAfter :
        period.skillBefore === null || period.skillAfter !== Math.min(100, period.skillBefore + 1) || period.skillGain !== period.skillAfter - period.skillBefore || period.energyAfter !== Math.max(0, period.energyBefore - 2)) throw new Error('Campus club effects do not match its recorded attendance');
      previousMonth = period.month; studyMonth = period.studyMonth;
    }
  }
}
