import type { World } from '../model';
import type { RuntimeEffectRow } from '../runtime';
import type { StoryImmediateEffect } from './storyImmediateSchemas';
import { storyImmediateReason } from './storyImmediateContext';
import { IneligibleAction } from '../errors';
import { bounded, post } from './common';
import { endEmployment } from './work';
import { endFriendship } from './friendships';
import { formatMoney } from '../money';
import { jobs } from '../content/jobs';

const changeRow = (id: string, label: string, delta: number): RuntimeEffectRow => ({ id, label, value: (delta >= 0 ? '+' : '') + delta + '%', tone: delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral' });

/** Runs inside the existing pure command transaction, without offering another popup. */
export function resolveStoryImmediate(world: World, effect: StoryImmediateEffect): RuntimeEffectRow[] {
  const reason = storyImmediateReason(world, effect); if (reason) throw new IneligibleAction(reason);
  const person = world.people[effect.personId], rows: RuntimeEffectRow[] = [];
  if (effect.cash) {
    const cash = effect.cash;
    post(world, cash.minor, 0n, cash.minor > 0n ? 'story-income' : 'story-expense', 'Story event consequence', null, person, cash.currency);
    rows.push({ id: 'story-cash', label: 'Bank balance', value: (cash.minor > 0n ? '+' : '−') + formatMoney({ minor: cash.minor < 0n ? -cash.minor : cash.minor, currency: cash.currency }), tone: cash.minor > 0n ? 'positive' : 'negative' });
  }
  for (const target of effect.trust ?? []) {
    const relation = world.relationships.find(row => row.id === target.relationshipId)!;
    const before = relation.trust; relation.trust = bounded(before + target.delta);
    rows.push(changeRow('story-trust:' + target.relationshipId, target.label + ' · trust', relation.trust - before));
  }
  if (effect.endFriendship) {
    const end = effect.endFriendship, relation = world.relationships.find(row => row.id === end.relationshipId)!;
    for (const agreement of world.bestFriendships.filter(row => row.status === 'active' && row.relationshipId === relation.id)) endFriendship(world, agreement, 'choice', person.id);
    relation.roles = relation.roles.filter(role => role !== 'friend');
    if (!relation.roles.length) relation.roles.push('acquaintance');
    relation.kind = relation.roles.includes('parent') ? 'parent' : relation.roles.includes('guardian') ? 'guardian' : relation.roles.includes('sibling') ? 'sibling' : relation.roles.includes('coworker') ? 'coworker' : relation.roles.includes('classmate') ? 'classmate' : relation.roles.includes('teacher') ? 'teacher' : 'acquaintance';
    const memory = 'friendship-ended:' + world.date.year; if (!relation.memories.includes(memory)) relation.memories.push(memory);
    rows.push({ id: 'story-friendship', label: end.label, value: 'Friendship ended', tone: 'negative' });
  }
  if (effect.work) {
    const job = person.employment!;
    if (effect.work.performance !== undefined) {
      const before = job.performance; job.performance = bounded(before + effect.work.performance);
      rows.push(changeRow('story-performance', 'Work performance', job.performance - before));
    }
    if (effect.work.loseJob) {
      const title = jobs.find(role => role.id === job.roleId)!.title;
      endEmployment(world, person.id);
      rows.push({ id: 'story-job', label: 'Job', value: title + ' · employment ended', tone: 'negative' });
    }
  }
  if (effect.publicImage !== undefined) {
    const before = person.publicLife.image; person.publicLife.image = bounded(before + effect.publicImage);
    rows.push(changeRow('story-public-image', 'Public image', person.publicLife.image - before));
  }
  return rows;
}
