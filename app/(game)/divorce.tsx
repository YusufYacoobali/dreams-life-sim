import React, { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { fullName } from '../../src/game/model';
import { divorceQuote } from '../../src/game/systems/family';
import { otherPerson, partnerRelation } from '../../src/game/systems/relationships';
import { formatMoney } from '../../src/game/money';
import { Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { EventModal } from '../../src/ui/EventModal';
import { FamilyArt } from '../../src/assets/FamilyArt';
export default function Divorce() {
  const world = useGame(s => s.world)!, dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error);
  const [custody, setCustody] = useState<'shared' | 'me' | 'them'>('shared'), [confirm, setConfirm] = useState(false);
  const relation = partnerRelation(world), spouse = relation?.romance === 'married' ? otherPerson(world, relation) : undefined;
  const quote = spouse && divorceQuote(world, spouse.id);
  return <Page><Header title="Divorce & Settlement" onBack={() => router.back()} />{spouse && quote ? <><Card><FamilyArt id="breakup" size={80} /><Heading size={19}>Separate lives</Heading><Body>{fullName(spouse)}</Body><Body>Settlement: {formatMoney({ minor: quote.amount, currency: quote.currency })}</Body><Body>{world.people[quote.payerId].firstName} pays {world.people[quote.receiverId].firstName}.</Body><Body muted>The settlement equalises changes in net worth since marriage. Starting wealth is retained in the calculation. Real cash pays first; an unpaid balance becomes a debt owed to the other person. Property remains with its owner.</Body></Card>
      <Card><Heading size={18}>Children’s living arrangements</Heading><Body muted>Choose your preference. Shared care needs both parents in the same city; the recorded primary home also considers health and ability to care. Support transfers actual money from the other parent each month.</Body>{(['shared', 'me', 'them'] as const).map(value => <Button key={value} label={(custody === value ? '✓ ' : '') + (value === 'shared' ? 'Shared care, primary home with me' : value === 'me' ? 'Primary care with me' : 'Primary care with ' + spouse.firstName)} tone={custody === value ? 'primary' : 'secondary'} onPress={() => setCustody(value)} />)}</Card>{error && <Body>{error}</Body>}<Button label="Review Divorce" tone="danger" disabled={busy} onPress={() => setConfirm(true)} />
      <EventModal event={confirm ? { id: 'divorce-confirm', kind: 'confirmation', title: 'End your marriage?', body: 'The settlement and custody arrangement above will be recorded. You will move into separate households.', terms: [{ id: 'settlement', label: world.people[quote.payerId].firstName + ' pays', value: formatMoney({ minor: quote.amount, currency: quote.currency }), tone: 'neutral' }], confirmLabel: 'Confirm Divorce' } : null} busy={busy} onCancel={() => setConfirm(false)} onChoose={() => { setConfirm(false); void dispatch({ type: 'divorce', personId: spouse.id, custody, quotedPayment: quote.signed }); }} />
    </> : <Body>You have no current marriage to settle.</Body>}</Page>;
}
