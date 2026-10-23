import React, { useMemo, useState } from 'react';
import { FlatList, Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { jobs } from '../../src/game/content/jobs';
import { jobInterviews } from '../../src/game/content/jobInterviews';
import { hourlyAnnual, hourlyQuote, hourlyStudentReason } from '../../src/game/systems/hourlyWork';
import { hourlyHours } from '../../src/game/systems/hourlyWorkSchemas';
import type { HourlyTerms } from '../../src/game/systems/hourlyWorkSchemas';
import { jobReason, salaryFor } from '../../src/game/systems/work';
import { accountFor } from '../../src/game/systems/common';
import { formatMoney } from '../../src/game/money';
import { monthlyAmount } from '../../src/game/rules';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { FilterTabs } from '../../src/ui/FilterTabs';
import { EmploymentArt } from '../../src/assets/EmploymentArt';
import { useColors } from '../../src/ui/theme';

const jobFilters = [{ id: 'all', label: 'All Jobs' }, { id: 'part', label: 'Part-time' }, { id: 'full', label: 'Full-time' }] as const;
const ordinary = jobs.filter(job => !job.specialCareer);

export default function Jobs() {
  const identity = useGame(s => s.world ? s.world.id + ':' + s.world.activePersonId : 'none');
  return <JobBoard key={identity} />;
}

function JobBoard() {
  const world = useGame(s => s.world)!; const dispatch = useGame(s => s.dispatch); const busy = useGame(s => s.busy); const error = useGame(s => s.error); const c = useColors();
  const [showAll, setShowAll] = useState(false), [selected, setSelected] = useState<string | null>(null), [search, setSearch] = useState(''), [kind, setKind] = useState<'all' | 'part' | 'full'>('all');
  const [weeklyHours, setWeeklyHours] = useState<HourlyTerms['weeklyHours']>(12);
  const account = accountFor(world), person = world.people[world.activePersonId], role = jobs.find(candidate => candidate.id === selected);
  const eligible = useMemo(() => ordinary.filter(job => !jobReason(world, job)), [world]);
  const query = search.trim().toLocaleLowerCase();
  const rows = (showAll ? ordinary : eligible).filter(job => (kind === 'all' || !!job.partTime === (kind === 'part')) && (job.title + ' ' + job.sector).toLocaleLowerCase().includes(query));
  if (role) {
    const hourly = role.partTime ? hourlyQuote(person.country, role, weeklyHours) : undefined, annualPay = hourly ? hourlyAnnual(hourly) : salaryFor(world, role), reason = jobReason(world, role, false, weeklyHours);
    const money = (minor: bigint) => formatMoney({ minor, currency: account.currency });
    return <Page footer={<>{error && !world.pending && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text>}<Button label="Apply for this Job" busy={busy} disabled={!!reason} onPress={async () => { Keyboard.dismiss(); if (await dispatch({ type: 'apply-job', roleId: role.id, ...(hourly ? { reviewedHourlyTerms: hourly } : {}) })) setSelected(null); }} />{reason && <Body muted>{reason}</Body>}</>}>
      <Header title="Job Detail" backDisabled={busy} onBack={() => { if (!busy) setSelected(null); }} />
      <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><EmploymentArt roleId={role.id} size={64} /><View style={{ flex: 1, gap: 4 }}><Heading size={20}>{role.title}</Heading><Body muted>{person.city + ' · ' + role.sector}</Body></View></View><Text style={{ color: c.positiveText, fontSize: 19, lineHeight: 27, fontWeight: '700' }}>{formatMoney({ minor: annualPay, currency: account.currency })} annual gross pay</Text>{hourly && <Body>{money(hourly.hourlyRate)} per hour · {hourly.weeklyHours} hours per week</Body>}</Card>
      <Card><Heading size={18}>Role & Requirements</Heading><Body>Work type: {role.partTime ? 'Part-time' : 'Full-time'}</Body><Body>Location: {person.city}</Body><Body>Requirements: {role.qualification ? role.qualification + (role.field ? ' in ' + role.field : ' qualification') : 'No formal qualification'}{role.smarts ? ' · Smarts ' + role.smarts + '%' : ''}</Body>{role.experienceMonths && <Body>Experience: {role.experienceMonths} recorded paid months in {role.sector}</Body>}{role.clearBackground && <Body>A clear current background check is required.</Body>}<Body>{jobInterviews[role.id].duties}</Body></Card>
      {hourly && <Card><Heading size={18}>Contracted Hours</Heading>{hourlyHours.map(hours => { const blocked = hourlyStudentReason(world, hours); return <Pressable key={hours} accessibilityRole="radio" accessibilityLabel={hours + ' hours per week' + (blocked ? '. ' + blocked : '')} accessibilityState={{ checked: weeklyHours === hours, disabled: busy || !!blocked }} disabled={busy || !!blocked} onPress={() => setWeeklyHours(hours)} style={{ borderWidth: 1, borderColor: weeklyHours === hours ? c.blue : c.line, backgroundColor: weeklyHours === hours ? c.selected : c.surface, borderRadius: 12, minHeight: 52, padding: 14 }}><Body>{hours} hours per week</Body>{blocked && <Body muted>{blocked}</Body>}</Pressable>; })}<Body muted>Hours stay fixed for this contract. Students can work at most 16 hours a week. Evening recovery courses can fit around this job.</Body></Card>}
      {hourly && <Card><Heading size={18}>Paid & Worked Time</Heading><Body>{hourly.paidWeeks} paid weeks per year, spread across monthly pay.</Body><Body muted>Each worked month uses up to {hourly.weeklyHours / 4} Energy{hourly.weeklyHours === 20 ? ' and adds 1 Stress' : ''}, in addition to your effort routine. Paid leave and hospital care earn no worked time.</Body></Card>}
      <Card><Heading size={18}>Before you apply</Heading><Body>First full month’s gross pay: {formatMoney({ minor: monthlyAmount(annualPay, 0), currency: account.currency })}</Body><Body muted>Paid monthly, with income tax withheld. This quote assumes a full month of work; applying and signing are unpaid.</Body><Body>{person.employment ? 'A successful interview replaces your current job. Rejection or withdrawal leaves it in place.' : 'You will answer an interview question before the employer makes a decision.'}</Body><Body muted>You can apply for each role once per year, including an application you withdraw.</Body></Card>
    </Page>;
  }
  return <Page scroll={false} fillBody><Header title="Find a Job" onBack={() => router.back()} />
    <FlatList accessibilityLabel="Available jobs" data={rows} keyExtractor={job => job.id} style={{ flex: 1 }} keyboardShouldPersistTaps="handled" initialNumToRender={12} maxToRenderPerBatch={12} windowSize={5} contentContainerStyle={{ paddingBottom: 24 }}
      ListHeaderComponent={<View style={{ gap: 16, paddingBottom: 16 }}><TextInput accessibilityLabel="Search jobs" placeholder="Search jobs or sectors" placeholderTextColor={c.muted} value={search} onChangeText={setSearch} autoCorrect={false} autoCapitalize="none" returnKeyType="search" style={{ color: c.ink, backgroundColor: c.inset, borderRadius: 12, minHeight: 48, padding: 12, fontSize: 16 }} />
        <FilterTabs values={jobFilters} selected={kind} onSelect={setKind} />
        <Heading size={18}>{rows.length} {showAll ? 'matching' : 'eligible'} roles</Heading><Button label={showAll ? 'Show Eligible Roles' : 'Show All Requirements'} tone="secondary" onPress={() => setShowAll(!showAll)} />{error && !world.pending && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text>}
      </View>}
      ListEmptyComponent={<Card><Body>No roles match these filters. Try another search or view all requirements.</Body></Card>}
      renderItem={({ item: job, index }) => <View style={{ paddingHorizontal: 16, backgroundColor: c.surface, borderTopLeftRadius: index === 0 ? 16 : 0, borderTopRightRadius: index === 0 ? 16 : 0, borderBottomLeftRadius: index === rows.length - 1 ? 16 : 0, borderBottomRightRadius: index === rows.length - 1 ? 16 : 0 }}><ActionRow title={job.title} icon={<EmploymentArt roleId={job.id} size={44} />} subtitle={job.sector + (job.partTime ? ' · Part-time' : ' · Full-time')} value={job.partTime ? formatMoney({ minor: hourlyQuote(person.country, job).hourlyRate, currency: account.currency }) + ' / hour' : formatMoney({ minor: salaryFor(world, job), currency: account.currency }) + ' / year'} onPress={() => { Keyboard.dismiss(); setWeeklyHours(12); setSelected(job.id); }} /></View>} />
  </Page>;
}
