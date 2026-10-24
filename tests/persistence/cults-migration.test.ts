import { createHash } from 'node:crypto';
import {
  decodeWorld,
  encodeWorld,
  validateWorld,
  type World,
} from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { cultMonth } from '../../src/game/systems/cultMonth';
import { decodeSave } from '../../src/persistence/archive';
import {
  packCheckpoint,
  unpackCheckpoint,
} from '../../src/persistence/checkpoints';
import * as checkpoints from '../../src/persistence/checkpoints';
import {
  SaveRepository,
  type SqlDatabase,
} from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { athleteFixture, startMiniGame } from '../support/miniGames';
import { cultPeriod, foundCult } from '../support/cults';
import { database } from '../support/sqlite';
import native from '../fixtures/v39-content15-native-choice.json';
import polish3 from '../fixtures/v45-polish3-before-cult.json';
import cult46 from '../fixtures/v46-cult-before-polish.json';
import published47 from '../fixtures/v47-before-cult-polish.json';

const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const cult46Canonical = (world: World) => {
  const raw = JSON.parse(encodeWorld(world));
  // World46 already owned every cult record: retain the complete nonempty
  // history, pending offer and every other field in its immutable proof.
  Object.assign(raw, {
    schemaVersion: 46,
    engineVersion: 48,
    contentVersion: 25,
  });
  return JSON.stringify(raw);
};

// These are explicitly arranged World44 envelopes around real saved facts and
// ordinary commands, not newly claimed captures from a historical producer.
function world44(world: World): string {
  const raw = JSON.parse(encodeWorld(world));
  expect(raw.cults).toEqual([]);
  delete raw.cults;
  Object.assign(raw, {
    schemaVersion: 44,
    engineVersion: 46,
    contentVersion: 23,
  });
  return JSON.stringify(raw);
}

const savedMiniGame = () => {
  const world = startMiniGame(athleteFixture(), 'sports');
  return resolveCommand(world, {
    type: 'mini-game-input',
    sessionId: world.miniGames[0].id,
    index: 0,
    input: {
      at: 1500,
      action: { type: 'shot', x: 0.12, y: 0.14, power: 0.78 },
    },
  });
};

test.each([
  [
    'an unchanged native pending choice',
    () => unpackCheckpoint(native.checkpoint, true),
  ],
  ['an earned career and saved mini-game input', savedMiniGame],
] as const)(
  'World44 migration adds only empty cults and root tags around %s',
  (_name, source) => {
    const prior = source(),
      input = world44(prior),
      raw = JSON.parse(input),
      originalNativeBytes = native.checkpoint;
    const migrated = decodeWorld(input, true);
    expect(JSON.parse(encodeWorld(migrated))).toEqual({
      ...raw,
      schemaVersion: 49,
      engineVersion: 51,
      contentVersion: 28,
      cults: [],
    });
    expect(migrated).toEqual(prior);
    expect(migrated.pending).toEqual(prior.pending);
    expect(migrated.deferred).toEqual(prior.deferred);
    expect(migrated.random).toEqual(prior.random);
    expect(migrated.miniGames).toEqual(prior.miniGames);
    expect(migrated.ledger).toEqual(prior.ledger);
    expect(JSON.stringify(raw)).toBe(input);
    expect(native.checkpoint).toBe(originalNativeBytes);
    expect(unpackCheckpoint(packCheckpoint(migrated), true)).toEqual(migrated);
  },
);

test.each([
  ['birth', '6caeff2133be1e564a3f44b0aac510317cf754783d65e79890cfd7ec71cdcdcd'],
  [
    'sports',
    '1b50db08338c84a642bc96c39de0ed80c3b784541c34d200df21816da78fb10c',
  ],
] as const)(
  'genuine Polish3 World45 %s gains only cults and current tags while its reader25 database retains the original bytes',
  async (key, expectedSha) => {
    expect(polish3.producerCommit).toBe(
      'da0b0e59cc11fc37b81eb0a20bcf5251e6eba5af',
    );
    expect(polish3.versions).toEqual({ world: 45, engine: 47, content: 24 });
    const record = polish3.records[key],
      raw = JSON.parse(record.payload),
      original = record.payload;
    expect(record.payloadSha256).toBe(expectedSha);
    expect(sha(original)).toBe(expectedSha);
    expect(Buffer.byteLength(original)).toBe(record.payloadBytes);
    expect(raw).toMatchObject({
      schemaVersion: 45,
      engineVersion: 47,
      contentVersion: 24,
    });
    expect(raw).not.toHaveProperty('cults');
    if (key === 'birth')
      expect(raw.people.person_parent1.appearance.provenance).toMatchObject({
        kind: 'automatic',
        version: 1,
      });
    else {
      expect(raw.miniGames[0]).toMatchObject({
        difficulty: 3,
        status: 'active',
      });
      expect(raw.miniGames[0].inputs).toHaveLength(1);
    }
    const migrated = decodeWorld(original, true);
    expect(JSON.parse(encodeWorld(migrated))).toEqual({
      ...raw,
      schemaVersion: 49,
      engineVersion: 51,
      contentVersion: 28,
      cults: [],
    });
    expect(migrated.people).toEqual(decodeWorld(original).people);
    expect(migrated.random).toEqual(raw.random);
    expect(JSON.stringify(raw)).toBe(original);
    expect(unpackCheckpoint(packCheckpoint(migrated), true)).toEqual(migrated);

    const { sqlite, driver } = database();
    try {
      await new SaveRepository(driver).initialise();
      sqlite
        .prepare(
          'INSERT INTO lives(id,name,revision,updated_at,payload) VALUES(?,?,?,?,?)',
        )
        .run(raw.id, 'Polish3 source', raw.revision, '2026-10-23', original);
      sqlite
        .prepare('INSERT INTO backups(life_id,revision,payload) VALUES(?,?,?)')
        .run(raw.id, raw.revision, original);
      sqlite
        .prepare('INSERT INTO preferences(key,value) VALUES(?,?)')
        .run('active_life', raw.id);
      sqlite.exec('PRAGMA user_version=25');
      const repository = new SaveRepository(driver);
      await repository.initialise();
      expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(
        28,
      );
      expect(await repository.active()).toEqual(migrated);
      expect(await repository.recoveryPreview(raw.id)).toEqual(migrated);
      for (const table of ['lives', 'backups'])
        expect(
          sqlite.prepare('SELECT payload FROM ' + table).get()?.payload,
        ).toBe(original);
      expect(sha(polish3.records[key].payload)).toBe(expectedSha);
    } finally {
      sqlite.close();
    }
  },
);

test.each([
  ['birth', '99dff87d31f00531de42265745b6201093607394ae9ed638e412316310a3afec'],
  [
    'failedClaim',
    '5604e0e4b8ab2a750b258fcfabcb698fb2408516bbbb4f3fcc31d5d96693216b',
  ],
] as const)(
  'genuine World46 %s changes only root tags and keeps the reader26 payload literal',
  async (key, expectedSha) => {
    expect(cult46.producerCommit).toBe(
      '9101307c89f4c05453322e78b6d7f0fcca40a403',
    );
    expect(cult46.versions).toEqual({ world: 46, engine: 48, content: 25 });
    const record = cult46.records[key],
      original = record.payload,
      raw = JSON.parse(original);
    expect(record.payloadSha256).toBe(expectedSha);
    expect(sha(original)).toBe(expectedSha);
    expect(Buffer.byteLength(original)).toBe(record.payloadBytes);
    expect(raw).toMatchObject({
      schemaVersion: 46,
      engineVersion: 48,
      contentVersion: 25,
    });
    const migrated = decodeWorld(original, true);
    expect(JSON.parse(encodeWorld(migrated))).toEqual({
      ...raw,
      schemaVersion: 49,
      engineVersion: 51,
      contentVersion: 28,
    });
    expect(sha(cult46Canonical(migrated))).toBe(expectedSha);
    expect(migrated.pending).toEqual(raw.pending);
    expect(migrated.random).toEqual(raw.random);
    expect(unpackCheckpoint(packCheckpoint(migrated), true)).toEqual(migrated);
    if (key === 'failedClaim') {
      expect(
        migrated.pending?.kind === 'decision' &&
          migrated.pending.choices.map((row) => row.id),
      ).toEqual(['admit', 'postpone', 'blame', 'withdraw']);
      const cult = migrated.cults[0],
        former = cult.members.find(
          (row) => row.personId === cult46.expelledMemberId,
        )!;
      expect(former.status).toBe('expelled');
      expect(former.memories).toHaveLength(4);
      expect(
        cult.threads.find((row) => row.templateId === 'rival-return'),
      ).toMatchObject({
        status: 'scheduled',
        participantIds: [former.personId],
        dueMonth: 24336,
      });
      expect(cult.cash).toBe(452078n);
      expect(migrated.annual).toMatchObject({
        monthsProcessed: 12,
        stage: 'months',
      });
    }
    const { sqlite, driver } = database();
    try {
      await new SaveRepository(driver).initialise();
      sqlite
        .prepare(
          'INSERT INTO lives(id,name,revision,updated_at,payload) VALUES(?,?,?,?,?)',
        )
        .run(raw.id, 'Cult46 source', raw.revision, '2026-10-23', original);
      sqlite
        .prepare('INSERT INTO backups(life_id,revision,payload) VALUES(?,?,?)')
        .run(raw.id, raw.revision, original);
      sqlite
        .prepare('INSERT INTO preferences(key,value) VALUES(?,?)')
        .run('active_life', raw.id);
      sqlite.exec('PRAGMA user_version=26');
      const repository = new SaveRepository(driver);
      await repository.initialise();
      expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(
        28,
      );
      expect(await repository.active()).toEqual(migrated);
      expect(await repository.recoveryPreview(raw.id)).toEqual(migrated);
      for (const table of ['lives', 'backups'])
        expect(
          sqlite.prepare('SELECT payload FROM ' + table).get()?.payload,
        ).toBe(original);
      expect(cult46.records[key].payload).toBe(original);
    } finally {
      sqlite.close();
    }
  },
);

test.each([
  ['admit', '46d1197dbe4cf1fbdb452d2e641f62a682fbce41f0772ad0d40a98d22c5dc09a'],
  [
    'postpone',
    'b8487b603ec437695b4e86ad157203bc6114c13d744d2fce573b4eea5efebd4e',
  ],
  ['blame', 'c3605f00f7f36a4220d769e23880662b6a7bdc6e07a9ed80d1fc7889238716f0'],
] as const)(
  'the actual saved World46 %s answer retains its complete original outcome without offering new choices',
  (choiceId, expectedSha) => {
    const before = unpackCheckpoint(
        packCheckpoint(decodeWorld(cult46.records.failedClaim.payload, true)),
        true,
      ),
      original = encodeWorld(before);
    const proof = cult46.legacyResults[choiceId],
      command = {
        type: 'choose' as const,
        eventId: before.pending!.id,
        choiceId,
      };
    expect(command).toEqual(proof.command);
    const selected = resolveCommand(before, command);
    expect(proof.resultSha256).toBe(expectedSha);
    expect(sha(cult46Canonical(selected))).toBe(expectedSha);
    expect(
      selected.cults[0].threads.find((row) => row.templateId === 'green-moon'),
    ).toMatchObject(proof.thread);
    expect(selected.pending?.kind === 'result' && selected.pending.body).toBe(
      before.pending?.kind === 'decision' &&
        before.pending.choices.find((row) => row.id === choiceId)!.resultBody,
    );
    expect(encodeWorld(before)).toBe(original);
    const cold = unpackCheckpoint(packCheckpoint(selected), true),
      settled = encodeWorld(cold);
    expect(() => resolveCommand(cold, command)).toThrow();
    expect(encodeWorld(cold)).toBe(settled);
  },
);

test('an actual World46 failed offer retains witnesses, former members, rival callback and treasury through archive transfer and Time Machine', async () => {
  const source = database(),
    destination = database(),
    repository = new SaveRepository(source.driver),
    imported = new SaveRepository(destination.driver);
  try {
    await repository.initialise();
    await imported.initialise();
    const before = await repository.import(cult46.records.failedClaim.payload),
      point = (await repository.snapshot(before.id, before.revision))[0];
    const future = resolveCommand(before, {
      type: 'choose',
      eventId: before.pending!.id,
      choiceId: 'admit',
    });
    await repository.commit(future, before.revision, 'legacy-admit', true);
    await repository.snapshot(future.id, future.revision);
    expect(await imported.import(await repository.export(future.id))).toEqual(
      future,
    );
    const branch = await imported.restoreBranch(
      future.id,
      point.id,
      future.revision,
      'life_cult46_offer_branch',
      'restore-cult46-offer',
    );
    expect(branch).toEqual({ ...before, id: branch.id });
    expect(branch.cults).toEqual(before.cults);
    expect(branch.pending).toEqual(
      JSON.parse(cult46.records.failedClaim.payload).pending,
    );
    expect(await imported.load(future.id)).toEqual(future);
    expect(
      await imported.restoreBranch(
        future.id,
        point.id,
        future.revision,
        'unused-cult46-branch',
        'restore-cult46-offer',
      ),
    ).toEqual(branch);
    const cold = decodeSave(await imported.export(branch.id)).world;
    expect(cold).toEqual(branch);
    const blamed = resolveCommand(cold, {
      type: 'choose',
      eventId: cold.pending!.id,
      choiceId: 'blame',
    });
    expect(sha(cult46Canonical({ ...blamed, id: before.id }))).toBe(
      cult46.legacyResults.blame.resultSha256,
    );
    expect(
      (await imported.snapshots(branch.id)).every(
        (row) => row.revision <= before.revision,
      ),
    ).toBe(true);
    expect(
      before.cults[0].threads.find((row) => row.templateId === 'rival-return')!
        .participantIds,
    ).toEqual([cult46.expelledMemberId]);
  } finally {
    source.sqlite.close();
    destination.sqlite.close();
  }
});

test.each([
  [
    'failedClaim',
    '46b2f704f6e3e8656b05e79e0572f699acc49e8a63f91b58da3587a71657157a',
  ],
  [
    'writingImmediate',
    '230a77736e60c9bbf94754e25fe0a7ff048933df260b25ac3bb92a5bcf0167b9',
  ],
] as const)(
  'published World47 %s advances only its tags and reader27 preserves every stored payload',
  async (key, expectedSha) => {
    expect(published47.producerCommit).toBe(
      '5a5902f383be2016f4b911bc0cff36b39511d409',
    );
    expect(published47.versions).toEqual({
      world: 47,
      engine: 49,
      content: 26,
      reader: 27,
    });
    const record = published47.records[key],
      original = record.payload,
      raw = JSON.parse(original),
      migrated = decodeWorld(original, true);
    expect(record.payloadSha256).toBe(expectedSha);
    expect(sha(original)).toBe(expectedSha);
    expect(Buffer.byteLength(original)).toBe(record.payloadBytes);
    expect(raw).toMatchObject({
      schemaVersion: 47,
      engineVersion: 49,
      contentVersion: 26,
    });
    expect(JSON.parse(encodeWorld(migrated))).toEqual({
      ...raw,
      schemaVersion: 49,
      engineVersion: 51,
      contentVersion: 28,
    });
    expect(JSON.parse(encodeWorld(migrated)).pending).toEqual(raw.pending);
    expect(migrated.random).toEqual(raw.random);
    expect(unpackCheckpoint(packCheckpoint(migrated), true)).toEqual(migrated);
    const { sqlite, driver } = database();
    try {
      await new SaveRepository(driver).initialise();
      sqlite
        .prepare(
          'INSERT INTO lives(id,name,revision,updated_at,payload) VALUES(?,?,?,?,?)',
        )
        .run(
          raw.id,
          'Published47 source',
          raw.revision,
          '2026-10-23',
          original,
        );
      sqlite
        .prepare('INSERT INTO backups(life_id,revision,payload) VALUES(?,?,?)')
        .run(raw.id, raw.revision, original);
      sqlite
        .prepare('INSERT INTO preferences(key,value) VALUES(?,?)')
        .run('active_life', raw.id);
      sqlite.exec('PRAGMA user_version=27');
      const rows = () =>
          Object.fromEntries(
            sqlite
              .prepare(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
              )
              .all()
              .map((row) => [
                row.name,
                sqlite
                  .prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2')
                  .all(),
              ]),
          ),
        before = rows();
      const repository = new SaveRepository(driver);
      await repository.initialise();
      expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(
        28,
      );
      expect(rows()).toEqual(before);
      expect(await repository.active()).toEqual(migrated);
      expect(await repository.recoveryPreview(raw.id)).toEqual(migrated);
      expect(rows()).toEqual(before);
    } finally {
      sqlite.close();
    }
  },
);

test.each(['missing', 'null', 'object', 'corrupt'] as const)(
  'current worlds reject %s cult history rather than repairing it',
  (kind) => {
    const world = foundCult(),
      raw = JSON.parse(encodeWorld(world)),
      runtime: Record<string, unknown> = { ...world };
    if (kind === 'missing') {
      delete raw.cults;
      delete runtime.cults;
    } else {
      raw.cults =
        kind === 'null'
          ? null
          : kind === 'object'
            ? {}
            : [{ id: 'unearned-cult' }];
      runtime.cults = raw.cults;
    }
    expect(() => decodeWorld(JSON.stringify(raw))).toThrow();
    expect(() => validateWorld(runtime)).toThrow();
  },
);

test('live cult finances, witnesses, deadlines and pending results survive snapshots, archive transfer and a Time Machine branch', async () => {
  const source = database(),
    destination = database(),
    repository = new SaveRepository(source.driver),
    imported = new SaveRepository(destination.driver);
  try {
    await repository.initialise();
    await imported.initialise();
    const before = cultPeriod(
      foundCult(undefined, { doctrines: ['moon-lessons', 'public-answers'] }),
    );
    await repository.create(before);
    const claimed = resolveCommand(before, {
      type: 'cult-claim',
      cultId: before.cults[0].id,
      claim: 'green-moon',
      approach: 'double-down',
    });
    await repository.commit(claimed, before.revision, 'claim-green-moon', true);
    const point = (await repository.snapshot(claimed.id, claimed.revision))[0];
    if (claimed.pending?.kind !== 'result')
      throw new Error('Expected the saved claim result');
    const future = resolveCommand(claimed, {
      type: 'acknowledge',
      resultId: claimed.pending.id,
    });
    await repository.commit(future, claimed.revision, 'acknowledge-claim');
    const archive = await repository.export(future.id),
      contents = decodeSave(archive);
    expect(contents.world).toEqual(future);
    expect(contents.world.cults[0].book.length).toBeGreaterThan(1);
    expect(
      contents.world.cults[0].threads[0].participantIds.length,
    ).toBeGreaterThan(0);
    expect(
      unpackCheckpoint(
        contents.snapshots.find((row) => row.summary.id === point.id)!.payload,
        true,
      ),
    ).toEqual(claimed);
    expect(await imported.import(archive)).toEqual(future);
    expect(await imported.snapshots(future.id)).toEqual(
      await repository.snapshots(future.id),
    );

    const branch = await imported.restoreBranch(
      future.id,
      point.id,
      future.revision,
      'life_cult_history_branch',
      'restore-cult-claim',
    );
    expect(branch).toEqual({ ...claimed, id: branch.id });
    expect(branch.cults).toEqual(claimed.cults);
    const cult = branch.cults[0];
    expect(cult.founderId).toBe(branch.activePersonId);
    expect(cult.leaderId).toBe(branch.activePersonId);
    for (const member of cult.members)
      expect(branch.people[member.personId]).toEqual(
        claimed.people[member.personId],
      );
    for (const thread of cult.threads)
      for (const personId of thread.participantIds)
        expect(branch.people[personId]).toBeDefined();
    expect(branch.random).toEqual(claimed.random);
    expect(await imported.load(future.id)).toEqual(future);
    expect(
      await imported.restoreBranch(
        future.id,
        point.id,
        future.revision,
        'unused-duplicate',
        'restore-cult-claim',
      ),
    ).toEqual(branch);
    expect(decodeSave(await imported.export(branch.id)).world).toEqual(branch);
    expect(await imported.branch(branch.id)).toMatchObject({
      sourceLifeId: future.id,
      snapshotId: point.id,
      personId: cult.founderId,
    });
    expect(
      (await imported.snapshots(branch.id)).every(
        (row) => row.revision <= claimed.revision,
      ),
    ).toBe(true);
    const cold = new SaveRepository(destination.driver);
    await cold.initialise();
    expect(await cold.active()).toEqual(branch);
    expect(await cold.recoveryPreview(branch.id)).toEqual(branch);
  } finally {
    source.sqlite.close();
    destination.sqlite.close();
  }
});

test.each([24, 25, 26, 27])(
  'reader%s →28 is metadata only, rolls back a failed marker and preserves every original payload across all eight populated tables',
  async (reader) => {
    const { sqlite, driver } = database(),
      repository = new SaveRepository(driver);
    try {
      await repository.initialise();
      const before = savedMiniGame();
      await repository.create(before);
      const point = (await repository.snapshot(before.id, before.revision))[0];
      await repository.restoreBranch(
        before.id,
        point.id,
        before.revision,
        'life_cult_migration_branch',
        'old-restore',
      );
      const paused = resolveCommand(before, {
        type: 'mini-game-pause',
        sessionId: before.miniGames[0].id,
        elapsedMs: 1700,
      });
      await repository.commit(paused, before.revision, 'old-pause');
      await repository.select(before.id);
      // Arrange only the old envelope and its matching size metadata. Every
      // person, command receipt, snapshot and branch came from ordinary APIs.
      for (const table of ['lives', 'backups', 'snapshots']) {
        for (const row of sqlite
          .prepare('SELECT rowid,payload FROM ' + table)
          .all()) {
          const payload = world44(
            unpackCheckpoint(row.payload as string, true),
          );
          sqlite
            .prepare('UPDATE ' + table + ' SET payload=? WHERE rowid=?')
            .run(payload, row.rowid!);
        }
      }
      for (const row of sqlite
        .prepare('SELECT life_id,snapshot_id,metadata FROM snapshot_metadata')
        .all()) {
        const payload = sqlite
          .prepare(
            'SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?',
          )
          .get(row.life_id!, row.snapshot_id!)!.payload as string;
        const metadata = {
          ...JSON.parse(row.metadata as string),
          size: payload.length,
        };
        sqlite
          .prepare(
            'UPDATE snapshot_metadata SET metadata=? WHERE life_id=? AND snapshot_id=?',
          )
          .run(JSON.stringify(metadata), row.life_id!, row.snapshot_id!);
      }
      sqlite.exec('PRAGMA user_version=' + reader);
      const rows = () =>
        Object.fromEntries(
          sqlite
            .prepare(
              "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
            )
            .all()
            .map((row) => [
              row.name,
              sqlite
                .prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2')
                .all(),
            ]),
        );
      const original = rows();
      expect(Object.keys(original)).toHaveLength(8);
      for (const table of Object.keys(original)) {
        expect(original[table].length).toBeGreaterThan(0);
        for (const action of ['INSERT', 'UPDATE', 'DELETE'])
          sqlite.exec(
            'CREATE TRIGGER deny_cult_' +
              table +
              '_' +
              action +
              ' BEFORE ' +
              action +
              ' ON ' +
              table +
              " BEGIN SELECT RAISE(ABORT,'unexpected row rewrite'); END",
          );
      }
      const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
      const failing: SqlDatabase = {
        ...driver,
        transaction: (action) =>
          driver.transaction((tx) =>
            action({
              ...tx,
              run: async (sql, values) => {
                await tx.run(sql, values);
                if (sql === 'PRAGMA user_version = 28')
                  throw new Error('interrupted cult reader marker');
              },
            }),
          ),
      };
      await expect(new SaveRepository(failing).initialise()).rejects.toThrow(
        'interrupted cult reader marker',
      );
      expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(
        reader,
      );
      expect(rows()).toEqual(original);
      expect(unpack).not.toHaveBeenCalled();
      const cold = new SaveRepository(driver);
      await cold.initialise();
      expect(unpack).not.toHaveBeenCalled();
      expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(
        28,
      );
      expect(rows()).toEqual(original);
      expect(await cold.active()).toEqual(paused);
      expect(await cold.recoveryPreview(before.id)).toEqual(before);
      expect(
        unpackCheckpoint(
          decodeSave(await cold.export(before.id)).snapshots.find(
            (row) => row.summary.id === point.id,
          )!.payload,
        ),
      ).toEqual(before);
      expect(rows()).toEqual(original);
      const current: SqlDatabase = {
        ...driver,
        transaction: async () => {
          throw new Error('current reader must not migrate again');
        },
      };
      await new SaveRepository(current).initialise();
      expect(rows()).toEqual(original);
    } finally {
      jest.restoreAllMocks();
      sqlite.close();
    }
  },
);

test('an interrupted Age Up commits cult accrual once after a failed write, lost acknowledgement and cold retry', async () => {
  const { sqlite, driver } = database(),
    repository = new SaveRepository(driver);
  try {
    await repository.initialise();
    const before = foundCult(),
      advance = { type: 'advance' as const },
      interrupted = resolveCommand(before, advance);
    expect(interrupted.pending).not.toBeNull();
    expect(interrupted.annual!.monthsProcessed).toBeGreaterThan(0);
    expect(interrupted.annual!.monthsProcessed).toBeLessThan(12);
    expect(interrupted.cults[0].monthsActive).toBe(
      interrupted.annual!.monthsProcessed,
    );
    await repository.create(before);
    const dependencies = {
        repository: async () => repository,
        date: () => before.date,
        id: () => 'unused-cult-save-id',
      },
      store = createGameStore(dependencies);
    await store.getState().bootstrap();
    const rows = () =>
      Object.fromEntries(
        sqlite
          .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
          )
          .all()
          .map((row) => [
            row.name,
            sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all(),
          ]),
      );
    const original = rows();
    sqlite.exec(
      "CREATE TRIGGER fail_cult_year BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'cult save failure'); END",
    );
    expect(await store.getState().dispatch(advance)).toBe(false);
    expect(store.getState().world).toEqual(before);
    expect(rows()).toEqual(original);
    sqlite.exec('DROP TRIGGER fail_cult_year');

    const commit = repository.commit.bind(repository);
    let loseAcknowledgement = true;
    jest.spyOn(repository, 'commit').mockImplementation(async (...args) => {
      const saved = await commit(...args);
      if (loseAcknowledgement) {
        loseAcknowledgement = false;
        throw new Error('lost cult commit acknowledgement');
      }
      return saved;
    });
    expect(await store.getState().dispatch(advance)).toBe(false);
    expect(store.getState().world).toEqual(before);
    expect(await repository.load(before.id)).toEqual(interrupted);
    const committed = rows();
    expect(await store.getState().dispatch(advance)).toBe(true);
    expect(store.getState().world).toEqual(interrupted);
    expect(rows()).toEqual(committed);
    expect(committed.receipts).toHaveLength(1);
    expect(await repository.recoveryPreview(before.id)).toEqual(before);

    const coldRepository = new SaveRepository(driver);
    await coldRepository.initialise();
    const cold = createGameStore({
      ...dependencies,
      repository: async () => coldRepository,
    });
    await cold.getState().bootstrap();
    expect(cold.getState().world).toEqual(interrupted);
    const sameMonth = decodeWorld(encodeWorld(cold.getState().world!)),
      sameBytes = encodeWorld(sameMonth);
    cultMonth(sameMonth);
    expect(encodeWorld(sameMonth)).toBe(sameBytes);
    const event = interrupted.pending!;
    const command =
      event.kind === 'result'
        ? { type: 'acknowledge' as const, resultId: event.id }
        : {
            type: 'choose' as const,
            eventId: event.id,
            choiceId: event.choices.find(
              (row) => !choiceUnavailable(interrupted, row),
            )!.id,
          };
    const continued = resolveCommand(interrupted, command);
    expect(await cold.getState().dispatch(command)).toBe(true);
    expect(cold.getState().world).toEqual(continued);
    const settled = rows();
    expect(await cold.getState().dispatch(command)).toBe(false);
    expect(rows()).toEqual(settled);
    expect(cold.getState().world!.cults[0]).toEqual(continued.cults[0]);
    expect(
      new Set(continued.cults[0].months.map((row) => row.month)).size,
    ).toBe(continued.cults[0].months.length);
  } finally {
    jest.restoreAllMocks();
    sqlite.close();
  }
});
