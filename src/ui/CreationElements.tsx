import React from 'react';
import { Text, View } from 'react-native';
import type { CountryCode } from '../game/countries';
import type { Person } from '../game/model';
import { useColors } from './theme';

export const countryFlags: Record<CountryCode, string> = { US: '🇺🇸', CA: '🇨🇦', GB: '🇬🇧', AU: '🇦🇺', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸', IT: '🇮🇹', BR: '🇧🇷', IN: '🇮🇳', JP: '🇯🇵', ZA: '🇿🇦' };
export const nationalityLabels: Record<CountryCode, string> = { US: 'American', CA: 'Canadian', GB: 'British', AU: 'Australian', FR: 'French', DE: 'German', ES: 'Spanish', IT: 'Italian', BR: 'Brazilian', IN: 'Indian', JP: 'Japanese', ZA: 'South African' };
export const avatarPresets: Person['appearance'][] = [
  { face: 0, skin: 1, hair: 0, hairColor: 0 }, { face: 1, skin: 1, hair: 4, hairColor: 1 }, { face: 2, skin: 0, hair: 1, hairColor: 1 }, { face: 3, skin: 5, hair: 3, hairColor: 0 },
  { face: 0, skin: 2, hair: 7, hairColor: 0 }, { face: 2, skin: 3, hair: 3, hairColor: 1 }, { face: 1, skin: 0, hair: 5, hairColor: 0 }, { face: 3, skin: 0, hair: 2, hairColor: 3 },
  { face: 1, skin: 1, hair: 4, hairColor: 4 }, { face: 0, skin: 2, hair: 2, hairColor: 0 }, { face: 2, skin: 4, hair: 7, hairColor: 1 }, { face: 3, skin: 1, hair: 5, hairColor: 3 },
  { face: 2, skin: 3, hair: 1, hairColor: 0 }, { face: 0, skin: 5, hair: 3, hairColor: 1 }, { face: 3, skin: 2, hair: 6, hairColor: 2 }, { face: 1, skin: 0, hair: 7, hairColor: 0 },
];
export function CreationProgress({ step }: { step: 1 | 2 }) {
  const colors = useColors();
  return <View accessible accessibilityLabel={'Character creation, step ' + step + ' of 3'} style={{ alignSelf: 'center', flexDirection: 'row', gap: 6, marginBottom: 8 }}>{[1, 2, 3].map(index => <View key={index} style={{ width: 48, height: 7, borderRadius: 4, backgroundColor: index <= step ? colors.blue : colors.track }} />)}</View>;
}
export function SectionLabel({ children }: React.PropsWithChildren) {
  const colors = useColors(); return <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.6, marginTop: 4 }}>{children}</Text>;
}
