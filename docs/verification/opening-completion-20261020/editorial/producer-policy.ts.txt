import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import type { CountryCode } from '../../src/game/countries';
import type { GameCommand } from '../../src/game/engine';
import type { World } from '../../src/game/model';
import type { BoundChoice, Pending } from '../../src/game/runtime';

export const editorialPolicyVersion = 1;
export type EditorialRuntime = Pick<typeof import('../../src/game/engine'), 'resolveCommand'>
  & Pick<typeof import('../../src/game/model'), 'encodeWorld' | 'ageOn' | 'validateWorld'>
  & Pick<typeof import('../../src/persistence/checkpoints'), 'packCheckpoint' | 'unpackCheckpoint'>
  & Pick<typeof import('../../src/game/choiceAvailability'), 'choiceUnavailable'>
  & Pick<typeof import('../../src/game/content/events'), 'eventTemplates'>;
export type EditorialBirthRuntime = Pick<typeof import('../../src/state/gameStore'), 'createGameStore'>
  & Pick<typeof import('../../src/persistence/repository'), 'SaveRepository'>
  & Pick<typeof import('../../src/game/createLife'), 'randomCreation'>
  & Pick<typeof import('../../src/game/countries'), 'countries'>
  & Pick<typeof import('./sqlite'), 'database'>;

/** Stable output retains bigint types instead of confusing fees with strings. */
export const editorialJson = (value: unknown): string => JSON.stringify(value, (_, item) => {
  if (typeof item === 'bigint') return { $dreamsBigInt: item.toString() };
  if (item && typeof item === 'object' && !Array.isArray(item)) return Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]]));
  return item;
});
const sha = (value: string) => createHash('sha256').update(value).digest('hex');

/** No actor/world edits: actual saved StartLife and acknowledgement only. */
export async function createEditorialLife(runtime: EditorialBirthRuntime, country: CountryCode, seed: number) {
  const { sqlite, driver } = runtime.database();
  try {
    const repository = new runtime.SaveRepository(driver); await repository.initialise();
    const input = { ...runtime.randomCreation(seed), country, city: runtime.countries[country].cities[0], background: 'ordinary' as const }, date = { year: 2000, month: 1, day: 1 };
    const store = runtime.createGameStore({ repository: async () => repository, date: () => date, id: () => 'life_editorial_' + country + '_' + seed });
    assert.equal(await store.getState().startLife(input, seed), true); assert.equal(store.getState().world!.birthAcknowledged, false);
    assert.equal(await store.getState().acknowledgeBirth(), true);
    const world = store.getState().world!; assert.ok(Object.isFrozen(world)); assert.equal(world.revision, 1);
    return { world, input, date, seed, birthRevision: world.revision };
  } finally { sqlite.close(); }
}

type Decision = Extract<Pending, { kind: 'decision' }>;
/** Ordinal is zero-based, counts committed decisions (including system prompts), and resets each life. */
export function selectEditorialChoice(world: World, event: Decision, ordinal: number, unavailable: (world: World, choice: BoundChoice) => string | undefined) {
  assert.ok(Number.isSafeInteger(ordinal) && ordinal >= 0);
  const choices = event.choices.map((choice, sourceIndex) => ({ choice, sourceIndex, unavailableReason: unavailable(world, choice) ?? null }));
  const eligible = choices.filter(row => row.unavailableReason === null);
  assert.ok(eligible.length, 'A real pending decision must have an available choice');
  const eligibleIndex = ordinal % eligible.length, selected = eligible[eligibleIndex];
  return { ordinal, eligibleIndex, sourceIndex: selected.sourceIndex, choice: selected.choice, choices, eligibleIds: eligible.map(row => row.choice.id) };
}

function progression(world: World) {
  const person = world.people[world.activePersonId];
  return { personId: person.id, stats: person.stats, skills: person.skills, education: person.education, employment: person.employment, finance: person.finance, publicLife: person.publicLife, schoolCommunityIds: world.schoolCommunities.filter(row => row.personId === person.id).map(row => row.id), workHistoryIds: world.workHistory.filter(row => row.personId === person.id).map(row => row.id) };
}

function affectedState(world: World, event: Decision, choice: BoundChoice) {
  const people = new Set([world.activePersonId, ...event.personIds, ...choice.effects.flatMap(effect => 'personId' in effect ? [effect.personId] : [])]);
  const relationships = new Set(choice.effects.flatMap(effect => effect.kind === 'relationship' ? [effect.relationshipId] : []));
  const accounts = new Set(choice.effects.flatMap(effect => effect.kind === 'transfer' ? [effect.fromAccountId, effect.toAccountId] : []));
  return {
    people: [...people].filter(id => world.people[id]).map(id => { const person = world.people[id]; return { id, stats: person.stats, skills: person.skills, education: person.education }; }),
    relationships: world.relationships.filter(row => relationships.has(row.id) || people.has(row.from) && people.has(row.to)),
    accounts: world.accounts.filter(row => accounts.has(row.id) || people.has(row.ownerId)),
  };
}

export type EditorialOptions = {
  maxYears?: number;
  onCommand?: (record: ReturnType<typeof commandRecord>, world: World) => void;
  onDecision?: (record: Record<string, unknown>) => void;
  onCold?: (proof: Record<string, unknown>) => void;
};
function commandRecord(index: number, command: GameCommand, before: World, after: World, age: number) {
  return { index, command, beforeRevision: before.revision, revision: after.revision, date: after.date, age, pendingId: after.pending?.id ?? null, annual: after.annual };
}

/** Only advance/resume/choose/acknowledge. No hidden roll is consulted to select a command. */
export function runEditorialPolicy(initial: World, runtime: EditorialRuntime, options: EditorialOptions = {}) {
  let world = initial, decisionOrdinal = 0, yearsStarted = 0;
  const activeId = initial.activePersonId, maxYears = options.maxYears ?? 150;
  assert.ok(Object.isFrozen(initial) && initial.birthAcknowledged && runtime.ageOn(initial.people[activeId], initial.date) === 0);
  assert.ok(Number.isInteger(maxYears) && maxYears >= 1 && maxYears <= 150);
  const templates = new Map(runtime.eventTemplates.map(template => [template.id, template]));
  const commands: GameCommand[] = [], decisions: Record<string, unknown>[] = [], results: Record<string, unknown>[] = [], annual: Record<string, unknown>[] = [], coldChecks: Record<string, unknown>[] = [];
  const traceHash = createHash('sha256'), seenBoundaries = new Set<string>(), seenColdRevisions = new Set<number>(), seenResultIds = new Set<string>();
  const player = () => world.people[activeId], age = () => runtime.ageOn(player(), world.date);
  const cold = (reason: string) => {
    if (seenColdRevisions.has(world.revision)) return;
    const text = runtime.encodeWorld(world), payload = runtime.packCheckpoint(world), loaded = runtime.unpackCheckpoint(payload, true);
    assert.equal(runtime.encodeWorld(loaded), text, 'Whole-world production cold resume: ' + reason); world = loaded;
    assert.ok(Object.isFrozen(world)); seenColdRevisions.add(world.revision);
    const proof = { reason, revision: world.revision, date: world.date, pendingId: world.pending?.id ?? null, worldSha256: sha(text), checkpointSha256: sha(payload), canonicalBytes: Buffer.byteLength(text), checkpointBytes: Buffer.byteLength(payload), format: JSON.parse(payload).format };
    coldChecks.push(proof); options.onCold?.(proof);
  };
  const recordResult = (event: Pending) => {
    if (event.kind !== 'result' || seenResultIds.has(event.id)) return;
    seenResultIds.add(event.id); results.push({ age: age(), date: world.date, revision: world.revision, event, progression: progression(world) });
  };
  const run = (command: GameCommand) => {
    assert.ok(commands.length < 30000, 'Bounded ordinary-command guard');
    const before = world; world = runtime.resolveCommand(world, command, true);
    assert.equal(world.activePersonId, activeId); assert.equal(world.revision, before.revision + 1);
    commands.push(command);
    const record = commandRecord(commands.length - 1, command, before, world, age());
    traceHash.update(editorialJson(record) + '\n'); options.onCommand?.(record, world);
    if (world.pending) recordResult(world.pending);
    for (const row of world.deferred) recordResult(row.event);
    if (before.annual && !world.annual) {
      const key = editorialJson(before.annual.startDate);
      assert.ok(!seenBoundaries.has(key), 'A year must finish once'); seenBoundaries.add(key);
      const completedToTarget = editorialJson(world.date) === editorialJson(before.annual.targetDate);
      annual.push({ completedToTarget, startDate: before.annual.startDate, targetDate: before.annual.targetDate, ended: world.date, revision: world.revision, age: age(), progression: progression(world), eventHistory: world.eventHistory, storyThreads: world.storyThreads });
      cold(completedToTarget ? 'year-end' : 'annual-interrupted');
    }
  };
  cold('acknowledged-birth');
  while (!player().died) {
    assert.equal(world.activePersonId, activeId);
    if (world.pending?.kind === 'decision') {
      cold('pending-decision');
      const event = world.pending as Decision, selection = selectEditorialChoice(world, event, decisionOrdinal, runtime.choiceUnavailable), template = templates.get(event.templateId);
      const history = world.eventHistory.filter(row => row.templateId === event.templateId), prior = history.filter(row => row.year < world.date.year);
      if (template) {
        assert.ok(age() >= template.min && age() <= template.max, 'Actual catalogue scene age is within authored range');
        assert.equal(history.filter(row => row.year === world.date.year).length, 1, 'One actual catalogue origin this year');
        for (const row of prior) assert.ok(world.date.year - row.year >= 5, 'Actual catalogue recurrence respects five-year cooldown');
      }
      const before = world, record = { progressionBefore: progression(world), affectedBefore: affectedState(world, event, selection.choice), ordinal: decisionOrdinal, scope: template ? 'annual-catalogue' : 'system-or-callback', event, date: world.date, age: age(), revision: world.revision, personId: activeId, country: player().country, city: player().city, choices: selection.choices.map(row => ({ ...row, sourceIndex: row.sourceIndex, authoredBranch: row.sourceIndex + 1 })), eligibleIds: selection.eligibleIds, selected: { id: selection.choice.id, sourceIndex: selection.sourceIndex, authoredBranch: selection.sourceIndex + 1, eligibleIndex: selection.eligibleIndex }, template: template ?? null, priorOccurrences: prior, actualHistory: history, boundStoryThreads: world.storyThreads.filter(row => row.offeredEventId === event.id || row.originEventId === event.id) };
      run({ type: 'choose', eventId: event.id, choiceId: selection.choice.id }); decisionOrdinal++;
      const resultingEvent = [world.pending, ...world.deferred.map(row => row.event)].find(row => row?.id === event.id + '_result') ?? null;
      const completed = { ...record, afterRevision: world.revision, actualResult: resultingEvent, affectedAfter: affectedState(world, event, selection.choice), actualPending: world.pending, actualDeferred: world.deferred, actualJournal: world.journal.filter(row => row.personId === activeId && !before.journal.some(previous => previous.id === row.id)), actualStoryThreads: world.storyThreads.filter(row => row.originEventId === event.id || row.offeredEventId === event.id || selection.choice.effects.some(effect => effect.kind === 'resolve-story' && effect.threadId === row.id)), progression: progression(world) };
      decisions.push(completed); options.onDecision?.(completed);
    } else if (world.pending) { cold('pending-result'); run({ type: 'acknowledge', resultId: world.pending.id }); }
    else if (world.annual) run({ type: 'resume' });
    else if (yearsStarted < maxYears) { yearsStarted++; run({ type: 'advance' }); }
    else break;
  }
  runtime.validateWorld(world); cold(player().died ? 'natural-death' : 'policy-bound');
  const estates = world.estates.filter(row => row.personId === activeId);
  if (player().died) {
    assert.ok(player().causeOfDeath); assert.equal(estates.length, 1);
    const estate = estates[0], currency = estate.netWorthAtDeath.currency;
    for (const value of [estate.tax, estate.fees, estate.charity, estate.debtPaid, estate.debtWrittenOff, ...estate.distributions.flatMap(row => [row.cash, row.assetValue])]) assert.equal(value.currency, currency);
    const distributedAndCosts = estate.distributions.reduce((total, row) => total + row.cash.minor + row.assetValue.minor, 0n) + estate.tax.minor + estate.fees.minor + estate.charity.minor;
    assert.equal(distributedAndCosts, estate.netWorthAtDeath.minor + estate.debtWrittenOff.minor, 'Actual natural estate conserves wealth and written-off debt');
  } else assert.equal(estates.length, 0);
  const catalogueDecisions = decisions.filter(row => row.scope === 'annual-catalogue'), observed = new Set(catalogueDecisions.map(row => (row.event as Decision).templateId));
  const branches = new Map<string, Set<string>>();
  for (const row of catalogueDecisions) { const event = row.event as Decision, selected = row.selected as { id: string }; if (!branches.has(event.templateId)) branches.set(event.templateId, new Set()); branches.get(event.templateId)!.add(selected.id); }
  return { world, commands, report: { policyVersion: editorialPolicyVersion, versions: { world: world.schemaVersion, engine: world.engineVersion, content: world.contentVersion }, birthRevision: initial.revision, finalRevision: world.revision, commandsCommitted: commands.length, traceSha256: traceHash.digest('hex'), traceEncoding: 'SHA256 of newline-terminated editorialJson(commandRecord), bigint tagged $dreamsBigInt, sorted object keys', yearsStarted, yearsCompleted: annual.filter(row => row.completedToTarget).length, maxYears, ageAtEnd: age(), finalDate: world.date, naturallyDied: !!player().died, causeOfDeath: player().causeOfDeath, decisions, results, annual, coldChecks, catalogueTemplates: runtime.eventTemplates.length, catalogueDecisions: catalogueDecisions.length, systemOrCallbackDecisions: decisions.length - catalogueDecisions.length, observedCatalogueIds: [...observed].sort(), unseenCatalogueIds: [...templates.keys()].filter(id => !observed.has(id)).sort(), unchosenCatalogueBranches: runtime.eventTemplates.flatMap(template => template.choices.filter(choice => !branches.get(template.id)?.has(choice.id)).map(choice => ({ templateId: template.id, choiceId: choice.id, authoredBranch: template.choices.indexOf(choice) + 1 }))), finalWorldSha256: sha(runtime.encodeWorld(world)), finalProgression: progression(world), retainedStoryThreads: world.storyThreads, estate: estates[0] ?? null, all250NaturalCoverageClaimed: false, fullScenarioAcceptance: false } };
}
