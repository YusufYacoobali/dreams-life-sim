import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { World } from '../game/model';
import { currentRecovery, recoveryPaths } from '../game/systems/educationRecoverySchemas';
import { hasSecondary, RecoveryCommand, recoveryAttendanceReason, recoveryReason } from '../game/systems/educationRecovery';
import { ActionRow, Body, Button, Card, Heading, StatBar } from './components';
import { EventModal, EventPresentation } from './EventModal';
import { useColors } from './theme';
import { SchoolArt } from '../assets/SchoolArt';

export function RecoveryStudy({ world, busy, error, dispatch, onReviewChange }: { world: World; busy: boolean; error: string | null; dispatch: (command: RecoveryCommand) => Promise<boolean>; onReviewChange?: (open: boolean) => void }) {
  const person = world.people[world.activePersonId], course = currentRecovery(world), purpose = hasSecondary(person) ? 'grades' : 'secondary', path = recoveryPaths[purpose], c = useColors();
  const [dialog, setDialog] = useState<'enroll' | 'effort' | 'leave' | null>(null);
  const [historyLimit, setHistoryLimit] = useState(4);
  useEffect(() => { onReviewChange?.(!!dialog); return () => onReviewChange?.(false); }, [!!dialog, onReviewChange]);
  const finished = world.recoveryCourses.filter(item => item.personId === person.id && item.status !== 'active').slice().reverse(), history = finished.slice(0, historyLimit);
  const labels = { passed: 'Passed', failed: 'Passing grade not met', withdrawn: 'Left the course', died: 'Ended', superseded: 'Qualified through another route', active: 'In progress' };
  const unavailable = recoveryAttendanceReason(world, person);
  let event: EventPresentation | null = null;
  if (dialog === 'enroll') event = { id: 'recovery-enroll-' + purpose, kind: 'confirmation', title: path.label, body: purpose === 'secondary' ? 'Earn the secondary qualification through actual evening study. You can keep your job. Hospital care, custody, trips and assignments pause attendance.' : 'Improve the school grades used for further-study applications. Your existing qualification stays valid. This course can fit around your job.', terms: [{ id: 'duration', label: 'Attended study', value: path.months + ' months', tone: 'neutral' }, { id: 'target', label: 'Passing grade', value: path.target + '%', tone: 'neutral' }, { id: 'fee', label: 'Tuition', value: 'No fee or loan', tone: 'neutral' }], confirmLabel: 'Join Evening Classes' };
  if (dialog === 'effort' && course) event = { id: 'recovery-effort-' + course.id, kind: 'selection', title: 'Evening Study Routine', body: 'Focused work improves grades faster and uses more energy and stress. Progress happens during attended months.', choices: [{ id: 'relaxed', label: 'Relaxed' }, { id: 'balanced', label: 'Balanced' }, { id: 'focused', label: 'Focused' }].map(choice => ({ ...choice, disabledReason: choice.id === course.effort ? 'This is your current routine' : undefined })), confirmLabel: 'Set Evening Routine' };
  if (dialog === 'leave' && course) event = { id: 'recovery-leave-' + course.id, kind: 'confirmation', title: 'Leave evening classes?', body: 'Your recorded work and actual grades stay in your history. Leaving early does not complete the course. You can enrol again later.', terms: [], confirmLabel: 'Leave Evening Classes' };
  const submit = async (id: string) => {
    if (busy || dialog === 'effort' && id === course?.effort) return;
    let command: RecoveryCommand;
    if (dialog === 'enroll') command = { type: 'enroll-recovery', purpose };
    else if (dialog === 'effort' && course) command = { type: 'recovery-effort', courseId: course.id, effort: id as 'relaxed' | 'balanced' | 'focused' };
    else if (dialog === 'leave' && course) command = { type: 'leave-recovery', courseId: course.id };
    else return;
    if (await dispatch(command)) setDialog(null);
  };
  return <>
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><SchoolArt id="evening" size={40} /><Heading size={18}>Evening Study</Heading></View>
      {course ? <>
        <Body>{course.school} · {recoveryPaths[course.purpose].label}</Body>
        <Body>{course.periods.length} of {course.requiredMonths} attended months · {course.targetGrade}% needed to pass</Body>
        <StatBar label="Grades" value={person.education.grades} color={c.blue} />
        <Body muted>{recoveryAttendanceReason(world, person) ?? 'Classes continue as you Age Up. You can keep working; tuition is free.'}</Body>
        <ActionRow disabled={busy} title="Extra Evening Study" subtitle="One extra study session this year" disabledReason={unavailable ?? (person.education.lastStudyYear === world.date.year ? 'You already did extra study this year' : person.stats.energy < 8 ? 'Rest before doing extra study' : undefined)} onPress={() => void dispatch({ type: 'recovery-study', courseId: course.id })} />
        <ActionRow title="Evening Study Routine" value={course.effort} disabled={busy} disabledReason={undefined} onPress={() => setDialog('effort')} />
        <ActionRow title="Leave Evening Classes" disabled={busy} disabledReason={undefined} onPress={() => setDialog('leave')} />
      </> : <>{person.education.stage === 'none' && <StatBar label="School Grades" value={person.education.grades} color={c.blue} />}<ActionRow title={path.label} subtitle={purpose === 'secondary' ? 'Evening classes after school · compatible with work' : 'An evening course for further-study entry grades'} disabled={busy} disabledReason={recoveryReason(world, purpose)} onPress={() => setDialog('enroll')} /></>}
    </Card>
    {history.length > 0 && <Card><Heading size={18}>Evening Study History</Heading>{history.map(item => <View key={item.id} style={{ gap: 3 }}><Body>{item.school} · {labels[item.status]}</Body><Body muted>{item.periods.length} attended months · {item.finalGrade}% · {item.ended!.year}</Body>{item.qualificationAwarded && <Body>Secondary qualification earned</Body>}{item.reason === 'moved' && <Body muted>The course ended when you moved.</Body>}</View>)}{finished.length > history.length && <Button label="Show Earlier Evening Courses" tone="secondary" onPress={() => setHistoryLimit(historyLimit + 4)} />}</Card>}
    <EventModal event={event} busy={busy} error={error} onCancel={() => setDialog(null)} onChoose={id => { void submit(id); }} />
  </>;
}
