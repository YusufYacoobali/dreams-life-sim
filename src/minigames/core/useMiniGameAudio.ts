import { Platform } from 'react-native';
import { usePreferences } from '../../state/usePreferences';
import { useActionSound } from '../../ui/useActionSound';
import type { MiniGameKind } from './types';
const sounds = {
  sports: require('../../../assets/minigames/sports.wav'),
  crime: require('../../../assets/minigames/crime.wav'),
  astronaut: require('../../../assets/minigames/astronaut.wav'),
};
export function useMiniGameAudio(kind: MiniGameKind) {
  const enabled = usePreferences(
    (state) => state.ready && !state.loadFailed && state.settings.soundEffects,
  );
  return useActionSound(
    enabled && (Platform.OS === 'android' || Platform.OS === 'ios'),
    sounds[kind],
  );
}
