import { decodeWorld, encodeWorld, fullName, World } from '../game/model';

export type SqlValue = string | number | null;
export interface SqlSession {
  run(sql: string, values?: SqlValue[]): Promise<void>;
  get<T>(sql: string, values?: SqlValue[]): Promise<T | null>;
  all<T>(sql: string, values?: SqlValue[]): Promise<T[]>;
}
export interface SqlDatabase extends SqlSession {
  exec(sql: string): Promise<void>;
  transaction<T>(action: (session: SqlSession) => Promise<T>): Promise<T>;
}
export type LifeSummary = { id: string; name: string; revision: number; updatedAt: string };
export class SaveConflict extends Error {
  constructor() { super('This life changed. Reload it before trying that action again.'); }
}

export class SaveRepository {
  constructor(private db: SqlDatabase, private now: () => string = () => new Date().toISOString()) {}

  async initialise(): Promise<void> {
    const version = await this.db.get<{ user_version: number }>('PRAGMA user_version');
    if (!version || version.user_version > 1) throw new Error('This save database requires a newer version of Dreams');
    if (version.user_version === 1) return;
    const statements = [
      `CREATE TABLE IF NOT EXISTS lives (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, revision INTEGER NOT NULL,
        updated_at TEXT NOT NULL, payload TEXT NOT NULL
      )`,
      'CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
      `CREATE TABLE IF NOT EXISTS receipts (
        life_id TEXT NOT NULL REFERENCES lives(id) ON DELETE CASCADE,
        command_id TEXT NOT NULL, revision INTEGER NOT NULL,
        PRIMARY KEY(life_id, command_id)
      )`,
      `CREATE TABLE IF NOT EXISTS snapshots (
        life_id TEXT NOT NULL REFERENCES lives(id) ON DELETE CASCADE,
        snapshot_id TEXT NOT NULL, payload TEXT NOT NULL,
        PRIMARY KEY(life_id, snapshot_id)
      )`,
      'PRAGMA user_version = 1',
    ];
    await this.db.transaction(async tx => { for (const statement of statements) await tx.run(statement); });
  }

  async list(): Promise<LifeSummary[]> {
    const rows = await this.db.all<{ id: string; name: string; revision: number; updated_at: string }>('SELECT id,name,revision,updated_at FROM lives ORDER BY updated_at DESC, id');
    return rows.map(row => ({ id: row.id, name: row.name, revision: row.revision, updatedAt: row.updated_at }));
  }

  async load(id: string): Promise<World> {
    const row = await this.db.get<{ revision: number; payload: string }>('SELECT revision,payload FROM lives WHERE id=?', [id]);
    if (!row) throw new Error('Saved life not found');
    const world = decodeWorld(row.payload);
    if (world.id !== id || world.revision !== row.revision) throw new Error('Saved life metadata is inconsistent');
    return world;
  }

  async active(): Promise<World | null> {
    const row = await this.db.get<{ value: string }>("SELECT value FROM preferences WHERE key='active_life'");
    return row ? this.load(row.value) : null;
  }

  async create(world: World): Promise<LifeSummary> {
    const payload = encodeWorld(world);
    const summary = { id: world.id, name: fullName(world.people[world.activePersonId]), revision: world.revision, updatedAt: this.now() };
    await this.db.transaction(async tx => {
      await tx.run('INSERT INTO lives(id,name,revision,updated_at,payload) VALUES(?,?,?,?,?)', [summary.id, summary.name, summary.revision, summary.updatedAt, payload]);
      await tx.run("INSERT INTO preferences(key,value) VALUES('active_life',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [world.id]);
    });
    return summary;
  }

  async select(id: string): Promise<World> {
    const world = await this.load(id);
    await this.db.run("INSERT INTO preferences(key,value) VALUES('active_life',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [id]);
    return world;
  }

  /** Checkpoint and idempotency receipt always commit or roll back together. */
  async commit(world: World, expectedRevision: number, commandId: string): Promise<World> {
    if (world.revision !== expectedRevision + 1) throw new SaveConflict();
    const payload = encodeWorld(world);
    let duplicate = false;
    await this.db.transaction(async tx => {
      const receipt = await tx.get<{ revision: number }>('SELECT revision FROM receipts WHERE life_id=? AND command_id=?', [world.id, commandId]);
      if (receipt) { duplicate = true; return; }
      const current = await tx.get<{ revision: number }>('SELECT revision FROM lives WHERE id=?', [world.id]);
      if (!current || current.revision !== expectedRevision) throw new SaveConflict();
      await tx.run('UPDATE lives SET name=?,revision=?,updated_at=?,payload=? WHERE id=?', [fullName(world.people[world.activePersonId]), world.revision, this.now(), payload, world.id]);
      await tx.run('INSERT INTO receipts(life_id,command_id,revision) VALUES(?,?,?)', [world.id, commandId, world.revision]);
    });
    return duplicate ? this.load(world.id) : world;
  }

  async export(id: string): Promise<string> {
    return encodeWorld(await this.load(id));
  }

  async import(text: string, replace = false): Promise<World> {
    const world = decodeWorld(text);
    const existing = await this.db.get<{ id: string }>('SELECT id FROM lives WHERE id=?', [world.id]);
    if (existing && !replace) throw new Error('This life already exists. Confirm replacement first.');
    if (!existing) { await this.create(world); return world; }
    const payload = encodeWorld(world);
    await this.db.transaction(async tx => {
      await tx.run('UPDATE lives SET name=?,revision=?,updated_at=?,payload=? WHERE id=?', [fullName(world.people[world.activePersonId]), world.revision, this.now(), payload, world.id]);
      await tx.run('DELETE FROM receipts WHERE life_id=?', [world.id]);
      await tx.run('DELETE FROM snapshots WHERE life_id=?', [world.id]);
      await tx.run("INSERT INTO preferences(key,value) VALUES('active_life',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [world.id]);
    });
    return world;
  }
}
