import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { instruments, instrumentIds } from '../../src/game/content/markets';
import { formatQuantity, investmentValue, portfolioValue } from '../../src/game/systems/markets';
import { accountFor } from '../../src/game/systems/common';
import { formatMoney } from '../../src/game/money';
import { CatalogArt } from '../../src/assets/CatalogArt';
import { ActionRow, Body, Card, Header, Heading, Page } from '../../src/ui/components';
import { useColors } from '../../src/ui/theme';

export default function Investments() {
  const world = useGame(s => s.world)!, c = useColors(), currency = accountFor(world).currency;
  const held = world.holdings.filter(item => item.ownerId === world.activePersonId && item.quantity > 0n);
  return <Page><Header title="Investments" onBack={() => router.back()} />
    <Card><View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
      <CatalogArt id="portfolio" size={76} /><View style={{ flexGrow: 1, flexBasis: 170, minWidth: 0, gap: 5 }}>
        <Heading size={22}>Your portfolio</Heading><Text style={{ color: c.ink, fontSize: 28, fontWeight: '700' }}>{formatMoney(portfolioValue(world))}</Text><Body muted>Values in {currency}</Body>
        <Body muted>Current market value before sale fees.</Body>
      </View>
    </View>
      {!held.length && <Body muted>Your portfolio is empty. Browse prices and trading costs below.</Body>}
      <View style={{ backgroundColor: c.inset, borderRadius: 12, padding: 12, gap: 5 }}>
        <Text style={{ color: c.ink, fontSize: 16, fontWeight: '600' }}>Know the costs</Text>
        <Body muted>Each purchase and sale has a 1% trading fee. Prices move as months pass, and crypto has wider swings. Values can fall as well as rise.</Body>
        <Body muted>Quotes below are in {currency}, using current exchange rates.</Body>
      </View>
    </Card>
    {(['fund', 'stock', 'crypto'] as const).map(kind => <Card key={kind}>
      <Heading size={20}>{kind === 'fund' ? 'Funds' : kind === 'stock' ? 'Stocks' : 'Cryptocurrency'}</Heading>
      {instrumentIds.filter(id => instruments[id].kind === kind).map(id => {
        const quantity = held.filter(item => item.instrumentId === id).reduce((sum, item) => sum + item.quantity, 0n);
        const unitPrice = formatMoney({ minor: investmentValue(world, id, instruments[id].unitScale, currency), currency });
        return <ActionRow key={id} title={instruments[id].name}
          subtitle={id + ' · ' + (quantity ? formatQuantity(quantity, id) + ' units held · Current value ' + formatMoney({ minor: investmentValue(world, id, quantity, currency), currency }) : 'Not currently held')}
          value={unitPrice + ' per unit'} onPress={() => router.push({ pathname: '/investment/[id]', params: { id } })} />;
      })}
    </Card>)}
  </Page>;
}
