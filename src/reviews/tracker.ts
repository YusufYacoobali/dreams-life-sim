import { z } from 'zod';
import { dateSchema } from '../game/calendar';
import type { World } from '../game/model';
import { ageOn, compareDates } from '../game/personHelpers';
import { isConfined } from '../game/systems/legalSchemas';

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
const recent = (date:World['date']|null, since:World['date'], now:World['date']) => !!date&&compareDates(date,since)>=0&&compareDates(date,now)<=0;
const romantic = new Set(['teen-dating','dating','engaged','married']);

/** Saved facts and explicit outcomes, never sentiment guesses from story prose. */
export function negativeReviewMoment(world:World, since:World['date']):boolean {
  const player=world.people[world.activePersonId];
  if(player.died||!world.birthAcknowledged||isConfined(world)||player.legal.wanted||player.stats.health<50||player.stats.happiness<50||player.stats.stress>70)return true;
  if(Object.values(world.people).some(person=>recent(person.died,since,world.date)))return true;
  if(player.health.hospitalizedUntil!==null&&player.health.hospitalizedUntil>=world.date.year*12+world.date.month-1)return true;
  if(player.health.conditions.some(condition=>condition.status!=='recovered'||recent(condition.onset,since,world.date)||recent(condition.resolved,since,world.date)))return true;
  if(world.cases.some(item=>item.personId===player.id&&(item.status==='awaiting-trial'||recent(item.opened,since,world.date)||item.status==='convicted'&&recent(item.resolved,since,world.date))))return true;
  if(world.sentences.some(item=>item.personId===player.id&&(item.state==='active'||recent(item.started,since,world.date)||recent(item.ended,since,world.date))))return true;
  if(world.marriages.some(item=>(item.a===player.id||item.b===player.id)&&recent(item.ended,since,world.date)))return true;
  if(world.relationships.some(item=>(item.from===player.id||item.to===player.id)&&item.memories.some(memory=>{const match=/^(?:breakup|divorce|teen-breakup):(\d+)$/.exec(memory);return !!match&&Number(match[1])>=since.year&&Number(match[1])<=world.date.year;})))return true;
  if(world.pregnancies.some(item=>(item.carrierId===player.id||item.otherParentId===player.id)&&(item.status==='lost'||item.status==='ended-death')&&recent(item.ended,since,world.date)))return true;
  if(world.pets.some(pet=>pet.status==='deceased'&&recent(pet.ended,since,world.date)))return true;
  if(world.businesses.some(company=>company.status==='failed'&&recent(company.ended,since,world.date)))return true;
  const accounts=world.accounts.filter(item=>item.ownerId===player.id);
  if(accounts.some(item=>item.cash<0n)||accounts.every(item=>item.cash-item.lockedCash<=0n)&&world.liabilities.some(item=>item.ownerId===player.id&&item.principal>0n))return true;
  const events=[world.pending,...world.deferred.map(item=>item.event)];
  return events.some(event=>event?.kind==='result'&&event.effects.some(effect=>effect.tone==='negative'&&(/^(?:happiness|health|respect|stress|bond|relationship|trust)$/i.test(effect.id)||/^(?:happiness|health|respect|stress|relationship|trust)$/i.test(effect.label))));
}
function negativeTransition(before:World, after:World, explicitChoice:boolean) {
  const old=before.people[before.activePersonId], player=after.people[after.activePersonId];
  if(old.id!==player.id)return true;
  // Passive monthly drift is not a negative event. Otherwise one routine point
  // of stress can suppress every completed school/work year indefinitely.
  if(explicitChoice&&(player.stats.happiness<old.stats.happiness||player.stats.health<old.stats.health||player.stats.respect<old.stats.respect||player.stats.stress>old.stats.stress))return true;
  return before.relationships.some(relation=>romantic.has(relation.romance)&&after.relationships.some(next=>next.id===relation.id&&!romantic.has(next.romance)));
}

/** Called inside the life/receipt transaction. Each frame enters complete once. */
export function observeReviewCommit(tracker:ReviewTracker, before:World, after:World, commandId:string):ReviewTracker {
  if(!['advance','resume','acknowledge','choose'].some(type=>commandId==='revision:'+before.revision+':'+type))return tracker;
  const frame=after.annual??before.annual;
  if(!frame||before.activePersonId!==after.activePersonId)return tracker.candidate?{...tracker,candidate:null}:tracker;
  const key=(item:ReviewTracker['observations'][number])=>item.lifeId===after.id&&item.personId===after.activePersonId&&item.frameId===frame.id;
  const old=tracker.observations.find(key), observation={lifeId:after.id,personId:after.activePersonId,frameId:frame.id,startDate:{...frame.startDate},negative:!!old?.negative||negativeReviewMoment(before,frame.startDate)||negativeReviewMoment(after,frame.startDate)||negativeTransition(before,after,commandId==='revision:'+before.revision+':choose')};
  const justCompleted=!!after.annual&&after.annual.stage==='complete'&&after.annual.monthsProcessed===12&&(before.annual?.id!==after.annual.id||before.annual.stage!=='complete');
  // Also covers a future quiet-year path that clears its frame without a modal.
  const completedWithoutModal=!after.annual&&before.annual?.stage==='months'&&compareDates(after.date,before.annual.targetDate)>=0;
  const completed=(justCompleted||completedWithoutModal)&&!after.people[after.activePersonId].died;
  const globalYearsPlayed=tracker.globalYearsPlayed+(completed?1:0);
  let candidate=completed?{...observation,revision:after.revision,globalYear:globalYearsPlayed,age:ageOn(after.people[after.activePersonId],after.date)}:tracker.candidate;
  if(candidate&&key(candidate))candidate={...candidate,revision:after.revision,negative:observation.negative};
  else if(!completed)candidate=null;
  return {...tracker,globalYearsPlayed,candidate,observations:[...tracker.observations.filter(item=>!key(item)&&item.lifeId!==after.id),...(after.annual?[observation]:[])]};
}
export function reviewCandidateEligible(tracker:ReviewTracker,world:World):boolean {
  const candidate=tracker.candidate,player=world.people[world.activePersonId];
  return !!candidate&&!candidate.negative&&candidate.lifeId===world.id&&candidate.personId===player.id&&candidate.revision===world.revision&&candidate.age>=5&&ageOn(player,world.date)>=5&&tracker.globalYearsPlayed>=tracker.nextReviewPromptAtGlobalYear&&!world.annual&&!world.pending&&!world.deferred.length&&!negativeReviewMoment(world,candidate.startDate);
}
export function offerReview(tracker:ReviewTracker):{tracker:ReviewTracker;offer:ReviewOffer} {
  const candidate=tracker.candidate!;
  const offer={id:'review_'+(tracker.offerSequence+1),lifeId:candidate.lifeId,personId:candidate.personId,revision:candidate.revision,globalYear:tracker.globalYearsPlayed,response:null};
  return {offer,tracker:{...tracker,offerSequence:tracker.offerSequence+1,offer,candidate:null,lastReviewPromptGlobalYear:tracker.globalYearsPlayed,nextReviewPromptAtGlobalYear:tracker.globalYearsPlayed+10}};
}
export function answerReview(tracker:ReviewTracker,offerId:string,response:ReviewResponse,delay:number):{tracker:ReviewTracker;accepted:boolean} {
  if(tracker.offer?.id!==offerId||tracker.offer.response!==null)return {tracker,accepted:false};
  const years=response==='later'?10:Math.max(10,Math.min(20,Number.isFinite(delay)?Math.floor(delay):10));
  return {accepted:true,tracker:{...tracker,offer:{...tracker.offer,response},reviewCompletedOrDismissedCount:tracker.reviewCompletedOrDismissedCount+1,nextReviewPromptAtGlobalYear:tracker.globalYearsPlayed+years}};
}
