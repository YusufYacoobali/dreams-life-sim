import { situation } from './lifeSituation';

/** One original harmless comic misunderstanding; no people or rewards are created. */
export const rareAdultTemplates = [
  situation('adult-accidental-living-exhibit', 'The exhibit is waiting for directions', 'At a free community art display, you stop beside an empty display stand to read a map. Someone asks how long your ‘human stillness piece’ lasts. Two more visitors stop to watch. You were trying to find the exit.', [
    ['explain', 'Explain you are just reading the map', { respect: 3, stress: -2 }, 'A useful clarification', 'You explain the mistake. The visitors laugh with you, then point towards the exit. You leave as a visitor rather than an installation.', 'I was briefly mistaken for an art exhibit while looking for the exit.'],
    ['pose', 'Hold the pose for ten seconds, then explain', { happiness: 4, respect: 1, energy: -2 }, 'A very short exhibition', 'You stay still for a moment, give a tiny bow and explain. The small misunderstanding ends with a few amused claps.', 'I played along briefly when visitors mistook me for an art exhibit, then explained.'],
    ['lecture', 'Invent a long artistic explanation', { respect: -3, stress: 4, energy: -2 }, 'The explanation needs an exit too', 'A simple question about the supposed work leaves you inventing another answer. You eventually admit that you were only reading the map.', 'I made an accidental art misunderstanding harder by pretending it was deliberate.'],
  ], { min: 18, max: 120, local: true, rarity: 'extremely-rare', illustration: 'journal' }),
];
