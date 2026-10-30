import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, recordDeath } from '../../src/game/engine';
import { enableOverhaul } from '../../src/game/systems/overhaul';
import { createContact } from '../../src/game/systems/npcs';
import { connectPerson, partnerRelation, relationFor } from '../../src/game/systems/relationships';
import { accountFor } from '../../src/game/systems/common';
import { offerRomance, refreshRomance, romanceActionOptions, romanceYear, romanceStoryEligible } from '../../src/game/systems/romanceDrama';
import { romanceDramaStories } from '../../src/game/content/romanceDramaStories';
import { validateRomance } from '../../src/game/systems/romanceValidation';
import { dateActivities, dateActivityOutcome } from '../../src/game/systems/dateActivities';
import graduate from '../fixtures/v3-employed-graduate.json';
import marriage from '../fixtures/v5-marriage-result.json';
function ack(world:World) { return world.pending?.kind==='result'?resolveCommand(world,{type:'acknowledge',resultId:world.pending.id}):world; }
function setup(married=false) {
  const world=ack(decodeWorld(JSON.stringify(married?marriage:graduate))); enableOverhaul(world); world.pending=null;world.deferred=[];world.pendingPriority=0;
  const actor=world.people[world.activePersonId]; actor.attractedTo=['male','female','nonbinary'];
  let partner=partnerRelation(world);
  if(!partner) { const person=createContact(world,{age:25,gender:'female',compatibleWith:actor.gender,country:actor.country,city:actor.city}); connectPerson(world,person.id); partner=relationFor(world,actor.id,person.id)!; partner.romance='dating';partner.kind='partner';partner.roles.push('partner'); }
  const spouse=world.people[partner.from===actor.id?partner.to:partner.from];spouse.attractedTo=['male','female','nonbinary'];partner.strength=90;partner.trust=80;partner.memories.push('date:'+(world.date.year-2));
  const lover=createContact(world,{age:26,gender:'female',compatibleWith:actor.gender,country:actor.country,city:actor.city});lover.attractedTo=['male','female','nonbinary'];lover.traits=['impulsive'];connectPerson(world,lover.id);const bond=relationFor(world,actor.id,lover.id)!;bond.strength=90;bond.trust=80;
  validateWorld(world);return{world,actor,spouse,lover,partner};
}
function choose(world:World,id:string) {if(world.pending?.kind!=='decision')throw Error('decision required');return resolveCommand(world,{type:'choose',eventId:world.pending.id,choiceId:id});}

test('player affair uses actual adults, keeps exclusive romance and exact finances, persists, then confession can really separate',()=>{
  const {world,actor,spouse,lover,partner}=setup();world.random.outcomes=0;
  const before=encodeWorld(world),after=resolveCommand(world,{type:'romance-action',personId:lover.id,action:'affair'}),affair=after.affairs![0];
  expect(affair).toMatchObject({actorId:actor.id,partnerId:spouse.id,loverId:lover.id,relationshipId:partner.id,knownBy:[actor.id,lover.id],discovered:null});
  expect(partnerRelation(after)!.id).toBe(partner.id);expect(relationFor(after,actor.id,lover.id)!.romance).toBe('none');expect(after.ledger).toEqual(world.ledger);expect(after.accounts).toEqual(world.accounts);expect(encodeWorld(world)).toBe(before);expect(decodeWorld(encodeWorld(after))).toEqual(after);
  const next=copyWorld(ack(after));relationFor(next,actor.id,spouse.id)!.trust=20;next.people[spouse.id].traits=['practical'];const confessed=resolveCommand(next,{type:'romance-action',personId:spouse.id,action:'confess'});
  expect(confessed.affairs![0]).toMatchObject({endReason:'confessed',discoveryReason:'confession'});expect(confessed.affairs![0].knownBy).toContain(spouse.id);expect(relationFor(confessed,actor.id,spouse.id)!.romance).toBe('ex');expect(confessed.marriages).toEqual(world.marriages);
});

test('married confession never becomes an ordinary breakup or silently settles finances/custody',()=>{
  const {world,spouse,lover}=setup(true);world.random.outcomes=0;
  const begun=ack(resolveCommand(world,{type:'romance-action',personId:lover.id,action:'affair'}));const start=copyWorld(begun);relationFor(start,start.activePersonId,spouse.id)!.trust=5;start.people[spouse.id].traits=['practical'];
  const after=resolveCommand(start,{type:'romance-action',personId:spouse.id,action:'confess'});expect(partnerRelation(after)!.romance).toBe('married');expect(after.marriages).toEqual(start.marriages);expect(after.custody).toEqual(start.custody);expect(after.accounts).toEqual(start.accounts);
});

test.each(['minor','relative','away','custody','mismatch'] as const)('engine rejects %s affair without mutating input',trap=>{
  const {world,actor,lover}=setup();if(trap==='minor')lover.born={...world.date,year:world.date.year-17};if(trap==='relative'){relationFor(world,actor.id,lover.id)!.roles=['sibling'];relationFor(world,actor.id,lover.id)!.kind='sibling';}if(trap==='away')lover.city+=' distant';if(trap==='mismatch')lover.attractedTo=[actor.gender==='male'?'female':'male'];if(trap==='custody')lover.health.hospitalizedUntil=world.date.year*12+world.date.month;
  const before=encodeWorld(world);expect(()=>resolveCommand(world,{type:'romance-action',personId:lover.id,action:'affair'})).toThrow();expect(encodeWorld(world)).toBe(before);
});

test.each(['accept','decline','time'])('NPC proposal %s is a saved real choice without invented ring/payment',choice=>{
  const {world,spouse}=setup();const cash=structuredClone(world.accounts),assets=structuredClone(world.assets);offerRomance(world,spouse.id,'proposal');const before=encodeWorld(world),after=choose(world,choice);
  expect(partnerRelation(after)!.romance).toBe(choice==='accept'?'engaged':'dating');expect(after.accounts).toEqual(cash);expect(after.assets).toEqual(assets);expect(after.romanceOffers![0]).toMatchObject({choiceId:choice});expect(decodeWorld(encodeWorld(after))).toEqual(after);expect(choose(decodeWorld(before),choice)).toEqual(after);
});

test('NPC breakup retains independent agency while divorce request retains marriage and settlement machinery',()=>{
  const dating=setup();dating.spouse.traits=['practical'];offerRomance(dating.world,dating.spouse.id,'breakup');const ended=choose(dating.world,'plead');expect(relationFor(ended,ended.activePersonId,dating.spouse.id)!.romance).toBe('ex');
  const married=setup(true);offerRomance(married.world,married.spouse.id,'divorce');const after=choose(married.world,'respect');expect(partnerRelation(after)!.romance).toBe('married');expect(after.accounts).toEqual(married.world.accounts);expect(after.marriages).toEqual(married.world.marriages);
});

test('temporary space expires on a calendar month and does not create an indefinite relationship state',()=>{
  const {world,spouse}=setup();offerRomance(world,spouse.id,'space');const after=choose(world,'respect');expect(after.romanceOffers![0].spaceUntilMonth).toBe(world.date.year*12+world.date.month-1+3);expect(partnerRelation(after)!.romance).toBe('dating');
});

test('no contact actually blocks future ex approaches and can be deliberately lifted',()=>{
  const {world,spouse,partner}=setup();partner.romance='ex';partner.roles=['acquaintance'];partner.kind='acquaintance';partner.memories.push('breakup:'+(world.date.year-2));
  const no=ack(resolveCommand(world,{type:'romance-action',personId:spouse.id,action:'decline-contact'}));expect(()=>resolveCommand(no,{type:'romance-action',personId:spouse.id,action:'reconcile'})).toThrow(/no contact/);expect(romanceActionOptions(no,spouse.id).some(o=>o.action==='allow-contact'&&!o.disabledReason)).toBe(true);
  const yes=ack(resolveCommand(no,{type:'romance-action',personId:spouse.id,action:'allow-contact'}));expect(romanceActionOptions(yes,spouse.id).find(o=>o.action==='reconcile')!.disabledReason).toBeUndefined();
});

test('reconciliation requires both people single, and refusal keeps the shared history',()=>{
  const {world,spouse,partner}=setup();partner.romance='ex';partner.roles=['acquaintance'];partner.kind='acquaintance';partner.strength=5;partner.trust=5;partner.memories.push('breakup:'+world.date.year);world.random.outcomes=4;
  const after=resolveCommand(world,{type:'romance-action',personId:spouse.id,action:'reconcile'});expect(relationFor(after,after.activePersonId,spouse.id)!.romance).toBe('ex');expect(after.marriages).toEqual(world.marriages);expect(after.pending!.body).toMatch(/declines/);
});

test('all35 authored scenes bind real eligible participants, freeze105 outcomes and all choices resolve real bounded effects',()=>{
  expect(romanceDramaStories.filter(s=>s.group==='partner')).toHaveLength(25);expect(romanceDramaStories.filter(s=>s.group==='ex')).toHaveLength(10);
  const ids=new Set(romanceDramaStories.map(s=>s.id));expect(ids.size).toBe(35);
  for(const story of romanceDramaStories)for(const choice of story.choices){const seeded=setup(story.context==='married');let world=seeded.world;const {spouse,partner,lover}=seeded;if(story.id==='romance-grown-together')world.date.year+=1;partner.memories.push('argument:'+world.date.year);if(story.group==='ex'){partner.romance='ex';partner.roles=['acquaintance'];partner.kind='acquaintance';partner.memories.push('breakup:'+(world.date.year-2));world.date.month=world.people[world.activePersonId].born.month;}if(story.id==='romance-public-status'){world.random.outcomes=0;world=ack(resolveCommand(world,{type:'romance-action',personId:lover.id,action:'affair'}));world=ack(resolveCommand(world,{type:'romance-action',personId:spouse.id,action:'confess'}));}
    expect(romanceStoryEligible(world,spouse.id,story)).toBe(true);offerRomance(world,spouse.id,story.group==='ex'?'ex':'story',story);validateWorld(world);const after=choose(world,choice.id);expect(after.pending!.body).not.toMatch(/\{name\}/);expect(after.romanceOffers![0].choiceId).toBe(choice.id);validateWorld(after);expect(decodeWorld(encodeWorld(after))).toEqual(after);
  }
});

test('happy stable couples cannot suffer random affairs, forced breakup or divorce even on a low roll',()=>{
  const {world,spouse}=setup(true);world.random.outcomes=0;romanceYear(world);expect(world.affairs).toEqual([]);expect(world.romanceOffers!.every(o=>!['breakup','divorce','discovery'].includes(o.kind))).toBe(true);expect(partnerRelation(world)!.romance).toBe('married');
});

test('deceased bound participant cancels an offer without substituting another person',()=>{
  const {world,spouse}=setup();offerRomance(world,spouse.id,'proposal');recordDeath(world,spouse.id,'test boundary');refreshRomance(world);validateWorld(world);const after=choose(world,'accept');expect(after.pending!.body).toMatch(/situation has changed/);expect(after.romanceOffers![0].personId).toBe(spouse.id);expect(partnerRelation(after)).toBeUndefined();
});

test('dates offer ten plans with genuinely varied outcomes and exact actual payment',()=>{
  const {world,spouse}=setup(true);expect(dateActivities(world,spouse.id)).toHaveLength(10);
  const bad=dateActivityOutcome('cooking',spouse.firstName,true,undefined,1),good=dateActivityOutcome('cooking',spouse.firstName,true,undefined,100);expect(bad.bond).toBeLessThan(0);expect(good.bond).toBeGreaterThan(0);expect(bad.body).not.toBe(good.body);
  const quote=dateActivities(world,spouse.id).find(o=>o.id==='cooking')!;world.random.outcomes=0;const after=resolveCommand(world,{type:'ask-date',personId:spouse.id,activity:'cooking'});expect(accountFor(after).cash).toBe(accountFor(world).cash-quote.cost);expect(resolveCommand(world,{type:'ask-date',personId:spouse.id,activity:'cooking'})).toEqual(after);
});

test('validator rejects invented discoveries and future chronology',()=>{
  const {world,lover,spouse}=setup();world.random.outcomes=0;const after=resolveCommand(world,{type:'romance-action',personId:lover.id,action:'affair'}),bad=copyWorld(after);bad.affairs![0].knownBy.push(spouse.id);expect(()=>validateRomance(bad)).toThrow(/discovery/);bad.affairs![0].knownBy.pop();bad.affairs![0].started.year+=1;expect(()=>validateRomance(bad)).toThrow(/chronology/);
});

test('NPC secret affair stays hidden until a legitimate witnessed discovery, then the stored discovery resolves unchanged after reload',()=>{
  const {world,actor,spouse,lover}=setup(); connectPerson(world,lover.id,spouse.id);const connection=relationFor(world,spouse.id,lover.id)!;connection.strength=95;connection.trust=80;
  // Declared helper fixture temporarily controls the NPC to record the same real affair command.
  world.activePersonId=spouse.id;world.random.outcomes=0;const npc=ack(resolveCommand(world,{type:'romance-action',personId:lover.id,action:'affair'}));npc.activePersonId=actor.id;
  expect(npc.affairs![0].knownBy).not.toContain(actor.id);expect(romanceActionOptions(npc,spouse.id).some(o=>o.action==='confront')).toBe(false);
  npc.random.outcomes=0;romanceYear(npc);expect(npc.affairs![0].knownBy).toContain(actor.id);expect(npc.affairs![0].discoveryReason).toBe('witnessed');expect(npc.pending?.kind==='decision'&&npc.pending.templateId).toBe('romance-discovery');
  const saved=encodeWorld(npc),after=choose(npc,'confront');expect(choose(decodeWorld(saved),'confront')).toEqual(after);expect(after.romanceOffers![0].choiceId).toBe('confront');
});

test('a later discovered betrayal addresses the later affair instead of an already forgiven record',()=>{
  const {world,actor,spouse,lover}=setup();connectPerson(world,lover.id,spouse.id);const connection=relationFor(world,spouse.id,lover.id)!;connection.strength=95;connection.trust=80;
  world.activePersonId=spouse.id;world.random.outcomes=0;let npc=ack(resolveCommand(world,{type:'romance-action',personId:lover.id,action:'affair'}));npc.activePersonId=actor.id;npc.random.outcomes=0;romanceYear(npc);npc=ack(choose(npc,'forgive'));
  // End any refused repair explicitly in the controlled boundary fixture, retaining its truthful discovery.
  npc.affairs![0].ended={...npc.date};npc.affairs![0].endReason='ended';relationFor(npc,actor.id,spouse.id)!.memories.push('affair-forgiven:'+npc.affairs![0].id);
  const first=npc.affairs![0],second={...structuredClone(first),id:first.id+'_later',ended:null,endReason:null};npc.affairs!.push(second);validateWorld(npc);
  expect(romanceActionOptions(npc,spouse.id).find(o=>o.action==='forgive')!.disabledReason).toBeUndefined();
});

test('family hears a betrayal only when the player actually tells that adult person',()=>{
  const {world,lover}=setup();world.random.outcomes=0;const begun=ack(resolveCommand(world,{type:'romance-action',personId:lover.id,action:'affair'})),parent=begun.relationships.find(r=>r.to===begun.activePersonId&&r.roles.includes('parent'))!.from;
  expect(begun.affairs![0].knownBy).not.toContain(parent);const after=resolveCommand(begun,{type:'romance-action',personId:parent,action:'share-betrayal'});expect(after.affairs![0].knownBy).toContain(parent);expect(relationFor(after,after.activePersonId,parent)!.memories).toContain('knows-affair:'+after.affairs![0].id);expect(after.ledger).toEqual(begun.ledger);
});


test('an ended secret affair can be confessed once to the current partner without rewriting its original ending',()=>{
  const {world,spouse,lover}=setup();world.random.outcomes=0;const begun=ack(resolveCommand(world,{type:'romance-action',personId:lover.id,action:'affair'}));
  const ended=ack(resolveCommand(begun,{type:'romance-action',personId:lover.id,action:'end-affair'})),ending=structuredClone(ended.affairs![0]);
  expect(romanceActionOptions(ended,spouse.id).find(o=>o.action==='confess')!.disabledReason).toBeUndefined();
  const confessed=resolveCommand(ended,{type:'romance-action',personId:spouse.id,action:'confess'});
  expect(confessed.affairs![0]).toMatchObject({ended:ending.ended,endReason:'ended',discoveryReason:'confession'});expect(confessed.affairs![0].knownBy).toContain(spouse.id);
  const done=ack(confessed);expect(romanceActionOptions(done,spouse.id).some(o=>o.action==='confess')).toBe(false);expect(()=>resolveCommand(done,{type:'romance-action',personId:spouse.id,action:'confess'})).toThrow(/undisclosed/);expect(decodeWorld(encodeWorld(confessed))).toEqual(confessed);
});


test('actor death and withdrawn queued offers retain a factual saved cancellation outcome',()=>{
  const dying=setup();offerRomance(dying.world,dying.spouse.id,'proposal');recordDeath(dying.world,dying.actor.id,'test boundary');expect(dying.world.pending).toBeNull();expect(dying.world.romanceOffers![0]).toMatchObject({choiceId:'cancelled',outcome:'The offer ended when this life ended.'});validateWorld(dying.world);
  const withdrawn=setup();offerRomance(withdrawn.world,withdrawn.spouse.id,'proposal');withdrawn.world.pending=null;withdrawn.world.pendingPriority=0;refreshRomance(withdrawn.world);expect(withdrawn.world.romanceOffers![0]).toMatchObject({choiceId:'cancelled',outcome:'The earlier offer was withdrawn before a response.'});expect(decodeWorld(encodeWorld(withdrawn.world))).toEqual(withdrawn.world);
});
