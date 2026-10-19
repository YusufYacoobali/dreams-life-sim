import type { World } from '../model';
import { ageOn, compareDates } from '../model';
import { countries } from '../countries';
import { destinations } from '../content/travel';
import { jobs } from '../content/jobs';
import { monthFrom } from '../calendar';
import { convertMoney, roundRatio } from '../money';
import { courseMonths } from './education';
import { incomeTax, rules } from '../rules';

export function validateRelocations(world: World) {
  const ids = new Set<string>(), used = new Set<string>(), transactions = new Map(world.ledger.map(item => [item.id, item]));
  for (const application of world.relocations) {
    const person = world.people[application.personId], destination = destinations[application.destinationId], sourceCurrency = countries[application.originCountry].currency, targetCurrency = countries[destination.country].currency;
    if (ids.has(application.id) || !person || ageOn({ ...person, died: null }, application.applied) < 18 || application.originCountry === destination.country || compareDates(application.applied, world.date) > 0 || compareDates(application.expires, monthFrom(application.applied, 12, application.anchorDay)) !== 0 || (application.status === 'declined') !== (application.roll > application.chance) || (application.status === 'moved') !== !!application.move || !world.actionCounts[person.id + ':relocation:' + application.applied.year + ':' + destination.country + ':' + application.route]) throw new Error('Invalid relocation application');
    ids.add(application.id);
    if ((application.route === 'work') !== !!application.job || (application.route === 'study') !== !!application.course || application.job && (!jobs.some(item => item.id === application.job!.roleId && !item.specialCareer && !item.partTime) || application.job.annualPay <= 0n) || application.course && (application.course.requiredMonths !== courseMonths(application.course.program, application.course.field) || application.course.program === 'graduate' && !['medicine', 'law'].includes(application.course.field))) throw new Error('Invalid relocation offer');
    const verify = (id: string, personId: string, amount: bigint, category: string, currency: typeof sourceCurrency, date: World['date']) => {
      const entry = transactions.get(id);
      if (used.has(id) || !entry || entry.personId !== personId || entry.currency !== currency || entry.cashDelta !== amount || entry.debtDelta !== 0n || entry.category !== category || entry.year !== date.year || entry.month !== date.month) throw new Error('Relocation payment does not reconcile to its ledger');
      used.add(id);
    };
    verify(application.applicationTransactionId, person.id, -application.applicationFee, 'relocation-application', sourceCurrency, application.applied);
    if (application.applicationFee !== roundRatio(rules[application.originCountry].baseWage, 200n)) throw new Error('Invalid relocation fee');
    let successful = 0;
    for (const attempt of application.attempts) {
      if (application.status === 'declined' || compareDates(attempt.date, application.applied) < 0 || compareDates(attempt.date, application.expires) >= 0 || compareDates(attempt.date, world.date) > 0 || attempt.participantIds[0] !== person.id || new Set(attempt.participantIds).size !== attempt.participantIds.length || attempt.participantIds.some(id => !world.people[id]) || attempt.accepted !== attempt.consents.every(item => item.accepted)) throw new Error('Invalid relocation party');
      const approvals = new Set<string>();
      for (const consent of attempt.consents) {
        const key = consent.personId + ':' + consent.forPersonId;
        if (approvals.has(key) || !world.people[consent.personId] || !attempt.participantIds.includes(consent.forPersonId) || ageOn({ ...world.people[consent.personId], died: null }, attempt.date) < 18 || consent.accepted !== (consent.roll <= consent.chance)) throw new Error('Invalid relocation consent');
        if (consent.personId !== person.id && !world.actionCounts[person.id + ':move-consent:' + attempt.date.year + ':' + consent.personId + ':' + consent.forPersonId]) throw new Error('Missing relocation consent attempt');
        approvals.add(key);
      }
      if (!attempt.consents.some(item => item.personId === person.id && item.forPersonId === person.id && item.accepted) || attempt.participantIds.some(id => ageOn({ ...world.people[id], died: null }, attempt.date) >= 18 && !approvals.has(id + ':' + id))) throw new Error('Missing adult relocation consent');
      if (attempt.accepted) successful++;
    }
    const move = application.move; if (!move) { if (successful) throw new Error('Accepted relocation party has no move'); continue; }
    const quote = move.quote, finalAttempt = application.attempts.at(-1)!;
    if (successful !== 1 || !finalAttempt.accepted || compareDates(move.date, finalAttempt.date) !== 0 || move.participantIds.join(',') !== finalAttempt.participantIds.join(',') || quote.currency !== sourceCurrency || quote.destinationCurrency !== targetCurrency || quote.reserves.map(item => item.personId).join(',') !== move.participantIds.join(',') || quote.taxes.map(item => item.personId).join(',') !== move.participantIds.join(',') || move.support.map(item => item.personId).join(',') !== move.participantIds.join(',') || quote.tuition !== (application.course?.tuition ?? 0n)) throw new Error('Invalid completed relocation');
    const gross = convertMoney({ minor: quote.sourceDebit, currency: sourceCurrency }, targetCurrency, quote.rate.numerator, quote.rate.denominator).minor, fee = (gross + 99n) / 100n;
    if (sourceCurrency === targetCurrency ? quote.sourceDebit !== 0n || quote.gross !== 0n || quote.fee !== 0n || quote.net !== 0n : quote.gross !== gross || quote.fee !== fee || quote.net !== gross - fee) throw new Error('Relocation FX does not reconcile');
    for (const reserve of quote.reserves) if (reserve.required !== reserve.monthly * BigInt(quote.reserveMonths) + (reserve.personId === person.id ? quote.tuition : 0n) || reserve.personId === person.id && reserve.transfer !== 0n) throw new Error('Invalid relocation reserve');
    for (const tax of quote.taxes) if (tax.currency !== sourceCurrency || tax.adjustment !== incomeTax(tax.gross, rules[application.originCountry]) - tax.withheld) throw new Error('Invalid relocation tax settlement');
    for (const item of move.support) if (item.rate.numerator !== quote.rate.numerator || item.rate.denominator !== quote.rate.denominator || item.after !== convertMoney({ minor: item.before, currency: sourceCurrency }, targetCurrency, item.rate.numerator, item.rate.denominator).minor) throw new Error('Invalid relocation support currency');
    if (new Set(move.transactionIds).size !== move.transactionIds.length || move.transactionIds.some(id => !transactions.has(id))) throw new Error('Invalid relocation transaction list');
    const moveEntries = move.transactionIds.map(id => transactions.get(id)!);
    const payment = (personId: string, amount: bigint, category: string, currency: typeof sourceCurrency) => { const entry = moveEntries.find(item => !used.has(item.id) && item.personId === personId && item.cashDelta === amount && item.category === category && item.currency === currency); if (!entry) throw new Error('Missing relocation payment'); verify(entry.id, personId, amount, category, currency, move.date); };
    payment(person.id, -quote.transport, 'relocation-transport', sourceCurrency);
    for (const tax of quote.taxes.filter(item => item.adjustment !== 0n)) payment(tax.personId, -tax.adjustment, tax.adjustment > 0n ? 'tax' : 'tax-refund', sourceCurrency);
    if (quote.sourceDebit) { payment(person.id, -quote.sourceDebit, 'relocation-exchange', sourceCurrency); payment(person.id, quote.net, 'relocation-exchange', targetCurrency); }
    for (const reserve of quote.reserves.filter(item => item.transfer > 0n)) { payment(person.id, -reserve.transfer, 'relocation-household', targetCurrency); payment(reserve.personId, reserve.transfer, 'relocation-household', targetCurrency); }
    if (quote.tuition) payment(person.id, -quote.tuition, 'tuition', targetCurrency);
    if (moveEntries.some(entry => !used.has(entry.id))) throw new Error('Unexpected relocation payment');
    for (const id of move.employmentIds) { const record = world.workHistory.find(item => item.id === id); if (!record || !move.participantIds.includes(record.personId) || !record.ended || compareDates(record.ended, move.date) !== 0) throw new Error('Relocation retained an old job'); }
    const newJob = world.workHistory.find(item => item.id === move.newEmploymentId);
    if (application.job ? !newJob || newJob.personId !== person.id || newJob.currency !== targetCurrency || newJob.roleId !== application.job.roleId || compareDates(newJob.started, move.date) !== 0 : move.newEmploymentId !== null) throw new Error('Invalid relocation employment');
  }
  for (const entry of world.ledger.filter(item => ['relocation-application', 'relocation-transport', 'relocation-exchange', 'relocation-household'].includes(item.category))) if (!used.has(entry.id)) throw new Error('Unrecorded relocation payment');
}
