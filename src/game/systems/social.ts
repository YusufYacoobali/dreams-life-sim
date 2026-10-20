import { serviceAway } from './serviceSchemas';
import { publicCriticismCopy } from '../content/socialCriticism';
import { z } from 'zod';
import { ageOn, fullName, Person, World } from '../model';
import { platforms, PlatformId, platformContent, postContent, postKinds, PostKind, sponsorBrands } from '../content/social';
import { countries } from '../countries';
import { formatMoney, Money, roundRatio } from '../money';
import { rules } from '../rules';
import { fxMoney } from '../valuation';
import { IneligibleAction } from '../errors';
import { RuntimeEffectRow } from '../runtime';
import { offerPending } from '../pendingQueue';
import { accountFor, active, availableCash, bounded, charge, draw, fact, post, result } from './common';
import { socialIntent } from './socialSchemas';
import { isConfined } from './legalSchemas';
import { hospitalized } from './healthSchemas';
import { connectPerson, relationFor } from './relationships';
import { createContact } from './npcs';
import { financialActors } from './households';
import { studioForAccount } from './creatorSchemas';
import { creatorBeforePublish, creatorFocusReason, creatorProductionReason, creatorProfileClosed, creatorRoutineWarning, creatorWorkEnergy } from './creators';
type Account = World['socialAccounts'][number];
type Sponsor = World['sponsorships'][number];
type Post = Account['posts'][number];
const handle = z.string().trim().regex(/^[a-zA-Z0-9_]{3,24}$/, 'Use 3–24 letters, numbers or underscores');
const text = (maximum: number) => z.string().trim().max(maximum).refine(value => !/[\u0000-\u001F]/.test(value), 'Remove control characters');
export const socialMediaCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('create-social'), platform: z.enum(platforms), handle, bio: text(120) }),
  z.object({ type: z.literal('edit-social'), accountId: z.string(), handle, bio: text(120) }),
  z.object({ type: z.literal('social-routine'), accountId: z.string(), cadence: z.enum(['off', 'monthly', 'twice-monthly', 'weekly', 'twice-weekly']), topic: z.enum(postKinds), intent: socialIntent }),
  z.object({ type: z.literal('publish-post'), accountId: z.string(), kind: z.enum(postKinds), intent: socialIntent, caption: text(180).optional(), sponsored: z.boolean(), liveMinutes: z.union([z.literal(0),z.literal(30),z.literal(60),z.literal(120)]).optional() }),
  z.object({ type: z.literal('monetise-social'), accountId: z.string() }),
  z.object({ type: z.literal('delete-social'), accountId: z.string() }), z.object({ type: z.literal('reopen-social'), accountId: z.string() }),
  z.object({ type: z.literal('find-creators'), platform: z.enum(platforms) }),
  z.object({ type: z.literal('follow-creator'), accountId: z.string(), targetAccountId: z.string(), following: z.boolean() }),
  z.object({ type: z.literal('collaborate'), accountId: z.string(), targetAccountId: z.string() }),
  z.object({ type: z.literal('seek-sponsor'), accountId: z.string() }), z.object({ type: z.literal('cancel-sponsor'), sponsorId: z.string() }),
  z.object({ type: z.literal('public-action'), action: z.enum(['interview', 'event', 'reputation']) }),
]);
export type SocialMediaCommand = z.infer<typeof socialMediaCommandSchema>;
const absolute = (world: World) => world.date.year * 12 + world.date.month - 1;
const effect = (id: string, label: string, value: string, tone: RuntimeEffectRow['tone'] = 'neutral'): RuntimeEffectRow => ({ id, label, value, tone });
const unit = (world: World, person: Person, currency = countries[person.country].currency) => fxMoney(world, { minor: rules[person.country].baseWage, currency: countries[person.country].currency }, currency).minor;
function limit(world: World, name: string, maximum = 1) {
  const key = world.activePersonId + ':social-media:' + world.date.year + ':' + name, used = world.actionCounts[key] ?? 0;
  if (used >= maximum) throw new IneligibleAction('You have already reached this year’s limit'); world.actionCounts[key] = used + 1;
}
export const socialAccount = (world: World, accountId: string) => {
  const account = world.socialAccounts.find(item => item.id === accountId && item.ownerId === world.activePersonId);
  if (!account) throw new IneligibleAction('Choose one of your profiles'); return account;
};
export function fameLevel(value: number) { return value >= 90 ? 'Global Icon' : value >= 75 ? 'Household Name' : value >= 50 ? 'Famous' : value >= 25 ? 'Well Known' : value >= 10 ? 'Locally Known' : value > 0 ? 'Getting Noticed' : 'Private Life'; }
export function updateFame(world: World, person: Person) {
  const followers = world.socialAccounts.filter(item => item.ownerId === person.id && (item.status === 'active' || item.status === 'suspended')).reduce((sum, item) => sum + item.followers, 0);
  const audience = Math.max(0, Math.round(Math.log10(followers + 1) * 22 - 60)); person.stats.fame = bounded(audience + person.publicLife.earnedFame);
  person.publicLife.peakFame = Math.max(person.publicLife.peakFame, person.stats.fame);
  person.publicLife.attention = bounded(person.stats.fame + (world.controversies.some(item => item.personId === person.id && !item.resolved) ? 15 : 0));
}
export function gainPublicFame(world: World, person: Person, delta: number) { person.publicLife.earnedFame = bounded(person.publicLife.earnedFame + delta); updateFame(world, person); }
function credit(world: World, person: Person, value: Money, category: string, description: string) {
  if (!value.minor) return;
  if (!world.accounts.some(item => item.ownerId === person.id && item.currency === value.currency)) world.accounts.push({ id: 'account_' + person.id + '_' + value.currency, ownerId: person.id, currency: value.currency, cash: 0n, openingCash: 0n, lockedCash: 0n });
  post(world, value.minor, 0n, category, description, null, person, value.currency); person.finance.cycleGross += fxMoney(world, value, countries[person.country].currency).minor;
}
function makeAccount(world: World, person: Person, platform: PlatformId, username: string, bio: string, baselineFollowers = 0): Account {
  const account: Account = { id: 'social_' + person.id + '_' + platform, ownerId: person.id, platform, handle: username, bio, created: { ...world.date }, status: 'active', suspendedUntil: null, strikes: 0, followers: baselineFollowers, baselineFollowers, peakFollowers: baselineFollowers, followerDrift: 0, verified: false, monetised: false, currency: countries[person.country].currency, cadence: 'off', topic: platform === 'videowave' ? 'video' : platform === 'streamline' ? 'gaming' : platform === 'lifelink' ? 'message' : 'photo', intent: 'authentic', lastMonth: absolute(world), posts: [], archived: [], totalPosts: 0, totalLikes: 0, income: 0n, periods: [] };
  world.socialAccounts.push(account); updateFame(world, person); return account;
}
export const postCost = (world: World, intent: 'authentic' | 'polished' | 'provocative', person = active(world)) => ({ minor: intent === 'polished' ? roundRatio(unit(world, person), 1000n) : 0n, currency: countries[person.country].currency });
export const collaborationCost = (world: World) => ({ minor: unit(world, active(world)) / 1000n, currency: countries[active(world).country].currency });
export const publicActionQuote = (world: World, action: 'interview' | 'event' | 'reputation') => ({ minor: action === 'interview' ? roundRatio(unit(world, active(world)) * BigInt(active(world).stats.fame), 1000n) : unit(world, active(world)) / BigInt(action === 'event' ? 100 : 200), currency: countries[active(world).country].currency });
export function topicReason(world: World, kind: PostKind, person = active(world)): string | undefined {
  if (kind === 'travel' && !world.trips.some(trip => trip.participantIds.includes(person.id) && trip.periods.some(period => world.date.year * 12 + world.date.month - 1 - period.month <= 12))) return 'Take a trip before sharing travel experiences';
  if (kind === 'fitness' && person.health.routine.exercise === 'none' && !world.actionCounts[person.id + ':health:' + world.date.year + ':exercise']) return 'Try an exercise session or start an exercise routine first';
}
export function postReason(world: World, account: Account, kind: PostKind, intent = account.intent): string | undefined {
  const person = world.people[account.ownerId];
  if(serviceAway(world,person.id))return 'Original production pauses while you are away on an assignment';
  if (account.status !== 'active') return account.status === 'suspended' ? 'Your profile is temporarily suspended' : 'Reopen this profile first';
  if (world.controversies.some(item => item.personId === person.id && !item.resolved)) return 'Respond to the current public dispute first';
  if (isConfined(world, person)) return 'Outside posting is unavailable in custody';
  if (hospitalized(world, person) || person.stats.health < 20 || person.stats.energy < 10) return 'Recover your health and energy first';
  return topicReason(world, kind, person) ?? creatorProductionReason(world,account,postCost(world,intent,person));
}
export function monetisationReason(world: World, account: Account): string | undefined {
  if (ageOn(world.people[account.ownerId], world.date) < 18) return 'Creator payments are available from age eighteen';
  if (account.status !== 'active') return 'An active profile is required';
  if (account.monetised) return 'Creator payments are already enabled';
  if (account.followers < 1000 || account.totalPosts < 6) return 'Requires 1,000 followers and six recorded posts';
  if (world.people[account.ownerId].publicLife.image < 30) return 'Improve your public image first';
}
function archivePosts(account: Account) {
  while (account.posts.length > 60) {
    const item = account.posts.shift()!; let archive = account.archived.find(row => row.year === item.date.year);
    if (!archive) { archive = { year: item.date.year, posts: 0, studioPosts: {}, livePosts: 0, liveMinutes: 0, virals: 0, views: 0, likes: 0, comments: 0, followerDelta: 0, income: 0n }; account.archived.push(archive); }
    if(item.studioId)archive.studioPosts[item.studioId]=(archive.studioPosts[item.studioId]??0)+1;
    if(item.liveMinutes){archive.livePosts++;archive.liveMinutes+=item.liveMinutes;}
    archive.posts++; archive.views += item.views; archive.likes += item.likes; archive.comments += item.comments; archive.followerDelta += item.followerDelta; archive.income += item.income.minor;
    if (item.response === 'viral') archive.virals++;
  }
}
function controversy(world: World, account: Account, post: Post) {
  const person = world.people[account.ownerId], impact = draw(world, person.id === world.activePersonId ? 'outcomes' : 'npcs', 5, 15);
  const copy = publicCriticismCopy(account.platform, post, ageOn(person, world.date));
  const item: World['controversies'][number] = { id: 'controversy_' + post.id, personId: person.id, accountId: account.id, postId: post.id, date: { ...world.date }, ...copy, impact, responseRoll: draw(world, person.id === world.activePersonId ? 'outcomes' : 'npcs', 1, 100), response: null, resolved: null };
  world.controversies.push(item); person.publicLife.image = bounded(person.publicLife.image - impact); account.strikes++;
  if (account.strikes % 3 === 0) { account.status = 'suspended'; account.suspendedUntil = absolute(world) + 2; }
  for (const relation of world.relationships.filter(item => (item.from === person.id || item.to === person.id) && (item.romance === 'married' || item.romance === 'dating'))) { relation.trust = bounded(relation.trust - 3); relation.memories.push('public-dispute:' + world.date.year); }
  fact(world, 'A post on ' + platformContent[account.platform].name + ' drew criticism and affected my public image.', 'fame', '', person.id);
  if (person.id === world.activePersonId) offerPending(world, { kind: 'decision', id: item.id, templateId: 'public-controversy', title: item.title, body: item.body, illustration: 'publicity', personIds: [person.id], choices: (['apologise', 'clarify', 'ignore'] as const).map(response => ({ id: response, label: response === 'apologise' ? 'Acknowledge the harm and apologise' : response === 'clarify' ? 'Explain what you meant' : 'Let the argument run its course', effects: [{ kind: 'public-response' as const, controversyId: item.id, response }], resultTitle: 'Your response is recorded', resultBody: 'Your audience and public image reflect the response. Reopening the profile cannot change it.', journal: response === 'ignore' ? 'I left a public dispute unanswered.' : 'I responded to criticism of my post.' })) }, 65);
  else { item.response = 'clarify'; item.resolved = { ...world.date }; }
}
export function respondPublicly(world: World, id: string, response: 'apologise' | 'clarify' | 'ignore'): RuntimeEffectRow[] {
  const item = world.controversies.find(candidate => candidate.id === id && candidate.personId === world.activePersonId && !candidate.resolved); if (!item) throw new IneligibleAction('This public response is no longer open');
  const person = active(world), before = person.publicLife.image; item.response = response; item.resolved = { ...world.date };
  const change = response === 'apologise' ? item.responseRoll <= 85 ? Math.ceil(item.impact * 0.6) : -2 : response === 'clarify' ? item.responseRoll <= 55 ? Math.ceil(item.impact * 0.8) : -4 : -3;
  person.publicLife.image = bounded(before + change); person.stats.stress = bounded(person.stats.stress + (response === 'ignore' ? 4 : -2)); updateFame(world, person);
  return [effect('image', 'Public image', (person.publicLife.image - before >= 0 ? '+' : '') + (person.publicLife.image - before) + '%', change >= 0 ? 'positive' : 'negative')];
}
function publish(world: World, account: Account, kind: PostKind, intent: 'authentic' | 'polished' | 'provocative', sponsored: boolean, caption?: string, automatic = false, collaborationId: string | null = null, reachBonus = 0, liveMinutes: 0|30|60|120 = 0): Post {
  const person = world.people[account.ownerId], stream = person.id === world.activePersonId ? 'outcomes' : 'npcs', currency = account.currency;
  const reason = postReason(world, account, kind, intent); if (reason) throw new IneligibleAction(reason);
  const studio = studioForAccount(world,account.id);
  if(liveMinutes && (account.platform!=='streamline'||studio?.kind!=='streamer'))throw new IneligibleAction('Start your Streamer studio before going live');
  const deal = sponsored ? world.sponsorships.find(item => item.accountId === account.id && item.status === 'active') : undefined;
  if (sponsored && !deal) throw new IneligibleAction('There is no active brand deal on this profile');
  if (deal && kind !== deal.topic) throw new IneligibleAction('This deal requires ' + postContent[deal.topic].title.toLowerCase());
  const cost = postCost(world, intent, person); if (cost.minor) charge(world, cost.minor, 'content-production', 'Original content production', undefined, cost.currency, person);
  const production = creatorBeforePublish(world,account,account.totalPosts);
  const preferred = (platformContent[account.platform].preferred as readonly string[]).includes(kind);
  const quality = production.bonus + Math.round((person.stats.smarts + person.stats.discipline) / 2) + (person.traits.includes('creative') ? 12 : 0) + (intent === 'polished' ? 15 : 0) + (preferred ? 10 : 0), reach = draw(world, stream, 20, 120), responseRoll = draw(world, stream, 1, 1000);
  const controversial = responseRoll <= Math.floor((intent === 'provocative' ? 120 : 8)/(production.moderated?2:1)), viral = !controversial && responseRoll > 975;
  let views = Math.max(1, Math.round((50 + draw(world, stream, 0, 250) + account.followers * reach / 200 + reachBonus) * (0.5 + quality / 100) * (viral ? draw(world, stream, 20, 80) : intent === 'provocative' ? 2 : 1) * (sponsored ? 0.75 : 1) * (liveMinutes?0.8+liveMinutes/120:1)));
  views = Math.min(10000000000, views); const likes = Math.floor(views * draw(world, stream, 2, 12) / 100), comments = Math.floor(likes / (controversial ? 3 : 12));
  const wantedDelta = controversial ? -Math.max(1, Math.round(account.followers * 0.03)) : Math.max(0, Math.round(views * (quality >= 70 ? 0.018 : 0.008)));
  const followers = Math.max(0, Math.min(1000000000, account.followers + wantedDelta)), delta = followers - account.followers; account.followers = followers;
  account.peakFollowers = Math.max(account.peakFollowers, followers);
  const payoutBps = { photogram: 8000n, videowave: 12000n, streamline: 15000n, lifelink: 5000n }[account.platform];
  const income = { minor: account.monetised && ageOn(person, world.date) >= 18 ? roundRatio(unit(world, person, currency) * BigInt(views) * payoutBps, 1000000000000n) : 0n, currency };
  credit(world, person, income, 'creator-income', 'Creator payment: ' + platformContent[account.platform].name); account.income += income.minor;
  const item: Post = { id: account.id + '_post_' + account.totalPosts, accountId: account.id, date: { ...world.date }, periodMonth: absolute(world) + (automatic ? 0 : 1), kind, intent, caption: (caption?.trim() || postContent[kind].captions[draw(world, stream, 0, postContent[kind].captions.length - 1)]) + (deal ? ' · Paid partnership with ' + deal.brand : ''), sponsored, sponsorId: deal?.id ?? null, collaborationId, studioId:production.studio?.id??null, liveMinutes, views, likes, comments, followerDelta: delta, response: controversial ? 'controversial' : viral ? 'viral' : reach < 40 ? 'quiet' : reach > 85 ? 'well-received' : 'steady', income };
  account.posts.push(item); account.totalPosts++; account.totalLikes += likes;
  let period = account.periods.find(row => row.month === item.periodMonth); if (!period) { period = { month: item.periodMonth, posts: 0, sponsored: 0 }; account.periods.push(period); } period.posts++; if (sponsored) period.sponsored++; account.periods = account.periods.filter(row => row.month >= absolute(world) - 1);
  person.stats.energy = bounded(person.stats.energy - creatorWorkEnergy(world,production.studio,automatic,liveMinutes)); person.stats.stress = bounded(person.stats.stress + (intent === 'provocative' ? 2 : viral ? 1 : 0));
  archivePosts(account); if (controversial) controversy(world, account, item); updateFame(world, person);
  if (automatic && viral && person.id === world.activePersonId) { fact(world, 'A post on ' + platformContent[account.platform].name + ' went viral, reaching ' + views.toLocaleString('en-US') + ' views.', 'fame'); offerPending(world, { kind: 'result', id: 'viral_' + item.id, title: 'Viral post!', body: 'A scheduled post reached far beyond your usual audience. Its response is already part of your profile.', illustration: 'fame', effects: [effect('views', 'Views', views.toLocaleString('en-US')), effect('followers', 'New followers', '+' + delta.toLocaleString('en-US'), 'positive')] }, 55); }
  return item;
}
export function sponsorReason(world: World, account: Account): string | undefined {
  const person = world.people[account.ownerId];
  if (ageOn(person, world.date) < 18 || account.status !== 'active' || account.followers < 5000 || person.publicLife.image < 45) return 'Requires an active adult profile, 5,000 followers and 45% public image';
  if (world.sponsorships.some(item => item.accountId === account.id && (item.status === 'active' || item.status === 'offered'))) return 'An existing deal or offer must end first';
}
function offerSponsor(world: World, account: Account) {
  const person = world.people[account.ownerId], brand = sponsorBrands[draw(world, 'outcomes', 0, sponsorBrands.length - 1)], factor = Math.min(30000, Math.max(500, Math.round(account.followers / 10)));
  // Fitness deals are only offered when the creator has an actual exercise routine.
  const selected = topicReason(world, brand.topic, person) ? sponsorBrands[0] : brand;
  const item: Sponsor = { id: 'sponsor_' + account.id + '_' + world.revision + '_' + world.sponsorships.length, accountId: account.id, ownerId: person.id, brand: selected.name, category: selected.category, topic: selected.topic, offered: { ...world.date }, expiresMonth: absolute(world) + 2, status: 'offered', monthlyPay: { minor: roundRatio(unit(world, person, account.currency) * BigInt(factor), 120000n), currency: account.currency }, termMonths: 6, requiredPosts: 2, startMonth: null, lastMonth: absolute(world), earned: 0n, misses: 0, deliveries: [], endReason: null };
  world.sponsorships.push(item);
  offerPending(world, { kind: 'decision', id: 'offer_' + item.id, templateId: 'brand-offer', title: 'Brand deal offer', body: item.brand + ' offers ' + formatMoney(item.monthlyPay) + ' per delivered month for six months. Each month requires two disclosed ' + postContent[item.topic].title.toLowerCase() + ' posts on ' + platformContent[account.platform].name + '. No annual or six-month payment is made upfront. Two missed months end the deal.', illustration: 'contract', personIds: [person.id], choices: [true, false].map(accepted => ({ id: accepted ? 'accept' : 'decline', label: accepted ? 'Accept Deal' : 'Decline Offer', effects: [{ kind: 'brand-decision' as const, sponsorId: item.id, accepted }], resultTitle: accepted ? 'Brand agreement recorded' : 'Offer declined', resultBody: accepted ? 'Review your posting routine before continuing time. Payment follows actual monthly delivery.' : 'You declined the offer. No payment or obligation was created.', journal: accepted ? 'I accepted a six-month agreement with ' + item.brand + '.' : 'I declined an offer from ' + item.brand + '.' })) }, 60);
}
export function brandDecision(world: World, sponsorId: string, accepted: boolean): RuntimeEffectRow[] {
  const item = world.sponsorships.find(candidate => candidate.id === sponsorId && candidate.ownerId === world.activePersonId && candidate.status === 'offered'); if (!item || item.expiresMonth < absolute(world)) throw new IneligibleAction('This offer has expired');
  if (accepted) { if (isConfined(world) || world.people[item.ownerId].publicLife.image < 25) throw new IneligibleAction('This contract is unavailable in your current circumstances'); item.status = 'active'; item.startMonth = absolute(world); item.lastMonth = absolute(world); if (world.annual?.stage === 'months') world.annual.pausedForPlanning = true; }
  else item.status = 'declined';
  return [effect('deal', 'Agreement', accepted ? 'Six months · two disclosed posts per month' : 'Declined'), effect('upfront', 'Upfront payment', formatMoney({ ...item.monthlyPay, minor: 0n }))];
}
export function resolveSocialMedia(world: World, command: SocialMediaCommand) {
  const person = active(world), month = absolute(world);
  if (command.type === 'create-social') {
    if (ageOn(person, world.date) < 13) throw new IneligibleAction('Social profiles are available from age thirteen');
    if (world.socialAccounts.some(item => item.ownerId === person.id && item.platform === command.platform)) throw new IneligibleAction('This profile already exists; reopen it to retain its history');
    if (world.socialAccounts.some(item => item.platform === command.platform && item.handle.toLowerCase() === command.handle.toLowerCase())) throw new IneligibleAction('That handle is already in use');
    makeAccount(world, person, command.platform, command.handle, command.bio); fact(world, 'I created a ' + platformContent[command.platform].name + ' profile: @' + command.handle + '.', 'social-media'); result(world, 'Your profile is ready', 'Your audience starts with zero followers. Posts and responses become part of this life.', 'social'); return;
  }
  if (command.type === 'public-action') {
    if (ageOn(person, world.date) < 18 || person.stats.fame < (command.action === 'reputation' ? 10 : 20)) throw new IneligibleAction('Build a public audience before taking this opportunity'); limit(world, 'public:' + command.action);
    if (command.action === 'interview') { const pay = publicActionQuote(world, command.action); credit(world, person, pay, 'media-income', 'Recorded media interview'); person.publicLife.interviews++; gainPublicFame(world, person, 2); person.publicLife.image = bounded(person.publicLife.image + 1); fact(world, 'I gave an interview about my actual life and work.', 'fame'); result(world, 'Your story, in your words', 'The interview is recorded. The fee reflects this appearance, with no future salary paid upfront.', 'microphone', [effect('fee', 'Appearance fee', formatMoney(pay), 'positive')]); }
    else { const cost = publicActionQuote(world, command.action).minor; charge(world, cost, command.action === 'event' ? 'public-event' : 'charity', command.action === 'event' ? 'Public event attendance' : 'Community contribution'); if (command.action === 'event') { person.publicLife.appearances++; gainPublicFame(world, person, 2); } person.publicLife.image = bounded(person.publicLife.image + (command.action === 'reputation' ? 5 : 2)); person.stats.respect = bounded(person.stats.respect + (command.action === 'reputation' ? 2 : 0)); person.stats.energy = bounded(person.stats.energy - 5); fact(world, command.action === 'event' ? 'I attended a public event.' : 'I funded a local community project.', 'fame'); result(world, command.action === 'event' ? 'A public evening' : 'Something useful beyond the headlines', 'The actual cost and contribution are recorded. Your public image changes over the choices you make.', command.action === 'event' ? 'fame' : 'growth', [effect('cost', 'Cost', formatMoney({ minor: cost, currency: countries[person.country].currency }), 'negative')]); } return;
  }
  if (command.type === 'find-creators') {
    if (ageOn(person, world.date) < 13) throw new IneligibleAction('Available from age thirteen'); limit(world, 'discover:' + command.platform);
    const people = [0, 1, 2].map(() => { const other = createContact(world, { age: ageOn(person, world.date) < 18 ? draw(world, 'npcs', 13, 17) : draw(world, 'npcs', 20, 45) }); const username = ('creator_' + other.id.replace(/[^a-z0-9]/g, '').slice(-15)).slice(0, 24); makeAccount(world, other, command.platform, username, 'Stories, interests and ordinary life.', draw(world, 'npcs', 300, 150000)); return other; });
    offerPending(world, { kind: 'decision', id: 'creator_meeting_' + world.revision, templateId: 'creator-introduction', title: 'Creators to meet', body: 'Meet other creators and find a reason to make something together.', illustration: 'team', personIds: [person.id, ...people.map(item => item.id)], choices: [...people.map(other => ({ id: other.id, label: fullName(other), effects: [{ kind: 'connect-person' as const, personId: other.id }], resultTitle: 'Introductions made', resultBody: 'You connected with ' + other.firstName + '. Their profile is available in your creator contacts.', journal: 'I met creator ' + fullName(other) + '.' })), { id: 'later', label: 'Maybe another time', effects: [], resultTitle: 'Another time', resultBody: 'The profiles remain part of this world. No collaboration was promised.', journal: 'I browsed some creator profiles.' }] }); return;
  }
  if (command.type === 'cancel-sponsor') {
    const deal = world.sponsorships.find(item => item.id === command.sponsorId && item.ownerId === person.id && item.status === 'active'); if (!deal) throw new IneligibleAction('Choose an active agreement'); deal.status = 'terminated'; deal.endReason = 'Cancelled by creator'; person.publicLife.image = bounded(person.publicLife.image - 2); result(world, 'Agreement ended', 'Future payments stop. Money earned for completed delivery remains yours.', 'contract'); return;
  }
  const account = socialAccount(world, command.accountId);
  if (command.type === 'edit-social') {
    if (world.socialAccounts.some(item => item.id !== account.id && item.platform === account.platform && item.handle.toLowerCase() === command.handle.toLowerCase())) throw new IneligibleAction('That handle is already in use'); account.handle = command.handle; account.bio = command.bio; result(world, 'Profile updated', 'Your identity, audience and history remain attached to this profile.', 'social'); return;
  }
  if (command.type === 'delete-social' || command.type === 'reopen-social') {
    if (command.type === 'delete-social') { if (account.status === 'deleted') throw new IneligibleAction('This profile is already closed'); account.status = 'deleted'; creatorProfileClosed(world,account.id); for (const deal of world.sponsorships.filter(item => item.accountId === account.id && item.status === 'active')) { deal.status = 'terminated'; deal.endReason = 'Profile closed'; } }
    else { if (account.status !== 'deleted') throw new IneligibleAction('This profile is not closed'); account.status = account.suspendedUntil && account.suspendedUntil > month ? 'suspended' : 'active'; if (account.status === 'active') account.suspendedUntil = null; }
    updateFame(world, person); result(world, command.type === 'delete-social' ? 'Profile closed' : 'Profile reopened', 'Its actual audience, post totals, income and disciplinary history remain recorded. Reopening cannot reset a suspension.', 'social'); return;
  }
  if (command.type === 'social-routine') { if(command.cadence==='twice-weekly'){const studio=studioForAccount(world,account.id);if(!studio||studio.focus!=='full-time')throw new IneligibleAction('Eight monthly posts require full-time studio production');const reason=creatorFocusReason(world,studio);if(reason)throw new IneligibleAction(reason);} if (account.status !== 'active') throw new IneligibleAction('An active profile is required'); const reason = topicReason(world, command.topic); if (reason && command.cadence !== 'off') throw new IneligibleAction(reason); account.cadence = command.cadence; account.topic = command.topic; account.intent = command.intent; result(world, 'Posting routine saved', 'Your routine publishes actual posts as months pass. Costs, energy, audience responses and any brand delivery are recorded.', 'social'); return; }
  if (command.type === 'monetise-social') { const reason = monetisationReason(world, account); if (reason) throw new IneligibleAction(reason); account.monetised = true; result(world, 'Creator payments enabled', 'Future delivered views can earn income. Existing views are not paid a second time.', 'contract'); return; }
  if (command.type === 'publish-post') {
    limit(world, 'post:' + account.id, 6); const item = publish(world, account, command.kind, command.intent, command.sponsored, command.caption,false,null,0,command.liveMinutes??0);
    fact(world, 'I published ' + postContent[item.kind].title.toLowerCase() + ' content on ' + platformContent[account.platform].name + (item.response === 'viral' ? '. It went viral.' : '.'), 'social-media');
    result(world, item.response === 'viral' ? 'Viral post!' : item.response === 'quiet' ? 'A quiet response' : item.response === 'controversial' ? 'A difficult reaction' : 'Your post is live', item.response === 'viral' ? 'The audience reached far beyond your regular followers. These responses and gains are saved.' : item.response === 'quiet' ? 'A few people noticed. A quiet post still counts as something you made.' : 'Your post and its actual response are now part of your profile.', item.response === 'viral' ? 'fame' : platformContent[account.platform].art, [effect('views', 'Views', item.views.toLocaleString('en-US')), effect('likes', 'Likes', item.likes.toLocaleString('en-US')), effect('followers', 'Followers', (item.followerDelta >= 0 ? '+' : '') + item.followerDelta.toLocaleString('en-US'), item.followerDelta >= 0 ? 'positive' : 'negative'), ...(item.income.minor ? [effect('income', 'Creator income', formatMoney(item.income), 'positive')] : [])]); return;
  }
  if (command.type === 'seek-sponsor') { const reason = sponsorReason(world, account); if (reason) throw new IneligibleAction(reason); limit(world, 'sponsor:' + account.id); offerSponsor(world, account); return; }
  const target = world.socialAccounts.find(item => item.id === command.targetAccountId && item.ownerId !== person.id && item.status === 'active' && !world.people[item.ownerId].died);
  if (!target || account.status !== 'active') throw new IneligibleAction('Choose another active creator profile');
  if (command.type === 'follow-creator') {
    const existing = world.socialFollows.find(item => item.from === account.id && item.to === target.id);
    if (command.following && !existing) { world.socialFollows.push({ from: account.id, to: target.id, date: { ...world.date } }); const gain = target.followers < 1000000000 ? 1 : 0; target.followers += gain; target.peakFollowers = Math.max(target.peakFollowers, target.followers); target.followerDrift += gain; }
    else if (!command.following && existing) { world.socialFollows = world.socialFollows.filter(item => item !== existing); const loss = target.followers ? 1 : 0; target.followers -= loss; target.followerDrift -= loss; }
    else throw new IneligibleAction(command.following ? 'You already follow this profile' : 'You do not follow this profile');
    updateFame(world, world.people[target.ownerId]); result(world, command.following ? 'Following' : 'Unfollowed', 'Your actual connection to @' + target.handle + ' is recorded. Following does not guarantee a collaboration.', 'social'); return;
  }
  if (command.type === 'collaborate') {
    const other = world.people[target.ownerId], relation = relationFor(world, person.id, other.id); if (!relation || other.died || isConfined(world, other)) throw new IneligibleAction('Meet an available creator before proposing a collaboration');
    const reason = postReason(world, account, account.topic) ?? postReason(world, target, target.topic); if (reason) throw new IneligibleAction(reason); limit(world, 'collaborate:' + account.id, 2); limit(world, 'collaborator:' + target.id);
    const cost = collaborationCost(world); if (availableCash(accountFor(world)) < cost.minor) throw new IneligibleAction('Your available balance cannot fund production');
    const chance = Math.max(10, Math.min(90, 25 + Math.round(relation.trust / 2) - (target.followers > Math.max(1000, account.followers * 10) ? 20 : 0)));
    const accepted = draw(world, 'outcomes', 1, 100) <= chance, item: World['collaborations'][number] = { id: 'collab_' + world.revision, a: account.id, b: target.id, date: { ...world.date }, accepted, fee: { ...cost, minor: accepted ? cost.minor : 0n }, postIds: [] }; world.collaborations.push(item);
    if (!accepted) { result(world, 'Not this time', other.firstName + ' declined. No production fee was spent and no post was invented.', 'team'); return; }
    charge(world, cost.minor, 'collaboration-production', 'Joint content production'); const firstFollowers = account.followers, secondFollowers = target.followers;
    const first = publish(world, account, account.topic, 'authentic', false, 'A collaboration with ' + other.firstName + '.', false, item.id, Math.floor(secondFollowers / 4));
    const second = publish(world, target, target.topic, 'authentic', false, 'A collaboration with ' + person.firstName + '.', false, item.id, Math.floor(firstFollowers / 4)); item.postIds = [first.id, second.id]; relation.strength = bounded(relation.strength + 5); relation.trust = bounded(relation.trust + 3);
    fact(world, 'I collaborated with ' + fullName(other) + ' on original content.', 'social-media'); result(world, 'You made something together', 'Both actual profiles published a recorded post. Each audience responded independently.', 'team', [effect('followers', 'Your new followers', String(first.followerDelta), first.followerDelta >= 0 ? 'positive' : 'negative')]); return;
  }
  throw new IneligibleAction('This social action is unavailable');
}
export function socialMonth(world: World) {
  const month = absolute(world), tracked = new Set(financialActors(world).map(person => person.id));
  for (const account of world.socialAccounts) {
    const person = world.people[account.ownerId]; if (person.died || account.lastMonth >= month) continue; account.lastMonth = month;
    if (account.status === 'suspended' && account.suspendedUntil !== null && account.suspendedUntil <= month) { account.status = 'active'; account.suspendedUntil = null; }
    if (account.status !== 'active' || !tracked.has(person.id)) continue;
    const count = account.cadence === 'twice-weekly' ? 8 : account.cadence === 'weekly' ? 4 : account.cadence === 'twice-monthly' ? 2 : account.cadence === 'monthly' ? 1 : 0, deal = world.sponsorships.find(item => item.accountId === account.id && item.status === 'active');
    for (let index = 0; index < count; index++) {
      const sponsored = !!deal && (account.periods.find(item => item.month === month)?.sponsored ?? 0) < deal.requiredPosts, topic = sponsored && deal ? deal.topic : account.topic;
      const reason=postReason(world,account,topic);if(reason){const studioReason=creatorProductionReason(world,account,postCost(world,account.intent,person));if(studioReason)creatorRoutineWarning(world,account,studioReason);break;}
      if(availableCash(accountFor(world,person))<postCost(world,account.intent,person).minor)break;
      publish(world, account, topic, account.intent, sponsored, undefined, true,null,0,studioForAccount(world,account.id)?.kind==='streamer'?60:0);
      if (world.controversies.some(item => item.personId === person.id && !item.resolved)) break;
    }
    account.periods = account.periods.filter(item => item.month >= month - 1);
    if (!count && account.followers && !account.periods.some(item => item.month === month && item.posts)) { const loss = Math.min(account.followers, Math.max(1, Math.floor(account.followers / 1000))); account.followers -= loss; account.followerDrift -= loss; }
    if (account.followers >= 100000 && person.publicLife.image >= 50) account.verified = true;
    if (person.id === world.activePersonId && !sponsorReason(world, account) && !world.actionCounts[person.id + ':social-media:' + world.date.year + ':sponsor:' + account.id] && draw(world, 'events', 1, 100) <= 5) { world.actionCounts[person.id + ':social-media:' + world.date.year + ':sponsor:' + account.id] = 1; offerSponsor(world, account); }
  }
  for (const deal of world.sponsorships) {
    if (deal.status === 'offered' && deal.expiresMonth < month) { deal.status = 'expired'; continue; }
    if (deal.status !== 'active' || deal.startMonth === null || month <= deal.startMonth || deal.lastMonth >= month) continue;
    const account = world.socialAccounts.find(item => item.id === deal.accountId)!, person = world.people[deal.ownerId], delivered = account.periods.find(item => item.month === month)?.sponsored ?? 0;
    const paid = account.status === 'active' && delivered >= deal.requiredPosts ? deal.monthlyPay.minor : 0n; deal.lastMonth = month; deal.deliveries.push({ month, posts: delivered, paid }); deal.earned += paid; deal.misses = paid ? 0 : deal.misses + 1;
    if (paid) credit(world, person, { ...deal.monthlyPay, minor: paid }, 'sponsorship', 'Delivered brand agreement: ' + deal.brand);
    else fact(world, 'My ' + deal.brand + ' agreement missed its monthly delivery requirement; no payment was made.', 'fame', '', person.id);
    if (deal.misses >= 2) { deal.status = 'terminated'; deal.endReason = 'Two consecutive missed deliveries'; person.publicLife.image = bounded(person.publicLife.image - 5); }
    else if (deal.deliveries.length >= deal.termMonths) { deal.status = 'completed'; deal.endReason = 'Term completed'; fact(world, 'I completed my recorded agreement with ' + deal.brand + '.', 'fame', '', person.id); }
  }
  for (const person of Object.values(world.people)) if (!person.died && person.publicLife.lastMonth < month) { person.publicLife.lastMonth = month; updateFame(world, person); }
}
export function publicConviction(world: World, person: Person, violent: boolean) {
  person.publicLife.image = bounded(person.publicLife.image - (violent ? 20 : 10));
  for (const deal of world.sponsorships.filter(item => item.ownerId === person.id && item.status === 'active')) { deal.status = 'terminated'; deal.endReason = 'Contract ended after conviction'; }
}
export function socialDeath(world: World, person: Person) {
  for (const account of world.socialAccounts.filter(item => item.ownerId === person.id && item.status !== 'deleted')) { account.status = 'memorial'; account.cadence = 'off'; account.suspendedUntil = null; }
  for (const deal of world.sponsorships.filter(item => item.ownerId === person.id && (item.status === 'active' || item.status === 'offered'))) { deal.status = 'ended-death'; deal.endReason = 'Creator died'; }
  for (const item of world.controversies.filter(item => item.personId === person.id && !item.resolved)) { item.response = 'ignore'; item.resolved = { ...world.date }; }
}
