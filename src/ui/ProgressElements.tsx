import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProgressArt } from '../progression/progress';
import { SchoolArt } from '../assets/SchoolArt';
import { HobbyArt } from '../assets/HobbyArt';
import { PetsLeisureArt } from '../assets/PetsLeisureArt';
import { FamilyArt } from '../assets/FamilyArt';
import { FameBusinessArt } from '../assets/FameBusinessArt';
import { Illustration } from '../assets/Illustration';
import { Body, Heading, StatBar } from './components';
import { useColors } from './theme';

export const progressAmount = (value: number, unit: string) => value + ' ' + (value === 1 ? unit.replace(/ies$/, 'y').replace(/s$/, '') : unit);

export function ProgressPicture({ art, size = 44 }: { art: ProgressArt; size?: number }) {
  if (art === 'school' || art === 'study') return <SchoolArt id={art === 'school' ? 'report' : 'study'} size={size} />;
  if (art === 'hobby') return <HobbyArt kind="reading" size={size} />;
  if (art === 'pet') return <PetsLeisureArt id="paw" size={size} />;
  if (art === 'rings') return <FamilyArt id="rings" size={size} />;
  if (art === 'trophy') return <FameBusinessArt id="trophy" size={size} />;
  return <Illustration id={art === 'work' ? 'career' : art === 'money' ? 'money' : 'travel'} size={size} />;
}

export function ProgressFilters<T extends string>({ values, selected, onSelect }: { values: readonly { id: T; label: string }[]; selected: T; onSelect: (id: T) => void }) {
  const c = useColors();
  return <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap' }}>{values.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: selected === item.id }} onPress={() => onSelect(item.id)} style={{ flex: 1, minWidth: 54, minHeight: 48, paddingHorizontal: 4, justifyContent: 'center', backgroundColor: selected === item.id ? c.blue : c.inset, borderRadius: 10 }}><Text style={{ color: selected === item.id ? '#FFFFFF' : c.ink, textAlign: 'center', fontSize: 12, fontWeight: '600' }}>{item.label}</Text></Pressable>)}</View>;
}

export function ProgressSummary({ complete, total, label }: { complete: number; total: number; label: string }) {
  const c = useColors();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><ProgressPicture art="trophy" size={52} /><View style={{ flex: 1 }}><Heading size={21}>{complete} / {total}</Heading><StatBar label={label} value={total ? complete / total * 100 : 0} color={c.green} /></View></View>;
}

export function ProgressRow({ title, description, art, complete, progress, onPress }: { title: string; description: string; art: ProgressArt; complete: boolean; progress?: number; onPress: () => void }) {
  const c = useColors();
  return <Pressable accessibilityRole="button" accessibilityLabel={title + '. ' + description + '. ' + (complete ? 'Completed' : progress === undefined ? 'In progress' : Math.round(progress) + '% complete')} onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, minHeight: 76, borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: pressed ? c.selected : 'transparent' })}>
    <ProgressPicture art={art} size={40} /><View style={{ flex: 1 }}><Heading size={16}>{title}</Heading><Body muted>{description}</Body>{progress !== undefined && <StatBar label="Progress" value={progress} color={c.green} />}</View>
    <Ionicons name={complete ? 'checkmark-circle' : 'chevron-forward'} size={24} color={complete ? c.green : c.muted} accessibilityElementsHidden importantForAccessibility="no" />
  </Pressable>;
}
