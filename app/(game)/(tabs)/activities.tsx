import React from 'react';
import { router } from 'expo-router';
import { ActionRow, Card, Header, Page } from '../../../src/ui/components';
import { Illustration } from '../../../src/assets/Illustration';

export default function Activities() {
  return <Page><Header title="Activities" />
    <Card>
      <ActionRow title="Education" subtitle="Study, qualifications and tuition" icon={<Illustration id="education" />} onPress={() => router.push('/education')} />
      <ActionRow title="Occupation" subtitle="Jobs, performance and retirement" icon={<Illustration id="career" />} onPress={() => router.push('/work')} />
      <ActionRow title="Family" subtitle="Children, family planning and generations" icon={<Illustration id="relationship" />} onPress={() => router.push('/family')} />
      <ActionRow title="Health" subtitle="Your health, energy, fitness and stress" icon={<Illustration id="wellbeing" />} onPress={() => router.push('/health')} />
      <ActionRow title="My Life" subtitle="Your identity and personal profile" icon={<Illustration id="journal" />} onPress={() => router.push({ pathname: '/profile', params: { tab: 'activities' } })} />
      <ActionRow title="Saved Lives" subtitle="Import, export or restore a checkpoint" icon={<Illustration id="property" />} onPress={() => router.push('/saved-lives')} />
    </Card>
  </Page>;
}
