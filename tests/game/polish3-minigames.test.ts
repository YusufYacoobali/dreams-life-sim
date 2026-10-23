import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { evaluateSession } from '../../src/minigames/core/evaluation';
import { durationMs, type MiniGameInput, type MiniGameKind } from '../../src/minigames/core/types';
import { targetAngle } from '../../src/minigames/crime/crimeLogic';
import { keeperPosition } from '../../src/minigames/sports/sportsLogic';
import { athleteFixture, miniGameFixture, missionFixture, startMiniGame } from '../support/miniGames';

const fixture = (kind: MiniGameKind) => kind === 'sports' ? athleteFixture() : kind === 'crime' ? miniGameFixture() : missionFixture();

test.each(['sports', 'crime', 'astronaut'] as const)('new eligible %s attempts use difficulty 3 independently of skill and preserve world RNG', (kind) => {
  const initial = fixture(kind);
  if (kind === 'crime') {
    const ineligible = decodeWorld(encodeWorld(initial));
    ineligible.people[ineligible.activePersonId].legal.crimeSkill = 0;
    expect(() => startMiniGame(ineligible, kind)).toThrow('Requires crime experience of 10%');
  }
  for (const skill of kind === 'crime' ? [10, 100] : [0, 100]) {
    const world = decodeWorld(encodeWorld(initial));
    const person = world.people[world.activePersonId];
    person.skills.sport = skill;
    person.skills.science = skill;
    person.legal.crimeSkill = skill;
    validateWorld(world);
    const before = encodeWorld(world), started = startMiniGame(world, kind);
    expect(started.miniGames[0].difficulty).toBe(3);
    expect(started.random).toEqual(world.random);
    expect(encodeWorld(world)).toBe(before);
  }
});

test.each(
  (['sports', 'crime', 'astronaut'] as const).flatMap(kind => [1, 5].map(difficulty => ({ kind, difficulty }))),
)('saved $kind difficulty $difficulty, inputs and outcome survive cold replay and settlement', ({ kind, difficulty }) => {
  // A prior release could start any level from 1–5. Keep that save contract even
  // though the current release starts every new challenge at level 3.
  let world = startMiniGame(fixture(kind), kind);
  world.miniGames[0].difficulty = difficulty;
  world = validateWorld(world);
  const original = world.miniGames[0];
  const inputs: MiniGameInput[] = kind === 'sports'
    ? [{ at: 1500, action: { type: 'shot', x: keeperPosition(0, original.seed, difficulty) < 0.5 ? 0.88 : 0.12, y: 0.14, power: 0.78 } }]
    : kind === 'crime'
      ? [0, 1, 2].map(stage => ({ at: (stage + 1) * 400, action: { type: 'lock' as const, angle: targetAngle(original.seed, stage) } }))
      : [{ at: 400, action: { type: 'thrust', direction: 'left' } }, { at: 800, action: { type: 'thrust', direction: 'coast' } }];
  for (const [index, input] of inputs.entries())
    world = resolveCommand(world, { type: 'mini-game-input', sessionId: original.id, index, input });
  world = resolveCommand(world, { type: 'mini-game-pause', sessionId: original.id, elapsedMs: durationMs[kind] });
  const saved = world.miniGames[0], expected = evaluateSession(saved), random = { ...world.random };
  expect(expected.finished).toBe(true);
  const cold = unpackCheckpoint(packCheckpoint(world), true);
  expect(cold.miniGames[0]).toEqual(saved);
  expect(evaluateSession(cold.miniGames[0])).toEqual(expected);
  const settled = resolveCommand(cold, { type: 'mini-game-complete', sessionId: saved.id });
  expect(settled.miniGames[0]).toMatchObject({ difficulty, inputs, status: 'completed', score: expected.score });
  expect(settled.random).toEqual(resolveCommand(world, { type: 'mini-game-complete', sessionId: saved.id }).random);
  if (kind !== 'crime') expect(settled.random).toEqual(random);
  expect(decodeWorld(encodeWorld(settled)).miniGames[0]).toEqual(settled.miniGames[0]);
});
