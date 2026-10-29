export const skillIds = ['acting', 'music', 'sport', 'politics', 'modeling', 'content', 'science', 'service'] as const;
export type SkillId = typeof skillIds[number];
export const skillContent: Record<SkillId, {
    title: string;
    minAge: number;
    art: 'stage' | 'musician' | 'training' | 'politician' | 'model' | 'video' | 'science' | 'military';
}> = {
    acting: { title: 'Acting', minAge: 6, art: 'stage' }, music: { title: 'Music', minAge: 6, art: 'musician' }, sport: { title: 'Athletics', minAge: 6, art: 'training' }, politics: { title: 'Public Speaking', minAge: 16, art: 'politician' }, modeling: { title: 'Modelling', minAge: 16, art: 'model' }, content: { title: 'Content Production', minAge: 13, art: 'video' }, science: { title: 'Space Science', minAge: 10, art: 'science' }, service: { title: 'Service Training', minAge: 16, art: 'military' },
};
export const careerKinds = ['actor', 'model', 'athlete', 'musician', 'politician'] as const;
export type CareerKind = typeof careerKinds[number];
type CareerDefinition = {
    title: string;
    skill: SkillId;
    threshold: number;
    roleId: string;
    minAge: number;
    maxAge: number;
    health: number;
    fitness: number;
    looks: number;
    smarts: number;
    period: number;
    contractMonths: number;
    art: CareerKind;
    projects: readonly string[];
};
/** Shared authored selection/contract rules, not national employment law. */
export const careerCatalog: Record<CareerKind, CareerDefinition> = {
    actor: { title: 'Actor', skill: 'acting', threshold: 40, roleId: 'screen-actor', minAge: 18, maxAge: 85, health: 30, fitness: 0, looks: 20, smarts: 30, period: 6, contractMonths: 6, art: 'actor', projects: ['The Last Bus Home', 'A Perfectly Normal Tuesday', 'Somewhere Near Tomorrow', 'The Spare Key'] },
    model: { title: 'Model', skill: 'modeling', threshold: 40, roleId: 'fashion-model', minAge: 18, maxAge: 75, health: 35, fitness: 30, looks: 60, smarts: 20, period: 3, contractMonths: 3, art: 'model', projects: ['New Season, Old Streets', 'Everyday in Colour', 'The Unhurried Collection', 'City Light Editorial'] },
    athlete: { title: 'Athlete', skill: 'sport', threshold: 60, roleId: 'professional-athlete', minAge: 18, maxAge: 40, health: 60, fitness: 70, looks: 0, smarts: 25, period: 12, contractMonths: 36, art: 'athlete', projects: ['League Season'] },
    musician: { title: 'Musician', skill: 'music', threshold: 45, roleId: 'performing-musician', minAge: 18, maxAge: 85, health: 30, fitness: 0, looks: 0, smarts: 25, period: 3, contractMonths: 3, art: 'musician', projects: ['The Late Set', 'Back Row Tour', 'Small Room Circuit', 'Summer Sessions'] },
    politician: { title: 'Politician', skill: 'politics', threshold: 50, roleId: 'elected-councillor', minAge: 21, maxAge: 80, health: 40, fitness: 0, looks: 0, smarts: 45, period: 12, contractMonths: 48, art: 'politician', projects: ['Constituency Service'] },
};
