import React, { useState } from 'react';
import { Redirect, router } from 'expo-router';
import { useGame } from '../src/state/useGame';
import { ageOn, fullName } from '../src/game/model';
import { childrenOf } from '../src/game/systems/family';
import { Body, Button, Card, Header, Heading, Page, Portrait } from '../src/ui/components';
import { EventModal } from '../src/ui/EventModal';
import { EstateDetails } from '../src/ui/EstateDetails';
export default function Legacy() {
  const world = useGame(s => s.world), dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error);
  const [selected, setSelected] = useState<string | null>(null);
  if (!world) return <Redirect href="/" />;
  const person = world.people[world.activePersonId]; if (!person.died) return <Redirect href="/life" />;
  const children = childrenOf(world).filter(child => !child.died), child = selected ? world.people[selected] : null;
  return <Page><Header title="Continue as Child" onBack={() => router.back()} /><Body>Choose an existing child to continue the family story. Their age, identity, education, relationships and finances stay with them. The date stays {world.date.year}-{String(world.date.month).padStart(2, '0')}.</Body>{children.map(item => <Card key={item.id}><Portrait name={fullName(item)} appearance={item.appearance} age={ageOn(item, world.date)} size={72} /><Heading size={20}>{fullName(item)}</Heading><Body>Age {ageOn(item, world.date)} · {item.city}</Body><Button label={'Continue as ' + item.firstName} disabled={busy} onPress={() => setSelected(item.id)} /></Card>)}{children.length === 0 && <Body>No living child is available.</Body>}{error && <Body>{error}</Body>}<EstateDetails world={world} personId={person.id} />
    <EventModal event={child ? { id: 'legacy:' + child.id, kind: 'confirmation', title: 'Continue as ' + child.firstName + '?', body: 'You will play as ' + fullName(child) + ' at their current age. Their existing state and inherited share are preserved. Minor inheritance stays in trust until adulthood; necessary inherited-property costs can use it.', terms: [], confirmLabel: 'Continue Their Life' } : null} busy={busy} onCancel={() => setSelected(null)} onChoose={() => { if (child) { const id = child.id; setSelected(null); void dispatch({ type: 'continue-child', personId: id }).then(success => { if (success) router.replace('/life'); }); } }} />
  </Page>;
}
