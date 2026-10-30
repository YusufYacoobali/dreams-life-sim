import type { World } from '../model';
import type { BoundChoice, RuntimeEffectRow } from '../runtime';
import { fullName } from '../personHelpers';
import { IneligibleAction } from '../errors';
import { formatMoney, roundRatio } from '../money';
import { rules } from '../rules';
import { actorStories, actorActionStories } from '../content/actorStories';
import { modelCareerStories, modelActionStories } from '../content/modelCareerStories';
import type { CreativeStory, CreativeStoryChoice } from '../content/creativeStories';
import { offerPending } from '../pendingQueue';
import { active, accountFor, availableCash, bounded, charge, fact } from './common';
import { getIndustry, type CreativeCareer } from './creativeCore';
import { creativeMonthNumber, type CreativeChoiceEffect } from './creativeSchemas';
import { relationFor } from './relationshipQueries';
import { gainPublicFame } from './social';
const stories = (career: CreativeCareer, action = false): readonly CreativeStory[] => career.kind === 'actor' ? action ? actorActionStories : actorStories : action ? modelActionStories : modelCareerStories;
const work = (career: CreativeCareer) => career.projects.find(project => project.status === 'active' && project.creative);
const replace = (text: string, contact: string, project: string) => text.replaceAll('{contact}', contact).replaceAll('{project}', project);
const cost = (world: World, choice: CreativeStoryChoice) => roundRatio(rules[active(world).country].baseWage * BigInt(choice.impact.costBps ?? 0), 10000n);
function eligible(world: World, career: CreativeCareer, story: CreativeStory) {
  const industry = getIndustry(career)!, project = work(career), contact = industry.contacts[story.contact];
  return !!contact && !world.people[contact]?.died && (story.phase === 'any' || (story.phase === 'working') === !!project)
    && (!(story.requiresAgency || story.contact === 'agent') || industry.representation.tier !== 'independent')
    && (!story.requiresExclusive || !!project?.creative?.exclusivity || !!career.modelCareer?.brands.some(brand => brand.status === 'active'))
    && (!story.minCredits || industry.completed >= story.minCredits)
    && (!story.categories || !!project && story.categories.includes(project.creative!.category));
}
export function offerCreativeStory(world: World, career: CreativeCareer, action = false) {
  const industry = getIndustry(career), month = creativeMonthNumber(world), quarter = Math.floor(month / 3);
  if (!industry || industry.decision || career.personId !== world.activePersonId || active(world).died || !['active','between'].includes(career.status) || (!action && world.pending)) return;
  // At most two authored situations per year, in distinct half-years. No waiting callback chain.
  if (action && industry.lastDecisionQuarter >= quarter) return;
  if ((world.actionCounts[career.personId + ':' + career.kind + ':stories:' + world.date.year] ?? 0) >= 2) return;
  if (!action && (industry.lastDecisionQuarter >= quarter || (world.actionCounts[career.personId + ':' + career.kind + ':stories:' + world.date.year] ?? 0) >= 2 || month % 6 !== 2)) return;
  const eligibleStories = stories(career, action).filter(story => eligible(world, career, story));
  let pool = eligibleStories.filter(story => !industry.seenStories.includes(story.id));
  if (!pool.length && eligibleStories.length) {
    // Cycle a bounded recent-history window after exhaustion; long careers retain incidents.
    industry.seenStories = industry.seenStories.slice(-Math.min(4, Math.max(0, eligibleStories.length - 1)));
    if (eligibleStories.length === 1) industry.seenStories = [];
    pool = eligibleStories.filter(story => !industry.seenStories.includes(story.id));
  }
  if (!pool.length) return;
  const story = pool[(industry.decisionCount + [...world.id].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % pool.length], project = work(career), contactId = industry.contacts[story.contact];
  const id = 'creative_' + career.id + '_' + month + '_' + industry.decisionCount;
  const contact = fullName(world.people[contactId]);
  industry.decision = { id, storyId: story.id, projectId: project?.id ?? null, offeredMonth: month };
  industry.lastDecisionQuarter = quarter; industry.decisionCount++; industry.seenStories.push(story.id);
  if (industry.seenStories.length > 26) industry.seenStories.shift();
  const key = career.personId + ':' + career.kind + ':stories:' + world.date.year; world.actionCounts[key] = (world.actionCounts[key] ?? 0) + 1;
  offerPending(world, { kind: 'decision', id, templateId: 'creative-' + story.id, title: story.title, body: replace(story.body, contact, project?.name ?? 'your next booking'), illustration: career.kind, personIds: [career.personId, contactId], choices: story.choices.map(choice => ({ id: choice.id, label: choice.label, effects: [{ kind: 'creative-choice' as const, careerId: career.id, decisionId: id, choiceId: choice.id, snapshot: { version: 1 as const, storyId: story.id, title: story.title, contactId, projectId: project?.id ?? null, cost: { minor: cost(world, choice), currency: accountFor(world).currency }, impact: { ...choice.impact } } }], resultTitle: story.title, resultBody: replace(choice.result, contact, project?.name ?? 'your next booking'), journal: replace(choice.journal, contact, project?.name ?? 'my next booking') })) }, 25);
  if (world.annual?.stage === 'months') world.annual.pausedForPlanning = true;
}
export function creativeChoiceReason(world: World, effect: CreativeChoiceEffect): string | undefined {
  const career = world.careers.find(item => item.id === effect.careerId && item.personId === world.activePersonId), industry = career && getIndustry(career);
  if (!career || !industry?.decision || industry.decision.id !== effect.decisionId) return 'This career decision is no longer open.';
  const snapshot = effect.snapshot;
  if (snapshot.storyId !== industry.decision.storyId || snapshot.projectId !== industry.decision.projectId || !world.people[snapshot.contactId]) return 'This saved industry response has lost its context.';
  const saved = [world.pending, ...world.deferred.map(entry => entry.event)].find(event => event?.kind === 'decision' && event.id === effect.decisionId);
  if (saved?.kind === 'decision' && !saved.choices.some(choice => choice.id === effect.choiceId)) return 'Choose a saved industry response.';
  if (snapshot.cost.minor > availableCash(accountFor(world, active(world), snapshot.cost.currency))) return 'Your available balance cannot cover this choice.';
}
export function resolveCreativeChoice(world: World, effect: CreativeChoiceEffect, _bound?: BoundChoice): RuntimeEffectRow[] {
  const reason = creativeChoiceReason(world, effect); if (reason) throw new IneligibleAction(reason);
  const career = world.careers.find(item => item.id === effect.careerId)!, industry = getIndustry(career)!, decision = industry.decision!, snapshot = effect.snapshot, impact = snapshot.impact;
  const person = world.people[career.personId], project = snapshot.projectId ? career.projects.find(item => item.id === snapshot.projectId) : undefined, meta = project?.creative, contact = snapshot.contactId, relationship = relationFor(world, person.id, contact);
  industry.decision = null;
  const paid = snapshot.cost.minor; if (paid) charge(world, paid, 'career-industry-cost', snapshot.title, undefined, snapshot.cost.currency);
  career.reputation = bounded(career.reputation + (impact.reputation ?? 0));
  person.stats.stress = bounded(person.stats.stress + (impact.stress ?? 0)); person.stats.health = bounded(person.stats.health + (impact.health ?? 0)); person.publicLife.image = bounded(person.publicLife.image + (impact.publicImage ?? 0));
  if (relationship) { relationship.lastInteractionYear = world.date.year; relationship.strength = bounded(relationship.strength + (impact.relationship ?? 0)); relationship.trust = bounded(relationship.trust + (impact.relationship ?? 0)); if (relationship.memories.length < 40) relationship.memories.push('industry:' + snapshot.storyId + ':' + world.date.year); }
  industry.opportunityBoost = Math.max(-30, Math.min(30, industry.opportunityBoost + (impact.opportunity ?? 0)));
  industry.representation.rapport = bounded(industry.representation.rapport - (impact.agencyRisk ?? 0));
  industry.representation.commissionBps = Math.max(0, Math.min(3000, industry.representation.commissionBps + (impact.commissionBps ?? 0)));
  if (meta && project?.status === 'active') {
    meta.qualityBonus = Math.max(-50, Math.min(50, meta.qualityBonus + (impact.quality ?? 0)));
    meta.publicity = Math.max(-50, Math.min(50, meta.publicity + (impact.publicity ?? 0)));
    // A written amendment changes only remaining monthly pay, never earned receipts.
    if (impact.payBps && person.employment?.id === project.employmentId) person.employment.annualPay = roundRatio(person.employment.annualPay * BigInt(Math.max(5000, Math.min(15000, 10000 + impact.payBps))), 10000n);
    if (meta.choices.length < 12) meta.choices.push({ id: decision.id, choice: effect.choiceId, month: creativeMonthNumber(world), note: _bound?.resultBody ?? snapshot.title });
  }
  if (impact.publicity && impact.publicity > 0) gainPublicFame(world, person, Math.min(3, Math.ceil(impact.publicity / 4)));
  if (career.modelCareer && impact.portfolio) { const category = meta?.category, spec = category === 'editorial' ? 'editorial' : category === 'runway' ? 'runway' : category === 'luxury' ? 'luxury' : career.modelCareer.specialisations[0]; career.modelCareer.portfolio[spec] = bounded(career.modelCareer.portfolio[spec] + impact.portfolio); }
  if (impact.obligation) {
    const brands = career.modelCareer?.brands.filter(item => item.status === 'active') ?? [];
    if (brands.length) for (const brand of brands) { brand.obligations = Math.max(1, Math.min(12, brand.obligations + impact.obligation)); brand.fulfilled = Math.min(brand.fulfilled, brand.obligations); }
    else { const month = creativeMonthNumber(world), finish = project ? project.started.year * 12 + project.started.month - 1 + project.targetMonths : month; industry.bookingHoldUntil = Math.max(month - 1, Math.min(month + 12, (impact.obligation > 0 ? Math.max(industry.bookingHoldUntil, finish) : Math.max(industry.bookingHoldUntil, month - 1)) + impact.obligation)); }
  }
  if (impact.leaveAgency && industry.representation.tier !== 'independent') { const last = industry.representation.history.at(-1); if (last) { last.ended = { ...world.date }; last.reason = snapshot.title; } industry.representation.tier = 'independent'; industry.representation.agentId = null; industry.representation.commissionBps = 0; }
  return [{ id: 'industry-reputation', label: 'Industry reputation', value: career.reputation + '%', tone: (impact.reputation ?? 0) < 0 ? 'negative' : 'positive' }, ...(paid ? [{ id: 'industry-cost', label: 'Actual payment', value: formatMoney({ minor: paid, currency: snapshot.cost.currency }), tone: 'negative' as const }] : []), ...(relationship ? [{ id: 'industry-contact', label: fullName(world.people[contact]), value: relationship.trust + '% trust', tone: (impact.relationship ?? 0) < 0 ? 'negative' as const : 'positive' as const }] : [])];
}
export function creativeStoriesMonth(world: World) { for (const career of world.careers) if (getIndustry(career)) offerCreativeStory(world, career); }
export function cancelCreativeDecision(world: World, career: CreativeCareer) {
  const industry = getIndustry(career); if (!industry?.decision) return;
  const id = industry.decision.id; industry.decision = null;
  if (world.pending?.id === id) { world.pending = null; world.pendingPriority = 0; }
  world.deferred = world.deferred.filter(entry => entry.event.id !== id);
}
