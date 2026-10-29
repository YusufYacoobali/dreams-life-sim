import React from 'react';
import { Tabs } from 'expo-router';
import { useColors } from '../../../src/ui/theme';
export default function RootTabs() {
  const c = useColors();
  return <Tabs initialRouteName="life" backBehavior="history" tabBar={() => null} screenOptions={{ headerShown: false, lazy: true, freezeOnBlur: true, sceneStyle: { backgroundColor: c.background } }}>
    <Tabs.Screen name="life" options={{ title: 'Life' }} />
    <Tabs.Screen name="assets" options={{ title: 'Assets' }} />
    <Tabs.Screen name="relationships" options={{ title: 'Relationships' }} />
    <Tabs.Screen name="activities" options={{ title: 'Activities' }} />
  </Tabs>;
}
