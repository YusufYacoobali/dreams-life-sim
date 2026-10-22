import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { encodeWorld } from '../../src/game/model';
import { database } from '../support/sqlite';
import { athleteFixture, miniGameFixture } from '../support/miniGames';
import { burglaryContext } from '../../src/minigames/core/eligibility';
import { keeperPosition } from '../../src/minigames/sports/sportsLogic';
import { targetAngle } from '../../src/minigames/crime/crimeLogic';

async function setup(crime = false) {
  const { sqlite, driver } = database(),
    repository = new SaveRepository(driver);
  await repository.initialise();
  const world = crime ? miniGameFixture() : athleteFixture();
  await repository.create(world);
  const deps = {
      repository: async () => repository,
      date: () => world.date,
      id: () => 'life_minigame_branch',
    },
    store = createGameStore(deps);
  await store.getState().bootstrap();
  const start = {
    type: 'mini-game-start' as const,
    kind: crime ? ('crime' as const) : ('sports' as const),
    ownerId: crime ? world.activePersonId : world.careers[0].id,
    contextId: crime ? burglaryContext(world) : world.careers[0].projects[0].id,
    assisted: true,
  };
  return { sqlite, repository, world, deps, store, start };
}

test('a failed start never publishes or consumes an attempt; a cold reopen resumes the same saved inputs and parameters', async () => {
  const { sqlite, repository, world, deps, store, start } = await setup();
  try {
    const original = encodeWorld(world);
    sqlite.exec(
      "CREATE TRIGGER fail_mini BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END",
    );
    expect(await store.getState().dispatch(start)).toBe(false);
    expect(encodeWorld(store.getState().world!)).toBe(original);
    expect(encodeWorld(await repository.load(world.id))).toBe(original);
    sqlite.exec('DROP TRIGGER fail_mini');
    expect(await store.getState().dispatch(start)).toBe(true);
    let session = store.getState().world!.miniGames[0];
    const x =
      keeperPosition(0, session.seed, session.difficulty) < 0.5 ? 0.88 : 0.12;
    expect(
      await store
        .getState()
        .dispatch({
          type: 'mini-game-input',
          sessionId: session.id,
          index: 0,
          input: { at: 1500, action: { type: 'shot', x, y: 0.1, power: 0.78 } },
        }),
    ).toBe(true);
    expect(
      await store
        .getState()
        .dispatch({
          type: 'mini-game-pause',
          sessionId: session.id,
          elapsedMs: 1700,
        }),
    ).toBe(true);
    session = store.getState().world!.miniGames[0];
    const cold = createGameStore(deps);
    expect(await cold.getState().bootstrap()).toBe(true);
    expect(cold.getState().world!.miniGames[0]).toEqual(session);
    expect(
      await cold
        .getState()
        .dispatch({ type: 'mini-game-complete', sessionId: session.id }),
    ).toBe(true);
    const committed = encodeWorld(cold.getState().world!);
    expect(
      await cold
        .getState()
        .dispatch({ type: 'mini-game-complete', sessionId: session.id }),
    ).toBe(false);
    expect(encodeWorld(cold.getState().world!)).toBe(committed);
  } finally {
    sqlite.close();
  }
});

test('burglary completion rollback leaves the reserved attempt and transcript intact; retry applies proceeds and legal consequences exactly once', async () => {
  const { sqlite, repository, store, start } = await setup(true);
  try {
    expect(await store.getState().dispatch(start)).toBe(true);
    const session = store.getState().world!.miniGames[0];
    for (let stage = 0; stage < 3; stage++)
      expect(
        await store
          .getState()
          .dispatch({
            type: 'mini-game-input',
            sessionId: session.id,
            index: stage,
            input: {
              at: stage * 1000,
              action: { type: 'lock', angle: targetAngle(session.seed, stage) },
            },
          }),
      ).toBe(true);
    const before = encodeWorld(store.getState().world!);
    sqlite.exec(
      "CREATE TRIGGER fail_complete BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END",
    );
    const complete = {
      type: 'mini-game-complete' as const,
      sessionId: session.id,
    };
    expect(await store.getState().dispatch(complete)).toBe(false);
    expect(encodeWorld(store.getState().world!)).toBe(before);
    expect(encodeWorld(await repository.load(store.getState().world!.id))).toBe(
      before,
    );
    sqlite.exec('DROP TRIGGER fail_complete');
    expect(await store.getState().dispatch(complete)).toBe(true);
    const saved = store.getState().world!;
    expect(saved.incidents).toHaveLength(1);
    expect(
      saved.ledger.filter((row) => row.category === 'crime-proceeds'),
    ).toHaveLength(1);
    expect(await store.getState().dispatch(complete)).toBe(false);
    expect(store.getState().world).toBe(saved);
  } finally {
    sqlite.close();
  }
});

test('a lost burglary commit acknowledgement retries its original receipt without adding another incident or payment', async () => {
  const setupResult = await setup(true),
    { sqlite, repository, store, start } = setupResult;
  try {
    await store.getState().dispatch(start);
    const session = store.getState().world!.miniGames[0];
    for (let stage = 0; stage < 3; stage++)
      await store
        .getState()
        .dispatch({
          type: 'mini-game-input',
          sessionId: session.id,
          index: stage,
          input: {
            at: stage * 1000,
            action: { type: 'lock', angle: targetAngle(session.seed, stage) },
          },
        });
    const before = store.getState().world!;
    let lose = true;
    const wrapped = {
      ...repository,
      active: () => repository.active(),
      list: () => repository.list(),
      commit: async (...args: Parameters<SaveRepository['commit']>) => {
        const result = await repository.commit(...args);
        if (lose) {
          lose = false;
          throw Error('Lost acknowledgement');
        }
        return result;
      },
    } as SaveRepository;
    const retry = createGameStore({
      ...setupResult.deps,
      repository: async () => wrapped,
    });
    await retry.getState().bootstrap();
    const complete = {
      type: 'mini-game-complete' as const,
      sessionId: session.id,
    };
    expect(await retry.getState().dispatch(complete)).toBe(false);
    expect(retry.getState().world).toEqual(before);
    expect((await repository.load(before.id)).incidents).toHaveLength(1);
    expect(await retry.getState().dispatch(complete)).toBe(true);
    expect(retry.getState().world!.incidents).toHaveLength(1);
    expect(
      retry
        .getState()
        .world!.ledger.filter((row) => row.category === 'crime-proceeds'),
    ).toHaveLength(1);
  } finally {
    sqlite.close();
  }
});

test('time-machine branches retain a resumable attempt and its exact challenge seed under the new life identity', async () => {
  const { sqlite, repository, store, start } = await setup();
  try {
    await store.getState().dispatch(start);
    const active = store.getState().world!,
      session = active.miniGames[0],
      snapshots = await repository.snapshot(active.id, active.revision);
    const branch = await repository.restoreBranch(
      active.id,
      snapshots[0].id,
      active.revision,
      'life_minigame_branch',
      'restore-mini',
    );
    expect(branch.id).toBe('life_minigame_branch');
    expect(branch.miniGames[0]).toEqual({ ...session, lifeId: branch.id });
    expect(branch.miniGames[0].seed).toBe(session.seed);
  } finally {
    sqlite.close();
  }
});
