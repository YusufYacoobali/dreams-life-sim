import React from 'react';
import { Pressable, View } from 'react-native';
import { useFeedbackPress } from './feedback';
import { useColors } from './theme';
import { DisplayText as Text, displayText } from './DisplayText';

export type PropertyMethod = 'cash' | 'mortgage' | 'rent';
const methods = [{ id: 'cash', label: 'Buy Outright' }, { id: 'mortgage', label: 'Mortgage' }, { id: 'rent', label: 'Rent' }] as const;
export function PropertyMethodSelector({ value, disabled, onChange }: { value: PropertyMethod; disabled: boolean; onChange: (method: PropertyMethod) => void }) {
  const c = useColors();
  return <View accessibilityRole="radiogroup" accessibilityLabel="Property payment method" style={{ flexDirection: 'row', gap: 4, borderRadius: 12, padding: 4, backgroundColor: c.inset, alignItems: 'stretch' }}>
    {methods.map(method => <MethodOption key={method.id} label={method.label} selected={value === method.id} disabled={disabled} onPress={() => onChange(method.id)} />)}
  </View>;
}
function MethodOption({ label, selected, disabled, onPress }: { label: string; selected: boolean; disabled: boolean; onPress: () => void }) {
  const c = useColors(), press = useFeedbackPress(() => { if (!selected) onPress(); });
  return <Pressable accessibilityRole="radio" accessibilityLabel={displayText(label)} accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={press} style={({ pressed }) => ({ flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 4, paddingVertical: 10, borderRadius: 9, justifyContent: 'center', backgroundColor: selected ? c.actionBlue : pressed ? c.selected : 'transparent', opacity: disabled ? 0.6 : 1 })}>
    <Text style={{ fontSize: 13, lineHeight: 18, fontWeight: '600', color: selected ? '#FFFFFF' : c.ink, textAlign: 'center' }}>{label}</Text>
  </Pressable>;
}
