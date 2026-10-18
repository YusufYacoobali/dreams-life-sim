import React from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { instruments, instrumentIds } from '../../src/game/content/markets';
import { investmentValue, portfolioValue } from '../../src/game/systems/markets';
import { accountFor } from '../../src/game/systems/common';
import { formatMoney } from '../../src/game/money';
import { CatalogArt } from '../../src/assets/CatalogArt';
import { ActionRow, Body, Card, Header, Heading, Page } from '../../src/ui/components';

export default function Investments() {
  const world = useGame(s => s.world)!; const currency = accountFor(world).currency;
  return <Page><Header title="Investments" onBack={() => router.back()} /><Card><CatalogArt id="portfolio" size={76} /><Body muted>Your portfolio</Body><Heading size={30}>{formatMoney(portfolioValue(world))}</Heading><Body muted>Prices move as months pass. Crypto has wider swings. Trading costs 1% of the order value.</Body></Card>
    {(['fund', 'stock', 'crypto'] as const).map(kind => <Card key={kind}><Heading size={19}>{kind === 'fund' ? 'Funds' : kind === 'stock' ? 'Stocks' : 'Cryptocurrency'}</Heading>{instrumentIds.filter(id => instruments[id].kind === kind).map(id => <ActionRow key={id} title={instruments[id].name} subtitle={id + ' · ' + formatMoney({ minor: investmentValue(world, id, instruments[id].unitScale, currency), currency }) + ' per unit'} onPress={() => router.push({ pathname: '/investment/[id]', params: { id } })} />)}</Card>)}
  </Page>;
}
