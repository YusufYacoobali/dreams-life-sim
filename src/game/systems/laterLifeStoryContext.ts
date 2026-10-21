import type { World } from '../model';
import { compareDates } from '../personHelpers';
import { storyPersonPresent } from './storyContext';
import { partnerRelation, relationFor } from './relationshipQueries';
import { serviceCareer } from './serviceSchemas';
import { fullTimeCreator } from './creatorSchemas';
import { publicRoyalDuty } from './royaltySchemas';
import { recordingCommitment } from './musicSchemas';
import { campaignCommitment } from './politicsSchemas';

/** Recorded pension retirement and current widowhood, never age or an absent partner.
 * Other investment/royalty income and personal activities need not have stopped. */
export function laterLifeStoryContext(world: World) {
  const person = world.people[world.activePersonId];
  if (!storyPersonPresent(world, person)) return;
  // These actual main occupations take precedence over Retired on Profile.
  const occupied = person.employment || person.education.stage !== 'none' ||
    world.businesses.some(item => item.ownerId === person.id && item.status === 'active') ||
    world.careers.some(item => item.personId === person.id && item.status === 'active') ||
    serviceCareer(world) || fullTimeCreator(world) || publicRoyalDuty(world) || recordingCommitment(world) || campaignCommitment(world);
  const finance = person.finance;
  // Work history has no retirement end-reason; do not guess an employer or date.
  const retired = !occupied && finance.pensionAnnual > 0n && finance.serviceMonths >= 120 && finance.lifetimeGross > 0n &&
    world.workHistory.some(item => item.personId === person.id && item.ended && item.monthsWorked > 0 && item.grossEarned > 0n) &&
    finance.pensionReceipts.some(item => item.gross > 0n && item.grossTransactionId !== null);
  let latest: World['marriages'][number] | undefined, ambiguous = false;
  for (const marriage of world.marriages) {
    if (marriage.a !== person.id && marriage.b !== person.id) continue;
    const order = latest ? compareDates(marriage.started, latest.started) : 1;
    if (order > 0) { latest = marriage; ambiguous = false; }
    else if (order === 0) ambiguous = true;
  }
  const spouse = latest && world.people[latest.a === person.id ? latest.b : latest.a];
  const lateSpouse = !ambiguous && !partnerRelation(world) && latest?.endReason === 'death' && latest.ended && spouse?.died &&
    compareDates(spouse.died, latest.ended) === 0 && relationFor(world, person.id, spouse.id)?.romance === 'widowed' ? spouse : undefined;
  return { retired, lateSpouse };
}
