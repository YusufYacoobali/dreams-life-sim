import React from 'react';
import {
  ActivityIndicator, Pressable, ScrollView,
  StyleProp, StyleSheet, Text, View, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, spacing, ThemedStatusBar, useColors } from './theme';
import { CharacterPortrait } from '../assets/CharacterPortrait';

export function Page({ children, scroll = true, bottomSafeArea = false }: React.PropsWithChildren<{ scroll?: boolean; bottomSafeArea?: boolean }>) {
  const c = useColors();
  return (
    <SafeAreaView edges={bottomSafeArea ? ['top', 'bottom'] : ['top']} style={[styles.page, { backgroundColor: c.background }]}>
      <ThemedStatusBar />
      {scroll ? <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        : <View style={styles.content}>{children}</View>}
    </SafeAreaView>
  );
}

export function Heading({ children, size = 22, centered = false }: React.PropsWithChildren<{ size?: number; centered?: boolean }>) {
  const c = useColors();
  return <Text accessibilityRole="header" style={{ color: c.ink, fontSize: size, fontWeight: '700', lineHeight: size * 1.3, textAlign: centered ? 'center' : 'left' }}>{children}</Text>;
}

export function Body({ children, muted = false, centered = false }: React.PropsWithChildren<{ muted?: boolean; centered?: boolean }>) {
  const c = useColors();
  return <Text style={{ color: muted ? c.muted : c.ink, fontSize: 15, lineHeight: 22, textAlign: centered ? 'center' : 'left' }}>{children}</Text>;
}

export function Card({ children, style }: React.PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const c = useColors();
  return <View style={[styles.card, { backgroundColor: c.surface }, style]}>{children}</View>;
}

export function Button({
  label, onPress, tone = 'primary', disabled = false, busy = false, accessibilityLabel,
}: {
  label: string; onPress: () => void; tone?: 'primary' | 'secondary' | 'positive' | 'danger';
  disabled?: boolean; busy?: boolean; accessibilityLabel?: string;
}) {
  const c = useColors();
  const background = tone === 'secondary' ? c.inset : tone === 'positive' ? c.green : tone === 'danger' ? c.red : c.blue;
  const color = tone === 'secondary' ? c.ink : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy} onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: background, opacity: disabled || busy ? 0.5 : pressed ? 0.8 : 1 }]}
    >
      {busy && <ActivityIndicator color={color} accessibilityLabel="Saving" />}
      <Text style={[styles.buttonLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function Header({ title, onBack, trailing }: { title: string; onBack?: () => void; trailing?: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>{onBack && (
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} style={styles.back}>
          <Text style={{ fontSize: 34, color: c.ink }}>‹</Text>
        </Pressable>
      )}</View>
      <View style={styles.headerTitle}><Heading size={21}>{title}</Heading></View>
      <View style={styles.headerSide}>{trailing}</View>
    </View>
  );
}

export function ActionRow({
  title, subtitle, icon, value, onPress, disabledReason,
}: { title: string; subtitle?: string; icon?: React.ReactNode; value?: string; onPress: () => void; disabledReason?: string }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={[title, subtitle, value, disabledReason].filter(Boolean).join('. ')}
      accessibilityState={{ disabled: !!disabledReason }} disabled={!!disabledReason} onPress={onPress}
      style={({ pressed }) => [styles.row, { borderBottomColor: c.line, backgroundColor: pressed ? c.selected : 'transparent', opacity: disabledReason ? 0.55 : 1 }]}
    >
      {icon && <View style={styles.rowIcon}>{icon}</View>}
      <View style={styles.rowText}>
        <Text style={{ color: c.ink, fontWeight: '600', fontSize: 16 }}>{title}</Text>
        {(subtitle || disabledReason) && <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18, marginTop: 3 }}>{disabledReason ?? subtitle}</Text>}
      </View>
      {value && <Text style={{ color: c.muted, fontSize: 14, flexShrink: 1 }}>{value}</Text>}
      <Text accessibilityElementsHidden importantForAccessibility="no" style={{ color: c.muted, fontSize: 25 }}>›</Text>
    </Pressable>
  );
}

export function StatBar({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) {
  const c = useColors();
  const bounded = Number.isFinite(value) ? Math.round(Math.max(0, Math.min(100, value))) : 0;
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: bounded }} style={styles.stat}>
      {icon && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 24, alignItems: 'center' }}>{icon}</View>}
      <Text style={{ width: 84, color: c.ink, fontSize: 13 }}>{label}</Text>
      <View style={[styles.track, { backgroundColor: c.track }]}>
        <View style={{ height: '100%', width: `${bounded}%`, borderRadius: 6, backgroundColor: color }} />
      </View>
      <Text style={{ width: 38, textAlign: 'right', color: c.muted, fontSize: 13 }}>{bounded}%</Text>
    </View>
  );
}

export const Portrait = CharacterPortrait;

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  card: { borderRadius: radii.card, padding: spacing.lg, gap: spacing.md },
  button: { minHeight: 50, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  buttonLabel: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSide: { minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, alignItems: 'center' },
  back: { minWidth: 44, minHeight: 48, justifyContent: 'center' },
  row: { minHeight: 66, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowIcon: { width: 40, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 28 },
  track: { flex: 1, height: 10, borderRadius: 6, overflow: 'hidden' },
});
