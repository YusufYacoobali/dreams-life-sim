import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useColors } from './theme';
import { DisplayText as Text, displayText } from './DisplayText';

export function FilterTabs<T extends string>({ values, selected, onSelect, scrollable = false }: { values: readonly { id: T; label: string }[]; selected: T; onSelect: (id: T) => void; scrollable?: boolean }) {
  const c = useColors();
  const scroll = useRef<ScrollView>(null), viewport = useRef(0), offset = useRef(0);
  const layouts = useRef(new Map<T, { x: number; width: number }>());
  const revealSelected = useCallback(() => {
    const frame = layouts.current.get(selected), width = viewport.current;
    if (!scrollable || !frame || width <= 0) return;
    const right = frame.x + frame.width;
    const target = frame.width >= width || frame.x < offset.current ? frame.x : right > offset.current + width ? right - width : null;
    if (target !== null) { offset.current = target; scroll.current?.scrollTo({ x: target, animated: false }); }
  }, [scrollable, selected]);
  useEffect(revealSelected, [revealSelected]);
  const tabs = <View accessibilityRole="tablist" style={[styles.tabs, scrollable && styles.horizontalTabs]}>{values.map(item => {
    const active = selected === item.id;
    return <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={displayText(item.label)} accessibilityState={{ selected: active }}
      onPress={() => { if (!active) onSelect(item.id); }}
      onLayout={scrollable ? event => { layouts.current.set(item.id, event.nativeEvent.layout); if (active) revealSelected(); } : undefined}
      style={({ pressed }) => [styles.tab, scrollable && styles.horizontalTab, { backgroundColor: active ? pressed ? c.actionBluePressed : c.actionBlue : pressed ? c.selected : c.inset }]}>
      <Text numberOfLines={scrollable ? 1 : undefined} style={[styles.label, scrollable && styles.horizontalLabel, { color: active ? '#FFFFFF' : c.ink }]}>{item.label}</Text>
    </Pressable>;
  })}</View>;
  return scrollable ? <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
    onLayout={event => { viewport.current = event.nativeEvent.layout.width; revealSelected(); }}
    onScroll={event => { offset.current = event.nativeEvent.contentOffset.x; }} scrollEventThrottle={16}
    style={styles.scroller} contentContainerStyle={styles.scrollContent}>{tabs}</ScrollView> : tabs;
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  horizontalTabs: { flexWrap: 'nowrap' },
  tab: { flexGrow: 1, flexBasis: 'auto', minWidth: 54, maxWidth: '100%', minHeight: 48, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center', borderRadius: 10 },
  horizontalTab: { flexGrow: 0, flexShrink: 0, maxWidth: undefined },
  label: { textAlign: 'center', fontSize: 12, fontWeight: '600', flexShrink: 1 },
  horizontalLabel: { flexShrink: 0 },
  scroller: { flexGrow: 0 },
  scrollContent: { flexGrow: 1 },
});
