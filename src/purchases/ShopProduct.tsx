import React from 'react';
import { CareerArt } from '../assets/CareerArt';
import { CultArt } from '../assets/CultArt';
import { HealthLegalArt } from '../assets/HealthLegalArt';
import { Illustration } from '../assets/Illustration';
import { PolishArt } from '../assets/PolishArt';
import type { ProductId } from './catalog';

/** Presentation only. Product IDs, prices and ownership remain in the purchase service. */
export const shopContent = {
  'dreams.full_unlock': { title: 'Full Unlock', description: 'Unlock every premium career, God Mode and Time Machine forever.', benefits: ['All Premium Careers', 'God Mode', 'Time Machine'] },
  'dreams.career_pass': { title: 'All Career Packs', description: 'Every premium career in one bundle.', benefits: ['Athlete and Astronaut careers', 'Military and Cult Leader careers', 'Permanent access across every life'] },
  'dreams.time_machine': { title: 'Time Machine', description: 'Go back and change your choices.', benefits: ['Restore saved checkpoints', 'Create new timeline branches', 'Unlimited restores across every life'] },
  'dreams.god_mode': { title: 'God Mode', description: 'Customise your life your way.', benefits: ['Edit money, stats and skills', 'Adjust your relationships', 'Choose a Royal Family birth'] },
  'dreams.athlete': { title: 'Athlete Career', description: 'From team tryouts to a career in sport.', benefits: ['Try out for professional teams', 'Sign contracts and compete in seasons', 'Train and improve your match performance'] },
  'dreams.astronaut': { title: 'Astronaut Career', description: 'Train for a life in space research.', benefits: ['Join a space programme', 'Train and earn your qualifications', 'Complete missions and earn distinctions'] },
  'dreams.military': { title: 'Military Career', description: 'Build a career in the armed forces.', benefits: ['Train for military service', 'Choose a branch and serve on contract', 'Take assignments and progress in rank'] },
  'dreams.cult': { title: 'Cult Leader', description: 'Build a following around your beliefs.', benefits: ['Found a cult and choose its beliefs', 'Recruit followers and build headquarters', 'Lead ceremonies and manage communal funds'] },
} as const satisfies Record<ProductId, { title: string; description: string; benefits: readonly [string, string, string] }>;
export const paidCareers = ['dreams.athlete', 'dreams.astronaut', 'dreams.military', 'dreams.cult'] as const;
export function ShopProductArt({ id, size = 48 }: { id: ProductId; size?: number }) {
  if (id === 'dreams.full_unlock') return <CareerArt id="royalty" size={size} />;
  if (id === 'dreams.career_pass') return <Illustration id="career" size={size} />;
  if (id === 'dreams.time_machine') return <HealthLegalArt id="rewind" size={size} />;
  if (id === 'dreams.god_mode') return <PolishArt id="life-star" size={size} />;
  if (id === 'dreams.cult') return <CultArt id="cult" size={size} />;
  return <CareerArt id={id === 'dreams.athlete' ? 'athlete' : id === 'dreams.astronaut' ? 'astronaut' : 'military'} size={size} />;
}
