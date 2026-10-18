import { createGameStore } from '../../src/state/gameStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import type { SaveRepository } from '../../src/persistence/repository';

const input = randomCreation(42);
const date = { year: 2026, month: 10, day: 18 };
const world = createLife('life_previous', 42, input, date);
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
function setup(overrides: Partial<Pick<SaveRepository, 'active' | 'list' | 'create' | 'commit' | 'select' | 'import' | 'recover'>> = {}) {
  const repository = {
    active: jest.fn(async () => world), list: jest.fn(async () => []),
    create: jest.fn(async (next: typeof world) => ({ id: next.id, name: 'Saved person', revision: 0, updatedAt: 'today' })),
    commit: jest.fn(async (next: typeof world) => next), select: jest.fn(async () => world), import: jest.fn(async () => world), recover: jest.fn(async () => world), ...overrides,
  };
  const store = createGameStore({ repository: async () => repository, date: () => date, id: () => 'life_new' });
  return { store, repository };
}

test('a second bootstrap cannot mark loading complete before the first read returns', async () => {
  const read = deferred<typeof world | null>();
  const { store } = setup({ active: () => read.promise });
  const first = store.getState().bootstrap();
  await Promise.resolve(); await Promise.resolve();
  expect(await store.getState().bootstrap()).toBe(false);
  expect(store.getState()).toMatchObject({ ready: false, busy: true, world: null });
  read.resolve(world);
  expect(await first).toBe(true);
  expect(store.getState()).toMatchObject({ ready: true, busy: false, world });
});

test('creation publishes only after storage commits and rejects rapid duplicate submissions', async () => {
  const write = deferred<{ id: string; name: string; revision: number; updatedAt: string }>();
  const create = jest.fn(() => write.promise);
  const { store } = setup({ create });
  await store.getState().bootstrap();
  const first = store.getState().startLife(input, 7);
  expect(await store.getState().startLife(input, 7)).toBe(false);
  await Promise.resolve();
  expect(create).toHaveBeenCalledTimes(1);
  expect(store.getState().world).toEqual(world);
  write.resolve({ id: 'life_new', name: 'Saved person', revision: 0, updatedAt: 'today' });
  expect(await first).toBe(true);
  expect(store.getState().world?.id).toBe('life_new');
});

test('a failed checkpoint keeps the visible birth state and permits retry', async () => {
  const commit = jest.fn().mockRejectedValueOnce(new Error('disk full')).mockImplementation(async next => next);
  const { store } = setup({ commit });
  await store.getState().bootstrap();
  expect(await store.getState().acknowledgeBirth()).toBe(false);
  expect(store.getState().world).toEqual(world);
  expect(store.getState().busy).toBe(false);
  expect(store.getState().error).toMatch(/couldn't be saved/);
  expect(await store.getState().acknowledgeBirth()).toBe(true);
  expect(store.getState().world?.birthAcknowledged).toBe(true);
  expect(store.getState().world?.revision).toBe(1);
  await store.getState().acknowledgeBirth();
  expect(commit).toHaveBeenCalledTimes(2);
});
