import React from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/model';
import { ActionRow, Body, Card, Header, Heading, Page, Portrait } from '../../src/ui/components';
import { FamilyArt } from '../../src/assets/FamilyArt';
import { otherPerson, partnerRelation, relationLabel } from '../../src/game/systems/relationships';
export default function FamilyTree() {
  const world = useGame(s => s.world)!;
  const edges = world.relationships.filter(item => item.roles.includes('parent') || item.roles.includes('guardian'));
  const relationship = partnerRelation(world), partner = relationship && otherPerson(world, relationship);
  const connected = new Set([world.activePersonId, ...(partner && !partner.died ? [partner.id] : [])]);
  for (let depth = 0; depth < 8; depth++) for (const edge of edges) if (connected.has(edge.from) || connected.has(edge.to)) { connected.add(edge.from); connected.add(edge.to); }
  return <Page><Header title="Family Tree" onBack={() => router.back()} /><FamilyArt id="family-tree" size={88} /><Body muted>Every name refers to a person in this world. Biological, adoptive and guardian relationships remain in the family record.</Body>
    {[...connected].map(id => { const person = world.people[id]; const parents = edges.filter(item => item.to === id), children = edges.filter(item => item.from === id); return <Card key={id}><ActionRow title={fullName(person)} subtitle={(id === world.activePersonId ? 'You · ' : id === partner?.id && relationship ? relationLabel(world, relationship) + ' · ' : '') + 'Age ' + ageOn(person, world.date) + (person.died ? ' · Died ' + person.died.year : '')} icon={<Portrait name={fullName(person)} appearance={person.appearance} age={ageOn(person, world.date)} size={48} />} onPress={() => router.push(id === world.activePersonId ? '/profile' : { pathname: '/person/[id]', params: { id } })} />{parents.length > 0 && <><Heading size={15}>Parents & guardians</Heading>{parents.map(edge => <Body key={edge.id}>{fullName(world.people[edge.from])} · {edge.parentType === 'adoptive' ? 'Adoptive parent' : edge.kind === 'guardian' ? 'Guardian' : 'Parent'}</Body>)}</>}{children.length > 0 && <Body muted>Children: {children.map(edge => fullName(world.people[edge.to])).join(', ')}</Body>}</Card>; })}
  </Page>;
}
