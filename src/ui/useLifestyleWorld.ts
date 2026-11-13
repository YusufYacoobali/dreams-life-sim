import { useMemo } from 'react';
import { useGame } from '../state/useGame';
import { lifestylePreview } from '../game/systems/lifestyleActivation';

/** Presentation-only setup. The real command persists it with the successful action. */
export function useLifestyleWorld() {
  const world = useGame(state => state.world);
  return useMemo(() => world ? lifestylePreview(world) : null, [world]);
}
