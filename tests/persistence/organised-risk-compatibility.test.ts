import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { activeOrganisation } from '../../src/game/systems/organisedCrime';
import { legalMonth } from '../../src/game/systems/legal';
import { monthFrom } from '../../src/game/calendar';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { diskDatabase } from '../support/refinementSqlite';
import graduate from '../fixtures/v3-employed-graduate.json';

test('frozen pre-polish v2 assignments keep exact pending text, cases, rolls, money and later investigation outcomes', () => {
  const bytes = readFileSync(join(__dirname, '../fixtures/v2-polish-crime-risk-before.json.gz'));
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('21b3c305ac3f3a0b26c6bd46d6e3699feb1fa405f9d3879dafbf65e9e1d4838d');
  const archive = JSON.parse(gunzipSync(bytes).toString()) as { cases: { payload: string; followup: string }[] };
  expect(archive.cases).toHaveLength(3);
  for (const sample of archive.cases) {
    const world = decodeWorld(sample.payload);
    expect(world.incidents.at(-1)!.organisedMission?.rulesVersion).toBe(2);
    expect(encodeWorld(unpackCheckpoint(packCheckpoint(world)))).toBe(sample.payload);
    world.date = monthFrom(world.date, 6); legalMonth(world);
    expect(encodeWorld(world)).toBe(sample.followup);
  }
});
test('genuine archived v3 missions retain complete worlds and follow-up outcomes under the v4 policy', () => {
  const bytes = readFileSync(join(__dirname, '../fixtures/v2-final-crime-v3-before.json.gz'));
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('4a41dae479b531b2f2b22e1b719efa92e0d2a8ff2e7f8ccf31d338c0cc54dd53');
  const archive = JSON.parse(gunzipSync(bytes).toString()) as { sourceRevision: string; cases: { payload: string; followup: string }[] };
  expect(archive.sourceRevision).toBe('7231fbc64dca7c2960285f69caa38dc6d37ae372');
  expect(archive.cases).toHaveLength(9);
  for (const sample of archive.cases) {
    const world = decodeWorld(sample.payload);
    expect(world.incidents.at(-1)!.organisedMission?.rulesVersion).toBe(3);
    expect(encodeWorld(unpackCheckpoint(packCheckpoint(world)))).toBe(sample.payload);
    world.date = monthFrom(world.date, 6); legalMonth(world);
    expect(encodeWorld(world)).toBe(sample.followup);
  }
});
test('new v4 assignments reuse the original v3 random draws instead of drawing replacement detection or investigation rolls', () => {
  const archive = JSON.parse(gunzipSync(readFileSync(join(__dirname, '../fixtures/v2-final-crime-v3-before.json.gz'))).toString()) as { cases: { style: 'street-syndicate' | 'fraud-network' | 'smuggling-ring'; seed: number; payload: string }[] };
  for (const sample of archive.cases) {
    let input = decodeWorld(JSON.stringify(graduate)); input.people[input.activePersonId].stats.energy = 100;
    input = resolveCommand(input, { type: 'organised-join', style: sample.style }); input = resolveCommand(input, { type: 'acknowledge', resultId: input.pending!.id });
    input.random.outcomes = sample.seed * 104729 >>> 0;
    const next = resolveCommand(input, { type: 'organised-mission', gangId: activeOrganisation(input)!.id, mission: 'missing-envelope', approach: 'cautious' });
    const old = decodeWorld(sample.payload), oldIncident = old.incidents.at(-1)!, incident = next.incidents.at(-1)!;
    expect(incident.organisedMission?.rulesVersion).toBe(4);
    expect(incident).toMatchObject({ detectionRoll: oldIncident.detectionRoll, followupRoll: oldIncident.followupRoll, trialRoll: oldIncident.trialRoll, investigateMonth: oldIncident.investigateMonth });
    expect(next.random).toEqual(old.random);
  }
});
function reportedAssignment() {
  let joined = decodeWorld(JSON.stringify(graduate)); joined.people[joined.activePersonId].stats.energy = 100;
  joined = resolveCommand(joined, { type: 'organised-join', style: 'smuggling-ring' }); joined = resolveCommand(joined, { type: 'acknowledge', resultId: joined.pending!.id });
  for (let seed = 1; seed <= 512; seed++) {
    const input = structuredClone(joined); input.random.outcomes = seed * 104729 >>> 0;
    let next = resolveCommand(input, { type: 'organised-mission', gangId: activeOrganisation(input)!.id, mission: 'missing-envelope', approach: 'cautious' });
    const source = next.incidents.at(-1)!;
    if (source.organisedMission?.outcome === 'cargo-confiscation' && !source.caseId && source.followupRoll <= Math.round(source.evidence / 2)) {
      next = resolveCommand(next, { type: 'acknowledge', resultId: next.pending!.id }); return next;
    }
  }
  throw Error('No reported, later investigated seed');
}
test('a real v4 confiscation is a lead that can close without an arrest when its saved investigation roll finds insufficient evidence', () => {
  let joined = decodeWorld(JSON.stringify(graduate)); joined.people[joined.activePersonId].stats.energy = 100;
  joined = resolveCommand(joined, { type: 'organised-join', style: 'smuggling-ring' }); joined = resolveCommand(joined, { type: 'acknowledge', resultId: joined.pending!.id });
  for (let seed = 1; seed <= 512; seed++) {
    const input = structuredClone(joined); input.random.outcomes = seed * 104729 >>> 0;
    const next = resolveCommand(input, { type: 'organised-mission', gangId: activeOrganisation(input)!.id, mission: 'missing-envelope', approach: 'cautious' });
    const incident = next.incidents.at(-1)!;
    if (incident.organisedMission?.outcome !== 'cargo-confiscation' || incident.caseId || incident.followupRoll <= Math.round(incident.evidence / 2)) continue;
    expect(incident.evidence).toBeGreaterThanOrEqual(32);
    const snapshot = { evidence: incident.evidence, detectionRoll: incident.detectionRoll, followupRoll: incident.followupRoll, trialRoll: incident.trialRoll, riskBps: incident.riskBps };
    const loaded = unpackCheckpoint(packCheckpoint(next)); loaded.date = monthFrom(loaded.date, 6); legalMonth(loaded);
    expect(loaded.incidents.at(-1)).toMatchObject({ ...snapshot, stage: 'closed', caseId: null });
    expect(loaded.cases).toHaveLength(0);
    return;
  }
  throw Error('No reported lead with insufficient evidence');
});
test('a new reported assignment leaves evidence, then genuinely arrests through saved investigation with rollback, retry and cold reopening', async () => {
  const initial = reportedAssignment(), source = initial.incidents.at(-1)!, checkpoint = packCheckpoint(initial);
  expect(source.organisedMission?.rulesVersion).toBe(4); expect(source.evidence).toBeGreaterThanOrEqual(32); expect(source.stage).toBe('hidden');
  const folder = mkdtempSync(join(tmpdir(), 'dreams-crime-risk-')), file = join(folder, 'life.db');
  let { sqlite, driver } = diskDatabase(file), repository = new SaveRepository(driver);
  await repository.initialise(); await repository.create(initial);
  let store = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused' }); await store.getState().bootstrap();
  const cold = async () => { sqlite.close(); ({ sqlite, driver } = diskDatabase(file)); repository = new SaveRepository(driver); await repository.initialise(); store = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused' }); await store.getState().bootstrap(); };
  let failedArrest = false;
  try {
    for (let guard = 0; guard < 120 && !store.getState().world!.incidents.find(row => row.id === source.id)!.caseId; guard++) {
      const before = store.getState().world!, pending = before.pending;
      const command: GameCommand = pending?.kind === 'result' ? { type: 'acknowledge', resultId: pending.id } : pending?.kind === 'decision' ? { type: 'choose', eventId: pending.id, choiceId: pending.choices.find(choice => !choiceUnavailable(before, choice))!.id } : { type: before.annual ? 'resume' : 'advance' };
      const expected = resolveCommand(before, command, true), arrests = !!expected.incidents.find(row => row.id === source.id)!.caseId;
      if (arrests) {
        sqlite.exec("CREATE TRIGGER fail_report_arrest BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
        expect(await store.getState().dispatch(command)).toBe(false); expect(store.getState().world).toEqual(before); expect(await repository.load(initial.id)).toEqual(before);
        sqlite.exec('DROP TRIGGER fail_report_arrest'); failedArrest = true;
      }
      expect(await store.getState().dispatch(command)).toBe(true); expect(store.getState().world).toEqual(expected); await cold(); expect(store.getState().world).toEqual(expected);
    }
    expect(failedArrest).toBe(true);
    const final = store.getState().world!;
    expect(final.cases.filter(row => row.incidentId === source.id)).toHaveLength(1);
    expect(final.incidents.find(row => row.id === source.id)).toMatchObject({ evidence: source.evidence, detectionRoll: source.detectionRoll, followupRoll: source.followupRoll, trialRoll: source.trialRoll, riskBps: source.riskBps });
    const branch: World = unpackCheckpoint(checkpoint); expect(branch.incidents.at(-1)!.caseId).toBeNull(); expect(encodeWorld(branch)).toBe(encodeWorld(initial));
  } finally { sqlite.close(); rmSync(folder, { recursive: true, force: true }); }
});
