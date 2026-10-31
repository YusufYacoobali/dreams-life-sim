import { decodeWorld, encodeWorld } from '../../src/game/model';
import { assetCatalog } from '../../src/game/content/assets';
import { purchaseReason, purchaseQuote } from '../../src/game/systems/assets';
import { amenityQuote } from '../../src/game/systems/propertyAmenities';
import { askingRent } from '../../src/game/systems/landlordTenancies';
import { licenceFee } from '../../src/game/systems/vehicleLicences';
import { vehicleActivityCost } from '../../src/game/systems/vehicleActivities';
import { petAdoptionFee, petAdoptionOwner, petCareReason, petVetCost } from '../../src/game/systems/pets';
import { petActivityCost, petActivityReason } from '../../src/game/systems/petTraining';
import { competitionFee, competitionReason } from '../../src/game/systems/hobbyAccomplishments';
import { hobbyFee, hobbyIntroductionReason } from '../../src/game/systems/leisure';
import { accountFor, availableCash } from '../../src/game/systems/common';
import { localContactReason } from '../../src/game/systems/lifestyleCommon';
import { childrenOf } from '../../src/game/systems/family';
import { lifestyleJourney } from '../support/lifestyleJourney';
import graduate from '../fixtures/v3-employed-graduate.json';
import familyBirth from '../fixtures/v6-birth-result.json';
test('property investor: real earned funds/mortgage, improvement, named rent, maintenance, arrears, reviewed ending and sale survive actual closed-connection saves', async () => {
    const run = await lifestyleJourney(decodeWorld(JSON.stringify(graduate)));
    try {
        await run.act({ type: 'enable-lifestyle' }, true);
        const offer = assetCatalog.find(row => row.id === 'mobile-home')!;
        for (let year = 0; purchaseReason(run.world, offer, 'mortgage') && year < 10; year++)
            await run.year();
        expect(purchaseReason(run.world, offer, 'mortgage')).toBeUndefined();
        const quote = purchaseQuote(run.world, offer, 'mortgage');
        await run.act({ type: 'buy-asset', catalogId: offer.id, financing: 'mortgage', depositBps: 2000, termMonths: 360, quotedPrice: quote.price }, true);
        const id = run.world.assets.at(-1)!.id;
        await run.act({ type: 'enable-property-management', assetId: id });
        const cost = amenityQuote(run.world.assets.at(-1)!, 'kitchen').cost;
        for (let year = 0; availableCash(accountFor(run.world)) < cost && year < 5; year++)
            await run.year();
        await run.act({ type: 'install-amenity', assetId: id, amenity: 'kitchen', quotedCost: cost }, true);
        await run.act({ type: 'find-tenants', assetId: id, quotedRent: askingRent(run.world.assets.at(-1)!) });
        const app = run.world.lifestyle!.applications.find(row => row.funds >= run.world.assets.at(-1)!.rentPerMonth * 2n)!;
        await run.act({ type: 'review-tenant', applicationId: app.id, action: 'check', quotedDeposit: run.world.assets.at(-1)!.rentPerMonth });
        await run.act({ type: 'review-tenant', applicationId: app.id, action: 'accept', quotedDeposit: run.world.assets.at(-1)!.rentPerMonth }, true);
        const tenancyId = run.world.lifestyle!.tenancies[0].id;
        for (let year = 0; year < 3; year++) {
            await run.year();
            const row = run.world.lifestyle!.tenancies[0];
            if (row.ended)
                break;
            await run.act({ type: 'manage-tenancy', tenancyId, action: 'inspect', quotedAmount: 0n });
            if (run.world.lifestyle!.tenancies[0].maintenance)
                await run.act({ type: 'manage-tenancy', tenancyId, action: 'repair', quotedAmount: run.world.lifestyle!.tenancies[0].maintenance }, true);
            if (run.world.lifestyle!.tenancies[0].arrears)
                await run.act({ type: 'manage-tenancy', tenancyId, action: 'discuss', quotedAmount: 0n }, true);
        }
        expect(run.world.lifestyle!.tenancies[0].periods.length).toBeGreaterThanOrEqual(12);
        expect(run.world.lifestyle!.tenancies[0].periods.some(row => row.paid < row.due)).toBe(true);
        await run.act({ type: 'manage-tenancy', tenancyId, action: 'notice', quotedAmount: 0n });
        await run.year();
        if (run.world.lifestyle!.tenancies[0].maintenance)
            await run.act({ type: 'manage-tenancy', tenancyId, action: 'repair', quotedAmount: run.world.lifestyle!.tenancies[0].maintenance });
        await run.act({ type: 'manage-tenancy', tenancyId, action: 'end', quotedAmount: 0n }, true);
        expect(run.world.lifestyle!.tenancies[0].depositHeld).toBe(0n);
        expect(run.world.lifestyle!.tenancies[0].depositRefundId).toBeTruthy();
        await run.act({ type: 'list-property', assetId: id, askingPrice: run.world.assets.at(-1)!.value * 9n / 10n });
        for (let year = 0; run.world.assets.at(-1)!.ownerId === run.world.activePersonId && year < 5; year++)
            await run.year();
        expect(run.world.assets.at(-1)!.ownerId).toBeNull();
        expect(run.world.assets.at(-1)!.provenance.some(row => row.startsWith('Sold'))).toBe(true);
        await run.branch();
        run.evidence('property-investor');
    }
    finally {
        run.close();
    }
}, 180000);
test('vehicle enthusiast: licence, actual purchase/trip, wear, paid service/repair/upgrade and sale persist without patched funds or distance', async () => {
    const run = await lifestyleJourney(decodeWorld(JSON.stringify(graduate)));
    try {
        await run.act({ type: 'enable-lifestyle' });
        await run.act({ type: 'take-licence-test', kind: 'road', answers: [1, 2, 0], quotedFee: licenceFee(run.world, 'road') }, true);
        const offer = assetCatalog.find(row => row.id === 'used-compact')!;
        for (let year = 0; purchaseReason(run.world, offer, 'cash') && year < 5; year++)
            await run.year();
        await run.act({ type: 'buy-asset', catalogId: offer.id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: purchaseQuote(run.world, offer, 'cash').price });
        const id = run.world.assets.at(-1)!.id;
        await run.act({ type: 'enable-vehicle-activities', assetId: id });
        for (const activity of ['road-trip', 'service', 'repair', 'brakes'] as const)
            await run.act({ type: 'vehicle-activity', assetId: id, activity, contactId: null, quotedCost: vehicleActivityCost(run.world, run.world.assets.at(-1)!, activity) }, true);
        expect(run.world.assets.at(-1)!.vehicleLife!.mileage).toBe(68300);
        expect(run.world.assets.at(-1)!.vehicleLife!.upgrades).toEqual(['brakes']);
        const target = Object.values(run.world.people).find(person => !localContactReason(run.world, person.id));
        if (target) {
            await run.act({ type: 'vehicle-activity', assetId: id, activity: 'gift', contactId: target.id, quotedCost: 0n }, true);
        }
        if (run.world.assets.at(-1)!.ownerId === run.world.activePersonId) {
            const { saleQuote } = await import('../../src/game/systems/assetQuotes');
            await run.act({ type: 'sell-asset', assetId: id, quotedPrice: saleQuote(run.world, run.world.assets.at(-1)!).price }, true);
        }
        expect(run.world.assets.at(-1)!.ownerId).not.toBe(run.world.activePersonId);
        run.evidence('vehicle-enthusiast');
    }
    finally {
        run.close();
    }
}, 180000);
test('hobby specialist: actual paid practice, introduction, competition and completed project survive each cold command and Time Machine branching', async () => {
    const run = await lifestyleJourney(decodeWorld(JSON.stringify(graduate)));
    try {
        await run.act({ type: 'enable-lifestyle' });
        await run.act({ type: 'hobby-plan', kind: 'writing', mode: 'community', reviewedPayerId: run.world.activePersonId, quotedMonthlyFee: hobbyFee(run.world.people[run.world.activePersonId].country, 'writing', 'community') }, true);
        for (let year = 0; competitionReason(run.world, 'writing') && year < 5; year++)
            await run.year();
        expect(competitionReason(run.world, 'writing')).toBeUndefined();
        const hobby = run.world.hobbies.find(row => row.kind === 'writing')!;
        expect(hobby.practices.filter(row => row.attended && row.source === 'monthly').length).toBeGreaterThanOrEqual(6);
        const plan = hobby.plans.find(row => row.status === 'active')!;
        expect(hobbyIntroductionReason(run.world, hobby, plan)).toBeUndefined();
        await run.act({ type: 'meet-hobby-peer', hobbyId: hobby.id, planId: plan.id, reviewedPayerId: plan.payerId, reviewedMonth: run.world.date.year * 12 + run.world.date.month - 1 }, true);
        await run.act({ type: 'hobby-competition', kind: 'writing', approach: 'bold', reviewedPayerId: run.world.activePersonId, quotedFee: competitionFee(run.world, 'writing') }, true);
        await run.act({ type: 'start-hobby-project', hobbyId: hobby.id, title: 'The last bus out of town' });
        const id = run.world.lifestyle!.projects[0].id;
        for (let part = 0; !run.world.lifestyle!.projects[0].completed && part < 4; part++) {
            await run.year();
            await run.act({ type: 'work-hobby-project', projectId: id }, true);
        }
        expect(run.world.lifestyle!.projects[0].completed).toBeTruthy();
        expect(run.world.lifestyle!.records.find(row => row.kind === 'hobby-competition')!.competition?.peerId).toBeTruthy();
        const branch = await run.branch();
        expect(branch.lifestyle).toBeDefined();
        run.evidence('hobby-specialist');
    }
    finally {
        run.close();
    }
}, 180000);
test('pet owner and ordinary family: genuine adopted companion, earned training, actual illness care, death, estate and existing-child continuation retain histories', async () => {
    const run = await lifestyleJourney(decodeWorld(JSON.stringify(familyBirth)));
    try {
        await run.settle();
        await run.act({ type: 'enable-lifestyle' });
        await run.act({ type: 'leisure-outing', kind: 'park', reviewedPayerId: run.world.activePersonId, quotedTotal: 0n });
        await run.act({ type: 'adopt-pet', offerId: 'olive', name: 'Olive', reviewedOwnerId: petAdoptionOwner(run.world)!.id, quotedFee: petAdoptionFee(run.world, 'olive') }, true);
        const petId = run.world.pets.at(-1)!.id;
        await run.act({ type: 'pet-activity', petId, activity: 'train', otherId: null, quotedFee: 0n, reviewedOwnerId: run.world.pets.at(-1)!.ownerId }, true);
        let treated = false;
        const treat = async () => { const pet = run.world.pets.find(pet => pet.id === petId)!; if (pet.status !== 'active')
            return false; if (pet.illness === 'infection' && !petCareReason(run.world, pet, 'vet')) {
            await run.command({ type: 'pet-vet', petId, reviewedOwnerId: pet.ownerId, quotedFee: petVetCost(pet.country) }, true);
            treated = true;
            return true;
        } if (pet.companion!.condition !== 'well' && !petActivityReason(run.world, pet, 'treat')) {
            await run.command({ type: 'pet-activity', petId, activity: 'treat', otherId: null, quotedFee: petActivityCost(run.world, pet, 'treat'), reviewedOwnerId: pet.ownerId }, true);
            treated = true;
            return true;
        } return false; };
        for (let year = 0; !treated && year < 10; year++) {
            await run.year(treat);
            if (!run.world.pending && !run.world.annual) {
                await treat();
                await run.settle();
            }
        }
        expect(treated).toBe(true);
        const history = run.world.pets.find(pet => pet.id === petId)!;
        expect(history.status).toBe('active');
        expect(history.companion!.training).toBeGreaterThan(0);
        const ownerId = run.world.activePersonId, child = childrenOf(run.world, ownerId).find(child => !child.died)!;
        expect(child).toBeDefined();
        await run.act({ type: 'end-life', lifeId: run.world.id, personId: ownerId, expectedRevision: run.world.revision }, true);
        const after = run.world.pets.find(pet => pet.id === petId)!;
        expect(after.ownerId).not.toBe(ownerId);
        expect(after.owners).toHaveLength(2);
        expect(run.world.estates.some(estate => estate.personId === ownerId)).toBe(true);
        await run.command({ type: 'continue-child', personId: child.id }, true);
        expect(run.world.activePersonId).toBe(child.id);
        expect(run.world.generation).toBe(2);
        expect(run.world.pets.find(pet => pet.id === petId)!.owners).toEqual(after.owners);
        expect(run.world.lifestyle!.records.some(row => row.personId === ownerId && row.kind === 'pet-train')).toBe(true);
        run.evidence('pet-family-succession');
    }
    finally {
        run.close();
    }
}, 180000);

test('multiple generations retain real home improvements, vehicle mileage, a family pet and the deceased hobby history without copying licences or proficiency', async () => {
    const run = await lifestyleJourney(decodeWorld(JSON.stringify(familyBirth)));
    try {
        await run.settle();
        await run.act({ type: 'enable-lifestyle' });
        const homeOffer = assetCatalog.find(row => row.id === 'mobile-home')!;
        const carOffer = assetCatalog.find(row => row.id === 'used-compact')!;
        for (let year = 0; (purchaseReason(run.world, homeOffer, 'mortgage') || availableCash(accountFor(run.world)) < purchaseQuote(run.world, homeOffer, 'mortgage').price * 2n + purchaseQuote(run.world, carOffer, 'cash').cashRequired) && year < 10; year++) await run.year();
        await run.act({ type: 'buy-asset', catalogId: homeOffer.id, financing: 'mortgage', depositBps: 2000, termMonths: 360, quotedPrice: purchaseQuote(run.world, homeOffer, 'mortgage').price });
        const homeId = run.world.assets.at(-1)!.id;
        await run.act({ type: 'enable-property-management', assetId: homeId });
        await run.act({ type: 'install-amenity', assetId: homeId, amenity: 'kitchen', quotedCost: amenityQuote(run.world.assets.at(-1)!, 'kitchen').cost });
        await run.act({ type: 'take-licence-test', kind: 'road', answers: [1, 2, 0], quotedFee: licenceFee(run.world, 'road') });
        await run.act({ type: 'buy-asset', catalogId: carOffer.id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: purchaseQuote(run.world, carOffer, 'cash').price });
        const carId = run.world.assets.at(-1)!.id;
        await run.act({ type: 'enable-vehicle-activities', assetId: carId });
        await run.act({ type: 'vehicle-activity', assetId: carId, activity: 'drive', contactId: null, quotedCost: vehicleActivityCost(run.world, run.world.assets.at(-1)!, 'drive') });
        await run.act({ type: 'adopt-pet', offerId: 'olive', name: 'Olive', reviewedOwnerId: run.world.activePersonId, quotedFee: petAdoptionFee(run.world, 'olive') });
        const petId = run.world.pets.at(-1)!.id;
        await run.act({ type: 'pet-activity', petId, activity: 'train', otherId: null, quotedFee: 0n, reviewedOwnerId: run.world.activePersonId });
        await run.act({ type: 'hobby-plan', kind: 'writing', mode: 'community', reviewedPayerId: run.world.activePersonId, quotedMonthlyFee: hobbyFee(run.world.people[run.world.activePersonId].country, 'writing', 'community') });
        await run.year();
        const oldId = run.world.activePersonId, child = childrenOf(run.world, oldId).find(person => !person.died)!;
        const marriage = run.world.marriages.find(row => !row.ended && (row.a === oldId || row.b === oldId))!, spouseId = marriage.a === oldId ? marriage.b : marriage.a;
        await run.act({ type: 'save-will', executorId: spouseId, shares: [{ personId: child.id, bps: 10000 }], bequests: [{ assetId: homeId, personId: child.id }, { assetId: carId, personId: child.id }] });
        const home = run.world.assets.find(asset => asset.id === homeId)!, car = run.world.assets.find(asset => asset.id === carId)!, pet = run.world.pets.find(pet => pet.id === petId)!, hobby = run.world.hobbies.find(row => row.personId === oldId && row.kind === 'writing')!;
        expect(hobby.proficiency).toBeGreaterThan(0);
        await run.act({ type: 'end-life', lifeId: run.world.id, personId: oldId, expectedRevision: run.world.revision }, true);
        const inheritedHome = run.world.assets.find(asset => asset.id === homeId)!, inheritedCar = run.world.assets.find(asset => asset.id === carId)!;
        expect(inheritedHome.ownerId).toBe(child.id); expect(inheritedCar.ownerId).toBe(child.id);
        expect(inheritedHome.ownershipSource).toBe('inheritance'); expect(inheritedHome.propertyLife).toEqual(home.propertyLife);
        expect(inheritedCar.vehicleLife).toEqual(car.vehicleLife);
        await run.command({ type: 'continue-child', personId: child.id }, true);
        expect(run.world.hobbies.find(row => row.id === hobby.id)!.proficiency).toBe(hobby.proficiency);
        expect(run.world.hobbies.some(row => row.personId === child.id)).toBe(false);
        expect(run.world.lifestyle!.licences.some(row => row.personId === child.id)).toBe(false);
        expect(run.world.pets.find(row => row.id === petId)!.companion!.training).toBe(pet.companion!.training);
        expect(run.world.pets.find(row => row.id === petId)!.ownerId).toBe(spouseId);
        run.evidence('multiple-generations');
    } finally { run.close(); }
}, 180000);
