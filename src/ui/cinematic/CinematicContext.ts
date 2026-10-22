import { createContext, useContext } from 'react';
import type { CinematicKind } from './cinematicTiming';

export type PlayCinematic = (kind: 'birth' | 'death', destination: string, navigate: () => void) => void;
// Isolated screen tests/previews still navigate normally without the root host.
export const CinematicContext = createContext<{ play: PlayCinematic; activeKind: CinematicKind | null }>({ play: (_kind, _path, navigate) => navigate(), activeKind: null });
export const useCinematicTransition = () => useContext(CinematicContext);
