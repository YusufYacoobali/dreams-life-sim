import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { createLife, randomCreation } from '../../src/game/createLife';
import { randomInteger } from '../../src/game/random';
import { createContact } from '../../src/game/systems/npcs';
import { accountFor } from '../../src/game/systems/common';
import { personActionOptions, personActionReason, type PersonAction } from '../../src/game/systems/personInteractions';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import graduate from '../fixtures/v3-employed-graduate.json';

function roll(world:World,wanted:number){for(let seed=1;seed<100000;seed++)if(randomInteger(seed,1,100).value===wanted){world.random.outcomes=seed;return;}throw new Error('Missing test roll');}
const action=(world:World,personId:string,id:PersonAction)=>({type:'person-action' as const,lifeId:world.id,actorId:world.activePersonId,personId,action:id});
const done=(world:World)=>world.pending?.kind==='result'?resolveCommand(world,{type:'acknowledge',resultId:world.pending.id}):world;
function child(){const world=createLife('life_permission',22,randomCreation(22),{year:2026,month:1,day:1});world.birthAcknowledged=true;world.people[world.activePersonId].born.year-=10;const parent=world.relationships.find(row=>row.to===world.activePersonId&&row.roles.includes('parent'))!.from;world.people[parent].traits=['kind'];const relation=relationFor(world,world.activePersonId,parent)!;relation.strength=90;relation.trust=90;roll(world,10);return {world:validateWorld(world),parent};}
function adult(){const world=decodeWorld(JSON.stringify(graduate)),actor=world.people[world.activePersonId],peer=createContact(world,{age:30,city:actor.city});peer.traits=['kind'];const cash=accountFor(world,peer);cash.cash=10000000n;cash.openingCash=10000000n;world.relationships.push({id:'relation_actions',from:actor.id,to:peer.id,kind:'partner',roles:['partner'],romance:'dating',since:{...world.date},parentType:null,strength:90,trust:90,memories:[],lastInteractionYear:world.date.year});actor.attractedTo=[peer.gender];peer.attractedTo=[actor.gender];roll(world,10);return {world:validateWorld(world),peerId:peer.id};}

test('parental advice has real effects and saved permission enables exactly one free shared outing',()=>{
  const setup=child(),before=encodeWorld(setup.world);expect(personActionReason(setup.world,setup.parent,'ask-activity')).toMatch(/permission/);
  expect(()=>resolveCommand(setup.world,action(setup.world,setup.parent,'ask-activity'))).toThrow(/permission/);expect(encodeWorld(setup.world)).toBe(before);
  const advice=done(resolveCommand(setup.world,action(setup.world,setup.parent,'ask-advice')));expect(advice.people[advice.activePersonId].stats.smarts).toBeGreaterThan(setup.world.people[setup.world.activePersonId].stats.smarts);
  const permitted=done(resolveCommand(advice,action(advice,setup.parent,'ask-permission'))),reloaded=decodeWorld(encodeWorld(permitted)),energy=reloaded.people[reloaded.activePersonId].stats.energy;
  const outing=resolveCommand(reloaded,action(reloaded,setup.parent,'ask-activity'));expect(outing.personActionHistory.at(-1)!.permissionId).toBe(permitted.personActionHistory.at(-1)!.id);expect(outing.people[outing.activePersonId].stats.energy).toBe(energy-4);expect(outing.accounts).toEqual(permitted.accounts);
  const ready=done(outing);expect(()=>resolveCommand(ready,action(ready,setup.parent,'ask-activity'))).toThrow(/Already tried/);expect(decodeWorld(encodeWorld(outing))).toEqual(outing);
});

test('a refused outing permission cannot be spent or turned into an invisible approval',()=>{
  const setup=child(),world=copyWorld(setup.world);roll(world,100);const refused=done(resolveCommand(world,action(world,setup.parent,'ask-permission')));expect(refused.personActionHistory[0].outcome).toBe('declined');expect(personActionReason(refused,setup.parent,'ask-activity')).toMatch(/permission/);
});

test('requested gifts are real possessions purchased from the consenting partner balance',()=>{
  const {world,peerId}=adult(),balance=accountFor(world,world.people[peerId]).cash,next=resolveCommand(world,action(world,peerId,'request-gift')),record=next.personActionHistory[0],asset=next.assets.find(row=>row.id===record.assetId)!;
  expect(record.outcome).toBe('approved');expect(asset).toMatchObject({ownerId:world.activePersonId,catalogId:'watch',ownershipSource:'gift'});expect(accountFor(next,next.people[peerId]).cash).toBe(balance-asset.pricePaid);expect(accountFor(next).cash).toBe(accountFor(world).cash);expect(next.liabilities).toEqual(world.liabilities);
  const declined=copyWorld(world);roll(declined,100);const refused=resolveCommand(declined,action(declined,peerId,'request-gift'));expect(refused.personActionHistory[0].outcome).toBe('declined');expect(refused.assets).toEqual(world.assets);expect(refused.accounts).toEqual(world.accounts);
});

test('conflict changes actual affection and trust without erasing family roles or history',()=>{
  const setup=child(),world=copyWorld(setup.world);world.people[world.activePersonId].born.year-=3;const before=relationFor(world,world.activePersonId,setup.parent)!;
  const insult=done(resolveCommand(validateWorld(world),action(world,setup.parent,'insult')));expect(relationFor(insult,insult.activePersonId,setup.parent)!.strength).toBe(before.strength-10);expect(relationFor(insult,insult.activePersonId,setup.parent)!.memories).toContain('argument:'+world.date.year);
  const distance=resolveCommand(insult,action(insult,setup.parent,'distance'));expect(relationFor(distance,distance.activePersonId,setup.parent)!.roles).toEqual(before.roles);expect(distance.people).toMatchObject({[setup.parent]:{id:setup.parent}});
  expect(personActionOptions(setup.world,setup.parent).map(row=>row.id)).not.toContain('request-gift');expect(personActionReason(setup.world,setup.parent,'praise')).toBeDefined();
});

test('child praise, discipline and later-life help have specific eligible effects',()=>{
  const setup=child(),world=copyWorld(setup.world),childId=world.activePersonId;world.activePersonId=setup.parent;const relation=relationFor(world,world.activePersonId,childId)!;
  const praise=done(resolveCommand(validateWorld(world),action(world,childId,'praise')));expect(praise.people[childId].stats.discipline).toBeGreaterThanOrEqual(world.people[childId].stats.discipline);expect(relationFor(praise,praise.activePersonId,childId)!.strength).toBeGreaterThan(relation.strength);
  const scold=resolveCommand(praise,action(praise,childId,'scold'));expect(scold.people[childId].stats.discipline).toBeGreaterThanOrEqual(praise.people[childId].stats.discipline);
  // A separate older family keeps the earlier child's birth and both parents'
  // genealogy intact; turning that child into an adult would rewrite history.
  const prepared=decodeWorld(JSON.stringify(graduate)),caregiver=createContact(prepared,{age:55}),grownChild=createContact(prepared,{age:25,city:caregiver.city});
  prepared.activePersonId=caregiver.id;prepared.people[caregiver.id].stats.stress=60;grownChild.traits=['kind'];
  prepared.relationships.push({id:'relation_adult_child_help',from:caregiver.id,to:grownChild.id,kind:'parent',roles:['parent'],romance:'none',since:{...prepared.date},parentType:'biological',strength:90,trust:90,memories:[],lastInteractionYear:prepared.date.year});
  roll(prepared,10);
  const helped=resolveCommand(validateWorld(prepared),action(prepared,grownChild.id,'ask-help'));expect(helped.people[helped.activePersonId].stats.stress).toBe(52);expect(helped.people[grownChild.id].stats.energy).toBe(prepared.people[grownChild.id].stats.energy-4);
});

test('stale people/lives and invented permissions or gift funding reject without mutating input',()=>{
  const setup=child(),before=encodeWorld(setup.world);expect(()=>resolveCommand(setup.world,{...action(setup.world,setup.parent,'ask-advice'),lifeId:'life_other'})).toThrow(/life changed/);expect(encodeWorld(setup.world)).toBe(before);
  const adultSetup=adult(),funded=resolveCommand(adultSetup.world,action(adultSetup.world,adultSetup.peerId,'request-gift')),bad=copyWorld(funded);bad.personActionHistory[0].transactionId=null;expect(()=>validateWorld(bad)).toThrow();
});
