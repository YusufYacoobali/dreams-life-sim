import { createHash } from 'node:crypto';
import { createLife, randomCreation } from '../../src/game/createLife';
import { countries, countryCodes } from '../../src/game/countries';
import { resolveCommand } from '../../src/game/engine';
import { ageOn, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { eventTemplates } from '../../src/game/content/events';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { decodeSave } from '../../src/persistence/archive';
import { SaveRepository } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { database } from '../support/sqlite';
import { createEditorialLife, editorialJson, runEditorialPolicy, selectEditorialChoice } from '../support/editorialPolicy';
import type { Pending } from '../../src/game/runtime';
import archived from '../fixtures/v23-school-plans-archive.json';

const runtime = { resolveCommand, ageOn, encodeWorld, validateWorld, choiceUnavailable, eventTemplates, packCheckpoint, unpackCheckpoint };
const birth = { createGameStore, SaveRepository, randomCreation, countries, database };
type Decision = Extract<Pending, { kind: 'decision' }>;
const driver = require('../../tools/run-editorial-policy.cjs') as { sourcePins: (root: string) => Record<string, string>; expectedC35: Record<string, string>; main: (argv: string[]) => Promise<void>; optionsFor: (argv: string[]) => { root: string; maxYears: number; manifestOnly: boolean } };
const sourceRoot = require('node:path').resolve(__dirname, '../..') as string;

test('actual saved birth leaves all creation actors, money and RNG intact and uses only normal birth acknowledgement', async () => {
  const result = await createEditorialLife(birth, 'US', 900), created = createLife('life_editorial_US_900', 900, result.input, result.date), world = result.world;
  expect(created.birthAcknowledged).toBe(false); expect(world.birthAcknowledged).toBe(true); expect(world.revision).toBe(1); expect(Object.isFrozen(world)).toBe(true);
  expect(world).toMatchObject({ schemaVersion: 39, engineVersion: 40, contentVersion: 16 });
  for (const field of ['people', 'accounts', 'ledger', 'random', 'storyThreads'] as const) expect(world[field]).toEqual(created[field]);
});

test('rotation counts eligible positions, preserves authored positions and reports actual disabled reasons without altering the bound scene', async () => {
  const { world } = await createEditorialLife(birth, 'US', 900), offered = resolveCommand(world, { type: 'advance' }, true), event = offered.pending as Decision;
  expect(event.kind).toBe('decision'); const before = encodeWorld(offered);
  for (let ordinal = 0; ordinal < 6; ordinal++) {
    const selected = selectEditorialChoice(offered, event, ordinal, choiceUnavailable);
    expect(selected.choice.id).toBe(event.choices[ordinal % 3].id); expect(selected.sourceIndex).toBe(ordinal % 3); expect(selected.eligibleIndex).toBe(ordinal % 3);
  }
  // Explicit selector-unit condition: disabling the middle existing option. This
  // event copy is never submitted and is not evidence of a naturally disabled scene.
  const conditional = { ...event, choices: event.choices.map((choice, index) => index === 1 ? { ...choice, disabledReason: 'Unit eligibility restriction' } : choice) };
  const selected = selectEditorialChoice(offered, conditional, 1, choiceUnavailable);
  expect(selected.eligibleIds).toEqual([event.choices[0].id, event.choices[2].id]); expect(selected.eligibleIndex).toBe(1); expect(selected.sourceIndex).toBe(2); expect(selected.choice.id).toBe(event.choices[2].id);
  expect(selected.choices[1].unavailableReason).toBe('Unit eligibility restriction'); expect(encodeWorld(offered)).toBe(before);
  expect(() => selectEditorialChoice(offered, event, -1, choiceUnavailable)).toThrow();
  expect(() => selectEditorialChoice(offered, event, 0, () => 'Unavailable')).toThrow(/available choice/);
});

test('short natural varied-choice childhood cold-resumes exact scenes, records all three authored positions and replays to the exact same world', async () => {
  const initial = (await createEditorialLife(birth, 'US', 900)).world, original = encodeWorld(initial), records: string[] = [], capturedWorlds: World[] = [];
  const result = runEditorialPolicy(initial, runtime, { maxYears: 8, onCommand: (record, world) => { records.push(editorialJson(record) + '\n'); capturedWorlds.push(world); } }), report = result.report;
  expect(encodeWorld(initial)).toBe(original); expect(report.ageAtEnd).toBe(8); expect(report.naturallyDied).toBe(false); expect(report.yearsCompleted).toBe(8);
  expect(result.commands.every(command => ['advance', 'resume', 'choose', 'acknowledge'].includes(command.type))).toBe(true);
  expect(report.commandsCommitted).toBe(result.world.revision - initial.revision); expect(report.traceSha256).toBe(createHash('sha256').update(records.join('')).digest('hex'));
  const chosenBranches = new Set<number>();
  for (const [ordinal, raw] of report.decisions.entries()) {
    const row = raw as { ordinal: number; event: Decision; selected: { id: string; authoredBranch: number; eligibleIndex: number }; eligibleIds: string[]; actualResult: Pending | null; progressionBefore: { stats: Record<string, number> }; progression: { stats: Record<string, number> }; actualJournal: unknown[] };
    expect(row.ordinal).toBe(ordinal); expect(row.selected.eligibleIndex).toBe(ordinal % row.eligibleIds.length); expect(row.selected.id).toBe(row.eligibleIds[row.selected.eligibleIndex]);
    expect(row.event.personIds.every(id => result.world.people[id])).toBe(true); expect(row.actualResult?.kind).toBe('result'); expect(row.actualJournal.length).toBeGreaterThan(0);
    chosenBranches.add(row.selected.authoredBranch);
    for (const effect of row.event.choices.find(choice => choice.id === row.selected.id)!.effects) if (effect.kind === 'stat' && effect.personId === initial.activePersonId) expect(row.progression.stats[effect.stat]).toBe(Math.max(0, Math.min(100, row.progressionBefore.stats[effect.stat] + effect.delta)));
  }
  expect([...chosenBranches].sort()).toEqual([1, 2, 3]); expect(report.unseenCatalogueIds.length).toBeGreaterThan(0); expect(report.unchosenCatalogueBranches.length).toBeGreaterThan(0);
  expect(report.all250NaturalCoverageClaimed).toBe(false); expect(report.fullScenarioAcceptance).toBe(false);
  expect(report.coldChecks.some(row => row.reason === 'pending-decision')).toBe(true); expect(report.coldChecks.some(row => row.reason === 'pending-result')).toBe(true); expect(report.coldChecks.some(row => row.reason === 'year-end')).toBe(true);
  expect(report.coldChecks.every(row => typeof row.format === 'string' && /^dreams-checkpoint-v[1-4]$/.test(row.format))).toBe(true); expect(capturedWorlds.every(world => Object.isFrozen(world))).toBe(true);
  let replay = initial; for (const command of result.commands) replay = resolveCommand(replay, command, true);
  expect(encodeWorld(replay)).toBe(encodeWorld(result.world)); expect(report.finalWorldSha256).toBe(createHash('sha256').update(encodeWorld(replay)).digest('hex'));
  const repeated = runEditorialPolicy(initial, runtime, { maxYears: 8 }); expect(repeated.report.traceSha256).toBe(report.traceSha256); expect(encodeWorld(repeated.world)).toBe(encodeWorld(replay));
}, 30000);

test('a genuine archived callback keeps its actual binding and outcome through rotated selection, production cold resume and replay', () => {
  // This is a historical stored-boundary check, not a new natural C35 life.
  let world = decodeSave(JSON.stringify(archived)).world;
  let guard = 0;
  while (!(world.pending?.kind === 'decision' && world.pending.templateId.startsWith('story-')) && guard++ < 30) {
    if (world.pending?.kind === 'decision') { const event = world.pending, selected = selectEditorialChoice(world, event, guard - 1, choiceUnavailable); world = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: selected.choice.id }, true); }
    else if (world.pending) world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }, true);
    else world = resolveCommand(world, { type: world.annual ? 'resume' : 'advance' }, true);
  }
  expect(guard).toBeLessThan(30); const before = encodeWorld(world), cold = unpackCheckpoint(packCheckpoint(world), true); expect(encodeWorld(cold)).toBe(before);
  const event = cold.pending as Decision; expect(event.templateId).toMatch(/^story-/); const thread = cold.storyThreads.find(row => row.offeredEventId === event.id)!;
  expect(thread).toBeDefined(); expect(event.personIds).toContain(thread.peerId); expect(cold.people[thread.peerId]).toBeDefined();
  const selection = selectEditorialChoice(cold, event, 2, choiceUnavailable), command = { type: 'choose' as const, eventId: event.id, choiceId: selection.choice.id }, result = resolveCommand(cold, command, true);
  const restored = unpackCheckpoint(packCheckpoint(result), true); expect(encodeWorld(restored)).toBe(encodeWorld(resolveCommand(world, command, true)));
  expect(restored.storyThreads.find(row => row.id === thread.id)).toMatchObject({ originEventId: thread.originEventId, peerId: thread.peerId, communityId: thread.communityId, status: 'resolved' });
  expect(encodeWorld(world)).toBe(before);
}, 30000);

test('the historical C35 registration stays exact and rejects newer source before manifest loading or any life can start', async () => {
  expect(driver.expectedC35).toEqual({
    referenceCommit: '5a2565458fa5de90c1acaf0e110fc980f6476b64',
    game: '84625d5208d1a6815dccc2802ff75c83393eeb143c382e83d60ed0dafaf94f33',
    gameAndPersistence: '12b49689991da671d72b3ac8bc0bfe6bb2aff788174cf1ccda73665c0195c2b8',
    state: '4e54672a28860f4e4ec593943171268a9202b22d960cc0cec13db94b2cd8c7ea',
    lockfile: '0079491a8e148250f4d4fda7c9fab44d0e1bcb126dea893d06f269489e6a4e1b',
    store: '85b542e0c04192cf192c2eb018ef90dd3c77870261a0a124e75f444710689d09',
    birthDriver: 'b05662854da8a6439ddc559f3b1038895df94ba73cecb9c501b6a6ef5234a2f8',
  });
  const pins = driver.sourcePins(sourceRoot);
  for (const key of ['state', 'lockfile', 'store', 'birthDriver']) expect(pins[key]).toBe(driver.expectedC35[key]);
  expect(pins.tool).toBe('e0eb16fb73962b9632b4949a5ed1d729d8aca97be1607490a964c5a10abe1706');
  expect(pins.policy).toBe('0e2bf26c25d28c24d8ac9111fe2f3de704a1cadb0e8e98df82b4dbf93bcf3c72');
  for (const key of ['game', 'gameAndPersistence']) expect(pins[key]).not.toBe(driver.expectedC35[key]);
  await expect(driver.main(['--source', sourceRoot, '--manifest-only'])).rejects.toThrow(/Source must match frozen C35 game/);
  expect(driver.sourcePins(sourceRoot)).toEqual(pins);
  expect(driver.optionsFor(['--source', sourceRoot, '--manifest-only'])).toMatchObject({ root: sourceRoot, maxYears: 150, manifestOnly: true });
  expect(() => driver.optionsFor(['--all', '--output', '/tmp/unused-editorial-test-output'])).toThrow(/source/);
  expect(() => driver.optionsFor(['--source', sourceRoot, '--all', '--country', countryCodes[0], '--output', '/tmp/unused-editorial-test-output'])).toThrow(/one country/);
  expect(() => driver.optionsFor(['--source', sourceRoot, '--manifest-only', '--max-years', '151'])).toThrow();
});
