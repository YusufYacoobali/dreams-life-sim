import type { Person, World } from '../model';
import type { RuntimeEffectRow } from '../runtime';
import { ageOn, fullName } from '../personHelpers';
import { IneligibleAction } from '../errors';
import { rules } from '../rules';
import { offerPending } from '../pendingQueue';
import { active, bounded, draw, fact, result } from './common';
import { activeRomance, closeFamily, otherPerson, partnerRelation, relationFor, type Relationship } from './relationshipQueries';
import { samePhysicalPlace } from './travelSchemas';
import { isConfined } from './legalSchemas';
import { hospitalized } from './healthSchemas';
import { serviceAway } from './serviceSchemas';
import { romanceDramaStories, type RomanceStory } from '../content/romanceDramaStories';
import { type Affair, type RomanceCommand, type RomanceChoiceEffect, type RomanceOffer } from './romanceSchemas';
export { romanceCommandSchema, romanceChoiceEffectSchema } from './romanceSchemas';
const month = (world: World) => world.date.year * 12 + world.date.month - 1;
const nameText = (text: string, target: Person) => text.replaceAll('{name}', target.firstName);
const offers = (world: World) => world.romanceOffers ?? [];
const affairs = (world: World) => world.affairs ?? [];
const adult = (world: World, person: Person) => !person.died && ageOn(person, world.date) >= Math.max(18, rules[person.country].adultAge);
function remember(relation: Relationship, memory: string) { relation.memories.push(memory); }
function rows(world: World, relation: Relationship, changes: { bond?: number; trust?: number; happiness?: number; stress?: number }): RuntimeEffectRow[] {
  const person = active(world), result: RuntimeEffectRow[] = [];
  for (const [field, label] of [['bond','Relationship'],['trust','Trust'],['happiness','Happiness'],['stress','Stress']] as const) {
    const delta = changes[field] ?? 0; if (!delta) continue;
    const object = field === 'bond' || field === 'trust' ? relation : person.stats, key = field === 'bond' ? 'strength' : field;
    const before = (object as unknown as Record<string,number>)[key], after = bounded(before + delta);
    (object as unknown as Record<string,number>)[key] = after;
    result.push({ id:'romance-'+field, label, value:(after-before >= 0 ? '+' : '') + (after-before) + '%', tone:(field === 'stress' ? before-after : after-before) > 0 ? 'positive' : (field === 'stress' ? before-after : after-before) < 0 ? 'negative' : 'neutral' });
  }
  return result;
}
function endAffair(world: World, affair: Affair, reason: NonNullable<Affair['endReason']>) { if (!affair.ended) { affair.ended={...world.date}; affair.endReason=reason; } }
export function refreshRomance(world: World) {
  const queued=new Set([world.pending,...world.deferred.map(r=>r.event)].flatMap(event=>event?.kind==='decision'?event.choices.flatMap(choice=>choice.effects.flatMap(effect=>effect.kind==='romance-choice'?[effect.offerId]:[])):[]));
  for (const row of offers(world)) if (!row.resolved && (!queued.has(row.id) || world.people[row.actorId]?.died || row.actorId!==world.activePersonId)) {
    row.resolved={...world.date}; row.choiceId='cancelled'; row.outcome=world.people[row.actorId]?.died?'The offer ended when this life ended.':row.actorId!==world.activePersonId?'The offer ended when control passed to another family member.':'The earlier offer was withdrawn before a response.';
  }
  for (const event of [world.pending,...world.deferred.map(r=>r.event)]) if(event?.kind==='decision' && event.choices.some(c=>c.effects.some(e=>e.kind==='romance-choice'))) {
    const valid=event.personIds.filter(id=>world.people[id] && !world.people[id].died);
    if(valid.length!==event.personIds.length) event.personIds=valid;
  }
  for (const row of affairs(world)) {
    if (row.ended) continue;
    const actor=world.people[row.actorId], partner=world.people[row.partnerId], lover=world.people[row.loverId], relation=world.relationships.find(r=>r.id===row.relationshipId);
    if ([actor,partner,lover].some(p=>!p || p.died)) endAffair(world,row,'death');
    else if (!relation || !activeRomance(relation)) endAffair(world,row,'separated');
    else if (!samePhysicalPlace(world,actor.id,lover.id)) endAffair(world,row,'distance');
  }
}
function compatible(world: World, actor: Person, target: Person) {
  return adult(world,actor) && adult(world,target) && actor.id !== target.id && !closeFamily(world,actor.id,target.id) && actor.attractedTo.includes(target.gender) && target.attractedTo.includes(actor.gender);
}
function available(world: World, actor: Person, target: Person) {
  return !isConfined(world,actor) && !isConfined(world,target) && !hospitalized(world,actor) && !hospitalized(world,target) && !serviceAway(world,actor.id) && !serviceAway(world,target.id) && samePhysicalPlace(world,actor.id,target.id);
}
function confessibleAffair(world: World, partnerId: string) {
  const commitment=partnerRelation(world);
  return commitment && affairs(world).findLast(row=>row.actorId===world.activePersonId && row.partnerId===partnerId && row.relationshipId===commitment.id && !row.knownBy.includes(partnerId));
}
function knownAffair(world: World, personId: string) {
  return affairs(world).findLast(row=>row.partnerId===world.activePersonId && row.actorId===personId && row.knownBy.includes(world.activePersonId));
}
export function romanceActionReason(world: World, personId: string, action: RomanceCommand['action']): string | undefined {
  const actor=active(world), target=world.people[personId], relation=target && relationFor(world,actor.id,personId);
  if (!target || !relation || !adult(world,actor) || !adult(world,target)) return 'Choose a living adult contact';
  if (world.pending || world.annual && !world.annual.pausedForPlanning) return 'Finish the current event first';
  if (action==='affair') {
    if (!compatible(world,actor,target)) return 'Choose a compatible adult who is not a relative';
    const partner=partnerRelation(world), theirs=partnerRelation(world,target.id);
    if (!partner || otherPerson(world,partner).id===target.id) return 'An affair requires an existing partner and a different contact';
    if (!adult(world,otherPerson(world,partner))) return 'Your existing partner must also be an adult';
    if (theirs) return 'This contact already has an exclusive relationship';
    if (!available(world,actor,target)) return 'Meet an available adult in the same city';
    if (affairs(world).some(row=>!row.ended && row.actorId===actor.id)) return 'End your current affair first';
    if (affairs(world).length>=128) return 'This life archive has reached its affair limit';
    if (relation.strength<40 || relation.trust<25) return 'Build a mutual connection first';
  } else if (action==='end-affair' || action==='confess') {
    if (action==='confess' ? !confessibleAffair(world,target.id) : !affairs(world).some(row=>!row.ended && row.actorId===actor.id && row.loverId===target.id)) return action==='confess'?'There is no undisclosed affair to confess to this partner':'There is no current affair for this action';
  } else if (['confront','explain','forgive'].includes(action)) {
    if (!knownAffair(world,personId)) return 'There is no known betrayal by this person';
    if (!activeRomance(relation)) return 'This relationship has already ended';
    if (action==='forgive' && relation.memories.includes('affair-forgiven:'+knownAffair(world,personId)!.id)) return 'You have already addressed this betrayal';
  } else if (action==='share-betrayal') {
    const row=affairs(world).findLast(a=>(a.actorId===actor.id || a.partnerId===actor.id) && a.knownBy.includes(actor.id) && !a.knownBy.includes(target.id));
    if (!row || row.knownBy.length>=8 || [row.actorId,row.partnerId,row.loverId].includes(target.id) || !relation.roles.some(role=>['friend','parent','guardian','sibling'].includes(role))) return 'Choose a close adult contact who does not already know';
  } else {
    if (relation.romance!=='ex') return 'Choose a former adult partner';
    if (!compatible(world,actor,target)) return 'Your present circumstances do not support renewed romantic contact';
    if (action!=='decline-contact' && action!=='allow-contact' && relation.memories.some(m=>m.startsWith('romance-no-contact:'))) return 'A request for no contact remains in force';
    if (action==='reconcile' && (partnerRelation(world) || partnerRelation(world,target.id))) return 'Both people must be single before considering reconciliation';
    if (action==='reconcile' && !available(world,actor,target)) return 'Discuss reconciliation when both people are available in the same city';
  }
  if (world.actionCounts[actor.id+':romance:'+world.date.year+':'+target.id+':'+action]) return 'Already tried this with this person this year';
}
export function romanceActionOptions(world: World, personId: string) {
  const relation=relationFor(world,world.activePersonId,personId); if (!relation) return [];
  const own=affairs(world).find(row=>!row.ended && row.actorId===world.activePersonId && row.loverId===personId), unfaithful=confessibleAffair(world,personId);
  const actions: {action:RomanceCommand['action'];label:string}[]=[];
  if (relation.romance==='ex') actions.push({action:'reach-out',label:'Reach Out'},{action:'discuss',label:'Discuss the Breakup'},{action:'apologise-ex',label:'Apologise For Your Part'},{action:'reconcile',label:'Ask About Reconciliation'},{action:'decline-contact',label:'Decline Further Contact'},...(relation.memories.some(m=>m.startsWith('romance-no-contact:'))?[{action:'allow-contact' as const,label:'Allow Contact Again'}]:[]));
  else if (own) actions.push({action:'end-affair',label:'End the Affair'});
  else if (unfaithful) actions.push({action:'confess',label:'Confess the Affair'});
  else if (!activeRomance(relation) && partnerRelation(world) && compatible(world,active(world),world.people[personId])) actions.push({action:'affair',label:'Pursue an Affair'});
  if (knownAffair(world,personId) && activeRomance(relation)) actions.push({action:'confront',label:'Confront Infidelity'},{action:'explain',label:'Demand an Explanation'},{action:'forgive',label:'Offer Forgiveness'});
  if (relation.roles.some(role=>['friend','parent','guardian','sibling'].includes(role)) && affairs(world).some(a=>(a.actorId===world.activePersonId || a.partnerId===world.activePersonId) && a.knownBy.includes(world.activePersonId) && !a.knownBy.includes(personId) && ![a.actorId,a.partnerId,a.loverId].includes(personId))) actions.push({action:'share-betrayal',label:'Talk About the Betrayal'});
  return actions.map(option=>({...option,disabledReason:romanceActionReason(world,personId,option.action)}));
}
function createAffair(world: World, actor: Person, target: Person, partner: Relationship) {
  const row: Affair={id:'affair_'+world.revision+'_'+affairs(world).length,actorId:actor.id,partnerId:otherPerson(world,partner,actor.id).id,loverId:target.id,relationshipId:partner.id,started:{...world.date},ended:null,endReason:null,knownBy:[actor.id,target.id],discovered:null,discoveryReason:null};
  (world.affairs ??= []).push(row); return row;
}
function reveal(world: World, affair: Affair, reason: NonNullable<Affair['discoveryReason']>) {
  if (!affair.knownBy.includes(affair.partnerId)) affair.knownBy.push(affair.partnerId);
  if (!affair.discovered) { affair.discovered={...world.date}; affair.discoveryReason=reason; const relation=world.relationships.find(r=>r.id===affair.relationshipId)!; remember(relation,'affair-discovered:'+affair.id); relation.trust=bounded(relation.trust-30); relation.strength=bounded(relation.strength-15); }
}
export function resolveRomance(world: World, command: RomanceCommand) {
  const reason=romanceActionReason(world,command.personId,command.action); if (reason) throw new IneligibleAction(reason);
  const actor=active(world), target=world.people[command.personId], relation=relationFor(world,actor.id,target.id)!;
  world.actionCounts[actor.id+':romance:'+world.date.year+':'+target.id+':'+command.action]=1;
  let body:string, journal:string, effects:RuntimeEffectRow[]=[];
  if (command.action==='affair') {
    const accepted=draw(world,'outcomes',1,100)<=Math.min(85,relation.strength-(target.traits.includes('kind')?25:0)+(target.traits.includes('impulsive')?15:0));
    if (!accepted) { body=target.firstName+' refuses to become your secret. The invitation has damaged their trust in you.'; journal='I suggested an affair to '+target.firstName+', who refused.'; effects=rows(world,relation,{trust:-5,bond:-3,happiness:-2}); }
    else { const row=createAffair(world,actor,target,partnerRelation(world)!); remember(relation,'affair-started:'+row.id); body='You and '+target.firstName+' began an affair. You keep it from your partner.'; journal='I began an affair with '+fullName(target)+'.'; effects=rows(world,relation,{bond:3,happiness:3,stress:5}); }
  } else if (command.action==='end-affair') {
    const row=affairs(world).find(r=>!r.ended && r.actorId===actor.id && r.loverId===target.id)!; endAffair(world,row,'ended'); remember(relation,'affair-ended:'+row.id); body='You ended the affair with '+target.firstName+'. Ending it does not erase what happened or guarantee it stays secret.'; journal='I ended my affair with '+target.firstName+'.'; effects=rows(world,relation,{bond:-5,stress:-2});
  } else if (command.action==='confess') {
    const row=confessibleAffair(world,target.id)!; const beforeTrust=relation.trust,beforeBond=relation.strength; reveal(world,row,'confession'); endAffair(world,row,'confessed');
    effects=[{id:'trust',label:'Trust',value:(relation.trust-beforeTrust)+'%',tone:'negative'},{id:'bond',label:'Relationship',value:(relation.strength-beforeBond)+'%',tone:'negative'}];
    const forgive=target.traits.includes('kind') && draw(world,'outcomes',1,100)<=Math.max(10,relation.trust);
    remember(relation,'confessed:'+row.id);
    if (forgive) { remember(relation,'affair-forgiven:'+row.id); body=target.firstName+' is hurt and agrees to try rebuilding trust. The affair has ended. Forgiveness has not restored the old relationship overnight.'; }
    else if (relation.romance!=='married' && relation.trust<30) { separate(world,relation); body=target.firstName+' ends the relationship. Your confession was honest; it did not oblige them to stay.'; }
    else { body=target.firstName+' needs time and has not forgiven you. '+(relation.romance==='married'?'Your marriage remains legally intact; any divorce still requires a settlement.':'Your relationship remains unsettled.'); }
    journal='I confessed my affair to '+target.firstName+'.'+(relation.romance==='ex'?' They ended our relationship.':'');
  } else if (command.action==='confront' || command.action==='explain') {
    const row=knownAffair(world,target.id)!; remember(relation,'affair-confronted:'+row.id);
    body=command.action==='confront'?target.firstName+' acknowledges the affair you discovered. You have asked them to account for a real betrayal; the next decision is still yours.':target.firstName+' gives an explanation. It does not undo the affair or require you to accept it.';
    journal='I '+(command.action==='confront'?'confronted '+target.firstName+' about the affair.':'asked '+target.firstName+' to explain the affair.'); effects=rows(world,relation,{stress:2});
  } else if (command.action==='forgive') {
    const row=knownAffair(world,target.id)!, accepted=draw(world,'outcomes',1,100)<=Math.min(90,relation.trust+25+(target.traits.includes('kind')?20:0));
    if (accepted) { endAffair(world,row,'ended'); remember(relation,'affair-forgiven:'+row.id); body=target.firstName+' accepts your offer to rebuild trust and ends the affair. The damage remains part of your shared history.'; effects=rows(world,relation,{trust:6,bond:4,stress:-3}); }
    else { body=target.firstName+' will not commit to repairing the relationship. Your offer of forgiveness has not changed their decision.'; effects=rows(world,relation,{happiness:-3,stress:2}); }
    journal='I offered '+target.firstName+' a chance to rebuild trust after the affair.';
  } else if (command.action==='share-betrayal') {
    const row=affairs(world).findLast(a=>(a.actorId===actor.id || a.partnerId===actor.id) && a.knownBy.includes(actor.id) && !a.knownBy.includes(target.id))!;row.knownBy.push(target.id);remember(relation,'knows-affair:'+row.id);
    const own=row.actorId===actor.id; target.stats.happiness=bounded(target.stats.happiness-2);
    body=own?target.firstName+' listens as you tell them what you did. They are disappointed and now know about the affair.':target.firstName+' listens as you describe the affair you discovered. They offer company without making the decision for you.';
    journal='I told '+target.firstName+' about '+(own?'my affair.':'the affair I discovered.');effects=rows(world,relation,own?{trust:-3,bond:-2,stress:1}:{trust:2,bond:3,stress:-2});
  } else if (command.action==='apologise-ex') {
    const accepted=draw(world,'outcomes',1,100)<=Math.min(85,relation.trust+15+(target.traits.includes('kind')?15:0));remember(relation,'ex-apology:'+world.date.year);
    body=accepted?target.firstName+' accepts your apology. You are still former partners; this is an apology, not a proposal.':target.firstName+' hears the apology but does not accept it. You cannot choose forgiveness for them.';journal='I apologised to my former partner, '+target.firstName+'.';effects=rows(world,relation,accepted?{trust:4,bond:2,stress:-1}:{stress:1});
  } else if (command.action==='allow-contact') {
    relation.memories=relation.memories.filter(m=>!m.startsWith('romance-no-contact:')); body='You tell '+target.firstName+' that occasional contact is welcome again. They can still choose whether to reply.'; journal='I lifted my no-contact boundary with '+target.firstName+'.';
  } else if (command.action==='decline-contact') {
    remember(relation,'romance-no-contact:'+world.date.year); body='You ask '+target.firstName+' not to contact you. Future approaches are blocked unless you later choose to lift the boundary.'; journal='I asked '+target.firstName+' not to contact me.'; effects=rows(world,relation,{stress:-2});
  } else if (command.action==='reconcile') {
    const endedYears=relation.memories.filter(m=>/^(breakup|divorce|npc-separation):\d+$/.test(m)).map(m=>Number(m.split(':')[1]));
    const since=endedYears.length?world.date.year-Math.max(...endedYears):0, betrayal=affairs(world).some(r=>r.relationshipId===relation.id && r.discovered), chance=Math.max(5,Math.min(80,Math.floor((relation.strength+relation.trust)/2)+(since>=2?10:-15)-(betrayal?25:0)+(target.traits.includes('kind')?10:0)));
    const yes=draw(world,'outcomes',1,100)<=chance;
    if (yes) { relation.romance='dating'; if (!relation.roles.includes('partner')) relation.roles.push('partner'); relation.kind='partner'; remember(relation,'reconciled:'+world.date.year); body='You and '+target.firstName+' agree to date again. You discuss what has changed and what must be different this time.'; effects=rows(world,relation,{trust:3,bond:5,happiness:5}); }
    else { remember(relation,'reconciliation-refused:'+world.date.year); body=target.firstName+' declines to restart the relationship. They can value the conversation and still choose a different future.'; effects=rows(world,relation,{happiness:-2}); }
    journal=yes?'I began dating '+target.firstName+' again after we both agreed to reconcile.':'I asked '+target.firstName+' to reconcile, and they declined.';
  } else {
    const accepted=draw(world,'outcomes',1,100)<=Math.min(90,relation.trust+(command.action==='discuss'?10:20));
    body=accepted?(command.action==='discuss'?target.firstName+' talks about what ended the relationship. You listen without treating the conversation as consent to restart it.':target.firstName+' replies. The conversation is friendly, brief, and does not restore your romance.') : target.firstName+' does not want to talk about the past today. You respect the answer.';
    journal=command.action==='discuss'?'I tried to discuss my breakup with '+target.firstName+'.':'I reached out to my former partner, '+target.firstName+'.';
    effects=rows(world,relation,accepted?{trust:3,bond:2}:{happiness:-1});
  }
  fact(world,journal,'relationships'); result(world,'A relationship decision',body,'hearts',effects);
}
function separate(world: World, relation: Relationship) {
  if (relation.romance==='married') throw new IneligibleAction('A marriage requires its actual divorce settlement');
  relation.romance='ex'; relation.roles=relation.roles.filter(role=>role!=='partner'); if (!relation.roles.length) relation.roles.push('acquaintance'); relation.kind=relation.roles[0]; remember(relation,'breakup:'+world.date.year); refreshRomance(world);
}
const labels:Record<RomanceOffer['kind'],readonly [string,string][]>={
  proposal:[['accept','Accept the proposal'],['time','Ask for more time'],['decline','Decline gently']],
  breakup:[['respect','Respect their decision'],['plead','Ask for another chance'],['lash','Lash out']],
  space:[['respect','Respect their space'],['repair','Ask to talk calmly'],['lash','Make it a fight']],
  divorce:[['respect','Discuss separation'],['repair','Ask to work on it'],['lash','Refuse to listen']],
  discovery:[['confront','Confront the affair'],['time','Take time to decide'],['forgive','Offer a chance to repair']],
  story:[],ex:[],
};
const writing:Record<Exclude<RomanceOffer['kind'],'story'|'ex'>,{title:string;body:string}>={
  proposal:{title:'Their Turn To Ask',body:'{name} asks you to marry them. They rehearse the opening sentence twice, then abandon it and ask you plainly.'},
  breakup:{title:'They Have Decided',body:'{name} says the relationship is over. This is not a test designed to make you say the correct thing. They have their own decision to make.'},
  space:{title:'A Little Distance',body:'After the tension between you, {name} asks for some space. They suggest three months before you discuss the relationship again.'},
  divorce:{title:'The Marriage Question',body:'{name} says they want to discuss divorce. Your marriage, children and property cannot be settled by one painful conversation.'},
  discovery:{title:'An Actual Betrayal',body:'You see {name} kissing someone they have been meeting in secret. When they notice you, neither of them can find an explanation.'},
};
export function romanceStoryEligible(world: World, personId: string, story: RomanceStory): boolean {
  const relation=relationFor(world,world.activePersonId,personId); if (!relation) return false;
  if (!available(world,active(world),world.people[personId])) return false;
  if (story.id==='romance-ex-birthday' && world.date.month!==active(world).born.month) return false;
  if (story.group==='ex') return relation.romance==='ex' && relation.memories.some(m=>/^(breakup|divorce|npc-separation):\d+$/.test(m) && Number(m.split(':')[1])<world.date.year) && !relation.memories.some(m=>m.startsWith('romance-no-contact:'));
  if (!['dating','engaged','married'].includes(relation.romance)) return false;
  if (story.context==='married' && relation.romance!=='married') return false;
  if (story.id==='romance-grown-together' && !world.marriages.some(m=>!m.ended && [m.a,m.b].includes(world.activePersonId) && [m.a,m.b].includes(personId) && world.date.year*12+world.date.month-(m.started.year*12+m.started.month)>=12)) return false;
  if ((story.context==='conflict' || story.id==='romance-museum-silence') && !relation.memories.some(m=>m.startsWith('argument:'))) return false;
  if (['romance-two-anniversaries','romance-restaurant-review'].includes(story.id) && !relation.memories.some(m=>m.startsWith('date:') && Number(m.split(':')[1])<world.date.year)) return false;
  return true;
}
export function offerRomance(world: World, personId: string, kind: RomanceOffer['kind'], story?: RomanceStory, affairId:string|null=null): RomanceOffer | undefined {
  if (offers(world).length>=256) return;
  const actor=active(world), target=world.people[personId], relation=target && relationFor(world,actor.id,personId);
  if (!target || !relation || !adult(world,actor) || !adult(world,target) || story && !romanceStoryEligible(world,personId,story)) return;
  const row:RomanceOffer={id:'romance_'+world.revision+'_'+offers(world).length,ruleVersion:1,actorId:actor.id,personId:target.id,relationshipId:relation.id,kind,templateId:story?.id??'romance-'+kind,offered:{...world.date},resolved:null,affairId,expectedRomance:relation.romance,roll:draw(world,'outcomes',1,100),choiceId:null,outcome:null,spaceUntilMonth:null,ringId:kind==='proposal'?world.assets.find(a=>a.ownerId===target.id && a.catalogId==='engagement-ring')?.id??null:null,...(story?{storyChoices:story.choices.map(c=>({...c,body:nameText(c.body,target),journal:nameText(c.journal,target)}))}:{})};
  (world.romanceOffers??=[]).push(row);
  const options=story?story.choices.map(c=>[c.id,c.label] as const):labels[kind], copy=story??writing[kind as Exclude<RomanceOffer['kind'],'story'|'ex'>];
  offerPending(world,{kind:'decision',id:row.id,templateId:row.templateId,title:copy.title,body:nameText(copy.body,target),illustration:'hearts',personIds:[actor.id,target.id,...(affairId?[affairs(world).find(a=>a.id===affairId)!.loverId]:[])],choices:options.map(([id,label])=>({id,label,effects:[{kind:'romance-choice',ruleVersion:1,offerId:row.id,actorId:actor.id,personId:target.id,relationshipId:relation.id,choiceId:id}],resultTitle:copy.title,resultBody:'Your response is recorded with the people involved.',journal:'I responded to '+target.firstName+'.'}))});
  return row;
}
export function resolveRomanceChoice(world: World, effect: RomanceChoiceEffect) {
  const row=offers(world).find(r=>r.id===effect.offerId);
  if (!row || row.resolved || row.actorId!==world.activePersonId || row.actorId!==effect.actorId || row.personId!==effect.personId || row.relationshipId!==effect.relationshipId) throw new IneligibleAction('This relationship decision is no longer open');
  const target=world.people[row.personId], relation=world.relationships.find(r=>r.id===row.relationshipId), actor=active(world);
  const validChoices=row.storyChoices?.map(c=>c.id)??labels[row.kind].map(([id])=>id);
  if (!validChoices.includes(effect.choiceId)) throw new IneligibleAction('Choose an available relationship response');
  row.resolved={...world.date}; row.choiceId=effect.choiceId;
  const finish=(body:string,journal:string,effects:RuntimeEffectRow[]=[])=>{row.outcome=body;return{title:'Your answer',body,journal,effects};};
  if (!target || !relation || !adult(world,target) || !adult(world,actor) || relation.romance!==row.expectedRomance) return finish('The situation has changed. Your earlier offer cannot change a different relationship.','I could not act on an earlier relationship offer because circumstances had changed.');
  const choice=effect.choiceId;
  if (row.storyChoices) {
    if (row.kind==='ex' && ['romance-ex-new-number:no','romance-ex-closure:boundary'].includes(row.templateId+':'+choice)) remember(relation,'romance-no-contact:'+world.date.year);
    const copy=row.storyChoices.find(c=>c.id===choice)!; remember(relation,'romance-story:'+row.templateId+':'+world.date.year); return finish(copy.body,copy.journal,rows(world,relation,copy)); }
  if (row.kind==='proposal') {
    if (choice==='accept') {
      if (relation.romance!=='dating' || !compatible(world,actor,target) || partnerRelation(world)?.id!==relation.id || partnerRelation(world,target.id)?.id!==relation.id) return finish('You cannot accept a proposal while another commitment or changed circumstance prevents it.','I could not accept an earlier marriage proposal.');
      relation.romance='engaged'; remember(relation,'engagement:'+world.date.year);
      const ring=row.ringId?world.assets.find(a=>a.id===row.ringId && a.ownerId===target.id && a.catalogId==='engagement-ring'):undefined;
      if (ring) {
        if (!world.accounts.some(a=>a.ownerId===actor.id && a.currency===ring.currency)) world.accounts.push({id:'account_'+actor.id+'_'+ring.currency,ownerId:actor.id,currency:ring.currency,cash:0n,openingCash:0n,lockedCash:0n});
        ring.ownerId=actor.id;ring.ownershipSource='gift';ring.titleSince={...world.date};ring.provenance.push('Given to '+fullName(actor)+' by '+fullName(target)+' in '+world.date.year); }
      return finish('You accept '+target.firstName+'’s proposal. You are engaged.'+(ring?' Their existing ring is now yours.':' You make the commitment without exchanging a ring.'),'I accepted '+target.firstName+'’s marriage proposal.',rows(world,relation,{happiness:8,bond:3}));
    }
    return finish(choice==='time'?target.firstName+' agrees to leave the question open. You are still dating; no engagement has been created.':target.firstName+' is disappointed. You remain dating, with no obligation to say yes later.','I '+(choice==='time'?'asked for more time to consider':'declined')+' '+target.firstName+'’s proposal.',rows(world,relation,choice==='time'?{trust:1}:{bond:-3,happiness:-1}));
  }
  if (row.kind==='breakup') {
    const reconsider=choice==='plead' && target.traits.includes('kind') && relation.trust>=20 && row.roll<=20;
    if (reconsider) return finish(target.firstName+' agrees to try once more. This is their choice, and the problems remain.','I asked '+target.firstName+' for another chance; they agreed.',rows(world,relation,{trust:1,stress:2}));
    separate(world,relation); return finish(target.firstName+' ends the relationship.'+(choice==='respect'?' You respect the decision.':choice==='plead'?' Your request does not change their mind.':' Your anger makes the parting harsher.'),'My relationship with '+target.firstName+' ended at their request.',rows(world,relation,{bond:choice==='lash'?-15:-5,trust:choice==='lash'?-10:-2,happiness:-6,stress:3}));
  }
  if (row.kind==='space') { row.spaceUntilMonth=month(world)+3; remember(relation,'space:'+row.spaceUntilMonth); return finish(choice==='lash'?'You turn the request into an argument. '+target.firstName+' still takes three months of space.':target.firstName+' takes three months of space. The relationship stays intact; ordinary communication remains possible.','I responded to '+target.firstName+'’s request for three months of space.',rows(world,relation,choice==='lash'?{trust:-7,bond:-4,stress:4}:choice==='repair'?{trust:1,stress:1}:{trust:3,stress:-1})); }
  if (row.kind==='divorce') { remember(relation,'divorce-request:'+world.date.year); return finish(choice==='repair' && target.traits.includes('kind') && row.roll<=35?target.firstName+' agrees to discuss repair before making a final decision. Your marriage remains intact.':target.firstName+' still wants to discuss separation. You will need to discuss the settlement and any arrangements for your children before separating.','My spouse '+target.firstName+' asked to discuss divorce.',rows(world,relation,choice==='lash'?{trust:-5,stress:4}:{stress:2})); }
  const affair=affairs(world).find(a=>a.id===row.affairId);
  if (!affair || affair.actorId!==target.id || affair.partnerId!==actor.id || !affair.knownBy.includes(actor.id)) return finish('There is no longer a valid discovery to act on.','I could not act on an earlier affair discovery.');
  if (choice==='forgive') { const accepts=row.roll<=Math.min(90,relation.trust+25+(target.traits.includes('kind')?20:0)); if (accepts) {endAffair(world,affair,'ended');remember(relation,'affair-forgiven:'+affair.id);} return finish(accepts?target.firstName+' agrees to end the affair and try rebuilding trust. Your shared history retains the betrayal.':target.firstName+' does not agree to repair the relationship. Forgiveness cannot require them to stay.','I offered '+target.firstName+' a chance to repair the relationship after the affair.',rows(world,relation,accepts?{trust:5,bond:3,stress:-2}:{happiness:-3,stress:2})); }
  if (choice==='confront') remember(relation,'affair-confronted:'+affair.id);
  return finish(choice==='confront'?target.firstName+' acknowledges the affair. You can offer forgiveness, end a dating relationship, or review a divorce settlement through the existing family actions.':'You take time to decide. The discovery remains recorded; you do not have to forgive or separate in this conversation.','I '+(choice==='confront'?'confronted '+target.firstName+' about':'took time to consider')+' the affair.',rows(world,relation,{stress:2}));
}
export function romanceYear(world: World) {
  if (world.overhaulVersion!==1) return;
  refreshRomance(world);
  const actor=active(world); if (!adult(world,actor) || offers(world).length>=256 || world.pending) return;
  const key=actor.id+':romance-autonomy:'+world.date.year; if (world.actionCounts[key]) return; world.actionCounts[key]=1;
  const relation=partnerRelation(world), target=relation && otherPerson(world,relation);
  if (relation && target && adult(world,target)) {
    const recent=(kind:RomanceOffer['kind'],years:number)=>offers(world).some(r=>r.actorId===actor.id && r.personId===target.id && r.kind===kind && world.date.year-r.offered.year<years);
    const hidden=affairs(world).find(r=>r.actorId===target.id && r.partnerId===actor.id && !r.ended && !r.knownBy.includes(actor.id) && world.people[r.loverId] && !world.people[r.loverId].died && available(world,target,world.people[r.loverId]));
    if (hidden && available(world,actor,target) && !recent('discovery',5) && draw(world,'outcomes',1,100)<=30) { reveal(world,hidden,'witnessed'); offerRomance(world,target.id,'discovery',undefined,hidden.id); return; }
    const conflict=relation.memories.some(m=>m.startsWith('argument:') || m.startsWith('affair-discovered:'));
    if (!hidden && relation.trust<40 && relation.strength<50 && target.traits.includes('impulsive') && available(world,actor,target) && affairs(world).length<128 && !affairs(world).some(r=>r.actorId===target.id && !r.ended) && draw(world,'outcomes',1,100)<=4) {
      const contacts=world.relationships.filter(r=>r.from===target.id || r.to===target.id).slice(0,32).map(r=>otherPerson(world,r,target.id)).filter(p=>p.id!==actor.id && compatible(world,target,p) && available(world,target,p) && !partnerRelation(world,p.id));
      if (contacts.length) createAffair(world,target,contacts[0],relation);
    }
    if (relation.romance==='dating' && relation.strength>=80 && relation.trust>=75 && relation.memories.some(m=>m.startsWith('date:') && Number(m.split(':')[1])<world.date.year) && available(world,actor,target) && !recent('proposal',5) && draw(world,'outcomes',1,100)<=8) { offerRomance(world,target.id,'proposal'); return; }
    if (conflict && relation.trust<25 && relation.strength<35 && !recent(relation.romance==='married'?'divorce':'breakup',6) && draw(world,'outcomes',1,100)<=15) { offerRomance(world,target.id,relation.romance==='married'?'divorce':'breakup'); return; }
    if (conflict && relation.trust<50 && !recent('space',5) && !offers(world).some(r=>r.relationshipId===relation.id && (r.spaceUntilMonth??0)>month(world)) && draw(world,'outcomes',1,100)<=8) { offerRomance(world,target.id,'space'); return; }
    if (!recent('story',2) && draw(world,'outcomes',1,100)<=10) {
      const pool=romanceDramaStories.filter(s=>s.group==='partner' && romanceStoryEligible(world,target.id,s) && (!s.context || s.context==='married' && relation.romance==='married' || s.context==='conflict' && conflict) && !offers(world).some(r=>r.actorId===actor.id && r.personId===target.id && r.templateId===s.id));
      if (pool.length) offerRomance(world,target.id,'story',pool[draw(world,'events',0,pool.length-1)]); return;
    }
  } else {
    const exes=world.relationships.filter(r=>r.romance==='ex' && (r.from===actor.id || r.to===actor.id)).slice(0,12);
    for (const relation of exes) { const ex=otherPerson(world,relation); if (!adult(world,ex) || !compatible(world,actor,ex) || relation.memories.some(m=>m.startsWith('romance-no-contact:')) || offers(world).some(r=>r.actorId===actor.id && r.personId===ex.id && world.date.year-r.offered.year<5)) continue;
      if (draw(world,'outcomes',1,100)>4) continue;
      const pool=romanceDramaStories.filter(s=>s.group==='ex' && romanceStoryEligible(world,ex.id,s) && !offers(world).some(r=>r.actorId===actor.id && r.personId===ex.id && r.templateId===s.id));
      if (pool.length) offerRomance(world,ex.id,'ex',pool[draw(world,'events',0,pool.length-1)]); break;
    }
  }
}
