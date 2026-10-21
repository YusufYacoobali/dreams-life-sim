import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { formatMoney } from '../../src/game/money';
import { accountFor } from '../../src/game/systems/common';
import { tuitionFor } from '../../src/game/systems/education';
import { fields } from '../../src/game/systems/schemas';
import { Scholarship, scholarshipKinds, scholarshipPolicies, studyPrograms } from '../../src/game/systems/scholarshipSchemas';
import { scholarshipReason, scholarshipResources, scholarshipWaiver, type ScholarshipCommand } from '../../src/game/systems/scholarships';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { EventModal, type EventPresentation } from '../../src/ui/EventModal';
import { Scholarships } from '../../src/ui/Scholarships';
import { Illustration } from '../../src/assets/Illustration';
import { useColors } from '../../src/ui/theme';

export default function ScholarshipApplications() {
  const world = useGame(s => s.world)!;
  return <ScholarshipContext key={JSON.stringify([world.id, world.activePersonId, world.people[world.activePersonId].country, world.people[world.activePersonId].city])} />;
}
function ScholarshipContext() {
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), dispatch = useGame(s => s.dispatch), c = useColors();
  const [program, setProgram] = useState<Scholarship['program']>('university'), [field, setField] = useState<Scholarship['field']>('computing');
  const [dialog, setDialog] = useState<'program' | 'field' | null>(null), [review, setReview] = useState<{ command: ScholarshipCommand; event: EventPresentation } | null>(null);
  const submitting = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const player = world.people[world.activePersonId], currency = accountFor(world).currency, money = (minor: bigint) => formatMoney({ minor, currency }), tuition = tuitionFor(player, program);
  const applications = world.scholarships.filter(item => item.personId === player.id);
  const openLocal = (kind: 'program' | 'field') => { if (!busy && !submitting.current) setDialog(kind); };
  const apply = (kind: Scholarship['kind']) => {
    if (busy || submitting.current || scholarshipReason(world, kind, program, field)) return;
    const policy = scholarshipPolicies[kind];
    setDialog(null);
    setReview({ command: { type: 'apply-scholarship', kind, program, field }, event: { id: 'scholarship-apply', kind: 'confirmation', title: 'Apply for an ' + policy.label + '?', body: 'The application is free and can be declined. An offer lasts twelve calendar months and does not guarantee course admission. Accept it through Education before enrolling. It reduces tuition only; living costs and existing debt stay yours.', terms: [{ id: 'course', label: 'Course', value: program + ' · ' + field, tone: 'neutral' }, { id: 'tuition', label: 'Annual tuition', value: money(tuition), tone: 'neutral' }, { id: 'waiver', label: 'Tuition waiver if awarded', value: money(scholarshipWaiver(policy, tuition)), tone: 'positive' }, { id: 'remaining', label: 'Annual tuition remaining', value: money(tuition - scholarshipWaiver(policy, tuition)), tone: 'neutral' }, { id: 'renewal', label: 'Renewal grade', value: policy.renewalGrade + '%', tone: 'neutral' }], confirmLabel: 'Apply For Scholarship' } });
  };
  const decline = (item: Scholarship) => {
    if (busy || submitting.current || item.status !== 'offered' || item.personId !== player.id) return;
    setDialog(null);
    setReview({ command: { type: 'decline-scholarship', scholarshipId: item.id }, event: { id: 'decline-scholarship', kind: 'confirmation', title: 'Decline this offer?', body: 'The free application stays in your history. No money changes hands and you cannot apply for the same award/course again this calendar year.', terms: [], confirmLabel: 'Decline Offer' } });
  };
  let event: EventPresentation | null = null;
  if (dialog === 'program') event = { id: 'scholarship-program', kind: 'selection', title: 'Choose your course', body: 'Each scholarship offer is tied to a course and subject.', choices: [{ id: 'university', label: 'University' }, { id: 'trade', label: 'Trade School' }, { id: 'graduate', label: 'Professional Study' }].map(choice => ({ ...choice, disabledReason: choice.id === program ? 'This is your selected course' : undefined })), confirmLabel: 'Choose Course' };
  if (dialog === 'field') event = { id: 'scholarship-field', kind: 'selection', title: 'Choose your subject', body: 'An offer cannot be transferred to a different subject.', choices: (program === 'graduate' ? ['medicine', 'law'] : fields).map(id => ({ id, label: id[0].toUpperCase() + id.slice(1), disabledReason: id === field ? 'This is your selected subject' : undefined })), confirmLabel: 'Choose Subject' };
  return <Page><Header title="Scholarships" backDisabled={busy} onBack={() => { if (!busy && !submitting.current) router.back(); }} /><Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><Illustration id="education" size={56} /><View style={{ flex: 1, minWidth: 0, gap: 3 }}><Heading size={21}>Help with tuition</Heading><Body>Free applications · tuition waivers</Body></View></View>
      <Body>These institutional awards waive tuition directly. There is no spendable cash grant or refund for earlier study.</Body>
      <ActionRow title="Course" value={program === 'graduate' ? 'Professional Study' : program === 'trade' ? 'Trade School' : 'University'} disabled={busy} onPress={() => openLocal('program')} /><ActionRow title="Subject" value={field} disabled={busy} onPress={() => openLocal('field')} />
      <Body>Annual tuition before an award: {money(tuition)}</Body><Body muted>Current grades: {player.education.grades}%</Body><Body muted>Assessed resources: {money(scholarshipResources(world))}</Body>
    </Card>
    {applications.length > 0 ? <>
      <Scholarships world={world} busy={busy} onUse={() => { if (!busy && !submitting.current) router.push('/education'); }} />
      {applications.filter(item => item.status === 'offered').map(item => <Button key={item.id} label={'Decline ' + scholarshipPolicies[item.kind].label} tone="secondary" disabled={busy} onPress={() => decline(item)} />)}
    </> : <Card><Heading size={18}>No applications yet</Heading><Body muted>Your applications and tuition waivers will appear here. Choose an award below to review a free application.</Body></Card>}
    <Heading size={19}>Awards for this course</Heading>
    {scholarshipKinds.map(kind => { const policy = scholarshipPolicies[kind], reason = scholarshipReason(world, kind, program, field), waived = scholarshipWaiver(policy, tuition); return <Card key={kind}>
      <Heading size={19}>{policy.label}</Heading><Body>{policy.coverageBps / 100}% tuition waiver</Body>
      <Body>Tuition waived if awarded: {money(waived)}</Body><Body>Annual tuition left to fund: {money(tuition - waived)}</Body>
      <Body muted>Entry grade: {policy.entryGrade}% · Renewal grade: {policy.renewalGrade}%</Body>
      {kind === 'access' && <Body muted>At application, acceptance and renewal, assessed resources must not exceed this course’s annual tuition. Assessment includes all cash and your net worth.</Body>}
      {reason && <Body muted>{reason}</Body>}<Button label={'Apply · ' + policy.label} disabled={busy || !!reason} onPress={() => apply(kind)} />
    </Card>; })}
    {error && !review && !dialog && !world.pending && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text>}
    <EventModal event={review?.event ?? event} busy={busy} error={error} onCancel={() => { if (!busy && !submitting.current) { setDialog(null); setReview(null); } }} onChoose={async id => {
      if (!mounted.current || busy || submitting.current) return;
      if (review) {
        submitting.current = true;
        try { if (await dispatch(review.command) && mounted.current) setReview(current => current === review ? null : current); }
        finally { submitting.current = false; }
        return;
      }
      if (dialog === 'program' && studyPrograms.includes(id as Scholarship['program']) && id !== program) { setProgram(id as Scholarship['program']); if (id === 'graduate') setField('medicine'); }
      else if (dialog === 'field' && (program === 'graduate' ? ['medicine', 'law'] : fields).includes(id as typeof fields[number]) && id !== field) setField(id as Scholarship['field']);
      setDialog(null);
    }} />
  </Page>;
}
