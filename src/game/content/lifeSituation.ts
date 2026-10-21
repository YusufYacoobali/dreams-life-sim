import { storyOption, type EventTemplate, type StoryOption } from './eventTypes';
type Bonds = Pick<StoryOption, 'childBond' | 'petBond' | 'friendBond' | 'partnerBond' | 'coworkerBond' | 'supervisorBond'>;
type Branch = readonly [id: string, label: string, changes: StoryOption['changes'], title: string, result: string, journal: string, bonds?: Bonds];
/** Compact authoring syntax; every setup and branch remains an authored situation. */
export function situation(id: string, title: string, body: string, branches: readonly Branch[], context: Partial<Pick<EventTemplate, 'min' | 'max' | 'rarity' | 'illustration' | 'local' | 'child' | 'home' | 'pet' | 'hobby' | 'visited' | 'chronicCondition' | 'specialCareer' | 'workplace' | 'coworker' | 'supervisor' | 'friend' | 'partner' | 'study' | 'retired' | 'widowed'>> = {}): EventTemplate {
  return { id, title, body, min: 18, max: 120, local: true, illustration: 'journal', ...context,
    choices: branches.map(([choiceId, label, changes, resultTitle, result, journal, bonds]) => storyOption(choiceId, label, changes, resultTitle, result, journal, undefined, bonds)),
  };
}
