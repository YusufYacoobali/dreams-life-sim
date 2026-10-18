import React, { useState } from 'react';
import { Keyboard, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { InstrumentId, instrumentIds, instruments } from '../../../src/game/content/markets';
import { formatQuantity, investmentQuote, investmentValue, parseQuantity } from '../../../src/game/systems/markets';
import { accountFor } from '../../../src/game/systems/common';
import { formatMoney } from '../../../src/game/money';
import { ageOn } from '../../../src/game/model';
import { rules } from '../../../src/game/rules';
import { GameCommand } from '../../../src/game/engine';
import { CatalogArt } from '../../../src/assets/CatalogArt';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../../src/ui/components';
import { EventModal, EventPresentation } from '../../../src/ui/EventModal';
import { useColors } from '../../../src/ui/theme';

export default function Investment() {
  const params = useLocalSearchParams<{ id: string }>(); const world = useGame(s => s.world)!; const dispatch = useGame(s => s.dispatch); const busy = useGame(s => s.busy); const error = useGame(s => s.error); const c = useColors();
  const [side, setSide] = useState<'buy' | 'sell'>('buy'); const [input, setInput] = useState('1'); const [holdingId, setHoldingId] = useState<string | null>(null); const [months, setMonths] = useState(60); const [message, setMessage] = useState<string | null>(null); const [review, setReview] = useState<{ command: GameCommand; event: EventPresentation } | null>(null);
  const id = params.id as InstrumentId;
  if (!instrumentIds.includes(id)) return <Page><Header title="Investment" onBack={() => router.back()} /><Body>This instrument is unavailable.</Body></Page>;
  const instrument = instruments[id]; const account = accountFor(world); const person = world.people[world.activePersonId];
  const holdings = world.holdings.filter(holding => holding.ownerId === person.id && holding.instrumentId === id && holding.quantity > 0n);
  const holding = holdings.find(item => item.id === holdingId) ?? holdings[0]; const history = world.market.prices[id].history.slice(-months);
  const min = history.reduce((value, point) => point.minor < value ? point.minor : value, history[0].minor); const max = history.reduce((value, point) => point.minor > value ? point.minor : value, history[0].minor); const span = max - min;
  const money = (minor: bigint) => formatMoney({ minor, currency: account.currency });
  const adult = ageOn(person, world.date) >= rules[person.country].adultAge;
  const reviewTrade = () => {
    try {
      const quantity = parseQuantity(input, id); const quote = investmentQuote(world, id, quantity);
      if (quote.value <= 0n) throw new Error('This quantity is too small to trade in your currency.');
      if (side === 'sell' && (!holding || quantity > holding.quantity)) throw new Error('You do not own that quantity.');
      if (side === 'buy' && quote.buyCost > account.cash) throw new Error('Your balance cannot cover this order and its fee.');
      const command: GameCommand = side === 'buy' ? { type: 'buy-investment', instrumentId: id, quantity, quotedMinor: quote.value } : { type: 'sell-investment', holdingId: holding!.id, quantity, quotedMinor: quote.value };
      Keyboard.dismiss(); setMessage(null);
      setReview({ command, event: { id: 'trade:' + id, kind: 'confirmation', title: (side === 'buy' ? 'Buy ' : 'Sell ') + id + '?', body: side === 'buy' ? 'Your cash moves into a real holding. Its price can rise or fall.' : 'The selected quantity leaves your holding and the proceeds enter your bank balance. Positive realised gains count towards taxable income.', terms: [{ id: 'quantity', label: 'Quantity', value: formatQuantity(quantity, id), tone: 'neutral' }, { id: 'value', label: 'Order value', value: money(quote.value), tone: 'neutral' }, { id: 'fee', label: 'Trading fee', value: money(quote.fee), tone: 'negative' }, { id: 'total', label: side === 'buy' ? 'Cash paid' : 'Net proceeds', value: money(side === 'buy' ? quote.buyCost : quote.sellProceeds), tone: side === 'buy' ? 'negative' : 'positive' }], confirmLabel: side === 'buy' ? 'Confirm Purchase' : 'Confirm Sale' } });
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Check your quantity.'); }
  };
  return <Page><Header title={id} onBack={() => router.back()} /><Card><CatalogArt id="portfolio" size={64} /><Heading>{instrument.name}</Heading><Heading size={30}>{money(investmentValue(world, id, instrument.unitScale, account.currency))}</Heading><Body muted>Current price per unit</Body></Card>
    <Card><Heading size={18}>Price history · USD</Heading><View style={{ flexDirection: 'row', gap: 8 }}><View style={{ flex: 1 }}><Button label="1 Year" tone={months === 12 ? 'primary' : 'secondary'} onPress={() => setMonths(12)} /></View><View style={{ flex: 1 }}><Button label="5 Years" tone={months === 60 ? 'primary' : 'secondary'} onPress={() => setMonths(60)} /></View></View>
      <View accessible accessibilityLabel={'Price history from ' + history[0].year + '-' + history[0].month + ' to ' + history[history.length - 1].year + '-' + history[history.length - 1].month} style={{ height: 110, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>{history.map((point, index) => <View key={index} style={{ flex: 1, backgroundColor: c.blue, borderRadius: 2, height: span ? Number((point.minor - min) * 88n / span) + 22 : 60 }} />)}</View><Body muted>{formatMoney({ minor: min, currency: 'USD' })} – {formatMoney({ minor: max, currency: 'USD' })}{history.length < months ? ' · history available since this market began' : ''}</Body>
    </Card>
    {holdings.length > 0 && <Card><Heading size={18}>Your holdings</Heading>{holdings.map(item => <ActionRow key={item.id} title={formatQuantity(item.quantity, id) + ' units'} subtitle={'Cost basis: ' + formatMoney({ minor: item.costBasis, currency: item.currency })} value={money(investmentValue(world, id, item.quantity, account.currency))} onPress={() => { setHoldingId(item.id); setSide('sell'); setInput(formatQuantity(item.quantity, id)); }} />)}</Card>}
    <Card><View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Button label="Buy" tone={side === 'buy' ? 'primary' : 'secondary'} onPress={() => setSide('buy')} /></View><View style={{ flex: 1 }}><Button label="Sell" disabled={holdings.length === 0} tone={side === 'sell' ? 'primary' : 'secondary'} onPress={() => setSide('sell')} /></View></View><Text style={{ color: c.ink, fontWeight: '600' }}>Quantity</Text><TextInput accessibilityLabel="Trade quantity" value={input} onChangeText={setInput} keyboardType="decimal-pad" style={{ color: c.ink, backgroundColor: c.inset, fontSize: 20, padding: 14, borderRadius: 10 }} /><Body muted>Available cash: {money(account.cash)}</Body>{side === 'sell' && holding && <Body muted>Selected holding: {formatQuantity(holding.quantity, id)} units</Body>}{!adult && <Body>Investing is available from age {rules[person.country].adultAge}.</Body>}{(message || error) && <Body>{message ?? error}</Body>}<Button label="Review Trade" disabled={!adult} busy={busy} onPress={reviewTrade} /></Card>
    <EventModal event={review?.event ?? null} busy={busy} onCancel={() => setReview(null)} onChoose={() => { if (review) { const command = review.command; setReview(null); void dispatch(command); } }} />
  </Page>;
}
