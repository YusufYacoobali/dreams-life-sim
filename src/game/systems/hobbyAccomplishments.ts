import { z } from 'zod';
import type { World } from '../model';
import { hobbyContent, hobbyKinds, outingContent, outingKinds, type HobbyKind } from '../content/leisure';
import { countries } from '../countries';
import { rules } from '../rules';
import { IneligibleAction } from '../errors';
import { accountFor, active, availableCash, bounded, draw, post, result } from './common';
import { activeHobbyPlan, personHobbies } from './leisureSchemas';
import { leisureConsent, leisurePayer, leisurePresent, hobbyPauseReason } from './leisure';
import { hobbyContacts } from './leisure';
import { createContact } from './npcs';
import { connectPerson } from './relationships';
import { parentOf } from './travel';
import { ageOn } from '../personHelpers';
import type { AmenityId } from './lifestyleSchemas';
import { homeAmenity } from './propertyAmenities';
import { contactConsent, lifestyleMonthNumber as month, lifestylePayment, lifestyleState, lifestyleReason, localContactReason, nameOf, recordLifestyle, requireLifestyle, sharedMemory } from './lifestyleCommon';
export const hobbyLifestyleCommandSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('hobby-competition'), kind: z.enum(hobbyKinds), approach: z.enum(['steady', 'bold', 'social']), reviewedPayerId: z.string(), quotedFee: z.bigint().nonnegative() }).strict(),
    z.object({ type: z.literal('start-hobby-project'), hobbyId: z.string(), title: z.string().trim().min(1).max(70).refine(value => !/[\u0000-\u001f]/.test(value)) }).strict(),
    z.object({ type: z.literal('work-hobby-project'), projectId: z.string() }).strict(),
    z.object({ type: z.literal('shared-hobby-practice'), hobbyId: z.string(), contactId: z.string() }).strict(),
    z.object({ type: z.literal('casual-hobby'), kind: z.enum(hobbyKinds) }).strict(),
    z.object({ type: z.literal('shared-leisure-outing'), kind: z.enum(outingKinds), contactId: z.string(), reviewedPayerId: z.string(), quotedFee: z.bigint().nonnegative() }).strict(),
]);
export type HobbyLifestyleCommand = z.infer<typeof hobbyLifestyleCommandSchema>;
export const hobbyMilestone = (proficiency: number) => proficiency >= 90 ? 'Master' : proficiency >= 70 ? 'Expert' : proficiency >= 40 ? 'Skilled' : proficiency >= 15 ? 'Developing' : 'Beginner';
export const competitionFee = (world: World, kind: HobbyKind) => rules[active(world).country].baseWage * BigInt(hobbyContent[kind].feeBps + 2) / 5000n || 1n;
export const competitionChance = (proficiency: number, discipline: number, approach: 'steady' | 'bold' | 'social', peer: number) => Math.max(10, Math.min(90, 25 + Math.floor(proficiency * 0.6) + Math.floor(discipline / 10) - Math.floor(peer / 4) + (approach === 'steady' ? 10 : approach === 'bold' ? -10 : 0)));
export function competitionReason(world: World, kind: HobbyKind) { const common = lifestyleReason(world, false); if (common) return common; const person = active(world), hobby = personHobbies(world).find(row => row.kind === kind), plan = hobby && activeHobbyPlan(hobby); if (!world.lifestyle)
    return 'Review and enable lifestyle features first'; if (!hobby || !plan || hobby.proficiency < 20 || hobby.practices.filter(row => row.source === 'monthly' && row.attended).length < 6)
    return 'Build 20 proficiency and attend six monthly practices in a current routine'; if (!leisurePresent(world, person) || hobbyPauseReason(world, hobby, plan, true))
    return 'Be available and healthy at your current routine'; if (!leisurePayer(world))
    return 'An available actual parent or guardian must agree'; if (world.hobbyEvents.some(row => row.personId === person.id && row.kind === kind && row.date.year === world.date.year) || world.lifestyle.records.some(row => row.personId === person.id && row.kind === 'hobby-competition' && row.subjectId === hobby.id && row.date.year === world.date.year))
    return 'One competition or community-event request per hobby each year'; if (availableCash(accountFor(world, leisurePayer(world)!)) < competitionFee(world, kind)) return 'The responsible payer cannot cover the competition entry'; }
const projectAmenity: Partial<Record<HobbyKind, AmenityId>> = { guitar: 'studio', singing: 'studio', writing: 'office', coding: 'office', pottery: 'workshop', gardening: 'garden', swimming: 'pool', running: 'gym', cooking: 'kitchen', gaming: 'gaming-room', painting: 'workshop', photography: 'office' };
export function projectEnergy(world: World, kind: HobbyKind) { return projectAmenity[kind] && homeAmenity(world, projectAmenity[kind]!) ? 2 : 4; }
export function projectWorkReason(world: World, projectId: string) {
    const base = lifestyleReason(world, false, 0); if (base) return base;
    const project = world.lifestyle?.projects.find(row => row.id === projectId && row.personId === world.activePersonId && !row.completed);
    if (!project) return 'Choose your unfinished project';
    const hobby = personHobbies(world).find(row => row.id === project.hobbyId), plan = hobby && activeHobbyPlan(hobby);
    if (!hobby || !plan || hobbyPauseReason(world, hobby, plan, true)) return 'Choose an available current hobby routine';
    if (project.lastMonth === month(world) || !hobby.practices.slice(project.practiceCursor).some(row => row.attended && row.source === 'monthly')) return 'Attend another month of practice before the next project session';
    if (active(world).stats.energy < projectEnergy(world, hobby.kind)) return 'Rest before working on your project';
}
export function resolveHobbyLifestyle(world: World, command: HobbyLifestyleCommand) {
    requireLifestyle(world, false, 0);
    const state = lifestyleState(world), person = active(world), current = month(world);
    if (command.type === 'casual-hobby') {
        if (person.stats.energy < 4) throw new IneligibleAction('Rest before this activity');
        if (ageOn(person, world.date) < hobbyContent[command.kind].minAge)
            throw new IneligibleAction('Wait until this hobby’s minimum age');
        const key = person.id + ':casual-hobby:' + current;
        if (world.actionCounts[key])
            throw new IneligibleAction('One free casual hobby session each month');
        if (['swimming', 'pottery', 'fishing', 'cooking'].includes(command.kind))
            throw new IneligibleAction('Choose a supervised community session for this hobby');
        world.actionCounts[key] = 1;
        person.stats.energy = bounded(person.stats.energy - 4);
        person.stats.happiness = bounded(person.stats.happiness + 2);
        person.stats.stress = bounded(person.stats.stress - 2);
        const body = 'I spent free time on ' + hobbyContent[command.kind].name.toLowerCase() + ' using local shared resources. It was enjoyable without a paid routine; no proficiency, equipment, qualification or money was invented.';
        recordLifestyle(world, { kind: 'casual-hobby', subjectId: command.kind, body });
        result(world, 'Time of your own', body, 'leisure-' + command.kind);
        return;
    }
    if (command.type === 'shared-leisure-outing') {
        const payer = leisurePayer(world), contact = world.people[command.contactId], venue = outingContent[command.kind], base = localContactReason(world, command.contactId, true);
        if (base)
            throw new IneligibleAction(base);
        if (!payer || payer.id !== command.reviewedPayerId)
            throw new IneligibleAction('Review the actual responsible payer');
        if (ageOn(person, world.date) < venue.minAge || ageOn(contact, world.date) < venue.minAge)
            throw new IneligibleAction('Both participants must meet the venue’s age policy');
        if (ageOn(contact, world.date) < 18 && (!parentOf(world, person.id, contact.id) || person.householdId !== contact.householdId))
            throw new IneligibleAction('A child must attend with their actual co-resident parent');
        if (person.stats.energy < venue.energy || contact.stats.health < 25)
            throw new IneligibleAction('Rest and recover before this outing');
        const key = person.id + ':shared-outing:' + command.kind + ':' + current;
        if (world.actionCounts[key] || world.actionCounts[person.id + ':outing:' + command.kind + ':' + current])
            throw new IneligibleAction('One visit to this venue per month');
        const participants = [...new Set([person.id, payer.id, contact.id])], fee = rules[person.country].baseWage * BigInt(venue.feeBps) / 10000n * BigInt(participants.length);
        if (fee !== command.quotedFee || availableCash(accountFor(world, payer)) < fee)
            throw new IneligibleAction('Review the current ticket price and available funds');
        const permission = leisureConsent(world, person, payer), consent = permission.accepted ? contactConsent(world, contact) : { chance: permission.chance, roll: permission.roll, accepted: false };
        world.actionCounts[key] = 1;
        world.actionCounts[person.id + ':outing:' + command.kind + ':' + current] = 1;
        let paymentIds: string[] = [], paid = 0n;
        if (consent.accepted) {
            paymentIds = lifestylePayment(world, fee, 'Shared ' + venue.name, countries[person.country].currency, payer);
            paid = fee;
            person.stats.energy = bounded(person.stats.energy - venue.energy);
            person.stats.happiness = bounded(person.stats.happiness + 4);
            sharedMemory(world, contact.id, 'shared-outing:' + command.kind + ':' + current, 5);
        }
        const body = consent.accepted ? 'I went to ' + venue.name.toLowerCase() + ' with ' + nameOf(world, contact.id) + (payer.id !== person.id ? ', accompanied by ' + nameOf(world, payer.id) : '') + '. The actual tickets and shared memory are recorded.' : 'Our proposed outing did not receive everyone’s agreement. Nobody attended and no tickets were charged.';
        recordLifestyle(world, { kind: 'shared-outing-' + command.kind, invitedId: contact.id, funding: { payerId: payer.id, quotedFee: fee, permission }, subjectId: command.contactId, participants: consent.accepted ? participants : [person.id], ...consent, paid: payer.id === person.id ? paid : 0n, paymentIds, body });
        result(world, consent.accepted ? 'A shared afternoon' : 'Another time', body, 'leisure-' + command.kind);
        return;
    }
    const hobby = command.type === 'work-hobby-project' ? state.projects.find(row => row.id === command.projectId)?.hobbyId : command.type === 'hobby-competition' ? personHobbies(world).find(row => row.kind === command.kind)?.id : command.hobbyId;
    const profile = personHobbies(world).find(row => row.id === hobby), plan = profile && activeHobbyPlan(profile);
    if (!profile || !plan || hobbyPauseReason(world, profile, plan, true))
        throw new IneligibleAction('Choose an available current hobby routine');
    if (command.type === 'hobby-competition') {
        const reason = competitionReason(world, command.kind);
        if (reason)
            throw new IneligibleAction(reason);
        const payer = leisurePayer(world)!;
        const fee = competitionFee(world, command.kind);
        if (payer.id !== command.reviewedPayerId || fee !== command.quotedFee || availableCash(accountFor(world, payer)) < fee)
            throw new IneligibleAction('Review the actual payer and entry fee');
        const consent = leisureConsent(world, person, payer);
        let paymentIds: string[] = [], paid = 0n, received = 0n, body: string, participants = [person.id], outcomeChance: number | undefined, outcomeRoll: number | undefined, success: boolean | undefined, competition: {
            approach: 'steady' | 'bold' | 'social';
            practiceCursor: number;
            discipline: number;
            peerId: string;
            peerDiscipline: number;
        } | undefined;
        if (!consent.accepted)
            body = nameOf(world, payer.id) + ' declined my competition request. I did not enter or pay; the annual opportunity is recorded.';
        else {
            paymentIds = lifestylePayment(world, fee, 'Hobby competition', countries[person.country].currency, payer);
            paid = fee;
            const existing = hobbyContacts(world, profile).find(peer => !localContactReason(world, peer.id, true) && ageOn(peer, world.date) >= 18 === (ageOn(person, world.date) >= 18));
            const peer = existing ?? createContact(world, { age: ageOn(person, world.date) < 18 ? ageOn(person, world.date) : Math.max(18, ageOn(person, world.date) - 2) });
            if (!existing)
                connectPerson(world, peer.id);
            participants = [...new Set([person.id, payer.id, peer.id])];
            const chance = competitionChance(profile.proficiency, person.stats.discipline, command.approach, peer.stats.discipline), roll = draw(world, 'outcomes', 1, 100), won = roll <= chance;
            outcomeChance = chance;
            outcomeRoll = roll;
            success = won;
            competition = { approach: command.approach, practiceCursor: profile.practices.length, discipline: person.stats.discipline, peerId: peer.id, peerDiscipline: peer.stats.discipline };
            received = won && command.approach !== 'social' ? fee * BigInt(command.approach === 'bold' ? 4 : 2) : 0n;
            if (received) {
                post(world, received, 0n, 'lifestyle-prize', 'Awarded local hobby prize', null, person);
                paymentIds.push(world.ledger.at(-1)!.id);
                person.finance.cycleGross += received;
                person.finance.supportIncomeDue += received;
            }
            sharedMemory(world, peer.id, 'hobby-competition:' + profile.id + ':' + world.date.year + (won ? ':won' : ':lost'), command.approach === 'social' ? 5 : 2);
            person.stats.energy = bounded(person.stats.energy - 4);
            person.stats.respect = bounded(person.stats.respect + (won ? 2 : 0));
            body = 'I entered a local ' + hobbyContent[command.kind].name.toLowerCase() + ' competition alongside ' + nameOf(world, peer.id) + '. ' + (won ? command.approach === 'social' ? 'Our contribution received an honourable mention. There was no cash award for this approach.' : 'My entry won a recorded cash prize.' : 'My entry did not place. I still had a real afternoon with people who cared about the same thing.') + ' Chance ' + chance + '%, draw ' + roll + '.';
        }
        recordLifestyle(world, { kind: 'hobby-competition', funding: { payerId: payer.id, quotedFee: fee, permission: consent }, ...(competition ? { competition } : {}), subjectId: profile.id, participants, chance: consent.chance, roll: consent.roll, accepted: consent.accepted, paid: payer.id === person.id ? paid : 0n, received, paymentIds, before: profile.proficiency, after: profile.proficiency, ...(outcomeChance !== undefined ? { outcomeChance, outcomeRoll, success } : {}), body });
        result(world, 'An afternoon in good company', body, 'leisure-' + profile.kind);
        return;
    }
    if (command.type === 'start-hobby-project') {
        if (profile.proficiency < 20)
            throw new IneligibleAction('Build 20 earned proficiency first');
        if (state.projects.some(row => row.hobbyId === profile.id && !row.completed))
            throw new IneligibleAction('Finish your current project first');
        if (state.projects.length >= 512)
            throw new IneligibleAction('The project history limit has been reached');
        state.projects.push({ workVersion: 2, initialPracticeCursor: profile.practices.length, id: 'hobby_project_' + world.revision, personId: person.id, hobbyId: profile.id, title: command.title, started: { ...world.date }, completed: null, progress: 0, lastMonth: current, practiceCursor: profile.practices.length });
        recordLifestyle(world, { kind: 'project-start', subjectId: profile.id, body: 'I began “' + command.title + '”, a personal ' + hobbyContent[profile.kind].name.toLowerCase() + ' project. Four later attended practice months can contribute to the finished work when I review the project.' });
        result(world, 'Something of your own', 'The project is started. No physical asset, sale value or qualification has been created.', 'leisure-' + profile.kind);
        return;
    }
    if (command.type === 'work-hobby-project') {
        const reason = projectWorkReason(world, command.projectId); if (reason) throw new IneligibleAction(reason);
        const project = state.projects.find(row => row.id === command.projectId && row.personId === person.id && !row.completed);
        if (!project)
            throw new IneligibleAction('Choose your unfinished project');
        if (project.lastMonth === current || !profile.practices.slice(project.practiceCursor).some(row => row.attended && row.source === 'monthly'))
            throw new IneligibleAction('Attend another month of practice before the next project session');
        const energy = projectEnergy(world, profile.kind);
        if (person.stats.energy < energy)
            throw new IneligibleAction('Rest before working on your project');
        const practiceBefore = project.practiceCursor, before = project.progress;
        const attended = profile.practices.slice(practiceBefore).filter(row => row.attended && row.source === 'monthly').length;
        const credited = project.workVersion === 2 ? Math.min(4 - project.progress, attended) : 1;
        project.progress += credited;
        project.lastMonth = current;
        project.practiceCursor = profile.practices.length;
        person.stats.energy = bounded(person.stats.energy - energy);
        if (project.progress === 4)
            project.completed = { ...world.date };
        const body = 'I ' + (project.completed ? 'completed' : 'worked on') + ' “' + project.title + '”. ' + (project.completed ? 'It remains a personal accomplishment, with no invented resale value or qualification.' : project.progress + (project.workVersion === 2 ? '/4 parts are complete.' : '/4 work sessions are complete.'));
        recordLifestyle(world, { kind: project.completed ? 'project-complete' : 'project-work', subjectId: project.id, before, after: project.progress, ...(project.workVersion === 2 ? { projectSession: { practiceBefore, practiceAfter: project.practiceCursor, months: credited } } : {}), body });
        result(world, project.completed ? 'You finished it' : 'One part closer', body, 'leisure-' + profile.kind);
        return;
    }
    if (person.stats.energy < 4) throw new IneligibleAction('Rest before sharing practice');
    const reason = localContactReason(world, command.contactId, true);
    if (reason)
        throw new IneligibleAction(reason);
    const contact = world.people[command.contactId];
    if (ageOn(contact, world.date) < hobbyContent[profile.kind].minAge) throw new IneligibleAction('Your guest must meet this hobby’s minimum age');
    if (ageOn(contact, world.date) < 18 && (person.householdId !== contact.householdId || !parentOf(world, person.id, contact.id)))
        throw new IneligibleAction('Practise with your actual co-resident child or an adult contact');
    if (ageOn(person, world.date) < 18 && !leisurePayer(world))
        throw new IneligibleAction('An actual parent or guardian must be available');
    const key = person.id + ':shared-hobby:' + current;
    if (world.actionCounts[key])
        throw new IneligibleAction('One shared hobby invitation per month');
    if (!profile.practices.some(row => row.attended && row.source === 'monthly' && row.date.year === world.date.year && row.date.month === world.date.month))
        throw new IneligibleAction('Attend a month of this routine first');
    const consent = contactConsent(world, contact);
    world.actionCounts[key] = 1;
    if (consent.accepted) {
        sharedMemory(world, contact.id, 'shared-hobby:' + profile.id + ':' + current, 5);
        person.stats.energy = bounded(person.stats.energy - 4);
    }
    const body = consent.accepted ? 'I shared ' + hobbyContent[profile.kind].name.toLowerCase() + ' practice with ' + nameOf(world, contact.id) + '. Our shared memory grew; this did not count as another paid lesson or award extra proficiency.' : nameOf(world, contact.id) + ' declined practice together. No attendance or progress was invented.';
    recordLifestyle(world, { kind: 'shared-hobby', invitedId: contact.id, subjectId: profile.id, participants: [person.id, ...(consent.accepted ? [contact.id] : [])], ...consent, body });
    result(world, consent.accepted ? 'Someone to share it with' : 'Another time', body, 'leisure-' + profile.kind);
}
