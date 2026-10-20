import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { accountFor, post as ledgerPost } from '../../src/game/systems/common';
import { monetisationReason, socialMonth, topicReason } from '../../src/game/systems/social';
import { randomInteger } from '../../src/game/random';
import { monthFrom } from '../../src/game/calendar';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { countryCodes, countries } from '../../src/game/countries';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { addChild } from '../../src/game/systems/family';
import { childrenOf, divorceQuote, familyFinanceMonth } from '../../src/game/systems/family';
import marriageFixture from '../fixtures/v5-marriage-result.json';
import graduateFixture from '../fixtures/v3-employed-graduate.json';
import courtArchive from '../fixtures/v9-court-archive.json';
function fixture() { const world = decodeWorld(JSON.stringify(graduateFixture)), account = accountFor(world); account.cash += 100000000n; account.openingCash += 100000000n; world.people[world.activePersonId].stats.energy = 100; return world; }
function choose(world: World, id: string) { if (world.pending?.kind !== 'decision') throw new Error('Expected a decision'); return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: id }); }
function drain(input: World): World { let world = input, count = 0; while (world.pending && count++ < 100) { if (world.pending.kind === 'result') world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }); else { const choice = world.pending.choices.find(item => !choiceUnavailable(world, item)); if (!choice) throw new Error('No available option'); world = choose(world, choice.id); } } return world; }
function accountWorld() { return drain(resolveCommand(fixture(), { type: 'create-social', platform: 'photogram', handle: 'dreaming_daily', bio: 'One actual life.' })); }
function responseSeed(kind: 'viral' | 'steady' | 'controversial') { for (let state = 0; state < 10000; state++) { const first = randomInteger(state, 20, 120), value = randomInteger(first.state, 1, 1000).value; if (kind === 'viral' ? value > 975 : kind === 'controversial' ? value <= 8 : value > 300 && value < 800 && first.value >= 40 && first.value <= 85) return state; } throw new Error('No response seed'); }
function post(world: World, response: 'viral' | 'steady' | 'controversial' = 'steady') { world.random.outcomes = responseSeed(response); return resolveCommand(world, { type: 'publish-post', accountId: world.socialAccounts[0].id, kind: 'photo', intent: 'authentic', sponsored: false, caption: 'An original moment.' }); }
function established() { let world = accountWorld(); for (let i = 0; i < 24 && (world.socialAccounts[0].followers < 5000 || i < 6); i++) { if (i && i % 6 === 0) { world.date.year++; world.people[world.activePersonId].stats.energy = 100; } world = drain(post(world, 'viral')); } expect(world.socialAccounts[0].followers).toBeGreaterThan(5000); return world; }
test('a genuine v9 archive preserves medical/court priority, paid counsel, held bail, cursor and random streams', () => {
  const archive = decodeSave(JSON.stringify(courtArchive)), world = archive.world; expect(world.schemaVersion).toBe(31); expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('medical-emergency'); expect(world.deferred[0].event.kind === 'decision' && world.deferred[0].event.templateId).toBe('court-hearing'); expect(world.cases[0].counsel).toBe('private'); expect(world.cases[0].bailState).toBe('held'); expect(world.socialAccounts).toEqual([]); expect(world.people[world.activePersonId].publicLife.earnedFame).toBe(0); expect(unpackCheckpoint(archive.snapshots[0].payload)).toEqual(world);
});
test('a new profile begins with no manufactured audience or post history, and cannot be recreated for a reset', () => {
  let world = accountWorld(), account = world.socialAccounts[0]; expect(account.followers).toBe(0); expect(account.totalPosts).toBe(0); expect(account.posts).toEqual([]);
  world = drain(resolveCommand(world, { type: 'delete-social', accountId: account.id })); expect(() => resolveCommand(world, { type: 'create-social', platform: 'photogram', handle: 'different_handle', bio: '' })).toThrow(/already exists/);
  world = drain(resolveCommand(world, { type: 'reopen-social', accountId: account.id })); expect(world.socialAccounts[0].id).toBe(account.id); expect(world.socialAccounts[0].followers).toBe(0); validateWorld(world);
});
test('closing and reopening cannot erase a suspension, and the same profile becomes usable after its actual end date', () => {
  let world = accountWorld(); for (let index = 0; index < 3; index++) world = drain(post(world, 'controversial')); const id = world.socialAccounts[0].id, until = world.socialAccounts[0].suspendedUntil;
  expect(world.socialAccounts[0].status).toBe('suspended'); world = drain(resolveCommand(world, { type: 'delete-social', accountId: id })); world = drain(resolveCommand(world, { type: 'reopen-social', accountId: id })); expect(world.socialAccounts[0].status).toBe('suspended'); expect(world.socialAccounts[0].suspendedUntil).toBe(until);
  world = drain(resolveCommand(world, { type: 'delete-social', accountId: id })); world.date = monthFrom(world.date, 3, world.date.day); socialMonth(world); world = drain(resolveCommand(world, { type: 'reopen-social', accountId: id })); expect(world.socialAccounts[0].status).toBe('active'); expect(world.socialAccounts[0].suspendedUntil).toBeNull(); expect(world.socialAccounts[0].totalPosts).toBe(3); expect(world.socialAccounts[0].strikes).toBe(3); validateWorld(world);
});
test.each(['viral', 'steady', 'controversial'] as const)('a %s response is bound to the actual post and survives reload without another draw', response => {
  const initial = accountWorld(), world = post(initial, response); expect(world.socialAccounts[0].posts[0].response).toBe(response); expect(decodeWorld(encodeWorld(world))).toEqual(world); initial.random.outcomes = responseSeed(response); expect(post(initial, response)).toEqual(world);
  const settled = drain(world); expect(settled.socialAccounts[0].totalPosts).toBe(1); expect(() => resolveCommand(settled, { type: 'acknowledge', resultId: world.pending!.id })).toThrow(/no longer open/);
});
test('monetisation pays actual new views, retains currency, and cannot replay old views for another payment', () => {
  let world = established(), account = world.socialAccounts[0], before = accountFor(world).cash; expect(account.income).toBe(0n); expect(monetisationReason(world, account)).toBeUndefined();
  world = drain(resolveCommand(world, { type: 'monetise-social', accountId: account.id })); expect(accountFor(world).cash).toBe(before); world.date.year++; world = post(world); const actual = world.socialAccounts[0].posts.at(-1)!;
  expect(actual.income.minor).toBeGreaterThan(0n); expect(accountFor(world).cash).toBe(before + actual.income.minor); expect(world.people[world.activePersonId].finance.supportIncomeDue).toBe(actual.income.minor);
  world = drain(world); expect(accountFor(world).cash).toBe(before + actual.income.minor); expect(() => resolveCommand(world, { type: 'monetise-social', accountId: account.id })).toThrow(/already enabled/);
});
test('a six-month brand agreement pays only completed monthly delivery, never its advertised term upfront', () => {
  let world = established(); const accountId = world.socialAccounts[0].id, before = accountFor(world).cash; world = resolveCommand(world, { type: 'seek-sponsor', accountId }); world = drain(choose(world, 'accept')); const dealId = world.sponsorships[0].id;
  expect(accountFor(world).cash).toBe(before); expect(world.sponsorships[0].earned).toBe(0n);
  world = drain(resolveCommand(world, { type: 'social-routine', accountId, cadence: 'twice-monthly', topic: 'photo', intent: 'authentic' }));
  for (let i = 0; i < 6; i++) { world.date = monthFrom(world.date, 1, world.date.day); socialMonth(world); world = drain(world); }
  const deal = world.sponsorships.find(item => item.id === dealId)!; expect(deal.status).toBe('completed'); expect(deal.deliveries).toHaveLength(6); expect(deal.deliveries.every(item => item.posts >= 2)).toBe(true); expect(deal.earned).toBe(deal.monthlyPay.minor * 6n); expect(accountFor(world).cash).toBe(before + deal.earned); validateWorld(world);
});
test('missing two delivery periods terminates a brand deal without inventing income', () => {
  let world = established(); const accountId = world.socialAccounts[0].id, before = accountFor(world).cash; world = drain(choose(resolveCommand(world, { type: 'seek-sponsor', accountId }), 'accept'));
  for (let i = 0; i < 2; i++) { world.date = monthFrom(world.date, 1, world.date.day); socialMonth(world); world = drain(world); }
  expect(world.sponsorships[0].status).toBe('terminated'); expect(world.sponsorships[0].earned).toBe(0n); expect(accountFor(world).cash).toBe(before); validateWorld(world);
});
test('a collaboration uses two actual profiles, stored consent and two recorded post responses', () => {
  let world = accountWorld(); world = resolveCommand(world, { type: 'find-creators', platform: 'photogram' }); if (world.pending?.kind !== 'decision') throw new Error('Expected actual creators'); const personId = world.pending.choices[0].id; world = drain(choose(world, personId));
  const target = world.socialAccounts.find(item => item.ownerId === personId)!, original = world; let outcome: World | null = null;
  for (let seed = 1; seed < 100; seed++) { const input = validateWorld(original); input.random.outcomes = seed; const next = resolveCommand(input, { type: 'collaborate', accountId: world.socialAccounts[0].id, targetAccountId: target.id }); if (next.collaborations[0].accepted) { outcome = next; break; } }
  if (!outcome) throw new Error('No accepted collaboration seed'); world = drain(outcome); expect(world.collaborations[0].postIds).toHaveLength(2); expect(world.socialAccounts[0].totalPosts).toBe(1); expect(world.socialAccounts.find(item => item.id === target.id)!.totalPosts).toBe(1); expect(world.people[personId].id).toBe(personId); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
test('post archives preserve actual totals and followers while bounding recent detail', () => {
  let world = accountWorld(); const accountId = world.socialAccounts[0].id; world = drain(resolveCommand(world, { type: 'social-routine', accountId, cadence: 'weekly', topic: 'photo', intent: 'authentic' })); world.people[world.activePersonId].stats.energy = 100;
  for (let i = 0; i < 18; i++) { world.date = monthFrom(world.date, 1, world.date.day); world.people[world.activePersonId].stats.energy = 100; socialMonth(world); world = drain(world); }
  const account = world.socialAccounts[0]; expect(account.totalPosts).toBeGreaterThan(60); expect(account.posts).toHaveLength(60); expect(account.archived.reduce((sum, item) => sum + item.posts, 0) + 60).toBe(account.totalPosts); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
test('a deceased creator’s profiles memorialise and their child retains a separate identity and audience', () => {
  let world = established(), person = world.people[world.activePersonId], child = addChild(world, [person], 'adoptive', 2), followers = world.socialAccounts[0].followers; recordDeath(world, person.id, 'test natural causes'); validateWorld(world);
  expect(world.socialAccounts[0].status).toBe('memorial'); world = drain(resolveCommand(world, { type: 'continue-child', personId: child.id })); expect(world.socialAccounts[0].ownerId).toBe(person.id); expect(world.socialAccounts[0].followers).toBe(followers); expect(world.socialAccounts.filter(item => item.ownerId === child.id)).toEqual([]); expect(world.people[child.id].stats.fame).toBe(0);
});
test('travel/fitness posts require actual experiences and an unaffordable polished post cannot publish or consume a draw', () => {
  const world = accountWorld(); expect(topicReason(world, 'travel')).toMatch(/trip/); expect(topicReason(world, 'fitness')).toMatch(/exercise/); const account = accountFor(world); ledgerPost(world, -account.cash, 0n, 'fixture-spending', 'Exhaust content budget'); const before = encodeWorld(world);
  expect(() => resolveCommand(world, { type: 'publish-post', accountId: world.socialAccounts[0].id, kind: 'photo', intent: 'polished', sponsored: false })).toThrow(/balance/); expect(encodeWorld(world)).toBe(before);
});
test('actual creator income funds child support while a gift creates no second support assessment', () => {
  let world = drain(decodeWorld(JSON.stringify(marriageFixture))), person = world.people[world.activePersonId], spouse = Object.values(world.people).find(item => item.id !== person.id && item.householdId === person.householdId)!;
  addChild(world, [person, spouse], 'adoptive', 2); spouse.stats.health = 100; spouse.stats.discipline = 100; const quote = divorceQuote(world, spouse.id); world = drain(resolveCommand(world, { type: 'divorce', personId: spouse.id, custody: 'them', quotedPayment: quote.signed })); expect(world.custody[0].primaryId).toBe(spouse.id);
  familyFinanceMonth(world); ledgerPost(world, 100000n, 0n, 'creator-income', 'Actual delivered creator income'); const before = accountFor(world, world.people[spouse.id]).cash; familyFinanceMonth(world); expect(accountFor(world, world.people[spouse.id]).cash).toBe(before + 10000n);
  const next = accountFor(world, world.people[spouse.id]).cash; ledgerPost(world, 100000n, 0n, 'gift', 'Unrelated gift'); familyFinanceMonth(world); expect(accountFor(world, world.people[spouse.id]).cash).toBe(next); expect(world.people[world.activePersonId].finance.supportIncomeDue).toBe(0n); validateWorld(world);
});
test.each([7, 42, 93])('seed %i runs a connected three-year creator life through real Age Up, retained history and yearly settlement', seed => {
  let world = accountWorld(); world.random.outcomes = seed; const accountId = world.socialAccounts[0].id;
  world = drain(resolveCommand(world, { type: 'health-routine', routine: { exercise: 'walking', diet: 'balanced', sleep: 'restful', mindfulness: true, smoking: false, drinking: 'none' } })); world = drain(resolveCommand(world, { type: 'social-routine', accountId, cadence: 'weekly', topic: 'photo', intent: 'authentic' }));
  for (let year = 0; year < 3 && !world.people[world.activePersonId].died; year++) { world = resolveCommand(world, { type: 'advance' }); let guard = 0; while ((world.pending || world.annual) && !world.people[world.activePersonId].died && guard++ < 200) { world = world.pending ? drain(world) : resolveCommand(world, { type: 'resume' }); } if (guard >= 200) throw new Error('Creator year stalled'); }
  expect(world.socialAccounts[0].totalPosts).toBeGreaterThan(60); expect(world.socialAccounts[0].posts.length).toBeLessThanOrEqual(60); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
test.each(countryCodes)('%s creator income uses the local currency and exact delivered view count', country => {
  let world = fixture(), person = world.people[world.activePersonId]; person.country = country; person.city = countries[country].cities[0]; const currency = countries[country].currency;
  if (!world.accounts.some(item => item.ownerId === person.id && item.currency === currency)) world.accounts.push({ id: 'local_' + country, ownerId: person.id, currency, cash: 100000000n, openingCash: 100000000n, lockedCash: 0n });
  world = drain(resolveCommand(world, { type: 'create-social', platform: 'photogram', handle: 'local_daily', bio: '' })); for (let i = 0; i < 6; i++) world = drain(post(world, 'viral')); world = drain(resolveCommand(world, { type: 'monetise-social', accountId: world.socialAccounts[0].id })); world.date.year++; const before = accountFor(world).cash; world = post(world); const published = world.socialAccounts[0].posts.at(-1)!; expect(published.income.currency).toBe(currency); expect(accountFor(world).cash).toBe(before + published.income.minor); validateWorld(world);
});
test('a completed exercise session qualifies an actual fitness post without requiring a recurring paid routine', () => {
  const initial = fixture(); expect(topicReason(initial, 'fitness')).toMatch(/exercise/); const world = drain(resolveCommand(initial, { type: 'exercise', activity: 'walk' })); expect(world.people[world.activePersonId].health.routine.exercise).toBe('none'); expect(topicReason(world, 'fitness')).toBeUndefined();
});
