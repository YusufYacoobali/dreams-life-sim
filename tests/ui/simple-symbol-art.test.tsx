import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { CareerArt, type CareerArtId } from '../../src/assets/CareerArt';
import { careerRects } from '../../src/assets/careerLayout';
import { PetsLeisureArt, type PetsLeisureArtId } from '../../src/assets/PetsLeisureArt';
import { petsLeisureRects } from '../../src/assets/petsLeisureLayout';
import { SchoolArt } from '../../src/assets/SchoolArt';
import { schoolRects } from '../../src/assets/schoolLayout';
import { TravelArt } from '../../src/assets/TravelArt';
import { travelArtIds, travelRect } from '../../src/assets/travelLayout';

const career = { athlete: 'ball', politician: 'podium', science: 'telescope', concert: 'microphone', training: 'dumbbell', film: 'film-camera' } as const;
const pets = { play: 'ball', cinema: 'popcorn' } as const;
const travel = { flight: 'plane', passport: 'passport', holiday: 'beach-umbrella', abroad: 'suitcase' } as const;
const host = (art: React.ReactNode) => <View testID="symbol-test-host">{art}</View>;
const source = () => String(screen.UNSAFE_getByType(Image).props.source.testUri);
const frame = () => StyleSheet.flatten(screen.UNSAFE_getAllByType(View).find(node => node.props.testID !== 'symbol-test-host')!.props.style);

test('selected saved career and leisure IDs show the intended contained subjects at row and popup sizes', () => {
  const view = render(host(<CareerArt id="athlete" size={36} />));
  for (const size of [36, 96]) {
    for (const [id, symbol] of Object.entries(career)) {
      view.rerender(host(<CareerArt id={id as CareerArtId} size={size} />));
      expect(source()).toContain('/action-symbols/' + symbol + '.png');
      expect(frame()).toMatchObject({ width: size, height: size });
      expect(screen.UNSAFE_getByType(Image).props.resizeMode).toBe('contain');
      expect(StyleSheet.flatten(screen.UNSAFE_getByType(Image).props.style)).toMatchObject({ width: size, height: size });
      expect(screen.queryAllByRole('image')).toHaveLength(0);
    }
    for (const [id, symbol] of Object.entries(pets)) {
      view.rerender(host(<PetsLeisureArt id={id as PetsLeisureArtId} size={size} />));
      expect(source()).toContain('/action-symbols/' + symbol + '.png');
      expect(frame()).toMatchObject({ width: size, height: size });
      expect(screen.UNSAFE_getByType(Image).props.resizeMode).toBe('contain');
    }
  }
});

test('school and pet labels remain accessible once, while decorative artwork stays hidden', () => {
  const view = render(host(<SchoolArt id="evening" size={48} label="Evening study" />));
  expect(source()).toContain('/polish3/actions/academic-help.png');
  expect(screen.getAllByRole('image')).toHaveLength(1);
  expect(screen.getByRole('image', { name: 'Evening study' })).toBeOnTheScreen();
  expect(screen.UNSAFE_getByType(Image).props.accessible).toBe(false);
  view.rerender(host(<PetsLeisureArt id="play" size={48} label="Play with pet" />));
  expect(screen.getAllByRole('image')).toHaveLength(1);
  expect(screen.getByRole('image', { name: 'Play with pet' })).toBeOnTheScreen();
  view.rerender(host(<SchoolArt id="evening" size={48} />));
  expect(screen.queryAllByRole('image')).toHaveLength(0);
  expect(screen.UNSAFE_getByType(Image).props.resizeMode).toBe('contain');
});

test('travel action symbols retain the original rectangular frame and are contained within it', () => {
  const view = render(host(<TravelArt id="flight" width={40} />));
  for (const width of [40, 128]) for (const [id, symbol] of Object.entries(travel)) {
    const [, , sourceWidth, sourceHeight] = travelRect(id as keyof typeof travel), height = sourceHeight * width / sourceWidth;
    view.rerender(host(<TravelArt id={id as keyof typeof travel} width={width} />));
    expect(source()).toContain('/action-symbols/' + symbol + '.png');
    expect(frame()).toMatchObject({ width, flexShrink: 0, overflow: 'hidden', borderRadius: 8 });
    expect(frame().height).toBeCloseTo(height);
    expect(screen.UNSAFE_getByType(Image).props.resizeMode).toBe('contain');
    const image = StyleSheet.flatten(screen.UNSAFE_getByType(Image).props.style);
    expect(image.width).toBe(width); expect(image.height).toBeCloseTo(height);
    expect(screen.queryAllByRole('image')).toHaveLength(0);
  }
});

test('unselected career, pet and school artwork and destination postcards retain their original atlas paths', () => {
  const view = render(host(<CareerArt id="actor" size={40} />));
  for (const id of Object.keys(careerRects) as CareerArtId[]) if (!Object.hasOwn(career, id)) {
    view.rerender(host(<CareerArt id={id} size={40} />));
    expect(source()).toContain('/career-atlas.png');
    expect(screen.UNSAFE_getByType(Image).props.resizeMode).toBe('stretch');
  }
  for (const id of Object.keys(petsLeisureRects) as PetsLeisureArtId[]) if (!Object.hasOwn(pets, id)) {
    view.rerender(host(<PetsLeisureArt id={id} size={40} />));
    expect(source()).toContain('/pets-leisure-atlas.png');
  }
  for (const id of Object.keys(schoolRects) as (keyof typeof schoolRects)[]) if (id !== 'evening') {
    view.rerender(host(<SchoolArt id={id} size={40} />));
    expect(source()).toContain('/school-atlas.png');
  }
  for (const id of travelArtIds) if (!Object.hasOwn(travel, id)) {
    view.rerender(host(<TravelArt id={id} width={96} />));
    expect(source()).toContain('/travel-atlas.png');
    expect(screen.UNSAFE_getByType(Image).props.resizeMode).toBe('stretch');
    const [, , sourceWidth, sourceHeight] = travelRect(id);
    expect(frame()).toMatchObject({ width: 96, overflow: 'hidden', borderRadius: 8 });
    expect(frame().height).toBeCloseTo(sourceHeight * 96 / sourceWidth);
  }
});
