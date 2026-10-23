import React from 'react';
import { Pressable, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { gameStyles as s } from './gameStyles';
const iconPaths = {
  pause: 'M8 5V19M16 5V19',
  back: 'M14 6L8 12L14 18',
  left: 'M19 12H5M11 6L5 12L11 18',
  right: 'M5 12H19M13 6L19 12L13 18',
  up: 'M12 19V5M6 11L12 5L18 11',
  down: 'M12 5V19M6 13L12 19L18 13',
} as const;
export function GameButton({
  label,
  onPress,
  secondary,
  disabled,
  accessibilityLabel,
  accessibilityHint,
  round,
  size = 56,
  style,
  textStyle,
  icon,
  iconColor,
}: {
  label: string;
  onPress: () => unknown;
  secondary?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  round?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: keyof typeof iconPaths;
  iconColor?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        if (!disabled) onPress();
      }}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        round && {
          width: Math.max(48, size),
          height: Math.max(48, size),
          minWidth: 48,
          minHeight: 48,
          borderRadius: Math.max(48, size) / 2,
          paddingHorizontal: 0,
          paddingVertical: 0,
        },
        style,
        pressed && !disabled && s.buttonPressed,
        disabled && { opacity: 0.45 },
      ]}
    >
      {icon ? (
        <Svg width={24} height={24} viewBox="0 0 24 24" accessible={false}>
          <Path d={iconPaths[icon]} fill="none" stroke={iconColor ?? '#101B43'} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : <Text
        // Arrow glyphs are icons. Spoken labels remain full words.
        allowFontScaling={!round || label.length > 1}
        style={[
          s.buttonText,
          secondary && s.secondaryText,
          round && { fontSize: label.length === 1 ? 27 : 15, textAlign: 'center' },
          textStyle,
        ]}
      >
        {label}
      </Text>}
    </Pressable>
  );
}
