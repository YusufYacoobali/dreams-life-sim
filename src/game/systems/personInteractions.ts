import type { Person, Stats, World } from '../model';
import { ageOn, fullName } from '../personHelpers';
import { rules } from '../rules';
import { formatMoney, roundRatio } from '../money';
import { IneligibleAction } from '../errors';
import { assetCatalog } from '../content/assets';
import { protectSeparateProperty } from '../valuation';
import type { RuntimeEffectRow } from '../runtime';
import { accountFor, active, availableCash, bounded, draw, fact, post, result } from './common';
import { relationFor, activeRomance } from './relationshipQueries';
import { samePhysicalPlace } from './travelSchemas';
import { serviceAway } from './serviceSchemas';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { settleBackground } from './npcBudget';
import { supportGenerosity } from './personSupport';
import { personActionKey, type PersonAction, type PersonActionCommand } from './personActionSchemas';
import { personActionBody, personReference } from '../content/personInteractionWriting';
import { relationLabel } from './relationships';
export { personActionIds, personActionCommandSchema, type PersonAction, type PersonActionCommand } from './personActionSchemas';
const titles:Record<PersonAction,string>={insult:'Insult',distance:'Distance Yourself','ask-advice':'Ask for Advice','ask-permission':'Ask for Permission','ask-activity':'Ask to Go Out Together','request-gift':'Ask for a Gift',praise:'Praise Your Child',scold:'Scold Your Child','ask-help':'Ask Your Child for Help'};
function roles(world:World,personId:string) {
  const actor=active(world),target=world.people[personId],relation=target&&relationFor(world,actor.id,target.id);
  return {actor,target,relation,parent:!!relation&&relation.to===actor.id&&relation.roles.some(role=>role==='parent'||role==='guardian'),child:!!relation&&relation.from===actor.id&&relation.roles.includes('parent')};
}
function offeredActions(world:World,personId:string):PersonAction[] {
  const {actor,target,relation,parent,child}=roles(world,personId);if(!target||target.died||actor.died||!relation)return [];
  const age=ageOn(actor,world.date),theirAge=ageOn(target,world.date),actions:PersonAction[]=[];
  if(age>=8)actions.push('insult');if(age>=12)actions.push('distance');
  if(parent&&age>=6&&theirAge>=rules[target.country].adultAge){actions.push('ask-advice');if(age<rules[actor.country].adultAge)actions.push('ask-permission','ask-activity');}
  if(child&&theirAge>=3&&theirAge<rules[target.country].adultAge)actions.push('praise','scold');
  if(child&&theirAge>=rules[target.country].adultAge&&age>=rules[actor.country].adultAge)actions.push('ask-help');
  if(activeRomance(relation)&&age>=rules[actor.country].adultAge&&theirAge>=rules[target.country].adultAge)actions.push('request-gift');
  return actions;
}
function permission(world:World,personId:string) { return world.personActionHistory.find(row=>row.actorId===world.activePersonId&&row.targetId===personId&&row.action==='ask-permission'&&row.outcome==='approved'&&row.date.year===world.date.year); }
export function personActionReason(world:World,personId:string,action:PersonAction):string|undefined {
  const {actor,target}=roles(world,personId);if(!offeredActions(world,personId).includes(action))return 'This action is not available with this person';
  if(world.actionCounts[personActionKey(actor.id,personId,action,world.date.year)])return 'Already tried this year';
  if(['ask-activity','ask-help','praise','scold','request-gift'].includes(action)) {
    if(!samePhysicalPlace(world,actor.id,personId)||serviceAway(world,actor.id)||serviceAway(world,personId)||isConfined(world,actor)||isConfined(world,target)||hospitalized(world,actor)||hospitalized(world,target))return 'Be together and available for this activity';
  }
  if(action==='ask-activity'&&!permission(world,personId))return 'Ask their permission for an outing first';
  if(action==='ask-activity'&&(actor.stats.energy<4||target.stats.energy<4))return 'You both need four energy for an outing';
  if(action==='ask-help'&&ageOn(actor,world.date)<50&&actor.stats.health>60&&actor.stats.stress<40)return 'Ask when you are older or need help with health or stress';
  if(action==='ask-help'&&target.stats.energy<4)return 'They need to rest before helping';
  if(action==='request-gift'&&(isConfined(world,actor)||isConfined(world,target)))return 'Arrange gifts outside custody';
}
export const personActionOptions = (world:World,personId:string) => offeredActions(world,personId).map(id=>({id,label:titles[id],
  subtitle:id==='ask-activity'?'Free local outing · Four energy each':id==='request-gift'?'They may buy you a watch · Ongoing upkeep applies':id==='ask-help'?'Help with chores · Uses four of their energy':undefined,
  disabledReason:personActionReason(world,personId,id)}));
function stats(person:Person,changes:Partial<Stats>):RuntimeEffectRow[] {
  return Object.entries(changes).map(([key,change])=>{const stat=key as keyof Stats,before=person.stats[stat];person.stats[stat]=bounded(before+change!);const delta=person.stats[stat]-before;return {id:stat,label:stat[0].toUpperCase()+stat.slice(1),value:(delta>=0?'+':'')+delta+'%',tone:(stat==='stress'?-delta:delta)>0?'positive':(stat==='stress'?-delta:delta)<0?'negative':'neutral'};});
}
export function resolvePersonAction(world:World,command:PersonActionCommand) {
  if(command.lifeId!==world.id||command.actorId!==world.activePersonId)throw new IneligibleAction('This life changed. Review the action again.');
  const reason=personActionReason(world,command.personId,command.action);if(reason)throw new IneligibleAction(reason);
  const actor=active(world),target=world.people[command.personId],relation=relationFor(world,actor.id,target.id)!,action=command.action;
  const roll=draw(world,'outcomes',1,100),chance=Math.max(10,Math.min(95,Math.round(20+relation.strength*.5+relation.trust*.25+supportGenerosity(target.traits))));
  const row:World['personActionHistory'][number]={id:'person_action_'+world.revision,actorId:actor.id,targetId:target.id,relationshipId:relation.id,action,date:{...world.date},outcome:'completed',chance,roll,assetId:null,transactionId:null,permissionId:null};
  const reference=personReference(target.firstName,relationLabel(world,relation));
  let giftDetails:{name:string;price:string}|undefined;
  let delta=0;const effects:RuntimeEffectRow[]=[];
  if(action==='insult') {delta=-10;relation.trust=bounded(relation.trust-6);relation.memories.push('argument:'+world.date.year);stats(target,{happiness:-3});}
  else if(action==='distance'){delta=-15;relation.trust=bounded(relation.trust-4);effects.push(...stats(actor,{stress:-4}));}
  else if(action==='praise'){delta=4;stats(target,{happiness:3,discipline:1});}
  else if(action==='scold'){delta=-3;stats(target,{discipline:3,happiness:-2});}
  else if(action==='ask-permission') {
    row.outcome=roll<=chance?'approved':'declined';delta=row.outcome==='approved'?1:0;
  } else if(action==='ask-activity') {
    row.permissionId=permission(world,target.id)!.id;delta=5;relation.trust=bounded(relation.trust+2);stats(target,{energy:-4,happiness:2});effects.push(...stats(actor,{energy:-4,happiness:5,stress:-3}));
  } else if(action==='ask-advice') {
    row.outcome=roll<=chance?'approved':'declined';if(row.outcome==='approved'){delta=3;effects.push(...stats(actor,{smarts:target.stats.smarts>=50?2:1,stress:-3}));}
  } else if(action==='ask-help') {
    row.outcome=roll<=chance?'approved':'declined';if(row.outcome==='approved'){delta=3;stats(target,{energy:-4});effects.push(...stats(actor,{energy:5,stress:-8,health:2}));}
  } else {
    settleBackground(world,target,world.date.year*12+world.date.month-1);
    const offer=assetCatalog.find(item=>item.id==='watch')!,price=roundRatio(rules[target.country].baseWage*BigInt(offer.priceBps),10000n),account=accountFor(world,target);
    row.outcome=roll<=chance&&availableCash(account)>=price?'approved':'declined';
    if(row.outcome==='approved') {
      const id='asset_present_'+world.revision;post(world,-price,0n,'person-present','Gift for '+fullName(actor),null,target,account.currency);row.transactionId=world.ledger.at(-1)!.id;row.assetId=id;
      world.assets.push({id,ownerId:actor.id,catalogId:offer.id,kind:offer.kind,name:offer.name,country:target.country,city:target.city,currency:account.currency,pricePaid:price,costBasis:price,value:price,condition:offer.condition,ageMonths:0,acquired:{...world.date},mortgageId:null,primaryHome:false,rental:'none',rentPerMonth:0n,upkeepBps:offer.upkeepBps,insured:false,listing:null,provenance:['Gift from '+fullName(target)+' to '+fullName(actor)+' in '+world.date.year],ownershipSource:'gift',titleSince:{...world.date}});
      if(!world.accounts.some(item=>item.ownerId===actor.id&&item.currency===account.currency))world.accounts.push({id:'account_'+actor.id+'_'+account.currency,ownerId:actor.id,currency:account.currency,cash:0n,openingCash:0n,lockedCash:0n});
      protectSeparateProperty(world,actor.id,{minor:price,currency:account.currency},target.id);delta=3;effects.push(...stats(actor,{happiness:4}));giftDetails={name:offer.name,price:formatMoney({minor:price,currency:account.currency})};
    }
  }
  world.personActionHistory.push(row);world.actionCounts[personActionKey(actor.id,target.id,action,world.date.year)]=1;relation.lastInteractionYear=world.date.year;relation.memories.push(action+':'+world.date.year);
  const before=relation.strength;relation.strength=bounded(before+delta);const actual=relation.strength-before;
  if(actual)effects.unshift({id:'bond',label:'Relationship',value:(actual>=0?'+':'')+actual+'%',tone:actual>0?'positive':'negative'});
  fact(world,'I '+({insult:'insulted',distance:'distanced myself from','ask-advice':'asked for advice from','ask-permission':'asked permission from','ask-activity':'went out with','request-gift':'asked for a gift from',praise:'praised',scold:'scolded','ask-help':'asked for help from'}[action])+' '+fullName(target)+'.','relationships');
  result(world,titles[action],personActionBody(action,reference,row.outcome==='approved',giftDetails),'person-action:'+action,effects);
}
