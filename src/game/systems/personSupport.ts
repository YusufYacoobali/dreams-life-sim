import type { World } from '../model';
import { ageOn, compareDates, fullName } from '../personHelpers';
import { monthFrom } from '../calendar';
import { countries } from '../countries';
import { rules } from '../rules';
import { formatMoney } from '../money';
import { fxMoney, protectSeparateProperty } from '../valuation';
import { IneligibleAction } from '../errors';
import { accountFor, active, availableCash, bounded, draw, fact, post, result } from './common';
import { relationFor, activeRomance } from './relationshipQueries';
import { settleBackground } from './npcBudget';
import { isConfined } from './legalSchemas';
import { supportAttemptKey, supportChanceV1, type PersonSupportCommand, type PersonSupportRequest } from './personSupportSchemas';
export { personSupportCommandSchema, type PersonSupportCommand } from './personSupportSchemas';

type SupportKind = 'money'|'loan';
const max0 = (value:bigint) => value>0n?value:0n;
export function supportRelationshipEligible(world:World,personId:string) {
  const player=active(world),target=world.people[personId],relation=target&&relationFor(world,player.id,target.id);
  if (!target||target.died||player.died||!relation||target.id===player.id||ageOn(target,world.date)<rules[target.country].adultAge) return false;
  const parent=relation.to===player.id&&relation.roles.some(role=>role==='parent'||role==='guardian');
  return ageOn(player,world.date)>=(parent?6:rules[player.country].adultAge)&&(parent||relation.from===player.id&&relation.roles.includes('parent')||relation.roles.some(role=>role==='sibling'||role==='friend')||activeRomance(relation));
}
export function supportGenerosity(traits:readonly string[]) {
  return (traits.includes('kind')?18:0)+(traits.includes('impulsive')?6:0)-(traits.includes('practical')?8:0)-(traits.includes('reserved')?6:0);
}
export function supportRequestReason(world:World,personId:string,kind:SupportKind,amount?:bigint):string|undefined {
  const player=active(world),target=world.people[personId],relation=target&&relationFor(world,player.id,target.id);
  if (!target||target.died||player.died||!relation||target.id===player.id) return 'Choose a living person you know';
  const parent=relation.to===player.id&&relation.roles.some(role=>role==='parent'||role==='guardian');
  const child=relation.from===player.id&&relation.roles.includes('parent');
  if (!parent&&!child&&!relation.roles.some(role=>role==='sibling'||role==='friend')&&!activeRomance(relation)) return 'Ask family, a partner or a friend';
  const age=ageOn(player,world.date),theirAge=ageOn(target,world.date);
  if (theirAge<rules[target.country].adultAge) return 'They must be an adult with their own money';
  if (age<(parent?6:rules[player.country].adultAge)) return parent?'Available from age six':'Available when you are an adult';
  if (kind==='loan'&&(age<rules[player.country].adultAge||isConfined(world,player))) return 'Personal loans are available to adults outside custody';
  if (world.actionCounts[supportAttemptKey(player.id,target.id,world.date.year)]) return 'You already asked them for support this year';
  if (world.personSupportRequests.some(row=>row.actorId===player.id&&row.targetId===target.id&&row.status==='offered'&&compareDates(world.date,row.expires)<=0)) return 'Review their existing loan offer first';
  if (kind==='loan'&&world.liabilities.some(row=>row.ownerId===player.id&&row.creditorId===target.id&&row.principal>0n)) return 'Repay what you owe them before asking for another loan';
  if (amount!==undefined&&amount<=0n) return 'Choose a positive amount';
}
export function supportAmountOptions(world:World,personId:string,kind:SupportKind) {
  if (!supportRelationshipEligible(world,personId)||kind==='loan'&&ageOn(active(world),world.date)<rules[active(world).country].adultAge) return [];
  const target=world.people[personId]??active(world),currency=countries[target.country].currency;
  return ([['small','Small',5000n],['medium','Medium',1000n],['large','Large',200n]] as const).map(([id,title,denominator])=>{
    const amount=rules[target.country].baseWage/denominator||1n;
    return {id,label:title+' · '+formatMoney({minor:amount,currency}),amount,currency,disabledReason:supportRequestReason(world,personId,kind,amount)};
  });
}
export function pendingPersonLoanOffers(world:World,personId:string) {
  return world.personSupportRequests.filter(row=>row.actorId===world.activePersonId&&row.targetId===personId&&row.status==='offered');
}
export function loanOfferReason(world:World,requestId:string):string|undefined {
  const row=world.personSupportRequests.find(item=>item.id===requestId),player=active(world);
  if (!row||row.actorId!==player.id||row.status!=='offered') return 'This loan offer is no longer open';
  const lender=world.people[row.targetId];
  if (player.died||!lender||lender.died||compareDates(world.date,row.expires)>0) return 'This loan offer has expired';
  if (ageOn(player,world.date)<rules[player.country].adultAge||isConfined(world,player)) return 'Personal loans are available to adults outside custody';
  if (world.liabilities.some(debt=>debt.ownerId===player.id&&debt.creditorId===lender.id&&debt.principal>0n)) return 'Repay your existing debt to them first';
  const account=world.accounts.find(item=>item.ownerId===lender.id&&item.currency===row.currency);
  if (!account||availableCash(account)<row.offered) return 'They no longer have enough available cash for this offer';
}
export function refreshPersonSupportOffers(world:World) {
  for (const row of world.personSupportRequests) if (row.status==='offered'&&(world.people[row.actorId].died||world.people[row.targetId].died||compareDates(world.date,row.expires)>0)) {
    row.status='expired';row.resolved={...world.date};
  }
}
function ensureReceiver(world:World,row:PersonSupportRequest) {
  if (!world.accounts.some(account=>account.ownerId===row.actorId&&account.currency===row.currency)) world.accounts.push({id:'account_'+row.actorId+'_'+row.currency,ownerId:row.actorId,currency:row.currency,cash:0n,openingCash:0n,lockedCash:0n});
}
function fund(world:World,row:PersonSupportRequest,loan:boolean) {
  const player=world.people[row.actorId],target=world.people[row.targetId];ensureReceiver(world,row);
  if (loan) {
    const id='debt_person_loan_'+row.id;
    world.liabilities.push({id,ownerId:player.id,creditorId:target.id,currency:row.currency,kind:'personal',principal:row.offered,interestBps:0,assetId:null,monthlyPayment:0n,remainingMonths:0,missedPayments:0});row.liabilityId=id;
  }
  const category=loan?'person-loan':'person-support-gift';
  post(world,-row.offered,0n,category,(loan?'Loan to ':'Gift to ')+fullName(player),null,target,row.currency);row.debitId=world.ledger.at(-1)!.id;
  post(world,row.offered,loan?row.offered:0n,category,(loan?'Loan from ':'Gift from ')+fullName(target),row.liabilityId,player,row.currency);row.creditId=world.ledger.at(-1)!.id;
  if (!loan) protectSeparateProperty(world,player.id,{minor:row.offered,currency:row.currency},target.id);
}
export function resolvePersonSupport(world:World,command:PersonSupportCommand) {
  const player=active(world);
  if(command.lifeId!==world.id||command.actorId!==player.id)throw new IneligibleAction('This life changed. Review the request again.');
  if (command.type==='respond-person-loan') {
    const row=world.personSupportRequests.find(item=>item.id===command.requestId);
    if (!row||row.actorId!==player.id||row.status!=='offered') throw new IneligibleAction('This loan offer is no longer open');
    if (!command.accept) { row.status='declined';row.resolved={...world.date};result(world,'No strings attached','You declined the loan. Your wallet remains dramatically unchanged.','loan');return; }
    const lender=world.people[row.targetId];if (lender&&!lender.died) settleBackground(world,lender,world.date.year*12+world.date.month-1);
    const reason=loanOfferReason(world,row.id);if(reason)throw new IneligibleAction(reason);
    fund(world,row,true);row.status='accepted';row.resolved={...world.date};
    fact(world,'I borrowed '+formatMoney({minor:row.offered,currency:row.currency})+' from '+fullName(lender)+'.','relationships');
    result(world,'A loan between people',lender.firstName+' lent you '+formatMoney({minor:row.offered,currency:row.currency})+'. Interest-free. Repay them through Finances when you can.','loan');return;
  }
  const reason=supportRequestReason(world,command.personId,command.kind,command.amount);if(reason)throw new IneligibleAction(reason);
  const target=world.people[command.personId],relation=relationFor(world,player.id,target.id)!;
  if(command.currency!==countries[target.country].currency)throw new IneligibleAction('Their currency changed. Review the amount again.');
  settleBackground(world,target,world.date.year*12+world.date.month-1);
  const source=accountFor(world,target),available=max0(availableCash(source));
  const owed=world.liabilities.filter(debt=>debt.ownerId===player.id&&debt.creditorId===target.id).reduce((sum,debt)=>sum+fxMoney(world,{minor:debt.principal,currency:debt.currency},source.currency).minor,0n);
  const row:PersonSupportRequest={id:'person_support_'+world.revision,ruleVersion:1,actorId:player.id,targetId:target.id,relationshipId:relation.id,kind:command.kind,requested:command.amount,offered:0n,currency:source.currency,proposed:{...world.date},expires:monthFrom(world.date,12,world.date.day),strength:relation.strength,trust:relation.trust,actorAge:ageOn(player,world.date),targetAge:ageOn(target,world.date),generosity:supportGenerosity(target.traits),parent:relation.to===player.id&&relation.roles.some(role=>role==='parent'||role==='guardian'),available,owed,chance:5,roll:draw(world,'outcomes',1,100),outcome:'refused',status:'completed',interestBps:0,resolved:{...world.date},liabilityId:null,debitId:null,creditId:null};
  row.chance=supportChanceV1(row);world.personSupportRequests.push(row);world.actionCounts[supportAttemptKey(player.id,target.id,world.date.year)]=1;relation.lastInteractionYear=world.date.year;
  if (!available||row.roll>row.chance) {
    const annoyed=owed>0n||relation.strength<35||row.roll>=96;
    const before=relation.strength;
    row.outcome=annoyed?'annoyed':'refused';if(annoyed){relation.strength=bounded(relation.strength-5);relation.trust=bounded(relation.trust-2);}
    fact(world,'I asked '+fullName(target)+' for money. They said no.','relationships');
    result(world,annoyed?'The Bank of '+target.firstName+' is closed':'Not this time',annoyed?target.firstName+' did not appreciate the request. The silence was free.':target.firstName+' declined. No money changed hands.','money',annoyed?[{id:'bond',label:'Relationship',value:(relation.strength-before)+'%',tone:relation.strength<before?'negative':'neutral'}]:[]);return;
  }
  const capacity=available/(command.kind==='loan'?2n:row.generosity>0?4n:8n);
  row.offered=command.amount<(capacity||1n)?command.amount:(capacity||1n);
  const loan=command.kind==='loan'||row.actorAge>=rules[player.country].adultAge&&owed===0n&&row.roll%3===0;
  if (loan) { row.outcome='loan-offered';row.status='offered';row.resolved=null;result(world,'An offer with a small catch',target.firstName+' offered to lend you '+formatMoney({minor:row.offered,currency:row.currency})+', interest-free. Review it on their profile. Nothing is borrowed until you accept.','loan');return; }
  row.outcome=row.offered<row.requested?'partial':'gift';fund(world,row,false);relation.strength=bounded(relation.strength+2);player.stats.happiness=bounded(player.stats.happiness+2);
  fact(world,fullName(target)+' gave me '+formatMoney({minor:row.offered,currency:row.currency})+'.','relationships');
  result(world,row.outcome==='partial'?'A little help':'They came through',target.firstName+' gave you '+formatMoney({minor:row.offered,currency:row.currency})+(row.outcome==='partial'?'. Less than you asked for. Still more than zero.':'. No repayment required.'),'gift');
}
