import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleProp, StyleSheet, Text, useWindowDimensions, View, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, spacing, ThemedStatusBar, useColors } from './theme';
import { CharacterPortrait } from '../assets/CharacterPortrait';
import { useDelayedBusy } from './useDelayedBusy';
import { useFeedback } from './feedback';

export function Page({ children, scroll = true, bottomSafeArea = false, footer }: React.PropsWithChildren<{ scroll?: boolean; bottomSafeArea?: boolean; footer?: React.ReactNode }>) {
  const c = useColors();
  const content = <>
    {scroll ? <ScrollView style={footer ? { flex: 1 } : undefined} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      : <View style={[styles.content, footer ? { flex: 1 } : undefined]}>{children}</View>}
    {footer && <View style={[styles.footer, { backgroundColor: c.background, borderTopColor: c.line }]}>{footer}</View>}
  </>;
  return (
    <SafeAreaView edges={bottomSafeArea ? ['top', 'bottom'] : ['top']} style={[styles.page, { backgroundColor: c.background }]}>
      <ThemedStatusBar />
      {footer ? <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>{content}</KeyboardAvoidingView> : content}
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
  const { buttonFeedback } = useFeedback();
  const background = tone === 'secondary' ? c.inset : tone === 'positive' ? c.actionGreen : tone === 'danger' ? c.actionRed : c.actionBlue;
  const pressedBackground = tone === 'secondary' ? c.selected : tone === 'positive' ? c.actionGreenPressed : tone === 'danger' ? c.actionRedPressed : c.actionBluePressed;
  const color = tone === 'secondary' ? c.ink : '#FFFFFF';
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => { if (!busy) setSubmitted(false); }, [busy, submitted]);
  const saving = busy && submitted;
  const showProgress = useDelayedBusy(saving);
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || busy, busy: saving }}
      disabled={disabled || busy} onPress={() => { setSubmitted(true); onPress(); buttonFeedback(); }}
      style={({ pressed }) => [styles.button, { backgroundColor: pressed ? pressedBackground : background, opacity: disabled || busy ? 0.5 : 1 }]}
    >
      {showProgress && <ActivityIndicator color={color} accessibilityLabel="Saving" />}
      <Text style={[styles.buttonLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function Header({ title, onBack, trailing, backDisabled = false }: { title: string; onBack?: () => void; trailing?: React.ReactNode; backDisabled?: boolean }) {
  const c = useColors();
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>{onBack && (
        <Pressable onPress={onBack} disabled={backDisabled} accessibilityRole="button" accessibilityLabel="Back" accessibilityState={{ disabled: backDisabled }} hitSlop={8} style={[styles.back, { opacity: backDisabled ? 0.5 : 1 }]}>
          <Text style={{ fontSize: 34, color: c.ink }}>‹</Text>
        </Pressable>
      )}</View>
      <View style={styles.headerTitle}><Heading size={21}>{title}</Heading></View>
      <View style={styles.headerSide}>{trailing}</View>
    </View>
  );
}

export function ActionRow({
  title, subtitle, icon, value, onPress, disabledReason, disabled = false,
}: { title: string; subtitle?: string; icon?: React.ReactNode; value?: string; onPress: () => void; disabledReason?: string; disabled?: boolean }) {
  const c = useColors();
  const { width, fontScale } = useWindowDimensions();
  const stackValue = !!value && (fontScale >= 1.2 || width < 360);
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={[title, subtitle, value, disabledReason].filter(Boolean).join('. ')}
      accessibilityState={{ disabled: disabled || !!disabledReason }} disabled={disabled || !!disabledReason} onPress={onPress}
      style={({ pressed }) => [styles.row, { borderBottomColor: c.line, backgroundColor: pressed ? c.selected : 'transparent', opacity: disabled || disabledReason ? 0.55 : 1 }]}
    >
      {icon && <View style={styles.rowIcon}>{icon}</View>}
      <View style={[styles.rowContent, stackValue && styles.rowContentStacked]}>
        <View style={[styles.rowText, stackValue && styles.rowTextStacked]}>
          <Text style={{ color: c.ink, fontWeight: '600', fontSize: 16 }}>{title}</Text>
          {(subtitle || disabledReason) && <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18, marginTop: 3 }}>{disabledReason ?? subtitle}</Text>}
        </View>
        {value && <Text style={[styles.rowValue, { color: c.muted }, stackValue && styles.rowValueStacked]}>{value}</Text>}
      </View>
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
      <Text numberOfLines={1} style={{ minWidth: 38, flexShrink: 0, textAlign: 'right', color: c.muted, fontSize: 13 }}>{bounded}%</Text>
    </View>
  );
}

export const Portrait = CharacterPortrait;

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  footer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  card: { borderRadius: radii.card, padding: spacing.lg, gap: spacing.md },
  button: { minHeight: 50, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  buttonLabel: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSide: { minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, alignItems: 'center' },
  back: { minWidth: 44, minHeight: 48, justifyContent: 'center' },
  row: { minHeight: 66, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowIcon: { width: 40, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowContentStacked: { flexDirection: 'column', alignItems: 'stretch', gap: 6 },
  rowText: { flex: 1, minWidth: 0 },
  rowTextStacked: { flex: 0 },
  rowValue: { fontSize: 14, flexShrink: 1, maxWidth: '45%', textAlign: 'right' },
  rowValueStacked: { maxWidth: '100%', textAlign: 'left' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 28 },
  track: { flex: 1, height: 10, borderRadius: 6, overflow: 'hidden' },
});
