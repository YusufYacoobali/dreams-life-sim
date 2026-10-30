import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { randomInteger } from '../../src/game/random';
import { formatMoney } from '../../src/game/money';
import { moneySupportBody, personActionBody, personReference } from '../../src/game/content/personInteractionWriting';
import { writeConversation, type ConversationContext, type ConversationTopic } from '../../src/game/content/conversationWriting';
import { accountFor } from '../../src/game/systems/common';
import { createContact } from '../../src/game/systems/npcs';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import { dateBudget } from '../../src/game/systems/relationships';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { pupil } from '../support/pupil';
import graduate from '../fixtures/v3-employed-graduate.json';

const concise=(body:string)=>{
  expect(body.match(/[.!?](?=\s|$)/g)?.length??0).toBeGreaterThanOrEqual(1);
  expect(body.match(/[.!?](?=\s|$)/g)?.length??0).toBeLessThanOrEqual(2);
};
const acknowledge=(world:World)=>world.pending?.kind==='result'?resolveCommand(world,{type:'acknowledge',resultId:world.pending.id}):world;
function chooseRoll(world:World,value:number){for(let seed=1;seed<100000;seed++)if(randomInteger(seed,1,100).value===value){world.random.outcomes=seed;return;}throw new Error('No seed for fixture');}
function supportFixture(){
  const world=decodeWorld(JSON.stringify(graduate)),actor=world.people[world.activePersonId],target=createContact(world,{age:30,city:actor.city});
  target.traits=['kind'];const account=accountFor(world,target);account.cash=1000000n;account.openingCash=1000000n;
  world.relationships.push({id:'relation_copy_support',from:actor.id,to:target.id,kind:'friend',roles:['friend'],romance:'none',since:{...world.date},parentType:null,strength:90,trust:90,memories:[],lastInteractionYear:world.date.year});
  chooseRoll(world,10);return {world:validateWorld(world),targetId:target.id};
}

test('role-specific ordinary writing is concise and never invents achievements, weather or purchases',()=>{
  const random=jest.spyOn(Math,'random').mockImplementation(()=>{throw new Error('Copy may not draw randomness');});
  try {
    const reference=personReference('Sam','Adoptive Father');
    for(const action of ['insult','distance','praise','scold','ask-permission','ask-activity','ask-advice','ask-help','request-gift'] as const)for(const approved of [false,true]){
      const body=personActionBody(action,reference,approved,{name:'Mechanical Watch',price:'£100.00'});concise(body);
      expect(body.toLowerCase()).toContain('your adoptive father, sam');expect(body).not.toMatch(/weather|achievement|won a|birthday|phone|promotion/);
      if(action==='request-gift'&&approved){expect(body).toContain('£100.00');expect(body).toContain('upkeep');}
      if(action==='ask-permission'&&approved)expect(body).toContain('one free outing');
    }
    expect(personReference('Sam','Engaged')).toBe('your partner, Sam');expect(random).not.toHaveBeenCalled();
  }finally{random.mockRestore();}
});

test.each(['talk','compliment','spend-time','argue','apologise'] as const)('%s keeps its original single draw and real costs while using role-aware copy/art',action=>{
  const world=decodeWorld(JSON.stringify(graduate)),targetId='person_parent2';
  if(action==='apologise')relationFor(world,world.activePersonId,targetId)!.memories.push('argument:'+world.date.year);
  const original=encodeWorld(world),range=action==='talk'?[3,6]:action==='spend-time'?[6,10]:action==='argue'?[8,14]:[1,100];
  const expected=randomInteger(world.random.outcomes,range[0],range[1]).state;
  const next=resolveCommand(world,{type:'interact',personId:targetId,action});
  expect(next.random).toEqual({...world.random,outcomes:expected});concise(next.pending!.body);
  expect(next.pending!.body.toLowerCase()).toContain('your father');expect(next.pending!.illustration).toBe('person-action:'+action);
  expect(next.pending!.body).not.toMatch(/phone|discussion about food|weather|movie|restaurant/);
  if(action==='spend-time'){
    const cost=dateBudget(world)/2n;expect(next.pending!.body).toContain(formatMoney({minor:cost,currency:accountFor(world).currency}));
    expect(accountFor(world).cash-accountFor(next).cash).toBe(cost);
  }
  expect(encodeWorld(world)).toBe(original);
});

test.each(['gift','partial','refused','annoyed','loan'] as const)('%s support preserves its decision draw, truthful amount and obligations in at most two sentences',kind=>{
  const setup=supportFixture(),world=copyWorld(setup.world),target=world.people[setup.targetId];
  if(kind==='refused'){target.traits=['reserved'];chooseRoll(world,90);}if(kind==='annoyed')chooseRoll(world,100);
  const amount=kind==='partial'?500000n:1000n,currency=accountFor(world,target).currency,expected=randomInteger(world.random.outcomes,1,100).state;
  const next=resolveCommand(world,{type:'ask-person-support',lifeId:world.id,actorId:world.activePersonId,personId:target.id,kind:kind==='loan'?'loan':'money',amount,currency});
  expect(next.random).toEqual({...world.random,outcomes:expected});concise(next.pending!.body);expect(next.pending!.body).toContain(kind==='loan'?'Your friend, '+target.firstName:target.firstName);
  expect(next.pending!.body).toContain(formatMoney({minor:kind==='partial'?next.personSupportRequests[0].offered:amount,currency}));
  if(kind==='gift'||kind==='partial'){
    expect(next.liabilities).toEqual(world.liabilities);expect(next.personSupportRequests[0]).toMatchObject({status:'completed',liabilityId:null});
    expect(next.ledger.some(row=>row.category==='person-support-gift'&&row.personId===world.activePersonId&&row.cashDelta===next.personSupportRequests[0].offered)).toBe(true);
    expect(next.pending!.body).not.toContain('No repayment required');
  }
  if(kind==='partial')expect(next.pending!.body).toContain(formatMoney({minor:amount,currency}));
  if(kind==='loan'){
    expect(next.pending!.body).toMatch(/interest-free/);expect(next.pending!.body).toMatch(/accepting means you owe/);expect(next.liabilities).toEqual(world.liabilities);
    const offered=acknowledge(next),offer=offered.personSupportRequests[0];
    for(const accept of [false,true]){
      const resolved=resolveCommand(offered,{type:'respond-person-loan',lifeId:offered.id,actorId:offered.activePersonId,requestId:offer.id,accept});concise(resolved.pending!.body);
      expect(resolved.random).toEqual(offered.random);expect(resolved.pending!.body).toContain(formatMoney({minor:offer.offered,currency}));
      expect(resolved.pending!.body).toMatch(accept?/interest-free, but you do owe it back/:/No new debt/);
      expect(resolved.pending!.illustration).toBe('person-action:'+(accept?'accept-loan':'decline-loan'));
    }
  }
});

test('money replies use natural saved-role language and exact amounts without drawing or inventing a setting',()=>{
  const random=jest.spyOn(Math,'random').mockImplementation(()=>{throw new Error('Copy may not draw randomness');});
  try {
    expect(moneySupportBody('Morgan','Father','gift','$500.00')).toBe('Your dad gives you $500.00. He adds a brief reminder that this is help, not a new income stream.');
    expect(moneySupportBody('Morgan','Adoptive Mother','gift','$500.00')).toBe('Your mum gives you $500.00. She sends the help without asking you to perform gratitude in instalments.');
    expect(moneySupportBody('Sam','Friend','gift','$500.00')).toBe('Sam gives you $500.00. You thank them before friendship can acquire a customer-service department.');
    expect(moneySupportBody('Sam','Partner','refused','$500.00')).toBe('Your partner says no to $500.00. Being together has not made your budgets identical.');
    expect(moneySupportBody('Sam','Former partner','refused','$500.00')).toBe('Sam says no to $500.00. Repeating the amount would not make it a different question.');
    for(const role of ['Father','Mother','Adoptive Father','Adoptive Mother','Parent','Guardian','Friend','Best friend','Partner','Spouse','Engaged','Son','Daughter','Adopted Son','Brother','Sister','Sibling'])for(const outcome of ['gift','partial','refused','annoyed'] as const){
      const body=moneySupportBody('Morgan',role,outcome,'$500.00','$50.00',false);concise(body);
      expect(body).toContain(outcome==='gift'?'$50.00':'$500.00');if(outcome==='partial')expect(body).toContain('$50.00');
      expect(body).not.toMatch(/No repayment required|No money changed hands|at home|at the bank|visited|birthday|weather/);
    }
    expect(random).not.toHaveBeenCalled();
  }finally{random.mockRestore();}
});

test('conversation setting and actual subject facts fit within two sentences without changing supplied context',()=>{
  const context:ConversationContext={targetName:'Sam Carter',targetFirstName:'Sam',actorAge:30,targetAge:55,actorStress:70,targetStress:20,trust:80,setting:'ordinary',familyRole:'parent',relationshipRole:'Father',interest:{person:'them',label:'Guitar'},school:{person:'you',name:'Riverside College',field:'computing',status:'paused'},work:{person:'them',title:'Teacher',employer:'Riverside School',status:'current'}};
  const before=JSON.stringify(context);
  for(const setting of ['ordinary','apart','hospital','custody'] as const)for(const topic of ['everyday','interests','family','school','work','feelings'] as ConversationTopic[])for(const outcome of ['open','reserved'] as const){
    const writing=writeConversation({...context,setting},topic,outcome);concise(writing.body);
    expect(writing.body).not.toMatch(/weather|promotion|new job|cured|visited you|phone/);
  }
  expect(writeConversation(context,'family','open').body).toContain('your father, Sam,');expect(JSON.stringify(context)).toBe(before);
});

test.each([true,false])('academic help uses its actual teacher and original draw with concise %s outcome',accepted=>{
  const world=pupil(),school=currentSchool(world)!;chooseRoll(world,accepted?10:100);
  const before=encodeWorld(world),expected=randomInteger(world.random.outcomes,1,100).state;
  const next=resolveCommand(world,{type:'school-help',communityId:school.id,teacherId:school.currentTeacherId});
  concise(next.pending!.body);expect(next.pending!.body).toContain(world.people[school.currentTeacherId].firstName);
  expect(next.pending!.illustration).toBe('person-action:academic-help');expect(next.random).toEqual({...world.random,outcomes:expected});
  const help=currentSchool(next)!.help[0];expect(help.accepted).toBe(accepted);
  expect(next.people[world.activePersonId].education.grades).toBe(help.gradeBefore+help.gradeGain);expect(encodeWorld(world)).toBe(before);
});
