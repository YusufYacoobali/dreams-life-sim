import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/model';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { relationFor } from '../../src/game/systems/relationships';
import { ActionRow, Body, Card, Header, Page, Portrait } from '../../src/ui/components';
import { useColors } from '../../src/ui/theme';

export default function SchoolContacts() {
  const { group } = useLocalSearchParams<{ group: string }>(), teachers = group === 'teachers', world = useGame(s => s.world)!, school = currentSchool(world), c = useColors();
  const [query, setQuery] = useState('');
  const ids = teachers ? school?.teacherIds ?? [] : school?.classmateIds ?? [];
  const people = ids.map(id => world.people[id]).filter(person => fullName(person).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <Page><Header title={teachers ? 'Teachers' : 'Classmates'} onBack={() => router.back()} />
    {school && <Body muted>{school.school}</Body>}
    <TextInput accessibilityLabel={teachers ? 'Search teachers' : 'Search classmates'} placeholder="Search by name" placeholderTextColor={c.muted} value={query} onChangeText={setQuery} style={{ color: c.ink, backgroundColor: c.surface, padding: 14, borderRadius: 12, fontSize: 16 }} />
    <Card>{people.map(person => { const relation = relationFor(world, world.activePersonId, person.id)!; return <ActionRow key={person.id} title={fullName(person)} subtitle={person.died ? 'Died in ' + person.died.year : teachers ? person.id === school?.currentTeacherId ? 'Current class teacher · Trust ' + relation.trust + '%' : 'Former class teacher' : 'Age ' + ageOn(person, world.date) + ' · ' + (person.education.school === school?.school && ['primary', 'secondary'].includes(person.education.stage) ? 'Classmate' : 'Former classmate')} value={'Bond ' + relation.strength + '%'} icon={<Portrait name={fullName(person)} appearance={person.appearance} age={ageOn(person, world.date)} size={48} />} onPress={() => router.push({ pathname: '/person/[id]', params: { id: person.id, tab: 'activities' } })} />; })}{!people.length && <Body muted>{query.trim() ? 'No matching names.' : 'Attend school to get to know your class.'}</Body>}</Card>
  </Page>;
}
