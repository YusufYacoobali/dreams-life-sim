import React from 'react';
import { router } from 'expo-router';
import { ActionRow, Card, Header, Page } from '../../src/ui/components';
import { Illustration } from '../../src/assets/Illustration';

export default function Activities() {
  return <Page><Header title="Activities" />
    <Card>
      <ActionRow title="Family" subtitle="Your parents and the people in your life" icon={<Illustration id="relationship" />} onPress={() => router.navigate('/relationships')} />
      <ActionRow title="Health" subtitle="Your health, energy, fitness and stress" icon={<Illustration id="wellbeing" />} onPress={() => router.push('/health')} />
      <ActionRow title="My Life" subtitle="Your identity and personal profile" icon={<Illustration id="journal" />} onPress={() => router.push({ pathname: '/profile', params: { tab: 'activities' } })} />
      <ActionRow title="Saved Lives" subtitle="Import, export or restore a checkpoint" icon={<Illustration id="property" />} onPress={() => router.push('/saved-lives')} />
    </Card>
  </Page>;
}
