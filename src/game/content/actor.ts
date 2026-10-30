export const actorProjectTypes = ['independent-film', 'studio-film', 'series', 'theatre', 'commercial'] as const;
export type ActorProjectType = typeof actorProjectTypes[number];
export type ActorProjectDefinition = {
  id: ActorProjectType; label: string; titles: readonly string[]; genres: readonly string[];
  months: number; payBps: number; prestige: number; popularity: number; difficulty: number; risk: number;
  minSkill: number; minReputation: number; minAgency: 0 | 1 | 2; description: string;
};
export const actorProjectCatalog: readonly ActorProjectDefinition[] = [
  { id: 'independent-film', label: 'Independent Film', titles: ['The Landlord Knows', 'An Extremely Small Apocalypse', 'The Last Seat on Tuesday', 'Nobody Ordered the Swan'], genres: ['drama', 'dark comedy', 'mystery'], months: 6, payBps: 9000, prestige: 82, popularity: 36, difficulty: 35, risk: 40, minSkill: 40, minReputation: 0, minAgency: 0, description: 'Small budget, ambitious material. Critics may notice what the marketing department cannot afford.' },
  { id: 'studio-film', label: 'Studio Film', titles: ['Emergency Planet Seven', 'The Accountants Strike Back', 'Everything Must Explode', 'The Last Very Large Robot'], genres: ['action', 'adventure', 'science fiction'], months: 9, payBps: 45000, prestige: 43, popularity: 92, difficulty: 79, risk: 65, minSkill: 68, minReputation: 58, minAgency: 1, description: 'High contractual pay and a large audience, with heavy competition and a very public risk of failure.' },
  { id: 'series', label: 'Television & Streaming', titles: ['The Neighbours Have Receipts', 'Second Floor, Third Marriage', 'Municipal Secrets', 'A Quiet Place to Argue'], genres: ['drama', 'comedy', 'crime'], months: 12, payBps: 23000, prestige: 62, popularity: 79, difficulty: 61, risk: 35, minSkill: 55, minReputation: 42, minAgency: 1, description: 'A steady twelve-month engagement. The schedule leaves no room for another full-time production.' },
  { id: 'theatre', label: 'Theatre', titles: ['The Person in the Cupboard', 'Dinner for Everybody Except You', 'Three Chairs and a Divorce', 'The Understudy Has Opinions'], genres: ['classical drama', 'farce', 'musical'], months: 3, payBps: 6500, prestige: 91, popularity: 30, difficulty: 46, risk: 27, minSkill: 45, minReputation: 0, minAgency: 0, description: 'A short run with modest wages and exacting performance standards. There is nowhere to hide a missed cue.' },
  { id: 'commercial', label: 'Commercial Appearance', titles: ['The Biscuit That Understands', 'Obviously Expensive Water', 'A Car for Your Inner Accountant', 'The Mattress of Tomorrow'], genres: ['advertising', 'lifestyle', 'comedy'], months: 3, payBps: 20000, prestige: 18, popularity: 73, difficulty: 38, risk: 22, minSkill: 40, minReputation: 0, minAgency: 0, description: 'Strong short-term pay and exposure. The product receives most of the artistic freedom.' },
];
export const actorMilestoneLabels: Record<string, string> = {
  'first-role': 'First professional role', 'first-lead': 'First leading role', 'breakout': 'Breakout performance',
  'commercial-hit': 'Major commercial hit', 'first-nomination': 'First award nomination', 'acting-award': 'Lantern acting award',
  'established-star': 'Established star', 'career-collapse': 'Career collapse', 'comeback': 'Successful comeback',
};
export const actorStyleLabels = { versatile: 'Versatile professional', craft: 'Character and craft', popular: 'Audience favourite' } as const;
