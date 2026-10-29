import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { skillIds, skillContent, SkillId } from '../../src/game/content/careers';
import { coachingCost, trainingReason } from '../../src/game/systems/careers';
import { countries } from '../../src/game/countries';
import { formatMoney } from '../../src/game/money';
import { ActionRow, Body, Button, Card, Header, Heading, Page, StatBar } from '../../src/ui/components';
import { CareerArt } from '../../src/assets/CareerArt';
import { useColors } from '../../src/ui/theme';
import { useCareerReview } from '../../src/ui/CareerReview';
import { DisplayText as Text } from '../../src/ui/DisplayText';

export default function CareerTraining() {
    const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), person = world.people[world.activePersonId], c = useColors(), review = useCareerReview(), [skill, setSkill] = useState<SkillId>('acting'), [mode, setMode] = useState<'self' | 'coached'>('self'), reason = trainingReason(world, skill), cost = mode === 'coached' ? coachingCost(world) : 0n, money = formatMoney({ minor: cost, currency: countries[person.country].currency });
    return <Page footer={!review.reviewing && !world.pending ? <>
        <Body muted>{skillContent[skill].title} · {mode === 'coached' ? 'Coached sessions' : 'Self-directed practice'}</Body>
        {reason && <Body muted>{reason}</Body>}
        {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text>}
        <Button label="Review Training Routine" disabled={busy || !!reason} onPress={() => review.confirm({ type: 'career-training', skill, mode }, 'Start ' + skillContent[skill].title.toLowerCase() + ' training?', 'Replace your current routine with monthly practice. Coaching pauses if tuition goes unpaid; exhaustion can stall progress.', [{ id: 'cost', label: 'Monthly tuition', value: money, tone: cost ? 'negative' : 'neutral' }], skillContent[skill].art, 'Set Training Routine')}/>
    </> : undefined}>
        <Header title="Skills & Training" backDisabled={busy} onBack={() => { if (!busy) router.back(); }}/>
        <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <CareerArt id={skillContent[skill].art} size={56}/>
                <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <Body muted>Training plan</Body><Heading size={21}>{skillContent[skill].title}</Heading>
                    <Body>{mode === 'coached' ? 'Coached sessions' : 'Self-directed practice'} · {money} / month</Body>
                </View>
            </View>
            <StatBar label={skillContent[skill].title + ' skill'} value={person.skills[skill]} color={c.blue}/>
        </Card>
        {person.training && <Card><Heading size={19}>Your Current Routine</Heading><Body>{skillContent[person.training.skill].title} · {person.training.mode === 'coached' ? 'Coached sessions' : 'Self-directed practice'}</Body><Body>{person.training.months} attended training months</Body><Body>Current routine fees: {formatMoney({ minor: person.training.fees, currency: person.training.currency })}</Body><Button label="Stop Training" tone="secondary" disabled={busy} onPress={() => review.confirm({ type: 'stop-career-training' }, 'Stop the training routine?', 'Your learned skills remain. Future coached-session fees stop.', [], skillContent[person.training!.skill].art, 'Stop Training')}/></Card>}
        <Card><Heading size={19}>Make Time to Practise</Heading><View accessibilityRole="radiogroup" accessibilityLabel="Practice method">
            <ActionRow title="Self-directed Practice" subtitle="No tuition · up to one skill point per attended month" accessibilityRole="radio" accessibilityState={{ checked: mode === 'self' }} disabled={busy} onPress={() => { if (!busy && mode !== 'self') setMode('self'); }}/>
            <ActionRow title="Coached Sessions" subtitle="Up to two skill points per attended month; available funding required" accessibilityRole="radio" accessibilityState={{ checked: mode === 'coached' }} disabled={busy} onPress={() => { if (!busy && mode !== 'coached') setMode('coached'); }}/>
        </View><Body muted>A parent or guardian pays for a child’s coaching; inheritance stays protected. Fatigue, hospital care and custody can interrupt practice.</Body></Card>
        <Card><Heading size={19}>Choose a Skill</Heading><View accessibilityRole="radiogroup" accessibilityLabel="Training skill">{skillIds.map(id => <ActionRow key={id} title={skillContent[id].title} subtitle={'Available from age ' + skillContent[id].minAge} value={person.skills[id] + '%'} accessibilityRole="radio" accessibilityState={{ checked: skill === id }} disabled={busy} icon={<CareerArt id={skillContent[id].art} size={36}/>} onPress={() => { if (!busy && skill !== id) setSkill(id); }}/>)}</View></Card>
        {review.modal}
    </Page>;
}
