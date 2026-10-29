import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { terminalBiography } from '../../src/ui/terminalBiography';
import native from '../fixtures/v32-native-hourly-checkpoints.json';
import actor from '../fixtures/v12-career-archive.json';
import business from '../fixtures/v11-business-archive.json';
import service from '../fixtures/v16-service-archive.json';
import family from '../fixtures/v6-birth-result.json';
import newborn from '../fixtures/v1-newborn.json';

test('a genuine native interview answer adds one recorded decision even though its category is work; its result acknowledgement and effort save add none', () => {
  const before = unpackCheckpoint(native.checkpoints.interview.payload), hired = unpackCheckpoint(native.checkpoints.hired.payload), count = terminalBiography(before)!.recordedDecisions;
  expect(hired.journal.filter(row => row.personId === hired.activePersonId && row.category === 'event')).toHaveLength(before.journal.filter(row => row.personId === before.activePersonId && row.category === 'event').length);
  expect(hired.journal.at(-1)!.category).toBe('work'); expect(hired.journal.at(-1)!.id).toMatch(/_choice$/); expect(terminalBiography(hired)!.recordedDecisions).toBe(count + 1);
  const ready = resolveCommand(hired, { type: 'acknowledge', resultId: hired.pending!.id }, true), effort = ready.people[ready.activePersonId].employment!.effort === 'hard' ? 'balanced' : 'hard';
  const changed = resolveCommand(ready, { type: 'work-effort', effort }, true);
  expect(terminalBiography(ready)!.recordedDecisions).toBe(count + 1); expect(terminalBiography(changed)!.recordedDecisions).toBe(count + 1);
  expect(terminalBiography(resolveCommand(changed, { type: 'acknowledge', resultId: changed.pending!.id }, true))!.recordedDecisions).toBe(count + 1);
});

test.each([
  [actor, '1 completed career project, including 1 recorded award'],
  [business, '1 business founded'],
  [service, '1 completed service assignment'],
])('genuine retained accomplishment records supply bounded factual highlights', (fixture, expected) => {
  const world = decodeSave(JSON.stringify(fixture)).world, before = encodeWorld(world), summary = terminalBiography(world)!;
  expect(summary.accomplishments).toContain(expected); expect(summary.accomplishments.length).toBeLessThanOrEqual(2); expect(summary.text).not.toMatch(/legendary|millionaire|income|salary|wealthy/i); expect(encodeWorld(world)).toBe(before);
});

test('a child and an ancestor retain separate decision, qualification and employment scopes without inventing absent older history', () => {
  const world = decodeWorld(JSON.stringify(family)), childId = world.relationships.find(row => row.from === world.activePersonId && row.roles.includes('parent'))!.to, child = terminalBiography(world, childId)!, parent = terminalBiography(world)!;
  expect(child.personId).toBe(childId); expect(child.recordedDecisions).toBe(0); expect(child.careerTitle).toBe('No retained job record'); expect(child.accomplishments).toEqual([]); expect(parent.recordedDecisions).toBeGreaterThan(0); expect(parent.careerSentence).toBeTruthy();
  expect(child.text).not.toContain(parent.careerTitle); expect(child.scope).toContain('earlier unrecorded activity is not reconstructed'); expect(terminalBiography(world, 'unavailable_person')).toBeNull();
});

test('sparse migrated histories stay honest, and biography reads no account, estate, income ledger or offered-event history', () => {
  const world = decodeWorld(JSON.stringify(newborn)), expected = terminalBiography(world)!;
  expect(expected.recordedDecisions).toBe(0); expect(expected.careerTitle).toBe('No retained job record'); expect(expected.accomplishments).toEqual([]); expect(expected.text).not.toMatch(/never worked|unemployed|no achievements|earned/);
  const guarded: World = { ...world };
  Object.defineProperties(guarded, {
    accounts: { get() { throw Error('No account scan'); } },
    ledger: { get() { throw Error('No income reconstruction'); } },
    estates: { get() { throw Error('Estate calculation belongs to existing UI'); } },
    eventHistory: { get() { throw Error('An offered event is not an accepted choice'); } },
  });
  expect(terminalBiography(guarded)).toEqual(expected);
});
