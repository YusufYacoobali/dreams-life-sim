/** Authored immediate industry incidents. Effects are applied to recorded career state. */
export type CreativeImpact = {
  reputation?: number; quality?: number; publicity?: number; relationship?: number;
  stress?: number; health?: number; publicImage?: number; portfolio?: number;
  payBps?: number; costBps?: number; commissionBps?: number; agencyRisk?: number;
  opportunity?: number; obligation?: number; leaveAgency?: boolean;
};
export type CreativeStory = {
  id: string; title: string; body: string;
  contact: 'agent' | 'director' | 'costar' | 'rival' | 'designer' | 'photographer';
  phase: 'working' | 'between' | 'any';
  requiresAgency?: boolean; requiresExclusive?: boolean; minCredits?: number; categories?: readonly string[];
  portfolioArea?: 'editorial' | 'runway' | 'commercial' | 'luxury' | 'lifestyle';
  choices: readonly [CreativeStoryChoice, CreativeStoryChoice, CreativeStoryChoice];
};
export type CreativeStoryChoice = { id: string; label: string; result: string; journal: string; impact: CreativeImpact };
