import { fullName, immutableWorld, World } from '../game/model';
import { packCheckpoint, unpackCheckpoint } from './checkpoints';
import { BranchInfo, branchInfoSchema, decodeSave, encodeSave, SnapshotRecord, snapshotRecord, SnapshotSummary, snapshotSummarySchema, validateSnapshot } from './archive';

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
export type LifeSummary = { id: string; name: string; revision: number; updatedAt: string; branch?: BranchInfo };
export type SavedLifeUpdate = { world: World; summary: LifeSummary };
export class SaveConflict extends Error {
  constructor() { super('This life changed. Reload it before trying that action again.'); }
}
export class SaveCorrupt extends Error {
  constructor(public readonly lifeId: string) { super('This life could not be read. You can restore its previous checkpoint from Saved Lives.'); }
}

export class SaveRepository {
  private current: { world: World; payload: string } | null = null;
  constructor(private db: SqlDatabase, private now: () => string = () => new Date().toISOString()) {}

  async loadAppSettings(): Promise<string | null> {
    const row = await this.db.get<{ value: string }>("SELECT value FROM preferences WHERE key='app_settings'");
    return row?.value ?? null;
  }

  async saveAppSettings(value: string): Promise<void> {
    if (value.length > 1024) throw new Error('App settings are too large');
    await this.db.run("INSERT INTO preferences(key,value) VALUES('app_settings',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [value]);
  }

  async initialise(): Promise<void> {
    const version = await this.db.get<{ user_version: number }>('PRAGMA user_version');
    // Reader twenty protects future campus records. Existing histories and
    // payloads need no eager rewrite or invented campus people or attendance.
    if (!version || version.user_version > 21) throw new Error('This save database requires a newer version of Dreams');
    if (version.user_version === 21) return;
    if (version.user_version === 13 || version.user_version === 14 || version.user_version === 15 || version.user_version === 16 || version.user_version === 17 || version.user_version === 18 || version.user_version === 19 || version.user_version === 20) {
      // Complete reader-13 through reader-20 databases already have every table
      // and metadata row. Upgrade only the marker, not stored game payloads.
      await this.db.transaction(tx => tx.run('PRAGMA user_version = 21'));
      return;
    }
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
      `CREATE TABLE IF NOT EXISTS backups (
        life_id TEXT PRIMARY KEY REFERENCES lives(id) ON DELETE CASCADE,
        revision INTEGER NOT NULL, payload TEXT NOT NULL
      )`,
      'INSERT OR IGNORE INTO backups(life_id,revision,payload) SELECT id,revision,payload FROM lives',
      `CREATE TABLE IF NOT EXISTS snapshot_metadata (
        life_id TEXT NOT NULL, snapshot_id TEXT NOT NULL, revision INTEGER NOT NULL, metadata TEXT NOT NULL,
        PRIMARY KEY(life_id,snapshot_id),
        FOREIGN KEY(life_id,snapshot_id) REFERENCES snapshots(life_id,snapshot_id) ON DELETE CASCADE
      )`,
      'CREATE INDEX IF NOT EXISTS snapshot_revision ON snapshot_metadata(life_id,revision)',
      'CREATE TABLE IF NOT EXISTS branches(life_id TEXT PRIMARY KEY REFERENCES lives(id) ON DELETE CASCADE,metadata TEXT NOT NULL)',
      `CREATE TABLE IF NOT EXISTS restore_receipts(source_life_id TEXT NOT NULL REFERENCES lives(id) ON DELETE CASCADE,
        request_id TEXT NOT NULL,branch_life_id TEXT NOT NULL REFERENCES lives(id) ON DELETE CASCADE,PRIMARY KEY(source_life_id,request_id))`,
    ];
    await this.db.transaction(async tx => {
      for (const statement of statements) await tx.run(statement);
      const older = await tx.all<{ life_id: string; snapshot_id: string; payload: string }>('SELECT s.life_id,s.snapshot_id,s.payload FROM snapshots s LEFT JOIN snapshot_metadata m ON m.life_id=s.life_id AND m.snapshot_id=s.snapshot_id WHERE m.snapshot_id IS NULL');
      for (const row of older) {
        const record = snapshotRecord(unpackCheckpoint(row.payload), this.now(), 'Earlier checkpoint', row.payload);
        await tx.run('DELETE FROM snapshots WHERE life_id=? AND snapshot_id=?', [row.life_id, row.snapshot_id]);
        await this.writeSnapshot(tx, row.life_id, record);
      }
      await tx.run('PRAGMA user_version = 21');
    });
  }

  async list(): Promise<LifeSummary[]> {
    const rows = await this.db.all<{ id: string; name: string; revision: number; updated_at: string; branch: string | null }>('SELECT l.id,l.name,l.revision,l.updated_at,b.metadata AS branch FROM lives l LEFT JOIN branches b ON b.life_id=l.id ORDER BY l.updated_at DESC,l.id');
    return rows.map(row => ({ id: row.id, name: row.name, revision: row.revision, updatedAt: row.updated_at, ...(row.branch ? { branch: branchInfoSchema.parse(JSON.parse(row.branch)) } : {}) }));
  }

  private async readLife(id: string, primePeopleCache = false): Promise<{ world: World; payload: string }> {
    const row = await this.db.get<{ revision: number; payload: string }>('SELECT revision,payload FROM lives WHERE id=?', [id]);
    if (!row) throw new Error('Saved life not found');
    try {
      const world = unpackCheckpoint(row.payload, true, primePeopleCache);
      if (world.id !== id || world.revision !== row.revision) throw new Error('Saved life metadata is inconsistent');
      return { world, payload: row.payload };
    } catch { throw new SaveCorrupt(id); }
  }

  async load(id: string): Promise<World> {
    const current = await this.readLife(id, true);
    this.current = current;
    return current.world;
  }

  /** Inspect another life without selecting it or displacing the active save cache. */
  async previewLife(id: string): Promise<World> {
    return (await this.readLife(id)).world;
  }

  async active(): Promise<World | null> {
    const row = await this.db.get<{ value: string }>("SELECT value FROM preferences WHERE key='active_life'");
    return row ? this.load(row.value) : null;
  }

  async create(world: World): Promise<LifeSummary> {
    world = immutableWorld(world);
    const payload = packCheckpoint(world);
    const summary = { id: world.id, name: fullName(world.people[world.activePersonId]), revision: world.revision, updatedAt: this.now() };
    await this.db.transaction(async tx => {
      await tx.run('INSERT INTO lives(id,name,revision,updated_at,payload) VALUES(?,?,?,?,?)', [summary.id, summary.name, summary.revision, summary.updatedAt, payload]);
      await tx.run('INSERT INTO backups(life_id,revision,payload) VALUES(?,?,?)', [world.id, world.revision, payload]);
      await tx.run("INSERT INTO preferences(key,value) VALUES('active_life',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [world.id]);
    });
    this.current = { world, payload };
    return summary;
  }

  async select(id: string): Promise<World> {
    const world = await this.load(id);
    await this.db.run("INSERT INTO preferences(key,value) VALUES('active_life',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [id]);
    return world;
  }

  /** Checkpoint and idempotency receipt always commit or roll back together. */
  async commit(world: World, expectedRevision: number, commandId: string, captureBefore: boolean | string = false): Promise<World> {
    if (world.revision !== expectedRevision + 1) throw new SaveConflict();
    world = immutableWorld(world);
    const payload = packCheckpoint(world);
    let duplicate = false;
    await this.db.transaction(async tx => {
      // One native read checks both facts. The anchor preserves receipt-first
      // idempotency even if the current life row is missing.
      const current = await tx.get<{ revision: number | null; payload: string | null; has_receipt: number }>(
        'SELECT l.revision,l.payload,r.command_id IS NOT NULL AS has_receipt FROM (SELECT 1) AS anchor LEFT JOIN lives l ON l.id=? LEFT JOIN receipts r ON r.life_id=? AND r.command_id=?',
        [world.id, world.id, commandId],
      );
      if (current?.has_receipt) { duplicate = true; return; }
      if (!current || current.revision !== expectedRevision) throw new SaveConflict();
      // A matching revision proves the life exists; its payload is NOT NULL.
      const currentPayload = current.payload!;
      // Compare the actual bytes as well as identity/revision: an external write
      // or damaged current row must never be hidden by the in-memory cache.
      const cached = this.current;
      const previous = cached && cached.world.id === world.id && cached.world.revision === current.revision && cached.payload === currentPayload
        ? cached.world : unpackCheckpoint(currentPayload, true);
      if (previous.id !== world.id || previous.revision !== current.revision) throw new SaveCorrupt(world.id);
      if (captureBefore) {
        const packed = currentPayload.startsWith('{"format":"dreams-checkpoint-v') ? currentPayload : undefined;
        await this.writeSnapshot(tx, world.id, snapshotRecord(previous, this.now(), typeof captureBefore === 'string' ? captureBefore : 'Before Age Up', packed));
      }
      // Copy within SQLite instead of sending the unchanged payload back over the native bridge.
      await tx.run('UPDATE backups SET revision=?,payload=(SELECT payload FROM lives WHERE id=?) WHERE life_id=?', [current.revision, world.id, world.id]);
      await tx.run('UPDATE lives SET name=?,revision=?,updated_at=?,payload=? WHERE id=?', [fullName(world.people[world.activePersonId]), world.revision, this.now(), payload, world.id]);
      await tx.run('INSERT INTO receipts(life_id,command_id,revision) VALUES(?,?,?)', [world.id, commandId, world.revision]);
    });
    if (duplicate) return this.load(world.id);
    this.current = { world, payload };
    return world;
  }

  async export(id: string): Promise<string> {
    return this.db.transaction(async tx => {
      const row = await tx.get<{ revision: number; payload: string }>('SELECT revision,payload FROM lives WHERE id=?', [id]);
      if (!row) throw new Error('Saved life not found');
      const world = unpackCheckpoint(row.payload); if (world.id !== id || world.revision !== row.revision) throw new SaveCorrupt(id);
      return encodeSave({ world, snapshots: await this.snapshotRecords(id, tx), branch: await this.branch(id, tx) });
    });
  }

  private async writeSnapshot(tx: SqlSession, lifeId: string, record: SnapshotRecord) {
    await tx.run('INSERT INTO snapshots(life_id,snapshot_id,payload) VALUES(?,?,?) ON CONFLICT(life_id,snapshot_id) DO UPDATE SET payload=excluded.payload', [lifeId, record.summary.id, record.payload]);
    await tx.run('INSERT INTO snapshot_metadata(life_id,snapshot_id,revision,metadata) VALUES(?,?,?,?) ON CONFLICT(life_id,snapshot_id) DO UPDATE SET revision=excluded.revision,metadata=excluded.metadata', [lifeId, record.summary.id, record.summary.revision, JSON.stringify(record.summary)]);
  }

  private async snapshotRecords(id: string, session: SqlSession = this.db): Promise<SnapshotRecord[]> {
    const rows = await session.all<{ payload: string; metadata: string }>('SELECT s.payload,m.metadata FROM snapshots s JOIN snapshot_metadata m ON m.life_id=s.life_id AND m.snapshot_id=s.snapshot_id WHERE s.life_id=? ORDER BY m.revision', [id]);
    return rows.map(row => ({ summary: snapshotSummarySchema.parse(JSON.parse(row.metadata)), payload: row.payload }));
  }

  async snapshots(id: string): Promise<SnapshotSummary[]> {
    const rows = await this.db.all<{ metadata: string }>('SELECT metadata FROM snapshot_metadata WHERE life_id=? ORDER BY revision DESC', [id]);
    return rows.map(row => snapshotSummarySchema.parse(JSON.parse(row.metadata)));
  }

  async branch(id: string, session: SqlSession = this.db): Promise<BranchInfo | null> {
    const row = await session.get<{ metadata: string }>('SELECT metadata FROM branches WHERE life_id=?', [id]);
    return row ? branchInfoSchema.parse(JSON.parse(row.metadata)) : null;
  }

  async snapshot(id: string, expectedRevision: number): Promise<SnapshotSummary[]> {
    await this.db.transaction(async tx => {
      const row = await tx.get<{ revision: number; payload: string }>('SELECT revision,payload FROM lives WHERE id=?', [id]);
      if (!row || row.revision !== expectedRevision) throw new SaveConflict();
      await this.writeSnapshot(tx, id, snapshotRecord(unpackCheckpoint(row.payload), this.now(), 'Saved moment'));
    });
    return this.snapshots(id);
  }

  /** Preserve the source future; copy only checkpoints at or before the selected revision. */
  async restoreBranch(sourceId: string, snapshotId: string, expectedRevision: number, newId: string, requestId: string): Promise<World> {
    let restored!: World;
    let restoredPayload!: string;
    await this.db.transaction(async tx => {
      const receipt = await tx.get<{ branch_life_id: string }>('SELECT branch_life_id FROM restore_receipts WHERE source_life_id=? AND request_id=?', [sourceId, requestId]);
      if (receipt) {
        const row = await tx.get<{ revision: number; payload: string }>('SELECT revision,payload FROM lives WHERE id=?', [receipt.branch_life_id]);
        if (!row) throw new Error('Restored branch is unavailable');
        restored = unpackCheckpoint(row.payload, true); restoredPayload = row.payload;
        if (restored.id !== receipt.branch_life_id || restored.revision !== row.revision) throw new SaveCorrupt(receipt.branch_life_id);
      } else {
        const current = await tx.get<{ revision: number }>('SELECT revision FROM lives WHERE id=?', [sourceId]);
        if (!current || current.revision !== expectedRevision) throw new SaveConflict();
        const row = await tx.get<{ payload: string; metadata: string }>('SELECT s.payload,m.metadata FROM snapshots s JOIN snapshot_metadata m ON m.life_id=s.life_id AND m.snapshot_id=s.snapshot_id WHERE s.life_id=? AND s.snapshot_id=?', [sourceId, snapshotId]);
        if (!row) throw new Error('Historical checkpoint not found');
        const summary = snapshotSummarySchema.parse(JSON.parse(row.metadata)), before = validateSnapshot({ summary, payload: row.payload });
        restored = immutableWorld({ ...before, id: newId }); const payload = packCheckpoint(restored), now = this.now(); restoredPayload = payload;
        await tx.run('INSERT INTO lives(id,name,revision,updated_at,payload) VALUES(?,?,?,?,?)', [newId, fullName(restored.people[restored.activePersonId]), restored.revision, now, payload]);
        await tx.run('INSERT INTO backups(life_id,revision,payload) VALUES(?,?,?)', [newId, restored.revision, payload]);
        const branch: BranchInfo = { sourceLifeId: sourceId, snapshotId, personId: summary.personId, name: summary.name, date: summary.date, age: summary.age };
        await tx.run('INSERT INTO branches(life_id,metadata) VALUES(?,?)', [newId, JSON.stringify(branch)]);
        await tx.run('INSERT INTO snapshots(life_id,snapshot_id,payload) SELECT ?,s.snapshot_id,s.payload FROM snapshots s JOIN snapshot_metadata m ON m.life_id=s.life_id AND m.snapshot_id=s.snapshot_id WHERE s.life_id=? AND m.revision<=?', [newId, sourceId, before.revision]);
        await tx.run('INSERT INTO snapshot_metadata(life_id,snapshot_id,revision,metadata) SELECT ?,snapshot_id,revision,metadata FROM snapshot_metadata WHERE life_id=? AND revision<=?', [newId, sourceId, before.revision]);
        await tx.run('INSERT INTO restore_receipts(source_life_id,request_id,branch_life_id) VALUES(?,?,?)', [sourceId, requestId, newId]);
      }
      await tx.run("INSERT INTO preferences(key,value) VALUES('active_life',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [restored.id]);
    });
    this.current = { world: restored, payload: restoredPayload };
    return restored;
  }

  async recoveryPreview(id: string): Promise<World> {
    const backup = await this.db.get<{ revision: number; payload: string }>('SELECT revision,payload FROM backups WHERE life_id=?', [id]);
    if (!backup) throw new Error('No previous checkpoint is available');
    const world = unpackCheckpoint(backup.payload, true, false);
    if (world.id !== id || world.revision !== backup.revision) throw new Error('Previous checkpoint metadata is inconsistent');
    return world;
  }

  /** Explicitly requested recovery, never a silent reset during a normal load. */
  async recover(id: string): Promise<World> {
    return (await this.recoverWithSummary(id)).world;
  }

  async recoverWithSummary(id: string): Promise<SavedLifeUpdate> {
    const world = await this.recoveryPreview(id), payload = packCheckpoint(world);
    let summary!: LifeSummary;
    await this.db.transaction(async tx => {
      const branch = await this.branch(id, tx);
      summary = { id, name: fullName(world.people[world.activePersonId]), revision: world.revision, updatedAt: this.now(), ...(branch ? { branch } : {}) };
      await tx.run('UPDATE lives SET name=?,revision=?,updated_at=?,payload=? WHERE id=?', [summary.name, world.revision, summary.updatedAt, payload, id]);
      await tx.run('DELETE FROM receipts WHERE life_id=?', [id]);
      await tx.run('DELETE FROM snapshots WHERE life_id=? AND snapshot_id IN (SELECT snapshot_id FROM snapshot_metadata WHERE life_id=? AND revision>?)', [id, id, world.revision]);
      await tx.run("INSERT INTO preferences(key,value) VALUES('active_life',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [id]);
    });
    this.current = { world, payload };
    return { world, summary };
  }

  async import(text: string, replace = false): Promise<World> {
    return (await this.importWithSummary(text, replace)).world;
  }

  async importWithSummary(text: string, replace = false): Promise<SavedLifeUpdate> {
    const { world: imported, snapshots, branch } = decodeSave(text), world = immutableWorld(imported);
    const existing = await this.db.get<{ id: string }>('SELECT id FROM lives WHERE id=?', [world.id]);
    if (existing && !replace) throw new Error('This life already exists. Confirm replacement first.');
    const payload = packCheckpoint(world);
    const summary: LifeSummary = { id: world.id, name: fullName(world.people[world.activePersonId]), revision: world.revision, updatedAt: this.now(), ...(branch ? { branch } : {}) };
    await this.db.transaction(async tx => {
      const current = await tx.get<{ revision: number; payload: string }>('SELECT revision,payload FROM lives WHERE id=?', [world.id]);
      if (current) {
        let valid = false;
        try { const previous = unpackCheckpoint(current.payload); valid = previous.id === world.id && previous.revision === current.revision; } catch { /* Keep the existing recovery copy. */ }
        if (valid) await tx.run('UPDATE backups SET revision=?,payload=? WHERE life_id=?', [current.revision, current.payload, world.id]);
      }
      if (existing) await tx.run('UPDATE lives SET name=?,revision=?,updated_at=?,payload=? WHERE id=?', [summary.name, world.revision, summary.updatedAt, payload, world.id]);
      else {
        await tx.run('INSERT INTO lives(id,name,revision,updated_at,payload) VALUES(?,?,?,?,?)', [world.id, summary.name, world.revision, summary.updatedAt, payload]);
        await tx.run('INSERT INTO backups(life_id,revision,payload) VALUES(?,?,?)', [world.id, world.revision, payload]);
      }
      await tx.run('DELETE FROM receipts WHERE life_id=?', [world.id]);
      await tx.run('DELETE FROM snapshots WHERE life_id=?', [world.id]);
      await tx.run('DELETE FROM branches WHERE life_id=?', [world.id]);
      await tx.run('DELETE FROM restore_receipts WHERE source_life_id=?', [world.id]);
      for (const record of snapshots) await this.writeSnapshot(tx, world.id, record);
      if (branch) await tx.run('INSERT INTO branches(life_id,metadata) VALUES(?,?)', [world.id, JSON.stringify(branch)]);
      await tx.run("INSERT INTO preferences(key,value) VALUES('active_life',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [world.id]);
    });
    this.current = { world, payload };
    return { world, summary };
  }
}
