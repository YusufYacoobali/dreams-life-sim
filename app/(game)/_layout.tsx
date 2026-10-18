import React from 'react';
import { Redirect, router, Stack, useLocalSearchParams, usePathname } from 'expo-router';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGame } from '../../src/state/useGame';
import { BottomNavigation, TabKey } from '../../src/ui/GameShell';
import { useColors } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';

const icons = { life: 'home', assets: 'wallet', relationships: 'heart', activities: 'ellipsis-horizontal' } as const;
export const unstable_settings = { initialRouteName: '(tabs)' };

export default function GameLayout() {
  const world = useGame(s => s.world);
  const path = usePathname();
  const params = useLocalSearchParams<{ tab?: string }>();
  const c = useColors();
  if (!world) return <Redirect href="/" />;
  if (!world.birthAcknowledged) return <Redirect href="/birth" />;
  if (world.people[world.activePersonId].died) return <Redirect href="/death" />;
  const tab: TabKey = params.tab === 'life' || params.tab === 'assets' || params.tab === 'relationships' || params.tab === 'activities' ? params.tab
    : ['/assets', '/asset/', '/shopping/', '/offer/', '/investment', '/bank'].some(prefix => path.startsWith(prefix)) ? 'assets' : ['/relationships', '/person', '/household', '/meet-people'].some(prefix => path.startsWith(prefix)) ? 'relationships'
    : path.startsWith('/activities') || path.startsWith('/health') || path.startsWith('/education') || path.startsWith('/work') || path.startsWith('/jobs') ? 'activities' : path.startsWith('/bank') ? 'assets' : 'life';
  return <View style={{ flex: 1, backgroundColor: c.background }}><View style={{ flex: 1 }}><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /></Stack></View>
    <BottomNavigation activeTab={tab} onSelectTab={id => router.navigate('/' + id)} renderIcon={(id, color) => <Ionicons name={icons[id]} color={color} size={26} />} />
    <PendingEvent />
  </View>;
}
