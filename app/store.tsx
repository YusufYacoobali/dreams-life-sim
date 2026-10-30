import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { Header, Page } from '../src/ui/components';
import { PurchaseOptions } from '../src/purchases/PurchaseUI';
import { purchases } from '../src/purchases/native';
import { usePurchases } from '../src/purchases/hooks';
import { trackPurchase } from '../src/purchases/analytics';
export default function DreamsStore() {
  const busy = usePurchases(s => s.busy);
  useEffect(() => { trackPurchase({ name: 'store_opened', trigger: 'store', ownership: purchases.getState().ownership }); }, []);
  return <Page bottomSafeArea><Header title="Dreams Store" onBack={() => router.back()} backDisabled={busy} /><PurchaseOptions trigger="store" /></Page>;
}
