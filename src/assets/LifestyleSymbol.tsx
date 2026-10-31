import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColors } from '../ui/theme';
export function LifestyleSymbol({ name, size = 40 }: {
    name: React.ComponentProps<typeof Ionicons>['name'];
    size?: number;
}) { const c = useColors(); return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: c.inset }}><Ionicons name={name} size={size * 0.65} color={c.muted}/></View>; }
