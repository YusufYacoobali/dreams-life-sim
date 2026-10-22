import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { randomInteger } from '../../src/game/random';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { createContact } from '../../src/game/systems/npcs';
import { accountFor, availableCash, post } from '../../src/game/systems/common';
import { familyFinanceMonth } from '../../src/game/systems/family';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import { loanOfferReason, supportAmountOptions, supportGenerosity, supportRequestReason } from '../../src/game/systems/personSupport';
import type { PersonSupportCommand } from '../../src/game/systems/personSupportSchemas';
import graduate from '../fixtures/v3-employed-graduate.json';

function roll(world:World,wanted:number) {
  for(let seed=1;seed<100000;seed++)if(randomInteger(seed,1,100).value===wanted){world.random.outcomes=seed;return;}
  throw new Error('No seed for chosen decision');
}
function fixture(country?:'GB') {
  const world=decodeWorld(JSON.stringify(graduate)),actor=world.people[world.activePersonId],target=createContact(world,{age:30,country,city:country?undefined:actor.city});
  target.traits=['kind'];target.stats.energy=100;
  const account=accountFor(world,target);account.cash=1000000n;account.openingCash=1000000n;account.lockedCash=0n;
  world.relationships.push({id:'relation_support',from:actor.id,to:target.id,kind:'friend',roles:['friend'],romance:'none',since:{...world.date},parentType:null,strength:90,trust:90,memories:[],lastInteractionYear:world.date.year});
  roll(world,10);return {world:validateWorld(world),targetId:target.id};
}
const ask=(world:World,targetId:string,kind:'money'|'loan'='money',amount=1000n):Extract<PersonSupportCommand,{type:'ask-person-support'}>=>({type:'ask-person-support',lifeId:world.id,actorId:world.activePersonId,personId:targetId,kind,amount,currency:accountFor(world,world.people[targetId]).currency});
const reply=(world:World,accept=true):Extract<PersonSupportCommand,{type:'respond-person-loan'}>=>({type:'respond-person-loan',lifeId:world.id,actorId:world.activePersonId,requestId:world.personSupportRequests.at(-1)!.id,accept});
const acknowledge=(world:World)=>world.pending?.kind==='result'?resolveCommand(world,{type:'acknowledge',resultId:world.pending.id}):world;

test('free and partial help debit actual available lender cash and never fabricate a loan',()=>{
  for(const amount of [1000n,500000n]) {
    const {world,targetId}=fixture(),before=world.accounts.reduce((sum,row)=>sum+row.cash,0n),source=accountFor(world,world.people[targetId]).cash,actor=accountFor(world).cash;
    const next=resolveCommand(world,ask(world,targetId,'money',amount)),row=next.personSupportRequests[0];
    expect(row.outcome).toBe(amount===1000n?'gift':'partial');expect(row.offered).toBe(amount===1000n?1000n:250000n);
    expect(accountFor(next, next.people[targetId]).cash).toBe(source-row.offered);expect(accountFor(next).cash).toBe(actor+row.offered);
    expect(next.accounts.reduce((sum,item)=>sum+item.cash,0n)).toBe(before);expect(next.liabilities).toEqual(world.liabilities);
    expect(unpackCheckpoint(packCheckpoint(next))).toEqual(next);expect(decodeWorld(encodeWorld(next))).toEqual(next);
    const done=acknowledge(next),saved=encodeWorld(done);expect(()=>resolveCommand(done,ask(done,targetId,'loan'))).toThrow(/already asked/);expect(encodeWorld(done)).toBe(saved);
  }
});

test('refusal, annoyance and locked inheritance use real resources without overdrawing or granting support',()=>{
  for(const mode of ['refused','annoyed','locked'] as const){
    const setup=fixture(),world=copyWorld(setup.world),target=world.people[setup.targetId],relation=relationFor(world,world.activePersonId,target.id)!;
    if(mode==='refused'){target.traits=['reserved'];roll(world,90);}
    if(mode==='annoyed'){relation.strength=10;roll(world,100);}
    if(mode==='locked')accountFor(world,target).lockedCash=accountFor(world,target).cash;
    const before=world.accounts.map(row=>row.cash),next=resolveCommand(validateWorld(world),ask(world,target.id));
    expect(next.personSupportRequests[0].outcome).toBe(mode==='locked'?'refused':mode);expect(next.accounts.map(row=>row.cash)).toEqual(before);expect(next.liabilities).toEqual(world.liabilities);
    if(mode==='annoyed')expect(relationFor(next,next.activePersonId,target.id)!.strength).toBe(5);
  }
  expect(supportGenerosity(['kind','impulsive'])).toBeGreaterThan(supportGenerosity(['practical','reserved']));
});

test('loan offers survive reload, require explicit consent and repay to the actual creditor once',()=>{
  const {world,targetId}=fixture(),offered=resolveCommand(world,ask(world,targetId,'loan'));
  expect(offered.personSupportRequests[0].status).toBe('offered');expect(offered.liabilities).toEqual(world.liabilities);expect(offered.accounts).toEqual(world.accounts);
  const saved=acknowledge(decodeWorld(encodeWorld(offered))),accepted=resolveCommand(saved,reply(saved)),row=accepted.personSupportRequests[0],debt=accepted.liabilities.find(item=>item.id===row.liabilityId)!;
  expect(debt).toMatchObject({ownerId:world.activePersonId,creditorId:targetId,principal:1000n,interestBps:0,kind:'personal'});
  expect(accepted.accounts.reduce((sum,item)=>sum+item.cash,0n)).toBe(world.accounts.reduce((sum,item)=>sum+item.cash,0n));
  const monthly=copyWorld(accepted);familyFinanceMonth(monthly);expect(monthly.liabilities.find(item=>item.id===debt.id)!.principal).toBe(1000n);
  const ready=acknowledge(accepted),unchanged=encodeWorld(ready);expect(()=>resolveCommand(ready,reply(ready))).toThrow(/no longer open/);expect(encodeWorld(ready)).toBe(unchanged);
  const lenderCash=accountFor(ready,ready.people[targetId]).cash,repaid=resolveCommand(ready,{type:'repay',liabilityId:debt.id,amount:1000n});
  expect(repaid.liabilities.find(item=>item.id===debt.id)!.principal).toBe(0n);expect(accountFor(repaid,repaid.people[targetId]).cash).toBe(lenderCash+1000n);
});

test('decline, stale acceptance and insufficient lender cash cannot create or duplicate debt',()=>{
  const {world,targetId}=fixture(),offered=acknowledge(resolveCommand(world,ask(world,targetId,'loan'))),declined=resolveCommand(offered,reply(offered,false));
  expect(declined.personSupportRequests[0].status).toBe('declined');expect(declined.accounts).toEqual(world.accounts);expect(declined.liabilities).toEqual(world.liabilities);
  const poor=copyWorld(offered),lender=poor.people[targetId];post(poor,-availableCash(accountFor(poor,lender))+1n,0n,'test-expense','Actual expense',null,lender);
  const validated=validateWorld(poor),before=encodeWorld(validated);expect(loanOfferReason(validated,offered.personSupportRequests[0].id)).toMatch(/enough available/);
  expect(()=>resolveCommand(validated,reply(validated))).toThrow(/enough available/);expect(encodeWorld(validated)).toBe(before);
  for(const field of ['lifeId','actorId'] as const)expect(()=>resolveCommand(offered,{...reply(offered),[field]:'other'})).toThrow(/life changed/);
  const dead=copyWorld(offered);recordDeath(dead,targetId,'Test mortality');expect(dead.personSupportRequests[0].status).toBe('expired');expect(dead.personSupportRequests[0].liabilityId).toBeNull();
});

test('foreign-currency help conserves that currency and a stale request cannot reinterpret the amount',()=>{
  const {world,targetId}=fixture('GB'),command=ask(world,targetId),next=resolveCommand(world,command);
  expect(next.personSupportRequests[0].currency).toBe('GBP');expect(accountFor(next,next.people[next.activePersonId],'GBP').cash).toBe(1000n);
  expect(next.accounts.filter(row=>row.currency==='GBP').reduce((sum,row)=>sum+row.cash,0n)).toBe(world.accounts.filter(row=>row.currency==='GBP').reduce((sum,row)=>sum+row.cash,0n));
  expect(()=>resolveCommand(world,{...command,currency:'JPY'})).toThrow(/currency changed/);
});

test('eligibility, presets and contradictory funding remain explicit',()=>{
  const {world,targetId}=fixture();expect(supportAmountOptions(world,targetId,'money')).toHaveLength(3);expect(supportRequestReason(world,'person_missing','money')).toBeDefined();
  const unsupported=copyWorld(world);relationFor(unsupported,unsupported.activePersonId,targetId)!.roles=['teacher'];relationFor(unsupported,unsupported.activePersonId,targetId)!.kind='teacher';expect(supportAmountOptions(unsupported,targetId,'money')).toEqual([]);
  const funded=resolveCommand(world,ask(world,targetId));
  for(const change of [(next:World)=>{next.personSupportRequests[0].creditId=null;},(next:World)=>{next.personSupportRequests[0].offered++;},(next:World)=>{next.personSupportRequests[0].chance=5;},(next:World)=>{next.actionCounts={};}]){
    const changed=copyWorld(funded);change(changed);expect(()=>validateWorld(changed)).toThrow();
  }
});
