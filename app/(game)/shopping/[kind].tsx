import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { assetCatalog } from '../../../src/game/content/assets';
import { assetPrice } from '../../../src/game/systems/assets';
import { accountFor } from '../../../src/game/systems/common';
import { formatMoney } from '../../../src/game/money';
import { CatalogArt } from '../../../src/assets/CatalogArt';
import { ActionRow, Body, Card, Header, Page } from '../../../src/ui/components';

export default function Shopping() {
  const { kind } = useLocalSearchParams<{ kind: string }>(); const world = useGame(s => s.world)!;
  const title = kind === 'property' ? 'Real Estate' : kind === 'vehicle' ? 'Vehicles for Sale' : 'Possessions';
  const offers = assetCatalog.filter(offer => offer.kind === kind);
  return <Page><Header title={title} onBack={() => router.back()} /><Body muted>Review the price, funding and ongoing costs before buying.</Body>
    <Card>{offers.map(offer => <ActionRow key={offer.id} title={offer.name} subtitle={offer.description} value={formatMoney({ minor: assetPrice(world, offer), currency: accountFor(world).currency })} icon={<CatalogArt id={offer.id} size={56} />} onPress={() => router.push({ pathname: '/offer/[id]', params: { id: offer.id } })} />)}{offers.length === 0 && <Body>This category is unavailable.</Body>}</Card>
  </Page>;
}
