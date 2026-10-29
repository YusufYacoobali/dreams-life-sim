import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { addCondition, consultationCost, emergencyCare, healthFinanceMonth, hospitalized, medicalQuote, providerFor } from '../../src/game/systems/health';
import { activeSentence, isConfined, legalMonth } from '../../src/game/systems/legal';
import { monthFrom } from '../../src/game/calendar';
import { accountFor } from '../../src/game/systems/common';
import { rules } from '../../src/game/rules';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import graduate from '../fixtures/v3-employed-graduate.json';

function acknowledge(world: World) {
  if (world.pending?.kind !== 'result') throw new Error('Expected result');
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
}
function choose(world: World, choiceId: string) {
  if (world.pending?.kind !== 'decision') throw new Error('Expected decision');
  return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId });
}
function admittedDoctor() {
  const world = acknowledge(resolveCommand(decodeWorld(JSON.stringify(graduate)), { type: 'consult', service: 'checkup' }));
  const patient = world.people[world.activePersonId], doctorId = patient.health.providerId!, doctor = world.people[doctorId];
  const condition = addCondition(world, doctor, 'asthma', 80);
  emergencyCare(world, doctor.id, condition.id, true);
  expect(hospitalized(world, doctor)).toBe(true);
  expect(doctor.health.records.at(-1)?.kind).toBe('hospital');
  return { world: validateWorld(world), doctorId, substituteId: doctor.health.providerId! };
}
function arrest(initial: World) {
  // Fixed configured legal scenarios, not a birth-to-custody acceptance run.
  for (let seed = 1; seed < 100; seed++) {
    const candidate = validateWorld(initial); candidate.random.outcomes = seed;
    const world = resolveCommand(candidate, { type: 'crime', offence: 'vandalism' });
    if (world.pending?.kind === 'decision' && world.pending.templateId === 'arrest') return world;
  }
  throw new Error('No configured arrest seed');
}
function imprisoned(initial = decodeWorld(JSON.stringify(graduate))) {
  let world = acknowledge(choose(arrest(initial), 'remand'));
  world = resolveCommand(world, { type: 'advance' });
  expect(world.pending).toMatchObject({ kind: 'decision', templateId: 'court-hearing' });
  world = acknowledge(choose(world, 'guilty'));
  return acknowledge(resolveCommand(world, { type: 'prison-routine', routine: { work: true, study: true, exercise: true, conduct: 'quiet' } }));
}
function admittedPrisoner() {
  const world = imprisoned(), person = world.people[world.activePersonId], condition = addCondition(world, person, 'asthma', 80);
  emergencyCare(world, person.id, condition.id, true);
  expect(person.health.records.at(-1)?.cost).toBe(0n);
  expect(hospitalized(world, person)).toBe(true);
  const provider = world.people[person.health.providerId!];
  expect(provider.employment?.roleId).toBe('doctor');
  expect(isConfined(world, provider)).toBe(false);
  return validateWorld(world);
}

async function saved(initial: World) {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-health-legal-')), path = join(directory, 'dreams.db');
  let sqlite: DatabaseSync, store: ReturnType<typeof createGameStore>;
  function connect(): SqlDatabase {
    const connection = sqlite = new DatabaseSync(path); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => {
      connection.exec('BEGIN IMMEDIATE');
      try { const value = await action(session); connection.exec('COMMIT'); return value; }
      catch (error) { connection.exec('ROLLBACK'); throw error; }
    } };
  }
  const repository = new SaveRepository(connect()); await repository.initialise(); await repository.create(initial);
  const bootstrap = async (repo: SaveRepository) => {
    store = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused', yieldToUI: async () => {} });
    expect(await store.getState().bootstrap()).toBe(true);
  };
  await bootstrap(repository);
  return {
    get sqlite() { return sqlite; }, get store() { return store; },
    rows: () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])),
    cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); },
    close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}

test('a cached admitted doctor is replaced by the existing available qualified clinician, with old care receipts and quotes intact', () => {
  const { world, doctorId, substituteId } = admittedDoctor(), patient = world.people[world.activePersonId];
  const oldRecords = structuredClone(patient.health.records), doctor = world.people[doctorId], beforeCash = accountFor(world, doctor).cash;
  const substitute = world.people[substituteId], substituteCash = accountFor(world, substitute).cash, fee = consultationCost(world, 'tests'), raw = encodeWorld(world);
  expect(medicalQuote(world, fee).amount).toBe(fee); expect(encodeWorld(world)).toBe(raw);
  const next = resolveCommand(world, { type: 'consult', service: 'tests' });
  expect(next.people[next.activePersonId].health.providerId).toBe(substituteId);
  expect(next.people[substituteId].employment?.roleId).toBe('doctor');
  expect(next.people[substituteId].education.qualifications.some(item => item.level === 'medicine')).toBe(true);
  expect(next.people[next.activePersonId].health.records.slice(0, oldRecords.length)).toEqual(oldRecords);
  expect(next.people[next.activePersonId].health.records.at(-1)).toMatchObject({ providerId: substituteId, cost: fee, paidMinor: fee });
  expect(accountFor(next, next.people[doctorId]).cash).toBe(beforeCash);
  expect(accountFor(next, next.people[substituteId]).cash - substituteCash).toBe(fee);
  expect(next.people[doctorId].health).toEqual(doctor.health);
  expect(next.random).toEqual(world.random); // Existing clinician, and no symptoms need a diagnostic draw.
  expect(decodeWorld(encodeWorld(next))).toEqual(next);
});

test('the uncached provider search also skips the real hospital patient without creating another clinician or drawing randomness', () => {
  const { world, doctorId, substituteId } = admittedDoctor();
  const other = Object.values(world.people).find(person => person.id !== world.activePersonId && person.id !== doctorId && person.id !== substituteId && !person.died && person.country === world.people[world.activePersonId].country && person.city === world.people[world.activePersonId].city && !person.health.providerId)!;
  expect(other).toBeDefined();
  const people = Object.keys(world.people), random = { ...world.random }, records = structuredClone(world.people[doctorId].health.records);
  expect(providerFor(world, other).id).toBe(substituteId);
  expect(Object.keys(world.people)).toEqual(people); expect(world.random).toEqual(random);
  expect(world.people[doctorId].health.records).toEqual(records);
});

test('a real former clinician who escapes custody stays in old care history without becoming the next available doctor', () => {
  let world = acknowledge(resolveCommand(decodeWorld(JSON.stringify(graduate)), { type: 'consult', service: 'checkup' }));
  const patientId = world.activePersonId, doctorId = world.people[patientId].health.providerId!, history = structuredClone(world.people[patientId].health.records);
  // Select an existing recorded person to configure the legal scenario; the
  // offence, conviction and escape themselves use production commands.
  world.activePersonId = doctorId;
  world = imprisoned(world);
  let escaped: World | undefined;
  for (let seed = 1; seed < 200; seed++) {
    const candidate = validateWorld(world); candidate.random.outcomes = seed;
    const next = resolveCommand(candidate, { type: 'escape' });
    if (next.people[doctorId].legal.wanted) { escaped = acknowledge(next); break; }
  }
  expect(escaped).toBeDefined();
  world = escaped!; expect(world.people[doctorId].employment).toBeNull(); expect(world.people[doctorId].legal.wanted).toBe(true);
  world.activePersonId = patientId;
  const next = resolveCommand(world, { type: 'consult', service: 'tests' });
  expect(next.people[patientId].health.providerId).not.toBe(doctorId);
  expect(next.people[patientId].health.records.slice(0, history.length)).toEqual(history);
  expect(next.people[doctorId].legal.wanted).toBe(true);
});

test('two actual hospital periods pause prison work and study but still count toward the same release date', () => {
  const initial = admittedPrisoner(), beforeSentence = activeSentence(initial)!, records = structuredClone(initial.people[initial.activePersonId].health.records);
  const result = resolveCommand(initial, { type: 'resume' }), sentence = result.sentences.find(item => item.id === beforeSentence.id)!;
  expect(result.date).toEqual({ year: 2023, month: 5, day: 1 });
  expect(result.pending).toMatchObject({ kind: 'result', title: 'Released from custody' });
  expect(sentence).toMatchObject({ state: 'released', servedMonths: 3, creditedMonths: 1, totalMonths: 4, studyMonths: 1, behavior: 59 });
  const pay = result.ledger.filter(item => item.personId === initial.activePersonId && item.category === 'prison-pay');
  expect(pay).toHaveLength(1); expect(pay[0]).toMatchObject({ year: 2023, month: 5, cashDelta: rules.US.baseWage / 2400n });
  expect(result.people[result.activePersonId].health.hospitalizedUntil).toBeNull();
  expect(result.people[result.activePersonId].health.records.slice(0, records.length)).toEqual(records);
  expect(decodeWorld(encodeWorld(result))).toEqual(result);
});

test('ordinary prison periods keep their actual work and study with no change to the sentence clock', () => {
  const initial = imprisoned(), result = resolveCommand(initial, { type: 'resume' });
  const sentence = result.sentences.find(item => item.personId === initial.activePersonId)!;
  expect(sentence).toMatchObject({ state: 'released', servedMonths: 3, creditedMonths: 1, totalMonths: 4, studyMonths: 3, behavior: 59 });
  expect(result.ledger.filter(item => item.personId === initial.activePersonId && item.category === 'prison-pay')).toHaveLength(3);
});

test('a newly critical illness interrupts prison activity immediately and resumes the saved sentence through both later hospital periods', () => {
  const initial = imprisoned(); addCondition(initial, initial.people[initial.activePersonId], 'asthma', 95);
  const interrupted = resolveCommand(initial, { type: 'resume' });
  expect(interrupted.date).toEqual({ year: 2023, month: 3, day: 1 });
  expect(interrupted.pending).toMatchObject({ kind: 'result', title: 'Rushed to Hospital' });
  expect(activeSentence(interrupted)!.studyMonths).toBe(0);
  const alreadyPaid = interrupted.ledger.filter(item => item.personId === initial.activePersonId && item.category === 'prison-pay');
  expect(alreadyPaid).toHaveLength(0);
  const care = interrupted;
  expect(hospitalized(care, care.people[care.activePersonId])).toBe(true);
  expect(care.people[care.activePersonId].health.records.at(-1)).toMatchObject({ kind: 'hospital', cost: 0n });
  const restored = decodeWorld(encodeWorld(care)); expect(restored.pending).toEqual(care.pending); expect(restored.random).toEqual(care.random);
  const result = acknowledge(restored);
  expect(result.date).toEqual({ year: 2023, month: 5, day: 1 });
  expect(result.pending).toMatchObject({ kind: 'result', title: 'Released from custody' });
  expect(result.sentences.find(item => item.personId === initial.activePersonId)).toMatchObject({ servedMonths: 3, creditedMonths: 1, studyMonths: 0 });
  expect(result.ledger.filter(item => item.personId === initial.activePersonId && item.category === 'prison-pay')).toEqual(alreadyPaid);
  expect(() => resolveCommand(result, { type: 'acknowledge', resultId: care.pending!.id })).toThrow();
});

test('the final hospital period remains unavailable to later legal processing after discharge, without awarding study or exercise', () => {
  const world = admittedPrisoner(), person = world.people[world.activePersonId], sentence = activeSentence(world)!;
  world.annual = null; // Isolate the actual monthly systems, without an interrupted-year cursor.
  world.date = monthFrom(world.date, 2);
  expect(hospitalized(world, person)).toBe(true);
  const fitness = person.stats.fitness, smarts = person.stats.smarts, study = sentence.studyMonths, ledger = world.ledger.length;
  const discharged = healthFinanceMonth(world);
  expect(discharged.has(person.id)).toBe(true); expect(hospitalized(world, person)).toBe(false);
  legalMonth(world, discharged);
  expect(sentence.studyMonths).toBe(study); expect(person.stats.fitness).toBe(fitness); expect(person.stats.smarts).toBe(smarts);
  expect(world.ledger.slice(ledger).some(item => item.personId === person.id && item.category === 'prison-pay')).toBe(false);
  const served = sentence.servedMonths; legalMonth(world, discharged); expect(sentence.servedMonths).toBe(served);
});

test('already-earned prison study and wages remain exact after saving and a later actual hospital admission', () => {
  const world = imprisoned();
  // One isolated production legal period establishes real earned activity before
  // the later hospital admission; the new hospital year uses the full resolver.
  world.annual = null; world.date = monthFrom(world.date, 1); legalMonth(world);
  expect(activeSentence(world)!.studyMonths).toBe(1);
  const before = encodeWorld(world), savedSentences = structuredClone(world.sentences), pay = world.ledger.filter(item => item.personId === world.activePersonId && item.category === 'prison-pay');
  expect(pay.length).toBeGreaterThan(0);
  const restored = decodeWorld(before);
  expect(encodeWorld(restored)).toBe(before); expect(restored.sentences).toEqual(savedSentences);
  expect(restored.ledger.filter(item => item.personId === world.activePersonId && item.category === 'prison-pay')).toEqual(pay);
  const patient = restored.people[restored.activePersonId], condition = addCondition(restored, patient, 'asthma', 80);
  emergencyCare(restored, patient.id, condition.id, true);
  expect(restored.sentences).toEqual(savedSentences);
  expect(restored.ledger.filter(item => item.personId === world.activePersonId && item.category === 'prison-pay')).toEqual(pay);
  const result = resolveCommand(restored, { type: 'advance' });
  expect(result.pending).toMatchObject({ kind: 'result', title: 'Released from custody' });
  expect(result.sentences.find(item => item.personId === world.activePersonId)).toMatchObject({ studyMonths: 1, servedMonths: 3, creditedMonths: 1 });
  expect(result.ledger.filter(item => item.personId === world.activePersonId && item.category === 'prison-pay')).toEqual(pay);
});

test.each(['consultation', 'prison-resume'] as const)('%s rolls back every table, retries warm without unpacking, and cold-resumes its exact outcome once', async kind => {
  const initial = kind === 'consultation' ? admittedDoctor().world : admittedPrisoner(), command: GameCommand = kind === 'consultation' ? { type: 'consult', service: 'tests' } : { type: 'resume' };
  const db = await saved(initial);
  try {
    const before = db.store.getState().world!, beforeRows = db.rows(), rawCurrent = db.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(before.id)!.payload;
    const expected = resolveCommand(before, command, true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    db.sqlite.exec("CREATE TRIGGER fail_health_legal BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    expect(await db.store.getState().dispatch(command)).toBe(false);
    expect(db.store.getState().error).toMatch(/couldn't be saved/);
    expect(db.store.getState().world).toEqual(before); expect(db.rows()).toEqual(beforeRows);
    db.sqlite.exec('DROP TRIGGER fail_health_legal');
    expect(await db.store.getState().dispatch(command)).toBe(true);
    expect(db.store.getState().world).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(db.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(before.id)!.payload).toBe(rawCurrent);
    const savedRows = db.rows(); await db.cold(); expect(db.store.getState().world).toEqual(expected); expect(db.rows()).toEqual(savedRows);
    expect(expected.pending?.kind).toBe('result'); const ack: GameCommand = { type: 'acknowledge', resultId: expected.pending!.id };
    expect(await db.store.getState().dispatch(ack)).toBe(true); const done = db.store.getState().world!;
    expect(done).toEqual(resolveCommand(expected, ack, true)); expect(done.ledger).toEqual(expected.ledger); expect(done.random).toEqual(expected.random);
    const doneRows = db.rows(); expect(await db.store.getState().dispatch(ack)).toBe(false); expect(db.store.getState().world).toEqual(done); expect(db.rows()).toEqual(doneRows);
  } finally { jest.restoreAllMocks(); db.close(); }
});
