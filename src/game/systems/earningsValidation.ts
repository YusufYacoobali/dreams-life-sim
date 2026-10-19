import { indexLedger } from '../ledgerIndex';
import type { World } from '../model';
import { convertMoney, roundRatio } from '../money';

export function validateEarnings(world: World, ledger = indexLedger(world.ledger)) {
  const month = world.date.year * 12 + world.date.month - 1, transactions = ledger.transactions, used = new Set<string>();
  for (const record of world.workHistory) {
    const person = world.people[record.personId], start = record.started.year * 12 + record.started.month - 1;
    if (record.currency === person.finance.earningsCurrency) {
      if (record.conversions.length || record.normalizedGross !== record.grossEarned) throw new Error('Invalid native earnings valuation');
    } else {
      let native = 0n, reference = 0n;
      for (const receipt of record.conversions) {
        if (receipt.month < start || receipt.month > month || receipt.reference !== convertMoney({ minor: receipt.native, currency: record.currency }, person.finance.earningsCurrency, receipt.rate.numerator, receipt.rate.denominator).minor) throw new Error('Invalid historical earnings exchange quote');
        native += receipt.native; reference += receipt.reference;
      }
      if (native !== record.grossEarned || reference !== record.normalizedGross) throw new Error('Foreign employment receipts do not reconcile');
    }
  }
  for (const person of Object.values(world.people)) {
    const finance = person.finance; let period = finance.pensionRecordedFrom;
    for (const receipt of finance.pensionReceipts) {
      const native = roundRatio(receipt.annualPay * BigInt(receipt.firstPeriod + receipt.periods), 12n) - roundRatio(receipt.annualPay * BigInt(receipt.firstPeriod), 12n);
      const gross = convertMoney({ minor: native, currency: receipt.sourceCurrency }, receipt.currency, receipt.rate.numerator, receipt.rate.denominator).minor;
      const fee = receipt.sourceCurrency === receipt.currency ? 0n : (gross + 99n) / 100n;
      if (receipt.firstPeriod !== period || receipt.sourceCurrency !== finance.earningsCurrency || receipt.month > month || receipt.month < person.born.year * 12 + person.born.month - 1 || receipt.nativeGross !== native || receipt.gross !== gross || receipt.fee !== fee || receipt.withheld > gross - fee || receipt.sourceCurrency === receipt.currency && (receipt.rate.numerator !== 1n || receipt.rate.denominator !== 1n)) throw new Error('Invalid pension payment or exchange quote');
      for (const [id, amount, category] of [[receipt.grossTransactionId, receipt.gross, 'income'], [receipt.feeTransactionId, -receipt.fee, 'pension-exchange-fee'], [receipt.taxTransactionId, -receipt.withheld, 'tax']] as const) {
        const transaction = id && transactions.get(id);
        if (amount === 0n ? id !== null : !id || used.has(id) || !transaction || transaction.personId !== person.id || transaction.currency !== receipt.currency || transaction.cashDelta !== amount || transaction.debtDelta !== 0n || transaction.year * 12 + transaction.month - 1 !== receipt.month || transaction.category !== category && !(category === 'income' && transaction.category === 'background-income')) throw new Error('Pension payment does not reconcile to its ledger');
        if (id) used.add(id);
      }
      period += receipt.periods;
    }
    if (period !== finance.pensionMonths) throw new Error('Pension service periods do not reconcile');
  }
}
