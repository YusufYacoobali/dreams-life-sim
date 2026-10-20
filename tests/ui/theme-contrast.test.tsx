import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Body, Button } from '../../src/ui/components';
import { EventModal } from '../../src/ui/EventModal';
import { FilterTabs } from '../../src/ui/FilterTabs';
import { BottomNavigation } from '../../src/ui/GameShell';
import { Colors, ThemeProvider, useColors } from '../../src/ui/theme';

function luminance(hex: string) {
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
const textColor = (label: string) => StyleSheet.flatten(screen.getByText(label).props.style).color as string;

test.each(['light', 'dark'] as const)('%s enabled action labels and pressed states meet normal-text contrast', appearance => {
  let colors!: Colors;
  const Probe = () => { colors = useColors(); return null; };
  render(<ThemeProvider appearance={appearance}><Probe />{(['primary', 'positive', 'danger', 'secondary'] as const).map(tone =>
    <Button key={tone} label={tone + ' action'} tone={tone} onPress={() => {}} />
  )}<FilterTabs values={[{ id: 'selected', label: 'Selected filter' }, { id: 'other', label: 'Other filter' }]} selected="selected" onSelect={() => {}} /></ThemeProvider>);
  for (const tone of ['primary', 'positive', 'danger', 'secondary']) {
    const label = tone + ' action', control = screen.getByRole('button', { name: label });
    let pressable = control.parent;
    while (pressable && typeof pressable.props.style !== 'function') pressable = pressable.parent;
    if (!pressable) throw new Error('The rendered action has no pressed style');
    const normal = StyleSheet.flatten(control.props.style), pressed = StyleSheet.flatten(pressable.props.style({ pressed: true }));
    expect(contrast(textColor(label), normal.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(textColor(label), pressed.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    expect(normal.opacity).toBe(1); expect(pressed.opacity).toBe(1);
  }
  for (const label of ['Selected filter', 'Other filter']) {
    const control = screen.getByRole('tab', { name: label });
    expect(contrast(textColor(label), StyleSheet.flatten(control.props.style).backgroundColor)).toBeGreaterThanOrEqual(4.5);
  }
  // Welcome and Age Up use these same filled roles, with white normal/large text.
  expect(contrast('#FFFFFF', colors.actionGreen)).toBeGreaterThanOrEqual(4.5);
  expect(contrast('#FFFFFF', colors.actionBlue)).toBeGreaterThanOrEqual(4.5);
});

test.each(['light', 'dark'] as const)('%s muted, error and signed result text stays readable on actual surfaces', appearance => {
  let colors!: Colors;
  const Probe = () => { colors = useColors(); return <><Body muted>Muted guidance</Body><Text style={{ color: colors.red }}>Form error</Text></>; };
  render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 0, left: 0, right: 0 } }}>
    <ThemeProvider appearance={appearance}><Probe /><BottomNavigation activeTab="life" onSelectTab={() => {}} /><EventModal event={{ id: 'contrast-result', kind: 'result', title: 'Saved result', body: 'Actual signed effects', effects: [
      { id: 'gain', label: 'Gain', value: '+5', tone: 'positive' },
      { id: 'loss', label: 'Loss', value: '−2', tone: 'negative' },
    ] }} error="Storage error" onChoose={() => {}} /></ThemeProvider>
  </SafeAreaProvider>);
  for (const background of [colors.background, colors.surface, colors.inset, colors.selected]) {
    expect(contrast(textColor('Muted guidance'), background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(textColor('Form error'), background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.positiveText, background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.ink, background)).toBeGreaterThanOrEqual(4.5);
  }
  expect(contrast(textColor('Storage error'), colors.surface)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(textColor('+5'), colors.inset)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(textColor('−2'), colors.inset)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(textColor('Life'), colors.surface)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(textColor('Assets'), colors.surface)).toBeGreaterThanOrEqual(4.5);
});
