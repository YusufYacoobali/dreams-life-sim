import type { Effect } from '../runtime';
import type { SkillId } from './careers';
import type { StoryKind } from '../systems/storySchemas';
import type { HobbyKind } from './leisure';
import type { PetSpecies } from './pets';
export type StoryChildGroup = 'baby' | 'young' | 'teen' | 'adult';
export type EventRarity = 'common' | 'uncommon' | 'rare' | 'extremely-rare';
export type StoryStat = Extract<Effect, { kind: 'stat' }>['stat'];
export type StoryOption = {
  id: string; label: string; changes: Partial<Record<StoryStat, number>>; bond?: number;
  peerBond?: number; teacherBond?: number; coworkerBond?: number; supervisorBond?: number; friendBond?: number; partnerBond?: number; childBond?: number; petBond?: number; grades?: number; skill?: { id: SkillId; delta: number }; followUp?: StoryKind;
  title: string; result: string; journal: string;
};
export type EventTemplate = {
  id: string; min: number; max: number; rarity?: EventRarity; parent?: boolean; parentContact?: boolean;
  school?: 'primary' | 'secondary' | 'any'; classmate?: boolean; teacher?: boolean;
  workplace?: boolean; coworker?: boolean; supervisor?: boolean;
  friend?: boolean; partner?: boolean;
  local?: boolean; child?: StoryChildGroup; home?: boolean; pet?: PetSpecies | 'any'; hobby?: HobbyKind | 'any'; visited?: boolean; chronicCondition?: boolean; specialCareer?: 'actor' | 'model' | 'athlete' | 'musician' | 'politician' | 'creator' | 'youtuber' | 'streamer' | 'business' | 'military' | 'astronaut' | 'royalty';
  illustration: string; title: string; body: string; choices: readonly StoryOption[];
};
export const storyOption = (id: string, label: string, changes: StoryOption['changes'], title: string, result: string, journal: string, bond?: number, extra: Pick<StoryOption, 'peerBond' | 'teacherBond' | 'coworkerBond' | 'supervisorBond' | 'friendBond' | 'partnerBond' | 'childBond' | 'petBond' | 'grades' | 'skill' | 'followUp'> = {}): StoryOption => ({ id, label, changes, title, result, journal, bond, ...extra });
