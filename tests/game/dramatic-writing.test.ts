import { createHash } from 'node:crypto';
import { gunzipSync, strFromU8 } from 'fflate';
import { bindEvent } from '../../src/game/content/events';
import { dramaticTemplates } from '../../src/game/content/dramaticEvents';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import fixture from '../fixtures/writing-legacy-payoffs.json';

type Recorded = { templateId: string; payload: string; choices: { choiceId: string; title: string; body: string; journal: string }[] };
const raw = strFromU8(gunzipSync(Buffer.from(fixture.data, 'base64')));
const records: Recorded[] = JSON.parse(raw);
const branches = records.flatMap(record => record.choices.map(expected => ({ record, expected })));
const payoff = (world: World, eventId: string) => {
  const found = [world.pending, ...world.deferred.map(row => row.event)].find(row => row?.id === eventId + '_result');
  if (found?.kind !== 'result') throw new Error('Expected the saved dramatic result');
  return found;
};
function withoutPayoff(world: World, eventId: string) {
  const copy = JSON.parse(encodeWorld(world));
  const result = [copy.pending, ...copy.deferred.map((row: { event: { id: string } }) => row.event)].find(row => row?.id === eventId + '_result');
  result.title = '<payoff>'; result.body = '<payoff>';
  copy.journal.find((row: { id: string }) => row.id === eventId + '_choice').text = '<choice journal>';
  return copy;
}

test('the legacy reference contains actual unmodified da0b0e5 saves and 45 resolved payoffs', () => {
  expect(fixture.sourceCommit).toBe('da0b0e59cc11fc37b81eb0a20bcf5251e6eba5af');
  expect(createHash('sha256').update(raw).digest('hex')).toBe('64b536d28197efcf78b03da653ae972b99033cc063e1eedd86ad8607b54a1fd6');
  expect(records).toHaveLength(15); expect(branches).toHaveLength(45);
});

test.each(branches)('$record.templateId / $expected.choiceId preserves legacy wording and saved actors, allowing prospective names for new actors', ({ record, expected }) => {
  const world = decodeWorld(record.payload), event = world.pending;
  if (event?.kind !== 'decision') throw new Error('Expected the recorded old decision');
  expect(event.choices.every(choice => choice.effects.every(effect => !('copyVersion' in effect)))).toBe(true);
  const next = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: expected.choiceId });
  let { body, journal } = expected;
  if (record.templateId === 'dramatic-double-fiance' && expected.choiceId === 'dinner') {
    // This actor is created on choice, never bound into the recorded decision.
    // Preserve the original fixture and every word except their prospective name.
    const created = Object.values(next.people).filter(person => !world.people[person.id]);
    expect(created).toHaveLength(1);
    const person = created[0];
    body = body.replace('Alex Brooks', person.firstName + ' ' + person.lastName).replace('you and Alex exchange', 'you and ' + person.firstName + ' exchange');
    journal = journal.replace('Alex Brooks', person.firstName + ' ' + person.lastName).replace('you and Alex exchange', 'you and ' + person.firstName + ' exchange');
  }
  for (const person of Object.values(world.people)) {
    expect(next.people[person.id]).toMatchObject({ firstName: person.firstName, lastName: person.lastName });
  }
  expect(payoff(next, event.id)).toMatchObject({ title: expected.title, body });
  expect(next.journal.find(row => row.id === event.id + '_choice')?.text).toBe(journal);
  expect(next.journal.slice(0, world.journal.length)).toEqual(world.journal);
  expect(decodeWorld(encodeWorld(next))).toEqual(next);
});

test.each(branches)('$record.templateId / $expected.choiceId changes only the new payoff, with identical domain effects and draws', ({ record, expected }) => {
  const old = decodeWorld(record.payload), current = decodeWorld(record.payload), event = current.pending;
  if (event?.kind !== 'decision') throw new Error('Expected the recorded old decision');
  for (const choice of event.choices) for (const effect of choice.effects) if (effect.kind === 'dramatic-choice') effect.copyVersion = 25;
  validateWorld(current);
  const command = { type: 'choose' as const, eventId: event.id, choiceId: expected.choiceId };
  const before = encodeWorld(current), legacy = resolveCommand(old, command), next = resolveCommand(current, command);
  const result = payoff(next, event.id);
  expect(result.body).not.toBe(expected.body);
  expect(result.body).not.toMatch(/\{\w+\}|undefined/);
  expect(result.effects).toEqual(payoff(legacy, event.id).effects);
  expect(withoutPayoff(next, event.id)).toEqual(withoutPayoff(legacy, event.id));
  expect(next.random).toEqual(legacy.random);
  expect(encodeWorld(current)).toBe(before);
  expect(resolveCommand(unpackCheckpoint(packCheckpoint(current)), command)).toEqual(next);
  expect(decodeWorld(encodeWorld(next))).toEqual(next);
  expect(() => resolveCommand(next, command)).toThrow();
});

test.each(records)('$templateId newly binds the payoff revision without changing the original choice IDs or rules', record => {
  const world = decodeWorld(record.payload), original = world.pending;
  const event = bindEvent(world, dramaticTemplates.find(row => row.id === record.templateId)!);
  expect(event.choices.map(choice => choice.id)).toEqual(record.choices.map(choice => choice.choiceId));
  for (const choice of event.choices) expect(choice.effects).toEqual([expect.objectContaining({ kind: 'dramatic-choice', copyVersion: 25 })]);
  expect(world.pending).toEqual(original);
});
