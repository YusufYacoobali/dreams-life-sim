import type { World } from '../../src/game/model';
import { cultMonthNumber } from '../../src/game/systems/cultSchemas';
import { cultCeremonies, cultPhilosophies, cultRecruitment } from '../../src/game/content/cults';
import { cultCeremonyQuote, cultRecruitQuote, cultRewardQuote } from '../../src/game/systems/cultCore';
import type { GameCommand } from '../../src/game/engine';
import { fullName } from '../../src/game/model';
import { cultStories } from '../../src/game/content/cultStories';
import { cultClaims } from '../../src/game/content/cultClaims';
import { offerCultThread } from '../../src/game/systems/cultEvents';

/** Reuse a declared pre-rewrite context, but generate its offer today. */
export function refreshCultWritingOffer(world: World, id: string) {
  const cult = world.cults[0], event = world.pending;
  if (event?.kind !== 'decision') throw Error('Expected a cult offer context');
  const thread = cult.threads.find(row => row.offerId === event.id)!;
  thread.status = 'scheduled'; thread.offerId = null; world.pending = null; world.pendingPriority = 0; cult.lastSceneMonth = null;
  if (thread.kind === 'story') {
    const definition = cultStories.find(row => row.id === id)!;
    thread.title = definition.title;
    thread.body = definition.body.replaceAll('{member}', fullName(world.people[thread.participantIds[0]])).replaceAll('{relative}', thread.participantIds[1] ? fullName(world.people[thread.participantIds[1]]) : 'your relative').replaceAll('{rival}', cult.rivals.find(row => row.status === 'active')?.name ?? 'the rival organisation').replaceAll('{philosophy}', cultPhilosophies.find(row => row.id === thread.philosophy)!.title);
  } else thread.body = cultClaims.find(row => row.id === id)!.followup;
  if (!offerCultThread(world, cult, thread)) throw Error('Could not offer writing context');
  return world;
}

/** Remove presentation only. IDs, dates, ledger amounts, RNG, conditions,
 * people, relations and every other saved scalar remain in the comparison.
 */
export function cultWritingMechanics(value: unknown, path = ''): unknown {
  if (Array.isArray(value)) return path.endsWith('.report.events') ? value.map(() => '<copy>') : value.map((item, i) => cultWritingMechanics(item, path + '.' + i));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
    ['title', 'body', 'resultTitle', 'resultBody', 'journal', 'label', 'description', 'text', 'reason'].includes(key) && typeof item === 'string'
      ? '<copy>' : cultWritingMechanics(item, path + '.' + key),
  ]));
}

export type CultWritingCase =
  | { kind: 'recruit'; method: typeof cultRecruitment[number]['id']; seed: number }
  | { kind: 'preach'; philosophy: typeof cultPhilosophies[number]['id']; seed: number }
  | { kind: 'ceremony'; ceremony: typeof cultCeremonies[number]['id']; seed: number }
  | { kind: 'member'; action: 'talk' | 'praise' | 'reward' | 'confront' | 'promote' | 'assign' | 'expel'; personality: World['cults'][number]['members'][number]['personality']; grievance: number; ambition: number };

export function arrangeCultWritingCase(world: World, item: CultWritingCase): GameCommand {
  const cult = world.cults[0], actor = world.people[world.activePersonId];
  // These are declared branch contexts, not natural career encounter evidence.
  cult.lastSceneMonth = cultMonthNumber(world);
  if (item.kind === 'member') {
    const member = cult.members.find(row => row.role === 'organiser')!;
    member.personality = item.personality; member.grievance = item.grievance; member.ambition = item.ambition;
    return { type: 'cult-member', cultId: cult.id, personId: member.personId, action: item.action, role: 'recruiter', ...(item.action === 'reward' ? { quotedCost: cultRewardQuote(cult) } : {}) };
  }
  world.random.events = item.seed;
  if (item.kind === 'recruit') {
    if (item.seed % 2 === 0) {
      actor.stats.respect = 0; actor.skills.politics = 0; actor.publicLife.image = 0; cult.heat = 95;
    }
    return { type: 'cult-recruit', cultId: cult.id, method: item.method, quotedCost: cultRecruitQuote(cult, item.method) };
  }
  if (item.kind === 'preach') {
    cult.philosophy = item.philosophy;
    return { type: 'cult-preach', cultId: cult.id };
  }
  return { type: 'cult-ceremony', cultId: cult.id, ceremony: item.ceremony, quotedCost: cultCeremonyQuote(cult, item.ceremony) };
}
