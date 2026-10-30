import { useEffect } from 'react';
import { AppState } from 'react-native';
import { purchases } from './native';
export function PurchaseLifecycle() {
  useEffect(() => {
    void purchases.getState().initialize();
    const listener = AppState.addEventListener('change', next => { if (next === 'active') void purchases.getState().refresh(); });
    return () => { listener.remove(); };
  }, []);
  return null;
}
