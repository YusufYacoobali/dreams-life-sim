import { randomInteger } from '../../src/game/random';
import { rules } from '../../src/game/rules';
import { lifestyleFixture, act } from '../helpers/lifestyle';
import { hobbyContent, hobbyKinds, type HobbyKind } from '../../src/game/content/leisure';
import { hobbyFee, leisureMonth, hobbyContacts } from '../../src/game/systems/leisure';
import { competitionFee, hobbyMilestone } from '../../src/game/systems/hobbyAccomplishments';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { monthFrom } from '../../src/game/calendar';
import { accountFor, post } from '../../src/game/systems/common';
function prepared(kind: HobbyKind = 'writing') { let world = lifestyleFixture(); world = act(world, { type: 'hobby-plan', kind, mode: 'community', reviewedPayerId: world.activePersonId, quotedMonthlyFee: hobbyFee(world.people[world.activePersonId].country, kind, 'community') }); for (let i = 0; i < 12; i++) {
    world.date = monthFrom(world.date, 1);
    leisureMonth(world);
} return validateWorld(world); }
test.each(hobbyKinds)('%s competitions use earned proficiency, a real named opponent and an actual saved prize or loss', kind => { const original = prepared(kind), fee = competitionFee(original, kind), cash = accountFor(original).cash, world = act(original, { type: 'hobby-competition', kind, approach: 'steady', reviewedPayerId: original.activePersonId, quotedFee: fee }), record = world.lifestyle!.records.at(-1)!; expect(record.competition?.peerId).toBeDefined(); expect(world.people[record.competition!.peerId]).toBeDefined(); expect(record.before).toBe(24); expect(record.received).toBe(record.success ? fee * 2n : 0n); expect(accountFor(world).cash).toBe(cash - fee + record.received); expect(world.hobbies[0].proficiency).toBe(24); expect(decodeWorld(encodeWorld(world))).toEqual(world); expect(() => act(world, { type: 'hobby-competition', kind, approach: 'bold', reviewedPayerId: world.activePersonId, quotedFee: fee })).toThrow(/per hobby/); });
test('a finished personal project needs four later attended months, retains its history and creates no saleable asset', () => { let world = prepared(); world = act(world, { type: 'start-hobby-project', hobbyId: world.hobbies[0].id, title: 'A short story about the last bus' }); const projectId = world.lifestyle!.projects[0].id, assets = structuredClone(world.assets); expect(() => act(world, { type: 'work-hobby-project', projectId })).toThrow(/another month/); for (let i = 0; i < 4; i++) {
    world.date = monthFrom(world.date, 1);
    leisureMonth(world);
    world = act(world, { type: 'work-hobby-project', projectId });
} expect(world.lifestyle!.projects[0]).toMatchObject({ progress: 4, completed: world.date }); expect(world.assets).toEqual(assets); expect(decodeWorld(encodeWorld(world))).toEqual(world); });
test('unattended and repeated work sessions cannot fabricate project progress', () => { let world = prepared(); world = act(world, { type: 'start-hobby-project', hobbyId: world.hobbies[0].id, title: 'One actual project' }); world.date = monthFrom(world.date, 1); const payer = accountFor(world); post(world, -payer.cash, 0n, 'unit-drawdown', 'Explicit unit fixture'); leisureMonth(world); expect(() => act(world, { type: 'work-hobby-project', projectId: world.lifestyle!.projects[0].id })).toThrow(/another month/); });
test('a free casual session and a park visit work without property, vehicles, income or spare cash', () => { let world = lifestyleFixture(); const cash = accountFor(world); post(world, -cash.cash, 0n, 'unit-drawdown', 'Explicit unit fixture'); world = act(world, { type: 'casual-hobby', kind: 'reading' }); expect(accountFor(world).cash).toBe(0n); expect(world.hobbies).toEqual([]); world = act(world, { type: 'leisure-outing', kind: 'park', reviewedPayerId: world.activePersonId, quotedTotal: 0n }); expect(world.leisureOutings.at(-1)).toMatchObject({ paid: 0n, paymentId: null, consent: { accepted: true } }); expect(world.assets).toHaveLength(0); expect(decodeWorld(encodeWorld(world))).toEqual(world); });
test('proficiency milestones describe earned thresholds without awarding qualifications or money', () => { expect([0, 15, 40, 70, 90].map(hobbyMilestone)).toEqual(['Beginner', 'Developing', 'Skilled', 'Expert', 'Master']); });
test('a tampered prize or fabricated project session is rejected on import', () => { const original = prepared(); let world = act(original, { type: 'hobby-competition', kind: 'writing', approach: 'steady', reviewedPayerId: original.activePersonId, quotedFee: competitionFee(original, 'writing') }); world.lifestyle!.records.at(-1)!.before = 100; expect(() => validateWorld(world)).toThrow(/proficiency/); world = act(original, { type: 'start-hobby-project', hobbyId: original.hobbies[0].id, title: 'A project' }); world.lifestyle!.projects[0].progress = 1; expect(() => validateWorld(world)).toThrow(/project/i); });

test('one project review can finish four genuinely attended later months without a four-year tap chain', () => {
    let world = prepared();
    world = act(world, { type: 'start-hobby-project', hobbyId: world.hobbies[0].id, title: 'A complete little story' });
    const projectId = world.lifestyle!.projects[0].id;
    for (let index = 0; index < 4; index++) { world.date = monthFrom(world.date, 1); leisureMonth(world); }
    const proficiency = world.hobbies[0].proficiency;
    world = act(world, { type: 'work-hobby-project', projectId });
    expect(world.lifestyle!.projects[0]).toMatchObject({ workVersion: 2, progress: 4, completed: world.date });
    expect(world.lifestyle!.records.at(-1)!.projectSession?.months).toBe(4);
    expect(world.hobbies[0].proficiency).toBe(proficiency);
    expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('a new shared memory preserves an existing introduction and long relationship history', () => {
    let world = prepared(); const hobby = world.hobbies[0], plan = hobby.plans.find(plan => plan.status === 'active')!;
    world = act(world, { type: 'meet-hobby-peer', hobbyId: hobby.id, planId: plan.id, reviewedPayerId: plan.payerId, reviewedMonth: world.date.year * 12 + world.date.month - 1 });
    const peer = hobbyContacts(world, world.hobbies[0])[0], edge = world.relationships.find(row => [row.from, row.to].includes(peer.id) && [row.from, row.to].includes(world.activePersonId))!;
    // Explicit unit history: these entries represent already-retained older memories.
    const original = [...edge.memories, ...Array.from({ length: 105 }, (_, index) => 'existing-history:' + index)]; edge.memories = [...original];
    const chance = Math.min(95, 35 + Math.floor(edge.strength / 2)); world.random.npcs = Array.from({ length: 1000 }, (_, index) => index + 1).find(seed => randomInteger(seed, 1, 100).value <= chance)!;
    world = act(world, { type: 'shared-hobby-practice', hobbyId: hobby.id, contactId: peer.id });
    expect(hobbyContacts(world, world.hobbies[0]).map(person => person.id)).toContain(peer.id);
    expect(world.relationships.find(row => row.id === edge.id)!.memories.slice(0, original.length)).toEqual(original);
});


test.each([true, false])('shared tickets save actual acceptance %s without charging or claiming attendance for a refusal', accepted => {
    const world = lifestyleFixture(), contact = world.people.person_parent1;
    const edge = world.relationships.find(row => [row.from, row.to].includes(world.activePersonId) && [row.from, row.to].includes(contact.id))!;
    const chance = Math.min(95, 35 + Math.floor(edge.strength / 2));
    world.random.npcs = Array.from({ length: 1000 }, (_, index) => index + 1).find(seed => (randomInteger(seed, 1, 100).value <= chance) === accepted)!;
    const draw = randomInteger(world.random.npcs, 1, 100), payerCash = accountFor(world).cash, contactCash = accountFor(world, contact).cash;
    const fee = rules[world.people[world.activePersonId].country].baseWage * 12n / 10000n * 2n;
    const command = { type: 'shared-leisure-outing' as const, kind: 'theatre' as const, contactId: contact.id, reviewedPayerId: world.activePersonId, quotedFee: fee };
    const next = act(world, command), record = next.lifestyle!.records.at(-1)!;
    expect(record).toMatchObject({ accepted, chance, roll: draw.value, invitedId: contact.id, paid: accepted ? fee : 0n });
    expect(record.participants).toEqual(accepted ? [world.activePersonId, contact.id] : [world.activePersonId]);
    expect(record.paymentIds).toHaveLength(accepted ? 1 : 0);
    expect(accountFor(next).cash).toBe(payerCash - (accepted ? fee : 0n));
    expect(accountFor(next, next.people[contact.id]).cash).toBe(contactCash);
    expect(next.random.npcs).toBe(draw.state);
    const restored = decodeWorld(encodeWorld(next));
    expect(restored).toEqual(next);
    expect(() => act(restored, command)).toThrow(/venue per month/);
    expect(() => act(restored, { type: 'leisure-outing', kind: 'theatre', reviewedPayerId: world.activePersonId, quotedTotal: fee / 2n })).toThrow(/once per month|already|visit/i);
});
