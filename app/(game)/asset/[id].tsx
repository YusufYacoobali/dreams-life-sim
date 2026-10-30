import React, { useState } from 'react';
import { Keyboard, TextInput, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { GameCommand } from '../../../src/game/engine';
import { monthlyInsurance, monthlyRent, monthlyUpkeep, mortgageInterestBps, mortgagePayment, refinanceFee, renovationQuote, saleQuote } from '../../../src/game/systems/assets';
import { formatMoney, parseMoney } from '../../../src/game/money';
import { CatalogArt } from '../../../src/assets/CatalogArt';
import { assetCatalog } from '../../../src/game/content/assets';
import { ActionRow, Body, Button, Card, Header, Heading, Page, StatBar } from '../../../src/ui/components';
import { EventModal, EventPresentation, EffectRow } from '../../../src/ui/EventModal';
import { useColors } from '../../../src/ui/theme';
import { stolenAssetReason } from '../../../src/game/systems/stolenVehicles';
import { AssetFeatures } from '../../../src/ui/AssetFeatures';
import { DisplayText as Text, displayText } from '../../../src/ui/DisplayText';

export default function AssetDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const identity = useGame(state => state.world ? state.world.id + ':' + state.world.activePersonId : 'none');
  return <OwnedAsset key={identity + ':' + id} id={id} />;
}

function OwnedAsset({ id }: { id: string }) {
  const world = useGame(s => s.world)!; const dispatch = useGame(s => s.dispatch); const busy = useGame(s => s.busy); const error = useGame(s => s.error); const c = useColors();
  const { width, fontScale } = useWindowDimensions(), stacked = width < 360 || fontScale >= 1.2;
  const [review, setReview] = useState<{ command: GameCommand; event: EventPresentation } | null>(null);
  const [form, setForm] = useState<'listing' | 'refinance' | null>(null); const [input, setInput] = useState(''); const [message, setMessage] = useState<string | null>(null); const [term, setTerm] = useState<120 | 240 | 360>(360); const [pickTerm, setPickTerm] = useState(false);
  const asset = world.assets.find(item => item.id === id && item.ownerId === world.activePersonId);
  if (!asset) return <Page><Header title="Asset" onBack={() => router.back()} /><Card><Body>This asset is no longer in your ownership.</Body><Button label="View My Assets" onPress={() => router.navigate('/assets')} /></Card></Page>;
  const money = (minor: bigint) => formatMoney({ minor, currency: asset.currency }); const loan = world.liabilities.find(item => item.id === asset.mortgageId);
  const catalog = assetCatalog.find(item => item.id === asset.catalogId), ownershipDate = asset.titleSince.year + '-' + String(asset.titleSince.month).padStart(2, '0') + '-' + String(asset.titleSince.day).padStart(2, '0');
  const ask = (command: GameCommand, title: string, body: string, terms: EffectRow[] = []) => { if (busy) return; Keyboard.dismiss(); setReview({ command, event: { id: 'asset-action:' + command.type, kind: 'confirmation', title, body, terms, confirmLabel: 'Confirm' } }); };
  const fieldAmount = (fallback: bigint): bigint | null => { try { const value = input.trim() ? parseMoney(input, asset.currency).minor : fallback; if (value <= 0n) throw new Error(); setMessage(null); return value; } catch { setMessage('Enter a positive amount in ' + asset.currency + '.'); return null; } };
  const termEvent: EventPresentation | null = pickTerm ? { id: 'refinance-term', kind: 'selection', title: 'New mortgage term', body: 'The new term changes your payment and total interest.', choices: [120, 240, 360].map(months => ({ id: months.toString(), label: months / 12 + ' years' })), confirmLabel: 'Choose' } : null;
  return <Page><Header title={asset.kind === 'property' ? 'Property Details' : asset.kind === 'vehicle' ? 'Vehicle Details' : 'Possession'} onBack={() => router.back()} />
    <Card><View style={{ alignItems: 'center', backgroundColor: c.inset, borderRadius: 14, padding: 12 }}><CatalogArt id={asset.catalogId} size={180} /></View><Heading>{asset.name}</Heading><Body muted>{asset.city} · {asset.country}</Body><View style={{ gap: 4 }}><Body muted>Current value</Body><Text accessibilityRole="header" style={{ color: c.positiveText, fontSize: 28, lineHeight: 37, fontWeight: '700' }}>{money(asset.value)}</Text></View><AssetFeatures offer={catalog} condition={asset.condition} />{asset.kind !== 'vehicle' && <StatBar label="Condition" value={asset.condition} color={c.green} />}
      {asset.primaryHome && <Body>Your primary home</Body>}{asset.rental !== 'none' && <Body>{asset.rental === 'listed' ? 'Looking for a tenant' : 'Rented out · ' + money(asset.rentPerMonth) + ' / month'}</Body>}
    </Card>
    <Card><Heading size={19}>Ownership & Costs</Heading>
      {asset.ownershipSource === 'purchase' && <OwnershipFact label="Purchase price" value={money(asset.pricePaid)} stacked={stacked} />}
      <OwnershipFact label={asset.ownershipSource === 'legacy' ? 'Ownership date on record' : 'Owned since'} value={ownershipDate} stacked={stacked} />
      {asset.ownershipSource === 'inheritance' && <Body muted>Inherited ownership. The previous owner's purchase price is not a payment by you.</Body>}
      {asset.ownershipSource === 'gift' && <Body muted>Received as a gift.</Body>}
      {asset.stolen?.status === 'held' && <Body muted>Stolen vehicle · no lawful title. No purchase payment was made. The registered owner and theft incident remain on record. It cannot be sold or insured and may be seized.</Body>}
      {asset.stolen?.status === 'recovered' && <Body muted>Recovered by the registered owner after a recorded theft. No purchase payment was made for the recovery.</Body>}
      {asset.ownershipSource === 'legacy' && <Body muted>This earlier record does not identify how you acquired the asset.</Body>}
      {loan && loan.principal > 0n && <OwnershipFact label="Mortgage remaining" value={money(loan.principal)} stacked={stacked} debt />}
      <OwnershipFact label="Estimated monthly upkeep" value={money(monthlyUpkeep(asset))} stacked={stacked} />
      {asset.insured && <OwnershipFact label="Monthly insurance" value={money(monthlyInsurance(asset))} stacked={stacked} />}
    </Card>
    {(message || error) && !review && !pickTerm && <Card><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{message ?? error}</Text></Card>}
    {loan && loan.principal > 0n && <Card><Heading size={19}>Mortgage</Heading><Body>Outstanding: {money(loan.principal)}</Body><Body>Payment: {money(loan.monthlyPayment)} / month</Body><Body muted>{loan.interestBps / 100}% annual interest · {loan.remainingMonths} months remaining</Body>{loan.missedPayments > 0 && <Body>{loan.missedPayments} missed payments. Six missed payments trigger repossession.</Body>}<ActionRow disabled={busy} title="Make an extra payment" subtitle="Pay down the actual principal" onPress={() => router.push('/bank')} /><ActionRow disabled={busy} title="Refinance" subtitle="Review a new principal and term" onPress={() => { setForm('refinance'); setInput(''); setMessage(null); }} /></Card>}
    {asset.listing && <Card><Heading size={18}>For Sale</Heading><Body>Asking price: {money(asset.listing.askingPrice)}</Body><Body muted>You still own it and pay its costs while you wait.</Body><ActionRow disabled={busy} title="Remove Listing" onPress={() => { void dispatch({ type: 'cancel-listing', assetId: asset.id }); }} /></Card>}
    <Card><Heading size={18}>Manage</Heading>
      {asset.stolen?.status === 'held' && <ActionRow disabled={busy} title="Return Stolen Vehicle" subtitle="Return it without payment; the theft remains on record" onPress={() => ask({ type: 'return-stolen-vehicle', assetId: asset.id }, 'Return this vehicle?', 'The vehicle returns to its recorded owner with no cash payment. Any investigation or court case remains in place.')} />}
      {asset.kind === 'property' ? <>
        {asset.rental === 'none' && <ActionRow disabled={busy} title="Rent Out" disabledReason={asset.listing ? 'Remove the sale listing first' : undefined} onPress={() => ask({ type: 'rent-property', assetId: asset.id }, 'Offer this home for rent?', 'A tenant may move in as months pass. You stop using it as your primary home and keep its costs.', [{ id: 'rent', label: 'Monthly asking rent', value: money(monthlyRent(asset)), tone: 'positive' }])} />}
        {asset.rental !== 'none' && <ActionRow disabled={busy} title="End Rental" onPress={() => ask({ type: 'stop-renting', assetId: asset.id }, 'End the rental arrangement?', 'Future rent stops. You still own the property.')} />}
        {!asset.primaryHome && <ActionRow disabled={busy} title="Move In" disabledReason={asset.rental !== 'none' ? 'End the rental first' : asset.listing ? 'Remove the sale listing first' : asset.country !== world.people[world.activePersonId].country ? 'This home is abroad' : undefined} onPress={() => ask({ type: 'move-in', assetId: asset.id }, 'Make this your home?', 'Your primary residence changes and the housing part of ordinary living costs is reduced.')} />}
        {!asset.listing && <ActionRow disabled={busy} title="Sell Property" subtitle="Choose a price and wait for offers" onPress={() => { setForm('listing'); setInput(''); setMessage(null); }} />}
      </> : <ActionRow disabled={busy} disabledReason={stolenAssetReason(asset)} title={asset.kind === 'vehicle' ? 'Sell Vehicle' : 'Sell Item'} onPress={() => { const quote = saleQuote(world, asset); ask({ type: 'sell-asset', assetId: asset.id, quotedPrice: quote.price }, 'Accept this sale offer?', 'Ownership ends when the sale settles. The offered amount includes a trading discount.', [{ id: 'net', label: 'Net proceeds', value: money(quote.proceeds), tone: 'positive' }]); }} />}
      <ActionRow disabled={busy} title={asset.kind === 'vehicle' ? 'Repair & Improve' : 'Renovate / Restore'} disabledReason={stolenAssetReason(asset) ?? (asset.condition >= 95 ? 'Already in excellent condition' : undefined)} onPress={() => { const quote = renovationQuote(asset); ask({ type: 'renovate', assetId: asset.id }, 'Improve this asset?', 'Paid work improves condition by up to 20 points and changes its estimated value.', [{ id: 'cost', label: 'Cost', value: money(quote.cost), tone: 'negative' }, { id: 'value', label: 'Estimated added value', value: money(quote.addedValue), tone: 'positive' }]); }} />
      {asset.kind !== 'possession' && <ActionRow disabled={busy} disabledReason={stolenAssetReason(asset)} title={asset.insured ? 'End Insurance' : 'Insure This Asset'} onPress={() => ask({ type: 'insure', assetId: asset.id, enabled: !asset.insured }, asset.insured ? 'End this cover?' : 'Activate this cover?', asset.insured ? 'Premiums stop. Future asset damage will be uninsured.' : 'Cover pays 80% of the recorded value lost in an asset incident. Premiums are charged monthly.', [{ id: 'premium', label: 'Current monthly premium', value: money(monthlyInsurance(asset)), tone: 'neutral' }])} />}
    </Card>
    {form && <Card><Heading size={18}>{form === 'listing' ? 'Asking Price' : 'New Mortgage Principal'}</Heading><TextInput accessibilityLabel={displayText(form === 'listing' ? 'Asking price' : 'New mortgage principal')} keyboardType="decimal-pad" editable={!busy} accessibilityState={{ disabled: busy }} value={input} onChangeText={value => { setInput(value); setMessage(null); }} placeholder={money(form === 'listing' ? asset.value : loan?.principal ?? 0n)} placeholderTextColor={c.muted} style={{ color: c.ink, backgroundColor: c.inset, padding: 14, borderRadius: 10, fontSize: 18 }} />
      {form === 'refinance' && <ActionRow disabled={busy} title="New term" value={term / 12 + ' years'} onPress={() => setPickTerm(true)} />}
      <Button label={form === 'listing' ? 'Review Listing' : 'Review Refinancing'} disabled={busy} onPress={() => {
        const value = fieldAmount(form === 'listing' ? asset.value : loan?.principal ?? 0n); if (!value) return;
        if (form === 'refinance' && loan && value === loan.principal && term === loan.remainingMonths && mortgageInterestBps(world) === loan.interestBps) { setMessage('These are already your current mortgage terms.'); return; }
        if (form === 'listing') ask({ type: 'list-property', assetId: asset.id, askingPrice: value }, 'List at this price?', 'Higher asking prices can mean a longer wait. Buyers may offer less than your asking price. You remain responsible for the property until it sells.', [{ id: 'ask', label: 'Asking price', value: money(value), tone: 'neutral' }]);
        else ask({ type: 'refinance', assetId: asset.id, principal: value, termMonths: term }, 'Refinance this mortgage?', 'The new loan settles the old principal. Fees and any cash released change your balance and debt together.', [{ id: 'principal', label: 'New principal', value: money(value), tone: 'neutral' }, { id: 'rate', label: 'Annual interest', value: mortgageInterestBps(world) / 100 + '%', tone: 'neutral' }, { id: 'payment', label: 'Monthly payment', value: money(mortgagePayment(value, mortgageInterestBps(world), term)), tone: 'neutral' }, { id: 'fee', label: 'Refinancing fee', value: money(refinanceFee(value)), tone: 'negative' }]);
      }} />
    </Card>}
    <Card><Heading size={17}>History</Heading>{asset.provenance.map((entry, index) => <Body muted key={index}>{entry}</Body>)}</Card>
    <EventModal event={review?.event ?? termEvent} busy={busy} error={review ? error : undefined} onCancel={() => { setReview(null); setPickTerm(false); }} onChoose={async value => {
      if (busy) return;
      if (pickTerm && !review) { setTerm(Number(value) as 120 | 240 | 360); setMessage(null); setPickTerm(false); }
      else if (review && await dispatch(review.command)) { setReview(null); setForm(null); }
    }} />
  </Page>;
}

function OwnershipFact({ label, value, stacked, debt = false }: { label: string; value: string; stacked: boolean; debt?: boolean }) {
  const c = useColors();
  return <View accessible accessibilityLabel={displayText(label + ': ' + value)} style={{ flexDirection: stacked ? 'column' : 'row', gap: 6, borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 12 }}>
    <View style={stacked ? undefined : { flex: 1, minWidth: 0 }}><Body muted>{label}</Body></View>
    <Text style={{ flex: stacked ? undefined : 1, minWidth: 0, color: debt ? c.red : c.ink, fontSize: 16, lineHeight: 23, fontWeight: '600', textAlign: stacked ? 'left' : 'right' }}>{value}</Text>
  </View>;
}
