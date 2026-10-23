import React, { useEffect, useState } from 'react';
import {
  type AccessibilityRole, type AccessibilityState,
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleProp, StyleSheet, Text, useWindowDimensions, View, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, spacing, ThemedStatusBar, useColors } from './theme';
import { CharacterPortrait } from '../assets/CharacterPortrait';
import { useDelayedBusy } from './useDelayedBusy';
import { useFeedbackPress } from './feedback';
import { useGame } from '../state/useGame';
import { hasLegacyAutomaticAppearance, legacyNPCDefaultGender } from '../game/appearance';

export function Page({ children, scroll = true, bottomSafeArea = false, footer, fillBody = false }: React.PropsWithChildren<{ scroll?: boolean; bottomSafeArea?: boolean; footer?: React.ReactNode; fillBody?: boolean }>) {
  const c = useColors();
  // Inspect only the direct first child; leave nested lists and their keys intact.
  const first = Array.isArray(children) ? children[0] : children;
  const header = React.isValidElement(first) && first.type === Header ? first : null;
  const body = header ? Array.isArray(children) ? children.slice(1) : null : children;
  return (
    <SafeAreaView edges={bottomSafeArea ? ['top', 'bottom'] : ['top']} style={[styles.page, { backgroundColor: c.background }]}>
      <ThemedStatusBar />
      {header && <View style={[styles.pageHeader, { backgroundColor: c.background }]}>{header}</View>}
      <KeyboardAvoidingView style={styles.pageBody} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {scroll ? <ScrollView style={styles.pageBody} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{body}</ScrollView>
          : <View style={[styles.content, fillBody || footer ? styles.pageBody : undefined]}>{body}</View>}
        {footer && <View style={[styles.footer, { backgroundColor: c.background, borderTopColor: c.line }]}>{footer}</View>}
      </KeyboardAvoidingView>
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
  label, onPress, tone = 'primary', disabled = false, busy, accessibilityLabel,
  accessibilityRole = 'button', accessibilityState,
}: {
  label: string; onPress: () => void; tone?: 'primary' | 'secondary' | 'positive' | 'danger';
  disabled?: boolean; busy?: boolean; accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole; accessibilityState?: AccessibilityState;
}) {
  const c = useColors();
  const background = tone === 'secondary' ? c.inset : tone === 'positive' ? c.actionGreen : tone === 'danger' ? c.actionRed : c.actionBlue;
  const pressedBackground = tone === 'secondary' ? c.selected : tone === 'positive' ? c.actionGreenPressed : tone === 'danger' ? c.actionRedPressed : c.actionBluePressed;
  const color = tone === 'secondary' ? c.ink : '#FFFFFF';
  // A supplied false tracks a later save; local controls omit busy entirely.
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => { if (!busy) setSubmitted(false); }, [busy, submitted]);
  const saving = !!busy && submitted;
  const showProgress = useDelayedBusy(saving);
  const press = useFeedbackPress(() => { if (busy !== undefined) setSubmitted(true); return onPress(); }, disabled || !!busy, true);
  return (
    <Pressable
      accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ ...accessibilityState, disabled: disabled || !!busy, busy: saving }}
      disabled={disabled || busy} onPress={press}
      style={({ pressed }) => [styles.button, { backgroundColor: pressed ? pressedBackground : background, opacity: disabled || busy ? 0.5 : 1 }]}
    >
      {showProgress && <ActivityIndicator color={color} accessibilityLabel="Saving" style={{ flexShrink: 0 }} />}
      <Text style={[styles.buttonLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function Header({ title, onBack, trailing, backDisabled = false }: { title: string; onBack?: () => void; trailing?: React.ReactNode; backDisabled?: boolean }) {
  const c = useColors();
  const { width, fontScale } = useWindowDimensions();
  const pressBack = useFeedbackPress(() => onBack?.(), backDisabled || !onBack);
  const stacked = width < 340 || fontScale >= 1.5;
  const back = onBack && <Pressable onPress={pressBack} disabled={backDisabled} accessibilityRole="button" accessibilityLabel="Back" accessibilityState={{ disabled: backDisabled }} hitSlop={8} style={[styles.back, { opacity: backDisabled ? 0.5 : 1 }]}>
    <Text allowFontScaling={false} accessibilityElementsHidden importantForAccessibility="no" style={{ fontSize: 34, color: c.ink }}>‹</Text>
  </Pressable>;
  if (stacked) return <View style={styles.headerStacked}>
    {(onBack || trailing) && <View style={styles.headerControls}><View style={styles.headerSide}>{back}</View><View style={styles.headerSide}>{trailing}</View></View>}
    <Heading size={21} centered>{title}</Heading>
  </View>;
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>{back}</View>
      <View style={styles.headerTitle}><Heading size={21}>{title}</Heading></View>
      <View style={styles.headerSide}>{trailing}</View>
    </View>
  );
}

export function ActionRow({
  title, subtitle, icon, value, onPress, disabledReason, disabled = false, accessibilityRole = 'button', accessibilityState,
}: { title: string; subtitle?: string; icon?: React.ReactNode; value?: string; onPress: () => void; disabledReason?: string; disabled?: boolean; accessibilityRole?: AccessibilityRole; accessibilityState?: AccessibilityState }) {
  const c = useColors();
  const { width, fontScale } = useWindowDimensions();
  const press = useFeedbackPress(onPress, disabled || !!disabledReason);
  const stackValue = !!value && (fontScale >= 1.2 || width < 360);
  return (
    <Pressable
      accessibilityRole={accessibilityRole} accessibilityLabel={[title, subtitle, value, disabledReason].filter(Boolean).join('. ')}
      accessibilityState={{ ...accessibilityState, disabled: disabled || !!disabledReason }} disabled={disabled || !!disabledReason} onPress={press}
      style={({ pressed }) => [styles.row, { borderBottomColor: c.line, backgroundColor: pressed || accessibilityState?.checked ? c.selected : 'transparent', opacity: disabled || disabledReason ? 0.55 : 1 }]}
    >
      {icon && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.rowIcon}>{icon}</View>}
      <View style={[styles.rowContent, stackValue && styles.rowContentStacked]}>
        <View style={[styles.rowText, stackValue && styles.rowTextStacked]}>
          <Text style={{ color: c.ink, fontWeight: '600', fontSize: 16 }}>{title}</Text>
          {(subtitle || disabledReason) && <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18, marginTop: 3 }}>{disabledReason ?? subtitle}</Text>}
        </View>
        {value && <Text style={[styles.rowValue, { color: c.muted }, stackValue && styles.rowValueStacked]}>{value}</Text>}
      </View>
      <Text allowFontScaling={false} accessibilityElementsHidden importantForAccessibility="no" style={{ color: accessibilityState?.checked ? c.link : c.muted, fontSize: 25 }}>{accessibilityRole === 'radio' ? accessibilityState?.checked ? '●' : '○' : '›'}</Text>
    </Pressable>
  );
}

/** One track style for personal stats, pets and compact relationship rows. */
export const statTrackHeight = 14;
export function StatTrack({ value, color, label, decorative = false }: { value: number; color: string; label?: string; decorative?: boolean }) {
  const c = useColors();
  const bounded = Number.isFinite(value) ? Math.round(Math.max(0,Math.min(100,value))) : 0;
  return <View accessible={!decorative} accessibilityRole={decorative ? undefined : 'progressbar'} accessibilityLabel={label}
    accessibilityValue={decorative ? undefined : {min:0,max:100,now:bounded}}
    accessibilityElementsHidden={decorative} importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
    style={{width:'100%',height:statTrackHeight,borderRadius:statTrackHeight/2,overflow:'hidden',backgroundColor:c.track}}>
    <View style={{height:'100%',width:`${bounded}%`,borderRadius:statTrackHeight/2,backgroundColor:color}} />
  </View>;
}

export function StatBar({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) {
  const c = useColors();
  const { width, fontScale } = useWindowDimensions();
  const [availableWidth, setAvailableWidth] = useState(0);
  const labelWidth = 84 * Math.max(1, fontScale), valueWidth = 38 * Math.max(1, fontScale);
  const stacked = (availableWidth || width - spacing.lg * 4) < labelWidth + valueWidth + 56 + (icon ? 48 : 16);
  const bounded = Number.isFinite(value) ? Math.round(Math.max(0, Math.min(100, value))) : 0;
  const picture = icon && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.statIcon}>{icon}</View>;
  const percentage = <Text numberOfLines={1} style={{ minWidth: valueWidth, flexShrink: 0, textAlign: 'right', color: c.muted, fontSize: 13 }}>{bounded}%</Text>;
  const track = <View style={[styles.track, stacked && styles.trackStacked]}><StatTrack value={bounded} color={color} decorative /></View>;
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: bounded }}
      onLayout={({ nativeEvent }) => { const next = Math.round(nativeEvent.layout.width); setAvailableWidth(current => current === next ? current : next); }}
      style={[styles.stat, stacked && styles.statStacked]}>
      {stacked ? <View style={styles.statSummary}>
        <View style={[styles.statLabelGroup, { flexBasis: labelWidth + (icon ? 32 : 0) }]}>{picture}<Text style={{ flexShrink: 1, color: c.ink, fontSize: 13 }}>{label}</Text></View>
        {percentage}
      </View> : <>{picture}<Text style={{ width: labelWidth, color: c.ink, fontSize: 13 }}>{label}</Text></>}
      {track}
      {!stacked && percentage}
    </View>
  );
}

export function Portrait(props: React.ComponentProps<typeof CharacterPortrait>) {
  // Manual previews and explicit saved artwork need no game-store subscription.
  if (!props.personId || !hasLegacyAutomaticAppearance(props.appearance,props.personId)) return <CharacterPortrait {...props} />;
  return <LegacyNPCPortrait {...props} />;
}
function LegacyNPCPortrait(props: React.ComponentProps<typeof CharacterPortrait>) {
  // Select a stable scalar. Unchanged save copies do not re-render a portrait
  // merely because the World/Person objects acquired new references.
  const legacyDefaultGender = useGame(state => legacyNPCDefaultGender(state.world,props.personId,props.appearance));
  return <CharacterPortrait {...props} legacyDefaultGender={props.legacyDefaultGender ?? legacyDefaultGender} />;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  pageHeader: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  pageBody: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  footer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  card: { borderRadius: radii.card, padding: spacing.lg, gap: spacing.md },
  button: { minHeight: 50, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  buttonLabel: { fontSize: 17, fontWeight: '600', textAlign: 'center', flexShrink: 1, minWidth: 0 },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSide: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 8 },
  headerStacked: { gap: 4, paddingBottom: 8 },
  headerControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { minWidth: 44, minHeight: 48, justifyContent: 'center' },
  row: { minHeight: 66, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowIcon: { width: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowContentStacked: { flexDirection: 'column', alignItems: 'stretch', gap: 6 },
  rowText: { flex: 1, minWidth: 0 },
  rowTextStacked: { flex: 0 },
  rowValue: { fontSize: 14, flexShrink: 1, maxWidth: '45%', textAlign: 'right' },
  rowValueStacked: { maxWidth: '100%', textAlign: 'left' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 28 },
  statStacked: { flexDirection: 'column', alignItems: 'stretch', gap: 6, paddingVertical: 4 },
  statIcon: { width: 24, alignItems: 'center', flexShrink: 0 },
  statSummary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  statLabelGroup: { flexDirection: 'row', alignItems: 'center', flexGrow: 1, flexShrink: 0, maxWidth: '100%', gap: 8 },
  track: { flex: 1, height: statTrackHeight },
  trackStacked: { flex: 0, width: '100%' },
});
