import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { eventTemplates } from '../../src/game/content/events';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { ageOn, encodeWorld, type World } from '../../src/game/model';
import { decodeSave } from '../../src/persistence/archive';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { editorialJson } from '../support/editorialPolicy';
import family from '../fixtures/v19-family-trip-archive.json';
import hobbies from '../fixtures/v28-ordinary-hobby-archive.json';
import workplace from '../fixtures/v30-native-workplace-story-archive.json';
import home from '../fixtures/v4-property-offer.json';
import creator from '../fixtures/v15-studio-archive.json';

const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const scenarios = [
  ['family-trip', family], ['pet-hobbies', hobbies], ['workplace-friend', workplace], ['owned-home', home], ['creator-studio', creator],
] as const;
const contextKeys = ['workplace', 'friend', 'partner', 'child', 'home', 'pet', 'hobby', 'visited', 'specialCareer'] as const;

test.each(scenarios)('%s continues three actual years from its untouched recorded boundary, cold-resuming every decision and result', (name, fixture) => {
  // These are bounded genuine archived-context continuations. The historical
  // fixtures retain their documented original setup; no new world setup,
  // template binding, date/age/funds/people/outcome/RNG edit is performed here.
  const archive = decodeSave(JSON.stringify(fixture)), initial = archive.world;
  const originalSnapshots = structuredClone(archive.snapshots), originalPending = structuredClone(initial.pending), originalJournal = structuredClone(initial.journal);
  const original = encodeWorld(initial), initialRevision = initial.revision, commands: GameCommand[] = [], decisions: Record<string, unknown>[] = [], coldProofs: Record<string, unknown>[] = [];
  let world = initial, started = 0, completed = 0, ordinal = 0, socialPrepared = false;
  const cold = () => {
    const canonical = encodeWorld(world), payload = packCheckpoint(world);
    world = unpackCheckpoint(payload, true);
    expect(encodeWorld(world)).toBe(canonical);
    coldProofs.push({ revision: world.revision, worldSha256: sha(canonical), checkpointSha256: sha(payload), format: JSON.parse(payload).format });
  };
  const run = (command: GameCommand) => {
    const before = world;
    world = resolveCommand(world, command, true); commands.push(command);
    expect(world.revision).toBe(before.revision + 1);
    if (before.annual && !world.annual && JSON.stringify(world.date) === JSON.stringify(before.annual.targetDate)) completed++;
    return before;
  };
  cold(); expect(world.pending).toEqual(originalPending);
  for (let guard = 0; guard < 150 && !world.people[world.activePersonId].died; guard++) {
    const pending = world.pending;
    if (pending?.kind === 'decision') {
      cold();
      const event = world.pending;
      if (event?.kind !== 'decision') throw new Error('Lost saved decision');
      const eligible = event.choices.filter(choice => !choiceUnavailable(world, choice));
      expect(eligible.length).toBeGreaterThan(0);
      // Keep the already-owned home using ordinary offered refusal. Other
      // choices rotate only through their actual currently eligible order.
      const choice = name === 'owned-home' && event.templateId === 'property-sale-offer' ? eligible.find(row => row.id === 'decline')! : eligible[ordinal % eligible.length];
      const template = eventTemplates.find(row => row.id === event.templateId), before = world;
      const command: GameCommand = { type: 'choose', eventId: event.id, choiceId: choice.id };
      run(command); ordinal++;
      expect(encodeWorld(world)).toBe(encodeWorld(resolveCommand(before, command, true)));
      expect(() => resolveCommand(world, command, true)).toThrow();
      const result = [world.pending, ...world.deferred.map(row => row.event)].find(row => row?.id === event.id + '_result');
      if (template) {
        expect(ageOn(before.people[before.activePersonId], before.date)).toBeGreaterThanOrEqual(template.min);
        expect(ageOn(before.people[before.activePersonId], before.date)).toBeLessThanOrEqual(template.max);
        expect(event.personIds.every(id => !!before.people[id])).toBe(true);
        expect(template.choices.some(row => row.id === choice.id)).toBe(true);
        expect(result).toMatchObject({ kind: 'result', title: choice.resultTitle, body: choice.resultBody });
        // Free authored story choices cannot invent optional-context purchases,
        // receipts, qualifications, employment, people or extra random draws.
        if (choice.effects.every(effect => ['stat', 'relationship', 'pet-bond', 'skill', 'school-grade'].includes(effect.kind))) {
          for (const field of ['accounts', 'ledger', 'assets', 'hobbies', 'trips', 'workHistory', 'careers', 'creatorStudios', 'serviceCareers', 'random'] as const) expect(world[field]).toEqual(before[field]);
          expect(Object.keys(world.people)).toEqual(Object.keys(before.people));
          expect(world.people[world.activePersonId].education.qualifications).toEqual(before.people[before.activePersonId].education.qualifications);
          for (const effect of choice.effects) {
            const clamp = (value: number) => Math.max(0, Math.min(100, value));
            if (effect.kind === 'stat') expect(world.people[effect.personId].stats[effect.stat]).toBe(clamp(before.people[effect.personId].stats[effect.stat] + effect.delta));
            if (effect.kind === 'relationship') expect(world.relationships.find(row => row.id === effect.relationshipId)!.strength).toBe(clamp(before.relationships.find(row => row.id === effect.relationshipId)!.strength + effect.delta));
            if (effect.kind === 'pet-bond') expect(world.pets.find(row => row.id === effect.petId)!.bonds[effect.personId]).toBe(clamp((before.pets.find(row => row.id === effect.petId)!.bonds[effect.personId] ?? 0) + effect.delta));
          }
        }
      }
      decisions.push({ date: before.date, revision: before.revision, oldSavedDecision: event.id === originalPending?.id, event, selectedChoiceId: choice.id, boundBranch: event.choices.indexOf(choice) + 1, contexts: template ? contextKeys.filter(key => template[key]) : [], result, randomBefore: before.random, randomAfter: world.random });
      cold();
    } else if (pending?.kind === 'result') {
      cold(); const before = world, command: GameCommand = { type: 'acknowledge', resultId: pending.id };
      run(command); expect(() => resolveCommand(world, command, true)).toThrow();
      expect(encodeWorld(world)).toBe(encodeWorld(resolveCommand(before, command, true)));
    } else if (world.annual) run({ type: 'resume' });
    else {
      if (name === 'owned-home') {
        const listed = world.assets.find(row => row.ownerId === world.activePersonId && row.primaryHome && row.listing);
        if (listed) { run({ type: 'cancel-listing', assetId: listed.id }); continue; }
      }
      if (name === 'workplace-friend' && !socialPrepared) {
        socialPrepared = true;
        const contact = world.relationships.filter(row => row.from === world.activePersonId && row.roles.includes('coworker')).sort((a, b) => b.strength - a.strength)[0];
        expect(contact).toBeDefined();
        for (const action of ['talk', 'compliment', 'spend-time'] as const) {
          run({ type: 'interact', personId: contact.to, action });
          expect(world.pending?.kind).toBe('result'); cold();
          run({ type: 'acknowledge', resultId: world.pending!.id });
        }
      }
      if (started === 3) break;
      started++; run({ type: 'advance' });
    }
  }
  expect(started).toBe(3); expect(world.people[world.activePersonId].died).toBeNull();
  expect(world.pending).toBeNull(); expect(world.annual).toBeNull();
  expect(completed).toBe(initial.annual ? 4 : 3);
  expect(world.revision - initialRevision).toBe(commands.length);
  expect(world.journal.slice(0, originalJournal.length)).toEqual(originalJournal);
  expect(encodeWorld(initial)).toBe(original); expect(archive.snapshots).toEqual(originalSnapshots);
  cold();
  let replay = initial;
  for (const command of commands) replay = resolveCommand(replay, command, true);
  expect(encodeWorld(replay)).toBe(encodeWorld(world));
  const observedContexts = [...new Set(decisions.flatMap(row => row.oldSavedDecision ? [] : row.contexts as string[]))].sort();
  const summary = { scope: 'Bounded C36 pure-engine continuation of genuine archived contexts; not a natural birth policy, full-life SQLite, native or all-context acceptance', sourceBase: '1a90884119b2c4f8989d13f044f8e69101169b11', versions: [world.schemaVersion, world.engineVersion, world.contentVersion], name, initialRevision, finalRevision: world.revision, started, completedIncludingOriginalCursor: completed, commands, decisions, observedContexts, absentContexts: contextKeys.filter(key => !observedContexts.includes(key)), coldProofs, finalCanonicalSha256: sha(encodeWorld(world)), immutableInputSha256: sha(JSON.stringify(fixture)) };
  const output = process.env.DREAMS_C36_EDITORIAL_OUTPUT;
  if (output) { mkdirSync(output, { recursive: true }); writeFileSync(join(output, name + '.json'), editorialJson(summary) + '\n', { flag: 'wx' }); }
  console.info('C36_EDITORIAL_CONTEXT', JSON.stringify({ name, commands: commands.length, decisions: decisions.map(row => ({ id: (row.event as { templateId: string }).templateId, branch: row.boundBranch, contexts: row.contexts, old: row.oldSavedDecision })), observedContexts, absentContexts: summary.absentContexts, finalCanonicalSha256: summary.finalCanonicalSha256 }));
}, 30000);
