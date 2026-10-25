import React from 'react';
jest.mock('../../src/persistence/native', () => ({ openRepository: async () => { throw new Error('Unexpected device database access in artwork fixture'); } }));
import { Image, StyleSheet, View } from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CultArt, cultArtCatalog, cultImages, cultHeadquartersArt, cultUpgradeArt, type CultArtId } from '../../src/assets/CultArt';
import { EventModal, type EventPresentation } from '../../src/ui/EventModal';
import { ThemeProvider } from '../../src/ui/theme';

const host = (children: React.ReactNode) => <View testID="cult-art-host">{children}</View>;
const image = () => screen.UNSAFE_getByType(Image);

test('all five headquarters and six upgrades have distinct readable subjects in row and popup frames', () => {
  const ids = [...Object.values(cultHeadquartersArt), ...Object.values(cultUpgradeArt)],
    view = render(host(<CultArt id={ids[0]} />));
  expect(new Set(ids).size).toBe(11);
  expect(new Set(ids.map(id => cultArtCatalog[id].file)).size).toBe(11);
  for (const size of [36, 64]) for (const id of ids) {
    view.rerender(host(<CultArt id={id} size={size} />));
    const art = image(), entry = cultArtCatalog[id], style = StyleSheet.flatten(art.props.style);
    expect(String(art.props.source.testUri)).toContain('/' + entry.file);
    expect(art.props.accessible).toBe(false);
    expect(screen.queryAllByRole('image')).toHaveLength(0);
    if ('rect' in entry) {
      const [x, y, width, height] = entry.rect, scale = size / Math.max(width, height);
      expect(art.props.resizeMode).toBe('stretch');
      expect(style).toMatchObject({ left: -x * scale, top: -y * scale, width: entry.atlasSize[0] * scale, height: entry.atlasSize[1] * scale });
      const frame = screen.UNSAFE_getAllByType(View).find(node => node.props.testID !== 'cult-art-host')!;
      expect(StyleSheet.flatten(frame.props.style)).toMatchObject({ width: size, height: size });
    } else {
      expect(art.props.resizeMode).toBe('contain');
      expect(style).toMatchObject({ width: size, height: size, flexShrink: 0 });
    }
  }
});

test('every original saved cult illustration keeps its original source and unknown legacy values fall back safely', () => {
  const view = render(host(<CultArt />));
  for (const id of Object.keys(cultImages) as (keyof typeof cultImages)[]) {
    view.rerender(host(<CultArt id={id} size={48} />));
    expect(image().props.source).toEqual(cultImages[id]);
    expect(image().props.resizeMode).toBe('contain');
  }
  view.rerender(host(<CultArt id={'retired-saved-symbol' as CultArtId} />));
  expect(image().props.source).toEqual(cultImages.cult);
});

test('optional radio artwork keeps labels, disabled reasons and explicit selection behavior; plain choices remain text-only', () => {
  const choose = jest.fn(), cancel = jest.fn(),
    event: EventPresentation = { id: 'cult-icons:selection', kind: 'selection', title: 'Choose quarters', body: 'Choose a feature.', confirmLabel: 'Choose', choices: [
      { id: 'plain', label: 'Plain option' },
      { id: 'bed', label: 'Residential Quarters', illustration: <CultArt id="bed" size={36} /> },
      { id: 'locked', label: 'Grand Monument', disabledReason: 'Treasury too low', illustration: <CultArt id="monument" size={36} /> },
    ] },
    frame = (presentation: EventPresentation) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 844 }, insets: { top: 24, bottom: 48, left: 0, right: 0 } }}><ThemeProvider><EventModal event={presentation} onChoose={choose} onCancel={cancel} /></ThemeProvider></SafeAreaProvider>,
    view = render(frame(event));
  expect(within(screen.getByRole('radio', { name: 'Plain option' })).UNSAFE_queryAllByType(Image)).toHaveLength(0);
  const bed = screen.getByRole('radio', { name: 'Residential Quarters' });
  expect(String(within(bed).UNSAFE_getByType(Image).props.source.testUri)).toContain('/cult-options/bed.png');
  expect(within(bed).queryAllByRole('image')).toHaveLength(0);
  const locked = screen.getByRole('radio', { name: 'Grand Monument. Treasury too low' });
  expect(locked).toBeDisabled();
  fireEvent.press(locked);
  expect(screen.getByRole('button', { name: 'Choose' })).toBeDisabled();
  fireEvent.press(bed);
  expect(screen.getByRole('radio', { name: 'Residential Quarters', checked: true })).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Choose' }));
  expect(choose).toHaveBeenCalledWith('bed');
  view.rerender(frame({ ...event, id: 'plain-selection', choices: [{ id: 'plain', label: 'Plain option' }] }));
  expect(within(screen.getByRole('radio', { name: 'Plain option' })).UNSAFE_queryAllByType(Image)).toHaveLength(0);
  expect(screen.getByRole('button', { name: 'Choose' })).toBeDisabled();
  fireEvent.press(screen.getByRole('radio', { name: 'Plain option' }));
  fireEvent.press(screen.getByRole('button', { name: 'Choose' }));
  expect(choose).toHaveBeenLastCalledWith('plain');
  expect(cancel).not.toHaveBeenCalled();
});
