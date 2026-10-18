import React from 'react';
import { Redirect, router, Tabs, useLocalSearchParams, usePathname } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGame } from '../../src/state/useGame';
import { BottomNavigation, TabKey } from '../../src/ui/GameShell';
import { useColors } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';

const icons = { life: 'home', assets: 'wallet', relationships: 'heart', activities: 'ellipsis-horizontal' } as const;

export default function GameLayout() {
  const world = useGame(s => s.world);
  const path = usePathname();
  const params = useLocalSearchParams<{ tab?: string }>();
  const c = useColors();
  if (!world) return <Redirect href="/" />;
  if (!world.birthAcknowledged) return <Redirect href="/birth" />;
  if (world.people[world.activePersonId].died) return <Redirect href="/death" />;
  const tab: TabKey = params.tab === 'life' || params.tab === 'assets' || params.tab === 'relationships' || params.tab === 'activities' ? params.tab
    : path.startsWith('/assets') ? 'assets' : path.startsWith('/relationships') || path.startsWith('/person') ? 'relationships'
    : path.startsWith('/activities') || path.startsWith('/health') || path.startsWith('/education') || path.startsWith('/work') || path.startsWith('/jobs') ? 'activities' : path.startsWith('/bank') ? 'assets' : 'life';
  return <><Tabs backBehavior="history" screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.background } }}
    tabBar={() => <BottomNavigation activeTab={tab} onSelectTab={id => router.navigate('/' + id)} renderIcon={(id, color) => <Ionicons name={icons[id]} color={color} size={26} />} />}
  >
    <Tabs.Screen name="life" options={{ title: 'Life' }} />
    <Tabs.Screen name="assets" options={{ title: 'Assets' }} />
    <Tabs.Screen name="relationships" options={{ title: 'Relationships' }} />
    <Tabs.Screen name="activities" options={{ title: 'Activities' }} />
    <Tabs.Screen name="profile" options={{ href: null }} />
    <Tabs.Screen name="health" options={{ href: null }} />
    <Tabs.Screen name="education" options={{ href: null }} />
    <Tabs.Screen name="work" options={{ href: null }} />
    <Tabs.Screen name="jobs" options={{ href: null }} />
    <Tabs.Screen name="bank" options={{ href: null }} />
    <Tabs.Screen name="person/[id]" options={{ href: null }} />
  </Tabs><PendingEvent /></>;
}
