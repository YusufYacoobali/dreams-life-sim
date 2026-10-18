import React from 'react';
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

export default function Assets() {
  const world = useGame(s => s.world)!;
  const player = world.people[world.activePersonId];
  const accounts = world.accounts.filter(account => account.ownerId === player.id);
  const worth = netWorth(world);
  const owned = world.assets.filter(asset => asset.ownerId === player.id);
  const holdings = world.holdings.filter(holding => holding.ownerId === player.id && holding.quantity > 0n);
  return <Page>
    <Header title="Assets" />
    <Card>
      <Illustration id="money" size={44} />
      <Body muted>Net worth</Body><Heading size={30}>{formatMoney(worth, countries[player.country].locale)}</Heading>
      {accounts.map(account => <Body key={account.id}>Bank: {formatMoney({ minor: account.cash, currency: account.currency }, countries[player.country].locale)}</Body>)}
      <Body muted>Cash less debt: {formatMoney({ minor: cashNetWorth(world), currency: accountFor(world).currency }, countries[player.country].locale)}</Body>
      <ActionRow title="Bank & Loans" subtitle="Borrow, repay and view transactions" onPress={() => router.push('/bank')} />
    </Card>
    {(['property', 'vehicle', 'possession'] as const).map(kind => <Card key={kind}><Heading size={20}>{kind === 'property' ? 'Properties' : kind === 'vehicle' ? 'Vehicles' : 'Possessions'}</Heading>
      {owned.filter(asset => asset.kind === kind).map(asset => <ActionRow key={asset.id} title={asset.name} subtitle={asset.primaryHome ? 'Primary home' : asset.rental === 'occupied' ? 'Rented out' : asset.listing ? 'Listed for sale' : asset.condition + '% condition'} value={formatMoney({ minor: asset.value, currency: asset.currency })} icon={<CatalogArt id={asset.catalogId} size={48} />} onPress={() => router.push({ pathname: '/asset/[id]', params: { id: asset.id } })} />)}
      {!owned.some(asset => asset.kind === kind) && <Body muted>{kind === 'property' ? 'No property owned.' : kind === 'vehicle' ? 'No vehicles owned.' : 'No possessions owned.'}</Body>}
      <ActionRow title={kind === 'property' ? 'Find a Home' : kind === 'vehicle' ? 'Buy a Vehicle' : 'Shop Possessions'} onPress={() => router.push({ pathname: '/shopping/[kind]', params: { kind } })} />
    </Card>)}
    <Card><Heading size={20}>Businesses</Heading>{world.businesses.filter(item => item.ownerId === player.id && item.status === 'active').map(company => <ActionRow key={company.id} title={company.name} subtitle="Estimated company equity" value={formatMoney({ minor: businessValue(world, company), currency: company.currency })} onPress={() => router.push({ pathname: '/business/[id]', params: { id: company.id, tab: 'assets' } })} />)}<ActionRow title="Business Portfolio" icon={<FameBusinessArt id="business" size={44} />} onPress={() => router.push({ pathname: '/business', params: { tab: 'assets' } })} /></Card>
    <Card><Heading size={20}>Investments</Heading>{holdings.map(holding => <ActionRow key={holding.id} title={instruments[holding.instrumentId].name} subtitle={formatQuantity(holding.quantity, holding.instrumentId) + ' units'} value={formatMoney({ minor: investmentValue(world, holding.instrumentId, holding.quantity, accountFor(world).currency), currency: accountFor(world).currency })} onPress={() => router.push({ pathname: '/investment/[id]', params: { id: holding.instrumentId } })} />)}
      <ActionRow title="Stocks, Funds & Crypto" icon={<CatalogArt id="portfolio" size={44} />} onPress={() => router.push('/investments')} />
    </Card>
  </Page>;
}
