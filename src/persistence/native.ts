import * as SQLite from 'expo-sqlite';
import { SaveRepository, SqlDatabase, SqlSession } from './repository';

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
  const db = await SQLite.openDatabaseAsync('dreams.db');
  await db.execAsync('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  const driver: SqlDatabase = {
    ...session(db),
    exec: sql => db.execAsync(sql),
    transaction: async action => {
      let result: Awaited<ReturnType<typeof action>>;
      await db.withExclusiveTransactionAsync(async tx => { result = await action(session(tx)); });
      return result!;
    },
  };
  const repository = new SaveRepository(driver);
  await repository.initialise();
  return repository;
}
