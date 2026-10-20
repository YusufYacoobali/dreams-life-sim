export type ProgressCategory = 'life' | 'career' | 'wealth' | 'special';
export type ProgressArt = 'school' | 'study' | 'work' | 'hobby' | 'pet' | 'rings' | 'travel' | 'money' | 'trophy';
export type ProgressRoute = '/school' | '/education' | '/work' | '/hobbies' | '/pets' | '/family' | '/travel' | '/bank' | '/special-careers' | '/scholarships' | '/coworkers' | '/business' | '/creators' | '/royalty';
export type ProgressFacts = {
  schoolReports: number; highReports: number; acceptedHelp: number; clubMonths: number;
  secondaryQualifications: number; furtherQualifications: number; workMonths: number;
  hobbyMonths: number; hobbyProficiency: number; petCareMonths: number; marriages: number;
  completedTrips: number; destinationCountries: number; repaymentMonths: number; completedProjects: number;
  tuitionWaivers: number; completedScholarships: number; acceptedFeedback: number; acceptedRaises: number;
  pensionPeriods: number; hobbyKindsPractised: number; children: number; foundedBusinesses: number;
  profitMonths: number; profitableBusinesses: number; repaidPersonalLoans: number;
  actorProjects: number; modelProjects: number; athleteProjects: number; musicianProjects: number; politicianProjects: number;
  militaryAssignments: number; spaceAssignments: number; youtuberPosts: number; streamerBroadcasts: number;
  creatorPosts: number; liveMinutes: number; royalEngagements: number; awardedProjects: number;
};
export type GoalDefinition = { id: keyof ProgressFacts; label: string; target: number; unit: string; route: ProgressRoute };
export type ProgressGoal = GoalDefinition & { value: number; complete: boolean; percent: number };
export type AchievementDefinition = { id: string; title: string; description: string; category: ProgressCategory; art: ProgressArt; goal: GoalDefinition };
export type Achievement = Omit<AchievementDefinition, 'goal'> & { goal: ProgressGoal; complete: boolean };
export type ChallengeDefinition = { id: string; title: string; description: string; difficulty: 'easy' | 'medium' | 'hard'; art: ProgressArt; goals: readonly GoalDefinition[] };
export type Challenge = Omit<ChallengeDefinition, 'goals'> & { goals: ProgressGoal[]; complete: boolean; percent: number };

