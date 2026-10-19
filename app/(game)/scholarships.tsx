import React, { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { formatMoney } from '../../src/game/money';
import { accountFor } from '../../src/game/systems/common';
import { tuitionFor } from '../../src/game/systems/education';
import { fields } from '../../src/game/systems/schemas';
import { Scholarship, scholarshipKinds, scholarshipPolicies } from '../../src/game/systems/scholarshipSchemas';
import { scholarshipReason, scholarshipResources, scholarshipWaiver } from '../../src/game/systems/scholarships';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { Scholarships } from '../../src/ui/Scholarships';

export default function ScholarshipApplications() {
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), dispatch = useGame(s => s.dispatch);
  const [program, setProgram] = useState<Scholarship['program']>('university'), [field, setField] = useState<Scholarship['field']>('computing');
  const [dialog, setDialog] = useState<'program' | 'field' | Scholarship['kind'] | { decline: string } | null>(null);
  const player = world.people[world.activePersonId], currency = accountFor(world).currency, money = (minor: bigint) => formatMoney({ minor, currency }), tuition = tuitionFor(player, program);
  let event: EventPresentation | null = null;
  if (dialog === 'program') event = { id: 'scholarship-program', kind: 'selection', title: 'Choose your course', body: 'Each scholarship offer is tied to a course and subject.', choices: [{ id: 'university', label: 'University' }, { id: 'trade', label: 'Trade School' }, { id: 'graduate', label: 'Professional Study' }], confirmLabel: 'Choose Course' };
  if (dialog === 'field') event = { id: 'scholarship-field', kind: 'selection', title: 'Choose your subject', body: 'An offer cannot be transferred to a different subject.', choices: (program === 'graduate' ? ['medicine', 'law'] : fields).map(id => ({ id, label: id[0].toUpperCase() + id.slice(1) })), confirmLabel: 'Choose Subject' };
  if (dialog === 'merit' || dialog === 'access') {
    const policy = scholarshipPolicies[dialog];
    event = { id: 'scholarship-apply', kind: 'confirmation', title: 'Apply for an ' + policy.label + '?', body: 'The application is free and can be declined. An offer lasts twelve calendar months and does not guarantee course admission. Accept it through Education before enrolling. It reduces tuition only; living costs and existing debt stay yours.', terms: [{ id: 'course', label: 'Course', value: program + ' · ' + field, tone: 'neutral' }, { id: 'tuition', label: 'Annual tuition', value: money(tuition), tone: 'neutral' }, { id: 'waiver', label: 'Tuition waiver if awarded', value: money(scholarshipWaiver(policy, tuition)), tone: 'positive' }, { id: 'remaining', label: 'Annual tuition remaining', value: money(tuition - scholarshipWaiver(policy, tuition)), tone: 'neutral' }, { id: 'renewal', label: 'Renewal grade', value: policy.renewalGrade + '%', tone: 'neutral' }], confirmLabel: 'Apply For Scholarship' };
  }
  if (dialog && typeof dialog === 'object') event = { id: 'decline-scholarship', kind: 'confirmation', title: 'Decline this offer?', body: 'The free application stays in your history. No money changes hands and you cannot apply for the same award/course again this calendar year.', terms: [], confirmLabel: 'Decline Offer' };
  return <Page><Header title="Scholarships" onBack={() => router.back()} /><Card><Heading size={19}>Help with tuition</Heading><Body>These institutional awards waive tuition directly. There is no spendable cash grant or refund for earlier study.</Body><ActionRow title="Course" value={program === 'graduate' ? 'Professional Study' : program === 'trade' ? 'Trade School' : 'University'} onPress={() => setDialog('program')} /><ActionRow title="Subject" value={field} onPress={() => setDialog('field')} /><Body muted>Current grades: {player.education.grades}% · Assessed resources: {money(scholarshipResources(world))}</Body></Card>
    {scholarshipKinds.map(kind => { const policy = scholarshipPolicies[kind], reason = scholarshipReason(world, kind, program, field); return <Card key={kind}><Heading size={19}>{policy.label}</Heading><Body>{policy.coverageBps / 100}% tuition waiver · Entry grade {policy.entryGrade}% · Renewal grade {policy.renewalGrade}%</Body>{kind === 'access' && <Body muted>At application, acceptance and renewal, assessed resources must not exceed this course’s annual tuition. Assessment includes all cash and your net worth.</Body>}<Button label={'Apply · ' + policy.label} disabled={busy || !!reason} onPress={() => setDialog(kind)} />{reason && <Body muted>{reason}</Body>}</Card>; })}
    {error && <Body>{error}</Body>}
    <Scholarships world={world} busy={busy} onUse={() => router.push('/education')} />
    {world.scholarships.filter(item => item.personId === player.id && item.status === 'offered').map(item => <Button key={item.id} label={'Decline ' + scholarshipPolicies[item.kind].label} tone="secondary" disabled={busy} onPress={() => setDialog({ decline: item.id })} />)}
    <EventModal event={event} busy={busy} error={error} onCancel={() => setDialog(null)} onChoose={id => {
      if (dialog === 'program') { setProgram(id as Scholarship['program']); if (id === 'graduate') setField('medicine'); }
      else if (dialog === 'field') setField(id as Scholarship['field']);
      else if (dialog === 'merit' || dialog === 'access') void dispatch({ type: 'apply-scholarship', kind: dialog, program, field });
      else if (dialog && typeof dialog === 'object') void dispatch({ type: 'decline-scholarship', scholarshipId: dialog.decline });
      setDialog(null);
    }} />
  </Page>;
}
