import type { Effect } from '../runtime';
import type { SkillId } from './careers';
export type StoryStat = Extract<Effect, { kind: 'stat' }>['stat'];
export type StoryOption = {
  id: string; label: string; changes: Partial<Record<StoryStat, number>>; bond?: number;
  peerBond?: number; teacherBond?: number; grades?: number; skill?: { id: SkillId; delta: number };
  title: string; result: string; journal: string;
};
export type EventTemplate = {
  id: string; min: number; max: number; parent?: boolean;
  school?: 'primary' | 'secondary' | 'any'; classmate?: boolean; teacher?: boolean;
  illustration: string; title: string; body: string; choices: readonly StoryOption[];
};
export const storyOption = (id: string, label: string, changes: StoryOption['changes'], title: string, result: string, journal: string, bond?: number, extra: Pick<StoryOption, 'peerBond' | 'teacherBond' | 'grades' | 'skill'> = {}): StoryOption => ({ id, label, changes, title, result, journal, bond, ...extra });
