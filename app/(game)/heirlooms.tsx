import React from 'react';
import { View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { inheritedPossessions } from '../../src/progression/progress';
import { CatalogArt } from '../../src/assets/CatalogArt';
import { countries } from '../../src/game/countries';
import { formatMoney } from '../../src/game/money';
import { ActionRow, Body, Card, Header, Heading, Page } from '../../src/ui/components';
import { FamilyArt } from '../../src/assets/FamilyArt';

export default function Heirlooms() {
  const world = useGame(s => s.world);
  if (!world) return <Redirect href="/" />;
  const assets = inheritedPossessions(world);
  return <Page><Header title="Heirlooms" onBack={() => router.back()} />
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><FamilyArt id="gift" size={56} /><View style={{ flex: 1, minWidth: 0 }}><Heading size={21}>Your Collection</Heading><Body>{assets.length} inherited {assets.length === 1 ? 'possession' : 'possessions'} in your care</Body></View></View><Body muted>Possessions passed down to you, with their stories and ownership history.</Body></Card>
    {assets.length ? <Card><Heading size={19}>In Your Care</Heading>{assets.map(asset => <ActionRow key={asset.id} title={asset.name} subtitle={asset.provenance.at(-1) ?? 'Inherited possession'} icon={<CatalogArt id={asset.catalogId} size={44} />} value={formatMoney({ minor: asset.value, currency: asset.currency }, countries[asset.country].locale)} onPress={() => router.push({ pathname: '/asset/[id]', params: { id: asset.id, tab: 'activities' } })} />)}</Card> : <Card><FamilyArt id="family-tree" size={48} /><Body>No inherited possessions in your care yet.</Body><Body muted>Items inherited through an estate or family legacy appear here while you own them.</Body></Card>}
  </Page>;
}
