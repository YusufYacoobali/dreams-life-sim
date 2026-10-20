import React, { useState } from 'react';
import { Keyboard, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { jobs } from '../../src/game/content/jobs';
import { jobInterviews } from '../../src/game/content/jobInterviews';
import { jobReason, salaryFor } from '../../src/game/systems/work';
import { accountFor } from '../../src/game/systems/common';
import { formatMoney } from '../../src/game/money';
import { monthlyAmount } from '../../src/game/rules';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { useColors } from '../../src/ui/theme';

export default function Jobs() {
  const world = useGame(s => s.world)!; const dispatch = useGame(s => s.dispatch); const busy = useGame(s => s.busy); const error = useGame(s => s.error); const c = useColors();
  const [showAll, setShowAll] = useState(false), [selected, setSelected] = useState<string | null>(null), [search, setSearch] = useState(''), [kind, setKind] = useState<'all' | 'part' | 'full'>('all');
  const account = accountFor(world), person = world.people[world.activePersonId], role = jobs.find(candidate => candidate.id === selected);
  const ordinary = jobs.filter(job => !job.specialCareer), eligible = ordinary.filter(job => !jobReason(world, job));
  const query = search.trim().toLocaleLowerCase();
  const rows = (showAll ? ordinary : eligible).filter(job => (kind === 'all' || !!job.partTime === (kind === 'part')) && (job.title + ' ' + job.sector).toLocaleLowerCase().includes(query));
  if (role) {
    const annualPay = salaryFor(world, role), reason = jobReason(world, role);
    return <Page footer={<>{error && <Body>{error}</Body>}<Button label="Apply for this Job" busy={busy} disabled={!!reason} onPress={async () => { Keyboard.dismiss(); if (await dispatch({ type: 'apply-job', roleId: role.id })) setSelected(null); }} />{reason && <Body muted>{reason}</Body>}</>}>
      <Header title="Job Detail" onBack={() => setSelected(null)} />
      <Card><Heading>{role.title}</Heading><Body>{person.city + ' ' + role.sector}</Body><Body>{formatMoney({ minor: annualPay, currency: account.currency })} annual gross pay</Body></Card>
      <Card><Body>Work type: {role.partTime ? 'Part-time' : 'Full-time'}</Body><Body>Location: {person.city}</Body><Body>Requirements: {role.qualification ? role.qualification + (role.field ? ' in ' + role.field : ' qualification') : 'No formal qualification'}{role.smarts ? ' · Smarts ' + role.smarts + '%' : ''}</Body><Body>{jobInterviews[role.id].duties}</Body></Card>
      <Card><Heading size={18}>Before you apply</Heading><Body>First full month’s gross pay: {formatMoney({ minor: monthlyAmount(annualPay, 0), currency: account.currency })}</Body><Body muted>Pay arrives as months pass, with income tax withheld. This quote assumes a full working month. There is no payment for applying or starting a job.</Body><Body>{person.employment ? 'A successful interview replaces your current job. If you are declined or withdraw, your current work continues.' : 'You will answer an interview question before the employer makes a decision.'}</Body><Body muted>You can apply for each role once per year, including an application you withdraw.</Body></Card>
    </Page>;
  }
  return <Page><Header title="Find a Job" onBack={() => router.back()} />
    <TextInput accessibilityLabel="Search jobs" placeholder="Search jobs or sectors" placeholderTextColor={c.muted} value={search} onChangeText={setSearch} style={{ color: c.ink, backgroundColor: c.inset, borderRadius: 12, padding: 12, fontSize: 16 }} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{([['all', 'All Jobs'], ['part', 'Part-time'], ['full', 'Full-time']] as const).map(([id, label]) => <Button key={id} label={label} tone={kind === id ? 'primary' : 'secondary'} onPress={() => setKind(id)} />)}</View>
    <Heading size={18}>{rows.length} {showAll ? 'matching' : 'eligible'} roles</Heading><Button label={showAll ? 'Show Eligible Roles' : 'Show All Requirements'} tone="secondary" onPress={() => setShowAll(!showAll)} />{error && <Body>{error}</Body>}
    {rows.length === 0 && <Card><Body>No roles match these filters. Try another search or view all requirements.</Body></Card>}
    <Card>{rows.map(job => <ActionRow key={job.id} title={job.title} subtitle={formatMoney({ minor: salaryFor(world, job), currency: account.currency }) + ' / year · ' + (job.partTime ? 'Part-time' : 'Full-time')} onPress={() => { Keyboard.dismiss(); setSelected(job.id); }} />)}</Card>
  </Page>;
}
