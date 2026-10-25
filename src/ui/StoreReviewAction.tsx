import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { openStoreReview, reviewStoreUrl } from '../reviews/nativeReview';
import { Body, Button, Card, Heading } from './components';

/** An explicit route to the store remains available when native quotas hide a sheet. */
export function StoreReviewAction() {
  const [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const opening = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  if (!reviewStoreUrl()) return null;
  const open = async () => {
    if (opening.current || !mounted.current) return;
    opening.current = true; setBusy(true); setError(false);
    try {
      const opened = await openStoreReview(() => mounted.current);
      if (mounted.current) setError(!opened);
    } finally { opening.current = false; if (mounted.current) setBusy(false); }
  };
  return <Card><Heading size={19}>Support Dreams</Heading>
    <Body>Open {Platform.OS === 'android' ? 'Google Play' : 'the App Store'} to leave a review.</Body>
    <Button label="Rate Dreams" disabled={busy} onPress={() => { void open(); }} />
    {error && <Body>The store could not be opened. Please try again.</Body>}
  </Card>;
}
