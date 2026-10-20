import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { countries } from '../../src/game/countries';
import { fullName } from '../../src/game/model';
import { formatMoney, type Currency } from '../../src/game/money';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { EventModal, type EventPresentation } from '../../src/ui/EventModal';
import { annualFinanceSummary, financeCategoryLabel, financeSections, indexPersonalFinances, type FinanceSection } from '../../src/ui/annualFinances';

export default function Finances() {
  const identity = useGame(s => s.world ? s.world.id + ':' + s.world.activePersonId : 'none');
  return <PersonalFinances key={identity} />;
}
function PersonalFinances() {
  const world = useGame(s => s.world)!, person = world.people[world.activePersonId];
  const [reviewedYear, setYear] = useState<number | null>(null), [reviewedCurrency, setCurrency] = useState<Currency | null>(null);
  const [choosing, setChoosing] = useState<'year' | 'currency' | null>(null), [section, setSection] = useState<FinanceSection | 'all'>('all'), [limit, setLimit] = useState(20);
  const index = useMemo(() => indexPersonalFinances(world, person.id), [world, person.id]);
  const year = reviewedYear ?? world.date.year, currency = reviewedCurrency ?? countries[person.country].currency;
  const summary = useMemo(() => annualFinanceSummary(index, year, currency), [index, year, currency]);
  const money = (minor: bigint, signed = false) => formatMoney({ minor, currency }, countries[person.country].locale, signed);
  const selected = section === 'all' ? null : summary.sections.find(item => item.id === section), entries = section === 'all' ? summary.entries : selected?.entries ?? [];
  const displayed = useMemo(() => entries.slice(-limit).reverse(), [entries, limit]);
  const event: EventPresentation | null = choosing ? {
    id: 'finance-scope-' + choosing, kind: 'selection', title: choosing === 'year' ? 'Financial Year' : 'Finance Currency',
    body: choosing === 'year' ? 'Review actual payments posted in a recorded calendar year.' : 'Currencies are kept separate. This view makes no currency conversion.',
    choices: (choosing === 'year' ? index.years.map(String) : index.currencies).map(id => ({ id, label: id, disabledReason: id === String(choosing === 'year' ? year : currency) ? 'This is your current view' : undefined })), confirmLabel: 'View Breakdown',
  } : null;
  return <Page><Header title="Finances" onBack={() => router.back()} />
    <Card><Heading size={20}>{fullName(person)}</Heading><Body>Personal finances · {year} · {currency}</Body>
      <ActionRow title="Financial Year" value={String(year)} onPress={() => setChoosing('year')} />
      <ActionRow title="Finance Currency" value={currency} onPress={() => setChoosing('currency')} />
      <Body muted>Current balance · {world.date.year}-{String(world.date.month).padStart(2, '0')}-{String(world.date.day).padStart(2, '0')}</Body><Heading size={28}>{money(summary.current.cash)}</Heading>
      <Body>Available now: {money(summary.current.available)}</Body><Body>Outstanding debt now: {money(summary.current.debt)}</Body>
      <Body muted>These balances are current. Past balances and portfolio values are not reconstructed.</Body>
    </Card>
    <Card><Heading size={20}>Recorded in {year}</Heading>
      <Body>Income received before personal tax: {money(summary.income)}</Body>
      <Body>Expenses paid: {money(summary.expenses)}</Body>
      <Body>Taxes paid / withheld: {money(summary.taxPaid)}</Body><Body>Tax refunds received: {money(summary.taxRefunded)}</Body>
      {summary.months > 0 && <><Body>Monthly income average: {money(summary.incomeAverage!)}</Body><Body>Monthly expense average: {money(summary.expenseAverage!)}</Body><Body muted>Calendar averages over {summary.months} elapsed {summary.months === 1 ? 'month' : 'months'} of this year in the saved life. These use recorded payments, not a salary forecast.</Body></>}
      <Body muted>Pay and pensions, rent, dividends and actual company payouts count as income. Borrowing, sales, transfers and inheritance are shown separately. Corporate revenue and expenses stay in the company's books.</Body>
      <ActionRow title="Work & Income" subtitle="Review your actual work and contract" onPress={() => router.push('/work')} />
    </Card>
    <Card><Heading size={20}>Cash Flow</Heading><Body>All cash received: {money(summary.received)}</Body><Body>All cash paid: {money(summary.paid)}</Body><Body>Net cash movement: {money(summary.netCash, true)}</Body>
      <Body>Debt added: {money(summary.debtAdded)}</Body><Body>Debt reduced: {money(summary.debtReduced)}</Body>
      <Body muted>Interest and unpaid bills can add debt without paying cash. Debt reductions include recorded repayments, reversals and estate closures; they do not all mean a loan was paid off.</Body>
    </Card>
    <Card><Heading size={20}>Income, Expenses & Taxes</Heading><Body muted>Tax rows show payments or refunds posted this year, which can settle another earning period. Purchase and sale flows do not measure investment gains. Earlier unrecorded activity is not invented.</Body>
      <ActionRow title="All Recorded Transactions" value={String(summary.entries.length)} onPress={() => { setSection('all'); setLimit(20); }} />
      {summary.sections.map(item => <ActionRow key={item.id} title={item.label} subtitle={'Received ' + money(item.received) + ' · Paid ' + money(item.paid) + (item.debtAdded || item.debtReduced ? ' · Debt +' + money(item.debtAdded) + ' / −' + money(item.debtReduced) : '')} value={String(item.entries.length)} onPress={() => { setSection(item.id); setLimit(20); }} />)}
      {!summary.entries.length && <Body muted>No personal transactions recorded for {year} in {currency}.</Body>}
    </Card>
    {selected && <Card><Heading size={18}>{selected.label} Breakdown</Heading>{selected.categories.map(item => <React.Fragment key={item.category}><Body>{item.label}</Body><Body muted>Received {money(item.received)} · Paid {money(item.paid)}{item.debtAdded || item.debtReduced ? ' · Debt +' + money(item.debtAdded) + ' / −' + money(item.debtReduced) : ''}</Body></React.Fragment>)}</Card>}
    <Card><Heading size={18}>{section === 'all' ? 'Recorded Transactions' : financeSections[section] + ' Transactions'}</Heading>
      {displayed.map(row => <React.Fragment key={row.id}><Body>{row.description}</Body><Body muted>{row.year}-{String(row.month).padStart(2, '0')} · {financeCategoryLabel(row.category)} · Cash {money(row.cashDelta, true)}{row.debtDelta ? ' · Debt ' + money(row.debtDelta, true) : ''}</Body></React.Fragment>)}
      {!displayed.length && <Body muted>No transactions in this view.</Body>}
      {entries.length > displayed.length && <Button label="Show Earlier Transactions" tone="secondary" onPress={() => setLimit(limit + 20)} />}
    </Card>
    <Card><ActionRow title="Investing" subtitle="Current holdings and reviewed trades" onPress={() => router.push('/investments')} /><ActionRow title="Bank & Loans" subtitle="Accounts, borrowing and repayments" onPress={() => router.push('/bank')} /></Card>
    <EventModal event={event} onCancel={() => setChoosing(null)} onChoose={id => {
      if (choosing === 'year' && index.years.includes(Number(id))) setYear(Number(id));
      else if (choosing === 'currency' && index.currencies.includes(id as Currency)) setCurrency(id as Currency);
      else return;
      setLimit(20); setChoosing(null);
    }} />
  </Page>;
}
