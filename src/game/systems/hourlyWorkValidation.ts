import { ageOn, compareDates, type World } from '../model';
import { countries } from '../countries';
import { indexLedger } from '../ledgerIndex';
import { roundRatio } from '../money';
import { currentHourlyTerms, hourlyAnnual, hourlyPeriodGross, hourlyQuote, hourlyStudentReason, ordinaryHourlyRole } from './hourlyWork';

export function validateHourlyWork(world: World, ledger = indexLedger(world.ledger)) {
  if (!world.hourlyContracts.length) { if (world.workHistory.some(row => row.hourlyContractId)) throw new Error('Hourly history lacks its reviewed contract'); return; }
  const contracts = new Set<string>(), payments = new Set<string>(), histories = new Map(world.workHistory.map(row => [row.id, row])), raises = new Map(world.workRaises.map(row => [row.id, row]));
  const raisesByContract = new Map<string, World['workRaises']>(), pensionPayments = new Set<string>();
  for (const request of world.workRaises) { const rows = raisesByContract.get(request.employmentId) ?? []; rows.push(request); raisesByContract.set(request.employmentId, rows); }
  for (const person of Object.values(world.people)) for (const receipt of person.finance.pensionReceipts) if (receipt.grossTransactionId) pensionPayments.add(receipt.grossTransactionId);
  for (const contract of world.hourlyContracts) {
    const person = world.people[contract.personId], history = histories.get(contract.employmentId), role = ordinaryHourlyRole(contract.roleId), terms = contract.terms;
    if (contracts.has(contract.employmentId) || !person || !history || !role || history.personId !== person.id || history.hourlyContractId !== contract.employmentId || history.roleId !== role.id || history.companyId || history.currency !== contract.currency || contract.currency !== countries[contract.country].currency || compareDates(contract.started, history.started) !== 0 || terms.hourlyRate !== hourlyQuote(contract.country, role, terms.weeklyHours).hourlyRate || ageOn({ ...person, died: null }, contract.started) < 16) throw new Error('Invalid hourly contract identity or reviewed terms');
    contracts.add(contract.employmentId);
    let rate = terms.hourlyRate, rank = 0, lastPeriod = 0, lastDate = contract.started;
    for (const change of contract.rates) {
      const expected = change.kind === 'raise' ? roundRatio(rate * 10500n, 10000n) : roundRatio(rate * BigInt(100 + (rank + 1) * 25), BigInt(100 + rank * 25));
      if (change.hourlyRateBefore !== rate || change.hourlyRateAfter !== expected || change.hourlyRateAfter <= rate || change.rankBefore !== rank || change.rankAfter !== (change.kind === 'promotion' ? rank + 1 : rank) || change.firstPeriod < lastPeriod || change.firstPeriod > history.monthsWorked || change.firstPeriod < 12 || change.kind === 'promotion' && change.firstPeriod % 12 !== 0 || compareDates(change.date, lastDate) < 0 || compareDates(change.date, history.ended ?? world.date) > 0) throw new Error('Invalid hourly rate change');
      if (change.kind === 'raise') {
        const request = change.raiseId && raises.get(change.raiseId);
        if (!request || !request.accepted || request.employmentId !== contract.employmentId || request.personId !== person.id || request.paidMonths !== change.firstPeriod || compareDates(request.date, change.date) !== 0 || !request.hourly || request.hourly.hourlyRateBefore !== rate || request.hourly.hourlyRateAfter !== expected || request.hourly.weeklyHours !== terms.weeklyHours || request.hourly.paidWeeks !== terms.paidWeeks) throw new Error('Hourly rate change lacks its actual raise');
      } else if (change.raiseId) throw new Error('Hourly promotion cannot claim a raise request');
      rate = change.hourlyRateAfter; rank = change.rankAfter; lastPeriod = change.firstPeriod; lastDate = change.date;
    }
    for (const request of raisesByContract.get(contract.employmentId) ?? []) {
      let beforeRate = terms.hourlyRate;
      for (const change of contract.rates) if (change.raiseId !== request.id && change.firstPeriod <= request.paidMonths && compareDates(change.date, request.date) <= 0) beforeRate = change.hourlyRateAfter;
      const changes = contract.rates.filter(change => change.raiseId === request.id);
      if (!request.hourly || request.hourly.weeklyHours !== terms.weeklyHours || request.hourly.paidWeeks !== terms.paidWeeks || request.hourly.hourlyRateBefore !== beforeRate || changes.length !== (request.accepted ? 1 : 0) || request.annualPayBefore !== hourlyAnnual({ ...terms, hourlyRate: beforeRate })) throw new Error('Hourly raise does not bind its actual contract and rate');
    }
    let period = 0, gross = 0n, changeIndex = 0, periodRate = terms.hourlyRate; lastDate = contract.started;
    for (const row of contract.periods) {
      while (changeIndex < contract.rates.length && contract.rates[changeIndex].firstPeriod <= period) periodRate = contract.rates[changeIndex++].hourlyRateAfter;
      const nextChange = contract.rates[changeIndex], expectedGross = hourlyPeriodGross({ ...terms, hourlyRate: periodRate }, period, row.periods, row.factorBps), paidMinutes = terms.weeklyHours * terms.paidWeeks * 5 * row.periods * row.factorBps / 10000;
      if (period + row.periods > (row.date.year - contract.started.year) * 12 + row.date.month - contract.started.month || row.firstPeriod !== period || row.hourlyRate !== periodRate || nextChange && nextChange.firstPeriod < period + row.periods || compareDates(row.date, lastDate) < 0 || compareDates(row.date, history.ended ?? world.date) > 0 || row.gross !== expectedGross || row.paidMinutes !== paidMinutes || row.workedMinutes !== (row.attendance === 'worked' || row.attendance === 'background' ? paidMinutes : 0) || row.factorBps !== (row.attendance === 'hospital' ? 5000 : 10000) || row.attendance !== 'background' && row.periods !== 1) throw new Error('Invalid actual hourly pay or time');
      const receipt = row.transactionId && ledger.transactions.get(row.transactionId);
      if (row.gross === 0n ? !!row.transactionId : !receipt || payments.has(receipt.id) || pensionPayments.has(receipt.id) || receipt.description !== (row.attendance === 'background' ? 'Recorded hourly employment pay for ' + row.periods + ' months' : 'Hourly employment pay') || receipt.personId !== person.id || receipt.currency !== contract.currency || receipt.cashDelta !== row.gross || receipt.debtDelta !== 0n || receipt.category !== (row.attendance === 'background' ? 'background-income' : 'income') || receipt.year !== row.date.year || receipt.month !== row.date.month) throw new Error('Hourly payment does not reconcile with its actual ledger receipt');
      if (receipt) payments.add(receipt.id);
      period += row.periods; gross += row.gross; lastDate = row.date;
    }
    if (period !== history.monthsWorked || gross !== history.grossEarned || person.employment?.id === contract.employmentId && (person.employment.companyId || person.employment.annualPay !== hourlyAnnual(currentHourlyTerms(contract)) || person.employment.paidMonths !== period || person.employment.rank !== rank || !!hourlyStudentReason(world, terms.weeklyHours, person))) throw new Error('Hourly history differs from actual employment');
  }
  for (const history of world.workHistory) if (history.hourlyContractId && (!contracts.has(history.hourlyContractId) || history.hourlyContractId !== history.id)) throw new Error('Hourly history lacks its reviewed contract');
}
