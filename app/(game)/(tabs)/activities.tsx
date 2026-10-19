import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColors } from '../../../src/ui/theme';
import { router } from 'expo-router';
import { ActionRow, Card, Header, Page } from '../../../src/ui/components';
import { Illustration } from '../../../src/assets/Illustration';
import { HealthLegalArt } from '../../../src/assets/HealthLegalArt';
import { useGame } from '../../../src/state/useGame';
import { isConfined } from '../../../src/game/systems/legalSchemas';
import { TravelArt } from '../../../src/assets/TravelArt';
import { FameBusinessArt } from '../../../src/assets/FameBusinessArt';

export default function Activities() {
  const c = useColors();
  const world = useGame(s => s.world)!, confined = isConfined(world);
  return <Page><Header title="Activities" />
    <Card>
      <ActionRow title={confined ? 'Prison Study & Work' : 'Education'} subtitle={confined ? 'Permitted routines while in custody' : 'Study, qualifications and tuition'} icon={<Illustration id="education" />} onPress={() => router.push(confined ? '/prison' : ['primary', 'secondary'].includes(world.people[world.activePersonId].education.stage) ? '/school' : '/education')} />
      <ActionRow title={confined ? 'Custody' : 'Occupation'} subtitle={confined ? 'Sentence, remand and permitted activities' : 'Jobs, performance and retirement'} icon={<Illustration id="career" />} onPress={() => router.push(confined ? '/prison' : '/work')} />
      <ActionRow title="Family" subtitle="Children, family planning and generations" icon={<Illustration id="relationship" />} onPress={() => router.push('/family')} />
      <ActionRow title="Health" subtitle="Your health, energy, fitness and stress" icon={<Illustration id="wellbeing" />} onPress={() => router.push('/health')} />
      <ActionRow title="Crime & Legal" subtitle="Risk, cases, prison and your record" icon={<HealthLegalArt id="handcuffs" />} onPress={() => router.push('/crime')} />
      <ActionRow title="Social Media" subtitle="Profiles, posts and creator connections" icon={<FameBusinessArt id="social" />} onPress={() => router.push('/social-media')} />
      <ActionRow title="Fame" subtitle="Your public image, opportunities and brand work" icon={<FameBusinessArt id="fame" />} onPress={() => router.push('/fame')} />
      <ActionRow title="Business" subtitle="Start a company, employ a team and manage growth" icon={<FameBusinessArt id="business" />} onPress={() => router.push('/business')} />
      <ActionRow title="Special Careers" subtitle="Selection, contracts and professional projects" icon={<FameBusinessArt id="trophy" />} onPress={() => router.push('/special-careers')} />
      <ActionRow title="Travel" subtitle="Holidays, emigration, work and study abroad" icon={<TravelArt id="passport" />} onPress={() => router.push('/travel')} />
      <ActionRow title="My Life" subtitle="Your identity and personal profile" icon={<Illustration id="journal" />} onPress={() => router.push({ pathname: '/profile', params: { tab: 'activities' } })} />
      <ActionRow title="Saved Lives" subtitle="Import, export or restore a checkpoint" icon={<Illustration id="property" />} onPress={() => router.push('/saved-lives')} />
      <ActionRow title="Settings" subtitle="Appearance and local saved lives" icon={<Ionicons name="settings-outline" size={30} color={c.muted} />} onPress={() => router.push('/settings')} />
      <ActionRow title="Time Machine" subtitle="Restore a historical moment as a new branch" icon={<HealthLegalArt id="rewind" />} onPress={() => router.push('/time-machine')} />
    </Card>
  </Page>;
}
