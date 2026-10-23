import React, { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { Redirect, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCreationDraft } from '../src/state/creationDraft';
import { avatarPresets, CreationProgress } from '../src/ui/CreationElements';
import { Body, Button, Header, Page, Portrait } from '../src/ui/components';
import { hairColors, hairLabels, outfitLabels, skinTones } from '../src/assets/portraitLayout';
import { useColors } from '../src/ui/theme';
import { FilterTabs } from '../src/ui/FilterTabs';
import { avatarLabel, hairColorLabels, skinToneLabel } from '../src/ui/appearanceLabels';
import { useFeedbackPress } from '../src/ui/feedback';
import { DisplayText as Text, displayText } from '../src/ui/DisplayText';

const tabs = ['Avatars', 'Skin Tone', 'Hair Style', 'Hair Color', 'Clothing'] as const;
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
  // Keep the edited identity in its own slot, so customisation never replaces
  // another person or duplicates a facial identity in the sixteen-person cast.
  const presets = avatarPresets.map(preset => preset.identity === (appearance.identity ?? 0) ? appearance : preset), cell = Math.min(88, Math.floor((width - 68) / 4));
  return <Page bottomSafeArea footer={<Button label="Continue" onPress={() => router.back()} />}><Header title="Choose Appearance" onBack={() => router.back()} /><CreationProgress step={2} />
    <FilterTabs values={appearanceTabs} selected={tab} onSelect={next => { tap(() => setTab(next)); }} />
    {tab === 'Avatars' ? <><View accessibilityRole="radiogroup" accessibilityLabel="Avatar" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>{presets.map((preset, index) => { const checked = Object.keys(preset).every(key => preset[key as keyof typeof preset] === appearance[key as keyof typeof preset]); return <Pressable key={index} accessibilityRole="radio" accessibilityLabel={displayText(avatarLabel(preset, index))} accessibilityState={{ checked }} onPress={() => tap(() => edit(preset))} style={{ width: cell, height: cell + 5, borderRadius: 12, borderWidth: 2, borderColor: checked ? c.blue : 'transparent', backgroundColor: c.inset, alignItems: 'center', justifyContent: 'center' }}><Portrait decorative name={'Avatar ' + (index + 1)} appearance={preset} age={25} size={cell - 6} />{checked && <SelectionMark />}</Pressable>; })}</View></> : <>
      <View style={{ alignItems: 'center' }}><Portrait name="Your adult appearance" appearance={appearance} age={25} size={tab === 'Clothing' ? 184 : 140} /></View>
      <View accessibilityRole="radiogroup" accessibilityLabel={displayText(tab)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {tab === 'Hair Style' || tab === 'Clothing' ? (tab === 'Hair Style' ? hairLabels : outfitLabels).map((label, index) => {
          const change = tab === 'Hair Style' ? { hair: index } : { outfit: index };
          const selected = (tab === 'Hair Style' ? appearance.hair : appearance.outfit ?? appearance.identity ?? 0) === index;
          return <Pressable key={label} accessibilityRole="radio" accessibilityLabel={displayText(label)} accessibilityState={{ checked: selected }} onPress={() => tap(() => edit(change))} style={{ width: cell, minHeight: cell + 42, alignItems: 'center', paddingVertical: 6, borderRadius: 12, borderWidth: 2, borderColor: selected ? c.blue : 'transparent', backgroundColor: c.inset }}><Portrait decorative name={label} appearance={{ ...appearance, ...change }} age={25} size={cell - 8} /><Text style={{ color: c.ink, fontSize: 11, textAlign: 'center', marginTop: 5 }}>{label}</Text></Pressable>;
        }) : (tab === 'Skin Tone' ? skinTones : hairColors).map((tone, index) => { const selected = (tab === 'Skin Tone' ? appearance.skin : appearance.hairColor) === index, label = tab === 'Skin Tone' ? skinToneLabel(index) : hairColorLabels[index]; return <Pressable key={tone} accessibilityRole="radio" accessibilityLabel={displayText(label)} accessibilityState={{ checked: selected }} onPress={() => tap(() => edit(tab === 'Skin Tone' ? { skin: index } : { hairColor: index }))} style={{ width: 72, height: 72, padding: 6, borderRadius: 36, borderWidth: 3, borderColor: selected ? c.blue : c.line }}><View style={{ flex: 1, backgroundColor: tone, borderRadius: 30 }} />{selected && <SelectionMark />}</Pressable>; })}
      </View>
    </>}
    <Body muted centered>Your appearance stays with you as you grow. Identity and gender are separate choices.</Body>
  </Page>;
}

function SelectionMark() {
  const c = useColors();
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', top: 3, right: 3, backgroundColor: c.actionBlue, borderRadius: 12, padding: 3 }}><Ionicons name="checkmark" size={14} color="#FFFFFF" /></View>;
}
