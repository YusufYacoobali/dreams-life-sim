import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Heading } from './components';
import { useColors } from './theme';
import { useDelayedBusy } from './useDelayedBusy';

export type EffectRow = { id: string; label: string; value: string; tone: 'positive' | 'negative' | 'neutral' };
type Choice = { id: string; label: string; disabledReason?: string };
export type EventPresentation = {
  id: string; title: string; body: string; illustration?: React.ReactNode;
} & (
  | { kind: 'decision'; choices: readonly Choice[] }
  | { kind: 'selection'; choices: readonly Choice[]; confirmLabel: string }
  | { kind: 'confirmation'; terms: readonly EffectRow[]; confirmLabel: string }
  | { kind: 'result'; effects: readonly EffectRow[]; continueLabel?: string }
  | { kind: 'milestone'; facts: readonly EffectRow[]; continueLabel?: string }
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
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);
  const showProgress = useDelayedBusy(busy);
  const selectedEligible = event.kind === 'selection' && event.choices.some(choice => choice.id === selected && !choice.disabledReason);
  const effects = event.kind === 'result' ? event.effects
    : event.kind === 'confirmation' ? event.terms : event.kind === 'milestone' ? event.facts : [];
  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => { if (!busy) (onCancel ?? onClose)?.(); }}>
      <View style={[styles.backdrop, { backgroundColor: c.overlay, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        <View accessibilityViewIsModal style={[styles.card, { backgroundColor: c.surface }]}>
          {event.illustration && <View style={[styles.illustration, { backgroundColor: c.selected, borderColor: c.surface }]}>{event.illustration}</View>}
          <ScrollView contentContainerStyle={styles.contents} keyboardShouldPersistTaps="handled" bounces={false}>
            <View style={styles.title}><Heading size={24} centered>{event.title}</Heading></View>
            <Body centered>{event.body}</Body>
            {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, textAlign: 'center', fontSize: 14 }}>{error}</Text>}
            {effects.length > 0 && <View style={[styles.effects, { backgroundColor: c.inset }]}>
              {effects.map(effect => <View key={effect.id} style={styles.effectRow}>
                <Text style={{ color: c.ink, fontSize: 14, flex: 1 }}>{effect.label}</Text>
                <Text style={{ color: effect.tone === 'positive' ? c.green : effect.tone === 'negative' ? c.red : c.ink, fontWeight: '600', fontSize: 14, textAlign: 'right', flex: 1 }}>{effect.value}</Text>
              </View>)}
            </View>}
            {event.kind === 'decision' && showProgress && <ActivityIndicator color={c.blue} accessibilityLabel="Saving your decision" />}
            {event.kind === 'decision' && event.choices.map(choice => <Button
              key={choice.id} label={choice.label} disabled={busy || !!choice.disabledReason}
              accessibilityLabel={[choice.label, choice.disabledReason].filter(Boolean).join('. ')}
              onPress={() => onChoose(choice.id)}
            />)}
            {event.kind === 'selection' && <>
              {event.choices.map(choice => <Pressable
                key={choice.id} accessibilityRole="radio" accessibilityState={{ checked: selected === choice.id, disabled: busy || !!choice.disabledReason }}
                accessibilityLabel={[choice.label, choice.disabledReason].filter(Boolean).join('. ')}
                disabled={busy || !!choice.disabledReason} onPress={() => setSelected(choice.id)}
                style={[styles.option, { borderColor: selected === choice.id ? c.blue : c.line, backgroundColor: selected === choice.id ? c.selected : c.surface }]}
              ><Body>{choice.label}</Body>{choice.disabledReason && <Body muted>{choice.disabledReason}</Body>}</Pressable>)}
              <Button label={event.confirmLabel} disabled={!selectedEligible} busy={busy} onPress={() => { if (selected && selectedEligible) onChoose(selected); }} />
            </>}
            {event.kind === 'confirmation' && <Button label={event.confirmLabel} busy={busy} onPress={() => onChoose('confirm')} />}
            {(event.kind === 'result' || event.kind === 'milestone') && <Button label={event.continueLabel ?? 'Continue'} busy={busy} onPress={() => onChoose('continue')} />}
            {onCancel && <Button label="Never mind" tone="secondary" disabled={busy} onPress={onCancel} />}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 440, maxHeight: '100%', borderRadius: 24, paddingTop: 30 },
  illustration: { width: 88, height: 88, borderRadius: 44, borderWidth: 4, position: 'absolute', alignSelf: 'center', top: -44, alignItems: 'center', justifyContent: 'center' },
  contents: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 24, gap: 12 },
  title: { alignItems: 'center', marginTop: 6 },
  effects: { borderRadius: 12, padding: 12, gap: 14 },
  effectRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  option: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 52, justifyContent: 'center' },
});
