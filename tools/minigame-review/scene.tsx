import React from 'react';
import { createRoot } from 'react-dom/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../src/ui/theme';
import { FeedbackProvider } from '../../src/ui/feedback';
import { MiniGamePlayground } from '../../src/minigames/MiniGamePlayground';
const reduced = new URLSearchParams(location.search).get('motion') === 'reduce';
const appearance = process.env.DREAMS_REVIEW_APPEARANCE === 'light' ? 'light' : 'dark';
createRoot(document.getElementById('root')!).render(
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: innerWidth, height: innerHeight },
      insets: { top: 24, bottom: 20, left: 0, right: 0 },
    }}
  >
    <ThemeProvider appearance={appearance}>
      <FeedbackProvider
        reducedMotion={reduced}
        haptics={false}
        onButtonFeedback={async () => {}}
        soundEffects={false}
      >
        <MiniGamePlayground />
      </FeedbackProvider>
    </ThemeProvider>
  </SafeAreaProvider>,
);
