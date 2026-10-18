import React, { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { jobs, jobRanks } from '../../src/game/content/jobs';
import { accountFor } from '../../src/game/systems/common';
import { formatMoney } from '../../src/game/money';
import { ageOn } from '../../src/game/model';
import { rules } from '../../src/game/rules';
import { ActionRow, Body, Card, Header, Heading, Page, StatBar } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { Illustration } from '../../src/assets/Illustration';
import { useColors } from '../../src/ui/theme';

export default function Work() {
  const world = useGame(s => s.world)!; const dispatch = useGame(s => s.dispatch); const busy = useGame(s => s.busy); const error = useGame(s => s.error); const c = useColors();
  const player = world.people[world.activePersonId]; const job = player.employment; const role = jobs.find(candidate => candidate.id === job?.roleId); const account = accountFor(world); const rule = rules[player.country];
  const [dialog, setDialog] = useState<'routine' | 'quit' | 'retire' | null>(null);
  const event: EventPresentation | null = dialog === 'routine' ? { id: 'work-effort', kind: 'selection', title: 'Work routine', body: 'Effort affects performance and stress as time passes.', choices: [{ id: 'relaxed', label: 'Take it easy' }, { id: 'balanced', label: 'Balanced' }, { id: 'hard', label: 'Work hard' }], confirmLabel: 'Set Routine' } : dialog ? { id: dialog, kind: 'confirmation', title: dialog === 'quit' ? 'Resign from this job?' : 'Retire from work?', body: dialog === 'quit' ? 'Your pay will stop. You keep money already earned.' : 'Your job will end and an earned pension will start as time passes.', terms: [], confirmLabel: dialog === 'quit' ? 'Resign' : 'Retire' } : null;
  const retirementReason = ageOn(player, world.date) < rule.retirementAge ? 'Available from age ' + rule.retirementAge : player.finance.pensionAnnual > 0n ? 'You already receive a pension' : player.finance.serviceMonths < 120 ? 'Ten years of recorded work are required' : undefined;
  return <Page><Header title="Occupation" onBack={() => router.back()} /><Card><Illustration id="career" size={64} /><Heading>{job && role ? jobRanks[job.rank] + ' ' + role.title : 'No current job'}</Heading>
    {job && <><Body>{job.employer}</Body><Body>{formatMoney({ minor: job.annualPay, currency: account.currency })} annual gross pay</Body><StatBar label="Performance" value={job.performance} color={c.blue} /><Body muted>{job.paidMonths} paid months · {job.effort} routine</Body></>}
    {player.finance.pensionAnnual > 0n && <Body>Annual pension: {formatMoney({ minor: player.finance.pensionAnnual, currency: account.currency })}</Body>}
  </Card>{error && <Body>{error}</Body>}<Card>
    <ActionRow title="Find a Job" subtitle="Browse pay and qualification requirements" onPress={() => router.push('/jobs')} />
    <ActionRow title="Education" subtitle="School, university and professional qualifications" onPress={() => router.push('/education')} />
    {job && <><ActionRow title="Work routine" value={job.effort} onPress={() => setDialog('routine')} /><ActionRow title="Resign" onPress={() => setDialog('quit')} /></>}
    <ActionRow title="Retirement" disabledReason={retirementReason} onPress={() => setDialog('retire')} />
  </Card><EventModal event={event} busy={busy} onCancel={() => setDialog(null)} onChoose={id => { setDialog(null); void dispatch(dialog === 'routine' ? { type: 'work-effort', effort: id as 'relaxed' | 'balanced' | 'hard' } : { type: dialog === 'quit' ? 'quit-job' : 'retire' }); }} /></Page>;
}
