import { currentHourlyRate, hourlyContract } from '../../src/game/systems/hourlyWork';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGame } from '../../src/state/useGame';
import { jobs, jobRanks } from '../../src/game/content/jobs';
import { accountFor } from '../../src/game/systems/common';
import { formatMoney } from '../../src/game/money';
import { ageOn } from '../../src/game/model';
import { monthlyAmount, rules } from '../../src/game/rules';
import { ActionRow, Body, Button, Card, Header, Heading, Page, StatBar } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { Illustration } from '../../src/assets/Illustration';
import { EmploymentArt } from '../../src/assets/EmploymentArt';
import { useColors } from '../../src/ui/theme';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { workRaiseReason } from '../../src/game/systems/workplaces';

export default function Work() {
  const world = useGame(s => s.world)!; const dispatch = useGame(s => s.dispatch); const busy = useGame(s => s.busy); const error = useGame(s => s.error); const c = useColors();
  const player = world.people[world.activePersonId]; const job = player.employment; const role = jobs.find(candidate => candidate.id === job?.roleId); const account = accountFor(world); const rule = rules[player.country];
  const workplace = currentWorkplace(world), hourly = job ? hourlyContract(world, job.id) : undefined;
  const time = (minutes: number) => Math.floor(minutes / 60) + 'h' + (minutes % 60 ? ' ' + minutes % 60 + 'm' : '');
  const supervisor = workplace?.members.find(item => item.role === 'supervisor' && !item.left);
  const [dialog, setDialog] = useState<'routine' | 'quit' | 'retire' | null>(null);
  const [pensionPage, setPensionPage] = useState(0);
  const event: EventPresentation | null = dialog === 'routine' ? { id: 'work-effort', kind: 'selection', title: 'Work routine', body: 'Taking it easy lowers stress and performance. Working hard can raise both. Balanced keeps effort steady; health and discipline also matter.', choices: [{ id: 'relaxed', label: 'Take it easy' }, { id: 'balanced', label: 'Balanced' }, { id: 'hard', label: 'Work hard' }].map(choice => ({ ...choice, disabledReason: choice.id === job?.effort ? 'This is your current routine' : undefined })), confirmLabel: 'Set Routine' } : dialog ? { id: dialog, kind: 'confirmation', title: dialog === 'quit' ? 'Resign from this job?' : 'Retire from work?', body: dialog === 'quit' ? 'Your pay will stop. You keep money already earned.' : 'Your job will end and an earned pension will start as time passes.', terms: [], confirmLabel: dialog === 'quit' ? 'Resign' : 'Retire' } : null;
  const retirementReason = ageOn(player, world.date) < rule.retirementAge ? 'Available from age ' + rule.retirementAge : player.finance.pensionAnnual > 0n ? 'You already receive a pension' : player.finance.serviceMonths < 120 ? 'Ten years of recorded work are required' : undefined;
  return <Page><Header title="Occupation" onBack={() => router.back()} />
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><EmploymentArt roleId={job?.roleId} size={64} /><View style={{ flex: 1, gap: 4 }}><Heading size={20}>{job && role ? jobRanks[job.rank] + ' ' + role.title : 'No current job'}</Heading>{job && <Body muted>{job.employer}</Body>}</View></View>
      {job ? <>{hourly && <Body>{formatMoney({ minor: currentHourlyRate(hourly), currency: job.currency })} per hour · {hourly.terms.weeklyHours} contracted hours/week</Body>}<Text style={{ color: c.positiveText, fontSize: 19, lineHeight: 27, fontWeight: '700' }}>{formatMoney({ minor: job.annualPay, currency: job.currency })} annual gross pay</Text><StatBar label="Performance" value={job.performance} color={c.blue} /><Body muted>{job.paidMonths} paid months · {job.effort} routine</Body></> : <Body muted>Find work that fits your qualifications, or explore a special career.</Body>}
    </Card>
    {error && !dialog && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text>}
    {job && <Card><Heading size={18}>At Work</Heading>
      <ActionRow title="Work routine" value={job.effort} icon={<Ionicons name="briefcase" size={32} color={c.blue} />} disabled={busy} onPress={() => setDialog('routine')} />
      {!role?.specialCareer && !job.companyId && <><ActionRow title="Ask for a Raise" subtitle="5% higher pay · Uses 6 energy" icon={<Ionicons name="trending-up" size={32} color={c.amber} />} disabled={busy} disabledReason={workRaiseReason(world, workplace, supervisor?.personId ?? '')} onPress={() => void dispatch({ type: 'request-raise', workplaceId: workplace!.id, supervisorId: supervisor!.personId })} /><ActionRow title="View Coworkers" subtitle={workplace ? 'Your supervisor and colleagues' : 'Introduce yourself to your team'} icon={<Ionicons name="people" size={32} color={c.blue} />} onPress={() => router.push({ pathname: '/coworkers', params: { tab: 'activities' } })} /></>}
      <ActionRow title="Resign" icon={<Ionicons name="exit-outline" size={32} color={c.red} />} disabled={busy} onPress={() => setDialog('quit')} />
    </Card>}
    <Card><Heading size={18}>Career Options</Heading>
      <ActionRow title="Find a Job" subtitle="Browse pay and qualification requirements" icon={<Ionicons name="search" size={32} color={c.blue} />} onPress={() => router.push('/jobs')} />
      <ActionRow title="Education" subtitle="School, university and professional qualifications" icon={<Illustration id="education" size={38} />} onPress={() => router.push('/education')} />
      <ActionRow title="Business" subtitle="Your companies, actual staff and operating roles" icon={<Ionicons name="storefront" size={32} color={c.amber} />} onPress={() => router.push('/business')} />
      <ActionRow title="Special Careers" subtitle="Build skills and pursue timed professional contracts" icon={<Ionicons name="star" size={32} color={c.amber} />} onPress={() => router.push('/special-careers')} />
      {!job && world.workplaces.some(item => item.personId === player.id) && <ActionRow title="Previous Workplaces" subtitle="People from your employment history" icon={<Ionicons name="people" size={32} color={c.blue} />} onPress={() => router.push({ pathname: '/coworkers', params: { tab: 'activities' } })} />}
      <ActionRow title="Retirement" icon={<Ionicons name="time-outline" size={32} color={c.blue} />} disabled={busy} disabledReason={retirementReason} onPress={() => setDialog('retire')} />
    </Card>
    {job && <Card><Heading size={18}>Pay & Working Time</Heading>
      {hourly && <><Body muted>{hourly.terms.paidWeeks} paid weeks/year · Paid time: {time(hourly.periods.reduce((sum, row) => sum + row.paidMinutes, 0))} · Worked time: {time(hourly.periods.reduce((sum, row) => sum + row.workedMinutes, 0))}</Body><Body muted>Contract hours stay fixed. Monthly quotes assume normal attendance; paid leave and hospital care add no worked time.</Body></>}
      <Body muted>Next full month’s gross pay: {formatMoney({ minor: monthlyAmount(job.annualPay, job.paidMonths), currency: job.currency })}. Income tax is withheld as pay arrives.</Body><Body muted>Annual reviews can bring promotion after sustained strong performance, or dismissal after poor performance.</Body>{role?.partTime && player.education.stage === 'none' && ageOn(player, world.date) >= rule.adultAge && <Body muted>This is a part-time role. You can compare full-time options in Find a Job.</Body>}
    </Card>}
    {player.finance.pensionAnnual > 0n && <Card><Heading size={18}>Your Pension</Heading>
      <Body>Annual pension: {formatMoney({ minor: player.finance.pensionAnnual, currency: player.finance.earningsCurrency })}</Body>
      {player.finance.earningsCurrency !== account.currency && <Body muted>Payments are converted into your residence currency at the current exchange quote, less a 1% conversion fee. Past earnings keep their original currency.</Body>}
    </Card>}
    {!!player.finance.pensionReceipts.length && <Card><Heading size={19}>Pension Payments</Heading>{[...player.finance.pensionReceipts].reverse().slice(pensionPage * 12, (pensionPage + 1) * 12).map(payment => <React.Fragment key={payment.firstPeriod}><Body>{Math.floor(payment.month / 12)}-{String(payment.month % 12 + 1).padStart(2, '0')} · {payment.periods} monthly period{payment.periods === 1 ? '' : 's'}</Body><Body>Earned payment: {formatMoney({minor:payment.nativeGross,currency:payment.sourceCurrency})}</Body>{payment.sourceCurrency !== payment.currency && <Body>Converted gross: {formatMoney({minor:payment.gross,currency:payment.currency})} · Fee: {formatMoney({minor:payment.fee,currency:payment.currency})}</Body>}<Body>Tax withheld: {formatMoney({minor:payment.withheld,currency:payment.currency})} · Paid: {formatMoney({minor:payment.gross-payment.fee-payment.withheld,currency:payment.currency})}</Body></React.Fragment>)}<Button label="Newer Pension Payments" tone="secondary" disabled={!pensionPage} onPress={()=>setPensionPage(pensionPage-1)}/><Button label="Earlier Pension Payments" tone="secondary" disabled={(pensionPage+1)*12>=player.finance.pensionReceipts.length} onPress={()=>setPensionPage(pensionPage+1)}/></Card>}
    <EventModal event={event} busy={busy} error={error} onCancel={() => setDialog(null)} onChoose={async id => { if (busy || !dialog || dialog === 'routine' && id === job?.effort) return; const saved = await dispatch(dialog === 'routine' ? { type: 'work-effort', effort: id as 'relaxed' | 'balanced' | 'hard' } : { type: dialog === 'quit' ? 'quit-job' : 'retire' }); if (saved) setDialog(null); }} />
  </Page>;
}
