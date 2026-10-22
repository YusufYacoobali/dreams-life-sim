// Review the bundled native asset using Lottie's browser reference renderer.
// This is visual evidence, not a measurement of Android/iOS frame delivery.
import React from 'react';
import lottie from 'lottie-web';
import { DURATION, FPS, type CinematicKind } from '../../src/ui/cinematic/cinematicTiming';

export function ReviewInk({ kind }: { kind: CinematicKind }) {
  const container = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const animation = lottie.loadAnimation({ container: container.current!, renderer: 'svg', loop: false, autoplay: false, path: `/${kind}.json`, rendererSettings: { preserveAspectRatio: 'xMidYMid slice', progressiveLoad: false } });
    animation.addEventListener('DOMLoaded', () => {
      Object.assign(window, {
        seek: (time: number) => animation.goToAndStop(Math.min(time, DURATION[kind]) * FPS / 1000, true),
        play: () => { animation.goToAndPlay(0, true); },
        duration: DURATION[kind], ready: true,
      });
    });
    animation.addEventListener('data_failed', () => { throw Error(`Could not decode ${kind} asset`); });
    return () => animation.destroy();
  }, [kind]);
  return <div ref={container} style={{ position: 'absolute', inset: 0 }} />;
}
