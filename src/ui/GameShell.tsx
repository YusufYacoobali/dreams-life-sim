import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from './theme';

export const tabs = [
  { id: 'life', label: 'Life' },
  { id: 'assets', label: 'Assets' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'activities', label: 'Activities' },
] as const;
export type TabKey = typeof tabs[number]['id'];

export function GameShell({
  activeTab, onSelectTab, renderIcon, children,
}: React.PropsWithChildren<{
  activeTab: TabKey; onSelectTab: (tab: TabKey) => void;
  renderIcon?: (tab: TabKey, color: string) => React.ReactNode;
}>) {
  const c = useColors();
  return (
    <View style={[styles.shell, { backgroundColor: c.background }]}>
      <View style={styles.screen}>{children}</View>
      <BottomNavigation activeTab={activeTab} onSelectTab={onSelectTab} renderIcon={renderIcon} />
    </View>
  );
}

export function BottomNavigation({
  activeTab, onSelectTab, onReselectTab, renderIcon,
}: {
  activeTab: TabKey; onSelectTab: (tab: TabKey) => void;
  onReselectTab?: (tab: TabKey) => void;
  renderIcon?: (tab: TabKey, color: string) => React.ReactNode;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  // Reserve enough scaled width for the full Relationships label. Keep text
  // scaling enabled and let the navigation occupy another row when necessary.
  const columns = width / fontScale >= 360 ? 4 : width / fontScale >= 180 ? 2 : 1;
  return <View accessibilityRole="tablist" style={[styles.tabs, { paddingBottom: insets.bottom, backgroundColor: c.surface, borderTopColor: c.line }]}>
        {tabs.map(tab => {
          const color = activeTab === tab.id ? c.link : c.muted;
          return <Pressable
            key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.label}
            accessibilityState={{ selected: activeTab === tab.id }}
            onPress={() => { if (activeTab !== tab.id) onSelectTab(tab.id); else onReselectTab?.(tab.id); }}
            style={[styles.tab, { width: columns === 4 ? '25%' : columns === 2 ? '50%' : '100%' }, columns === 1 && styles.tabWide]}
          >
            {renderIcon && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{renderIcon(tab.id, color)}</View>}
            <Text style={{ fontSize: 11, color, textAlign: 'center', flexShrink: 1, fontWeight: activeTab === tab.id ? '600' : '400' }}>{tab.label}</Text>
          </Pressable>;
        })}
      </View>;
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  screen: { flex: 1 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 4 },
  tab: { minHeight: 56, paddingVertical: 6, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabWide: { flexDirection: 'row', gap: 12 },
});
