import React from 'react';
import { View } from 'react-native';
import type { CountryCode } from '../game/countries';
import type { Person } from '../game/model';
import { useColors } from './theme';
import { DisplayText as Text, displayText } from './DisplayText';

export const countryFlags: Record<CountryCode, string> = { US: '🇺🇸', CA: '🇨🇦', GB: '🇬🇧', AU: '🇦🇺', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸', IT: '🇮🇹', BR: '🇧🇷', IN: '🇮🇳', JP: '🇯🇵', ZA: '🇿🇦' };
export const nationalityLabels: Record<CountryCode, string> = { US: 'American', CA: 'Canadian', GB: 'British', AU: 'Australian', FR: 'French', DE: 'German', ES: 'Spanish', IT: 'Italian', BR: 'Brazilian', IN: 'Indian', JP: 'Japanese', ZA: 'South African' };
export const avatarPresets: Person['appearance'][] = [
  { identity: 0, outfit: 0, face: 0, skin: 2, hair: 3, hairColor: 0 }, { identity: 1, outfit: 1, face: 2, skin: 0, hair: 4, hairColor: 1 }, { identity: 2, outfit: 2, face: 3, skin: 1, hair: 3, hairColor: 1 }, { identity: 3, outfit: 3, face: 3, skin: 5, hair: 2, hairColor: 0 },
  { identity: 4, outfit: 4, face: 1, skin: 1, hair: 4, hairColor: 0 }, { identity: 5, outfit: 5, face: 2, skin: 2, hair: 2, hairColor: 1 }, { identity: 6, outfit: 6, face: 2, skin: 0, hair: 4, hairColor: 0 }, { identity: 7, outfit: 7, face: 3, skin: 0, hair: 3, hairColor: 3 },
  { identity: 8, outfit: 8, face: 0, skin: 0, hair: 4, hairColor: 4 }, { identity: 9, outfit: 9, face: 2, skin: 1, hair: 1, hairColor: 0 }, { identity: 10, outfit: 10, face: 2, skin: 4, hair: 5, hairColor: 1 }, { identity: 11, outfit: 11, face: 1, skin: 0, hair: 4, hairColor: 3 },
  { identity: 12, outfit: 12, face: 3, skin: 2, hair: 3, hairColor: 0 }, { identity: 13, outfit: 13, face: 1, skin: 4, hair: 5, hairColor: 0 }, { identity: 14, outfit: 14, face: 2, skin: 0, hair: 3, hairColor: 4 }, { identity: 15, outfit: 15, face: 3, skin: 1, hair: 4, hairColor: 0 },
];
export function CreationProgress({ step }: { step: 1 | 2 }) {
  const colors = useColors();
  return <View accessible accessibilityLabel={displayText('Character creation, step ' + step + ' of 3')} style={{ alignSelf: 'center', flexDirection: 'row', gap: 6, marginBottom: 8 }}>{[1, 2, 3].map(index => <View key={index} style={{ width: 48, height: 7, borderRadius: 4, backgroundColor: index <= step ? colors.blue : colors.track }} />)}</View>;
}
export function SectionLabel({ children }: React.PropsWithChildren) {
  const colors = useColors(); return <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.6, marginTop: 4 }}>{children}</Text>;
}
