import { newWorkEarnings } from './earningsSchemas';
import { publicRoyalDuty } from './royaltySchemas';
import { fullTimeCreator } from './creatorSchemas';
import { z } from 'zod';
import { ageOn, fullName, Person, World } from '../model';
import { careerCatalog, careerKinds, CareerKind, skillContent, skillIds } from '../content/careers';
import { jobs } from '../content/jobs';
import { countries } from '../countries';
import { rules } from '../rules';
import { formatMoney, roundRatio } from '../money';
import { IneligibleAction } from '../errors';
import { active, accountFor, availableCash, bounded, charge, draw, fact, result } from './common';
import { endEmployment } from './work';
import { isConfined } from './legalSchemas';
import { hospitalized } from './healthSchemas';
import { createContact, hireNpc } from './npcs';
import { connectPerson, relationFor } from './relationships';
import { offerPending } from '../pendingQueue';
import { addCondition, medicalQuote } from './health';
import { gainPublicFame } from './social';
import { recordingCommitment } from './musicSchemas';
import { campaignCommitment } from './politicsSchemas';
export const careerCommandSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('career-training'), skill: z.enum(skillIds), mode: z.enum(['self', 'coached']) }), z.object({ type: z.literal('stop-career-training') }),
    z.object({ type: z.literal('select-career'), kind: z.enum(careerKinds), quotedAnnualPay: z.bigint().nonnegative() }),
    z.object({ type: z.literal('career-focus'), careerId: z.string(), focus: z.enum(['craft', 'balanced', 'publicity']) }), z.object({ type: z.literal('leave-career'), careerId: z.string() }),
]);
export type CareerCommand = z.infer<typeof careerCommandSchema>;
export type Career = World['careers'][number];
const absolute = (world: World) => world.date.year * 12 + world.date.month - 1;
export const coachingCost = (world: World, person = active(world)) => rules[person.country].baseWage / 1000n;
export function trainingReason(world: World, skill: typeof skillIds[number], person = active(world)): string | undefined {
    if (ageOn(person, world.date) < skillContent[skill].minAge)
        return 'Available from age ' + skillContent[skill].minAge;
    if (isConfined(world, person) || person.legal.wanted)
        return 'Outside training is unavailable during custody or pursuit';
    if (hospitalized(world, person) || person.stats.health < 20)
        return 'Recover before beginning this training';
}
export function careerPayQuote(world: World, kind: CareerKind, person = active(world)) { const career = world.careers.find(item => item.personId === person.id && item.kind === kind), role = jobs.find(item => item.id === careerCatalog[kind].roleId)!; return roundRatio(rules[person.country].baseWage * BigInt(role.wageBps) * BigInt(100 + (career?.rank ?? 0) * 40 + Math.floor(person.stats.fame / 2)), 1000000n); }
export function selectionReason(world: World, kind: CareerKind): string | undefined {
    const person = active(world), definition = careerCatalog[kind], age = ageOn(person, world.date);
    if (kind === 'politician')
        return 'Run an election campaign to seek public office';
    if(publicRoyalDuty(world))return 'Choose a private royal life before a full-time career';
    if(fullTimeCreator(world))return 'Switch your studio to part-time before accepting a full-time contract';
    if (campaignCommitment(world))
        return 'Finish or withdraw from your current campaign first';
    if (age < definition.minAge || age > definition.maxAge)
        return 'Available at ages ' + definition.minAge + '–' + definition.maxAge;
    if (isConfined(world) || person.legal.wanted)
        return 'Resolve custody or pursuit first';
    if (hospitalized(world, person))
        return 'Finish hospital care before selection';
    if (recordingCommitment(world))
        return 'Finish or cancel your recording before accepting another contract';
    if (person.employment)
        return 'Leave your current job before accepting a full-time contract';
    if (person.education.stage !== 'none')
        return 'Complete or leave full-time study first';
    if (world.careers.some(item => item.personId === person.id && item.status === 'active'))
        return 'Finish or leave your active special career first';
    if (person.skills[definition.skill] < definition.threshold)
        return skillContent[definition.skill].title + ' skill of ' + definition.threshold + '% is required';
    if (person.stats.health < definition.health || person.stats.fitness < definition.fitness || person.stats.looks < definition.looks || person.stats.smarts < definition.smarts)
        return 'Requires Health ' + definition.health + '%, Fitness ' + definition.fitness + '%, Looks ' + definition.looks + '% and Smarts ' + definition.smarts + '%';
    if ((world.actionCounts[person.id + ':career-selection:' + kind + ':' + world.date.year] ?? 0) >= 2)
        return 'Two selection attempts are available per career each year';
}
function newProject(world: World, career: Career) { const definition = careerCatalog[career.kind], history = world.workHistory.find(item => item.id === career.employmentId)!; return { id: 'project_' + career.id + '_' + career.projects.length, currency: history.currency, name: definition.projects[draw(world, 'events', 0, definition.projects.length - 1)] + (['athlete', 'politician'].includes(career.kind) ? ' ' + (world.date.year + 1) : ''), started: { ...world.date }, ended: null, status: 'active' as const, targetMonths: definition.period, months: 0, employmentId: history.id, grossAtStart: history.grossEarned, grossEarned: 0n, responseRoll: draw(world, 'outcomes', 1, 100), quality: 0, award: null, periods: [] }; }
function colleagues(world: World, career: Career) {
    if (career.contacts.some(id => !world.people[id].died))
        return;
    const roleId = career.kind === 'athlete' ? 'professional-athlete' : 'administrator';
    for (let index = 0; index < 2; index++) {
        const person = createContact(world, { age: draw(world, 'npcs', 26, 35), country: career.country, city: world.people[career.personId].city, qualifiedRole: roleId });
        if (career.kind === 'athlete') {
            person.skills.sport = 75;
            person.stats.fitness = Math.max(80, person.stats.fitness);
            person.stats.health = Math.max(75, person.stats.health);
        }
        if (person.employment)
            endEmployment(world, person.id);
        hireNpc(world, person, roleId);
        person.employment!.employer = career.employer;
        world.workHistory.find(item => item.id === person.employment!.id)!.employer = career.employer;
        career.contacts.push(person.id);
        connectPerson(world, person.id, career.personId);
        const relation = relationFor(world, career.personId, person.id)!;
        relation.roles.push('coworker');
        relation.kind = 'coworker';
        fact(world, 'I met ' + fullName(person) + ' through ' + career.employer + '.', 'career', '', career.personId);
    }
}
export function startCareerContract(world: World, kind: CareerKind, annualPay: bigint, person: Person = active(world), announce = true): Career {
    const definition = careerCatalog[kind], prior = world.careers.find(item => item.personId === person.id && item.kind === kind);
    if (person.employment || world.careers.some(item => item.personId === person.id && item.status === 'active'))
        throw new IneligibleAction('This person already has a current work commitment');
    const career: Career = prior ?? { id: 'career_' + person.id + '_' + kind, personId: person.id, kind: kind, country: person.country, currency: countries[person.country].currency, started: { ...world.date }, ended: null, status: 'active', rank: 0, reputation: 40, focus: 'balanced', employmentId: null, employer: '', contractMonthsRemaining: 0, lastMonth: absolute(world), contacts: [], projects: [] };
    if (!prior)
        world.careers.push(career);
    career.status = 'active';
    career.ended = null;
    career.country = person.country;
    career.currency = countries[person.country].currency;
    career.employer = person.city + (kind === 'actor' ? ' Lantern Pictures' : kind === 'model' ? ' Everyday Studio' : kind === 'musician' ? ' Small Room Music' : kind === 'politician' ? ' Council' : ' Comets');
    career.lastMonth = absolute(world);
    career.contractMonthsRemaining = definition.contractMonths;
    const employmentId = 'employment_career_' + world.revision + '_' + world.workHistory.length;
    person.employment = { id: employmentId, roleId: definition.roleId, employer: career.employer, companyId: null, currency: career.currency, rank: career.rank, annualPay: annualPay, paidMonths: 0, performance: 55, effort: 'balanced' };
    world.workHistory.push({ id: employmentId, personId: person.id, roleId: definition.roleId, employer: career.employer, companyId: null, started: { ...world.date }, ended: null, monthsWorked: 0, grossEarned: 0n, ...newWorkEarnings(career.currency) });
    career.employmentId = employmentId;
    career.projects.push(newProject(world, career));
    colleagues(world, career);
    fact(world, 'I signed a ' + definition.contractMonths + '-month ' + definition.title.toLowerCase() + ' contract with ' + career.employer + '.', 'career', '', person.id);
    if (announce && person.id === world.activePersonId)
        result(world, 'Your contract is signed', 'Pay starts as time passes. Attendance, performance, health and the saved project response determine what follows.', definition.art, [{ id: 'pay', label: 'Annual gross rate', value: formatMoney({ minor: annualPay, currency: career.currency }), tone: 'positive' }, { id: 'term', label: 'Working periods', value: String(definition.contractMonths), tone: 'neutral' }]);
    return career;
}
export function resolveCareer(world: World, command: CareerCommand) {
    const person = active(world);
    if (command.type === 'career-training') {
        const reason = trainingReason(world, command.skill);
        if (reason)
            throw new IneligibleAction(reason);
        person.training = { skill: command.skill, mode: command.mode, started: { ...world.date }, lastMonth: absolute(world), months: 0, fees: 0n, currency: countries[person.country].currency };
        result(world, 'Training routine set', 'Skill develops during actual months. Coached sessions need available funding; hospital care or custody pauses outside training.', skillContent[command.skill].art);
        return;
    }
    if (command.type === 'stop-career-training') {
        if (!person.training)
            throw new IneligibleAction('You have no training routine');
        person.training = null;
        result(world, 'Training stopped', 'Your learned skills remain. Future coaching fees stop.', 'stage');
        return;
    }
    if (command.type === 'select-career') {
        const reason = selectionReason(world, command.kind);
        if (reason)
            throw new IneligibleAction(reason);
        if (command.quotedAnnualPay !== careerPayQuote(world, command.kind))
            throw new IneligibleAction('Review the current pay quote');
        const key = person.id + ':career-selection:' + command.kind + ':' + world.date.year;
        world.actionCounts[key] = (world.actionCounts[key] ?? 0) + 1;
        const definition = careerCatalog[command.kind], prior = world.careers.find(item => item.personId === person.id && item.kind === command.kind), chance = Math.max(10, Math.min(92, 20 + Math.floor(person.skills[definition.skill] / 2) + Math.floor(person.stats.discipline / 8) + Math.floor((prior?.reputation ?? 40) / 8) + Math.floor(person.stats.fame / 10)));
        if (draw(world, 'outcomes', 1, 100) > chance) {
            fact(world, 'I was not selected for a ' + definition.title.toLowerCase() + ' contract.', 'career');
            result(world, 'They chose someone else', 'The selection did not lead to a contract. No future salary was paid. You can train and try again within the yearly limit.', definition.art);
            return;
        }
        startCareerContract(world, command.kind, command.quotedAnnualPay);
        return;
    }
    const career = world.careers.find(item => item.id === command.careerId && item.personId === person.id);
    if (!career)
        throw new IneligibleAction('Choose your recorded career');
    if (command.type === 'career-focus') {
        if (career.status !== 'active')
            throw new IneligibleAction('An active career is required');
        career.focus = command.focus;
        result(world, 'Career focus updated', 'Your routine affects performance, energy, stress and public exposure as months pass.', careerCatalog[career.kind].art);
    }
    else {
        if (!['active', 'between'].includes(career.status))
            throw new IneligibleAction('This career is no longer active');
        if (career.employmentId && person.employment?.id === career.employmentId)
            endEmployment(world);
        career.status = 'left';
        career.ended = { ...world.date };
        result(world, 'You left the career', 'Future contract pay stops. Your real earnings, skills, colleagues, projects and awards remain recorded.', careerCatalog[career.kind].art);
    }
}
export function careerTrainingMonth(world: World) {
    const month = absolute(world);
    for (const person of Object.values(world.people).filter(item => !item.died && item.training)) {
        const training = person.training!;
        if (training.lastMonth >= month)
            continue;
        training.lastMonth = month;
        if (trainingReason(world, training.skill, person))
            continue;
        const cost = training.mode === 'coached' ? coachingCost(world, person) : 0n, quote = medicalQuote(world, cost, person);
        if (quote.amount > availableCash(accountFor(world, quote.payer, quote.currency)))
            continue;
        if (quote.amount)
            charge(world, quote.amount, 'skill-training', 'Coached ' + skillContent[training.skill].title.toLowerCase(), undefined, quote.currency, quote.payer);
        training.months++;
        training.fees += cost;
        const fatigue = person.stats.energy < 15 || person.stats.stress > 85;
        person.skills[training.skill] = bounded(person.skills[training.skill] + (fatigue ? 0 : training.mode === 'coached' ? 2 : 1));
        person.stats.energy = bounded(person.stats.energy - 1);
        if (training.skill === 'sport')
            person.stats.fitness = bounded(person.stats.fitness + 1);
    }
}
export function careerMonth(world: World) {
    const month = absolute(world);
    for (const career of world.careers.filter(item => item.status === 'active')) {
        const person = world.people[career.personId], definition = careerCatalog[career.kind];
        if (career.lastMonth >= month)
            continue;
        career.lastMonth = month;
        const project = career.projects.find(item => item.status === 'active');
        if (!project || !career.employmentId || person.employment?.id !== career.employmentId)
            throw new Error('An active career needs an actual contract and project');
        const history = world.workHistory.find(item => item.id === career.employmentId)!;
        project.grossEarned = history.grossEarned - project.grossAtStart;
        if (person.died || ageOn(person, world.date) > definition.maxAge || person.stats.health < 15) {
            endEmployment(world, person.id);
            career.status = 'retired';
            career.ended = { ...world.date };
            fact(world, 'I left my ' + definition.title.toLowerCase() + ' career because of ' + (person.stats.health < 15 ? 'my health.' : 'the career age limit.'), 'career', '', person.id);
            if (person.id === world.activePersonId) {
                offerPending(world, { kind: 'result', id: 'career_retirement_' + career.id, title: 'A career comes to an end', body: 'Your current contract has ended. Your actual earnings, skills, completed work and colleagues remain recorded.', illustration: definition.art, effects: [] }, 50);
                if (world.annual?.stage === 'months')
                    world.annual.pausedForPlanning = true;
            }
            continue;
        }
        const attended = !isConfined(world, person) && !person.legal.wanted && !hospitalized(world, person) && !(career.kind === 'athlete' && person.health.conditions.some(item => item.status !== 'recovered' && ['sprain', 'fracture'].includes(item.type) && item.severity >= 20));
        const score = attended ? bounded(Math.round((person.skills[definition.skill] * 2 + person.employment.performance + person.stats.discipline) / 4) + (career.focus === 'craft' ? 4 : career.focus === 'publicity' ? -3 : 0) + draw(world, person.id === world.activePersonId ? 'outcomes' : 'npcs', -8, 8)) : 0;
        project.periods.push({ month, score, attended, success: attended && draw(world, 'outcomes', 1, 100) <= score });
        project.months++;
        career.contractMonthsRemaining--;
        project.quality = Math.round(project.periods.reduce((sum, item) => sum + item.score, 0) / project.periods.length);
        person.stats.stress = bounded(person.stats.stress + (career.focus === 'craft' ? 2 : career.focus === 'publicity' ? 1 : 0));
        person.stats.energy = bounded(person.stats.energy - (career.focus === 'craft' ? 2 : 1));
        if (attended && career.focus === 'publicity') {
            person.publicLife.attention = bounded(person.publicLife.attention + 1);
            gainPublicFame(world, person, 1);
        }
        if (attended && career.kind === 'athlete' && draw(world, 'outcomes', 1, 1000) <= 8)
            addCondition(world, person, 'sprain', draw(world, 'outcomes', 20, 45));
        if (project.months < project.targetMonths)
            continue;
        project.status = project.periods.filter(item => item.attended).length >= Math.ceil(project.targetMonths / 2) ? 'completed' : 'cancelled';
        project.ended = { ...world.date };
        const success = project.status === 'completed' && (career.kind === 'athlete' ? project.periods.filter(item => item.success).length >= 7 : project.responseRoll <= Math.min(95, project.quality + Math.floor(career.reputation / 5)));
        career.reputation = bounded(career.reputation + (success ? 8 : -6));
        if (success)
            gainPublicFame(world, person, career.kind === 'actor' ? 5 : career.kind === 'model' ? 3 : 4);
        if (success && project.quality >= 80 && (career.kind === 'athlete' ? project.periods.filter(item => item.success).length >= 10 : project.responseRoll <= 10)) {
            project.award = career.kind === 'athlete' ? 'League season trophy' : career.kind === 'actor' ? 'Lantern Festival performance award' : career.kind === 'musician' ? 'Small Room live performance award' : career.kind === 'politician' ? 'Public Service Distinction' : 'Everyday campaign distinction';
            fact(world, 'I received the ' + project.award + ' for ' + project.name + '.', 'career', '', person.id);
        }
        const completed = career.projects.filter(item => item.status === 'completed').length;
        career.rank = Math.min(3, Math.floor(completed / 3));
        fact(world, (project.status === 'completed' ? 'I completed ' : 'I could not complete ') + project.name + (success ? ' with a strong response.' : '; the response was disappointing.'), 'career', '', person.id);
        if (career.contractMonthsRemaining <= 0) {
            endEmployment(world, person.id);
            career.status = 'between';
        }
        else {
            person.employment!.rank = career.rank;
            career.projects.push(newProject(world, career));
        }
        if (person.id === world.activePersonId) {
            offerPending(world, { kind: 'result', id: 'career_result_' + project.id, title: career.kind === 'politician' ? 'A year of public service' : career.kind === 'athlete' ? 'The season is over' : project.status === 'completed' ? 'The project is complete' : 'The project has ended', body: project.name + (project.status === 'cancelled' ? ' ended without enough attendance to complete the work.' : success ? career.kind === 'politician' ? ' met its service goals.' : ' found its audience.' : career.kind === 'politician' ? ' fell short of its service goals.' : ' received a mixed response.') + (career.status === 'between' ? ' Your contract has ended. You can choose your next step before continuing.' : career.kind === 'politician' ? ' Your elected term continues.' : ' Your existing contract continues into another season.'), illustration: definition.art, effects: [{ id: 'quality', label: 'Recorded quality', value: project.quality + '%', tone: 'neutral' }, { id: 'pay', label: 'Actual contract earnings', value: formatMoney({ minor: project.grossEarned, currency: career.currency }), tone: 'positive' }, ...(project.award ? [{ id: 'award', label: 'Award', value: project.award, tone: 'positive' as const }] : [])] }, 50);
            if (world.annual?.stage === 'months')
                world.annual.pausedForPlanning = true;
        }
    }
}
export function careerDeath(world: World, personId: string) {
    for (const career of world.careers.filter(item => item.personId === personId && ['active', 'between'].includes(item.status))) {
        career.status = 'deceased';
        career.ended = { ...world.date };
    }
    world.people[personId].training = null;
}
