import React, { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { fields } from '../../src/game/systems/schemas';
import { courseMonths, enrollmentReason, tuitionFor } from '../../src/game/systems/education';
import { accountFor } from '../../src/game/systems/common';
import { formatMoney } from '../../src/game/money';
import { rules } from '../../src/game/rules';
import { ActionRow, Body, Button, Card, Header, Heading, Page, StatBar } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { Illustration } from '../../src/assets/Illustration';
import { useColors } from '../../src/ui/theme';

type Application = { program: 'university' | 'trade' | 'graduate'; field: typeof fields[number]; funding: 'cash' | 'loan' };
type Dialog = { kind: 'program-field'; program: Application['program'] } | { kind: 'funding'; application: Application } | { kind: 'confirm'; application: Application } | { kind: 'effort' } | { kind: 'leave' } | { kind: 'resume' };
export default function Education() {
  const world = useGame(s => s.world)!; const dispatch = useGame(s => s.dispatch); const busy = useGame(s => s.busy); const error = useGame(s => s.error);
  const player = world.people[world.activePersonId]; const education = player.education; const account = accountFor(world); const rule = rules[player.country]; const c = useColors();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  let event: EventPresentation | null = null;
  if (dialog?.kind === 'program-field') event = { id: 'course-fields', kind: 'selection', title: 'Choose your subject', body: 'Your subject affects later career eligibility.', choices: (dialog.program === 'graduate' ? ['medicine', 'law'] : fields).map(id => ({ id, label: id[0].toUpperCase() + id.slice(1), disabledReason: enrollmentReason(world, dialog.program, id) })), confirmLabel: 'Next' };
  if (dialog?.kind === 'funding') event = { id: 'course-funding', kind: 'selection', title: 'How will you fund it?', body: 'Tuition is charged for each year of study.', choices: [{ id: 'cash', label: 'Pay from my balance', disabledReason: account.cash < tuitionFor(player, dialog.application.program) ? 'Your balance cannot cover the first year' : undefined }, { id: 'loan', label: 'Student loan · ' + rule.studentInterestBps / 100 + '% annual interest' }], confirmLabel: 'Review Application' };
  if (dialog?.kind === 'confirm') event = { id: 'course-apply', kind: 'confirmation', title: 'Apply to study ' + dialog.application.field + '?', body: dialog.application.funding === 'loan' ? 'If accepted, a student loan funds each year’s tuition. Interest accrues while you study and until you repay. Living costs are separate.' : 'If accepted, tuition is paid from your balance each year. Studies pause if a later payment cannot be covered.', terms: [{ id: 'tuition', label: 'Annual tuition', value: formatMoney({ minor: tuitionFor(player, dialog.application.program), currency: account.currency }), tone: 'neutral' }, { id: 'duration', label: 'Course length', value: courseMonths(dialog.application.program, dialog.application.field) / 12 + ' years', tone: 'neutral' }], confirmLabel: 'Apply' };
  if (dialog?.kind === 'effort') event = { id: 'study-routine', kind: 'selection', title: 'Study routine', body: 'More effort can improve grades and increase stress.', choices: [{ id: 'relaxed', label: 'Relaxed' }, { id: 'balanced', label: 'Balanced' }, { id: 'focused', label: 'Focused' }], confirmLabel: 'Set Routine' };
  if (dialog?.kind === 'leave') event = { id: 'leave-course', kind: 'confirmation', title: 'Leave this course?', body: 'Future tuition stops. Paid tuition is not refunded and student debt remains. Completed qualifications stay yours.', terms: [], confirmLabel: 'Leave Course' };
  if (dialog?.kind === 'resume') event = { id: 'resume-study', kind: 'selection', title: 'Fund your next year', body: 'Your completed study months are preserved.', choices: [{ id: 'cash', label: 'Pay ' + formatMoney({ minor: education.tuition, currency: account.currency }), disabledReason: account.cash < education.tuition ? 'Insufficient balance' : undefined }, { id: 'loan', label: 'Borrow tuition at ' + rule.studentInterestBps / 100 + '% annual interest' }], confirmLabel: 'Resume Studies' };
  return <Page><Header title="Education" onBack={() => router.back()} />
    <Card><Illustration id="education" size={64} /><Heading>{education.stage === 'none' ? 'Your Education' : education.school}</Heading>
      {education.stage !== 'none' && <><Body>{education.field || education.stage} · {education.paused ? 'Paused — tuition required' : education.effort + ' routine'}</Body><StatBar label="Grades" value={education.grades} color={c.blue} />{education.requiredMonths > 0 && <Body muted>{education.months} of {education.requiredMonths} study months completed</Body>}</>}
      {education.qualifications.length === 0 ? <Body muted>No completed qualifications yet.</Body> : education.qualifications.map((q, index) => <Body key={index}>{q.level[0].toUpperCase() + q.level.slice(1)} · {q.field} · {q.year}</Body>)}
    </Card>
    {error && <Body>{error}</Body>}
    {education.stage !== 'none' && <Card>
      {education.paused ? <Button label="Fund Next Year" onPress={() => setDialog({ kind: 'resume' })} /> : <><ActionRow title="Study harder" subtitle="Extra study once this year" disabledReason={education.lastStudyYear === world.date.year ? 'You already did extra study this year' : undefined} onPress={() => { void dispatch({ type: 'study' }); }} /><ActionRow title="Study routine" value={education.effort} onPress={() => setDialog({ kind: 'effort' })} /></>}
      {education.stage !== 'primary' && education.stage !== 'secondary' && <ActionRow title="Leave course" onPress={() => setDialog({ kind: 'leave' })} />}
    </Card>}
    <Card><Heading size={18}>Further education</Heading>{(['university', 'trade', 'graduate'] as const).map(program => <ActionRow key={program} title={program === 'trade' ? 'Trade School' : program === 'graduate' ? 'Professional Study' : 'University'} subtitle={program === 'graduate' ? 'Medicine or law after a degree' : 'Choose a subject and review funding'} disabledReason={enrollmentReason(world, program, program === 'graduate' ? 'medicine' : 'business')} onPress={() => setDialog({ kind: 'program-field', program })} />)}</Card>
    <EventModal event={event} busy={busy} error={error} onCancel={() => setDialog(null)} onChoose={id => {
      if (!dialog) return;
      if (dialog.kind === 'program-field') { setDialog({ kind: 'funding', application: { program: dialog.program, field: id as Application['field'], funding: 'cash' } }); return; }
      if (dialog.kind === 'funding') { setDialog({ kind: 'confirm', application: { ...dialog.application, funding: id as Application['funding'] } }); return; }
      setDialog(null);
      if (dialog.kind === 'confirm') void dispatch({ type: 'enroll', ...dialog.application });
      else if (dialog.kind === 'effort') void dispatch({ type: 'study-effort', effort: id as 'relaxed' | 'balanced' | 'focused' });
      else if (dialog.kind === 'leave') void dispatch({ type: 'leave-school' });
      else if (dialog.kind === 'resume') void dispatch({ type: 'fund-studies', funding: id as 'cash' | 'loan' });
    }} />
  </Page>;
}
