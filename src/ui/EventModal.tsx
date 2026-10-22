import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Heading } from './components';
import { useColors } from './theme';
import { useDelayedBusy } from './useDelayedBusy';
import { useFeedback } from './feedback';

export type EffectRow = { id: string; label: string; value: string; tone: 'positive' | 'negative' | 'neutral' };
type Choice = { id: string; label: string; disabledReason?: string };
export type EventPresentation = {
  id: string; title: string; body: string; illustration?: React.ReactNode;
} & (
  | { kind: 'decision'; choices: readonly Choice[] }
  | { kind: 'selection'; choices: readonly Choice[]; confirmLabel: string }
  | { kind: 'confirmation'; terms: readonly EffectRow[]; confirmLabel: string }
  | { kind: 'result'; effects: readonly EffectRow[]; continueLabel?: string }
  | { kind: 'milestone'; facts: readonly EffectRow[]; continueLabel?: string; action?: { id: string; label: string } }
);

export function EventModal({
  event, busy = false, error, onChoose, onCancel, onClose,
}: { event: EventPresentation | null; busy?: boolean; error?: string | null; onChoose: (id: string) => void; onCancel?: () => void; onClose?: () => void }) {
  return event ? <EventCard key={event.id} event={event} busy={busy} error={error} onChoose={onChoose} onCancel={onCancel} onClose={onClose} /> : null;
}

function EventCard({
  event, busy, error, onChoose, onCancel, onClose,
}: { event: EventPresentation; busy: boolean; error?: string | null; onChoose: (id: string) => void; onCancel?: () => void; onClose?: () => void }) {
  const c = useColors();
  const { reducedMotion, hapticFeedback } = useFeedback();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const stackedEffects = width < 360 || fontScale >= 1.3;
  const [selected, setSelected] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const mounted = useRef(true), closed = useRef(false), current = useRef({ event, busy });
  if (current.current.event !== event) closed.current = false;
  current.current = { event, busy };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  // A retained native input belongs to this presentation. New render objects
  // do not reset selection, and choosing never latches an unknown async save.
  const canAct = () => mounted.current && !closed.current && current.current.event === event && !current.current.busy;
  const choose = (id: string) => {
    if (!canAct()) return;
    if ((event.kind === 'decision' || event.kind === 'selection') && !event.choices.some(choice => choice.id === id && !choice.disabledReason)) return;
    onChoose(id);
  };
  const dismiss = (handler?: () => void) => {
    if (!handler || !canAct()) return;
    closed.current = true; handler();
  };
  const showProgress = useDelayedBusy(busy);
  const selectedEligible = event.kind === 'selection' && event.choices.some(choice => choice.id === selected && !choice.disabledReason);
  const effects = event.kind === 'result' ? event.effects
    : event.kind === 'confirmation' ? event.terms : event.kind === 'milestone' ? event.facts : [];
  return (
    // RN's legacy Android modal wrapper otherwise fits system insets a second
    // time, leaving strips of the underlying page outside this backdrop.
    // Keep the navigation bar opaque; card spacing still uses safe-area insets.
    <Modal transparent presentationStyle="overFullScreen" statusBarTranslucent navigationBarTranslucent={false} animationType={reducedMotion ? 'none' : 'fade'} visible onRequestClose={() => dismiss(onCancel ?? onClose)}>
      <View style={[styles.backdrop, { backgroundColor: c.overlay, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        <View accessibilityViewIsModal style={[styles.card, event.kind === 'selection' && styles.selectionCard, { backgroundColor: c.surface }]}>
          {event.illustration && <View style={[styles.illustration, { backgroundColor: c.selected, borderColor: c.surface }]}>{event.illustration}</View>}
          <ScrollView style={event.kind === 'selection' && styles.selectionScroll} contentContainerStyle={[styles.contents, event.kind === 'selection' && styles.selectionContents]} keyboardShouldPersistTaps="handled" bounces={false}>
            <View style={styles.title}><Heading size={24} centered>{event.title}</Heading></View>
            <Body centered>{event.body}</Body>
            {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, textAlign: 'center', fontSize: 14 }}>{error}</Text>}
            {effects.length > 0 && <View style={[styles.effects, { backgroundColor: c.inset }]}>
              {effects.map(effect => <View key={effect.id} style={[styles.effectRow, stackedEffects && styles.effectRowStacked]}>
                <Text style={{ color: c.ink, fontSize: 14, flex: stackedEffects ? 0 : 1, minWidth: 0 }}>{effect.label}</Text>
                <Text style={{ color: effect.tone === 'positive' ? c.positiveText : effect.tone === 'negative' ? c.red : c.ink, fontWeight: '600', fontSize: 14, textAlign: stackedEffects ? 'left' : 'right', flex: stackedEffects ? 0 : 1, minWidth: 0 }}>{effect.value}</Text>
              </View>)}
            </View>}
            {event.kind === 'decision' && showProgress && <ActivityIndicator color={c.blue} accessibilityLabel="Saving your decision" />}
            {event.kind === 'decision' && event.choices.map(choice => <Button
              key={choice.id} label={choice.label} disabled={busy || !!choice.disabledReason}
              accessibilityLabel={[choice.label, choice.disabledReason].filter(Boolean).join('. ')}
              onPress={() => choose(choice.id)}
            />)}
            {event.kind === 'selection' && <>
              {event.choices.map(choice => <Pressable
                key={choice.id} accessibilityRole="radio" accessibilityState={{ checked: selected === choice.id, disabled: busy || !!choice.disabledReason }}
                accessibilityLabel={[choice.label, choice.disabledReason].filter(Boolean).join('. ')}
                disabled={busy || !!choice.disabledReason} onPress={() => { if (canAct() && !choice.disabledReason && selectedRef.current !== choice.id) { selectedRef.current = choice.id; setSelected(choice.id); hapticFeedback(); } }}
                style={[styles.option, { borderColor: selected === choice.id ? c.blue : c.line, backgroundColor: selected === choice.id ? c.selected : c.surface }]}
              ><Body>{choice.label}</Body>{choice.disabledReason && <Body muted>{choice.disabledReason}</Body>}</Pressable>)}
            </>}
            {event.kind === 'confirmation' && <Button label={event.confirmLabel} busy={busy} onPress={() => choose('confirm')} />}
            {event.kind === 'milestone' && event.action && <Button label={event.action.label} disabled={busy} onPress={() => choose(event.action!.id)} />}
            {(event.kind === 'result' || event.kind === 'milestone') && <Button label={event.continueLabel ?? 'Continue'} tone={event.kind === 'milestone' && event.action ? 'secondary' : 'primary'} busy={busy} onPress={() => choose('continue')} />}
            {onCancel && event.kind !== 'selection' && <Button label="Never mind" tone="secondary" disabled={busy} onPress={() => dismiss(onCancel)} />}
          </ScrollView>
          {event.kind === 'selection' && <View style={styles.selectionFooter}>
            <Button label={event.confirmLabel} disabled={!selectedEligible} busy={busy} onPress={() => { if (selected && selectedEligible) choose(selected); }} />
            {onCancel && <Button label="Never mind" tone="secondary" disabled={busy} onPress={() => dismiss(onCancel)} />}
          </View>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 440, maxHeight: '100%', borderRadius: 24, paddingTop: 30 },
  selectionCard: { flexShrink: 1 },
  selectionScroll: { flexShrink: 1 },
  selectionContents: { paddingBottom: 12 },
  selectionFooter: { flexShrink: 0, paddingHorizontal: 22, paddingBottom: 24, gap: 12 },
  illustration: { width: 88, height: 88, borderRadius: 44, borderWidth: 4, position: 'absolute', alignSelf: 'center', top: -44, alignItems: 'center', justifyContent: 'center' },
  contents: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 24, gap: 12 },
  title: { alignItems: 'center', marginTop: 6, minWidth: 0 },
  effects: { borderRadius: 12, padding: 12, gap: 14 },
  effectRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  effectRowStacked: { flexDirection: 'column', alignItems: 'stretch', gap: 4 },
  option: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 52, justifyContent: 'center' },
});
