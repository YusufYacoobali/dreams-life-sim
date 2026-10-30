import { copyWorld, decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { actorStories, actorActionStories } from '../../src/game/content/actorStories';
import { modelCareerStories, modelActionStories } from '../../src/game/content/modelCareerStories';
import type { CreativeStory, CreativeStoryChoice } from '../../src/game/content/creativeStories';
import { offerCreativeStory } from '../../src/game/systems/creativeEvents';
import { accountFor, bounded } from '../../src/game/systems/common';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import { gainPublicFame } from '../../src/game/systems/social';
import { modelSpecialisations } from '../../src/game/systems/modelCareerSchemas';
import { roundRatio } from '../../src/game/money';
import { creativeMonthNumber, type CreativeKind } from '../../src/game/systems/creativeSchemas';
import { creativeBook, creativeCareer, creativeIndustry, experiencedCreative } from '../support/creativeCareer';

type Case = { kind: CreativeKind; story: CreativeStory; choice: CreativeStoryChoice; working: boolean; action: boolean };
const cases: Case[] = [];
for (const [kind, main, actions] of [['actor', actorStories, actorActionStories], ['model', modelCareerStories, modelActionStories]] as const)
  for (const [catalogue, action] of [[main, false], [actions, true]] as const)
    for (const story of catalogue) for (const working of story.phase === 'any' ? [false, true] : [story.phase === 'working'])
      for (const choice of story.choices) cases.push({ kind, story, choice, working, action });

const bases = new Map<string, World>();
beforeAll(() => {
  for (const kind of ['actor', 'model'] as const) {
    const between = experiencedCreative(kind), person = between.people[between.activePersonId]; gainPublicFame(between, person, 50 - person.publicLife.earnedFame);
    bases.set(kind + ':false', between);
    bases.set(kind + ':true', creativeBook(between, kind, kind === 'actor' ? 'independent-film' : 'ambassador'));
    if (kind === 'model') bases.set('model:editorial', creativeBook(between, 'model', 'editorial'));
  }
});

test('the audit covers every one of the 56 situations and 168 choices, including both eligible states of any-phase situations', () => {
  expect(new Set(cases.map(item => item.story.id)).size).toBe(56);
  expect(new Set(cases.map(item => item.story.id + ':' + item.choice.id)).size).toBe(168);
  expect(cases.length).toBeGreaterThan(168);
});

test.each(cases)('$story.id / $choice.id (working=$working) changes every authored gameplay target and survives reopening', ({ kind, story, choice, working, action }) => {
  const world = copyWorld(bases.get(working && kind === 'model' && story.categories?.includes('editorial') ? 'model:editorial' : kind + ':' + working)!), career = creativeCareer(world, kind), industry = creativeIndustry(world, kind);
  const pool = kind === 'actor' ? action ? actorActionStories : actorStories : action ? modelActionStories : modelCareerStories;
  industry.seenStories = pool.filter(item => item.id !== story.id).map(item => item.id);
  offerCreativeStory(world, career, action);
  if (world.pending?.kind !== 'decision') throw new Error('Missing eligible authored decision: ' + story.id);
  expect(world.pending.templateId).toBe('creative-' + story.id);
  const bound = world.pending.choices.find(item => item.id === choice.id)!, effect = bound.effects[0];
  if (effect.kind !== 'creative-choice') throw new Error('Missing sealed creative effect');
  expect(effect.snapshot.version).toBe(2); expect(effect.snapshot.impact).toEqual(choice.impact);
  const before = copyWorld(world), personBefore = before.people[before.activePersonId], careerBefore = creativeCareer(before, kind), industryBefore = creativeIndustry(before, kind);
  const projectBefore = careerBefore.projects.find(item => item.status === 'active'), contactBefore = relationFor(before, personBefore.id, effect.snapshot.contactId)!;
  const next = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: choice.id }), nextCareer = creativeCareer(next, kind), nextIndustry = creativeIndustry(next, kind), person = next.people[next.activePersonId];
  const project = nextCareer.projects.find(item => item.status === 'active'), meta = project?.creative, contact = relationFor(next, person.id, effect.snapshot.contactId)!, impact = choice.impact;
  expect(next.random).toEqual(before.random); expect(nextIndustry.decision).toBeNull();
  expect(nextCareer.reputation).toBe(bounded(careerBefore.reputation + (impact.reputation ?? 0)));
  expect(person.stats.stress).toBe(bounded(personBefore.stats.stress + (impact.stress ?? 0)));
  expect(person.stats.health).toBe(bounded(personBefore.stats.health + (impact.health ?? 0)));
  expect(person.publicLife.image).toBe(bounded(personBefore.publicLife.image + (impact.publicImage ?? 0)));
  expect(contact.strength).toBe(bounded(contactBefore.strength + (impact.relationship ?? 0)));
  expect(contact.trust).toBe(bounded(contactBefore.trust + (impact.relationship ?? 0)));
  expect(nextIndustry.opportunityBoost).toBe(Math.max(-30, Math.min(30, industryBefore.opportunityBoost + (impact.opportunity ?? 0))));
  expect(nextIndustry.representation.rapport).toBe(bounded(industryBefore.representation.rapport - (impact.agencyRisk ?? 0)));
  expect(nextIndustry.representation.commissionBps).toBe(impact.leaveAgency ? 0 : Math.max(0, Math.min(3000, industryBefore.representation.commissionBps + (impact.commissionBps ?? 0))));
  if (impact.leaveAgency) expect(nextIndustry.representation.tier).toBe('independent');
  expect(accountFor(next).cash).toBe(accountFor(before).cash - effect.snapshot.cost.minor);
  expect(next.ledger.filter(row => row.category === 'income')).toEqual(before.ledger.filter(row => row.category === 'income'));
  if (impact.quality || impact.payBps) expect(working).toBe(true);
  if (meta) {
    expect(meta.qualityBonus).toBe(projectBefore!.creative!.qualityBonus + (impact.quality ?? 0));
    expect(meta.publicity).toBe(projectBefore!.creative!.publicity + (impact.publicity ?? 0));
    expect(meta.commissionBps).toBe(projectBefore!.creative!.commissionBps); // Story amendments never change signed fees.
    expect(person.publicLife.earnedFame).toBe(personBefore.publicLife.earnedFame); // Publicity pays off at release, once.
  } else if (impact.publicity) {
    expect(person.publicLife.earnedFame).toBe(personBefore.publicLife.earnedFame + Math.sign(impact.publicity) * Math.min(3, Math.ceil(Math.abs(impact.publicity) / 4)));
  }
  if (impact.payBps) expect(person.employment!.annualPay).toBe(roundRatio(personBefore.employment!.annualPay * BigInt(10000 + impact.payBps), 10000n));
  if (impact.portfolio) {
    const spec = effect.snapshot.portfolioArea!; expect(spec).toBeDefined();
    expect(nextCareer.modelCareer!.portfolio[spec]).toBe(careerBefore.modelCareer!.portfolio[spec] + impact.portfolio);
    for (const key of modelSpecialisations) if (key !== spec) expect(nextCareer.modelCareer!.portfolio[key]).toBe(careerBefore.modelCareer!.portfolio[key]);
  }
  if (impact.obligation) {
    if (kind === 'model') expect(nextCareer.modelCareer!.brands[0].obligations).toBe(careerBefore.modelCareer!.brands[0].obligations + impact.obligation);
    else expect(nextIndustry.bookingHoldUntil).toBeGreaterThan(creativeMonthNumber(next));
  }
  if (next.pending?.kind !== 'result') throw new Error('Missing immediate industry result');
  expect(next.pending.body).toBe(bound.resultBody); expect(next.journal.some(row => row.text === bound.journal)).toBe(true);
  expect(decodeWorld(encodeWorld(next))).toEqual(next);
});
