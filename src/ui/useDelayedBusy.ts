import { useEffect, useState } from 'react';

/** Keep quick actions from flashing a spinner or changing the control's layout. */
export function useDelayedBusy(busy: boolean) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!busy) { setVisible(false); return; }
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, [busy]);
  return busy && visible;
}
