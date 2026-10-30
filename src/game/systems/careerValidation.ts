import { validateCreativeCareers } from './creativeValidation';
import type { World } from '../model';
import { ageOn } from '../personHelpers';
import { countries } from '../countries';
import { careerCatalog, skillContent } from '../content/careers';
import { validateDopingChecks } from './athleteDopingValidation';
import { athleteSuspensionReason } from './athleteDopingSchemas';
const compare = (a: World['date'], b: World['date']) => a.year - b.year || a.month - b.month || a.day - b.day;
export function validateCareers(world: World) {
    const month = world.date.year * 12 + world.date.month - 1, ids = new Set<string>(), personKinds = new Set<string>(), activePeople = new Set<string>(), projectIds = new Set<string>(), histories = new Map(world.workHistory.map(item => [item.id, item])), gross = new Map<string, bigint>();
    for (const person of Object.values(world.people)) {
        const training = person.training;
        if (training && (person.died || compare(training.started, person.born) < 0 || compare(training.started, world.date) > 0 || training.lastMonth > month || training.lastMonth < training.started.year * 12 + training.started.month - 1 || training.currency !== countries[person.country].currency || ageOn({ ...person, died: null }, training.started) < skillContent[training.skill].minAge))
            throw new Error('Invalid skill training');
    }
    for (const career of world.careers) {
        const person = world.people[career.personId], definition = careerCatalog[career.kind], key = career.personId + ':' + career.kind, active = career.status === 'active', history = career.employmentId && histories.get(career.employmentId);
        if (ids.has(career.id) || personKinds.has(key) || !person || compare(career.started, person.born) < 0 || compare(career.started, world.date) > 0 || ageOn({ ...person, died: null }, career.started) < definition.minAge || career.currency !== countries[career.country].currency || career.lastMonth > month || career.lastMonth < career.started.year * 12 + career.started.month - 1 || new Set(career.contacts).size !== career.contacts.length || career.contacts.some(id => !world.people[id] || id === person.id) || career.ended && (compare(career.ended, career.started) < 0 || compare(career.ended, world.date) > 0) || active && (person.died || career.ended || activePeople.has(person.id) || career.lastMonth !== month || !history || history.personId !== person.id || history.companyId || history.roleId !== definition.roleId || person.employment?.id !== history.id || career.contractMonthsRemaining <= 0) || !active && (career.employmentId || career.contractMonthsRemaining) || ['left', 'retired', 'deceased'].includes(career.status) && !career.ended || career.status === 'deceased' && !person.died)
            throw new Error('Invalid special career');
        ids.add(career.id);
        personKinds.add(key);
        if (active)
            activePeople.add(person.id);
        if (active && career.kind === 'athlete' && athleteSuspensionReason(world, person.id))
            throw new Error('An athlete cannot hold an active contract during a drug suspension');
        let activeProjects = 0;
        for (const project of career.projects) {
            const job = histories.get(project.employmentId), quality = project.periods.length ? Math.round(project.periods.reduce((sum, item) => sum + item.score, 0) / project.periods.length) : 0;
            if (projectIds.has(project.id) || !job || project.currency !== job.currency || job.personId !== person.id || job.roleId !== definition.roleId || project.grossAtStart + project.grossEarned > job.grossEarned || compare(project.started, career.started) < 0 || compare(project.started, job.started) < 0 || compare(project.started, world.date) > 0 || project.months !== project.periods.length || project.months > project.targetMonths || project.quality !== quality || project.status === 'active' && (project.ended || !active || project.employmentId !== career.employmentId) || project.status !== 'active' && (!project.ended || compare(project.ended, project.started) < 0 || compare(project.ended, world.date) > 0) || project.status === 'completed' && project.months !== project.targetMonths || project.award && (project.status !== 'completed' || project.quality < 80 || (career.kind === 'athlete' ? project.periods.filter(item => item.success).length < 10 : project.responseRoll > 10)) || project.periods.some((item, index) => item.month <= project.started.year * 12 + project.started.month - 1 || item.month > month || !item.attended && (item.success || item.score !== 0) || index > 0 && item.month <= project.periods[index - 1].month))
                throw new Error('Invalid recorded career project');
            projectIds.add(project.id);
            if (project.status === 'active')
                activeProjects++;
            gross.set(job.id, (gross.get(job.id) ?? 0n) + project.grossEarned);
        }
        for (const project of career.creativeArchives ?? []) {
            const job = histories.get(project.employmentId);
            if (projectIds.has(project.id) || !job || job.personId !== career.personId || job.roleId !== definition.roleId || project.currency !== job.currency || project.status === 'active' || !project.ended || !project.creative || project.months !== project.periodCount || project.months > project.targetMonths || project.attendedPeriods > project.periodCount || project.scoreSum > project.periodCount * 100 || project.quality !== (project.periodCount ? Math.round(project.scoreSum / project.periodCount) : 0) || project.grossAtStart + project.grossEarned > job.grossEarned || compare(project.started, career.started) < 0 || compare(project.started, job.started) < 0 || compare(project.started, world.date) > 0 || compare(project.ended, project.started) < 0 || compare(project.ended, world.date) > 0 || project.status === 'completed' && project.months !== project.targetMonths || project.award && (project.status !== 'completed' || project.quality < 80 || project.responseRoll > 10)) throw new Error('Invalid archived creative project');
            projectIds.add(project.id); gross.set(job.id, (gross.get(job.id) ?? 0n) + project.grossEarned);
        }
        if (active && career.projects.filter(item => item.employmentId === career.employmentId).reduce((sum, item) => sum + item.months, 0) + career.contractMonthsRemaining !== (career.projects.find(project => project.status === 'active')?.creative?.term ?? definition.contractMonths))
            throw new Error('Career contract period count does not reconcile');
        if (activeProjects !== (active ? 1 : 0))
            throw new Error('A career must have exactly one current project while contracted');
    }
    for (const [id, amount] of gross)
        if (histories.get(id)!.grossEarned !== amount)
            throw new Error('Career project earnings do not reconcile to the actual contract');
    validateCreativeCareers(world);
    validateDopingChecks(world);
}
