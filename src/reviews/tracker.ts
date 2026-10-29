import { z } from 'zod';
import { dateSchema } from '../game/calendar';
import type { World } from '../game/model';
import { ageOn, compareDates } from '../game/personHelpers';

const observationSchema = z.object({ lifeId:z.string(), personId:z.string(), frameId:z.string(), startDate:dateSchema, negative:z.boolean() });
const candidateSchema = observationSchema.extend({ revision:z.number().int().nonnegative(), globalYear:z.number().int().positive(), age:z.number().int().nonnegative() });
export const reviewOfferSchema = z.object({ id:z.string(), lifeId:z.string(), personId:z.string(), revision:z.number().int().nonnegative(), globalYear:z.number().int().nonnegative(), response:z.enum(['sure','later']).nullable() });
export const reviewTrackerSchema = z.object({
  version:z.literal(1), globalYearsPlayed:z.number().int().nonnegative(),
  lastReviewPromptGlobalYear:z.number().int().nonnegative().nullable(), nextReviewPromptAtGlobalYear:z.number().int().nonnegative(),
  // This counts answers to our pre-prompt. Store APIs cannot report a rating.
  reviewCompletedOrDismissedCount:z.number().int().nonnegative(), offerSequence:z.number().int().nonnegative(),
  offer:reviewOfferSchema.nullable(), candidate:candidateSchema.nullable(), observations:z.array(observationSchema),
});
export type ReviewTracker = z.infer<typeof reviewTrackerSchema>;
export type ReviewOffer = z.infer<typeof reviewOfferSchema>;
export type ReviewResponse = 'sure' | 'later';
export const newReviewTracker = ():ReviewTracker => ({version:1,globalYearsPlayed:0,lastReviewPromptGlobalYear:null,nextReviewPromptAtGlobalYear:0,reviewCompletedOrDismissedCount:0,offerSequence:0,offer:null,candidate:null,observations:[]});
export function decodeReviewTracker(value:string|null):ReviewTracker|null {
  if(value===null)return newReviewTracker();
  try{return reviewTrackerSchema.parse(JSON.parse(value));}catch{return null;}
}
/** Called inside the life/receipt transaction. Each frame enters complete once. */
export function observeReviewCommit(tracker:ReviewTracker, before:World, after:World, commandId:string):ReviewTracker {
  if(!['advance','resume','acknowledge','choose'].some(type=>commandId==='revision:'+before.revision+':'+type))return tracker;
  const frame=after.annual??before.annual;
  // Legacy observations remain decodable, but sentiment must not starve the
  // age-up cadence. Do not scan every NPC/condition or write monthly metadata.
  const clearLegacy = () => tracker.candidate||tracker.observations.length?{...tracker,candidate:null,observations:[]}:tracker;
  if(!frame||before.id!==after.id||before.activePersonId!==after.activePersonId)return clearLegacy();
  const justCompleted=!!after.annual&&after.annual.stage==='complete'&&after.annual.monthsProcessed===12&&(before.annual?.id!==after.annual.id||before.annual.stage!=='complete');
  // Also covers a future quiet-year path that clears its frame without a modal.
  const completedWithoutModal=!after.annual&&before.annual?.stage==='months'&&compareDates(after.date,before.annual.targetDate)>=0;
  const completed=(justCompleted||completedWithoutModal)&&!after.people[after.activePersonId].died;
  return completed?{...tracker,globalYearsPlayed:tracker.globalYearsPlayed+1,candidate:null,observations:[]}:clearLegacy();
}
export function reviewCandidateEligible(tracker:ReviewTracker,world:World):boolean {
  const player=world.people[world.activePersonId];
  const due=tracker.offer?.response===null||tracker.globalYearsPlayed>=tracker.nextReviewPromptAtGlobalYear;
  return !!player&&due&&world.birthAcknowledged&&!player.died&&ageOn(player,world.date)>=5&&!world.annual&&!world.pending&&!world.deferred.length&&!world.miniGames.some(session=>session.personId===player.id&&session.status==='active');
}
export function offerReview(tracker:ReviewTracker,world:World):{tracker:ReviewTracker;offer:ReviewOffer} {
  const outstanding=tracker.offer?.response===null?tracker.offer:null;
  const offer={id:outstanding?.id??'review_'+(tracker.offerSequence+1),lifeId:world.id,personId:world.activePersonId,revision:world.revision,globalYear:tracker.globalYearsPlayed,response:null};
  return {offer,tracker:{...tracker,offerSequence:tracker.offerSequence+(outstanding?0:1),offer,candidate:null,observations:[],lastReviewPromptGlobalYear:tracker.globalYearsPlayed,nextReviewPromptAtGlobalYear:tracker.globalYearsPlayed+10}};
}
export function answerReview(tracker:ReviewTracker,offerId:string,response:ReviewResponse,delay:number):{tracker:ReviewTracker;accepted:boolean} {
  if(tracker.offer?.id!==offerId||tracker.offer.response!==null)return {tracker,accepted:false};
  const years=response==='later'?10:Math.max(10,Math.min(20,Number.isFinite(delay)?Math.floor(delay):10));
  return {accepted:true,tracker:{...tracker,offer:{...tracker.offer,response},reviewCompletedOrDismissedCount:tracker.reviewCompletedOrDismissedCount+1,nextReviewPromptAtGlobalYear:tracker.globalYearsPlayed+years}};
}
