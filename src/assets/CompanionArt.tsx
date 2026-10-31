import { LifestylePetArt } from './LifestylePetArt';
import React from 'react';
import type { PetSpecies } from '../game/content/pets';
import { PolishArt } from './PolishArt';
/** Reuse existing portraits; new domestic species have separate matching portraits. */
export function CompanionArt({ species, memorial = false, size = 40 }: {
    species: PetSpecies;
    memorial?: boolean;
    size?: number;
}) { if (memorial)
    return <PolishArt id="pet-memorial" size={size}/>; if (species === 'dog' || species === 'cat' || species === 'rabbit')
    return <PolishArt id={`pet-${species}`} size={size}/>; if (species === 'parrot')
    return <PolishArt id="pet-bird" size={size}/>; return <LifestylePetArt id={species} size={size}/>; }
