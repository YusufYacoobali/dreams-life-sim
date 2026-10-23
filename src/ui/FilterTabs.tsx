import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useColors } from './theme';
import { DisplayText as Text, displayText } from './DisplayText';

export function FilterTabs<T extends string>({ values, selected, onSelect }: { values: readonly { id: T; label: string }[]; selected: T; onSelect: (id: T) => void }) {
  const c = useColors();
  return <View accessibilityRole="tablist" style={styles.tabs}>{values.map(item => {
    const active = selected === item.id;
    return <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={displayText(item.label)} accessibilityState={{ selected: active }}
      onPress={() => { if (!active) onSelect(item.id); }}
      style={({ pressed }) => [styles.tab, { backgroundColor: active ? pressed ? c.actionBluePressed : c.actionBlue : pressed ? c.selected : c.inset }]}>
      <Text style={[styles.label, { color: active ? '#FFFFFF' : c.ink }]}>{item.label}</Text>
    </Pressable>;
  })}</View>;
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  tab: { flexGrow: 1, flexBasis: 'auto', minWidth: 54, maxWidth: '100%', minHeight: 48, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center', borderRadius: 10 },
  label: { textAlign: 'center', fontSize: 12, fontWeight: '600', flexShrink: 1 },
});
