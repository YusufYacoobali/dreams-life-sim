import { createHash } from 'node:crypto';
import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import { eventWeight, weightedEvent } from '../../src/game/content/eventRarity';
import { rareAdultTemplates } from '../../src/game/content/rareAdultStories';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { offerPending } from '../../src/game/pendingQueue';
import { decodeSave } from '../../src/persistence/archive';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import graduate from '../fixtures/v3-employed-graduate.json';
import child from '../fixtures/v28-ordinary-hobby-archive.json';
import medical from '../fixtures/v8-medical-archive.json';

const scene = rareAdultTemplates[0];
test('one extremely rare original adult scene retains its original position/copy beside fourteen new career scenes', () => {
  expect(rareAdultTemplates).toHaveLength(1); expect(scene.id).toBe('adult-accidental-living-exhibit');
  expect(scene).toMatchObject({ min: 18, max: 120, local: true, rarity: 'extremely-rare' }); expect(eventWeight(scene)).toBe(1);
  expect(eventTemplates).toHaveLength(268); expect(eventTemplates.reduce((sum, row) => sum + row.choices.length, 0)).toBe(804);
  for (const field of ['id', 'title', 'body'] as const) expect(new Set(eventTemplates.map(row => row[field])).size).toBe(268);
  const original = eventTemplates.slice(0, 250).map(({ id, title, body, choices }) => ({ id, title, body, choices: choices.map(({ id, label, title, result, journal }) => ({ id, label, title, result, journal })) }));
  // Preserve the C12 historical narrative golden by restoring ONLY this copied result.
  // Newly bound C13 scenes use neutral copy; existing saved choices are never rewritten.
  const cameraAway = original.find(row => row.id === 'first-camera-closeup')!.choices.find(choice => choice.id === 'away')!;
  expect(cameraAway.result).toBe('{parent} gets a photograph of the back of your head. You have already found something else to do.');
  cameraAway.result = '{parent} gets a photograph of your hair. You have already found something else to do.';
  expect(createHash('sha256').update(JSON.stringify(original)).digest('hex')).toBe('3bcaeee8d5d03b0710cf9a96d0dff6cb53b182f452bc8f52c9a85e5c26be6d01');
  expect(eventTemplates[250]).toBe(scene); expect(scene.choices.map(row => row.id)).toEqual(['explain', 'pose', 'lecture']);
});

test('the extreme weight is available only to the actual eligible local adult pool and creates no read-time state or diagnosis', () => {
  const adult = decodeWorld(JSON.stringify(graduate)), original = encodeWorld(adult), eligible = eligibleTemplates(adult);
  expect(eligible).toContain(scene);
  // Explicit selector-boundary ticket, not a natural occurrence claim.
  expect(weightedEvent(eligible, total => total - 1)).toBe(scene);
  expect(encodeWorld(adult)).toBe(original);
  const young = decodeSave(JSON.stringify(child)).world;
  expect(eligibleTemplates(young)).not.toContain(scene);
  let hospitalized = decodeSave(JSON.stringify(medical)).world;
  if (hospitalized.pending?.kind !== 'decision') throw new Error('Expected genuine old medical emergency');
  hospitalized = resolveCommand(hospitalized, { type: 'choose', eventId: hospitalized.pending.id, choiceId: 'care' }, true);
  expect(hospitalized.people[hospitalized.activePersonId].health.hospitalizedUntil).not.toBeNull();
  expect(eligibleTemplates(hospitalized)).not.toContain(scene);
  expect(() => bindEvent(hospitalized, scene)).toThrow(/available life context/);
});

describe.each(['upper', 'lower'] as const)('%s declared stat-cap boundary', boundary => {
  test.each(scene.choices)('$id applies only modest actual capped stats and preserves its new bound decision/result through production cold and one acknowledgement', authored => {
    // This is an explicit new-scene domain test at the recorded graduate
    // context, with stat bounds configured only for cap verification. No
    // natural encounter, new country seed or native/SQLite story is claimed.
    const input = decodeWorld(JSON.stringify(graduate)), person = input.people[input.activePersonId];
    Object.assign(person.stats, boundary === 'upper' ? { happiness: 99, respect: 99, stress: 1, energy: 1 } : { happiness: 0, respect: 0, stress: 100, energy: 0 });
    validateWorld(input);
    const beforeBinding = encodeWorld(input), event = bindEvent(input, scene);
    expect(event.personIds).toEqual([input.activePersonId]); expect(encodeWorld(input)).toBe(beforeBinding);
    expect(event.choices.every(choice => choice.effects.every(effect => effect.kind === 'stat'))).toBe(true);
    offerPending(input, event); const original = encodeWorld(input), cold = unpackCheckpoint(packCheckpoint(input), true);
    expect(encodeWorld(cold)).toBe(original); expect(cold.pending).toEqual(event);
    const command = { type: 'choose' as const, eventId: event.id, choiceId: authored.id }, selected = resolveCommand(cold, command, true);
    expect(encodeWorld(selected)).toBe(encodeWorld(resolveCommand(input, command, true)));
    expect(selected.pending).toMatchObject({ kind: 'result', title: authored.title, body: authored.result });
    if (selected.pending?.kind !== 'result') throw new Error('Expected actual new scene result');
    for (const key of Object.keys(person.stats) as (keyof typeof person.stats)[]) expect(selected.people[person.id].stats[key]).toBe(Math.min(100, Math.max(0, person.stats[key] + (authored.changes[key] ?? 0))));
    const expectedRows = Object.entries(authored.changes).map(([stat, requested], index) => {
      const key = stat as keyof typeof person.stats, before = person.stats[key], after = Math.min(100, Math.max(0, before + requested!)), delta = after - before;
      expect(selected.people[person.id].stats[key]).toBe(after);
      const beneficial = key === 'stress' ? -delta : delta;
      return { id: 'effect_' + index, label: key[0].toUpperCase() + key.slice(1), value: (delta >= 0 ? '+' : '') + delta + '%', tone: beneficial > 0 ? 'positive' : beneficial < 0 ? 'negative' : 'neutral' };
    });
    expect(selected.pending.effects).toEqual(expectedRows);
    for (const field of ['accounts', 'ledger', 'assets', 'relationships', 'careers', 'serviceCareers', 'workHistory', 'creatorStudios', 'random'] as const) expect(selected[field]).toEqual(input[field]);
    expect(Object.keys(selected.people)).toEqual(Object.keys(input.people));
    for (const value of Object.values(input.people)) {
      if (value.id !== input.activePersonId) expect(selected.people[value.id]).toEqual(value);
      else { const { stats: _before, ...rest } = value, { stats: _after, ...next } = selected.people[value.id]; expect(next).toEqual(rest); }
    }
    expect(selected.journal.slice(0, input.journal.length)).toEqual(input.journal); expect(selected.journal.at(-1)?.text).toBe(authored.journal);
    const result = unpackCheckpoint(packCheckpoint(selected), true); expect(encodeWorld(result)).toBe(encodeWorld(selected));
    expect(() => resolveCommand(result, command, true)).toThrow();
    const done = resolveCommand(result, { type: 'acknowledge', resultId: result.pending!.id }, true);
    expect(done.pending).toBeNull(); expect(done.people).toEqual(result.people); expect(done.random).toEqual(result.random);
    expect(() => resolveCommand(done, { type: 'acknowledge', resultId: result.pending!.id }, true)).toThrow();
    expect(encodeWorld(input)).toBe(original);
  });
});
