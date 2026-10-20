import type { World } from '../game/model';
import { destinations } from '../game/content/travel';

export type ProgressCategory = 'life' | 'career' | 'wealth' | 'special';
export type ProgressArt = 'school' | 'study' | 'work' | 'hobby' | 'pet' | 'rings' | 'travel' | 'money' | 'trophy';
export type ProgressRoute = '/school' | '/education' | '/work' | '/hobbies' | '/pets' | '/family' | '/travel' | '/bank' | '/special-careers';
export type ProgressFacts = {
  schoolReports: number; highReports: number; acceptedHelp: number; clubMonths: number;
  secondaryQualifications: number; furtherQualifications: number; workMonths: number;
  hobbyMonths: number; hobbyProficiency: number; petCareMonths: number; marriages: number;
  completedTrips: number; destinationCountries: number; repaymentMonths: number; completedProjects: number;
};
type GoalDefinition = { id: keyof ProgressFacts; label: string; target: number; unit: string; route: ProgressRoute };
export type ProgressGoal = GoalDefinition & { value: number; complete: boolean; percent: number };
type AchievementDefinition = { id: string; title: string; description: string; category: ProgressCategory; art: ProgressArt; goal: GoalDefinition };
export type Achievement = Omit<AchievementDefinition, 'goal'> & { goal: ProgressGoal; complete: boolean };
type ChallengeDefinition = { id: string; title: string; description: string; difficulty: 'easy' | 'medium' | 'hard'; art: ProgressArt; goals: readonly GoalDefinition[] };
export type Challenge = Omit<ChallengeDefinition, 'goals'> & { goals: ProgressGoal[]; complete: boolean; percent: number };

const achievements: readonly AchievementDefinition[] = [
  { id: 'first-report', title: 'Report Day', description: 'Receive your first school-year report.', category: 'life', art: 'school', goal: { id: 'schoolReports', label: 'Receive a school-year report', target: 1, unit: 'reports', route: '/school' } },
  { id: 'secondary-graduate', title: 'High School Graduate', description: 'Earn a secondary-school qualification.', category: 'life', art: 'study', goal: { id: 'secondaryQualifications', label: 'Earn a secondary-school qualification', target: 1, unit: 'qualifications', route: '/education' } },
  { id: 'further-study', title: 'Further Study', description: 'Complete trade, university or graduate study.', category: 'career', art: 'study', goal: { id: 'furtherQualifications', label: 'Earn a trade, degree, medicine or law qualification', target: 1, unit: 'qualifications', route: '/education' } },
  { id: 'first-job', title: 'First Job', description: 'Complete a working month in a recorded job.', category: 'career', art: 'work', goal: { id: 'workMonths', label: 'Complete a month of work', target: 1, unit: 'working months', route: '/work' } },
  { id: 'working-decade', title: 'A Working Decade', description: 'Build ten years of recorded working months.', category: 'career', art: 'work', goal: { id: 'workMonths', label: 'Complete 120 working months across your jobs', target: 120, unit: 'working months', route: '/work' } },
  { id: 'hobby-year', title: 'A Year of Practice', description: 'Attend twelve months of one hobby routine.', category: 'life', art: 'hobby', goal: { id: 'hobbyMonths', label: 'Attend twelve months of the same hobby', target: 12, unit: 'attended months', route: '/hobbies' } },
  { id: 'hobby-fifty', title: 'Finding Your Rhythm', description: 'Reach 50 proficiency in a personal hobby.', category: 'special', art: 'trophy', goal: { id: 'hobbyProficiency', label: 'Reach 50 proficiency in one hobby', target: 50, unit: 'proficiency points', route: '/hobbies' } },
  { id: 'pet-year', title: 'A Year of Care', description: 'Arrange twelve funded care months for a pet you adopted.', category: 'life', art: 'pet', goal: { id: 'petCareMonths', label: 'Complete twelve funded care months for an adopted pet', target: 12, unit: 'care months', route: '/pets' } },
  { id: 'wedding-day', title: 'Wedding Day', description: 'Have a marriage in your life history.', category: 'life', art: 'rings', goal: { id: 'marriages', label: 'Get married', target: 1, unit: 'marriages', route: '/family' } },
  { id: 'world-traveller', title: 'World Traveller', description: 'Complete trips to ten different countries.', category: 'special', art: 'travel', goal: { id: 'destinationCountries', label: 'Complete trips to ten destination countries', target: 10, unit: 'destination countries', route: '/travel' } },
  { id: 'repayment-year', title: 'Keeping Your Word', description: 'Make debt repayments in twelve different months.', category: 'wealth', art: 'money', goal: { id: 'repaymentMonths', label: 'Repay debt in twelve distinct months', target: 12, unit: 'repayment months', route: '/bank' } },
  { id: 'professional-project', title: 'The Finished Work', description: 'Finish an acting, modelling, athletics, music or political career project.', category: 'career', art: 'trophy', goal: { id: 'completedProjects', label: 'Complete a project in an Actor, Model, Athlete, Musician or Politician career', target: 1, unit: 'completed projects', route: '/special-careers' } },
];

const challenges: readonly ChallengeDefinition[] = [
  { id: 'school-confidence', title: 'School Confidence', description: 'Find support, build a school routine and earn a strong report.', difficulty: 'easy', art: 'school', goals: [
    { id: 'highReports', label: 'Receive a school report with grades of at least 80%', target: 1, unit: 'strong reports', route: '/school' },
    { id: 'acceptedHelp', label: 'Have a teacher agree to an academic-help session', target: 1, unit: 'accepted sessions', route: '/school' },
    { id: 'clubMonths', label: 'Attend a school club during twelve school months', target: 12, unit: 'club months', route: '/school' },
  ] },
  { id: 'care-and-craft', title: 'Care and Craft', description: 'Keep up pet care and develop a personal interest as the months pass.', difficulty: 'medium', art: 'pet', goals: [
    { id: 'petCareMonths', label: 'Complete twelve funded care months for a pet you adopted', target: 12, unit: 'care months', route: '/pets' },
    { id: 'hobbyProficiency', label: 'Reach 50 proficiency in one hobby', target: 50, unit: 'proficiency points', route: '/hobbies' },
  ] },
  { id: 'work-and-life', title: 'Work and Life', description: 'Finish further study, build a working history and keep a hobby growing.', difficulty: 'hard', art: 'work', goals: [
    { id: 'furtherQualifications', label: 'Earn a trade, university or graduate qualification', target: 1, unit: 'qualifications', route: '/education' },
    { id: 'workMonths', label: 'Complete ten years of actual working months', target: 120, unit: 'working months', route: '/work' },
    { id: 'hobbyProficiency', label: 'Reach 100 proficiency in one hobby', target: 100, unit: 'proficiency points', route: '/hobbies' },
  ] },
  { id: 'world-explorer', title: 'World Explorer', description: 'Finish three trips across three different destination countries.', difficulty: 'medium', art: 'travel', goals: [
    { id: 'completedTrips', label: 'Complete three full trips', target: 3, unit: 'completed trips', route: '/travel' },
    { id: 'destinationCountries', label: 'Visit three destination countries on completed trips', target: 3, unit: 'destination countries', route: '/travel' },
  ] },
];

/** Read existing history only. No awards, timers, RNG, money or simulation writes. */
export function progressFacts(world: World, personId = world.activePersonId): ProgressFacts | null {
  const person = world.people[personId];
  if (!person) return null;
  const schools = world.schoolCommunities.filter(item => item.personId === personId);
  const reports = schools.flatMap(item => item.exams);
  const hobbies = world.hobbies.filter(item => item.personId === personId);
  const trips = world.trips.filter(item => item.status === 'completed' && item.participantIds.includes(personId));
  const repaymentMonths = new Set<number>();
  // Count the payer recorded on each actual repayment, even if ownership of a
  // liability changes later. Multiple payments in one month count once.
  for (const row of world.ledger) {
    if (row.personId === personId && row.category === 'repayment' && row.liabilityId && row.cashDelta < 0n && row.debtDelta < 0n) repaymentMonths.add(row.year * 12 + row.month - 1);
  }
  return {
    schoolReports: reports.length,
    highReports: reports.filter(item => item.grade >= 80).length,
    acceptedHelp: schools.reduce((sum, school) => sum + school.help.filter(item => item.accepted).length, 0),
    clubMonths: new Set(schools.flatMap(school => school.periods.filter(item => item.club !== 'none').map(item => item.month))).size,
    secondaryQualifications: person.education.qualifications.filter(item => item.level === 'secondary').length,
    furtherQualifications: person.education.qualifications.filter(item => item.level !== 'secondary').length,
    workMonths: world.workHistory.filter(item => item.personId === personId).reduce((sum, item) => sum + item.monthsWorked, 0),
    hobbyMonths: Math.max(0, ...hobbies.map(item => item.practices.filter(row => row.source === 'monthly' && row.attended).length)),
    hobbyProficiency: Math.max(0, ...hobbies.map(item => item.proficiency)),
    petCareMonths: Math.max(0, ...world.pets.filter(item => item.adoptedById === personId).map(item => item.periods.filter(period => period.care !== 'unfunded').length)),
    marriages: world.marriages.filter(item => item.a === personId || item.b === personId).length,
    completedTrips: trips.length,
    destinationCountries: new Set(trips.map(item => destinations[item.destinationId].country)).size,
    repaymentMonths: repaymentMonths.size,
    completedProjects: world.careers.filter(item => item.personId === personId).reduce((sum, item) => sum + item.projects.filter(project => project.status === 'completed').length, 0),
  };
}

export function lifeProgress(world: World, personId = world.activePersonId) {
  const facts = progressFacts(world, personId);
  if (!facts) return null;
  const goal = (definition: GoalDefinition): ProgressGoal => ({ ...definition, value: facts[definition.id], complete: facts[definition.id] >= definition.target, percent: Math.min(100, facts[definition.id] / definition.target * 100) });
  return {
    personId, facts,
    achievements: achievements.map((item): Achievement => { const progress = goal(item.goal); return { ...item, goal: progress, complete: progress.complete }; }),
    challenges: challenges.map((item): Challenge => { const goals = item.goals.map(goal); return { ...item, goals, complete: goals.every(item => item.complete), percent: goals.reduce((sum, item) => sum + item.percent, 0) / goals.length }; }),
  };
}

/** The collection contains currently owned, directly inherited possessions. */
export const inheritedPossessions = (world: World, personId = world.activePersonId) => world.assets.filter(item => item.ownerId === personId && item.kind === 'possession' && (item.ownershipSource === 'inheritance' || item.ownershipSource === 'legacy'));
