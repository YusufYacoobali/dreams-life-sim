import React, { useMemo } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { inheritedPossessions, lifeProgress } from '../../src/progression/progress';
import { ActionRow, Body, Card, Header, Heading, Page } from '../../src/ui/components';
import { FameBusinessArt } from '../../src/assets/FameBusinessArt';
import { FamilyArt } from '../../src/assets/FamilyArt';
import { Illustration } from '../../src/assets/Illustration';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
import { fullName } from '../../src/game/model';
import { useColors } from '../../src/ui/theme';

export default function Extras() {
  const world = useGame(s => s.world), progress = useMemo(() => world ? lifeProgress(world) : null, [world]);
  const c = useColors();
  if (!world || !progress) return <Redirect href="/" />;
  return <Page><Header title="Extras" onBack={() => router.back()} />
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><FameBusinessArt id="trophy" size={52} /><View style={{ flex: 1, minWidth: 0 }}><Heading size={21}>{fullName(world.people[world.activePersonId])}</Heading><Body muted>Milestones, keepsakes and more from this life.</Body></View></View></Card>
    <Card><Heading size={19}>Milestones & Keepsakes</Heading>
    <ActionRow title="Achievements" subtitle={progress.achievements.filter(item => item.complete).length + ' / ' + progress.achievements.length + ' earned in this life'} icon={<FameBusinessArt id="trophy" size={40} />} onPress={() => router.push('/achievements')} />
    <ActionRow title="Challenges" subtitle={progress.challenges.filter(item => item.complete).length + ' / ' + progress.challenges.length + ' completed'} icon={<Illustration id="journal" />} onPress={() => router.push('/challenges')} />
    <ActionRow title="Heirlooms" subtitle={inheritedPossessions(world).length + ' inherited possessions in your care'} icon={<FamilyArt id="gift" size={40} />} onPress={() => router.push('/heirlooms')} />
    </Card><Card><Heading size={19}>Explore Your Life</Heading>
    <ActionRow title="Life Summary" subtitle="Your journal and recorded milestones" icon={<Illustration id="journal" />} onPress={() => router.push('/life-summary')} />
    <ActionRow title="Statistics" subtitle="Recorded counts and personal receipts" icon={<FameBusinessArt id="growth" size={40} />} onPress={() => router.push({ pathname: '/statistics', params: { tab: 'activities' } })} />
    <ActionRow title="Social Media" subtitle="Your profiles and posts" icon={<FameBusinessArt id="social" size={40} />} onPress={() => router.push('/social-media')} />
    <ActionRow title="Businesses" subtitle="Your companies and their progress" icon={<FameBusinessArt id="business" size={40} />} onPress={() => router.push('/business')} />
    <ActionRow title="Fame" subtitle="Your public reputation" icon={<FameBusinessArt id="fame" size={40} />} onPress={() => router.push('/fame')} />
    <ActionRow title="Black Market" subtitle="Offers, risk and consequences" icon={<HealthLegalArt id="handcuffs" />} onPress={() => router.push('/black-market')} />
    <ActionRow title="Time Machine" subtitle="Preview an earlier moment and branch your life" icon={<HealthLegalArt id="rewind" />} onPress={() => router.push('/time-machine')} />
    </Card><Card><Heading size={19}>Preferences & Help</Heading>
    <Card><ActionRow title="Dreams Store" subtitle="Permanent careers, God Mode and Time Machine" onPress={() => router.push('/store')} /><ActionRow title="God Mode" subtitle="Edit your character and choose a royal birth" onPress={() => router.push('/god-mode')} /></Card>
    <ActionRow title="Settings" subtitle="Display, motion, sound and haptics" icon={<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Ionicons name="settings-outline" size={30} color={c.muted} /></View>} onPress={() => router.push('/settings')} />
    <ActionRow title="Help" subtitle="Playing, progress and local saves" icon={<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Ionicons name="help-circle-outline" size={32} color={c.link} /></View>} onPress={() => router.push('/help')} />
  </Card><Body muted>Progress belongs to this person and timeline.</Body></Page>;
}
