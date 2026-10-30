import type { World } from '../model';
/** Legacy detailed projects never change; completed new projects retain compact factual history. */
export function compactCreativeHistory(career: World['careers'][number]) {
  const completed = career.projects.filter(project => project.creative && project.status !== 'active');
  if (completed.length <= 48) return;
  const keep = new Set(completed.slice(-48).map(project => project.id)), removed = new Set<string>();
  career.creativeArchives ??= [];
  for (const project of completed) {
    if (keep.has(project.id)) continue;
    const { periods, ...record } = project;
    career.creativeArchives.push({ ...record, periodCount: periods.length, attendedPeriods: periods.filter(period => period.attended).length, scoreSum: periods.reduce((sum, period) => sum + period.score, 0) });
    removed.add(project.id);
  }
  career.projects = career.projects.filter(project => !removed.has(project.id));
  const industry = career.actor?.industry ?? career.modelCareer?.industry;
  if (industry) industry.archivedProjects += removed.size;
}
