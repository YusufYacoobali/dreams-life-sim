import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { NavigationRouteContext } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button } from './components';
import { useColors } from './theme';
import { useDelayedBusy } from './useDelayedBusy';
import { useFeedback } from './feedback';
import { useModalPresence } from './modalPresence';
import type { StoryParticipant } from '../game/runtime';
import {
  eventBadgeColor,
  presentationArtwork,
  type EventCategory,
} from './eventArtwork';
import { DisplayText as Text, displayText } from './DisplayText';
import { modalReturnTarget, restoreModalFocus } from './modalFocus';

export type EffectRow = {
  id: string;
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral';
};
type Choice = { id: string; label: string; disabledReason?: string; illustration?: React.ReactNode };
export type SelectionSearch = {
  label: string;
  placeholder?: string;
  selectedId?: string;
};
export type EventPresentation = {
  id: string;
  title: string;
  body: string;
  illustration?: React.ReactNode;
  category?: EventCategory;
  participants?: readonly StoryParticipant[];
} & (
  | { kind: 'decision'; choices: readonly Choice[] }
  | { kind: 'selection'; choices: readonly Choice[]; confirmLabel: string }
  | { kind: 'confirmation'; terms: readonly EffectRow[]; confirmLabel: string }
  | { kind: 'result'; effects: readonly EffectRow[]; continueLabel?: string }
  | {
      kind: 'milestone';
      facts: readonly EffectRow[];
      continueLabel?: string;
      action?: { id: string; label: string };
    }
);

type EventModalProps = {
  event: EventPresentation | null;
  busy?: boolean;
  error?: string | null;
  onChoose: (id: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
  modalOwner?: 'app' | 'review';
  selectionSearch?: SelectionSearch;
  scope?: 'route' | 'stack';
};
type HostedEvent = {
  key: string;
  token: object;
  identity: string;
  ownerRoute: string;
  scope: 'route' | 'stack';
  props: EventModalProps;
  order: number;
  retired: boolean;
  cancelled?: boolean;
};
type EventHost = {
  routeKey: string;
  stackKey: string;
  identity: string;
  publish: (entry: Omit<HostedEvent, 'order' | 'retired'>) => void;
  remove: (key: string, token: object) => void;
};
const EventHostContext = createContext<EventHost | null>(null);

/** One surface outlives routed screens; only its card changes after a save. */
export function EventModalProvider({
  children,
  routeKey,
  activeRouteKeys = [routeKey],
  identity = 'app',
  blocked = false,
}: React.PropsWithChildren<{
  routeKey: string;
  activeRouteKeys?: readonly string[];
  identity?: string;
  blocked?: boolean;
}>) {
  const [entries, setEntries] = useState<ReadonlyMap<string, HostedEvent>>(
      () => new Map(),
    ),
    sequence = useRef(0);
  const keys = activeRouteKeys.join('\u0000'),
    context = useRef({ routeKey, identity, keys, blocked });
  context.current = { routeKey, identity, keys, blocked };
  const publish = useCallback(
    (entry: Omit<HostedEvent, 'order' | 'retired'>) =>
      setEntries((previous) => {
        const old = previous.get(entry.key);
        const next = new Map(previous);
        next.set(entry.key, {
          ...entry,
          order: old?.token === entry.token ? old.order : ++sequence.current,
          retired: old?.token === entry.token ? old.retired : false,
          cancelled: old?.token === entry.token ? old.cancelled : false,
        });
        return next;
      }),
    [],
  );
  const remove = useCallback(
    (key: string, token: object) =>
      setEntries((previous) => {
        if (previous.get(key)?.token !== token) return previous;
        const next = new Map(previous);
        next.delete(key);
        return next;
      }),
    [],
  );
  const host = useMemo(
    () => ({
      routeKey,
      stackKey: activeRouteKeys[0] ?? routeKey,
      identity,
      publish,
      remove,
    }),
    [routeKey, keys, identity, publish, remove],
  );
  const eligible = (entry: HostedEvent) =>
    !entry.retired &&
    entry.identity === identity &&
    (entry.scope === 'stack'
      ? activeRouteKeys.includes(entry.ownerRoute)
      : entry.ownerRoute === routeKey);
  const priority = (entry: HostedEvent) =>
    entry.props.modalOwner === 'review' ? 0 : entry.scope === 'stack' ? 2 : 1;
  const selected = blocked
    ? undefined
    : [...entries.values()]
        .filter(eligible)
        .sort((a, b) => priority(b) - priority(a) || b.order - a.order)[0];
  const live = useRef(selected);
  live.current = selected;
  const focus = useRef<null | {
      target: number | null;
      routeKey: string;
      identity: string;
    }>(null),
    wasOpen = useRef(false);
  if (selected && !wasOpen.current)
    focus.current = { target: modalReturnTarget(), routeKey, identity };
  useLayoutEffect(() => {
    setEntries((previous) => {
      let changed = false;
      const next = new Map(previous);
      for (const [key, entry] of next)
        if (
          !entry.retired &&
          (entry.identity !== identity ||
            (entry.scope === 'route' &&
              (entry.ownerRoute !== routeKey ||
                (selected?.scope === 'stack' &&
                  selected.props.modalOwner !== 'review'))))
        ) {
          next.set(key, { ...entry, retired: true });
          changed = true;
        }
      return changed ? next : previous;
    });
  }, [routeKey, identity, selected?.key, selected?.token]);
  useEffect(() => {
    for (const entry of entries.values())
      if (entry.retired && !entry.cancelled && !entry.props.busy) {
        entry.cancelled = true;
        (entry.props.onCancel ?? entry.props.onClose)?.();
      }
  }, [entries]);
  useEffect(() => {
    const open = !!selected;
    if (wasOpen.current && !open) {
      const previous = focus.current;
      focus.current = null;
      if (
        previous?.routeKey === routeKey &&
        previous.identity === identity &&
        !blocked
      ) {
        const frame = requestAnimationFrame(() => {
          if (!live.current) restoreModalFocus(previous.target);
        });
        wasOpen.current = false;
        return () => cancelAnimationFrame(frame);
      }
    }
    wasOpen.current = open;
  }, [!!selected, routeKey, identity, blocked]);
  const current = (entry: HostedEvent) =>
    live.current?.token === entry.token &&
    live.current.key === entry.key &&
    !live.current.props.busy &&
    context.current.identity === entry.identity &&
    !context.current.blocked;
  const dismiss = () => {
    const entry = selected;
    if (entry && !entry.props.busy && current(entry))
      (entry.props.onCancel ?? entry.props.onClose)?.();
  };
  const card = selected?.props.event ? (
    <EventCard
      key={selected.key + ':' + selected.order + ':' + selected.props.event.id}
      {...selected.props}
      event={selected.props.event}
      busy={!!selected.props.busy}
      modalOwner={selected.props.modalOwner ?? 'app'}
      hosted
      onChoose={(id) => {
        if (!current(selected)) return;
        const outcome = selected.props.onChoose(id) as unknown;
        if (
          outcome &&
          typeof (outcome as PromiseLike<unknown>).then === 'function'
        ) {
          const settled = () =>
            setEntries((previous) => {
              const entry = previous.get(selected.key);
              if (
                !entry ||
                entry.token !== selected.token ||
                !entry.retired ||
                !entry.cancelled
              )
                return previous;
              // A guarded review may refuse retirement while its own submit
              // promise is still unwinding, even after store.busy became false.
              // Retry that same owner/activation after its finally completes.
              // Inline presentations can rebuild their event object on each
              // busy/error render; the token, rather than that object, owns it.
              const next = new Map(previous);
              next.set(selected.key, { ...entry, cancelled: false });
              return next;
            });
          void Promise.resolve(outcome).then(settled, settled);
        }
      }}
      onCancel={
        selected.props.onCancel
          ? () => {
              if (current(selected)) selected.props.onCancel?.();
            }
          : undefined
      }
      onClose={
        selected.props.onClose
          ? () => {
              if (current(selected)) selected.props.onClose?.();
            }
          : undefined
      }
    />
  ) : null;
  return (
    <EventHostContext.Provider value={host}>
      {children}
      {Platform.OS === 'ios' ? (
        card && (
          <FullWindowOverlay unstable_accessibilityContainerViewIsModal>
            <View
              style={StyleSheet.absoluteFill}
              accessibilityViewIsModal
              onAccessibilityEscape={dismiss}
            >
              {card}
            </View>
          </FullWindowOverlay>
        )
      ) : (
        <Modal
          testID="event-modal-host"
          transparent
          presentationStyle="overFullScreen"
          statusBarTranslucent
          navigationBarTranslucent={false}
          animationType="none"
          visible={!!card}
          onRequestClose={dismiss}
        >
          {card}
        </Modal>
      )}
    </EventHostContext.Provider>
  );
}

function HostedEventRegistration({
  host,
  ...props
}: EventModalProps & { host: EventHost }) {
  const key = useId(),
    route = useContext(NavigationRouteContext),
    activation = useRef<{
      id: string;
      token: object;
      identity: string;
      ownerRoute: string;
    } | null>(null);
  if (!props.event) activation.current = null;
  else if (!activation.current || activation.current.id !== props.event.id)
    activation.current = {
      id: props.event.id,
      token: {},
      identity: host.identity,
      ownerRoute:
        route?.key ?? (props.scope === 'stack' ? host.stackKey : host.routeKey),
    };
  const captured = activation.current;
  useLayoutEffect(() => {
    if (!captured) return;
    host.publish({
      key,
      token: captured.token,
      identity: captured.identity,
      ownerRoute: captured.ownerRoute,
      scope: props.scope ?? 'route',
      props,
    });
  }, [
    host,
    key,
    captured,
    props.event,
    props.busy,
    props.error,
    props.onChoose,
    props.onCancel,
    props.onClose,
    props.modalOwner,
    props.selectionSearch,
    props.scope,
  ]);
  useLayoutEffect(
    () => () => {
      if (captured) host.remove(key, captured.token);
    },
    [host.remove, key, captured],
  );
  return null;
}

export function EventModal(props: EventModalProps) {
  const host = useContext(EventHostContext);
  if (host) return <HostedEventRegistration {...props} host={host} />;
  return props.event ? (
    <EventCard
      key={props.event.id}
      {...props}
      event={props.event}
      busy={!!props.busy}
      modalOwner={props.modalOwner ?? 'app'}
    />
  ) : null;
}

function EventCard({
  event,
  busy,
  error,
  onChoose,
  onCancel,
  onClose,
  modalOwner,
  selectionSearch,
  hosted = false,
}: {
  event: EventPresentation;
  busy: boolean;
  error?: string | null;
  onChoose: (id: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
  modalOwner?: 'app' | 'review';
  selectionSearch?: SelectionSearch;
  hosted?: boolean;
}) {
  useModalPresence(modalOwner);
  const c = useColors();
  const artwork = presentationArtwork(event.illustration, event.category);
  const { reducedMotion, hapticFeedback } = useFeedback();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const stackedEffects = width < 360 || fontScale >= 1.3;
  const initialSelection =
    event.kind === 'selection' &&
    selectionSearch?.selectedId &&
    event.choices.some(
      (choice) =>
        choice.id === selectionSearch.selectedId && !choice.disabledReason,
    )
      ? selectionSearch.selectedId
      : null;
  const [selected, setSelected] = useState<string | null>(initialSelection),
    [query, setQuery] = useState('');
  const selectedRef = useRef<string | null>(initialSelection);
  const mounted = useRef(true),
    closed = useRef(false),
    current = useRef({ event, busy });
  const title = useRef<Text>(null);
  const focusTitle = () => {
    if (hosted && title.current && mounted.current) {
      try {
        AccessibilityInfo.sendAccessibilityEvent(title.current, 'focus');
      } catch {
        /* Native focus is optional. */
      }
    }
  };
  if (current.current.event !== event) closed.current = false;
  current.current = { event, busy };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  // A retained native input belongs to this presentation. New render objects
  // do not reset selection, and choosing never latches an unknown async save.
  const canAct = () =>
    mounted.current &&
    !closed.current &&
    current.current.event === event &&
    !current.current.busy;
  const choose = (id: string) => {
    if (!canAct()) return;
    if (
      (event.kind === 'decision' || event.kind === 'selection') &&
      !event.choices.some(
        (choice) => choice.id === id && !choice.disabledReason,
      )
    )
      return;
    onChoose(id);
  };
  const dismiss = (handler?: () => void) => {
    if (!handler || !canAct()) return;
    closed.current = true;
    handler();
  };
  const showProgress = useDelayedBusy(busy);
  const selectedEligible =
    event.kind === 'selection' &&
    event.choices.some(
      (choice) => choice.id === selected && !choice.disabledReason,
    );
  const matches =
    event.kind === 'selection'
      ? event.choices.filter(
          (choice) =>
            !selectionSearch ||
            query
              .trim()
              .toLocaleLowerCase()
              .split(/\s+/)
              .every((word) => choice.label.toLocaleLowerCase().includes(word)),
        )
      : [];
  const hiddenSelection =
    event.kind === 'selection' &&
    selectionSearch &&
    selectedEligible &&
    !matches.some((choice) => choice.id === selected)
      ? event.choices.find((choice) => choice.id === selected)
      : undefined;
  const visibleChoices = hiddenSelection
    ? [hiddenSelection, ...matches]
    : matches;
  const SelectionFrame = selectionSearch
    ? KeyboardAvoidingView
    : React.Fragment;
  const effects =
    event.kind === 'result'
      ? event.effects
      : event.kind === 'confirmation'
        ? event.terms
        : event.kind === 'milestone'
          ? event.facts
          : [];
  const contents = (
    // RN's legacy Android modal wrapper otherwise fits system insets a second
    // time, leaving strips of the underlying page outside this backdrop.
    // Keep the navigation bar opaque; card spacing still uses safe-area insets.
    <React.Fragment>
      <SelectionFrame
        {...(selectionSearch
          ? {
              style: { flex: 1 },
              behavior:
                Platform.OS === 'ios'
                  ? ('padding' as const)
                  : ('height' as const),
            }
          : {})}
      >
        <View
          style={[
            styles.backdrop,
            {
              backgroundColor: c.overlay,
              paddingTop: insets.top + 40,
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          <View
            accessibilityViewIsModal
            style={[
              styles.card,
              event.kind === 'selection' && styles.selectionCard,
              { backgroundColor: c.surface },
            ]}
          >
            {artwork.illustration && (
              <View
                testID="event-artwork-badge"
                style={[
                  styles.illustration,
                  {
                    backgroundColor: eventBadgeColor(artwork.category, c),
                    borderColor: c.surface,
                  },
                ]}
              >
                {artwork.illustration}
              </View>
            )}
            <ScrollView
              style={event.kind === 'selection' && styles.selectionScroll}
              contentContainerStyle={[
                styles.contents,
                event.kind === 'selection' && styles.selectionContents,
              ]}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <View style={styles.title}>
                <Text
                  ref={title}
                  onLayout={focusTitle}
                  accessibilityRole="header"
                  style={{
                    color: c.ink,
                    fontSize: 24,
                    fontWeight: '700',
                    lineHeight: 31.2,
                    textAlign: 'center',
                  }}
                >
                  {event.title}
                </Text>
              </View>
              {!!event.participants?.length && (
                <View style={styles.participants}>
                  {event.participants.map((person) => (
                    <Text
                      key={person.personId}
                      style={{
                        color: c.muted,
                        fontSize: 13,
                        lineHeight: 18,
                        textAlign: 'center',
                      }}
                    >
                      {person.role.charAt(0).toUpperCase() +
                        person.role.slice(1)}{' '}
                      · {person.name}
                    </Text>
                  ))}
                </View>
              )}
              <Body centered>{event.body}</Body>
              {error && (
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  style={{ color: c.red, textAlign: 'center', fontSize: 14 }}
                >
                  {error}
                </Text>
              )}
              {effects.length > 0 && (
                <View style={[styles.effects, { backgroundColor: c.inset }]}>
                  {effects.map((effect) => (
                    <View
                      key={effect.id}
                      style={[
                        styles.effectRow,
                        stackedEffects && styles.effectRowStacked,
                      ]}
                    >
                      <Text
                        style={{
                          color: c.ink,
                          fontSize: 14,
                          flex: stackedEffects ? 0 : 1,
                          minWidth: 0,
                        }}
                      >
                        {effect.label}
                      </Text>
                      <Text
                        style={{
                          color:
                            effect.tone === 'positive'
                              ? c.positiveText
                              : effect.tone === 'negative'
                                ? c.red
                                : c.ink,
                          fontWeight: '600',
                          fontSize: 14,
                          textAlign: stackedEffects ? 'left' : 'right',
                          flex: stackedEffects ? 0 : 1,
                          minWidth: 0,
                        }}
                      >
                        {effect.value}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {event.kind === 'decision' && showProgress && (
                <ActivityIndicator
                  color={c.blue}
                  accessibilityLabel="Saving your decision"
                />
              )}
              {event.kind === 'decision' &&
                event.choices.map((choice) => (
                  <View key={choice.id} style={{ gap: 6 }}>
                    <Button
                      label={choice.label}
                      disabled={busy || !!choice.disabledReason}
                      accessibilityLabel={displayText(
                        [choice.label, choice.disabledReason]
                          .filter(Boolean)
                          .join('. '),
                      )}
                      onPress={() => choose(choice.id)}
                    />
                    {choice.disabledReason && <Body muted>{choice.disabledReason}</Body>}
                  </View>
                ))}
              {event.kind === 'selection' && (
                <>
                  {selectionSearch && (
                    <View style={{ gap: 8 }}>
                      <TextInput
                        accessibilityLabel={displayText(selectionSearch.label)}
                        placeholder={
                          selectionSearch.placeholder ??
                          'Search by name or description'
                        }
                        placeholderTextColor={c.muted}
                        value={query}
                        editable={!busy}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={(value) => {
                          if (canAct()) setQuery(value);
                        }}
                        style={{
                          color: c.ink,
                          backgroundColor: c.inset,
                          borderColor: c.line,
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 12,
                          minHeight: 48,
                          fontSize: 15,
                        }}
                      />
                      {!!query && (
                        <Button
                          label="Clear Search"
                          tone="secondary"
                          disabled={busy}
                          onPress={() => {
                            if (canAct()) setQuery('');
                          }}
                        />
                      )}
                      {!!query && (
                        <Text
                          accessibilityLiveRegion="polite"
                          style={{
                            color: c.muted,
                            fontSize: 13,
                            lineHeight: 18,
                          }}
                        >
                          {matches.length
                            ? matches.length +
                              ' matching ' +
                              (matches.length === 1 ? 'option' : 'options')
                            : 'No matching options'}
                          {hiddenSelection
                            ? '. Your selected option is kept below.'
                            : ''}
                        </Text>
                      )}
                    </View>
                  )}
                  {visibleChoices.map((choice) => (
                    <Pressable
                      key={choice.id}
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked: selected === choice.id,
                        disabled: busy || !!choice.disabledReason,
                      }}
                      accessibilityLabel={displayText(
                        [choice.label, choice.disabledReason]
                          .filter(Boolean)
                          .join('. '),
                      )}
                      disabled={busy || !!choice.disabledReason}
                      onPress={() => {
                        if (
                          canAct() &&
                          !choice.disabledReason &&
                          selectedRef.current !== choice.id
                        ) {
                          selectedRef.current = choice.id;
                          setSelected(choice.id);
                          hapticFeedback();
                        }
                      }}
                      style={[
                        styles.option,
                        {
                          borderColor: selected === choice.id ? c.blue : c.line,
                          backgroundColor:
                            selected === choice.id ? c.selected : c.surface,
                        },
                      ]}
                    >
                      {choice.illustration ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                            style={{ width: 36, height: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
                            {choice.illustration}
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Body>{choice.label}</Body>
                            {choice.disabledReason && <Body muted>{choice.disabledReason}</Body>}
                          </View>
                        </View>
                      ) : <>
                        <Body>{choice.label}</Body>
                        {choice.disabledReason && <Body muted>{choice.disabledReason}</Body>}
                      </>}
                    </Pressable>
                  ))}
                </>
              )}
              {event.kind === 'confirmation' && (
                <Button
                  label={event.confirmLabel}
                  busy={busy}
                  onPress={() => choose('confirm')}
                />
              )}
              {event.kind === 'milestone' && event.action && (
                <Button
                  label={event.action.label}
                  disabled={busy}
                  onPress={() => choose(event.action!.id)}
                />
              )}
              {(event.kind === 'result' || event.kind === 'milestone') && (
                <Button
                  label={event.continueLabel ?? 'Continue'}
                  tone={
                    event.kind === 'milestone' && event.action
                      ? 'secondary'
                      : 'primary'
                  }
                  busy={busy}
                  onPress={() => choose('continue')}
                />
              )}
              {onCancel && event.kind !== 'selection' && (
                <Button
                  label="Never mind"
                  tone="secondary"
                  disabled={busy}
                  onPress={() => dismiss(onCancel)}
                />
              )}
            </ScrollView>
            {event.kind === 'selection' && (
              <View style={styles.selectionFooter}>
                <Button
                  label={event.confirmLabel}
                  disabled={!selectedEligible}
                  busy={busy}
                  onPress={() => {
                    if (selected && selectedEligible) choose(selected);
                  }}
                />
                {onCancel && (
                  <Button
                    label="Never mind"
                    tone="secondary"
                    disabled={busy}
                    onPress={() => dismiss(onCancel)}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </SelectionFrame>
    </React.Fragment>
  );
  return hosted ? (
    contents
  ) : (
    <Modal
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent={false}
      animationType={reducedMotion ? 'none' : 'fade'}
      visible
      onRequestClose={() => dismiss(onCancel ?? onClose)}
    >
      {contents}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '100%',
    borderRadius: 24,
    paddingTop: 30,
  },
  selectionCard: { flexShrink: 1 },
  selectionScroll: { flexShrink: 1 },
  selectionContents: { paddingBottom: 12 },
  selectionFooter: {
    flexShrink: 0,
    paddingHorizontal: 22,
    paddingBottom: 24,
    gap: 12,
  },
  illustration: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    position: 'absolute',
    alignSelf: 'center',
    top: -44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contents: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 12,
  },
  title: { alignItems: 'center', marginTop: 6, minWidth: 0 },
  participants: { gap: 4, minWidth: 0 },
  effects: { borderRadius: 12, padding: 12, gap: 14 },
  effectRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  effectRowStacked: { flexDirection: 'column', alignItems: 'stretch', gap: 4 },
  option: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 52,
    justifyContent: 'center',
  },
});
