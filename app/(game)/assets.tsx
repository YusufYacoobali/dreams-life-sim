import React from 'react';
import { useGame } from '../../src/state/useGame';
import { countries } from '../../src/game/countries';
import { formatMoney } from '../../src/game/money';
import { Body, Card, Header, Heading, Page } from '../../src/ui/components';
import { Illustration } from '../../src/assets/Illustration';

export default function Assets() {
  const world = useGame(s => s.world)!;
  const player = world.people[world.activePersonId];
  const accounts = world.accounts.filter(account => account.ownerId === player.id);
  return <Page>
    <Header title="Assets" />
    <Card>
      <Illustration id="money" size={44} />
      <Heading size={20}>Cash and Savings</Heading>
      {accounts.map(account => <Heading key={account.id} size={26}>{formatMoney({ minor: account.cash, currency: account.currency }, countries[player.country].locale)}</Heading>)}
    </Card>
    <Card><Body muted>You don't own any property, vehicles or possessions.</Body></Card>
  </Page>;
}
