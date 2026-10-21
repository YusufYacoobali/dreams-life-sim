import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGame } from '../../src/state/useGame';
import { countries } from '../../src/game/countries';
import { currentSchool, schoolClubs, schoolConducts } from '../../src/game/systems/schoolSchemas';
import { clubLabels, schoolActionReason, SchoolCommand, schoolWithdrawalReason } from '../../src/game/systems/school';
import { SchoolArt } from '../../src/assets/SchoolArt';
import { FamilyArt } from '../../src/assets/FamilyArt';
import { ActionRow, Body, Card, Header, Heading, Page, Portrait, StatBar } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { useColors } from '../../src/ui/theme';
import { SchoolPlans } from '../../src/ui/SchoolPlans';
import { ageOn, fullName } from '../../src/game/model';
import { minimumSchoolLeavingAge, rules } from '../../src/game/rules';

export default function School() {
  const world = useGame(s => s.world)!, player = world.people[world.activePersonId], school = currentSchool(world);
  return <SchoolDetails key={[world.id, player.id, school?.id ?? 'history', player.country, player.city, player.education.school].join(':')} />;
}
function SchoolDetails() {
  const world = useGame(s => s.world)!, dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors();
  const player = world.people[world.activePersonId], school = currentSchool(world), education = player.education;
  const [dialog, setDialog] = useState<'club' | 'conduct' | 'effort' | { kind: 'withdraw'; command: Extract<SchoolCommand, { type: 'school-withdraw' }> } | null>(null);
  const unavailable = schoolActionReason(world, school), teacher = school && world.people[school.currentTeacherId];
  const reports = world.schoolCommunities.filter(item => item.personId === player.id).flatMap(item => item.exams.map(report => ({ ...report, school: item.school, id: item.id + ':' + report.term }))).sort((a, b) => b.month - a.month);
  const completion = world.schoolCompletions.filter(item => item.personId === player.id).at(-1);
  const withdrawal = world.schoolWithdrawals.find(item => item.personId === player.id);
  let event: EventPresentation | null = null;
  if (dialog === 'club') event = { id: 'school-clubs', kind: 'selection', title: 'Extracurricular Activities', body: 'Choose one school club. Practice builds its skill each month you attend school and uses a little energy. School activities are free.', choices: schoolClubs.map(id => ({ id, label: clubLabels[id] + (school?.club === id ? ' · Current' : ''), disabledReason: school?.club === id ? 'This is your current club plan' : undefined })), confirmLabel: 'Set Club' };
  if (dialog === 'conduct') event = { id: 'school-conduct', kind: 'selection', title: 'Behave in Class', body: 'Your behaviour across attended months affects your teacher’s trust and your school-year report.', choices: [{ id: 'quiet', label: 'Pay attention and get on with my work' }, { id: 'helpful', label: 'Help out and support the class' }, { id: 'disruptive', label: 'Push the limits and disrupt lessons' }].map(choice => ({ ...choice, disabledReason: school?.conduct === choice.id ? 'This is your current classroom behaviour' : undefined })), confirmLabel: 'Set Behaviour' };
  if (dialog === 'effort') event = { id: 'school-effort', kind: 'selection', title: 'Study Routine', body: 'Focused study can improve grades and increase stress as school months pass.', choices: [{ id: 'relaxed', label: 'Relaxed' }, { id: 'balanced', label: 'Balanced' }, { id: 'focused', label: 'Focused' }].map(choice => ({ ...choice, disabledReason: education.effort === choice.id ? 'This is your current study routine' : undefined })), confirmLabel: 'Set Routine' };
  if (dialog && typeof dialog === 'object') event = { id: 'school-withdraw-' + dialog.command.communityId, kind: 'confirmation', title: 'Leave secondary school?', body: 'Withdraw from ' + dialog.command.school + ' before completing the course. This does not award a secondary qualification. Your study history, school contacts, existing qualifications and debt remain. School attendance and club practice will stop. Adult recovery classes remain available when you meet their existing age and attendance requirements.', terms: [{ id: 'leaving-age', label: "This game's minimum leaving age", value: String(minimumSchoolLeavingAge[dialog.command.country]), tone: 'neutral' }, { id: 'study', label: 'Recorded study retained', value: education.months + ' months', tone: 'neutral' }, { id: 'qualification', label: 'Qualification from withdrawing', value: 'None awarded', tone: 'negative' }], confirmLabel: 'Withdraw from School' };
  return <Page><Header title={education.stage === 'primary' ? 'Primary School' : education.stage === 'secondary' ? 'Secondary School' : 'School Years'} onBack={() => router.back()} />
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><SchoolArt id={['primary', 'secondary'].includes(education.stage) ? 'study' : 'report'} size={68} /><View style={{ flex: 1, gap: 5 }}><Heading size={20}>{school?.school || education.school || 'Your school years'}</Heading><Body muted>{player.city}, {countries[player.country].name}</Body></View></View></Card>
    {error && !dialog && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text>}
    {['primary', 'secondary'].includes(education.stage) ? <>
      <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><SchoolArt id="report" size={32} /><View style={{ flex: 1 }}><Heading size={17}>Academic Performance</Heading></View></View><StatBar label="Grades" value={education.grades} color={c.green} /><Body muted>{education.grades >= 80 ? 'You’re doing well in school. Keep up the good work!' : education.grades >= 50 ? 'There is room to grow. A steady routine and extra help can make a difference.' : 'School has been difficult. Extra study and help from your teacher can improve your grades.'}</Body></Card>
      {!school && <Card><Body>Your classmates and teacher will appear after your next month attending school.</Body></Card>}
      <Card><Heading size={18}>Your School Day</Heading>
        <ActionRow disabled={busy} title="Study Harder" subtitle="Put in extra study once this year" icon={<SchoolArt id="study" size={42} />} disabledReason={unavailable ?? (education.lastStudyYear === world.date.year ? 'You already did extra study this year' : undefined)} onPress={() => void dispatch({ type: 'study' })} />
        <ActionRow disabled={busy} title="Classmates" subtitle="Make friends and spend time together" value={school ? String(school.classmateIds.length) : undefined} icon={<FamilyArt id="conversation" size={42} />} disabledReason={!school ? 'Attend school to meet your class' : undefined} onPress={() => router.push({ pathname: '/school-contacts', params: { group: 'classmates' } })} />
        <ActionRow disabled={busy} title="Teachers" subtitle="Build trust and ask for help" icon={teacher ? <Portrait name={fullName(teacher)} appearance={teacher.appearance} age={ageOn(teacher, world.date)} size={42} /> : <Ionicons name="person" size={36} color={c.blue} />} disabledReason={!school ? 'Attend school to meet your teacher' : undefined} onPress={() => router.push({ pathname: '/school-contacts', params: { group: 'teachers' } })} />
        <ActionRow disabled={busy} title="Extracurricular Activities" subtitle="Sports, music, drama and science" value={school ? clubLabels[school.club] : undefined} icon={<Ionicons name="trophy" size={36} color={c.amber} />} disabledReason={unavailable} onPress={() => setDialog('club')} />
        <ActionRow disabled={busy} title="Behave in Class" subtitle="Choose how you spend your school days" value={school?.conduct} icon={<Ionicons name="megaphone" size={36} color={c.amber} />} disabledReason={unavailable} onPress={() => setDialog('conduct')} />
        <ActionRow disabled={busy} title="Study Routine" subtitle="Balance grades and stress" value={education.effort} icon={<Ionicons name="book" size={36} color={c.blue} />} disabledReason={unavailable} onPress={() => setDialog('effort')} />
      </Card>
      {education.stage === 'secondary' && <><Card><Heading size={18}>Next Steps</Heading><ActionRow disabled={busy} title="Further Education" subtitle="Explore university, scholarships and qualifications" icon={<Ionicons name="school" size={36} color={c.blue} />} onPress={() => router.push('/education')} /><ActionRow disabled={busy} title="Withdraw from Secondary School" subtitle="Keep your incomplete record without earning a qualification" icon={<Ionicons name="exit-outline" size={36} color={c.red} />} disabledReason={schoolWithdrawalReason(world, school)} onPress={() => { if (!busy && school && !schoolWithdrawalReason(world, school)) setDialog({ kind: 'withdraw', command: { type: 'school-withdraw', communityId: school.id, country: school.country, city: school.city, school: school.school } }); }} /></Card><Card><Heading size={18}>School Requirements</Heading><Body muted>This game's school course is assessed at age {rules[player.country].schoolEnd}; its minimum leaving age is {minimumSchoolLeavingAge[player.country]}. The secondary course requires final grades of at least 50% and twelve recorded study months. Leaving early does not earn the qualification. Adult recovery classes remain an option when eligible.</Body></Card></>}
    </> : <Card><Body>Your school history stays with you as you grow.</Body><ActionRow title="Education & Qualifications" subtitle="Review qualifications and further study" onPress={() => router.push('/education')} /></Card>}
    <SchoolPlans world={world} />
    {withdrawal && <Card><Heading size={18}>School Withdrawal</Heading><Body>{withdrawal.school} · {withdrawal.date.year}</Body><Body>Left at age {withdrawal.age} · Grades {withdrawal.grade}% · {withdrawal.recordedStudyMonths} recorded study months retained</Body><Body muted>Withdrawal did not award a qualification. Your previous school and contacts remain in your history.</Body><ActionRow title="Former Classmates" onPress={() => router.push({ pathname: '/school-contacts', params: { group: 'classmates', communityId: withdrawal.communityId } })} /><ActionRow title="Former Teachers" onPress={() => router.push({ pathname: '/school-contacts', params: { group: 'teachers', communityId: withdrawal.communityId } })} /></Card>}
    {completion && <Card><Heading size={18}>School Completion</Heading><Body>{completion.school} · {completion.date.year}</Body><Body>Final grades: {completion.grade}% · {completion.recordedStudyMonths} recorded study months · {completion.passed ? 'Secondary qualification earned' : 'No secondary qualification awarded'}</Body></Card>}
    <Card><Heading size={18}>School Reports</Heading>{reports.length ? reports.map(report => <View key={report.id} style={{ gap: 3, paddingVertical: 7 }}><Body>{report.school}</Body><Body muted>{Math.floor(report.month / 12)} · School year {report.term} · Grades {report.grade}%</Body></View>) : <Body muted>A report is recorded after twelve months attending the same school.</Body>}</Card>
    <EventModal event={event} busy={busy} error={error} onCancel={() => { if (!busy) setDialog(null); }} onChoose={async id => {
      if (busy || !school || !dialog) return;
      let saved = false;
      if (typeof dialog === 'object' && id === 'confirm' && !schoolWithdrawalReason(world, school)) saved = await dispatch(dialog.command);
      else if (dialog === 'club' && id !== school.club && schoolClubs.includes(id as typeof schoolClubs[number])) saved = await dispatch({ type: 'school-club', communityId: school.id, club: id as typeof schoolClubs[number] });
      else if (dialog === 'conduct' && id !== school.conduct && schoolConducts.includes(id as typeof schoolConducts[number])) saved = await dispatch({ type: 'school-conduct', communityId: school.id, conduct: id as typeof schoolConducts[number] });
      else if (dialog === 'effort' && id !== education.effort && ['relaxed', 'balanced', 'focused'].includes(id)) saved = await dispatch({ type: 'study-effort', effort: id as 'relaxed' | 'balanced' | 'focused' });
      if (saved) setDialog(null);
    }} />
  </Page>;
}
