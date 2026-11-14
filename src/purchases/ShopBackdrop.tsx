import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import type { BlurViewProps } from 'expo-blur';

function nativeBlur(): React.ComponentType<BlurViewProps> | null {
  // Older installed binaries can run this JS without the new native view.
  if (Platform.OS !== 'ios') return null;
  try {
    const { requireOptionalNativeModule } = require('expo-modules-core') as typeof import('expo-modules-core');
    if (!requireOptionalNativeModule('ExpoBlur')) return null;
    return require('expo-blur').BlurView;
  } catch { return null; }
}

class OptionalBlur extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

/** Native iOS blur is decorative; dimming remains available in every build. */
export function ShopBackdrop({ dark }: { dark: boolean }) {
  const Blur = useMemo(nativeBlur, []), [reduceTransparency, setReduceTransparency] = useState(true);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let live = true, changed = false, remove: (() => void) | undefined;
    try {
      const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', value => {
        changed = true; if (live) setReduceTransparency(value);
      });
      remove = () => subscription.remove();
    } catch { /* Missing native accessibility support keeps the dim fallback. */ }
    try {
      void AccessibilityInfo.isReduceTransparencyEnabled().then(value => {
        if (live && !changed) setReduceTransparency(value);
      }, () => {});
    } catch { /* Keep dimming when the platform cannot report its preference. */ }
    return () => { live = false; remove?.(); };
  }, []);
  return <View testID="shop-backdrop" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    {Blur && !reduceTransparency && <OptionalBlur><Blur testID="shop-native-blur" tint={dark ? 'dark' : 'light'} intensity={20} style={StyleSheet.absoluteFill} /></OptionalBlur>}
    <View testID="shop-backdrop-dim" style={[StyleSheet.absoluteFill, { backgroundColor: dark ? 'rgba(4, 7, 20, 0.38)' : 'rgba(10, 12, 35, 0.32)' }]} />
  </View>;
}
