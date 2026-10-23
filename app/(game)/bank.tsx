import { personalBorrowReason,personalLoanCapacity } from '../../src/game/systems/credit';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { Currency, currencyDigits, formatMoney, parseMoney } from '../../src/game/money';
import { accountFor, availableCash } from '../../src/game/systems/common';
import { cashNetWorth, exchangeQuote, FinanceCommand } from '../../src/game/systems/finance';
import { rules } from '../../src/game/rules';
import { loanRateQuote } from '../../src/ui/loanRateQuote';
import { ageOn } from '../../src/game/model';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { useColors } from '../../src/ui/theme';

type Quote = FinanceCommand;
import { isConfined } from '../../src/game/systems/legalSchemas';
import { FinanceArt } from '../../src/assets/FinanceArt';
export default function Bank() {
  const identity = useGame(state => state.world ? state.world.id + ':' + state.world.activePersonId : 'none');
  return <BankDetails key={identity} />;
}

function BankDetails() {
  const world = useGame(s => s.world)!; const dispatch = useGame(s => s.dispatch); const busy = useGame(s => s.busy); const error = useGame(s => s.error); const c = useColors();
  const person = world.people[world.activePersonId]; const home = accountFor(world); const credit=personalLoanCapacity(world);const rule = rules[person.country];
  const debts = world.liabilities.filter(debt => debt.ownerId === person.id && debt.principal > 0n);
  const transactions = world.ledger.filter(entry => entry.personId === person.id).slice(-30).reverse();
  const [input, setInput] = useState(''); const [message, setMessage] = useState<string | null>(null); const [quote, setQuote] = useState<Quote | null>(null);
  const [repaying, setRepaying] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null); const [target, setTarget] = useState<Currency>(home.currency === 'USD' ? 'EUR' : 'USD'); const [choosing, setChoosing] = useState<'source' | 'target' | null>(null);
  const account = accountFor(world, person, selectedCurrency ?? home.currency);
  const money = (minor: bigint) => formatMoney({ minor, currency: account.currency });
  const amount = (): bigint | null => { try { const value = parseMoney(input, account.currency).minor; if (value <= 0n) throw new Error(); setMessage(null); return value; } catch { setMessage('Enter a positive amount in ' + account.currency + '.'); return null; } };
  const currencyEvent: EventPresentation | null = choosing ? { id: 'bank-currency:' + choosing, kind: 'selection', title: choosing === 'source' ? 'Choose an account' : 'Exchange into', body: 'Balances are kept separately for each currency.', choices: (choosing === 'source' ? world.accounts.filter(item => item.ownerId === person.id).map(item => item.currency) : Object.keys(currencyDigits) as Currency[]).map(id => ({ id, label: id, disabledReason: choosing === 'target' && id === account.currency ? 'Choose a different currency' : undefined })), confirmLabel: 'Choose' } : null;
  const event: EventPresentation | null = quote?.type === 'exchange' ? { id: 'exchange-confirm', kind: 'confirmation', title: 'Exchange currencies?', body: 'Exchange from this account. The amount you receive includes the fee deduction.', terms: [{ id: 'source', label: 'From', value: formatMoney({ minor: quote.amount, currency: quote.from }), tone: 'negative' }, { id: 'fee', label: 'Exchange fee', value: formatMoney({ minor: exchangeQuote(world, quote.amount, quote.from, quote.to).fee, currency: quote.to }), tone: 'negative' }, { id: 'net', label: 'Receive', value: formatMoney({ minor: quote.quotedNet, currency: quote.to }), tone: 'positive' }], confirmLabel: 'Exchange' } : quote ? { id: quote.type + ':' + (quote.type === 'repay' ? quote.liabilityId : 'personal'), kind: 'confirmation', title: quote.type === 'borrow' ? 'Take out this loan?' : 'Make this repayment?', body: quote.type === 'borrow' ? 'Your cash and debt will both increase. Interest is added monthly until repayment.' : 'Your cash and outstanding debt will both fall by the amount paid.', terms: [{ id: 'amount', label: 'Amount', value: money(quote.amount), tone: 'neutral' }, ...(quote.type === 'borrow' ? [{ id: 'interest', label: 'Annual interest', value: loanRateQuote(world, 'personal').interestBps / 100 + '%', tone: 'neutral' as const }] : [])], confirmLabel: quote.type === 'borrow' ? 'Accept Loan' : 'Repay' } : currencyEvent;
  const repaymentDebt = world.liabilities.find(debt => debt.id === repaying && debt.ownerId === person.id);
  if (repaymentDebt) return <DebtRepayment key={JSON.stringify([world.id, person.id, repaymentDebt.id])} debtId={repaymentDebt.id} onClose={() => setRepaying(null)} />;
  return <Page><Header title="Bank & Loans" onBack={() => router.back()} /><Card><ActionRow disabled={busy} title="Currency Account" value={account.currency} onPress={() => { Keyboard.dismiss(); setChoosing('source'); }} /><Body muted>Available balance</Body><Heading size={30}>{money(availableCash(account))}</Heading>{account.lockedCash > 0n && <Body>Inheritance held in trust: {money(account.lockedCash)}. It becomes available at age {rule.adultAge}; necessary inherited-property costs may use it.</Body>}<Body>Cash less debt: {money(cashNetWorth(world, account.currency))}</Body></Card>
    {(message || error) && !quote && !choosing && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{message ?? error}</Text>}
    <Card><Heading size={18}>Personal loans</Heading><Body>Loan or exchange amount ({account.currency})</Body><TextInput accessibilityLabel={'Amount in ' + account.currency} editable={!busy} accessibilityState={{ disabled: busy }} value={input} onChangeText={value => { setInput(value); setMessage(null); }} keyboardType="decimal-pad" placeholder={'Amount in ' + account.currency} placeholderTextColor={c.muted} style={{ color: c.ink, fontSize: 19, padding: 12, borderRadius: 10, backgroundColor: c.inset }} />
      <Button label="Review Personal Loan" disabled={isConfined(world) || ageOn(person, world.date) < rule.adultAge ||person.legal.wanted||credit.available<=0n || busy || account.currency !== home.currency} onPress={() => { const value = amount(); if(value){const reason=personalBorrowReason(world,value);if(reason)setMessage(reason);else {Keyboard.dismiss();setQuote({type:'borrow',amount:value});}} }} />
      <Body muted>{account.currency !== home.currency ? 'Personal loans are paid in your home currency.' : ageOn(person,world.date)<rule.adultAge?'Personal borrowing is available from age '+rule.adultAge+'.':person.legal.wanted||isConfined(world)?'Resolve custody or pursuit before new borrowing.':!credit.annual?'You need outside employment, an earned pension or established regular income.':'The total personal-loan limit is half your qualifying annual income.'}</Body>
      <Body>Qualifying annual income: {formatMoney({minor:credit.annual,currency:home.currency})}</Body><Body>Available personal credit: {formatMoney({minor:credit.available,currency:home.currency})}</Body>{credit.parts.map(part=><Body key={part.id} muted>{part.label}: {formatMoney({minor:part.annual,currency:home.currency})}</Body>)}<Body muted>Regular income needs three paid months in the last twelve, including one in the last three. Capital, gifts and asset sales do not qualify. Income from your company is capped by its operating earnings.</Body>
    </Card>
    <Card><Heading size={18}>Currency Exchange</Heading><ActionRow disabled={busy} title="Exchange To" value={target} onPress={() => { Keyboard.dismiss(); setChoosing('target'); }} /><Body muted>Use the amount above. Rates move as months pass; the exchange fee is 1%.</Body><Button label="Review Exchange" disabled={busy || ageOn(person, world.date) < rule.adultAge || target === account.currency} onPress={() => { const value = amount(); if (!value) return; if (value > availableCash(account)) { setMessage('Your available balance cannot cover this exchange.'); return; } const quoted = exchangeQuote(world, value, account.currency, target); if (quoted.net <= 0n) { setMessage('This amount is too small after the exchange fee.'); return; } Keyboard.dismiss(); setQuote({ type: 'exchange', from: account.currency, to: target, amount: value, quotedNet: quoted.net }); }} /></Card>
    <Card><Heading size={18}>Outstanding debts</Heading>{debts.length === 0 && <Body muted>You have no outstanding debt.</Body>}{debts.map(debt => <ActionRow disabled={busy} key={debt.id} title={debt.kind[0].toUpperCase() + debt.kind.slice(1) + ' debt'} subtitle={formatMoney({ minor: debt.principal, currency: debt.currency }) + ' · ' + debt.interestBps / 100 + '% annual interest'} value="Repay" disabledReason={debt.currency !== account.currency ? 'Repay from an account in ' + debt.currency : undefined} onPress={() => { if (busy || quote || choosing) return; Keyboard.dismiss(); setMessage(null); setRepaying(debt.id); }} />)}</Card>
    <Card><ActionRow title="Annual Finances" subtitle="Income, expenses, tax and all recorded cash flows" icon={<FinanceArt id="finances" />} onPress={() => router.push({ pathname: '/finances', params: { tab: 'assets' } })} /><Heading size={18}>Recent transactions</Heading>{transactions.length === 0 && <Body muted>No transactions yet.</Body>}{transactions.map(entry => <React.Fragment key={entry.id}><Body>{entry.description}</Body><Body muted>{entry.year}-{String(entry.month).padStart(2, '0')} · {formatMoney({ minor: entry.cashDelta, currency: entry.currency }, 'en-US', true)}{entry.debtDelta !== 0n ? ' · debt ' + formatMoney({ minor: entry.debtDelta, currency: entry.currency }, 'en-US', true) : ''}</Body></React.Fragment>)}</Card>
    <EventModal event={event} busy={busy} error={quote ? error : undefined} onCancel={() => { setQuote(null); setChoosing(null); }} onChoose={async value => {
      if (busy) return;
      if (quote) { if (await dispatch(quote)) setQuote(null); }
      else if (choosing) { if (choosing === 'source') { setSelectedCurrency(value as Currency); if (value === target) setTarget(value === 'USD' ? 'EUR' : 'USD'); } else setTarget(value as Currency); setMessage(null); setChoosing(null); }
    }} />
  </Page>;
}

function DebtRepayment({ debtId, onClose }: { debtId: string; onClose: () => void }) {
  const world = useGame(s => s.world)!, dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors();
  const person = world.people[world.activePersonId], debt = world.liabilities.find(item => item.id === debtId && item.ownerId === person.id);
  const [input, setInput] = useState(''), [message, setMessage] = useState<string | null>(null), [quote, setQuote] = useState<Extract<FinanceCommand, { type: 'repay' }> | null>(null);
  const mounted = useRef(true), submitting = useRef(false), currentQuote = useRef(quote);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; currentQuote.current = null; }; }, []);
  const close = () => { if (mounted.current && !busy && !submitting.current) { Keyboard.dismiss(); currentQuote.current = null; onClose(); } };
  if (!debt) return <Page><Header title="Repayment" onBack={close} /><Body>This debt is no longer available.</Body></Page>;
  const account = accountFor(world, person, debt.currency), money = (minor: bigint) => formatMoney({ minor, currency: debt.currency });
  const review = () => {
    if (!mounted.current || busy || submitting.current) return;
    let value: bigint;
    try { value = parseMoney(input, debt.currency).minor; if (value <= 0n) throw new Error(); }
    catch { setMessage('Enter a positive amount in ' + debt.currency + '.'); return; }
    if (value > debt.principal) { setMessage('The repayment exceeds the outstanding principal.'); return; }
    if (value > availableCash(account)) { setMessage('Your available balance cannot cover this repayment.'); return; }
    Keyboard.dismiss(); setMessage(null);
    const next = { type: 'repay' as const, amount: value, liabilityId: debt.id }; currentQuote.current = next; setQuote(next);
  };
  const event: EventPresentation | null = quote ? { id: 'repay:' + debt.id, kind: 'confirmation', title: 'Make this repayment?', body: 'Your cash and outstanding debt will both fall by the amount paid.', terms: [{ id: 'debt', label: 'Debt', value: debt.kind[0].toUpperCase() + debt.kind.slice(1) + ' · ' + debt.currency, tone: 'neutral' }, { id: 'amount', label: 'Amount', value: money(quote.amount), tone: 'neutral' }], confirmLabel: 'Repay' } : null;
  return <Page footer={<>
    {(message || error) && !quote && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{message ?? error}</Text>}
    <Button label="Review Repayment" disabled={busy} onPress={review} />
    <Button label="Cancel Repayment" tone="secondary" disabled={busy} onPress={close} />
  </>}>
    <Header title={'Repay ' + debt.kind + ' debt'} onBack={close} backDisabled={busy} />
    <Card><Heading size={20}>Outstanding principal</Heading><Heading size={28}>{money(debt.principal)}</Heading><Body>{debt.interestBps / 100}% annual interest</Body><Body>Available to repay: {money(availableCash(account))}</Body>{account.lockedCash > 0n && <Body muted>Held in trust: {money(account.lockedCash)}</Body>}</Card>
    <Card><Heading size={18}>Repayment amount ({debt.currency})</Heading><TextInput accessibilityLabel={'Repayment amount in ' + debt.currency} autoFocus editable={!busy} accessibilityState={{ disabled: busy }} value={input} onChangeText={value => { if (mounted.current && !busy && !submitting.current) { setInput(value); setMessage(null); } }} keyboardType="decimal-pad" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} placeholder={'Amount in ' + debt.currency} placeholderTextColor={c.muted} style={{ color: c.ink, fontSize: 19, padding: 12, minHeight: 48, borderRadius: 10, backgroundColor: c.inset }} /><Body muted>Enter an amount, then review your repayment.</Body></Card>
    <EventModal event={event} busy={busy} error={quote ? error : undefined} onCancel={() => { if (mounted.current && !busy && !submitting.current && currentQuote.current === quote) { currentQuote.current = null; setQuote(null); } }} onChoose={async () => {
      if (!mounted.current || busy || submitting.current || !quote || currentQuote.current !== quote) return;
      submitting.current = true;
      try { if (await dispatch(quote) && mounted.current && currentQuote.current === quote) { currentQuote.current = null; onClose(); } }
      finally { submitting.current = false; }
    }} />
  </Page>;
}
