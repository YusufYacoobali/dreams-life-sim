import React from 'react';
import { Redirect, router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { inheritedPossessions } from '../../src/progression/progress';
import { CatalogArt } from '../../src/assets/CatalogArt';
import { countries } from '../../src/game/countries';
import { formatMoney } from '../../src/game/money';
import { ActionRow, Body, Card, Header, Page } from '../../src/ui/components';

export default function Heirlooms() {
  const world = useGame(s => s.world);
  if (!world) return <Redirect href="/" />;
  const assets = inheritedPossessions(world);
  return <Page><Header title="Heirlooms" onBack={() => router.back()} /><Body muted>Possessions passed down to you, with their stories and ownership history.</Body>
    {assets.length ? <Card>{assets.map(asset => <ActionRow key={asset.id} title={asset.name} subtitle={asset.provenance.at(-1) ?? 'Inherited possession'} icon={<CatalogArt id={asset.catalogId} size={44} />} value={formatMoney({ minor: asset.value, currency: asset.currency }, countries[asset.country].locale)} onPress={() => router.push({ pathname: '/asset/[id]', params: { id: asset.id, tab: 'activities' } })} />)}</Card> : <Card><Body>No inherited possessions in your care yet.</Body><Body muted>Items inherited through an estate or family legacy appear here while you own them.</Body></Card>}
  </Page>;
}
