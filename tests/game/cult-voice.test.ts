import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import previous from '../fixtures/v48-cult-voice-before.json';
import original from '../fixtures/v48-cult-writing-before.json';
import { decodeWorld, encodeWorld, fullName, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { cultClaimAdmissions } from '../../src/game/content/cultClaimWriting';
import { cultLocalMembers } from '../../src/game/systems/cultActivities';
import { cultMoney } from '../../src/game/systems/cultCore';
import { arrangeCultWritingCase, cultWritingMechanics, preEpisodeCultProof, type CultWritingCase } from '../support/cultWriting';

const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const raw = inflateSync(Buffer.from(previous.data, 'base64')).toString();
const saved = JSON.parse(raw) as {
  producer: string;
  contexts: { id: string; world: unknown; outcomes: { choiceId: string; sha256: string }[] }[];
  savedRoutines: { kind: string; world: unknown; acknowledgedSha256: string }[];
  ordinaryCases: Exclude<CultWritingCase, { kind: 'member' }>[];
};
const base = JSON.parse(inflateSync(Buffer.from(original.data, 'base64')).toString()) as { baseWorld: unknown };
const load = (value: unknown) => decodeWorld(JSON.stringify(value));

test('the released voice fixture retains 18 bound offers, 72 choices and three saved routine results', () => {
  expect(sha(raw)).toBe(previous.sha256);
  expect(saved.producer).toBe('94c5020');
  expect(saved.contexts).toHaveLength(18);
  expect(saved.contexts.flatMap(row => row.outcomes)).toHaveLength(72);
  expect(saved.savedRoutines).toHaveLength(3);
  expect(saved.ordinaryCases).toHaveLength(19);
  for (const context of [...saved.contexts, ...saved.savedRoutines]) expect(context.world).toMatchObject({ schemaVersion: 48, engineVersion: 50, contentVersion: 27 });
});

test.each(saved.contexts)('$id retains every released bound payoff and whole-world outcome', context => {
  const world = load(context.world), encoded = encodeWorld(world), event = world.pending;
  if (event?.kind !== 'decision') throw Error('Expected a saved decision');
  for (const expected of context.outcomes) {
    const result = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: expected.choiceId });
    expect(sha(preEpisodeCultProof(result))).toBe(expected.sha256);
  }
  expect(encodeWorld(world)).toBe(encoded);
});

test.each(saved.savedRoutines)('$kind preserves its already saved routine scene through cold load and acknowledgement', context => {
  const world = load(context.world), encoded = encodeWorld(world), event = world.pending;
  expect(encodeWorld(decodeWorld(encoded))).toBe(encoded);
  if (event?.kind !== 'result') throw Error('Expected a saved result');
  expect(sha(preEpisodeCultProof(resolveCommand(world, { type: 'acknowledge', resultId: event.id })))).toBe(context.acknowledgedSha256);
});

test('claim admissions vary their openings while keeping the player in the scene', () => {
  const lines = Object.values(cultClaimAdmissions);
  expect(lines.filter(line => /^You admit\b/.test(line)).length).toBeLessThanOrEqual(2);
  expect(new Set(lines.map(line => line.toLowerCase().split(/\s+/).slice(0, 3).join(' '))).size).toBeGreaterThanOrEqual(16);
  for (const line of lines) {
    expect(line).toMatch(/\byou(?:r)?\b/i);
    expect(line.split(/\s+/).length).toBeLessThanOrEqual(55);
    expect(line).not.toMatch(/\{\w+\}/);
  }
});

test.each(saved.ordinaryCases)('ordinary $kind scene $method$philosophy$ceremony casts a present person and responds to their actual personality', item => {
  const bodies: string[] = [], states: unknown[] = [];
  for (const personality of ['earnest', 'practical', 'showy', 'sceptic', 'opportunist'] as const) {
    const world = load(base.baseWorld), cult = world.cults[0];
    const command = arrangeCultWritingCase(world, item);
    const role = item.kind === 'recruit' ? 'recruiter' : item.kind === 'ceremony' ? 'organiser' : item.philosophy === 'cosmic-accounting' ? 'treasurer' : 'adviser';
    const present = cultLocalMembers(world, cult);
    const member = present.find(row => row.role === role) ?? present[0];
    expect(member).toBeDefined(); member.personality = personality;
    const name = fullName(world.people[member.personId]), result = resolveCommand(world, command), body = result.pending!.body;
    expect(body).toContain(name);
    expect(body).not.toMatch(/\{\w+\}|new followers joined;|The event cost|voluntary contributions were/);
    const plain = JSON.parse(encodeWorld(result)) as World;
    // Only this declared input differs between the five commands. The writing
    // itself must not change their state, figures, identities or random draws.
    plain.cults[0].members.find(row => row.personId === member.personId)!.personality = 'earnest';
    states.push(cultWritingMechanics(plain)); bodies.push(body);
    if (item.kind === 'recruit') {
      const joined = result.cults[0].followers - cult.followers, fees = cult.joiningFee * BigInt(joined);
      expect(joined).toBeGreaterThan(0);
      expect(body.split(joined + ' new follower').length - 1).toBe(1);
      if (fees > 0n) expect(body.split(cultMoney(cult, fees)).length - 1).toBe(1);
    }
    if (command.type === 'cult-ceremony') {
      const proceeds = result.cults[0].cash - cult.cash + command.quotedCost;
      expect(body).toContain(cultMoney(cult, command.quotedCost));
      if (proceeds > 0n) expect(body).toContain(cultMoney(cult, proceeds));
    }
  }
  expect(new Set(bodies).size).toBeGreaterThanOrEqual(3);
  for (const state of states) expect(state).toEqual(states[0]);
});

test('a departed recruiter is not cast in a new recruitment scene', () => {
  const item = saved.ordinaryCases.find(row => row.kind === 'recruit')!;
  const world = load(base.baseWorld), cult = world.cults[0], command = arrangeCultWritingCase(world, item);
  const former = cult.members.find(row => row.role === 'recruiter') ?? cult.members[0];
  former.role = 'recruiter';
  former.status = 'left'; former.ended = world.date;
  const replacement = cultLocalMembers(world, cult)[0];
  const result = resolveCommand(world, command);
  expect(result.pending!.body).not.toContain(fullName(world.people[former.personId]));
  expect(result.pending!.body).toContain(fullName(world.people[replacement.personId]));
});

test('a group without a present named member uses an anonymous follower without generating a new person', () => {
  const item = saved.ordinaryCases.find(row => row.kind === 'preach')!;
  const world = load(base.baseWorld), cult = world.cults[0], command = arrangeCultWritingCase(world, item);
  for (const member of cult.members) { member.status = 'left'; member.ended = world.date; }
  const ids = Object.keys(world.people), result = resolveCommand(world, command);
  expect(result.pending!.body).toContain('A follower');
  expect(Object.keys(result.people)).toEqual(ids);
  expect(result.pending!.body).not.toMatch(/undefined|\{\w+\}/);
});
