import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  return <View accessibilityRole="tablist" style={[styles.tabs, { paddingBottom: insets.bottom, backgroundColor: c.surface, borderTopColor: c.line }]}>
        {tabs.map(tab => {
          const color = activeTab === tab.id ? c.link : c.muted;
          return <Pressable
            key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.label}
            accessibilityState={{ selected: activeTab === tab.id }}
            onPress={() => { if (activeTab !== tab.id) onSelectTab(tab.id); else onReselectTab?.(tab.id); }}
            style={styles.tab}
          >
            {renderIcon && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{renderIcon(tab.id, color)}</View>}
            <Text style={{ fontSize: 11, color, fontWeight: activeTab === tab.id ? '600' : '400' }}>{tab.label}</Text>
          </Pressable>;
        })}
      </View>;
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  screen: { flex: 1 },
  tabs: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 4 },
  tab: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 3 },
});
