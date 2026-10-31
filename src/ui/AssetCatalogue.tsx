import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../state/useGame';
import { assetCatalog } from '../game/content/assets';
import { assetPrice } from '../game/systems/assets';
import { rentalQuote } from '../game/systems/rentalHomes';
import { rentalResidence } from '../game/systems/rentalSchemas';
import { accountFor } from '../game/systems/common';
import { fullName } from '../game/model';
import { formatMoney } from '../game/money';
import { countries } from '../game/countries';
import { CatalogArt } from '../assets/CatalogArt';
import { Illustration } from '../assets/Illustration';
import { ActionRow, Body, Card, Header, Heading, Page } from './components';
import { AssetListing } from './AssetFeatures';

/** The rental bookmark is an adapter to this same complete property catalogue. */
export function AssetCatalogue({ kind, rentalEntry = false }: { kind: string; rentalEntry?: boolean }) {
  const world = useGame(s => s.world)!, player = world.people[world.activePersonId], currency = accountFor(world).currency;
  const lease = kind === 'property' ? rentalResidence(world) : undefined;
  const offers = assetCatalog.filter(offer => !offer.licenceKind || !!world.lifestyle).filter(offer => offer.kind === kind).sort((a, b) => a.priceBps - b.priceBps);
  const money = (minor: bigint) => formatMoney({ minor, currency });
  const title = kind === 'property' ? 'Real Estate' : kind === 'vehicle' ? 'Vehicles for Sale' : 'Possessions';
  return <Page><Header title={title} onBack={() => router.back()} />
    {!!offers.length && <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>{kind === 'possession' ? <CatalogArt id="watch" size={52} /> : <Illustration id={kind === 'property' ? 'property' : 'vehicle'} size={52} />}<View style={{ flex: 1, minWidth: 0 }}><Heading size={20}>{kind === 'property' ? 'Find Your Next Home' : kind === 'vehicle' ? 'Your Next Vehicle' : 'Shop Possessions'}</Heading><Body muted>{player.city}, {countries[player.country].name} · {currency}</Body></View></View><Body muted>{kind === 'property' ? 'Every home is available to buy outright, finance or rent. Choose a home to compare your options.' : 'Review the price and ongoing costs before buying.'}</Body></Card>}
    {lease && <Card><Heading size={19}>Your Rented Home</Heading><ActionRow title={lease.name} subtitle={'Leaseholder: ' + fullName(world.people[lease.tenantId])} value={formatMoney({ minor: lease.monthlyRent, currency: lease.currency }) + ' / month'} icon={<CatalogArt id={lease.catalogId} size={56} />} onPress={() => router.push({ pathname: '/offer/[id]', params: { id: lease.catalogId, method: 'rent' } })} /></Card>}
    <Card><Heading size={19}>Available Listings</Heading>{offers.map(offer => {
      const price = money(assetPrice(world, offer));
      const onPress = () => router.push({ pathname: '/offer/[id]', params: { id: offer.id, ...(rentalEntry && offer.kind === 'property' ? { method: 'rent' } : {}) } });
      return offer.kind === 'possession' ? <ActionRow key={offer.id} title={offer.name} subtitle={offer.description + ' · ' + offer.condition + '% condition'} value={price} icon={<CatalogArt id={offer.id} size={56} />} onPress={onPress} /> : <AssetListing key={offer.id} offer={offer} value={offer.kind === 'property' ? 'Buy ' + price : price} secondaryValue={offer.kind === 'property' ? 'Rent ' + money(rentalQuote(world, offer).monthlyRent) + ' / month' : undefined} onPress={onPress} />;
    })}{!offers.length && <Body>This category is unavailable.</Body>}</Card>
  </Page>;
}
