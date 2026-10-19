import React, { createContext, useContext, useMemo } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export const lightColors = {
  background: '#F8F7F5',
  surface: '#FFFFFF',
  inset: '#F0F1F3',
  ink: '#0B1545',
  muted: '#61718B',
  line: '#E7E9EE',
  blue: '#0878F9',
  bluePressed: '#0063DC',
  green: '#20A452',
  red: '#D93849',
  teal: '#31AAA5',
  purple: '#A06AD5',
  amber: '#F8BC32',
  track: '#E0E3E6',
  overlay: 'rgba(13, 26, 40, 0.66)',
  selected: '#EAF5FF',
};

export type Colors = typeof lightColors;
const darkColors: Colors = {
  ...lightColors,
  background: '#1B2433',
  surface: '#253247',
  inset: '#303D52',
  ink: '#F6F8FF',
  muted: '#BDC8DB',
  line: '#3A465A',
  track: '#435064',
  selected: '#203F62',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radii = { sm: 8, card: 16, modal: 24, pill: 999 };
const ThemeContext = createContext(lightColors);

export function ThemeProvider({
  appearance = 'light',
  children,
}: React.PropsWithChildren<{ appearance?: 'light' | 'dark' | 'system' }>) {
  const system = useColorScheme();
  const colors = useMemo(
    () => (appearance === 'dark' || (appearance === 'system' && system === 'dark') ? darkColors : lightColors),
    [appearance, system],
  );
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export const useColors = () => useContext(ThemeContext);
export function ThemedStatusBar() {
  const colors = useColors();
  // These legacy Android windows retain a dark system bar in the current
  // native runtime, so dark icons disappear even when the page is light.
  const legacyAndroid = Platform.OS === 'android' && Number(Platform.Version) < 29;
  return <StatusBar style={legacyAndroid || colors === darkColors ? 'light' : 'dark'} />;
}
