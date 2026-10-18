import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { conditions } from '../../src/game/content/health';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
export default function MedicalConditions() {
  const world = useGame(s => s.world)!, person = world.people[world.activePersonId]; const [filter, setFilter] = useState<'all' | 'current' | 'past'>('all');
  const visible = person.health.conditions.filter(item => filter === 'all' || (filter === 'past' ? item.status === 'recovered' : item.status !== 'recovered'));
  return <Page><Header title="Medical Conditions" onBack={() => router.back()} /><View style={{ flexDirection: 'row', gap: 8 }}>{(['all', 'current', 'past'] as const).map(value => <View key={value} style={{ flex: 1 }}><Button label={value[0].toUpperCase() + value.slice(1)} tone={filter === value ? 'primary' : 'secondary'} onPress={() => setFilter(value)} /></View>)}</View>
    <Card>{visible.length === 0 && <Body muted>No {filter === 'all' ? 'recorded' : filter} conditions.</Body>}{visible.map(item => <ActionRow key={item.id} title={item.diagnosed ? conditions[item.type].name : item.status === 'recovered' ? 'Resolved symptoms' : 'Undiagnosed symptoms'} subtitle={item.status === 'recovered' ? 'Resolved in ' + item.resolved?.year : item.status === 'controlled' ? 'Controlled with ongoing care' : item.diagnosed ? 'Active · ' + (item.treatment ? 'Treatment in progress' : 'Care available') : conditions[item.type].symptoms} icon={<HealthLegalArt id={item.status === 'recovered' ? 'care' : 'medicine'} size={40} />} onPress={() => router.push({ pathname: '/condition/[id]', params: { id: item.id } })} />)}</Card>
    <Card><Heading size={18}>Need an assessment?</Heading><Body>Persistent symptoms can be discussed with a clinician. A diagnosis and recovery are separate parts of your medical record.</Body><Button label="Visit the Doctor" onPress={() => router.push('/doctor')} /></Card>
  </Page>;
}
