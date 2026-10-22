import React from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { careerKinds, careerCatalog, CareerKind, skillContent } from '../../../src/game/content/careers';
import { careerPayQuote, selectionReason } from '../../../src/game/systems/careers';
import { ageOn, fullName } from '../../../src/game/personHelpers';
import { countries } from '../../../src/game/countries';
import { formatMoney } from '../../../src/game/money';
import { ActionRow, Body, Button, Card, Header, Heading, Page, Portrait, StatBar } from '../../../src/ui/components';
import { CareerArt } from '../../../src/assets/CareerArt';
import { useCareerReview } from '../../../src/ui/CareerReview';
import { SocialBusinessFacts, SocialBusinessIntro } from '../../../src/ui/SocialBusinessPresentation';
import { useColors } from '../../../src/ui/theme';

export default function CareerDashboard() {
    const { kind: raw } = useLocalSearchParams<{ kind: string }>(), world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), review = useCareerReview(raw), c = useColors();
    if (!careerKinds.includes(raw as CareerKind))
        return <Page><Header title="Special Careers" onBack={() => router.back()} /><Body>This career is unavailable.</Body></Page>;
    const kind = raw as CareerKind, definition = careerCatalog[kind], person = world.people[world.activePersonId], career = world.careers.find(item => item.personId === person.id && item.kind === kind), project = career?.projects.find(item => item.status === 'active'), currency = countries[person.country].currency, money = (minor: bigint) => formatMoney({ minor, currency }), reason = selectionReason(world, kind), quote = careerPayQuote(world, kind), active = career?.status === 'active', selection = kind === 'model' ? 'Casting' : kind === 'athlete' ? 'Tryout' : 'Audition';
    const status = !career ? 'Explore entry requirements below' : career.status === 'active' ? 'Under contract' : career.status === 'between' ? 'Between contracts' : career.status === 'left' ? 'You have left this career' : career.status === 'retired' ? 'Retired from this career' : 'Career ended';
    const training = person.training?.skill === definition.skill ? person.training : undefined, history = career?.projects.filter(item => item.status !== 'active').slice().reverse() ?? [];
    const requirements = [
        { label: 'Age', value: String(ageOn(person, world.date)), note: 'Required: ' + definition.minAge + '–' + definition.maxAge },
        { label: skillContent[definition.skill].title, value: person.skills[definition.skill] + '%', note: 'Required: ' + definition.threshold + '%' },
        ...(['health', 'fitness', 'looks', 'smarts'] as const).filter(stat => definition[stat] > 0).map(stat => ({ label: stat[0].toUpperCase() + stat.slice(1), value: person.stats[stat] + '%', note: 'Required: ' + definition[stat] + '%' })),
    ];
    return <Page>
        <Header title={definition.title} onBack={() => router.back()} />
        {error && !review.reviewing && !world.pending && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text>}
        <Card>
            <SocialBusinessIntro art={<CareerArt id={definition.art} size={72} />} title={definition.title} eyebrow={status} body={active ? career.employer : 'Build your skill, review the requirements and choose your next step.'} />
            <StatBar label={skillContent[definition.skill].title} value={person.skills[definition.skill]} color={c.blue} />
            {career && <><StatBar label="Reputation" value={career.reputation} color={c.green} /><Body muted>Career level {career.rank + 1} · {career.projects.filter(item => item.status === 'completed').length} completed projects</Body></>}
            {active && <SocialBusinessFacts items={[
                { label: 'Annual gross rate', value: formatMoney({ minor: person.employment!.annualPay, currency: person.employment!.currency }), note: 'Before tax. Pay arrives as working months pass.' },
                { label: 'Contract remaining', value: career.contractMonthsRemaining + ' months', note: 'Time remaining on your current contract.' },
            ]} />}
        </Card>
        <Card>
            <Heading size={19}>Career Actions</Heading>
            {kind === 'politician' && <ActionRow title="Campaigns & Constituents" subtitle="Elections, public meetings and service" icon={<CareerArt id="politician" size={36} />} onPress={() => router.push('/politics')} />}
            {kind === 'musician' && <ActionRow title="Music Studio" subtitle="Record releases and review actual listening royalties" icon={<CareerArt id="musician" size={36} />} onPress={() => router.push('/music-studio')} />}
            <ActionRow title={'Train ' + skillContent[definition.skill].title} subtitle="Self-directed practice or funded coaching" icon={<CareerArt id="training" size={36} />} onPress={() => router.push('/career-training')} />
            {training && <Body muted>{training.mode === 'coached' ? 'Coached' : 'Self-directed'} {skillContent[definition.skill].title.toLowerCase()} · {training.months} recorded training months</Body>}
        </Card>
        {project && <Card>
            <Heading size={20}>{project.name}</Heading>
            <Body>{project.months} of {project.targetMonths} calendar periods</Body>
            <StatBar label="Progress" value={Math.round(project.months * 100 / project.targetMonths)} color={c.blue} />
            <SocialBusinessFacts items={[
                { label: 'Gross earned so far', value: formatMoney({ minor: project.grossEarned, currency: project.currency }), note: 'Before tax; separate from the annual contract rate.' },
                { label: 'Attended periods', value: String(project.periods.filter(item => item.attended).length), ...(kind === 'athlete' ? { note: project.periods.filter(item => item.success).length + ' wins' } : {}) },
            ]} />
            <Body muted>Health and absences affect recorded quality. The final audience response is resolved when the project ends.</Body>
        </Card>}
        {!active && kind === 'politician' && <Card><ActionRow title="Plan an Election Campaign" subtitle="Run for a local seat and review the real campaign budget" onPress={() => router.push('/politics')} /></Card>}
        {!active && kind !== 'politician' && <Card>
            <Heading size={20}>Find Your Next Contract</Heading>
            <SocialBusinessFacts items={[
                { label: 'Quoted annual gross rate', value: money(quote), note: 'If selected. No salary is paid when you sign.' },
                { label: 'Contract length', value: definition.contractMonths + ' calendar months' },
            ]} />
            <Heading size={18}>Your Entry Requirements</Heading>
            <Body muted>Compare your current age, skill and stats with the contract requirements.</Body>
            <SocialBusinessFacts items={requirements} />
            <Body muted>Two selection attempts are available per calendar year. Talent and prior reputation improve your chances; signing pays no salary upfront.</Body>
            {reason && <Body muted>{reason}</Body>}
            <Button label={'Review ' + selection} disabled={busy || !!reason} onPress={() => review.confirm({ type: 'select-career', kind, quotedAnnualPay: quote }, 'Attend the ' + selection.toLowerCase() + '?', kind === 'athlete' ? 'If selected, you join an actual team contract with twelve-month seasons. Monthly pay, match attendance, performance and injuries are recorded.' : 'If selected, you sign a timed paid contract. Quality and the saved audience response determine the result. Pay stops when the contract ends.', [{ id: 'pay', label: 'Annual gross rate', value: money(quote), tone: 'neutral' }, { id: 'term', label: 'Calendar contract', value: definition.contractMonths + ' months', tone: 'neutral' }], definition.art, 'Attend ' + selection)} />
        </Card>}
        {active && <Card>
            <Heading size={20}>Your Approach</Heading>
            <Body muted>Choose how to approach future working months. Your current focus is checked.</Body>
            {(['craft', 'balanced', 'publicity'] as const).map(focus => <ActionRow key={focus} title={kind === 'politician' && focus === 'craft' ? 'Focus on Casework' : focus === 'craft' ? 'Focus on the Work' : focus === 'balanced' ? 'Keep a Balance' : 'Build Public Exposure'} subtitle={focus === 'craft' ? 'Higher quality with greater energy and stress costs' : focus === 'publicity' ? 'More exposure, with less attention to the work' : 'Sustainable monthly effort'} accessibilityRole="radio" accessibilityState={{ checked: career.focus === focus }} disabled={busy} disabledReason={career.focus === focus ? 'This is your current career focus' : undefined} onPress={() => review.confirm({ type: 'career-focus', careerId: career.id, focus }, 'Update your career focus?', 'The change applies during future actual working periods.', [], definition.art, 'Set Career Focus')} />)}
        </Card>}
        {!!career?.contacts.length && <Card><Heading size={19}>People You Work With</Heading>{career.contacts.map(id => {
            const contact = world.people[id]; return <ActionRow key={id} title={fullName(contact)} subtitle={contact.died ? 'Deceased' : contact.employment?.employer ?? 'Former colleague'} icon={<Portrait personId={contact.id} appearance={contact.appearance} age={ageOn(contact, world.date)} name={fullName(contact)} size={40} />} onPress={() => router.push({ pathname: '/person/[id]', params: { id } })} />;
        })}</Card>}
        {career && <Card>
            <Heading size={20}>Your Work</Heading>
            {!history.length && <Body muted>No completed or cancelled projects yet. Your current project is shown above.</Body>}
            {history.map(item => <View key={item.id} style={{ gap: 6, borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 14 }}>
                <Heading size={18}>{item.name}</Heading>
                <Body muted>{item.status} · {item.ended?.year} · {item.months} recorded periods</Body>
                <SocialBusinessFacts items={[{ label: 'Recorded gross earnings', value: formatMoney({ minor: item.grossEarned, currency: item.currency }), note: 'Before tax. Quality ' + item.quality + '%' }]} />
                {item.award && <Body>{item.award}</Body>}
            </View>)}
        </Card>}
        {career && ['active', 'between'].includes(career.status) && <Card><ActionRow title="Leave This Career" subtitle="End future contract pay; keep your recorded work and skills" disabled={busy} disabledReason={undefined} onPress={() => review.confirm({ type: 'leave-career', careerId: career.id }, 'Leave this career?', 'Your current contract ends and any unfinished project is cancelled. Money already earned, skills, contacts and completed projects remain.', [], definition.art, 'Leave Career')} /></Card>}
        {review.modal}
    </Page>;
}
