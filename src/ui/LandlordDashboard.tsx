import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { World } from '../game/model';
import { ageOn, fullName } from '../game/personHelpers';
import { formatMoney } from '../game/money';
import { askingRent, namedTenancy, tenantCheckFee, tenancyReviewFee, type PropertyCommand } from '../game/systems/landlordTenancies';
import { tenancyActionReason, type TenancyCommand } from '../game/systems/tenancyEligibility';
import { lifestyleMonthNumber, lifestyleReason, presentAtHome } from '../game/systems/lifestyleCommon';
import { availableCash } from '../game/systems/common';
import { ActionRow, Body, Button, Card, Heading, Portrait } from './components';
import { SocialBusinessChoice, SocialBusinessFacts } from './SocialBusinessPresentation';
import { useLifestyleReview } from './LifestyleReview';
import { FinanceArt } from '../assets/FinanceArt';
import { PolishArt } from '../assets/PolishArt';
import { HealthLegalArt } from '../assets/HealthLegalArt';
import { PersonActionArt } from '../assets/PersonActionArt';
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthLabel = (month: number) => monthNames[month % 12] + ' ' + Math.floor(month / 12);

export function LandlordDashboard({ world, asset }: { world: World; asset: World['assets'][number] }) {
  const row = namedTenancy(world, asset.id), { ask, modal, busy } = useLifestyleReview('tenancy:' + asset.id + ':' + row?.id);
  const [section, setSection] = useState<'tenants' | 'payments' | 'maintenance' | 'ending' | null>(null);
  const [ending, setEnding] = useState<'end' | 'evict'>('end');
  const [paymentPage, setPaymentPage] = useState<number | null>(null), [historyPage, setHistoryPage] = useState(0);
  const state = world.lifestyle!, current = lifestyleMonthNumber(world), common = lifestyleReason(world), money = (amount: bigint) => formatMoney({ minor: amount, currency: asset.currency });
  const apps = state.applications.filter(app => app.assetId === asset.id && app.status === 'open' && app.expiresMonth >= current);
  const groups = [
    { id: 'tenants', title: 'Tenants & Applications', icon: <PersonActionArt id="family-planning" size={40} /> },
    { id: 'payments', title: 'Rent & Payments', icon: <FinanceArt id="finances" size={40} /> },
    { id: 'maintenance', title: 'Maintenance', icon: <PolishArt id="settings" size={40} /> },
    { id: 'ending', title: 'End Tenancy', icon: <HealthLegalArt id="court" size={40} /> },
  ] as const;
  const command = (action: TenancyCommand['action'], amount = 0n): TenancyCommand => ({ type: 'manage-tenancy', tenancyId: row!.id, action, quotedAmount: amount });
  const reason = (action: TenancyCommand['action'], amount = 0n) => tenancyActionReason(world, command(action, amount));
  const review = (action: TenancyCommand['action'], title: string, body: string, amount = 0n) => {
    const next = command(action, amount); if (tenancyActionReason(world, next)) return;
    ask(next, title, body, amount ? [{ id: 'cost', label: action === 'rent' ? 'New monthly rent' : 'Cost', value: money(amount), tone: action === 'rent' ? 'neutral' : 'negative' }] : [], 'property');
  };
  const tenant = row ? world.people[row.tenantId] : null;
  const previous = state.tenancies.filter(item => item.assetId === asset.id && item.ended).slice().reverse();
  return <><Card><Heading size={20}>Landlord Management</Heading>
    {tenant && row ? <>
      <ActionRow title={fullName(tenant)} subtitle="Current tenant" icon={<Portrait decorative personId={tenant.id} name={fullName(tenant)} appearance={tenant.appearance} age={ageOn(tenant, world.date)} size={40} />} onPress={() => router.push({ pathname: '/person/[id]', params: { id: tenant.id, tab: 'assets' } })} />
      <SocialBusinessFacts items={[{ label: 'Monthly rent', value: money(row.rent) }, { label: 'Unpaid rent', value: money(row.arrears) }, { label: 'Deposit in escrow', value: money(row.depositHeld) }, { label: 'Tenancy', value: row.noticeMonth === null ? 'Active' : 'Notice given · ' + monthLabel(row.noticeMonth) }]} />
      {(row.maintenance > 0n || row.arrears > 0n) && <Button label={row.maintenance > 0n ? 'Review Outstanding Repairs' : 'Review Late Rent'} tone="secondary" onPress={() => setSection(row.maintenance > 0n ? 'maintenance' : 'payments')} />}
    </> : <Body muted>{apps.length ? apps.length + ' applications to review.' : 'Choose a rent and find a tenant.'}</Body>}
    {(row ? groups : []).map(group => <ActionRow key={group.id} title={group.title} icon={group.icon} accessibilityState={{ expanded: section === group.id }} onPress={() => setSection(section === group.id ? null : group.id)} />)}
  </Card>
  {(section === 'tenants' || !row) && <Card><Heading size={18}>{row ? 'Your Tenant' : 'Tenant Applications'}</Heading>
    {row ? <Body>{fullName(tenant!)} · Started {monthLabel(row.started.year * 12 + row.started.month - 1)} · Satisfaction {row.satisfaction}%</Body> : <>
      {!apps.length && <><Body muted>Suggested rent: {money(askingRent(asset))} per month.</Body>{[80, 100, 120].map(percent => <ActionRow key={percent} title={percent + '% of Market Rent'} value={money(askingRent(asset) * BigInt(percent) / 100n)} disabled={busy} disabledReason={common ?? (asset.listing ? 'Remove the sale listing first' : undefined)} onPress={() => ask({ type: 'find-tenants', assetId: asset.id, quotedRent: askingRent(asset) * BigInt(percent) / 100n }, 'Advertise This Property?', 'The property will be offered to tenants and will no longer be your primary home.', [{ id: 'rent', label: 'Monthly asking rent', value: money(askingRent(asset) * BigInt(percent) / 100n), tone: 'neutral' }], 'property')} />)}</>}
      {apps.map(app => {
        const person = world.people[app.tenantId], checkFee = tenantCheckFee(asset.country);
        const unavailable = !presentAtHome(world, person) || person.country !== asset.country || person.city !== asset.city || state.tenancies.some(item => !item.ended && item.tenantId === person.id) ? 'The applicant is no longer available' : undefined;
        const account = world.accounts.find(item => item.ownerId === world.activePersonId && item.currency === asset.currency);
        const checkReason = common ?? (!account || availableCash(account) < checkFee ? 'Insufficient available funds' : undefined);
        const submit = (action: Extract<PropertyCommand, { type: 'review-tenant' }>['action']) => ask({ type: 'review-tenant', applicationId: app.id, action, quotedDeposit: asset.rentPerMonth, ...(action === 'check' ? { quotedCheckFee: checkFee } : {}) }, action === 'check' ? 'Check This Applicant?' : action === 'accept' ? 'Accept ' + fullName(person) + '?' : 'Decline This Application?', action === 'check' ? 'Review their employment, finances and recorded convictions.' : action === 'accept' ? 'The tenant pays one month’s rent into escrow. Rent payments begin next month.' : 'This application will be closed.', action === 'check' ? [{ id: 'fee', label: 'Background check', value: money(checkFee), tone: 'negative' }] : action === 'accept' ? [{ id: 'rent', label: 'Monthly rent', value: money(asset.rentPerMonth), tone: 'neutral' }, { id: 'deposit', label: 'Tenant deposit', value: money(asset.rentPerMonth), tone: 'neutral' }] : [], 'property');
        return <Card key={app.id}><ActionRow title={fullName(person)} subtitle={app.source} icon={<Portrait decorative personId={person.id} name={fullName(person)} appearance={person.appearance} age={ageOn(person, world.date)} size={40} />} onPress={() => router.push({ pathname: '/person/[id]', params: { id: person.id, tab: 'assets' } })} />
          <Body muted>Funds at application: {money(app.funds)} · Annual income: {money(app.annualIncome)}</Body>
          {app.checked ? <Body>Reliability {app.reliability}% · Recorded convictions {world.sentences.filter(item => item.personId === person.id).length}</Body> : <ActionRow title="Background Check" value={money(checkFee)} disabled={busy} disabledReason={checkReason} onPress={() => submit('check')} />}
          {unavailable && <Body muted>{unavailable}</Body>}<Button label="Accept Applicant" busy={busy} disabled={!!common || !!unavailable} onPress={() => submit('accept')} /><ActionRow title="Decline Applicant" disabled={busy} disabledReason={common} onPress={() => submit('reject')} />
        </Card>;
      })}
    </>}
  </Card>}
  {row && section === 'payments' && <Card><Heading size={18}>Rent & Payments</Heading>
    <SocialBusinessFacts items={[{ label: 'Monthly rent', value: money(row.rent) }, { label: 'Unpaid rent', value: money(row.arrears) }, { label: 'Payments recorded', value: String(row.periods.length) }]} />
    {row.arrears > 0n && <ActionRow title="Discuss Late Rent" disabled={busy} disabledReason={reason('discuss')} onPress={() => review('discuss', 'Discuss Late Rent?', 'Any payment comes from the tenant’s available funds. Unpaid rent remains recorded.')} />}
    {current - row.lastRentReviewMonth < 12 ? <Body muted>Next rent review: {monthLabel(row.lastRentReviewMonth + 12)}.</Body> : <><Heading size={17}>Annual Rent Review</Heading>{[90, 100, 110].map(percent => {
      const amount = row.rent * BigInt(percent) / 100n;
      return <ActionRow key={percent} title={percent === 90 ? 'Reduce Rent by 10%' : percent === 100 ? 'Keep Current Rent' : 'Increase Rent by 10%'} value={money(amount)} disabled={busy} disabledReason={reason('rent', amount)} onPress={() => review('rent', 'Review the Rent?', 'This becomes the agreed monthly rent. Past payments and the original deposit remain unchanged.', amount)} />;
    })}</>}
    {row.periods.length > 0 && <ActionRow title="Payment History" onPress={() => setPaymentPage(paymentPage === null ? 0 : null)} />}
    {paymentPage !== null && <><Heading size={17}>Monthly Payments</Heading>{row.periods.slice().reverse().slice(paymentPage * 12, paymentPage * 12 + 12).map(period => <View key={period.month} style={{ gap: 3 }}><Body>{monthLabel(period.month)}</Body><Body muted>Paid {money(period.paid)} of {money(period.due)}</Body></View>)}{state.records.filter(record => record.subjectId === row.id && record.kind === 'tenant-arrears' && record.received > 0n).slice(-6).reverse().map(record => <Body key={record.id}>Arrears payment · {monthLabel(record.date.year * 12 + record.date.month - 1)} · {money(record.received)}</Body>)}{row.periods.length > 12 && <><Button label="Recent Payments" tone="secondary" disabled={paymentPage === 0} onPress={() => setPaymentPage(paymentPage - 1)} /><Button label="Earlier Payments" tone="secondary" disabled={(paymentPage + 1) * 12 >= row.periods.length} onPress={() => setPaymentPage(paymentPage + 1)} /></>}</>}
    {!reason('renew') && <ActionRow title="Renew Agreement" disabled={busy} onPress={() => review('renew', 'Renew This Agreement?', 'Keep the agreed rent and deposit. Past payments and any arrears remain recorded.')} />}
  </Card>}
  {row && section === 'maintenance' && <Card><Heading size={18}>Maintenance</Heading>
    {row.maintenance > 0n ? <ActionRow title="Pay for Repairs" value={money(row.maintenance)} disabled={busy} disabledReason={reason('repair', row.maintenance)} onPress={() => review('repair', 'Arrange These Repairs?', 'Pay the outstanding estimate to repair the property.', row.maintenance)} /> : <Body>No repairs are outstanding.</Body>}
    {reason('inspect') ? <Body muted>{reason('inspect')}</Body> : <ActionRow title="Inspect Property" disabled={busy} onPress={() => review('inspect', 'Inspect the Property?', 'Visit the property and review its condition. No repair is paid for now.')} />}
  </Card>}
  {row && section === 'ending' && <Card><Heading size={18}>End the Tenancy</Heading>
    <View accessibilityRole="radiogroup" accessibilityLabel="Tenancy ending">
      <SocialBusinessChoice title="End Tenancy Normally" subtitle="Two months’ notice and completed repairs" selected={ending === 'end'} disabled={busy} onPress={() => setEnding('end')} />
      <SocialBusinessChoice title="Evict for Unpaid Rent" subtitle="Unpaid rent and an independent review" selected={ending === 'evict'} disabled={busy} onPress={() => setEnding('evict')} />
    </View>
    <Body muted>The full deposit is returned when the tenancy ends. Any unpaid rent remains recorded.</Body>
    <Body>Notice: {row.noticeMonth === null ? 'Not yet given' : current - row.noticeMonth >= 2 ? 'Two months complete' : current - row.noticeMonth + ' of 2 months complete'}</Body>
    <Body>Repairs: {row.maintenance > 0n ? money(row.maintenance) + ' outstanding' : 'Complete'}</Body>
    {ending === 'evict' && <><Body>Overdue rent: {row.arrears >= row.rent * 2n ? 'Two rents or more' : money(row.arrears) + ' of ' + money(row.rent * 2n) + ' required'}</Body><Body>Independent review: {row.reviewMonth === null ? 'Not yet completed' : 'Complete'}</Body><Body>Waiting period: {row.reviewMonth === null ? 'One further month after review' : current > row.reviewMonth ? 'Complete' : 'Until ' + monthLabel(row.reviewMonth + 1)}</Body></>}
    {common && <Body muted>{common}</Body>}
    {row.noticeMonth === null && !reason('notice') && <ActionRow title="Give Two Months’ Notice" disabled={busy} onPress={() => review('notice', 'Give Notice?', 'Give the tenant two months’ notice. Rent and maintenance responsibilities continue.')} />}
    {row.maintenance > 0n && (!reason('repair', row.maintenance) ? <ActionRow title="Arrange Outstanding Repairs" value={money(row.maintenance)} disabled={busy} onPress={() => review('repair', 'Arrange These Repairs?', 'Pay the outstanding estimate to repair the property.', row.maintenance)} /> : !common && <Body muted>{reason('repair', row.maintenance)}</Body>)}
    {ending === 'evict' && row.reviewMonth === null && (!reason('review-eviction', tenancyReviewFee(asset.country)) ? <ActionRow title="Independent Eviction Review" value={money(tenancyReviewFee(asset.country))} disabled={busy} onPress={() => review('review-eviction', 'Request an Independent Review?', 'Pay for the review. A further month must pass before eviction can be completed.', tenancyReviewFee(asset.country))} /> : !common && row.noticeMonth !== null && current - row.noticeMonth >= 2 && row.maintenance === 0n && row.arrears >= row.rent * 2n && <Body muted>{reason('review-eviction', tenancyReviewFee(asset.country))}</Body>)}
    {ending === 'evict' && !reason('evict') && <ActionRow title="Complete Eviction" disabled={busy} onPress={() => review('evict', 'Complete This Eviction?', 'End the reviewed tenancy and return the full deposit. Unpaid rent remains recorded.')} />}
    {ending === 'end' && !reason('end') && <ActionRow title="End Tenancy After Notice" disabled={busy} onPress={() => review('end', 'End This Tenancy?', 'End the tenancy after notice and return the full deposit. Unpaid rent remains recorded.')} />}
  </Card>}{previous.length > 0 && <Card><Heading size={18}>Previous Tenancies</Heading>{previous.slice(historyPage * 3, historyPage * 3 + 3).map(item => <View key={item.id} style={{ gap: 4 }}><Body>{fullName(world.people[item.tenantId])}</Body><Body muted>{monthLabel(item.started.year * 12 + item.started.month - 1)} to {monthLabel(item.ended!.year * 12 + item.ended!.month - 1)}</Body><Body muted>{item.endReason}</Body><Body>Deposit returned: {money(item.deposit)}</Body>{item.arrears > 0n && <Body>Recorded unpaid rent: {money(item.arrears)}</Body>}</View>)}{previous.length > 3 && <><Button label="Recent Tenancies" tone="secondary" disabled={historyPage === 0} onPress={() => setHistoryPage(historyPage - 1)} /><Button label="Earlier Tenancies" tone="secondary" disabled={(historyPage + 1) * 3 >= previous.length} onPress={() => setHistoryPage(historyPage + 1)} /></>}</Card>}{modal}</>;
}
