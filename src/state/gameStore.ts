import { createStore } from 'zustand/vanilla';
import { Creation, createLife } from '../game/createLife';
import { fullName, GameDate, immutableWorld, World } from '../game/model';
import { SaveCorrupt, SaveConflict, type LifeSummary, type SavedLifeUpdate, type SaveRepository } from '../persistence/repository';
import { GameCommand, IneligibleAction, resolveCommand } from '../game/engine';
import { SnapshotSummary } from '../persistence/archive';
import { applyGodModeEdits, type GodModeEdit } from '../game/godMode';

type Persistence = Pick<SaveRepository, 'active' | 'list' | 'create' | 'commit' | 'select' | 'importWithSummary' | 'recoverWithSummary' | 'snapshots' | 'snapshot' | 'restoreBranch'>;
type Dependencies = { repository: () => Promise<Persistence>; date: () => GameDate; id: () => string; yieldToUI?: () => Promise<void>; godModeAccess?: () => boolean };
export type GameState = {
  world: World | null; lives: LifeSummary[]; ready: boolean; busy: boolean; error: string | null;
  snapshots: SnapshotSummary[];
  bootstrap: () => Promise<boolean>;
  startLife: (input: Creation, seed: number) => Promise<boolean>;
  acknowledgeBirth: () => Promise<boolean>;
  selectLife: (id: string) => Promise<boolean>;
  dispatch: (command: GameCommand) => Promise<boolean>;
  editGodMode: (edit: GodModeEdit) => Promise<boolean>;
  importLife: (text: string, replace: boolean) => Promise<boolean>;
  recoverLife: (id: string) => Promise<boolean>;
  loadSnapshots: () => Promise<boolean>;
  saveSnapshot: () => Promise<boolean>;
  restoreSnapshot: (id: string) => Promise<boolean>;
  clearError: () => void;
};

export function createGameStore(deps: Dependencies) {
  return createStore<GameState>((set, get) => {
    let restoreAttempt: { before: World; snapshotId: string; branchId: string } | null = null;
    let godModeAttempt: { before: World; signature: string; commandId: string } | null = null;
    const publish = ({ world, summary }: SavedLifeUpdate) => set({ world, snapshots: [], lives: [
      summary,
      ...get().lives.filter(life => life.id !== world.id),
    ] });
    const run = async (action: () => Promise<void>, failure: string) => {
      if (get().busy) return false;
      set({ busy: true, error: null });
      try { if (deps.yieldToUI) await deps.yieldToUI(); await action(); return true; }
      catch (error) { set({ error: error instanceof IneligibleAction || error instanceof SaveCorrupt || error instanceof SaveConflict ? error.message : failure }); return false; }
      finally { set({ busy: false }); }
    };
    return {
      world: null, lives: [], snapshots: [], ready: false, busy: false, error: null,
      clearError: () => set({ error: null }),
      bootstrap: async () => {
        if (get().busy) return false;
        const success = await run(async () => {
          const repository = await deps.repository();
          const lives = await repository.list();
          set({ lives });
          const world = await repository.active();
          set({ world, snapshots: [] });
        }, 'Could not open saved lives. Please try again.');
        set({ ready: true });
        return success;
      },
      startLife: (input, seed) => run(async () => {
        const world = immutableWorld(createLife(deps.id(), seed, input, deps.date()));
        const repository = await deps.repository();
        const summary = await repository.create(world);
        set({ world, snapshots: [], lives: [summary, ...get().lives.filter(life => life.id !== world.id)] });
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
        publish(await repository.importWithSummary(text, replace));
      }, 'Could not import this life. Check the file and try again.'),
      recoverLife: id => run(async () => {
        const repository = await deps.repository();
        publish(await repository.recoverWithSummary(id));
      }, 'Could not restore the previous checkpoint. Your current save was kept.'),
      selectLife: id => run(async () => {
        const repository = await deps.repository();
        const world = await repository.select(id);
        set({ world, snapshots: [] });
      }, 'Could not open that life. Please try again.'),
      loadSnapshots: () => run(async () => {
        const world = get().world; if (!world) throw new IneligibleAction('Open a life first');
        set({ snapshots: await (await deps.repository()).snapshots(world.id) });
      }, 'Could not read historical checkpoints. Please try again.'),
      saveSnapshot: () => run(async () => {
        const world = get().world; if (!world) throw new IneligibleAction('Open a life first');
        set({ snapshots: await (await deps.repository()).snapshot(world.id, world.revision) });
      }, 'This moment could not be saved. Your current life was kept.'),
      restoreSnapshot: snapshotId => run(async () => {
        const world = get().world; if (!world) throw new IneligibleAction('Open a life first');
        if (restoreAttempt?.before !== world || restoreAttempt.snapshotId !== snapshotId) restoreAttempt = { before: world, snapshotId, branchId: deps.id() };
        const repository = await deps.repository(), next = await repository.restoreBranch(world.id, snapshotId, world.revision, restoreAttempt.branchId, 'restore:' + restoreAttempt.branchId);
        const lives = await repository.list();
        set({ world: next, lives, snapshots: [] }); restoreAttempt = null;
      }, 'Could not restore this checkpoint. Your current life was kept.'),
      editGodMode: edit => run(async () => {
        if (!deps.godModeAccess?.()) throw new IneligibleAction('God Mode is unavailable or switched off.');
        const world = get().world;
        if (!world) throw new IneligibleAction('Open a life first');
        const next = applyGodModeEdits(world, edit);
        const signature = JSON.stringify(edit);
        if (godModeAttempt?.before !== world || godModeAttempt.signature !== signature) godModeAttempt = { before: world, signature, commandId: 'god-mode:' + deps.id() };
        const repository = await deps.repository();
        if (!deps.godModeAccess?.()) throw new IneligibleAction('God Mode is unavailable or switched off.');
        const committed = await repository.commit(next, world.revision, godModeAttempt.commandId, 'Before God Mode');
        set({ world: committed, snapshots: [], lives: get().lives.map(life => life.id === committed.id ? { ...life, revision: committed.revision } : life) });
        godModeAttempt = null;
      }, 'God Mode changes could not be saved. Your previous save was kept. Try again.'),
      dispatch: command => run(async () => {
        const world = get().world;
        if (!world) throw new IneligibleAction('Open a life first');
        const next = resolveCommand(world, command, true);
        const repository = await deps.repository();
        const commandId = 'revision:' + world.revision + ':' + command.type;
        const committed = await repository.commit(next, world.revision, commandId, command.type === 'advance');
        set({ world: committed, lives: get().lives.map(life => life.id === committed.id ? { ...life, name: fullName(committed.people[committed.activePersonId]), revision: committed.revision } : life) });
      }, "Your progress couldn't be saved. Please try again."),
    };
  });
}
