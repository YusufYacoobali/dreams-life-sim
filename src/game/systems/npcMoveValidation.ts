import { ageOn, compareDates } from '../personHelpers';
import type { GameDate, World } from '../model';
import { indexLedger, type LedgerIndex } from '../ledgerIndex';
import { npcMoveAttemptKey, npcMoveDestinationV1, npcMoveRulesV1, npcMoveTaxV1 } from './npcMoveSchemas';

/** Historical budgets use one forward prefix sweep, never today's balances or
 * household membership. Completed old pensions/relations remain the evidence. */
export function validateNpcMoves(world: World, ledger: LedgerIndex = indexLedger(world.ledger)): void {
  const counters = Object.keys(world.actionCounts).filter(key => key.startsWith('npc-move:')), movingPayments = ledger.categories('npc-moving');
  if (!world.npcMoves.length) { if (counters.length || movingPayments.length) throw new Error('NPC move has no recorded attempt'); return; }
  const accounts = new Map(world.accounts.map(row => [row.id, row])), relations = new Map(world.relationships.map(row => [row.id, row])), journals = new Map(world.journal.map(row => [row.id, row]));
  const observers = new Map<string, { from: GameDate; through: GameDate }>();
  let actorId = world.legacies[0]?.fromId ?? world.activePersonId, from = world.people[actorId].born;
  for (const legacy of world.legacies) { observers.set(actorId, { from, through: legacy.date }); actorId = legacy.toId; from = legacy.date; }
  observers.set(actorId, { from, through: world.date });
  const pensionByPerson = new Map<string, { position: number; periods: number; id: string; month: number; currency: string; gross: bigint; withheld: bigint; regular: boolean }[]>();
  for (const personId of new Set(world.npcMoves.map(row => row.personId))) {
    const person = world.people[personId];
    if (!person) throw new Error('NPC move pension owner is missing');
    const payments: { position: number; periods: number; id: string; month: number; currency: string; gross: bigint; withheld: bigint; regular: boolean }[] = [];
    for (const receipt of person.finance.pensionReceipts) if (receipt.gross > 0n && receipt.grossTransactionId) {
      const transaction = ledger.positioned.get(receipt.grossTransactionId);
      if (!transaction) throw new Error('NPC move pension receipt is missing');
      payments.push({ position: transaction.index, periods: receipt.periods, id: receipt.grossTransactionId, month: receipt.month, currency: receipt.currency, gross: receipt.gross, withheld: receipt.withheld, regular: transaction.row.category === 'income' });
    }
    payments.sort((a, b) => a.position - b.position);
    let periods = 0; for (const payment of payments) { periods += payment.periods; payment.periods = periods; }
    pensionByPerson.set(person.id, payments);
  }
  const ids = new Set<string>(), keys = new Set<string>(), moved = new Set<string>(), usedPayments = new Set<string>(), prefix = new Map<string, bigint>();
  let cursor = 0, previousDate = world.npcMoves[0].date;
  for (const row of world.npcMoves) {
    const person = world.people[row.personId], observer = world.people[row.observerId], period = observers.get(row.observerId), relation = relations.get(row.relationshipId), account = accounts.get(row.accountId), rule = npcMoveRulesV1[row.country], key = npcMoveAttemptKey(row.date.year), month = row.date.year * 12 + row.date.month - 1;
    if (!person || !observer || person.id === observer.id || !period || compareDates(row.date, period.from) < 0 || compareDates(row.date, period.through) > 0 || ids.has(row.id) || row.id !== 'npc_move_' + row.revision + '_' + ids.size || row.revision > world.revision || !relation || !([relation.from, relation.to].includes(person.id) && [relation.from, relation.to].includes(observer.id)) || compareDates(relation.since, row.date) > 0) throw new Error('Invalid NPC move identity or observer');
    if (compareDates(row.date, previousDate) < 0 || compareDates(row.date, world.date) > 0 || keys.has(key) || world.actionCounts[key] !== 1 || moved.has(person.id) || row.ledgerCursor < cursor || row.ledgerCursor > world.ledger.length) throw new Error('Invalid NPC move time or repeated opportunity');
    for (const participant of [person, observer]) if (compareDates(participant.born, row.date) > 0 || participant.died && compareDates(row.date, participant.died) > 0) throw new Error('NPC move participants were not alive');
    if (ageOn({ ...person, died: null }, row.date) < rule.retirementAge || !rule.cities.includes(row.originCity) || row.destinationCity !== npcMoveDestinationV1(row.country, row.originCity, row.date.year) || row.currency !== rule.currency || row.settledThroughMonth !== month || row.chance !== 20 || (row.outcome === 'moved') !== (row.roll <= row.chance)) throw new Error('Invalid NPC move V1 terms or outcome');
    if (!row.householdId || new Set(row.householdMembers).size !== row.householdMembers.length || !row.householdMembers.includes(person.id)) throw new Error('Invalid NPC move household snapshot');
    for (const id of row.householdMembers) {
      const member = world.people[id];
      if (!member || compareDates(member.born, row.date) > 0 || id !== person.id && (!member.died || compareDates(member.died, row.date) > 0)) throw new Error('NPC move cannot carry another living household member');
    }
    if (!account || account.ownerId !== person.id || account.currency !== row.currency || row.lockedCashBefore !== 0n || row.availableBefore !== row.cashBefore || row.movingCost !== rule.fee || row.monthlyLiving !== rule.living || row.reserveMonths !== 3 || row.reserveRequired !== rule.living * 3n || row.availableBefore < row.movingCost + row.reserveRequired) throw new Error('Invalid NPC move affordability or cost');
    while (cursor < row.ledgerCursor) { const transaction = world.ledger[cursor++]; prefix.set(transaction.accountId, (prefix.get(transaction.accountId) ?? 0n) + transaction.cashDelta); }
    if (account.openingCash + (prefix.get(account.id) ?? 0n) !== row.cashBefore) throw new Error('NPC move cash differs from its actual ledger prefix');
    const tax = row.tax, adjustment = tax.due - tax.withheld;
    if (tax.personId !== person.id || tax.accountId !== account.id || tax.country !== row.country || tax.currency !== row.currency || tax.month !== month || tax.gross < 0n || tax.withheld < 0n || tax.due !== npcMoveTaxV1(tax.gross, row.country) || tax.ledgerStart > tax.ledgerEnd || tax.ledgerEnd > row.ledgerCursor || tax.ledgerEnd - tax.ledgerStart !== (adjustment === 0n ? 0 : 1)) throw new Error('NPC move requires actual annual tax settlement');
    if (adjustment === 0n) { if (tax.paymentId !== null) throw new Error('Zero NPC move tax has no payment'); }
    else {
      const payment = tax.paymentId ? ledger.positioned.get(tax.paymentId) : undefined;
      if (!payment || payment.index !== tax.ledgerStart || payment.row.personId !== person.id || payment.row.accountId !== account.id || payment.row.year !== row.date.year || payment.row.month !== row.date.month || payment.row.currency !== row.currency || payment.row.cashDelta !== -adjustment || payment.row.debtDelta !== 0n || payment.row.liabilityId !== null || payment.row.category !== (adjustment > 0n ? 'tax' : 'tax-refund') || payment.row.description !== (adjustment > 0n ? 'Annual income tax reconciliation' : 'Annual income tax refund')) throw new Error('NPC move tax settlement receipt differs');
    }
    const payments = pensionByPerson.get(person.id)!;
    // Prefix positions are sorted independently of mutable receipt-array order.
    let low = 0, high = payments.length;
    while (low < high) { const middle = (low + high) >>> 1; if (payments[middle].position < tax.ledgerStart) low = middle + 1; else high = middle; }
    const pension = payments[low - 1];
    if (!pension || pension.id !== row.pensionTransactionId || pension.month !== month || pension.currency !== row.currency || pension.periods !== row.recordedPaidPeriods || pension.periods < 12 || !pension.regular || tax.gross < pension.gross || tax.withheld < pension.withheld) throw new Error('NPC move requires twelve actually paid pension periods and current regular receipt');
    const journal = tax.journalId ? journals.get(tax.journalId) : undefined;
    if (!journal || tax.journalIndex === null || world.journal[tax.journalIndex] !== journal || journal.id !== 'fact_' + row.revision + '_' + tax.journalIndex || journal.personId !== person.id || journal.category !== 'finance' || compareDates(journal.date, row.date) !== 0 || tax.journalText === null || journal.text !== tax.journalText) throw new Error('NPC move requires its actual original tax settlement journal');
    if (row.outcome === 'moved') {
      const payment = row.paymentId ? ledger.positioned.get(row.paymentId) : undefined;
      if (!payment || payment.index !== row.ledgerCursor || usedPayments.has(payment.row.id) || payment.row.personId !== person.id || payment.row.accountId !== account.id || payment.row.currency !== row.currency || payment.row.year !== row.date.year || payment.row.month !== row.date.month || payment.row.cashDelta !== -row.movingCost || payment.row.debtDelta !== 0n || payment.row.liabilityId !== null || payment.row.category !== 'npc-moving' || payment.row.description !== 'Domestic retirement move from ' + row.originCity + ' to ' + row.destinationCity) throw new Error('NPC move requires its exact once-only moving payment');
      usedPayments.add(payment.row.id); moved.add(person.id);
    } else if (row.paymentId !== null) throw new Error('Stayed NPC move has no moving payment');
    ids.add(row.id); keys.add(key); previousDate = row.date;
  }
  if (counters.some(key => !keys.has(key)) || movingPayments.some(row => !usedPayments.has(row.id))) throw new Error('NPC move counter/payment lacks its actual attempt');
}
