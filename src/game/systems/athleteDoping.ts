import type { World } from '../model';
import { offerPending } from '../pendingQueue';
import { bounded, draw, fact } from './common';
import { endEmployment } from './work';
import { storyMonthNumber } from './storyContext';
import type { DopingCheck } from './athleteDopingSchemas';

/** The result and date are committed once, when the player takes the drugs. */
export function recordDopingUse(world: World, career: World['careers'][number], projectId: string, supplierId: string): DopingCheck {
  const check: DopingCheck = {
    id: 'doping_' + career.id + '_' + world.revision + '_' + (career.dopingChecks?.length ?? 0), ruleVersion: 1,
    projectId, employmentId: career.employmentId!, supplierId, used: { ...world.date }, testMonth: storyMonthNumber(world.date) + 1,
    detectionChance: 65, detectionRoll: draw(world, 'outcomes', 1, 100), status: 'pending', resolved: null,
  };
  (career.dopingChecks ??= []).push(check);
  return check;
}

/** Leaving sport does not delete a scheduled check of recorded drug use. */
export function athleteDopingMonth(world: World) {
  const month = storyMonthNumber(world.date);
  for (const career of world.careers) for (const check of career.dopingChecks ?? []) {
    if (check.status !== 'pending' || check.testMonth > month) continue;
    const person = world.people[career.personId];
    check.resolved = { ...(person.died ?? world.date) };
    if (person.died) { check.status = 'cancelled'; continue; }
    check.status = check.detectionRoll <= check.detectionChance ? 'positive' : 'negative';
    const positive = check.status === 'positive', imageBefore = person.publicLife.image, reputationBefore = career.reputation;
    // A replacement athletic contract cannot evade the suspension; unrelated work remains intact.
    const lostContract = positive && person.employment?.roleId === 'professional-athlete';
    if (positive) {
      person.publicLife.image = bounded(imageBefore - 10);
      career.reputation = bounded(reputationBefore - 15);
      if (lostContract) endEmployment(world, person.id);
    }
    const title = positive ? 'Your drug check is positive' : 'The drug check finds nothing';
    const body = positive
      ? 'The laboratory finds the banned substance. Your result is made public; your image and athletic reputation fall.' + (lostContract ? ' Your athletic contract ends and its unfinished season is cancelled.' : ' You have already left that contract, but the finding still follows you.') + ' You are suspended from professional athletics for twelve months.'
      : 'The check does not detect the banned substance. Your image and athletic reputation are untouched. The health cost remains, along with the secret.';
    fact(world, title + '. ' + body, 'career', '_' + check.id, person.id);
    if (person.id !== world.activePersonId) continue;
    offerPending(world, { kind: 'result', id: check.id + '_result', title, body, illustration: 'career', effects: [
      { id: check.id + '_test', label: 'Drug check', value: positive ? 'Positive' : 'Negative', tone: positive ? 'negative' : 'neutral' },
      ...(positive ? [
        { id: check.id + '_image', label: 'Public image', value: `${imageBefore} → ${person.publicLife.image}`, tone: 'negative' as const },
        { id: check.id + '_reputation', label: 'Athletic reputation', value: `${reputationBefore} → ${career.reputation}`, tone: 'negative' as const },
        { id: check.id + '_suspension', label: 'Athletics suspension', value: '12 months', tone: 'negative' as const },
      ] : []),
    ] }, positive ? 75 : 45);
    if (world.annual?.stage === 'months') world.annual.pausedForPlanning = true;
  }
}
