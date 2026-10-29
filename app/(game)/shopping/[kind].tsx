import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AssetCatalogue } from '../../../src/ui/AssetCatalogue';
export default function Shopping() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  return <AssetCatalogue kind={kind} />;
}
