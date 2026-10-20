import { ageOn, copyWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { platformContent } from '../../src/game/content/social';
import * as copy from '../../src/game/content/socialCriticism';
import { arrangedCriticismRoll, criticismPost, criticismProfile, finishCriticismScene, legacyCriticism } from '../support/criticismFixture';

afterEach(() => { jest.restoreAllMocks(); });

function legacyTextOnly(input: World, incidentId: string) {
  const world = copyWorld(input), incident = world.controversies.find(item => item.id === incidentId)!;
  Object.assign(incident, legacyCriticism);
  for (const event of [world.pending, ...world.deferred.map(item => item.event)]) if (event?.id === incidentId) Object.assign(event, legacyCriticism);
  return world;
}

test('three actual consecutive arranged teenage criticism posts vary only stored words, preserving every roll, fee, consequence, choice and result', () => {
  let world = criticismProfile(); const bodies: string[] = [], titles: string[] = [];
  expect(ageOn(world.people[world.activePersonId], world.date)).toBe(16);
  for (let index = 0; index < 3; index++) {
    const before = arrangedCriticismRoll(world), command = criticismPost(before), payload = encodeWorld(before);
    const legacy = jest.spyOn(copy, 'publicCriticismCopy').mockReturnValue(legacyCriticism), old = resolveCommand(before, command, true); legacy.mockRestore();
    const next = resolveCommand(before, command, true), incident = next.controversies.at(-1)!;
    expect(legacyTextOnly(next, incident.id)).toEqual(old); expect(encodeWorld(before)).toBe(payload); expect(next.random).toEqual(old.random);
    expect(next.pending?.kind === 'decision' && next.pending.templateId).toBe('public-controversy'); expect(next.pending!.id).toBe(incident.id); expect(next.pending!.body).toBe(incident.body);
    expect(incident.body).toContain('photo'); expect(incident.body).toContain('Photogram'); expect(incident.body).toContain('What will you do?'); expect(incident.body).not.toMatch(/laughed|asking what you meant/);
    const choice = { type: 'choose' as const, eventId: incident.id, choiceId: 'apologise' };
    const resolved = resolveCommand(next, choice, true), oldResolved = resolveCommand(old, choice, true);
    expect(legacyTextOnly(resolved, incident.id)).toEqual(oldResolved); expect(resolved.pending).toEqual(oldResolved.pending); expect(resolved.random).toEqual(next.random);
    bodies.push(incident.body); titles.push(incident.title); world = finishCriticismScene(resolved);
  }
  expect(new Set(bodies).size).toBe(3); expect(new Set(titles).size).toBe(3); expect(world.controversies).toHaveLength(3); expect(world.socialAccounts[0].totalPosts).toBe(3); expect(world.socialAccounts[0].status).toBe('suspended');
});

test.each([
  ['photogram', 'photo', 'photo'], ['lifelink', 'message', 'message'], ['videowave', 'video', 'video'], ['streamline', 'gaming', 'gaming post'],
] as const)('a new adult %s criticism uses the actual %s context without inventing media feedback', (platform, kind, subject) => {
  const before = arrangedCriticismRoll(criticismProfile(platform, true)), next = resolveCommand(before, criticismPost(before, kind), true), incident = next.controversies.at(-1)!;
  expect(incident.body).toContain(subject); expect(incident.body).toContain(platformContent[platform].name); expect(incident.body).toContain('How will you respond?'); expect(incident.body).not.toMatch(/laughed|watched|heard|read your caption/);
  expect(next.socialAccounts[0].posts[0]).toMatchObject({ kind, response: 'controversial', intent: 'authentic' });
});

test('the three observed US14 source post identities deterministically get distinct copy without recreating that natural life', () => {
  // Existing raw US C trace lines98/100/102; these pure inputs claim no new natural coverage.
  const texts = [65, 69, 71].map(number => copy.publicCriticismCopy('photogram', { id: 'social_person_player_photogram_post_' + number, kind: 'photo', liveMinutes: 0 }, 14));
  expect(new Set(texts.map(item => item.body)).size).toBe(3);
  expect(texts).toEqual([65, 69, 71].map(number => copy.publicCriticismCopy('photogram', { id: 'social_person_player_photogram_post_' + number, kind: 'photo', liveMinutes: 0 }, 14)));
});

test.each(['photo', 'message', 'video', 'travel', 'food', 'fitness', 'gaming', 'humour'] as const)('%s copy labels the stored kind without assuming its content', kind => {
  const post = Object.freeze({ id: 'context_post_1', kind, liveMinutes: 0 }); const words = copy.publicCriticismCopy('lifelink', post, 16);
  expect(words.body).toContain(kind); expect(words.body).toContain('LifeLink'); expect(post).toEqual({ id: 'context_post_1', kind, liveMinutes: 0 });
});

test('recorded live minutes identify an actual stream rather than invented video detail', () => {
  const words = copy.publicCriticismCopy('streamline', { id: 'stream_post_2', kind: 'gaming', liveMinutes: 60 }, 22);
  expect(words.body).toContain('live stream'); expect(words.body).toContain('Streamline'); expect(words.body).not.toContain('laughed');
});
