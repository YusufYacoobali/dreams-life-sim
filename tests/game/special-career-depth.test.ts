import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, strFromU8 } from 'fflate';
import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import { specialCareerTemplates } from '../../src/game/content/specialCareerStories';
import { specialCareerDepthTemplates } from '../../src/game/content/specialCareerDepthStories';
import { careerKinds } from '../../src/game/content/careers';
import type { EventTemplate } from '../../src/game/content/eventTypes';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { offerPending } from '../../src/game/pendingQueue';
import { lifeStoryAvailable, lifeStoryContexts } from '../../src/game/systems/lifeStoryContext';
import { decodeSave } from '../../src/persistence/archive';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { careerDepthWorld } from '../support/specialCareerDepth';
import actorArchive from '../fixtures/v12-career-archive.json';
import businessArchive from '../fixtures/v11-business-archive.json';
import studioArchive from '../fixtures/v15-studio-archive.json';
import schoolArchive from '../fixtures/v28-native-school-archive.json';

const scenes = specialCareerDepthTemplates;
const namedPaths = [...careerKinds, 'military', 'astronaut', 'royalty', 'youtuber', 'streamer', 'business'];
const sceneFor = (kind: string) => scenes.find(row => row.specialCareer === kind)!;
const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

test('fourteen distinct original situations give each actual path two dedicated scenes, beside one unchanged shared Creator scene', () => {
  expect(scenes).toHaveLength(14); expect(scenes.flatMap(row => row.choices)).toHaveLength(42);
  expect(eventTemplates).toHaveLength(268); expect(eventTemplates.flatMap(row => row.choices)).toHaveLength(804);
  for (const field of ['id', 'title', 'body'] as const) expect(new Set(eventTemplates.map(row => row[field])).size).toBe(268);
  for (const kind of namedPaths) expect([...specialCareerTemplates, ...scenes].filter(row => row.specialCareer === kind)).toHaveLength(2);
  expect(specialCareerTemplates.filter(row => row.specialCareer === 'creator')).toHaveLength(1);
  expect(scenes.filter(row => row.rarity === 'common')).toHaveLength(8); expect(scenes.filter(row => row.rarity === 'uncommon')).toHaveLength(6);
  for (const scene of scenes) {
    expect(scene).toMatchObject({ min: 18, max: 120, local: true }); expect(scene.choices).toHaveLength(3);
    expect(new Set(scene.choices.map(row => row.id)).size).toBe(3); expect(new Set(scene.choices.map(row => JSON.stringify(row.changes))).size).toBe(3);
    expect(scene.body.split(/\s+/).length).toBeGreaterThanOrEqual(15); expect(scene.body.split(/\s+/).length).toBeLessThanOrEqual(55);
    for (const choice of scene.choices) { expect(choice.journal).toMatch(/^I /); expect(Object.values(choice.changes).every(delta => delta !== 0 && Math.abs(delta!) <= 4)).toBe(true); }
  }
  const original = eventTemplates.slice(0, 250).map(({ id, title, body, choices }) => ({ id, title, body, choices: choices.map(({ id, label, title, result, journal }) => ({ id, label, title, result, journal })) }));
  // Preserve the C12 historical narrative golden by restoring ONLY this copied result.
  // Newly bound C13 scenes use neutral copy; existing saved choices are never rewritten.
  const cameraAway = original.find(row => row.id === 'first-camera-closeup')!.choices.find(choice => choice.id === 'away')!;
  expect(cameraAway.result).toBe('{parent} gets a photograph of the back of your head. You have already found something else to do.');
  cameraAway.result = '{parent} gets a photograph of your hair. You have already found something else to do.';
  expect(sha(JSON.stringify(original))).toBe('3bcaeee8d5d03b0710cf9a96d0dff6cb53b182f452bc8f52c9a85e5c26be6d01');
  // Raw archive pins complement the complete decoded pending/result proof below.
  expect(sha(readFileSync(join(__dirname, '../fixtures/v12-career-archive.json')))).toBe('665a7b3736518e9e9f4d7c4a2d12eb08e746ddc528baaa868eb02d5e903f8e34');
  expect(sha(readFileSync(join(__dirname, '../fixtures/v11-business-archive.json')))).toBe('9bae60094658f5526d88119df7080476ece326d917b6393c38f1dfe940c8002b');
  expect(sha(readFileSync(join(__dirname, '../fixtures/v15-studio-archive.json')))).toBe('86b36eeafdc1ecf2fc99313b2f95bdf3ce6e46c16d371cfc43d71ca1321e1ef9');
});

describe.each(['upper', 'lower'] as const)('%s explicitly arranged stat boundary', boundary => {
  test.each(scenes.map(scene => [scene.id, scene] as const))('%s binds actual context without draws and all three choices retain exact capped effects/cold result/once acknowledgement', (_id, scene) => {
    const initial = careerDepthWorld(scene), person = initial.people[initial.activePersonId];
    for (const key of new Set(scene.choices.flatMap(choice => Object.keys(choice.changes)))) {
      const stat = key as keyof typeof person.stats;
      person.stats[stat] = boundary === 'upper' ? 99 : 0;
    }
    expect(eligibleTemplates(initial)).toContain(scene);
    const before = encodeWorld(initial), event = bindEvent(initial, scene);
    expect(event.personIds).toEqual([person.id]); expect(encodeWorld(initial)).toBe(before);
    expect(event.choices.every(choice => choice.effects.every(effect => effect.kind === 'stat'))).toBe(true);
    for (const authored of scene.choices) {
      const input = decodeWorld(before); offerPending(input, event);
      const cold = unpackCheckpoint(packCheckpoint(input), true); expect(encodeWorld(cold)).toBe(encodeWorld(input));
      const command = { type: 'choose' as const, eventId: event.id, choiceId: authored.id }, selected = resolveCommand(cold, command, true);
      expect(encodeWorld(selected)).toBe(encodeWorld(resolveCommand(input, command, true)));
      expect(selected.pending).toMatchObject({ kind: 'result', title: authored.title, body: authored.result });
      if (selected.pending?.kind !== 'result') throw new Error('Expected saved consequence');
      expect(selected.pending.effects).toEqual(Object.entries(authored.changes).map(([key, requested], index) => {
        const stat = key as keyof typeof person.stats, from = person.stats[stat], to = Math.max(0, Math.min(100, from + requested!)), delta = to - from;
        expect(selected.people[person.id].stats[stat]).toBe(to);
        const benefit = stat === 'stress' ? -delta : delta;
        return { id: 'effect_' + index, label: stat[0].toUpperCase() + stat.slice(1), value: (delta >= 0 ? '+' : '') + delta + '%', tone: benefit > 0 ? 'positive' : benefit < 0 ? 'negative' : 'neutral' };
      }));
      // Only the selected person's actual capped stats, journal/result and normal
      // command revision differ. No career/media/company progress or money grant.
      for (const key of Object.keys(input) as (keyof World)[]) if (!['people', 'pending', 'journal', 'revision', 'pendingPriority'].includes(key)) expect(selected[key]).toEqual(input[key]);
      for (const [id, oldPerson] of Object.entries(input.people)) {
        if (id !== person.id) expect(selected.people[id]).toEqual(oldPerson);
        else { const { stats: _old, ...oldRest } = oldPerson, { stats: _next, ...nextRest } = selected.people[id]; expect(nextRest).toEqual(oldRest); }
      }
      expect(selected.journal.slice(0, input.journal.length)).toEqual(input.journal); expect(selected.journal.at(-1)?.text).toBe(authored.journal);
      const saved = unpackCheckpoint(packCheckpoint(selected), true); expect(encodeWorld(saved)).toBe(encodeWorld(selected));
      expect(() => resolveCommand(saved, command, true)).toThrow();
      const done = resolveCommand(saved, { type: 'acknowledge', resultId: saved.pending!.id }, true);
      expect(done.pending).toBeNull(); expect(done.people).toEqual(selected.people); expect(done.random).toEqual(selected.random);
      expect(() => resolveCommand(done, { type: 'acknowledge', resultId: saved.pending!.id }, true)).toThrow();
    }
    expect(encodeWorld(initial)).toBe(before);
  }, 30000);
});

test.each(['youtuber', 'streamer'] as const)('%s requires the exact owner/account/platform/status/studio/residence without changing the old generic Creator predicate', kind => {
  const scene = sceneFor(kind), initial = careerDepthWorld(scene), before = encodeWorld(initial);
  expect(lifeStoryAvailable(lifeStoryContexts(initial), scene)).toBe(true);
  for (const change of ['wrong-owner', 'wrong-account', 'wrong-platform', 'suspended', 'deleted', 'memorial', 'left', 'country', 'city'] as const) {
    const world = decodeWorld(before), studio = world.creatorStudios.find(row => row.personId === world.activePersonId && row.kind === kind)!, account = world.socialAccounts.find(row => row.id === studio.accountId)!;
    if (change === 'wrong-owner') account.ownerId = Object.keys(world.people).find(id => id !== world.activePersonId)!;
    if (change === 'wrong-account') studio.accountId = 'missing-account';
    if (change === 'wrong-platform') account.platform = 'photogram';
    if (change === 'suspended' || change === 'deleted' || change === 'memorial') account.status = change;
    if (change === 'left') studio.status = 'left';
    if (change === 'country') studio.country = studio.country === 'US' ? 'CA' : 'US';
    if (change === 'city') studio.city = 'Other recorded city';
    const context = lifeStoryContexts(world); expect(lifeStoryAvailable(context, scene)).toBe(false); expect(() => bindEvent(world, scene)).toThrow(/available life context/);
    if (change !== 'left' || world.creatorStudios.some(row => row.personId === world.activePersonId && row.status === 'active')) expect(context.specialCareers.has('creator')).toBe(true);
  }
  const other = careerDepthWorld(sceneFor(kind === 'streamer' ? 'youtuber' : 'streamer'));
  // YouTuber setup also retains its original Streamer; a genuine Streamer-only
  // record must never gain YouTuber scenes merely through the generic predicate.
  if (kind === 'youtuber') expect(eligibleTemplates(other)).not.toContain(scene);
  expect(encodeWorld(initial)).toBe(before);
});

test('an already-bound actual old decision and actual old result retain the exact saved text/IDs/choices through the current codec', () => {
  const oldDecision = schoolArchive.snapshots.find(row => row.summary.id === 'snapshot_r_32')!.payload;
  for (const payload of [oldDecision, actorArchive.checkpoint]) {
    const frame = JSON.parse(payload), raw = JSON.parse(strFromU8(gunzipSync(Buffer.from((frame.main ?? frame).data, 'base64'))));
    const migrated = unpackCheckpoint(payload), saved = unpackCheckpoint(packCheckpoint(migrated), true);
    expect(raw.pending).not.toBeNull(); expect(saved.pending).toEqual(raw.pending); expect(saved.deferred).toEqual(raw.deferred ?? []);
    expect(encodeWorld(saved)).toBe(encodeWorld(migrated));
  }
});

test('Business scenes require the actual local active owner and do not depend on wealth, staff or owner-operated status', () => {
  const scene = sceneFor('business'), initial = careerDepthWorld(scene), before = encodeWorld(initial);
  for (const change of ['owner', 'sold', 'failed', 'closed', 'country', 'city'] as const) {
    const world = decodeWorld(before), company = world.businesses.find(row => row.ownerId === world.activePersonId && row.status === 'active')!;
    if (change === 'owner') company.ownerId = Object.keys(world.people).find(id => id !== world.activePersonId)!;
    if (change === 'sold' || change === 'failed' || change === 'closed') company.status = change;
    if (change === 'country') company.country = company.country === 'US' ? 'CA' : 'US';
    if (change === 'city') company.city = 'Other recorded city';
    expect(eligibleTemplates(world)).not.toContain(scene); expect(() => bindEvent(world, scene)).toThrow(/available life context/);
  }
  expect(encodeWorld(initial)).toBe(before);
});

test.each(scenes.map(scene => [scene.id, scene] as const))('%s respects adult age, actual absence, five-year cooldown and active-path linkage', (_id, scene) => {
  const initial = careerDepthWorld(scene), before = encodeWorld(initial);
  for (const state of ['minor', 'hospital', 'wanted', 'dead', 'cooldown', 'unlinked'] as const) {
    const world = decodeWorld(before), person = world.people[world.activePersonId];
    if (state === 'minor') person.born = { ...world.date, year: world.date.year - 17 };
    if (state === 'hospital') person.health.hospitalizedUntil = world.date.year * 12 + world.date.month + 2;
    if (state === 'wanted') person.legal.wanted = true;
    if (state === 'dead') person.died = { ...world.date };
    if (state === 'cooldown') world.eventHistory.push({ templateId: scene.id, year: world.date.year - 4 });
    if (state === 'unlinked') {
      world.careers = []; world.serviceCareers = []; world.creatorStudios = []; world.businesses = []; world.royalHouses = [];
    }
    expect(eligibleTemplates(world)).not.toContain(scene);
    if (state === 'cooldown') { world.eventHistory.at(-1)!.year--; expect(eligibleTemplates(world)).toContain(scene); }
  }
});

test.each([['actor', actorArchive], ['business', businessArchive], ['studio', studioArchive]] as const)('%s genuine old archive retains its original bound current and stored checkpoint text and whole command result', (_kind, raw) => {
  const archive = decodeSave(JSON.stringify(raw));
  for (const original of [archive.world, ...archive.snapshots.map(row => unpackCheckpoint(row.payload))]) {
    const before = encodeWorld(original), saved = unpackCheckpoint(packCheckpoint(original), true);
    expect(encodeWorld(saved)).toBe(before); expect(saved.pending).toEqual(original.pending); expect(saved.deferred).toEqual(original.deferred);
    const event = original.pending;
    if (event?.kind === 'result') {
      const command = { type: 'acknowledge' as const, resultId: event.id };
      expect(encodeWorld(resolveCommand(saved, command, true))).toBe(encodeWorld(resolveCommand(original, command, true)));
    } else if (event?.kind === 'decision') for (const choice of event.choices) {
      const command = { type: 'choose' as const, eventId: event.id, choiceId: choice.id };
      expect(encodeWorld(resolveCommand(saved, command, true))).toBe(encodeWorld(resolveCommand(original, command, true)));
    }
    expect(encodeWorld(original)).toBe(before);
  }
});
