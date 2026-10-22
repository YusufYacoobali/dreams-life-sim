export type CinematicKind = 'welcome' | 'birth' | 'death';
export const FPS = 60;
export const DURATION = { welcome: 3200, birth: 3300, death: 2800 } as const;
// Whole frames, inside the fully opaque plateau of each authored sequence.
export const COVER_TIME = { welcome: 0, birth: 1400, death: 1200 } as const;
export const NAVY = '#061633';
