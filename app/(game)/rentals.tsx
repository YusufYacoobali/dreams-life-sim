import React from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { assetCatalog } from '../../src/game/content/assets';
import { rentalQuote } from '../../src/game/systems/rentalHomes';
import { rentalResidence } from '../../src/game/systems/rentalSchemas';
import { fullName } from '../../src/game/model';
import { formatMoney } from '../../src/game/money';
import { countries } from '../../src/game/countries';
import { CatalogArt } from '../../src/assets/CatalogArt';
import { ActionRow, Body, Card, Header, Heading, Page } from '../../src/ui/components';
import { AssetFeatures, AssetListing } from '../../src/ui/AssetFeatures';

export default function Rentals() {
  const world = useGame(s => s.world)!, player = world.people[world.activePersonId], lease = rentalResidence(world);
  const offers = assetCatalog.filter(offer => offer.kind === 'property').sort((a,b) => a.priceBps-b.priceBps);
  return <Page><Header title="Rent a Home" onBack={() => router.back()} />
    <Card><Heading>Find a place to call home</Heading><Body muted>{player.city}, {countries[player.country].name}</Body><Body>Find a home for your household. Check the monthly rent, then review the lease.</Body></Card>
    {lease && <Card><Heading size={19}>Your Rented Home</Heading><ActionRow title={lease.name} subtitle={'Leaseholder: ' + fullName(world.people[lease.tenantId])} value={formatMoney({minor:lease.monthlyRent,currency:lease.currency}) + ' / month'} icon={<CatalogArt id={lease.catalogId} size={56} />} onPress={() => router.push({pathname:'/rental/[id]',params:{id:lease.catalogId}})} /><AssetFeatures offer={assetCatalog.find(offer => offer.id === lease.catalogId)} /></Card>}
    <Card><Heading size={19}>Homes to Rent</Heading>{offers.map(offer => { const quote=rentalQuote(world,offer); return <AssetListing key={offer.id} offer={offer} value={formatMoney({minor:quote.monthlyRent,currency:quote.currency}) + ' / month'} onPress={() => router.push({pathname:'/rental/[id]',params:{id:offer.id}})} />; })}</Card>
  </Page>;
}
