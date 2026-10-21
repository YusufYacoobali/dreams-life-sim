import React, { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { fields } from '../../src/game/systems/schemas';
import { courseMonths, educationActionReason, enrollmentReason, tuitionFor } from '../../src/game/systems/education';
import { minimumSchoolLeavingAge, rules } from '../../src/game/rules';
import { accountFor, availableCash } from '../../src/game/systems/common';
import { formatMoney } from '../../src/game/money';
import { loanRateQuote } from '../../src/ui/loanRateQuote';
import { ActionRow, Body, Button, Card, Header, Heading, Page, StatBar } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { Illustration } from '../../src/assets/Illustration';
import { useColors } from '../../src/ui/theme';
import { RecoveryStudy } from '../../src/ui/RecoveryStudy';
import { Scholarships } from '../../src/ui/Scholarships';
import { scholarshipWaiver, tuitionDue } from '../../src/game/systems/scholarships';
import { UniversityAdmissions, type AdmissionReviewRequest } from '../../src/ui/UniversityAdmissions';
import { activeUniversityApplication } from '../../src/game/systems/universityAdmissionSchemas';
import { StudyCourseHistory } from '../../src/ui/StudyCourseHistory';

type Application = { program: 'university' | 'trade' | 'graduate'; field: typeof fields[number]; funding: 'cash' | 'loan'; scholarshipId?: string };
type Dialog = { kind: 'program-field'; program: Application['program'] } | { kind: 'funding'; application: Application } | { kind: 'confirm'; application: Application } | { kind: 'effort' } | { kind: 'leave' } | { kind: 'resume' };
const offeredFields = (program: Application['program']) => program === 'graduate' ? ['medicine', 'law'] as const : fields;
export default function Education() {
  const world = useGame(s => s.world)!;
  return <EducationContext key={JSON.stringify([world.id, world.activePersonId])} />;
}
function EducationContext() {
  const world = useGame(s => s.world)!; const dispatch = useGame(s => s.dispatch); const busy = useGame(s => s.busy); const error = useGame(s => s.error);
  const player = world.people[world.activePersonId]; const education = player.education; const account = accountFor(world); const studentLoan = loanRateQuote(world, 'student'); const c = useColors();
  const loanNote = studentLoan.existing ? ' Borrowed tuition is added to your existing ' + account.currency + ' student loan at ' + studentLoan.interestBps / 100 + '% annual interest.' : '';
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [admissionRequest, setAdmissionRequest] = useState<AdmissionReviewRequest>(null), [admissionReviewOpen, setAdmissionReviewOpen] = useState(false);
  const bill = (application: Application) => { const tuition = tuitionFor(player, application.program), offer = world.scholarships.find(item => item.id === application.scholarshipId && item.status === 'offered'); return tuition - (offer ? scholarshipWaiver(offer, tuition) : 0n); };
  const nextTuition = tuitionDue(world);
  const fundingReason = educationActionReason(world, 'fund-studies');
  let event: EventPresentation | null = null;
  if (dialog?.kind === 'program-field') event = { id: 'course-fields', kind: 'selection', title: 'Choose your subject', body: 'Your subject affects later career eligibility.', choices: offeredFields(dialog.program).map(id => ({ id, label: id[0].toUpperCase() + id.slice(1), disabledReason: enrollmentReason(world, dialog.program, id) })), confirmLabel: 'Next' };
  if (dialog?.kind === 'funding') event = { id: 'course-funding', kind: 'selection', title: 'How will you fund it?', body: 'Tuition is charged for each year of study.' + loanNote + (dialog.application.scholarshipId ? ' Your scholarship reduces the bill while renewal requirements are met; choose how to fund the remainder.' : ''), choices: [{ id: 'cash', label: 'Pay from my balance', disabledReason: availableCash(account) < bill(dialog.application) ? 'Your balance cannot cover the first year' : undefined }, { id: 'loan', label: 'Student loan · ' + studentLoan.interestBps / 100 + '% annual interest' }], confirmLabel: 'Review Application' };
  if (dialog?.kind === 'confirm') event = { id: 'course-apply', kind: 'confirmation', title: 'Apply to study ' + dialog.application.field + '?', body: dialog.application.funding === 'loan' ? 'If accepted, a student loan funds the tuition you owe each year. Interest accrues while you study and until you repay. Living costs are separate.' : 'If accepted, tuition is paid from your balance each year. Studies pause if a later payment cannot be covered.', terms: [{ id: 'tuition', label: 'Annual tuition before aid', value: formatMoney({ minor: tuitionFor(player, dialog.application.program), currency: account.currency }), tone: 'neutral' }, { id: 'billed', label: 'First-year tuition billed', value: formatMoney({ minor: bill(dialog.application), currency: account.currency }), tone: 'neutral' }, ...(dialog.application.funding === 'loan' ? [{ id: 'interest', label: 'Student loan annual interest', value: studentLoan.interestBps / 100 + '%', tone: 'neutral' as const }] : []), ...(dialog.application.scholarshipId ? [{ id: 'aid', label: 'Scholarship renewal', value: 'Grade and any resource requirements apply each tuition year', tone: 'neutral' as const }] : []), { id: 'duration', label: 'Course length', value: courseMonths(dialog.application.program, dialog.application.field) / 12 + ' years', tone: 'neutral' }], confirmLabel: 'Apply' };
  if (dialog?.kind === 'effort') event = { id: 'study-routine', kind: 'selection', title: 'Study routine', body: 'More effort can improve grades and increase stress.', choices: [{ id: 'relaxed', label: 'Relaxed' }, { id: 'balanced', label: 'Balanced' }, { id: 'focused', label: 'Focused' }].map(choice => ({ ...choice, disabledReason: choice.id === education.effort ? 'This is your current routine' : undefined })), confirmLabel: 'Set Routine' };
  if (dialog?.kind === 'leave') event = { id: 'leave-course', kind: 'confirmation', title: 'Leave this course?', body: 'Future tuition stops. Paid tuition is not refunded and student debt remains. Completed qualifications stay yours.', terms: [], confirmLabel: 'Leave Course' };
  if (dialog?.kind === 'resume') event = { id: 'resume-study', kind: 'selection', title: 'Fund your next year', body: 'Your completed study months are preserved.' + loanNote, choices: [{ id: 'cash', label: 'Pay ' + formatMoney({ minor: nextTuition, currency: account.currency }), disabledReason: availableCash(account) < nextTuition ? 'Insufficient balance' : undefined }, { id: 'loan', label: 'Borrow tuition at ' + studentLoan.interestBps / 100 + '% annual interest' }], confirmLabel: 'Resume Studies' };
  return <Page><Header title="Education" onBack={() => router.back()} />
    <Card><Illustration id="education" size={64} /><Heading>{education.stage === 'none' ? 'Your Education' : education.school}</Heading>
      {education.stage !== 'none' && <><Body>{education.field || education.stage} · {education.paused ? 'Paused — tuition required' : education.effort + ' routine'}</Body><StatBar label="Grades" value={education.grades} color={c.blue} />{education.requiredMonths > 0 && <Body muted>{education.months} of {education.requiredMonths} study months completed</Body>}</>}
      {education.qualifications.length === 0 ? <Body muted>No completed qualifications yet.</Body> : education.qualifications.map((q, index) => <Body key={index}>{q.level[0].toUpperCase() + q.level.slice(1)} · {q.field} · {q.year}</Body>)}
    </Card>
    {['primary', 'secondary'].includes(education.stage) && <Card><Body muted>This game's school course is assessed at age {rules[player.country].schoolEnd}. {education.stage === 'secondary' ? 'Its minimum leaving age is ' + minimumSchoolLeavingAge[player.country] + '; review early withdrawal from Your School. Leaving early does not award a qualification.' : 'Primary-school withdrawal is unavailable.'} A qualification requires the passing grade and recorded study.</Body><ActionRow title="Your School" subtitle="Classmates, teachers, activities and reports" onPress={() => router.push('/school')} /></Card>}
    {education.stage === 'none' && (world.schoolCommunities.some(item => item.personId === player.id) || world.schoolCompletions.some(item => item.personId === player.id)) && <Card><ActionRow title="School Years" subtitle="Reports, plans and completion" onPress={() => router.push('/school')} /></Card>}
    {error && !dialog && !admissionReviewOpen && <Body>{error}</Body>}
    {education.stage !== 'none' && <Card>
      {education.paused ? <><Button label="Fund Next Year" accessibilityLabel={fundingReason ? 'Fund Next Year. ' + fundingReason : undefined} disabled={busy || !!fundingReason} onPress={() => setDialog({ kind: 'resume' })} />{fundingReason && <Body muted>{fundingReason}</Body>}</> : <><ActionRow title="Study harder" subtitle="Extra study once this year" disabled={busy} disabledReason={educationActionReason(world, 'study')} onPress={() => { void dispatch({ type: 'study' }); }} /><ActionRow title="Study routine" value={education.effort} disabled={busy} disabledReason={educationActionReason(world, 'study-effort')} onPress={() => setDialog({ kind: 'effort' })} /></>}
      {education.stage !== 'primary' && education.stage !== 'secondary' && <ActionRow title="Leave course" disabled={busy} disabledReason={educationActionReason(world, 'leave-school')} onPress={() => setDialog({ kind: 'leave' })} />}
    </Card>}
    <StudyCourseHistory key={JSON.stringify([world.id, player.id])} world={world} />
    <ActionRow title="Scholarships" subtitle="Apply for tuition waivers before enrolling" onPress={() => router.push('/scholarships')} />
    <Scholarships world={world} busy={busy} onUse={item => {
      if (busy) return;
      if (item.program === 'university') setAdmissionRequest(previous => ({ scholarshipId: item.id, serial: (previous?.serial ?? 0) + 1, identity: JSON.stringify([world.id, player.id, player.country, player.city, activeUniversityApplication(world)?.id ?? null]) }));
      else setDialog({ kind: 'funding', application: { program: item.program, field: item.field, funding: 'cash', scholarshipId: item.id } });
    }} />
    <RecoveryStudy world={world} busy={busy} error={error} dispatch={dispatch} />
    <Card><Heading size={18}>Further education</Heading><UniversityAdmissions request={admissionRequest} onReviewChange={setAdmissionReviewOpen} />{(['trade', 'graduate'] as const).map(program => {
      const reasons = offeredFields(program).map(field => enrollmentReason(world, program, field));
      const disabledReason = reasons.every(Boolean) ? reasons.every(reason => reason === reasons[0]) ? reasons[0] : 'No subjects are currently available' : undefined;
      return <ActionRow key={program} title={program === 'trade' ? 'Trade School' : 'Professional Study'} subtitle={program === 'graduate' ? 'Medicine or law after a degree' : 'Choose a subject and review funding'} disabled={busy} disabledReason={disabledReason} onPress={() => setDialog({ kind: 'program-field', program })} />;
    })}</Card>
    <EventModal event={event} busy={busy} error={error} onCancel={() => setDialog(null)} onChoose={async id => {
      if (busy || !dialog) return;
      if (dialog.kind === 'program-field') { setDialog({ kind: 'funding', application: { program: dialog.program, field: id as Application['field'], funding: 'cash' } }); return; }
      if (dialog.kind === 'funding') { setDialog({ kind: 'confirm', application: { ...dialog.application, funding: id as Application['funding'] } }); return; }
      if (dialog.kind === 'effort' && id === education.effort) return;
      let saved = false;
      if (dialog.kind === 'confirm') saved = await dispatch({ type: 'enroll', ...dialog.application });
      else if (dialog.kind === 'effort') saved = await dispatch({ type: 'study-effort', effort: id as 'relaxed' | 'balanced' | 'focused' });
      else if (dialog.kind === 'leave') saved = await dispatch({ type: 'leave-school' });
      else if (dialog.kind === 'resume') saved = await dispatch({ type: 'fund-studies', funding: id as 'cash' | 'loan' });
      if (saved) setDialog(null);
    }} />
  </Page>;
}
