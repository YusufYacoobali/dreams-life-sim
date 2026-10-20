import React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProgressArt } from '../progression/progress';
import { SchoolArt } from '../assets/SchoolArt';
import { HobbyArt } from '../assets/HobbyArt';
import { PetsLeisureArt } from '../assets/PetsLeisureArt';
import { FamilyArt } from '../assets/FamilyArt';
import { FameBusinessArt } from '../assets/FameBusinessArt';
import { Illustration } from '../assets/Illustration';
import { Body, Heading, StatBar } from './components';
import { radii, ThemedStatusBar, useColors } from './theme';

const singularUnits: Record<string, string> = { children: 'child', 'businesses founded': 'business founded' };
export const progressAmount = (value: number, unit: string) => value + ' ' + (value === 1 ? singularUnits[unit] ?? unit.replace(/ies$/, 'y').replace(/s$/, '') : unit);

type ProgressListItem = { id: string; title: string; description: string; art: ProgressArt; complete: boolean; percent?: number };
export function ProgressList<T extends ProgressListItem>({ items, header, onSelect, showProgress = false, label, children }: React.PropsWithChildren<{
  items: readonly T[]; header: React.ReactNode; onSelect: (item: T) => void; showProgress?: boolean; label: string;
}>) {
  const c = useColors();
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}><ThemedStatusBar />
    <FlatList accessibilityLabel={label} data={items} keyExtractor={item => item.id} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={7}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      ListHeaderComponent={<View style={{ gap: 16, paddingBottom: 16 }}>{header}</View>}
      ListEmptyComponent={<Body muted>No goals match this filter.</Body>}
      renderItem={({ item, index }) => <View style={{ backgroundColor: c.surface, paddingHorizontal: 16, paddingTop: index === 0 ? 8 : 0, paddingBottom: index === items.length - 1 ? 8 : 0,
        borderTopLeftRadius: index === 0 ? radii.card : 0, borderTopRightRadius: index === 0 ? radii.card : 0,
        borderBottomLeftRadius: index === items.length - 1 ? radii.card : 0, borderBottomRightRadius: index === items.length - 1 ? radii.card : 0 }}>
        <ProgressRow title={item.title} description={item.description} art={item.art} complete={item.complete} progress={showProgress ? item.percent : undefined} onPress={() => onSelect(item)} />
      </View>} />
    {children}
  </SafeAreaView>;
}

export function ProgressPicture({ art, size = 44 }: { art: ProgressArt; size?: number }) {
  if (art === 'school' || art === 'study') return <SchoolArt id={art === 'school' ? 'report' : 'study'} size={size} />;
  if (art === 'hobby') return <HobbyArt kind="reading" size={size} />;
  if (art === 'pet') return <PetsLeisureArt id="paw" size={size} />;
  if (art === 'rings') return <FamilyArt id="rings" size={size} />;
  if (art === 'trophy') return <FameBusinessArt id="trophy" size={size} />;
  return <Illustration id={art === 'work' ? 'career' : art === 'money' ? 'money' : 'travel'} size={size} />;
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
