import React from 'react';
import { Pressable, Text } from 'react-native';
import { gameStyles as s } from './gameStyles';
export function GameButton({
  label,
  onPress,
  secondary,
  disabled,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        s.button,
        secondary && s.secondary,
        disabled && { opacity: 0.45 },
      ]}
    >
      <Text style={[s.buttonText, secondary && s.secondaryText]}>{label}</Text>
    </Pressable>
  );
}
