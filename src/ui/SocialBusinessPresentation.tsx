import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Body, Heading } from './components';
import { useColors } from './theme';

/** Presentation used by the profile, creator and small-business screens. */
export function SocialBusinessIntro({ art, title, body, eyebrow }: { art: React.ReactNode; title: string; body: string; eyebrow?: string }) {
  return <View style={styles.intro}>
    <View style={styles.art}>{art}</View>
    <View style={styles.introText}>{eyebrow && <Body muted>{eyebrow}</Body>}<Heading size={22}>{title}</Heading><Body muted>{body}</Body></View>
  </View>;
}

export function SocialBusinessFacts({ items }: { items: readonly { label: string; value: string; note?: string }[] }) {
  const c = useColors(), { width, fontScale } = useWindowDimensions();
  const stacked = width < 340 || fontScale >= 1.3;
  return <View style={styles.facts}>{items.map(item => <View key={item.label} accessible accessibilityLabel={item.label + ': ' + item.value + (item.note ? '. ' + item.note : '')} style={[styles.fact, { backgroundColor: c.inset }, stacked && { flexBasis: '100%' }]}>
    <Body muted>{item.label}</Body><Text style={{ color: c.ink, fontSize: 19, fontWeight: '700' }}>{item.value}</Text>{item.note && <Body muted>{item.note}</Body>}
  </View>)}</View>;
}

export function SocialBusinessChoice({ title, subtitle, selected, onPress, disabled = false, disabledReason, icon }: {
  title: string; subtitle?: string; selected: boolean; onPress: () => void; disabled?: boolean; disabledReason?: string; icon?: React.ReactNode;
}) {
  const c = useColors(), unavailable = disabled || !!disabledReason;
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: unavailable }}
    accessibilityLabel={[title, subtitle, selected ? 'Selected' : undefined, disabledReason].filter(Boolean).join('. ')}
    disabled={unavailable} onPress={() => { if (!selected) onPress(); }}
    style={({ pressed }) => [styles.choice, { borderColor: selected ? c.actionBlue : c.line, backgroundColor: pressed ? c.selected : selected ? c.inset : 'transparent', opacity: unavailable ? 0.55 : 1 }]}>
    {icon && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.art}>{icon}</View>}
    <View style={styles.choiceText}><Text style={{ color: c.ink, fontSize: 16, fontWeight: '600' }}>{title}</Text>
      {(subtitle || disabledReason) && <Text style={{ color: c.muted, fontSize: 13, lineHeight: 19 }}>{disabledReason ?? subtitle}</Text>}
      {selected && <Text style={{ color: c.link, fontSize: 13, fontWeight: '600' }}>Selected</Text>}
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  intro: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 },
  art: { flexShrink: 0 },
  introText: { flexGrow: 1, flexBasis: 170, minWidth: 0, gap: 5 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fact: { flexGrow: 1, flexBasis: 132, minWidth: 0, borderRadius: 12, padding: 12, gap: 5 },
  choice: { minHeight: 64, borderRadius: 12, borderWidth: 2, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  choiceText: { flex: 1, minWidth: 0, gap: 4 },
});
