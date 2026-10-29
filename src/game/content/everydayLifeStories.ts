import type { EventTemplate } from './eventTypes';
import { ordinaryAdultTemplates } from './ordinaryAdultStories';
import { parentingTemplates } from './parentingStories';
import { homeLifeTemplates } from './homeLifeStories';
import { wellbeingTemplates } from './wellbeingStories';
import { specialCareerTemplates } from './specialCareerStories';
import { petLifeTemplates } from './petLifeStories';
import { hobbyLifeTemplates } from './hobbyLifeStories';
import { travelMemoryTemplates } from './travelMemoryStories';
import { laterLifeTemplates } from './laterLifeStories';
import { workingLifeTemplates } from './workingLifeStories';

/** Context-bound situations. System acknowledgements and interviews are excluded. */
export const everydayLifeTemplates: readonly EventTemplate[] = [
  ...ordinaryAdultTemplates, ...parentingTemplates, ...homeLifeTemplates,
  ...wellbeingTemplates, ...specialCareerTemplates, ...petLifeTemplates,
  ...hobbyLifeTemplates, ...travelMemoryTemplates, ...laterLifeTemplates,
  ...workingLifeTemplates,
];
