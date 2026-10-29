import { situation } from './lifeSituation';

/** One original harmless comic misunderstanding; no people or rewards are created. */
export const rareAdultTemplates = [
  situation('adult-accidental-living-exhibit', 'The exhibit is waiting for directions', 'At a free community art display, you stop beside an empty display stand to read a map. Someone asks how long your ‘human stillness piece’ lasts. Two more visitors stop to watch. You were trying to find the exit.', [
    ['explain', 'Explain you are just reading the map', { respect: 3, stress: -2 }, 'A useful clarification', 'You explain the mistake. The visitors laugh with you, then point towards the exit. You leave as a visitor rather than an installation.', 'I was briefly mistaken for an art exhibit while looking for the exit.'],
    ['pose', 'Hold the pose for ten seconds, then explain', { happiness: 4, respect: 1, energy: -2 }, 'A very short exhibition', 'You stay still for a moment, give a tiny bow and explain. The small misunderstanding ends with a few amused claps.', 'I played along briefly when visitors mistook me for an art exhibit, then explained.'],
    ['lecture', 'Claim the piece explores the death of meaning', { respect: -3, stress: 4, energy: -2 }, 'Meaning dies on schedule', 'Someone asks whether the map is part of the piece. You say everything is part of the piece, including your urgent need to find a toilet.', 'I pretended to be an art installation while trying to find the exit.'],
  ], { min: 18, max: 120, local: true, rarity: 'extremely-rare', illustration: 'journal' }),
];
