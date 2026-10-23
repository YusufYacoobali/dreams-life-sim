import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import type { EventTemplate } from '../../src/game/content/eventTypes';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { resolveCommand } from '../../src/game/engine';
import { copyWorld, decodeWorld, encodeWorld, moneyJSON } from '../../src/game/model';
import { offerPending } from '../../src/game/pendingQueue';
import type { Pending } from '../../src/game/runtime';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import fixture from '../fixtures/v47-deferred-writing-before.json';

type Decision = Extract<Pending, { kind: 'decision' }>;
type Record = { id: string; template: EventTemplate; worldKey: string; pending: Decision; inputSha256: string; outcomes: { choiceId: string; sha256: string }[] };
const raw = gunzipSync(Buffer.from(fixture.data, 'base64')).toString('utf8');
const baseline = JSON.parse(raw) as { worlds: { [key: string]: string }; records: Record[] };
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const copyKeys = new Set(['title', 'body', 'choices']);
const choiceCopyKeys = new Set(['label', 'title', 'result', 'journal']);
const omit = (value: object, keys: Set<string>) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.has(key)));
const actual = (id: string) => eventTemplates.find(template => template.id === id)!;

test('the 19 deferred scenes and all57 original outcomes are pinned to the genuine pre-edit source', () => {
  expect(fixture.producerCommit).toBe('73e9f48b7acc2d19485f0934916b152b3f7cfb9f');
  expect(Buffer.byteLength(raw)).toBe(fixture.bytes);
  expect(sha(raw)).toBe('dfa494f5ecdd943fee7636a4874a41d4601910a346b80a22e345454b73056ca3'); expect(fixture.sha256).toBe(sha(raw));
  expect(baseline.records).toHaveLength(19); expect(baseline.records.flatMap(row => row.outcomes)).toHaveLength(57);
  expect(new Set(baseline.records.map(row => row.id)).size).toBe(19);
  expect(Object.keys(baseline.worlds)).toHaveLength(2);
});

test.each(baseline.records)('$id changes only writing, and every new payoff keeps the original complete gameplay outcome', record => {
  const template = actual(record.id), world = decodeWorld(baseline.worlds[record.worldKey]), before = encodeWorld(world);
  expect(omit(template, copyKeys)).toEqual(omit(record.template, copyKeys));
  expect(template.title).not.toBe(record.template.title); expect(template.body).not.toBe(record.template.body);
  expect(template.choices.map(choice => choice.id)).toEqual(record.template.choices.map(choice => choice.id));
  expect(eligibleTemplates(world)).toContain(template);
  const event = bindEvent(world, template);
  expect(encodeWorld(world)).toBe(before);
  expect(event.personIds).toEqual(record.pending.personIds); expect(event.participants).toEqual(record.pending.participants);
  expect(JSON.stringify(event, moneyJSON)).not.toMatch(/\{(?:pet|friend|destination|condition)\}/);
  for (const key of ['resultTitle', 'resultBody', 'journal'] as const) expect(new Set(event.choices.map(choice => choice[key])).size).toBe(3);
  expect(template.choices.every(choice => choice.result.length <= 280)).toBe(true);
  for (const [index, choice] of event.choices.entries()) {
    const authored = template.choices[index], previous = record.template.choices[index];
    expect(omit(authored, choiceCopyKeys)).toEqual(omit(previous, choiceCopyKeys));
    for (const key of choiceCopyKeys) expect(authored[key as keyof typeof authored]).not.toBe(previous[key as keyof typeof previous]);
    expect(choice.effects).toEqual(record.pending.choices[index].effects);
    const offered = decodeWorld(before); offerPending(offered, event);
    expect(choiceUnavailable(offered, choice)).toBeUndefined();
    const restored = unpackCheckpoint(packCheckpoint(offered), true);
    expect(restored.pending).toEqual(event);
    const command = { type: 'choose' as const, eventId: event.id, choiceId: choice.id };
    const selected = resolveCommand(restored, command, true);
    expect(selected.pending).toMatchObject({ kind: 'result', title: choice.resultTitle, body: choice.resultBody });
    expect(selected.journal.at(-1)?.text).toBe(choice.journal); expect(selected.random).toEqual(offered.random);
    const normalized = copyWorld(selected);
    normalized.pending!.title = record.pending.choices[index].resultTitle;
    normalized.pending!.body = record.pending.choices[index].resultBody;
    normalized.journal.at(-1)!.text = record.pending.choices[index].journal!;
    expect(sha(encodeWorld(normalized))).toBe(record.outcomes[index].sha256);
    expect(encodeWorld(selected)).toBe(encodeWorld(resolveCommand(offered, command, true)));
    expect(() => resolveCommand(selected, command, true)).toThrow();
    const coldResult = unpackCheckpoint(packCheckpoint(selected), true);
    expect(coldResult.pending).toEqual(selected.pending);
    const done = resolveCommand(coldResult, { type: 'acknowledge', resultId: selected.pending!.id }, true);
    expect(done.pending).toBeNull(); expect(done.random).toEqual(selected.random);
  }
});

test.each(baseline.records)('$id retains already-saved original options, payoffs and journals through reload and every choice', record => {
  const world = decodeWorld(baseline.worlds[record.worldKey]); offerPending(world, record.pending);
  expect(sha(encodeWorld(world))).toBe(record.inputSha256);
  const cold = unpackCheckpoint(packCheckpoint(world), true);
  expect(cold.pending).toEqual(record.pending);
  for (const outcome of record.outcomes) {
    const choice = record.pending.choices.find(row => row.id === outcome.choiceId)!;
    const selected = resolveCommand(cold, { type: 'choose', eventId: record.pending.id, choiceId: outcome.choiceId }, true);
    expect(sha(encodeWorld(selected))).toBe(outcome.sha256);
    expect(selected.pending).toMatchObject({ title: choice.resultTitle, body: choice.resultBody });
    expect(selected.journal.at(-1)?.text).toBe(choice.journal);
    expect(unpackCheckpoint(packCheckpoint(selected), true)).toEqual(selected);
  }
});
