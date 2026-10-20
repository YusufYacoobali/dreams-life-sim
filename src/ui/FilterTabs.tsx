import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useColors } from './theme';

export function FilterTabs<T extends string>({ values, selected, onSelect }: { values: readonly { id: T; label: string }[]; selected: T; onSelect: (id: T) => void }) {
  const c = useColors();
  return <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap' }}>{values.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: selected === item.id }} onPress={() => onSelect(item.id)} style={{ flex: 1, minWidth: 54, minHeight: 48, paddingHorizontal: 4, justifyContent: 'center', backgroundColor: selected === item.id ? c.actionBlue : c.inset, borderRadius: 10 }}><Text style={{ color: selected === item.id ? '#FFFFFF' : c.ink, textAlign: 'center', fontSize: 12, fontWeight: '600' }}>{item.label}</Text></Pressable>)}</View>;
}
