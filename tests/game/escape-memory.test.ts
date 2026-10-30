import { createHash } from 'node:crypto';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import stageV2 from '../fixtures/v2-stage-escape-compatibility.json';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { activeSentence } from '../../src/game/systems/legalSchemas';
import { escapeContext, challengeContext } from '../../src/minigames/core/eligibility';
import { escapeSequence, escapeState, escapeRounds, escapeMistakes, evaluateEscape } from '../../src/minigames/escape/escapeLogic';
import { evaluateSession } from '../../src/minigames/core/evaluation';
import type { MiniGameInput } from '../../src/minigames/core/types';
import { escapePrisoner } from '../support/prisonEscape';
import { memorySolution } from '../support/escapeMemory';

function start(assisted = true) {
  const world = escapePrisoner();
  return resolveCommand(world, { type: 'mini-game-start', kind: 'escape', ownerId: activeSentence(world)!.id, contextId: escapeContext(world), assisted });
}
const add = (world: ReturnType<typeof start>, action: MiniGameInput['action']) => {
  const session = world.miniGames.at(-1)!;
  return resolveCommand(world, { type: 'mini-game-input', sessionId: session.id, index: session.inputs.length, input: { at: session.elapsedMs + 100, action } });
};

test.each([1, 2, 3, 4, 5])('memory level %i requires progressively longer rounds with deterministic recall and bounded mistakes', difficulty => {
  const original = start().miniGames.at(-1)!;
  for (let seed = 1; seed <= 30; seed++) {
    const session = { ...original, difficulty, seed };
    const solution = memorySolution(session);
    expect(escapeState(session, []).phase).toBe('preview');
    expect(() => escapeState(session, [{ at: 1, action: { type: 'stamp', symbol: escapeSequence(session)[0] } }])).toThrow(/Hide the pattern/);
    for (let round = 1; round < escapeRounds(difficulty); round++) expect(escapeSequence(session, round).length).toBe(escapeSequence(session, round - 1).length + 1);
    expect(evaluateEscape(session, solution)).toMatchObject({ finished: true, score: 100 });
    expect(escapeState(session, JSON.parse(JSON.stringify(solution)))).toEqual(escapeState(session, solution));
    expect(() => escapeState(session, [...solution, solution[0]])).toThrow(/already finished/);
    const wrong = escapeSequence(session)[0] === 'sun' ? 'moon' : 'sun';
    const bad: MiniGameInput[] = [{ at: 1, action: { type: 'escape-recall' } }, ...Array.from({ length: escapeMistakes(difficulty, 2) }, (_, i) => ({ at: i + 2, action: { type: 'stamp' as const, symbol: wrong as 'sun' | 'moon' } }))];
    expect(evaluateEscape(session, bad)).toMatchObject({ finished: true, score: 0 });
  }
});

test('all five difficulty profiles differ; maximum-security actual sentence cannot be easier than minimum security', () => {
  const profiles = [1, 2, 3, 4, 5].map(difficulty => JSON.stringify([escapeRounds(difficulty), escapeSequence({ seed: 1, difficulty, escapeVersion: 2 }).length, escapeMistakes(difficulty, 2)]));
  expect(new Set(profiles).size).toBe(5);
  const world = escapePrisoner(), sentence = activeSentence(world)!;
  const easy = challengeContext(world, 'escape', sentence.id, escapeContext(world))!.difficulty;
  sentence.behavior = 10;
  const hard = challengeContext(world, 'escape', sentence.id, escapeContext(world))!.difficulty;
  expect(hard).toBeGreaterThan(easy);
  expect(escapeSequence({ seed: 1, difficulty: hard, escapeVersion: 2 }).length).toBeGreaterThan(escapeSequence({ seed: 1, difficulty: easy, escapeVersion: 2 }).length);

});

test('limited assisted hints hide choices, are recorded and cannot be replayed or obtained in normal mode', () => {
  let world = start();
  const session = world.miniGames.at(-1)!;
  expect(session.escapeVersion).toBe(2);
  expect(() => add(world, { type: 'escape-hint' })).toThrow(/No memory hint/);
  world = add(world, { type: 'escape-recall' });
  world = add(world, { type: 'escape-hint' });
  expect(escapeState(world.miniGames.at(-1)!, world.miniGames.at(-1)!.inputs)).toMatchObject({ phase: 'hint', hints: 1, stage: 0 });
  expect(() => add(world, { type: 'stamp', symbol: escapeSequence(session)[0] })).toThrow(/Hide the pattern/);
  world = add(world, { type: 'escape-recall' });
  world = add(world, { type: 'escape-hint' });
  world = add(decodeWorld(encodeWorld(world)), { type: 'escape-recall' });
  expect(() => add(world, { type: 'escape-hint' })).toThrow(/No memory hint/);
  expect(() => add(world, { type: 'escape-recall' })).toThrow(/already hidden/);
  const ordinary = add(start(false), { type: 'escape-recall' });
  expect(() => add(ordinary, { type: 'escape-hint' })).toThrow(/No memory hint/);
});

test('cold reload preserves hidden phase and mistakes; resuming cannot reset, replace or retry the attempt', () => {
  let world = add(start(), { type: 'escape-recall' });
  const session = world.miniGames.at(-1)!, right = escapeSequence(session)[0], wrong = right === 'sun' ? 'moon' : 'sun';
  world = add(world, { type: 'stamp', symbol: wrong });
  const transcript = world.miniGames.at(-1)!.inputs;
  world = resolveCommand(world, { type: 'mini-game-pause', sessionId: session.id, elapsedMs: session.elapsedMs + 200 });
  world = decodeWorld(encodeWorld(world));
  expect(world.miniGames.at(-1)!.inputs).toEqual(transcript);
  expect(world.miniGames.at(-1)!.escapePatternVersion).toBe(1);
  expect(escapeState(world.miniGames.at(-1)!, transcript)).toMatchObject({ phase: 'recall', mistakes: 1 });
  expect(() => resolveCommand(world, { type: 'mini-game-start', kind: 'escape', ownerId: session.ownerId, contextId: session.contextId, assisted: true })).toThrow(/saved challenge/);
  world = resolveCommand(world, { type: 'mini-game-resume', sessionId: session.id });
  expect(() => add(world, { type: 'escape-recall' })).toThrow(/already hidden/);
  const failed = resolveCommand(world, { type: 'mini-game-forfeit', sessionId: session.id });
  expect(failed.incidents.filter(row => row.offence === 'escape')).toHaveLength(1);
  expect(failed.cases.filter(row => row.offence === 'escape')).toHaveLength(1);
  expect(activeSentence(failed)?.id).toBe(session.ownerId);
  expect(() => resolveCommand(failed, { type: 'mini-game-forfeit', sessionId: session.id })).toThrow();
});

test('normal memory mode does not expire while thinking, and actual complete result settles once', () => {
  let world = start(false);
  const session = world.miniGames.at(-1)!;
  expect(evaluateSession({ ...session, elapsedMs: 14000 })).toMatchObject({ finished: false });
  for (const input of memorySolution(session)) world = add(world, input.action);
  const solved = world;
  world = resolveCommand(world, { type: 'mini-game-complete', sessionId: session.id });
  expect(world.sentences.find(row => row.id === session.ownerId)?.state).toBe('escaped');
  expect(world.people[world.activePersonId].legal.wanted).toBe(true);
  expect(world.miniGames.at(-1)!.score).toBe(100);
  expect(world.incidents.filter(row => row.offence === 'escape')).toHaveLength(1);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
  expect(() => resolveCommand(world, { type: 'mini-game-complete', sessionId: session.id })).toThrow();
  expect(solved.sentences.find(row => row.id === session.ownerId)?.state).toBe('active');
});

test('failed memory recall creates one genuine escape case and leaves the original sentence intact', () => {
  let world = add(start(), { type: 'escape-recall' });
  const session = world.miniGames.at(-1)!;
  const wrong = escapeSequence(session)[0] === 'sun' ? 'moon' : 'sun';
  const sentence = activeSentence(world)!, months = sentence.totalMonths, served = sentence.servedMonths, cases = world.cases.length;
  for (let i = 0; i < escapeMistakes(session.difficulty, 2); i++) world = add(world, { type: 'stamp', symbol: wrong });
  expect(evaluateSession(world.miniGames.at(-1)!)).toMatchObject({ finished: true, score: 0 });
  world = resolveCommand(world, { type: 'mini-game-complete', sessionId: session.id });
  expect(activeSentence(world)).toMatchObject({ id: sentence.id, totalMonths: months, servedMonths: served });
  expect(world.cases).toHaveLength(cases + 1);
  expect(world.cases.at(-1)).toMatchObject({ offence: 'escape', personId: world.activePersonId });
  expect(world.incidents.filter(row => row.offence === 'escape')).toHaveLength(1);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
  expect(() => resolveCommand(world, { type: 'mini-game-complete', sessionId: session.id })).toThrow();
  expect(() => resolveCommand(world, { type: 'mini-game-start', kind: 'escape', ownerId: sentence.id, contextId: session.contextId, assisted: true })).toThrow();
});


test('mixed memory patterns vary across seeds without a forced four-symbol cycle; published v1 stays exact', () => {
  for (let round = 0; round < 3; round++) {
    const patterns = Array.from({ length: 256 }, (_, seed) => escapeSequence({ seed, difficulty: 5, escapeVersion: 2, escapePatternVersion: 1 }, round));
    expect(new Set(patterns.map(pattern => pattern.join(','))).size).toBeGreaterThan(200);
    // Random patterns may repeat. Reject a generator that makes repetition the rule.
    const fourCycles = patterns.filter(pattern => pattern.slice(4).every((symbol, index) => symbol === pattern[index]));
    expect(fourCycles.length).toBeLessThan(64);
  }
  expect(escapeSequence({ seed: 413, difficulty: 5 })).toEqual(['sun', 'bird', 'star', 'moon', 'sun']);
});

test('only newly started v2 escape sessions carry the mixed pattern revision', () => {
  const world = start();
  expect(world.miniGames.at(-1)).toMatchObject({ escapeVersion: 2, escapePatternVersion: 1 });
  const invalid = JSON.parse(encodeWorld(world));
  delete invalid.miniGames.at(-1).escapeVersion;
  expect(() => decodeWorld(JSON.stringify(invalid))).toThrow(/mixed escape pattern/);
  invalid.miniGames.at(-1).kind = 'crime';
  expect(() => decodeWorld(JSON.stringify(invalid))).toThrow(/mixed escape pattern/);
});

test.each(stageV2.rows.map(row => [row.id, row] as const))('%s preserves its original task-stage v2 pattern and complete result hash', (_, row) => {
  expect(stageV2.sourceCommit).toBe('6e35d1528f8c1cd6ae8f797c4968cf3bee311226');
  const digest = (encoded: string) => createHash('sha256').update(encoded).digest('hex');
  let world = unpackCheckpoint(row.payload);
  expect(world.miniGames.at(-1)).toHaveProperty('escapeVersion', 2);
  expect(world.miniGames.at(-1)).not.toHaveProperty('escapePatternVersion');
  expect(digest(encodeWorld(world))).toBe(row.inputSha256);
  for (const command of row.commands) world = resolveCommand(decodeWorld(encodeWorld(world)), command as GameCommand);
  expect(digest(encodeWorld(world))).toBe(row.outcomeSha256);
  expect(world.miniGames.at(-1)).not.toHaveProperty('escapePatternVersion');
  expect(() => resolveCommand(world, { type: 'mini-game-complete', sessionId: world.miniGames.at(-1)!.id })).toThrow();
});
