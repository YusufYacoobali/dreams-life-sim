import React, { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Redirect, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCreationDraft } from '../src/state/creationDraft';
import { avatarPresets, CreationProgress, SectionLabel } from '../src/ui/CreationElements';
import { Body, Button, Header, Page, Portrait } from '../src/ui/components';
import { faceLabels, hairColors, hairLabels, skinTones } from '../src/assets/portraitLayout';
import { useColors } from '../src/ui/theme';
import { FilterTabs } from '../src/ui/FilterTabs';
import { avatarLabel, hairColorLabels, skinToneLabel } from '../src/ui/appearanceLabels';
import { useFeedbackPress } from '../src/ui/feedback';

const tabs = ['Avatars', 'Skin Tone', 'Hair Style', 'Hair Color'] as const;
const appearanceTabs = tabs.map(id => ({ id, label: id }));
export default function Appearance() {
  const draft = useCreationDraft(s => s.draft), update = useCreationDraft(s => s.update), [tab, setTab] = useState<typeof tabs[number]>('Avatars'), c = useColors(), width = useWindowDimensions().width;
  const tap = useFeedbackPress((action: () => unknown) => action());
  if (!draft) return <Redirect href="/new-life" />;
  const { input } = draft, appearance = input.appearance, edit = (change: Partial<typeof appearance>) => {
    const current = useCreationDraft.getState().draft;
    if (!current || current.seed !== draft.seed || Object.entries(change).every(([key, value]) => current.input.appearance[key as keyof typeof appearance] === value)) return false;
    update({ ...current.input, appearance: { ...current.input.appearance, ...change } }); return true;
  };
  const currentPreset = avatarPresets.findIndex(item => Object.keys(item).every(key => item[key as keyof typeof item] === appearance[key as keyof typeof item]));
  const presets = currentPreset < 0 ? [appearance, ...avatarPresets.slice(1)] : avatarPresets, cell = Math.min(88, Math.floor((width - 68) / 4));
  return <Page bottomSafeArea footer={<Button label="Continue" onPress={() => router.back()} />}><Header title="Choose Appearance" onBack={() => router.back()} /><CreationProgress step={2} />
    <FilterTabs values={appearanceTabs} selected={tab} onSelect={next => { tap(() => setTab(next)); }} />
    {tab === 'Avatars' ? <><View accessibilityRole="radiogroup" accessibilityLabel="Avatar" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>{presets.map((preset, index) => { const checked = Object.keys(preset).every(key => preset[key as keyof typeof preset] === appearance[key as keyof typeof preset]); return <Pressable key={index} accessibilityRole="radio" accessibilityLabel={avatarLabel(preset, index)} accessibilityState={{ checked }} onPress={() => tap(() => edit(preset))} style={{ width: cell, height: cell + 5, borderRadius: 12, borderWidth: 2, borderColor: checked ? c.blue : 'transparent', backgroundColor: c.inset, alignItems: 'center', justifyContent: 'center' }}><Portrait decorative name={'Avatar ' + (index + 1)} appearance={preset} age={25} size={cell - 6} />{checked && <SelectionMark />}</Pressable>; })}</View><SectionLabel>FACE SHAPE</SectionLabel><View accessibilityRole="radiogroup" accessibilityLabel="Face shape" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{faceLabels.map((label, face) => <Pressable key={label} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: appearance.face === face }} onPress={() => tap(() => edit({ face }))} style={{ flexGrow: 1, flexBasis: 'auto', minWidth: 64, maxWidth: '100%', minHeight: 48, paddingHorizontal: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: appearance.face === face ? c.selected : c.inset, borderRadius: 10, borderWidth: 1, borderColor: appearance.face === face ? c.blue : 'transparent' }}><Text style={{ color: c.ink, fontSize: 12, textAlign: 'center', flexShrink: 1 }}>{label}</Text></Pressable>)}</View></> : <>
      <View style={{ alignItems: 'center' }}><Portrait name="Your adult appearance" appearance={appearance} age={25} size={140} /></View>
      <View accessibilityRole="radiogroup" accessibilityLabel={tab} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {tab === 'Hair Style' ? hairLabels.map((label, hair) => <Pressable key={label} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: appearance.hair === hair }} onPress={() => tap(() => edit({ hair }))} style={{ width: cell, minHeight: cell + 42, alignItems: 'center', paddingVertical: 6, borderRadius: 12, borderWidth: 2, borderColor: appearance.hair === hair ? c.blue : 'transparent', backgroundColor: c.inset }}><Portrait decorative name={label} appearance={{ ...appearance, hair }} age={25} size={cell - 8} /><Text style={{ color: c.ink, fontSize: 11, textAlign: 'center', marginTop: 5 }}>{label}</Text></Pressable>) : (tab === 'Skin Tone' ? skinTones : hairColors).map((tone, index) => { const selected = (tab === 'Skin Tone' ? appearance.skin : appearance.hairColor) === index, label = tab === 'Skin Tone' ? skinToneLabel(index) : hairColorLabels[index]; return <Pressable key={tone} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: selected }} onPress={() => tap(() => edit(tab === 'Skin Tone' ? { skin: index } : { hairColor: index }))} style={{ width: 72, height: 72, padding: 6, borderRadius: 36, borderWidth: 3, borderColor: selected ? c.blue : c.line }}><View style={{ flex: 1, backgroundColor: tone, borderRadius: 30 }} />{selected && <SelectionMark />}</Pressable>; })}
      </View>
    </>}
    <Body muted centered>Your appearance stays with you as you grow. Identity and gender are separate choices.</Body>
  </Page>;
}

function SelectionMark() {
  const c = useColors();
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', top: 3, right: 3, backgroundColor: c.actionBlue, borderRadius: 12, padding: 3 }}><Ionicons name="checkmark" size={14} color="#FFFFFF" /></View>;
}
