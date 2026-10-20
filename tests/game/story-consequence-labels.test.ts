import { bindEvent, eventTemplates } from '../../src/game/content/events';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, fullName } from '../../src/game/model';
import { offerPending } from '../../src/game/pendingQueue';
import { relationFor } from '../../src/game/systems/relationships';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { decodeSave } from '../../src/persistence/archive';
import { pupil } from '../support/pupil';
import archive from '../fixtures/v30-native-workplace-story-archive.json';

function schoolScene() {
  const world = pupil('US', 8), school = currentSchool(world)!;
  const peer = world.people[school.classmateIds[0]], teacher = world.people[school.currentTeacherId];
  const peerBond = relationFor(world, world.activePersonId, peer.id)!, teacherBond = relationFor(world, world.activePersonId, teacher.id)!;
  return { world, peer, teacher, peerBond, teacherBond };
}

test('two actual school bonds identify their different people and report capped gains alongside actual capped stats', () => {
  const { world, peer, teacher, peerBond, teacherBond } = schoolScene(), player = world.people[world.activePersonId];
  peerBond.strength = 99; teacherBond.strength = 100; player.stats.discipline = 99; player.stats.energy = 1;
  const event = bindEvent(world, eventTemplates.find(template => template.id === 'school-volcano-breach')!); offerPending(world, event);
  const original = encodeWorld(world), selected = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: 'clean' });
  expect(selected.pending?.kind === 'result' && selected.pending.effects).toEqual([
    { id: 'effect_0', label: 'Discipline', value: '+1%', tone: 'positive' },
    { id: 'effect_1', label: 'Energy', value: '-1%', tone: 'negative' },
    { id: 'effect_2', label: fullName(peer) + ' · relationship', value: '+1%', tone: 'positive' },
    { id: 'effect_3', label: fullName(teacher) + ' · relationship', value: '+0%', tone: 'neutral' },
  ]);
  expect(relationFor(selected, player.id, peer.id)?.strength).toBe(100); expect(relationFor(selected, player.id, teacher.id)?.strength).toBe(100);
  expect(selected.people[player.id].stats).toMatchObject({ discipline: 100, energy: 0 });
  expect(selected.random).toEqual(world.random); expect(selected.accounts).toEqual(world.accounts); expect(selected.ledger).toEqual(world.ledger);
  expect(Object.keys(selected.people)).toEqual(Object.keys(world.people)); expect(encodeWorld(world)).toBe(original);
  const cold = decodeWorld(encodeWorld(selected)); expect(cold).toEqual(selected);
  const done = resolveCommand(cold, { type: 'acknowledge', resultId: cold.pending!.id });
  expect(done.relationships).toEqual(selected.relationships); expect(done.people).toEqual(selected.people); expect(done.random).toEqual(selected.random);
});

test('a negative school choice names each actual bond and reports only the loss possible at its lower bound', () => {
  const { world, peer, teacher, peerBond, teacherBond } = schoolScene(); peerBond.strength = 1; teacherBond.strength = 0;
  const event = bindEvent(world, eventTemplates.find(template => template.id === 'school-volcano-breach')!); offerPending(world, event);
  const selected = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: 'sequel' });
  if (selected.pending?.kind !== 'result') throw new Error('Expected the saved school result');
  expect(selected.pending.effects.slice(-2)).toEqual([
    { id: 'effect_2', label: fullName(peer) + ' · relationship', value: '-1%', tone: 'negative' },
    { id: 'effect_3', label: fullName(teacher) + ' · relationship', value: '+0%', tone: 'neutral' },
  ]);
  expect(relationFor(selected, world.activePersonId, peer.id)?.strength).toBe(0); expect(relationFor(selected, world.activePersonId, teacher.id)?.strength).toBe(0);
});

test('quoted names and token-like text stay literal, with surnames distinguishing contacts who share a first name', () => {
  const { world, peer, teacher } = schoolScene(); peer.firstName = 'A$& "{teacher}"'; teacher.firstName = peer.firstName; peer.lastName = 'Peer'; teacher.lastName = 'Teacher';
  const event = bindEvent(world, eventTemplates.find(template => template.id === 'school-volcano-breach')!); offerPending(world, event);
  const selected = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: 'clean' });
  if (selected.pending?.kind !== 'result') throw new Error('Expected the saved school result');
  expect(selected.pending.effects.slice(-2).map(row => row.label)).toEqual(['A$& "{teacher}" Peer · relationship', 'A$& "{teacher}" Teacher · relationship']);
  expect(decodeWorld(encodeWorld(selected)).pending).toEqual(selected.pending);
});

test('the genuine old workplace result retains its already saved unnamed rows and copy through load and acknowledgement', () => {
  const raw = JSON.stringify(archive), original = decodeSave(raw).world;
  if (original.pending?.kind !== 'result') throw new Error('Expected the original archived result');
  expect(original.pending.title).toBe('The complete version'); expect(original.pending.effects.filter(row => row.label === 'Relationship')).toHaveLength(2);
  const saved = structuredClone(original.pending), cold = decodeWorld(encodeWorld(original));
  expect(cold.pending).toEqual(saved); expect(decodeSave(raw).world.pending).toEqual(saved);
  const done = resolveCommand(cold, { type: 'acknowledge', resultId: saved.id });
  expect(done.pending).toBeNull(); expect(done.relationships).toEqual(original.relationships); expect(done.people).toEqual(original.people); expect(done.random).toEqual(original.random);
  expect(JSON.stringify(archive)).toBe(raw); expect(original.pending).toEqual(saved);
});
