import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/model';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { relationFor } from '../../src/game/systems/relationships';
import { ActionRow, Body, Card, Header, Heading, Page, Portrait } from '../../src/ui/components';
import { useColors } from '../../src/ui/theme';
import { SchoolArt } from '../../src/assets/SchoolArt';

export default function SchoolContacts() {
  const { group, communityId } = useLocalSearchParams<{ group: string; communityId?: string }>(), teachers = group === 'teachers', world = useGame(s => s.world)!, school = communityId ? world.schoolCommunities.find(item => item.id === communityId && item.personId === world.activePersonId) : currentSchool(world), c = useColors();
  const [query, setQuery] = useState('');
  const ids = teachers ? school?.teacherIds ?? [] : school?.classmateIds ?? [];
  const people = ids.map(id => world.people[id]).filter(person => fullName(person).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <Page><Header title={teachers ? 'Teachers' : 'Classmates'} onBack={() => router.back()} />
    {school && <Card><View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}><SchoolArt id="study" size={64} /><View style={{ flexGrow: 1, flexBasis: 170, minWidth: 0, gap: 5 }}><Heading size={22}>{school.school}</Heading><Body muted>{school.ended ? 'School history · ended ' + school.ended.year : 'Your current school'}</Body></View></View><Body muted>Open a person to view their profile and your recorded relationship.</Body></Card>}
    <TextInput accessibilityLabel={teachers ? 'Search teachers' : 'Search classmates'} placeholder="Search by name" placeholderTextColor={c.muted} value={query} onChangeText={setQuery} style={{ color: c.ink, backgroundColor: c.surface, minHeight: 48, padding: 14, borderRadius: 12, fontSize: 16 }} />
    <Body muted>{people.length} {query.trim() ? 'matching' : 'recorded'} {teachers ? 'teachers' : 'classmates'}</Body>
    <Card>{people.map(person => { const relation = relationFor(world, world.activePersonId, person.id)!; return <ActionRow key={person.id} title={fullName(person)} subtitle={person.died ? 'Died in ' + person.died.year : teachers ? !school?.ended && person.id === school?.currentTeacherId ? 'Current class teacher · Trust ' + relation.trust + '%' : 'Former class teacher' : 'Age ' + ageOn(person, world.date) + ' · ' + (!school?.ended && person.education.school === school?.school && ['primary', 'secondary'].includes(person.education.stage) ? 'Classmate' : 'Former classmate')} value={'Bond ' + relation.strength + '%'} icon={<Portrait name={fullName(person)} personId={person.id} appearance={person.appearance} age={ageOn(person, world.date)} size={48} />} onPress={() => router.push({ pathname: '/person/[id]', params: { id: person.id, tab: 'activities' } })} />; })}{!people.length && <Body muted>{query.trim() ? 'No matching names.' : school ? 'No contacts are recorded for this group.' : communityId ? 'This school is not in your recorded history.' : 'Attend school to get to know your class.'}</Body>}</Card>
  </Page>;
}
