import * as SQLite from 'expo-sqlite';
import { SaveRepository, SqlDatabase, SqlSession } from './repository';
import { isCommandProfilingEnabled } from '../access/buildAccess';
import { measureCommandAsync } from '../performance/commandTiming';

function session(db: Pick<SQLite.SQLiteDatabase, 'runAsync' | 'getFirstAsync' | 'getAllAsync'>): SqlSession {
  return {
    run: async (sql, values = []) => { await db.runAsync(sql, values); },
    get: <T,>(sql: string, values: (string | number | null)[] = []) => db.getFirstAsync<T>(sql, values),
    all: <T,>(sql: string, values: (string | number | null)[] = []) => db.getAllAsync<T>(sql, values),
  };
}

let opening: Promise<SaveRepository> | undefined;
export function openRepository(): Promise<SaveRepository> {
  if (!opening) opening = open().catch(error => { opening = undefined; throw error; });
  return opening;
}

async function open(): Promise<SaveRepository> {
  const db = await SQLite.openDatabaseAsync(isCommandProfilingEnabled() ? 'dreams-performance.db' : 'dreams.db');
  await db.execAsync('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  const repository = repositoryFor(db);
  await repository.initialise();
  return repository;
}

function repositoryFor(db: SQLite.SQLiteDatabase) {
  const driver: SqlDatabase = {
    ...session(db),
    exec: sql => db.execAsync(sql),
    transaction: async action => {
      let result: Awaited<ReturnType<typeof action>>;
      await measureCommandAsync('native:transaction', () => db.withExclusiveTransactionAsync(async tx => { result = await action(session(tx)); }));
      return result!;
    },
  };
  return new SaveRepository(driver);
}

/** Independent connection/cache for an internal cold-read probe. Never opens
 * the public database and never replaces the live writer connection. */
export async function readProfilingCheckpoint(id: string) {
  if (!isCommandProfilingEnabled()) throw new Error('Performance diagnostics are unavailable');
  const db = await SQLite.openDatabaseAsync('dreams-performance.db');
  try { return await measureCommandAsync('load', () => repositoryFor(db).load(id)); }
  finally { await db.closeAsync(); }
}
