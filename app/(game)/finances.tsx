import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { countries } from '../../src/game/countries';
import { fullName } from '../../src/game/model';
import { formatMoney, type Currency } from '../../src/game/money';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { EventModal, type EventPresentation } from '../../src/ui/EventModal';
import { annualFinanceSummary, financeCategoryLabel, financeSections, indexPersonalFinances, type FinanceSection } from '../../src/ui/annualFinances';
import { Illustration } from '../../src/assets/Illustration';
import { useColors } from '../../src/ui/theme';

export default function Finances() {
  const identity = useGame(s => s.world ? s.world.id + ':' + s.world.activePersonId : 'none');
  return <PersonalFinances key={identity} />;
}
function PersonalFinances() {
  const world = useGame(s => s.world)!, person = world.people[world.activePersonId];
  const c = useColors();
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
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Illustration id="money" size={48} /><View style={{ flex: 1, minWidth: 0 }}><Heading size={20}>{fullName(person)}</Heading><Body>Personal finances · {year} · {currency}</Body></View></View>
      <ActionRow title="Financial Year" value={String(year)} onPress={() => setChoosing('year')} />
      <ActionRow title="Finance Currency" value={currency} onPress={() => setChoosing('currency')} />
      <View style={{ padding: 14, backgroundColor: c.inset, borderRadius: 12, gap: 5 }}><Body muted>Current balance · {world.date.year}-{String(world.date.month).padStart(2, '0')}-{String(world.date.day).padStart(2, '0')}</Body><Text accessibilityRole="header" style={{ color: summary.current.cash < 0n ? c.red : c.positiveText, fontSize: 28, lineHeight: 37, fontWeight: '700' }}>{money(summary.current.cash)}</Text></View>
      <FinanceFact label="Available now" value={money(summary.current.available)} /><FinanceFact label="Outstanding debt now" value={money(summary.current.debt)} debt={summary.current.debt > 0n} />
      <Body muted>Current balances, regardless of the year selected above.</Body>
    </Card>
    <Card><Heading size={20}>Recorded in {year}</Heading>
      <FinanceFact label="Income received before personal tax" value={money(summary.income)} positive />
      <FinanceFact label="Expenses paid" value={money(summary.expenses)} />
      <FinanceFact label="Taxes paid / withheld" value={money(summary.taxPaid)} /><FinanceFact label="Tax refunds received" value={money(summary.taxRefunded)} />
      {summary.months > 0 && <><FinanceFact label="Monthly income average" value={money(summary.incomeAverage!)} positive /><FinanceFact label="Monthly expense average" value={money(summary.expenseAverage!)} /><Body muted>Calendar averages over {summary.months} elapsed {summary.months === 1 ? 'month' : 'months'} of this year, based on payments received and made.</Body></>}
      <Body muted>Income includes pay, pensions, rent, dividends and company payouts. Loans, sales, transfers and inheritance appear separately; company trading stays in its own books.</Body>
      <ActionRow title="Work & Income" subtitle="Review your work and contract" onPress={() => router.push('/work')} />
    </Card>
    <Card><Heading size={20}>Cash Flow</Heading><FinanceFact label="All cash received" value={money(summary.received)} positive /><FinanceFact label="All cash paid" value={money(summary.paid)} /><FinanceFact label="Net cash movement" value={money(summary.netCash, true)} positive={summary.netCash >= 0n} debt={summary.netCash < 0n} />
      <FinanceFact label="Debt added" value={money(summary.debtAdded)} /><FinanceFact label="Debt reduced" value={money(summary.debtReduced)} />
      <Body muted>Interest and unpaid bills can add debt without moving cash. Repayments, reversals and estate closures can reduce debt.</Body>
    </Card>
    <Card><Heading size={20}>Income, Expenses & Taxes</Heading><Body muted>Tax payments and refunds may settle an earlier earning period. Purchases and sales show cash flow, rather than investment gains.</Body>
      <FinanceFilter title="All Recorded Transactions" count={summary.entries.length} selected={section === 'all'} onPress={() => { setSection('all'); setLimit(20); }} />
      {summary.sections.map(item => <FinanceFilter key={item.id} title={item.label} subtitle={'Received ' + money(item.received) + ' · Paid ' + money(item.paid) + (item.debtAdded || item.debtReduced ? ' · Debt +' + money(item.debtAdded) + ' / −' + money(item.debtReduced) : '')} count={item.entries.length} selected={section === item.id} onPress={() => { setSection(item.id); setLimit(20); }} />)}
      {!summary.entries.length && <Body muted>No personal transactions recorded for {year} in {currency}.</Body>}
    </Card>
    {selected && <Card><Heading size={18}>{selected.label} Breakdown</Heading>{selected.categories.map(item => <React.Fragment key={item.category}><Body>{item.label}</Body><Body muted>Received {money(item.received)} · Paid {money(item.paid)}{item.debtAdded || item.debtReduced ? ' · Debt +' + money(item.debtAdded) + ' / −' + money(item.debtReduced) : ''}</Body></React.Fragment>)}</Card>}
    <Card><Heading size={18}>{section === 'all' ? 'Recorded Transactions' : financeSections[section] + ' Transactions'}</Heading>
      {displayed.map(row => <View key={row.id} style={{ borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 12, gap: 5 }}><Body>{row.description}</Body><Body muted>{row.year}-{String(row.month).padStart(2, '0')} · {financeCategoryLabel(row.category)} · Cash {money(row.cashDelta, true)}{row.debtDelta ? ' · Debt ' + money(row.debtDelta, true) : ''}</Body></View>)}
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

function FinanceFact({ label, value, positive = false, debt = false }: { label: string; value: string; positive?: boolean; debt?: boolean }) {
  const c = useColors();
  return <View style={{ borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 10 }}><Text style={{ color: c.muted, fontSize: 15, lineHeight: 23 }}>{label}: <Text style={{ color: debt ? c.red : positive ? c.positiveText : c.ink, fontWeight: '600' }}>{value}</Text></Text></View>;
}

function FinanceFilter({ title, subtitle, count, selected, onPress }: { title: string; subtitle?: string; count: number; selected: boolean; onPress: () => void }) {
  const c = useColors();
  return <Pressable accessibilityRole="button" accessibilityLabel={[title, subtitle, String(count)].filter(Boolean).join('. ')} accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => ({ minHeight: 66, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: selected ? c.link : c.line, backgroundColor: pressed || selected ? c.selected : c.surface, flexDirection: 'row', alignItems: 'center', gap: 10 })}>
    <View style={{ flex: 1, minWidth: 0, gap: 5 }}><Text style={{ color: c.ink, fontSize: 16, lineHeight: 23, fontWeight: '600' }}>{title}</Text>{subtitle && <Body muted>{subtitle}</Body>}</View>
    <Text style={{ color: c.muted, fontSize: 14, flexShrink: 1 }}>{count}</Text><View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Ionicons name={selected ? 'checkmark-circle' : 'chevron-forward'} size={22} color={selected ? c.link : c.muted} /></View>
  </Pressable>;
}
