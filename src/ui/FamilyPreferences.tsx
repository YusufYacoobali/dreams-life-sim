import React from 'react';
import { Switch, View } from 'react-native';
import { genders } from '../game/systems/familySchemas';
import { Body, Button } from './components';
import { displayText } from './DisplayText';

export const genderLabel = (gender: typeof genders[number]) => gender === 'nonbinary' ? 'Non-binary' : gender === 'male' ? 'Men' : 'Women';
export function FamilyPreferences({ attractedTo, wantsChildren, disabled = false, onChange }: { attractedTo: (typeof genders[number])[]; wantsChildren: boolean; disabled?: boolean; onChange: (preferences: { attractedTo: (typeof genders[number])[]; wantsChildren: boolean }) => void }) {
  return <><Body>Open to dating</Body><Body muted>Choose at least one option.</Body>{genders.map(gender => {
    const selected = attractedTo.includes(gender);
    return <Button key={gender} label={(selected ? '✓ ' : '') + genderLabel(gender)} accessibilityLabel={displayText(genderLabel(gender))} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} tone={selected ? 'primary' : 'secondary'} disabled={disabled || (selected && attractedTo.length === 1)} onPress={() => {
      const next = selected ? attractedTo.filter(item => item !== gender) : [...attractedTo, gender];
      if (!disabled && next.length) onChange({ attractedTo: next, wantsChildren });
    }} />;
  })}<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 48 }}><View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ flex: 1, minWidth: 0 }}><Body>Would like children</Body></View><Switch accessibilityLabel="Would like children" accessibilityState={{ disabled, checked: wantsChildren }} disabled={disabled} value={wantsChildren} onValueChange={value => { if (!disabled) onChange({ attractedTo, wantsChildren: value }); }} style={{ flexShrink: 0 }} /></View></>;
}
