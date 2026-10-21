import React, { useEffect, useRef, useState } from 'react';
import type { World } from '../game/model';
import { formatMoney } from '../game/money';
import { fields } from '../game/systems/schemas';
import { activeUniversityApplication, type UniversityApplication, universityTuitionV1 } from '../game/systems/universityAdmissionSchemas';
import { universityApplicationReason, universityPlaceQuote, universityPlaceReason, type UniversityAdmissionCommand } from '../game/systems/universityAdmissions';
import { courseMonths } from '../game/systems/education';
import { rules } from '../game/rules';
import { scholarshipOfferReason } from '../game/systems/scholarships';
import { scholarshipPolicies } from '../game/systems/scholarshipSchemas';
import { accountFor } from '../game/systems/common';
import { useGame } from '../state/useGame';
import { ActionRow, Body, Button, Card, Heading } from './components';
import { EventModal, type EventPresentation } from './EventModal';

export type AdmissionReviewRequest = { scholarshipId: string; serial: number; identity: string } | null;
type Dialog = { kind: 'fields'; event: EventPresentation } | { kind: 'aid' | 'funding'; applicationId: string; scholarshipId?: string; event: EventPresentation } | { kind: 'confirm'; command: UniversityAdmissionCommand; event: EventPresentation };
const dateLabel = (date: World['date']) => date.day + '/' + date.month + '/' + date.year;
const statusLabels: Record<UniversityApplication['status'], string> = { waitlisted: 'Waitlisted', accepted: 'Accepted · place offered', rejected: 'Rejected', withdrawn: 'Withdrawn', enrolled: 'Enrolled', expired: 'Offer expired', moved: 'Closed after moving', died: 'Ended', 'other-course': 'Closed after starting another course' };

/** Its key is life/person/open application, never the world revision. */
export function UniversityAdmissions({ request, onReviewChange }: { request: AdmissionReviewRequest; onReviewChange: (open: boolean) => void }) {
  const world = useGame(s => s.world)!, application = activeUniversityApplication(world);
  return <AdmissionContext key={JSON.stringify([world.id, world.activePersonId, world.people[world.activePersonId].country, world.people[world.activePersonId].city, application?.id ?? null])} world={world} request={request} onReviewChange={onReviewChange} />;
}
function AdmissionContext({ world, request, onReviewChange }: { world: World; request: AdmissionReviewRequest; onReviewChange: (open: boolean) => void }) {
  const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error);
  const person = world.people[world.activePersonId], application = activeUniversityApplication(world), identity = JSON.stringify([world.id, person.id, person.country, person.city, application?.id ?? null]);
  const identityRef = useRef(identity), submitting = useRef(false), mounted = useRef(true); identityRef.current = identity;
  const [dialog, setDialog] = useState<Dialog | null>(null), [limit, setLimit] = useState(4);
  useEffect(() => { onReviewChange(!!dialog); return () => onReviewChange(false); }, [!!dialog, onReviewChange]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const money = (minor: bigint, currency = accountFor(world).currency) => formatMoney({ minor, currency });
  const apply = (field: typeof fields[number]) => {
    if (busy || submitting.current || universityApplicationReason(world, field)) return;
    setDialog({ kind: 'confirm', command: { type: 'apply-university', field }, event: { id: 'university-apply-' + field, kind: 'confirmation', title: 'Apply to study ' + field + '?', body: 'This free application can be accepted, rejected or waitlisted for one final review in a calendar month. An accepted application offers a place; enrolling and choosing funding are separate. Applying starts no course, scholarship, tuition payment or loan. One attempt per subject each calendar year.', terms: [{ id: 'fee', label: 'Application fee', value: 'No fee or loan', tone: 'neutral' }, { id: 'tuition', label: 'Annual tuition if you later enrol', value: money(universityTuitionV1[person.country]), tone: 'neutral' }, { id: 'duration', label: 'Course length after enrolment', value: courseMonths('university', field) / 12 + ' years of study', tone: 'neutral' }], confirmLabel: 'Submit University Application' } });
  };
  const funding = (item: UniversityApplication, scholarshipId?: string) => {
    if (busy || submitting.current || universityPlaceReason(world, item.id, undefined, scholarshipId)) return;
    const quote = universityPlaceQuote(world, item, scholarshipId);
    setDialog({ kind: 'funding', applicationId: item.id, scholarshipId, event: { id: 'university-funding-' + item.id, kind: 'selection', title: 'Fund your offered place', body: 'Accepting starts this course and funds the first year. Later annual tuition and living costs remain separate.' + (quote.existingLoan ? ' Borrowed tuition joins your existing ' + item.currency + ' student loan.' : ''), choices: [{ id: 'cash', label: 'Pay from my available balance', disabledReason: universityPlaceReason(world, item.id, 'cash', scholarshipId) }, { id: 'loan', label: 'Student loan · ' + quote.interestBps / 100 + '% annual interest', disabledReason: universityPlaceReason(world, item.id, 'loan', scholarshipId) }], confirmLabel: 'Review Enrolment' } });
  };
  const reviewPlace = (item: UniversityApplication) => {
    if (busy || submitting.current || universityPlaceReason(world, item.id)) return;
    const aid = world.scholarships.filter(candidate => candidate.personId === person.id && candidate.status === 'offered' && !scholarshipOfferReason(world, candidate, 'university', item.field) && candidate.annualTuition === item.annualTuition);
    if (!aid.length) { funding(item); return; }
    setDialog({ kind: 'aid', applicationId: item.id, event: { id: 'university-aid-' + item.id, kind: 'selection', title: 'Choose tuition support', body: 'Only a current scholarship offer for this course can reduce tuition. Enrolment still needs your separate consent.', choices: [{ id: 'none', label: 'Continue without a scholarship' }, ...aid.map(candidate => ({ id: candidate.id, label: scholarshipPolicies[candidate.kind].label }))], confirmLabel: 'Choose Support' } });
  };
  useEffect(() => {
    if (!request || request.identity !== identity) return;
    const aid = world.scholarships.find(candidate => candidate.id === request.scholarshipId && candidate.personId === person.id && candidate.program === 'university' && candidate.status === 'offered');
    if (!aid) return;
    if (application?.status === 'accepted' && application.field === aid.field) funding(application, aid.id);
    else if (!application) apply(aid.field);
    // An explicit new request opens local review. Store revisions never reopen it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.serial]);
  const items = world.universityApplications.filter(item => item.personId === person.id).slice().reverse();
  const reasons = fields.map(field => universityApplicationReason(world, field)), unavailable = reasons.every(Boolean) ? reasons.every(reason => reason === reasons[0]) ? reasons[0] : 'No subjects are currently available' : undefined;
  return <>
    <ActionRow title="University" subtitle={unavailable ? 'Browse subjects and costs. ' + unavailable : 'Explore subjects, then separately review your application'} disabled={busy} onPress={() => {
      if (busy || submitting.current) return;
      setDialog({ kind: 'fields', event: { id: 'university-subjects', kind: 'selection', title: 'Choose your university subject', body: 'To apply, you need to be at least ' + rules[person.country].schoolEnd + ' years old, hold a secondary qualification and have grades of at least 55%. Other current restrictions appear with each subject. A degree takes ' + courseMonths('university', fields[0]) / 12 + ' years; annual tuition is ' + money(universityTuitionV1[person.country]) + '. Applying is free. Enrolment and tuition need separate consent.', choices: fields.map(field => ({ id: field, label: field[0].toUpperCase() + field.slice(1), disabledReason: universityApplicationReason(world, field) })), confirmLabel: 'Review Free Application' } });
    }} />
    {items.length > 0 && <Card><Heading size={18}>University applications</Heading>{items.slice(0, limit).map(item => <React.Fragment key={item.id}>
      <Body>{item.school} · {item.field}</Body><Body>{statusLabels[item.status]}</Body><Body muted>Applied {dateLabel(item.applied)} · {money(item.annualTuition, item.currency)} annual tuition</Body>
      {item.status === 'waitlisted' && <Body muted>One final review due {dateLabel(item.reviewDue!)}. No course or payment has started.</Body>}
      {item.status === 'accepted' && <><Body muted>Accept before {dateLabel(item.expires!)}. You are not enrolled yet.</Body><Button label="Review Offered Place" disabled={busy || !!universityPlaceReason(world, item.id)} onPress={() => reviewPlace(item)} />{universityPlaceReason(world, item.id) && <Body muted>{universityPlaceReason(world, item.id)}</Body>}</>}
      {item.status === 'accepted' || item.status === 'waitlisted' ? <Button label="Withdraw University Application" tone="secondary" disabled={busy} onPress={() => {
        if (busy || submitting.current) return;
        setDialog({ kind: 'confirm', command: { type: 'withdraw-university-application', applicationId: item.id }, event: { id: 'university-withdraw-' + item.id, kind: 'confirmation', title: 'Withdraw this university application?', body: 'No tuition was paid for this application. Withdrawal closes this application or place offer and keeps its history. This year’s attempt is not reset.', terms: [], confirmLabel: 'Withdraw Application' } });
      }} /> : item.ended && <Body muted>{item.status === 'enrolled' ? 'Enrolled' : 'Ended'} {dateLabel(item.ended)}</Body>}
      {item.transitions.length > 1 && <Body muted>{item.transitions.map(step => statusLabels[step.status] + ' ' + dateLabel(step.date)).join(' → ')}</Body>}
    </React.Fragment>)}{items.length > limit && <Button label="Show Earlier University Applications" tone="secondary" onPress={() => setLimit(limit + 4)} />}</Card>}
    <EventModal event={dialog?.event ?? null} busy={busy} error={error} onCancel={() => { if (!busy && !submitting.current) setDialog(null); }} onChoose={async id => {
      if (!mounted.current || !dialog || busy || submitting.current || identityRef.current !== identity) return;
      if (dialog.kind === 'fields') { if (fields.includes(id as typeof fields[number])) apply(id as typeof fields[number]); return; }
      if (dialog.kind === 'aid' || dialog.kind === 'funding') {
        const item = world.universityApplications.find(candidate => candidate.id === dialog.applicationId);
        if (!item) return;
        if (dialog.kind === 'aid') { funding(item, id === 'none' ? undefined : id); return; }
        if (id !== 'cash' && id !== 'loan' || universityPlaceReason(world, item.id, id, dialog.scholarshipId)) return;
        const quote = universityPlaceQuote(world, item, dialog.scholarshipId);
        setDialog({ kind: 'confirm', command: { type: 'accept-university-place', applicationId: item.id, funding: id, ...(dialog.scholarshipId ? { scholarshipId: dialog.scholarshipId } : {}) }, event: { id: 'university-enrol-' + item.id, kind: 'confirmation', title: 'Accept your university place?', body: id === 'loan' ? 'You consent to enrolment and a student loan for each billed tuition year. Interest accrues until repayment. Living costs are separate; scholarship renewal requirements apply.' : 'You consent to enrolment and payment from your available balance for each tuition year. Study pauses if later tuition cannot be covered. Living costs are separate.', terms: [{ id: 'course', label: 'Offered course', value: item.school + ' · ' + item.field, tone: 'neutral' }, { id: 'tuition', label: 'Annual offered tuition', value: money(quote.tuition, item.currency), tone: 'neutral' }, { id: 'waiver', label: 'First-year tuition waived', value: money(quote.waived, item.currency), tone: 'neutral' }, { id: 'bill', label: 'First-year tuition billed', value: money(quote.billed, item.currency), tone: 'neutral' }, ...(id === 'loan' && quote.billed > 0n ? [{ id: 'interest', label: 'Student loan annual interest', value: quote.interestBps / 100 + '%', tone: 'neutral' as const }] : []), { id: 'duration', label: 'Course length', value: item.requiredMonths / 12 + ' years', tone: 'neutral' }], confirmLabel: 'Accept Place And Enrol' } }); return;
      }
      if (dialog.kind !== 'confirm') return;
      submitting.current = true;
      try { if (await dispatch(dialog.command) && mounted.current && identityRef.current === identity) setDialog(saved => saved === dialog ? null : saved); }
      finally { submitting.current = false; }
    }} />
  </>;
}
