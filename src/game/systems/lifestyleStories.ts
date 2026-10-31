import { polishedLifestyleTemplate } from '../content/lifestylePolish';
import { captureLifestyleConsequences, lifestyleConsequenceRows } from './lifestyleStoryEffects';
import { hobbyContacts } from './leisure';
import type { World } from '../model';
import { IneligibleAction } from '../errors';
import { lifestyleTemplates, type LifestyleTemplate } from '../content/lifestyleEvents';
import { hobbyContent } from '../content/leisure';
import { activeHobbyPlan } from './leisureSchemas';
import { householdPets } from './petSchemas';
import { namedTenancy } from './landlordState';
import { hasAmenity } from './propertyAmenities';
import { accountFor, active, availableCash, bounded, draw, post } from './common';
import { lifestyleMonthNumber as month, lifestylePayment, localContactReason, nameOf, presentAtHome, recordLifestyle, sharedMemory } from './lifestyleCommon';
import { offerPending } from '../pendingQueue';
import type { z } from 'zod';
import type { lifestyleChoiceSchema } from './lifestyleSchemas';
import { rules } from '../rules';
import { countries } from '../countries';
import { formatMoney, roundRatio } from '../money';
import { addCondition } from './health';
import { recordLifestyleVandalism } from './legal';
import { createContact } from './npcs';
import { connectPerson } from './relationships';
function context(world: World, template: LifestyleTemplate, subjectId?: string, contextVersion: 1 | 2 = 2) {
    const person = active(world);
    if (!world.lifestyle || !presentAtHome(world) || person.stats.health < 25)
        return;
    const family = world.relationships.filter(edge => (edge.from === person.id || edge.to === person.id) && (edge.roles.some(role => ['parent', 'guardian', 'sibling'].includes(role)) || edge.romance === 'married')).map(edge => world.people[edge.from === person.id ? edge.to : edge.from]).find(contact => !localContactReason(world, contact.id, true) && contact.householdId === person.householdId);
    let id: string, subject: string, other = family?.id ?? null, tenancyId: string | null = null, savedContext = '', projectTitle = '';
    if (template.domain === 'property' || template.domain === 'vehicle') {
        const asset = world.assets.find(row => (!subjectId || row.id === subjectId) && row.ownerId === person.id && row.kind === template.domain && (template.domain === 'property' ? !!row.propertyLife : !!row.vehicleLife) && row.stolen?.status !== 'held' && row.country === person.country && row.city === person.city && (template.when !== 'home' || row.primaryHome) && (template.when !== 'tenant' || !!namedTenancy(world, row.id)) && (template.when !== 'damaged' || row.condition < 65) && (template.when !== 'insured' || row.insured) && (template.when !== 'used' || world.lifestyle!.records.some(record => record.subjectId === row.id && record.distance > 0)) && (template.when !== 'vintage' || row.catalogId === 'vintage-roadster') && (!template.amenity || hasAmenity(row, template.amenity)));
        if (!asset)
            return;
        id = asset.id;
        subject = asset.name;
        const tenancy = namedTenancy(world, asset.id);
        if (template.when === 'tenant') {
            other = tenancy!.tenantId;
            tenancyId = tenancy!.id;
        }
        savedContext = asset.ownerId + ':' + asset.rental + ':' + (asset.insured ? 'insured' : 'bare') + (contextVersion === 2 ? ':' + asset.value + ':' + asset.condition : '');
    }
    else if (template.domain === 'pet') {
        const pet = householdPets(world).find(row => (!subjectId || row.id === subjectId) && row.companion && (!template.species || row.species === template.species) && (!template.trait || row.companion.trait === template.trait) && (template.when !== 'trained' || row.companion.training >= 25) && (template.when !== 'unwell' || row.illness !== 'none' || row.companion.condition !== 'well'));
        if (!pet || template.choices.some(choice => choice.operations.some(operation => operation.kind === 'training')) && ['fish', 'turtle', 'hamster'].includes(pet.species))
            return;
        id = pet.id;
        subject = pet.name;
        savedContext = pet.ownerId + ':' + pet.status + ':' + pet.country + ':' + pet.city + (contextVersion === 2 ? ':' + pet.illness + ':' + pet.companion!.condition + ':' + pet.companion!.training : '');
    }
    else {
        const hobby = world.hobbies.find(row => row.personId === person.id && (!subjectId || row.id === subjectId) && (!template.hobby || row.kind === template.hobby) && activeHobbyPlan(row) && row.practices.some(practice => practice.attended && practice.source === 'monthly') && (template.when !== 'skilled' || row.proficiency >= 40) && (template.when !== 'project' || world.lifestyle!.projects.some(project => project.hobbyId === row.id && !project.completed)));
        if (!hobby)
            return;
        if (template.when === 'peer') {
            const peer = hobbyContacts(world, hobby).find(peer => !localContactReason(world, peer.id, true));
            if (!peer)
                return;
            other = peer.id;
        }
        id = hobby.id;
        subject = hobbyContent[hobby.kind].name.toLowerCase();
        savedContext = activeHobbyPlan(hobby)!.id;
        projectTitle = world.lifestyle.projects.find(project => project.hobbyId === hobby.id && !project.completed)?.title ?? '';
    }
    if (template.when === 'family' && !other)
        return;
    if (other && !presentAtHome(world, world.people[other]))
        return;
    return { id, subject, other, tenancyId, savedContext, projectTitle };
}
export function offerLifestyleStory(world: World, templateId?: string, subjectId?: string, forceForTest = false) {
    const state = world.lifestyle, person = active(world);
    if (!state || state.offers.length >= 512 || state.records.length + state.offers.filter(offer => offer.status === 'open').length >= 4096 || !presentAtHome(world))
        return false;
    const key = person.id + ':lifestyle-story:' + world.date.year;
    if (!forceForTest && (world.actionCounts[key] ?? 0) >= 2)
        return false;
    const domains = new Set<string>();
    for (const asset of world.assets) if (asset.ownerId === person.id && asset.country === person.country && asset.city === person.city && asset.stolen?.status !== 'held') {
        if (asset.propertyLife) domains.add('property');
        if (asset.vehicleLife) domains.add('vehicle');
    }
    if (householdPets(world).some(pet => pet.companion)) domains.add('pet');
    if (world.hobbies.some(hobby => hobby.personId === person.id && activeHobbyPlan(hobby) && hobby.practices.some(row => row.attended && row.source === 'monthly'))) domains.add('hobby');
    if (!domains.size) return false;
    const lastOffered = new Map<string, number>();
    for (const offer of state.offers) if (offer.personId === person.id) lastOffered.set(offer.templateId, Math.max(lastOffered.get(offer.templateId) ?? -Infinity, offer.date.year));
    const eligible = lifestyleTemplates.filter(template => domains.has(template.domain) && (!templateId || template.id === templateId) && world.date.year - (lastOffered.get(template.id) ?? -Infinity) >= 5 && context(world, template, subjectId));
    if (!eligible.length)
        return false;
    if (!forceForTest && draw(world, 'events', 1, 100) > 18)
        return false;
    const template = polishedLifestyleTemplate(eligible[draw(world, 'events', 0, eligible.length - 1)]), binding = context(world, template, subjectId)!;
    const text = (value: string) => value.replace(/\{(subject|person|project)\}/g, (_token, key: string) => key === 'subject' ? binding.subject : key === 'person' ? binding.other ? nameOf(world, binding.other) : 'your household' : binding.projectTitle);
    const currency = countries[person.country].currency, id = 'lifestyle_offer_' + world.revision + '_' + state.offers.length;
    const challengeRoll = template.choices.some(choice => choice.operations.some(operation => operation.kind === 'hobby-challenge')) ? draw(world, 'outcomes', 1, 100) : null;
    const challengeProfile = world.hobbies.find(row => row.id === binding.id);
    const choices = template.choices.map(choice => {
        const operation = choice.operations.find(operation => operation.kind === 'hobby-challenge');
        const challenge = operation && challengeProfile && challengeRoll !== null ? { practiceCursor: challengeProfile.practices.length, proficiency: challengeProfile.proficiency, discipline: person.stats.discipline, chance: Math.max(10, Math.min(90, 25 + Math.floor(challengeProfile.proficiency / 2) + Math.floor(person.stats.discipline / 10) + operation.amount)), roll: challengeRoll } : undefined;
        const won = challenge && challenge.roll <= challenge.chance;
        const body = choice.body + (challenge ? template.id === 'hobby-chess-prodigy' ? won ? ' You win the informal game. {person} stays to discuss a turning point.' : ' You lose the informal game. {person} stays to go over a turning point.' : won ? ' The attempt comes together. You finish more confident, and it shows.' : ' This attempt does not come together. Afterwards, you can see one thing to try differently.' : '');
        const journal = choice.journal + (challenge ? won ? ' I was pleased with how the attempt turned out.' : ' I did not get the result I wanted, but saw something to try next time.' : '');
        return { id: choice.id, label: choice.label, cost: roundRatio(rules[person.country].baseWage * BigInt(choice.costBps), 10000n), body: text(body), journal: text(journal), resultTitle: template.title, ...(challenge ? { challenge } : {}), operations: choice.operations.map(row => ({ ...row })) };
    });
    state.offers.push({ journalVersion: 1, outputVersion: 1, copyVersion: 2, contextVersion: 2, id, templateId: template.id, personId: person.id, subjectId: binding.id, participantId: binding.other, tenancyId: binding.tenancyId, date: { ...world.date }, country: person.country, city: person.city, currency, context: binding.savedContext, status: 'open', choices, selected: null });
    const people = [person.id, ...(binding.other ? [binding.other] : [])];
    offerPending(world, { kind: 'decision', id, templateId: template.id, title: template.title, body: text(template.body), illustration: template.domain === 'property' ? 'property' : template.domain === 'vehicle' ? 'vehicle' : template.domain === 'pet' ? 'pet-' + world.pets.find(row => row.id === binding.id)!.species : 'leisure-' + world.hobbies.find(row => row.id === binding.id)!.kind, personIds: people, choices: choices.map(choice => ({ id: choice.id, label: choice.label + (choice.cost ? ' · ' + formatMoney({ minor: choice.cost, currency }) : ''), effects: [{ kind: 'lifestyle-choice' as const, version: 1 as const, offerId: id, choiceId: choice.id }], resultTitle: choice.resultTitle, resultBody: choice.body, journal: choice.journal })) }, 28);
    world.actionCounts[key] = (world.actionCounts[key] ?? 0) + 1;
    if (world.annual?.stage === 'months')
        world.annual.pausedForPlanning = true;
    return true;
}
function currentOffer(world: World, id: string) { const offer = world.lifestyle?.offers.find(row => row.id === id && row.status === 'open'); if (!offer)
    return; const template = lifestyleTemplates.find(row => row.id === offer.templateId), binding = template && context(world, template, offer.subjectId, offer.contextVersion ?? 1); if (offer.personId !== world.activePersonId || active(world).country !== offer.country || active(world).city !== offer.city || !binding || binding.savedContext !== offer.context || binding.other !== offer.participantId || binding.tenancyId !== offer.tenancyId)
    return; return offer; }
export function lifestyleChoiceReason(world: World, effect: z.infer<typeof lifestyleChoiceSchema>) { const offer = currentOffer(world, effect.offerId), choice = offer?.choices.find(row => row.id === effect.choiceId); if (offer && choice && availableCash(accountFor(world, active(world), offer.currency)) < choice.cost)
    return 'Insufficient available funds for this saved choice'; }
export function resolveLifestyleChoice(world: World, effect: z.infer<typeof lifestyleChoiceSchema>) {
    const original = world.lifestyle?.offers.find(row => row.id === effect.offerId), offer = currentOffer(world, effect.offerId);
    if (!original || original.status !== 'open')
        throw new IneligibleAction('This lifestyle decision is no longer open');
    if (!offer) {
        original.status = 'cancelled';
        return original.journalVersion === 1 ? { title: 'Circumstances changed', body: 'Things have changed since this came up. You leave it there.', journal: 'I let an earlier plan go when the circumstances changed.', effects: [] } : { title: 'Circumstances changed', body: 'The saved people, asset or household circumstances changed. No cost or consequence was applied.', journal: 'A lifestyle decision ended because its original context was no longer current.', effects: [] };
    }
    const choice = offer.choices.find(row => row.id === effect.choiceId);
    if (!choice)
        throw new IneligibleAction('Choose an available saved option');
    const reason = lifestyleChoiceReason(world, effect);
    if (reason)
        throw new IneligibleAction(reason);
    const before = offer.outputVersion === 1 ? captureLifestyleConsequences(world, offer) : undefined;
    const paymentIds = lifestylePayment(world, choice.cost, 'Lifestyle situation: ' + offer.templateId, offer.currency), person = active(world), asset = world.assets.find(row => row.id === offer.subjectId), pet = world.pets.find(row => row.id === offer.subjectId), tenancy = offer.tenancyId && world.lifestyle!.tenancies.find(row => row.id === offer.tenancyId);
    let received = 0n;
    for (const operation of choice.operations) {
        if (operation.kind === 'hobby-challenge' && choice.challenge) {
            const won = choice.challenge.roll <= choice.challenge.chance;
            person.stats.respect = bounded(person.stats.respect + (won ? 2 : 0));
            person.stats.happiness = bounded(person.stats.happiness + (won ? 3 : 1));
            if (offer.participantId)
                sharedMemory(world, offer.participantId, 'informal-hobby-challenge:' + offer.id + ':' + (won ? 'won' : 'lost'), won ? 2 : 1);
        }
        else if (operation.kind === 'condition' && asset)
            asset.condition = bounded(asset.condition + operation.amount);
        else if (operation.kind === 'maintenance' && asset) {
            if (tenancy)
                tenancy.maintenance += asset.value * BigInt(operation.amount) / 10000n || 1n;
            else
                asset.condition = bounded(asset.condition - 1);
        }
        else if (operation.kind === 'asset-loss' && asset) {
            const loss = asset.value * BigInt(operation.amount) / 100n;
            asset.value -= loss;
            asset.condition = bounded(asset.condition - operation.amount * 3);
            const claim = asset.insured ? loss * 4n / 5n : 0n;
            if (claim) {
                post(world, claim, 0n, 'insurance-claim', 'Recorded lifestyle asset loss: ' + asset.id, null, person, asset.currency);
                received += claim;
            }
        }
        else if (operation.kind === 'report-damage' && asset) {
            const offender = offer.participantId && world.people[offer.participantId];
            if (!offender)
                throw new IneligibleAction('The named person is no longer available');
            const loss = asset.value / 100n;
            asset.value -= loss;
            asset.condition = bounded(asset.condition - 3);
            recordLifestyleVandalism(world, offender.id, person.id, loss);
        }
        else if (operation.kind === 'injury')
            addCondition(world, person, 'sprain', operation.amount, offer.journalVersion !== 1);
        else if (operation.kind === 'bond' && pet)
            pet.bonds[person.id] = bounded((pet.bonds[person.id] ?? 0) + operation.amount);
        else if (operation.kind === 'training' && pet?.companion)
            pet.companion.training = bounded(pet.companion.training + operation.amount);
        else if ((operation.kind === 'pet-health' || operation.kind === 'pet-comfort') && pet) {
            pet.happiness = bounded(pet.happiness + operation.amount);
            if (offer.participantId && world.people[offer.participantId].householdId === person.householdId)
                pet.bonds[offer.participantId] = bounded((pet.bonds[offer.participantId] ?? 0) + Math.max(0, Math.floor(operation.amount / 2)));
        }
        else if (operation.kind === 'relationship' && offer.participantId) {
            sharedMemory(world, offer.participantId, 'lifestyle-story:' + offer.id + ':' + choice.id, operation.amount);
            if (tenancy)
                tenancy.satisfaction = bounded(tenancy.satisfaction + operation.amount);
        }
        else if ((operation.kind === 'competition' || operation.kind === 'discipline'))
            person.stats.discipline = bounded(person.stats.discipline + operation.amount);
        else if (operation.kind === 'mood')
            person.stats.happiness = bounded(person.stats.happiness + operation.amount);
    }
    offer.status = 'resolved';
    offer.selected = choice.id;
    // Insurance payments already have their own established category; the activity record tracks its separate real spending.
    recordLifestyle(world, { kind: 'story-' + offer.templateId, subjectId: offer.subjectId, participants: [person.id, ...(offer.participantId ? [offer.participantId] : [])], currency: offer.currency, paid: choice.cost, paymentIds, ...(choice.challenge ? { outcomeChance: choice.challenge.chance, outcomeRoll: choice.challenge.roll, success: choice.challenge.roll <= choice.challenge.chance } : {}), body: offer.journalVersion === 1 ? choice.journal! : choice.body }, { journal: offer.journalVersion !== 1 });
    return { title: offer.outputVersion === 1 ? choice.resultTitle! : 'A part of your life', body: choice.body, journal: offer.journalVersion === 1 ? choice.journal! : choice.body, effects: before ? lifestyleConsequenceRows(world, offer, before) : [] };
}
export function cancelLifestyleOffers(world: World, personId: string) { for (const offer of world.lifestyle?.offers ?? [])
    if (offer.personId === personId && offer.status === 'open')
        offer.status = 'cancelled'; }
