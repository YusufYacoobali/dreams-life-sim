import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AssetOfferPage } from '../../../src/ui/AssetOfferDetails';
export default function Offer() {
  const { id, method } = useLocalSearchParams<{ id: string; method?: string }>();
  return <AssetOfferPage id={id} initialMethod={method === 'rent' || method === 'mortgage' ? method : 'cash'} />;
}
