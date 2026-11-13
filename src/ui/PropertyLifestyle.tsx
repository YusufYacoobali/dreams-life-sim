import { useLifestyleWorld } from './useLifestyleWorld';
import React, { useState } from 'react';
import type { World } from '../game/model';
import { fullName } from '../game/personHelpers';
import { formatMoney } from '../game/money';
import { amenityIds } from '../game/systems/lifestyleSchemas';
import { amenities, amenityQuote, amenityReason, hasAmenity } from '../game/systems/propertyAmenities';
import { gatheringCost, namedTenancy } from '../game/systems/landlordTenancies';
import { lifestyleReason, localContactReason } from '../game/systems/lifestyleCommon';
import { useLifestyleReview } from './LifestyleReview';
import { PersonPicker } from './PersonPicker';
import { LandlordDashboard } from './LandlordDashboard';
import { EventModal } from './EventModal';
import { CatalogArt } from '../assets/CatalogArt';
import { ActionRow, Body, Card, Heading } from './components';
export function PropertyLifestyle({ asset: savedAsset }: {
    asset: World['assets'][number];
}) {
    const world = useLifestyleWorld()!, { ask, modal, busy } = useLifestyleReview(), [section, setSection] = useState<'amenities' | 'tenants' | 'gatherings' | null>(null), [gathering, setGathering] = useState<'party' | 'dinner' | 'celebration'>('dinner'), [choosePerson, setChoosePerson] = useState(false);
    const asset = world.assets.find(row => row.id === savedAsset.id) ?? savedAsset;
    const state = world.lifestyle, player = world.people[world.activePersonId], reason = lifestyleReason(world), money = (minor: bigint) => formatMoney({ minor, currency: asset.currency }), row = namedTenancy(world, asset.id);
    if (!state)
        return null;
    if (!asset.propertyLife) return null;
    return <>{(!row || amenityIds.some(kind => hasAmenity(asset, kind))) && <Card><Heading size={18}>{row ? 'Home Improvements' : 'Life at Home'}</Heading><Body muted>{amenityIds.filter(kind => hasAmenity(asset, kind)).map(kind => amenities[kind].name).join(' · ') || 'No added amenities'}</Body>{!row && <ActionRow title="Inspect the Property" subtitle="Review actual condition without paying for work" disabled={busy} disabledReason={reason} onPress={() => ask({ type: 'inspect-property', assetId: asset.id }, 'Inspect the property?', 'Review its actual condition. No repair or installation is paid. Inspections respect a six-month interval.')}/>}{asset.rental === 'none' && <ActionRow title="Improve the Home" subtitle="Review installations and their actual benefits" onPress={() => setSection(section === 'amenities' ? null : 'amenities')}/>}{!row && <ActionRow title="Landlord & Tenants" subtitle="Applications and rental terms" onPress={() => setSection(section === 'tenants' ? null : 'tenants')}/>}{asset.primaryHome && asset.rental === 'none' && <ActionRow title="Host a Gathering" subtitle="Invite an actual contact to your primary home" onPress={() => setSection(section === 'gatherings' ? null : 'gatherings')}/>}</Card>}
  {section === 'amenities' && <Card><Heading size={18}>Home Improvements</Heading>{amenityIds.map(kind => { const quote = amenityQuote(asset, kind); return <ActionRow key={kind} title={amenities[kind].name} subtitle={amenities[kind].benefit} value={hasAmenity(asset, kind) ? 'Installed / built in' : money(quote.cost)} disabled={busy} disabledReason={reason ?? amenityReason(asset, kind, world)} onPress={() => ask({ type: 'install-amenity', assetId: asset.id, amenity: kind, quotedCost: quote.cost }, 'Install ' + amenities[kind].name.toLowerCase() + '?', amenities[kind].benefit + ' This is a single saved installation; existing built-in features cannot be duplicated.', [{ id: 'cost', label: 'Installation', value: money(quote.cost), tone: 'negative' }, { id: 'value', label: 'Estimated added value', value: money(quote.addedValue), tone: 'positive' }])}/>; })}</Card>}
  {(section === 'tenants' || row) && <LandlordDashboard key={world.id + ':' + asset.id + ':' + row?.id} world={world} asset={asset} />}
  <EventModal event={section === 'gatherings' ? { kind: 'selection', id: 'home-occasion:' + asset.id, title: 'Choose an Occasion', body: 'Invite someone to spend time at home.', illustration: <CatalogArt id={asset.catalogId} size={64} />, choices: (['dinner', 'party', 'celebration'] as const).map(id => ({ id, label: { dinner: 'Family Dinner', party: 'House Party', celebration: 'Celebrate an Occasion' }[id] + ' · ' + money(gatheringCost(world, id)) })), confirmLabel: 'Choose Occasion' } : null} busy={busy} onCancel={() => setSection(null)} onChoose={id => { if (busy || !['dinner', 'party', 'celebration'].includes(id)) return; setGathering(id as typeof gathering); setSection(null); setChoosePerson(true); }} />{choosePerson && <PersonPicker world={world} title="Invite Someone Home" personIds={world.relationships.filter(edge => edge.from === player.id || edge.to === player.id).map(edge => edge.from === player.id ? edge.to : edge.from)} busy={busy} eligibility={id => localContactReason(world, id, gathering !== 'party')} onCancel={() => setChoosePerson(false)} onChoose={id => { setChoosePerson(false); ask({ type: 'home-gathering', assetId: asset.id, activity: gathering, contactId: id, quotedCost: gatheringCost(world, gathering) }, 'Invite ' + fullName(world.people[id]) + '?', 'Spend time together at home.', [{ id: 'cost', label: 'Cost if accepted', value: money(gatheringCost(world, gathering)), tone: 'negative' }], <CatalogArt id={asset.catalogId} size={64} />); }} />}{modal}</>;
}
