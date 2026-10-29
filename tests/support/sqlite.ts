import { DatabaseSync } from 'node:sqlite';
import type { SqlDatabase, SqlSession } from '../../src/persistence/repository';
export function database() {
  const sqlite = new DatabaseSync(':memory:'); sqlite.exec('PRAGMA foreign_keys=ON');
  const session: SqlSession = {
    run: async (sql, values = []) => { sqlite.prepare(sql).run(...values); },
    get: async <T,>(sql: string, values: (string | number | null)[] = []) => sqlite.prepare(sql).get(...values) as T ?? null,
    all: async <T,>(sql: string, values: (string | number | null)[] = []) => sqlite.prepare(sql).all(...values) as T[],
  };
  const driver: SqlDatabase = {
    ...session, exec: async sql => { sqlite.exec(sql); },
    transaction: async action => {
      sqlite.exec('BEGIN IMMEDIATE');
      try { const result = await action(session); sqlite.exec('COMMIT'); return result; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  return { sqlite, driver };
}
