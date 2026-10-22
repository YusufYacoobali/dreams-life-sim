import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { assetCatalog } from '../../../src/game/content/assets';
import { assetPrice } from '../../../src/game/systems/assets';
import { accountFor } from '../../../src/game/systems/common';
import { formatMoney } from '../../../src/game/money';
import { CatalogArt } from '../../../src/assets/CatalogArt';
import { countries } from '../../../src/game/countries';
import { Illustration } from '../../../src/assets/Illustration';
import { ActionRow, Body, Card, Header, Heading, Page } from '../../../src/ui/components';

export default function Shopping() {
  const { kind } = useLocalSearchParams<{ kind: string }>(); const world = useGame(s => s.world)!;
  const title = kind === 'property' ? 'Real Estate' : kind === 'vehicle' ? 'Vehicles for Sale' : 'Possessions';
  const offers = assetCatalog.filter(offer => offer.kind === kind).sort((a,b) => a.priceBps-b.priceBps);
  return <Page><Header title={title} onBack={() => router.back()} />
    {offers.length > 0 && <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>{kind === 'possession' ? <CatalogArt id="watch" size={52} /> : <Illustration id={kind === 'property' ? 'property' : 'vehicle'} size={52} />}<View style={{ flex: 1, minWidth: 0 }}><Heading size={20}>{kind === 'property' ? 'Find Your Next Home' : kind === 'vehicle' ? 'Your Next Vehicle' : 'Shop Possessions'}</Heading><Body muted>{countries[world.people[world.activePersonId].country].name} · {accountFor(world).currency}</Body></View></View><Body muted>Review the price, funding and ongoing costs before buying.</Body></Card>}
    {kind === 'property' && <Card><ActionRow title="Rent a Home" subtitle="Browse monthly leases for your household" icon={<Illustration id="property" />} onPress={() => router.push('/rentals')} /></Card>}
    <Card><Heading size={19}>Available Listings</Heading>{offers.map(offer => <ActionRow key={offer.id} title={offer.name} subtitle={offer.description + (offer.bedrooms ? ' · ' + offer.bedrooms + (offer.bedrooms === 1 ? ' bedroom' : ' bedrooms') : '') + ' · ' + offer.condition + '% condition'} value={formatMoney({ minor: assetPrice(world, offer), currency: accountFor(world).currency })} icon={<CatalogArt id={offer.id} size={56} />} onPress={() => router.push({ pathname: '/offer/[id]', params: { id: offer.id } })} />)}{offers.length === 0 && <Body>This category is unavailable.</Body>}</Card>
  </Page>;
}
