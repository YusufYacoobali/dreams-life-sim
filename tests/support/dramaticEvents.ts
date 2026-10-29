import { dramaticTemplates } from '../../src/game/content/dramaticEvents';
import { assetCatalog } from '../../src/game/content/assets';
import type { DramaticEventId } from '../../src/game/systems/dramaticSchemas';
import { decodeWorld, encodeWorld, fullName, validateWorld, type World } from '../../src/game/model';
import { recordDeath, resolveCommand, type GameCommand } from '../../src/game/engine';
import { accountFor, post } from '../../src/game/systems/common';
import { relationFor } from '../../src/game/systems/relationships';
import { addChild } from '../../src/game/systems/family';
import { businessStartupQuote } from '../../src/game/systems/businesses';
import { businessBook, businessCost } from '../../src/game/systems/businessCore';
import { endEmployment } from '../../src/game/systems/work';
import { employmentBackPay } from '../../src/game/systems/work';
import { campaignQuote, politicsMonth } from '../../src/game/systems/politics';
import { creatorCrewQuote } from '../../src/game/systems/creators';
import { brandDecision } from '../../src/game/systems/social';
import { businessMonth } from '../../src/game/systems/businessMonth';
import { assetPrice, assetsMonth } from '../../src/game/systems/assets';
import { legalMonth } from '../../src/game/systems/legal';
import { monthFrom } from '../../src/game/calendar';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { randomInteger } from '../../src/game/random';
import { adultSocial } from './adultSocial';
import { employee } from './employee';
import { careerDepthWorld } from './specialCareerDepth';
import { friendshipProposal } from './bestFriendsFixture';
import { drainStorySetup } from './lifeStory';
import { prisonPeerStoryWorld } from './legalStories';
import graduate from '../fixtures/v3-employed-graduate.json';

const act = (world: World, command: GameCommand) => drainStorySetup(resolveCommand(world, command));
const isolate = (world: World) => {
  world.pending = null; world.pendingPriority = 0; world.deferred = []; world.annual = null;
  return world;
};
const fund = (world: World) => {
  post(world, 100_000_000n, 0n, 'fixture-funding', 'Controlled dramatic event domain fixture');
  return world;
};
function socialOffer(input: World, fitness = false, accountId?: string, opportunitySeed?: number) {
  let world = input;
  let account = world.socialAccounts.find(row => row.ownerId === world.activePersonId && row.status === 'active' && (!accountId || row.id === accountId));
  if (!account) {
    world = act(world, { type: 'create-social', platform: 'photogram', handle: 'dramatic_test', bio: '' });
    account = world.socialAccounts.find(row => row.ownerId === world.activePersonId && row.status === 'active')!;
  }
  // Explicit audience boundary; this verifies contract actions, not audience growth.
  const increase = Math.max(0, 6_000 - account.followers);
  account.followers += increase; account.baselineFollowers += increase;
  account.peakFollowers = Math.max(account.peakFollowers, account.followers);
  world.people[world.activePersonId].publicLife.image = 80;
  world.people[world.activePersonId].health.routine.exercise = 'walking';
  for (const row of world.sponsorships.filter(row => row.ownerId === world.activePersonId && (row.status === 'active' || row.status === 'offered'))) {
    if (row.status === 'active') world = act(world, { type: 'cancel-sponsor', sponsorId: row.id });
    else row.status = 'declined';
  }
  world.random.outcomes = fitness ? 4 : 1; // One fixed actual brand selection.
  world.random.events = opportunitySeed ?? 1;
  world = resolveCommand(validateWorld(world), { type: 'seek-sponsor', accountId: account.id });
  return opportunitySeed === undefined ? isolate(world) : world;
}
function controversyWorld(world: World) {
  if (world.controversies.some(row => row.personId === world.activePersonId)) return world;
  world = act(world, { type: 'create-social', platform: 'photogram', handle: 'actor_scandal', bio: '' });
  const account = world.socialAccounts.find(row => row.ownerId === world.activePersonId && row.platform === 'photogram')!;
  // Select the response draw before one actual post; never retry the post.
  for (let seed = 0; seed < 1000; seed++) {
    const reach = randomInteger(seed, 20, 120);
    if (randomInteger(reach.state, 1, 1000).value <= 120) { world.random.outcomes = seed; break; }
  }
  world = resolveCommand(world, { type: 'publish-post', accountId: account.id, kind: 'photo', intent: 'provocative', sponsored: false, caption: 'A deliberately controversial fixture post.' });
  return drainStorySetup(world);
}

const cache = new Map<DramaticEventId, string>();
/** Controlled domain setups, not natural encounter rates or visual evidence.
 * Actual job/contact, engagement, agreement, crime, case, staff, ownership,
 * sponsor, election and career actions create the records. Explicit funding,
 * qualifying stats/audience, response streams and isolated calendar boundaries
 * make every authored branch reviewable without pretending a natural journey. */
export function dramaticWorld(id: DramaticEventId, opportunitySeed?: number): World {
  if (opportunitySeed === undefined && cache.has(id)) return decodeWorld(cache.get(id)!);
  let world: World;
  if (id === 'dramatic-boss-criminal') {
    world = employee();
    const boss = world.people[currentWorkplace(world)!.members.find(row => row.role === 'supervisor')!.personId];
    post(world, 10_000_000n, 0n, 'fixture-funding', 'Controlled supervisor savings boundary', null, boss);
  }
  else if (id === 'dramatic-double-fiance' || id === 'dramatic-dating-profile' || id === 'dramatic-best-friend-secrets') {
    const setup = adultSocial(); world = fund(setup.world);
    if (id === 'dramatic-double-fiance') {
      const edge = relationFor(world, world.activePersonId, setup.partnerId)!; edge.strength = 95; edge.trust = 90;
      world.random.outcomes = 1;
      world = act(world, { type: 'propose', personId: setup.partnerId });
      if (relationFor(world, world.activePersonId, setup.partnerId)!.romance !== 'engaged') throw new Error('Actual proposal was not accepted');
    }
    if (id === 'dramatic-best-friend-secrets') {
      const edge = relationFor(world, world.activePersonId, setup.friendId)!; edge.strength = 85; edge.trust = 80;
      world.random.npcs = 1;
      world = act(world, friendshipProposal(world, setup.friendId));
      if (!world.bestFriendships.some(row => row.status === 'active')) throw new Error('Actual best-friend proposal was not accepted');
    }
  } else if (id === 'dramatic-child-exam-scam') {
    world = employee('US', true, 45);
    addChild(world, [world.people[world.activePersonId]], 'adoptive', 15);
  } else if (id === 'dramatic-courtroom-defence' || id === 'dramatic-accomplice-wire') {
    world = fund(employee()); world.people[world.activePersonId].legal.crimeSkill = 20;
    if (id === 'dramatic-accomplice-wire') world = act(world, { type: 'join-gang', kind: 'street' });
    world.random.outcomes = id === 'dramatic-accomplice-wire' ? 5 : 1;
    world.random.events = opportunitySeed ?? 1;
    world = resolveCommand(world, { type: 'crime', offence: 'robbery' });
    if (id === 'dramatic-accomplice-wire') {
      if (world.incidents.at(-1)?.stage !== 'hidden') throw new Error('Fixed actual robbery should remain unresolved');
      if (opportunitySeed === undefined) world = drainStorySetup(world);
    } else {
      const item = world.cases.find(row => row.personId === world.activePersonId)!;
      if (!item) throw new Error('Fixed actual robbery must create a real case');
      world = isolate(world);
      world = act(world, { type: 'retain-counsel', caseId: item.id, counsel: 'public' });
      // The real hearing boundary is arranged; no evidence or verdict is replaced.
      world.date = { ...item.hearing };
      if (opportunitySeed !== undefined) legalMonth(world);
    }
  } else if (id === 'dramatic-cellmate-escape') world = prisonPeerStoryWorld();
  else if (id === 'dramatic-unpaid-employees') {
    world = fund(employee());
    world = act(world, { type: 'start-business', kind: 'cafe', name: 'Dramatic Payroll', operation: 'manager', quotedCapital: businessStartupQuote(world, 'cafe').capital });
    const company = world.businesses.at(-1)!, member = company.staff.find(row => row.role === 'manager') ?? company.staff[0];
    businessBook(world, company, -company.cash, 0n, 'fixture-loss', 'Controlled loss of working capital');
    const cost = businessCost(world, company, 100_000n, 'payroll', 'Actual unpaid fixture payroll', 'wages', member.personId, member.employmentId);
    employmentBackPay(world, world.people[member.personId], member.employmentId, cost.paid);
    businessCost(world, company, 50_000n, 'operating', 'Actual unpaid fixture supplier bill', 'supplier');
    company.distressMonths = 1; // Explicit first-distress boundary, not a month simulation.
    if (opportunitySeed !== undefined) {
      businessCost(world, company, 100_000_000n, 'payroll', 'Recorded stress-case wage claim', 'wages', member.personId, member.employmentId);
      businessCost(world, company, 50_000_000n, 'operating', 'Recorded stress-case supplier claim', 'supplier');
      company.distressMonths = 0;
      world.date = monthFrom(world.date, 1); world.random.events = opportunitySeed; world.random.economy = 1;
      businessMonth(world);
    }
  } else if (id === 'dramatic-suspicious-property') {
    world = fund(employee('US', true, 45));
    const home = assetCatalog.find(row => row.kind === 'property')!;
    world = act(world, { type: 'buy-asset', catalogId: home.id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: assetPrice(world, home) });
    const property = world.assets.find(row => row.ownerId === world.activePersonId && row.kind === 'property')!;
    world = act(world, { type: 'list-property', assetId: property.id, askingPrice: property.value });
    const listed = world.assets.find(row => row.id === property.id)!;
    listed.listing!.offer = listed.listing!.askingPrice * 2n;
    listed.listing!.offersMade = 1; // Exact offer boundary after the actual listing.
    if (opportunitySeed !== undefined) {
      world = act(world, { type: 'list-property', assetId: listed.id, askingPrice: listed.value / 2n });
      const listing = world.assets.find(row => row.id === listed.id)!.listing!;
      world.date = monthFrom(world.date, 1); listing.nextOfferMonth = world.date.year * 12 + world.date.month - 1;
      world.random.events = opportunitySeed; world.random.economy = 1;
      assetsMonth(world);
    }
  } else if (id === 'dramatic-dishonest-sponsor') world = socialOffer(fund(employee()), true, undefined, opportunitySeed);
  else if (id === 'dramatic-funeral-stream') {
    world = fund(careerDepthWorld(dramaticTemplates.find(row => row.id === id)!));
    const studio = world.creatorStudios.find(row => row.personId === world.activePersonId && row.status === 'active')!;
    if (!studio.crew.some(row => row.role === 'editor' && !row.ended)) {
      const quote = creatorCrewQuote(studio, 'editor');
      world = act(world, { type: 'hire-creator-crew', studioId: studio.id, role: 'editor', quotedFee: quote.fee, quotedAgency: quote.agency });
    }
    world = socialOffer(world, false, studio.accountId);
    const offer = world.sponsorships.find(row => row.ownerId === world.activePersonId && row.status === 'offered')!;
    brandDecision(world, offer.id, true);
    const family = world.relationships.filter(row => row.from === world.activePersonId || row.to === world.activePersonId).filter(row => row.roles.some(role => ['parent', 'guardian', 'sibling'].includes(role))).map(row => world.people[row.from === world.activePersonId ? row.to : row.from]).find(row => row && !row.died);
    if (!family) throw new Error('Recorded streamer needs a living family member');
    recordDeath(world, family.id, 'Controlled recent family death');
    const activeStudio = world.creatorStudios.find(row => row.id === studio.id)!, account = world.socialAccounts.find(row => row.id === activeStudio.accountId)!;
    world = act(world, { type: 'social-routine', accountId: account.id, cadence: 'monthly', topic: 'gaming', intent: 'authentic' });
    world.people[world.activePersonId].stats.energy = 100;
    world.random.outcomes = 5;
    world.random.events = opportunitySeed ?? 1;
    world = resolveCommand(world, { type: 'publish-post', accountId: account.id, kind: offer.topic, intent: 'authentic', sponsored: true, caption: 'In memory of ' + fullName(family) + ': a family memorial.', liveMinutes: 60 });
    if (opportunitySeed === undefined) world = drainStorySetup(world);
  } else if (id === 'dramatic-election-scandal') {
    world = fund(decodeWorld(JSON.stringify(graduate))); endEmployment(world);
    const person = world.people[world.activePersonId]; person.skills.politics = 80; person.stats.respect = 80; person.publicLife.image = 80; person.stats.energy = 100;
    const quote = campaignQuote(world);
    world = act(world, { type: 'start-campaign', platform: 'education', effort: 'balanced', quotedBudget: quote.total, quotedAnnualPay: quote.annualPay });
    for (let index = 0; index < 5; index++) {
      world.date = monthFrom(world.date, 1);
      if (index === 4) world.random.events = opportunitySeed ?? 1;
      politicsMonth(world);
      if (index !== 4 || opportunitySeed === undefined) world = drainStorySetup(world);
    }
  } else {
    world = careerDepthWorld(dramaticTemplates.find(row => row.id === id)!);
    if (id === 'dramatic-scandal-movie') world = controversyWorld(world);
  }
  if (opportunitySeed !== undefined) return validateWorld(world);
  world = validateWorld(isolate(world));
  if (accountFor(world).cash < 0n) throw new Error('Negative fixture cash');
  cache.set(id, encodeWorld(world));
  return decodeWorld(cache.get(id)!);
}
