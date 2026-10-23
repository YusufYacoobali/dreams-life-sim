import { AccessibilityInfo } from 'react-native';

let lastTarget: number | null = null;
export const modalReturnTarget = () => lastTarget;
export function rememberModalReturnTarget(event: unknown) {
  const target = (event as { nativeEvent?: { target?: unknown } } | undefined)
    ?.nativeEvent?.target;
  if (typeof target === 'number') lastTarget = target;
}
export function restoreModalFocus(target: number | null) {
  if (target !== null) {
    try {
      AccessibilityInfo.setAccessibilityFocus(target);
    } catch {
      /* Optional native accessibility boundary. */
    }
  }
}
