import React from 'react';
import lottie from 'lottie-web';
export default function ReviewLottie({
  source,
  autoPlay,
  loop,
  style,
}: {
  source: any;
  autoPlay?: boolean;
  loop?: boolean;
  style?: any;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const animation = lottie.loadAnimation({
      container: ref.current!,
      renderer: 'svg',
      animationData: source,
      autoplay: autoPlay,
      loop: !!loop,
    });
    return () => animation.destroy();
  }, [source, autoPlay, loop]);
  return <div ref={ref} style={style} />;
}
