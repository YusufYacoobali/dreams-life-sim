import React from 'react';
import { Image, Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CharacterPortrait } from '../../src/assets/CharacterPortrait';
import { avatarPresets } from '../../src/ui/CreationElements';

test('standalone portraits keep their image role and person label by default', () => {
  let props = { name: 'Alex Martín', age: 25, appearance: { ...avatarPresets[6] }, size: 56, decorative: false };
  const view = render(<CharacterPortrait {...props} />), layers = () => screen.UNSAFE_getAllByType(Image).map(image => image.props);
  expect(screen.getByRole('image', { name: 'Alex Martín' })).toBeOnTheScreen();
  const original = layers(); view.rerender(<CharacterPortrait {...props} appearance={{ ...props.appearance }} />);
  layers().forEach((layer, index) => expect(layer).toBe(original[index]));
  // Each consumed scalar invalidates the private drawing, even if the caller
  // reuses another trait or an age happens to share the same head stage.
  const limits = { face: 4, skin: 6, hair: 8, hairColor: 5 };
  for (const trait of ['face', 'skin', 'hair', 'hairColor'] as const) {
    const previous = layers(); props = { ...props, appearance: { ...props.appearance, [trait]: (props.appearance[trait] + 1) % limits[trait] } };
    view.rerender(<CharacterPortrait {...props} />); expect(layers()[0]).not.toBe(previous[0]);
  }
  for (const change of [{ age: 26 }, { name: 'Alex Rivera' }, { size: 88 }, { decorative: true }]) {
    const previous = layers(); props = { ...props, ...change }; view.rerender(<CharacterPortrait {...props} />);
    expect(layers()[0]).not.toBe(previous[0]);
  }
  expect(screen.queryAllByRole('image')).toHaveLength(0);
  props = { ...props, decorative: false, age: 70 }; view.rerender(<CharacterPortrait {...props} />);
  expect(screen.getByRole('image', { name: 'Alex Rivera' })).toBeOnTheScreen();
  const adultLayers = layers(); view.rerender(<CharacterPortrait {...props} age={1} />);
  expect(layers().length).toBe(adultLayers.length / 2);
});

test('a decorative portrait leaves the named selectable parent as the only accessibility target', () => {
  const choose = jest.fn();
  render(<Pressable accessibilityRole="radio" accessibilityLabel="Avatar 7" accessibilityState={{ checked: true }} onPress={choose}>
    <CharacterPortrait decorative name="Avatar 7" age={25} appearance={avatarPresets[6]} />
    <Text>Selected appearance</Text>
  </Pressable>);
  const avatar = screen.getByRole('radio', { name: 'Avatar 7', checked: true });
  expect(avatar).toBeOnTheScreen();
  expect(screen.queryAllByRole('image')).toHaveLength(0);
  expect(screen.queryByLabelText('Avatar 7', { includeHiddenElements: false })).toBe(avatar);
  fireEvent.press(avatar); expect(choose).toHaveBeenCalledTimes(1);
});
