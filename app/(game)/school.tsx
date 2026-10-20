import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGame } from '../../src/state/useGame';
import { countries } from '../../src/game/countries';
import { currentSchool, schoolClubs, schoolConducts } from '../../src/game/systems/schoolSchemas';
import { clubLabels, schoolActionReason } from '../../src/game/systems/school';
import { SchoolArt } from '../../src/assets/SchoolArt';
import { FamilyArt } from '../../src/assets/FamilyArt';
import { ActionRow, Body, Card, Header, Heading, Page, Portrait, StatBar } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { useColors } from '../../src/ui/theme';
import { SchoolPlans } from '../../src/ui/SchoolPlans';
import { ageOn, fullName } from '../../src/game/model';

export default function School() {
  const world = useGame(s => s.world)!, dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors();
  const player = world.people[world.activePersonId], school = currentSchool(world), education = player.education;
  const [dialog, setDialog] = useState<'club' | 'conduct' | 'effort' | null>(null);
  const unavailable = schoolActionReason(world, school), teacher = school && world.people[school.currentTeacherId];
  const reports = world.schoolCommunities.filter(item => item.personId === player.id).flatMap(item => item.exams.map(report => ({ ...report, school: item.school, id: item.id + ':' + report.term }))).sort((a, b) => b.month - a.month);
  const completion = world.schoolCompletions.filter(item => item.personId === player.id).at(-1);
  let event: EventPresentation | null = null;
  if (dialog === 'club') event = { id: 'school-clubs', kind: 'selection', title: 'Extracurricular Activities', body: 'Choose one school club. Practice builds its skill each month you attend school and uses a little energy. School activities are free.', choices: schoolClubs.map(id => ({ id, label: clubLabels[id] + (school?.club === id ? ' · Current' : ''), disabledReason: school?.club === id ? 'This is your current club plan' : undefined })), confirmLabel: 'Set Club' };
  if (dialog === 'conduct') event = { id: 'school-conduct', kind: 'selection', title: 'Behave in Class', body: 'Your behaviour across attended months affects your teacher’s trust and your school-year report.', choices: [{ id: 'quiet', label: 'Pay attention and get on with my work' }, { id: 'helpful', label: 'Help out and support the class' }, { id: 'disruptive', label: 'Push the limits and disrupt lessons' }].map(choice => ({ ...choice, disabledReason: school?.conduct === choice.id ? 'This is your current classroom behaviour' : undefined })), confirmLabel: 'Set Behaviour' };
  if (dialog === 'effort') event = { id: 'school-effort', kind: 'selection', title: 'Study Routine', body: 'Focused study can improve grades and increase stress as school months pass.', choices: [{ id: 'relaxed', label: 'Relaxed' }, { id: 'balanced', label: 'Balanced' }, { id: 'focused', label: 'Focused' }].map(choice => ({ ...choice, disabledReason: education.effort === choice.id ? 'This is your current study routine' : undefined })), confirmLabel: 'Set Routine' };
  return <Page><Header title={education.stage === 'primary' ? 'Primary School' : education.stage === 'secondary' ? 'Secondary School' : 'School Years'} onBack={() => router.back()} />
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><SchoolArt id={['primary', 'secondary'].includes(education.stage) ? 'study' : 'report'} size={68} /><View style={{ flex: 1, gap: 5 }}><Heading size={20}>{school?.school || education.school || 'Your school years'}</Heading><Body muted>{player.city}, {countries[player.country].name}</Body></View></View></Card>
    {error && !dialog && <Body>{error}</Body>}
    {['primary', 'secondary'].includes(education.stage) ? <>
      <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><SchoolArt id="report" size={32} /><Heading size={17}>Academic Performance</Heading></View><StatBar label="Grades" value={education.grades} color={c.green} /><Body muted>{education.grades >= 80 ? 'You’re doing well in school. Keep up the good work!' : education.grades >= 50 ? 'There is room to grow. A steady routine and extra help can make a difference.' : 'School has been difficult. Extra study and help from your teacher can improve your grades.'}</Body>{education.stage === 'secondary' && <Body muted>The secondary course requires final grades of at least 50% and twelve recorded study months. Evening recovery classes remain an option if you leave without the qualification.</Body>}</Card>
      {!school && <Card><Body>Your classmates and teacher will appear after your next month attending school.</Body></Card>}
      <Card>
        <ActionRow disabled={busy} title="Study Harder" subtitle="Put in extra study once this year" icon={<SchoolArt id="study" size={42} />} disabledReason={unavailable ?? (education.lastStudyYear === world.date.year ? 'You already did extra study this year' : undefined)} onPress={() => void dispatch({ type: 'study' })} />
        <ActionRow disabled={busy} title="Classmates" subtitle="Make friends and spend time together" value={school ? String(school.classmateIds.length) : undefined} icon={<FamilyArt id="conversation" size={42} />} disabledReason={!school ? 'Attend school to meet your class' : undefined} onPress={() => router.push({ pathname: '/school-contacts', params: { group: 'classmates' } })} />
        <ActionRow disabled={busy} title="Teachers" subtitle="Build trust and ask for help" icon={teacher ? <Portrait name={fullName(teacher)} appearance={teacher.appearance} age={ageOn(teacher, world.date)} size={42} /> : <Ionicons name="person" size={36} color={c.blue} />} disabledReason={!school ? 'Attend school to meet your teacher' : undefined} onPress={() => router.push({ pathname: '/school-contacts', params: { group: 'teachers' } })} />
        <ActionRow disabled={busy} title="Extracurricular Activities" subtitle="Sports, music, drama and science" value={school ? clubLabels[school.club] : undefined} icon={<Ionicons name="trophy" size={36} color={c.amber} />} disabledReason={unavailable} onPress={() => setDialog('club')} />
        <ActionRow disabled={busy} title="Behave in Class" subtitle="Choose how you spend your school days" value={school?.conduct} icon={<Ionicons name="megaphone" size={36} color={c.amber} />} disabledReason={unavailable} onPress={() => setDialog('conduct')} />
      </Card>
      <Card><ActionRow disabled={busy} title="Study Routine" subtitle="Balance grades and stress" value={education.effort} disabledReason={unavailable} onPress={() => setDialog('effort')} /></Card>
    </> : <Card><Body>Your school history stays with you as you grow.</Body><ActionRow title="Education & Qualifications" subtitle="Review qualifications and further study" onPress={() => router.push('/education')} /></Card>}
    <SchoolPlans world={world} />
    {completion && <Card><Heading size={18}>School Completion</Heading><Body>{completion.school} · {completion.date.year}</Body><Body>Final grades: {completion.grade}% · {completion.recordedStudyMonths} recorded study months · {completion.passed ? 'Secondary qualification earned' : 'No secondary qualification awarded'}</Body></Card>}
    <Card><Heading size={18}>School Reports</Heading>{reports.length ? reports.map(report => <View key={report.id} style={{ gap: 3, paddingVertical: 7 }}><Body>{report.school}</Body><Body muted>{Math.floor(report.month / 12)} · School year {report.term} · Grades {report.grade}%</Body></View>) : <Body muted>A report is recorded after twelve months attending the same school.</Body>}</Card>
    <EventModal event={event} busy={busy} error={error} onCancel={() => setDialog(null)} onChoose={async id => {
      if (busy || !school || !dialog) return;
      let saved = false;
      if (dialog === 'club' && id !== school.club && schoolClubs.includes(id as typeof schoolClubs[number])) saved = await dispatch({ type: 'school-club', communityId: school.id, club: id as typeof schoolClubs[number] });
      else if (dialog === 'conduct' && id !== school.conduct && schoolConducts.includes(id as typeof schoolConducts[number])) saved = await dispatch({ type: 'school-conduct', communityId: school.id, conduct: id as typeof schoolConducts[number] });
      else if (dialog === 'effort' && id !== education.effort && ['relaxed', 'balanced', 'focused'].includes(id)) saved = await dispatch({ type: 'study-effort', effort: id as 'relaxed' | 'balanced' | 'focused' });
      if (saved) setDialog(null);
    }} />
  </Page>;
}
