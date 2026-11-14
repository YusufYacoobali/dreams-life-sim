import { createHash } from 'node:crypto';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { activeSentence } from '../../src/game/systems/legalSchemas';
import { escapeContext } from '../../src/minigames/core/eligibility';
import { evaluateSession } from '../../src/minigames/core/evaluation';
import { cellBoard, cellEscapeState, cellMistakeLimit, evaluateCellEscape } from '../../src/minigames/escape/cellEscapeLogic';
import { miniGameTitle, type MiniGameInput } from '../../src/minigames/core/types';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { escapePrisoner } from '../support/prisonEscape';
import { escapeSolution } from '../support/escapeSolution';
import v1 from '../fixtures/v1-cell-escape-compatibility.json';
import v2 from '../fixtures/v2-mixed-cell-escape-compatibility.json';

test.each([1, 2, 3, 4, 5])('Cell Escape level %i has unambiguous matches, bounded mistakes and deterministic transcripts without life RNG', difficulty => {
  for (let seed = 0; seed < 64; seed++) {
    const challenge = { seed, difficulty }, board = cellBoard(challenge);
    expect(new Set(board.keys.map(key => key.shape + ':' + key.teeth)).size).toBe(6);
    const inputs: MiniGameInput[] = board.locks.map((lock, index) => ({ at: index * 100, action: { type: 'escape-fit', keyId: lock.keyId, lockId: lock.id } }));
    expect(evaluateCellEscape(challenge, inputs)).toEqual({ finished: true, score: 100, detail: 'Every lock is open.' });
    expect(cellEscapeState(challenge, JSON.parse(JSON.stringify(inputs)))).toEqual(cellEscapeState(challenge, inputs));
    expect(() => cellEscapeState(challenge, [...inputs, inputs[0]])).toThrow(/already finished/);
    const wrongKey = board.keys.find(key => key.id !== board.locks[0].keyId)!.id;
    const wrong: MiniGameInput = { at: 100, action: { type: 'escape-fit', keyId: wrongKey, lockId: 0 } };
    expect(evaluateCellEscape(challenge, Array(cellMistakeLimit(difficulty)).fill(wrong))).toMatchObject({ finished: true, score: 0 });
    expect(() => cellEscapeState(challenge, [inputs[0], inputs[0]])).toThrow(/unused key/);
  }
});
test('new attempts use v3, reject the old controls, preserve pause/reload and settle the actual sentence once', () => {
  const original = escapePrisoner(), random = { ...original.random };
  let world = resolveCommand(original, { type: 'mini-game-start', kind: 'escape', ownerId: activeSentence(original)!.id, contextId: escapeContext(original), assisted: true });
  const session = world.miniGames.at(-1)!, solution = escapeSolution(session);
  expect(session).toMatchObject({ escapeVersion: 3, assisted: false }); expect(session).not.toHaveProperty('escapePatternVersion'); expect(world.random).toEqual(random);
  expect(miniGameTitle('escape', session)).toBe('Cell Escape');
  for (const action of [{ type: 'escape-recall' }, { type: 'escape-hint' }, { type: 'stamp', symbol: 'sun' }] as const) expect(() => resolveCommand(world, { type: 'mini-game-input', sessionId: session.id, index: 0, input: { at: 100, action } })).toThrow(/another game/);
  world = resolveCommand(world, { type: 'mini-game-input', sessionId: session.id, index: 0, input: solution[0] });
  world = resolveCommand(world, { type: 'mini-game-pause', sessionId: session.id, elapsedMs: 100 }); world = decodeWorld(encodeWorld(world));
  expect(world.miniGames.at(-1)!.inputs).toEqual([solution[0]]);
  world = resolveCommand(world, { type: 'mini-game-resume', sessionId: session.id });
  for (let index = 1; index < solution.length; index++) world = resolveCommand(world, { type: 'mini-game-input', sessionId: session.id, index, input: solution[index] });
  expect(world.random).toEqual(random); expect(evaluateSession(world.miniGames.at(-1)!)).toMatchObject({ finished: true, score: 100 });
  world = resolveCommand(world, { type: 'mini-game-complete', sessionId: session.id });
  expect(world.sentences.find(row => row.id === session.ownerId)!.state).toBe('escaped'); expect(world.people[world.activePersonId].legal.wanted).toBe(true);
  expect(world.journal.find(row => row.id === session.id + '_result')!.text).toBe('I completed Cell Escape with 100/100.');
  expect(() => resolveCommand(world, { type: 'mini-game-complete', sessionId: session.id })).toThrow();
});
test('a failed v3 transcript keeps the real sentence, applies conduct penalties and records one genuine escape charge', () => {
  const initial = escapePrisoner();
  let world = resolveCommand(initial, { type: 'mini-game-start', kind: 'escape', ownerId: activeSentence(initial)!.id, contextId: escapeContext(initial), assisted: false });
  const session = world.miniGames.at(-1)!, board = cellBoard(session), wrong = board.keys.find(key => key.id !== board.locks[0].keyId)!;
  for (let index = 0; index < cellMistakeLimit(session.difficulty); index++) world = resolveCommand(world, { type: 'mini-game-input', sessionId: session.id, index, input: { at: (index + 1) * 100, action: { type: 'escape-fit', keyId: wrong.id, lockId: 0 } } });
  world = resolveCommand(world, { type: 'mini-game-complete', sessionId: session.id });
  expect(world.miniGames.at(-1)).toMatchObject({ status: 'completed', score: 0, rating: 'failed' });
  expect(activeSentence(world)).toMatchObject({ id: session.ownerId, behavior: Math.max(0, activeSentence(initial)!.behavior - 25), state: 'active' });
  const incidents = world.incidents.filter(row => row.offence === 'escape'); expect(incidents).toHaveLength(1); expect(world.cases.filter(row => row.incidentId === incidents[0].id)).toHaveLength(1);
  expect(decodeWorld(encodeWorld(world))).toEqual(world); expect(() => resolveCommand(world, { type: 'mini-game-complete', sessionId: session.id })).toThrow();
});
test.each([...v1.rows.map(row => [1, row.id, row] as const), ...v2.rows.map(row => [2, row.id, row] as const)])('real older executable v%s %s retains its complete result hash', (version, _id, row) => {
  let world = unpackCheckpoint(row.payload);
  const hash = () => createHash('sha256').update(encodeWorld(world)).digest('hex');
  expect(hash()).toBe(row.inputSha256);
  expect(miniGameTitle('escape', world.miniGames.at(-1)!)).toBe('Exit Shuffle');
  expect(world.miniGames.at(-1)?.escapeVersion).toBe(version === 1 ? undefined : 2);
  for (const command of row.commands) world = resolveCommand(decodeWorld(encodeWorld(world)), command as GameCommand);
  expect(hash()).toBe(row.outcomeSha256); expect(world.miniGames.at(-1)!.status).toBe('completed');
});
