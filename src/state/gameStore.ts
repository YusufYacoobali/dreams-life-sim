import { createStore } from 'zustand/vanilla';
import { Creation, createLife } from '../game/createLife';
import { fullName, GameDate, World } from '../game/model';
import { SaveCorrupt, SaveConflict, type LifeSummary, type SaveRepository } from '../persistence/repository';
import { GameCommand, IneligibleAction, resolveCommand } from '../game/engine';

type Persistence = Pick<SaveRepository, 'active' | 'list' | 'create' | 'commit' | 'select' | 'import' | 'recover'>;
type Dependencies = { repository: () => Promise<Persistence>; date: () => GameDate; id: () => string };
export type GameState = {
  world: World | null; lives: LifeSummary[]; ready: boolean; busy: boolean; error: string | null;
  bootstrap: () => Promise<boolean>;
  startLife: (input: Creation, seed: number) => Promise<boolean>;
  acknowledgeBirth: () => Promise<boolean>;
  selectLife: (id: string) => Promise<boolean>;
  dispatch: (command: GameCommand) => Promise<boolean>;
  importLife: (text: string, replace: boolean) => Promise<boolean>;
  recoverLife: (id: string) => Promise<boolean>;
  clearError: () => void;
};

export function createGameStore(deps: Dependencies) {
  return createStore<GameState>((set, get) => {
    const publish = (world: World) => set({ world, lives: [
      { id: world.id, name: fullName(world.people[world.activePersonId]), revision: world.revision, updatedAt: '' },
      ...get().lives.filter(life => life.id !== world.id),
    ] });
    const run = async (action: () => Promise<void>, failure: string) => {
      if (get().busy) return false;
      set({ busy: true, error: null });
      try { await action(); return true; }
      catch (error) { set({ error: error instanceof IneligibleAction || error instanceof SaveCorrupt || error instanceof SaveConflict ? error.message : failure }); return false; }
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
      importLife: (text, replace) => run(async () => {
        const repository = await deps.repository();
        publish(await repository.import(text, replace));
      }, 'Could not import this life. Check the file and try again.'),
      recoverLife: id => run(async () => {
        const repository = await deps.repository();
        publish(await repository.recover(id));
      }, 'Could not restore the previous checkpoint. Your current save was kept.'),
      selectLife: id => run(async () => {
        const repository = await deps.repository();
        const world = await repository.select(id);
        set({ world });
      }, 'Could not open that life. Please try again.'),
      dispatch: command => run(async () => {
        const world = get().world;
        if (!world) throw new IneligibleAction('Open a life first');
        const next = resolveCommand(world, command);
        const repository = await deps.repository();
        const commandId = 'revision:' + world.revision + ':' + command.type;
        const committed = await repository.commit(next, world.revision, commandId);
        set({ world: committed, lives: get().lives.map(life => life.id === committed.id ? { ...life, revision: committed.revision } : life) });
      }, "Your progress couldn't be saved. Please try again."),
    };
  });
}
