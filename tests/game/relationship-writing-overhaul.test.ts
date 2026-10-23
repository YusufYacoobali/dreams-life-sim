import { adultRelationshipTemplates } from '../../src/game/content/adultRelationshipStories';
import { parentingTemplates } from '../../src/game/content/parentingStories';
import { laterLifeFamilyTemplates } from '../../src/game/content/laterLifeFamilyStories';
import { bindEvent, eligibleTemplates } from '../../src/game/content/events';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { countryCodes, type CountryCode } from '../../src/game/countries';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, fullName, moneyJSON } from '../../src/game/model';
import { formatMoney } from '../../src/game/money';
import { offerPending } from '../../src/game/pendingQueue';
import { accountFor, post } from '../../src/game/systems/common';
import { relationFor } from '../../src/game/systems/relationships';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { adultSocial } from '../support/adultSocial';
import { lifeStoryWorld } from '../support/lifeStory';

const selected={
  'friend-different-budget':['walk','ask','insist'],
  'friend-interrupted-thought':['finish','return','compete'],
  'friend-unwanted-nickname':['plain','light','pretend'],
  'friend-quiet-company':['quiet','check','fill'],
  'friend-changed-opinion':['explain','curious','dismiss'],
  'partner-disagreement-loop':['reflect','pause','score'],
  'partner-public-affection':['explain','ask','snap'],
  'family-baby-ordinary-song':['repeat','soft','improve'],
  'family-baby-outfit-debate':['keep','change','perfect'],
  'family-bedtime-detour':['invent','save','shush'],
  'family-game-rules-change':['agree','silly','dominate'],
  'family-impossible-question':['learn','admit','invent'],
  'family-collection-tour':['notice','limit','dismiss'],
  'family-teen-music-volume':['request','curious','insult'],
  'family-adult-inherited-phrase':['laugh','ask','lecture'],
  'family-adult-family-story':['include','compare','overrule'],
  'family-adult-new-tradition':['try','combine','refuse'],
  'later-family-photo-permission':['private','agree','snap'],
};
const templates=[...adultRelationshipTemplates,...parentingTemplates,...laterLifeFamilyTemplates];
const rewritten=templates.filter(template=>Object.hasOwn(selected,template.id));
const scene=(id:string)=>templates.find(template=>template.id===id)!;
const clamp=(value:number)=>Math.max(0,Math.min(100,value));
const social=(country:CountryCode='US')=>{const fixture=adultSocial(country);post(fixture.world,1_000_000_000n,0n,'fixture-funding','Explicit reviewed story budget');return fixture;};

test('all18 replacements preserve existing event/choice identities, have distinct complete payoffs and introduce no scripted follow-up',()=>{
  expect(rewritten).toHaveLength(18);
  for(const template of rewritten){
    expect(template.choices.map(choice=>choice.id)).toEqual(selected[template.id as keyof typeof selected]);
    expect(new Set(template.choices.map(choice=>choice.title)).size).toBe(3);
    expect(new Set(template.choices.map(choice=>choice.result)).size).toBe(3);
    expect(new Set(template.choices.map(choice=>choice.journal)).size).toBe(3);
    for(const choice of template.choices){
      expect(choice.followUp).toBeUndefined();expect(choice.result.match(/[.!?](?=\s|$)/g)).toHaveLength(2);
      if(choice.cash)expect(choice.label+choice.result+choice.journal).toContain('{money}');
    }
  }
});

test.each(rewritten.map(template=>[template.id,template] as const))('%s binds the actual eligible people and cold-resolves all three promised endings without RNG or new chains',(_id,template)=>{
  const initial=template.friend||template.partner?social().world:lifeStoryWorld(),before=encodeWorld(initial);
  expect(eligibleTemplates(initial)).toContainEqual(template);
  const event=bindEvent(initial,template),otherId=event.personIds.find(id=>id!==initial.activePersonId)!;
  expect(event.personIds).toEqual([initial.activePersonId,otherId]);expect(event.body).toContain(fullName(initial.people[otherId]));
  expect(JSON.stringify(event,moneyJSON)).not.toMatch(/\{(?:friend|partner|child|money)\}/);expect(encodeWorld(initial)).toBe(before);
  for(const choice of event.choices){
    const offered=decodeWorld(before);offerPending(offered,event);
    const frozen=unpackCheckpoint(packCheckpoint(offered),true);expect(frozen.pending).toEqual(event);
    const command={type:'choose' as const,eventId:event.id,choiceId:choice.id},result=resolveCommand(frozen,command,true);
    expect(result.pending).toMatchObject({kind:'result',title:choice.resultTitle,body:choice.resultBody});expect(result.journal.at(-1)?.text).toBe(choice.journal);
    expect(result.random).toEqual(initial.random);expect(result.date).toEqual(initial.date);expect(result.storyThreads).toEqual(initial.storyThreads);
    expect(result.assets).toEqual(initial.assets);expect(result.liabilities).toEqual(initial.liabilities);expect(result.marriages).toEqual(initial.marriages);expect(result.households).toEqual(initial.households);
    expect(Object.keys(result.people)).toEqual(Object.keys(initial.people));
    for(const person of Object.values(initial.people)){expect(result.people[person.id].appearance).toEqual(person.appearance);expect(result.people[person.id].education).toEqual(person.education);expect(result.people[person.id].employment).toEqual(person.employment);}
    const immediate=choice.effects.find(effect=>effect.kind==='story-immediate'),cash=immediate?.kind==='story-immediate'?immediate.cash:undefined;
    expect(result.accounts).toEqual(initial.accounts.map(account=>cash?.accountId===account.id?{...account,cash:account.cash+cash.minor}:account));
    expect(result.ledger.slice(0,initial.ledger.length)).toEqual(initial.ledger);expect(result.ledger).toHaveLength(initial.ledger.length+(cash?1:0));
    for(const edge of initial.relationships){
      const bond=choice.effects.find(effect=>effect.kind==='relationship'&&effect.relationshipId===edge.id),trust=immediate?.kind==='story-immediate'?immediate.trust?.find(target=>target.relationshipId===edge.id):undefined;
      const actual=result.relationships.find(row=>row.id===edge.id)!;
      expect(actual.strength).toBe(clamp(edge.strength+(bond?.kind==='relationship'?bond.delta:0)));expect(actual.trust).toBe(clamp(edge.trust+(trust?.delta??0)));
      if(!bond&&!trust)expect(actual).toEqual(edge);
    }
    expect(encodeWorld(unpackCheckpoint(packCheckpoint(result),true))).toBe(encodeWorld(result));expect(()=>resolveCommand(result,command,true)).toThrow();
    const done=resolveCommand(result,{type:'acknowledge',resultId:result.pending!.id},true);expect(done.pending).toBeNull();expect(done.storyThreads).toEqual(initial.storyThreads);expect(done.random).toEqual(initial.random);
  }
  expect(encodeWorld(initial)).toBe(before);
});

test.each(countryCodes)('%s face cake charges its exact frozen local quote once and never creates a marriage, asset or money for the friend',country=>{
  const {world,friendId}=social(country),before=encodeWorld(world),event=bindEvent(world,scene('friend-different-budget')),choice=event.choices.find(row=>row.id==='ask')!;
  const immediate=choice.effects.find(effect=>effect.kind==='story-immediate');if(immediate?.kind!=='story-immediate'||!immediate.cash)throw new Error('Missing actual cake quote');
  const cash=immediate.cash,quoted=formatMoney({minor:-cash.minor,currency:cash.currency});
  expect(cash.usdWhole).toBe(-120);expect(cash.minor).toBeLessThan(0n);expect(choice.label).toContain(quoted);expect(choice.resultBody).toContain(quoted);expect(choice.journal).toContain(quoted);
  offerPending(world,event);const frozen=unpackCheckpoint(packCheckpoint(world),true),result=resolveCommand(frozen,{type:'choose',eventId:event.id,choiceId:choice.id},true);
  expect(accountFor(result).cash).toBe(accountFor(world).cash+cash.minor);expect(accountFor(result,result.people[friendId])).toEqual(accountFor(world,world.people[friendId]));
  expect(result.ledger.at(-1)).toMatchObject({category:'story-expense',cashDelta:cash.minor,currency:cash.currency});expect(result.random).toEqual(world.random);expect(result.assets).toEqual(world.assets);expect(result.marriages).toEqual(world.marriages);
  const done=resolveCommand(result,{type:'acknowledge',resultId:result.pending!.id},true);expect(()=>resolveCommand(done,{type:'choose',eventId:event.id,choiceId:choice.id},true)).toThrow();expect(done.ledger).toEqual(result.ledger);
  expect(encodeWorld(world)).not.toBe(before);expect(world.accounts).toEqual(frozen.accounts);
});

test('an unaffordable cake remains disabled after cold save while both free refusals remain available',()=>{
  const {world}=adultSocial();post(world,-accountFor(world).cash,0n,'fixture-spending','Explicit zero-cash affordability boundary');
  const event=bindEvent(world,scene('friend-different-budget'));offerPending(world,event);const frozen=unpackCheckpoint(packCheckpoint(world),true),before=encodeWorld(frozen);
  const paid=event.choices.find(choice=>choice.id==='ask')!;expect(choiceUnavailable(frozen,paid)).toMatch(/funds/);
  for(const id of ['walk','insist'])expect(choiceUnavailable(frozen,event.choices.find(choice=>choice.id===id)!)).toBeUndefined();
  expect(()=>resolveCommand(frozen,{type:'choose',eventId:event.id,choiceId:paid.id},true)).toThrow(/funds/);expect(encodeWorld(frozen)).toBe(before);
});

test('ending the wedding prank ends only the actual friendship, preserving coworker identity and every marriage and account',()=>{
  const {world,friendId,partnerId}=adultSocial(),friend=relationFor(world,world.activePersonId,friendId)!,partner=relationFor(world,world.activePersonId,partnerId)!;
  const event=bindEvent(world,scene('friend-quiet-company'));offerPending(world,event);
  const result=resolveCommand(unpackCheckpoint(packCheckpoint(world),true),{type:'choose',eventId:event.id,choiceId:'fill'},true),ended=relationFor(result,result.activePersonId,friendId)!;
  expect(ended.roles).not.toContain('friend');expect(ended.roles).toContain('coworker');expect(ended.kind).toBe('coworker');expect(ended.strength).toBe(clamp(friend.strength-30));expect(ended.trust).toBe(clamp(friend.trust-25));
  expect(ended.memories).toEqual([...friend.memories,'friendship-ended:'+world.date.year]);expect(relationFor(result,result.activePersonId,partnerId)).toEqual(partner);
  expect(result.accounts).toEqual(world.accounts);expect(result.marriages).toEqual(world.marriages);expect(result.random).toEqual(world.random);
});

test.each([['family-teen-music-volume','insult'],['family-adult-family-story','overrule']] as const)('%s betrayal applies its promised major damage only to the bound child', (id,choiceId)=>{
  const world=lifeStoryWorld(),event=bindEvent(world,scene(id)),childId=event.personIds[1],edge=relationFor(world,world.activePersonId,childId)!;offerPending(world,event);
  const result=resolveCommand(unpackCheckpoint(packCheckpoint(world),true),{type:'choose',eventId:event.id,choiceId},true),after=relationFor(result,result.activePersonId,childId)!;
  expect(after.strength).toBe(clamp(edge.strength-25));expect(after.trust).toBe(clamp(edge.trust-20));
  for(const other of world.relationships)if(other.id!==edge.id)expect(result.relationships.find(row=>row.id===other.id)).toEqual(other);
  expect(result.accounts).toEqual(world.accounts);expect(result.people).toEqual({...world.people,[world.activePersonId]:result.people[world.activePersonId]});expect(result.random).toEqual(world.random);
});

test('a previously stored quiet-company choice keeps its old prose and small bond gain instead of acquiring the new wedding prank or trust loss',()=>{
  const {world,friendId}=adultSocial(),friend=fullName(world.people[friendId]),edge=relationFor(world,world.activePersonId,friendId)!;
  // Explicit old bound-decision boundary, using the previous literal content.
  // The current catalogue must never be consulted when resolving this payload.
  const event=bindEvent(world,scene('friend-quiet-company'));
  event.title='Nothing needs saying';event.body='You are sitting with '+friend+'. For once the silence seems comfortable. Part of you still wants to fill it with a review of the weather.';
  event.choices=[
    {id:'quiet',label:'Enjoy a little quiet together',effects:[{kind:'stat',personId:world.activePersonId,stat:'stress',delta:-4},{kind:'stat',personId:world.activePersonId,stat:'energy',delta:2},{kind:'relationship',relationshipId:edge.id,delta:3}],resultTitle:'Company without commentary',resultBody:friend+' settles back too. Neither of you has to earn the other person’s company by talking.',journal:'I enjoyed some quiet company with '+friend+'.'},
    {id:'check',label:'Ask if the quiet is comfortable',effects:[{kind:'stat',personId:world.activePersonId,stat:'respect',delta:2},{kind:'stat',personId:world.activePersonId,stat:'stress',delta:-2},{kind:'relationship',relationshipId:edge.id,delta:2}],resultTitle:'A short answer, then quiet',resultBody:friend+' says it is. You stop treating the pause as a problem.',journal:'I checked that '+friend+' was comfortable with a quiet moment.'},
    {id:'fill',label:'Keep talking to cover every pause',effects:[{kind:'stat',personId:world.activePersonId,stat:'energy',delta:-3},{kind:'stat',personId:world.activePersonId,stat:'stress',delta:2}],resultTitle:'An exhausting weather report',resultBody:'You find several things to say about the same cloud. '+friend+' does not seem to have needed the update.',journal:'I talked through a comfortable silence with '+friend+'.'},
  ];
  offerPending(world,event);const saved=unpackCheckpoint(packCheckpoint(world),true);expect(saved.pending).toEqual(event);
  const result=resolveCommand(saved,{type:'choose',eventId:event.id,choiceId:'quiet'},true),after=relationFor(result,result.activePersonId,friendId)!;
  expect(after).toEqual({...edge,strength:clamp(edge.strength+3)});expect(result.pending).toMatchObject({title:'Company without commentary',body:event.choices[0].resultBody});
  expect(result.journal.at(-1)?.text).toBe(event.choices[0].journal);expect(result.accounts).toEqual(world.accounts);expect(result.random).toEqual(world.random);expect(result.marriages).toEqual(world.marriages);
});
