import { ageOn, fullName, validateWorld, World } from './model';
import { monthFrom } from './calendar';
import { bindEvent, eligibleTemplates } from './content/events';
import { randomInteger } from './random';
import { Effect, effectRowSchema } from './runtime';
import { z } from 'zod';
import { formatMoney } from './money';
import { IneligibleAction } from './errors';
import { educationCommandSchema, EducationCommand, educationMonth, resolveEducation } from './systems/education';
import { workCommandSchema, WorkCommand, workMonth, resolveWork, endEmployment } from './systems/work';
import { financeCommandSchema, FinanceCommand, financeMonth, resolveFinance, settleTax } from './systems/finance';
import { accountFor, post } from './systems/common';
import { assetCommandSchema, AssetCommand, assetsMonth, completeAssetSale, ownedAsset, absoluteMonth, resolveAssets, updatePropertyMarket } from './systems/assets';
import { marketCommandSchema, MarketCommand, marketMonth, resolveMarket } from './systems/markets';
import { connectPerson, recordFamilyDeath, relationshipsYear, resolveSocial, socialCommandSchema, SocialCommand } from './systems/relationships';
import { financialActors } from './systems/households';
import { householdMonth, npcDiscretionaryMonth, npcYearDecisions, settleBackground } from './systems/npcBudget';
import { careAfterDeath, familyCommandSchema, FamilyCommand, familyFinanceMonth, familyMonth, familyYear, resolveFamily } from './systems/family';
export { IneligibleAction } from './errors';

export type GameCommand = { type: 'advance' } | { type: 'resume' } | { type: 'choose'; eventId: string; choiceId: string } | { type: 'acknowledge'; resultId: string } | EducationCommand | WorkCommand | FinanceCommand | AssetCommand | MarketCommand | SocialCommand | FamilyCommand;
const clamp = (value: number) => Math.min(100, Math.max(0, value));
const labels: Record<string, string> = { happiness: 'Happiness', health: 'Health', smarts: 'Smarts', looks: 'Looks', respect: 'Respect', energy: 'Energy', fitness: 'Fitness', stress: 'Stress', discipline: 'Discipline', fame: 'Fame' };

function journal(world: World, id: string, text: string, category: string) {
  world.journal.push({ id, date: { ...world.date }, personId: world.activePersonId, text, category });
}
function roll(world: World, stream: keyof World['random'], min: number, max: number) {
  const result = randomInteger(world.random[stream], min, max);
  world.random[stream] = result.state;
  return result.value;
}
function death(world: World, personId: string, cause: string) {
  const person = world.people[personId];
  person.died = { ...world.date }; person.causeOfDeath = cause;
  recordFamilyDeath(world, personId);
  settleBackground(world, person, world.date.year * 12 + world.date.month - 1);
  settleTax(world, person);
  if (person.employment) endEmployment(world, personId);
  careAfterDeath(world, personId);
  if (personId === world.activePersonId) {
    journal(world, 'death_' + personId, 'I died at age ' + ageOn(person, world.date) + '. Cause: ' + cause + '.', 'death');
    world.annual = null; world.pending = null;
  } else {
    const related = world.relationships.some(relation => (relation.from === personId && relation.to === world.activePersonId) || (relation.to === personId && relation.from === world.activePersonId));
    if (related) journal(world, 'death_' + personId, fullName(person) + ' died at age ' + ageOn(person, world.date) + '.', 'family');
  }
}

/** A month is the smallest ordinary progression unit; no system rounds a six-month term to a year. */
function processMonth(world: World) {
  for (const person of Object.values(world.people)) if (!person.died) educationMonth(world, person);
  householdMonth(world);
  const actors = financialActors(world);
  const openingCash = new Map<string, bigint>();
  for (const person of actors) { settleBackground(world, person, world.date.year * 12 + world.date.month - 2); openingCash.set(person.id, accountFor(world, person).cash); workMonth(world, person); }
  marketMonth(world);
  const propertyMovement = updatePropertyMarket(world);
  for (const person of actors) { assetsMonth(world, person, propertyMovement); financeMonth(world, person); person.lastEconomicMonth = world.date.year * 12 + world.date.month - 1; }
  familyFinanceMonth(world);
  for (const person of actors) npcDiscretionaryMonth(world, person, openingCash.get(person.id)!);
  familyMonth(world);
  for (const person of Object.values(world.people)) {
    if (person.died) continue;
    const age = ageOn(person, world.date);
    if (age >= 45 && roll(world, person.id === world.activePersonId ? 'outcomes' : 'npcs', 1, 12) === 1) person.stats.health = clamp(person.stats.health - (age >= 80 ? 2 : 1));
    const base = age >= 115 ? 6500 : age >= 105 ? 1400 : age >= 95 ? 400 : age >= 85 ? 140 : age >= 75 ? 50 : age >= 65 ? 15 : age >= 45 ? 2 : 0;
    const threshold = base + (person.stats.health < 20 ? (20 - person.stats.health) * 30 : 0);
    if (roll(world, person.id === world.activePersonId ? 'outcomes' : 'npcs', 1, 10000) <= threshold) {
      death(world, person.id, person.stats.health < 20 ? 'declining health' : 'natural causes');
      if (world.people[world.activePersonId].died) return;
    }
  }
}

function finishYear(world: World) {
  const frame = world.annual!;
  frame.stage = 'complete';
  const player = world.people[world.activePersonId];
  const age = ageOn(player, world.date);
  player.stats.energy = clamp(player.stats.energy + 20);
  player.stats.stress = clamp(player.stats.stress - 3);
  for (const person of financialActors(world)) settleTax(world, person);
  npcYearDecisions(world);
  relationshipsYear(world);
  familyYear(world);
  const eligible = eligibleTemplates(world);
  const birthday = eligible.find(template => template.id === 'first-cake');
  // Introductory year is guaranteed; later years leave room for quiet years.
  const shouldOffer = age === 1 || roll(world, 'events', 1, 100) <= 78;
  if (shouldOffer && eligible.length) {
    const template = age === 1 && birthday ? birthday : eligible[roll(world, 'events', 0, eligible.length - 1)];
    world.pending = bindEvent(world, template);
    world.eventHistory.push({ templateId: template.id, year: world.date.year });
  } else {
    const text = age < 3 ? 'I grew a little more confident in a world full of things to investigate.' : age < 18 ? 'Another birthday arrived. Some days felt much bigger than others.' : 'Another year passed. The ordinary days were part of my life too.';
    journal(world, frame.id + '_quiet', text, 'year');
    world.pending = { kind: 'result', id: frame.id + '_summary', title: 'Age ' + age, body: text, illustration: 'journal', effects: [] };
  }
}

function continueYear(world: World) {
  while (world.annual && world.annual.monthsProcessed < 12 && !world.pending) {
    const frame = world.annual;
    frame.monthsProcessed++;
    world.date = monthFrom(frame.startDate, frame.monthsProcessed, world.calendarAnchorDay);
    processMonth(world);
  }
  if (world.annual?.stage === 'months' && !world.pending) finishYear(world);
}

function applyEffects(world: World, effects: Effect[]): z.infer<typeof effectRowSchema>[] {
  return effects.flatMap((effect, index) => {
    if (effect.kind === 'connect-person') return connectPerson(world, effect.personId);
    if (effect.kind === 'asset-sale') {
      const asset = ownedAsset(world, effect.assetId);
      if (asset.listing?.offer !== effect.minor) throw new IneligibleAction('That property offer is no longer available');
      return completeAssetSale(world, effect.assetId, effect.minor);
    }
    if (effect.kind === 'decline-sale') {
      const asset = ownedAsset(world, effect.assetId);
      if (!asset.listing?.offer) throw new IneligibleAction('That property offer is no longer available');
      asset.listing.offer = null; asset.listing.nextOfferMonth = absoluteMonth(world) + 2;
      return [{ id: 'listing', label: 'Property', value: 'Still listed', tone: 'neutral' as const }];
    }
    let label: string, value: string, delta: number;
    if (effect.kind === 'stat') {
      const stats = world.people[effect.personId].stats;
      const before = stats[effect.stat];
      stats[effect.stat] = clamp(before + effect.delta);
      delta = stats[effect.stat] - before; label = labels[effect.stat]; value = (delta >= 0 ? '+' : '') + delta + '%';
      // Reducing stress is beneficial, unlike reducing health.
      if (effect.stat === 'stress') delta = -delta;
    } else if (effect.kind === 'relationship') {
      const relation = world.relationships.find(r => r.id === effect.relationshipId);
      if (!relation) throw new IneligibleAction('That relationship no longer exists');
      const before = relation.strength; relation.strength = clamp(before + effect.delta);
      delta = relation.strength - before; label = 'Relationship'; value = (delta >= 0 ? '+' : '') + delta + '%';
    } else {
      const from = world.accounts.find(account => account.id === effect.fromAccountId);
      const to = world.accounts.find(account => account.id === effect.toAccountId);
      if (!from || !to || from.id === to.id || from.currency !== to.currency || from.cash < effect.minor) throw new IneligibleAction('That transfer is no longer available');
      post(world, -effect.minor, 0n, 'transfer', 'Money transferred', null, world.people[from.ownerId], from.currency);
      post(world, effect.minor, 0n, 'transfer', 'Money received', null, world.people[to.ownerId], to.currency);
      delta = to.ownerId === world.activePersonId ? 1 : -1;
      label = 'Bank balance'; value = (delta > 0 ? '+' : '−') + formatMoney({ minor: effect.minor, currency: from.currency });
    }
    return [{ id: 'effect_' + index, label, value, tone: delta > 0 ? 'positive' as const : delta < 0 ? 'negative' as const : 'neutral' as const }];
  });
}

/** Pure: consumes only persisted random streams and never mutates its input. */
export function resolveCommand(previous: World, command: GameCommand): World {
  // Zod returns a deep copy while validating, including bigint values.
  const world = validateWorld(previous);
  const player = world.people[world.activePersonId];
  if (player.died) throw new IneligibleAction('This life has ended');
  if (!world.birthAcknowledged) throw new IneligibleAction('Begin this life first');
  if (command.type === 'advance') {
    if (world.pending || world.annual) throw new IneligibleAction('Finish the current event first');
    world.annual = { id: 'year_' + world.revision, startDate: { ...world.date }, targetDate: monthFrom(world.date, 12, world.calendarAnchorDay), monthsProcessed: 0, stage: 'months' };
    continueYear(world);
  } else if (command.type === 'resume') {
    if (!world.annual || world.pending) throw new IneligibleAction('There is no interrupted year to resume');
    continueYear(world);
  } else if (command.type === 'choose') {
    const event = world.pending;
    if (event?.kind !== 'decision' || event.id !== command.eventId) throw new IneligibleAction('That decision is no longer open');
    const choice = event.choices.find(item => item.id === command.choiceId);
    if (!choice) throw new IneligibleAction('Choose an available option');
    const effects = applyEffects(world, choice.effects);
    journal(world, event.id + '_choice', choice.journal, 'event');
    world.pending = { kind: 'result', id: event.id + '_result', title: choice.resultTitle, body: choice.resultBody, illustration: event.illustration, effects };
  } else if (command.type === 'acknowledge') {
    if (world.pending?.kind !== 'result' || world.pending.id !== command.resultId) throw new IneligibleAction('That result is no longer open');
    world.pending = null;
    if (world.annual?.stage === 'complete') world.annual = null;
    else if (world.annual) continueYear(world);
  } else {
    if (world.pending || world.annual) throw new IneligibleAction('Finish the current event first');
    const education = educationCommandSchema.safeParse(command);
    const work = workCommandSchema.safeParse(command);
    const finance = financeCommandSchema.safeParse(command);
    const assets = assetCommandSchema.safeParse(command);
    const market = marketCommandSchema.safeParse(command);
    const social = socialCommandSchema.safeParse(command);
    const family = familyCommandSchema.safeParse(command);
    if (education.success) resolveEducation(world, education.data);
    else if (work.success) resolveWork(world, work.data);
    else if (finance.success) resolveFinance(world, finance.data);
    else if (assets.success) resolveAssets(world, assets.data);
    else if (market.success) resolveMarket(world, market.data);
    else if (social.success) resolveSocial(world, social.data);
    else if (family.success) resolveFamily(world, family.data);
    else throw new IneligibleAction('This action is not available');
  }
  world.revision++;
  return validateWorld(world);
}
