import React, { useMemo } from 'react';
import { Redirect, router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { inheritedPossessions, lifeProgress } from '../../src/progression/progress';
import { ActionRow, Body, Card, Header, Page } from '../../src/ui/components';
import { FameBusinessArt } from '../../src/assets/FameBusinessArt';
import { FamilyArt } from '../../src/assets/FamilyArt';
import { Illustration } from '../../src/assets/Illustration';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';

export default function Extras() {
  const world = useGame(s => s.world), progress = useMemo(() => world ? lifeProgress(world) : null, [world]);
  if (!world || !progress) return <Redirect href="/" />;
  return <Page><Header title="Extras" onBack={() => router.back()} /><Card>
    <ActionRow title="Achievements" subtitle={progress.achievements.filter(item => item.complete).length + ' / ' + progress.achievements.length + ' earned in this life'} icon={<FameBusinessArt id="trophy" size={40} />} onPress={() => router.push('/achievements')} />
    <ActionRow title="Challenges" subtitle={progress.challenges.filter(item => item.complete).length + ' / ' + progress.challenges.length + ' completed'} icon={<Illustration id="journal" />} onPress={() => router.push('/challenges')} />
    <ActionRow title="Heirlooms" subtitle={inheritedPossessions(world).length + ' inherited possessions in your care'} icon={<FamilyArt id="gift" size={40} />} onPress={() => router.push('/heirlooms')} />
    <ActionRow title="Life Summary" subtitle="Your journal and recorded milestones" icon={<Illustration id="journal" />} onPress={() => router.push('/life-summary')} />
    <ActionRow title="Social Media" subtitle="Your profiles and posts" icon={<FameBusinessArt id="social" size={40} />} onPress={() => router.push('/social-media')} />
    <ActionRow title="Businesses" subtitle="Your companies and their progress" icon={<FameBusinessArt id="business" size={40} />} onPress={() => router.push('/business')} />
    <ActionRow title="Fame" subtitle="Your public reputation" icon={<FameBusinessArt id="fame" size={40} />} onPress={() => router.push('/fame')} />
    <ActionRow title="Black Market" subtitle="Offers, risk and consequences" icon={<HealthLegalArt id="handcuffs" />} onPress={() => router.push('/black-market')} />
    <ActionRow title="Time Machine" subtitle="Preview an earlier moment and branch your life" icon={<HealthLegalArt id="rewind" />} onPress={() => router.push('/time-machine')} />
    <ActionRow title="Settings" subtitle="Appearance and saved lives" onPress={() => router.push('/settings')} />
    <ActionRow title="Help" subtitle="Playing, progress and local saves" onPress={() => router.push('/help')} />
  </Card><Body muted>Progress belongs to this person and timeline.</Body></Page>;
}
