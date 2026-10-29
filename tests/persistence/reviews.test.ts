import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLife, randomCreation } from '../../src/game/createLife';
import { encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import { miniGameFixture } from '../support/miniGames';
import { burglaryContext } from '../../src/minigames/core/eligibility';
import { reviewCandidateEligible, newReviewTracker, type ReviewTracker } from '../../src/reviews/tracker';
import { ageOn } from '../../src/game/personHelpers';
const date={year:2026,month:10,day:22};
async function context() {
  const directory=mkdtempSync(join(tmpdir(),'dreams-reviews-')),path=join(directory,'save.db');let sqlite!:DatabaseSync,repository!:SaveRepository,store!:ReturnType<typeof createGameStore>,sequence=0;
  const connect=():SqlDatabase=>{
    sqlite=new DatabaseSync(path);sqlite.exec('PRAGMA foreign_keys=ON');const db=sqlite;
    const session:SqlSession={run:async(sql,values=[])=>{db.prepare(sql).run(...values);},get:async<T,>(sql:string,values:(string|number|null)[]=[])=>db.prepare(sql).get(...values) as T??null,all:async<T,>(sql:string,values:(string|number|null)[]=[])=>db.prepare(sql).all(...values) as T[]};
    return {...session,exec:async sql=>{db.exec(sql);},transaction:async action=>{db.exec('BEGIN IMMEDIATE');try{const result=await action(session);db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}}};
  };
  const bootstrap=async()=>{repository=new SaveRepository(connect());await repository.initialise();store=createGameStore({repository:async()=>repository,date:()=>date,id:()=> 'life_review_'+sequence++,godModeAccess:()=>true,reviewDelay:()=>17});expect(await store.getState().bootstrap()).toBe(true);};
  await bootstrap();
  return {get sqlite(){return sqlite;},get repository(){return repository;},get store(){return store;},cold:async()=>{sqlite.close();await bootstrap();},close:()=>{sqlite.close();rmSync(directory,{recursive:true,force:true});}};
}
function nextCommand(world:World):GameCommand {
  if(world.pending?.kind==='result')return {type:'acknowledge',resultId:world.pending.id};
  if(world.pending?.kind==='decision'){const choice=world.pending.choices.find(item=>!choiceUnavailable(world,item));if(!choice)throw Error('No available saved answer');return {type:'choose',eventId:world.pending.id,choiceId:choice.id};}
  return world.annual?{type:'resume'}:{type:'advance'};
}
async function finishYear(store:ReturnType<typeof createGameStore>) {
  expect(await store.getState().dispatch({type:'advance'})).toBe(true);
  for(let i=0;i<150&&store.getState().world!.annual;i++)expect(await store.getState().dispatch(nextCommand(store.getState().world!))).toBe(true);
  expect(store.getState().world!.annual).toBeNull();
}

test('bootstrap is read-only for app review metadata; new life, birth, imports, settings reset and God Mode do not count',async()=>{
  const c=await context();try{
    expect(c.sqlite.prepare("SELECT value FROM preferences WHERE key='app_review'").get()).toBeUndefined();expect(await c.repository.loadReviewTracker()).toEqual(newReviewTracker());
    expect(await c.store.getState().startLife({...randomCreation(42),country:'US',city:'New York',background:'ordinary'},42)).toBe(true);expect(await c.store.getState().acknowledgeBirth()).toBe(true);
    const world=c.store.getState().world!;expect(await c.store.getState().editGodMode({lifeId:world.id,personId:world.activePersonId,expectedRevision:world.revision,commands:[{type:'stat',stat:'happiness',value:95}]})).toBe(true);
    const exported=await c.repository.export(world.id);expect(await c.store.getState().importLife(exported,true)).toBe(true);await c.repository.saveAppSettings('{"appearance":"dark"}');await c.repository.saveAppSettings('{}');await c.cold();
    expect((await c.repository.loadReviewTracker())!.globalYearsPlayed).toBe(0);expect(c.sqlite.prepare("SELECT value FROM preferences WHERE key='app_review'").get()).toBeUndefined();
    expect(c.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()).toHaveLength(8);
  }finally{c.close();}
});

test('a real annual save failure rolls back the year and tracker together; duplicate receipt and cold resume count it only once globally',async()=>{
  const c=await context();try{
    await c.store.getState().startLife({...randomCreation(42),country:'US',city:'New York',background:'ordinary'},42);await c.store.getState().acknowledgeBirth();
    c.sqlite.exec("CREATE TRIGGER fail_completed_review BEFORE INSERT ON preferences WHEN NEW.key='app_review' AND json_extract(NEW.value,'$.globalYearsPlayed')>0 BEGIN SELECT RAISE(ABORT,'review write failed'); END");
    let retry!:GameCommand,expected!:World,before!:World;
    for(let i=0;i<150;i++){
      const current=c.store.getState().world!,command=nextCommand(current),next=resolveCommand(current,command,true);
      const completes=next.annual?.stage==='complete'&&current.annual?.stage!=='complete';
      if(completes){before=current;retry=command;expected=next;expect(await c.store.getState().dispatch(command)).toBe(false);expect(encodeWorld(c.store.getState().world!)).toBe(encodeWorld(current));expect((await c.repository.loadReviewTracker())!.globalYearsPlayed).toBe(0);break;}
      expect(await c.store.getState().dispatch(command)).toBe(true);
    }
    expect(retry).toBeDefined();c.sqlite.exec('DROP TRIGGER fail_completed_review');expect(await c.store.getState().dispatch(retry)).toBe(true);expect((await c.repository.loadReviewTracker())!.globalYearsPlayed).toBe(1);
    await c.repository.commit(expected,before.revision,'revision:'+before.revision+':'+retry.type);expect((await c.repository.loadReviewTracker())!.globalYearsPlayed).toBe(1);
    await c.cold();expect(c.store.getState().reviewTracker!.globalYearsPlayed).toBe(1);for(let i=0;i<150&&c.store.getState().world!.annual;i++)expect(await c.store.getState().dispatch(nextCommand(c.store.getState().world!))).toBe(true);expect((await c.repository.loadReviewTracker())!.globalYearsPlayed).toBe(1);
    await finishYear(c.store);expect((await c.repository.loadReviewTracker())!.globalYearsPlayed).toBe(2);
    await c.store.getState().startLife({...randomCreation(44),country:'US',city:'New York',background:'ordinary'},44);await c.store.getState().acknowledgeBirth();await finishYear(c.store);expect((await c.repository.loadReviewTracker())!.globalYearsPlayed).toBe(3);
  }finally{c.close();}
},60000);

function timingBoundary(world:World):ReviewTracker {
  return {...newReviewTracker(),globalYearsPlayed:5,candidate:{lifeId:world.id,personId:world.activePersonId,frameId:'declared_review_boundary',startDate:{...world.date,year:world.date.year-1},negative:false,revision:world.revision,globalYear:5,age:5}};
}
test('claim, response retry and cold kill persist scheduling without inventing a submitted rating or resetting with settings',async()=>{
  const c=await context();try{
    // Declared clean age-five timing boundary isolates review persistence from annual story selection.
    const world=createLife('life_review_boundary',42,{...randomCreation(42),country:'US',city:'New York',background:'ordinary'},date);world.birthAcknowledged=true;world.date={...date,year:date.year+5};Object.assign(world.people[world.activePersonId].stats,{health:90,happiness:90,stress:0});await c.repository.create(world);
    c.sqlite.prepare("INSERT INTO preferences(key,value) VALUES('app_review',?)").run(JSON.stringify(timingBoundary(world)));await c.cold();
    expect(await c.store.getState().claimReview()).toBe(true);const offer=c.store.getState().reviewOffer!;expect((await c.repository.loadReviewTracker())!.nextReviewPromptAtGlobalYear).toBe(15);
    c.sqlite.exec("CREATE TRIGGER fail_review_answer BEFORE INSERT ON preferences WHEN NEW.key='app_review' BEGIN SELECT RAISE(ABORT,'answer storage failed'); END");expect(await c.store.getState().respondReview('sure')).toBe(false);expect(c.store.getState().reviewOffer?.id).toBe(offer.id);expect((await c.repository.loadReviewTracker())!.reviewCompletedOrDismissedCount).toBe(0);
    c.sqlite.exec('DROP TRIGGER fail_review_answer');expect(await c.store.getState().respondReview('sure')).toBe(true);expect((await c.repository.loadReviewTracker())!.nextReviewPromptAtGlobalYear).toBe(22);expect((await c.repository.respondToReview(offer.id,'sure',10)).accepted).toBe(false);
    await c.repository.saveAppSettings('{}');await c.cold();expect(c.store.getState().reviewOffer).toBeNull();expect(await c.store.getState().claimReview()).toBe(false);expect(c.store.getState().reviewTracker!.reviewCompletedOrDismissedCount).toBe(1);
    const tracker=timingBoundary(c.store.getState().world!);tracker.offerSequence=1;tracker.globalYearsPlayed=22;tracker.candidate!.globalYear=22;tracker.reviewCompletedOrDismissedCount=1;c.sqlite.prepare("UPDATE preferences SET value=? WHERE key='app_review'").run(JSON.stringify(tracker));await c.cold();expect(await c.store.getState().claimReview()).toBe(true);
    const unanswered=c.store.getState().reviewOffer!;
    await c.cold();expect(await c.store.getState().claimReview()).toBe(true);
    expect(c.store.getState().reviewOffer?.id).toBe(unanswered.id);expect(c.store.getState().reviewTracker!.offerSequence).toBe(2);
    expect(c.store.getState().reviewTracker!.nextReviewPromptAtGlobalYear).toBe(32);
    expect(await c.store.getState().respondReview('later')).toBe(true);
    await c.cold();expect(await c.store.getState().claimReview()).toBe(false);
  }finally{c.close();}
});

test('five real persisted Age Ups make the first prompt due without a synthetic candidate or healthy-year filter',async()=>{
  const c=await context();try{
    await c.store.getState().startLife({...randomCreation(42),country:'US',city:'New York',background:'ordinary'},42);
    await c.store.getState().acknowledgeBirth();
    for(let age=1;age<=5;age++){
      await finishYear(c.store);
      const world=c.store.getState().world!;
      expect(ageOn(world.people[world.activePersonId],world.date)).toBe(age);
      expect((await c.repository.loadReviewTracker())?.globalYearsPlayed).toBe(age);
      expect(reviewCandidateEligible(c.store.getState().reviewTracker!,world)).toBe(age===5);
      if(age<5)expect(await c.store.getState().claimReview()).toBe(false);
    }
    const world=c.store.getState().world!,encoded=encodeWorld(world),payload=c.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(world.id)!.payload;
    await c.cold();expect(await c.store.getState().claimReview()).toBe(true);
    expect(c.store.getState().reviewOffer?.globalYear).toBe(5);
    expect(c.store.getState().reviewTracker?.candidate).toBeNull();
    expect(encodeWorld(c.store.getState().world!)).toBe(encoded);
    expect(c.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(world.id)!.payload).toBe(payload);
  }finally{c.close();}
},60000);

test('an existing age-five-or-older save with no review metadata gets its first offer without rewriting its payload',async()=>{
  const c=await context();try{
    const world=createLife('life_existing_review',42,{...randomCreation(42),country:'US',city:'New York',background:'ordinary'},date);
    world.birthAcknowledged=true;world.date={...date,year:date.year+25};
    Object.assign(world.people[world.activePersonId].stats,{health:25,happiness:10,stress:95});
    await c.repository.create(world);
    const payload=c.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(world.id)!.payload;
    expect(c.sqlite.prepare("SELECT value FROM preferences WHERE key='app_review'").get()).toBeUndefined();
    await c.cold();expect(await c.store.getState().claimReview()).toBe(true);
    expect(c.store.getState().reviewOffer).toMatchObject({lifeId:world.id,personId:world.activePersonId,revision:world.revision,globalYear:0});
    expect(c.store.getState().reviewTracker?.globalYearsPlayed).toBe(0);
    expect(c.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(world.id)!.payload).toBe(payload);
    expect(c.sqlite.prepare('SELECT command_id FROM receipts WHERE life_id=?').all(world.id)).toEqual([]);
    const first=c.store.getState().reviewOffer!;
    await c.cold();expect(await c.store.getState().claimReview()).toBe(true);expect(c.store.getState().reviewOffer?.id).toBe(first.id);
    expect(await c.repository.claimReview(world.id,world.activePersonId,world.revision+1)).toBeNull();
    expect(await c.repository.claimReview(world.id,'stale_person',world.revision)).toBeNull();
  }finally{c.close();}
});


test('a saved running mini-game blocks a Life review claim without consuming its eligible schedule',async()=>{
  const c=await context();try{
    const initial=miniGameFixture(),player=initial.people[initial.activePersonId];
    Object.assign(player.stats,{health:95,happiness:95,stress:0});
    const tracker=timingBoundary(initial);
    expect(reviewCandidateEligible(tracker,initial)).toBe(true);
    const active=resolveCommand(initial,{type:'mini-game-start',kind:'crime',ownerId:player.id,contextId:burglaryContext(initial),assisted:true},true);
    expect(active.miniGames.some(session=>session.personId===player.id&&session.status==='active')).toBe(true);
    // Deliberately align this otherwise eligible boundary with the saved attempt.
    // Even a Life caller with a matching revision must not steal the active game.
    tracker.candidate!.revision=active.revision;
    await c.repository.create(active);
    const before=JSON.stringify(tracker);
    c.sqlite.prepare("INSERT INTO preferences(key,value) VALUES('app_review',?)").run(before);
    await c.cold();
    expect(await c.store.getState().claimReview()).toBe(false);
    expect(c.store.getState().reviewOffer).toBeNull();
    expect(await c.repository.claimReview(active.id,player.id,active.revision)).toBeNull();
    expect(c.sqlite.prepare("SELECT value FROM preferences WHERE key='app_review'").get()?.value).toBe(before);
    expect((await c.repository.loadReviewTracker())!.nextReviewPromptAtGlobalYear).toBe(tracker.nextReviewPromptAtGlobalYear);
    expect((await c.repository.loadReviewTracker())!.lastReviewPromptGlobalYear).toBeNull();
  }finally{c.close();}
});
