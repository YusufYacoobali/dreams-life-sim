import React from 'react';
import { Switch, View } from 'react-native';
import { genders } from '../game/systems/familySchemas';
import { Body, Button } from './components';
export const genderLabel = (gender: typeof genders[number]) => gender === 'nonbinary' ? 'Non-binary' : gender === 'male' ? 'Men' : 'Women';
export function FamilyPreferences({ attractedTo, wantsChildren, disabled = false, onChange }: { attractedTo: (typeof genders[number])[]; wantsChildren: boolean; disabled?: boolean; onChange: (preferences: { attractedTo: (typeof genders[number])[]; wantsChildren: boolean }) => void }) {
  return <><Body>Open to dating</Body>{genders.map(gender => <Button key={gender} label={(attractedTo.includes(gender) ? '✓ ' : '') + genderLabel(gender)} tone={attractedTo.includes(gender) ? 'primary' : 'secondary'} disabled={disabled} onPress={() => { const next = attractedTo.includes(gender) ? attractedTo.filter(item => item !== gender) : [...attractedTo, gender]; if (!disabled && next.length) onChange({ attractedTo: next, wantsChildren }); }} />)}<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Body>Would like children</Body><Switch accessibilityLabel="Would like children" accessibilityState={{ disabled }} disabled={disabled} value={wantsChildren} onValueChange={value => { if (!disabled) onChange({ attractedTo, wantsChildren: value }); }} /></View></>;
}
