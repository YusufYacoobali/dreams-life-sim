import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../state/useGame';
import type { GameCommand } from '../game/engine';
import { assetCatalog } from '../game/content/assets';
import { purchaseQuote, purchaseReason } from '../game/systems/assets';
import { rentalQuote, rentalReason } from '../game/systems/rentalHomes';
import { rentalResidence } from '../game/systems/rentalSchemas';
import { accountFor } from '../game/systems/common';
import { fullName } from '../game/model';
import { countries } from '../game/countries';
import { formatMoney } from '../game/money';
import { CatalogArt } from '../assets/CatalogArt';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from './components';
import { EventModal, type EventPresentation } from './EventModal';
import { SocialBusinessFacts as Facts } from './SocialBusinessPresentation';
import { AssetFeatures } from './AssetFeatures';
import { PropertyMethodSelector, type PropertyMethod } from './PropertyMethodSelector';
import { useColors } from './theme';
import { DisplayText as Text, displayText } from './DisplayText';

type Review = { identity: string; kind: 'deposit' | 'term' | 'transaction'; event: EventPresentation; command?: GameCommand };
const deposits = [2000, 4000, 6000, 8000], terms = [120, 240, 360] as const;

/** Both old rental links and offer links render this same detail and quote flow. */
export function AssetOfferPage({ id, initialMethod = 'cash', propertyOnly = false }: { id: string; initialMethod?: PropertyMethod; propertyOnly?: boolean }) {
  const identity = useGame(state => state.world ? state.world.id + ':' + state.world.activePersonId : 'none');
  return <OfferDetails key={identity + ':' + id + ':' + initialMethod} id={id} initialMethod={initialMethod} propertyOnly={propertyOnly} />;
}
function OfferDetails({ id, initialMethod, propertyOnly }: { id: string; initialMethod: PropertyMethod; propertyOnly: boolean }) {
  const world = useGame(s => s.world)!, dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors();
  const player = world.people[world.activePersonId], offer = assetCatalog.find(item => item.id === id);
  const [selection, setSelection] = useState<PropertyMethod>(initialMethod), [deposit, setDeposit] = useState(2000), [term, setTerm] = useState<120 | 240 | 360>(360);
  const method = offer?.kind === 'property' ? selection : 'cash', residence = rentalResidence(world), lease = residence?.catalogId === id ? residence : undefined;
  const identity = JSON.stringify([world.id, player.id, player.country, player.city, player.householdId, player.died, world.revision, id, method, deposit, term, residence?.id]);
  const identityRef = useRef(identity), mounted = useRef(true), submitting = useRef(false), reviewRef = useRef<Review | null>(null);
  identityRef.current = identity;
  if (reviewRef.current && reviewRef.current.identity !== identity) reviewRef.current = null;
  const [review, setReview] = useState<Review | null>(null), current = review?.identity === identity && reviewRef.current === review ? review : null;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; reviewRef.current = null; }; }, []);
  useEffect(() => { setReview(saved => saved && saved.identity !== identity ? null : saved); }, [identity]);
  if (!offer || propertyOnly && offer.kind !== 'property') return <Page><Header title="Offer unavailable" onBack={() => router.back()} /><Body>This item could not be found.</Body></Page>;
  const financing = method === 'mortgage' ? 'mortgage' : 'cash', quote = purchaseQuote(world, offer, financing, deposit, term), rentQuote = rentalQuote(world, offer);
  const currency = method === 'rent' && lease ? lease.currency : accountFor(world).currency, money = (minor: bigint) => formatMoney({ minor, currency });
  const rent = lease?.monthlyRent ?? rentQuote.monthlyRent, reason = method === 'rent' ? rentalReason(world, offer) : purchaseReason(world, offer, financing, deposit, term);
  const canAct = () => mounted.current && !busy && !submitting.current && identityRef.current === identity;
  const close = () => { reviewRef.current = null; setReview(null); };
  const present = (kind: Review['kind'], event: EventPresentation, command?: GameCommand) => {
    if (!canAct() || current) return;
    const next = { identity, kind, event, command }; reviewRef.current = next; setReview(next);
  };
  const selectMethod = (value: PropertyMethod) => { if (canAct() && !current && value !== method) { close(); setSelection(value); } };
  const reviewTransaction = () => {
    if (!canAct() || reason) return;
    if (method === 'rent') {
      present('transaction', { id: 'sign-lease:' + identity, kind: 'confirmation', title: 'Rent ' + offer.name + '?', body: 'Your household will move in. The first month is due now, with no deposit. Rent is due monthly until you move out; unpaid rent becomes debt.', terms: [{ id: 'rent', label: 'Monthly rent', value: money(rentQuote.monthlyRent), tone: 'negative' }, { id: 'today', label: 'Due today', value: money(rentQuote.monthlyRent), tone: 'negative' }, { id: 'lease-term', label: 'Lease term', value: 'Month to month', tone: 'neutral' }], confirmLabel: 'Sign Lease' }, { type: 'sign-home-lease', catalogId: offer.id, quotedRent: rentQuote.monthlyRent });
    } else {
      present('transaction', { id: 'buy:' + identity, kind: 'confirmation', title: 'Buy ' + offer.name + '?', body: method === 'mortgage' ? 'The deposit and purchase fees are due now. Monthly mortgage payments and ownership costs follow.' : 'You will own this asset and cover its ongoing costs. Sale fees apply when you sell.', terms: [{ id: 'price', label: 'Price', value: money(quote.price), tone: 'neutral' }, ...(method === 'mortgage' ? [{ id: 'deposit', label: 'Deposit', value: money(quote.deposit), tone: 'negative' as const }] : []), { id: 'fees', label: 'Purchase fees', value: money(quote.fee), tone: 'negative' }, { id: 'upfront', label: 'Cash paid upfront', value: money(quote.cashRequired), tone: 'negative' }, ...(quote.principal > 0n ? [{ id: 'debt', label: 'Mortgage principal', value: money(quote.principal), tone: 'neutral' as const }, { id: 'pay', label: 'Monthly payment', value: money(quote.payment), tone: 'neutral' as const }, { id: 'rate', label: 'Annual interest', value: quote.interestBps / 100 + '%', tone: 'neutral' as const }, { id: 'term', label: 'Mortgage term', value: term / 12 + ' years', tone: 'neutral' as const }] : [])], confirmLabel: 'Confirm Purchase' }, { type: 'buy-asset', catalogId: offer.id, financing, depositBps: deposit, termMonths: term, quotedPrice: quote.price });
    }
  };
  const reviewMoveOut = () => {
    if (!canAct() || !lease || lease.tenantId !== player.id) return;
    present('transaction', { id: 'end-lease:' + identity, kind: 'confirmation', title: 'Move out of ' + lease.name + '?', body: 'Future rent will stop. Your usual housing budget resumes. Rent already paid is not refunded.', terms: [], confirmLabel: 'Move Out' }, { type: 'end-home-lease', leaseId: lease.id });
  };
  return <Page><Header title={offer.kind === 'property' ? 'Property Details' : offer.kind === 'vehicle' ? 'Vehicle Details' : 'Item Details'} backDisabled={!!current && busy} onBack={() => { if (!busy && !submitting.current) router.back(); }} />
    <Card><View style={{ alignItems: 'center' }}><CatalogArt id={offer.id} size={190} /></View><Heading>{offer.name}</Heading><Body>{offer.description}</Body>{offer.kind === 'property' && <Body muted>{player.city}, {countries[player.country].name}</Body>}<Heading size={28}>{method === 'rent' ? money(rent) + ' / month' : money(quote.price)}</Heading><AssetFeatures offer={offer} />{offer.kind !== 'vehicle' && <Body muted>Condition: {offer.condition}%</Body>}</Card>
    {offer.kind === 'property' && <Card><PropertyMethodSelector value={method} disabled={busy || !!current} onChange={selectMethod} />
      {method === 'mortgage' && <><Heading size={18}>Mortgage terms</Heading><ActionRow title="Deposit" disabled={busy || !!current} value={deposit / 100 + '% · ' + money(quote.deposit)} onPress={() => { if (method === 'mortgage') present('deposit', { id: 'deposit:' + identity, kind: 'selection', title: 'Deposit', body: 'A larger deposit reduces borrowing and monthly payments.', choices: deposits.map(value => ({ id: value.toString(), label: value / 100 + '%' })), confirmLabel: 'Choose' }); }} /><ActionRow title="Term" disabled={busy || !!current} value={term / 12 + ' years'} onPress={() => { if (method === 'mortgage') present('term', { id: 'term:' + identity, kind: 'selection', title: 'Mortgage term', body: 'A longer term lowers each payment and increases total interest.', choices: terms.map(value => ({ id: value.toString(), label: value / 12 + ' years' })), confirmLabel: 'Choose' }); }} /><Facts items={[{ label: 'Mortgage principal', value: money(quote.principal) }, { label: 'Annual interest', value: quote.interestBps / 100 + '%' }, { label: 'Monthly payment', value: money(quote.payment) }]} /></>}
    </Card>}
    {method === 'rent' && lease ? <Card><Heading size={20}>Your Rented Home</Heading><Body>Leaseholder: {fullName(world.people[lease.tenantId])}</Body><Facts items={[{ label: 'Monthly rent', value: money(rent) }, { label: 'Lease term', value: 'Month to month' }]} /><Body muted>Rent is paid once a month by the leaseholder. Adults share the other household bills.</Body>{lease.tenantId === player.id ? <Button label="Review Move Out" tone="secondary" disabled={busy || !!current} onPress={reviewMoveOut} /> : <Body muted>Only the leaseholder can end this lease.</Body>}</Card> : <Card><Heading size={20}>{method === 'rent' ? 'Review your lease' : 'Review your costs'}</Heading><Facts items={method === 'rent' ? [{ label: 'Monthly rent', value: money(rentQuote.monthlyRent) }, { label: 'Due today', value: money(rentQuote.monthlyRent), note: 'First month · no deposit or signing fee' }, { label: 'Lease term', value: 'Month to month' }, { label: 'Account balance', value: money(accountFor(world).cash) }] : [{ label: 'Purchase fees', value: money(quote.fee) }, { label: 'Cash paid upfront', value: money(quote.cashRequired), note: method === 'mortgage' ? 'Deposit plus purchase fees' : 'Price plus purchase fees' }, { label: 'Account balance', value: money(accountFor(world).cash) }]} />
      {method === 'rent' && <Body muted>Rent replaces your usual housing costs. You still pay your share of other bills.</Body>}
      {method !== 'rent' && residence && <Body muted>Your current rental continues until you move out.</Body>}
      {reason && <Body>{reason}</Body>}
      {method === 'rent' && residence && <ActionRow title="Manage Your Rental" value={residence.name} onPress={() => router.push({ pathname: '/offer/[id]', params: { id: residence.catalogId, method: 'rent' } })} />}
      <Button label={method === 'rent' ? 'Review Lease' : 'Review Purchase'} disabled={busy || !!current || !!reason} accessibilityLabel={displayText([method === 'rent' ? 'Review Lease' : 'Review Purchase', reason].filter(Boolean).join('. '))} onPress={reviewTransaction} />
    </Card>}
    {error && !current && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 16 }}>{error}</Text>}
    <EventModal event={current?.event ?? null} busy={busy} error={current?.kind === 'transaction' ? error : undefined} onCancel={() => { if (canAct() && current && reviewRef.current === current) close(); }} onChoose={async value => {
      if (!canAct() || !current || reviewRef.current !== current || identityRef.current !== current.identity) return;
      if (current.kind === 'deposit') { const next = Number(value); if (deposits.includes(next)) { close(); setDeposit(next); } return; }
      if (current.kind === 'term') { const next = Number(value); if (next === 120 || next === 240 || next === 360) { close(); setTerm(next); } return; }
      if (!current.command || value !== 'confirm') return;
      submitting.current = true;
      try { if (await dispatch(current.command) && mounted.current && identityRef.current === current.identity && reviewRef.current === current) close(); }
      finally { submitting.current = false; }
    }} />
  </Page>;
}
