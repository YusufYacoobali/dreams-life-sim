import { LicenceControls } from '../../../src/ui/VehicleLifestyle';
import { displayQuantity } from "../../../src/ui/displayNumbers";
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { countries } from '../../../src/game/countries';
import { formatMoney } from '../../../src/game/money';
import { ActionRow, Body, Card, Header, Heading, Page } from '../../../src/ui/components';
import { cashNetWorth } from '../../../src/game/systems/finance';
import { accountFor } from '../../../src/game/systems/common';
import { netWorth, investmentValue, formatQuantity } from '../../../src/game/systems/markets';
import { CatalogArt } from '../../../src/assets/CatalogArt';
import { instruments } from '../../../src/game/content/markets';
import { Illustration } from '../../../src/assets/Illustration';
import { FameBusinessArt } from '../../../src/assets/FameBusinessArt';
import { businessValue } from '../../../src/game/businessValuation';
import { useColors } from '../../../src/ui/theme';
import { PolishArt } from '../../../src/assets/PolishArt';
import { rentalResidence } from '../../../src/game/systems/rentalSchemas';
import { FinanceArt } from '../../../src/assets/FinanceArt';
import { DisplayText as Text } from '../../../src/ui/DisplayText';

export default function Assets() {
  const world = useGame(s => s.world)!;
  const c = useColors(), { width, fontScale } = useWindowDimensions(), stacked = width < 360 || fontScale >= 1.2;
  const player = world.people[world.activePersonId];
  const accounts = world.accounts.filter(account => account.ownerId === player.id);
  const worth = netWorth(world);
  const owned = world.assets.filter(asset => asset.ownerId === player.id);
  const holdings = world.holdings.filter(holding => holding.ownerId === player.id && holding.quantity > 0n);
  const residence = rentalResidence(world);
  return <Page>
    <Header title="Assets" />
    <Card>
      <View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'flex-start' : 'center', gap: 14 }}>
        <View style={{ padding: 10, borderRadius: 16, backgroundColor: c.inset }}><FinanceArt id="net-worth" size={48} /></View>
        <View style={{ flex: stacked ? undefined : 1, minWidth: 0, maxWidth: '100%', gap: 4 }}><Body muted>Net worth</Body><Text accessibilityRole="header" style={{ color: worth.minor < 0n ? c.red : c.positiveText, fontSize: 30, lineHeight: 39, fontWeight: '700' }}>{formatMoney(worth, countries[player.country].locale)}</Text><Body muted>Estimated total · {worth.currency}</Body></View>
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: 12, gap: 8 }}>{accounts.map(account => <View key={account.id} style={{ gap: 3 }}><Body>Bank: {formatMoney({ minor: account.cash, currency: account.currency }, countries[player.country].locale)}</Body>{account.lockedCash > 0n && <Body muted>Includes {formatMoney({ minor: account.lockedCash, currency: account.currency }, countries[player.country].locale)} held in trust.</Body>}</View>)}<Body muted>Cash less debt: {formatMoney({ minor: cashNetWorth(world), currency: accountFor(world).currency }, countries[player.country].locale)}</Body></View>
      <ActionRow title="Finances" subtitle="Income, bills, taxes and cash flow" icon={<FinanceArt id="finances" size={40} />} onPress={() => router.push({ pathname: '/finances', params: { tab: 'assets' } })} />
      <ActionRow title="Bank & Loans" subtitle="Borrow, repay and view transactions" icon={<PolishArt id="loan" />} onPress={() => router.push('/bank')} />
    </Card>
    <LicenceControls />
    {residence && <Card><Heading size={20}>Your Residence</Heading><ActionRow title={residence.name} subtitle={'Rented home · ' + residence.city + ' · ' + formatMoney({ minor: residence.monthlyRent, currency: residence.currency }, countries[player.country].locale) + '/month'} icon={<CatalogArt id={residence.catalogId} size={56} />} onPress={() => router.push({ pathname: '/rental/[id]', params: { id: residence.catalogId } })} /></Card>}
    {(['property', 'vehicle', 'possession'] as const).map(kind => { const inventory = owned.filter(asset => asset.kind === kind); return <Card key={kind}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{kind === 'possession' ? <CatalogArt id="watch" size={40} /> : <Illustration id={kind} size={40} />}<View style={{ flex: 1, minWidth: 0 }}><Heading size={20}>{kind === 'property' ? 'Properties' : kind === 'vehicle' ? 'Vehicles' : 'Possessions'}</Heading><Body muted>{inventory.length} owned</Body></View></View>
      {inventory.map(asset => <ActionRow key={asset.id} title={asset.name} subtitle={asset.primaryHome ? 'Primary home' : asset.rental === 'occupied' ? 'Rented out' : asset.listing ? 'Listed for sale' : asset.condition + '% condition'} value={formatMoney({ minor: asset.value, currency: asset.currency })} icon={<CatalogArt id={asset.catalogId} size={48} />} onPress={() => router.push({ pathname: '/asset/[id]', params: { id: asset.id } })} />)}
      {!inventory.length && <Body muted>{kind === 'property' ? 'No property owned.' : kind === 'vehicle' ? 'No vehicles owned.' : 'No possessions owned.'}</Body>}
      <ActionRow title={kind === 'property' ? 'Real Estate' : kind === 'vehicle' ? 'Buy a Vehicle' : 'Shop Possessions'} subtitle={kind === 'property' ? 'Buy, mortgage or rent a home' : undefined} onPress={() => router.push({ pathname: '/shopping/[kind]', params: { kind } })} />
    </Card>; })}
    <Card><Heading size={20}>Businesses</Heading>{world.businesses.filter(item => item.ownerId === player.id && item.status === 'active').map(company => <ActionRow key={company.id} title={company.name} subtitle="Estimated company equity" value={formatMoney({ minor: businessValue(world, company), currency: company.currency })} onPress={() => router.push({ pathname: '/business/[id]', params: { id: company.id, tab: 'assets' } })} />)}<ActionRow title="Business Portfolio" icon={<FameBusinessArt id="business" size={44} />} onPress={() => router.push({ pathname: '/business', params: { tab: 'assets' } })} /></Card>
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><CatalogArt id="portfolio" size={40} /><Heading size={20}>Investments</Heading></View>{holdings.map(holding => <ActionRow key={holding.id} title={instruments[holding.instrumentId].name} subtitle={displayQuantity(formatQuantity(holding.quantity, holding.instrumentId)) + ' units'} value={formatMoney({ minor: investmentValue(world, holding.instrumentId, holding.quantity, accountFor(world).currency), currency: accountFor(world).currency })} onPress={() => router.push({ pathname: '/investment/[id]', params: { id: holding.instrumentId } })} />)}
      <ActionRow title="Stocks, Funds & Crypto" icon={<CatalogArt id="portfolio" size={44} />} onPress={() => router.push('/investments')} />
    </Card>
  </Page>;
}
