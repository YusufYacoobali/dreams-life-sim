import type { World } from '../model';
import { IneligibleAction } from '../errors';
import {
  cultClaimRemedies,
  type CultClaimId,
  type CultClaimImpact,
} from '../content/cultClaims';
import type { CultDoctrineId, CultRuleId } from '../content/cults';
import { cultMonthNumber, type Cult, type CultThread } from './cultSchemas';
import { bounded } from './common';
import {
  cultAmount,
  cultBook,
  cultCeremonyQuote,
  cultChangeFollowers,
  cultMemberPayment,
  cultMemberTrust,
  cultMemory,
  cultScandal,
  cultSpend,
  cultUpgradeQuote,
} from './cultCore';
import { recordCultCeremonyPromises } from './cultThreads';
import { storyPersonPresent } from './storyContext';

function witness(cult: Cult, thread: CultThread) {
  return cult.members.find((row) => row.personId === thread.participantIds[0]);
}
export function cultClaimRemedyCost(cult: Cult, thread: CultThread) {
  const action = cultClaimRemedies[thread.templateId as CultClaimId].action;
  if (action === 'refund-dues')
    return (
      cult.recurringFee *
      BigInt(
        Math.max(
          0,
          cult.followers -
            cult.members.filter((row) => row.status === 'active').length,
        ),
      )
    );
  if (action === 'repair-venue') return cult.arrears + cultAmount(cult, 70);
  if (action === 'late-picnic')
    return cultCeremonyQuote(cult, 'community-supper');
  if (action === 'neighbour-gathering')
    return cultCeremonyQuote(cult, 'open-house');
  if (action === 'aid-supper')
    return cultCeremonyQuote(cult, 'community-supper') + cultAmount(cult, 120);
  if (action === 'build-workshop') return cultUpgradeQuote(cult, 'workshop');
  if (action === 'plant-garden') return cultUpgradeQuote(cult, 'garden');
  if (action === 'covered-hall') return cultUpgradeQuote(cult, 'hall');
  const flatCosts: Record<string, number> = {
    'science-night': 70,
    'open-records': 20,
    'reimburse-witness': 80,
    'independent-study': 180,
    'animal-shelter': 90,
  };
  return cultAmount(cult, flatCosts[action] ?? 0);
}
export function cultClaimRemedyReason(
  world: World,
  cult: Cult,
  thread: CultThread,
) {
  const remedy = cultClaimRemedies[thread.templateId as CultClaimId];
  if (!remedy) return 'This promise has no recorded remedy';
  const requiredRule: CultRuleId | null = [
    'open-records',
    'independent-study',
  ].includes(remedy.action)
    ? 'open-books'
    : remedy.action === 'aid-supper'
      ? 'mutual-aid'
      : remedy.action === 'free-membership'
        ? 'guest-night'
        : null;
  if (
    requiredRule &&
    !cult.rules.includes(requiredRule) &&
    cult.rules.length >= 6
  )
    return 'Your six rule slots are full; this response needs an additional rule';
  const changedDoctrine: [CultDoctrineId, CultDoctrineId] | null =
    remedy.action === 'science-night'
      ? ['moon-lessons', 'leader-fallible']
      : remedy.action === 'retire-reboot'
        ? ['reality-stutters', 'leader-fallible']
        : remedy.action === 'auction-kettle'
          ? ['sacred-kettle', 'leader-fallible']
          : remedy.action === 'publish-six'
            ? ['number-seven', 'leader-fallible']
            : null;
  if (changedDoctrine) {
    const [old, replacement] = changedDoctrine;
    if (
      !cult.doctrines.includes(old) &&
      !cult.doctrines.includes(replacement) &&
      cult.doctrines.length >= 6
    )
      return 'Your six doctrine slots are full; this response would replace an unrelated belief';
    if (
      cult.doctrines.includes(old) &&
      cult.doctrines.includes(replacement) &&
      cult.doctrines.length === 2
    )
      return 'Retiring that doctrine would leave fewer than two beliefs; choose another response';
  }
  const member = witness(cult, thread);
  if (
    ['reimburse-witness', 'delegate-answer', 'aid-supper'].includes(
      remedy.action,
    )
  ) {
    const person = member && world.people[member.personId];
    if (
      !member ||
      member.status !== 'active' ||
      !person ||
      !storyPersonPresent(world, person) ||
      person.country !== cult.country ||
      person.city !== cult.city
    )
      return 'The named witness is no longer available for this response';
  }
  if (remedy.action === 'delegate-answer' && member?.role === 'adviser')
    return 'The witness already holds the adviser’s seat';
  const upgrade =
    remedy.action === 'build-workshop'
      ? 'workshop'
      : remedy.action === 'plant-garden'
        ? 'garden'
        : remedy.action === 'covered-hall'
          ? 'hall'
          : null;
  if (upgrade && cult.upgrades.includes(upgrade))
    return 'The promised improvement is already installed; acknowledge the missed deadline instead';
  if (
    remedy.action === 'refund-dues' &&
    cultClaimRemedyCost(cult, thread) === 0n
  )
    return 'There are no ordinary-member dues to refund';
  if (cult.cash < cultClaimRemedyCost(cult, thread))
    return 'The treasury cannot cover this response';
}
export function applyCultClaimImpact(
  world: World,
  cult: Cult,
  thread: CultThread,
  impact: CultClaimImpact,
  scandal?: string,
) {
  cult.loyalty = bounded(cult.loyalty + (impact.loyalty ?? 0));
  cult.satisfaction = bounded(cult.satisfaction + (impact.satisfaction ?? 0));
  cult.reputation = bounded(cult.reputation + (impact.reputation ?? 0));
  if (scandal && (impact.heat ?? 0) > 0)
    cultScandal(world, cult, scandal, impact.heat!);
  else cult.heat = bounded(cult.heat + (impact.heat ?? 0));
  if (impact.growth) cultChangeFollowers(cult, impact.growth);
  const member = witness(cult, thread);
  if (member) {
    cultMemberTrust(world, member, impact.memberLoyalty ?? 0);
    member.ambition = bounded(member.ambition + (impact.ambition ?? 0));
  }
}
function adoptRule(cult: Cult, id: CultRuleId) {
  if (cult.rules.includes(id)) return;
  if (cult.rules.length < 6) cult.rules.push(id);
  else
    throw new IneligibleAction('There is no free rule slot for this response');
}
function replaceDoctrine(
  cult: Cult,
  old: CultDoctrineId,
  replacement: CultDoctrineId,
) {
  if (!cult.doctrines.includes(replacement)) {
    const index = cult.doctrines.indexOf(old);
    if (index >= 0) cult.doctrines[index] = replacement;
    else if (cult.doctrines.length < 6) cult.doctrines.push(replacement);
    else
      throw new IneligibleAction(
        'There is no free doctrine slot for this response',
      );
  } else if (cult.doctrines.includes(old)) {
    cult.doctrines = cult.doctrines.filter((id) => id !== old);
    if (cult.doctrines.length < 2)
      throw new IneligibleAction('At least two doctrines must remain');
  }
}
function holdLateGathering(
  world: World,
  cult: Cult,
  id: 'community-supper' | 'open-house',
) {
  cult.ceremonies++;
  cult.lastCeremony = { id, month: cultMonthNumber(world), success: true };
  recordCultCeremonyPromises(world, cult, id, true);
}
/** Called only after the offer's current identity, response and funds are checked. */
export function applyCultClaimRemedy(
  world: World,
  cult: Cult,
  thread: CultThread,
) {
  const reason = cultClaimRemedyReason(world, cult, thread);
  if (reason) throw new IneligibleAction(reason);
  const remedy = cultClaimRemedies[thread.templateId as CultClaimId],
    member = witness(cult, thread),
    cost = cultClaimRemedyCost(cult, thread);
  if (remedy.action === 'reimburse-witness')
    cultMemberPayment(
      world,
      cult,
      member!,
      cost,
      'Compensation after the failed final-Monday promise',
    );
  else if (remedy.action === 'aid-supper') {
    cultMemberPayment(
      world,
      cult,
      member!,
      cultAmount(cult, 120),
      'Support after the failed shared-meal promise',
    );
    cultSpend(
      world,
      cult,
      cultCeremonyQuote(cult, 'community-supper'),
      'claim-remedy',
      thread.title + ': late community supper',
    );
  } else if (cost > 0n)
    cultSpend(
      world,
      cult,
      cost,
      remedy.action === 'refund-dues' ? 'claim-refunds' : 'claim-remedy',
      thread.title + ': ' + remedy.label,
    );
  if (remedy.action === 'science-night')
    replaceDoctrine(cult, 'moon-lessons', 'leader-fallible');
  if (remedy.action === 'open-records' || remedy.action === 'independent-study')
    adoptRule(cult, 'open-books');
  if (remedy.action === 'retire-reboot')
    replaceDoctrine(cult, 'reality-stutters', 'leader-fallible');
  if (remedy.action === 'repair-venue') {
    cult.arrears = 0n;
    cult.distressMonths = 0;
  }
  if (remedy.action === 'aid-supper') adoptRule(cult, 'mutual-aid');
  if (remedy.action === 'late-picnic' || remedy.action === 'aid-supper')
    holdLateGathering(world, cult, 'community-supper');
  if (remedy.action === 'neighbour-gathering')
    holdLateGathering(world, cult, 'open-house');
  if (remedy.action === 'delegate-answer') {
    const previousRole = member!.role,
      previousAdviser = cult.members.find(
        (row) =>
          row.status === 'active' &&
          row.role === 'adviser' &&
          row.personId !== member!.personId,
      );
    if (previousAdviser) {
      previousAdviser.role = previousRole;
      cultMemberTrust(world, previousAdviser, -5);
      previousAdviser.grievance = bounded(previousAdviser.grievance + 4);
      cultMemory(
        world,
        cult,
        previousAdviser,
        'role-change',
        'The leader moved me from the adviser’s seat after a failed public promise.',
      );
    }
    member!.role = 'adviser';
  }
  if (remedy.action === 'auction-kettle') {
    cultBook(
      world,
      cult,
      cultAmount(cult, 45),
      'income',
      'claim-auction',
      'One-time sale of the former ceremonial kettle',
    );
    replaceDoctrine(cult, 'sacred-kettle', 'leader-fallible');
  }
  if (remedy.action === 'build-workshop') cult.upgrades.push('workshop');
  if (remedy.action === 'plant-garden') cult.upgrades.push('garden');
  if (remedy.action === 'covered-hall') cult.upgrades.push('hall');
  if (remedy.action === 'free-membership') {
    cult.joiningFee = 0n;
    cult.recurringFee = 0n;
    adoptRule(cult, 'guest-night');
  }
  if (remedy.action === 'publish-six')
    replaceDoctrine(cult, 'number-seven', 'leader-fallible');
  applyCultClaimImpact(world, cult, thread, remedy.impact);
  if (member)
    cultMemory(
      world,
      cult,
      member,
      'promise-remedy',
      'After the failed ' +
        thread.title.toLowerCase() +
        ' promise, the leader chose: ' +
        remedy.label.toLowerCase() +
        '.',
    );
}
