import React from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/model';
import { Body, Header, Heading, Page, Portrait } from '../../src/ui/components';
import { useColors } from '../../src/ui/theme';
import { FamilyArt } from '../../src/assets/FamilyArt';
import { otherPerson, partnerRelation, relationLabel } from '../../src/game/systems/relationships';

export default function FamilyTree() {
  const world = useGame(s => s.world)!, c = useColors(), { width, fontScale } = useWindowDimensions();
  const edges = world.relationships.filter(item => item.roles.includes('parent') || item.roles.includes('guardian'));
  const relationship = partnerRelation(world), partner = relationship && otherPerson(world, relationship);
  // A widowed romance is no longer a current partner; the marriage still belongs in this family.
  const lateSpouses = new Set<string>();
  for (const marriage of world.marriages) {
    if (!marriage.ended || marriage.endReason !== 'death') continue;
    const spouseId = marriage.a === world.activePersonId ? marriage.b : marriage.b === world.activePersonId ? marriage.a : undefined;
    if (spouseId && world.people[spouseId]?.died) lateSpouses.add(spouseId);
  }
  const connected = new Set([world.activePersonId, ...(partner && !partner.died ? [partner.id] : []), ...lateSpouses]);
  for (let depth = 0; depth < 8; depth++) for (const edge of edges) if (connected.has(edge.from) || connected.has(edge.to)) { connected.add(edge.from); connected.add(edge.to); }

  // Arrange the same recorded people into readable tiers. These are not new
  // genealogy edges: a current partner is never assumed to parent every child.
  const assigned = new Set<string>();
  const tier = (ids: string[]) => ids.filter(id => {
    if (!connected.has(id) || assigned.has(id)) return false;
    assigned.add(id); return true;
  });
  const parents = tier(edges.filter(edge => edge.to === world.activePersonId).map(edge => edge.from));
  const peers = tier([world.activePersonId, ...(partner && !partner.died ? [partner.id] : []), ...lateSpouses]);
  const children = tier(edges.filter(edge => edge.from === world.activePersonId).map(edge => edge.to));
  const extended = tier([...connected]);
  const sections: { title: string; ids: string[]; empty?: string }[] = [
    { title: 'Parents & Guardians', ids: parents, empty: 'No parents or guardians are recorded for you.' },
    { title: peers.length > 1 ? 'You & Your Partners' : 'You', ids: peers },
    { title: 'Children & Dependants', ids: children, empty: 'No children or dependants are recorded for you.' },
    ...(extended.length ? [{ title: 'Extended Family', ids: extended }] : []),
  ];
  const singleColumn = width < 360 || fontScale >= 1.2;

  const member = (id: string) => {
    const person = world.people[id], name = fullName(person), ownParents = edges.filter(edge => edge.to === id), ownChildren = edges.filter(edge => edge.from === id);
    const parentEdge = edges.find(edge => edge.from === id && edge.to === world.activePersonId);
    const childEdge = edges.find(edge => edge.from === world.activePersonId && edge.to === id);
    const role = id === world.activePersonId ? 'You' : id === partner?.id && relationship ? relationLabel(world, relationship) : lateSpouses.has(id) ? 'Late spouse' : parentEdge ? parentEdge.parentType === 'adoptive' ? 'Adoptive parent' : parentEdge.kind === 'guardian' ? 'Guardian' : 'Parent' : childEdge ? childEdge.kind === 'guardian' ? 'In your care' : childEdge.parentType === 'adoptive' ? 'Adopted child' : 'Child' : undefined;
    const subtitle = (role ? role + ' · ' : '') + 'Age ' + ageOn(person, world.date) + (person.died ? ' · Died ' + person.died.year : '');
    const parentsText = ownParents.map(edge => fullName(world.people[edge.from])).join(', '), childrenText = ownChildren.map(edge => fullName(world.people[edge.to])).join(', ');
    return <Pressable key={id} accessible accessibilityRole="button" accessibilityLabel={name + '. ' + subtitle}
      accessibilityHint={['View ' + (id === world.activePersonId ? 'your' : 'this person’s') + ' profile', parentsText && 'Parents and guardians: ' + parentsText, childrenText && 'Children and dependants: ' + childrenText].filter(Boolean).join('. ')}
      onPress={() => router.push(id === world.activePersonId ? '/profile' : { pathname: '/person/[id]', params: { id } })}
      style={({ pressed }) => ({ width: singleColumn ? '100%' : '48%', flexGrow: 1, minWidth: 0, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: id === world.activePersonId ? c.link : c.line, backgroundColor: pressed || id === world.activePersonId ? c.selected : c.surface })}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ alignItems: 'center', gap: 8 }}>
        <Portrait decorative name={name} personId={person.id} appearance={person.appearance} age={ageOn(person, world.date)} size={72} />
        <Heading size={18} centered>{name}</Heading><Body centered muted>{subtitle}</Body>
        {!!ownParents.length && <View style={{ alignSelf: 'stretch', gap: 4, borderTopWidth: 1, borderTopColor: c.line, paddingTop: 10 }}>
          <Body muted>Parents & guardians</Body>{ownParents.map(edge => <Body key={edge.id}>{fullName(world.people[edge.from])} · {edge.parentType === 'adoptive' ? 'Adoptive parent' : edge.kind === 'guardian' ? 'Guardian' : 'Parent'}</Body>)}
        </View>}
        {!!ownChildren.length && <Body muted>Children: {childrenText}</Body>}
        <Body centered>View profile ›</Body>
      </View>
    </Pressable>;
  };

  return <Page><Header title="Family Tree" onBack={() => router.back()} />
    <View style={{ alignItems: 'center', gap: 10 }}><FamilyArt id="family-tree" size={64} /><Body centered muted>Follow the people in your family record. Select a portrait to open their profile.</Body></View>
    {sections.map(section => <View key={section.title} style={{ gap: 12 }}><Heading size={19}>{section.title}</Heading>
      {section.ids.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12 }}>{section.ids.map(member)}</View> : <Body muted>{section.empty}</Body>}
    </View>)}
    <Body muted>Only recorded biological, adoptive, guardian and partner connections are shown. Each person’s own links are listed on their card.</Body>
  </Page>;
}
