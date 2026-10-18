import React from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { countries } from '../../src/game/countries';
import { formatMoney } from '../../src/game/money';
import { ActionRow, Body, Card, Header, Heading, Page } from '../../src/ui/components';
import { cashNetWorth } from '../../src/game/systems/finance';
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
      <Body>Cash less debt: {formatMoney({ minor: cashNetWorth(world), currency: accounts[0].currency }, countries[player.country].locale)}</Body>
      <ActionRow title="Bank & Loans" subtitle="Borrow, repay and view transactions" onPress={() => router.push('/bank')} />
    </Card>
    <Card><Body muted>You don't own any property, vehicles or possessions.</Body></Card>
  </Page>;
}
