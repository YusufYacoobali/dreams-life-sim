import React from 'react';
import { View, useWindowDimensions, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The SVG uses a uniform viewBox: sprites and hit targets share one coordinate
// system on phones/tablets, including when accessibility text makes it scroll.
export function SceneCanvas({
  children,
  controlsHeight,
  ...props
}: ViewProps & { controlsHeight: number }) {
  const viewport = useWindowDimensions(),
    insets = useSafeAreaInsets();
  return (
    <View
      {...props}
      style={{
        height: Math.max(
          270,
          viewport.height -
            insets.top -
            insets.bottom -
            100 -
            controlsHeight * Math.max(1, viewport.fontScale),
        ),
        width: '100%',
        maxWidth: 620,
        alignSelf: 'center',
      }}
    >
      {children}
    </View>
  );
}
