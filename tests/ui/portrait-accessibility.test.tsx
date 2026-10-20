import React from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CharacterPortrait } from '../../src/assets/CharacterPortrait';
import { avatarPresets } from '../../src/ui/CreationElements';

test('standalone portraits keep their image role and person label by default', () => {
  render(<CharacterPortrait name="Alex Martín" age={25} appearance={avatarPresets[6]} />);
  expect(screen.getByRole('image', { name: 'Alex Martín' })).toBeOnTheScreen();
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
