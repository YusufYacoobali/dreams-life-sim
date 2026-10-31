import React from 'react';
import type { OutingKind } from '../game/content/leisure';
import { PetsLeisureArt } from './PetsLeisureArt';
import { LifestyleSymbol } from './LifestyleSymbol';
export function OutingArt({ kind, size = 40 }: {
    kind: OutingKind;
    size?: number;
}) { if (kind === 'cinema' || kind === 'concert' || kind === 'museum' || kind === 'nightclub')
    return <PetsLeisureArt id={kind} size={size}/>; const icons = { theatre: 'ticket-outline', comedy: 'mic-outline', park: 'leaf-outline', aquarium: 'fish-outline', sports: 'football-outline', festival: 'musical-notes-outline' } as const; return <LifestyleSymbol name={icons[kind]} size={size}/>; }
