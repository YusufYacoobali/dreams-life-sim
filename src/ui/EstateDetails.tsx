import React from 'react';
import { World, fullName } from '../game/model';
import { formatMoney } from '../game/money';
import { Body, Card, Heading } from './components';
export function EstateDetails({ world, personId }: { world: World; personId: string }) {
  const estate = world.estates.find(item => item.personId === personId);
  if (!estate) return null;
  return <Card><Heading size={19}>Estate settlement</Heading><Body>Net worth at death: {formatMoney(estate.netWorthAtDeath)}</Body><Body>Sale costs & discounts: {formatMoney(estate.fees)}</Body><Body>Debts paid: {formatMoney(estate.debtPaid)}</Body>{estate.debtWrittenOff.minor > 0n && <Body>Unpaid debt written off: {formatMoney(estate.debtWrittenOff)}</Body>}<Body>Estate tax: {formatMoney(estate.tax)}</Body><Body>Executor: {estate.executorId ? fullName(world.people[estate.executorId]) : 'Estate administrator'}</Body>{estate.distributions.map(share => <React.Fragment key={share.personId}><Heading size={16}>{fullName(world.people[share.personId])}</Heading><Body>{formatMoney(share.cash)} cash{share.assets.length ? ' · ' + share.assets.length + ' specific bequest' + (share.assets.length > 1 ? 's' : '') + ' (' + formatMoney(share.assetValue) + ')' : ''}</Body></React.Fragment>)}{estate.charity.minor > 0n && <Body>Donated unclaimed estate: {formatMoney(estate.charity)}</Body>}{estate.notes.map((note, index) => <Body key={index} muted>{note}</Body>)}</Card>;
}
