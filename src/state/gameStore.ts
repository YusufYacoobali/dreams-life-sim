import { createStore } from 'zustand/vanilla';
import { Creation, createLife } from '../game/createLife';
import { GameDate, World } from '../game/model';
import type { LifeSummary, SaveRepository } from '../persistence/repository';

type Persistence = Pick<SaveRepository, 'active' | 'list' | 'create' | 'commit' | 'select'>;
type Dependencies = { repository: () => Promise<Persistence>; date: () => GameDate; id: () => string };
export type GameState = {
  world: World | null; lives: LifeSummary[]; ready: boolean; busy: boolean; error: string | null;
  bootstrap: () => Promise<boolean>;
  startLife: (input: Creation, seed: number) => Promise<boolean>;
  acknowledgeBirth: () => Promise<boolean>;
  selectLife: (id: string) => Promise<boolean>;
  clearError: () => void;
};

export function createGameStore(deps: Dependencies) {
  return createStore<GameState>((set, get) => {
    const run = async (action: () => Promise<void>, failure: string) => {
      if (get().busy) return false;
      set({ busy: true, error: null });
      try { await action(); return true; }
      catch { set({ error: failure }); return false; }
      finally { set({ busy: false }); }
    };
    return {
      world: null, lives: [], ready: false, busy: false, error: null,
      clearError: () => set({ error: null }),
      bootstrap: async () => {
        if (get().busy) return false;
        const success = await run(async () => {
          const repository = await deps.repository();
          const lives = await repository.list();
          set({ lives });
          const world = await repository.active();
          set({ world });
        }, 'Could not open saved lives. Please try again.');
        set({ ready: true });
        return success;
      },
      startLife: (input, seed) => run(async () => {
        const world = createLife(deps.id(), seed, input, deps.date());
        const repository = await deps.repository();
        const summary = await repository.create(world);
        set({ world, lives: [summary, ...get().lives.filter(life => life.id !== world.id)] });
      }, "Your new life couldn't be saved. Please try again."),
      acknowledgeBirth: () => run(async () => {
        const world = get().world;
        if (!world) throw new Error('No active life');
        if (world.birthAcknowledged) return;
        const next = { ...world, birthAcknowledged: true, revision: world.revision + 1 };
        const repository = await deps.repository();
        const committed = await repository.commit(next, world.revision, 'birth:' + world.id);
        set({ world: committed });
      }, "Your progress couldn't be saved. Please try again."),
      selectLife: id => run(async () => {
        const repository = await deps.repository();
        const world = await repository.select(id);
        set({ world });
      }, 'Could not open that life. Please try again.'),
    };
  });
}
