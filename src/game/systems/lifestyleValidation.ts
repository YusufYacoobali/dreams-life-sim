import { polishedLifestyleTemplate } from '../content/lifestylePolish';
import { validateLeisurePermission } from './leisureValidation';
import { legacyHobbyKinds, legacyOutingKinds } from '../content/leisure';
import { legacyPetOfferIds } from '../content/pets';
import { lifestyleTemplates } from '../content/lifestyleEvents';
import { assetCatalog } from '../content/assets';
import { licenceQuiz } from './vehicleLicences';
import { vehicleMinimumAge } from './vehicleAgePolicy';
import { rules } from '../rules';
import { roundRatio } from '../money';
import type { World } from '../model';
import { ageOn, compareDates } from '../personHelpers';
import { indexLedger } from '../ledgerIndex';
import { countries } from '../countries';
/** Optional capability never repairs a legacy world or supplies defaults. */
export function validateLifestyle(world: World, ledger = indexLedger(world.ledger)) {
    const state = world.lifestyle, managed = world.assets.some(row => row.propertyLife || row.vehicleLife) || world.pets.some(row => row.companion || row.pricingVersion);
    if (!state) {
        if (managed || world.hobbies.some(row => !(legacyHobbyKinds as readonly string[]).includes(row.kind)) || world.leisureOutings.some(row => !(legacyOutingKinds as readonly string[]).includes(row.kind)) || world.pets.some(row => !(legacyPetOfferIds as readonly string[]).includes(row.offerId)) || world.assets.some(row => assetCatalog.find(offer => offer.id === row.catalogId)?.licenceKind) || ledger.categories('lifestyle-cost', 'lifestyle-transfer', 'lifestyle-deposit').length)
            throw new Error('Lifestyle records require their capability');
        return;
    }
    const now = world.date.year * 12 + world.date.month - 1, at = (date: World['date']) => date.year * 12 + date.month - 1;
    if (compareDates(state.enabled, world.date) > 0)
        throw new Error('Future lifestyle capability');
    const ids = new Set<string>(), used = new Set<string>(), currentAssets = new Set<string>(), currentTenants = new Set<string>();
    const identity = (id: string) => { if (ids.has(id))
        throw new Error('Duplicate lifestyle identity'); ids.add(id); };
    const person = (id: string) => { if (!world.people[id])
        throw new Error('Missing lifestyle participant'); return world.people[id]; };
    const payment = (id: string, personId: string, amount: bigint, currency: string, category: string) => { const row = ledger.positioned.get(id)?.row; if (!row || used.has(id) || row.personId !== personId || row.cashDelta !== amount || row.currency !== currency || row.category !== category || row.debtDelta !== 0n)
        throw new Error('Lifestyle payment does not reconcile with ledger'); used.add(id); return row; };
    const recordsBySubject = new Map<string, typeof state.records>();
    const competitionYears = new Set<string>();
    for (const record of state.records) {
        const list = recordsBySubject.get(record.subjectId) ?? [];
        list.push(record);
        recordsBySubject.set(record.subjectId, list);
    }
    const assetMap = new Map(world.assets.map(asset => [asset.id, asset]));
    for (const asset of world.assets) {
        if (asset.propertyLife) {
            if (asset.kind !== 'property' || compareDates(asset.propertyLife.enabled, world.date) > 0 || compareDates(asset.propertyLife.enabled, state.enabled) < 0 || new Set(asset.propertyLife.amenities.map(row => row.kind)).size !== asset.propertyLife.amenities.length)
                throw new Error('Invalid managed property');
            for (const row of asset.propertyLife.amenities)
                if (row.addedValue > row.paid || compareDates(row.installed, asset.propertyLife.enabled) < 0 || !ledger.positioned.has(row.paymentId) || compareDates(row.installed, world.date) > 0 || ledger.positioned.get(row.paymentId)?.row.cashDelta !== -row.paid || ledger.positioned.get(row.paymentId)?.row.currency !== asset.currency || !(recordsBySubject.get(asset.id) ?? []).some(record => record.kind === 'amenity' && record.paid === row.paid && record.paymentIds.includes(row.paymentId)))
                    throw new Error('Invalid installed amenity');
        }
        if (asset.vehicleLife && (asset.kind !== 'vehicle' || asset.vehicleLife.mileage < asset.vehicleLife.initialMileage || new Set(asset.vehicleLife.upgrades).size !== asset.vehicleLife.upgrades.length || compareDates(asset.vehicleLife.enabled, world.date) > 0))
            throw new Error('Invalid vehicle use history');
        if (asset.vehicleLife) {
            const trips = (recordsBySubject.get(asset.id) ?? []).filter(record => record.distance > 0);
            if (asset.vehicleLife.mileage !== asset.vehicleLife.initialMileage + trips.reduce((sum, record) => sum + record.distance, 0) || asset.vehicleLife.lastUseMonth !== (trips.length ? at(trips.at(-1)!.date) : null))
                throw new Error('Vehicle mileage lacks actual trips');
        }
    }
    const applications = new Map(state.applications.map(row => [row.id, row]));
    for (const row of state.applications) {
        identity(row.id);
        const applicant = person(row.tenantId);
        person(row.landlordId);
        if (!assetMap.get(row.assetId)?.propertyLife || ageOn({ ...applicant, died: null }, row.date) < 18 || row.tenantId === row.landlordId || compareDates(row.date, world.date) > 0 || row.expiresMonth < at(row.date))
            throw new Error('Invalid tenant application');
    }
    for (const row of state.tenancies) {
        identity(row.id);
        const app = applications.get(row.applicationId), asset = assetMap.get(row.assetId);
        person(row.landlordId);
        person(row.tenantId);
        if (!app || app.status !== 'accepted' || app.tenantId !== row.tenantId || app.landlordId !== row.landlordId || app.assetId !== row.assetId || !asset?.propertyLife || asset.currency !== row.currency || row.deposit !== row.rent && row.lastRentReviewMonth === at(row.started) || row.lastMonth > now || row.lastMonth !== at(row.started) + row.periods.length || row.ended && compareDates(row.ended, row.started) < 0)
            throw new Error('Invalid named tenancy');
        payment(row.depositPaymentId, row.tenantId, -row.deposit, row.currency, 'lifestyle-deposit');
        if (row.ended) {
            if (row.depositHeld || !row.endReason || !row.depositRefundId || row.depositRecipientId !== row.tenantId)
                throw new Error('Ended tenancy retains deposit');
            payment(row.depositRefundId, row.tenantId, row.deposit, row.currency, 'lifestyle-deposit-refund');
        }
        else {
            if (row.endReason || row.depositHeld !== row.deposit || row.depositRefundId || row.depositRecipientId || asset.ownerId !== row.landlordId || asset.rental !== 'occupied' || asset.rentPerMonth !== row.rent || currentAssets.has(row.assetId) || currentTenants.has(row.tenantId) || world.people[row.landlordId].died || world.people[row.tenantId].died)
                throw new Error('Invalid active tenancy');
            currentAssets.add(row.assetId);
            currentTenants.add(row.tenantId);
        }
        for (const [index, period] of row.periods.entries()) {
            if (period.month !== at(row.started) + index + 1 || period.paid > period.due || period.month > row.lastMonth || !!period.tenantPaymentId !== (period.paid > 0n) || !!period.landlordPaymentId !== (period.paid > 0n))
                throw new Error('Invalid monthly named rent');
            if (period.paid) {
                const debit = payment(period.tenantPaymentId!, row.tenantId, -period.paid, row.currency, 'lifestyle-transfer'), credit = payment(period.landlordPaymentId!, row.landlordId, period.paid, row.currency, 'lifestyle-transfer');
                if (debit.year * 12 + debit.month - 1 !== period.month || credit.year !== debit.year || credit.month !== debit.month)
                    throw new Error('Rent paid in the wrong month');
            }
        }
        if (row.reviewPaymentId) {
            const receipt = ledger.positioned.get(row.reviewPaymentId)?.row;
            if (!receipt || receipt.personId !== row.landlordId || receipt.cashDelta !== -row.reviewPaid || receipt.category !== 'lifestyle-cost')
                throw new Error('Invalid independent review payment');
        }
        else if (row.reviewPaid || row.reviewMonth !== null)
            throw new Error('Tenancy review lacks payment');
        const discussed = (recordsBySubject.get(row.id) ?? []).filter(record => record.kind === 'tenant-arrears').reduce((sum, record) => sum + record.received, 0n);
        if (row.arrears !== row.periods.reduce((sum, period) => sum + period.due - period.paid, 0n) - discussed)
            throw new Error('Tenancy arrears do not reconcile');
    }
    for (const record of state.records) {
        identity(record.id);
        person(record.personId);
        for (const id of record.participants) { const participant = person(id); if (compareDates(participant.born, record.date) > 0 || participant.died && compareDates(participant.died, record.date) < 0) throw new Error('Lifestyle participant was unavailable on the recorded date'); }
        if (record.invitedId) person(record.invitedId);
        if (record.relatedPetId && !world.pets.some(pet => pet.id === record.relatedPetId && pet.id !== record.subjectId)) throw new Error('Missing related pet');
        if (compareDates(record.date, world.date) > 0 || compareDates(record.date, state.enabled) < 0 || new Set(record.participants).size !== record.participants.length || record.chance === null !== (record.roll === null))
            throw new Error('Invalid lifestyle record');
        let out = 0n, income = 0n;
        for (const id of record.paymentIds) {
            const row = ledger.positioned.get(id)?.row;
            if (!row || used.has(id) || row.year !== record.date.year || row.month !== record.date.month || row.currency !== record.currency || !['lifestyle-cost', 'lifestyle-transfer', 'lifestyle-prize', 'lifestyle-scrap'].includes(row.category))
                throw new Error('Lifestyle history lacks payment');
            used.add(id);
            if (row.personId === record.personId) {
                if (row.cashDelta < 0n)
                    out -= row.cashDelta;
                else
                    income += row.cashDelta;
            }
        }
        if (record.chance !== null && record.accepted !== (record.roll! <= record.chance)) throw new Error('Lifestyle consent differs from its saved draw');
        if (record.accepted === false && (record.paid || record.received || record.distance || record.participants.length > 1) || record.outcomeChance !== undefined && (record.outcomeRoll === undefined || record.success !== (record.kind.startsWith('vehicle-') ? record.outcomeRoll > record.outcomeChance : record.outcomeRoll <= record.outcomeChance)))
            throw new Error('False lifestyle outcome');
        if (record.kind.startsWith('vehicle-') && (!assetMap.get(record.subjectId)?.vehicleLife || record.distance && (record.distance > 1000 || !['vehicle-drive', 'vehicle-road-trip'].includes(record.kind))))
            throw new Error('Vehicle activity lacks its saved asset');
        if (record.kind.startsWith('pet-') && !world.pets.some(pet => pet.id === record.subjectId && pet.companion))
            throw new Error('Pet activity lacks its companion');
        if (record.funding) {
            const funding = record.funding;
            validateLeisurePermission(world, record.personId, funding.payerId, record.date, funding.permission);
            const debit = record.paymentIds.map(id => ledger.positioned.get(id)?.row).filter(row => row && row.cashDelta < 0n);
            if (record.accepted ? debit.reduce((sum, row) => sum - row!.cashDelta, 0n) !== funding.quotedFee || debit.some(row => row!.personId !== funding.payerId) : debit.length > 0)
                throw new Error('Lifestyle activity lacks actual responsible funding');
        }
        if (record.kind === 'hobby-competition') {
            const hobby = world.hobbies.find(hobby => hobby.id === record.subjectId && hobby.personId === record.personId), key = record.personId + ':' + record.subjectId + ':' + record.date.year;
            if (!hobby || !record.funding || competitionYears.has(key) || world.hobbyEvents.some(row => row.personId === record.personId && row.kind === hobby.kind && row.date.year === record.date.year))
                throw new Error('Invalid annual hobby competition');
            competitionYears.add(key);
            if (record.accepted) {
                const terms = record.competition;
                if (!terms || !world.people[terms.peerId] || !record.participants.includes(terms.peerId) || terms.practiceCursor > hobby.practices.length || terms.practiceCursor < 1)
                    throw new Error('Competition lacks actual participants or practice');
                const before = hobby.practices.slice(0, terms.practiceCursor), proficiency = before.at(-1)!.after;
                const chance = Math.max(10, Math.min(90, 25 + Math.floor(proficiency * 0.6) + Math.floor(terms.discipline / 10) - Math.floor(terms.peerDiscipline / 4) + (terms.approach === 'steady' ? 10 : terms.approach === 'bold' ? -10 : 0)));
                const prize = record.success && terms.approach !== 'social' ? record.funding.quotedFee * BigInt(terms.approach === 'bold' ? 4 : 2) : 0n;
                if (proficiency < 20 || before.filter(row => row.source === 'monthly' && row.attended).length < 6 || record.before !== proficiency || record.after !== proficiency || record.outcomeChance !== chance || record.received !== prize)
                    throw new Error('Competition result lacks earned proficiency or actual award');
            }
            else if (record.competition || record.outcomeRoll !== undefined)
                throw new Error('Refused competition cannot have opponents or outcomes');
        }
        if (out !== record.paid || income !== record.received)
            throw new Error('Lifestyle cash summary is false');
    }
    const licenceMonths = new Set<string>(), licenceYears = new Map<string, number>(), passed = new Set<string>();
    for (const row of state.licences) {
        identity(row.id);
        const actor = person(row.personId), key = row.personId + ':' + row.kind, monthKey = key + ':' + at(row.date), yearKey = key + ':' + row.date.year, count = (licenceYears.get(yearKey) ?? 0) + 1;
        const score = row.answers.filter((answer, index) => answer === licenceQuiz[row.kind][index].correct).length;
        const expectedFee = rules[row.country].baseWage * BigInt(row.kind === 'road' ? 2 : row.kind === 'boat' ? 8 : 35) / 10000n || 1n;
        if (passed.has(key) || licenceMonths.has(monthKey) || count > 3 || row.score !== score || row.passed !== (row.score === 3) || row.fee !== expectedFee || ageOn({ ...actor, died: null }, row.date) < vehicleMinimumAge(row.country, row.kind) || compareDates(row.date, world.date) > 0)
            throw new Error('Invalid licence attempt');
        licenceYears.set(yearKey, count);
        licenceMonths.add(monthKey);
        if (row.passed)
            passed.add(key);
        payment(row.paymentId, row.personId, -row.fee, countries[row.country].currency, 'lifestyle-cost');
    }
    for (const project of state.projects) {
        identity(project.id);
        const hobby = world.hobbies.find(hobby => hobby.id === project.hobbyId && hobby.personId === project.personId);
        const rows = (recordsBySubject.get(project.id) ?? []).filter(row => row.kind === 'project-work' || row.kind === 'project-complete');
        if (!hobby || !!project.completed !== (project.progress === 4) || project.lastMonth > now || compareDates(project.started, world.date) > 0 || project.practiceCursor > hobby.practices.length || project.completed && (compareDates(project.completed, project.started) < 0 || compareDates(project.completed, world.date) > 0 || !rows.length || compareDates(project.completed, rows.at(-1)!.date) !== 0)) throw new Error('Invalid hobby project');
        if (project.workVersion !== 2) {
            if (rows.length !== project.progress || rows.some((row, index) => row.before !== index || row.after !== index + 1 || at(row.date) <= (index ? at(rows[index - 1].date) : at(project.started)))) throw new Error('Invalid hobby project');
        } else {
            let cursor = project.initialPracticeCursor, progress = 0, previousMonth = at(project.started);
            if (cursor === undefined || cursor > hobby.practices.length) throw new Error('Missing project practice origin');
            for (const row of rows) {
                const session = row.projectSession;
                if (!session || session.practiceBefore !== cursor || session.practiceAfter > hobby.practices.length || session.practiceAfter < cursor || row.before !== progress || at(row.date) <= previousMonth) throw new Error('Invalid project work session');
                const actual = hobby.practices.slice(cursor, session.practiceAfter);
                const attended = actual.filter(practice => practice.attended && practice.source === 'monthly').length;
                const earned = Math.min(4 - progress, attended);
                if (!earned || session.months !== earned || row.after !== progress + earned || actual.some(practice => compareDates(practice.date, row.date) > 0 || practice.attended && practice.source === 'monthly' && compareDates(practice.date, project.started) <= 0)) throw new Error('Project work lacks actual practice');
                progress += earned; cursor = session.practiceAfter; previousMonth = at(row.date);
            }
            if (progress !== project.progress || cursor !== project.practiceCursor || previousMonth !== project.lastMonth) throw new Error('Project progress does not reconcile');
        }
    }
    const offerMap = new Map(state.offers.map(offer => [offer.id, offer]));
    for (const offer of state.offers) {
        identity(offer.id);
        person(offer.personId);
        if (offer.participantId)
            person(offer.participantId);
        const published = lifestyleTemplates.find(template => template.id === offer.templateId);
        const template = published && (offer.copyVersion === 2 ? polishedLifestyleTemplate(published) : published);
        const revised = offer.journalVersion === 1;
        if (revised !== (offer.outputVersion === 1) || revised !== (offer.copyVersion === 2) || offer.choices.some(choice => revised ? !choice.journal || !/^I\b/.test(choice.journal) || !choice.resultTitle : choice.journal !== undefined || choice.resultTitle !== undefined)) throw new Error('Incomplete lifestyle presentation revision');
        for (const choice of offer.choices) {
            const operation = choice.operations.find(operation => operation.kind === 'hobby-challenge');
            if (!!operation !== !!choice.challenge)
                throw new Error('Incomplete informal hobby challenge');
            if (choice.challenge && operation) {
                const terms = choice.challenge, hobby = world.hobbies.find(hobby => hobby.id === offer.subjectId && hobby.personId === offer.personId);
                const earned = hobby?.practices.slice(0, terms.practiceCursor).at(-1)?.after;
                if (!hobby || terms.practiceCursor > hobby.practices.length || terms.proficiency !== earned || terms.chance !== Math.max(10, Math.min(90, 25 + Math.floor(terms.proficiency / 2) + Math.floor(terms.discipline / 10) + operation.amount)))
                    throw new Error('Informal challenge lacks earned proficiency');
            }
        }
        if (!template || template.choices.length !== offer.choices.length || offer.choices.some((choice, index) => { const authored = template.choices[index]; return choice.id !== authored.id || choice.label !== authored.label || choice.cost !== roundRatio(rules[offer.country].baseWage * BigInt(authored.costBps), 10000n) || JSON.stringify(choice.operations) !== JSON.stringify(authored.operations); }) || compareDates(offer.date, world.date) > 0 || (offer.status === 'resolved') !== !!offer.selected || offer.selected && !offer.choices.some(choice => choice.id === offer.selected))
            throw new Error('Invalid lifestyle story');
    }
    for (const pet of world.pets)
        if (pet.companion) {
            const life = pet.companion;
        if (life.healthVersion === 2 && (typeof life.ageRelated !== 'boolean' || typeof life.supportUntil !== 'number' || life.ageRelated && !['ageing', 'recovering'].includes(life.condition) || life.condition === 'ageing' && !life.ageRelated)) throw new Error('Invalid age-related pet care');
            if (compareDates(life.enabled, state.enabled) < 0 || compareDates(life.enabled, world.date) > 0 || life.lastHealthMonth > now || new Set(life.tricks).size !== life.tricks.length || (life.condition === 'recovering') !== (life.recovery > 0))
                throw new Error('Invalid companion profile');
            let training = 0;
            for (const row of recordsBySubject.get(pet.id) ?? []) {
                if (row.kind === 'pet-train' && row.accepted) {
                    if (row.before !== training || row.after !== Math.min(100, training + (row.success ? 8 : 2)) || row.outcomeChance === undefined || row.outcomeRoll === undefined)
                        throw new Error('Pet training lacks actual practice');
                    training = row.after;
                }
                else if (row.kind.startsWith('story-')) {
                    const offer = state.offers.find(offer => offer.templateId === row.kind.slice(6) && offer.subjectId === pet.id && offer.status === 'resolved' && at(offer.date) <= at(row.date) && offer.choices.some(choice => choice.id === offer.selected && (offer.journalVersion === 1 ? choice.journal : choice.body) === row.body));
                    for (const operation of offer?.choices.find(choice => choice.id === offer.selected)?.operations ?? [])
                        if (operation.kind === 'training')
                            training = Math.min(100, Math.max(0, training + operation.amount));
                }
            }
            if (life.training !== training)
                throw new Error('Companion training does not reconcile');
        }
    for (const pending of [world.pending, ...world.deferred.map(row => row.event)])
        if (pending?.kind === 'decision')
            for (const choice of pending.choices)
                for (const effect of choice.effects)
                    if (effect.kind === 'lifestyle-choice') {
                        const offer = offerMap.get(effect.offerId);
                        if (!offer || offer.status !== 'open' || pending.id !== offer.id || !offer.choices.some(row => row.id === effect.choiceId))
                            throw new Error('Lifestyle decision lacks its saved offer');
                        const saved = offer.choices.find(row => row.id === effect.choiceId)!;
                        if (offer.journalVersion === 1 && (choice.journal !== saved.journal || choice.resultBody !== saved.body || choice.resultTitle !== saved.resultTitle)) throw new Error('Lifestyle decision lost its frozen presentation');
                    }
    for (const row of ledger.categories('lifestyle-cost', 'lifestyle-transfer', 'lifestyle-prize', 'lifestyle-scrap', 'lifestyle-deposit', 'lifestyle-deposit-refund'))
        if (!used.has(row.id))
            throw new Error('Lifestyle ledger row lacks its saved action');
}
