import React, { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { conditions } from '../../src/game/content/health';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
import { FilterTabs } from '../../src/ui/FilterTabs';

const filters = [{ id: 'all', label: 'All' }, { id: 'current', label: 'Current' }, { id: 'past', label: 'Past' }] as const;

export default function MedicalConditions() {
  const world = useGame(s => s.world)!, person = world.people[world.activePersonId]; const [filter, setFilter] = useState<'all' | 'current' | 'past'>('all');
  const sections = [{ id: 'current', title: 'Current conditions' }, { id: 'past', title: 'Past conditions' }] as const;
  return <Page><Header title="Medical Conditions" onBack={() => router.back()} />
    <FilterTabs values={filters} selected={filter} onSelect={setFilter} />
    {sections.filter(section => filter === 'all' || filter === section.id).map(section => {
      const visible = person.health.conditions.filter(item => (item.status === 'recovered') === (section.id === 'past'));
      return <Card key={section.id}>
        <Heading size={18}>{section.title}</Heading>
        {visible.length === 0 && <Body muted>No {section.id} conditions recorded.</Body>}
        {visible.map(item => <ActionRow key={item.id}
          title={item.diagnosed ? conditions[item.type].name : item.status === 'recovered' ? 'Resolved symptoms' : 'Undiagnosed symptoms'}
          subtitle={item.status === 'recovered' ? item.resolved ? 'Resolved in ' + item.resolved.year : 'Recovery recorded' : !item.diagnosed ? conditions[item.type].symptoms : item.treatment ? 'Treatment in progress' : 'Care available'}
          value={item.status === 'recovered' ? 'Resolved' : item.status === 'controlled' ? 'Controlled' : 'Active'}
          icon={<HealthLegalArt id={section.id === 'past' ? 'care' : 'medicine'} size={40} />}
          onPress={() => router.push({ pathname: '/condition/[id]', params: { id: item.id } })} />)}
      </Card>;
    })}
    <Card><Heading size={18}>Need an assessment?</Heading><Body>Symptoms hanging around? Talk to a clinician. Diagnosis is the first step towards care.</Body><Button label="Visit the Doctor" onPress={() => router.push('/doctor')} /></Card>
  </Page>;
}
