import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { assetCatalog } from '../../../src/game/content/assets';
import { purchaseQuote, purchaseReason } from '../../../src/game/systems/assets';
import { accountFor } from '../../../src/game/systems/common';
import { formatMoney } from '../../../src/game/money';
import { CatalogArt } from '../../../src/assets/CatalogArt';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../../src/ui/components';
import { EventModal, EventPresentation } from '../../../src/ui/EventModal';

export default function Offer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const identity = useGame(state => state.world ? state.world.id + ':' + state.world.activePersonId : 'none');
  return <OfferDetails key={identity + ':' + id} id={id} />;
}

function OfferDetails({ id }: { id: string }) {
  const world = useGame(s => s.world)!; const dispatch = useGame(s => s.dispatch); const busy = useGame(s => s.busy); const error = useGame(s => s.error);
  const [financing, setFinancing] = useState<'cash' | 'mortgage'>('cash'); const [deposit, setDeposit] = useState(2000); const [term, setTerm] = useState<120 | 240 | 360>(360); const [dialog, setDialog] = useState<'deposit' | 'term' | 'confirm' | null>(null);
  const offer = assetCatalog.find(item => item.id === id);
  if (!offer) return <Page><Header title="Offer unavailable" onBack={() => router.back()} /><Body>This item could not be found.</Body></Page>;
  const quote = purchaseQuote(world, offer, financing, deposit, term); const reason = purchaseReason(world, offer, financing, deposit, term); const currency = accountFor(world).currency;
  const money = (minor: bigint) => formatMoney({ minor, currency });
  const event: EventPresentation | null = dialog === 'deposit' ? { id: 'deposit', kind: 'selection', title: 'Deposit', body: 'A larger deposit reduces borrowing and monthly payments.', choices: [2000, 4000, 6000, 8000].map(value => ({ id: value.toString(), label: value / 100 + '%' })), confirmLabel: 'Choose' } : dialog === 'term' ? { id: 'mortgage-term', kind: 'selection', title: 'Mortgage term', body: 'Longer terms reduce monthly payments and increase total interest over time.', choices: [120, 240, 360].map(value => ({ id: value.toString(), label: value / 12 + ' years' })), confirmLabel: 'Choose' } : dialog === 'confirm' ? { id: 'buy:' + offer.id, kind: 'confirmation', title: 'Buy ' + offer.name + '?', body: offer.kind === 'property' ? 'The purchase creates ownership and its costs. Sale fees apply when you sell. A mortgage is a real liability against this property.' : 'Your balance pays for this item. Its value and ongoing costs change as time passes.', terms: [{ id: 'price', label: 'Price', value: money(quote.price), tone: 'neutral' }, { id: 'fees', label: 'Purchase fees', value: money(quote.fee), tone: 'negative' }, { id: 'upfront', label: 'Cash paid upfront', value: money(quote.cashRequired), tone: 'negative' }, ...(quote.principal > 0n ? [{ id: 'debt', label: 'Mortgage principal', value: money(quote.principal), tone: 'neutral' as const }, { id: 'pay', label: 'Monthly payment', value: money(quote.payment), tone: 'neutral' as const }] : [])], confirmLabel: 'Confirm Purchase' } : null;
  return <Page><Header title={offer.kind === 'property' ? 'Property Details' : offer.kind === 'vehicle' ? 'Vehicle Details' : 'Item Details'} onBack={() => router.back()} /><Card><View style={{ alignItems: 'center' }}><CatalogArt id={offer.id} size={190} /></View><Heading>{offer.name}</Heading><Body>{offer.description}</Body><Heading size={28}>{money(quote.price)}</Heading><Body muted>Condition: {offer.condition}%</Body></Card>
    {offer.kind === 'property' && <Card><Heading size={18}>Funding</Heading><View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Button label="Cash" tone={financing === 'cash' ? 'primary' : 'secondary'} disabled={busy} onPress={() => setFinancing('cash')} /></View><View style={{ flex: 1 }}><Button label="Mortgage" tone={financing === 'mortgage' ? 'primary' : 'secondary'} disabled={busy} onPress={() => setFinancing('mortgage')} /></View></View>{financing === 'mortgage' && <><ActionRow title="Deposit" disabled={busy} value={deposit / 100 + '% · ' + money(quote.deposit)} onPress={() => setDialog('deposit')} /><ActionRow title="Term" disabled={busy} value={term / 12 + ' years'} onPress={() => setDialog('term')} /><Body>Annual interest: {quote.interestBps / 100}%</Body><Body>Monthly payment: {money(quote.payment)}</Body></>}</Card>}
    <Card><Body>Cash required: {money(quote.cashRequired)}</Body><Body muted>Available: {money(accountFor(world).cash)}</Body>{reason && <Body>{reason}</Body>}{error && !dialog && <Body>{error}</Body>}<Button label="Review Purchase" disabled={busy || !!reason} onPress={() => setDialog('confirm')} /></Card>
    <EventModal event={event} busy={busy} error={dialog === 'confirm' ? error : undefined} onCancel={() => setDialog(null)} onChoose={async value => {
      if (busy || !dialog) return;
      if (dialog === 'deposit') { setDeposit(Number(value)); setDialog(null); }
      else if (dialog === 'term') { setTerm(Number(value) as 120 | 240 | 360); setDialog(null); }
      else if (await dispatch({ type: 'buy-asset', catalogId: offer.id, financing, depositBps: deposit, termMonths: term, quotedPrice: quote.price })) setDialog(null);
    }} />
  </Page>;
}
