import React, { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { jobs } from '../../src/game/content/jobs';
import { jobReason, salaryFor } from '../../src/game/systems/work';
import { accountFor } from '../../src/game/systems/common';
import { formatMoney } from '../../src/game/money';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';

export default function Jobs() {
  const world = useGame(s => s.world)!; const dispatch = useGame(s => s.dispatch); const busy = useGame(s => s.busy); const error = useGame(s => s.error);
  const [showAll, setShowAll] = useState(false); const [selected, setSelected] = useState<string | null>(null);
  const account = accountFor(world); const role = jobs.find(candidate => candidate.id === selected);
  const ordinary = jobs.filter(job => !job.specialCareer), eligible = ordinary.filter(job => !jobReason(world, job)); const rows = showAll ? ordinary : eligible;
  const event: EventPresentation | null = role ? { id: 'apply:' + role.id, kind: 'confirmation', title: 'Apply for ' + role.title + '?', body: world.people[world.activePersonId].employment ? 'If you are hired, this replaces your current job. An unsuccessful application leaves your current work unchanged.' : 'Hiring depends on your application. Pay starts as time passes after you are hired.', terms: [{ id: 'pay', label: 'Annual gross pay', value: formatMoney({ minor: salaryFor(world, role), currency: account.currency }), tone: 'neutral' }, { id: 'sector', label: 'Sector', value: role.sector, tone: 'neutral' }], confirmLabel: 'Apply' } : null;
  return <Page><Header title="Find a Job" onBack={() => router.back()} /><Heading size={18}>{eligible.length} eligible roles</Heading><Button label={showAll ? 'Show Eligible Roles' : 'Show All Requirements'} tone="secondary" onPress={() => setShowAll(!showAll)} />{error && <Body>{error}</Body>}
    {rows.length === 0 && <Card><Body>No role is currently available to you. View all requirements to see what to work towards.</Body></Card>}
    <Card>{rows.map(job => <ActionRow key={job.id} title={job.title} subtitle={formatMoney({ minor: salaryFor(world, job), currency: account.currency }) + ' / year · ' + job.sector} disabledReason={jobReason(world, job)} onPress={() => setSelected(job.id)} />)}</Card>
    <EventModal event={event} busy={busy} onCancel={() => setSelected(null)} onChoose={() => { if (role) { setSelected(null); void dispatch({ type: 'apply-job', roleId: role.id }); } }} />
  </Page>;
}
