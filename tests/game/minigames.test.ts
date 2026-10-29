import { decodeWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import {
  ratingFor,
  performanceModifier,
  burglaryModifiers,
} from '../../src/minigames/core/scoring';
import {
  challengeSeed,
  difficultyFor,
} from '../../src/minigames/core/difficulty';
import { evaluateSession } from '../../src/minigames/core/evaluation';
import {
  evaluateLock,
  targetAngle,
} from '../../src/minigames/crime/crimeLogic';
import {
  advanceDocking,
  dockingState,
  initialDocking,
  thrustDocking,
} from '../../src/minigames/astronaut/dockingPhysics';
import {
  evaluateShot,
  keeperPosition,
} from '../../src/minigames/sports/sportsLogic';
import {
  packCheckpoint,
  unpackCheckpoint,
} from '../../src/persistence/checkpoints';
import { accountFor } from '../../src/game/systems/common';
import {
  miniGameFixture,
  athleteFixture,
  missionFixture,
  startMiniGame,
  nextMatchPeriod,
  nextServicePeriod,
} from '../support/miniGames';
import type { MiniGameInput } from '../../src/minigames/core/types';
import { applyGodModeEdits } from '../../src/game/godMode';
import { randomInteger } from '../../src/game/random';
import { endLifeCommand } from '../support/endLife';
import { isConfined, legalMonth } from '../../src/game/systems/legal';
import { monthFrom } from '../../src/game/calendar';

function perfectShot(world: ReturnType<typeof athleteFixture>) {
  const session = world.miniGames.at(-1)!,
    keeper = keeperPosition(0, session.seed, session.difficulty),
    x = keeper < 0.5 ? 0.88 : 0.12;
  return resolveCommand(world, {
    type: 'mini-game-input',
    sessionId: session.id,
    index: 0,
    input: { at: 1500, action: { type: 'shot', x, y: 0.14, power: 0.78 } },
  });
}
const finish = (world: ReturnType<typeof miniGameFixture>) =>
  resolveCommand(world, {
    type: 'mini-game-complete',
    sessionId: world.miniGames.at(-1)!.id,
  });

test('difficulty and challenge seeds are deterministic, bounded and independent of world RNG', () => {
  expect(challengeSeed('same opportunity')).toBe(
    challengeSeed('same opportunity'),
  );
  expect(challengeSeed('different')).not.toBe(
    challengeSeed('same opportunity'),
  );
  expect(difficultyFor(0, 0)).toBe(5);
  expect(difficultyFor(100, 200)).toBe(1);
  for (let score = 0; score <= 100; score++) {
    expect(['perfect', 'good', 'poor', 'failed']).toContain(ratingFor(score));
    expect(Math.abs(performanceModifier(score))).toBeLessThanOrEqual(8);
    expect(burglaryModifiers(score).lootBps).toBeLessThanOrEqual(11500);
    expect(burglaryModifiers(score).riskBps).toBeGreaterThanOrEqual(-700);
  }
  for (const invalid of [-1, 101, 1.5, NaN])
    expect(() => ratingFor(invalid)).toThrow();
});

test('all five difficulty levels have reachable wins using ordinary timed inputs and a fuel-limited flight', () => {
  for (let difficulty = 1; difficulty <= 5; difficulty++)
    for (let seed = 0; seed < 21; seed++) {
      const challenge = {
        kind: 'sports' as const,
        difficulty,
        seed,
        assisted: false,
      };
      expect(
        evaluateShot(challenge, {
          at: 1451,
          action: { type: 'shot', x: 0.88, y: 0.14 },
        }).score,
      ).toBeGreaterThanOrEqual(85);
      const inputs: MiniGameInput[] = [];
      let previous = 0;
      for (let stage = 0; stage < 3; stage++) {
        let target = targetAngle(seed, stage);
        const speed = 0.11 + difficulty * 0.018;
        while (target / speed < previous) target += 360;
        const at = Math.round(target / speed);
        inputs.push({ at, action: { type: 'lock' } });
        previous = at;
      }
      expect(previous).toBeLessThan(12000);
      expect(
        evaluateLock({ ...challenge, kind: 'crime' }, inputs).score,
      ).toBeGreaterThanOrEqual(85);
      // A small initial burst, coasting, then one opposite burst demonstrates a
      // reachable approach without unlimited fuel or an oscillating controller.
      let state = advanceDocking(
        initialDocking(seed, difficulty),
        100,
        difficulty,
      );
      const portAt = state.at + ((state.y - 0.24) / -state.vy) * 1000;
      const sign =
        0.5 - state.x - (state.vx * (portAt - state.at)) / 1000 >= 0 ? 1 : -1;
      for (let taps = 0; taps < 6; taps++) {
        state = thrustDocking(state, sign === 1 ? 'right' : 'left');
        if (
          sign * (0.5 - state.x - (state.vx * (portAt - state.at)) / 1000) <=
          0
        )
          break;
        state = advanceDocking(state, state.at + 100, difficulty);
      }
      const remaining = (portAt - state.at) / 1000,
        slower = state.vx - sign * 0.022;
      const brakeAt =
        state.at +
        ((0.5 - state.x - slower * remaining) / (sign * 0.022)) * 1000;
      state = advanceDocking(
        state,
        Math.round(Math.max(state.at, brakeAt)),
        difficulty,
      );
      state = thrustDocking(state, sign === 1 ? 'left' : 'right');
      state = advanceDocking(state, Math.ceil(portAt), difficulty);
      expect(state.finished).toBe(true);
      expect(state.score).toBeGreaterThanOrEqual(85);
      expect(state.fuel).toBeGreaterThan(0);
    }
});

test('athlete inputs survive reload, score is validated, and exactly the next match period consumes a capped modifier', () => {
  const initial = athleteFixture(),
    before = encodeWorld(initial),
    started = startMiniGame(initial, 'sports'),
    random = { ...started.random };
  expect(started.random).toEqual(initial.random);
  expect(accountFor(started).cash).toBe(accountFor(initial).cash);
  expect(() => resolveCommand(started, { type: 'advance' })).toThrow(
    /saved mini-game/,
  );
  expect(() => finish(started)).toThrow(/Finish/);
  const shot = perfectShot(started),
    session = shot.miniGames[0];
  expect(session.status).toBe('active');
  expect(evaluateSession(session).score).toBeGreaterThanOrEqual(85);
  const cold = unpackCheckpoint(packCheckpoint(shot), true);
  expect(cold.miniGames).toEqual(shot.miniGames);
  const completed = finish(cold);
  expect(completed.miniGames[0].rating).toBe('perfect');
  expect(completed.random).toEqual(random);
  expect(completed.miniGames[0].appliedMonth).toBeNull();
  expect(() => finish(completed)).toThrow(/already ended/);
  expect(() => startMiniGame(completed, 'sports')).toThrow(/already been used/);
  const baseline = decodeWorld(encodeWorld(initial));
  baseline.random = { ...completed.random };
  const ordinary = nextMatchPeriod(baseline),
    boosted = nextMatchPeriod(completed);
  expect(boosted.careers[0].projects[0].periods[0].score).toBe(
    Math.min(100, ordinary.careers[0].projects[0].periods[0].score + 8),
  );
  const twice = nextMatchPeriod(boosted),
    normalTwice = nextMatchPeriod(ordinary);
  expect(twice.careers[0].projects[0].periods[1].score).toBe(
    normalTwice.careers[0].projects[0].periods[1].score,
  );
  expect(twice.miniGames[0].appliedMonth).toBe(
    boosted.miniGames[0].appliedMonth,
  );
  expect(encodeWorld(initial)).toBe(before);
  const forged = decodeWorld(encodeWorld(completed));
  forged.miniGames[0].score = 0;
  expect(() => validateWorld(forged)).toThrow(/result/);
});

test('forfeiting and timeout cannot reroll a season; another kind or duplicate input is rejected', () => {
  const started = startMiniGame(athleteFixture(), 'sports'),
    session = started.miniGames[0],
    snapshot = encodeWorld(started);
  expect(() =>
    resolveCommand(started, {
      type: 'mini-game-input',
      sessionId: session.id,
      index: 0,
      input: { at: 0, action: { type: 'lock' } },
    }),
  ).toThrow(/another game/);
  const shot = perfectShot(started);
  expect(() =>
    resolveCommand(shot, {
      type: 'mini-game-input',
      sessionId: session.id,
      index: 0,
      input: shot.miniGames[0].inputs[0],
    }),
  ).toThrow(/already been recorded/);
  const forfeit = resolveCommand(started, {
    type: 'mini-game-forfeit',
    sessionId: session.id,
  });
  expect(forfeit.miniGames[0]).toMatchObject({
    status: 'forfeited',
    score: 0,
    rating: 'failed',
  });
  const elapsed = resolveCommand(started, {
    type: 'mini-game-pause',
    sessionId: session.id,
    elapsedMs: 10000,
  });
  expect(finish(elapsed).miniGames[0].rating).toBe('failed');
  expect(encodeWorld(started)).toBe(snapshot);
});

test('burglary start reserves the ordinary limit; normal skip remains ordinary; forfeit retains evidence and arrest risks', () => {
  const initial = miniGameFixture(),
    started = startMiniGame(initial, 'crime'),
    session = started.miniGames[0];
  expect(started.incidents).toHaveLength(0);
  expect(started.random).toEqual(initial.random);
  expect(() =>
    resolveCommand(started, { type: 'crime', offence: 'burglary' }),
  ).toThrow(/saved mini-game/);
  const failed = resolveCommand(started, {
    type: 'mini-game-forfeit',
    sessionId: session.id,
  });
  expect(failed.incidents).toHaveLength(1);
  expect(failed.incidents[0]).toMatchObject({
    offence: 'burglary',
    personId: initial.activePersonId,
    gain: { minor: 0n },
  });
  expect(failed.incidents[0].riskBps).toBeGreaterThanOrEqual(4800);
  expect(failed.incidents[0].evidence).toBeGreaterThan(0);
  expect(failed.people[failed.activePersonId].legal.crimeSkill).toBe(
    initial.people[initial.activePersonId].legal.crimeSkill + 5,
  );
  expect(() => finish(failed)).toThrow();
  expect(() =>
    resolveCommand(failed, { type: 'crime', offence: 'burglary' }),
  ).toThrow();
  const normal = resolveCommand(initial, {
    type: 'crime',
    offence: 'burglary',
  });
  expect(normal.miniGames).toEqual([]);
  expect(normal.incidents).toHaveLength(1);
  expect(normal.incidents[0].gain.minor).toBeGreaterThan(0n);
  expect(failed.incidents[0].detectionRoll).toBe(
    normal.incidents[0].detectionRoll,
  );
  expect(failed.incidents[0].trialRoll).toBe(normal.incidents[0].trialRoll);
  expect(failed.incidents[0].evidence).toBe(normal.incidents[0].evidence);
});

test('three correct lock inputs influence only the normal burglary calculation and never guarantee freedom', () => {
  const initial = miniGameFixture();
  let world = startMiniGame(initial, 'crime');
  const session = world.miniGames[0];
  for (let stage = 0; stage < 3; stage++)
    world = resolveCommand(world, {
      type: 'mini-game-input',
      sessionId: session.id,
      index: stage,
      input: {
        at: stage * 1000,
        action: { type: 'lock', angle: targetAngle(session.seed, stage) },
      },
    });
  expect(world.random).toEqual(initial.random);
  expect(evaluateSession(world.miniGames[0]).score).toBe(100);
  const completed = finish(world),
    ordinary = resolveCommand(initial, { type: 'crime', offence: 'burglary' });
  expect(completed.miniGames[0].rating).toBe('perfect');
  expect(completed.incidents[0].riskBps).toBe(
    ordinary.incidents[0].riskBps - 700,
  );
  expect(completed.incidents[0].riskBps).toBeGreaterThan(0);
  expect(completed.incidents[0].gain.minor * 10000n).toBe(
    ordinary.incidents[0].gain.minor * 11500n,
  );
  expect(completed.incidents[0].followupRoll).toBe(
    ordinary.incidents[0].followupRoll,
  );
  expect(decodeWorld(encodeWorld(completed))).toEqual(completed);
  const unlinked = decodeWorld(encodeWorld(completed));
  unlinked.miniGames[0].appliedMonth = null;
  expect(() => validateWorld(unlinked)).toThrow(/burglary settlement/);
});

test('a perfect Safe Cracker result still passes through arrest, court fines and a recorded prison sentence', () => {
  const initial = miniGameFixture();
  initial.random.outcomes = 1;
  let world = startMiniGame(initial, 'crime');
  const session = world.miniGames[0];
  for (let stage = 0; stage < 3; stage++)
    world = resolveCommand(world, {
      type: 'mini-game-input',
      sessionId: session.id,
      index: stage,
      input: {
        at: stage * 1000,
        action: { type: 'lock', angle: targetAngle(session.seed, stage) },
      },
    });
  world = finish(world);
  expect(world.miniGames[0].rating).toBe('perfect');
  expect(world.pending?.kind).toBe('decision');
  expect(isConfined(world)).toBe(true);
  const incident = world.incidents[0],
    caseId = world.cases[0].id;
  expect(world.cases[0].evidence).toBe(incident.evidence);
  expect(world.cases[0].trialRoll).toBe(incident.trialRoll);
  world = resolveCommand(world, {
    type: 'choose',
    eventId: world.pending!.id,
    choiceId: 'remand',
  });
  world = resolveCommand(world, {
    type: 'acknowledge',
    resultId: world.pending!.id,
  });
  world.date = monthFrom(world.date, 1);
  legalMonth(world);
  expect(world.pending?.kind).toBe('decision');
  const before = accountFor(world).cash;
  world = resolveCommand(world, {
    type: 'choose',
    eventId: world.pending!.id,
    choiceId: 'guilty',
  });
  const conviction = world.cases.find((row) => row.id === caseId)!;
  expect(conviction.status).toBe('convicted');
  expect(conviction.fine.minor).toBeGreaterThan(0n);
  expect(accountFor(world).cash).toBe(before - conviction.fine.minor);
  expect(isConfined(world)).toBe(true);
  expect(
    world.sentences.some(
      (row) => row.caseIds.includes(caseId) && row.totalMonths > 0,
    ),
  ).toBe(true);
  expect(
    world.incidents.filter(
      (row) =>
        row.personId === world.activePersonId && row.offence === 'burglary',
    ),
  ).toHaveLength(1);
  expect(world.miniGames[0].score).toBe(100);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('docking physics are independent of render rate, input speed is bounded, and fast/misaligned contact fails safely', () => {
  const initial = initialDocking(2, 3),
    single = advanceDocking(initial, 1000, 3);
  let split = initial;
  for (let t = 10; t <= 1000; t += 10) split = advanceDocking(split, t, 3);
  expect(split.x).toBeCloseTo(single.x, 10);
  expect(split.y).toBeCloseTo(single.y, 10);
  const fast = advanceDocking(
    { ...initial, x: 0.5, y: 0.3, vy: -0.2 },
    1000,
    3,
  );
  expect(fast.finished).toBe(true);
  expect(fast.score).toBe(0);
  const perfect = advanceDocking(
    { ...initial, x: 0.5, y: 0.3, vx: 0, vy: -0.06 },
    1100,
    3,
  );
  expect(perfect.finished).toBe(true);
  expect(perfect.score).toBe(100);
  let acceleration = initial;
  for (let i = 0; i < 20; i++)
    acceleration = thrustDocking(acceleration, 'right');
  expect(acceleration.vx).toBeLessThanOrEqual(0.2);
  expect(acceleration.fuel).toBe(0);
});

test('docking failure changes the next eligible assignment period without changing its saved risk roll, pay or six-period structure', () => {
  const original = missionFixture(),
    started = startMiniGame(original, 'astronaut'),
    session = started.miniGames[0],
    failed = resolveCommand(started, {
      type: 'mini-game-forfeit',
      sessionId: session.id,
    });
  expect(failed.people[failed.activePersonId].died).toBeNull();
  expect(failed.random).toEqual(original.random);
  const baseline = nextServicePeriod(original),
    modified = nextServicePeriod(failed),
    a = baseline.serviceCareers[0].assignments[0].periods[0],
    b = modified.serviceCareers[0].assignments[0].periods[0];
  expect(b.riskRoll).toBe(a.riskRoll);
  expect(b.risk).toBe(a.risk);
  expect(modified.serviceCareers[0].periods.at(-1)!.gross).toBe(
    baseline.serviceCareers[0].periods.at(-1)!.gross,
  );
  if (b.attended && b.risk === 'none') {
    expect(b.score).toBe(Math.max(0, a.score - 8));
    expect(b.units).toBe(Math.floor(b.score / 5));
    expect(modified.miniGames[0].appliedMonth).toBe(b.month);
  }
  expect(modified.serviceCareers[0].assignments[0].periods).toHaveLength(1);
  expect(modified.serviceCareers[0].assignments[0].responseRoll).toBe(
    original.serviceCareers[0].assignments[0].responseRoll,
  );
  const cold = unpackCheckpoint(packCheckpoint(started));
  expect(cold.miniGames).toEqual(started.miniGames);
  expect(() =>
    resolveCommand(cold, {
      type: 'return-assignment',
      serviceId: original.serviceCareers[0].id,
    }),
  ).toThrow(/saved mini-game/);
});

test('a real successful docking transcript boosts one mission period and retains the full six-period assignment', () => {
  const original = missionFixture();
  original.random.outcomes = 1234567;
  let world = startMiniGame(original, 'astronaut', false);
  const id = world.miniGames[0].id;
  for (let at = 400; at <= 14000; at += 400) {
    const session = world.miniGames[0],
      state = dockingState(session, session.inputs, at);
    if (state.finished) {
      world = resolveCommand(world, {
        type: 'mini-game-pause',
        sessionId: id,
        elapsedMs: at,
      });
      break;
    }
    const remaining = (state.y - 0.24) / -state.vy,
      projected = state.x + state.vx * remaining;
    const options = (
      [
        ['left', -0.022],
        ['right', 0.022],
      ] as const
    )
      .map(([direction, impulse]) => ({
        direction,
        error: Math.abs(state.x + (state.vx + impulse) * remaining - 0.5),
      }))
      .sort((a, b) => a.error - b.error);
    const direction =
      options[0].error + 0.004 < Math.abs(projected - 0.5)
        ? options[0].direction
        : 'coast';
    world = resolveCommand(world, {
      type: 'mini-game-input',
      sessionId: id,
      index: session.inputs.length,
      input: { at, action: { type: 'thrust', direction } },
    });
  }
  world = finish(world);
  expect(world.miniGames[0].rating).toBe('perfect');
  expect(world.random).toEqual(original.random);
  let ordinary = nextServicePeriod(original),
    boosted = nextServicePeriod(world);
  expect(boosted.serviceCareers[0].assignments[0].periods[0].score).toBe(
    Math.min(
      100,
      ordinary.serviceCareers[0].assignments[0].periods[0].score + 8,
    ),
  );
  const applied = boosted.miniGames[0].appliedMonth;
  expect(applied).not.toBeNull();
  for (let month = 1; month < 6; month++) {
    ordinary = nextServicePeriod(ordinary);
    boosted = nextServicePeriod(boosted);
    expect(boosted.serviceCareers[0].assignments[0].periods[month]).toEqual(
      ordinary.serviceCareers[0].assignments[0].periods[month],
    );
  }
  expect(boosted.serviceCareers[0].assignments[0].periods).toHaveLength(6);
  expect(boosted.serviceCareers[0].assignments[0].status).toBe(
    ordinary.serviceCareers[0].assignments[0].status,
  );
  expect(boosted.miniGames[0].appliedMonth).toBe(applied);
});

test('a failed docking cannot replace a separately rolled fatal mission accident with an abort', () => {
  const original = missionFixture();
  let fatalSeed = 0;
  for (let seed = 1; seed < 200000; seed++) {
    const wages = randomInteger(seed, -2, 2),
      quality = randomInteger(wages.state, -6, 6);
    if (randomInteger(quality.state, 1, 10000).value === 1) {
      fatalSeed = seed;
      break;
    }
  }
  expect(fatalSeed).toBeGreaterThan(0);
  original.random.outcomes = fatalSeed;
  const started = startMiniGame(original, 'astronaut'),
    failed = resolveCommand(started, {
      type: 'mini-game-forfeit',
      sessionId: started.miniGames[0].id,
    });
  expect(failed.people[failed.activePersonId].died).toBeNull();
  const ordinary = nextServicePeriod(original),
    modified = nextServicePeriod(failed);
  expect(ordinary.serviceCareers[0].assignments[0].periods[0].risk).toBe(
    'fatal',
  );
  expect(modified.serviceCareers[0].assignments[0].periods).toEqual(
    ordinary.serviceCareers[0].assignments[0].periods,
  );
  expect(modified.people[modified.activePersonId].causeOfDeath).toBe(
    'a spaceflight accident',
  );
  expect(modified.miniGames[0].appliedMonth).toBeNull();
  expect(modified.random).toEqual(ordinary.random);
});

test('an unresolved attempt must be resumed or forfeited before ending or editing a life', () => {
  const world = startMiniGame(athleteFixture(), 'sports');
  expect(() => resolveCommand(world, endLifeCommand(world))).toThrow(
    /saved mini-game/,
  );
  expect(() =>
    applyGodModeEdits(world, {
      lifeId: world.id,
      personId: world.activePersonId,
      expectedRevision: world.revision,
      commands: [{ type: 'skill', skill: 'sport', value: 100 }],
    }),
  ).toThrow(/saved mini-game/);
  const forged = decodeWorld(encodeWorld(world));
  forged.date.day++;
  expect(() => validateWorld(forged)).toThrow(/active mini-game/);
});
