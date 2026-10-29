import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { businessKinds, businessCatalog, BusinessKind } from '../../src/game/content/businesses';
import { businessStartReason, businessStartupQuote } from '../../src/game/systems/businesses';
import { businessValue } from '../../src/game/businessValuation';
import { formatMoney } from '../../src/game/money';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { FameBusinessArt } from '../../src/assets/FameBusinessArt';
import { useBusinessReview } from '../../src/ui/BusinessReview';
import { useColors } from '../../src/ui/theme';
import { SocialBusinessChoice, SocialBusinessFacts, SocialBusinessIntro } from '../../src/ui/SocialBusinessPresentation';
import { DisplayText as Text } from '../../src/ui/DisplayText';

export default function Businesses() {
  const identity = useGame(state => state.world ? state.world.id + ':' + state.world.activePersonId : 'none');
  return <BusinessSetup key={identity} />;
}

function BusinessSetup() {
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), review = useBusinessReview(), c = useColors();
  const [kind, setKind] = useState<BusinessKind>('cafe'), [name, setName] = useState(''), [operation, setOperation] = useState<'owner' | 'manager'>('manager');
  const companies = world.businesses.filter(item => item.ownerId === world.activePersonId && item.status === 'active'), archived = world.businesses.filter(item => item.status !== 'active' && (item.founderId === world.activePersonId || world.businessLedger.some(row => row.businessId === item.id && row.personId === world.activePersonId && row.category === 'capital-return'))), quote = businessStartupQuote(world, kind), reason = businessStartReason(world, kind, operation), money = (minor: bigint) => formatMoney({ minor, currency: quote.currency });
  return <Page><Header title="Business" onBack={() => router.back()} />{error && !review.open && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red }}>{error}</Text>}<Card><SocialBusinessIntro art={<FameBusinessArt id="business" size={76} />} title="Build something of your own" body="Be your own boss. The bills will still have opinions." /><Heading size={18}>Your businesses</Heading>{!companies.length && <Body muted>You do not own a business yet.</Body>}{companies.map(company => <ActionRow key={company.id} title={company.name} subtitle={businessCatalog[company.kind].title + ' · ' + company.city} value={formatMoney({ minor: businessValue(world, company), currency: company.currency }) + ' estimated equity'} icon={<FameBusinessArt id={company.logo ?? businessCatalog[company.kind].art} size={42} />} onPress={() => router.push({ pathname: '/business/[id]', params: { id: company.id } })} />)}</Card>
    <Card><Heading size={20}>Start a Business</Heading><Body muted>Choose a business type, then make the brand your own.</Body>{businessKinds.map(id => <SocialBusinessChoice disabled={busy} key={id} title={businessCatalog[id].title} subtitle={businessCatalog[id].description} icon={<FameBusinessArt id={businessCatalog[id].art} size={40} />} selected={kind === id} onPress={() => setKind(id)} />)}<Heading size={18}>Your brand name</Heading><TextInput accessibilityLabel="Business name" editable={!busy} accessibilityState={{ disabled: busy }} value={name} onChangeText={setName} maxLength={50} placeholder="Name your business" placeholderTextColor={c.muted} style={{ color: c.ink, backgroundColor: c.inset, borderRadius: 10, padding: 12 }} />
      <Heading size={18}>Who will run it?</Heading><SocialBusinessChoice disabled={busy} title="Employ a Manager" subtitle="Hire a manager and worker, paid by the company" selected={operation === 'manager'} onPress={() => setOperation('manager')} /><SocialBusinessChoice disabled={busy} title="Work in the Business" subtitle="Take a paid full-time role, if you qualify" selected={operation === 'owner'} onPress={() => setOperation('owner')} />
      <Heading size={18}>Your startup payment</Heading><SocialBusinessFacts items={[{ label: 'Company capital', value: money(quote.capital) }, { label: 'Registration fee', value: money(quote.registration) }, { label: 'Personal payment', value: money(quote.total), note: 'Capital plus registration' }]} /><Body muted>Company funds cover equipment, wages and bills.{operation === 'manager' ? ' Two hiring fees also come out of company funds.' : ''}</Body>{reason && <Body muted>{reason}</Body>}
      <Button label="Review Startup" disabled={busy || !!reason || !name.trim() || /[\u0000-\u001F]/.test(name)} onPress={() => review.confirm({ type: 'start-business', kind, name: name.trim(), operation, quotedCapital: quote.capital }, 'Start ' + name.trim() + '?', operation === 'owner' ? 'You will work here full-time. Company funds pay your wages and the bills.' : 'A manager and worker will run the business. Your investment is at risk if it struggles.', [{ id: 'type', label: 'Business type', value: businessCatalog[kind].title, tone: 'neutral' }, { id: 'capital', label: 'Company capital', value: money(quote.capital), tone: 'neutral' }, { id: 'registration', label: 'Registration fee', value: money(quote.registration), tone: 'negative' }, { id: 'total', label: 'Personal payment', value: money(quote.total), tone: 'negative' }], businessCatalog[kind].art, 'Start Business')} />
    </Card>{archived.length > 0 && <Card><Heading size={18}>Past Businesses</Heading>{archived.map(company => <ActionRow key={company.id} title={company.name} subtitle={company.status + ' · ' + company.ended?.year} onPress={() => router.push({ pathname: '/business/[id]', params: { id: company.id } })} />)}</Card>}{review.modal}</Page>;
}
