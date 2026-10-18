import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { formatMoney, parseMoney } from '../../src/game/money';
import { accountFor } from '../../src/game/systems/common';
import { cashNetWorth } from '../../src/game/systems/finance';
import { rules } from '../../src/game/rules';
import { ageOn } from '../../src/game/model';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { useColors } from '../../src/ui/theme';

type Quote = { type: 'borrow'; amount: bigint } | { type: 'repay'; amount: bigint; liabilityId: string };
export default function Bank() {
  const world = useGame(s => s.world)!; const dispatch = useGame(s => s.dispatch); const busy = useGame(s => s.busy); const error = useGame(s => s.error); const c = useColors();
  const person = world.people[world.activePersonId]; const account = accountFor(world); const rule = rules[person.country];
  const debts = world.liabilities.filter(debt => debt.ownerId === person.id && debt.principal > 0n);
  const transactions = world.ledger.filter(entry => entry.personId === person.id).slice(-30).reverse();
  const money = (minor: bigint) => formatMoney({ minor, currency: account.currency });
  const [input, setInput] = useState(''); const [message, setMessage] = useState<string | null>(null); const [quote, setQuote] = useState<Quote | null>(null);
  const amount = (): bigint | null => { try { const value = parseMoney(input, account.currency).minor; if (value <= 0n) throw new Error(); setMessage(null); return value; } catch { setMessage('Enter a positive amount in ' + account.currency + '.'); return null; } };
  const event: EventPresentation | null = quote ? { id: quote.type + ':' + (quote.type === 'repay' ? quote.liabilityId : 'personal'), kind: 'confirmation', title: quote.type === 'borrow' ? 'Take out this loan?' : 'Make this repayment?', body: quote.type === 'borrow' ? 'Your cash and debt will both increase. Interest is added monthly until repayment.' : 'Your cash and outstanding debt will both fall by the amount paid.', terms: [{ id: 'amount', label: 'Amount', value: money(quote.amount), tone: 'neutral' }, ...(quote.type === 'borrow' ? [{ id: 'interest', label: 'Annual interest', value: rule.personalInterestBps / 100 + '%', tone: 'neutral' as const }] : [])], confirmLabel: quote.type === 'borrow' ? 'Accept Loan' : 'Repay' } : null;
  return <Page><Header title="Bank & Loans" onBack={() => router.back()} /><Card><Body muted>Available balance</Body><Heading size={30}>{money(account.cash)}</Heading><Body>Cash less debt: {money(cashNetWorth(world))}</Body></Card>
    {(message || error) && <Body>{message ?? error}</Body>}
    <Card><Heading size={18}>Borrow or repay</Heading><TextInput accessibilityLabel={'Amount in ' + account.currency} value={input} onChangeText={setInput} keyboardType="decimal-pad" placeholder={'Amount in ' + account.currency} placeholderTextColor={c.muted} style={{ color: c.ink, fontSize: 19, padding: 12, borderRadius: 10, backgroundColor: c.inset }} />
      <Button label="Review Personal Loan" disabled={ageOn(person, world.date) < rule.adultAge || !person.employment || busy} onPress={() => { const value = amount(); if (value) setQuote({ type: 'borrow', amount: value }); }} />
      <Body muted>{!person.employment ? 'Current employment is required for personal borrowing.' : 'Personal borrowing is limited to half your annual salary.'}</Body>
    </Card>
    <Card><Heading size={18}>Outstanding debts</Heading>{debts.length === 0 && <Body muted>You have no outstanding debt.</Body>}{debts.map(debt => <ActionRow key={debt.id} title={debt.kind[0].toUpperCase() + debt.kind.slice(1) + ' debt'} subtitle={formatMoney({ minor: debt.principal, currency: debt.currency }) + ' · ' + debt.interestBps / 100 + '% annual interest'} disabledReason={debt.currency !== account.currency ? 'Repay from an account in ' + debt.currency : undefined} onPress={() => { const value = amount(); if (value) setQuote({ type: 'repay', amount: value, liabilityId: debt.id }); }} />)}</Card>
    <Card><Heading size={18}>Recent transactions</Heading>{transactions.length === 0 && <Body muted>No transactions yet.</Body>}{transactions.map(entry => <React.Fragment key={entry.id}><Body>{entry.description}</Body><Body muted>{entry.year}-{String(entry.month).padStart(2, '0')} · {formatMoney({ minor: entry.cashDelta, currency: entry.currency }, 'en-US', true)}{entry.debtDelta !== 0n ? ' · debt ' + formatMoney({ minor: entry.debtDelta, currency: entry.currency }, 'en-US', true) : ''}</Body></React.Fragment>)}</Card>
    <EventModal event={event} busy={busy} onCancel={() => setQuote(null)} onChoose={() => { if (quote) { const command = quote; setQuote(null); void dispatch(command); } }} />
  </Page>;
}
