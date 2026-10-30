import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { activeSentence, isConfined } from '../../src/game/systems/legalSchemas';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { challengeContext, escapeContext, escapeAttemptKey } from '../../src/minigames/core/eligibility';
import { escapeGates, escapeSequence, escapeState, evaluateEscape, escapeMistakes } from '../../src/minigames/escape/escapeLogic';
import { evaluateSession } from '../../src/minigames/core/evaluation';
import type { MiniGameInput } from '../../src/minigames/core/types';
import { escapePrisoner } from '../support/prisonEscape';

function start(world = escapePrisoner(), assisted = true) {
  const started = resolveCommand(world, { type: 'mini-game-start', kind: 'escape', ownerId: activeSentence(world)!.id, contextId: escapeContext(world), assisted });
  // A genuinely reserved historical v1 attempt: absence must keep its published rules.
  const historical = JSON.parse(encodeWorld(started));
  delete historical.miniGames.at(-1).escapeVersion;
  return decodeWorld(JSON.stringify(historical));
}
function solve(input: World) {
  let world = input;
  const session = world.miniGames.at(-1)!;
  for (const [index, symbol] of escapeSequence(session).entries())
    world = resolveCommand(world, { type: 'mini-game-input', sessionId: session.id, index, input: { at: (index + 1) * 500, action: { type: 'stamp', symbol } } });
  return world;
}

test('all five levels have a reachable short puzzle, moving gates, mistakes and a stable saved transcript', () => {
  for (let difficulty = 1; difficulty <= 5; difficulty++) for (let seed = 1; seed <= 30; seed++) {
    const challenge = { kind: 'escape' as const, difficulty, seed, assisted: false };
    const sequence = escapeSequence(challenge), inputs: MiniGameInput[] = sequence.map((symbol, index) => ({ at: (index + 1) * 500, action: { type: 'stamp', symbol } }));
    expect(sequence.length).toBeGreaterThanOrEqual(3);
    expect(sequence.length).toBeLessThanOrEqual(5);
    for (let stage = 0; stage < sequence.length; stage++) expect(escapeGates(seed, stage).sort()).toEqual(['bird', 'moon', 'star', 'sun']);
    expect(evaluateEscape(challenge, inputs)).toMatchObject({ finished: true, score: 100 });
    expect(escapeState(challenge, JSON.parse(JSON.stringify(inputs)))).toEqual(escapeState(challenge, inputs));
    const wrong = sequence[0] === 'sun' ? 'moon' : 'sun';
    const failures: MiniGameInput[] = Array.from({ length: escapeMistakes(difficulty) }, (_, index) => ({ at: index * 500, action: { type: 'stamp', symbol: wrong } }));
    expect(evaluateEscape(challenge, failures)).toMatchObject({ finished: true, score: 0 });
    expect(() => evaluateEscape(challenge, [...inputs, inputs[0]])).toThrow(/already finished/);
  }
});

test('security and relevant skills set new difficulty, and free or wrong-sentence commands are refused', () => {
  const world = escapePrisoner(), sentence = activeSentence(world)!;
  const context = escapeContext(world);
  const easy = challengeContext(world, 'escape', sentence.id, context)!.difficulty;
  sentence.behavior = 10;
  const hard = challengeContext(world, 'escape', sentence.id, context)!.difficulty;
  expect(hard).toBeGreaterThanOrEqual(easy);
  world.people[world.activePersonId].stats.smarts = 100;
  world.people[world.activePersonId].stats.fitness = 100;
  world.people[world.activePersonId].legal.crimeSkill = 100;
  expect(challengeContext(world, 'escape', sentence.id, context)!.difficulty).toBeLessThan(hard);
  expect(challengeContext(world, 'escape', 'wrong-sentence', context)).toBeNull();
  expect(() => resolveCommand(world, { type: 'mini-game-start', kind: 'escape', ownerId: 'wrong', contextId: context, assisted: true })).toThrow();
  sentence.state = 'released'; sentence.ended = { ...world.date }; sentence.releaseReason = 'parole';
  expect(challengeContext(world, 'escape', sentence.id, context)).toBeNull();
});

test('interruption retains the exact attempt; completion escapes the real sentence and a checkpoint branch stays independent', () => {
  let world = start();
  const reserved = encodeWorld(world), session = world.miniGames.at(-1)!, random = { ...world.random };
  expect(world.actionCounts[escapeAttemptKey(world.activePersonId, world.date.year)]).toBe(1);
  expect(() => start(world)).toThrow(/saved challenge/);
  const first = escapeSequence(session)[0];
  world = resolveCommand(world, { type: 'mini-game-input', sessionId: session.id, index: 0, input: { at: 500, action: { type: 'stamp', symbol: first } } });
  world = resolveCommand(world, { type: 'mini-game-pause', sessionId: session.id, elapsedMs: 750 });
  const saved = decodeWorld(encodeWorld(world));
  expect(saved.miniGames).toEqual(world.miniGames);
  expect(saved.random).toEqual(random);
  world = resolveCommand(saved, { type: 'mini-game-resume', sessionId: session.id });
  const sequence = escapeSequence(session);
  for (let index = 1; index < sequence.length; index++) world = resolveCommand(world, { type: 'mini-game-input', sessionId: session.id, index, input: { at: (index + 1) * 500, action: { type: 'stamp', symbol: sequence[index] } } });
  const before = encodeWorld(world), checkpoint = packCheckpoint(world);
  const success = resolveCommand(world, { type: 'mini-game-complete', sessionId: session.id });
  expect(success.sentences.find(row => row.id === session.ownerId)?.state).toBe('escaped');
  expect(success.people[success.activePersonId].legal.wanted).toBe(true);
  expect(success.miniGames.at(-1)).toMatchObject({ status: 'completed', score: 100, appliedMonth: world.date.year * 12 + world.date.month - 1 });
  expect(isConfined(success)).toBe(false);
  expect(decodeWorld(encodeWorld(success))).toEqual(success);
  expect(encodeWorld(world)).toBe(before);
  expect(unpackCheckpoint(checkpoint)).toEqual(world);
  expect(decodeWorld(reserved).miniGames[0].inputs).toEqual([]);
  expect(() => resolveCommand(success, { type: 'mini-game-complete', sessionId: session.id })).toThrow();
});

test.each(['forfeit', 'wrong-stamps', 'timeout'] as const)('%s consumes one attempt and creates one actual escape charge without replacing the sentence', mode => {
  let world = start(), session = world.miniGames.at(-1)!, sentenceId = session.ownerId;
  const conduct = activeSentence(world)!.behavior, initialCases = world.cases.length;
  if (mode === 'wrong-stamps') {
    const wrong = escapeSequence(session)[0] === 'sun' ? 'moon' : 'sun';
    for (let index = 0; index < escapeMistakes(session.difficulty); index++) world = resolveCommand(world, { type: 'mini-game-input', sessionId: session.id, index, input: { at: (index + 1) * 500, action: { type: 'stamp', symbol: wrong } } });
  }
  if (mode === 'timeout') world = resolveCommand(world, { type: 'mini-game-pause', sessionId: session.id, elapsedMs: 14000 });
  world = resolveCommand(world, { type: mode === 'forfeit' ? 'mini-game-forfeit' : 'mini-game-complete', sessionId: session.id });
  expect(activeSentence(world)?.id).toBe(sentenceId);
  expect(activeSentence(world)!.behavior).toBeLessThan(conduct);
  expect(world.incidents.filter(row => row.personId === world.activePersonId && row.offence === 'escape')).toHaveLength(1);
  expect(world.cases).toHaveLength(initialCases + 1);
  expect(world.cases.at(-1)?.offence).toBe('escape');
  expect(world.miniGames.at(-1)?.score).toBe(0);
  expect(() => resolveCommand(world, { type: 'mini-game-forfeit', sessionId: session.id })).toThrow();
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('escape transcripts reject other game controls, repeated stages and early completion without changing saved state', () => {
  const world = start(), session = world.miniGames.at(-1)!, before = encodeWorld(world);
  expect(() => resolveCommand(world, { type: 'mini-game-input', sessionId: session.id, index: 0, input: { at: 100, action: { type: 'lock' } } })).toThrow(/another game/);
  expect(() => resolveCommand(world, { type: 'mini-game-complete', sessionId: session.id })).toThrow(/Finish/);
  expect(encodeWorld(world)).toBe(before);
  const solved = solve(world);
  expect(evaluateSession(solved.miniGames.at(-1)!).finished).toBe(true);
  expect(() => resolveCommand(solved, { type: 'mini-game-input', sessionId: session.id, index: solved.miniGames.at(-1)!.inputs.length, input: { at: 6000, action: { type: 'stamp', symbol: 'sun' } } })).toThrow(/finished/);
  validateWorld(solved);
});
