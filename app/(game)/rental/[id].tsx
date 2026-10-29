import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AssetOfferPage } from '../../../src/ui/AssetOfferDetails';
/** Existing lease links open the canonical property detail with Rent selected. */
export default function Rental() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AssetOfferPage id={id} initialMethod="rent" propertyOnly />;
}
