/** Keep brand colours on a white tile so they read consistently in both themes. */
export const platformMarkPresentation = {
  photogram: { background: '#FFFFFF', fill: '#C13584' },
  videowave: { background: '#FFFFFF', fill: '#FF0033' },
  streamline: { background: '#FFFFFF', fill: '#9146FF' },
  lifelink: { background: '#FFFFFF', fill: '#000000' },
} as const;

/** Saturated Instagram hues retain at least 3:1 contrast against the tile. */
export const instagramMarkGradient = {
  x1: '0%', y1: '100%', x2: '100%', y2: '0%',
  stops: [
    { offset: '0%', color: '#D95721' },
    { offset: '30%', color: '#E1306C' },
    { offset: '55%', color: '#C13584' },
    { offset: '75%', color: '#833AB4' },
    { offset: '100%', color: '#405DE6' },
  ],
} as const;
