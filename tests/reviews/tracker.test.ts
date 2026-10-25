import { monthFrom } from '../../src/game/calendar';
import { createLife, randomCreation } from '../../src/game/createLife';
import { copyWorld, type World } from '../../src/game/model';
import { newMedicalEpisode } from '../../src/game/systems/healthSchemas';
import { answerReview, decodeReviewTracker, newReviewTracker, observeReviewCommit, offerReview, reviewCandidateEligible, type ReviewTracker } from '../../src/reviews/tracker';
const date={year:2026,month:10,day:22};
function clean(id='life_review_unit') {
  const world=createLife(id,42,{...randomCreation(42),country:'US',city:'New York',background:'ordinary'},date);
  world.birthAcknowledged=true;Object.assign(world.people[world.activePersonId].stats,{health:90,happiness:90,respect:70,stress:0});return world;
}
function start(world:World) {const next=copyWorld(world);next.revision++;next.annual={id:'year_'+world.revision,startDate:{...world.date},targetDate:monthFrom(world.date,12,world.calendarAnchorDay),monthsProcessed:1,stage:'months',pausedForPlanning:true};next.date=monthFrom(world.date,1,world.calendarAnchorDay);return next;}
function finish(world:World) {const next=copyWorld(world);next.revision++;next.date={...world.annual!.targetDate};next.annual!.monthsProcessed=12;next.annual!.stage='complete';next.annual!.pausedForPlanning=false;return next;}
function acknowledge(world:World) {const next=copyWorld(world);next.revision++;next.annual=null;return next;}
function year(world:World,tracker:ReviewTracker) {
  const started=start(world),finished=finish(started),cleared=acknowledge(finished);
  tracker=observeReviewCommit(tracker,world,started,'revision:'+world.revision+':advance');
  tracker=observeReviewCommit(tracker,started,finished,'revision:'+started.revision+':resume');
  tracker=observeReviewCommit(tracker,finished,cleared,'revision:'+finished.revision+':acknowledge');return {world:cleared,tracker};
}
function eligible() {let world=clean(),tracker=newReviewTracker();for(let i=0;i<5;i++)({world,tracker}=year(world,tracker));return {world,tracker};}

test('counts completed years once, including no-result completion; monthly planning and final acknowledgements never add years',()=>{
  const before=clean(),started=start(before);let tracker=observeReviewCommit(newReviewTracker(),before,started,'revision:0:advance');expect(tracker.globalYearsPlayed).toBe(0);
  const finished=finish(started);tracker=observeReviewCommit(tracker,started,finished,'revision:'+started.revision+':resume');expect(tracker.globalYearsPlayed).toBe(1);expect(reviewCandidateEligible(tracker,finished)).toBe(false);
  tracker=observeReviewCommit(tracker,finished,acknowledge(finished),'revision:'+finished.revision+':acknowledge');expect(tracker.globalYearsPlayed).toBe(1);
  const quiet=finish(started);quiet.annual=null;expect(observeReviewCommit(newReviewTracker(),started,quiet,'revision:'+started.revision+':resume').globalYearsPlayed).toBe(1);
});

test('the first opportunity is age five; progress and later scheduling stay global across lives',()=>{
  let world=clean(),tracker=newReviewTracker();for(let age=1;age<=5;age++){({world,tracker}=year(world,tracker));expect(tracker.globalYearsPlayed).toBe(age);expect(reviewCandidateEligible(tracker,world)).toBe(age===5);}
  const offered=offerReview(tracker,world);expect(offered.tracker.lastReviewPromptGlobalYear).toBe(5);expect(offered.tracker.nextReviewPromptAtGlobalYear).toBe(15);
  const sure=answerReview(offered.tracker,offered.offer.id,'sure',17);expect(sure.tracker.reviewCompletedOrDismissedCount).toBe(1);expect(sure.tracker.nextReviewPromptAtGlobalYear).toBe(22);
  world=clean('life_another_review');tracker=sure.tracker;for(let age=1;age<=17;age++){({world,tracker}=year(world,tracker));expect(reviewCandidateEligible(tracker,world)).toBe(age===17);}
  expect(tracker.globalYearsPlayed).toBe(22);const later=offerReview(tracker,world);expect(answerReview(later.tracker,later.offer.id,'later',20).tracker.nextReviewPromptAtGlobalYear).toBe(32);
});

test.each([10,15,20])('Sure schedules %s global years away, counts only a pre-prompt answer, and is idempotent',delay=>{
  const {world,tracker}=eligible(),offered=offerReview(tracker,world),answered=answerReview(offered.tracker,offered.offer.id,'sure',delay);
  expect(answered.tracker.nextReviewPromptAtGlobalYear).toBe(5+delay);expect(answered.tracker.offer?.response).toBe('sure');expect(answerReview(answered.tracker,offered.offer.id,'sure',delay)).toEqual({tracker:answered.tracker,accepted:false});expect(answered.tracker).not.toHaveProperty('ratingCompleted');
});

test('cold reopening resumes one unanswered offer with fresh context instead of consuming its schedule unseen',()=>{
  const {world,tracker}=eligible(),offered=offerReview(tracker,world),cold=decodeReviewTracker(JSON.stringify(offered.tracker))!;
  expect(cold.candidate).toBeNull();expect(cold.nextReviewPromptAtGlobalYear).toBe(15);expect(cold.reviewCompletedOrDismissedCount).toBe(0);expect(reviewCandidateEligible(cold,world)).toBe(true);
  world.revision++;
  const resumed=offerReview(cold,world);
  expect(resumed.offer).toEqual({...offered.offer,revision:world.revision});
  expect(resumed.tracker.offerSequence).toBe(1);
  const answered=answerReview(resumed.tracker,resumed.offer.id,'later',20);
  expect(reviewCandidateEligible(answered.tracker,world)).toBe(false);
});

test('imports of already-complete frames, God Mode, birth, new-life and unrelated receipts do not manufacture years',()=>{
  const before=finish(start(clean())),after=acknowledge(before),tracker=newReviewTracker();
  expect(observeReviewCommit(tracker,before,after,'revision:'+before.revision+':acknowledge').globalYearsPlayed).toBe(0);
  for(const command of ['birth:life_review_unit','god-mode:one','import','new-life'])expect(observeReviewCommit(tracker,start(clean()),before,command)).toBe(tracker);
});

test('negative choices and cold annual resume still count once without latching sentiment or monthly metadata',()=>{
  const {world:before,tracker:previous}=eligible(),started=start(before);
  let tracker=observeReviewCommit(previous,before,started,'revision:'+before.revision+':advance');
  expect(tracker).toBe(previous);
  const bad=copyWorld(started);bad.revision++;bad.people[bad.activePersonId].stats.happiness-=5;
  tracker=observeReviewCommit(tracker,started,bad,'revision:'+started.revision+':choose');tracker=decodeReviewTracker(JSON.stringify(tracker))!;
  const recovered=finish(bad);recovered.people[recovered.activePersonId].stats.happiness=20;
  tracker=observeReviewCommit(tracker,bad,recovered,'revision:'+bad.revision+':resume');
  const cleared=acknowledge(recovered);tracker=observeReviewCommit(tracker,recovered,cleared,'revision:'+recovered.revision+':acknowledge');
  expect(tracker.globalYearsPlayed).toBe(6);expect(tracker.candidate).toBeNull();expect(tracker.observations).toEqual([]);
  expect(reviewCandidateEligible(tracker,cleared)).toBe(true);
});

test('routine passive stat drift no longer disqualifies an otherwise healthy completed year',()=>{
  const {world,tracker:previous}=eligible(),started=start(world);
  let tracker=observeReviewCommit(previous,world,started,'revision:'+world.revision+':advance');
  const finished=finish(started),player=finished.people[finished.activePersonId];
  player.stats.health--;player.stats.happiness--;player.stats.respect--;player.stats.stress++;
  tracker=observeReviewCommit(tracker,started,finished,'revision:'+started.revision+':resume');
  const cleared=acknowledge(finished);
  tracker=observeReviewCommit(tracker,finished,cleared,'revision:'+finished.revision+':acknowledge');
  expect(tracker.candidate).toBeNull();expect(reviewCandidateEligible(tracker,cleared)).toBe(true);
});

test.each(['death','illness','prison','breakup','bankruptcy','pet-death','poor-stats'] as const)('recorded %s does not indefinitely suppress an overdue reminder after event dismissal',kind=>{
  const {world,tracker}=eligible(),player=world.people[world.activePersonId];
  if(kind==='death')Object.values(world.people).find(person=>person.id!==player.id)!.died={...world.date};
  if(kind==='illness')player.health.conditions.push({id:'cold_test',type:'cold',onset:{...world.date},severity:10,status:'recovered',diagnosed:{...world.date},resolved:{...world.date},months:1,lastEmergencyYear:null,treatment:null,episode:newMedicalEpisode()});
  if(kind==='prison')world.sentences.push({id:'sentence_review',personId:player.id,caseIds:['case_review'],country:player.country,city:player.city,facility:'Test prison',started:{...world.date},totalMonths:12,servedMonths:1,creditedMonths:0,lastServedMonth:world.date.year*12+world.date.month-1,state:'active',ended:null,behavior:50,routine:{work:false,study:false,exercise:false,conduct:'quiet'},studyMonths:0,appealRoll:50,appealed:false,releaseReason:null});
  if(kind==='breakup')world.relationships[0].memories.push('breakup:'+world.date.year);
  if(kind==='bankruptcy')world.liabilities.push({id:'debt_review',ownerId:player.id,creditorId:null,currency:'USD',kind:'living',principal:10000n,missedPayments:0,interestBps:300,assetId:null,monthlyPayment:0n,remainingMonths:0});
  if(kind==='pet-death')world.pets.push({status:'deceased',ended:{...world.date}} as World['pets'][number]);
  if(kind==='poor-stats')Object.assign(player.stats,{happiness:5,health:30,stress:95});
  expect(reviewCandidateEligible(tracker,world)).toBe(true);
});

test('a live acknowledged age-five Life view is eligible independently of old candidate IDs, revision and journal prose',()=>{
  const {world,tracker}=eligible();world.journal.push({id:'fictional_words',personId:world.activePersonId,date:{...world.date},category:'event',text:'This positive memory happens to mention death, prison and bankruptcy.'});expect(reviewCandidateEligible(tracker,world)).toBe(true);
  const legacy={...tracker,candidate:{lifeId:'old_life',personId:'old_person',frameId:'old_frame',startDate:date,negative:true,revision:0,globalYear:5,age:5}};
  world.revision++;
  expect(reviewCandidateEligible(decodeReviewTracker(JSON.stringify(legacy))!,world)).toBe(true);
  expect(reviewCandidateEligible(newReviewTracker(),world)).toBe(true);
  expect(decodeReviewTracker('broken JSON')).toBeNull();
});

test.each(['birth','under-five','deceased-player','annual','pending','deferred','mini-game'] as const)('%s holds the reminder without consuming its due date',kind=>{
  const {world,tracker}=eligible();
  if(kind==='birth')world.birthAcknowledged=false;
  if(kind==='under-five')world.date={...date,year:date.year+4};
  if(kind==='deceased-player')world.people[world.activePersonId].died={...world.date};
  if(kind==='annual')world.annual=start(world).annual;
  const event={kind:'result' as const,id:'waiting',title:'Hello',body:'A saved event',illustration:'journal',effects:[]};
  if(kind==='pending')world.pending=event;
  if(kind==='deferred')world.deferred.push({priority:30,event});
  if(kind==='mini-game')world.miniGames.push({personId:world.activePersonId,status:'active'} as World['miniGames'][number]);
  const before=JSON.stringify(tracker);
  expect(reviewCandidateEligible(tracker,world)).toBe(false);expect(JSON.stringify(tracker)).toBe(before);
});

test.each([10,20])('every %s committed age-ups becomes due even with persistently low wellbeing',delay=>{
  let {world,tracker}=eligible();
  const offered=offerReview(tracker,world);
  tracker=answerReview(offered.tracker,offered.offer.id,'sure',delay).tracker;
  for(let years=1;years<=delay;years++){
    Object.assign(world.people[world.activePersonId].stats,{health:20,happiness:10,stress:95});
    ({world,tracker}=year(world,tracker));
    expect(reviewCandidateEligible(tracker,world)).toBe(years===delay);
  }
});
